import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const SOURCE_URL = "https://op.gg/zh-cn/lol/modes/aram-mayhem";
const DATA_PATH = "public/data/aram-mayhem.json";
const tempPath = `${DATA_PATH}.tmp`;
const VALID_TIERS = new Set(["silver", "gold", "prismatic"]);
const VALID_PRIORITIES = new Set(["core", "good", "situational", "avoid"]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readSnapshot() {
  assert(existsSync(DATA_PATH), `${DATA_PATH} does not exist`);
  return JSON.parse(readFileSync(DATA_PATH, "utf8"));
}

function validateHex(hex, championId, tier) {
  assert(typeof hex.id === "string" && hex.id.length > 0, `${championId}.${tier} hex needs an id`);
  assert(typeof hex.nameZh === "string" && hex.nameZh.length > 0, `${hex.id} needs nameZh`);
  assert(typeof hex.nameEn === "string" && hex.nameEn.length > 0, `${hex.id} needs nameEn`);
  assert(hex.tier === tier, `${hex.id} tier should be ${tier}`);
  assert(VALID_PRIORITIES.has(hex.priority), `${hex.id} has invalid priority`);
  assert(typeof hex.reasonZh === "string" && hex.reasonZh.length > 0, `${hex.id} needs reasonZh`);
  assert(typeof hex.reasonEn === "string" && hex.reasonEn.length > 0, `${hex.id} needs reasonEn`);
}

function validateSnapshot(snapshot) {
  assert(snapshot && typeof snapshot === "object", "Snapshot must be an object");
  assert(snapshot.schemaVersion === 1, "Snapshot schemaVersion must be 1");
  assert(snapshot.source?.url === SOURCE_URL, "Snapshot must cite the OP.GG ARAM Mayhem URL");
  assert(snapshot.tiers?.prismatic === "棱彩", "Prismatic tier must be 棱彩");
  assert(!JSON.stringify(snapshot).includes("棱镜"), "Do not use 棱镜");
  assert(Array.isArray(snapshot.champions) && snapshot.champions.length > 0, "Snapshot needs champions");

  for (const champion of snapshot.champions) {
    assert(typeof champion.id === "string" && champion.id.length > 0, "Champion needs id");
    assert(typeof champion.nameZh === "string" && champion.nameZh.length > 0, `${champion.id} needs nameZh`);
    assert(typeof champion.nameEn === "string" && champion.nameEn.length > 0, `${champion.id} needs nameEn`);
    assert(Array.isArray(champion.aliases), `${champion.id} needs aliases`);
    assert(typeof champion.marker === "string" && champion.marker.length > 0, `${champion.id} needs marker`);
    assert(typeof champion.tier === "string" && champion.tier.length > 0, `${champion.id} needs tier`);
    assert(champion.hexes && typeof champion.hexes === "object", `${champion.id} needs hexes`);
    for (const tier of VALID_TIERS) {
      assert(Array.isArray(champion.hexes[tier]), `${champion.id} needs ${tier} hex list`);
      for (const hex of champion.hexes[tier]) validateHex(hex, champion.id, tier);
    }
    assert(Array.isArray(champion.builds) && champion.builds.length > 0, `${champion.id} needs builds`);
    for (const build of champion.builds) {
      assert(typeof build.id === "string" && build.id.length > 0, `${champion.id} build needs id`);
      assert(Array.isArray(build.coreItems) && build.coreItems.length > 0, `${build.id} needs core items`);
      assert(Array.isArray(build.situationalItems), `${build.id} needs situational items`);
      assert(Array.isArray(build.linkedHexes), `${build.id} needs linked hexes`);
    }
  }
}

function extractTitle(html) {
  const match = html.match(/<title>(.*?)<\/title>/is);
  if (!match) return "";
  return match[1]
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#x27;/g, "'")
    .trim();
}

async function fetchSourceMetadata() {
  const response = await fetch(SOURCE_URL, {
    headers: {
      "accept": "text/html,application/xhtml+xml",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.7",
      "user-agent": "PhiaSiteAramMayhemSync/1.0 (+https://phia.games)",
    },
  });

  if (!response.ok) {
    throw new Error(`OP.GG request failed with ${response.status}`);
  }

  const html = await response.text();
  assert(html.includes("ARAM") || html.includes("Mayhem"), "OP.GG page did not look like ARAM Mayhem");

  return {
    pageTitle: extractTitle(html),
    checksum: createHash("sha256").update(html).digest("hex"),
    contentLength: html.length,
  };
}

function mergeSnapshot(current, metadata, now) {
  return {
    ...current,
    source: {
      ...current.source,
      name: "OP.GG ARAM Mayhem",
      url: SOURCE_URL,
      updatedAt: now.slice(0, 10),
      syncedAt: now,
      syncStatus: "opgg-page-fetched",
      pageTitle: metadata.pageTitle,
      checksum: metadata.checksum,
      contentLength: metadata.contentLength,
    },
    champions: current.champions.map((champion) => ({
      ...champion,
      sourceUrl: SOURCE_URL,
      updatedAt: now.slice(0, 10),
    })),
  };
}

async function main() {
  const validateOnly = process.argv.includes("--validate-only");
  const current = readSnapshot();
  validateSnapshot(current);

  if (validateOnly) {
    console.log(`Validated ${current.champions.length} ARAM Mayhem champion records.`);
    return;
  }

  const metadata = await fetchSourceMetadata();
  const next = mergeSnapshot(current, metadata, new Date().toISOString());
  validateSnapshot(next);

  mkdirSync(dirname(DATA_PATH), { recursive: true });
  writeFileSync(tempPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  validateSnapshot(JSON.parse(readFileSync(tempPath, "utf8")));
  renameSync(tempPath, DATA_PATH);
  console.log(`Synced ${next.champions.length} ARAM Mayhem champion records from OP.GG metadata.`);
}

main().catch((error) => {
  if (existsSync(tempPath)) rmSync(tempPath, { force: true });
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
