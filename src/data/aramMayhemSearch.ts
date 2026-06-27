import { ARAM_CHAMPION_ALIASES } from "./aramMayhemAliases";
import type { AramMayhemChampion } from "./aramMayhemData";

type RankedChampion = {
  champion: AramMayhemChampion;
  index: number;
  score: number;
};

const NO_MATCH = Number.POSITIVE_INFINITY;

export function normalizeChampionSearchText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s'"`’‘.·_\-]+/g, "");
}

function normalizeMany(values: string[]): string[] {
  return values.map(normalizeChampionSearchText).filter(Boolean);
}

function exactMatch(values: string[], query: string): boolean {
  return values.some((value) => value === query);
}

function startsWithMatch(values: string[], query: string): boolean {
  return values.some((value) => value.startsWith(query));
}

function includesMatch(values: string[], query: string): boolean {
  return values.some((value) => value.includes(query));
}

function scoreChampion(champion: AramMayhemChampion, query: string): number {
  const zh = normalizeMany([champion.name.zh]);
  const aliases = normalizeMany(ARAM_CHAMPION_ALIASES[champion.key] ?? []);
  const english = normalizeMany([champion.name.en, champion.key]);
  const all = [...zh, ...aliases, ...english];

  if (exactMatch(zh, query)) return 1;
  if (exactMatch(aliases, query)) return 2;
  if (exactMatch(english, query)) return 3;
  if (startsWithMatch(zh, query)) return 4;
  if (startsWithMatch(aliases, query)) return 5;
  if (startsWithMatch(english, query)) return 6;
  if (includesMatch(all, query)) return 7;
  return NO_MATCH;
}

export function searchAramMayhemChampions(
  champions: AramMayhemChampion[],
  query: string,
): AramMayhemChampion[] {
  const normalized = normalizeChampionSearchText(query);
  if (!normalized) return champions;

  return champions
    .map<RankedChampion>((champion, index) => ({
      champion,
      index,
      score: scoreChampion(champion, normalized),
    }))
    .filter((entry) => entry.score !== NO_MATCH)
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      if (a.champion.rank !== b.champion.rank) return a.champion.rank - b.champion.rank;
      if (a.champion.tier !== b.champion.tier) return a.champion.tier - b.champion.tier;
      return a.index - b.index;
    })
    .map((entry) => entry.champion);
}
