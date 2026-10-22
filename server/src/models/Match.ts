import { Schema, model, Document, Types } from 'mongoose';

export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'PAUSED' | 'COMPLETED' | 'POSTPONED' | 'ABANDONED' | 'CANCELLED';
export type MatchStage = 'GROUP_STAGE' | 'KNOCKOUT' | 'REGULAR';

export interface ISetScore {
  setNumber: number;
  homeScore: number;
  awayScore: number;
}

export interface IMatch extends Document {
  _id: Types.ObjectId;
  tournamentId: Types.ObjectId;
  round: number;
  matchNumber: number;
  roundName: string;
  stage: MatchStage;
  groupIndex?: number | null;
  homeTeamId?: Types.ObjectId | null;
  awayTeamId?: Types.ObjectId | null;
  isBye: boolean;
  status: MatchStatus;
  scheduledStartTime?: Date | null;
  actualStartTime?: Date | null;
  actualEndTime?: Date | null;
  venueId?: Types.ObjectId | null;
  assignedScorerId?: Types.ObjectId | null;
  homeScore: number;
  awayScore: number;
  winnerTeamId?: Types.ObjectId | null;
  isDraw: boolean;
  sets: ISetScore[];
  nextMatchId?: Types.ObjectId | null;
  nextMatchSlot?: 'home' | 'away' | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const matchSchema = new Schema<IMatch>(
  {
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
      index: true,
    },
    round: {
      type: Number,
      required: true,
      index: true,
    },
    matchNumber: {
      type: Number,
      required: true,
    },
    roundName: {
      type: String,
      required: true,
    },
    stage: {
      type: String,
      enum: ['GROUP_STAGE', 'KNOCKOUT', 'REGULAR'],
      default: 'REGULAR',
      index: true,
    },
    groupIndex: {
      type: Number,
      default: null,
    },
    homeTeamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
      index: true,
    },
    awayTeamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
      index: true,
    },
    isBye: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'LIVE', 'PAUSED', 'COMPLETED', 'POSTPONED', 'ABANDONED', 'CANCELLED'],
      default: 'SCHEDULED',
      index: true,
    },
    scheduledStartTime: {
      type: Date,
      default: null,
      index: true,
    },
    actualStartTime: {
      type: Date,
      default: null,
    },
    actualEndTime: {
      type: Date,
      default: null,
    },
    venueId: {
      type: Schema.Types.ObjectId,
      ref: 'Venue',
      default: null,
      index: true,
    },
    assignedScorerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    homeScore: {
      type: Number,
      default: 0,
    },
    awayScore: {
      type: Number,
      default: 0,
    },
    winnerTeamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    isDraw: {
      type: Boolean,
      default: false,
    },
    sets: [
      {
        setNumber: { type: Number, required: true },
        homeScore: { type: Number, required: true },
        awayScore: { type: Number, required: true },
      },
    ],
    nextMatchId: {
      type: Schema.Types.ObjectId,
      ref: 'Match',
      default: null,
    },
    nextMatchSlot: {
      type: String,
      enum: ['home', 'away'],
      default: null,
    },
    version: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

matchSchema.index({ tournamentId: 1, round: 1, matchNumber: 1 }, { unique: true });
matchSchema.index({ assignedScorerId: 1, status: 1 });
matchSchema.index({ venueId: 1, scheduledStartTime: 1 });

export const Match = model<IMatch>('Match', matchSchema);
