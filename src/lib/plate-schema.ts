/**
 * The editor's node/mark schema, in one place.
 *
 * Two plugin lists exist for the same editor: the React one that actually runs
 * in the admin (`plate-plugins.ts`) and a Base one that runs headless in Node
 * for the round-trip tests. They import from different packages and cannot be
 * merged, so everything that *configures* them — heading levels, which blocks
 * accept alignment, which marks exist — lives here and is imported by both.
 *
 * `scripts/verify-plate-roundtrip.ts` asserts the two lists expose the same
 * plugin keys, so adding a plugin to one and forgetting the other fails the
 * test instead of silently shipping an editor the tests do not cover.
 */

import { KEYS } from "platejs";

/** Heading levels offered in the toolbar. */
export const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const;

/** Blocks that accept text alignment. */
export const ALIGNABLE_TYPES = [
  KEYS.p,
  KEYS.h1,
  KEYS.h2,
  KEYS.h3,
  KEYS.h4,
  KEYS.h5,
  KEYS.h6,
  KEYS.blockquote,
  KEYS.img,
];

/** Character marks the toolbar can toggle, in toolbar order. */
export const TOGGLEABLE_MARKS = [
  KEYS.bold,
  KEYS.italic,
  KEYS.underline,
  KEYS.strikethrough,
  KEYS.code,
  KEYS.sub,
  KEYS.sup,
  KEYS.kbd,
  KEYS.highlight,
] as const;

/** Outbound links get these attributes; mirrored by the HTML serializer. */
export const DEFAULT_LINK_ATTRIBUTES = {
  rel: "noopener noreferrer",
  target: "_blank",
} as const;

/**
 * Image deserializer that keeps `alt`.
 *
 * Plate's built-in image parse reads only `src`
 * (`parse: ({ element, type }) => ({ type, url: element.getAttribute("src") })`),
 * so alt text was dropped both on paste and on the one-time legacy-HTML
 * migration — every migrated product image would have shipped `alt=""`. The
 * node already whitelists `alt` via `dangerouslyAllowAttributes`; only the
 * parser needed widening.
 */
export const imageHtmlDeserializer = {
  rules: [{ validNodeName: "IMG" }],
  parse: ({ element, type }: { element: HTMLElement; type: string }) => {
    const alt = element.getAttribute("alt");
    return {
      type,
      url: element.getAttribute("src"),
      ...(alt ? { alt } : {}),
    };
  },
};
