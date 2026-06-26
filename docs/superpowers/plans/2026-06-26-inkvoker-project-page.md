# Inkvoker Project Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a bilingual `#/projects/inkvoker` project detail page for Inkvoker · 墨唤 and make the homepage Inkvoker card link to it.

**Architecture:** Keep the current single-page Vite/React app and add a tiny hash route switch in `App.tsx`. Store project-page copy and image metadata in a focused data file using the existing `Localized` shape, then compose the page from small React sections that reuse the current visual system.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS, Framer Motion, existing Phia language context, static assets under `public/`.

---

## File Structure

- Create: `public/assets/projects/inkvoker/`
  - Holds curated web assets copied from `I:\Inkvoker` and generated concept visuals.
- Create: `src/data/projectData.ts`
  - Defines `ProjectDetail` data for Inkvoker, including EN/ZH copy for all rendered text.
- Create: `src/components/project/ProjectDetailPage.tsx`
  - Page-level composition for the Inkvoker route.
- Create: `src/components/project/ProjectHero.tsx`
  - Hero title, localized pitch, status badges, image, and CTAs.
- Create: `src/components/project/ProjectStats.tsx`
  - Compact stat strip.
- Create: `src/components/project/CoreLoop.tsx`
  - Four-step localized gameplay loop.
- Create: `src/components/project/ProjectFeatureGrid.tsx`
  - System feature cards.
- Create: `src/components/project/ProjectGallery.tsx`
  - Real asset and concept visual gallery with localized labels and alt text.
- Create: `src/components/project/ProjectStatus.tsx`
  - Private-development and v0.6 implementation summary.
- Modify: `src/App.tsx`
  - Add hash route state and render either homepage or project page.
- Modify: `src/components/WorkCard.tsx`
  - Support optional link/href while preserving current card styling.
- Modify: `src/data/siteData.ts`
  - Add `href` to `FeaturedWork` and set Inkvoker to `#/projects/inkvoker`.

## Task 1: Prepare Project Assets

**Files:**
- Create directory: `public/assets/projects/inkvoker/`
- Copy from: `I:\Inkvoker\assets\...`
- Copy generated image from: `C:\Users\Administrator.KING-20180207SG\.codex\generated_images\...`

- [ ] **Step 1: Create the asset folder**

Run:

```powershell
New-Item -ItemType Directory -Force -Path 'public\assets\projects\inkvoker' | Out-Null
```

Expected: folder exists at `public/assets/projects/inkvoker/`.

- [ ] **Step 2: Copy a small real-asset set**

Copy one map/ground texture, one player/character image, one enemy image, and one card image per sect. Use stable lowercase filenames.

Suggested source-to-destination set:

```powershell
Copy-Item -LiteralPath 'I:\Inkvoker\assets\map_max.png' -Destination 'public\assets\projects\inkvoker\map-max.png'
Copy-Item -LiteralPath 'I:\Inkvoker\assets\characters\player\cyber_fox\fox_explorer_move_8dir_8f_v01.png' -Destination 'public\assets\projects\inkvoker\character-cyber-fox.png'
Copy-Item -LiteralPath 'I:\Inkvoker\assets\enemy\dan_qing_hua_ji.png' -Destination 'public\assets\projects\inkvoker\enemy-dan-qing-hua-ji.png'
Copy-Item -LiteralPath 'I:\Inkvoker\assets\cardpic\shushanpai\wan_jian_gui_zong.png' -Destination 'public\assets\projects\inkvoker\card-shushan.png'
Copy-Item -LiteralPath 'I:\Inkvoker\assets\cardpic\fuzhuanzong\wu_lei_zheng_fa.png' -Destination 'public\assets\projects\inkvoker\card-fuzhuan.png'
Copy-Item -LiteralPath 'I:\Inkvoker\assets\cardpic\mojiao\a_bi_dao_zhan.png' -Destination 'public\assets\projects\inkvoker\card-mojiao.png'
Copy-Item -LiteralPath 'I:\Inkvoker\assets\cardpic\shaolin\fo_nu_hong_lian.png' -Destination 'public\assets\projects\inkvoker\card-shaolin.png'
Copy-Item -LiteralPath 'I:\Inkvoker\assets\cardpic\gaibang\fei_long_zai_tian.png' -Destination 'public\assets\projects\inkvoker\card-gaibang.png'
Copy-Item -LiteralPath 'I:\Inkvoker\assets\cardpic\wudang\tai_ji_sheng_wan_wu.png' -Destination 'public\assets\projects\inkvoker\card-wudang.png'
Copy-Item -LiteralPath 'I:\Inkvoker\assets\cardpic\tangmen\kong_que_ling.png' -Destination 'public\assets\projects\inkvoker\card-tangmen.png'
Copy-Item -LiteralPath 'I:\Inkvoker\assets\cardpic\kunlun\ao_xue_qi_shuang.png' -Destination 'public\assets\projects\inkvoker\card-kunlun.png'
```

