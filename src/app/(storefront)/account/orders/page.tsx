"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface OrderItem {
  _id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  pricing: { total: number };
  items: { name: string }[];
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  "out-for-delivery": "bg-orange-100 text-orange-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
};

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/account/orders")
      .then((res) => res.json())
      .then((data) => {
        setOrders(data.orders || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-2 border-[#737530] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" className="mx-auto mb-3">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>
        <p className="text-[#888] text-sm">No orders yet</p>
        <Link href="/" className="inline-block mt-3 text-sm font-semibold text-[#737530] hover:underline">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#1C2120]">My Orders</h2>
      {orders.map((order) => (
        <div key={order._id} className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div>
              <span className="text-sm font-semibold text-[#1C2120]">{order.orderNumber}</span>
              <span className="text-xs text-[#888] ml-3">
                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[order.status] || "bg-gray-100 text-gray-800"}`}>
              {order.status.replace(/-/g, " ")}
            </span>
          </div>
          <p className="text-sm text-[#464646] mb-2 line-clamp-1">
            {order.items.map((i) => i.name).join(", ")}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#1C2120]">
              &#8377; {order.pricing.total.toLocaleString("en-IN")}
            </span>
            <Link
              href={`/order-confirmation?orderId=${order._id}`}
              className="text-xs font-semibold text-[#737530] hover:underline"
            >
              View Details
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
