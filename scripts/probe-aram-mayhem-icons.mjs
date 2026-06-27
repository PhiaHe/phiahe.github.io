/**
 * ARAM Mayhem item/augment icon-source probe.
 *
 * Read-only investigation. Fetches OP.GG ARAM Mayhem champion detail pages,
 * inspects the streamed RSC payload for item and augment icon fields, and
 * writes a sanitized report to tmp/aram-mayhem-icon-probe.json.
 *
 * Usage:
 *   node scripts/probe-aram-mayhem-icons.mjs
 *   node scripts/probe-aram-mayhem-icons.mjs --full
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { argv } from "node:process";

const DATA_PATH = "public/data/aram-mayhem.json";
const OUT_DIR = "tmp";
const OUT_PATH = `${OUT_DIR}/aram-mayhem-icon-probe.json`;
const DETAIL_URL = (key) => `https://op.gg/zh-cn/lol/modes/aram-mayhem/${key}/build`;

const REQUEST_TIMEOUT_MS = 15000;
const MIN_DELAY_MS = 500;
const MAX_DELAY_MS = 1000;

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

function sanitizeUrl(rawUrl) {
  let normalized = rawUrl.replaceAll("\\u002F", "/").replaceAll("\\/", "/").replaceAll("&amp;", "&");
  if (normalized.startsWith("//")) normalized = `https:${normalized}`;
  try {
    const url = new URL(normalized);
    const hadQuery = url.search.length > 0 || url.hash.length > 0;
    url.search = "";
    url.hash = "";
    return { url: url.toString(), hadQuery };
  } catch {
    return { url: normalized.split("?")[0].split("#")[0], hadQuery: /[?#]/.test(normalized) };
  }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function collectPngRefs(text, folder) {
  const refs = [];
  const fullUrlRe = new RegExp(`https?:\\\\?/\\\\?/[^"'\\s\\\\]+/${folder}/[^"'\\s\\\\]+\\.png`, "gi");
  const pathRe = new RegExp(`(?:/[^"'\\s\\\\]*)?/${folder}/[^"'\\s\\\\]+\\.png`, "gi");

  for (const match of text.matchAll(fullUrlRe)) {
    refs.push(sanitizeUrl(match[0]).url);
  }
  for (const match of text.matchAll(pathRe)) {
    refs.push(sanitizeUrl(match[0]).url);
  }

  return unique(refs);
}

function extractPatch(snapshot, rsc) {
  const imagePatch = /\/lol\/(\d+\.\d+(?:\.\d+)?)\/(?:champion|item|aram-augment)\//.exec(rsc)?.[1];
  if (imagePatch) return imagePatch;
  if (typeof snapshot.patch === "string" && snapshot.patch.length > 0) {
    return snapshot.patch.includes(".") && snapshot.patch.split(".").length >= 3
      ? snapshot.patch
      : `${snapshot.patch}.1`;
  }
  return null;
}

function opggItemIconUrl(patch, itemId) {
  return patch ? `https://opgg-static.akamaized.net/meta/images/lol/${patch}/item/${itemId}.png` : null;
}

function dataDragonItemIconUrl(patch, itemId) {
  return patch ? `https://ddragon.leagueoflegends.com/cdn/${patch}/img/item/${itemId}.png` : null;
}

function opggAugmentIconUrl(patch, iconFile) {
  return patch && iconFile
    ? `https://opgg-static.akamaized.net/meta/images/lol/${patch}/aram-augment/${iconFile}`
    : null;
}

function parseItems(rsc, patch) {
  const out = [];
  const seen = new Set();
  const itemRe = /"metaType":"item","metaId":(\d+)[\s\S]*?(?="metaType":"item"|"metaType":"aram-augment"|"spell_table_|"skill_|$)/g;
  for (const match of rsc.matchAll(itemRe)) {
    const id = Number(match[1]);
    const block = match[0];
    const name = block.match(/"alt":"([^"]+)"/)?.[1] ?? "";
    const opggRefs = collectPngRefs(block, "item").filter((ref) => ref.includes(`/${id}.png`));
    const opggCandidate = opggItemIconUrl(patch, id);
    const ddragonCandidate = dataDragonItemIconUrl(patch, id);
    const key = `${id}:${name}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push({
        id,
        name,
        opggIconRefs: unique(opggRefs),
        opggStaticCandidate: opggCandidate,
        dataDragonCandidate: ddragonCandidate,
      });
    }
  }
  return out;
}

function parseAugments(rsc, patch) {
  const markers = [...rsc.matchAll(/\["\$","li","aram-augment-(\d+)"/g)];
  const out = [];
  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].index;
    const end = i + 1 < markers.length ? markers[i + 1].index : start + 1600;
    const block = rsc.slice(start, end);
    const id = block.match(/"metaId":(\d+),"metaType":"aram-augment"/)?.[1] ?? "";
    const name =
      block.match(/text-gray-900","children":"([^"]+)"/)?.[1] ??
      block.match(/"alt":"([^"]+)"/)?.[1] ??
      "";
    const refs = collectPngRefs(block, "aram-augment");
    const files = unique(refs.map((ref) => ref.match(/aram-augment\/([^/?#]+\.png)/)?.[1] ?? ""));
    const inlineCandidates = refs.filter((ref) => /^https?:\/\//.test(ref));
    const versionedCandidates = unique(files.map((file) => opggAugmentIconUrl(patch, file)));
    const candidates = unique([...inlineCandidates, ...versionedCandidates]);

    out.push({
      priority: out.length + 1,
      id,
      name,
      iconRefs: refs,
      iconFiles: files,
      opggInlineCandidates: inlineCandidates,
      opggVersionedCandidates: versionedCandidates,
      opggStaticCandidates: candidates,
    });
  }
  return out;
}

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: HEADERS, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function checkAssetUrl(url) {
  const sanitized = sanitizeUrl(url);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    let res = await fetch(url, { method: "HEAD", headers: HEADERS, signal: controller.signal });
    if (!res.ok || res.status === 405) {
      res = await fetch(url, { method: "GET", headers: { ...HEADERS, range: "bytes=0-0" }, signal: controller.signal });
    }
    return {
      url: sanitized.url,
      host: new URL(sanitized.url).host,
      ok: res.ok,
      status: res.status,
      contentType: res.headers.get("content-type") ?? "",
      hadQuery: sanitized.hadQuery,
    };
  } catch (error) {
    return {
      url: sanitized.url,
      host: /^https?:\/\//.test(sanitized.url) ? new URL(sanitized.url).host : "",
      ok: false,
      status: 0,
      contentType: "",
      hadQuery: sanitized.hadQuery,
      error: error instanceof Error ? error.name : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

function summarize(results, assetChecks) {
  const itemRows = results.flatMap((result) => result.items);
  const augmentRows = results.flatMap((result) => result.augments);
  const checkedByUrl = new Map(assetChecks.map((check) => [check.url, check]));

  const itemCandidateUrls = itemRows.flatMap((item) =>
    [item.opggStaticCandidate, item.dataDragonCandidate].filter(Boolean),
  );
  const augmentCandidateUrls = augmentRows.flatMap((augment) => augment.opggStaticCandidates);
  const augmentInlineUrls = augmentRows.flatMap((augment) => augment.opggInlineCandidates);
  const augmentVersionedUrls = augmentRows.flatMap((augment) => augment.opggVersionedCandidates);

  const checkedOk = (urls) => {
    const checks = unique(urls).map((url) => checkedByUrl.get(sanitizeUrl(url).url)).filter(Boolean);
    return {
      checked: checks.length,
      ok: checks.filter((check) => check.ok).length,
      withQuery: checks.filter((check) => check.hadQuery).length,
      hosts: unique(checks.map((check) => check.host)),
    };
  };

  return {
    items: {
      totalMentions: itemRows.length,
      withItemId: itemRows.filter((item) => Number.isFinite(item.id)).length,
      withInlineIconRef: itemRows.filter((item) => item.opggIconRefs.length > 0).length,
      withOpggStaticCandidate: itemRows.filter((item) => item.opggStaticCandidate).length,
      withDataDragonCandidate: itemRows.filter((item) => item.dataDragonCandidate).length,
      assetChecks: checkedOk(itemCandidateUrls),
    },
    augments: {
      totalMentions: augmentRows.length,
      withMetaId: augmentRows.filter((augment) => augment.id).length,
      withIconRef: augmentRows.filter((augment) => augment.iconRefs.length > 0).length,
      withOpggInlineCandidate: augmentRows.filter((augment) => augment.opggInlineCandidates.length > 0).length,
      withOpggVersionedCandidate: augmentRows.filter((augment) => augment.opggVersionedCandidates.length > 0).length,
      withOpggStaticCandidate: augmentRows.filter((augment) => augment.opggStaticCandidates.length > 0).length,
      assetChecks: checkedOk(augmentCandidateUrls),
      inlineAssetChecks: checkedOk(augmentInlineUrls),
      versionedAssetChecks: checkedOk(augmentVersionedUrls),
    },
  };
}

async function main() {
  if (!existsSync(DATA_PATH)) throw new Error(`${DATA_PATH} not found`);
  const snapshot = JSON.parse(readFileSync(DATA_PATH, "utf8"));
  const liveKeys = new Set((snapshot.champions ?? []).map((champion) => champion.key));
  const full = argv.includes("--full");
  const keys = full ? [...liveKeys] : SAMPLE_KEYS.filter((key) => liveKeys.has(key));

  console.log(`Probing icon sources for ${keys.length} champions (${full ? "FULL" : "sample"})...`);

  const results = [];
  const errors = [];
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    try {
      const html = await fetchText(DETAIL_URL(key));
      const rsc = decodeRscPayload(html);
      const patch = extractPatch(snapshot, rsc);
      const items = parseItems(rsc, patch);
      const augments = parseAugments(rsc, patch);
      results.push({ key, sourceUrl: DETAIL_URL(key), patch, items, augments });
      console.log(
        `  [${i + 1}/${keys.length}] ${key.padEnd(12)} items=${items.length} augments=${augments.length} patch=${patch ?? "-"}`,
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

  const itemUrls = results.flatMap((result) =>
    result.items.flatMap((item) => [item.opggStaticCandidate, item.dataDragonCandidate].filter(Boolean)),
  );
  const augmentUrls = results.flatMap((result) =>
    result.augments.flatMap((augment) => augment.opggStaticCandidates),
  );
  const urlsToCheck = unique([...itemUrls, ...augmentUrls]).slice(0, full ? 300 : 120);

  console.log(`Checking ${urlsToCheck.length} candidate icon URLs...`);
  const assetChecks = [];
  for (const url of urlsToCheck) {
    assetChecks.push(await checkAssetUrl(url));
  }

  const report = {
    probedAt: new Date().toISOString(),
    mode: full ? "full" : "sample",
    requested: keys.length,
    succeeded: results.length,
    failed: errors.length,
    sampleKeys: keys,
    sourceUrlPattern: "https://op.gg/zh-cn/lol/modes/aram-mayhem/{key}/build",
    outputNotes: [
      "Read-only probe; public/data/aram-mayhem.json is not modified.",
      "Stored URLs are sanitized: query strings and hashes are omitted.",
      "Candidate item icons are derived from OP.GG static item paths and Riot Data Dragon item ids.",
      "Candidate augment icons are derived from OP.GG aram-augment image refs in the RSC payload.",
    ],
    summary: summarize(results, assetChecks),
    errors,
    assetChecks,
    results,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log("\n===== ICON SOURCE SUMMARY =====");
  console.log(JSON.stringify(report.summary, null, 2));
  console.log(`\nWrote ${OUT_PATH}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
