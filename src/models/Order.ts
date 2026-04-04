import mongoose, { Schema, Document } from "mongoose";

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  productName?: string;
  variant?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface IOrder extends Document {
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
    clerkId?: string;
  };
  items: IOrderItem[];
  shipping: {
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    method?: string;
  };
  deliveryCity?: mongoose.Types.ObjectId;
  deliveryCharge: number;
  deliverySlot?: string;
  pricing: {
    subtotal: number;
    discount: number;
    couponCode?: string;
    tax: number;
    shipping: number;
    total: number;
  };
  payment: {
    method?: string;
    status: "pending" | "paid" | "failed" | "refunded";
    transactionId?: string;
  };
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "out-for-delivery"
    | "delivered"
    | "cancelled"
    | "refunded";
  statusHistory: {
    status: string;
    timestamp: Date;
    note?: string;
  }[];
  notes?: string;
  invoice: {
    number?: string;
    date?: Date;
  };
  wpOrderId?: number;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String },
    variant: { type: String },
    quantity: { type: Number, required: true, default: 1 },
    price: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String },
      clerkId: { type: String },
    },
    items: [OrderItemSchema],
    shipping: {
      address: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
      method: { type: String },
    },
    deliveryCity: { type: Schema.Types.ObjectId, ref: "DeliveryCity" },
    deliveryCharge: { type: Number, default: 0 },
    deliverySlot: { type: String },
    pricing: {
      subtotal: { type: Number, required: true },
      discount: { type: Number, default: 0 },
      couponCode: { type: String },
      tax: { type: Number, default: 0 },
      shipping: { type: Number, default: 0 },
      total: { type: Number, required: true },
    },
    payment: {
      method: { type: String },
      status: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
      },
      transactionId: { type: String },
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "out-for-delivery",
        "delivered",
        "cancelled",
        "refunded",
      ],
      default: "pending",
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],
    notes: { type: String },
    invoice: {
      number: { type: String },
      date: { type: Date },
    },
    wpOrderId: { type: Number },
  },
  { timestamps: true }
);

// Indexes
OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ "customer.email": 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

// Counter schema for auto-generating order numbers
const CounterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter =
  mongoose.models.Counter ||
  mongoose.model("Counter", CounterSchema);

// Pre-save hook: auto-generate orderNumber if not provided
OrderSchema.pre("save", async function () {
  if (this.orderNumber) {
    return;
  }

  const counter = await Counter.findByIdAndUpdate(
    "orderNumber",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  this.orderNumber = "PP-" + String(counter.seq).padStart(5, "0");
});

const Order =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
