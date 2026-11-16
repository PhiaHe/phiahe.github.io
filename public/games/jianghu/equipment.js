(function (root) {
  'use strict';
  const D = root.JXData;
  const SLOTS = [
    ['weapon','武器',2],['head','帽子',2],['chest','上衣',2],['waist','腰带',2],['wrist','护腕',2],['legs','下装',2],['feet','鞋子',2],
    ['necklace','项链',1],['pendant','腰坠',1],['ring1','戒指·左',1],['ring2','戒指·右',1],['ranged','暗器',0]
  ].map(([id,name,sockets])=>({id,name,sockets}));
  const COLORS = [
    {id:'attack',name:'会心·破防·攻击五彩石',desc:'依次激活会心、伤害、攻击。'},
    {id:'guard',name:'御劲·防御·气血五彩石',desc:'依次激活防御、减伤、气血。'},
    {id:'heal',name:'疗效·会心·治疗五彩石',desc:'依次激活攻击、会心、治疗。'}
  ];
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
  function parseColor(key,level){const match=typeof key==='string'&&/^(attack|guard|heal)(?::([2-6]))?$/.exec(key);if(!match)return null;const grade=level===undefined?Number(match[2]||1):level;if(!integer(grade,1,6)||match[2]&&grade!==Number(match[2]))return null;return {id:match[1],level:grade,key:colorKey(match[1],grade)};}
  // The enhancement belongs to a hero slot within one expansion. Replacing a
  // piece within that expansion preserves it; crossing expansions starts anew.
  function changeSeason(hero,item){
    hero.enhancements??={};const id=expansionForItem(item),en=hero.enhancements[item.slot],previous=hero.equipment?.[item.slot];
    const oldId=en?.expansionId||(previous?expansionForItem(previous):null),changed=!!oldId&&oldId!==id;
    if(changed||!en)hero.enhancements[item.slot]={refine:0,sockets:[],expansionId:id};
    else en.expansionId=id;
    if(changed&&item.slot==='weapon'){delete hero.colorStone;delete hero.colorStoneLevel;}
    return changed;
  }
  function projectedLoadout(hero,gear){const copy={...hero,equipment:{...hero.equipment},enhancements:clone(hero.enhancements||{})};for(const item of Object.values(gear))if(item.uid!==hero.equipment?.[item.slot]?.uid)changeSeason(copy,item);copy.equipment=gear;return copy;}
  function init(state) {
    if(!state.equipment) state.equipment={version:1,bag:[],materials:{},stones:{1:8},colors:{attack:1,guard:1,heal:1},quests:{},nextId:1,lootCount:0,dungeons:{}};
    const e=state.equipment;
    for(const h of state.heroes||[]){if(!h.equipment)h.equipment={};if(!h.enhancements)h.enhancements={};}
    return e;
  }
  function enhancements(hero,slot) {
    if(!hero.enhancements)hero.enhancements={};
    if(!hero.enhancements[slot])hero.enhancements[slot]={refine:0,sockets:[],expansionId:expansionForItem(hero.equipment?.[slot])};
    if(!hero.enhancements[slot].expansionId)hero.enhancements[slot].expansionId=expansionForItem(hero.equipment?.[slot]);
    return hero.enhancements[slot];
  }
  function createItem(state,options={}) {
    const e=init(state),slot=slotDef(options.slot)?options.slot:'weapon';
    const item={uid:`gear_${e.nextId++}`,slot,level:Math.min(100,Math.max(1,Math.floor(options.level||5))),rarity:options.rarity||'rare',sect:slot==='weapon'?(options.sect||null):null,
      set:options.set||null,effect:options.effect||null,recipeId:options.recipeId||null,role:options.role||null,stage:options.stage||0,name:options.name||`${options.set||'江湖'}·${slotDef(slot).name}`,source:options.source||'野外历练',expansionId:options.expansionId||currentExpansion(state)?.id};
    if(e.bag.length>=300){e.stones[1]=(e.stones[1]||0)+4;return null;}
    e.bag.push(item); return item;
  }
  function permitted(hero,item){return item && (!item.sect||item.sect===meta(hero)?.sect) && (!item.role||item.role===role(hero));}
  function equip(state,uid,itemUid) {
    const e=init(state),h=owned(state,uid),index=e.bag.findIndex(x=>x.uid===itemUid);
    if(state.battle)return fail('请等待当前战斗结束后整备。');
    if(!h||index<0)return fail('侠客或装备不存在。');
    const item=e.bag[index]; if(!permitted(h,item))return fail('这件兵器的门派或职责与侠客不符。');
    const previous=h.equipment[item.slot],seasonChanged=changeSeason(h,item);e.bag.splice(index,1);if(previous)e.bag.push(previous);h.equipment[item.slot]=item;
    clampHealth(h);return success(`已装备${item.name}。${seasonChanged?'跨资料片更换，此部位需重新精炼与镶嵌。':''}`,{seasonChanged});
  }
  function unequip(state,uid,slot) {
    const e=init(state),h=owned(state,uid);if(state.battle)return fail('请等待当前战斗结束后整备。');
    if(!h?.equipment[slot])return fail('这个部位没有装备。');if(e.bag.length>=300)return fail('装备行囊已满，请先分解。');
    e.bag.push(h.equipment[slot]);delete h.equipment[slot];clampHealth(h);return success('装备已收入行囊，部位精炼与熔嵌保留。');
  }
  function clampHealth(h){if(root.JXEngine)h.hp=Math.min(h.hp,root.JXEngine.getHeroStats(h).hp);}
  function salvage(state,itemUid){const e=init(state),i=e.bag.findIndex(x=>x.uid===itemUid);if(i<0)return fail('装备不存在。');if(e.bag[i].rarity==='legendary')return fail('稀世神兵不可分解。');const amount=e.bag[i].rarity==='epic'?8:3;e.bag.splice(i,1);e.stones[1]=(e.stones[1]||0)+amount;return success(`分解得到 ${amount} 颗一级五行石。`);}
  function refine(state,uid,slot){const e=init(state),h=owned(state,uid),item=h?.equipment[slot];if(state.battle)return fail('请等待当前战斗结束后精炼。');if(!item)return fail('请先装备该部位。');const en=enhancements(h,slot),cap=item.rarity==='legendary'?8:6,cost=(en.refine+1)*80;if(en.refine>=cap)return fail('已达当前装备精炼上限。');if(state.silver<cost||(e.stones[1]||0)<en.refine+1)return fail(`需要 ${cost} 银两与 ${en.refine+1} 颗一级五行石。`);state.silver-=cost;e.stones[1]-=en.refine+1;en.refine++;return success(`${slotDef(slot).name}精炼至 ${en.refine} 级。`);}
  function socket(state,uid,slot,level){const e=init(state),h=owned(state,uid),sd=slotDef(slot);if(state.battle)return fail('请等待当前战斗结束后熔嵌。');if(!h?.equipment[slot]||!sd?.sockets||!integer(level,1,8))return fail('部位或五行石等级无效。');const en=enhancements(h,slot);let index=en.sockets.findIndex(x=>x<level);if(en.sockets.length<sd.sockets)index=en.sockets.length;if(index<0)return fail('镶嵌孔已满，只能换入更高等级五行石。');if(!(e.stones[level]>0))return fail(`缺少 ${level} 级五行石。`);e.stones[level]--;en.sockets[index]=level;return success(`熔嵌 ${level} 级五行石，原有石头在覆盖时消耗。`);}
  function fuseStone(state,level){const e=init(state);if(!integer(level,1,7))return fail('请选择1至7级五行石。');if((e.stones[level]||0)<3||state.silver<level*40)return fail(`合成需要3颗同级五行石与 ${level*40} 银两。`);e.stones[level]-=3;e.stones[level+1]=(e.stones[level+1]||0)+1;state.silver-=level*40;return success(`合成1颗 ${level+1} 级五行石。`);}
  function inlayColor(state,uid,colorId,level){const e=init(state),h=owned(state,uid),color=parseColor(colorId,level);if(state.battle)return fail('请等待当前战斗结束后熔嵌。');if(!h?.equipment.weapon||!color)return fail('请先装备武器，并选择1至6级五彩石。');if(!(e.colors[color.key]>0))return fail('没有这类等级的五彩石，可通过秘境或侠名兑换获得。');if(h.colorStone===color.id&&(h.colorStoneLevel||1)===color.level)return fail('已镶嵌相同五彩石，无需重复消耗。');e.colors[color.key]--;h.colorStone=color.id;h.colorStoneLevel=color.level;clampHealth(h);return success(`${color.level}级五彩石已熔嵌；满足全身五行石数量与等级后逐条生效。`);}
  function colorStatus(hero){const stones=SLOTS.flatMap(s=>hero.equipment?.[s.id]?(hero.enhancements?.[s.id]?.sockets||[]):[]),count=stones.length,total=stones.reduce((a,b)=>a+b,0),level=hero.colorStone?hero.colorStoneLevel||1:0,thresholds=[6,12,18].map(n=>({count:n,total:n*Math.max(2,level+1)}));const active=hero.equipment?.weapon&&hero.colorStone?thresholds.filter(t=>count>=t.count&&total>=t.total).length:0;return {id:hero.colorStone||null,key:hero.colorStone?colorKey(hero.colorStone,level):null,level,count,total,active,thresholds,note:'五彩石1—6级；每升一级提高词条数值与五行石激活要求。'};}
  function setCounts(hero){const out={};for(const [slot,item]of Object.entries(hero.equipment||{})){if(slotDef(slot)&&item.set&&permitted(hero,item))out[item.set]=(out[item.set]||0)+1;}return out;}
  function bonuses(hero){let hp=0,atk=0,def=0,crit=0,damageMultiplier=1,healMultiplier=1,damageReduction=0;for(const [slot,item]of Object.entries(hero.equipment||{})){if(!permitted(hero,item))continue;const en=hero.enhancements?.[slot]||{},rarity={rare:1,epic:1.5,legendary:2.2}[item.rarity]||1,scale=(1+Math.min(en.refine||0,item.rarity==='legendary'?8:6)*.06)*(1+(item.stage||0)*.12),v=(4+item.level*.75)*rarity*scale;atk+=slot==='weapon'?v*1.8:v*.28;hp+=slot==='weapon'?v*1.5:v*4;def+=slot==='weapon'?v*.12:v*.3;const sum=(en.sockets||[]).reduce((a,b)=>a+b,0);atk+=sum*.7;hp+=sum*3;def+=sum*.25;}
    for(const count of Object.values(setCounts(hero))){if(count>=2){atk+=12;def+=6;}if(count>=4){damageMultiplier+=.12;healMultiplier+=.12;}if(count>=6)damageReduction+=.08;}
    const color=colorStatus(hero),gradeScale=1+(color.level-1)*.22;if(color.active){if(color.id==='attack'){crit+=.04*gradeScale;if(color.active>=2)damageMultiplier+=.08*gradeScale;if(color.active>=3)atk+=25*gradeScale;}if(color.id==='guard'){def+=12*gradeScale;if(color.active>=2)damageReduction+=.06*gradeScale;if(color.active>=3)hp+=180*gradeScale;}if(color.id==='heal'){atk+=10*gradeScale;if(color.active>=2)crit+=.04*gradeScale;if(color.active>=3)healMultiplier+=.16*gradeScale;}}
    return {hp:Math.floor(hp),atk:Math.floor(atk),def:Math.floor(def),crit,damageMultiplier,healMultiplier,damageReduction:Math.min(.4,damageReduction)};
  }
  function combatProfile(hero,turn=1,critical=false){const b=bonuses(hero),w=hero.equipment?.weapon,p={damageMultiplier:b.damageMultiplier,healMultiplier:b.healMultiplier,damageReduction:b.damageReduction,lifesteal:0,extraStrike:0,revive:0,teamHeal:0,label:''};if(!permitted(hero,w))return p;
    if(w.effect==='water'){p.damageMultiplier+=Math.min(.18,Math.max(0,turn-1)*.03);p.label='水特效·叠浪';}
    if(w.effect==='heal'){p.healMultiplier+=.15;p.label='治疗特效';}
    if(w.rarity==='legendary'){p.label='稀世神兵';const r=role(hero);if(r==='tank'){p.damageReduction=Math.min(.6,p.damageReduction+.2);p.revive=1;p.label='神兵·不屈';}else if(r==='healer'){p.healMultiplier+=.25;p.teamHeal=turn%3===0?.7:0;p.label='神兵·济世';}else{p.damageMultiplier+=.15;p.extraStrike=turn%3===0?1:0;p.lifesteal=critical?.12:0;p.label='神兵·破阵';}}return p;}
  function heroInfo(state,uid){init(state);const h=owned(state,uid);if(!h)return null;return {slots:SLOTS.map(s=>{const en=h.enhancements[s.id]||{refine:0,sockets:[]};return {...s,item:h.equipment[s.id]||null,compatible:!h.equipment[s.id]||permitted(h,h.equipment[s.id]),refine:en.refine,sockets:en.sockets,socketCount:s.sockets,refineCost:(en.refine+1)*80};}),bonuses:bonuses(h),colorStatus:colorStatus(h),setBonuses:Object.entries(setCounts(h)).map(([name,count])=>({name,count,active:[2,4,6].filter(n=>count>=n),desc:'2件：攻击+12/防御+6；4件：伤害与治疗+12%；6件：减伤8%。'})),orange:combatProfile(h,3,true)};}
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
  function quickGuard(state,uid){const h=owned(state,uid),message=state.battle?'请先战后整队，战斗结束后再一键整备。':!h?'侠客不存在。':'';return message?quickResult(h,h?loadoutScore(h):0,[],emptyCosts(),message):null;}
  function itemValue(h,item){if(!item||!permitted(h,item))return 0;const current=h.enhancements?.[item.slot]||{},owner=current.expansionId||(h.equipment?.[item.slot]?expansionForItem(h.equipment[item.slot]):null),en=owner&&owner!==expansionForItem(item)?{}:current;return (4+item.level*.75)*({rare:1,epic:1.5,legendary:2.2}[item.rarity]||1)*(1+Math.min(en.refine||0,item.rarity==='legendary'?8:6)*.06)*(1+(item.stage||0)*.12);}
  function strongerItem(h,a,b){if(!a)return b;if(!b)return a;const delta=itemValue(h,b)-itemValue(h,a);return delta>1e-8||Math.abs(delta)<1e-8&&b.uid===h.equipment?.[b.slot]?.uid?b:a;}
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
    // Different raw item coefficients can round to the same real combat stats.
    // Restore worn pieces whenever doing so preserves the completed loadout score.
    let stable={...best},changed=true;while(changed){changed=false;for(const sd of SLOTS){const old=h.equipment?.[sd.id];if(stable[sd.id]?.uid===old?.uid)continue;const restored={...stable};if(old)restored[sd.id]=old;else delete restored[sd.id];const score=loadoutScore(projectedLoadout(h,restored));if(score>=bestScore-1e-8){stable=restored;bestScore=score;changed=true;}}}
    return stable;
  }
  function autoEquip(state,uid){const rejected=quickGuard(state,uid);if(rejected)return rejected;const h=owned(state,uid),before=loadoutScore(h),costs=emptyCosts(),e=state.equipment||{bag:[]},gear=recommendedGear(h,e.bag),changes=gearChanges(h,gear);
    if(!changes.length)return quickResult(h,before,[],costs,'当前角色已采用现有装备中的推荐配置。');
    const picked=new Set(Object.values(gear).map(x=>x.uid)),nextBag=[...e.bag,...Object.values(h.equipment||{})].filter(x=>!picked.has(x.uid));
    if(nextBag.length>300)return quickResult(h,before,[],costs,'装备行囊已满，暂无法完成这次整备。');
    init(state).bag=nextBag;for(const item of Object.values(gear))if(item.uid!==h.equipment?.[item.slot]?.uid)changeSeason(h,item);h.equipment=gear;clampHealth(h);return quickResult(h,before,changes,costs,`已为${meta(h).name}调整 ${changes.length} 件装备，优先兼顾职责、套装与武器特效；跨资料片部位需重新强化。`);
  }
  function equipChapter(state,uid){
    const rejected=quickGuard(state,uid);if(rejected)return rejected;
    const h=owned(state,uid),expansion=currentExpansion(state),before=loadoutScore(h),changes=[],costs=emptyCosts(),choices=[];
    for(const sd of SLOTS){
      const worn=h.equipment?.[sd.id],armor=['head','chest','waist','wrist','legs','feet'].includes(sd.id),wornCurrent=worn&&expansionForItem(worn)===expansion.id&&permitted(h,worn);
      if(wornCurrent&&armor&&worn.set===expansion.setName)continue;
      const candidates=(state.equipment?.bag||[]).filter(item=>item.slot===sd.id&&expansionForItem(item)===expansion.id&&permitted(h,item));
      candidates.sort((a,b)=>(armor?Number(b.set===expansion.setName)-Number(a.set===expansion.setName):0)||itemValue(h,b)-itemValue(h,a)||a.uid.localeCompare(b.uid));
      const next=candidates[0];
      if(next&&(!wornCurrent||armor&&next.set===expansion.setName||itemValue(h,next)>itemValue(h,worn)))choices.push(next);
    }
    for(const item of choices){const previous=h.equipment?.[item.slot],result=equip(state,uid,item.uid);if(result.ok)changes.push({type:'equip',slot:item.slot,from:previous?.name||null,to:item.name,itemUid:item.uid,seasonChanged:result.seasonChanged});}
    return quickResult(h,before,changes,costs,changes.length?`已换穿 ${changes.length} 件「${expansion.name}」装备；跨资料片部位已清空精炼和镶嵌，请重新强化。`:'已穿戴本章装备，或背包中没有适合该侠客的本章装备。');
  }
  function autoRefine(state,uid){const rejected=quickGuard(state,uid);if(rejected)return rejected;const h=owned(state,uid),before=loadoutScore(h),costs=emptyCosts(),changes=[];
    while(true){const candidates=SLOTS.filter(sd=>permitted(h,h.equipment?.[sd.id])&&(h.enhancements?.[sd.id]?.refine||0)<(h.equipment[sd.id].rarity==='legendary'?8:6)).sort((a,b)=>(h.enhancements?.[a.id]?.refine||0)-(h.enhancements?.[b.id]?.refine||0));if(!candidates.length)break;
      const sd=candidates[0],from=h.enhancements?.[sd.id]?.refine||0,stones=from+1,silver=stones*80;if(state.silver<silver||(state.equipment?.stones?.[1]||0)<stones)break;
      const result=refine(state,uid,sd.id);if(!result.ok)break;costs.silver+=silver;costs.stones[1]=(costs.stones[1]||0)+stones;changes.push({type:'refine',slot:sd.id,from,to:from+1});
    }
    return quickResult(h,before,changes,costs,changes.length?`已完成 ${changes.length} 次精炼，优先均衡提升低精炼部位。`:'没有可精炼的装备，或现有银两与一级五行石不足。');
  }
  function autoSocket(state,uid){const rejected=quickGuard(state,uid);if(rejected)return rejected;const h=owned(state,uid),before=loadoutScore(h),costs=emptyCosts(),changes=[];
    while(true){const holes=[];for(const sd of SLOTS)if(permitted(h,h.equipment?.[sd.id]))for(let i=0;i<sd.sockets;i++)holes.push({slot:sd.id,index:i,level:h.enhancements?.[sd.id]?.sockets[i]||0});holes.sort((a,b)=>a.level-b.level);const hole=holes[0];if(!hole)break;let level=8;while(level>hole.level&&!(state.equipment?.stones?.[level]>0))level--;if(level<=hole.level)break;
      const e=init(state),en=enhancements(h,hole.slot);e.stones[level]--;en.sockets[hole.index]=level;costs.stones[level]=(costs.stones[level]||0)+1;changes.push({type:'socket',slot:hole.slot,index:hole.index,from:hole.level,to:level});
    }
    if(permitted(h,h.equipment?.weapon)){let color=null,best=loadoutScore(h);for(const [key,count]of Object.entries(state.equipment?.colors||{})){const candidate=parseColor(key);if(!candidate||count<=0||h.colorStone&&candidate.level<(h.colorStoneLevel||1)||candidate.id===h.colorStone&&candidate.level===(h.colorStoneLevel||1))continue;const score=loadoutScore({...h,colorStone:candidate.id,colorStoneLevel:candidate.level});if(score>best+1e-8){color=candidate;best=score;}}
      if(color){const from=h.colorStone?colorKey(h.colorStone,h.colorStoneLevel||1):null;state.equipment.colors[color.key]--;h.colorStone=color.id;h.colorStoneLevel=color.level;costs.colors[color.key]=1;changes.push({type:'color',slot:'weapon',from,to:color.key});}
    }
    if(changes.length)clampHealth(h);return quickResult(h,before,changes,costs,changes.length?`已完成 ${changes.filter(x=>x.type==='socket').length} 处五行石镶嵌${changes.some(x=>x.type==='color')?'，并配置更适合当前职责的五彩石':''}。`:'现有五行石与五彩石暂不能带来进一步提升。');
  }
  function autoEnhance(state,uid){const rejected=quickGuard(state,uid);if(rejected)return rejected;const h=owned(state,uid),before=loadoutScore(h),socketResult=autoSocket(state,uid),refineResult=autoRefine(state,uid),changes=[...socketResult.changes,...refineResult.changes],costs=emptyCosts();
    for(const result of [socketResult,refineResult]){costs.silver+=result.costs.silver;for(const type of ['stones','colors'])for(const [key,n]of Object.entries(result.costs[type]))costs[type][key]=(costs[type][key]||0)+n;}
    return quickResult(h,before,changes,costs,changes.length?`已强化当前穿戴装备：镶嵌 ${socketResult.changes.length} 处，精炼 ${refineResult.changes.length} 次。`:'当前穿戴装备暂不能用现有资源继续强化。');
  }
  function quickPreview(state,uid){return {equip:autoEquip(clone(state),uid),refine:autoRefine(clone(state),uid),socket:autoSocket(clone(state),uid),enhance:autoEnhance(clone(state),uid)};}
  const recipeExpansion = recipe => (D.DUNGEONS||[]).find(d=>d.era===recipe.era&&d.materialDrop!==false)?.expansionId || (D.EXPANSIONS||[]).find(e=>e.era===recipe.era)?.id;
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
    const q=e.quests[`${uid}:${recipeId}`]||{stage:0},{steps,grantAt}=forgePlan(r,h),stage=q.stage;let cost={};
    if(stage===0)cost=r.mode==='growth'?{[r.bigIron]:1}:{[r.bigIron]:1,[r.smallIron]:200};else if(r.mode==='growth'&&stage>grantAt&&stage<steps.length)cost={[r.smallIron]:50};
    const requirements=Object.entries(cost).map(([name,amount])=>({id:name,name,amount,have:e.materials[name]||0,owned:e.materials[name]||0,required:amount}));
    const known=!!WEAPON_NAMES[r.era][sectId(h)],upgrade=stage>grantAt&&stage<steps.length&&r.mode==='growth';
    const weaponPresent=!upgrade||e.bag.some(x=>x.uid===q.itemUid)||Object.values(h.equipment).some(x=>x.uid===q.itemUid);
    const reason=root.JXProgression&&!root.JXProgression.isExpansionUnlocked(state,recipeExpansion(r))?'此神兵所属资料片尚未开放。':!known?'此门派该年代神兵名称尚未核实，请选择苍生铸世神兵。':q.role&&q.role!==role(h)?'请切回接取时的职责后继续。':state.battle?'请等待当前战斗结束。':requirements.some(x=>x.have<x.amount)?'材料尚未备齐。':stage===grantAt&&e.bag.length>=300?'装备行囊已满，请先分解或装备。':!weaponPresent?'请先把此神兵交回原锻造侠客，才能继续升品。':'';
    return {...r,weaponName:weaponName(h,r),stage,steps:steps.map((name,i)=>({name,desc:name,done:i<stage,current:i===stage})),nextLabel:steps[stage]||'神兵大成',completed:stage>=steps.length,canAdvance:stage<steps.length&&!reason,reason,requirements,sourceNames:(D.DUNGEONS||[]).filter(x=>x.materialDrop!==false&&(x.bigIron===r.bigIron||x.smallIron===r.smallIron)).map(x=>x.name),upgrade:r.mode==='growth'?Math.max(0,stage-grantAt-1):0,note:r.note};
  }
  function forgeStep(state,uid,recipeId){const info=forgeInfo(state,uid,recipeId);if(!info)return fail('侠客或神兵配方不存在。');if(info.completed)return fail('这位侠客的此件神兵已完成。');if(!info.canAdvance)return fail(info.reason);const e=state.equipment,h=owned(state,uid),r=getRecipe(recipeId),key=`${uid}:${recipeId}`,q=e.quests[key]||{stage:0,role:role(h)},{trialAt,grantAt,trialName}=forgePlan(r,h);let trial=null;if(q.stage===trialAt){if(!root.JXSystems?.forgeTrial)return fail('神兵试炼暂未就绪。');trial=root.JXSystems.forgeTrial(state,{...r,trialName},uid);if(!trial.won)return success('试炼尚未通过，材料和任务进度保留，可养成后再战。',{...trial});}
    if(q.stage===grantAt){if(e.bag.length>=300)return fail('装备行囊已满，请先分解或装备。');const item=createItem(state,{slot:'weapon',level:r.level,rarity:'legendary',sect:meta(h).sect,role:q.role,recipeId:r.id,name:weaponName(h,r),source:r.name,expansionId:recipeExpansion(r)});q.itemUid=item.uid;}
    if(r.mode==='growth'&&q.stage>grantAt){const item=e.bag.find(x=>x.uid===q.itemUid)||Object.values(h.equipment).find(x=>x.uid===q.itemUid);if(!item)return fail('请先把此神兵交回原锻造侠客，才能继续升品。');item.stage++;}
    for(const need of info.requirements)e.materials[need.name]-=need.amount;q.stage++;e.quests[key]=q;return success(`${info.nextLabel}已完成。${q.stage===grantAt+1?'神兵已收入装备行囊。':''}`,trial?{log:trial.log,won:true}:{});
  }
  function recipes(state){init(state);return clone(RECIPES);}
  function inventory(state){return init(state).bag.map(item=>{const v=(4+item.level*.75)*({rare:1,epic:1.5,legendary:2.2}[item.rarity])*(1+item.stage*.12),weapon=item.slot==='weapon';return {...clone(item),quality:item.rarity,setName:item.set,stats:{hp:Math.floor(v*(weapon?1.5:4)),atk:Math.floor(v*(weapon?1.8:.28)),def:Math.floor(v*(weapon?.12:.3))}};});}
  function materials(state){const e=init(state);return Object.values(MATERIALS).flat().map(name=>({id:name,name,count:e.materials[name]||0,source:(D.DUNGEONS||[]).filter(d=>d.materialDrop!==false&&(d.bigIron===name||d.smallIron===name)).map(d=>d.name).join('、')}));}
  function stones(state){const e=init(state);return Array.from({length:8},(_,i)=>({level:i+1,count:e.stones[i+1]||0}));}
  function giveMaterial(state,name,amount){if(!Object.values(MATERIALS).flat().includes(name))return;const e=init(state);e.materials[name]=Math.min(1e9,(e.materials[name]||0)+amount);}
  function exchangeOffers(state){
    const current=currentExpansion(state),currentIndex=D.EXPANSIONS.findIndex(x=>x.id===current?.id),offers=[],bagLength=state.equipment?.bag?.length||0;
    for(const [index,expansion]of D.EXPANSIONS.entries()){
      const unlocked=root.JXProgression?root.JXProgression.isExpansionUnlocked(state,expansion.id):index<=currentIndex;if(!unlocked)continue;
      const base={expansionId:expansion.id,expansionName:expansion.name,chapter:index+1},level=10+index*5,stoneLevel=Math.min(7,2+Math.floor(index/3)),grade=Math.min(5,1+Math.floor(index/4));
      offers.push({...base,id:`set:${expansion.id}`,kind:'set',level,set:expansion.setName,name:`${expansion.setName}·六件套`,description:'帽子、上衣、腰带、护腕、下装、鞋子各一件；兑换后可换穿本章。',cost:180,quantity:6});
      for(const sd of SLOTS)offers.push({...base,id:`gear:${expansion.id}:${sd.id}`,kind:'gear',slot:sd.id,level,name:`${expansion.setName}·${sd.name}`,description:sd.id==='weapon'?'按所选侠客门派兑换本章紫色武器。':`定向兑换${sd.name}${['head','chest','waist','wrist','legs','feet'].includes(sd.id)?'，计入本章六件套。':'，补齐镶嵌部位。'}`,cost:sd.id==='weapon'?45:['head','chest','waist','wrist','legs','feet'].includes(sd.id)?30:20,quantity:1,set:['head','chest','waist','wrist','legs','feet'].includes(sd.id)?expansion.setName:null});
      const dungeon=D.DUNGEONS.find(d=>d.expansionId===expansion.id&&d.materialDrop!==false);
      if(dungeon?.smallIron)offers.push({...base,id:`iron:${expansion.id}`,kind:'iron',material:dungeon.smallIron,name:`${dungeon.smallIron} ×10`,description:'补足本年代神兵锻造所需小铁。',cost:50,quantity:10});
      offers.push({...base,id:`stones:${expansion.id}`,kind:'stones',level:stoneLevel,name:`${stoneLevel}级五行石 ×6`,description:'可直接镶嵌，降低合成与掉落的等待。',cost:20,quantity:6});
      for(const color of COLORS)offers.push({...base,id:`color:${expansion.id}:${color.id}`,kind:'color',colorId:color.id,level:grade,name:`${grade}级${color.name}`,description:'装在武器，满足全身五行石条件后生效。',cost:40,quantity:1});
      offers.push({...base,id:`silver:${expansion.id}`,kind:'silver',name:'精炼资粮 · 5000银两',description:'用于精炼、合成与日常整备。',cost:20,quantity:5000});
    }
    return offers.map(o=>{const reason=state.battle?'战斗结束后兑换':['gear','set'].includes(o.kind)&&bagLength+o.quantity>300?'装备行囊空间不足':state.renown<o.cost?'侠名不足':'';return {...o,available:!reason,reason};});
  }
  function exchange(state,offerId,qty=1,heroUid=state.team?.[0]){
    if(!integer(qty,1,999))return fail('兑换数量必须是1至999的整数。');
    if(state.battle)return fail('请等待当前战斗结束后兑换。');
    const offer=exchangeOffers(state).find(x=>x.id===offerId);if(!offer)return fail('兑换项不存在或所属资料片尚未开放。');
    const cost=offer.cost*qty,e=state.equipment,h=owned(state,heroUid),amount=offer.quantity*qty,isGear=['gear','set'].includes(offer.kind);
    if(!Number.isFinite(state.renown)||state.renown<cost)return fail(`侠名不足，需要 ${cost} 点。`);
    if(isGear&&(!h||(e?.bag?.length||0)+amount>300))return fail(!h?'请选择已结交的侠客。':'装备行囊空间不足，请先装备或分解。');
    const old=offer.kind==='iron'?(e?.materials?.[offer.material]||0):offer.kind==='stones'?(e?.stones?.[offer.level]||0):offer.kind==='color'?(e?.colors?.[colorKey(offer.colorId,offer.level)]||0):offer.kind==='silver'?state.silver:0;
    if(!isGear&&(!Number.isFinite(old)||old+amount>(offer.kind==='silver'?1e12:1e9)))return fail('持有数量达到上限，请先使用。');
    if(isGear&&(e?.nextId||1)+amount>1e9)return fail('装备编号达到上限。');
    const inventory=init(state),items=[];state.renown-=cost;
    if(offer.kind==='gear')for(let i=0;i<qty;i++)items.push(createItem(state,{slot:offer.slot,level:offer.level,rarity:'epic',set:offer.set,sect:offer.slot==='weapon'?meta(h).sect:null,expansionId:offer.expansionId,source:`${offer.expansionName}·侠名兑换`,name:offer.name}));
    else if(offer.kind==='set')for(let i=0;i<qty;i++)for(const slot of ['head','chest','waist','wrist','legs','feet'])items.push(createItem(state,{slot,level:offer.level,rarity:'epic',set:offer.set,expansionId:offer.expansionId,source:`${offer.expansionName}·侠名兑换`}));
    else if(offer.kind==='iron')inventory.materials[offer.material]=old+amount;
    else if(offer.kind==='stones')inventory.stones[offer.level]=old+amount;
    else if(offer.kind==='color')inventory.colors[colorKey(offer.colorId,offer.level)]=old+amount;
    else state.silver=old+amount;
    return success(`消耗 ${cost} 侠名，兑换${offer.name}${qty>1?' ×'+qty:''}。`,{offerId,quantity:qty,spent:{renown:cost},items});
  }
  function onVictory(state,{route,boss=false,rng=Math.random,dungeon=null}={}){dungeon=dungeon||(boss?(D.DUNGEONS||[]).find(d=>d.id===route?.dungeonId):null);const e=init(state),messages=[],level=Math.max(1,Math.min(100,route?.level||5)),expansionId=dungeon?.expansionId||route?.expansionId||currentExpansion(state)?.id;e.lootCount++;e.stones[1]=(e.stones[1]||0)+(boss?3:1);if(boss||e.lootCount===1||roll(rng)<.22){const index=Math.floor(roll(rng)*SLOTS.length),h=owned(state,state.team[Math.floor(roll(rng)*state.team.length)]),set=dungeon?.setName||route?.setName||null,rare=boss?'epic':'rare';let slot=SLOTS[index].id;
      if(root.JXProgression&&boss&&set&&e.lootCount%4!==0){const armor=['head','chest','waist','wrist','legs','feet'],pieces=[...e.bag,...state.heroes.flatMap(a=>Object.values(a.equipment||{}))].filter(x=>x.expansionId===expansionId&&x.set===set);slot=armor.sort((a,b)=>pieces.filter(x=>x.slot===a).length-pieces.filter(x=>x.slot===b).length)[0];}
      const item=createItem(state,{slot,level,rarity:rare,sect:slot==='weapon'?meta(h)?.sect:null,set:slot==='weapon'||['necklace','pendant','ring1','ring2','ranged'].includes(slot)?null:set,effect:slot==='weapon'&&boss?(role(h)==='healer'?'heal':'water'):null,source:dungeon?.name||route?.name||'野外历练',expansionId});messages.push(item?`获得装备「${item.name}」。`:'装备行囊已满，本次普通战利品转为4颗一级五行石。');}
    if(dungeon&&dungeon.materialDrop!==false){if(dungeon.smallIron){giveMaterial(state,dungeon.smallIron,8);messages.push(`${dungeon.smallIron} +8`);}if(dungeon.bigIron&&roll(rng)<.06){giveMaterial(state,dungeon.bigIron,1);messages.push(`稀世掉落：${dungeon.bigIron}！`);}if(roll(rng)<.25){const id=COLORS[Math.floor(roll(rng)*COLORS.length)].id,index=D.EXPANSIONS.findIndex(x=>x.id===expansionId),grade=root.JXProgression?Math.min(5,1+Math.floor(Math.max(0,index)/4)):1,key=colorKey(id,grade);e.colors[key]=(e.colors[key]||0)+1;messages.push(`获得${grade}级五彩石。`);}}
    return messages;
  }
  function validateSave(state){if(state.equipment===undefined){if((state.heroes||[]).some(h=>h.equipment||h.enhancements||h.colorStone||h.colorStoneLevel))throw new Error('存档缺少装备库存。');return true;}const e=state.equipment,reject=x=>{throw new Error(`存档装备数据无效：${x}。`);};if(!obj(e)||e.version!==1||!Array.isArray(e.bag)||e.bag.length>300||!integer(e.nextId,1)||!integer(e.lootCount)||!obj(e.materials)||!obj(e.stones)||!obj(e.colors)||!obj(e.quests)||!obj(e.dungeons))reject('结构');const allM=Object.values(MATERIALS).flat();for(const[k,n]of Object.entries(e.materials))if(!allM.includes(k)||!integer(n))reject('神兵材料');for(const[k,n]of Object.entries(e.stones))if(!/^[1-8]$/.test(k)||!integer(n))reject('五行石');for(const[k,n]of Object.entries(e.colors))if(!parseColor(k)||!integer(n))reject('五彩石');
    const seen=new Set(),validateItem=(x,owner,slot)=>{if(!obj(x)||typeof x.uid!=='string'||!/^gear_\d+$/.test(x.uid)||seen.has(x.uid)||!slotDef(x.slot)||slot&&slot!==x.slot||!integer(x.level,1,100)||!['rare','epic','legendary'].includes(x.rarity)||!integer(x.stage,0,4)||typeof x.name!=='string'||x.name.length>100||typeof x.source!=='string'||x.source.length>100)reject('装备条目');seen.add(x.uid);if(+x.uid.slice(5)>=e.nextId)reject('装备序号');if(Object.keys(x).some(k=>!['uid','slot','level','rarity','sect','set','effect','recipeId','role','stage','name','source','expansionId'].includes(k)))reject('伪造装备属性');if(x.expansionId!==undefined&&!expansionKnown(x.expansionId))reject('装备资料片');if(x.sect!==null&&!D.SECTS.some(s=>s.id===x.sect)||owner&&x.sect&&x.sect!==meta(owner)?.sect)reject('兵器门派');if(x.slot!=='weapon'&&(x.sect||x.role||x.recipeId||x.effect))reject('兵器部位');if(x.set!==null&&(typeof x.set!=='string'||x.set.length>60)||![null,'water','heal'].includes(x.effect)||![null,'tank','healer','dps','ranged','melee','support'].includes(x.role))reject('装备特效');if(x.rarity==='legendary'){const r=getRecipe(x.recipeId);if(!r||x.slot!=='weapon'||x.level!==r.level||!x.sect||!x.role||r.mode!=='growth'&&x.stage!==0)reject('稀世神兵');}else if(x.recipeId||x.stage||x.role)reject('非神兵附加数据');};
    for(const x of e.bag)validateItem(x);for(const h of state.heroes){if(h.equipment!==undefined){if(!obj(h.equipment))reject('穿戴栏');for(const[slot,x]of Object.entries(h.equipment)){if(!slotDef(slot))reject('装备部位');validateItem(x,h,slot);}}if(h.enhancements!==undefined){if(!obj(h.enhancements))reject('强化栏');for(const[slot,en]of Object.entries(h.enhancements)){if(!slotDef(slot)||!obj(en)||!integer(en.refine,0,8)||!Array.isArray(en.sockets)||en.sockets.length>slotDef(slot).sockets||en.sockets.some(n=>!integer(n,1,8)))reject('精炼熔嵌');if(en.expansionId!==undefined&&(!expansionKnown(en.expansionId)||h.equipment?.[slot]&&en.expansionId!==expansionForItem(h.equipment[slot])))reject('强化资料片');}}if(h.colorStone!==undefined&&!COLORS.some(c=>c.id===h.colorStone))reject('武器五彩石');if(h.colorStoneLevel!==undefined&&(!h.colorStone||!integer(h.colorStoneLevel,1,6)))reject('五彩石等级');}
    if(root.JXProgression&&state.progression)for(const item of [...e.bag,...state.heroes.flatMap(h=>Object.values(h.equipment||{}))])if(!root.JXProgression.isExpansionUnlocked(state,expansionForItem(item)))reject('装备所属资料片尚未开放');
    const legendary=[...e.bag,...state.heroes.flatMap(h=>Object.values(h.equipment||{}))].filter(x=>x.rarity==='legendary'),linked=new Set();
    for(const[key,q]of Object.entries(e.quests)){const parts=key.split(':'),h=owned(state,parts[0]),r=getRecipe(parts[1]);if(parts.length!==2||!h||!r||!obj(q)||!integer(q.stage,0,forgePlan(r,h).steps.length)||!['tank','healer','dps'].includes(q.role)||(meta(h)?.roles||[meta(h)?.role]).indexOf(q.role)<0)reject('锻造任务');const {grantAt}=forgePlan(r,h);if(q.stage>grantAt){const item=legendary.find(x=>x.uid===q.itemUid);if(!item||linked.has(item.uid)||item.recipeId!==r.id||item.sect!==meta(h).sect||item.role!==q.role||item.stage!==(r.mode!=='growth'?0:q.stage-grantAt-1))reject('神兵领奖与升品记录');linked.add(item.uid);}else if(q.itemUid!==undefined)reject('提前领取神兵');}
    if(legendary.some(x=>!linked.has(x.uid)))reject('无制作记录的神兵');
    for(const[id,record]of Object.entries(e.dungeons))if(!(D.DUNGEONS||[]).some(d=>d.id===id)||!obj(record)||!integer(record.runs)||!integer(record.wins)||!integer(record.best,0,100))reject('资料片秘境记录');return true;
  }
  root.JXEquipment={SLOTS,COLORS,MATERIALS,init,bonuses,combatProfile,onVictory,validateSave,equip,unequip,refine,socket,inlayColor,fuseStone,forgeInfo,forgeStep,inventory,recipes,heroInfo,materials,stones,salvage,createItem,giveMaterial,autoEquip,autoRefine,autoSocket,autoEnhance,quickPreview,exchangeOffers,exchange,equipChapter,colorStatus,setCounts};
})(globalThis);
