import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";

const outDir = ".tmp-navigation-test";

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

execFileSync(
  process.execPath,
  [
    "node_modules/typescript/bin/tsc",
    "src/lib/navigationBehavior.ts",
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

const { getNavbarLinks, shouldInterceptNavbarLink } = await import(
  pathToFileURL(`${process.cwd()}/${outDir}/lib/navigationBehavior.js`)
);

assert.deepEqual(
  getNavbarLinks("project").map((link) => link.href),
  ["#project-main", "#project-loop", "#project-systems", "#project-gallery", "#project-status"]
);
assert.deepEqual(
  getNavbarLinks("project").map((link) => link.label.en),
  ["Overview", "Loop", "Systems", "Gallery", "Status"]
);
assert.equal(shouldInterceptNavbarLink("home"), false);
assert.equal(shouldInterceptNavbarLink("project"), true);

rmSync(outDir, { recursive: true, force: true });
