import mongoose, { Schema, Document } from "mongoose";

export interface IPincode {
  code: string;
  deliveryDays: number;
  codAvailable: boolean;
}

export interface IDeliveryCity extends Document {
  city: string;
  state?: string;
  pincodes: IPincode[];
  baseCharge: number;
  freeDeliveryAbove?: number;
  isActive: boolean;
  estimatedTime?: string;
  cutoffTime?: string;
  blockedDates: Date[];
  createdAt: Date;
  updatedAt: Date;
}

const PincodeSchema = new Schema<IPincode>(
  {
    code: { type: String, required: true },
    deliveryDays: { type: Number, default: 0 },
    codAvailable: { type: Boolean, default: true },
  },
  { _id: false }
);

const DeliveryCitySchema = new Schema<IDeliveryCity>(
  {
    city: { type: String, required: true, unique: true },
    state: { type: String },
    pincodes: [PincodeSchema],
    baseCharge: { type: Number, required: true, default: 0 },
    freeDeliveryAbove: { type: Number },
    isActive: { type: Boolean, default: true },
    estimatedTime: { type: String },
    cutoffTime: { type: String },
    blockedDates: [{ type: Date }],
  },
  { timestamps: true }
);

DeliveryCitySchema.index({ isActive: 1 });

const DeliveryCity =
  mongoose.models.DeliveryCity ||
  mongoose.model<IDeliveryCity>("DeliveryCity", DeliveryCitySchema);

export default DeliveryCity;
