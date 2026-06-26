/**
 * ARAM Mayhem detail-page feasibility probe.
 *
 * Read-only investigation: fetches per-champion OP.GG ARAM Mayhem build pages,
 * parses the structured fields embedded in the Next.js RSC stream, and reports
 * per-field success rates. It NEVER touches public/data/aram-mayhem.json — all
 * output goes to tmp/.
 *
 * Usage:
 *   node scripts/probe-aram-mayhem-details.mjs           # 10-champion sample
 *   node scripts/probe-aram-mayhem-details.mjs --full     # all champions in the live snapshot
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { argv } from "node:process";

const DATA_PATH = "public/data/aram-mayhem.json";
const OUT_DIR = "tmp";
const OUT_PATH = `${OUT_DIR}/aram-mayhem-detail-probe.json`;
const DETAIL_URL = (key) => `https://op.gg/zh-cn/lol/modes/aram-mayhem/${key}/build`;

const REQUEST_TIMEOUT_MS = 15000;
const MIN_DELAY_MS = 500;
const MAX_DELAY_MS = 1000;

// Sample set requested for the feasibility check. Keys are OP.GG champion keys.
const SAMPLE_KEYS = [
  "jinx",
  "brand",
  "vayne",
  "ashe",
  "ezreal",
  "lux",
  "malphite",
  "yasuo",
  "ahri",
  "leesin",
];

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

/** Concatenate the decoded RSC string chunks (see docs/aram-mayhem-sync-notes.md). */
function decodeRscPayload(html) {
  const pushRe = /self\.__next_f\.push\(\[\d+,\s*("(?:[^"\\]|\\.)*")\s*\]\)/g;
  let match;
  let combined = "";
  while ((match = pushRe.exec(html)) !== null) {
    try {
      combined += JSON.parse(match[1]);
    } catch {
      // skip non-string bootstrap pushes
    }
  }
  return combined;
}

/** Augments: ~10 per champion, with metaId + zh name. Rarity is only available
 *  for generic augments (tier-coded icon); ability-specific augments use their
 *  own icon with no rarity marker, so rarity is best-effort. The list is a
 *  single priority-ranked list, NOT split by silver/gold/prismatic. */
function parseAugments(rsc) {
  // Anchor each block from its marker to the next marker, or to the closing of
  // the augment <ul> for the final item, so the last augment is not dropped.
  const markers = [...rsc.matchAll(/\["\$","li","aram-augment-(\d+)"/g)];
  const out = [];
  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].index;
    const end = i + 1 < markers.length ? markers[i + 1].index : start + 1400;
    const block = rsc.slice(start, end);
    const id = (block.match(/"metaId":(\d+),"metaType":"aram-augment"/) || [])[1] ?? null;
    const icon = (block.match(/aram-augment\/([A-Za-z0-9_]+)\.png/) || [])[1] ?? "";
    const name =
      (block.match(/text-gray-900","children":"([^"]+)"/) || [])[1] ??
      (block.match(/"alt":"([^"]+)"/) || [])[1] ??
      null;
    const rarity = /Prism/i.test(icon)
      ? "prismatic"
      : /Gold/i.test(icon)
        ? "gold"
        : /Silver/i.test(icon)
          ? "silver"
          : null;
    if (id || name) out.push({ index: Number(markers[i][1]), id, name, rarity });
  }
  return out;
}

/** Items in a named section (starter_items / boots / core_items). Each row can
 *  be a build path with several items; we collect the distinct items per row in
 *  order, bounding each row at the next row/section marker so rows don't bleed. */
function parseItemSection(rsc, prefix) {
  const markers = [...rsc.matchAll(new RegExp(`"(?:${prefix}|starter_items|boots|core_items|spell_table|skill)_(\\d+)"`, "g"))]
    .filter((m) => m[0].includes(`"${prefix}_`));
  const rows = [];
  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].index;
    // bound at the next marker of ANY tracked section to avoid bleeding rows
    const nextAny = [...rsc.slice(start + 1).matchAll(/"(?:starter_items|boots|core_items|spell_table|skill)_\d+"/g)][0];
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

/** Skill leveling. The 18-cell sequence is the robust signal; max-priority
 *  order (excluding R) is derived from first appearance in that sequence. */
function parseSkills(rsc) {
  const sequence = [...rsc.matchAll(/"children":"([QWER])"/g)].map((x) => x[1]).slice(0, 18);
  const order = [];
  for (const letter of sequence) {
    if (letter !== "R" && !order.includes(letter)) order.push(letter);
  }
  return { order, sequence };
}

/** Runes are not published for ARAM Mayhem; detect any rune/perk markers if that changes. */
function parseRunes(rsc) {
  const ids = [...rsc.matchAll(/"metaId":(\d+),"metaType":"(?:rune|perk)"/g)].map((x) => Number(x[1]));
  return ids;
}

function parsePatch(rsc) {
  const m = /\/lol\/(\d+\.\d+)(?:\.\d+)?\/(?:champion|item)\//.exec(rsc);
  return m ? m[1] : null;
}

async function fetchDetail(key) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(DETAIL_URL(key), { headers: HEADERS, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    if (!/ARAM|Mayhem/.test(html)) throw new Error("not an ARAM Mayhem page");
    return html;
  } finally {
    clearTimeout(timer);
  }
}

function probeChampion(key, html) {
  const rsc = decodeRscPayload(html);
  const augments = parseAugments(rsc);
  const boots = parseItemSection(rsc, "boots");
  const core = parseItemSection(rsc, "core_items");
  const starter = parseItemSection(rsc, "starter_items");
  const skills = parseSkills(rsc);
  const runes = parseRunes(rsc);
  const patch = parsePatch(rsc);

  return {
    key,
    augments,
    items: { starter, boots, core },
    skills,
    runes,
    patch,
    // A field "succeeds" when we got non-empty, real data for it.
    fields: {
      augments: augments.length > 0,
      items: core.length > 0 || boots.length > 0,
      boots: boots.length > 0,
      core: core.length > 0,
      skills: skills.order.length > 0 || skills.sequence.length > 0,
      runes: runes.length > 0,
      patch: !!patch,
    },
  };
}

function pct(n, total) {
  return total === 0 ? 0 : Math.round((n / total) * 100);
}

async function main() {
  if (!existsSync(DATA_PATH)) {
    throw new Error(`${DATA_PATH} not found; run the tier-list sync first.`);
  }
  const snapshot = JSON.parse(readFileSync(DATA_PATH, "utf8"));
  const liveKeys = new Set((snapshot.tierList ?? []).map((c) => c.key));

  const full = argv.includes("--full");
  let keys;
  if (full) {
    keys = (snapshot.tierList ?? []).map((c) => c.key);
  } else {
    // Use the requested sample, mapping to real OP.GG keys where they exist.
    keys = SAMPLE_KEYS.map((k) => {
      if (liveKeys.has(k)) return k;
      // try to resolve by loose match against live keys
      const hit = [...liveKeys].find((lk) => lk.toLowerCase() === k.toLowerCase());
      return hit ?? k;
    });
  }

  console.log(`Probing ${keys.length} champion detail pages (${full ? "FULL" : "sample"})...`);
  const results = [];
  const errors = [];

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    try {
      const html = await fetchDetail(key);
      const probe = probeChampion(key, html);
      results.push(probe);
      const f = probe.fields;
      console.log(
        `  [${i + 1}/${keys.length}] ${key.padEnd(12)} ` +
          `aug=${probe.augments.length} core=${probe.items.core.length} boots=${probe.items.boots.length} ` +
          `skills=${f.skills ? "Y" : "-"} runes=${f.runes ? "Y" : "-"} patch=${probe.patch ?? "-"}`,
      );
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      errors.push({ key, reason });
      console.log(`  [${i + 1}/${keys.length}] ${key.padEnd(12)} FAILED: ${reason}`);
    }
    if (i < keys.length - 1) {
      await sleep(MIN_DELAY_MS + Math.floor((MAX_DELAY_MS - MIN_DELAY_MS) * ((i % 3) / 2)));
    }
  }

  const total = results.length;
  const fieldKeys = ["augments", "items", "boots", "core", "skills", "runes", "patch"];
  const rates = {};
  for (const fk of fieldKeys) {
    const ok = results.filter((r) => r.fields[fk]).length;
    rates[fk] = { ok, total, pct: pct(ok, total) };
  }

  const report = {
    probedAt: new Date().toISOString(),
    sourceUrlPattern: "https://op.gg/zh-cn/lol/modes/aram-mayhem/{key}/build",
    mode: full ? "full" : "sample",
    requested: keys.length,
    succeeded: total,
    failed: errors.length,
    successRates: rates,
    errors,
    results,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log("\n===== FIELD SUCCESS RATES =====");
  for (const fk of fieldKeys) {
    console.log(`  ${fk.padEnd(10)} ${rates[fk].pct}%  (${rates[fk].ok}/${total})`);
  }
  console.log(`\nWrote ${OUT_PATH} (${total} ok, ${errors.length} failed).`);

  // Recommendation gate from the task: aug>=80, items>=80, (skills OR runes)>=60.
  const gate =
    rates.augments.pct >= 80 &&
    rates.items.pct >= 80 &&
    (rates.skills.pct >= 60 || rates.runes.pct >= 60);
  console.log(
    `\nThreshold gate (aug>=80, items>=80, skills|runes>=60): ${gate ? "PASS" : "FAIL"}`,
  );
  if (!full) {
    console.log(
      gate
        ? "Recommendation: thresholds met — a full 173-champion probe is reasonable (re-run with --full)."
        : "Recommendation: thresholds not met — do NOT escalate to full sync; investigate the weak fields.",
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
