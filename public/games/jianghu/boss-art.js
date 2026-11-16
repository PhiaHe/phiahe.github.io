(function(root){
'use strict';
const names=["人熊","邓文峰","商仲永","王海银","朱癸","平等","掌火","智慧与镇恶","风火云三使","牡丹","塔洛马蒂与姬无双","慕容追风","乌蒙贵的杰作","卫栖梧","阿萨辛","卓婉清","沙利亚","枯荣大师","段宗公、泰崇傣与阁罗鸿","萧沙","摩提耶罗","陈和尚、康雪烛、柳公子与阁罗凤","李倓","何莘涯","耶律燕与独孤问俗","六道傀儡","剑圣","无名","伊玛目","安禄山","靺鞨三骑将","安雨","白陶","史思明","韩非池","莫雨","李白","黑齿元佑","哥舒翰","安庆绪","史朝英","柳愚","柳哲","柳时清","解语","柳秀岳","柳鸾旗","康疑","铂尔","罗纳真","没藏呼月与拓跋思羽","拿云","铁黎","陈徽","藤原武裔","源思弦","驺吾","方有崖","余晖","宓桃","武雪散","猿飞","哑头陀","岳琳与岳琅","巨型尖吻凤","桑乔","悉达罗摩","尤珈罗摩","月泉淮","乌蒙贵","张景超与张法雷","刘展","苏凤楼","韩敬青","藤原佑野","李重茂","魏华","钟不归","岑伤","鬼筹","麒麟","骆耀阳","韦柔丝","宋泉","伍靖远","苏什","芭德","巴图仁钦","竭勒","图南子","叶葵","尹雪尘","突利和顺","田承嗣","伊曼·寂夜与伊曼·逐焰","阿史那承庆","史朝义","方季常","平三指","震天甲士","冯度","王彦直","鬼影小次郎","虎啸","射云","华鹤炎","罗翼","常万山","杜姬欣","阿里曼监察使","阿里曼入教主祭司","柳随风","孙敬萧","李尧","玄悲","陌香","方宇谦","席庶云","曹炎烈","沙叱博","阿史那从礼","苏曼莎","令狐伤","王翦","石麒麟","探雪"];
const entries=names.map((name,index)=>Object.freeze({name,index,className:'boss-art-'+String(index).padStart(3,'0'),sheet:'bosses-'+String(Math.floor(index/12)+1).padStart(2,'0')+'.png',cell:index%12}));
const byName=new Map(entries.map(e=>[e.name,e]));
const escape=s=>String(s).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
function get(name){return byName.get(name)||null;}
function sprite(name,extraClass=''){const e=get(name);return e?'<span class="boss-portrait '+e.className+' '+escape(extraClass)+'" role="img" aria-label="'+escape(name)+'立绘"></span>':'';}
root.JXBossArt=Object.freeze({get,sprite,entries:Object.freeze(entries)});
})(typeof globalThis!=='undefined'?globalThis:window);

