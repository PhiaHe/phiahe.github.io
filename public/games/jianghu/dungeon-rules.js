(function(root){
  'use strict';
  const D=root.JXData;
  const ARMOR=['head','chest','waist','wrist','legs','feet'];
  const MODES=['normal','challenge'];
  const number=(n)=>Number.isFinite(n)?n:0;
  const bossName=b=>typeof b==='string'?b:b.name;
  function dungeon(value){
    if(typeof value==='string')return D.DUNGEONS.find(d=>d.id===value||d.routeId===value);
    return value?.bosses?value:D.DUNGEONS.find(d=>d.id===value?.dungeonId);
  }
  function chapter(d){return Math.max(0,D.EXPANSIONS.findIndex(e=>e.id===d?.expansionId));}
  function requirements(difficulty,d){
    const index=chapter(d),cap=10+index*5,hard=difficulty==='challenge';
    return {partySize:hard||index>0?5:3,level:hard?cap-1:Math.min(d.level,cap-2),itemLevel:hard?cap-4:Math.max(2,Math.min(d.level,cap-2)-4),
      setHeroes:hard?(index>=6?3:2):0,setPieces:6,refine:hard?2+Math.floor(index/4):0,stone:hard?2+Math.floor(index/3):0,
      color:hard?1+Math.floor(index/4):0,roles:hard?['tank','healer']:[],setName:d.setName,levelCap:cap};
  }
  function loadout(hero,d,req){
    const slots=root.JXEquipment?.SLOTS||[],equipment=hero.equipment||{},enh=hero.enhancements||{};
    const armor=ARMOR.filter(slot=>equipment[slot]?.set===d.setName&&equipment[slot].expansionId===d.expansionId);
    const stones=slots.flatMap(slot=>equipment[slot.id]?.expansionId===d.expansionId?(enh[slot.id]?.sockets||[]):[]);
    const refined=armor.filter(slot=>number(enh[slot]?.refine)>=req.refine).length;
    const stoneCount=stones.filter(level=>level>=req.stone).length;
    const colorLevel=equipment.weapon?.expansionId===d.expansionId&&hero.colorStone?(hero.colorStoneLevel??1):0;
    const activeColor=(root.JXEquipment?.colorStatus?.(hero)?.active||0)>0;
    return {uid:hero.uid,level:hero.level,itemLevel:slots.reduce((sum,slot)=>sum+number(equipment[slot.id]?.level),0)/Math.max(1,slots.length),
      setPieces:armor.length,refinedPieces:refined,stoneCount,colorLevel,activeColor,
      qualified:armor.length>=req.setPieces&&refined>=req.setPieces&&stoneCount>=12&&colorLevel>=req.color&&activeColor};
  }
  function readiness(state,value,difficulty='normal'){
    const d=dungeon(value),label=difficulty==='challenge'?'挑战':'普通';
    if(!d||!MODES.includes(difficulty))return {ready:false,unmet:['秘境或难度无效'],requirements:{},actual:{},difficulty,label};
    const req=requirements(difficulty,d),team=state.team.map(uid=>state.heroes.find(h=>h.uid===uid)).filter(Boolean),members=team.map(h=>loadout(h,d,req));
    const actual={partySize:team.length,level:team.reduce((n,h)=>n+h.level,0)/Math.max(1,team.length),itemLevel:members.reduce((n,h)=>n+h.itemLevel,0)/Math.max(1,members.length),
      setHeroes:members.filter(h=>h.qualified).length,roles:team.map(h=>root.JXEngine.getRole(h)),members};
    const unmet=[];
    if(root.JXProgression&&!root.JXProgression.isExpansionUnlocked(state,d.expansionId))unmet.push('所属资料片尚未开启');
    if(actual.partySize<req.partySize)unmet.push(`至少 ${req.partySize} 位同行侠客`);
    if(actual.level<req.level)unmet.push(`队伍平均等级 ${req.level}（当前 ${actual.level.toFixed(1)}）`);
    if(actual.itemLevel<req.itemLevel)unmet.push(`十二部位平均装备等级 ${req.itemLevel}（当前 ${actual.itemLevel.toFixed(1)}）`);
    if(difficulty==='challenge'){
      if(!(state.equipment?.dungeons?.[d.id]?.modes?.normal?.wins>0))unmet.push('先完整通关此秘境普通难度');
      if(req.roles.some(role=>!actual.roles.includes(role)))unmet.push('同行队伍需要承伤与治疗各一位');
      if(actual.setHeroes<req.setHeroes)unmet.push(`${req.setHeroes} 位侠客穿戴「${d.setName}」六件套，六部位精炼≥${req.refine}、至少12颗${req.stone}级五行石、已激活的${req.color}级五彩石（当前 ${actual.setHeroes} 位）`);
    }
    return {ready:unmet.length===0,unmet,requirements:req,actual,difficulty,label};
  }
  function encounter(state,value,bossIndex=0,difficulty='normal'){
    const d=dungeon(value);
    if(!d||!MODES.includes(difficulty)||!Number.isInteger(bossIndex)||bossIndex<0||bossIndex>=d.bosses.length)return null;
    const index=chapter(d),cap=10+index*5,hard=difficulty==='challenge',level=Math.min(d.level,cap-2),name=bossName(d.bosses[bossIndex]);
    const stage=1+bossIndex*.065,scale=d.materialDrop===false?1:1.22;
    const hp=Math.round((420+level*110)*stage*scale*(hard?3.8:1));
    const atk=Math.round((32+level*12)*stage*(hard?1.85:1));
    return {id:'dungeon_'+d.id+'_'+bossIndex,name,sect:'',level,hp,maxHp:hp,atk,def:Math.round((5+level*1.6)*(hard?1.3:1)),boss:true,
      bossIndex,bossCount:d.bosses.length,dungeonId:d.id,difficulty,artId:root.JXBossArt?.get(name)?.id||name,
      areaEvery:3,heavyEvery:hard?4:0,enrageRound:hard?12:24,
      mechanic:hard?'每3回合全队伤害；每4回合重击；第12回合起狂暴。':'每3回合全队伤害；第24回合起狂暴。'};
  }
  function record(state,value,difficulty,result){
    const d=dungeon(value);if(!d||!MODES.includes(difficulty))return null;
    const q=root.JXEquipment.init(state),previous=q.dungeons[d.id]||{runs:0,wins:0,best:0},modes=previous.modes||{},old=modes[difficulty]||{runs:0,wins:0,best:0,bosses:[]};
    const floor=Math.min(d.bosses.length,Math.max(0,Math.floor(number(result.floor)))),won=!!result.won&&floor===d.bosses.length;
    const bosses=d.bosses.slice(0,floor).map(bossName);
    modes[difficulty]={runs:number(old.runs)+1,wins:number(old.wins)+(won?1:0),best:Math.max(number(old.best),floor),bosses,
      last:{won,floor,rounds:number(result.rounds),damage:number(result.damage),at:number(state.clock)}};
    q.dungeons[d.id]={runs:number(previous.runs)+1,wins:number(previous.wins)+(won?1:0),best:Math.max(number(previous.best),floor),modes};
    return q.dungeons[d.id];
  }
  function validateRecords(state){
    const integer=n=>Number.isInteger(n)&&n>=0&&n<=1e9;
    for(const [id,rec] of Object.entries(state.equipment?.dungeons||{})){
      const d=dungeon(id);if(!d)throw new Error('存档秘境记录无效。');
      if(rec.modes===undefined)continue;
      if(!rec.modes||typeof rec.modes!=='object'||Array.isArray(rec.modes))throw new Error('存档秘境难度记录无效。');
      for(const [mode,r] of Object.entries(rec.modes)){
        if(!MODES.includes(mode)||!r||!integer(r.runs)||!integer(r.wins)||r.wins>r.runs||!integer(r.best)||r.best>d.bosses.length||r.wins>0&&r.best!==d.bosses.length||!Array.isArray(r.bosses)||r.bosses.length>r.best||r.bosses.some((name,i)=>name!==bossName(d.bosses[i])))throw new Error('存档秘境首领记录无效。');
        if(r.last!==undefined&&(!r.last||typeof r.last.won!=='boolean'||!integer(r.last.floor)||r.last.floor!==r.bosses.length||!integer(r.last.rounds)||!Number.isFinite(r.last.damage)||r.last.damage<0||!Number.isFinite(r.last.at)||r.last.at<0||r.last.won&&r.last.floor!==d.bosses.length))throw new Error('存档秘境战报无效。');
      }
    }
    return true;
  }
  root.JXDungeonRules={dungeon,requirements,loadout,readiness,encounter,record,validateRecords};
})(globalThis);
