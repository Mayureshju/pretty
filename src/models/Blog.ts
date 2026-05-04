import mongoose, { Schema, Document } from "mongoose";

export interface IBlog extends Document {
  title: string;
  slug: string;
  content?: string;
  excerpt?: string;
  image?: string;
  author?: string;
  category?: string;
  tags: string[];
  isPublished: boolean;
  views: number;
  seo: {
    metaTitle?: string;
    metaDescription?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    content: { type: String },
    excerpt: { type: String },
    image: { type: String },
    author: { type: String },
    category: { type: String },
    tags: [{ type: String }],
    isPublished: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    seo: {
      metaTitle: { type: String },
      metaDescription: { type: String },
    },
  },
  { timestamps: true }
);

BlogSchema.index({ isPublished: 1, createdAt: -1 });

function slugFromTitle(title: string): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug;
}

// Must run on `validate`, not `save`: required-field validation happens before save hooks.
BlogSchema.pre("validate", function () {
  if (this.slug) {
    this.slug = String(this.slug).toLowerCase().trim();
  } else if (this.title) {
    const base = slugFromTitle(this.title);
    this.slug = base || `post-${Date.now()}`;
  }
});

const Blog =
  mongoose.models.Blog || mongoose.model<IBlog>("Blog", BlogSchema);

export default Blog;
