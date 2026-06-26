import type { ProjectLoopStep } from "../../data/projectData";
import { useLanguage } from "../../i18n/LanguageContext";
import Reveal from "../Reveal";
import SectionHeading from "../SectionHeading";

export default function CoreLoop({ steps }: { steps: ProjectLoopStep[] }) {
  const { t } = useLanguage();

  return (
    <section id="project-loop" className="section-pad scroll-mt-24">
      <div className="container-lab">
        <SectionHeading
          num="01"
          subtitle="核心循环"
          kicker={t({ en: "Core Loop", zh: "核心循环" })}
          title={t({ en: "Auto-cast combat, deliberate construction", zh: "自动施法的战斗，主动选择的构筑" })}
          description={t({
            en: "Inkvoker separates the moment-to-moment action from the between-wave decisions, letting combat feel fluid while builds stay strategic.",
            zh: "墨唤把战斗中的即时走位和波次之间的构筑决策分开，让战斗保持流动，同时让成长路线具备策略感。",
          })}
        />
        <div className="mt-12 grid gap-4 md:grid-cols-4">
          {steps.map((step, index) => (
            <Reveal key={step.title.en} delay={index * 0.06}>
              <div className="h-full rounded-[18px] border border-white/10 bg-white/[0.035] p-5">
                <div className="font-mono text-xs text-accent-cyan/80">0{index + 1}</div>
                <h3 className="mt-4 font-display text-xl font-semibold text-white">{t(step.title)}</h3>
                <p className="mt-3 text-sm leading-7 text-accent-silver/62">{t(step.body)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
