export type HexTier = "silver" | "gold" | "prismatic";
export type HexPriority = "core" | "good" | "situational" | "avoid";

export interface HexPick {
  id: string;
  nameZh: string;
  nameEn: string;
  tier: HexTier;
  priority: HexPriority;
  reasonZh: string;
  reasonEn: string;
}

export interface BuildRoute {
  id: string;
  nameZh: string;
  nameEn: string;
  role: "poke" | "crit" | "on-hit" | "tank" | "bruiser" | "support" | "mage" | "haste";
  coreItems: string[];
  situationalItems: string[];
  notesZh: string;
  notesEn: string;
  linkedHexes: string[];
}

export interface AramMayhemChampion {
  id: string;
  nameZh: string;
  nameEn: string;
  aliases: string[];
  marker: string;
  tier: string;
  winRate: string;
  pickRate: string;
  patternZh: string;
  patternEn: string;
  hexes: {
    silver: HexPick[];
    gold: HexPick[];
    prismatic: HexPick[];
  };
  builds: BuildRoute[];
  sourceUrl: string;
  updatedAt: string;
}

export interface AramMayhemDataSnapshot {
  schemaVersion: 1;
  source: {
    name: string;
    url: string;
    updatedAt: string;
    syncedAt?: string;
    syncStatus?: string;
    pageTitle?: string;
    checksum?: string;
    contentLength?: number;
  };
  tiers: Record<HexTier, string>;
  champions: AramMayhemChampion[];
}

export const aramMayhemSource = {
  name: "OP.GG ARAM Mayhem",
  url: "https://op.gg/zh-cn/lol/modes/aram-mayhem",
  updatedAt: "2026-06-27",
};

