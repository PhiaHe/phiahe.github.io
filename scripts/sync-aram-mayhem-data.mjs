import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { argv } from "node:process";
import { pathToFileURL } from "node:url";

const SOURCE_URL = "https://op.gg/zh-cn/lol/modes/aram-mayhem";
const DETAIL_URL = (key) => `${SOURCE_URL}/${key}/build`;
const DATA_PATH = "public/data/aram-mayhem.json";
const tempPath = `${DATA_PATH}.tmp`;

// Protection thresholds. A real ARAM Mayhem list has ~170 champions; treat a
// run that yields far fewer, or with poor detail coverage, as broken rather
// than overwriting good data.
const MIN_CHAMPIONS = 150;
const MIN_DETAIL_COVERAGE = 0.9; // >= 90% of champions must have parsed details
const MIN_FIELD_COVERAGE = 0.9; // >= 90% must have augments and items

const REQUEST_TIMEOUT_MS = 15000;
const MIN_DELAY_MS = 500;
const MAX_DELAY_MS = 1000;

const TIER_LETTERS = ["S", "A", "B", "C", "D"];

const HEADERS = {
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "accept-language": "zh-CN,zh;q=0.9,en;q=0.7",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function tierNumberToLabel(tier) {
  return TIER_LETTERS[tier - 1] ?? "?";
}

function titleCaseKey(key) {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/**
 * OP.GG is a Next.js app-router page: the data is streamed as a series of
 * `self.__next_f.push([1, "<chunk>"])` calls. Concatenating the decoded string
 * chunks reconstructs the RSC payload, which contains plain JSON / markup we
 * read (never execute). See docs/aram-mayhem-sync-notes.md.
 */
export function decodeRscPayload(html) {
  const pushRe = /self\.__next_f\.push\(\[\d+,\s*("(?:[^"\\]|\\.)*")\s*\]\)/g;
  let match;
  let combined = "";
  while ((match = pushRe.exec(html)) !== null) {
    try {
      combined += JSON.parse(match[1]);
    } catch {
      // Non-string pushes (bootstrap markers) are skipped.
    }
  }
  return combined;
}

/** Pull the first balanced JSON array that follows a `"<key>":` marker. */
function extractArrayAfter(text, marker) {
  const start = text.indexOf(marker);
  if (start < 0) return null;
  const open = text.indexOf("[", start);
  if (open < 0) return null;
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    const ch = text[i];
    if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(open, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

/** Derive the game patch (e.g. "16.13") from any champion/item image URL. */
function extractPatch(text) {
  const match = /\/lol\/(\d+\.\d+)(?:\.\d+)?\/(?:champion|item)\//.exec(text);
  return match ? match[1] : undefined;
}

/** Normalize the whole-mode tier list from the list page RSC text. */
export function extractTierList(rscText) {
  const raw = extractArrayAfter(rscText, '"champions":[');
  if (!Array.isArray(raw)) return [];

  return raw
    .filter(
      (c) =>
        c &&
        typeof c.key === "string" &&
        typeof c.name === "string" &&
        Number.isFinite(c.tier) &&
        Number.isFinite(c.rank),
    )
    .map((c) => ({
      key: c.key,
      championId: Number(c.champion_id ?? c.id ?? 0),
      nameZh: c.name,
      nameEn: titleCaseKey(c.key),
      tier: c.tier,
      tierLabel: tierNumberToLabel(c.tier),
      rank: c.rank,
      imageUrl: typeof c.image_url === "string" ? c.image_url : "",
    }))
    .sort((a, b) => a.rank - b.rank);
}

// --- Detail-page parsers (validated by scripts/probe-aram-mayhem-details.mjs) ---

/**
 * Recommended augments: a single priority-ordered list (~10). OP.GG does NOT
 * split this into silver/gold/prismatic for this mode, so we do not invent a
 * rarity. Each item carries an OP.GG augment metaId + Chinese name; priority is
 * the 1-based position in the list.
 */
export function parseAugments(rsc) {
  const markers = [...rsc.matchAll(/\["\$","li","aram-augment-(\d+)"/g)];
  const out = [];
  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].index;
    const end = i + 1 < markers.length ? markers[i + 1].index : start + 1400;
    const block = rsc.slice(start, end);
    const id = (block.match(/"metaId":(\d+),"metaType":"aram-augment"/) || [])[1] ?? null;
    const name =
      (block.match(/text-gray-900","children":"([^"]+)"/) || [])[1] ??
      (block.match(/"alt":"([^"]+)"/) || [])[1] ??
      null;
    if (id || name) {
      out.push({ id: id ?? "", name: { zh: name ?? "", en: "" }, priority: out.length + 1 });
    }
  }
  return out;
}

/**
 * Items in a named section. Each row can be a build path (several items); we
 * collect the distinct items per row in order, bounding each row at the next
 * row/section marker so rows don't bleed into each other.
 */
export function parseItemSection(rsc, prefix) {
  const markers = [...rsc.matchAll(new RegExp(`"${prefix}_(\\d+)"`, "g"))];
  const rows = [];
  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].index;
    const nextAny = [
      ...rsc.slice(start + 1).matchAll(/"(?:starter_items|boots|core_items|spell_table|skill)_\d+"/g),
    ][0];
    const end = nextAny ? start + 1 + nextAny.index : start + 1200;
    const block = rsc.slice(start, end);
    const items = [];
    const seen = new Set();
    for (const it of block.matchAll(/"metaType":"item","metaId":(\d+)[\s\S]*?"alt":"([^"]+)"/g)) {
      const id = Number(it[1]);
      if (!seen.has(id)) {
        seen.add(id);
        items.push({ id, name: it[2] });
      }
    }
    if (items.length > 0) rows.push({ row: Number(markers[i][1]), items });
  }
  return rows;
}

/**
 * Skill leveling. The 18-cell sequence is the robust signal; max-priority order
 * (excluding R) is derived from first appearance in that sequence. Returns null
 * when no skill cells are present (e.g. Viktor).
 */
export function parseSkills(rsc) {
  const sequence = [...rsc.matchAll(/"children":"([QWER])"/g)].map((x) => x[1]).slice(0, 18);
  if (sequence.length === 0) return null;
  const order = [];
  for (const letter of sequence) {
    if (letter !== "R" && !order.includes(letter)) order.push(letter);
  }
  return { order, sequence };
}

/** Parse one champion detail page into the v3 champion detail shape. */
export function parseDetail(rsc) {
  const augments = parseAugments(rsc);
  const items = {
    starter: parseItemSection(rsc, "starter_items"),
    boots: parseItemSection(rsc, "boots"),
    core: parseItemSection(rsc, "core_items"),
  };
  const skills = parseSkills(rsc);
  const patch = extractPatch(rsc);

  const hasAugments = augments.length > 0;
  const hasItems = items.core.length > 0 || items.boots.length > 0;
  const hasSkills = !!skills;

  // "synced" = augments + items + skills all present. Missing skills (or any
  // single field) downgrades to "partial" rather than failing the champion.
  const detailStatus = hasAugments && hasItems && hasSkills ? "synced" : "partial";

  return { augments, items, skills, patch, detailStatus, hasAugments, hasItems, hasSkills };
}

// --- Networking ---

async function fetchHtml(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: HEADERS, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    if (!/ARAM|Mayhem/.test(html)) throw new Error("not an ARAM Mayhem page");
    return html;
  } finally {
    clearTimeout(timer);
  }
}

// --- Snapshot assembly ---

function readExisting() {
  if (!existsSync(DATA_PATH)) return null;
  try {
    return JSON.parse(readFileSync(DATA_PATH, "utf8"));
  } catch {
    return null;
  }
}

/**
 * Build the v3 snapshot from a list page and a map of detail RSC text by key.
 * Returns { ok, reason?, snapshot?, stats } so the caller can refuse to write
 * when coverage is too low.
 */
export function buildSnapshot({ listHtml, detailsByKey, now }) {
  const listRsc = decodeRscPayload(listHtml);
  const tierList = extractTierList(listRsc);
  const sourceHash = createHash("sha256").update(listHtml).digest("hex");

  if (tierList.length < MIN_CHAMPIONS) {
    return {
      ok: false,
      reason: `Parsed only ${tierList.length} champions (need >= ${MIN_CHAMPIONS}); refusing to overwrite.`,
      stats: { championCount: tierList.length },
    };
  }

  let detailCount = 0;
  let failedDetailCount = 0;
  let augOk = 0;
  let itemOk = 0;
  let skillOk = 0;
  let patch;

  const champions = tierList.map((entry) => {
    const detailText = detailsByKey.get(entry.key);
    const base = {
      key: entry.key,
      championId: entry.championId,
      name: { zh: entry.nameZh, en: entry.nameEn },
      image: entry.imageUrl,
      tier: entry.tier,
      tierLabel: entry.tierLabel,
      rank: entry.rank,
      sourceUrl: DETAIL_URL(entry.key),
      syncedAt: now,
    };

    if (!detailText) {
      failedDetailCount += 1;
      return {
        ...base,
        detailStatus: "failed",
        augments: [],
        items: { starter: [], boots: [], core: [] },
        skills: null,
      };
    }

    const detail = parseDetail(detailText);
    detailCount += 1;
    if (detail.hasAugments) augOk += 1;
    if (detail.hasItems) itemOk += 1;
    if (detail.hasSkills) skillOk += 1;
    if (!patch && detail.patch) patch = detail.patch;

    // English augment names are not published; carry the zh name through.
    const augments = detail.augments.map((a) => ({
      id: a.id,
      name: { zh: a.name.zh, en: a.name.en || a.name.zh },
      priority: a.priority,
    }));

    return {
      ...base,
      detailStatus: detail.detailStatus,
      augments,
      items: detail.items,
      skills: detail.skills,
    };
  });

  if (!patch) patch = extractPatch(listRsc);

  const total = tierList.length;
  const detailCoverage = detailCount / total;
  const augCoverage = augOk / total;
  const itemCoverage = itemOk / total;
  const skillCoverage = skillOk / total;
  const stats = {
    championCount: total,
    detailCount,
    failedDetailCount,
    detailCoverage,
    augCoverage,
    itemCoverage,
    skillCoverage,
  };

  if (detailCoverage < MIN_DETAIL_COVERAGE) {
    return {
      ok: false,
      reason: `Detail coverage ${(detailCoverage * 100).toFixed(0)}% < ${MIN_DETAIL_COVERAGE * 100}%; refusing to overwrite.`,
      stats,
    };
  }
  if (augCoverage < MIN_FIELD_COVERAGE || itemCoverage < MIN_FIELD_COVERAGE) {
    return {
      ok: false,
      reason: `Field coverage too low (augments ${(augCoverage * 100).toFixed(0)}%, items ${(itemCoverage * 100).toFixed(0)}%); refusing to overwrite.`,
      stats,
    };
  }

  return {
    ok: true,
    stats,
    snapshot: {
      version: 3,
      status: "live",
      source: "opgg",
      sourceUrl: SOURCE_URL,
      patch,
      syncedAt: now,
      sourceHash,
      championCount: total,
      detailCount,
      failedDetailCount,
      champions,
    },
  };
}

export function validateSnapshot(snapshot) {
  const errors = [];
  const fail = (cond, msg) => {
    if (!cond) errors.push(msg);
  };

  fail(snapshot && typeof snapshot === "object", "Snapshot must be an object");
  if (snapshot && typeof snapshot === "object") {
    fail(snapshot.version === 3, "version must be 3");
    fail(snapshot.sourceUrl === SOURCE_URL, "sourceUrl must cite the OP.GG ARAM Mayhem URL");
    fail(typeof snapshot.syncedAt === "string", "syncedAt must be set");
    fail(["live", "stale", "curated", "fallback"].includes(snapshot.status), "status must be a known value");
    fail(!JSON.stringify(snapshot).includes("棱镜"), "Do not use 棱镜");
    // Rarity must NOT be fabricated for augments.
    fail(!/"rarity"|"silver"|"prismatic"/.test(JSON.stringify(snapshot.champions ?? [])), "augments must not carry fabricated rarity");
    fail(
      Array.isArray(snapshot.champions) && snapshot.champions.length >= MIN_CHAMPIONS,
      `champions must contain >= ${MIN_CHAMPIONS} entries (real data, not metadata only)`,
    );

    let augOk = 0;
    let itemOk = 0;
    for (const champion of snapshot.champions ?? []) {
      fail(typeof champion.key === "string" && champion.key.length > 0, "champion needs key");
      fail(champion.name?.zh && champion.name?.en, `${champion.key} needs name.zh/name.en`);
      fail(Number.isFinite(champion.tier), `${champion.key} needs numeric tier`);
      fail(Number.isFinite(champion.rank), `${champion.key} needs rank`);
      fail(
        ["synced", "partial", "failed"].includes(champion.detailStatus),
        `${champion.key} needs a valid detailStatus`,
      );
      fail(Array.isArray(champion.augments), `${champion.key} needs an augments array`);
      fail(champion.items && typeof champion.items === "object", `${champion.key} needs items`);
      if (champion.augments.length > 0) augOk += 1;
      if ((champion.items.core?.length ?? 0) > 0 || (champion.items.boots?.length ?? 0) > 0) itemOk += 1;
    }

    const total = snapshot.champions?.length ?? 0;
    if (total > 0) {
      fail(augOk / total >= MIN_FIELD_COVERAGE, `augments coverage ${(augOk / total * 100).toFixed(0)}% < ${MIN_FIELD_COVERAGE * 100}%`);
      fail(itemOk / total >= MIN_FIELD_COVERAGE, `items coverage ${(itemOk / total * 100).toFixed(0)}% < ${MIN_FIELD_COVERAGE * 100}%`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid snapshot:\n - ${errors.join("\n - ")}`);
  }
  return true;
}

async function main() {
  const validateOnly = argv.includes("--validate-only");
  const existing = readExisting();

  if (validateOnly) {
    if (!existing) throw new Error(`${DATA_PATH} does not exist or is not valid JSON`);
    validateSnapshot(existing);
    console.log(
      `Validated v${existing.version} snapshot: ${existing.championCount} champions, ` +
        `${existing.detailCount} detailed, ${existing.failedDetailCount} failed (status: ${existing.status}).`,
    );
    return;
  }

  console.log("Fetching ARAM Mayhem tier list from OP.GG...");
  const listHtml = await fetchHtml(SOURCE_URL);
  const tierList = extractTierList(decodeRscPayload(listHtml));
  console.log(`Tier list: ${tierList.length} champions.`);

  if (tierList.length < MIN_CHAMPIONS) {
    console.error(`Tier list too small (${tierList.length} < ${MIN_CHAMPIONS}); leaving snapshot unchanged.`);
    if (existing) return;
    process.exit(1);
  }

  console.log(`Fetching ${tierList.length} detail pages (this takes a few minutes)...`);
  const detailsByKey = new Map();
  for (let i = 0; i < tierList.length; i++) {
    const { key } = tierList[i];
    try {
      const html = await fetchHtml(DETAIL_URL(key));
      detailsByKey.set(key, decodeRscPayload(html));
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.warn(`  detail failed for ${key}: ${reason}`);
    }
    if (i < tierList.length - 1) {
      await sleep(MIN_DELAY_MS + Math.floor((MAX_DELAY_MS - MIN_DELAY_MS) * ((i % 3) / 2)));
    }
  }

  const result = buildSnapshot({ listHtml, detailsByKey, now: new Date().toISOString() });
  if (!result.ok) {
    console.error(`Sync aborted: ${result.reason}`);
    console.error(`Stats: ${JSON.stringify(result.stats)}`);
    if (existing) {
      console.error("Existing snapshot left unchanged.");
      return;
    }
    process.exit(1);
  }

  validateSnapshot(result.snapshot);

  if (existing && existing.sourceHash === result.snapshot.sourceHash && existing.detailCount === result.snapshot.detailCount) {
    console.log("OP.GG list unchanged (same sourceHash) and detail count stable; leaving snapshot as is.");
    return;
  }

  mkdirSync(dirname(DATA_PATH), { recursive: true });
  writeFileSync(tempPath, `${JSON.stringify(result.snapshot, null, 2)}\n`, "utf8");
  validateSnapshot(JSON.parse(readFileSync(tempPath, "utf8")));
  renameSync(tempPath, DATA_PATH);
  console.log(
    `Synced v3 snapshot: ${result.stats.championCount} champions, ` +
      `${result.stats.detailCount} detailed, ${result.stats.failedDetailCount} failed, patch ${result.snapshot.patch ?? "?"}.`,
  );
  console.log(
    `Coverage: augments ${(result.stats.augCoverage * 100).toFixed(0)}%, ` +
      `items ${(result.stats.itemCoverage * 100).toFixed(0)}%, skills ${(result.stats.skillCoverage * 100).toFixed(0)}%.`,
  );
}

const invokedDirectly = argv[1] && import.meta.url === pathToFileURL(argv[1]).href;
if (invokedDirectly) {
  main().catch((error) => {
    if (existsSync(tempPath)) rmSync(tempPath, { force: true });
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
