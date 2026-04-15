import mongoose, { Schema, Document } from "mongoose";

export interface IQuote extends Document {
  text: string;
  author: string;
  category: string;
  color: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuoteSchema = new Schema<IQuote>(
  {
    text: { type: String, required: true },
    author: { type: String, default: "" },
    category: { type: String, required: true },
    color: { type: String, default: "#737530" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

QuoteSchema.index({ category: 1, order: 1 });
QuoteSchema.index({ isActive: 1 });

const Quote =
  mongoose.models.Quote || mongoose.model<IQuote>("Quote", QuoteSchema);

export default Quote;
