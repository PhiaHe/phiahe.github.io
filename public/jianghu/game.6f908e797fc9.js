/* Input acknowledgement survives app renders. Only real results show success. */
(function(root){
  'use strict';
  const controls='button,[role="button"],input[type="button"],input[type="submit"],summary,a[href]';
  const reduced=root.matchMedia('(prefers-reduced-motion: reduce)');
  const recent=new Map(),activePointers=new Map();
  let layer=null,last=null,sequence=0;
  const motion=()=>!reduced.matches&&!document.body?.classList.contains('no-motion')&&document.documentElement.dataset.guiMotion!=='off';
  function control(target){
    const el=target?.closest?.(controls);
    if(!el||el.matches(':disabled,[disabled],[aria-disabled="true"]')||el.closest('[inert],fieldset:disabled'))return null;
    const box=el.getBoundingClientRect();return box.width&&box.height?el:null;
  }
  function overlay(){
    if(!layer){layer=document.createElement('div');layer.id='interaction-feedback-layer';layer.setAttribute('aria-hidden','true');layer.setAttribute('popover','manual');}
    const host=document.fullscreenElement||document.body;if(layer.parentElement!==host)host.append(layer);
    // A manual noninteractive popover paints above native modal dialogs.
    try{if(layer.matches(':popover-open'))layer.hidePopover();layer.showPopover();}catch{}
    return layer;
  }
  function removeReceipt(record){clearTimeout(record.timer);record.node?.remove();record.node=null;}
  function receipt(record,kind){
    removeReceipt(record);
    const box=record.box,pane=document.createElement('span'),icon=document.createElement('i');
    pane.className='interaction-receipt '+kind+(motion()?'':' is-still');pane.dataset.sequence=String(record.sequence);pane.dataset.kind=kind;
    const width=Math.min(box.width,420),height=Math.min(box.height,160);
    pane.style.cssText='left:'+Math.max(2,Math.min(innerWidth-width-2,box.left+(box.width-width)/2))+'px;top:'+Math.max(2,Math.min(innerHeight-height-2,box.top+(box.height-height)/2))+'px;width:'+width+'px;height:'+height+'px';
    icon.className='interaction-receipt-icon';icon.textContent=kind==='success'?'✓':kind==='failure'?'!':kind==='pending'?'…':'·';pane.append(icon);
    overlay().append(pane);record.node=pane;
    while(layer.childElementCount>6)layer.firstElementChild.remove();
    if(kind!=='pending')record.timer=setTimeout(()=>removeReceipt(record),kind==='triggered'?500:850);
    return pane;
  }
  function capture(event){
    const el=control(event.target);if(!el)return;
    const action=el.dataset.action||el.getAttribute('name')||el.tagName.toLowerCase();
    const record={action,id:el.dataset.id||'',target:el,box:el.getBoundingClientRect(),at:performance.now(),sequence:++sequence};
    last=record;recent.set(action,record);receipt(record,'triggered');
    if(event.detail===0)setTimeout(()=>{
      if(el.isConnected||document.activeElement!==document.body)return;
      [...document.querySelectorAll(controls)].find(next=>next.dataset.action===action&&(next.dataset.id||'')===record.id)?.focus({preventScroll:true});
    },0);
    for(const [key,value]of recent)if(performance.now()-value.at>30000){removeReceipt(value);recent.delete(key);}
  }
  function release(pointerId){const el=activePointers.get(pointerId);el?.classList.remove('interaction-pressed');activePointers.delete(pointerId);}
  document.addEventListener('pointerdown',event=>{if(event.button!==0)return;const el=control(event.target);if(el){activePointers.set(event.pointerId,el);el.classList.add('interaction-pressed');}},{capture:true,passive:true});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])document.addEventListener(type,event=>release(event.pointerId),{capture:true,passive:true});
  root.addEventListener('blur',()=>{for(const id of activePointers.keys())release(id);});
  document.addEventListener('click',capture,true);
  function result(action,value){
    if(typeof value?.ok!=='boolean')return false;
    const record=recent.get(action)||(last?.action===action?last:null);
    if(!record||performance.now()-record.at>30000)return false;
    if(record.completed)return false;
    record.completed=true;receipt(record,value.ok?'success':'failure');return true;
  }
  function pending(action,enabled){
    const record=recent.get(action);if(!record||record.completed)return false;
    if(enabled)receipt(record,'pending');else if(record.node?.dataset.kind==='pending')removeReceipt(record);
    return true;
  }
  root.JXInteractionFeedback=Object.freeze({result,pending});
})(globalThis);

;
(function(root){
  'use strict';
  const KEY='jx3-appearance-v1', themes=['system','dark','light','jade'];
  const media=root.matchMedia('(prefers-color-scheme: dark)'), reduced=root.matchMedia('(prefers-reduced-motion: reduce)');
  let prefs={theme:'system',ambient:true};
  try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved){if(themes.includes(saved.theme))prefs.theme=saved.theme;if(typeof saved.ambient==='boolean')prefs.ambient=saved.ambient;}}catch{}
  function apply(){document.documentElement.dataset.theme=prefs.theme==='system'?(media.matches?'dark':'light'):prefs.theme;document.documentElement.dataset.themePreference=prefs.theme;document.documentElement.classList.toggle('ambient-off',!prefs.ambient||reduced.matches);}
  function set(key,value){if(key==='theme'&&themes.includes(value))prefs.theme=value;if(key==='ambient')prefs.ambient=!!value;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch{}apply();sync();}
  function controls(){return '<div class="appearance-controls"><label>界面底色 <select class="select" data-appearance="theme" aria-label="界面底色">'+[['system','自动 · 跟随系统'],['dark','深色 · 星夜'],['light','浅色 · 宣纸'],['jade','青碧 · 山色']].map(([id,label])=>'<option value="'+id+'" '+(prefs.theme===id?'selected':'')+'>'+label+'</option>').join('')+'</select></label><label class="ambient-switch"><input type="checkbox" data-appearance="ambient" '+(prefs.ambient?'checked':'')+'> 侠影动态背景</label></div>';}
  function cast(){const ids=['tangmen_1','qixiu_1','cangyun_1','chunyang_1','wanling_1','mingjiao_1','changge_1','tiance_1'];const visible=document.body.classList.contains('at-entry')?ids.slice(0,6):ids;return '<div class="ambient-cast" aria-hidden="true">'+visible.map((id,i)=>'<div class="ambient-traveler traveler-'+i+'"><span class="art-'+id+'"></span></div>').join('')+'</div>';}
  function sync(){document.querySelectorAll('[data-appearance="theme"]').forEach(el=>el.value=prefs.theme);document.querySelectorAll('[data-appearance="ambient"]').forEach(el=>el.checked=prefs.ambient);}
  document.addEventListener('change',event=>{const key=event.target.dataset.appearance;if(key)set(key,key==='ambient'?event.target.checked:event.target.value);});
  media.addEventListener('change',apply);reduced.addEventListener('change',apply);apply();
  root.JXAppearance={controls,cast,settings:()=>({...prefs}),set};
})(globalThis);

;
/* Raster artwork stays independent of saves and gameplay. */
(function(root){
  'use strict';
  const slots={head:0,chest:1,waist:2,wrist:3,legs:4,feet:5,necklace:6,pendant:7,ring1:8,ring2:9,ranged:10,weapon:11};
  const weapons={chunyang:11,tiance:12,wanhua:13,qixiu:14,cangjian:15,shaolin:16,wudu:17,tangmen:18,mingjiao:19,gaibang:20,cangyun:21,changge:22,badao:23,penglai:24,lingxue:25,yantian:26,yaozong:27,beitianyaozong:27,daozong:28,wanling:29,duanshi:30,wuxiang:-1};
  const items={medicine:31,exp:32,invite:32,tea:33,ore:34,herb:35};
  const functions={map:0,people:1,book:2,coin:3,silver:3,jade:4,stones:4,colors:4,crystal:4,badge:5,renown:5,bag:6,supplies:6,hammer:7,tower:8,mountain:9,heart:10,pet:11,star:12,gear:13,sound:14,save:15,sun:16,flag:17,camp:18,trophy:19,gift:20,clock:21,check:22,lock:23};
  const controls={arrow:0,chevron:0,right:0,back:1,left:1,up:2,down:3,plus:4,close:5,play:6,pause:7,expand:8,collapse:9,menu:10,download:11,upload:12,help:13,locate:14,shield:15,armor:16,moon:17,lightning:18,mute:19,leaf:20,wuxiang:21,swords:22,crystal:23,colors:23};
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function atlas(index,kind='items',extra=''){
    const rows=kind==='items'?6:4,x=index%6,y=Math.floor(index/6);
    return '<span class="pixel-art pixel-'+kind+' '+esc(extra)+'" style="--pixel-x:'+(x*20)+'%;--pixel-y:'+(y*100/(rows-1))+'%" aria-hidden="true"></span>';
  }
  function item(id){return id in items?atlas(items[id]):id in controls?atlas(controls[id],'controls'):atlas(functions[id]??6,'functions');}
  function slot(id,rarity='epic'){return atlas(slots[id]??1,'items','quality-'+rarity);}
  function gear(value){return value?.slot==='weapon'&&value.sect==='wuxiang'?atlas(21,'controls'):value?.slot==='weapon'&&value.sect in weapons?atlas(weapons[value.sect],'items','quality-'+(value.rarity||'rare')):slot(value?.slot,value?.rarity);}
  function icon(name,line=''){
    const raster=name==='sword'?atlas(11):name==='flask'?item('medicine'):name==='scroll'?item('invite'):name==='tea'?item('tea'):name==='herb'?item('herb'):name==='ore'?item('ore'):name==='exp'?item('exp'):name in controls?atlas(controls[name],'controls'):atlas(functions[name]??12,'functions');
    return '<span class="pixel-icon-pair icon" aria-hidden="true">'+raster+'</span>';
  }
  function apply(){document.documentElement.dataset.iconStyle='pixel';}
  apply();root.JXPixelIcons={item,slot,gear,icon,set:apply,style:()=> 'pixel',slots,weapons};
})(globalThis);

;
(function (root) {
  'use strict';
  const SECTS = [
    {id:'chunyang',name:'纯阳',color:'#6596bc',role:'dps',weapon:'长剑',skill:'两仪化形',desc:'华山道门，运内力与太极气场，以剑气贯通攻守。修心问道，亦入世济人。',portrait:0},
    {id:'tiance',name:'天策',color:'#c5664e',role:'tank',weapon:'长枪',skill:'龙牙',desc:'洛阳军府，以长枪、战阵与马上技击守护山河。护持同伴，挺身承敌。',portrait:1},
    {id:'wanhua',name:'万花',color:'#a089bf',role:'healer',weapon:'判官笔',skill:'春泥护花',desc:'秦岭青岩，医文武兼修。以医术救人，以点穴截脉制敌，笔下亦有山河。',portrait:2},
    {id:'qixiu',name:'七秀',color:'#d990b0',role:'healer',weapon:'双剑',skill:'翔鸾舞柳',desc:'瘦西湖畔，剑舞传承。双剑连势削弱来敌，以舞剑协力援助同伴。',portrait:3},
    {id:'cangjian',name:'藏剑',color:'#cead58',role:'dps',weapon:'轻重双剑',skill:'风来吴山',desc:'西子湖畔铸剑传名，轻重二剑转换心法，名剑大会广会天下同道。',portrait:4},
    {id:'shaolin',name:'少林',color:'#b98855',role:'tank',weapon:'长棍',skill:'韦陀献杵',desc:'少室山佛门，禅武相通。招式稳健、气劲护体，以承伤与反击护持同行者。',portrait:5}
  ];
  const extraSects = [
    ['wudu','五毒','#8d81c7','healer','虫笛','奇兵','毒性','补天诀','苗疆五仙教，以蛊术、毒术和补天医术护持族人与同道。',['healer','dps']],
    ['tangmen','唐门','#6d9a98','dps','千机匣','奇兵','外功','惊羽诀','蜀中唐家堡，以机关、暗器与机巧之术闻名江湖。',['dps']],
    ['mingjiao','明教','#db9a62','tank','双刀','短兵','阴阳','明尊琉璃体','圣火西来，双刀兼修日月之力，亦以明尊之法护佑同伴。',['tank','dps']],
    ['gaibang','丐帮','#b5a267','dps','短棒与拳掌','拳脚','外功','笑尘诀','洞庭君山，以忠义为本，降龙掌与打狗棒法行走江湖。',['dps']],
    ['cangyun','苍云','#8d939c','tank','盾刀','长兵','外功','铁骨衣','雁门玄甲，刀盾并用，以铁骨守护同袍。',['tank','dps']],
    ['changge','长歌','#71a88c','healer','古琴','奇兵','混元','相知','千岛湖畔文人剑客，以琴音寄侠心，莫问杀敌、相知济人。',['healer','dps']],
    ['badao','霸刀','#b498bd','dps','双刀一鞘','长兵','外功','北傲诀','河朔柳家，秀明尘身、松烟竹雾、雪絮金屏三势御刀。',['dps']],
    ['penglai','蓬莱','#7dc8cc','dps','伞','奇兵','外功','凌海诀','东海仙岛，以伞御风，乘雕凌空。',['dps']],
    ['lingxue','凌雪阁','#c57880','dps','链刃','长兵','外功','隐龙诀','太白山中潜锋藏锐，以链刃与隐秘行动守护李唐。',['dps']],
    ['yantian','衍天宗','#a995d4','dps','魂灯','奇兵','混元','太玄经','昆仑方士观星卜算，以魂灯、符咒和卦象演化天机。',['dps']],
    ['yaozong','北天药宗','#8cbf99','healer','百草卷','奇兵','毒性','灵素','以本草医理济世，百草卷藏药、针与柳叶刀，无方制物，灵素疗伤。',['healer','dps']],
    ['daozong','刀宗','#6fb4c3','dps','唐横刀','短兵','外功','孤锋诀','东海翁洲，谢云流所创，以孤锋破浪、决意出刀。',['dps']],
    ['wanling','万灵山庄','#b6b681','dps','弓','奇兵','外功','山海心诀','山海有灵，以箭术和百兽协同守护生灵，乘黄为伴。',['dps']],
    ['duanshi','段氏','#a9b8cc','dps','折扇与指法','气劲','内功','周天功','苍山洱海世家，以一阳指与折扇引动周天内力。',['dps']],
    ['wuxiang','无相楼','#cb8da2','dps','牵丝轮','驭驶','阴性','幽罗引','永宁湾江湖流派，以牵丝轮控伶影，将戏曲身段融于武学。',['dps']]
  ];
  for (const row of extraSects) {
    const [id,name,color,role,weapon,weaponType,damageType,skill,desc,roles] = row;
    SECTS.push({id,name,color,role,weapon,weaponType,damageType,skill,desc,roles,portrait:SECTS.length});
  }
  const coreIdentities = [
    [['dps'],'气劲','混元'], [['tank','dps'],'长兵','外功'],
    [['healer','dps'],'奇兵','混元'], [['healer','dps'],'短兵','阴性'],
    [['dps'],'短兵','外功'], [['tank','dps'],'长兵','阳性']
  ];
  const factionPages=['纯阳宫','天策府','万花谷','七秀坊','藏剑山庄','少林寺','五仙教','唐门','明教','丐帮','苍云堡','长歌门','霸刀山庄','蓬莱','凌雪阁','衍天宗','北天药宗','刀宗','万灵山庄','段氏'];
  SECTS.forEach((sect,index) => {
    if (index < 6) [sect.roles,sect.weaponType,sect.damageType] = coreIdentities[index];
    sect.kind = sect.id === 'wuxiang' ? 'school' : 'sect';
    sect.weaponTypeAdapted=index>=6||sect.id==='cangjian';
    sect.sourceUrls = sect.id === 'wuxiang' ? ['https://jx3.xoyo.com/show-2458-6825-1.html'] : ['https://wiki.biligame.com/jx3/'+factionPages[index]];
  });
  const rosters = [
    ['纯阳弟子','纯阳精英弟子','纯阳执事弟子','祁进','于睿','李忘生'],
    ['天策弟子','天策精英弟子','天策执事弟子','曹雪阳','杨宁','李承恩'],
    ['万花弟子','万花精英弟子','万花执事弟子','谷之岚','裴元','东方宇轩'],
    ['七秀弟子','七秀精英弟子','七秀执事弟子','萧白胭','小七','叶芷青'],
    ['藏剑弟子','藏剑精英弟子','藏剑执事弟子','叶炜','叶凡','叶英'],
    ['少林弟子','少林精英弟子','少林执事弟子','玄悲','玄正','渡会']
  ];
  const RETIRED_HERO_IDS=SECTS.slice(0,6).flatMap(sect=>[sect.id+'_2',sect.id+'_3']);
  const titles = ['初出茅庐','江湖同道','山河知己','名动一方','侠名远扬','一代宗师'];
  const HEROES = SECTS.flatMap((sect, si) => (rosters[si] || [sect.name+'弟子']).map((name, index) => ({
    id:sect.id+'_'+(index+1), name, sect:sect.id, rarity:[1,1,2,3,3,4][index],
    title:titles[index], role:sect.role, roles:[...sect.roles], skill:sect.skill, portrait:si,
    weapon:sect.weapon, weaponType:sect.weaponType, damageType:sect.damageType,
    weaponTypeAdapted:sect.weaponTypeAdapted,sourceUrls:[...sect.sourceUrls],
    artId:index >= 3 ? sect.id+'_'+(index+1) : null,
    desc:sect.desc,
    baseHp: ([168,212,164,170,190,228][si] || (sect.role==='tank'?212:sect.role==='healer'?170:182))+index*8,
    baseAtk:([30,25,25,27,32,24][si] || (sect.role==='dps'?30:26))+index*2,
    baseDef:([10,17,10,11,13,18][si] || (sect.role==='tank'?17:11))+Math.floor(index/2)
  })));
  const knownProfiles={
    '祁进':'纯阳剑客，长剑出手凌厉，以精妙剑术近身制敌。',
    '于睿':'纯阳道门高手，以拂尘引动气劲，善于调息疗伤、援护同道。',
    '李忘生':'纯阳掌门，承华山道门传承。以浑厚内力驾驭剑气，太极气场攻守相济。',
    '曹雪阳':'天策将领，统理军府情报。擅长骑射，以长弓与战马纵横战阵。',
    '杨宁':'天策壮武将军，有“天枪”之名。枪法刚劲勇烈，执长枪冲锋破阵。',
    '李承恩':'天策统领，封英国公。身负护国之责，以长枪守护同袍，统领军府迎敌。',
    '谷之岚':'万花医者，擅用银针与医术。针可疗伤救人，亦可截脉制敌。',
    '裴元':'万花门下医术高手，手持判官笔，以医术济人，亦能御使魂体协助作战。',
    '东方宇轩':'万花谷主，于秦岭青岩汇聚医文武之学。兼擅琴音与混元武学，胸有丘壑。',
    '萧白胭':'七秀坊高手，擅使双剑，以剑舞身法衔接凌厉剑招。',
    '小七':'七秀坊剑客，双剑轻灵迅疾，招式如穿花飞蝶，连绵不绝。',
    '叶芷青':'七秀掌门，传承瘦西湖畔剑舞。以双剑引动气劲，剑舞之间兼顾制敌与援护。',
    '叶炜':'藏剑山庄剑客，剑术精湛，轻重双剑长短兼备，攻势变化自如。',
    '叶凡':'藏剑山庄剑客，以长剑迎敌，剑招敏捷，善于近身追击。',
    '叶英':'藏剑第二代庄主，潜心修习心剑。以深厚剑意驾驭气劲，剑境超然。',
    '玄悲':'少林高僧，于天子峰磨砺禅武。擅使长棍，以稳健棍法迎敌护身。',
    '玄正':'少林掌门，修禅亦习武。以拳掌施展佛门武学，招式沉稳，内劲深厚。',
    '渡会':'少林高僧，精修金刚之法。战时化现金刚形态，以强健体魄护持同伴。'
  };
  for(const hero of HEROES) if(knownProfiles[hero.name]) hero.desc=knownProfiles[hero.name];
  // Role and weapon identities follow the person, rather than inheriting one role for an entire sect.
  const namedIdentities = {
    '祁进':['dps','短兵','长剑','外功','无我无剑'],
    '于睿':['healer','气劲','拂尘','混元','清音诀'],
    '李忘生':['dps','气劲','道剑','混元','两仪化形'],
    '曹雪阳':['dps','驭驶','长弓与战马','外功','穿云'],
    '杨宁':['dps','长兵','天枪','外功','傲血战意'],
    '李承恩':['tank','长兵','长枪','外功','铁牢律'],
    '谷之岚':['healer','气劲','银针','混元','清心静气'],
    '裴元':['healer','驭驶','判官笔与魂体','混元','生死判'],
    '东方宇轩':['dps','奇兵','古琴','混元','碧海潮生'],
    '萧白胭':['dps','短兵','双剑','阴性','剑舞'],
    '小七':['dps','双兵','双剑','外功','蝶恋花'],
    '叶芷青':['healer','气劲','双剑','阴性','心鼓弦'],
    '叶炜':['dps','短兵','轻重双剑','外功','寂剑'],
    '叶凡':['dps','短兵','长剑','外功','心剑'],
    '叶英':['dps','气劲','心剑','混元','无相剑境'],
    '玄悲':['tank','长兵','长棍','阳性','金刚护体'],
    '玄正':['dps','拳脚','拳掌','阳性','佛光普照'],
    '渡会':['tank','驭驶','金刚形态','阳性','金刚拱背']
  };
  for (const hero of HEROES) {
    const identity=namedIdentities[hero.name];
    if (!identity) continue;
    [hero.role,hero.weaponType,hero.weapon,hero.damageType,hero.skill]=identity;
    hero.roles=hero.name==='叶芷青'?['healer','dps']:[hero.role];
    hero.weaponTypeAdapted=['萧白胭','玄悲','叶炜'].includes(hero.name);
    hero.sourceUrls=['https://jx3.qq.com/pc201903/js/deparment.js'];
    if (hero.name==='谷之岚'||hero.name==='小七') hero.sourceUrls.push('https://www.taptap.cn/moment/20458719271718739');
  }
  // Keep the established rotation stable when new story companions join the roster.
  const historicalHeroes=[...HEROES];
  const cangshengStorySource='https://news.17173.com/content/09282026/170434199.shtml';
  const storyCompanions=[
    {id:'cangyun_yan_yimei',name:'燕忆眉',sect:'cangyun',rarity:3,title:'潋滟刀',role:'dps',roles:['dps'],weapon:'盾刀',skill:'分山劲',baseHp:236,baseAtk:34,baseDef:18,
      desc:'苍云女卫营统领，刀法凌厉，以玄甲与兵刃守护同袍。雁门烽火之后，仍以不屈侠心护持百姓。',sourceUrls:['https://wiki.biligame.com/jx3/燕忆眉']},
    {id:'cangyun_zhangsun_wangqing',name:'长孙忘情',sect:'cangyun',rarity:4,title:'血手凤凰',role:'tank',roles:['tank','dps'],weapon:'轻眉刀与盾',skill:'铁骨衣',baseHp:252,baseAtk:34,baseDef:20,
      desc:'苍云统帅，亦名燕忘情。天罗面下铭记军中血誓，以轻眉刀与坚定意志率同袍守护山河。',sourceUrls:['https://wiki.biligame.com/jx3/长孙忘情']},
    {id:'tangmen_tang_wuying',name:'唐无影',sect:'tangmen',rarity:4,title:'唐门少主',role:'dps',roles:['dps'],weapon:'千机匣',skill:'惊羽诀',baseHp:222,baseAtk:40,baseDef:13,
      desc:'唐门少主，才智过人、处事沉稳。身处家族风波与机关暗局之间，以机巧和担当维系同门。',sourceUrls:['https://wiki.biligame.com/jx3/唐无影','https://wiki.biligame.com/jx3/暗线寻踪']},
    {id:'tangmen_tang_maoer',name:'唐猫儿',sect:'tangmen',rarity:3,title:'蜀中隐锋',role:'dps',roles:['dps'],weapon:'千机匣',skill:'天罗诡道',baseHp:214,baseAtk:38,baseDef:13,
      desc:'唐门高手，行事机敏，精于暗器。山城暗潮之中，以熟悉蜀地江湖的经验协助同道探察危局。',sourceUrls:['https://jx3.17173.com/moregame123/10hztmjq_2.shtml',cangshengStorySource]}
  ];
  for(const companion of storyCompanions){
    const sect=SECTS.find(s=>s.id===companion.sect);
    HEROES.push({...companion,portrait:sect.portrait,artId:companion.id,weaponType:sect.weaponType,damageType:sect.damageType,weaponTypeAdapted:true,debutExpansion:'cangsheng'});
  }
  const officialHistory='https://jx3.xoyo.com/zl/records.html';
  const mapHistory='https://wiki.biligame.com/jx3/地图剧情';
  // Each year is a compact playable chapter. This is a curated route, not an exhaustive map catalogue.
  const expansionRows = [
    ['fengqi','风起稻香',2009,70,['稻香村','洛阳','长安','扬州'],'战宝迦兰',['王海银','朱癸','平等','掌火','智慧与镇恶','风火云三使'],'初入江湖','village','https://jx3.xoyo.com/zt/2010/02/26/zbao-2.shtml'],
    ['cangjian2010','藏剑山庄',2010,70,['藏剑山庄'],'宫中神武遗迹',['谢云流'],'剑茗','valley','https://jx3.xoyo.com/zt/2010/07/06/mj/gzsw.shtml'],
    ['bashu','巴蜀风云',2011,80,['成都','白龙口','无量山','融天岭','黑龙沼'],'荻花圣殿',['牡丹','塔洛马蒂与姬无双','慕容追风','乌蒙贵的杰作','卫栖梧','阿萨辛','卓婉清','沙利亚'],'南皇','valley','https://jx3.xoyo.com/zt/2011/05/28/25yx-dihua.shtml'],
    ['riyue','日月明尊',2012,80,['苍山洱海','明教'],'南诏皇宫',['枯荣大师','段宗公、泰崇傣与阁罗鸿','萧沙','摩提耶罗','陈和尚、康雪烛、柳公子与阁罗凤','李倓'],'破军','night','https://wiki.biligame.com/jx3/南诏皇宫'],
    ['anshi','安史之乱',2013,90,['马嵬驿','长安·战乱','洛阳·战乱','枫华谷·战乱'],'大明宫',['何莘涯','耶律燕与独孤问俗','六道傀儡','剑圣','无名','伊玛目','安禄山'],'定国','city','https://wiki.biligame.com/jx3/大明宫'],
    ['cangxue','苍雪龙城',2014,90,['太原','苍云堡'],'太原之战·逐虎驱狼',['靺鞨三骑将','安雨','白陶','史思明'],'朔雪','snow','https://wiki.biligame.com/jx3/太原之战·逐虎驱狼'],
    ['jiandan','剑胆琴心',2015,95,['千岛湖','阴山大草原','五台山','黑戈壁'],'永王行宫·花月别院',['韩非池','莫雨','李白'],'儒风','valley','https://wiki.biligame.com/jx3/永王行宫·花月别院'],
    ['fenggu','风骨霸刀',2016,95,['洛阳城','霸刀山庄'],'上阳宫·双曜亭',['黑齿元佑','哥舒翰','安庆绪'],'雪河','city','https://wiki.biligame.com/jx3/上阳宫·双曜亭'],
    ['lingkong','日月凌空',2017,95,['霸刀山庄'],'风雷刀谷',['史朝英','柳愚','柳哲','柳时清','解语','伊玛目','柳秀岳','柳鸾旗'],'燕云','night','https://jx3.xoyo.com/zt/2017/03/31/operate/index.html'],
    ['penglai2018','世外蓬莱',2018,100,['龙泉府','侠客岛','经首道源岛','洞天福地岛'],'冰火岛·荒血路',['康疑','铂尔','罗纳真','没藏呼月与拓跋思羽','拿云'],'鹤梦','snow','https://wiki.biligame.com/jx3/冰火岛·荒血路'],
    ['lingxue2019','凌雪藏锋',2019,100,['蔷薇列岛','凌雪阁'],'敖龙岛',['铁黎','陈徽','藤原武裔','源思弦','驺吾','方有崖'],'晓天','valley','https://wiki.biligame.com/jx3/敖龙岛'],
    ['fengtian','奉天证道',2020,110,['少林·乱世','万花·乱世','七秀·乱世','藏剑·乱世'],'达摩洞',['余晖','宓桃','武雪散','猿飞','哑头陀','岳琳与岳琅'],'星演','night','https://wiki.biligame.com/jx3/达摩洞'],
    ['beitian','北天药宗',2021,110,['黑山林海','北天药宗'],'雷域大泽',['巨型尖吻凤','桑乔','悉达罗摩','尤珈罗摩','月泉淮','乌蒙贵'],'百相','valley','https://wiki.biligame.com/jx3/雷域大泽'],
    ['hengdao','横刀断浪',2022,120,['楚州','百溪','晟江','烂柯山'],'西津渡',['张景超与张法雷','刘展','苏凤楼','韩敬青','藤原佑野','李重茂'],'展锋','city','https://wiki.biligame.com/jx3/西津渡'],
    ['wanling2023','万灵当歌',2023,120,['银霜口','万灵山庄'],'九老洞',['魏华','钟不归','岑伤','鬼筹','麒麟','月泉淮'],'灵源','snow','https://wiki.biligame.com/jx3/十人九老洞'],
    ['silu','丝路风语',2024,130,['河西瀚漠','段氏'],'一之窟',['骆耀阳','韦柔丝','宋泉','伍靖远','苏什','芭德'],'西塞','valley','https://wiki.biligame.com/jx3/一之窟'],
    ['shanhai','山海源流',2025,130,['永宁湾','伊丽川'],'会战弓月城',['巴图仁钦','竭勒','图南子','叶葵','尹雪尘'],'牧川','valley','https://news.17173.com/content/09172025/145106601.shtml'],
    ['cangsheng','苍生铸世',2026,50,['过云岭','云州','渝州','陕州'],'洛阳之战',['突利和顺','田承嗣','伊曼·寂夜与伊曼·逐焰','阿史那承庆','史朝义'],'元元','city','https://jx3.xoyo.com/launcher/update/latest.html']
  ];
  const eraMaterials = {
    70:['飞仙玄晶','天外陨铁'],80:['化玉玄晶','乌金陨铁'],90:['沉沙玄晶','浮屠陨铁'],
    95:['醉月玄晶','星雷陨铁'],100:['归墟玄晶','蜃海陨铁'],110:['天乙玄晶','星络陨铁'],
    120:['太一玄晶','劫烬陨铁'],130:['昆玉玄晶','鸣沙陨铁'],50:['铸天玄晶','泽天陨铁']
  };
  const raidHistorySources={
    fengqi:[officialHistory],cangjian2010:[officialHistory],bashu:['https://jx3.xoyo.com/zt/2011/05/28/mj25-dhsd.shtml'],
    fenggu:['https://jx3.xoyo.com/show-2466-1294-1.html'],penglai2018:['https://jx3.xoyo.com/show-4422-472-1.html'],
    lingxue2019:['https://act.wegame.com.cn/jw3/jw320191115/index.html'],fengtian:['https://jx3tc.xoyobox.com/announce/gg.html?id=55'],
    beitian:['https://jx3.xoyo.com/show-2458-4727-1.html'],hengdao:['https://jx3.xoyo.com/show-2458-5437-1.html'],
    wanling2023:['https://jx3tc.xoyobox.com/show-101-429-1.html'],silu:['https://jx3tc.xoyobox.com/show-101-556-1.html'],
    shanhai:['https://jx3tc.xoyobox.com/announce/gg.html?id=412']
  };
  const EXPANSIONS = expansionRows.map(row => ({
    id:row[0],name:row[1],year:row[2],era:row[3],levelCap:row[3],fields:row[4],setName:row[7],
    sourceUrls:[row[9],...(raidHistorySources[row[0]]||[]),mapHistory,...(row[2]<=2015?[officialHistory]:[])],
    historyScope:'年度代表章节选编，并非历代所有资料片与团本的完整清单',
    period:indexPeriod(row[0],row[2]),
    desc:row[0]==='fengqi'?'2009开服至2010年初撼世禅劫；战宝迦兰于2010年2月8日开放。':'年度代表章节，选取当期资料片与代表团本；同年其他资料片未全部收录。'
  }));
  function indexPeriod(id,year){return id==='fengqi'?'2009—2010初':String(year);}
  const DUNGEONS = expansionRows.map((row,index) => ({
    id:row[0]+'_dungeon',expansionId:row[0],name:row[5],bosses:row[6],level:Math.min(100,6+index*5),
    needBadges:index*2+1,setName:row[7],bigIron:eraMaterials[row[3]][0],smallIron:eraMaterials[row[3]][1],
    era:row[3],materialDrop:index>0,setIsAdapted:index===0,
    sourceUrls:[row[9],...(raidHistorySources[row[0]]||[]),...(row[2]<=2015?[officialHistory]:[])],historicalKind:'raid',historicalPartySizes:[10,25],releaseYear:index===0?2010:row[2],
    releaseDate:index===0?'2010-02-08':index===1?'2010-07-08':null,
    historyNote:index===0?'首个团队秘境，2010年2月8日开放10人版，4月1日开放25人英雄版；归入本作开服阶段。':index===8?'本作合并锻刀厅与千雷殿两座团队秘境。':'当期代表团队秘境，非该年度所有团本。',
    bossListScope:'按资料核对首领顺序；同场双首领、群体与事件合为一关，机制适配本作战斗',setScope:index===0?'初入江湖为本作教学套，并非战宝原版雁虞／剑茗掉落表':'年度赛季代表套装；掉落在本作中合并',
    desc:'历史团队秘境；本作以十人会战改编，掉落与套装数值另行平衡。'
  }));
  const legacyRouteIds=['daoxiang','bamboo','ricehill','yangzhou','slenderlake','oldferry','huashan','luoyan','qingxu','wanhuavalley','changan','stargarden','jianlu','songshan','jianghuroad'];
  const ROUTES=EXPANSIONS.flatMap((expansion,chapter) => [0,1].map(part => {
    const index=chapter*2+part,dungeon=DUNGEONS[chapter],isDungeon=part===1;
    const pool=Array.from({length:6},(_,n)=>historicalHeroes[(index*3+n)%historicalHeroes.length].id);
    if(index===0) pool.splice(0,pool.length,'chunyang_2','tiance_1','wanhua_1','qixiu_1','shaolin_1','cangjian_1');
    return {
      id:legacyRouteIds[index]||expansion.id+(isDungeon?'_instance':'_field'),
      name:isDungeon?dungeon.name:expansion.fields[0],region:expansion.name,
      subtitle:expansion.year+' · '+(isDungeon?'秘境挑战':'野外历程'),
      expansionId:expansion.id,kind:isDungeon?'dungeon':'field',dungeonId:isDungeon?dungeon.id:null,
      main:true,chapter:chapter+1,mainOrder:index,setName:expansion.setName,
      level:Math.min(100,3+Math.round(index*2.5)),needBadges:index,scene:expansionRows[chapter][8],
      boss:isDungeon?dungeon.bosses[dungeon.bosses.length-1]:'历程守关人',heroes:pool,
      desc:isDungeon?dungeon.desc:expansion.fields.join('、')+'的代表历程，探索完成后前往本章秘境。野外守关为本作演练。',
      steps:index===0?8:10+Math.floor(index/6)*2,rewards:{silver:34+index*22,exp:16+index*9},
      sourceUrls:expansion.sourceUrls
    };
  }));
  const fieldScenes={
    '稻香村':'jiangnan','洛阳':'peaceful_city','长安':'peaceful_city','扬州':'peaceful_city','藏剑山庄':'palace_garden',
    '成都':'chengdu','白龙口':'bamboo','无量山':'maple_valley','融天岭':'maple_valley','黑龙沼':'miao_forest',
    '苍山洱海':'erhai','明教':'desert','马嵬驿':'war_city','长安·战乱':'war_city','洛阳·战乱':'war_city','枫华谷·战乱':'maple_valley',
    '太原':'snow_pass','苍云堡':'snow_pass','千岛湖':'lake_islands','阴山大草原':'grassland','五台山':'snow_mountain','黑戈壁':'desert',
    '洛阳城':'peaceful_city','霸刀山庄':'maple_valley','龙泉府':'snow_pass','侠客岛':'east_sea','经首道源岛':'east_sea','洞天福地岛':'east_sea',
    '蔷薇列岛':'east_sea','凌雪阁':'snow_mountain','少林·乱世':'maple_valley','万花·乱世':'bamboo','七秀·乱世':'palace_garden','藏剑·乱世':'palace_garden',
    '黑山林海':'miao_forest','北天药宗':'herbal_forest','楚州':'coastal_bay','百溪':'bamboo','晟江':'coastal_bay','烂柯山':'maple_valley',
    '银霜口':'snow_mountain','万灵山庄':'tree_village','河西瀚漠':'desert','段氏':'erhai','永宁湾':'coastal_bay','伊丽川':'grassland',
    '过云岭':'barren_ridge','云州':'cliff_temple','渝州':'mountain_city','陕州':'yellow_river'
  };
  const dungeonScenes=['temple_hall','palace_garden','flower_sanctum','nanzhao_palace','imperial_palace','military_fort','palace_garden','palace_garden','thunder_forge','ice_fire','east_sea','dharma_cave','thunder_swamp','river_dock','ancient_cave','ancient_cave','steppe_siege','military_fort'];
  for(const [index,dungeon] of DUNGEONS.entries()){
    const field=ROUTES[index*2],route=ROUTES[index*2+1];
    field.sceneId=fieldScenes[field.name];route.sceneId=dungeonScenes[index];
    field.desc='沿'+field.name+'展开本章历练，完成后继续主线秘境，也可在地图页探索本章其他地区。';
    dungeon.routeId=route.id;dungeon.sceneId=route.sceneId;dungeon.main=true;dungeon.chapter=index+1;
  }
  // Optional maps share a chapter but never contribute to the main-route unlock count.
  for(const [chapter,expansion] of EXPANSIONS.entries()){
    const parent=ROUTES[chapter*2];
    expansion.fields.slice(1).forEach((name,index)=>ROUTES.push({
      id:expansion.id+'_field_'+(index+2),name,region:expansion.name,subtitle:expansion.year+' · 野外支线',
      expansionId:expansion.id,kind:'field',dungeonId:null,main:false,chapter:chapter+1,returnRouteId:parent.id,unlockRouteId:parent.id,
      level:Math.min(100,parent.level+index+1),needBadges:parent.needBadges+1,scene:parent.scene,sceneId:fieldScenes[name],setName:expansion.setName,
      boss:'历程守关人',heroes:[...parent.heroes],desc:'在'+name+'沿道历练、结交侠客。通关后返回'+parent.name+'，也可加入路线循环反复探索。',
      steps:parent.steps+2,rewards:{silver:parent.rewards.silver+12,exp:parent.rewards.exp+6},sourceUrls:[mapHistory,...expansion.sourceUrls]
    }));
  }
  const classicDungeonSource='https://jx3.xoyo.com/zt/2010/05/25/mjcfrw.shtml';
  const historicBossSource='https://jx3.xoyo.com/zt/2018/09/26/jx3active/index.html';
  const extraDungeons=[
    ['tiangong','天工坊','fengqi',['方季常','平三指','震天甲士'],7,'valley_workshop',false,'https://jx3.xoyo.com/zt/2009/08/06/tgf/index.shtml','万花谷溪涧之间的机关作坊'],
    ['kongwu','空雾峰','fengqi',['冯度','王彦直','鬼影小次郎'],8,'snow_mountain',false,'https://jx3.xoyo.com/zt/2009/08/06/kwf/index.shtml','纯阳雪峰与山路'],
    ['lingxiao','灵霄峡','fengqi',['虎啸','射云','华鹤炎'],9,'gorge_cave',false,'https://jx3.xoyo.com/zt/2009/08/06/lxx/index.shtml','少林山峡的舍利塔、宵星洞与灵音石'],
    ['wuyan','无盐岛','fengqi',['罗翼','常万山','杜姬欣'],11,'east_sea',false,'https://jx3.xoyo.com/zt/2009/08/06/wyd/index.shtml','七秀水路尽头的岛屿'],
    ['dihua_front','荻花宫前山','fengqi',['阿里曼监察使','阿里曼入教主祭司','卫栖梧'],13,'maple_valley',false,'https://jx3.xoyo.com/zt/2009/08/06/dhg/index.shtml','枫华谷红叶前山'],
    ['tianzi','天子峰','fengqi',['柳随风','孙敬萧','李尧','玄悲','陌香','方宇谦'],15,'maple_valley',false,'https://jx3.xoyo.com/zt/2009/08/06/tzf/index.shtml','南屏山天子峰的山路与绝壁'],
    ['xuezhan','血战天策','anshi',['席庶云','曹炎烈','沙叱博','阿史那从礼','黑齿元佑','苏曼莎','令狐伤'],30,'military_fort',true,historicBossSource,'狼牙围攻下的天策府'],
    ['qinhuang','秦皇陵','cangxue',['王翦','石麒麟','探雪','令狐伤','安禄山'],35,'qin_tomb',true,historicBossSource,'机关俑卫守护的地下陵宫']
  ];
  for(const [id,name,expansionId,bosses,level,sceneId,materialDrop,source,landscape] of extraDungeons){
    const expansion=EXPANSIONS.find(e=>e.id===expansionId),chapter=EXPANSIONS.indexOf(expansion),parent=ROUTES[chapter*2];
    const dungeon={id:id+'_dungeon',routeId:id+'_instance',name,expansionId,chapter:chapter+1,main:false,bosses,level,sceneId,
      needBadges:parent.needBadges+1,unlockRouteId:parent.id,era:expansion.era,materialDrop,setName:expansion.setName,setIsAdapted:!materialDrop,
      bigIron:eraMaterials[expansion.era][0],smallIron:eraMaterials[expansion.era][1],historicalKind:materialDrop?'raid':'dungeon',historicalPartySizes:materialDrop?[10,25]:[5],sourceUrls:[source,...(!materialDrop?[classicDungeonSource]:[]),...(id==='qinhuang'?['https://wiki.biligame.com/jx3/秦皇陵']:[]),officialHistory],
      bossListScope:'历史普通或团队秘境的代表首领；事件关卡按本作五人队伍改编',setScope:'装备成长沿用本章套装；不是原版完整掉落表',
      desc:landscape+'。'+(materialDrop?'击败首领可获得对应年代神兵材料。':'早期五人秘境，产出装备与五行石，不产出玄晶和陨铁。')};
    DUNGEONS.push(dungeon);
    ROUTES.push({id:dungeon.routeId,name,region:expansion.name,subtitle:expansion.year+' · 秘境支线',expansionId,kind:'dungeon',dungeonId:dungeon.id,
      main:false,chapter:chapter+1,returnRouteId:parent.id,unlockRouteId:parent.id,level,needBadges:dungeon.needBadges,scene:parent.scene,sceneId,
      setName:dungeon.setName,boss:bosses[bosses.length-1],heroes:[...parent.heroes],desc:dungeon.desc+'通关后返回'+parent.name+'。',
      steps:parent.steps+2,rewards:{silver:45+level*8,exp:22+level*3},sourceUrls:dungeon.sourceUrls});
  }
  // Latest chapter companions follow the location's story, not the historical roster rotation.
  const reliefRepresentatives={chunyang:'chunyang_4',tiance:'tiance_5',wanhua:'wanhua_5',qixiu:'qixiu_6',cangjian:'cangjian_5',shaolin:'shaolin_5',cangyun:'cangyun_zhangsun_wangqing',tangmen:'tangmen_tang_wuying'};
  const cangshengRoutes={
    '过云岭':{heroes:['cangyun_1','tangmen_1','lingxue_1','yaozong_1','wanling_1','duanshi_1','wuxiang_1'],subtitle:'2026 · 孤栈寻援',desc:'循唐简指引北上求援，太平客栈聚集各路行者。雁门同袍、蜀中机巧与近年江湖流派在此相逢，为后续行程结伴同行。'},
    '云州':{heroes:['cangyun_1','cangyun_yan_yimei','cangyun_zhangsun_wangqing'],subtitle:'2026 · 玄甲护民',desc:'北望阴山、南扼雁门，边城百姓在烽火中守望。寻访墨家机巧助力，并与燕忆眉、长孙忘情等苍云同袍结缘，护持行旅与百姓。'},
    '渝州':{heroes:['tangmen_1','tangmen_tang_maoer','tangmen_tang_wuying'],subtitle:'2026 · 蜀中暗潮',desc:'唐怀仁与夜归人的暗线笼罩两江山城，机关杀器藏于乌铜山。结交唐猫儿、唐无影，循唐门旧事探察山城危局。'},
    '陕州':{heroes:SECTS.map(s=>reliefRepresentatives[s.id]||s.id+'_1'),subtitle:'2026 · 百家驰援',desc:'狼牙水师以军港截断驰援水路，潼关门户牵动天下。二十门派与无相楼同袍齐聚，包含段氏、万灵山庄、刀宗、北天药宗等，共赴护民之战。'},
    '洛阳之战':{heroes:['tiance_5','wanhua_5','cangyun_yan_yimei','tangmen_tang_maoer','lingxue_1','cangjian_5','cangyun_zhangsun_wangqing','tangmen_tang_wuying'],subtitle:'2026 · 同袍破阵',desc:'陕州战局之后，联军进击洛阳。此处杨宁等跨时代人物以纪念侠影同行，并非当代现役设定。与苍云、唐门、天策及各路同道合力破阵，依次击败秘境首领；普通与挑战难度均沿用本章数值要求。'}
  };
  for(const route of ROUTES.filter(r=>r.expansionId==='cangsheng')){
    const profile=cangshengRoutes[route.name];
    if(profile)Object.assign(route,profile,{sourceUrls:[...new Set([...route.sourceUrls,cangshengStorySource,'https://wiki.biligame.com/jx3/'+route.name])]});
  }
  // The historical era is descriptive; playable dungeon levels follow this game's chapter caps.
  for(const dungeon of DUNGEONS){
    const cap=10+EXPANSIONS.findIndex(expansion=>expansion.id===dungeon.expansionId)*5;
    dungeon.level=Math.min(dungeon.level,cap-2);
    const route=ROUTES.find(candidate=>candidate.id===dungeon.routeId);
    if(route)route.level=dungeon.level;
  }
  // 4.0: keep historical encounter IDs; add explicitly adapted entry trials.
  for (const [index, expansion] of EXPANSIONS.entries()) {
    const raid = DUNGEONS.find(d => d.expansionId === expansion.id && d.main !== false);
    for (const d of DUNGEONS.filter(d => d.expansionId === expansion.id)) {
      d.kind = d.historicalKind === 'dungeon' ? 'dungeon' : 'raid';
      d.prerequisiteDungeonId = d.kind === 'raid' ? 'five_' + expansion.id : null;
      d.desc = d.kind === 'dungeon' ? '原作五人秘境，五名侠客同行挑战。' : '五名同行侠客与五名义士组成十人会战；先通关本章五人秘境。';
      if(index===0&&d.main)d.desc+='初入江湖套与材料限制为本作教学设定。';
    }
    DUNGEONS.splice(EXPANSIONS.length+index,0,{...raid,id:'five_'+expansion.id,name:expansion.fields[0]+'·五人试炼',kind:'dungeon',main:false,chapterEntry:true,
      routeId:null,prerequisiteDungeonId:null,level:Math.max(5,7+index*5),needBadges:0,
      bosses:index===0?['人熊','邓文峰','商仲永']:raid.bosses.slice(0,Math.min(3,raid.bosses.length)),materialDrop:false,adapted:true,historicalKind:index===0?'dungeon':null,historicalPartySizes:index===0?[5]:[],
      ...(index===0?{name:'三才阵',releaseDate:null,releaseYear:2009,sourceUrls:[classicDungeonSource],historyNote:'原作五人门派秘境，非团队秘境；本作将它作为首章入门教学。'}:{}),
      desc:index===0?'原作五人秘境，作为本作首章教学；掉落初入江湖教学套装。':'本作五人训练副本：借本章首领回忆练招，掉落入门紫装；不是原作同名秘境。'});
  }
  const realEntryDungeons=[{"expansionId":"fengqi","name":"三才阵","bosses":["人熊","邓文峰","商仲永"],"originalReleaseYear":2009,"sourceUrls":["https://jx3.xoyo.com/zl/records.html"],"scope":"首领实体与顺序按本机地图脚本；压缩等级和奖励为放置适配。"},{"expansionId":"cangjian2010","name":"剑冢","bosses":["叶芳致","叶无心","叶琦菲"],"originalReleaseYear":2010,"sourceUrls":["https://jx3.xoyo.com/zl/records.html"],"scope":"首领实体与顺序按本机地图脚本；压缩等级和奖励为放置适配。"},{"expansionId":"bashu","name":"无量宫","bosses":["桃叶仙","伊曼云与濯尘","多多"],"originalReleaseYear":2011,"sourceUrls":["https://jx3.xoyo.com/zl/records.html"],"scope":"首领实体与顺序按本机地图脚本；压缩等级和奖励为放置适配。"},{"expansionId":"riyue","name":"光明顶秘道","bosses":["问寒松","辛然与吴颖莲","薛山","西域狮王"],"originalReleaseYear":2012,"sourceUrls":["https://jx3.xoyo.com/zl/records.html"],"scope":"首领实体与顺序按本机地图脚本；压缩等级和奖励为放置适配。本章重访早期真实五人秘境，不声称其首发于当前资料片。"},{"expansionId":"anshi","name":"华清宫","bosses":["水狼","火狼","风狼"],"originalReleaseYear":2013,"sourceUrls":["https://jx3.xoyo.com/zl/records.html"],"scope":"首领实体与顺序按本机地图脚本；压缩等级和奖励为放置适配。"},{"expansionId":"cangxue","name":"雁门关之役","bosses":["中田海","拓跋离","独孤问俗"],"originalReleaseYear":2014,"sourceUrls":["https://jx3.xoyo.com/zl/records.html"],"scope":"首领实体与顺序按本机地图脚本；压缩等级和奖励为放置适配。"},{"expansionId":"jiandan","name":"天泣林","bosses":["花千雨","暗","高力士"],"originalReleaseYear":2015,"sourceUrls":["https://jx3.xoyo.com/zl/records.html"],"scope":"首领实体与顺序按本机地图脚本；压缩等级和奖励为放置适配。"},{"expansionId":"fenggu","name":"白帝水宫","bosses":["慕容绿珠","宫天蝉","雨卓承"],"originalReleaseYear":2016,"sourceUrls":["https://jx3.xoyo.com/zl/records.html"],"scope":"首领实体与顺序按本机地图脚本；压缩等级和奖励为放置适配。本章重访早期真实五人秘境，不声称其首发于当前资料片。"},{"expansionId":"lingkong","name":"夕颜阁","bosses":["柳夕的心魔","柳哲","柳浮云"],"originalReleaseYear":2016,"sourceUrls":["https://jx3.xoyo.com/zl/records.html","https://jx3.xoyo.com/show-3866-157-1.html"],"scope":"首领实体与顺序按本机地图脚本；压缩等级和奖励为放置适配。本章重访早期真实五人秘境，不声称其首发于当前资料片。"},{"expansionId":"penglai2018","name":"九辩馆","bosses":["杀末邪","月笼草","蒹葭"],"originalReleaseYear":2018,"sourceUrls":["https://jx3.xoyo.com/zl/records.html"],"scope":"首领实体与顺序按本机地图脚本；压缩等级和奖励为放置适配。"},{"expansionId":"lingxue2019","name":"泥兰洞天","bosses":["康成辩","源明信","康杖石"],"originalReleaseYear":2019,"sourceUrls":["https://jx3.xoyo.com/zl/records.html"],"scope":"首领实体与顺序按本机地图脚本；压缩等级和奖励为放置适配。"},{"expansionId":"fengtian","name":"罗汉门","bosses":["宓果","刘细","郝大雪"],"originalReleaseYear":2020,"sourceUrls":["https://jx3.xoyo.com/zl/records.html"],"scope":"首领实体与顺序按本机地图脚本；压缩等级和奖励为放置适配。"},{"expansionId":"beitian","name":"武氏别院","bosses":["李君竹","解秀朝","武云阙"],"originalReleaseYear":2021,"sourceUrls":["https://jx3.xoyo.com/zl/records.html"],"scope":"首领实体与顺序按本机地图脚本；压缩等级和奖励为放置适配。"},{"expansionId":"hengdao","name":"幽藤馆","bosses":["吴添明","秘三花","藤原广嗣"],"originalReleaseYear":2022,"sourceUrls":["https://jx3.xoyo.com/zl/records.html"],"scope":"首领实体与顺序按本机地图脚本；压缩等级和奖励为放置适配。"},{"expansionId":"wanling2023","name":"栖灵洞天·旧事","bosses":["辛仕徽","宣骄","魏鑫"],"originalReleaseYear":2023,"sourceUrls":["https://jx3.xoyo.com/zl/records.html"],"scope":"首领实体与顺序按本机地图脚本；压缩等级和奖励为放置适配。"},{"expansionId":"silu","name":"天龙寺","bosses":["枯荣大师","段留影","段业声"],"originalReleaseYear":2024,"sourceUrls":["https://jx3.xoyo.com/zl/records.html"],"scope":"首领实体与顺序按本机地图脚本；压缩等级和奖励为放置适配。"},{"expansionId":"shanhai","name":"獭山岛","bosses":["石固勇","汪佑","瓦赫拉"],"originalReleaseYear":2025,"sourceUrls":["https://jx3.xoyo.com/zl/records.html"],"scope":"首领实体与顺序按本机地图脚本；压缩等级和奖励为放置适配。"},{"expansionId":"cangsheng","name":"南山马场","bosses":["卢敬恒","阿孜娅","宓萱"],"originalReleaseYear":2026,"sourceUrls":["https://jx3.xoyo.com/zl/records.html","https://jx3tc.xoyobox.com/announce/gg.html?id=483"],"scope":"首领实体与顺序按本机地图脚本；压缩等级和奖励为放置适配。"}];
  for(const entry of realEntryDungeons){const d=DUNGEONS.find(d=>d.id==='five_'+entry.expansionId);d.legacyTrialBosses=[...d.bosses];Object.assign(d,{name:entry.name,bosses:entry.bosses,releaseYear:entry.originalReleaseYear,sourceUrls:entry.sourceUrls,historyNote:entry.scope,adapted:false,historicalKind:'dungeon',historicalPartySizes:[5],desc:'原作真实五人秘境'+(entry.originalReleaseYear<EXPANSIONS.find(e=>e.id===entry.expansionId).year?' · 旧日重访':'')+'；首领与场景取材剑网3，压缩等级和掉落为放置适配。'});}
  // 6.0 route itinerary: every listed five-person dungeon is an actual playable
  // route, including the stable five_<era> save ID. Historical levels remain
  // metadata; the compressed idle levels are explicitly this game's rules.
  const classicFiveSource='https://jx3yq.xoyo.com/show-5730-76-1.html';
  const firstEraMore=[
    ['rilun','日轮山城',['哑头陀','藤原若狭','平三指'],'east_sea','https://jx3.xoyo.com/zt/2009/08/06/rlsc/index.shtml'],
    ['fengyu','风雨稻香村',['王莽','董龙','李复'],'jiangnan','https://jx3.xoyo.com/zt/2009/12/29/wlmj/yxdxc/index.shtml']
  ];
  for(const [key,name,bosses,sceneId,source] of firstEraMore){
    const exp=EXPANSIONS[0],d={...DUNGEONS.find(d=>d.id==='five_fengqi'),id:key+'_dungeon',routeId:key+'_instance',name,bosses,sceneId,chapterEntry:false,adapted:false,historicalKind:'dungeon',historicalPartySizes:[5],sourceUrls:[source,classicFiveSource],historyNote:'原作经典五人秘境；以本作回忆路线重访。'};
    DUNGEONS.push(d);
  }
  for(const [index,exp] of EXPANSIONS.entries()){
    const field=ROUTES.find(r=>r.expansionId===exp.id&&r.main!==false&&r.kind==='field');
    const raid=DUNGEONS.find(d=>d.expansionId===exp.id&&d.main!==false);
    const entrance=DUNGEONS.find(d=>d.id==='five_'+exp.id);
    const squads=index===0?[entrance,...['tiangong','kongwu','lingxiao','wuyan','dihua_front','rilun','fengyu','tianzi'].map(key=>DUNGEONS.find(d=>d.id===key+'_dungeon'))]:[entrance];
    entrance.routeId=entrance.routeId||'five_'+exp.id+'_instance';
    const stages=[field];
    for(const [order,d] of squads.entries()){
      if(!d)continue;
      d.level=index===0?Math.min(8,3+Math.floor(order*.65)):Math.max(3,10+index*5-4);
      d.itineraryOrder=order+1;d.materialDrop=false;d.kind='dungeon';
      let r=ROUTES.find(r=>r.dungeonId===d.id);
      if(!r){r={...field,id:d.routeId,name:d.name,kind:'dungeon',isDungeon:true,main:false,dungeonId:d.id,returnRouteId:field.id,heroes:[...field.heroes],sceneId:d.sceneId||field.sceneId};ROUTES.push(r);}
      Object.assign(r,{name:d.name,level:d.level,steps:index===0?3:4,boss:d.bosses[d.bosses.length-1],sceneId:d.sceneId||r.sceneId,subtitle:exp.year+' · 五人秘境',sourceUrls:d.sourceUrls,desc:'本章首通路线，击败全部首领后继续下一站；刷取模式可重复获取装备。',rewards:{silver:45+index*35+order*8,exp:35+index*22+order*5}});
      stages.push(r);
    }
    stages.push(ROUTES.find(r=>r.dungeonId===raid.id));
    for(const [order,r] of stages.entries()){
      r.legacyNeedBadges=r.needBadges;r.legacyUnlockRouteId=r.unlockRouteId||null;r.itineraryOrder=order;r.progressionRoute=true;r.unlockRouteId=order?stages[order-1].id:null;
      r.level=Math.min(r.level,10+index*5-2);
      if(!order){r.steps=6;r.needBadges=0;r.rewards.exp=42+index*28;}
    }
    // Extra exploration remains optional; its own first-clear opens from the
    // chapter's field. Advancement checks the itinerary, never collection luck.
    exp.itinerary=stages.map(r=>r.id);
    exp.progressionRule='按路线击败守关首领，通关普通团队秘境后开放下一资料片；装备毕业与挑战难度为选修。';
  }
  const hiddenCompanions = [
    ['lifu','李复','chunyang','dps','拳脚','截云破岳','稻香旧识，九天鬼谋。','https://jx3.xoyo.com/zt/2009/12/29/wlmj/yxdxc/index.shtml'],
    ['qiuyeqing','秋叶青','wanhua','healer','驭驶','青鸾回春','梦回稻香，故友相逢。','https://jx3.xoyo.com/zt/2009/12/29/wlmj/yxdxc/index.shtml'],
    ['liujingtao','柳惊涛','badao','dps','长兵','惊涛断岳','霸刀山庄大庄主，追查风雷刀谷异变。','https://jx3.xoyo.com/zt/2017/03/15/active_01/jx3ZT2/index.html'],
    ['liujinghai','柳静海','badao','tank','长兵','铁壁横江','率山庄精锐追寻失落神兵。','https://jx3.xoyo.com/zt/2017/03/31/operate/index.html']
  ];
  for(const [id,name,sect,role,weaponType,skill,desc,source] of hiddenCompanions){
    const s=SECTS.find(x=>x.id===sect);
    HEROES.push({id:'hidden_'+id,name,sect,role,roles:[role],rarity:4,title:'百战隐侠',skill,portrait:s.portrait,
      weapon:s.weapon,weaponType,damageType:s.damageType,weaponTypeAdapted:true,sourceUrls:[source],artId:null,
      hidden:true,illustrationNote:'人物身份有来源；门派归类、技能与示意立绘为本作适配。',
      desc:desc+'通过百战异闻录结缘。',baseHp:230,baseAtk:37,baseDef:19});
  }
  const companionSource='https://jx3tc.xoyobox.com/announce/gg.html?id=22';
  const companionDefs=[
    ['rongrong','茸茸','mingjiao','tank','短兵','护持同伴',companionSource],
    ['nianxiaoxiong','年小熊','wudu','healer','奇兵','回春相助',companionSource],
    ['nianxiaolu','年小鹿','wudu','dps','奇兵','灵蛊随行',companionSource],
    ['heqixian','何其鲜','gaibang','dps','拳脚','鲜招迭出','https://www.sina.cn/news/detail/5356042898639894.html']
  ];
  const STARTER_COMPANIONS=[];
  for(const [id,name,sect,role,weaponType,skill,source]of companionDefs){const base=SECTS.find(s=>s.id===sect),heroId='companion_'+id;STARTER_COMPANIONS.push(heroId);HEROES.push({id:heroId,name,sect,role,roles:[role],rarity:1,title:'同行侠客',skill,portrait:base.portrait,weapon:base.weapon,weaponType,damageType:base.damageType,weaponTypeAdapted:true,starterCompanion:true,sourceUrls:[source],artId:null,desc:'红尘侠影同道，随你历练江湖。初始同行、等级与战斗技能按本作重新设计。',illustrationNote:'人物名称有官方来源；门派分组、战斗定位与开局结缘为本作适配，当前为门派示意立绘。',baseHp:150,baseAtk:20,baseDef:11});}
  const trialRepresentatives=[{"sect":"wudu","id":"wudu_qu_yun","name":"曲云","title":"五毒教主","baselineRole":"healer","source":"https://jx3.xoyo.com/zt/2011/06/03/quanxin.shtml"},{"sect":"tangmen","id":"tangmen_tang_aotian","name":"唐傲天","title":"唐门门主","baselineRole":"dps","source":"https://jx3.xoyo.com/zt/2014/11/21/zt/menpai/tm.html"},{"sect":"mingjiao","id":"mingjiao_lu_weilou","name":"陆危楼","title":"明教教主","baselineRole":"tank","source":"https://jx3.xoyo.com/zl/records.html"},{"sect":"gaibang","id":"gaibang_guo_yan","name":"郭岩","title":"丐帮帮主","baselineRole":"dps","source":"https://jx3.xoyo.com/zt/2014/11/21/zt/menpai/gb.html"},{"sect":"changge","id":"changge_yang_yifei","name":"杨逸飞","title":"长歌门主","baselineRole":"healer","source":"https://jx3.xoyo.com/zl/records.html"},{"sect":"penglai","id":"penglai_fang_qian","name":"方乾","title":"蓬莱门主","baselineRole":"dps","source":"https://jx3.xoyo.com/show-2458-2614-1.html"},{"sect":"lingxue","id":"lingxue_ji_bieqing","name":"姬别情","title":"吴钩台主管","baselineRole":"dps","source":"https://weibo.com/ttarticle/p/show?id=2309404428327619264599"},{"sect":"yantian","id":"yantian_xiao_qingyun","name":"萧卿云","title":"衍天宗掌门","baselineRole":"dps","source":"https://jx3.xoyo.com/show-2458-4157-1.html"},{"sect":"yaozong","id":"yaozong_chen_yue","name":"陈月","title":"北天药宗宗主","baselineRole":"healer","source":"https://jx3.xoyo.com/show-2458-4734-1.html"},{"sect":"daozong","id":"daozong_xie_yunliu","name":"谢云流","title":"刀宗创派者","baselineRole":"dps","source":"https://jx3.xoyo.com/zt/2014/11/21/zt/menpai/dz.html"},{"sect":"wanling","id":"wanling_song_shaofeng","name":"颂少风","title":"万灵山庄庄主","baselineRole":"dps","source":"https://news.17173.com/content/10132023/111020508.shtml"},{"sect":"duanshi","id":"duanshi_duan_fangxun","name":"段方旬","title":"段氏家主","baselineRole":"dps","source":"https://jx3tc.xoyobox.com/announce/gg.html?id=351"},{"sect":"wuxiang","id":"wuxiang_jiang_lingge","name":"江菱歌","title":"无相楼楼主","baselineRole":"dps","source":"https://jx3.xoyo.com/show-2458-6825-1.html"}];
  for(const m of trialRepresentatives){const base=SECTS.find(x=>x.id===m.sect);HEROES.push({id:m.id,name:m.name,sect:m.sect,role:m.baselineRole,roles:[m.baselineRole],rarity:4,title:m.title,skill:base.skill+'·真传',portrait:base.portrait,weapon:base.weapon,weaponType:base.weaponType,damageType:base.damageType,weaponTypeAdapted:true,sourceUrls:[m.source],artId:null,desc:m.title+'，通过对应门派的资料片试炼结缘。',illustrationNote:'人物身份有来源；试炼结缘、战斗技能与门派示意立绘为本作适配。',baseHp:230,baseAtk:36,baseDef:18});}
  for(const h of HEROES.filter(h=>h.rarity>=3&&!h.hidden))h.recruitment={type:'sect-trial'};
  HEROES.find(h=>h.id==='tiance_5').recruitment={type:'memory',expansionId:'anshi',dungeon:'血战天策'};
  HEROES.find(h=>h.id==='hidden_liujingtao').recruitment={type:'sect-trial'};
  // 历史身份与地图取材有出处，结缘条件是本作的纪念回忆玩法。
  const sectMemories={chunyang:['fengqi','华山·纯阳宫'],tiance:['anshi','天策府·血战天策'],wanhua:['fengqi','万花谷'],qixiu:['fengqi','扬州·七秀坊'],shaolin:['fengqi','嵩山·少林'],cangjian:['cangjian2010','藏剑山庄'],wudu:['bashu','黑龙沼·五毒'],tangmen:['bashu','唐家堡'],mingjiao:['riyue','明教·圣墓山'],gaibang:['anshi','君山·丐帮'],cangyun:['cangxue','雁门关·苍云堡'],changge:['jiandan','千岛湖·长歌门'],badao:['lingkong','霸刀山庄·风雷刀谷'],penglai:['penglai2018','蓬莱·侠客岛'],lingxue:['lingxue2019','太白山·吴钩台'],yantian:['fengtian','昆仑·衍天宗'],yaozong:['beitian','北天药宗'],daozong:['hengdao','翁洲·刀宗'],wanling:['wanling2023','万灵山庄'],duanshi:['silu','大理·段氏'],wuxiang:['shanhai','永宁湾·无相楼']};
  for(const h of HEROES.filter(h=>h.recruitment||h.hidden)){const [expansionId,location]=sectMemories[h.sect];h.placement={expansionId,location,sourceUrl:h.sourceUrls?.[0]||SECTS.find(s=>s.id===h.sect).sourceUrls[0],note:'按门派历史地域编排的版本回忆；招募并非原作掉落。'};}
  for(const id of ['hidden_lifu','hidden_qiuyeqing'])Object.assign(HEROES.find(h=>h.id===id).placement,{expansionId:'fengqi',location:'稻香村·风雨旧忆',note:'官方风雨稻香村背景中的故友；首章百战回忆结缘。'});
  for(const id of ['tiance_4','tiance_6'])Object.assign(HEROES.find(h=>h.id===id).placement,{dungeonId:'xuezhan_dungeon',sourceUrl:'https://wiki.biligame.com/jx3/血战天策',note:'先完成血战天策普通难度，再从本门试炼或本章百战结缘。'});
  for(const id of ['hidden_liujingtao','hidden_liujinghai'])Object.assign(HEROES.find(h=>h.id===id).placement,{dungeonId:'lingkong_dungeon',sourceUrl:'https://jx3.xoyo.com/zt/2017/03/31/operate/index.html',note:'人物与风雷刀谷事件相关；完成本章风雷刀谷后解锁纪念结缘，并非击杀人物后掉落。'});
  Object.assign(HEROES.find(h=>h.id==='shaolin_4').placement,{location:'南屏山·天子峰',dungeonId:'tianzi_dungeon',sourceUrl:'https://jx3.xoyo.com/zt/2009/08/06/tzf/index.shtml',note:'在天子峰完成切磋后结缘；招募为本作改编。'});
  for(const [id,location] of [['cangyun_yan_yimei','云州'],['tangmen_tang_maoer','渝州']])Object.assign(HEROES.find(h=>h.id===id).placement,{expansionId:'cangsheng',location,note:'沿用苍生铸世的地图人物安排，以本章百战回忆结缘。'});
  // Source audit 2026-11-17: public identity is separate from the stable sect/save index.
  // This metadata changes labels and provenance, never stats, recruitment, or break categories.
  const officialSectPage={chunyang:'index',tiance:'tc',wanhua:'wh',qixiu:'qx',cangjian:'cj',shaolin:'sl',wudu:'wd',tangmen:'tm',mingjiao:'mj',gaibang:'gb',cangyun:'cangy',changge:'cg',badao:'bd',penglai:'pl',lingxue:'lxg',yantian:'ytz',yaozong:'btyz',daozong:'dz',wanling:'wlsz',duanshi:'ds'};
  const officialSectSkills=new Set(['补天诀','惊羽诀','明尊琉璃体','笑尘诀','铁骨衣','分山劲','相知','北傲诀','凌海诀','隐龙诀','太玄经','灵素','孤锋诀','山海心诀','周天功','幽罗引','天罗诡道','傲血战意','铁牢律']);
  const officialPortraitIds=new Set(['chunyang_4','chunyang_5','chunyang_6','tiance_4','tiance_5','tiance_6','wanhua_4','wanhua_5','wanhua_6','qixiu_5','qixiu_6','cangjian_4','cangjian_5','cangjian_6','shaolin_5','shaolin_6','hidden_lifu','hidden_qiuyeqing','yaozong_chen_yue','companion_heqixian']);
  const unverifiedPortraitIds=new Set(['shaolin_4','companion_rongrong','companion_nianxiaoxiong','companion_nianxiaolu']);
  const identityOverrides={
    chunyang_4:{identityLabel:'纯阳五子·紫虚子'},
    chunyang_5:{identityLabel:'纯阳五子·清虚子',weapon:'羽扇',desc:'纯阳女道长于睿，道号清虚子，善计略。立绘持羽扇状法器；气劲治疗与五人援护效果按本作适配。'},
    chunyang_6:{identityLabel:'纯阳掌教·玉虚子',weapon:'气劲与佩剑（造型适配）',weaponTypeAdapted:true,desc:'纯阳掌教李忘生，道号玉虚子。指尖官方图鉴将其归为气劲；重绘保留白须道袍，完整佩剑形制为本作造型适配。'},
    tiance_4:{identityLabel:'天策情报总管',weaponTypeAdapted:true},
    tiance_5:{identityLabel:'天策天枪·纪念侠影'},
    tiance_6:{identityLabel:'天策统领·英国公'},
    wanhua_4:{identityLabel:'万花医者·孙思邈门下',weaponTypeAdapted:true},
    wanhua_5:{identityLabel:'药圣首徒·活人不医'},
    wanhua_6:{identityLabel:'万花谷主'},
    qixiu_4:{identityLabel:'七秀坊名侠',weapon:'双剑（门派玩法适配）',weaponTypeAdapted:true},
    qixiu_5:{identityLabel:'七秀·燕秀',weaponTypeAdapted:true},
    qixiu_6:{identityLabel:'七秀坊主·绮秀'},
    cangjian_4:{identityLabel:'藏剑三庄主',skill:'无双剑',skillSourceType:'official-character',desc:'藏剑山庄三庄主叶炜，一心磨炼剑术，以无双剑闻名。当前像素形象取银发黑金衣，战斗效果为本作适配。'},
    cangjian_5:{identityLabel:'藏剑五庄主',skill:'凝雪功',skillSourceType:'official-character',desc:'藏剑山庄五庄主叶凡，曾拜王遗风为师，得授凝雪功。当前剑术伤害与五人战斗效果为本作适配。'},
    cangjian_6:{identityLabel:'藏剑第二代庄主'},
    shaolin_4:{identityLabel:'少林·天子峰名僧'},
    shaolin_5:{identityLabel:'少林方丈'},
    shaolin_6:{identityLabel:'少林高僧'},
    cangyun_yan_yimei:{identityLabel:'苍云名侠·燕忆眉'},
    cangyun_zhangsun_wangqing:{identityLabel:'苍云统帅'},
    tangmen_tang_wuying:{identityLabel:'唐门少主'},
    tangmen_tang_maoer:{identityLabel:'唐门名侠',title:'唐门名侠'},
    hidden_lifu:{affiliation:'天下群侠·九天',identityLabel:'玄天君·鬼谋',weapon:'拳掌与折扇',desc:'九天玄天君李复，号鬼谋，胸藏用兵谋略。以拳掌迎敌，手中折扇衬出从容气度。'},
    hidden_qiuyeqing:{affiliation:'天下群侠',identityLabel:'长安侠女·稻香故友',weapon:'禽鸟协战',desc:'秋叶青出身长安官宦家，与李复相识于灯会。作为稻香故友同行，当前治疗与禽鸟协战按本作适配。'},
    hidden_liujingtao:{identityLabel:'霸刀大庄主'},
    hidden_liujinghai:{identityLabel:'霸刀名侠·柳静海'},
    companion_rongrong:{affiliation:'家园管家',identityLabel:'家园管家·茸茸',weapon:'护身双刃（本作适配）',desc:'家园管家茸茸在此应邀同行，以护身双刃护持伙伴。初始结缘与承伤武学均为本作改编。'},
    companion_nianxiaoxiong:{affiliation:'家园管家',identityLabel:'家园管家·年小熊',weapon:'虫笛（本作适配）',desc:'家园管家年小熊在此应邀同行，以治疗协助伙伴。初始结缘与虫笛武学均为本作改编。'},
    companion_nianxiaolu:{affiliation:'家园管家',identityLabel:'家园管家·年小鹿',weapon:'虫笛（本作适配）',desc:'家园管家年小鹿在此应邀同行，与伙伴一同历练。初始结缘与虫笛武学均为本作改编。'},
    companion_heqixian:{affiliation:'何家舫',identityLabel:'何家舫·共鸣侠客',weapon:'锅铲与五味调料',skill:'厨道烹天',skillSourceType:'official-character',desc:'渝州人士何其鲜，何家舫左灶司崔晏亲传弟子，以锅铲配合五味调料近身迎敌。厨道烹天为官方招式名，数值效果按本作适配。'},
    wudu_qu_yun:{identityLabel:'五毒教主'},
    tangmen_tang_aotian:{identityLabel:'唐门门主',weapon:'机关暗器',desc:'唐门门主唐傲天在旧日战事中失去双腿，仍谋复兴唐门。画像保留机关轮椅；暗器战斗与试炼结缘为本作适配。'},
    mingjiao_lu_weilou:{identityLabel:'明教教主'},
    gaibang_guo_yan:{identityLabel:'丐帮帮主'},
    changge_yang_yifei:{identityLabel:'长歌门主'},
    penglai_fang_qian:{identityLabel:'蓬莱门主'},
    lingxue_ji_bieqing:{identityLabel:'凌雪阁·吴钩台主管'},
    yantian_xiao_qingyun:{identityLabel:'衍天宗掌门',weapon:'筚篥',desc:'衍天宗掌门萧卿云，以筚篥为器。人物兵器有官方明确记载，战斗数值与试炼结缘为本作适配。'},
    yaozong_chen_yue:{identityLabel:'北天药宗宗主'},
    daozong_xie_yunliu:{identityLabel:'刀宗创派者'},
    wanling_song_shaofeng:{identityLabel:'万灵山庄庄主'},
    duanshi_duan_fangxun:{identityLabel:'段氏家主'},
    wuxiang_jiang_lingge:{identityLabel:'无相楼楼主'}
  };
  for(const hero of HEROES){
    const sect=SECTS.find(s=>s.id===hero.sect),named=!hero.name.endsWith('弟子');
    hero.artId=hero.id;
    hero.affiliation=sect.name;
    hero.identityLabel=named?hero.title:hero.name;
    hero.skillSourceType=officialSectSkills.has(hero.skill)?'official-sect':'adapted';
    Object.assign(hero,identityOverrides[hero.id]||{});
    hero.skillAdapted=true;
    hero.skillSourceLabel=hero.skillSourceType==='official-character'?'官方人物武学 · 效果改编':hero.skillSourceType==='official-sect'?'门派心法 · 效果改编':'本作改编武学';
    hero.skillSourceNote=hero.skillSourceType==='official-character'?'招式名称有官方人物依据，伤害、治疗、冷却与五人职责按本作适配。':hero.skillSourceType==='official-sect'?'使用官方门派心法名称；不表示该名侠的专属原招，战斗效果为本作适配。':'名称或个人归属未取得明确官方招式依据；当前为本作放置玩法设计。';
    hero.identitySourceType=named?'character-reference':'sect-inspired-original';
    hero.artSourceType=!named||unverifiedPortraitIds.has(hero.id)?'original-interpretation':officialPortraitIds.has(hero.id)?'official-reference':'game-model-reference';
    hero.illustrationNote=hero.artSourceType==='original-interpretation'?'像素立绘为独立外貌演绎，未宣称是原作人物定稿。':hero.artSourceType==='official-reference'?'依据官方人物图重绘的像素形象；动作与比例为本作改编，指尖与端游形象按参考版本取材。':'依据媒体宣传截图或Wiki收录游戏形象重绘；不是官方原图，未见细节为本作演绎。';
    const sectSource=officialSectPage[hero.sect]?'https://jx3.xoyo.com/zt/2014/11/21/zt/menpai/'+officialSectPage[hero.sect]+'.html':'https://jx3.xoyo.com/show-2458-6825-1.html';
    hero.sourceUrls=[...new Set([...(hero.sourceUrls||[]),sectSource])];
    hero.skillSourceUrl=hero.skillSourceType==='official-character'?(hero.id==='companion_heqixian'?'https://www.sina.cn/news/detail/5356042898639894.html':'https://jx3.qq.com/pc201903/js/deparment.js'):hero.skillSourceType==='official-sect'?sectSource:null;
  }
  for(const id of ['hidden_lifu','hidden_qiuyeqing'])HEROES.find(h=>h.id===id).sourceUrls.unshift('https://jx3.qq.com/pc201903/js/deparment.js');
  const ITEMS = [
    {id:'invite',name:'结交帖',desc:'自动结交与茶馆邀约时使用，重复结交可获得同门心得。',price:120,icon:'帖'},
    {id:'medicine',name:'止血散',desc:'恢复一位侠客 60% 的最大气血，倒下的侠客也可使用。',price:85,icon:'药'},
    {id:'exp',name:'修为丹',desc:'为一位侠客增加 250 点修为，修为足够时自动升级。',price:180,icon:'丹'},
    {id:'tea',name:'清心茶',desc:'立即为全队恢复所有气血。',price:220,icon:'茶'},
    {id:'ore',name:'精铁',desc:'百工制作与装备打造所需的精铁。',price:150,icon:'铁'},
    {id:'herb',name:'甘草',desc:'采药所得，可在百工坊制成止血散与清心茶。',price:35,icon:'草'}
  ];
  const PETS = [
    {id:'ricecat',name:'稻香小狸',desc:'总在稻田边等你回来的狸花猫。',bonus:'出战攻击提升 3%',effect:'atk',value:0.03,icon:'猫'},
    {id:'snowfox',name:'踏雪狐',desc:'松雪之间的一道白影。',bonus:'历练受击伤害减少 5%',effect:'resist',value:0.05,icon:'狐'},
    {id:'bamboopanda',name:'竹间团团',desc:'抱着嫩竹慢慢跟上的小团子。',bonus:'出战防御提升 5%',effect:'def',value:0.05,icon:'熊'},
    {id:'bluebird',name:'青羽',desc:'檐下啁啾，报来远路的消息。',bonus:'战斗修为提升 5%',effect:'exp',value:0.05,icon:'鸟'},
    {id:'goldrat',name:'金绒鼠',desc:'对藏着铜钱的小角落很有兴趣。',bonus:'战斗银两提升 5%',effect:'silver',value:0.05,icon:'鼠'},
    {id:'lotusrabbit',name:'莲灯兔',desc:'轻轻一跃，像踩在湖面灯影上。',bonus:'历练受击伤害减少 6%',effect:'resist',value:0.06,icon:'兔'},
    {id:'blackdog',name:'墨点',desc:'走再远的路，也不肯离你半步。',bonus:'出战攻击提升 4%',effect:'atk',value:0.04,icon:'犬'},
    {id:'turtle',name:'长生龟',desc:'江湖很大，它从不着急。',bonus:'出战防御提升 7%',effect:'def',value:0.07,icon:'龟'},
    {id:'crane',name:'松间鹤',desc:'云端掠过一声清唳。',bonus:'战斗修为提升 7%',effect:'exp',value:0.07,icon:'鹤'},
    {id:'squirrel',name:'松果客',desc:'收集一路的松果，留作明日干粮。',bonus:'战斗银两提升 7%',effect:'silver',value:0.07,icon:'栗'},
    {id:'deer',name:'灵溪鹿',desc:'听见溪水就会停下脚步。',bonus:'历练受击伤害减少 8%',effect:'resist',value:0.08,icon:'鹿'},
    {id:'butterfly',name:'流萤蝶',desc:'夜色里伴你同行的一点微光。',bonus:'出战攻击提升 6%',effect:'atk',value:0.06,icon:'蝶'}
  ];
  // Keep saved named-character IDs and the historical route rotation stable.
  // Retired filler ranks resolve to the one ordinary disciple of their sect.
  for(const route of ROUTES)route.heroes=[...new Set(route.heroes.map(id=>RETIRED_HERO_IDS.includes(id)?id.replace(/_[23]$/,'_1'):id))];
  for(let i=HEROES.length-1;i>=0;i--)if(RETIRED_HERO_IDS.includes(HEROES[i].id))HEROES.splice(i,1);
  root.JXData = Object.freeze({SECTS,HEROES,RETIRED_HERO_IDS,ROUTES,EXPANSIONS,DUNGEONS,STARTER_COMPANIONS,ITEMS,PETS,RARITIES:['','寻常','优秀','名侠','宗师']});
})(globalThis);

;
(function(root){
  'use strict';
  const D=root.JXData;
  if(!D)throw new Error('红尘侠影名册须在江湖资料之后加载。');
  // Formal assisted NPC rows only: both source tables exclude TryOut=1.
  // Sect keys below are stable combat/save categories, not claims of affiliation.
  const sourceUrl='https://jx3tc.xoyobox.com/show-98-226-1.html';
  const definitions=[{"id":"companion_kangyanbie","officialTemplateId":1,"name":"康宴别","nativeRole":"tank","weapon":"staff","skill":"易筋经","introduction":"康宴别出身洞天福地岛康氏，精通康家武学与少林内功。","collaboration":null,"npcTemplateId":108914,"sourceAcquisition":{"filterWay":"2","drawItems":"5_45838;5_45839;","priceRaw":"","outOfPrint":false,"limitTip":""},"sources":["K:\\JX3\\client\\ui\\Scheme\\Case\\Partner\\PartnerNpcInfo.txt","K:\\JX3\\client\\settings\\NpcAssisted\\NpcAssistedTemplate.tab","K:\\JX3\\client\\ui\\Image\\Partner\\GetPartner\\KangYanBie.Tga"],"adaptation":["shaolin","hengdao","少林·康氏","长兵","阳性",3],"weaponLabel":"长棍"},{"id":"companion_tangxiaoke","officialTemplateId":2,"name":"唐小珂","nativeRole":"dps","weapon":"crossbow","skill":"惊羽诀","introduction":"唐小珂是唐门外堡弟子中的佼佼者，不喜言语，擅长远程射击。","collaboration":null,"npcTemplateId":108915,"sourceAcquisition":{"filterWay":"2","drawItems":"5_45838;5_45839;","priceRaw":"","outOfPrint":false,"limitTip":""},"sources":["K:\\JX3\\client\\ui\\Scheme\\Case\\Partner\\PartnerNpcInfo.txt","K:\\JX3\\client\\settings\\NpcAssisted\\NpcAssistedTemplate.tab","K:\\JX3\\client\\ui\\Image\\Partner\\GetPartner\\TangXiaoKe.Tga"],"adaptation":["tangmen","hengdao","唐门外堡","奇兵","外功",3],"weaponLabel":"千机弩"},{"id":"companion_muqingrou","officialTemplateId":3,"name":"沐晴柔","nativeRole":"heal","weapon":"brush","skill":"离经易道","introduction":"沐晴柔，陈留人士，曾于万花谷中修习，精通医术。","collaboration":null,"npcTemplateId":108916,"sourceAcquisition":{"filterWay":"2","drawItems":"5_45838;5_45839;","priceRaw":"","outOfPrint":false,"limitTip":""},"sources":["K:\\JX3\\client\\ui\\Scheme\\Case\\Partner\\PartnerNpcInfo.txt","K:\\JX3\\client\\settings\\NpcAssisted\\NpcAssistedTemplate.tab","K:\\JX3\\client\\ui\\Image\\Partner\\GetPartner\\QingRou.Tga"],"adaptation":["wanhua","hengdao","万花医者","奇兵","混元",3],"weaponLabel":"判官笔"},{"id":"companion_shenjianxin","officialTemplateId":4,"name":"沈剑心","nativeRole":"dps","weapon":null,"skill":"纯阳别册","introduction":"稻香村保安，纯阳宫关门弟子，擅长纯阳剑术。","collaboration":null,"npcTemplateId":109906,"sourceAcquisition":{"filterWay":"2","drawItems":"5_45838;5_45839;","priceRaw":"","outOfPrint":false,"limitTip":""},"sources":["K:\\JX3\\client\\ui\\Scheme\\Case\\Partner\\PartnerNpcInfo.txt","K:\\JX3\\client\\settings\\NpcAssisted\\NpcAssistedTemplate.tab","K:\\JX3\\client\\ui\\Image\\Partner\\GetPartner\\ShenJianXin.Tga"],"adaptation":["chunyang","hengdao","纯阳侠客","短兵","混元",4],"weaponLabel":"长剑（本作适配）"},{"id":"companion_wenzhezhi","officialTemplateId":5,"name":"温折枝","nativeRole":"dps","weapon":null,"skill":"花间游","introduction":"温折枝，居业行聘请的精英管家，细心周到，可施展部分花间游招式。","collaboration":null,"npcTemplateId":110322,"sourceAcquisition":{"filterWay":"1","drawItems":"","priceRaw":"160000","outOfPrint":false,"limitTip":"","currency":"园宅币（nArchitecture）；原作可用银两补差"},"sources":["K:\\JX3\\client\\ui\\Scheme\\Case\\Partner\\PartnerNpcInfo.txt","K:\\JX3\\client\\settings\\NpcAssisted\\NpcAssistedTemplate.tab","K:\\JX3\\client\\ui\\Image\\Partner\\GetPartner\\WenZheZhi.tga"],"adaptation":["wanhua","fengtian","居业行精英管家","奇兵","混元",3],"weaponLabel":"判官笔（本作适配）"},{"id":"companion_nianxiaolu","officialTemplateId":6,"name":"年小鹿","nativeRole":"dps","weapon":null,"skill":"毒经","introduction":"年小鹿，居业行聘请的管家，活泼伶俐，可施展部分毒经招式。","collaboration":null,"npcTemplateId":110323,"sourceAcquisition":{"filterWay":"1","drawItems":"","priceRaw":"40000","outOfPrint":false,"limitTip":"","currency":"园宅币（nArchitecture）；原作可用银两补差"},"sources":["K:\\JX3\\client\\ui\\Scheme\\Case\\Partner\\PartnerNpcInfo.txt","K:\\JX3\\client\\settings\\NpcAssisted\\NpcAssistedTemplate.tab","K:\\JX3\\client\\ui\\Image\\Partner\\GetPartner\\NIanXiaoLu.tga"],"weaponLabel":"虫笛"},{"id":"companion_ruanguiyun","officialTemplateId":7,"name":"阮归云","nativeRole":"dps","weapon":null,"skill":"无方","introduction":"阮归云，居业行聘请的精英管家，从容大方，可施展部分无方招式。","collaboration":null,"npcTemplateId":110326,"sourceAcquisition":{"filterWay":"1","drawItems":"","priceRaw":"300000","outOfPrint":false,"limitTip":"","currency":"园宅币（nArchitecture）；原作可用银两补差"},"sources":["K:\\JX3\\client\\ui\\Scheme\\Case\\Partner\\PartnerNpcInfo.txt","K:\\JX3\\client\\settings\\NpcAssisted\\NpcAssistedTemplate.tab","K:\\JX3\\client\\ui\\Image\\Partner\\GetPartner\\RuanGuiYun.tga"],"adaptation":["yaozong","fengtian","居业行精英管家","双兵","毒性",3],"weaponLabel":"短刃（本作适配）"},{"id":"companion_wenciqiu","officialTemplateId":8,"name":"温辞秋","nativeRole":"heal","weapon":null,"skill":"离经易道","introduction":"温辞秋，居业行聘请的精英管家，温和体贴，可施展部分离经易道招式。","collaboration":null,"npcTemplateId":110321,"sourceAcquisition":{"filterWay":"1","drawItems":"","priceRaw":"160000","outOfPrint":false,"limitTip":"","currency":"园宅币（nArchitecture）；原作可用银两补差"},"sources":["K:\\JX3\\client\\ui\\Scheme\\Case\\Partner\\PartnerNpcInfo.txt","K:\\JX3\\client\\settings\\NpcAssisted\\NpcAssistedTemplate.tab","K:\\JX3\\client\\ui\\Image\\Partner\\GetPartner\\WenCiQiu.tga"],"adaptation":["wanhua","fengtian","居业行精英管家","奇兵","混元",3],"weaponLabel":"判官笔（本作适配）"},{"id":"companion_nianxiaoxiong","officialTemplateId":9,"name":"年小熊","nativeRole":"heal","weapon":null,"skill":"补天诀","introduction":"年小熊，居业行聘请的管家，开朗天真，可施展部分补天诀招式。","collaboration":null,"npcTemplateId":110324,"sourceAcquisition":{"filterWay":"1","drawItems":"","priceRaw":"40000","outOfPrint":false,"limitTip":"","currency":"园宅币（nArchitecture）；原作可用银两补差"},"sources":["K:\\JX3\\client\\ui\\Scheme\\Case\\Partner\\PartnerNpcInfo.txt","K:\\JX3\\client\\settings\\NpcAssisted\\NpcAssistedTemplate.tab","K:\\JX3\\client\\ui\\Image\\Partner\\GetPartner\\NianXiaoXiong.tga"],"weaponLabel":"虫笛"},{"id":"companion_ruanxianzhou","officialTemplateId":10,"name":"阮闲舟","nativeRole":"heal","weapon":null,"skill":"灵素","introduction":"阮闲舟，居业行聘请的精英管家，端方稳重，可施展部分灵素招式。","collaboration":null,"npcTemplateId":110327,"sourceAcquisition":{"filterWay":"1","drawItems":"","priceRaw":"300000","outOfPrint":false,"limitTip":"","currency":"园宅币（nArchitecture）；原作可用银两补差"},"sources":["K:\\JX3\\client\\ui\\Scheme\\Case\\Partner\\PartnerNpcInfo.txt","K:\\JX3\\client\\settings\\NpcAssisted\\NpcAssistedTemplate.tab","K:\\JX3\\client\\ui\\Image\\Partner\\GetPartner\\RuanXianZhou.tga"],"adaptation":["yaozong","fengtian","居业行精英管家","双兵","毒性",3],"weaponLabel":"短刃（本作适配）"},{"id":"companion_rongrong","officialTemplateId":11,"name":"茸茸","nativeRole":"tank","weapon":null,"skill":"明尊琉璃体","introduction":"茸茸，居业行聘请的管家，可施展部分明尊琉璃体招式，嘴超甜哦，喵~","collaboration":null,"npcTemplateId":110325,"sourceAcquisition":{"filterWay":"1","drawItems":"","priceRaw":"300000","outOfPrint":false,"limitTip":"","currency":"园宅币（nArchitecture）；原作可用银两补差"},"sources":["K:\\JX3\\client\\ui\\Scheme\\Case\\Partner\\PartnerNpcInfo.txt","K:\\JX3\\client\\settings\\NpcAssisted\\NpcAssistedTemplate.tab","K:\\JX3\\client\\ui\\Image\\Partner\\GetPartner\\RongRong.tga"],"weaponLabel":"双刀"},{"id":"companion_yanziniang","officialTemplateId":12,"name":"燕子娘","nativeRole":"heal","weapon":null,"skill":"血泣","introduction":"燕子娘，明艳动人的神秘女子，风情万种但心眼颇多。《镖人》联动活动中获得。","collaboration":"镖人","npcTemplateId":120617,"sourceAcquisition":{"filterWay":"3","drawItems":"","priceRaw":"","outOfPrint":true,"limitTip":""},"sources":["K:\\JX3\\client\\ui\\Scheme\\Case\\Partner\\PartnerNpcInfo.txt","K:\\JX3\\client\\settings\\NpcAssisted\\NpcAssistedTemplate.tab","K:\\JX3\\client\\ui\\Image\\Partner\\GetPartner\\YanZiNiang.tga"],"adaptation":["wudu","wanling2023","镖人·联动纪念","气劲","阴性",4],"weaponLabel":"内力术法（本作适配）"},{"id":"companion_daoma","officialTemplateId":13,"name":"刀马","nativeRole":"tank","weapon":null,"skill":"龙行虎变","introduction":"刀马，身份不明的神秘镖客，行事豪放不羁，重情重义。《镖人》联动活动中获得。","collaboration":"镖人","npcTemplateId":120618,"sourceAcquisition":{"filterWay":"3","drawItems":"","priceRaw":"","outOfPrint":true,"limitTip":""},"sources":["K:\\JX3\\client\\ui\\Scheme\\Case\\Partner\\PartnerNpcInfo.txt","K:\\JX3\\client\\settings\\NpcAssisted\\NpcAssistedTemplate.tab","K:\\JX3\\client\\ui\\Image\\Partner\\GetPartner\\DaoMa.tga"],"adaptation":["badao","wanling2023","镖人·联动纪念","长兵","外功",4],"weaponLabel":"长刀（本作适配）"},{"id":"companion_lixingyun","officialTemplateId":14,"name":"李星云","nativeRole":"dps","weapon":null,"skill":"气经","introduction":"李星云，不良人首领，天资聪颖，为人正直。","collaboration":"画江湖之不良人","npcTemplateId":120906,"sourceAcquisition":{"filterWay":"2","drawItems":"5_45838;5_45839;","priceRaw":"","outOfPrint":false,"limitTip":""},"sources":["K:\\JX3\\client\\ui\\Scheme\\Case\\Partner\\PartnerNpcInfo.txt","K:\\JX3\\client\\settings\\NpcAssisted\\NpcAssistedTemplate.tab","K:\\JX3\\client\\ui\\Image\\Partner\\GetPartner\\LiXingYun.tga"],"adaptation":["chunyang","wanling2023","画江湖之不良人·联动纪念","短兵","混元",4],"weaponLabel":"长剑（本作适配）"},{"id":"companion_yuejiahe","officialTemplateId":15,"name":"月嘉禾","nativeRole":"support","weapon":"crescentBlade","skill":"月朔实录","introduction":"月朔门副门主，熟知百家武学，擅长看破敌人的弱点。","collaboration":null,"npcTemplateId":122730,"sourceAcquisition":{"filterWay":"2","drawItems":"5_45838;5_45839;","priceRaw":"","outOfPrint":false,"limitTip":""},"sources":["K:\\JX3\\client\\ui\\Scheme\\Case\\Partner\\PartnerNpcInfo.txt","K:\\JX3\\client\\settings\\NpcAssisted\\NpcAssistedTemplate.tab","K:\\JX3\\client\\ui\\Image\\Partner\\GetPartner\\YueJiaHe.Tga"],"adaptation":["wuxiang","wanling2023","月朔门副门主","奇兵","外功",3],"weaponLabel":"偃月刃"},{"id":"companion_hexian","officialTemplateId":16,"name":"贺闲","nativeRole":"dps","weapon":"qinAndSword","skill":"相知剑意","introduction":"贺闲，字逸之，长歌弟子，自幼琴剑双绝，对他人和自身的要求都十分严格。","collaboration":null,"npcTemplateId":123965,"sourceAcquisition":{"filterWay":"2","drawItems":"5_45838;5_45839;","priceRaw":"","outOfPrint":false,"limitTip":""},"sources":["K:\\JX3\\client\\ui\\Scheme\\Case\\Partner\\PartnerNpcInfo.txt","K:\\JX3\\client\\settings\\NpcAssisted\\NpcAssistedTemplate.tab","K:\\JX3\\client\\ui\\Image\\Partner\\GetPartner\\HeXian.Tga"],"adaptation":["changge","wanling2023","长歌侠客","奇兵","混元",3],"weaponLabel":"琴与剑"},{"id":"companion_feidajin","officialTemplateId":17,"name":"费大劲","nativeRole":"tank","weapon":"gauntlets","skill":"水斗神拳","introduction":"费大劲出身翁洲神拳帮，立志要以帮中拳法打败刀宗刀法。","collaboration":null,"npcTemplateId":124038,"sourceAcquisition":{"filterWay":"4","drawItems":"","priceRaw":"","outOfPrint":false,"limitTip":""},"sources":["K:\\JX3\\client\\ui\\Scheme\\Case\\Partner\\PartnerNpcInfo.txt","K:\\JX3\\client\\settings\\NpcAssisted\\NpcAssistedTemplate.tab","K:\\JX3\\client\\ui\\Image\\Partner\\GetPartner\\FeiDaJin.tga"],"adaptation":["gaibang","wanling2023","翁洲神拳帮","拳脚","外功",3],"weaponLabel":"拳套"},{"id":"companion_baique","officialTemplateId":22,"name":"白鹊","nativeRole":"dps","weapon":"dualSpears","skill":"寸险律","introduction":"白鹊出身安西军，现于天策府中执行任务，擅长双枪。","collaboration":null,"npcTemplateId":126944,"sourceAcquisition":{"filterWay":"2","drawItems":"5_45838;5_45839;","priceRaw":"","outOfPrint":false,"limitTip":""},"sources":["K:\\JX3\\client\\ui\\Scheme\\Case\\Partner\\PartnerNpcInfo.txt","K:\\JX3\\client\\settings\\NpcAssisted\\NpcAssistedTemplate.tab","K:\\JX3\\client\\ui\\Image\\Partner\\GetPartner\\BaiQue.Tga"],"adaptation":["tiance","wanling2023","安西军·天策任务","双兵","外功",3],"weaponLabel":"双枪"},{"id":"companion_gainie","officialTemplateId":29,"name":"盖聂","nativeRole":"dps","weapon":null,"skill":"纵剑","introduction":"鬼谷派纵剑术传人，被誉为大秦帝国最强的剑士，在大秦江湖享有“剑圣\"的名号。","collaboration":"秦时明月","npcTemplateId":131038,"sourceAcquisition":{"filterWay":"2","drawItems":"5_71080;5_71094;","priceRaw":"","outOfPrint":false,"limitTip":"活动已结束，仅能用【茶饼·秦月语茗·兑】和【茶饼·秦月语茗】喝茶。"},"sources":["K:\\JX3\\client\\ui\\Scheme\\Case\\Partner\\PartnerNpcInfo.txt","K:\\JX3\\client\\settings\\NpcAssisted\\NpcAssistedTemplate.tab","K:\\JX3\\client\\ui\\Image\\Partner\\GetPartner\\GeNie.tga"],"adaptation":["chunyang","shanhai","秦时明月·联动纪念","短兵","外功",4],"weaponLabel":"长剑（本作适配）"},{"id":"companion_weizhuang","officialTemplateId":30,"name":"卫庄","nativeRole":"dps","weapon":null,"skill":"横剑","introduction":"鬼谷派横剑术传人，曾任韩国大将军，现任流沙组织之主。","collaboration":"秦时明月","npcTemplateId":131039,"sourceAcquisition":{"filterWay":"2","drawItems":"5_71080;5_71094;","priceRaw":"","outOfPrint":false,"limitTip":"活动已结束，仅能用【茶饼·秦月语茗·兑】和【茶饼·秦月语茗】喝茶。"},"sources":["K:\\JX3\\client\\ui\\Scheme\\Case\\Partner\\PartnerNpcInfo.txt","K:\\JX3\\client\\settings\\NpcAssisted\\NpcAssistedTemplate.tab","K:\\JX3\\client\\ui\\Image\\Partner\\GetPartner\\WeiZhuang.tga"],"adaptation":["cangjian","shanhai","秦时明月·联动纪念","短兵","外功",4],"weaponLabel":"长剑（本作适配）"},{"id":"companion_lixiaoyao","officialTemplateId":31,"name":"李逍遥","nativeRole":"dps","weapon":null,"skill":"蜀山心法","introduction":"余杭客栈店小二。幼失怙恃，由开客栈的婶婶抚养长大，虽顽劣市井，却心怀仗剑之志。","collaboration":"仙剑奇侠传","npcTemplateId":132050,"sourceAcquisition":{"filterWay":"2","drawItems":"5_78564;","priceRaw":"","outOfPrint":false,"limitTip":"活动已结束，仅能用【茶饼·仙缘奇茗·兑】喝茶。"},"sources":["K:\\JX3\\client\\ui\\Scheme\\Case\\Partner\\PartnerNpcInfo.txt","K:\\JX3\\client\\settings\\NpcAssisted\\NpcAssistedTemplate.tab","K:\\JX3\\client\\ui\\Image\\Partner\\GetPartner\\LiXiaoYao.tga"],"adaptation":["chunyang","silu","仙剑奇侠传·联动纪念","短兵","混元",4],"weaponLabel":"长剑（本作适配）"},{"id":"companion_zhaolinger","officialTemplateId":32,"name":"赵灵儿","nativeRole":"heal","weapon":null,"skill":"女娲血脉","introduction":"女娲族后裔。外柔内刚、聪慧灵心，身负守护苍生的宿命，亦因神族血脉饱受命运桎梏。","collaboration":"仙剑奇侠传","npcTemplateId":132051,"sourceAcquisition":{"filterWay":"2","drawItems":"5_78564;","priceRaw":"","outOfPrint":false,"limitTip":"活动已结束，仅能用【茶饼·仙缘奇茗·兑】喝茶。"},"sources":["K:\\JX3\\client\\ui\\Scheme\\Case\\Partner\\PartnerNpcInfo.txt","K:\\JX3\\client\\settings\\NpcAssisted\\NpcAssistedTemplate.tab","K:\\JX3\\client\\ui\\Image\\Partner\\GetPartner\\ZhaoLingEr.Tga"],"adaptation":["wudu","silu","仙剑奇侠传·联动纪念","气劲","阴性",4],"weaponLabel":"内力术法（本作适配）"},{"id":"companion_jiangtang","officialTemplateId":33,"name":"姜棠","nativeRole":"dps","weapon":null,"skill":"冰心诀","introduction":"姜棠，快乐明媚的花坊掌柜、有钱姐姐，但也是令地下赌场闻风丧胆的不败赌神。","collaboration":null,"npcTemplateId":135326,"sourceAcquisition":{"filterWay":"2","drawItems":"5_45838;5_45839;","priceRaw":"","outOfPrint":false,"limitTip":""},"sources":["K:\\JX3\\client\\ui\\Scheme\\Case\\Partner\\PartnerNpcInfo.txt","K:\\JX3\\client\\settings\\NpcAssisted\\NpcAssistedTemplate.tab","K:\\JX3\\client\\ui\\Image\\Partner\\GetPartner\\JiangTang.Tga"],"adaptation":["qixiu","wanling2023","花坊掌柜","双兵","阴性",3],"weaponLabel":"剑舞与气劲（本作适配）"},{"id":"companion_lie","officialTemplateId":34,"name":"李萼","nativeRole":"dps","weapon":null,"skill":"无形者","introduction":"李萼，来自《刺客信条·王朝》。","collaboration":"刺客信条·王朝","npcTemplateId":136050,"sourceAcquisition":{"filterWay":"3","drawItems":"","priceRaw":"","outOfPrint":true,"limitTip":""},"sources":["K:\\JX3\\client\\ui\\Scheme\\Case\\Partner\\PartnerNpcInfo.txt","K:\\JX3\\client\\settings\\NpcAssisted\\NpcAssistedTemplate.tab","K:\\JX3\\client\\ui\\Image\\Partner\\GetPartner\\Lie.tga"],"adaptation":["lingxue","silu","刺客信条·王朝·联动纪念","短兵","外功",4],"weaponLabel":"袖剑（本作适配）"},{"id":"companion_jingtian","officialTemplateId":35,"name":"景天","nativeRole":"support","weapon":null,"skill":"玉满乾坤","introduction":"景天乃渝州永安当的小伙计。","collaboration":"仙剑奇侠传三","npcTemplateId":137253,"sourceAcquisition":{"filterWay":"3","drawItems":"","priceRaw":"","outOfPrint":true,"limitTip":""},"sources":["K:\\JX3\\client\\ui\\Scheme\\Case\\Partner\\PartnerNpcInfo.txt","K:\\JX3\\client\\settings\\NpcAssisted\\NpcAssistedTemplate.tab","K:\\JX3\\client\\ui\\Image\\Partner\\GetPartner\\JingTian.tga"],"adaptation":["cangjian","cangsheng","仙剑奇侠传三·联动纪念","短兵","混元",4],"weaponLabel":"长剑（本作适配）"},{"id":"companion_yuezhongshan","officialTemplateId":36,"name":"岳仲山","nativeRole":"tank","weapon":"sabreAndShield","skill":"铁骨衣","introduction":"岳仲山曾任苍云军中校尉，离开苍云军后以吃饷人的赏钱为生。","collaboration":null,"npcTemplateId":137962,"sourceAcquisition":{"filterWay":"2","drawItems":"5_45838;5_45839;","priceRaw":"","outOfPrint":false,"limitTip":""},"sources":["K:\\JX3\\client\\ui\\Scheme\\Case\\Partner\\PartnerNpcInfo.txt","K:\\JX3\\client\\settings\\NpcAssisted\\NpcAssistedTemplate.tab","K:\\JX3\\client\\ui\\Image\\Partner\\GetPartner\\YueZhongShan.Tga"],"adaptation":["cangyun","cangsheng","苍云军旧将","长兵","外功",3],"weaponLabel":"刀盾"},{"id":"companion_heqixian","officialTemplateId":37,"name":"何其鲜","nativeRole":"dps","weapon":"spatula","skill":"调鼎道","introduction":"何其鲜乃时宴舫弟子，以厨道入武，锅铲为兵，化翻炒切拨为招式，擅近身群攻。","collaboration":null,"npcTemplateId":140385,"sourceAcquisition":{"filterWay":"2","drawItems":"5_45838;5_45839;","priceRaw":"","outOfPrint":false,"limitTip":""},"sources":["K:\\JX3\\client\\ui\\Scheme\\Case\\Partner\\PartnerNpcInfo.txt","K:\\JX3\\client\\settings\\NpcAssisted\\NpcAssistedTemplate.tab","K:\\JX3\\client\\ui\\Image\\Partner\\GetPartner\\HeQiXian.Tga"],"weaponLabel":"锅铲与五味调料"}];
  const added=[],roster=[];
  for(const row of definitions){
    let hero=D.HEROES.find(h=>h.id===row.id);
    const nativeRole=row.nativeRole,role=nativeRole==='heal'?'healer':nativeRole==='support'?'dps':nativeRole;
    if(!hero){
      const [sect,expansionId,affiliation,weaponType,damageType,rarity]=row.adaptation,base=D.SECTS.find(s=>s.id===sect),chapter=D.EXPANSIONS.find(e=>e.id===expansionId);
      hero={id:row.id,name:row.name,sect,role,roles:[role],rarity,title:row.collaboration?'联动纪念侠影':'红尘侠影',
        skill:row.skill,portrait:base.portrait,weapon:row.weaponLabel,weaponType,damageType,weaponTypeAdapted:true,
        sourceUrls:[sourceUrl],sourceScope:'system-introduction',artId:row.id,affiliation,identityLabel:affiliation+'·'+row.name,
        desc:row.introduction+(nativeRole==='support'?'原作为辅助职责，本作适配为输出兼援护。':'')+'纪念结缘、五人战斗效果与版本编排为本作适配。',
        baseHp:role==='tank'?242:role==='healer'?192:208,baseAtk:role==='tank'?31:role==='healer'?33:37,baseDef:role==='tank'?20:14,
        recruitment:{type:'red-dust'},placement:{expansionId,location:chapter.name+'·红尘旧忆',sourceUrl,note:'本作策划的常驻纪念结缘章节，不代表原作推出时间或联动活动仍在开放。'},
        skillSourceType:'official-companion',skillSourceLabel:'原作侠影标签 · 效果改编',skillAdapted:true,
        skillSourceNote:'心法或特色标签取自本地正式侠影名册szNickName，并非完整招式列表；招式数值、冷却、品质技能与固有援护均为本作适配。',skillSourceUrl:null,systemSourceUrl:sourceUrl,
        identitySourceType:'official-companion-template',artSourceType:'official-reference',
        illustrationNote:'依据原作正式侠影原图独立重绘的像素立绘；不是原图，动作与比例为本作适配。'};
      D.HEROES.push(hero);added.push(hero);
    }
    Object.assign(hero,{redDust:true,redDustTemplateId:row.officialTemplateId,nativeRole,crossover:row.collaboration,
      officialHeartMethod:row.skill,officialWeapon:row.weapon,officialNpcTemplateId:row.npcTemplateId,
      redDustSourceFiles:row.sources,originalAcquisition:row.sourceAcquisition});
    // Preserve all four existing starter companions' stats, roles and recruitment.
    roster.push(hero);
  }
  root.JXCompanionsComplete={version:1,formalCount:27,added,roster:()=>roster.slice()};
})(globalThis);

;
(function(root){
  'use strict';
  const D=root.JXData,MAX_COPIES=1000000,SLOTS=4;
  const meta=id=>D.HEROES.find(h=>h.id===id),int=(v,max=MAX_COPIES)=>Number.isInteger(v)&&v>=0&&v<=max;
  const fail=message=>({ok:false,message}),done=(message,extra)=>({ok:true,message,...extra});
  const main=s=>s.heroes.find(h=>h.uid===s.playerUid)||s.heroes[0];
  function init(s){
    const fresh=!s.cards;
    if(fresh)s.cards={version:1,owned:{},supports:[],pity:{},draws:0,history:[],goal:'damage'};
    const c=s.cards;
    for(const h of s.heroes)if(h.uid!==main(s)?.uid&&!c.owned[h.id])c.owned[h.id]={copies:1,affection:0,locked:false};
    if(fresh)c.supports=s.team.map(uid=>s.heroes.find(h=>h.uid===uid)).filter(h=>h&&h.uid!==main(s)?.uid).slice(0,SLOTS).map(h=>h.id);
    c.supports=c.supports.filter(id=>c.owned[id]);
    // The old team remains in the save for compatibility, but these heroes are now background cards.
    return c;
  }
  function receive(s,id,isNew){
    if(!s.cards||id===main(s)?.id)return;
    const c=init(s);
    if(!c.owned[id])c.owned[id]={copies:1,affection:0,locked:false};
    else if(!isNew)c.owned[id].copies=Math.min(MAX_COPIES,c.owned[id].copies+1);
  }
  function effect(id,affection=0){
    const h=meta(id),rank=h?.rarity||1,friend=Math.min(5,Math.floor(affection/100));
    const power=1+friend*.08,role=h?.role||'dps';
    return {type:h?.weaponType||'气劲',damage:role==='dps'?(.012+rank*.006)*power:0,
      damageReduction:role==='tank'?(.01+rank*.004)*power:0,
      regen:role==='healer'?(.004+rank*.002)*power:0,
      rareDrop:(h?.hidden||h?.redDust? .006+rank*.003:.003)*power,
      label:role==='tank'?'护持减伤':role==='healer'?'回春调息':(h?.weaponType||'气劲')+'增伤'};
  }
  function collections(s){const c=init(s);return D.SECTS.map(sect=>{
    const catalog=D.HEROES.filter(h=>h.sect===sect.id&&h.id!==main(s)?.id),count=catalog.filter(h=>c.owned[h.id]).length,total=catalog.length;
    const tiers=[2,3,total].filter((v,i,a)=>v>0&&a.indexOf(v)===i).sort((a,b)=>a-b);
    return {id:sect.id,name:sect.name,count,total,tiers,active:tiers.filter(n=>count>=n).length,complete:count===total&&total>0};
  });}
  function bonuses(s){
    const c=init(s),count=Object.keys(c.owned).length,bonds=collections(s).reduce((n,x)=>n+x.active,0);
    const b={hp:Math.min(.2,count*.002)+Math.min(.18,bonds*.006),atk:Math.min(.15,count*.0015)+Math.min(.15,bonds*.005),def:Math.min(.15,count*.0015)+Math.min(.15,bonds*.005),crit:0,damageReduction:0,rareDrop:0,regen:0,damageByType:{}};
    for(const id of c.supports){const e=effect(id,c.owned[id]?.affection);b.damageByType[e.type]=(b.damageByType[e.type]||0)+e.damage;b.damageReduction+=e.damageReduction;b.rareDrop+=e.rareDrop;b.regen+=e.regen;}
    b.damageReduction=Math.min(.25,b.damageReduction);b.rareDrop=Math.min(.3,b.rareDrop);b.regen=Math.min(.08,b.regen);return b;
  }
  function applyParty(s,team,{live=false}={}){const b=bonuses(s);for(const h of team)if(h.uid===s.playerUid){
    const ratio=h.hp/h.maxHp;h.maxHp=Math.round(h.maxHp*(1+b.hp));h.hp=live?Math.min(h.maxHp,h.hp):Math.min(h.maxHp,Math.round(h.maxHp*ratio));
    h.atk*=1+b.atk;h.def*=1+b.def;h.cardResist=b.damageReduction;h.cardRegen=b.regen;h.cardDamageByType={...b.damageByType};
  }return team;}
  function assign(s,id){const c=init(s);if(!c.owned[id])return fail('尚未收藏这张侠客卡。');if(s.battle)return fail('请在本场战斗结束后调整助战。');
    if(c.supports.includes(id)){c.supports=c.supports.filter(x=>x!==id);return done('已将'+meta(id).name+'移回卡册。');}
    if(c.supports.length>=SLOTS)return fail('四个后台助战位已满，请先卸下一张卡。');c.supports.push(id);return done(meta(id).name+'已加入后台助战。');}
  function autoAssign(s,goal='damage'){
    const c=init(s);if(s.battle)return fail('请在本场战斗结束后调整助战。');
    const requested=typeof goal==='object'?['survival','loot'].includes(goal.goal)?goal.goal:goal.type||goal.goal:goal,type=requested==='survival'?'survival':requested==='loot'?'loot':requested;
    const score=id=>{const e=effect(id,c.owned[id].affection);return type==='survival'?e.damageReduction*4+e.regen*6+e.damage:type==='loot'?e.rareDrop*5+e.damage:e.damage*(D.WEAPON_TYPES?.includes(type)||['短兵','长兵','气劲','奇兵','拳脚','双兵','驭驶'].includes(type)?e.type===type?5:.2:1)+e.damageReduction*.4+e.regen*.5;};
    c.supports=Object.keys(c.owned).sort((a,b)=>score(b)-score(a)||(meta(b).rarity-meta(a).rarity)||a.localeCompare(b)).slice(0,SLOTS);c.goal=String(requested||'damage').slice(0,20);
    return done('已按'+(type==='survival'?'生存':type==='loot'?'寻宝':type==='damage'?'输出':type+'武学')+'配置 '+c.supports.length+' 张后台辅助卡。');
  }
  function befriend(s,id){const c=init(s),r=c.owned[id];if(!r)return fail('尚未收藏这张侠客卡。');if(r.affection>=500)return fail('好感已满。');if(s.silver<500)return fail('赠礼需要500银两。');s.silver-=500;r.affection=Math.min(500,r.affection+20);return done('赠礼成功，'+meta(id).name+'好感 +20。');}
  function pool(s,id='silver'){
    const ordinary=id==='silver',chapter=D.EXPANSIONS.find(e=>e.id===id),player=main(s)?.id;
    if(!ordinary&&!chapter)return null;
    const candidates=D.HEROES.filter(h=>h.id!==player&&(ordinary?!h.hidden&&!h.redDust&&h.rarity<=3&&(!h.placement||root.JXProgression?.isExpansionUnlocked(s,h.placement.expansionId)):h.placement?.expansionId===id));
    const groups=[1,2,3,4].map(rank=>({rank,cards:candidates.filter(h=>h.rarity===rank),weight:ordinary?[70,25,5,0][rank-1]:[55,30,13,2][rank-1]})).filter(g=>g.cards.length&&g.weight);
    if(!groups.length)return null;
    const sum=groups.reduce((n,g)=>n+g.weight,0);for(const g of groups)g.chance=g.weight/sum;
    const highest=Math.max(...groups.map(g=>g.rank)),limit=ordinary?30:60;
    return {id,name:ordinary?'江湖寻访':chapter.name+'·侠影',currency:ordinary?'银两':'通宝·'+chapter.name,cost:ordinary?1200:80,limit,highest,groups,cards:candidates,
      unlocked:ordinary||!!root.JXProgression?.isExpansionUnlocked(s,id),pity:init(s).pity[id]||0,balance:ordinary?s.silver:(s.endgame?.records?.[id]?.currency||0)};
  }
  function draw(s,id='silver',quantity=1,rng=Math.random){
    const p=pool(s,id);if(!p?.unlocked)return fail('先解锁对应资料片，再寻访该版本侠影。');if(![1,10].includes(quantity))return fail('仅支持单次或十次寻访。');if(p.balance<p.cost*quantity)return fail(p.currency+'不足。');
    if(id==='silver')s.silver-=p.cost*quantity;else s.endgame.records[id].currency-=p.cost*quantity;
    const c=init(s),drawn=[],roll=()=>Math.max(0,Math.min(.999999999,Number(rng())||0));
    for(let i=0;i<quantity;i++){
      let group;
      if((c.pity[id]||0)+1>=p.limit)group=p.groups.find(g=>g.rank===p.highest);
      else{let n=roll();group=p.groups[p.groups.length-1];for(const g of p.groups){n-=g.chance;if(n<0){group=g;break;}}}
      const hero=group.cards[Math.floor(roll()*group.cards.length)],isNew=!s.heroes.some(h=>h.id===hero.id);
      root.JXEngine.addHero(s,hero.id);c.pity[id]=group.rank===p.highest?0:(c.pity[id]||0)+1;c.draws++;
      drawn.push({id:hero.id,name:hero.name,rarity:hero.rarity,isNew});
    }
    c.history=[...drawn.reverse(),...c.history].slice(0,20);
    return done('寻访获得：'+drawn.map(h=>h.name+(h.isNew?'（新卡）':'（重复卡）')).join('、')+'。',{drawn,cost:p.cost*quantity});
  }
  function recycle(s,id,quantity=1,currency='silver'){
    const c=init(s),r=c.owned[id],h=meta(id);if(!r||!h)return fail('卡牌不存在。');if(r.locked)return fail('请先取消卡牌保护。');
    const amount=quantity==='all'?r.copies-1:quantity;if(!Number.isInteger(amount)||amount<1||amount>=r.copies)return fail('只可回收重复卡，始终保留最后一张。');
    if(!['silver','chapter'].includes(currency))return fail('回收币种无效。');
    const chapter=h.placement?.expansionId;
    if(currency==='chapter'&&(!chapter||!root.JXProgression?.isExpansionUnlocked(s,chapter)))return fail('该卡暂不能回收为对应版本通宝。');
    const unit=currency==='silver'?[0,120,300,700,1400][h.rarity]:[0,5,10,20,40][h.rarity];r.copies-=amount;
    if(currency==='silver')s.silver=Math.min(1e12,s.silver+unit*amount);else{root.JXEndgame?.init(s);s.endgame.records[chapter].currency=Math.min(1e12,s.endgame.records[chapter].currency+unit*amount);}
    return done('已回收'+h.name+'重复卡 ×'+amount+'，获得'+(currency==='silver'?'银两':'对应版本通宝')+' ×'+unit*amount+'。');
  }
  function protect(s,id){const r=init(s).owned[id];if(!r)return fail('卡牌不存在。');r.locked=!r.locked;return done(r.locked?'已保护重复卡，不可回收。':'已取消卡牌保护。');}
  function validateSave(s){
    if(!s.cards){init(s);return true;}const c=s.cards,object=v=>v&&typeof v==='object'&&!Array.isArray(v);
    if(!object(c)||c.version!==1||!object(c.owned)||!object(c.pity)||!Array.isArray(c.supports)||c.supports.length>SLOTS||new Set(c.supports).size!==c.supports.length||!int(c.draws,1e12)||!Array.isArray(c.history)||c.history.length>20||typeof c.goal!=='string'||c.goal.length>20)throw Error('侠客卡册记录无效。');
    for(const [id,r]of Object.entries(c.owned))if(!meta(id)||!s.heroes.some(h=>h.id===id)||id===main(s)?.id||!object(r)||!int(r.copies)||r.copies<1||!int(r.affection,500)||typeof r.locked!=='boolean')throw Error('侠客卡牌库存无效。');
    if(c.supports.some(id=>!c.owned[id])||Object.entries(c.pity).some(([id,n])=>id!=='silver'&&!D.EXPANSIONS.some(e=>e.id===id)||!int(n,60)))throw Error('侠客助战或保底记录无效。');
    for(const h of c.history)if(!object(h)||!meta(h.id)||typeof h.name!=='string'||h.name.length>80||!int(h.rarity,4)||typeof h.isNew!=='boolean')throw Error('寻访历史无效。');init(s);return true;
  }
  root.JXCards=Object.freeze({init,receive,effect,collections,bonuses,applyParty,assign,autoAssign,befriend,pool,draw,recycle,protect,validateSave,SLOTS});
})(globalThis);

;
(function (root) {
  'use strict';
  const D = root.JXData;
  const pendingLoot=new WeakSet();
  const SLOTS = [
    ['weapon','武器',2],['head','帽子',2],['chest','上衣',2],['waist','腰带',2],['wrist','护腕',2],['legs','下装',2],['feet','鞋子',2],
    ['necklace','项链',1],['pendant','腰坠',1],['ring1','戒指·左',1],['ring2','戒指·右',1],['ranged','暗器',0]
  ].map(([id,name,sockets])=>({id,name,sockets}));
  const COLORS = [
    {id:'attack',name:'彩·见切·斩铁·锐刃',desc:'外功均衡：会心、破防、攻击。',role:'dps',attributes:[['crit',.04],['damageMultiplier',.08],['atk',25]]},
    {id:'guard',name:'彩·御劲·坚壁·固本',desc:'承伤：防御、减伤、气血。',role:'tank',attributes:[['def',12],['damageReduction',.06],['hp',180]]},
    {id:'heal',name:'彩·疗伤·会心·济世',desc:'治疗：基础疗效、会心、治疗效果。',role:'healer',attributes:[['atk',10],['crit',.04],['healMultiplier',.16]]},
    {id:'critical',name:'彩·见切·痛击·斩铁',desc:'外功双会：会心、会心效果、破防。',role:'dps',attributes:[['crit',.05],['damageMultiplier',.07],['damageMultiplier',.06]]},
    {id:'inner',name:'彩·雷鸣·混沌·破魔',desc:'内功攻击：内功基础、内功破防、会心。',role:'dps',attributes:[['atk',22],['damageMultiplier',.08],['crit',.04]]},
    {id:'strain',name:'彩·无双·痛击·狂攻',desc:'首领输出：无双、会心效果、武器伤害。',role:'dps',attributes:[['damageMultiplier',.05],['damageMultiplier',.07],['atk',30]]},
    {id:'haste',name:'彩·加速·疗伤·济世',desc:'持续治疗：加速、治疗攻击、治疗效果。',role:'healer',attributes:[['healMultiplier',.05],['atk',18],['healMultiplier',.13]]},
    {id:'vitality',name:'彩·体质·御劲·坚壁',desc:'生存承伤：气血、御劲、防御。',role:'tank',attributes:[['hp',220],['damageReduction',.05],['def',18]]},
    {id:'balanced',name:'彩·根骨·会心·疗伤',desc:'治疗兼生存：气血、会心、治疗效果。',role:'healer',attributes:[['hp',100],['crit',.04],['healMultiplier',.12]]}
  ];
  const ARCHETYPES={balanced:{name:'均衡',primary:.55,crit:.00012,penetration:.0001},power:{name:'主属性精简',primary:1.55},precision:{name:'双会散件',primary:.5,crit:.00032,criticalEffect:.0002},breach:{name:'破防无双散件',primary:.5,penetration:.0003,strain:.0002},vitality:{name:'体质御劲',primary:.5,hp:2.5,def:.16,toughness:.00018},healing:{name:'根骨疗伤',primary:.8,healing:.00028,haste:.00012}};
  const ATTRIBUTE_NAMES={damageMultiplier:'伤害',healMultiplier:'治疗效果',damageReduction:'减伤',atk:'攻击',strength:'力道',agility:'身法',spirit:'元气',constitution:'根骨',vitality:'体质',crit:'会心',criticalEffect:'会心效果',penetration:'破防',strain:'无双',haste:'加速',toughness:'御劲',healing:'疗伤',hp:'气血',def:'防御'};
  // Default DPS follows the first current-era orange weapon: Zixia for Chunyang,
  // Tianluo for Tangmen. Tank/healer loadouts use vitality/root respectively.
  const PRIMARY_BY_SECT={chunyang:'constitution',tiance:'strength',wanhua:'spirit',qixiu:'constitution',cangjian:'agility',shaolin:'spirit',wudu:'constitution',tangmen:'spirit',mingjiao:'spirit',gaibang:'strength',cangyun:'agility',changge:'constitution',badao:'strength',penglai:'agility',lingxue:'agility',yantian:'spirit',yaozong:'constitution',daozong:'strength',wanling:'agility',duanshi:'spirit',wuxiang:'constitution'};
  const primaryAttribute=(hero,item)=>item?.primary||(role(hero)==='tank'||item?.archetype==='vitality'?'vitality':role(hero)==='healer'?'constitution':PRIMARY_BY_SECT[item?.schoolSect||item?.sect||meta(hero)?.sect]||'strength');

  function itemAttributes(hero,item){const spec=ARCHETYPES[item?.archetype];if(!spec)return {};const value=(4+item.level*.75)*({rare:1,epic:1.5,legendary:2.2}[item.rarity]||1)*tierScale(item),out={[primaryAttribute(hero,item)]:Math.round(value*spec.primary)};for(const [key,n] of Object.entries(spec))if(!['name','primary'].includes(key))out[key]=n<.01?value*n:Math.round(value*n);return out;}
  const MATERIALS = {
    70:['飞仙玄晶','天外陨铁'],80:['化玉玄晶','乌金陨铁'],90:['沉沙玄晶','浮屠陨铁'],95:['醉月玄晶','星雷陨铁'],
    100:['归墟玄晶','蜃海陨铁'],110:['天乙玄晶','星络陨铁'],120:['太一玄晶','劫烬陨铁'],130:['昆玉玄晶','鸣沙陨铁'],50:['铸天玄晶','泽天陨铁']
  };
  const RECIPES = [
    {id:'orange70',era:70,name:'剑侠情缘 · 飞仙神兵',level:12,mode:'exchange',note:'飞仙玄晶与200天外陨铁合炼，再交叶鸦换取神兵；70级没有套用后世神剑冢试炼。'},
    {id:'orange80',era:80,name:'巴蜀风云 · 神剑冢古法',level:20,mode:'classic',note:'完整保留经典神剑冢流程；现行端游另有商店简化兑换入口。'},
    {id:'orange90',era:90,name:'安史之乱 · 沉沙神兵',level:30,mode:'classic',note:'沉沙玄晶与200浮屠陨铁合炼；神剑冢叶英认可，霸刀另走柳静海分支。'},
    {id:'orange95',era:95,name:'剑胆琴心 · 醉月神兵',level:38,mode:'classic',note:'醉月玄晶与200星雷陨铁合炼；聆听来历后，须通过叶英或柳静海试炼。'},
    {id:'orange100',era:100,name:'世外蓬莱 · 归墟神兵',level:46,mode:'classic',note:'归墟玄晶与200蜃海陨铁合炼；藏剑叶英与霸刀柳静海各有任务分支。'},
    {id:'orange110',era:110,name:'奉天证道 · 天乙神兵',level:53,mode:'classic',note:'天乙玄晶与200星络陨铁合炼；藏剑·乱世叶镜池指引，霸刀采用柳昭明指引。'},
    {id:'orange120',era:120,name:'横刀断浪 · 太一神兵',level:60,mode:'growth',note:'先以玄晶寻访铸剑名家，获得初阶神兵，再以陨铁四次升品。'},
    {id:'orange130',era:130,name:'丝路风语 · 昆玉神兵',level:75,mode:'growth',note:'磐渊杨北山指引，古剑台认可；鸣沙陨铁每次50块，共四次。'},
    {id:'orange50',era:50,name:'苍生铸世 · 铸天神兵',level:90,mode:'growth',note:'新世代50级是原作等级压缩后的版本标识；本作继续以历练等级衡量战力。'}
  ].map(r=>({...r,bigIron:MATERIALS[r.era][0],smallIron:MATERIALS[r.era][1]}));
  const NAMES50 = {
    shaolin:['万骨回澜','海印三昧'],wanhua:['烂柯','白鹭忘言'],tiance:['寒锋凌日','关山征魂'],chunyang:['赤瞳照业','寒崖听籁'],
    qixiu:['冽心','游光引夜'],wudu:['承瞑愿','觉梦吟'],tangmen:['回霆','烛钧'],cangjian:['霜塞南还·京江北誓'],gaibang:['青龙映夜'],
    mingjiao:['圣火渡','望明'],cangyun:['边魂不寐','孤照'],changge:['志介','不复'],badao:['悬翎在握'],penglai:['孤游万里'],
    lingxue:['绝翳曜明'],yantian:['葛天八阕'],yaozong:['鉴魄证身','天仙子'],daozong:['一隙见瀚'],wanling:['穹霄待游'],duanshi:['龙影蔷微'],wuxiang:['天羊盏']
  };
  const NAMES80 = {chunyang:['玉清玄明','吞吴'],tiance:['碎魂','摧城'],wanhua:['碧落','鸿雁'],qixiu:['幽月·乱花','轻离'],shaolin:['龙木金藤','白衣焚天'],cangjian:['御风·织炎断尘'],wudu:['浴凰','鸣雷惊蛰'],tangmen:['孔雀羽'],mingjiao:['浮沉照影'],gaibang:['霜月明'],cangyun:['题龙旐','征天'],changge:['猗兰','洛神清音'],badao:['雪怒'],penglai:['金乌曜日'],lingxue:['无芒'],yantian:['蛇身受苦']};
  const NAMES70 = {shaolin:['白骨碎云','西天'],wanhua:['断鬼','苍龙'],tiance:['焚海','初尘'],chunyang:['留情','蛟影'],qixiu:['赤练蓝翼','寒铁冰魄']};
  const NAMES90 = {shaolin:['燃木','莲心观佛'],wanhua:['落凤','文曲之聿'],tiance:['火龙沥泉枪','溯流'],chunyang:['赤霄红莲','雪名剑'],qixiu:['干将·莫邪','紫烟沉'],wudu:['太上忘情','枫木晚晴'],tangmen:['摧山弩','凤尾天机'],cangjian:['千叶长生剑·泰阿剑'],gaibang:['炙狱邪龙'],mingjiao:['明王镇狱','焚三世'],badao:['血悲']};
  const NAMES95 = {shaolin:['浮心·劫','莲华·缘'],wanhua:['墨颠','兰亭香雪'],tiance:['紫龙寂地','吞虹'],chunyang:['渊微指玄','周流星位'],qixiu:['寒声·寂影','九天悬梦'],wudu:['绛玉拨云','灵知'],tangmen:['造化异轨','碎屏沉星'],cangjian:['西天聆雪·弱水'],gaibang:['涯风嘲雨'],mingjiao:['残月惊天','执手'],cangyun:['朱轩怀雀','修罗鬼面'],changge:['青玉流','盈缺'],badao:['新亭侯']};
  const NAMES100 = {shaolin:['涅槃','荣枯'],wanhua:['悲声','千山月影'],tiance:['赤乌流火','神威'],chunyang:['霜影玄玑','瀚海长风'],qixiu:['羲和凰羽','沧澜·沉歌'],wudu:['蛇影迷蝶','咫尺韶华'],tangmen:['鹫翎诡夺','螭首千机'],cangjian:['君行四海·鹿卢'],gaibang:['厉风炽海'],mingjiao:['阴阳往极','圣炎耀尊'],cangyun:['十律守心·猊焰','十律守心·犴魂'],changge:['青雀无尘','念庭兰'],badao:['沧骨曜月'],penglai:['寒魄玉心'],yaozong:['幽鹿泽','流云孤光']};
  const NAMES110 = {shaolin:['泥犁之狱','礼敬诸佛'],wanhua:['闲心','日月之昭'],tiance:['泣血','岩鳞'],chunyang:['松间云鹤','玄鹤唳天'],qixiu:['风雪关河','寒枝芳信'],wudu:['昆山玉碎','烛幽'],tangmen:['古雀翎','柬河轻风'],cangjian:['麒天·麟战'],gaibang:['燕枝行'],mingjiao:['悬炎鸱吻','洞虚灵蛇'],cangyun:['白狼河北','四面边声'],changge:['天下士人','求仁'],badao:['以彼道'],penglai:['仙舆'],lingxue:['羽书朝继'],yantian:['归一'],yaozong:['银羽南徊','秋江白鹭']};
  const NAMES120 = {shaolin:['桑莲妙境','诸恶断尽'],wanhua:['璃光浮远','鲸落'],tiance:['旷野孤疆','威风吟'],chunyang:['苍冥游','风霆肃'],qixiu:['飞霜绛露','玉叶瑶华'],wudu:['墨语沉香','众灵生息'],tangmen:['罪骨浮屠','摧霜'],cangjian:['寄骨·螭尘'],gaibang:['拾牙'],mingjiao:['血月','罪棘刺薇'],cangyun:['孤焰','致远'],changge:['抚今','天音非梦'],badao:['沉夜重雪'],penglai:['山海云涯'],lingxue:['山河同渡'],yantian:['月升海楼'],yaozong:['鹿王本生','夕臾'],daozong:['绝地天通刀'],wanling:['庄生晓梦'],duanshi:['他山月']};
  const NAMES130 = {shaolin:['昭佛光','降魔境'],wanhua:['意真','折枝花满'],tiance:['掠炎','朱曦重明'],chunyang:['仙灵','镇恶'],qixiu:['龙鲤','钗蝶语双'],wudu:['蜕骨','逾潮声'],tangmen:['碧岚幽炎','银羽雪辉'],cangjian:['伏魔悲音·寂夜听雷'],gaibang:['暴龙震江'],mingjiao:['瀚海引','圣辉月雪'],cangyun:['天下宏愿','驭焰'],changge:['栖贤韵','万象金声'],badao:['碧血豪侠'],penglai:['七月嘉树'],lingxue:['长安'],yantian:['子不语'],yaozong:['烬灭','幽微夜'],daozong:['烛微刀'],wanling:['金乌回首'],duanshi:['伏龙阳焰']};
  const WEAPON_NAMES={70:NAMES70,80:NAMES80,90:NAMES90,95:NAMES95,100:NAMES100,110:NAMES110,120:NAMES120,130:NAMES130,50:NAMES50};
  const aliases = {beityaoyao:'yaozong',beitianyaozong:'yaozong',lingxuege:'lingxue',yantianzong:'yantian',wanlingshanzhuang:'wanling',wuxianglou:'wuxiang'};
  const meta = hero => D.HEROES.find(x=>x.id===hero?.id);
  const sectId = hero => aliases[meta(hero)?.sect] || meta(hero)?.sect;
  const role = hero => root.JXEngine?.getRole?.(hero) || hero.role || meta(hero)?.role || 'dps';
  const clone = x => JSON.parse(JSON.stringify(x));
  const integer = (x,min=0,max=1e9) => Number.isInteger(x)&&x>=min&&x<=max;
  const obj = x => !!x&&typeof x==='object'&&!Array.isArray(x);
  const fail = message => ({ok:false,message});
  const success = (message,extra={}) => ({ok:true,message,...extra});
  const roll = rng => Math.max(0,Math.min(.999999,Number(rng())||0));
  const owned = (state,uid) => state.heroes.find(x=>x.uid===uid);
  const slotDef = id => SLOTS.find(x=>x.id===id);
  const getRecipe = id => RECIPES.find(x=>x.id===id);
  const expansionKnown = id => (D.EXPANSIONS||[]).some(x=>x.id===id);
  const currentExpansion = state => root.JXProgression?.current(state)?.expansion || (D.EXPANSIONS||[]).find(x=>x.id===(D.ROUTES||[]).find(r=>r.id===state.routeId)?.expansionId) || D.EXPANSIONS?.[0];
  const expansionForItem = item => item?.expansionId || (item?.recipeId?(D.EXPANSIONS||[]).find(x=>x.era===getRecipe(item.recipeId)?.era)?.id:null) || (D.EXPANSIONS||[]).find(x=>x.setName===item?.set)?.id || D.EXPANSIONS?.[0]?.id;
  const colorKey = (id,level=1) => level===1?id:`${id}:${level}`;
  const tierScale = item => ({field:.8,dungeon:1.15,raid:1.65}[item?.tier]||1)*(root.JXCombatRules?Math.pow(1.035,(item?.level||1)-1):1);
  function parseColor(key,level){const match=typeof key==='string'&&/^([a-z]+)(?::([2-6]))?$/.exec(key);if(!match||!COLORS.some(c=>c.id===match[1]))return null;const grade=level===undefined?Number(match[2]||1):level;if(!integer(grade,1,6)||match[2]&&grade!==Number(match[2]))return null;return {id:match[1],level:grade,key:colorKey(match[1],grade)};}
  // Refinement, sockets and weapon color belong to this duty's slot, so gear
  // replacement keeps the investment while rebinding its expansion identity.
  function changeSeason(hero,item){
    hero.enhancements??={};const id=expansionForItem(item),en=hero.enhancements[item.slot],previous=hero.equipment?.[item.slot];
    const oldId=en?.expansionId||(previous?expansionForItem(previous):null),changed=!!oldId&&oldId!==id;
    if(!en)hero.enhancements[item.slot]={refine:0,sockets:[],expansionId:id};
    else en.expansionId=id;
    return changed;
  }
  function projectedLoadout(hero,gear){const copy={...hero,equipment:{...hero.equipment},enhancements:clone(hero.enhancements||{})};for(const item of Object.values(gear))if(item.uid!==hero.equipment?.[item.slot]?.uid)changeSeason(copy,item);copy.equipment=gear;return copy;}
  function init(state) {
    if(!state.equipment) state.equipment={version:1,bag:[],materials:{},stones:{1:8},colors:{attack:1,guard:1,heal:1},quests:{},nextId:1,lootCount:0,dungeons:{}};
    const e=state.equipment;
    if(e.vault)while(e.bag.length<300&&e.vault.length)e.bag.push(e.vault.shift());
    for(const h of state.heroes||[]){if(!h.equipment)h.equipment={};if(!h.enhancements)h.enhancements={};}
    return e;
  }
  const cultivationError=(state,uid)=>state.characterModel&&uid!==state.playerUid?'同伴只提升等级，装备与武学养成仅用于主角。':null;
  function migrateRoster(state){
    const first=state.heroes?.[0];if(!first)return;
    if(state.playerUid!==undefined&&!state.heroes.some(h=>h.uid===state.playerUid))throw new Error('主角身份无效。');
    state.playerUid=state.playerUid||first.uid;state.characterModel='single-protagonist-v1';const e=init(state);e.vault??=[];
    for(const h of state.heroes){h.isPlayer=h.uid===state.playerUid;if(h.isPlayer)continue;
      const loadouts=[h,...Object.values(h.loadouts||{})];for(const loadout of loadouts){for(const item of Object.values(loadout.equipment||{})){if(e.bag.length<300)e.bag.push(item);else e.vault.push(item);}for(const en of Object.values(loadout.enhancements||{})){const paid=(en.refine||0)*((en.refine||0)+1)/2;e.stones[1]=Math.min(1e9,(e.stones[1]||0)+paid);state.silver=Math.min(1e12,state.silver+paid*80);for(const stone of en.sockets||[])e.stones[stone]=Math.min(1e9,(e.stones[stone]||0)+1);}if(loadout.colorStone){const key=colorKey(loadout.colorStone,loadout.colorStoneLevel||1);e.colors[key]=Math.min(1e9,(e.colors[key]||0)+1);}}
      h.equipment={};h.enhancements={};delete h.colorStone;delete h.colorStoneLevel;delete h.loadouts;
      if(h.skillLevel){for(let i=0;i<h.skillLevel;i++){h.insight+=10+i*8;state.silver=Math.min(1e12,state.silver+300*(i+1));}h.skillLevel=0;}
      const player=state.heroes.find(x=>x.uid===state.playerUid);if(h.insight){player.insight=Math.min(1e9,(player.insight||0)+h.insight);h.insight=0;}
      h.hp=Math.min(h.hp,root.JXEngine.getHeroStats(h).hp);
    }
    if(!state.team.includes(state.playerUid))state.team=[state.playerUid,...state.team].slice(0,5);
    for(let i=0;i<state.presets.length;i++)if(state.presets[i].length&&!state.presets[i].includes(state.playerUid))state.presets[i]=[state.playerUid,...state.presets[i]].slice(0,5);
    // Older releases used the encounter level for raid drops, making raid armor
    // weaker than squad gear. Preserve every item and upgrade its level in place.
    const player=owned(state,state.playerUid),loadouts=[player,...Object.values(player?.loadouts||{})];let recovered=false;
    for(const item of [...e.bag,...e.vault,...loadouts.flatMap(loadout=>Object.values(loadout?.equipment||{}))]){
      if(item.rarity!=='epic'||item.tier!=='raid')continue;
      const index=D.EXPANSIONS.findIndex(expansion=>expansion.id===item.expansionId);
      if(index>=0&&item.level<10+index*5){item.level=10+index*5;recovered=true;}
    }
    if(recovered)pendingLoot.add(state);
  }
  function switchLoadout(state,hero,nextRole){
    if(!state.characterModel||hero.uid!==state.playerUid)return;
    const previous=role(hero);if(previous===nextRole)return;hero.loadouts??={};
    hero.loadouts[previous]={equipment:hero.equipment||{},enhancements:hero.enhancements||{},...(hero.colorStone?{colorStone:hero.colorStone,colorStoneLevel:hero.colorStoneLevel||1}:{})};
    const next=hero.loadouts[nextRole]||{equipment:{},enhancements:{}};delete hero.loadouts[nextRole];
    hero.equipment=next.equipment;hero.enhancements=next.enhancements;delete hero.colorStone;delete hero.colorStoneLevel;if(next.colorStone){hero.colorStone=next.colorStone;hero.colorStoneLevel=next.colorStoneLevel||1;}
  }
  function enhancements(hero,slot) {
    if(!hero.enhancements)hero.enhancements={};
    if(!hero.enhancements[slot])hero.enhancements[slot]={refine:0,sockets:[],expansionId:expansionForItem(hero.equipment?.[slot])};
    if(!hero.enhancements[slot].expansionId)hero.enhancements[slot].expansionId=expansionForItem(hero.equipment?.[slot]);
    return hero.enhancements[slot];
  }
  function createItem(state,options={},lootPolicy=null) {
    const e=init(state),slot=slotDef(options.slot)?options.slot:'weapon';
    const item={uid:`gear_${e.nextId++}`,slot,level:Math.min(100,Math.max(1,Math.floor(options.level||5))),rarity:options.rarity||'rare',sect:slot==='weapon'?(options.sect||null):null,
      set:options.set||null,effect:options.effect||null,recipeId:options.recipeId||null,role:options.role||null,stage:options.stage||0,name:options.name||`${options.set||'江湖'}·${slotDef(slot).name}`,source:options.source||'野外历练',expansionId:options.expansionId||currentExpansion(state)?.id};
    if(options.tier)item.tier=options.tier;
    const player=owned(state,state.playerUid)||state.heroes[0];
    if(options.archetype||root.JXCombatRules)item.archetype=ARCHETYPES[options.archetype]?options.archetype:role(player)==='tank'?'vitality':role(player)==='healer'?'healing':'balanced';
    if(options.schoolSect&&item.set)item.schoolSect=options.schoolSect;
    if(item.archetype)item.primary=['strength','agility','spirit','constitution','vitality'].includes(options.primary)?options.primary:primaryAttribute(player,item);
    if(e.bag.length>=300&&lootPolicy?.automatic)makeLootRoom(state,item,lootPolicy.messages);
    if(e.bag.length>=300){
      if(lootPolicy?.preserveMissing&&(e.vault?.length||0)<5000){(e.vault??=[]).push(item);return item;}
      e.stones[1]=(e.stones[1]||0)+4;return null;
    }
    e.bag.push(item); return item;
  }
  function permitted(hero,item){return item && (!item.sect||item.sect===meta(hero)?.sect) && (!item.schoolSect||item.schoolSect===meta(hero)?.sect) && (!item.role||item.role===role(hero));}
  function equip(state,uid,itemUid) {if(cultivationError(state,uid))return fail(cultivationError(state,uid));
    const e=init(state),h=owned(state,uid),index=e.bag.findIndex(x=>x.uid===itemUid);
    if(state.battle)return fail('请等待当前战斗结束后整备。');
    if(!h||index<0)return fail('侠客或装备不存在。');
    const item=e.bag[index]; if(!permitted(h,item))return fail('这件兵器的门派或职责与侠客不符。');
    const previous=h.equipment[item.slot],seasonChanged=changeSeason(h,item);e.bag.splice(index,1);if(previous)e.bag.push(previous);h.equipment[item.slot]=item;
    clampHealth(h);return success(`已装备${item.name}，保留部位精炼与镶嵌。`,{seasonChanged});
  }
  function unequip(state,uid,slot) {if(cultivationError(state,uid))return fail(cultivationError(state,uid));
    const e=init(state),h=owned(state,uid);if(state.battle)return fail('请等待当前战斗结束后整备。');
    if(!h?.equipment[slot])return fail('这个部位没有装备。');if(e.bag.length>=300)return fail('装备行囊已满，请先分解。');
    e.bag.push(h.equipment[slot]);delete h.equipment[slot];clampHealth(h);return success('装备已收入行囊，部位精炼与熔嵌保留。');
  }
  function clampHealth(h){if(root.JXEngine)h.hp=Math.min(h.hp,root.JXEngine.getHeroStats(h).hp);}
  function toggleLock(state,itemUid){const item=state.equipment?.bag.find(x=>x.uid===itemUid);if(!item)return fail('装备不存在。');item.locked=!item.locked;return success(item.locked?'已锁定装备，一键分解将保留。':'已解除装备锁定。');}
  function salvage(state,itemUid){const e=init(state),i=e.bag.findIndex(x=>x.uid===itemUid);if(i<0)return fail('装备不存在。');if(e.bag[i].locked)return fail('装备已锁定，请先解锁。');if(e.bag[i].rarity==='legendary')return fail('稀世神兵不可分解。');const amount=e.bag[i].rarity==='epic'?8:3;if((e.stones[1]||0)+amount>1e9)return fail('一级五行石已接近持有上限。');e.bag.splice(i,1);e.stones[1]=(e.stones[1]||0)+amount;return success(`分解得到 ${amount} 颗一级五行石。`);}
  function makeLootRoom(state,incoming,messages){
    const e=state.equipment,h=owned(state,state.playerUid);if(!h||!permitted(h,incoming))return;
    const quality={rare:1,epic:2,legendary:3},tier={field:0,dungeon:1,raid:2};
    const profile=item=>[item.slot,item.sect||'',item.schoolSect||'',item.role||'',item.primary||'',item.archetype||'',item.set||'',item.effect||''].join('|');
    const rank=item=>[quality[item.rarity]||0,item.level,tier[item.tier]||0];
    const dominates=(a,b)=>profile(a)===profile(b)&&(a.expansionId===b.expansionId||b.tier!=='raid')&&rank(a).every((n,i)=>n>=rank(b)[i]);
    const retained=[incoming,...e.bag,...Object.values(h.equipment||{}),...Object.values(h.loadouts||{}).flatMap(loadout=>Object.values(loadout.equipment||{}))];
    // Keep alternative stats, set identities and spare-duty gear. Only remove a
    // piece when an equivalent-or-better representative will remain available.
    const candidates=e.bag.filter(item=>!item.locked&&item.rarity!=='legendary'&&rank(incoming).every((n,i)=>n>=rank(item)[i])&&permitted(h,item)&&(!item.primary||item.primary===primaryAttribute(h))&&retained.some(other=>other.uid!==item.uid&&dominates(other,item))&&(e.stones[1]||0)+(item.rarity==='epic'?8:3)<=1e9);
    candidates.sort((a,b)=>Number(dominates(incoming,b))-Number(dominates(incoming,a))||(quality[a.rarity]||0)-(quality[b.rarity]||0)||(tier[a.tier]||0)-(tier[b.tier]||0)||a.level-b.level||a.uid.localeCompare(b.uid));
    const item=candidates[0];if(!item)return;
    const amount=item.rarity==='epic'?8:3,result=salvage(state,item.uid);
    if(result.ok)messages?.push(`行囊已满，自动分解冗余装备「${item.name}」，获得 ${amount} 颗一级五行石，为新装备腾出空间。`);
  }
  function matchesEquipmentFilter(hero,item,filter={}){
    const groups={armor:['head','chest','waist','wrist','legs','feet'],weapons:['weapon','ranged'],accessories:['necklace','pendant','ring1','ring2']};
    return (!filter.quality||filter.quality==='all'||item.rarity===filter.quality)&&(!groups[filter.slots]||groups[filter.slots].includes(item.slot))&&(!filter.primary||filter.primary==='all'||primaryAttribute(hero,item)===filter.primary)&&(!filter.secondary||filter.secondary==='all'||(itemAttributes(hero,item)[filter.secondary]||0)>0);
  }
  function salvagePreview(state,uid=state.playerUid||state.team?.[0],filter={}){
    const h=owned(state,uid),items=[],bag=[...(state.equipment?.bag||[]),...(state.equipment?.vault||[])];
    if(!h||cultivationError(state,uid))return {ok:false,message:'请选择主角后清理背包。',count:0,stones:0,items};
    // A higher rarity or source label alone does not make an item an upgrade.
    // Compare complete combat benefits, including each available duty and sets.
    const roles=meta(h)?.roles||[role(h)],holders=roles.map(duty=>duty===role(h)?h:{...h,...(h.loadouts?.[duty]||{}),role:duty}),protectedIds=new Set();
    const baselines=holders.map(holder=>loadoutScore(holder));
    for(const holder of holders)for(const item of Object.values(recommendedGear(holder,bag)))protectedIds.add(item.uid);
    for(const item of bag){
      if(item.locked||item.rarity==='legendary'||!matchesEquipmentFilter(h,item,filter)||protectedIds.has(item.uid))continue;
      const better=holders.some((holder,i)=>holder.equipment?.[item.slot]&&permitted(holder,item)&&loadoutScore(projectedLoadout(holder,{...holder.equipment,[item.slot]:item}))>baselines[i]+1e-8);
      if(!better)items.push({uid:item.uid,name:item.name,slot:item.slot,stones:item.rarity==='epic'?8:3});
    }
    const vaultIds=new Set((state.equipment?.vault||[]).map(x=>x.uid)),vaultCount=items.filter(x=>vaultIds.has(x.uid)).length,stones=items.reduce((n,x)=>n+x.stones,0),count=items.length,overflow=(state.equipment?.stones?.[1]||0)+stones>1e9;
    return {ok:count>0&&!overflow,message:overflow?'一级五行石已接近持有上限。':count?'可分解 '+count+' 件'+(vaultCount?'（含暂存仓库 '+vaultCount+' 件）':'')+'，获得 '+stones+' 颗一级五行石。':'没有符合筛选条件且不提升当前或备用心法的装备。',count,stones,items,vaultCount,protectedCount:bag.length-count};
  }
  function salvageInferior(state,uid=state.playerUid||state.team?.[0],filter={}){
    const preview=salvagePreview(state,uid,filter);if(!preview.ok)return fail(preview.message);
    const ids=new Set(preview.items.map(x=>x.uid)),e=state.equipment;e.bag=e.bag.filter(x=>!ids.has(x.uid));if(e.vault)e.vault=e.vault.filter(x=>!ids.has(x.uid));e.stones[1]=(e.stones[1]||0)+preview.stones;
    return success('已分解 '+preview.count+' 件非提升装备，获得 '+preview.stones+' 颗一级五行石。',{count:preview.count,stones:preview.stones,items:preview.items});
  }
  function refine(state,uid,slot){if(cultivationError(state,uid))return fail(cultivationError(state,uid));const e=init(state),h=owned(state,uid),item=h?.equipment[slot];if(state.battle)return fail('请等待当前战斗结束后精炼。');if(!item)return fail('请先装备该部位。');const en=enhancements(h,slot),cap=item.rarity==='legendary'?8:6,cost=(en.refine+1)*80;if(en.refine>=cap)return fail('已达当前装备精炼上限。');if(state.silver<cost||(e.stones[1]||0)<en.refine+1)return fail(`需要 ${cost} 银两与 ${en.refine+1} 颗一级五行石。`);state.silver-=cost;e.stones[1]-=en.refine+1;en.refine++;return success(`${slotDef(slot).name}精炼至 ${en.refine} 级。`);}
  function socket(state,uid,slot,level){if(cultivationError(state,uid))return fail(cultivationError(state,uid));const e=init(state),h=owned(state,uid),sd=slotDef(slot);if(state.battle)return fail('请等待当前战斗结束后熔嵌。');if(!h?.equipment[slot]||!sd?.sockets||!integer(level,1,8))return fail('部位或五行石等级无效。');const en=enhancements(h,slot);let index=en.sockets.reduce((best,x,i)=>x<level&&(best<0||x<en.sockets[best])?i:best,-1);if(en.sockets.length<sd.sockets)index=en.sockets.length;if(index<0)return fail('镶嵌孔已满，只能换入更高等级五行石。');if(!(e.stones[level]>0))return fail(`缺少 ${level} 级五行石。`);e.stones[level]--;en.sockets[index]=level;return success(`熔嵌 ${level} 级五行石，原有石头在覆盖时消耗。`);}
  function fusionPlan(state,target,quantity=1){
    if(!integer(target,2,8)||!integer(quantity,1,10000))return fail('请选择2至8级目标和1至10000颗数量。');
    const stock={...(state.equipment?.stones||{})},used={},produced={},steps={};let silver=0,missing=0;
    function obtain(level,amount){const available=Math.min(stock[level]||0,amount);stock[level]=(stock[level]||0)-available;used[level]=(used[level]||0)+available;const deficit=amount-available;if(!deficit)return;if(level===1){missing+=deficit;return;}obtain(level-1,deficit*3);silver+=deficit*(level-1)*40;steps[level]=(steps[level]||0)+deficit;}
    obtain(target-1,quantity*3);silver+=quantity*(target-1)*40;steps[target]=quantity;produced[target]=quantity;
    const affordable=!missing&&(state.silver||0)>=silver;
    return {ok:affordable,target,quantity,stones:Object.fromEntries(Object.entries(used).filter(([,n])=>n)),silver,missing,steps,produced,message:missing?'低级五行石不足，还缺等价 '+missing+' 颗一级石。':(state.silver||0)<silver?'银两不足，需要 '+silver+' 银两。':'材料已齐，可一键合成。'};
  }
  function fusionMaximum(state,target){if(!integer(target,2,8))return 0;let lo=0,hi=10000;while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(fusionPlan(state,target,mid).ok)lo=mid;else hi=mid-1;}return lo;}
  function fuseTo(state,target,quantity=1){if(state.battle)return fail('请等待战斗结束后合成。');const plan=fusionPlan(state,target,quantity);if(!plan.ok)return plan;const e=init(state);if((e.stones[target]||0)+quantity>1e9)return fail('持有数量达到上限。');for(const [level,n]of Object.entries(plan.stones))e.stones[level]-=n;e.stones[target]=(e.stones[target]||0)+quantity;state.silver-=plan.silver;return {...plan,ok:true,message:'一键合成 '+quantity+' 颗 '+target+' 级五行石，消耗 '+plan.silver+' 银两。'};}
  function fuseStone(state,level){if(!integer(level,1,7))return fail('五行石最高8级，请选择1至7级材料。');return fuseTo(state,level+1,1);}
  function inlayColor(state,uid,colorId,level){if(cultivationError(state,uid))return fail(cultivationError(state,uid));const e=init(state),h=owned(state,uid),color=parseColor(colorId,level);if(state.battle)return fail('请等待当前战斗结束后熔嵌。');if(!h?.equipment.weapon||!color)return fail('请先装备武器，并选择1至6级五彩石。');if(!(e.colors[color.key]>0))return fail('没有这类等级的五彩石，可通过秘境或侠名兑换获得。');if(h.colorStone===color.id&&(h.colorStoneLevel||1)===color.level)return fail('已镶嵌相同五彩石，无需重复消耗。');e.colors[color.key]--;h.colorStone=color.id;h.colorStoneLevel=color.level;clampHealth(h);return success(`${color.level}级五彩石已熔嵌；满足全身五行石数量与等级后逐条生效。`);}
  function colorStatus(hero){const stones=SLOTS.flatMap(s=>hero.equipment?.[s.id]?(hero.enhancements?.[s.id]?.sockets||[]):[]),count=stones.length,total=stones.reduce((a,b)=>a+b,0),level=hero.colorStone?hero.colorStoneLevel||1:0,thresholds=[6,12,18].map(n=>({count:n,total:n*Math.max(2,level+1)}));const active=hero.equipment?.weapon&&hero.colorStone?thresholds.filter(t=>count>=t.count&&total>=t.total).length:0;return {id:hero.colorStone||null,key:hero.colorStone?colorKey(hero.colorStone,level):null,level,count,total,active,thresholds,note:'五彩石1—6级；每升一级提高词条数值与五行石激活要求。'};}
  function setCounts(hero){const out={};for(const [slot,item]of Object.entries(hero.equipment||{})){if(slotDef(slot)&&item.set&&permitted(hero,item))out[item.set]=(out[item.set]||0)+1;}return out;}
  function bonuses(hero){let hp=0,atk=0,def=0,crit=0,damageMultiplier=1,healMultiplier=1,damageReduction=0;for(const [slot,item]of Object.entries(hero.equipment||{})){if(!permitted(hero,item))continue;const en=hero.enhancements?.[slot]||{},rarity={rare:1,epic:1.5,legendary:2.2}[item.rarity]||1,scale=(1+Math.min(en.refine||0,item.rarity==='legendary'?8:6)*.06)*(1+(item.stage||0)*.12),v=(4+item.level*.75)*rarity*scale*tierScale(item);atk+=slot==='weapon'?v*1.8:v*.28;hp+=slot==='weapon'?v*1.5:v*4;def+=slot==='weapon'?v*.12:v*.3;const sum=(en.sockets||[]).reduce((a,b)=>a+b,0);atk+=sum*.7;hp+=sum*3;def+=sum*.25;}
    for(const count of Object.values(setCounts(hero))){if(count>=2){atk+=12;def+=6;}if(count>=4){damageMultiplier+=.12;healMultiplier+=.12;}if(count>=6)damageReduction+=.08;}
    const color=colorStatus(hero),gradeScale=1+(color.level-1)*.22;
    if(color.active){for(const [key,value]of (COLORS.find(c=>c.id===color.id)?.attributes||[]).slice(0,color.active)){const n=value*gradeScale;if(key==='hp')hp+=n;if(key==='atk')atk+=n;if(key==='def')def+=n;if(key==='crit')crit+=n;if(key==='damageMultiplier')damageMultiplier+=n;if(key==='healMultiplier')healMultiplier+=n;if(key==='damageReduction')damageReduction+=n;}}
    const attributes={};for(const item of Object.values(hero.equipment||{}))if(permitted(hero,item))for(const [key,n]of Object.entries(itemAttributes(hero,item)))attributes[key]=(attributes[key]||0)+n;
    atk+=(attributes.strength||0)*.22+(attributes.agility||0)*.22+(attributes.spirit||0)*.22+(attributes.constitution||0)*.22;hp+=(attributes.vitality||0)*4+(attributes.hp||0);def+=attributes.def||0;crit+=Math.min(.18,attributes.crit||0);damageMultiplier+=Math.min(.22,(attributes.penetration||0)+(attributes.strain||0)+(attributes.criticalEffect||0)*.5+(attributes.haste||0));healMultiplier+=Math.min(.22,(attributes.healing||0)+(attributes.haste||0));damageReduction+=Math.min(.15,attributes.toughness||0);
    const heroScale=hero.isPlayer?2.5:1;return {hp:Math.floor(hp*heroScale),atk:Math.floor(atk*heroScale),def:Math.floor(def*heroScale),crit,attributes,damageMultiplier,healMultiplier,damageReduction:Math.min(.4,damageReduction)};
  }
  function combatProfile(hero,turn=1,critical=false){const b=bonuses(hero),w=hero.equipment?.weapon,p={damageMultiplier:b.damageMultiplier,healMultiplier:b.healMultiplier,damageReduction:b.damageReduction,lifesteal:0,extraStrike:0,revive:0,teamHeal:0,label:''};if(!permitted(hero,w))return p;
    if(w.effect==='water'){p.damageMultiplier+=Math.min(.18,Math.max(0,turn-1)*.03);p.label='水特效·叠浪';}
    if(w.effect==='heal'){p.healMultiplier+=.15;p.label='治疗特效';}
    if(w.rarity==='legendary'){p.label='稀世神兵';const r=role(hero);if(r==='tank'){p.damageReduction=Math.min(.6,p.damageReduction+.2);p.revive=1;p.label='神兵·不屈';}else if(r==='healer'){p.healMultiplier+=.25;p.teamHeal=turn%3===0?.7:0;p.label='神兵·济世';}else{p.damageMultiplier+=.15;p.extraStrike=turn%3===0?1:0;p.lifesteal=critical?.12:0;p.label='神兵·破阵';}}return p;}
  function heroInfo(state,uid){init(state);const h=owned(state,uid);if(!h)return null;return {slots:SLOTS.map(s=>{const en=h.enhancements[s.id]||{refine:0,sockets:[]};return {...s,item:h.equipment[s.id]||null,attributes:itemAttributes(h,h.equipment[s.id]),compatible:!h.equipment[s.id]||permitted(h,h.equipment[s.id]),refine:en.refine,sockets:en.sockets,socketCount:s.sockets,refineCost:(en.refine+1)*80};}),bonuses:bonuses(h),colorStatus:colorStatus(h),setBonuses:Object.entries(setCounts(h)).map(([name,count])=>({name,count,active:[2,4,6].filter(n=>count>=n),desc:'2件：攻击+12/防御+6；4件：伤害与治疗+12%；6件：减伤8%。'})),orange:combatProfile(h,3,true)};}
  // Recommendation uses the same stats/profiles as combat, with a six-turn average.
  // It values a tank's effective health, a healer's party healing, and a DPS's output.
  function loadoutScore(hero){
    const stats=root.JXEngine.getHeroStats(hero),p=combatProfile(hero,3,true),w=hero.equipment?.weapon;
    const averageWater=permitted(hero,w)&&w.effect==='water'?.015:0;
    const damage=stats.atk*(1+Math.min(.75,.1+stats.crit)*.65)*(p.damageMultiplier+averageWater)*(1+p.extraStrike/3);
    const healing=stats.atk*p.healMultiplier*(.42+p.teamHeal*5/3);
    const survival=(stats.hp*(1+p.revive*.3)+stats.def*8)/(1-p.damageReduction);
    return role(hero)==='tank'?survival*.28+damage*.45:role(hero)==='healer'?healing*4+damage*.4+survival*.055:damage*3.2+survival*.035+damage*p.lifesteal*.1;
  }
  const emptyCosts=()=>({silver:0,stones:{},colors:{}});
  const roundScore=n=>Math.round(n*100)/100;
  function quickResult(h,before,changes,costs,message){const after=h?loadoutScore(h):0,delta=after-before;return {ok:changes.length>0,message,changes,costs,beforeScore:roundScore(before),afterScore:roundScore(after),improvement:roundScore(delta),improvementPct:before?Math.round(delta/before*1000)/10:0};}
  function quickGuard(state,uid){const h=owned(state,uid),message=cultivationError(state,uid)||(state.battle?'请先战后整队，战斗结束后再一键整备。':!h?'侠客不存在。':'');return message?quickResult(h,h?loadoutScore(h):0,[],emptyCosts(),message):null;}
  function itemValue(h,item){if(!item||!permitted(h,item))return 0;const en=h.enhancements?.[item.slot]||{};return (4+item.level*.75)*({rare:1,epic:1.5,legendary:2.2}[item.rarity]||1)*(1+Math.min(en.refine||0,item.rarity==='legendary'?8:6)*.06)*(1+(item.stage||0)*.12)*tierScale(item);}
  function strongerItem(h,a,b){if(!a)return b;if(!b)return a;const value=item=>item.archetype?loadoutScore(projectedLoadout(h,{...h.equipment,[item.slot]:item})):itemValue(h,item);const delta=value(b)-value(a);return delta>1e-8||Math.abs(delta)<1e-8&&b.uid===h.equipment?.[b.slot]?.uid?b:a;}
  function gearChanges(h,gear){return SLOTS.flatMap(s=>{const old=h.equipment?.[s.id],next=gear[s.id];return old?.uid===next?.uid?[]:[{type:'equip',slot:s.id,from:old?.name||null,to:next?.name||null,itemUid:next?.uid||null}];});}
  function armorPlans(h,items,weapon){
    const slots=SLOTS.filter(s=>s.id!=='weapon'),defaults={},groups=new Map();
    for(const sd of slots){const old=h.equipment?.[sd.id];if(old&&!permitted(h,old))defaults[sd.id]=old;}
    for(const item of items){if(item.slot==='weapon'||!permitted(h,item))continue;const index=slots.findIndex(s=>s.id===item.slot);if(index<0)continue;
      if(!item.set)defaults[item.slot]=strongerItem(h,defaults[item.slot],item);
      else{if(!groups.has(item.set))groups.set(item.set,new Map());const group=groups.get(item.set);group.set(index,strongerItem(h,group.get(index),item));}
    }
    // Non-weapon gear shares a stat ratio. For each occupied-slot mask and set
    // threshold combination, only the highest total item value can be optimal.
    let states=new Map([['0:0:0:0',{mask:0,two:0,four:0,six:0,value:0,changes:0,gear:{}}]]);
    for(const [set,group]of groups){const entries=[...group],options=[];
      for(let subset=0;subset<2**entries.length;subset++){let mask=0,value=0,changes=0,count=weapon?.set===set?1:0;const gear={};for(let i=0;i<entries.length;i++)if(subset&(1<<i)){const [index,item]=entries[i];mask|=1<<index;count++;value+=itemValue(h,item);gear[item.slot]=item;if(item.uid!==h.equipment?.[item.slot]?.uid)changes++;}options.push({mask,value,changes,gear,two:count>=2?1:0,four:count>=4?1:0,six:count>=6?1:0});}
      let next=new Map();for(const current of states.values())for(const option of options){if(current.mask&option.mask)continue;const mask=current.mask|option.mask,two=current.two+option.two,four=current.four+option.four,six=current.six+option.six,key=`${mask}:${two}:${four}:${six}`,value=current.value+option.value,changes=current.changes+option.changes,old=next.get(key);
        if(!old||value>old.value+1e-8||Math.abs(value-old.value)<1e-8&&changes<old.changes)next.set(key,{mask,two,four,six,value,changes,gear:{...current.gear,...option.gear}});
      }
      // Canonical loot has six set-bearing armor slots and stays well below this
      // bound. Keep custom/imported inventories from stalling the page.
      if(next.size>12000){const ranked=[...next.entries()].map(([key,x])=>{const gear={...defaults,...x.gear};if(weapon)gear.weapon=weapon;return {key,x,score:loadoutScore({...h,equipment:gear})};}).sort((a,b)=>b.score-a.score||a.x.changes-b.x.changes);next=new Map(ranked.slice(0,12000).map(x=>[x.key,x.x]));}
      states=next;
    }
    return [...states.values()].map(x=>{const gear={...defaults,...x.gear};if(weapon)gear.weapon=weapon;return gear;});
  }
  function recommendedGear(h,bag){
    const items=[...bag,...Object.values(h.equipment||{})],weapons=new Map();
    for(const item of items){if(item.slot!=='weapon'||!permitted(h,item))continue;const key=(item.rarity==='legendary'?'legendary':'ordinary')+'|'+(item.effect||'')+'|'+(item.set||'');weapons.set(key,strongerItem(h,weapons.get(key),item));}
    const weaponOptions=[...weapons.values()];if(!weaponOptions.length)weaponOptions.push(h.equipment?.weapon||null);
    let best=h.equipment||{},bestScore=loadoutScore(h),bestChanges=0,commonPlans;
    for(const weapon of weaponOptions){let plans;if(!weapon?.set){if(!commonPlans)commonPlans=armorPlans(h,items,null);plans=commonPlans.map(gear=>({...gear,...(weapon?{weapon}:{})}));}else plans=armorPlans(h,items,weapon);
      for(const gear of plans){const score=loadoutScore(projectedLoadout(h,gear)),changed=gearChanges(h,gear).length;if(score>bestScore+1e-8||Math.abs(score-bestScore)<1e-8&&changed<bestChanges){best=gear;bestScore=score;bestChanges=changed;}}
    }
    // Revisit distinct stat profiles against the complete set, using real role benefits.
    if(items.some(x=>x.archetype))for(let pass=0;pass<3;pass++){let improved=false;for(const sd of SLOTS){for(const item of items){if(item.slot!==sd.id||!permitted(h,item)||item.uid===best[sd.id]?.uid)continue;const candidate={...best,[sd.id]:item},score=loadoutScore(projectedLoadout(h,candidate));if(score>bestScore+1e-8){best=candidate;bestScore=score;improved=true;}}}if(!improved)break;}
    // Different raw item coefficients can round to the same real combat stats.
    // Restore worn pieces whenever doing so preserves the completed loadout score.
    let stable={...best},changed=true;while(changed){changed=false;for(const sd of SLOTS){const old=h.equipment?.[sd.id];if(stable[sd.id]?.uid===old?.uid)continue;const restored={...stable};if(old)restored[sd.id]=old;else delete restored[sd.id];const score=loadoutScore(projectedLoadout(h,restored));if(score>=bestScore-1e-8){stable=restored;bestScore=score;changed=true;}}}
    return stable;
  }
  function autoEquip(state,uid){const rejected=quickGuard(state,uid);if(rejected)return rejected;const h=owned(state,uid),before=loadoutScore(h),costs=emptyCosts(),e=state.equipment||{bag:[]},gear=recommendedGear(h,e.bag),changes=gearChanges(h,gear);
    if(!changes.length)return quickResult(h,before,[],costs,'当前角色已采用现有装备中的推荐配置。');
    const picked=new Set(Object.values(gear).map(x=>x.uid)),nextBag=[...e.bag,...Object.values(h.equipment||{})].filter(x=>!picked.has(x.uid));
    if(nextBag.length>300)return quickResult(h,before,[],costs,'装备行囊已满，暂无法完成这次整备。');
    init(state).bag=nextBag;for(const item of Object.values(gear))if(item.uid!==h.equipment?.[item.slot]?.uid)changeSeason(h,item);h.equipment=gear;clampHealth(h);return quickResult(h,before,changes,costs,`已为${meta(h).name}调整 ${changes.length} 件装备，兼顾职责、套装与武器特效；部位精炼与镶嵌保留。`);
  }
  function processLoot(state){
    if(state.battle||!pendingLoot.has(state))return [];
    pendingLoot.delete(state);if(!state.characterModel||!owned(state,state.playerUid))return [];
    const result=autoEquip(state,state.playerUid);
    return result.ok?[`自动穿戴更优装备：${result.changes.map(change=>change.to).join('、')}；保留部位精炼与镶嵌。`]:[];
  }
  function equipChapter(state,uid){
    const rejected=quickGuard(state,uid);if(rejected)return rejected;
    const h=owned(state,uid),expansion=currentExpansion(state),before=loadoutScore(h),changes=[],costs=emptyCosts(),choices=[];
    for(const sd of SLOTS){
      const worn=h.equipment?.[sd.id],armor=['head','chest','waist','wrist','legs','feet'].includes(sd.id),wornCurrent=worn&&expansionForItem(worn)===expansion.id&&permitted(h,worn);
      const candidates=(state.equipment?.bag||[]).filter(item=>item.slot===sd.id&&expansionForItem(item)===expansion.id&&permitted(h,item));
      candidates.sort((a,b)=>(armor?Number(b.set===expansion.setName)-Number(a.set===expansion.setName):0)||itemValue(h,b)-itemValue(h,a)||a.uid.localeCompare(b.uid));
      const next=candidates[0];
      if(next&&(!wornCurrent||itemValue(h,next)>itemValue(h,worn)+1e-8||armor&&next.set===expansion.setName&&worn.set!==expansion.setName))choices.push(next);
    }
    for(const item of choices){const previous=h.equipment?.[item.slot],result=equip(state,uid,item.uid);if(result.ok)changes.push({type:'equip',slot:item.slot,from:previous?.name||null,to:item.name,itemUid:item.uid,seasonChanged:result.seasonChanged});}
    return quickResult(h,before,changes,costs,changes.length?`已换穿 ${changes.length} 件「${expansion.name}」装备，保留部位精炼与镶嵌。`:'已穿戴本章装备，或背包中没有适合该侠客的本章装备。');
  }
  function autoEquipTeam(state){
    if(state.battle)return fail('请先战后整队，再为全队换装。');
    const team=(state.characterModel?[state.playerUid]:state.team).map(uid=>owned(state,uid)).filter(Boolean),before=team.reduce((n,h)=>n+loadoutScore(h),0),changes=[],members=[];
    for(const h of team){const result=autoEquip(state,h.uid);members.push({uid:h.uid,name:meta(h).name,...result});changes.push(...result.changes.map(c=>({...c,heroUid:h.uid,heroName:meta(h).name})));}
    const after=team.reduce((n,h)=>n+loadoutScore(h),0);
    return {ok:true,message:changes.length?`已为全队调整 ${changes.length} 件装备，保留每位侠客的职责与实际收益。`:'全队现有装备已采用推荐搭配。',changes,members,costs:emptyCosts(),beforeScore:roundScore(before),afterScore:roundScore(after),improvement:roundScore(after-before),improvementPct:before?Math.round((after/before-1)*1000)/10:0};
  }
  function autoRefine(state,uid){const rejected=quickGuard(state,uid);if(rejected)return rejected;const h=owned(state,uid),before=loadoutScore(h),costs=emptyCosts(),changes=[];
    while(true){const candidates=SLOTS.filter(sd=>permitted(h,h.equipment?.[sd.id])&&(h.enhancements?.[sd.id]?.refine||0)<(h.equipment[sd.id].rarity==='legendary'?8:6)).sort((a,b)=>(h.enhancements?.[a.id]?.refine||0)-(h.enhancements?.[b.id]?.refine||0));if(!candidates.length)break;
      const sd=candidates[0],from=h.enhancements?.[sd.id]?.refine||0,stones=from+1,silver=stones*80;if(state.silver<silver||(state.equipment?.stones?.[1]||0)<stones)break;
      const result=refine(state,uid,sd.id);if(!result.ok)break;costs.silver+=silver;costs.stones[1]=(costs.stones[1]||0)+stones;changes.push({type:'refine',slot:sd.id,from,to:from+1});
    }
    return quickResult(h,before,changes,costs,changes.length?`已完成 ${changes.length} 次精炼，优先均衡提升低精炼部位。`:'没有可精炼的装备，或现有银两与一级五行石不足。');
  }
  function socketTarget(state){return integer(state.equipment?.socketTargetLevel,6,8)?state.equipment.socketTargetLevel:6;}
  function setSocketTarget(state,level){if(!integer(level,6,8))return fail('默认镶嵌等级可设为6至8级。');init(state).socketTargetLevel=level;return success('一键镶嵌目标已设为 '+level+' 级。');}
  function autoSocket(state,uid){const rejected=quickGuard(state,uid);if(rejected)return rejected;const h=owned(state,uid),before=loadoutScore(h),costs=emptyCosts(),changes=[],target=socketTarget(state),initialStones={...(state.equipment?.stones||{})},initialSilver=state.silver,fused={};
    while(true){const holes=[];for(const sd of SLOTS)if(permitted(h,h.equipment?.[sd.id]))for(let i=0;i<sd.sockets;i++)holes.push({slot:sd.id,index:i,level:h.enhancements?.[sd.id]?.sockets[i]||0});holes.sort((a,b)=>a.level-b.level);const hole=holes[0];if(!hole||hole.level>=target)break;
      const e=init(state);let level=target;
      if(!(e.stones[target]>0)){const plan=fusionPlan(state,target,1);if(plan.ok){fuseTo(state,target,1);fused[target]=(fused[target]||0)+1;}else while(level>hole.level&&!(e.stones[level]>0))level--;}
      if(level<=hole.level)break;
      const en=enhancements(h,hole.slot);e.stones[level]--;en.sockets[hole.index]=level;changes.push({type:'socket',slot:hole.slot,index:hole.index,from:hole.level,to:level});
    }
    costs.silver=initialSilver-state.silver;for(const [level,n]of Object.entries(initialStones)){const used=n-(state.equipment?.stones?.[level]||0);if(used>0)costs.stones[level]=used;}
    if(permitted(h,h.equipment?.weapon)){let color=null,best=loadoutScore(h);for(const [key,count]of Object.entries(state.equipment?.colors||{})){const candidate=parseColor(key);if(!candidate||count<=0||h.colorStone&&candidate.level<(h.colorStoneLevel||1)||candidate.id===h.colorStone&&candidate.level===(h.colorStoneLevel||1))continue;const score=loadoutScore({...h,colorStone:candidate.id,colorStoneLevel:candidate.level});if(score>best+1e-8){color=candidate;best=score;}}
      if(color){const from=h.colorStone?colorKey(h.colorStone,h.colorStoneLevel||1):null;state.equipment.colors[color.key]--;h.colorStone=color.id;h.colorStoneLevel=color.level;costs.colors[color.key]=1;changes.push({type:'color',slot:'weapon',from,to:color.key});}
    }
    const pending=SLOTS.reduce((n,sd)=>n+(permitted(h,h.equipment?.[sd.id])?Array.from({length:sd.sockets},(_,i)=>(h.enhancements?.[sd.id]?.sockets[i]||0)<target).filter(Boolean).length:0),0),count=changes.filter(x=>x.type==='socket').length;
    if(changes.length)clampHealth(h);const message=(changes.length?'已完成 '+count+' 处镶嵌'+(Object.keys(fused).length?'，自动合成 '+Object.values(fused).reduce((a,b)=>a+b,0)+' 颗 '+target+' 级石':'')+(changes.some(x=>x.type==='color')?'，并配置适合当前职责的五彩石':''):'现有材料暂不能继续提升')+(pending?'；目标 '+target+' 级，仍有 '+pending+' 孔未达标。材料不足时仅用现成低级石补位。':'；已达到 '+target+' 级目标。');
    return {...quickResult(h,before,changes,costs,message),targetLevel:target,pending,fused};
  }
  function autoEnhance(state,uid){const rejected=quickGuard(state,uid);if(rejected)return rejected;const h=owned(state,uid),before=loadoutScore(h),socketResult=autoSocket(state,uid),refineResult=autoRefine(state,uid),changes=[...socketResult.changes,...refineResult.changes],costs=emptyCosts();
    for(const result of [socketResult,refineResult]){costs.silver+=result.costs.silver;for(const type of ['stones','colors'])for(const [key,n]of Object.entries(result.costs[type]))costs[type][key]=(costs[type][key]||0)+n;}
    return quickResult(h,before,changes,costs,changes.length?`已强化当前穿戴装备：镶嵌 ${socketResult.changes.length} 处，精炼 ${refineResult.changes.length} 次。`:'当前穿戴装备暂不能用现有资源继续强化。');
  }
  function quickPreview(state,uid){return {equip:autoEquip(clone(state),uid),refine:autoRefine(clone(state),uid),socket:autoSocket(clone(state),uid),enhance:autoEnhance(clone(state),uid)};}
  const recipeExpansion = recipe => (D.DUNGEONS||[]).find(d=>d.era===recipe.era&&d.materialDrop!==false)?.expansionId || (D.EXPANSIONS||[]).find(e=>e.era===recipe.era)?.id;
  function forgeKey(state,hero,recipeId){const old=`${hero.uid}:${recipeId}`;
    if(!state.equipment.quests[old]||state.equipment.quests[old].role!==role(hero)){
      const inherited=Object.entries(state.equipment.quests).filter(([key,q])=>{const [uid,recipe]=key.split(':');return recipe===recipeId&&q.role===role(hero)&&state.retiredCompanionOwners?.[uid]?.uid===hero.uid;}).sort((a,b)=>b[1].stage-a[1].stage)[0];
      if(inherited)return inherited[0];
    }
    return state.characterModel&&(!state.equipment.quests[old]||state.equipment.quests[old].role!==role(hero))?old+':'+role(hero):old;}
  function weaponName(hero,recipe){const names=WEAPON_NAMES[recipe.era][sectId(hero)];return names?.[role(hero)==='tank'||role(hero)==='healer'?Math.min(1,names.length-1):0]||`${D.SECTS.find(x=>x.id===meta(hero)?.sect)?.name||'江湖'}·${recipe.bigIron}神兵`;}
  function forgePlan(recipe,hero){
    const badao=sectId(hero)==='badao';let steps,trialName='古剑台·欧冶子剑灵';
    if(recipe.mode==='exchange')steps=['飞仙玄晶与天外陨铁合炼','主城叶鸦 · 换取神兵'];
    else if(recipe.mode==='classic'){
      trialName=badao?'柳祠·柳静海':recipe.era===80?'神剑冢·器魂':'神剑冢·叶英';
      const visits=recipe.era===80?['稀世晶矿寻伯乐 · 主城叶鸦','赶赴藏剑再详谈 · 叶晖','神兵渊源且听述 · 虎跑山庄叶炜']:
        recipe.era===90?['战火燎原玄晶现 · 扬州叶鸦','藏剑不吝重金悬 · 叶英','且从心意闻前尘']:
        recipe.era===95?['稀世晶矿绝今古 · 主城叶鸦','欲求神兵赴藏剑 · 叶英','绝世之兵皆有灵']:
        recipe.era===100?['稀世晶矿烁古今 · 主城叶鸦','神兵相易藏剑行 · 叶英','前尘旧事神兵藏']:
        ['天乙晶矿现 · 藏剑山庄·乱世叶镜池','携物往藏剑 · 叶镜池','神兵源何来'];
      if(badao){const npc=recipe.era===110?'柳昭明':'柳静海';visits[0]=`${visits[0].split(' · ')[0]} · 霸刀山庄${npc}`;visits[1]=`赴霸刀详谈 · ${npc}`;visits[2]=`聆听神兵来历 · ${npc}`;if([80,90,100].includes(recipe.era))visits.splice(1,1);}
      steps=['玄晶陨铁合炼',...visits,`${trialName} · 获得认可`,`回访${badao?(recipe.era===110?'柳昭明':'柳静海'):recipe.era===80?'叶晖':recipe.era===110?'叶镜池':'叶英'} · 领取神兵`];
    }else if(recipe.era===120)steps=['太一玄晶转化','稀世晶矿聚磐渊 · 千岛湖柳亭澜','太一神奇剑台铸 · 磐渊叶镜池','细听神兵缘来源 · 杨北山','古剑台 · 欧冶子剑灵认可','回访杨北山 · 领取初阶神兵','古剑台升品·一','古剑台升品·二','古剑台升品·三','古剑台升品·四'];
    else steps=[`${recipe.bigIron}转化`,'稀世晶矿归磐渊 · 杨北山','神兵源来且闻听','古剑台 · 欧冶子剑灵认可','回访杨北山 · 领取初阶神兵','古剑台升品·一','古剑台升品·二','古剑台升品·三','古剑台升品·四'];
    const grantAt=steps.length-(recipe.mode==='growth'?5:1);return {steps,grantAt,trialAt:recipe.mode==='exchange'?-1:grantAt-1,trialName};
  }
  function forgeInfo(state,uid,recipeId){
    const e=init(state),h=owned(state,uid),r=getRecipe(recipeId);if(!h||!r)return null;
    const q=e.quests[forgeKey(state,h,recipeId)]||{stage:0},{steps,grantAt}=forgePlan(r,h),stage=q.stage;let cost={};
    if(stage===0)cost=r.mode==='growth'?{[r.bigIron]:1}:{[r.bigIron]:1,[r.smallIron]:200};else if(r.mode==='growth'&&stage>grantAt&&stage<steps.length)cost={[r.smallIron]:50};
    const requirements=Object.entries(cost).map(([name,amount])=>({id:name,name,amount,have:e.materials[name]||0,owned:e.materials[name]||0,required:amount}));
    const known=!!WEAPON_NAMES[r.era][sectId(h)],upgrade=stage>grantAt&&stage<steps.length&&r.mode==='growth';
    const weaponPresent=!upgrade||e.bag.some(x=>x.uid===q.itemUid)||Object.values(h.equipment).some(x=>x.uid===q.itemUid);
    const reason=root.JXProgression&&!root.JXProgression.isExpansionUnlocked(state,recipeExpansion(r))?'此神兵所属资料片尚未开放。':!known?'此门派该年代神兵名称尚未核实，请选择苍生铸世神兵。':q.role&&q.role!==role(h)?'请切回接取时的职责后继续。':state.battle?'请等待当前战斗结束。':requirements.some(x=>x.have<x.amount)?'材料尚未备齐。':stage===grantAt&&e.bag.length>=300?'装备行囊已满，请先分解或装备。':!weaponPresent?'请先把此神兵交回原锻造侠客，才能继续升品。':'';
    return {...r,weaponName:weaponName(h,r),stage,steps:steps.map((name,i)=>({name,desc:name,done:i<stage,current:i===stage})),nextLabel:steps[stage]||'神兵大成',completed:stage>=steps.length,canAdvance:stage<steps.length&&!reason,reason,requirements,sourceNames:(D.DUNGEONS||[]).filter(x=>x.materialDrop!==false&&(x.bigIron===r.bigIron||x.smallIron===r.smallIron)).map(x=>x.name),upgrade:r.mode==='growth'?Math.max(0,stage-grantAt-1):0,note:r.note};
  }
  function forgeStep(state,uid,recipeId){if(cultivationError(state,uid))return fail(cultivationError(state,uid));const info=forgeInfo(state,uid,recipeId);if(!info)return fail('侠客或神兵配方不存在。');if(info.completed)return fail('这位侠客的此件神兵已完成。');if(!info.canAdvance)return fail(info.reason);const e=state.equipment,h=owned(state,uid),r=getRecipe(recipeId),key=forgeKey(state,h,recipeId),q=e.quests[key]||{stage:0,role:role(h)},{trialAt,grantAt,trialName}=forgePlan(r,h);let trial=null;if(q.stage===trialAt){if(!root.JXSystems?.forgeTrial)return fail('神兵试炼暂未就绪。');trial=root.JXSystems.forgeTrial(state,{...r,trialName},uid);if(!trial.won)return success('试炼尚未通过，材料和任务进度保留，可养成后再战。',{...trial});}
    if(q.stage===grantAt){if(e.bag.length>=300)return fail('装备行囊已满，请先分解或装备。');const item=createItem(state,{slot:'weapon',level:r.level,rarity:'legendary',sect:meta(h).sect,role:q.role,recipeId:r.id,name:weaponName(h,r),source:r.name,expansionId:recipeExpansion(r)});q.itemUid=item.uid;}
    if(r.mode==='growth'&&q.stage>grantAt){const item=e.bag.find(x=>x.uid===q.itemUid)||Object.values(h.equipment).find(x=>x.uid===q.itemUid);if(!item)return fail('请先把此神兵交回原锻造侠客，才能继续升品。');item.stage++;}
    for(const need of info.requirements)e.materials[need.name]-=need.amount;q.stage++;e.quests[key]=q;return success(`${info.nextLabel}已完成。${q.stage===grantAt+1?'神兵已收入装备行囊。':''}`,trial?{log:trial.log,won:true}:{});
  }
  function recipes(state){init(state);return clone(RECIPES);}
  function inventory(state){return init(state).bag.map(item=>{const v=(4+item.level*.75)*({rare:1,epic:1.5,legendary:2.2}[item.rarity])*(1+item.stage*.12)*tierScale(item),weapon=item.slot==='weapon';return {...clone(item),quality:item.rarity,setName:item.set,stats:{hp:Math.floor(v*(weapon?1.5:4)),atk:Math.floor(v*(weapon?1.8:.28)),def:Math.floor(v*(weapon?.12:.3))}};});}
  function materials(state){const e=init(state);return Object.values(MATERIALS).flat().map(name=>({id:name,name,count:e.materials[name]||0,source:(D.DUNGEONS||[]).filter(d=>d.materialDrop!==false&&(d.bigIron===name||d.smallIron===name)).map(d=>d.name).join('、')}));}
  function stones(state){const e=init(state);return Array.from({length:8},(_,i)=>({level:i+1,count:e.stones[i+1]||0}));}
  function giveMaterial(state,name,amount){if(!Object.values(MATERIALS).flat().includes(name))return;const e=init(state);e.materials[name]=Math.min(1e9,(e.materials[name]||0)+amount);}
  function exchangeOffers(state){
    const current=currentExpansion(state),currentIndex=D.EXPANSIONS.findIndex(x=>x.id===current?.id),offers=[],bagLength=state.equipment?.bag?.length||0;
    for(const [index,expansion]of D.EXPANSIONS.entries()){
      const unlocked=root.JXProgression?root.JXProgression.isExpansionUnlocked(state,expansion.id):index<=currentIndex;if(!unlocked)continue;
      const base={expansionId:expansion.id,expansionName:expansion.name,chapter:index+1},level=10+index*5,stoneLevel=Math.min(7,2+Math.floor(index/3)),grade=Math.min(5,1+Math.floor(index/4));
      const raids=D.DUNGEONS.filter(d=>d.expansionId===expansion.id&&d.kind==='raid'),five=D.DUNGEONS.find(d=>d.id==='five_'+expansion.id);
      if(root.JXCombatRules)base.tier=raids.some(d=>state.equipment?.dungeons?.[d.id]?.modes?.normal?.wins>0)?'raid':five&&state.equipment?.dungeons?.[five.id]?.modes?.normal?.wins>0?'dungeon':'field';
      offers.push({...base,id:`set:${expansion.id}`,kind:'set',level,set:expansion.setName,name:`${expansion.setName}·六件套`,description:'帽子、上衣、腰带、护腕、下装、鞋子各一件；兑换后可换穿本章。',cost:180,quantity:6});
      for(const sd of SLOTS)offers.push({...base,id:`gear:${expansion.id}:${sd.id}`,kind:'gear',slot:sd.id,level,name:`${expansion.setName}·${sd.name}`,description:sd.id==='weapon'?'按所选侠客门派兑换本章紫色武器。':`定向兑换${sd.name}${['head','chest','waist','wrist','legs','feet'].includes(sd.id)?'，计入本章六件套。':'，补齐镶嵌部位。'}`,cost:sd.id==='weapon'?45:['head','chest','waist','wrist','legs','feet'].includes(sd.id)?30:20,quantity:1,set:['head','chest','waist','wrist','legs','feet'].includes(sd.id)?expansion.setName:null});
      const dungeon=D.DUNGEONS.find(d=>d.expansionId===expansion.id&&d.materialDrop!==false);
      if(dungeon?.smallIron)offers.push({...base,id:`iron:${expansion.id}`,kind:'iron',material:dungeon.smallIron,name:`${dungeon.smallIron} ×10`,description:'补足本年代神兵锻造所需小铁。',cost:50,quantity:10});
      offers.push({...base,id:`stones:${expansion.id}`,kind:'stones',level:stoneLevel,name:`${stoneLevel}级五行石 ×6`,description:'可直接镶嵌，降低合成与掉落的等待。',cost:20,quantity:6});
      for(const color of COLORS)offers.push({...base,id:`color:${expansion.id}:${color.id}`,kind:'color',colorId:color.id,level:grade,name:`${grade}级${color.name}`,description:'装在武器，满足全身五行石条件后生效。',cost:40,quantity:1});
      offers.push({...base,id:`silver:${expansion.id}`,kind:'silver',name:'精炼资粮 · '+(state.characterModel?'1000':'5000')+'银两',description:'用于精炼、合成与日常整备。',cost:state.characterModel?80:20,quantity:state.characterModel?1000:5000});
    }
    return offers.map(o=>{const reason=state.battle?'战斗结束后兑换':o.tier==='field'&&(o.kind==='set'||o.kind==='color')?'通关本章五人秘境后开放':['gear','set'].includes(o.kind)&&bagLength+o.quantity>300?'装备行囊空间不足':state.renown<o.cost?'侠名不足':'';return {...o,available:!reason,reason};});
  }
  function exchange(state,offerId,qty=1,heroUid=state.team?.[0]){
    if(!integer(qty,1,999))return fail('兑换数量必须是1至999的整数。');
    if(state.battle)return fail('请等待当前战斗结束后兑换。');
    const offer=exchangeOffers(state).find(x=>x.id===offerId);if(!offer)return fail('兑换项不存在或所属资料片尚未开放。');
    if(offer.tier==='field'&&(offer.kind==='set'||offer.kind==='color'))return fail('通关本章五人秘境后开放此项兑换。');
    const cost=offer.cost*qty,e=state.equipment,h=owned(state,heroUid),amount=offer.quantity*qty,isGear=['gear','set'].includes(offer.kind);
    if(!Number.isFinite(state.renown)||state.renown<cost)return fail(`侠名不足，需要 ${cost} 点。`);
    if(isGear&&(!h||(e?.bag?.length||0)+amount>300))return fail(!h?'请选择已结交的侠客。':'装备行囊空间不足，请先装备或分解。');
    const old=offer.kind==='iron'?(e?.materials?.[offer.material]||0):offer.kind==='stones'?(e?.stones?.[offer.level]||0):offer.kind==='color'?(e?.colors?.[colorKey(offer.colorId,offer.level)]||0):offer.kind==='silver'?state.silver:0;
    if(!isGear&&(!Number.isFinite(old)||old+amount>(offer.kind==='silver'?1e12:1e9)))return fail('持有数量达到上限，请先使用。');
    if(isGear&&(e?.nextId||1)+amount>1e9)return fail('装备编号达到上限。');
    if(isGear&&cultivationError(state,heroUid))return fail(cultivationError(state,heroUid));const inventory=init(state),items=[];state.renown-=cost;
    if(offer.kind==='gear')for(let i=0;i<qty;i++)items.push(createItem(state,{slot:offer.slot,level:offer.level,rarity:offer.tier==='field'?'rare':'epic',set:offer.tier==='field'?null:offer.set,schoolSect:offer.tier==='field'?null:meta(h).sect,sect:offer.slot==='weapon'?meta(h).sect:null,expansionId:offer.expansionId,tier:offer.tier,source:`${offer.expansionName}·侠名兑换`,name:offer.name}));
    else if(offer.kind==='set')for(let i=0;i<qty;i++)for(const slot of ['head','chest','waist','wrist','legs','feet'])items.push(createItem(state,{slot,level:offer.level,rarity:'epic',set:offer.set,schoolSect:meta(h).sect,expansionId:offer.expansionId,tier:offer.tier,source:`${offer.expansionName}·侠名兑换`}));
    else if(offer.kind==='iron')inventory.materials[offer.material]=old+amount;
    else if(offer.kind==='stones')inventory.stones[offer.level]=old+amount;
    else if(offer.kind==='color')inventory.colors[colorKey(offer.colorId,offer.level)]=old+amount;
    else state.silver=old+amount;
    return success(`消耗 ${cost} 侠名，兑换${offer.name}${qty>1?' ×'+qty:''}。`,{offerId,quantity:qty,spent:{renown:cost},items});
  }
  function missingDungeonSlot(state,hero,dungeon){
    const armor=['head','chest','waist','wrist','legs','feet'],tier=dungeon.kind==='raid'?'raid':'dungeon',level=10+Math.max(0,D.EXPANSIONS.findIndex(x=>x.id===dungeon.expansionId))*5;
    // A five-person piece, foreign-school set, or another duty's primary stat
    // cannot satisfy this duty's raid collection. Inactive loadouts stay separate.
    const pieces=[...state.equipment.bag,...(state.equipment.vault||[]),...Object.values(hero.equipment||{})];
    const matches=item=>item.expansionId===dungeon.expansionId&&permitted(hero,item)&&(
      item.rarity==='legendary'&&hero.equipment?.[item.slot]?.uid===item.uid||
      item.rarity==='epic'&&item.level>=level&&item.tier===tier&&(!armor.includes(item.slot)||item.set===dungeon.setName)&&(!item.primary||item.primary===primaryAttribute(hero))
    );
    return [...armor,'weapon',...SLOTS.map(x=>x.id).filter(x=>!armor.includes(x)&&x!=='weapon')].find(slot=>!pieces.some(item=>item.slot===slot&&matches(item)));
  }
  function onVictory(state,{route,boss=false,rng=Math.random,dungeon=null}={}){dungeon=dungeon||(boss?(D.DUNGEONS||[]).find(d=>d.id===route?.dungeonId):null);const e=init(state),messages=[],expansionId=dungeon?.expansionId||route?.expansionId||currentExpansion(state)?.id,level=root.JXCombatRules&&state.characterModel&&dungeon?10+Math.max(0,D.EXPANSIONS.findIndex(x=>x.id===expansionId))*5:Math.max(1,Math.min(100,route?.level||5));e.lootCount++;e.stones[1]=(e.stones[1]||0)+(boss?3:1);if(boss||e.lootCount===1||roll(rng)<.22){const index=Math.floor(roll(rng)*SLOTS.length),h=owned(state,state.characterModel?state.playerUid:state.team[Math.floor(roll(rng)*state.team.length)]),set=dungeon?.setName||(root.JXCombatRules?null:route?.setName)||null,rare=root.JXCombatRules&&!dungeon?'rare':boss?'epic':'rare';let slot=SLOTS[index].id,missing;
      if(root.JXCombatRules&&state.characterModel&&boss&&dungeon&&h){missing=missingDungeonSlot(state,h,dungeon);if(missing)slot=missing;}
      else if(root.JXProgression&&boss&&set&&e.lootCount%4!==0){const armor=['head','chest','waist','wrist','legs','feet'],pieces=[...e.bag,...state.heroes.flatMap(a=>Object.values(a.equipment||{}))].filter(x=>x.expansionId===expansionId&&x.set===set);slot=armor.sort((a,b)=>pieces.filter(x=>x.slot===a).length-pieces.filter(x=>x.slot===b).length)[0];}
      const item=createItem(state,{slot,level,rarity:rare,sect:slot==='weapon'?meta(h)?.sect:null,schoolSect:set?meta(h)?.sect:null,archetype:set?(role(h)==='tank'?'vitality':role(h)==='healer'?'healing':'balanced'):['power','precision','breach'][e.lootCount%3],set:slot==='weapon'||['necklace','pendant','ring1','ring2','ranged'].includes(slot)?null:set,effect:slot==='weapon'&&boss?(role(h)==='healer'?'heal':'water'):null,source:dungeon?.name||route?.name||'野外历练',expansionId,...(root.JXCombatRules?{tier:dungeon?(dungeon.kind==='raid'?'raid':'dungeon'):'field'}:{})},{automatic:!!state.characterModel,preserveMissing:!!missing,messages});messages.push(item?(e.vault?.includes(item)?`装备行囊已满，缺件「${item.name}」已暂存，整理背包后自动领取。`:`获得装备「${item.name}」。`):'装备行囊已满，本次普通战利品转为4颗一级五行石。');if(item&&state.characterModel){pendingLoot.add(state);messages.push(...processLoot(state));}}
    if(dungeon&&dungeon.materialDrop!==false){if(dungeon.smallIron){giveMaterial(state,dungeon.smallIron,8);messages.push(`${dungeon.smallIron} +8`);}if(dungeon.bigIron&&roll(rng)<.06*(1+(root.JXCards?.bonuses(state).rareDrop||0))){giveMaterial(state,dungeon.bigIron,1);messages.push(`稀世掉落：${dungeon.bigIron}！`);}if(roll(rng)<.25){const id=COLORS[Math.floor(roll(rng)*COLORS.length)].id,index=D.EXPANSIONS.findIndex(x=>x.id===expansionId),grade=root.JXProgression?Math.min(5,1+Math.floor(Math.max(0,index)/4)):1,key=colorKey(id,grade);e.colors[key]=(e.colors[key]||0)+1;messages.push(`获得${grade}级五彩石。`);}}
    return messages;
  }
  function validateSave(state){if(state.equipment===undefined){if((state.heroes||[]).some(h=>h.equipment||h.enhancements||h.colorStone||h.colorStoneLevel))throw new Error('存档缺少装备库存。');return true;}const e=state.equipment,reject=x=>{throw new Error(`存档装备数据无效：${x}。`);};if(!obj(e)||e.version!==1||!Array.isArray(e.bag)||e.bag.length>300||!integer(e.nextId,1)||!integer(e.lootCount)||!obj(e.materials)||!obj(e.stones)||!obj(e.colors)||!obj(e.quests)||!obj(e.dungeons))reject('结构');if(e.socketTargetLevel!==undefined&&!integer(e.socketTargetLevel,6,8))reject('默认镶嵌等级');const allM=Object.values(MATERIALS).flat();for(const[k,n]of Object.entries(e.materials))if(!allM.includes(k)||!integer(n))reject('神兵材料');for(const[k,n]of Object.entries(e.stones))if(!/^[1-8]$/.test(k)||!integer(n))reject('五行石');for(const[k,n]of Object.entries(e.colors))if(!parseColor(k)||!integer(n))reject('五彩石');
    const seen=new Set(),validateItem=(x,owner,slot)=>{if(!obj(x)||typeof x.uid!=='string'||!/^gear_\d+$/.test(x.uid)||seen.has(x.uid)||!slotDef(x.slot)||slot&&slot!==x.slot||!integer(x.level,1,100)||!['rare','epic','legendary'].includes(x.rarity)||!integer(x.stage,0,4)||typeof x.name!=='string'||x.name.length>100||typeof x.source!=='string'||x.source.length>100)reject('装备条目');seen.add(x.uid);if(+x.uid.slice(5)>=e.nextId)reject('装备序号');if(Object.keys(x).some(k=>!['uid','slot','level','rarity','sect','set','effect','recipeId','role','stage','name','source','expansionId','tier','archetype','schoolSect','primary','locked'].includes(k)))reject('伪造装备属性');if(x.locked!==undefined&&typeof x.locked!=='boolean')reject('装备锁定');if(x.primary!==undefined&&!['strength','agility','spirit','constitution','vitality'].includes(x.primary))reject('装备主属性');if(x.archetype!==undefined&&!ARCHETYPES[x.archetype])reject('装备词条方案');if(x.schoolSect!==undefined&&(!x.set||!D.SECTS.some(s=>s.id===x.schoolSect)||owner&&x.schoolSect!==meta(owner)?.sect))reject('门派套装');if(x.tier!==undefined&&!['field','dungeon','raid'].includes(x.tier))reject('装备阶层');if(x.expansionId!==undefined&&!expansionKnown(x.expansionId))reject('装备资料片');if(x.sect!==null&&!D.SECTS.some(s=>s.id===x.sect)||owner&&x.sect&&x.sect!==meta(owner)?.sect)reject('兵器门派');if(x.slot!=='weapon'&&(x.sect||x.role||x.recipeId||x.effect))reject('兵器部位');if(x.set!==null&&(typeof x.set!=='string'||x.set.length>60)||![null,'water','heal'].includes(x.effect)||![null,'tank','healer','dps','ranged','melee','support'].includes(x.role))reject('装备特效');if(x.rarity==='legendary'){const r=getRecipe(x.recipeId);if(!r||x.slot!=='weapon'||x.level!==r.level||!x.sect||!x.role||r.mode!=='growth'&&x.stage!==0)reject('稀世神兵');}else if(x.recipeId||x.stage||x.role)reject('非神兵附加数据');};
    const holders=[];for(const h of state.heroes){holders.push(h);if(h.loadouts!==undefined){if(!obj(h.loadouts))reject('备用心法');for(const [duty,loadout] of Object.entries(h.loadouts)){if(duty===role(h)||!(meta(h)?.roles||[meta(h)?.role]).includes(duty)||!obj(loadout)||Object.keys(loadout).some(k=>!['equipment','enhancements','colorStone','colorStoneLevel'].includes(k)))reject('备用心法');holders.push({...h,...loadout,role:duty});}}}if(e.vault!==undefined&&(!Array.isArray(e.vault)||e.vault.length>5000))reject('迁移仓库');for(const x of [...e.bag,...(e.vault||[])])validateItem(x);for(const h of holders){if(h.equipment!==undefined){if(!obj(h.equipment))reject('穿戴栏');for(const[slot,x]of Object.entries(h.equipment)){if(!slotDef(slot))reject('装备部位');validateItem(x,h,slot);}}if(h.enhancements!==undefined){if(!obj(h.enhancements))reject('强化栏');for(const[slot,en]of Object.entries(h.enhancements)){if(!slotDef(slot)||!obj(en)||!integer(en.refine,0,8)||!Array.isArray(en.sockets)||en.sockets.length>slotDef(slot).sockets||en.sockets.some(n=>!integer(n,1,8)))reject('精炼熔嵌');if(en.expansionId!==undefined&&(!expansionKnown(en.expansionId)||h.equipment?.[slot]&&en.expansionId!==expansionForItem(h.equipment[slot])))reject('强化资料片');}}if(h.colorStone!==undefined&&!COLORS.some(c=>c.id===h.colorStone))reject('武器五彩石');if(h.colorStoneLevel!==undefined&&(!h.colorStone||!integer(h.colorStoneLevel,1,6)))reject('五彩石等级');}
    if(root.JXProgression&&state.progression)for(const item of [...e.bag,...(e.vault||[]),...holders.flatMap(h=>Object.values(h.equipment||{}))])if(!root.JXProgression.isExpansionUnlocked(state,expansionForItem(item)))reject('装备所属资料片尚未开放');
    if(state.retiredCompanionOwners!==undefined){if(!obj(state.retiredCompanionOwners)||Object.entries(state.retiredCompanionOwners).some(([uid,row])=>!obj(row)||Object.keys(row).some(k=>!['id','uid'].includes(k))||!(D.RETIRED_HERO_IDS||[]).includes(row.id)||!owned(state,row.uid)||owned(state,row.uid).id!==row.id.replace(/_[23]$/,'_1')||typeof uid!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(uid)||owned(state,uid)))reject('历史锻造归属');}
    const legendary=[...e.bag,...(e.vault||[]),...holders.flatMap(h=>Object.values(h.equipment||{}))].filter(x=>x.rarity==='legendary'),linked=new Set();
    for(const[key,q]of Object.entries(e.quests)){const parts=key.split(':'),h=owned(state,parts[0])||owned(state,state.retiredCompanionOwners?.[parts[0]]?.uid),r=getRecipe(parts[1]);if(![2,3].includes(parts.length)||parts.length===3&&parts[2]!==q.role||!h||!r||!obj(q)||!integer(q.stage,0,forgePlan(r,h).steps.length)||!['tank','healer','dps'].includes(q.role)||(meta(h)?.roles||[meta(h)?.role]).indexOf(q.role)<0)reject('锻造任务');const {grantAt}=forgePlan(r,h);if(q.stage>grantAt){const item=legendary.find(x=>x.uid===q.itemUid);if(!item||linked.has(item.uid)||item.recipeId!==r.id||item.sect!==meta(h).sect||item.role!==q.role||item.stage!==(r.mode!=='growth'?0:q.stage-grantAt-1))reject('神兵领奖与升品记录');linked.add(item.uid);}else if(q.itemUid!==undefined)reject('提前领取神兵');}
    if(legendary.some(x=>!linked.has(x.uid)))reject('无制作记录的神兵');
    for(const[id,record]of Object.entries(e.dungeons))if(!(D.DUNGEONS||[]).some(d=>d.id===id)||!obj(record)||!integer(record.runs)||!integer(record.wins)||!integer(record.best,0,100))reject('资料片秘境记录');return true;
  }
  root.JXEquipment={matchesEquipmentFilter,toggleLock,socketTarget,setSocketTarget,migrateRoster,switchLoadout,cultivationError,itemAttributes,primaryAttribute,PRIMARY_BY_SECT,ATTRIBUTE_NAMES,ARCHETYPES,fusionPlan,fusionMaximum,fuseTo,SLOTS,COLORS,MATERIALS,init,bonuses,combatProfile,onVictory,processLoot,validateSave,equip,unequip,refine,socket,inlayColor,fuseStone,forgeInfo,forgeStep,inventory,recipes,heroInfo,materials,stones,salvage,salvagePreview,salvageInferior,createItem,giveMaterial,autoEquip,autoEquipTeam,autoRefine,autoSocket,autoEnhance,quickPreview,exchangeOffers,exchange,equipChapter,colorStatus,setCounts};
})(globalThis);

;
(function(root){
  'use strict';
  const D=root.JXData, ARMOR=['head','chest','waist','wrist','legs','feet'];
  const REVISION='journey-3-20261116', DURATION=7200;
  function init(state){
    if(!state.progression)state.progression={revision:REVISION,index:0,activeSeconds:0,rewardedMinutes:0,recruitments:0,completed:[],finished:false};
    if(state.progression.supplies===undefined)state.progression.supplies=0;
    return state.progression;
  }
  function earnSupplies(state,amount){const p=init(state);p.supplies=Math.min(240,p.supplies+Math.max(0,Math.floor(amount)));}
  function current(state){
    const p=init(state),index=p.index,expansion=D.EXPANSIONS[index];
    return {index,expansion,levelCap:10+index*5,duration:DURATION,requirements:{sets:state.characterModel?1:index<6?2:3,refine:Math.min(6,2+Math.floor(index/4)),stone:Math.min(7,2+Math.floor(index/3)),color:Math.min(5,1+Math.floor(index/4))}};
  }
  const isExpansionUnlocked=(state,id)=>{const n=D.EXPANSIONS.findIndex(x=>x.id===id);return n>=0&&n<=current(state).index;};
  function requiredHeroes(state){const id=current(state).expansion.id;return [...new Set(D.ROUTES.filter(r=>r.expansionId===id).flatMap(r=>r.heroes))].filter(id=>{const h=D.HEROES.find(h=>h.id===id);return h&&!h.hidden&&!h.recruitment;});}
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
  function itinerary(state,expansionId=current(state).expansion.id){
    const expansion=D.EXPANSIONS.find(e=>e.id===expansionId);
    return (expansion?.itinerary||[]).map(id=>D.ROUTES.find(r=>r.id===id)).filter(Boolean).map(r=>({...r,routeId:r.id,done:state.badges.includes(r.id),unlocked:root.JXEngine?.routeUnlocked(state,r.id)??false,active:state.routeId===r.id}));
  }
  function objective(state){
    const c=current(state),p=init(state),entries=itinerary(state),route=entries.find(r=>!state.badges.includes(r.id))||entries[entries.length-1],cleared=entries.filter(r=>state.badges.includes(r.id)).length;
    return {routeId:route.id,name:route.name,done:cleared,mode:state.autoAdvance===false||state.routeLoop?.length?'farm':'progress',expansion:c.expansion,route,nextRoute:entries[entries.indexOf(route)+1]||null,cleared,total:entries.length,ready:cleared===entries.length,canAdvance:cleared===entries.length&&!p.finished,label:p.finished?'山河尽览':cleared===entries.length?'开启下一资料片':'首通 · '+route.name,detail:'击败本路线全部首领后自动前往下一站。',optional:['装备毕业','挑战秘境','卡册收藏']};
  }
  function setMode(state,mode){
    if(!['progress','farm'].includes(mode))return {ok:false,message:'历练模式无效。'};
    state.autoAdvance=mode==='progress';state.routeLoop=[];
    if(mode==='progress'&&!state.battle&&!state.endgame?.active){const goal=objective(state);if(goal.ready)advance(state);else if(root.JXEngine.routeUnlocked(state,goal.route.id))root.JXEngine.setRoute(state,goal.route.id);}
    return {ok:true,message:mode==='progress'?'首通推进：依次探索秘境，普通团本通关后自动进入下一资料片。':'定点刷取：反复历练当前路线，积累装备与材料。'};
  }
  function checklist(state){
    const c=current(state),p=init(state),ids=requiredHeroes(state),team=state.team.map(uid=>state.heroes.find(h=>h.uid===uid)).filter(Boolean),checks=team.map(h=>heroChecks(state,h));
    const main=D.DUNGEONS.find(d=>d.expansionId===c.expansion.id&&d.main!==false),record=state.equipment?.dungeons?.[main?.id],five=D.DUNGEONS.find(d=>d.id==='five_'+c.expansion.id);
    const routeIds=itinerary(state).map(r=>r.id);
    const row=(id,label,value,target,detail,action)=>({id,label,value,target,done:value>=target,detail,action});
    const player=state.heroes.find(h=>h.uid===state.playerUid),playerCheck=player?heroChecks(state,player):null;
    const playerGear=player?Object.values(player.equipment||{}).filter(item=>item.expansionId===c.expansion.id&&(item.tier==='raid'||item.rarity==='legendary')).length:0;
    const items=[
      row('level','五人修为封顶',team.filter(h=>h.level>=c.levelCap).length,5,'五名上阵侠客达到 Lv.'+c.levelCap+'。','team'),
      row('five','五人秘境通关',five?(state.equipment?.dungeons?.[five.id]?.modes?.normal?.wins>0?1:0):1,1,(five?.name||'五人秘境')+'，掉落进入团队会战所需的过渡装备。','dungeons'),
      row('sets','本章六件套',checks.filter(x=>x.set).length,c.requirements.sets,'至少'+c.requirements.sets+'名上阵侠客穿齐「'+c.expansion.setName+'」六件防具。','exchange'),
      row('enhance','成套侠客完成强化',checks.filter(x=>x.complete).length,c.requirements.sets,'同一批侠客六件防具精炼≥'+c.requirements.refine+'；本章装备镶≥12颗'+c.requirements.stone+'级五行石；本章武器装≥'+c.requirements.color+'级五彩石且激活。','equipment'),
      row('routes','主线全程通关',routeIds.filter(id=>state.badges.includes(id)).length,routeIds.length,'野外历程与普通秘境逐一击败全部首领。','map'),
      row('challenge','本章挑战秘境',record?.modes?.challenge?.wins>0?1:0,1,(main?.name||'本章秘境')+' · 挑战难度全首领通关一次。','dungeons')
    ];
    if(state.characterModel){items.splice(0,items.length,
      row('level','主角修为封顶',player?.level>=c.levelCap?1:0,1,'主角达到 Lv.'+c.levelCap+'；同伴仅等级成长，不要求装备养成。','team'),
      row('five','五人秘境通关',five?(state.equipment?.dungeons?.[five.id]?.modes?.normal?.wins>0?1:0):1,1,(five?.name||'五人秘境')+'。','dungeons'),
      row('player-gear','主角毕业装备',playerGear,9,'当前心法12个部位至少9件本资料片团队装备；不同心法独立穿戴与强化。','equipment'),
      row('enhance','主角强化完成',playerCheck?.complete?1:0,1,'主角本章六件套、精炼≥'+c.requirements.refine+'、12颗'+c.requirements.stone+'级五行石、激活'+c.requirements.color+'级五彩石。','equipment'),
      row('routes','主线全程通关',routeIds.filter(id=>state.badges.includes(id)).length,routeIds.length,'野外与团队秘境首领通关。','map'),
      row('challenge','本章团队挑战',record?.modes?.challenge?.wins>0?1:0,1,(main?.name||'团队秘境')+'挑战全首领通关。','dungeons'));
    }
    const routeEntries=itinerary(state);
    for(const item of items)item.optional=!['routes','five'].includes(item.id);
    const routes=items.find(x=>x.id==='routes');if(routes)Object.assign(routes,{label:'本章首通路线',value:routeEntries.filter(r=>state.badges.includes(r.id)).length,target:routeEntries.length,done:routeEntries.every(r=>state.badges.includes(r.id)),detail:'野外 → 真实五人秘境 → 普通团队秘境。挑战难度、满装与精炼不再阻挡下个资料片。'});
    for(const item of items)item.optional=!['five','routes'].includes(item.id);
    return {...c,items,heroes:ids.map(id=>({id,name:D.HEROES.find(h=>h.id===id)?.name,owned:state.dex.includes(id)})),heroChecks:checks,ready:items.filter(x=>!x.optional).every(x=>x.done),finished:p.finished};
  }
  function target(state,id){
    const c=current(state),five=D.DUNGEONS.find(d=>d.id==='five_'+c.expansion.id),raid=D.DUNGEONS.find(d=>d.expansionId===c.expansion.id&&d.main!==false);
    if(id==='five'||id==='challenge'){
      const d=id==='five'?five:raid,mode=id==='five'?'normal':state.equipment?.dungeons?.[raid?.id]?.modes?.normal?.wins>0?'challenge':'normal';
      if(!d)return {page:'dungeons',label:'本章秘境数据缺失',blocked:['未找到本章入口']};
      const ready=root.JXDungeonRules.readiness(state,d,mode);
      return {page:'dungeons',dungeonId:d.id,mode,label:d.name+' · '+(mode==='challenge'?'挑战':'普通'),blocked:ready.unmet};
    }
    if(id==='routes'){
      const route=itinerary(state).find(r=>!state.badges.includes(r.id));
      if(route){const d=D.DUNGEONS.find(d=>d.routeId===route.id);return d?{page:'dungeons',dungeonId:d.id,mode:'normal',label:d.name+' · 普通',blocked:root.JXDungeonRules.readiness(state,d,'normal').unmet}:{page:'map',routeId:route.id,label:route.name,blocked:root.JXEngine.routeUnlocked(state,route.id)?[]:[root.JXEngine.routeRequirement(state,route.id)]};}
    }
    const pages={level:'team',sets:'exchange','player-gear':'equipment',enhance:'equipment',routes:'map'};
    return {page:pages[id]||'journey',label:{level:'修为与队伍',sets:'本章套装兑换','player-gear':'主角装备',enhance:'精炼与宝石',routes:'主线地图'}[id]||'毕业清单',blocked:[]};
  }
  function attempt(state,id='all',rng=Math.random){
    if(state.battle)return {ok:false,message:'当前正在交战，请先点击战后整队，结束本场后再尝试。'};
    if(state.endgame?.active)return {ok:false,message:'请先离开百战异闻录，再尝试历程挑战。'};
    const info=checklist(state),ids=id==='all'?['five','routes']:info.items.some(x=>x.id===id)?[id]:[];
    if(!ids.length)return {ok:false,message:'未找到这项毕业目标。'};
    const logs=[],results=[];let attempted=0,page='journey';
    for(const key of ids){if(checklist(state).items.find(x=>x.id===key)?.done){logs.push('✓ '+key+'：已经完成。');continue;}const t=target(state,key);page=t.page;
      if(t.dungeonId){if(t.blocked.length){logs.push(t.label+'：'+t.blocked.join('；'));continue;}const r=root.JXSystems.challengeExpansionDungeon(state,t.dungeonId,rng,t.mode);results.push(r);logs.push(r.message);if(r.ok){attempted++;logs.push(...(r.log||[]).slice(-5));}}
      else if(t.routeId){const r=root.JXEngine.setRoute(state,t.routeId);if(r.ok){state.running=true;attempted++;page='adventure';}logs.push(r.message);}
      else logs.push('前往'+t.label+'完成养成目标。');
    }
    const out={ok:true,message:attempted?'已尝试 '+attempted+' 项历程挑战，结果如下。':'暂未消耗补给；请按下方提示整备后重试。',attempted,page:id==='all'?'journey':page,log:logs,results};
    root.JXEngine.addLog(state,out.message+' '+logs.join(' / '),'journey');return out;
  }
  function tick(state,seconds,active=state.running){
    if(!active||!Number.isFinite(seconds)||seconds<=0)return;
    const p=init(state);if(p.finished)return;
    p.activeSeconds=Math.min(1e9,p.activeSeconds+seconds);
    const minutes=Math.floor(p.activeSeconds/60),delta=minutes-p.rewardedMinutes;
    if(delta>0){
      p.rewardedMinutes=minutes;
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
    if(!info.ready)return {ok:false,message:'尚未毕业：'+info.items.filter(x=>!x.optional&&!x.done).map(x=>x.label).join('、')+'。'};
    // A chapter's first complete normal-clear awards its remaining cultivation.
    // This is an explicit one-time story reward, never a prerequisite or a shop purchase.
    const player=state.heroes.find(h=>h.uid===state.playerUid);
    if(state.characterModel&&player&&player.level<info.levelCap){let xp=0;const projection={...player};while(projection.level<info.levelCap){xp+=Math.max(0,root.JXEngine.nextLevelXp(projection)-(projection.xp||0));projection.level++;projection.xp=0;}root.JXEngine.grantXp(state,player,xp);state.stats.expEarned+=xp;root.JXEngine.addLog(state,'本章历程结算：获得 '+Math.ceil(xp)+' 修为，主角达到 Lv.'+player.level+'。','chapter');}
    p.completed.push({id:info.expansion.id,seconds:p.activeSeconds});
    if(state.endgame?.active)state.endgame.active=null;
    if(p.index===D.EXPANSIONS.length-1){p.finished=true;return {ok:true,message:'十八章山河尽览，历代江湖毕业！'};}
    p.index++;p.activeSeconds=0;p.rewardedMinutes=0;p.recruitments=0;
    const next=current(state),route=D.ROUTES.find(r=>r.expansionId===next.expansion.id&&r.main!==false&&r.kind==='field');
    state.routeLoop=[];state.routeId=route.id;state.routeProgress=0;state.adventure.dungeonBossIndex=0;state.adventure.stepTimer=0;state.adventure.restSeconds=4;state.adventure.lastTeaRoute=route.id;state.pauseAfterBattle=false;state.running=true;
    root.JXEngine.healTeam?.(state);
    root.JXEngine.addLog(state,'资料片开启：'+next.expansion.name+'；修为上限 Lv.'+next.levelCap+'。精炼、五行石与五彩石保存在当前心法栏位，换装继续保留。','chapter');
    return {ok:true,message:'已开启「'+next.expansion.name+'」，等级上限提升至 '+next.levelCap+'。'};
  }
  function validateSave(state){
    const p=state.progression;
    if(!p||p.revision!==REVISION)throw new Error('这是旧数值体系的存档，请从新版新建江湖开始。');
    const int=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
    if(p.supplies===undefined)p.supplies=0;
    if(!int(p.index,0,D.EXPANSIONS.length-1)||!Number.isFinite(p.activeSeconds)||p.activeSeconds<0||p.activeSeconds>1e9||!int(p.rewardedMinutes,0,1e9)||p.rewardedMinutes!==Math.floor(p.activeSeconds/60)||!int(p.recruitments,0,1e9)||p.recruitments>Math.floor(p.activeSeconds/600)||!int(p.supplies,0,240)||typeof p.finished!=='boolean'||!Array.isArray(p.completed)||p.completed.length!==p.index+(p.finished?1:0)||p.finished&&p.index!==D.EXPANSIONS.length-1)throw new Error('资料片历程数据无效。');
    p.completed.forEach((x,i)=>{if(x.id!==D.EXPANSIONS[i].id||!Number.isFinite(x.seconds)||x.seconds<0||x.seconds>1e9)throw new Error('资料片毕业记录无效。');});
    if(state.heroes.some(h=>h.level>current(state).levelCap))throw new Error('侠客等级超过本资料片上限。');
    if(state.badges.some(id=>{const r=D.ROUTES.find(r=>r.id===id);return r&&!isExpansionUnlocked(state,r.expansionId);}))throw new Error('存档含尚未开放的资料片信物。');
    return true;
  }
  root.JXProgression={REVISION,DURATION,ARMOR,itinerary,objective,setMode,init,current,requiredHeroes,isExpansionUnlocked,checklist,heroChecks,target,attempt,tick,advance,validateSave,earnSupplies};
})(globalThis);

;
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
    return {partySize:hard||index>0||d.kind==='raid'?5:3,level:hard?(root.JXCombatRules?cap:cap-1):d.kind==='raid'?cap-(root.JXCombatRules?1:2):Math.min(d.level,cap-3),itemLevel:hard?cap-4:Math.max(2,Math.min(d.level,cap-2)-4),
      setHeroes:hard?(index>=6?3:2):0,setPieces:6,refine:hard?2+Math.floor(index/4):0,stone:hard?2+Math.floor(index/3):0,
      color:hard?1+Math.floor(index/4):0,roles:hard||d.kind==='raid'?['tank','healer']:[],setName:d.setName,levelCap:cap,supplies:hard&&root.JXCombatRules?(d.kind==='raid'?35:20):0};
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
  function readiness(state,value,difficulty='normal',{includeSupports=true}={}){
    const d=dungeon(value),label=difficulty==='challenge'?'挑战':'普通';
    if(!d||!MODES.includes(difficulty))return {ready:false,unmet:['秘境或难度无效'],requirements:{},actual:{},difficulty,label};
    const req=requirements(difficulty,d),fighters=state.characterModel&&root.JXCombatRules?root.JXCombatRules.party(state,{dungeon:root.JXCards?true:includeSupports,includeSupports}):null;
    const team=fighters?fighters.map(h=>h.sourceHero).filter(Boolean):state.team.map(uid=>state.heroes.find(h=>h.uid===uid)).filter(Boolean),members=team.map(h=>loadout(h,d,req));
    if(state.characterModel&&difficulty==='challenge')req.setHeroes=1;
    if(state.characterModel&&difficulty==='normal'){req.level=1;req.itemLevel=0;}
    const actual={partySize:fighters?fighters.length:team.length,level:team.reduce((n,h)=>n+h.level,0)/Math.max(1,team.length),itemLevel:members.reduce((n,h)=>n+h.itemLevel,0)/Math.max(1,members.length),
      setHeroes:members.filter(h=>h.qualified).length,roles:fighters?fighters.map(h=>h.role):team.map(h=>root.JXEngine.getRole(h)),members};
    if(fighters){const roster=root.JXCards?root.JXCombatRules.party(state,{raid:d.kind==='raid',dungeon:true,includeSupports}):includeSupports&&d.kind==='raid'?root.JXCombatRules.dungeonRoster(state,{raid:true}):fighters;actual.roster=roster.map(h=>({uid:h.uid,id:h.id,artId:h.artId||h.id,name:h.name,role:h.role,sect:h.sect,portrait:h.portrait,npc:!!h.npc,isSupport:!!h.isSupport,level:h.level}));actual.npcCount=roster.filter(h=>h.npc).length;actual.localCount=roster.filter(h=>!h.npc&&!h.isSupport).length;actual.supportCount=roster.filter(h=>h.isSupport).length;}
    if(state.characterModel){const primary=state.heroes.find(h=>h.uid===state.playerUid),load=primary&&loadout(primary,d,req);actual.level=primary?.level||0;actual.itemLevel=load?.itemLevel||0;actual.setHeroes=load?.qualified?1:0;}
    const unmet=[];
    if(root.JXProgression&&!root.JXProgression.isExpansionUnlocked(state,d.expansionId))unmet.push('所属资料片尚未开启');
    if(actual.partySize<req.partySize)unmet.push(`至少 ${req.partySize} 位同行侠客`);
    if(actual.level<req.level)unmet.push(`队伍平均等级 ${req.level}（当前 ${actual.level.toFixed(1)}）`);
    if(actual.itemLevel<req.itemLevel)unmet.push(`十二部位平均装备等级 ${req.itemLevel}（当前 ${actual.itemLevel.toFixed(1)}）`);
    if(root.JXCombatRules&&(state.progression?.supplies||0)<req.supplies)unmet.push(`副本补给 ${state.progression?.supplies||0}/${req.supplies}，野外每次胜利获得补给`);
    if(d.prerequisiteDungeonId&&!(state.equipment?.dungeons?.[d.prerequisiteDungeonId]?.modes?.normal?.wins>0))unmet.push('先完成本章五人秘境，准备团队会战');
    if(req.roles.some(role=>!actual.roles.includes(role)))unmet.push('同行队伍需要承伤与治疗各一位');
    if(difficulty==='challenge'){
      if(!(state.equipment?.dungeons?.[d.id]?.modes?.normal?.wins>0))unmet.push('先完整通关此秘境普通难度');
      if(actual.setHeroes<req.setHeroes)unmet.push(`${req.setHeroes} 位侠客穿戴「${d.setName}」六件套，六部位精炼≥${req.refine}、至少12颗${req.stone}级五行石、已激活的${req.color}级五彩石（当前 ${actual.setHeroes} 位）`);
    }
    return {ready:unmet.length===0,unmet,requirements:req,actual,difficulty,label};
  }
  function enter(state,value,difficulty='normal',options){
    const ready=readiness(state,value,difficulty,options);if(!ready.ready)return {ok:false,message:ready.unmet.join('；'),readiness:ready};
    if(ready.requirements.supplies)root.JXProgression.init(state).supplies-=ready.requirements.supplies;
    return {ok:true,spent:ready.requirements.supplies,readiness:ready};
  }
  function encounter(state,value,bossIndex=0,difficulty='normal'){
    const d=dungeon(value);
    if(!d||!MODES.includes(difficulty)||!Number.isInteger(bossIndex)||bossIndex<0||bossIndex>=d.bosses.length)return null;
    const index=chapter(d),cap=10+index*5,hard=difficulty==='challenge',level=Math.min(d.level,cap-2),name=bossName(d.bosses[bossIndex]);
    const stage=1+bossIndex*.065,scale=d.materialDrop===false?1:1.22;
    const growth=root.JXCombatRules?Math.pow(1.035,level-1):1,raid=d.kind==='raid',single=!!state.characterModel,combatScale=root.JXCombatRules?(raid?(single?1.6:2.2):(single?1:1.2))*growth:1;
    const hp=Math.round((420+level*110)*stage*scale*(hard?(single?2.9:3.8):1)*combatScale);
    const atk=Math.round((32+level*12)*stage*(hard?(single?1.55:1.85):1)*(root.JXCombatRules&&raid?1.1:1)*growth);
    return {id:'dungeon_'+d.id+'_'+bossIndex,name,sect:'',level,hp,maxHp:hp,atk,def:Math.round((5+level*1.6)*(hard?1.3:1)*growth),boss:true,
      bossIndex,bossCount:d.bosses.length,dungeonId:d.id,difficulty,raid,weaknesses:root.JXCombatRules?.weaknesses({name},d),artId:root.JXBossArt?.get(name)?.id||name,
      areaEvery:3,heavyEvery:hard?4:0,enrageRound:hard?(single?18:12):24,
      mechanic:(raid?'主角与四位同伴、五位义士共同作战。':'')+(hard?'每3回合全队伤害；每4回合重击；第'+(single?18:12)+'回合起狂暴。':'每3回合全队伤害；第24回合起狂暴。')+(root.JXCombatRules?'命中兵器弱点削减韧性，破招打断并产生易伤。':'')};
  }
  // Enemy identity is independent of the companion/recruitment pool. Only
  // official encounter names or explicitly documented official categories enter
  // this table; unverified dungeons fall back to their own boss practice images.
  const patrolSources={
    sancai:'https://jx3.xoyo.com/zt/2009/08/06/scz/index.shtml',
    tiangong:'https://jx3.xoyo.com/zt/2009/08/06/tgf/index.shtml',
    kongwu:'https://jx3.xoyo.com/zt/2010/05/25/mjcfrw.shtml',
    lingxiao:'https://jx3.xoyo.com/zt/2009/08/06/lxx/index.shtml',
    wuyan:'https://jx3.xoyo.com/zt/2010/05/25/mjcfrw.shtml',
    dihua:'https://jx3.xoyo.com/zt/2011/05/28/25yx-dihua.shtml',
    huangxue:'https://jx3tc.xoyobox.com/announce/gg.html?id=329',
    damo:'https://jx3tc.xoyobox.com/announce/gg.html?id=58',
    xijin:'https://jx3tc.xoyobox.com/announce/gg.html?id=219'
  };
  const guard=(name,art,source,scope='official-category')=>Object.freeze({name,art,source,scope});
  const patrols=Object.freeze({
    five_fengqi:[guard('神策军',0,patrolSources.sancai),guard('机关人',2,patrolSources.sancai),guard('野兽',7,patrolSources.sancai)],
    tiangong_dungeon:[guard('机关人',2,patrolSources.tiangong)],
    kongwu_dungeon:[guard('神策军',0,patrolSources.kongwu)],
    lingxiao_dungeon:[guard('神策军',0,patrolSources.lingxiao)],
    wuyan_dungeon:[guard('匪寇',6,patrolSources.wuyan)],
    dihua_front_dungeon:[guard('红衣教',4,patrolSources.kongwu)],
    bashu_dungeon:[guard('红衣教',4,patrolSources.dihua)],
    penglai2018_dungeon:[guard('信仰暴徒',4,patrolSources.huangxue,'official-npc')],
    fengtian_dungeon:[guard('天欲宫弟子',6,patrolSources.damo,'official-npc'),guard('天欲宫男宠',6,patrolSources.damo,'official-npc')],
    hengdao_dungeon:[guard('一刀流精锐武士',3,patrolSources.xijin,'official-npc'),guard('永王叛军剑卫',5,patrolSources.xijin,'official-npc'),guard('永王叛军长枪兵',0,patrolSources.xijin,'official-npc')]
  });
  function patrol(value){
    const d=dungeon(value);if(!d)return [];
    return patrols[d.id]||d.bosses.map(b=>({name:bossName(b),art:null,source:d.sourceUrls?.[0]||'',scope:'boss-rehearsal'}));
  }
  function roamingEncounter(state,value,step=0){
    const d=dungeon(value),pool=patrol(d);if(!d||!pool.length||!Number.isInteger(step)||step<0)return null;
    const guardIndex=step%pool.length,entry=pool[guardIndex],level=d.level,growth=root.JXCombatRules?Math.pow(1.035,level-1):1,hp=Math.floor((100+level*25)*growth);
    return {id:'patrol_'+d.id+'_'+guardIndex,name:entry.name,sect:'tiance',portrait:0,level,hp,maxHp:hp,atk:Math.floor((10+level*4.4)*growth),def:Math.floor((3+level*1.25)*growth),boss:false,
      dungeonId:d.id,guardIndex,enemyArt:entry.art,encounterKind:entry.scope==='boss-rehearsal'?'rehearsal':'guard',identityScope:entry.scope};
  }
  function migrateEnemySave(state){
    if(!state||typeof state!=='object')return;
    if(state.dungeonEnemyRevision!==undefined&&state.dungeonEnemyRevision!==1)throw new Error('存档秘境敌人版本无效。');
    if(state.dungeonEnemyRevision===1)return;
    const d=dungeon(state.routeId),battle=state.battle;
    // An old companion encounter may finish neither a patrol nor a boss. Reset
    // only that in-progress battle, preserving inventory, progress and records.
    if(d&&battle&&!battle.boss&&D.HEROES.some(h=>h.id===battle.enemy?.id)&&dungeon(state.routeId)){
      state.battle=null;if(state.adventure)state.adventure.stepTimer=0;
    }
    state.dungeonEnemyRevision=1;
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
  // Recognize only the exact old encounter chains. Unknown/tampered names still fail validation.
  function migrateHistorySave(state){
    if(!state||typeof state!=='object')return;
    if(state.dungeonHistoryRevision===1)return;
    if(state.dungeonHistoryRevision!==undefined)throw new Error('存档秘境沿革版本无效。');
    const previous={fengqi_dungeon:['人熊','邓文峰','商仲永'],cangjian2010_dungeon:['王海银','朱癸','平等','掌火','智慧与镇恶','风火云三使'],five_cangjian2010:['王海银','朱癸','平等']};
    for(const [id,oldBosses]of Object.entries(previous)){
      const d=dungeon(id),rec=state.equipment?.dungeons?.[id];
      if(rec?.modes&&typeof rec.modes==='object'&&!Array.isArray(rec.modes)){
        for(const r of Object.values(rec.modes)){
          if(!r||!Array.isArray(r.bosses)||r.bosses.some((name,i)=>name!==oldBosses[i])||!Number.isInteger(r.best)||r.best<r.bosses.length||r.best>oldBosses.length)continue;
          const validCount=n=>Number.isInteger(n)&&n>=0&&n<=1e9;
          if(!validCount(r.runs)||!validCount(r.wins)||r.wins>r.runs||r.wins>0&&r.best!==oldBosses.length)continue;
          if(r.last&&(!Number.isInteger(r.last.floor)||r.last.floor!==r.bosses.length||typeof r.last.won!=='boolean'||r.last.won&&r.last.floor!==oldBosses.length))continue;
          const progress=n=>n===oldBosses.length?d.bosses.length:Math.min(d.bosses.length-1,Math.floor(n*d.bosses.length/oldBosses.length));
          const floor=progress(r.bosses.length);r.best=progress(r.best);r.bosses=d.bosses.slice(0,floor).map(bossName);
          if(r.last)r.last.floor=floor;
        }
        rec.best=Math.max(0,...Object.values(rec.modes).map(r=>number(r?.best)));
      }
    }
    const active=D.DUNGEONS.find(d=>d.routeId===state.routeId),old=previous[active?.id],enemy=state.battle?.enemy;
    // A replaced encounter cannot safely resume with different stats/party size; resume the route before combat.
    if(enemy&&state.battle.boss&&old?.includes(enemy.name)&&enemy.dungeonId===active.id&&Number.isInteger(enemy.bossIndex)&&enemy.name===old[enemy.bossIndex]&&enemy.id==='dungeon_'+active.id+'_'+enemy.bossIndex&&enemy.name!==active.bosses[state.adventure?.dungeonBossIndex||0]){
      state.battle=null;if(state.adventure)state.adventure.dungeonBossIndex=0;
    }
    // Early five-person maps were incorrectly marked as raids in 4.3.
    if(enemy&&state.battle?.boss&&active?.historicalKind==='dungeon'&&enemy.raid){enemy.raid=false;state.battle.allies=[];}
    state.dungeonHistoryRevision=1;
  }
  function migrateItinerarySave(state){
    if(!state||typeof state!=='object')return;
    if(state.dungeonItineraryRevision===1)return;
    if(state.dungeonItineraryRevision!==undefined)throw new Error('秘境历程版本无效。');
    for(const d of D.DUNGEONS.filter(d=>d.chapterEntry&&d.expansionId!=='fengqi')){
      const rec=state.equipment?.dungeons?.[d.id];if(!rec?.modes)continue;
      const previous=[d.legacyTrialBosses||[],...(d.id==='five_cangjian2010'?[['王海银','朱癸','平等']]:[])];
      if(Object.values(rec.modes).every(r=>Array.isArray(r?.bosses)&&previous.some(chain=>r.bosses.every((name,i)=>name===chain[i])))){
        // Old synthetic trial rewards and inventory remain untouched. Its run
        // history is archived; it cannot count as having cleared a real dungeon.
        state.retiredTrialRecords??={};state.retiredTrialRecords[d.id]=rec;delete state.equipment.dungeons[d.id];
      }
    }
    const route=D.ROUTES.find(r=>r.id===state.routeId);
    if(route?.progressionRoute&&route.unlockRouteId&&!state.badges?.includes(route.id)&&!state.badges?.includes(route.unlockRouteId)){const field=D.ROUTES.find(r=>r.expansionId===route.expansionId&&r.main!==false&&r.kind==='field');state.routeId=field.id;state.routeProgress=0;state.battle=null;if(state.adventure){state.adventure.dungeonBossIndex=0;state.adventure.stepTimer=0;}}
    state.dungeonItineraryRevision=1;
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
  root.JXDungeonRules={dungeon,requirements,loadout,readiness,enter,encounter,patrol,roamingEncounter,patrolSources,record,migrateHistorySave,migrateItinerarySave,migrateEnemySave,validateRecords};
})(globalThis);

;
(function(root){
  'use strict';
  const D=root.JXData;
  // Names and school identities draw on JX3. Rotation, classifications and all
  // coefficients below are adaptations for this turn-based idle game.
  const rows={
    chunyang:[['两仪化形','气劲','混元','damage'],['三环套月','短兵','外功','break'],['坐忘无我','气劲','混元','guard']],
    tiance:[['龙牙','长兵','外功','damage'],['穿云','长兵','外功','break'],['御','长兵','外功','guard']],
    wanhua:[['阳明指','气劲','混元','damage'],['商阳指','气劲','混元','break'],['握针','奇兵','混元','healing']],
    qixiu:[['剑破虚空','双兵','阴性','damage'],['江海凝光','双兵','阴性','break'],['翔鸾舞柳','双兵','阴性','healing']],
    cangjian:[['风来吴山','短兵','外功','damage'],['夕照雷峰','短兵','外功','break'],['泉凝月','短兵','外功','guard']],
    shaolin:[['韦陀献杵','长兵','阳性','damage'],['拿云式','拳脚','阳性','break'],['金刚不坏','拳脚','阳性','guard']],
    wudu:[['蝎心','奇兵','毒性','damage'],['蟾啸','奇兵','毒性','break'],['冰蚕牵丝','奇兵','毒性','healing']],
    tangmen:[['夺魄箭','奇兵','外功','damage'],['追命箭','奇兵','外功','break'],['惊鸿游龙','奇兵','外功','guard']],
    mingjiao:[['净世破魔击','双兵','阴阳','damage'],['生死劫','双兵','阴阳','break'],['贪魔体','双兵','阴阳','guard']],
    gaibang:[['亢龙有悔','拳脚','外功','damage'],['龙跃于渊','拳脚','外功','break'],['笑醉狂','拳脚','外功','healing']],
    cangyun:[['盾猛','长兵','外功','break'],['绝刀','短兵','外功','damage'],['盾墙','长兵','外功','guard']],
    changge:[['宫','奇兵','混元','damage'],['商','奇兵','混元','break'],['徵','奇兵','混元','healing']],
    badao:[['破釜沉舟','长兵','外功','damage'],['刀啸风吟','长兵','外功','break'],['楚河汉界','长兵','外功','guard']],
    penglai:[['溟海御波','拳脚','外功','damage'],['逐波灵游','拳脚','外功','break'],['振翅图南','奇兵','外功','damage']],
    lingxue:[['乱天狼','长兵','外功','damage'],['寂洪荒','长兵','外功','break'],['隐风雷','长兵','外功','guard']],
    yantian:[['三星临','奇兵','混元','damage'],['天斗旋','奇兵','混元','break'],['奇门飞宫','奇兵','混元','guard']],
    yaozong:[['钩吻断肠','奇兵','毒性','damage'],['商陆缀寒','奇兵','毒性','break'],['白芷含芳','奇兵','毒性','healing']],
    daozong:[['断云势','短兵','外功','break'],['决云势','短兵','外功','damage'],['灭影追风','短兵','外功','guard']],
    wanling:[['劲风簇','奇兵','外功','damage'],['引风唤灵','驭驶','外功','break'],['汇灵合契','驭驶','外功','guard']],
    duanshi:[['断脉','气劲','混元','damage'],['破穴','气劲','混元','break'],['雪重花满','气劲','混元','guard']],
    wuxiang:[['生地狱','驭驶','阴性','damage'],['夹线','驭驶','阴性','break'],['落笼簿','驭驶','阴性','damage']]
  };
  const effectLabels={damage:'伤害',break:'破招',guard:'御守',healing:'续航'};
  const GOALS={damage:'输出优先',break:'破招优先',survival:'生存优先',healing:'续航优先',loot:'寻宝均衡'};
  const SOURCES={penglai:'https://jx3.xoyo.com/show-4422-461-1.html',chunyang:'https://jx3.xoyo.com/show-4422-510-1.html',wanhua:'https://jx3.xoyo.com/show-2466-7558-1.html',duanshi:'https://jx3tc.xoyobox.com/show-98-768-1.html',wuxiang:'https://jx3.xoyo.com/mobile/gg.html?id=1335478'};
  const SKILLS=D.SECTS.flatMap(s=>(rows[s.id]||[]).map((a,i)=>({id:s.id+'_'+i,sect:s.id,name:a[0],type:a[1],damageType:a[2],effect:a[3],original:!!a[4],sourceUrl:SOURCES[s.id]||'https://jx3.xoyo.com/show-2466-6233-1.html',maxRank:5,adapted:true})));
  const byId=new Map(SKILLS.map(x=>[x.id,x]));
  const player=s=>s.heroes?.find(h=>h.uid===s.playerUid)||s.heroes?.find(h=>h.isPlayer)||s.heroes?.[0];
  const native=s=>D.HEROES.find(h=>h.id===player(s)?.id)?.sect||D.SECTS[0].id;
  const budget=s=>Math.min(80,6+Math.floor(Math.max(1,player(s)?.level||1)/2)+Math.min(5,player(s)?.skillLevel||0)*2);
  const spent=m=>Object.values(m.ranks||{}).reduce((n,v)=>n+v,0);
  function sync(s){const h=player(s);if(h)h.martialBuild={equipped:[...s.martial.equipped],ranks:{...s.martial.ranks},goal:s.martial.goal};}
  function init(s){
    if(!s.martial){const ids=SKILLS.filter(x=>x.sect===native(s)).map(x=>x.id);s.martial={version:1,learned:ids,ranks:Object.fromEntries(ids.map(id=>[id,1])),equipped:ids,goal:'damage'};}
    sync(s);return s.martial;
  }
  function info(s){const m=init(s),total=budget(s),used=spent(m);return {total,used,available:Math.max(0,total-used),native:native(s),build:m,skills:SKILLS,rotation:m.equipped.map(id=>({...byId.get(id),rank:m.ranks[id]||0})),goal:m.goal};}
  const result=(ok,message,extra={})=>({ok,message,...extra});
  function canChange(s){return !s.battle&&!s.endgame?.active;}
  function learn(s,id){
    const m=init(s),skill=byId.get(id);if(!skill)return result(false,'未找到这门武学。');
    if(m.learned.includes(id))return result(false,'已学会这门武学。');
    if(!canChange(s))return result(false,'请结束当前战斗，再研习武学。');
    if(player(s).level<5&&skill.sect!==native(s))return result(false,'主角达到5级后开放跨门派研习。');
    const silver=500,insight=3;
    if(s.silver<silver||player(s).insight<insight)return result(false,'研习需要500银两与3点主角心得。');
    s.silver-=silver;player(s).insight-=insight;m.learned.push(id);m.ranks[id]=0;sync(s);
    return result(true,'已学会'+skill.name+'，分配悟性后可编入招式循环。');
  }
  function allocate(s,id,delta=1){
    const m=init(s),skill=byId.get(id);if(!skill||!m.learned.includes(id))return result(false,'请先学会这门武学。');
    if(!canChange(s))return result(false,'战斗中不能更改悟性。');
    if(![1,-1].includes(delta))return result(false,'悟性调整无效。');
    const next=(m.ranks[id]||0)+delta;if(next<0||next>5)return result(false,'每门武学可分配0—5点悟性。');
    if(delta>0&&spent(m)>=budget(s))return result(false,'悟性不足；升级主角或研习主角武学可增加悟性。');
    if(next===0&&m.equipped.includes(id)&&m.equipped.length===1)return result(false,'至少保留一门有悟性的循环招式。');
    m.ranks[id]=next;if(!next)m.equipped=m.equipped.filter(x=>x!==id);sync(s);return result(true,skill.name+'悟性：'+next+' / 5。');
  }
  function equip(s,id){
    const m=init(s);if(!canChange(s))return result(false,'战斗中不能更改招式循环。');
    if(!byId.has(id)||!m.learned.includes(id)||!m.ranks[id])return result(false,'学会并分配至少1点悟性后可加入循环。');
    if(m.equipped.includes(id)){if(m.equipped.length===1)return result(false,'至少保留一门循环招式。');m.equipped=m.equipped.filter(x=>x!==id);}
    else {if(m.equipped.length>=3)return result(false,'循环最多3门招式，请先移出一门。');m.equipped.push(id);}
    sync(s);return result(true,'招式循环已更新。');
  }
  function autoAssign(s,goal='damage',type='all'){
    const m=init(s);if(!canChange(s))return result(false,'请结束当前战斗后再一键配点。');
    if(!GOALS[goal])return result(false,'未找到这个养成目标。');
    const preferred={damage:'damage',break:'break',survival:'guard',healing:'healing',loot:'damage'}[goal];
    const candidates=m.learned.map(id=>byId.get(id)).filter(Boolean).sort((a,b)=>Number(b.effect===preferred)-Number(a.effect===preferred)||Number(b.type===type)-Number(a.type===type)||Number(b.sect===native(s))-Number(a.sect===native(s))||a.id.localeCompare(b.id));
    const picked=candidates.slice(0,3);m.ranks=Object.fromEntries(m.learned.map(id=>[id,0]));let left=budget(s);
    for(const skill of picked){const n=Math.min(5,Math.max(1,left-(picked.length-picked.indexOf(skill)-1)));m.ranks[skill.id]=n;left-=n;}
    for(const skill of candidates){if(!left)break;const n=Math.min(5-(m.ranks[skill.id]||0),left);m.ranks[skill.id]=(m.ranks[skill.id]||0)+n;left-=n;}
    m.equipped=picked.map(x=>x.id);m.goal=goal;sync(s);
    const cards=root.JXCards?.autoAssign?.(s,goal==='survival'?'survival':goal==='loot'?'loot':{goal:'damage',type:picked[0]?.type||'damage'});
    return result(true,'已按「'+GOALS[goal]+'」分配悟性与招式'+(cards?.ok?'，并搭配辅助侠客。':'。'),{cards});
  }
  function reset(s){const m=init(s);if(!canChange(s))return result(false,'请结束当前战斗后重置。');const id=m.equipped[0]||m.learned[0];m.ranks=Object.fromEntries(m.learned.map(x=>[x,0]));m.ranks[id]=1;m.equipped=[id];sync(s);return result(true,'悟性已返还，可免费重新分配；已学武学保留。');}
  function combatProfile(hero,round=1){
    if(hero?.isPlayer===false||!hero?.martialBuild)return null;
    const m=hero.martialBuild,rotation=m.equipped.filter(id=>byId.has(id)&&(m.ranks[id]||0)>0);if(!rotation.length)return null;
    const id=rotation[(Math.max(1,round)-1)%rotation.length],skill=byId.get(id),rank=Math.max(1,Math.min(5,m.ranks[id]||1));
    const trained=Object.entries(m.ranks).map(([key,n])=>({skill:byId.get(key),n})).filter(x=>x.skill&&x.n>0);
    const mastery=Math.min(.3,trained.filter(x=>x.skill.type===skill.type).reduce((v,x)=>v+x.n*.003,0)),guard=Math.min(.2,trained.filter(x=>x.skill.effect==='guard').reduce((v,x)=>v+x.n*.003,0)),healing=Math.min(.3,trained.filter(x=>x.skill.effect==='healing').reduce((v,x)=>v+x.n*.005,0));
    return {skill,rank,label:skill.name,weaponType:skill.type,damageType:skill.damageType,damageMultiplier:(1+rank*.045+(skill.effect==='damage'?.14:0))*(1+mastery),breakPower:16+rank*2+(skill.effect==='break'?14:0),damageReduction:Math.min(.4,guard+(skill.effect==='guard'?.06+rank*.025:0)),shield:skill.effect==='guard'?.15+rank*.04:0,teamHeal:skill.effect==='healing'?.16+rank*.045:0,healMultiplier:(1+rank*.06)*(1+healing),mastery,guard,healing};
  }
  function validateSave(s){
    if(!s.martial){init(s);return true;}const m=s.martial;
    const fail=()=>{throw new Error('武学悟性或招式循环无效。');};
    if(m.version!==1||!Array.isArray(m.learned)||m.learned.length<1||m.learned.length>SKILLS.length||new Set(m.learned).size!==m.learned.length||m.learned.some(id=>!byId.has(id))||!m.ranks||Array.isArray(m.ranks)||!GOALS[m.goal])fail();
    if(Object.entries(m.ranks).some(([id,n])=>!m.learned.includes(id)||!Number.isInteger(n)||n<0||n>5)||spent(m)>budget(s))fail();
    if(!Array.isArray(m.equipped)||m.equipped.length<1||m.equipped.length>3||new Set(m.equipped).size!==m.equipped.length||m.equipped.some(id=>!m.learned.includes(id)||!m.ranks[id]))fail();sync(s);return true;
  }
  root.JXMartial={SKILLS,GOALS,effectLabels,init,info,learn,allocate,equip,autoAssign,reset,combatProfile,validateSave};
})(globalThis);

;
(function(root){
  'use strict';
  const TYPES=['短兵','长兵','气劲','奇兵','拳脚','双兵','驭驶'];
  const meta=h=>root.JXData.HEROES.find(x=>x.id===h?.id);
  const roll=rng=>Math.max(0,Math.min(.999999,Number(rng())||0));
  function weaknesses(enemy={},route={}){
    if(Array.isArray(enemy.weaknesses)&&enemy.weaknesses.length)return [...enemy.weaknesses];
    if(Array.isArray(route.weaknesses)&&route.weaknesses.length)return [...route.weaknesses];
    let hash=2166136261;for(const char of String(enemy.name||enemy.id||route.boss||'江湖')+'|'+String(route.expansionId||route.id||enemy.dungeonId||''))hash=Math.imul(hash^char.charCodeAt(0),16777619)>>>0;
    const first=hash%TYPES.length,second=(first+1+(hash>>>8)%(TYPES.length-1))%TYPES.length;
    return [TYPES[first],TYPES[second]];
  }
  function profile(hero,round=1,enemy={}){
    const m=meta(hero)||hero||{},rank=Math.max(1,Math.min(4,m.rarity||1)),role=root.JXEngine?.getRole(hero)||hero.role||m.role||'dps';
    const active=rank>=2&&round%3===0;
    const p={rank,role,active,label:active?(m.skill||'侠客绝技'):'基础招式',damageMultiplier:1+(rank-1)*.045,healMultiplier:1+(rank-1)*.08,teamHeal:0,shield:0,extraStrike:0,breakPower:active?24:16,skills:[{name:m.skill||'基础招式',kind:'基础',description:'兵器命中弱点削减韧性，破招后全队获得输出窗口。'}]};
    if(rank>=2){p.skills.push({name:(m.skill||'门派武学')+'·精要',kind:'主动',description:'每3回合发动：输出强化、承伤护盾或治疗增幅。'});if(active){p.damageMultiplier+=role==='dps'?.5:.18;if(role==='tank')p.shield=.34;if(role==='healer')p.teamHeal=.35;}}
    if(rank>=3){p.skills.push({name:role==='tank'?'护阵':role==='healer'?'济世':'破绽追击',kind:'被动',description:role==='tank'?'每回合为自身形成护盾。':role==='healer'?'治疗最低气血者时增效，绝技额外恢复全队。':'敌人破招时伤害提升20%。'});if(role==='tank')p.shield+=.12;if(role==='healer'){p.healMultiplier+=.2;if(active)p.teamHeal+=.3;}if(role==='dps'&&enemy.brokenTurns>0)p.damageMultiplier+=.2;}
    if(rank>=4){p.skills.push({name:role==='tank'?'宗师·固阵':role==='healer'?'宗师·回春':'宗师·乘胜',kind:'绝技',description:role==='tank'?'绝技为全队提供护盾。':role==='healer'?'绝技额外恢复全队，危急治疗提升。':'绝技追加一次攻击，弱点削韧进一步提高。'});if(active){if(role==='dps')p.extraStrike=1;if(role==='healer')p.teamHeal+=.45;p.breakPower+=8;}}
    if(m.redDust&&m.nativeRole==='support'){
      if(m.id==='companion_yuejiahe'){p.shield+=.16;p.teamShield=active;p.skills.push({name:'识隙护持',kind:'固有援护',description:'每回合形成自身护盾，绝技回合为同行队伍护持；本作将原作辅助职责适配为输出兼援护。'});}
      if(m.id==='companion_jingtian'){p.teamHeal+=.16;p.skills.push({name:'仙缘济行',kind:'固有援护',description:'每回合以攻击的16%恢复尚在场的同伴；本作将原作辅助职责适配为输出兼援护。'});}
    }
    // Provenance accompanies displayed techniques; combat coefficients remain independent.
    p.skillSourceLabel=m.skillSourceLabel||'本作改编武学';
    p.skills=p.skills.map((skill,index)=>({...skill,sourceLabel:index===0?p.skillSourceLabel:'本作战斗效果',adapted:true}));
    const trained=1+(hero?.isPlayer===false?0:Math.min(5,hero?.skillLevel||0))*.05;p.damageMultiplier*=trained;p.healMultiplier*=trained;p.breakPower*=trained;
    const martial=root.JXMartial?.combatProfile(hero,round);
    if(martial){p.label=martial.label;p.weaponType=martial.weaponType;p.damageType=martial.damageType;p.damageMultiplier*=martial.damageMultiplier;p.healMultiplier*=martial.healMultiplier;p.breakPower=martial.breakPower*trained;p.shield+=martial.shield;p.teamHeal+=martial.teamHeal;p.damageReduction=martial.damageReduction;p.martial=martial;p.skills=hero.martialBuild.equipped.map(id=>{const skill=root.JXMartial.SKILLS.find(x=>x.id===id);return {name:skill.name,kind:'主角循环 · '+skill.type,description:'悟性'+hero.martialBuild.ranks[id]+' / 5 · '+skill.damageType+' · '+root.JXMartial.effectLabels[skill.effect],sourceLabel:skill.original?'本作自创招式':'剑网3招式取材 · 本作效果改编',adapted:true};});}
    return p;
  }
  function assistFighter(state,team,role,index,{raid=false}={}){
    const player=team.find(h=>h.uid===state.playerUid)||team[0],cap=root.JXProgression?.current(state).levelCap||10;
    const level=Math.max(1,Math.min(cap,player?.level||cap)),growth=Math.pow(1.035,level-1);
    const slot=role==='tank'?0:role==='healer'?1:2+index%3;
    const hp=Math.round(Math.min((player?.maxHp||500)*.8,(350+level*48)*growth)*(role==='tank'?1.35:1));
    const atk=Math.round(Math.min((player?.atk||80)*.7,(50+level*8)*growth));
    return {uid:(raid?'npc_raid_':'npc_dungeon_')+index,id:(raid?'npc_raid_':'npc_dungeon_')+index,
      name:(raid?['会战守卫','会战医师','双刃义士','拳掌义士','御兽义士']:['援军守卫','援军医师','双刃义士','拳掌义士','御兽义士'])[slot]+'（人机）',
      sect:['tiance','wanhua','chunyang','tiance','tangmen'][slot],portrait:[1,2,0,1,7][slot],artId:['tiance_1','wanhua_1','chunyang_1','tiance_1','tangmen_1'][slot],
      role,weaponType:['长兵','气劲','双兵','拳脚','驭驶'][slot],rarity:2,skill:['固守','回春','双刃破风','伏虎拳','灵兽协击'][slot],
      level,maxHp:hp,hp,atk,def:Math.round(Math.min((player?.def||20)*.75,(12+level*3)*growth)),crit:.04,npc:true,damageDone:0,healingDone:0,shield:0,revives:0};
  }
  function party(state,{raid=false,live=false,dungeon=false,includeSupports=true}={}){
    root.JXMartial?.init(state);if(root.JXCards)root.JXCards.init(state);
    const local=state.team.map(uid=>state.heroes.find(h=>h.uid===uid)).filter(Boolean),player=state.heroes.find(h=>h.uid===state.playerUid),supports=dungeon&&includeSupports?(state.battleSupports||[]).filter(h=>meta(h)&&h.isSupport).slice(0,4):[];
    const selected=state.characterModel&&player?[player,...supports,...(root.JXCards?[]:local.filter(h=>h.uid!==player.uid))]:local;
    const team=selected.slice(0,5).map(h=>{const m=meta(h),s=root.JXEngine.getHeroStats(h);return {uid:h.uid,id:h.id,name:h.isSupport?m.name+'（'+h.ownerName+'助战）':m.name,ownerName:h.ownerName,isSupport:!!h.isSupport,sect:m.sect,portrait:m.portrait,role:root.JXEngine.getRole(h),weaponType:m.weaponType,rarity:m.rarity,skill:m.skill,level:h.level,maxHp:s.hp,hp:live&&!h.isSupport?h.hp:s.hp,atk:s.atk,def:s.def,crit:s.crit||0,sourceHero:h,npc:false,damageDone:0,healingDone:0,shield:0,revives:0};});
    // Complete offline dungeon parties without creating heroes or persisting borrowed equipment.
    if(dungeon&&state.characterModel&&player){
      let next=0;
      for(const duty of ['tank','healer'])if(!team.some(h=>h.role===duty)){
        if(team.length===5){const replace=team.findLastIndex(h=>h.uid!==player.uid&&!h.isSupport&&h.role==='dps');if(replace>=0)team.splice(replace,1);}
        if(team.length<5)team.push(assistFighter(state,team,duty,next++));
      }
      while(team.length<5)team.push(assistFighter(state,team,'dps',next++));
    }
    if(raid&&team.length)for(let i=0;i<5;i++)team.push(assistFighter(state,team,['tank','healer','dps','dps','dps'][i],i,{raid:true}));
    root.JXCards?.applyParty(state,team,{live});
    const pet=root.JXData.PETS.find(p=>p.id===state.activePet);if(pet)for(const h of team){if(pet.effect==='atk')h.atk*=1+pet.value;if(pet.effect==='def')h.def*=1+pet.value;if(pet.effect==='resist')h.petResist=pet.value;}return team;
  }
  function dungeonRoster(state,{raid=false}={}){return party(state,{raid,dungeon:true});}
  function turn(team,enemy,{round=1,rng=Math.random,damageMultiplier=1,enemyDamageMultiplier=1}={}){
    const events=[],emit=(type,actor,target,amount,before,extra={})=>events.push({type,actor:{...actor,sourceHero:undefined},target:{...target,sourceHero:undefined},amount,hpBefore:before,hpAfter:target.hp,...extra});
    enemy.weaknesses=weaknesses(enemy);enemy.maxHp=enemy.maxHp||enemy.hp;enemy.maxToughness=enemy.maxToughness|| (enemy.raid?150:enemy.boss?90:36);
    if(!Number.isFinite(enemy.toughness))enemy.toughness=enemy.maxToughness;
    if(enemy.brokenTurns>0){enemy.brokenTurns--;if(!enemy.brokenTurns)enemy.toughness=enemy.maxToughness;}
    const heal=(actor,target,value,label)=>{if(!target||target.hp<=0)return;const before=target.hp;target.hp=Math.min(target.maxHp,target.hp+Math.max(0,Math.round(value)));const amount=target.hp-before;if(amount){actor.healingDone=(actor.healingDone||0)+amount;emit('heal',actor,target,amount,before,{label});}};
    for(const hero of team.filter(h=>h.hp>0)){
      if(enemy.hp<=0)break;
      const p=profile(hero.sourceHero||hero,round,enemy),critical=roll(rng)<Math.min(.75,.1+(hero.crit||0)),gear=hero.sourceHero?root.JXEquipment?.combatProfile(hero.sourceHero,round,critical)||{}:{};
      const living=team.filter(h=>h.hp>0),hurt=[...living].sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
      if(hero.cardRegen)heal(hero,hero,hero.maxHp*Math.min(.08,hero.cardRegen),'侠客后台援护');
      if(hero.role==='healer')heal(hero,hurt,(hero.atk*.95+10)*p.healMultiplier*(gear.healMultiplier||1),p.label);
      if(p.teamHeal||gear.teamHeal)for(const ally of living)heal(hero,ally,hero.atk*(p.teamHeal+(gear.teamHeal||0))*(gear.healMultiplier||1),p.label);
      if(p.shield){const targets=(p.rank===4&&p.active)||p.teamShield?living:[hero];for(const ally of targets)ally.shield=Math.max(ally.shield||0,Math.round(hero.atk*p.shield));}
      for(let strike=0;strike<1+p.extraStrike+(gear.extraStrike||0)&&enemy.hp>0;strike++){
        const weaponType=p.weaponType||hero.weaponType,match=enemy.weaknesses.includes(weaponType),before=enemy.hp;
        const cardDamage=1+Math.max(0,hero.cardDamageByType?.[weaponType]||0);
        const amount=Math.max(2,Math.round((hero.atk*(hero.role==='healer'?.7:1.12)-enemy.def*.45)*(critical?1.6:1)*(enemy.brokenTurns>0?1.6:enemy.boss?.22:1)*(match?1.08:1)*p.damageMultiplier*(gear.damageMultiplier||1)*cardDamage*damageMultiplier*(.94+roll(rng)*.12)));
        enemy.hp=Math.max(0,enemy.hp-amount);hero.damageDone=(hero.damageDone||0)+Math.min(before,amount);emit('attack',hero,enemy,amount,before,{critical,advantage:match,label:p.label,weaponType,damageType:p.damageType||meta(hero)?.damageType});
        if(gear.lifesteal)heal(hero,hero,Math.min(before,amount)*gear.lifesteal,'神兵汲取');
        if(!enemy.brokenTurns){enemy.toughness=Math.max(0,enemy.toughness-(match?p.breakPower:2));if(enemy.toughness===0){enemy.brokenTurns=3;enemy.interrupted=true;emit('break',hero,enemy,0,enemy.hp,{label:'破招！打断招式，易伤持续2回合'});}}
      }
    }
    if(enemy.hp>0&&team.some(h=>h.hp>0)){
      if(enemy.interrupted){enemy.interrupted=false;events.push({type:'interrupt',label:enemy.name+'招式被破，无法行动。'});}
      else{const living=team.filter(h=>h.hp>0),tank=living.find(h=>h.role==='tank'),area=enemy.boss&&round%(enemy.areaEvery||3)===0,targets=area?living:[tank||living[0]];
        for(const target of targets){const p=target.sourceHero?root.JXEquipment?.combatProfile(target.sourceHero,round,false)||{}:{},martial=profile(target.sourceHero||target,round,enemy),before=target.hp,enraged=enemy.enrageRound&&round>=enemy.enrageRound,heavy=enemy.heavyEvery&&round%enemy.heavyEvery===0;let amount=Math.max(3,Math.round((enemy.atk*(enraged?1.8:1)*(heavy?1.45:1)-target.def*(target.role==='tank'?.65:.38))*(1-(p.damageReduction||0))*(1-(martial.damageReduction||0))*(1-(target.cardResist||0))*(1-(target.petResist||0))*enemyDamageMultiplier));const absorbed=Math.min(amount,target.shield||0);target.shield=(target.shield||0)-absorbed;amount-=absorbed;target.hp=Math.max(0,target.hp-amount);emit('enemy-attack',enemy,target,amount,before,{area,absorbed,label:heavy?'破甲重击':area?'横扫':'出招'});if(!target.hp&&(target.revives||0)<(p.revive||0)){target.revives=(target.revives||0)+1;target.hp=Math.ceil(target.maxHp*.3);emit('heal',target,target,target.hp,0,{label:'神兵不屈'});}}
      }
    }
    return {events,won:enemy.hp<=0,lost:!team.some(h=>h.hp>0),damage:team.reduce((n,h)=>n+(h.damageDone||0),0)};
  }
  function suggestLineup(state,target={}){
    const weak=weaknesses(target,root.JXEngine.getRoute(state)),selected=[],assignments=[],coverage=new Set();
    const duties=['tank','healer','dps','dps','dps'],player=state.characterModel&&state.heroes.find(h=>h.uid===state.playerUid);
    if(player){selected.push(player.uid);const duty=root.JXEngine.getRole(player);assignments.push({uid:player.uid,role:duty});duties.splice(duties.indexOf(duty),1);if(weak.includes(meta(player).weaponType))coverage.add(meta(player).weaponType);}
    for(const duty of duties){
      const candidates=state.heroes.filter(h=>!selected.includes(h.uid)&&(meta(h).roles||[meta(h).role]).includes(duty));
      candidates.sort((a,b)=>score(b,duty)-score(a,duty)||a.uid.localeCompare(b.uid));const h=candidates[0]||state.heroes.filter(h=>!selected.includes(h.uid)).sort((a,b)=>score(b,root.JXEngine.getRole(b))-score(a,root.JXEngine.getRole(a)))[0];
      if(h){selected.push(h.uid);const role=(meta(h).roles||[meta(h).role]).includes(duty)?duty:root.JXEngine.getRole(h);assignments.push({uid:h.uid,role});if(weak.includes(meta(h).weaponType))coverage.add(meta(h).weaponType);}
    }
    function score(h,duty){const stats=root.JXEngine.getHeroStats({...h,role:duty}),m=meta(h),covered=weak.includes(m.weaponType)&&!coverage.has(m.weaponType),base=duty==='tank'?stats.hp*.5+stats.def*8:duty==='healer'?stats.atk*5+stats.hp*.1:stats.atk*4+stats.hp*.06;return base*(1+(m.rarity-1)*.06)*(covered?1.28:1);}
    return {team:selected,assignments,weaknesses:weak,covered:[...coverage]};
  }
  root.JXCombatRules={TYPES,weaknesses,profile,party,dungeonRoster,turn,suggestLineup};
})(globalThis);

;
(function(root){
'use strict';
const names=["人熊","邓文峰","商仲永","王海银","朱癸","平等","掌火","智慧与镇恶","风火云三使","牡丹","塔洛马蒂与姬无双","慕容追风","乌蒙贵的杰作","卫栖梧","阿萨辛","卓婉清","沙利亚","枯荣大师","段宗公、泰崇傣与阁罗鸿","萧沙","摩提耶罗","陈和尚、康雪烛、柳公子与阁罗凤","李倓","何莘涯","耶律燕与独孤问俗","六道傀儡","剑圣","无名","伊玛目","安禄山","靺鞨三骑将","安雨","白陶","史思明","韩非池","莫雨","李白","黑齿元佑","哥舒翰","安庆绪","史朝英","柳愚","柳哲","柳时清","解语","柳秀岳","柳鸾旗","康疑","铂尔","罗纳真","没藏呼月与拓跋思羽","拿云","铁黎","陈徽","藤原武裔","源思弦","驺吾","方有崖","余晖","宓桃","武雪散","猿飞","哑头陀","岳琳与岳琅","巨型尖吻凤","桑乔","悉达罗摩","尤珈罗摩","月泉淮","乌蒙贵","张景超与张法雷","刘展","苏凤楼","韩敬青","藤原佑野","李重茂","魏华","钟不归","岑伤","鬼筹","麒麟","骆耀阳","韦柔丝","宋泉","伍靖远","苏什","芭德","巴图仁钦","竭勒","图南子","叶葵","尹雪尘","突利和顺","田承嗣","伊曼·寂夜与伊曼·逐焰","阿史那承庆","史朝义","方季常","平三指","震天甲士","冯度","王彦直","鬼影小次郎","虎啸","射云","华鹤炎","罗翼","常万山","杜姬欣","阿里曼监察使","阿里曼入教主祭司","柳随风","孙敬萧","李尧","玄悲","陌香","方宇谦","席庶云","曹炎烈","沙叱博","阿史那从礼","苏曼莎","令狐伤","王翦","石麒麟","探雪"];
const entries=names.map((name,index)=>Object.freeze({name,index,className:'boss-art-'+String(index).padStart(3,'0'),sheet:'bosses-'+String(Math.floor(index/12)+1).padStart(2,'0')+'.png',cell:index%12}));
entries.push(Object.freeze({name:'谢云流',index:126,className:'boss-art-xieyunliu',sheet:'xieyunliu.svg',cell:0,vector:true,schematic:true}));
for(const entry of [{"name":"叶芳致","index":127,"className":"boss-art-identity-1ed2e1c1f3ca","sheet":"identity-1ed2e1c1f3ca.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"叶无心","index":128,"className":"boss-art-identity-4d572763ba39","sheet":"identity-4d572763ba39.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"叶琦菲","index":129,"className":"boss-art-identity-b3f403c632cd","sheet":"identity-b3f403c632cd.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"桃叶仙","index":130,"className":"boss-art-identity-e516cf7a6fb2","sheet":"identity-e516cf7a6fb2.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"伊曼云与濯尘","index":131,"className":"boss-art-identity-cc257f1c1572","sheet":"identity-cc257f1c1572.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"多多","index":132,"className":"boss-art-identity-751c81a40a47","sheet":"identity-751c81a40a47.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"问寒松","index":133,"className":"boss-art-identity-2e362eabe665","sheet":"identity-2e362eabe665.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"辛然与吴颖莲","index":134,"className":"boss-art-identity-f8743f443d9c","sheet":"identity-f8743f443d9c.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"薛山","index":135,"className":"boss-art-identity-b1fe2df544ef","sheet":"identity-b1fe2df544ef.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"西域狮王","index":136,"className":"boss-art-identity-05ad11ff77a4","sheet":"identity-05ad11ff77a4.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"水狼","index":137,"className":"boss-art-identity-8f163618602b","sheet":"identity-8f163618602b.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"火狼","index":138,"className":"boss-art-identity-66ad6769b503","sheet":"identity-66ad6769b503.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"风狼","index":139,"className":"boss-art-identity-738fa7ecb592","sheet":"identity-738fa7ecb592.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"中田海","index":140,"className":"boss-art-identity-2148ffbb4d6e","sheet":"identity-2148ffbb4d6e.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"拓跋离","index":141,"className":"boss-art-identity-49f808968d6d","sheet":"identity-49f808968d6d.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"独孤问俗","index":142,"className":"boss-art-identity-6c0fa8a4a43f","sheet":"identity-6c0fa8a4a43f.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"花千雨","index":143,"className":"boss-art-identity-45e99ac58d1a","sheet":"identity-45e99ac58d1a.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"暗","index":144,"className":"boss-art-identity-140ede26426d","sheet":"identity-140ede26426d.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"高力士","index":145,"className":"boss-art-identity-9145848da037","sheet":"identity-9145848da037.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"慕容绿珠","index":146,"className":"boss-art-identity-6faa6d1ca4cb","sheet":"identity-6faa6d1ca4cb.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"宫天蝉","index":147,"className":"boss-art-identity-1ab19f2d1305","sheet":"identity-1ab19f2d1305.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"雨卓承","index":148,"className":"boss-art-identity-9a23ec18aee3","sheet":"identity-9a23ec18aee3.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"柳夕的心魔","index":149,"className":"boss-art-identity-df1f1d2d93a9","sheet":"identity-df1f1d2d93a9.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"柳浮云","index":150,"className":"boss-art-identity-973b300564b9","sheet":"identity-973b300564b9.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"杀末邪","index":151,"className":"boss-art-identity-9b4a2a2c2532","sheet":"identity-9b4a2a2c2532.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"月笼草","index":152,"className":"boss-art-identity-15ba7cefbb49","sheet":"identity-15ba7cefbb49.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"蒹葭","index":153,"className":"boss-art-identity-d867be07a7eb","sheet":"identity-d867be07a7eb.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"康成辩","index":154,"className":"boss-art-identity-7abd1b1a54ca","sheet":"identity-7abd1b1a54ca.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"源明信","index":155,"className":"boss-art-identity-b4e349b00013","sheet":"identity-b4e349b00013.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"康杖石","index":156,"className":"boss-art-identity-0d323c70adf7","sheet":"identity-0d323c70adf7.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"宓果","index":157,"className":"boss-art-identity-86037d72d83a","sheet":"identity-86037d72d83a.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"刘细","index":158,"className":"boss-art-identity-81204f915c36","sheet":"identity-81204f915c36.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"郝大雪","index":159,"className":"boss-art-identity-c5d505b8ab76","sheet":"identity-c5d505b8ab76.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"李君竹","index":160,"className":"boss-art-identity-70b7ac92b15d","sheet":"identity-70b7ac92b15d.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"解秀朝","index":161,"className":"boss-art-identity-89572347b4ab","sheet":"identity-89572347b4ab.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"武云阙","index":162,"className":"boss-art-identity-f20de1ef2f43","sheet":"identity-f20de1ef2f43.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"吴添明","index":163,"className":"boss-art-identity-490d5d01d42c","sheet":"identity-490d5d01d42c.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"秘三花","index":164,"className":"boss-art-identity-4269e1620dcb","sheet":"identity-4269e1620dcb.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"藤原广嗣","index":165,"className":"boss-art-identity-9a8f2dc6ecf9","sheet":"identity-9a8f2dc6ecf9.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"辛仕徽","index":166,"className":"boss-art-identity-b57c5fd3b970","sheet":"identity-b57c5fd3b970.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"宣骄","index":167,"className":"boss-art-identity-9cd6cabca88a","sheet":"identity-9cd6cabca88a.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"魏鑫","index":168,"className":"boss-art-identity-898d6fe4e082","sheet":"identity-898d6fe4e082.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"段留影","index":169,"className":"boss-art-identity-9dd5986d34ab","sheet":"identity-9dd5986d34ab.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"段业声","index":170,"className":"boss-art-identity-1d6d2a7b162a","sheet":"identity-1d6d2a7b162a.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"石固勇","index":171,"className":"boss-art-identity-3009e329e9c6","sheet":"identity-3009e329e9c6.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"汪佑","index":172,"className":"boss-art-identity-b191824a661e","sheet":"identity-b191824a661e.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"瓦赫拉","index":173,"className":"boss-art-identity-4256229b1725","sheet":"identity-4256229b1725.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"卢敬恒","index":174,"className":"boss-art-identity-0d933699c75f","sheet":"identity-0d933699c75f.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"阿孜娅","index":175,"className":"boss-art-identity-20fd7af3b1c4","sheet":"identity-20fd7af3b1c4.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"宓萱","index":176,"className":"boss-art-identity-97b219221c84","sheet":"identity-97b219221c84.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"藤原若狭","index":177,"className":"boss-art-identity-6ace098d5b82","sheet":"identity-6ace098d5b82.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"王莽","index":178,"className":"boss-art-identity-03b2f76027d2","sheet":"identity-03b2f76027d2.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"董龙","index":179,"className":"boss-art-identity-9738ccde04f4","sheet":"identity-9738ccde04f4.svg","cell":0,"vector":true,"identityEmblem":true,"schematic":true},{"name":"李复","index":180,"className":"boss-art-identity-af1c68ef3138","asset":"assets/portraits-v2/hidden_lifu.5aa732a65a4a.webp","cell":0,"heroId":"hidden_lifu","reusedPortrait":true}])entries.push(Object.freeze(entry));
const byName=new Map(entries.map(e=>[e.name,e]));
const escape=s=>String(s).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
function get(name){return byName.get(name)||null;}
function sprite(name,extraClass=''){const e=get(name);return e?'<span class="boss-portrait '+e.className+' '+escape(extraClass)+'" role="img" aria-label="'+escape(name)+(e.identityEmblem?'身份徽记':e.schematic?'示意图':'立绘')+'"></span>':'';}
root.JXBossArt=Object.freeze({get,sprite,entries:Object.freeze(entries)});
})(typeof globalThis!=='undefined'?globalThis:window);


;
/* Pixel silhouettes are artistic adaptations; identity comes from dungeon rules. */
(function(root){
  'use strict';
  const types=['神策持枪军士','神策弓手','机关甲士','东瀛武士','红衣教徒','叛军剑卫','江湖匪寇','山林野兽'];
  const entries=Object.freeze(types.map((name,index)=>Object.freeze({name,index,className:'enemy-art-'+index})));
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function get(enemy){return enemy&&Number.isInteger(enemy.enemyArt)?entries[enemy.enemyArt]||null:null;}
  function sprite(enemy){const entry=get(enemy);return entry?'<span class="enemy-portrait '+entry.className+'" role="img" aria-label="'+esc(enemy.name)+'像素示意"></span>':root.JXBossArt?.sprite(enemy?.name)||'';}
  root.JXEnemyRoster=Object.freeze({get,sprite,entries});
})(globalThis);

;
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
    if((state.badges||[]).includes(route.id))return !root.JXProgression||root.JXProgression.isExpansionUnlocked(state,route.expansionId);
    if(root.JXProgression&&!root.JXProgression.isExpansionUnlocked(state,route.expansionId))return false;
    if(!root.JXProgression&&route.progressionRoute)return route.legacyUnlockRouteId?(state.badges||[]).includes(route.legacyUnlockRouteId):mainBadgeCount(state)>=route.legacyNeedBadges;
    if(route.progressionRoute&&!route.unlockRouteId)return true;
    return route.unlockRouteId?(state.badges||[]).includes(route.unlockRouteId):mainBadgeCount(state)>=route.needBadges;
  }
  function routeRequirement(state,routeOrId) {
    const route=routeMap.get(typeof routeOrId==='string'?routeOrId:routeOrId?.id);
    if(!route) return '未知路线';
    if(root.JXProgression&&!root.JXProgression.isExpansionUnlocked(state,route.expansionId))return '通关当前资料片的普通团队秘境后开放';
    return route.unlockRouteId?'通关「'+routeMap.get(route.unlockRouteId).name+'」后开放':'主线信物 '+Math.min(mainBadgeCount(state),route.needBadges)+' / '+route.needBadges;
  }
  const getOwned = (state,uid) => state.heroes.find(h=>h.uid===uid);
  const pick = (arr,rng) => arr[Math.min(arr.length-1,Math.max(0,Math.floor(rng()*arr.length)))];
  const growthStep = h => [1,1.4,3,5.2,8.2][h.level%5];
  const growthChapter = h => Math.max(0,Math.floor((h.level-5)/5));
  const nextLevelXp = h => root.JXCombatRules ? h.isPlayer===false?(35+h.level*18)*2:Math.round((570+h.level%5*72)*(1+growthChapter(h)*1.125)*growthStep(h)) : 35+h.level*18;
  const levelUpCost = h => root.JXCombatRules?Math.round((950+h.level%5*110)*(1+growthChapter(h)*44/34)*growthStep(h)*(h.isPlayer?3:1)):60+h.level*18;
  const itemPrice = (state,id) => {const base=itemMap.get(id)?.price||0;if(!state.characterModel||id!=='exp')return base;const chapter=root.JXProgression?.current(state).index||0;return Math.ceil(1500*(1+chapter*44/34)/(1+chapter*1.125));};
  const getRole = hero => hero?.role || heroMap.get(hero?.id)?.role || 'dps';
  function setRole(state,uid,role) {
    const hero=getOwned(state,uid),data=hero && heroMap.get(hero.id);
    if(!data || !(data.roles||[data.role]).includes(role)) return result(false,'这位侠客不具备该职责心法。');
    if(state.battle) return result(false,'请在战斗结束后切换职责。');
    if(state.characterModel&&uid===state.playerUid&&getRole(hero)!==role)root.JXEquipment?.switchLoadout(state,hero,role);
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
    const level=Math.max(1,hero.level||1),factor=root.JXCombatRules?Math.pow(1.035,level-1):1;
    const bonus=hero.isPlayer===false?{}:root.JXEquipment?.bonuses(hero)||{};
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
      portrait:enemy.portrait,level:enemy.level,hp:enemy.hp,maxHp:enemy.maxHp,enemyArt:enemy.enemyArt,encounterKind:enemy.encounterKind,dungeonId:enemy.dungeonId,...(root.JXCombatRules?{weaknesses:[...(enemy.weaknesses||[])],toughness:enemy.toughness??enemy.maxToughness??(enemy.raid?150:enemy.boss?90:36),maxToughness:enemy.maxToughness|| (enemy.raid?150:enemy.boss?90:36),brokenTurns:enemy.brokenTurns||0}: {})};
  }
  function combatSnapshot(state) {
    const battle=state.battle;
    if(!battle) return null;
    const heroes=root.JXCards&&root.JXCombatRules?root.JXCombatRules.party(state,{live:true}).map(h=>({side:'hero',uid:h.uid,id:h.id,name:h.name,sect:h.sect,portrait:h.portrait,level:h.level,hp:h.hp,maxHp:h.maxHp,skill:h.skill,role:h.role})):state.team.map(uid=>getOwned(state,uid)).filter(Boolean).map(heroActor);
    return {battleId:state.stats.battles,routeId:state.routeId,boss:battle.boss,turn:battle.turn,
      enemy:enemyActor(state),heroes:[...heroes,...(battle.allies||[]).map(h=>({side:'hero',uid:h.uid,id:h.id,name:h.name,sect:h.sect,portrait:h.portrait,level:h.level,hp:h.hp,maxHp:h.maxHp,skill:h.skill,role:h.role,npc:true}))]};
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
    if(hero) {const recipient=state.characterModel&&hero.uid!==state.playerUid?getOwned(state,state.playerUid):hero;recipient.insight+=3+data.rarity;state.renown=Math.min(1e12,state.renown+data.rarity);}
    else {
      hero={uid:'hero_'+id,id,level:root.JXProgression?Math.max(5,levelCap(state)-5):5,xp:0,stars:0,insight:0,skillLevel:0,hp:1,...(state.characterModel?{isPlayer:false}:{})};
      hero.hp=getHeroStats(hero).hp;
      state.heroes.push(hero);
      if(state.team.length<TEAM_SIZE) state.team.push(hero.uid);
    }
    if(!state.dex.includes(id)) state.dex.push(id);
    state.stats.recruited++;
    if(state.characterModel&&state.playerUid)root.JXCards?.receive(state,id,isNew);
    return {hero,isNew};
  }
  function createState(name='无名少侠',starter='chunyang') {
    const sect=D.SECTS.find(s=>s.id===starter)||D.SECTS[0];
    const now=Date.now();
    const state={version:2,dungeonItineraryRevision:1,dungeonHistoryRevision:1,dungeonEnemyRevision:1,name:String(name||'无名少侠').trim().slice(0,16)||'无名少侠',started:true,createdAt:now,lastSaved:now,clock:0,
      silver:root.JXCombatRules?600:3000,jade:80,renown:0,badges:[],inventory:{invite:30,medicine:5,exp:root.JXCombatRules?2:8,tea:3,ore:0,herb:0},
      heroes:[],team:[],presets:[[],[],[],[],[]],dex:[],pets:[],activePet:null,routeId:D.ROUTES[0].id,routeLoop:[],routeProgress:0,clears:{},environmentTime:now,
      running:true,speed:1,autoInvite:true,autoAdvance:true,pauseAfterBattle:false,battle:null,logs:[],
      stats:{battles:0,wins:0,recruited:0,steps:0,silverEarned:0,playSeconds:0,bosses:0,expEarned:0,defeats:0},
      settings:{sound:false,motion:true},systems:{},adventure:{stepTimer:0,restSeconds:0,lastTeaRoute:D.ROUTES[0].id},rngSeed:726193};
    addHero(state,heroMap.get(sect.id+'_1').id);
    if(root.JXCombatRules){state.characterModel='single-protagonist-v1';state.playerUid=state.heroes[0].uid;state.heroes[0].isPlayer=true;
      const starterIds=[...(D.STARTER_COMPANIONS||[])],primaryRole=getRole(state.heroes[0]),replace=starterIds.findIndex(id=>heroMap.get(id)?.role===primaryRole&&primaryRole!=='dps');
      if(replace>=0)starterIds[replace]=sect.id==='chunyang'?'tangmen_1':'chunyang_1';
      for(const id of starterIds){const h=addHero(state,id).hero;h.level=1;h.hp=getHeroStats(h).hp;}
    }
    root.JXEquipment?.init(state);
    root.JXProgression?.init(state);
    root.JXEndgame?.init(state);
    root.JXTrials?.init(state);
    root.JXCards?.init(state);
    root.JXMartial?.init(state);
    state.stats.recruited=0;
    root.JXActivities?.init(state);
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
    if(state.endgame?.active)state.endgame.active=null;
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
      if(state.characterModel&&uid===state.playerUid)return result(false,'主角始终在同行队伍中，不能离队。');
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
  function autoLineup(state,target) {
    if(state.battle)return result(false,'请先战后整队，再一键布阵。');
    if(!root.JXCombatRules)return result(false,'武学规则尚未加载。');
    const route=getRoute(state),chronicle=state.endgame?.active&&root.JXEndgame?.chapter(state,state.endgame.active.expansionId),next=chronicle?.bosses[chronicle.record.index%chronicle.bosses.length],enemy=target||(next?root.JXDungeonRules?.encounter(state,next.dungeonId,next.index):null)||root.JXDungeonRules?.encounter(state,route,state.adventure.dungeonBossIndex||0)||{name:route.boss,id:route.id};
    const plan=root.JXCombatRules.suggestLineup(state,enemy);state.team=plan.team;
    for(const assignment of plan.assignments){const h=getOwned(state,assignment.uid);h.role=assignment.role;h.hp=Math.min(Math.max(1,h.hp),getHeroStats(h).hp);}
    return result(true,'已安排 '+state.team.length+' 位侠客，兼顾承伤、治疗与兵器破招；覆盖弱点 '+plan.covered.join('、')+'。',plan);
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
    const cost=levelUpCost(h);
    if(state.silver<cost) return result(false,'银两不足，研习需 '+cost+' 银两。');
    state.silver-=cost;
    grantXp(state,h,nextLevelXp(h)-h.xp);
    return result(true,heroMap.get(h.id).name+'修为提升至 '+h.level+' 级。');
  }
  function breakthrough(state,uid) {
    return result(false,'星级突破已取消。侠客以等级、武学职责与装备成长，重复结交获得侠名。');
  }
  function trainSkill(state,uid){
    const h=getOwned(state,uid);if(!h)return result(false,'没有找到这位侠客。');if(state.battle)return result(false,'请在战斗结束后研习武学。');
    if(state.characterModel&&uid!==state.playerUid)return result(false,'同伴只提升等级，武学研习仅用于主角。');
    const level=h.skillLevel||0;if(level>=5)return result(false,'武学研习已圆满。');const insight=10+level*8,silver=300*(level+1);
    if(h.insight<insight||state.silver<silver)return result(false,'研习需要 '+insight+' 心得与 '+silver+' 银两。',{required:{insight,silver}});
    h.insight-=insight;state.silver-=silver;h.skillLevel=level+1;return result(true,'武学研习提升至 '+h.skillLevel+' 级，招式效能提高。');
  }
  function buyItem(state,id,qty=1) {
    const item=itemMap.get(id);
    if(!item || !integer(qty,1,999)) return result(false,'请选择有效的物品与购买数量。');
    const cost=itemPrice(state,id)*qty;
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
    if(state.characterModel&&!ids.includes(state.playerUid)){ids.unshift(state.playerUid);ids.length=Math.min(ids.length,TEAM_SIZE);}
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
      const ready=root.JXDungeonRules.readiness(state,route,'normal',{includeSupports:false});
      if(!ready.ready){
        const field=D.ROUTES.find(r=>r.expansionId===route.expansionId&&r.main!==false&&r.kind==='field');
        state.routeId=field.id;state.routeProgress=0;state.adventure.stepTimer=0;state.adventure.restSeconds=4;state.adventure.lastTeaRoute=field.id;
        event(state,events,'preparation','秘境整备不足：'+ready.unmet.join('；')+'。返回'+field.name+'继续历练。');
        return;
      }
      const entry=root.JXDungeonRules.enter(state,route,'normal',{includeSupports:false});if(!entry.ok)return;
    }
    const env=environment(state),hero=heroMap.get(pick(env.encounterIds,rng));
    const enemyGrowth=root.JXCombatRules?Math.pow(1.035,level-1):1,maxHp=Math.floor((100+level*25)*(boss?3:1)*enemyGrowth);
    state.battle={enemy:{id:boss?'boss_'+route.id:hero.id,name:boss?route.boss:hero.name,sect:hero.sect,level,hp:maxHp,maxHp,portrait:hero.portrait,boss,
      atk:Math.floor((10+level*4.4)*(boss?1.6:1)*enemyGrowth),def:Math.floor((3+level*1.25)*enemyGrowth)},phase:'combat',turn:0,boss,elapsed:0,log:[],environment:env};
    if(boss&&route.dungeonId&&root.JXDungeonRules){
      const enemy=root.JXDungeonRules.encounter(state,route,state.adventure.dungeonBossIndex||0,'normal');
      if(enemy)state.battle.enemy={...enemy,sect:enemy.sect||hero.sect,portrait:enemy.portrait??hero.portrait};
    }
    if(!boss&&route.dungeonId&&root.JXDungeonRules){
      const patrol=root.JXDungeonRules.roamingEncounter(state,route,state.stats.steps||0);
      if(!patrol)throw new Error('秘境巡逻名单缺失。');
      state.battle.enemy=patrol;
    }
    if(root.JXCombatRules){state.battle.enemy.weaknesses=root.JXCombatRules.weaknesses(state.battle.enemy,route);state.battle.allies=root.JXCards&&route.dungeonId?root.JXCombatRules.party(state,{raid:!!state.battle.enemy.raid,dungeon:true,includeSupports:false}).filter(h=>h.npc):state.battle.enemy.raid?root.JXCombatRules.party(state,{raid:true}).filter(h=>h.npc):[];}
    state.stats.battles++;
    event(state,events,'battle-start',boss?'首领现身：'+state.battle.enemy.name+'！':route.dungeonId?(state.battle.enemy.encounterKind==='rehearsal'?'首领演练：':'途中遭遇')+state.battle.enemy.name+'。':'途中遇见'+hero.name+'，相邀切磋。',
      {boss,enemy:state.battle.enemy.name,battleId:state.stats.battles,snapshot:combatSnapshot(state)});
    if(boss) event(state,events,'boss','挑战'+state.battle.enemy.name+'。'+(state.battle.enemy.bossCount?'（'+(state.battle.enemy.bossIndex+1)+' / '+state.battle.enemy.bossCount+'）':''));
  }
  function challengeBoss(state) {
    if(state.endgame?.active)return result(false,'请先退出百战异闻录，再挑战地图首领。');
    if(state.battle) return result(false,'当前正在切磋中。');
    if(state.routeProgress<getRoute(state).steps) return result(false,'请先完成这条路线的探索。');
    if(getRoute(state).dungeonId&&root.JXDungeonRules&&!(state.adventure.dungeonBossIndex>0)){
      const ready=root.JXDungeonRules.readiness(state,getRoute(state),'normal',{includeSupports:false});
      if(!ready.ready)return result(false,'秘境整备不足：'+ready.unmet.join('；')+'。地图路线使用本地同行；好友助战请从历代秘境进入。');
    }
    const events=[]; startBattle(state,events,Math.random,true);
    state.adventure.restSeconds=0; return result(true,'首领挑战开始。',{events});
  }
  function rewardWin(state,events,rng) {
    const battle=state.battle,route=getRoute(state),boss=battle.boss;
    const dungeon=boss&&root.JXDungeonRules?D.DUNGEONS.find(d=>d.id===route.dungeonId):null;
    const bossIndex=state.adventure.dungeonBossIndex||0,intermediate=!!dungeon&&bossIndex<dungeon.bosses.length-1;
    const snapshot=combatSnapshot(state);
    const rewardBonus=root.JXEndgame?.rewardBonus(state)||{};
    const silver=Math.floor(route.rewards.silver*(boss?5:1)*(1+petEffect(state,'silver'))*(1+(rewardBonus.silver||0)));
    const exp=Math.floor(route.rewards.exp*(boss?3:1)*(1+petEffect(state,'exp'))*(battle.environment?.expMultiplier||1)*(1+(rewardBonus.exp||0)));
    state.silver+=silver; state.stats.silverEarned+=silver; state.stats.expEarned+=exp; state.stats.wins++; state.renown+=boss?20:2;
    if(root.JXProgression&&route.kind==='field')root.JXProgression.earnSupplies(state,boss?3:1);
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
      if(!route.dungeonId && state.autoInvite && state.inventory.invite>0 && !heroMap.get(battle.enemy.id)?.recruitment && !heroMap.get(battle.enemy.id)?.hidden && (state.heroes.length<TEAM_SIZE || rng()<0.5)) {
        const unowned=(battle.environment?.encounterIds||route.heroes).filter(id=>!state.dex.includes(id)&&!heroMap.get(id)?.recruitment&&!heroMap.get(id)?.hidden);
        const heroId=state.heroes.length<TEAM_SIZE && unowned.length?pick(unowned,rng):battle.enemy.id;
        state.inventory.invite--;
        const joined=addHero(state,heroId,rng),name=heroMap.get(heroId).name;
        event(state,events,'recruit',joined.isNew?'与'+name+'结为江湖同道！':name+'与你论剑，获得同门心得。',{heroId,isNew:joined.isNew});
      }
      if(rng()<0.24) { state.inventory.herb++; event(state,events,'loot','路旁采得甘草 × 1。',{itemId:'herb',qty:1}); }
      if(state.routeProgress%4===0) { healTeam(state); state.adventure.restSeconds=3; event(state,events,'heal','途经茶肆，同行侠客恢复了气血。'); }
    }
    // Settle the full boss chain once, with the same per-boss loot as a direct run.
    const lootRoute=dungeon?{...route,name:dungeon.name,level:10+Math.max(0,D.EXPANSIONS.findIndex(e=>e.id===dungeon.expansionId))*5}:route;
    for(let i=0;i<(dungeon?dungeon.bosses.length:1);i++)for(const message of root.JXEquipment?.onVictory(state,{route:lootRoute,boss,rng,dungeon})||[]) event(state,events,'equipment-loot',message);
    state.battle=null; state.adventure.stepTimer=0;
    for(const message of root.JXEquipment?.processLoot?.(state)||[])event(state,events,'equipment-loot',message);
    if(boss && state.routeLoop?.length) {
      const loop=state.routeLoop.filter(id=>routeUnlocked(state,id));
      const next=loop[(loop.indexOf(route.id)+1)%loop.length];
      if(next && next!==route.id) {
        state.routeId=next; state.routeProgress=0; state.adventure.lastTeaRoute=next; state.adventure.restSeconds=4;
        event(state,events,'route-loop','依照历练计划，下一站前往'+getRoute(state).name+'。',{routeId:next});
      }
    } else if(boss && state.autoAdvance!==false) {
      const itinerary=root.JXProgression?.itinerary(state)||[];
      if(root.JXProgression?.checklist(state).ready&&!state.pauseAfterBattle){const advanced=root.JXProgression.advance(state);if(advanced.ok)event(state,events,'chapter-advance',advanced.message);}
      const next=root.JXProgression?(route.progressionRoute?itinerary.find(r=>!state.badges.includes(r.id)):routeMap.get(route.returnRouteId)):(route.main===false?routeMap.get(route.returnRouteId):mainRoutes[mainRoutes.indexOf(route)+1]);
      if(next && routeUnlocked(state,next)&&next.expansionId===getRoute(state).expansionId) {
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
    if(root.JXCombatRules)return martialCombatTurn(state,events,rng);
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
  function martialCombatTurn(state,events,rng){
    root.JXMartial?.init(state);
    const C=root.JXCombatRules,battle=state.battle;battle.turn++;
    const team=C.party(state,{live:true}),statuses=battle.fighterStatus||{};
    for(const h of team)Object.assign(h,statuses[h.uid]||{});
    team.push(...(battle.allies||[]));
    const report=C.turn(team,battle.enemy,{round:battle.turn,rng,damageMultiplier:battle.environment?.damageMultiplier||1,enemyDamageMultiplier:battle.environment?.enemyDamageMultiplier||1});
    for(const h of team){if(h.npc||h.isSupport)continue;const original=getOwned(state,h.uid);if(!original)continue;original.hp=h.hp;statuses[h.uid]={shield:h.shield,revives:h.revives,damageDone:h.damageDone,healingDone:h.healingDone};}
    battle.fighterStatus=statuses;
    const actor=(a,side)=>({side,uid:side==='enemy'?'enemy_'+state.stats.battles:a.uid,id:a.id,name:a.name,sect:a.sect,portrait:a.portrait||0,level:a.level,hp:a.hp,maxHp:a.maxHp,role:a.role,skill:a.skill,npc:!!a.npc});
    for(const e of report.events){
      if(['attack','enemy-attack','heal'].includes(e.type)){
        const enemyHit=e.type==='enemy-attack',healing=e.type==='heal',attacker=actor(e.actor,enemyHit?'enemy':'hero'),defender=actor(e.target,enemyHit||healing?'hero':'enemy');defender.hp=e.hpBefore;
        const message=e.actor.name+'施展'+e.label+'，'+(healing?'恢复':'造成')+' '+e.amount+' 点'+(healing?'气血':'伤害')+(e.advantage?'（弱点）':'')+'。';
        attacker.skill=e.label;event(state,events,healing?'combat-heal':'attack',message,{battleId:state.stats.battles,turn:battle.turn,uid:enemyHit?e.target.uid:e.actor.uid,attacker,defender,skillName:e.label,skillRank:C.profile(e.actor,battle.turn,battle.enemy).rank,target:enemyHit?'hero':'enemy',damage:e.amount,amount:e.amount,critical:!!e.critical,advantage:!!e.advantage,hpBefore:e.hpBefore,hpAfter:e.hpAfter,maxHp:e.target.maxHp});
        battle.log.unshift(message);
      }else event(state,events,e.type,e.label||'破招成功。',{battleId:state.stats.battles,turn:battle.turn});
    }
    battle.log.length=Math.min(8,battle.log.length);
    if(report.won)rewardWin(state,events,rng);else if(report.lost||battle.turn>=60)defeat(state,events);
  }
  function tick(state,seconds,rng=Math.random,realSeconds=seconds) {
    if(!finite(seconds,0,OFFLINE_CAP) || seconds===0) return [];
    const events=[]; let remaining=seconds;
    state.clock+=seconds; state.stats.playSeconds+=seconds;
    if(!state.running) return events;
    if(state.endgame?.active&&root.JXEndgame){root.JXEndgame.tick(state,realSeconds,rng);root.JXProgression?.tick(state,realSeconds,true);return events;}
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
  function serialize(state) { return JSON.stringify(state,(key,value)=>key==='battleSupports'?undefined:value); }
  function reject(message='存档内容不完整或已损坏，请选择有效的江湖存档。') { throw new Error(message); }
  function validateTree(value,depth=0) {
    if(depth>30) reject('存档层级过深。');
    if(value===null || typeof value==='boolean' || typeof value==='string') return;
    if(typeof value==='number') { if(!Number.isFinite(value)) reject(); return; }
    if(typeof value!=='object') reject();
    for(const key of Object.keys(value)) { if(['__proto__','prototype','constructor'].includes(key)) reject('存档包含无效字段。'); validateTree(value[key],depth+1); }
  }
  function migrateRetiredRoster(s) {
    const retired=new Set(D.RETIRED_HERO_IDS||[]);
    if(!Array.isArray(s.heroes)||!s.heroes.some(h=>retired.has(h?.id))) {
      if(Array.isArray(s.dex)&&s.dex.some(id=>retired.has(id))){if(new Set(s.dex).size!==s.dex.length)reject('图鉴或信物数据无效。');s.dex=[...new Set(s.dex.map(id=>retired.has(id)?id.replace(/_[23]$/,'_1'):id))];}
      if(s.cosmetics?.characters)for(const wardrobe of Object.values(s.cosmetics.characters))if(retired.has(wardrobe?.outfit))wardrobe.outfit=wardrobe.outfit.replace(/_[23]$/,'_1');
      return;
    }
    // Validate the complete old roster and its equipment before merging any rows.
    const ids=new Set(),uids=new Set(),oldIds=new Map();
    for(const h of s.heroes){
      if(!h||(!heroMap.has(h.id)&&!retired.has(h.id))||ids.has(h.id)||typeof h.uid!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(h.uid)||uids.has(h.uid))reject('侠客名册存在未知或重复人物。');
      if(!integer(h.level,1,MAX_LEVEL)||!finite(h.xp)||!integer(h.stars??0,0,5)||!integer(h.insight)||!integer(h.skillLevel??0,0,5)||!finite(h.hp,0,1e9))reject('侠客属性无效。');
      ids.add(h.id);uids.add(h.uid);oldIds.set(h.uid,h.id);
      if(retired.has(h.id))h.id=h.id.replace(/_[23]$/,'_1');
      const meta=heroMap.get(h.id);if(h.role!==undefined&&!(meta.roles||[meta.role]).includes(h.role))reject('侠客职责心法无效。');
      if(h.level<MAX_LEVEL&&h.xp>=nextLevelXp(h))reject('侠客修为数据无效。');
    }
    if(!Array.isArray(s.dex)||new Set(s.dex).size!==s.dex.length||s.dex.some(id=>!heroMap.has(id)&&!retired.has(id)))reject('图鉴或信物数据无效。');
    if([...oldIds.values()].some(id=>!s.dex.includes(id)))reject('图鉴或跟宠数据无效。');
    const validTeam=team=>Array.isArray(team)&&new Set(team).size===team.length&&team.length<=(s.version===1?6:TEAM_SIZE)&&team.every(uid=>uids.has(uid));
    if(!validTeam(s.team)||!s.team.length||!Array.isArray(s.presets)||s.presets.length!==5||!s.presets.every(validTeam))reject('同行阵容无效。');
    root.JXEquipment?.validateSave(s);
    const remap=new Map(),keepers=new Map(),removed=[];
    const primary=s.playerUid||s.heroes[0].uid;
    for(const h of s.heroes){const previous=keepers.get(h.id);if(!previous)keepers.set(h.id,h);else if(h.uid===primary||retired.has(oldIds.get(previous.uid))&&!retired.has(oldIds.get(h.uid))){keepers.set(h.id,h);}}
    const e=s.equipment;
    const refund=(target,h)=>{
      if(h.level>target.level||h.level===target.level&&h.xp>target.xp){target.level=h.level;target.xp=h.xp;}
      target.insight=Math.min(1e9,target.insight+h.insight);
      for(let i=0;i<(h.skillLevel||0);i++){target.insight=Math.min(1e9,target.insight+10+i*8);s.silver=Math.min(1e12,s.silver+300*(i+1));}
      for(let i=0;i<(h.stars||0);i++){target.insight=Math.min(1e9,target.insight+10+i*8);s.silver=Math.min(1e12,s.silver+500+i*500);s.inventory.ore=Math.min(1e9,s.inventory.ore+3+i*3);}
      if(!e)return;
      e.vault??=[];
      for(const loadout of [h,...Object.values(h.loadouts||{})]){
        for(const item of Object.values(loadout.equipment||{}))(e.bag.length<300?e.bag:e.vault).push(item);
        for(const en of Object.values(loadout.enhancements||{})){const paid=en.refine*(en.refine+1)/2;e.stones[1]=Math.min(1e9,(e.stones[1]||0)+paid);s.silver=Math.min(1e12,s.silver+paid*80);for(const stone of en.sockets)e.stones[stone]=Math.min(1e9,(e.stones[stone]||0)+1);}
        if(loadout.colorStone){const key=(loadout.colorStoneLevel||1)===1?loadout.colorStone:loadout.colorStone+':'+loadout.colorStoneLevel;e.colors[key]=Math.min(1e9,(e.colors[key]||0)+1);}
      }
    };
    for(const h of s.heroes){const target=keepers.get(h.id);if(h===target)continue;remap.set(h.uid,target.uid);removed.push(h.uid);refund(target,h);}
    s.heroes=s.heroes.filter(h=>!remap.has(h.uid));
    s.dex=[...new Set(s.dex.map(id=>retired.has(id)?id.replace(/_[23]$/,'_1'):id))];
    const mapTeam=team=>[...new Set(team.map(uid=>remap.get(uid)||uid))];s.team=mapTeam(s.team);s.presets=s.presets.map(mapTeam);
    if(s.systems?.training){const active=new Set();s.systems.training=s.systems.training.map(slot=>{if(!slot)return slot;slot.uid=remap.get(slot.uid)||slot.uid;if(active.has(slot.uid))return null;active.add(slot.uid);return slot;});}
    // Old forge records keep their keys so multiple earned weapons remain linked.
    if(e)for(const key of Object.keys(e.quests)){const owner=key.split(':')[0];if(remap.has(owner)){s.retiredCompanionOwners??={};s.retiredCompanionOwners[owner]={id:retired.has(oldIds.get(owner))?oldIds.get(owner):oldIds.get(remap.get(owner)),uid:remap.get(owner)};}}
    if(s.cosmetics?.characters){for(const uid of removed)delete s.cosmetics.characters[uid];for(const wardrobe of Object.values(s.cosmetics.characters)){if(retired.has(wardrobe?.outfit))wardrobe.outfit=wardrobe.outfit.replace(/_[23]$/,'_1');}}
    // A saved combat snapshot can still contain the retired combatant or enemy.
    s.battle=null;
  }
  function parseSave(raw) {
    if(typeof raw!=='string' || raw.length>2000000) reject('存档文件过大或格式无效。');
    let s; try { s=JSON.parse(raw); } catch { reject('存档不是有效的 JSON 文件。'); }
    const migrateCardsCombat=!!root.JXCards&&!s?.cards;
    validateTree(s);
    root.JXDungeonRules?.migrateItinerarySave?.(s);
    root.JXDungeonRules?.migrateHistorySave?.(s);
    root.JXDungeonRules?.migrateEnemySave?.(s);
    delete s.battleSupports;
    if(!s || ![1,2].includes(s.version)) reject('存档版本不受支持。');
    if(root.JXProgression)root.JXProgression.validateSave(s);
    const legacy=s.version===1;
    if(typeof s.name!=='string' || s.name.length>64 || !s.name.trim()) reject();
    for(const key of ['silver','jade','renown','clock','createdAt','lastSaved']) if(!finite(s[key],0,key.includes('At')||key==='lastSaved'?1e15:1e12)) reject('存档中的资源或时间无效。');
    if(!routeMap.has(s.routeId) || !integer(s.routeProgress,0,10000)) reject('存档中的路线无效。');
    if(!s.inventory || Array.isArray(s.inventory)) reject();
    for(const [key,value] of Object.entries(s.inventory)) if(!itemMap.has(key) || !integer(value,0,1e9)) reject('存档中的背包物品无效。');
    for(const item of D.ITEMS) if(s.inventory[item.id]===undefined) s.inventory[item.id]=0;
    if(!Array.isArray(s.heroes) || s.heroes.length<1 || s.heroes.length>D.HEROES.length+(D.RETIRED_HERO_IDS?.length||0)) reject('侠客名册无效。');
    migrateRetiredRoster(s);
    if(root.JXEquipment?.validateSave) root.JXEquipment.validateSave(s);
    if(root.JXCombatRules)root.JXEquipment?.migrateRoster(s);
    const uids=new Set(),ids=new Set();
    for(const h of s.heroes) {
      if(!h || !heroMap.has(h.id) || typeof h.uid!=='string' || !/^[A-Za-z0-9_-]{1,100}$/.test(h.uid) || uids.has(h.uid) || ids.has(h.id)) reject('侠客名册存在未知或重复人物。');
      if(h.stars===undefined)h.stars=0;
      if(h.skillLevel===undefined)h.skillLevel=0;if(!integer(h.skillLevel,0,5))reject('武学研习等级无效。');
      if(!integer(h.level,1,MAX_LEVEL) || !finite(h.xp) || !integer(h.stars,0,5) || !integer(h.insight) || !finite(h.hp,0,1e9)) reject('侠客属性无效。');
      if(h.stars){for(let i=0;i<h.stars;i++){s.silver=Math.min(1e12,s.silver+500+i*500);s.inventory.ore=Math.min(1e9,s.inventory.ore+3+i*3);(h.isPlayer===false?getOwned(s,s.playerUid):h).insight+=10+i*8;}h.stars=0;}
      h.hp=Math.min(h.hp,getHeroStats(h).hp);
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
      const expectedPatrol=activeDungeon&&!b.boss&&root.JXDungeonRules?.roamingEncounter(s,activeDungeon,e.guardIndex);
      if(activeDungeon&&!b.boss&&(!expectedPatrol||e.id!==expectedPatrol.id||e.name!==expectedPatrol.name))reject('秘境巡逻对手身份无效。');
      if(e.id!=='boss_'+s.routeId && e.id!==expectedBoss?.id && e.id!==expectedPatrol?.id && !heroMap.has(e.id)) reject('对手身份无效。');
      if(expectedPatrol){e.enemyArt=expectedPatrol.enemyArt;e.encounterKind=expectedPatrol.encounterKind;e.identityScope=expectedPatrol.identityScope;e.dungeonId=expectedPatrol.dungeonId;}
      if(expectedBoss&&b.boss&&(e.name!==expectedBoss.name||e.bossIndex!==s.adventure.dungeonBossIndex))reject('首领顺序无效。');
      if(root.JXCombatRules){
        if(b.fighterStatus!==undefined){if(!b.fighterStatus||Array.isArray(b.fighterStatus)||typeof b.fighterStatus!=='object')reject('战斗状态无效。');for(const [uid,status]of Object.entries(b.fighterStatus)){if(!uids.has(uid)||!status||typeof status!=='object'||Array.isArray(status)||Object.entries(status).some(([key,n])=>!['shield','revives','damageDone','healingDone'].includes(key)||!finite(n,0,key==='revives'?1:1e9)))reject('战斗状态无效。');}}
        e.boss=b.boss;
        if(e.toughness!==undefined&&!finite(e.toughness,0,150)||e.maxToughness!==undefined&&!finite(e.maxToughness,1,150)||e.brokenTurns!==undefined&&!integer(e.brokenTurns,0,3))reject('破招状态无效。');
        e.weaknesses=root.JXCombatRules.weaknesses({...e,weaknesses:undefined},expectedBoss?D.DUNGEONS.find(d=>d.id===expectedBoss.dungeonId):getRoute(s));
        if(expectedBoss&&b.boss)e.raid=expectedBoss.raid;else e.raid=false;
        const canonical=root.JXCards&&activeDungeon?root.JXCombatRules.party(s,{raid:!!e.raid,dungeon:true,includeSupports:false}).filter(h=>h.npc):e.raid?root.JXCombatRules.party(s,{raid:true}).filter(h=>h.npc):[];
        if(migrateCardsCombat){const previous=new Map((b.allies||[]).map(h=>[h.uid,h]));b.allies=canonical.map(h=>({...h,...previous.get(h.uid)}));}
        if(b.allies===undefined)b.allies=canonical;
        if(!Array.isArray(b.allies)||b.allies.length!==canonical.length||b.allies.some((a,i)=>!a||a.uid!==canonical[i].uid||!finite(a.hp,0,1e9)))reject('助战义士状态无效。');
        b.allies=b.allies.map((a,i)=>({...canonical[i],hp:Math.min(a.hp,canonical[i].maxHp),shield:finite(a.shield,0,canonical[i].atk)?a.shield:0,damageDone:finite(a.damageDone)?a.damageDone:0,healingDone:finite(a.healingDone)?a.healingDone:0,revives:0}));
      }
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
    root.JXEndgame?.validateSave(s);
    root.JXTrials?.validateSave(s);
    root.JXCosmetics?.validateSave(s);
    root.JXCards?.validateSave(s);
    root.JXMartial?.validateSave(s);
    root.JXActivities?.validateSave(s);
    for(const message of root.JXEquipment?.processLoot?.(s)||[])addLog(s,message,'equipment-loot');
    return s;
  }
  function applyOffline(state,seconds) {
    const requested=Number.isFinite(seconds)?Math.max(0,seconds):0,actual=Math.min(OFFLINE_CAP,requested);
    const stoneTotal=()=>Object.values(state.equipment?.stones||{}).reduce((n,v)=>n+v,0),currency=()=>Object.fromEntries(Object.entries(state.endgame?.records||{}).map(([id,r])=>[id,r.currency||0])),gearTotal=()=>(state.equipment?.bag?.length||0)+(state.equipment?.vault?.length||0)+state.heroes.reduce((n,h)=>n+Object.keys(h.equipment||{}).length+Object.values(h.loadouts||{}).reduce((sum,l)=>sum+Object.keys(l.equipment||{}).length,0),0);
    const before={battles:state.stats.battles,wins:state.stats.wins,recruited:state.stats.recruited,silver:state.silver,exp:state.stats.expEarned||0,gear:gearTotal(),stones:stoneTotal(),currencies:currency(),heroes:new Set(state.dex),losses:state.stats.defeats||0};
    const rng=()=>{state.rngSeed=(Math.imul(state.rngSeed||726193,1664525)+1013904223)>>>0; return state.rngSeed/4294967296;};
    let rest=actual;
    while(rest>0) { const chunk=Math.min(60,rest); tick(state,chunk,rng); rest-=chunk; }
    return {seconds:actual,capped:requested>OFFLINE_CAP,battles:state.stats.battles-before.battles,wins:state.stats.wins-before.wins,
      recruited:state.stats.recruited-before.recruited,silver:state.silver-before.silver,exp:(state.stats.expEarned||0)-before.exp,equipment:gearTotal()-before.gear,stones:stoneTotal()-before.stones,chapterCurrencies:Object.fromEntries(Object.entries(currency()).map(([id,n])=>[id,n-(before.currencies[id]||0)]).filter(([,n])=>n)),newHeroes:state.dex.filter(id=>!before.heroes.has(id)),losses:(state.stats.defeats||0)-before.losses};
  }
  root.JXEngine=Object.freeze({createState,tick,combatSnapshot,getHeroStats,teamPower,setRoute,toggleTeam,levelUp,breakthrough,buyItem,useItem,savePreset,loadPreset,
    addHero,addLog,serialize,parseSave,applyOffline,grantXp,nextLevelXp,levelCap,levelUpCost,itemPrice,trainSkill,getRoute,routeUnlocked,routeRequirement,mainBadgeCount,challengeBoss,restAtTea,prepareFormation,autoLineup,setRouteLoop,environment,SECT_ADVANTAGE,getRole,setRole,TEAM_SIZE});
})(globalThis);

;
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
    // The current season has twenty floors. Old hundred-floor records remain
    // historical records; they cannot complete a different season's trial.
    if (s.trialRulesVersion !== 2) {
      const record = s.records.tower;
      if (record && finite(record.best) > 20) {
        record.historicalBest = Math.max(finite(record.historicalBest), finite(record.best));
        record.best = 0;
        record.last = null;
      }
      if (finite(s.weeklyTower) > 20) s.weeklyTower = 0;
      s.trialRulesVersion = 2;
    }
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
    if (s.week !== c.week) { s.week = c.week; s.weeklyTower = 0; s.weeklyAttempts = {}; }
    // Keep the old activity IDs so existing records survive the product rename.
    if (!s.weeklyAttempts || typeof s.weeklyAttempts !== 'object' || Array.isArray(s.weeklyAttempts)) s.weeklyAttempts = {tower:finite(s.daily.attempts.tower)};
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
  function trainingXp(state,slot){const h=state.heroes.find(h=>h.uid===slot.uid);return state.characterModel&&h?.uid===state.playerUid?Math.round(60*(1+Math.max(0,Math.floor((slot.level-5)/5))*1.125)):180+finite(slot.level)*12;}
  function training(state) {
    const s = init(state);
    const slots = s.training.slice(0, 2).map(slot => {
      if (!slot) return null;
      const hero = state.heroes.find(h => h.uid === slot.uid);
      return { ...slot, name: hero ? metadata(hero.id)?.name || '侠客' : '侠客已离队', remaining: Math.max(0, slot.finish - now(state)), ready: now(state) >= slot.finish, duration: TRAIN_TIME, reward: { exp: trainingXp(state,slot) } };
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
    const reward = { exp: trainingXp(state,slot) };
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
    const pool = data().HEROES.filter(h => !h.hidden && !h.recruitment && h.rarity <= maxRarity && (!h.debutExpansion || (root.JXProgression ? root.JXProgression.isExpansionUnlocked(state,h.debutExpansion) : engine().mainBadgeCount(state)>=data().EXPANSIONS.findIndex(e=>e.id===h.debutExpansion)*2)));
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
    { id: 'daily-tea', title: '花萼迎客', desc: '今日在花萼楼签到 1 次', stat: 'tea', target: 1, reward: { silver: 80, items: { tea: 2 } } }
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
    { id: 'tower-10', title: '试炼初成', desc: '试炼之地最高抵达 10 层', target: 10, read: s => s.systems.records.tower?.best || 0, reward: { jade: 30, items: { ore: 12 } } },
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
    { id: 'dungeon', name: '大战·天地三才阵', subtitle: '天策 · 五人秘境', desc: '依次挑战人熊、邓文峰、商仲永；领取日常资粮。首领取自原作，三次奖励与战斗数值为放置适配。', icon: '剑', badges: 0, power: 180, maxAttempts: 3, period: 'daily', bosses: ['人熊','邓文峰','商仲永'], sourceUrls: ['https://jx3yq.xoyo.com/show-5730-76-1.html'], reward: { silver: 240, exp: 180, items: { invite: 3, ore: 2 } } },
    { id: 'world', name: '野外首领', subtitle: '洛道 · 孟康', desc: '追讨洛道毒尸孟康。每日三次，个人伤害累计；好友异步助战或人机补位。原作首领取材，非实时全服共享血量。', icon: '魁', badges: 1, power: 1100, maxAttempts: 3, period: 'daily', bosses: ['孟康'], sourceUrls: ['https://jx3.xoyo.com/zt/2010/02/26/ywsl.shtml'], reward: { silver: 700, jade: 15, items: { ore: 8 } } },
    { id: 'tower', name: '试炼之地', subtitle: '单人试炼 · 二十层周常', desc: '二十层试炼，保留本周进度，每周三次奖励机会。遇见原作试炼首领；每次最多连战八层为放置适配。', icon: '塔', badges: 1, power: 480, maxAttempts: 3, period: 'weekly', sourceUrls: ['https://jx3tc.xoyobox.com/announce/gg.html?id=351','https://news.17173.com/content/10262026/200141731.shtml'], reward: { silver: 60, exp: 45, items: { ore: 1 } } },
    { id: 'underground', name: '浪客行', subtitle: '竹林路 · 空雾峰 · 有间客栈', desc: '六站短程行旅，战斗、采集、客栈休整；败退保留已得资粮。选用原作浪客行场景，六站短局是本作适配。', icon: '岩', badges: 1, power: 600, maxAttempts: 3, period: 'daily', sourceUrls: ['https://jx3.xoyo.com/launcher/update/latest.html'], reward: { silver: 45, exp: 30, items: { ore: 2 } } },
    { id: 'factory', name: '神农采集', subtitle: '生活技艺 · 草药', desc: '沿途采集甘草、金银花、田七与川贝；收获生活材料，供百工坊制作药品。每日四次为放置适配。', icon: '药', badges: 0, power: 130, maxAttempts: 4, period: 'daily', reward: { silver: 25, exp: 20, items: { ore: 1 } } }
  ];
  function worldMax(state) { return state.systems.daily.worldMax; }
  function challenges(state) {
    const s = init(state);
    return CHALLENGES.map(c => ({ ...clone(c), requirement: c.badges ? `拥有 ${c.badges} 枚江湖信物` : '初入江湖即可参与', unlocked: state.badges.length >= c.badges, attempts: finite(c.period==='weekly'?s.weeklyAttempts[c.id]:s.daily.attempts[c.id]), progress: c.id === 'world' ? finite(s.daily.worldDamage) : c.id === 'tower' ? finite(s.weeklyTower) : finite(s.records[c.id]?.best), target: c.id === 'world' ? worldMax(state) : c.id === 'tower' ? 20 : c.id === 'underground' ? 6 : c.id === 'factory' ? 4 : 3, completed: c.id === 'world' ? !!s.daily.worldClaimed : c.id === 'tower' && finite(s.weeklyTower)>=20, best: finite(s.records[c.id]?.best), historicalBest: finite(s.records[c.id]?.historicalBest), last: s.records[c.id]?.last || null }));
  }
  const strongAgainst = { chunyang: 'tiance', tiance: 'shaolin', shaolin: 'cangjian', cangjian: 'wanhua', wanhua: 'qixiu', qixiu: 'chunyang' };
  function party(state, allies) {
    if(root.JXCombatRules)return root.JXCombatRules.party(state,{raid:allies==='raid',dungeon:true});
    const fighters = state.team.slice(0, 5).map(uid => state.heroes.find(h => h.uid === uid)).filter(Boolean).map(h => {
      const m = metadata(h.id), stats = engine().getHeroStats(h);
      return { name: m.name, sect: m.sect, role: engine().getRole?.(h) || m.role, maxHp: stats.hp, hp: stats.hp, atk: stats.atk, def: stats.def, crit: stats.crit || 0, sourceHero: h, revives: 0, npc: false };
    });
    if (allies && fighters.length) {
      fighters.push({ name: '万花援军（NPC）', sect: 'wanhua', role: 'healer', maxHp: 150, hp: 150, atk: 19, def: 10, npc: true });
      fighters.push({ name: '天策援军（NPC）', sect: 'tiance', role: 'tank', maxHp: 220, hp: 220, atk: 23, def: 15, npc: true });
    }
    return fighters;
  }
  function opponent(level, name, boss, sect) {
    const scale = boss ? 1.4 : 1;
    return { name, sect: sect || 'tiance', hp: Math.round((85 + level * 15) * scale), atk: Math.round((9 + level * 2.4) * scale), def: Math.round(3 + level * 1.25), boss: !!boss };
  }
  function duel(team, enemy, log, rng, limit = 14) {
    if(root.JXCombatRules){
      const original=enemy.hp;let rounds=0;
      while(rounds<limit&&enemy.hp>0&&team.some(h=>h.hp>0)){
        const result=root.JXCombatRules.turn(team,enemy,{round:++rounds,rng});
        for(const e of result.events)log.push(e.actor?`第 ${rounds} 回合 · ${e.actor.name} ${e.label||''} → ${e.target.name}${e.type==='heal'?'恢复':'造成'} ${e.amount}${e.advantage?'（弱点）':''}`:e.label||'破招成功');
      }
      const won=enemy.hp<=0;log.push(won?enemy.name+'已败。':enemy.name+'尚未倒下。');return {won,rounds,damage:Math.max(0,original-enemy.hp)};
    }
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
    if (c.completed) return fail(id==='tower'?'本周二十层试炼已完成，下周一再来。':'今日的江湖大敌已击败，明日再来。');
    if (c.attempts >= c.maxAttempts) return fail(c.period==='weekly'?'本周奖励次数已用完，下周一再来。':'今日次数已用完，明日再来。');
    if (id === 'tower' && state.systems.weeklyTower >= 20) return fail('本周二十层试炼已完成，下周一再来。');
    const team = party(state, id === 'dungeon' || id === 'world');
    if (!team.length) return fail('请先选择至少一位同行侠客。');
    const s = state.systems, log = [`${c.name}开始：${team.map(h => h.name).join('、')}。`];
    if(c.period==='weekly')s.weeklyAttempts[id]=c.attempts+1;
    else s.daily.attempts[id] = c.attempts + 1;
    s.total.challenges++;
    let won = false, rounds = 0, floor = 0, damage = 0, reward = {};
    if (id === 'world') {
      const enemy = opponent(28, '孟康', true, 'tiance');
      enemy.hp = Math.max(1, worldMax(state) - finite(s.daily.worldDamage));
      const fight = duel(team, enemy, log, rng, 12);
      damage = fight.damage; rounds = fight.rounds; won = fight.won;
      s.daily.worldDamage = Math.min(worldMax(state), finite(s.daily.worldDamage) + damage);
      reward = { silver: Math.max(20, Math.floor(damage / 8)), exp: Math.max(15, Math.floor(damage / 10)), items: { ore: Math.max(1, Math.floor(damage / 500)) } };
      if (won && !s.daily.worldClaimed) { s.daily.worldClaimed = true; reward.silver += 700; reward.jade = 15; reward.items.ore += 8; }
      log.push(`本次贡献 ${Math.round(damage)} 伤害；今日累计 ${Math.round(s.daily.worldDamage)} / ${worldMax(state)}。这是个人挑战记录。`);
    } else {
      const count = id === 'dungeon' ? 3 : id === 'factory' ? 4 : id === 'underground' ? 6 : Math.min(8, 20 - finite(s.weeklyTower));
      const start = id === 'tower' ? finite(s.weeklyTower) : 0;
      for (let i = 1; i <= count; i++) {
        const level = id === 'dungeon' ? 3 + i * 2 : id === 'factory' ? 1 + i * 2 : id === 'underground' ? 8 + i * 3 : 8 + (start + i) * 4;
        const boss = id === 'dungeon' ? i === count : id === 'underground' ? i % 3 === 0 : id === 'tower' ? (start + i) % 5 === 0 : i === count;
        const trialBosses=['鱼木和尚','八重妙法村正'];
        const journeyStops=['竹林路','空雾峰','荻花宫前山','草原路','黑戈壁','东水寨'];
        const name = id === 'dungeon' ? c.bosses[i-1] : id === 'factory' ? ['甘草采集点','金银花采集点','田七采集点','川贝采集点'][i-1] : id === 'tower' ? trialBosses[(start+i-1)%trialBosses.length]+' · '+(start+i)+'层' : journeyStops[i-1]+' · 行旅遭遇';
        if(id==='factory'){
          floor++;
          log.push('采集'+['甘草','金银花','田七','川贝'][i-1]+'，收入生活材料。');
          continue;
        }
        const enemy = opponent(level, name, boss, ['tiance', 'cangjian', 'shaolin', 'chunyang'][i % 4]);
        const fight = duel(team, enemy, log, rng);
        rounds += fight.rounds; damage += fight.damage;
        if (!fight.won) break;
        floor++;
        if (id === 'underground' && (i === 2 || i === 5)) {
          for (const h of team.filter(h => h.hp > 0)) h.hp = Math.min(h.maxHp, h.hp + Math.round(h.maxHp * 0.35));
          log.push('进入有间客栈，尚在战阵的侠客恢复 35% 气血。');
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
    s.records[id] = { runs: finite(previous.runs) + 1, wins: finite(previous.wins) + (won ? 1 : 0), best: Math.max(finite(previous.best), id === 'world' ? Math.round(damage) : floor), ...(id==='tower'&&previous.historicalBest?{historicalBest:previous.historicalBest}:{}), last: { won, floor, damage: Math.round(damage), rounds, at: now(state), rewards: clone(reward) } };
    const message = id === 'world' ? `${won ? '孟康已被击败' : '已完成本次攻坚'}，贡献 ${Math.round(damage)} 伤害。` : `${c.name}${won ? '顺利完成' : '暂且收兵'}，${id === 'tower' ? '抵达' : '通过'} ${floor} ${id === 'tower' ? '层' : '关'}。`;
    return finish(state, { ok: true, message, won, rewards: reward, log, rounds, floor, damage, allies: id === 'dungeon' || id === 'world' ? 'NPC 义士' : null });
  }
  function expansionDungeons(state) {
    init(state);const q=root.JXEquipment?.init(state);
    return (data().DUNGEONS||[]).map(d=>({...clone(d),unlocked:d.kind==='dungeon'&&!data().ROUTES.some(r=>r.id===d.routeId)?(root.JXProgression?root.JXProgression.isExpansionUnlocked(state,d.expansionId):engine().mainBadgeCount(state)>=data().EXPANSIONS.findIndex(e=>e.id===d.expansionId)*2):engine().routeUnlocked(state,d.routeId),requirement:d.kind==='dungeon'&&!data().ROUTES.some(r=>r.id===d.routeId)?'开启本资料片后，可在野外整备并挑战五人秘境。':engine().routeRequirement(state,d.routeId),record:q?.dungeons[d.id]||{runs:0,wins:0,best:0},
      readiness:root.JXDungeonRules?{normal:root.JXDungeonRules.readiness(state,d,'normal'),challenge:root.JXDungeonRules.readiness(state,d,'challenge')}:null,
      lootNote:d.materialDrop===false?'完整击败全部首领后结算入门装备、五行石与侠名；不产出玄晶、陨铁。':'完整通关后按首领数结算对应装备、陨铁、玄晶机会及侠名；挑战难度奖励更高。'}));
  }
  function challengeExpansionDungeon(state,id,rng=Math.random,difficulty='normal') {
    if(state.endgame?.active)return fail('请先退出百战异闻录，再进入秘境。');
    if(!['normal','challenge'].includes(difficulty))return fail('秘境难度无效。');
    const d=expansionDungeons(state).find(x=>x.id===id);if(!d)return fail('找不到这座资料片秘境。');if(!d.unlocked)return fail(`尚未开启：${d.requirement}。`);if(state.battle)return fail('请等当前历练战斗结束后挑战。');
    const readiness=root.JXDungeonRules?.readiness(state,d,difficulty);if(readiness&&!readiness.ready)return {...fail('整备不足：'+readiness.unmet.join('；')+'。'),readiness};
    const entry=root.JXDungeonRules?.enter(state,d,difficulty);if(entry&&!entry.ok)return entry;
    const team=party(state,d.kind==='raid'?'raid':false);if(!team.length)return fail('请先安排同行侠客。');
    const modeLabel=difficulty==='challenge'?'挑战':'普通';
    const log=[`${d.name} · ${modeLabel}：${team.map(h=>h.name).join('、')}出战。`],loot=[],bosses=[];let floor=0,rounds=0,damage=0;
    if(team.some(h=>h.npc))log.push('单人协战：人机队友自动补位，承伤吸引攻击、医师治疗队友，战利品归主角。');
    for(let i=0;i<d.bosses.length;i++){
      const enemy=root.JXDungeonRules?.encounter(state,d,i,difficulty)||opponent(d.level+i*1.5,typeof d.bosses[i]==='string'?d.bosses[i]:d.bosses[i].name,true,'');
      if(!root.JXDungeonRules)enemy.hp=Math.round(enemy.hp*(d.materialDrop===false?1.1:2.5));
      if(enemy.mechanic)log.push(`第 ${i+1}/${d.bosses.length} 位首领 · ${enemy.mechanic}`);
      const portrait={name:enemy.name,artId:enemy.artId,bossIndex:i,maxHp:enemy.hp,atk:enemy.atk,def:enemy.def,mechanic:enemy.mechanic||''};
      const fight=duel(team,enemy,log,rng,30);rounds+=fight.rounds;damage+=fight.damage;bosses.push({...portrait,won:fight.won,rounds:fight.rounds});if(!fight.won)break;floor++;
      for(const member of team){if(member.hp>0)member.hp=Math.min(member.maxHp,member.hp+Math.floor(member.maxHp*(state.characterModel?.4:difficulty==='challenge'?.24:.3)));else if(state.characterModel)member.hp=Math.ceil(member.maxHp*.35);}
    }
    const won=floor===d.bosses.length,multiplier=difficulty==='challenge'?1.5:1;
    const reward=won?{silver:Math.round(floor*(60+d.level*3)*multiplier),exp:Math.round(floor*(40+d.level*5)*multiplier),renown:Math.round(floor*(difficulty==='challenge'?45:25))}:{};
    if(won){
      if(difficulty==='normal'&&data().ROUTES.some(r=>r.id===d.routeId)){
        state.clears[d.routeId]=(state.clears[d.routeId]||0)+1;
        if(!state.badges.includes(d.routeId)){
          state.badges.push(d.routeId);reward.jade=20;reward.items={invite:5};
          log.push('首次通关「'+d.name+'」，获得通行信物、20侠玉与5张结交帖。');
        }
      }
      for(let i=0;i<floor;i++)if(root.JXEquipment){const rewards=root.JXEquipment.onVictory(state,{route:{name:d.name,level:10+Math.max(0,data().EXPANSIONS.findIndex(e=>e.id===d.expansionId))*5,expansionId:d.expansionId},boss:true,rng,dungeon:d});loot.push(...rewards);log.push(...rewards);}
      grant(state,reward);
    }else{if(entry?.spent)root.JXProgression.earnSupplies(state,Math.floor(entry.spent/2));log.push('本次未完整通关，不结算秘境战利品；返还一半副本补给，整备后可重新挑战。');}
    state.systems.total.challenges++;if(won)state.systems.total.challengeWins++;
    if(root.JXDungeonRules)root.JXDungeonRules.record(state,d,difficulty,{won,floor,rounds,damage,bosses});
    else{const q=root.JXEquipment.init(state),old=q.dungeons[id]||{runs:0,wins:0,best:0};q.dungeons[id]={runs:old.runs+1,wins:old.wins+(won?1:0),best:Math.max(old.best,floor)};}
    if(won&&difficulty==='normal'&&state.autoAdvance!==false&&!state.routeLoop?.length&&root.JXProgression?.checklist(state).ready){const advanced=root.JXProgression.advance(state);if(advanced.ok)log.push(advanced.message);}
    return finish(state,{ok:true,won,difficulty,readiness,bosses,team:team.map(h=>({uid:h.uid,id:h.id,artId:h.artId||h.id,sect:h.sect,portrait:h.portrait,name:h.name,role:h.role,npc:!!h.npc,isSupport:!!h.isSupport,ownerName:h.ownerName,hp:h.hp,maxHp:h.maxHp,damage:h.damageDone||0,healing:h.healingDone||0})),message:`${d.name} · ${modeLabel}${won?'已通关':'暂退'}，击败 ${floor}/${d.bosses.length} 位首领。`,floor,rounds,damage,rewards:reward,loot,log});
  }
  function encounter(state,enemy,rng=Math.random,{raid=false,limit=30}={}){
    const team=party(state,raid?'raid':false),target=clone(enemy),log=[];
    if(!team.length)return {won:false,rounds:0,damage:0,log:['请先安排同行侠客。'],team:[]};
    const result=duel(team,target,log,rng,Math.max(1,Math.min(100,limit)));
    return {...result,log,team:team.map(h=>({uid:h.uid,name:h.name,role:h.role,npc:!!h.npc,isSupport:!!h.isSupport,ownerName:h.ownerName,hp:h.hp,maxHp:h.maxHp,damage:h.damageDone||0,healing:h.healingDone||0})),enemy:target};
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
        { id: 'consult', label: '煮茶问道', desc: '奉上 1 盏清心茶；抉择后领取 1 次传功，整理华山行路经验。', cost: { tea: 1 }, requirements: [{ stat: 'training', label: '抉择后领取传功', target: 1 }], reward: { exp: 180, hero: 'chunyang_1' }, text: '松风过窗，你将旅人的口信铺在桌上，与同门辨认山路。', ending: '纯阳同门赞你行事周详，愿将山中所学传给更多行路人。' }
      ]
    },
    {
      id: 'valley-healer', name: '医者仁心', region: '万花 · 秦岭青岩', badges: 4, icon: '花',
      desc: '秦岭青岩的万花谷传来求援：一支商旅受了风寒，临时药棚正缺少照应人手。',
      dialogue: ['药棚里的年轻医者拱手相迎：“治病救人，半在药石，半在照料。愿少侠助我们一臂之力。”', '桌上列着两张单子：一张是眼下急需的成药，另一张是山间尚待采集的药材。'],
      choices: [
        { id: 'aid', label: '施药护行', desc: '捐出 2 份止血散；抉择后赢得 2 场历练战斗，为药棚守住行路安全。', cost: { medicine: 2 }, requirements: [{ stat: 'wins', label: '抉择后护行获胜', target: 2 }], reward: { silver: 280, exp: 180, hero: 'wanhua_1' }, text: '你将成药交给医者，又与同伴约定轮流巡视药棚周围。', ending: '万花医者收好药箱，向你郑重一礼：“愿与你同行，让这份善意走得更远。”' },
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
    if (s.trialRulesVersion !== undefined && s.trialRulesVersion !== 2 || s.trialRulesVersion === 2 && finite(s.weeklyTower)>20) reject('当前赛季试炼层数');
    if (s.trialRulesVersion !== undefined && (s.trialRulesVersion !== 2 || finite(s.weeklyTower)>20)) reject('现行试炼规则');
    if (s.weeklyAttempts !== undefined && (!object(s.weeklyAttempts) || Object.keys(s.weeklyAttempts).some(key => key !== 'tower') || !fields(s.weeklyAttempts,['tower']) || finite(s.weeklyAttempts.tower)>3)) reject('试炼周常次数');
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
        if (!CHALLENGES.some(c => c.id === id) || !object(record) || !fields(record, ['runs', 'wins', 'best','historicalBest'])) reject('挑战纪录');
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
  root.JXSystems = { init, tick, syncCalendar, training, startTraining, claimTraining, startInvitation, claimInvitation, quests, claimQuest, achievements, claimAchievement, challenges, challenge, expansionDungeons, challengeExpansionDungeon, encounter, forgeTrial, recipes, craft, teaInfo, playTea, records, scenarios, chooseScenario, validateSave };
})(globalThis);

;
(function(root){
  'use strict';
  const D=root.JXData,INTERVAL=60,HERO_PITY=80,PENDANT_PITY=120;
  const heroPools=D.EXPANSIONS.map(e=>D.HEROES.filter(h=>h.placement?.expansionId===e.id).sort((a,b)=>Number(!!b.hidden)-Number(!!a.hidden)).map(h=>h.id));
  function eligible(s,id){const p=D.HEROES.find(h=>h.id===id)?.placement;return !p?.dungeonId||(s.equipment?.dungeons?.[p.dungeonId]?.wins||0)>0;}
  function collectableHeroes(s,index){const player=s.heroes.find(h=>h.uid===s.playerUid)||s.heroes[0],sect=D.HEROES.find(h=>h.id===player.id)?.sect;return heroPools[index].filter(id=>{const h=D.HEROES.find(h=>h.id===id);return h&&h.recruitment?.type!=='memory'&&(h.recruitment?.type!=='sect-trial'||h.sect!==sect);});}
  const pendantNames=['稻香故梦','剑茗留影','雪凤冰王笛·拓影','明尊月轮','战魂军令','玄甲寒锋','明月优昙','暗香疏影','山海间','夜话白鹭','血影天宇舞姬·拓影','禅心莲华','药王清露','横刀沧浪','万灵归羽','丝路行囊','山海旧约','天骸'];
  const sourced={2:'https://jx3.xoyo.com/zt/2011/05/28/25yx-dihua.shtml',6:'https://jx3.xoyo.com/zt/2016/08/22/jx3Topic08/index2.html',7:'https://jx3.xoyo.com/zt/2016/08/22/jx3Topic08/index2.html',8:'https://jx3.xoyo.com/mobile/gg.html?id=1320662',9:'https://jx3.xoyo.com/zt/2018/09/26/jx3active/index.html',10:'https://jx3.xoyo.com/zt/2019/11/26/ziliaopian/index.html',17:'https://jx3.xoyo.com/launcher/update/latest.html'};
  const fail=message=>({ok:false,message}),ok=message=>({ok:true,message});
  const safeRoll=rng=>Math.max(0,Math.min(.999999999,Number(rng())||0));
  function init(s){
    if(!s.endgame)s.endgame={version:1,active:null,records:{},pendants:[],equipped:null,log:[],last:null};
    for(const e of D.EXPANSIONS)if(!Object.hasOwn(s.endgame.records,e.id))s.endgame.records[e.id]={currency:0,runs:0,wins:0,index:0,heroPity:0,pendantPity:0,claimedHeroes:[]};
    s.endgame.collectibles??=[];s.endgame.wearing??={pet:null,pendant:null,hair:null};
    s.endgame.checkin??={lastDay:-1,total:0,streak:0,lastReward:''};
    return s.endgame;
  }
  function pool(id){const out=[];for(const d of D.DUNGEONS.filter(d=>d.expansionId===id&&!d.adapted)){d.bosses.forEach((b,index)=>{const name=typeof b==='string'?b:b.name;if(!out.some(x=>x.name===name))out.push({name,dungeonId:d.id,index});});}return out;}
  function chapter(s,id){const index=D.EXPANSIONS.findIndex(x=>x.id===id);if(index<0)return null;const e=D.EXPANSIONS[index],g=init(s),record=g.records[id],five=D.DUNGEONS.find(d=>d.id==='five_'+id);return {id,index,name:e.name,currencyName:'通宝·'+e.name,record,unlocked:root.JXProgression.isExpansionUnlocked(s,id),ready:root.JXProgression.isExpansionUnlocked(s,id)&&(s.equipment?.dungeons?.[five?.id]?.wins||0)>0,bosses:pool(id),heroes:collectableHeroes(s,index),pendant:{id,name:pendantNames[index],sourceUrl:sourced[index]||null,adapted:!sourced[index],effect:index%2?'历练修为 +5%':'历练银两 +8%'}};}
  const info=s=>D.EXPANSIONS.map(e=>chapter(s,e.id));
  function start(s,id){const c=chapter(s,id);if(!c?.ready)return fail('先完成对应资料片的五人试炼，才能开启百战回忆。');if(s.battle)return fail('请先战后整队，再进入百战异闻录。');if(s.team.length<5)return fail('百战需要五名同行侠客。');init(s).active={expansionId:id,elapsed:0};s.running=true;return ok('已开始循环历练「'+c.name+'」，每分钟挑战一位回忆首领。');}
  function stop(s){init(s).active=null;return ok('已离开百战异闻录，返回当前野外路线。');}
  function offers(s,id){const c=chapter(s,id);if(!c)return [];const level=Math.min(6,3+Math.floor(c.index/4));return [
    {id:'stone',name:level+'级五行石 ×3',cost:120,description:'用于精炼与镶嵌，当前章通宝兑换。'},
    {id:'color',name:Math.min(6,2+Math.floor(c.index/4))+'级五彩石',cost:240,description:'根据领取侠客职责获得攻击、守御或治疗五彩石。'},
    {id:'equipment',name:c.name+'·百战特效武器',cost:360,description:'本章团本层级紫武，匹配领取侠客门派；首次击败40位首领也可获得。'},
    {id:'hero',name:'隐侠结缘帖',cost:640,description:'定向结交本章尚未领取的名侠；每80次胜利也保底结交一位。',owned:c.heroes.every(id=>c.record.claimedHeroes.includes(id)),locked:!c.heroes.some(id=>!c.record.claimedHeroes.includes(id)&&eligible(s,id))},
    {id:'pendant',name:c.pendant.name,cost:960,description:c.pendant.effect+'，同时只能佩戴一件。每120次胜利保底。',owned:init(s).pendants.includes(id)},...redDustOffers(s,c),...luxuryOffers(s,id)].filter(o=>o.id!=='hero'||c.heroes.length); }
  function redDustOffers(s,c){return c.heroes.map(id=>D.HEROES.find(h=>h.id===id)).filter(h=>h.redDust).map(h=>({id:'red-dust:'+h.id,name:h.name+'·定向结缘',cost:640,description:(h.crossover?'联动纪念侠影。':'红尘侠影同道。')+'直接结交指定侠客；本章百战随机结缘与80胜保底也可获得。只培养等级，固有武学随品质生效。',owned:s.dex.includes(h.id),locked:!c.ready||!eligible(s,h.id),reason:!c.ready?'先完成本章五人试炼':!eligible(s,h.id)?'先完成对应人物线索秘境':''}));}
  function grantHero(s,c){const id=c.heroes.find(id=>!c.record.claimedHeroes.includes(id)&&eligible(s,id));if(!id)return null;root.JXEngine.addHero(s,id);c.record.claimedHeroes.push(id);return D.HEROES.find(h=>h.id===id).name;}
  function equipment(s,c,uid){const h=s.heroes.find(h=>h.uid===s.playerUid)||s.heroes.find(h=>h.uid===uid)||s.heroes.find(h=>s.team.includes(h.uid)),m=D.HEROES.find(x=>x.id===h?.id);if(!m)return null;return root.JXEquipment.createItem(s,{slot:'weapon',level:10+c.index*5,rarity:'epic',tier:'raid',sect:m.sect,expansionId:c.id,effect:root.JXEngine.getRole(h)==='healer'?'heal':'water',name:c.name+'·百战'+(m.weapon||'武器'),source:'百战异闻录'});}
  function exchange(s,id,rewardId,uid){const c=chapter(s,id);if(!c?.unlocked)return fail('资料片尚未开放。');if(s.battle)return fail('请先战后整队。');const offer=offers(s,id).find(x=>x.id===rewardId);if(offer?.locked)return fail(offer.reason||'先完成对应名侠线索中的普通秘境，再领取结缘奖励。');if(!offer||offer.owned)return fail('奖励不存在或已收藏。');if(c.record.currency<offer.cost)return fail(c.currencyName+'不足。');const h=s.heroes.find(h=>h.uid===uid);if(['color','equipment'].includes(rewardId)&&(!h||s.characterModel&&uid!==s.playerUid))return fail('请选择领取侠客。');const q=root.JXEquipment.init(s);if(rewardId==='equipment'&&q.bag.length>=300)return fail('装备行囊已满，请先整理。');
    if(rewardId.startsWith('lux:'))grantCollectible(s,rewardId.slice(4));
    if(rewardId.startsWith('red-dust:')){const heroId=rewardId.slice(9);root.JXEngine.addHero(s,heroId);if(!c.record.claimedHeroes.includes(heroId))c.record.claimedHeroes.push(heroId);}
    if(rewardId==='stone'){const n=Math.min(6,3+Math.floor(c.index/4));q.stones[n]=(q.stones[n]||0)+3;}
    if(rewardId==='color'){const n=Math.min(6,2+Math.floor(c.index/4)),type={tank:'guard',healer:'heal',dps:'attack'}[root.JXEngine.getRole(h)],key=type+':'+n;q.colors[key]=(q.colors[key]||0)+1;}
    if(rewardId==='equipment')equipment(s,c,uid);
    if(rewardId==='hero')grantHero(s,c);
    if(rewardId==='pendant'){s.endgame.pendants.push(id);if(!s.endgame.equipped)s.endgame.equipped=id;}
    c.record.currency-=offer.cost;return ok('已兑换 '+offer.name+'。');
  }
  function equip(s,id){const g=init(s);if(!g.pendants.includes(id))return fail('尚未收藏这件挂件。');g.equipped=id;return ok('已佩戴 '+chapter(s,id).pendant.name+'。');}
  function rewardBonus(s){const g=init(s),n=D.EXPANSIONS.findIndex(e=>e.id===g.equipped);return n<0?{silver:0,exp:0}:n%2?{silver:0,exp:.05}:{silver:.08,exp:0};}
  function tick(s,seconds,rng=Math.random){const g=init(s);if(!g.active||!s.running||!Number.isFinite(seconds)||seconds<=0)return;const c=chapter(s,g.active.expansionId);if(!c?.ready){g.active=null;return;}g.active.elapsed+=Math.min(seconds,28800);
    while(g.active&&g.active.elapsed>=INTERVAL){g.active.elapsed-=INTERVAL;const r=c.record,b=c.bosses[r.index%c.bosses.length],enemy=root.JXDungeonRules.encounter(s,b.dungeonId,b.index,'normal');enemy.hp=Math.round(enemy.hp*.65);enemy.maxHp=enemy.hp;enemy.atk=Math.round(enemy.atk*.8);const battle=root.JXSystems.encounter(s,enemy,rng,{raid:true,limit:35});r.runs++;s.stats.battles++;let message=b.name+'：'+(battle.won?'回忆告捷':'暂且退守，继续整备');
      if(battle.won){r.wins++;r.index=(r.index+1)%c.bosses.length;r.currency+=8;r.heroPity++;r.pendantPity++;s.stats.wins++;const bonus=rewardBonus(s),silver=Math.floor((120+c.index*35)*(1+bonus.silver)),xp=Math.floor((60+c.index*12)*(1+bonus.exp));s.silver+=silver;s.stats.silverEarned+=silver;for(const uid of s.team){const h=s.heroes.find(h=>h.uid===uid);root.JXEngine.grantXp(s,h,xp);}s.stats.expEarned+=xp*s.team.length;const q=root.JXEquipment.init(s);q.stones[1]=(q.stones[1]||0)+3;message+='，'+c.currencyName+' +8';
        if(r.heroPity>=HERO_PITY||safeRoll(rng)<.006){const name=grantHero(s,c);if(name){r.heroPity=0;message+='；隐侠 '+name+' 应约同行';}}
        if(!g.pendants.includes(c.id)&&(r.pendantPity>=PENDANT_PITY||safeRoll(rng)<.003)){g.pendants.push(c.id);r.pendantPity=0;if(!g.equipped)g.equipped=c.id;message+='；收藏 '+c.pendant.name;}
        if(r.wins%40===0){const gear=equipment(s,c);message+='；'+(gear?gear.name:'背包已满，装备折为五行石');}
        if(safeRoll(rng)<.1){const level=Math.min(6,2+Math.floor(c.index/4));q.stones[level]=(q.stones[level]||0)+1;}
        const hidden=hiddenDrop(s,c.id,rng);if(hidden.length)message+='；'+hidden.join('；');
        if(graduated(s,c.id)&&r.wins%100===0){r.currency+=80;message+='；旧章百胜额外通宝 +80';}
      }else{s.stats.defeats++;s.inventory.ore=Math.min(1e9,(s.inventory.ore||0)+1);message+='，带回精铁 +1';}
      g.last={name:b.name,won:battle.won,rounds:battle.rounds,log:(battle.log||[]).slice(-24)};g.log.unshift(message);g.log.length=Math.min(20,g.log.length);root.JXEngine.addLog(s,message,'endgame');
    }
  }
  function validateSave(s){if(!s.endgame){init(s);return true;}const g=s.endgame,valid=D.EXPANSIONS.map(x=>x.id),int=(v,max=1e12)=>Number.isInteger(v)&&v>=0&&v<=max,object=v=>v&&typeof v==='object'&&!Array.isArray(v);if(!object(g)||g.version!==1||!object(g.records)||Object.keys(g.records).some(k=>!valid.includes(k))||!Array.isArray(g.pendants)||new Set(g.pendants).size!==g.pendants.length||g.pendants.some(id=>!valid.includes(id))||(g.equipped!==null&&!g.pendants.includes(g.equipped)))throw new Error('百战收藏数据无效。');
    for(const [id,r]of Object.entries(g.records)){const c=chapter(s,id);if(!object(r)||['currency','runs','wins','index','heroPity','pendantPity'].some(k=>!int(r[k]))||r.wins>r.runs||r.index>=c.bosses.length||!Array.isArray(r.claimedHeroes)||new Set(r.claimedHeroes).size!==r.claimedHeroes.length||r.claimedHeroes.some(h=>!c.heroes.includes(h)||!s.dex.includes(h)))throw new Error('百战资料片记录无效。');}
    if(g.active&&(!object(g.active)||!valid.includes(g.active.expansionId)||!Number.isFinite(g.active.elapsed)||g.active.elapsed<0||g.active.elapsed>=INTERVAL||!chapter(s,g.active.expansionId).ready))throw new Error('百战挂机记录无效。');if(!Array.isArray(g.log)||g.log.length>20||g.log.some(l=>typeof l!=='string'||l.length>500))throw new Error('百战日志无效。');
    if(g.last!==null&&(!object(g.last)||typeof g.last.name!=='string'||g.last.name.length>100||typeof g.last.won!=='boolean'||!int(g.last.rounds,100)||!Array.isArray(g.last.log)||g.last.log.length>24||g.last.log.some(l=>typeof l!=='string'||l.length>1000)))throw new Error('百战战报无效。');init(s);validateCollection(s);return true;
  }
  const petNames=['稻田狸','山庄雏鹤','蜀山团团','洱海墨猫','战地小犬','雪原小貂','千岛白鹭','河洛金貂','风雷小鹰','海岛玉兔','霜林狐','禅院灵猿','林海药鹿','楚水水獭','山庄小虎','瀚漠耳廓狐','弓月雪豹','炽虎·忆影'];
  function graduated(s,id){return !!s.progression?.completed?.some(e=>e.id===id);}
  function catalog(){return D.EXPANSIONS.flatMap((e,i)=>[
    {id:'pet:'+e.id,expansionId:e.id,type:'pet',name:petNames[i],rarity:'稀有',rate:.001,cost:120000,shape:['cat','bird','rabbit','cat','cat','cat','bird','cat','bird','rabbit','fox','cat','deer','cat','cat','fox','cat','cat'][i],description:i===17?'以洛阳之战宠物「炽虎」为原型的纪念跟宠。':'以'+e.fields.join('、')+'的风土创作的纪念跟宠。',sourceUrl:i===17?'https://jx3.xoyo.com/launcher/update/latest.html':null},
    {id:'relic:'+e.id,expansionId:e.id,type:'pendant',name:pendantNames[i]+'·流光',rarity:'超稀有',rate:.0002,cost:240000,shape:'pendant',description:'本章纪念挂件的流光收藏款。',sourceUrl:sourced[i]||null}
  ]).concat([{id:'hair:chiying',expansionId:'cangxue',type:'hair',name:'红发·赤影（五红）·拓影',rarity:'传世孤品',rate:.000001,cost:8000000,shape:'hair',description:'五周年红发的收藏拓影；十八章毕业、各章百战至少1000胜、苍雪龙城至少20000胜后才可获得资格。每次合资格胜利0.0001%，无保底；奢品兑换同样须满足资格。',sourceUrl:'https://www.sohu.com/a/156425399_641873'}]);}
  function collectionEligibility(s,item){if(!graduated(s,item.expansionId))return '先完成「'+D.EXPANSIONS.find(e=>e.id===item.expansionId).name+'」资料片毕业';if(item.type==='hair'){
    const g=init(s);if(s.progression.completed.length<18)return '十八章全部毕业后开放';
    if(D.EXPANSIONS.some(e=>g.records[e.id].wins<1000))return '十八章百战各至少1000胜';
    if(g.records.cangxue.wins<20000)return '苍雪龙城百战至少20000胜';
  }return '';}
  function luxuryOffers(s,id){return catalog().filter(x=>x.expansionId===id&&!x.event).map(x=>({id:'lux:'+x.id,name:x.name,cost:x.cost,description:x.description+' 纯收藏外观；'+(x.type==='hair'?'没有签到、碎片或短期保底捷径。':'毕业后百战胜利 '+(x.rate*100).toFixed(2)+'% 隐藏掉落，或高额通宝兑换。'),owned:init(s).collectibles.includes(x.id),locked:!!collectionEligibility(s,x),reason:collectionEligibility(s,x),luxury:true}));}
  function grantCollectible(s,id){const g=init(s),item=catalog().find(x=>x.id===id);if(!item)return false;if(!g.collectibles.includes(id))g.collectibles.push(id);return true;}
  function hiddenDrop(s,id,rng=Math.random){const messages=[];for(const item of catalog().filter(x=>x.expansionId===id&&!x.event&&!collectionEligibility(s,x))){if(safeRoll(rng)<item.rate){const g=init(s);if(g.collectibles.includes(item.id)){g.records[id].currency+=40;messages.push(item.name+'重复收藏，转化本章通宝 +40');}else{grantCollectible(s,item.id);messages.push('隐藏珍藏「'+item.name+'」入册');}}}return messages;}
  function collection(s,id){const g=init(s);return catalog().filter(x=>!id||x.expansionId===id).map(x=>({...x,owned:g.collectibles.includes(x.id),wearing:g.wearing[x.type]===x.id,reason:collectionEligibility(s,x)}));}
  function wear(s,id){const g=init(s),item=catalog().find(x=>x.id===id);if(!item||!g.collectibles.includes(id))return fail('尚未收藏这件珍藏。');g.wearing[item.type]=g.wearing[item.type]===id?null:id;return ok((g.wearing[item.type]?'已展示':'已收起')+'「'+item.name+'」。');}
  function checkInInfo(s){root.JXSystems.init(s);const g=init(s),day=s.systems.day,c=g.checkin;return {claimed:c.lastDay>=day,total:c.total,streak:c.lastDay===day||c.lastDay===day-1?c.streak:0,nextDay:(c.total%7)+1,lastReward:c.lastReward,expansion:root.JXProgression.current(s).expansion,gearChance:.2,relicChance:.02};}
  function checkIn(s,rng=Math.random){const info=checkInInfo(s);if(info.claimed)return fail('今日已经签到，北京时间明日零点再会。');const q=root.JXEquipment.init(s);if(q.bag.length>=300)return fail('装备行囊已满，请先腾出一格再签到；今天的奖励仍保留。');const c=init(s).checkin,index=root.JXProgression.current(s).index,h=s.heroes.find(x=>x.uid===s.playerUid)||s.heroes[0],m=D.HEROES.find(x=>x.id===h.id),reward={silver:500+index*150,renown:20+index*5,items:{exp:2,invite:1}},log=[];
    c.streak=c.lastDay===s.systems.day-1?c.streak+1:1;c.lastDay=s.systems.day;c.total++;
    s.silver+=reward.silver;s.stats.silverEarned+=reward.silver;s.renown+=reward.renown;for(const [id,n]of Object.entries(reward.items))s.inventory[id]=(s.inventory[id]||0)+n;
    q.stones[1]=(q.stones[1]||0)+15;root.JXProgression.earnSupplies(s,20);log.push('银两 +'+reward.silver+'，侠名 +'+reward.renown+'，修为丹 ×2，结交帖 ×1，一级五行石 ×15，副本补给 +20。');
    const n=safeRoll(rng),milestone=c.total%7===0;if(milestone||n<.2){const slot=root.JXEquipment.SLOTS[(c.total-1)%root.JXEquipment.SLOTS.length].id,armor=['head','chest','waist','wrist','legs','feet'].includes(slot),item=root.JXEquipment.createItem(s,{slot,rarity:'epic',level:10+index*5,expansionId:info.expansion.id,sect:m.sect,schoolSect:armor?m.sect:null,set:armor?info.expansion.setName:null,tier:milestone?'raid':'dungeon',source:'花萼楼签到',name:info.expansion.setName+'·花萼'+root.JXEquipment.SLOTS.find(x=>x.id===slot).name});if(item)log.push((milestone?'累计七签保底：':'今日惊喜：')+item.name+'（'+(milestone?'团队':'五人')+'层级紫装）。');}
    if(n>=.2&&n<.22||c.total%30===0){const duplicate=init(s).collectibles.includes('event:danxin');grantCollectible(s,'event:danxin');log.push('获得纪念挂件「丹心引路·忆影」（重复收藏转为100侠名）。');if(duplicate)s.renown+=100;}
    s.systems.total.tea++;s.systems.total.teaWins++;c.lastReward=log.join(' ');root.JXEngine.addLog(s,'花萼楼签到：'+c.lastReward,'reward');return {ok:true,message:'今日签到完成 · 累计 '+c.total+' 天。',rewards:reward,log};
  }
  const baseCatalog=catalog;
  catalog=function(){return baseCatalog().concat([{id:'event:danxin',expansionId:'fengqi',type:'pendant',name:'丹心引路·忆影',rarity:'活动珍藏',rate:0,cost:0,shape:'lantern',description:'取材自花萼楼「丹心引路」签到背挂；本作每日2%或累计30签获得。',sourceUrl:'https://games.sina.cn/gn/ol/2022-04-26/detail-imcwipii6561919.d.html',event:true}]);};
  function validateCollection(s){const g=init(s),ids=catalog().map(x=>x.id),obj=v=>v&&typeof v==='object'&&!Array.isArray(v),int=v=>Number.isInteger(v)&&v>=0&&v<=1e9;
    if(!Array.isArray(g.collectibles)||new Set(g.collectibles).size!==g.collectibles.length||g.collectibles.some(x=>!ids.includes(x))||!obj(g.wearing)||Object.entries(g.wearing).some(([type,id])=>!['pet','pendant','hair'].includes(type)||id!==null&&(!g.collectibles.includes(id)||catalog().find(x=>x.id===id)?.type!==type)))throw new Error('珍藏陈列数据无效。');
    const c=g.checkin;if(!obj(c)||!Number.isInteger(c.lastDay)||c.lastDay< -1||c.lastDay>1e6||!int(c.total)||!int(c.streak)||c.streak>c.total||typeof c.lastReward!=='string'||c.lastReward.length>1000||c.total===0&&c.lastDay!==-1)throw new Error('花萼楼签到数据无效。');
  }
  root.JXEndgame={INTERVAL,HERO_PITY,PENDANT_PITY,init,info,pool,chapter,offers,start,stop,tick,exchange,equip,rewardBonus,eligible,validateSave,catalog,collection,graduated,collectionEligibility,luxuryOffers,hiddenDrop,wear,checkInInfo,checkIn};
})(globalThis);

;
(function(root){
  'use strict';
  const D=root.JXData;
  const OFFICIAL='https://jx3.xoyo.com/zt/2016/08/22/jx3Topic08/index2.html';
  const STYLES=[
    {id:'wolf-bow',name:'赤血天狼',slot:'背部',index:0,sourceImage:'images/gifts/g5.jpg'},
    {id:'lotus-chimes',name:'素馨菡萏',slot:'背部',index:1,sourceImage:'images/gifts/g5.jpg'},
    {id:'white-quiver',name:'穹苍白羽',slot:'腰部',index:2,sourceImage:'images/gifts/g6.jpg'},
    {id:'celestial-orb',name:'凤翥北斗',slot:'腰部',index:3,sourceImage:'images/gifts/g6.jpg'},
    {id:'moon-fan',name:'明月优昙',slot:'背部',index:4,sourceImage:'images/page2_bg_5.jpg'},
    {id:'plum-fan',name:'暗香疏影',slot:'背部',index:5,sourceImage:'images/page2_bg_5.jpg'},
    {id:'panther',name:'九影',slot:'跟宠',index:6,sourceImage:'images/gifts/g4.jpg'},
    {id:'deer',name:'云梦',slot:'跟宠',index:7,sourceImage:'images/gifts/g4.jpg'}
  ];
  const pendantStyle=[4,2,0,3,2,0,4,5,1,5,0,1,1,0,2,2,3,0];
  const ok=message=>({ok:true,message}),fail=message=>({ok:false,message});
  const hero=(s,uid)=>s.heroes?.find(h=>h.uid===uid);
  const original=h=>D.HEROES.find(m=>m.id===h?.id);
  function init(s){
    s.cosmetics??={version:1,characters:{}};
    return s.cosmetics;
  }
  function catalog(s){
    const G=root.JXEndgame,g=G?.init(s),chapters=G?.info(s)||[],luxury=G?.catalog()||[];
    const basic=chapters.map((c,i)=>({id:'pendant:'+c.id,type:'pendant',name:c.pendant.name,expansionId:c.id,owned:g.pendants.includes(c.id),style:pendantStyle[i],glow:false,
      source:c.name+' · 百战胜利0.3%，120胜保底 / 960本章通宝',progress:Math.min(120,c.record.pendantPity),target:120,legacy:true}));
    const rare=luxury.map(x=>({id:x.id,type:x.type,name:x.name,expansionId:x.expansionId,owned:g.collectibles.includes(x.id),
      style:x.type==='hair'?null:x.type==='pet'?(D.EXPANSIONS.findIndex(e=>e.id===x.expansionId)%2?7:6):pendantStyle[Math.max(0,D.EXPANSIONS.findIndex(e=>e.id===x.expansionId))],glow:x.type==='pendant',legacy:true,
      source:x.event?'花萼楼 · 每日签到2%，累计30签保底':D.EXPANSIONS.find(e=>e.id===x.expansionId)?.name+' · 毕业后百战每胜'+(x.rate*100).toFixed(x.type==='hair'?4:2)+'% / '+x.cost+'本章通宝',
      reason:G.collectionEligibility(s,x),description:x.description}));
    const pets=D.PETS.map((p,i)=>({id:'companion:'+p.id,type:'pet',name:p.name,petId:p.id,owned:s.pets.includes(p.id),petIndex:i,source:'野外历练邂逅 / 奇遇累计3次保底未拥有跟宠',description:p.desc+' '+p.bonus,legacy:true}));
    return basic.concat(rare,pets).map(item=>{
      const style=Number.isInteger(item.style)?STYLES[item.style]:null;
      return {...item,visualName:style?.name||item.name,visualSlot:style?.slot||'跟宠',officialUrl:style?OFFICIAL:null,
        reference:style?'造型：'+style.name+' · 官网原图像素转绘；收藏名称与获取方式为本作适配':item.type==='hair'?'历史发型收藏，未完成正式造型核实':'沿用本作既有跟宠图素'};
    });
  }
  function outfits(s,uid){
    const h=hero(s,uid),m=original(h);if(!m)return [];
    return D.HEROES.filter(x=>x.sect===m.sect&&(/弟子/.test(x.name)||x.id===m.id)).map(x=>({id:x.id,name:x.id===m.id?'原本装束':x.name+'装束',owned:x.id===m.id||s.dex.includes(x.id),artId:x.artId||x.id}));
  }
  function appearance(s,uid){
    const h=hero(s,uid);if(!h)return null;const c=init(s),stored=c.characters[uid];
    if(stored)return stored;
    // Display legacy selections until this character first saves its own wardrobe.
    const player=uid===s.playerUid,g=s.endgame;
    return {outfit:null,pendant:player?(g?.wearing?.pendant||(g?.equipped?'pendant:'+g.equipped:null)):null,
      pet:player?(g?.wearing?.pet||(s.activePet?'companion:'+s.activePet:null)):null,hair:player?g?.wearing?.hair||null:null};
  }
  function write(s,uid){const c=init(s);return c.characters[uid]??={...appearance(s,uid)};}
  function equip(s,uid,id){
    if(!hero(s,uid))return fail('请选择已拥有的角色。');if(typeof id!=='string')return fail('外观编号无效。');
    if(id.startsWith('outfit:')){
      const item=outfits(s,uid).find(x=>x.id===id.slice(7));if(!item?.owned)return fail('尚未结缘对应弟子，不能使用该装束。');
      write(s,uid).outfit=item.id;return ok('已换上'+item.name+'。');
    }
    const item=catalog(s).find(x=>x.id===id);if(!item?.owned)return fail('尚未收藏这件外观。');
    write(s,uid)[item.type]=id;
    if(uid===s.playerUid){
      if(item.petId){s.activePet=item.petId;if(s.endgame)s.endgame.wearing.pet=null;}
      if(id.startsWith('pendant:')){s.endgame.equipped=item.expansionId;s.endgame.wearing.pendant=null;}
      else if(s.endgame&&item.type!=='hair'&&s.endgame.collectibles.includes(id))s.endgame.wearing[item.type]=id;
      else if(s.endgame&&item.type==='hair')s.endgame.wearing.hair=id;
    }
    return ok('已为'+original(hero(s,uid)).name+'展示'+item.name+'。');
  }
  function clear(s,uid,type){
    if(!hero(s,uid)||!['outfit','pendant','pet','hair'].includes(type))return fail('外观部位无效。');
    write(s,uid)[type]=null;
    if(uid===s.playerUid){if(type==='pet')s.activePet=null;if(type==='pendant'&&s.endgame)s.endgame.equipped=null;if(s.endgame?.wearing&&type!=='outfit')s.endgame.wearing[type]=null;}
    return ok('已收起'+({outfit:'替换装束',pendant:'挂件',pet:'跟宠',hair:'发型'}[type])+'。');
  }
  function toggle(s,uid,id){
    if(!hero(s,uid))return fail('请选择已拥有的角色。');
    const item=catalog(s).find(x=>x.id===id);if(!item?.owned)return fail('尚未收藏这件外观。');
    return appearance(s,uid)[item.type]===id?clear(s,uid,item.type):equip(s,uid,id);
  }
  function benefits(s,uid){
    if(uid!==s.playerUid)return [];
    const result=[],pet=D.PETS.find(p=>p.id===s.activePet),g=s.endgame,c=g?.equipped?root.JXEndgame?.chapter(s,g.equipped):null;
    if(c)result.push({name:c.pendant.name,effect:c.pendant.effect,type:'收益挂件'});
    if(pet)result.push({name:pet.name,effect:pet.bonus,type:'助益跟宠'});
    return result;
  }
  function validateSave(s){
    if(s.cosmetics===undefined){init(s);return true;}
    const c=s.cosmetics,obj=x=>x&&typeof x==='object'&&!Array.isArray(x);
    if(!obj(c)||c.version!==1||!obj(c.characters)||Object.keys(c).some(k=>!['version','characters'].includes(k)))throw new Error('角色外观数据无效。');
    const items=catalog(s);
    for(const [uid,w]of Object.entries(c.characters)){
      if(!hero(s,uid)||!obj(w)||Object.keys(w).some(k=>!['outfit','pendant','pet','hair'].includes(k)))throw new Error('角色外观归属无效。');
      for(const type of ['outfit','pendant','pet','hair']){
        if(w[type]===undefined)w[type]=null;
        if(w[type]===null)continue;
        if(type==='outfit'?!outfits(s,uid).some(x=>x.id===w[type]&&x.owned):!items.some(x=>x.id===w[type]&&x.type===type&&x.owned))throw new Error('角色穿戴了未拥有的外观。');
      }
    }
    return true;
  }
  function visualHero(s,value){
    if(!value)return value;const h=hero(s,value.uid)||s.heroes.find(x=>x.id===value.id);if(!h)return value;
    const w=appearance(s,h.uid),skin=outfits(s,h.uid).find(x=>x.id===w.outfit&&x.owned);return skin?{...value,artId:skin.artId}:value;
  }
  const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function art(item,cls=''){
    if(!item||item.type==='hair')return '';
    const style=item.petIndex!==undefined?'--cosmetic-x:'+((item.petIndex%4)*100/3)+'%;--cosmetic-y:'+(Math.floor(item.petIndex/4)*50)+'%;':'--cosmetic-x:'+((item.style%4)*100/3)+'%;--cosmetic-y:'+(Math.floor(item.style/4)*100)+'%;';
    return '<span class="cosmetic-art '+(item.petIndex!==undefined?'cosmetic-pet-existing ':'cosmetic-official ')+(item.glow?'cosmetic-glow ':'')+cls+'" style="'+style+'" role="img" aria-label="'+escape(item.visualName||item.name)+'"></span>';
  }
  function decorate(s,uid){
    const w=appearance(s,uid);if(!w)return '';const items=catalog(s);
    return ['pendant','pet'].map(type=>{const item=items.find(x=>x.id===w[type]&&x.owned);return item?'<span class="cosmetic-layer cosmetic-layer-'+type+' cosmetic-position-'+(item.visualSlot==='腰部'?'waist':'back')+'" title="'+escape(item.name+' · '+item.visualName)+'">'+art(item)+'</span>':'';}).join('');
  }
  root.JXCosmetics={STYLES,OFFICIAL,init,catalog,outfits,appearance,equip,clear,toggle,benefits,validateSave,visualHero,art,decorate};
})(globalThis);

;
(function(root){
 'use strict';
 const D=root.JXData,fail=message=>({ok:false,message});
 function init(s){if(!s.trials)s.trials={version:1,records:{},yangning:{runs:0,wins:0,pity:0,claimed:false}};return s.trials;}
 function info(s){const p=s.heroes.find(h=>h.uid===s.playerUid)||s.heroes[0],m=D.HEROES.find(h=>h.id===p.id),g=init(s),pool=D.HEROES.filter(h=>h.sect===m.sect&&h.recruitment?.type==='sect-trial').sort((a,b)=>a.rarity-b.rarity);return D.EXPANSIONS.map((ex,index)=>({id:ex.id,name:ex.name,index,cap:10+index*5,unlocked:root.JXProgression.isExpansionUnlocked(s,ex.id),record:g.records[ex.id]||{runs:0,wins:0},reward:pool.filter(h=>D.EXPANSIONS.findIndex(e=>e.id===h.placement?.expansionId)<=index).find(h=>!s.dex.includes(h.id))||pool.filter(h=>D.EXPANSIONS.findIndex(e=>e.id===h.placement?.expansionId)<=index).at(-1)||null,player:p,sect:D.SECTS.find(x=>x.id===m.sect)}));}
 function challenge(s,id,rng=Math.random){const c=info(s).find(c=>c.id===id);if(!c?.unlocked)return fail('对应资料片尚未开放。');if(c.record.wins)return fail('本章门派试炼已完成，继续下一章历练。');if(s.battle||s.endgame?.active)return fail('请先结束当前战斗或退出百战挂机。');if(c.player.level<c.cap-2)return fail('主角达到 Lv.'+(c.cap-2)+' 后可接受门派试炼。');if(c.reward?.placement?.dungeonId&&!(s.equipment?.dungeons?.[c.reward.placement.dungeonId]?.wins>0))return fail('先通关'+c.reward.placement.location+'对应普通秘境，再接受结缘试炼。');if(s.progression.supplies<15)return fail('需要15份副本补给。');
  const d=D.DUNGEONS.find(d=>d.id==='five_'+id),enemy=root.JXDungeonRules.encounter(s,d,0,'normal');enemy.name=c.sect.name+'·守心试炼';enemy.hp=enemy.maxHp=Math.round(enemy.maxHp*.95);enemy.atk=Math.round(enemy.atk*.9);s.progression.supplies-=15;
  const result=root.JXSystems.encounter(s,enemy,rng,{limit:40}),g=init(s),record=g.records[id]||{runs:0,wins:0};record.runs++;let message='试炼未成，已返还7份补给；请整备后再来。';if(result.won){record.wins++;s.renown+=50;root.JXEquipment.init(s).stones[1]=(s.equipment.stones[1]||0)+15;if(c.reward){const joined=root.JXEngine.addHero(s,c.reward.id);message=c.sect.name+'试炼完成，'+c.reward.name+(joined.isNew?'愿与你同行。':'传授心得。');}else{c.player.insight+=20;message=c.sect.name+'试炼完成，获得20点门派心得。';}}else s.progression.supplies=Math.min(240,s.progression.supplies+7);g.records[id]=record;root.JXEngine.addLog(s,message,'trial');return {...result,ok:true,message,rewards:result.won?{renown:50}:null};
 }
 function memory(s,rng=Math.random){const index=D.EXPANSIONS.findIndex(e=>e.id==='anshi');if(root.JXProgression.current(s).index<index)return fail('血战天策回忆于安史之乱资料片开放。');if(s.battle||s.endgame?.active)return fail('请先结束战斗或退出百战挂机。');if(s.progression.supplies<20)return fail('血战天策回忆需要20份补给。');const g=init(s),record=g.yangning;if(record.claimed)return fail('已完成隐藏成就「天枪旧誓」，杨宁已结缘。');s.progression.supplies-=20;
  const d=D.DUNGEONS.find(d=>d.id==='xuezhan_dungeon'),bossIndex=d.bosses.findIndex(b=>(typeof b==='string'?b:b.name)==='令狐伤'),enemy=root.JXDungeonRules.encounter(s,d,bossIndex,'normal');enemy.name='令狐伤·月下剑法';enemy.weaknesses=['长兵','气劲'];enemy.hp=enemy.maxHp=Math.round(enemy.maxHp*.85);const result=root.JXSystems.encounter(s,enemy,rng,{raid:true,limit:40});record.runs++;let message='守卫回忆未能完成，已返还10份补给。';if(result.won){record.wins++;record.pity++;s.renown+=20;message='守卫回忆告捷，隐秘线索 '+record.pity+' / 200。';if(record.pity>=200||rng()<.002){record.claimed=true;root.JXEngine.addHero(s,'tiance_5');message='隐藏成就「天枪旧誓」达成：杨宁的天枪侠影加入队伍！';}}else s.progression.supplies=Math.min(240,s.progression.supplies+10);root.JXEngine.addLog(s,message,'trial');return {...result,ok:true,message,rewards:result.won?{renown:20}:null};
 }
 function validateSave(s){if(!s.trials){init(s);return true;}const t=s.trials,int=n=>Number.isSafeInteger(n)&&n>=0&&n<=1e9,obj=v=>v&&typeof v==='object'&&!Array.isArray(v);if(!obj(t)||t.version!==1||!obj(t.records)||Object.entries(t.records).some(([id,r])=>!D.EXPANSIONS.some(e=>e.id===id)||!obj(r)||!int(r.runs)||!int(r.wins)||r.wins>1||r.wins>r.runs))throw Error('门派试炼记录无效。');const y=t.yangning;if(!obj(y)||!int(y.runs)||!int(y.wins)||y.wins>y.runs||!int(y.pity)||y.pity!==y.wins||y.pity>200||typeof y.claimed!=='boolean'||y.claimed&&!s.dex.includes('tiance_5'))throw Error('天枪回忆记录无效。');return true;}
 root.JXTrials={init,info,challenge,memory,validateSave};
})(globalThis);

;
/* Event-driven pixel battle presentation. Nothing in this module mutates game state. */
(function () {
  'use strict';
  const D = globalThis.JXData, E = globalThis.JXEngine;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const mix = (a, b, p) => a + (b - a) * p;
  const ease = p => 1 - Math.pow(1 - clamp(p), 3);
  const copy = value => value && JSON.parse(JSON.stringify(value));
  const styles = {
    chunyang: { name: '剑气', color: '#a8eeff', ranged: true, shape: 'sword' },
    tiance: { name: '突刺', color: '#ffba76', shape: 'spear' },
    wanhua: { name: '墨意', color: '#c8abff', ranged: true, shape: 'petal' },
    qixiu: { name: '剑舞', color: '#ffafdf', ranged: true, shape: 'petal' },
    cangjian: { name: '斩岳', color: '#ffde76', shape: 'blade' },
    shaolin: { name: '伏魔', color: '#ffe3a0', shape: 'palm' },
    wudu: { name: '蛊术', color: '#c5a0ff', ranged: true, shape: 'venom' },
    tangmen: { name: '机弩', color: '#8cddd1', ranged: true, shape: 'arrow' },
    mingjiao: { name: '日月', color: '#ffae67', shape: 'flame' },
    gaibang: { name: '掌风', color: '#e0cc82', shape: 'palm' },
    cangyun: { name: '刀盾', color: '#c8d6e6', shape: 'shield' },
    changge: { name: '琴音', color: '#9be4bb', ranged: true, shape: 'sound' },
    badao: { name: '刀气', color: '#d3b1f6', shape: 'blade' },
    penglai: { name: '御风', color: '#95f3ef', ranged: true, shape: 'wind' },
    lingxue: { name: '链刃', color: '#ff9fac', shape: 'chain' },
    yantian: { name: '星阵', color: '#d3b7ff', ranged: true, shape: 'star' },
    yaozong: { name: '药针', color: '#b2efac', ranged: true, shape: 'herb' },
    daozong: { name: '孤锋', color: '#91d9f0', shape: 'blade' },
    wanling: { name: '弓箭', color: '#e6eaa0', ranged: true, shape: 'arrow' },
    duanshi: { name: '指风', color: '#c6d8ff', ranged: true, shape: 'fan' },
    wuxiang: { name: '牵丝', color: '#f5a8ce', ranged: true, shape: 'thread' }
  };
  // Cross-school techniques carry their own visual identity. All shapes are a
  // pixel interpretation; this module never changes skill or damage rules.
  function technique(event) {
    const name = event.skillName || event.attacker.skill || '';
    const skill = globalThis.JXMartial?.SKILLS.find(s => s.name === name);
    const basic = !name || name === '基础招式';
    const sect = skill?.sect || event.attacker.sect;
    return { ...(styles[sect] || styles.tiance), sect, basic, effect: skill?.effect || 'damage' };
  }
  function sprite(el, actor, boss = false, state = null) {
    let index = actor.portrait || 0;
    const bossArt=(boss||actor.encounterKind==='rehearsal')&&globalThis.JXBossArt?.get(actor.name);
    const patrolArt=actor.side==='enemy'&&globalThis.JXEnemyRoster?.get(actor);
    el.classList.toggle('foe-atlas', boss&&!bossArt);
    el.classList.toggle('boss-portrait',!!bossArt);
    el.classList.toggle('enemy-portrait',!!patrolArt);
    for(const name of [...el.classList]) if(name.startsWith('art-')||name.startsWith('sect-art-')||name.startsWith('disciple-art-')||name.startsWith('boss-art-')||name.startsWith('enemy-art-')) el.classList.remove(name);
    if(patrolArt){el.classList.add(patrolArt.className);el.innerHTML='';el.style.backgroundPosition='';el.style.transform='none';return;}
    if(bossArt){el.classList.add(bossArt.className);el.style.backgroundPosition='';el.style.transform='none';return;}
    const original=D.HEROES.find(h=>h.id===actor.id),customize=state&&!boss&&actor.side!=='enemy';
    const meta=customize?globalThis.JXCosmetics?.visualHero(state,{...original,uid:actor.uid})||original:original;
    const decoration=customize?globalThis.JXCosmetics?.decorate(state,actor.uid)||'':'';
    if(el.innerHTML!==decoration)el.innerHTML=decoration;
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
      const route=E.getRoute(this.state),patrol=route.dungeonId&&globalThis.JXDungeonRules?.roamingEncounter(this.state,route,this.state.stats.steps||0);
      if(patrol)return {...patrol,uid:'preview_'+patrol.id,side:'enemy'};
      const id=route.heroes[(this.state.stats.steps||0)%route.heroes.length],meta=D.HEROES.find(h=>h.id===id);
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
        el.querySelector('.fighter-tag').textContent = (boss ? '首领　' : actor.encounterKind==='rehearsal'?'首领演练　':'Lv.' + actor.level + '　') + actor.name;
        sprite(el.querySelector('.fighter-art'), actor, boss, this.state);
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
      const combat = events.filter(e => ['battle-start', 'attack', 'combat-heal', 'break', 'victory', 'defeat'].includes(e.type));
      if (!combat.length) return;
      let i = 0;
      while (i < combat.length) {
        const event = combat[i];
        if (event.type === 'battle-start') {
          this.schedule(Math.max(this.clock, this.tail), 'start', event); i++; continue;
        }
        if(event.type==='break'){this.schedule(Math.max(this.clock,this.lastImpact||this.clock),'break',event);i++;continue;}
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
      const theme = technique(event);
      this.statusText(actor.name + ' · ' + (actor.skill || theme.name) + ' → ' + target.name);
      const effect = this.addEffect('attack', event, at);
      if((event.skillRank||1)>=3){effect.element.classList.add('combat-master-skill');effect.element.dataset.rank=event.skillRank;}
      effect.from = this.locate(actor); effect.to = this.locate(target); effect.theme = theme;
      effect.element.style.setProperty('--fx-color', theme.color);
      effect.element.dataset.attacker = actor.uid;
      effect.element.dataset.style = theme.ranged ? 'ranged' : 'melee';
      effect.element.dataset.sect = theme.sect;
      effect.element.dataset.technique = theme.basic ? 'basic' : theme.effect;
      const cast = document.createElement('span'); cast.className = 'combat-cast combat-shape-' + theme.shape;
      cast.innerHTML = '<i></i><i></i><i></i>'; effect.element.append(cast); effect.cast = cast;
      const body = document.createElement('div'); body.className = 'combat-sprite';
      const visual = { ...actor };
      const boss = actor.side === 'enemy' && this.snapshot.boss;
      if (boss) visual.bossPortrait = this.snapshot.enemy.bossPortrait;
      sprite(body, visual, boss, this.state); effect.element.append(body);
      effect.body = body;
      effect.element.style.width = effect.from.width + 'px'; effect.element.style.height = effect.from.height + 'px';
      if (theme.ranged) {
        const missile = document.createElement('div'); missile.className = 'combat-projectile ' + theme.sect + ' combat-shape-' + theme.shape;
        missile.innerHTML = '<i></i><i></i><i></i>';
        missile.style.setProperty('--fx-color', theme.color);
        this.scene.querySelector('.combat-effects').append(missile); effect.missile = missile;
      }
      const label = document.createElement('div'); label.className = 'combat-skill'; label.textContent = event.skillName || actor.skill || theme.name;
      label.dataset.effect = theme.basic ? 'basic' : theme.effect;
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
      const theme = technique(event);
      effect.theme = theme;
      effect.color = healing ? '#94ffaf' : theme.color;
      effect.element.style.setProperty('--fx-color', effect.color);
      effect.element.dataset.technique = theme.basic ? 'basic' : theme.effect;
      effect.element.dataset.sect = theme.sect;
      const seal = document.createElement('span'); seal.className = 'combat-hit-seal' + (healing ? ' healing' : theme.effect === 'break' ? ' breaking' : theme.effect === 'guard' ? ' guarding' : '');
      effect.element.append(seal); effect.seal = seal;
      if (!healing && !theme.ranged) {
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
      if(task.kind==='break'&&this.scene){
        this.scene.querySelector('.combat-break-banner')?.remove();const banner=document.createElement('div');banner.className='combat-break-banner';banner.textContent='破招！全队易伤窗口';this.scene.append(banner);this.statusText(event.message||'首领招式被打断，乘势出击！');setTimeout(()=>banner.remove(),1600);
      }
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
            sx = 1 + charge * .045; sy = 1 - charge * .07;
          } else if (age < 90) { const p = age / 90; x = -direction * 14 * p; y = 6 * p; sx = 1 + p * .1; sy = 1 - p * .1; }
          else if (age < 300) { const p = ease((age - 90) / 210); x = mix(-direction * 14, (to.x - from.x) * .8, p); y = -Math.sin(p * Math.PI) * 14; }
          else { const p = ease((age - 300) / 240); x = (to.x - from.x) * .8 * (1 - p); y = -Math.sin(p * Math.PI) * 6; }
        }
        element.style.transform = 'translate(' + (from.x + x) + 'px,' + (from.y + y) + 'px) scale(' + sx + ',' + sy + ')';
        // Keep skill labels readable when motion is disabled, hide only moving art.
        element.style.opacity = String(age > 510 ? clamp((550 - age) / 40) : 1);
        effect.body.style.opacity = reduced ? '0' : '1';
        effect.cast.style.opacity = reduced || theme.basic ? '0' : String(clamp(1 - age / 350));
        effect.cast.style.transform = 'translate(-50%,-50%) scale(' + (.55 + clamp(age / 220) * .8) + ') rotate(' + (age * .12 * direction) + 'deg)';
        if (effect.missile) {
          const p = clamp((age - 80) / 220);
          effect.missile.style.opacity = !reduced && age >= 80 && age < 310 ? '1' : '0';
          const arc = ['star', 'venom', 'herb', 'petal'].includes(theme.shape) ? 36 : ['wind', 'sound'].includes(theme.shape) ? 18 : 0;
          const x = mix(from.x + from.width * .5, to.x + to.width * .5, p);
          const y = mix(from.y + from.height * .45, to.y + to.height * .45, p) - Math.sin(p * Math.PI) * arc;
          const angle = Math.atan2(to.y + to.height * .45 - from.y - from.height * .45, to.x + to.width * .5 - from.x - from.width * .5) * 180 / Math.PI;
          effect.missile.style.transform = 'translate(' + x + 'px,' + y + 'px) rotate(' + angle + 'deg)';
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
      effect.seal.style.opacity = reduced || effect.theme.basic ? '0' : String(clamp(1 - age / 380));
      effect.seal.style.transform = 'translate(-50%,-50%) scale(' + mix(.5, 1.35, ease(age / 380)) + ') rotate(' + (effect.kind === 'heal' ? 0 : 45) + 'deg)';
      Array.from(element.querySelectorAll('.combat-spark')).forEach((spark, i, array) => {
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

;
(function(root){
  'use strict';
  const D=root.JXData,Q=root.JXEquipment;
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const shapes={weapon:'M6 25 24 7l3-3 1 1-2 4L9 27M5 21l6 6M4 28l3-3',head:'M6 16 9 8l7-3 7 3 3 8-4 3H10ZM9 19v5h14v-5',chest:'m10 6 6 4 6-4 7 7-5 5-3-3v12H11V15l-3 3-5-5Z',waist:'M5 12h22v9H5ZM13 10h6v13h-6',wrist:'m9 5 13 3 1 18-13-3ZM10 11l12 3M10 17l13 3',legs:'M8 5h16l2 22h-9l-1-13-1 13H6ZM8 10h16',feet:'M9 5h11v13l7 4v5H6v-8h3ZM9 11h11',necklace:'M6 7c-2 15 22 15 20 0M12 22l4-5 4 5-4 6Z',pendant:'M16 3v8M10 15l6-5 6 5-2 9h-8ZM12 24v5m4-5v5m4-5v5',ring1:'M16 11a8 8 0 1 0 .1 0ZM12 7l4-4 4 4-4 5Z',ring2:'M16 11a8 8 0 1 0 .1 0ZM12 7l4-4 4 4-4 5Z',ranged:'m16 3 3 10 10 3-10 3-3 10-3-10-10-3 10-3Z'};
  const slotPaint={weapon:['#bedbe5','#738faa'],head:['#a6bce5','#596eac'],chest:['#a6c3ef','#617ab4'],waist:['#f2cc80','#ab7f44'],wrist:['#c3b1dd','#867198'],legs:['#a0bddd','#607ca6'],feet:['#c6af8d','#8b7255'],necklace:['#e7ce86','#a5bd8d'],pendant:['#9cdbc1','#539e8e'],ring1:['#edcf80','#af9bd8'],ring2:['#e4c77c','#89bdcf'],ranged:['#c9dcea','#7587ad']};
  const ornaments={weapon:'M20 10l3 3M10 22l2 2',head:'M11 13h10M16 7v7',chest:'m12 12 4 4 4-4M13 23h6',waist:'M15 14h2v5h-2Z',wrist:'M13 9l6 2M13 21l6 2',legs:'M10 7h12M10 24h3m6 0h4',feet:'M12 8h5M10 23h12',necklace:'m14 22 2-2 2 2-2 3Z',pendant:'m14 16 2-2 2 2-2 4Z',ring1:'m14 7 2-2 2 2-2 2Z',ring2:'m14 7 2-2 2 2-2 2Z',ranged:'m14 16 2-2 2 2-2 2Z'};
  function slotIcon(slot,rarity='epic',extra=''){const [edge,fill]=slotPaint[slot]||slotPaint.chest;return '<span class="loot-slot-icon quality-'+esc(rarity)+' '+esc(extra)+'" style="--slot-edge:'+edge+';--slot-paint:'+fill+'" aria-hidden="true">'+(root.JXPixelIcons?.slot(slot,rarity)||'<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path class="slot-silhouette" d="'+(shapes[slot]||shapes.chest)+'"/><path class="slot-ornament" d="'+(ornaments[slot]||ornaments.chest)+'"/></svg>')+'</span>';}
  function player(s){return s.heroes.find(h=>h.uid===s.playerUid)||s.heroes[0];}
  function raid(s){const e=root.JXProgression.current(s).expansion;return D.DUNGEONS.find(d=>d.expansionId===e.id&&d.kind==='raid'&&d.main!==false)||D.DUNGEONS.find(d=>d.expansionId===e.id&&d.kind==='raid');}
  function graduated(item,e){return !!item&&item.expansionId===e.id&&(item.tier==='raid'||item.rarity==='legendary');}
  function graduation(s,compact=false){
    const e=root.JXProgression.current(s).expansion,h=player(s),count=Q.SLOTS.filter(x=>graduated(h?.equipment?.[x.id],e)).length;
    return '<div class="gear-graduation '+(compact?'compact':'')+'" aria-label="本章团队装备 '+count+' / 12 件，9件达标"><div class="gear-progress-heading"><strong>团队装备</strong><span><b>'+count+'</b> / 12 件 · '+(count>=9?'已达标':'9件达标')+'</span></div><div class="gear-slot-progress">'+Q.SLOTS.map(x=>{const item=h?.equipment?.[x.id],done=graduated(item,e);return '<button type="button" data-action="journey-source" data-id="player-gear" class="gear-progress-slot '+(done?'done':'missing')+'" title="'+esc(x.name+'：'+(done?'本章团队装备已穿戴':item?.name||'待获取')+'，点击查看来源')+'">'+slotIcon(x.id,done?item.rarity:'empty')+'<small>'+esc(x.name)+'</small><i>'+(done?'✓':'·')+'</i></button>';}).join('')+'</div><div class="bar"><span style="width:'+Math.min(100,count/9*100)+'%"></span></div><p class="tiny muted">本章穿戴9件即可；不要求集齐12件或全部团本。五人过渡装不计入。</p>'+(!compact?'<p class="tiny muted">优装自动穿戴。满包时先清理低档或可替代的同档装备；缺件若无法安全腾位则暂存。</p>':'')+(!compact&&s.equipment?.vault?.length?'<p class="tiny">有 '+s.equipment.vault.length+' 件装备暂存；整理行囊后自动收入。</p>':'')+'</div>';
  }
  function drops(s,d){
    const tier=d?.kind==='raid'?'raid':d?'dungeon':'field',quality=d?'epic':'rare',label={raid:'团队紫装',dungeon:'小队紫装',field:'野外精良装备'}[tier];
    const slots=Q.SLOTS;
    return '<aside class="map-drop-preview" aria-label="'+esc((d?.name||'野外')+'掉落预览')+'"><div class="map-drop-title"><span class="eyebrow">战利品预览</span><strong class="quality-text-'+quality+'">'+label+'</strong><span class="loot-tier-tag">'+({raid:'毕业装备',dungeon:'过渡装备',field:'入门装备'}[tier])+'</span></div><div class="map-loot-slots">'+slots.map(x=>'<div title="'+esc(x.name)+'">'+slotIcon(x.id,quality)+'<small>'+esc(x.name)+'</small></div>').join('')+'</div>'+(d?'<div class="loot-set-name">'+esc(d.setName)+'<small>防具六件套 · 兵器匹配主角门派</small></div>':'')+'<div class="map-material-drops"><span>◆ 五行石</span>'+(d?.materialDrop!==false&&d?(d.smallIron?'<span>◇ '+esc(d.smallIron)+'</span>':'')+(d.bigIron?'<span>✦ '+esc(d.bigIron)+'<small>概率掉落</small></span>':''):'')+'</div><small class="loot-probability-note">'+(d?'完整通关后，每位首领1件装备，优先补齐本门缺失部位；更好的掉落自动穿戴。'+(tier==='dungeon'?'五人过渡装不计团队毕业。':''):'历练随机掉落；团队毕业装备请挑战团队秘境。')+'</small></aside>';
  }
  function gearGuide(s){
    const e=root.JXProgression.current(s).expansion,d=raid(s),five=D.DUNGEONS.find(x=>x.id===d?.prerequisiteDungeonId)||D.DUNGEONS.find(x=>x.expansionId===e.id&&x.kind==='dungeon'&&x.main===false),record=s.equipment?.dungeons||{},fiveDone=!!record[five?.id]?.modes?.normal?.wins,raidDone=!!record[d?.id]?.modes?.normal?.wins;
    if(!d)return '';
    return '<section class="panel gear-source-guide" aria-label="团队装备获取路线"><div class="gear-guide-heading"><div><span class="eyebrow">'+esc(e.name)+' · 装备毕业路线</span><h3>'+esc(d.name)+' · 获取团队紫装</h3></div><button class="btn primary" data-action="map-focus-dungeon" data-id="'+d.id+'">查看掉落与入场</button></div>'+graduation(s)+'<div class="gear-source-steps"><button data-action="map-focus-dungeon" data-id="'+(five?.id||d.id)+'" class="'+(fiveDone?'done':'current')+'"><b>'+(fiveDone?'✓':'1')+'</b><span>小队整备<small>'+esc(five?.name||'本章小队秘境')+'</small></span></button><span class="gear-step-arrow">→</span><button data-action="map-focus-dungeon" data-id="'+d.id+'" class="'+(raidDone?'done':fiveDone?'current':'')+'"><b>'+(raidDone?'✓':'2')+'</b><span>人机会战<small>'+esc(d.name)+' · 普通</small></span></button><span class="gear-step-arrow">→</span><button data-action="nav" data-id="exchange" class="'+(raidDone?'current':'')+'"><b>3</b><span>补齐缺件<small>普通团本通关后可兑换</small></span></button></div><div class="gear-guide-footer"><span>现有侠名 '+Math.floor(s.renown||0)+' · '+(raidDone?'可定向兑换本章团队紫装':'先通关本章普通团本，开放团队紫装兑换')+'</span><button class="btn small" data-action="nav" data-id="exchange">侠名补齐缺件</button><button class="btn small" data-action="nav" data-id="equipment">穿戴与强化</button></div></section>';
  }
  root.JXLootUI={slotIcon,graduation,drops,gearGuide,raid,graduated};
})(globalThis);

;
(function(root){
  'use strict';
  const D=root.JXData,E=root.JXEngine;
  const sceneClass=route=>route?.sceneId?'scene-'+route.sceneId:'';
  const routeLabel=route=>{const kind=D.DUNGEONS.find(d=>d.id===route.dungeonId||d.id===route.id)?.kind||route.kind;return (route.main===false?'支线':'主线')+' · '+(kind==='raid'?'团队秘境':kind==='dungeon'?'小队秘境':'野外');};
  function create(c){
    const {ui,esc,btn,icon,portrait,meta}=c,state=()=>c.getState();
    const unlocked=r=>E.routeUnlocked(state(),r);
    if(root.document)root.document.addEventListener('toggle',event=>{const key=event.target.dataset?.mapDetail;if(key)ui[key]=event.target.open;},true);
    function details(key,label,content){return '<details class="gui-details" data-map-detail="'+key+'" '+(ui[key]?'open':'')+'><summary>'+label+'</summary><div class="gui-details-body">'+content+'</div></details>';}
    function dungeonEntries(){return (root.JXSystems?.expansionDungeons(state())||D.DUNGEONS).map(d=>({...d,mapId:'dungeon:'+d.id,region:D.EXPANSIONS.find(e=>e.id===d.expansionId)?.name,isDungeon:true}));}
    const isUnlocked=r=>r.isDungeon?r.unlocked!==false:unlocked(r),entryId=r=>r.mapId||r.id;
    function render(){
      const s=state(),kind=ui.mapKind||'all',current=root.JXProgression?.current(s).expansion;
      if(ui.mapExpansion===undefined){ui.mapExpansion=current?.id||'all';if(!ui.region||ui.region==='all')ui.region=current?.name||'all';}
      if(!ui.region)ui.region=current?.name||'all';
      const dungeons=dungeonEntries(),linked=new Set(dungeons.map(d=>d.routeId)),entries=[...D.ROUTES.filter(r=>!linked.has(r.id)),...dungeons];
      const selected=entries.filter(r=>(ui.region==='all'||r.region===ui.region)&&(kind==='all'||kind==='main'&&r.main!==false||kind==='field'&&!r.isDungeon&&r.kind==='field'||kind==='dungeon'&&r.isDungeon||kind==='squad'&&r.isDungeon&&r.kind==='dungeon'||kind==='raid'&&r.kind==='raid'||kind==='unlocked'&&isUnlocked(r)));
      const list=selected.slice().sort((a,b)=>D.EXPANSIONS.findIndex(e=>e.id===a.expansionId)-D.EXPANSIONS.findIndex(e=>e.id===b.expansionId)||Number(a.main===false)-Number(b.main===false)||Number(!!a.isDungeon)-Number(!!b.isDungeon));
      const chapters=root.JXChapterInfo?.sections(list)||[],chapter=chapters.find(x=>x.id===ui.mapChapter),visible=chapter?chapter.entries:list;
      const route=visible.find(r=>entryId(r)===ui.mapSelection)||visible.find(r=>r.id===s.routeId||r.routeId===s.routeId)||visible[0];
      const filters='<div class="map-filter-bar" role="group" aria-label="地图类型">'+[['all','全部地图'],['main','资料片主线'],['field','野外'],['dungeon','秘境'],['squad','小队秘境'],['raid','团队秘境'],['unlocked','已解锁']].map(([id,name])=>'<button class="btn small '+(kind===id?'primary':'')+'" data-action="map-kind" data-id="'+id+'" aria-pressed="'+(kind===id)+'">'+name+'</button>').join('')+'<span>'+list.length+' 处地点 · 主线信物 '+E.mainBadgeCount(s)+' / '+D.ROUTES.filter(r=>r.main!==false).length+'</span></div>';
      const tabs='<div class="tabs map-era-tabs">'+['all',...D.EXPANSIONS.map(e=>e.name)].map(r=>'<button class="tab '+(ui.region===r?'active':'')+'" data-action="region" data-id="'+esc(r)+'">'+(r==='all'?'天下江湖':esc(r))+'</button>').join('')+'</div>';
      const routes='<div class="route-list" aria-label="探索地点">'+(visible.map(r=>{const wins=r.isDungeon?r.record?.modes?.normal?.wins:s.clears[r.id],selected=entryId(route)===entryId(r),open=isUnlocked(r);return '<button type="button" class="route-option '+(selected?'active ':'')+(!open?'locked':'')+'" data-action="select-route" data-id="'+entryId(r)+'" aria-pressed="'+selected+'"><span class="route-thumb '+sceneClass(r)+'" aria-hidden="true"></span><div><strong>'+esc(r.name)+'</strong><small class="map-kind-label kind-'+r.kind+'">'+(r.isDungeon?(r.kind==='raid'?'团队 · 10人适配 · 毕业紫装':'小队 · 5人 · 过渡紫装'):routeLabel(r))+'</small><small class="map-route-status">'+(wins?'✓ 已通关 '+wins+' 次':open?r.isDungeon?'人机补位 · 查看条件':'已解锁':'未解锁 · '+esc(r.isDungeon?r.requirement:E.routeRequirement(s,r)))+'</small></div>'+icon(open?'chevron':'lock')+'</button>';}).join('')||'<div class="empty-note">这个筛选下尚无地点。可切换资料片或地图类型。</div>')+'</div>';
      const chapterTabs='<div class="chapter-sections" aria-label="资料片章节">'+chapters.map(x=>'<button class="btn chapter-section '+(chapter?.id===x.id?'active':'')+'" data-action="map-chapter" data-id="'+x.id+'" aria-pressed="'+(chapter?.id===x.id)+'"><strong>'+esc(x.name)+'</strong><small>'+esc(x.desc)+' · '+x.entries.length+' 处</small><small>已完成 '+x.entries.filter(r=>r.isDungeon?r.record?.modes?.normal?.wins:s.clears[r.id]).length+' / '+x.entries.length+'</small></button>').join('')+'</div>';
      const heading='<div class="gui-map-heading"><div><span class="eyebrow">'+(ui.region===current?.name?'当前章节':'山河地图')+'</span><strong>'+esc(ui.region==='all'?'天下江湖':ui.region)+'</strong></div>'+btn('本章目标','nav','journey','small')+'</div>';
      const selectedExpansion=D.EXPANSIONS.find(e=>e.name===ui.region),overview=selectedExpansion?root.JXJourneyUI?.create(c).overview(selectedExpansion.id)||'':'';
      return '<section class="ux-map-view" aria-label="山河地图">'+heading+overview+details('mapChaptersOpen','切换资料片',tabs)+chapterTabs+filters+(route?'<div class="map-layout">'+routes+(route.isDungeon?dungeonDetail(route):detail(route))+'</div>':routes)+details('mapLoopOpen','刷取设置 · '+((s.routeLoop||[]).length?'已选 '+s.routeLoop.length+' 条路线':s.autoAdvance?'首通自动推进':'当前路线刷取'),loopPanel())+'</section>';
    }
    function compactLoot(d){
      if(!root.JXLootUI?.slotIcon)return root.JXLootUI?.drops(state(),d)||'';
      const slots=root.JXEquipment.SLOTS,quality=d?'epic':'rare',raid=d?.kind==='raid',label=d?raid?'团队紫装':'小队紫装':'野外精良装备';
      const cell=x=>'<div title="'+esc(x.name)+'">'+root.JXLootUI.slotIcon(x.id,quality)+'<small>'+esc(x.name)+'</small></div>';
      const materials='<div class="map-material-drops"><span>五行石</span>'+(d&&d.materialDrop!==false?(d.smallIron?'<span>'+esc(d.smallIron)+'</span>':'')+(d.bigIron?'<span>'+esc(d.bigIron)+'<small>概率掉落</small></span>':''):'')+'</div>';
      const extra='<p class="map-loot-detail-note">上方为代表部位，下方为其余装备池。</p><div class="map-loot-slots ux-map-extra-slots">'+slots.slice(4).map(cell).join('')+'</div>'+(d?'<div class="loot-set-name">'+esc(d.setName)+'<small>防具六件套 · 兵器匹配主角门派</small></div>':'')+materials+'<p class="map-loot-detail-note">'+(d?'完整通关后，每位首领1件装备，优先补齐本门缺失部位；更好的掉落自动穿戴。满包先清理低档或可替代的同档装备，无法安全腾位的缺件暂存。'+(raid?'团队装备与强化属于可选精通；普通首通即可继续主线。':'五人过渡装不计团队毕业。'):'历练随机掉落；团队毕业装备请挑战团队秘境。')+'</p>';
      return '<aside class="map-drop-preview ux-map-compact-loot" aria-label="'+esc((d?.name||'野外')+'掉落预览')+'"><div class="map-drop-title"><span class="eyebrow">战利品预览</span><strong class="quality-text-'+quality+'">'+label+'</strong><span class="loot-tier-tag">'+(raid?'毕业装备':d?'过渡装备':'入门装备')+'</span></div><div class="map-loot-slots ux-map-featured-slots" aria-label="四个代表装备部位">'+slots.slice(0,4).map(cell).join('')+'</div><small class="loot-probability-note">'+(d?'首领各1件 · 优先补缺':'随机掉落 · '+slots.length+'部位装备池')+'</small>'+details('map-drop-'+(d?.id||'field'),'全部部位与材料',extra)+'</aside>';
    }
    function banner(r,d){return '<div class="map-banner-loot"><div class="route-art '+sceneClass(r)+'"><span class="level-tag">'+(d?(d.kind==='raid'?'团队秘境 · 本作10人':'小队秘境 · 5人'):routeLabel(r))+'</span><h3>'+esc(r.name)+'</h3></div>'+compactLoot(d)+'</div>';}
    function detail(route){
      const s=state(),canTravel=unlocked(route),exp=D.EXPANSIONS.find(e=>e.id===route.expansionId),returnRoute=D.ROUTES.find(r=>r.id===route.returnRouteId);
      const inJourney=root.JXProgression.itinerary(s,route.expansionId).some(r=>r.id===route.id),progression=inJourney?'首通推进：击败守关首领后自动前往下一站；最后一站普通团本首通后进入下一资料片。':'此地可自由刷取；切回首通推进可继续主线。';
      const reward='<div class="map-yield-pills"><span>'+icon('coin')+' 银两 +'+route.rewards.silver+'</span><span>修为 +'+route.rewards.exp+'</span><span>守关 · '+esc(route.boss)+'</span></div>';
      const extra='<p>'+esc(route.subtitle)+'<br>'+esc(route.desc)+'</p><p>'+esc(progression)+'</p><h3>此地侠影</h3><div class="encounters">'+route.heroes.map(id=>'<button class="encounter" title="'+esc(meta(id).name)+'" aria-label="查看'+esc(meta(id).name)+'" data-action="dexhero" data-id="'+id+'">'+portrait(meta(id))+'</button>').join('')+'</div>'+c.routeInfo(route);
      return '<section class="panel route-detail">'+banner(route,null)+'<div class="panel-body"><div class="route-detail-heading"><span class="eyebrow">'+esc(exp?.period||exp?.year||'')+' · '+esc(exp?.name||route.region)+'</span><span class="pill">推荐 Lv.'+route.level+'</span></div><div class="route-meta"><span>'+route.steps+' 段路程</span><span>通关 '+(s.clears[route.id]||0)+' 次</span></div>'+reward+(root.JXChapterInfo?.yieldView(s,route,esc)||'')+'<button class="btn primary wide" data-action="travel" data-id="'+route.id+'" '+(!canTravel?'disabled':'')+'>'+(canTravel?(s.routeId===route.id?'继续当前历练':'前往'+esc(route.name)):esc(E.routeRequirement(s,route)))+' '+icon('arrow')+'</button>'+details('mapRouteInfoOpen','侠影、掉落与路线详情',extra)+'</div></section>';
    }
    function dungeonDetail(d){
      const s=state(),exp=D.EXPANSIONS.find(e=>e.id===d.expansionId),normal=d.readiness?.normal||root.JXDungeonRules.readiness(s,d,'normal'),roster=normal.actual.roster||root.JXCombatRules?.dungeonRoster?.(s,{raid:d.kind==='raid'})||[],roleLabel={tank:'承伤',healer:'治疗',dps:'输出'};
      const companions='<div class="map-party-preview" aria-label="实战队伍预览">'+roster.map(h=>'<span class="map-party-member '+(h.npc?'npc':'')+'" title="'+esc(h.name)+'"><span class="map-party-avatar">'+(meta(h.artId||h.id)?portrait(meta(h.artId||h.id)):icon('sword'))+'</span><strong>'+esc(roleLabel[h.role]||'输出')+'</strong><small>'+(h.npc?'人机':h.isSupport?'好友助战':'同行侠客')+'</small></span>').join('')+'</div>';
      const bosses='<div class="map-boss-progress">'+d.bosses.map((b,i)=>{const name=typeof b==='string'?b:b.name,done=(d.record?.modes?.normal?.best||0)>i;return '<span class="'+(done?'done':'')+'">'+(root.JXBossArt?.sprite(name)||'<b>'+String(i+1).padStart(2,'0')+'</b>')+'<small>'+esc(name)+'</small><i>'+(done?'✓':'')+'</i></span>';}).join('')+'</div>';
      const modes=(d.kind==='raid'?['normal','challenge']:['normal']).map(mode=>{const r=d.readiness?.[mode]||root.JXDungeonRules.readiness(s,d,mode),record=d.record?.modes?.[mode],ready=d.unlocked!==false&&r.ready&&!s.battle&&!s.endgame?.active,label=mode==='normal'?'普通':'挑战',reason=s.battle?'当前正在交战':s.endgame?.active?'请先离开百战':d.unlocked===false?d.requirement:r.unmet[0];return '<article class="map-entry-mode '+(ready?'ready':'')+'"><div class="between"><strong>'+label+'难度'+(mode==='challenge'?' · 可选精通':' · 首通路线')+'</strong><small>'+(r.requirements.supplies?r.requirements.supplies+' 补给':'不限次')+' · 已通关 '+(record?.wins||0)+' 次</small></div><p>'+(ready?'✓ 可入场':esc(reason||'完成前置后开放'))+'</p><button class="btn '+(mode==='normal'?'primary ':'')+'wide" data-action="expedition" data-id="'+d.id+'|'+mode+'" '+(!ready?'disabled':'')+'>'+(ready?'援军补位 · 挑战'+label:s.battle?'请先战后整队':'尚未解锁')+'</button>'+(!ready?prepareLink(d,r):'')+(r.unmet.length>1?details('map-entry-'+d.id+'-'+mode,'全部条件 · '+r.unmet.length+' 项待完成','<ul>'+r.unmet.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>'):'')+'</article>';}).join('');
      return '<section class="panel route-detail dungeon-map-detail">'+banner(d,d)+'<div class="panel-body"><div class="route-detail-heading"><span class="eyebrow">'+esc(d.releaseYear||exp.period||exp.year)+' · '+esc(exp.name)+'</span><span class="pill">推荐 Lv.'+normal.requirements.level+'</span></div><div class="map-party-heading"><strong>独自前来也能挑战</strong><span>'+roster.length+' 人作战 · 人机自动补齐职责'+(d.kind==='raid'?' · 本作会战适配':'')+'</span></div>'+(root.JXChapterInfo?.yieldView(s,d,esc)||'')+companions+bosses+'<div class="map-entry-modes">'+modes+'</div>'+details('map-dungeon-source-'+d.id,'副本说明与资料来源','<p>'+esc(d.historyNote||exp.historyScope||'年度代表秘境选编')+'</p><p>'+esc(d.historicalPartySizes?.length?'原作规模 '+d.historicalPartySizes.join('／')+' 人；本作 '+(d.kind==='raid'?'10人会战适配':'5人小队适配'):'原作五人秘境；本作按放置节奏适配')+'</p><p>'+esc(d.lootNote||'完整通关后结算装备与材料。')+'</p><p>'+esc(d.bossListScope||'首领与掉落节奏按放置玩法适配。')+'</p>'+((d.sourceUrls||[]).map((url,i)=>'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">资料来源 '+(i+1)+' ↗</a>').join(' · ')))+'</div></section>';
    }
    function prepareLink(d,r){
      const s=state();
      if(s.battle)return btn('战后整队','formation','','small');
      if(s.endgame?.active)return btn('前往百战并退出','nav','endgame','small');
      if(d.prerequisiteDungeonId&&r.unmet.some(x=>x.includes('先完成本章五人')))return btn('先挑战小队秘境','map-focus-dungeon',d.prerequisiteDungeonId,'small');
      if(r.unmet.some(x=>x.includes('所属资料片')))return btn('查看当前章节','nav','journey','small');
      if(r.unmet.some(x=>x.includes('等级')))return btn('提升主角等级','nav','team','small');
      if(r.unmet.some(x=>/装备|精炼|五彩|五行/.test(x)))return btn('前往整备','nav','equipment','small');
      if(r.unmet.some(x=>x.includes('副本补给')))return btn('野外积累补给','nav','adventure','small');
      return '';
    }
    function focusDungeon(id){const d=D.DUNGEONS.find(d=>d.id===id);if(!d)return {ok:false,message:'未找到这座秘境。'};ui.page='map';ui.region=D.EXPANSIONS.find(e=>e.id===d.expansionId).name;ui.mapExpansion=d.expansionId;ui.mapKind=d.kind==='raid'?'raid':'squad';ui.mapChapter=null;ui.mapSelection='dungeon:'+id;ui.resetMapScroll=true;return {ok:true};}
    function action(action,id){return action==='map-focus-dungeon'?focusDungeon(id):null;}
    function loopPanel(){
      const s=state();
      return '<section class="loop-control"><div class="between"><h3>'+icon('map')+' 历练方式</h3>'+(root.JXJourneyUI?.create(c).modeSwitch()||'')+'</div><p class="loop-mode-intro">推进：首通后自动前往下一站及下一资料片。刷取：反复挑战当前地点。勾选多条路线后，按所选路线循环刷取。</p><div class="loop-options">'+D.ROUTES.filter(unlocked).map(r=>'<label><input type="checkbox" data-change="route-loop" value="'+r.id+'" '+((s.routeLoop||[]).includes(r.id)?'checked':'')+'>'+esc(r.name)+'</label>').join('')+'</div><span class="routeLoop-tag">'+((s.routeLoop||[]).length?'循环 '+s.routeLoop.map(id=>D.ROUTES.find(r=>r.id===id)?.name).join(' → '):(s.autoAdvance?'首通推进 · 通关后自动前进':'定点刷取 · 当前路线'))+'</span></section>';
    }
    return {render,action,focusDungeon};
  }
  root.JXMapUI={create,sceneClass,routeLabel};
})(globalThis);


;
(function(root){
  'use strict';
  const D=root.JXData,E=root.JXEngine,Q=root.JXEquipment,S=root.JXSystems;
  function create(c){
    const {ui,esc,fmt,btn,portrait,meta,roleLabel}=c;
    const state=()=>c.getState();
    const label={rare:'精良',epic:'紫装',legendary:'橙武'};
    const selected=()=>{const s=state();return s.heroes.find(h=>h.uid===s.playerUid)||s.heroes[0];};
    function heroPicker(){const s=state(),h=selected();return '<div class="equipment-roster">'+s.heroes.filter(a=>!s.characterModel||a.uid===s.playerUid).map(a=>'<button class="equip-hero '+(a.uid===h.uid?'active':'')+'" data-action="eq-select" data-id="'+esc(a.uid)+'">'+portrait(meta(a.id))+'<span>'+esc(meta(a.id).name)+'<small>'+roleLabel(E.getRole(a))+' · Lv.'+a.level+'</small></span></button>').join('')+'</div>';}
    function roleSummary(){const counts={tank:0,healer:0,dps:0};for(const uid of state().team){const h=state().heroes.find(x=>x.uid===uid);counts[E.getRole(h)]++;}return '<div class="role-summary"><span class="role-tank">T '+counts.tank+'</span><span class="role-healer">治疗 '+counts.healer+'</span><span class="role-dps">DPS '+counts.dps+'</span><small>推荐 1 T / 1 治疗 / 3 DPS · '+(!counts.tank?'缺少承伤，敌人会攻击其他队员':!counts.healer?'缺少治疗，长战斗更依赖装备与茶肆':'承伤优先接敌，治疗照顾低血队员')+'</small></div>';}
    function heroControls(hero){if(state().characterModel&&hero.uid!==state().playerUid)return '<div class="notice">助战侠客只提升等级；装备、精炼和宝石由主角培养。</div>';const m=meta(hero.id),stats=E.getHeroStats(hero);return '<div class="hero-role-controls"><span>心法 · 各自保存装备与强化</span>'+(m.roles||[m.role]).map(role=>btn(roleLabel(role),'set-role',hero.uid+'|'+role,role===E.getRole(hero)?'primary small':'small')).join('')+btn('查看装备 · 战力 '+fmt(stats.power),'hero-equipment',hero.uid,'small')+'</div>';}
    const statsText=stats=>Object.entries(stats||{}).filter(([,v])=>v).map(([k,v])=>(Q.ATTRIBUTE_NAMES[k]||({atk:'攻击'}[k])||k)+' +'+(v<1?(v*100).toFixed(1)+'%':Math.floor(v))).join(' · ');
    let quickCache={key:null,value:null};
    function quickCosts(costs){
      if(!costs)return '不消耗材料';
      const parts=[];
      if(costs.silver>0)parts.push(fmt(costs.silver)+' 银两');
      for(const [level,n] of Object.entries(costs.stones||{}))if(n>0)parts.push(level+'级石 ×'+n);
      for(const [id,n] of Object.entries(costs.colors||{}))if(n>0)parts.push((Q.COLORS.find(x=>x.id===id)?.name||'五彩石')+' ×'+n);
      return parts.join(' · ')||'不消耗材料';
    }
    function equipmentDetails(id,title,body,open=false,cls=''){
      return '<details class="gui-details '+cls+'" data-equipment-detail="'+esc(id)+'" '+((ui.equipmentOpen?.[id]??open)?'open':'')+'><summary>'+title+'</summary><div class="gui-details-body">'+body+'</div></details>';
    }
    function equipmentArt(item,slot,hero){
      const fallback=root.JXLootUI?.slotIcon(slot||item?.slot,item?.rarity||'empty')||'';
      if(!item||!root.JXPixelIcons?.gear)return fallback;
      const actual={...item,sect:item.sect||(item.slot==='weapon'?meta(hero?.id)?.sect:null)};
      return '<span class="loot-slot-icon quality-'+esc(item.rarity||'rare')+'" aria-hidden="true">'+root.JXPixelIcons.gear(actual)+'</span>';
    }
    function quickActions(h,mode='equipment'){
      const s=state(),key=JSON.stringify([h.uid,h.level,h.stars,h.role,h.equipment,h.enhancements,h.colorStone,h.colorStoneLevel,s.equipment.bag,s.equipment.stones,s.equipment.colors,s.equipment.socketTargetLevel,s.silver,!!s.battle]);
      if(quickCache.key!==key)quickCache={key,value:Q.quickPreview(s,h.uid)};
      const previews=quickCache.value;
      const actions={equip:['一键穿戴','只更换装备，不消耗强化材料'],enhance:['快速强化','先自动镶嵌，再均衡精炼；会消耗下列材料'],refine:['一键精炼','优先提升精炼较低的已穿部位'],socket:['一键镶嵌','自动合成至目标 '+Q.socketTarget(s)+' 级，补齐五行石并匹配五彩石']};
      const action=id=>{const p=previews[id],[name,hint]=actions[id];return '<div class="gui-quick-action"><div>'+(id==='equip'?'':'<strong>'+name+'</strong><p>'+hint+'</p>')+'<small>'+(p.ok?(id==='equip'?'可更换 '+p.changes.length+' 处 · 不消耗材料':'预计消耗：'+esc(quickCosts(p.costs))):esc(p.message))+'</small></div><button class="btn '+(id==='enhance'?'':'primary')+'" data-action="eq-auto-'+id+'" '+(!p.ok?'disabled':'')+'>'+name+'</button></div>';};
      const result=ui.equipmentResult?.uid===h.uid?ui.equipmentResult:null;
      const current=mode==='refine'?'refine':mode==='gems'?'socket':'equip';
      if(mode==='equipment'&&!s.equipment.bag.length&&!Q.heroInfo(s,h.uid).slots.some(slot=>slot.item))return '<section class="equipment-first-step"><div><strong>先获得第一件装备</strong><p>野外首领掉落入门装备，获得后回这里一键穿戴。</p></div>'+btn('前往野外','nav','map','primary')+'</section>';
      return '<section class="quick-equipment gui-quick-equipment" aria-label="一键装备操作">'+action(current)+(mode==='equipment'?'<div class="gui-equipment-links">'+btn('换穿本章装备','eq-current','','small')+btn('兑换缺件','nav','exchange','small')+'</div>'+equipmentDetails('quick-enhance','快速强化与换装规则',action('enhance')+'<p>精炼、五行石与五彩石固定在当前心法装备栏；换装和跨资料片均保留，不同心法分别培养。</p>'):'')+(s.battle?'<p class="quick-battle-note">当前战斗结束并整队后，才可调整装备。</p>':'')+(result?'<div class="quick-result" role="status"><strong>'+esc(result.label)+' · '+esc(result.message)+'</strong><span>本次消耗：'+esc(quickCosts(result.costs))+'</span></div>':'')+'</section>';
    }
    const cleanupFilter=()=>({quality:ui.bagQuality||'all',slots:ui.bagSlots||'all',primary:ui.bagPrimary||'all',secondary:ui.bagSecondary||'all'});
    function inventoryView(s,h,bag,cleanup){
      const goods=D.ITEMS.map(item=>({key:'item:'+item.id,name:item.name,count:s.inventory[item.id]||0,kind:['ore','herb'].includes(item.id)?'materials':'consumables',icon:item.id,rarity:'rare',desc:item.desc,action:'item',id:item.id}));
      const materials=[
        ...Object.entries(s.equipment.stones).filter(([,n])=>n>0).map(([level,count])=>({key:'stone:'+level,name:level+'级五行石',count,kind:'materials',icon:'stones',rarity:Number(level)>=5?'epic':'rare',desc:'用于装备镶嵌与精炼，一键镶嵌时会自动合成至目标等级。',action:'eq-inspect-tab',id:'gems',level})),
        ...Object.entries(s.equipment.colors).filter(([,n])=>n>0).map(([key,count])=>{const [id,level='1']=key.split(':'),color=Q.COLORS.find(x=>x.id===id);return {key:'color:'+key,name:(color?.name||'五彩石')+' · '+level+'级',count,kind:'materials',icon:'colors',rarity:'epic',desc:color?.desc||'武器五彩石。',action:'eq-inspect-tab',id:'gems',level};}),
        ...Object.entries(s.equipment.materials).filter(([,n])=>n>0).map(([name,count])=>({key:'iron:'+name,name,count,kind:'materials',icon:name.includes('玄晶')?'crystal':'ore',rarity:name.includes('玄晶')?'legendary':'epic',desc:'对应年代的神兵铸造材料，可前往神兵页查看配方与产地。',action:'nav',id:'forge'}))
      ];
      const gears=bag.map(item=>({...item,key:'gear:'+item.uid,kind:'equipment',count:1})),all=[...gears,...goods,...materials];
      const category=['equipment','consumables','materials'].includes(ui.bagCategory)?ui.bagCategory:'equipment';
      const slotGroups={all:null,armor:['head','chest','waist','wrist','legs','feet'],weapons:['weapon','ranged'],accessories:['necklace','pendant','ring1','ring2']},slotFilter=slotGroups[ui.bagSlots]===undefined?'all':ui.bagSlots;
      const quality=['rare','epic','legendary'].includes(ui.bagQuality)?ui.bagQuality:'all';
      const visible=all.filter(item=>item.kind===category&&(category!=='equipment'||Q.matchesEquipmentFilter(h,item,cleanupFilter())));
      const selected=visible.find(item=>item.key===ui.bagSelected)||visible[0];
      const art=item=>item.kind==='equipment'?equipmentArt(item,item.slot,h):(root.JXPixelIcons?.item(item.icon)||root.JXVisualUI?.glyph(({medicine:'flask',invite:'scroll',stones:'jade',colors:'jade',crystal:'jade'}[item.icon]||item.icon))||'');
      const categories=[['equipment','装备'],['consumables','消耗道具'],['materials','强化材料']];
      const tabs='<div class="bag-categories" role="group" aria-label="背包分类">'+categories.map(([id,name])=>'<button type="button" data-action="eq-bag-category" data-id="'+id+'" aria-pressed="'+(category===id)+'" class="'+(category===id?'active':'')+'">'+name+'<small>'+all.filter(item=>item.kind===id).length+'</small></button>').join('')+'</div>';
      const attributeFilter=(field,title,values)=>'<div role="group" aria-label="'+title+'"><span>'+title+'</span>'+[['all','全部'],...values.map(key=>[key,Q.ATTRIBUTE_NAMES[key]])].map(([id,name])=>'<button type="button" data-action="eq-bag-'+field+'" data-id="'+id+'" aria-pressed="'+((ui[field==='primary'?'bagPrimary':'bagSecondary']||'all')===id)+'" class="'+((ui[field==='primary'?'bagPrimary':'bagSecondary']||'all')===id?'active':'')+'">'+name+'</button>').join('')+'</div>';
      const filters=category==='equipment'?'<div class="bag-filters" aria-label="装备筛选"><div role="group" aria-label="装备部位">'+[['all','全部'],['armor','防具'],['weapons','兵器'],['accessories','饰品']].map(([id,name])=>'<button type="button" data-action="eq-bag-slots" data-id="'+id+'" aria-pressed="'+(slotFilter===id)+'" class="'+(slotFilter===id?'active':'')+'">'+name+'</button>').join('')+'</div><div role="group" aria-label="装备品质">'+[['all','全品质'],['rare','精良'],['epic','紫装'],['legendary','橙武']].map(([id,name])=>'<button type="button" data-action="eq-bag-quality" data-id="'+id+'" aria-pressed="'+(quality===id)+'" class="'+(quality===id?'active':'')+'">'+name+'</button>').join('')+'</div>'+equipmentDetails('bag-attributes','主属性与副词条筛选',attributeFilter('primary','主属性',['strength','agility','spirit','constitution','vitality'])+attributeFilter('secondary','副词条',['crit','criticalEffect','penetration','strain','haste','toughness','healing','hp','def']))+'</div>':'';
      const cells=visible.map(item=>'<button type="button" class="bag-cell quality-'+item.rarity+(selected?.key===item.key?' is-selected':'')+(!item.count?' is-depleted':'')+'" data-action="eq-bag-select" data-id="'+esc(item.key)+'" aria-pressed="'+(selected?.key===item.key)+'" aria-controls="bag-item-inspector" aria-label="'+esc(item.name+'，'+(item.kind==='equipment'?'等级 '+item.level+'，'+label[item.rarity]: '数量 '+item.count))+'" title="'+esc(item.name)+'">'+art(item)+'<span class="bag-cell-name">'+esc(item.name)+'</span><b class="bag-cell-count">'+(item.kind==='equipment'?'Lv.'+item.level:'×'+fmt(item.count))+'</b></button>').join('');
      const blanks=Array.from({length:Math.max(0,Math.max(12,Math.ceil(visible.length/4)*4)-visible.length)},()=>'<span class="bag-empty-slot" aria-hidden="true"></span>').join('');
      let detail='<p class="bag-empty-message">'+(bag.length&&category==='equipment'?'没有符合筛选条件的装备。':'此分类暂无物品。')+'</p>';
      if(selected){
        const isGear=selected.kind==='equipment',slotName=Q.SLOTS.find(x=>x.id===selected.slot)?.name;
        detail='<div class="bag-inspector-heading">'+art(selected)+'<div><small>'+esc(isGear?slotName+' · '+label[selected.rarity]+' · Lv.'+selected.level:'持有 '+fmt(selected.count))+'</small><h4>'+esc(selected.name)+'</h4></div></div>';
        if(isGear){
          const equipped=h.equipment?.[selected.slot],compatible=(!selected.sect||selected.sect===meta(h.id)?.sect)&&(!selected.schoolSect||selected.schoolSect===meta(h.id)?.sect)&&(!selected.role||selected.role===E.getRole(h));
          detail+='<p class="gear-attributes">'+esc(statsText(Q.itemAttributes(h,selected)))+'</p><p>'+esc((selected.set||Q.ARCHETYPES[selected.archetype]?.name||'散件')+' · '+selected.source)+'</p><p class="bag-comparison">当前穿戴：'+esc(equipped?.name||'此部位空置')+'</p>'+(compatible?'':'<p class="danger-text">当前门派或心法不匹配</p>')+'<div class="bag-inspector-actions"><button class="btn small primary" data-action="eq-equip" data-id="'+esc(selected.uid)+'" '+(s.battle||!compatible?'disabled':'')+'>穿戴装备</button><button class="btn small subtle" data-action="eq-salvage" data-id="'+esc(selected.uid)+'" '+(selected.rarity==='legendary'||selected.locked?'disabled title="橙武或锁定装备不可分解"':'')+'>分解</button>'+btn(selected.locked?'解锁装备':'锁定保留','eq-lock',selected.uid,'small')+'</div>';
        }else detail+='<p>'+esc(selected.desc)+'</p><div class="bag-inspector-actions">'+btn(selected.action==='item'?'查看与使用':selected.id==='gems'?'前往宝石':'查看铸造',selected.action,selected.id,'small primary')+'</div>';
      }
      return '<section class="panel inventory-panel" aria-label="背包"><div class="panel-header"><h3>背包</h3><span class="bag-capacity">装备 '+bag.length+' / 300'+(s.equipment.vault?.length?' · 暂存 '+s.equipment.vault.length+' 件':'')+'</span></div>'+tabs+filters+'<div class="bag-grid" role="group" aria-label="'+categories.find(x=>x[0]===category)[1]+'格子">'+cells+blanks+'</div><p class="bag-grid-hint">点击格子查看详情'+(category==='equipment'?' · '+visible.length+' 件装备':' · 右下角为持有数量')+'</p><section class="bag-item-inspector" id="bag-item-inspector" aria-label="所选物品详情" aria-live="polite">'+detail+'</section>'+(category==='equipment'?'<div class="bag-cleanup"><button class="btn small" data-action="eq-salvage-inferior" '+(!cleanup.ok?'disabled':'')+'>一键分解非提升装备'+(cleanup.count?' · '+cleanup.count+'件':'')+'</button><p class="tiny" role="status">'+esc(cleanup.message)+'</p>'+equipmentDetails('salvage-rules','分解预览与保留规则','<p>按照当前品级、部位、主属性和副词条筛选清理背包与迁移暂存仓库。同等收益也会分解。锁定装备、橙武、已穿和备用心法装备保留；可提升任一职责或推荐套装的装备保留。未穿部位仅保留推荐装备，想收藏的装备请先锁定。</p>'+(cleanup.items.length?'<ul>'+cleanup.items.map(item=>'<li>'+esc(item.name)+' · 一级石 ×'+item.stones+'</li>').join('')+'</ul>':'<p>暂无待分解装备。</p>'))+'</div>':'')+'</section>';
    }
    function equipmentView(){
      const s=state(),h=selected(),info=Q.heroInfo(s,h.uid),bag=Q.inventory(s),stones=Q.stones?Q.stones(s):Object.entries(s.equipment.stones).map(([level,count])=>({level:Number(level),count}));
      const level=Q.socketTarget(s),stat=E.getHeroStats(h),m=meta(h.id),active=['equipment','refine','gems'].includes(ui.equipmentTab)?ui.equipmentTab:'equipment';
      const tabs='<div class="tabs gui-equipment-tabs" role="tablist" aria-label="主角养成分类">'+[['equipment','装备'],['refine','精炼'],['gems','宝石']].map(([id,title])=>'<button class="tab '+(active===id?'active':'')+'" role="tab" id="eq-tab-'+id+'" aria-selected="'+(active===id)+'" aria-controls="eq-pane-'+id+'" data-action="eq-ui-tab" data-id="'+id+'">'+title+'</button>').join('')+btn('武学','hero',h.uid,'small')+'</div>';
      const pane=(id,body)=>'<section class="gui-equipment-pane" role="tabpanel" id="eq-pane-'+id+'" aria-labelledby="eq-tab-'+id+'" '+(active===id?'':'hidden')+'>'+body+'</section>';
      const slotBody=slot=>'<p>'+esc((slot.item.schoolSect?(D.SECTS.find(x=>x.id===slot.item.schoolSect)?.name||'')+' · ':'')+(slot.item.set||Q.ARCHETYPES[slot.item.archetype]?.name||'散件'))+(slot.item.effect?' · 特效：'+esc(slot.item.effect):'')+(slot.compatible===false?'<br><span class="danger-text">当前职责不匹配，特效未生效</span>':'')+'</p><p class="gear-attributes">'+esc(statsText(slot.attributes))+'</p><p>精炼 +'+slot.refine+' · 五行石 '+(slot.sockets.length?slot.sockets.map(n=>n+'级').join(' / '):'未镶嵌')+'（'+slot.sockets.length+'/'+slot.socketCount+'）</p>'+btn('卸下装备','eq-unequip',slot.id,'small subtle');
      const focused=info.slots.find(slot=>slot.id===ui.equipmentSlot)||info.slots.find(slot=>slot.item)||info.slots[0];
      const slotButton=id=>{const slot=info.slots.find(x=>x.id===id),item=slot.item;return '<button type="button" class="paperdoll-slot '+(item?'quality-'+item.rarity:'is-empty')+(focused.id===id?' is-selected':'')+'" data-action="eq-slot" data-id="'+id+'" aria-pressed="'+(focused.id===id)+'" aria-controls="equipment-slot-inspector" aria-label="'+esc(slot.name+'：'+(item?item.name+'，'+label[item.rarity]+'，精炼加'+slot.refine:'空置，查看获取途径'))+'" title="'+esc(slot.name+' · '+(item?item.name:'尚未穿戴'))+'">'+(equipmentArt(item,id,h)||'<span class="paperdoll-fallback" aria-hidden="true">◇</span>')+'<span class="paperdoll-slot-name">'+esc(slot.name)+'</span>'+(item?'<b class="paperdoll-refine" aria-hidden="true">+'+slot.refine+'</b><span class="paperdoll-sockets" aria-label="'+slot.sockets.length+' / '+slot.socketCount+' 孔已镶嵌">'+Array.from({length:slot.socketCount},(_,i)=>'<i class="'+(slot.sockets[i]?'filled':'')+'"></i>').join('')+'</span>':'<span class="paperdoll-vacant">未装备</span>')+'</button>';};
      const side=ids=>'<div class="paperdoll-column">'+ids.map(slotButton).join('')+'</div>';
      const school=D.SECTS.find(x=>x.id===m.sect),actor={...m,uid:h.uid};
      const slots='<div class="equipment-paperdoll" aria-label="角色与十二个装备部位" style="--paperdoll-sect:'+esc(school?.color||'#aac9bd')+'">'+side(['head','chest','waist','wrist','legs','feet'])+'<div class="paperdoll-character"><div class="paperdoll-identity"><span>'+esc(school?.name||'江湖侠客')+' · Lv.'+h.level+'</span><strong>'+esc(h.isPlayer?s.name:m.name)+'</strong><small>'+esc(roleLabel(E.getRole(h)))+'</small></div><div class="paperdoll-aura" aria-hidden="true"></div>'+portrait(actor,'paperdoll-portrait')+'<div class="paperdoll-pedestal" aria-hidden="true"></div><span class="paperdoll-caption">点击装备 · 查看详情</span></div>'+side(['necklace','pendant','ring1','ring2','ranged','weapon'])+'</div>';
      const sameSlot=bag.filter(item=>item.slot===focused.id);
      const inspector='<section class="paperdoll-inspector" id="equipment-slot-inspector" aria-label="'+esc(focused.name)+'装备详情"><div class="paperdoll-inspector-title">'+equipmentArt(focused.item,focused.id,h)+'<div><small>'+esc(focused.name)+(focused.item?' · '+label[focused.item.rarity]+' · Lv.'+focused.item.level:' · 尚未穿戴')+'</small><h3>'+esc(focused.item?.name||'空置装备位')+'</h3></div></div>'+(focused.item?slotBody(focused):'<p class="muted">'+(sameSlot.length?'背包中有 '+sameSlot.length+' 件此部位装备，可展开穿戴。':'野外首领与秘境可掉落此部位装备。')+'</p>'+btn('获取装备','nav','map','small primary'))+(focused.item?'<div class="paperdoll-inspector-actions">'+btn('精炼','eq-inspect-tab','refine','small')+btn('镶嵌','eq-inspect-tab','gems','small')+'</div>':'')+'</section>';
      const cleanup=Q.salvagePreview(s,h.uid,cleanupFilter());
      const bagHtml=inventoryView(s,h,bag,cleanup);
      const sets=info.setBonuses.length?info.setBonuses.map(set=>'<p><strong>'+esc(set.name)+' · '+set.count+'件</strong><br>'+esc(set.desc)+'<br><span class="gold">已激活 '+(set.active.join(' / ')||'无')+' 件效果</span></p>').join(''):'<p class="muted">同套装凑齐后自动获得组合效果。</p>';
      const summary=equipmentDetails('attributes','详细属性与套装效果','<p>当前主属性：'+esc(Q.ATTRIBUTE_NAMES[Q.primaryAttribute(h)])+(['chunyang','tangmen'].includes(m.sect)&&E.getRole(h)==='dps'?' · 本作默认'+(m.sect==='chunyang'?'紫霞功':'天罗诡道'):'')+'</p><p class="equipment-attributes">'+esc(statsText(info.bonuses.attributes)||'暂无装备属性加成')+'</p>'+sets);
      const worn=info.slots.filter(slot=>slot.item);
      const refine='<section class="panel"><div class="panel-header"><h3>精炼已穿装备</h3></div><div class="panel-body gui-enhancement-list">'+(worn.length?worn.map(slot=>{const cap=slot.item.rarity==='legendary'?8:6,need=slot.refine+1,reason=slot.refine>=cap?'已达精炼上限':s.battle?'战后整队后可精炼':s.silver<slot.refineCost||(s.equipment.stones[1]||0)<need?'材料不足':'',disabled=!!reason;return '<article class="gui-enhancement-row"><div><strong>'+esc(slot.item.name)+'</strong><small>'+slot.name+' · 精炼 '+slot.refine+' / '+cap+'</small><p>'+(slot.refine>=cap?'已完成当前装备精炼':'消耗 '+fmt(slot.refineCost)+' 银两 + 一级五行石 ×'+need)+'</p>'+(reason?'<small class="muted">'+reason+'</small>':'')+'</div><button class="btn small" data-action="eq-refine" data-id="'+slot.id+'" '+(disabled?'disabled':'')+'>精炼</button></article>';}).join(''):'<p class="muted">先穿戴装备，再提升精炼。</p>')+'</div></section>';
      const sockets='<section class="panel"><div class="panel-header"><h3>镶嵌进度</h3><span class="muted">目标 '+level+' 级</span></div><div class="panel-body"><p>一键镶嵌会自动三合一补足中间等级，优先补齐最弱孔位。材料不足时用现有低级石补位，高于目标的石头保留。覆盖时原石消耗。</p><div class="gui-enhancement-list">'+(worn.filter(slot=>slot.socketCount).map(slot=>'<article class="gui-enhancement-row"><div><strong>'+esc(slot.item.name)+'</strong><small>'+slot.name+' · '+slot.sockets.length+'/'+slot.socketCount+' 孔 · '+(slot.sockets.map(n=>n+'级').join(' / ')||'尚未镶嵌')+'</small></div><span class="pill">'+Array.from({length:slot.socketCount},(_,i)=>(slot.sockets[i]||0)>=level).filter(Boolean).length+'/'+slot.socketCount+' 达标</span></article>').join('')||'<p class="muted">先穿戴带有镶嵌孔的装备。</p>')+'</div></div></section>';
      const color='<section class="panel"><div class="panel-header"><h3>武器五彩石</h3><span>'+info.colorStatus.active+' / 3 条生效</span></div><div class="panel-body">'+equipmentDetails('color','类型、库存与激活条件',colorView(h,info.colorStatus),true)+'</div></section>';
      const statIcons={power:'star',hp:'heart',atk:'sword',def:'shield'};
      const statRibbon='<div class="paperdoll-stat-ribbon" aria-label="当前角色属性">'+[['power','战力'],['hp','气血'],['atk','攻击'],['def','防御']].map(([key,name])=>'<div class="paperdoll-stat">'+(root.JXPixelIcons?.icon(statIcons[key])||'')+'<span><small>'+name+'</small><strong>'+fmt(stat[key])+'</strong></span></div>').join('')+'</div>';
      return '<div class="gui-equipment-header paperdoll-header">'+statRibbon+'<div>'+btn(s.battle?'预约战后整队':'战后整队','formation','','small')+'</div></div>'+tabs+pane('equipment','<div class="equipment-layout gui-equipment-layout paperdoll-layout"><div><section class="panel paperdoll-panel"><div class="panel-header"><h3>角色装备</h3><span class="paperdoll-equipped-count">'+worn.length+' / '+info.slots.length+' 已穿戴</span></div><div class="panel-body"><div class="paperdoll-preparation">'+quickActions(h,'equipment')+'</div>'+slots+inspector+summary+equipmentDetails('roles','心法与职责',heroControls(h))+'</div></section>'+equipmentDetails('equipment-sources','装备获取路线',root.JXLootUI?.gearGuide(s)||'<p>前往地图或秘境获取装备。</p>')+'</div><aside class="equipment-aside">'+bagHtml+'</aside></div>')+pane('refine',quickActions(h,'refine')+refine)+pane('gems',quickActions(h,'gems')+'<div class="equipment-layout gui-gems-layout"><div>'+stoneView(s,level,stones)+sockets+'</div><aside class="equipment-aside">'+color+'</aside></div>');
    }
    function stoneView(s,level,stones){
      const preview=Q.autoSocket(JSON.parse(JSON.stringify(s)),selected().uid),stock=Array.from({length:8},(_,i)=>{const l=i+1,n=stones.find(x=>Number(x.level)===l)?.count||0;return '<span class="pill">'+l+'级 ×'+fmt(n)+'</span>';}).join('');
      return '<section class="panel stone-workbench"><div class="panel-header"><h3>五行石 · 自动合成镶嵌</h3></div><div class="panel-body"><p>默认全部按六级五行石整备，无需手动合成。库存与银两足够时自动达到设定等级。</p><div class="stone-options" aria-label="五行石库存">'+stock+'</div>'+equipmentDetails('socket-target','默认镶嵌等级 · '+level+'级','<div class="stone-options" role="group" aria-label="默认镶嵌等级">'+[6,7,8].map(l=>'<button class="btn small '+(level===l?'primary':'')+'" data-action="eq-socket-target" data-id="'+l+'" aria-pressed="'+(level===l)+'">'+l+'级</button>').join('')+'</div><p>目标等级按角色存档保存，7—8级需要更多材料与银两。</p>')+'<p class="tiny" role="status">'+esc(preview.message)+'</p></div></section>';
    }
    root.document?.addEventListener('toggle',event=>{const el=event.target;if(!el?.isConnected)return;if(el.hasAttribute('data-color-detail')){ui.colorOpen??={};ui.colorOpen[el.dataset.colorDetail]=el.open;}if(el.hasAttribute('data-equipment-detail')){ui.equipmentOpen??={};ui.equipmentOpen[el.dataset.equipmentDetail]=el.open;}},true);
    function colorView(hero,status){
      const current=Q.COLORS.find(x=>x.id===hero.colorStone),scale=1+((status.level||1)-1)*.22;
      const traits=current?.attributes||[];
      return '<div class="color-status color-showcase"><div class="color-gem" aria-hidden="true">◆</div><h4>武器五彩石 · '+status.active+'/3 条生效</h4><strong>'+esc(current?.name||'尚未熔嵌')+(hero.colorStone?' · '+(hero.colorStoneLevel||1)+'级':'')+'</strong><p>全身已镶 '+status.count+' 颗五行石 · 等级总和 '+status.total+'</p><div class="color-traits">'+status.thresholds.map((x,i)=>'<article class="'+(status.active>i?'active':'')+'"><b>'+(status.active>i?'◆ 已激活':'◇ 待激活')+'</b><span>'+esc(traits[i]?statsText({[traits[i][0]]:traits[i][1]*scale}):'第'+(i+1)+'条属性')+'</span><small>需要 '+x.count+' 颗石头 / 等级总和 '+x.total+'</small></article>').join('')+'</div><p class="tiny muted">'+esc(status.note)+'</p><h4>选择五彩石类型</h4><div class="color-catalog">'+Q.COLORS.map(color=>{const stock=Array.from({length:6},(_,i)=>{const level=i+1,key=level===1?color.id:color.id+':'+level,n=state().equipment.colors[key]||0;return n?btn(level+'级 ×'+n,'eq-color',key,'small'):'';}).join('');return '<details class="color-option '+(color.id===hero.colorStone?'selected':'')+'" data-color-detail="'+color.id+'" '+((ui.colorOpen?.[color.id]??!!(stock||color.id===hero.colorStone))?'open':'')+'><summary><strong>'+esc(color.name)+'</strong><small>'+esc(color.desc)+'</small></summary><div>'+esc(color.attributes.map(([key,n])=>statsText({[key]:n})).join(' · '))+'</div>'+(stock||'<small class="muted">暂无库存 · 通过秘境或侠名兑换</small>')+'</details>';}).join('')+'</div>'+btn('侠名兑换五彩石','nav','exchange','small')+'</div>';
    }
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
    function dungeonTeam(d){
      const roster=d.readiness?.normal?.actual?.roster||root.JXCombatRules.dungeonRoster(state(),{raid:d.kind==='raid'}),npc=roster.filter(h=>h.npc).length;
      return '<section class="dungeon-team-preview" aria-label="副本参战队伍"><div class="between"><strong>'+roster.length+'人队伍 · '+(npc?'人机补位 '+npc+' 人':'同行侠客已就位')+'</strong><small>无需在线组队</small></div><div class="dungeon-team-slots">'+roster.map(h=>{const m=meta(h.id)||{...h,artId:h.artId};return '<article class="dungeon-fighter '+(h.npc?'is-npc':'')+'">'+portrait(m)+'<strong>'+({tank:'承伤',healer:'治疗',dps:'输出'}[h.role]||'输出')+'</strong><small>'+esc(h.npc?'人机':h.isSupport?'好友':h.name)+'</small></article>';}).join('')+'</div></section>';
    }
    function dungeonsView(){
      const s=state(),list=S.expansionDungeons(s);
      return '<div class="dungeon-path"><span>野外整备</span><b>→</b><span>5人小队 · 20补给</span><b>→</b><span>10人团队 · 35补给</span><strong>单人可玩 · 人机自动补位</strong><small>补给 '+Math.floor(s.progression.supplies||0)+' / 240</small></div>'+btn('侠名兑换整备','nav','exchange','small')+btn('战后整队','formation','','small')+'<div class="expansion-dungeons">'+list.map(d=>{
        const exp=D.EXPANSIONS.find(x=>x.id===d.expansionId),modes=d.kind==='dungeon'?['normal']:['normal','challenge'];
        const gallery=d.bosses.map((name,i)=>'<div class="dungeon-boss-tile">'+(root.JXBossArt?.sprite(name)||'')+'<small>'+(i+1)+'. '+esc(name)+'</small><small>弱点 '+JXCombatRules.weaknesses({name}).map(esc).join(' / ')+'</small></div>').join('');
        return '<article class="panel dungeon-card"><div class="dungeon-card-banner"><div class="dungeon-art '+JXMapUI.sceneClass(d)+'" role="img" aria-label="'+esc(d.name)+'场景"></div>'+(root.JXLootUI?.drops(s,d)||'')+'</div><div class="panel-header"><div><span class="eyebrow">'+esc(d.releaseYear||exp.period||exp.year)+' · '+esc(exp.name)+'</span><h3>'+esc(d.name)+'</h3></div><span class="pill">'+(d.kind==='dungeon'?'五人小队':'本作十人会战 · 5+5')+' · '+d.bosses.length+' 位首领</span></div><div class="panel-body">'+dungeonTeam(d)+'<div class="dungeon-boss-gallery">'+gallery+'</div><div class="dungeon-loot"><span>套装 · '+esc(d.setName)+'</span>'+(d.materialDrop===false?'<span>入门秘境 · 不产出玄晶与陨铁</span>':'<span>大铁 · '+esc(d.bigIron)+'</span><span>小铁 · '+esc(d.smallIron)+'</span>')+'</div><p class="tiny muted">'+esc(d.requirement)+'</p><div class="dungeon-modes">'+modes.map(mode=>{
          const r=d.readiness?.[mode],record=d.record?.modes?.[mode],ready=d.unlocked&&r?.ready&&!s.battle,label=mode==='challenge'?'挑战':'普通';
          return '<section class="dungeon-mode"><div class="between"><strong>'+label+'难度</strong><small>通关 '+(record?.wins||0)+' 次 · 最深 '+(record?.best||0)+'/'+d.bosses.length+'</small></div>'+(d.unlocked?r?.unmet?.length?'<ul>'+r.unmet.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul>':'<p>整备达标，可进行完整首领挑战。</p>':'<p>完成前置历程后开放。</p>')+'<button class="btn small '+(mode==='challenge'?'primary':'')+'" data-action="expedition" data-id="'+d.id+'|'+mode+'" '+(!ready?'disabled':'')+'>'+(s.battle?'请先战后整队':ready?'进入'+label:label+' · 尚未达标')+'</button></section>';
        }).join('')+'</div>'+equipmentDetails('dungeon-source-'+d.id,'掉落说明与取材','<p>'+esc(d.historyNote||exp.historyScope||'年度代表秘境选编')+'</p><p>'+esc(d.historicalPartySizes?.length?'原作规模 '+d.historicalPartySizes.join('／')+' 人；本作 '+(d.kind==='raid'?'10人会战适配':'5人小队适配'):'本作自设五人训练关卡')+'</p><p>'+esc(d.lootNote)+'<br>'+esc(d.bossListScope)+'</p>'+sourceLinks(d.sourceUrls))+'</div></article>';
      }).join('')+'</div>';
    }
    function sourceLinks(urls){return urls?.length?'<div class="source-links">'+urls.map((url,i)=>'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">资料来源 '+(i+1)+' ↗</a>').join('')+'</div>':'';}
    function routeInfo(route){const exp=D.EXPANSIONS?.find(x=>x.id===route.expansionId);return exp?equipmentDetails('route-source-'+route.id,'资料片与取材','<div class="era-note"><strong>'+esc(exp.period||exp.year)+' · '+esc(exp.name)+'</strong><span>原作等级时代 '+esc(exp.levelCap||exp.era)+' · '+JXMapUI.routeLabel(route)+'</span><p>'+esc(exp.desc)+' '+esc(exp.historyScope)+'</p>'+sourceLinks(route.sourceUrls||exp.sourceUrls)+'</div>'):'';}
    function worldSummary(){return '<div class="notice">当前内容：'+D.SECTS.filter(x=>x.kind!=='school').length+' 门派 + 无相楼流派 · '+D.HEROES.length+' 位可养成侠客 · '+D.EXPANSIONS.length+' 个年度资料片章节 · '+D.ROUTES.length+' 张探索地图 · '+D.DUNGEONS.length+' 个秘境。兵器破招与端游伤害属性分开记录。历年内容采用代表地图与首领，不是原游戏全部地图的逐项复刻。</div>';}
    function action(action,id){const s=state(),h=selected();
      if(action==='eq-bag-category'){if(['equipment','consumables','materials'].includes(id)){ui.bagCategory=id;ui.bagSelected=null;}return null;}
      if(action==='eq-bag-select'){ui.bagSelected=id;return null;}
      if(action==='eq-bag-slots'){if(['all','armor','weapons','accessories'].includes(id))ui.bagSlots=id;return null;}
      if(action==='eq-bag-primary'){if(['all','strength','agility','spirit','constitution','vitality'].includes(id))ui.bagPrimary=id;return null;}
      if(action==='eq-bag-secondary'){if(['all','crit','criticalEffect','penetration','strain','haste','toughness','healing','hp','def'].includes(id))ui.bagSecondary=id;return null;}
      if(action==='eq-lock')return Q.toggleLock(s,id);
      if(action==='eq-socket-target'){quickCache.key=null;return Q.setSocketTarget(s,Number(id));}
      if(action==='eq-bag-quality'){if(['all','rare','epic','legendary'].includes(id))ui.bagQuality=id;return null;}
      if(action==='eq-ui-tab'||action==='eq-inspect-tab'){if(['equipment','refine','gems'].includes(id))ui.equipmentTab=id;return null;}
      if(action==='eq-slot'){if(Q.SLOTS.some(slot=>slot.id===id))ui.equipmentSlot=id;return null;}
      if(action==='eq-select'){ui.equipmentHero=id;ui.equipmentResult=null;return null;}
      if(action==='eq-stone'){ui.stoneLevel=Number(id);ui.stoneQuantity=1;return null;}
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
      if(action==='eq-fuse-to'){const [target,quantity]=id.split('|').map(Number);return Q.fuseTo(s,target,quantity);}
      if(action==='eq-salvage')return Q.salvage(s,id);
      if(action==='eq-salvage-inferior'){const r=Q.salvageInferior(s,h.uid,cleanupFilter());ui.equipmentResult={...r,uid:h.uid,label:'一键分解'};quickCache.key=null;return r;}
      if(action==='forge-step'){const r=Q.forgeStep(s,h.uid,id);if(r.log)c.report('神兵试炼',r);return r;}
      if(action==='expedition'){const [dungeonId,difficulty='normal']=id.split('|');const r=S.challengeExpansionDungeon(s,dungeonId,Math.random,difficulty);if(r.ok)c.report(D.DUNGEONS.find(x=>x.id===dungeonId)?.name||'秘境战报',r);return r;}
      return null;
    }
    return {roleSummary,heroControls,equipmentView,forgeView,dungeonsView,routeInfo,worldSummary,action};
  }
  root.JXExpansionUI={create};
})(globalThis);

;
(function(root){
  'use strict';
  function create(c){
    const {esc,fmt,btn,ui}=c,P=root.JXProgression,Q=root.JXEquipment,D=root.JXData,E=root.JXEngine;
    const state=()=>c.getState();
    function exchangeSelection(){const s=state(),current=P.current(s),h=s.heroes.find(h=>h.uid===s.playerUid)||s.heroes[0],chapter=P.isExpansionUnlocked(s,ui.exchangeChapter)?ui.exchangeChapter:current.expansion.id;return {s,current,h,chapter};}
    if(root.document)root.document.addEventListener('toggle',event=>{const key=event.target.dataset?.progressionDetail;if(key)ui[key]=event.target.open;},true);
    function details(key,label,content){return '<details class="gui-details" data-progression-detail="'+key+'" '+(ui[key]?'open':'')+'><summary>'+label+'</summary><div class="gui-details-body">'+content+'</div></details>';}
    function exchange(){
      const {s,current,h,chapter}=exchangeSelection();
      const offers=Q.exchangeOffers(s).filter(x=>x.expansionId===chapter);
      return '<section class="journey-summary"><div><span class="eyebrow">侠名补齐 · 明码兑换</span><strong>现有侠名 '+fmt(s.renown)+'</strong><small>套装缺件、神兵小铁与强化材料均可定向兑换。</small></div>'+btn('查看毕业清单','nav','journey','small')+'</section><div class="exchange-controls"><label>资料片 <select class="select" data-change="exchange-chapter">'+D.EXPANSIONS.filter((_,i)=>i<=current.index).map(e=>'<option value="'+e.id+'" '+(e.id===chapter?'selected':'')+'>'+esc(e.name)+'</option>').join('')+'</select></label><label>装备领取侠客 <select class="select" data-change="exchange-hero">'+s.heroes.filter(a=>!s.characterModel||a.uid===s.playerUid).map(a=>'<option value="'+a.uid+'" '+(a.uid===h.uid?'selected':'')+'>'+esc(D.HEROES.find(m=>m.id===a.id).name)+'</option>').join('')+'</select></label><label>份数 <select class="select" data-change="exchange-quantity">'+[1,2,5,10].map(n=>'<option '+(n===(ui.exchangeQuantity||1)?'selected':'')+'>'+n+'</option>').join('')+'</select></label></div><p class="muted">装备收入背包，武器匹配所选侠客。兑换与换装前请先战后整队。换装和跨资料片均保留当前心法装备栏的精炼、五行石与五彩石。</p><div class="exchange-grid">'+offers.map(o=>{const qty=ui.exchangeQuantity||1,cost=o.cost*qty;return '<article class="panel exchange-offer"><span class="eyebrow">'+({gear:'指定部位',set:'六件套',iron:'神兵材料',stones:'五行石',color:'五彩石',silver:'行路补给'}[o.kind]||'装备兑换')+'</span><h3>'+esc(o.name)+'</h3><p>'+esc(o.description||'')+'</p><strong>'+cost+' 侠名 · '+qty+' 份</strong><button class="btn small primary" data-action="renown-exchange" data-id="'+esc(o.id)+'" '+(!o.available||s.renown<cost?'disabled':'')+'>'+(s.renown<cost?'侠名不足':!o.available?esc(o.reason):'兑换')+'</button></article>';}).join('')+'</div>';
    }
    function action(action,id){const s=state();if(action==='journey-source'){const t=P.target(s,id),d=id==='player-gear'?root.JXLootUI?.raid(s):t.dungeonId?D.DUNGEONS.find(d=>d.id===t.dungeonId):null;if(d){ui.page='map';ui.region=D.EXPANSIONS.find(e=>e.id===d.expansionId).name;ui.mapExpansion=d.expansionId;ui.mapKind=d.kind==='raid'?'raid':'squad';ui.mapSelection='dungeon:'+d.id;ui.resetMapScroll=true;}else{ui.page=t.page;if(t.routeId){ui.region=P.current(s).expansion.name;ui.mapExpansion=P.current(s).expansion.id;ui.mapKind='all';ui.mapSelection=t.routeId;ui.resetMapScroll=true;}}return {ok:true};}if(action==='journey-attempt'){const r=P.attempt(s,id);ui.journeyResult={...r,log:r.log||[r.message]};if(r.ok){ui.page=r.page;if(r.log&&id!=='all')c.report?.('历程尝试',r);}return r;}if(action==='chapter-advance'){const r=P.advance(s);if(r.ok){ui.exchangeChapter=null;ui.page='journey';}return r;}if(action==='renown-exchange'){return Q.exchange(s,id,ui.exchangeQuantity||1,exchangeSelection().h.uid);}return null;}
    const product=root.JXJourneyUI?.create(c);
    return {summary:product.summary,nextStep:product.nextStep,journey:product.journey,exchange,action:(a,id)=>product?.action(a,id)||action(a,id),gearGuide:()=>root.JXLootUI?.gearGuide(state())||''};
  }
  root.JXProgressionUI={create};
})(globalThis);

;
(function(root){
  'use strict';
  function create(c){
    const P=root.JXProgression,D=root.JXData,E=root.JXEngine,Q=root.JXEquipment;
    const {esc,btn}=c,state=()=>c.getState(),icon=name=>root.JXPixelIcons?.icon(name)||'';
    const done=(s,r)=>r.done??!!(s.badges.includes(r.id)||s.clears[r.id]||r.dungeonId&&s.equipment?.dungeons?.[r.dungeonId]?.modes?.normal?.wins);
    function modeSwitch(){const s=state(),mode=P.objective(s).mode;return '<div class="journey-mode-switch" role="group" aria-label="历练模式">'+[['progress','arrow','首通推进'],['farm','clock','刷取装备']].map(([id,ic,label])=>'<button class="btn '+(mode===id?'active':'')+'" data-action="journey-mode" data-id="'+id+'" aria-pressed="'+(mode===id)+'">'+icon(ic)+label+'</button>').join('')+'</div>';}
    function track(expansionId){const s=state(),nodes=P.itinerary(s,expansionId);return '<div class="journey-route-track" aria-label="首次通关路线">'+nodes.map((r,i)=>{const cleared=done(s,r),active=r.id===s.routeId,open=E.routeUnlocked(s,r),label=cleared?'✓ 已首通':active?'▶ 正在历练':open?'下一站可前往':'首通前站解锁';return '<button class="journey-route-node '+(active?'current ':cleared?'done ':'')+(!open?'locked':'')+'" data-action="journey-inspect" data-id="'+r.id+'" '+(active?'aria-current="step"':'')+' aria-label="'+esc(r.name+'，'+label)+'"><span class="route-node-number">'+(cleared?'✓':String(i+1).padStart(2,'0'))+'</span><span class="route-thumb '+(r.sceneId?'scene-'+r.sceneId:'')+'" aria-hidden="true"></span><span class="route-node-copy"><small>'+esc(r.dungeonId?(D.DUNGEONS.find(d=>d.id===r.dungeonId)?.historicalKind==='raid'?'团队秘境':'五人秘境'):'山河历练')+'</small><strong>'+esc(r.name)+'</strong><span class="route-node-status">'+label+'</span></span></button>';}).join('')+'</div>';}
    function summary(){const s=state(),o=P.objective(s),p=P.current(s);return '<section class="journey-summary gui-journey-summary"><div><span class="eyebrow">第 '+(p.index+1)+' / '+D.EXPANSIONS.length+' 部 · 上限 Lv.'+p.levelCap+'</span><strong>'+esc(p.expansion.name)+'</strong><small>首通 '+o.cleared+' / '+o.total+' · '+(o.mode==='progress'?'自动推进':'重复刷取')+'</small></div>'+btn('完整路线','nav','journey','small')+'</section>';}
    function nextStep(){const s=state(),o=P.objective(s),r=o.mode==='farm'?E.getRoute(s):o.route,finished=s.progression.finished;return '<section class="journey-current-goal gui-goal" aria-label="当前目标"><div class="goal-picture" aria-hidden="true"><span class="route-thumb '+(r?.sceneId?'scene-'+r.sceneId:'')+'"></span></div><div class="gui-goal-copy"><span class="eyebrow">'+(o.mode==='farm'?'正在刷取 · 随时切换推进':finished?'山河尽览':'首通之路 · '+o.cleared+' / '+o.total)+'</span><strong>'+esc(finished?'历代江湖已通关':o.label||r?.name||'继续江湖历练')+'</strong><p>'+esc(o.detail||'自动战斗、优装自动穿戴；首通后前往下一站。')+'</p></div>'+btn(finished?'重访秘境':o.mode==='farm'?'继续首通推进':s.running?'查看路线':'出发历练',finished?'nav':o.mode==='farm'?'journey-mode':s.running?'journey-inspect':'journey-resume',finished?'map':o.mode==='farm'?'progress':s.running?r.id:'','primary')+'</section>';}
    function overview(expansionId){const s=state(),e=D.EXPANSIONS.find(x=>x.id===expansionId)||P.current(s).expansion,nodes=P.itinerary(s,e.id),cleared=nodes.filter(r=>done(s,r)).length;return '<section class="journey-map-overview" aria-label="资料片通关路线"><div class="journey-product-heading"><div><span class="eyebrow">首次通关路线 · '+cleared+' / '+nodes.length+'</span><h2>'+esc(e.name)+'</h2></div>'+modeSwitch()+'</div>'+track(e.id)+'</section>';}
    function journey(){const s=state(),p=P.current(s),o=P.objective(s),info=P.checklist(s),next=D.EXPANSIONS[p.index+1],optional=info.items.filter(x=>x.optional||!['five','routes'].includes(x.id));
      const optionalCards=[['hammer','装备精炼','套装、五行石与五彩石提升战力','equipment'],['tower','挑战秘境','额外挑战，追求更高装备与珍藏','dungeons'],['people','侠影收藏','辅助卡、门派羁绊与好感','team']].map(([ic,title,desc,id])=>'<article class="panel">'+icon(ic)+'<div><h3>'+title+'</h3><p>'+desc+'</p>'+btn('前往','nav',id,'small')+'</div></article>').join('');
      const optionalDetails='<div class="journey-checklist">'+optional.map(item=>'<article class="journey-check '+(item.done?'done':'')+'"><h3>'+(item.done?'✓ ':'')+esc(item.label)+'</h3><p>'+esc(item.detail)+'</p><span>'+item.value+' / '+item.target+'</span>'+btn('查看','journey-source',item.id,'small')+'</article>').join('')+'</div>';
      const timeline=D.EXPANSIONS.map((e,i)=>'<span class="'+(i===p.index?'current':i<p.index?'done':'')+'">'+(i<p.index?'✓ ':String(i+1).padStart(2,'0')+' · ')+esc(e.name)+'<small>'+esc(e.period||e.year)+' · '+(i<p.index?'已通关':i===p.index?'进行中':'待开启')+'</small></span>').join('');
      return '<div class="journey-product"><header class="journey-product-heading"><div><span class="eyebrow">山河历程 · 第 '+(p.index+1)+' 部</span><h2>'+esc(p.expansion.name)+'</h2><small>按图首通，逐站向前</small></div>'+modeSwitch()+'</header>'+nextStep()+'<section class="panel"><div class="journey-product-heading"><h3>本部通关路线</h3><small>'+o.cleared+' / '+o.total+' 站首通</small></div>'+track(p.expansion.id)+'<div class="journey-quick-stats"><span>'+icon('sword')+'自动战斗</span><span>'+icon('hammer')+'优装自动穿戴</span><span>'+icon('people')+'秘境援军补齐</span><span>'+icon('arrow')+'普通通关即前进</span></div></section><section class="panel graduation"><div class="journey-product-heading"><div><span class="eyebrow">'+(s.progression.finished?'山河尽览':'下一部资料片')+'</span><h3>'+esc(s.progression.finished?'全部资料片已通关':next?.name||'最后一程')+'</h3><p class="muted">'+esc(o.canAdvance||info.ready?'普通路线已首通，可继续下一部。':'通关上方路线开放下一部资料片。')+'</p></div><button class="btn primary" data-action="chapter-advance" '+(!info.ready||s.battle||info.finished?'disabled':'')+'>'+(info.finished?'已通关':info.ready?'开启下一部':'首通后开启')+'</button></div></section><div><div class="journey-product-heading"><h3>继续变强</h3><small>可选追求 · 随时回头完成</small></div><div class="journey-optional-grid">'+optionalCards+'</div></div><details class="gui-details"><summary>装备精通进度 · '+optional.filter(x=>x.done).length+' / '+optional.length+'</summary><div class="gui-details-body">'+optionalDetails+'</div></details><details class="gui-details"><summary>历代资料片 · '+(p.index+1)+' / '+D.EXPANSIONS.length+'</summary><div class="gui-details-body chapter-timeline">'+timeline+'</div></details></div>';
    }
    function inspect(id){const s=state(),r=D.ROUTES.find(r=>r.id===id);if(!r)return {ok:false,message:'未找到路线。'};const ui=c.ui,d=r.dungeonId&&D.DUNGEONS.find(d=>d.id===r.dungeonId);ui.page='map';ui.region=D.EXPANSIONS.find(e=>e.id===r.expansionId)?.name||r.region;ui.mapExpansion=r.expansionId;ui.mapChapter=null;ui.mapKind='all';ui.mapSelection=d?'dungeon:'+d.id:r.id;ui.resetMapScroll=true;return {ok:true};}
    function action(action,id){const s=state();if(action==='journey-mode'){const r=P.setMode(s,id);if(r.ok&&id==='progress'){s.running=true;c.ui.page='adventure';}return r;}
      if(action==='journey-inspect')return inspect(id);
      if(action==='journey-resume'){if(s.endgame?.active){c.ui.page='endgame';return {ok:true,message:'请先离开百战，再继续主线。'};}const r=P.setMode(s,'progress');if(r.ok){s.running=true;c.ui.page='adventure';}return r;}return null;
    }
    return {summary,nextStep,journey,overview,track,modeSwitch,action};
  }
  root.JXJourneyUI={create};
})(globalThis);

;
(function(root){
 'use strict';
 function create({getState,ui,esc,fmt,btn}){
  function player(s){return s.heroes.find(h=>h.uid===s.playerUid)||s.heroes[0];}
  function visualItem(item){return root.JXCosmetics?.catalog(getState()).find(x=>x.id===item.id);}
  function art(item){const v=visualItem(item);if(v?.type==='hair')return '<span class="pill">发型拓影</span>';return v?root.JXCosmetics.art(v):'';}
  function visualNote(item){const v=visualItem(item);return v&&v.type!=='hair'?'<small>图素造型 · '+esc(v.visualName)+'</small>':'';}
  function isWearing(s,item){const h=player(s);return root.JXCosmetics?root.JXCosmetics.appearance(s,h.uid)?.[item.type]===item.id:!!item.wearing;}
  function wearButton(s,item){const h=player(s),wearing=isWearing(s,item);return root.JXCosmetics?btn(wearing?'收起展示':'为主角展示',wearing?'cosmetic-clear':'cosmetic-equip',h.uid+'|'+(wearing?item.type:item.id),'small primary'):btn(wearing?'收起展示':'展示收藏','endgame-wear',item.id,'small primary');}
  function collectionView(id){
   const s=getState(),G=root.JXEndgame,items=id==='event-only'?G.collection(s).filter(x=>x.event):G.collection(s,id);
   return '<section class="panel endgame-overview hidden-collection"><div class="between"><div>'+(id==='event-only'?'<span class="eyebrow">花萼楼 · 签到珍藏</span><h2>灯火相随</h2>':'<span class="eyebrow">毕业后解锁 · 旧章珍藏</span><h2>秘藏与跟宠</h2>')+'</div>'+btn('前往角色外观','nav','cosmetics','small')+'</div>'+(id==='event-only'?'<p>每日签到有机会收藏纪念背挂；累计30签必得。获得后可为角色展示。</p>':'<p>每章毕业后，重访本章百战有机会获得隐藏收藏。每100胜额外获得80本章通宝；各版本通宝独立积累。</p>')+'<div class="relic-grid">'+items.map(x=>'<article class="relic-card '+(x.owned?'owned':'missing')+' '+(x.type==='hair'?'relic-mythic':'')+'">'+art(x)+'<span class="eyebrow">'+esc(x.rarity)+' · '+({pet:'跟宠',pendant:'挂件',hair:'发型'}[x.type])+'</span><h3>'+esc(x.name)+'</h3>'+visualNote(x)+'<p>'+esc(x.description)+'</p>'+(x.event?'<small>花萼楼签到珍藏</small>':'<small>'+esc(x.reason||'已取得获取资格')+'<br>每胜 '+(x.rate*100).toFixed(x.type==='hair'?4:2)+'% · '+fmt(x.cost)+' 本章通宝</small>')+(x.owned?wearButton(s,x):'<strong class="muted">尚未收藏</strong>')+(isWearing(s,x)?'<span class="gold">◆ '+(x.type==='pet'?'主角正在跟随':'主角正在展示')+'</span>':'')+'</article>').join('')+'</div><p class="tiny muted">历史收藏名与获取条件沿用本作设定；实际图素造型以卡片标注为准。五红是发型收藏，不属于挂件。外观不提高战力，不作为毕业条件。</p></section>';
  }
  function checkIn(){const s=getState(),G=root.JXEndgame,t=G.checkInInfo(s);return '<section class="checkin-hero panel"><span class="eyebrow">花萼楼 · 每日签到</span><h2>今日入江湖，赠君一份好礼</h2><p>每天点击一次即可领取。北京时间零点刷新；离线不补签。</p><div class="checkin-stats"><span>累计 <b>'+t.total+'</b> 天</span><span>连续 <b>'+t.streak+'</b> 天</span><span>当前资料片 <b>'+esc(t.expansion.name)+'</b></span></div><button class="btn primary" data-action="tea" data-id="checkin" '+(t.claimed?'disabled':'')+'>'+(t.claimed?'今日已签到 · 明日再会':'领取今日签到礼')+'</button><p class="tiny">固定：银两 '+fmt(500+root.JXProgression.current(s).index*150)+'、侠名 '+(20+root.JXProgression.current(s).index*5)+'、修为丹×2、结交帖×1、一级五行石×15、副本补给+20。</p></section><div class="checkin-week">'+Array.from({length:7},(_,i)=>'<article class="panel '+(i<t.total%7?'done':'')+'"><span>第 '+(i+1)+' 签</span><b>'+(i===6?'本章团队紫装':'行路好礼')+'</b><small>'+(i===6?'每累计7签保底一件':'免费领取 · 不收茶资')+'</small></article>').join('')+'</div><section class="panel endgame-overview"><h3>惊喜奖励一览</h3><p>每次签到额外20%获得当前资料片五人层级紫装，2%获得「丹心引路·忆影」；同一次随机赠礼只取其一。每累计7签保底当前资料片团队层级紫装，每累计30签保底纪念挂件。背包满时先整理，奖励不会被吞。</p><p class="tiny muted">奖励按本作放置节奏设计。五红、毕业秘藏与本章奢品不进入签到奖池。</p>'+(t.lastReward?'<div class="checkin-receipt"><strong>最近一次领取</strong><p>'+esc(t.lastReward)+'</p></div>':'')+'</section>'+collectionView('event-only');}
  function render(){const s=getState(),G=root.JXEndgame,g=G.init(s),chapters=G.info(s),c=chapters.find(c=>c.id===ui.endgameChapter)||chapters.find(c=>c.id===g.active?.expansionId)||chapters[root.JXProgression.current(s).index],r=c.record,h=s.heroes.find(h=>h.uid===s.playerUid)||s.heroes[0],next=c.bosses[r.index%c.bosses.length],active=g.active?.expansionId===c.id;
   return '<section class="journey-summary"><div><span class="eyebrow">历代首领 · 长期收集</span><strong>百战异闻录 · '+esc(c.name)+'</strong><small>每分钟挑战一位首领 · 胜利获得 8 '+esc(c.currencyName)+' · 离线最多八小时</small></div>'+btn(active?'离开百战':'开始挂机',active?'endgame-stop':'endgame-start',c.id,'primary')+'</section><div class="endgame-controls"><label>资料片 <select class="select" data-change="endgame-chapter">'+chapters.map(x=>'<option value="'+x.id+'" '+(c.id===x.id?'selected':'')+'>'+esc(x.name)+(x.unlocked?'':' · 未开放')+'</option>').join('')+'</select></label><label>主角装备领取 <select class="select" data-change="exchange-hero">'+s.heroes.filter(a=>!s.characterModel||a.uid===s.playerUid).map(a=>'<option value="'+a.uid+'" '+(a.uid===h.uid?'selected':'')+'>'+esc(root.JXData.HEROES.find(m=>m.id===a.id).name)+'</option>').join('')+'</select></label></div>'+
    '<div class="endgame-grid"><section class="panel endgame-overview"><span class="eyebrow">'+(active?(s.running?'正在挂机':'已暂停'):'回忆入口')+'</span><h2>'+esc(next?.name||'江湖回忆')+'</h2><p>'+(c.ready?'已完成五人试炼，可循环挑战。':'先通关本章五人试炼，开放本章百战。')+'</p><div class="endgame-metrics"><span><b>'+fmt(r.currency)+'</b>'+esc(c.currencyName)+'</span><span><b>'+r.wins+' / '+r.runs+'</b>胜利 / 挑战</span></div><div class="bar"><span style="width:'+(active?g.active.elapsed/60*100:0)+'%"></span></div><p class="tiny muted">失败带回精铁；不会扣去既有积累。收集品不作为开启下一章的前置条件。</p></section><section class="panel endgame-overview"><h3>隐侠与珍藏</h3><p>'+c.heroes.map(id=>{const m=root.JXData.HEROES.find(x=>x.id===id);return (r.claimedHeroes.includes(id)?'✓ ':'◇ ')+esc(m.name)+' · '+esc(m.placement?.location||c.name)+(G.eligible(s,id)?'':'（先通关对应普通秘境）');}).join('<br>')+'</p>'+(c.heroes.length?'<p>下一位隐侠保底：'+Math.min(r.heroPity,80)+' / 80 胜</p><div class="bar"><span style="width:'+Math.min(100,r.heroPity/80*100)+'%"></span></div>':'<p>本章以珍藏和装备为主；本门名侠请前往门派试炼结缘。</p>')+'<p>挂件保底：'+(g.pendants.includes(c.id)?'已收藏':Math.min(120,r.pendantPity)+' / 120 胜')+'</p><small>隐侠随机概率 0.6% / 胜，挂件 0.3% / 胜；保底只在胜利后累计。原有名侠若已结交则转为心得。</small></section></div>'+
    collectionView(c.id)+'<h2 class="endgame-section">本章兑换 · 奢品商店</h2><p class="muted">各版本通宝独立使用。挂件加成和兑换价格按本作设计，收藏外观不涉及现实交易。</p><div class="exchange-grid">'+G.offers(s,c.id).map(o=>'<article class="panel exchange-offer"><span class="eyebrow">'+esc(c.currencyName)+'</span><h3>'+esc(o.name)+'</h3><p>'+esc(o.description)+'</p><strong>'+o.cost+' 通宝</strong><button class="btn small primary" data-action="endgame-exchange" data-id="'+c.id+'|'+o.id+'" '+(!c.unlocked||o.owned||o.locked||r.currency<o.cost?'disabled':'')+'>'+(o.owned?'已收藏':o.locked?esc(o.reason||'先完成名侠线索'):'兑换')+'</button></article>').join('')+'</div>'+
    '<section class="panel endgame-overview"><div class="between"><h3>挂件陈列</h3>'+btn('搭配角色外观','nav','cosmetics','small')+'</div><div class="endgame-pendants">'+chapters.filter(x=>g.pendants.includes(x.id)).map(x=>{const item={id:'pendant:'+x.id,type:'pendant',name:x.pendant.name},wearing=isWearing(s,item);return '<article>'+art(item)+'<strong>'+esc(x.pendant.name)+'</strong>'+visualNote(item)+'<small>'+esc(x.pendant.effect)+(g.equipped===x.id?' · 收益加成已启用':'')+'</small>'+(root.JXCosmetics?wearButton(s,item):btn(g.equipped===x.id?'正在佩戴':'佩戴','endgame-equip',x.id,'small'))+(wearing?'<small>主角正在展示</small>':'')+'</article>';}).join('')+(g.pendants.length?'':'<p class="muted">击败首领或用本章通宝兑换，点亮第一件珍藏。</p>')+'</div><p class="tiny muted">'+(c.pendant.sourceUrl?'本章珍藏取材自公开资料；归属章节、拓影收藏与加成为放置玩法适配。':'本章挂件是以资料片主题创作的纪念珍藏。')+'</p></section>'+
    '<section class="panel endgame-overview"><h3>本章首领名录 · '+c.bosses.length+' 位</h3><div class="chapter-heroes">'+c.bosses.map(b=>'<span>'+esc(b.name)+'</span>').join('')+'</div></section><section class="panel endgame-overview"><h3>最近百战</h3>'+g.log.map(l=>'<p>'+esc(l)+'</p>').join('')+(g.last?'<details><summary>最近一场战斗详情 · '+esc(g.last.name)+'</summary>'+g.last.log.map(l=>'<p class="tiny">'+esc(l)+'</p>').join('')+'</details>':'<p class="muted">开始挂机后，胜负、通宝与收藏记录会显示在这里。</p>')+'</section>';
  }
  function wornView(){
   const s=getState(),C=root.JXCosmetics,h=player(s),w=C?.appearance(s,h.uid),list=C?C.catalog(s).filter(x=>x.owned&&w[x.type]===x.id):root.JXEndgame.collection(s).filter(x=>x.wearing);
   return (list.length?'<div class="worn-collection" aria-label="主角当前珍藏展示">'+list.map(x=>'<div class="worn-relic">'+art(x)+'<span>'+esc(x.name)+'<small>'+({pet:'跟随游历',pendant:'随身挂件',hair:'发型拓影'}[x.type])+'</small></span></div>').join('')+'</div>':'<p class="muted">为主角选择挂件和跟宠，随旅途一同展示。</p>')+btn('前往角色外观','nav','cosmetics','small');
  }
  return {render,checkIn,collectionView,wornView};
 }
 root.JXEndgameUI={create};
})(globalThis);

;
(function(root){
 'use strict';
 function clues(s,esc){const D=root.JXData,player=D.HEROES.find(h=>h.id===s.heroes.find(h=>h.uid===s.playerUid)?.id);return '<section class="panel endgame-overview"><h2>历代名侠线索</h2><p>人物与版本地域据资料编排。试炼、保底和跨时代同行是本作改编；只有标明秘境条件的人物需要通关对应普通秘境。</p>'+D.EXPANSIONS.map(e=>{const heroes=D.HEROES.filter(h=>h.placement?.expansionId===e.id);return heroes.length?'<details><summary>'+esc(e.name)+' · '+heroes.length+'位</summary>'+heroes.map(h=>'<p><strong>'+(s.dex.includes(h.id)?'✓ ':'◇ ')+esc(h.name)+'</strong> · '+esc(h.placement.location)+'<br><small>'+esc(h.recruitment?.type==='memory'?'血战天策守卫回忆：0.2%胜利概率，200胜保底':h.recruitment?.type==='sect-trial'&&h.sect===player?.sect?'本门资料片试炼：先完成线索所需秘境，优先结交未拥有同门':'对应版本百战：0.6%胜利概率，80胜保底，或640本章通宝')+'。'+esc(h.placement.note)+'</small> <a href="'+esc(h.placement.sourceUrl)+'" target="_blank" rel="noopener noreferrer">资料 ↗</a></p>').join('')+'</details>':'';}).join('')+'</section>'; }
 function create({getState,esc,btn}){return {render(){const s=getState(),T=root.JXTrials,all=T.info(s),y=T.init(s).yangning;return '<div class="notice">高阶同门由门派试炼结缘；装备只培养主角，侠客以等级和固有武学助战。每个资料片可完成一次门派试炼；优先结交该版本已登场且未拥有的同门。</div><div class="exchange-grid">'+all.map(c=>'<article class="panel exchange-offer"><span class="eyebrow">'+esc(c.name)+' · 主角 Lv.'+(c.cap-2)+'</span><h3>'+esc(c.sect.name)+'·守心试炼</h3><p>'+(c.reward?'结缘：'+esc(c.reward.name)+' · '+esc(c.reward.placement?.location||c.sect.name)+(c.reward.placement?.dungeonId?'<br>先完成对应普通秘境':''):'奖励：主角门派心得 ×20')+'<br>15份副本补给，失败返还7份。成功另获50侠名及15颗一级五行石。</p><button class="btn small primary" data-action="sect-trial" data-id="'+c.id+'" '+(!c.unlocked||c.record.wins?'disabled':'')+'>'+(c.record.wins?'已完成':c.unlocked?'接受试炼':'资料片尚未开放')+'</button></article>').join('')+'</div><section class="panel endgame-overview"><span class="eyebrow">安史之乱 · 血战天策</span><h2>天枪旧誓 · 杨宁</h2><p>替杨宁抵御令狐伤的月下剑法，在守卫回忆中寻找天枪侠影。</p><p>每次消耗20份补给，失败返还10份。胜利有0.2%概率达成隐藏成就，200次胜利保底。</p><div class="bar"><span style="width:'+Math.min(100,y.pity/200*100)+'%"></span></div><p>成功守卫 '+y.wins+' 次 / 共尝试 '+y.runs+' 次</p>'+btn(y.claimed?'已结缘杨宁':'挑战守卫回忆','yangning-memory','','primary')+'<p class="tiny muted">杨宁在原作是友方天策将领。此处是纪念性回忆招募，非原作掉落表或后续时代现役设定。<a href="https://jx3.xoyo.com/zt/2018/09/26/jx3active/index.html" target="_blank" rel="noopener noreferrer">官方成就来源 ↗</a></p></section>'+clues(s,esc);}};}
 root.JXTrialsUI={create};
})(globalThis);

;
(function (root) {
  'use strict';
  const SESSION_KEY = 'jx3-jianghu-account-session-v1';
  const PROVIDER_KEY = SESSION_KEY + '-provider', IDENTITY_KEY = SESSION_KEY + '-identity';
  // Loaded only after an email action. The release builder copies this fixed,
  // locally bundled SDK and its license; no public CDN is required at runtime.
  const CLOUDBASE_SDK = 'vendor/cloudbase-3.11.1.js';
  const config = root.JXAccountConfig || {};
  const apiBase = String(config.apiBase || '').replace(/\/$/, '');
  const validUrl = value => { try { const url = new URL(value);return url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)); } catch { return false; } };
  const googleAvailable = () => /\.apps\.googleusercontent\.com$/.test(config.googleClientId || '');
  const emailAvailable = () => !!config.cloudbaseEnvId || !googleAvailable();
  const configured = () => root.location?.protocol !== 'file:' && validUrl(apiBase);
  let token = '', profile = null, revision = 0, provider = '', identityKey = '', chain = Promise.resolve(), busy = 0, googleLoading, loginGeneration = 0, sessionVersion = 0;
  let cloudbaseLoading, cloudAuth, cloudEnvironment = '', cloudClient = '', pendingEmail = null;
  try { if (configured()) { token = root.sessionStorage.getItem(SESSION_KEY) || '';provider = root.sessionStorage.getItem(PROVIDER_KEY) || (token ? 'google' : '');identityKey = root.sessionStorage.getItem(IDENTITY_KEY) || ''; } } catch {}
  const status = () => ({ configured: configured(), authenticated: !!token, profile, revision, provider, sessionVersion, googleAvailable:googleAvailable(), emailAvailable:emailAvailable(), provenance: 'server', busy: busy > 0 });
  function clear() { sessionVersion++;token = '';profile = null;revision = 0;provider = '';identityKey = '';try { for (const key of [SESSION_KEY, PROVIDER_KEY, IDENTITY_KEY]) root.sessionStorage.removeItem(key); } catch {} }
  function rememberSession(data, nextProvider) {
    if (typeof data.token !== 'string' || !data.token) throw Error('账号服务未返回有效会话。');
    if (nextProvider === 'cloudbase' && !/^[a-f0-9]{64}$/.test(data.identityKey || '')) throw Error('账号服务未返回身份标识。');
    // Renewing the same CloudBase identity keeps visible social data; a new
    // sign-in invalidates it so the previous player's code is never displayed.
    if (nextProvider !== 'cloudbase' || identityKey !== data.identityKey) sessionVersion++;
    token = data.token;provider = nextProvider;identityKey = nextProvider === 'cloudbase' ? data.identityKey : '';
    try { root.sessionStorage.setItem(SESSION_KEY, token);root.sessionStorage.setItem(PROVIDER_KEY, provider);if (identityKey) root.sessionStorage.setItem(IDENTITY_KEY, identityKey);else root.sessionStorage.removeItem(IDENTITY_KEY); } catch {}
    delete data.token;return accept(data);
  }
  const accept = data => { if (data.profile) profile = data.profile;if (Number.isSafeInteger(data.revision)) revision = data.revision;return data; };
  async function request(endpoint, body, authenticated = true, retry = true, shouldAccept = true) {
    if (!configured()) throw Error('账号服务尚未配置；本地江湖可以继续游玩。');
    const headers = { 'Content-Type': 'application/json' };
    if (authenticated && token) headers.Authorization = 'Bearer ' + token;
    let response;
    try { response = await fetch(apiBase + endpoint, { method: body === undefined ? 'GET' : 'POST', headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }), credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(20000) }); }
    catch { throw Error('暂时无法连接账号服务，云端进度会在重连后按服务器时间结算。'); }
    let data;
    try { data = await response.json(); } catch { throw Object.assign(Error('账号服务返回了无效响应。'), { status: response.status }); }
    if (!response.ok) {
      if (response.status === 401 && authenticated) {
        if (retry && provider === 'cloudbase' && identityKey && endpoint !== '/v1/auth/logout') {
          await renewCloudSession();
          // The server rejected the expired session before executing this action.
          // Reauthentication synchronizes state and may advance its revision. Keep
          // the operation id so even a duplicate delivery remains idempotent.
          const retryBody = endpoint === '/v1/command' && body ? {...body,revision} : body;
          return request(endpoint, retryBody, authenticated, false, shouldAccept);
        }
        clear();
      }
      const error = Object.assign(new Error(data.error || '账号操作失败。'), { status: response.status });throw error;
    }
    return shouldAccept ? accept(data) : data;
  }
  function queued(operation) {
    busy++;
    const pending = chain.catch(() => {}).then(operation);
    chain = pending;
    return pending.finally(() => { busy--; });
  }
  function restore() {
    if (!configured() || !token) return Promise.resolve(null);
    return queued(async () => { try { return await request('/v1/state'); } catch (error) { if (error.status === 401) return null;throw error; } });
  }
  function sync() { return queued(() => request('/v1/state')); }
  function bootstrap(input) { return queued(() => request('/v1/bootstrap', { name: input.name, starter: input.starter })); }
  function command(action, args = {}) {
    const requestId = root.crypto.randomUUID();
    return queued(() => request('/v1/command', { action, args, revision, requestId }));
  }
  function friends() { return queued(() => request('/v1/social/friends')); }
  function addFriend(code) { return queued(() => request('/v1/social/friends', { code })); }
  function showcase(ids) { return queued(() => request('/v1/social/showcase', { ids })); }
  function setSupports(supports) { return queued(() => request('/v1/social/supports', { supports })); }
  function world() { return queued(() => request('/v1/world')); }
  function say(text) { return queued(() => request('/v1/world', { text })); }
  function cardExchange(input) { return queued(() => request('/v1/cards/exchange', input)); }
  async function logout() {
    ++loginGeneration;pendingEmail = null;
    return queued(async () => {
      try {
        if (provider === 'cloudbase' && !cloudAuth) { try { await emailContext(); } catch {} }
        if (token && configured()) await request('/v1/auth/logout', {}, true, false);
      } finally { clear();await signOutCloud();root.google?.accounts?.id?.disableAutoSelect(); }
    });
  }
  async function signOutCloud() { if (cloudAuth) { try { await cloudAuth.signOut(); } catch {} } }
  function cloudError(error) {
    const code = String(error?.code || error?.errorCode || '');
    const messages = {
      invalid_password:'邮箱或密码不正确，请重试或找回密码。',not_found:'未找到此邮箱账号，请先注册。',password_not_set:'此账号尚未设置密码，请通过找回密码设置。',
      invalid_argument:'邮箱格式、密码或验证码不正确，请检查后重试。',code_expired:'验证码已过期，请重新发送。',max_attempts_exceeded:'验证次数过多，请稍后再试。',
      resource_exhausted:'操作过于频繁，请稍候再试。',failed_precondition:'此邮箱可能已经注册，请尝试登录或找回密码。',
      captcha_required:'本次操作需要额外的人机验证，暂时无法继续。请稍后重试或联系管理员。',captcha_invalid:'人机验证未通过，请稍后重新尝试。',
      unimplemented:'邮箱服务暂未开放，请稍后重试。',login_type_disabled:'邮箱登录暂未开放，请稍后重试。',unauthorized_client:'邮箱服务配置暂不可用，请联系管理员。',
      user_blocked:'此账号暂不可用，请联系管理员。',user_pending:'此邮箱尚未完成验证，请先完成注册。',
      unauthenticated:'邮箱登录已过期，请重新登录。',unreachable:'暂时无法连接邮箱服务，请检查网络后重试。'
    };
    return Object.assign(Error(messages[code] || '邮箱操作未能完成，请稍后重试。'), {code});
  }
  function unwrap(result) { if (result?.error) throw cloudError(result.error);if (!result?.data) throw Error('邮箱服务返回了无效响应。');return result.data; }
  function loadCloudBase() {
    if (root.cloudbase?.init) return Promise.resolve();
    if (cloudbaseLoading) return cloudbaseLoading;
    cloudbaseLoading = new Promise((resolve, reject) => {
      const script = document.createElement('script');script.src = new URL(CLOUDBASE_SDK, document.baseURI).href;script.async = true;
      const fail = message => { clearTimeout(timer);script.remove();cloudbaseLoading = null;reject(Error(message)); };
      const timer = setTimeout(() => fail('邮箱登录组件加载超时，请重新尝试。'), 15000);
      script.onload = () => { if (!root.cloudbase?.init) return fail('邮箱登录组件暂不可用。');clearTimeout(timer);resolve(); };
      script.onerror = () => fail('邮箱登录组件加载失败，请检查网络后重试。');
      document.head.appendChild(script);
    });
    return cloudbaseLoading;
  }
  async function emailContext() {
    const challenge = await request('/v1/auth/challenge', undefined, false);
    const descriptor = challenge.cloudbase;
    if (!descriptor || !/^[a-zA-Z0-9][a-zA-Z0-9-]{1,127}$/.test(descriptor.envId || '')) throw Error('邮箱账号服务尚未开放，请稍后重试。');
    if (config.cloudbaseEnvId && config.cloudbaseEnvId !== descriptor.envId) throw Error('网站与邮箱服务配置不一致，请联系管理员。');
    await loadCloudBase();
    const clientId = descriptor.clientId || descriptor.envId;
    if (typeof clientId !== 'string' || clientId.length > 256) throw Error('邮箱服务配置无效。');
    if (cloudAuth && (cloudEnvironment !== descriptor.envId || cloudClient !== clientId)) throw Error('邮箱服务环境已变化，请重新载入页面。');
    if (!cloudAuth) {
      cloudEnvironment = descriptor.envId;cloudClient = clientId;
      const app = root.cloudbase.init({ env:descriptor.envId, clientId, region:config.cloudbaseRegion || 'ap-shanghai', timeout:15000, persistence:'session', debug:false, auth:{detectSessionInUrl:false} });
      cloudAuth = app.auth({persistence:'session'});
    }
    return {challenge, auth:cloudAuth};
  }
  async function guardLogin(generation) {
    if (generation !== loginGeneration) { await signOutCloud();throw Object.assign(Error('已取消邮箱登录。'), {name:'AbortError'}); }
  }
  async function exchangeCloud(data, generation, expectedIdentity = '') {
    await guardLogin(generation);
    const accessToken = data?.session?.access_token;
    if (typeof accessToken !== 'string' || !accessToken) throw Error('邮箱服务未返回有效身份，请重新登录。');
    const {challenge} = await emailContext();
    await guardLogin(generation);
    const envelope = await request('/v1/auth/cloudbase', {nonce:challenge.nonce,accessToken}, false, false, false);
    await guardLogin(generation);
    if (expectedIdentity && envelope.identityKey !== expectedIdentity) {
      clear();await signOutCloud();throw Object.assign(Error('邮箱账号已发生切换，请重新登录后再操作。'), {status:401});
    }
    return rememberSession(envelope, 'cloudbase');
  }
  async function renewCloudSession() {
    const expectedIdentity = identityKey, generation = loginGeneration;
    try {
      const {auth} = await emailContext();
      const result = typeof auth.refreshSession === 'function' ? await auth.refreshSession() : await auth.getSession();
      return await exchangeCloud(unwrap(result), generation, expectedIdentity);
    } catch (error) { if (error.status !== 503) clear();throw error; }
  }
  function validEmail(value) {
    const email = String(value || '').trim();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw Error('请输入有效邮箱地址。');
    return email;
  }
  function validPassword(value) { if (typeof value !== 'string' || value.length < 8 || value.length > 128) throw Error('密码需要 8 至 128 个字符。');return value; }
  function startEmail(mode, input) {
    const generation = ++loginGeneration;pendingEmail = null;
    return queued(async () => {
      if (!['login','register','reset'].includes(mode)) throw Error('邮箱操作无效。');
      const email = validEmail(input.email), password = mode === 'reset' ? undefined : validPassword(input.password);
      const {auth} = await emailContext();await guardLogin(generation);
      let data;
      try { data = unwrap(await (mode === 'login' ? auth.signInWithPassword({email,password}) : mode === 'register' ? auth.signUp({email,password}) : auth.resetPasswordForEmail(email))); }
      catch (error) { if (error?.code) throw cloudError(error);throw error; }
      await guardLogin(generation);
      if (mode === 'login') return exchangeCloud(data, generation);
      const verify = mode === 'reset' ? data.updateUser : data.verifyOtp;
      if (typeof verify !== 'function') throw Error('邮箱验证请求未能建立，请重新尝试。');
      pendingEmail = {mode,email,verify,generation};
      return {verificationRequired:true,mode,email};
    });
  }
  function verifyEmail(input) {
    return queued(async () => {
      const pending = pendingEmail;
      if (!pending) throw Error('请先发送邮箱验证码。');
      await guardLogin(pending.generation);
      if (!pending.verified) {
        const code = String(input.code || '').trim();
        if (!/^\d{6}$/.test(code)) throw Error('请输入 6 位邮箱验证码。');
        const params = pending.mode === 'reset' ? {nonce:code,password:validPassword(input.password)} : {token:code};
        const data = unwrap(await pending.verify(params));
        await guardLogin(pending.generation);
        // OTPs are one-use. Keep only the verified credential in memory while
        // the independent game exchange is pending; drop SDK password closures.
        pending.verify = null;
        if (typeof data?.session?.access_token !== 'string' || !data.session.access_token) {
          pendingEmail = null;
          throw Object.assign(Error('邮箱验证已完成，但未取得登录凭据，请返回邮箱登录。'), {emailVerified:true,needsEmailLogin:true});
        }
        pending.verified = {session:{access_token:data.session.access_token}};
      }
      try {
        // exchangeCloud obtains a fresh one-use server challenge on each retry.
        const envelope = await exchangeCloud(pending.verified, pending.generation);
        if (pendingEmail === pending) pendingEmail = null;
        return envelope;
      } catch (error) {
        if (pending.generation !== loginGeneration) throw error;
        if (error.status === 401) pendingEmail = null;
        throw Object.assign(error, {emailVerified:true,needsEmailLogin:error.status===401});
      }
    });
  }
  function loadGoogle() {
    if (root.google?.accounts?.id) return Promise.resolve();
    if (googleLoading) return googleLoading;
    googleLoading = new Promise((resolve, reject) => {
      const script = document.createElement('script');script.src = 'https://accounts.google.com/gsi/client';script.async = true;
      const timer = setTimeout(() => { script.remove();googleLoading = null;reject(Error('Google 登录加载超时，请检查网络后重试。')); }, 15000);
      script.onload = () => { clearTimeout(timer);if (root.google?.accounts?.id) resolve();else { googleLoading = null;reject(Error('Google 登录暂不可用。')); } };
      script.onerror = () => { clearTimeout(timer);script.remove();googleLoading = null;reject(Error('无法加载 Google 登录，请稍后重试。')); };
      document.head.appendChild(script);
    });
    return googleLoading;
  }
  async function prepareGoogle(container, onLogin) {
    if (!configured()) throw Error('账号服务尚未配置；本地江湖可以继续游玩。');
    const generation = ++loginGeneration;pendingEmail = null;
    const [challenge] = await Promise.all([request('/v1/auth/challenge', undefined, false), loadGoogle()]);
    if (generation !== loginGeneration) return;
    if (challenge.googleClientId !== config.googleClientId) throw Error('网站与账号服务的 Google 配置不一致。');
    root.google.accounts.id.initialize({ client_id: config.googleClientId, nonce: challenge.nonce, auto_select: false, callback: response => {
      if (generation !== loginGeneration) return;
      queued(async () => {
          if (generation !== loginGeneration) return null;
          const data = await request('/v1/auth/google', { nonce: challenge.nonce, credential: response.credential }, false);
          if (generation !== loginGeneration) return null;
          return rememberSession(data, 'google');
      }).then(data => { if (data && generation === loginGeneration) return onLogin(data); }).catch(error => { if (generation === loginGeneration) return onLogin(null, error); });
    } });
    root.google.accounts.id.renderButton(container, { type: 'standard', theme: 'outline', size: 'large', text: 'signin_with', locale: 'zh_CN' });
  }
  function cancelSignIn() { loginGeneration++;pendingEmail = null;root.google?.accounts?.id?.cancel?.(); }
  root.JXAccount = Object.freeze({ configured, status, prepareGoogle, startEmail, verifyEmail, cancelSignIn, restore, bootstrap, sync, command, logout, friends, addFriend, showcase, setSupports, world, say, cardExchange });
})(globalThis);

;
(function (root) {
  'use strict';
  function create(c) {
    const A = root.JXAccount, esc = c.esc;
    let active = false, restoring = !!A?.status().authenticated, signingIn = false, signingOut = false;
    let inFlight = false, lastSync = 0, lastError = '', guest = null, guestReady = true, generation = 0;
    let emailMode = 'login', emailStep = 'credentials', emailAddress = '', emailInput = null, emailAttempt = 0, emailSending = false, emailResendAt = 0;
    const mutations = new Set(['running','auto','auto-advance','speed','sound','motion','formation','travel','set-role','toggle-team','level','skill-train','use-exp','use-medicine','use-item','buy','buy-five','save-preset','load-preset','train','claim-training','invite','claim-invite','quest','achievement','craft','tea','challenge','scenario','pet','cosmetic-equip','cosmetic-clear','chapter-advance','renown-exchange','eq-equip','eq-unequip','eq-refine','eq-socket','eq-color','eq-fuse','eq-fuse-to','eq-salvage','eq-salvage-inferior','eq-current','eq-auto-equip','eq-auto-team','eq-auto-enhance','eq-auto-refine','eq-auto-socket','forge-step','expedition','auto-lineup','endgame-start','endgame-stop','endgame-exchange','endgame-equip','endgame-wear','journey-attempt','sect-trial','yangning-memory']);
    const locked = () => active || restoring || signingIn || signingOut;
    for(const action of ['journey-mode','journey-resume','activity-claim','eq-lock','eq-socket-target','eq-default-stone','martial-learn','martial-plus','martial-minus','martial-equip','martial-reset','martial-auto'])mutations.add(action);
    const atEntry = () => !!c.atEntry?.();
    function entry() {
      const status = A?.status() || {};
      if (!c.entry) return;
      if (signingOut) return c.entry('<div class="entry-heading"><span class="entry-kicker">稍候片刻</span><h2>正在收好行囊</h2><p>安全退出账号后，可继续本机的游客旅途。</p></div><p class="entry-status" role="status">正在退出账号…</p>');
      if ((restoring || active) && status.authenticated && !signingIn) {
        return c.entry('<div class="entry-heading"><span class="entry-kicker">故人归来</span><h2>重返你的江湖</h2><p>正在查收云端存档，请稍候。</p></div><p class="entry-status" role="status">' + esc(lastError || '正在恢复云端进度…') + '</p><div class="account-actions">' + c.btn('重试恢复', 'account-sync', '', 'primary') + c.btn('退出并重新登录', 'account-logout', '', 'small') + '</div>');
      }
      if (!status.configured) return c.entry('<div class="entry-heading"><span class="entry-kicker">' + (root.location.protocol === 'file:' ? '离线江湖' : '本机旅途') + '</span><h2>此间山河，等你归来</h2><p>无需联网，随时启程。你的游客进度保存在这台设备中。</p></div><div class="entry-local-note"><span>叁</span><p>' + (root.location.protocol === 'file:' ? '这是完整离线版。账号与好友功能请前往网站版。' : '账号服务尚未开放，可以先以游客身份游玩。') + '</p></div>');
      if (document.querySelector('.login-screen #account-email-form, .login-screen #google-signin')) return;
      if (status.emailAvailable) return openEmail('login', lastError);
      c.entry('<div class="entry-heading"><span class="entry-kicker">故人归来</span><h2>登录江湖</h2><p>登录后，在不同设备间继续你的旅途。</p></div>' + (lastError ? '<p class="entry-status" role="status">' + esc(lastError) + '</p>' : '') + c.btn('使用 Google 登录', 'account-login', '', 'primary wide'));
    }
    function rememberGuest() {
      if (guest !== null || active) return;
      guest = c.captureGuest ? c.captureGuest() : JSON.stringify(c.getState());
      guestReady = !!c.ui.ready;
    }
    function registration() {
      if (c.registration) return c.registration();
      const s = c.getState();
      return { name: s.name, starter: root.JXData.HEROES.find(h => h.id === s.heroes[0]?.id)?.sect || 'chunyang' };
    }
    function panel() {
      const status = A?.status() || {}, protectedState = locked();
      const label = signingOut ? '正在退出' : signingIn ? '正在登录' : restoring ? '正在恢复云端进度' : active ? '服务器存档' : '游客 · 本地存档';
      const description = active ? esc(status.profile?.name || '江湖账号') + '<br>操作、资源和离线奖励由服务器结算。'
        : restoring ? '正在恢复服务器进度，恢复期间暂停操作；你也可以返回游客江湖。'
        : '游客进度保留在本机。登录账号后可创建独立的云端江湖。';
      const note = lastError || (status.configured ? '邮箱、Google 与游客进度分别保存；相同邮箱不会自动合并账号。' : root.location.protocol === 'file:' ? '离线单文件使用游客存档；账号登录请使用网站版。' : '账号服务尚未开放，当前可继续游客游玩。');
      let buttons = '';
      if (status.configured && !signingOut) {
        if (!status.authenticated) {
          if (status.emailAvailable) buttons += c.btn(active || restoring ? '重新邮箱登录' : '邮箱登录 / 注册', 'account-email', 'login', 'primary');
          if (status.googleAvailable !== false) buttons += c.btn(active || restoring ? '重新 Google 登录' : '使用 Google 登录 / 注册', 'account-login', '', status.emailAvailable ? 'small' : 'primary');
        }
        else if (protectedState) buttons += c.btn(restoring ? '重试恢复云端' : '同步云端', 'account-sync', '', 'small primary');
        else buttons += c.btn('进入云端江湖', 'account-sync', '', 'small primary');
        if (protectedState || status.authenticated) buttons += c.btn('退出账号', 'account-logout', '', 'small');
      }
      return '<section class="panel account-panel"><div class="account-status"><h3>账号与云端江湖</h3><span class="pill">' + label + '</span></div><p>' + description + '</p><p class="tiny muted">' + esc(note) + '</p><div class="account-actions">' + buttons + '</div></section>';
    }
    function accept(envelope, reset = false) {
      if (!envelope?.state) throw Error('服务器尚未返回可用角色，请重试恢复。');
      const next = root.JXEngine.parseSave(JSON.stringify(envelope.state));
      // parseSave intentionally strips imported helper claims. Only authenticated
      // server responses restore their transient snapshots for readiness/display.
      if (Array.isArray(envelope.state.battleSupports)) next.battleSupports = JSON.parse(JSON.stringify(envelope.state.battleSupports.slice(0, 4)));
      const shouldReset = reset || !active || restoring || !!envelope.offline;
      active = true;restoring = false;signingIn = false;lastError = '';
      c.setState(next, { reset: shouldReset, events: envelope.events || [] });
      if (envelope.offline?.seconds >= 60) c.offline(envelope.offline);
      c.render();
    }
    async function ensureState(envelope, input) {
      if (envelope?.state) return envelope;
      try { return await A.bootstrap(input || registration()); }
      catch (error) { if (error.status === 409) return A.sync();throw error; }
    }
    function loginStatus(text) { const node = document.getElementById('google-status');if (node) node.textContent = text; }
    async function finishSignIn(envelope, input, attempt) {
      if (attempt !== generation) return;
      try {
        inFlight = true;restoring = !active;
        const ready = await ensureState(envelope, input);
        if (attempt !== generation) return;
        accept(ready, true);c.close();c.toast('已进入服务器江湖；游客进度仍保留在本机。');
      } catch (error) {
        if (attempt === generation) {
          signingIn = false;lastError = error.message;loginStatus(error.message);
          if (document.getElementById('account-email-form')) {
            // The game session is already established. A failed bootstrap must
            // resume bootstrap/sync, never consume the email OTP again.
            const authenticated = A.status().authenticated;
            emailStep = authenticated ? 'restore' : 'login-required';
            if (!authenticated && !active) restoring = false;
            signingIn = true; // Wait for the explicit retry; avoid parallel poll recovery.
            emailForm(error.message + (authenticated ? ' 账号已登录，可以重试恢复云端江湖。' : ' 请返回邮箱登录后继续。'));
          } else emailStatus(error.message);
          c.toast(error.message);c.render();
        }
      } finally { if (attempt === generation) { inFlight = false;lastSync = performance.now(); } }
    }
    async function login() {
      if (!A?.configured()) return c.toast('账号服务尚未配置，游客进度可以继续游玩。');
      if (signingOut || inFlight || A.status().busy) return c.toast('账号正在同步，请稍候。');
      const input = registration(), attempt = ++generation;
      if (!locked()) { guest = null;if (c.ui.ready) c.save(); }
      rememberGuest();signingIn = true;
      c.open('<div class="modal-head"><h2>Google 登录 / 注册</h2></div><div class="modal-body"><p>首次登录会创建独立的服务器江湖。现有游客进度仍留在本机。</p><div id="google-signin" style="margin:22px 0"></div><p id="google-status" role="status">正在连接 Google…</p></div><div class="modal-footer">' + c.btn('重新连接', 'account-login', '', 'small') + c.btn(atEntry() ? '返回邮箱登录' : '返回游戏', atEntry() ? 'account-email' : 'account-cancel', atEntry() ? 'login' : '', 'small') + '</div>');
      try {
        await A.prepareGoogle(document.getElementById('google-signin'), async (envelope, error) => {
          if (attempt !== generation) return;
          if (error) { signingIn = false;lastError = error.message;loginStatus(error.message);c.render();return; }
          await finishSignIn(envelope, input, attempt);
        });
        if (attempt === generation) loginStatus('使用你的 Google 账号继续。');
      } catch (error) {
        if (attempt === generation) { signingIn = false;lastError = error.message;loginStatus(error.message);c.render(); }
      }
    }
    function emailStatus(text) { const node = document.getElementById('email-status');if (node) node.textContent = text; }
    function emailForm(message = '') {
      const exchanged = emailStep === 'exchange' || emailStep === 'restore' || emailStep === 'login-required';
      const title = exchanged ? '邮箱已验证' : {login:'邮箱登录',register:'注册江湖账号',reset:'找回密码'}[emailMode];
      const verified = emailStep === 'verification';
      const password = emailMode !== 'reset' && emailStep === 'credentials' || emailMode === 'reset' && verified;
      const inputStyle = 'width:100%;max-width:100%;min-width:0;box-sizing:border-box';
      let fields = '<label for="account-email-address">邮箱地址</label><input class="search" style="' + inputStyle + '" id="account-email-address" name="email" type="email" autocomplete="username" maxlength="254" required placeholder="your@email.com" value="' + esc(emailAddress) + '"' + (verified || exchanged ? ' readonly' : '') + '>';
      if (verified) fields += '<label for="account-email-code">邮箱验证码</label><input class="search" style="' + inputStyle + '" id="account-email-code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" minlength="6" maxlength="6" required placeholder="6 位验证码">';
      if (password) fields += '<label for="account-email-password">' + (emailMode === 'reset' ? '新密码' : '密码') + '</label><input class="search" style="' + inputStyle + '" id="account-email-password" name="password" type="password" autocomplete="' + (emailMode === 'login' ? 'current-password' : 'new-password') + '" minlength="8" maxlength="128" required placeholder="8 至 128 个字符">';
      if (emailMode === 'register' && emailStep === 'credentials') fields += '<div class="entry-character"><div><label for="account-player-name">少侠名讳</label><input class="search" id="account-player-name" name="character-name" autocomplete="nickname" maxlength="16" required value="' + esc(emailInput?.name || '无名少侠') + '"></div><div><label for="account-player-sect">初入门派</label><select class="select" id="account-player-sect" name="character-sect">' + root.JXData.SECTS.map(sect => '<option value="' + esc(sect.id) + '"' + (sect.id === (emailInput?.starter || 'chunyang') ? ' selected' : '') + '>' + esc(sect.name) + '</option>').join('') + '</select></div></div>';
      const action = exchanged ? '重试进入江湖' : verified ? (emailMode === 'reset' ? '验证并设置新密码' : '验证邮箱并进入江湖') : emailMode === 'login' ? '登录' : '发送邮箱验证码';
      const submit = emailStep === 'login-required' ? '' : c.btn(action, 'account-email-submit', '', 'primary');
      const alternatives = exchanged ? c.btn('返回邮箱登录', 'account-email', 'login', 'small') : verified ? c.btn('重新填写 / 发送', 'account-email', emailMode, 'small') : c.btn(emailMode === 'login' ? '注册新账号' : '返回登录', 'account-email', emailMode === 'login' ? 'register' : 'login', 'small') + (emailMode === 'login' ? c.btn('忘记密码', 'account-email', 'reset', 'small') : '');
      const description = exchanged ? '邮箱验证已完成，无需再次输入验证码。' : emailMode === 'register' ? '留下名讳，验证邮箱，开启属于你的江湖。' : emailMode === 'reset' ? '向你的邮箱发送验证码，重新设置密码。' : '一封书信，一段旧梦。登录后继续你的云端旅途。';
      c.open('<div class="modal-head"><span class="entry-kicker">' + (emailMode === 'register' ? '初逢江湖' : emailMode === 'reset' ? '寻回旧梦' : '故人归来') + '</span><h2>' + title + '</h2></div><div class="modal-body"><p>' + description + '</p><form id="account-email-form" style="display:grid;gap:12px;margin:20px 0">' + fields + submit + '</form><p id="email-status" role="status" aria-live="polite">' + esc(message || (verified ? '验证码已发送，请检查收件箱或垃圾邮件。' : '')) + '</p><div class="account-actions">' + alternatives + '</div>' + (atEntry() && A.status().googleAvailable && emailMode === 'login' && !verified && !exchanged ? '<div class="entry-provider"><span>其他登录方式</span>' + c.btn('使用 Google 账号继续', 'account-login', '', 'wide') + '<p>Google 与邮箱是独立账号，进度不会自动合并。</p></div>' : '') + '</div>' + (atEntry() ? '' : '<div class="modal-footer">' + c.btn('返回游戏', 'account-cancel', '', 'small') + '</div>'));
      if (verified || !atEntry()) document.getElementById(verified ? 'account-email-code' : 'account-email-address')?.focus?.();
    }
    function openEmail(mode, message = '') {
      if (!A?.configured()) return c.toast('账号服务尚未配置，游客进度可以继续游玩。');
      if (signingOut || inFlight || A.status().busy) return c.toast('账号正在同步，请稍候。');
      if (!['login','register','reset'].includes(mode)) mode = 'login';
      emailAddress = document.getElementById('account-email-address')?.value || emailAddress;
      A.cancelSignIn();emailMode = mode;emailStep = 'credentials';emailSending = false;emailAttempt = ++generation;emailInput = registration();
      if (!locked()) { guest = null;if (c.ui.ready) c.save(); }
      rememberGuest();signingIn = true;emailForm(message);
    }
    async function submitEmail() {
      if (emailSending || signingOut || emailAttempt !== generation) return;
      if (emailStep === 'login-required') return openEmail('login');
      const form = document.getElementById('account-email-form');
      if (!form || form.reportValidity && !form.reportValidity()) return;
      const attempt = emailAttempt;
      if (emailStep === 'credentials' && emailMode !== 'login' && Date.now() < emailResendAt) return emailStatus('请在 ' + Math.ceil((emailResendAt - Date.now()) / 1000) + ' 秒后重新发送验证码。');
      emailAddress = document.getElementById('account-email-address')?.value || '';
      if (emailMode === 'register' && emailStep === 'credentials') emailInput = registration();
      const passwordNode = document.getElementById('account-email-password');
      const password = passwordNode?.value || '', code = document.getElementById('account-email-code')?.value || '';
      const buttons = Array.from(form.querySelectorAll('button,input'));buttons.forEach(button => { button.disabled = true; });
      emailSending = true;emailStatus(emailStep === 'restore' ? '正在恢复云端江湖…' : emailStep === 'exchange' ? '邮箱已验证，正在连接游戏服务器…' : emailStep === 'verification' ? '正在验证邮箱…' : emailMode === 'login' ? '正在登录…' : '正在发送验证码…');
      try {
        if (emailStep === 'restore') { await finishSignIn(null, emailInput, attempt);return; }
        const data = await (emailStep === 'verification' || emailStep === 'exchange' ? A.verifyEmail({code,password}) : A.startEmail(emailMode, {email:emailAddress,password}));
        if (attempt !== generation) return;
        if (passwordNode) passwordNode.value = '';
        if (data.verificationRequired) { emailStep = 'verification';emailResendAt = Date.now() + 60000;emailForm(); }
        else await finishSignIn(data, emailInput, attempt);
      } catch (error) {
        if (attempt !== generation) return;
        if (passwordNode) passwordNode.value = '';
        lastError = error.message;
        if (error.emailVerified) {
          emailStep = error.needsEmailLogin ? 'login-required' : 'exchange';
          emailForm(error.message + (error.needsEmailLogin ? ' 请返回邮箱登录后继续。' : ' 邮箱已验证，可以重试进入江湖。'));
        } else emailStatus(error.message);
      } finally {
        if (attempt === generation) { emailSending = false;buttons.forEach(button => { button.disabled = false; }); }
      }
    }
    function cancelLogin() {
      const abortCloudEntry = !active && !!A?.status().authenticated && (signingIn || restoring);
      ++generation;signingIn = false;inFlight = false;emailSending = false;emailInput = null;if (!active && !restoring) guest = null;A?.cancelSignIn?.();c.cancel();
      // Verification may already have issued a game token while bootstrap is
      // pending. Returning to the guest must also revoke that unfinished entry.
      if (abortCloudEntry) logout();
    }
    async function sync() {
      if (inFlight || signingIn || signingOut || A?.status().busy) return;
      if (!A?.status().authenticated) { lastError = '请重新登录以恢复云端进度。';c.render();return; }
      if (!active && !restoring) { rememberGuest();restoring = true; }
      const attempt = generation;inFlight = true;
      try { const envelope = await ensureState(await A.sync());if (attempt === generation) accept(envelope); }
      catch (error) { if (attempt === generation) { lastError = error.message;inFlight = false;c.render(); } }
      finally { if (attempt === generation) { inFlight = false;lastSync = performance.now(); } }
    }
    async function command(action, args) {
      if (!active || restoring || signingIn || signingOut) return c.toast('请等待云端进度恢复后再操作。');
      if (!A.status().authenticated) return c.toast('登录已过期，请重新登录。');
      if (inFlight || A.status().busy) return c.toast('上一项操作正在结算，请稍候。');
      const attempt = generation;inFlight = true;root.JXInteractionFeedback?.pending(action,true);
      try {
        const envelope = await A.command(action, args);
        if (attempt !== generation) return;
        accept(envelope, true);
        const result = envelope.result;
        if (result) { c.toast(result.message || '操作已完成');if (result.log && !(action==='journey-attempt'&&args.id==='all')) c.report('江湖战报', result); }
        c.after(action, result);
      } catch (error) {
        if (attempt !== generation) return;
        lastError = error.message;inFlight = false;root.JXInteractionFeedback?.result(action,{ok:false,message:error.message});c.toast(error.message);c.render();
        if (error.status === 409) { inFlight = false;await sync(); }
      } finally { root.JXInteractionFeedback?.pending(action,false);if (attempt === generation) { inFlight = false;lastSync = performance.now(); } }
    }
    function argsFor(action, id) {
      const s = c.getState(), ui = c.ui, hero = s.heroes.find(h => h.uid === ui.equipmentHero) || s.heroes.find(h => s.team.includes(h.uid)) || s.heroes[0];
      const args = { id };
      if (action.startsWith('eq-') || ['forge-step','renown-exchange','endgame-exchange'].includes(action)) args.uid = hero?.uid;
      if (action === 'train') args.uid = document.getElementById('train-' + id)?.value;
      if (action === 'use-item') args.uid = document.getElementById('item-target')?.value;
      if (action === 'renown-exchange') args.quantity = ui.exchangeQuantity || 1;
      if (action === 'eq-socket') args.level = Number(ui.stoneLevel) || 1;
      if (action === 'eq-salvage-inferior') args.filter = {quality:ui.bagQuality||'all',slots:ui.bagSlots||'all',primary:ui.bagPrimary||'all',secondary:ui.bagSecondary||'all'};
      if (action === 'martial-auto') args.id=(document.getElementById('martial-goal')?.value||'damage')+'|'+(document.getElementById('martial-type')?.value||'all');
      return args;
    }
    async function logout(enterGuest = false) {
      if (signingOut) return;
      ++generation;signingOut = true;signingIn = false;A?.cancelSignIn?.();rememberGuest();
      if (atEntry()) entry();
      try { await A.logout(); } catch {}
      inFlight = false;
      // Keep the write guard until a valid guest snapshot has replaced the cloud state.
      if (c.restoreGuest(guest, { ready: guestReady }) === false) {
        active = false;restoring = true;signingOut = false;lastError = '游客存档未能恢复，已暂停写入。请保留备份后重新载入页面。';c.render();return;
      }
      active = false;restoring = false;signingOut = false;lastError = '';guest = null;
      if (enterGuest && c.enterGuest) c.enterGuest();
      else if (c.returnEntry) { c.returnEntry();c.render();c.toast('已退出账号，游客进度仍保留在本机。'); }
      else { if (guestReady) c.save();c.render();c.toast('已返回游客江湖。'); }
    }
    document.addEventListener('click', e => {
      const target = e.target.closest('[data-action]');if (!target || target.disabled) return;
      const { action, id } = target.dataset;
      if (action === 'entry-guest') { e.stopImmediatePropagation();logout(true);return; }
      if (action === 'account-cancel') { e.stopImmediatePropagation();cancelLogin();return; }
      if (action === 'account-login') { e.stopImmediatePropagation();login();return; }
      if (action === 'account-email') { e.stopImmediatePropagation();openEmail(id);return; }
      if (action === 'account-email-submit') { e.preventDefault();e.stopImmediatePropagation();submitEmail();return; }
      if (action === 'account-sync') { e.stopImmediatePropagation();sync();return; }
      if (action === 'account-logout') { e.stopImmediatePropagation();logout();return; }
      if (!locked()) return;
      if (['import','reset','reset-check','start','breakthrough'].includes(action)) { e.stopImmediatePropagation();c.toast('账号进度由服务器保管；退出账号后可管理游客存档。');return; }
      if (action === 'save') { e.stopImmediatePropagation();sync();return; }
      if (mutations.has(action)) { e.stopImmediatePropagation();command(action, argsFor(action, id)); }
    }, true);
    document.addEventListener('submit', e => { if (e.target.id === 'account-email-form') { e.preventDefault();e.stopImmediatePropagation();submitEmail(); } }, true);
    document.addEventListener('change', e => {
      if (!locked()) return;
      if (e.target.id === 'import-file') { e.stopImmediatePropagation();e.target.value = '';c.toast('请退出账号后再导入游客存档。');return; }
      const action = e.target.dataset.change;
      if (action === 'auto') { e.stopImmediatePropagation();command('auto', { value: e.target.checked }); }
      if (action === 'route-loop') { e.stopImmediatePropagation();command('route-loop', { ids: Array.from(document.querySelectorAll('[data-change="route-loop"]:checked')).map(x => x.value) }); }
    }, true);
    document.addEventListener('close', e => { if (signingIn && e.target.id === 'modal') cancelLogin(); }, true);
    async function restore() {
      if (!restoring || inFlight) return;
      rememberGuest();const attempt = generation;inFlight = true;
      try {
        const envelope = await A.restore();
        if (attempt !== generation) return;
        if (!envelope) { restoring = false;lastError = '';c.render();return; }
        const ready = await ensureState(envelope);
        if (attempt === generation) { accept(ready, true);c.close(); }
      } catch (error) { if (attempt === generation) { lastError = error.message;restoring = true;inFlight = false;c.render(); } }
      finally { if (attempt === generation) { inFlight = false;lastSync = performance.now(); } }
    }
    function poll(now) { if ((active || restoring) && now - lastSync > 2500 && !inFlight && !signingIn && !signingOut && !A?.status().busy && A?.status().authenticated && !document.hidden) sync(); }
    return { panel, entry, restore, poll, adopt: envelope => { if (active && !signingOut) accept(envelope, true); }, active: locked, status: () => ({ active, restoring, signingIn, signingOut, inFlight, lastError }) };
  }
  root.JXAccountUI = { create };
})(globalThis);

;
(function(root){
 'use strict';
 function create(c){
  const A=root.JXAccount,esc=c.esc;let social=null,messages=[],busy=false,lastLoad=0,error='',friendError='',worldError='',draft='',codeDraft='',showcaseDraft=null,supportDraft=null,sessionVersion=A.status().sessionVersion;
  const logged=()=>c.logged()&&A.status().authenticated;
  function resetSession(){const next=A.status().sessionVersion;if(next===sessionVersion)return;sessionVersion=next;social=null;messages=[];lastLoad=0;error=friendError=worldError='';draft=codeDraft='';showcaseDraft=supportDraft=null;}
  const describe=(e,part)=>e.status===404||e.status===501?part+'接口尚未部署，请管理员更新账号后端。':e.status===401?'登录已过期，请前往账号设置重新登录。':part+'暂时无法读取：'+(e.message||'请检查网络并重试。');
  async function load(){resetSession();if(!logged()||busy)return;busy=true;const version=sessionVersion;error='';
   const current=()=>logged()&&A.status().sessionVersion===version;
   try{await Promise.allSettled([
    Promise.resolve().then(()=>A.friends()).then(friends=>{if(!current())return;if(!friends?.self?.code||!Array.isArray(friends.friends))throw Error('好友数据格式无效，请重试。');social=friends;friendError='';if(c.ui.page==='social')c.render();}).catch(e=>{if(current())friendError=describe(e,'好友');}),
    Promise.resolve().then(()=>A.world()).then(world=>{if(!current())return;if(!Array.isArray(world?.messages))throw Error('世界频道数据格式无效，请重试。');messages=world.messages;worldError='';}).catch(e=>{if(current())worldError=describe(e,'世界频道');})
   ]);}finally{busy=false;lastLoad=Date.now();if(c.ui.page==='social')c.render();}}
  function render(){
    resetSession();
    if(!logged())return '<section class="panel account-panel"><h2>好友同游 · 世界频道</h2><p>登录后可展示自身与最多3位侠客，邀请最多4位好友的最新角色协助副本。</p><p>世界频道记录真实玩家消息与玄晶、稀有侠客喜报。</p>'+c.btn('前往账号设置','nav','settings','primary')+'</section>';
    if(Date.now()-lastLoad>15000&&!busy){lastLoad=Date.now();queueMicrotask(load);}
    const self=social?.self,friends=social?.friends||[],supports=supportDraft||social?.supports||[],own=self?.heroes||[];
    return '<section class="journey-summary"><div><span class="eyebrow">异步同游 · 开战时读取好友最新数据</span><strong>我的好友码 '+esc(self?.code||(friendError?'读取失败，请重试':busy?'读取中…':'等待连接'))+'</strong><small>'+(friendError&&self?'已保留上次读取的好友码；新数据待重连。':'自己的主角固定上阵，最多4名不同好友助战；空位由已上阵侠客补足。')+'</small></div>'+c.btn(busy?'同步中':'重试 / 刷新好友与世界','social-refresh','','small')+'</section>'+[error,friendError,worldError].filter(Boolean).map(message=>'<p role="status" class="notice">'+esc(message)+'</p>').join('')+
     '<div class="endgame-grid"><section class="panel endgame-overview"><h3>邀请同道</h3><p>输入好友分享的代码即可添加。这里只展示对方公开的角色，不会读取其私人存档。</p><div class="social-input-row"><input class="search" id="friend-code" value="'+esc(codeDraft)+'" maxlength="24" placeholder="好友码" aria-label="好友码">'+c.btn('添加好友','social-add','','primary small')+'</div><h3 style="margin-top:20px">我的展示侠客 · 最多3位</h3><p class="tiny muted">主角始终展示；其他玩家能选择你公开的侠客助战。</p><div class="social-showcase">'+own.filter(h=>!h.player).map(h=>'<label><input type="checkbox" data-social-showcase value="'+esc(h.id)+'" '+((showcaseDraft||self.showcase||[]).includes(h.id)?'checked':'')+'>'+esc(h.name)+' · Lv.'+h.level+'</label>').join('')+'</div>'+c.btn('保存展示','social-showcase','','small primary')+'</section>'+
     '<section class="panel endgame-overview"><h3>五人本好友助战</h3>'+Array.from({length:4},(_,index)=>'<label class="support-row">助战 '+(index+1)+'<select class="select" data-social-support="'+index+'"><option value="">使用自己的同行侠客</option>'+friends.map(f=>'<optgroup label="'+esc(f.name)+'">'+f.heroes.map(h=>{const value=f.code+'|'+h.id;return '<option value="'+esc(value)+'" '+(supports[index]?.friendCode===f.code&&supports[index]?.heroId===h.id?'selected':'')+'>'+esc(h.name)+(h.player?'（玩家）':'（侠客）')+' · Lv.'+h.level+' · '+({tank:'承伤',healer:'治疗',dps:'输出'}[h.role]||'输出')+'</option>';}).join('')+'</optgroup>').join('')+'</select></label>').join('')+c.btn('保存助战阵容','social-supports','','small primary')+'<p class="tiny muted">选用好友数据不会消耗其物品，也不会让对方获得本次战利品。好友更新装备后，下次进入副本使用新数据。</p></section></div>'+
     '<section class="panel endgame-overview"><h3>好友名册 · '+friends.length+' 人</h3><div class="social-friends">'+friends.map(f=>'<article><h4>'+esc(f.name)+' <small>'+esc(f.code)+'</small></h4>'+f.heroes.map(h=>'<p>'+esc(h.name)+' · Lv.'+h.level+' · '+(h.player?'主角':'助战侠客')+' · 战力 '+Math.floor(h.stats.power)+'</p>').join('')+'</article>').join('')+(friends.length?'':'<p class="muted">尚未添加好友。将自己的好友码分享给同伴，相约闯荡江湖。</p>')+'</div></section>'+
     '<section class="panel endgame-overview"><h3>世界频道</h3><div class="world-feed" aria-live="polite">'+messages.map(m=>'<article class="world-message '+(m.kind==='system'?'world-system':'')+'"><span>'+esc(m.kind==='system'?'江湖喜报':m.name)+'</span><time>'+new Date(m.at).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Shanghai'})+'</time><p>'+esc(m.text)+'</p></article>').join('')+(messages.length?'':'<p class="muted">江湖静候第一声问候。</p>')+'</div><div class="social-input-row"><input class="search" id="world-message" maxlength="160" value="'+esc(draft)+'" placeholder="和世界说句话…" aria-label="世界频道消息">'+c.btn('发送','world-send','','primary small')+'</div><p class="tiny muted">只广播服务器实际获得的玄晶和稀有侠客；游客测试不会进入世界频道。</p></section>';
  }
  document.addEventListener('change',e=>{if(e.target.matches('[data-social-showcase]'))showcaseDraft=[...document.querySelectorAll('[data-social-showcase]:checked')].map(x=>x.value);if(e.target.matches('[data-social-support]'))supportDraft=[...document.querySelectorAll('[data-social-support]')].map(x=>{const [friendCode,heroId]=x.value.split('|');return {friendCode,heroId};});});
  document.addEventListener('input',e=>{if(e.target.id==='world-message')draft=e.target.value;if(e.target.id==='friend-code')codeDraft=e.target.value;});
  document.addEventListener('click',async e=>{const target=e.target.closest('[data-action]'),action=target?.dataset.action;if(!['social-refresh','social-add','social-showcase','social-supports','world-send'].includes(action))return;e.stopImmediatePropagation();if(!logged())return c.toast('请先登录账号。');if(busy)return c.toast('正在同步，请稍候。');if(action==='social-refresh'){load();return;}busy=true;
   try{if(action==='social-add'){const result=await A.addFriend(codeDraft.trim());c.adopt(result);social=result.social;codeDraft='';}
    if(action==='social-showcase'){const ids=[...document.querySelectorAll('[data-social-showcase]:checked')].map(x=>x.value);if(ids.length>3)throw Error('最多展示3位侠客。');const result=await A.showcase(ids);c.adopt(result);social=result.social;showcaseDraft=null;}
    if(action==='social-supports'){const supports=[...document.querySelectorAll('[data-social-support]')].map(x=>x.value).filter(Boolean).map(value=>{const [friendCode,heroId]=value.split('|');return {friendCode,heroId};});if(new Set(supports.map(x=>x.friendCode)).size!==supports.length)throw Error('每位好友最多派出一名角色。');const envelope=await A.setSupports(supports);c.adopt(envelope);social=envelope.social||await A.friends();supportDraft=null;}
    if(action==='world-send'){const result=await A.say(draft.trim());messages=result.messages||messages;draft='';}
    error='';if(action==='world-send')worldError='';else friendError='';c.toast(action==='world-send'?'消息已发送。':'已保存同游设置。');
   }catch(e){error=describe(e,action==='world-send'?'世界频道':'好友');c.toast(error);}finally{busy=false;if(c.ui.page==='social')c.render();}
  },true);
  return {render,refresh:load};
 }
 root.JXSocialUI={create};
})(globalThis);

;
(function(root){
  'use strict';
  const KEY='jx3-jianghu-shimeng-v1',BACKUP=KEY+':before-journey-3';
  function load(storage){
    const raw=storage.getItem(KEY);if(!raw)return {raw:null,reset:false};
    let data;try{data=JSON.parse(raw);}catch{return {raw,reset:false};}
    if(data.progression?.revision===root.JXProgression.REVISION)return {raw,reset:false};
    // Preserve the old bytes before replacing the authorized pre-rebalance save.
    storage.setItem(BACKUP,raw);storage.removeItem(KEY);
    return {raw:null,reset:true};
  }
  root.JXSaveEpoch={KEY,BACKUP,load};
})(globalThis);

;
(function(root){
  'use strict';
  let pointerHeld=false,activeUntil=0,restoringUntil=0;
  const now=()=>performance.now();
  function activity(){if(now()>restoringUntil)activeUntil=now()+550;}
  document.addEventListener('scroll',activity,{capture:true,passive:true});
  document.addEventListener('wheel',activity,{capture:true,passive:true});
  document.addEventListener('touchmove',activity,{capture:true,passive:true});
  document.addEventListener('pointerdown',event=>{if(event.button===0)pointerHeld=true;},{capture:true,passive:true});
  document.addEventListener('mousedown',event=>{if(event.button===0)pointerHeld=true;},{capture:true,passive:true});
  const release=()=>{pointerHeld=false;activeUntil=now()+180;};
  document.addEventListener('pointerup',release,{capture:true,passive:true});
  document.addEventListener('mouseup',release,{capture:true,passive:true});
  document.addEventListener('pointercancel',release,{capture:true,passive:true});
  root.addEventListener('blur',release);
  function pathFor(el,scope){
    if(el===scope)return '';
    const parts=[];
    while(el&&el!==scope){const parent=el.parentElement;if(!parent)return null;parts.unshift(el.tagName.toLowerCase()+':nth-child('+([...parent.children].indexOf(el)+1)+')');el=parent;}
    return el===scope?':scope > '+parts.join(' > '):null;
  }
  function capture(scope,includeWindow=false){
    if(!scope)return null;
    const positions=[scope,...scope.querySelectorAll('*')].filter(el=>el.scrollTop!==0||el.scrollLeft!==0).map(el=>({path:pathFor(el,scope),top:el.scrollTop,left:el.scrollLeft}));
    return {positions,window:includeWindow?{x:root.scrollX,y:root.scrollY}:null};
  }
  function restore(scope,snapshot,{resetSelector}={}){
    if(!scope||!snapshot)return;
    restoringUntil=now()+80;
    for(const pos of snapshot.positions){if(pos.path===null)continue;const el=pos.path?scope.querySelector(pos.path):scope;if(!el)continue;if(resetSelector&&el.matches(resetSelector))continue;el.scrollTop=pos.top;el.scrollLeft=pos.left;}
    if(snapshot.window)root.scrollTo(snapshot.window.x,snapshot.window.y);
  }
  root.JXScroll={capture,restore,busy:()=>pointerHeld||now()<activeUntil};
})(globalThis);

;
/* Presentation only: keep the live battle DOM while entering/leaving a large stage. */
(function(root){
  'use strict';
  let currentPage=null,enabled=true,immersive=false,panel=null,placeholder=null,host=null,origin=null,ownedFullscreen=false;
  let pendingEntry=0,restoring=false,detailsState=new Map();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const expandIcon=root.JXPixelIcons.icon('expand');
  const contractIcon=root.JXPixelIcons.icon('collapse');
  const detailKey=el=>el.dataset.guiKey||el.querySelector('summary')?.textContent.trim()||'';
  function saveDetails(){if(!currentPage)return;document.querySelectorAll('#page details.gui-details').forEach(el=>detailsState.set(currentPage+'|'+detailKey(el),el.open));}
  function restoreDetails(){restoring=true;document.querySelectorAll('#page details.gui-details').forEach(el=>{const value=detailsState.get(currentPage+'|'+detailKey(el));if(value!==undefined)el.open=value;});restoring=false;}
  function syncMotion(){document.documentElement.dataset.guiMotion=enabled&&!reduced.matches?'on':'off';}
  reduced.addEventListener('change',syncMotion);
  function syncButton(){
    document.querySelectorAll('.gui-immersive-toggle').forEach(button=>{
      button.innerHTML=(immersive?contractIcon:expandIcon)+'<span>'+(immersive?'退出沉浸':'沉浸')+'</span>';
      button.setAttribute('aria-label',immersive?'退出沉浸模式':'进入沉浸模式');
      button.setAttribute('aria-pressed',String(immersive));
      button.title=immersive?'退出沉浸模式（Esc）':'放大当前战场';
    });
  }
  function makeHost(){
    if(host?.isConnected)return host;
    host=document.createElement('section');host.className='gui-immersive-host';host.hidden=true;host.setAttribute('aria-label','沉浸历练');
    host.innerHTML='<div class="gui-immersive-heading"><span>江湖历练</span><small>Esc 退出沉浸</small><button type="button" class="btn gui-immersive-exit" data-action="gui-immersive" aria-label="退出沉浸模式">'+contractIcon+'退出沉浸</button></div><div class="gui-immersive-stage"></div>';
    document.body.append(host);return host;
  }
  function restorePanel(){
    if(panel?.isConnected&&placeholder?.isConnected)placeholder.replaceWith(panel);
    placeholder=null;
  }
  function movePanel(nextPanel){
    if(!nextPanel)return;
    panel=nextPanel;
    if(panel.parentElement===makeHost().querySelector('.gui-immersive-stage'))return;
    placeholder=document.createElement('div');placeholder.className='gui-immersive-placeholder';placeholder.setAttribute('aria-hidden','true');
    placeholder.style.height=panel.getBoundingClientRect().height+'px';panel.before(placeholder);
    host.querySelector('.gui-immersive-stage').append(panel);
  }
  function enter(){
    if(currentPage!=='adventure'||!panel?.isConnected)return false;
    origin=document.activeElement;immersive=true;makeHost().hidden=false;document.body.classList.add('gui-is-immersive');movePanel(panel);syncButton();
    const token=++pendingEntry;
    // Fullscreen is an enhancement; the same stage works in a normal browser window.
    try{const request=host.requestFullscreen?.({navigationUI:'hide'});if(request?.then)request.then(()=>{if(token!==pendingEntry||!immersive){if(document.fullscreenElement===host)document.exitFullscreen?.().catch(()=>{});return;}ownedFullscreen=document.fullscreenElement===host;}).catch(()=>{});}catch{}
    host.querySelector('.gui-immersive-exit')?.focus({preventScroll:true});return true;
  }
  function exit(returnFocus=true){
    const wasOpen=immersive;immersive=false;pendingEntry++;restorePanel();document.body.classList.remove('gui-is-immersive');
    if(host)host.hidden=true;
    if(document.fullscreenElement===host){try{document.exitFullscreen?.().catch(()=>{});}catch{}}
    ownedFullscreen=false;syncButton();
    if(wasOpen&&returnFocus){const button=origin?.isConnected?origin:document.querySelector('.gui-immersive-toggle');button?.focus({preventScroll:true});}
    origin=null;return wasOpen;
  }
  function beforeRender(){saveDetails();if(immersive)restorePanel();}
  function mount(options={}){
    const page=options.page||document.body.dataset.page;
    const changed=page!==currentPage;
    if(immersive&&page!=='adventure')exit(false);
    enabled=options.motion!==false;syncMotion();
    currentPage=page;
    panel=options.panel||document.querySelector('.gui-battle-panel');
    const scene=options.scene||panel?.querySelector('.scene');
    if(page==='adventure'&&scene&&panel){
      if(!scene.querySelector('.gui-immersive-toggle')){
        const button=document.createElement('button');button.type='button';button.className='gui-immersive-toggle';button.dataset.action='gui-immersive';scene.append(button);
      }
      if(immersive)movePanel(panel);
    }
    syncButton();restoreDetails();
    if(changed&&enabled&&!reduced.matches){document.querySelector('#page')?.animate?.([{opacity:.72},{opacity:1}],{duration:150,easing:'ease-out'});}
  }
  document.addEventListener('click',event=>{
    if(!event.target.closest('[data-action="gui-immersive"]'))return;
    event.preventDefault();event.stopImmediatePropagation();if(immersive)exit();else enter();
  },true);
  document.addEventListener('keydown',event=>{
    if(!immersive)return;
    if(event.key==='Escape'){
      // Let an open game dialog handle Escape before leaving the battle.
      if(document.querySelector('dialog[open]'))return;
      event.preventDefault();exit();return;
    }
    if(event.key==='Tab'&&!document.querySelector('dialog[open]')){
      const items=[...host.querySelectorAll('button:not(:disabled),input:not(:disabled),[tabindex="0"]')].filter(el=>{const r=el.getBoundingClientRect();return r.width&&r.height;});
      const first=items[0],last=items.at(-1);if(!first)return;
      if(event.shiftKey&&(document.activeElement===first||!host.contains(document.activeElement))){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&(document.activeElement===last||!host.contains(document.activeElement))){event.preventDefault();first.focus();}
    }
  });
  document.addEventListener('fullscreenchange',()=>{
    if(document.fullscreenElement===host){ownedFullscreen=true;return;}
    if(immersive&&ownedFullscreen)exit();
    ownedFullscreen=false;
  });
  document.addEventListener('toggle',event=>{if(!restoring&&event.target.matches?.('details.gui-details')&&currentPage)detailsState.set(currentPage+'|'+detailKey(event.target),event.target.open);},true);
  root.JXGui={mount,beforeRender,enter,exit,isImmersive:()=>immersive};
})(globalThis);

;
(function(root){
 'use strict';
 function create(c){
  const {getState,ui,esc,btn,portrait}=c,C=root.JXCosmetics;
  const selected=()=>getState().heroes.find(h=>h.uid===ui.cosmeticHero)||getState().heroes.find(h=>h.uid===getState().playerUid)||getState().heroes[0];
  function card(item,uid){const s=getState(),w=C.appearance(s,uid),wearing=w[item.type]===item.id;return '<article class="cosmetic-card '+(item.owned?'owned':'missing')+'">'+C.art(item)+'<span class="cosmetic-type">'+esc(item.type==='pet'?'跟宠':item.type==='hair'?'发型':item.visualSlot)+' · '+(item.owned?'已收藏':'未收藏')+'</span><h3>'+esc(item.name)+'</h3>'+(item.visualName!==item.name?'<small>实际造型 · '+esc(item.visualName)+'</small>':'')+'<div class="cosmetic-source">'+esc(item.source)+'</div>'+(item.target&&!item.owned?'<progress value="'+item.progress+'" max="'+item.target+'" aria-label="挂件保底进度"></progress><small>'+item.progress+' / '+item.target+' 胜</small>':'')+'<div class="cosmetic-card-actions">'+(item.owned?btn(wearing?'已展示 · 收起':'为角色展示',wearing?'cosmetic-clear':'cosmetic-equip',uid+'|'+(wearing?item.type:item.id),wearing?'small':'small primary'):btn('查看获取途径','cosmetic-source',item.id,'small'))+'</div></article>';}
  function gallery(type='pendant'){
   const s=getState(),h=selected(),items=C.catalog(s).filter(x=>x.type===type),owned=items.filter(x=>x.owned).length;
   return '<section class="cosmetic-gallery"><div class="cosmetic-gallery-heading"><div><h2>'+(type==='pet'?'跟宠图鉴':type==='hair'?'发型图鉴':'挂件图鉴')+'</h2><small>已收藏 '+owned+' / '+items.length+' · 每件均可查看获取途径</small></div>'+btn('前往外观','nav','cosmetics','small primary')+'</div><div class="cosmetic-grid">'+items.map(x=>card(x,h.uid)).join('')+'</div><details class="cosmetic-reference"><summary>造型与资料来源</summary><p>历史收藏名称和掉落沿用本作设定；挂件实际展示统一使用官网有原图的六款造型。流光款添加本作光效。纪念跟宠采用「九影」「云梦」两款正式造型；原有十二只跟宠沿用既有位图。收藏名不表示对应原作物品。</p><a href="'+C.OFFICIAL+'" target="_blank" rel="noopener">剑网3七周年官方专题 · 查看造型原图</a></details></section>';
  }
  function render(){
   const s=getState(),h=selected(),m=root.JXData.HEROES.find(x=>x.id===h.id),w=C.appearance(s,h.uid),type=ui.cosmeticTab||'pendant',items=C.catalog(s),outfits=C.outfits(s,h.uid);
   const heroTabs='<div class="cosmetic-hero-tabs"><label>选择角色 <select class="select" data-change="cosmetic-hero" aria-label="选择外观角色">'+s.heroes.map(x=>'<option value="'+x.uid+'" '+(x.uid===h.uid?'selected':'')+'>'+esc(root.JXData.HEROES.find(a=>a.id===x.id).name)+(x.uid===s.playerUid?' · 主角':'')+'</option>').join('')+'</select></label><small>每位角色独立保存搭配</small></div>';
   const tabs='<div class="tabs cosmetic-tabs">'+[['pendant','挂件'],['pet','跟宠'],['outfit','装束']].map(([id,label])=>'<button class="tab '+(id===type?'active':'')+'" data-action="cosmetic-tab" data-id="'+id+'">'+label+'</button>').join('')+'</div>';
   const slots=['pendant','pet'].map(t=>{const item=items.find(x=>x.id===w[t]);return '<div class="cosmetic-slot">'+(item?C.art(item):'<span class="cosmetic-empty-slot">＋</span>')+'<span><small>'+({pendant:'随身挂件',pet:'同行跟宠'}[t])+'</small><strong>'+esc(item?.name||'尚未选择')+'</strong></span>'+(item?btn('收起','cosmetic-clear',h.uid+'|'+t,'small'):'')+'</div>';}).join('');
   const benefitItems=C.benefits(s,h.uid),benefitPanel=benefitItems.length?'<div class="cosmetic-benefits"><strong>当前助益</strong>'+benefitItems.map(x=>'<small>'+esc(x.type+' · '+x.name+'：'+x.effect)+'</small>').join('')+'<small>珍藏外观只改变造型，保留已选择的助益；收起该部位会同时取消助益。</small></div>':'';
   const skins='<div class="cosmetic-grid">'+outfits.map(x=>'<article class="cosmetic-card '+(x.owned?'owned':'missing')+'"><div class="cosmetic-outfit-art art-'+x.artId+'"></div><h3>'+esc(x.name)+'</h3><small>'+esc(x.owned?'已结缘装束':'结缘对应门派弟子后解锁')+'</small>'+(x.owned?btn(w.outfit===x.id?'正在使用':'更换装束','cosmetic-equip',h.uid+'|outfit:'+x.id,'small primary'):'')+'</article>').join('')+'</div>';
   return '<section class="cosmetic-heading"><div><span class="eyebrow">衣冠与故友 · 角色外观</span><h2>为'+esc(m.name)+'整装</h2><p>选择角色，展示已收藏的挂件与跟宠。</p></div>'+btn('全部挂件图鉴','cosmetic-dex','pendant','small')+'</section>'+heroTabs+'<div class="cosmetic-wardrobe"><section class="panel cosmetic-preview"><div class="cosmetic-preview-scene"><div class="cosmetic-preview-actor">'+portrait(C.visualHero(s,{...m,uid:h.uid}),'cosmetic-character')+'</div></div><h3>'+esc(m.name)+'</h3><small>已同步到历练角色与同行头像</small>'+slots+benefitPanel+'</section><section class="cosmetic-choices">'+tabs+(type==='outfit'?skins:'<div class="cosmetic-grid">'+items.filter(x=>x.type===type&&x.owned).map(x=>card(x,h.uid)).join('')+'</div>'+(items.some(x=>x.type===type&&x.owned)?'':'<div class="panel cosmetic-no-items"><h3>尚未收藏'+(type==='pet'?'跟宠':'挂件')+'</h3><p>'+(type==='pet'?'野外历练与奇遇都能结识跟宠。':'通关五人秘境后开启百战，挂件可通过胜利保底或本章通宝兑换。')+'</p></div>')+btn('查看全部'+(type==='pet'?'跟宠':'挂件')+'与来源','cosmetic-dex',type,'small'))+'</section></div>';
  }
  return {render,gallery,selected};
 }
 root.JXCosmeticsUI={create};
})(globalThis);

;
/* Shared visual hierarchy. No rewards or game state are changed here. */
(function(root){
  'use strict';
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const paths={coin:'M12 3a9 9 0 1 0 .1 0M9 9h6v6H9Z',jade:'m12 2 8 8-8 12-8-12ZM4 10h16',badge:'m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1Z',exp:'m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z',flask:'M9 3h6m-5 0v7L5 20h14l-5-10V3M8 15h8',scroll:'M6 3h13v18H5V5L3 3Zm3 5h7m-7 5h7',tea:'M3 8h14v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5Zm14 2h3v6h-3M7 2v3m5-3v3',ore:'m4 8 8-5 8 5 2 12H2ZM4 8l8 12 8-12',herb:'M20 3C8 1 2 6 4 14s15 8 16-11ZM4 20 15 9',bag:'M5 8h14l2 13H3Zm3 0V6a4 4 0 0 1 8 0',check:'m4 12 5 5L20 6'};
  const inks={coin:['#bc7b20','#f5d06b'],jade:['#358674','#8be0bf'],badge:['#b16d32','#efb66b'],exp:['#7e67ad','#d2bbf5'],flask:['#b65364','#f3a6b4'],scroll:['#a58045','#f1db9d'],tea:['#62843c','#bddb80'],ore:['#6c89a5','#b3cfdf'],herb:['#3e8662','#9ddd98'],bag:['#9a693f','#e5b36b'],check:['#358674','#a1e5c4']};
  function glyph(kind){const [ink,fill]=inks[kind]||inks.bag,line='<svg class="icon visual-glyph" viewBox="0 0 24 24" aria-hidden="true" style="--glyph-ink:'+ink+';--glyph-fill:'+fill+'"><path class="visual-glyph-shadow" d="'+(paths[kind]||paths.bag)+'"/><path d="'+(paths[kind]||paths.bag)+'"/><path class="visual-glyph-glint" d="M7 5h3M5 7v2"/></svg>';return root.JXPixelIcons?.icon(kind||'bag',line)||line;}
  const kinds={silver:'coin',jade:'jade',renown:'badge',exp:'exp',cultivation:'exp',medicine:'flask',invite:'scroll',tea:'tea',ore:'ore',herb:'herb',stones:'jade',supplies:'bag'};
  const names={silver:'银两',jade:'通宝',renown:'侠名',cultivation:'修为',stones:'五行石',supplies:'副本补给'};
  const label=id=>root.JXData.ITEMS.find(i=>i.id===id)?.name||names[id]||id;
  function token(id,n,prefix=''){return '<span class="visual-token token-'+esc(id)+'" title="'+esc(label(id))+'">'+glyph(kinds[id])+'<span><small>'+esc(label(id))+'</small><b>'+esc(prefix)+Number(n).toLocaleString('zh-CN')+'</b></span></span>';}
  function rewards(reward){if(!reward)return '';if(typeof reward==='string')return esc(reward);return Object.entries(reward).flatMap(([id,n])=>id==='items'?Object.entries(n).map(([key,value])=>token(key,value,'×')):[token(id==='exp'?'cultivation':id,n,'+')]).join('');}
  function inventory(s){return '<section class="visual-inventory inventory-quick-grid" aria-label="行囊道具，点击格子查看详情">'+root.JXData.ITEMS.map(item=>'<button type="button" class="bag-cell quality-rare'+(!(s.inventory[item.id]>0)?' is-depleted':'')+'" data-action="item" data-id="'+esc(item.id)+'" aria-label="'+esc(item.name+'，数量 '+(s.inventory[item.id]||0)+'，查看详情')+'">'+(root.JXPixelIcons?.item(item.id)||glyph(kinds[item.id]))+'<span class="bag-cell-name">'+esc(item.name)+'</span><b class="bag-cell-count">×'+Number(s.inventory[item.id]||0).toLocaleString('zh-CN')+'</b></button>').join('')+'</section>';}
  const pageIcons={journey:'flag',team:'people',dex:'book',training:'leaf',equipment:'hammer',cosmetics:'star',forge:'star',exchange:'badge',craft:'hammer',map:'map',dungeons:'tower',endgame:'trophy',trials:'flag',challenges:'sword',social:'heart',quests:'scroll',tea:'tea',scenarios:'star',shop:'bag',more:'menu',achievements:'trophy',guide:'help',settings:'gear'};
  function disclosure(node,key,title){
    if(!node||node.closest('details'))return;
    const d=document.createElement('details');d.className='gui-details visual-disclosure';d.dataset.guiKey=key;d.dataset.guiDetail=key;
    const summary=document.createElement('summary');summary.textContent=title;
    const body=document.createElement('div');body.className='gui-details-body';node.before(d);body.append(node);d.append(summary,body);
  }
  function mount(container,page,s,icon){
    const h=container.querySelector('.page-heading h1');
    if(h&&!h.querySelector('.visual-page-icon'))h.insertAdjacentHTML('afterbegin','<span class="visual-page-icon">'+icon(pageIcons[page]||'star')+'</span>');
    container.querySelectorAll('.gui-more-grid .gui-function-list .btn').forEach(el=>{el.classList.add('visual-function');el.dataset.visualKind=el.dataset.id;el.insertAdjacentHTML('beforeend','<span class="visual-enter" aria-hidden="true">↗</span>');});
    container.querySelectorAll('.settings-row').forEach((el,i)=>el.querySelector('h3')?.insertAdjacentHTML('afterbegin',icon(['sun','sound','star','people','save','flag'][i]||'gear')));
    // Explanatory prose remains available, while costs, readiness and actions stay visible.
    for(const selector of ['.feature-card:not(.scenario-card) > p','.guide-block > p','.cosmetic-card > .cosmetic-source']){
      container.querySelectorAll(selector).forEach((el,i)=>disclosure(el,page+'-'+selector+'-'+i,selector.includes('source')?'获取来源':selector.includes('guide')?'查看玩法':'说明与条件'));
    }
    container.querySelectorAll('.scenario-dialogue').forEach((el,i)=>disclosure(el,'story-'+i,'阅读这段故事'));
    // Keep the active chapter immediate; other eras are available on demand.
    if(page==='dungeons'){
      const current=root.JXProgression.current(s).expansion.id,groups=new Map();
      container.querySelectorAll('.dungeon-card').forEach(card=>{
        const id=card.querySelector('[data-action="expedition"]')?.dataset.id.split('|')[0],d=root.JXData.DUNGEONS.find(x=>x.id===id);if(!d||d.expansionId===current)return;
        if(!groups.has(d.expansionId))groups.set(d.expansionId,[]);groups.get(d.expansionId).push(card);
      });
      for(const [id,cards] of groups){const exp=root.JXData.EXPANSIONS.find(x=>x.id===id),wrap=document.createElement('section');cards[0].before(wrap);cards.forEach(card=>wrap.append(card));wrap.className='visual-era-cards';disclosure(wrap,'dungeon-era-'+id,exp.name+' · '+cards.length+' 座秘境');}
    }
    if(page==='trials'){
      const current=root.JXProgression.current(s).expansion.id,items=root.JXTrials.info(s),others=[...container.querySelectorAll('.exchange-grid > .exchange-offer')].filter((_,i)=>items[i]?.id!==current);
      if(others.length){const wrap=document.createElement('section');others[0].before(wrap);others.forEach(el=>wrap.append(el));wrap.className='visual-era-cards';disclosure(wrap,'other-sect-trials','其他章节试炼 · '+others.length);}
    }
    if(page==='guide'){
      const guide=[['map','寻找装备','野外 → 小队 → 团队'],['equipment','整备主角','穿戴 → 精炼 → 镶嵌'],['journey','完成历程','核对目标 → 开启下一章']];
      container.insertAdjacentHTML('afterbegin','<nav class="visual-journey" aria-label="成长路线">'+guide.map(([id,title,hint])=>'<button type="button" data-action="nav" data-id="'+id+'"><span><strong>'+title+'</strong><small>'+hint+'</small></span></button>').join('')+'</nav>');
    }
    container.querySelectorAll('.bar').forEach(el=>{
      const width=parseFloat(el.firstElementChild?.style.width);if(!Number.isFinite(width))return;
      el.setAttribute('role','progressbar');el.setAttribute('aria-valuemin','0');el.setAttribute('aria-valuemax','100');el.setAttribute('aria-valuenow',String(Math.round(Math.max(0,Math.min(100,width)))));
      el.setAttribute('aria-label',el.closest('article,section')?.querySelector('h3,h2')?.textContent||'进度');
    });
  }
  let feedbackAnimation=null;
  function feedback(action,result){
    if(!result?.ok||!/^eq-(equip|auto-|refine|socket|current|color)/.test(action||''))return;
    feedbackAnimation?.cancel();feedbackAnimation=null;
    const el=document.querySelector('.quick-result,.paperdoll-inspector,.equipment-first-step');
    if(!el||root.matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.guiMotion==='off')return;
    feedbackAnimation=el.animate([{outline:'2px solid var(--ui-accent)',outlineOffset:'2px'},{outline:'2px solid transparent',outlineOffset:'5px'}],{duration:650,easing:'ease-out'});
  }
  root.JXVisualUI={glyph,token,rewards,inventory,mount,feedback};
})(globalThis);

;
/* A voluntary spotlight tour. Navigation is the only game callback. */
(function(root){
  'use strict';
  const PREFIX='jx3-onboarding-v1:';
  const memory=new Map();
  const paths={sword:'M4 20 17 7 21 3 17 4 5 16M3 14l7 7M2 22l4-4',map:'m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16',armor:'m8 3 4 3 4-3 6 6-4 4-2-2v10H8V11l-2 2-4-4Z',people:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 4a4 4 0 0 1 0 8m6 9v-2a4 4 0 0 0-3-4M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',tower:'M6 21V10h12v11M4 21h16M5 10l7-8 7 8H5Zm4 11v-6h6v6',flag:'M4 22V3c5-5 10 5 16 0v11c-6 5-11-5-16 0',arrow:'M5 12h14m-5-5 5 5-5 5',back:'M19 12H5m5-5-5 5 5 5',locate:'M12 8v8m-4-4h8M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'};
  const icon=name=>root.JXPixelIcons.icon(name);
  const steps=[
    {id:'adventure',label:'历练',icon:'sword',page:'adventure',title:'自动历练，先看一场战斗',copy:'主角自动施展已配置的武学；侠客卡在后台提供辅助。点击高亮区域的暂停或倍速按钮，就能控制历练节奏。',selector:'.scene-controls'},
    {id:'field',label:'野外',icon:'map',page:'map',title:'先在野外积攒装备',copy:'地图按资料片和章节列出路线、收益估算与完整掉落。点击高亮按钮出发，野外首领提供入门装备与五行石。',selector:'.route-detail [data-action="travel"]'},
    {id:'equipment',label:'穿戴',icon:'armor',page:'equipment',title:'把好装备穿到主角身上',copy:'点击高亮的帽子格查看装备。更好的掉落自动穿戴；一键镶嵌会自动合成至默认六级五行石，材料不足会明确提示。',selector:'.paperdoll-slot[data-id="head"]'},
    {id:'five',label:'五人',icon:'people',page:'dungeons',title:'完成五人秘境，准备会战',copy:'满足入口条件后再挑战。主角配合后台辅助卡作战；联网可选择好友异步助力，其余位置由援军补齐。',kind:'dungeon'},
    {id:'raid',label:'团本',icon:'tower',page:'dungeons',title:'挑战团本，收集本章套装',copy:'普通团本优先补齐本门缺件；更好的掉落自动穿戴，通关后也能用侠名兑换。',kind:'raid'},
    {id:'graduation',label:'推进',icon:'flag',page:'journey',title:'首通向前走，刷装随时回头',copy:'按路线首次通关即可继续下一站，普通团本通关后开启下一资料片。套装、精炼和挑战难度属于可选追求；选择推进模式可自动前往下一站。',selector:'.graduation'}
  ];
  let context=null,key=null,record=null,coach=null,target=null,returnButton=null,signature='',origin=null,shade=null,frame=0,spacer=null;
  function hash(value){let n=2166136261;for(const c of String(value)){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return (n>>>0).toString(36);}
  function keyFor(state,scope='guest'){return PREFIX+hash(scope)+':'+String(state.createdAt)+':'+hash(state.playerUid||state.heroes?.[0]?.uid||'');}
  function load(k){
    let value=memory.get(k);
    try{value=JSON.parse(root.localStorage.getItem(k)||'null')||value;}catch{}
    return value&&['active','completed','skipped'].includes(value.status)&&Number.isInteger(value.step)&&value.step>=0&&value.step<steps.length?{status:value.status,step:value.step}:null;
  }
  function persist(){if(!key||!record)return;memory.set(key,{...record});try{root.localStorage.setItem(key,JSON.stringify(record));}catch{}}
  function active(){return record?.status==='active';}
  function makeCoach(){
    if(!coach){
      coach=document.createElement('section');coach.className='onboarding-coach';coach.hidden=true;coach.setAttribute('aria-label','初入江湖引导');
      coach.innerHTML='<div class="onboarding-top"><span class="onboarding-kicker">初入江湖 <b class="onboarding-counter"></b></span><button type="button" class="onboarding-skip" data-onboarding="skip">跳过引导</button></div><ol class="onboarding-progress" aria-label="六步成长路线">'+steps.map(step=>'<li data-onboarding-step="'+step.id+'">'+icon(step.icon)+'<span>'+step.label+'</span></li>').join('')+'</ol><div class="onboarding-message" role="status" aria-live="polite" aria-atomic="true"><h2></h2><p></p></div><div class="onboarding-actions"><button type="button" class="btn" data-onboarding="back">'+icon('back')+'上一步</button><button type="button" class="btn" data-onboarding="locate">'+icon('locate')+'查看位置</button><button type="button" class="btn primary" data-onboarding="next"><span>下一步</span>'+icon('arrow')+'</button></div>';
      coach.addEventListener('click',event=>{const action=event.target.closest('[data-onboarding]')?.dataset.onboarding;if(!action)return;event.preventDefault();event.stopPropagation();if(action==='skip')finish('skipped');else if(action==='back')changeStep(record.step-1);else if(action==='next'){if(record.step===steps.length-1)finish('completed');else changeStep(record.step+1);}else if(action==='locate')locate();});
      coach.querySelector('.onboarding-message').insertAdjacentHTML('beforebegin','<div class="onboarding-illustration" aria-hidden="true"></div>');
      coach.querySelector('.onboarding-message').insertAdjacentHTML('afterend','<p class="onboarding-hint">亮起的是实际操作区域；可点击体验，也可直接下一步。</p>');
      shade=document.createElement('div');shade.className='onboarding-shade';shade.hidden=true;shade.setAttribute('aria-hidden','true');shade.innerHTML='<div></div><div></div><div></div><div></div><span class="onboarding-hole"></span>';document.body.append(shade);
      spacer=document.createElement('div');spacer.className='onboarding-spacer';spacer.hidden=true;spacer.setAttribute('aria-hidden','true');document.body.append(spacer);
    }
    if(coach.parentElement!==document.body)document.body.append(coach);
    if(!returnButton){returnButton=document.createElement('button');returnButton.type='button';returnButton.className='onboarding-return btn';returnButton.hidden=true;returnButton.innerHTML=icon('back')+'返回引导';returnButton.addEventListener('click',()=>{coach.scrollIntoView({block:'start',behavior:'auto'});coach.querySelector('[data-onboarding="next"]').focus({preventScroll:true});returnButton.hidden=true;});document.body.append(returnButton);}
    return coach;
  }
  function clearTarget(){if(target){target.classList.remove('onboarding-target');target.removeAttribute('data-onboarding-highlight');target=null;}if(shade)shade.hidden=true;}
  function geometry(){
    frame=0;if(!shade||!active()||coach?.hidden||!target?.isConnected||document.querySelector('dialog[open]')||document.body.classList.contains('gui-is-immersive')){if(shade)shade.hidden=true;return;}
    const needed=Math.ceil(coach.getBoundingClientRect().height+70)+'px';if(spacer&&spacer.style.height!==needed){spacer.style.height=needed;revealTarget();}
    const rect=target.getBoundingClientRect(),w=document.documentElement.clientWidth,h=innerHeight;
    const left=Math.max(0,Math.min(w,rect.left-6)),top=Math.max(0,Math.min(h,rect.top-6)),right=Math.max(left,Math.min(w,rect.right+6)),bottom=Math.max(top,Math.min(h,rect.bottom+6));
    shade.hidden=bottom<=top||right<=left;if(shade.hidden)return;
    const boxes=[[0,0,w,top],[0,top,left,bottom-top],[right,top,w-right,bottom-top],[0,bottom,w,h-bottom],[left,top,right-left,bottom-top]];
    [...shade.children].forEach((el,i)=>{const [x,y,width,height]=boxes[i];Object.assign(el.style,{left:x+'px',top:y+'px',width:width+'px',height:height+'px'});});
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(geometry);}
  function findTarget(){
    const step=steps[record.step];if(context.page!==step.page)return null;
    if(step.selector){const found=document.querySelector(step.selector);return found?.getClientRects().length?found:step.id==='equipment'?document.querySelector('.gui-equipment-tabs'):null;}
    const expansion=root.JXProgression?.current(context.state)?.expansion?.id;
    const dungeon=root.JXData?.DUNGEONS?.find(x=>x.expansionId===expansion&&x.kind===step.kind&&(step.kind!=='raid'||x.main!==false))||root.JXData?.DUNGEONS?.find(x=>x.expansionId===expansion&&x.kind===step.kind);
    const button=dungeon&&[...document.querySelectorAll('[data-action="expedition"]')].find(el=>el.dataset.id===dungeon.id+'|normal');
    return button?.closest('.dungeon-modes')||button||document.querySelector('.expansion-dungeons');
  }
  function updateTarget(){
    const next=active()?findTarget():null;
    if(next!==target){clearTarget();target=next;}
    if(target){target.classList.add('onboarding-target');target.dataset.onboardingHighlight=steps[record.step].id;}
    schedule();
  }
  function paint(){
    if(!coach)return;
    const hidden=!active()||document.body.classList.contains('at-entry')||document.body.classList.contains('gui-is-immersive');coach.hidden=hidden;
    if(spacer)spacer.hidden=hidden;
    if(hidden){clearTarget();if(returnButton)returnButton.hidden=true;return;}
    const step=steps[record.step],nextSignature=key+'|'+record.step;
    if(signature!==nextSignature){
      signature=nextSignature;
      coach.querySelector('.onboarding-counter').textContent=(record.step+1)+' / '+steps.length;
      coach.querySelector('h2').textContent=step.title;coach.querySelector('.onboarding-message p').textContent=step.copy;
      const previews={adventure:['sword','clock','check'],field:['map','arrow','gift'],equipment:['armor','arrow','check'],five:['people','arrow','tower'],raid:['tower','arrow','gift'],graduation:['flag','arrow','check']};
      coach.querySelector('.onboarding-illustration').innerHTML=previews[step.id].map(name=>name==='armor'?(root.JXPixelIcons?.slot('chest')||icon(name)):icon(name)).join('');
      coach.querySelector('[data-onboarding="back"]').disabled=record.step===0;
      coach.querySelector('[data-onboarding="next"] span').textContent=record.step===steps.length-1?'完成引导':'下一步';
      coach.querySelectorAll('[data-onboarding-step]').forEach((el,i)=>{el.classList.toggle('done',i<record.step);if(i===record.step)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
    }
    updateTarget();
  }
  function navigateStep(){
    const step=steps[record.step];if(context.page!==step.page&&typeof context.navigate==='function')context.navigate(step.page);
    paint();
    revealTarget();schedule();
  }
  function revealTarget(){
    if(!target)return;target.scrollIntoView({block:'center',behavior:'auto'});
    const rect=target.getBoundingClientRect(),card=coach.getBoundingClientRect();
    if(rect.right>card.left&&rect.left<card.right&&rect.bottom>card.top-14)root.scrollBy({top:rect.bottom-card.top+20,behavior:'auto'});
  }
  function changeStep(index){
    if(!active()||index<0||index>=steps.length)return;
    const focus=coach?.contains(document.activeElement)?document.activeElement:null;
    record.step=index;persist();if(returnButton)returnButton.hidden=true;navigateStep();
    if(focus?.isConnected&&!focus.disabled)focus.focus({preventScroll:true});
  }
  function locate(){
    if(!active())return;navigateStep();updateTarget();
    if(target){revealTarget();returnButton.hidden=false;}
  }
  function finish(status='completed'){
    if(!active())return;record.status=status;persist();const ownFocus=coach?.contains(document.activeElement)||document.activeElement===returnButton;paint();
    if(ownFocus){const destination=origin?.isConnected?origin:document.querySelector('#page');if(destination){if(!destination.matches('button,a,input,select,[tabindex]'))destination.tabIndex=-1;destination.focus({preventScroll:true});}}
  }
  function reopen(){
    if(!context||!key)return false;origin=document.activeElement;record={status:'active',step:0};persist();makeCoach();signature='';navigateStep();return true;
  }
  function mount(options={}){
    if(!options.state||!document.querySelector('.workspace>#page')){suspend();return;}
    context={...options,page:options.page||document.body.dataset.page||'adventure'};
    const nextKey=keyFor(options.state,options.scope||'guest'),changed=nextKey!==key;
    if(changed){clearTarget();key=nextKey;record=load(key);signature='';}
    if(options.isNew&&!record){record={status:'active',step:0};persist();}
    if(active()){makeCoach();paint();if(changed)navigateStep();}else paint();
  }
  function suspend(){if(coach)coach.hidden=true;if(returnButton)returnButton.hidden=true;if(spacer)spacer.hidden=true;clearTarget();}
  root.addEventListener('resize',schedule);document.addEventListener('scroll',schedule,true);document.addEventListener('fullscreenchange',schedule);document.addEventListener('click',()=>setTimeout(schedule,0));
  document.addEventListener('keydown',event=>{if(event.key!=='Escape'||!active()||coach?.hidden||document.querySelector('dialog[open]')||document.body.classList.contains('gui-is-immersive'))return;event.preventDefault();finish('skipped');});
  root.JXOnboarding={mount,reopen,start:reopen,skip:()=>finish('skipped'),suspend,status:()=>record?{...record,active:active(),total:steps.length}:null};
})(globalThis);

;
(function(root){
  'use strict';
  let complete=false, pending=null,failed=[];
  function resources(){
    const urls=new Set();
    const scan=text=>{for(const m of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)){const value=m[1].trim();if(!value.startsWith('data:'))urls.add(new URL(value,document.baseURI).href);}};
    const rules=list=>{for(const rule of list){scan(rule.cssText||'');if(rule.cssRules)rules(rule.cssRules);}};
    for(const sheet of document.styleSheets){try{rules(sheet.cssRules);}catch{}}
    scan(document.documentElement.getAttribute('style')||'');
    return [...urls];
  }
  function load(url){return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(Error('资源下载超时')),120000);
    const finish=callback=>value=>{clearTimeout(timer);callback(value);};
    if(/\.(?:woff2?|ttf|otf)(?:[?#]|$)/i.test(url)){fetch(url).then(r=>{if(!r.ok)throw Error('字体下载失败');return r.arrayBuffer();}).then(finish(resolve),finish(reject));return;}
    const img=new Image();img.onload=()=>{if(img.decode)img.decode().then(finish(resolve),finish(resolve));else finish(resolve)();};img.onerror=finish(reject);img.src=url;
  });}
  async function prepare(){
    if(complete)return;if(pending)return pending;
    pending=(async()=>{
      const target=document.querySelector('#app');
      target.innerHTML='<main class="asset-loading" aria-busy="true"><div class="asset-loading-inner"><span class="asset-loading-seal" aria-hidden="true">梦</span><p class="eyebrow">山河入梦 · 备好行囊</p><h1>正在铺开这幅江湖</h1><p>先下载场景、侠客与装备图素，再进入登录界面。</p><div class="asset-progress-heading"><span id="asset-phase" role="status" aria-live="polite">正在清点图素…</span><strong id="asset-percent">0%</strong></div><progress id="asset-progress" max="100" value="0" aria-label="江湖图素下载进度"></progress><p id="asset-count">首次下载需要一点时间；已缓存图素将自动复用。</p><p class="tiny muted">请保持此页打开，完成后自动进入。后续切页无需再次等待图素下载。</p><div id="asset-recovery"></div></div></main>';
      const urls=resources();let done=0,queue=urls.slice(),failures=[];
      document.querySelector('#asset-phase').textContent='正在下载并检查图素…';
      const paint=()=>{const percent=urls.length?Math.floor(done/urls.length*100):100;document.querySelector('#asset-percent').textContent=percent+'%';document.querySelector('#asset-progress').value=percent;document.querySelector('#asset-count').textContent='图素 '+done+' / '+urls.length+' 已就绪';};
      async function batch(){let cursor=0;const current=queue;failures=[];await Promise.all(Array.from({length:Math.min(6,current.length)},async()=>{while(cursor<current.length){const url=current[cursor++];try{await load(url);done++;paint();}catch{failures.push(url);}}}));failed=failures.slice();}
      while(true){await batch();if(!failures.length)break;document.querySelector('#asset-phase').textContent=failures.length+' 项暂未下载完成';document.querySelector('#asset-recovery').innerHTML='<p>网络暂时不稳定，已完成的图素会保留。</p><button class="btn primary" id="asset-retry">重试未完成图素</button>';await new Promise(resolve=>document.querySelector('#asset-retry').onclick=resolve);document.querySelector('#asset-recovery').innerHTML='';document.querySelector('#asset-phase').textContent='正在补齐图素…';queue=failures.slice();}
      document.querySelector('#asset-phase').textContent='图素已就绪，正在进入江湖';paint();complete=true;
    })().finally(()=>{pending=null;});return pending;
  }
  root.JXAssets={prepare,resources,get ready(){return complete;},get failed(){return failed.slice();}};
})(globalThis);

;
(function(root){
  'use strict';
  const cache=new Map();
  function sections(entries){return [{id:'field',name:'山河历练',desc:'银两 · 修为',entries:entries.filter(r=>!r.isDungeon&&r.main!==false)},{id:'side',name:'支线寻访',desc:'侠影 · 材料',entries:entries.filter(r=>!r.isDungeon&&r.main===false)},{id:'squad',name:'五人秘境',desc:'小队装备 · 首通推进',entries:entries.filter(r=>r.isDungeon&&r.kind!=='raid')},{id:'raid',name:'团队秘境',desc:'套装 · 神兵材料',entries:entries.filter(r=>r.isDungeon&&r.kind==='raid')}].filter(x=>x.entries.length);}
  function forecast(state,route){
    const dungeon=route.isDungeon?route:root.JXData.DUNGEONS.find(d=>d.id===route.dungeonId);
    if(dungeon){const linked=root.JXData.ROUTES.find(r=>r.id===dungeon.routeId);if(!linked)return {dungeon:true,silver:dungeon.bosses.length*(60+dungeon.level*3),jade:0,renown:dungeon.bosses.length*25};route=linked;}
    const E=root.JXEngine,player=state.heroes.find(h=>h.uid===state.playerUid)||state.heroes[0];
    if(!E.routeUnlocked(state,route))return {locked:true,silver:0,renown:0};
    const cardBonuses=root.JXCards?.bonuses(state),key=JSON.stringify([route.id,E.teamPower(state),state.speed,player.level,player.skillLevel,player.role,player.martialBuild,player.equipment,player.enhancements,player.colorStone,player.colorStoneLevel,cardBonuses,state.activePet,state.endgame?.equipped,state.progression?.index,state.badges]);
    const firstClearJade=state.badges.includes(route.id)?0:20;
    if(cache.has(key))return {...cache.get(key),firstClearJade};
    const s=JSON.parse(JSON.stringify(state));s.routeId=route.id;s.routeProgress=0;s.routeLoop=[];s.autoAdvance=false;s.autoInvite=false;s.pauseAfterBattle=false;s.battle=null;s.running=true;s.adventure={...s.adventure,stepTimer:0,restSeconds:0,dungeonBossIndex:0};if(s.endgame)s.endgame.active=null;
    for(const h of s.heroes)h.hp=E.getHeroStats(h).hp;
    let seed=1729;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    const before={silver:s.silver,jade:s.jade,renown:s.renown,wins:s.stats.wins,defeats:s.stats.defeats};const seconds=180;
    // A failed route retreats to another location. Stop immediately, rather than
    // projecting the easier location's rewards as this chapter's income.
    for(let elapsed=0;elapsed<seconds;){const step=Math.min(1.4,seconds-elapsed);E.tick(s,step*(state.speed||1),rng,step);elapsed+=step;if(s.routeId!==route.id||s.stats.defeats>before.defeats)break;}
    const value={silver:Math.max(0,Math.round((s.silver-before.silver)*3600/seconds)),jade:0,renown:Math.max(0,Math.round((s.renown-before.renown)*3600/seconds)),wins:s.stats.wins-before.wins,defeated:s.stats.defeats>before.defeats,firstClearJade,locked:!E.routeUnlocked(state,route.id)};
    if(cache.size>80)cache.clear();cache.set(key,value);return value;
  }
  function yieldView(s,r,esc){
    const f=forecast(s,r),n=v=>Math.floor(v).toLocaleString('zh-CN'),icon=name=>root.JXPixelIcons?.icon(name)||'';
    const amount=(value)=>f.locked?'首通前站开放':f.dungeon?'每次通关 '+n(value):'约 '+n(value)+' / 时';
    const explanation=(f.firstClearJade?'首次通关另得20侠玉；':'')+(f.locked?'解锁后按主角实力估算。':f.defeated?'当前构筑无法稳定刷取，优先更换装备或调整武学。':'按当前主角、辅助卡和倍速进行180秒刷取模拟；不含签到、离线折算，实际收益随战斗变化。');
    return '<section aria-label="章节收益速度"><div class="yield-strip"><div><small>'+icon('coin')+'银两速度</small><strong>'+amount(f.silver)+'</strong></div><div><small>'+icon('jade')+'通宝速度</small><strong>百战获取</strong><small>本路线无持续版本通宝</small></div><div><small>'+icon('badge')+'侠名速度</small><strong>'+amount(f.renown)+'</strong></div></div><details class="gui-details"><summary>收益与通宝来源</summary><div class="gui-details-body"><p class="tiny muted">'+esc(explanation)+'</p><p class="tiny muted">版本通宝：本章五人秘境首通后，百战每胜8枚；间隔 '+(root.JXEndgame?.INTERVAL||60)+' 秒。普通历练、侠玉与版本通宝分别结算。</p></div></details></section>';
  }
  root.JXChapterInfo={sections,forecast,yieldView};
})(globalThis);

;
(function(root){
  'use strict';
  const n=value=>Number.isFinite(value)?Math.max(0,Math.floor(value)):0;
  const counters=s=>({wins:n(s.stats.wins),challenges:n(s.systems?.total?.challenges),tea:n(s.endgame?.checkin?.total)});
  const WEEKLY=[{id:'wins',title:'行侠一周',desc:'本周赢得35场历练',target:35,reward:{silver:1800,jade:20},page:'adventure'},{id:'challenges',title:'共赴风雨',desc:'本周参加5次活动挑战',target:5,reward:{silver:1200,jade:15},page:'activities'},{id:'tea',title:'花萼常来客',desc:'本周完成3天签到',target:3,reward:{silver:1000,jade:15},page:'tea'}];
  function init(s){root.JXSystems.init(s);const week=s.systems.week;if(!s.activities)s.activities={version:1,week,base:counters(s),claimed:[],firstDayClaimed:false};const a=s.activities;if(a.week<week){a.week=week;a.base=counters(s);a.claimed=[];}return a;}
  function firstDay(s){const a=init(s),player=s.heroes.find(h=>h.uid===s.playerUid)||s.heroes[0];const tasks=[{label:'历练赢得5场胜利',done:s.stats.wins>=5,page:'adventure'},{label:'主角穿戴1件装备',done:Object.keys(player?.equipment||{}).length>0,page:'equipment'},{label:'在花萼楼完成首次签到',done:n(s.endgame?.checkin?.total)>0,page:'tea'}];return {tasks,claimed:a.firstDayClaimed,ready:tasks.every(t=>t.done),reward:{silver:600,jade:10}};}
  function weekly(s){const a=init(s),current=counters(s);return WEEKLY.map(t=>({...t,progress:Math.min(t.target,Math.max(0,current[t.id]-a.base[t.id])),claimed:a.claimed.includes(t.id)}));}
  function claim(s,id){const a=init(s),task=id==='first-day'?firstDay(s):weekly(s).find(x=>x.id===id);if(!task)return {ok:false,message:'没有这项活动奖励。'};if(task.claimed)return {ok:false,message:'奖励已经领取。'};if(!(id==='first-day'?task.ready:task.progress>=task.target))return {ok:false,message:'完成活动目标后即可领取。'};for(const key of ['silver','jade'])s[key]+=task.reward[key]||0;s.stats.silverEarned+=task.reward.silver||0;if(id==='first-day')a.firstDayClaimed=true;else a.claimed.push(id);return {ok:true,message:'活动奖励已收入行囊。',rewards:task.reward};}
  function validateSave(s){if(s.activities===undefined)return true;const a=s.activities,integer=v=>Number.isSafeInteger(v)&&v>=0&&v<=1e12;if(!a||a.version!==1||!integer(a.week)||!a.base||Object.keys(counters(s)).some(k=>!integer(a.base[k]))||!Array.isArray(a.claimed)||a.claimed.length>3||new Set(a.claimed).size!==a.claimed.length||a.claimed.some(id=>!WEEKLY.some(t=>t.id===id))||typeof a.firstDayClaimed!=='boolean')throw Error('活动周常存档无效。');return true;}
  root.JXActivities={init,firstDay,weekly,claim,validateSave};
  // Calendar callers run in both guest and authoritative account sessions.
  // Roll the baseline at the boundary, before any new-week battles are earned;
  // opening the activity screen later must not discard those battles.
  const syncCalendar=root.JXSystems.syncCalendar;
  root.JXSystems.syncCalendar=function(s,...args){init(s);const result=syncCalendar.call(this,s,...args);if(result.ok)init(s);return result;};
})(globalThis);

;
(function(root){
  'use strict';
  const labels={activities:'初入江湖',quests:'日常行侠',weekly:'本周目标','activity-dungeon':'秘境会战','activity-world':'江湖大敌','activity-tower':'试炼之地','activity-underground':'江湖游历','activity-factory':'采集百工','activity-support':'亲友助战'};
  const icons={dungeon:'people',world:'sword',tower:'tower',underground:'map',factory:'leaf'};
  function create(c){const {esc,btn,icon}=c;
    const rewardView=r=>root.JXVisualUI.rewards(r);
    const meter=(progress,target)=>'<div class="bar activity-progress"><span style="width:'+Math.min(100,progress/Math.max(1,target)*100)+'%"></span></div>';
    const banner=(ic,title,tag,cls='')=>'<section class="activity-scene '+cls+'"><div class="activity-scene-emblem">'+icon(ic)+'</div><div><small>'+esc(tag)+'</small><h2>'+esc(title)+'</h2></div></section>';
    function title(page){const id=page.replace('activity-',''),challenge=root.JXSystems.challenges(c.getState()).find(x=>x.id===id);return challenge?.name||labels[page]||'江湖活动';}
    function sidebar(page){const s=c.getState(),A=root.JXActivities,first=A.firstDay(s);if(page==='activities')return {text:first.claimed?'✓':first.ready?'可领':first.tasks.filter(x=>x.done).length+'/'+first.tasks.length,ready:first.ready&&!first.claimed};
      if(page==='tea'){const t=root.JXEndgame.checkInInfo(s);return {text:t.claimed?'已签':'可领',ready:!t.claimed};}
      if(page==='quests'||page==='weekly'){const list=page==='quests'?root.JXSystems.quests(s):A.weekly(s),ready=list.filter(t=>!t.claimed&&t.progress>=t.target).length;return {text:ready?ready+'可领':list.filter(t=>t.claimed).length+'/'+list.length,ready:!!ready};}
      const ch=root.JXSystems.challenges(s).find(x=>page==='activity-'+x.id);if(ch)return {text:!ch.unlocked?'未开':ch.completed?'完成':Math.max(0,ch.maxAttempts-ch.attempts)+'次',locked:!ch.unlocked};
      if(page==='endgame'){const chapter=root.JXProgression.current(s).expansion.id,t=root.JXEndgame.info(s).find(x=>x.id===chapter);return {text:t?.ready?'常驻':'未开',locked:!t?.ready};}
      if(page==='activity-support')return {text:root.JXAccount.status().authenticated?'联网':'游客'};return {text:''};
    }
    function claimButton(task,id,isWeek=true){const ready=task.ready||task.progress>=task.target,action=isWeek?'activity-claim':'quest';return '<button class="btn '+(ready&&!task.claimed?'primary':'')+'" data-action="'+action+'" data-id="'+esc(id)+'" '+(task.claimed||!ready?'disabled':'')+'>'+(task.claimed?icon('check')+'已领取':ready?'领取奖励':'进行中')+'</button>';}
    function render(tab='first'){const s=c.getState(),A=root.JXActivities;
      if(tab==='first'){const task=A.firstDay(s),count=task.tasks.filter(t=>t.done).length,taskIcons=['sword','hammer','tea'];return banner('gift','初入江湖 · 第一天','永久保留 · 随时领取','activity-village')+'<section class="activity-steps" aria-label="初入江湖三步">'+task.tasks.map((t,i)=>'<article class="panel activity-step '+(t.done?'done':'')+'"><span class="activity-step-count">'+(t.done?'✓':String(i+1).padStart(2,'0'))+'</span><div class="activity-step-art">'+icon(taskIcons[i])+'</div><h3>'+['历练五战','穿上一件装备','花萼楼领好礼'][i]+'</h3>'+meter(t.done?1:0,1)+btn(t.done?'查看':'去完成','nav',t.page,t.done?'quiet':'primary')+'</article>').join('')+'</section><section class="panel activity-completion"><div><strong>'+count+' / '+task.tasks.length+' 已完成</strong><div class="activity-rewards">'+rewardView(task.reward)+'</div></div>'+claimButton(task,'first-day')+'</section><div class="activity-next-links">'+btn(icon('scroll')+'每日积累','nav','quests','quiet')+btn(icon('clock')+'本周目标','nav','weekly','quiet')+btn(icon('map')+'继续闯荡','nav','adventure','primary')+'</div>';}
      const isWeek=tab==='weekly',list=isWeek?A.weekly(s):root.JXSystems.quests(s),links={'daily-wins':'adventure','daily-recruited':'team','daily-challenge':'activity-dungeon','daily-training':'training','daily-tea':'tea',wins:'adventure',challenges:'activity-dungeon',tea:'tea'};
      return banner(isWeek?'clock':'scroll',isWeek?'本周江湖':'每日行侠','北京时间 · '+(isWeek?'周一':'每日')+'零点更新',isWeek?'activity-mountain':'activity-village')+'<section class="activity-task-grid">'+list.map((t,i)=>'<article class="panel activity-target '+(t.claimed?'done':'')+'"><div class="activity-target-title"><span class="activity-target-art">'+icon(t.claimed?'check':['sword','people','tower','leaf','tea'][i%5])+'</span><div><h3>'+esc(t.title)+'</h3><small>'+esc(t.desc)+'</small></div><strong>'+t.progress+'<small> / '+t.target+'</small></strong></div>'+meter(t.progress,t.target)+'<div class="activity-rewards">'+rewardView(t.reward)+'</div><div class="activity-target-actions">'+btn('前往','nav',links[t.id]||t.page||'adventure','quiet')+claimButton(t,t.id,isWeek)+'</div></article>').join('')+'</section>';
    }
    function challenge(id){const s=c.getState(),t=root.JXSystems.challenges(s).find(x=>x.id===id);if(!t)return '';const remaining=Math.max(0,t.maxAttempts-t.attempts),ready=t.unlocked&&!t.completed&&remaining>0,period=id==='tower'?'本周':'今日';
      return banner(icons[id],t.name,t.subtitle,'activity-'+id)+'<section class="activity-detail-grid"><section class="panel activity-challenge-main"><div class="activity-facts"><div>'+icon('clock')+'<b>'+remaining+' / '+t.maxAttempts+'</b><small>本作每'+(id==='tower'?'周':'日')+'次数</small></div><div>'+icon(id==='world'?'sword':'flag')+'<b>'+Math.floor(t.progress)+' / '+t.target+'</b><small>'+(id==='world'?'个人累计伤害':id==='tower'?'本周最高层':'最佳进度')+'</small></div><div>'+icon(t.unlocked?'check':'lock')+'<b>'+(t.unlocked?'已开放':'尚未开放')+'</b><small>'+esc(t.requirement)+'</small></div></div>'+meter(t.progress,t.target)+'<div class="activity-main-action"><button class="btn primary" data-action="challenge" data-id="'+id+'" '+(ready?'':'disabled')+'>'+icon(ready?'play':t.completed?'check':'lock')+(t.completed?period+'已完成':!t.unlocked?'完成条件后开放':remaining===0?period+'次数已用完':'开始挑战')+'</button>'+(!t.unlocked?btn('前往主线历练','nav','adventure','quiet'):btn('配置主角','nav','equipment','quiet'))+'</div><p class="activity-rule">'+esc(t.desc)+'</p>'+(id==='tower'&&t.historicalBest?'<p class="tiny muted">旧制历史纪录：'+Math.floor(t.historicalBest)+'层 · 不计入本周进度</p>':'')+'</section><aside class="panel activity-reward-panel"><h3>'+icon('gift')+'挑战奖励</h3><div class="activity-rewards">'+rewardView(t.reward)+'</div><p class="tiny muted">实际奖励随通关进度结算</p>'+btn(icon('heart')+'好友异步助战','nav','activity-support','wide quiet')+'</aside></section>'+(t.last?'<details class="gui-details activity-last-report"><summary>最近一场 · '+(t.last.won?'通关':'暂退')+'</summary><div class="panel-body">'+(t.last.log||[]).slice(-12).map(l=>'<p>'+esc(l)+'</p>').join('')+'</div></details>':'');
    }
    function support(){const authenticated=root.JXAccount.status().authenticated;return banner('heart','亲友助战','异步同游 · 好友离线也能助力','activity-village')+'<section class="activity-steps support-steps">'+[['people','添加好友','通过好友码结识同道'],['book','选择侠影','每位好友最多一名'],['tower','秘境同行','开战时读取服务器快照']].map(([ic,name,hint],i)=>'<article class="panel activity-step"><span class="activity-step-count">0'+(i+1)+'</span><div class="activity-step-art">'+icon(ic)+'</div><h3>'+name+'</h3><p>'+hint+'</p></article>').join('')+'</section><section class="panel activity-completion"><div><strong>'+(authenticated?'已连接江湖账号':'登录后使用真实好友助战')+'</strong><p>主角固定上阵，最多四位不同好友；其余位置由本地援军补足。</p></div>'+btn(authenticated?'配置好友助战':'前往账号登录','nav',authenticated?'social':'settings','primary')+'</section><p class="tiny muted">每次秘境独立结算，不消耗好友物品。游客可使用明确标记的人机援军。</p>';}
    function status(page){const x=sidebar(page);return {badge:x.text,locked:x.locked,ready:x.ready,hint:title(page)};}
    return {render,title,sidebar,status,challenge,support};
  }root.JXActivitiesUI={create};
})(globalThis);

;
(function(root){
  'use strict';
  function create({getState,ui,esc,btn}){
    const M=root.JXMartial;
    const icon=name=>root.JXPixelIcons?.icon(name)||'';
    const techniqueIcon=skill=>icon({damage:'sword',break:'hammer',guard:'badge',healing:'heart'}[skill.effect]||'book');
    function skillEffect(skill,rank){const p=M.combatProfile({martialBuild:{equipped:[skill.id],ranks:{[skill.id]:Math.max(1,rank)}},isPlayer:true},1);return '伤害 ×'+p.damageMultiplier.toFixed(2)+' · 削韧 '+p.breakPower+(p.shield?' · 护盾 '+Math.round(p.shield*100)+'%攻击':'')+(p.damageReduction?' · 减伤 '+Math.round(p.damageReduction*100)+'%':'')+(p.teamHeal?' · 回复 '+Math.round(p.teamHeal*100)+'%攻击':'');}
    function render(){
      const s=getState(),info=M.info(s),m=info.build,filter=ui.martialSect||info.native,blocked=!!s.battle||!!s.endgame?.active;
      const rotation=info.rotation.map((skill,i)=>'<article class="martial-rotation-slot">'+techniqueIcon(skill)+'<small>第'+(i+1)+'式 · '+esc(skill.type)+'</small><strong>'+esc(skill.name)+'</strong><span>悟性 '+skill.rank+' / 5</span>'+btn('移出循环','martial-equip',skill.id,'small quiet')+'</article>').join('');
      const skills=M.SKILLS.filter(skill=>filter==='all'||skill.sect===filter);
      return '<section class="panel martial-overview"><div><span class="eyebrow">主角武学 · 多门研习</span><h2>选招式，点悟性，自动出招</h2><div class="martial-flow"><span>① 研习</span><i>→</i><span>② 配点</span><i>→</i><span>③ 三式循环</span></div></div><div class="martial-points" role="status"><strong>'+info.available+'</strong><span>可分配悟性 / 共'+info.total+'点</span></div></section>'+
        '<section class="panel martial-planner"><h3>按目标一键配点</h3><div class="martial-planner-controls"><label for="martial-goal">成长目标<select id="martial-goal" class="select">'+Object.entries(M.GOALS).map(([id,name])=>'<option value="'+id+'" '+(m.goal===id?'selected':'')+'>'+name+'</option>').join('')+'</select></label><label for="martial-type">偏好招式类型<select id="martial-type" class="select"><option value="all">不限类型</option>'+root.JXCombatRules.TYPES.map(type=>'<option '+(ui.martialType===type?'selected':'')+'>'+esc(type)+'</option>').join('')+'</select></label><button class="btn primary" data-action="martial-auto" '+(blocked?'disabled':'')+'>一键配点与侠客</button>'+btn('返还悟性','martial-reset','','quiet')+'</div><details class="gui-details"><summary>悟性与配点规则</summary><div class="gui-details-body"><p class="tiny muted">仅分配已学招式，不自动购买。升级主角与研习增加悟性，返还不增加总点数。同类型每点伤害+0.3%；御守每点减伤+0.3%，续航每点疗效+0.5%。战斗结束后可调整。跨派研习、破招分类与回合数值为本作放置适配。</p></div></details></section>'+
        '<section class="panel"><div class="panel-header"><h3>当前招式循环</h3><span>按1 → 2 → 3依次施展</span></div><div class="martial-rotation">'+rotation+Array.from({length:3-m.equipped.length},()=>'<div class="martial-rotation-slot empty"><strong>空招式位</strong><span>为学会的武学分配悟性，再加入循环</span></div>').join('')+'</div></section>'+
        '<section class="panel"><div class="panel-header"><h3>武学藏卷</h3><span>20门派 + 无相楼江湖流派 · '+M.SKILLS.length+'门招式</span></div><nav class="martial-sects" aria-label="武学门派"><button class="btn small '+(filter==='all'?'active':'')+'" data-action="martial-sect" data-id="all">全部</button>'+root.JXData.SECTS.map(sect=>'<button class="btn small '+(filter===sect.id?'active':'')+'" data-action="martial-sect" data-id="'+sect.id+'" aria-pressed="'+(filter===sect.id)+'">'+esc(sect.name)+'</button>').join('')+'</nav><div class="martial-skills">'+skills.map(skill=>{
          const learned=m.learned.includes(skill.id),rank=m.ranks[skill.id]||0,equipped=m.equipped.includes(skill.id),sect=root.JXData.SECTS.find(x=>x.id===skill.sect),canLearn=learned||(!blocked&&(s.heroes.find(h=>h.uid===s.playerUid)?.level>=5||skill.sect===info.native));
          return '<article class="martial-skill '+(equipped?'is-equipped':'')+'"><div class="martial-skill-icon" aria-hidden="true">'+techniqueIcon(skill)+'</div><header><span class="eyebrow">'+esc(sect.name)+(sect.kind==='school'?' · 江湖流派':'')+'</span><h3>'+esc(skill.name)+'</h3><span class="pill">'+esc(skill.type)+' · '+esc(skill.damageType)+' · '+M.effectLabels[skill.effect]+'</span></header><p>'+skillEffect(skill,rank)+'</p><small class="muted">'+(skill.original?'以原作心法为灵感的本作自创招式':'招式取材剑网3；分类、循环和数值为本作改编')+'</small>'+(learned?'<div class="martial-skill-controls"><button class="btn small" data-action="martial-minus" data-id="'+skill.id+'" aria-label="减少'+esc(skill.name)+'悟性" '+(!rank||blocked?'disabled':'')+'>−</button><strong>悟性 '+rank+' / 5</strong><button class="btn small" data-action="martial-plus" data-id="'+skill.id+'" aria-label="增加'+esc(skill.name)+'悟性" '+(rank>=5||!info.available||blocked?'disabled':'')+'>+</button></div><button class="btn '+(equipped?'quiet':'primary')+'" data-action="martial-equip" data-id="'+skill.id+'" '+(blocked||!rank?'disabled':'')+'>'+(equipped?'已编入 · 移出循环':m.equipped.length===3?'循环已满 · 先移出招式':'加入循环')+'</button>':'<p>研习：500银两 + 3主角心得</p><button class="btn primary" data-action="martial-learn" data-id="'+skill.id+'" '+(!canLearn?'disabled':'')+'>'+(canLearn?'研习武学':'主角5级开放跨门研习')+'</button>')+'<details><summary>武学取材</summary><p>兵器类型用于本作破招；例如蓬莱掌法归拳脚，振翅图南归奇兵。与原作兵器装备限制不同。</p><a href="'+esc(skill.sourceUrl)+'" target="_blank" rel="noopener noreferrer">查看官方取材资料 ↗</a></details></article>';
        }).join('')+'</div></section>';
    }
    function handle(action,id,el){
      const s=getState();
      if(action==='martial-sect'){ui.martialSect=id;return {ok:true,message:''};}
      if(action==='martial-learn')return M.learn(s,id);
      if(action==='martial-plus'||action==='martial-minus')return M.allocate(s,id,action==='martial-plus'?1:-1);
      if(action==='martial-equip')return M.equip(s,id);
      if(action==='martial-reset')return M.reset(s);
      if(action==='martial-auto'){const doc=el?.ownerDocument||root.document;ui.martialType=doc?.querySelector('#martial-type')?.value||'all';return M.autoAssign(s,doc?.querySelector('#martial-goal')?.value||'damage',ui.martialType);}
      return null;
    }
    return {render,handle};
  }
  root.JXMartialUI={create};
})(globalThis);

;
(function(root){
  'use strict';
  function create(c){
    const K=root.JXCards,D=root.JXData,esc=c.esc,btn=c.btn,percent=n=>(n*100).toFixed(1)+'%';
    let tab='album',sect='all',rarity='all',collection='owned',query='',poolId='silver',busy=false,trade=null,tradeError='',tradeSession=-1;
    const state=()=>c.getState(),logged=()=>!!c.logged?.()&&!!root.JXAccount?.status().authenticated;
    const header=()=>'<div class="card-tabs">'+[['album','侠客卡册'],['pools','寻访奖池'],['bonds','门派羁绊'],['trade','同道集换']].map(([id,name])=>btn(name,'cards-tab',id,tab===id?'active':'quiet')).join('')+'</div>';
    function card(h){const r=K.init(state()).owned[h.id],e=K.effect(h.id,r?.affection),active=K.init(state()).supports.includes(h.id),friend=Math.floor((r?.affection||0)/100);
      const effect=[e.damage?e.type+'技能伤害 +'+percent(e.damage):'',e.damageReduction?'所受伤害 −'+percent(e.damageReduction):'',e.regen?'每回合恢复 '+percent(e.regen)+'气血':'','稀有材料掉率 +'+percent(e.rareDrop)].filter(Boolean).join(' · ');
      return '<article class="collectible-card rarity-'+h.rarity+(r?' owned':' unowned')+'"><div class="card-art">'+c.portrait(h)+'<span class="pill">'+esc(D.RARITIES[h.rarity])+'</span></div><div class="card-copy"><h3>'+esc(h.name)+'</h3><p>'+esc(D.SECTS.find(s=>s.id===h.sect)?.name||h.affiliation||'江湖')+' · '+(r?'持有 ×'+r.copies:'尚未收藏')+'</p><p>'+esc(effect)+'</p>'+(r?'<div class="card-friendship"><label>好感 '+friend+'阶 · '+r.affection+' / 500</label><progress max="500" value="'+r.affection+'"></progress></div><div class="card-actions">'+btn(active?'卸下助战':'后台助战','card-support',h.id,active?'active small':'small')+btn('赠礼 · 500银','card-affection',h.id,'small')+btn(r.locked?'已保护':'保护副本','card-lock',h.id,'small')+'</div>'+(r.copies>1?'<details><summary>重复副本 ×'+(r.copies-1)+' · 回收设置</summary><p>保留最后一张与当前好感，回收不会影响羁绊。</p>'+btn('回收1张 · 银两','card-recycle',h.id+'|silver|1','small')+(h.placement?.expansionId?btn('回收1张 · 本章通宝','card-recycle',h.id+'|chapter|1','small'):'')+'</details>':''):'<p class="muted">通过章节历程、寻访或对应版本奖池收藏。</p>')+'</div></article>';
    }
    function album(){const s=state(),a=K.init(s),b=K.bonuses(s),all=D.HEROES.filter(h=>h.id!==(s.heroes.find(x=>x.uid===s.playerUid)||s.heroes[0]).id),shown=all.filter(h=>(collection==='all'||collection==='owned'&&a.owned[h.id]||collection==='missing'&&!a.owned[h.id])&&(sect==='all'||h.sect===sect)&&(rarity==='all'||h.rarity===Number(rarity))&&(!query||h.name.includes(query))).sort((x,y)=>Number(!!a.owned[y.id])-Number(!!a.owned[x.id])||y.rarity-x.rarity||x.name.localeCompare(y.name,'zh-CN'));
      return '<section class="journey-summary"><div><span class="eyebrow">主角在前 · 侠影在侧</span><strong>收藏 '+Object.keys(a.owned).length+' / '+all.length+' · 后台助战 '+a.supports.length+' / 4</strong><small>卡牌提供属性与辅助效果，无需装备，也不会作为角色站在战场前台。</small></div></section><section class="panel card-support-panel"><h3>助战配置</h3><div class="card-support-slots">'+Array.from({length:4},(_,i)=>{const h=D.HEROES.find(h=>h.id===a.supports[i]);return h?'<div>'+c.portrait(h)+'<strong>'+esc(h.name)+'</strong><small>'+esc(K.effect(h.id,a.owned[h.id].affection).label)+'</small>'+btn('卸下','card-support',h.id,'small')+'</div>':'<div class="empty"><strong>空助战位</strong><small>从卡册选择辅助</small></div>';}).join('')+'</div><div class="card-actions">'+btn('推荐输出','card-auto','damage','small')+btn('推荐生存','card-auto','survival','small')+btn('推荐寻宝','card-auto','loot','small')+'</div><p>收藏与羁绊：气血 +'+percent(b.hp)+' · 攻击 +'+percent(b.atk)+' · 防御 +'+percent(b.def)+'；当前助战减伤 '+percent(b.damageReduction)+' · 稀有材料掉率 +'+percent(b.rareDrop)+'。</p></section><section class="panel"><div class="card-filters"><label>收藏状态<select class="select" data-cards-filter="collection">'+[['owned','已收藏'],['missing','未收集'],['all','全部卡牌']].map(([id,name])=>'<option value="'+id+'" '+(collection===id?'selected':'')+'>'+name+'</option>').join('')+'</select></label><label>门派<select class="select" data-cards-filter="sect"><option value="all">所有门派</option>'+D.SECTS.map(x=>'<option value="'+x.id+'" '+(sect===x.id?'selected':'')+'>'+esc(x.name)+'</option>').join('')+'</select></label><label>品质<select class="select" data-cards-filter="rarity"><option value="all">所有品质</option>'+[1,2,3,4].map(r=>'<option value="'+r+'" '+(rarity===String(r)?'selected':'')+'>'+esc(D.RARITIES[r])+'</option>').join('')+'</select></label><label>查找<input class="search" data-cards-filter="query" value="'+esc(query)+'" placeholder="侠客姓名"></label></div><div class="card-album">'+shown.map(card).join('')+'</div>'+(shown.length?'':'<p>没有符合筛选的侠客卡。</p>')+'</section>';
    }
    function pools(){const s=state(),p=K.pool(s,poolId);return '<section class="panel"><div class="card-pool-picker"><label>寻访奖池<select class="select" data-cards-filter="pool"><option value="silver" '+(poolId==='silver'?'selected':'')+'>江湖寻访 · 银两</option>'+D.EXPANSIONS.map(e=>'<option value="'+e.id+'" '+(poolId===e.id?'selected':'')+'>'+esc(e.name)+' · 专属通宝'+(root.JXProgression.isExpansionUnlocked(s,e.id)?'':' · 未解锁')+'</option>').join('')+'</select></label></div>'+(p?'<h3>'+esc(p.name)+'</h3><p>持有 '+Math.floor(p.balance).toLocaleString()+' '+esc(p.currency)+' · 每次消耗 '+p.cost+'。版本通宝不能跨版本使用。</p><div class="card-probabilities">'+p.groups.map(g=>'<span class="pill">'+esc(D.RARITIES[g.rank])+' '+percent(g.chance)+'</span>').join('')+'</div><p>以上为常规抽取的实际品质概率；同品质候选等概率。第 '+p.limit+' 次以内必出本池最高品质「'+esc(D.RARITIES[p.highest])+'」，出货后重新计数；当前 '+p.pity+' / '+p.limit+'。重复卡保留为副本，可回收。</p><div class="card-actions">'+(p.unlocked?btn('寻访一次 · '+p.cost,'card-draw',poolId+'|1','primary')+btn('寻访十次 · '+p.cost*10,'card-draw',poolId+'|10',''):btn('查看解锁历程','nav','journey','primary'))+'</div><details><summary>完整候选侠客 · '+p.cards.length+' 张</summary><p>'+p.cards.map(h=>esc(h.name)+'（'+esc(D.RARITIES[h.rarity])+'）').join('、')+'</p></details>':'<p>本资料片暂无独立卡池，请选择其他奖池。</p>')+'</section><section class="panel"><h3>最近寻访</h3><div class="card-recent" role="log">'+(K.init(s).history.map(h=>'<span class="pill">'+esc(h.name)+(h.isNew?' · 新卡':' · 副本')+'</span>').join('')||'<p>还没有寻访记录。历程中结识的侠客同样会自动录入卡册。</p>')+'</div></section>';}
    function bonds(){return '<section class="panel"><h3>门派羁绊</h3><p>每派收藏2张、3张与全套时解锁羁绊；同一门槛只奖励一次，每档主角气血 +0.6%、攻击与防御 +0.5%。收藏总数另提供全局属性，详见卡册总览。重复卡不增加套牌进度。</p><div class="card-bonds">'+K.collections(state()).map(x=>'<article><h3>'+esc(x.name)+' · '+x.count+' / '+x.total+'</h3><progress max="'+(x.total||1)+'" value="'+x.count+'"></progress><p>'+x.tiers.map(n=>(x.count>=n?'✓ ':'◇ ')+(n===x.total?'全套':n+'张')).join(' · ')+' · 已激活 '+x.active+' 档</p></article>').join('')+'</div></section>';}
    async function loadTrade(){if(!logged()||busy)return;busy=true;tradeError='';const session=root.JXAccount.status().sessionVersion;tradeSession=session;try{const r=await root.JXAccount.cardExchange();if(session!==root.JXAccount.status().sessionVersion)return;trade=r;}catch(e){if(session===root.JXAccount.status().sessionVersion)tradeError=e.status===404?'集换接口尚未部署，请更新账号后端后重试。':e.message;}finally{root.JXInteractionFeedback?.pending(action,false);busy=false;c.render();}}
    function trading(){if(!logged())return '<section class="panel"><h3>同道集换</h3><p>登录后使用服务器托管的集换副本与真实玩家交换卡牌。游客与本地寻访卡不进入集换库存。</p>'+btn('登录并连接同道','nav','settings','primary')+'</section>';
      if(tradeSession!==root.JXAccount.status().sessionVersion){trade=null;tradeSession=root.JXAccount.status().sessionVersion;queueMicrotask(loadTrade);}
      const inventory=trade?.inventory||{},cards=Object.entries(inventory).filter(([,n])=>n>0),spares=cards.filter(([,n])=>n>1),offers=trade?.offers||[];
      return '<section class="panel"><h3>同道集换 · 服务器托管副本</h3><p>每天领取3张集换副本。这里的库存由服务器独立记账，不接收游客导入或本地抽卡副本。交换只使用第2张起的重复卡，双方库存同时结算，始终保留最后1张；集换首次获得的新侠影会在账号同步时录入主卡册，重复副本分别保管，不消耗主卡册或好感。</p><p>集换卡包与银票寻访共用下方候选卡册，每张卡等概率；每天卡包最多领取一次。</p><p>我的集换码：<strong>'+esc(trade?.code||'待同步')+'</strong> · 集换银票 '+(trade?.credits||0)+'</p><div class="card-actions">'+btn(busy?'连接中…':'刷新集换册','cards-trade-refresh','','small')+btn('领取今日3张','cards-trade-claim','','primary')+btn('银票寻访 · 100','cards-trade-draw','','small')+'</div>'+(tradeError?'<p class="notice" role="status">'+esc(tradeError)+'</p>':'')+'<div class="card-trade-inventory">'+cards.map(([id,n])=>{const h=D.HEROES.find(h=>h.id===id);return '<article><strong>'+esc(h?.name||id)+' ×'+n+'</strong>'+(n>1?btn('回收副本 · 20银票','cards-trade-recycle',id,'small'):'<small>保留卡</small>')+'</article>';}).join('')+(cards.length?'':'<p>领取今日卡包，开始你的集换册。</p>')+'</div></section><section class="panel"><h3>发起交换</h3><p>一张重复卡换一张指定卡；对方同样需要持有重复副本。挂单即托管你的副本，可以随时撤回未成交挂单。</p><div class="card-filters"><label>赠出<select class="select" id="card-trade-give"><option value="">选择重复副本</option>'+spares.map(([id,n])=>'<option value="'+esc(id)+'">'+esc(D.HEROES.find(h=>h.id===id)?.name||id)+' ×'+(n-1)+'</option>').join('')+'</select></label><label>希望换得<select class="select" id="card-trade-want">'+(trade?.catalog||[]).map(id=>'<option value="'+esc(id)+'">'+esc(D.HEROES.find(h=>h.id===id)?.name||id)+'</option>').join('')+'</select></label><label>指定同道（可留空）<input class="search" id="card-trade-target" maxlength="16" placeholder="16位集换码"></label></div>'+btn('托管并发布交换','cards-trade-offer','','primary')+'</section><section class="panel"><h3>同道交换牌桌</h3>'+offers.map(o=>'<article class="card-trade-offer"><p><strong>'+esc(o.ownerName)+'</strong> 赠出 '+esc(D.HEROES.find(h=>h.id===o.give)?.name||o.give)+'，希望换得 '+esc(D.HEROES.find(h=>h.id===o.want)?.name||o.want)+'</p>'+btn(o.mine?'撤回挂单':'接受交换',o.mine?'cards-trade-cancel':'cards-trade-accept',o.id,'small')+'</article>').join('')+(offers.length?'':'<p>暂无可见挂单。可以让好友领取卡包后发起交换。</p>')+'</section>';
    }
    function render(){return '<div class="cards-page" aria-busy="'+busy+'">'+header()+({album,pools,bonds,trade:trading}[tab])()+'</div>';}
    const local=(action,id)=>{const s=state(),a=id.split('|');return action==='card-support'?K.assign(s,id):action==='card-auto'?K.autoAssign(s,id):action==='card-affection'?K.befriend(s,id):action==='card-lock'?K.protect(s,id):action==='card-draw'?K.draw(s,a[0],Number(a[1])):K.recycle(s,a[0],a[2]==='all'?'all':Number(a[2]),a[1]);};
    document.addEventListener('change',e=>{const type=e.target.dataset.cardsFilter;if(!type)return;if(type==='sect')sect=e.target.value;if(type==='collection')collection=e.target.value;if(type==='rarity')rarity=e.target.value;if(type==='query')query=e.target.value;if(type==='pool')poolId=e.target.value;c.render();});
    document.addEventListener('click',async e=>{const target=e.target.closest('[data-action]'),action=target?.dataset.action,id=target?.dataset.id||'';if(!action||!/^cards?-/.test(action))return;e.stopImmediatePropagation();
      if(action==='cards-tab'){tab=id;if(tab==='trade'&&!trade)loadTrade();c.render();return;}if(action==='cards-trade-refresh'){loadTrade();return;}if(busy)return c.toast('正在同步，请稍候。');
      if(c.locked?.()&&!logged())return c.toast('请等待账号恢复后再操作。');busy=true;root.JXInteractionFeedback?.pending(action,true);
      try{if(action.startsWith('cards-trade-')){
        if(!logged())throw Error('请先登录，再操作集换库存。');const operation=action.slice(12),input={operation,requestId:root.crypto.randomUUID()};
        if(['accept','cancel'].includes(operation))input.offerId=id;if(operation==='recycle')input.cardId=id;
        if(operation==='offer'){input.give=document.getElementById('card-trade-give').value;input.want=document.getElementById('card-trade-want').value;input.target=document.getElementById('card-trade-target').value.trim();}
        trade=await root.JXAccount.cardExchange(input);root.JXInteractionFeedback?.result(action,{ok:true});c.toast(trade.message||'集换库存已更新。');
      }else if(logged()){const envelope=await root.JXAccount.command(action,{id});c.adopt?.(envelope);root.JXInteractionFeedback?.result(action,envelope.result);c.toast(envelope.result?.message||'卡册已更新。');}
      else{const result=local(action,id);root.JXInteractionFeedback?.result(action,result);c.toast(result.message);if(result.ok)c.save?.();}
      }catch(error){root.JXInteractionFeedback?.result(action,{ok:false,message:error.message});tradeError=action.startsWith('cards-trade-')?error.message:'';c.toast(error.message);}finally{root.JXInteractionFeedback?.pending(action,false);busy=false;c.render();}
    },true);
    return {render,refresh:loadTrade};
  }
  root.JXCardsUI={create};
})(globalThis);

;
(function () {
  'use strict';
  const D = globalThis.JXData, E = globalThis.JXEngine, S = globalThis.JXSystems;
  const KEY = 'jx3-jianghu-shimeng-v1';
  const $ = q => document.querySelector(q);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = n => Math.floor(Number(n)||0).toLocaleString('zh-CN');
  const pct = (a,b) => Math.max(0,Math.min(100,(a/(b||1))*100));
  const hm = t => Math.floor(t/3600)+':'+String(Math.floor(t%3600/60)).padStart(2,'0');
  const duration = t => t>=3600 ? Math.floor(t/3600)+'时 '+Math.floor(t%3600/60)+'分' : Math.floor(t/60)+'分 '+Math.ceil(t%60)+'秒';
  const paths = {
    sword:'M4 20 17 7 21 3 17 4 5 16M3 14l7 7M2 22l4-4',map:'m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16',people:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 4a4 4 0 0 1 0 8m6 9v-2a4 4 0 0 0-3-4M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',book:'M3 4h7a3 3 0 0 1 3 3v14a4 4 0 0 0-4-2H3V4Zm10 3a3 3 0 0 1 3-3h5v15h-4a4 4 0 0 0-4 2',coin:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9 9h6v6H9z',jade:'m12 2 8 8-8 12-8-12 8-8ZM4 10h16M8 6l4 16 4-16',badge:'m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1 3-6Z',bag:'M5 8h14l2 13H3L5 8Zm3 0V6a4 4 0 0 1 8 0v2',flask:'M9 3h6m-5 0v7L5 20c-.4.8 0 1 1 1h12c1 0 1.4-.2 1-1l-5-10V3M8 15h8',tea:'M3 8h14v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8Zm14 2h2a3 3 0 0 1 0 6h-2M7 2v3m5-3v3',scroll:'M6 3h13v16H6M6 3a2 2 0 0 0-2 2v12a2 2 0 1 1 0 4h15m-9-14h5m-5 4h5m-5 4h3',tower:'M6 21V10h12v11M4 21h16M5 10l7-8 7 8H5Zm4 11v-6h6v6',mountain:'m2 20 7-14 4 8 3-5 6 11H2ZM6 12l3 2 3-2',leaf:'M20 3C8 1 2 6 4 14s15 8 16-11ZM4 20 15 9',heart:'M20 5a5 5 0 0 0-8 1 5 5 0 0 0-8-1c-5 5 2 11 8 16 6-5 13-11 8-16Z',pet:'M7 12c-4 5-3 9 1 9l4-2 4 2c4 0 5-4 1-9-3-4-7-4-10 0ZM5 4a2 3 0 1 1 0 6 2 3 0 1 1 0-6Zm7-3a2 3 0 1 1 0 6 2 3 0 1 1 0-6Zm7 3a2 3 0 1 1 0 6 2 3 0 1 1 0-6',star:'m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z',gear:'m9 3 1-2h4l1 2 3 2 3 1v4l-1 2 1 3-3 3-3 1-1 2h-4l-1-2-3-2-3-1v-4l1-2-1-3 3-3 3-1ZM16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',sound:'m3 9 5 0 5-5v16l-5-5H3V9Zm13-2a7 7 0 0 1 0 10m3-13a11 11 0 0 1 0 16',save:'M4 3h14l3 3v15H3V3h1Zm3 0v6h10V3M7 21v-8h10v8',arrow:'M5 12h14m-5-5 5 5-5 5',chevron:'m9 5 7 7-7 7',plus:'M12 4v16M4 12h16',close:'m5 5 14 14M19 5 5 19',play:'m7 3 14 9-14 9V3Z',pause:'M7 4v16M17 4v16',sun:'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2',check:'m4 12 5 5L20 6',lock:'M5 10h14v12H5V10Zm3 0V6a4 4 0 0 1 8 0v4',menu:'M3 6h18M3 12h18M3 18h18',clock:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 6v6l4 2',gift:'M3 8h18v4H3V8Zm2 4v9h14v-9M12 8v13M12 8C1 9 6-3 12 8Zm0 0C23 9 18-3 12 8Z',download:'M12 2v13m-5-5 5 5 5-5M3 16v5h18v-5',upload:'M12 16V3m-5 5 5-5 5 5M3 16v5h18v-5',help:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9 8a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3v1',flag:'M4 22V3c5-5 10 5 16 0v11c-6 5-11-5-16 0',camp:'m2 21 10-18 10 18H2Zm7 0 3-7 3 7',hammer:'m14 2 8 8-4 4-3-3L5 21l-3-3L12 8 9 5l5-3Z',cloud:'M6 19a5 5 0 1 1 1-10 6 6 0 0 1 12 1 4 4 0 1 1 0 9H6',trophy:'M7 3h10v8a5 5 0 0 1-10 0V3Zm0 2H3v4a4 4 0 0 0 4 4m10-8h4v4a4 4 0 0 1-4 4M12 16v5m-4 0h8'
  };
  const icon = (name='sword') => globalThis.JXPixelIcons.icon(name);
  const meta = id => D.HEROES.find(x=>x.id===id);
  const owned = uid => state.heroes.find(x=>x.uid===uid);
  const sect = id => D.SECTS.find(x=>x.id===id)||D.SECTS[0];
  const affiliation = hero => hero.affiliation || sect(hero.sect).name;
  const affiliationFilter = hero => affiliation(hero)===sect(hero.sect).name?hero.sect:'affiliation:'+affiliation(hero).split('·')[0];
  const affiliationOptions = () => [...new Map([...D.SECTS.map(item=>[item.id,item.name]),...D.HEROES.map(hero=>[affiliationFilter(hero),affiliationFilter(hero).startsWith('affiliation:')?affiliation(hero).split('·')[0]:affiliation(hero)])])];
  const artClass = value => {const h=globalThis.JXCosmetics?.visualHero(state,value)||value;return h?.artId?'art-'+h.artId:h?((h.portrait??0)>=6?'sect-art-'+(h.sect||h.id):'disciple-art-'+(h.hidden?h.sect+'_1':h.sect?h.id:h.id+'_1')):'';};
  const portraitStyle = index => 'background-position:'+((index%3)*50)+'% '+(Math.floor(index/3)*100)+'%';
  const btn = (label,action,id='',cls='') => '<button class="btn '+cls+'" data-action="'+action+'" data-id="'+esc(id)+'">'+label+'</button>';
  const portrait = (value,cls='') => {const h=typeof value==='object'?value:null,index=h?.portrait??value??0,uid=h&&(h.uid||state.heroes.find(a=>a.id===h.id)?.uid);return '<div class="portrait '+cls+' '+artClass(h)+'" style="'+portraitStyle(index)+'">'+(uid?globalThis.JXCosmetics?.decorate(state,uid)||'':'')+'</div>';};
  const itemIcon = id => ({invite:'scroll',medicine:'flask',exp:'jade',tea:'tea',ore:'hammer',herb:'leaf'}[id]||'bag');
  const itemName = id => D.ITEMS.find(x=>x.id===id)?.name||({silver:'银两',jade:'通宝',renown:'侠名',exp:'修为'}[id]||id);
  const rewardText = reward => JXVisualUI.rewards(reward);
  let accountUI=null, entered=false, tutorialNew=false;
  let state, fresh=true, offline=null, balanceReset=false, toastTimer, lastFrame=performance.now(), lastPaint=0,lastSave=0,audioCtx;
  const ui={page:'adventure',filter:'all',query:'',region:'all',sort:'rarity',starter:'chunyang',heroModal:null,ready:false,viewTime:0,tab:'heroes'};
  // Reading a guest save must not run offline rewards or migrate storage while
  // the account entry is visible. Explicit guest entry owns those operations.
  try { const raw=localStorage.getItem(KEY);if(raw){state=E.parseSave(raw);fresh=false;} } catch(e){ console.warn('存档读取失败',e.message); }
  state=state||E.createState();S.init(state);
  let combat=null;
  function ensureCombat(){return combat||(combat=JXCombat.create({state:()=>state,onImpact:e=>sound(e.critical?'critical':'hit')}));}
  function save(show=false){if(!entered||!ui.ready||accountUI?.active())return true;try{state.lastSaved=Date.now();localStorage.setItem(KEY,E.serialize(state));if(show)toast('江湖进度已保存。');return true;}catch(e){toast('本地存储不可用，请在设置中导出存档。');return false;}}
  function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3500);}
  function sound(kind='click'){if(!state.settings.sound)return;try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=kind==='hit'?'square':'triangle';o.frequency.setValueAtTime(kind==='reward'?660:kind==='critical'?280:kind==='hit'?160:440,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(kind==='reward'?880:kind==='hit'||kind==='critical'?65:330,audioCtx.currentTime+.12);g.gain.setValueAtTime(.025,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.18);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.2);}catch{}}
  function openModal(html,cls=''){const m=$('#modal'),sameHero=m.open&&ui.heroModal&&m.querySelector('.modal-head h2')?.textContent===meta(ui.heroModal)?.name,scrolls=sameHero?JXScroll.capture(m):null;m.className=cls;m.innerHTML=html;if(!m.open)m.showModal();if(scrolls)JXScroll.restore(m,scrolls);else m.scrollTop=0;}
  function closeModal(){if(!ui.ready)return;$('#modal').close();ui.heroModal=null;}
  const modalHeader = title => '<div class="modal-head"><h2>'+esc(title)+'</h2><button class="icon-button" data-action="close" aria-label="关闭">'+icon('close')+'</button></div>';
  const navGroups=[
    ['历练',[['adventure','sword','江湖历练'],['journey','flag','本章历程']]],
    ['侠客',[['team','people','侠客卡册'],['training','leaf','传功邀约'],['dex','book','江湖图鉴'],['cosmetics','star','角色外观']]],
    ['养成',[['martial','book','主角武学'],['equipment','hammer','主角装备'],['forge','star','神兵铸造'],['exchange','badge','侠名兑换'],['craft','hammer','百工坊']]],
    ['地图',[['map','map','地图路线'],['dungeons','tower','历代秘境']]],
    ['活动',[['activities','gift','初入江湖'],['tea','tea','花萼楼签到'],['quests','scroll','日常行侠'],['weekly','clock','本周目标'],['activity-dungeon','people','大战日常'],['activity-world','sword','野外首领'],['activity-tower','tower','试炼之地'],['activity-underground','map','浪客行'],['activity-factory','leaf','神农采集'],['endgame','trophy','百战异闻录'],['trials','flag','门派试炼'],['scenarios','star','江湖奇遇'],['activity-support','heart','亲友助战']]],
    ['社交',[['social','heart','好友世界']]],
    ['商店',[['shop','bag','江湖商店']]],
    ['更多',[['more','menu','全部功能'],['achievements','trophy','成就'],['guide','help','游玩指南'],['settings','gear','设置与存档']]]
  ];
  const primaryNav=[['adventure','sword','历练'],['team','people','侠客'],['equipment','hammer','养成'],['map','map','地图'],['shop','bag','商店'],['activities','gift','活动'],['social','heart','社交'],['more','menu','更多']];
  const navGroupFor=id=>navGroups.findIndex(([,entries])=>entries.some(([key])=>key===id));
  const activityPages=navGroups.find(([name])=>name==='活动')[1];
  function subnav(){const group=navGroups[navGroupFor(ui.page)];if(!group||group[0]==='活动'||group[1].length===1)return '';return '<nav class="gui-subnav" aria-label="'+group[0]+'页面">'+group[1].map(([id,ic,label])=>'<button class="btn '+(ui.page===id?'active':'')+'" data-action="nav" data-id="'+id+'" '+(ui.page===id?'aria-current="page"':'')+'>'+icon(ic)+label+'</button>').join('')+'</nav>';}
  function sidebarPages(){return primaryNav.map(([id,ic,label])=>{if(id!=='activities')return '<button class="nav-item" data-action="nav" data-id="'+id+'">'+icon(ic)+'<span>'+label+'</span></button>';const expanded=ui.activitiesExpanded!==false;return '<div class="nav-activity-group"><button class="nav-item nav-activity-toggle" data-action="activity-toggle" aria-expanded="'+expanded+'" aria-controls="activity-subnav">'+icon(ic)+'<span>活动</span><b class="nav-expand" aria-hidden="true">'+(expanded?'⌄':'›')+'</b></button><nav class="nav-activity-children" id="activity-subnav" aria-label="活动二级导航" '+(expanded?'':'hidden')+'>'+activityPages.map(([page,glyph,title])=>{const status=AUI.status(page);title=page.startsWith('activity-')?AUI.title(page):title;return '<button class="nav-activity-child '+(ui.page===page?'active':'')+'" data-action="nav" data-id="'+page+'" '+(ui.page===page?'aria-current="page"':'')+' title="'+esc(status.hint||title)+'">'+icon(glyph)+'<span>'+title+'</span>'+(status.badge?'<small class="'+(status.locked?'locked':'')+'">'+esc(status.badge)+'</small>':'')+'</button>';}).join('')+'</nav></div>';}).join('');}
  function moreView(){return '<div class="gui-more-grid">'+navGroups.filter(([title])=>title!=='更多').map(([title,entries])=>'<section class="panel"><div class="panel-header"><h3>'+title+'</h3></div><div class="gui-function-list">'+entries.map(([id,ic,label])=>btn(icon(ic)+label,'nav',id,'quiet')).join('')+'</div></section>').join('')+'<section class="panel"><div class="panel-header"><h3>旅途管理</h3></div><div class="gui-function-list">'+navGroups.find(([title])=>title==='更多')[1].filter(([id])=>id!=='more').map(([id,ic,label])=>btn(icon(ic)+label,'nav',id,'quiet')).join('')+'</div></section></div>';}
  const pageInfo={activities:['初入江湖','三件小事，开启你的第一程江湖。'],martial:['主角 · 武学','研习百家武学，组合招式循环，亲手点出自己的流派。'],trials:['门派 · 试炼','承师门之志，追寻隐世名侠。'],endgame:['百战异闻录','重访历代首领，收集本章通宝、珍藏与隐侠。'],adventure:['江湖历练','自动战斗，结交同道。你的一路风景，都将写入江湖。'],map:['地图 · 进度','从稻香小径出发，点亮属于你的江湖地图。'],team:['侠客 · 卡册','收集侠影、培养好感；侠客在幕后提供属性与辅助增益。'],dex:['江湖图鉴','相逢皆是缘，一册收尽江湖侠影与山野生灵。'],training:['传功 · 邀约','温故知新，书信相邀。在此等候一场江湖相逢。'],challenges:['秘境挑战','结阵探险，试剑论武。每一次胜利，都有新的收获。'],quests:['日常委托','侠之小者，亦解人忧。每日完成委托，积攒行路资粮。'],craft:['百工坊','采山间草木，炼行路丹药。江湖百工，各有所长。'],tea:['花萼楼 · 签到','每日相逢，行路好礼与珍藏惊喜。'],shop:['江湖商店','备好结交帖与修为丹，再赴下一程山河。'],achievements:['成就','来时路上的每一枚印记，皆是江湖的回响。'],social:['好友 · 世界','选择好友助战，分享江湖见闻。'],settings:['设置 · 存档','保存旅途，随时归来。'],guide:['行走江湖指南','从初入江湖到一人历练 · 侠影相伴，三分钟读懂你的冒险。']};
  function entry(html){
    document.body.classList.add('at-entry');delete document.body.dataset.page;
    const localOnly=!JXAccount.configured();
    $('#app').innerHTML='<main class="login-screen"><div class="entry-scene" aria-hidden="true"></div>'+JXAppearance.cast()+'<div class="entry-appearance">'+JXAppearance.controls()+'</div><div class="entry-layout"><section class="entry-intro" aria-labelledby="entry-title"><div class="entry-brand"><span class="entry-seal brand-mark" role="img" aria-label="江湖拾梦像素剑徽"></span><span>剑网叁 · 放置江湖</span></div><div class="entry-story"><p class="entry-overline">一人一剑一江湖</p><h1 id="entry-title">江湖拾梦</h1><p class="entry-poem">山河远阔，故人未远。<br>且将一盏清茶，换一场江湖相逢。</p><div class="entry-chips"><span>二十门派</span><i>◆</i><span>一人历练 · 侠影相伴</span><i>◆</i><span>离线历练</span></div></div><div class="entry-landmark"><span>壹 · 稻香初梦</span><small>此去经年，仍记来时路</small></div></section><section class="entry-card" aria-label="江湖账号入口"><div class="entry-card-frame">'+html+'<div class="entry-guest"><span>'+(localOnly?'旅途保存在本机':'也可以先在此地歇脚')+'</span>'+btn(fresh?'以游客身份开启江湖':'继续本机游客旅途','entry-guest','',localOnly?'primary wide':'wide')+'<p>游客与账号进度分别保存，不会自动合并。</p></div></div></section></div><footer class="entry-footer"><span>江湖拾梦 · 剑网叁同人放置游戏</span><span>一段旅途，从此刻开始</span></footer></main>';
  }
  function returnEntry(){JXOnboarding.suspend();tutorialNew=false;JXGui.exit(false);entered=false;ui.ready=false;ui.heroModal=null;combat?.detach();$('#modal').close();$('#modal').innerHTML='';$('#app').innerHTML='';}
  function enterGuest(){
    try {const loaded=JXSaveEpoch.load(localStorage);balanceReset=loaded.reset;if(loaded.raw){state=E.parseSave(loaded.raw);fresh=false;}else if(loaded.reset){state=E.createState();fresh=true;}}catch(e){console.warn('游客存档读取失败',e.message);}
    S.init(state);S.syncCalendar(state);entered=true;lastFrame=performance.now();lastSave=lastFrame;
    if(!fresh){const seconds=Math.max(0,(Date.now()-state.lastSaved)/1000);if(seconds>60)offline=E.applyOffline(state,seconds);ui.ready=true;}
    shell();if(fresh)welcome();else if(offline){showOffline(offline);offline=null;save();}
  }
  function shell(){
    ensureCombat();
    document.body.classList.remove('at-entry');
    $('#app').innerHTML=JXAppearance.cast()+'<aside class="sidebar" id="sidebar"><div class="brand"><div class="brand-mark" role="img" aria-label="江湖拾梦像素剑徽"></div><div><div class="brand-title">江湖拾梦</div><div class="brand-sub">剑网叁 · 放置江湖</div></div></div><nav class="nav-scroll gui-nav-primary" aria-label="主导航"><button id="chapter-card" class="chapter-card journey-home" data-action="nav" data-id="adventure" aria-label="返回正在战斗的历练首页"></button>'+'<div id="sidebar-pages">'+sidebarPages()+'</div>'+'</nav><div class="sidebar-bottom"><button class="nav-item" data-action="nav" data-id="guide">'+icon('help')+'游玩指南</button><button class="nav-item" data-action="nav" data-id="settings">'+icon('gear')+'设置与存档</button><div class="sidebar-footer">山河远阔 · 与君同行　v6.0.0</div></div></aside><div class="workspace"><header class="topbar" id="topbar"></header><a class="skip-main" href="#page">跳到主要内容</a><main class="page" id="page" tabindex="-1"></main></div>';
    render();
  }
  function topbar(){const h=meta(state.heroes[0]?.id);$('#topbar').innerHTML='<div class="flex"><button class="icon-button mobile-menu" data-action="menu" aria-label="展开导航">'+icon('menu')+'</button><div class="profile"><div class="profile-avatar '+artClass(h)+'" style="'+portraitStyle(h?.portrait||0)+'"></div><div><div class="profile-name">'+esc(state.name)+'</div><div class="profile-tag">'+(esc(JXProgression.current(state).expansion.name)+' · 上限 Lv.'+E.levelCap(state))+'</div></div></div></div><div class="resource"><div class="currency">'+icon('coin')+'<span>'+fmt(state.silver)+'</span><small class="currency-label">银两</small></div><div class="currency jade">'+icon('jade')+'<span>'+fmt(state.jade)+'</span><small class="currency-label">通宝</small></div><div class="currency renown">'+icon('badge')+'<span>'+fmt(state.renown)+'</span><small class="currency-label">侠名</small></div></div><div class="top-actions"><span class="save-state">'+(accountUI?.active()?'服务器存档':'游客自动保存')+'</span><button class="icon-button" data-action="sound" title="'+(state.settings.sound?'关闭':'开启')+'音效" aria-label="切换音效">'+icon('sound')+'</button><button class="icon-button" data-action="save" title="保存" aria-label="立即保存">'+icon('save')+'</button><button class="icon-button" data-action="nav" data-id="settings" title="设置" aria-label="打开设置">'+icon('gear')+'</button></div>';}
  function heading(){if(ui.page==='adventure')return '';const p=pageInfo[ui.page]||[AUI.title(ui.page),''];return '<div class="page-heading"><div class="breadcrumb">剑网叁　/　'+esc(p[0])+'</div><div class="between"><div><h1>'+p[0]+'</h1><p class="page-subtitle">'+p[1]+'</p></div><div class="title-aside"><span class="pill dot">'+(state.running?'历练进行中':'正在休整')+'</span><span class="pill">'+icon('clock')+'江湖 '+hm(state.clock)+'</span></div></div></div>';}
  function panel(title,content,action='',cls=''){return '<section class="panel '+cls+'"><div class="panel-header"><h3>'+title+'</h3>'+action+'</div>'+content+'</section>';}
  function heroCard(hero,collection=false){const h=meta(hero.id),s=sect(h.sect),stats=E.getHeroStats(hero);return '<button class="hero-card" data-action="hero" data-id="'+esc(hero.uid)+'" style="--sect-color:'+s.color+'"><div class="portrait '+artClass(h)+'" style="'+portraitStyle(h.portrait)+'"><span class="hero-level">Lv.'+hero.level+'</span><span class="hero-element">'+esc(affiliation(h)[0])+'</span>'+(collection&&state.team.includes(hero.uid)?'<span class="owned-tag">出战中</span>':'')+'</div><div class="hero-details"><div class="hero-name">'+esc(h.name)+'</div><div class="hero-sect">'+esc(affiliation(h))+' · '+({tank:'T · 承伤',healer:'治疗',dps:'DPS'}[E.getRole(hero)])+'</div><div class="bar hp"><span style="width:'+pct(ui.page==='adventure'?(combat.displayHp(hero.uid)??hero.hp):hero.hp,stats.hp)+'%"></span></div><div class="hero-quality">'+D.RARITIES[h.rarity]+' · 武学 '+(hero.isPlayer?(hero.skillLevel||0)+'/5':'助战')+'</div></div></button>';}
  function party(){return panel(icon('people')+'同行侠客 <span class="muted tiny">'+state.team.length+' / 5</span>','<div class="party">'+Array.from({length:5},(_,i)=>state.team[i]?heroCard(owned(state.team[i])):'<button class="hero-card empty" data-action="nav" data-id="team">'+icon('plus')+'<span>待君结缘</span></button>').join('')+'</div><div class="party-note"><span>'+icon('sword')+' 队伍战力 '+fmt(E.teamPower(state))+'</span><span>历练中自动结交新侠客，空位自动上阵</span></div>',btn('一键上阵','auto-lineup','','small')+btn('调整阵容','nav','team','small'),'team-panel');}
  function journeyGoal(){
    const P=globalThis.JXProgression,current=P.current(state),goal=P.objective?.(state),route=E.getRoute(state),target=goal?.route||route,farm=goal?.mode==='farm';
    const complete=goal?.cleared||0,total=goal?.total||1;
    return '<section class="journey-command" aria-label="历练目标"><div class="journey-command-art route-thumb '+JXMapUI.sceneClass(target)+'" aria-hidden="true"></div><div class="journey-command-copy"><small>'+esc(current.expansion.name)+' · 首通 '+complete+' / '+total+'</small><strong>'+esc(farm?'正在刷取 · '+route.name:goal?.label||'自动推进 · '+target.name)+'</strong><div class="journey-stage-track"><span>'+icon('map')+'野外</span><i>›</i><span>'+icon('people')+'小队</span><i>›</i><span>'+icon('tower')+'团队</span><i>›</i><span>'+icon('flag')+'下一资料片</span></div><div class="bar"><span style="width:'+pct(complete,total)+'%"></span></div></div><div class="journey-command-actions"><div class="journey-mode" role="group" aria-label="历练方式">'+btn(icon('flag')+'推进','journey-mode','progress',!farm?'primary small':'small')+btn(icon('bag')+'刷取','journey-mode','farm',farm?'primary small':'small')+'</div>'+btn('路线与掉落 '+icon('chevron'),'nav','map','small quiet')+'</div></section>';
  }
  function adventure(){const route=E.getRoute(state),lead=owned(state.team[0]),lh=meta(lead.id),ls=E.getHeroStats(lead),battle=state.battle,enemy=battle?.enemy,preview=meta(route.heroes[(state.stats.steps||0)%route.heroes.length]);const steps=Math.min(9,route.steps),p=Math.min(steps-1,Math.floor(state.routeProgress/route.steps*steps));
    const journey='<div class="journey-strip"><div class="route-label"><strong>'+route.name+'</strong><small>'+state.routeProgress+' / '+route.steps+' 段</small></div><div class="journey-nodes">'+Array.from({length:steps},(_,i)=>'<div class="node '+(i<p?'done':i===p?'current':'')+'"><i>'+icon(i===steps-1?'flag':i===Math.floor(steps/2)?'tea':i%3===0?'gift':'sword')+'</i><span>'+(i===steps-1?'首领':i===Math.floor(steps/2)?'茶肆':i%3===0?'拾取':'历练')+'</span></div>').join('')+'</div></div>';
    const env=E.environment(state);
    const foeName=enemy?.name||preview?.name||'江湖同道',foePortrait=enemy?.portrait??preview?.portrait??1;
    const scene='<div class="scene '+JXMapUI.sceneClass(route)+(env.period==='night'?' nighttime':'')+'"><div class="scene-caption"><div class="eyebrow">'+JXMapUI.routeLabel(route)+' / '+route.region+'</div><h2>'+route.name+'</h2><p>'+route.subtitle+'</p></div><div class="weather">'+icon(env.weather==='rain'||env.weather==='mist'?'cloud':'sun')+esc(env.label)+'</div><div class="stage-party">'+[state.playerUid||state.team[0]].map(uid=>'<button data-action="hero" data-id="'+esc(uid)+'" title="'+meta(owned(uid).id).name+'">'+portrait(meta(owned(uid).id))+'<small>Lv.'+owned(uid).level+'</small></button>').join('')+'</div><div class="stage"><div class="fighter"><div class="fighter-tag">Lv.'+lead.level+'　'+esc(lh.name)+'</div><div class="fighter-art '+artClass(lh)+'" style="'+portraitStyle(lh.portrait)+'"></div><div class="fighter-hp"><span style="width:'+pct(lead.hp,ls.hp)+'%"></span></div></div><div class="versus">'+(battle?'VS':'· · ·')+'</div><div class="fighter enemy '+(battle?.boss?'boss':'')+'"><div class="fighter-tag">'+(battle?.boss?'首领　':'Lv.'+(enemy?.level||route.level)+'　')+esc(foeName)+'</div><div class="fighter-art '+(battle?.boss?'':artClass(meta(enemy?.id)||preview))+'" style="'+portraitStyle(battle?.boss?D.ROUTES.indexOf(route)%6:foePortrait)+'"></div><div class="fighter-hp"><span style="width:'+(enemy?pct(enemy.hp,enemy.maxHp):100)+'%"></span></div></div></div><div class="scene-stamp">山河入梦　江湖有期</div><div class="scene-toast"><span class="live-dot"></span>'+(state.running?(battle?esc(battle.log[0]||('正在与 '+foeName+' 切磋 · 第 '+battle.turn+' 回合')):esc(ui.lastEvent||'沿小径前行，寻访下一位江湖同道……')):(state.battle?'当前切磋已暂停 · 队伍页可预约战后整队':'已暂停历练 · 可在队伍中调整阵容'))+'</div></div>';
    const controls='<div class="scene-controls"><span class="auto-status"><span class="status-dot"></span>'+(state.running?'自动历练中':'历练已暂停')+'</span><label class="toggle-label"><input type="checkbox" data-change="auto" '+(state.autoInvite?'checked':'')+'>自动结交</label><div class="speed-control">'+[1,2,3].map(v=>'<button data-action="speed" data-id="'+v+'" class="'+(state.speed===v?'active':'')+'">×'+v+'</button>').join('')+'</div>'+btn('整备','nav','equipment','small')+btn(icon(state.running?'pause':'play')+(state.running?'暂停':'继续'),'running','','primary small')+'</div><div class="battle-footer"><span>结交帖 '+state.inventory.invite+'　 ·　累计胜场 '+fmt(state.stats.wins)+'</span><span>离线自动历练 · 最多 8 小时</span></div>';
    const player=owned(state.playerUid)||lead,playerMeta=meta(player.id),quests=S.quests(state),claimable=quests.filter(q=>!q.claimed&&q.progress>=q.target).length;
    const details=(title,body,key)=>'<details class="gui-details" data-gui-detail="'+key+'"><summary>'+title+'</summary><div class="gui-detail-body">'+body+'</div></details>';
    const encounters='<div class="encounters">'+env.encounterIds.map(id=>{const h=meta(id);return '<button class="encounter-row" data-action="dexhero" data-id="'+id+'"><span class="encounter '+(state.dex.includes(id)?'':'unknown')+'">'+portrait(h)+'</span><span><strong>'+esc(h.name)+'</strong><small>'+esc(affiliation(h))+'</small></span><span class="encounter-state">'+(state.dex.includes(id)?'已结缘':'待结缘')+'</span></button>';}).join('')+'</div><p class="panel-note">'+esc(env.bonus)+'</p>';
    const compactParty='<section class="gui-party-section"><div class="between"><h3>同行侠客 <span class="muted">'+state.team.length+' / 5</span></h3>'+btn('调整阵容 '+icon('chevron'),'nav','team','small quiet')+'</div><div class="gui-party">'+Array.from({length:5},(_,i)=>{const h=owned(state.team[i]);return h?'<button data-action="hero" data-id="'+esc(h.uid)+'" title="'+esc(meta(h.id).name)+'">'+portrait(meta(h.id))+'<strong>'+esc(meta(h.id).name)+'</strong><small>Lv.'+h.level+'</small></button>':btn(icon('plus')+'结交侠客','nav','team','quiet');}).join('')+'</div></section>';
    const playerCard='<section class="panel gui-player-card"><div class="panel-header"><h3>我的主角</h3>'+btn('详情','hero',player.uid,'small quiet')+'</div><div class="panel-body"><div class="flex">'+portrait(playerMeta)+'<div><strong>'+esc(playerMeta.name)+'</strong><p class="panel-note">Lv.'+player.level+' · '+({tank:'承伤',healer:'治疗',dps:'输出'}[E.getRole(player)])+'</p></div></div><p class="panel-note">装备 '+Object.keys(player.equipment||{}).length+' / 12</p>'+btn('查看养成','nav','equipment','wide')+'</div></section>';
    const quick='<section class="panel gui-quick-links">'+btn(icon('scroll')+'日常行侠'+(claimable?' · '+claimable+' 可领取':'' )+icon('chevron'),'nav','quests','wide quiet')+btn(icon('gift')+'签到领奖 '+icon('chevron'),'nav','tea','wide quiet')+btn(icon('flag')+'本章历程 '+icon('chevron'),'nav','journey','wide quiet')+'</section>';
    const log='<div class="log-list full-log">'+state.logs.slice(0,10).map(l=>'<div class="log-row '+esc(l.type)+'"><time>'+hm(l.time)+'</time><span>'+esc(l.message)+'</span></div>').join('')+'</div>';
    return journeyGoal()+(state.endgame?.active?'<div class="notice">百战挂机中，野外暂歇。'+btn('查看百战','nav','endgame','small primary')+'</div>':'')+'<div class="gui-adventure-grid"><div class="gui-adventure-main"><section class="panel gui-battle-panel">'+journey+scene+controls+'</section>'+'<section class="battle-build-actions" aria-label="战斗构筑">'+btn(icon('book')+'武学循环','nav','martial','small')+btn(icon('people')+'辅助卡','nav','team','small')+btn(icon('hammer')+'一键整备','eq-auto-team','','small')+'</section>'+details('江湖动态',log,'logs')+'</div><aside class="gui-adventure-aside">'+playerCard+quick+details('此地侠影',encounters,'encounters')+details('战斗规则与弱点',weaknessStrip(),'weakness')+details('挂件与珍藏',BUI.wornView(),'relics')+'</aside></div>';
  }
  function statStrip(items){return '<div class="stat-strip">'+items.map(([label,val,unit],i)=>'<div class="stat-box"><span>'+icon(['people','flag','sword','heart'][i]||'star')+label+'</span><strong>'+fmt(val)+'<small>'+unit+'</small></strong></div>').join('')+'</div>';}
  function team(){let heroes=state.heroes.filter(h=>(ui.filter==='all'||affiliationFilter(meta(h.id))===ui.filter)&&(!ui.query||meta(h.id).name.includes(ui.query)));heroes.sort((a,b)=>ui.sort==='level'?b.level-a.level:meta(b.id).rarity-meta(a.id).rarity);return statStrip([['已结交',state.heroes.length,'位侠客'],['上阵',state.team.length,'/ 5'],['队伍战力',E.teamPower(state),''],['累计结缘',state.stats.recruited,'次']])+panel('当前阵容',btn('按弱点一键上阵','auto-lineup','','small primary')+X.roleSummary()+'<div class="party">'+Array.from({length:5},(_,i)=>state.team[i]?heroCard(owned(state.team[i])):'<button class="hero-card empty" data-action="collection-focus">'+icon('plus')+'<span>待君结缘</span></button>').join('')+'</div><div class="preset-row"><span class="tiny muted">阵容方案</span>'+Array.from({length:5},(_,i)=>'<div class="preset-group"><button data-action="load-preset" data-id="'+i+'">'+(i+1)+' · '+(state.presets[i]?.length||0)+'人</button><button data-action="save-preset" data-id="'+i+'" title="保存至方案'+(i+1)+'">'+icon('save')+'</button></div>').join('')+'</div>',btn(state.battle||state.running?'整队 · 本场结束后暂停':'继续历练',state.battle||state.running?'formation':'running','','small'))+'<div class="toolbar" style="margin-top:24px"><input class="search" id="hero-search" value="'+esc(ui.query)+'" placeholder="搜索侠客姓名" aria-label="搜索侠客"><select class="select" data-change="filter"><option value="all">全部归属</option>'+affiliationOptions().map(([id,label])=>'<option value="'+esc(id)+'" '+(ui.filter===id?'selected':'')+'>'+esc(label)+'</option>').join('')+'</select><select class="select" data-change="sort"><option value="rarity" '+(ui.sort==='rarity'?'selected':'')+'>品质优先</option><option value="level" '+(ui.sort==='level'?'selected':'')+'>等级优先</option></select></div><div class="hero-grid" id="hero-grid">'+(heroes.map(h=>heroCard(h,true)).join('')||'<div class="empty-note">尚未结交此归属侠客，前往地图寻访吧。</div>')+'</div>';}
  function dexView(){
    const petTab=ui.tab==='pets',source=ui.tab==='red-dust'?'red-dust':ui.tab==='crossovers'?'crossovers':'heroes',redDust=D.HEROES.filter(h=>h.redDust),crossovers=redDust.filter(h=>h.crossover),pool=source==='red-dust'?redDust:source==='crossovers'?crossovers:D.HEROES;
    const tabs=[['pendants','挂件图鉴',JXCosmetics.catalog(state).filter(x=>x.type==='pendant'&&x.owned).length,JXCosmetics.catalog(state).filter(x=>x.type==='pendant').length],['heroes','侠客名册',state.dex.length,D.HEROES.length],['red-dust','红尘侠影',redDust.filter(h=>state.dex.includes(h.id)).length,redDust.length],['crossovers','联动侠影',crossovers.filter(h=>state.dex.includes(h.id)).length,crossovers.length],['pets','江湖跟宠',JXCosmetics.catalog(state).filter(x=>x.type==='pet'&&x.owned).length,JXCosmetics.catalog(state).filter(x=>x.type==='pet').length]];
    const intro=!petTab&&source!=='heroes'?'<div class="notice">'+(source==='crossovers'?'历史联动角色以纪念侠影形式常驻本作；并非原作联动活动现时仍开放。':'完整正式红尘侠影名册，包含初始同道与历代结缘侠客。')+' 点击人物查看明确获取章节，在对应章百战中可用640本章通宝定向结缘；也可通过随机结缘与80胜保底获取。已结交同伴只需培养等级，固有武学依品质生效。</div>':'';
    if(['pendants','pets','cosmetic-pets'].includes(ui.tab))return '<div class="tabs">'+tabs.map(([id,label,owned,total])=>'<button class="tab '+((ui.tab==='cosmetic-pets'?'pets':ui.tab)===id?'active':'')+'" data-action="dex-tab" data-id="'+id+'">'+label+' '+owned+' / '+total+'</button>').join('')+'</div>'+CUI.gallery(ui.tab==='pendants'?'pendant':'pet');
    return '<div class="tabs">'+tabs.map(([id,label,owned,total])=>'<button class="tab '+(ui.tab===id||id==='heroes'&&!['pendants','pets','cosmetic-pets','red-dust','crossovers'].includes(ui.tab)?'active':'')+'" data-action="dex-tab" data-id="'+id+'">'+label+' '+owned+' / '+total+'</button>').join('')+'</div>'+intro+(petTab?'<div class="pet-grid">'+D.PETS.map((p,i)=>{const has=state.pets.includes(p.id);return '<article class="pet-card"><div class="pet-art pixel-pet '+(!has?'locked-portrait':'')+'" style="background-position:'+((i%4)*100/3)+'% '+(Math.floor(i/4)*50)+'%"></div><h3>'+p.name+'</h3><p>'+p.desc+'<br>'+p.bonus+'</p>'+btn(state.activePet===p.id?'正在跟随':has?'设为跟随':'尚未邂逅',has?'pet':'pet-info',p.id,has?'small primary':'small subtle')+'</article>';}).join('')+'</div>':'<div class="hero-grid">'+pool.map(h=>{const has=state.dex.includes(h.id);return '<button class="hero-card" data-action="dexhero" data-id="'+h.id+'"><div class="portrait '+artClass(h)+' '+(!has?'locked-portrait':'')+'" style="'+portraitStyle(h.portrait)+'"><span class="hero-level">'+D.RARITIES[h.rarity]+'</span><span class="owned-tag">'+(has?'已结缘':'未结缘')+'</span></div><div class="hero-details"><div class="hero-name">'+h.name+'</div><div class="hero-sect">'+esc(affiliation(h))+' · '+esc(h.identityLabel||h.title)+'</div><div class="hero-quality">'+D.RARITIES[h.rarity]+(h.crossover?' · '+esc(h.crossover):'')+'</div></div></button>';}).join('')+'</div>');
  }
  function trainingView(){const t=S.training(state);return '<div class="training-grid">'+panel(icon('leaf')+'门派传功','<div class="panel-body stack"><p class="panel-note">静心研习 2 分钟，获得侠客修为。传功期间仍可同行；离线也会完成。</p>'+t.slots.map((v,i)=>v?'<div class="training-slot">'+portrait(meta(owned(v.uid||v.heroUid)?.id)||0)+'<h4>'+esc(v.name||'侠客传功')+'</h4><p>'+(v.ready?'传功完成，可领取所得':'还需 '+duration(v.remaining))+'</p><div class="reward-line">'+rewardText(v.reward)+'</div>'+btn(v.ready?'领取传功所得':'研习中','claim-training',i,v.ready?'primary':'subtle')+'</div>':'<div class="training-slot">'+icon('leaf')+'<h4>空闲传功位</h4><select class="select" id="train-'+i+'">'+state.heroes.map(h=>'<option value="'+esc(h.uid)+'">'+meta(h.id).name+' · Lv.'+h.level+'</option>').join('')+'</select>'+btn('开始传功 · '+costText(t.trainingCost),'train',i,'small primary')+'</div>').join('')+'</div>')+panel(icon('scroll')+'茶馆邀约','<div class="panel-body stack"><p class="panel-note">送出结交帖，静候 3 分钟。信物越多，能邀来的侠客品质越高；重复相邀可积累心得。</p>'+t.invitations.map((v,i)=>v?'<div class="training-slot">'+icon('scroll')+'<h4>飞书传信</h4><p>'+(v.ready?'远方有客，静候相见':'回信还需 '+duration(v.remaining))+'</p>'+btn(v.ready?'迎接同道':'等待回信','claim-invite',i,v.ready?'primary':'subtle')+'</div>':'<div class="training-slot">'+icon('scroll')+'<h4>一纸书信，江湖相逢</h4><p>'+costText(t.invitationCost)+'</p>'+btn('发出邀约','invite',i,'primary small')+'</div>').join('')+'</div>')+'</div>';}
  function challengesView(){return '<div class="notice" style="margin-bottom:20px">'+icon('sword')+' 单人队伍挑战：队员逐回合出招，治疗、承伤与门派搭配都会影响结果。每日次数按北京时间刷新。</div><div class="feature-grid">'+S.challenges(state).map((c,i)=>'<article class="feature-card"><div class="watermark">'+['境','敌','塔','穴','采'][i]+'</div>'+icon(['people','sword','tower','mountain','leaf'][i])+'<h3>'+esc(c.name)+'</h3><div class="feature-sub">'+esc(c.subtitle||'江湖挑战')+'</div><p>'+esc(c.desc)+'</p><div class="feature-meta">'+(c.unlocked?'建议战力 '+fmt(c.power):esc(c.requirement))+'<br>今日次数 '+c.attempts+' / '+c.maxAttempts+'</div><div class="reward-line" style="margin-bottom:14px">'+rewardText(c.reward)+'</div><button class="btn '+(c.unlocked?'primary':'subtle')+'" data-action="challenge" data-id="'+c.id+'" '+(!c.unlocked||c.attempts>=c.maxAttempts?'disabled':'')+'>'+(c.unlocked?'进入挑战':'尚未解锁')+' '+icon('arrow')+'</button></article>').join('')+'</div>';}
  function questView(achievement=false){const list=achievement?S.achievements(state):S.quests(state);return '<div class="quest-list">'+list.map((q,i)=>'<article class="quest-row"><div class="quest-emblem">'+icon(q.claimed?'check':achievement?'trophy':'scroll')+'</div><div><h3>'+esc(q.title)+'</h3><p>'+esc(q.desc)+'</p><div class="tiny muted">'+Math.min(q.progress,q.target)+' / '+q.target+'</div><div class="bar"><span style="width:'+pct(q.progress,q.target)+'%"></span></div></div><div class="quest-reward"><div class="reward-line">'+rewardText(q.reward)+'</div><button class="btn small '+(q.progress>=q.target&&!q.claimed?'gold':'subtle')+'" data-action="'+(achievement?'achievement':'quest')+'" data-id="'+q.id+'" '+(q.claimed||q.progress<q.target?'disabled':'')+'>'+(q.claimed?'已领取':q.progress>=q.target?'领取奖励':'进行中')+'</button></div></article>').join('')+'</div>';}
  function craftView(){return JXVisualUI.inventory(state)+'<div class="shop-grid">'+S.recipes(state).map(r=>'<article class="shop-card"><div class="shop-icon">'+icon(itemIcon(r.id))+'</div><h3>'+esc(r.name)+'</h3><p>'+esc(r.desc)+'</p><div class="craft-cost"><small>制作消耗</small><div class="reward-line">'+Object.entries(r.cost).map(([id,n])=>JXVisualUI.token(id,n,'×')).join('')+'</div></div><div class="between"><span class="tiny gold">产出 '+costText(r.output)+'</span><button class="btn small primary" data-action="craft" data-id="'+r.id+'" '+(!r.available?'disabled':'')+'>制作</button></div></article>').join('')+'</div><div style="margin-top:20px">'+btn('前往采药 · 获取材料 '+icon('arrow'),'challenge','factory','primary')+'</div>';}
  function teaView(){return BUI.checkIn();}
  function shopView(){return '<div class="shop-grid">'+D.ITEMS.map(it=>'<article class="shop-card"><div class="shop-icon">'+icon(itemIcon(it.id))+'</div><div class="between"><h3>'+it.name+'</h3><span class="tiny muted">持有 '+fmt(state.inventory[it.id]||0)+'</span></div><p>'+it.desc+'</p><div class="between"><span class="gold">'+icon('coin')+' '+fmt(E.itemPrice(state,it.id))+'</span>'+btn('购买 ×1','buy',it.id,'primary small')+btn('×5','buy-five',it.id,'small')+'</div>'+(['medicine','exp','tea'].includes(it.id)?'<div style="margin-top:12px">'+btn('使用道具','item',it.id,'small subtle wide')+'</div>':'')+'</article>').join('')+'</div>';}
  function socialView(){return FUI.render();}
  function settingsView(){return accountUI.panel()+panel('旅途偏好','<div class="panel-body"><div class="settings-row"><div><h3>界面与背景</h3><p>四种底色；自动模式随系统明暗切换，偏好保存在本机。</p></div>'+JXAppearance.controls()+'</div><div class="settings-row"><div><h3>音效</h3><p>战斗与奖励使用轻量合成音效，默认关闭。</p></div>'+btn(state.settings.sound?'已开启':'已关闭','sound','','small')+'</div><div class="settings-row"><div><h3>动态效果</h3><p>角色待机与战斗提示动画。</p></div>'+btn(state.settings.motion?'已开启':'已关闭','motion','','small')+'</div><div class="settings-row"><div><h3>自动结交</h3><p>击败同道后自动消耗结交帖，结识新侠客。</p></div>'+btn(state.autoInvite?'已开启':'已关闭','auto','','small')+'</div><div class="settings-row"><div><h3>进度存档</h3><p>每 10 秒本地保存。导入前会校验内容，建议先导出备份。</p></div><div class="flex">'+btn('保存','save','','small')+btn('导出','export','','small primary')+btn('导入','import','','small')+'</div></div><div class="settings-row"><div><h3>重新开始</h3><p>开启全新的旅途。此操作需要再次确认。</p></div>'+btn('新建江湖','reset-check','','small danger')+btn('导出重制前备份','export-old','','small')+'</div></div>')+'<div class="notice" style="margin-top:20px">本作是剑网3题材的同人玩法原型。游戏剧情、养成数值与角色结交为玩法演绎。参考 Poke’Catch 的自动冒险与收集结构，代码与像素美术另行制作。</div>';}
  function guideView(){return '<section class="equipment-first-step"><div><strong>初入江湖 · 六步引导</strong><p>沿真实入口了解历练、装备与秘境，可随时跳过。</p></div>'+btn('重看新手引导','tutorial-reopen','','primary')+'</section>'+PUI.summary()+panel('主角成长与一人历练 · 侠影相伴','<div class="panel-body"><p>你选择的初始门派弟子是唯一装备养成角色。装备、精炼、五行石、五彩石和武学研习都投入主角；侠客作为收藏卡提供属性，最多配置4张后台辅助卡；好感和门派羁绊继续提升增益。</p><p>推进模式会依次首通野外、小队秘境与普通团队秘境，再自动进入下一资料片。精炼、镶嵌、挑战难度与收藏作为自由养成；想反复获取掉落时切到刷取模式。点击×1/×2/×3调整历练速度。</p></div>')+X.worldSummary()+'<div class="guide-grid">'+[['双心法与装备','天策、万花等支持切换职责的主角，在装备页切换心法。每种心法独立保存装备栏、精炼与宝石；换装和跨资料片均继承该心法的栏位强化。'],['一键整备与破招','在主角武学中选择输出、破招、生存等目标，一键配点与辅助卡。破招前仅造成少量伤害，击破韧性后获得爆发窗口。更好的掉落会自动穿到主角身上，也可在装备页一键整备。'],['好友异步助战','登录账号后，可展示主角与收藏侠影；秘境可借用最多4位不同好友的服务端战力快照，空位由人机补齐。野外以主角武学和后台卡牌增益作战。'],['版本与名侠','门派试炼页列出历代人物、版本和地域线索。本门高阶人物经过试炼加入，异派人物在对应百战结缘；特定人物需完成对应普通秘境或守卫回忆。收集不强制卡住毕业。'],['百战与通宝','通关本章五人试炼后，可在百战循环挑战该版本已收录的首领。各章通宝分别兑换挂件、五行石、五彩石和特效武器。未开放名侠池的章节仍有装备与珍藏。'],['失败也有积累','野外掉落休闲装备、低级石头与材料。副本失败会返还部分补给，已经得到的装备不会丢失。用侠名补齐缺件，再挑战更高阶段。'],['离线与账号','离线结算最多8小时；暂停不产战斗收益。游客存档保存在本机，Google首次登录另建服务器档。世界频道的稀有喜报由服务器实际结算触发。']].map(([h,p])=>'<section class="guide-block"><h3>'+h+'</h3><p>'+p+'</p></section>').join('')+'</div>';}
  function showOffline(r){const values=[['历练战斗',r.battles],['获得银两',r.silver],['累计修为',r.exp],['新增装备',r.equipment],['新增五行石',r.stones],['战败次数',r.losses]];openModal(modalHeader('少侠，欢迎归来')+'<div class="modal-body"><p>本次结算 '+duration(r.seconds)+'。'+(r.capped?'已达到八小时上限。':'')+'</p><div class="offline-stats">'+values.map(([label,n])=>'<div><b>'+fmt(n||0)+'</b><small>'+label+'</small></div>').join('')+'</div>'+Object.entries(r.chapterCurrencies||{}).map(([id,n])=>'<p>'+esc('通宝·'+(D.EXPANSIONS.find(e=>e.id===id)?.name||id))+' +'+fmt(n)+'</p>').join('')+((r.newHeroes||[]).length?'<p>新结缘：'+r.newHeroes.map(id=>esc(meta(id)?.name||id)).join('、')+'</p>':'')+'<p>所得已记入行囊；暂停时不进行自动战斗。</p></div><div class="modal-footer">'+btn('再赴江湖','close','','primary wide')+'</div>');}
  pageInfo.scenarios=['江湖奇遇','一念善意，一段奇缘。完成事件，结识新的同道与跟宠。'];
  const costText = cost => Object.entries(cost||{}).map(([k,v])=>(k==='silver'?'银两':k==='jade'?'通宝':D.ITEMS.find(i=>i.id===k)?.name||k)+' ×'+v).join(' · ')||'无消耗';
  const storyReward = r => {const out={...r};delete out.pet;delete out.hero;delete out.petIds;delete out.heroIds;return [rewardText(out),r?.pet?'跟宠 · '+D.PETS.find(p=>p.id===r.pet)?.name:'',r?.hero?'侠客 · '+meta(r.hero)?.name:'',...(r?.petIds||[]).map(id=>'跟宠 · '+D.PETS.find(p=>p.id===id)?.name),...(r?.heroIds||[]).map(id=>'侠客 · '+meta(id)?.name)].filter(Boolean).join(' · ');};
  function mapDetailed(){return M.render();}
  function scenarioView(){return '<div class="notice" style="margin-bottom:20px">事件是依据剑3地域与门派设定编写的原创玩法演绎。每次接取限时 30 分钟，每日可各完成一次；累计完成 3 次，额外保底获得一只未收集的跟宠。</div><div class="feature-grid">'+S.scenarios(state).map(q=>'<article class="feature-card scenario-card"><span class="scenario-stage">'+esc(q.stageLabel)+'</span><h3>'+q.name+'</h3><div class="feature-sub">'+q.region+'</div><p>'+q.desc+'</p><div class="scenario-dialogue">'+q.dialogue.map(esc).join('<br>')+(q.story&&['active','ready','completed'].includes(q.stage)?'<br><br>'+esc(q.story):'')+'</div>'+(q.remaining>0?'<p>事件剩余 '+duration(q.remaining)+'</p>':'')+(q.stage==='available'?btn('遇见这段奇缘','scenario',q.id+'|start','primary'):q.stage==='choice'?'<div class="scenario-choices">'+q.choices.map(c=>'<button class="btn scenario-choice" data-action="scenario" data-id="'+q.id+'|'+c.id+'" '+(!c.available?'disabled':'')+'><span>'+c.label+'<small>'+c.desc+'<br>消耗：'+costText(c.cost)+'<br>回报：'+storyReward(c.reward)+'</small></span></button>').join('')+'</div>':['active','ready'].includes(q.stage)?'<ul class="scenario-objectives">'+q.objectives.map(o=>'<li>'+o.label+'　'+o.progress+' / '+o.target+'</li>').join('')+'</ul><div class="reward-line" style="margin-bottom:15px">'+storyReward(q.reward)+'</div><button class="btn '+(q.canComplete?'primary':'subtle')+'" data-action="scenario" data-id="'+q.id+'|complete" '+(!q.canComplete?'disabled':'')+'>'+(q.canComplete?'完成奇遇 · 领取回报':'条件尚未达成')+'</button>':'<p>'+esc(q.stage==='locked'?q.requirement:q.stage==='expired'?'今日约定时限已过，明日再会。':'今日奇缘已了，明日再会。')+'</p>')+'<div class="feature-meta" style="margin-top:18px">跟宠保底 '+q.petPity.progress+' / '+q.petPity.target+'　·　'+(q.petPity.collectionComplete?'已集齐跟宠':'还需完成 '+q.petPity.remaining+' 次')+'</div></article>').join('')+'</div>';}
  pageInfo.equipment=['装备 · 镶嵌','配齐套装，精炼装备，镶嵌五行石与五彩石。'];
  pageInfo.forge=['神兵 · 铸造','循各年代真实任务次序，收集玄晶与陨铁，铸成自己的橙武。'];
  pageInfo.dungeons=['历代秘境','沿资料片足迹挑战首领，获取装备、套装、玄晶与陨铁。'];
  const X=JXExpansionUI.create({getState:()=>state,ui,esc,fmt,icon,btn,portrait,meta,owned,roleLabel:role=>({tank:'T · 承伤',healer:'治疗',dps:'DPS · 输出'}[role]),report});
  const M=JXMapUI.create({getState:()=>state,ui,esc,btn,icon,portrait,meta,routeInfo:X.routeInfo});
  pageInfo.journey=['本章历程','完成当前目标，再赴下一程江湖。'];
  pageInfo.more=['全部功能','按需要查看养成、挑战与江湖事务。'];
  pageInfo.exchange=['侠名 · 兑换','指定装备、套装与神兵小铁，补齐当前需要的成长资源。'];
  const PUI=JXProgressionUI.create({getState:()=>state,ui,esc,fmt,btn,report});
  const BUI=JXEndgameUI.create({getState:()=>state,ui,esc,fmt,btn});
  const FUI=JXSocialUI.create({getState:()=>state,ui,esc,btn,toast,render,logged:()=>accountUI?.status().active,adopt:e=>accountUI?.adopt(e)});
  const TUI=JXTrialsUI.create({getState:()=>state,esc,btn});
  pageInfo.cosmetics=['角色外观','选择角色，展示已收藏的挂件、跟宠与装束。'];
  const CUI=JXCosmeticsUI.create({getState:()=>state,ui,esc,fmt,btn,portrait});
  const AUI=JXActivitiesUI.create({getState:()=>state,ui,esc,btn,icon});
  const MUI=JXMartialUI.create({getState:()=>state,ui,esc,btn});
  const KUI=JXCardsUI.create({getState:()=>state,ui,esc,btn,portrait,render,toast,save,logged:()=>accountUI?.status().active,locked:()=>accountUI?.active(),adopt:e=>accountUI?.adopt(e)});
  const views={activities:()=>AUI.render('first'),weekly:()=>AUI.render('weekly'),'activity-dungeon':()=>AUI.challenge('dungeon'),'activity-world':()=>AUI.challenge('world'),'activity-tower':()=>AUI.challenge('tower'),'activity-underground':()=>AUI.challenge('underground'),'activity-factory':()=>AUI.challenge('factory'),'activity-support':()=>AUI.support(),martial:()=>MUI.render(),cosmetics:()=>CUI.render(),more:moreView,trials:()=>TUI.render(),endgame:()=>BUI.render(),journey:()=>PUI.journey(),exchange:()=>PUI.exchange(),equipment:()=>X.equipmentView(),forge:()=>X.forgeView(),dungeons:()=>X.dungeonsView(),adventure,map:mapDetailed,team:()=>KUI.render(),dex:dexView,training:trainingView,challenges:challengesView,scenarios:scenarioView,quests:()=>AUI.render('daily'),craft:craftView,tea:teaView,shop:shopView,achievements:()=>questView(true),social:socialView,settings:settingsView,guide:guideView};
  function render(){
    const focusedElement=document.activeElement,focusedControl=focusedElement?.closest('#page,.gui-battle-panel')&&focusedElement.dataset.action?{action:focusedElement.dataset.action,id:focusedElement.dataset.id}:null;
    const summaryKey=el=>{const d=el?.closest('details');return d?.dataset.guiDetail||d?.dataset.guiKey||d?.dataset.mapDetail||d?.dataset.progressionDetail||d?.id||null;};
    const focusedSummary=focusedElement?.tagName==='SUMMARY'?{key:summaryKey(focusedElement),text:focusedElement.textContent.trim(),index:[...document.querySelectorAll('#page summary')].indexOf(focusedElement)}:null;
    const focusedLink=focusedElement?.matches('#page a[href]')?{key:summaryKey(focusedElement),href:focusedElement.getAttribute('href')}:null;
    JXGui.beforeRender();
    if(entered&&accountUI?.status().active&&!JXAccount.status().authenticated)returnEntry();
    if(!entered){accountUI?.entry();return;}
    const samePage=document.body.dataset.page===ui.page,scrolls=samePage?JXScroll.capture($('#page'),true):null;
    const detailKey=(el,i)=>el.dataset.guiDetail||el.id||el.querySelector('summary')?.textContent.trim()||String(i);
    const openDetails=samePage?new Set(Array.from($('#page').querySelectorAll('details')).filter(el=>el.open).map(detailKey)):new Set();
    const focus=samePage&&focusedControl?focusedControl:null;
    const previousScene=ui.page==='adventure'&&combat.owner===state&&(combat.busy||combat.routeId===state.routeId)?combat.scene:null;
    document.body.dataset.page=ui.page;document.body.classList.toggle('no-motion',!state.settings.motion);topbar();
    const route=E.getRoute(state),chapter=$('#chapter-card');
    if(chapter)chapter.innerHTML='<div class="flex"><span class="journey-home-icon">'+icon('sword')+'</span>'+'<div><small>'+esc(JXProgression.current(state).expansion.name)+'</small><strong>'+esc(route.name)+'</strong></div></div><div class="bar"><span style="width:'+pct(state.routeProgress,route.steps)+'%"></span></div><div class="chapter-bottom"><span>'+state.routeProgress+' / '+route.steps+' 段</span><span>Lv.'+route.level+'</span></div>';
    $('#sidebar-pages').innerHTML=sidebarPages();
    document.querySelectorAll('.sidebar .nav-item').forEach(el=>{const active=el.dataset.id===ui.page||primaryNav.some(([id])=>id===el.dataset.id)&&navGroupFor(el.dataset.id)===navGroupFor(ui.page);el.classList.toggle('active',active);if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
    $('#page').innerHTML=subnav()+heading()+(views[ui.page]||moreView)();
    JXVisualUI.mount($('#page'),ui.page,state,icon);
    Array.from($('#page').querySelectorAll('details')).forEach((el,i)=>{if(openDetails.has(detailKey(el,i)))el.open=true;});
    JXScroll.restore($('#page'),scrolls,{resetSelector:ui.resetMapScroll?'.route-list':undefined});ui.resetMapScroll=false;
    const nextScene=$('.scene');
    if(previousScene&&nextScene){if(combat.routeId===state.routeId){for(const selector of ['.scene-caption','.weather','.stage-party'])previousScene.querySelector(selector).innerHTML=nextScene.querySelector(selector).innerHTML;previousScene.className=nextScene.className+' combat-scene';}nextScene.replaceWith(previousScene);}
    combat.mount(previousScene||nextScene);combat.owner=state;if(!previousScene)combat.routeId=state.routeId;
    if(focus?.action){const next=Array.from($('#page').querySelectorAll('[data-action]')).find(el=>el.dataset.action===focus.action&&el.dataset.id===focus.id);next?.focus({preventScroll:true});}
    if(samePage&&focusedSummary){const summaries=[...$('#page').querySelectorAll('summary')],next=focusedSummary.key?summaries.find(el=>summaryKey(el)===focusedSummary.key):summaries[focusedSummary.index]?.textContent.trim()===focusedSummary.text?summaries[focusedSummary.index]:summaries.find(el=>el.textContent.trim()===focusedSummary.text);next?.focus({preventScroll:true});}
    if(samePage&&focusedLink)[...$('#page').querySelectorAll('a[href]')].find(el=>el.getAttribute('href')===focusedLink.href&&summaryKey(el)===focusedLink.key)?.focus({preventScroll:true});
    JXGui.mount({page:ui.page,scene:previousScene||nextScene,panel:$('.gui-battle-panel'),motion:state.settings.motion});
    const isNew=tutorialNew;tutorialNew=false;
    if(ui.ready)JXOnboarding.mount({state,page:ui.page,isNew,scope:JXAccount.status().authenticated?'account':'guest',navigate:id=>{if(!views[id])return;ui.page=id;ui.heroModal=null;$('#sidebar').classList.remove('open');render();}});
  }
  function weaknessStrip(){const route=E.getRoute(state),enemy=state.battle?.enemy||{name:route.boss||route.name},weak=JXCombatRules.weaknesses(enemy,route);return '<div class="weakness-strip '+(enemy.brokenTurns?'break-window':'')+'"><strong>首领弱点</strong>'+weak.map(w=>'<span class="pill">'+esc(w)+'</span>').join('')+'<span>'+(enemy.brokenTurns?'已破招 · 易伤窗口':state.battle?.boss?'韧性 '+Math.ceil(enemy.toughness??enemy.maxToughness??90)+' / '+(enemy.maxToughness||90):'对应兵器削韧，破招后全队高额输出')+'</span>'+btn('配置破招武学','nav','martial','small')+'</div>';}
  function heroModal(id,isMeta=false){
    const h=isMeta?meta(id):meta(owned(id)?.id);if(!h)return;
    const hero=state.heroes.find(o=>o.id===h.id),ss=sect(h.sect),stats=hero?E.getHeroStats(hero):null,profile=JXCombatRules.profile(hero||h,3,{}),player=hero?.uid===state.playerUid;
    ui.heroModal=h.id;
    const origin=h.recruitment?.type==='red-dust'?'在「'+D.EXPANSIONS.find(e=>e.id===h.placement.expansionId).name+'」完成五人试炼后，前往百战异闻录，以640本章通宝定向结缘；或随机结缘、80胜保底。'+(h.crossover?'历史联动内容以本作纪念玩法常驻。':''):h.starterCompanion?'初始四位同行侠客之一；会按主角职责安排初始阵容，茶馆邀约也可结交。':h.recruitment?.type==='memory'?'在安史之乱的血战天策回忆获取。':h.recruitment?.type==='sect-trial'?'本门人物通过门派试炼获取，异派人物通过对应版本百战结缘。':h.hidden?'百战异闻录的隐藏侠客。':'在地图寻访或百战结缘中获取。';
    const statHtml=hero?'<div class="hero-stat-grid"><div><small>气血</small><strong>'+stats.hp+'</strong></div><div><small>攻击</small><strong>'+stats.atk+'</strong></div><div><small>防御</small><strong>'+stats.def+'</strong></div></div><p>等级 '+hero.level+(player?' · 武学 '+(hero.skillLevel||0)+' / 5 · 心得 '+hero.insight:' · 助战侠客，仅提升等级')+'</p><div class="bar xp"><span style="width:'+pct(hero.xp,E.nextLevelXp(hero))+'%"></span></div><p>修为 '+Math.floor(hero.xp)+' / '+E.nextLevelXp(hero)+'</p>':'<p>尚未结缘。'+origin+'</p>';
    const redDustAccess=h.recruitment?.type==='red-dust'?'<div class="notice">'+esc(origin)+btn('前往对应章百战','companion-clue',h.id,'small primary')+'</div>':'';
    const actions=hero&&!player?'<p>此侠影作为收藏卡在幕后提供辅助，好感度与重复副本请在卡册中管理。</p>'+btn('前往侠客卡册','nav','team','primary'):hero?X.heroControls(hero)+'<div class="hero-actions">'+(player?btn('主角装备','hero-equipment',hero.uid,'primary'):btn(state.team.includes(hero.uid)?'暂离队伍':'加入队伍','toggle-team',hero.uid,'primary'))+btn('修炼 · '+E.levelUpCost(hero)+' 银','level',hero.uid)+(player?btn('研习武学','skill-train',hero.uid):'')+btn('服用修为丹','use-exp',hero.uid)+'</div>'+(player?'<p>研习需要 '+(10+(hero.skillLevel||0)*8)+' 心得与 '+(300*((hero.skillLevel||0)+1))+' 银两，每级提高5%武学伤害、治疗与削韧，最高5级。</p>':'<p>侠客以等级与固有武学助战，装备与宝石集中培养主角。</p>'):'';
    const sourceLink=/^https?:\/\//i.test(h.skillSourceUrl||'')?'<a href="'+esc(h.skillSourceUrl)+'" target="_blank" rel="noopener noreferrer">查看武学取材</a>':'';
    const artLabel={ 'official-reference':'像素立绘 · 官方形象取材','game-model-reference':'像素立绘 · 游戏形象取材','original-interpretation':'像素立绘 · 本作演绎' }[h.artSourceType];
    openModal(modalHeader(h.name)+'<div class="modal-body"><div class="hero-detail">'+portrait(h,'hero-detail-art')+'<div><div class="section-label">'+esc(affiliation(h))+' · '+D.RARITIES[h.rarity]+'</div><h2>'+esc(h.name)+'</h2><p class="hero-identity">'+esc(h.identityLabel||h.title)+'</p><p class="bio">'+esc(h.desc)+'</p><p>兵器：'+esc(h.weapon||ss.weapon)+'</p><p class="tiny muted">破招类别：'+esc(h.weaponType||ss.weaponType)+'</p>'+statHtml+'</div></div><div class="hero-skill-list">'+profile.skills.map(skill=>'<article><strong>'+esc(skill.kind)+' · '+esc(skill.name)+'</strong><p>'+esc(skill.description)+'</p><small class="muted">'+esc(skill.sourceLabel||h.skillSourceLabel||'本作改编武学')+'</small></article>').join('')+'</div>'+(sourceLink?'<p class="tiny muted">'+sourceLink+'</p>':'')+(artLabel?'<p class="tiny muted">'+esc(artLabel)+'</p>':'')+redDustAccess+actions+'</div>');
  }
  function welcome(){ui.ready=false;openModal('<div class="welcome-scenery"><h2>江湖拾梦</h2><p>资料片历程 · 从稻香初梦重新出发</p></div><div class="modal-body">'+(balanceReset?'<div class="chapter-reset-note">已按你的要求重置旧进度，旧存档已保留在本机备份。首通本章普通路线后开放下一资料片，精炼、镶嵌与挑战难度可自由追求。</div>':'')+'<div class="name-field"><label for="player-name">少侠名讳</label><input id="player-name" maxlength="16" value="无名少侠" autocomplete="off"></div><h3>选择初始弟子 · 二十门派与无相楼</h3><p class="panel-note">各派弟子均可开启旅途。无相楼为江湖流派；后续可收集各门派侠影，搭配后台辅助卡。</p><div class="starter-grid">'+D.SECTS.map(s=>'<button class="starter '+(ui.starter===s.id?'selected':'')+'" data-action="starter" data-id="'+s.id+'">'+portrait(s)+'<h3>'+s.name+'</h3><p>'+esc(s.weapon)+' · '+({tank:'承伤',healer:'治疗',dps:'输出'}[s.role])+(s.kind==='school'?' · 江湖流派':'')+'</p></button>').join('')+'</div><div class="welcome-note">自动冒险 · 侠影结缘 · 离线收益<br>出发获赠 600 银两、30 张结交帖与行路补给，并赠四张初始辅助卡。随时可在侠客卡册调整辅助。</div></div><div class="modal-footer">'+btn('踏入江湖 '+icon('arrow'),'start','','primary wide')+(globalThis.JXAccount?.configured()?((JXAccount.status().emailAvailable?btn('邮箱登录 / 注册','account-email','login','wide'):'')+(JXAccount.status().googleAvailable?btn('Google 登录 / 注册','account-login','','wide'):'')):'')+'</div>','welcome');}
  function report(title,result){globalThis.JXInteractionFeedback?.result('report',result);const lines=result.log||[result.message];const bosses=(result.bosses||[]).map(b=>'<article>'+(globalThis.JXBossArt?.sprite(b.name)||'')+'<small>'+esc(b.name)+'</small><small>'+(b.won?'已击败':'未击败')+' · '+b.rounds+'回合</small></article>').join('');openModal(modalHeader(title)+'<div class="modal-body"><h3 class="report-title">'+(result.won===true?'挑战告捷':result.won===false?'再接再厉':'江湖有获')+'</h3><p class="text-center">'+esc(result.message)+'</p><div class="reward-line" style="justify-content:center;margin-top:15px">'+rewardText(result.rewards||result.reward)+'</div><div class="report-bosses">'+bosses+'</div><div class="report-log">'+lines.map(x=>'<div>'+esc(typeof x==='string'?x:x.message||JSON.stringify(x))+'</div>').join('')+'</div></div><div class="modal-footer">'+btn('收好行囊，继续出发','close','','primary')+'</div>');}
  function exportSave(){save();const blob=new Blob([E.serialize(state)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='江湖拾梦_'+state.name.replace(/[\\/:*?"<>|]/g,'_')+'_'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('存档已导出，请妥善保存。');}
  function itemModal(id){const item=D.ITEMS.find(x=>x.id===id);openModal(modalHeader(item.name)+'<div class="modal-body"><p>'+item.desc+'</p><p style="margin:12px 0">背包持有 '+fmt(state.inventory[id]||0)+'</p>'+(['medicine','exp'].includes(id)?'<select class="select" id="item-target">'+state.heroes.map(h=>'<option value="'+esc(h.uid)+'">'+meta(h.id).name+' · Lv.'+h.level+'</option>').join('')+'</select>':'')+'</div><div class="modal-footer">'+(['medicine','exp','tea'].includes(id)?btn('使用','use-item',id,'primary'):'')+btn('前往商店','shop-modal','','')+'</div>');}
  document.addEventListener('click',e=>{const target=e.target.closest('[data-action]');if(!target||target.disabled||!entered)return;const action=target.dataset.action,id=target.dataset.id;let result=null; sound();
    if(action==='activity-toggle'){ui.activitiesExpanded=ui.activitiesExpanded===false;render();return;}
    if(action==='activity-tab'){ui.page=id==='weekly'?'weekly':id==='daily'?'quests':'activities';ui.activitiesExpanded=true;render();return;}
    if(['journey-mode','journey-inspect','journey-resume'].includes(action)){result=PUI.action(action,id);globalThis.JXInteractionFeedback?.result(action,result);if(result?.message)toast(result.message);if(result?.ok)combat.reset();save();render();return;}
    if(action.startsWith('martial-')){const result=MUI.handle(action,id,target);globalThis.JXInteractionFeedback?.result(action,result);if(result){if(result.message)toast(result.message);save();render();}return;}
    if(action==='nav'){if(!views[id])return;if(activityPages.some(([page])=>page===id))ui.activitiesExpanded=true;ui.page=id;ui.heroModal=null;$('#sidebar').classList.remove('open');window.scrollTo(0,0);render();return;}
    if(action==='cosmetic-hero'){ui.cosmeticHero=id;render();return;}
    if(action==='cosmetic-tab'){ui.cosmeticTab=id;render();return;}
    if(action==='cosmetic-dex'){ui.page='dex';ui.tab=id==='pet'?'pets':'pendants';render();return;}
    if(action==='cosmetic-source'){const item=JXCosmetics.catalog(state).find(x=>x.id===id);if(item){if(/花萼楼/.test(item.source)){ui.page='tea';}else if(item.expansionId){ui.endgameChapter=item.expansionId;ui.page='endgame';}else if(item.id.startsWith('event:'))ui.page='tea';else ui.page='scenarios';render();}return;}
    if(action==='companion-clue'){const h=meta(id);if(h?.placement){ui.endgameChapter=h.placement.expansionId;ui.page='endgame';closeModal();render();}return;}
    if(action==='collection-focus'){$('#hero-search')?.focus();$('#hero-grid')?.scrollIntoView({behavior:'smooth',block:'center'});return;}
    if(action==='menu'){$('#sidebar').classList.toggle('open');return;}
    if(action==='close'){closeModal();return;}
    if(action==='starter'){ui.starter=id;document.querySelectorAll('.starter').forEach(x=>x.classList.toggle('selected',x.dataset.id===id));return;}
    if(action==='tutorial-reopen'){JXOnboarding.reopen();return;}
    if(action==='start'){state=E.createState($('#player-name').value,ui.starter);S.init(state);ui.ready=true;tutorialNew=true;$('#modal').close();save();render();toast('江湖路远，与君同行。已开启自动历练！');return;}
    if(action==='hero'||action==='dexhero'){heroModal(id,action==='dexhero');return;}
    if(action==='item'){itemModal(id);return;}
    if(action==='shop-modal'){closeModal();ui.page='shop';render();return;}
    if(action==='save'){save(true);return;}
    if(action==='export'){exportSave();return;}
    if(action==='export-old'){const raw=localStorage.getItem(JXSaveEpoch.BACKUP);if(!raw){toast('此入口未保存重制前的旧存档。');return;}const url=URL.createObjectURL(new Blob([raw],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='江湖拾梦_重制前旧存档备份.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('旧存档备份已导出；仅用于保存旧版记录。');return;}
    if(action==='import'){$('#import-file').click();return;}
    if(action==='reset-check'){openModal(modalHeader('重新开启江湖')+'<div class="modal-body"><p>当前侠客、资源和进度将被新存档替换。建议先导出一份备份。</p></div><div class="modal-footer">'+btn('导出备份','export')+btn('取消','close')+btn('确认重新开始','reset','','danger')+'</div>');return;}
    if(action==='reset'){localStorage.removeItem(KEY);ui.page='adventure';ui.starter='chunyang';welcome();return;}
    if(action==='activity-claim')result=JXActivities.claim(state,id);
    else if(action==='cosmetic-equip'){const [uid,itemId]=id.split('|');result=JXCosmetics.equip(state,uid,itemId||'');combat.reset();}
    else if(action==='cosmetic-clear'){const [uid,type]=id.split('|');result=JXCosmetics.clear(state,uid,type);combat.reset();}
    else if(action==='sect-trial'){result=JXTrials.challenge(state,id);if(result.ok)report('门派试炼',result);}
    else if(action==='yangning-memory'){result=JXTrials.memory(state);if(result.ok)report('天枪旧誓',result);}
    else if(action==='auto-lineup'){result=E.autoLineup(state);combat.reset();}
    else if(action==='skill-train')result=E.trainSkill(state,id);
    else if(action==='eq-auto-team')result=JXEquipment.autoEquipTeam(state);
    else if(action==='endgame-start'){result=JXEndgame.start(state,id);if(result.ok)ui.page='endgame';}
    else if(action==='endgame-stop')result=JXEndgame.stop(state);
    else if(action==='endgame-exchange'){const [chapter,reward]=id.split('|');result=JXEndgame.exchange(state,chapter,reward,ui.equipmentHero||state.team[0]);}
    else if(action==='endgame-equip')result=JXCosmetics.equip(state,state.playerUid||state.team[0],'pendant:'+id);
    else if(action==='endgame-wear')result=JXCosmetics.toggle(state,state.playerUid||state.team[0],id);
    else if(action==='chapter-advance'||action==='renown-exchange'||action==='journey-attempt'){result=PUI.action(action,id);if(result?.ok)combat.reset();}
    else if(action.startsWith('eq-')||action.startsWith('forge-')||action==='expedition'){result=X.action(action,id);if(result?.ok)combat.reset();}
    else if(action==='hero-equipment'){closeModal();ui.equipmentHero=id;ui.page='equipment';}
    else if(action==='set-role'){const [uid,role]=id.split('|');result=E.setRole(state,uid,role);}
    else if(action==='auto-advance'){state.autoAdvance=!state.autoAdvance;}
    else if(action==='running'){state.running=!state.running;combat.setPaused(!state.running);}
    else if(action==='formation')result=E.prepareFormation(state);
    else if(action==='speed')state.speed=Number(id);
    else if(action==='auto')state.autoInvite=!state.autoInvite;
    else if(action==='sound'){state.settings.sound=!state.settings.sound;toast('音效已'+(state.settings.sound?'开启':'关闭'));if(state.settings.sound)sound('reward');}
    else if(action==='motion')state.settings.motion=!state.settings.motion;
    else if(action==='region'){ui.region=id;ui.mapExpansion=id;ui.mapChapter=null;ui.mapSelection=null;ui.resetMapScroll=true;}
    else if(action==='map-focus-dungeon')result=M.action(action,id);
    else if(action==='journey-source')result=PUI.action(action,id);
    else if(action==='map-chapter'){ui.mapChapter=ui.mapChapter===id?null:id;ui.mapSelection=null;ui.resetMapScroll=true;}
    else if(action==='map-kind'){ui.mapKind=id;ui.mapChapter=null;ui.mapSelection=null;ui.resetMapScroll=true;}
    else if(action==='select-route')ui.mapSelection=id;
    else if(action==='scenario'){const parts=id.split('|');result=S.chooseScenario(state,parts[0],parts[1]);}
    else if(action==='dex-tab')ui.tab=id;
    else if(action==='travel'){result=E.setRoute(state,id);if(result.ok){ui.page='adventure';state.running=true;combat.detach();}}
    else if(action==='toggle-team')result=E.toggleTeam(state,id);
    else if(action==='level')result=E.levelUp(state,id);
    else if(action==='breakthrough')result=E.breakthrough(state,id);
    else if(action==='use-exp')result=E.useItem(state,'exp',id);
    else if(action==='use-medicine')result=E.useItem(state,'medicine',id);
    else if(action==='use-item'){result=E.useItem(state,id,$('#item-target')?.value);if(result.ok)closeModal();}
    else if(action==='buy'||action==='buy-five')result=E.buyItem(state,id,action==='buy-five'?5:1);
    else if(action==='save-preset')result=E.savePreset(state,Number(id));
    else if(action==='load-preset')result=E.loadPreset(state,Number(id));
    else if(action==='train')result=S.startTraining(state,$('#train-'+id).value);
    else if(action==='claim-training')result=S.claimTraining(state,Number(id));
    else if(action==='invite')result=S.startInvitation(state);
    else if(action==='claim-invite')result=S.claimInvitation(state,Number(id));
    else if(action==='quest')result=S.claimQuest(state,id);
    else if(action==='achievement')result=S.claimAchievement(state,id);
    else if(action==='craft')result=S.craft(state,id);
    else if(action==='tea'){result=id==='checkin'?JXEndgame.checkIn(state):S.playTea(state,id);if(result.ok)report(id==='checkin'?'花萼楼签到':'茶馆旧令',result);}
    else if(action==='challenge'){result=S.challenge(state,id);if(result.ok)report(S.challenges(state).find(x=>x.id===id)?.name||'挑战战报',result);}
    else if(action==='pet')result=JXCosmetics.equip(state,state.playerUid||state.team[0],'companion:'+id);
    else if(action==='pet-info'){toast('跟宠会在江湖历练中随机出现，继续探索不同地区吧。');return;}
    if(result){if(result.message)toast(result.message);if(result.ok){sound('reward');if(['level','skill-train','use-exp','use-medicine','use-item'].includes(action))combat.reset();}}
    save();render();JXVisualUI.feedback(action,result);globalThis.JXInteractionFeedback?.result(action,result);if(ui.heroModal&&['toggle-team','level','skill-train','use-exp','use-medicine','set-role'].includes(action))heroModal(ui.heroModal,true);
  });
  document.addEventListener('change',e=>{if(!entered)return;if(e.target.dataset.change==='cosmetic-hero'){ui.cosmeticHero=e.target.value;render();}if(e.target.dataset.change==='endgame-chapter'){ui.endgameChapter=e.target.value;render();}if(e.target.dataset.change==='exchange-chapter'){ui.exchangeChapter=e.target.value;render();}if(e.target.dataset.change==='exchange-hero'){ui.equipmentHero=e.target.value;render();}if(e.target.dataset.change==='exchange-quantity'){ui.exchangeQuantity=Number(e.target.value);render();}if(e.target.dataset.change==='auto')state.autoInvite=e.target.checked;if(e.target.dataset.change==='route-loop'){const ids=Array.from(document.querySelectorAll('[data-change="route-loop"]:checked')).map(el=>el.value);const result=E.setRouteLoop(state,ids);toast(result.message);render();}if(e.target.dataset.change==='filter'){ui.filter=e.target.value;render();}if(e.target.dataset.change==='sort'){ui.sort=e.target.value;render();}save();});
  document.addEventListener('input',e=>{if(e.target.id==='hero-search'){ui.query=e.target.value;const start=e.target.selectionStart;render();const input=$('#hero-search');input.focus();input.setSelectionRange(start,start);}});
  $('#modal').addEventListener('cancel',e=>{if(!ui.ready)e.preventDefault();else ui.heroModal=null;});
  $('#modal').addEventListener('click',e=>{if(e.target===$('#modal')&&ui.ready){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});
  $('#import-file').addEventListener('change',async e=>{const f=e.target.files[0];if(!f||!entered)return;try{if(accountUI?.active())throw new Error('请退出账号后再导入游客存档。');if(f.size>5e6)throw new Error('存档文件超过 5 MB。');const raw=await f.text();if(accountUI?.active())throw new Error('账号已切换，请退出账号后再导入游客存档。');const imported=E.parseSave(raw);S.init(imported);const awaySeconds=Math.max(0,(Date.now()-imported.lastSaved)/1000);if(awaySeconds>60)E.applyOffline(imported,awaySeconds);S.syncCalendar(imported);state=imported;ui.ready=true;ui.page='adventure';closeModal();save();render();toast('存档已导入，欢迎重返江湖。');}catch(error){toast('导入失败：'+error.message);}e.target.value='';});
  window.addEventListener('pagehide',()=>{if(ui.ready)save();});
  document.addEventListener('visibilitychange',()=>{if(ui.ready){if(document.hidden)save();combat.reset();}});
  accountUI=JXAccountUI.create({getState:()=>state,ui,esc,btn,save,toast,report,render,
    captureGuest:()=>{const copy=JSON.parse(E.serialize(state));if(entered)copy.lastSaved=Date.now();return JSON.stringify(copy);},
    registration:()=>({name:$('#account-player-name')?.value||$('#player-name')?.value||state.name,starter:$('#account-player-sect')?.value||(ui.ready?meta(state.heroes[0]?.id)?.sect||'chunyang':ui.starter)}),
    atEntry:()=>!entered,entry,returnEntry,enterGuest,
    setState:(next,presentation={})=>{const opening=!entered;if(opening&&next.clock===0)tutorialNew=true;entered=true;ensureCombat();const keep=!presentation.reset&&state.routeId===next.routeId;state=next;ui.ready=true;fresh=false;if(keep){combat.owner=state;combat.setPaused(!state.running);combat.receive(presentation.events||[]);}else combat.reset();if(opening){lastFrame=performance.now();shell();}},
    open:html=>entered?openModal(html):entry(html),close:()=>{$('#modal').close();ui.heroModal=null;},cancel:()=>{if(!entered){$('#app').innerHTML='';accountUI.entry();}else if(ui.ready)closeModal();else welcome();},
    restoreGuest:(raw,options={})=>{try{let stored=null;try{stored=localStorage.getItem(KEY);}catch{}const candidates=[raw,stored].filter(Boolean).flatMap(value=>{try{return [E.parseSave(value)];}catch{return [];}});if(!candidates.length)throw new Error('未找到可恢复的游客备份；已暂停存档写入。');state=candidates.sort((a,b)=>b.lastSaved-a.lastSaved)[0];const ready=options.ready!==false||!!stored;S.init(state);ui.ready=ready;fresh=!ready;ui.page='adventure';combat?.detach();return true;}catch(e){toast(e.message);return false;}},
    offline:r=>{if(r.seconds>=60)setTimeout(()=>showOffline(r),0);},
    after:(action,result)=>{if(result?.ok&&action==='travel')ui.page='adventure';if(result?.ok&&action==='chapter-advance')ui.page='journey';if(action==='journey-attempt'){ui.journeyResult={...result,log:result?.log||[result?.message||'暂未完成挑战。']};if(result?.ok)ui.page=result.page||'journey';}if(result?.ok&&action==='endgame-start')ui.page='endgame';if(ui.heroModal&&['skill-train','level','toggle-team','set-role','use-exp'].includes(action))heroModal(ui.heroModal,true);render();JXVisualUI.feedback(action,result);globalThis.JXInteractionFeedback?.result(action,result);}
  });
  let assetsReady=false;
  JXAssets.prepare().then(()=>{assetsReady=true;lastFrame=performance.now();accountUI.entry();accountUI.restore();}).catch(error=>console.error('资源预载失败',error));
  setInterval(()=>{const now=performance.now(),elapsed=(now-lastFrame)/1000;lastFrame=now;if(!assetsReady)return;if(!entered){accountUI.poll(now);return;}if(accountUI.active()){accountUI.poll(now);return;}if(!ui.ready)return;try{S.syncCalendar(state);let events=[];if(elapsed>60){const away=E.applyOffline(state,elapsed);if(away.silver)toast('离开期间获得 '+away.silver+' 银两，已计入行囊。');}else events=E.tick(state,Math.min(elapsed,60)*state.speed,Math.random,Math.min(elapsed,60));S.syncCalendar(state);S.tick(state,elapsed);if(events.length)ui.lastEvent=events.at(-1).message;if(document.hidden||elapsed>2)combat.reset();else combat.receive(events);if(events.some(e=>['recruit','badge','pet','formation-ready'].includes(e.type))){sound('reward');const e=events.find(e=>['recruit','badge','pet','formation-ready'].includes(e.type));toast(e.message);}if(now-lastPaint>850&&!document.hidden&&!JXScroll.busy()&&!['INPUT','SELECT'].includes(document.activeElement?.tagName)){render();lastPaint=now;}if(now-lastSave>10000){save();lastSave=now;}}catch(error){console.error('历练运行错误',error);state.running=false;toast('历练暂时停止，请导出存档并重新载入。');}},250);
  // Read-only state snapshot for inspection; normal actions remain in the UI.
  globalThis.JXGame={snapshot:()=>JSON.parse(JSON.stringify(state)),combat:()=>combat?.inspect()||{initialized:false},version:'6.0.0'};
})();



