import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const app = readFileSync("src/App.tsx", "utf8");
const siteData = readFileSync("src/data/siteData.ts", "utf8");
const aramPage = readFileSync("src/components/tools/AramMayhemPage.tsx", "utf8");
const aramData = readFileSync("src/data/aramMayhemData.ts", "utf8");
const aramAliases = readFileSync("src/data/aramMayhemAliases.ts", "utf8");
const aramSearch = readFileSync("src/data/aramMayhemSearch.ts", "utf8");
const toolsSection = readFileSync("src/components/ToolsSection.tsx", "utf8");
const dataPath = "public/data/aram-mayhem.json";

let passed = 0;
function check(label, fn) {
  fn();
  passed += 1;
  console.log(`  ok ${label}`);
}

console.log("ARAM Mayhem tool-page tests (schema v3)");

// --- Routing / navigation ---
check("route and nav are wired", () => {
  assert.match(app, /#\/tools\/aram-mayhem/, "App should route #/tools/aram-mayhem");
  assert.match(app, /<ToolsSection \/>/, "Homepage should render a Tools section");
  assert.match(siteData, /href: "#tools"/, "Home nav should include Tools");
  assert.match(siteData, /href: "#\/tools\/aram-mayhem"/, "Tools card should link to the route");
  assert.match(toolsSection, /id="tools"/, "Tools section should have a stable #tools id");
});

// --- Data loading ---
check("page loads and validates the v3 public JSON snapshot", () => {
  assert.match(aramPage, /\/data\/aram-mayhem\.json/, "page should fetch the public JSON");
  assert.match(aramPage, /isAramMayhemSnapshot/, "page should validate the snapshot before use");
  assert.match(aramPage, /version === 3/, "page should accept the v3 schema");
});

check("page keeps a typed fallback but does not claim it is live", () => {
  assert.match(aramPage, /aramMayhemFallbackData/, "page should keep a typed fallback dataset");
  assert.match(aramData, /status: "fallback"/, "fallback data must be labeled fallback");
});

// --- Status surfacing ---
check("page surfaces live/stale/fallback status + coverage", () => {
  for (const status of ["live", "stale", "fallback"]) {
    assert.match(aramPage, new RegExp(`\\b${status}\\b`), `page should handle ${status} status`);
  }
  assert.match(aramPage, /Live OP\.GG snapshot/, "page should show the live snapshot label");
  assert.match(aramPage, /Last synced|更新时间/, "page should show last synced time");
  assert.match(aramPage, /Patch|版本/, "page should show the patch");
  assert.match(aramPage, /Detail coverage|详情覆盖/, "page should show detail coverage");
});

// --- The whole champion pool, not a few samples ---
check("page is driven by the full champion list", () => {
  assert.match(aramPage, /dataSnapshot\.champions/, "page should render from the champions list");
  assert.match(aramPage, /searchAramMayhemChampions/, "search should run over the champion list");
});

check("champion search supports aliases without changing the public snapshot", () => {
  assert.match(aramPage, /Search champion, nickname, or abbreviation/, "English placeholder should mention nicknames");
  assert.match(aramPage, /搜索英雄 \/ 外号 \/ 简写/, "Chinese placeholder should mention aliases");
  assert.match(aramAliases, /ARAM_CHAMPION_ALIASES/, "aliases should live in a dedicated data file");
  assert.match(aramSearch, /normalizeChampionSearchText/, "search should normalize queries");
  assert.match(aramSearch, /searchAramMayhemChampions/, "search helper should be reusable outside the component");
  assert.doesNotMatch(readFileSync(dataPath, "utf8"), /ARAM_CHAMPION_ALIASES|快乐风男|男枪|女枪/, "public JSON should not contain alias data");
});

// --- Required detail fields rendered ---
check("page renders augments, item build, and skill order", () => {
  assert.match(aramPage, /Recommended Augments/, "page should use the 'Recommended Augments' heading");
  assert.match(aramPage, /推荐海克斯/, "page should use the 推荐海克斯 heading");
  assert.match(aramPage, /Item build|推荐装备/, "page should render the item build");
  assert.match(aramPage, /Skill order|技能加点/, "page should render the skill order");
  assert.match(aramPage, /Boots|鞋子/, "page should render boots");
  assert.match(aramPage, /Core|核心装/, "page should render core items");
});

// --- Missing fields are honest, not faked ---
check("missing fields show 'Unavailable from source', not fake data", () => {
  assert.match(aramPage, /Unavailable from source|来源未提供/, "page should show an unavailable state");
});

// --- Forbidden wording / faked structures ---
check("page does not use runes, rarity buckets, or 'Sample data'", () => {
  assert.doesNotMatch(aramPage, /Sample data/, "no 'Sample data' label");
  assert.doesNotMatch(aramPage, /Rune build|符文配置|rune build/i, "no rune build section");
  assert.doesNotMatch(aramPage, /银色海克斯|黄金海克斯|棱彩海克斯|棱镜/, "no rarity-bucketed augments");
  // The data layer must not carry rune or fabricated rarity fields either.
  assert.doesNotMatch(aramData, /"rarity"|HexTier|silver:|prismatic:/, "data should not carry rarity buckets");
});

// --- Assets ---
check("tool cover and hero assets exist", () => {
  for (const file of [
    "public/assets/tools/aram-mayhem/tool-aram-mayhem-cover.jpg",
    "public/assets/tools/aram-mayhem/tool-aram-mayhem-hero.jpg",
  ]) {
    assert.equal(existsSync(file), true, `${file} should exist`);
  }
});

// --- The shipped data actually backs the UI claims ---
check("shipped snapshot has the fields the UI renders", () => {
  const snapshot = JSON.parse(readFileSync(dataPath, "utf8"));
  const sample = snapshot.champions[0];
  for (const field of ["key", "name", "image", "tier", "tierLabel", "rank", "detailStatus", "augments", "items", "skills"]) {
    assert.ok(field in sample, `champion should expose ${field}`);
  }
  assert.ok("starter" in sample.items && "boots" in sample.items && "core" in sample.items, "items has starter/boots/core");
  assert.ok(!("runes" in sample), "champion should not expose a runes field");
});

console.log(`\nAll ${passed} ARAM Mayhem tool-page checks passed.`);
