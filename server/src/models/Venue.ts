import { Schema, model, Document, Types } from 'mongoose';

export interface IMaintenanceWindow {
  startTime: Date;
  endTime: Date;
  reason: string;
}

export interface IVenue extends Document {
  _id: Types.ObjectId;
  name: string;
  code: string;
  location: string;
  capacity: number;
  supportedSportIds: Types.ObjectId[];
  openingTime: string;
  closingTime: string;
  slotDurationMinutes: number;
  maintenanceWindows: IMaintenanceWindow[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const venueSchema = new Schema<IVenue>(
  {
    name: {
      type: String,
      required: [true, 'Venue name is required'],
      trim: true,
      unique: true,
    },
    code: {
      type: String,
      required: [true, 'Venue code is required'],
      uppercase: true,
      trim: true,
      unique: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: [1, 'Capacity must be at least 1'],
    },
    supportedSportIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Sport',
      },
    ],
    openingTime: {
      type: String,
      default: '07:00',
    },
    closingTime: {
      type: String,
      default: '22:00',
    },
    slotDurationMinutes: {
      type: Number,
      default: 60,
    },
    maintenanceWindows: [
      {
        startTime: { type: Date, required: true },
        endTime: { type: Date, required: true },
        reason: { type: String, required: true },
      },
    ],
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

export const Venue = model<IVenue>('Venue', venueSchema);