Expected: all copied files exist under `public/assets/projects/inkvoker/`.

- [ ] **Step 3: Copy the selected generated concept hero image**

Pick the revised generated image where cards show martial arts techniques rather than repeated people. Copy it into the project folder as:

```text
public/assets/projects/inkvoker/hero-concept.png
```

If the exact generated source filename is unclear, inspect:

```powershell
Get-ChildItem -Recurse -File 'C:\Users\Administrator.KING-20180207SG\.codex\generated_images\019f02bc-9ebb-7e53-a3cf-ef6f668b2619'
```

Then copy the selected file:

```powershell
Copy-Item -LiteralPath '<selected-generated-image-path>' -Destination 'public\assets\projects\inkvoker\hero-concept.png'
```

Expected: `hero-concept.png` exists and is the martial-arts-technique card version.

- [ ] **Step 4: Check asset size risk**

Run:

```powershell
Get-ChildItem -File 'public\assets\projects\inkvoker' | Select-Object Name,Length
```

Expected: no single website asset is unexpectedly huge for the web. If a file is too large for a page image, create a resized copy using an available image tool before referencing it.

## Task 2: Add Bilingual Project Data

**Files:**
- Create: `src/data/projectData.ts`
- Modify: `src/data/siteData.ts`

- [ ] **Step 1: Create `projectData.ts` with complete EN/ZH copy**

Create `src/data/projectData.ts`:

