import { Schema, model, Document, Types } from 'mongoose';

export type UserRole = 'ADMIN' | 'ORGANIZER' | 'COACH' | 'ATHLETE' | 'SCORER';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  username?: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  failedLoginAttempts: number;
  lockoutUntil?: Date | null;
  lastLoginAt?: Date;
  passwordChangedAt: Date;
  activeTokenFamily?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address format'],
    },
    username: {
      type: String,
      sparse: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-zA-Z0-9_.-]+$/, 'Username can only contain letters, numbers, dots, dashes, and underscores'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false,
    },
    role: {
      type: String,
      enum: ['ADMIN', 'ORGANIZER', 'COACH', 'ATHLETE', 'SCORER'],
      required: [true, 'Role is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'DEACTIVATED'],
      default: 'ACTIVE',
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockoutUntil: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
    },
    passwordChangedAt: {
      type: Date,
      default: Date.now,
    },
    activeTokenFamily: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete (ret as any).passwordHash;
        delete (ret as any).activeTokenFamily;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

userSchema.index({ role: 1, status: 1 });

export const User = model<IUser>('User', userSchema);
