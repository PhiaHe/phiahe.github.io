# ARAM Mayhem Hex Helper Design

Date: 2026-06-27

## 1. Goal

Add a practical tool page for League of Legends ARAM Mayhem mode.

The page helps the user quickly answer one question during champion select or early planning:

> I rolled this champion. Which augments should I prioritize, and what item route should I follow?

The page should fit the current Phia Games site style while behaving like a fast lookup tool. It should not feel like a marketing page.

## 2. Terminology

Use these Chinese terms:

- `Augment`: `海克斯`
- `Silver`: `银色`
- `Gold`: `黄金`
- `Prismatic`: `棱彩`
- `ARAM Mayhem`: `海克斯大乱斗`

Use `棱彩` consistently in the UI and documentation for this feature.

## 3. Source

Primary data source:

- `https://op.gg/zh-cn/lol/modes/aram-mayhem`

OP.GG currently presents ARAM Mayhem data with champion search, champion lists, and augment filtering by all / silver / gold / prismatic categories. The tool should reference this data source clearly and include a visible source link.

## 4. Non-Goals

- Do not scrape OP.GG from the user's browser at runtime.
- Do not add account login, personalization, or saved builds.
- Do not modify GitHub Pages or DNS configuration.
- Do not introduce React Router.
- Do not redesign the existing homepage, Inkvoker page, or global visual style.
- Do not claim the data is official Riot Games data.
- Do not hide that OP.GG is the source.

## 5. Recommended Site Placement

Create a new homepage section:

- English: `Quick Tools`
- Chinese: `速查工具`
- Section id: `tools`

Place it after `Featured Work` and before `Visual Lab`.

Reasoning:

- This feature is an actual tool, not a portfolio project.
- It does not belong in Dev Log because it is not an article.
- It should not be buried inside Visual Lab because the primary user task is lookup and decision support.

Add one tool card:

- English title: `ARAM Mayhem Hex Helper`
- Chinese title: `海克斯大乱斗速查`
- Route: `#/tools/aram-mayhem`
- Description EN: `Pick a champion, scan the best augments, and follow the item route.`
- Description ZH: `选到英雄后，快速查看优先海克斯和装备路线。`

Add `Tools / 工具` to the homepage navigation. It should scroll to `#tools` on the homepage.

## 6. Route

Use the existing hash routing pattern.

Route:

- `#/tools/aram-mayhem`

Do not introduce React Router.

The route should render a tool-specific page, not a generic article page.

## 7. Page Structure

### 7.1 Page Header

Purpose:

Establish this as a fast lookup utility.

Content:

- Title: `ARAM Mayhem Hex Helper / 海克斯大乱斗速查`
- Subtitle: concise explanation
- Source badge: `Data source: OP.GG`
- Last updated timestamp

The header should be compact. Do not use a large marketing hero.

### 7.2 Champion Search

Primary interaction:

- Search by Chinese champion name
- Search by English champion name
- Search by aliases if available

Behavior:

- Typing filters champion results immediately.
- Empty search shows a useful default list, such as most common or all champions.
- Pressing Enter selects the first result.
- Keyboard navigation is preferred if practical.

### 7.3 Champion List

Display:

- Champion portrait
- Champion name
- Optional tier or rank
- Optional win rate / pick rate if data is available

Layout:

- Desktop: left-side dense list or top grid with a sticky detail panel
- Mobile: search first, compact result list, selected champion detail below

### 7.4 Champion Detail Panel

When a champion is selected, show:

- Champion name and portrait
- Short summary of play pattern
- Top recommended海克斯
- Equipment route summary
- Source link back to OP.GG for that champion if available

The detail panel should be optimized for fast scanning during a game.

### 7.5 Hex Priority

Group海克斯 by tier:

- 银色
- 黄金
- 棱彩

Each海克斯 entry should include:

- Name
- Tier
- Priority
- Short reason

Priority labels:

- `Core / 核心`
- `Good / 推荐`
- `Situational / 看情况`
- `Avoid / 不推荐`

Recommended visual treatment:

- 银色: cool silver / slate tone
- 黄金: restrained warm gold
- 棱彩: violet-cyan prismatic treatment

Do not overuse gradients. Keep it consistent with the current site's dark, refined UI.

### 7.6 Equipment Routes

Each champion should show 1-3 item routes.

Route examples:

- Poke Mage / 消耗法师
- Crit Carry / 暴击输出
- On-hit / 特效流
- Tank / 坦克
- Bruiser / 战士
- Support / 辅助
- Haste Caster / 技能急速

Each equipment route should include:

- Route name
- Core item sequence
- Optional situational items
- Short note explaining when to choose it
- Any海克斯 synergy note if relevant

### 7.7 Fast Decision Strip

Add a compact "what do I pick now?" area near the top of the selected champion view.

Suggested Chinese labels:

- `优先拿`
- `可接受`
- `装备走向`

Suggested English labels:

- `Take First`
- `Acceptable`
- `Build Toward`

This strip should be the fastest part of the page to read.

## 8. Data Strategy

Recommended approach:

Use a build-time or manual data snapshot, not client-side live scraping.

Why:

- GitHub Pages is static.
- Browser-side requests to OP.GG may fail due to CORS or page rendering changes.
- Runtime scraping would make the user experience brittle.
- A local JSON snapshot makes the tool fast and stable.

Suggested files:

- `src/data/aramMayhemData.json`
- `src/data/aramMayhemTypes.ts`
- Optional sync script: `scripts/sync-aram-mayhem-data.mjs`

First implementation pass:

