"use client";

import React from "react";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const statusColorMap: Record<string, { bg: string; text: string; dot: string }> = {
  // success
  delivered: { bg: "bg-[#E8F5E9]", text: "text-[#2E7D32]", dot: "bg-[#2E7D32]" },
  active: { bg: "bg-[#E8F5E9]", text: "text-[#2E7D32]", dot: "bg-[#2E7D32]" },
  published: { bg: "bg-[#E8F5E9]", text: "text-[#2E7D32]", dot: "bg-[#2E7D32]" },
  instock: { bg: "bg-[#E8F5E9]", text: "text-[#2E7D32]", dot: "bg-[#2E7D32]" },
  paid: { bg: "bg-[#E8F5E9]", text: "text-[#2E7D32]", dot: "bg-[#2E7D32]" },
  // warning
  pending: { bg: "bg-[#FFF3E0]", text: "text-[#E65100]", dot: "bg-[#E65100]" },
  "low-stock": { bg: "bg-[#FFF3E0]", text: "text-[#E65100]", dot: "bg-[#E65100]" },
  scheduled: { bg: "bg-[#FFF3E0]", text: "text-[#E65100]", dot: "bg-[#E65100]" },
  processing: { bg: "bg-[#FFF3E0]", text: "text-[#E65100]", dot: "bg-[#E65100]" },
  // danger
  cancelled: { bg: "bg-[#FFEBEE]", text: "text-[#C62828]", dot: "bg-[#C62828]" },
  expired: { bg: "bg-[#FFEBEE]", text: "text-[#C62828]", dot: "bg-[#C62828]" },
  outofstock: { bg: "bg-[#FFEBEE]", text: "text-[#C62828]", dot: "bg-[#C62828]" },
  failed: { bg: "bg-[#FFEBEE]", text: "text-[#C62828]", dot: "bg-[#C62828]" },
  refunded: { bg: "bg-[#FFEBEE]", text: "text-[#C62828]", dot: "bg-[#C62828]" },
  // info
  confirmed: { bg: "bg-[#E3F2FD]", text: "text-[#1565C0]", dot: "bg-[#1565C0]" },
  draft: { bg: "bg-[#E3F2FD]", text: "text-[#1565C0]", dot: "bg-[#1565C0]" },
  "out-for-delivery": { bg: "bg-[#E3F2FD]", text: "text-[#1565C0]", dot: "bg-[#1565C0]" },
  // neutral
  inactive: { bg: "bg-[#F5F5F5]", text: "text-[#666]", dot: "bg-[#666]" },
};

const defaultColor = { bg: "bg-[#F5F5F5]", text: "text-[#666]", dot: "bg-[#666]" };

function formatStatus(status: string): string {
  return status
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const key = status.toLowerCase();
  const colors = statusColorMap[key] || defaultColor;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full text-xs font-semibold ${colors.bg} ${colors.text} ${
        size === "sm" ? "px-2 py-0.5" : "px-2.5 py-0.5"
      }`}
    >
      <span
        className={`inline-block w-1 h-1 rounded-full ${colors.dot}`}
        aria-hidden="true"
      />
      {formatStatus(status)}
    </span>
  );
}
