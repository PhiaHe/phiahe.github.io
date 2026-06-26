import type { ProjectFeature } from "../../data/projectData";
import { useLanguage } from "../../i18n/LanguageContext";
import Reveal from "../Reveal";
import SectionHeading from "../SectionHeading";
import SpotlightCard from "../SpotlightCard";

export default function ProjectFeatureGrid({ features }: { features: ProjectFeature[] }) {
  const { t } = useLanguage();

  return (
    <section id="project-systems" className="section-pad scroll-mt-24">
      <div className="container-lab">
        <SectionHeading
          num="02"
          subtitle="系统"
          kicker={t({ en: "Systems", zh: "系统" })}
          title={t({ en: "The run is built from layered decisions", zh: "一局由层层叠加的选择构成" })}
          description={t({
            en: "The page should show enough of the underlying system depth without becoming a full design document.",
            zh: "页面会展示足够多的系统深度，但不会把自己变成完整设计文档。",
          })}
        />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Reveal key={feature.title.en} delay={index * 0.05} className="h-full">
              <SpotlightCard
                accent={index % 3 === 0 ? "cyan" : index % 3 === 1 ? "violet" : "gold"}
                className="h-full"
                tilt={3}
              >
                <div className="relative flex h-full flex-col p-6">
                  <h3 className="font-display text-2xl font-semibold text-white">{t(feature.title)}</h3>
                  <p className="mt-4 flex-1 text-sm leading-7 text-accent-silver/62">{t(feature.body)}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {feature.tags.map((tag) => (
                      <span key={tag.en} className="chip">{t(tag)}</span>
                    ))}
                  </div>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
