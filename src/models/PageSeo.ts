import mongoose, { Schema, Document } from "mongoose";

export interface IPageSeo extends Document {
  pageSlug: string;
  pageLabel: string;
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  createdAt: Date;
  updatedAt: Date;
}

const PageSeoSchema = new Schema<IPageSeo>(
  {
    pageSlug: { type: String, required: true, unique: true },
    pageLabel: { type: String, required: true },
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    ogTitle: { type: String, default: "" },
    ogDescription: { type: String, default: "" },
  },
  { timestamps: true }
);

const PageSeo =
  mongoose.models.PageSeo ||
  mongoose.model<IPageSeo>("PageSeo", PageSeoSchema);

export default PageSeo;
