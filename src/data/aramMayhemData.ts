// ARAM Mayhem data types + bundled fallback.
//
// Live data comes from public/data/aram-mayhem.json (schema v3), synced from
// OP.GG ARAM Mayhem. See docs/aram-mayhem-sync-notes.md. Notes on the source:
//   - OP.GG does NOT publish runes for this mode -> no rune field.
//   - OP.GG does NOT split augments by silver/gold/prismatic -> augments are a
//     single priority-ordered list, no fabricated rarity.

export interface Localized {
  zh: string;
  en: string;
}

/** One recommended augment ("hex"), ordered by OP.GG priority (1 = first). */
export interface AugmentPick {
  id: string;
  name: Localized;
  priority: number;
}

/** One item in a build path. */
export interface BuildItem {
  id: number;
  name: string;
}

/** One row of an item section; a row may be a multi-item build path. */
export interface ItemRow {
  row: number;
  items: BuildItem[];
}

export interface ChampionItems {
  starter: ItemRow[];
  boots: ItemRow[];
  core: ItemRow[];
}

/** Skill leveling: max-priority order (no R) + the full 18-level sequence. */
export interface ChampionSkills {
  order: string[];
  sequence: string[];
}

/**
 * Per-champion detail freshness:
 * - synced:  augments + items + skills all parsed.
 * - partial: detail page parsed but a field is missing (e.g. Viktor's skills).
 * - failed:  detail page could not be fetched/parsed; only tier/rank is known.
 */
export type ChampionDetailStatus = "synced" | "partial" | "failed";

export interface AramMayhemChampion {
  key: string;
  championId: number;
  name: Localized;
  image: string;
  /** OP.GG tier bucket, 1 (strongest) .. 5 (weakest). */
  tier: number;
  /** Derived letter label (S/A/B/C/D). */
  tierLabel: string;
  rank: number;
  detailStatus: ChampionDetailStatus;
  augments: AugmentPick[];
  items: ChampionItems;
  /** null when OP.GG did not expose a skill order for this champion. */
  skills: ChampionSkills | null;
  sourceUrl: string;
  syncedAt: string;
}

/**
 * How trustworthy / fresh the data on screen is:
 * - live:     synced from OP.GG and recent.
 * - stale:    synced from OP.GG but the last successful sync is old.
 * - fallback: the public snapshot failed to load; using the bundled subset.
 */
export type AramMayhemStatus = "live" | "stale" | "fallback";

/** Number of days after which a live snapshot is treated as stale. */
export const ARAM_MAYHEM_STALE_AFTER_DAYS = 21;

export interface AramMayhemSnapshot {
  version: 3;
  status: AramMayhemStatus;
  source: string;
  sourceUrl: string;
  patch?: string;
  syncedAt: string;
  sourceHash?: string;
  championCount: number;
  detailCount: number;
  failedDetailCount: number;
  champions: AramMayhemChampion[];
}

export const aramMayhemSource = {
  name: "OP.GG ARAM Mayhem",
  url: "https://op.gg/zh-cn/lol/modes/aram-mayhem",
};

/** Map an OP.GG numeric tier bucket (1..5) to a display letter. */
export function tierNumberToLabel(tier: number): string {
  return ["S", "A", "B", "C", "D"][tier - 1] ?? "?";
}

/**
 * A small, real subset of the live snapshot, bundled so the page still renders
 * something truthful when the public JSON can't be loaded. It is marked
 * "fallback" so the UI never claims to be live, and it is genuine OP.GG data
 * (not invented), just a few champions instead of the full list.
 */
