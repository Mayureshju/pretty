"use client";

import React, { useState, useEffect, useCallback } from "react";
import Modal from "@/components/admin/shared/Modal";
import LoadingSkeleton from "@/components/admin/shared/LoadingSkeleton";
import toast from "react-hot-toast";

interface PageSeoItem {
  _id: string;
  pageSlug: string;
  pageLabel: string;
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
}

export default function SeoPage() {
  const [pages, setPages] = useState<PageSeoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<PageSeoItem | null>(null);
  const [form, setForm] = useState({
    metaTitle: "",
    metaDescription: "",
    ogTitle: "",
    ogDescription: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/page-seo");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPages(data.pages);
    } catch {
      toast.error("Failed to load SEO data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  function openEditModal(page: PageSeoItem) {
    setEditingPage(page);
    setForm({
      metaTitle: page.metaTitle || "",
      metaDescription: page.metaDescription || "",
      ogTitle: page.ogTitle || "",
      ogDescription: page.ogDescription || "",
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPage) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/page-seo/${editingPage._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save SEO");
        return;
      }

      toast.success("SEO updated for " + editingPage.pageLabel);
      setModalOpen(false);
      fetchPages();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  function getStatus(page: PageSeoItem) {
    if (page.metaTitle && page.metaDescription) return "complete";
    if (page.metaTitle || page.metaDescription) return "partial";
    return "empty";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1C2120]">SEO Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage meta titles, descriptions, and Open Graph tags for all static
          pages
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton type="table" rows={10} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Page
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Meta Title
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Meta Description
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => {
                  const status = getStatus(page);

                  return (
                    <tr
                      key={page._id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#1C2120]">
                          {page.pageLabel}
                        </p>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                          /{page.pageSlug === "home" ? "" : page.pageSlug}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {page.metaTitle ? (
                          <p className="text-gray-700 line-clamp-1 max-w-xs">
                            {page.metaTitle}
                          </p>
                        ) : (
                          <span className="text-gray-300 italic">
                            Using default
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {page.metaDescription ? (
                          <p className="text-gray-700 line-clamp-1 max-w-xs">
                            {page.metaDescription}
                          </p>
                        ) : (
                          <span className="text-gray-300 italic">
                            Using default
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            status === "complete"
                              ? "bg-green-50 text-green-700"
                              : status === "partial"
                              ? "bg-yellow-50 text-yellow-700"
                              : "bg-gray-50 text-gray-400"
                          }`}
                        >
                          {status === "complete"
                            ? "Custom"
                            : status === "partial"
                            ? "Partial"
                            : "Default"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEditModal(page)}
                          className="text-xs font-medium text-[#737530] hover:text-[#4C4D27] transition-colors"
                        >
                          Edit SEO
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`SEO — ${editingPage?.pageLabel || ""}`}
        size="lg"
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                document
                  .getElementById("seo-form")
                  ?.dispatchEvent(
                    new Event("submit", { cancelable: true, bubbles: true })
                  )
              }
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-[#737530] rounded-lg hover:bg-[#4C4D27] transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </>
        }
      >
        <form id="seo-form" onSubmit={handleSubmit} className="space-y-5">
          {/* Info */}
          <div className="bg-[#F7F8F1] rounded-lg p-3 text-[12px] text-[#555]">
            Leave fields empty to use the default hardcoded values. Only fill in
            what you want to override.
          </div>

          {/* Meta Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meta Title
            </label>
            <input
              type="text"
              value={form.metaTitle}
              onChange={(e) =>
                setForm({ ...form, metaTitle: e.target.value })
              }
              placeholder="Page title shown in browser tab & search results"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-[#737530] focus:ring-1 focus:ring-[#737530]/20 focus:outline-none transition-colors"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              {form.metaTitle.length}/60 characters (recommended: 50-60)
            </p>
          </div>

          {/* Meta Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meta Description
            </label>
            <textarea
              value={form.metaDescription}
              onChange={(e) =>
                setForm({ ...form, metaDescription: e.target.value })
              }
              placeholder="Short description shown in search engine results"
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-[#737530] focus:ring-1 focus:ring-[#737530]/20 focus:outline-none transition-colors resize-none"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              {form.metaDescription.length}/160 characters (recommended:
              120-160)
            </p>
          </div>

          <hr className="border-gray-100" />

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Open Graph (Social Sharing)
          </p>

          {/* OG Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              OG Title
            </label>
            <input
              type="text"
              value={form.ogTitle}
              onChange={(e) =>
                setForm({ ...form, ogTitle: e.target.value })
              }
              placeholder="Title when shared on Facebook/WhatsApp (falls back to meta title)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-[#737530] focus:ring-1 focus:ring-[#737530]/20 focus:outline-none transition-colors"
            />
          </div>

          {/* OG Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              OG Description
            </label>
            <textarea
              value={form.ogDescription}
              onChange={(e) =>
                setForm({ ...form, ogDescription: e.target.value })
              }
              placeholder="Description when shared on social media (falls back to meta description)"
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-[#737530] focus:ring-1 focus:ring-[#737530]/20 focus:outline-none transition-colors resize-none"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
