import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const projectData = readFileSync("src/data/projectData.ts", "utf8");
const gallery = projectData.slice(projectData.indexOf("  gallery: ["), projectData.lastIndexOf("  statusTitle:"));
const projectGallery = readFileSync("src/components/project/ProjectGallery.tsx", "utf8");

for (const file of [
  "hero-concept.jpg",
  "hero-map.jpg",
  "character-cyber-fox.png",
  "enemy-bai-hu-wu-zhe.png",
  "skill-shushan-sword-tomb.png",
  "field-wudang-taiji.png",
]) {
  assert.match(gallery, new RegExp(file), `Gallery should include ${file}`);
}

assert.equal(/card-[a-z-]+\.png/.test(gallery), false, "Gallery should not show partial sect-card samples");
assert.equal(/skill cards/i.test(projectGallery), false, "Gallery copy should not describe removed card samples");
assert.equal(/boss art/i.test(projectGallery), false, "Gallery copy should not describe enemy sprites as boss art");
