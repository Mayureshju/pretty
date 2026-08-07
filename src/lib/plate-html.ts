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
  subscript?: boolean;
  superscript?: boolean;
  kbd?: boolean;
  highlight?: boolean;
  color?: string;
  backgroundColor?: string;
};

type ElementNode = {
  type?: string;
  align?: string;
  url?: string;
  target?: string;
  alt?: string;
  caption?: unknown;
  lang?: string;
  colSpan?: number;
  rowSpan?: number;
  header?: boolean;
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
  ["kbd", "kbd"],
  ["subscript", "sub"],
  ["superscript", "sup"],
  ["underline", "u"],
  ["strikethrough", "s"],
  ["italic", "em"],
  ["bold", "strong"],
];

/**
 * Only colours we can vouch for reach the storefront. A Slate colour value is
 * author-supplied, and it lands inside a style attribute, so anything that is
 * not a plain hex/rgb/hsl/keyword token is dropped rather than escaped-and-
 * emitted — `escapeHtml` protects the attribute delimiter but not the CSS
 * grammar inside it.
 */
const CSS_COLOR = /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%/]+\)|hsla?\([\d\s.,%/deg]+\)|[a-z]{3,20})$/i;

function colorStyle(leaf: Leaf): string {
  const parts: string[] = [];
  if (typeof leaf.color === "string" && CSS_COLOR.test(leaf.color.trim())) {
    parts.push(`color: ${leaf.color.trim()}`);
  }
  if (
    typeof leaf.backgroundColor === "string" &&
    CSS_COLOR.test(leaf.backgroundColor.trim())
  ) {
    parts.push(`background-color: ${leaf.backgroundColor.trim()}`);
  }
  return parts.join("; ");
}

function serializeLeaf(leaf: Leaf): string {
  const raw = leaf.text ?? "";
  if (!raw) return "";
  // Slate stores a soft break as a newline inside the text run. HTML collapses
  // that to a space, so the author's line break has to become an explicit <br>
  // or it is silently lost on the storefront.
  let html = escapeHtml(raw).replace(/\n/g, "<br />");
  for (const [mark, tag] of MARKS) {
    if (leaf[mark]) html = `<${tag}>${html}</${tag}>`;
  }
  if (leaf.highlight) html = `<mark>${html}</mark>`;
  const style = colorStyle(leaf);
  if (style) html = `<span style="${escapeHtml(style)}">${html}</span>`;
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
  table: "table",
  tbody: "tbody",
  thead: "thead",
  tr: "tr",
};

/** Blocks whose children are inline-only, so a stray text child is fine. */
const VOID_TAGS = new Set(["hr", "img"]);

/** Raw concatenated text of a subtree, unescaped. Used for code, where marks
 *  and nested markup are meaningless. */
