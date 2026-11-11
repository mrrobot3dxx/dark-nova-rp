import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scryptSync} from 'node:crypto';
for(const source of ['./server.mjs','../nova-rp/server.mjs'])test('Bouton kit : descendre puis réparer le véhicule et consommer un seul kit '+source,async()=>{
 const {createGameServer}=await import(source),{repairWithKit}=await import(source.replace('server.mjs','public/vehicle-repair.js'));const dir=await mkdtemp(join(tmpdir(),'nova-use-kit-')),file=join(dir,'accounts.json'),password='Use-kit-password-42',salt='kit';await writeFile(file,JSON.stringify([{key:'test',id:'test',name:'test',salt,hash:scryptSync(password,salt,64).toString('hex'),x:425,y:580,money:500,supplies:{repairkit:1},garage:[{id:'car',type:'car',name:'Voiture',x:425,y:580,health:0}]}]));const server=createGameServer({dataFile:file,moderatorIds:[]});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;let token='',me,vehicles=[];
 const api=async(path,body={})=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Cookie:'nova_session='+token},body:JSON.stringify(body)});const data=await r.json();token=r.headers.get('set-cookie')?.match(/nova_session=([^;]+)/)?.[1]||token;if(!r.ok)throw Error(data.error);return data;};
 try{me=(await api('login',{name:'test',password})).player;me=(await api('vehicle')).player;assert.equal(me.vehicleId,'car');const options={api,getMe:()=>me,setMe:p=>{me=p;},setVehicles:list=>{vehicles=list;},vehicleId:'car'};await repairWithKit(options);assert.equal(me.vehicleId,null);assert.equal(vehicles[0].health,100);assert.equal((await api('repairs')).kits,0);me=(await api('vehicle')).player;await assert.rejects(repairWithKit(options),/aucun kit/);assert.equal(me.vehicleId,'car');const saved=JSON.parse(await readFile(file,'utf8'))[0];assert.equal(saved.supplies.repairkit,0);assert.equal(saved.garage[0].health,100);assert.equal(saved.money,500);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
