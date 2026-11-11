import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scryptSync} from 'node:crypto';
for(const source of ['./server.mjs','../nova-rp/server.mjs'])test('Villa des Pins : entrée réelle, visite, locataire et sortie · '+source,async()=>{
 const {createGameServer,interiorEntrances}=await import(source),entrance=interiorEntrances.find(e=>e.id==='villa-pins');assert.ok(entrance);
 const dir=await mkdtemp(join(tmpdir(),'nova-pins-')),dataFile=join(dir,'accounts.json'),password='Villa-Pins-test-42',salt='pins';
 const server=createGameServer({dataFile,moderatorIds:[]});await new Promise(r=>server.listen(0,'127.0.0.1',r));const info=await(await fetch('http://127.0.0.1:'+server.address().port+'/api/world')).json();server.closeAllConnections();await new Promise(r=>server.close(r));
 const home=info.residences.find(h=>h.buildingName==='VILLA DES PINS');assert.ok(home);
 const common={salt,hash:scryptSync(password,salt,64).toString('hex'),color:'#c3f36a',money:500,job:false};await writeFile(dataFile,JSON.stringify([{...common,id:'owner',key:'owner',name:'owner',x:entrance.x,y:entrance.y,home:{id:home.id,until:Date.now()+3600000}},{...common,id:'visitor',key:'visitor',name:'visitor',x:entrance.x,y:entrance.y,garage:[{id:'visitor-car',type:'car',name:'Citadine test',ownerId:'visitor',x:entrance.x,y:entrance.y,color:'#fff',angle:0,rentalUntil:null}]},{...common,id:'far',key:'far',name:'far',x:455,y:355}]));
 const running=createGameServer({dataFile,moderatorIds:[]});await new Promise(r=>running.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+running.address().port;
 const post=async(path,body={},token='')=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Cookie:'nova_session='+token},body:JSON.stringify(body)});return {status:r.status,data:await r.json(),token:r.headers.get('set-cookie')?.match(/nova_session=([^;]+)/)?.[1]};};
 try{const a=await post('login',{name:'owner',password}),b=await post('login',{name:'visitor',password}),c=await post('login',{name:'far',password});
 assert.equal((await post('interior',{action:'enter',id:'villa-pins'},c.token)).status,403);
 const owned=await post('interior',{action:'enter'},a.token);assert.equal(owned.status,200);assert.equal(owned.data.player.interior.id,home.id);assert.equal(owned.data.player.interior.private,true);assert.equal(owned.data.player.interior.kind,'villa');
 const mounted=await post('vehicle',{},b.token);assert.equal(mounted.data.player.vehicleId,'visitor-car');
 const visit=await post('interior',{action:'enter'},b.token);assert.equal(visit.status,200);assert.equal(visit.data.player.vehicleId,null,'Le véhicule est garé automatiquement');assert.equal(visit.data.player.interior.id,'villa-pins');assert.notEqual(visit.data.player.interior.id,owned.data.player.interior.id);
 assert.equal((await post('interior',{action:'enter',id:home.id},b.token)).status,409);
 const out=await post('interior',{action:'exit'},b.token);assert.equal(out.data.player.interior,null);assert.equal(out.data.player.x,entrance.x);assert.equal(out.data.player.y,entrance.y);const garage=await post('garage',{},b.token);assert.equal(garage.data.garage.vehicles.find(v=>v.id==='visitor-car').driverId,null);
 assert.equal((await post('interior',{action:'enter',id:home.id},b.token)).status,403);
 assert.equal((await fetch(base+'/interiors.js')).status,200);
 }finally{running.closeAllConnections();await new Promise(r=>running.close(r));await rm(dir,{recursive:true,force:true});}
});
