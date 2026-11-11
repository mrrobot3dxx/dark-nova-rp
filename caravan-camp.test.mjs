import {test} from 'node:test';import assert from 'node:assert/strict';
for(const folder of ['.','../nova-rp'])test('Camp : caravanes solides, routes et accès GPS dégagés '+folder,async()=>{
 const {caravanCamp,caravans,caravanObstacles}=await import(folder+'/public/caravan-camp-world.js');const {buildings,world,blocked,createGameServer}=await import(folder+'/server.mjs');const {createRouter}=await import(folder+'/public/gps-route.js');
 assert.equal(caravans.length,6);assert.equal(caravanObstacles.length,6);
 for(const v of caravans){assert.ok(blocked(v.x+v.w/2,v.y+v.h/2));assert.ok(buildings.every(b=>v.x+v.w<b.x||v.x>b.x+b.w||v.y+v.h<b.y||v.y>b.y+b.h));for(let x=455;x<world.width;x+=920)assert.ok(v.x+v.w<x-80||v.x>x+80);for(let y=710;y<world.height;y+=360)assert.ok(v.y+v.h<y-62||v.y>y+62);}
 const router=createRouter({...world,buildings,obstacles:caravanObstacles},29);assert.equal(router.blocked(2780,2330),false);assert.ok(router.route({x:2295,y:2330},caravanCamp.entrance));assert.ok(router.route(caravanCamp.entrance,{x:3060,y:2330}));for(const v of caravans)assert.equal(router.blocked(v.x+40,v.y+20),true);
 const server=createGameServer({dataFile:null,moderatorIds:[]});await new Promise(r=>server.listen(0,'127.0.0.1',r));try{const data=await(await fetch('http://127.0.0.1:'+server.address().port+'/api/world')).json();assert.equal(data.caravanCamp.id,caravanCamp.id);assert.equal(data.obstacles.filter(o=>o.id.startsWith('caravan-')).length,6);}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
