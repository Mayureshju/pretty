import mongoose, { Schema, Document } from "mongoose";

export type OfferIcon = "percent" | "gift" | "truck" | "star" | "tag";

export interface IOffer extends Document {
  title: string;
  description?: string;
  highlight?: string;
  code?: string;
  icon: OfferIcon;
  order: number;
  isActive: boolean;
  validFrom?: Date;
  validTo?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OfferSchema = new Schema<IOffer>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    highlight: { type: String, default: "" },
    code: { type: String, default: "", uppercase: true, trim: true },
    icon: {
      type: String,
      enum: ["percent", "gift", "truck", "star", "tag"],
      default: "percent",
    },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    validFrom: { type: Date },
    validTo: { type: Date },
  },
  { timestamps: true }
);

OfferSchema.index({ isActive: 1, order: 1 });

const Offer =
  mongoose.models.Offer || mongoose.model<IOffer>("Offer", OfferSchema);

export default Offer;
