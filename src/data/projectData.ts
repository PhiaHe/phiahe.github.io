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
    src: asset("hero-concept.jpg"),
    alt: {
      en: "Concept visual for Inkvoker showing martial arts technique cards orbiting an ink formation.",
      zh: "墨唤战场：水墨风格的竞技场，武学自动战斗在此展开。",
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
      src: asset("hero-concept.jpg"),
      alt: {
        en: "Concept visual of martial arts technique cards around an ink formation.",
        zh: "武学招式卡环绕水墨阵法的概念视觉。",
      },
      label: { en: "Concept Visual", zh: "概念视觉" },
      kind: "concept-visual",
    },
    {
      src: asset("hero-map.jpg"),
      alt: {
        en: "Ink-wash battlefield map used in the prototype.",
        zh: "原型中使用的水墨风格战场地图。",
      },
      label: { en: "Battlefield Map", zh: "战场地图" },
      kind: "real-asset",
    },
    {
      src: asset("character-cyber-fox.png"),
      alt: { en: "Player character sprite sheet asset.", zh: "玩家角色精灵表素材。" },
      label: { en: "Player Sprite Sheet", zh: "玩家精灵表" },
      kind: "real-asset",
    },
    {
      src: asset("enemy-bai-hu-wu-zhe.png"),
      alt: { en: "Bai Hu Wu Zhe enemy sprite sheet asset.", zh: "白虎武者敌人精灵表素材。" },
      label: { en: "Enemy Sprite Sheet", zh: "敌人精灵表" },
      kind: "real-asset",
    },
    {
      src: asset("skill-shushan-sword-tomb.png"),
      alt: { en: "Shushan sword tomb skill visual effect asset.", zh: "蜀山剑冢技能视觉特效素材。" },
      label: { en: "Skill VFX", zh: "技能特效" },
      kind: "real-asset",
    },
    {
      src: asset("field-wudang-taiji.png"),
      alt: { en: "Wudang taiji field combo visual asset.", zh: "武当太极场地组合视觉素材。" },
      label: { en: "Combo Field", zh: "组合场地" },
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
