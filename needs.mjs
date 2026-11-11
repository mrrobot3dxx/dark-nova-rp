const clamp=value=>Math.max(0,Math.min(100,value));
export const foodEffects={bread:{hunger:25},croissant:{hunger:30},sandwich:{hunger:60,health:5},juice:{thirst:35,hunger:10},water:{thirst:40},snack:{hunger:35,health:5},apple:{hunger:20,thirst:5,health:2}};
export function createNeeds({now=Date.now,onCollapse=()=>{},isInvincible=()=>false}={}){
 const initial=stored=>Object.fromEntries(['health','hunger','thirst'].map(key=>[key,Number.isFinite(stored?.[key])?clamp(stored[key]):100]));
 function collapse(p,deadline){p.needs.health=0;p.respawnAt=Number.isFinite(deadline)&&deadline>0?deadline:now()+300000;onCollapse(p);}
 function start(p,stored,respawnAt){p.needs=initial(stored);p.needsAt=now();p.respawnAt=null;if(isInvincible(p))p.needs.health=100;else if(p.needs.health<=0)collapse(p,respawnAt);}
 const remaining=p=>p.respawnAt?Math.max(0,p.respawnAt-now()):0;
 function respawn(p,{immediate=false}={}){if(!p.respawnAt||(!immediate&&remaining(p)>0))return false;p.respawnAt=null;Object.assign(p.needs,{health:100,hunger:75,thirst:75});p.needsAt=now();return true;}
 function tick(p){const immune=isInvincible(p),restored=immune&&(p.needs.health!==100||!!p.respawnAt);if(immune){p.needs.health=100;p.respawnAt=null;}if(p.respawnAt){p.needsAt=now();return false;}if(p.needs.health<=0){collapse(p);return true;}const elapsed=Math.max(0,now()-p.needsAt)/1000;if(!elapsed)return !!restored;p.needsAt=now();const n=p.needs;
  const emptyAfter=Math.min(n.hunger*36,n.thirst*27);const deprived=Math.max(0,elapsed-emptyAfter);
  const healthyFor=Math.max(0,Math.min(elapsed,(n.hunger-50)*36,(n.thirst-50)*27));
  n.hunger=clamp(n.hunger-elapsed/36);n.thirst=clamp(n.thirst-elapsed/27);n.health=immune?100:clamp(n.health+healthyFor/30-deprived/6);
  if(n.health<=0)collapse(p);
  return true;
 }
 function consume(p,id){if(p.respawnAt)return false;const effects=foodEffects[id];if(!effects)return false;for(const [key,value]of Object.entries(effects))p.needs[key]=clamp(p.needs[key]+value);return true;}
 return {start,tick,consume,remaining,respawn};
}
