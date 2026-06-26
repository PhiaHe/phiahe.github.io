import { existsSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";

const app = readFileSync("src/App.tsx", "utf8");
const siteData = readFileSync("src/data/siteData.ts", "utf8");
const aramPage = readFileSync("src/components/tools/AramMayhemPage.tsx", "utf8");
const aramData = readFileSync("src/data/aramMayhemData.ts", "utf8");
const toolsSection = readFileSync("src/components/ToolsSection.tsx", "utf8");

assert.match(app, /#\/tools\/aram-mayhem/, "App should route #/tools/aram-mayhem to the ARAM Mayhem tool");
assert.match(app, /<ToolsSection \/>/, "Homepage should render a Tools section");
assert.match(siteData, /href: "#tools"/, "Home nav should include Tools");
assert.match(siteData, /href: "#\/tools\/aram-mayhem"/, "Tools card should link to the ARAM Mayhem route");

assert.match(toolsSection, /id="tools"/, "Tools section should have a stable #tools id");
assert.match(aramPage, /Data source|数据来源/, "Tool page should show source attribution");
assert.match(aramPage, /OP\.GG/, "Tool page should cite OP.GG");
assert.match(aramPage, /银色/, "Tool page should render silver tier text");
assert.match(aramPage, /黄金/, "Tool page should render gold tier text");
assert.match(aramPage, /棱彩/, "Tool page should render prismatic tier text as 棱彩");
assert.doesNotMatch(`${siteData}\n${aramPage}\n${aramData}`, /棱镜/, "ARAM Mayhem feature should not use 棱镜");

for (const champion of ["Ashe", "Ezreal", "Lux", "Malphite"]) {
  assert.match(aramData, new RegExp(champion), `Sample data should include ${champion}`);
}

for (const file of [
  "public/assets/tools/aram-mayhem/tool-aram-mayhem-cover.jpg",
  "public/assets/tools/aram-mayhem/tool-aram-mayhem-hero.jpg",
]) {
  assert.equal(existsSync(file), true, `${file} should exist`);
}
