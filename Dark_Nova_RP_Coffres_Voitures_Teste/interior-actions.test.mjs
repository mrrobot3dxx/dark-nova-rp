import {test} from 'node:test';
import assert from 'node:assert/strict';
for(const folder of ['./public','../nova-rp/public'])test('E dans le logement : plantes, imprimante et porte distinctes · '+folder,async()=>{
 const {interiorAction}=await import(folder+'/interior-actions.js'),{plantPosition,printerPosition,interiorPlan}=await import(folder+'/interiors.js');
 for(const kind of ['home','villa']){const me={interior:{id:'azur',kind},interiorEquipment:[{type:'plant',canManage:true},{type:'plant',canManage:true},{type:'printer',canManage:true}]};
  for(let index=0;index<2;index++){const q=plantPosition(kind,index);me.ix=q.x;me.iy=q.y;assert.equal(interiorAction(me).type,'culture','près du plant, E ouvre les cultures et ne quitte pas la pièce');}
  const plant=plantPosition(kind,0);me.ix=plant.x;me.iy=plant.y+150;assert.equal(interiorAction(me).type,'culture','le repère reste accessible sans viser précisément le pot');
  const printer=printerPosition(kind);me.ix=printer.x+50;me.iy=printer.y+35;assert.equal(interiorAction(me).type,'printer');
  const plan=interiorPlan(kind);me.ix=plan.width/2;me.iy=plan.height-50;assert.equal(interiorAction(me).type,'exit');
  me.ix=plan.width-80;me.iy=80;assert.equal(interiorAction(me).type,'none','E ne fait pas sortir depuis le fond de la pièce');
  const q=plantPosition(kind,0);me.ix=q.x;me.iy=q.y;me.interiorEquipment=[{type:'plant',canManage:false}];assert.equal(interiorAction(me).type,'none','les cultures d’un invité ne sont pas gérables');
 }
});
test('Le nouveau coin culture est accessible depuis la porte sans traverser de meuble',async()=>{
 const {interiorPlan,interiorBlocked,plantPosition,printerPosition}=await import('./public/interiors.js');
 for(const kind of ['home','villa']){const plan=interiorPlan(kind),printer=printerPosition(kind);for(let index=0;index<3;index++){const target=plantPosition(kind,index);for(let step=0;step<=50;step++){const x=plan.spawn.x+(target.x-plan.spawn.x)*step/50,y=plan.spawn.y+(target.y-plan.spawn.y)*step/50;assert.equal(interiorBlocked(kind,x,y),false,'chemin dégagé vers le plant '+index);}assert.ok(target.y-49>printer.y+95,'les feuilles ne sont plus cachées par la table de l’imprimante');}}
});
