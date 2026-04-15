import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICoupon extends Document {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  description: string;
  termsAndConditions: string;
  isPubliclyVisible: boolean;
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  perUserLimit: number;
  applicableCategories: Types.ObjectId[];
  validFrom: Date;
  validTo: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    type: { type: String, enum: ["percentage", "fixed"], required: true },
    value: { type: Number, required: true },
    description: { type: String, default: "" },
    termsAndConditions: { type: String, default: "" },
    isPubliclyVisible: { type: Boolean, default: true },
    minOrderAmount: { type: Number, default: 0 },
    maxDiscount: { type: Number },
    usageLimit: { type: Number },
    usedCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    applicableCategories: [
      { type: Schema.Types.ObjectId, ref: "Category" },
    ],
    validFrom: { type: Date, required: true },
    validTo: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CouponSchema.index({ code: 1 }, { unique: true });
CouponSchema.index({ isActive: 1, validFrom: 1, validTo: 1 });

CouponSchema.pre("save", function () {
  if (this.code) {
    this.code = this.code.toUpperCase();
  }
});

const Coupon =
  mongoose.models.Coupon || mongoose.model<ICoupon>("Coupon", CouponSchema);

export default Coupon;
