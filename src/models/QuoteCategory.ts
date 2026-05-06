import mongoose, { Schema, Document } from "mongoose";

export interface IQuoteCategory extends Document {
  name: string;
  slug: string;
  color: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuoteCategorySchema = new Schema<IQuoteCategory>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    color: { type: String, default: "#737530" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

QuoteCategorySchema.index({ order: 1, name: 1 });

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

QuoteCategorySchema.pre("validate", function () {
  if (this.slug) {
    this.slug = String(this.slug).toLowerCase().trim();
  } else if (this.name) {
    const base = slugFromName(this.name);
    this.slug = base || `category-${Date.now()}`;
  }
});

const QuoteCategory =
  mongoose.models.QuoteCategory ||
  mongoose.model<IQuoteCategory>("QuoteCategory", QuoteCategorySchema);

export default QuoteCategory;
