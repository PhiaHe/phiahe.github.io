/* =============================================================================
 * ARAM Mayhem — sync-time formatting + freshness
 * -----------------------------------------------------------------------------
 * The public snapshot (public/data/aram-mayhem.json) carries an ISO `syncedAt`
 * stamped by the daily GitHub Actions sync. The UI shows that time — never a
 * build time, browser clock, or file mtime — so visitors see when the data was
 * actually refreshed.
 *
 * Output is pinned to UTC+8 and formatted by hand from the epoch so it is
 * stable regardless of the visitor's device locale or timezone (Intl locale
 * output varies by platform; a fixed offset does not).
 * ============================================================================= */

import type { Localized } from "../data/siteData";

/** Hours after which a live snapshot is treated as visibly "stale" in the UI. */
export const ARAM_SYNC_STALE_AFTER_HOURS = 36;

/** Shown when `syncedAt` is missing or unparseable. */
export const ARAM_SYNC_UNAVAILABLE: Localized = {
  en: "Unavailable",
  zh: "暂不可用",
};

const UTC8_OFFSET_MS = 8 * 60 * 60 * 1000;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Parse an ISO datetime to epoch ms, or null when missing / invalid. */
function parseIso(iso: string | undefined | null): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
}

/**
 * Format an ISO datetime as `YYYY-MM-DD HH:mm` in UTC+8.
 * Returns the localized "Unavailable" string when input is missing / invalid.
 * The "（UTC+8）" / " UTC+8" suffix is added by the caller's label, not here,
 * so this stays a pure time formatter.
 */
export function formatAramSyncedAt(iso: string | undefined | null): string | null {
  const ms = parseIso(iso);
  if (ms === null) return null;
  // Shift into UTC+8, then read the date in UTC so no local offset leaks in.
  const d = new Date(ms + UTC8_OFFSET_MS);
  const yyyy = d.getUTCFullYear();
  const mm = pad2(d.getUTCMonth() + 1);
  const dd = pad2(d.getUTCDate());
  const hh = pad2(d.getUTCHours());
  const min = pad2(d.getUTCMinutes());
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

/**
 * Localized "Updated" line, e.g. "数据更新：2026-06-28 12:37（UTC+8）" /
 * "Updated: 2026-06-28 12:37 UTC+8". Falls back to the unavailable string.
 * `now` is injectable for deterministic tests; defaults to the call time only
 * for freshness, never for the displayed value.
 */
export function aramUpdatedLabel(iso: string | undefined | null): Localized {
  const formatted = formatAramSyncedAt(iso);
  if (formatted === null) {
    return {
      en: `Updated: ${ARAM_SYNC_UNAVAILABLE.en}`,
      zh: `数据更新：${ARAM_SYNC_UNAVAILABLE.zh}`,
    };
  }
  return {
    en: `Updated: ${formatted} UTC+8`,
    zh: `数据更新：${formatted}（UTC+8）`,
  };
}

/** Localized "Last sync" line for the data-pipeline card. */
export function aramLastSyncLabel(iso: string | undefined | null): Localized {
  const formatted = formatAramSyncedAt(iso);
  if (formatted === null) {
    return {
      en: `Last sync: ${ARAM_SYNC_UNAVAILABLE.en}`,
      zh: `最近同步：${ARAM_SYNC_UNAVAILABLE.zh}`,
    };
  }
  return {
    en: `Last sync: ${formatted} UTC+8`,
    zh: `最近同步：${formatted}（UTC+8）`,
  };
}

/**
 * Is the snapshot fresh (synced within ARAM_SYNC_STALE_AFTER_HOURS)? Uses a UTC
 * timestamp difference; the displayed time stays UTC+8. Missing / invalid
 * stamps are treated as not fresh. `now` defaults to the current epoch.
 */
export function isAramSyncFresh(iso: string | undefined | null, now: number = Date.now()): boolean {
  const ms = parseIso(iso);
  if (ms === null) return false;
  const ageHours = (now - ms) / (1000 * 60 * 60);
  return ageHours >= 0 && ageHours <= ARAM_SYNC_STALE_AFTER_HOURS;
}
