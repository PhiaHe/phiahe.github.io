/* =============================================================================
 * Phia Games — Article Detail Pages (Bilingual EN / ZH)
 * -----------------------------------------------------------------------------
 * Dev Log entries rendered as articles. Neutral studio-note tone — not a memoir,
 * not a marketing post. Each article uses a few short body sections plus a
 * "Key Takeaways" section (items) and related links.
 *
 * Image note: article detail pages use the dedicated image pack under
 * `public/assets/detail-pages/<slug>/hero.jpg`.
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
      src: "/assets/detail-pages/ai-workflow/hero.jpg",
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
  {
    id: "combat-readability",
    route: "#/notes/combat-readability",
    kind: "article",
    title: { en: "Combat readability and card text layering", zh: "战斗可读性与卡牌文字分层" },
    kicker: { en: "Dev Log / Game Feel", zh: "开发日志 / 游戏手感" },
    summary: {
      en: "A short note on keeping action-card combat readable: layering card text across tooltip, small card, and large card, and unstacking a crowded HUD.",
      zh: "一篇关于「让动作卡牌战斗保持可读」的短笔记：把卡牌文字分布到 tooltip、小卡与大卡三层，并疏解拥挤的 HUD。",
    },
    heroImage: {
      src: "/assets/detail-pages/combat-readability/hero.jpg",
      alt: {
        en: "A combat card whose text has to read at several sizes.",
        zh: "一张文字需要在多种尺寸下都可读的战斗卡牌。",
      },
      label: { en: "Card readability", zh: "卡牌可读性" },
    },
    sections: [
      {
        id: "detail-article",
        nav: { en: "Article", zh: "正文" },
        heading: { en: "The HUD gets crowded fast", zh: "HUD 很快就会变挤" },
        body: {
          en: "In an action card game the same card shows up at very different sizes: a tiny slot in the HUD, a small card in hand, and a large card on inspect. The text that fits the large card drowns the small one. The fix is to decide, per size, what a player actually needs to read in that moment.",
          zh: "在动作卡牌游戏里，同一张卡会以差别很大的尺寸出现：HUD 里的小格、手牌里的小卡、查看时的大卡。适配大卡的文字会淹没小卡。解决办法是按尺寸决定：玩家在那一刻到底需要读到什么。",
        },
      },
      {
        id: "detail-body",
        nav: { en: "Layers", zh: "分层" },
        heading: { en: "Three layers of information", zh: "三层信息" },
        body: {
          en: "The tooltip carries the full rules text. The small card carries the cost, the effect verb, and the magnitude. The HUD slot carries only the icon and a number. Each layer is a strict subset of the one below it, so nothing contradicts and the player learns one shape. A shared unit helps too: stating range as \"100px = 1 step\" keeps numbers comparable across cards.",
          zh: "tooltip 承载完整规则文字。小卡承载费用、效果动词与数值大小。HUD 小格只承载图标和一个数字。每一层都是下一层的严格子集，因此彼此不矛盾，玩家只需学会一种形态。统一的单位也有帮助：把射程表达为「100px = 1 步」，让不同卡牌的数值可以互相比较。",
        },
      },
      {
        id: "detail-takeaways",
        nav: { en: "Takeaways", zh: "要点" },
        heading: { en: "Key takeaways", zh: "关键要点" },
        items: [
          {
            title: { en: "Read by size", zh: "按尺寸取舍" },
            body: {
              en: "Decide what each size must show; don't shrink the full text to fit.",
              zh: "决定每种尺寸必须显示什么，而不是把完整文字缩小塞进去。",
            },
          },
          {
            title: { en: "Subset, not restyle", zh: "子集，而非重排版" },
            body: {
              en: "Each smaller layer is a subset of the bigger one, so nothing conflicts.",
              zh: "每个更小的层都是更大层的子集，因此不会冲突。",
            },
          },
          {
            title: { en: "One shared unit", zh: "统一单位" },
            body: {
              en: "\"100px = 1 step\" keeps ranges comparable across every card.",
              zh: "「100px = 1 步」让每张卡的射程都可比较。",
            },
          },
        ],
      },
    ],
    related: [
      {
        label: { en: "Inkvoker", zh: "Inkvoker" },
        href: "#/projects/inkvoker",
        note: { en: "The card system in question", zh: "正是这套卡牌系统" },
      },
      {
        label: { en: "Back to Dev Log", zh: "返回开发日志" },
        href: "#devlog",
      },
    ],
  },
  {
    id: "pixel-iteration",
    route: "#/notes/pixel-iteration",
    kind: "article",
    title: { en: "A pixel character iteration loop", zh: "一套像素角色迭代流程" },
    kicker: { en: "Dev Log / Pixel Art", zh: "开发日志 / 像素艺术" },
    summary: {
      en: "How a single character image becomes an implementable sprite sheet: eight directions, action frames, background recolor, and facing fixes — held together by prompt constraints and human acceptance.",
      zh: "一张角色图如何变成可实装的精灵表：八方向、动作帧、背景换色与朝向修正——靠提示词约束和人工验收串起来。",
    },
    heroImage: {
      src: "/assets/detail-pages/pixel-iteration/hero.jpg",
      alt: {
        en: "A character study being worked toward a sprite sheet.",
        zh: "一张正被推进为精灵表的角色研究。",
      },
      label: { en: "Iteration subject", zh: "迭代对象" },
    },
    sections: [
      {
        id: "detail-article",
        nav: { en: "Article", zh: "正文" },
        heading: { en: "One image is not a sprite sheet", zh: "一张图不等于一张精灵表" },
        body: {
          en: "A good character image is a starting point, not an asset. To move it into a game you need every direction, a few action frames per direction, and consistent proportions throughout. The gap between \"nice picture\" and \"usable sheet\" is most of the work.",
          zh: "一张好看的角色图是起点，不是资产。要把它放进游戏，你需要每个方向、每个方向若干动作帧，以及全程一致的比例。「好看的图」与「可用的表」之间的距离，才是大部分工作量所在。",
        },
      },
      {
        id: "detail-body",
        nav: { en: "Loop", zh: "循环" },
        heading: { en: "The loop in practice", zh: "实际的循环" },
        body: {
          en: "Prompt a base pose, then generate the eight headings; recolor or flatten the background so frames isolate cleanly; correct facing and proportion drift by hand; and check the set together for a stable silhouette. Constraints in the prompt (flat background, isolated, sprite sheet) cut cleanup, but a human still signs off on every frame before it ships.",
          zh: "先提示一个基础姿态，再生成八个朝向；对背景换色或压平，让帧能干净地抠出；手动修正朝向与比例漂移；并把整组放在一起检查轮廓是否稳定。提示词里的约束（纯色背景、独立、精灵表）能减少清理，但每一帧仍要由人验收后才实装。",
        },
      },
      {
        id: "detail-takeaways",
        nav: { en: "Takeaways", zh: "要点" },
        heading: { en: "Key takeaways", zh: "关键要点" },
        items: [
          {
            title: { en: "Plan the whole set", zh: "规划整组" },
            body: {
              en: "Generate directions and actions as a set, not one frame at a time.",
              zh: "把方向与动作作为一组来生成，而不是一帧一帧地做。",
            },
          },
          {
            title: { en: "Fix facing by hand", zh: "手动修正朝向" },
            body: {
              en: "Facing and proportion drift is the most common failure; correct it directly.",
              zh: "朝向与比例漂移是最常见的问题；直接动手修。",
            },
          },
          {
            title: { en: "Human acceptance", zh: "人工验收" },
            body: {
              en: "Prompt constraints reduce cleanup, but a person approves each frame.",
              zh: "提示词约束减少清理，但每一帧都由人来确认。",
            },
          },
        ],
      },
    ],
    related: [
      {
        label: { en: "Pixel Characters (Lab)", zh: "像素角色（视觉实验）" },
        href: "#/lab/pixel-characters",
        note: { en: "The studies behind this loop", zh: "支撑这套流程的研究" },
      },
      {
        label: { en: "Back to Dev Log", zh: "返回开发日志" },
        href: "#devlog",
      },
    ],
  },
  {
    id: "prompt-engineering",
    route: "#/notes/prompt-engineering",
    kind: "article",
    title: { en: "Prompt engineering for game assets", zh: "面向游戏素材的提示词工程" },
    kicker: { en: "Dev Log / Prompt Design", zh: "开发日志 / 提示词设计" },
    summary: {
      en: "Notes on practical prompting for game assets — describing constraints, negative constraints, background and composition control, size, and use. Treated as an iterative tool, not a magic solution.",
      zh: "关于游戏素材实用提示词的笔记——描述约束、负约束、背景与构图控制、尺寸与用途。把它当作一个迭代工具，而不是万能方案。",
    },
    heroImage: {
      src: "/assets/detail-pages/prompt-engineering/hero.jpg",
      alt: {
        en: "A concept image refined through iterative prompting.",
        zh: "一张通过反复提示词打磨出来的概念图。",
      },
      label: { en: "Prompt output", zh: "提示词产出" },
    },
    sections: [
      {
        id: "detail-article",
        nav: { en: "Article", zh: "正文" },
        heading: { en: "Describe the constraints, not the dream", zh: "描述约束，而非梦想" },
        body: {
          en: "The prompts that produce usable game assets read less like wishes and more like a spec: what the subject is, what the background must be, how it's framed, what size it targets, and what it's for. Vague, evocative prompts make pretty images; specific, constrained prompts make assets you can drop into a build.",
          zh: "能产出可用游戏素材的提示词，读起来不像愿望，更像一份规格说明：主体是什么、背景必须是什么、如何构图、目标尺寸多大、用途是什么。含糊而富有意境的提示词产出漂亮的图；具体而带约束的提示词产出能直接放进构建的资产。",
        },
      },
      {
        id: "detail-body",
        nav: { en: "Recipe", zh: "配方" },
        heading: { en: "A repeatable recipe", zh: "一份可复用的配方" },
        body: {
          en: "State the subject and style, then the hard constraints: flat white or black background, isolated, top-down or sprite-sheet framing, no text. Add negative constraints to cut what keeps creeping in. Then iterate one variable at a time — it's a tool you tune, not a slot machine you pull, and it never replaces a human quality pass.",
          zh: "先写明主体与风格，再写硬约束：纯白或纯黑底、主体独立、俯视或精灵表构图、无文字。加入负约束来剔除反复混进来的东西。然后一次只迭代一个变量——它是你调校的工具，而不是拉一把的老虎机，也永远替代不了人工的质量把关。",
        },
      },
      {
        id: "detail-takeaways",
        nav: { en: "Takeaways", zh: "要点" },
        heading: { en: "Key takeaways", zh: "关键要点" },
        items: [
          {
            title: { en: "Prompt as spec", zh: "提示词即规格" },
            body: {
              en: "State background, framing, size, and use up front — those drive the result.",
              zh: "事先写明背景、构图、尺寸与用途——它们决定结果。",
            },
          },
          {
            title: { en: "Use negatives", zh: "用负约束" },
            body: {
              en: "Negative constraints remove what keeps sneaking back in.",
              zh: "负约束移除那些反复溜回来的东西。",
            },
          },
          {
            title: { en: "Tune, don't gamble", zh: "调校，而非碰运气" },
            body: {
              en: "Change one variable at a time; it's an iterative tool, not magic.",
              zh: "一次只改一个变量；它是迭代工具，不是魔法。",
            },
          },
        ],
      },
    ],
    related: [
      {
        label: { en: "Prompt-based Asset Design", zh: "提示词素材设计" },
        href: "#/lab/prompt-assets",
        note: { en: "The lab this note comes from", zh: "这篇笔记所属的实验" },
      },
      {
        label: { en: "Back to Dev Log", zh: "返回开发日志" },
        href: "#devlog",
      },
    ],
  },
  {
    id: "prototype-validation",
    route: "#/notes/prototype-validation",
    kind: "article",
    title: { en: "Validating prototypes quickly", zh: "快速验证原型" },
    kicker: { en: "Dev Log / Process", zh: "开发日志 / 流程" },
    summary: {
      en: "How small projects — Inkvoker, the ARAM tool, visual experiments — get validated fast: build, lint, and test, then a real check on device and after deploy. The rule is make it work first, then enhance.",
      zh: "小项目——Inkvoker、ARAM 工具、视觉实验——如何被快速验证：build、lint、test，再做实机检查与上线后检查。原则是先可用，再增强。",
    },
    heroImage: {
      src: "/assets/detail-pages/prototype-validation/hero.jpg",
      alt: {
        en: "An in-progress build frame used to validate a prototype.",
        zh: "一张用于验证原型的开发中构建画面。",
      },
      label: { en: "Validation frame", zh: "验证画面" },
    },
    sections: [
      {
        id: "detail-article",
        nav: { en: "Article", zh: "正文" },
        heading: { en: "Cheap checks before expensive ones", zh: "先做便宜的检查，再做昂贵的" },
        body: {
          en: "Across very different projects the validation order stays the same, cheapest first. Build and lint catch the dumb breakages for free. A quick test pass catches the logic ones. Only then is it worth the slower checks: actually running it on device, and looking again once it's live.",
          zh: "在差别很大的项目之间，验证顺序始终一致，最便宜的先做。build 与 lint 免费地抓住低级故障。一遍快速测试抓住逻辑问题。只有到这之后，才值得做更慢的检查：在真实设备上实际运行它，以及上线后再看一遍。",
        },
      },
      {
        id: "detail-body",
        nav: { en: "Order", zh: "顺序" },
        heading: { en: "The same order every time", zh: "每次都用同样的顺序" },
        body: {
          en: "For Inkvoker it's build then play on a controller; for the ARAM tool it's build, lint, test, then click through the live route; for visual experiments it's just \"does it look right in context.\" The shared rule is make it work first, then enhance — a usable rough version beats a polished plan, because feedback only comes from the working thing.",
          zh: "对 Inkvoker 是先 build 再用手柄试玩；对 ARAM 工具是 build、lint、test，再点完线上路由；对视觉实验只是「放进上下文里看对不对」。共同的原则是先可用，再增强——一个可用的粗糙版本胜过一份打磨过的计划，因为反馈只来自能运行的东西。",
        },
      },
      {
        id: "detail-takeaways",
        nav: { en: "Takeaways", zh: "要点" },
        heading: { en: "Key takeaways", zh: "关键要点" },
        items: [
          {
            title: { en: "Cheapest checks first", zh: "最便宜的检查先做" },
            body: {
              en: "Build and lint before tests; tests before a manual run.",
              zh: "先 build 与 lint，再测试；测试之后再手动运行。",
            },
          },
          {
            title: { en: "Check it live", zh: "上线后检查" },
            body: {
              en: "On-device and post-deploy checks catch what local passes miss.",
              zh: "实机与上线后检查，能抓住本地通过时遗漏的问题。",
            },
          },
          {
            title: { en: "Work first, enhance later", zh: "先可用，再增强" },
            body: {
              en: "A usable rough version earns feedback a polished plan never will.",
              zh: "一个可用的粗糙版本能换来反馈，而打磨过的计划换不来。",
            },
          },
        ],
      },
    ],
    related: [
      {
        label: { en: "An AI-assisted workflow", zh: "一套 AI 辅助流程" },
        href: "#/notes/ai-workflow",
        note: { en: "The loop this validation sits in", zh: "这套验证所处的循环" },
      },
      {
        label: { en: "Back to Dev Log", zh: "返回开发日志" },
        href: "#devlog",
      },
    ],
  },
];
