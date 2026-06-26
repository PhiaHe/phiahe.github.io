import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const detailPage = readFileSync("src/components/project/ProjectDetailPage.tsx", "utf8");
const hero = readFileSync("src/components/project/ProjectHero.tsx", "utf8");
const stats = readFileSync("src/components/project/ProjectStats.tsx", "utf8");

assert.equal(
  /import\s+ProjectStats\s+from/.test(detailPage),
  false,
  "ProjectDetailPage should not import ProjectStats directly"
);
assert.equal(
  /<ProjectStats\b/.test(detailPage),
  false,
  "ProjectDetailPage should not render a standalone ProjectStats section"
);
assert.equal(
  /import\s+ProjectStats\s+from\s+["']\.\/ProjectStats["']/.test(hero),
  true,
  "ProjectHero should own the project stats"
);
assert.equal(
  /<ProjectStats\s+stats=\{project\.stats\}\s+variant=["']compact["']\s*\/>/.test(hero),
  true,
  "ProjectHero should render compact stats below the hero CTAs"
);
assert.equal(
  /variant\?:\s*["']compact["']/.test(stats),
  true,
  "ProjectStats should support a compact variant for hero usage"
);
