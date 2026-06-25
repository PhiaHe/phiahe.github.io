import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { hero } from "../data/siteData";
import { useLanguage } from "../i18n/LanguageContext";
import SplitText from "./SplitText";
import MagneticButton from "./MagneticButton";
import BrandLogo from "./BrandLogo";

/**
 * Hero — cinematic text stage (V4).
 *
 * The liquid visual now lives in the GLOBAL layer (GlobalLiquidScene, fixed
 * behind all content), so the hero itself is transparent: the liquid sculpture
 * shows straight through. The hero is a tall stage with a `sticky` pinned copy
 * layer; as you scroll, the copy "flows out" (up + fade + slight scale) while
 * the global liquid (driven by the page-level narrative progress) drifts and
 * morphs — a continuous handoff into Featured Work rather than a hard cut.
 *
 * Readability over the moving liquid is protected by a left-to-right scrim.
 */
export default function Hero() {
  const { t } = useLanguage();
  const stageRef = useRef<HTMLDivElement | null>(null);

  // Local progress over the hero stage (for the copy flow-out only).
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ["start start", "end start"],
  });

  const copyY = useTransform(scrollYProgress, [0, 0.7], [0, -120]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const copyScale = useTransform(scrollYProgress, [0, 0.7], [1, 0.95]);
  const cueOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0]);

  const ease = [0.16, 1, 0.3, 1] as const;

  return (
    <section id="top" ref={stageRef} className="relative h-[180vh]">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        {/* The global readability veil (in GlobalLiquidScene) already lifts
            left-side contrast site-wide. Hero adds only a very light extra
            radial lift for its large title — fades to transparent everywhere,
            so it never forms a seam at the section boundary. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(70% 65% at 16% 50%, rgba(4,6,10,0.45), transparent 68%)",
          }}
        />

        {/* Decorative brand watermark — the official display wordmark at very low
            opacity, bottom-right, behind the copy. Subtle brand presence that
            never competes with the live "Phia Games" title. Fades out on scroll. */}
        <motion.div
          aria-hidden
          style={{ opacity: copyOpacity }}
          className="pointer-events-none absolute bottom-[8%] right-[4%] z-[1] hidden lg:block"
        >
          <BrandLogo
            variant="display"
            tone="light"
            alt=""
            className="h-24 opacity-[0.08] xl:h-28"
          />
        </motion.div>

        <motion.div
          style={{ y: copyY, opacity: copyOpacity, scale: copyScale }}
          className="container-lab relative z-10"
        >
          <div className="max-w-2xl">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease }}
              className="eyebrow"
            >
              {t(hero.kicker)}
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.06, ease }}
              className="mt-5 font-display text-[3.9rem] font-bold leading-[0.92] tracking-tight text-white sm:text-7xl lg:text-8xl"
            >
              <SplitText text="Phia" gradient immediate spread={420} />{" "}
              <SplitText
                text="Games"
                className="text-white/95"
                immediate
                spread={420}
                delayBase={120}
              />
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.16, ease }}
              className="mt-6 max-w-xl text-xl font-medium leading-relaxed text-accent-silver/90 md:text-2xl"
            >
              {t(hero.subtitle)}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.24, ease }}
              className="mt-5 max-w-xl text-base leading-relaxed text-accent-silver/55 md:text-lg"
            >
              {t(hero.intro)}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.32, ease }}
              className="mt-9 flex flex-wrap items-center gap-4"
            >
              <MagneticButton href={hero.primaryCta.href} className="btn btn-primary">
                <span>{t(hero.primaryCta.label)}</span>
                <span aria-hidden>→</span>
              </MagneticButton>
              <MagneticButton href={hero.secondaryCta.href} className="btn btn-ghost">
                <span>{t(hero.secondaryCta.label)}</span>
              </MagneticButton>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.42, ease }}
              className="mt-12 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/5 pt-6"
            >
              {hero.stats.map((s) => (
                <div key={s.value}>
                  <div className="font-display text-2xl font-semibold text-holo">
                    {s.value}
                  </div>
                  <div className="mt-0.5 font-mono text-[11px] uppercase tracking-widest text-accent-silver/45">
                    {t(s.label)}
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.58 }}
              className="mt-8 flex flex-wrap gap-x-7 gap-y-2"
            >
              {hero.readouts.map((r) => (
                <div key={r.k.en} className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-cyan animate-pulse-soft" />
                  <span className="tracking-widest text-accent-silver/40">{t(r.k)}</span>
                  <span className="tracking-wide text-accent-silver/75">{t(r.v)}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          style={{ opacity: cueOpacity }}
          className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
        >
          <span className="font-mono text-[10px] uppercase tracking-ultra text-accent-silver/40">
            {t({ en: "Scroll", zh: "向下滚动" })}
          </span>
          <span className="h-10 w-[1px] bg-gradient-to-b from-accent-cyan/60 to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}
