import {test} from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {scryptSync} from 'node:crypto';
for(const folder of ['.','../nova-rp'])test('Réapparition : 5 minutes sauvegardées, actions bloquées et retour hôpital '+folder,async()=>{
 const {createGameServer}=await import(folder+'/server.mjs');const dir=await mkdtemp(join(tmpdir(),'nova-respawn-')),file=join(dir,'accounts.json'),password='Respawn-test-42',salt='respawn';let clock=10000,token='',server,base;
 await writeFile(file,JSON.stringify([{key:'test',id:'test',name:'test',salt,hash:scryptSync(password,salt,64).toString('hex'),x:455,y:460,money:890,needs:{health:0,hunger:0,thirst:0},supplies:{water:2,snack:2}}]));
 const start=async()=>{server=createGameServer({dataFile:file,moderatorIds:[],needsOptions:{now:()=>clock}});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;};
 const post=async(path,body={})=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Cookie:'nova_session='+token},body:JSON.stringify(body)});const cookie=r.headers.get('set-cookie')?.match(/nova_session=([^;]+)/)?.[1];if(cookie)token=cookie;return {status:r.status,data:await r.json()};};
 const close=async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));};
 try{await start();let r=await post('login',{name:'test',password});const deadline=r.data.player.respawnAt;assert.equal(deadline,310000);assert.equal(r.data.player.respawnInMs,300000);assert.equal(r.data.player.needs.health,0);
  r=await post('move',{dx:1,dy:1});assert.equal(r.data.player.x,455);assert.equal(r.data.player.y,460);assert.equal((await post('inventory',{action:'use',id:'snack'})).status,403);assert.equal((await post('medic',{action:'heal'})).status,403);assert.equal((await post('respawn')).status,425);
  clock+=120000;await post('logout');await close();await start();r=await post('login',{name:'test',password});assert.equal(r.data.player.respawnAt,deadline);assert.equal(r.data.player.respawnInMs,180000);
  clock=deadline-1;assert.equal((await post('respawn')).status,425);clock=deadline;r=await post('respawn');assert.equal(r.status,200);assert.equal(r.data.player.needs.health,100);assert.equal(r.data.player.respawnAt,null);assert.equal(r.data.player.x,1250);assert.equal(r.data.player.y,320);assert.equal(r.data.player.money,890);assert.equal((await post('respawn')).status,409);
  const saved=JSON.parse(await readFile(file,'utf8'))[0];assert.equal(saved.respawnAt,null);assert.equal(saved.supplies.snack,2);assert.equal(saved.supplies.water,2);
 }finally{if(server?.listening)await close();await rm(dir,{recursive:true,force:true});}
});
