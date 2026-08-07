"use client";

/**
 * Small in-editor popovers for link and image editing.
 *
 * These replace `window.prompt`, which could not pre-fill the existing value
 * (so editing a link meant retyping the whole URL), could not collect a second
 * field (image alt text had nowhere to go), and is blocked outright by some
 * browsers when a page uses it repeatedly.
 */

import { useEffect, useRef, useState } from "react";

export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("#") ||
    /^mailto:/i.test(trimmed) ||
    /^tel:/i.test(trimmed)
  ) {
    return trimmed;
  }
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

const inputClass =
  "w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-xs text-gray-800 outline-none focus:border-[#737530] focus:ring-1 focus:ring-[#737530]/20";

function Popover({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Escape closes; a click outside closes. Both are what an author expects and
  // neither existed with window.prompt's modal behaviour.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("mousedown", onDown);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={title}
      className="absolute left-2 top-full z-30 mt-1 w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
      // Keep clicks inside from bubbling out to the editor and moving selection.
      onMouseDown={(e) => e.stopPropagation()}
    >
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </p>
      {children}
    </div>
  );
}

function Actions({
  onCancel,
  onSubmit,
  submitLabel,
  extra,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="mt-2.5 flex items-center gap-2">
      <button
        type="button"
        onClick={onSubmit}
        className="rounded-md bg-[#737530] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#5f6127]"
      >
        {submitLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-md px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-100"
      >
        Cancel
      </button>
      <span className="ml-auto">{extra}</span>
    </div>
  );
}

export function LinkDialog({
  initialUrl,
  initialText,
  canRemove,
  onSubmit,
  onRemove,
  onClose,
}: {
  initialUrl: string;
  initialText: string;
  canRemove: boolean;
  onSubmit: (url: string, text: string) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [text, setText] = useState(initialText);
  const urlRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    urlRef.current?.focus();
    urlRef.current?.select();
  }, []);

  const submit = () => {
    const normalized = normalizeUrl(url);
    if (!normalized) return;
    onSubmit(normalized, text);
  };

  return (
    <Popover title={canRemove ? "Edit link" : "Add link"} onClose={onClose}>
      <label className="mb-1 block text-[11px] text-gray-600">URL</label>
      <input
        ref={urlRef}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="https://example.com or /flowers/"
        className={inputClass}
      />
      <label className="mb-1 mt-2 block text-[11px] text-gray-600">
        Text to display
      </label>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Link text"
        className={inputClass}
      />
      <Actions
        onSubmit={submit}
        onCancel={onClose}
        submitLabel={canRemove ? "Update" : "Add link"}
        extra={
          canRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              Remove
            </button>
          ) : null
        }
      />
    </Popover>
  );
}

export function ImageDialog({
  initialUrl,
  initialAlt,
  onSubmit,
  onClose,
}: {
  initialUrl: string;
  initialAlt: string;
  onSubmit: (url: string, alt: string) => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [alt, setAlt] = useState(initialAlt);
  const urlRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    urlRef.current?.focus();
    urlRef.current?.select();
  }, []);

  const submit = () => {
    const normalized = normalizeUrl(url);
    if (!normalized) return;
    onSubmit(normalized, alt.trim());
  };

  return (
    <Popover title={initialUrl ? "Edit image" : "Insert image by URL"} onClose={onClose}>
      <label className="mb-1 block text-[11px] text-gray-600">Image URL</label>
      <input
        ref={urlRef}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="https://... or /images/..."
        className={inputClass}
      />
      <label className="mb-1 mt-2 block text-[11px] text-gray-600">
        Alt text <span className="text-gray-400">(describes the image for search engines and screen readers)</span>
      </label>
      <input
        value={alt}
        onChange={(e) => setAlt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Red roses in a glass vase"
        className={inputClass}
      />
      <Actions onSubmit={submit} onCancel={onClose} submitLabel={initialUrl ? "Update" : "Insert"} />
    </Popover>
  );
}

const SWATCHES = [
  "#1C2120", "#737530", "#B91C1C", "#C2410C", "#B45309",
  "#15803D", "#0369A1", "#6D28D9", "#BE185D", "#6B7280",
];

export function ColorDialog({
  title,
  initial,
  onSelect,
  onClear,
  onClose,
}: {
  title: string;
  initial: string;
  onSelect: (color: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const [custom, setCustom] = useState(initial || "#1C2120");

  return (
    <Popover title={title} onClose={onClose}>
      <div className="grid grid-cols-5 gap-1.5">
        {SWATCHES.map((c) => (
          <button
            key={c}
            type="button"
            title={c}
            aria-label={c}
            onClick={() => onSelect(c)}
            className="h-7 w-full rounded border border-gray-200 transition-transform hover:scale-105"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(custom) ? custom : "#1C2120"}
          onChange={(e) => setCustom(e.target.value)}
          className="h-7 w-10 cursor-pointer rounded border border-gray-200 bg-white p-0.5"
        />
        <button
          type="button"
          onClick={() => onSelect(custom)}
          className="rounded-md bg-[#737530] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#5f6127]"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={onClear}
          className="ml-auto text-xs text-gray-600 hover:underline"
        >
          Clear
        </button>
      </div>
    </Popover>
  );
}
