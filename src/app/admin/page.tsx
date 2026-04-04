"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format } from "date-fns";
import StatCard from "@/components/admin/shared/StatCard";
import StatusBadge from "@/components/admin/shared/StatusBadge";

interface DashboardData {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  recentOrders: {
    _id: string;
    orderNumber: string;
    customer: { name: string };
    pricing: { total: number };
    status: string;
    createdAt: string;
  }[];
  ordersByStatus: { status: string; count: number }[];
  revenueByDay: { date: string; revenue: number }[];
  topProducts: {
    _id: string;
    name: string;
    metrics: { totalSales: number };
  }[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#E65100",
  confirmed: "#1565C0",
  processing: "#F9A825",
  "out-for-delivery": "#0288D1",
  delivered: "#2E7D32",
  cancelled: "#C62828",
  refunded: "#6A1B9A",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded-lg ${className}`}
    />
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/dashboard/stats");
        if (!res.ok) {
          throw new Error("Failed to fetch dashboard stats");
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
          <p className="font-semibold">Error loading dashboard</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1C2120]">Dashboard</h1>
        <p className="text-sm text-[#888] mt-1">Welcome back!</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <>
            <SkeletonBlock className="h-36" />
            <SkeletonBlock className="h-36" />
            <SkeletonBlock className="h-36" />
            <SkeletonBlock className="h-36" />
          </>
        ) : (
          <>
            <StatCard
              title="Total Revenue"
              value={formatCurrency(data?.totalRevenue ?? 0)}
              icon={
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              }
              trend={{ value: 0, isPositive: true }}
            />
            <StatCard
              title="Total Orders"
              value={data?.totalOrders ?? 0}
              icon={
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              }
              trend={{ value: 0, isPositive: true }}
            />
            <StatCard
              title="Total Products"
              value={data?.totalProducts ?? 0}
              icon={
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              }
              trend={{ value: 0, isPositive: true }}
            />
            <StatCard
              title="Total Customers"
              value={data?.totalCustomers ?? 0}
              icon={
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
              trend={{ value: 0, isPositive: true }}
            />
          </>
        )}
      </div>

      {/* Charts Row: Revenue (2/3) + Order Status (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-[#1C2120] mb-4">
            Revenue (Last 30 Days)
          </h2>
          {loading ? (
            <SkeletonBlock className="h-72" />
          ) : data?.revenueByDay && data.revenueByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={288}>
              <AreaChart data={data.revenueByDay}>
                <defs>
                  <linearGradient
                    id="revenueGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#C48B9F"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="#C48B9F"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "#888" }}
                  tickFormatter={(val: string) =>
                    format(new Date(val), "dd MMM")
                  }
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#888" }}
                  tickFormatter={(val: number) =>
                    `₹${val.toLocaleString("en-IN")}`
                  }
                />
                <Tooltip
                  formatter={(value) => [
                    formatCurrency(Number(value)),
                    "Revenue",
                  ]}
                  labelFormatter={(label) =>
                    format(new Date(String(label)), "dd MMM yyyy")
                  }
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#C48B9F"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex items-center justify-center text-[#888] text-sm">
              No revenue data yet
            </div>
          )}
        </div>

        {/* Order Status Pie Chart */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-[#1C2120] mb-4">
            Order Status
          </h2>
          {loading ? (
            <SkeletonBlock className="h-72" />
          ) : data?.ordersByStatus && data.ordersByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={288}>
              <PieChart>
                <Pie
                  data={data.ordersByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  dataKey="count"
                  nameKey="status"
                  paddingAngle={2}
                >
                  {data.ordersByStatus.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={STATUS_COLORS[entry.status] || "#888"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    value,
                    String(name ?? "")
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase()),
                  ]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex items-center justify-center text-[#888] text-sm">
              No orders yet
            </div>
          )}
          {/* Legend */}
          {data?.ordersByStatus && data.ordersByStatus.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {data.ordersByStatus.map((entry) => (
                <div
                  key={entry.status}
                  className="flex items-center gap-1.5 text-xs text-[#666]"
                >
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        STATUS_COLORS[entry.status] || "#888",
                    }}
                  />
                  {entry.status
                    .replace(/-/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase())}{" "}
                  ({entry.count})
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Recent Orders (2/3) + Top Products (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-[#1C2120] mb-4">
            Recent Orders
          </h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonBlock key={i} className="h-12" />
              ))}
            </div>
          ) : data?.recentOrders && data.recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-2 font-medium text-[#888]">
                      Order #
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-[#888]">
                      Customer
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-[#888]">
                      Amount
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-[#888]">
                      Status
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-[#888]">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((order) => (
                    <tr
                      key={order._id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-3 px-2 font-medium text-[#1C2120]">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 px-2 text-[#666]">
                        {order.customer?.name ?? "-"}
                      </td>
                      <td className="py-3 px-2 text-right text-[#1C2120] font-medium">
                        {formatCurrency(order.pricing?.total ?? 0)}
                      </td>
                      <td className="py-3 px-2">
                        <StatusBadge status={order.status} size="sm" />
                      </td>
                      <td className="py-3 px-2 text-right text-[#888]">
                        {format(new Date(order.createdAt), "dd MMM yyyy")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-[#888] text-sm">
              No orders yet
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-[#1C2120] mb-4">
            Top Products
          </h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonBlock key={i} className="h-12" />
              ))}
            </div>
          ) : data?.topProducts && data.topProducts.length > 0 ? (
            <div className="space-y-3">
              {data.topProducts.map((product, index) => (
                <div
                  key={product._id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#C48B9F]/10 text-[#C48B9F] text-sm font-bold shrink-0">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#1C2120] truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-[#888]">
                      {product.metrics?.totalSales ?? 0} sales
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-[#888] text-sm">
              No products yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
