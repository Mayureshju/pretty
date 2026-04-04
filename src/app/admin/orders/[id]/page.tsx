"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { format } from "date-fns";
import StatusBadge from "@/components/admin/shared/StatusBadge";
import LoadingSkeleton from "@/components/admin/shared/LoadingSkeleton";
import toast from "react-hot-toast";

interface OrderProduct {
  _id: string;
  name: string;
  images?: { url: string; alt?: string }[];
}

interface OrderItemDetail {
  product: OrderProduct | string;
  productName?: string;
  variant?: string;
  quantity: number;
  price: number;
  total: number;
}

interface StatusHistoryEntry {
  status: string;
  timestamp: string;
  note?: string;
}

interface OrderDetail {
  _id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  items: OrderItemDetail[];
  shipping: {
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    method?: string;
  };
  pricing: {
    subtotal: number;
    discount: number;
    tax: number;
    shipping: number;
    total: number;
    couponCode?: string;
  };
  payment: {
    method?: string;
    status: string;
    transactionId?: string;
  };
  status: string;
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
}

const ALL_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "out-for-delivery",
  "delivered",
  "cancelled",
  "refunded",
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-orange-500",
  confirmed: "bg-blue-500",
  processing: "bg-yellow-500",
  "out-for-delivery": "bg-indigo-500",
  delivered: "bg-green-500",
  cancelled: "bg-red-500",
  refunded: "bg-red-400",
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

