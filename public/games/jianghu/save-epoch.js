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
