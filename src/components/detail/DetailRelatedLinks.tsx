import { useLanguage } from "../../i18n/LanguageContext";
import type { RelatedLink } from "../../data/detailPages";
import Reveal from "../Reveal";

interface DetailRelatedLinksProps {
  links: RelatedLink[];
  /** Localized section label, e.g. "Related" / "相关". */
  heading?: { en: string; zh: string };
}

/**
 * DetailRelatedLinks — closing block of related routes. Each link is a normal
 * anchor that mutates the hash (e.g. "#/projects/inkvoker" or "#work"); the
 * App-level hashchange listener resolves it. This is intentional cross-page
 * navigation — distinct from in-page section links, which use scrollIntoView.
 */
export default function DetailRelatedLinks({
  links,
  heading = { en: "Related", zh: "相关" },
}: DetailRelatedLinksProps) {
  const { t } = useLanguage();
  if (links.length === 0) return null;

  return (
    <section id="detail-related" className="section-pad scroll-mt-24">
      <div className="container-lab">
        <Reveal>
          <span className="eyebrow">{t(heading)}</span>
        </Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {links.map((link, i) => (
            <Reveal key={link.href} delay={(i % 2) * 0.07}>
              <a
                href={link.href}
                className="group flex items-center justify-between gap-4 rounded-[18px] border border-white/10 bg-white/[0.03] px-6 py-5 transition-all hover:border-accent-cyan/40 hover:bg-accent-cyan/[0.05]"
              >
                <span>
                  <span className="block font-display text-lg font-semibold text-white transition-colors group-hover:text-accent-cyan">
                    {t(link.label)}
                  </span>
                  {link.note && (
                    <span className="mt-1 block text-sm text-accent-silver/55">
                      {t(link.note)}
                    </span>
                  )}
                </span>
                <span className="text-accent-silver/40 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-accent-cyan">
                  →
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
