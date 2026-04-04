"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import SearchInput from "@/components/admin/shared/SearchInput";
import Pagination from "@/components/admin/shared/Pagination";
import StatusBadge from "@/components/admin/shared/StatusBadge";
import EmptyState from "@/components/admin/shared/EmptyState";
import LoadingSkeleton from "@/components/admin/shared/LoadingSkeleton";
import ConfirmDialog from "@/components/admin/shared/ConfirmDialog";

interface ProductCategory {
  _id: string;
  name: string;
  slug: string;
}

interface ProductItem {
  _id: string;
  name: string;
  slug: string;
  sku?: string;
  pricing: {
    regularPrice: number;
    salePrice?: number;
    currentPrice: number;
  };
  inventory: {
    stock: number;
    stockStatus: string;
  };
  images: { url: string; alt?: string; order: number }[];
  categories: ProductCategory[];
  variants: { label: string; price: number }[];
  order: number;
  isActive: boolean;
  isFeatured: boolean;
  isAddon: boolean;
  createdAt: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<ProductItem | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [reorderList, setReorderList] = useState<ProductItem[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch categories for the filter dropdown
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

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        sort: "createdAt",
        order: "desc",
      });
      if (search) params.set("search", search);
      if (categoryFilter) params.set("category", categoryFilter);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch products");

      const data = await res.json();
      setProducts(data.products);
      setTotalItems(data.total);
      setTotalPages(data.pages);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, statusFilter, pageSize]);

  // Handle delete
  async function handleDelete() {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/admin/products/${deleteTarget._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete product");

      toast.success("Product deleted successfully");
      setDeleteTarget(null);
      fetchProducts();
    } catch {
      toast.error("Failed to delete product");
    }
  }

  // Reorder functions
  function enterReorderMode() {
    const sorted = [...products].sort((a, b) => (a.order || 0) - (b.order || 0));
    setReorderList(sorted);
    setReorderMode(true);
  }

  async function saveReorder(list: ProductItem[]) {
    setSaveStatus("saving");
    try {
      const orderedIds = list.map((p) => p._id);
      const res = await fetch("/api/admin/products/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) throw new Error("Failed to save order");
      setSaveStatus("saved");
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      toast.error("Failed to save order");
      setSaveStatus("idle");
    }
  }

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    const src = result.source.index;
    const dest = result.destination.index;
    if (src === dest) return;

    const updated = Array.from(reorderList);
    const [moved] = updated.splice(src, 1);
    updated.splice(dest, 0, moved);
    const withOrder = updated.map((p, i) => ({ ...p, order: i }));
    setReorderList(withOrder);
    saveReorder(withOrder);
  }

  function handleOrderNumberChange(index: number, newPos: number) {
    const clamped = Math.max(1, Math.min(newPos, reorderList.length));
    const targetIndex = clamped - 1;
    if (targetIndex === index) return;

    const updated = Array.from(reorderList);
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    const withOrder = updated.map((p, i) => ({ ...p, order: i }));
    setReorderList(withOrder);
    saveReorder(withOrder);
  }

  // Handle select all on current page
  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedIds(new Set(products.map((p) => p._id)));
    } else {
      setSelectedIds(new Set());
    }
  }

  // Handle individual select
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price);
  }

  const allSelected =
    products.length > 0 && products.every((p) => selectedIds.has(p._id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2120]">Products</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your flower arrangements and products
          </p>
        </div>
        <Link
          href="/admin/products/new"
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
          Add Product
        </Link>
        {!categoryFilter && !reorderMode && (
          <span className="text-xs text-gray-400 hidden sm:inline">Select a category to reorder</span>
        )}
        {categoryFilter && !reorderMode && (
          <button
            onClick={enterReorderMode}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-gray-200 text-[#1C2120] bg-white rounded-lg hover:border-[#B5748A] hover:text-[#B5748A] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            Reorder
          </button>
        )}
        {reorderMode && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">
              {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : ""}
            </span>
            <button
              onClick={() => { setReorderMode(false); fetchProducts(); }}
              className="px-4 py-2.5 text-sm font-medium bg-[#B5748A] text-white rounded-lg hover:bg-[#9E6377] transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search products..."
            className="flex-1"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-white focus:border-[#B5748A] focus:ring-1 focus:ring-[#B5748A]/20 outline-none min-w-[160px]"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-white focus:border-[#B5748A] focus:ring-1 focus:ring-[#B5748A]/20 outline-none min-w-[140px]"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="instock">In Stock</option>
            <option value="outofstock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      {/* Reorder DnD List */}
      {reorderMode && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="products-reorder">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1">
                  {reorderList.map((product, index) => (
                    <Draggable key={product._id} draggableId={product._id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                            snapshot.isDragging ? "bg-[#B5748A]/5 border-[#B5748A]/20 shadow-lg" : "bg-white border-gray-100 hover:bg-gray-50"
                          }`}
                        >
                          <div {...provided.dragHandleProps} className="shrink-0 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" /><circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" /><circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" /></svg>
                          </div>
                          {product.images?.[0]?.url ? (
                            <Image src={product.images[0].url} alt="" width={36} height={36} className="w-9 h-9 rounded object-cover shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded bg-gray-100 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#1C2120] truncate">{product.name}</p>
                            <p className="text-xs text-gray-500">&#8377; {product.pricing.currentPrice.toLocaleString()}</p>
                          </div>
                          <input
                            type="number"
                            value={index + 1}
                            min={1}
                            max={reorderList.length}
                            onChange={() => {}}
                            onBlur={(e) => handleOrderNumberChange(index, parseInt(e.target.value) || index + 1)}
                            onKeyDown={(e) => { if (e.key === "Enter") { (e.target as HTMLInputElement).blur(); } }}
                            className="w-14 text-center text-sm border border-gray-200 rounded-lg py-1.5 focus:border-[#B5748A] outline-none"
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
      )}

      {/* Product Table */}
      <div className={`bg-white rounded-xl border border-gray-100 ${reorderMode ? "hidden" : ""}`}>
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton rows={pageSize} type="table" />
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            title="No products found"
            description="Get started by creating your first product or adjust your filters."
            action={{
              label: "Add Product",
              onClick: () => {
                window.location.href = "/admin/products/new";
              },
            }}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left p-4 w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-[#B5748A] focus:ring-[#B5748A]/20"
                      />
                    </th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product._id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      {/* Checkbox */}
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(product._id)}
                          onChange={() => toggleSelect(product._id)}
                          className="rounded border-gray-300 text-[#B5748A] focus:ring-[#B5748A]/20"
                        />
                      </td>

                      {/* Product name + image + sku */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                            {product.images?.[0]?.url ? (
                              <Image
                                src={product.images[0].url}
                                alt={product.images[0].alt || product.name}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <svg
                                  width="20"
                                  height="20"
                                  viewBox="0 0 20 20"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M17.5 12.5L13.5675 8.5675C13.2554 8.25536 12.8369 8.08035 12.4012 8.08035C11.9656 8.08035 11.5471 8.25536 11.235 8.5675L5 14.8025M17.5 5C17.5 3.61929 16.3807 2.5 15 2.5H5C3.61929 2.5 2.5 3.61929 2.5 5V15C2.5 16.3807 3.61929 17.5 5 17.5H15C16.3807 17.5 17.5 16.3807 17.5 15V5ZM8.75 7.5C8.75 8.19036 8.19036 8.75 7.5 8.75C6.80964 8.75 6.25 8.19036 6.25 7.5C6.25 6.80964 6.80964 6.25 7.5 6.25C8.19036 6.25 8.75 6.80964 8.75 7.5Z"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/admin/products/${product._id}`}
                              className="text-sm font-medium text-[#1C2120] hover:text-[#B5748A] transition-colors"
                            >
                              {product.name}
                            </Link>
                            <div className="flex items-center gap-1.5 mt-1">
                              {product.variants?.length > 0 ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded bg-[#B5748A]/10 text-[#B5748A]">
                                  {product.variants.length} Variant{product.variants.length !== 1 ? "s" : ""}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded bg-gray-100 text-gray-500">
                                  Simple
                                </span>
                              )}
                              {product.isAddon && (
                                <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded bg-amber-50 text-amber-600">
                                  Addon
                                </span>
                              )}
                              {product.sku && (
                                <span className="text-[10px] text-gray-400">
                                  SKU: {product.sku}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-4">
                        <span className="text-sm text-gray-600">
                          {product.categories?.map(c => c.name).join(", ") || "-"}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="p-4">
                        <div className="text-sm">
                          {product.pricing.salePrice ? (
                            <div>
                              <span className="font-medium text-[#1C2120]">
                                {formatPrice(product.pricing.salePrice)}
                              </span>
                              <span className="text-xs text-gray-400 line-through ml-1">
                                {formatPrice(product.pricing.regularPrice)}
                              </span>
                            </div>
                          ) : (
                            <span className="font-medium text-[#1C2120]">
                              {formatPrice(product.pricing.regularPrice)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="p-4">
                        <span className="text-sm text-gray-600">
                          {product.inventory?.stock ?? 0}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <StatusBadge
                            status={product.isActive ? "active" : "inactive"}
                            size="sm"
                          />
                          {product.inventory?.stockStatus &&
                            product.inventory.stockStatus !== "instock" && (
                              <StatusBadge
                                status={product.inventory.stockStatus}
                                size="sm"
                              />
                            )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/products/${product._id}`}
                            className="p-2 text-gray-400 hover:text-[#B5748A] hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg
                              width="16"
                              height="16"
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
                          </Link>
                          <button
                            onClick={() => setDeleteTarget(product)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-gray-100">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                totalItems={totalItems}
              />
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
