import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";
import SpotlightCard from "./SpotlightCard";
import { labCategories, ui } from "../data/siteData";
import { useLanguage } from "../i18n/LanguageContext";

const ACCENTS = ["gold", "cyan", "violet", "silver", "cyan", "violet"] as const;

/**
 * VisualLabSection — refined creative archive as a mosaic of SpotlightCards.
 * The first tile spans larger on desktop for editorial rhythm. Tiles accept
 * real imagery later (swap the `cover` path in siteData).
 */
export default function VisualLabSection() {
  const { t } = useLanguage();

  return (
    <section id="lab" className="section-pad scroll-mt-20 relative">
      <div className="container-lab relative">
        <SectionHeading
          kicker={t({ en: "Visual Lab", zh: "视觉实验" })}
          title={t({
            en: "A curated archive of visual systems",
            zh: "一座精心整理的视觉系统档案",
          })}
          description={t({
            en: "Not a random gallery — a structured space for characters, effects, interface moods, and prompt-driven assets. Built to be filled with real work over time.",
            zh: "不是随意堆叠的画廊——而是一个有结构的空间，收纳角色、特效、界面氛围与提示词驱动的素材，并随时间不断填充真实作品。",
          })}
        />

        <div className="mt-14 grid auto-rows-[220px] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {labCategories.map((cat, i) => (
            <Reveal
              key={cat.id}
              delay={(i % 3) * 0.07}
              className={i === 0 ? "sm:col-span-2 sm:row-span-1 lg:row-span-2" : ""}
            >
              <SpotlightCard
                as="a"
                href="#lab"
                ariaLabel={t(cat.title)}
                accent={ACCENTS[i % ACCENTS.length]}
                tilt={i === 0 ? 3 : 6}
                className="group block h-full"
              >
                <div className="relative h-full">
                  <img
                    src={cat.cover}
                    alt={`${t(cat.title)} placeholder`}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full rounded-[19px] object-cover opacity-70 transition-all duration-700 group-hover:scale-105 group-hover:opacity-90"
                  />
                  <div className="absolute inset-0 rounded-[19px] bg-gradient-to-t from-void-900 via-void-900/40 to-transparent" />

                  <div className="relative flex h-full flex-col justify-end p-5" style={{ transform: "translateZ(20px)" }}>
                    <span className="font-mono text-[11px] uppercase tracking-widest text-accent-cyan/70">
                      {t(cat.count)}
                    </span>
                    <h3 className="mt-1 font-display text-xl font-semibold text-white">
                      {t(cat.title)}
                    </h3>
                    <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-accent-silver/60">
                      {t(cat.blurb)}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-accent-silver/40 transition-colors group-hover:text-accent-cyan">
                      {t(ui.exploreSet)}
                      <span className="transition-transform duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    </span>
                  </div>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>

        <p className="mt-6 font-mono text-xs text-accent-silver/30">
          {t(ui.placeholderNote)}
        </p>
      </div>
    </section>
  );
}