```ts
import type { Localized } from "./siteData";

export interface ProjectStat {
  value: string;
  label: Localized;
}

export interface ProjectLoopStep {
  title: Localized;
  body: Localized;
}

export interface ProjectFeature {
  title: Localized;
  body: Localized;
  tags: Localized[];
}

export interface ProjectGalleryItem {
  src: string;
  alt: Localized;
  label: Localized;
  kind: "real-asset" | "concept-visual";
}

export interface ProjectDetail {
  id: string;
  slug: string;
  title: string;
  kicker: Localized;
  pitch: Localized;
  summary: Localized;
  primaryCta: Localized;
  secondaryCta: Localized;
  heroImage: ProjectGalleryItem;
  stats: ProjectStat[];
  loop: ProjectLoopStep[];
  features: ProjectFeature[];
  gallery: ProjectGalleryItem[];
  statusTitle: Localized;
  statusBody: Localized;
  implementationHighlights: Localized[];
  closingLine: Localized;
}

const asset = (name: string) => `/assets/projects/inkvoker/${name}`;

export const inkvokerProject: ProjectDetail = {
  id: "inkvoker",
  slug: "inkvoker",
  title: "Inkvoker · 墨唤",
  kicker: {
    en: "Private Development / v0.6 Prototype",
    zh: "私有开发中 / v0.6 原型",
  },
  pitch: {
    en: "A Chinese martial-arts roguelike deckbuilding auto-battle prototype.",
    zh: "一款国风武侠 Roguelike 自动战斗 + 牌组构筑原型。",
  },
  summary: {
    en: "Players move, dodge, and shape the battlefield while the Album auto-casts martial skill cards. Between waves, the run becomes a construction puzzle of cards, awakenings, synergies, artifacts, and long-term progression.",
    zh: "玩家负责走位、闪避与塑造战场，画册会按节奏自动施放武学技能卡。每波之间，局内成长会变成一套围绕卡牌、觉醒、羁绊、法宝与长线养成的构筑谜题。",
  },
  primaryCta: { en: "Explore Systems", zh: "查看系统" },
  secondaryCta: { en: "Back to Work", zh: "返回作品" },
  heroImage: {
    src: asset("hero-concept.png"),
    alt: {
      en: "Concept visual for Inkvoker showing martial arts technique cards orbiting an ink formation.",
      zh: "墨唤概念视觉：多张武学招式卡环绕墨色阵法。",
    },
    label: { en: "Concept Visual", zh: "概念视觉" },
    kind: "concept-visual",
  },
  stats: [
    { value: "64", label: { en: "Skills", zh: "技能" } },
    { value: "8", label: { en: "Sects", zh: "门派" } },
    { value: "15", label: { en: "Reactions", zh: "元素反应" } },
    { value: "35", label: { en: "Story waves", zh: "故事波次" } },
  ],
  loop: [
    {
      title: { en: "Album casts", zh: "画册施法" },
      body: {
        en: "Equipped skill cards fire automatically on rhythm.",
        zh: "出战技能卡按节奏自动释放。",
      },
    },
    {
      title: { en: "Player dodges", zh: "玩家闪避" },
      body: {
        en: "Movement, positioning, and enemy herding become the main input.",
        zh: "走位、站位与拉怪成为主要操作。",
      },
    },
    {
      title: { en: "Synergies ignite", zh: "羁绊点燃" },
      body: {
        en: "Elements, sects, and move types combine into escalating battlefield effects.",
        zh: "元素、门派与招式维度叠加出不断升级的战场效果。",
      },
    },
    {
      title: { en: "Shop reshapes the run", zh: "商店重塑构筑" },
      body: {
        en: "Between waves, cards, awakenings, and artifacts push the build forward.",
        zh: "波次之间通过购卡、升星、觉醒与法宝推进构筑。",
      },
    },
  ],
  features: [
    {
      title: { en: "Skill Cards", zh: "技能卡牌" },
      body: {
        en: "Eight sects with eight skills each, a 1-5 cost curve, and star awakenings.",
        zh: "八个门派各八张技能，覆盖 1-5 费曲线，并带有星级觉醒。",
      },
      tags: [
        { en: "64 skills", zh: "64 张技能" },
        { en: "Awakenings", zh: "觉醒" },
      ],
    },
    {
      title: { en: "Element Reactions", zh: "元素反应" },
      body: {
        en: "Fire, water, thunder, wind, dark, and light combine into 15 pair reactions.",
        zh: "火、水、雷、风、暗、光组合出 15 组二元素反应。",
      },
      tags: [
        { en: "6 elements", zh: "6 元素" },
        { en: "Combo fields", zh: "组合场" },
      ],
    },
    {
      title: { en: "Three-Dimensional Synergies", zh: "三维羁绊" },
      body: {
        en: "Builds can grow through element, sect, and move-type tracks.",
        zh: "构筑可以沿元素、门派、招式三条羁绊维度成长。",
      },
      tags: [
        { en: "Element", zh: "元素" },
        { en: "Sect", zh: "门派" },
        { en: "Move type", zh: "招式" },
      ],
    },
    {
      title: { en: "Artifacts", zh: "法宝" },
      body: {
        en: "Altar choices add global modifiers that bend the rules of a run.",
        zh: "法宝祭坛提供局内全局改造，让一局的规则产生偏移。",
      },
      tags: [
        { en: "Altar picks", zh: "祭坛三选一" },
        { en: "Run modifiers", zh: "局内改造" },
      ],
    },
    {
      title: { en: "Meta Progression", zh: "长线养成" },
      body: {
        en: "The sutra library carries long-term talent growth across runs.",
        zh: "藏经阁承载跨局成长，让门派和通用心法长期推进。",
      },
      tags: [
        { en: "Sutra library", zh: "藏经阁" },
        { en: "Talents", zh: "天赋" },
      ],
    },
    {
      title: { en: "Story + Endless", zh: "故事 + 无尽" },
      body: {
        en: "A 35-wave story route can lead into an endless continuation.",
        zh: "35 波故事流程结束后，可以继续踏入无尽模式。",
      },
      tags: [
        { en: "35 waves", zh: "35 波" },
        { en: "Endless choice", zh: "无尽抉择" },
      ],
    },
  ],
  gallery: [
    {
      src: asset("hero-concept.png"),
      alt: {
        en: "Concept visual of technique cards around an ink formation.",
        zh: "武学招式卡环绕墨色阵法的概念视觉。",
      },
      label: { en: "Concept Visual", zh: "概念视觉" },
      kind: "concept-visual",
    },
    {
      src: asset("card-shushan.png"),
      alt: { en: "Shushan skill card art.", zh: "蜀山技能卡图。" },
      label: { en: "Shushan Card", zh: "蜀山卡牌" },
      kind: "real-asset",
    },
    {
      src: asset("card-wudang.png"),
      alt: { en: "Wudang skill card art.", zh: "武当技能卡图。" },
      label: { en: "Wudang Card", zh: "武当卡牌" },
      kind: "real-asset",
    },
    {
      src: asset("card-tangmen.png"),
      alt: { en: "Tangmen skill card art.", zh: "唐门技能卡图。" },
      label: { en: "Tangmen Card", zh: "唐门卡牌" },
      kind: "real-asset",
    },
    {
      src: asset("card-kunlun.png"),
      alt: { en: "Kunlun skill card art.", zh: "昆仑技能卡图。" },
      label: { en: "Kunlun Card", zh: "昆仑卡牌" },
      kind: "real-asset",
    },
    {
      src: asset("character-cyber-fox.png"),
      alt: { en: "Player character sprite sheet asset.", zh: "玩家角色精灵表素材。" },
      label: { en: "Character Asset", zh: "角色素材" },
      kind: "real-asset",
    },
  ],
  statusTitle: {
    en: "Private development, substantial prototype",
    zh: "私有开发中，但原型已经有扎实内容",
  },
  statusBody: {
    en: "The repository is currently private, so the public page should describe the work without sending visitors to a locked GitHub link.",
    zh: "仓库目前仍为私有，因此公开页面会介绍项目内容，但不会把访客引向无法访问的 GitHub 链接。",
  },
  implementationHighlights: [
    {
      en: "64 skill behaviors and visuals implemented.",
      zh: "64 张技能的行为与视觉已经实装。",
    },
    {
      en: "Eight sect talent architectures are in place.",
      zh: "八个门派的天赋与羁绊架构已经落地。",
    },
    {
      en: "Story mode reaches a 35-wave loop with an endless-mode choice.",
      zh: "故事模式形成 35 波闭环，并接入无尽模式抉择。",
    },
    {
      en: "v0.6 polish covers economy smoothing, spawn feel, shop safeguards, and audio concurrency.",
      zh: "v0.6 打磨覆盖经济平滑、刷怪手感、搜卡保底与音频并发控制。",
    },
  ],
  closingLine: {
    en: "More public notes and playable builds will arrive as the prototype opens up.",
    zh: "随着原型逐步公开，后续会继续补充更多项目笔记和可试玩版本。",
  },
};
```

