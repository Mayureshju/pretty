"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

interface CategoryOption {
  _id: string;
  name: string;
}

interface VariantRow {
  label: string;
  price: number | string;
  salePrice: number | string;
}

interface AddonRow {
  name: string;
  price: number | string;
}

interface ImageRow {
  url: string;
  alt: string;
}

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-[#0E4D65] focus:ring-1 focus:ring-[#0E4D65]/20 outline-none transition-colors";
const labelClass = "text-sm font-medium text-[#464646] mb-1.5 block";
const cardClass = "bg-white rounded-xl border border-gray-100 p-6";

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [sku, setSku] = useState("");
  const [regularPrice, setRegularPrice] = useState<number | string>("");
  const [salePrice, setSalePrice] = useState<number | string>("");
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [deliveryInfo, setDeliveryInfo] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [images, setImages] = useState<ImageRow[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [addons, setAddons] = useState<AddonRow[]>([]);

  // Fetch categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/admin/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || data || []);
        }
      } catch {
        // Categories may not be available yet
      }
    }
    loadCategories();
  }, []);

  // Image rows
  function addImage() {
    setImages([...images, { url: "", alt: "" }]);
  }
  function removeImage(index: number) {
    setImages(images.filter((_, i) => i !== index));
  }
  function updateImage(index: number, field: keyof ImageRow, value: string) {
    const updated = [...images];
    updated[index] = { ...updated[index], [field]: value };
    setImages(updated);
  }

  // Variant rows
  function addVariant() {
    setVariants([...variants, { label: "", price: "", salePrice: "" }]);
  }
  function removeVariant(index: number) {
    setVariants(variants.filter((_, i) => i !== index));
  }
  function updateVariant(
    index: number,
    field: keyof VariantRow,
    value: string
  ) {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  }

  // Addon rows
  function addAddon() {
    setAddons([...addons, { name: "", price: "" }]);
  }
  function removeAddon(index: number) {
    setAddons(addons.filter((_, i) => i !== index));
  }
  function updateAddon(index: number, field: keyof AddonRow, value: string) {
    const updated = [...addons];
    updated[index] = { ...updated[index], [field]: value };
    setAddons(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!regularPrice || Number(regularPrice) < 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setSaving(true);

    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        pricing: {
          regularPrice: Number(regularPrice),
          salePrice: salePrice ? Number(salePrice) : null,
        },
        isActive,
        isFeatured,
      };

      if (description.trim()) body.description = description.trim();
      if (shortDescription.trim())
        body.shortDescription = shortDescription.trim();
      if (sku.trim()) body.sku = sku.trim();
      if (category) body.category = category;
      if (deliveryInfo.trim()) body.deliveryInfo = deliveryInfo.trim();

      // Tags
      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      if (tagList.length > 0) body.tags = tagList;

      // SEO
      if (metaTitle.trim() || metaDescription.trim()) {
        body.seo = {
          ...(metaTitle.trim() && { metaTitle: metaTitle.trim() }),
          ...(metaDescription.trim() && {
            metaDescription: metaDescription.trim(),
          }),
        };
      }

      // Images
      const validImages = images
        .filter((img) => img.url.trim())
        .map((img, i) => ({
          url: img.url.trim(),
          alt: img.alt.trim() || undefined,
          order: i,
        }));
      if (validImages.length > 0) body.images = validImages;

      // Variants
      const validVariants = variants
        .filter((v) => v.label.trim() && v.price)
        .map((v) => ({
          label: v.label.trim(),
          price: Number(v.price),
          salePrice: v.salePrice ? Number(v.salePrice) : null,
          stock: 0,
        }));
      if (validVariants.length > 0) {
        body.variants = validVariants;
        body.type = "variable";
      }

      // Addons
      const validAddons = addons
        .filter((a) => a.name.trim() && a.price)
        .map((a) => ({
          name: a.name.trim(),
          price: Number(a.price),
        }));
      if (validAddons.length > 0) body.addons = validAddons;

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create product");
      }

      toast.success("Product created successfully");
      router.push("/admin/products");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create product"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#0E4D65] transition-colors mb-2"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 12L6 8L10 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to Products
          </Link>
          <h1 className="text-2xl font-bold text-[#1C2120]">
            Add New Product
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (col-span-2) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className={cardClass}>
              <h2 className="text-base font-semibold text-[#1C2120] mb-4">
                Basic Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className={labelClass}>
                    Product Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Red Rose Bouquet"
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="description" className={labelClass}>
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Full product description..."
                    rows={4}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="shortDescription" className={labelClass}>
                    Short Description
                  </label>
                  <textarea
                    id="shortDescription"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="Brief summary for product listings..."
                    rows={2}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="sku" className={labelClass}>
                    SKU
                  </label>
                  <input
                    id="sku"
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g., RRB-001"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className={cardClass}>
              <h2 className="text-base font-semibold text-[#1C2120] mb-4">
                Pricing
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="regularPrice" className={labelClass}>
                    Regular Price *
                  </label>
                  <input
                    id="regularPrice"
                    type="number"
                    value={regularPrice}
                    onChange={(e) => setRegularPrice(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="salePrice" className={labelClass}>
                    Sale Price
                  </label>
                  <input
                    id="salePrice"
                    type="number"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="Optional"
                    min="0"
                    step="0.01"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Images */}
            <div className={cardClass}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-[#1C2120]">
                  Images
                </h2>
                <button
                  type="button"
                  onClick={addImage}
                  className="inline-flex items-center gap-1 text-sm text-[#0E4D65] hover:text-[#0a3d52] font-medium transition-colors"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8 3.33334V12.6667M3.33334 8H12.6667"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Add Image
                </button>
              </div>
              {images.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No images added yet. Click &quot;Add Image&quot; to add image
                  URLs.
                </p>
              ) : (
                <div className="space-y-3">
                  {images.map((img, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-1 space-y-2">
                        <input
                          type="url"
                          value={img.url}
                          onChange={(e) =>
                            updateImage(index, "url", e.target.value)
                          }
                          placeholder="Image URL"
                          className={inputClass}
                        />
                        <input
                          type="text"
                          value={img.alt}
                          onChange={(e) =>
                            updateImage(index, "alt", e.target.value)
                          }
                          placeholder="Alt text (optional)"
                          className={inputClass}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="mt-2 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M4 4L12 12M4 12L12 4"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Variants */}
            <div className={cardClass}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-[#1C2120]">
                  Variants
                </h2>
                <button
                  type="button"
                  onClick={addVariant}
                  className="inline-flex items-center gap-1 text-sm text-[#0E4D65] hover:text-[#0a3d52] font-medium transition-colors"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8 3.33334V12.6667M3.33334 8H12.6667"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Add Variant
                </button>
              </div>
              {variants.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No variants. Add variants for different sizes or styles.
                </p>
              ) : (
                <div className="space-y-3">
                  {variants.map((v, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <input
                        type="text"
                        value={v.label}
                        onChange={(e) =>
                          updateVariant(index, "label", e.target.value)
                        }
                        placeholder="Label (e.g., Small)"
                        className={`${inputClass} flex-1`}
                      />
                      <input
                        type="number"
                        value={v.price}
                        onChange={(e) =>
                          updateVariant(index, "price", e.target.value)
                        }
                        placeholder="Price"
                        min="0"
                        step="0.01"
                        className={`${inputClass} w-28`}
                      />
                      <input
                        type="number"
                        value={v.salePrice}
                        onChange={(e) =>
                          updateVariant(index, "salePrice", e.target.value)
                        }
                        placeholder="Sale Price"
                        min="0"
                        step="0.01"
                        className={`${inputClass} w-28`}
                      />
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M4 4L12 12M4 12L12 4"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Addons */}
            <div className={cardClass}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-[#1C2120]">
                  Add-ons
                </h2>
                <button
                  type="button"
                  onClick={addAddon}
                  className="inline-flex items-center gap-1 text-sm text-[#0E4D65] hover:text-[#0a3d52] font-medium transition-colors"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8 3.33334V12.6667M3.33334 8H12.6667"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Add Add-on
                </button>
              </div>
              {addons.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No add-ons. Add extras like chocolates, greeting cards, etc.
                </p>
              ) : (
                <div className="space-y-3">
                  {addons.map((a, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <input
                        type="text"
                        value={a.name}
                        onChange={(e) =>
                          updateAddon(index, "name", e.target.value)
                        }
                        placeholder="Add-on name"
                        className={`${inputClass} flex-1`}
                      />
                      <input
                        type="number"
                        value={a.price}
                        onChange={(e) =>
                          updateAddon(index, "price", e.target.value)
                        }
                        placeholder="Price"
                        min="0"
                        step="0.01"
                        className={`${inputClass} w-28`}
                      />
                      <button
                        type="button"
                        onClick={() => removeAddon(index)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M4 4L12 12M4 12L12 4"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SEO */}
            <div className={cardClass}>
              <h2 className="text-base font-semibold text-[#1C2120] mb-4">
                SEO
              </h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="metaTitle" className={labelClass}>
                    Meta Title
                  </label>
                  <input
                    id="metaTitle"
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="SEO title"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="metaDescription" className={labelClass}>
                    Meta Description
                  </label>
                  <textarea
                    id="metaDescription"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="SEO description"
                    rows={3}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (col-span-1) */}
          <div className="space-y-6">
            {/* Status */}
            <div className={cardClass}>
              <h2 className="text-base font-semibold text-[#1C2120] mb-4">
                Status
              </h2>
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-[#464646]">Active</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isActive}
                    onClick={() => setIsActive(!isActive)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isActive ? "bg-[#0E4D65]" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isActive ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-[#464646]">Featured</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isFeatured}
                    onClick={() => setIsFeatured(!isFeatured)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isFeatured ? "bg-[#0E4D65]" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isFeatured ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </label>
              </div>
            </div>

            {/* Category */}
            <div className={cardClass}>
              <h2 className="text-base font-semibold text-[#1C2120] mb-4">
                Category
              </h2>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClass}
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div className={cardClass}>
              <h2 className="text-base font-semibold text-[#1C2120] mb-4">
                Tags
              </h2>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Comma-separated tags"
                className={inputClass}
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Separate tags with commas (e.g., roses, birthday, premium)
              </p>
            </div>

            {/* Delivery Info */}
            <div className={cardClass}>
              <h2 className="text-base font-semibold text-[#1C2120] mb-4">
                Delivery Info
              </h2>
              <textarea
                value={deliveryInfo}
                onChange={(e) => setDeliveryInfo(e.target.value)}
                placeholder="Delivery details..."
                rows={3}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/products"
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#0E4D65] hover:bg-[#0a3d52] text-white rounded-lg px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Product"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
