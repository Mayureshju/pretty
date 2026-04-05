import mongoose, { Schema, Document } from "mongoose";

export interface IGuestUserAddress {
  label?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isDefault: boolean;
}

export interface IGuestUser extends Document {
  email: string;
  name?: {
    first: string;
    last?: string;
  };
  phone?: string;
  addresses: IGuestUserAddress[];
  orderCount: number;
  totalSpent: number;
  lastOrderDate?: Date;
  source: string;
  convertedToMember: boolean;
  convertedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GuestUserAddressSchema = new Schema(
  {
    label: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const GuestUserSchema = new Schema<IGuestUser>(
  {
    email: { type: String, required: true, lowercase: true },
    name: {
      first: { type: String },
      last: { type: String },
    },
    phone: { type: String },
    addresses: [GuestUserAddressSchema],
    orderCount: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lastOrderDate: { type: Date },
    source: { type: String, default: "checkout" },
    convertedToMember: { type: Boolean, default: false },
    convertedAt: { type: Date },
  },
  { timestamps: true }
);

GuestUserSchema.index({ email: 1 });
GuestUserSchema.index({ createdAt: 1 });

const GuestUser =
  mongoose.models.GuestUser ||
  mongoose.model<IGuestUser>("GuestUser", GuestUserSchema);

export default GuestUser;
