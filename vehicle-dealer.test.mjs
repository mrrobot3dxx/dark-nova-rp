import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scryptSync} from 'node:crypto';
for(const source of ['./server.mjs','../nova-rp/server.mjs'])test('Sam : achat et location devant le garage '+source,async()=>{
 const {createGameServer,blocked,garage}=await import(source);assert.equal(blocked(590,715),false);assert.ok(Math.hypot(590-garage.x,715-garage.y)>garage.radius);const dir=await mkdtemp(join(tmpdir(),'nova-dealer-')),file=join(dir,'accounts.json'),password='Dealer-password-42',salt='dealer';
 await writeFile(file,JSON.stringify([{key:'buyer',id:'buyer',name:'buyer',salt,hash:scryptSync(password,salt,64).toString('hex'),x:590,y:715,money:2000}]));
 const server=createGameServer({dataFile:file,moderatorIds:[]});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;let token='';const post=async(path,body={})=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Cookie:'nova_session='+token},body:JSON.stringify(body)});return {status:r.status,data:await r.json(),token:r.headers.get('set-cookie')?.match(/nova_session=([^;]+)/)?.[1]};};
 try{token=(await post('login',{name:'buyer',password})).token;let r=await post('garage',{action:'buy',type:'car',price:0});assert.equal(r.status,200);assert.equal(r.data.player.money,500);assert.equal(r.data.garage.vehicles[0].ownerId,'buyer');assert.equal(r.data.garage.vehicles[0].health,100);assert.equal((await post('garage',{action:'buy',type:'car'})).status,409);
 r=await post('garage',{action:'rent',type:'scooter'});assert.equal(r.status,200);assert.equal(r.data.player.money,440);assert.ok(r.data.garage.vehicles.find(v=>v.type==='scooter').rentalUntil>Date.now());assert.equal(JSON.parse(await readFile(file,'utf8'))[0].garage.length,2);assert.equal((await fetch(base+'/vehicle-dealer.js')).status,200);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});

for(const source of ['./server.mjs','../nova-rp/server.mjs'])test('Garage Central : vendeur et véhicule préparé sur place '+source,async()=>{
 const {createGameServer,blocked}=await import(source),{findVehicleDealer}=await import(source.replace('server.mjs','public/vehicle-dealer.js'));assert.equal(findVehicleDealer({x:1136,y:2049}).shortName,'Léo');assert.equal(blocked(1115,2075,36),false);
 const dir=await mkdtemp(join(tmpdir(),'nova-central-')),file=join(dir,'accounts.json'),password='Central-test-password-42',salt='central';await writeFile(file,JSON.stringify([{key:'test',id:'test',name:'test',salt,hash:scryptSync(password,salt,64).toString('hex'),x:1136,y:2049,money:2000}]));const server=createGameServer({dataFile:file,moderatorIds:[]});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;let token='';const post=async(path,body={})=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Cookie:'nova_session='+token},body:JSON.stringify(body)});return {status:r.status,data:await r.json(),token:r.headers.get('set-cookie')?.match(/nova_session=([^;]+)/)?.[1]};};
 try{token=(await post('login',{name:'test',password})).token;let r=await post('garage',{action:'buy',type:'car'});assert.equal(r.status,200);assert.equal(r.data.player.money,500);assert.equal(r.data.garage.vehicles[0].x,1115);assert.equal(r.data.garage.vehicles[0].y,2075);r=await post('garage',{action:'retrieve',type:'car'});assert.equal(r.status,200);assert.equal(r.data.garage.vehicles[0].x,1115);assert.equal(JSON.parse(await readFile(file,'utf8'))[0].garage[0].x,1115);}finally{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
