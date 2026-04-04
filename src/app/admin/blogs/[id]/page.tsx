"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import LoadingSkeleton from "@/components/admin/shared/LoadingSkeleton";
import RichTextEditor from "@/components/admin/shared/RichTextEditor";

interface BlogData {
  _id: string;
  title: string;
  content?: string;
  excerpt?: string;
  image?: string;
  author?: string;
  category?: string;
  tags: string[];
  isPublished: boolean;
  seo: {
    metaTitle?: string;
    metaDescription?: string;
  };
}

export default function EditBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    async function fetchBlog() {
      try {
        const res = await fetch(`/api/admin/blogs/${id}`);
        if (!res.ok) throw new Error("Failed to fetch blog");

        const data: BlogData = await res.json();
        setForm({
          title: data.title,
          content: data.content || "",
          excerpt: data.excerpt || "",
          image: data.image || "",
          author: data.author || "",
          category: data.category || "",
          tags: data.tags?.join(", ") || "",
          isPublished: data.isPublished,
          seo: {
            metaTitle: data.seo?.metaTitle || "",
            metaDescription: data.seo?.metaDescription || "",
          },
        });
      } catch {
        toast.error("Failed to load blog post");
        router.push("/admin/blogs");
      } finally {
        setLoading(false);
      }
    }
    fetchBlog();
  }, [id, router]);

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
        content: form.content,
        excerpt: form.excerpt,
        image: form.image || undefined,
        author: form.author,
        category: form.category,
        isPublished: form.isPublished,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        seo: {
          metaTitle: form.seo.metaTitle,
          metaDescription: form.seo.metaDescription,
        },
      };

      const res = await fetch(`/api/admin/blogs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update blog");
      }

      toast.success("Blog post updated successfully");
      router.push("/admin/blogs");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update blog"
      );
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-[#0E4D65] focus:ring-1 focus:ring-[#0E4D65]/20 outline-none";
  const labelClass = "text-sm font-medium text-[#464646] mb-1.5 block";

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1C2120]">Edit Blog Post</h1>
            <p className="text-sm text-gray-500 mt-1">Loading...</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <LoadingSkeleton rows={6} type="form" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2120]">Edit Blog Post</h1>
          <p className="text-sm text-gray-500 mt-1">
            Update your blog post details
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
            className="bg-[#0E4D65] hover:bg-[#0a3d52] text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Update Post"}
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
                    form.isPublished ? "bg-[#0E4D65]" : "bg-gray-200"
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
