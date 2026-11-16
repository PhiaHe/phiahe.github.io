(function(root){
  'use strict';
  const D=root.JXData, ARMOR=['head','chest','waist','wrist','legs','feet'];
  const REVISION='journey-3-20261116', DURATION=7200;
  function init(state){
    if(!state.progression)state.progression={revision:REVISION,index:0,activeSeconds:0,rewardedMinutes:0,recruitments:0,completed:[],finished:false};
    return state.progression;
  }
  function current(state){
    const p=init(state),index=p.index,expansion=D.EXPANSIONS[index];
    return {index,expansion,levelCap:10+index*5,duration:DURATION,requirements:{sets:index<6?2:3,refine:Math.min(6,2+Math.floor(index/4)),stone:Math.min(7,2+Math.floor(index/3)),color:Math.min(5,1+Math.floor(index/4))}};
  }
  const isExpansionUnlocked=(state,id)=>{const n=D.EXPANSIONS.findIndex(x=>x.id===id);return n>=0&&n<=current(state).index;};
  function requiredHeroes(state){const id=current(state).expansion.id;return [...new Set(D.ROUTES.filter(r=>r.expansionId===id).flatMap(r=>r.heroes))];}
  function heroChecks(state,h){
    const c=current(state),r=c.requirements,Q=root.JXEquipment;
    const armor=ARMOR.filter(slot=>h.equipment?.[slot]?.set===c.expansion.setName&&h.equipment[slot].expansionId===c.expansion.id);
    const set=armor.length===6;
    const refine=set&&armor.every(slot=>(h.enhancements?.[slot]?.refine||0)>=r.refine);
    const stones=Object.keys(h.equipment||{}).flatMap(slot=>h.equipment[slot]?.expansionId===c.expansion.id?(h.enhancements?.[slot]?.sockets||[]):[]);
    const socket=set&&stones.filter(x=>x>=r.stone).length>=12;
    const color=set&&h.equipment?.weapon?.expansionId===c.expansion.id&&!!h.colorStone&&(h.colorStoneLevel||1)>=r.color&&(Q?.colorStatus?.(h)?.active??Q?.heroInfo(state,h.uid)?.colorStatus?.active??0)>0;
    return {uid:h.uid,set,refine,socket,color,complete:set&&refine&&socket&&color};
  }
  function checklist(state){
    const c=current(state),p=init(state),ids=requiredHeroes(state),team=state.team.map(uid=>state.heroes.find(h=>h.uid===uid)).filter(Boolean),checks=team.map(h=>heroChecks(state,h));
    const main=D.DUNGEONS.find(d=>d.expansionId===c.expansion.id&&d.main!==false),record=state.equipment?.dungeons?.[main?.id];
    const routeIds=D.ROUTES.filter(r=>r.expansionId===c.expansion.id&&r.main!==false).map(r=>r.id);
    const row=(id,label,value,target,detail,action)=>({id,label,value,target,done:value>=target,detail,action});
    const items=[
      row('time','本章阅历',Math.floor(p.activeSeconds/60),120,'实际历练每分钟1点，暂停不增长，战斗倍速不改变阅历。','adventure'),
      row('heroes','本章侠客全收集',ids.filter(id=>state.dex.includes(id)).length,ids.length,'每10分钟定向结交一位尚未收集的本章侠客；不受昼夜限制。','team'),
      row('level','五人修为封顶',team.filter(h=>h.level>=c.levelCap).length,5,'五名上阵侠客达到 Lv.'+c.levelCap+'。','team'),
      row('sets','本章六件套',checks.filter(x=>x.set).length,c.requirements.sets,'至少'+c.requirements.sets+'名上阵侠客穿齐「'+c.expansion.setName+'」六件防具。','exchange'),
      row('enhance','成套侠客完成强化',checks.filter(x=>x.complete).length,c.requirements.sets,'同一批侠客六件防具精炼≥'+c.requirements.refine+'；本章装备镶≥12颗'+c.requirements.stone+'级五行石；本章武器装≥'+c.requirements.color+'级五彩石且激活。','equipment'),
      row('routes','主线全程通关',routeIds.filter(id=>state.badges.includes(id)).length,routeIds.length,'野外历程与普通秘境逐一击败全部首领。','map'),
      row('challenge','本章挑战秘境',record?.modes?.challenge?.wins>0?1:0,1,(main?.name||'本章秘境')+' · 挑战难度全首领通关一次。','dungeons')
    ];
    return {...c,items,heroes:ids.map(id=>({id,name:D.HEROES.find(h=>h.id===id)?.name,owned:state.dex.includes(id)})),heroChecks:checks,ready:items.every(x=>x.done),finished:p.finished};
  }
  function tick(state,seconds,active=state.running){
    if(!active||!Number.isFinite(seconds)||seconds<=0)return;
    const p=init(state);if(p.finished)return;
    p.activeSeconds=Math.min(DURATION,p.activeSeconds+seconds);
    const minutes=Math.floor(p.activeSeconds/60),delta=minutes-p.rewardedMinutes;
    if(delta>0){
      p.rewardedMinutes=minutes;state.silver+=1300*delta;state.stats.silverEarned+=1300*delta;state.renown+=12*delta;
      state.inventory.invite=Math.min(1e9,state.inventory.invite+2*delta);
      const e=root.JXEquipment?.init(state);if(e)e.stones[1]=Math.min(1e9,(e.stones[1]||0)+6*delta);
    }
    // A deterministic catch-up invitation prevents night-only and rare recruits blocking a chapter.
    const visits=Math.floor(minutes/10);
    while(p.recruitments<visits){
      const id=requiredHeroes(state).find(id=>!state.dex.includes(id));
      if(!state.autoInvite||id&&state.inventory.invite<1)break;
      p.recruitments++;
      if(id){state.inventory.invite--;const joined=root.JXEngine.addHero(state,id);root.JXEngine.addLog(state,'本章寻访：'+D.HEROES.find(h=>h.id===id).name+'已应邀同行。','recruit');joined.hero.hp=root.JXEngine.getHeroStats(joined.hero).hp;}
    }
  }
  function advance(state){
    const info=checklist(state),p=init(state);
    if(p.finished)return {ok:false,message:'已完成全部资料片历程。'};
    if(state.battle)return {ok:false,message:'请先战后整队，再开启下一资料片。'};
    if(!info.ready)return {ok:false,message:'尚未毕业：'+info.items.filter(x=>!x.done).map(x=>x.label).join('、')+'。'};
    p.completed.push({id:info.expansion.id,seconds:p.activeSeconds});
    if(p.index===D.EXPANSIONS.length-1){p.finished=true;return {ok:true,message:'十八章山河尽览，历代江湖毕业！'};}
    p.index++;p.activeSeconds=0;p.rewardedMinutes=0;p.recruitments=0;
    const next=current(state),route=D.ROUTES.find(r=>r.expansionId===next.expansion.id&&r.main!==false&&r.kind==='field');
    state.routeLoop=[];state.routeId=route.id;state.routeProgress=0;state.adventure.dungeonBossIndex=0;state.adventure.stepTimer=0;state.adventure.restSeconds=4;state.adventure.lastTeaRoute=route.id;state.pauseAfterBattle=false;state.running=true;
    root.JXEngine.addLog(state,'资料片开启：'+next.expansion.name+'；修为上限 Lv.'+next.levelCap+'。换上本章新装备后需要重新精炼与镶嵌。','chapter');
    return {ok:true,message:'已开启「'+next.expansion.name+'」，等级上限提升至 '+next.levelCap+'。'};
  }
  function validateSave(state){
    const p=state.progression;
    if(!p||p.revision!==REVISION)throw new Error('这是旧数值体系的存档，请从新版新建江湖开始。');
    const int=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
    if(!int(p.index,0,D.EXPANSIONS.length-1)||!Number.isFinite(p.activeSeconds)||p.activeSeconds<0||p.activeSeconds>DURATION||!int(p.rewardedMinutes,0,120)||p.rewardedMinutes!==Math.floor(p.activeSeconds/60)||!int(p.recruitments,0,12)||p.recruitments>Math.floor(p.activeSeconds/600)||typeof p.finished!=='boolean'||!Array.isArray(p.completed)||p.completed.length!==p.index+(p.finished?1:0)||p.finished&&p.index!==D.EXPANSIONS.length-1)throw new Error('资料片历程数据无效。');
    p.completed.forEach((x,i)=>{if(x.id!==D.EXPANSIONS[i].id||x.seconds!==DURATION)throw new Error('资料片毕业记录无效。');});
    if(state.heroes.some(h=>h.level>current(state).levelCap))throw new Error('侠客等级超过本资料片上限。');
    if(state.badges.some(id=>{const r=D.ROUTES.find(r=>r.id===id);return r&&!isExpansionUnlocked(state,r.expansionId);}))throw new Error('存档含尚未开放的资料片信物。');
    return true;
  }
  root.JXProgression={REVISION,DURATION,ARMOR,init,current,requiredHeroes,isExpansionUnlocked,checklist,heroChecks,tick,advance,validateSave};
})(globalThis);
