import { useMemo } from "react";
import type { ProjectDetail } from "../../data/projectData";
import { useLanguage } from "../../i18n/LanguageContext";
import Reveal from "../Reveal";
import ProjectStats from "./ProjectStats";
import { scrollToSection } from "./scrollToSection";

interface ProjectHeroProps {
  project: ProjectDetail;
  onBackToWork: () => void;
}

export default function ProjectHero({ project, onBackToWork }: ProjectHeroProps) {
  const { t } = useLanguage();

  // The title ("Inkvoker · 墨唤") mixes a Latin name with a CJK name. Anton is
  // Latin-only and very wide-set, so the single line overflows and the CJK half
  // wraps mid-word. Split on "·" and stack: Latin in condensed Anton, CJK on its
  // own line in the display face. Falls back to one line if there's no "·".
  const [primary, secondary] = useMemo(() => {
    const parts = project.title.split("·").map((s) => s.trim());
    return parts.length > 1 ? [parts[0], parts.slice(1).join(" · ")] : [project.title, ""];
  }, [project.title]);

  return (
    <section className="container-lab grid min-h-[calc(100vh-7rem)] items-center gap-10 pb-16 pt-8 lg:grid-cols-[0.95fr_1.05fr]">
      <Reveal>
        <div>
          <p className="eyebrow">{t(project.kicker)}</p>
          <h1 className="mt-6">
            <span className="block font-condensed text-7xl uppercase leading-[0.92] tracking-tight text-white md:text-8xl lg:text-9xl">
              {primary}
            </span>
            {secondary && (
              <span className="mt-2 block font-display text-3xl font-semibold tracking-[0.2em] text-accent-silver/80 md:text-4xl">
                {secondary}
              </span>
            )}
          </h1>
          <p className="mt-6 max-w-2xl text-xl leading-relaxed text-accent-silver/85">
            {t(project.pitch)}
          </p>
          <p className="mt-5 max-w-2xl text-base leading-8 text-accent-silver/62">
            {t(project.summary)}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#project-systems"
              onClick={(e) => scrollToSection(e, "project-systems")}
              className="btn btn-primary"
            >
              {t(project.primaryCta)}
            </a>
            <button type="button" onClick={onBackToWork} className="btn btn-ghost">
              {t(project.secondaryCta)}
            </button>
          </div>
          <div className="mt-8">
            <ProjectStats stats={project.stats} variant="compact" />
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.12}>
        <figure className="relative overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/30">
          <img
            src={project.heroImage.src}
            alt={t(project.heroImage.alt)}
            className="aspect-[16/11] w-full object-cover"
          />
          <figcaption className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-void-900/70 px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-accent-silver/80 backdrop-blur">
            {t(project.heroImage.label)}
          </figcaption>
        </figure>
      </Reveal>
    </section>
  );
}
