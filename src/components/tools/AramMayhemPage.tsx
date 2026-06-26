import { useEffect, useMemo, useState } from "react";
import {
  ARAM_MAYHEM_STALE_AFTER_DAYS,
  aramMayhemFallbackData,
  aramMayhemSource,
  type AramMayhemChampion,
  type AramMayhemSnapshot,
  type AramMayhemStatus,
  type ChampionItems,
  type ItemRow,
} from "../../data/aramMayhemData";
import { useLanguage } from "../../i18n/LanguageContext";

const DATA_URL = "/data/aram-mayhem.json";

function isAramMayhemSnapshot(value: unknown): value is AramMayhemSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Partial<AramMayhemSnapshot>;
  return (
    snapshot.version === 3 &&
    snapshot.sourceUrl === aramMayhemSource.url &&
    Array.isArray(snapshot.champions) &&
    snapshot.champions.length > 0
  );
}

/** Days between an ISO timestamp and now; Infinity when missing/invalid. */
function daysSince(iso: string | undefined): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return Number.POSITIVE_INFINITY;
  return (Date.now() - then) / (1000 * 60 * 60 * 24);
}

/** Downgrade a live snapshot to "stale" once its sync is older than the limit. */
function resolveStatus(snapshot: AramMayhemSnapshot): AramMayhemStatus {
  if (snapshot.status === "live" && daysSince(snapshot.syncedAt) > ARAM_MAYHEM_STALE_AFTER_DAYS) {
    return "stale";
  }
  return snapshot.status;
}

const statusMeta: Record<AramMayhemStatus, { en: string; zh: string; className: string }> = {
  live: {
    en: "Live OP.GG snapshot",
    zh: "OP.GG 实时快照",
    className: "border-accent-cyan/40 bg-accent-cyan/[0.08] text-accent-cyan",
  },
  stale: {
    en: "Stale snapshot",
    zh: "快照偏旧",
    className: "border-accent-gold/40 bg-accent-gold/[0.08] text-accent-gold",
  },
  fallback: {
    en: "Fallback data",
    zh: "兜底数据",
    className: "border-slate-300/25 bg-slate-200/[0.07] text-slate-200",
  },
};

function searchChampions(champions: AramMayhemChampion[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return champions;
  return champions.filter((champion) => {
    const haystack = [champion.name.zh, champion.name.en, champion.key].join(" ").toLowerCase();
    return haystack.includes(normalized);
  });
}

function ItemPath({ row }: { row: ItemRow }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {row.items.map((item, index) => (
        <span key={`${item.id}-${index}`} className="flex items-center gap-1.5">
          {index > 0 && <span className="text-accent-silver/30">›</span>}
          <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-white">
            {item.name}
          </span>
        </span>
      ))}
    </div>
  );
}

