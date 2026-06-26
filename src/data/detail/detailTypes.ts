/* =============================================================================
 * Phia Games — Detail Page Types (Bilingual EN / ZH)
 * -----------------------------------------------------------------------------
 * Shared shapes for the reusable detail-page families (generic project, lab,
 * article). Inkvoker keeps its own richer model in `projectData.ts`; this is the
 * lighter, data-driven model for the remaining homepage cards.
 *
 * Data lives in small per-kind files (projectPages / labPages / articlePages)
 * and is merged + indexed in `src/data/detailPages.ts`. Templates derive their
 * in-page nav from `sections`, so adding a section automatically adds a nav
 * link — no per-page nav wiring needed.
 * ============================================================================= */

import type { Localized } from "../siteData";

export type DetailPageKind = "project" | "lab" | "article";

/** A single image tile (hero or asset-board). All paths must exist under public/. */
export interface DetailImage {
  src: string;
  alt: Localized;
  label?: Localized;
}

/** A titled card used for focus areas, process steps, notes, takeaways, etc. */
export interface DetailListItem {
  title: Localized;
  body: Localized;
}

/**
 * One content section. `id` is the in-page anchor (prefixed `detail-` to avoid
 * colliding with homepage section ids like `#work` or Inkvoker's `#project-*`).
 * `nav` is the short label shown in the navbar for this section.
 */
export interface DetailSection {
  id: string;
  nav: Localized;
  heading: Localized;
  /** Optional intro paragraph for the section. */
  body?: Localized;
  /** Optional titled cards (focus areas, process steps, notes, takeaways). */
  items?: DetailListItem[];
  /** Optional image tiles rendered as an asset board. */
  assets?: DetailImage[];
}

export interface RelatedLink {
  label: Localized;
  href: string;
  note?: Localized;
}

export interface DetailPage {
  id: string;
  route: string;
  kind: DetailPageKind;
  title: Localized;
  kicker: Localized;
  summary: Localized;
  heroImage: DetailImage;
  sections: DetailSection[];
  related?: RelatedLink[];
}
