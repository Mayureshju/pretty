"use client";

/**
 * Admin rich-text editor (Plate).
 *
 * Replaces the previous TipTap component. Behavioural differences that matter:
 *
 * - The canonical value is Slate JSON, not an HTML string. `fallbackHtml` seeds
 *   the editor for records saved before the migration; HTML is parsed once, on
 *   mount, and never round-tripped again.
 * - `onChange` is debounced. The old editor called the parent's setState on
 *   every keystroke, re-rendering the whole admin form per character.
 * - Toolbar state is read through `useEditorSelector`, so a keystroke only
 *   re-renders a button whose active state actually changed.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import toast from "react-hot-toast";
import { KEYS, type TElement, type Value } from "platejs";
import { Plate, useEditorRef, useEditorSelector, usePlateEditor } from "platejs/react";
import { setAlign } from "@platejs/basic-styles";
import { upsertLink, unwrapLink } from "@platejs/link";
import { insertImage } from "@platejs/media";

import { Editor, EditorContainer } from "@/components/ui/editor";
import { stripNonContentTags } from "@/lib/plate-html";
import { HEADING_LEVELS, editorPlugins } from "./plate-plugins";

/**
 * Must return a fresh document every call. Slate takes ownership of the node
 * objects it is given, so handing the same references to two editors on one
 * page (the blog and product forms each render two) makes path lookups fail
 * with "Unable to find the path for Slate node".
 */
const createEmptyValue = (): Value => [{ type: "p", children: [{ text: "" }] }];

/** Stable no-op subscription: the client/server answer never changes. */
const subscribeNoop = () => () => {};

interface PlateRichTextEditorProps {
  /**
   * Canonical Slate JSON. Typed loosely because it arrives straight from an API
   * response; it is validated as an array and handed to Plate, which normalises
   * anything malformed rather than throwing.
   */
  valueJson?: unknown[] | null;
  /** Legacy HTML, used only to seed records not yet migrated to JSON. */
  fallbackHtml?: string;
  onChange: (value: Value) => void;
  placeholder?: string;
  minHeight?: string;
  uploadFolder?: "products" | "banners" | "categories" | "blogs";
}

type AlignValue = "left" | "center" | "right";

