# Phia Games — Website (Claude / Cursor candidate)

> **Phia Games — AI-assisted game experiments, visual systems, and interactive worlds.**

A premium personal website for Phia Games, built as a dark sci-fi *creative game
lab* with subtle ink-like energy and fluid visual systems. Static, fast, and
ready for GitHub Pages.

This is the **Claude / Cursor visual candidate** — one of two competing local
website candidates. It does not touch any sibling candidate project.

---

## Tech stack

- **Vite** + **React 18** + **TypeScript**
- **Tailwind CSS** (custom dark sci-fi design system)
- **Framer Motion** (`useScroll`/`useTransform` for the cinematic pinned-scroll
  hero + restrained entrance motion)
- **Native WebGL** (raymarched-metaball fragment shader) for the hero liquid
  core — **no Three.js, zero new dependencies** — with a full Canvas 2D fallback
- **Procedural SVG placeholders** (no binary assets, no external image services)
- **Bilingual EN / 中文** with a lightweight context-based i18n layer

Everything is static — no backend, no database, no login.

---

## Quick start

```bash
# 1. install dependencies
npm install

# 2. start the dev server (http://localhost:5173)
npm run dev

# 3. production build → ./dist
npm run build

# 4. preview the production build locally
npm run preview
```

### Regenerate placeholder assets

The placeholder visuals are generated procedurally and committed to
`public/assets/placeholders/`. To regenerate them:

```bash
npm run gen:assets
```

---

## Project structure

```
phia-site-claude/
├─ index.html                  # metadata, fonts, OG tags
├─ scripts/
│  └─ generate-placeholders.mjs # procedural SVG placeholder generator
├─ public/
│  ├─ favicon.svg
│  └─ assets/placeholders/      # ← swap these for real art later
└─ src/
   ├─ main.tsx                  # React entry (wraps app in LanguageProvider)
   ├─ App.tsx                   # page composition + reduced-motion config
   ├─ index.css                 # design system (tokens, glass, holo, SpotlightCard)
   ├─ data/
   │  └─ siteData.ts            # ← ALL editable content (bilingual EN/ZH)
   ├─ i18n/
   │  └─ LanguageContext.tsx    # language provider + useLanguage()/t() helper
   ├─ hooks/
   │  ├─ useReducedMotion.ts
   │  └─ useIsMobile.ts
   └─ components/
      ├─ GlobalLiquidScene.tsx  # GLOBAL fixed WebGL liquid layer (+ Canvas2D fallback), scroll-driven across the narrative zone
      ├─ Logo.tsx               # Phia Games SVG sigil — swap target for a future logo
      ├─ SpotlightCard.tsx      # unified card: spotlight + border-light + inner glow + energy texture + tilt
      ├─ LanguageToggle.tsx     # EN / 中 switch
      ├─ Navbar.tsx
      ├─ Hero.tsx               # transparent pinned text stage over the global liquid
      ├─ FeaturedWorkSection.tsx / WorkCard.tsx
      ├─ VisualLabSection.tsx
      ├─ DevLogSection.tsx
      ├─ AboutSection.tsx
      ├─ ContactFooter.tsx
      ├─ SectionHeading.tsx
      ├─ SectionDivider.tsx
      └─ Reveal.tsx             # scroll-reveal wrapper

   lib/
      ├─ gl.ts                  # tiny dependency-free WebGL program helper
      └─ liquidShader.ts        # the global liquid GLSL fragment shader
```

---

## Language (EN / 中文)

The site ships **bilingual**, defaulting to **English**. The EN / 中 toggle in
the navbar switches the active language and persists the choice in
`localStorage` (and updates `<html lang>`).

All copy lives as `{ en, zh }` pairs in
[`src/data/siteData.ts`](src/data/siteData.ts). To edit text, change the matching
`en` / `zh` strings. Technical tags (e.g. `Godot`, `Pixel Art`) are intentionally
kept in English in both languages. To add a third language, extend the `Lang`
type and add the new key to every localized value.

---

## Editing content

**All copy, tags, links, and section items live in
[`src/data/siteData.ts`](src/data/siteData.ts).** You rarely need to touch the
components. From there you can edit:

