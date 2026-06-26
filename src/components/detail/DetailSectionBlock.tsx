import { useLanguage } from "../../i18n/LanguageContext";
import type { DetailSection } from "../../data/detailPages";
import Reveal from "../Reveal";
import SpotlightCard from "../SpotlightCard";

interface DetailSectionBlockProps {
  section: DetailSection;
  /** Editorial index, e.g. "01" → "(01)". */
  num?: string;
  /** Article kind reads as prose; project/lab read as a sectioned layout. */
  variant?: "default" | "article";
}

/**
 * DetailSectionBlock — renders a single DetailSection: heading, optional intro
 * body, optional titled item cards, and an optional asset board. Anchored by
 * `section.id` (scroll-mt offsets the fixed navbar) so the navbar's in-page
 * links land cleanly.
 */
export default function DetailSectionBlock({
  section,
  num,
  variant = "default",
}: DetailSectionBlockProps) {
  const { t } = useLanguage();
  const isArticle = variant === "article";

  return (
    <section id={section.id} className="section-pad scroll-mt-24">
      <div className="container-lab">
        <Reveal>
          <span className="eyebrow">
            {num && <span className="mr-2 text-accent-cyan/90">({num})</span>}
            {t(section.nav)}
          </span>
          <h2 className="mt-4 h-section max-w-3xl text-balance">{t(section.heading)}</h2>
          {section.body && (
            <p
              className={`mt-5 text-base leading-relaxed text-accent-silver/70 md:text-lg ${
                isArticle ? "max-w-3xl" : "max-w-2xl"
              }`}
            >
              {t(section.body)}
            </p>
          )}
        </Reveal>

        {section.items && section.items.length > 0 && (
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {section.items.map((item, i) => (
              <Reveal key={item.title.en} delay={(i % 3) * 0.07} className="h-full">
                <SpotlightCard accent="cyan" tilt={4} className="h-full">
                  <div className="flex h-full flex-col p-6">
                    <h3 className="font-display text-lg font-semibold text-white">
                      {t(item.title)}
                    </h3>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-accent-silver/65">
                      {t(item.body)}
                    </p>
                  </div>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        )}

        {section.assets && section.assets.length > 0 && (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {section.assets.map((asset, i) => (
              <Reveal key={`${asset.src}-${i}`} delay={(i % 3) * 0.05}>
                <figure className="group overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.035]">
                  <img
                    src={asset.src}
                    alt={t(asset.alt)}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  {asset.label && (
                    <figcaption className="p-4 text-sm font-medium text-white">
                      {t(asset.label)}
                    </figcaption>
                  )}
                </figure>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
