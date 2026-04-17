import mongoose, { Schema, Document } from "mongoose";

export interface IUserAddress {
  label?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isDefault: boolean;
}

export interface IUser extends Document {
  clerkId: string;
  name: {
    first: string;
    last?: string;
  };
  email: string;
  phone?: string;
  role: "admin" | "member";
  addresses: IUserAddress[];
  orderCount: number;
  totalSpent: number;
  lastOrderDate?: Date;
  lastLoginAt?: Date;
  wpCustomerId?: number;
  wpUserId?: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserAddressSchema = new Schema(
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

const UserSchema = new Schema<IUser>(
  {
    clerkId: { type: String, required: true, unique: true },
    name: {
      first: { type: String, required: true },
      last: { type: String },
    },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String },
    role: { type: String, enum: ["admin", "member"], default: "member" },
    addresses: [UserAddressSchema],
    orderCount: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lastOrderDate: { type: Date },
    lastLoginAt: { type: Date },
    wpCustomerId: { type: Number },
    wpUserId: { type: Number },
  },
  { timestamps: true }
);

const User =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
