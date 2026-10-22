import { Schema, model, Document, Types } from 'mongoose';

export interface ITeam extends Document {
  _id: Types.ObjectId;
  name: string;
  code: string;
  sportId: Types.ObjectId;
  coachId: Types.ObjectId;
  contactEmail: string;
  contactPhone?: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const teamSchema = new Schema<ITeam>(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      minlength: [2, 'Team name must be at least 2 characters'],
      maxlength: [100, 'Team name cannot exceed 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Team code is required'],
      uppercase: true,
      trim: true,
      minlength: [2, 'Code must be at least 2 characters'],
      maxlength: [6, 'Code cannot exceed 6 characters'],
    },
    sportId: {
      type: Schema.Types.ObjectId,
      ref: 'Sport',
      required: true,
      index: true,
    },
    coachId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    contactEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    logoUrl: {
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

teamSchema.index({ sportId: 1, name: 1 }, { unique: true });
teamSchema.index({ coachId: 1, sportId: 1 });

export const Team = model<ITeam>('Team', teamSchema);
