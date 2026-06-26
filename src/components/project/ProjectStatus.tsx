import type { ProjectDetail } from "../../data/projectData";
import { useLanguage } from "../../i18n/LanguageContext";
import Reveal from "../Reveal";
import SpotlightCard from "../SpotlightCard";
import { scrollToSection } from "./scrollToSection";

interface ProjectStatusProps {
  project: ProjectDetail;
  onBackToWork: () => void;
}

export default function ProjectStatus({ project, onBackToWork }: ProjectStatusProps) {
  const { t } = useLanguage();

  return (
    <section id="project-status" className="section-pad scroll-mt-24">
      <div className="container-lab">
        <Reveal>
          <SpotlightCard accent="silver" tilt={0}>
            <div className="grid gap-8 p-7 md:grid-cols-[0.9fr_1.1fr] md:p-9">
              <div>
                <p className="eyebrow">{t(project.kicker)}</p>
                <h2 className="mt-5 font-display text-3xl font-semibold text-white md:text-5xl">
                  {t(project.statusTitle)}
                </h2>
                <p className="mt-5 text-sm leading-7 text-accent-silver/65">{t(project.statusBody)}</p>
                <p className="mt-5 text-sm leading-7 text-accent-silver/65">{t(project.closingLine)}</p>
              </div>
              <div>
                <ul className="space-y-3">
                  {project.implementationHighlights.map((highlight) => (
                    <li
                      key={highlight.en}
                      className="rounded-xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-7 text-accent-silver/72"
                    >
                      {t(highlight)}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="button" onClick={onBackToWork} className="btn btn-primary">
                    {t(project.secondaryCta)}
                  </button>
                  <a
                    href="#contact"
                    onClick={(e) => scrollToSection(e, "contact")}
                    className="btn btn-ghost"
                  >
                    {t({ en: "Contact Phia", zh: "联系 Phia" })}
                  </a>
                </div>
              </div>
            </div>
          </SpotlightCard>
        </Reveal>
      </div>
    </section>
  );
}
