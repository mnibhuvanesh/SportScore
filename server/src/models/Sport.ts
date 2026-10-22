import { Schema, model, Document, Types } from 'mongoose';

export type ScoringType = 'GOALS' | 'POINTS' | 'SETS';

export interface ISport extends Document {
  _id: Types.ObjectId;
  name: string;
  code: string;
  scoringType: ScoringType;
  minPlayersPerTeam: number;
  maxPlayersPerTeam: number;
  matchDurationMinutes: number;
  pointsConfig: {
    win: number;
    draw: number;
    loss: number;
  };
  description?: string;
  rules?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const sportSchema = new Schema<ISport>(
  {
    name: {
      type: String,
      required: [true, 'Sport name is required'],
      trim: true,
      unique: true,
    },
    code: {
      type: String,
      required: [true, 'Sport code is required'],
      uppercase: true,
      trim: true,
      unique: true,
    },
    scoringType: {
      type: String,
      enum: ['GOALS', 'POINTS', 'SETS'],
      required: true,
      default: 'POINTS',
    },
    minPlayersPerTeam: {
      type: Number,
      required: true,
      min: [1, 'Minimum players must be at least 1'],
    },
    maxPlayersPerTeam: {
      type: Number,
      required: true,
      min: [1, 'Maximum players must be at least 1'],
    },
    matchDurationMinutes: {
      type: Number,
      required: true,
      default: 60,
    },
    pointsConfig: {
      win: { type: Number, default: 3 },
      draw: { type: Number, default: 1 },
      loss: { type: Number, default: 0 },
    },
    description: {
      type: String,
      trim: true,
    },
    rules: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Sport = model<ISport>('Sport', sportSchema);
