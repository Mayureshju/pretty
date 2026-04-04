import mongoose, { Schema, Document } from "mongoose";

export interface ICustomerAddress {
  label?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isDefault: boolean;
}

export interface ICustomer extends Document {
  clerkId?: string;
  name: {
    first: string;
    last?: string;
  };
  email: string;
  phone?: string;
  addresses: ICustomerAddress[];
  orderCount: number;
  totalSpent: number;
  lastOrderDate?: Date;
  wpCustomerId?: number;
  wpUserId?: number;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerAddressSchema = new Schema(
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

const CustomerSchema = new Schema<ICustomer>(
  {
    clerkId: { type: String, sparse: true, unique: true },
    name: {
      first: { type: String, required: true },
      last: { type: String },
    },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String },
    addresses: [CustomerAddressSchema],
    orderCount: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lastOrderDate: { type: Date },
    wpCustomerId: { type: Number },
    wpUserId: { type: Number },
  },
  { timestamps: true }
);

// Indexes
CustomerSchema.index({ clerkId: 1 }, { unique: true, sparse: true });
CustomerSchema.index({ email: 1 }, { unique: true });
CustomerSchema.index({ wpCustomerId: 1 });

const Customer =
  mongoose.models.Customer ||
  mongoose.model<ICustomer>("Customer", CustomerSchema);

export default Customer;
