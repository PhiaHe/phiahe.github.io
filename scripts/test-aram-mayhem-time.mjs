/* =============================================================================
 * Tests for src/lib/aramMayhemTime.ts
 * -----------------------------------------------------------------------------
 * Verifies the sync-time formatter is pinned to UTC+8, formats as
 * YYYY-MM-DD HH:mm, falls back cleanly on missing / invalid input, and that the
 * freshness check uses a UTC timestamp difference (independent of display TZ).
 *
 * Compile the TS util to a temp dir with tsc (CommonJS), then import + assert.
 * ============================================================================= */

import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";

const outDir = ".tmp-aram-time-test";

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
writeFileSync(`${outDir}/package.json`, JSON.stringify({ type: "commonjs" }), "utf8");

execFileSync(
  process.execPath,
  [
    "node_modules/typescript/bin/tsc",
    "src/lib/aramMayhemTime.ts",
    "--target",
    "ES2020",
    "--module",
    "commonjs",
    "--moduleResolution",
    "node",
    "--skipLibCheck",
    "--outDir",
    outDir,
  ],
  { stdio: "inherit" }
);

const {
  formatAramSyncedAt,
  aramUpdatedLabel,
  aramLastSyncLabel,
  isAramSyncFresh,
  ARAM_SYNC_STALE_AFTER_HOURS,
} = await import(pathToFileURL(`${process.cwd()}/${outDir}/lib/aramMayhemTime.js`));

let passed = 0;
function check(label, fn) {
  fn();
  passed += 1;
  console.log(`  ok ${label}`);
}

console.log("ARAM Mayhem sync-time tests");

// --- formatting is pinned to UTC+8, YYYY-MM-DD HH:mm ------------------------
check("formats an ISO time into UTC+8 YYYY-MM-DD HH:mm", () => {
  // 2026-06-28T04:37:00Z  ->  UTC+8 = 12:37 same day
  assert.equal(formatAramSyncedAt("2026-06-28T04:37:00Z"), "2026-06-28 12:37");
});

check("rolls the date forward across the UTC+8 midnight boundary", () => {
  // 2026-06-27T20:10:00Z  ->  UTC+8 = 2026-06-28 04:10
  assert.equal(formatAramSyncedAt("2026-06-27T20:10:00Z"), "2026-06-28 04:10");
});

check("output is stable regardless of input offset (same instant)", () => {
  // Same instant expressed as +08:00 should give the same wall-clock UTC+8.
  assert.equal(formatAramSyncedAt("2026-06-28T12:37:00+08:00"), "2026-06-28 12:37");
});

check("pads single-digit month / day / hour / minute", () => {
  assert.equal(formatAramSyncedAt("2026-01-02T00:05:00Z"), "2026-01-02 08:05");
});

// --- fallbacks --------------------------------------------------------------
check("returns null for missing / empty / invalid input", () => {
  assert.equal(formatAramSyncedAt(undefined), null);
  assert.equal(formatAramSyncedAt(""), null);
  assert.equal(formatAramSyncedAt("not-a-date"), null);
});

check("updated label shows formatted time with UTC+8 suffix", () => {
  const label = aramUpdatedLabel("2026-06-28T04:37:00Z");
  assert.equal(label.en, "Updated: 2026-06-28 12:37 UTC+8");
  assert.equal(label.zh, "数据更新：2026-06-28 12:37（UTC+8）");
});

check("updated label degrades to Unavailable", () => {
  const label = aramUpdatedLabel(undefined);
  assert.equal(label.en, "Updated: Unavailable");
  assert.equal(label.zh, "数据更新：暂不可用");
});

check("last-sync label mirrors the same time + fallback", () => {
  assert.equal(aramLastSyncLabel("2026-06-28T04:37:00Z").zh, "最近同步：2026-06-28 12:37（UTC+8）");
  assert.equal(aramLastSyncLabel("").en, "Last sync: Unavailable");
});

// --- freshness uses a UTC timestamp diff ------------------------------------
check("fresh within the stale window, stale beyond it", () => {
  const now = Date.parse("2026-06-28T12:00:00Z");
  const oneHourAgo = "2026-06-28T11:00:00Z";
  const wayOld = "2026-06-20T00:00:00Z";
  assert.equal(isAramSyncFresh(oneHourAgo, now), true);
  assert.equal(isAramSyncFresh(wayOld, now), false);
  assert.equal(isAramSyncFresh(undefined, now), false);
});

check("stale threshold boundary is ARAM_SYNC_STALE_AFTER_HOURS", () => {
  const now = Date.parse("2026-06-28T12:00:00Z");
  const justInside = new Date(now - (ARAM_SYNC_STALE_AFTER_HOURS - 0.5) * 3600 * 1000).toISOString();
  const justOutside = new Date(now - (ARAM_SYNC_STALE_AFTER_HOURS + 0.5) * 3600 * 1000).toISOString();
  assert.equal(isAramSyncFresh(justInside, now), true);
  assert.equal(isAramSyncFresh(justOutside, now), false);
});

console.log(`\nAll ${passed} ARAM Mayhem sync-time checks passed.`);

rmSync(outDir, { recursive: true, force: true });