Expected: every rendered text field has both `en` and `zh`.

- [ ] **Step 2: Add href support to the featured work type**

In `src/data/siteData.ts`, update the `FeaturedWork` interface:

```ts
export interface FeaturedWork {
  id: string;
  index: string;
  title: Localized;
  description: Localized;
  tags: Localized[];
  cover: string;
  accent: "cyan" | "violet" | "gold";
  status: Localized;
  href?: string;
}
```

Then add this field to the Inkvoker item:

```ts
href: "#/projects/inkvoker",
```

Expected: TypeScript accepts an optional `href`, and only Inkvoker needs one for this pass.

- [ ] **Step 3: Run type check**

Run:

```powershell
npm run lint
```

Expected: TypeScript compiles with no errors.

## Task 3: Add Hash Routing in App

**Files:**
- Modify: `src/App.tsx`
- Create or inline route helper in `src/App.tsx`

- [ ] **Step 1: Add route state to `App.tsx`**

Replace the first import line:

```ts
import { useRef } from "react";
```

with:

```ts
import { useEffect, useMemo, useRef, useState } from "react";
```

Add import:

```ts
import ProjectDetailPage from "./components/project/ProjectDetailPage";
```

Add helper functions above `export default function App()`:

```ts
function getHashRoute() {
  if (typeof window === "undefined") return "";
  return window.location.hash;
}

function scrollToHashTarget(hash: string) {
  if (typeof window === "undefined") return;
  const id = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!id) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  window.requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}
```