function formatStatus(status: string): string {
  return status
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getProductName(item: OrderItemDetail): string {
  if (item.productName) return item.productName;
  if (typeof item.product === "object" && item.product?.name) {
    return item.product.name;
  }
  return "Unknown Product";
}

function getProductImage(item: OrderItemDetail): string | null {
  if (typeof item.product === "object" && item.product?.images?.length) {
    return item.product.images[0].url;
  }
  return null;
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/orders/${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setOrder(data);
      setNewStatus(data.status);
    } catch {
      toast.error("Failed to load order");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  async function handleStatusUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!newStatus || newStatus === order?.status) {
      toast.error("Please select a different status");
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, note: statusNote || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to update status");
        return;
      }

      toast.success("Order status updated");
      setStatusNote("");
      fetchOrder();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="form" rows={8} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Order not found</p>
        <Link
          href="/admin/orders"
          className="text-[#0E4D65] hover:underline mt-2 inline-block"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  // Build the timeline: all statuses in order, marking which are done
  const historyStatuses = order.statusHistory.map((h) => h.status);
  const currentIndex = ALL_STATUSES.indexOf(order.status);

  return (
    <div className="space-y-6">
      {/* Back link + header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/orders"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to Orders
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2120]">
            Order {order.orderNumber}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Placed on{" "}
            {format(new Date(order.createdAt), "dd MMM yyyy 'at' hh:mm a")}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column (2 cols wide) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-[#1C2120] mb-4">
              Order Items
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left pb-3 font-medium text-gray-500">
                      Product
                    </th>
                    <th className="text-left pb-3 font-medium text-gray-500">
                      Variant
                    </th>
                    <th className="text-center pb-3 font-medium text-gray-500">
                      Qty
                    </th>
                    <th className="text-right pb-3 font-medium text-gray-500">
                      Price
                    </th>
                    <th className="text-right pb-3 font-medium text-gray-500">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, idx) => {
                    const img = getProductImage(item);
                    return (
                      <tr
                        key={idx}
                        className="border-b border-gray-50 last:border-0"
                      >
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-3">
                            {img ? (
                              <img
                                src={img}
                                alt={getProductName(item)}
                                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-400">
                                <svg
                                  width="16"
                                  height="16"
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
                            <span className="font-medium text-gray-900">
                              {getProductName(item)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-gray-500">
                          {item.variant || "-"}
                        </td>
                        <td className="py-3 text-center text-gray-700">
                          {item.quantity}
                        </td>
                        <td className="py-3 text-right text-gray-700">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="py-3 text-right font-medium text-gray-900">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-[#1C2120] mb-4">
              Order Timeline
            </h2>
            <div className="relative">
              {order.statusHistory.length === 0 ? (
                <p className="text-sm text-gray-500">No status history yet.</p>
              ) : (
                <div className="space-y-0">
                  {order.statusHistory.map((entry, idx) => {
                    const isLast = idx === order.statusHistory.length - 1;
                    const dotColor =
                      STATUS_COLORS[entry.status] || "bg-gray-400";

                    return (
                      <div key={idx} className="relative flex gap-4">
                        {/* Vertical line + dot */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${dotColor}`}
                          />
                          {!isLast && (
                            <div className="w-0.5 bg-gray-200 flex-1 min-h-[32px]" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="pb-6">
                          <p className="text-sm font-medium text-gray-900">
                            {formatStatus(entry.status)}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {format(
                              new Date(entry.timestamp),
                              "dd MMM yyyy 'at' hh:mm a"
                            )}
                          </p>
                          {entry.note && (
                            <p className="text-xs text-gray-600 mt-1 bg-gray-50 rounded-md px-2 py-1">
                              {entry.note}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Future statuses as outlines */}
              {currentIndex >= 0 &&
                currentIndex < ALL_STATUSES.length - 1 &&
                !["cancelled", "refunded"].includes(order.status) && (
                  <div className="mt-2 space-y-0">
                    {ALL_STATUSES.slice(currentIndex + 1)
                      .filter((s) => !["cancelled", "refunded"].includes(s))
                      .filter((s) => !historyStatuses.includes(s))
                      .map((futureStatus, idx, arr) => (
                        <div
                          key={futureStatus}
                          className="relative flex gap-4"
                        >
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full border-2 border-gray-300 bg-white flex-shrink-0 mt-1" />
                            {idx < arr.length - 1 && (
                              <div className="w-0.5 bg-gray-100 flex-1 min-h-[32px]" />
                            )}
                          </div>
                          <div className="pb-6">
                            <p className="text-sm text-gray-400">
                              {formatStatus(futureStatus)}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Right column (1 col wide) */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-[#1C2120] mb-4">
              Order Summary
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">
                  {formatCurrency(order.pricing.subtotal)}
                </span>
              </div>
              {order.pricing.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Discount
                    {order.pricing.couponCode && (
                      <span className="text-xs ml-1">
                        ({order.pricing.couponCode})
                      </span>
                    )}
                  </span>
                  <span className="text-green-600">
                    -{formatCurrency(order.pricing.discount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span className="text-gray-900">
                  {order.pricing.shipping === 0
                    ? "Free"
                    : formatCurrency(order.pricing.shipping)}
                </span>
              </div>
              {order.pricing.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax</span>
                  <span className="text-gray-900">
                    {formatCurrency(order.pricing.tax)}
                  </span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-3 flex justify-between font-semibold">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">
                  {formatCurrency(order.pricing.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-[#1C2120] mb-4">
              Customer
            </h2>
            <div className="space-y-2 text-sm">
              <p className="font-medium text-gray-900">
                {order.customer.name}
              </p>
              <p className="text-gray-500">{order.customer.email}</p>
              {order.customer.phone && (
                <p className="text-gray-500">{order.customer.phone}</p>
              )}
            </div>
          </div>

          {/* Shipping Info */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-[#1C2120] mb-4">
              Shipping Address
            </h2>
            <div className="text-sm text-gray-600 space-y-1">
              {order.shipping.address ? (
                <>
                  <p>{order.shipping.address}</p>
                  {order.shipping.city && (
                    <p>
                      {order.shipping.city}
                      {order.shipping.state && `, ${order.shipping.state}`}
                    </p>
                  )}
                  {order.shipping.pincode && (
                    <p>PIN: {order.shipping.pincode}</p>
                  )}
                </>
              ) : (
                <p className="text-gray-400">No address provided</p>
              )}
            </div>
          </div>

          {/* Status Update */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-[#1C2120] mb-4">
              Update Status
            </h2>
            <form onSubmit={handleStatusUpdate} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-white focus:border-[#0E4D65] focus:ring-1 focus:ring-[#0E4D65]/20 focus:outline-none transition-colors"
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {formatStatus(s)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note (optional)
                </label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={3}
                  placeholder="Add a note about this status change..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-[#0E4D65] focus:ring-1 focus:ring-[#0E4D65]/20 focus:outline-none transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={updating || newStatus === order.status}
                className="w-full px-4 py-2.5 bg-[#0E4D65] text-white text-sm font-medium rounded-lg hover:bg-[#0A3A4D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? "Updating..." : "Update Status"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
