import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";

const outDir = ".tmp-smooth-scroll-test";

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

execFileSync(
  process.execPath,
  [
    "node_modules/typescript/bin/tsc",
    "src/lib/smoothScrollMath.ts",
    "--target",
    "ES2020",
    "--module",
    "ES2020",
    "--moduleResolution",
    "node",
    "--skipLibCheck",
    "--outDir",
    outDir,
  ],
  { stdio: "inherit" }
);

const { advanceSmoothScroll, resolveWheelScrollDelta } = await import(
  pathToFileURL(`${process.cwd()}/${outDir}/smoothScrollMath.js`)
);

assert.equal(advanceSmoothScroll(0, 100, 0.1, 0.05), 10);
assert.equal(advanceSmoothScroll(99.98, 100, 0.1, 0.05), 100);
assert.equal(advanceSmoothScroll(110, 100, 0.1, 0.05), 109);
assert.equal(advanceSmoothScroll(0, 100, 1.5, 0.05), 100);
assert.equal(advanceSmoothScroll(0, 100, -1, 0.05), 0);

assert.equal(resolveWheelScrollDelta(100, 900, 0), 1512);
assert.equal(resolveWheelScrollDelta(100, 900, 700), 828);
assert.equal(resolveWheelScrollDelta(-100, 900, 700), -700);
assert.equal(resolveWheelScrollDelta(-100, 900, 1512), -1512);
assert.equal(resolveWheelScrollDelta(-100, 900, 1700), -828);
assert.equal(resolveWheelScrollDelta(24, 900, 0).toFixed(1), "32.4");

rmSync(outDir, { recursive: true, force: true });