Inside `App`, add:

```ts
const [route, setRoute] = useState(getHashRoute);

useEffect(() => {
  const onHashChange = () => setRoute(getHashRoute());
  window.addEventListener("hashchange", onHashChange);
  return () => window.removeEventListener("hashchange", onHashChange);
}, []);

const isInkvokerPage = route === "#/projects/inkvoker";

const handleBackToWork = useMemo(
  () => () => {
    window.location.hash = "#work";
    setRoute("#work");
    scrollToHashTarget("#work");
  },
  []
);
```

Expected: app can track hash route changes.

- [ ] **Step 2: Branch page rendering**

Wrap the current homepage section stack in a conditional.

Replace the current content inside:

```tsx
<div ref={pageRef} className="relative z-10">
  ...
</div>
```

with:

```tsx
<div ref={pageRef} className="relative z-10">
  {isInkvokerPage ? (
    <ProjectDetailPage onBackToWork={handleBackToWork} />
  ) : (
    <>
      <Hero />
      <FeaturedWorkSection />
      <SectionDivider />
      <VisualLabSection />
      <SectionDivider />
      <DevLogSection />
      <SectionDivider />
      <AboutSection />
      <ContactFooter />
    </>
  )}
</div>
```

Expected: the default route shows the homepage; `#/projects/inkvoker` shows the project page.

- [ ] **Step 3: Adjust skip link target if needed**

The existing skip link points to `#work`. Leave it as-is for homepage. If it is awkward on the project page, change its href dynamically:

```tsx
href={isInkvokerPage ? "#project-main" : "#work"}
```

Expected: keyboard users can skip into useful content on both routes.

- [ ] **Step 4: Run type check**

Run:

```powershell
npm run lint
```

Expected: errors mention `ProjectDetailPage` only until the next task creates it; after Task 4 it should pass.

## Task 4: Build Project Page Components

**Files:**
- Create: `src/components/project/ProjectDetailPage.tsx`
- Create: `src/components/project/ProjectHero.tsx`
- Create: `src/components/project/ProjectStats.tsx`
- Create: `src/components/project/CoreLoop.tsx`
- Create: `src/components/project/ProjectFeatureGrid.tsx`
- Create: `src/components/project/ProjectGallery.tsx`
- Create: `src/components/project/ProjectStatus.tsx`

- [ ] **Step 1: Create `ProjectDetailPage.tsx`**

```tsx
import { inkvokerProject } from "../../data/projectData";
import ContactFooter from "../ContactFooter";
import SectionDivider from "../SectionDivider";
import CoreLoop from "./CoreLoop";
import ProjectFeatureGrid from "./ProjectFeatureGrid";
import ProjectGallery from "./ProjectGallery";
import ProjectHero from "./ProjectHero";
import ProjectStats from "./ProjectStats";
import ProjectStatus from "./ProjectStatus";

interface ProjectDetailPageProps {
  onBackToWork: () => void;
}

export default function ProjectDetailPage({ onBackToWork }: ProjectDetailPageProps) {
  return (
    <main id="project-main" className="pt-24 md:pt-28">
      <ProjectHero project={inkvokerProject} onBackToWork={onBackToWork} />
      <ProjectStats stats={inkvokerProject.stats} />
      <SectionDivider />
      <CoreLoop steps={inkvokerProject.loop} />
      <SectionDivider />
      <ProjectFeatureGrid features={inkvokerProject.features} />
      <SectionDivider />
      <ProjectGallery items={inkvokerProject.gallery} />
      <SectionDivider />
      <ProjectStatus project={inkvokerProject} onBackToWork={onBackToWork} />
      <ContactFooter />
    </main>
  );
}
```

Expected: project page composes all sections.

- [ ] **Step 2: Create `ProjectHero.tsx`**

