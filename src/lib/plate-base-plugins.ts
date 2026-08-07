/**
 * Headless (non-React) mirror of the admin editor's plugin list.
 *
 * Used by `scripts/verify-plate-roundtrip.ts` so the round-trip tests exercise
 * the same node and mark schema the admin actually runs, and by anything that
 * needs to parse HTML into Slate JSON outside the browser. Keep in step with
 * `src/components/admin/shared/plate-plugins.ts` — the verify script fails if
 * the two drift apart.
 */

import { KEYS, createSlatePlugin } from "platejs";
import {
  BaseBlockquotePlugin,
  BaseBoldPlugin,
  BaseCodePlugin,
  BaseHeadingPlugin,
  BaseHighlightPlugin,
  BaseHorizontalRulePlugin,
  BaseItalicPlugin,
  BaseKbdPlugin,
  BaseStrikethroughPlugin,
  BaseSubscriptPlugin,
  BaseSuperscriptPlugin,
  BaseUnderlinePlugin,
} from "@platejs/basic-nodes";
import {
  BaseFontBackgroundColorPlugin,
  BaseFontColorPlugin,
  BaseTextAlignPlugin,
} from "@platejs/basic-styles";
import { BaseListPlugin } from "@platejs/list-classic";
import { BaseLinkPlugin } from "@platejs/link";
import { BaseImagePlugin } from "@platejs/media";

import { sanitizePastedHtml } from "@/lib/plate-html";
import {
  ALIGNABLE_TYPES,
  DEFAULT_LINK_ATTRIBUTES,
  HEADING_LEVELS,
  imageHtmlDeserializer,
} from "@/lib/plate-schema";

/** @see PasteSanitizePlugin in plate-plugins.ts — same guard, headless. */
const BasePasteSanitizePlugin = createSlatePlugin({
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

export const basePlugins = [
  BaseHeadingPlugin.configure({ options: { levels: [...HEADING_LEVELS] } }),
  BaseBlockquotePlugin,
  BaseHorizontalRulePlugin,

  BaseBoldPlugin,
  BaseItalicPlugin,
  BaseUnderlinePlugin,
  BaseStrikethroughPlugin,
  BaseCodePlugin,
  BaseSubscriptPlugin,
  BaseSuperscriptPlugin,
  BaseHighlightPlugin,
  BaseKbdPlugin,

  BaseFontColorPlugin,
  BaseFontBackgroundColorPlugin,

  BaseListPlugin,

  BaseLinkPlugin.configure({
    options: { defaultLinkAttributes: { ...DEFAULT_LINK_ATTRIBUTES } },
  }),
  BaseImagePlugin.configure({
    parsers: { html: { deserializer: imageHtmlDeserializer } },
  }),

  BaseTextAlignPlugin.configure({
    inject: { targetPlugins: ALIGNABLE_TYPES },
  }),

  BasePasteSanitizePlugin,
];
