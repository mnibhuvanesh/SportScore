import { Schema, model, Document, Types } from 'mongoose';
import { UserRole } from './User';

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';

export interface IInvitation extends Document {
  _id: Types.ObjectId;
  email: string;
  role: UserRole;
  tokenHash: string;
  invitedBy: Types.ObjectId;
  expiresAt: Date;
  usedAt?: Date | null;
  status: InvitationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const invitationSchema = new Schema<IInvitation>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['ADMIN', 'ORGANIZER', 'COACH', 'ATHLETE', 'SCORER'],
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED'],
      default: 'PENDING',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

invitationSchema.index({ email: 1, status: 1 });

export const Invitation = model<IInvitation>('Invitation', invitationSchema);
