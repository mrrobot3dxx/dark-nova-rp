import {test} from 'node:test';
import assert from 'node:assert/strict';
import {daylightState,weatherState,setupDayNight} from './public/day-night.js';
import {createGameServer} from './server.mjs';
test('Jour/nuit : heure réelle de Paris et transitions progressives',()=>{
 const at=time=>daylightState(Date.parse('2026-11-07T'+time+'Z'));
 assert.equal(at('04:00:00').phase,'Nuit');assert.equal(at('04:00:00').time,'05:00:00');assert.equal(at('06:00:00').phase,'Aube');assert.equal(at('11:00:00').phase,'Jour');assert.equal(at('11:00:00').darkness,0);assert.equal(at('18:00:00').phase,'Crépuscule');assert.equal(at('21:00:00').phase,'Nuit');assert.ok(at('06:00:00').darkness>0&&at('06:00:00').darkness<.55);
 assert.ok(at('17:00:00').darkness<at('18:00:00').darkness);assert.ok(at('05:00:00').darkness>at('06:00:00').darkness);
 assert.equal(daylightState(Date.parse('2026-07-01T04:00:00Z')).time,'06:00:00');assert.equal(daylightState(Date.parse('2026-07-01T04:00:00Z')).phase,'Aube');
});
test('Horloge : synchronisation serveur accessible sans connexion',async()=>{
 const server=createGameServer({dataFile:null,moderatorIds:[]});await new Promise(r=>server.listen(0,'127.0.0.1',r));try{const before=Date.now(),response=await fetch('http://127.0.0.1:'+server.address().port+'/api/time'),data=await response.json();assert.equal(response.status,200);assert.equal(data.timezone,'Europe/Paris');assert.ok(data.serverTime>=before&&data.serverTime<=Date.now());assert.equal(response.headers.get('cache-control'),'no-store');assert.equal((await fetch('http://127.0.0.1:'+server.address().port+'/day-night.js')).status,200);}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});

test('Météo : alternance, pluie progressive et cycle commun de 30 minutes',()=>{
 const cycle=30*60000;
 assert.equal(weatherState(5*60000).label,'Éclaircies');assert.equal(weatherState(13*60000).label,'Ciel couvert');assert.equal(weatherState(20*60000).label,'Pluie');assert.equal(weatherState(27*60000).label,'Éclaircies');
 assert.equal(weatherState(15*60000).intensity,0);assert.ok(weatherState(15*60000+15000).intensity>0);assert.equal(weatherState(20*60000).intensity,1);assert.equal(weatherState(25*60000).intensity,0);
 for(let second=0;second<1800;second+=15){const a=weatherState(second*1000),b=weatherState(second*1000+cycle);assert.deepEqual(a,b);assert.ok(a.intensity>=0&&a.intensity<=1);assert.ok(a.remainingMs>0);}
 const daytime=Date.parse('2026-11-07T11:20:00Z'),nighttime=Date.parse('2026-11-07T00:20:00Z');assert.equal(daylightState(daytime).phase,'Jour');assert.equal(daylightState(nighttime).phase,'Nuit');assert.equal(weatherState(daytime).label,'Pluie');assert.equal(weatherState(nighttime).label,'Pluie');
});

test('Pluie : le rendu dessine des gouttes en journée et reste sec hors averse',async()=>{
 const saved={document:globalThis.document,fetch:globalThis.fetch,addEventListener:globalThis.addEventListener};let cleanup;
 globalThis.document={createElement:()=>({setAttribute(){},textContent:'',title:''}),querySelector:()=>({append(){}}),addEventListener(){},hidden:false};globalThis.fetch=async()=>({ok:false});globalThis.addEventListener=(type,fn)=>{if(type==='pagehide')cleanup=fn;};
 const ctx={save(){},restore(){},fillRect(){},beginPath(){},moveTo(){},lineTo(){this.drops++;},stroke(){},ellipse(){},arc(){},fill(){},createRadialGradient(){return {addColorStop(){}};},drops:0};
 try{const cycle=setupDayNight();cycle.setServerTime(Date.parse('2026-11-07T11:20:00Z'));cycle.draw(ctx,600,400,{cameraX:0,cameraY:0,scale:1,buildings:[],world:{width:100,height:100}});assert.ok(ctx.drops>40,'Pluie visible même en plein jour');ctx.drops=0;cycle.setServerTime(Date.parse('2026-11-07T11:05:00Z'));cycle.draw(ctx,600,400,{cameraX:0,cameraY:0,scale:1,buildings:[],world:{width:100,height:100}});assert.equal(ctx.drops,0);await Promise.resolve();}finally{cleanup?.();Object.assign(globalThis,saved);}
});
