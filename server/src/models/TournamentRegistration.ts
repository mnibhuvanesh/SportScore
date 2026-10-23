import { Schema, model, Document, Types } from 'mongoose';

export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';

export interface ITournamentRegistration extends Document {
  _id: Types.ObjectId;
  tournamentId: Types.ObjectId;
  teamId: Types.ObjectId;
  coachId: Types.ObjectId;
  status: RegistrationStatus;
  rejectionReason?: string;
  reviewedBy?: Types.ObjectId | null;
  reviewedAt?: Date | null;
  seedNumber?: number | null;
  groupIndex?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const tournamentRegistrationSchema = new Schema<ITournamentRegistration>(
  {
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
      index: true,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true,
    },
    coachId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN'],
      default: 'PENDING',
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    seedNumber: {
      type: Number,
      default: null,
    },
    groupIndex: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate tournament registrations
tournamentRegistrationSchema.index({ tournamentId: 1, teamId: 1 }, { unique: true });

export const TournamentRegistration = model<ITournamentRegistration>(
  'TournamentRegistration',
  tournamentRegistrationSchema
);
