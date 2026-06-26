import { useEffect, useMemo, useState } from "react";
import {
  ARAM_MAYHEM_STALE_AFTER_DAYS,
  aramMayhemCuratedByKey,
  aramMayhemFallbackData,
  aramMayhemSource,
  type AramMayhemChampion,
  type AramMayhemSnapshot,
  type AramMayhemStatus,
  type AramMayhemTierEntry,
  type HexPick,
  type HexTier,
} from "../../data/aramMayhemData";
import { useLanguage } from "../../i18n/LanguageContext";

const DATA_URL = "/data/aram-mayhem.json";

const tierMeta: Record<HexTier, { en: string; zh: string; className: string }> = {
  silver: {
    en: "Silver",
    zh: "银色",
    className: "border-slate-300/25 bg-slate-200/[0.07] text-slate-100",
  },
  gold: {
    en: "Gold",
    zh: "黄金",
    className: "border-accent-gold/30 bg-accent-gold/[0.08] text-accent-gold",
  },
  prismatic: {
    en: "Prismatic",
    zh: "棱彩",
    className: "border-accent-violet/35 bg-accent-violet/[0.09] text-accent-cyan",
  },
};

const priorityLabel = {
  core: { en: "Core", zh: "核心" },
  good: { en: "Good", zh: "推荐" },
  situational: { en: "Situational", zh: "看情况" },
  avoid: { en: "Avoid", zh: "不推荐" },
} as const;

function isAramMayhemSnapshot(value: unknown): value is AramMayhemSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Partial<AramMayhemSnapshot>;
  return (
    snapshot.schemaVersion === 2 &&
    !!snapshot.source &&
    snapshot.source.url === aramMayhemSource.url &&
    Array.isArray(snapshot.tierList) &&
    snapshot.tierList.length > 0
  );
}

/** Days between an ISO timestamp and now; large/Infinity when missing. */
function daysSince(iso: string | undefined): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return Number.POSITIVE_INFINITY;
  return (Date.now() - then) / (1000 * 60 * 60 * 24);
}

/**
 * Decide the effective status shown to the user. A loaded live snapshot is
 * downgraded to "stale" once its sync is older than the threshold.
 */
function resolveStatus(snapshot: AramMayhemSnapshot): AramMayhemStatus {
  if (snapshot.source.status === "live" && daysSince(snapshot.source.syncedAt) > ARAM_MAYHEM_STALE_AFTER_DAYS) {
    return "stale";
  }
  return snapshot.source.status;
}

const statusMeta: Record<AramMayhemStatus, { en: string; zh: string; className: string }> = {
  live: {
    en: "Live snapshot",
    zh: "实时快照",
    className: "border-accent-cyan/40 bg-accent-cyan/[0.08] text-accent-cyan",
  },
  stale: {
    en: "Stale snapshot",
    zh: "快照偏旧",
    className: "border-accent-gold/40 bg-accent-gold/[0.08] text-accent-gold",
  },
  curated: {
    en: "Curated snapshot",
    zh: "手动整理快照",
    className: "border-slate-300/25 bg-slate-200/[0.07] text-slate-100",
  },
  fallback: {
    en: "Fallback data",
    zh: "兜底数据",
    className: "border-slate-300/25 bg-slate-200/[0.07] text-slate-200",
  },
};

