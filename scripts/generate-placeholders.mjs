/* =============================================================================
 * Placeholder Asset Generator — Phia Games
 * -----------------------------------------------------------------------------
 * Generates premium, on-brand SVG placeholders into public/assets/placeholders/.
 * These are PLACEHOLDERS — replace the output files with real art later (keep
 * the same filenames, or repoint `cover` paths in src/data/siteData.ts).
 *
 *   Run with:  node scripts/generate-placeholders.mjs
 * ============================================================================= */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../public/assets/placeholders");
mkdirSync(OUT, { recursive: true });

// --- palette -----------------------------------------------------------------
const C = {
  void0: "#04060a",
  void1: "#070b12",
  void2: "#0b1220",
  cyan: "#5fd7d2",
  violet: "#8a7cf0",
  gold: "#d8b367",
  silver: "#c7d2e0",
};

const ACCENTS = { cyan: C.cyan, violet: C.violet, gold: C.gold, silver: C.silver };

// Deterministic pseudo-random so output is stable between runs.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// --- shared svg pieces -------------------------------------------------------
function defs(id, accent) {
  const a = ACCENTS[accent] ?? C.cyan;
  return `
  <defs>
    <radialGradient id="aur-${id}" cx="32%" cy="8%" r="90%">
      <stop offset="0%" stop-color="${a}" stop-opacity="0.55"/>
      <stop offset="38%" stop-color="${C.violet}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${C.void0}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bg-${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${C.void2}"/>
      <stop offset="55%" stop-color="${C.void1}"/>
      <stop offset="100%" stop-color="${C.void0}"/>
    </linearGradient>
    <linearGradient id="ink-${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${a}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${C.violet}" stop-opacity="0.5"/>
    </linearGradient>
    <filter id="soft-${id}" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="22"/>
    </filter>
    <filter id="grain-${id}">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.06"/></feComponentTransfer>
    </filter>
  </defs>`;
}

function grid(w, h, step = 40, op = 0.06) {
  let lines = "";
  for (let x = 0; x <= w; x += step)
    lines += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="#8ca5c8" stroke-opacity="${op}" stroke-width="1"/>`;
  for (let y = 0; y <= h; y += step)
    lines += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="#8ca5c8" stroke-opacity="${op}" stroke-width="1"/>`;
  return `<g>${lines}</g>`;
}

// Flowing ink-energy ribbons via layered bezier strokes.
function ribbons(id, w, h, seed, accent, count = 4) {
  const r = rng(seed);
  const a = ACCENTS[accent] ?? C.cyan;
  let out = "";
  for (let i = 0; i < count; i++) {
    const y0 = h * (0.2 + r() * 0.6);
    const amp = h * (0.12 + r() * 0.22);
    const cx1 = w * (0.2 + r() * 0.2);
    const cx2 = w * (0.6 + r() * 0.2);
    const d = `M ${-w * 0.1} ${y0}
      C ${cx1} ${y0 - amp}, ${cx2} ${y0 + amp}, ${w * 1.1} ${y0 - amp * 0.4}`;
    const col = i % 2 === 0 ? a : C.violet;
    const sw = 1 + r() * 2.4;
    out += `<path d="${d}" fill="none" stroke="${col}" stroke-opacity="${0.12 + r() * 0.16}" stroke-width="${sw}" stroke-linecap="round"/>`;
  }
  return `<g filter="url(#soft-${id})" opacity="0.9">${out}</g>`;
}

function particles(seed, w, h, n = 26) {
  const r = rng(seed);
  let out = "";
  for (let i = 0; i < n; i++) {
    const x = r() * w;
    const y = r() * h;
    const rad = r() * 1.8 + 0.4;
    const op = 0.15 + r() * 0.5;
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad.toFixed(1)}" fill="${C.silver}" fill-opacity="${op.toFixed(2)}"/>`;
  }
  return `<g>${out}</g>`;
}

