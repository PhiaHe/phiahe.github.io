/* =============================================================================
 * Phia Games — Detail Pages registry + route lookup
 * -----------------------------------------------------------------------------
 * Merges the per-kind detail-page data (generic project / lab / article) into a
 * single list and exposes a route lookup helper used by the hash router in
 * App.tsx. Inkvoker is intentionally NOT here — it keeps its richer custom page
 * (`src/data/projectData.ts` + `src/components/project/*`).
 *
 * Data is authored in small files under `src/data/detail/` so this module stays
 * a thin index rather than one giant bilingual object.
 * ============================================================================= */

import { projectPages } from "./detail/projectPages";
import { labPages } from "./detail/labPages";
import { articlePages } from "./detail/articlePages";
import type { DetailPage } from "./detail/detailTypes";

export type {
  DetailPage,
  DetailPageKind,
  DetailSection,
  DetailListItem,
  DetailImage,
  RelatedLink,
} from "./detail/detailTypes";

/** All data-driven detail pages, in display order by kind. */
export const detailPages: DetailPage[] = [...projectPages, ...labPages, ...articlePages];

/** Look up a detail page by its hash route (e.g. "#/lab/fluid-effects"). */
export function getDetailPageByRoute(route: string): DetailPage | undefined {
  return detailPages.find((page) => page.route === route);
}

/** True when the route resolves to a data-driven detail page (not Inkvoker). */
export function isDetailPageRoute(route: string): boolean {
  return detailPages.some((page) => page.route === route);
}
