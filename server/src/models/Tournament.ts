import { Schema, model, Document, Types } from 'mongoose';

export type TournamentFormat = 'SINGLE_ELIMINATION' | 'ROUND_ROBIN' | 'DOUBLE_ROUND_ROBIN' | 'GROUP_AND_KNOCKOUT';
export type TournamentStatus = 'DRAFT' | 'REGISTRATION_OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';

export interface ITournament extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  sportId: Types.ObjectId;
  organizerId: Types.ObjectId;
  description?: string;
  format: TournamentFormat;
  status: TournamentStatus;
  startDate: Date;
  endDate: Date;
  registrationDeadline: Date;
  maxTeams: number;
  minTeams: number;
  isPublic: boolean;
  rules?: string;
  groupCount?: number;
  qualifiersPerGroup?: number;
  fixturesGenerated: boolean;
  winnerTeamId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const tournamentSchema = new Schema<ITournament>(
  {
    name: {
      type: String,
      required: [true, 'Tournament name is required'],
      trim: true,
      minlength: [3, 'Tournament name must be at least 3 characters'],
      maxlength: [150, 'Tournament name cannot exceed 150 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    sportId: {
      type: Schema.Types.ObjectId,
      ref: 'Sport',
      required: true,
      index: true,
    },
    organizerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    format: {
      type: String,
      enum: ['SINGLE_ELIMINATION', 'ROUND_ROBIN', 'DOUBLE_ROUND_ROBIN', 'GROUP_AND_KNOCKOUT'],
      required: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'REGISTRATION_OPEN', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'],
      default: 'DRAFT',
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    registrationDeadline: {
      type: Date,
      required: true,
    },
    maxTeams: {
      type: Number,
      required: true,
      min: [2, 'Minimum 2 teams required'],
      max: [64, 'Maximum 64 teams supported'],
    },
    minTeams: {
      type: Number,
      required: true,
      default: 2,
    },
    isPublic: {
      type: Boolean,
      default: true,
      index: true,
    },
    rules: {
      type: String,
    },
    groupCount: {
      type: Number,
      default: 2,
    },
    qualifiersPerGroup: {
      type: Number,
      default: 2,
    },
    fixturesGenerated: {
      type: Boolean,
      default: false,
    },
    winnerTeamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

tournamentSchema.index({ organizerId: 1, status: 1 });
tournamentSchema.index({ sportId: 1, status: 1 });

export const Tournament = model<ITournament>('Tournament', tournamentSchema);
