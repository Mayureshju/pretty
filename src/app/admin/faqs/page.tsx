"use client";

import React, { useState, useEffect, useCallback } from "react";
import Modal from "@/components/admin/shared/Modal";
import ConfirmDialog from "@/components/admin/shared/ConfirmDialog";
import StatusBadge from "@/components/admin/shared/StatusBadge";
import Pagination from "@/components/admin/shared/Pagination";
import EmptyState from "@/components/admin/shared/EmptyState";
import LoadingSkeleton from "@/components/admin/shared/LoadingSkeleton";
import toast from "react-hot-toast";

interface FAQItem {
  _id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
}

const defaultForm = {
  question: "",
  answer: "",
  category: "General",
  order: 0,
  isActive: true,
};

export default function FAQsPage() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FAQItem | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");

  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/faqs?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setFaqs(data.faqs);
      setTotal(data.total);
      setTotalPages(data.pages);
    } catch {
      toast.error("Failed to load FAQs");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  function openAddModal() {
    setEditingId(null);
    setForm(defaultForm);
    setModalOpen(true);
  }

  function openEditModal(faq: FAQItem) {
    setEditingId(faq._id);
    setForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      order: faq.order,
      isActive: faq.isActive,
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingId
        ? `/api/admin/faqs/${editingId}`
        : "/api/admin/faqs";

      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save FAQ");
        return;
      }

      toast.success(editingId ? "FAQ updated" : "FAQ created");
      setModalOpen(false);
      fetchFaqs();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/admin/faqs/${deleteTarget._id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to delete FAQ");
        return;
      }

      toast.success("FAQ deleted");
      fetchFaqs();
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
          <h1 className="text-2xl font-bold text-[#1C2120]">FAQs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage frequently asked questions
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-[#737530] text-white text-sm font-medium rounded-lg hover:bg-[#4C4D27] transition-colors flex items-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M9 3.75V14.25M3.75 9H14.25"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Add FAQ
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:border-[#737530] focus:ring-1 focus:ring-[#737530]/20 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton type="table" rows={pageSize} />
      ) : faqs.length === 0 ? (
        <EmptyState
          title="No FAQs yet"
          description="Create your first FAQ to help customers find answers quickly."
          action={{ label: "Add FAQ", onClick: openAddModal }}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Question
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Category
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">
                    Order
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
                {faqs.map((faq) => (
                  <tr
                    key={faq._id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#1C2120] line-clamp-1 max-w-md">
                        {faq.question}
                      </p>
                      <p className="text-xs text-gray-400 line-clamp-1 mt-0.5 max-w-md">
                        {faq.answer}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#F2F3E8] text-[#737530]">
                        {faq.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {faq.order}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge
                        status={faq.isActive ? "active" : "inactive"}
                        size="sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(faq)}
                          className="text-xs font-medium text-[#737530] hover:text-[#4C4D27] transition-colors"
                        >
                          Edit
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => setDeleteTarget(faq)}
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
        title={editingId ? "Edit FAQ" : "Add FAQ"}
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
                  .getElementById("faq-form")
                  ?.dispatchEvent(
                    new Event("submit", { cancelable: true, bubbles: true })
                  )
              }
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-[#737530] rounded-lg hover:bg-[#4C4D27] transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
          </>
        }
      >
        <form id="faq-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Question */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
              placeholder="e.g. What are your delivery hours?"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-[#737530] focus:ring-1 focus:ring-[#737530]/20 focus:outline-none transition-colors"
            />
          </div>

          {/* Answer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Answer <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
              placeholder="Write the answer here..."
              required
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-[#737530] focus:ring-1 focus:ring-[#737530]/20 focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Category & Order */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Delivery, Payment, Orders"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-[#737530] focus:ring-1 focus:ring-[#737530]/20 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Order
              </label>
              <input
                type="number"
                value={form.order}
                onChange={(e) =>
                  setForm({ ...form, order: parseInt(e.target.value, 10) || 0 })
                }
                min={0}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:border-[#737530] focus:ring-1 focus:ring-[#737530]/20 focus:outline-none transition-colors"
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
        title="Delete FAQ"
        message={`Are you sure you want to delete this FAQ? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
