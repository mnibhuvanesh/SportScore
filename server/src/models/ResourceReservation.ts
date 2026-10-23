import { Schema, model, Document, Types } from 'mongoose';

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';

export interface IResourceReservation extends Document {
  _id: Types.ObjectId;
  operationId: string;
  resourceId: Types.ObjectId;
  slotStart: Date;
  slotEnd: Date;
  quantity: number;
  matchId?: Types.ObjectId | null;
  bookedBy: Types.ObjectId;
  status: ReservationStatus;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const resourceReservationSchema = new Schema<IResourceReservation>(
  {
    operationId: {
      type: String,
      required: true,
      index: true,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      ref: 'Resource',
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
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    matchId: {
      type: Schema.Types.ObjectId,
      ref: 'Match',
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
  },
  {
    timestamps: true,
  }
);

resourceReservationSchema.index({ resourceId: 1, slotStart: 1, status: 1 });

export const ResourceReservation = model<IResourceReservation>(
  'ResourceReservation',
  resourceReservationSchema
);
