import Reveal from "./Reveal";
import SpotlightCard from "./SpotlightCard";
import BrandLogo from "./BrandLogo";
import { contact, site } from "../data/siteData";
import { useLanguage } from "../i18n/LanguageContext";

/**
 * ContactFooter — closing call-to-action + footer with localized copy, the
 * brand sigil, and the SpotlightCard panel for visual consistency.
 */
export default function ContactFooter() {
  const { t } = useLanguage();
  const year = "2026"; // static build — no runtime Date needed

  return (
    <footer id="contact" className="scroll-mt-20">
      <div className="container-lab pb-16 pt-12 md:pb-20">
        <Reveal>
          <SpotlightCard accent="cyan" tilt={3}>
            <div className="relative px-7 py-14 text-center md:px-12 md:py-20">
              <div className="pointer-events-none absolute -left-16 top-0 h-56 w-56 rounded-full bg-accent-cyan/10 blur-3xl" />
              <div className="pointer-events-none absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-accent-violet/10 blur-3xl" />

              <span className="eyebrow justify-center">{t(contact.kicker)}</span>
              <h2 className="mx-auto mt-5 max-w-2xl font-display text-4xl font-bold text-white md:text-5xl">
                {t(contact.heading)}
              </h2>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                {contact.socials.map((s) => (
                  <a
                    key={s.label.en}
                    href={s.href}
                    target={s.href.startsWith("http") ? "_blank" : undefined}
                    rel={s.href.startsWith("http") ? "noreferrer noopener" : undefined}
                    className="group flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.02] px-5 py-3 transition-all hover:border-accent-cyan/40 hover:bg-accent-cyan/5"
                  >
                    <span className="font-mono text-[11px] uppercase tracking-widest text-accent-silver/40">
                      {t(s.label)}
                    </span>
                    <span className="text-sm text-accent-silver/80 transition-colors group-hover:text-white">
                      {s.handle}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </SpotlightCard>
        </Reveal>
      </div>

      {/* Footer bar */}
      <div className="border-t border-white/5">
        <div className="container-lab flex flex-col items-center justify-between gap-6 py-10 md:flex-row">
          <div className="flex flex-col items-center gap-2 md:items-start">
            {/* Footer brand — official horizontal lockup, kept modest. */}
            <BrandLogo
              variant="lockup"
              tone="light"
              alt={site.brand}
              className="h-auto w-[116px]"
            />
            <p className="font-mono text-[11px] text-accent-silver/40">
              {site.domain}
            </p>
          </div>

          <p className="max-w-md text-center text-sm text-accent-silver/45 md:text-right">
            {t(contact.closing)}
          </p>
        </div>

        <div className="container-lab pb-8">
          <p className="font-mono text-[11px] text-accent-silver/25">
            © {year} {site.brand}. {t({ en: "A living archive of games, visuals, and experiments.", zh: "一座持续生长的游戏、视觉与实验档案库。" })}
          </p>
        </div>
      </div>
    </footer>
  );
}
