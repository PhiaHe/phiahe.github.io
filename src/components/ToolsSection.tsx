import { useEffect, useState } from "react";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import SpotlightCard from "./SpotlightCard";
import { tools } from "../data/siteData";
import { useLanguage } from "../i18n/LanguageContext";
import { aramLastSyncLabel, aramUpdatedLabel } from "../lib/aramMayhemTime";

const ARAM_DATA_URL = "/data/aram-mayhem.json";
const ARAM_TOOL_ID = "aram-mayhem";

/** The small slice of the ARAM snapshot the homepage reads for its meta line. */
interface AramSyncMeta {
  syncedAt?: string;
  status?: string;
  patch?: string;
  championCount?: number;
  detailCount?: number;
}

export default function ToolsSection() {
  const { t } = useLanguage();
  // Client-only, non-blocking: the homepage renders immediately; this just
  // enriches the ARAM card + data-plan card with the real last-sync time once
  // the snapshot loads. A failed fetch leaves `meta` null and the UI degrades
  // to an "unavailable" line rather than breaking the page.
  const [meta, setMeta] = useState<AramSyncMeta | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(ARAM_DATA_URL, { cache: "no-cache" })
      .then((response) => {
        if (!response.ok) throw new Error(`ARAM meta request failed: ${response.status}`);
        return response.json() as Promise<AramSyncMeta>;
      })
      .then((data) => {
        if (!cancelled && data && typeof data === "object") {
          setMeta({
            syncedAt: data.syncedAt,
            status: data.status,
            patch: data.patch,
            championCount: data.championCount,
            detailCount: data.detailCount,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setMeta(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updated = aramUpdatedLabel(meta?.syncedAt);
  const lastSync = aramLastSyncLabel(meta?.syncedAt);
  const championCount = meta?.championCount && meta.championCount > 0 ? meta.championCount : 173;

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
          {tools.map((tool, index) => {
            const isAram = tool.id === ARAM_TOOL_ID;
            return (
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
                      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-accent-cyan/40 bg-accent-cyan/[0.08] px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-accent-cyan">
                        {isAram && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent-cyan" />}
                        {t(tool.status)}
                      </span>
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
                      {isAram && (
                        <p className="mt-5 font-mono text-[11px] tracking-wide text-accent-silver/45">
                          {t(updated)}
                        </p>
                      )}
                      <span className="mt-6 inline-flex items-center text-sm font-medium text-accent-cyan transition-colors group-hover:text-white">
                        {t({ en: "Open helper", zh: "打开速查" })}
                      </span>
                    </div>
                  </div>
                </SpotlightCard>
              </Reveal>
            );
          })}

          <Reveal delay={0.1}>
            <div className="glass flex h-full min-h-[260px] flex-col justify-between p-6 md:p-8">
              <div>
                <p className="eyebrow">{t({ en: "Data pipeline", zh: "数据方案" })}</p>
                <p className="mt-5 text-sm leading-relaxed text-accent-silver/65">
                  {t({
                    en: "This tool reads a live OP.GG ARAM Mayhem snapshot, refreshed daily through GitHub Actions. It covers 173 champions with tier, recommended augments, item builds, and skill orders. When a field is missing from the source, the UI marks it unavailable instead of inventing rune data or augment rarity groups.",
                    zh: "本页读取 OP.GG 海克斯大乱斗实时快照，并通过 GitHub Actions 每日自动同步。数据涵盖 173 名英雄的强度、推荐海克斯、装备路线与技能加点；若来源暂缺某字段，界面会明确标记「来源未提供」，不会伪造符文或海克斯稀有度分组。",
                  })}
                </p>
                <p className="mt-4 font-mono text-[11px] tracking-wide text-accent-silver/45">
                  {t(lastSync)}
                </p>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-3 text-center">
                {[
                  { value: String(championCount), label: { en: "Champions", zh: "英雄覆盖" } },
                  { value: "LIVE", label: { en: "Daily sync", zh: "每日同步" } },
                  { value: "V4", label: { en: "Snapshot", zh: "数据快照" } },
                ].map((item) => (
                  <div key={item.label.en} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
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