function normalizeUrl(url: string): string {
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

function ToolbarButton({
  onClick,
  active,
  children,
  title,
  disabled,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      // Keep focus in the editor so the current selection survives the click.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? "bg-[#737530] text-white" : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-6 w-px bg-gray-200" />;
}

/** A mark button that only re-renders when its own active state flips. */
function MarkButton({
  markKey,
  title,
  children,
}: {
  markKey: string;
  title: string;
  children: React.ReactNode;
}) {
  const editor = useEditorRef();
  const active = useEditorSelector(
    (ed) => ed.api.marks()?.[markKey] === true,
    [markKey]
  );

  return (
    <ToolbarButton
      onClick={() => {
        editor.tf.toggleMark(markKey);
        editor.tf.focus();
      }}
      active={active}
      title={title}
    >
      {children}
    </ToolbarButton>
  );
}

/** A block button (blockquote, lists) driven by the current block type. */
function BlockButton({
  type,
  title,
  children,
}: {
  type: string;
  title: string;
  children: React.ReactNode;
}) {
  const editor = useEditorRef();
  const active = useEditorSelector(
    (ed) => ed.api.some({ match: { type: ed.getType(type) } }),
    [type]
  );

  return (
    <ToolbarButton
      onClick={() => {
        editor.tf.toggleBlock(editor.getType(type));
        editor.tf.focus();
      }}
      active={active}
      title={title}
    >
      {children}
    </ToolbarButton>
  );
}

function Toolbar({
  uploading,
  onUploadClick,
  onInsertImageUrl,
}: {
  uploading: boolean;
  onUploadClick: () => void;
  onInsertImageUrl: () => void;
}) {
  const editor = useEditorRef();

  const headingLevel = useEditorSelector((ed) => {
    for (const level of HEADING_LEVELS) {
      if (ed.api.some({ match: { type: ed.getType(`h${level}`) } })) return level;
    }
    return 0;
  }, []);

  const linkActive = useEditorSelector(
    (ed) => ed.api.some({ match: { type: ed.getType(KEYS.link) } }),
    []
  );

  const currentAlign = useEditorSelector((ed) => {
    const entry = ed.api.block<TElement & { align?: string }>();
    return entry?.[0]?.align ?? "left";
  }, []);

  // Which node types accept alignment is configured on the plugin itself
  // (see plate-plugins.ts); setAlign just applies it to the current block.
  const applyAlign = useCallback(
    (align: AlignValue) => {
      setAlign(editor, align);
      editor.tf.focus();
    },
    [editor]
  );

  const applyLink = useCallback(() => {
    const input = window.prompt("Paste URL");
    if (input === null) return;
    const normalized = normalizeUrl(input);
    if (!normalized) {
      unwrapLink(editor);
      editor.tf.focus();
      return;
    }
    upsertLink(editor, { url: normalized });
    editor.tf.focus();
  }, [editor]);

  return (
    <div className="sticky top-0 z-10 flex items-center gap-1 overflow-x-auto border-b border-gray-100 bg-gray-50/95 px-2 py-2 backdrop-blur">
      <select
        onChange={(e) => {
          const level = parseInt(e.target.value, 10);
          editor.tf.toggleBlock(
            editor.getType(level === 0 ? KEYS.p : `h${level}`)
          );
          editor.tf.focus();
        }}
        value={headingLevel}
        className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-700 outline-none"
      >
        <option value={0}>Normal</option>
        {HEADING_LEVELS.map((l) => (
          <option key={l} value={l}>
            Heading {l}
          </option>
        ))}
      </select>

      <Divider />

      <MarkButton markKey={KEYS.bold} title="Bold">
        <strong>B</strong>
      </MarkButton>
      <MarkButton markKey={KEYS.italic} title="Italic">
        <em>I</em>
      </MarkButton>
      {/* Underline: available in the old editor's engine but never exposed. */}
      <MarkButton markKey={KEYS.underline} title="Underline">
        <u>U</u>
      </MarkButton>
      <MarkButton markKey={KEYS.strikethrough} title="Strikethrough">
        <s>S</s>
      </MarkButton>

      <Divider />

      <BlockButton type={KEYS.ulClassic} title="Bullet List">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><circle cx="3" cy="6" r="1" fill="currentColor" /><circle cx="3" cy="12" r="1" fill="currentColor" /><circle cx="3" cy="18" r="1" fill="currentColor" /></svg>
      </BlockButton>
      <BlockButton type={KEYS.olClassic} title="Numbered List">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" /><text x="1" y="8" fontSize="7" fill="currentColor" stroke="none" fontFamily="sans-serif">1</text><text x="1" y="14" fontSize="7" fill="currentColor" stroke="none" fontFamily="sans-serif">2</text><text x="1" y="20" fontSize="7" fill="currentColor" stroke="none" fontFamily="sans-serif">3</text></svg>
      </BlockButton>

      <Divider />

      <BlockButton type={KEYS.blockquote} title="Quote">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" /></svg>
      </BlockButton>

      <Divider />

      {/* Alignment — the previous editor's L/C/R buttons were inert. */}
      <ToolbarButton onClick={() => applyAlign("left")} active={currentAlign === "left" || currentAlign === "start"} title="Align left">L</ToolbarButton>
      <ToolbarButton onClick={() => applyAlign("center")} active={currentAlign === "center"} title="Align center">C</ToolbarButton>
      <ToolbarButton onClick={() => applyAlign("right")} active={currentAlign === "right"} title="Align right">R</ToolbarButton>

      <Divider />

      <ToolbarButton onClick={applyLink} active={linkActive} title="Add/Edit Link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => {
          unwrapLink(editor);
          editor.tf.focus();
        }}
        title="Remove Link"
        disabled={!linkActive}
      >
        Unlink
      </ToolbarButton>

      <ToolbarButton
        onClick={onUploadClick}
        title={uploading ? "Uploading..." : "Upload image"}
        disabled={uploading}
      >
        {uploading ? (
          <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
        )}
      </ToolbarButton>
      <ToolbarButton onClick={onInsertImageUrl} title="Insert image URL">
        URL Img
      </ToolbarButton>

      <Divider />

      <ToolbarButton onClick={() => editor.tf.undo()} title="Undo">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 105.64-11.36L1 10" /></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.tf.redo()} title="Redo">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-5.64-11.36L23 10" /></svg>
      </ToolbarButton>
    </div>
  );
}

