import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";
import SpotlightCard from "./SpotlightCard";
import { about } from "../data/siteData";
import { useLanguage } from "../i18n/LanguageContext";

const PILLAR_ACCENTS = ["cyan", "violet", "gold"] as const;

/**
 * AboutSection — personal, creator-focused statement with three pillar cards
 * sharing the SpotlightCard interaction language.
 */
export default function AboutSection() {
  const { t } = useLanguage();

  return (
    <section id="about" className="section-pad scroll-mt-20">
      <div className="container-lab">
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_0.9fr]">
          <SectionHeading kicker={t(about.kicker)} title={t(about.heading)} />

          <Reveal delay={0.1}>
            <SpotlightCard accent="violet" tilt={4}>
              <div className="relative p-7 md:p-9">
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent-violet/10 blur-3xl" />
                <p className="relative text-lg leading-relaxed text-accent-silver/80">
                  {t(about.body)}
                </p>
              </div>
            </SpotlightCard>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {about.pillars.map((pillar, i) => (
            <Reveal key={pillar.title.en} delay={i * 0.08} className="h-full">
              <SpotlightCard accent={PILLAR_ACCENTS[i % 3]} tilt={6} className="h-full">
                <div className="relative h-full p-6" style={{ transform: "translateZ(16px)" }}>
                  <span className="font-mono text-xs text-accent-cyan/60">
                    0{i + 1}
                  </span>
                  <h3 className="mt-3 font-display text-lg font-semibold text-white">
                    {t(pillar.title)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-accent-silver/55">
                    {t(pillar.text)}
                  </p>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
