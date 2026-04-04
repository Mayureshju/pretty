"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { format } from "date-fns";
import LoadingSkeleton from "@/components/admin/shared/LoadingSkeleton";
import StatusBadge from "@/components/admin/shared/StatusBadge";
import toast from "react-hot-toast";

interface CustomerDetail {
  _id: string;
  name: { first: string; last?: string };
  email: string;
  phone?: string;
  addresses: {
    label?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    isDefault: boolean;
  }[];
  orderCount: number;
  totalSpent: number;
  lastOrderDate?: string;
  createdAt: string;
}

interface OrderItem {
  _id: string;
  orderNumber: string;
  pricing: { total: number };
  status: string;
  createdAt: string;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomer = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/customers/${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCustomer(data);
    } catch {
      toast.error("Failed to load customer");
    }
  }, [id]);

  const fetchOrders = useCallback(async () => {
    if (!customer?.email) return;
    try {
      const params = new URLSearchParams({
        search: customer.email,
        limit: "10",
      });
      const res = await fetch(`/api/admin/orders?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      toast.error("Failed to load orders");
    }
  }, [customer?.email]);

  useEffect(() => {
    fetchCustomer().then(() => setLoading(false));
  }, [fetchCustomer]);

  useEffect(() => {
    if (customer?.email) {
      fetchOrders();
    }
  }, [customer?.email, fetchOrders]);

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="form" rows={6} />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/customers"
          className="text-sm text-[#0E4D65] hover:text-[#0A3A4D] transition-colors flex items-center gap-1"
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
          Back to Customers
        </Link>
        <p className="text-gray-500">Customer not found.</p>
      </div>
    );
  }

  const fullName = `${customer.name.first}${customer.name.last ? ` ${customer.name.last}` : ""}`;

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/customers"
        className="text-sm text-[#0E4D65] hover:text-[#0A3A4D] transition-colors flex items-center gap-1"
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
        Back to Customers
      </Link>

      <h1 className="text-2xl font-bold text-[#1C2120]">{fullName}</h1>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Customer Info */}
        <div className="space-y-6">
          {/* Info Card */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-[#1C2120] mb-4">
              Customer Information
            </h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Name</dt>
                <dd className="text-sm font-medium text-[#1C2120]">
                  {fullName}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Email</dt>
                <dd className="text-sm font-medium text-[#1C2120]">
                  {customer.email}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Phone</dt>
                <dd className="text-sm font-medium text-[#1C2120]">
                  {customer.phone || "-"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Member Since</dt>
                <dd className="text-sm font-medium text-[#1C2120]">
                  {format(new Date(customer.createdAt), "dd MMM yyyy")}
                </dd>
              </div>
            </dl>
          </div>

          {/* Addresses */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-[#1C2120] mb-4">
              Addresses
            </h2>
            {customer.addresses.length === 0 ? (
              <p className="text-sm text-gray-500">No addresses saved.</p>
            ) : (
              <div className="space-y-3">
                {customer.addresses.map((addr, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-100 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {addr.label && (
                        <span className="text-xs font-semibold text-gray-700">
                          {addr.label}
                        </span>
                      )}
                      {addr.isDefault && (
                        <span className="text-xs bg-[#E3F2FD] text-[#1565C0] px-1.5 py-0.5 rounded-full font-medium">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {[addr.address, addr.city, addr.state, addr.pincode]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Orders */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-[#1C2120] mb-4">
              Order Summary
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-[#1C2120]">
                  {customer.orderCount}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total Orders</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-[#1C2120]">
                  {formatCurrency(customer.totalSpent)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total Spent</p>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-[#1C2120] mb-4">
              Recent Orders
            </h2>
            {orders.length === 0 ? (
              <p className="text-sm text-gray-500">No orders found.</p>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order._id}
                    className="flex items-center justify-between border border-gray-100 rounded-lg p-3"
                  >
                    <div>
                      <Link
                        href={`/admin/orders/${order._id}`}
                        className="text-sm font-medium text-[#0E4D65] hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {format(new Date(order.createdAt), "dd MMM yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(order.pricing.total)}
                      </span>
                      <StatusBadge status={order.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
