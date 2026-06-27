/* =============================================================================
 * Complete coverage test for the data-driven detail pages.
 * -----------------------------------------------------------------------------
 * Extends the foundation test (which only checked the 3 sample routes) to the
 * full set wired this round:
 *
 *   - Generic Project : 2 data-driven routes (visual-experiments,
 *                       pixel-character-lab) — Inkvoker is NOT data-driven.
 *   - Lab             : 6 routes
 *   - Article (notes) : 5 routes
 *
 * It also cross-checks the homepage cards in siteData.ts: every card href that
 * points at a detail route must resolve, the "Concept Placeholders" tile must
 * have become "World Concepts / 世界概念", and Inkvoker must keep its custom page.
 *
 * Approach mirrors test-detail-pages-foundation.mjs: compile the TS data layer
 * to a temp dir with tsc (CommonJS so Node can resolve the extensionless
 * relative imports), then import the compiled JS and assert against real data.
 *
 * Run: node scripts/test-detail-pages-complete.mjs   (also `npm run test:detail-pages:complete`)
 * ============================================================================= */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";

const outDir = ".tmp-detail-complete-test";

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

// Repo is `"type": "module"`, but the data layer uses extensionless relative
// imports that Node ESM can't resolve at runtime. Compile as CommonJS so
// require-style resolution handles them; dynamic import() reads exports back.
writeFileSync(`${outDir}/package.json`, JSON.stringify({ type: "commonjs" }), "utf8");

