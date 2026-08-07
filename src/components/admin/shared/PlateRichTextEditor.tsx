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
import { sanitizePastedHtml } from "@/lib/plate-html";
import { TOGGLEABLE_MARKS } from "@/lib/plate-schema";
import { ColorDialog, ImageDialog, LinkDialog } from "./editor-dialogs";
import { HEADING_LEVELS, editorPlugins } from "./plate-plugins";

/**
 * Must return a fresh document every call. Slate takes ownership of the node
 * objects it is given, so handing the same references to two editors on one
 * page (the blog and product forms each render two) makes path lookups fail
 * with "Unable to find the path for Slate node".
 */
const createEmptyValue = (): Value => [{ type: "p", children: [{ text: "" }] }];

/**
 * Slate root children must be Elements (`{ type, children }`). Plate's HTML
 * deserializer returns a bare `{ text }` leaf when the source is plain text
 * (no tags) — rendering that crashes with
 * `Array.from(t.children)` → "undefined is not iterable".
 */
function normalizeEditorValue(value: Value): Value {
  return value.map((node) => {
    if (node && typeof (node as { text?: unknown }).text === "string") {
      return { type: "p", children: [node] } as TElement;
    }
    const el = node as TElement;
    if (!Array.isArray(el.children)) {
      return {
        ...el,
        type: el.type || "p",
        children: [{ text: "" }],
      } as TElement;
    }
    return el;
  }) as Value;
}

function escapeHtmlText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Wrap tag-less legacy copy so deserialize yields a real paragraph element. */
function seedHtmlForDeserialize(raw: string): string {
  const cleaned = sanitizePastedHtml(raw).trim();
  if (!cleaned) return "";
  if (/<[a-z][\s\S]*>/i.test(cleaned)) return cleaned;
  return `<p>${escapeHtmlText(cleaned)}</p>`;
}

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

type AlignValue = "left" | "center" | "right" | "justify";

/**
 * ⌘ on Mac, Ctrl elsewhere — display only, for tooltips.
 *
 * Safe to read during render: the toolbar only mounts on the client (the whole
 * editor is gated behind `mounted`), so there is no server/client divergence to
 * reconcile and no need for an effect.
 */
function useModKey() {
  return useMemo(
    () =>
      typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
        ? "⌘"
        : "Ctrl",
    []
  );
}

