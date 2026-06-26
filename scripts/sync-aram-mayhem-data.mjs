import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { argv } from "node:process";
import { pathToFileURL } from "node:url";

const SOURCE_URL = "https://op.gg/zh-cn/lol/modes/aram-mayhem";
const DATA_PATH = "public/data/aram-mayhem.json";
const tempPath = `${DATA_PATH}.tmp`;

// A real OP.GG ARAM Mayhem tier list currently lists ~170 champions. Treat a
// parse that yields far fewer than that as broken rather than overwriting good
// data with a near-empty list.
const MIN_CHAMPIONS = 80;

const TIER_LABELS = { silver: "银色", gold: "黄金", prismatic: "棱彩" };
const TIER_LETTERS = ["S", "A", "B", "C", "D"];

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
 * chunks reconstructs the RSC payload, which contains plain JSON for the tier
 * list. We do NOT execute any of it; we only read string literals.
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

/** Derive the game patch (e.g. "16.13") from a champion image URL. */
function extractVersion(rawChampions) {
  for (const champion of rawChampions) {
    const match = /\/lol\/(\d+\.\d+)(?:\.\d+)?\/champion\//.exec(champion.image_url ?? "");
    if (match) return match[1];
  }
  return undefined;
}

/**
 * Build the normalized tier list from decoded RSC text. Returns an empty array
 * when the champions block can't be found so callers can refuse to overwrite.
 */
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

export function buildSnapshot({ html, now, previous }) {
  const rscText = decodeRscPayload(html);
  const tierList = extractTierList(rscText);
  const version = extractVersion(
    (extractArrayAfter(rscText, '"champions":[') ?? []).filter(Boolean),
  );
  const sourceHash = createHash("sha256").update(html).digest("hex");

  if (tierList.length < MIN_CHAMPIONS) {
    return {
      ok: false,
      reason: `Parsed only ${tierList.length} champions (need >= ${MIN_CHAMPIONS}); refusing to overwrite.`,
      tierList,
      previous,
    };
  }

  return {
    ok: true,
    tierList,
    snapshot: {
      schemaVersion: 2,
      source: {
        name: "OP.GG ARAM Mayhem",
        url: SOURCE_URL,
        version,
        updatedAt: now.slice(0, 10),
        syncedAt: now,
        sourceHash,
        status: "live",
      },
      tiers: { ...TIER_LABELS },
      tierList,
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
    fail(snapshot.schemaVersion === 2, "schemaVersion must be 2");
    fail(snapshot.source?.url === SOURCE_URL, "source.url must cite the OP.GG ARAM Mayhem URL");
    fail(typeof snapshot.source?.syncedAt === "string", "source.syncedAt must be set");
    fail(
      ["live", "stale", "curated", "fallback"].includes(snapshot.source?.status),
      "source.status must be a known status",
    );
    fail(snapshot.tiers?.prismatic === "棱彩", "prismatic tier label must be 棱彩");
    fail(!JSON.stringify(snapshot).includes("棱镜"), "Do not use 棱镜");
    fail(
      Array.isArray(snapshot.tierList) && snapshot.tierList.length >= MIN_CHAMPIONS,
      `tierList must contain >= ${MIN_CHAMPIONS} champions (real data, not metadata only)`,
    );

    for (const entry of snapshot.tierList ?? []) {
      fail(typeof entry.key === "string" && entry.key.length > 0, "tier entry needs key");
      fail(typeof entry.nameZh === "string" && entry.nameZh.length > 0, `${entry.key} needs nameZh`);
      fail(Number.isFinite(entry.tier) && entry.tier >= 1, `${entry.key} needs numeric tier`);
      fail(typeof entry.tierLabel === "string" && entry.tierLabel.length > 0, `${entry.key} needs tierLabel`);
      fail(Number.isFinite(entry.rank), `${entry.key} needs rank`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid snapshot:\n - ${errors.join("\n - ")}`);
  }
  return true;
}

function readExisting() {
  if (!existsSync(DATA_PATH)) return null;
  try {
    return JSON.parse(readFileSync(DATA_PATH, "utf8"));
  } catch {
    return null;
  }
}

async function fetchSource() {
  const response = await fetch(SOURCE_URL, {
    headers: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.7",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
  });
  if (!response.ok) {
    throw new Error(`OP.GG request failed with ${response.status}`);
  }
  const html = await response.text();
  if (!/ARAM|Mayhem/.test(html)) {
    throw new Error("OP.GG response did not look like the ARAM Mayhem page");
  }
  return html;
}

async function main() {
  const validateOnly = argv.includes("--validate-only");
  const existing = readExisting();

  if (validateOnly) {
    if (!existing) throw new Error(`${DATA_PATH} does not exist or is not valid JSON`);
    validateSnapshot(existing);
    console.log(`Validated live tier list with ${existing.tierList.length} champions (status: ${existing.source.status}).`);
    return;
  }

  const html = await fetchSource();
  const result = buildSnapshot({ html, now: new Date().toISOString(), previous: existing });

  if (!result.ok) {
    // Keep the previous snapshot intact; never write an empty/partial list.
    console.error(`Sync aborted: ${result.reason}`);
    if (existing) {
      console.error("Existing snapshot left unchanged.");
      return;
    }
    process.exit(1);
  }

  validateSnapshot(result.snapshot);

  // If nothing meaningful changed, leave the file (and its syncedAt) untouched
  // so the scheduled workflow produces no commit / deploy churn.
  if (existing && existing.source?.sourceHash === result.snapshot.source.sourceHash) {
    console.log("OP.GG page unchanged (same sourceHash); leaving snapshot as is.");
    return;
  }

  mkdirSync(dirname(DATA_PATH), { recursive: true });
  writeFileSync(tempPath, `${JSON.stringify(result.snapshot, null, 2)}\n`, "utf8");
  validateSnapshot(JSON.parse(readFileSync(tempPath, "utf8")));
  renameSync(tempPath, DATA_PATH);
  console.log(
    `Synced live tier list: ${result.snapshot.tierList.length} champions, patch ${result.snapshot.source.version ?? "?"}.`,
  );
}

// Only run when invoked directly, so tests can import the pure helpers above.
const invokedDirectly = argv[1] && import.meta.url === pathToFileURL(argv[1]).href;
if (invokedDirectly) {
  main().catch((error) => {
    if (existsSync(tempPath)) rmSync(tempPath, { force: true });
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
