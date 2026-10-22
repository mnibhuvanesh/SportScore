import { Request, Response } from 'express';
import QRCode from 'qrcode';
import { Tournament } from '../models/Tournament';
import { FixtureService } from '../services/fixture.service';
import { AnalyticsService } from '../services/analytics.service';
import { AuditService } from '../services/audit.service';
import { env } from '../config/env';

export class TournamentController {
  static async listTournaments(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 12;
      const sportId = req.query.sportId as string;
      const status = req.query.status as string;
      const search = req.query.search as string;

      const query: any = {};
      if (sportId) query.sportId = sportId;
      if (status) query.status = status;
      if (search) query.name = { $regex: search, $options: 'i' };

      // Non-admin/organizers only see public or non-draft tournaments
      if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'ORGANIZER')) {
        query.isPublic = true;
        query.status = { $ne: 'DRAFT' };
      } else if (req.user.role === 'ORGANIZER') {
        // Organizers can see all their own tournaments + public ones
        query.$or = [{ organizerId: req.user._id }, { isPublic: true }];
      }

      const total = await Tournament.countDocuments(query);
      const tournaments = await Tournament.find(query)
        .populate('sportId', 'name code scoringType')
        .populate('organizerId', 'name email')
        .sort({ startDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      res.status(200).json({
        success: true,
        data: {
          tournaments,
          pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list tournaments' } });
    }
  }

  static async getTournament(req: Request, res: Response): Promise<void> {
    try {
      const tournament = await Tournament.findById(req.params.id)
        .populate('sportId')
        .populate('organizerId', 'name email')
        .populate('winnerTeamId', 'name code logoUrl');

      if (!tournament) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Tournament not found' } });
        return;
      }

      // Generate QR Code URL pointing to public scoreboard
      const publicUrl = `${env.CLIENT_URL}/public/tournaments/${tournament._id}`;
      const qrCodeDataUrl = await QRCode.toDataURL(publicUrl, { margin: 2, width: 250 });

      res.status(200).json({
        success: true,
        data: {
          tournament,
          publicUrl,
          qrCodeDataUrl,
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch tournament' } });
    }
  }

  static async createTournament(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        sportId,
        description,
        format,
        startDate,
        endDate,
        registrationDeadline,
        maxTeams,
        minTeams,
        isPublic,
        rules,
        groupCount,
        qualifiersPerGroup,
      } = req.body;

      const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;

      const tournament = await Tournament.create({
        name,
        slug,
        sportId,
        organizerId: req.user!._id,
        description,
        format,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        registrationDeadline: new Date(registrationDeadline),
        maxTeams: maxTeams || 16,
        minTeams: minTeams || 2,
        isPublic: isPublic !== undefined ? isPublic : true,
        rules,
        groupCount: groupCount || 2,
        qualifiersPerGroup: qualifiersPerGroup || 2,
        status: 'DRAFT',
      });

      await AuditService.record({
        userId: req.user!._id,
        action: 'TOURNAMENT_CREATED',
        resourceType: 'Tournament',
        resourceId: tournament._id.toString(),
        details: { name, format, sportId },
        ipAddress: req.ip,
      });

      res.status(201).json({ success: true, data: { tournament } });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: err.message } });
    }
  }

  static async updateTournament(req: Request, res: Response): Promise<void> {
    try {
      const tournament = await Tournament.findById(req.params.id);
      if (!tournament) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Tournament not found' } });
        return;
      }

      // Enforce organizer ownership
      if (req.user!.role === 'ORGANIZER' && tournament.organizerId.toString() !== req.user!._id.toString()) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You can only update your own tournaments' } });
        return;
      }

      const allowedFields = [
        'name',
        'description',
        'status',
        'startDate',
        'endDate',
        'registrationDeadline',
        'maxTeams',
        'minTeams',
        'isPublic',
        'rules',
        'groupCount',
        'qualifiersPerGroup',
      ];

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          (tournament as any)[field] = req.body[field];
        }
      }

      await tournament.save();

      await AuditService.record({
        userId: req.user!._id,
        action: 'TOURNAMENT_UPDATED',
        resourceType: 'Tournament',
        resourceId: tournament._id.toString(),
        ipAddress: req.ip,
      });

      res.status(200).json({ success: true, data: { tournament } });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: err.message } });
    }
  }

  static async generateFixtures(req: Request, res: Response): Promise<void> {
    try {
      const tournament = await Tournament.findById(req.params.id);
      if (!tournament) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Tournament not found' } });
        return;
      }

      if (req.user!.role === 'ORGANIZER' && tournament.organizerId.toString() !== req.user!._id.toString()) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You can only generate fixtures for your own tournaments' } });
        return;
      }

      const matches = await FixtureService.generateTournamentFixtures(tournament._id);

      await AuditService.record({
        userId: req.user!._id,
        action: 'FIXTURES_GENERATED',
        resourceType: 'Tournament',
        resourceId: tournament._id.toString(),
        details: { matchesCount: matches.length, format: tournament.format },
        ipAddress: req.ip,
      });

      res.status(200).json({ success: true, data: { matchesCount: matches.length, matches } });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'FIXTURE_GENERATION_FAILED', message: err.message } });
    }
  }

  static async getStandings(req: Request, res: Response): Promise<void> {
    try {
      const groupIndex = req.query.groupIndex ? parseInt(req.query.groupIndex as string, 10) : undefined;
      const standings = await AnalyticsService.getTournamentStandings(req.params.id, groupIndex);
      res.status(200).json({ success: true, data: { standings } });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: err.message } });
    }
  }

  static async exportStandingsCSV(req: Request, res: Response): Promise<void> {
    try {
      const tournament = await Tournament.findById(req.params.id);
      if (!tournament) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Tournament not found' } });
        return;
      }

      const standings = await AnalyticsService.getTournamentStandings(tournament._id);
      const headers = ['Pos', 'Team', 'Code', 'Played', 'Won', 'Drawn', 'Lost', 'GF', 'GA', 'GD', 'Points', 'Form'];
      const rows = standings.map((s, idx) => [
        idx + 1,
        s.teamName,
        s.teamCode,
        s.played,
        s.won,
        s.drawn,
        s.lost,
        s.pointsFor,
        s.pointsAgainst,
        s.pointDifference,
        s.points,
        s.form.join('-'),
      ]);

      const csv = AnalyticsService.generateSafeCSV(headers, rows);
      res.header('Content-Type', 'text/csv');
      res.attachment(`${tournament.slug}-standings.csv`);
      res.send(csv);
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
    }
  }
}
