import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scryptSync} from 'node:crypto';
for(const source of ['./server.mjs','../nova-rp/server.mjs'])test('Dr Léa : soins, prix, sauvegarde et double clic '+source,async()=>{
 const {createGameServer,blocked}=await import(source);assert.equal(blocked(1250,320),false);const dir=await mkdtemp(join(tmpdir(),'nova-medic-')),file=join(dir,'accounts.json'),password='Medic-password-42',salt='medic';
 await writeFile(file,JSON.stringify(['patient','poor','far'].map(key=>({key,id:key,name:key,salt,hash:scryptSync(password,salt,64).toString('hex'),x:key==='far'?455:1250,y:key==='far'?355:320,money:key==='poor'?20:100,needs:{health:40,hunger:60,thirst:70},supplies:{apple:3}}))));
 const server=createGameServer({dataFile:file,moderatorIds:[],needsOptions:{now:()=>1000}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;let token='';const post=async(path,body={})=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Cookie:'nova_session='+token},body:JSON.stringify(body)});return {status:r.status,data:await r.json(),token:r.headers.get('set-cookie')?.match(/nova_session=([^;]+)/)?.[1]};};
 try{token=(await post('login',{name:'patient',password})).token;const body={action:'heal',requestId:'11111111-1111-4111-8111-111111111111'};const r=await post('medic',body);assert.equal(r.status,200);assert.equal(r.data.player.money,50);assert.deepEqual(r.data.player.needs,{health:100,hunger:60,thirst:70});assert.equal((await post('medic',body)).data.player.money,50);assert.equal((await post('medic',{...body,requestId:'22222222-2222-4222-8222-222222222222'})).status,409);
 const saved=JSON.parse(await readFile(file,'utf8'))[0];assert.equal(saved.money,50);assert.equal(saved.needs.health,100);assert.equal(saved.supplies.apple,3);
 for(const name of ['poor','far']){token=(await post('login',{name,password})).token;assert.equal((await post('medic',body)).status,400);const player=(await post('session')).data.player;assert.equal(player.needs.health,40);assert.equal(player.money,name==='poor'?20:100);}
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
