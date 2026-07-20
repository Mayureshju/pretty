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

import { KEYS } from "platejs";
import {
  BlockquotePlugin,
  BoldPlugin,
  CodePlugin,
  HeadingPlugin,
  HorizontalRulePlugin,
  ItalicPlugin,
  StrikethroughPlugin,
  UnderlinePlugin,
} from "@platejs/basic-nodes/react";
import { TextAlignPlugin } from "@platejs/basic-styles/react";
import { ListPlugin } from "@platejs/list-classic/react";
import { LinkPlugin } from "@platejs/link/react";
import { ImagePlugin } from "@platejs/media/react";

/** Heading levels offered in the toolbar, kept in one place. */
export const HEADING_LEVELS = [1, 2, 3, 4] as const;

export const ALIGNABLE_TYPES = [KEYS.p, KEYS.h1, KEYS.h2, KEYS.h3, KEYS.h4];

export const editorPlugins = [
  HeadingPlugin.configure({ options: { levels: [...HEADING_LEVELS] } }),
  BlockquotePlugin,
  HorizontalRulePlugin,

  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin,
  CodePlugin,

  ListPlugin,

  LinkPlugin.configure({
    options: {
      // Matches the storefront's expectation that outbound links are safe.
      defaultLinkAttributes: { rel: "noopener noreferrer", target: "_blank" },
    },
  }),
  ImagePlugin,

  TextAlignPlugin.configure({
    inject: { targetPlugins: ALIGNABLE_TYPES },
  }),
];
