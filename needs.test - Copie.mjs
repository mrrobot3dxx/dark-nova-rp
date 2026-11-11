import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scryptSync} from 'node:crypto';
for(const folder of ['.','../nova-rp']){
 test('Besoins : faim, soif, dégâts, malaise et absence de perte hors ligne '+folder,async()=>{
  const {createNeeds}=await import(folder+'/needs.mjs');let clock=1000,collapses=0;const system=createNeeds({now:()=>clock,onCollapse:()=>collapses++}),p={};system.start(p);
  clock+=2700000;system.tick(p);assert.equal(p.needs.thirst,0);assert.equal(p.needs.hunger,25);assert.equal(p.needs.health,100);
  clock+=60000;system.tick(p);assert.equal(p.needs.health,90);system.consume(p,'water');assert.equal(p.needs.thirst,40);assert.equal(system.consume(p,'wood'),false);
  system.start(p,{health:1,hunger:0,thirst:0});clock+=6000;system.tick(p);assert.equal(collapses,1);assert.equal(p.needs.health,0);assert.equal(system.consume(p,'snack'),false);clock+=299999;assert.equal(system.respawn(p),false);clock++;assert.equal(system.respawn(p),true);assert.deepEqual(p.needs,{health:100,hunger:75,thirst:75});
  const stored={...p.needs};clock+=86400000;system.start(p,stored);system.tick(p);assert.deepEqual(p.needs,stored);
  system.consume(p,'snack');system.consume(p,'apple');assert.deepEqual(p.needs,{health:100,hunger:100,thirst:80});for(let i=0;i<10;i++)system.consume(p,'apple');assert.deepEqual(p.needs,{health:100,hunger:100,thirst:100});
 });
 test('Manger et boire : consommation réelle et besoins sauvegardés '+folder,async()=>{
  const {createGameServer}=await import(folder+'/server.mjs'),dir=await mkdtemp(join(tmpdir(),'nova-needs-')),file=join(dir,'accounts.json'),password='Needs-test-password-42',salt='needs';let clock=1000;
  await writeFile(file,JSON.stringify([{key:'test',id:'test',name:'test',salt,hash:scryptSync(password,salt,64).toString('hex'),x:1150,y:630,money:100,needs:{health:70,hunger:40,thirst:10},supplies:{apple:1,water:1,snack:1}}]));
  const server=createGameServer({dataFile:file,moderatorIds:[],needsOptions:{now:()=>clock}});await new Promise(r=>server.listen(0,'127.0.0.1',r));let token='';const base='http://127.0.0.1:'+server.address().port;
  const post=async(path,body={})=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Cookie:'nova_session='+token},body:JSON.stringify(body)});return {status:r.status,data:await r.json(),token:r.headers.get('set-cookie')?.match(/nova_session=([^;]+)/)?.[1]};};
  try{token=(await post('login',{name:'test',password})).token;clock+=27000;let r=await post('inventory',{action:'use',id:'water'});assert.equal(r.status,200);assert.equal(r.data.player.needs.thirst,49);assert.ok(!r.data.items.some(i=>i.id==='water'));
   r=await post('inventory',{action:'use',id:'apple'});assert.equal(r.data.player.needs.health,72);assert.equal(r.data.player.needs.hunger,59.25);assert.equal(r.data.player.needs.thirst,54);assert.equal((await post('inventory',{action:'use',id:'apple'})).status,409);
   r=await post('illegal-market',{action:'buy',id:'snack'});assert.equal(r.status,200);assert.equal(r.data.supplies.snack,2);assert.equal(r.data.player.money,85);
   const saved=JSON.parse(await readFile(file,'utf8'))[0];assert.equal(saved.supplies.apple,0);assert.equal(saved.needs.thirst,54);
   await post('logout');clock+=86400000;token=(await post('login',{name:'test',password})).token;assert.equal((await post('inventory')).data.player.needs.thirst,54);
  }finally{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
 });
}
