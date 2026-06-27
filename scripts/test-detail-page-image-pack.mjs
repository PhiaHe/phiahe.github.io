import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

const outDir = ".tmp-detail-image-pack-test";
const expectedSlugs = new Set([
  "visual-experiments",
  "pixel-character-lab",
  "fluid-effects",
  "pixel-characters",
  "game-ui",
  "prompt-assets",
  "game-vfx",
  "world-concepts",
  "ai-workflow",
  "combat-readability",
  "pixel-iteration",
  "prompt-engineering",
  "prototype-validation",
]);

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
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
  { stdio: "inherit" },
);

const { detailPages } = await import(pathToFileURL(`${process.cwd()}/${outDir}/detailPages.js`));
const { featuredWork, labCategories, devLog } = await import(
  pathToFileURL(`${process.cwd()}/${outDir}/siteData.js`),
);

function jpegSize(buffer) {
  assert.equal(buffer[0], 0xff, "image should start with JPEG SOI marker");
  assert.equal(buffer[1], 0xd8, "image should start with JPEG SOI marker");

  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }
  throw new Error("Could not read JPEG dimensions");
}

function assertImagePackSrc(src, label) {
  assert.match(src, /^\/assets\/detail-pages\/[^/]+\/hero\.jpg$/, `${label} should use the image pack`);
  assert.doesNotMatch(src, /\/assets\/placeholders\//, `${label} should not use placeholder art`);

  const slug = src.split("/").at(-2);
  assert.ok(expectedSlugs.has(slug), `${label} should use an expected image-pack slug`);

  const path = `public${src}`;
  assert.equal(existsSync(path), true, `${label} image should exist: ${path}`);
  const bytes = readFileSync(path);
  const { width, height } = jpegSize(bytes);
  assert.equal(width, 1536, `${label} should be 1536px wide`);
  assert.equal(height, 960, `${label} should be 960px tall`);
  assert.ok(bytes.length < 400_000, `${label} should be web-optimized below 400KB`);
}

for (const page of detailPages) {
  assertImagePackSrc(page.heroImage.src, `detail page ${page.id} hero`);
}

for (const work of featuredWork) {
  if (work.id === "inkvoker") continue;
  assertImagePackSrc(work.cover, `featured work ${work.id} cover`);
}

for (const category of labCategories) {
  assertImagePackSrc(category.cover, `lab category ${category.id} cover`);
}

for (const entry of devLog) {
  assertImagePackSrc(entry.cover, `dev log ${entry.id} cover`);
}

const onDiskSlugs = new Set(
  readdirSync("public/assets/detail-pages", { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name),
);
assert.deepEqual(onDiskSlugs, expectedSlugs, "image-pack directory should contain exactly the referenced slug folders");

for (const slug of onDiskSlugs) {
  assert.equal(existsSync(`public/assets/detail-pages/${slug}/hero.jpg`), true, `${slug} should have hero.jpg`);
}

console.log(`detail-page image pack: ${expectedSlugs.size} dedicated hero images verified.`);

rmSync(outDir, { recursive: true, force: true });
