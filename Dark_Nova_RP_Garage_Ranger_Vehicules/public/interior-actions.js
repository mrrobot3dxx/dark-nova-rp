import {interiorPlan,printerPosition,plantPosition} from './interiors.js';
export function interiorAction(me){
 if(!me?.interior)return null;
 const distance=(x,y)=>Math.hypot(me.ix-x,me.iy-y),candidates=[];
 if(me.interiorEquipment?.some(e=>e.type==='printer'&&e.canManage)){const q=printerPosition(me.interior.kind);candidates.push({type:'printer',label:'Imprimante · E',distance:distance(q.x+50,q.y+35)});}
 (me.interiorEquipment||[]).filter(e=>e.type==='plant').forEach((plant,index)=>{if(plant.canManage){const q=plantPosition(me.interior.kind,index);candidates.push({type:'culture',label:'Mes plantes · E',distance:distance(q.x,q.y)});}});
 const nearest=candidates.filter(c=>c.distance<=(c.type==='culture'?160:120)).sort((a,b)=>a.distance-b.distance)[0];if(nearest)return nearest;
 const plan=interiorPlan(me.interior.kind);if(distance(plan.width/2,plan.height-35)<=90)return {type:'exit',label:'Sortir · E'};
 return {type:'none',label:'Interagir · E'};
}
