# Inkvoker Project Page Design

Date: 2026-06-26
Project: Phia Games website
Page: Inkvoker project detail

## Summary

Add a dedicated project detail page for **Inkvoker · 墨唤**. The page should turn the existing homepage Work card into a real destination instead of a dead-end showcase card.

The first version follows the **Product Showcase** direction: clear game pitch, concrete systems, representative visuals, current development status, and a private-development-safe call to action. It should feel like a polished project page, not a marketing landing page and not a raw README dump.

## Goals

- Make the homepage Inkvoker card clickable and useful.
- Present Inkvoker as a real game prototype with enough depth for visitors to understand what it is.
- Reuse the existing Phia Games visual system: dark sci-fi surfaces, liquid energy, glass panels, spotlight cards, bilingual content, and restrained motion.
- Use real local project material for credibility: README facts, project stats, card art, character art, map/ground textures, and VFX-related imagery.
- Use generated concept visuals only as packaging and visual studies, clearly distinct from real screenshots.
- Avoid exposing a private GitHub repository as a public primary CTA.

## Non-Goals

- Do not build the interactive experiment page in this first pass.
- Do not present generated concept art as in-game screenshots.
- Do not add a routing library unless the existing site structure makes it necessary.
- Do not try to mirror every README detail or all 64 skills on the first page.
- Do not expose the private GitHub repository as a prominent public link while it remains private.

## Source Material

Inkvoker local project path used for design discovery:

- `I:\Inkvoker`

Primary content sources:

- `README.md`: gameplay pitch, system list, tech stack, v0.6 status.
- `docs/PROJECT_SNAPSHOT_FOR_AI.md`: high-level game overview, player loop, implemented systems.
- `游戏规划设计文档.md`: headings and scope for skills, synergies, reactions, art assets, story waves.
- `assets/`: cards, characters, enemies, maps, skill/VFX images.
- `project.godot`: Godot 4.6, main scene, autoload/system surface.

The public project title should be:

- `Inkvoker · 墨唤`

The README currently uses a different Chinese subtitle. The website should use `墨唤` per user direction.

## Page Route

Use a lightweight static route that is safe for GitHub Pages:

- `#/projects/inkvoker`

This avoids refresh-time 404s without adding router dependencies. The existing app can branch based on `window.location.hash` or a tiny local hash-route helper.

Homepage behavior:

- The Inkvoker Work card links to `#/projects/inkvoker`.
- Other Work cards can remain non-detail cards for now, or link to placeholder anchors only if the existing behavior already does that.
- The detail page includes a clear `Back to Work` action returning to `/#work` or `#work` based on the final hash approach.

## Page Structure

### 1. Hero

Purpose: give a strong first impression and explain the game in one breath.

Content:

- Title: `Inkvoker · 墨唤`
- Kicker: `Private Development / v0.6 Prototype`
- Short pitch:
  - EN: Chinese martial-arts roguelike deckbuilding auto-battle prototype.
  - ZH: 国风武侠 Roguelike 自动战斗 + 牌组构筑原型。
- Supporting copy:
  - Players move, dodge, and shape the battlefield while the Album auto-casts skill cards.
  - Between waves, players build through cards, awakenings, synergies, artifacts, and meta progression.

CTA handling:

- Primary: `Explore Systems` scrolls to the core systems section.
- Secondary: `Back to Work`.
- Do not show `View on GitHub` while `https://github.com/PhiaHe/Inkvoker` is private.

Visual:

- Use generated hero concept art as `Concept Visual`, not a screenshot.
- Direction: martial-arts technique cards, ink formation, elemental energy, dark sci-fi edge lighting.
- Avoid repeated humanoid portrait cards. Cards should show martial arts moves: sword arrays, talismans, palm strikes, yin-yang sword aura, poison darts, ice fields, golden bell shields, and ink lotus bursts.
- Avoid readable generated text on cards.

### 2. Key Stats

Purpose: immediately prove depth.

Stats:

- `64` Skills
- `8` Sects
- `15` Reactions
- `35` Story Waves

Optional additional stat if space allows:

- `v0.6` Prototype

### 3. Core Loop

Purpose: make the game understandable to a non-developer visitor.

Four-step loop:

1. Album auto-casts skill cards on rhythm.
2. Player moves, dodges, herds enemies, and positions AOE.
3. Element reactions and sect synergies transform the battlefield.
4. Between waves, shop choices shape the next build.

This section should be compact and visual. Use a horizontal flow on desktop and a vertical stack on mobile.

### 4. Feature Grid

Purpose: translate README depth into readable site modules.

Feature cards:

- Skill Cards: 8 sects x 8 skills, 1-5 cost curve, star awakenings.
- Element Reactions: fire, water, thunder, wind, dark, light with 15 pair reactions.
- Three-Dimensional Synergies: element, sect, and move-type synergy tracks.
- Artifacts: altar choices and run-shaping global modifiers.
- Meta Progression: sutra library / long-term talent growth.
- Story + Endless: 35-wave story mode with endless continuation.

Each card should be short and scannable, with optional tags rather than long paragraphs.

### 5. Visual Gallery

Purpose: show actual project substance.

Use a curated mix of real assets and concept visuals:

- Real card art from `assets/cardpic/...`.
- Real character or enemy art from `assets/characters/...` and `assets/enemy/...`.
- Real map or ground texture from `assets/map_max.png`, `assets/ink_ground.png`, or `assets/maps/...`.
- Generated concept art only as a labeled packaging/visual-study asset.

