import mongoose, { Schema, Document, Types } from "mongoose";

export type ReviewSource = "website" | "offline" | "google";

export interface IReview extends Document {
  product?: Types.ObjectId; // optional: site-wide / offline reviews have no product
  orderNumber?: string;
  customerName: string;
  customerEmail?: string;
  rating: number;
  title?: string;
  comment?: string;
  source: ReviewSource;
  isVerified: boolean;
  isApproved: boolean; // public visibility (only ever true for rating >= 3)
  needsFollowUp: boolean; // rating < 3 -> internal follow-up, never public
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product" },
    orderNumber: { type: String },
    customerName: { type: String, required: true },
    customerEmail: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String },
    comment: { type: String },
    source: {
      type: String,
      enum: ["website", "offline", "google"],
      default: "website",
    },
    isVerified: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    needsFollowUp: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ReviewSchema.index({ product: 1, isApproved: 1 });
ReviewSchema.index({ rating: 1 });
ReviewSchema.index({ isApproved: 1, rating: 1, createdAt: -1 });

const Review =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);

export default Review;
