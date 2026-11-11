import {test} from 'node:test';
import assert from 'node:assert/strict';
for(const folder of ['.','../nova-rp'])test('Graphismes : bâtiments distincts, sprites réutilisés et géométrie conservée '+folder,async()=>{
 const {drawBuilding,buildingStyle,drawGround}=await import(folder+'/public/visuals.js');let canvases=0,images=0;const context=()=>new Proxy({createLinearGradient:()=>({addColorStop(){}}),createPattern:()=> '#pattern',drawImage(){images++;}},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>{o[k]=v;return true;}}),ctx=context(),previous=globalThis.document;
 globalThis.document={createElement(){canvases++;return {getContext:context};}};
 try{const b=Object.freeze({name:'GARAGE NOVA',x:550,y:430,w:270,h:200,color:'#609c8b'});drawBuilding(ctx,b);const created=canvases;for(let frame=0;frame<20;frame++)drawBuilding(ctx,b);assert.equal(canvases,created,'Le décor ne doit pas être recalculé à chaque image');assert.equal(images,21);assert.equal(b.x,550);assert.equal(b.w,270);drawGround(ctx,{width:5520,height:4320});const tiles=canvases;drawGround(ctx,{width:5520,height:4320});assert.equal(canvases,tiles);assert.equal(new Set(['GARAGE NOVA','CAFÉ NOVA','HÔPITAL NOVA','COMMISSARIAT','VILLA DES PINS'].map(buildingStyle)).size,5);}finally{globalThis.document=previous;}
});
for(const folder of ['.','../nova-rp'])test('Personnage : animation en mouvement puis arrêt à pied '+folder,async()=>{
 const {characterMotion}=await import(folder+'/public/characters.js'),player={id:'animation-test'};assert.equal(characterMotion(player,100,100,1000).step,0);const moving=characterMotion(player,110,100,1100);assert.notEqual(moving.step,0);assert.equal(moving.look,1);assert.equal(characterMotion(player,110,100,1400).step,0);
});

for(const folder of ['.','../nova-rp'])test('Ville détaillée : décor stable, chaussées et entrées dégagées '+folder,async()=>{
 const {cityDetails}=await import(folder+'/public/visuals.js');const {world,buildings}=await import(folder+'/server.mjs');const snapshot=JSON.stringify(buildings),items=cityDetails(world,buildings);
 assert.ok(items.length>150);assert.deepEqual(items,cityDetails(world,buildings));assert.equal(JSON.stringify(buildings),snapshot);
 const extent={parking:[107,30],terrace:[35,48],garden:[112,48],park:[130,100],square:[130,100],bench:[26,20],bin:[10,14],planter:[20,17],entry:[35,35],flag:[25,48],tyres:[25,16]};
 for(const o of items){const [rx,ry]=extent[o.kind];for(let r=455;r<world.width;r+=920)assert.ok(Math.abs(o.x-r)>=57+rx,'Chaussée verticale dégagée');for(const r of [354,...Array.from({length:Math.ceil(world.height/360)-1},(_,i)=>710+i*360)])assert.ok(Math.abs(o.y-r)>=41+ry,'Chaussée horizontale dégagée');}
 for(const b of buildings)for(const o of items.filter(i=>['terrace','planter','bench','bin','tyres'].includes(i.kind)))assert.ok(Math.abs(o.x-(b.x+b.w/2))>45||Math.abs(o.y-(b.y+b.h+20))>35,'Accès central dégagé');
});
