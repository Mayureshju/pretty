/**
 * Verifies the HTML -> Slate -> HTML round-trip used by the admin editor.
 *
 * This is the safety net for the content migration: existing product
 * descriptions and blog posts are stored as HTML, and the editor parses them
 * into Slate JSON on first edit (see PlateRichTextEditor). If that parse or the
 * re-serialize loses structure, published content silently degrades.
 *
 * Three things are checked:
 *   1. SEED path   — deserialize(legacy html) -> slateToHtml, the migration.
 *   2. PASTE path  — editor.tf.insertData(...), which additionally runs the
 *                    transformData sanitizers. Paste used to bypass them.
 *   3. PARITY      — the React plugin list and the headless one expose the same
 *                    plugin keys, so a plugin added to one but not the other
 *                    fails here instead of shipping untested.
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

type Case = {
  name: string;
  html: string;
  /** Substrings that must survive the round-trip. */
  expect: string[];
  /** Substrings that must NOT appear. */
  reject?: string[];
  /** Run through the paste pipeline instead of the seed pipeline. */
  viaPaste?: boolean;
};

const cases: Case[] = [
  // ── structure ───────────────────────────────────────────────────────────
  { name: "headings h2/h3", html: "<h2>Fresh Roses</h2><h3>Sub</h3>", expect: ["<h2>Fresh Roses</h2>", "<h3>Sub</h3>"] },
  {
    name: "headings h5/h6 keep their block",
    html: "<h5>five</h5><h6>six</h6>",
    expect: ["<h5>five</h5>", "<h6>six</h6>"],
    // Regression: these used to collapse to the single run-on string "fivesix".
    reject: ["fivesix"],
  },
  { name: "paragraph + marks", html: "<p><strong>Bold</strong> <em>it</em> <u>under</u></p>", expect: ["<strong>Bold</strong>", "<em>it</em>", "<u>under</u>"] },
  { name: "bulleted list", html: "<ul><li>One</li><li>Two</li></ul>", expect: ["<ul>", "One", "Two", "</ul>"] },
  { name: "numbered list", html: "<ol><li>First</li></ol>", expect: ["<ol>", "First"] },
  { name: "nested list survives", html: "<ul><li>a<ul><li>a1</li></ul></li></ul>", expect: ["<ul>", "a1"] },
  { name: "blockquote", html: "<blockquote>Quoted</blockquote>", expect: ["<blockquote>Quoted</blockquote>"] },
  {
    name: "multi-paragraph blockquote keeps its paragraphs",
    html: "<blockquote><p>one</p><p>two</p></blockquote>",
    expect: ["<blockquote>", "<p>one</p>", "<p>two</p>", "</blockquote>"],
    reject: ["onetwo"],
  },
  {
    name: "div content keeps a block wrapper",
    html: "<div>one</div><div>two</div>",
    expect: ["<p>one</p>", "<p>two</p>"],
    // Regression: bare root text ran adjacent blocks together as "onetwo".
    reject: ["onetwo"],
  },
  {
    name: "div wrapping real blocks is unwrapped, not doubled",
    html: "<div><p>one</p><p>two</p></div>",
    expect: ["<p>one</p>", "<p>two</p>"],
    reject: ["onetwo", "<p></p>"],
  },
  {
    name: "nested divs collapse to one paragraph each",
    html: "<div><div>a</div><div>b</div></div>",
    expect: ["<p>a</p>", "<p>b</p>"],
    reject: ["ab"],
  },
  {
    name: "section/article wrappers keep boundaries",
    html: "<section>alpha</section><article>beta</article>",
    expect: ["<p>alpha</p>", "<p>beta</p>"],
    reject: ["alphabeta"],
  },
  {
    name: "line break becomes <br>, not a collapsed space",
    html: "<p>line1<br>line2</p>",
    expect: ["line1<br />line2"],
  },
  { name: "horizontal rule", html: "<p>a</p><hr /><p>b</p>", expect: ["<hr />"] },

  // ── marks ───────────────────────────────────────────────────────────────
  { name: "inline code", html: "<p>run <code>npm i</code></p>", expect: ["<code>npm i</code>"] },
  { name: "subscript / superscript", html: "<p>H<sub>2</sub>O x<sup>2</sup></p>", expect: ["<sub>2</sub>", "<sup>2</sup>"] },
  { name: "highlight", html: "<p><mark>hi</mark></p>", expect: ["<mark>hi</mark>"] },
  { name: "kbd", html: "<p><kbd>Esc</kbd></p>", expect: ["<kbd>Esc</kbd>"] },
  { name: "strikethrough variants", html: "<p><s>a</s><del>b</del><strike>c</strike></p>", expect: ["<s>a</s>", "<s>b</s>", "<s>c</s>"] },
  { name: "text colour", html: '<p><span style="color:#ff0000">red</span></p>', expect: ["color:", "red"] },
  { name: "background colour", html: '<p><span style="background-color:#ffff00">hl</span></p>', expect: ["background-color:", "hl"] },

  // ── alignment ───────────────────────────────────────────────────────────
  { name: "paragraph alignment", html: '<p style="text-align:center">Centred</p>', expect: ["text-align: center", "Centred"] },
  { name: "blockquote alignment", html: '<blockquote style="text-align:center">q</blockquote>', expect: ["text-align: center"] },

  // ── links & images ──────────────────────────────────────────────────────
  { name: "link keeps href", html: '<p><a href="https://example.com">shop</a></p>', expect: ['href="https://example.com"', ">shop</a>", 'rel="noopener noreferrer"'] },
  { name: "relative link preserved", html: '<p><a href="/flowers/roses">roses</a></p>', expect: ['href="/flowers/roses"'] },
  { name: "image keeps src", html: '<img src="https://cdn.example.com/a.jpg">', expect: ['<img src="https://cdn.example.com/a.jpg"'] },
  {
    name: "image keeps alt text",
    html: '<img src="/x.jpg" alt="Red roses in a vase">',
    expect: ['alt="Red roses in a vase"'],
    // Regression: Plate's default image parser reads only src.
    reject: ['alt=""'],
  },
  { name: "image gets lazy loading", html: '<img src="/x.jpg">', expect: ['loading="lazy"'] },

  // ── legacy / third-party markup ─────────────────────────────────────────
  { name: "legacy <b>/<i>", html: "<p><b>bold</b> <i>ital</i></p>", expect: ["<strong>bold</strong>", "<em>ital</em>"] },
  { name: "Google Docs bold span", html: '<p><span style="font-weight:700">g</span></p>', expect: ["<strong>g</strong>"] },
  { name: "Word cruft is discarded", html: '<p class="MsoNormal"><span lang=EN-US>Word</span></p>', expect: ["Word"], reject: ["MsoNormal"] },
  { name: "nbsp entity", html: "<p>a&nbsp;b</p>", expect: ["a b"] },
  { name: "entities escaped, not doubled", html: "<p>Tom &amp; Jerry &lt;3</p>", expect: ["Tom &amp; Jerry &lt;3"], reject: ["&amp;amp;"] },
  { name: "empty paragraph kept as blank line", html: "<p>a</p><p></p><p>b</p>", expect: ["<p></p>"] },
  {
    name: "table cells stay separated",
    html: "<table><tr><td>c1</td><td>c2</td></tr></table>",
    expect: ["c1", "c2"],
    // Regression: cells used to concatenate into the single token "c1c2".
    reject: ["c1c2"],
  },

  // ── security ────────────────────────────────────────────────────────────
  { name: "XSS: script dropped (seed)", html: "<p>safe</p><script>alert(1)</script>", expect: ["safe"], reject: ["<script", "alert(1)"] },
  { name: "XSS: script dropped (PASTE)", html: "<p>safe</p><script>alert(1)</script>", expect: ["safe"], reject: ["<script", "alert(1)"], viaPaste: true },
  { name: "XSS: style dropped (PASTE)", html: "<p>safe</p><style>.x{color:red}</style>", expect: ["safe"], reject: ["color:red"], viaPaste: true },
  { name: "XSS: iframe dropped (PASTE)", html: '<p>safe</p><iframe src="//evil"></iframe>', expect: ["safe"], reject: ["evil", "<iframe"], viaPaste: true },
  { name: "XSS: javascript: href neutralised", html: '<p><a href="javascript:alert(1)">x</a></p>', expect: [], reject: ["javascript:"] },
  { name: "XSS: data: image src dropped", html: '<img src="data:text/html;base64,PHN2Zz4=">', expect: [], reject: ["data:text/html"] },
  { name: "XSS: colour cannot break out of style attr", html: '<p><span style="color:red;xss:expression(alert(1))">t</span></p>', expect: ["t"], reject: ["expression("] },
];

