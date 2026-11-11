import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGameServer,blocked} from './server.mjs';
test('Nouveaux véhicules : location, couleurs et parking accessible',async()=>{
 const server=createGameServer({dataFile:null,moderatorIds:[]});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const post=async(path,body={},token='')=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Cookie:'nova_session='+token},body:JSON.stringify(body)});return {status:r.status,data:await r.json(),token:r.headers.get('set-cookie')?.match(/nova_session=([^;]+)/)?.[1]};};
 try{for(const [type,color,radius] of [['firetruck','#dc3038',36],['policecar','#ffffff',27],['quad','#e8a741',23]]){
 const registered=await post('register',{name:type,email:type+'@example.test',password:'Vehicles-test-42'});const token=registered.token;
 // Advance along the clear central avenue using the same movement endpoint as the game.
 for(let i=0;i<6;i++){await new Promise(r=>setTimeout(r,180));await post('move',{dx:0,dy:1},token);}
 const rent=await post('garage',{action:'rent',type,price:0,color:'fake'},token);assert.equal(rent.status,200);const v=rent.data.garage.vehicles[0];assert.equal(v.type,type);assert.equal(v.color,color);assert.equal(blocked(v.x,v.y,radius),false);assert.ok(rent.data.player.money<250);
 }}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
