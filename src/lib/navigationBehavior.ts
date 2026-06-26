import type { Localized, NavLink } from "../data/siteData";
import type { DetailPage, DetailPageKind } from "../data/detailPages";

export type NavbarVariant = "home" | "project" | "detail";
export type CurrentPage = "home" | "inkvoker" | "detail";

export const projectNav: NavLink[] = [
  { label: { en: "Overview", zh: "概览" } as Localized, href: "#project-main" },
  { label: { en: "Loop", zh: "核心循环" } as Localized, href: "#project-loop" },
  { label: { en: "Systems", zh: "系统" } as Localized, href: "#project-systems" },
  { label: { en: "Gallery", zh: "视觉档案" } as Localized, href: "#project-gallery" },
  { label: { en: "Status", zh: "状态" } as Localized, href: "#project-status" },
];

export const backToWorkLabel = { en: "Back to Work", zh: "返回作品" } as Localized;

/** Per-kind "back to homepage section" target + label for data-driven pages. */
export const detailBackTargets: Record<
  DetailPageKind,
  { href: string; label: Localized }
> = {
  project: { href: "#work", label: { en: "Back to Work", zh: "返回作品" } },
  lab: { href: "#lab", label: { en: "Back to Lab", zh: "返回视觉实验" } },
  article: { href: "#devlog", label: { en: "Back to Dev Log", zh: "返回开发日志" } },
};

export function getNavbarLinks(variant: NavbarVariant, homeLinks: NavLink[] = []) {
  return variant === "project" ? projectNav : homeLinks;
}

/**
 * In-page section links for a data-driven detail page, derived from its
 * sections plus the trailing "related" anchor. These are intercepted so clicks
 * scroll within the page rather than mutating the route.
 */
export function getDetailNavLinks(page: DetailPage): NavLink[] {
  const links: NavLink[] = page.sections.map((section) => ({
    label: section.nav,
    href: `#${section.id}`,
  }));
  if (page.related && page.related.length > 0) {
    links.push({ label: { en: "Related", zh: "相关" } as Localized, href: "#detail-related" });
  }
  return links;
}

export function getDetailBackTarget(page: DetailPage) {
  return detailBackTargets[page.kind];
}

export function shouldInterceptNavbarLink(variant: NavbarVariant) {
  // Both the custom project page and the data-driven detail pages keep their nav
  // clicks in-page (scrollIntoView) so the hash router never bounces home.
  return variant === "project" || variant === "detail";
}
