(function (root) {
  'use strict';
  const D = root.JXData;
  if (!D) throw new Error('请先加载江湖资料。');
  const heroMap = new Map(D.HEROES.map(h=>[h.id,h]));
  const routeMap = new Map(D.ROUTES.map(r=>[r.id,r]));
  const mainRoutes = D.ROUTES.filter(r=>r.main!==false);
  const mainRouteIds = new Set(mainRoutes.map(r=>r.id));
  const itemMap = new Map(D.ITEMS.map(i=>[i.id,i]));
  const MAX_LEVEL = 100, OFFLINE_CAP = 28800, TEAM_SIZE = 5;
  const levelCap = state => root.JXProgression?.current(state).levelCap || MAX_LEVEL;
  const SECT_ADVANTAGE={chunyang:'tiance',tiance:'shaolin',shaolin:'cangjian',cangjian:'wanhua',wanhua:'qixiu',qixiu:'chunyang'};
  const finite = (x,min=0,max=1e12) => typeof x==='number' && Number.isFinite(x) && x>=min && x<=max;
  const integer = (x,min=0,max=1e12) => finite(x,min,max) && Number.isInteger(x);
  const result = (ok,message,extra) => Object.assign({ok,message},extra||{});
  const getRoute = state => routeMap.get(state.routeId);
  const mainBadgeCount = state => (state.badges||[]).filter(id=>mainRouteIds.has(id)).length;
  function routeUnlocked(state,routeOrId) {
    const route=routeMap.get(typeof routeOrId==='string'?routeOrId:routeOrId?.id);
    if(!route) return false;
    if(root.JXProgression&&!root.JXProgression.isExpansionUnlocked(state,route.expansionId))return false;
    return route.unlockRouteId?(state.badges||[]).includes(route.unlockRouteId):mainBadgeCount(state)>=route.needBadges;
  }
  function routeRequirement(state,routeOrId) {
    const route=routeMap.get(typeof routeOrId==='string'?routeOrId:routeOrId?.id);
    if(!route) return '未知路线';
    if(root.JXProgression&&!root.JXProgression.isExpansionUnlocked(state,route.expansionId))return '完成当前资料片毕业清单后开放';
    return route.unlockRouteId?'通关「'+routeMap.get(route.unlockRouteId).name+'」后开放':'主线信物 '+Math.min(mainBadgeCount(state),route.needBadges)+' / '+route.needBadges;
  }
  const getOwned = (state,uid) => state.heroes.find(h=>h.uid===uid);
  const pick = (arr,rng) => arr[Math.min(arr.length-1,Math.max(0,Math.floor(rng()*arr.length)))];
  const nextLevelXp = h => 35+h.level*18;
  const getRole = hero => hero?.role || heroMap.get(hero?.id)?.role || 'dps';
  function setRole(state,uid,role) {
    const hero=getOwned(state,uid),data=hero && heroMap.get(hero.id);
    if(!data || !(data.roles||[data.role]).includes(role)) return result(false,'这位侠客不具备该职责心法。');
    if(state.battle) return result(false,'请在战斗结束后切换职责。');
    hero.role=role;
    hero.hp=Math.min(hero.hp,getHeroStats(hero).hp);
    return result(true,data.name+'已切换为'+({tank:'承伤 T',healer:'治疗',dps:'输出 DPS'}[role])+'。');
  }
  function environment(state,wallNow) {
    const requested=wallNow===undefined?(state.systems?.wallNow??state.environmentTime??Date.now()):wallNow;
    const at=finite(requested,0,1e15)?requested:Date.now();
    const route=getRoute(state),hour=new Date(at+28800000).getUTCHours(),period=hour>=6&&hour<18?'day':'night';
    const slot=Math.floor(at/1800000);
    let hash=2166136261; for(const char of route.id) hash=Math.imul(hash^char.charCodeAt(0),16777619)>>>0;
    const weather=['clear','rain','mist','wind'][(Math.imul(slot^hash,1664525)+1013904223)>>>0&3];
    const profiles={
      clear:{name:'晴朗',damageMultiplier:1.04,enemyDamageMultiplier:1,expMultiplier:1,bonus:'晴朗视野开阔，队伍伤害 +4%。'},
      rain:{name:'细雨',damageMultiplier:1,enemyDamageMultiplier:0.96,expMultiplier:1.04,bonus:'细雨减缓来敌，受击伤害 −4%，修为 +4%。'},
      mist:{name:'薄雾',damageMultiplier:1,enemyDamageMultiplier:1,expMultiplier:1.06,bonus:'薄雾中凝神历练，修为 +6%。'},
      wind:{name:'山风',damageMultiplier:0.97,enemyDamageMultiplier:1.03,expMultiplier:1.08,bonus:'山风考验身法，队伍伤害 −3%，来敌伤害 +3%，修为 +8%。'}
    };
    const p=profiles[weather],common=route.heroes.slice(1,-1);
    const roaming=weather==='rain'?common.slice(-1):weather==='mist'?common.slice(0,1):weather==='wind'?[...common].reverse():common;
    const exclusive=period==='day'?route.heroes[0]:route.heroes.at(-1);
    const encounterIds=[...new Set([exclusive,...roaming])];
    return {at,period,name:period==='day'?'白昼':'夜晚',weather,label:(period==='day'?'白昼':'夜晚')+' · '+p.name,bonus:p.bonus,
      encounterIds,damageMultiplier:p.damageMultiplier,enemyDamageMultiplier:p.enemyDamageMultiplier,expMultiplier:p.expMultiplier};
  }
  function getHeroStats(hero) {
    const data=heroMap.get(hero.id);
    if (!data) return {hp:0,atk:0,def:0,power:0};
    const factor=1+(hero.stars||0)*0.16, level=Math.max(1,hero.level||1);
    const bonus=root.JXEquipment?.bonuses(hero)||{};
    const hp=Math.floor((data.baseHp+(level-1)*26)*factor+(bonus.hp||0));
    const atk=Math.floor((data.baseAtk+(level-1)*6)*factor+(bonus.atk||0));
    const def=Math.floor((data.baseDef+(level-1)*2.4)*factor+(bonus.def||0));
    return {hp,atk,def,crit:bonus.crit||0,power:Math.floor(hp*0.22+atk*3.2+def*2)};
  }
  function heroActor(hero) {
    const data=heroMap.get(hero.id);
    return {side:'hero',uid:hero.uid,id:hero.id,name:data.name,sect:data.sect,portrait:data.portrait,
      level:hero.level,hp:hero.hp,maxHp:getHeroStats(hero).hp,skill:data.skill,role:getRole(hero)};
  }
  function enemyActor(state) {
    const enemy=state.battle.enemy;
    return {side:'enemy',uid:'enemy_'+state.stats.battles,id:enemy.id,name:enemy.name,sect:enemy.sect,
      portrait:enemy.portrait,level:enemy.level,hp:enemy.hp,maxHp:enemy.maxHp};
  }
  function combatSnapshot(state) {
    const battle=state.battle;
    if(!battle) return null;
    return {battleId:state.stats.battles,routeId:state.routeId,boss:battle.boss,turn:battle.turn,
      enemy:enemyActor(state),heroes:state.team.map(uid=>getOwned(state,uid)).filter(Boolean).map(heroActor)};
  }
  function petEffect(state,effect) {
    const pet=D.PETS.find(p=>p.id===state.activePet);
    return pet && pet.effect===effect ? pet.value : 0;
  }
  function teamPower(state) { return Math.floor(state.team.reduce((n,uid)=>n+getHeroStats(getOwned(state,uid)||{}).power,0)*(1+petEffect(state,'atk')+petEffect(state,'resist')+petEffect(state,'def'))); }
  function addLog(state,message,type='info') {
    state.logs.unshift({message:String(message).slice(0,500),type,time:state.clock});
    state.logs.length=Math.min(state.logs.length,60);
  }
  function event(state,events,type,message,extra) {
    const e=Object.assign({type,message},extra||{}); events.push(e);
    if(type!=='attack' && type!=='combat-heal' && type!=='step') addLog(state,message,type);
    return e;
  }
  function addHero(state,id,rng=Math.random) {
    const data=heroMap.get(id);
    if(!data) throw new Error('这位侠客尚未记入江湖名册。');
    let hero=state.heroes.find(h=>h.id===id),isNew=!hero;
    if(hero) hero.insight+=3+data.rarity;
    else {
      hero={uid:'hero_'+id,id,level:root.JXProgression?Math.max(5,levelCap(state)-5):5,xp:0,stars:0,insight:0,hp:1};
      hero.hp=getHeroStats(hero).hp;
      state.heroes.push(hero);
      if(state.team.length<TEAM_SIZE) state.team.push(hero.uid);
    }
    if(!state.dex.includes(id)) state.dex.push(id);
    state.stats.recruited++;
    return {hero,isNew};
  }
  function createState(name='无名少侠',starter='chunyang') {
    const sect=D.SECTS.find(s=>s.id===starter)||D.SECTS[0];
    const now=Date.now();
    const state={version:2,name:String(name||'无名少侠').trim().slice(0,16)||'无名少侠',started:true,createdAt:now,lastSaved:now,clock:0,
      silver:3000,jade:80,renown:0,badges:[],inventory:{invite:30,medicine:5,exp:8,tea:3,ore:0,herb:0},
      heroes:[],team:[],presets:[[],[],[],[],[]],dex:[],pets:[],activePet:null,routeId:D.ROUTES[0].id,routeLoop:[],routeProgress:0,clears:{},environmentTime:now,
      running:true,speed:1,autoInvite:true,autoAdvance:true,pauseAfterBattle:false,battle:null,logs:[],
      stats:{battles:0,wins:0,recruited:0,steps:0,silverEarned:0,playSeconds:0,bosses:0,expEarned:0,defeats:0},
      settings:{sound:false,motion:true},systems:{},adventure:{stepTimer:0,restSeconds:0,lastTeaRoute:D.ROUTES[0].id},rngSeed:726193};
    addHero(state,heroMap.get(sect.id+'_1').id);
    root.JXEquipment?.init(state);
    root.JXProgression?.init(state);
    state.stats.recruited=0;
    addLog(state,'你与'+heroMap.get(state.heroes[0].id).name+'相约同行，踏上稻香村外的江湖路。','start');
    return state;
  }
  function grantXp(state,hero,amount) {
    const cap=levelCap(state);
    if(!hero || !finite(amount) || hero.level>=cap) return 0;
    const oldMax=getHeroStats(hero).hp;
    hero.xp+=amount; let levels=0;
    while(hero.level<cap && hero.xp>=nextLevelXp(hero)) { hero.xp-=nextLevelXp(hero); hero.level++; levels++; }
    if(hero.level===cap) hero.xp=0;
    if(levels) hero.hp=Math.min(getHeroStats(hero).hp,Math.max(0,hero.hp)+getHeroStats(hero).hp-oldMax);
    return levels;
  }
  function setRoute(state,id) {
    const route=routeMap.get(id);
    if(!route) return result(false,'没有找到这条江湖路线。');
    if(!routeUnlocked(state,route)) return result(false,'路线尚未开放：'+routeRequirement(state,route)+'。');
    if(id===state.routeId) return result(true,'已经在'+route.name+'了。');
    state.routeId=id; state.routeProgress=0; state.battle=null;
    state.adventure.dungeonBossIndex=0;
    state.adventure.stepTimer=0; state.adventure.restSeconds=0; state.adventure.lastTeaRoute=id;
    healTeam(state);
    addLog(state,'一行人抵达'+route.name+'，在路口茶肆整装待发。','travel');
    return result(true,'已前往'+route.name+'。');
  }
  function setRouteLoop(state,ids) {
    if(!Array.isArray(ids) || ids.length>D.ROUTES.length || new Set(ids).size!==ids.length || ids.some(id=>!routeUnlocked(state,id)))
      return result(false,'循环路线须为已解锁且不重复的路线。');
    state.routeLoop=[...ids];
    return result(true,ids.length?'路线循环已设为：'+ids.map(id=>routeMap.get(id).name).join(' → ')+'。':state.autoAdvance?'已关闭循环，通关后继续前往下一张地图。':'已关闭循环，将反复历练当前路线。');
  }
  function toggleTeam(state,uid) {
    if(!getOwned(state,uid)) return result(false,'尚未结交这位侠客。');
    if(state.battle) return result(false,'请等本场切磋结束后调整阵容。');
    const index=state.team.indexOf(uid);
    if(index>=0) {
      if(state.team.length===1) return result(false,'江湖路上至少要留一位同行者。');
      state.team.splice(index,1);
      return result(true,'侠客已在茶肆候命。');
    }
    if(state.team.length>=TEAM_SIZE) return result(false,'五人队伍已满，请先请一位同伴歇息。');
    state.team.push(uid);
    const h=getOwned(state,uid); if(h.hp<=0) h.hp=getHeroStats(h).hp;
    return result(true,'侠客已加入同行队伍。');
  }
  function prepareFormation(state) {
    if(state.battle) {
      state.pauseAfterBattle=true; state.running=true;
      return result(true,'已安排战后整队，本场切磋结束后自动暂停。');
    }
    state.running=false; state.pauseAfterBattle=false;
    return result(true,'已暂停历练，可以调整阵容。');
  }
  function finishFormationPause(state,events) {
    if(!state.pauseAfterBattle) return;
    state.pauseAfterBattle=false; state.running=false;
    event(state,events,'formation-ready','本场切磋结束，历练已暂停，可以调整阵容。');
  }
  function levelUp(state,uid) {
    const h=getOwned(state,uid);
    if(!h) return result(false,'没有找到这位侠客。');
    if(h.level>=levelCap(state)) return result(false,'侠客已达到本资料片修为上限 Lv.'+levelCap(state)+'。');
    const cost=60+h.level*18;
    if(state.silver<cost) return result(false,'银两不足，研习需 '+cost+' 银两。');
    state.silver-=cost;
    grantXp(state,h,nextLevelXp(h)-h.xp);
    return result(true,heroMap.get(h.id).name+'修为提升至 '+h.level+' 级。');
  }
  function breakthrough(state,uid) {
    const h=getOwned(state,uid);
    if(!h) return result(false,'没有找到这位侠客。');
    if(h.stars>=5) return result(false,'已达五重境界。');
    const required={level:10+h.stars*10,insight:10+h.stars*8,ore:3+h.stars*3,silver:500+h.stars*500};
    if(h.level<required.level || h.insight<required.insight || state.inventory.ore<required.ore || state.silver<required.silver)
      return result(false,'突破需要 '+required.level+' 级、'+required.insight+' 心得、'+required.ore+' 精铁与 '+required.silver+' 银两。', {required});
    state.silver-=required.silver; state.inventory.ore-=required.ore; h.insight-=required.insight; h.stars++; h.hp=getHeroStats(h).hp;
    return result(true,heroMap.get(h.id).name+'突破至 '+h.stars+' 重境界！');
  }
  function buyItem(state,id,qty=1) {
    const item=itemMap.get(id);
    if(!item || !integer(qty,1,999)) return result(false,'请选择有效的物品与购买数量。');
    const cost=item.price*qty;
    if(state.silver<cost) return result(false,'银两不足。');
    state.silver-=cost; state.inventory[id]=(state.inventory[id]||0)+qty;
    return result(true,'购得'+item.name+' × '+qty+'。');
  }
  function healTeam(state) {
    for(const uid of state.team) { const h=getOwned(state,uid); if(h) h.hp=getHeroStats(h).hp; }
  }
  function useItem(state,id,uid) {
    if(!itemMap.has(id) || !(state.inventory[id]>0)) return result(false,'背包中没有这件物品。');
    const h=getOwned(state,uid||state.team[0]);
    if(id==='tea') {
      if(!state.team.some(id=>{const a=getOwned(state,id); return a.hp<getHeroStats(a).hp;})) return result(false,'全队气血充足，暂不需要清心茶。');
      state.inventory.tea--; healTeam(state); return result(true,'一盏清心茶，全队气血已恢复。');
    }
    if(!h) return result(false,'请先选择一位侠客。');
    if(id==='medicine') {
      const max=getHeroStats(h).hp;
      if(h.hp>=max) return result(false,'这位侠客气血充足。');
      state.inventory.medicine--; h.hp=Math.min(max,h.hp+Math.ceil(max*0.6));
      return result(true,heroMap.get(h.id).name+'服下止血散，恢复气血。');
    }
    if(id==='exp') {
      if(h.level>=levelCap(state)) return result(false,'这位侠客已达到本资料片修为上限。');
      state.inventory.exp--; grantXp(state,h,250);
      return result(true,heroMap.get(h.id).name+'获得 250 点修为。');
    }
    return result(false,id==='invite'?'结交帖会在自动结交与茶馆邀约时使用。':'这件材料可用于突破或百工制作。');
  }
  function savePreset(state,index) {
    if(!integer(index,0,4)) return result(false,'没有找到这个阵容位置。');
    state.presets[index]=[...state.team]; return result(true,'阵容 '+(index+1)+' 已保存。');
  }
  function loadPreset(state,index) {
    if(!integer(index,0,4) || !state.presets[index]?.length) return result(false,'这套阵容尚未保存。');
    if(state.battle) return result(false,'切磋中暂时无法更换阵容。');
    const ids=[...new Set(state.presets[index])].filter(uid=>getOwned(state,uid)).slice(0,TEAM_SIZE);
    if(!ids.length) return result(false,'阵容中没有已结交的侠客。');
    state.team=ids; return result(true,'已换上阵容 '+(index+1)+'。');
  }
  function restAtTea(state) {
    if(state.battle) return result(false,'请在本场切磋结束后前往茶肆。');
    healTeam(state); state.adventure.restSeconds=4; state.adventure.lastTeaRoute=state.routeId;
    addLog(state,'在路边茶肆歇脚，全队气血恢复。','heal');
    return result(true,'茶肆休整 4 秒，全队气血已恢复。');
  }
  function startBattle(state,events,rng,boss=false) {
    const route=getRoute(state), level=route.level;
    if(boss&&route.dungeonId&&root.JXDungeonRules&&!(state.adventure.dungeonBossIndex>0)){
      const ready=root.JXDungeonRules.readiness(state,route,'normal');
      if(!ready.ready){
        const field=D.ROUTES.find(r=>r.expansionId===route.expansionId&&r.main!==false&&r.kind==='field');
        state.routeId=field.id;state.routeProgress=0;state.adventure.stepTimer=0;state.adventure.restSeconds=4;state.adventure.lastTeaRoute=field.id;
        event(state,events,'preparation','秘境整备不足：'+ready.unmet.join('；')+'。返回'+field.name+'继续历练。');
        return;
      }
    }
    const env=environment(state),hero=heroMap.get(pick(env.encounterIds,rng));
    const maxHp=Math.floor((100+level*25)*(boss?3:1));
    state.battle={enemy:{id:boss?'boss_'+route.id:hero.id,name:boss?route.boss:hero.name,sect:hero.sect,level,hp:maxHp,maxHp,portrait:hero.portrait,
      atk:Math.floor((10+level*4.4)*(boss?1.6:1)),def:Math.floor(3+level*1.25)},phase:'combat',turn:0,boss,elapsed:0,log:[],environment:env};
    if(boss&&route.dungeonId&&root.JXDungeonRules){
      const enemy=root.JXDungeonRules.encounter(state,route,state.adventure.dungeonBossIndex||0,'normal');
      if(enemy)state.battle.enemy={...enemy,sect:enemy.sect||hero.sect,portrait:enemy.portrait??hero.portrait};
    }
    state.stats.battles++;
    event(state,events,'battle-start',boss?'首领现身：'+state.battle.enemy.name+'！':'途中遇见'+hero.name+'，相邀切磋。',
      {boss,enemy:state.battle.enemy.name,battleId:state.stats.battles,snapshot:combatSnapshot(state)});
    if(boss) event(state,events,'boss','挑战'+state.battle.enemy.name+'。'+(state.battle.enemy.bossCount?'（'+(state.battle.enemy.bossIndex+1)+' / '+state.battle.enemy.bossCount+'）':''));
  }
  function challengeBoss(state) {
    if(state.battle) return result(false,'当前正在切磋中。');
    if(state.routeProgress<getRoute(state).steps) return result(false,'请先完成这条路线的探索。');
    if(getRoute(state).dungeonId&&root.JXDungeonRules&&!(state.adventure.dungeonBossIndex>0)){
      const ready=root.JXDungeonRules.readiness(state,getRoute(state),'normal');
      if(!ready.ready)return result(false,'秘境整备不足：'+ready.unmet.join('；')+'。');
    }
    const events=[]; startBattle(state,events,Math.random,true);
    state.adventure.restSeconds=0; return result(true,'首领挑战开始。',{events});
  }
  function rewardWin(state,events,rng) {
    const battle=state.battle,route=getRoute(state),boss=battle.boss;
    const dungeon=boss&&root.JXDungeonRules?D.DUNGEONS.find(d=>d.id===route.dungeonId):null;
    const bossIndex=state.adventure.dungeonBossIndex||0,intermediate=!!dungeon&&bossIndex<dungeon.bosses.length-1;
    const snapshot=combatSnapshot(state);
    const silver=Math.floor(route.rewards.silver*(boss?5:1)*(1+petEffect(state,'silver')));
    const exp=Math.floor(route.rewards.exp*(boss?3:1)*(1+petEffect(state,'exp'))*(battle.environment?.expMultiplier||1));
    state.silver+=silver; state.stats.silverEarned+=silver; state.stats.expEarned+=exp; state.stats.wins++; state.renown+=boss?20:2;
    for(const uid of state.team) grantXp(state,getOwned(state,uid),exp);
    event(state,events,'victory',(boss?'首领试炼告捷':'切磋取胜')+'，获得 '+silver+' 银两与 '+exp+' 修为。',
      {silver,exp,boss,battleId:snapshot.battleId,snapshot});
    if(intermediate){
      state.stats.bosses++;state.adventure.dungeonBossIndex=bossIndex+1;
      event(state,events,'boss-progress',battle.enemy.name+'已击败，下一位：'+dungeon.bosses[bossIndex+1]+'。');
      // Boss-chain progress is saved, but no clear badge or completion loot is granted early.
      state.battle=null;state.adventure.stepTimer=0;state.adventure.restSeconds=2;
      for(const uid of state.team){const h=getOwned(state,uid),max=getHeroStats(h).hp;if(h.hp>0)h.hp=Math.min(max,h.hp+Math.floor(max*.18));}
      finishFormationPause(state,events);return;
    }
    if(boss) {
      if(dungeon)root.JXDungeonRules.record(state,dungeon,'normal',{won:true,floor:dungeon.bosses.length,bosses:[...dungeon.bosses],log:[]});
      state.adventure.dungeonBossIndex=0;
      state.stats.bosses++; state.clears[route.id]=(state.clears[route.id]||0)+1;
      const first=!state.badges.includes(route.id);
      if(first) {
        state.badges.push(route.id); state.jade+=20; state.inventory.invite+=5;
        event(state,events,'badge','获得「'+route.name+'」通行信物，新的江湖路线已开放！',{routeId:route.id});
      }
      state.inventory.ore+=first?4:2; state.routeProgress=0;
      healTeam(state); state.adventure.restSeconds=4; state.adventure.lastTeaRoute=route.id;
      const pet=D.PETS.find(p=>!state.pets.includes(p.id));
      if(pet && (first || rng()<0.16)) { state.pets.push(pet.id); if(!state.activePet) state.activePet=pet.id; event(state,events,'pet','跟宠「'+pet.name+'」愿意与你同行。',{petId:pet.id}); }
    } else {
      state.routeProgress=Math.min(route.steps,state.routeProgress+1);
      if(state.autoInvite && state.inventory.invite>0 && (state.heroes.length<TEAM_SIZE || rng()<0.5)) {
        const unowned=(battle.environment?.encounterIds||route.heroes).filter(id=>!state.dex.includes(id));
        const heroId=state.heroes.length<TEAM_SIZE && unowned.length?pick(unowned,rng):battle.enemy.id;
        state.inventory.invite--;
        const joined=addHero(state,heroId,rng),name=heroMap.get(heroId).name;
        event(state,events,'recruit',joined.isNew?'与'+name+'结为江湖同道！':name+'与你论剑，获得同门心得。',{heroId,isNew:joined.isNew});
      }
      if(rng()<0.24) { state.inventory.herb++; event(state,events,'loot','路旁采得甘草 × 1。',{itemId:'herb',qty:1}); }
      if(state.routeProgress%4===0) { healTeam(state); state.adventure.restSeconds=3; event(state,events,'heal','途经茶肆，同行侠客恢复了气血。'); }
    }
    for(const message of root.JXEquipment?.onVictory(state,{route,boss,rng})||[]) event(state,events,'equipment-loot',message);
    state.battle=null; state.adventure.stepTimer=0;
    if(boss && state.routeLoop?.length) {
      const loop=state.routeLoop.filter(id=>routeUnlocked(state,id));
      const next=loop[(loop.indexOf(route.id)+1)%loop.length];
      if(next && next!==route.id) {
        state.routeId=next; state.routeProgress=0; state.adventure.lastTeaRoute=next; state.adventure.restSeconds=4;
        event(state,events,'route-loop','依照历练计划，下一站前往'+getRoute(state).name+'。',{routeId:next});
      }
    } else if(boss && state.autoAdvance!==false) {
      const next=route.main===false?routeMap.get(route.returnRouteId):mainRoutes[mainRoutes.indexOf(route)+1];
      if(next && routeUnlocked(state,next)) {
        state.routeId=next.id;state.routeProgress=0;state.adventure.lastTeaRoute=next.id;state.adventure.restSeconds=4;
        event(state,events,'route-advance',route.main===false?'支线探索完成，返回'+next.name+'继续本章历程。':'探索完成，自动前往'+next.name+'。',{routeId:next.id});
      }
    }
    finishFormationPause(state,events);
  }
  function defeat(state,events) {
    const snapshot=combatSnapshot(state);
    state.stats.defeats++; state.battle=null;
    const route=getRoute(state),index=mainRoutes.indexOf(route);
    if(route.dungeonId&&root.JXDungeonRules&&snapshot.boss)root.JXDungeonRules.record(state,route,'normal',{won:false,floor:state.adventure.dungeonBossIndex||0,log:[]});
    state.adventure.dungeonBossIndex=0;
    if(route.main===false) state.routeId=route.returnRouteId;
    else if(index>0) state.routeId=mainRoutes[index-1].id;
    state.routeProgress=0; state.adventure.stepTimer=0; state.adventure.restSeconds=8; state.adventure.lastTeaRoute=state.routeId;
    healTeam(state);
    event(state,events,'defeat','此番失利，茶博士将一行人接回'+getRoute(state).name+'茶肆。休整 8 秒后重新出发。',
      {battleId:snapshot.battleId,snapshot});
    finishFormationPause(state,events);
  }
  function combatTurn(state,events,rng) {
    const battle=state.battle; battle.turn++;
    const alive=state.team.map(uid=>getOwned(state,uid)).filter(h=>h && h.hp>0);
    if(!alive.length) { defeat(state,events); return; }
    const heal=(healer,recipient,amount,label)=>{
      if(!recipient || recipient.hp<=0) return;
      const attacker=heroActor(healer),defender=heroActor(recipient),before=recipient.hp;
      recipient.hp=Math.min(defender.maxHp,recipient.hp+Math.max(0,Math.floor(amount)));
      if(recipient.hp>before) event(state,events,'combat-heal',(label||attacker.name)+'为'+defender.name+'恢复 '+(recipient.hp-before)+' 点气血。',
        {battleId:state.stats.battles,turn:battle.turn,attacker,defender,amount:recipient.hp-before,hpBefore:before,hpAfter:recipient.hp,maxHp:defender.maxHp});
    };
    for(const hero of alive) {
      const stats=getHeroStats(hero),meta=heroMap.get(hero.id);
      const advantage=SECT_ADVANTAGE[meta.sect]===battle.enemy.sect;
      const crit=rng()<Math.min(0.75,0.1+stats.crit);
      const profile=root.JXEquipment?.combatProfile(hero,battle.turn,crit)||{};
      const damage=Math.max(2,Math.floor((stats.atk*(crit?1.65:1)*(1+petEffect(state,'atk'))-battle.enemy.def*0.65)*(advantage?1.25:1)*(battle.environment?.damageMultiplier||1)*(profile.damageMultiplier??1)));
      const attacker=heroActor(hero),defender=enemyActor(state),hpBefore=battle.enemy.hp;
      battle.enemy.hp=Math.max(0,battle.enemy.hp-damage);
      const message=meta.name+'施展'+meta.skill+'，造成 '+damage+' 点伤害'+(crit?'（会心）':'')+(advantage?'（克敌）':'')+'。';
      battle.log.unshift(message); battle.log.length=Math.min(battle.log.length,8);
      event(state,events,'attack',message,{uid:hero.uid,damage,critical:crit,advantage,target:'enemy',
        battleId:state.stats.battles,turn:battle.turn,attacker,defender,hpBefore,hpAfter:battle.enemy.hp,maxHp:battle.enemy.maxHp});
      if(getRole(hero)==='healer') {
        const injured=alive.reduce((a,b)=>a.hp/getHeroStats(a).hp<b.hp/getHeroStats(b).hp?a:b);
        heal(hero,injured,stats.atk*0.42*(profile.healMultiplier??1));
      }
      if(profile.lifesteal) heal(hero,hero,Math.min(hpBefore,damage)*profile.lifesteal,'神兵汲取');
      if(profile.teamHeal) for(const ally of alive) heal(hero,ally,stats.atk*profile.teamHeal*(profile.healMultiplier??1),profile.label||'神兵济世');
      if(profile.extraStrike && battle.enemy.hp>0) {
        const echoBefore=battle.enemy.hp,echoTarget=enemyActor(state),echoActor=heroActor(hero);
        battle.enemy.hp=Math.max(0,echoBefore-damage);
        event(state,events,'attack',meta.name+'触发'+(profile.label||'橙武追加一击')+'，追加 '+damage+' 点伤害。',
          {uid:hero.uid,damage,critical:crit,advantage,target:'enemy',legendary:true,battleId:state.stats.battles,turn:battle.turn,
            attacker:echoActor,defender:echoTarget,hpBefore:echoBefore,hpAfter:battle.enemy.hp,maxHp:battle.enemy.maxHp});
      }
      if(battle.enemy.hp<=0) { rewardWin(state,events,rng); return; }
    }
    const tank=alive.find(h=>getRole(h)==='tank'),dungeonBoss=!!battle.enemy.dungeonId;
    const area=dungeonBoss&&battle.enemy.areaEvery&&battle.turn%battle.enemy.areaEvery===0;
    const enraged=dungeonBoss&&battle.enemy.enrageRound&&battle.turn>=battle.enemy.enrageRound;
    const heavy=dungeonBoss&&battle.enemy.heavyEvery&&battle.turn%battle.enemy.heavyEvery===0;
    const targets=area?alive:[tank||pick(alive,rng)];
    if(area)event(state,events,'boss-mechanic',battle.enemy.name+'蓄力爆发，横扫全队！');
    if(enraged&&battle.turn===battle.enemy.enrageRound)event(state,events,'boss-mechanic',battle.enemy.name+'进入狂暴，伤害提高！');
    for(const target of targets){
    const defense=root.JXEquipment?.combatProfile(target,battle.turn,false)||{};
    const damage=dungeonBoss?Math.max(3,Math.round((battle.enemy.atk*(enraged?1.8:1)*(heavy?1.45:1)-getHeroStats(target).def*(1+petEffect(state,'def'))*(getRole(target)==='tank'?.65:.38))*(.9+rng()*.2)*(1-petEffect(state,'resist'))*(battle.environment?.enemyDamageMultiplier||1)*(1-(defense.damageReduction||0)))):Math.max(1,Math.floor((battle.enemy.atk-getHeroStats(target).def*(1+petEffect(state,'def'))*0.6)*(1-petEffect(state,'resist'))*(battle.environment?.enemyDamageMultiplier||1)*(1-(defense.damageReduction||0))));
    const attacker=enemyActor(state),defender=heroActor(target),hpBefore=target.hp;
    target.hp=Math.max(0,target.hp-damage);
    const message=battle.enemy.name+'还击，'+heroMap.get(target.id).name+'受到 '+damage+' 点伤害。';
    battle.log.unshift(message); battle.log.length=Math.min(battle.log.length,8);
    event(state,events,'attack',message,{uid:target.uid,damage,target:'hero',battleId:state.stats.battles,turn:battle.turn,
      attacker,defender,hpBefore,hpAfter:target.hp,maxHp:defender.maxHp});
    if(target.hp===0 && defense.revive && !(battle.revives?.[target.uid])) {
      battle.revives??={};battle.revives[target.uid]=1;
      const fallen=heroActor(target);target.hp=Math.max(1,Math.floor(defender.maxHp*0.3));
      event(state,events,'combat-heal',defender.name+'触发神兵不屈，恢复三成气血重新站起。',
        {battleId:state.stats.battles,turn:battle.turn,attacker:fallen,defender:fallen,amount:target.hp,hpBefore:0,hpAfter:target.hp,maxHp:defender.maxHp,legendary:true});
    }
    }
    if(!state.team.some(uid=>getOwned(state,uid).hp>0) || battle.turn>=60) defeat(state,events);
  }
  function tick(state,seconds,rng=Math.random,realSeconds=seconds) {
    if(!finite(seconds,0,OFFLINE_CAP) || seconds===0) return [];
    const events=[]; let remaining=seconds;
    state.clock+=seconds; state.stats.playSeconds+=seconds;
    if(!state.running) return events;
    while(remaining>0.000001) {
      if(!state.running) break;
      if(state.adventure.restSeconds>0) {
        const step=Math.min(remaining,state.adventure.restSeconds);
        state.adventure.restSeconds-=step; remaining-=step; continue;
      }
      if(state.battle) {
        const step=Math.min(remaining,1.4-state.battle.elapsed);
        state.battle.elapsed+=step; remaining-=step;
        if(state.battle.elapsed>=1.4-0.000001) { state.battle.elapsed=0; combatTurn(state,events,rng); }
      } else {
        const step=Math.min(remaining,8-state.adventure.stepTimer);
        state.adventure.stepTimer+=step; remaining-=step;
        if(state.adventure.stepTimer>=8-0.000001) {
          state.adventure.stepTimer=0; state.stats.steps++;
          event(state,events,'step','沿'+getRoute(state).name+'继续前行。');
          startBattle(state,events,rng,state.routeProgress>=getRoute(state).steps);
        }
      }
    }
    if(finite(realSeconds,0,OFFLINE_CAP))root.JXProgression?.tick(state,realSeconds*(seconds-remaining)/seconds,true);
    return events;
  }
  function serialize(state) { return JSON.stringify(state); }
  function reject(message='存档内容不完整或已损坏，请选择有效的江湖存档。') { throw new Error(message); }
  function validateTree(value,depth=0) {
    if(depth>30) reject('存档层级过深。');
    if(value===null || typeof value==='boolean' || typeof value==='string') return;
    if(typeof value==='number') { if(!Number.isFinite(value)) reject(); return; }
    if(typeof value!=='object') reject();
    for(const key of Object.keys(value)) { if(['__proto__','prototype','constructor'].includes(key)) reject('存档包含无效字段。'); validateTree(value[key],depth+1); }
  }
  function parseSave(raw) {
    if(typeof raw!=='string' || raw.length>2000000) reject('存档文件过大或格式无效。');
    let s; try { s=JSON.parse(raw); } catch { reject('存档不是有效的 JSON 文件。'); }
    validateTree(s);
    if(!s || ![1,2].includes(s.version)) reject('存档版本不受支持。');
    if(root.JXProgression)root.JXProgression.validateSave(s);
    const legacy=s.version===1;
    if(typeof s.name!=='string' || s.name.length>64 || !s.name.trim()) reject();
    for(const key of ['silver','jade','renown','clock','createdAt','lastSaved']) if(!finite(s[key],0,key.includes('At')||key==='lastSaved'?1e15:1e12)) reject('存档中的资源或时间无效。');
    if(!routeMap.has(s.routeId) || !integer(s.routeProgress,0,10000)) reject('存档中的路线无效。');
    if(!s.inventory || Array.isArray(s.inventory)) reject();
    for(const [key,value] of Object.entries(s.inventory)) if(!itemMap.has(key) || !integer(value,0,1e9)) reject('存档中的背包物品无效。');
    for(const item of D.ITEMS) if(s.inventory[item.id]===undefined) s.inventory[item.id]=0;
    if(!Array.isArray(s.heroes) || s.heroes.length<1 || s.heroes.length>D.HEROES.length) reject('侠客名册无效。');
    if(root.JXEquipment?.validateSave) root.JXEquipment.validateSave(s);
    const uids=new Set(),ids=new Set();
    for(const h of s.heroes) {
      if(!h || !heroMap.has(h.id) || typeof h.uid!=='string' || !/^[A-Za-z0-9_-]{1,100}$/.test(h.uid) || uids.has(h.uid) || ids.has(h.id)) reject('侠客名册存在未知或重复人物。');
      if(!integer(h.level,1,MAX_LEVEL) || !finite(h.xp) || !integer(h.stars,0,5) || !integer(h.insight) || !finite(h.hp,0,getHeroStats(h).hp)) reject('侠客属性无效。');
      if(h.level<MAX_LEVEL && h.xp>=nextLevelXp(h)) reject('侠客修为数据无效。');
      const data=heroMap.get(h.id);
      if(h.role!==undefined && !(data.roles||[data.role]).includes(h.role)) reject('侠客职责心法无效。');
      uids.add(h.uid); ids.add(h.id);
    }
    const teamValid=team=>Array.isArray(team) && team.length<=(legacy?6:TEAM_SIZE) && new Set(team).size===team.length && team.every(uid=>uids.has(uid));
    if(!teamValid(s.team) || s.team.length<1) reject('同行阵容无效。');
    if(!Array.isArray(s.presets) || s.presets.length!==5 || !s.presets.every(teamValid)) reject('阵容预设无效。');
    if(legacy) {s.team=s.team.slice(0,TEAM_SIZE);s.presets=s.presets.map(p=>p.slice(0,TEAM_SIZE));s.routeProgress=Math.min(s.routeProgress,getRoute(s).steps);}
    s.version=2;
    for(const [key,allowed] of [['dex',heroMap],['badges',routeMap],['pets',new Map(D.PETS.map(p=>[p.id,p]))]])
      if(!Array.isArray(s[key]) || new Set(s[key]).size!==s[key].length || s[key].some(id=>!allowed.has(id))) reject('图鉴或信物数据无效。');
    if(s.heroes.some(h=>!s.dex.includes(h.id)) || (s.activePet!==null && !s.pets.includes(s.activePet))) reject('图鉴或跟宠数据无效。');
    if(!routeUnlocked(s,getRoute(s)) || s.routeProgress>getRoute(s).steps) reject('路线尚未解锁。');
    if(s.routeLoop===undefined) s.routeLoop=[];
    if(!Array.isArray(s.routeLoop) || s.routeLoop.length>D.ROUTES.length || new Set(s.routeLoop).size!==s.routeLoop.length || s.routeLoop.some(id=>!routeUnlocked(s,id))) reject('循环路线包含未知、重复或尚未解锁的路线。');
    if(s.environmentTime===undefined) s.environmentTime=s.lastSaved;
    if(!finite(s.environmentTime,0,1e15)) reject('江湖环境时间无效。');
    if(!s.stats || !s.clears || Array.isArray(s.stats) || Array.isArray(s.clears)) reject();
    for(const value of Object.values(s.stats)) if(!finite(value)) reject('江湖统计数据无效。');
    for(const [id,n] of Object.entries(s.clears)) if(!routeMap.has(id) || !integer(n,0,1e9)) reject();
    const baseStats={battles:0,wins:0,recruited:0,steps:0,silverEarned:0,playSeconds:0,bosses:0,expEarned:0,defeats:0};
    s.stats=Object.assign(baseStats,s.stats);
    if(![1,2,3].includes(s.speed) || typeof s.running!=='boolean' || typeof s.autoInvite!=='boolean') reject();
    if(s.pauseAfterBattle===undefined) s.pauseAfterBattle=false;
    if(typeof s.pauseAfterBattle!=='boolean') reject('战后整队设置无效。');
    if(s.autoAdvance===undefined) s.autoAdvance=true;
    if(typeof s.autoAdvance!=='boolean') reject('自动推进设置无效。');
    if(!s.settings || typeof s.settings.sound!=='boolean' || typeof s.settings.motion!=='boolean') reject();
    if(!s.systems || typeof s.systems!=='object' || Array.isArray(s.systems)) reject();
    if(!Array.isArray(s.logs) || s.logs.some(l=>!l || typeof l.message!=='string' || typeof l.type!=='string' || !finite(l.time))) reject();
    s.logs=s.logs.slice(0,60).map(l=>({message:l.message.slice(0,500),type:l.type.slice(0,30),time:l.time}));
    if(!s.adventure) s.adventure={stepTimer:0,restSeconds:0,lastTeaRoute:s.routeId};
    if(s.adventure.dungeonBossIndex===undefined)s.adventure.dungeonBossIndex=0;
    const activeDungeon=D.DUNGEONS?.find(d=>d.id===getRoute(s).dungeonId);
    if(!integer(s.adventure.dungeonBossIndex,0,activeDungeon?activeDungeon.bosses.length-1:0))reject('秘境首领进度无效。');
    if(!finite(s.adventure.stepTimer,0,8) || !finite(s.adventure.restSeconds,0,60) || !routeMap.has(s.adventure.lastTeaRoute)) reject('冒险状态无效。');
    if(s.battle!==null) {
      const b=s.battle,e=b?.enemy;
      if(!b || b.phase!=='combat' || typeof b.boss!=='boolean' || !integer(b.turn,0,60) || !finite(b.elapsed,0,1.4) || !e) reject('切磋状态无效。');
      if(!integer(e.level,1,100) || !finite(e.maxHp,1,1e8) || !finite(e.hp,0,e.maxHp) || !finite(e.atk,0,1e7) || !finite(e.def,0,1e7) || typeof e.name!=='string' || !D.SECTS.some(x=>x.id===e.sect) || !integer(e.portrait,0,D.SECTS.length-1)) reject('对手属性无效。');
      const expectedBoss=activeDungeon&&root.JXDungeonRules?.encounter(s,getRoute(s),s.adventure.dungeonBossIndex,'normal');
      if(e.id!=='boss_'+s.routeId && e.id!==expectedBoss?.id && !heroMap.has(e.id)) reject('对手身份无效。');
      if(expectedBoss&&b.boss&&(e.name!==expectedBoss.name||e.bossIndex!==s.adventure.dungeonBossIndex))reject('首领顺序无效。');
      if(!Array.isArray(b.log) || b.log.some(x=>typeof x!=='string')) reject();
      if(b.revives!==undefined && (!b.revives || Array.isArray(b.revives) || typeof b.revives!=='object' || Object.entries(b.revives).some(([uid,n])=>!uids.has(uid)||n!==1))) reject('神兵复起记录无效。');
      b.log=b.log.slice(0,8).map(x=>x.slice(0,500));
      if(b.environment) {
        if(!finite(b.environment.at,0,1e15)) reject('战斗环境时间无效。');
        b.environment=environment(s,b.environment.at);
      } else b.environment=environment(s);
    }
    if(s.rngSeed===undefined) s.rngSeed=726193;
    if(!integer(s.rngSeed,0,4294967295)) reject();
    if(root.JXSystems?.validateSave) root.JXSystems.validateSave(s);
    return s;
  }
  function applyOffline(state,seconds) {
    const requested=Number.isFinite(seconds)?Math.max(0,seconds):0,actual=Math.min(OFFLINE_CAP,requested);
    const before={battles:state.stats.battles,wins:state.stats.wins,recruited:state.stats.recruited,silver:state.silver,exp:state.stats.expEarned||0};
    const rng=()=>{state.rngSeed=(Math.imul(state.rngSeed||726193,1664525)+1013904223)>>>0; return state.rngSeed/4294967296;};
    let rest=actual;
    while(rest>0) { const chunk=Math.min(60,rest); tick(state,chunk,rng); rest-=chunk; }
    return {seconds:actual,capped:requested>OFFLINE_CAP,battles:state.stats.battles-before.battles,wins:state.stats.wins-before.wins,
      recruited:state.stats.recruited-before.recruited,silver:state.silver-before.silver,exp:(state.stats.expEarned||0)-before.exp};
  }
  root.JXEngine=Object.freeze({createState,tick,combatSnapshot,getHeroStats,teamPower,setRoute,toggleTeam,levelUp,breakthrough,buyItem,useItem,savePreset,loadPreset,
    addHero,addLog,serialize,parseSave,applyOffline,grantXp,nextLevelXp,levelCap,getRoute,routeUnlocked,routeRequirement,mainBadgeCount,challengeBoss,restAtTea,prepareFormation,setRouteLoop,environment,SECT_ADVANTAGE,getRole,setRole,TEAM_SIZE});
})(globalThis);
