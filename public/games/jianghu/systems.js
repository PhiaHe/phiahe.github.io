(function (root) {
  'use strict';
  const DAY = 86400, TRAIN_TIME = 120, INVITE_TIME = 180;
  const clone = value => JSON.parse(JSON.stringify(value));
  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : fallback;
  const fail = message => ({ ok: false, message });
  const data = () => root.JXData;
  const engine = () => root.JXEngine;
  const now = state => finite(state.clock);
  const metadata = id => data().HEROES.find(h => h.id === id);
  const keys = ['wen', 'wu', 'ya'];
  const teaLabels = { wen: '文令', wu: '武令', ya: '雅令' };
  const validWallTime = value => typeof value === 'number' && Number.isFinite(value) && value >= 946684800000 && value <= 4102444800000;
  const counters = state => ({ battles: finite(state.stats?.battles), recruited: finite(state.stats?.recruited), training: finite(state.systems?.total?.training), challenges: finite(state.systems?.total?.challenges), tea: finite(state.systems?.total?.tea) });
  function calendar(state) {
    const epoch = state.systems.wallNow;
    const day = Math.floor((epoch / 1000 + 28800) / DAY);
    return { day, week: Math.floor((day + 3) / 7) };
  }
  function init(state) {
    if (!state.systems || typeof state.systems !== 'object' || Array.isArray(state.systems)) state.systems = {};
    const s = state.systems;
    if (!validWallTime(s.wallNow)) s.wallNow = validWallTime(state.lastSaved) ? state.lastSaved : validWallTime(state.createdAt) ? state.createdAt : Date.now();
    const c = calendar(state);
    if (!s.total || typeof s.total !== 'object') s.total = {};
    for (const k of ['training', 'invitations', 'challenges', 'challengeWins', 'tea', 'teaWins', 'crafted']) if (!Number.isFinite(s.total[k])) s.total[k] = 0;
    if (!s.records || typeof s.records !== 'object') s.records = {};
    if (!s.fortune || typeof s.fortune !== 'object') s.fortune = { completed: 0, petProgress: 0, medicineCrafts: 0 };
    for (const key of ['completed', 'petProgress', 'medicineCrafts']) if (!Number.isFinite(s.fortune[key])) s.fortune[key] = 0;
    if (!Array.isArray(s.achieved)) s.achieved = [];
    if (!Array.isArray(s.training)) s.training = [null, null];
    if (!Array.isArray(s.invitations)) s.invitations = [null, null];
    while (s.training.length < 2) s.training.push(null);
    while (s.invitations.length < 2) s.invitations.push(null);
    if (s.day !== c.day || !s.daily || typeof s.daily !== 'object') {
      s.day = c.day;
      s.daily = { attempts: {}, claimed: [], base: counters(state), teaPlays: 0, worldDamage: 0, worldClaimed: false, worldMax: 3600 + state.badges.length * 900 };
    }
    if (!s.daily.attempts || typeof s.daily.attempts !== 'object') s.daily.attempts = {};
    if (!Array.isArray(s.daily.claimed)) s.daily.claimed = [];
    if (!s.daily.base || typeof s.daily.base !== 'object') s.daily.base = counters(state);
    if (!s.daily.scenarios || typeof s.daily.scenarios !== 'object') s.daily.scenarios = {};
    if (!Number.isFinite(s.daily.worldMax) || s.daily.worldMax < 1) s.daily.worldMax = 3600 + state.badges.length * 900;
    if (s.week !== c.week) { s.week = c.week; s.weeklyTower = 0; }
    s.version = 1;
    return s;
  }
  function tick(state) { init(state); return []; }
  function syncCalendar(state, wallNow = Date.now()) {
    if (!validWallTime(wallNow)) return fail('日历时间无效，请检查设备时间。');
    if (!state.systems || typeof state.systems !== 'object' || Array.isArray(state.systems)) state.systems = {};
    const previousDay = state.systems.day, previousWeek = state.systems.week;
    // A backwards device-clock correction must not reopen already claimed daily rewards.
    state.systems.wallNow = Math.max(validWallTime(state.systems.wallNow) ? state.systems.wallNow : 0, wallNow);
    const s = init(state);
    return { ok: true, message: '江湖日历已同步。', day: s.day, week: s.week, dayChanged: previousDay !== undefined && previousDay !== s.day, weekChanged: previousWeek !== undefined && previousWeek !== s.week };
  }
  function grant(state, reward, hero) {
    const r = clone(reward || {});
    for (const key of ['silver', 'jade', 'renown']) if (r[key]) state[key] = finite(state[key]) + finite(r[key]);
    if (r.silver) state.stats.silverEarned = finite(state.stats.silverEarned) + r.silver;
    for (const [key, amount] of Object.entries(r.items || {})) state.inventory[key] = finite(state.inventory[key]) + finite(amount);
    if (r.exp) {
      const recipients = hero ? [hero] : state.team.map(uid => state.heroes.find(h => h.uid === uid)).filter(Boolean);
      const xp = Math.max(1, Math.floor(r.exp / Math.max(1, recipients.length)));
      for (const member of recipients) engine().grantXp(state, member, xp);
    }
    return r;
  }
  function finish(state, result) {
    if (result.ok) engine().addLog(state, result.message, 'reward');
    return result;
  }
  function canPay(state, cost) {
    for (const [key, amount] of Object.entries(cost)) {
      const current = key === 'silver' || key === 'jade' ? state[key] : state.inventory[key];
      if (finite(current) < amount) return false;
    }
    return true;
  }
  function pay(state, cost) {
    for (const [key, amount] of Object.entries(cost)) {
      if (key === 'silver' || key === 'jade') state[key] -= amount;
      else state.inventory[key] -= amount;
    }
  }
  const TRAIN_COST = { silver: 100 }, INVITE_COST = { silver: 100, invite: 5 };
  function training(state) {
    const s = init(state);
    const slots = s.training.slice(0, 2).map(slot => {
      if (!slot) return null;
      const hero = state.heroes.find(h => h.uid === slot.uid);
      return { ...slot, name: hero ? metadata(hero.id)?.name || '侠客' : '侠客已离队', remaining: Math.max(0, slot.finish - now(state)), ready: now(state) >= slot.finish, duration: TRAIN_TIME, reward: { exp: 180 + finite(slot.level) * 12 } };
    });
    const invitations = s.invitations.slice(0, 2).map(slot => slot ? { ...slot, name: '江湖邀约', remaining: Math.max(0, slot.finish - now(state)), ready: now(state) >= slot.finish, duration: INVITE_TIME, reward: { hero: 1 } } : null);
    return { slots, invitations, trainingCost: clone(TRAIN_COST), invitationCost: clone(INVITE_COST), trainingDuration: TRAIN_TIME, invitationDuration: INVITE_TIME, description: '传功研习可以与历练同时进行。邀约到时结交一位侠客；重复结交增加同门心得。' };
  }
  function startTraining(state, uid) {
    const s = init(state), hero = state.heroes.find(h => h.uid === uid);
    if (!hero) return fail('找不到这位同行侠客。');
    if (s.training.some(slot => slot?.uid === uid)) return fail('这位侠客正在研习，待本次传功完成再来。');
    const index = s.training.findIndex(slot => !slot);
    if (index < 0) return fail('两处传功席位都已占用。');
    if (!canPay(state, TRAIN_COST)) return fail('传功需要 100 银两。');
    pay(state, TRAIN_COST);
    s.training[index] = { uid, level: hero.level, start: now(state), finish: now(state) + TRAIN_TIME };
    return finish(state, { ok: true, message: `${metadata(hero.id).name}开始研习，2 分钟后可领取修为。`, index });
  }
  function claimTraining(state, index) {
    const s = init(state);
    if (!Number.isInteger(index) || index < 0 || index >= 2 || !s.training[index]) return fail('这里没有待领取的传功。');
    const slot = s.training[index], hero = state.heroes.find(h => h.uid === slot.uid);
    if (now(state) < slot.finish) return fail('传功尚未完成。');
    if (!hero) return fail('传功侠客已不在收藏中。');
    const reward = { exp: 180 + finite(slot.level) * 12 };
    s.training[index] = null; s.total.training++;
    grant(state, reward, hero);
    return finish(state, { ok: true, message: `${metadata(hero.id).name}传功完成，获得 ${reward.exp} 修为。`, rewards: reward });
  }
  function startInvitation(state) {
    const s = init(state), index = s.invitations.findIndex(slot => !slot);
    if (index < 0) return fail('两封江湖邀约都在路上，请先领取回信。');
    if (!canPay(state, INVITE_COST)) return fail('邀约需要 5 封结交帖和 100 银两。');
    pay(state, INVITE_COST);
    s.invitations[index] = { start: now(state), finish: now(state) + INVITE_TIME };
    return finish(state, { ok: true, message: '信使已动身，3 分钟后有侠客应邀而来。', index });
  }
  const roll = rng => { const n = Number(rng()); return Number.isFinite(n) ? Math.min(0.999999, Math.max(0, n)) : 0.5; };
  function claimInvitation(state, index, rng = Math.random) {
    const s = init(state);
    if (!Number.isInteger(index) || index < 0 || index >= 2 || !s.invitations[index]) return fail('没有这封待领取的邀约。');
    if (now(state) < s.invitations[index].finish) return fail('信使尚未返回。');
    const maxRarity = state.badges.length >= 3 ? 4 : state.badges.length ? 3 : 2;
    const pool = data().HEROES.filter(h => h.rarity <= maxRarity && (!h.debutExpansion || (root.JXProgression ? root.JXProgression.isExpansionUnlocked(state,h.debutExpansion) : engine().mainBadgeCount(state)>=data().EXPANSIONS.findIndex(e=>e.id===h.debutExpansion)*2)));
    const notOwned = pool.filter(h => !state.heroes.some(member => member.id === h.id));
    const options = notOwned.length && roll(rng) < 0.75 ? notOwned : pool;
    if (!options.length) return fail('暂时没有可应邀的侠客。');
    const selected = options[Math.floor(roll(rng) * options.length)];
    const added = engine().addHero(state, selected.id, rng);
    s.invitations[index] = null; s.total.invitations++;
    return finish(state, { ok: true, message: added.isNew ? `${selected.name}应邀而来，已收入侠客录。` : `${selected.name}带来同门心得。`, hero: added.hero, isNew: added.isNew, rewards: { hero: selected.id } });
  }
  const QUESTS = [
    { id: 'daily-battles', title: '江湖初行', desc: '今日参与 5 场历练战斗', stat: 'battles', target: 5, reward: { silver: 180, items: { invite: 3 } } },
    { id: 'daily-recruited', title: '广结善缘', desc: '今日结交 2 次侠客，旧友也计入', stat: 'recruited', target: 2, reward: { silver: 120, jade: 5 } },
    { id: 'daily-challenge', title: '试锋', desc: '今日参加任意 1 次活动挑战', stat: 'challenges', target: 1, reward: { silver: 150, items: { ore: 2 } } },
    { id: 'daily-training', title: '温故知新', desc: '今日领取 1 次传功', stat: 'training', target: 1, reward: { silver: 100, items: { exp: 2 } } },
    { id: 'daily-tea', title: '茶香满座', desc: '今日完成 3 局茶馆行令', stat: 'tea', target: 3, reward: { silver: 80, items: { tea: 2 } } }
  ];
  function quests(state) {
    const s = init(state), current = counters(state);
    return QUESTS.map(q => ({ ...clone(q), progress: Math.min(q.target, Math.max(0, current[q.stat] - finite(s.daily.base[q.stat]))), claimed: s.daily.claimed.includes(q.id) }));
  }
  function claimQuest(state, id) {
    const q = quests(state).find(q => q.id === id);
    if (!q) return fail('没有这项委托。');
    if (q.claimed) return fail('今日这项委托已经领取。');
    if (q.progress < q.target) return fail('委托尚未完成。');
    state.systems.daily.claimed.push(id); grant(state, q.reward);
    return finish(state, { ok: true, message: `委托「${q.title}」已交付。`, rewards: q.reward });
  }
  const ACHIEVEMENTS = [
    { id: 'win-10', title: '初露锋芒', desc: '历练累计获胜 10 场', target: 10, read: s => s.stats.wins, reward: { silver: 300, jade: 10 } },
    { id: 'collect-6', title: '六艺同游', desc: '收集 6 位不同侠客', target: 6, read: s => s.dex.length, reward: { silver: 400, items: { invite: 8 } } },
    { id: 'badge-1', title: '江湖有名', desc: '获得第一枚江湖信物', target: 1, read: s => s.badges.length, reward: { jade: 15, items: { exp: 4 } } },
    { id: 'challenge-5', title: '行遍山河', desc: '完成 5 次活动挑战', target: 5, read: s => s.systems.total.challenges, reward: { silver: 600, items: { ore: 8 } } },
    { id: 'training-5', title: '薪火相传', desc: '领取 5 次传功', target: 5, read: s => s.systems.total.training, reward: { silver: 500, jade: 15 } },
    { id: 'tower-10', title: '十层问剑', desc: '无尽试炼最高抵达 10 层', target: 10, read: s => s.systems.records.tower?.best || 0, reward: { jade: 30, items: { ore: 12 } } },
    { id: 'collect-18', title: '江湖知己', desc: '收集 18 位不同侠客', target: 18, read: s => s.dex.length, reward: { silver: 1200, jade: 30 } },
    { id: 'win-100', title: '百战不殆', desc: '历练累计获胜 100 场', target: 100, read: s => s.stats.wins, reward: { silver: 1500, jade: 40 } }
  ];
  function achievements(state) {
    const s = init(state);
    return ACHIEVEMENTS.map(({ read, ...a }) => ({ ...clone(a), progress: Math.min(a.target, finite(read(state))), claimed: s.achieved.includes(a.id) }));
  }
  function claimAchievement(state, id) {
    const a = achievements(state).find(x => x.id === id);
    if (!a) return fail('没有这项成就。');
    if (a.claimed) return fail('这项成就已经领取。');
    if (a.progress < a.target) return fail('尚未达成这项成就。');
    state.systems.achieved.push(id); grant(state, a.reward);
    return finish(state, { ok: true, message: `达成「${a.title}」，奖励已收入行囊。`, rewards: a.reward });
  }
  const CHALLENGES = [
    { id: 'dungeon', name: '秘境会战', subtitle: '风雨稻香村', desc: '与两位 NPC 义士合作，连战山匪前哨、寨门守卫与山寨首领。治疗会恢复队友，坦克优先承伤。', icon: '剑', badges: 0, power: 180, maxAttempts: 3, reward: { silver: 240, exp: 180, items: { invite: 3, ore: 2 } } },
    { id: 'world', name: '江湖大敌', subtitle: '铁甲巨傀', desc: '单人世界首领挑战，NPC 义士助战。每天三次，伤害累计保留；愤怒爆发会攻击全队。破除全部气血后领取首杀奖励。', icon: '魁', badges: 1, power: 1100, maxAttempts: 3, reward: { silver: 700, jade: 15, items: { ore: 8 } } },
    { id: 'tower', name: '无尽试炼', subtitle: '问剑登楼', desc: '从本周最高层继续，每次最多八层；敌人逐层增强，每五层有守关人。没有层间治疗，周一重新起步。', icon: '塔', badges: 1, power: 480, maxAttempts: 3, reward: { silver: 60, exp: 45, items: { ore: 1 } } },
    { id: 'underground', name: '地下探险', subtitle: '龙门古道', desc: '探索六层遗迹，战斗后采集矿石，每三层出现守卫；第二与第五层有休息营地。已探索的奖励不会因败退丢失。', icon: '岩', badges: 1, power: 600, maxAttempts: 3, reward: { silver: 45, exp: 30, items: { ore: 2 } } },
    { id: 'factory', name: '采药制作', subtitle: '万花药圃', desc: '护送药师采集四处药圃。击退沿路野兽，收获矿料、茶叶与疗伤药；材料可用于生活制作。', icon: '药', badges: 0, power: 130, maxAttempts: 4, reward: { silver: 25, exp: 20, items: { ore: 1 } } }
  ];
  function worldMax(state) { return state.systems.daily.worldMax; }
  function challenges(state) {
    const s = init(state);
    return CHALLENGES.map(c => ({ ...clone(c), requirement: c.badges ? `拥有 ${c.badges} 枚江湖信物` : '初入江湖即可参与', unlocked: state.badges.length >= c.badges, attempts: finite(s.daily.attempts[c.id]), progress: c.id === 'world' ? finite(s.daily.worldDamage) : c.id === 'tower' ? finite(s.weeklyTower) : finite(s.records[c.id]?.best), target: c.id === 'world' ? worldMax(state) : c.id === 'tower' ? 100 : c.id === 'underground' ? 6 : c.id === 'factory' ? 4 : 3, completed: c.id === 'world' && !!s.daily.worldClaimed, best: finite(s.records[c.id]?.best), last: s.records[c.id]?.last || null }));
  }
  const strongAgainst = { chunyang: 'tiance', tiance: 'shaolin', shaolin: 'cangjian', cangjian: 'wanhua', wanhua: 'qixiu', qixiu: 'chunyang' };
  function party(state, allies) {
    const fighters = state.team.slice(0, 5).map(uid => state.heroes.find(h => h.uid === uid)).filter(Boolean).map(h => {
      const m = metadata(h.id), stats = engine().getHeroStats(h);
      return { name: m.name, sect: m.sect, role: engine().getRole?.(h) || m.role, maxHp: stats.hp, hp: stats.hp, atk: stats.atk, def: stats.def, crit: stats.crit || 0, sourceHero: h, revives: 0, npc: false };
    });
    if (allies && fighters.length) {
      fighters.push({ name: '药师阿青（NPC）', sect: 'wanhua', role: 'healer', maxHp: 150, hp: 150, atk: 19, def: 10, npc: true });
      fighters.push({ name: '镖师韩岳（NPC）', sect: 'tiance', role: 'tank', maxHp: 220, hp: 220, atk: 23, def: 15, npc: true });
    }
    return fighters;
  }
  function opponent(level, name, boss, sect) {
    const scale = boss ? 1.4 : 1;
    return { name, sect: sect || 'tiance', hp: Math.round((85 + level * 15) * scale), atk: Math.round((9 + level * 2.4) * scale), def: Math.round(3 + level * 1.25), boss: !!boss };
  }
  function duel(team, enemy, log, rng, limit = 14) {
    const original = enemy.hp;
    let rounds = 0;
    log.push(`遭遇 ${enemy.name}，气血 ${Math.ceil(enemy.hp)}。`);
    for (; rounds < limit && enemy.hp > 0 && team.some(h => h.hp > 0);) {
      rounds++;
      for (const hero of team.filter(h => h.hp > 0)) {
        const critical = roll(rng) < 0.08 + (hero.crit || 0);
        const profile = hero.sourceHero && root.JXEquipment ? root.JXEquipment.combatProfile(hero.sourceHero, rounds, critical) : { damageMultiplier: 1, healMultiplier: 1, damageReduction: 0 };
        if (hero.role === 'healer') {
          const hurt = team.filter(h => h.hp > 0 && h.hp < h.maxHp * 0.82).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
          if (hurt) { const amount = Math.min(hurt.maxHp - hurt.hp, Math.round((hero.atk * 1.15 + 12) * profile.healMultiplier)); hurt.hp += amount; log.push(`${hero.name}行针，为${hurt.name}回复 ${amount} 气血。`); }
        }
        if (profile.teamHeal) for (const friend of team.filter(h => h.hp > 0 && h.hp < h.maxHp)) { const amount = Math.min(friend.maxHp - friend.hp, Math.round(hero.atk * profile.teamHeal)); friend.hp += amount; log.push(`${hero.name}神兵济世，为${friend.name}回复 ${amount} 气血。`); }
        const advantage = strongAgainst[hero.sect] === enemy.sect;
        const damage = Math.max(2, Math.round((hero.atk * (hero.role === 'healer' ? 0.75 : 1.18) - enemy.def * 0.4) * (0.9 + roll(rng) * 0.2) * (advantage ? 1.25 : 1) * profile.damageMultiplier * (critical ? 1.5 : 1)));
        for(let strike=0;strike<1+(profile.extraStrike||0)&&enemy.hp>0;strike++){
          const actual=Math.min(enemy.hp,damage);enemy.hp=Math.max(0,enemy.hp-damage);
          if(profile.lifesteal)hero.hp=Math.min(hero.maxHp,hero.hp+Math.round(actual*profile.lifesteal));
          log.push(`第 ${rounds} 回合 · ${hero.name}${strike?'神兵追击':critical?'会心':advantage?'克敌制胜':'出招'}，造成 ${damage} 伤害。`);
        }
        if (enemy.hp <= 0) break;
      }
      if (enemy.hp <= 0) break;
      const living = team.filter(h => h.hp > 0);
      const tank = living.find(h => h.role === 'tank');
      const targets = enemy.boss && rounds % (enemy.areaEvery||3) === 0 ? living : [tank || living[0]];
      if (targets.length > 1) log.push(`${enemy.name}蓄力爆发，横扫全队！`);
      const enraged=enemy.enrageRound&&rounds>=enemy.enrageRound;
      const heavy=enemy.heavyEvery&&rounds%enemy.heavyEvery===0;
      if(enraged&&rounds===enemy.enrageRound)log.push(`${enemy.name}进入狂暴，伤害提高！`);
      if(heavy)log.push(`${enemy.name}施展破甲重击！`);
      for (const target of targets) {
        const profile=target.sourceHero&&root.JXEquipment?root.JXEquipment.combatProfile(target.sourceHero,rounds,false):{damageReduction:0,revive:0};
        const damage = Math.max(3, Math.round((enemy.atk*(enraged?1.8:1)*(heavy?1.45:1) - target.def * (target.role === 'tank' ? 0.65 : 0.38)) * (0.9 + roll(rng) * 0.2) * (1-profile.damageReduction)));
        target.hp = Math.max(0, target.hp - damage);
        if(target.hp===0&&target.revives<(profile.revive||0)){target.revives++;target.hp=Math.ceil(target.maxHp*.3);log.push(`${target.name}神兵不屈，恢复30%气血重返战阵！`);}
        log.push(`${target.name}${target.role === 'tank' && targets.length === 1 ? '挺身护队' : '受击'} −${damage}${target.hp <= 0 ? '，暂退战阵' : ''}。`);
      }
    }
    const won = enemy.hp <= 0;
    log.push(won ? `${enemy.name}已败，队伍继续前行。` : `${enemy.name}尚未倒下，队伍${team.some(h => h.hp > 0) ? '暂且撤退' : '力竭退守'}。`);
    return { won, rounds, damage: Math.max(0, original - enemy.hp) };
  }
  function challenge(state, id, rng = Math.random) {
    const c = challenges(state).find(x => x.id === id);
    if (!c) return fail('找不到这项江湖挑战。');
    if (!c.unlocked) return fail(`${c.name}尚未开放：${c.requirement}。`);
    if (c.completed) return fail('今日的江湖大敌已击败，明日再来。');
    if (c.attempts >= c.maxAttempts) return fail('今日次数已用完，明日再来。');
    if (id === 'tower' && state.systems.weeklyTower >= 100) return fail('本周已登临百层之巅，周一将开启新一轮。');
    const team = party(state, id === 'dungeon' || id === 'world');
    if (!team.length) return fail('请先选择至少一位同行侠客。');
    const s = state.systems, log = [`${c.name}开始：${team.map(h => h.name).join('、')}。`];
    s.daily.attempts[id] = c.attempts + 1; s.total.challenges++;
    let won = false, rounds = 0, floor = 0, damage = 0, reward = {};
    if (id === 'world') {
      const enemy = opponent(28, '铁甲巨傀', true, 'cangjian');
      enemy.hp = Math.max(1, worldMax(state) - finite(s.daily.worldDamage));
      const fight = duel(team, enemy, log, rng, 12);
      damage = fight.damage; rounds = fight.rounds; won = fight.won;
      s.daily.worldDamage = Math.min(worldMax(state), finite(s.daily.worldDamage) + damage);
      reward = { silver: Math.max(20, Math.floor(damage / 8)), exp: Math.max(15, Math.floor(damage / 10)), items: { ore: Math.max(1, Math.floor(damage / 500)) } };
      if (won && !s.daily.worldClaimed) { s.daily.worldClaimed = true; reward.silver += 700; reward.jade = 15; reward.items.ore += 8; }
      log.push(`本次贡献 ${Math.round(damage)} 伤害；今日累计 ${Math.round(s.daily.worldDamage)} / ${worldMax(state)}。这是个人挑战记录。`);
    } else {
      const count = id === 'dungeon' ? 3 : id === 'factory' ? 4 : id === 'underground' ? 6 : Math.min(8, 100 - finite(s.weeklyTower));
      const start = id === 'tower' ? finite(s.weeklyTower) : 0;
      for (let i = 1; i <= count; i++) {
        const level = id === 'dungeon' ? 3 + i * 2 : id === 'factory' ? 1 + i * 2 : id === 'underground' ? 8 + i * 3 : 8 + (start + i) * 4;
        const boss = id === 'dungeon' ? i === count : id === 'underground' ? i % 3 === 0 : id === 'tower' ? (start + i) % 5 === 0 : i === count;
        const name = id === 'dungeon' ? ['山匪前哨', '寨门守卫', '山寨首领'][i - 1] : id === 'factory' ? `第 ${i} 处药圃·${i === count ? '山林兽王' : '野兽'}` : `${id === 'tower' ? '问剑' : '遗迹'}第 ${start + i} 层${boss ? '守关人' : '巡守'}`;
        const enemy = opponent(level, name, boss, ['tiance', 'cangjian', 'shaolin', 'chunyang'][i % 4]);
        const fight = duel(team, enemy, log, rng);
        rounds += fight.rounds; damage += fight.damage;
        if (!fight.won) break;
        floor++;
        if (id === 'underground' && (i === 2 || i === 5)) {
          for (const h of team.filter(h => h.hp > 0)) h.hp = Math.min(h.maxHp, h.hp + Math.round(h.maxHp * 0.35));
          log.push('发现篝火营地，尚在战阵的侠客恢复 35% 气血。');
        }
      }
      won = floor === count;
      if (id === 'dungeon') reward = won ? clone(c.reward) : { silver: floor * 50, exp: floor * 35, items: { ore: floor } };
      else reward = { silver: floor * c.reward.silver, exp: floor * c.reward.exp, items: { ore: floor * c.reward.items.ore } };
      if (id === 'factory' && floor) { reward.items.herb = floor * 3; reward.items.medicine = Math.ceil(floor / 2); reward.items.tea = floor >= 3 ? 1 : 0; }
      if (id === 'underground' && won) reward.items.invite = 3;
      if (id === 'tower') { s.weeklyTower = start + floor; floor = s.weeklyTower; if (floor > start && floor % 5 === 0) reward.jade = 5; }
      log.push(`${id === 'tower' ? `本周最高 ${floor} 层` : `本次通过 ${floor} / ${count} 关`}，已得收益全部带回。`);
    }
    if (won) s.total.challengeWins++;
    grant(state, reward);
    const previous = s.records[id] || { runs: 0, wins: 0, best: 0 };
    s.records[id] = { runs: finite(previous.runs) + 1, wins: finite(previous.wins) + (won ? 1 : 0), best: Math.max(finite(previous.best), id === 'world' ? Math.round(damage) : floor), last: { won, floor, damage: Math.round(damage), rounds, at: now(state), rewards: clone(reward) } };
    const message = id === 'world' ? `${won ? '铁甲巨傀已被击败' : '已完成本次攻坚'}，贡献 ${Math.round(damage)} 伤害。` : `${c.name}${won ? '顺利完成' : '暂且收兵'}，${id === 'tower' ? '抵达' : '通过'} ${floor} ${id === 'tower' ? '层' : '关'}。`;
    return finish(state, { ok: true, message, won, rewards: reward, log, rounds, floor, damage, allies: id === 'dungeon' || id === 'world' ? 'NPC 义士' : null });
  }
  function expansionDungeons(state) {
    init(state);const q=root.JXEquipment?.init(state);
    return (data().DUNGEONS||[]).map(d=>({...clone(d),unlocked:engine().routeUnlocked(state,d.routeId),requirement:engine().routeRequirement(state,d.routeId),record:q?.dungeons[d.id]||{runs:0,wins:0,best:0},
      readiness:root.JXDungeonRules?{normal:root.JXDungeonRules.readiness(state,d,'normal'),challenge:root.JXDungeonRules.readiness(state,d,'challenge')}:null,
      lootNote:d.materialDrop===false?'完整击败全部首领后结算入门装备、五行石与侠名；不产出玄晶、陨铁。':'完整通关后按首领数结算对应装备、陨铁、玄晶机会及侠名；挑战难度奖励更高。'}));
  }
  function challengeExpansionDungeon(state,id,rng=Math.random,difficulty='normal') {
    if(!['normal','challenge'].includes(difficulty))return fail('秘境难度无效。');
    const d=expansionDungeons(state).find(x=>x.id===id);if(!d)return fail('找不到这座资料片秘境。');if(!d.unlocked)return fail(`尚未开启：${d.requirement}。`);if(state.battle)return fail('请等当前历练战斗结束后挑战。');
    const readiness=root.JXDungeonRules?.readiness(state,d,difficulty);if(readiness&&!readiness.ready)return {...fail('整备不足：'+readiness.unmet.join('；')+'。'),readiness};
    const team=party(state,false);if(!team.length)return fail('请先安排同行侠客。');
    const modeLabel=difficulty==='challenge'?'挑战':'普通';
    const log=[`${d.name} · ${modeLabel}：${team.map(h=>h.name).join('、')}出战。`],loot=[],bosses=[];let floor=0,rounds=0,damage=0;
    for(let i=0;i<d.bosses.length;i++){
      const enemy=root.JXDungeonRules?.encounter(state,d,i,difficulty)||opponent(d.level+i*1.5,typeof d.bosses[i]==='string'?d.bosses[i]:d.bosses[i].name,true,'');
      if(!root.JXDungeonRules)enemy.hp=Math.round(enemy.hp*(d.materialDrop===false?1.1:2.5));
      if(enemy.mechanic)log.push(`第 ${i+1}/${d.bosses.length} 位首领 · ${enemy.mechanic}`);
      const portrait={name:enemy.name,artId:enemy.artId,bossIndex:i,maxHp:enemy.hp,atk:enemy.atk,def:enemy.def,mechanic:enemy.mechanic||''};
      const fight=duel(team,enemy,log,rng,30);rounds+=fight.rounds;damage+=fight.damage;bosses.push({...portrait,won:fight.won,rounds:fight.rounds});if(!fight.won)break;floor++;
      for(const member of team.filter(h=>h.hp>0))member.hp=Math.min(member.maxHp,member.hp+Math.floor(member.maxHp*(difficulty==='challenge'?.24:.3)));
    }
    const won=floor===d.bosses.length,multiplier=difficulty==='challenge'?1.5:1;
    const reward=won?{silver:Math.round(floor*(60+d.level*3)*multiplier),exp:Math.round(floor*(40+d.level*5)*multiplier),renown:Math.round(floor*(difficulty==='challenge'?45:25))}:{};
    if(won){
      if(difficulty==='normal'){
        state.clears[d.routeId]=(state.clears[d.routeId]||0)+1;
        if(!state.badges.includes(d.routeId)){
          state.badges.push(d.routeId);reward.jade=20;reward.items={invite:5};
          log.push('首次通关「'+d.name+'」，获得通行信物、20侠玉与5张结交帖。');
        }
      }
      for(let i=0;i<floor;i++)if(root.JXEquipment){const rewards=root.JXEquipment.onVictory(state,{route:{name:d.name,level:Math.min(d.level,10+Math.max(0,data().EXPANSIONS.findIndex(e=>e.id===d.expansionId))*5),expansionId:d.expansionId},boss:true,rng,dungeon:d});loot.push(...rewards);log.push(...rewards);}
      grant(state,reward);
    }else log.push('本次未完整通关，不结算秘境战利品；整备后可重新挑战。');
    state.systems.total.challenges++;if(won)state.systems.total.challengeWins++;
    if(root.JXDungeonRules)root.JXDungeonRules.record(state,d,difficulty,{won,floor,rounds,damage,bosses});
    else{const q=root.JXEquipment.init(state),old=q.dungeons[id]||{runs:0,wins:0,best:0};q.dungeons[id]={runs:old.runs+1,wins:old.wins+(won?1:0),best:Math.max(old.best,floor)};}
    return finish(state,{ok:true,won,difficulty,readiness,bosses,message:`${d.name} · ${modeLabel}${won?'已通关':'暂退'}，击败 ${floor}/${d.bosses.length} 位首领。`,floor,rounds,damage,rewards:reward,loot,log});
  }
  function forgeTrial(state,recipe,uid) {
    const team=party(state,false);if(!team.some(h=>h.sourceHero?.uid===uid))return {won:false,log:['铸剑侠客必须亲自入队参与器魂试炼。']};
    const name=recipe.trialName||(recipe.mode==='classic'?'神剑冢·器魂':'古剑台·欧冶子剑灵'),log=[`${name}：以本人的五人队伍接受认可。`],enemy=opponent(Math.max(12,Math.round(recipe.level*.65)),name,true,'chunyang');enemy.hp=Math.round(enemy.hp*3);
    return {...duel(team,enemy,log,()=>.5,35),log};
  }
  const RECIPES = [
    { id: 'medicine', name: '调制疗伤药', desc: '以药圃采来的草药调配疗伤药。', cost: { silver: 30, herb: 2 }, output: { medicine: 3 } },
    { id: 'invite', name: '誊写结交帖', desc: '以清茶待客，誊写江湖结交帖。', cost: { silver: 80, tea: 1 }, output: { invite: 5 } },
    { id: 'exp', name: '研读修为札记', desc: '整理采集心得与功法笔记，制成修为札记。', cost: { silver: 60, ore: 2 }, output: { exp: 2 } }
  ];
  function recipes(state) { init(state); return RECIPES.map(r => ({ ...clone(r), available: canPay(state, r.cost) })); }
  function craft(state, id) {
    const s = init(state), recipe = RECIPES.find(r => r.id === id);
    if (!recipe) return fail('没有这份制作配方。');
    if (!canPay(state, recipe.cost)) return fail('银两或制作材料不足，可先前往万花药圃采集。');
    pay(state, recipe.cost); grant(state, { items: recipe.output }); s.total.crafted++;
    if (id === 'medicine') s.fortune.medicineCrafts++;
    return finish(state, { ok: true, message: `${recipe.name}完成，成品已收入行囊。`, rewards: { items: clone(recipe.output) } });
  }
  function teaInfo(state) {
    const s = init(state), preferred = keys[((s.day % 3) + 3) % 3];
    return { name: '茶馆行令', cost: 10, attempts: finite(s.daily.teaPlays), maxAttempts: 10, preferred, hint: `茶客今日偏爱${teaLabels[preferred]}。文克武、武克雅、雅克文；三轮得分大于零即胜。`, choices: keys.map(id => ({ id, name: teaLabels[id], desc: `${teaLabels[id]}克${teaLabels[keys[(keys.indexOf(id) + 1) % 3]]}` })) };
  }
  function playTea(state, choice, rng = Math.random) {
    const info = teaInfo(state), s = state.systems;
    if (!keys.includes(choice)) return fail('请选择文令、武令或雅令。');
    if (info.attempts >= info.maxAttempts) return fail('今日已行令十局，明日再叙。');
    if (state.silver < info.cost) return fail('茶资需要 10 银两。');
    state.silver -= info.cost; s.daily.teaPlays = info.attempts + 1; s.total.tea++;
    let score = 0; const log = [];
    for (let round = 1; round <= 3; round++) {
      const number = roll(rng), enemy = number < 0.6 ? info.preferred : keys[Math.floor((number - 0.6) / 0.4 * 3) % 3];
      const won = keys[(keys.indexOf(choice) + 1) % 3] === enemy;
      const outcome = choice === enemy ? 0 : won ? 1 : -1; score += outcome;
      log.push(`第 ${round} 轮：你出${teaLabels[choice]}，茶客（NPC）出${teaLabels[enemy]}，${outcome === 0 ? '平局' : outcome > 0 ? '得一筹' : '失一筹'}。`);
    }
    const won = score > 0, reward = won ? { silver: 35, items: { tea: 1 } } : score === 0 ? { silver: 10 } : {};
    if (won) s.total.teaWins++; grant(state, reward);
    return finish(state, { ok: true, won, score, message: won ? '行令得胜，茶客赠你清茶一盏。' : score === 0 ? '不分伯仲，退还茶资。' : '此番略逊一筹，明察茶客偏好再来。', rewards: reward, log });
  }
  function records(state) {
    const s = init(state);
    return CHALLENGES.map(c => ({ id: c.id, name: c.name, ...clone(s.records[c.id] || { runs: 0, wins: 0, best: 0, last: null }), unit: c.id === 'world' ? '伤害' : '层', personal: true }));
  }
  const SCENARIO_DURATION = 30 * 60 * 1000;
  const SCENARIOS = [
    {
      id: 'village-help', name: '义助乡民', region: '稻香村', badges: 0, icon: '稻',
      desc: '初入稻香村时的一段市井相助：乡民的粮车停在村口，小狸猫蜷在车旁，不肯离开。',
      dialogue: ['茶博士将一封皱巴巴的口信递来：“村口的粮车误了时辰，村里人正等着。”', '老车夫拍拍车辕：“少侠愿意随车走一程，还是替我们添些干粮，请个熟路人？”'],
      choices: [
        { id: 'escort', label: '亲自护送', desc: '不花银两，接取后赢得 3 场历练战斗，护送粮车抵达村口。', cost: {}, requirements: [{ stat: 'wins', label: '抉择后历练获胜', target: 3 }], reward: { silver: 180, exp: 100, pet: 'ricecat' }, text: '你接过缰绳，约同伴前往小径。护住沿途乡民，便算不负这一程。', ending: '粮车顺利回村。小狸猫蹭了蹭你的衣角，认定了这位新朋友。' },
        { id: 'provisions', label: '备粮雇人', desc: '支付 160 银两备粮；接取后参与 1 场历练战斗，为车夫探明沿路情况。', cost: { silver: 160 }, requirements: [{ stat: 'battles', label: '抉择后探路战斗', target: 1 }], reward: { jade: 8, items: { invite: 3 } }, text: '你备好路粮，请熟路人照应粮车，自己先去探一探小径。', ending: '乡民送来三封结交帖：“少侠的善意，大家都记着。”' }
      ]
    },
    {
      id: 'snow-trail', name: '雪山寻踪', region: '纯阳 · 华山', badges: 2, icon: '雪',
      desc: '华山山道落了一夜松雪。茶客捎来消息：一只白狐在旧亭旁徘徊，似乎在等迷路的人。',
      dialogue: ['来自华山的旅人拂去斗篷上的雪：“旧亭旁有几行脚印，走到松林里就断了。”', '山门弟子道：“可备药沿踪而行，也可先向识路的同门请教，修心静气，再辨风雪。”'],
      choices: [
        { id: 'track', label: '备药踏雪', desc: '携出 1 份止血散，抉择后赢得 4 场历练战斗，逐段查明踪迹。', cost: { medicine: 1 }, requirements: [{ stat: 'wins', label: '抉择后寻踪获胜', target: 4 }], reward: { silver: 240, items: { ore: 3 }, pet: 'snowfox' }, text: '你系紧药囊，在雪上留下与同伴并行的脚印。', ending: '迷路旅人已被引回山门。踏雪狐从松后探出头，悄悄跟上你的脚步。' },
        { id: 'consult', label: '煮茶问道', desc: '奉上 1 盏清心茶；抉择后领取 1 次传功，整理华山行路经验。', cost: { tea: 1 }, requirements: [{ stat: 'training', label: '抉择后领取传功', target: 1 }], reward: { exp: 180, hero: 'chunyang_3' }, text: '松风过窗，你将旅人的口信铺在桌上，与同门辨认山路。', ending: '顾听雪赞你行事周详，愿与你结伴，将山中所学传给更多行路人。' }
      ]
    },
    {
      id: 'valley-healer', name: '医者仁心', region: '万花 · 秦岭青岩', badges: 4, icon: '花',
      desc: '秦岭青岩的万花谷传来求援：一支商旅受了风寒，临时药棚正缺少照应人手。',
      dialogue: ['药棚里的年轻医者拱手相迎：“治病救人，半在药石，半在照料。愿少侠助我们一臂之力。”', '桌上列着两张单子：一张是眼下急需的成药，另一张是山间尚待采集的药材。'],
      choices: [
        { id: 'aid', label: '施药护行', desc: '捐出 2 份止血散；抉择后赢得 2 场历练战斗，为药棚守住行路安全。', cost: { medicine: 2 }, requirements: [{ stat: 'wins', label: '抉择后护行获胜', target: 2 }], reward: { silver: 280, exp: 180, hero: 'wanhua_3' }, text: '你将成药交给医者，又与同伴约定轮流巡视药棚周围。', ending: '程墨生收好药箱，向你郑重一礼：“愿与你同行，让这份善意走得更远。”' },
        { id: 'gather', label: '采药制散', desc: '支付 60 银两准备药篓；抉择后完整完成 1 次采药挑战，并制作 1 次止血散。', cost: { silver: 60 }, requirements: [{ stat: 'factoryWins', label: '抉择后采药通关', target: 1 }, { stat: 'medicineCrafts', label: '抉择后调制止血散', target: 1 }], reward: { silver: 220, items: { medicine: 4 }, pet: 'deer' }, text: '你带上药篓与研钵，沿溪辨认药草。采药之外，也记得到百工坊制成止血散。', ending: '药棚终于备足药材。一只灵溪鹿停在溪边，等着与你一起走出山谷。' }
      ]
    }
  ];
  const scenarioCounters = state => ({ wins: finite(state.stats.wins), battles: finite(state.stats.battles), training: finite(state.systems.total.training), factoryWins: finite(state.systems.records.factory?.wins), medicineCrafts: finite(state.systems.fortune.medicineCrafts) });
  function scenarios(state) {
    const s = init(state), current = scenarioCounters(state);
    const petPity = { progress: s.fortune.petProgress, target: 3, remaining: 3 - s.fortune.petProgress, completed: s.fortune.completed, collectionComplete: data().PETS.every(p => state.pets.includes(p.id)), desc: '每完成 3 次奇遇，额外必得一只尚未拥有的跟宠；进度跨日保留。' };
    return SCENARIOS.map(def => {
      const record = s.daily.scenarios[def.id], chosen = def.choices.find(choice => choice.id === record?.choice);
      const unlocked = state.badges.length >= def.badges;
      const objectives = (chosen?.requirements || []).map(goal => ({ ...goal, progress: Math.min(goal.target, Math.max(0, current[goal.stat] - finite(record?.base?.[goal.stat]))) }));
      let stage = !unlocked ? 'locked' : !record ? 'available' : record.stage === 'completed' ? 'completed' : s.wallNow >= record.expiresAt ? 'expired' : record.stage === 'choice' ? 'choice' : objectives.length && objectives.every(goal => goal.progress >= goal.target) ? 'ready' : 'active';
      const labels = { locked: '尚未结缘', available: '茶馆有信', choice: '如何相助', active: '行走江湖', ready: '佳音已至', completed: '今日缘成', expired: '今日缘尽' };
      return {
        id: def.id, name: def.name, region: def.region, icon: def.icon, desc: def.desc, dialogue: clone(def.dialogue),
        note: '本作原创玩法演绎，并非官方任务原文。每日一回，接取后 30 分钟内且须在当日完成。',
        unlocked, requirement: def.badges ? `取得 ${def.badges} 枚江湖信物` : '初入江湖即可相助', stage, stageLabel: labels[stage],
        phase: ['available', 'locked'].includes(stage) ? 0 : stage === 'choice' ? 1 : 2,
        remaining: record && !['completed', 'expired'].includes(stage) ? Math.max(0, Math.ceil((record.expiresAt - s.wallNow) / 1000)) : 0,
        objectives, canComplete: stage === 'ready', completedToday: stage === 'completed', selectedChoice: chosen?.id || null,
        story: stage === 'completed' ? chosen?.ending : chosen?.text || def.dialogue[0],
        reward: clone(chosen?.reward || {}), petPity: clone(petPity),
        choices: def.choices.map(choice => ({ ...clone(choice), available: canPay(state, choice.cost), reason: canPay(state, choice.cost) ? '' : '所需银两或物资不足' }))
      };
    });
  }
  function givePet(state, id) {
    if (!data().PETS.some(p => p.id === id) || state.pets.includes(id)) return false;
    state.pets.push(id); if (!state.activePet) state.activePet = id;
    return true;
  }
  function chooseScenario(state, id, choiceId) {
    const view = scenarios(state).find(q => q.id === id), def = SCENARIOS.find(q => q.id === id);
    if (!view || !def) return fail('没有这封奇遇来信。');
    if (!view.unlocked) return fail(`这段缘分尚未开启：${view.requirement}。`);
    const s = state.systems, record = s.daily.scenarios[id];
    if (choiceId === 'start') {
      if (record) return fail('今日已经接过这封来信，明日再来茶馆。');
      const midnight = (s.day + 1) * DAY * 1000 - 28800000;
      s.daily.scenarios[id] = { stage: 'choice', startedAt: s.wallNow, expiresAt: Math.min(s.wallNow + SCENARIO_DURATION, midnight), choice: null, base: {} };
      return finish(state, { ok: true, message: `接下「${def.name}」，请决定如何相助。`, stage: 'choice', dialogue: clone(def.dialogue) });
    }
    if (!record) return fail('请先在茶馆接下这封来信。');
    if (view.stage === 'completed') return fail('今日这段奇遇的奖励已经领取。');
    if (view.stage === 'expired') return fail('今日的约定时限已过，明日可再次接取。');
    if (choiceId === 'complete') {
      if (view.stage !== 'ready') return fail('约定尚未完成，请先完成奇遇目标。');
      const chosen = def.choices.find(choice => choice.id === record.choice);
      const { pet, hero, ...ordinaryReward } = chosen.reward;
      const reward = clone(ordinaryReward), petIds = [], heroIds = [];
      record.stage = 'completed'; record.completedAt = s.wallNow;
      s.fortune.completed++; s.fortune.petProgress++;
      if (pet) {
        if (givePet(state, pet)) petIds.push(pet);
        else reward.silver = finite(reward.silver) + 50;
      }
      if (hero) { engine().addHero(state, hero); heroIds.push(hero); }
      let guaranteed = false;
      if (s.fortune.petProgress >= 3) {
        s.fortune.petProgress = 0;
        const missing = data().PETS.find(p => !state.pets.includes(p.id));
        if (missing) { givePet(state, missing.id); petIds.push(missing.id); guaranteed = true; }
        else reward.jade = finite(reward.jade) + 5;
      }
      grant(state, reward);
      if (petIds.length) reward.petIds = petIds;
      if (heroIds.length) reward.heroIds = heroIds;
      const names = petIds.map(petId => data().PETS.find(p => p.id === petId).name);
      const suffix = names.length ? ` ${names.join('、')}加入跟宠图鉴。` : '';
      return finish(state, { ok: true, message: `${chosen.ending}${suffix}${guaranteed ? ' 已触发三次奇遇跟宠保底！' : ''}`, stage: 'completed', rewards: reward, guaranteed, log: [def.dialogue[0], chosen.text, chosen.ending, ...(guaranteed ? ['善缘累积三回，获得一只尚未收集的跟宠。'] : [])] });
    }
    const choice = def.choices.find(candidate => candidate.id === choiceId);
    if (!choice) return fail('没有这项抉择，请选择来信中的答复。');
    if (record.stage !== 'choice') return fail('抉择已定，请完成当前的约定。');
    if (!canPay(state, choice.cost)) return fail('所需银两或物资不足，暂时无法作此抉择。');
    pay(state, choice.cost); record.choice = choice.id; record.stage = 'active'; record.base = scenarioCounters(state);
    return finish(state, { ok: true, message: choice.text, stage: 'active', objectives: clone(choice.requirements), cost: clone(choice.cost) });
  }
  function validateSave(state) {
    root.JXDungeonRules?.validateRecords(state);
    const s = state.systems;
    const reject = detail => { throw new Error(`存档中的江湖活动数据无效：${detail}。`); };
    const object = value => !!value && typeof value === 'object' && !Array.isArray(value);
    const number = (value, max = 1e12) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max;
    const integer = (value, max = 1e9) => number(value, max) && Number.isInteger(value);
    const ids = (value, allowed) => Array.isArray(value) && new Set(value).size === value.length && value.every(id => allowed.includes(id));
    const fields = (obj, names, integerOnly = true) => names.every(key => obj[key] === undefined || (integerOnly ? integer(obj[key]) : number(obj[key])));
    if (!object(s)) reject('活动状态');
    if (s.version !== undefined && s.version !== 1) reject('活动版本');
    if (s.wallNow !== undefined && !validWallTime(s.wallNow)) reject('现实日历时间');
    if (!fields(s, ['day', 'week', 'weeklyTower']) || (s.weeklyTower !== undefined && s.weeklyTower > 100)) reject('日历或试炼层数');
    if (s.total !== undefined && (!object(s.total) || !fields(s.total, ['training', 'invitations', 'challenges', 'challengeWins', 'tea', 'teaWins', 'crafted']))) reject('累计次数');
    if (s.achieved !== undefined && !ids(s.achieved, ACHIEVEMENTS.map(a => a.id))) reject('成就领奖记录');
    if (s.fortune !== undefined && (!object(s.fortune) || !fields(s.fortune, ['completed', 'petProgress', 'medicineCrafts']) || (s.fortune.petProgress !== undefined && s.fortune.petProgress > 2))) reject('奇遇善缘记录');
    const validateSlots = (slots, duration, isTraining) => {
      if (!Array.isArray(slots) || slots.length > 2) reject('传功或邀约席位');
      const used = new Set();
      for (const slot of slots) {
        if (slot === null) continue;
        if (!object(slot) || !number(slot.start) || !number(slot.finish) || slot.start > state.clock || Math.abs(slot.finish - slot.start - duration) > 0.001) reject('传功或邀约计时');
        if (isTraining) {
          if (!state.heroes.some(h => h.uid === slot.uid) || used.has(slot.uid) || !integer(slot.level, 100) || slot.level < 1) reject('传功侠客');
          used.add(slot.uid);
        }
      }
    };
    if (s.training !== undefined) validateSlots(s.training, TRAIN_TIME, true);
    if (s.invitations !== undefined) validateSlots(s.invitations, INVITE_TIME, false);
    if (s.daily !== undefined) {
      const d = s.daily;
      if (!object(d) || !fields(d, ['teaPlays', 'worldDamage', 'worldMax'])) reject('每日进度');
      if (d.teaPlays !== undefined && d.teaPlays > 10) reject('行令次数');
      if (d.worldMax !== undefined && (d.worldMax < 3600 || d.worldMax > 100000)) reject('首领总气血');
      if (d.worldDamage !== undefined && d.worldMax !== undefined && d.worldDamage > d.worldMax) reject('首领伤害');
      if (d.worldClaimed !== undefined && typeof d.worldClaimed !== 'boolean') reject('首领奖励标记');
      if (d.base !== undefined && (!object(d.base) || !fields(d.base, ['battles', 'recruited', 'training', 'challenges', 'tea']))) reject('每日统计起点');
      if (d.claimed !== undefined && !ids(d.claimed, QUESTS.map(q => q.id))) reject('委托领奖记录');
      if (d.scenarios !== undefined) {
        if (!object(d.scenarios)) reject('奇遇任务');
        for (const [id, record] of Object.entries(d.scenarios)) {
          const def = SCENARIOS.find(q => q.id === id);
          if (!def || !object(record) || !['choice', 'active', 'completed'].includes(record.stage)) reject('奇遇阶段');
          if (!validWallTime(record.startedAt) || !validWallTime(record.expiresAt) || record.expiresAt <= record.startedAt || record.expiresAt - record.startedAt > SCENARIO_DURATION || (s.wallNow !== undefined && record.startedAt > s.wallNow)) reject('奇遇时限');
          if (record.stage === 'choice' ? record.choice !== null : !def.choices.some(choice => choice.id === record.choice)) reject('奇遇抉择');
          if (!object(record.base) || !fields(record.base, ['wins', 'battles', 'training', 'factoryWins', 'medicineCrafts'])) reject('奇遇进度');
          if (record.stage === 'completed' && (!validWallTime(record.completedAt) || record.completedAt < record.startedAt || record.completedAt >= record.expiresAt)) reject('奇遇领奖时间');
        }
      }
      if (d.attempts !== undefined) {
        if (!object(d.attempts)) reject('挑战次数');
        for (const [id, amount] of Object.entries(d.attempts)) {
          const challenge = CHALLENGES.find(c => c.id === id);
          if (!challenge || !integer(amount, challenge.maxAttempts)) reject('挑战次数');
        }
      }
    }
    if (s.records !== undefined) {
      if (!object(s.records)) reject('挑战记录');
      for (const [id, record] of Object.entries(s.records)) {
        if (!CHALLENGES.some(c => c.id === id) || !object(record) || !fields(record, ['runs', 'wins', 'best'])) reject('挑战纪录');
        if (record.last != null) {
          const last = record.last;
          if (!object(last) || typeof last.won !== 'boolean' || !fields(last, ['floor', 'damage', 'rounds']) || !number(last.at)) reject('挑战战报');
          if (last.rewards !== undefined) {
            const r = last.rewards;
            if (!object(r) || !fields(r, ['silver', 'jade', 'renown', 'exp'])) reject('挑战奖励');
            if (r.items !== undefined && (!object(r.items) || Object.entries(r.items).some(([key, amount]) => !data().ITEMS.some(i => i.id === key) || !integer(amount)))) reject('挑战物品奖励');
          }
        }
      }
    }
    return true;
  }
  root.JXSystems = { init, tick, syncCalendar, training, startTraining, claimTraining, startInvitation, claimInvitation, quests, claimQuest, achievements, claimAchievement, challenges, challenge, expansionDungeons, challengeExpansionDungeon, forgeTrial, recipes, craft, teaInfo, playTea, records, scenarios, chooseScenario, validateSave };
})(globalThis);
