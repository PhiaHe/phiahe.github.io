# ARAM Mayhem 数据同步说明

记录 OP.GG「ARAM：Mayhem」模式数据的抓取方式、可行性结论与运维注意事项。
所有结论基于 patch 16.13（2026-06-27 探测）。

## 1. 数据来源：OP.GG RSC 流

页面地址：

- 榜单页：`https://op.gg/zh-cn/lol/modes/aram-mayhem`
- 详情页：`https://op.gg/zh-cn/lol/modes/aram-mayhem/{championKey}/build`

OP.GG 是 Next.js（app-router）站点，**没有** `__NEXT_DATA__`、**没有**独立公开 JSON API。
页面数据通过 React Server Components 以流式 chunk 的形式内嵌在 HTML 里：

```html
<script>self.__next_f.push([1, "<被转义的字符串分片>"])</script>
```

解析方式（只读字符串字面量，**不执行**任何脚本）：

1. 用正则匹配所有 `self.__next_f.push([N, "..."])`。
2. 对每个第二参数 `JSON.parse` 解码成字符串。
3. 把所有分片按出现顺序拼接 → 得到完整 RSC 文本。
4. 在 RSC 文本里用结构化标记定位需要的字段。

实现见 `scripts/sync-aram-mayhem-data.mjs` 的 `decodeRscPayload()`。

> 安全/合规：只用普通 `User-Agent` / `Accept` / `Accept-Language` 头；不绕验证码、不用登录 cookie、不做高频请求。

## 2. 榜单页：可稳定解析 173 英雄 live tier

榜单页 RSC 里有一段干净 JSON 数组，标记为 `"champions":[...]`，每个元素：

```json
{ "key": "ashe", "name": "寒冰射手", "image_url": "https://opgg-static.akamaized.net/meta/images/lol/16.13.1/champion/Ashe.png", "champion_id": 22, "id": 22, "tier": 2, "rank": 12 }
```

可直接拿到：英雄 key、`champion_id`、中文名、头像 URL、`tier`(1=最强..5=最弱)、`rank`、patch（从 `image_url` 路径 `/lol/16.13.1/` 解析）。

- 英雄数量：**173**（接近完整英雄池）。
- 这是 `public/data/aram-mayhem.json` 的 live tier 来源（当前 schema 为 **v3 full detail**，见第 3 节）。
- 英文名由 key 派生（OP.GG 榜单只给中文名）。

`tier` → 字母映射：`1→S, 2→A, 3→B, 4→C, 5→D`。

## 3. 详情页：feasibility 已验证（probe）

详情页数据不是干净 JSON，而是渲染成的 React 组件树，需要按标记解析。
`scripts/probe-aram-mayhem-details.mjs` 做了 10 英雄样本 + 173 英雄全量 probe，**只写 `tmp/aram-mayhem-detail-probe.json`，不碰正式 JSON**。

全量 173 英雄字段成功率（patch 16.13）：

| 字段 | 标记 | 成功率 | 说明 |
|---|---|---|---|
| 推荐海克斯 augments | `"li","aram-augment-N"` + `metaType:"aram-augment"` | **100%** | 每英雄 10 个，含 metaId + 中文名，按优先级排序 |
| 推荐装备 items | `metaType:"item"` + `alt` | **100%** | core/boots/starter 三段 |
| 鞋子 boots | `"boots_N"` | **100%** | 每英雄约 2 个选项 |
| 核心装 core | `"core_items_N"` | **100%** | 每行是一条出装路径（多件），约 4–5 行 |
| 技能加点 skills | `"skill_N"` + `extraData` / 18 格升级序列 | **99%** | 仅 Viktor 失败（无标准 QWE 技能格） |
| 符文 runes | — | **0%** | **该模式不发布符文**：详情页只有 build/augments/skills/items 四个 tab，无 rune/perk 数据 |
| patch | `image_url` 路径 | **100%** | |

probe 全程 **0 请求失败**，每请求间隔 500–1000ms，15s timeout，单英雄失败不影响整体。

### 已知解析注意点

- **海克斯没有银/黄金/棱彩分级**：只有「通用海克斯」带 tier 图标（`..._Gold.png` 等），技能型海克斯用自己的图标，没有 rarity 标记。详情页给的是**单一优先级列表**，不是按稀有度分组。所以网站 UI 里的「银/黄金/棱彩」三栏属于**手工整理**内容，抓不到。
- **core_items 每行是出装路径**：一行包含多件装备（如 育恩塔尔荒野箭→卢安娜的飓风→无尽之刃），不是单件。
- **技能优先级**用 18 格升级序列里 Q/W/E 首次出现顺序推导最稳。
- **符文抓不到是数据源本身没有**，不是解析失败。

### 结论

augments/items/skills 均远超阈值（aug≥80、items≥80、skills|runes≥60 → PASS）。
**方案三（每天全量 173 英雄详情同步）在数据可得性上可行，已采纳并合入正式同步脚本。**

据此确定的产品规则（已落实到 schema 与 UI）：

1. **符文不是必需字段。** OP.GG 不为该模式发布符文，UI 不再把符文当作必需数据，
   也不显示符文区域（或显式标注「来源未提供 / Unavailable from source」）。
2. **海克斯不分银/黄金/棱彩。** OP.GG 给的是单一推荐优先级列表，不伪造 rarity。
   UI 文案统一用「推荐海克斯 / Recommended Augments」，**不再出现**
   「银色/黄金/棱彩海克斯」字样。
3. **不抓推荐理由、长篇玩法说明、胜率/登场率。** 这些要么是编辑内容、要么该模式不提供。
4. 技能解析失败的英雄（如 Viktor）标 `detailStatus: "partial"`、`skills: null`，
   UI 显示「技能加点：来源未提供 / Unavailable from source」。

## 4. GitHub Actions 与 Pages 部署

- 同步 workflow：`.github/workflows/sync-aram-mayhem.yml`（每日 `workflow_dispatch` + cron）。
- 部署 workflow：`.github/workflows/deploy.yml`（`push` 到 `master` 时触发 Pages）。

### GITHUB_TOKEN 触发限制

GitHub 的安全机制：用默认 `GITHUB_TOKEN` 推送产生的 commit **不会**自动触发其它 workflow（防止 workflow 互相递归触发）。
因此同步 workflow 提交 `aram-mayhem.json` 后，`deploy.yml` 的 `push` 触发器不会自动生效。

当前处理方式：同步 workflow 在数据**确实变化**且分支为 `master` 时，显式调用

```bash
gh workflow run deploy.yml --ref master
```

来拉起部署，并为此声明 `permissions: actions: write`。
因为同步 workflow 不监听 `push`，所以不会造成无限循环。

数据无变化时（`sourceHash` 相同）脚本不写文件、不提交、不部署。