```tsx
import type { ProjectDetail } from "../../data/projectData";
import { useLanguage } from "../../i18n/LanguageContext";
import Reveal from "../Reveal";

interface ProjectHeroProps {
  project: ProjectDetail;
  onBackToWork: () => void;
}

export default function ProjectHero({ project, onBackToWork }: ProjectHeroProps) {
  const { t } = useLanguage();

  return (
    <section className="container-lab grid min-h-[calc(100vh-7rem)] items-center gap-10 pb-16 pt-8 lg:grid-cols-[0.95fr_1.05fr]">
      <Reveal>
        <div>
          <p className="eyebrow">{t(project.kicker)}</p>
          <h1 className="mt-6 font-display text-5xl font-semibold leading-tight text-white md:text-7xl">
            {project.title}
          </h1>
          <p className="mt-6 max-w-2xl text-xl leading-relaxed text-accent-silver/85">
            {t(project.pitch)}
          </p>
          <p className="mt-5 max-w-2xl text-base leading-8 text-accent-silver/62">
            {t(project.summary)}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#project-systems" className="btn btn-primary">
              {t(project.primaryCta)}
            </a>
            <button type="button" onClick={onBackToWork} className="btn btn-ghost">
              {t(project.secondaryCta)}
            </button>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.12}>
        <figure className="relative overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/30">
          <img
            src={project.heroImage.src}
            alt={t(project.heroImage.alt)}
            className="aspect-[16/11] w-full object-cover"
          />
          <figcaption className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-void-900/70 px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-accent-silver/80 backdrop-blur">
            {t(project.heroImage.label)}
          </figcaption>
        </figure>
      </Reveal>
    </section>
  );
}
```

Expected: hero has localized copy and labels the generated image as a concept visual.

- [ ] **Step 3: Create `ProjectStats.tsx`**

```tsx
import type { ProjectStat } from "../../data/projectData";
import { useLanguage } from "../../i18n/LanguageContext";
import Reveal from "../Reveal";

export default function ProjectStats({ stats }: { stats: ProjectStat[] }) {
  const { t } = useLanguage();

  return (
    <section className="container-lab">
      <Reveal>
        <div className="grid gap-3 rounded-[20px] border border-white/10 bg-void-900/45 p-4 backdrop-blur md:grid-cols-4">
          {stats.map((stat) => (
            <div key={`${stat.value}-${stat.label.en}`} className="rounded-xl bg-white/[0.035] p-5">
              <div className="font-display text-4xl font-semibold text-white">{stat.value}</div>
              <div className="mt-2 font-mono text-[11px] uppercase tracking-wide text-accent-silver/60">
                {t(stat.label)}
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
```

Expected: stats render in English and Chinese.

- [ ] **Step 4: Create `CoreLoop.tsx`**

```tsx
import type { ProjectLoopStep } from "../../data/projectData";
import { useLanguage } from "../../i18n/LanguageContext";
import Reveal from "../Reveal";
import SectionHeading from "../SectionHeading";

export default function CoreLoop({ steps }: { steps: ProjectLoopStep[] }) {
  const { t } = useLanguage();

  return (
    <section id="project-systems" className="section-pad scroll-mt-24">
      <div className="container-lab">
        <SectionHeading
          kicker={t({ en: "Core Loop", zh: "核心循环" })}
          title={t({ en: "Auto-cast combat, deliberate construction", zh: "自动施法的战斗，主动选择的构筑" })}
          description={t({
            en: "Inkvoker separates the moment-to-moment action from the between-wave decisions, letting combat feel fluid while builds stay strategic.",
            zh: "墨唤把战斗中的即时走位和波次之间的构筑决策分开，让战斗保持流动，同时让成长路线具备策略感。",
          })}
        />
        <div className="mt-12 grid gap-4 md:grid-cols-4">
          {steps.map((step, index) => (
            <Reveal key={step.title.en} delay={index * 0.06}>
              <div className="h-full rounded-[18px] border border-white/10 bg-white/[0.035] p-5">
                <div className="font-mono text-xs text-accent-cyan/80">0{index + 1}</div>
                <h3 className="mt-4 font-display text-xl font-semibold text-white">{t(step.title)}</h3>
                <p className="mt-3 text-sm leading-7 text-accent-silver/62">{t(step.body)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
```

Expected: core loop is scan-friendly and bilingual.

- [ ] **Step 5: Create `ProjectFeatureGrid.tsx`**

