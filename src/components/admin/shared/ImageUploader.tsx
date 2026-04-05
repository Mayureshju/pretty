"use client";

import React, { useState, useRef } from "react";
import toast from "react-hot-toast";

interface ImageUploaderProps {
  value: string;
  alt?: string;
  onUrlChange: (url: string) => void;
  onAltChange?: (alt: string) => void;
  onRemove: () => void;
  compact?: boolean;
}

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-[#737530] focus:ring-1 focus:ring-[#737530]/20 outline-none transition-colors";

export default function ImageUploader({
  value,
  alt = "",
  onUrlChange,
  onAltChange,
  onRemove,
  compact = false,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [s3Key, setS3Key] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      onUrlChange(data.url);
      setS3Key(data.key);
      setShowUrlInput(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  }

  async function handleDelete() {
    if (s3Key) {
      try {
        await fetch("/api/admin/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: s3Key }),
        });
      } catch {
        // S3 cleanup is best-effort
      }
      setS3Key(null);
    }
    onRemove();
  }

  // Image is set — show preview
  if (value) {
    if (compact) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded border border-gray-200 overflow-hidden flex-shrink-0 bg-gray-50">
            <img src={value} alt="Variant" className="w-full h-full object-cover" />
          </div>
          <button
            type="button"
            onClick={handleDelete}
            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 4L12 12M4 12L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <div className="w-20 h-20 rounded-lg border border-gray-200 overflow-hidden flex-shrink-0 bg-gray-50">
            <img
              src={value}
              alt={alt || "Product image"}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <p className="text-xs text-gray-400 truncate">{value}</p>
            {onAltChange && (
              <input
                type="text"
                value={alt}
                onChange={(e) => onAltChange(e.target.value)}
                placeholder="Alt text (optional)"
                className={inputClass}
              />
            )}
          </div>
          <button
            type="button"
            onClick={handleDelete}
            className="mt-2 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 4L12 12M4 12L12 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // No image — show upload zone
  if (compact) {
    return (
      <label
        className={`flex items-center justify-center w-full h-10 border border-dashed rounded-lg cursor-pointer transition-colors text-xs ${
          dragOver
            ? "border-[#737530] bg-[#737530]/5"
            : "border-gray-300 hover:border-[#737530] hover:bg-gray-50"
        } ${uploading ? "pointer-events-none opacity-60" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} disabled={uploading} />
        {uploading ? (
          <span className="text-gray-500 flex items-center gap-1">
            <svg className="animate-spin h-4 w-4 text-[#737530]" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          </span>
        ) : (
          <span className="text-gray-400">Upload image</span>
        )}
      </label>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-2">
          {/* Upload zone */}
          <label
            className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              dragOver
                ? "border-[#737530] bg-[#737530]/5"
                : "border-gray-300 hover:border-[#737530] hover:bg-gray-50"
            } ${uploading ? "pointer-events-none opacity-60" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            {uploading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg
                  className="animate-spin h-5 w-5 text-[#737530]"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Uploading...
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-gray-400"
                >
                  <path
                    d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-sm text-gray-500">
                  Click or drag image here
                </span>
                <span className="text-xs text-gray-400">Max 5MB</span>
              </div>
            )}
          </label>

          {/* Manual URL toggle */}
          {!showUrlInput ? (
            <button
              type="button"
              onClick={() => setShowUrlInput(true)}
              className="text-xs text-gray-400 hover:text-[#737530] transition-colors"
            >
              Or enter URL manually
            </button>
          ) : (
            <div className="space-y-2">
              <input
                type="url"
                value={value}
                onChange={(e) => onUrlChange(e.target.value)}
                placeholder="Image URL"
                className={inputClass}
              />
              {onAltChange && (
                <input
                  type="text"
                  value={alt}
                  onChange={(e) => onAltChange(e.target.value)}
                  placeholder="Alt text (optional)"
                  className={inputClass}
                />
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="mt-2 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 4L12 12M4 12L12 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
