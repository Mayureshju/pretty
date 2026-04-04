"use client";

import React, { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import Modal from "@/components/admin/shared/Modal";
import ConfirmDialog from "@/components/admin/shared/ConfirmDialog";
import StatusBadge from "@/components/admin/shared/StatusBadge";
import Pagination from "@/components/admin/shared/Pagination";
import EmptyState from "@/components/admin/shared/EmptyState";
import LoadingSkeleton from "@/components/admin/shared/LoadingSkeleton";
import toast from "react-hot-toast";

interface CouponItem {
  _id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  perUserLimit: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const defaultForm = {
  code: "",
  type: "percentage" as "percentage" | "fixed",
  value: 0,
  minOrderAmount: 0,
  maxDiscount: "",
  usageLimit: "",
  perUserLimit: 1,
  validFrom: "",
  validTo: "",
  isActive: true,
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CouponItem | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });
      const res = await fetch(`/api/admin/coupons?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCoupons(data.coupons);
      setTotal(data.total);
      setTotalPages(data.pages);
    } catch {
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  function openAddModal() {
    setEditingId(null);
    setForm(defaultForm);
    setModalOpen(true);
  }

  function openEditModal(coupon: CouponItem) {
    setEditingId(coupon._id);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscount:
        coupon.maxDiscount !== undefined ? String(coupon.maxDiscount) : "",
      usageLimit:
        coupon.usageLimit !== undefined ? String(coupon.usageLimit) : "",
      perUserLimit: coupon.perUserLimit,
      validFrom: coupon.validFrom
        ? format(new Date(coupon.validFrom), "yyyy-MM-dd")
        : "",
      validTo: coupon.validTo
        ? format(new Date(coupon.validTo), "yyyy-MM-dd")
        : "",
      isActive: coupon.isActive,
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        code: form.code.toUpperCase(),
        type: form.type,
        value: form.value,
        minOrderAmount: form.minOrderAmount,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        perUserLimit: form.perUserLimit,
        validFrom: form.validFrom,
        validTo: form.validTo,
        isActive: form.isActive,
      };

      const url = editingId
        ? `/api/admin/coupons/${editingId}`
        : "/api/admin/coupons";

      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save coupon");
        return;
      }

      toast.success(editingId ? "Coupon updated" : "Coupon created");
      setModalOpen(false);
      fetchCoupons();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/admin/coupons/${deleteTarget._id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to delete coupon");
        return;
      }

      toast.success("Coupon deleted");
      fetchCoupons();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleteTarget(null);
    }
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2120]">Coupons</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage discount coupons and promotions
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-[#0E4D65] text-white text-sm font-medium rounded-lg hover:bg-[#0A3A4D] transition-colors flex items-center gap-2"
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
          Create Coupon
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton type="table" rows={pageSize} />
      ) : coupons.length === 0 ? (
        <EmptyState
          title="No coupons yet"
          description="Create your first coupon to offer discounts to customers."
          action={{ label: "Create Coupon", onClick: openAddModal }}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Code
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">
                    Type
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">
                    Value
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">
                    Min Order
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">
                    Usage
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Valid Period
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
                {coupons.map((coupon) => (
                  <tr
                    key={coupon._id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-bold font-mono text-[#1C2120]">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          coupon.type === "percentage"
                            ? "bg-[#E3F2FD] text-[#1565C0]"
                            : "bg-[#FFF3E0] text-[#E65100]"
                        }`}
                      >
                        {coupon.type === "percentage" ? "%" : "Rs"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {coupon.type === "percentage"
                        ? `${coupon.value}%`
                        : formatCurrency(coupon.value)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {coupon.minOrderAmount
                        ? formatCurrency(coupon.minOrderAmount)
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {coupon.usedCount}
                      {coupon.usageLimit ? `/${coupon.usageLimit}` : ""}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {format(new Date(coupon.validFrom), "dd MMM")} -{" "}
                      {format(new Date(coupon.validTo), "dd MMM yyyy")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge
                        status={coupon.isActive ? "active" : "inactive"}
                        size="sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(coupon)}
                          className="text-xs font-medium text-[#0E4D65] hover:text-[#0A3A4D] transition-colors"
                        >
                          Edit
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => setDeleteTarget(coupon)}
                          className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-gray-100">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
              totalItems={total}
            />
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Coupon" : "Create Coupon"}
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
                  .getElementById("coupon-form")
                  ?.dispatchEvent(
                    new Event("submit", { cancelable: true, bubbles: true })
                  )
              }
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-[#0E4D65] rounded-lg hover:bg-[#0A3A4D] transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
          </>
        }
      >
        <form id="coupon-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Coupon Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.code}
              onChange={(e) =>
                setForm({ ...form, code: e.target.value.toUpperCase() })
              }
              placeholder="e.g. SAVE20"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-[#0E4D65] focus:ring-1 focus:ring-[#0E4D65]/20 focus:outline-none transition-colors font-mono uppercase"
            />
          </div>

          {/* Type & Value */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="coupon-type"
                    value="percentage"
                    checked={form.type === "percentage"}
                    onChange={() => setForm({ ...form, type: "percentage" })}
                    className="accent-[#0E4D65]"
                  />
                  <span className="text-sm text-gray-700">Percentage</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="coupon-type"
                    value="fixed"
                    checked={form.type === "fixed"}
                    onChange={() => setForm({ ...form, type: "fixed" })}
                    className="accent-[#0E4D65]"
                  />
                  <span className="text-sm text-gray-700">Fixed</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Value <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.value}
                onChange={(e) =>
                  setForm({
                    ...form,
                    value: parseFloat(e.target.value) || 0,
                  })
                }
                min={0}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:border-[#0E4D65] focus:ring-1 focus:ring-[#0E4D65]/20 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Min Order & Max Discount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Order Amount
              </label>
              <input
                type="number"
                value={form.minOrderAmount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    minOrderAmount: parseFloat(e.target.value) || 0,
                  })
                }
                min={0}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:border-[#0E4D65] focus:ring-1 focus:ring-[#0E4D65]/20 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Discount
              </label>
              <input
                type="number"
                value={form.maxDiscount}
                onChange={(e) =>
                  setForm({ ...form, maxDiscount: e.target.value })
                }
                min={0}
                placeholder="Optional"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-[#0E4D65] focus:ring-1 focus:ring-[#0E4D65]/20 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Usage Limit & Per User Limit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usage Limit
              </label>
              <input
                type="number"
                value={form.usageLimit}
                onChange={(e) =>
                  setForm({ ...form, usageLimit: e.target.value })
                }
                min={1}
                placeholder="Unlimited"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-[#0E4D65] focus:ring-1 focus:ring-[#0E4D65]/20 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Per User Limit
              </label>
              <input
                type="number"
                value={form.perUserLimit}
                onChange={(e) =>
                  setForm({
                    ...form,
                    perUserLimit: parseInt(e.target.value, 10) || 1,
                  })
                }
                min={1}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:border-[#0E4D65] focus:ring-1 focus:ring-[#0E4D65]/20 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Valid Period */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valid From <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.validFrom}
                onChange={(e) =>
                  setForm({ ...form, validFrom: e.target.value })
                }
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-white focus:border-[#0E4D65] focus:ring-1 focus:ring-[#0E4D65]/20 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valid To <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.validTo}
                onChange={(e) =>
                  setForm({ ...form, validTo: e.target.value })
                }
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-white focus:border-[#0E4D65] focus:ring-1 focus:ring-[#0E4D65]/20 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Status */}
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
        title="Delete Coupon"
        message={`Are you sure you want to delete coupon "${deleteTarget?.code}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