- Implement page UI with a small, hand-shaped sample dataset.
- Keep the data schema compatible with a later OP.GG sync script.

Second implementation pass:

- Add the sync script.
- Parse OP.GG data into the agreed schema.
- Preserve the previous JSON if sync fails.

## 9. Data Schema

Suggested champion record:

```ts
interface AramMayhemChampion {
  id: string;
  nameZh: string;
  nameEn: string;
  aliases: string[];
  icon: string;
  tier?: string;
  winRate?: string;
  pickRate?: string;
  hexes: {
    silver: HexPick[];
    gold: HexPick[];
    prismatic: HexPick[];
  };
  builds: BuildRoute[];
  sourceUrl: string;
  updatedAt: string;
}
```

Suggested海克斯 record:

```ts
interface HexPick {
  id: string;
  nameZh: string;
  nameEn?: string;
  tier: "silver" | "gold" | "prismatic";
  priority: "core" | "good" | "situational" | "avoid";
  reasonZh: string;
  reasonEn?: string;
}
```

Suggested equipment route:

```ts
interface BuildRoute {
  id: string;
  nameZh: string;
  nameEn: string;
  role: "poke" | "crit" | "on-hit" | "tank" | "bruiser" | "support" | "mage" | "haste";
  coreItems: string[];
  situationalItems?: string[];
  notesZh: string;
  notesEn?: string;
  linkedHexes?: string[];
}
```

## 10. Components

Suggested component boundaries:

- `ToolsSection`
- `ToolCard`
- `AramMayhemPage`
- `ChampionSearch`
- `ChampionResultList`
- `ChampionDetailPanel`
- `HexTierGroup`
- `HexPriorityCard`
- `BuildRoutePanel`
- `SourceNotice`

Keep the data logic separate from UI components.

Suggested helper functions:

- `filterChampions(query, champions)`
- `getTopHexes(champion)`
- `groupHexesByTier(hexes)`
- `sortHexesByPriority(hexes)`

## 11. Visual Direction

The page should feel like a Phia Games utility surface:

- dark background
- restrained cyan / violet / gold accents
- small, dense, readable cards
- no oversized hero section
- no marketing copy blocks
- no generic esports stock-art treatment

The UI should favor speed:

- search always visible near the top
- selected champion details easy to scan
- clear tier separation
- equipment route visible without long scrolling on desktop

Mobile:

- search at top
- results list below search
- selected champion detail below results
- sticky bottom "back to search" or compact selected champion header may be useful

## 12. Image Asset Plan

Codex should provide visual assets later.

Recommended assets:

- `tool-aram-mayhem-cover.jpg`: homepage Tools card cover, 16:10
- `tool-aram-mayhem-hero.jpg`: compact page header image, 16:9 or 16:10
- `hex-tier-silver.png`: optional silver tier visual motif
- `hex-tier-gold.png`: optional gold tier visual motif
- `hex-tier-prismatic.png`: optional 棱彩 tier visual motif

Asset style:

- abstract hex-tech interface board
- prismatic violet-cyan for 棱彩
- restrained gold and silver accents
- no League of Legends logos unless licensing is explicitly addressed
- no misleading official branding

Champion/item icons should come from a reliable game data source if used. Do not generate fake champion portraits.

## 13. Source and Attribution

The page should include a visible source notice:

English:

`Data source: OP.GG ARAM Mayhem. This tool summarizes the data for quick personal lookup.`

Chinese:

`数据来源：OP.GG 海克斯大乱斗。本工具仅用于个人快速速查与整理展示。`

Include link:

- `https://op.gg/zh-cn/lol/modes/aram-mayhem`

Also show:

- `Last updated / 更新时间`

## 14. Error and Empty States

Empty search:

- Show all champions or a curated default list.

No search results:

- Show `No champions found / 未找到英雄`
- Offer clear search reset.

Missing champion data:

- Show champion shell with source link.
- Do not crash or render blank.

Missing OP.GG sync:

- Keep the last valid local JSON.
- Show stale timestamp rather than hiding data.

## 15. Testing Plan

Add focused checks:

- `#/tools/aram-mayhem` resolves to the tool page.
- Homepage Tools card links to `#/tools/aram-mayhem`.
- Search matches Chinese names, English names, and aliases.
- 海克斯 tiers render as 银色 / 黄金 / 棱彩 in Chinese.
- Chinese UI strings use `棱彩` consistently for prismatic augments.
- Every champion record has at least one source URL.
- Every referenced image exists.
- Empty search and no-result states render.
- `npm run lint` passes.
- `npm run build` passes.

Manual checks:

- Homepage navigation scrolls to Tools.
- Tool card opens the page.
- Search is usable on desktop and mobile.
- Champion detail panel does not overflow.
- Equipment route is readable without excessive scrolling.
- OP.GG source link opens correctly.

## 16. Implementation Order

Recommended sequence for Claude:

1. Add `ToolsSection` to the homepage with one card.
2. Add route handling for `#/tools/aram-mayhem`.
3. Add sample `aramMayhemData` with 3-5 champions.
4. Build the search and selected champion detail UI.
5. Add hex tier grouping and equipment route panels.
6. Add source notice and updated timestamp.
7. Add tests for routing, search, terminology, and asset existence.
8. Only after UI is stable, add or plan the OP.GG data sync script.

## 17. Open Implementation Decision

Data sync should be handled as a separate implementation phase after the UI is approved.

Reason:

- The UI can be validated with sample data first.
- OP.GG page structure may change.
- Keeping sync separate makes failures easier to debug.

Recommended first pass:

- Static sample data
- Stable schema
- Clear source attribution
- UI ready for full dataset replacement
