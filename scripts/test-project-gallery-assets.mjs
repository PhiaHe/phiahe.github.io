import { existsSync, readFileSync } from "node:fs";
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

const heroImage = projectData.slice(projectData.indexOf("  heroImage: {"), projectData.indexOf("  stats: ["));
assert.match(heroImage, /hero-concept-gemini\.jpg/, "Project hero should use the newer Gemini concept visual");
assert.doesNotMatch(heroImage, /hero-concept\.jpg/, "Project hero should no longer use the older ink concept visual");
assert.equal(
  existsSync("public/assets/projects/inkvoker/hero-concept-gemini.jpg"),
  true,
  "Newer Gemini concept visual should exist as a web-ready asset",
);

const firstGalleryItem = gallery.slice(gallery.indexOf("    {"), gallery.indexOf("    },") + "    },".length);
assert.match(firstGalleryItem, /hero-concept\.jpg/, "Gallery should keep the older ink concept visual as the first archive item");
assert.doesNotMatch(gallery, /hero-concept-gemini\.jpg/, "Gallery should not duplicate the project hero concept visual");

assert.equal(/card-[a-z-]+\.png/.test(gallery), false, "Gallery should not show partial sect-card samples");
assert.equal(/skill cards/i.test(projectGallery), false, "Gallery copy should not describe removed card samples");
assert.equal(/boss art/i.test(projectGallery), false, "Gallery copy should not describe enemy sprites as boss art");
