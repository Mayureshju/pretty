"use client";

import React, { useState, useEffect, useCallback } from "react";
import { format, subDays } from "date-fns";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import LoadingSkeleton from "@/components/admin/shared/LoadingSkeleton";
import toast from "react-hot-toast";

interface RevenueDay {
  date: string;
  revenue: number;
  orders: number;
}

interface StatusCount {
  status: string;
  count: number;
}

interface TopProduct {
  productId: string;
  name: string;
  salesCount: number;
  revenue: number;
}

interface ReportData {
  revenueByDay: RevenueDay[];
  ordersByStatus: StatusCount[];
  topProducts: TopProduct[];
  totalRevenue: number;
  totalOrders: number;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const PRESETS = [
  { label: "Today", days: 0 },
  { label: "7 Days", days: 7 },
  { label: "30 Days", days: 30 },
  { label: "90 Days", days: 90 },
];

function formatStatusLabel(status: string): string {
  return status
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(
    format(subDays(new Date(), 30), "yyyy-MM-dd")
  );
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [activePreset, setActivePreset] = useState<number | null>(30);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);

      const res = await fetch(`/api/admin/reports?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch {
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  function selectPreset(days: number) {
    setActivePreset(days);
    const to = new Date();
    const from = days === 0 ? to : subDays(to, days);
    setDateFrom(format(from, "yyyy-MM-dd"));
    setDateTo(format(to, "yyyy-MM-dd"));
  }

  function handleCustomDate(field: "from" | "to", value: string) {
    setActivePreset(null);
    if (field === "from") setDateFrom(value);
    else setDateTo(value);
  }

  function exportCSV() {
    if (!data) return;

    const lines: string[] = [];

    // Summary
    lines.push("Summary");
    lines.push(`Total Revenue,${data.totalRevenue}`);
    lines.push(`Total Orders,${data.totalOrders}`);
    lines.push(
      `Average Order Value,${data.totalOrders > 0 ? Math.round(data.totalRevenue / data.totalOrders) : 0}`
    );
    lines.push("");

    // Revenue by day
    lines.push("Revenue by Day");
    lines.push("Date,Revenue,Orders");
    data.revenueByDay.forEach((d) => {
      lines.push(`${d.date},${d.revenue},${d.orders}`);
    });
    lines.push("");

    // Orders by status
    lines.push("Orders by Status");
    lines.push("Status,Count");
    data.ordersByStatus.forEach((s) => {
      lines.push(`${s.status},${s.count}`);
    });
    lines.push("");

    // Top products
    lines.push("Top Products");
    lines.push("Rank,Name,Sales Count,Revenue");
    data.topProducts.forEach((p, i) => {
      lines.push(`${i + 1},"${p.name || "Unknown"}",${p.salesCount},${p.revenue}`);
    });

    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${dateFrom}-to-${dateTo}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const averageOrderValue =
    data && data.totalOrders > 0
      ? Math.round(data.totalRevenue / data.totalOrders)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2120]">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">
            Analyze your sales performance
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={!data || loading}
          className="px-4 py-2.5 bg-[#0E4D65] text-white text-sm font-medium rounded-lg hover:bg-[#0A3A4D] transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15.75 11.25V14.25C15.75 14.6478 15.592 15.0294 15.3107 15.3107C15.0294 15.592 14.6478 15.75 14.25 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V11.25M5.25 7.5L9 11.25M9 11.25L12.75 7.5M9 11.25V2.25"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Date Range */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.days}
                onClick={() => selectPreset(preset.days)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  activePreset === preset.days
                    ? "bg-[#0E4D65] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => handleCustomDate("from", e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:border-[#0E4D65] focus:ring-1 focus:ring-[#0E4D65]/20 focus:outline-none transition-colors"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => handleCustomDate("to", e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:border-[#0E4D65] focus:ring-1 focus:ring-[#0E4D65]/20 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton type="cards" rows={3} />
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-[#1C2120]">
                {formatCurrency(data.totalRevenue)}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <p className="text-sm text-gray-500 mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-[#1C2120]">
                {data.totalOrders}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <p className="text-sm text-gray-500 mb-1">Average Order Value</p>
              <p className="text-2xl font-bold text-[#1C2120]">
                {formatCurrency(averageOrderValue)}
              </p>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-[#1C2120] mb-4">
              Revenue Over Time
            </h2>
            {data.revenueByDay.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No revenue data for this period.
              </p>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.revenueByDay}>
                    <defs>
                      <linearGradient
                        id="colorRevenue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#0E4D65"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#0E4D65"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0f0f0"
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => {
                        try {
                          return format(new Date(v), "dd MMM");
                        } catch {
                          return v;
                        }
                      }}
                      tick={{ fontSize: 12, fill: "#999" }}
                    />
                    <YAxis
                      tickFormatter={(v) =>
                        `${Math.round(v / 1000)}k`
                      }
                      tick={{ fontSize: 12, fill: "#999" }}
                    />
                    <Tooltip
                      formatter={(value) => [
                        formatCurrency(Number(value)),
                        "Revenue",
                      ]}
                      labelFormatter={(label) => {
                        try {
                          return format(new Date(label), "dd MMM yyyy");
                        } catch {
                          return label;
                        }
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#0E4D65"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Orders by Status */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-[#1C2120] mb-4">
              Orders by Status
            </h2>
            {data.ordersByStatus.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No order data for this period.
              </p>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.ordersByStatus.map((s) => ({
                      ...s,
                      label: formatStatusLabel(s.status),
                    }))}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0f0f0"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12, fill: "#999" }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 12, fill: "#999" }}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      fill="#0E4D65"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Top Products Table */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-[#1C2120] mb-4">
              Top Products
            </h2>
            {data.topProducts.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No product data for this period.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-4 py-3 font-medium text-gray-500">
                        Rank
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">
                        Product Name
                      </th>
                      <th className="text-center px-4 py-3 font-medium text-gray-500">
                        Sales Count
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProducts.map((product, idx) => (
                      <tr
                        key={product.productId || idx}
                        className="border-b border-gray-50"
                      >
                        <td className="px-4 py-3 text-gray-500">
                          #{idx + 1}
                        </td>
                        <td className="px-4 py-3 font-medium text-[#1C2120]">
                          {product.name || "Unknown Product"}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700">
                          {product.salesCount}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {formatCurrency(product.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