```tsx
import type { ProjectFeature } from "../../data/projectData";
import { useLanguage } from "../../i18n/LanguageContext";
import Reveal from "../Reveal";
import SectionHeading from "../SectionHeading";
import SpotlightCard from "../SpotlightCard";

export default function ProjectFeatureGrid({ features }: { features: ProjectFeature[] }) {
  const { t } = useLanguage();

  return (
    <section className="section-pad">
      <div className="container-lab">
        <SectionHeading
          kicker={t({ en: "Systems", zh: "系统" })}
          title={t({ en: "The run is built from layered decisions", zh: "一局由层层叠加的选择构成" })}
          description={t({
            en: "The page should show enough of the underlying system depth without becoming a full design document.",
            zh: "页面会展示足够多的系统深度，但不会把自己变成完整设计文档。",
          })}
        />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Reveal key={feature.title.en} delay={index * 0.05} className="h-full">
              <SpotlightCard accent={index % 3 === 0 ? "cyan" : index % 3 === 1 ? "violet" : "gold"} className="h-full" tilt={3}>
                <div className="relative flex h-full flex-col p-6">
                  <h3 className="font-display text-2xl font-semibold text-white">{t(feature.title)}</h3>
                  <p className="mt-4 flex-1 text-sm leading-7 text-accent-silver/62">{t(feature.body)}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {feature.tags.map((tag) => (
                      <span key={tag.en} className="chip">{t(tag)}</span>
                    ))}
                  </div>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
```

Expected: features reuse `SpotlightCard` and localized tags.

- [ ] **Step 6: Create `ProjectGallery.tsx`**

```tsx
import type { ProjectGalleryItem } from "../../data/projectData";
import { useLanguage } from "../../i18n/LanguageContext";
import Reveal from "../Reveal";
import SectionHeading from "../SectionHeading";

export default function ProjectGallery({ items }: { items: ProjectGalleryItem[] }) {
  const { t } = useLanguage();

  return (
    <section className="section-pad">
      <div className="container-lab">
        <SectionHeading
          kicker={t({ en: "Visual Archive", zh: "视觉档案" })}
          title={t({ en: "Real assets, with concept visuals clearly marked", zh: "真实素材与清晰标注的概念视觉" })}
          description={t({
            en: "Game assets show the prototype's substance; generated art is used only for packaging and visual direction.",
            zh: "游戏素材展示原型的实际内容；生成图只用于页面包装和视觉方向探索。",
          })}
        />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <Reveal key={`${item.src}-${index}`} delay={index * 0.04}>
              <figure className="group overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.035]">
                <img src={item.src} alt={t(item.alt)} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                <figcaption className="flex items-center justify-between gap-3 p-4">
                  <span className="text-sm font-medium text-white">{t(item.label)}</span>
                  <span className="chip !py-0.5 !text-[10px]">
                    {item.kind === "concept-visual" ? t({ en: "Concept", zh: "概念" }) : t({ en: "Real asset", zh: "真实素材" })}
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
```

Expected: generated image cannot be mistaken for a screenshot.

- [ ] **Step 7: Create `ProjectStatus.tsx`**

```tsx
import type { ProjectDetail } from "../../data/projectData";
import { useLanguage } from "../../i18n/LanguageContext";
import Reveal from "../Reveal";
import SpotlightCard from "../SpotlightCard";

interface ProjectStatusProps {
  project: ProjectDetail;
  onBackToWork: () => void;
}

export default function ProjectStatus({ project, onBackToWork }: ProjectStatusProps) {
  const { t } = useLanguage();

  return (
    <section className="section-pad">
      <div className="container-lab">
        <Reveal>
          <SpotlightCard accent="silver" tilt={0}>
            <div className="grid gap-8 p-7 md:grid-cols-[0.9fr_1.1fr] md:p-9">
              <div>
                <p className="eyebrow">{t(project.kicker)}</p>
                <h2 className="mt-5 font-display text-3xl font-semibold text-white md:text-5xl">
                  {t(project.statusTitle)}
                </h2>
                <p className="mt-5 text-sm leading-7 text-accent-silver/65">{t(project.statusBody)}</p>
                <p className="mt-5 text-sm leading-7 text-accent-silver/65">{t(project.closingLine)}</p>
              </div>
              <div>
                <ul className="space-y-3">
                  {project.implementationHighlights.map((highlight) => (
                    <li key={highlight.en} className="rounded-xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-7 text-accent-silver/72">
                      {t(highlight)}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="button" onClick={onBackToWork} className="btn btn-primary">
                    {t(project.secondaryCta)}
                  </button>
                  <a href="#contact" className="btn btn-ghost">
                    {t({ en: "Contact Phia", zh: "联系 Phia" })}
                  </a>
                </div>
              </div>
            </div>
          </SpotlightCard>
        </Reveal>
      </div>
    </section>
  );
}
```

