import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import {
  buildSnapshot,
  decodeRscPayload,
  extractTierList,
  validateSnapshot,
} from "./sync-aram-mayhem-data.mjs";

const dataPath = "public/data/aram-mayhem.json";
const syncScriptPath = "scripts/sync-aram-mayhem-data.mjs";
const workflowPath = ".github/workflows/sync-aram-mayhem.yml";

const SOURCE_URL = "https://op.gg/zh-cn/lol/modes/aram-mayhem";
const MIN_CHAMPIONS = 80;

let passed = 0;
function check(label, fn) {
  fn();
  passed += 1;
  console.log(`  ok ${label}`);
}

/**
 * Build a tiny synthetic page that mimics OP.GG's RSC streaming format so the
 * parser can be exercised without a network call or a huge HTML fixture.
 */
function makeFixtureHtml(champions) {
  const payload = `0:["$","div",null,{"champions":${JSON.stringify(champions)}}]\n`;
  const chunk = JSON.stringify(payload); // escaped string literal, as OP.GG emits
  return `<!doctype html><html><body>ARAM Mayhem
<script>self.__next_f.push([1,${chunk}])</script>
</body></html>`;
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

console.log("ARAM Mayhem sync tests");

// --- Parser unit tests (offline, synthetic fixture) ---
check("decodeRscPayload reconstructs the streamed JSON text", () => {
  const html = makeFixtureHtml(sampleChampions(3));
  const text = decodeRscPayload(html);
  assert.match(text, /"champions":/, "decoded payload should contain the champions block");
});

check("extractTierList parses real fields and sorts by rank", () => {
  const html = makeFixtureHtml(sampleChampions(5));
  const list = extractTierList(decodeRscPayload(html));
  assert.equal(list.length, 5, "should parse all champions");
  assert.deepEqual(
    list.map((c) => c.rank),
    [1, 2, 3, 4, 5],
    "list should be sorted by rank",
  );
  for (const entry of list) {
    assert.ok(entry.key && entry.nameZh && entry.tierLabel, "entry needs key/nameZh/tierLabel");
    assert.ok(Number.isFinite(entry.tier) && Number.isFinite(entry.rank), "entry needs numeric tier/rank");
  }
  assert.equal(list[0].nameEn, "Champ0", "English name should be derived from the key");
});

check("buildSnapshot derives patch version from image URLs", () => {
  const html = makeFixtureHtml(sampleChampions(MIN_CHAMPIONS));
  const result = buildSnapshot({ html, now: "2026-06-27T00:00:00.000Z", previous: null });
  assert.equal(result.ok, true, "build should succeed with enough champions");
  assert.equal(result.snapshot.source.version, "16.13", "patch version should be parsed");
  assert.equal(result.snapshot.source.status, "live", "fresh sync should be status live");
  assert.equal(result.snapshot.schemaVersion, 2, "snapshot should be schemaVersion 2");
});

check("buildSnapshot refuses to overwrite when too few champions parse", () => {
  const html = makeFixtureHtml(sampleChampions(3));
  const result = buildSnapshot({ html, now: "2026-06-27T00:00:00.000Z", previous: { ok: true } });
  assert.equal(result.ok, false, "should refuse a near-empty parse");
  assert.match(result.reason, /refusing to overwrite/i);
});

check("buildSnapshot refuses garbage HTML (network/captcha failure shape)", () => {
  const result = buildSnapshot({ html: "<html>blocked</html>", now: "2026-06-27T00:00:00.000Z", previous: null });
  assert.equal(result.ok, false, "no champions block => refuse");
});

// --- Validator tests ---
check("validateSnapshot rejects a metadata-only snapshot", () => {
  assert.throws(
    () =>
      validateSnapshot({
        schemaVersion: 2,
        source: { url: SOURCE_URL, syncedAt: "2026-06-27T00:00:00.000Z", status: "live" },
        tiers: { silver: "银色", gold: "黄金", prismatic: "棱彩" },
        tierList: [],
      }),
    /tierList must contain/,
    "empty tierList must fail validation (not just metadata)",
  );
});

check("validateSnapshot rejects 棱镜 wording", () => {
  const html = makeFixtureHtml(sampleChampions(MIN_CHAMPIONS));
  const snap = buildSnapshot({ html, now: "2026-06-27T00:00:00.000Z", previous: null }).snapshot;
  snap.tiers.prismatic = "棱镜";
  assert.throws(() => validateSnapshot(snap), /棱彩|棱镜/);
});

// --- Shipped snapshot tests ---
check("shipped public JSON exists and is valid live data", () => {
  assert.equal(existsSync(dataPath), true, "public JSON snapshot should exist");
  const snapshot = JSON.parse(readFileSync(dataPath, "utf8"));
  validateSnapshot(snapshot);
  assert.equal(snapshot.schemaVersion, 2, "shipped snapshot should be schemaVersion 2");
  assert.equal(snapshot.source.url, SOURCE_URL, "shipped snapshot should cite OP.GG");
  assert.ok(snapshot.tierList.length >= MIN_CHAMPIONS, `shipped snapshot should list >= ${MIN_CHAMPIONS} champions`);
  assert.ok(typeof snapshot.source.syncedAt === "string", "shipped snapshot needs syncedAt");
  assert.ok(["live", "stale", "curated", "fallback"].includes(snapshot.source.status), "shipped snapshot needs a known status");
});

// --- Scaffolding tests ---
check("workflow is scheduled, manual, and allowed to commit", () => {
  const workflow = readFileSync(workflowPath, "utf8");
  assert.match(workflow, /schedule:/, "workflow should be scheduled");
  assert.match(workflow, /workflow_dispatch:/, "workflow should support manual runs");
  assert.match(workflow, /sync-aram-mayhem-data\.mjs/, "workflow should run the sync script");
  assert.match(workflow, /contents: write/, "workflow should be allowed to commit");
});

check("sync script supports validate-only mode without network", () => {
  const validate = spawnSync(process.execPath, [syncScriptPath, "--validate-only"], { encoding: "utf8" });
  assert.equal(validate.status, 0, validate.stderr || validate.stdout);
});

console.log(`\nAll ${passed} ARAM Mayhem sync checks passed.`);
