/* =============================================================================
 * Phia Games — Editable Site Content (Bilingual EN / ZH)
 * -----------------------------------------------------------------------------
 * Single source of truth for site content.
 *
 *  - Localized text uses the `Localized<T>` shape: { en, zh }. Default language
 *    is English; the language toggle switches the active value at render time
 *    (see src/i18n/LanguageContext.tsx + the t() helper).
 *  - Structural / non-text fields (ids, tags, image paths, accents) are shared
 *    across languages and live directly on each item.
 *  - Swap placeholder cover art by replacing files in
 *    `public/assets/placeholders/` (keep filenames) or repoint `cover` paths.
 *
 * To add a language later: extend `Lang`, add the key to every Localized value.
 * ============================================================================= */

export type Lang = "en" | "zh";

export type Localized<T = string> = Record<Lang, T>;

export interface NavLink {
  label: Localized;
  href: string;
}

export interface FeaturedWork {
  id: string;
  index: string;
  title: Localized;
  description: Localized;
  tags: Localized[]; // localized; switches to Chinese with the language toggle
  cover: string;
  accent: "cyan" | "violet" | "gold";
  status: Localized;
  href?: string; // optional project-detail route (e.g. "#/projects/inkvoker")
}

export interface LabCategory {
  id: string;
  title: Localized;
  blurb: Localized;
  cover: string;
  count: Localized;
}

export interface DevLogEntry {
  id: string;
  title: Localized;
  summary: Localized;
  tag: Localized;
  readTime: Localized;
  cover: string;
}

export interface SocialLink {
  label: Localized;
  href: string;
  handle: string;
}

/* ----------------------------------------------------------------------------- */

export const site = {
  brand: "Phia Games", // brand name stays as-is in both languages
  domain: "phiagames.com",
  github: "https://github.com/PhiaHe",
  email: "phiahhj@gmail.com",
};

export const ui = {
  getInTouch: { en: "Get in touch", zh: "联系我" } as Localized,
  skipToContent: { en: "Skip to content", zh: "跳到主内容" } as Localized,
  scroll: { en: "Scroll", zh: "向下滚动" } as Localized,
  exploreSet: { en: "Explore set", zh: "查看系列" } as Localized,
  readNote: { en: "Read note", zh: "阅读笔记" } as Localized,
  read: { en: "read", zh: "阅读" } as Localized,
  langName: { en: "EN", zh: "中" } as Localized,
  placeholderNote: {
    en: "// Placeholder tiles — replace covers in public/assets/placeholders/",
    zh: "// 占位图 — 替换 public/assets/placeholders/ 中的封面即可",
  } as Localized,
};

export const nav: NavLink[] = [
  { label: { en: "Work", zh: "作品" }, href: "#work" },
  { label: { en: "Visual Lab", zh: "视觉实验" }, href: "#lab" },
  { label: { en: "Dev Log", zh: "开发日志" }, href: "#devlog" },
  { label: { en: "About", zh: "关于" }, href: "#about" },
  { label: { en: "Contact", zh: "联系" }, href: "#contact" },
];

export const hero = {
  kicker: { en: "Creative Game Lab", zh: "创意游戏实验室" } as Localized,
  title: "Phia Games",
  subtitle: {
    en: "AI-assisted game experiments, visual systems, and interactive worlds.",
    zh: "AI 辅助的游戏实验、视觉系统与交互世界。",
  } as Localized,
  intro: {
    en: "A personal creative lab for game prototypes, pixel characters, visual systems, and AI-assisted production workflows.",
    zh: "一个属于个人的创意实验室，专注游戏原型、像素角色、视觉系统与 AI 辅助的生产流程。",
  } as Localized,
  primaryCta: { label: { en: "View Work", zh: "查看作品" } as Localized, href: "#work" },
  secondaryCta: { label: { en: "Visual Lab", zh: "视觉实验" } as Localized, href: "#lab" },
  readouts: [
    { k: { en: "SYSTEM", zh: "系统" }, v: { en: "PHIA // LAB-01", zh: "PHIA // LAB-01" } },
    { k: { en: "MODE", zh: "模式" }, v: { en: "EXPERIMENTAL", zh: "实验中" } },
    { k: { en: "STACK", zh: "技术栈" }, v: { en: "GODOT · AI · PIXEL", zh: "GODOT · AI · PIXEL" } },
  ] as { k: Localized; v: Localized }[],
  // Small stat strip under the hero for a stronger, less-empty first screen.
  stats: [
    { value: "03", label: { en: "Active tracks", zh: "进行中方向" } as Localized },
    { value: "AI", label: { en: "Assisted workflow", zh: "辅助流程" } as Localized },
    { value: "∞", label: { en: "Experiments", zh: "持续实验" } as Localized },
  ],
};

