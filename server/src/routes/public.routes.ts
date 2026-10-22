import { Router, Request, Response } from 'express';
import QRCode from 'qrcode';
import { Tournament } from '../models/Tournament';
import { Match } from '../models/Match';
import { MatchEvent } from '../models/MatchEvent';
import { AnalyticsService } from '../services/analytics.service';
import { env } from '../config/env';

const router = Router();

// Public tournament scoreboard
router.get('/tournaments/:id', async (req: Request, res: Response) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('sportId', 'name code scoringType pointsConfig')
      .populate('winnerTeamId', 'name code logoUrl');

    if (!tournament || !tournament.isPublic) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Tournament not found' } });
      return;
    }

    const publicUrl = `${env.CLIENT_URL}/public/tournaments/${tournament._id}`;
    const qrCode = await QRCode.toDataURL(publicUrl, { width: 200, margin: 1 });

    const matches = await Match.find({ tournamentId: tournament._id })
      .populate('homeTeamId', 'name code logoUrl')
      .populate('awayTeamId', 'name code logoUrl')
      .populate('winnerTeamId', 'name code')
      .populate('venueId', 'name location')
      .sort({ round: 1, matchNumber: 1 });

    const standings = await AnalyticsService.getTournamentStandings(tournament._id);
    const topScorers = await AnalyticsService.getTopScorers(tournament._id, 5);

    res.status(200).json({
      success: true,
      data: {
        tournament,
        qrCode,
        publicUrl,
        matches,
        standings,
        topScorers,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch scoreboard' } });
  }
});

// Public live match details
router.get('/matches/:id', async (req: Request, res: Response) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('tournamentId', 'name format')
      .populate('homeTeamId', 'name code logoUrl')
      .populate('awayTeamId', 'name code logoUrl')
      .populate('winnerTeamId', 'name code logoUrl')
      .populate('venueId', 'name location');

    if (!match) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Match not found' } });
      return;
    }

    // Only public event types (goals, points, set scores, status changes)
    const events = await MatchEvent.find({
      matchId: match._id,
      isReversed: false,
      type: { $in: ['SCORE_GOAL', 'SCORE_POINT', 'SET_SCORE', 'MATCH_STARTED', 'MATCH_PAUSED', 'MATCH_RESUMED', 'MATCH_COMPLETED'] },
    })
      .populate('teamId', 'name code')
      .populate('playerId', 'firstName lastName jerseyNumber position')
      .sort({ sequenceNumber: 1 });

    res.status(200).json({
      success: true,
      data: { match, events },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch match' } });
  }
});

export default router;
