import { Schema, model, Document, Types } from 'mongoose';

export interface IResource extends Document {
  _id: Types.ObjectId;
  name: string;
  code: string;
  sportId?: Types.ObjectId | null;
  venueId?: Types.ObjectId | null;
  totalQuantity: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const resourceSchema = new Schema<IResource>(
  {
    name: {
      type: String,
      required: [true, 'Resource name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Resource code is required'],
      uppercase: true,
      trim: true,
      unique: true,
    },
    sportId: {
      type: Schema.Types.ObjectId,
      ref: 'Sport',
      default: null,
      index: true,
    },
    venueId: {
      type: Schema.Types.ObjectId,
      ref: 'Venue',
      default: null,
      index: true,
    },
    totalQuantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    description: {
      type: String,
      trim: true,
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

export const Resource = model<IResource>('Resource', resourceSchema);
