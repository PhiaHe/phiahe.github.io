import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import {
  buildSnapshot,
  decodeRscPayload,
  extractTierList,
  parseAugments,
  parseItemSection,
  parseSkills,
  validateSnapshot,
} from "./sync-aram-mayhem-data.mjs";

const dataPath = "public/data/aram-mayhem.json";
const syncScriptPath = "scripts/sync-aram-mayhem-data.mjs";
const workflowPath = ".github/workflows/sync-aram-mayhem.yml";

const SOURCE_URL = "https://op.gg/zh-cn/lol/modes/aram-mayhem";
const MIN_CHAMPIONS = 150;

let passed = 0;
function check(label, fn) {
  fn();
  passed += 1;
  console.log(`  ok ${label}`);
}

/** Wrap RSC text the way OP.GG streams it (escaped string in __next_f.push). */
function makeListHtml(champions) {
  const payload = `0:["$","div",null,{"champions":${JSON.stringify(champions)}}]\n`;
  return `<!doctype html><html><body>ARAM Mayhem<script>self.__next_f.push([1,${JSON.stringify(payload)}])</script></body></html>`;
}

function sampleChampions(count) {
  return Array.from({ length: count }, (_, i) => ({
    key: `champ${i}`,
    name: `英雄${i}`,
    image_url: "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/champion/Champ.png",
    champion_id: 100 + i,
    id: 100 + i,
    tier: (i % 5) + 1,
    rank: i + 1,
  }));
}

// A minimal but real-shaped detail RSC fragment with augments, items, skills.
function makeDetailRsc() {
  const aug = (idx, id, name, icon) =>
    `["$","li","aram-augment-${idx}",{"children":[["$","div",null,{"children":["$","$L62",null,{"metaId":${id},"metaType":"aram-augment","children":["$","$L63",null,{"src":"https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/${icon}.png","width":36,"height":36,"alt":"${name}"}]}]}],["$","strong",null,{"className":"text-sm text-gray-900","children":"${name}"}]]}]`;
  const item = (id, name) =>
    `["$","$1","${id}-0",{"children":["$","$L62",null,{"metaType":"item","metaId":${id},"children":["$","$L63",null,{"className":"rounded","src":"https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/${id}.png","alt":"${name}","width":32,"height":32}]}]}]`;
  const augs = [aug(0, 2096, "通用强化", "GenericAbilityAugmentIcon_Gold"), aug(1, 1356, "暴击飞弹", "Crit_large")].join(",");
  const starter = `"starter_items_0",{"children":[${item(1038, "暴风之剑")}]}`;
  const boots = `"boots_0",{"children":[${item(3006, "狂战士胫甲")}]}`;
  const core = `"core_items_0",{"children":[${item(3031, "无尽之刃")},${item(3085, "卢安娜的飓风")}]}`;
  const skills = `"skill_0",{}` + `,"children":"Q","children":"W","children":"E","children":"Q"`;
  return `${augs},["$","tr",${starter}],["$","tr",${boots}],["$","tr",${core}],["$","li",${skills}`;
}

console.log("ARAM Mayhem sync tests (schema v4)");

// --- List-page parser ---
check("extractTierList parses real fields and sorts by rank", () => {
  const list = extractTierList(decodeRscPayload(makeListHtml(sampleChampions(5))));
  assert.equal(list.length, 5);
  assert.deepEqual(list.map((c) => c.rank), [1, 2, 3, 4, 5]);
  assert.equal(list[0].nameEn, "Champ0");
  assert.ok(list.every((c) => c.nameZh && c.tierLabel && Number.isFinite(c.tier)));
});

// --- Detail parsers ---
check("parseAugments returns a priority-ordered list with no fabricated rarity", () => {
  const augs = parseAugments(makeDetailRsc());
  assert.ok(augs.length >= 2, "should parse augments");
  assert.equal(augs[0].priority, 1);
  assert.equal(augs[1].priority, 2);
  assert.ok(augs[0].name.zh.length > 0, "augment needs a zh name");
  assert.equal(augs[0].metaId, "2096", "augment needs metaId");
  assert.equal(augs[0].icon?.source, "opgg", "augment icon should use OP.GG");
  assert.match(augs[0].icon?.url ?? "", /\/aram-augment\/GenericAbilityAugmentIcon_Gold\.png$/, "augment should expose icon URL");
  assert.ok(!("rarity" in augs[0]), "augments must not carry a rarity field");
});

check("parseItemSection groups item rows by section", () => {
  const rsc = makeDetailRsc();
  assert.ok(parseItemSection(rsc, "starter_items").length >= 1, "starter parsed");
  assert.ok(parseItemSection(rsc, "boots").length >= 1, "boots parsed");
  const core = parseItemSection(rsc, "core_items");
  assert.ok(core.length >= 1 && core[0].items.length >= 1, "core parsed");
  assert.equal(core[0].items[0].icon?.source, "opgg", "item icon should prefer OP.GG");
  assert.match(core[0].items[0].opggIconUrl, /\/item\/3031\.png$/, "item should expose OP.GG icon URL");
  assert.match(core[0].items[0].dataDragonIconUrl, /\/img\/item\/3031\.png$/, "item should expose Data Dragon icon URL");
});

check("parseSkills returns order + sequence, or null when absent", () => {
  const skills = parseSkills(makeDetailRsc());
  assert.ok(skills && Array.isArray(skills.order) && skills.order.length > 0);
  assert.equal(parseSkills("<no skill cells here>"), null, "missing skills => null");
});

// --- buildSnapshot protections ---
check("buildSnapshot refuses too few champions", () => {
  const html = makeListHtml(sampleChampions(3));
  const result = buildSnapshot({ listHtml: html, detailsByKey: new Map(), now: "2026-06-27T00:00:00.000Z" });
  assert.equal(result.ok, false);
  assert.match(result.reason, /refusing to overwrite/i);
});