Recommended first-pass asset count:

- 1 generated hero concept image.
- 8 representative card images, one per sect where possible.
- 2-4 supporting real visuals such as character, enemy, map, or VFX.

All page-consumed assets should be copied into:

- `public/assets/projects/inkvoker/`

Do not reference `I:\Inkvoker` directly from site code.

### 6. Development Status

Purpose: be transparent without underselling the project.

Content:

- Status badge: `Private Development`
- Version badge: `v0.6 Prototype`
- Implemented highlights:
  - 64 skill behaviors and visuals implemented.
  - 8 sect talent architectures implemented.
  - Story mode 35 waves and endless choice loop.
  - Economy smoothing, spawn/combat-feel refactor, PRNG shop safeguards, audio concurrency protection.
- GitHub repository:
  - Store the URL internally as `https://github.com/PhiaHe/Inkvoker` if useful.
  - Do not expose it as a public CTA while private.

### 7. Closing CTA

Purpose: keep visitor flow moving.

Actions:

- `Back to Work`
- `Contact Phia`

Optional copy:

- EN: More project notes and public builds will be shared as the prototype opens up.
- ZH: 原型公开后会继续补充更多项目笔记和可试玩版本。

## Generated Image Use

Generated images may be used for:

- Hero key art.
- Concept Visuals.
- Visual Studies.
- Future interactive teaser artwork.

Generated images must not be labeled as:

- Screenshot.
- Gameplay capture.
- In-engine render.

Accepted style direction:

- Martial-arts technique cards rather than repeated character portraits.
- Ink-wash battlefield and magic formation.
- Dark sci-fi/holographic edge treatment matching the Phia site.
- Cyan, violet, silver, restrained gold, and small elemental accents.
- No readable text or pseudo-text inside generated card faces.

## Localization

The project page must support the existing EN / ZH language toggle.

Localized content:

- Page title support text, pitch, status badges, stat labels, loop titles, loop descriptions, feature cards, gallery labels, image alt text, and CTAs.
- Chinese project title: `Inkvoker · 墨唤`.
- Chinese copy should be written as natural site copy, not machine-translated README prose.

Shared non-localized content:

- Brand/project name `Inkvoker`.
- Stable technical names such as `Godot`, `Roguelike`, `v0.6`, and numeric stats.
- Asset paths and IDs.

Generated concept images should avoid embedded text so they do not need separate localized image versions.

## Data Model

Add a project-detail data structure, either in `src/data/siteData.ts` if small or in a new `src/data/projectData.ts` if the page content becomes large.

Suggested shape:

```ts
export interface ProjectDetail {
  id: string;
  slug: string;
  title: string;
  subtitle: Localized;
  status: Localized;
  pitch: Localized;
  stats: Array<{ value: string; label: Localized }>;
  loop: Array<{ title: Localized; body: Localized }>;
  features: Array<{ title: Localized; body: Localized; tags?: Localized[] }>;
  gallery: Array<{
    src: string;
    alt: Localized;
    label: Localized;
    kind: "real-asset" | "concept-visual";
  }>;
}
```

The page should keep bilingual support. EN and ZH copy should both be available from the data layer.

## Components

New or updated components:

- `ProjectDetailPage`: page-level composition for `#/projects/inkvoker`.
- `ProjectHero`: title, status badges, concept image, primary/secondary actions.
- `ProjectStats`: fixed stat strip.
- `CoreLoop`: four-step loop section.
- `ProjectFeatureGrid`: reusable feature cards.
- `ProjectGallery`: real asset and concept visual gallery with labels.
- `ProjectStatus`: v0.6/private-development status.

Reuse existing components where possible:

- `Navbar`
- `ContactFooter`
- `SpotlightCard`
- `Reveal`
- `SectionHeading`
- `SectionDivider`
- `BrandLogo`
- existing language context helpers

## Routing and Navigation Behavior

Implement a small hash-route mechanism:

- Default route renders the current homepage.
- `#/projects/inkvoker` renders the project page.
- Navbar brand click returns to the homepage top.
- Project page `Back to Work` returns to the homepage work section.

Hash changes should update the rendered page without a full reload.

## Accessibility

- All gallery images need meaningful localized alt text.
- Generated concept images should be labeled as concept visuals.
- Buttons and links should have clear accessible text.
- Motion should continue honoring `prefers-reduced-motion`.
- The project page should not rely on hover-only interactions for essential content.

## Performance

- Copy only a small curated set of assets into the website.
- Prefer web-friendly formats if practical.
- Avoid shipping very large original PNGs unchanged when a reduced version is sufficient.
- Keep the generated hero image optimized for a website hero.
- Preserve the static build model: no backend, no runtime dependency on the Inkvoker local folder, no runtime GitHub API calls.

## Testing

Run:

- TypeScript/build check via the existing build command.
- Local dev or preview server.

Manual checks:

- Homepage still renders.
- Inkvoker card opens `#/projects/inkvoker`.
- Project page loads directly via hash URL.
- Back to Work returns to the homepage Work section.
- Language toggle works on the project page.
- Images load from `public/assets/projects/inkvoker/`.
- Mobile layout has no overlapping text or broken gallery.
- Generated concept art is not labeled as gameplay or screenshot.

## Implementation Plan Entry Point

After this design is approved, create a separate implementation plan before editing website code. The plan should cover:

1. Asset selection and optimization.
2. Data model additions.
3. Hash routing.
4. Project page components.
5. Homepage Work card link behavior.
6. Build and browser verification.
