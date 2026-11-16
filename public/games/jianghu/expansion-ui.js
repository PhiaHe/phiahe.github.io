(function(root){
  'use strict';
  const D=root.JXData,E=root.JXEngine,Q=root.JXEquipment,S=root.JXSystems;
  function create(c){
    const {ui,esc,fmt,btn,portrait,meta,roleLabel}=c;
    const state=()=>c.getState();
    const label={rare:'精良',epic:'紫装',legendary:'橙武'};
    const selected=()=>{const s=state();return s.heroes.find(h=>h.uid===ui.equipmentHero)||s.heroes.find(h=>s.team.includes(h.uid))||s.heroes[0];};
    function heroPicker(){const s=state(),h=selected();return '<div class="equipment-roster">'+s.heroes.map(a=>'<button class="equip-hero '+(a.uid===h.uid?'active':'')+'" data-action="eq-select" data-id="'+esc(a.uid)+'">'+portrait(meta(a.id))+'<span>'+esc(meta(a.id).name)+'<small>'+roleLabel(E.getRole(a))+' · Lv.'+a.level+'</small></span></button>').join('')+'</div>';}
    function roleSummary(){const counts={tank:0,healer:0,dps:0};for(const uid of state().team){const h=state().heroes.find(x=>x.uid===uid);counts[E.getRole(h)]++;}return '<div class="role-summary"><span class="role-tank">T '+counts.tank+'</span><span class="role-healer">治疗 '+counts.healer+'</span><span class="role-dps">DPS '+counts.dps+'</span><small>推荐 1 T / 1 治疗 / 3 DPS · '+(!counts.tank?'缺少承伤，敌人会攻击其他队员':!counts.healer?'缺少治疗，长战斗更依赖装备与茶肆':'承伤优先接敌，治疗照顾低血队员')+'</small></div>';}
    function heroControls(hero){const m=meta(hero.id),stats=E.getHeroStats(hero);return '<div class="hero-role-controls"><span>战斗职责</span>'+(m.roles||[m.role]).map(role=>btn(roleLabel(role),'set-role',hero.uid+'|'+role,role===E.getRole(hero)?'primary small':'small')).join('')+btn('查看装备 · 战力 '+fmt(stats.power),'hero-equipment',hero.uid,'small')+'</div>';}
    const statsText=stats=>Object.entries(stats||{}).filter(([k,v])=>['hp','atk','def','crit'].includes(k)&&v).map(([k,v])=>({hp:'气血',atk:'攻击',def:'防御',crit:'会心'}[k])+' +'+(k==='crit'?Math.round(v*100)+'%':Math.floor(v))).join(' · ');
    let quickCache={key:null,value:null};
    function quickCosts(costs){
      if(!costs)return '不消耗材料';
      const parts=[];
      if(costs.silver>0)parts.push(fmt(costs.silver)+' 银两');
      for(const [level,n] of Object.entries(costs.stones||{}))if(n>0)parts.push(level+'级石 ×'+n);
      for(const [id,n] of Object.entries(costs.colors||{}))if(n>0)parts.push((Q.COLORS.find(x=>x.id===id)?.name||'五彩石')+' ×'+n);
      return parts.join(' · ')||'不消耗材料';
    }
    function quickActions(h){
      const s=state(),key=JSON.stringify([h.uid,h.level,h.stars,h.role,h.equipment,h.enhancements,h.colorStone,h.colorStoneLevel,s.equipment.bag,s.equipment.stones,s.equipment.colors,s.silver,!!s.battle]);
      if(quickCache.key!==key)quickCache={key,value:Q.quickPreview(s,h.uid)};
      const previews=quickCache.value,actions=[['equip','一键穿戴','自动选择适合职责的装备组合'],['enhance','一键强化','自动镶嵌，再均衡精炼'],['refine','一键精炼','优先提升精炼较低的已穿部位'],['socket','一键镶嵌','补齐宝石，匹配五彩石']];
      const result=ui.equipmentResult?.uid===h.uid?ui.equipmentResult:null;
      return '<section class="quick-equipment" aria-label="一键装备操作"><div class="quick-heading"><div><span class="eyebrow">当前侠客 · '+roleLabel(E.getRole(h))+'</span><h2>'+esc(meta(h.id).name)+' · 一键养成</h2></div>'+btn(s.battle?'本场结束后整队':'战后整队','formation','','small')+'</div><p class="quick-hint">按职责、套装和特效选择装备。跨资料片换装会重置对应部位精炼与宝石；准备好新套装后再换穿。</p>'+btn('换穿本章装备','eq-current','','small')+btn('侠名兑换缺件','nav','exchange','small')+'<div class="quick-action-grid">'+actions.map(([id,label,hint])=>{const p=previews[id];return '<button class="quick-action '+(id==='equip'?'quick-equip':'')+'" data-action="eq-auto-'+id+'" '+(!p.ok?'disabled':'')+'><strong>'+label+'</strong><span>'+hint+'</span><small>'+(p.ok?(id==='equip'?'更换 '+p.changes.length+' 处配置':'预计 '+quickCosts(p.costs)):esc(p.message))+'</small></button>';}).join('')+'</div>'+(s.battle?'<p class="quick-battle-note">正在战斗，整队结束后即可一键配置。</p>':'')+(result?'<div class="quick-result" role="status"><strong>'+esc(result.label)+' · '+esc(result.message)+'</strong><span>本次消耗：'+esc(quickCosts(result.costs))+'</span></div>':'')+'</section>';
    }
    function equipmentView(){
      const s=state(),h=selected(),info=Q.heroInfo(s,h.uid),bag=Q.inventory(s),stones=Q.stones?Q.stones(s):Object.entries(s.equipment.stones).map(([level,count])=>({level:Number(level),count}));
      const level=Number(ui.stoneLevel)||1,stat=E.getHeroStats(h),m=meta(h.id);
      return quickActions(h)+heroPicker()+'<div class="equipment-layout"><section class="panel"><div class="panel-header"><h3>'+esc(m.name)+' · '+roleLabel(E.getRole(h))+'</h3>'+btn('战后整队','formation','','small')+'</div><div class="panel-body">'+heroControls(h)+'<p class="equipment-statline">气血 '+stat.hp+'　攻击 '+stat.atk+'　防御 '+stat.def+'　战力 '+stat.power+'</p><div class="equipment-slots">'+info.slots.map(slot=>'<article class="equipment-slot '+(slot.item?'quality-'+slot.item.rarity:'')+'"><div class="between"><span class="slot-label">'+slot.name+'</span><span class="tiny">'+(slot.item?label[slot.item.rarity]+' · Lv.'+slot.item.level:'待装备')+'</span></div><strong>'+esc(slot.item?.name||'空置')+'</strong>'+(slot.item?'<p>'+esc(slot.item.set||'散件')+(slot.item.effect?' · 特效：'+esc(slot.item.effect):'')+(slot.compatible===false?'<br><span class="danger-text">当前职责不匹配，特效未生效</span>':'')+'</p><small>精炼 +'+slot.refine+' · 五行石 '+(slot.sockets.length?slot.sockets.map(n=>n+'级').join(' / '):'未镶嵌')+'（'+slot.sockets.length+'/'+slot.socketCount+'）</small><div class="slot-actions">'+btn('精炼 · '+slot.refineCost+'银','eq-refine',slot.id,'small')+(slot.socketCount?btn('镶'+level+'级石','eq-socket',slot.id,'small'):'')+btn('卸下','eq-unequip',slot.id,'small subtle')+'</div>':'<p>从右侧背包穿戴，或前往历代秘境获取。</p>')+'</article>').join('')+'</div></div></section><aside class="equipment-aside"><section class="panel"><div class="panel-header"><h3>套装与五彩石</h3></div><div class="panel-body">'+(info.setBonuses.length?info.setBonuses.map(set=>'<p><strong>'+esc(set.name)+' · '+set.count+'件</strong><br>'+esc(set.desc)+'<br><span class="gold">已激活 '+(set.active.join(' / ')||'无')+' 件效果</span></p>').join(''):'<p class="muted">同套装凑齐后自动获得组合效果。</p>')+colorView(h,info.colorStatus)+'</div></section><section class="panel"><div class="panel-header"><h3>五行石 · 合成与熔嵌</h3></div><div class="panel-body"><div class="stone-options">'+Array.from({length:8},(_,i)=>{const l=i+1,n=stones.find(x=>Number(x.level)===l)?.count||0;return btn(l+'级 ×'+n,'eq-stone',l,level===l?'small primary':'small');}).join('')+'</div><p class="tiny muted">当前镶嵌 '+level+' 级石。覆盖会消耗原石；精炼消耗一级五行石。合成采用本作固定三合一，避免挂机资源随机损失。</p>'+btn('3颗'+level+'级 → 1颗'+(level+1)+'级','eq-fuse',level,'small')+'</div></section><section class="panel"><div class="panel-header"><h3>装备背包 · '+bag.length+' 件</h3></div><div class="panel-body gear-bag">'+(bag.length?bag.map(item=>'<article class="bag-item quality-'+item.rarity+'"><strong>'+esc(item.name)+'</strong><small>'+esc(Q.SLOTS.find(x=>x.id===item.slot)?.name||item.slot)+' · Lv.'+item.level+' · '+label[item.rarity]+(item.sect?' · '+esc(D.SECTS.find(x=>x.id===item.sect)?.name||item.sect):'')+'</small><small>'+esc(statsText(item.stats))+'</small><div>'+btn('穿戴','eq-equip',item.uid,'small primary')+btn('分解','eq-salvage',item.uid,'small subtle')+'</div></article>').join(''):'<p class="muted">首次地图首领与资料片秘境会掉落装备。通关后可关闭自动推进，重复刷取需要的章节。</p>')+'</div></section></aside></div>';
    }
    function colorView(hero,status){return '<div class="color-status"><h4>武器五彩石</h4><p>'+esc(status?.name||Q.COLORS.find(x=>x.id===hero.colorStone)?.name||'尚未熔嵌')+(hero.colorStone?' · '+(hero.colorStoneLevel||1)+'级':'')+'</p>'+colorConditions(status)+'<div class="stack">'+Q.COLORS.flatMap(color=>Array.from({length:6},(_,i)=>{const level=i+1,key=level===1?color.id:color.id+':'+level,n=state().equipment.colors[key]||0;return n?btn(level+'级 '+color.name+' ×'+n,'eq-color',key,'small'):'';})).join('')+btn('侠名兑换五彩石','nav','exchange','small')+'</div></div>';}
    function colorConditions(status){if(!status)return '';const names={attack:['会心 +4%','伤害 +8%','攻击 +25'],guard:['防御 +12','减伤 +6%','气血 +180'],heal:['攻击 +10','会心 +4%','治疗 +16%']};return '<p class="tiny muted">五彩石 '+(status.level||1)+'级 · 下列为一级基础属性，当前倍率 '+(1+((status.level||1)-1)*.22).toFixed(2)+'<br>全身五行石数量 '+status.count+' · 等级总和 '+status.total+'</p>'+status.thresholds.map((x,i)=>'<p class="tiny '+(status.active>i?'gold':'muted')+'">'+(status.active>i?'◆ 已激活 ':'◇ 未激活 ')+esc(names[status.id]?.[i]||'第'+(i+1)+'条属性')+'<br>需要 '+x.count+' 颗石头、等级总和 '+x.total+'</p>').join('')+'<p class="tiny muted">'+esc(status.note)+'</p>';}
    function forgeMaterials(s,h,recipe,info){
      const materials=[['大铁',recipe.bigIron],['小铁',recipe.smallIron]].map(([label,name])=>{
        const need=info.requirements.find(x=>x.name===name),owned=s.equipment.materials[name]||0,required=need?(need.required??need.amount):0;
        return {label,name,owned,required,missing:Math.max(0,required-owned)};
      });
      const missing=materials.some(x=>x.missing>0),status=info.completed?'complete':s.battle?'battle':info.canAdvance?'ready':missing&&info.reason==='材料尚未备齐。'?'missing':'blocked';
      const title={complete:'已完成',battle:'战斗中',ready:info.stage===0?'可以开始':'可以继续',missing:'材料不足',blocked:'暂不可继续'}[status];
      const step=info.completed?'全部 '+info.steps.length+' 个步骤已完成':'当前第 '+(info.stage+1)+' / '+info.steps.length+' 步 · '+info.nextLabel;
      const note=info.completed?'神兵铸造已完成，可前往装备页穿戴。':info.reason||(materials.every(x=>x.required===0)?'本步不消耗材料，可继续推进任务。':'本步材料已齐，可按下方按钮推进。');
      const buttonLabel=info.completed?'神兵已完成':s.battle?'战斗结束后继续':info.canAdvance?(info.stage===0?'开始铸造':'继续铸造')+' · '+info.nextLabel:status==='missing'?'材料不足，暂不可推进':'暂不可推进';
      const mode=recipe.mode==='growth'?'分段铸造：初阶只需大铁 ×1；取得初阶神兵后，每段升品消耗小铁 ×50，共四段。只需备齐当前步骤的材料。':'经典合炼：起始步骤同时消耗大铁 ×1 和小铁 ×200，后续按任务顺序推进。';
      return '<section class="forge-status forge-status-'+status+'" data-forge-status="'+status+'" aria-label="当前神兵铸造状态"><div class="forge-status-heading"><div><span class="eyebrow">'+esc(meta(h.id).name)+' · '+esc(info.weaponName)+'</span><h2>本步铸造材料</h2></div><strong class="forge-status-badge" role="status">'+title+'</strong></div><p class="forge-current-step">'+esc(step)+'</p><div class="forge-material-grid">'+materials.map(x=>'<article class="forge-material '+(x.missing?'missing':'ready')+'" data-material="'+esc(x.name)+'" data-owned="'+x.owned+'" data-required="'+x.required+'" data-missing="'+x.missing+'"><div class="forge-material-title"><span>'+x.label+'</span><strong>'+esc(x.name)+'</strong></div><dl><div><dt>当前拥有</dt><dd>'+fmt(x.owned)+'</dd></div><div><dt>本步需要</dt><dd>'+fmt(x.required)+'</dd></div><div class="forge-material-shortage"><dt>缺少</dt><dd>'+fmt(x.missing)+'</dd></div></dl><small>'+(x.required===0?'本步不消耗此材料':x.missing?'还需收集 '+fmt(x.missing)+' 份':'本步材料已备齐')+'</small></article>').join('')+'</div><p class="forge-stage-note">'+esc(note)+'</p><button class="btn primary wide forge-advance" data-action="forge-step" data-id="'+recipe.id+'" '+(!info.canAdvance?'disabled':'')+'>'+esc(buttonLabel)+'</button><p class="forge-material-rule">'+esc(mode)+'</p></section>';
    }
    function forgeView(){
      const s=state(),h=selected(),recipes=Q.recipes(s),recipe=recipes.find(x=>x.id===ui.forgeRecipe)||recipes[0],info=Q.forgeInfo(s,h.uid,recipe.id),materials=Q.materials?Q.materials(s):Object.entries(s.equipment.materials).map(([name,count])=>({name,count}));
      const tabs='<div class="tabs">'+recipes.map(r=>'<button class="tab '+(r.id===recipe.id?'active':'')+'" data-action="forge-select" data-id="'+r.id+'">'+esc(r.name)+'</button>').join('')+'</div>';
      const steps='<ol class="forge-steps">'+info.steps.map((step,i)=>'<li class="'+(step.done?'done':step.current?'current':'')+'"><span>'+String(i+1).padStart(2,'0')+'</span><div><strong>'+esc(step.name)+'</strong>'+(step.desc?'<p>'+esc(step.desc)+'</p>':'')+'</div><small>'+(step.done?'已完成':step.current?'当前':'待完成')+'</small></li>').join('')+'</ol>';
      return heroPicker()+tabs+forgeMaterials(s,h,recipe,info)+'<div class="forge-layout"><section class="panel"><div class="panel-header"><h3>'+esc(meta(h.id).name)+' · '+esc(info.weaponName||'门派神兵')+'</h3><span class="pill">'+roleLabel(E.getRole(h))+'</span></div><div class="panel-body"><p>'+esc(info.note)+'</p><div class="orange-effect">'+({tank:'神兵不屈：减伤20%，每场战斗可从致命伤中复起一次，恢复30%气血。',healer:'神兵济世：每三回合触发团队治疗，照顾全队存活队员。',dps:'神兵追击：每三回合额外攻击一次，会心时吸血。'}[E.getRole(h)])+'</div>'+steps+'<p class="tiny muted">按任务顺序推进。完成的步骤与已投入的材料会保存在本地存档中。</p></div></section><aside class="stack"><section class="panel"><div class="panel-header"><h3>材料去向</h3></div><div class="panel-body"><p><strong>'+esc(recipe.bigIron)+'</strong> · 大铁<br><strong>'+esc(recipe.smallIron)+'</strong> · 小铁</p><p>对应产地：'+esc(info.sourceNames.join('、')||'对应年代秘境')+'</p>'+btn('前往历代秘境','nav','dungeons','primary small')+'<p class="tiny muted">掉率、保底和时间按放置游戏调整。各年代材料分开收集；新世代50级为端游等级压缩标识。</p></div></section><section class="panel"><div class="panel-header"><h3>铸造行囊</h3></div><div class="panel-body material-list">'+(materials.filter(x=>x.count>0).map(x=>'<div><span>'+esc(x.name)+'</span><b>'+x.count+'</b></div>').join('')||'<p class="muted">尚未收集玄晶与陨铁。</p>')+'</div></section></aside></div>';
    }
    function dungeonsView(){
      const s=state(),list=S.expansionDungeons(s);
      return '<div class="notice">每次入场依序击败全部首领才算通关。普通难度提供装备；挑战难度要求成套强化、承伤和治疗，且需先通关普通。未达到门槛时会列出缺项。</div>'+roleSummary()+btn('侠名兑换整备','nav','exchange','small')+btn('战后整队','formation','','small')+'<div class="expansion-dungeons">'+list.map(d=>{
        const exp=D.EXPANSIONS.find(x=>x.id===d.expansionId),modes=['normal','challenge'];
        const gallery=d.bosses.map((name,i)=>'<div class="dungeon-boss-tile">'+(root.JXBossArt?.sprite(name)||'')+'<small>'+(i+1)+'. '+esc(name)+'</small></div>').join('');
        return '<article class="panel dungeon-card"><div class="dungeon-art '+JXMapUI.sceneClass(d)+'" role="img" aria-label="'+esc(d.name)+'场景"></div><div class="panel-header"><div><span class="eyebrow">'+esc(exp.year)+' · '+esc(exp.name)+'</span><h3>'+esc(d.name)+'</h3></div><span class="pill">'+d.bosses.length+' 位首领</span></div><div class="panel-body"><div class="dungeon-boss-gallery">'+gallery+'</div><div class="dungeon-loot"><span>套装 · '+esc(d.setName)+'</span>'+(d.materialDrop===false?'<span>入门秘境</span>':'<span>大铁 · '+esc(d.bigIron)+'</span><span>小铁 · '+esc(d.smallIron)+'</span>')+'</div><p class="tiny muted">'+esc(d.requirement)+'</p><div class="dungeon-modes">'+modes.map(mode=>{
          const r=d.readiness?.[mode],record=d.record?.modes?.[mode],ready=d.unlocked&&r?.ready&&!s.battle,label=mode==='challenge'?'挑战':'普通';
          return '<section class="dungeon-mode"><div class="between"><strong>'+label+'难度</strong><small>通关 '+(record?.wins||0)+' 次 · 最深 '+(record?.best||0)+'/'+d.bosses.length+'</small></div>'+(d.unlocked?r?.unmet?.length?'<ul>'+r.unmet.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul>':'<p>整备达标，可进行完整首领挑战。</p>':'<p>完成前置历程后开放。</p>')+'<button class="btn small '+(mode==='challenge'?'primary':'')+'" data-action="expedition" data-id="'+d.id+'|'+mode+'" '+(!ready?'disabled':'')+'>'+(s.battle?'请先战后整队':ready?'进入'+label:label+' · 尚未达标')+'</button></section>';
        }).join('')+'</div><p class="tiny muted">'+esc(d.lootNote)+'<br>'+esc(d.bossListScope)+'</p>'+sourceLinks(d.sourceUrls)+'</div></article>';
      }).join('')+'</div>';
    }
    function sourceLinks(urls){return urls?.length?'<div class="source-links">'+urls.map((url,i)=>'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">资料来源 '+(i+1)+' ↗</a>').join('')+'</div>':'';}
    function routeInfo(route){const exp=D.EXPANSIONS?.find(x=>x.id===route.expansionId);return exp?'<div class="era-note"><strong>'+exp.year+' · '+esc(exp.name)+'</strong><span>原作等级时代 '+esc(exp.levelCap||exp.era)+' · '+JXMapUI.routeLabel(route)+'</span><p>历年资料片代表性地图选编，玩法等级与掉落节奏经放置适配。</p>'+sourceLinks(route.sourceUrls||exp.sourceUrls)+'</div>':'';}
    function worldSummary(){return '<div class="notice">当前内容：'+D.SECTS.filter(x=>x.kind!=='school').length+' 门派 + 无相楼流派 · '+D.HEROES.length+' 位可养成侠客 · '+D.EXPANSIONS.length+' 个年度资料片章节 · '+D.ROUTES.length+' 张探索地图 · '+D.DUNGEONS.length+' 个秘境。兵器破招与端游伤害属性分开记录。历年内容采用代表地图与首领，不是原游戏全部地图的逐项复刻。</div>';}
    function action(action,id){const s=state(),h=selected();
      if(action==='eq-select'){ui.equipmentHero=id;ui.equipmentResult=null;return null;}
      if(action==='eq-stone'){ui.stoneLevel=Number(id);return null;}
      if(action==='forge-select'){ui.forgeRecipe=id;return null;}
      if(action.startsWith('eq-auto-')){
        const commands={equip:['autoEquip','一键穿戴'],enhance:['autoEnhance','一键强化'],refine:['autoRefine','一键精炼'],socket:['autoSocket','一键镶嵌']};
        const command=commands[action.slice(8)];
        if(!command)return null;
        const r=Q[command[0]](s,h.uid);ui.equipmentResult={...r,uid:h.uid,label:command[1]};quickCache.key=null;return r;
      }
      if(action==='eq-current'){const r=Q.equipChapter(s,h.uid);ui.equipmentResult={...r,uid:h.uid,label:'换穿本章装备'};quickCache.key=null;return r;}
      if(action==='eq-equip')return Q.equip(s,h.uid,id);
      if(action==='eq-unequip')return Q.unequip(s,h.uid,id);
      if(action==='eq-refine')return Q.refine(s,h.uid,id);
      if(action==='eq-socket')return Q.socket(s,h.uid,id,Number(ui.stoneLevel)||1);
      if(action==='eq-color')return Q.inlayColor(s,h.uid,id);
      if(action==='eq-fuse')return Q.fuseStone(s,Number(id));
      if(action==='eq-salvage')return Q.salvage(s,id);
      if(action==='forge-step'){const r=Q.forgeStep(s,h.uid,id);if(r.log)c.report('神兵试炼',r);return r;}
      if(action==='expedition'){const [dungeonId,difficulty='normal']=id.split('|');const r=S.challengeExpansionDungeon(s,dungeonId,Math.random,difficulty);if(r.ok)c.report(D.DUNGEONS.find(x=>x.id===dungeonId)?.name||'秘境战报',r);return r;}
      return null;
    }
    return {roleSummary,heroControls,equipmentView,forgeView,dungeonsView,routeInfo,worldSummary,action};
  }
  root.JXExpansionUI={create};
})(globalThis);