function ItemSection({
  title,
  rows,
}: {
  title: { en: string; zh: string };
  rows: ItemRow[];
}) {
  const { t } = useLanguage();
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-widest text-accent-silver/55">{t(title)}</p>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-accent-silver/45">
          {t({ en: "Unavailable from source", zh: "来源未提供" })}
        </p>
      ) : (
        <div className="mt-2 space-y-2">
          {rows.map((row) => (
            <ItemPath key={row.row} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}

function hasAnyItems(items: ChampionItems) {
  return items.starter.length > 0 || items.boots.length > 0 || items.core.length > 0;
}

export default function AramMayhemPage() {
  const { t, lang } = useLanguage();
  const [query, setQuery] = useState("");
  const [dataSnapshot, setDataSnapshot] = useState<AramMayhemSnapshot>(aramMayhemFallbackData);

  const status = useMemo(() => resolveStatus(dataSnapshot), [dataSnapshot]);
  const champions = dataSnapshot.champions;
  const results = useMemo(() => searchChampions(champions, query), [champions, query]);
  const [selectedKey, setSelectedKey] = useState(champions[0]?.key ?? "");

  const selected =
    champions.find((champion) => champion.key === selectedKey) ?? results[0] ?? champions[0];
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
    if (!champions.some((champion) => champion.key === selectedKey)) {
      setSelectedKey(champions[0]?.key ?? "");
    }
  }, [champions, selectedKey]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    const [first] = searchChampions(champions, value);
    if (first) setSelectedKey(first.key);
  };

  const lastSynced = dataSnapshot.syncedAt ? dataSnapshot.syncedAt.slice(0, 10) : "—";
  const detailCoverage =
    dataSnapshot.championCount > 0
      ? Math.round((dataSnapshot.detailCount / dataSnapshot.championCount) * 100)
      : 0;

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
                en: "Search any champion in the mode, then scan their recommended augments, item build, and skill order from a live OP.GG snapshot.",
                zh: "搜索模式内任意英雄，查看来自 OP.GG 实时快照的推荐海克斯、出装路线与技能加点。",
              })}
            </p>
            <div className="mt-7 flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap">
              <span className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-widest ${meta.className}`}>
                {t(meta)}
              </span>
              {dataSnapshot.patch && (
                <span className="chip">{t({ en: `Patch ${dataSnapshot.patch}`, zh: `版本 ${dataSnapshot.patch}` })}</span>
              )}
              <span className="chip">{t({ en: `Last synced ${lastSynced}`, zh: `更新时间 ${lastSynced}` })}</span>
              <span className="chip">
                {t({
                  en: `Detail coverage ${detailCoverage}% (${dataSnapshot.detailCount}/${dataSnapshot.championCount})`,
                  zh: `详情覆盖 ${detailCoverage}%（${dataSnapshot.detailCount}/${dataSnapshot.championCount}）`,
                })}
              </span>
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
            placeholder={t({ en: "Jinx, Ashe, Lux...", zh: "金克丝、寒冰、光辉..." })}
            className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-accent-silver/35 focus:border-accent-cyan/60"
          />
          <p className="mt-3 font-mono text-[11px] text-accent-silver/40">
            {t({ en: `${results.length} champions`, zh: `${results.length} 个英雄` })}
          </p>

          <div className="mt-3 max-h-[560px] space-y-2 overflow-y-auto pr-1">
            {results.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-accent-silver/60">
                {t({ en: "No champions found.", zh: "未找到英雄。" })}
              </div>
            ) : (
              results.map((champion) => {
                const active = selected ? champion.key === selected.key : false;
                return (
                  <button
                    type="button"
                    key={champion.key}
                    onClick={() => setSelectedKey(champion.key)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                      active
                        ? "border-accent-cyan/45 bg-accent-cyan/[0.08]"
                        : "border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.05]"
                    }`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-void-700 font-display text-sm text-white">
                      {champion.image ? (
                        <img src={champion.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        (lang === "zh" ? champion.name.zh : champion.name.en).slice(0, 1)
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-white">
                        {lang === "zh" ? champion.name.zh : champion.name.en}
                      </span>
                      <span className="mt-0.5 block font-mono text-[11px] text-accent-silver/45">
                        {t({ en: `Tier ${champion.tierLabel}`, zh: `强度 ${champion.tierLabel}` })}
                        {champion.rank > 0 ? ` · #${champion.rank}` : ""}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {selected && (
          <div className="min-w-0 space-y-6">
            <section className="glass p-5 md:p-7">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                  {selected.image && (
                    <img
                      src={selected.image}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-xl border border-white/10 object-cover"
                    />
                  )}
                  <div>
                    <p className="eyebrow">{t({ en: "Selected champion", zh: "当前英雄" })}</p>
                    <h2 className="mt-2 font-display text-3xl font-semibold text-white md:text-4xl">
                      {lang === "zh" ? selected.name.zh : selected.name.en}
                    </h2>
                    {selected.detailStatus === "failed" && (
                      <p className="mt-2 max-w-[40ch] text-sm text-accent-silver/55">
                        {t({
                          en: "Live tier and rank only — detailed build data was unavailable at the last sync.",
                          zh: "仅提供实时强度与排名——上次同步未取到该英雄的详情数据。",
                        })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid w-full grid-cols-2 gap-3 text-sm md:min-w-[220px] md:w-auto">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-accent-silver/45">{t({ en: "Tier", zh: "强度" })}</p>
                    <p className="mt-1 font-mono text-xl text-white">{selected.tierLabel}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-accent-silver/45">{t({ en: "Rank", zh: "排名" })}</p>
                    <p className="mt-1 font-mono text-xl text-white">
                      {selected.rank > 0 ? `#${selected.rank}` : t({ en: "N/A", zh: "暂无" })}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="glass p-5 md:p-7">
              <p className="eyebrow">{t({ en: "Recommended Augments", zh: "推荐海克斯" })}</p>
              <h3 className="mt-3 font-display text-2xl font-semibold text-white">
                {t({ en: "Augment priority", zh: "海克斯优先级" })}
              </h3>
              {selected.augments.length === 0 ? (
                <p className="mt-4 text-sm text-accent-silver/45">
                  {t({ en: "Unavailable from source", zh: "来源未提供" })}
                </p>
              ) : (
                <ol className="mt-5 grid gap-2 sm:grid-cols-2">
                  {selected.augments.map((augment) => (
                    <li
                      key={augment.id || augment.priority}
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent-cyan/30 bg-accent-cyan/[0.08] font-mono text-xs text-accent-cyan">
                        {augment.priority}
                      </span>
                      <span className="text-sm font-medium text-white">
                        {lang === "zh" ? augment.name.zh : augment.name.en}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className="glass p-5 md:p-7">
              <p className="eyebrow">{t({ en: "Item build", zh: "推荐装备" })}</p>
              {hasAnyItems(selected.items) ? (
                <div className="mt-5 space-y-5">
                  <ItemSection title={{ en: "Starter", zh: "出门装" }} rows={selected.items.starter} />
                  <ItemSection title={{ en: "Boots", zh: "鞋子" }} rows={selected.items.boots} />
                  <ItemSection title={{ en: "Core", zh: "核心装" }} rows={selected.items.core} />
                </div>
              ) : (
                <p className="mt-4 text-sm text-accent-silver/45">
                  {t({ en: "Unavailable from source", zh: "来源未提供" })}
                </p>
              )}
            </section>

            <section className="glass p-5 md:p-7">
              <p className="eyebrow">{t({ en: "Skill order", zh: "技能加点" })}</p>
              {selected.skills ? (
                <div className="mt-5 space-y-5">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-widest text-accent-silver/55">
                      {t({ en: "Max priority", zh: "主升顺序" })}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      {selected.skills.order.map((letter, index) => (
                        <span key={`${letter}-${index}`} className="flex items-center gap-2">
                          {index > 0 && <span className="text-accent-silver/30">›</span>}
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent-cyan/30 bg-accent-cyan/[0.08] font-display text-base text-white">
                            {letter}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-widest text-accent-silver/55">
                      {t({ en: "Leveling sequence", zh: "升级序列" })}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selected.skills.sequence.map((letter, index) => (
                        <span
                          key={index}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] font-mono text-xs text-accent-silver/75"
                        >
                          {letter}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-accent-silver/45">
                  {t({ en: "Unavailable from source", zh: "来源未提供" })}
                </p>
              )}
            </section>

            <section className="rounded-[18px] border border-white/10 bg-white/[0.035] p-5 text-sm leading-relaxed text-accent-silver/60">
              <p>
                {t({
                  en: "Data is synced from OP.GG ARAM Mayhem on a schedule. OP.GG does not publish rune data for this mode, and augments are shown as a single recommended priority list (not split by rarity).",
                  zh: "数据按计划从 OP.GG 海克斯大乱斗同步。OP.GG 当前不发布该模式的符文数据，海克斯以单一推荐优先级列表展示（不按稀有度分组）。",
                })}
              </p>
              <a
                href={selected.sourceUrl || aramMayhemSource.url}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-3 inline-flex text-accent-cyan transition-colors hover:text-white"
              >
                {selected.sourceUrl || aramMayhemSource.url}
              </a>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
