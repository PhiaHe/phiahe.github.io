import { useRef } from "react";
import { MotionConfig, useScroll } from "framer-motion";
// The site's global liquid visual: the reference-inspired single-blob scene,
// recolored to Phia's palette. (The earlier 4-metaball GlobalLiquidScene was
// retired in favor of this lighter, smoother implementation.)
import MotionLiquidReferenceScene from "./components/MotionLiquidReferenceScene";
import CustomCursor from "./components/CustomCursor";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import FeaturedWorkSection from "./components/FeaturedWorkSection";
import VisualLabSection from "./components/VisualLabSection";
import DevLogSection from "./components/DevLogSection";
import AboutSection from "./components/AboutSection";
import ContactFooter from "./components/ContactFooter";
import SectionDivider from "./components/SectionDivider";
import { useReducedMotion } from "./hooks/useReducedMotion";
import { useWheelSmoothScroll } from "./hooks/useWheelSmoothScroll";
import { useLanguage } from "./i18n/LanguageContext";
import { ui } from "./data/siteData";

export default function App() {
  const reduced = useReducedMotion();
  const { t } = useLanguage();
  useWheelSmoothScroll({ enabled: !reduced });

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

  return (
    <MotionConfig reducedMotion={reduced ? "always" : "user"}>
      <a
        href="#work"
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

      <Navbar />

      {/* Whole page is one transparent stack over the continuous liquid. No
          opaque section backgrounds → the liquid reads as one connected space. */}
      <div ref={pageRef} className="relative z-10">
        <Hero />
        <FeaturedWorkSection />
        <SectionDivider />
        <VisualLabSection />
        <SectionDivider />
        <DevLogSection />
        <SectionDivider />
        <AboutSection />
        <ContactFooter />
      </div>
    </MotionConfig>
  );
}
