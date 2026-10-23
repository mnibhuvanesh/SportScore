import { Types } from 'mongoose';
import { Match, IMatch, MatchStatus } from '../models/Match';
import { MatchEvent, IMatchEvent, MatchEventType } from '../models/MatchEvent';
import { IUser } from '../models/User';
import { FixtureService } from './fixture.service';
import { broadcastMatchUpdate } from '../sockets/socket.server';
import { AuditService } from './audit.service';

export interface ScoreEventInput {
  matchId: string | Types.ObjectId;
  scorerUserId: string | Types.ObjectId;
  type: MatchEventType;
  teamId?: string | Types.ObjectId | null;
  playerId?: string | Types.ObjectId | null;
  points: number;
  setNumber?: number | null;
  minute?: number | null;
  idempotencyKey?: string | null;
  metadata?: Record<string, any>;
}

export class ScoringService {
  /**
   * Asserts whether a given user is authorized to enter scores for this match.
   */
  static async assertScorerAuthorized(match: IMatch, user: IUser): Promise<void> {
    if (user.role === 'ADMIN' || user.role === 'ORGANIZER') {
      return; // Admins and Organizers have platform authority
    }

    if (user.role === 'SCORER') {
      if (match.assignedScorerId && match.assignedScorerId.toString() === user._id.toString()) {
        return; // Assigned scorer has authority
      }
      throw new Error('Forbidden: You are not assigned to score this match');
    }

    throw new Error('Forbidden: Only assigned Scorers, Organizers, or Admins can score matches');
  }

  /**
   * Records an append-only scoring event with idempotency, sequence numbers, and real-time broadcast.
   */
  static async recordScoreEvent(input: ScoreEventInput, user: IUser): Promise<{ event: IMatchEvent; match: IMatch }> {
    const match = await Match.findById(input.matchId);
    if (!match) throw new Error('Match not found');

    await this.assertScorerAuthorized(match, user);

    if (match.status !== 'LIVE' && match.status !== 'PAUSED') {
      throw new Error(`Cannot record score: Match status is currently ${match.status}. Must be LIVE or PAUSED.`);
    }

    // 1. Check idempotency key to prevent accidental duplicate clicks / network retries
    if (input.idempotencyKey) {
      const existing = await MatchEvent.findOne({
        matchId: match._id,
        idempotencyKey: input.idempotencyKey,
      });
      if (existing) {
        return { event: existing, match };
      }
    }

    // 2. Determine monotonically increasing sequence number
    const lastEvent = await MatchEvent.findOne({ matchId: match._id }).sort({ sequenceNumber: -1 });
    const sequenceNumber = lastEvent ? lastEvent.sequenceNumber + 1 : 1;

    // 3. Persist the append-only event
    const event = await MatchEvent.create({
      matchId: match._id,
      sequenceNumber,
      type: input.type,
      teamId: input.teamId ? new Types.ObjectId(input.teamId.toString()) : null,
      playerId: input.playerId ? new Types.ObjectId(input.playerId.toString()) : null,
      points: input.points,
      setNumber: input.setNumber || null,
      minute: input.minute || null,
      scorerUserId: user._id,
      idempotencyKey: input.idempotencyKey || null,
      metadata: input.metadata || {},
    });

    // 4. Update match scores safely
    if (input.teamId) {
      const teamIdStr = input.teamId.toString();
      if (match.homeTeamId && match.homeTeamId.toString() === teamIdStr) {
        match.homeScore += input.points;
      } else if (match.awayTeamId && match.awayTeamId.toString() === teamIdStr) {
        match.awayScore += input.points;
      }
    }

    // Handle set scores if applicable
    if (input.type === 'SET_SCORE' && input.setNumber) {
      let set = match.sets.find((s) => s.setNumber === input.setNumber);
      if (!set) {
        set = { setNumber: input.setNumber, homeScore: 0, awayScore: 0 };
        match.sets.push(set);
      }
      if (input.teamId && match.homeTeamId && match.homeTeamId.toString() === input.teamId.toString()) {
        set.homeScore += input.points;
      } else if (input.teamId && match.awayTeamId && match.awayTeamId.toString() === input.teamId.toString()) {
        set.awayScore += input.points;
      }
    }

    match.version += 1;
    await match.save();

    // 5. Audit log
    await AuditService.record({
      userId: user._id,
      action: 'SCORE_EVENT_RECORDED',
      resourceType: 'Match',
      resourceId: match._id.toString(),
      details: { eventType: input.type, points: input.points, teamId: input.teamId },
    });

    // 6. Real-time broadcast
    broadcastMatchUpdate(match._id.toString(), 'match:score', {
      matchId: match._id.toString(),
      tournamentId: match.tournamentId.toString(),
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      sets: match.sets,
      event,
      version: match.version,
    });

    return { event, match };
  }

