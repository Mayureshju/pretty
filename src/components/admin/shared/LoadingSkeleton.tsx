"use client";

import React from "react";

interface LoadingSkeletonProps {
  rows?: number;
  type?: "table" | "cards" | "form";
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className ?? ""}`}
    />
  );
}

function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="w-full">
      {/* Table header */}
      <div className="flex gap-4 pb-4 border-b border-gray-100 mb-4">
        <SkeletonBlock className="h-4 w-[15%]" />
        <SkeletonBlock className="h-4 w-[25%]" />
        <SkeletonBlock className="h-4 w-[20%]" />
        <SkeletonBlock className="h-4 w-[15%]" />
        <SkeletonBlock className="h-4 w-[10%]" />
        <SkeletonBlock className="h-4 w-[15%]" />
      </div>
      {/* Table rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 py-3 border-b border-gray-50"
        >
          <SkeletonBlock className="h-4 w-[15%]" />
          <SkeletonBlock className="h-4 w-[25%]" />
          <SkeletonBlock className="h-4 w-[20%]" />
          <SkeletonBlock className="h-4 w-[15%]" />
          <SkeletonBlock className="h-4 w-[10%]" />
          <SkeletonBlock className="h-4 w-[15%]" />
        </div>
      ))}
    </div>
  );
}

function CardsSkeleton({ rows }: { rows: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-gray-100 p-6"
        >
          <SkeletonBlock className="h-32 w-full rounded-lg mb-4" />
          <SkeletonBlock className="h-4 w-3/4 mb-2" />
          <SkeletonBlock className="h-4 w-1/2 mb-4" />
          <SkeletonBlock className="h-8 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function FormSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-6 max-w-lg">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i}>
          <SkeletonBlock className="h-3.5 w-24 mb-2" />
          <SkeletonBlock className="h-10 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export default function LoadingSkeleton({
  rows = 5,
  type = "table",
}: LoadingSkeletonProps) {
  switch (type) {
    case "cards":
      return <CardsSkeleton rows={rows} />;
    case "form":
      return <FormSkeleton rows={rows} />;
    case "table":
    default:
      return <TableSkeleton rows={rows} />;
  }
}
