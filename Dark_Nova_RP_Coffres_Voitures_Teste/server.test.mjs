import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGameServer,blocked,world,buildings} from './server.mjs';
test('La ville agrandie garde ses limites et ses quartiers accessibles',()=>{
 assert.equal(world.width*world.height,2760*2160*4);
 assert.ok(buildings.length>=25);assert.equal(new Set(buildings.map(b=>b.name)).size,buildings.length);for(const b of buildings){assert.ok(b.x>=0&&b.y>=0&&b.x+b.w<=world.width&&b.y+b.h<=world.height);assert.equal(blocked(b.x+b.w/2,b.y+b.h/2),true);}
 assert.equal(blocked(1375,1600),false);
 assert.equal(blocked(2295,2000),false);
 assert.equal(blocked(5521,1200),true);
 assert.equal(blocked(1100,1200),false);
});
test('Véhicules du garage : réservation, vitesse, collision et descente',async()=>{
 const server=createGameServer({dataFile:null});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const post=async(path,data)=>{const r=await fetch(base+'/api/'+(path==='join'?'register':path),{method:'POST',headers:{Cookie:'nova_session='+(data.token||'')},body:JSON.stringify({password:'Test-only-password-42',email:(data.name||'test').toLowerCase()+'@example.test',...data})});const result=await r.json();if(r.headers.get('set-cookie'))result.token=r.headers.get('set-cookie').match(/nova_session=([^;]*)/)[1];return {status:r.status,data:result};};
 const pause=()=>new Promise(r=>setTimeout(r,130));const abort=new AbortController();
 try{
  const a=(await post('join',{name:'Pilote'})).data,b=(await post('join',{name:'Scooteriste'})).data;
  assert.equal((await post('vehicle',{token:a.token})).status,400,'pas de téléportation vers un véhicule');
  assert.equal((await post('garage',{token:a.token})).data.garage.vehicles.length,0);
  for(let i=0;i<7;i++){await pause();await post('move',{token:a.token,dx:0,dy:1});await post('move',{token:b.token,dx:0,dy:1});}
  const rentalCar=(await post('garage',{token:a.token,action:'rent',type:'car'})).data.garage.vehicles[0];
  const rentalScooter=(await post('garage',{token:b.token,action:'rent',type:'scooter'})).data.garage.vehicles[0];
  for(let i=0;i<2;i++){await pause();await post('move',{token:a.token,dx:0,dy:1});await post('move',{token:b.token,dx:0,dy:1});}
  const car=(await post('vehicle',{token:a.token})).data.player;assert.equal(car.vehicleId,rentalCar.id);
  const scooter=(await post('vehicle',{token:b.token})).data.player;assert.equal(scooter.vehicleId,rentalScooter.id);
  const events=await fetch(base+'/events',{signal:abort.signal,headers:{Cookie:'nova_session='+b.token}});const reader=events.body.getReader();const state=JSON.parse(new TextDecoder().decode((await reader.read()).value).slice(6));assert.equal(state.vehicles.find(v=>v.id===car.vehicleId).driverId,a.player.id);
  await pause();const driven=(await post('move',{token:a.token,dx:0,dy:1})).data.player;assert.ok(driven.y-car.y>45,'la voiture dépasse la vitesse de marche');assert.ok(driven.y-car.y<=84.1,'vitesse plafonnée');
  await pause();const collision=(await post('move',{token:a.token,dx:-1,dy:0})).data.player;assert.equal(blocked(collision.x,collision.y,27),false,'pas de traversée de bâtiment');
  const exit=(await post('vehicle',{token:a.token})).data.player;assert.equal(exit.vehicleId,null);assert.equal(blocked(exit.x,exit.y),false);
  const remount=(await post('vehicle',{token:a.token})).data.player;assert.equal(remount.vehicleId,car.vehicleId,'le véhicule reste là où il est garé');
  await pause();const scooted=(await post('move',{token:b.token,dx:0,dy:1})).data.player;assert.ok(scooted.y-scooter.y>30);assert.ok(scooted.y-scooter.y<=60.1);
 }finally{abort.abort();server.closeAllConnections();await new Promise(r=>server.close(r));}
});
test('Deux joueurs, flux partagé et contrôles serveur',async()=>{
 const server=createGameServer({dataFile:null});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const post=async(path,data)=>{const r=await fetch(base+'/api/'+(path==='join'?'register':path),{method:'POST',headers:{Cookie:'nova_session='+(data.token||'')},body:JSON.stringify({password:'Test-only-password-42',email:(data.name||'test').toLowerCase()+'@example.test',...data})});const result=await r.json();if(r.headers.get('set-cookie'))result.token=r.headers.get('set-cookie').match(/nova_session=([^;]*)/)[1];return {status:r.status,data:result};};
 const abort=new AbortController();try{
  const a=(await post('join',{name:'Alex',color:'#c3f36a'})).data,b=(await post('join',{name:'Sam'})).data;assert.notEqual(a.player.id,b.player.id);
  const events=await fetch(base+'/events',{signal:abort.signal,headers:{Cookie:'nova_session='+a.token}});const reader=events.body.getReader();const first=new TextDecoder().decode((await reader.read()).value);assert.match(first,/Alex/);assert.match(first,/Sam/);
  assert.equal((await post('chat',{token:b.token,text:'Bonjour Nova !'})).status,200);const next=new TextDecoder().decode((await reader.read()).value);assert.match(next,/Bonjour Nova/);
  assert.equal((await post('interact',{token:a.token})).status,400);assert.equal((await post('move',{token:a.token,dx:'oops',dy:0})).status,400);assert.equal((await post('chat',{token:'bad',text:'x'})).status,401);
  const moved=(await post('move',{token:a.token,dx:100000,dy:0})).data.player;assert.ok(moved.x-a.player.x<=34.1);assert.equal(moved.money,250);assert.ok(blocked(150,150));assert.ok(!blocked(455,355));
  assert.equal((await fetch(base+'/')).status,200);assert.equal((await fetch(base+'/api/world')).status,200);
 }finally{abort.abort();server.closeAllConnections();await new Promise(r=>server.close(r));}
});