  /**
   * Safe match state transitions with append-only lifecycle event recording and bracket winner advancement.
   */
  static async updateMatchStatus(
    matchId: string | Types.ObjectId,
    newStatus: MatchStatus,
    user: IUser
  ): Promise<IMatch> {
    const match = await Match.findById(matchId);
    if (!match) throw new Error('Match not found');

    await this.assertScorerAuthorized(match, user);

    const prevStatus = match.status;
    const now = new Date();

    // Validate lifecycle transitions
    const validTransitions: Record<MatchStatus, MatchStatus[]> = {
      SCHEDULED: ['LIVE', 'POSTPONED', 'CANCELLED'],
      LIVE: ['PAUSED', 'COMPLETED', 'ABANDONED'],
      PAUSED: ['LIVE', 'COMPLETED', 'ABANDONED'],
      COMPLETED: ['LIVE'], // allows correction back to LIVE by authorized scorer
      POSTPONED: ['SCHEDULED', 'CANCELLED'],
      ABANDONED: ['SCHEDULED', 'COMPLETED', 'CANCELLED'],
      CANCELLED: ['SCHEDULED'],
    };

    if (!validTransitions[prevStatus]?.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${prevStatus} to ${newStatus}`);
    }

    match.status = newStatus;

    if (newStatus === 'LIVE' && !match.actualStartTime) {
      match.actualStartTime = now;
    }

    if (newStatus === 'COMPLETED') {
      match.actualEndTime = now;

      // Determine winner or draw
      if (match.homeScore > match.awayScore) {
        match.winnerTeamId = match.homeTeamId;
        match.isDraw = false;
      } else if (match.awayScore > match.homeScore) {
        match.winnerTeamId = match.awayTeamId;
        match.isDraw = false;
      } else {
        match.winnerTeamId = null;
        match.isDraw = true;
      }

      // Propagate winner to next match in bracket if knockout tournament
      if (match.stage === 'KNOCKOUT') {
        await FixtureService.handleMatchCompletionProgression(match._id, match.winnerTeamId || null);
      }
    }

    match.version += 1;
    await match.save();

    // Record status transition event in append-only history
    const lastEvent = await MatchEvent.findOne({ matchId: match._id }).sort({ sequenceNumber: -1 });
    const sequenceNumber = lastEvent ? lastEvent.sequenceNumber + 1 : 1;

    let eventType: MatchEventType = 'MATCH_STARTED';
    if (newStatus === 'PAUSED') eventType = 'MATCH_PAUSED';
    else if (newStatus === 'LIVE' && prevStatus === 'PAUSED') eventType = 'MATCH_RESUMED';
    else if (newStatus === 'COMPLETED') eventType = 'MATCH_COMPLETED';
    else if (newStatus === 'POSTPONED') eventType = 'MATCH_POSTPONED';
    else if (newStatus === 'ABANDONED') eventType = 'MATCH_ABANDONED';

    await MatchEvent.create({
      matchId: match._id,
      sequenceNumber,
      type: eventType,
      scorerUserId: user._id,
      points: 0,
      metadata: { fromStatus: prevStatus, toStatus: newStatus },
    });

    await AuditService.record({
      userId: user._id,
      action: 'MATCH_STATUS_UPDATED',
      resourceType: 'Match',
      resourceId: match._id.toString(),
      details: { fromStatus: prevStatus, toStatus: newStatus },
    });

    broadcastMatchUpdate(match._id.toString(), 'match:status', {
      matchId: match._id.toString(),
      tournamentId: match.tournamentId.toString(),
      status: match.status,
      winnerTeamId: match.winnerTeamId,
      isDraw: match.isDraw,
      version: match.version,
    });

    return match;
  }

  /**
   * Reverses or corrects an event non-destructively, preserving complete audit history and reconstructing accurate scores.
   */
  static async reverseEvent(
    matchId: string | Types.ObjectId,
    eventId: string | Types.ObjectId,
    reason: string,
    user: IUser
  ): Promise<{ match: IMatch; reversalEvent: IMatchEvent }> {
    const match = await Match.findById(matchId);
    if (!match) throw new Error('Match not found');

    await this.assertScorerAuthorized(match, user);

    const targetEvent = await MatchEvent.findById(eventId);
    if (!targetEvent || targetEvent.matchId.toString() !== match._id.toString()) {
      throw new Error('Event not found for this match');
    }

    if (targetEvent.isReversed) {
      throw new Error('Event has already been reversed');
    }

    // 1. Mark target event as reversed
    targetEvent.isReversed = true;
    targetEvent.reversalReason = reason;
    await targetEvent.save();

    // 2. Append new REVERSAL event into the sequence log
    const lastEvent = await MatchEvent.findOne({ matchId: match._id }).sort({ sequenceNumber: -1 });
    const sequenceNumber = lastEvent ? lastEvent.sequenceNumber + 1 : 1;

    const reversalEvent = await MatchEvent.create({
      matchId: match._id,
      sequenceNumber,
      type: 'REVERSAL',
      reversedEventId: targetEvent._id,
      reversalReason: reason,
      scorerUserId: user._id,
      points: -targetEvent.points,
      teamId: targetEvent.teamId,
      metadata: { originalEventType: targetEvent.type },
    });

    // 3. Deterministically reconstruct score from all non-reversed scoring events
    const allEvents = await MatchEvent.find({
      matchId: match._id,
      isReversed: false,
      type: { $in: ['SCORE_GOAL', 'SCORE_POINT', 'SET_SCORE'] },
    });

    let homeScore = 0;
    let awayScore = 0;

    for (const ev of allEvents) {
      if (ev.teamId) {
        if (match.homeTeamId && ev.teamId.toString() === match.homeTeamId.toString()) {
          homeScore += ev.points;
        } else if (match.awayTeamId && ev.teamId.toString() === match.awayTeamId.toString()) {
          awayScore += ev.points;
        }
      }
    }

    match.homeScore = homeScore;
    match.awayScore = awayScore;
    match.version += 1;
    await match.save();

    await AuditService.record({
      userId: user._id,
      action: 'EVENT_REVERSED',
      resourceType: 'Match',
      resourceId: match._id.toString(),
      details: { eventId, reason },
    });

    broadcastMatchUpdate(match._id.toString(), 'match:score', {
      matchId: match._id.toString(),
      tournamentId: match.tournamentId.toString(),
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      reversalEvent,
      version: match.version,
    });

    return { match, reversalEvent };
  }
}