function ToolbarButton({
  onClick,
  active,
  children,
  title,
  disabled,
  toggle = true,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title: string;
  disabled?: boolean;
  /** Toggles report pressed state; one-shot actions (undo, hr) do not. */
  toggle?: boolean;
}) {
  return (
    <button
      type="button"
      // Keep focus in the editor so the current selection survives the click.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={toggle ? Boolean(active) : undefined}
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

/** Swatch button that opens a colour popover for a text/background mark. */
function ColorButton({
  markKey,
  title,
  label,
}: {
  markKey: string;
  title: string;
  label: React.ReactNode;
}) {
  const editor = useEditorRef();
  const [open, setOpen] = useState(false);
  const current = useEditorSelector(
    (ed) => (ed.api.marks()?.[markKey] as string) ?? "",
    [markKey]
  );

  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <ToolbarButton
        onClick={() => setOpen((v) => !v)}
        active={Boolean(current)}
        title={title}
      >
        <span className="flex flex-col items-center leading-none">
          <span className="text-[11px]">{label}</span>
          <span
            className="mt-0.5 h-1 w-4 rounded-sm border border-gray-300"
            style={{ backgroundColor: current || "transparent" }}
          />
        </span>
      </ToolbarButton>
      {open && (
        <ColorDialog
          title={title}
          initial={current}
          onSelect={(c) => {
            editor.tf.addMark(markKey, c);
            editor.tf.focus();
            close();
          }}
          onClear={() => {
            editor.tf.removeMark(markKey);
            editor.tf.focus();
            close();
          }}
          onClose={close}
        />
      )}
    </>
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
}: {
  uploading: boolean;
  onUploadClick: () => void;
}) {
  const editor = useEditorRef();
  const mod = useModKey();
  const [linkOpen, setLinkOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

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

  /** Existing link URL + the text the dialog should pre-fill. */
  const readLinkContext = useCallback(() => {
    const entry = editor.api.node<TElement & { url?: string }>({
      match: { type: editor.getType(KEYS.link) },
    });
    const selected = editor.api.string(editor.selection ?? undefined) ?? "";
    if (entry) {
      return { url: entry[0].url ?? "", text: editor.api.string(entry[1]) ?? "" };
    }
    return { url: "", text: selected };
  }, [editor]);

  const clearFormatting = useCallback(() => {
    for (const mark of TOGGLEABLE_MARKS) editor.tf.removeMark(mark);
    editor.tf.removeMark(KEYS.color);
    editor.tf.removeMark(KEYS.backgroundColor);
    editor.tf.focus();
  }, [editor]);

  const insertHr = useCallback(() => {
    editor.tf.insertNodes({
      type: editor.getType(KEYS.hr),
      children: [{ text: "" }],
    });
    editor.tf.focus();
  }, [editor]);

  const linkCtx = linkOpen ? readLinkContext() : { url: "", text: "" };

  return (
    <div className="sticky top-0 z-10 relative flex flex-wrap items-center gap-x-1 gap-y-1 border-b border-gray-100 bg-gray-50/95 px-2 py-2 backdrop-blur">
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

      <MarkButton markKey={KEYS.bold} title={`Bold (${mod}+B)`}>
        <strong>B</strong>
      </MarkButton>
      <MarkButton markKey={KEYS.italic} title={`Italic (${mod}+I)`}>
        <em>I</em>
      </MarkButton>
      <MarkButton markKey={KEYS.underline} title={`Underline (${mod}+U)`}>
        <u>U</u>
      </MarkButton>
      <MarkButton markKey={KEYS.strikethrough} title="Strikethrough">
        <s>S</s>
      </MarkButton>
      {/* Code, sub, sup, kbd and highlight were all registered as plugins and
          handled by the serializer, but had no way to reach them. */}
      <MarkButton markKey={KEYS.code} title={`Inline code (${mod}+E)`}>
        <span className="font-mono">{"<>"}</span>
      </MarkButton>
      <MarkButton markKey={KEYS.sub} title="Subscript">
        X<sub className="text-[9px]">2</sub>
      </MarkButton>
      <MarkButton markKey={KEYS.sup} title="Superscript">
        X<sup className="text-[9px]">2</sup>
      </MarkButton>
      <MarkButton markKey={KEYS.kbd} title="Keyboard key">
        <span className="font-mono text-[10px]">Kbd</span>
      </MarkButton>
      <MarkButton markKey={KEYS.highlight} title="Highlight">
        <span className="rounded-sm bg-yellow-200 px-1 text-gray-900">H</span>
      </MarkButton>

      <Divider />

      <ColorButton markKey={KEYS.color} title="Text colour" label="A" />
      <ColorButton markKey={KEYS.backgroundColor} title="Background colour" label="BG" />

      <ToolbarButton onClick={clearFormatting} title="Clear formatting" toggle={false}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M9 7l-1 13M15 7l1 13" /><path d="m3 3 18 18" /></svg>
      </ToolbarButton>

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
      {/* Horizontal rule: plugin and serializer supported it all along, but
          nothing in the UI could insert one. */}
      <ToolbarButton onClick={insertHr} title="Horizontal rule" toggle={false}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12" /></svg>
      </ToolbarButton>

      <Divider />

      {/* Alignment — the previous editor's L/C/R buttons were inert. */}
      <ToolbarButton onClick={() => applyAlign("left")} active={currentAlign === "left" || currentAlign === "start"} title="Align left">L</ToolbarButton>
      <ToolbarButton onClick={() => applyAlign("center")} active={currentAlign === "center"} title="Align center">C</ToolbarButton>
      <ToolbarButton onClick={() => applyAlign("right")} active={currentAlign === "right"} title="Align right">R</ToolbarButton>
      <ToolbarButton onClick={() => applyAlign("justify")} active={currentAlign === "justify"} title="Justify">J</ToolbarButton>

      <Divider />

      <ToolbarButton
        onClick={() => setLinkOpen((v) => !v)}
        active={linkActive}
        title={linkActive ? "Edit link" : "Add link"}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => {
          unwrapLink(editor);
          editor.tf.focus();
        }}
        title="Remove link"
        disabled={!linkActive}
        toggle={false}
      >
        Unlink
      </ToolbarButton>
      {linkOpen && (
        <LinkDialog
          initialUrl={linkCtx.url}
          initialText={linkCtx.text}
          canRemove={linkActive}
          onSubmit={(url, text) => {
            upsertLink(editor, text ? { url, text } : { url });
            setLinkOpen(false);
            editor.tf.focus();
          }}
          onRemove={() => {
            unwrapLink(editor);
            setLinkOpen(false);
            editor.tf.focus();
          }}
          onClose={() => setLinkOpen(false)}
        />
      )}

      <ToolbarButton
        onClick={onUploadClick}
        title={uploading ? "Uploading…" : "Upload image"}
        disabled={uploading}
        toggle={false}
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
      <ToolbarButton onClick={() => setImageOpen((v) => !v)} title="Insert image by URL" toggle={false}>
        URL Img
      </ToolbarButton>
      {imageOpen && (
        <ImageDialog
          initialUrl=""
          initialAlt=""
          onSubmit={(url, alt) => {
            insertImage(editor, url);
            // insertImage only writes `url`; alt is a separate prop on the node.
            if (alt) {
              const entry = editor.api.node({ match: { type: editor.getType(KEYS.img) }, at: [], reverse: true });
              if (entry) editor.tf.setNodes({ alt }, { at: entry[1] });
            }
            setImageOpen(false);
            editor.tf.focus();
          }}
          onClose={() => setImageOpen(false)}
        />
      )}

      <Divider />

      <ToolbarButton onClick={() => editor.tf.undo()} title={`Undo (${mod}+Z)`} toggle={false}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 105.64-11.36L1 10" /></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.tf.redo()} title={`Redo (${mod}+Shift+Z)`} toggle={false}>
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

  const handleImageFile = useCallback(
    async (file: File) => {
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
    },
    [editor, uploadFolder, setUploading]
  );

  // Dropping a screenshot onto the editor, or pasting one from the clipboard,
  // is how most people expect to add an image. Previously the only route was
  // the toolbar's file picker.
  useEffect(() => {
    const el = editor.api.toDOMNode(editor);
    if (!el) return;

    const imageFrom = (dt: DataTransfer | null) =>
      Array.from(dt?.files ?? []).find((f) => f.type.startsWith("image/"));

    const onDrop = (e: DragEvent) => {
      const file = imageFrom(e.dataTransfer);
      if (!file) return;
      e.preventDefault();
      void handleImageFile(file);
    };
    const onDragOver = (e: DragEvent) => {
      if (imageFrom(e.dataTransfer)) e.preventDefault();
    };
    const onPaste = (e: ClipboardEvent) => {
      const file = imageFrom(e.clipboardData);
      if (!file) return;
      e.preventDefault();
      void handleImageFile(file);
    };

    el.addEventListener("drop", onDrop);
    el.addEventListener("dragover", onDragOver);
    el.addEventListener("paste", onPaste);
    return () => {
      el.removeEventListener("drop", onDrop);
      el.removeEventListener("dragover", onDragOver);
      el.removeEventListener("paste", onPaste);
    };
  }, [editor, handleImageFile]);

  return (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) void handleImageFile(file);
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
        return normalizeEditorValue(structuredClone(json) as Value);
      }

      const html = initialHtml.current;
      if (html && html.trim()) {
        // One-time lazy migration: parse the legacy HTML into Slate JSON.
        try {
          const seeded = seedHtmlForDeserialize(html);
          if (!seeded) return createEmptyValue();
          const parsed = ed.api.html.deserialize({ element: seeded });
          if (Array.isArray(parsed) && parsed.length > 0) {
            return normalizeEditorValue(parsed as Value);
          }
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
