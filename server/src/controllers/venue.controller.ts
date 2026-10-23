import { Request, Response } from 'express';
import { Venue } from '../models/Venue';
import { Resource } from '../models/Resource';
import { VenueBooking } from '../models/VenueBooking';
import { SchedulingService } from '../services/scheduling.service';
import { AuditService } from '../services/audit.service';

export class VenueController {
  static async listVenues(req: Request, res: Response): Promise<void> {
    try {
      const sportId = req.query.sportId as string;
      const query: any = { isActive: true };
      if (sportId) query.supportedSportIds = sportId;

      const venues = await Venue.find(query).populate('supportedSportIds', 'name code');
      res.status(200).json({ success: true, data: { venues } });
    } catch (err) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list venues' } });
    }
  }

  static async getVenue(req: Request, res: Response): Promise<void> {
    try {
      const venue = await Venue.findById(req.params.id).populate('supportedSportIds');
      if (!venue) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Venue not found' } });
        return;
      }

      // Fetch bookings for next 14 days
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000);

      const bookings = await VenueBooking.find({
        venueId: venue._id,
        slotStart: { $gte: startDate, $lte: endDate },
        status: { $in: ['PENDING', 'CONFIRMED'] },
      }).populate('matchId', 'roundName homeTeamId awayTeamId');

      const resources = await Resource.find({ venueId: venue._id, isActive: true });

      res.status(200).json({
        success: true,
        data: { venue, bookings, resources },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch venue' } });
    }
  }

  static async createVenue(req: Request, res: Response): Promise<void> {
    try {
      const { name, code, location, capacity, supportedSportIds, openingTime, closingTime, slotDurationMinutes } = req.body;

      const venue = await Venue.create({
        name,
        code: code.toUpperCase(),
        location,
        capacity,
        supportedSportIds: supportedSportIds || [],
        openingTime: openingTime || '07:00',
        closingTime: closingTime || '22:00',
        slotDurationMinutes: slotDurationMinutes || 60,
      });

      await AuditService.record({
        userId: req.user!._id,
        action: 'VENUE_CREATED',
        resourceType: 'Venue',
        resourceId: venue._id.toString(),
        details: { name, code },
        ipAddress: req.ip,
      });

      res.status(201).json({ success: true, data: { venue } });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: err.message } });
    }
  }

  static async listResources(req: Request, res: Response): Promise<void> {
    try {
      const { venueId, sportId } = req.query;
      const query: any = { isActive: true };
      if (venueId) query.venueId = venueId;
      if (sportId) query.sportId = sportId;

      const resources = await Resource.find(query).populate('venueId', 'name').populate('sportId', 'name code');
      res.status(200).json({ success: true, data: { resources } });
    } catch (err) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list resources' } });
    }
  }

  static async createResource(req: Request, res: Response): Promise<void> {
    try {
      const { name, code, totalQuantity, venueId, sportId, description } = req.body;
      const resource = await Resource.create({
        name,
        code: code.toUpperCase(),
        totalQuantity,
        venueId: venueId || null,
        sportId: sportId || null,
        description,
      });

      res.status(201).json({ success: true, data: { resource } });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: err.message } });
    }
  }

  static async reserveResource(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { slotStart, slotEnd, quantity, matchId } = req.body;

      const reservation = await SchedulingService.reserveResource({
        resourceId: id,
        slotStart: new Date(slotStart),
        slotEnd: new Date(slotEnd),
        quantity: parseInt(quantity, 10),
        matchId,
        bookedBy: req.user!._id,
      });

      res.status(201).json({ success: true, data: { reservation } });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'RESERVATION_FAILED', message: err.message } });
    }
  }
}
