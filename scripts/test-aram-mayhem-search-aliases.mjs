import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const dataPath = "public/data/aram-mayhem.json";
const aliasesPath = "src/data/aramMayhemAliases.ts";
const searchPath = "src/data/aramMayhemSearch.ts";
const outDir = "tmp/test-aram-mayhem-search-aliases";

function compileTsModule(sourcePath, outFile) {
  const source = readFileSync(sourcePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: sourcePath,
  }).outputText;

  const rewritten = transpiled.replaceAll(
    /from\s+["']\.\/aramMayhemAliases["']/g,
    'from "./aramMayhemAliases.mjs"',
  );
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, rewritten, "utf8");
}

async function loadSearchModule() {
  assert.equal(existsSync(aliasesPath), true, `${aliasesPath} should define champion aliases`);
  assert.equal(existsSync(searchPath), true, `${searchPath} should define reusable search helpers`);

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  compileTsModule(aliasesPath, `${outDir}/aramMayhemAliases.mjs`);
  compileTsModule(searchPath, `${outDir}/aramMayhemSearch.mjs`);

  const aliases = await import(pathToFileURL(resolve(`${outDir}/aramMayhemAliases.mjs`)).href);
  const search = await import(pathToFileURL(resolve(`${outDir}/aramMayhemSearch.mjs`)).href);
  return { aliases, search };
}

const snapshot = JSON.parse(readFileSync(dataPath, "utf8"));
const champions = snapshot.champions;
const expectedQueries = [
  ["寒冰", "ashe"],
  ["EZ", "ezreal"],
  ["ez", "ezreal"],
  ["光辉", "lux"],
  ["石头人", "malphite"],
  ["火男", "brand"],
  ["VN", "vayne"],
  ["vn", "vayne"],
  ["瞎子", "leesin"],
  ["盲僧", "leesin"],
  ["狐狸", "ahri"],
  ["快乐风男", "yasuo"],
  ["风男", "yasuo"],
  ["剑圣", "masteryi"],
  ["德玛", "garen"],
  ["诺手", "darius"],
  ["狗头", "nasus"],
  ["女枪", "missfortune"],
  ["MF", "missfortune"],
  ["男枪", "graves"],
  ["小炮", "tristana"],
  ["飞机", "corki"],
  ["船长", "gangplank"],
  ["寡妇", "evelynn"],
  ["老鼠", "twitch"],
  ["大嘴", "kogmaw"],
  ["蛇女", "cassiopeia"],
  ["风女", "janna"],
  ["日女", "leona"],
  ["牛头", "alistar"],
  ["机器人", "blitzcrank"],
  ["泰坦", "nautilus"],
  ["发条", "orianna"],
  ["沙皇", "azir"],
  ["龙王", "aurelionsol"],
  ["卡牌", "twistedfate"],
  ["TF", "twistedfate"],
  ["妖姬", "leblanc"],
  ["冰女", "lissandra"],
  ["猪妹", "sejuani"],
  ["豹女", "nidalee"],
  ["蜘蛛", "elise"],
  ["狮子狗", "rengar"],
  ["螳螂", "khazix"],
  ["男刀", "talon"],
  ["女警", "caitlyn"],
  ["轮子妈", "sivir"],
  ["滑板鞋", "kalista"],
  ["卡莎", "kaisa"],
  ["卡沙", "kaisa"],
  ["腕豪", "sett"],
  ["铁男", "mordekaiser"],
  ["猫咪", "yuumi"],
];

console.log("ARAM Mayhem alias search tests");

const { aliases, search } = await loadSearchModule();
const { ARAM_CHAMPION_ALIASES } = aliases;
const { normalizeChampionSearchText, searchAramMayhemChampions } = search;
const championKeys = new Set(champions.map((champion) => champion.key));

for (const key of Object.keys(ARAM_CHAMPION_ALIASES)) {
  assert.equal(championKeys.has(key), true, `${key} should exist in ${dataPath}`);
}

assert.equal(normalizeChampionSearchText(" Kai'Sa "), "kaisa", "normalization should remove apostrophes");
assert.equal(normalizeChampionSearchText("Lee Sin"), "leesin", "normalization should remove spaces");
assert.equal(normalizeChampionSearchText("奥瑞利安·索尔"), "奥瑞利安索尔", "normalization should remove middle dots");

const defaultResults = searchAramMayhemChampions(champions, "");
assert.deepEqual(
  defaultResults.slice(0, 10).map((champion) => champion.key),
  champions.slice(0, 10).map((champion) => champion.key),
  "empty search should preserve the live ranking order",
);

for (const [query, expectedKey] of expectedQueries) {
  const [first] = searchAramMayhemChampions(champions, query);
  assert.equal(first?.key, expectedKey, `${query} should rank ${expectedKey} first`);
}

console.log(`\nAll ${expectedQueries.length} ARAM Mayhem alias query checks passed.`);
