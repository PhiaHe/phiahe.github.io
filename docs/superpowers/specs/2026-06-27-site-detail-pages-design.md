# Phia Games Site Detail Pages Design

Date: 2026-06-27

## 1. Goal

Fill out the site so every homepage card can open a meaningful detail page.

Current public site already has the Inkvoker detail page at `#/projects/inkvoker`. This design extends the same hash-route approach to the rest of the homepage cards:

- Featured Work cards
- Visual Lab cards
- Dev Log cards

The implementation should make the site feel like a complete portfolio archive rather than a homepage with placeholder tiles. It should not redesign the existing homepage, Inkvoker page, shader background, typography system, or global visual language.

## 2. Non-Goals

- Do not introduce React Router.
- Do not change DNS, GitHub Pages settings, or deployment workflow.
- Do not redesign the homepage layout.
- Do not remove or rewrite the existing Inkvoker custom page.
- Do not turn every page into a marketing landing page.
- Do not use empty placeholder pages such as "coming soon" as the final state.

## 3. Existing Context

Relevant source files:

- `src/data/siteData.ts`
- `src/data/projectData.ts`
- `src/App.tsx`
- `src/components/FeaturedWorkSection.tsx`
- `src/components/VisualLabSection.tsx`
- `src/components/DevLogSection.tsx`
- `src/components/WorkCard.tsx`
- `src/components/project/*`

Current detail route:

- `#/projects/inkvoker`

Current homepage cards:

Featured Work:

- `Inkvoker`
- `Visual Experiments`
- `Pixel Character Lab`

Visual Lab:

- `Pixel Characters`
- `Fluid / Sci-fi Effects`
- `Game UI Experiments`
- `Prompt-based Asset Design`
- `Game VFX`
- `Concept Placeholders`

Dev Log:

- `An AI-assisted game development workflow`
- `Visual feedback and combat readability`
- `Pixel character iteration`
- `Prompt engineering for game assets`
- `Prototype validation and design notes`

## 4. Recommended Architecture

Use three reusable detail page families plus the existing custom Inkvoker page.

### 4.1 Existing Custom Project Page

Keep:

- `#/projects/inkvoker`
- Existing Inkvoker project components
- Existing project nav behavior

Do not force Inkvoker into a generic template.

### 4.2 Generic Project Detail Page

For Featured Work cards that represent larger bodies of work:

- `#/projects/visual-experiments`
- `#/projects/pixel-character-lab`

Recommended sections:

- Overview
- Focus Areas
- Process
- Selected Assets
- Current Status

### 4.3 Lab Detail Page

For Visual Lab cards that represent visual research topics:

- `#/lab/pixel-characters`
- `#/lab/fluid-effects`
- `#/lab/game-ui`
- `#/lab/prompt-assets`
- `#/lab/game-vfx`
- `#/lab/world-concepts`

Recommended sections:

- Overview
- Studies
- Asset Board
- Notes
- Related Work

### 4.4 Article Detail Page

For Dev Log cards:

- `#/notes/ai-workflow`
- `#/notes/combat-readability`
- `#/notes/pixel-iteration`
- `#/notes/prompt-engineering`
- `#/notes/prototype-validation`

Recommended sections:

- Article Header
- Article Body
- Key Takeaways
- Related Links

## 5. Route Map

### Featured Work

| Card | Route | Page Type |
| --- | --- | --- |
| Inkvoker | `#/projects/inkvoker` | Existing custom project page |
| Visual Experiments | `#/projects/visual-experiments` | Generic project detail |
| Pixel Character Lab | `#/projects/pixel-character-lab` | Generic project detail |

### Visual Lab

| Card | Route | Page Type |
| --- | --- | --- |
| Pixel Characters | `#/lab/pixel-characters` | Lab detail |
| Fluid / Sci-fi Effects | `#/lab/fluid-effects` | Lab detail |
| Game UI Experiments | `#/lab/game-ui` | Lab detail |
| Prompt-based Asset Design | `#/lab/prompt-assets` | Lab detail |
| Game VFX | `#/lab/game-vfx` | Lab detail |
| Concept Placeholders | `#/lab/world-concepts` | Lab detail |