export const featuredWork: FeaturedWork[] = [
  {
    id: "inkvoker",
    index: "01",
    title: { en: "Inkvoker", zh: "Inkvoker" },
    description: {
      en: "An action card-based game prototype exploring elemental combat, visual feedback, card systems, and AI-assisted iteration. Its visual direction is still open — somewhere between fluid energy and refined sci-fi.",
      zh: "一款动作卡牌游戏原型，探索元素战斗、视觉反馈、卡牌系统与 AI 辅助迭代。它的视觉方向仍然开放——介于流动能量与精致科幻之间。",
    },
    tags: [
      { en: "Godot", zh: "Godot" },
      { en: "Action Cards", zh: "动作卡牌" },
      { en: "Elemental Combat", zh: "元素战斗" },
      { en: "Visual Feedback", zh: "视觉反馈" },
      { en: "AI-assisted Development", zh: "AI 辅助开发" },
    ],
    cover: "/assets/placeholders/work-inkvoker.svg",
    accent: "cyan",
    status: { en: "Prototype in motion", zh: "原型进行中" },
    href: "#/projects/inkvoker",
  },
  {
    id: "visual-experiments",
    index: "02",
    title: { en: "Visual Experiments", zh: "视觉实验" },
    description: {
      en: "A growing archive of visual tests, prompt-driven assets, sci-fi surfaces, sprite sheets, interface moods, and game-feel studies.",
      zh: "一个不断扩充的视觉档案：视觉测试、提示词驱动的素材、科幻材质、精灵表、界面氛围与游戏手感研究。",
    },
    tags: [
      { en: "Visual Systems", zh: "视觉系统" },
      { en: "Prompt Design", zh: "提示词设计" },
      { en: "Sci-fi UI", zh: "科幻 UI" },
      { en: "Game Feel", zh: "游戏手感" },
    ],
    cover: "/assets/placeholders/work-visual.svg",
    accent: "violet",
    status: { en: "Always expanding", zh: "持续扩充" },
  },
  {
    id: "pixel-character-lab",
    index: "03",
    title: { en: "Pixel Character Lab", zh: "像素角色实验室" },
    description: {
      en: "Character sprites, movement sheets, action poses, and stylized pixel art explorations for top-down and semi-top-down games.",
      zh: "角色精灵、动作表、姿态帧，以及面向俯视与半俯视游戏的风格化像素艺术探索。",
    },
    tags: [
      { en: "Pixel Art", zh: "像素艺术" },
      { en: "Sprite Sheets", zh: "精灵表" },
      { en: "Character Motion", zh: "角色动作" },
      { en: "Game Assets", zh: "游戏素材" },
    ],
    cover: "/assets/placeholders/work-pixel.svg",
    accent: "gold",
    status: { en: "Sprite work", zh: "精灵创作中" },
  },
];

export const labCategories: LabCategory[] = [
  {
    id: "pixel-characters",
    title: { en: "Pixel Characters", zh: "像素角色" },
    blurb: {
      en: "Sprites, idle loops, and action frames for expressive top-down play.",
      zh: "精灵、待机循环与动作帧，服务于富有表现力的俯视玩法。",
    },
    cover: "/assets/placeholders/lab-pixel.svg",
    count: { en: "Sprite sets", zh: "精灵集" },
  },
  {
    id: "fluid-effects",
    title: { en: "Fluid / Sci-fi Effects", zh: "流体 / 科幻特效" },
    blurb: {
      en: "Liquid-energy shaders, aurora fields, and holographic surface tests.",
      zh: "液态能量着色、极光场与全息表面测试。",
    },
    cover: "/assets/placeholders/lab-fluid.svg",
    count: { en: "Motion studies", zh: "动态研究" },
  },
  {
    id: "game-ui",
    title: { en: "Game UI Experiments", zh: "游戏 UI 实验" },
    blurb: {
      en: "HUDs, card frames, and interface moods built for readable game-feel.",
      zh: "HUD、卡牌框与界面氛围，为清晰的游戏手感而设计。",
    },
    cover: "/assets/placeholders/lab-ui.svg",
    count: { en: "Interface moods", zh: "界面氛围" },
  },
  {
    id: "prompt-assets",
    title: { en: "Prompt-based Asset Design", zh: "提示词素材设计" },
    blurb: {
      en: "Prompt-driven textures, tiles, and concept directions for iteration.",
      zh: "提示词驱动的材质、瓦片与概念方向，用于快速迭代。",
    },
    cover: "/assets/placeholders/lab-prompt.svg",
    count: { en: "Prompt sets", zh: "提示词集" },
  },
  {
    id: "game-vfx",
    title: { en: "Game VFX", zh: "游戏 VFX" },
    blurb: {
      en: "Impact flashes, elemental bursts, and feedback layers (optional set).",
      zh: "受击闪光、元素爆发与反馈层（可选系列）。",
    },
    cover: "/assets/placeholders/lab-vfx.svg",
    count: { en: "Effect tests", zh: "特效测试" },
  },
  {
    id: "concept",
    title: { en: "Concept Placeholders", zh: "概念占位" },
    blurb: {
      en: "Reserved tiles for upcoming worlds, characters, and systems.",
      zh: "为即将到来的世界、角色与系统预留的位置。",
    },
    cover: "/assets/placeholders/lab-concept.svg",
    count: { en: "Reserved", zh: "预留" },
  },
];

