import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";
import SpotlightCard from "./SpotlightCard";
import { devLog, ui } from "../data/siteData";
import { useLanguage } from "../i18n/LanguageContext";

const ACCENTS = ["cyan", "gold", "gold", "violet", "silver"] as const;

/**
 * DevLogSection — shows the lab as a production/iteration space. Article cards
 * share the SpotlightCard language with Work + Lab for a unified feel.
 */
export default function DevLogSection() {
  const { t } = useLanguage();

  return (
    <section id="devlog" className="section-pad scroll-mt-20">
      <div className="container-lab">
        <SectionHeading
          kicker={t({ en: "Process / Dev Log", zh: "过程 / 开发日志" })}
          title={t({
            en: "Notes from building and iterating",
            zh: "构建与迭代过程中的笔记",
          })}
          description={t({
            en: "A working record of workflow, craft, and decisions — written for other creators who care about how small ideas become readable, expressive games.",
            zh: "一份关于流程、手艺与决策的工作记录——写给同样在意「小点子如何变成清晰、有表现力的游戏」的创作者。",
          })}
        />

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {devLog.map((entry, i) => (
            <Reveal key={entry.id} delay={(i % 3) * 0.07} className="h-full">
              <SpotlightCard
                accent={ACCENTS[i % ACCENTS.length]}
                tilt={5}
                className="group h-full"
              >
                <div className="flex h-full flex-col">
                  <div className="relative aspect-[16/9] overflow-hidden rounded-t-[19px]">
                    <img
                      src={entry.cover}
                      alt={`${t(entry.title)} thumbnail placeholder`}
                      loading="lazy"
                      className="h-full w-full object-cover opacity-75 transition-all duration-700 group-hover:scale-105 group-hover:opacity-95"
                      style={{ transform: "translateZ(26px) scale(1.04)" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-void-900/90 to-transparent" />
                    <span className="absolute left-3 top-3 chip !py-0.5 !text-[10px]">
                      {t(entry.tag)}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5" style={{ transform: "translateZ(16px)" }}>
                    <h3 className="font-display text-lg font-semibold leading-snug text-white transition-colors group-hover:text-accent-cyan">
                      {t(entry.title)}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-accent-silver/55">
                      {t(entry.summary)}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                      <span className="font-mono text-[11px] text-accent-silver/40">
                        {t(entry.readTime)} {t(ui.read)}
                      </span>
                      <span className="text-xs text-accent-silver/40 transition-colors group-hover:text-accent-cyan">
                        {t(ui.readNote)} →
                      </span>
                    </div>
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