/** Minimal DataTransfer good enough for Plate's parser pipeline. */
function makeDataTransfer(html: string) {
  return {
    getData: (mime: string) => (mime === "text/html" ? html : ""),
    types: ["text/html"],
    files: [] as unknown as FileList,
  } as unknown as DataTransfer;
}

async function main() {
  const { createSlateEditor } = await import("platejs");
  const { basePlugins } = await import("../src/lib/plate-base-plugins");
  const { editorPlugins } = await import(
    "../src/components/admin/shared/plate-plugins"
  );
  const { slateToHtml, slateToPlainText, sanitizePastedHtml } = await import(
    "../src/lib/plate-html"
  );

  let failed = 0;
  const fail = (name: string, detail: string[]) => {
    failed++;
    console.log(`  FAIL  ${name}`);
    for (const d of detail) console.log(`        ${d}`);
  };

  // ── 1 + 2. round-trip cases ───────────────────────────────────────────
  for (const c of cases) {
    let out: string;
    try {
      if (c.viaPaste) {
        const ed = createSlateEditor({
          plugins: basePlugins,
          value: [{ type: "p", children: [{ text: "" }] }],
        });
        ed.tf.select({ path: [0, 0], offset: 0 });
        ed.tf.insertData(makeDataTransfer(c.html));
        out = slateToHtml(ed.children);
      } else {
        const ed = createSlateEditor({ plugins: basePlugins });
        out = slateToHtml(
          ed.api.html.deserialize({ element: sanitizePastedHtml(c.html) })
        );
      }
    } catch (e) {
      fail(c.name, [`threw: ${(e as Error).message}`]);
      continue;
    }

    const missing = c.expect.filter((e) => !out.includes(e));
    const present = (c.reject ?? []).filter((r) => out.includes(r));

    if (missing.length === 0 && present.length === 0) {
      console.log(`  PASS  ${c.name}${c.viaPaste ? "  [paste]" : ""}`);
    } else {
      fail(c.name, [
        `in:  ${c.html}`,
        `out: ${out}`,
        ...(missing.length ? [`missing: ${JSON.stringify(missing)}`] : []),
        ...(present.length ? [`must not contain: ${JSON.stringify(present)}`] : []),
      ]);
    }
  }

  // ── plain text for <meta name="description"> ───────────────────────────
  const ed = createSlateEditor({ plugins: basePlugins });
  const plain = slateToPlainText(
    ed.api.html.deserialize({
      element: "<h2>Roses</h2><p>Fresh <strong>red</strong> roses.</p>",
    })
  );
  if (plain.includes("<") || !plain.includes("Fresh red roses.")) {
    fail("plain text extraction", [`-> ${JSON.stringify(plain)}`]);
  } else {
    console.log("  PASS  plain text extraction");
  }

  // ── 3. toolbar operations ──────────────────────────────────────────────
  // Every toolbar button ultimately calls one of these transforms. Exercising
  // them here catches a control that is wired to a mark the serializer drops,
  // which is how `code`, `hr`, sub/sup and highlight sat dead in the toolbar.
  const { setAlign } = await import("@platejs/basic-styles");
  const { upsertLink, unwrapLink } = await import("@platejs/link");
  const { insertImage } = await import("@platejs/media");
  const { KEYS } = await import("platejs");
  const { TOGGLEABLE_MARKS } = await import("../src/lib/plate-schema");

  const freshEditor = () => {
    const ed = createSlateEditor({
      plugins: basePlugins,
      value: [{ type: "p", children: [{ text: "sample" }] }],
    });
    ed.tf.select({ anchor: { path: [0, 0], offset: 0 }, focus: { path: [0, 0], offset: 6 } });
    return ed;
  };

  const opCases: [string, (ed: ReturnType<typeof freshEditor>) => void, string[]][] = [
    ...TOGGLEABLE_MARKS.map((mark) => {
      const tag = {
        [KEYS.bold]: "strong", [KEYS.italic]: "em", [KEYS.underline]: "u",
        [KEYS.strikethrough]: "s", [KEYS.code]: "code", [KEYS.sub]: "sub",
        [KEYS.sup]: "sup", [KEYS.kbd]: "kbd", [KEYS.highlight]: "mark",
      }[mark as string]!;
      return [
        `toolbar: toggle ${mark} -> <${tag}>`,
        (ed: ReturnType<typeof freshEditor>) => ed.tf.toggleMark(mark),
        [`<${tag}>sample</${tag}>`],
      ] as [string, (ed: ReturnType<typeof freshEditor>) => void, string[]];
    }),
    ["toolbar: text colour", (ed) => ed.tf.addMark(KEYS.color, "#B91C1C"), ["color: #B91C1C"]],
    ["toolbar: background colour", (ed) => ed.tf.addMark(KEYS.backgroundColor, "#ffff00"), ["background-color: #ffff00"]],
    ["toolbar: align centre", (ed) => setAlign(ed, "center"), ["text-align: center"]],
    ["toolbar: align justify", (ed) => setAlign(ed, "justify"), ["text-align: justify"]],
    ["toolbar: heading 2", (ed) => ed.tf.toggleBlock(ed.getType("h2")), ["<h2>sample</h2>"]],
    ["toolbar: heading 6", (ed) => ed.tf.toggleBlock(ed.getType("h6")), ["<h6>sample</h6>"]],
    ["toolbar: blockquote", (ed) => ed.tf.toggleBlock(ed.getType(KEYS.blockquote)), ["<blockquote>sample</blockquote>"]],
    ["toolbar: bullet list", (ed) => ed.tf.toggleBlock(ed.getType(KEYS.ulClassic)), ["<ul>", "sample"]],
    ["toolbar: numbered list", (ed) => ed.tf.toggleBlock(ed.getType(KEYS.olClassic)), ["<ol>", "sample"]],
    [
      "toolbar: horizontal rule",
      (ed) => ed.tf.insertNodes({ type: ed.getType(KEYS.hr), children: [{ text: "" }] }),
      ["<hr />"],
    ],
    ["toolbar: add link with text", (ed) => upsertLink(ed, { url: "https://x.com", text: "shop" }), ['href="https://x.com"', "shop"]],
    [
      "toolbar: remove link",
      (ed) => { upsertLink(ed, { url: "https://x.com" }); unwrapLink(ed); },
      [],
    ],
    [
      "toolbar: insert image with alt",
      (ed) => {
        insertImage(ed, "/rose.jpg");
        const entry = ed.api.node({ match: { type: ed.getType(KEYS.img) }, at: [], reverse: true });
        if (entry) ed.tf.setNodes({ alt: "A red rose" }, { at: entry[1] });
      },
      ['src="/rose.jpg"', 'alt="A red rose"'],
    ],
    [
      "toolbar: clear formatting removes every mark",
      (ed) => {
        for (const m of TOGGLEABLE_MARKS) ed.tf.toggleMark(m);
        ed.tf.addMark(KEYS.color, "#B91C1C");
        // …then the Clear button:
        for (const m of TOGGLEABLE_MARKS) ed.tf.removeMark(m);
        ed.tf.removeMark(KEYS.color);
        ed.tf.removeMark(KEYS.backgroundColor);
      },
      ["<p>sample</p>"],
    ],
  ];

  for (const [name, op, expect] of opCases) {
    let out: string;
    try {
      const ed = freshEditor();
      op(ed);
      out = slateToHtml(ed.children);
    } catch (e) {
      fail(name, [`threw: ${(e as Error).message}`]);
      continue;
    }
    const missing = expect.filter((e) => !out.includes(e));
    // "remove link" asserts absence rather than presence.
    const badLink = name.includes("remove link") && out.includes("<a ");
    if (missing.length === 0 && !badLink) {
      console.log(`  PASS  ${name}`);
    } else {
      fail(name, [`out: ${out}`, ...(missing.length ? [`missing: ${JSON.stringify(missing)}`] : []), ...(badLink ? ["link was not removed"] : [])]);
    }
  }

  // ── 4. plugin-list parity ──────────────────────────────────────────────
  const keysOf = (list: readonly unknown[]) =>
    new Set(list.map((p) => (p as { key: string }).key).filter(Boolean));
  const baseKeys = keysOf(basePlugins);
  const reactKeys = keysOf(editorPlugins);
  const onlyBase = [...baseKeys].filter((k) => !reactKeys.has(k));
  const onlyReact = [...reactKeys].filter((k) => !baseKeys.has(k));

  if (onlyBase.length || onlyReact.length) {
    fail("plugin parity (base vs React)", [
      "the headless list these tests run against has drifted from the editor",
      ...(onlyReact.length ? [`only in plate-plugins.ts: ${onlyReact.join(", ")}`] : []),
      ...(onlyBase.length ? [`only in plate-base-plugins.ts: ${onlyBase.join(", ")}`] : []),
    ]);
  } else {
    console.log(`  PASS  plugin parity (${baseKeys.size} plugins, both lists)`);
  }

  const total = cases.length + opCases.length + 2;
  console.log(
    failed === 0
      ? `\nAll ${total} checks passed.`
      : `\n${failed} of ${total} check(s) FAILED.`
  );
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
