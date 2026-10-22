import { Schema, model, Document, Types } from 'mongoose';

export type MatchEventType =
  | 'MATCH_CREATED'
  | 'MATCH_ASSIGNED'
  | 'MATCH_STARTED'
  | 'MATCH_PAUSED'
  | 'MATCH_RESUMED'
  | 'MATCH_COMPLETED'
  | 'MATCH_POSTPONED'
  | 'MATCH_ABANDONED'
  | 'SCORE_GOAL'
  | 'SCORE_POINT'
  | 'SET_SCORE'
  | 'FOUL'
  | 'YELLOW_CARD'
  | 'RED_CARD'
  | 'TIMEOUT'
  | 'CORRECTION'
  | 'REVERSAL';

export interface IMatchEvent extends Document {
  _id: Types.ObjectId;
  matchId: Types.ObjectId;
  sequenceNumber: number;
  type: MatchEventType;
  teamId?: Types.ObjectId | null;
  playerId?: Types.ObjectId | null;
  points: number;
  setNumber?: number | null;
  minute?: number | null;
  scorerUserId: Types.ObjectId;
  idempotencyKey?: string | null;
  isCorrection: boolean;
  correctedEventId?: Types.ObjectId | null;
  correctionReason?: string | null;
  isReversed: boolean;
  reversedEventId?: Types.ObjectId | null;
  reversalReason?: string | null;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const matchEventSchema = new Schema<IMatchEvent>(
  {
    matchId: {
      type: Schema.Types.ObjectId,
      ref: 'Match',
      required: true,
      index: true,
    },
    sequenceNumber: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'MATCH_CREATED',
        'MATCH_ASSIGNED',
        'MATCH_STARTED',
        'MATCH_PAUSED',
        'MATCH_RESUMED',
        'MATCH_COMPLETED',
        'MATCH_POSTPONED',
        'MATCH_ABANDONED',
        'SCORE_GOAL',
        'SCORE_POINT',
        'SET_SCORE',
        'FOUL',
        'YELLOW_CARD',
        'RED_CARD',
        'TIMEOUT',
        'CORRECTION',
        'REVERSAL',
      ],
      index: true,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    playerId: {
      type: Schema.Types.ObjectId,
      ref: 'Player',
      default: null,
    },
    points: {
      type: Number,
      default: 0,
    },
    setNumber: {
      type: Number,
      default: null,
    },
    minute: {
      type: Number,
      default: null,
    },
    scorerUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      required: false,
    },
    isCorrection: {
      type: Boolean,
      default: false,
    },
    correctedEventId: {
      type: Schema.Types.ObjectId,
      ref: 'MatchEvent',
      default: null,
    },
    correctionReason: {
      type: String,
      default: null,
    },
    isReversed: {
      type: Boolean,
      default: false,
    },
    reversedEventId: {
      type: Schema.Types.ObjectId,
      ref: 'MatchEvent',
      default: null,
    },
    reversalReason: {
      type: String,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

matchEventSchema.index({ matchId: 1, sequenceNumber: 1 }, { unique: true });
matchEventSchema.index(
  { matchId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
);

export const MatchEvent = model<IMatchEvent>('MatchEvent', matchEventSchema);
