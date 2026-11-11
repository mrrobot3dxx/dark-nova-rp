import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scryptSync} from 'node:crypto';
for(const source of ['./server.mjs','../nova-rp/server.mjs'])test('Bois et pommes : accès, délai, sauvegarde et protection contre les doublons '+source,async()=>{
 const {createGameServer,blocked}=await import(source),{nature}=await import(source.replace('server.mjs','public/nature-world.js'));
 for(const node of nature.nodes)assert.equal(blocked(node.x,node.y),false,node.id+' doit être accessible');
 const dir=await mkdtemp(join(tmpdir(),'nova-nature-')),file=join(dir,'accounts.json'),password='Nature-test-password-42',salt='nature';let clock=Date.now();
 await writeFile(file,JSON.stringify(['wood','apple','far'].map((key,i)=>({key,id:key,name:key,salt,hash:scryptSync(password,salt,64).toString('hex'),x:i===2?1150:nature.nodes[i===0?0:3].x,y:i===2?630:nature.nodes[i===0?0:3].y,money:100,supplies:i===0?{axe:1}:{}}))));
 const server=createGameServer({dataFile:file,moderatorIds:[],natureOptions:{now:()=>clock}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const post=async(path,body={},token='')=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Cookie:'nova_session='+token},body:JSON.stringify(body)});return {status:r.status,data:await r.json(),token:r.headers.get('set-cookie')?.match(/nova_session=([^;]+)/)?.[1]};};
 try{
  for(const [key,id] of [['wood','wood-1'],['apple','apple-1']]){const token=(await post('login',{name:key,password})).token;
   assert.equal((await post('nature',{action:'start',id},token)).status,200);
   assert.equal((await post('nature',{action:'finish'},token)).status,409);
   clock+=3000;const result=await post('nature',{action:'finish'},token);assert.equal(result.status,200);assert.equal(result.data.stock[key],1);const inventory=await post('inventory',{},token);assert.equal(inventory.data.items.find(item=>item.id===key)?.quantity,1);if(key==='wood')assert.equal(result.data.stock.axe,1);
   assert.equal((await post('nature',{action:'finish'},token)).status,409);
   assert.equal((await post('nature',{action:'start',id},token)).status,409);
   assert.equal(JSON.parse(await readFile(file,'utf8')).find(a=>a.key===key).supplies[key],1);
  }
  const token=(await post('login',{name:'far',password})).token;assert.equal((await post('nature',{action:'start',id:'wood-1'},token)).status,400);
  assert.equal((await post('nature',{action:'start',id:'fake'},token)).status,400);const bought=await post('illegal-market',{action:'buy',id:'axe'},token);assert.equal(bought.status,200);assert.equal(bought.data.supplies.axe,1);assert.equal(bought.data.player.money,0);assert.equal((await post('illegal-market',{action:'buy',id:'axe'},token)).status,400);assert.equal(JSON.parse(await readFile(file,'utf8')).find(a=>a.key==='far').supplies.axe,1);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});

for(const folder of ['.','../nova-rp'])test('Hache obligatoire seulement pour le bois '+folder,async()=>{const {createNature}=await import(folder+'/nature.mjs');const account={supplies:{}},p={id:'test',accountKey:'test',x:950,y:1190};let clock=1000;const run=createNature({accounts:new Map([['test',account]]),persist:()=>{},markDirty:()=>{},now:()=>clock});assert.equal(run(p,{action:'start',id:'wood-1'}).status,403);account.supplies.axe=1;assert.equal(run(p,{action:'start',id:'wood-1'}).status,200);delete account.supplies.axe;clock+=3000;assert.equal(run(p,{action:'finish'}).status,403);assert.equal(account.supplies.wood,undefined);p.y=1320;assert.equal(run(p,{action:'start',id:'apple-1'}).status,200);clock+=3000;assert.equal(run(p,{action:'finish'}).status,200);assert.equal(account.supplies.apple,1);});
