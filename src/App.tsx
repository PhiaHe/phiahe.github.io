import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useScroll } from "framer-motion";
// The site's global liquid visual: the reference-inspired single-blob scene,
// recolored to Phia's palette. (The earlier 4-metaball GlobalLiquidScene was
// retired in favor of this lighter, smoother implementation.)
import MotionLiquidReferenceScene from "./components/MotionLiquidReferenceScene";
import CustomCursor from "./components/CustomCursor";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import FeaturedWorkSection from "./components/FeaturedWorkSection";
import ToolsSection from "./components/ToolsSection";
import VisualLabSection from "./components/VisualLabSection";
import DevLogSection from "./components/DevLogSection";
import AboutSection from "./components/AboutSection";
import ContactFooter from "./components/ContactFooter";
import SectionDivider from "./components/SectionDivider";
import ProjectDetailPage from "./components/project/ProjectDetailPage";
import AramMayhemPage from "./components/tools/AramMayhemPage";
import GenericProjectPage from "./components/detail/GenericProjectPage";
import LabDetailPage from "./components/detail/LabDetailPage";
import ArticlePage from "./components/detail/ArticlePage";
import { useReducedMotion } from "./hooks/useReducedMotion";
import { useWheelSmoothScroll } from "./hooks/useWheelSmoothScroll";
import { useLanguage } from "./i18n/LanguageContext";
import { ui } from "./data/siteData";
import { getDetailPageByRoute } from "./data/detailPages";
import {
  getDetailNavLinks,
  getDetailBackTarget,
} from "./lib/navigationBehavior";
import { shouldUseCustomWheelScroll } from "./lib/routeScrollBehavior";

function getHashRoute() {
  if (typeof window === "undefined") return "";
  return window.location.hash;
}

