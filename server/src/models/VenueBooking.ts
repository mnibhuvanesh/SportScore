import { Schema, model, Document, Types } from 'mongoose';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';

export interface IVenueBooking extends Document {
  _id: Types.ObjectId;
  operationId: string;
  venueId: Types.ObjectId;
  slotStart: Date;
  slotEnd: Date;
  matchId?: Types.ObjectId | null;
  tournamentId?: Types.ObjectId | null;
  bookedBy: Types.ObjectId;
  status: BookingStatus;
  expiresAt?: Date | null;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const venueBookingSchema = new Schema<IVenueBooking>(
  {
    operationId: {
      type: String,
      required: true,
      index: true,
    },
    venueId: {
      type: Schema.Types.ObjectId,
      ref: 'Venue',
      required: true,
      index: true,
    },
    slotStart: {
      type: Date,
      required: true,
      index: true,
    },
    slotEnd: {
      type: Date,
      required: true,
      index: true,
    },
    matchId: {
      type: Schema.Types.ObjectId,
      ref: 'Match',
      default: null,
      index: true,
    },
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: 'Tournament',
      default: null,
    },
    bookedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED'],
      default: 'PENDING',
      index: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Concurrency safety: Enforce slot uniqueness for PENDING and CONFIRMED bookings
venueBookingSchema.index(
  { venueId: 1, slotStart: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['PENDING', 'CONFIRMED'] } },
  }
);

export const VenueBooking = model<IVenueBooking>('VenueBooking', venueBookingSchema);
