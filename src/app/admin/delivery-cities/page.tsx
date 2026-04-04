"use client";

import React, { useState, useEffect, useCallback } from "react";
import Modal from "@/components/admin/shared/Modal";
import ConfirmDialog from "@/components/admin/shared/ConfirmDialog";
import StatusBadge from "@/components/admin/shared/StatusBadge";
import EmptyState from "@/components/admin/shared/EmptyState";
import LoadingSkeleton from "@/components/admin/shared/LoadingSkeleton";
import toast from "react-hot-toast";

interface DeliveryCityItem {
  _id: string;
  city: string;
  state?: string;
  pincodes: { code: string; deliveryDays: number; codAvailable: boolean }[];
  baseCharge: number;
  freeDeliveryAbove?: number;
  isActive: boolean;
  estimatedTime?: string;
  cutoffTime?: string;
  blockedDates: string[];
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatCutoffTime = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
};

const defaultForm = {
  city: "",
  state: "",
  baseCharge: 0,
  freeDeliveryAbove: "",
  estimatedTime: "",
  isActive: true,
  pincodesText: "",
  cutoffTime: "",
  blockedDates: [] as string[],
  newBlockedDate: "",
};

export default function DeliveryCitiesPage() {
  const [cities, setCities] = useState<DeliveryCityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeliveryCityItem | null>(
    null
  );

  const fetchCities = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/delivery-cities");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCities(data);
    } catch {
      toast.error("Failed to load delivery cities");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  function openAddModal() {
    setEditingId(null);
    setForm(defaultForm);
    setModalOpen(true);
  }

  function openEditModal(city: DeliveryCityItem) {
    setEditingId(city._id);
    setForm({
      city: city.city,
      state: city.state || "",
      baseCharge: city.baseCharge,
      freeDeliveryAbove:
        city.freeDeliveryAbove !== undefined
          ? String(city.freeDeliveryAbove)
          : "",
      estimatedTime: city.estimatedTime || "",
      isActive: city.isActive,
      pincodesText: city.pincodes.map((p) => p.code).join("\n"),
      cutoffTime: city.cutoffTime || "",
      blockedDates: (city.blockedDates || []).map(
        (d) => new Date(d).toISOString().split("T")[0]
      ),
      newBlockedDate: "",
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      // Parse pincodes from textarea (one per line)
      const pincodes = form.pincodesText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((code) => ({
          code,
          deliveryDays: 0,
          codAvailable: true,
        }));

      const payload = {
        city: form.city,
        state: form.state || undefined,
        baseCharge: form.baseCharge,
        freeDeliveryAbove: form.freeDeliveryAbove
          ? Number(form.freeDeliveryAbove)
          : undefined,
        estimatedTime: form.estimatedTime || undefined,
        isActive: form.isActive,
        pincodes,
        cutoffTime: form.cutoffTime || undefined,
        blockedDates: form.blockedDates,
      };

      const url = editingId
        ? `/api/admin/delivery-cities/${editingId}`
        : "/api/admin/delivery-cities";

      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save delivery city");
        return;
      }

      toast.success(editingId ? "City updated" : "City created");
      setModalOpen(false);
      fetchCities();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    try {
      const res = await fetch(
        `/api/admin/delivery-cities/${deleteTarget._id}`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to delete city");
        return;
      }

      toast.success("City deleted");
      fetchCities();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2120]">
            Delivery Cities
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage delivery locations and charges
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-[#B5748A] text-white text-sm font-medium rounded-lg hover:bg-[#0A3A4D] transition-colors flex items-center gap-2"
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
          Add City
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton type="table" rows={5} />
      ) : cities.length === 0 ? (
        <EmptyState
          title="No delivery cities yet"
          description="Add your first delivery city to start accepting orders."
          action={{ label: "Add City", onClick: openAddModal }}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    City
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    State
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">
                    Base Charge
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">
                    Free Above
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">
                    Pincodes
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Est. Time
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Cutoff
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
                {cities.map((city) => (
                  <tr
                    key={city._id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-[#1C2120]">
                      {city.city}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {city.state || "-"}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {formatCurrency(city.baseCharge)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {city.freeDeliveryAbove
                        ? formatCurrency(city.freeDeliveryAbove)
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {city.pincodes.length}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {city.estimatedTime || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {city.cutoffTime
                        ? formatCutoffTime(city.cutoffTime)
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge
                        status={city.isActive ? "active" : "inactive"}
                        size="sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(city)}
                          className="text-xs font-medium text-[#B5748A] hover:text-[#0A3A4D] transition-colors"
                        >
                          Edit
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => setDeleteTarget(city)}
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
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit City" : "Add City"}
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
                  .getElementById("delivery-city-form")
                  ?.dispatchEvent(
                    new Event("submit", { cancelable: true, bubbles: true })
                  )
              }
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-[#B5748A] rounded-lg hover:bg-[#0A3A4D] transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
          </>
        }
      >
        <form
          id="delivery-city-form"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* City Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="e.g. Mumbai"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-[#B5748A] focus:ring-1 focus:ring-[#B5748A]/20 focus:outline-none transition-colors"
            />
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <input
              type="text"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              placeholder="e.g. Maharashtra"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-[#B5748A] focus:ring-1 focus:ring-[#B5748A]/20 focus:outline-none transition-colors"
            />
          </div>

          {/* Base Charge & Free Delivery Above */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Charge <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.baseCharge}
                onChange={(e) =>
                  setForm({
                    ...form,
                    baseCharge: parseFloat(e.target.value) || 0,
                  })
                }
                min={0}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:border-[#B5748A] focus:ring-1 focus:ring-[#B5748A]/20 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Free Delivery Above
              </label>
              <input
                type="number"
                value={form.freeDeliveryAbove}
                onChange={(e) =>
                  setForm({ ...form, freeDeliveryAbove: e.target.value })
                }
                min={0}
                placeholder="Optional"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-[#B5748A] focus:ring-1 focus:ring-[#B5748A]/20 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Estimated Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Time
            </label>
            <input
              type="text"
              value={form.estimatedTime}
              onChange={(e) =>
                setForm({ ...form, estimatedTime: e.target.value })
              }
              placeholder="e.g. 2-4 hours"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-[#B5748A] focus:ring-1 focus:ring-[#B5748A]/20 focus:outline-none transition-colors"
            />
          </div>

          {/* Cutoff Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Same-Day Delivery Cutoff
            </label>
            <input
              type="time"
              value={form.cutoffTime}
              onChange={(e) =>
                setForm({ ...form, cutoffTime: e.target.value })
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:border-[#B5748A] focus:ring-1 focus:ring-[#B5748A]/20 focus:outline-none transition-colors"
            />
            <p className="text-xs text-gray-400 mt-1">
              Orders after this time cannot select today for delivery
            </p>
          </div>

          {/* Blocked Dates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Blocked Delivery Dates
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="date"
                value={form.newBlockedDate}
                onChange={(e) =>
                  setForm({ ...form, newBlockedDate: e.target.value })
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:border-[#B5748A] focus:ring-1 focus:ring-[#B5748A]/20 focus:outline-none transition-colors flex-1"
              />
              <button
                type="button"
                onClick={() => {
                  if (
                    form.newBlockedDate &&
                    !form.blockedDates.includes(form.newBlockedDate)
                  ) {
                    setForm({
                      ...form,
                      blockedDates: [
                        ...form.blockedDates,
                        form.newBlockedDate,
                      ],
                      newBlockedDate: "",
                    });
                  }
                }}
                className="px-3 py-2.5 text-sm font-medium bg-[#B5748A] text-white rounded-lg hover:bg-[#9E6377] transition-colors"
              >
                Add
              </button>
            </div>
            {form.blockedDates.length > 0 && (
              <div className="space-y-1">
                {form.blockedDates.map((date, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                  >
                    <span className="text-sm text-[#464646]">
                      {new Date(date + "T00:00:00").toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          blockedDates: form.blockedDates.filter(
                            (_, j) => j !== i
                          ),
                        })
                      }
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="M4 4L12 12M4 12L12 4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Delivery will not be available on these dates
            </p>
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

          {/* Pincodes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pincodes{" "}
              <span className="text-gray-400 font-normal">
                (one per line)
              </span>
            </label>
            <textarea
              value={form.pincodesText}
              onChange={(e) =>
                setForm({ ...form, pincodesText: e.target.value })
              }
              rows={4}
              placeholder={"400001\n400002\n400003"}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-[#B5748A] focus:ring-1 focus:ring-[#B5748A]/20 focus:outline-none transition-colors resize-none font-mono"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete City"
        message={`Are you sure you want to delete "${deleteTarget?.city}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
