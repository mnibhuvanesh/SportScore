import { Request, Response } from 'express';
import { Team } from '../models/Team';
import { Player } from '../models/Player';
import { Match } from '../models/Match';
import { AnalyticsService } from '../services/analytics.service';
import { AuditService } from '../services/audit.service';

export class TeamController {
  static async listTeams(req: Request, res: Response): Promise<void> {
    try {
      const sportId = req.query.sportId as string;
      const coachId = req.query.coachId as string;
      const search = req.query.search as string;

      const query: any = { isActive: true };
      if (sportId) query.sportId = sportId;
      if (coachId) query.coachId = coachId;
      if (search) query.name = { $regex: search, $options: 'i' };

      // If logged in as coach, and no query specified, show own teams
      if (req.user && req.user.role === 'COACH' && !coachId) {
        query.coachId = req.user._id;
      }

      const teams = await Team.find(query)
        .populate('sportId', 'name code')
        .populate('coachId', 'name email phone')
        .sort({ name: 1 });

      res.status(200).json({ success: true, data: { teams } });
    } catch (err) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list teams' } });
    }
  }

  static async getTeam(req: Request, res: Response): Promise<void> {
    try {
      const team = await Team.findById(req.params.id)
        .populate('sportId')
        .populate('coachId', 'name email phone');

      if (!team) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Team not found' } });
        return;
      }

      const players = await Player.find({ teamId: team._id }).sort({ jerseyNumber: 1 });
      const analytics = await AnalyticsService.getTeamAnalytics(team._id);

      res.status(200).json({
        success: true,
        data: { team, players, analytics },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch team' } });
    }
  }

  static async createTeam(req: Request, res: Response): Promise<void> {
    try {
      const { name, code, sportId, contactEmail, contactPhone, logoUrl } = req.body;

      // Assign coach: Coach users assign themselves; Admins/Organizers can assign coachId
      let coachId = req.user!._id;
      if ((req.user!.role === 'ADMIN' || req.user!.role === 'ORGANIZER') && req.body.coachId) {
        coachId = req.body.coachId;
      }

      const team = await Team.create({
        name,
        code: code.toUpperCase(),
        sportId,
        coachId,
        contactEmail: contactEmail || req.user!.email,
        contactPhone,
        logoUrl,
      });

      await AuditService.record({
        userId: req.user!._id,
        action: 'TEAM_CREATED',
        resourceType: 'Team',
        resourceId: team._id.toString(),
        details: { name, code, sportId },
        ipAddress: req.ip,
      });

      res.status(201).json({ success: true, data: { team } });
    } catch (err: any) {
      if (err.code === 11000) {
        res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Team name or code already exists for this sport' } });
        return;
      }
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: err.message } });
    }
  }

  static async updateTeam(req: Request, res: Response): Promise<void> {
    try {
      const team = await Team.findById(req.params.id);
      if (!team) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Team not found' } });
        return;
      }

      // Enforce coach ownership
      if (req.user!.role === 'COACH' && team.coachId.toString() !== req.user!._id.toString()) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You can only update your own team' } });
        return;
      }

      const allowed = ['name', 'code', 'contactEmail', 'contactPhone', 'logoUrl'];
      for (const key of allowed) {
        if (req.body[key] !== undefined) {
          (team as any)[key] = req.body[key];
        }
      }

      await team.save();
      res.status(200).json({ success: true, data: { team } });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: err.message } });
    }
  }

  static async deleteTeam(req: Request, res: Response): Promise<void> {
    try {
      const team = await Team.findById(req.params.id);
      if (!team) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Team not found' } });
        return;
      }

      if (req.user!.role === 'COACH' && team.coachId.toString() !== req.user!._id.toString()) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You can only delete your own team' } });
        return;
      }

      // Check referential integrity: if team has played matches or has active tournament matches
      const activeMatchCount = await Match.countDocuments({
        $or: [{ homeTeamId: team._id }, { awayTeamId: team._id }],
      });

      if (activeMatchCount > 0) {
        // Soft delete/archive to preserve historical records & tournament integrity
        team.isActive = false;
        await team.save();
        await AuditService.record({
          userId: req.user!._id,
          action: 'TEAM_ARCHIVED',
          resourceType: 'Team',
          resourceId: team._id.toString(),
          details: { name: team.name, activeMatchCount },
          ipAddress: req.ip,
        });
        res.status(200).json({ success: true, message: 'Team archived safely to preserve tournament integrity' });
        return;
      }

      // Safe to remove players and team record
      await Player.deleteMany({ teamId: team._id });
      await team.deleteOne();

      await AuditService.record({
        userId: req.user!._id,
        action: 'TEAM_DELETED',
        resourceType: 'Team',
        resourceId: team._id.toString(),
        details: { name: team.name },
        ipAddress: req.ip,
      });

      res.status(200).json({ success: true, message: 'Team and associated roster removed successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
    }
  }

  static async addPlayer(req: Request, res: Response): Promise<void> {
    try {
      const team = await Team.findById(req.params.id);
      if (!team) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Team not found' } });
        return;
      }

      if (req.user!.role === 'COACH' && team.coachId.toString() !== req.user!._id.toString()) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You can only manage your own roster' } });
        return;
      }

      const { firstName, lastName, jerseyNumber, position, dateOfBirth, isCaptain, userId } = req.body;

      // Check jersey number uniqueness within team
      const existingJersey = await Player.findOne({ teamId: team._id, jerseyNumber });
      if (existingJersey) {
        res.status(409).json({
          success: false,
          error: { code: 'JERSEY_CONFLICT', message: `Jersey number ${jerseyNumber} is already taken in this team.` },
        });
        return;
      }

      const player = await Player.create({
        teamId: team._id,
        userId: userId || null,
        firstName,
        lastName,
        jerseyNumber,
        position,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        isCaptain: isCaptain || false,
      });

      res.status(201).json({ success: true, data: { player } });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: err.message } });
    }
  }

  static async updatePlayer(req: Request, res: Response): Promise<void> {
    try {
      const player = await Player.findById(req.params.playerId);
      if (!player) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Player not found' } });
        return;
      }

      const team = await Team.findById(player.teamId);
      if (!team) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Team not found' } });
        return;
      }

      if (req.user!.role === 'COACH' && team.coachId.toString() !== req.user!._id.toString()) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You can only manage your own roster' } });
        return;
      }

      // If changing jersey number, verify uniqueness
      if (req.body.jerseyNumber !== undefined && req.body.jerseyNumber !== player.jerseyNumber) {
        const existing = await Player.findOne({
          teamId: team._id,
          jerseyNumber: req.body.jerseyNumber,
          _id: { $ne: player._id },
        });
        if (existing) {
          res.status(409).json({
            success: false,
            error: { code: 'JERSEY_CONFLICT', message: `Jersey number ${req.body.jerseyNumber} is already taken` },
          });
          return;
        }
        player.jerseyNumber = req.body.jerseyNumber;
      }

      const allowed = ['firstName', 'lastName', 'position', 'status', 'isCaptain', 'userId', 'dateOfBirth'];
      for (const k of allowed) {
        if (req.body[k] !== undefined) {
          (player as any)[k] = req.body[k];
        }
      }

      await player.save();
      res.status(200).json({ success: true, data: { player } });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: err.message } });
    }
  }

  static async deletePlayer(req: Request, res: Response): Promise<void> {
    try {
      const player = await Player.findById(req.params.playerId);
      if (!player) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Player not found' } });
        return;
      }

      const team = await Team.findById(player.teamId);
      if (team && req.user!.role === 'COACH' && team.coachId.toString() !== req.user!._id.toString()) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You can only manage your own roster' } });
        return;
      }

      await player.deleteOne();
      res.status(200).json({ success: true, message: 'Player removed from roster' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: err.message } });
    }
  }
}
