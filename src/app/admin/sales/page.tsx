"use client";

import React, { useState, useEffect, useCallback } from "react";
import Modal from "@/components/admin/shared/Modal";
import ConfirmDialog from "@/components/admin/shared/ConfirmDialog";
import StatusBadge from "@/components/admin/shared/StatusBadge";
import EmptyState from "@/components/admin/shared/EmptyState";
import LoadingSkeleton from "@/components/admin/shared/LoadingSkeleton";
import toast from "react-hot-toast";

interface CategoryItem {
  _id: string;
  name: string;
}

interface SaleItem {
  _id: string;
  name: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  startDate: string;
  endDate: string;
  categories: CategoryItem[];
  isActive: boolean;
}

const defaultForm = {
  name: "",
  discountType: "percentage" as "percentage" | "fixed",
  discountValue: 0,
  startDate: "",
  endDate: "",
  applyTo: "all" as "all" | "specific",
  selectedCategories: [] as string[],
  isActive: true,
};

function formatDateForDisplay(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateForInput(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getSaleStatus(sale: SaleItem): string {
  const now = new Date();
  const start = new Date(sale.startDate);
  const end = new Date(sale.endDate);

  if (!sale.isActive) return "inactive";
  if (end < now) return "expired";
  if (start > now) return "scheduled";
  return "active";
}

function getDiscountLabel(sale: SaleItem): string {
  if (sale.discountType === "percentage") {
    return `${sale.discountValue}% OFF`;
  }
  return `₹${sale.discountValue} OFF`;
}

export default function SalesPage() {
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SaleItem | null>(null);

  const fetchSales = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/sales");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSales(data);
    } catch {
      toast.error("Failed to load sales");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/categories");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCategories(data);
    } catch {
      toast.error("Failed to load categories");
    }
  }, []);

  useEffect(() => {
    fetchSales();
    fetchCategories();
  }, [fetchSales, fetchCategories]);

  function openAddModal() {
    setEditingId(null);
    setForm(defaultForm);
    setModalOpen(true);
  }

  function openEditModal(sale: SaleItem) {
    setEditingId(sale._id);
    setForm({
      name: sale.name,
      discountType: sale.discountType,
      discountValue: sale.discountValue,
      startDate: formatDateForInput(sale.startDate),
      endDate: formatDateForInput(sale.endDate),
      applyTo: sale.categories.length > 0 ? "specific" : "all",
      selectedCategories: sale.categories.map((c) => c._id),
      isActive: sale.isActive,
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        name: form.name,
        discountType: form.discountType,
        discountValue: form.discountValue,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        categories: form.applyTo === "specific" ? form.selectedCategories : [],
        isActive: form.isActive,
      };

      const url = editingId
        ? `/api/admin/sales/${editingId}`
        : "/api/admin/sales";

      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save sale");
        return;
      }

      toast.success(editingId ? "Sale updated" : "Sale created");
      setModalOpen(false);
      fetchSales();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/admin/sales/${deleteTarget._id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to delete sale");
        return;
      }

      toast.success("Sale deleted");
      fetchSales();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleteTarget(null);
    }
  }

  function handleCategoryToggle(categoryId: string) {
    setForm((prev) => {
      const exists = prev.selectedCategories.includes(categoryId);
      return {
        ...prev,
        selectedCategories: exists
          ? prev.selectedCategories.filter((id) => id !== categoryId)
          : [...prev.selectedCategories, categoryId],
      };
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2120]">
            Sale Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage discounts and promotional sales
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-[#C48B9F] text-white text-sm font-medium rounded-lg hover:bg-[#0A3A4D] transition-colors flex items-center gap-2"
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
          Create Sale
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton type="cards" rows={6} />
      ) : sales.length === 0 ? (
        <EmptyState
          title="No sales yet"
          description="Create your first sale to offer discounts on your products."
          action={{ label: "Create Sale", onClick: openAddModal }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sales.map((sale) => {
            const status = getSaleStatus(sale);
            return (
              <div
                key={sale._id}
                className="bg-white rounded-xl border border-gray-100 p-5 flex gap-4 hover:shadow-sm transition-shadow"
              >
                {/* Discount badge icon */}
                <div className="flex-shrink-0">
                  <div className="w-[60px] h-[60px] rounded-lg bg-[#E3F2FD] flex items-center justify-center text-[#C48B9F]">
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="19" y1="5" x2="5" y2="19" />
                      <circle cx="6.5" cy="6.5" r="2.5" />
                      <circle cx="17.5" cy="17.5" r="2.5" />
                    </svg>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-[#1C2120] truncate">
                        {sale.name}
                      </h3>
                      <p className="text-sm font-medium text-[#C48B9F] mt-0.5">
                        {getDiscountLabel(sale)}
                      </p>
                    </div>
                    <StatusBadge status={status} size="sm" />
                  </div>

                  <div className="flex flex-col gap-1 mt-2 text-xs text-gray-500">
                    <span>
                      {formatDateForDisplay(sale.startDate)} &mdash;{" "}
                      {formatDateForDisplay(sale.endDate)}
                    </span>
                    <span>
                      {sale.categories.length > 0
                        ? sale.categories.map((c) => c.name).join(", ")
                        : "All Categories"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => openEditModal(sale)}
                      className="text-xs font-medium text-[#C48B9F] hover:text-[#0A3A4D] transition-colors"
                    >
                      Edit
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => setDeleteTarget(sale)}
                      className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Sale" : "Create Sale"}
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
                  .getElementById("sale-form")
                  ?.dispatchEvent(
                    new Event("submit", { cancelable: true, bubbles: true })
                  )
              }
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-[#C48B9F] rounded-lg hover:bg-[#0A3A4D] transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
          </>
        }
      >
        <form id="sale-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Sale Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sale Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Summer Sale"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-[#C48B9F] focus:ring-1 focus:ring-[#C48B9F]/20 focus:outline-none transition-colors"
            />
          </div>

          {/* Discount Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Type
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="discountType"
                  value="percentage"
                  checked={form.discountType === "percentage"}
                  onChange={() =>
                    setForm({ ...form, discountType: "percentage" })
                  }
                  className="w-4 h-4 text-[#C48B9F] border-gray-300 focus:ring-[#C48B9F]/20"
                />
                <span className="text-sm text-gray-700">Percentage (%)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="discountType"
                  value="fixed"
                  checked={form.discountType === "fixed"}
                  onChange={() => setForm({ ...form, discountType: "fixed" })}
                  className="w-4 h-4 text-[#C48B9F] border-gray-300 focus:ring-[#C48B9F]/20"
                />
                <span className="text-sm text-gray-700">
                  Fixed Amount (&#8377;)
                </span>
              </label>
            </div>
          </div>

          {/* Discount Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discount Value
            </label>
            <input
              type="number"
              value={form.discountValue}
              onChange={(e) =>
                setForm({
                  ...form,
                  discountValue: parseFloat(e.target.value) || 0,
                })
              }
              min={0}
              max={form.discountType === "percentage" ? 100 : undefined}
              placeholder={
                form.discountType === "percentage" ? "e.g. 20" : "e.g. 100"
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-[#C48B9F] focus:ring-1 focus:ring-[#C48B9F]/20 focus:outline-none transition-colors"
            />
          </div>

          {/* Start and End Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:border-[#C48B9F] focus:ring-1 focus:ring-[#C48B9F]/20 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:border-[#C48B9F] focus:ring-1 focus:ring-[#C48B9F]/20 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Apply To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Apply To
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="applyTo"
                  value="all"
                  checked={form.applyTo === "all"}
                  onChange={() =>
                    setForm({
                      ...form,
                      applyTo: "all",
                      selectedCategories: [],
                    })
                  }
                  className="w-4 h-4 text-[#C48B9F] border-gray-300 focus:ring-[#C48B9F]/20"
                />
                <span className="text-sm text-gray-700">All Categories</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="applyTo"
                  value="specific"
                  checked={form.applyTo === "specific"}
                  onChange={() => setForm({ ...form, applyTo: "specific" })}
                  className="w-4 h-4 text-[#C48B9F] border-gray-300 focus:ring-[#C48B9F]/20"
                />
                <span className="text-sm text-gray-700">
                  Specific Categories
                </span>
              </label>
            </div>
          </div>

          {/* Category Multi-Select */}
          {form.applyTo === "specific" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Categories
              </label>
              <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                {categories.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    No categories available
                  </p>
                ) : (
                  categories.map((cat) => (
                    <label
                      key={cat._id}
                      className="flex items-center gap-2.5 cursor-pointer hover:bg-gray-50 rounded px-2 py-1.5 -mx-1 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={form.selectedCategories.includes(cat._id)}
                        onChange={() => handleCategoryToggle(cat._id)}
                        className="w-4 h-4 rounded border-gray-300 text-[#C48B9F] focus:ring-[#C48B9F]/20"
                      />
                      <span className="text-sm text-gray-700">{cat.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Active Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <button
              type="button"
              onClick={() => setForm({ ...form, isActive: !form.isActive })}
              className={`relative inline-flex h-10 w-full items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                form.isActive
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-gray-200 bg-gray-50 text-gray-500"
              }`}
            >
              {form.isActive ? "Active" : "Inactive"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Sale"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
