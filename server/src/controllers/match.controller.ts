import { Request, Response } from 'express';
import { Match } from '../models/Match';
import { MatchEvent } from '../models/MatchEvent';
import { ScoringService } from '../services/scoring.service';
import { SchedulingService } from '../services/scheduling.service';
import { AuditService } from '../services/audit.service';

export class MatchController {
  static async listMatches(req: Request, res: Response): Promise<void> {
    try {
      const { tournamentId, status, venueId, assignedScorerId, teamId, round } = req.query;

      const query: any = {};
      if (tournamentId) query.tournamentId = tournamentId;
      if (status) query.status = status;
      if (venueId) query.venueId = venueId;
      if (assignedScorerId) query.assignedScorerId = assignedScorerId;
      if (round) query.round = parseInt(round as string, 10);
      if (teamId) {
        query.$or = [{ homeTeamId: teamId }, { awayTeamId: teamId }];
      }

      // If user is a Scorer and querying without filters, default to assigned matches
      if (req.user && req.user.role === 'SCORER' && !assignedScorerId && !tournamentId) {
        query.assignedScorerId = req.user._id;
      }

      const matches = await Match.find(query)
        .populate('tournamentId', 'name format sportId')
        .populate('homeTeamId', 'name code logoUrl')
        .populate('awayTeamId', 'name code logoUrl')
        .populate('winnerTeamId', 'name code')
        .populate('venueId', 'name location')
        .populate('assignedScorerId', 'name email')
        .sort({ round: 1, matchNumber: 1, scheduledStartTime: 1 });

      res.status(200).json({ success: true, data: { matches } });
    } catch (err) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list matches' } });
    }
  }

  static async getMatch(req: Request, res: Response): Promise<void> {
    try {
      const match = await Match.findById(req.params.id)
        .populate('tournamentId')
        .populate('homeTeamId')
        .populate('awayTeamId')
        .populate('winnerTeamId')
        .populate('venueId')
        .populate('assignedScorerId', 'name email');

      if (!match) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Match not found' } });
        return;
      }

      const events = await MatchEvent.find({ matchId: match._id })
        .populate('teamId', 'name code')
        .populate('playerId', 'firstName lastName jerseyNumber position')
        .populate('scorerUserId', 'name')
        .sort({ sequenceNumber: 1 });

      res.status(200).json({ success: true, data: { match, events } });
    } catch (err) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch match' } });
    }
  }

  static async scheduleMatch(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { venueId, slotStart, slotEnd, notes } = req.body;

      const match = await Match.findById(id);
      if (!match) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Match not found' } });
        return;
      }

      const booking = await SchedulingService.bookVenueSlot({
        venueId,
        slotStart: new Date(slotStart),
        slotEnd: new Date(slotEnd),
        matchId: match._id,
        tournamentId: match.tournamentId,
        bookedBy: req.user!._id,
        notes,
      });

      await AuditService.record({
        userId: req.user!._id,
        action: 'MATCH_SCHEDULED',
        resourceType: 'Match',
        resourceId: match._id.toString(),
        details: { venueId, slotStart, slotEnd },
        ipAddress: req.ip,
      });

      res.status(200).json({ success: true, data: { match, booking } });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'SCHEDULING_FAILED', message: err.message } });
    }
  }

  static async rescheduleMatch(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { venueId, slotStart, slotEnd } = req.body;

      const booking = await SchedulingService.rescheduleMatchVenue(
        id,
        venueId,
        new Date(slotStart),
        new Date(slotEnd),
        req.user!._id
      );

      const match = await Match.findById(id);

      await AuditService.record({
        userId: req.user!._id,
        action: 'MATCH_RESCHEDULED',
        resourceType: 'Match',
        resourceId: id,
        details: { newVenueId: venueId, slotStart, slotEnd },
        ipAddress: req.ip,
      });

      res.status(200).json({ success: true, data: { match, booking } });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'RESCHEDULING_FAILED', message: err.message } });
    }
  }

  static async assignScorer(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { scorerId } = req.body;

      const match = await Match.findById(id);
      if (!match) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Match not found' } });
        return;
      }

      match.assignedScorerId = scorerId;
      await match.save();

      await AuditService.record({
        userId: req.user!._id,
        action: 'SCORER_ASSIGNED',
        resourceType: 'Match',
        resourceId: match._id.toString(),
        details: { scorerId },
        ipAddress: req.ip,
      });

      res.status(200).json({ success: true, data: { match } });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: err.message } });
    }
  }

  static async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const match = await ScoringService.updateMatchStatus(id, status, req.user!);
      res.status(200).json({ success: true, data: { match } });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'STATUS_UPDATE_FAILED', message: err.message } });
    }
  }

  static async recordScore(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { type, teamId, playerId, points, setNumber, minute, idempotencyKey, metadata } = req.body;

      const result = await ScoringService.recordScoreEvent(
        {
          matchId: id,
          scorerUserId: req.user!._id,
          type,
          teamId,
          playerId,
          points: points !== undefined ? points : 1,
          setNumber,
          minute,
          idempotencyKey,
          metadata,
        },
        req.user!
      );

      res.status(201).json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'SCORING_FAILED', message: err.message } });
    }
  }

  static async reverseEvent(req: Request, res: Response): Promise<void> {
    try {
      const { id, eventId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Reversal reason is required' } });
        return;
      }

      const result = await ScoringService.reverseEvent(id, eventId, reason, req.user!);
      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'REVERSAL_FAILED', message: err.message } });
    }
  }
}
