/**
 * Verifies the HTML -> Slate -> HTML round-trip used by the admin editor.
 *
 * This is the safety net for the content migration: existing product
 * descriptions and blog posts are stored as HTML, and the editor parses them
 * into Slate JSON on first edit (see PlateRichTextEditor). If that parse or the
 * re-serialize loses structure, published content silently degrades.
 *
 * Run with:  npm run verify:editor
 */

import { JSDOM } from "jsdom";

// Plate's HTML deserializer walks the DOM, so a document must exist before the
// editor modules are loaded.
const dom = new JSDOM("<!doctype html><html><body></body></html>");
const g = globalThis as unknown as Record<string, unknown>;
g.window = dom.window;
g.document = dom.window.document;
g.DOMParser = dom.window.DOMParser;
g.Node = dom.window.Node;
g.HTMLElement = dom.window.HTMLElement;
g.Element = dom.window.Element;

async function main() {
  const { createSlateEditor, KEYS } = await import("platejs");
  const bn = await import("@platejs/basic-nodes");
  const { BaseTextAlignPlugin } = await import("@platejs/basic-styles");
  const lc = await import("@platejs/list-classic");
  const { BaseLinkPlugin } = await import("@platejs/link");
  const { BaseImagePlugin } = await import("@platejs/media");
  const { slateToHtml, slateToPlainText, stripNonContentTags } = await import(
    "../src/lib/plate-html"
  );

  // Mirrors src/components/admin/shared/plate-plugins.ts, using the base
  // (non-React) variants so this runs in Node.
  const plugins = [
    bn.BaseHeadingPlugin.configure({ options: { levels: [1, 2, 3, 4] } }),
    bn.BaseBlockquotePlugin,
    bn.BaseHorizontalRulePlugin,
    bn.BaseBoldPlugin,
    bn.BaseItalicPlugin,
    bn.BaseUnderlinePlugin,
    bn.BaseStrikethroughPlugin,
    bn.BaseCodePlugin,
    lc.BaseListPlugin,
    BaseLinkPlugin,
    BaseImagePlugin,
    BaseTextAlignPlugin.configure({
      inject: { targetPlugins: [KEYS.p, KEYS.h1, KEYS.h2, KEYS.h3, KEYS.h4] },
    }),
  ];

  const editor = createSlateEditor({ plugins });

  type Case = {
    name: string;
    html: string;
    /** Substrings that must survive the round-trip. */
    expect: string[];
    /** Substrings that must NOT appear. */
    reject?: string[];
  };

  const cases: Case[] = [
    {
      name: "headings",
      html: "<h2>Fresh Roses</h2><h3>Sub</h3>",
      expect: ["<h2>Fresh Roses</h2>", "<h3>Sub</h3>"],
    },
    {
      name: "paragraph + marks",
      html: "<p><strong>Bold</strong> <em>it</em> <u>under</u></p>",
      expect: ["<strong>Bold</strong>", "<em>it</em>", "<u>under</u>"],
    },
    {
      name: "bulleted list",
      html: "<ul><li>One</li><li>Two</li></ul>",
      expect: ["<ul>", "<li>One</li>", "<li>Two</li>", "</ul>"],
    },
    {
      name: "numbered list",
      html: "<ol><li>First</li></ol>",
      expect: ["<ol>", "<li>First</li>"],
    },
    {
      name: "text alignment (the bug TipTap never applied)",
      html: '<p style="text-align:center">Centred</p>',
      expect: ["text-align: center", "Centred"],
    },
    {
      name: "link keeps href",
      html: '<p><a href="https://example.com">shop</a></p>',
      expect: ['href="https://example.com"', ">shop</a>", 'rel="noopener noreferrer"'],
    },
    {
      name: "relative link preserved",
      html: '<p><a href="/flowers/roses">roses</a></p>',
      expect: ['href="/flowers/roses"'],
    },
    {
      name: "image keeps src",
      html: '<img src="https://cdn.example.com/a.jpg">',
      expect: ['<img src="https://cdn.example.com/a.jpg"'],
    },
    {
      name: "blockquote",
      html: "<blockquote>Quoted</blockquote>",
      expect: ["<blockquote>Quoted</blockquote>"],
    },
    {
      name: "XSS: script tag is dropped",
      html: '<p>safe</p><script>alert(1)</script>',
      expect: ["safe"],
      reject: ["<script", "alert(1)"],
    },
    {
      name: "XSS: javascript: href is neutralised",
      html: '<p><a href="javascript:alert(1)">x</a></p>',
      expect: [],
      reject: ["javascript:"],
    },
    {
      name: "entities are escaped, not doubled",
      html: "<p>Tom &amp; Jerry &lt;3</p>",
      expect: ["Tom &amp; Jerry &lt;3"],
      reject: ["&amp;amp;"],
    },
  ];

  let failed = 0;

  for (const c of cases) {
    // Mirrors the editor's import path exactly.
    const value = editor.api.html.deserialize({
      element: stripNonContentTags(c.html),
    });
    const out = slateToHtml(value);

    const missing = c.expect.filter((e) => !out.includes(e));
    const present = (c.reject ?? []).filter((r) => out.includes(r));

    if (missing.length === 0 && present.length === 0) {
      console.log(`  PASS  ${c.name}`);
    } else {
      failed++;
      console.log(`  FAIL  ${c.name}`);
      console.log(`        in:  ${c.html}`);
      console.log(`        out: ${out}`);
      if (missing.length) console.log(`        missing: ${JSON.stringify(missing)}`);
      if (present.length) console.log(`        must not contain: ${JSON.stringify(present)}`);
    }
  }

  // Plain-text extraction feeds <meta name="description">, which must never
  // contain markup.
  const metaValue = editor.api.html.deserialize({
    element: "<h2>Roses</h2><p>Fresh <strong>red</strong> roses.</p>",
  });
  const plain = slateToPlainText(metaValue);
  if (plain.includes("<") || !plain.includes("Fresh red roses.")) {
    failed++;
    console.log(`  FAIL  plain text extraction -> ${JSON.stringify(plain)}`);
  } else {
    console.log(`  PASS  plain text extraction`);
  }

  console.log(
    failed === 0
      ? `\nAll ${cases.length + 1} round-trip checks passed.`
      : `\n${failed} check(s) FAILED.`
  );
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
