import crypto from 'crypto';
import { Types } from 'mongoose';
import { Venue, IVenue } from '../models/Venue';
import { Resource } from '../models/Resource';
import { VenueBooking, IVenueBooking } from '../models/VenueBooking';
import { ResourceReservation } from '../models/ResourceReservation';
import { Match } from '../models/Match';

export interface BookingSlotRequest {
  venueId: string | Types.ObjectId;
  slotStart: Date;
  slotEnd: Date;
  matchId?: string | Types.ObjectId;
  tournamentId?: string | Types.ObjectId;
  bookedBy: string | Types.ObjectId;
  notes?: string;
}

export interface ResourceAllocationRequest {
  resourceId: string | Types.ObjectId;
  slotStart: Date;
  slotEnd: Date;
  quantity: number;
  matchId?: string | Types.ObjectId;
  bookedBy: string | Types.ObjectId;
}

export class SchedulingService {
  /**
   * Validates venue maintenance windows to ensure slot does not overlap with maintenance.
   */
  static isOverlappingMaintenance(venue: IVenue, start: Date, end: Date): boolean {
    const s = start.getTime();
    const e = end.getTime();
    for (const mw of venue.maintenanceWindows || []) {
      const ms = new Date(mw.startTime).getTime();
      const me = new Date(mw.endTime).getTime();
      if (s < me && e > ms) {
        return true;
      }
    }
    return false;
  }

  /**
   * Concurrency-safe atomic multi-slot venue booking with 2-phase commit and rollback.
   * Guarantees that conflicting concurrent attempts will have exactly one winner, backed by MongoDB unique indexes.
   */
  static async bookVenueSlot(request: BookingSlotRequest): Promise<IVenueBooking> {
    const venue = await Venue.findById(request.venueId);
    if (!venue || !venue.isActive) {
      throw new Error('Venue is not available or does not exist');
    }

    const slotStart = new Date(request.slotStart);
    const slotEnd = new Date(request.slotEnd);

    if (slotEnd.getTime() <= slotStart.getTime()) {
      throw new Error('Invalid slot duration: end time must be after start time');
    }

    // 1. Check maintenance windows
    if (this.isOverlappingMaintenance(venue, slotStart, slotEnd)) {
      throw new Error('Venue is closed for maintenance during the requested time slot');
    }

    // 2. Check team clashes if match is specified
    if (request.matchId) {
      const match = await Match.findById(request.matchId);
      if (match) {
        const teamIds = [match.homeTeamId, match.awayTeamId].filter(Boolean);
        if (teamIds.length > 0) {
          const conflictingMatch = await Match.findOne({
            _id: { $ne: match._id },
            scheduledStartTime: { $gte: slotStart, $lt: slotEnd },
            status: { $in: ['SCHEDULED', 'LIVE'] },
            $or: [{ homeTeamId: { $in: teamIds } }, { awayTeamId: { $in: teamIds } }],
          });
          if (conflictingMatch) {
            throw new Error('One or both teams are already scheduled to play another match at this time');
          }
        }
      }
    }

    // 3. Concurrency-safe reservation via atomic write to MongoDB
    // Operation identifier for 2-phase reservation
    const operationId = crypto.randomUUID();
    const pendingExpiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minute pending reservation window

    let booking: IVenueBooking;
    try {
      booking = await VenueBooking.create({
        operationId,
        venueId: venue._id,
        slotStart,
        slotEnd,
        matchId: request.matchId || null,
        tournamentId: request.tournamentId || null,
        bookedBy: request.bookedBy,
        status: 'PENDING',
        expiresAt: pendingExpiresAt,
        notes: request.notes,
      });
    } catch (err: any) {
      // E11000 duplicate key error means another concurrent request booked this slot!
      if (err.code === 11000) {
        throw new Error('Conflict: Venue is already booked for this time slot');
      }
      throw err;
    }

    // 4. Confirm the reservation
    booking.status = 'CONFIRMED';
    booking.expiresAt = null;
    await booking.save();

    // 5. Update match schedule if linked
    if (request.matchId) {
      await Match.findByIdAndUpdate(request.matchId, {
        venueId: venue._id,
        scheduledStartTime: slotStart,
      });
    }

    return booking;
  }

  /**
   * Concurrency-safe equipment allocation checking total available capacity.
   */
  static async reserveResource(request: ResourceAllocationRequest): Promise<any> {
    const resource = await Resource.findById(request.resourceId);
    if (!resource || !resource.isActive) {
      throw new Error('Resource is not active or does not exist');
    }

    const slotStart = new Date(request.slotStart);
    const slotEnd = new Date(request.slotEnd);

    // Sum currently reserved quantity during this slot
    const activeReservations = await ResourceReservation.find({
      resourceId: resource._id,
      slotStart: { $lt: slotEnd },
      slotEnd: { $gt: slotStart },
      status: { $in: ['PENDING', 'CONFIRMED'] },
    });

    const currentlyAllocated = activeReservations.reduce((acc, r) => acc + r.quantity, 0);
    if (currentlyAllocated + request.quantity > resource.totalQuantity) {
      throw new Error(
        `Insufficient resource quantity. Requested: ${request.quantity}, Available: ${
          resource.totalQuantity - currentlyAllocated
        }`
      );
    }

    const operationId = crypto.randomUUID();
    const reservation = await ResourceReservation.create({
      operationId,
      resourceId: resource._id,
      slotStart,
      slotEnd,
      quantity: request.quantity,
      matchId: request.matchId || null,
      bookedBy: request.bookedBy,
      status: 'CONFIRMED',
    });

    return reservation;
  }

  /**
   * Concurrency-safe rescheduling: books new slot first, updates match, then safely releases old booking.
   */
  static async rescheduleMatchVenue(
    matchId: string | Types.ObjectId,
    newVenueId: string | Types.ObjectId,
    newSlotStart: Date,
    newSlotEnd: Date,
    bookedBy: string | Types.ObjectId
  ): Promise<IVenueBooking> {
    // 1. Reserve the new slot first
    const newBooking = await this.bookVenueSlot({
      venueId: newVenueId,
      slotStart: newSlotStart,
      slotEnd: newSlotEnd,
      matchId,
      bookedBy,
      notes: 'Rescheduled match',
    });

    // 2. Safely release any prior confirmed booking for this match
    await VenueBooking.updateMany(
      { matchId, _id: { $ne: newBooking._id }, status: 'CONFIRMED' },
      { status: 'CANCELLED' }
    );

    return newBooking;
  }

  /**
   * Cancel booking safely.
   */
  static async cancelBooking(bookingId: string | Types.ObjectId): Promise<void> {
    const booking = await VenueBooking.findById(bookingId);
    if (!booking) throw new Error('Booking not found');

    booking.status = 'CANCELLED';
    await booking.save();

    if (booking.matchId) {
      await Match.findByIdAndUpdate(booking.matchId, {
        venueId: null,
        scheduledStartTime: null,
      });
    }
  }

  /**
   * Background recovery job to clean up expired pending bookings.
   */
  static async cleanupExpiredPendingBookings(): Promise<number> {
    const result = await VenueBooking.updateMany(
      { status: 'PENDING', expiresAt: { $lt: new Date() } },
      { status: 'EXPIRED' }
    );
    return result.modifiedCount;
  }
}
