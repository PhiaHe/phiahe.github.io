/* =============================================================================
 * Foundation test for the data-driven detail pages (first sample round).
 * -----------------------------------------------------------------------------
 * Scope is intentionally narrow: the 3 sample pages wired this round, plus the
 * invariant that Inkvoker stays a custom page (not a data-driven one). The full
 * 13-page coverage test comes in a later round.
 *
 * Approach mirrors test-navigation-behavior.mjs: compile the TS data layer to a
 * temp dir with tsc, import the compiled JS, and assert against the real data.
 * ============================================================================= */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";

const outDir = ".tmp-detail-foundation-test";

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

// The repo is `"type": "module"`, but the detail data layer spans several files
// with extensionless relative imports (Vite resolves these at build time). Node
// ESM cannot resolve those at runtime, so compile this temp copy as CommonJS —
// require-style resolution handles extensionless + directory imports, and a
// dynamic import() still reads the named exports back through CJS interop.
writeFileSync(`${outDir}/package.json`, JSON.stringify({ type: "commonjs" }), "utf8");

execFileSync(
  process.execPath,
  [
    "node_modules/typescript/bin/tsc",
    "src/data/detailPages.ts",
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

// --- the 3 sample routes wired this round -----------------------------------
const SAMPLE_ROUTES = [
  { route: "#/projects/visual-experiments", kind: "project" },
  { route: "#/lab/fluid-effects", kind: "lab" },
  { route: "#/notes/ai-workflow", kind: "article" },
];

for (const { route, kind } of SAMPLE_ROUTES) {
  const page = getDetailPageByRoute(route);
  assert.ok(page, `Route ${route} should resolve to a detail page`);
  assert.equal(page.kind, kind, `${route} should be kind "${kind}"`);
  assert.equal(isDetailPageRoute(route), true, `${route} should be a detail route`);

  // title / kicker / summary — bilingual
  for (const field of ["title", "kicker", "summary"]) {
    assert.ok(page[field]?.en?.trim(), `${route} ${field} should have EN text`);
    assert.ok(page[field]?.zh?.trim(), `${route} ${field} should have ZH text`);
  }

  // hero image — exists on disk + bilingual alt
  assert.ok(page.heroImage?.src, `${route} should have a hero image src`);
  assert.ok(page.heroImage.alt?.en?.trim(), `${route} hero alt should have EN`);
  assert.ok(page.heroImage.alt?.zh?.trim(), `${route} hero alt should have ZH`);
  const heroPath = `public${page.heroImage.src}`;
  assert.equal(existsSync(heroPath), true, `${route} hero image must exist: ${heroPath}`);

  // at least one content section, each bilingual
  assert.ok(page.sections?.length >= 1, `${route} should have >=1 section`);
  for (const section of page.sections) {
    assert.ok(section.id?.startsWith("detail-"), `${route} section id should be prefixed "detail-"`);
    assert.ok(section.nav?.en?.trim() && section.nav?.zh?.trim(), `${route} section nav should be bilingual`);
    assert.ok(section.heading?.en?.trim() && section.heading?.zh?.trim(), `${route} section heading should be bilingual`);

    // every referenced asset image must exist on disk
    for (const asset of section.assets ?? []) {
      assert.equal(existsSync(`public${asset.src}`), true, `${route} asset must exist: public${asset.src}`);
    }
    // item cards (if any) must be bilingual
    for (const item of section.items ?? []) {
      assert.ok(item.title?.en?.trim() && item.title?.zh?.trim(), `${route} item title should be bilingual`);
      assert.ok(item.body?.en?.trim() && item.body?.zh?.trim(), `${route} item body should be bilingual`);
    }
  }

  // related links — bilingual labels (back link at minimum)
  assert.ok(page.related?.length >= 1, `${route} should have >=1 related link`);
  for (const link of page.related) {
    assert.ok(link.label?.en?.trim() && link.label?.zh?.trim(), `${route} related label should be bilingual`);
    assert.ok(link.href?.startsWith("#"), `${route} related href should be a hash route`);
  }
}

// --- Inkvoker must NOT be a data-driven detail page -------------------------
assert.equal(
  isDetailPageRoute("#/projects/inkvoker"),
  false,
  "Inkvoker must keep its custom page, not resolve to a data-driven detail page",
);
assert.equal(
  getDetailPageByRoute("#/projects/inkvoker"),
  undefined,
  "Inkvoker route should not be in the data-driven registry",
);

// --- unknown route resolves to nothing (App falls back to home) -------------
assert.equal(getDetailPageByRoute("#/does/not/exist"), undefined, "Unknown route should resolve to undefined");

console.log(`detail-pages foundation: ${detailPages.length} page(s), ${SAMPLE_ROUTES.length} sample route(s) verified.`);

rmSync(outDir, { recursive: true, force: true });
