"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import StatusBadge from "@/components/admin/shared/StatusBadge";
import EmptyState from "@/components/admin/shared/EmptyState";
import LoadingSkeleton from "@/components/admin/shared/LoadingSkeleton";
import ConfirmDialog from "@/components/admin/shared/ConfirmDialog";
import Modal from "@/components/admin/shared/Modal";

interface BannerItem {
  _id: string;
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  position: "hero" | "sidebar" | "popup";
  order: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface BannerForm {
  title: string;
  subtitle: string;
  image: string;
  link: string;
  position: "hero" | "sidebar" | "popup";
  order: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

const defaultForm: BannerForm = {
  title: "",
  subtitle: "",
  image: "",
  link: "",
  position: "hero",
  order: 0,
  isActive: true,
  startDate: "",
  endDate: "",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BannerItem | null>(null);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/banners");
      if (!res.ok) throw new Error("Failed to fetch banners");

      const data = await res.json();
      setBanners(data.banners);
    } catch {
      toast.error("Failed to load banners");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  function openAddModal() {
    setEditingBanner(null);
    setForm(defaultForm);
    setModalOpen(true);
  }

  function openEditModal(banner: BannerItem) {
    setEditingBanner(banner);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle || "",
      image: banner.image,
      link: banner.link || "",
      position: banner.position,
      order: banner.order,
      isActive: banner.isActive,
      startDate: banner.startDate
        ? new Date(banner.startDate).toISOString().split("T")[0]
        : "",
      endDate: banner.endDate
        ? new Date(banner.endDate).toISOString().split("T")[0]
        : "",
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingBanner(null);
    setForm(defaultForm);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        image: form.image,
        position: form.position,
        order: form.order,
        isActive: form.isActive,
      };
      if (form.subtitle) payload.subtitle = form.subtitle;
      if (form.link) payload.link = form.link;
      if (form.startDate) payload.startDate = form.startDate;
      if (form.endDate) payload.endDate = form.endDate;

      const url = editingBanner
        ? `/api/admin/banners/${editingBanner._id}`
        : "/api/admin/banners";
      const method = editingBanner ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save banner");
      }

      toast.success(
        editingBanner
          ? "Banner updated successfully"
          : "Banner created successfully"
      );
      closeModal();
      fetchBanners();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save banner"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/admin/banners/${deleteTarget._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete banner");

      toast.success("Banner deleted successfully");
      setDeleteTarget(null);
      fetchBanners();
    } catch {
      toast.error("Failed to delete banner");
    }
  }

  const inputClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-[#B5748A] focus:ring-1 focus:ring-[#B5748A]/20 outline-none";
  const labelClass = "text-sm font-medium text-[#464646] mb-1.5 block";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2120]">Banners</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage promotional banners for your store
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 bg-[#B5748A] hover:bg-[#9E6377] text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 3.75V14.25M3.75 9H14.25"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Add Banner
        </button>
      </div>

      {/* Banner Grid */}
      {loading ? (
        <LoadingSkeleton rows={6} type="cards" />
      ) : banners.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100">
          <EmptyState
            title="No banners yet"
            description="Create your first banner to start promoting on your store."
            action={{ label: "Add Banner", onClick: openAddModal }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((banner) => (
            <div
              key={banner._id}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden"
            >
              {/* Image Preview */}
              <div className="aspect-video relative bg-gray-100">
                <Image
                  src={banner.image}
                  alt={banner.title}
                  fill
                  className="object-cover rounded-t-xl"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#1C2120] truncate">
                    {banner.title}
                  </h3>
                  {banner.subtitle && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {banner.subtitle}
                    </p>
                  )}
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#F0F7FA] text-[#B5748A] capitalize">
                    {banner.position}
                  </span>
                  <StatusBadge
                    status={banner.isActive ? "active" : "inactive"}
                    size="sm"
                  />
                </div>

                {/* Date Range */}
                {(banner.startDate || banner.endDate) && (
                  <p className="text-xs text-gray-400">
                    {banner.startDate && formatDate(banner.startDate)}
                    {banner.startDate && banner.endDate && " - "}
                    {banner.endDate && formatDate(banner.endDate)}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
                  <button
                    onClick={() => openEditModal(banner)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M8 13.3333H14M11 2.33334C11.2652 2.06813 11.6249 1.91913 12 1.91913C12.1857 1.91913 12.3696 1.95571 12.5412 2.02682C12.7128 2.09793 12.8687 2.20225 13 2.33334C13.1313 2.46443 13.2356 2.62038 13.3067 2.79197C13.3778 2.96357 13.4144 3.14744 13.4144 3.33334C13.4144 3.51924 13.3778 3.70311 13.3067 3.87471C13.2356 4.0463 13.1313 4.20225 13 4.33334L4.66667 12.6667L2 13.3333L2.66667 10.6667L11 2.33334Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(banner)}
                    className="flex items-center justify-center p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2 4H3.33333H14M12.6667 4V13.3333C12.6667 13.687 12.5262 14.0261 12.2761 14.2761C12.0261 14.5262 11.687 14.6667 11.3333 14.6667H4.66667C4.31305 14.6667 3.97391 14.5262 3.72386 14.2761C3.47381 14.0261 3.33333 13.687 3.33333 13.3333V4M5.33333 4V2.66667C5.33333 2.31305 5.47381 1.97391 5.72386 1.72386C5.97391 1.47381 6.31305 1.33334 6.66667 1.33334H9.33333C9.68696 1.33334 10.0261 1.47381 10.2761 1.72386C10.5262 1.97391 10.6667 2.31305 10.6667 2.66667V4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingBanner ? "Edit Banner" : "Add Banner"}
        size="lg"
        footer={
          <>
            <button
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit as unknown as () => void}
              disabled={saving}
              className="px-4 py-2.5 text-sm font-medium text-white bg-[#B5748A] hover:bg-[#9E6377] rounded-lg transition-colors disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingBanner
                ? "Update Banner"
                : "Create Banner"}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className={labelClass}>
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
              placeholder="Banner title"
              required
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className={labelClass}>Subtitle</label>
            <input
              type="text"
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              className={inputClass}
              placeholder="Optional subtitle"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className={labelClass}>
              Image URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              className={inputClass}
              placeholder="https://example.com/banner.jpg"
              required
            />
            {form.image && (
              <div className="mt-2 aspect-video relative bg-gray-100 rounded-lg overflow-hidden max-h-40">
                <Image
                  src={form.image}
                  alt="Preview"
                  fill
                  className="object-cover"
                  sizes="400px"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          {/* Link */}
          <div>
            <label className={labelClass}>Link</label>
            <input
              type="text"
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              className={inputClass}
              placeholder="/collections/roses or https://..."
            />
          </div>

          {/* Position + Order row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Position</label>
              <select
                value={form.position}
                onChange={(e) =>
                  setForm({
                    ...form,
                    position: e.target.value as "hero" | "sidebar" | "popup",
                  })
                }
                className={inputClass}
              >
                <option value="hero">Hero</option>
                <option value="sidebar">Sidebar</option>
                <option value="popup">Popup</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Order</label>
              <input
                type="number"
                value={form.order}
                onChange={(e) =>
                  setForm({ ...form, order: parseInt(e.target.value) || 0 })
                }
                className={inputClass}
                min={0}
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={form.isActive}
              onClick={() => setForm({ ...form, isActive: !form.isActive })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                form.isActive ? "bg-[#B5748A]" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  form.isActive ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <label className="text-sm font-medium text-[#464646]">
              Active
            </label>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Banner"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