`Concept Placeholders` should be renamed to `World Concepts / 世界概念` before launch. The current name is useful for internal scaffolding, but it reads unfinished to visitors.

### Dev Log

| Card | Route | Page Type |
| --- | --- | --- |
| AI-assisted game development workflow | `#/notes/ai-workflow` | Article detail |
| Visual feedback and combat readability | `#/notes/combat-readability` | Article detail |
| Pixel character iteration | `#/notes/pixel-iteration` | Article detail |
| Prompt engineering for game assets | `#/notes/prompt-engineering` | Article detail |
| Prototype validation and design notes | `#/notes/prototype-validation` | Article detail |

## 6. Page Content Plan

### 6.1 Visual Experiments

Purpose:

Present the site's broader visual research as a curated archive, not as a random image gallery.

Suggested content:

- Hero: a polished visual systems board
- Overview: why visual experiments exist in the Phia Games workflow
- Focus Areas:
  - concept art
  - UI mood
  - shader / liquid surface
  - sprite and VFX studies
- Process:
  - brief
  - generation or sketch
  - curation
  - cleanup
  - production use
- Selected Assets: 6-8 tiles from the visual archive
- Status: ongoing archive

Tone:

Quiet, organized, studio-archive style.

### 6.2 Pixel Character Lab

Purpose:

Present pixel characters as a reusable production discipline: silhouettes, animation sheets, movement states, and game readability.

Suggested content:

- Hero: pixel character sheet collage
- Overview: character readability and movement clarity
- Anatomy:
  - silhouette
  - palette
  - facing direction
  - action states
- Asset Board:
  - player sheet
  - enemy sheet
  - idle / move / attack frames
- Process Notes:
  - how rough concepts become sprite sheets
  - how animation states are prepared for game use
- Status: active asset track

Recommended source material:

- Use existing Inkvoker sprite sheets first.
- Add non-Inkvoker sprite work later if the user provides it.

### 6.3 Pixel Characters

Purpose:

Narrow Visual Lab topic page focused only on character pixel art.

Suggested content:

- Overview: why character silhouettes matter
- Study Board:
  - player sprite sheet
  - enemy sprite sheet
  - scale comparison
  - motion readability
- Notes:
  - top-down and semi-top-down constraints
  - frame economy
  - color contrast
- Related:
  - Pixel Character Lab
  - Inkvoker Visual Archive

Difference from Pixel Character Lab:

Pixel Character Lab is a project-like work page. Pixel Characters is a focused visual research page.

### 6.4 Fluid / Sci-fi Effects

Purpose:

Explain the liquid-energy and sci-fi surface direction used across the site.

Suggested content:

- Hero: motion-liquid inspired still
- Study Board:
  - liquid glow
  - aurora surface
  - holographic field
  - ink / energy blend
- Technical Notes:
  - shader-driven backgrounds
  - performance-aware resolution scaling
  - color palette control
- Related:
  - homepage motion liquid background
  - Inkvoker concept visuals

### 6.5 Game UI Experiments

Purpose:

Show UI exploration for game interfaces, HUDs, cards, and readable control surfaces.

Suggested content:

- Hero: compact UI board
- Studies:
  - HUD surfaces
  - card frames
  - resource counters
  - modal / panel mood
- Design Notes:
  - information density
  - hover and active states
  - readability over decoration
- Related:
  - Prompt-based Asset Design
  - Visual Experiments

### 6.6 Prompt-based Asset Design

Purpose:

Show the user's AI-assisted asset workflow as a repeatable production method.

Suggested content:

- Hero: before / after asset pipeline board
- Workflow:
  - brief
  - prompt
  - generation
  - cleanup
  - crop / compression
  - site or game integration
- Case Study:
  - Inkvoker hero concept image replacement
  - card cover crop variant
  - transparent-background VFX cleanup
- Notes:
  - choosing usable outputs
  - avoiding style drift
  - when to regenerate vs locally edit

