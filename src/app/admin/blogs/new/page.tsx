"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import RichTextEditor from "@/components/admin/shared/RichTextEditor";

export default function NewBlogPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    excerpt: "",
    image: "",
    author: "",
    category: "",
    tags: "",
    isPublished: false,
    seo: {
      metaTitle: "",
      metaDescription: "",
    },
  });

  function updateField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateSeo(field: string, value: string) {
    setForm((prev) => ({
      ...prev,
      seo: { ...prev.seo, [field]: value },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        isPublished: form.isPublished,
      };
      if (form.content) payload.content = form.content;
      if (form.excerpt) payload.excerpt = form.excerpt;
      if (form.image) payload.image = form.image;
      if (form.author) payload.author = form.author;
      if (form.category) payload.category = form.category;
      if (form.tags.trim()) {
        payload.tags = form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      }
      if (form.seo.metaTitle || form.seo.metaDescription) {
        payload.seo = {};
        if (form.seo.metaTitle)
          (payload.seo as Record<string, string>).metaTitle = form.seo.metaTitle;
        if (form.seo.metaDescription)
          (payload.seo as Record<string, string>).metaDescription =
            form.seo.metaDescription;
      }

      const res = await fetch("/api/admin/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create blog");
      }

      toast.success("Blog post created successfully");
      router.push("/admin/blogs");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create blog"
      );
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-[#737530] focus:ring-1 focus:ring-[#737530]/20 outline-none";
  const labelClass = "text-sm font-medium text-[#464646] mb-1.5 block";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2120]">New Blog Post</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create a new blog post for your store
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/blogs")}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit as unknown as () => void}
            disabled={saving || !form.title.trim()}
            className="bg-[#737530] hover:bg-[#4C4D27] text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Post"}
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div>
                <label className={labelClass}>
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className={inputClass}
                  placeholder="Enter blog title"
                  required
                />
              </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div>
                <label className={labelClass}>Content</label>
                <RichTextEditor
                  value={form.content}
                  onChange={(v) => updateField("content", v)}
                  placeholder="Write your blog content here..."
                  minHeight="400px"
                />
              </div>
            </div>

            {/* Excerpt */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div>
                <label className={labelClass}>Excerpt</label>
                <RichTextEditor
                  value={form.excerpt}
                  onChange={(v) => updateField("excerpt", v)}
                  placeholder="A short summary of the blog post..."
                  minHeight="100px"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-[#1C2120] mb-4">
                Status
              </h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.isPublished}
                  onClick={() =>
                    updateField("isPublished", !form.isPublished)
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.isPublished ? "bg-[#737530]" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      form.isPublished ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className="text-sm text-[#464646]">
                  {form.isPublished ? "Published" : "Draft"}
                </span>
              </div>
            </div>

            {/* Featured Image */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-[#1C2120] mb-4">
                Featured Image
              </h3>
              <div>
                <label className={labelClass}>Image URL</label>
                <input
                  type="url"
                  value={form.image}
                  onChange={(e) => updateField("image", e.target.value)}
                  className={inputClass}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            {/* Author */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-[#1C2120] mb-4">
                Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Author</label>
                  <input
                    type="text"
                    value={form.author}
                    onChange={(e) => updateField("author", e.target.value)}
                    className={inputClass}
                    placeholder="Author name"
                  />
                </div>
                <div>
                  <label className={labelClass}>Category</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => updateField("category", e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Flower Care"
                  />
                </div>
                <div>
                  <label className={labelClass}>Tags</label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => updateField("tags", e.target.value)}
                    className={inputClass}
                    placeholder="roses, bouquet, wedding (comma-separated)"
                  />
                </div>
              </div>
            </div>

            {/* SEO */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-[#1C2120] mb-4">
                SEO
              </h3>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Meta Title</label>
                  <input
                    type="text"
                    value={form.seo.metaTitle}
                    onChange={(e) => updateSeo("metaTitle", e.target.value)}
                    className={inputClass}
                    placeholder="SEO title"
                  />
                </div>
                <div>
                  <label className={labelClass}>Meta Description</label>
                  <textarea
                    value={form.seo.metaDescription}
                    onChange={(e) =>
                      updateSeo("metaDescription", e.target.value)
                    }
                    className={`${inputClass} min-h-[80px] resize-y`}
                    placeholder="SEO description"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
