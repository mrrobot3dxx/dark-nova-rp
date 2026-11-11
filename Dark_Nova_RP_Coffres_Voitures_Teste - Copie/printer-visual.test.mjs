import {test} from 'node:test';
import assert from 'node:assert/strict';
import {drawInterior,printerPosition} from './public/interiors.js';
test('L’imprimante installée est dessinée dans la pièce, sans apparition fictive',()=>{
 const labels=[],ctx=new Proxy({fillText:text=>labels.push(text)},{get:(target,key)=>key in target?target[key]:()=>{},set:(target,key,value)=>{target[key]=value;return true;}}),me={id:'owner',name:'Owner',color:'#abc',ix:550,iy:695,interior:{id:'azur',kind:'villa',name:'Chez moi'},interiorEquipment:[]};
 drawInterior(ctx,800,600,me,[]);assert.equal(labels.includes('IMPRIMANTE'),false);
 me.interiorEquipment=[{type:'printer',canManage:true}];drawInterior(ctx,800,600,me,[]);assert.ok(labels.includes('IMPRIMANTE'));assert.ok(labels.includes('Gérer · E'));assert.ok(printerPosition('home').y>0);
});
test('La culture proche affiche un repère E visible',async()=>{
 const {plantPosition}=await import('./public/interiors.js'),labels=[],ctx=new Proxy({fillText:text=>labels.push(text)},{get:(target,key)=>key in target?target[key]:()=>{},set:(target,key,value)=>{target[key]=value;return true;}}),q=plantPosition('villa',0);
 drawInterior(ctx,800,600,{id:'owner',name:'Owner',ix:q.x,iy:q.y+80,interior:{id:'home',kind:'villa',name:'Chez moi'},interiorEquipment:[{type:'plant',canManage:true,readyAt:Date.now()-1}]},[]);
 assert.ok(labels.includes('E · GÉRER LA PLANTE'));assert.ok(labels.includes('RÉCOLTE PRÊTE'));assert.ok(labels.includes('DÉCOR'));
});
