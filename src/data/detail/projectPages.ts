/* =============================================================================
 * Phia Games — Generic Project Detail Pages (Bilingual EN / ZH)
 * -----------------------------------------------------------------------------
 * Featured Work cards that are bodies of work rather than a single project.
 * Inkvoker is NOT here — it keeps its richer custom page in `projectData.ts`.
 *
 * Image note (foundation round): the dedicated `detail-pages/*` art is not in
 * the repo yet, so these reuse existing on-brand assets. Swap `src` paths once
 * Codex delivers the final covers/heroes; the data shape stays the same.
 * ============================================================================= */

import type { DetailPage } from "./detailTypes";

export const projectPages: DetailPage[] = [
  {
    id: "visual-experiments",
    route: "#/projects/visual-experiments",
    kind: "project",
    title: { en: "Visual Experiments", zh: "视觉实验" },
    kicker: { en: "Visual Research Archive", zh: "视觉研究档案" },
    summary: {
      en: "A working archive of visual research for the lab — concept frames, interface moods, shader surfaces, and sprite studies that feed real projects rather than sit in a gallery.",
      zh: "实验室的视觉研究档案——概念画面、界面氛围、着色器材质与精灵研究。它们服务于真实项目，而不是停留在画廊里。",
    },
    heroImage: {
      src: "/assets/projects/inkvoker/hero-concept-gemini.jpg",
      alt: {
        en: "A composed board of concept frames and visual surface studies.",
        zh: "由概念画面与视觉材质研究组成的拼板。",
      },
      label: { en: "Visual systems board", zh: "视觉系统拼板" },
    },
    sections: [
      {
        id: "detail-overview",
        nav: { en: "Overview", zh: "概览" },
        heading: {
          en: "Why visual experiments exist",
          zh: "为什么要做视觉实验",
        },
        body: {
          en: "Every project needs a visual direction before it earns one. This archive is where directions get tested cheaply — a place to try a surface, a palette, or an interface mood before committing it to a build. The goal is a curated record, not a dumping ground.",
          zh: "每个项目在真正确定风格之前，都需要先试出一个方向。这个档案就是低成本试错的地方——在投入到正式构建之前，先尝试一种材质、一组配色或一种界面氛围。目标是一份经过挑选的记录，而不是素材堆场。",
        },
      },
      {
        id: "detail-focus",
        nav: { en: "Focus", zh: "方向" },
        heading: { en: "Focus areas", zh: "研究方向" },
        items: [
          {
            title: { en: "Concept art", zh: "概念画面" },
            body: {
              en: "Mood and composition frames that set the tone before production art begins.",
              zh: "在正式美术开始前，用来定下基调与构图的氛围画面。",
            },
          },
          {
            title: { en: "Interface mood", zh: "界面氛围" },
            body: {
              en: "HUD surfaces, panels, and card frames explored for readability and feel.",
              zh: "围绕可读性与手感探索的 HUD 表面、面板与卡牌框。",
            },
          },
          {
            title: { en: "Shader & liquid surface", zh: "着色器与流体材质" },
            body: {
              en: "Energy fields and liquid surfaces — the motif behind the site's own background.",
              zh: "能量场与流体表面——也是本站背景所用的核心母题。",
            },
          },
          {
            title: { en: "Sprite & VFX studies", zh: "精灵与特效研究" },
            body: {
              en: "Character sheets and effect collages tested at thumbnail and gameplay scale.",
              zh: "在缩略图与实际玩法尺寸下测试的角色表与特效拼图。",
            },
          },
        ],
      },
      {
        id: "detail-process",
        nav: { en: "Process", zh: "流程" },
        heading: { en: "From brief to production", zh: "从需求到落地" },
        body: {
          en: "A consistent loop keeps the archive useful: a short brief, then generation or sketch, then curation, cleanup, and finally a move into a real surface — a card cover, a hero image, or an in-game asset.",
          zh: "一套稳定的循环让档案保持可用：先写一份简短需求，再生成或手绘，然后挑选、清理，最后落到真实的载体上——一张卡片封面、一张主视觉，或一份游戏内素材。",
        },
        items: [
          {
            title: { en: "Brief → generate", zh: "需求 → 生成" },
            body: {
              en: "Define purpose and usage first, then produce variants to react to.",
              zh: "先确定用途与使用场景，再产出可供取舍的多个版本。",
            },
          },
          {
            title: { en: "Curate → clean up", zh: "挑选 → 清理" },
            body: {
              en: "Keep the few usable outputs, then crop and clean them for real use.",
              zh: "只保留少数可用的产出，再裁切与清理，使其能真正投入使用。",
            },
          },
        ],
      },
    ],
    related: [
      {
        label: { en: "Inkvoker", zh: "Inkvoker" },
        href: "#/projects/inkvoker",
        note: { en: "Where many of these studies land", zh: "许多研究最终落地的地方" },
      },
      {
        label: { en: "Back to Work", zh: "返回作品" },
        href: "#work",
      },
    ],
  },
  {
    id: "pixel-character-lab",
    route: "#/projects/pixel-character-lab",
    kind: "project",
    title: { en: "Pixel Character Lab", zh: "像素角色实验室" },
    kicker: { en: "Character & Sprite Study", zh: "角色与精灵研究" },
    summary: {
      en: "An asset exploration around a wolf-like anthro explorer — sprite sheets, eight-direction movement, and action poses worked toward characters that could actually ship into a top-down build.",
      zh: "一组围绕「狼系拟人探索者」的资产探索——精灵表、八方向移动与动作姿态，目标是让角色能真正实装进俯视视角的构建里。",
    },
    heroImage: {
      src: "/assets/projects/inkvoker/character-cyber-fox.png",
      alt: {
        en: "A stylized wolf-like anthro explorer character study.",
        zh: "一张风格化的狼系拟人探索者角色研究。",
      },
      label: { en: "Character study", zh: "角色研究" },
    },
    sections: [
      {
        id: "detail-overview",
        nav: { en: "Overview", zh: "概览" },
        heading: { en: "From a character to a sprite sheet", zh: "从一个角色到一张精灵表" },
        body: {
          en: "The lab centers on a recurring figure — a wolf-like anthro explorer — and the work of turning a single static concept into something a game can move. This is a visual study, not a finished commercial asset pack: the value is in learning what stays consistent when a character has to run, attack, and cast in every direction.",
          zh: "这个实验室围绕一个反复出现的形象——一名狼系拟人探索者——以及把一张静态概念图变成「游戏能驱动起来」的过程展开。这是一次视觉研究，而不是一套完整的商用资产包：真正的价值在于搞清楚，当角色需要朝各个方向奔跑、攻击与施法时，哪些东西必须保持一致。",
        },
      },
      {
        id: "detail-focus",
        nav: { en: "Focus", zh: "方向" },
        heading: { en: "What the study covers", zh: "研究覆盖的内容" },
        items: [
          {
            title: { en: "Eight-direction movement", zh: "八方向移动" },
            body: {
              en: "Walk and run frames mapped to eight headings so the character reads correctly from any facing.",
              zh: "把行走与奔跑帧映射到八个朝向，让角色从任意方向看上去都正确。",
            },
          },
          {
            title: { en: "Action poses", zh: "动作姿态" },
            body: {
              en: "Attack, run, and cast poses prompted as a set, so the silhouette stays recognizable across actions.",
              zh: "把攻击、奔跑与施法姿态作为一组提示词产出，让轮廓在不同动作之间仍可辨认。",
            },
          },
          {
            title: { en: "Pixel constraints", zh: "像素约束" },
            body: {
              en: "A tight palette and resolution budget keep the style honest instead of drifting into smooth render.",
              zh: "克制的配色与分辨率预算，让风格保持像素本色，而不是滑向平滑渲染。",
            },
          },
          {
            title: { en: "Design consistency", zh: "设计一致性" },
            body: {
              en: "Markings, proportions, and gear are tracked frame to frame so it stays the same character.",
              zh: "逐帧追踪花纹、比例与装备，确保始终是同一个角色。",
            },
          },
        ],
      },
      {
        id: "detail-process",
        nav: { en: "Process", zh: "流程" },
        heading: { en: "Toward something implementable", zh: "走向可实装" },
        body: {
          en: "Getting from a nice image to usable sprites takes more than one prompt. The loop is: prompt a pose, correct the facing and proportions by hand, then prepare clean cutouts on a flat white or black background so the frames can be sliced into a sheet.",
          zh: "从一张好看的图走到可用的精灵，靠的不是一句提示词。循环是：提示一个姿态，手动修正朝向与比例，再在纯白或纯黑底上准备干净的切图，让这些帧能被切成一张精灵表。",
        },
        items: [
          {
            title: { en: "Prompt → correct", zh: "提示 → 修正" },
            body: {
              en: "Generate a pose, then fix facing, proportion, and detail drift by hand.",
              zh: "先生成一个姿态，再手动修正朝向、比例与细节漂移。",
            },
          },
          {
            title: { en: "Clean cutouts", zh: "干净切图" },
            body: {
              en: "Flat white / black backgrounds make isolation and sheet slicing reliable.",
              zh: "纯白 / 纯黑底让抠像与切表更可靠。",
            },
          },
        ],
      },
    ],
    related: [
      {
        label: { en: "Pixel Characters (Lab)", zh: "像素角色（视觉实验）" },
        href: "#/lab/pixel-characters",
        note: { en: "The sprite-sheet studies behind this", zh: "支撑它的精灵表研究" },
      },
      {
        label: { en: "Back to Work", zh: "返回作品" },
        href: "#work",
      },
    ],
  },
];
