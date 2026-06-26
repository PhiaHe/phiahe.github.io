import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import SpotlightCard from "./SpotlightCard";
import { tools } from "../data/siteData";
import { useLanguage } from "../i18n/LanguageContext";

export default function ToolsSection() {
  const { t } = useLanguage();

  return (
    <section id="tools" className="section-pad scroll-mt-20 relative">
      <div className="container-lab relative">
        <SectionHeading
          kicker={t({ en: "Quick Tools", zh: "速查工具" })}
          title={t({
            en: "Compact helpers for live decisions",
            zh: "面向实战决策的轻量工具",
          })}
          description={t({
            en: "Small, focused utilities that turn scattered game data into quick reads.",
            zh: "把分散的游戏数据整理成可以快速判断的小工具。",
          })}
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
          {tools.map((tool, index) => (
            <Reveal key={tool.id} delay={index * 0.08}>
              <SpotlightCard
                as="a"
                href={tool.href}
                ariaLabel={t({
                  en: `${tool.title.en} tool details`,
                  zh: `${tool.title.zh} 工具详情`,
                })}
                accent="cyan"
                tilt={4}
                className="group block h-full"
              >
                <div className="grid h-full overflow-hidden md:grid-cols-[1.15fr_0.85fr]">
                  <div className="relative min-h-[260px]">
                    <img
                      src={tool.cover}
                      alt={t({
                        en: `${tool.title.en} cover`,
                        zh: `${tool.title.zh} 封面`,
                      })}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-void-900/10 via-void-900/10 to-void-900/70 md:bg-gradient-to-r" />
                  </div>

                  <div className="relative flex flex-col justify-center p-6 md:p-8" style={{ transform: "translateZ(20px)" }}>
                    <span className="chip w-fit">{t(tool.status)}</span>
                    <h3 className="mt-4 font-display text-2xl font-semibold text-white md:text-3xl">
                      {t(tool.title)}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-accent-silver/65">
                      {t(tool.description)}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {tool.tags.map((tag) => (
                        <span key={tag.en} className="chip">
                          {t(tag)}
                        </span>
                      ))}
                    </div>
                    <span className="mt-7 inline-flex items-center text-sm font-medium text-accent-cyan transition-colors group-hover:text-white">
                      {t({ en: "Open helper", zh: "打开速查" })}
                    </span>
                  </div>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}

          <Reveal delay={0.1}>
            <div className="glass flex h-full min-h-[260px] flex-col justify-between p-6 md:p-8">
              <div>
                <p className="eyebrow">{t({ en: "Data plan", zh: "数据方案" })}</p>
                <p className="mt-5 text-sm leading-relaxed text-accent-silver/65">
                  {t({
                    en: "This first pass uses sample data so the interface can be reviewed before adding the scheduled OP.GG sync.",
                    zh: "第一版先使用样例数据，等界面确认后再接入 OP.GG 定时同步。",
                  })}
                </p>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-3 text-center">
                {[
                  { value: "S", label: { en: "Silver", zh: "银色" } },
                  { value: "G", label: { en: "Gold", zh: "黄金" } },
                  { value: "P", label: { en: "Prismatic", zh: "棱彩" } },
                ].map((item) => (
                  <div key={item.value} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <div className="font-mono text-lg text-white">{item.value}</div>
                    <div className="mt-1 text-xs text-accent-silver/50">{t(item.label)}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