/** Word/character counter, isolated so it doesn't re-render the toolbar. */
function EditorStats() {
  const text = useEditorSelector((ed) => ed.api.string(), []);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return (
    <span>
      {words} words · {text.length} characters
    </span>
  );
}

/** Bridges Plate's inner editor to the file input + upload endpoint. */
function ImageUploadBridge({
  uploadFolder,
  fileInputRef,
  setUploading,
}: {
  uploadFolder: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  setUploading: (v: boolean) => void;
}) {
  const editor = useEditorRef();

  async function handleImageFile(file: File) {
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
      formData.append("folder", uploadFolder);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      insertImage(editor, data.url);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleImageFile(file);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }}
    />
  );
}

export default function PlateRichTextEditor({
  valueJson,
  fallbackHtml,
  onChange,
  placeholder = "Start typing...",
  minHeight = "200px",
  uploadFolder = "blogs",
}: PlateRichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // The editor is deliberately not server-rendered. Seeding from `fallbackHtml`
  // needs a DOM to parse the legacy markup, which the server does not have, so
  // SSR would emit an empty editor and hydration would mismatch. This is an
  // admin-only surface with no SEO value, so rendering after mount costs
  // nothing. useSyncExternalStore is the hydration-safe way to ask "am I on the
  // client" — it returns false during SSR and the first client render, so the
  // two agree, then flips.
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );

  // Captured once: the editor owns its value after mount, so later prop changes
  // must not yank content out from under the author mid-edit.
  const initialJson = useRef(valueJson);
  const initialHtml = useRef(fallbackHtml);

  const editor = usePlateEditor({
    plugins: editorPlugins,
    value: (ed) => {
      const json = initialJson.current;
      // Trust boundary: shape comes from the database, Plate normalises it.
      // Cloned because Slate mutates the nodes it is handed, and this array is
      // the parent form's React state.
      if (Array.isArray(json) && json.length > 0) {
        return structuredClone(json) as Value;
      }

      const html = initialHtml.current;
      if (html && html.trim()) {
        // One-time lazy migration: parse the legacy HTML into Slate JSON.
        try {
          const parsed = ed.api.html.deserialize({
            element: stripNonContentTags(html),
          });
          if (Array.isArray(parsed) && parsed.length > 0) return parsed as Value;
        } catch {
          // Fall through to an empty document rather than blocking the editor.
        }
      }
      return createEmptyValue();
    },
  });

  // Debounced upward sync. The previous editor called the parent's setState on
  // every keystroke, which re-rendered the entire admin form per character.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleValueChange = useCallback(({ value }: { value: Value }) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChangeRef.current(value), 300);
  }, []);

  // Flush any pending change so a fast save never loses the last keystrokes.
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        onChangeRef.current(editor.children as Value);
      }
    };
  }, [editor]);

  const containerStyle = useMemo(() => ({ minHeight }), [minHeight]);

  // Reserve the same box before mount so swapping in the editor does not shift
  // the surrounding form.
  if (!mounted) {
    return (
      <div
        className="overflow-hidden rounded-xl border border-gray-200 bg-white"
        style={containerStyle}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white transition-colors focus-within:border-[#737530] focus-within:ring-1 focus-within:ring-[#737530]/20">
      <Plate editor={editor} onValueChange={handleValueChange}>
        <Toolbar
          uploading={uploading}
          onUploadClick={() => {
            if (!uploading) fileInputRef.current?.click();
          }}
          onInsertImageUrl={() => {
            const input = window.prompt("Paste image URL");
            if (!input) return;
            const src = normalizeUrl(input);
            if (src) insertImage(editor, src);
          }}
        />
        <ImageUploadBridge
          uploadFolder={uploadFolder}
          fileInputRef={fileInputRef}
          setUploading={setUploading}
        />
        <EditorContainer style={containerStyle}>
          <Editor
            variant="none"
            placeholder={placeholder}
            style={containerStyle}
            className="admin-plate-content px-4 py-4 text-sm text-gray-800 focus:outline-none"
          />
        </EditorContainer>
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
          <span>Visual editor</span>
          <EditorStats />
        </div>
      </Plate>
    </div>
  );
}
