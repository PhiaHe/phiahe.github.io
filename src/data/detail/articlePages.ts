/* =============================================================================
 * Phia Games — Article Detail Pages (Bilingual EN / ZH)
 * -----------------------------------------------------------------------------
 * Dev Log entries rendered as articles. Neutral studio-note tone — not a memoir,
 * not a marketing post. Each article uses a few short body sections plus a
 * "Key Takeaways" section (items) and related links.
 *
 * Image note (foundation round): reuses existing on-brand assets until Codex
 * delivers the dedicated `detail-pages/*` art. Swap `src` paths later.
 * ============================================================================= */

import type { DetailPage } from "./detailTypes";

export const articlePages: DetailPage[] = [
  {
    id: "ai-workflow",
    route: "#/notes/ai-workflow",
    kind: "article",
    title: { en: "An AI-assisted game development workflow", zh: "一套 AI 辅助的游戏开发流程" },
    kicker: { en: "Dev Log / Workflow", zh: "开发日志 / 流程" },
    summary: {
      en: "How generation, prompts, and human judgment combine into a fast loop for building small, playable ideas — and where each part actually helps.",
      zh: "生成、提示词与人的判断如何组合成一个快速循环，用来打造可玩的小点子——以及每一环到底在哪里真正起作用。",
    },
    heroImage: {
      src: "/assets/projects/inkvoker/hero-map.jpg",
      alt: {
        en: "A production desk view of an in-progress game build.",
        zh: "正在开发中的游戏构建的工作台视角。",
      },
      label: { en: "Workflow", zh: "工作流程" },
    },
    sections: [
      {
        id: "detail-article",
        nav: { en: "Article", zh: "正文" },
        heading: { en: "Why AI in a small creative workflow", zh: "小型创作流程里为什么用 AI" },
        body: {
          en: "For a one-person lab, the bottleneck is rarely ideas — it's the distance between an idea and something you can actually play or look at. AI tools shorten that distance. They are most useful early, when the cost of a wrong direction is low and the value of seeing many directions quickly is high.",
          zh: "对一个一人实验室来说，瓶颈很少是点子本身——而是点子与「能真正玩到或看到的东西」之间的距离。AI 工具缩短了这段距离。它们在早期最有用：那时走错方向的代价很低，而快速看到许多方向的价值很高。",
        },
      },
      {
        id: "detail-body",
        nav: { en: "Loop", zh: "循环" },
        heading: { en: "From brief to playable", zh: "从需求到可玩" },
        body: {
          en: "The loop is short on purpose: write a small brief, generate or sketch options, keep the few that work, and move them into a build. Generation helps most with first drafts and visual variants. Human judgment stays essential for taste, consistency, and deciding what is actually worth keeping — the model proposes, but it does not get to decide the direction.",
          zh: "这个循环刻意保持简短：写一份小需求，生成或手绘若干选项，留下少数可用的，再把它们放进构建里。生成在初稿和视觉变体上帮助最大。而品味、一致性，以及判断什么才真正值得保留，仍然依赖人——模型负责提议，但方向不由它来定。",
        },
      },
      {
        id: "detail-takeaways",
        nav: { en: "Takeaways", zh: "要点" },
        heading: { en: "Key takeaways", zh: "关键要点" },
        items: [
          {
            title: { en: "Generation is for drafts", zh: "生成用于初稿" },
            body: {
              en: "Use it to get to a first version fast, not to ship the final one untouched.",
              zh: "用它快速得到第一版，而不是原封不动地把它当成成品发布。",
            },
          },
          {
            title: { en: "Judgment is the bottleneck", zh: "判断才是瓶颈" },
            body: {
              en: "Curation and cleanup decide quality far more than the prompt does.",
              zh: "挑选与清理对质量的影响，远大于提示词本身。",
            },
          },
          {
            title: { en: "Keep the loop short", zh: "让循环保持简短" },
            body: {
              en: "Playable-or-visible beats polished — feedback comes from seeing it, not planning it.",
              zh: "能玩到、能看到，胜过打磨得很完美——反馈来自看到它，而不是规划它。",
            },
          },
        ],
      },
    ],
    related: [
      {
        label: { en: "Inkvoker", zh: "Inkvoker" },
        href: "#/projects/inkvoker",
        note: { en: "Built with this workflow", zh: "正是用这套流程构建的" },
      },
      {
        label: { en: "Back to Dev Log", zh: "返回开发日志" },
        href: "#devlog",
      },
    ],
  },
];