function searchTierList(entries: AramMayhemTierEntry[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return entries;
  return entries.filter((entry) => {
    const curated = aramMayhemCuratedByKey[entry.key];
    const haystack = [entry.nameZh, entry.nameEn, entry.key, ...(curated?.aliases ?? [])]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
}

function getTopHexes(champion: AramMayhemChampion) {
  return [...champion.hexes.prismatic, ...champion.hexes.gold, ...champion.hexes.silver]
    .filter((hex) => hex.priority === "core" || hex.priority === "good")
    .slice(0, 3);
}

function HexCard({ hex }: { hex: HexPick }) {
  const { t, lang } = useLanguage();
  const meta = tierMeta[hex.tier];

  return (
    <div className={`rounded-xl border p-4 ${meta.className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-base font-semibold text-white">
            {lang === "zh" ? hex.nameZh : hex.nameEn}
          </p>
          <p className="mt-1 text-xs text-accent-silver/55">
            {t(priorityLabel[hex.priority])}
          </p>
        </div>
        <span className="rounded-full border border-current/20 px-2 py-1 font-mono text-[10px] uppercase tracking-widest">
          {t(meta)}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-accent-silver/68">
        {lang === "zh" ? hex.reasonZh : hex.reasonEn}
      </p>
    </div>
  );
}

export default function AramMayhemPage() {
  const { t, lang } = useLanguage();
  const [query, setQuery] = useState("");
  const [dataSnapshot, setDataSnapshot] = useState<AramMayhemSnapshot>(aramMayhemFallbackData);

  const status = useMemo(() => resolveStatus(dataSnapshot), [dataSnapshot]);
  const tierList = dataSnapshot.tierList;
  const results = useMemo(() => searchTierList(tierList, query), [tierList, query]);
  const [selectedKey, setSelectedKey] = useState(tierList[0]?.key ?? "");

  const selectedEntry =
    tierList.find((entry) => entry.key === selectedKey) ?? results[0] ?? tierList[0];
  const curated: AramMayhemChampion | undefined = selectedEntry
    ? aramMayhemCuratedByKey[selectedEntry.key]
    : undefined;
  const topHexes = curated ? getTopHexes(curated) : [];
  const meta = statusMeta[status];

  useEffect(() => {
    let cancelled = false;

    fetch(DATA_URL, { cache: "no-cache" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`ARAM Mayhem data request failed: ${response.status}`);
        }
        return response.json() as Promise<unknown>;
      })
      .then((snapshot) => {
        if (!cancelled && isAramMayhemSnapshot(snapshot)) {
          setDataSnapshot(snapshot);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDataSnapshot(aramMayhemFallbackData);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!tierList.some((entry) => entry.key === selectedKey)) {
      setSelectedKey(tierList[0]?.key ?? "");
    }
  }, [tierList, selectedKey]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    const [first] = searchTierList(tierList, value);
    if (first) setSelectedKey(first.key);
  };

  const lastSynced = dataSnapshot.source.syncedAt?.slice(0, 10) ?? dataSnapshot.source.updatedAt;

  return (
    <main id="aram-tool-main" className="min-h-screen pb-24 pt-28 md:pt-32">
      <section className="container-lab">
        <div className="relative overflow-hidden rounded-[20px] border border-white/10 bg-void-900/70 shadow-2xl shadow-black/30">
          <img
            src="/assets/tools/aram-mayhem/tool-aram-mayhem-hero.jpg"
            alt={t({
              en: "Abstract ARAM Mayhem augment helper dashboard",
              zh: "海克斯大乱斗速查工具抽象界面",
            })}
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-void-900 via-void-900/78 to-void-900/15" />
          <div className="relative max-w-3xl p-6 md:p-10 lg:p-12">
            <p className="eyebrow">{t({ en: "Quick Tools", zh: "速查工具" })}</p>
            <h1 className="mt-5 max-w-full font-display text-3xl font-semibold leading-tight text-white sm:text-4xl md:text-6xl">
              {lang === "zh" ? (
                "海克斯大乱斗速查"
              ) : (
                <>
                  <span className="block">ARAM Mayhem</span>
                  <span className="block">Hex Helper</span>
                </>
              )}
            </h1>
            <p className="mt-5 max-w-[30ch] text-base leading-relaxed text-accent-silver/70 sm:max-w-2xl md:text-lg">
              {t({
                en: "Pick a champion, scan the strongest silver, gold, and prismatic augment priorities, then follow a practical item route.",
                zh: "选到英雄后，快速查看银色、黄金、棱彩海克斯优先级，并按推荐装备路线出装。",
              })}
            </p>
            <div className="mt-7 flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap">
              <span className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-widest ${meta.className}`}>
                {t(meta)}
              </span>
              <span className="chip">{t({ en: "Source: OP.GG", zh: "数据来源：OP.GG" })}</span>
              {dataSnapshot.source.version && (
                <span className="chip">{t({ en: `Patch ${dataSnapshot.source.version}`, zh: `版本 ${dataSnapshot.source.version}` })}</span>
              )}
              <span className="chip">{t({ en: `Last synced ${lastSynced}`, zh: `更新时间 ${lastSynced}` })}</span>
              <span className="chip">{t({ en: `${tierList.length} champions`, zh: `${tierList.length} 个英雄` })}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="container-lab mt-8 grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="glass h-fit min-w-0 p-4 lg:sticky lg:top-24">
          <label htmlFor="champion-search" className="font-mono text-xs uppercase tracking-widest text-accent-silver/55">
            {t({ en: "Champion search", zh: "英雄搜索" })}
          </label>
          <input
            id="champion-search"
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && results[0]) setSelectedKey(results[0].key);
            }}
            placeholder={t({ en: "Ashe, Ezreal, Lux...", zh: "寒冰、EZ、光辉..." })}
            className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-accent-silver/35 focus:border-accent-cyan/60"
          />

          <div className="mt-4 max-h-[520px] space-y-2 overflow-y-auto pr-1">
            {results.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-accent-silver/60">
                {t({ en: "No champions found.", zh: "未找到英雄。" })}
              </div>
            ) : (
              results.map((entry) => {
                const active = selectedEntry ? entry.key === selectedEntry.key : false;
                const hasGuide = !!aramMayhemCuratedByKey[entry.key];
                return (
                  <button
                    type="button"
                    key={entry.key}
                    onClick={() => setSelectedKey(entry.key)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                      active
                        ? "border-accent-cyan/45 bg-accent-cyan/[0.08]"
                        : "border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.05]"
                    }`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-void-700 font-display text-lg text-white">
                      {entry.imageUrl ? (
                        <img
                          src={entry.imageUrl}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        (lang === "zh" ? entry.nameZh : entry.nameEn).slice(0, 1)
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-white">
                        {lang === "zh" ? entry.nameZh : entry.nameEn}
                      </span>
                      <span className="mt-0.5 block font-mono text-[11px] text-accent-silver/45">
                        {t({ en: `Tier ${entry.tierLabel}`, zh: `强度 ${entry.tierLabel}` })}
                        {entry.rank > 0 ? ` · #${entry.rank}` : ""}
                        {hasGuide ? " · ★" : ""}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {selectedEntry && (
          <div className="min-w-0 space-y-6">
            <section className="glass p-5 md:p-7">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="eyebrow">{t({ en: "Selected champion", zh: "当前英雄" })}</p>
                    <h2 className="mt-3 font-display text-3xl font-semibold text-white md:text-4xl">
                      {lang === "zh" ? selectedEntry.nameZh : selectedEntry.nameEn}
                    </h2>
                    <p className="mt-3 max-w-[32ch] text-sm leading-relaxed text-accent-silver/68 sm:max-w-2xl">
                      {curated
                        ? lang === "zh"
                          ? curated.patternZh
                          : curated.patternEn
                        : t({
                            en: "Live OP.GG tier and rank only. A hand-written augment and build guide for this champion is not available yet.",
                            zh: "仅提供 OP.GG 实时强度与排名。该英雄的海克斯与出装详解尚未手动整理。",
                          })}
                    </p>
                  </div>
                  <div className="grid w-full grid-cols-1 gap-3 text-sm sm:grid-cols-2 md:min-w-[220px] md:w-auto">
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-accent-silver/45">{t({ en: "Tier", zh: "强度" })}</p>
                      <p className="mt-1 font-mono text-xl text-white">{selectedEntry.tierLabel}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-accent-silver/45">{t({ en: "Rank", zh: "排名" })}</p>
                      <p className="mt-1 font-mono text-xl text-white">
                        {selectedEntry.rank > 0 ? `#${selectedEntry.rank}` : t({ en: "N/A", zh: "暂无" })}
                      </p>
                    </div>
                  </div>
                </div>

                {curated && (
                  <div className="mt-6 grid gap-3 md:grid-cols-3">
                    {[
                      { label: { en: "Take First", zh: "优先拿" }, value: topHexes[0] ? (lang === "zh" ? topHexes[0].nameZh : topHexes[0].nameEn) : "-" },
                      { label: { en: "Acceptable", zh: "可接受" }, value: topHexes[1] ? (lang === "zh" ? topHexes[1].nameZh : topHexes[1].nameEn) : "-" },
                      { label: { en: "Build Toward", zh: "装备走向" }, value: lang === "zh" ? curated.builds[0]?.nameZh : curated.builds[0]?.nameEn },
                    ].map((item) => (
                      <div key={item.label.en} className="rounded-xl border border-accent-cyan/15 bg-accent-cyan/[0.045] p-4">
                        <p className="font-mono text-[11px] uppercase tracking-widest text-accent-cyan/70">
                          {t(item.label)}
                        </p>
                        <p className="mt-2 text-sm font-medium text-white">{item.value}</p>
                      </div>
                    ))}
                  </div>
                )}
            </section>

            {curated ? (
              <>
                <section className="glass p-5 md:p-7">
                    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                      <div>
                        <p className="eyebrow">{t({ en: "Hex priority", zh: "海克斯优先级" })}</p>
                        <h3 className="mt-3 font-display text-2xl font-semibold text-white">
                          {t({ en: "Silver / Gold / Prismatic", zh: "银色 / 黄金 / 棱彩" })}
                        </h3>
                      </div>
                      <p className="text-sm text-accent-silver/45">
                        {t({ en: "Curated priorities", zh: "手动整理的优先级" })}
                      </p>
                    </div>

                    <div className="mt-6 grid gap-4 xl:grid-cols-3">
                      {(["silver", "gold", "prismatic"] as HexTier[]).map((tier) => (
                        <div key={tier} className="space-y-3">
                          <p className={`w-fit rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-widest ${tierMeta[tier].className}`}>
                            {t(tierMeta[tier])}
                          </p>
                          {curated.hexes[tier].map((hex) => (
                            <HexCard key={hex.id} hex={hex} />
                          ))}
                        </div>
                      ))}
                    </div>
                </section>

                <section className="glass p-5 md:p-7">
                    <p className="eyebrow">{t({ en: "Item routes", zh: "装备路线" })}</p>
                    <div className="mt-6 grid gap-4 lg:grid-cols-2">
                      {curated.builds.map((build) => (
                        <article key={build.id} className="rounded-xl border border-white/10 bg-white/[0.035] p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-display text-xl font-semibold text-white">
                                {lang === "zh" ? build.nameZh : build.nameEn}
                              </h3>
                              <p className="mt-2 text-sm leading-relaxed text-accent-silver/65">
                                {lang === "zh" ? build.notesZh : build.notesEn}
                              </p>
                            </div>
                            <span className="chip">{build.role}</span>
                          </div>
                          <div className="mt-5 flex flex-wrap gap-2">
                            {build.coreItems.map((item) => (
                              <span key={item} className="rounded-lg border border-accent-cyan/20 bg-accent-cyan/[0.06] px-3 py-2 text-sm text-white">
                                {item}
                              </span>
                            ))}
                          </div>
                          {build.situationalItems.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {build.situationalItems.map((item) => (
                                <span key={item} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-accent-silver/65">
                                  {item}
                                </span>
                              ))}
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                </section>
              </>
            ) : (
              <section className="glass p-5 md:p-7">
                <p className="eyebrow">{t({ en: "Tier only", zh: "仅榜单数据" })}</p>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-accent-silver/65">
                  {t({
                    en: "Detailed augment priorities and item routes are hand-curated and currently cover a few featured champions. Live OP.GG tier and rank are shown for every champion in the mode.",
                    zh: "海克斯优先级与出装路线为手动整理，目前覆盖部分精选英雄。该模式下每个英雄都会显示来自 OP.GG 的实时强度与排名。",
                  })}
                </p>
              </section>
            )}

            <section className="rounded-[18px] border border-white/10 bg-white/[0.035] p-5 text-sm leading-relaxed text-accent-silver/60">
                <p>
                  {t({
                    en: "Live tier list is synced from OP.GG ARAM Mayhem on a schedule. Augment priorities and item routes for featured champions are hand-curated and clearly labeled.",
                    zh: "英雄强度榜单按计划从 OP.GG 海克斯大乱斗同步。精选英雄的海克斯优先级与出装路线为手动整理，并已明确标注。",
                  })}
                </p>
                <a
                  href={aramMayhemSource.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-3 inline-flex text-accent-cyan transition-colors hover:text-white"
                >
                  {aramMayhemSource.url}
                </a>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
