import { useLanguage } from "../../i18n/LanguageContext";
import type { DetailImage } from "../../data/detailPages";
import type { Localized } from "../../data/siteData";
import Reveal from "../Reveal";

interface DetailHeroProps {
  kicker: Localized;
  title: Localized;
  summary: Localized;
  heroImage: DetailImage;
  /** Anchor of the first content section, used by the "scroll down" CTA. */
  firstSectionId?: string;
  ctaLabel?: Localized;
}

/**
 * DetailHero — shared hero for the data-driven detail pages (project / lab /
 * article). Split layout: copy on the left, framed hero image on the right,
 * mirroring ProjectHero but driven entirely by DetailPage data. The CTA scrolls
 * to the first section in-page (no hash mutation) so the router never bounces
 * the visitor back home.
 */
export default function DetailHero({
  kicker,
  title,
  summary,
  heroImage,
  firstSectionId,
  ctaLabel,
}: DetailHeroProps) {
  const { t } = useLanguage();

  return (
    <section className="container-lab grid items-center gap-10 pb-12 pt-4 lg:grid-cols-[0.95fr_1.05fr] lg:pb-16">
      <Reveal>
        <div>
          <p className="eyebrow">{t(kicker)}</p>
          <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.02] text-white md:text-6xl lg:text-7xl">
            {t(title)}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-accent-silver/80 md:text-xl">
            {t(summary)}
          </p>
          {firstSectionId && (
            <div className="mt-8">
              <a
                href={`#${firstSectionId}`}
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .getElementById(firstSectionId)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="btn btn-primary"
              >
                {t(ctaLabel ?? { en: "Read on", zh: "继续阅读" })}
              </a>
            </div>
          )}
        </div>
      </Reveal>

      <Reveal delay={0.12}>
        <figure className="relative overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/30">
          <img
            src={heroImage.src}
            alt={t(heroImage.alt)}
            className="aspect-[16/10] w-full object-cover"
          />
          {heroImage.label && (
            <figcaption className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-void-900/70 px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-accent-silver/80 backdrop-blur">
              {t(heroImage.label)}
            </figcaption>
          )}
        </figure>
      </Reveal>
    </section>
  );
}