export const aramMayhemChampions: AramMayhemChampion[] = [
  {
    id: "ashe",
    nameZh: "寒冰射手",
    nameEn: "Ashe",
    aliases: ["寒冰", "艾希", "ashe", "adc"],
    marker: "A",
    tier: "A",
    winRate: "Sample",
    pickRate: "Sample",
    patternZh: "远程消耗与持续减速，优先强化技能频率和团队控制。",
    patternEn: "Long-range poke and constant slows. Prioritize cast frequency and team control.",
    hexes: {
      silver: [
        {
          id: "ashe-silver-haste",
          nameZh: "技能急速",
          nameEn: "Ability Haste",
          tier: "silver",
          priority: "good",
          reasonZh: "让 W 和大招更频繁，稳定提供消耗与开团机会。",
          reasonEn: "More W casts and ult windows create reliable poke and engage pressure.",
        },
        {
          id: "ashe-silver-move",
          nameZh: "机动补强",
          nameEn: "Mobility Patch",
          tier: "silver",
          priority: "situational",
          reasonZh: "被强开阵容针对时优先级提高。",
          reasonEn: "Rises in value when the enemy team can hard engage.",
        },
      ],
      gold: [
        {
          id: "ashe-gold-poke",
          nameZh: "远程消耗",
          nameEn: "Poke Pattern",
          tier: "gold",
          priority: "core",
          reasonZh: "直接放大寒冰最稳定的输出方式。",
          reasonEn: "Amplifies Ashe's most reliable damage pattern.",
        },
        {
          id: "ashe-gold-utility",
          nameZh: "团队辅助",
          nameEn: "Team Utility",
          tier: "gold",
          priority: "good",
          reasonZh: "适合己方已有足够伤害时补控制价值。",
          reasonEn: "Best when the team already has enough damage.",
        },
      ],
      prismatic: [
        {
          id: "ashe-prismatic-volley",
          nameZh: "万箭齐发强化",
          nameEn: "Volley Upgrade",
          tier: "prismatic",
          priority: "core",
          reasonZh: "看到就优先拿，直接决定消耗流上限。",
          reasonEn: "Take first when offered; it defines the poke build ceiling.",
        },
      ],
    },
    builds: [
      {
        id: "ashe-poke",
        nameZh: "消耗急速流",
        nameEn: "Poke Haste",
        role: "poke",
        coreItems: ["魔宗", "帝国指令", "赛瑞尔达的怨恨"],
        situationalItems: ["炼金朋克链锯剑", "公理圆弧"],
        notesZh: "适合拿到技能急速、远程消耗、万箭齐发强化时。",
        notesEn: "Best with haste, poke, or Volley-focused augments.",
        linkedHexes: ["ashe-silver-haste", "ashe-gold-poke", "ashe-prismatic-volley"],
      },
    ],
    sourceUrl: "https://op.gg/zh-cn/lol/modes/aram-mayhem",
    updatedAt: aramMayhemSource.updatedAt,
  },
  {
    id: "ezreal",
    nameZh: "探险家",
    nameEn: "Ezreal",
    aliases: ["ez", "ezreal", "伊泽瑞尔", "探险家"],
    marker: "E",
    tier: "A",
    winRate: "Sample",
    pickRate: "Sample",
    patternZh: "安全距离内连续命中技能，围绕技能急速与命中收益构筑。",
    patternEn: "Repeated skill hits from safe range. Build around haste and on-hit spell value.",
    hexes: {
      silver: [
        {
          id: "ezreal-silver-mana",
          nameZh: "法力续航",
          nameEn: "Mana Sustain",
          tier: "silver",
          priority: "good",
          reasonZh: "保证持续 Q 消耗，不因蓝量断节奏。",
          reasonEn: "Keeps Q pressure online without mana stalls.",
        },
      ],
      gold: [
        {
          id: "ezreal-gold-spellblade",
          nameZh: "咒刃循环",
          nameEn: "Spellblade Loop",
          tier: "gold",
          priority: "core",
          reasonZh: "强化 Q 命中后的核心输出节奏。",
          reasonEn: "Strengthens the core Q-hit damage loop.",
        },
      ],
      prismatic: [
        {
          id: "ezreal-prismatic-skillshot",
          nameZh: "精准弹幕",
          nameEn: "Precision Barrage",
          tier: "prismatic",
          priority: "core",
          reasonZh: "命中越稳定收益越高，适合熟练度高时优先。",
          reasonEn: "High value when you can reliably land skillshots.",
        },
        {
          id: "ezreal-prismatic-reset",
          nameZh: "奥术重置",
          nameEn: "Arcane Reset",
          tier: "prismatic",
          priority: "good",
          reasonZh: "给 E 和 Q 循环更多容错。",
          reasonEn: "Adds safety and tempo to E/Q rotations.",
        },
      ],
    },
    builds: [
      {
        id: "ezreal-trinity",
        nameZh: "咒刃消耗流",
        nameEn: "Spellblade Poke",
        role: "poke",
        coreItems: ["魔宗", "三相之力", "赛瑞尔达的怨恨"],
        situationalItems: ["朔极之矛", "守护天使"],
        notesZh: "默认路线，海克斯围绕 Q 命中收益和技能急速选择。",
        notesEn: "Default route. Pick augments that reward Q hits and haste.",
        linkedHexes: ["ezreal-gold-spellblade", "ezreal-prismatic-skillshot"],
      },
    ],
    sourceUrl: "https://op.gg/zh-cn/lol/modes/aram-mayhem",
    updatedAt: aramMayhemSource.updatedAt,
  },
  {
    id: "lux",
    nameZh: "光辉女郎",
    nameEn: "Lux",
    aliases: ["光辉", "拉克丝", "lux", "法师"],
    marker: "L",
    tier: "A",
    winRate: "Sample",
    pickRate: "Sample",
    patternZh: "控制命中后接爆发，优先选择远程技能、法强与冷却收益。",
    patternEn: "Bind into burst. Prefer long-range spell, AP, and cooldown value.",
    hexes: {
      silver: [
        {
          id: "lux-silver-shield",
          nameZh: "护盾强化",
          nameEn: "Shield Boost",
          tier: "silver",
          priority: "situational",
          reasonZh: "对面消耗强时提高团队容错。",
          reasonEn: "Adds team stability into heavy poke.",
        },
      ],
      gold: [
        {
          id: "lux-gold-burst",
          nameZh: "技能爆发",
          nameEn: "Spell Burst",
          tier: "gold",
          priority: "core",
          reasonZh: "强化 Q 命中后的完整连招斩杀线。",
          reasonEn: "Improves the full combo after Q lands.",
        },
      ],
      prismatic: [
        {
          id: "lux-prismatic-laser",
          nameZh: "终极闪光强化",
          nameEn: "Final Spark Upgrade",
          tier: "prismatic",
          priority: "core",
          reasonZh: "直接提高收割和远程压制能力。",
          reasonEn: "Raises execute pressure and long-range control.",
        },
      ],
    },
    builds: [
      {
        id: "lux-burst",
        nameZh: "法强爆发流",
        nameEn: "AP Burst",
        role: "mage",
        coreItems: ["卢登的伙伴", "影焰", "灭世者的死亡之帽"],
        situationalItems: ["虚空之杖", "中娅沙漏"],
        notesZh: "适合拿到技能爆发或终极闪光强化时。",
        notesEn: "Best with burst or Final Spark augments.",
        linkedHexes: ["lux-gold-burst", "lux-prismatic-laser"],
      },
    ],
    sourceUrl: "https://op.gg/zh-cn/lol/modes/aram-mayhem",
    updatedAt: aramMayhemSource.updatedAt,
  },
  {
    id: "malphite",
    nameZh: "熔岩巨兽",
    nameEn: "Malphite",
    aliases: ["石头人", "墨菲特", "malphite", "坦克"],
    marker: "M",
    tier: "B",
    winRate: "Sample",
    pickRate: "Sample",
    patternZh: "承担开团和前排任务，根据海克斯选择坦克或爆发开团路线。",
    patternEn: "Primary engage and frontline. Choose tank or burst engage based on augments.",
    hexes: {
      silver: [
        {
          id: "malphite-silver-resist",
          nameZh: "抗性补强",
          nameEn: "Resistance Patch",
          tier: "silver",
          priority: "good",
          reasonZh: "提升进场后站住的能力。",
          reasonEn: "Helps survive after engaging.",
        },
      ],
      gold: [
        {
          id: "malphite-gold-engage",
          nameZh: "开团强化",
          nameEn: "Engage Boost",
          tier: "gold",
          priority: "core",
          reasonZh: "强化大招进场后的团队收益。",
          reasonEn: "Improves team value after ultimate engage.",
        },
      ],
      prismatic: [
        {
          id: "malphite-prismatic-unstoppable",
          nameZh: "势不可挡强化",
          nameEn: "Unstoppable Upgrade",
          tier: "prismatic",
          priority: "core",
          reasonZh: "核心棱彩，决定团战先手质量。",
          reasonEn: "Core prismatic option for high-quality initiations.",
        },
      ],
    },
    builds: [
      {
        id: "malphite-tank",
        nameZh: "前排开团流",
        nameEn: "Tank Engage",
        role: "tank",
        coreItems: ["日炎圣盾", "荆棘之甲", "深渊面具"],
        situationalItems: ["兰顿之兆", "自然之力"],
        notesZh: "默认稳健路线，配合开团强化和抗性补强。",
        notesEn: "Stable default route with engage and resistance augments.",
        linkedHexes: ["malphite-silver-resist", "malphite-gold-engage", "malphite-prismatic-unstoppable"],
      },
    ],
    sourceUrl: "https://op.gg/zh-cn/lol/modes/aram-mayhem",
    updatedAt: aramMayhemSource.updatedAt,
  },
];

export const aramMayhemFallbackData: AramMayhemDataSnapshot = {
  schemaVersion: 1,
  source: {
    ...aramMayhemSource,
    syncStatus: "fallback",
  },
  tiers: {
    silver: "银色",
    gold: "黄金",
    prismatic: "棱彩",
  },
  champions: aramMayhemChampions,
};
