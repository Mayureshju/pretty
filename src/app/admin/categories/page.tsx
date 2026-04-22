"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import Modal from "@/components/admin/shared/Modal";
import ConfirmDialog from "@/components/admin/shared/ConfirmDialog";
import StatusBadge from "@/components/admin/shared/StatusBadge";
import EmptyState from "@/components/admin/shared/EmptyState";
import LoadingSkeleton from "@/components/admin/shared/LoadingSkeleton";
import ImageUploader from "@/components/admin/shared/ImageUploader";
import SearchInput from "@/components/admin/shared/SearchInput";
import toast from "react-hot-toast";

interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
  parent?: { _id: string; name: string } | null;
  order: number;
  isActive: boolean;
  productCount: number;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogTitle?: string;
    ogDescription?: string;
  };
  isBanner: boolean;
  bannerImage?: string;
  displayText?: string;
}

const defaultForm = {
  name: "",
  description: "",
  image: "",
  parent: "",
  order: 0,
  isActive: true,
  seoMetaTitle: "",
  seoMetaDescription: "",
  seoOgTitle: "",
  seoOgDescription: "",
  isBanner: false,
  bannerImage: "",
  displayText: "",
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CategoryItem | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [reorderList, setReorderList] = useState<CategoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/categories");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCategories(data);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Sync reorderList when entering reorder mode or when categories change while in reorder mode
  useEffect(() => {
    if (reorderMode) {
      setReorderList([...categories].sort((a, b) => a.order - b.order));
    }
  }, [reorderMode, categories]);

  function openAddModal() {
    setEditingId(null);
    setForm(defaultForm);
    setModalOpen(true);
  }

  function openEditModal(cat: CategoryItem) {
    setEditingId(cat._id);
    setForm({
      name: cat.name,
      description: cat.description || "",
      image: cat.image || "",
      parent: cat.parent?._id || "",
      order: cat.order,
      isActive: cat.isActive,
      seoMetaTitle: cat.seo?.metaTitle || "",
      seoMetaDescription: cat.seo?.metaDescription || "",
      seoOgTitle: cat.seo?.ogTitle || "",
      seoOgDescription: cat.seo?.ogDescription || "",
      isBanner: cat.isBanner || false,
      bannerImage: cat.bannerImage || "",
      displayText: cat.displayText || "",
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        name: form.name,
        description: form.description,
        image: form.image || undefined,
        parent: form.parent || null,
        order: form.order,
        isActive: form.isActive,
        seo: {
          metaTitle: form.seoMetaTitle || "",
          metaDescription: form.seoMetaDescription || "",
          ogTitle: form.seoOgTitle || "",
          ogDescription: form.seoOgDescription || "",
        },
        isBanner: form.isBanner,
        bannerImage: form.bannerImage || undefined,
        displayText: form.displayText || "",
      };

      const url = editingId
        ? `/api/admin/categories/${editingId}`
        : "/api/admin/categories";

      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save category");
        return;
      }

      toast.success(editingId ? "Category updated" : "Category created");
      setModalOpen(false);
      fetchCategories();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/admin/categories/${deleteTarget._id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to delete category");
        return;
      }

      toast.success("Category deleted");
      fetchCategories();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleteTarget(null);
    }
  }

  // --- Reorder helpers ---

  async function saveReorder(list: CategoryItem[]) {
    setSaveStatus("saving");
    try {
      const orderedIds = list.map((c) => c._id);
      const res = await fetch("/api/admin/categories/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });

      if (!res.ok) {
        toast.error("Failed to save order");
        setSaveStatus("idle");
        return;
      }

      setSaveStatus("saved");

      // Clear "Saved" after 2 seconds
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      toast.error("Failed to save order");
      setSaveStatus("idle");
    }
  }

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;

    const srcIndex = result.source.index;
    const destIndex = result.destination.index;
    if (srcIndex === destIndex) return;

    const updated = Array.from(reorderList);
    const [moved] = updated.splice(srcIndex, 1);
    updated.splice(destIndex, 0, moved);

    // Update order values
    const withOrder = updated.map((cat, i) => ({ ...cat, order: i }));
    setReorderList(withOrder);
    saveReorder(withOrder);
  }

  function handleOrderNumberChange(catId: string, newPosition: number) {
    const currentIndex = reorderList.findIndex((c) => c._id === catId);
    if (currentIndex === -1) return;

    // Clamp position to valid range (1-based input, 0-based internal)
    const targetIndex = Math.max(
      0,
      Math.min(reorderList.length - 1, newPosition - 1)
    );
    if (targetIndex === currentIndex) return;

    const updated = Array.from(reorderList);
    const [moved] = updated.splice(currentIndex, 1);
    updated.splice(targetIndex, 0, moved);

    const withOrder = updated.map((cat, i) => ({ ...cat, order: i }));
    setReorderList(withOrder);
    saveReorder(withOrder);
  }

  function exitReorderMode() {
    setReorderMode(false);
    setSaveStatus("idle");
    // Refresh categories from server to get the saved order
    fetchCategories();
  }

  // Categories available as parent options (exclude self when editing)
  const parentOptions = categories.filter((c) => c._id !== editingId);

  // Sort categories by order for the grid view, then filter by search
  const query = search.trim().toLowerCase();
  const sortedCategories = [...categories]
    .sort((a, b) => a.order - b.order)
    .filter((c) => {
      if (!query) return true;
      return (
        c.name.toLowerCase().includes(query) ||
        c.slug.toLowerCase().includes(query) ||
        (c.description || "").toLowerCase().includes(query) ||
        (c.parent?.name || "").toLowerCase().includes(query)
      );
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2120]">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your product categories
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!reorderMode ? (
            <>
              <button
                onClick={() => setReorderMode(true)}
                disabled={categories.length < 2}
                className="px-4 py-2.5 bg-white text-[#737530] text-sm font-medium rounded-lg border border-[#737530] hover:bg-[#737530]/5 transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 4.5H15M6 9H15M6 13.5H15M3 4.5H3.0075M3 9H3.0075M3 13.5H3.0075"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Reorder
              </button>
              <button
                onClick={openAddModal}
                className="px-4 py-2.5 bg-[#737530] text-white text-sm font-medium rounded-lg hover:bg-[#0A3A4D] transition-colors flex items-center gap-2"
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
                Add Category
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              {saveStatus === "saving" && (
                <span className="text-xs text-gray-500 animate-pulse">
                  Saving...
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="text-xs text-green-600 font-medium">
                  Saved
                </span>
              )}
              <button
                onClick={exitReorderMode}
                className="px-4 py-2.5 bg-[#737530] text-white text-sm font-medium rounded-lg hover:bg-[#0A3A4D] transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      {!reorderMode && !loading && categories.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name, slug, parent..."
            className="md:w-80"
          />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <LoadingSkeleton type="cards" rows={6} />
      ) : categories.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Create your first category to organize your products."
          action={{ label: "Add Category", onClick: openAddModal }}
        />
      ) : !reorderMode && sortedCategories.length === 0 ? (
        <EmptyState
          title="No categories match your search"
          description="Try a different search term."
        />
      ) : reorderMode ? (
        /* ---- Reorder List View ---- */
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-xs text-gray-500">
              Drag categories to reorder, or type a position number. Changes are
              saved automatically.
            </p>
          </div>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="categories-list">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="divide-y divide-gray-50"
                >
                  {reorderList.map((cat, index) => (
                    <Draggable
                      key={cat._id}
                      draggableId={cat._id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center gap-4 px-5 py-3 transition-colors ${
                            snapshot.isDragging
                              ? "bg-[#737530]/5 shadow-lg rounded-lg"
                              : "bg-white hover:bg-gray-50/50"
                          }`}
                        >
                          {/* Drag handle */}
                          <div
                            {...provided.dragHandleProps}
                            className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <circle cx="7.5" cy="4.5" r="1.5" />
                              <circle cx="12.5" cy="4.5" r="1.5" />
                              <circle cx="7.5" cy="10" r="1.5" />
                              <circle cx="12.5" cy="10" r="1.5" />
                              <circle cx="7.5" cy="15.5" r="1.5" />
                              <circle cx="12.5" cy="15.5" r="1.5" />
                            </svg>
                          </div>

                          {/* Thumbnail */}
                          <div className="flex-shrink-0">
                            {cat.image ? (
                              <img
                                src={cat.image}
                                alt={cat.name}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                                <svg
                                  width="18"
                                  height="18"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M4 16L8.586 11.414C9.367 10.633 10.633 10.633 11.414 11.414L16 16M14 14L15.586 12.414C16.367 11.633 17.633 11.633 18.414 12.414L20 14M14 8H14.01M6 20H18C19.105 20 20 19.105 20 18V6C20 4.895 19.105 4 18 4H6C4.895 4 4 4.895 4 6V18C4 19.105 4.895 20 6 20Z"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Name and parent */}
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-sm text-[#1C2120] truncate block">
                              {cat.name}
                            </span>
                            {cat.parent && (
                              <span className="text-xs text-gray-400">
                                in {cat.parent.name}
                              </span>
                            )}
                          </div>

                          {/* Product count */}
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {cat.productCount} products
                          </span>

                          {/* Order number input */}
                          <input
                            type="number"
                            min={1}
                            max={reorderList.length}
                            defaultValue={index + 1}
                            key={`${cat._id}-${index}`}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const val = parseInt(
                                  (e.target as HTMLInputElement).value,
                                  10
                                );
                                if (!isNaN(val)) {
                                  handleOrderNumberChange(cat._id, val);
                                }
                              }
                            }}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val)) {
                                handleOrderNumberChange(cat._id, val);
                              }
                            }}
                            className="w-[60px] flex-shrink-0 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center text-gray-700 focus:border-[#737530] focus:ring-1 focus:ring-[#737530]/20 focus:outline-none transition-colors"
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      ) : (
        /* ---- Grid View (existing) ---- */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedCategories.map((cat) => (
            <div
              key={cat._id}
              className="bg-white rounded-xl border border-gray-100 p-5 flex gap-4 hover:shadow-sm transition-shadow"
            >
              {/* Image */}
              <div className="flex-shrink-0">
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-[60px] h-[60px] rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-[60px] h-[60px] rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4 16L8.586 11.414C9.367 10.633 10.633 10.633 11.414 11.414L16 16M14 14L15.586 12.414C16.367 11.633 17.633 11.633 18.414 12.414L20 14M14 8H14.01M6 20H18C19.105 20 20 19.105 20 18V6C20 4.895 19.105 4 18 4H6C4.895 4 4 4.895 4 6V18C4 19.105 4.895 20 6 20Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[#1C2120] truncate">
                      {cat.name}
                    </h3>
                    {cat.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {cat.description}
                      </p>
                    )}
                  </div>
                  <StatusBadge
                    status={cat.isActive ? "active" : "inactive"}
                    size="sm"
                  />
                </div>

                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span>{cat.productCount} products</span>
                  {cat.parent && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span className="truncate">in {cat.parent.name}</span>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => openEditModal(cat)}
                    className="text-xs font-medium text-[#737530] hover:text-[#0A3A4D] transition-colors"
                  >
                    Edit
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={() => setDeleteTarget(cat)}
                    className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
                  >
                    Delete
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
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Category" : "Add Category"}
        size="md"
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
                  .getElementById("category-form")
                  ?.dispatchEvent(
                    new Event("submit", { cancelable: true, bubbles: true })
                  )
              }
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-[#737530] rounded-lg hover:bg-[#0A3A4D] transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
          </>
        }
      >
        <form
          id="category-form"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Birthday Bouquets"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-[#737530] focus:ring-1 focus:ring-[#737530]/20 focus:outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              placeholder="Brief description of this category"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-[#737530] focus:ring-1 focus:ring-[#737530]/20 focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image
            </label>
            <ImageUploader
              value={form.image}
              onUrlChange={(url) => setForm({ ...form, image: url })}
              onRemove={() => setForm({ ...form, image: "" })}
              folder="categories"
            />
          </div>

          {/* Parent Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parent Category
            </label>
            <select
              value={form.parent}
              onChange={(e) => setForm({ ...form, parent: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-white focus:border-[#737530] focus:ring-1 focus:ring-[#737530]/20 focus:outline-none transition-colors"
            >
              <option value="">None (top-level)</option>
              {parentOptions.map((opt) => (
                <option key={opt._id} value={opt._id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Display Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Text
            </label>
            <input
              type="text"
              value={form.displayText}
              onChange={(e) => setForm({ ...form, displayText: e.target.value })}
              placeholder="Text shown on category display"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-[#737530] focus:ring-1 focus:ring-[#737530]/20 focus:outline-none transition-colors"
            />
          </div>

          {/* Order and isActive row */}
          <div className="grid grid-cols-2 gap-4">
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

          {/* Banner Toggle */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Category Banner
              </label>
              <button
                type="button"
                onClick={() => setForm({ ...form, isBanner: !form.isBanner })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  form.isBanner ? "bg-[#737530]" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    form.isBanner ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Enable to show a banner image on this category page</p>
          </div>

          {/* Banner Image - only show when isBanner is true */}
          {form.isBanner && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Banner Image
              </label>
              <ImageUploader
                value={form.bannerImage}
                onUrlChange={(url) => setForm({ ...form, bannerImage: url })}
                onRemove={() => setForm({ ...form, bannerImage: "" })}
                folder="banners"
              />
            </div>
          )}

          {/* SEO Section */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">SEO Settings</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">SEO Title</label>
                <input
                  type="text"
                  value={form.seoMetaTitle}
                  onChange={(e) => setForm({ ...form, seoMetaTitle: e.target.value })}
                  placeholder="Page title for search engines"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-[#737530] focus:ring-1 focus:ring-[#737530]/20 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">SEO Description</label>
                <textarea
                  value={form.seoMetaDescription}
                  onChange={(e) => setForm({ ...form, seoMetaDescription: e.target.value })}
                  rows={2}
                  placeholder="Meta description for search engines"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-[#737530] focus:ring-1 focus:ring-[#737530]/20 focus:outline-none transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">OG Title</label>
                <input
                  type="text"
                  value={form.seoOgTitle}
                  onChange={(e) => setForm({ ...form, seoOgTitle: e.target.value })}
                  placeholder="Open Graph title for social sharing"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-[#737530] focus:ring-1 focus:ring-[#737530]/20 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">OG Description</label>
                <textarea
                  value={form.seoOgDescription}
                  onChange={(e) => setForm({ ...form, seoOgDescription: e.target.value })}
                  rows={2}
                  placeholder="Open Graph description for social sharing"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-[#737530] focus:ring-1 focus:ring-[#737530]/20 focus:outline-none transition-colors resize-none"
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
