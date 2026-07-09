"use client";

import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import toast from "react-hot-toast";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  uploadFolder?: "products" | "banners" | "categories" | "blogs";
}

type HeadingLevel = 0 | 1 | 2 | 3 | 4;
type TextAlign = "left" | "center" | "right";

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

function getActiveHeadingLevel(editor: NonNullable<ReturnType<typeof useEditor>>): HeadingLevel {
  for (const level of [1, 2, 3, 4] as const) {
    if (editor.isActive("heading", { level })) return level;
  }
  return 0;
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

function getEditorTextStats(editor: Editor | null) {
  const text = editor?.getText() || "";
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return { words, chars: text.length };
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  minHeight = "200px",
  uploadFolder = "blogs",
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInternalUpdate = useRef(false);
  const lastHtmlRef = useRef(value || "");
  const [uploading, setUploading] = useState(false);
  const [sourceMode, setSourceMode] = useState(false);
  const [sourceValue, setSourceValue] = useState(value || "");
  const [, rerender] = useReducer((n: number) => n + 1, 0);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        defaultProtocol: "https",
        HTMLAttributes: {
          class: "text-[#737530] underline",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        isAllowedUri: (url, ctx) =>
          url.startsWith("/") ||
          url.startsWith("#") ||
          ctx.defaultValidate(url),
      }),
      Image.configure({ inline: false }),
    ],
    content: value || "",
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      lastHtmlRef.current = html;
      isInternalUpdate.current = true;
      setSourceValue(html);
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: "admin-richtext-content focus:outline-none px-4 py-4 text-sm text-gray-800",
        style: `min-height: ${minHeight}`,
      },
    },
  });

  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => rerender();
    editor.on("selectionUpdate", handleUpdate);
    editor.on("transaction", handleUpdate);

    return () => {
      editor.off("selectionUpdate", handleUpdate);
      editor.off("transaction", handleUpdate);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    if (value !== lastHtmlRef.current && value !== editor.getHTML()) {
      lastHtmlRef.current = value || "";
      setSourceValue(value || "");
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    setSourceValue(value || "");
  }, [value]);

  const applyLink = useCallback(() => {
    if (!editor) return;

    const previous = editor.getAttributes("link").href as string | undefined;
    const input = window.prompt("Paste URL", previous || "");
    if (input === null) return;

    const normalized = normalizeUrl(input);
    if (!normalized) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({
        href: normalized,
        target: "_blank",
        rel: "noopener noreferrer",
      })
      .run();
  }, [editor]);

  const removeLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
  }, [editor]);

  const insertImageByUrl = useCallback(() => {
    if (!editor) return;
    const input = window.prompt("Paste image URL");
    if (!input) return;
    const src = normalizeUrl(input);
    if (!src) return;
    editor.chain().focus().setImage({ src }).run();
  }, [editor]);

  const setAlign = useCallback(
    (align: TextAlign) => {
      if (!editor) return;
      const style = align === "left" ? null : `text-align: ${align}`;
      editor
        .chain()
        .focus()
        .updateAttributes("paragraph", { style })
        .updateAttributes("heading", { style })
        .run();
    },
    [editor]
  );

  const syncSourceToEditor = useCallback(() => {
    if (!editor) return;
    lastHtmlRef.current = sourceValue;
    editor.commands.setContent(sourceValue || "", { emitUpdate: false });
    onChange(sourceValue || "");
    setSourceMode(false);
    toast.success("HTML applied");
  }, [editor, onChange, sourceValue]);

  async function handleImageFile(file: File) {
    if (!editor) return;
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

      editor.chain().focus().setImage({ src: data.url }).run();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (!editor) {
    return (
      <div
        className="rounded-lg border border-gray-200 bg-white"
        style={{ minHeight }}
      />
    );
  }

  const activeHeading = getActiveHeadingLevel(editor);
  const stats = getEditorTextStats(editor);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white transition-colors focus-within:border-[#737530] focus-within:ring-1 focus-within:ring-[#737530]/20">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex items-center gap-1 overflow-x-auto border-b border-gray-100 bg-gray-50/95 px-2 py-2 backdrop-blur">
        {/* Headings */}
        <select
          onChange={(e) => {
            const level = parseInt(e.target.value, 10) as HeadingLevel;
            if (level === 0) {
              editor.chain().focus().setParagraph().run();
            } else {
              editor.chain().focus().setHeading({ level }).run();
            }
          }}
          value={activeHeading}
          disabled={sourceMode}
          className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-700 outline-none disabled:opacity-40"
        >
          <option value={0}>Normal</option>
          <option value={1}>Heading 1</option>
          <option value={2}>Heading 2</option>
          <option value={3}>Heading 3</option>
          <option value={4}>Heading 4</option>
        </select>

        <Divider />

        {/* Formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold"
          disabled={sourceMode}
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic"
          disabled={sourceMode}
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="Strikethrough"
          disabled={sourceMode}
        >
          <s>S</s>
        </ToolbarButton>

        <Divider />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet List"
          disabled={sourceMode}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><circle cx="3" cy="6" r="1" fill="currentColor" /><circle cx="3" cy="12" r="1" fill="currentColor" /><circle cx="3" cy="18" r="1" fill="currentColor" /></svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Numbered List"
          disabled={sourceMode}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" /><text x="1" y="8" fontSize="7" fill="currentColor" stroke="none" fontFamily="sans-serif">1</text><text x="1" y="14" fontSize="7" fill="currentColor" stroke="none" fontFamily="sans-serif">2</text><text x="1" y="20" fontSize="7" fill="currentColor" stroke="none" fontFamily="sans-serif">3</text></svg>
        </ToolbarButton>

        <Divider />

        {/* Blockquote */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Quote"
          disabled={sourceMode}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" /></svg>
        </ToolbarButton>

        {/* Code */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")}
          title="Code Block"
          disabled={sourceMode}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
        </ToolbarButton>

        <Divider />

        {/* Alignment */}
        <ToolbarButton onClick={() => setAlign("left")} title="Align left" disabled={sourceMode}>
          L
        </ToolbarButton>
        <ToolbarButton onClick={() => setAlign("center")} title="Align center" disabled={sourceMode}>
          C
        </ToolbarButton>
        <ToolbarButton onClick={() => setAlign("right")} title="Align right" disabled={sourceMode}>
          R
        </ToolbarButton>

        <Divider />

        {/* Link */}
        <ToolbarButton
          onClick={applyLink}
          active={editor.isActive("link")}
          title="Add/Edit Link"
          disabled={sourceMode}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={removeLink}
          title="Remove Link"
          disabled={sourceMode || !editor.isActive("link")}
        >
          Unlink
        </ToolbarButton>

        {/* Image */}
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
        <ToolbarButton
          onClick={() => {
            if (uploading) return;
            fileInputRef.current?.click();
          }}
          title={uploading ? "Uploading..." : "Upload image"}
          disabled={sourceMode || uploading}
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
        <ToolbarButton onClick={insertImageByUrl} title="Insert image URL" disabled={sourceMode}>
          URL Img
        </ToolbarButton>

        <Divider />

        {/* Undo/Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
          disabled={sourceMode || !editor.can().undo()}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 105.64-11.36L1 10" /></svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
          disabled={sourceMode || !editor.can().redo()}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-5.64-11.36L23 10" /></svg>
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => {
            if (sourceMode) {
              syncSourceToEditor();
            } else {
              setSourceValue(editor.getHTML());
              setSourceMode(true);
            }
          }}
          active={sourceMode}
          title={sourceMode ? "Apply HTML" : "Edit HTML Source"}
        >
          {sourceMode ? "Apply HTML" : "HTML"}
        </ToolbarButton>
        {sourceMode && (
          <ToolbarButton
            onClick={() => {
              setSourceValue(editor.getHTML());
              setSourceMode(false);
            }}
            title="Cancel HTML edit"
          >
            Cancel
          </ToolbarButton>
        )}
      </div>

      {/* Editor Content */}
      {sourceMode ? (
        <textarea
          value={sourceValue}
          onChange={(e) => setSourceValue(e.target.value)}
          className="block w-full resize-y border-0 bg-[#111827] px-4 py-4 font-mono text-xs leading-relaxed text-gray-100 outline-none"
          style={{ minHeight }}
          spellCheck={false}
        />
      ) : (
        <div className="relative">
          {placeholder && !editor.getText().trim() && !editor.isFocused && (
            <div className="pointer-events-none absolute px-4 py-4 text-sm text-gray-400">
              {placeholder}
            </div>
          )}
          <EditorContent editor={editor} />
        </div>
      )}
      <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
        <span>{sourceMode ? "HTML source mode" : "Visual editor"}</span>
        <span>
          {stats.words} words · {stats.chars} characters
        </span>
      </div>

      <style jsx global>{`
        .admin-richtext-content {
          min-height: inherit;
          white-space: normal;
          word-break: break-word;
        }
        .admin-richtext-content p {
          margin: 0 0 0.75rem;
          line-height: 1.75;
        }
        .admin-richtext-content h1,
        .admin-richtext-content h2,
        .admin-richtext-content h3,
        .admin-richtext-content h4 {
          margin: 1.25rem 0 0.6rem;
          color: #1c2120;
          font-weight: 700;
          line-height: 1.25;
        }
        .admin-richtext-content h1 {
          font-size: 1.75rem;
        }
        .admin-richtext-content h2 {
          font-size: 1.45rem;
        }
        .admin-richtext-content h3 {
          font-size: 1.2rem;
        }
        .admin-richtext-content h4 {
          font-size: 1rem;
        }
        .admin-richtext-content ul,
        .admin-richtext-content ol {
          margin: 0.75rem 0;
          padding-left: 1.5rem;
        }
        .admin-richtext-content ul {
          list-style: disc;
        }
        .admin-richtext-content ol {
          list-style: decimal;
        }
        .admin-richtext-content li {
          margin: 0.25rem 0;
        }
        .admin-richtext-content blockquote {
          margin: 1rem 0;
          border-left: 4px solid #737530;
          background: #fafaf5;
          padding: 0.75rem 1rem;
          color: #464646;
        }
        .admin-richtext-content pre {
          margin: 1rem 0;
          overflow-x: auto;
          border-radius: 0.75rem;
          background: #111827;
          padding: 1rem;
          color: #f9fafb;
          font-size: 0.8rem;
        }
        .admin-richtext-content code {
          border-radius: 0.25rem;
          background: #f3f4f6;
          padding: 0.1rem 0.25rem;
          font-size: 0.85em;
        }
        .admin-richtext-content pre code {
          background: transparent;
          padding: 0;
        }
        .admin-richtext-content a {
          color: #737530;
          text-decoration: underline;
        }
        .admin-richtext-content img {
          display: block;
          max-width: 100%;
          height: auto;
          margin: 1rem auto;
          border-radius: 0.75rem;
        }
        .admin-richtext-content hr {
          margin: 1.5rem 0;
          border: 0;
          border-top: 1px solid #e5e7eb;
        }
        .admin-richtext-content .ProseMirror-selectednode {
          outline: 3px solid rgba(115, 117, 48, 0.25);
        }
      `}</style>
    </div>
  );
}
