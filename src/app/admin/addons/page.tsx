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
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import SearchInput from "@/components/admin/shared/SearchInput";
import StatusBadge from "@/components/admin/shared/StatusBadge";
import EmptyState from "@/components/admin/shared/EmptyState";
import LoadingSkeleton from "@/components/admin/shared/LoadingSkeleton";
import ConfirmDialog from "@/components/admin/shared/ConfirmDialog";

interface AddonItem {
  _id: string;
  name: string;
  slug: string;
  sku?: string;
  pricing: {
    regularPrice: number;
    salePrice?: number;
    currentPrice: number;
  };
  images: { url: string; alt?: string; order: number }[];
  order: number;
  isActive: boolean;
}

export default function AdminAddonsPage() {
  const router = useRouter();
  const [addons, setAddons] = useState<AddonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AddonItem | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAddons = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        isAddon: "true",
        sort: "order",
        order: "asc",
        limit: "100",
      });
      const res = await fetch(`/api/admin/products?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch addons");
      const data = await res.json();
      const sorted = (data.products as AddonItem[]).sort(
        (a, b) => (a.order || 0) - (b.order || 0)
      );
      setAddons(sorted);
    } catch {
      toast.error("Failed to load addons");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddons();
  }, [fetchAddons]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  async function saveReorder(list: AddonItem[]) {
    setSaveStatus("saving");
    try {
      const orderedIds = list.map((p) => p._id);
      const res = await fetch("/api/admin/products/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds, isAddon: true }),
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

  function applyOrder(list: AddonItem[]) {
    const withOrder = list.map((p, i) => ({ ...p, order: i }));
    setAddons(withOrder);
    saveReorder(withOrder);
  }

  function handleDragEnd(result: DropResult) {
    if (search || !result.destination) return;
    const src = result.source.index;
    const dest = result.destination.index;
    if (src === dest) return;

    const updated = Array.from(addons);
    const [moved] = updated.splice(src, 1);
    updated.splice(dest, 0, moved);
    applyOrder(updated);
  }

  function handleOrderNumberChange(index: number, newPos: number) {
    if (search) return;
    const clamped = Math.max(1, Math.min(newPos, addons.length));
    const targetIndex = clamped - 1;
    if (targetIndex === index) return;

    const updated = Array.from(addons);
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    applyOrder(updated);
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/admin/products/${deleteTarget._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete addon");

      toast.success("Addon deleted");
      const remaining = addons.filter((a) => a._id !== deleteTarget._id);
      setDeleteTarget(null);
      if (remaining.length > 0 && remaining.length !== addons.length) {
        applyOrder(remaining);
      } else {
        setAddons(remaining);
      }
    } catch {
      toast.error("Failed to delete addon");
    }
  }

  const displayed = search
    ? addons.filter((a) => {
        const q = search.toLowerCase();
        return (
          a.name.toLowerCase().includes(q) ||
          (a.sku && a.sku.toLowerCase().includes(q))
        );
      })
    : addons;

  const canReorder = !search && displayed.length > 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2120]">Addons</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gift extras shown on product and cart pages. Drag to set the order customers see.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 min-h-[1rem]">
            {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : ""}
          </span>
          <Link
            href="/admin/products/new?addon=1"
            className="inline-flex items-center gap-2 bg-[#737530] hover:bg-[#4C4D27] text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
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
            Add Addon
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search addons..."
          className="max-w-md"
        />
        {search && (
          <p className="text-xs text-gray-400 mt-2">Clear search to rearrange addons.</p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4">
        {loading ? (
          <LoadingSkeleton rows={6} type="table" />
        ) : addons.length === 0 ? (
          <EmptyState
            title="No addons yet"
            description="Create gift addons like Rakhi, sweets, cookies, or cards. They show as + ADD cards on product and cart pages."
            action={{
              label: "Add Addon",
              onClick: () => router.push("/admin/products/new?addon=1"),
            }}
          />
        ) : displayed.length === 0 ? (
          <EmptyState
            title="No matching addons"
            description="Try a different search term."
          />
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="addons-reorder" isDropDisabled={!canReorder}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1">
                  {displayed.map((addon, index) => (
                    <Draggable
                      key={addon._id}
                      draggableId={addon._id}
                      index={index}
                      isDragDisabled={!canReorder}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                            snapshot.isDragging
                              ? "bg-[#737530]/5 border-[#737530]/20 shadow-lg"
                              : "bg-white border-gray-100 hover:bg-gray-50"
                          }`}
                        >
                          <div
                            {...provided.dragHandleProps}
                            className={`shrink-0 ${
                              canReorder
                                ? "cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                                : "cursor-not-allowed text-gray-200"
                            }`}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="9" cy="6" r="1.5" />
                              <circle cx="15" cy="6" r="1.5" />
                              <circle cx="9" cy="12" r="1.5" />
                              <circle cx="15" cy="12" r="1.5" />
                              <circle cx="9" cy="18" r="1.5" />
                              <circle cx="15" cy="18" r="1.5" />
                            </svg>
                          </div>
                          {addon.images?.[0]?.url ? (
                            <Image
                              src={addon.images[0].url}
                              alt=""
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded object-cover shrink-0"
                              unoptimized
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-gray-100 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/admin/products/${addon._id}`}
                              className="text-sm font-medium text-[#1C2120] hover:text-[#737530] transition-colors truncate block"
                            >
                              {addon.name}
                            </Link>
                            <p className="text-xs text-gray-500">
                              &#8377; {addon.pricing.currentPrice.toLocaleString()}
                              {addon.sku ? ` · ${addon.sku}` : ""}
                            </p>
                          </div>
                          <StatusBadge
                            status={addon.isActive ? "active" : "inactive"}
                            size="sm"
                          />
                          <input
                            type="number"
                            value={search ? index + 1 : addon.order + 1}
                            min={1}
                            max={addons.length}
                            disabled={!!search}
                            onChange={() => {}}
                            onBlur={(e) =>
                              handleOrderNumberChange(index, parseInt(e.target.value) || index + 1)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                            }}
                            className="w-14 text-center text-sm border border-gray-200 rounded-lg py-1.5 focus:border-[#737530] outline-none disabled:bg-gray-50 disabled:text-gray-400"
                          />
                          <Link
                            href={`/admin/products/${addon._id}`}
                            className="p-2 text-gray-400 hover:text-[#737530] hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
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
                            onClick={() => setDeleteTarget(addon)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
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
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Addon"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