- `site` — brand name, domain, GitHub, email
- `hero` — title, subtitle, intro, CTA labels, interface readouts
- `featuredWork` — the three project cards (Inkvoker, Visual Experiments, Pixel Lab)
- `labCategories` — the Visual Lab tiles
- `devLog` — the dev-log article cards
- `about` — the about statement + pillars
- `contact` — closing line + social links

### Replacing placeholder visuals

Placeholders live in `public/assets/placeholders/` and are referenced by the
`cover` fields in `siteData.ts`.

- **Easiest:** drop a real image into that folder using the **same filename**
  (e.g. replace `work-inkvoker.svg`). It just works.
- **Or:** add a new image (PNG/JPG/WebP/SVG) anywhere under `public/` and point
  the relevant `cover` path at it in `siteData.ts`.

The hero background is a live canvas effect (`FluidBackground.tsx`), not an
image — adjust its palette/behavior there if desired.

---

## Design direction (summary)

- **Sci-fi first, ink-energy second.** Deep blue-black surfaces, low-saturation
  cyan / violet / silver with a restrained gold accent. Aurora-like fluid
  gradients and faint ink ribbons — never a traditional ink-painting look.
- **A global liquid visual system.** The liquid sculpture is NOT a hero-only
  widget — `GlobalLiquidScene` is a single fixed, full-viewport WebGL layer
  (above the page background, below content, `pointer-events:none`) that the
  whole narrative zone (Hero → Featured Work → Visual Lab) flows over. A native
  **raymarched-metaball** fragment shader fuses moving metaballs into one large,
  viscous, glossy body with FBM surface displacement, internal directional flow,
  a bright fresnel rim, tight wet specular highlights, deep darks, refraction
  tint, and an aura that fades to transparent (no container edge). **No
  Three.js — zero new dependencies**; falls back to a full-viewport Canvas 2D
  plasma if WebGL is unavailable.
- **Scroll-driven narrative.** One page-level scroll progress across the
  narrative zone drives the shader through stages: large and centered-right in
  the hero → drifts left + shrinks into a backdrop behind the work grid →
  turbulent lower-opacity energy in the lab → recedes as the solid Dev Log
  section takes over. The hero copy "flows out" (up + fade + scale) over the
  morphing liquid — a continuous Apple-style handoff, not a hard section cut.
- **Unified spotlight interaction.** Every card (Work, Lab, Dev Log, About,
  Contact) uses one `SpotlightCard`: a cursor-tracked spotlight, an edge
  **border-light**, an **inner glow**, a faint **energy-texture** layer that
  surfaces near the cursor, and a subtle **parallax tilt** with z-lifted
  content — not a plain hover-scale.
- **Custom brand mark.** `Logo.tsx` is a P-monogram sigil fused with an orbit
  ring and energy nodes; the favicon matches.
- **Premium detailing.** Glassmorphism panels, holographic edges, faint
  interface grid + scanline, custom scrollbar.
- **Restrained motion.** Slow canvas, gentle scroll reveals, hover lifts. Honors
  `prefers-reduced-motion` (canvases render one static frame; tilt disables;
  Framer Motion collapses to instant) and lightens effects on mobile.

---

## Accessibility & performance

- Respects `prefers-reduced-motion` across the canvas and all motion.
- Canvas loop pauses when the tab is hidden; DPR capped; fewer blobs on mobile.
- Lazy-loaded cover images, no heavy 3D, minimal dependencies.
- Semantic landmarks (`header` / `main` / `footer`), skip-to-content link,
  keyboard-focusable controls.

---

## Deploying to GitHub Pages (later — not done yet)

> Do **not** deploy or bind the domain until explicitly decided. These notes are
> for when that time comes.

This site targets the user/organization page repo
`https://github.com/PhiaHe/phiahe.github.io`, so the Vite `base` is `"/"`
(already set in [`vite.config.ts`](vite.config.ts)).

A ready-to-use GitHub Actions workflow is included at
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). When you're
ready:

1. Push this project to the `phiahe.github.io` repo.
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Push to `main`; the workflow builds and publishes `dist/`.
4. To bind `phiagames.com`: add a `CNAME` file (or set the custom domain in the
   Pages settings) and configure DNS. *(Skip until instructed.)*

> If you instead deploy to a **project page** (e.g. `repo.github.io/phia-site`),
> change `base` in `vite.config.ts` to `"/phia-site/"`.
