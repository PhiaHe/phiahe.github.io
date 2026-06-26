import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const dataPath = "public/data/aram-mayhem.json";
const syncScriptPath = "scripts/sync-aram-mayhem-data.mjs";
const workflowPath = ".github/workflows/sync-aram-mayhem.yml";
const pagePath = "src/components/tools/AramMayhemPage.tsx";

assert.equal(existsSync(dataPath), true, "ARAM Mayhem should ship a public JSON data snapshot");
assert.equal(existsSync(syncScriptPath), true, "ARAM Mayhem should have a sync script");
assert.equal(existsSync(workflowPath), true, "ARAM Mayhem should have a scheduled sync workflow");

const snapshot = JSON.parse(readFileSync(dataPath, "utf8"));
assert.equal(snapshot.schemaVersion, 1, "Snapshot should use schemaVersion 1");
assert.equal(snapshot.source?.url, "https://op.gg/zh-cn/lol/modes/aram-mayhem", "Snapshot should cite OP.GG");
assert.equal(snapshot.tiers?.prismatic, "棱彩", "Prismatic tier should use 棱彩");
assert.ok(Array.isArray(snapshot.champions) && snapshot.champions.length >= 4, "Snapshot should contain champion records");
assert.doesNotMatch(JSON.stringify(snapshot), /棱镜/, "Snapshot should not use 棱镜");

const syncScript = readFileSync(syncScriptPath, "utf8");
assert.match(syncScript, /https:\/\/op\.gg\/zh-cn\/lol\/modes\/aram-mayhem/, "Sync script should fetch OP.GG ARAM Mayhem");
assert.match(syncScript, /--validate-only/, "Sync script should support validate-only mode");
assert.match(syncScript, /writeFileSync\(tempPath/, "Sync script should write through a temp file before replacing data");

const workflow = readFileSync(workflowPath, "utf8");
assert.match(workflow, /schedule:/, "Workflow should be scheduled");
assert.match(workflow, /workflow_dispatch:/, "Workflow should support manual runs");
assert.match(workflow, /sync-aram-mayhem-data\.mjs/, "Workflow should run the sync script");
assert.match(workflow, /contents: write/, "Workflow should be allowed to commit data updates");

const page = readFileSync(pagePath, "utf8");
assert.match(page, /\/data\/aram-mayhem\.json/, "Tool page should load the public JSON snapshot");
assert.match(page, /aramMayhemFallbackData/, "Tool page should keep a typed fallback dataset");

const validate = spawnSync(process.execPath, [syncScriptPath, "--validate-only"], {
  encoding: "utf8",
});
assert.equal(validate.status, 0, validate.stderr || validate.stdout);
