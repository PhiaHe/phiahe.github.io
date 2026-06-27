/* =============================================================================
 * Phia Games — Lab Detail Pages (Bilingual EN / ZH)
 * -----------------------------------------------------------------------------
 * Visual Lab cards: focused visual-research topic pages. Lighter than the
 * generic project pages — an overview, a study/asset board, a few notes, and
 * related links.
 *
 * Image note (foundation round): reuses existing on-brand assets until Codex
 * delivers the dedicated `detail-pages/*` art. Swap `src` paths later.
 * ============================================================================= */

import type { DetailPage } from "./detailTypes";

export const labPages: DetailPage[] = [
  {
    id: "fluid-effects",
    route: "#/lab/fluid-effects",
    kind: "lab",
    title: { en: "Fluid / Sci-fi Effects", zh: "流体 / 科幻特效" },
    kicker: { en: "Surface & Energy Studies", zh: "材质与能量研究" },
    summary: {
      en: "The liquid-energy and sci-fi surface direction used across the site — aurora fields, holographic surfaces, and the shader motif that powers the homepage background.",
      zh: "贯穿全站的流体能量与科幻材质方向——极光场、全息表面，以及驱动首页背景的着色器母题。",
    },
    heroImage: {
      src: "/assets/projects/inkvoker/field-wudang-taiji.png",
      alt: {
        en: "A glowing energy field with layered light and motion.",
        zh: "一张带有层叠光影与动态的能量场画面。",
      },
      label: { en: "Energy field still", zh: "能量场静帧" },
    },
    sections: [
      {
        id: "detail-overview",
        nav: { en: "Overview", zh: "概览" },
        heading: { en: "Liquid energy as a visual language", zh: "把流体能量当作视觉语言" },
        body: {
          en: "Fluid and sci-fi surfaces are the lab's recurring look: soft glow, layered light, and a sense of motion even in a still frame. The same motif drives the site's animated background, so studies here translate directly into the live experience.",
          zh: "流体与科幻材质是实验室反复出现的风格：柔和的辉光、层叠的光线，即使是静帧也带有流动感。同一个母题驱动着本站的动态背景，因此这里的研究可以直接转化为线上体验。",
        },
      },
      {
        id: "detail-studies",
        nav: { en: "Studies", zh: "研究" },
        heading: { en: "Surface studies", zh: "材质研究" },
        items: [
          {
            title: { en: "Liquid glow", zh: "流体辉光" },
            body: {
              en: "Soft, blended light that reads as energy rather than a flat gradient.",
              zh: "柔和、相互融合的光，读起来像能量，而不是一层平涂的渐变。",
            },
          },
          {
            title: { en: "Aurora surface", zh: "极光表面" },
            body: {
              en: "Slow drifting bands of color used for calm, ambient backdrops.",
              zh: "缓慢漂移的色带，用于营造平静的环境氛围背景。",
            },
          },
          {
            title: { en: "Holographic field", zh: "全息场" },
            body: {
              en: "Thin scan-lines and edge light that suggest a sci-fi interface.",
              zh: "纤细的扫描线与边缘光，营造科幻界面的感觉。",
            },
          },
          {
            title: { en: "Ink / energy blend", zh: "水墨 / 能量融合" },
            body: {
              en: "Where ink-wash texture meets glow — a bridge to the Inkvoker direction.",
              zh: "水墨质感与辉光相遇之处——通向 Inkvoker 风格方向的桥梁。",
            },
          },
        ],
      },
      {
        id: "detail-notes",
        nav: { en: "Notes", zh: "笔记" },
        heading: { en: "Technical notes", zh: "技术笔记" },
        items: [
          {
            title: { en: "Shader-driven backgrounds", zh: "着色器驱动的背景" },
            body: {
              en: "The look is generated in real time, not a video loop, so it stays sharp at any size.",
              zh: "这种效果是实时生成的，而不是一段循环视频，因此在任何尺寸下都能保持清晰。",
            },
          },
          {
            title: { en: "Performance-aware scaling", zh: "兼顾性能的分辨率缩放" },
            body: {
              en: "Resolution is scaled to the device so the effect stays smooth on weaker hardware.",
              zh: "分辨率会随设备缩放，让效果在性能较弱的硬件上也能保持流畅。",
            },
          },
          {
            title: { en: "Palette control", zh: "配色控制" },
            body: {
              en: "Color is kept on a tight palette so the glow never turns into noise.",
              zh: "颜色被约束在克制的配色范围内，让辉光不会变成画面噪点。",
            },
          },
        ],
      },
    ],
    related: [
      {
        label: { en: "Inkvoker", zh: "Inkvoker" },
        href: "#/projects/inkvoker",
        note: { en: "Concept visuals in the same family", zh: "同一风格家族的概念视觉" },
      },
      {
        label: { en: "Back to Visual Lab", zh: "返回视觉实验" },
        href: "#lab",
      },
    ],
  },
  {
    id: "pixel-characters",
    route: "#/lab/pixel-characters",
    kind: "lab",
    title: { en: "Pixel Characters", zh: "像素角色" },
    kicker: { en: "Sprite Sheet Studies", zh: "精灵表研究" },
    summary: {
      en: "Sprite-sheet experiments: directions, frame counts, and action consistency — the work of turning a static character concept into something a top-down game can actually move.",
      zh: "精灵表实验：方向、帧数与动作一致性——把一张静态角色概念，变成俯视游戏能真正驱动起来的过程。",
    },
    heroImage: {
      src: "/assets/projects/inkvoker/character-cyber-fox.png",
      alt: {
        en: "A pixel-leaning character study posed for sprite work.",
        zh: "一张偏像素风、为精灵创作摆好姿态的角色研究。",
      },
      label: { en: "Character study", zh: "角色研究" },
    },
    sections: [
      {
        id: "detail-overview",
        nav: { en: "Overview", zh: "概览" },
        heading: { en: "Sprites that hold up in motion", zh: "在动起来时仍站得住的精灵" },
        body: {
          en: "A character that looks good in one frame is easy; one that stays the same character across eight directions and several actions is the real test. These studies push on that — frame counts, facing, and the small details that drift when a figure starts to move.",
          zh: "让角色在单帧里好看并不难；难的是让它在八个方向、多个动作之间仍是同一个角色。这些研究正是针对这一点——帧数、朝向，以及当形象开始运动时容易漂移的小细节。",
        },
      },
      {
        id: "detail-studies",
        nav: { en: "Studies", zh: "研究" },
        heading: { en: "What gets tested", zh: "测试的内容" },
        items: [
          {
            title: { en: "Direction & frames", zh: "方向与帧" },
            body: {
              en: "Eight-direction sets at a few frame counts to find the cheapest readable motion.",
              zh: "在几种帧数下做八方向集合，找出最经济又可读的动作。",
            },
          },
          {
            title: { en: "Action consistency", zh: "动作一致性" },
            body: {
              en: "Idle, run, attack, and cast checked side by side so the silhouette never breaks.",
              zh: "把待机、奔跑、攻击与施法并排检查，确保轮廓不崩。",
            },
          },
          {
            title: { en: "Pixel discipline", zh: "像素纪律" },
            body: {
              en: "A fixed palette and resolution keep the look intentionally pixel, not smooth-rendered.",
              zh: "固定的配色与分辨率，让画面刻意保持像素感，而非平滑渲染。",
            },
          },
        ],
      },
      {
        id: "detail-notes",
        nav: { en: "Notes", zh: "笔记" },
        heading: { en: "Toward implementation", zh: "走向实装" },
        items: [
          {
            title: { en: "Clean cutouts", zh: "干净切图" },
            body: {
              en: "Frames are prepared on flat white or black backgrounds so they slice into a sheet cleanly.",
              zh: "帧在纯白或纯黑底上准备，方便干净地切成精灵表。",
            },
          },
          {
            title: { en: "From concept to asset", zh: "从概念到资产" },
            body: {
              en: "The goal is a usable sheet, not a gallery image — every study is judged by that bar.",
              zh: "目标是一张可用的表，而不是画廊图——每次研究都用这把尺子来衡量。",
            },
          },
        ],
      },
    ],
    related: [
      {
        label: { en: "Pixel Character Lab", zh: "像素角色实验室" },
        href: "#/projects/pixel-character-lab",
        note: { en: "The Featured Work it feeds", zh: "它所支撑的精选作品" },
      },
      {
        label: { en: "Back to Visual Lab", zh: "返回视觉实验" },
        href: "#lab",
      },
    ],
  },
  {
    id: "game-ui",
    route: "#/lab/game-ui",
    kind: "lab",
    title: { en: "Game UI Experiments", zh: "游戏 UI 实验" },
    kicker: { en: "Interface & Readability", zh: "界面与可读性" },
    summary: {
      en: "Studies in game UI, tool pages, and card frames — information hierarchy, readability, and interaction feedback. These are experiments, not a finished design system.",
      zh: "围绕游戏 UI、工具页与卡牌框的研究——信息层级、可读性与交互反馈。它们是实验，而不是一套完整的设计系统。",
    },
    heroImage: {
      src: "/assets/projects/inkvoker/card-shushan.png",
      alt: {
        en: "A game card frame used to study layout and readability.",
        zh: "一张用于研究排版与可读性的游戏卡牌框。",
      },
      label: { en: "Card frame study", zh: "卡牌框研究" },
    },
    sections: [
      {
        id: "detail-overview",
        nav: { en: "Overview", zh: "概览" },
        heading: { en: "Interfaces that stay readable", zh: "始终可读的界面" },
        body: {
          en: "Game UI lives or dies on readability under pressure. These studies test how much information a card, HUD, or tool page can carry before it gets noisy — and which layers (hierarchy, contrast, feedback) earn their keep.",
          zh: "游戏 UI 的成败取决于「在高压下是否可读」。这些研究测试一张卡牌、一个 HUD 或一个工具页在变得嘈杂之前能承载多少信息——以及哪些层级（层次、对比、反馈）真正值得保留。",
        },
      },
      {
        id: "detail-studies",
        nav: { en: "Studies", zh: "研究" },
        heading: { en: "Where it shows up", zh: "应用的地方" },
        items: [
          {
            title: { en: "Card UI", zh: "卡牌 UI" },
            body: {
              en: "Frames, cost markers, and text layering explored against Inkvoker's card system.",
              zh: "围绕 Inkvoker 卡牌系统探索卡框、费用标记与文字分层。",
            },
          },
          {
            title: { en: "HUD & store", zh: "HUD 与商店" },
            body: {
              en: "Layouts for HUDs and shop panels that stay legible while busy.",
              zh: "为 HUD 与商店面板设计的布局，繁忙时依然清晰。",
            },
          },
          {
            title: { en: "Tool pages", zh: "工具页" },
            body: {
              en: "The ARAM helper tool page is a live testbed for dense, scannable layout.",
              zh: "ARAM 速查工具页是密集、可快速扫读布局的现场试验场。",
            },
          },
        ],
      },
      {
        id: "detail-notes",
        nav: { en: "Notes", zh: "笔记" },
        heading: { en: "Working principles", zh: "工作原则" },
        items: [
          {
            title: { en: "Hierarchy first", zh: "层级优先" },
            body: {
              en: "Decide what must be seen first, second, third — then style around that order.",
              zh: "先决定什么必须第一、第二、第三眼看到，再围绕这个顺序做样式。",
            },
          },
          {
            title: { en: "Feedback over decoration", zh: "反馈优先于装饰" },
            body: {
              en: "Interaction states earn space before ornament does.",
              zh: "交互状态比装饰更优先占用空间。",
            },
          },
        ],
      },
    ],
    related: [
      {
        label: { en: "Inkvoker", zh: "Inkvoker" },
        href: "#/projects/inkvoker",
        note: { en: "The card system these test against", zh: "这些研究所对照的卡牌系统" },
      },
      {
        label: { en: "Back to Visual Lab", zh: "返回视觉实验" },
        href: "#lab",
      },
    ],
  },
  {
    id: "prompt-assets",
    route: "#/lab/prompt-assets",
    kind: "lab",
    title: { en: "Prompt-based Asset Design", zh: "提示词素材设计" },
    kicker: { en: "Prompt as a Production Tool", zh: "把提示词当作生产工具" },
    summary: {
      en: "Prompt-driven asset design across VFX, characters, icons, and map tiles — focused on expressing constraints cleanly. This is a production-support workflow, not just \"AI image generation.\"",
      zh: "覆盖特效、角色、图标与地图瓦片的提示词驱动资产设计——核心是把约束表达清楚。这是一套生产辅助流程，而不只是「AI 生成图」。",
    },
    heroImage: {
      src: "/assets/projects/inkvoker/hero-concept.jpg",
      alt: {
        en: "A concept board produced through iterative prompting.",
        zh: "一块通过反复提示词迭代产出的概念拼板。",
      },
      label: { en: "Prompt iteration", zh: "提示词迭代" },
    },
    sections: [
      {
        id: "detail-overview",
        nav: { en: "Overview", zh: "概览" },
        heading: { en: "Constraints are the real prompt", zh: "约束才是真正的提示词" },
        body: {
          en: "Good asset prompts are less about clever wording and more about stating constraints the pipeline needs: background, framing, size, and intended use. The skill is making those constraints explicit and repeatable so outputs slot straight into a build.",
          zh: "好的资产提示词，重点不在花哨的措辞，而在说清流程所需的约束：背景、构图、尺寸与用途。真正的功夫，是把这些约束写得明确且可复用，让产出能直接嵌进构建。",
        },
      },
      {
        id: "detail-studies",
        nav: { en: "Constraints", zh: "约束" },
        heading: { en: "Constraints worth naming", zh: "值得明确写出的约束" },
        items: [
          {
            title: { en: "Background control", zh: "背景控制" },
            body: {
              en: "Flat white or black background, isolated subject — so cutouts are reliable.",
              zh: "纯白或纯黑底、主体独立——让切图可靠。",
            },
          },
          {
            title: { en: "Framing & view", zh: "构图与视角" },
            body: {
              en: "Top-down, sprite sheet, or centered framing stated up front.",
              zh: "事先写明俯视、精灵表或居中构图。",
            },
          },
          {
            title: { en: "Negative constraints", zh: "负约束" },
            body: {
              en: "No text, no border, no watermark — the cuts that save cleanup later.",
              zh: "无文字、无边框、无水印——这些剔除能省下后期清理。",
            },
          },
        ],
      },
      {
        id: "detail-notes",
        nav: { en: "Notes", zh: "笔记" },
        heading: { en: "How it fits production", zh: "它如何融入生产" },
        items: [
          {
            title: { en: "Iterate, don't gamble", zh: "迭代，而非碰运气" },
            body: {
              en: "Treat prompts as a tunable tool: change one constraint at a time and compare.",
              zh: "把提示词当作可调工具：一次只改一个约束再做对比。",
            },
          },
          {
            title: { en: "Human acceptance", zh: "人工验收" },
            body: {
              en: "Outputs still pass a manual quality bar before they earn a place in a build.",
              zh: "产出仍要通过人工质量关，才能在构建里占有一席之地。",
            },
          },
        ],
      },
    ],
    related: [
      {
        label: { en: "Game VFX", zh: "游戏 VFX" },
        href: "#/lab/game-vfx",
        note: { en: "Where these prompts get applied", zh: "这些提示词被应用的地方" },
      },
      {
        label: { en: "Back to Visual Lab", zh: "返回视觉实验" },
        href: "#lab",
      },
    ],
  },
  {
    id: "game-vfx",
    route: "#/lab/game-vfx",
    kind: "lab",
    title: { en: "Game VFX", zh: "游戏 VFX" },
    kicker: { en: "Effect & Feedback Studies", zh: "特效与反馈研究" },
    summary: {
      en: "Wuxia, sci-fi, and elemental VFX image studies — ice spikes, ink ripples, sword energy, poison mist, shockwaves, and particles — judged on readability, silhouette, and clean separation from the background.",
      zh: "武侠、科幻与元素特效图素研究——冰刺、墨波纹、剑气、毒雾、冲击波与粒子——以可读性、轮廓与背景分离的干净程度来评判。",
    },
    heroImage: {
      src: "/assets/projects/inkvoker/skill-shushan-sword-tomb.png",
      alt: {
        en: "A sword-energy VFX study isolated for in-game use.",
        zh: "一张为实装隔离出来的剑气特效研究。",
      },
      label: { en: "VFX study", zh: "特效研究" },
    },
    sections: [
      {
        id: "detail-overview",
        nav: { en: "Overview", zh: "概览" },
        heading: { en: "Effects that read at a glance", zh: "一眼就能读懂的特效" },
        body: {
          en: "A combat effect has a fraction of a second to communicate. These studies test elemental and wuxia VFX for clear silhouette and contrast, so the player understands what just happened without parsing the screen.",
          zh: "一个战斗特效只有一瞬间来传达信息。这些研究测试元素与武侠特效的轮廓与对比是否清晰，让玩家无需细看画面，就能明白刚刚发生了什么。",
        },
      },
      {
        id: "detail-studies",
        nav: { en: "Studies", zh: "研究" },
        heading: { en: "Effect families", zh: "特效家族" },
        items: [
          {
            title: { en: "Elemental", zh: "元素" },
            body: {
              en: "Ice spikes, poison mist, and shockwaves tuned for instant elemental read.",
              zh: "冰刺、毒雾与冲击波，为瞬间识别元素而调校。",
            },
          },
          {
            title: { en: "Wuxia energy", zh: "武侠气劲" },
            body: {
              en: "Sword energy and ink ripples that keep an expressive, hand-drawn edge.",
              zh: "剑气与墨波纹，保留富有表现力的手绘边缘。",
            },
          },
          {
            title: { en: "Particles", zh: "粒子" },
            body: {
              en: "Bursts and trails tested for impact without clutter.",
              zh: "爆发与拖尾，在不显杂乱的前提下测试冲击力。",
            },
          },
        ],
      },
      {
        id: "detail-notes",
        nav: { en: "Notes", zh: "笔记" },
        heading: { en: "Implementation notes", zh: "实装笔记" },
        items: [
          {
            title: { en: "Background separation", zh: "背景分离" },
            body: {
              en: "Effects are studied on neutral backgrounds so they cut out cleanly for engine use.",
              zh: "特效在中性背景上研究，便于干净抠出供引擎使用。",
            },
          },
          {
            title: { en: "Readability first", zh: "可读性优先" },
            body: {
              en: "Silhouette and contrast come before flourish — clarity wins in combat.",
              zh: "轮廓与对比优先于花哨——战斗中清晰最重要。",
            },
          },
        ],
      },
    ],
    related: [
      {
        label: { en: "Prompt-based Asset Design", zh: "提示词素材设计" },
        href: "#/lab/prompt-assets",
        note: { en: "How these are produced", zh: "它们的产出方式" },
      },
      {
        label: { en: "Back to Visual Lab", zh: "返回视觉实验" },
        href: "#lab",
      },
    ],
  },
  {
    id: "world-concepts",
    route: "#/lab/world-concepts",
    kind: "lab",
    title: { en: "World Concepts", zh: "世界概念" },
    kicker: { en: "Visual Direction & Concept", zh: "视觉方向与概念" },
    summary: {
      en: "World concepts and scene directions — map tiles, abandoned space stations, and wuxia-fantasy settings. This is visual direction and concept exploration, not a finished game world.",
      zh: "世界概念与场景方向——地图瓦片、废弃空间站与武侠幻想设定。这是视觉方向与概念探索，而不是一个已完成的游戏世界。",
    },
    heroImage: {
      src: "/assets/projects/inkvoker/hero-map.jpg",
      alt: {
        en: "A concept frame exploring a world and scene direction.",
        zh: "一张探索世界与场景方向的概念画面。",
      },
      label: { en: "World concept", zh: "世界概念" },
    },
    sections: [
      {
        id: "detail-overview",
        nav: { en: "Overview", zh: "概览" },
        heading: { en: "Directions, not destinations", zh: "方向，而非终点" },
        body: {
          en: "Before a world is built, it needs a direction worth building. These frames explore tone and place — a wuxia-fantasy valley, an abandoned station corridor, a map tile set — as concept exploration rather than finished levels.",
          zh: "在一个世界被建造之前，它需要一个值得建造的方向。这些画面探索基调与场所——武侠幻想的山谷、废弃空间站的走廊、一组地图瓦片——它们是概念探索，而非成品关卡。",
        },
      },
      {
        id: "detail-studies",
        nav: { en: "Directions", zh: "方向" },
        heading: { en: "Concept directions", zh: "概念方向" },
        items: [
          {
            title: { en: "Wuxia-fantasy", zh: "武侠幻想" },
            body: {
              en: "Ink-and-energy landscapes that pair with the Inkvoker direction.",
              zh: "与 Inkvoker 方向相配的水墨与能量景观。",
            },
          },
          {
            title: { en: "Sci-fi spaces", zh: "科幻空间" },
            body: {
              en: "Abandoned stations and interior corridors for a colder, quieter mood.",
              zh: "废弃空间站与室内走廊，营造更冷、更安静的氛围。",
            },
          },
          {
            title: { en: "Map tiles", zh: "地图瓦片" },
            body: {
              en: "Tile directions tested for how they'd repeat across a top-down space.",
              zh: "测试瓦片方向在俯视空间中如何重复拼接。",
            },
          },
        ],
      },
      {
        id: "detail-notes",
        nav: { en: "Notes", zh: "笔记" },
        heading: { en: "How to read these", zh: "如何看待这些" },
        items: [
          {
            title: { en: "Exploration, not promise", zh: "探索，而非承诺" },
            body: {
              en: "These set a mood to aim for; they are not a shipped game world.",
              zh: "它们设定一个值得追求的基调，而不是已发布的游戏世界。",
            },
          },
          {
            title: { en: "Feeds production later", zh: "为后续生产供料" },
            body: {
              en: "A kept direction becomes the brief for tiles, props, and lighting.",
              zh: "被保留的方向会成为瓦片、道具与光照的需求依据。",
            },
          },
        ],
      },
    ],
    related: [
      {
        label: { en: "Fluid / Sci-fi Effects", zh: "流体 / 科幻特效" },
        href: "#/lab/fluid-effects",
        note: { en: "Surface language for these worlds", zh: "这些世界所用的材质语言" },
      },
      {
        label: { en: "Back to Visual Lab", zh: "返回视觉实验" },
        href: "#lab",
      },
    ],
  },
];
