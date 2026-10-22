import { Schema, model, Document, Types } from 'mongoose';

export type PlayerStatus = 'ACTIVE' | 'INJURED' | 'SUSPENDED';

export interface IPlayer extends Document {
  _id: Types.ObjectId;
  teamId: Types.ObjectId;
  userId?: Types.ObjectId | null;
  firstName: string;
  lastName: string;
  jerseyNumber: number;
  position: string;
  dateOfBirth?: Date;
  isCaptain: boolean;
  status: PlayerStatus;
  createdAt: Date;
  updatedAt: Date;
}

const playerSchema = new Schema<IPlayer>(
  {
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [1, 'First name required'],
      maxlength: [50, 'First name too long'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [1, 'Last name required'],
      maxlength: [50, 'Last name too long'],
    },
    jerseyNumber: {
      type: Number,
      required: true,
      min: [0, 'Jersey number cannot be negative'],
      max: [99, 'Jersey number cannot exceed 99'],
    },
    position: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    isCaptain: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INJURED', 'SUSPENDED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce unique jersey number within a team
playerSchema.index({ teamId: 1, jerseyNumber: 1 }, { unique: true });

export const Player = model<IPlayer>('Player', playerSchema);