### 6.7 Game VFX

Purpose:

Show how skill effects and combat feedback are collected and evaluated.

Suggested content:

- Hero: skill VFX collage
- Studies:
  - sword array
  - taiji field
  - impact glow
  - element burst
- Design Notes:
  - center readability
  - transparent background cleanup
  - effect scale in cards vs gameplay
- Related:
  - Inkvoker Visual Archive
  - Combat Readability note

### 6.8 World Concepts

Purpose:

Replace "Concept Placeholders" with a real worldbuilding concept board.

Suggested content:

- Hero: world concept mood board
- Concept Tracks:
  - martial fantasy
  - sci-fi surfaces
  - pixel worlds
  - interface worlds
- Notes:
  - early directions
  - not-yet-production concepts
  - what would make a concept graduate into a project
- Status: exploratory

### 6.9 AI-assisted Game Development Workflow

Purpose:

Explain how AI tools fit into the user's game development loop.

Suggested article outline:

- Why use AI in a small creative game workflow
- From brief to playable prototype
- Where generation helps
- Where human judgment remains essential
- How assets move into production
- Lessons from Inkvoker and the website build

### 6.10 Visual Feedback and Combat Readability

Purpose:

Explain how combat visuals stay readable.

Suggested article outline:

- Visual feedback is not just more effects
- Timing, color, scale, and contrast
- Avoiding VFX noise
- Reading skill effects at thumbnail and gameplay scale
- Inkvoker examples: skill VFX, combo fields, battlefield map

### 6.11 Pixel Character Iteration

Purpose:

Document the practical path from sprite idea to usable animation sheet.

Suggested article outline:

- Starting from silhouette
- Building action states
- Direction and scale constraints
- Cleaning sheets for implementation
- What to inspect before using a sprite in-game

### 6.12 Prompt Engineering for Game Assets

Purpose:

Show prompt writing as production craft rather than novelty.

Suggested article outline:

- Start with asset purpose, not image style
- Lock composition and usage context
- Generate variants, then curate
- Local cleanup and crop decisions
- Maintaining consistency across a project

### 6.13 Prototype Validation and Design Notes

Purpose:

Explain how prototypes are judged after they become playable.

Suggested article outline:

- What a prototype needs to prove
- Playability before polish
- Keep / rebuild / remove decisions
- Reading player friction
- Turning test notes into next build tasks

## 7. Data Model Proposal

Add structured detail data instead of hardcoding every page in components.

Suggested files:

- `src/data/detailPages.ts`
- `src/components/detail/GenericProjectPage.tsx`
- `src/components/detail/LabDetailPage.tsx`
- `src/components/detail/ArticlePage.tsx`

Suggested data types:

```ts
type DetailPageKind = "project" | "lab" | "article";

interface DetailPage {
  id: string;
  route: string;
  kind: DetailPageKind;
  title: Localized;
  kicker: Localized;
  summary: Localized;
  heroImage: ImageAsset;
  sections: DetailSection[];
  related?: RelatedLink[];
}
```

Use the same `Localized` shape as `siteData.ts`.

Keep Inkvoker in `projectData.ts` for now because it is more detailed and already custom.

## 8. Navigation Behavior

Detail pages should not reuse the homepage nav blindly.

Recommended nav behavior:

- Homepage: keep current nav.
- Inkvoker project page: keep current project nav.
- Generic project pages:
  - Overview
  - Process
  - Assets
  - Status
  - Back to Work
- Lab pages:
  - Overview
  - Studies
  - Assets
  - Notes
  - Back to Lab
- Article pages:
  - Article
  - Takeaways
  - Related
  - Back to Dev Log

Use `scrollIntoView` for same-page section navigation. Do not mutate `window.location.hash` for in-page detail navigation in a way that accidentally returns visitors to the homepage.

## 9. Card Link Behavior

All cards should become clickable:

- Featured Work: link through `href` on `FeaturedWork`
- Visual Lab: add `href` to `LabCategory`
- Dev Log: add `href` to `DevLogEntry`

The whole card should be clickable when appropriate, matching existing `WorkCard` behavior.