execFileSync(
  process.execPath,
  [
    "node_modules/typescript/bin/tsc",
    "src/data/detailPages.ts",
    "src/data/siteData.ts",
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

const { detailPages, getDetailPageByRoute, isDetailPageRoute } = await import(
  pathToFileURL(`${process.cwd()}/${outDir}/detailPages.js`)
);
const { featuredWork, labCategories, devLog } = await import(
  pathToFileURL(`${process.cwd()}/${outDir}/siteData.js`)
);

// --- expected full route set ------------------------------------------------
const EXPECTED = {
  project: ["#/projects/visual-experiments", "#/projects/pixel-character-lab"],
  lab: [
    "#/lab/fluid-effects",
    "#/lab/pixel-characters",
    "#/lab/game-ui",
    "#/lab/prompt-assets",
    "#/lab/game-vfx",
    "#/lab/world-concepts",
  ],
  article: [
    "#/notes/ai-workflow",
    "#/notes/combat-readability",
    "#/notes/pixel-iteration",
    "#/notes/prompt-engineering",
    "#/notes/prototype-validation",
  ],
};

const allExpected = [...EXPECTED.project, ...EXPECTED.lab, ...EXPECTED.article];

// 1. counts per kind are exactly right
for (const [kind, routes] of Object.entries(EXPECTED)) {
  const got = detailPages.filter((p) => p.kind === kind).map((p) => p.route).sort();
  assert.deepEqual(got, [...routes].sort(), `${kind} routes should be exactly ${routes.join(", ")}`);
}
assert.equal(
  detailPages.length,
  allExpected.length,
  `registry should hold exactly ${allExpected.length} data-driven pages`
);

// 2. all routes unique
const routeSet = new Set(detailPages.map((p) => p.route));
assert.equal(routeSet.size, detailPages.length, "all detail routes must be unique");

// 3. every page is fully populated + bilingual + hero exists on disk
for (const route of allExpected) {
  const page = getDetailPageByRoute(route);
  assert.ok(page, `Route ${route} should resolve to a detail page`);
  assert.equal(isDetailPageRoute(route), true, `${route} should report as a detail route`);
  assert.ok(page.id?.trim(), `${route} should have an id`);

  // 4. EN / ZH on title / kicker / summary
  for (const field of ["title", "kicker", "summary"]) {
    assert.ok(page[field]?.en?.trim(), `${route} ${field} should have EN text`);
    assert.ok(page[field]?.zh?.trim(), `${route} ${field} should have ZH text`);
  }

  // 5. hero image exists on disk + bilingual alt
  assert.ok(page.heroImage?.src, `${route} should have a hero image src`);
  assert.ok(page.heroImage.alt?.en?.trim() && page.heroImage.alt?.zh?.trim(), `${route} hero alt should be bilingual`);
  const heroPath = `public${page.heroImage.src}`;
  assert.equal(existsSync(heroPath), true, `${route} hero image must exist: ${heroPath}`);

  // 6. >=2 content sections, each bilingual; asset images (if any) must exist
  assert.ok(page.sections?.length >= 2, `${route} should have >=2 sections`);
  for (const section of page.sections) {
    assert.ok(section.id?.startsWith("detail-"), `${route} section id should be prefixed "detail-"`);
    assert.ok(section.nav?.en?.trim() && section.nav?.zh?.trim(), `${route} section nav should be bilingual`);
    assert.ok(section.heading?.en?.trim() && section.heading?.zh?.trim(), `${route} section heading should be bilingual`);
    for (const asset of section.assets ?? []) {
      assert.equal(existsSync(`public${asset.src}`), true, `${route} asset must exist: public${asset.src}`);
    }
    for (const item of section.items ?? []) {
      assert.ok(item.title?.en?.trim() && item.title?.zh?.trim(), `${route} item title should be bilingual`);
      assert.ok(item.body?.en?.trim() && item.body?.zh?.trim(), `${route} item body should be bilingual`);
    }
  }

  // section ids unique within a page
  const sectionIds = page.sections.map((s) => s.id);
  assert.equal(new Set(sectionIds).size, sectionIds.length, `${route} section ids must be unique`);

  // 7. related links — bilingual labels + hash hrefs, with a "back" link
  assert.ok(page.related?.length >= 1, `${route} should have >=1 related link`);
  for (const link of page.related) {
    assert.ok(link.label?.en?.trim() && link.label?.zh?.trim(), `${route} related label should be bilingual`);
    assert.ok(link.href?.startsWith("#"), `${route} related href should be a hash route`);
  }
}

// 8. Inkvoker stays custom — not in the data-driven registry
assert.equal(isDetailPageRoute("#/projects/inkvoker"), false, "Inkvoker must NOT be a data-driven detail page");
assert.equal(getDetailPageByRoute("#/projects/inkvoker"), undefined, "Inkvoker route must not resolve in the registry");

// 9. unknown route resolves to nothing (App falls back to home)
assert.equal(getDetailPageByRoute("#/does/not/exist"), undefined, "Unknown route should resolve to undefined");

// --- homepage card hrefs cross-check ----------------------------------------
// Every card that links to a detail route must resolve; Inkvoker is allowed to
// point at its custom (non-registry) route.
const CUSTOM_ROUTES = new Set(["#/projects/inkvoker"]);

function checkCardHref(label, href) {
  assert.ok(href, `${label} should have an href`);
  if (CUSTOM_ROUTES.has(href)) return; // custom page, not data-driven
  if (href.startsWith("#/")) {
    assert.equal(isDetailPageRoute(href), true, `${label} href ${href} must resolve to a detail route`);
  }
}

// Featured Work: all 3 cards link out (inkvoker custom, + 2 data-driven)
const EXPECTED_WORK_HREFS = {
  inkvoker: "#/projects/inkvoker",
  "visual-experiments": "#/projects/visual-experiments",
  "pixel-character-lab": "#/projects/pixel-character-lab",
};
for (const work of featuredWork) {
  const expected = EXPECTED_WORK_HREFS[work.id];
  assert.ok(expected, `unexpected featured work id: ${work.id}`);
  assert.equal(work.href, expected, `featured work ${work.id} href should be ${expected}`);
  checkCardHref(`featuredWork:${work.id}`, work.href);
}

// Visual Lab: every category links to its lab detail route
const EXPECTED_LAB_HREFS = {
  "pixel-characters": "#/lab/pixel-characters",
  "fluid-effects": "#/lab/fluid-effects",
  "game-ui": "#/lab/game-ui",
  "prompt-assets": "#/lab/prompt-assets",
  "game-vfx": "#/lab/game-vfx",
  "world-concepts": "#/lab/world-concepts",
};
for (const cat of labCategories) {
  const expected = EXPECTED_LAB_HREFS[cat.id];
  assert.ok(expected, `unexpected lab category id: ${cat.id}`);
  assert.equal(cat.href, expected, `lab category ${cat.id} href should be ${expected}`);
  checkCardHref(`labCategory:${cat.id}`, cat.href);
}

// Dev Log: every entry links to its article route
const EXPECTED_NOTE_HREFS = {
  "ai-workflow": "#/notes/ai-workflow",
  "combat-readability": "#/notes/combat-readability",
  "pixel-iteration": "#/notes/pixel-iteration",
  "prompt-engineering": "#/notes/prompt-engineering",
  "prototype-validation": "#/notes/prototype-validation",
};
for (const entry of devLog) {
  const expected = EXPECTED_NOTE_HREFS[entry.id];
  assert.ok(expected, `unexpected dev log id: ${entry.id}`);
  assert.equal(entry.href, expected, `dev log ${entry.id} href should be ${expected}`);
  checkCardHref(`devLog:${entry.id}`, entry.href);
}

// 10. "Concept Placeholders" was renamed to "World Concepts / 世界概念"
const worldConcepts = labCategories.find((c) => c.id === "world-concepts");
assert.ok(worldConcepts, "lab categories should contain a world-concepts tile");
assert.equal(worldConcepts.title.en, "World Concepts", "world-concepts EN title should be 'World Concepts'");
assert.equal(worldConcepts.title.zh, "世界概念", "world-concepts ZH title should be '世界概念'");
assert.equal(
  labCategories.some((c) => c.id === "concept" || c.title.en === "Concept Placeholders"),
  false,
  "the old 'Concept Placeholders' tile must be gone"
);

console.log(
  `detail-pages complete: ${detailPages.length} data-driven pages ` +
    `(${EXPECTED.project.length} project, ${EXPECTED.lab.length} lab, ${EXPECTED.article.length} article); ` +
    `homepage card hrefs verified; Inkvoker stays custom.`
);

rmSync(outDir, { recursive: true, force: true });