function frameCorners(w, h, accent, m = 16, len = 26) {
  const a = ACCENTS[accent] ?? C.cyan;
  const s = `stroke="${a}" stroke-opacity="0.7" stroke-width="1.5" fill="none"`;
  return `<g>
    <path d="M${m} ${m + len} L${m} ${m} L${m + len} ${m}" ${s}/>
    <path d="M${w - m - len} ${m} L${w - m} ${m} L${w - m} ${m + len}" ${s}/>
    <path d="M${w - m} ${h - m - len} L${w - m} ${h - m} L${w - m - len} ${h - m}" ${s}/>
    <path d="M${m + len} ${h - m} L${m} ${h - m} L${m} ${h - m - len}" ${s}/>
  </g>`;
}

function label(text, w, h, accent) {
  const a = ACCENTS[accent] ?? C.cyan;
  return `<g font-family="'JetBrains Mono', monospace">
    <rect x="20" y="${h - 44}" width="${Math.max(120, text.length * 9 + 28)}" height="24" rx="12"
      fill="${C.void0}" fill-opacity="0.55" stroke="${a}" stroke-opacity="0.4"/>
    <circle cx="36" cy="${h - 32}" r="3" fill="${a}"/>
    <text x="48" y="${h - 28}" fill="${C.silver}" fill-opacity="0.85" font-size="11" letter-spacing="2">${text.toUpperCase()}</text>
  </g>`;
}

