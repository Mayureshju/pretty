"use client";

import React, { useState, useEffect, useCallback } from "react";
import Modal from "@/components/admin/shared/Modal";
import ConfirmDialog from "@/components/admin/shared/ConfirmDialog";
import StatusBadge from "@/components/admin/shared/StatusBadge";
import Pagination from "@/components/admin/shared/Pagination";
import EmptyState from "@/components/admin/shared/EmptyState";
import LoadingSkeleton from "@/components/admin/shared/LoadingSkeleton";
import toast from "react-hot-toast";

interface QuoteItem {
  _id: string;
  text: string;
  author: string;
  category: string;
  color: string;
  order: number;
  isActive: boolean;
}

const defaultForm = {
  text: "",
  author: "",
  category: "",
  color: "#737530",
  order: 0,
  isActive: true,
};

const CATEGORY_OPTIONS = [
  "Flower Quotes",
  "Love & Romance",
  "Birthday Wishes",
  "Anniversary Messages",
  "Get Well Soon",
  "Congratulations",
];

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<QuoteItem | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });
      if (search) params.set("search", search);
      if (filterCategory) params.set("category", filterCategory);
      const res = await fetch(`/api/admin/quotes?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setQuotes(data.quotes);
      setTotal(data.total);
      setTotalPages(data.pages);
    } catch {
      toast.error("Failed to load quotes");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, filterCategory]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  function openAddModal() {
    setEditingId(null);
    setForm(defaultForm);
    setModalOpen(true);
  }

  function openEditModal(quote: QuoteItem) {
    setEditingId(quote._id);
    setForm({
      text: quote.text,
      author: quote.author,
      category: quote.category,
      color: quote.color,
      order: quote.order,
      isActive: quote.isActive,
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingId
        ? `/api/admin/quotes/${editingId}`
        : "/api/admin/quotes";

      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save quote");
        return;
      }

      toast.success(editingId ? "Quote updated" : "Quote created");
      setModalOpen(false);
      fetchQuotes();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/admin/quotes/${deleteTarget._id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to delete quote");
        return;
      }

      toast.success("Quote deleted");
      fetchQuotes();
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
          <h1 className="text-2xl font-bold text-[#1C2120]">Quotes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage flower quotes and wishes
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
          Add Quote
        </button>
      </div>

      {/* Search & Filter */}
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
            placeholder="Search quotes..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:border-[#737530] focus:ring-1 focus:ring-[#737530]/20 focus:outline-none transition-colors"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value);
            setPage(1);
          }}
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-white focus:border-[#737530] focus:ring-1 focus:ring-[#737530]/20 focus:outline-none transition-colors"
        >
          <option value="">All Categories</option>
          {CATEGORY_OPTIONS.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton type="table" rows={pageSize} />
      ) : quotes.length === 0 ? (
        <EmptyState
          title="No quotes yet"
          description="Add your first quote to display on the quotes page."
          action={{ label: "Add Quote", onClick: openAddModal }}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Quote
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Author
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Category
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">
                    Color
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
                {quotes.map((quote) => (
                  <tr
                    key={quote._id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-[#1C2120] line-clamp-1 max-w-xs">
                        {quote.text}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {quote.author || <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#F2F3E8] text-[#737530]">
                        {quote.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <span
                          className="w-6 h-6 rounded-full border border-gray-200"
                          style={{ backgroundColor: quote.color }}
                          title={quote.color}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {quote.order}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge
                        status={quote.isActive ? "active" : "inactive"}
                        size="sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(quote)}
                          className="text-xs font-medium text-[#737530] hover:text-[#4C4D27] transition-colors"
                        >
                          Edit
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => setDeleteTarget(quote)}
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
        title={editingId ? "Edit Quote" : "Add Quote"}
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
                  .getElementById("quote-form")
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
        <form id="quote-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Quote Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quote Text <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              placeholder="Enter the quote..."
              required
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-[#737530] focus:ring-1 focus:ring-[#737530]/20 focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Author */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Author
            </label>
            <input
              type="text"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              placeholder="e.g. Ralph Waldo Emerson (leave empty if none)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-[#737530] focus:ring-1 focus:ring-[#737530]/20 focus:outline-none transition-colors"
            />
          </div>

          {/* Category & Color */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-white focus:border-[#737530] focus:ring-1 focus:ring-[#737530]/20 focus:outline-none transition-colors"
              >
                <option value="">Select category</option>
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  placeholder="#737530"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 font-mono focus:border-[#737530] focus:ring-1 focus:ring-[#737530]/20 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Order & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Order
              </label>
              <input
                type="number"
                value={form.order}
                onChange={(e) =>
                  setForm({
                    ...form,
                    order: parseInt(e.target.value, 10) || 0,
                  })
                }
                min={0}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:border-[#737530] focus:ring-1 focus:ring-[#737530]/20 focus:outline-none transition-colors"
              />
            </div>
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
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Quote"
        message={`Are you sure you want to delete this quote? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
