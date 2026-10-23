import { Request, Response } from 'express';
import { TournamentRegistration } from '../models/TournamentRegistration';
import { Tournament } from '../models/Tournament';
import { Team } from '../models/Team';
import { Notification } from '../models/Notification';
import { AuditService } from '../services/audit.service';

export class RegistrationController {
  static async requestRegistration(req: Request, res: Response): Promise<void> {
    try {
      const { tournamentId, teamId } = req.body;

      const [tournament, team] = await Promise.all([
        Tournament.findById(tournamentId),
        Team.findById(teamId),
      ]);

      if (!tournament) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Tournament not found' } });
        return;
      }

      if (!team) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Team not found' } });
        return;
      }

      // Verify coach ownership
      if (req.user!.role === 'COACH' && team.coachId.toString() !== req.user!._id.toString()) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You can only register your own team' } });
        return;
      }

      // Verify tournament registration is open
      if (tournament.status !== 'REGISTRATION_OPEN' && tournament.status !== 'DRAFT') {
        res.status(400).json({
          success: false,
          error: { code: 'REGISTRATION_CLOSED', message: 'Tournament registration is currently closed' },
        });
        return;
      }

      // Check deadline
      if (new Date() > new Date(tournament.registrationDeadline)) {
        res.status(400).json({
          success: false,
          error: { code: 'DEADLINE_PASSED', message: 'Tournament registration deadline has passed' },
        });
        return;
      }

      // Verify sports match
      if (team.sportId.toString() !== tournament.sportId.toString()) {
        res.status(400).json({
          success: false,
          error: { code: 'SPORT_MISMATCH', message: 'Team sport does not match tournament sport' },
        });
        return;
      }

      const registration = await TournamentRegistration.create({
        tournamentId: tournament._id,
        teamId: team._id,
        coachId: req.user!._id,
        status: 'PENDING',
      });

      // Send notification to tournament organizer
      await Notification.create({
        userId: tournament.organizerId,
        title: 'New Tournament Registration Request',
        message: `Team "${team.name}" requested to register for "${tournament.name}".`,
        type: 'REGISTRATION',
        link: `/organizer/tournaments/${tournament._id}/registrations`,
      });

      await AuditService.record({
        userId: req.user!._id,
        action: 'REGISTRATION_REQUESTED',
        resourceType: 'TournamentRegistration',
        resourceId: registration._id.toString(),
        details: { tournamentId, teamId },
        ipAddress: req.ip,
      });

      res.status(201).json({ success: true, data: { registration } });
    } catch (err: any) {
      if (err.code === 11000) {
        res.status(409).json({
          success: false,
          error: { code: 'DUPLICATE_REGISTRATION', message: 'Team is already registered for this tournament' },
        });
        return;
      }
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: err.message } });
    }
  }

  static async listTournamentRegistrations(req: Request, res: Response): Promise<void> {
    try {
      const { tournamentId } = req.params;
      const status = req.query.status as string;

      const query: any = { tournamentId };
      if (status) query.status = status;

      const registrations = await TournamentRegistration.find(query)
        .populate('teamId')
        .populate('coachId', 'name email phone')
        .populate('reviewedBy', 'name email')
        .sort({ createdAt: -1 });

      res.status(200).json({ success: true, data: { registrations } });
    } catch (err) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list registrations' } });
    }
  }

  static async listCoachRegistrations(req: Request, res: Response): Promise<void> {
    try {
      const registrations = await TournamentRegistration.find({ coachId: req.user!._id })
        .populate('tournamentId', 'name status startDate endDate format')
        .populate('teamId', 'name code')
        .sort({ createdAt: -1 });

      res.status(200).json({ success: true, data: { registrations } });
    } catch (err) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list registrations' } });
    }
  }

  static async listTeamRegistrations(req: Request, res: Response): Promise<void> {
    try {
      const { teamId } = req.params;
      const registrations = await TournamentRegistration.find({ teamId })
        .populate('tournamentId', 'name status startDate endDate format')
        .populate('reviewedBy', 'name email')
        .sort({ createdAt: -1 });

      res.status(200).json({ success: true, data: { registrations } });
    } catch (err) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list team registrations' } });
    }
  }

  static async reviewRegistration(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, rejectionReason, seedNumber, groupIndex } = req.body;

      if (!['APPROVED', 'REJECTED'].includes(status)) {
        res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Status must be APPROVED or REJECTED' } });
        return;
      }

      const registration = await TournamentRegistration.findById(id).populate('tournamentId').populate('teamId');
      if (!registration) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Registration not found' } });
        return;
      }

      const tournament = registration.tournamentId as any;
      if (req.user!.role === 'ORGANIZER' && tournament.organizerId.toString() !== req.user!._id.toString()) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You can only review registrations for your own tournaments' } });
        return;
      }

      registration.status = status;
      registration.rejectionReason = status === 'REJECTED' ? rejectionReason : undefined;
      registration.reviewedBy = req.user!._id;
      registration.reviewedAt = new Date();
      if (seedNumber !== undefined) registration.seedNumber = seedNumber;
      if (groupIndex !== undefined) registration.groupIndex = groupIndex;

      await registration.save();

      // Notify the coach
      const team = registration.teamId as any;
      await Notification.create({
        userId: registration.coachId,
        title: `Tournament Registration ${status}`,
        message: `Your registration for team "${team.name}" in "${tournament.name}" was ${status.toLowerCase()}.${
          rejectionReason ? ` Reason: ${rejectionReason}` : ''
        }`,
        type: 'REGISTRATION',
      });

      await AuditService.record({
        userId: req.user!._id,
        action: 'REGISTRATION_REVIEWED',
        resourceType: 'TournamentRegistration',
        resourceId: registration._id.toString(),
        details: { status, rejectionReason, seedNumber },
        ipAddress: req.ip,
      });

      res.status(200).json({ success: true, data: { registration } });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: err.message } });
    }
  }
}