// --- composite tile ----------------------------------------------------------
function tile({ name, w = 800, h = 600, accent = "cyan", tag = "", motif = "ribbons" }) {
  const id = name.replace(/[^a-z0-9]/gi, "");
  const seed = hashStr(name);
  const r = rng(seed + 7);

  let motifLayer = "";
  if (motif === "ribbons") {
    motifLayer = ribbons(id, w, h, seed, accent, 5);
  } else if (motif === "orb") {
    const cx = w * 0.62;
    const cy = h * 0.42;
    const rad = Math.min(w, h) * 0.28;
    motifLayer = `
      <circle cx="${cx}" cy="${cy}" r="${rad}" fill="url(#ink-${id})" fill-opacity="0.18" filter="url(#soft-${id})"/>
      <circle cx="${cx}" cy="${cy}" r="${rad}" fill="none" stroke="url(#ink-${id})" stroke-opacity="0.6" stroke-width="1.5"/>
      <circle cx="${cx}" cy="${cy}" r="${rad * 0.62}" fill="none" stroke="${C.silver}" stroke-opacity="0.18" stroke-width="1"/>
      ${ribbons(id, w, h, seed + 3, accent, 3)}`;
  } else if (motif === "pixel") {
    // Pixel-grid motif — a stylized sprite block.
    const cell = 22;
    const cols = 7;
    const rows = 8;
    const ox = w * 0.5 - (cols * cell) / 2;
    const oy = h * 0.5 - (rows * cell) / 2;
    let cells = "";
    for (let yy = 0; yy < rows; yy++) {
      for (let xx = 0; xx < cols; xx++) {
        if (r() > 0.52) {
          const col = r() > 0.6 ? ACCENTS[accent] : C.silver;
          cells += `<rect x="${ox + xx * cell}" y="${oy + yy * cell}" width="${cell - 2}" height="${cell - 2}" rx="2" fill="${col}" fill-opacity="${(0.2 + r() * 0.6).toFixed(2)}"/>`;
        }
      }
    }
    motifLayer = `<g>${cells}</g>`;
  } else if (motif === "ui") {
    // Interface-mood motif — stacked HUD bars.
    let bars = "";
    const bx = w * 0.16;
    let by = h * 0.3;
    for (let i = 0; i < 4; i++) {
      const bw = w * (0.3 + r() * 0.4);
      bars += `<rect x="${bx}" y="${by}" width="${bw}" height="14" rx="7" fill="${C.void0}" fill-opacity="0.6" stroke="${ACCENTS[accent]}" stroke-opacity="0.5"/>`;
      bars += `<rect x="${bx}" y="${by}" width="${bw * (0.3 + r() * 0.6)}" height="14" rx="7" fill="${ACCENTS[accent]}" fill-opacity="0.4"/>`;
      by += 34;
    }
    motifLayer = `${ribbons(id, w, h, seed, accent, 2)}<g>${bars}</g>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${name} placeholder">
  ${defs(id, accent)}
  <rect width="${w}" height="${h}" fill="url(#bg-${id})"/>
  <rect width="${w}" height="${h}" fill="url(#aur-${id})"/>
  ${grid(w, h, 40, 0.05)}
  ${motifLayer}
  ${particles(seed + 11, w, h, 30)}
  <rect width="${w}" height="${h}" filter="url(#grain-${id})" opacity="0.5"/>
  ${frameCorners(w, h, accent)}
  ${tag ? label(tag, w, h, accent) : ""}
</svg>`;
}

// --- asset manifest ----------------------------------------------------------
const assets = [
  // Hero (wide)
  { name: "hero-bg", w: 1600, h: 900, accent: "cyan", motif: "ribbons", tag: "lab // hero" },
  { name: "og-cover", w: 1200, h: 630, accent: "violet", motif: "orb", tag: "phia games" },

  // Featured work covers
  { name: "work-inkvoker", accent: "cyan", motif: "orb", tag: "inkvoker" },
  { name: "work-visual", accent: "violet", motif: "ribbons", tag: "visual exp" },
  { name: "work-pixel", accent: "gold", motif: "pixel", tag: "pixel lab" },

  // Lab categories
  { name: "lab-pixel", w: 640, h: 480, accent: "gold", motif: "pixel", tag: "pixel" },
  { name: "lab-fluid", w: 640, h: 480, accent: "cyan", motif: "ribbons", tag: "fluid" },
  { name: "lab-ui", w: 640, h: 480, accent: "violet", motif: "ui", tag: "game ui" },
  { name: "lab-prompt", w: 640, h: 480, accent: "silver", motif: "orb", tag: "prompt" },
  { name: "lab-vfx", w: 640, h: 480, accent: "cyan", motif: "orb", tag: "vfx" },
  { name: "lab-concept", w: 640, h: 480, accent: "violet", motif: "ribbons", tag: "concept" },

  // Dev log thumbnails
  { name: "log-workflow", w: 560, h: 360, accent: "cyan", motif: "ui", tag: "workflow" },
  { name: "log-combat", w: 560, h: 360, accent: "gold", motif: "orb", tag: "game feel" },
  { name: "log-pixel", w: 560, h: 360, accent: "gold", motif: "pixel", tag: "pixel" },
  { name: "log-prompt", w: 560, h: 360, accent: "violet", motif: "ribbons", tag: "prompt" },
  { name: "log-validation", w: 560, h: 360, accent: "silver", motif: "ui", tag: "design" },
];

let count = 0;
for (const a of assets) {
  const svg = tile(a);
  writeFileSync(resolve(OUT, `${a.name}.svg`), svg, "utf8");
  count++;
}

// Favicon — brand sigil: P monogram + orbit ring + energy nodes (matches Logo.tsx).
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="core" x1="16" y1="10" x2="50" y2="56" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#aef3ee"/>
      <stop offset="42%" stop-color="${C.cyan}"/>
      <stop offset="100%" stop-color="${C.violet}"/>
    </linearGradient>
    <linearGradient id="ring" x1="6" y1="8" x2="58" y2="60" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${C.cyan}" stop-opacity="0.9"/>
      <stop offset="60%" stop-color="${C.violet}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="${C.gold}" stop-opacity="0.7"/>
    </linearGradient>
    <radialGradient id="node" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#eafffb"/>
      <stop offset="100%" stop-color="${C.cyan}"/>
    </radialGradient>
  </defs>
  <rect width="64" height="64" rx="15" fill="${C.void1}"/>
  <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="14.25" fill="none" stroke="url(#ring)" stroke-opacity="0.45"/>
  <ellipse cx="32" cy="32" rx="24" ry="13" stroke="url(#ring)" stroke-width="1.5" transform="rotate(-32 32 32)" opacity="0.8"/>
  <circle cx="53" cy="23" r="2.4" fill="url(#node)"/>
  <path d="M23 49 V17 h12.5 a10.5 10.5 0 0 1 0 21 H23" fill="none" stroke="url(#core)" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="23" cy="33" r="2.9" fill="url(#node)"/>
  <circle cx="44" cy="47" r="1.7" fill="${C.gold}" opacity="0.9"/>
</svg>`;
writeFileSync(resolve(__dirname, "../public/favicon.svg"), favicon, "utf8");

console.log(`Generated ${count} placeholder SVGs + favicon → public/assets/placeholders/`);
