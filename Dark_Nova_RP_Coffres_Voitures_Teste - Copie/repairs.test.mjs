import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scryptSync} from 'node:crypto';
for(const source of ['./server.mjs','../nova-rp/server.mjs'])test('Véhicule : collisions, panne, kit et état sauvegardé '+source,async()=>{
 const {createGameServer,blocked}=await import(source);assert.equal(blocked(1650,1250),false);const dir=await mkdtemp(join(tmpdir(),'nova-repair-')),file=join(dir,'accounts.json'),password='Repair-password-42',salt='repair';let clock=1000;
 await writeFile(file,JSON.stringify(['driver','buyer'].map(key=>({key,id:key,name:key,salt,hash:scryptSync(password,salt,64).toString('hex'),x:key==='driver'?520:1650,y:key==='driver'?500:1250,money:200,supplies:{repairkit:key==='driver'?1:0},garage:key==='driver'?[{id:'test-car',type:'car',name:'Voiture de test',x:520,y:500,health:100,color:'#888888',rentalUntil:null}]:[]}))));
 const server=createGameServer({dataFile:file,moderatorIds:[],vehicleDamageOptions:{now:()=>clock}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;let token='';const post=async(path,body={})=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Cookie:'nova_session='+token},body:JSON.stringify(body)});return {status:r.status,data:await r.json(),token:r.headers.get('set-cookie')?.match(/nova_session=([^;]+)/)?.[1]};};
 try{token=(await post('login',{name:'driver',password})).token;assert.equal((await post('vehicle')).data.player.vehicleId,'test-car');
 for(let i=0;i<7;i++){clock+=1500;await new Promise(r=>setTimeout(r,25));assert.equal((await post('move',{dx:1,dy:0})).status,200);}
 let r=await post('move',{dx:-1,dy:0});assert.equal(r.data.vehicles[0].health,0);const x=r.data.player.x;await new Promise(r=>setTimeout(r,25));assert.equal((await post('move',{dx:-1,dy:0})).data.player.x,x);assert.equal(JSON.parse(await readFile(file,'utf8'))[0].garage[0].health,0);
 assert.equal((await post('repairs',{action:'repair',id:'test-car'})).status,400);await post('vehicle');r=await post('inventory',{action:'use',id:'repairkit'});assert.equal(r.status,200);assert.equal(r.data.vehicles[0].health,100);assert.ok(!r.data.items.some(i=>i.id==='repairkit'));assert.equal((await post('inventory',{action:'use',id:'repairkit'})).status,400);assert.equal(JSON.parse(await readFile(file,'utf8'))[0].garage[0].health,100);
 token=(await post('login',{name:'buyer',password})).token;const buy={action:'buy',requestId:'11111111-1111-4111-8111-111111111111'};r=await post('repairs',buy);assert.equal(r.status,200);assert.equal(r.data.kits,1);assert.equal(r.data.player.money,100);r=await post('repairs',buy);assert.equal(r.data.kits,1);assert.equal(r.data.player.money,100);assert.equal((await post('repairs',{action:'repair',id:'test-car'})).status,400);
 const saved=JSON.parse(await readFile(file,'utf8'));assert.equal(saved[1].supplies.repairkit,1);assert.equal(saved[1].money,100);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
for(const folder of ['.','../nova-rp'])test('Dégâts : délai entre chocs et vélo épargné '+folder,async()=>{const {createVehicleDamage}=await import(folder+'/vehicle-condition.mjs');let time=0;const hit=createVehicleDamage({now:()=>time}),car={type:'car',health:100};assert.equal(hit(car),true);assert.equal(car.health,85);assert.equal(hit(car),false);time=1500;assert.equal(hit(car),true);assert.equal(car.health,70);assert.equal(hit({type:'bicycle',health:100}),false);});
