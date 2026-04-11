import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug: string;
  image?: string;
  description?: string;
  parent?: mongoose.Types.ObjectId | null;
  order: number;
  isActive: boolean;
  productCount: number;
  wpTermId?: number;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogTitle?: string;
    ogDescription?: string;
  };
  isBanner: boolean;
  bannerImage?: string;
  displayText?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    image: { type: String },
    description: { type: String },
    parent: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    productCount: { type: Number, default: 0 },
    wpTermId: { type: Number },
    seo: {
      metaTitle: { type: String },
      metaDescription: { type: String },
      ogTitle: { type: String },
      ogDescription: { type: String },
    },
    isBanner: { type: Boolean, default: false },
    bannerImage: { type: String },
    displayText: { type: String },
  },
  { timestamps: true }
);

// Indexes
CategorySchema.index({ parent: 1 });
CategorySchema.index({ order: 1 });

// Pre-save: auto-generate slug from name if not provided
CategorySchema.pre("save", function () {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
});

const Category =
  mongoose.models.Category ||
  mongoose.model<ICategory>("Category", CategorySchema);

export default Category;
