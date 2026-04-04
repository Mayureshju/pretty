"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import RichTextEditor from "@/components/admin/shared/RichTextEditor";

interface CategoryOption {
  _id: string;
  name: string;
}

interface VariantRow {
  label: string;
  price: number | string;
  salePrice: number | string;
  image: string;
  stock: number | string;
  sku: string;
}

interface AddonRow {
  name: string;
  price: number | string;
  image: string;
}

interface ImageRow {
  url: string;
  alt: string;
}

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-[#C48B9F] focus:ring-1 focus:ring-[#C48B9F]/20 outline-none transition-colors";
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
  const [isAddon, setIsAddon] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [tags, setTags] = useState("");
  const [deliveryInfo, setDeliveryInfo] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [images, setImages] = useState<ImageRow[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [addons, setAddons] = useState<AddonRow[]>([]);
  const [addonSearch, setAddonSearch] = useState("");
  const [addonResults, setAddonResults] = useState<{ _id: string; name: string; pricing: { currentPrice: number }; images: { url: string }[] }[]>([]);
  const [showAddonDropdown, setShowAddonDropdown] = useState(false);

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
    setVariants([...variants, { label: "", price: "", salePrice: "", image: "", stock: 0, sku: "" }]);
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

  // Addon search + picker
  function removeAddon(index: number) {
    setAddons(addons.filter((_, i) => i !== index));
  }
  async function searchAddonProducts(query: string) {
    setAddonSearch(query);
    if (query.length < 2) { setAddonResults([]); setShowAddonDropdown(false); return; }
    try {
      const res = await fetch(`/api/admin/products?isAddon=true&search=${encodeURIComponent(query)}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setAddonResults(data.products || []);
        setShowAddonDropdown(true);
      }
    } catch { /* ignore */ }
  }
  function selectAddonProduct(product: { name: string; pricing: { currentPrice: number }; images: { url: string }[] }) {
    setAddons([...addons, {
      name: product.name,
      price: product.pricing.currentPrice,
      image: product.images?.[0]?.url || "",
    }]);
    setAddonSearch("");
    setAddonResults([]);
    setShowAddonDropdown(false);
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
        isAddon,
      };

      if (description.trim()) body.description = description.trim();
      if (shortDescription.trim())
        body.shortDescription = shortDescription.trim();
      if (sku.trim()) body.sku = sku.trim();
      if (selectedCategories.length > 0) body.categories = selectedCategories;
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
          image: v.image.trim() || undefined,
          sku: v.sku.trim() || undefined,
          stock: v.stock ? Number(v.stock) : 0,
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
          image: a.image || undefined,
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
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#C48B9F] transition-colors mb-2"
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
                  <RichTextEditor
                    value={description}
                    onChange={setDescription}
                    placeholder="Full product description..."
                    minHeight="200px"
                  />
                </div>
                <div>
                  <label htmlFor="shortDescription" className={labelClass}>
                    Short Description
                  </label>
                  <RichTextEditor
                    value={shortDescription}
                    onChange={setShortDescription}
                    placeholder="Brief summary for product listings..."
                    minHeight="100px"
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
                  className="inline-flex items-center gap-1 text-sm text-[#C48B9F] hover:text-[#A87389] font-medium transition-colors"
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
                  className="inline-flex items-center gap-1 text-sm text-[#C48B9F] hover:text-[#A87389] font-medium transition-colors"
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
                <div className="space-y-4">
                  {variants.map((v, index) => (
                    <div key={index} className="border border-gray-100 rounded-lg p-4 relative">
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 4L12 12M4 12L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Label *</label>
                          <input type="text" value={v.label} onChange={(e) => updateVariant(index, "label", e.target.value)} placeholder="e.g., Small" className={inputClass} />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Price *</label>
                          <input type="number" value={v.price} onChange={(e) => updateVariant(index, "price", e.target.value)} placeholder="0" min="0" step="0.01" className={inputClass} />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Sale Price</label>
                          <input type="number" value={v.salePrice} onChange={(e) => updateVariant(index, "salePrice", e.target.value)} placeholder="Optional" min="0" step="0.01" className={inputClass} />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">SKU</label>
                          <input type="text" value={v.sku} onChange={(e) => updateVariant(index, "sku", e.target.value)} placeholder="Optional" className={inputClass} />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Stock</label>
                          <input type="number" value={v.stock} onChange={(e) => updateVariant(index, "stock", e.target.value)} placeholder="0" min="0" className={inputClass} />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Image URL</label>
                          <input type="url" value={v.image} onChange={(e) => updateVariant(index, "image", e.target.value)} placeholder="Optional" className={inputClass} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Addons */}
            <div className={cardClass}>
              <h2 className="text-base font-semibold text-[#1C2120] mb-4">
                Add-ons
              </h2>
              <p className="text-xs text-gray-400 mb-3">
                Search for products marked as add-ons to attach them.
              </p>
              {/* Search picker */}
              <div className="relative mb-4">
                <input
                  type="text"
                  value={addonSearch}
                  onChange={(e) => searchAddonProducts(e.target.value)}
                  onFocus={() => addonResults.length > 0 && setShowAddonDropdown(true)}
                  placeholder="Search addon products..."
                  className={inputClass}
                />
                {showAddonDropdown && addonResults.length > 0 && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowAddonDropdown(false)} />
                    <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white rounded-lg shadow-xl border border-gray-100 max-h-48 overflow-y-auto">
                      {addonResults.map((p) => (
                        <button
                          key={p._id}
                          type="button"
                          onClick={() => selectAddonProduct(p)}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                          {p.images?.[0]?.url && (
                            <img src={p.images[0].url} alt="" className="w-8 h-8 rounded object-cover" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#1C2120] truncate">{p.name}</p>
                            <p className="text-xs text-gray-500">&#8377; {p.pricing.currentPrice}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              {/* Selected addons */}
              {addons.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No add-ons selected. Search and pick addon products above.
                </p>
              ) : (
                <div className="space-y-2">
                  {addons.map((a, index) => (
                    <div key={index} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                      {a.image && (
                        <img src={a.image} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1C2120] truncate">{a.name}</p>
                        <p className="text-xs text-gray-500">&#8377; {Number(a.price).toLocaleString()}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAddon(index)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 4L12 12M4 12L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
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
                      isActive ? "bg-[#C48B9F]" : "bg-gray-200"
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
                      isFeatured ? "bg-[#C48B9F]" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isFeatured ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-sm text-[#464646]">Addon Product</span>
                    <p className="text-[10px] text-gray-400">Can be selected as add-on for other products</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isAddon}
                    onClick={() => setIsAddon(!isAddon)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isAddon ? "bg-amber-500" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isAddon ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </label>
              </div>
            </div>

            {/* Categories */}
            <div className={cardClass}>
              <h2 className="text-base font-semibold text-[#1C2120] mb-4">
                Categories
              </h2>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {categories.map((cat) => (
                  <label key={cat._id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories([...selectedCategories, cat._id]);
                        } else {
                          setSelectedCategories(selectedCategories.filter(id => id !== cat._id));
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-[#C48B9F] focus:ring-[#C48B9F]"
                    />
                    <span className="text-sm text-[#464646]">{cat.name}</span>
                  </label>
                ))}
              </div>
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
              className="bg-[#C48B9F] hover:bg-[#A87389] text-white rounded-lg px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Product"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
