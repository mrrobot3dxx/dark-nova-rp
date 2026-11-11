import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGameServer,blocked} from './server.mjs';
test('Vélo gratuit : sortie, absence de duplication, propriété et rangement',async()=>{
 const server=createGameServer({dataFile:null,moderatorIds:[]});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const post=async(path,body={},token='')=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Cookie:'nova_session='+token},body:JSON.stringify(body)});return {status:r.status,data:await r.json(),token:r.headers.get('set-cookie')?.match(/nova_session=([^;]+)/)?.[1]};};
 try{
 assert.equal((await post('bicycle',{action:'take'})).status,401);
 const a=await post('register',{name:'cyclist',email:'cycle@example.test',password:'Bicycle-test-42'}),b=await post('register',{name:'other',email:'other@example.test',password:'Bicycle-test-42'});
 const first=await post('bicycle',{action:'take'},a.token);assert.equal(first.status,200);assert.equal(first.data.player.money,250);assert.equal(first.data.vehicles.length,1);const bike=first.data.vehicles[0];assert.equal(blocked(bike.x,bike.y,17),false);assert.equal(first.data.player.vehicleId,bike.id);
 assert.equal((await post('bicycle',{action:'take'},a.token)).data.vehicles.length,1);
 assert.equal((await post('vehicle',{},b.token)).status,400,'Le vélo appartient à son joueur');
 await post('vehicle',{},a.token);const stored=await post('bicycle',{action:'store'},a.token);assert.equal(stored.data.vehicles.length,0);assert.equal(stored.data.player.vehicleId,null);
 await post('bicycle',{action:'take'},a.token);await post('logout',{},a.token);const other=await post('bicycle',{action:'take'},b.token);assert.equal(other.data.vehicles.length,1,'Le vélo du joueur déconnecté est retiré');assert.equal(other.data.player.money,250);
 assert.ok((await post('inventory',{},b.token)).data.items.some(i=>i.id==='bicycle'));
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