function plainOf(node: SlateNode): string {
  if (isLeaf(node)) return node.text ?? "";
  return ((node as ElementNode).children ?? []).map(plainOf).join("");
}

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
      const img = `<img src="${escapeHtml(src)}" alt="${alt}" loading="lazy" />`;
      // Plate stores a caption as an array of inline nodes on the image node.
      const caption = Array.isArray(el.caption)
        ? (el.caption as SlateNode[]).map(serializeNode).join("")
        : "";
      return caption
        ? `<figure>${img}<figcaption>${caption}</figcaption></figure>`
        : img;
    }
    case "hr":
      return "<hr />";
    case "code_block": {
      // Children are code_line elements; join them as real newlines and emit
      // one <pre><code> rather than a <pre> per line.
      const lines = (el.children ?? [])
        .map((c) => (isLeaf(c) ? escapeHtml(c.text ?? "") : plainOf(c)))
        .join("\n");
      const lang = typeof el.lang === "string" && /^[a-z0-9+#-]{1,20}$/i.test(el.lang)
        ? ` class="language-${escapeHtml(el.lang)}"`
        : "";
      return `<pre><code${lang}>${lines}</code></pre>`;
    }
    case "code_line":
      return escapeHtml(plainOf(el));
    case "td":
    case "th": {
      const tag = type === "th" || el.header ? "th" : "td";
      const span = [
        typeof el.colSpan === "number" && el.colSpan > 1 ? ` colspan="${el.colSpan}"` : "",
        typeof el.rowSpan === "number" && el.rowSpan > 1 ? ` rowspan="${el.rowSpan}"` : "",
      ].join("");
      return `<${tag}${span}>${children}</${tag}>`;
    }
    // Plate wraps list-item content in a `lic` node; the storefront wants the
    // text directly inside <li>, so this level is transparent.
    case "lic":
      return children;
    case "blockquote": {
      // The two ways to make a quote produce different trees: pasting
      // `<blockquote>x</blockquote>` puts text directly inside, while the
      // toolbar's toggleBlock wraps the existing paragraph, giving
      // `<blockquote><p>x</p></blockquote>`. Collapse the single-paragraph case
      // so both routes emit the shape the stored content and prose styles
      // already use. Multi-paragraph quotes keep their paragraphs.
      const kids = el.children ?? [];
      const onlyChild =
        kids.length === 1 && !isLeaf(kids[0]) ? (kids[0] as ElementNode) : null;
      const inner =
        onlyChild && (onlyChild.type ?? "p") === "p"
          ? (onlyChild.children ?? []).map(serializeNode).join("")
          : children;
      if (!inner) return "";
      return `<blockquote${alignAttr(el)}>${inner}</blockquote>`;
    }
    default: {
      // An unmapped type is still a block: falling back to <p> keeps its text
      // separated from the neighbouring block. Emitting the children bare (the
      // previous behaviour) ran adjacent blocks together into one line.
      const tag = BLOCK_TAGS[type] ?? "p";
      if (VOID_TAGS.has(tag)) return `<${tag} />`;
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

/**
 * Give table cells and rows visible boundaries before deserializing.
 *
 * There is no table plugin (no stored content uses tables, so one would be
 * speculative), which means Plate drops `<table>`/`<tr>`/`<td>` and keeps only
 * their text. A pasted two-cell row therefore arrived as the single run-on word
 * "c1c2". Turning cells into space-separated text and rows into paragraphs
 * loses the grid — unavoidable without a table plugin — but keeps the content
 * legible and editable instead of silently mangling it.
 */
export function flattenTables(html: string): string {
  if (!/<table[\s>]/i.test(html)) return html;
  return html
    .replace(/<\/(td|th)\s*>/gi, " </$1>")
    .replace(/<tr\b[^>]*>/gi, "<p>")
    .replace(/<\/tr\s*>/gi, "</p>")
    .replace(/<\/?(table|thead|tbody|tfoot|colgroup|col|caption)\b[^>]*>/gi, "");
}

/** Generic block wrappers Plate has no plugin for. */
const WRAPPER_TAGS = "div|section|article|header|footer|aside|main|address";

/** Anything that implies a block boundary in the source markup. */
const BLOCK_LEVEL =
  "div|section|article|header|footer|aside|main|address|p|h[1-6]|ul|ol|li" +
  "|table|thead|tbody|tfoot|tr|td|th|blockquote|pre|figure|figcaption|dl|dt|dd|hr";

/** A wrapper whose content is inline-only, i.e. the innermost one. */
const LEAF_WRAPPER = new RegExp(
  `<(${WRAPPER_TAGS})\\b[^>]*>((?:(?!<\\/?(?:${BLOCK_LEVEL})\\b)[\\s\\S])*?)<\\/\\1\\s*>`,
  "gi"
);

/**
 * Turn generic block wrappers into paragraphs so their boundaries survive.
 *
 * Plate has no `<div>` plugin, so it discards the tag and keeps only the text.
 * Two sibling divs therefore arrived as two adjacent text runs with nothing
 * between them, and `<div>one</div><div>two</div>` serialized as the single
 * run-on paragraph "onetwo". Eleven stored product descriptions use divs this
 * way. Innermost wrappers holding inline content become real paragraphs;
 * outer wrappers that merely contain other blocks are unwrapped, which is what
 * the deserializer would have done anyway.
 */
export function normalizeBlockWrappers(html: string): string {
  let out = html;
  // Inside-out, so nested wrappers collapse one layer per pass. Bounded because
  // deeply nested markup should not spin here.
  for (let i = 0; i < 8; i++) {
    const next = out.replace(LEAF_WRAPPER, "<p>$2</p>");
    if (next === out) break;
    out = next;
  }
  return out.replace(new RegExp(`<\\/?(?:${WRAPPER_TAGS})\\b[^>]*>`, "gi"), "");
}

/** Everything that must happen to third-party HTML before Plate parses it. */
export function sanitizePastedHtml(html: string): string {
  return normalizeBlockWrappers(flattenTables(stripNonContentTags(html)));
}

/**
 * Serialize a Plate/Slate document to semantic HTML for storage + display.
 *
 * Root children are supposed to be Elements, but Plate's deserializer yields a
 * bare `{ text }` leaf whenever the source used a tag it has no plugin for
 * (`<div>`, `<h5>`, `<pre>`, a table cell). Serializing those leaves directly
 * dropped them out of any block, so consecutive ones ran together — "five" and
 * "six" from `<h5>five</h5><h6>six</h6>` came out as `fivesix`. Consecutive
 * root leaves are gathered into a single paragraph instead, which is what the
 * editor itself does on load (see normalizeEditorValue).
 */
export function slateToHtml(value: unknown): string {
  if (!Array.isArray(value)) return "";

  const out: string[] = [];
  let run: SlateNode[] = [];

  const flush = () => {
    if (!run.length) return;
    const inner = run.map(serializeNode).join("");
    if (inner) out.push(`<p>${inner}</p>`);
    run = [];
  };

  for (const node of value as SlateNode[]) {
    if (isLeaf(node)) {
      run.push(node);
      continue;
    }
    flush();
    out.push(serializeNode(node));
  }
  flush();

  return out.join("");
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