export const devLog: DevLogEntry[] = [
  {
    id: "ai-workflow",
    title: {
      en: "An AI-assisted game development workflow",
      zh: "一套 AI 辅助的游戏开发流程",
    },
    summary: {
      en: "How prompts, generation, and human judgment combine into a fast loop for building small, playable ideas.",
      zh: "提示词、生成与人的判断如何组合成一个快速循环，用来打造可玩的小点子。",
    },
    tag: { en: "Workflow", zh: "流程" },
    readTime: { en: "6 min", zh: "6 分钟" },
    cover: "/assets/placeholders/log-workflow.svg",
  },
  {
    id: "combat-readability",
    title: {
      en: "Visual feedback and combat readability",
      zh: "视觉反馈与战斗可读性",
    },
    summary: {
      en: "Tuning hit flashes, timing, and color so elemental combat reads clearly at a glance.",
      zh: "调校受击闪光、时机与配色，让元素战斗一眼就能看懂。",
    },
    tag: { en: "Game Feel", zh: "游戏手感" },
    readTime: { en: "5 min", zh: "5 分钟" },
    cover: "/assets/placeholders/log-combat.svg",
  },
  {
    id: "pixel-iteration",
    title: { en: "Pixel character iteration", zh: "像素角色的迭代" },
    summary: {
      en: "From rough silhouette to clean motion sheet — a practical look at iterating sprites.",
      zh: "从粗略剪影到干净的动作表——一份关于精灵迭代的实战记录。",
    },
    tag: { en: "Pixel Art", zh: "像素艺术" },
    readTime: { en: "4 min", zh: "4 分钟" },
    cover: "/assets/placeholders/log-pixel.svg",
  },
  {
    id: "prompt-engineering",
    title: {
      en: "Prompt engineering for game assets",
      zh: "面向游戏素材的提示词工程",
    },
    summary: {
      en: "Building reliable prompt recipes for consistent surfaces, tiles, and concept art.",
      zh: "构建可靠的提示词配方，产出一致的材质、瓦片与概念图。",
    },
    tag: { en: "Prompt Design", zh: "提示词设计" },
    readTime: { en: "7 min", zh: "7 分钟" },
    cover: "/assets/placeholders/log-prompt.svg",
  },
  {
    id: "prototype-validation",
    title: {
      en: "Prototype validation and design notes",
      zh: "原型验证与设计笔记",
    },
    summary: {
      en: "Deciding what to keep, cut, or rebuild after a prototype meets the controller.",
      zh: "当原型第一次接上手柄后，决定哪些保留、哪些砍掉、哪些重做。",
    },
    tag: { en: "Design", zh: "设计" },
    readTime: { en: "5 min", zh: "5 分钟" },
    cover: "/assets/placeholders/log-validation.svg",
  },
];

export const about = {
  kicker: { en: "About the Lab", zh: "关于实验室" } as Localized,
  heading: {
    en: "A personal space for expressive, readable game ideas.",
    zh: "一个属于个人的空间，让游戏点子既有表现力又清晰可读。",
  } as Localized,
  body: {
    en: "Phia Games is a personal creative space for building and documenting game prototypes, visual systems, and AI-assisted production workflows. The focus is on making small playable ideas feel expressive, readable, and visually distinct.",
    zh: "Phia Games 是一个个人创意空间，用来构建并记录游戏原型、视觉系统与 AI 辅助的生产流程。核心目标是让可玩的小点子拥有表现力、可读性与鲜明的视觉风格。",
  } as Localized,
  pillars: [
    {
      title: { en: "Prototype-first", zh: "原型优先" } as Localized,
      text: {
        en: "Small playable ideas over big promises. Build, feel it, iterate.",
        zh: "用可玩的小点子代替宏大的承诺。先做出来，去感受，再迭代。",
      } as Localized,
    },
    {
      title: { en: "AI-assisted", zh: "AI 辅助" } as Localized,
      text: {
        en: "Generation and prompts as tools, paired with human craft and judgment.",
        zh: "把生成与提示词当作工具，配合人的手艺与判断。",
      } as Localized,
    },
    {
      title: { en: "Visually distinct", zh: "视觉鲜明" } as Localized,
      text: {
        en: "Every experiment aims for a clear, readable, memorable look.",
        zh: "每一次实验都追求清晰、可读且令人记住的画面。",
      } as Localized,
    },
  ],
};

export const contact = {
  kicker: { en: "Get in touch", zh: "联系方式" } as Localized,
  heading: {
    en: "Let's build something expressive.",
    zh: "一起做点有表现力的东西。",
  } as Localized,
  closing: {
    en: "Built as a living archive of games, visuals, and experiments.",
    zh: "作为一座不断生长的档案库，收纳游戏、视觉与实验。",
  } as Localized,
  socials: [
    { label: { en: "GitHub", zh: "GitHub" }, href: site.github, handle: "@PhiaHe" },
    { label: { en: "Email", zh: "邮箱" }, href: `mailto:${site.email}`, handle: site.email },
    { label: { en: "Web", zh: "网站" }, href: "https://phiagames.com", handle: "phiagames.com" },
  ] as SocialLink[],
};