export default function App() {
  const reduced = useReducedMotion();
  const { t } = useLanguage();

  const [route, setRoute] = useState(getHashRoute);

  useEffect(() => {
    const onHashChange = () => setRoute(getHashRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const isInkvokerPage = route === "#/projects/inkvoker";
  const isAramMayhemPage = route === "#/tools/aram-mayhem";
  const detailPage = getDetailPageByRoute(route);
  const isDataDetailPage = Boolean(detailPage);
  const isDetailPage = isInkvokerPage || isAramMayhemPage || isDataDetailPage;
  // Detail pages (custom + data-driven) use native scrolling; the custom wheel
  // smoothing is a homepage-only motif.
  useWheelSmoothScroll({
    enabled: shouldUseCustomWheelScroll(route, reduced) && !isDataDetailPage,
  });

  // Scroll reset is handled in AnimatePresence's onExitComplete (below), not
  // here: doing it after the outgoing page has faded out and unmounted means
  // the jump-to-top happens while only the liquid background is visible, so the
  // user never sees the "yank from mid-page to top" that an effect-based reset
  // produced. The incoming page then fades in already at its hero.

  // Cross-page landing (home<->project) is finalized in AnimatePresence's
  // onExitComplete, so we only flip the route here. The actual scroll happens
  // once the outgoing page has unmounted and the incoming one is mounting.
  const handleBackToWork = useMemo(
    () => () => {
      window.location.hash = "#work";
      setRoute("#work");
    },
    []
  );

  // Where to land after a page swap, read in onExitComplete. Project route ->
  // top of its hero; any homepage hash -> that section (e.g. #work for
  // "Back to Work", #about/#contact from the navbar). With AnimatePresence
  // mode="wait" the incoming page mounts *after* onExitComplete, so the DOM
  // lookup is deferred one frame to let the target section exist.
  //
  // behavior:"instant" is REQUIRED: the document has `scroll-smooth` globally
  // (index.html), so an unqualified scroll would animate — and because the
  // incoming page is already fading in, the user would see it glide from
  // mid-content up to the target. Instant lands it before the fade is visible.
  const finalizeRouteScroll = () => {
    const id = route.startsWith("#") ? route.slice(1) : route;
    const wantsSection = Boolean(id) && !id.startsWith("/");
    requestAnimationFrame(() => {
      const target = wantsSection ? document.getElementById(id) : null;
      if (target) {
        target.scrollIntoView({ behavior: "instant", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "instant" });
      }
    });
  };

  // The liquid is a GLOBAL motif across the WHOLE page. Track progress over the
  // entire scrollable document so the shader's intensity ramp spans every
  // section (hero 1.0 → work .75 → lab .45 → devlog .25 → about/contact .12),
  // never vanishing. Sections are transparent; readability comes from one
  // global gradient + glass cards, not per-section dark panels.
  const pageRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress: pageProgress } = useScroll({
    target: pageRef,
    offset: ["start start", "end end"],
  });

  // Data-driven detail pages (project / lab / article) derive their navbar from
  // the page's own sections; the back link returns to the right homepage section.
  const detailNavLinks = detailPage ? getDetailNavLinks(detailPage) : undefined;
  const detailBack = detailPage ? getDetailBackTarget(detailPage) : undefined;

  // The "Skip to content" target: each page kind owns a stable <main> anchor.
  // Homepage uses #work (its first real section). Detail pages scroll in-page so
  // the skip never mutates the route.
  const mainAnchorId = isInkvokerPage
    ? "project-main"
    : isAramMayhemPage
      ? "aram-tool-main"
      : isDataDetailPage
        ? "detail-main"
        : "work";

  return (
    <MotionConfig reducedMotion={reduced ? "always" : "user"}>
      <a
        href={`#${mainAnchorId}`}
        onClick={
          mainAnchorId === "work"
            ? undefined
            : (e) => {
                e.preventDefault();
                document
                  .getElementById(mainAnchorId)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }
        }
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-void-700 focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        {t(ui.skipToContent)}
      </a>

      {/* Global liquid layer: fixed, full-viewport. z-0 = above the page bg
          (body::before/after at -2/-1), below all content (z-10+). It carries a
          single, gentle global readability gradient internally (see component),
          so individual sections don't need their own dark panels. */}
      <MotionLiquidReferenceScene progress={pageProgress} />

      {/* Refined trailing cursor (fine-pointer only; no-op under reduced-motion). */}
      <CustomCursor />

      <Navbar
        variant={isInkvokerPage ? "project" : isDataDetailPage ? "detail" : "home"}
        currentPage={isInkvokerPage ? "inkvoker" : isDataDetailPage ? "detail" : "home"}
        onBackToWork={isInkvokerPage ? handleBackToWork : undefined}
        detailLinks={detailNavLinks}
        detailBackHref={detailBack?.href}
        detailBackLabel={detailBack?.label}
      />

      {/* Whole page is one transparent stack over the continuous liquid. No
          opaque section backgrounds → the liquid reads as one connected space.
          AnimatePresence cross-fades between the home and project routes; the
          scroll reset happens in onExitComplete (outgoing page already gone,
          only the liquid showing) so the swap never looks like a scroll jump. */}
      <div ref={pageRef} className="relative z-10">
        <AnimatePresence mode="wait" onExitComplete={finalizeRouteScroll}>
          <motion.div
            key={isDetailPage ? route : "home"}
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {isInkvokerPage ? (
              <ProjectDetailPage onBackToWork={handleBackToWork} />
            ) : isAramMayhemPage ? (
              <AramMayhemPage />
            ) : detailPage ? (
              detailPage.kind === "project" ? (
                <GenericProjectPage page={detailPage} />
              ) : detailPage.kind === "lab" ? (
                <LabDetailPage page={detailPage} />
              ) : (
                <ArticlePage page={detailPage} />
              )
            ) : (
              <>
                <Hero />
                <FeaturedWorkSection />
                <SectionDivider />
                <ToolsSection />
                <SectionDivider />
                <VisualLabSection />
                <SectionDivider />
                <DevLogSection />
                <SectionDivider />
                <AboutSection />
                <ContactFooter />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
