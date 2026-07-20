/**
 * Slate (Plate) JSON -> semantic HTML.
 *
 * Why not Plate's own `serializeHtml`? It renders the *editor's* DOM: paragraphs
 * come out as `<div class="slate-p">`, links as `<div href=...>`, images are
 * dropped entirely, and every text run is wrapped in three `<span>`s. That markup
 * is unusable for the storefront, which needs clean semantic HTML for its `prose`
 * styles, the MongoDB text index on Product.description, and meta descriptions.
 *
 * The node shapes below are finite and known (we own the plugin list in
 * `plate-plugins.ts`), so a direct walk is smaller, faster and far more
 * predictable than a React static-component tree. The reverse direction
 * (arbitrary HTML -> Slate) is the genuinely hard one and is still handled by
 * Plate's deserializer, client-side.
 *
 * Output from here is rendered with dangerouslySetInnerHTML, so escaping is not
 * optional: text and attribute values are escaped, and URLs are scheme-checked
 * to keep `javascript:` payloads out of href/src.
 */

type Leaf = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
};

type ElementNode = {
  type?: string;
  align?: string;
  url?: string;
  target?: string;
  alt?: string;
  children?: SlateNode[];
};

export type SlateNode = Leaf | ElementNode;

const isLeaf = (n: SlateNode): n is Leaf =>
  typeof (n as Leaf).text === "string";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Allow only schemes that are safe to place in href/src. Anything else
 * (javascript:, data:, vbscript:, ...) collapses to "#" rather than being
 * emitted. Relative and anchor URLs are kept as-is.
 */
function safeUrl(raw: unknown): string {
  if (typeof raw !== "string") return "#";
  const url = raw.trim();
  if (!url) return "#";
  if (/^(\/|#|\.\/|\.\.\/)/.test(url)) return url;
  if (/^(https?:|mailto:|tel:)/i.test(url)) return url;
  return "#";
}

/** Mark wrappers, applied innermost-first so nesting is stable. */
const MARKS: ReadonlyArray<[keyof Leaf, string]> = [
  ["code", "code"],
  ["underline", "u"],
  ["strikethrough", "s"],
  ["italic", "em"],
  ["bold", "strong"],
];

function serializeLeaf(leaf: Leaf): string {
  // Preserve intentional blank lines but never emit a stray empty tag.
  let html = escapeHtml(leaf.text ?? "");
  if (!html) return "";
  for (const [mark, tag] of MARKS) {
    if (leaf[mark]) html = `<${tag}>${html}</${tag}>`;
  }
  return html;
}

function alignAttr(node: ElementNode): string {
  const a = node.align;
  // "start"/"left" is the default; emitting it would only add noise.
  if (!a || a === "start" || a === "left") return "";
  if (!["center", "right", "end", "justify"].includes(a)) return "";
  return ` style="text-align: ${a}"`;
}

const BLOCK_TAGS: Record<string, string> = {
  p: "p",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  blockquote: "blockquote",
  ul: "ul",
  ol: "ol",
  li: "li",
  code_block: "pre",
};

function serializeNode(node: SlateNode): string {
  if (isLeaf(node)) return serializeLeaf(node);

  const el = node as ElementNode;
  const children = (el.children ?? []).map(serializeNode).join("");
  const type = el.type ?? "p";

  switch (type) {
    case "a": {
      const href = safeUrl(el.url);
      const external = /^https?:/i.test(href);
      const rel = external ? ' rel="noopener noreferrer"' : "";
      const target = external ? ' target="_blank"' : "";
      return `<a href="${escapeHtml(href)}"${target}${rel}>${children}</a>`;
    }
    case "img": {
      const src = safeUrl(el.url);
      if (src === "#") return "";
      const alt = escapeHtml(typeof el.alt === "string" ? el.alt : "");
      return `<img src="${escapeHtml(src)}" alt="${alt}" />`;
    }
    case "hr":
      return "<hr />";
    // Plate wraps list-item content in a `lic` node; the storefront wants the
    // text directly inside <li>, so this level is transparent.
    case "lic":
      return children;
    default: {
      const tag = BLOCK_TAGS[type] ?? "p";
      // An empty paragraph is a deliberate blank line in the editor.
      if (!children && tag === "p") return "<p></p>";
      if (!children) return "";
      return `<${tag}${alignAttr(el)}>${children}</${tag}>`;
    }
  }
}

/**
 * Remove elements whose text content is not document content, before handing
 * HTML to Plate's deserializer.
 *
 * Plate correctly drops unknown *tags*, but it still walks their text. A pasted
 * `<script>alert(1)</script>` therefore survives as a visible paragraph reading
 * "alert(1)", and a `<style>` block dumps raw CSS into the article. Neither is
 * executable once serialized (text is escaped), but both corrupt the content,
 * so they are stripped tag-and-contents up front.
 */
export function stripNonContentTags(html: string): string {
  return html.replace(
    /<(script|style|noscript|template|iframe|object|embed|head|title)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
    ""
  );
}

/** Serialize a Plate/Slate document to semantic HTML for storage + display. */
export function slateToHtml(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return (value as SlateNode[]).map(serializeNode).join("");
}

/** Flatten a Plate/Slate document to plain text (meta descriptions, previews). */
export function slateToPlainText(value: unknown): string {
  if (!Array.isArray(value)) return "";
  const walk = (n: SlateNode): string =>
    isLeaf(n) ? n.text ?? "" : ((n as ElementNode).children ?? []).map(walk).join("");
  return (value as SlateNode[])
    .map(walk)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Derive the stored HTML for each [jsonField, htmlField] pair on a validated
 * request body, so the HTML the storefront renders is always generated from the
 * canonical JSON rather than trusted from the client.
 *
 * Only pairs whose JSON field is present are touched, which keeps PATCH-style
 * partial updates from blanking fields the caller did not send.
 */
export function deriveHtmlFields(
  data: Record<string, unknown>,
  pairs: ReadonlyArray<readonly [jsonField: string, htmlField: string]>
): void {
  for (const [jsonField, htmlField] of pairs) {
    const json = data[jsonField];
    if (json === undefined) continue;
    data[htmlField] = Array.isArray(json) ? slateToHtml(json) : "";
  }
}

/**
 * Strip tags from an HTML string for use in <meta> tags. Used for records whose
 * rich text has not been migrated to JSON yet, and for the existing HTML that
 * currently leaks `<p>` markup into meta descriptions.
 */
export function htmlToPlainText(html: string | undefined | null): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}
