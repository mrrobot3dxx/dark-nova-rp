import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scryptSync} from 'node:crypto';
for(const source of ['./server.mjs','../nova-rp/server.mjs'])test('Choix du serveur : liste réelle et sauvegarde conservée · '+source,async()=>{
 const {createGameServer}=await import(source),dir=await mkdtemp(join(tmpdir(),'nova-servers-')),file=join(dir,'accounts.json'),password='Server-test-password-42',salt='servers';
 await writeFile(file,JSON.stringify([{key:'alex',id:'alex',name:'Alex',salt,hash:scryptSync(password,salt,64).toString('hex'),x:455,y:355,money:2345,job:false,supplies:{water:4,snack:3},garage:[{id:'saved-car',ownerId:'alex',name:'Citadine',type:'car',x:425,y:580,color:'#abc',rentalUntil:null,angle:0}]}]));
 const server=createGameServer({dataFile:file,moderatorIds:[]});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;let token='';
 const post=async(path,body={})=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Cookie:'nova_session='+token},body:JSON.stringify(body)});return {status:r.status,data:await r.json(),token:r.headers.get('set-cookie')?.match(/nova_session=([^;]+)/)?.[1]};};
 try{
 const list=await(await fetch(base+'/api/servers')).json();assert.equal(list.servers.length,1);assert.equal(list.servers[0].id,'main');assert.equal(list.servers[0].players,0);
 const before=await readFile(file,'utf8');assert.equal((await post('select-server',{serverId:'fake'})).status,404);assert.equal((await post('select-server',{serverId:'main'})).status,200);assert.equal(await readFile(file,'utf8'),before,'sélection sans mutation des comptes');
 const login=await post('login',{name:'Alex',password});token=login.token;assert.equal(login.data.player.money,2345);assert.equal(login.data.player.id,'alex');assert.equal((await post('garage')).data.garage.vehicles[0].id,'saved-car');
 await post('select-server',{serverId:'main'});assert.equal((await post('session')).data.player.money,2345);assert.equal((await post('garage')).data.garage.vehicles.length,1);assert.equal((await fetch(base+'/servers.js')).status,200);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
