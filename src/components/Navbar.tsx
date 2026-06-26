import { type MouseEvent, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { nav, site, ui, type Localized, type NavLink } from "../data/siteData";
import { useLanguage } from "../i18n/LanguageContext";
import {
  backToWorkLabel,
  getNavbarLinks,
  shouldInterceptNavbarLink,
  type CurrentPage,
  type NavbarVariant,
} from "../lib/navigationBehavior";
import LanguageToggle from "./LanguageToggle";
import BrandLogo from "./BrandLogo";

/**
 * Navbar — fixed glass header with the Phia Games sigil, anchor links, language
 * toggle, and a mobile sheet. Background intensifies after a small scroll.
 *
 * Three variants share this shell:
 *  - "home"    → homepage section anchors (#work, #lab, …).
 *  - "project" → Inkvoker's custom in-page nav + a "Back to Work" button.
 *  - "detail"  → data-driven detail pages: in-page section links (intercepted,
 *                scroll within the page) plus a "Back to {Work|Lab|Dev Log}"
 *                anchor that navigates home via the hash router.
 */
interface NavbarProps {
  variant?: NavbarVariant;
  currentPage?: CurrentPage;
  onBackToWork?: () => void;
  /** "detail" variant: in-page section links derived from the page's sections. */
  detailLinks?: NavLink[];
  /** "detail" variant: homepage section to return to (e.g. "#work"). */
  detailBackHref?: string;
  /** "detail" variant: localized label for the back link. */
  detailBackLabel?: Localized;
}

export default function Navbar({
  variant = "home",
  currentPage = "home",
  onBackToWork,
  detailLinks,
  detailBackHref,
  detailBackLabel,
}: NavbarProps) {
  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const links =
    variant === "detail" ? detailLinks ?? [] : getNavbarLinks(variant, nav);
  const interceptLinks = shouldInterceptNavbarLink(variant);
  const showDetailBack = variant === "detail" && Boolean(detailBackHref);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const scrollToProjectTarget = (href: string) => {
    const targetId = href.startsWith("#") ? href.slice(1) : href;
    document
      .getElementById(targetId)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (interceptLinks) {
      event.preventDefault();
      scrollToProjectTarget(href);
    }
    setOpen(false);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-white/5 bg-void-900/70 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <nav className="container-lab flex h-16 items-center justify-between md:h-20">
        {/* Brand — official PNG lockup on desktop, compact mark on mobile.
            Dark navbar → white (light-tone) assets. */}
        <a href="#top" className="group flex items-center" aria-label={site.brand}>
          {/* Desktop: width-controlled horizontal lockup (≈128px, up to 148px on
              lg) so the PHIA GAMES wordmark is clearly legible. */}
          <BrandLogo
            variant="lockup"
            tone="light"
            priority
            alt={site.brand}
            className="hidden h-auto w-[128px] transition-opacity group-hover:opacity-90 sm:block lg:w-[148px]"
          />
          {/* Mobile: compact mark, height-controlled (~30px). */}
          <BrandLogo
            variant="mark"
            tone="light"
            priority
            alt={site.brand}
            className="h-[30px] w-auto transition-opacity group-hover:opacity-90 sm:hidden"
          />
        </a>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(event) => handleNavClick(event, link.href)}
              className="rounded-full px-4 py-2 text-sm text-accent-silver/70 transition-colors hover:text-white"
            >
              {t(link.label)}
            </a>
          ))}
          <LanguageToggle className="ml-2" />
          {currentPage === "inkvoker" && onBackToWork ? (
            <button
              type="button"
              onClick={onBackToWork}
              className="btn btn-ghost ml-2 !px-5 !py-2 text-xs"
            >
              {t(backToWorkLabel)}
            </button>
          ) : showDetailBack ? (
            <a
              href={detailBackHref}
              onClick={() => setOpen(false)}
              className="btn btn-ghost ml-2 !px-5 !py-2 text-xs"
            >
              {t(detailBackLabel ?? backToWorkLabel)}
            </a>
          ) : (
            <a href="#contact" className="btn btn-ghost ml-2 !px-5 !py-2 text-xs">
              {t(ui.getInTouch)}
            </a>
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageToggle />
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-accent-silver"
          >
            <div className="flex flex-col gap-[5px]">
              <span
                className={`h-[1.5px] w-5 bg-current transition-transform duration-300 ${
                  open ? "translate-y-[6.5px] rotate-45" : ""
                }`}
              />
              <span
                className={`h-[1.5px] w-5 bg-current transition-opacity duration-300 ${
                  open ? "opacity-0" : ""
                }`}
              />
              <span
                className={`h-[1.5px] w-5 bg-current transition-transform duration-300 ${
                  open ? "-translate-y-[6.5px] -rotate-45" : ""
                }`}
              />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="md:hidden"
          >
            <div className="container-lab flex flex-col gap-1 border-t border-white/5 bg-void-900/95 pb-6 pt-2 backdrop-blur-xl">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(event) => handleNavClick(event, link.href)}
                  className="rounded-lg px-3 py-3 text-base text-accent-silver/80 transition-colors hover:bg-white/5 hover:text-white"
                >
                  {t(link.label)}
                </a>
              ))}
              {currentPage === "inkvoker" && onBackToWork && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onBackToWork();
                  }}
                  className="rounded-lg px-3 py-3 text-left text-base text-accent-silver/80 transition-colors hover:bg-white/5 hover:text-white"
                >
                  {t(backToWorkLabel)}
                </button>
              )}
              {showDetailBack && (
                <a
                  href={detailBackHref}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-base text-accent-silver/80 transition-colors hover:bg-white/5 hover:text-white"
                >
                  {t(detailBackLabel ?? backToWorkLabel)}
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
