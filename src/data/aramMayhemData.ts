// ARAM Mayhem data types + bundled fallback.
//
// Live data comes from public/data/aram-mayhem.json (schema v4), synced from
// OP.GG ARAM Mayhem. See docs/aram-mayhem-sync-notes.md. Notes on the source:
//   - OP.GG does NOT publish runes for this mode -> no rune field.
//   - OP.GG does NOT split augments by silver/gold/prismatic -> augments are a
//     single priority-ordered list, no fabricated rarity.

export interface Localized {
  zh: string;
  en: string;
}

export interface AramIconSource {
  url: string;
  source: "opgg" | "datadragon";
  id?: string | number;
  file?: string;
}

/** One recommended augment ("hex"), ordered by OP.GG priority (1 = first). */
export interface AugmentPick {
  id: string;
  metaId?: string;
  iconFile?: string;
  icon?: AramIconSource;
  name: Localized;
  priority: number;
  pickRate?: string;
  winRate?: string;
}

/** One item in a build path. */
export interface BuildItem {
  id: number;
  name: string;
  icon?: AramIconSource;
  opggIconUrl?: string;
  dataDragonIconUrl?: string;
  pickRate?: string;
  winRate?: string;
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
  version: 4;
  status: AramMayhemStatus;
  source: string;
  sourceUrl: string;
  patch?: string;
  syncedAt: string;
  sourceHash?: string;
  championCount: number;
  detailCount: number;
  failedDetailCount: number;
  iconCoverage?: {
    augments: { total: number; withIcon: number; pct: number };
    items: { total: number; withIcon: number; pct: number };
  };
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
    "sourceUrl": "https://op.gg/zh-cn/lol/modes/aram-mayhem/jinx/build",
    "syncedAt": "",
    "detailStatus": "synced",
    "augments": [
      {
        "id": "1071",
        "metaId": "1071",
        "iconFile": "ScopierWeapons_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/ScopierWeapons_large.png",
          "source": "opgg",
          "id": "1071",
          "file": "ScopierWeapons_large.png"
        },
        "name": {
          "zh": "更万用的瞄准镜",
          "en": "更万用的瞄准镜"
        },
        "priority": 1
      },
      {
        "id": "1356",
        "metaId": "1356",
        "iconFile": "CriticalMissile_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/CriticalMissile_large.png",
          "source": "opgg",
          "id": "1356",
          "file": "CriticalMissile_large.png"
        },
        "name": {
          "zh": "暴击飞弹",
          "en": "暴击飞弹"
        },
        "priority": 2
      },
      {
        "id": "1336",
        "metaId": "1336",
        "iconFile": "UpgradeIE_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/UpgradeIE_large.png",
          "source": "opgg",
          "id": "1336",
          "file": "UpgradeIE_large.png"
        },
        "name": {
          "zh": "升级：无尽之刃",
          "en": "升级：无尽之刃"
        },
        "priority": 3
      },
      {
        "id": "1225",
        "metaId": "1225",
        "iconFile": "DualWield_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/DualWield_large.png",
          "source": "opgg",
          "id": "1225",
          "file": "DualWield_large.png"
        },
        "name": {
          "zh": "双刀流",
          "en": "双刀流"
        },
        "priority": 4
      },
      {
        "id": "1022",
        "metaId": "1022",
        "iconFile": "Deft_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/Deft_large.png",
          "source": "opgg",
          "id": "1022",
          "file": "Deft_large.png"
        },
        "name": {
          "zh": "灵巧",
          "en": "灵巧"
        },
        "priority": 5
      },
      {
        "id": "1328",
        "metaId": "1328",
        "iconFile": "CriticalRhythm_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/CriticalRhythm_large.png",
          "source": "opgg",
          "id": "1328",
          "file": "CriticalRhythm_large.png"
        },
        "name": {
          "zh": "暴击律动",
          "en": "暴击律动"
        },
        "priority": 6
      },
      {
        "id": "1115",
        "metaId": "1115",
        "iconFile": "ScopiestWeapons_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/ScopiestWeapons_large.png",
          "source": "opgg",
          "id": "1115",
          "file": "ScopiestWeapons_large.png"
        },
        "name": {
          "zh": "最万用的瞄准镜",
          "en": "最万用的瞄准镜"
        },
        "priority": 7
      },
      {
        "id": "2010",
        "metaId": "2010",
        "iconFile": "DoubleTap_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/DoubleTap_large.png",
          "source": "opgg",
          "id": "2010",
          "file": "DoubleTap_large.png"
        },
        "name": {
          "zh": "双发快射",
          "en": "双发快射"
        },
        "priority": 8
      },
      {
        "id": "1081",
        "metaId": "1081",
        "iconFile": "TapDancer_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/TapDancer_large.png",
          "source": "opgg",
          "id": "1081",
          "file": "TapDancer_large.png"
        },
        "name": {
          "zh": "踢踏舞",
          "en": "踢踏舞"
        },
        "priority": 9
      },
      {
        "id": "1087",
        "metaId": "1087",
        "iconFile": "Typhoon_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/Typhoon_large.png",
          "source": "opgg",
          "id": "1087",
          "file": "Typhoon_large.png"
        },
        "name": {
          "zh": "台风",
          "en": "台风"
        },
        "priority": 10
      }
    ],
    "items": {
      "starter": [
        {
          "row": 0,
          "items": [
            {
              "id": 1038,
              "name": "暴风之剑",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/1038.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/1038.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/1038.png",
                "source": "opgg",
                "id": 1038
              }
            },
            {
              "id": 2003,
              "name": "生命药水",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/2003.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/2003.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/2003.png",
                "source": "opgg",
                "id": 2003
              }
            }
          ]
        },
        {
          "row": 1,
          "items": [
            {
              "id": 1042,
              "name": "短剑",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/1042.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/1042.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/1042.png",
                "source": "opgg",
                "id": 1042
              }
            },
            {
              "id": 3006,
              "name": "狂战士胫甲",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3006.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3006.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3006.png",
                "source": "opgg",
                "id": 3006
              }
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
              "name": "狂战士胫甲",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3006.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3006.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3006.png",
                "source": "opgg",
                "id": 3006
              }
            }
          ]
        },
        {
          "row": 1,
          "items": [
            {
              "id": 3008,
              "name": "暴食胫甲",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3008.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3008.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3008.png",
                "source": "opgg",
                "id": 3008
              }
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
              "name": "育恩塔尔荒野箭",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3032.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3032.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3032.png",
                "source": "opgg",
                "id": 3032
              }
            },
            {
              "id": 3085,
              "name": "卢安娜的飓风",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3085.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3085.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3085.png",
                "source": "opgg",
                "id": 3085
              }
            },
            {
              "id": 3031,
              "name": "无尽之刃",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3031.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3031.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3031.png",
                "source": "opgg",
                "id": 3031
              }
            }
          ]
        },
        {
          "row": 1,
          "items": [
            {
              "id": 2523,
              "name": "海克斯镜片 C44",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/2523.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/2523.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/2523.png",
                "source": "opgg",
                "id": 2523
              }
            },
            {
              "id": 3085,
              "name": "卢安娜的飓风",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3085.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3085.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3085.png",
                "source": "opgg",
                "id": 3085
              }
            },
            {
              "id": 3031,
              "name": "无尽之刃",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3031.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3031.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3031.png",
                "source": "opgg",
                "id": 3031
              }
            }
          ]
        },
        {
          "row": 2,
          "items": [
            {
              "id": 2523,
              "name": "海克斯镜片 C44",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/2523.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/2523.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/2523.png",
                "source": "opgg",
                "id": 2523
              }
            },
            {
              "id": 3046,
              "name": "幻影之舞",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3046.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3046.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3046.png",
                "source": "opgg",
                "id": 3046
              }
            },
            {
              "id": 3031,
              "name": "无尽之刃",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3031.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3031.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3031.png",
                "source": "opgg",
                "id": 3031
              }
            }
          ]
        },
        {
          "row": 3,
          "items": [
            {
              "id": 2523,
              "name": "海克斯镜片 C44",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/2523.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/2523.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/2523.png",
                "source": "opgg",
                "id": 2523
              }
            },
            {
              "id": 3031,
              "name": "无尽之刃",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3031.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3031.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3031.png",
                "source": "opgg",
                "id": 3031
              }
            },
            {
              "id": 3085,
              "name": "卢安娜的飓风",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3085.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3085.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3085.png",
                "source": "opgg",
                "id": 3085
              }
            }
          ]
        },
        {
          "row": 4,
          "items": [
            {
              "id": 3032,
              "name": "育恩塔尔荒野箭",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3032.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3032.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3032.png",
                "source": "opgg",
                "id": 3032
              }
            },
            {
              "id": 3031,
              "name": "无尽之刃",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3031.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3031.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3031.png",
                "source": "opgg",
                "id": 3031
              }
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
    }
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
    "rank": 3,
    "sourceUrl": "https://op.gg/zh-cn/lol/modes/aram-mayhem/brand/build",
    "syncedAt": "",
    "detailStatus": "synced",
    "augments": [
      {
        "id": "1045",
        "metaId": "1045",
        "iconFile": "InfernalConduit_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/InfernalConduit_large.png",
          "source": "opgg",
          "id": "1045",
          "file": "InfernalConduit_large.png"
        },
        "name": {
          "zh": "炼狱导管",
          "en": "炼狱导管"
        },
        "priority": 1
      },
      {
        "id": "1133",
        "metaId": "1133",
        "iconFile": "MagicMissile_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/MagicMissile_large.png",
          "source": "opgg",
          "id": "1133",
          "file": "MagicMissile_large.png"
        },
        "name": {
          "zh": "魔法飞弹",
          "en": "魔法飞弹"
        },
        "priority": 2
      },
      {
        "id": "2128",
        "metaId": "2128",
        "iconFile": "BloodMoney2_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/BloodMoney2_large.png",
          "source": "opgg",
          "id": "2128",
          "file": "BloodMoney2_large.png"
        },
        "name": {
          "zh": "炽燃利息",
          "en": "炽燃利息"
        },
        "priority": 3
      },
      {
        "id": "1390",
        "metaId": "1390",
        "iconFile": "ARAM_PhenomenalEvil_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/ARAM_PhenomenalEvil_large.png",
          "source": "opgg",
          "id": "1390",
          "file": "ARAM_PhenomenalEvil_large.png"
        },
        "name": {
          "zh": "超凡邪恶",
          "en": "超凡邪恶"
        },
        "priority": 4
      },
      {
        "id": "2132",
        "metaId": "2132",
        "iconFile": "WarlockJuicebox_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/WarlockJuicebox_large.png",
          "source": "opgg",
          "id": "2132",
          "file": "WarlockJuicebox_large.png"
        },
        "name": {
          "zh": "术士果汁盒",
          "en": "术士果汁盒"
        },
        "priority": 5
      },
      {
        "id": "1097",
        "metaId": "1097",
        "iconFile": "WitchfulThinking_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/WitchfulThinking_large.png",
          "source": "opgg",
          "id": "1097",
          "file": "WitchfulThinking_large.png"
        },
        "name": {
          "zh": "巫师式思考",
          "en": "巫师式思考"
        },
        "priority": 6
      },
      {
        "id": "1044",
        "metaId": "1044",
        "iconFile": "IceCold_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/IceCold_large.png",
          "source": "opgg",
          "id": "1044",
          "file": "IceCold_large.png"
        },
        "name": {
          "zh": "冰寒",
          "en": "冰寒"
        },
        "priority": 7
      },
      {
        "id": "1030",
        "metaId": "1030",
        "iconFile": "Eureka_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/Eureka_large.png",
          "source": "opgg",
          "id": "1030",
          "file": "Eureka_large.png"
        },
        "name": {
          "zh": "尤里卡",
          "en": "尤里卡"
        },
        "priority": 8
      },
      {
        "id": "1211",
        "metaId": "1211",
        "iconFile": "ItsKillingTime_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/ItsKillingTime_large.png",
          "source": "opgg",
          "id": "1211",
          "file": "ItsKillingTime_large.png"
        },
        "name": {
          "zh": "杀戮时间到了",
          "en": "杀戮时间到了"
        },
        "priority": 9
      },
      {
        "id": "1415",
        "metaId": "1415",
        "iconFile": "TwinFire_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/TwinFire_large.png",
          "source": "opgg",
          "id": "1415",
          "file": "TwinFire_large.png"
        },
        "name": {
          "zh": "双生火焰",
          "en": "双生火焰"
        },
        "priority": 10
      }
    ],
    "items": {
      "starter": [
        {
          "row": 0,
          "items": [
            {
              "id": 2031,
              "name": "复用型药水",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/2031.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/2031.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/2031.png",
                "source": "opgg",
                "id": 2031
              }
            },
            {
              "id": 3802,
              "name": "遗失的章节",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3802.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3802.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3802.png",
                "source": "opgg",
                "id": 3802
              }
            }
          ]
        },
        {
          "row": 1,
          "items": [
            {
              "id": 3802,
              "name": "遗失的章节",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3802.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3802.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3802.png",
                "source": "opgg",
                "id": 3802
              }
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
              "name": "法师之靴",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3020.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3020.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3020.png",
                "source": "opgg",
                "id": 3020
              }
            }
          ]
        },
        {
          "row": 1,
          "items": [
            {
              "id": 3158,
              "name": "明朗之靴",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3158.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3158.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3158.png",
                "source": "opgg",
                "id": 3158
              }
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
              "name": "黯炎火炬",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/2503.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/2503.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/2503.png",
                "source": "opgg",
                "id": 2503
              }
            },
            {
              "id": 6653,
              "name": "兰德里的折磨",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/6653.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/6653.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/6653.png",
                "source": "opgg",
                "id": 6653
              }
            },
            {
              "id": 3116,
              "name": "瑞莱的冰晶节杖",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3116.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3116.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3116.png",
                "source": "opgg",
                "id": 3116
              }
            }
          ]
        },
        {
          "row": 1,
          "items": [
            {
              "id": 2503,
              "name": "黯炎火炬",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/2503.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/2503.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/2503.png",
                "source": "opgg",
                "id": 2503
              }
            },
            {
              "id": 3116,
              "name": "瑞莱的冰晶节杖",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3116.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3116.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3116.png",
                "source": "opgg",
                "id": 3116
              }
            },
            {
              "id": 6653,
              "name": "兰德里的折磨",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/6653.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/6653.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/6653.png",
                "source": "opgg",
                "id": 6653
              }
            }
          ]
        },
        {
          "row": 2,
          "items": [
            {
              "id": 2503,
              "name": "黯炎火炬",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/2503.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/2503.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/2503.png",
                "source": "opgg",
                "id": 2503
              }
            },
            {
              "id": 6653,
              "name": "兰德里的折磨",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/6653.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/6653.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/6653.png",
                "source": "opgg",
                "id": 6653
              }
            },
            {
              "id": 4645,
              "name": "影焰",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/4645.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/4645.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/4645.png",
                "source": "opgg",
                "id": 4645
              }
            }
          ]
        },
        {
          "row": 3,
          "items": [
            {
              "id": 3118,
              "name": "残疫",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3118.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3118.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3118.png",
                "source": "opgg",
                "id": 3118
              }
            },
            {
              "id": 6653,
              "name": "兰德里的折磨",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/6653.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/6653.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/6653.png",
                "source": "opgg",
                "id": 6653
              }
            },
            {
              "id": 3116,
              "name": "瑞莱的冰晶节杖",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3116.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3116.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3116.png",
                "source": "opgg",
                "id": 3116
              }
            }
          ]
        },
        {
          "row": 4,
          "items": [
            {
              "id": 3118,
              "name": "残疫",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3118.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3118.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3118.png",
                "source": "opgg",
                "id": 3118
              }
            },
            {
              "id": 3116,
              "name": "瑞莱的冰晶节杖",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3116.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3116.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3116.png",
                "source": "opgg",
                "id": 3116
              }
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
    }
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
    "rank": 11,
    "sourceUrl": "https://op.gg/zh-cn/lol/modes/aram-mayhem/ashe/build",
    "syncedAt": "",
    "detailStatus": "synced",
    "augments": [
      {
        "id": "2096",
        "metaId": "2096",
        "iconFile": "GenericAbilityAugmentIcon_Gold.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/GenericAbilityAugmentIcon_Gold.png",
          "source": "opgg",
          "id": "2096",
          "file": "GenericAbilityAugmentIcon_Gold.png"
        },
        "name": {
          "zh": "小小的额外帮助",
          "en": "小小的额外帮助"
        },
        "priority": 1
      },
      {
        "id": "1356",
        "metaId": "1356",
        "iconFile": "CriticalMissile_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/CriticalMissile_large.png",
          "source": "opgg",
          "id": "1356",
          "file": "CriticalMissile_large.png"
        },
        "name": {
          "zh": "暴击飞弹",
          "en": "暴击飞弹"
        },
        "priority": 2
      },
      {
        "id": "1071",
        "metaId": "1071",
        "iconFile": "ScopierWeapons_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/ScopierWeapons_large.png",
          "source": "opgg",
          "id": "1071",
          "file": "ScopierWeapons_large.png"
        },
        "name": {
          "zh": "更万用的瞄准镜",
          "en": "更万用的瞄准镜"
        },
        "priority": 3
      },
      {
        "id": "1022",
        "metaId": "1022",
        "iconFile": "Deft_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/Deft_large.png",
          "source": "opgg",
          "id": "1022",
          "file": "Deft_large.png"
        },
        "name": {
          "zh": "灵巧",
          "en": "灵巧"
        },
        "priority": 4
      },
      {
        "id": "1225",
        "metaId": "1225",
        "iconFile": "DualWield_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/DualWield_large.png",
          "source": "opgg",
          "id": "1225",
          "file": "DualWield_large.png"
        },
        "name": {
          "zh": "双刀流",
          "en": "双刀流"
        },
        "priority": 5
      },
      {
        "id": "1336",
        "metaId": "1336",
        "iconFile": "UpgradeIE_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/UpgradeIE_large.png",
          "source": "opgg",
          "id": "1336",
          "file": "UpgradeIE_large.png"
        },
        "name": {
          "zh": "升级：无尽之刃",
          "en": "升级：无尽之刃"
        },
        "priority": 6
      },
      {
        "id": "1087",
        "metaId": "1087",
        "iconFile": "Typhoon_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/Typhoon_large.png",
          "source": "opgg",
          "id": "1087",
          "file": "Typhoon_large.png"
        },
        "name": {
          "zh": "台风",
          "en": "台风"
        },
        "priority": 7
      },
      {
        "id": "1115",
        "metaId": "1115",
        "iconFile": "ScopiestWeapons_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/ScopiestWeapons_large.png",
          "source": "opgg",
          "id": "1115",
          "file": "ScopiestWeapons_large.png"
        },
        "name": {
          "zh": "最万用的瞄准镜",
          "en": "最万用的瞄准镜"
        },
        "priority": 8
      },
      {
        "id": "2010",
        "metaId": "2010",
        "iconFile": "DoubleTap_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/DoubleTap_large.png",
          "source": "opgg",
          "id": "2010",
          "file": "DoubleTap_large.png"
        },
        "name": {
          "zh": "双发快射",
          "en": "双发快射"
        },
        "priority": 9
      },
      {
        "id": "1328",
        "metaId": "1328",
        "iconFile": "CriticalRhythm_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/CriticalRhythm_large.png",
          "source": "opgg",
          "id": "1328",
          "file": "CriticalRhythm_large.png"
        },
        "name": {
          "zh": "暴击律动",
          "en": "暴击律动"
        },
        "priority": 10
      }
    ],
    "items": {
      "starter": [
        {
          "row": 0,
          "items": [
            {
              "id": 1038,
              "name": "暴风之剑",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/1038.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/1038.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/1038.png",
                "source": "opgg",
                "id": 1038
              }
            },
            {
              "id": 2003,
              "name": "生命药水",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/2003.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/2003.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/2003.png",
                "source": "opgg",
                "id": 2003
              }
            }
          ]
        },
        {
          "row": 1,
          "items": [
            {
              "id": 1042,
              "name": "短剑",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/1042.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/1042.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/1042.png",
                "source": "opgg",
                "id": 1042
              }
            },
            {
              "id": 3006,
              "name": "狂战士胫甲",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3006.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3006.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3006.png",
                "source": "opgg",
                "id": 3006
              }
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
              "name": "狂战士胫甲",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3006.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3006.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3006.png",
                "source": "opgg",
                "id": 3006
              }
            }
          ]
        },
        {
          "row": 1,
          "items": [
            {
              "id": 3158,
              "name": "明朗之靴",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3158.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3158.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3158.png",
                "source": "opgg",
                "id": 3158
              }
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
              "name": "育恩塔尔荒野箭",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3032.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3032.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3032.png",
                "source": "opgg",
                "id": 3032
              }
            },
            {
              "id": 3085,
              "name": "卢安娜的飓风",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3085.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3085.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3085.png",
                "source": "opgg",
                "id": 3085
              }
            },
            {
              "id": 3031,
              "name": "无尽之刃",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3031.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3031.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3031.png",
                "source": "opgg",
                "id": 3031
              }
            }
          ]
        },
        {
          "row": 1,
          "items": [
            {
              "id": 2523,
              "name": "海克斯镜片 C44",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/2523.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/2523.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/2523.png",
                "source": "opgg",
                "id": 2523
              }
            },
            {
              "id": 3046,
              "name": "幻影之舞",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3046.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3046.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3046.png",
                "source": "opgg",
                "id": 3046
              }
            },
            {
              "id": 3031,
              "name": "无尽之刃",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3031.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3031.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3031.png",
                "source": "opgg",
                "id": 3031
              }
            }
          ]
        },
        {
          "row": 2,
          "items": [
            {
              "id": 3118,
              "name": "残疫",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3118.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3118.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3118.png",
                "source": "opgg",
                "id": 3118
              }
            },
            {
              "id": 4005,
              "name": "帝国指令",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/4005.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/4005.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/4005.png",
                "source": "opgg",
                "id": 4005
              }
            },
            {
              "id": 4628,
              "name": "视界专注",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/4628.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/4628.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/4628.png",
                "source": "opgg",
                "id": 4628
              }
            }
          ]
        },
        {
          "row": 3,
          "items": [
            {
              "id": 3032,
              "name": "育恩塔尔荒野箭",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3032.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3032.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3032.png",
                "source": "opgg",
                "id": 3032
              }
            },
            {
              "id": 3085,
              "name": "卢安娜的飓风",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3085.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3085.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3085.png",
                "source": "opgg",
                "id": 3085
              }
            },
            {
              "id": 3153,
              "name": "破败王者之刃",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3153.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3153.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3153.png",
                "source": "opgg",
                "id": 3153
              }
            }
          ]
        },
        {
          "row": 4,
          "items": [
            {
              "id": 3118,
              "name": "残疫",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3118.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3118.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3118.png",
                "source": "opgg",
                "id": 3118
              }
            },
            {
              "id": 6696,
              "name": "公理圆弧",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/6696.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/6696.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/6696.png",
                "source": "opgg",
                "id": 6696
              }
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
    }
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
    "sourceUrl": "https://op.gg/zh-cn/lol/modes/aram-mayhem/malphite/build",
    "syncedAt": "",
    "detailStatus": "synced",
    "augments": [
      {
        "id": "1353",
        "metaId": "1353",
        "iconFile": "Tank_Engine_Large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/Tank_Engine_Large.png",
          "source": "opgg",
          "id": "1353",
          "file": "Tank_Engine_Large.png"
        },
        "name": {
          "zh": "坦克引擎",
          "en": "坦克引擎"
        },
        "priority": 1
      },
      {
        "id": "1211",
        "metaId": "1211",
        "iconFile": "ItsKillingTime_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/ItsKillingTime_large.png",
          "source": "opgg",
          "id": "1211",
          "file": "ItsKillingTime_large.png"
        },
        "name": {
          "zh": "杀戮时间到了",
          "en": "杀戮时间到了"
        },
        "priority": 2
      },
      {
        "id": "1181",
        "metaId": "1181",
        "iconFile": "HeavyHitter_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/HeavyHitter_large.png",
          "source": "opgg",
          "id": "1181",
          "file": "HeavyHitter_large.png"
        },
        "name": {
          "zh": "重量级打击手",
          "en": "重量级打击手"
        },
        "priority": 3
      },
      {
        "id": "1152",
        "metaId": "1152",
        "iconFile": "Quest_SteelYourHeart_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/Quest_SteelYourHeart_large.png",
          "source": "opgg",
          "id": "1152",
          "file": "Quest_SteelYourHeart_large.png"
        },
        "name": {
          "zh": "钢化你心",
          "en": "钢化你心"
        },
        "priority": 4
      },
      {
        "id": "1013",
        "metaId": "1013",
        "iconFile": "CelestialBody_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/CelestialBody_large.png",
          "source": "opgg",
          "id": "1013",
          "file": "CelestialBody_large.png"
        },
        "name": {
          "zh": "星界躯体",
          "en": "星界躯体"
        },
        "priority": 5
      },
      {
        "id": "1097",
        "metaId": "1097",
        "iconFile": "WitchfulThinking_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/WitchfulThinking_large.png",
          "source": "opgg",
          "id": "1097",
          "file": "WitchfulThinking_large.png"
        },
        "name": {
          "zh": "巫师式思考",
          "en": "巫师式思考"
        },
        "priority": 6
      },
      {
        "id": "2006",
        "metaId": "2006",
        "iconFile": "Dropkick_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/Dropkick_large.png",
          "source": "opgg",
          "id": "2006",
          "file": "Dropkick_large.png"
        },
        "name": {
          "zh": "飞身踢",
          "en": "飞身踢"
        },
        "priority": 7
      },
      {
        "id": "1390",
        "metaId": "1390",
        "iconFile": "ARAM_PhenomenalEvil_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/ARAM_PhenomenalEvil_large.png",
          "source": "opgg",
          "id": "1390",
          "file": "ARAM_PhenomenalEvil_large.png"
        },
        "name": {
          "zh": "超凡邪恶",
          "en": "超凡邪恶"
        },
        "priority": 8
      },
      {
        "id": "1041",
        "metaId": "1041",
        "iconFile": "Goliath_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/Goliath_large.png",
          "source": "opgg",
          "id": "1041",
          "file": "Goliath_large.png"
        },
        "name": {
          "zh": "歌利亚巨人",
          "en": "歌利亚巨人"
        },
        "priority": 9
      },
      {
        "id": "2102",
        "metaId": "2102",
        "iconFile": "QuestPressureCooker_large.png",
        "icon": {
          "url": "https://opgg-static.akamaized.net/meta/images/lol/latest/aram-augment/QuestPressureCooker_large.png",
          "source": "opgg",
          "id": "2102",
          "file": "QuestPressureCooker_large.png"
        },
        "name": {
          "zh": "高压锅",
          "en": "高压锅"
        },
        "priority": 10
      }
    ],
    "items": {
      "starter": [
        {
          "row": 0,
          "items": [
            {
              "id": 2031,
              "name": "复用型药水",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/2031.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/2031.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/2031.png",
                "source": "opgg",
                "id": 2031
              }
            },
            {
              "id": 3802,
              "name": "遗失的章节",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3802.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3802.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3802.png",
                "source": "opgg",
                "id": 3802
              }
            }
          ]
        },
        {
          "row": 1,
          "items": [
            {
              "id": 3802,
              "name": "遗失的章节",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3802.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3802.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3802.png",
                "source": "opgg",
                "id": 3802
              }
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
              "name": "法师之靴",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3020.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3020.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3020.png",
                "source": "opgg",
                "id": 3020
              }
            }
          ]
        },
        {
          "row": 1,
          "items": [
            {
              "id": 3111,
              "name": "水银之靴",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3111.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3111.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3111.png",
                "source": "opgg",
                "id": 3111
              }
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
              "name": "残疫",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3118.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3118.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3118.png",
                "source": "opgg",
                "id": 3118
              }
            },
            {
              "id": 4646,
              "name": "风暴狂涌",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/4646.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/4646.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/4646.png",
                "source": "opgg",
                "id": 4646
              }
            },
            {
              "id": 4645,
              "name": "影焰",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/4645.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/4645.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/4645.png",
                "source": "opgg",
                "id": 4645
              }
            }
          ]
        },
        {
          "row": 1,
          "items": [
            {
              "id": 3118,
              "name": "残疫",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3118.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3118.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3118.png",
                "source": "opgg",
                "id": 3118
              }
            },
            {
              "id": 4645,
              "name": "影焰",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/4645.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/4645.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/4645.png",
                "source": "opgg",
                "id": 4645
              }
            },
            {
              "id": 3089,
              "name": "灭世者的死亡之帽",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3089.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3089.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3089.png",
                "source": "opgg",
                "id": 3089
              }
            }
          ]
        },
        {
          "row": 2,
          "items": [
            {
              "id": 3118,
              "name": "残疫",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3118.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3118.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3118.png",
                "source": "opgg",
                "id": 3118
              }
            },
            {
              "id": 4645,
              "name": "影焰",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/4645.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/4645.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/4645.png",
                "source": "opgg",
                "id": 4645
              }
            },
            {
              "id": 4646,
              "name": "风暴狂涌",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/4646.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/4646.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/4646.png",
                "source": "opgg",
                "id": 4646
              }
            }
          ]
        },
        {
          "row": 3,
          "items": [
            {
              "id": 3118,
              "name": "残疫",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3118.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3118.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3118.png",
                "source": "opgg",
                "id": 3118
              }
            },
            {
              "id": 4646,
              "name": "风暴狂涌",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/4646.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/4646.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/4646.png",
                "source": "opgg",
                "id": 4646
              }
            },
            {
              "id": 3089,
              "name": "灭世者的死亡之帽",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3089.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3089.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3089.png",
                "source": "opgg",
                "id": 3089
              }
            }
          ]
        },
        {
          "row": 4,
          "items": [
            {
              "id": 3118,
              "name": "残疫",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3118.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/3118.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/3118.png",
                "source": "opgg",
                "id": 3118
              }
            },
            {
              "id": 6655,
              "name": "卢登的回声",
              "opggIconUrl": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/6655.png",
              "dataDragonIconUrl": "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/6655.png",
              "icon": {
                "url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/item/6655.png",
                "source": "opgg",
                "id": 6655
              }
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
    }
  }
];

export const aramMayhemFallbackData: AramMayhemSnapshot = {
  version: 4,
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
