(function(root){
  'use strict';
  const D=root.JXData,E=root.JXEngine;
  const sceneClass=route=>route?.sceneId?'scene-'+route.sceneId:'';
  const routeLabel=route=>(route.main===false?'支线':'主线')+' · '+(route.kind==='dungeon'?'秘境':'野外');
  function create(c){
    const {ui,esc,btn,icon,portrait,meta}=c;
    const state=()=>c.getState();
    const unlocked=r=>E.routeUnlocked(state(),r);
    function render(){
      const s=state(),kind=ui.mapKind||'all';
      const regions=D.EXPANSIONS.map(e=>e.name);
      const selected=D.ROUTES.filter(r=>(ui.region==='all'||r.region===ui.region)&&(kind==='all'||kind==='main'&&r.main!==false||kind==='field'&&r.kind==='field'||kind==='dungeon'&&r.kind==='dungeon'||kind==='unlocked'&&unlocked(r)));
      const list=selected.slice().sort((a,b)=>D.EXPANSIONS.findIndex(e=>e.id===a.expansionId)-D.EXPANSIONS.findIndex(e=>e.id===b.expansionId)||Number(a.main===false)-Number(b.main===false)||D.ROUTES.indexOf(a)-D.ROUTES.indexOf(b));
      const route=list.find(r=>r.id===ui.mapSelection)||list.find(r=>r.id===s.routeId)||list[0];
      const filters='<div class="map-filter-bar" role="group" aria-label="地图类型">'+[['all','全部地图'],['main','资料片主线'],['field','野外'],['dungeon','秘境'],['unlocked','已解锁']].map(([id,name])=>'<button class="btn small '+(kind===id?'primary':'')+'" data-action="map-kind" data-id="'+id+'" aria-pressed="'+(kind===id)+'">'+name+'</button>').join('')+'<span>'+list.length+' 处地点 · 主线信物 '+E.mainBadgeCount(s)+' / '+D.ROUTES.filter(r=>r.main!==false).length+'</span></div>';
      const tabs='<div class="tabs map-era-tabs">'+['all',...regions].map(r=>'<button class="tab '+(ui.region===r?'active':'')+'" data-action="region" data-id="'+esc(r)+'">'+(r==='all'?'天下江湖':esc(r))+'</button>').join('')+'</div>';
      const routes='<div class="route-list" aria-label="探索地点">'+(list.map(r=>'<button class="route-option '+(route.id===r.id?'active ':'')+(!unlocked(r)?'locked':'')+'" data-action="select-route" data-id="'+r.id+'"><span class="route-thumb '+sceneClass(r)+'" aria-hidden="true"></span><div><strong>'+esc(r.name)+'</strong><small>'+routeLabel(r)+' · Lv.'+r.level+'</small><small>'+(s.badges.includes(r.id)?'◆ 已通关':unlocked(r)?'◇ 已解锁':esc(E.routeRequirement(s,r)))+'</small></div>'+icon(unlocked(r)?'chevron':'lock')+'</button>').join('')||'<div class="empty-note">这个筛选下尚无地点。可切换资料片或地图类型。</div>')+'</div>';
      return filters+tabs+(route?'<div class="map-layout">'+routes+detail(route)+'</div>':routes)+loopPanel();
    }
    function detail(route){
      const s=state(),canTravel=unlocked(route),exp=D.EXPANSIONS.find(e=>e.id===route.expansionId),returnRoute=D.ROUTES.find(r=>r.id===route.returnRouteId);
      const dungeon=D.DUNGEONS.find(d=>d.id===route.dungeonId);
      const progression=route.main===false?'支线通关后，自动推进开启时返回'+(returnRoute?.name||'所属主线')+'；可设置循环反复探索。':'首次通关获得主线信物，自动推进开启时前往下一条主线。';
      return '<section class="panel route-detail"><div class="route-art '+sceneClass(route)+'"><span class="level-tag">'+routeLabel(route)+'</span><h3>'+esc(route.name)+'</h3></div><div class="panel-body"><div class="route-detail-heading"><span class="eyebrow">'+(exp?.year||'')+' · '+esc(exp?.name||route.region)+'</span><span class="pill">推荐 Lv.'+route.level+'</span></div><p>'+esc(route.subtitle)+'<br>'+esc(route.desc)+'</p><div class="route-meta"><span>'+route.steps+' 段路程</span><span>通关 '+(s.clears[route.id]||0)+' 次</span><span>'+esc(route.kind==='dungeon'?'秘境挑战':'野外探索')+'</span></div><h3>此地侠影</h3><div class="encounters">'+route.heroes.map(id=>'<button class="encounter" title="'+esc(meta(id).name)+'" data-action="dexhero" data-id="'+id+'">'+portrait(meta(id))+'</button>').join('')+'</div><div class="notice map-rewards">守关首领：'+esc(route.boss)+'<br>基础收益：银两 +'+route.rewards.silver+' · 修为 +'+route.rewards.exp+(dungeon?'<br>套装：'+esc(dungeon.setName)+(dungeon.materialDrop!==false?' · '+esc(dungeon.smallIron)+' / '+esc(dungeon.bigIron):' · 不产出玄晶与陨铁'):'')+'<br>'+esc(progression)+'</div><button class="btn primary wide" data-action="travel" data-id="'+route.id+'" '+(!canTravel?'disabled':'')+'>'+(canTravel?(s.routeId===route.id?'继续当前历练':'前往'+esc(route.name)):esc(E.routeRequirement(s,route)))+' '+icon('arrow')+'</button>'+c.routeInfo(route)+'</div></section>';
    }
    function loopPanel(){
      const s=state();
      return '<section class="loop-control"><div class="between"><h3>'+icon('map')+' 多路线循环历练</h3>'+btn(s.autoAdvance?'自动推进：已开启':'自动推进：已关闭','auto-advance','','small')+'</div><p class="panel-note">勾选的循环路线优先执行；取消全部后，主线按资料片推进，支线完成后返回所属野外。</p><div class="loop-options">'+D.ROUTES.filter(unlocked).map(r=>'<label><input type="checkbox" data-change="route-loop" value="'+r.id+'" '+((s.routeLoop||[]).includes(r.id)?'checked':'')+'>'+esc(r.name)+'</label>').join('')+'</div><span class="routeLoop-tag">'+((s.routeLoop||[]).length?'循环 '+s.routeLoop.map(id=>D.ROUTES.find(r=>r.id===id)?.name).join(' → '):(s.autoAdvance?'按资料片主线自动推进':'当前路线循环'))+'</span></section>';
    }
    return {render};
  }
  root.JXMapUI={create,sceneClass,routeLabel};
})(globalThis);
