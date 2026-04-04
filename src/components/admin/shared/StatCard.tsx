"use client";

import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  className?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  trend,
  className = "",
}: StatCardProps) {
  return (
    <div
      className={`bg-white rounded-xl p-6 border border-gray-100 transition-shadow duration-200 hover:shadow-lg ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#0E4D65]/10 text-[#0E4D65]">
            {icon}
          </div>
          <p className="text-2xl font-bold text-[#1C2120] mt-4">{value}</p>
          <p className="text-sm text-[#888] mt-1">{title}</p>
        </div>

        {trend && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
              trend.isPositive
                ? "bg-[#E8F5E9] text-[#2E7D32]"
                : "bg-[#FFEBEE] text-[#C62828]"
            }`}
          >
            {trend.isPositive ? (
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 2.5V9.5M6 2.5L3 5.5M6 2.5L9 5.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 9.5V2.5M6 9.5L3 6.5M6 9.5L9 6.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            {trend.isPositive ? "+" : "-"}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </div>
  );
}
