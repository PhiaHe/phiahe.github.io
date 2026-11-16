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
