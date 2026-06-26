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
];
