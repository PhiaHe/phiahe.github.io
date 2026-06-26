import type { Localized, NavLink } from "../data/siteData";

export type NavbarVariant = "home" | "project";
export type CurrentPage = "home" | "inkvoker";

export const projectNav: NavLink[] = [
  { label: { en: "Overview", zh: "概览" } as Localized, href: "#project-main" },
  { label: { en: "Loop", zh: "核心循环" } as Localized, href: "#project-loop" },
  { label: { en: "Systems", zh: "系统" } as Localized, href: "#project-systems" },
  { label: { en: "Gallery", zh: "视觉档案" } as Localized, href: "#project-gallery" },
  { label: { en: "Status", zh: "状态" } as Localized, href: "#project-status" },
];

export const backToWorkLabel = { en: "Back to Work", zh: "返回作品" } as Localized;

export function getNavbarLinks(variant: NavbarVariant, homeLinks: NavLink[] = []) {
  return variant === "project" ? projectNav : homeLinks;
}

export function shouldInterceptNavbarLink(variant: NavbarVariant) {
  return variant === "project";
}
