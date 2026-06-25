import { motion, type MotionValue } from "framer-motion";
import type { FeaturedWork } from "../data/siteData";
import { useLanguage } from "../i18n/LanguageContext";
import Reveal from "./Reveal";
import SpotlightCard from "./SpotlightCard";

interface WorkCardProps {
  work: FeaturedWork;
  delay?: number;
  /** Shared scroll-velocity skew (deg). Subtle "drag" when the page is flung. */
  skew?: MotionValue<number>;
}

/**
 * WorkCard — featured project card built on the shared SpotlightCard. Cover art
 * lifts on the z-axis (parallax) while the spotlight + border-light track the
 * cursor. A shared scroll-velocity skew adds a subtle drag on fast scroll.
 * Text is localized via useLanguage.
 */
export default function WorkCard({ work, delay = 0, skew }: WorkCardProps) {
  const { t } = useLanguage();

  return (
    <Reveal delay={delay} className="h-full">
      <motion.div style={skew ? { skewY: skew } : undefined} className="h-full">
        <SpotlightCard accent={work.accent} className="h-full" tilt={5}>
        <div className="flex h-full flex-col">
          {/* Cover */}
          <div className="relative aspect-[16/10] overflow-hidden rounded-t-[19px]">
            <img
              src={work.cover}
              alt={`${t(work.title)} concept placeholder`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              style={{ transform: "translateZ(30px) scale(1.04)" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-void-900 via-void-900/10 to-transparent" />
            <div className="absolute left-4 top-4 flex items-center gap-2">
              <span className="font-mono text-xs text-accent-silver/60">
                {work.index}
              </span>
              <span className="chip !py-0.5 !text-[10px]">{t(work.status)}</span>
            </div>
          </div>

          {/* Body */}
          <div className="relative flex flex-1 flex-col p-6 md:p-7" style={{ transform: "translateZ(18px)" }}>
            <h3 className="font-display text-2xl font-semibold text-white">
              {t(work.title)}
            </h3>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-accent-silver/60">
              {t(work.description)}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {work.tags.map((tag) => (
                <span key={tag.en} className="chip">
                  {t(tag)}
                </span>
              ))}
            </div>
          </div>
        </div>
        </SpotlightCard>
      </motion.div>
    </Reveal>
  );
}