Expected: status section is bilingual and does not expose the private GitHub link.

- [ ] **Step 8: Run type check**

Run:

```powershell
npm run lint
```

Expected: TypeScript passes or only reports import/path mistakes to fix in this task.

## Task 5: Make the Inkvoker Work Card Clickable

**Files:**
- Modify: `src/components/WorkCard.tsx`

- [ ] **Step 1: Pass link props into SpotlightCard**

In `WorkCard.tsx`, change:

```tsx
<SpotlightCard accent={work.accent} className="h-full" tilt={5}>
```

to:

```tsx
<SpotlightCard
  accent={work.accent}
  className="h-full"
  tilt={5}
  as={work.href ? "a" : "div"}
  href={work.href}
  ariaLabel={work.href ? `${t(work.title)} project details` : undefined}
>
```

Expected: Inkvoker card behaves as a link while other cards remain visual cards.

- [ ] **Step 2: Improve cover alt text**

In the cover `<img>`, replace the current hard-coded English-style alt value with:

```tsx
alt={t({
  en: `${work.title.en} project cover`,
  zh: `${work.title.zh} 项目封面`,
})}
```

Expected: English and Chinese alt text switch with the language toggle.

- [ ] **Step 3: Run type check**

Run:

```powershell
npm run lint
```

Expected: TypeScript passes.

## Task 6: Verify Bilingual Behavior and Layout

**Files:**
- No code changes expected unless verification finds issues.

- [ ] **Step 1: Build the site**

Run:

```powershell
npm run build
```

Expected: build completes successfully and writes `dist/`.

- [ ] **Step 2: Start the dev server**

Run:

```powershell
npm run dev -- --host 127.0.0.1
```

Expected: Vite serves the site on a local URL.

- [ ] **Step 3: Browser checks**

Open:

```text
http://localhost:<port>/
http://localhost:<port>/#/projects/inkvoker
```

Check:

- Homepage renders.
- Inkvoker card opens `#/projects/inkvoker`.
- Project page title is `Inkvoker · 墨唤`.
- Language toggle changes all project copy, stat labels, CTAs, gallery labels, and alt-driven visible labels.
- Hero generated image is labeled `Concept Visual` / `概念视觉`.
- Gallery distinguishes `Real asset` / `真实素材` from `Concept` / `概念`.
- No public `View on GitHub` button appears.
- `Back to Work` returns to the homepage Work section.

- [ ] **Step 4: Mobile layout check**

Use a narrow viewport.

Check:

- Hero title and copy do not overlap the image.
- Stat cards remain readable.
- Feature cards and gallery items stack cleanly.
- Chinese text does not overflow buttons or badges.

## Task 7: Final Review and Commit

**Files:**
- Stage only files created or changed for this feature.
- Do not stage unrelated existing changes.

- [ ] **Step 1: Review changed files**

Run:

```powershell
git status --short
```

Expected: identify project-page changes and avoid unrelated pre-existing files.

- [ ] **Step 2: Stage feature files only**

Run:

```powershell
git add -- public/assets/projects/inkvoker src/data/projectData.ts src/data/siteData.ts src/App.tsx src/components/WorkCard.tsx src/components/project docs/superpowers/specs/2026-06-26-inkvoker-project-page-design.md docs/superpowers/plans/2026-06-26-inkvoker-project-page.md
```

Expected: only Inkvoker project page files are staged.

- [ ] **Step 3: Commit**

Run:

```powershell
git commit -m "feat: add Inkvoker project page plan and implementation"
```

Expected: commit succeeds once Git metadata write permissions are available.