check("buildSnapshot refuses low detail coverage", () => {
  const champs = sampleChampions(MIN_CHAMPIONS);
  const html = makeListHtml(champs);
  // Provide details for only 10% of champions.
  const details = new Map();
  for (let i = 0; i < 15; i++) details.set(`champ${i}`, makeDetailRsc());
  const result = buildSnapshot({ listHtml: html, detailsByKey: details, now: "2026-06-27T00:00:00.000Z" });
  assert.equal(result.ok, false, "low coverage must be refused");
  assert.match(result.reason, /coverage/i);
});

check("buildSnapshot succeeds with full detail coverage", () => {
  const champs = sampleChampions(MIN_CHAMPIONS);
  const html = makeListHtml(champs);
  const details = new Map();
  for (const c of champs) details.set(c.key, makeDetailRsc());
  const result = buildSnapshot({ listHtml: html, detailsByKey: details, now: "2026-06-27T00:00:00.000Z" });
  assert.equal(result.ok, true, result.reason);
  assert.equal(result.snapshot.version, 4);
  assert.equal(result.snapshot.status, "live");
  assert.equal(result.snapshot.failedDetailCount, 0);
  assert.ok(result.stats.augmentIconCoverage >= 0.8, "augment icon coverage should be tracked");
  assert.ok(result.stats.itemIconCoverage >= 0.8, "item icon coverage should be tracked");
  assert.ok(result.snapshot.champions.every((c) => c.detailStatus === "synced" || c.detailStatus === "partial"));
});

// --- Validator ---
check("validateSnapshot rejects a metadata-only snapshot", () => {
  assert.throws(
    () =>
      validateSnapshot({
        version: 3,
        status: "live",
        source: "opgg",
        sourceUrl: SOURCE_URL,
        syncedAt: "2026-06-27T00:00:00.000Z",
        championCount: 0,
        detailCount: 0,
        failedDetailCount: 0,
        champions: [],
      }),
    /champions must contain/,
  );
});

check("validateSnapshot rejects fabricated augment rarity", () => {
  const champs = sampleChampions(MIN_CHAMPIONS);
  const details = new Map();
  for (const c of champs) details.set(c.key, makeDetailRsc());
  const snap = buildSnapshot({ listHtml: makeListHtml(champs), detailsByKey: details, now: "2026-06-27T00:00:00.000Z" }).snapshot;
  snap.champions[0].augments[0].rarity = "prismatic";
  assert.throws(() => validateSnapshot(snap), /rarity/i);
});

// --- Shipped snapshot ---
check("shipped public JSON is valid live v4 data with strong coverage", () => {
  assert.equal(existsSync(dataPath), true, "public JSON snapshot should exist");
  const snapshot = JSON.parse(readFileSync(dataPath, "utf8"));
  validateSnapshot(snapshot);
  assert.equal(snapshot.version, 4, "shipped snapshot should be v4");
  assert.equal(snapshot.sourceUrl, SOURCE_URL);
  assert.ok(snapshot.championCount >= MIN_CHAMPIONS, `championCount >= ${MIN_CHAMPIONS}`);
  assert.ok(snapshot.detailCount >= MIN_CHAMPIONS, `detailCount >= ${MIN_CHAMPIONS}`);
  assert.ok(snapshot.champions.length >= MIN_CHAMPIONS, `champions array >= ${MIN_CHAMPIONS}`);

  const total = snapshot.champions.length;
  const augOk = snapshot.champions.filter((c) => c.augments.length > 0).length;
  const itemOk = snapshot.champions.filter(
    (c) => (c.items.core?.length ?? 0) > 0 || (c.items.boots?.length ?? 0) > 0,
  ).length;
  const skillOk = snapshot.champions.filter((c) => c.skills && c.skills.sequence.length > 0).length;
  assert.ok(augOk / total >= 0.95, `augments coverage ${(augOk / total * 100).toFixed(0)}% should be >= 95%`);
  assert.ok(itemOk / total >= 0.95, `items coverage ${(itemOk / total * 100).toFixed(0)}% should be >= 95%`);
  assert.ok(skillOk / total >= 0.95, `skills coverage ${(skillOk / total * 100).toFixed(0)}% should be >= 95%`);
  assert.ok(snapshot.iconCoverage?.augments?.pct >= 95, "augment icon coverage should be reported");
  assert.ok(snapshot.iconCoverage?.items?.pct >= 95, "item icon coverage should be reported");

  // Runes must NOT be a required field anywhere in the snapshot.
  assert.doesNotMatch(JSON.stringify(snapshot), /"runes"/, "snapshot should not carry a runes field");
  assert.doesNotMatch(JSON.stringify(snapshot), /棱镜/, "snapshot should not use 棱镜");
  assert.doesNotMatch(JSON.stringify(snapshot.champions), /"rarity"/, "augments should not carry rarity");
});

// --- Scaffolding ---
check("workflow is scheduled, manual, runs tests, and can commit", () => {
  const workflow = readFileSync(workflowPath, "utf8");
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /sync-aram-mayhem-data\.mjs/);
  assert.match(workflow, /test-aram-mayhem-sync\.mjs/);
  assert.match(workflow, /contents: write/);
});

check("sync script supports validate-only mode without network", () => {
  const validate = spawnSync(process.execPath, [syncScriptPath, "--validate-only"], { encoding: "utf8" });
  assert.equal(validate.status, 0, validate.stderr || validate.stdout);
});

console.log(`\nAll ${passed} ARAM Mayhem sync checks passed.`);
