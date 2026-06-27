import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const dataPath = "public/data/aram-mayhem.json";
const pagePath = "src/components/tools/AramMayhemPage.tsx";
const dataTypesPath = "src/data/aramMayhemData.ts";

const SOURCE_URL = "https://op.gg/zh-cn/lol/modes/aram-mayhem";
const SAMPLE_KEYS = [
  "jinx",
  "ashe",
  "yasuo",
  "ezreal",
  "lux",
  "malphite",
  "brand",
  "vayne",
  "ahri",
  "leesin",
];

let passed = 0;
function check(label, fn) {
  fn();
  passed += 1;
  console.log(`  ok ${label}`);
}

function allItems(champion) {
  return [
    ...(champion.items?.starter ?? []),
    ...(champion.items?.boots ?? []),
    ...(champion.items?.core ?? []),
  ].flatMap((row) => row.items ?? []);
}

const snapshot = JSON.parse(readFileSync(dataPath, "utf8"));
const page = readFileSync(pagePath, "utf8");
const dataTypes = readFileSync(dataTypesPath, "utf8");

console.log("ARAM Mayhem icon tests");

check("shipped snapshot is live schema v4 full-detail data", () => {
  assert.equal(snapshot.version, 4, "icon schema should ship as v4");
  assert.equal(snapshot.status, "live");
  assert.equal(snapshot.source, "opgg");
  assert.equal(snapshot.sourceUrl, SOURCE_URL);
  assert.equal(snapshot.championCount, 173);
  assert.equal(snapshot.detailCount, 173);
  assert.equal(snapshot.failedDetailCount, 0);
});

check("sample champions carry augment and item icons", () => {
  for (const key of SAMPLE_KEYS) {
    const champion = snapshot.champions.find((entry) => entry.key === key);
    assert.ok(champion, `${key} should exist`);
    assert.ok(champion.augments.length > 0, `${key} should have augments`);
    assert.ok(allItems(champion).length > 0, `${key} should have items`);
    assert.ok(champion.augments.every((augment) => augment.metaId && augment.iconFile && augment.icon?.url), `${key} augments need metaId/iconFile/icon.url`);
    assert.ok(allItems(champion).every((item) => Number.isFinite(item.id) && item.icon?.url), `${key} items need id/icon.url`);
  }
});

check("icon coverage is high enough for shipped data", () => {
  const augments = snapshot.champions.flatMap((champion) => champion.augments ?? []);
  const items = snapshot.champions.flatMap(allItems);
  const augmentIconCoverage = augments.filter((augment) => augment.icon?.url).length / augments.length;
  const itemIconCoverage = items.filter((item) => item.icon?.url).length / items.length;
  assert.ok(augmentIconCoverage >= 0.95, `augment icon coverage ${(augmentIconCoverage * 100).toFixed(1)}% should be >= 95%`);
  assert.ok(itemIconCoverage >= 0.95, `item icon coverage ${(itemIconCoverage * 100).toFixed(1)}% should be >= 95%`);
});

check("augment icons use OP.GG latest paths, not patch-fixed aram augment paths", () => {
  const augments = snapshot.champions.flatMap((champion) => champion.augments ?? []);
  assert.ok(augments.some((augment) => /\/latest\/aram-augment\/[^/?#]+\.png$/.test(augment.icon?.url ?? "")), "at least one augment should use latest/aram-augment");
  for (const augment of augments) {
    const url = augment.icon?.url ?? "";
    assert.doesNotMatch(url, /\/\d+\.\d+(?:\.\d+)?\/aram-augment\//, "do not use patch-fixed aram augment URLs");
    assert.equal(augment.icon?.source, "opgg", "augment icons should come from OP.GG");
  }
});

check("item icons expose OP.GG and Data Dragon candidates with sane URLs", () => {
  const items = snapshot.champions.flatMap(allItems);
  assert.ok(items.some((item) => item.opggIconUrl && item.dataDragonIconUrl), "items should carry both icon candidates");
  for (const item of items) {
    assert.match(item.opggIconUrl ?? "", /^https:\/\/opgg-static\.akamaized\.net\/meta\/images\/lol\/[^/]+\/item\/\d+\.png$/);
    assert.match(item.dataDragonIconUrl ?? "", /^https:\/\/ddragon\.leagueoflegends\.com\/cdn\/[^/]+\/img\/item\/\d+\.png$/);
    assert.equal(item.icon?.source, "opgg", "UI default item icon should prefer OP.GG");
  }
});

check("icons do not add forbidden ARAM fields", () => {
  const json = JSON.stringify(snapshot);
  assert.doesNotMatch(json, /"runes"/, "snapshot should not carry runes");
  assert.doesNotMatch(json, /"rarity"|"silver"|"prismatic"|银色海克斯|黄金海克斯|棱彩海克斯/, "snapshot should not carry rarity buckets");
  assert.doesNotMatch(page, /银色海克斯|黄金海克斯|棱彩海克斯|rune build/i, "UI should not add forbidden sections");
  assert.doesNotMatch(dataTypes, /HexTier|"rarity"|rarity:|"runes"|runes:/, "data types should not add runes or rarity fields");
});

check("UI renders icon images with broken-image fallback behavior", () => {
  assert.match(page, /augment\.icon\?\.url/, "augment icon URL should be rendered");
  assert.match(page, /item\.icon\?\.url/, "item icon URL should be rendered");
  assert.match(page, /referrerPolicy="no-referrer"/, "external icon images should suppress referrers");
  assert.match(page, /onError=\{\(event\)/, "images should hide themselves when loading fails");
  assert.match(page, /alt=""/, "decorative icons should not duplicate adjacent text for screen readers");
});

console.log(`\nAll ${passed} ARAM Mayhem icon checks passed.`);