Use accessible labels:

- Work cards: `"<title> project details"`
- Lab cards: `"<title> lab details"`
- Dev Log cards: `"<title> article"`

## 10. Image Asset Plan

The user wants Codex to provide images for each card/page.

Recommended image deliverables:

### Featured Work

- `work-visual-experiments-cover.jpg`
- `work-pixel-character-lab-cover.jpg`
- `project-visual-experiments-hero.jpg`
- `project-pixel-character-lab-hero.jpg`

### Visual Lab

- `lab-pixel-characters-cover.jpg`
- `lab-fluid-effects-cover.jpg`
- `lab-game-ui-cover.jpg`
- `lab-prompt-assets-cover.jpg`
- `lab-game-vfx-cover.jpg`
- `lab-world-concepts-cover.jpg`
- Optional hero variants for each lab page if cover crops are not strong enough at hero scale.

### Dev Log

- `note-ai-workflow-cover.jpg`
- `note-combat-readability-cover.jpg`
- `note-pixel-iteration-cover.jpg`
- `note-prompt-engineering-cover.jpg`
- `note-prototype-validation-cover.jpg`

Recommended image style:

- Use the current Phia Games visual language.
- Avoid generic stock art.
- Use project-specific materials where possible.
- For technical/article cards, use editorial boards or production-desk compositions rather than abstract gradients.
- Keep card images readable at small sizes.

Recommended asset folder:

- `public/assets/detail-pages/`

For homepage card covers, prefer 16:10 crops because current homepage cards use `aspect-[16/10]`.

For detail page heroes, prefer 16:9 or 16:10 depending on template layout.

## 11. Content Quality Rules

Every detail page should include real content, even if the underlying project is exploratory.

Minimum content per generic project page:

- Hero visual
- 1 overview block
- 3-4 focus/process cards
- 4-8 asset tiles or study tiles
- 1 status block
- links back to relevant homepage section

Minimum content per lab page:

- Hero visual
- 1 overview block
- 4-6 study tiles
- 2-4 notes
- related links

Minimum content per article page:

- Header
- 4-6 article sections
- 3 key takeaways
- related links

## 12. Bilingual Requirements

All visible strings should support English and Chinese through the existing `Localized` pattern.

Do not add English-only detail pages.

For implementation, write English and Chinese text together in data files. Keep article text concise enough that layout remains stable in both languages.

## 13. Testing Plan

Add focused tests similar to the existing scripts:

- Every homepage Featured Work card with `href` has a matching route.
- Every Visual Lab card has a matching route.
- Every Dev Log card has a matching route.
- Every detail page has:
  - title
  - summary
  - hero image
  - at least one content section
  - bilingual strings
- Every referenced image exists under `public/assets`.
- Inkvoker route still resolves to the existing custom page.
- Hash route handling still works without React Router.

Run before completion:

```bash
npm run lint
npm run build
```

Recommended manual checks:

- Homepage card click opens the expected detail page.
- Back links return to the correct homepage section.
- Mobile menu shows context-appropriate navigation.
- English/Chinese switching works on all new pages.
- Images do not overflow or crop important content badly.

## 14. Implementation Order for Claude

Recommended sequence:

1. Add data types and detail page data.
2. Add generic route resolution in `App.tsx` while preserving Inkvoker route.
3. Add generic project, lab, and article templates.
4. Add card `href` support to Visual Lab and Dev Log cards.
5. Add placeholder-safe image paths after Codex provides final assets.
6. Add tests for routes, card links, image existence, and bilingual content.
7. Run lint/build and browser smoke checks.

## 15. Open Questions for the User

1. Should `Concept Placeholders` be renamed to `World Concepts / 世界概念` as recommended?
2. Should Dev Log article pages be written in a personal first-person style or a neutral studio-note style?
3. Does the user have extra non-Inkvoker pixel character assets to include, or should the first pass use Inkvoker-derived sprites?
4. Should Codex generate all card images before Claude starts implementation, or should Claude implement using stable filenames first and Codex replace image files afterward?

