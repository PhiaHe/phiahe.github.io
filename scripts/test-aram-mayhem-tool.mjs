import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const app = readFileSync("src/App.tsx", "utf8");
const siteData = readFileSync("src/data/siteData.ts", "utf8");
const aramPage = readFileSync("src/components/tools/AramMayhemPage.tsx", "utf8");
const aramData = readFileSync("src/data/aramMayhemData.ts", "utf8");
const toolsSection = readFileSync("src/components/ToolsSection.tsx", "utf8");

let passed = 0;
function check(label, fn) {
  fn();
  passed += 1;
  console.log(`  ok ${label}`);
}

console.log("ARAM Mayhem tool-page tests");

// --- Routing / navigation ---
check("route and nav are wired", () => {
  assert.match(app, /#\/tools\/aram-mayhem/, "App should route #/tools/aram-mayhem");
  assert.match(app, /<ToolsSection \/>/, "Homepage should render a Tools section");
  assert.match(siteData, /href: "#tools"/, "Home nav should include Tools");
  assert.match(siteData, /href: "#\/tools\/aram-mayhem"/, "Tools card should link to the route");
  assert.match(toolsSection, /id="tools"/, "Tools section should have a stable #tools id");
});

// --- Data loading ---
check("page loads the public JSON snapshot", () => {
  assert.match(aramPage, /\/data\/aram-mayhem\.json/, "page should fetch the public JSON");
  assert.match(aramPage, /isAramMayhemSnapshot/, "page should validate the snapshot before use");
  assert.match(aramPage, /schemaVersion === 2/, "page should accept the v2 schema");
});

check("page keeps a typed fallback but does not claim it is live", () => {
  assert.match(aramPage, /aramMayhemFallbackData/, "page should keep a typed fallback dataset");
  assert.match(aramData, /status: "fallback"/, "fallback data must be labeled fallback");
});

// --- Status surfacing ---
check("page surfaces live/stale/curated/fallback status", () => {
  for (const status of ["live", "stale", "curated", "fallback"]) {
    assert.match(aramPage, new RegExp(`\\b${status}\\b`), `page should handle ${status} status`);
  }
  assert.match(aramPage, /Last synced|更新时间/, "page should show last synced time");
  assert.match(aramPage, /Patch|版本/, "page should show the patch when available");
});

// --- No fake data ---
check("page no longer ships the 'Sample data' label or fake win rates", () => {
  assert.doesNotMatch(aramPage, /Sample data/, "page should not show a 'Sample data' chip");
  assert.doesNotMatch(aramData, /winRate|pickRate/, "curated data should not carry fake winRate/pickRate fields");
});

check("page is driven by the live tier list, not 4 hard-coded samples", () => {
  assert.match(aramPage, /dataSnapshot\.tierList/, "page should render from the tier list");
  assert.match(aramPage, /searchTierList/, "search should run over the tier list");
  // The list item should not key off a 4-champion curated array.
  assert.doesNotMatch(aramPage, /champions\.map\(\(champion\)/, "list should not map a fixed champions array");
});

// --- Tier-only state for non-curated champions ---
check("page renders a tier-only state for champions without a curated guide", () => {
  assert.match(aramPage, /Tier only|仅榜单数据/, "page should show a tier-only state");
  assert.match(aramPage, /aramMayhemCuratedByKey/, "page should look up curated guides by key");
});

// --- Wording guardrails ---
check("page renders silver/gold/prismatic labels and avoids 棱镜", () => {
  assert.match(aramPage, /OP\.GG/, "page should cite OP.GG");
  assert.match(aramPage, /银色/, "page should render silver tier text");
  assert.match(aramPage, /黄金/, "page should render gold tier text");
  assert.match(aramPage, /棱彩/, "page should render prismatic tier text as 棱彩");
  assert.doesNotMatch(`${siteData}\n${aramPage}\n${aramData}`, /棱镜/, "should not use 棱镜");
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

console.log(`\nAll ${passed} ARAM Mayhem tool-page checks passed.`);
