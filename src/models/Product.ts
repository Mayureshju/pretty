import mongoose, { Schema, Document } from "mongoose";

export interface IProductImage {
  url: string;
  alt?: string;
  order: number;
}

export interface IProductVariant {
  label: string;
  sku?: string;
  price: number;
  salePrice?: number;
  image?: string;
  stock: number;
}

export interface IProductAddon {
  name: string;
  price: number;
  image?: string;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  sku?: string;
  type: "simple" | "variable";
  pricing: {
    regularPrice: number;
    salePrice?: number;
    currentPrice: number;
  };
  inventory: {
    stock: number;
    stockStatus: "instock" | "outofstock" | "onbackorder";
    trackStock: boolean;
  };
  images: IProductImage[];
  categories: mongoose.Types.ObjectId[];
  order: number;
  tags: string[];
  variants: IProductVariant[];
  addons: IProductAddon[];
  metrics: {
    ratingCount: number;
    averageRating: number;
    totalSales: number;
  };
  seo: {
    metaTitle?: string;
    metaDescription?: string;
  };
  isActive: boolean;
  isFeatured: boolean;
  isAddon: boolean;
  deliveryInfo?: string;
  wpPostId?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductImageSchema = new Schema<IProductImage>(
  {
    url: { type: String, required: true },
    alt: { type: String },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const ProductVariantSchema = new Schema<IProductVariant>(
  {
    label: { type: String, required: true },
    sku: { type: String },
    price: { type: Number, required: true },
    salePrice: { type: Number },
    image: { type: String },
    stock: { type: Number, default: 0 },
  },
  { _id: false }
);

const ProductAddonSchema = new Schema<IProductAddon>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    shortDescription: { type: String },
    sku: { type: String },
    type: {
      type: String,
      enum: ["simple", "variable"],
      default: "simple",
    },
    pricing: {
      regularPrice: { type: Number, required: true },
      salePrice: { type: Number },
      currentPrice: { type: Number, required: true },
    },
    inventory: {
      stock: { type: Number, default: 0 },
      stockStatus: {
        type: String,
        enum: ["instock", "outofstock", "onbackorder"],
        default: "instock",
      },
      trackStock: { type: Boolean, default: false },
    },
    images: [ProductImageSchema],
    categories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    order: { type: Number, default: 0 },
    tags: [{ type: String }],
    variants: [ProductVariantSchema],
    addons: [ProductAddonSchema],
    metrics: {
      ratingCount: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
      totalSales: { type: Number, default: 0 },
    },
    seo: {
      metaTitle: { type: String },
      metaDescription: { type: String },
    },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isAddon: { type: Boolean, default: false },
    deliveryInfo: { type: String },
    wpPostId: { type: Number },
  },
  { timestamps: true }
);

// Indexes
ProductSchema.index({ categories: 1 });
ProductSchema.index({ order: 1 });
ProductSchema.index({ isActive: 1, isFeatured: -1 });
ProductSchema.index({ sku: 1 }, { sparse: true });
ProductSchema.index({ name: "text", description: "text" });

// Pre-save: auto-generate slug from name if not provided
ProductSchema.pre("save", function () {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  // For variable products, set pricing from lowest variant
  if (this.type === "variable" && this.variants && this.variants.length > 0) {
    const validVariants = this.variants.filter((v) => v.price > 0);
    if (validVariants.length > 0) {
      const getEffective = (v: IProductVariant) =>
        v.salePrice && v.salePrice > 0 ? v.salePrice : v.price;
      const lowestVariant = validVariants.reduce((min, v) =>
        getEffective(v) < getEffective(min) ? v : min
      );
      this.pricing.regularPrice = lowestVariant.price;
      this.pricing.salePrice = lowestVariant.salePrice && lowestVariant.salePrice > 0
        ? lowestVariant.salePrice : undefined;
      this.pricing.currentPrice = getEffective(lowestVariant);
    }
  } else if (this.pricing) {
    // Simple products: currentPrice = salePrice || regularPrice
    this.pricing.currentPrice =
      this.pricing.salePrice || this.pricing.regularPrice;
  }
});

const Product =
  mongoose.models.Product ||
  mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
