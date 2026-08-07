"use client";

/**
 * Plugin set for the admin rich-text editor.
 *
 * Two deliberate choices worth knowing about:
 *
 * 1. `list-classic`, not the modern `@platejs/list`. The modern list plugin is
 *    indent-based and never emits <ul>/<ol>/<li>; it stores a `listStyleType`
 *    on flat blocks instead. The storefront's `prose` styles, all existing
 *    content, and the MongoDB text index on Product.description all assume real
 *    list markup, so the classic plugin is the compatible choice.
 *
 * 2. TextAlign targets headings as well as paragraphs. Its default is
 *    `targetPlugins: [KEYS.p]` — paragraphs only. The previous TipTap editor
 *    tried to align headings too and silently failed, so the target list is
 *    widened here to match what the toolbar offers.
 */

import { createPlatePlugin } from "platejs/react";
import { KEYS } from "platejs";
import {
  BlockquotePlugin,
  BoldPlugin,
  CodePlugin,
  HeadingPlugin,
  HighlightPlugin,
  HorizontalRulePlugin,
  ItalicPlugin,
  KbdPlugin,
  StrikethroughPlugin,
  SubscriptPlugin,
  SuperscriptPlugin,
  UnderlinePlugin,
} from "@platejs/basic-nodes/react";
import {
  FontBackgroundColorPlugin,
  FontColorPlugin,
  TextAlignPlugin,
} from "@platejs/basic-styles/react";
import { ListPlugin } from "@platejs/list-classic/react";
import { LinkPlugin } from "@platejs/link/react";
import { ImagePlugin } from "@platejs/media/react";

import { sanitizePastedHtml } from "@/lib/plate-html";
import {
  ALIGNABLE_TYPES,
  DEFAULT_LINK_ATTRIBUTES,
  HEADING_LEVELS,
  imageHtmlDeserializer,
} from "@/lib/plate-schema";

export { ALIGNABLE_TYPES, HEADING_LEVELS };

/**
 * Sanitize pasted HTML before Plate's deserializer walks it.
 *
 * Plate drops unknown *tags* but still reads their text, so pasting markup that
 * contains `<script>alert(1)</script>` left a visible paragraph reading
 * "alert(1)", and a `<style>` block dumped raw CSS into the article. The same
 * `stripNonContentTags` already guarded the legacy-HTML seed path on mount;
 * paste was the hole. Nothing here is executable either way — the serializer
 * escapes text — but both corrupt the document.
 */
const PasteSanitizePlugin = createPlatePlugin({
  key: "pasteSanitize",
  inject: {
    plugins: {
      [KEYS.html]: {
        parser: {
          transformData: ({ data }: { data: string }) => sanitizePastedHtml(data),
        },
      },
    },
  },
});

export const editorPlugins = [
  HeadingPlugin.configure({ options: { levels: [...HEADING_LEVELS] } }),
  BlockquotePlugin,
  HorizontalRulePlugin,

  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin,
  CodePlugin,
  SubscriptPlugin,
  SuperscriptPlugin,
  HighlightPlugin,
  KbdPlugin,

  FontColorPlugin,
  FontBackgroundColorPlugin,

  ListPlugin,

  LinkPlugin.configure({
    // Matches the storefront's expectation that outbound links are safe.
    options: { defaultLinkAttributes: { ...DEFAULT_LINK_ATTRIBUTES } },
  }),
  ImagePlugin.configure({
    parsers: { html: { deserializer: imageHtmlDeserializer } },
  }),

  TextAlignPlugin.configure({
    inject: { targetPlugins: ALIGNABLE_TYPES },
  }),

  PasteSanitizePlugin,
];
