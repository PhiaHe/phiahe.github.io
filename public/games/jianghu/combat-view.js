/* Event-driven pixel battle presentation. Nothing in this module mutates game state. */
(function () {
  'use strict';
  const D = globalThis.JXData, E = globalThis.JXEngine;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const mix = (a, b, p) => a + (b - a) * p;
  const ease = p => 1 - Math.pow(1 - clamp(p), 3);
  const copy = value => value && JSON.parse(JSON.stringify(value));
  const styles = {
    chunyang: { name: '剑气', color: '#a8eeff', ranged: true },
    tiance: { name: '突刺', color: '#ffba76' },
    wanhua: { name: '墨意', color: '#c8abff', ranged: true },
    qixiu: { name: '剑舞', color: '#ffafdf', ranged: true },
    cangjian: { name: '斩岳', color: '#ffde76' },
    shaolin: { name: '伏魔', color: '#ffe3a0' }
  };
  function sprite(el, actor, boss = false) {
    let index = actor.portrait || 0;
    const bossArt=boss&&globalThis.JXBossArt?.get(actor.name);
    el.classList.toggle('foe-atlas', boss&&!bossArt);
    el.classList.toggle('boss-portrait',!!bossArt);
    for(const name of [...el.classList]) if(name.startsWith('art-')||name.startsWith('sect-art-')||name.startsWith('disciple-art-')||name.startsWith('boss-art-')) el.classList.remove(name);
    if(bossArt){el.classList.add(bossArt.className);el.style.backgroundPosition='';el.style.transform='none';return;}
    const meta=D.HEROES.find(h=>h.id===actor.id);
    if(!boss && meta) {
      if(meta.artId) el.classList.add('art-'+meta.artId);
      else if(meta.portrait>=6) el.classList.add('sect-art-'+meta.sect);
      else el.classList.add('disciple-art-'+meta.id);
    }
    if (boss) index = actor.bossPortrait ?? index;
    el.style.backgroundPosition = ((index % 3) * 50) + '% ' + (Math.floor(index / 3) * 100) + '%';
    el.style.transform = actor.side === 'enemy' && !boss ? 'scaleX(-1)' : 'none';
  }
  class CombatView {
    constructor(options) {
      this.options = options;
      this.scene = null;
      this.clock = 0;
      this.tail = 0;
      this.tasks = [];
      this.effects = [];
      this.bars = new Map();
      this.snapshot = null;
      this.activeUid = null;
      this.paused = false;
      this.last = performance.now();
      this.impacts = 0;
      this.history = [];
      requestAnimationFrame(now => this.frame(now));
    }
    get state() { return this.options.state(); }
    get busy() { return this.tasks.length > 0 || this.effects.length > 0; }
    get reduced() { return !this.state.settings.motion || matchMedia('(prefers-reduced-motion: reduce)').matches; }
    displayHp(uid) { return this.snapshot?.heroes.find(h => h.uid === uid)?.hp; }
    setPaused(value) { this.paused = value; this.last = performance.now(); this.statusText(); }
    detach() {
      this.tasks = []; this.effects = []; this.bars.clear(); this.snapshot = null;
      if (this.scene) this.scene.querySelector('.combat-effects')?.remove();
      this.scene = null; this.tail = this.clock;
    }
    reset() {
      this.tasks = []; this.effects = []; this.bars.clear(); this.tail = this.clock;
      this.scene?.querySelector('.combat-effects')?.replaceChildren();
      this.paused = !this.state.running;
      this.setSnapshot(E.combatSnapshot(this.state));
    }
    mount(scene) {
      if (!scene) { this.detach(); return; }
      const changed = this.scene !== scene;
      this.scene = scene;
      scene.classList.add('combat-scene');
      if (!scene.querySelector('.combat-effects')) {
        const layer = document.createElement('div'); layer.className = 'combat-effects'; layer.setAttribute('aria-hidden', 'true'); scene.append(layer);
        for (const fighter of scene.querySelectorAll('.stage > .fighter')) {
          const hp = fighter.querySelector('.fighter-hp');
          hp.setAttribute('role', 'meter'); hp.setAttribute('aria-valuemin', '0');
          hp.innerHTML = '<span class="hp-fill"></span><b class="hp-readout"></b>';
        }
      }
      if (changed) this.reset();
      else if (!this.busy) this.setSnapshot(E.combatSnapshot(this.state));
      else if (!this.busy) this.setSnapshot(E.combatSnapshot(this.state));
      else this.paintHud();
    }
    setSnapshot(snapshot) {
      this.snapshot = copy(snapshot);
      if (!this.snapshot?.heroes.some(h => h.uid === this.activeUid)) this.activeUid = this.snapshot?.heroes[0]?.uid;
      this.bars.clear();
      this.drawFighters();
      this.paintHud();
    }
    currentHero() {
      if (this.snapshot) return this.snapshot.heroes.find(h => h.uid === this.activeUid) || this.snapshot.heroes[0];
      const hero = this.state.heroes.find(h => h.uid === this.state.team[0]);
      if (!hero) return null;
      const meta = D.HEROES.find(h => h.id === hero.id);
      return { ...meta, ...hero, side: 'hero', maxHp: E.getHeroStats(hero).hp };
    }
    currentEnemy() {
      if(this.snapshot) return this.snapshot.enemy;
      const route=E.getRoute(this.state),id=route.heroes[(this.state.stats.steps||0)%route.heroes.length],meta=D.HEROES.find(h=>h.id===id);
      if(!meta) return null;
      const hp=100+route.level*25;
      return {...meta,uid:'preview_'+id,side:'enemy',level:route.level,hp,maxHp:hp};
    }
    fighter(side) { return this.scene?.querySelector(side === 'enemy' ? '.stage > .enemy' : '.stage > .fighter:not(.enemy)'); }
    drawFighters() {
      if (!this.scene) return;
      const hero = this.currentHero(), enemy = this.currentEnemy();
      for (const actor of [hero, enemy].filter(Boolean)) {
        const el = this.fighter(actor.side), boss = actor.side === 'enemy' && this.snapshot?.boss;
        if (!el) continue;
        el.dataset.uid = actor.uid;
        el.classList.toggle('boss', !!boss);
        el.classList.remove('combat-defeated');
        el.querySelector('.fighter-tag').textContent = (boss ? '首领　' : 'Lv.' + actor.level + '　') + actor.name;
        sprite(el.querySelector('.fighter-art'), actor, boss);
      }
      this.scene.dataset.battleId = this.snapshot?.battleId || '';
      this.scene.querySelector('.versus').textContent = this.snapshot ? 'VS' : '· · ·';
    }
    paintHud() {
      if (!this.scene) return;
      const actors = [this.currentHero(), this.currentEnemy()].filter(Boolean);
      for (const actor of actors) {
        const el = this.fighter(actor.side);
        if (!el) continue;
        const hp = el.querySelector('.fighter-hp'), tween = this.bars.get(actor.uid);
        const displayed = tween ? mix(tween.from, tween.to, ease((this.clock - tween.start) / 350)) : actor.hp;
        hp.querySelector('.hp-fill').style.width = (clamp(displayed / actor.maxHp) * 100) + '%';
        hp.querySelector('.hp-readout').textContent = Math.ceil(actor.hp) + ' / ' + actor.maxHp;
        hp.classList.toggle('low-hp', actor.hp / actor.maxHp <= .2);
        hp.setAttribute('aria-label', actor.name + ' 气血');
        hp.setAttribute('aria-valuenow', actor.hp); hp.setAttribute('aria-valuemax', actor.maxHp);
        hp.dataset.hp = actor.hp; hp.dataset.maxHp = actor.maxHp;
      }
      for (const actor of this.snapshot?.heroes || []) {
        const card = document.querySelector('.party [data-id="' + actor.uid + '"] .bar.hp span');
        if (card) card.style.width = (clamp(actor.hp / actor.maxHp) * 100) + '%';
      }
      for (const el of this.scene.querySelectorAll('.stage-party button')) {
        el.classList.toggle('combat-active', el.dataset.id === this.activeUid);
        const actor = this.snapshot?.heroes.find(h => h.uid === el.dataset.id);
        el.classList.toggle('combat-fallen', !!actor && actor.hp <= 0);
      }
    }
    statusText(message) {
      const text = this.scene?.querySelector('.scene-toast');
      if (!text) return;
      if (message) this.message = message;
      text.textContent = this.paused ? (this.snapshot ? '切磋已暂停 · 点击继续，接着出招' : '历练已暂停 · 可在队伍中调整阵容') : (this.message || (this.snapshot ? '双方就位，准备出招……' : '沿小径前行，寻访下一位江湖同道……'));
    }
    schedule(at, kind, event) { this.tasks.push({ at, kind, event }); }
    receive(events) {
      if (!this.scene || document.hidden) return;
      const combat = events.filter(e => ['battle-start', 'attack', 'combat-heal', 'victory', 'defeat'].includes(e.type));
      if (!combat.length) return;
      let i = 0;
      while (i < combat.length) {
        const event = combat[i];
        if (event.type === 'battle-start') {
          this.schedule(Math.max(this.clock, this.tail), 'start', event); i++; continue;
        }
        if (event.type === 'attack' || event.type === 'combat-heal') {
          const group = [];
          while (i < combat.length && ['attack', 'combat-heal'].includes(combat[i].type) && combat[i].battleId === event.battleId && combat[i].turn === event.turn) group.push(combat[i++]);
          const start = Math.max(this.clock, this.tail), count = group.filter(e => e.type === 'attack').length;
          const gap = count > 1 ? Math.min(650, 820 / (count - 1)) : 0;
          let index = 0, lastImpact = start + 300;
          for (const action of group) {
            if (action.type === 'attack') {
              const at = start + index++ * gap;
              this.schedule(at, 'attack', action);
              lastImpact = at + 300;
              this.schedule(lastImpact, 'impact', action);
            } else this.schedule(lastImpact + 10, 'heal', action);
          }
          this.tail = start + 1400;
          this.lastImpact = lastImpact;
          continue;
        }
        // Lethal HP is displayed before any reward, level-up or tea-rest restoration.
        const at = Math.max(this.clock, (this.lastImpact || this.clock) + 100);
        this.schedule(at, 'end', event);
        this.schedule(Math.max(at + 240, this.tail), 'settle', event);
        i++;
      }
      this.tasks.sort((a, b) => a.at - b.at);
    }
    locate(actor, portrait = false) {
      if (!this.scene) return { x: 0, y: 0, width: 0, height: 0 };
      const parent = this.scene.getBoundingClientRect();
      const el = portrait ? this.scene.querySelector('.stage-party [data-id="' + actor.uid + '"]') : this.fighter(actor.side)?.querySelector('.fighter-art');
      const rect = el?.getBoundingClientRect() || parent;
      return { x: rect.left - parent.left, y: rect.top - parent.top, width: rect.width, height: rect.height };
    }
    addEffect(kind, event, at) {
      const element = document.createElement('div'); element.className = 'combat-' + kind;
      const effect = { kind, event, start: at, element };
      this.scene.querySelector('.combat-effects').append(element);
      this.effects.push(effect); return effect;
    }
    startAttack(event, at) {
      if (!this.snapshot || this.snapshot.battleId !== event.battleId) return;
      const actor = event.attacker, target = event.defender;
      this.activeUid = actor.side === 'hero' ? actor.uid : target.uid;
      this.snapshot.turn = event.turn;
      this.drawFighters();
      const theme = styles[actor.sect] || styles.tiance;
      this.statusText(actor.name + ' · ' + (actor.skill || theme.name) + ' → ' + target.name);
      const effect = this.addEffect('attack', event, at);
      effect.from = this.locate(actor); effect.to = this.locate(target); effect.theme = theme;
      effect.element.style.setProperty('--fx-color', theme.color);
      effect.element.dataset.attacker = actor.uid;
      effect.element.dataset.style = theme.ranged ? 'ranged' : 'melee';
      const body = document.createElement('div'); body.className = 'combat-sprite';
      const visual = { ...actor };
      const boss = actor.side === 'enemy' && this.snapshot.boss;
      if (boss) visual.bossPortrait = this.snapshot.enemy.bossPortrait;
      sprite(body, visual, boss); effect.element.append(body);
      effect.body = body;
      effect.element.style.width = effect.from.width + 'px'; effect.element.style.height = effect.from.height + 'px';
      if (theme.ranged) {
        const missile = document.createElement('div'); missile.className = 'combat-projectile ' + actor.sect;
        missile.style.setProperty('--fx-color', theme.color);
        this.scene.querySelector('.combat-effects').append(missile); effect.missile = missile;
      }
      const label = document.createElement('div'); label.className = 'combat-skill'; label.textContent = actor.skill || theme.name;
      effect.element.append(label);
    }
    impact(event, at, healing = false) {
      if (!this.snapshot || this.snapshot.battleId !== event.battleId) return;
      const actor = event.defender;
      const target = actor.side === 'enemy' ? this.snapshot.enemy : this.snapshot.heroes.find(h => h.uid === actor.uid);
      if (!target) return;
      const previous = this.bars.get(target.uid);
      const from = previous ? mix(previous.from, previous.to, ease((at - previous.start) / 350)) : event.hpBefore;
      target.hp = event.hpAfter;
      this.bars.set(target.uid, { from, to: event.hpAfter, start: at });
      const effect = this.addEffect(healing ? 'heal' : 'impact', event, at);
      effect.portrait = healing && actor.side === 'hero' && actor.uid !== this.activeUid;
      effect.position = this.locate(actor, effect.portrait);
      effect.color = healing ? '#94ffaf' : (styles[event.attacker.sect]?.color || '#ffe9ba');
      effect.element.style.setProperty('--fx-color', effect.color);
      if (!healing && !styles[event.attacker.sect]?.ranged) {
        const slash = document.createElement('span'); slash.className = 'combat-slash';
        effect.element.append(slash); effect.slash = slash;
      }
      const count = this.reduced ? 0 : (healing ? 5 : event.critical ? 12 : 7);
      for (let i = 0; i < count; i++) {
        const spark = document.createElement('i'); spark.className = 'combat-spark'; effect.element.append(spark);
      }
      const text = document.createElement('b'); text.className = 'combat-damage' + (event.critical && !healing ? ' critical' : '') + (healing ? ' healing' : '');
      text.textContent = (healing ? '+' + event.amount : '−' + event.damage) + (!healing && event.critical ? ' 会心' : '');
      effect.element.append(text); effect.text = text;
      effect.element.dataset.hpAfter = event.hpAfter; effect.element.dataset.target = actor.uid;
      this.statusText(healing ? event.message : (event.attacker.name + ' 命中 ' + actor.name + '，造成 ' + event.damage + ' 点伤害' + (event.critical ? ' · 会心！' : '')));
      this.impacts++;
      this.history.push({ type: healing ? 'heal' : 'attack', battleId: event.battleId, turn: event.turn, uid: actor.uid, hpBefore: event.hpBefore, hpAfter: event.hpAfter, damage: event.damage, amount: event.amount });
      if (this.history.length > 40) this.history.shift();
      if (!healing) this.options.onImpact?.(event);
      this.paintHud();
    }
    run(task) {
      const { event, at } = task;
      if (task.kind === 'start') { this.setSnapshot(event.snapshot); this.statusText(event.message); }
      if (task.kind === 'attack') this.startAttack(event, at);
      if (task.kind === 'impact') this.impact(event, at);
      if (task.kind === 'heal') this.impact(event, at, true);
      if (task.kind === 'end' && this.snapshot?.battleId === event.battleId) {
        this.statusText(event.type === 'victory' ? '切磋获胜 · 正在收招' : '本次历练结束 · 返回茶肆休整');
        for (const actor of [this.snapshot.enemy, ...this.snapshot.heroes]) {
          if (actor.hp <= 0 && (actor.side === 'enemy' || actor.uid === this.activeUid)) this.fighter(actor.side)?.classList.add('combat-defeated');
        }
      }
      if (task.kind === 'settle' && this.snapshot?.battleId === event.battleId) {
        this.setSnapshot(E.combatSnapshot(this.state)); this.statusText(event.message);
      }
    }
    paintEffect(effect) {
      const age = this.clock - effect.start, reduced = this.reduced;
      const { element, event } = effect;
      if (effect.kind === 'attack') {
        const { from, to, theme } = effect, direction = event.attacker.side === 'hero' ? 1 : -1;
        let x = 0, y = 0, sx = 1, sy = 1;
        if (!reduced) {
          if (theme.ranged) {
            const charge = Math.sin(clamp(age / 300) * Math.PI);
            x = -direction * 8 * charge; y = -4 * charge;
          } else if (age < 90) { const p = age / 90; x = -direction * 14 * p; y = 6 * p; sx = 1 + p * .1; sy = 1 - p * .1; }
          else if (age < 300) { const p = ease((age - 90) / 210); x = mix(-direction * 14, (to.x - from.x) * .8, p); y = -Math.sin(p * Math.PI) * 14; }
          else { const p = ease((age - 300) / 240); x = (to.x - from.x) * .8 * (1 - p); y = -Math.sin(p * Math.PI) * 6; }
        }
        element.style.transform = 'translate(' + (from.x + x) + 'px,' + (from.y + y) + 'px) scale(' + sx + ',' + sy + ')';
        element.style.opacity = reduced ? '0' : String(age > 510 ? clamp((540 - age) / 30) : 1);
        if (effect.missile) {
          const p = clamp((age - 80) / 220);
          effect.missile.style.opacity = !reduced && age >= 80 && age < 310 ? '1' : '0';
          effect.missile.style.transform = 'translate(' + (mix(from.x, to.x, p) + from.width * .5) + 'px,' + (mix(from.y, to.y, p) + from.height * .45 - Math.sin(p * Math.PI) * 40) + 'px) rotate(' + (direction > 0 ? -20 : 160) + 'deg)';
        }
        return age < 550;
      }
      const pos = effect.position;
      element.style.transform = 'translate(' + (pos.x + pos.width * .5) + 'px,' + (pos.y + pos.height * .44) + 'px)';
      const p = clamp(age / 420);
      if (effect.slash) {
        effect.slash.style.opacity = reduced ? '0' : String(clamp(1 - age / 260));
        effect.slash.style.transform = 'translate(-50%,-50%) scale(' + mix(.6, 1.4, ease(age / 260)) + ')';
      }
      Array.from(element.querySelectorAll('i')).forEach((spark, i, array) => {
        const angle = i / array.length * Math.PI * 2, distance = 10 + ease(p) * (event.critical ? 74 : 48);
        spark.style.transform = 'translate(' + (Math.cos(angle) * distance) + 'px,' + (Math.sin(angle) * distance + p * p * 20) + 'px) rotate(45deg)';
        spark.style.opacity = String(1 - p);
      });
      const floatAge = age / Math.sqrt(this.state.speed);
      const lane = this.snapshot?.heroes.findIndex(h => h.uid === event.attacker.uid) ?? 0;
      effect.text.style.left = (effect.portrait ? 28 : this.snapshot?.heroes.length > 2 ? ((lane + 3) % 3 - 1) * 20 : 0) + 'px';
      effect.text.style.transform = reduced ? 'translate(-50%,-36px)' : 'translate(-50%,' + (-20 - ease(floatAge / 900) * 56 - Math.sin(clamp(floatAge / 220) * Math.PI) * 15) + 'px) scale(' + (floatAge < 150 ? mix(1.35, 1, floatAge / 150) : 1) + ')';
      effect.text.style.opacity = String(clamp((1000 - floatAge) / 240));
      return floatAge < 1000;
    }
    frame(now) {
      const delta = Math.min(2000, Math.max(0, now - this.last)); this.last = now;
      if (this.scene?.isConnected && !document.hidden) {
        if (!this.paused) this.clock += delta * this.state.speed;
        while (this.tasks.length && this.tasks[0].at <= this.clock && !this.paused) this.run(this.tasks.shift());
        const live = [];
        for (const effect of this.effects) {
          if (this.paintEffect(effect)) live.push(effect);
          else { effect.element.remove(); effect.missile?.remove(); }
        }
        this.effects = live;
        if (!this.busy && !this.state.running && !this.paused) { this.paused = true; this.statusText(); }
        for (const side of ['hero', 'enemy']) {
          const fighter = this.fighter(side), art = fighter?.querySelector('.fighter-art');
          if (!art) continue;
          const attacks = live.filter(f => f.kind === 'attack' && f.event.attacker.side === side);
          art.style.opacity = !this.reduced && attacks.length ? '.12' : '1';
          const hit = live.findLast(f => f.kind === 'impact' && f.event.defender.uid === fighter.dataset.uid && this.clock - f.start < 270);
          const age = hit ? this.clock - hit.start : 0;
          const offset = hit && !this.reduced ? Math.sin(age / 26) * 7 * (1 - age / 270) : 0;
          fighter.style.translate = offset + 'px 0';
          art.style.filter = hit && !this.reduced && Math.floor(age / 65) % 2 === 0 ? 'brightness(2.6)' : '';
        }
        this.paintHud();
      }
      requestAnimationFrame(time => this.frame(time));
    }
    inspect() {
      return { battleId: this.snapshot?.battleId || null, turn: this.snapshot?.turn || 0, activeUid: this.activeUid, paused: this.paused, pending: this.tasks.length, effects: this.effects.length, backlogMs: Math.max(0, this.tail - this.clock), impacts: this.impacts, snapshot: copy(this.snapshot), history: copy(this.history) };
    }
  }
  globalThis.JXCombat = { create: options => new CombatView(options) };
})();