const fallbackChampions: AramMayhemChampion[] = [
  {
    "key": "jinx",
    "championId": 222,
    "name": {
      "zh": "暴走萝莉",
      "en": "Jinx"
    },
    "image": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/champion/Jinx.png",
    "tier": 1,
    "tierLabel": "S",
    "rank": 1,
    "detailStatus": "synced",
    "augments": [
      {
        "id": "1071",
        "name": {
          "zh": "更万用的瞄准镜",
          "en": "更万用的瞄准镜"
        },
        "priority": 1
      },
      {
        "id": "1356",
        "name": {
          "zh": "暴击飞弹",
          "en": "暴击飞弹"
        },
        "priority": 2
      },
      {
        "id": "1336",
        "name": {
          "zh": "升级：无尽之刃",
          "en": "升级：无尽之刃"
        },
        "priority": 3
      },
      {
        "id": "1022",
        "name": {
          "zh": "灵巧",
          "en": "灵巧"
        },
        "priority": 4
      },
      {
        "id": "1225",
        "name": {
          "zh": "双刀流",
          "en": "双刀流"
        },
        "priority": 5
      }
    ],
    "items": {
      "starter": [
        {
          "row": 0,
          "items": [
            {
              "id": 1038,
              "name": "暴风之剑"
            },
            {
              "id": 2003,
              "name": "生命药水"
            }
          ]
        },
        {
          "row": 1,
          "items": [
            {
              "id": 1042,
              "name": "短剑"
            },
            {
              "id": 3006,
              "name": "狂战士胫甲"
            }
          ]
        }
      ],
      "boots": [
        {
          "row": 0,
          "items": [
            {
              "id": 3006,
              "name": "狂战士胫甲"
            }
          ]
        },
        {
          "row": 1,
          "items": [
            {
              "id": 3008,
              "name": "暴食胫甲"
            }
          ]
        }
      ],
      "core": [
        {
          "row": 0,
          "items": [
            {
              "id": 3032,
              "name": "育恩塔尔荒野箭"
            },
            {
              "id": 3085,
              "name": "卢安娜的飓风"
            },
            {
              "id": 3031,
              "name": "无尽之刃"
            }
          ]
        },
        {
          "row": 1,
          "items": [
            {
              "id": 2523,
              "name": "海克斯镜片 C44"
            },
            {
              "id": 3085,
              "name": "卢安娜的飓风"
            },
            {
              "id": 3031,
              "name": "无尽之刃"
            }
          ]
        },
        {
          "row": 2,
          "items": [
            {
              "id": 2523,
              "name": "海克斯镜片 C44"
            },
            {
              "id": 3046,
              "name": "幻影之舞"
            },
            {
              "id": 3031,
              "name": "无尽之刃"
            }
          ]
        }
      ]
    },
    "skills": {
      "order": [
        "Q",
        "W",
        "E"
      ],
      "sequence": [
        "Q",
        "W",
        "E",
        "Q",
        "W",
        "E",
        "Q",
        "Q",
        "R",
        "Q",
        "W",
        "Q",
        "W",
        "R",
        "W",
        "W",
        "E",
        "E"
      ]
    },
    "sourceUrl": "https://op.gg/zh-cn/lol/modes/aram-mayhem/jinx/build",
    "syncedAt": ""
  },
  {
    "key": "brand",
    "championId": 63,
    "name": {
      "zh": "复仇焰魂",
      "en": "Brand"
    },
    "image": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/champion/Brand.png",
    "tier": 1,
    "tierLabel": "S",
    "rank": 2,
    "detailStatus": "synced",
    "augments": [
      {
        "id": "1045",
        "name": {
          "zh": "炼狱导管",
          "en": "炼狱导管"
        },
        "priority": 1
      },
      {
        "id": "1133",
        "name": {
          "zh": "魔法飞弹",
          "en": "魔法飞弹"
        },
        "priority": 2
      },
      {
        "id": "2128",
        "name": {
          "zh": "炽燃利息",
          "en": "炽燃利息"
        },
        "priority": 3
      },
      {
        "id": "1390",
        "name": {
          "zh": "超凡邪恶",
          "en": "超凡邪恶"
        },
        "priority": 4
      },
      {
        "id": "2132",
        "name": {
          "zh": "术士果汁盒",
          "en": "术士果汁盒"
        },
        "priority": 5
      }
    ],
    "items": {
      "starter": [
        {
          "row": 0,
          "items": [
            {
              "id": 2031,
              "name": "复用型药水"
            },
            {
              "id": 3802,
              "name": "遗失的章节"
            }
          ]
        },
        {
          "row": 1,
          "items": [
            {
              "id": 3802,
              "name": "遗失的章节"
            }
          ]
        }
      ],
      "boots": [
        {
          "row": 0,
          "items": [
            {
              "id": 3020,
              "name": "法师之靴"
            }
          ]
        },
        {
          "row": 1,
          "items": [
            {
              "id": 3158,
              "name": "明朗之靴"
            }
          ]
        }
      ],
      "core": [
        {
          "row": 0,
          "items": [
            {
              "id": 2503,
              "name": "黯炎火炬"
            },
            {
              "id": 6653,
              "name": "兰德里的折磨"
            },
            {
              "id": 3116,
              "name": "瑞莱的冰晶节杖"
            }
          ]
        },
        {
          "row": 1,
          "items": [
            {
              "id": 2503,
              "name": "黯炎火炬"
            },
            {
              "id": 3116,
              "name": "瑞莱的冰晶节杖"
            },
            {
              "id": 6653,
              "name": "兰德里的折磨"
            }
          ]
        },
        {
          "row": 2,
          "items": [
            {
              "id": 2503,
              "name": "黯炎火炬"
            },
            {
              "id": 6653,
              "name": "兰德里的折磨"
            },
            {
              "id": 4645,
              "name": "影焰"
            }
          ]
        }
      ]
    },
    "skills": {
      "order": [
        "W",
        "E",
        "Q"
      ],
      "sequence": [
        "W",
        "E",
        "Q",
        "Q",
        "W",
        "E",
        "W",
        "W",
        "R",
        "W",
        "E",
        "W",
        "E",
        "R",
        "E",
        "E",
        "Q",
        "Q"
      ]
    },
    "sourceUrl": "https://op.gg/zh-cn/lol/modes/aram-mayhem/brand/build",
    "syncedAt": ""
  },
  {
    "key": "ashe",
    "championId": 22,
    "name": {
      "zh": "寒冰射手",
      "en": "Ashe"
    },
    "image": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/champion/Ashe.png",
    "tier": 3,
    "tierLabel": "B",
    "rank": 12,
    "detailStatus": "synced",
    "augments": [
      {
        "id": "2096",
        "name": {
          "zh": "小小的额外帮助",
          "en": "小小的额外帮助"
        },
        "priority": 1
      },
      {
        "id": "1356",
        "name": {
          "zh": "暴击飞弹",
          "en": "暴击飞弹"
        },
        "priority": 2
      },
      {
        "id": "1071",
        "name": {
          "zh": "更万用的瞄准镜",
          "en": "更万用的瞄准镜"
        },
        "priority": 3
      },
      {
        "id": "1022",
        "name": {
          "zh": "灵巧",
          "en": "灵巧"
        },
        "priority": 4
      },
      {
        "id": "1336",
        "name": {
          "zh": "升级：无尽之刃",
          "en": "升级：无尽之刃"
        },
        "priority": 5
      }
    ],
    "items": {
      "starter": [
        {
          "row": 0,
          "items": [
            {
              "id": 1038,
              "name": "暴风之剑"
            },
            {
              "id": 2003,
              "name": "生命药水"
            }
          ]
        },
        {
          "row": 1,
          "items": [
            {
              "id": 1042,
              "name": "短剑"
            },
            {
              "id": 3006,
              "name": "狂战士胫甲"
            }
          ]
        }
      ],
      "boots": [
        {
          "row": 0,
          "items": [
            {
              "id": 3006,
              "name": "狂战士胫甲"
            }
          ]
        },
        {
          "row": 1,
          "items": [
            {
              "id": 3158,
              "name": "明朗之靴"
            }
          ]
        }
      ],
      "core": [
        {
          "row": 0,
          "items": [
            {
              "id": 3032,
              "name": "育恩塔尔荒野箭"
            },
            {
              "id": 3085,
              "name": "卢安娜的飓风"
            },
            {
              "id": 3031,
              "name": "无尽之刃"
            }
          ]
        },
        {
          "row": 1,
          "items": [
            {
              "id": 2523,
              "name": "海克斯镜片 C44"
            },
            {
              "id": 3046,
              "name": "幻影之舞"
            },
            {
              "id": 3031,
              "name": "无尽之刃"
            }
          ]
        },
        {
          "row": 2,
          "items": [
            {
              "id": 3118,
              "name": "残疫"
            },
            {
              "id": 4005,
              "name": "帝国指令"
            },
            {
              "id": 4628,
              "name": "视界专注"
            }
          ]
        }
      ]
    },
    "skills": {
      "order": [
        "W",
        "Q",
        "E"
      ],
      "sequence": [
        "W",
        "Q",
        "E",
        "Q",
        "W",
        "E",
        "W",
        "W",
        "R",
        "W",
        "Q",
        "W",
        "Q",
        "R",
        "Q",
        "Q",
        "E",
        "E"
      ]
    },
    "sourceUrl": "https://op.gg/zh-cn/lol/modes/aram-mayhem/ashe/build",
    "syncedAt": ""
  },
  {
    "key": "malphite",
    "championId": 54,
    "name": {
      "zh": "熔岩巨兽",
      "en": "Malphite"
    },
    "image": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/champion/Malphite.png",
    "tier": 4,
    "tierLabel": "C",
    "rank": 155,
    "detailStatus": "synced",
    "augments": [
      {
        "id": "1353",
        "name": {
          "zh": "坦克引擎",
          "en": "坦克引擎"
        },
        "priority": 1
      },
      {
        "id": "1211",
        "name": {
          "zh": "杀戮时间到了",
          "en": "杀戮时间到了"
        },
        "priority": 2
      },
      {
        "id": "1152",
        "name": {
          "zh": "钢化你心",
          "en": "钢化你心"
        },
        "priority": 3
      },
      {
        "id": "1013",
        "name": {
          "zh": "星界躯体",
          "en": "星界躯体"
        },
        "priority": 4
      },
      {
        "id": "1181",
        "name": {
          "zh": "重量级打击手",
          "en": "重量级打击手"
        },
        "priority": 5
      }
    ],
    "items": {
      "starter": [
        {
          "row": 0,
          "items": [
            {
              "id": 2031,
              "name": "复用型药水"
            },
            {
              "id": 3802,
              "name": "遗失的章节"
            }
          ]
        },
        {
          "row": 1,
          "items": [
            {
              "id": 3802,
              "name": "遗失的章节"
            }
          ]
        }
      ],
      "boots": [
        {
          "row": 0,
          "items": [
            {
              "id": 3020,
              "name": "法师之靴"
            }
          ]
        },
        {
          "row": 1,
          "items": [
            {
              "id": 3111,
              "name": "水银之靴"
            }
          ]
        }
      ],
      "core": [
        {
          "row": 0,
          "items": [
            {
              "id": 3118,
              "name": "残疫"
            },
            {
              "id": 4646,
              "name": "风暴狂涌"
            },
            {
              "id": 4645,
              "name": "影焰"
            }
          ]
        },
        {
          "row": 1,
          "items": [
            {
              "id": 3118,
              "name": "残疫"
            },
            {
              "id": 4645,
              "name": "影焰"
            },
            {
              "id": 3089,
              "name": "灭世者的死亡之帽"
            }
          ]
        },
        {
          "row": 2,
          "items": [
            {
              "id": 3118,
              "name": "残疫"
            },
            {
              "id": 4645,
              "name": "影焰"
            },
            {
              "id": 4646,
              "name": "风暴狂涌"
            }
          ]
        }
      ]
    },
    "skills": {
      "order": [
        "Q",
        "E",
        "W"
      ],
      "sequence": [
        "Q",
        "E",
        "W",
        "Q",
        "W",
        "E",
        "Q",
        "Q",
        "R",
        "Q",
        "E",
        "Q",
        "E",
        "R",
        "E",
        "E",
        "W",
        "W"
      ]
    },
    "sourceUrl": "https://op.gg/zh-cn/lol/modes/aram-mayhem/malphite/build",
    "syncedAt": ""
  }
];

export const aramMayhemFallbackData: AramMayhemSnapshot = {
  version: 3,
  status: "fallback",
  source: "opgg",
  sourceUrl: aramMayhemSource.url,
  patch: undefined,
  syncedAt: "",
  championCount: fallbackChampions.length,
  detailCount: fallbackChampions.filter((c) => c.detailStatus !== "failed").length,
  failedDetailCount: 0,
  champions: fallbackChampions,
};
