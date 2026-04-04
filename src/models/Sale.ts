import mongoose, { Schema, Document } from "mongoose";

export interface ISale extends Document {
  name: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  startDateTime: Date;
  endDateTime: Date;
  applyTo: "all" | "specific";
  categories: mongoose.Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SaleSchema = new Schema<ISale>(
  {
    name: { type: String, required: true, trim: true },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    discountValue: { type: Number, required: true, min: 0 },
    startDateTime: { type: Date, required: true },
    endDateTime: { type: Date, required: true },
    applyTo: {
      type: String,
      enum: ["all", "specific"],
      default: "all",
    },
    categories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

SaleSchema.index({ isActive: 1, startDateTime: 1, endDateTime: 1 });

const Sale =
  mongoose.models.Sale || mongoose.model<ISale>("Sale", SaleSchema);

export default Sale;
