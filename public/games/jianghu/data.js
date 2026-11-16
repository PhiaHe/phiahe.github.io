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
    ['badao','霸刀','#b498bd','dps','三体刀','长兵','外功','北傲诀','河朔柳家，秀明尘身、松烟竹雾、雪絮金屏三势御刀。',['dps']],
    ['penglai','蓬莱','#7dc8cc','dps','伞','奇兵','外功','凌海诀','东海仙岛，以伞御风，乘雕凌空。',['dps']],
    ['lingxue','凌雪阁','#c57880','dps','链刃','长兵','外功','隐龙诀','太白山中潜锋藏锐，以链刃与隐秘行动守护李唐。',['dps']],
    ['yantian','衍天宗','#a995d4','dps','灯魂','奇兵','混元','太玄经','昆仑方士观星卜算，以灯魂、符咒和卦象演化天机。',['dps']],
    ['yaozong','北天药宗','#8cbf99','healer','药囊与柳叶刀','奇兵','毒性','灵素','以本草医理济世，无方制物，灵素疗伤。',['healer','dps']],
    ['daozong','刀宗','#6fb4c3','dps','长刀','短兵','外功','孤锋诀','东海翁洲，谢云流所创，以孤锋破浪、决意出刀。',['dps']],
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
    ['fengqi','风起稻香',2009,70,['稻香村','洛阳','长安','扬州'],'三才阵',['人熊','邓文峰','商仲永'],'初入江湖','village','https://jx3.xoyo.com/zt/2010/05/25/mjcfrw.shtml'],
    ['cangjian2010','藏剑山庄',2010,70,['藏剑山庄'],'战宝迦兰',['王海银','朱癸','平等','掌火','智慧与镇恶','风火云三使'],'剑茗','valley','https://jx3.xoyo.com/zt/2010/02/26/zbao-2.shtml'],
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
  const EXPANSIONS = expansionRows.map(row => ({
    id:row[0],name:row[1],year:row[2],era:row[3],levelCap:row[3],fields:row[4],setName:row[7],
    sourceUrls:[row[9],mapHistory,...(row[2]<=2015?[officialHistory]:[])],
    desc:row[2]+' 年代表章节；野外与秘境为历年内容选编，战斗规模和成长数值按本作五人队伍重设。'
  }));
  const DUNGEONS = expansionRows.map((row,index) => ({
    id:row[0]+'_dungeon',expansionId:row[0],name:row[5],bosses:row[6],level:Math.min(100,6+index*5),
    needBadges:index*2+1,setName:row[7],bigIron:eraMaterials[row[3]][0],smallIron:eraMaterials[row[3]][1],
    era:row[3],materialDrop:index>0,setIsAdapted:index===0,
    sourceUrls:[row[9]],bossListScope:'按资料核对首领顺序；同场双首领、群体与事件合为一关，机制适配五人战斗',setScope:'年度赛季代表套装；掉落在本作中合并',
    desc:index===0?'入门五人秘境，初入江湖套为本作教学套装；不掉落玄晶和陨铁。':'历史团队秘境改编为五人挑战；掉落与套装加成为本作平衡数值。'
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
  const dungeonScenes=['military_fort','temple_hall','flower_sanctum','nanzhao_palace','imperial_palace','military_fort','palace_garden','palace_garden','thunder_forge','ice_fire','east_sea','dharma_cave','thunder_swamp','river_dock','ancient_cave','ancient_cave','steppe_siege','military_fort'];
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
      bigIron:eraMaterials[expansion.era][0],smallIron:eraMaterials[expansion.era][1],sourceUrls:[source,...(!materialDrop?[classicDungeonSource]:[]),...(id==='qinhuang'?['https://wiki.biligame.com/jx3/秦皇陵']:[]),officialHistory],
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
    '洛阳之战':{heroes:['tiance_5','wanhua_5','cangyun_yan_yimei','tangmen_tang_maoer','lingxue_1','cangjian_5','cangyun_zhangsun_wangqing','tangmen_tang_wuying'],subtitle:'2026 · 同袍破阵',desc:'陕州战局之后，联军进击洛阳。与苍云、唐门、天策及各路同道合力破阵，依次击败秘境首领；普通与挑战难度均沿用本章数值要求。'}
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
  const ITEMS = [
    {id:'invite',name:'结交帖',desc:'自动结交与茶馆邀约时使用，重复结交可获得同门心得。',price:120,icon:'帖'},
    {id:'medicine',name:'止血散',desc:'恢复一位侠客 60% 的最大气血，倒下的侠客也可使用。',price:85,icon:'药'},
    {id:'exp',name:'修为丹',desc:'为一位侠客增加 250 点修为，修为足够时自动升级。',price:180,icon:'丹'},
    {id:'tea',name:'清心茶',desc:'立即为全队恢复所有气血。',price:220,icon:'茶'},
    {id:'ore',name:'精铁',desc:'侠客突破与百工制作所需的精铁。',price:150,icon:'铁'},
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
  root.JXData = Object.freeze({SECTS,HEROES,ROUTES,EXPANSIONS,DUNGEONS,ITEMS,PETS,RARITIES:['','寻常','优秀','名侠','宗师']});
})(globalThis);
