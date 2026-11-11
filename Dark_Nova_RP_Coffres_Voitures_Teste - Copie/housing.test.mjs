import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scryptSync} from 'node:crypto';
import {createGameServer,blocked} from './server.mjs';

test('Résidences : bail exclusif, paiement, proximité, sauvegarde et expiration',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'nova-home-')),dataFile=join(dir,'accounts.json'),password='Home-test-password-42',salt='home-fixture';
 const users=['alex','sam','poor'].map((key,i)=>({key,id:key,name:key,email:key+'@example.test',salt,hash:scryptSync(password,salt,64).toString('hex'),color:'#c3f36a',x:230,y:320,money:i===2?50:500,job:false}));await writeFile(dataFile,JSON.stringify(users));let server,base;
 const start=async()=>{server=createGameServer({dataFile});await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}`;};
 const stop=async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));};
 const post=async(path,body={},token='')=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Cookie:'nova_session='+token},body:JSON.stringify(body)});return {status:r.status,data:await r.json(),token:r.headers.get('set-cookie')?.match(/nova_session=([^;]*)/)?.[1]};};
 try{
  await start();const world=await(await fetch(base+'/api/world')).json();assert.equal(world.width,5520);assert.equal(world.height,4320);assert.ok(world.residences.length>20);for(const home of world.residences)assert.equal(blocked(home.x,home.y),false,home.name+' possède une entrée accessible');
  const a=await post('login',{name:'alex',password}),b=await post('login',{name:'sam',password}),poor=await post('login',{name:'poor',password});
  assert.equal((await post('housing',{action:'rent',id:'azur'},poor.token)).status,400);
  assert.equal((await post('housing',{action:'rent',id:world.residences[1].id},a.token)).status,400);
  const rented=await post('housing',{action:'rent',id:'azur',price:0},a.token);assert.equal(rented.status,200);assert.equal(rented.data.player.money,320);assert.ok(rented.data.home.until>Date.now()+86300000);
  assert.equal((await post('housing',{action:'rent',id:'azur'},b.token)).status,409);assert.equal((await post('housing',{action:'leave',id:'azur'},b.token)).status,403);assert.equal((await post('housing',{action:'rent',id:'azur'},a.token)).status,409);
  await post('logout',{},a.token);await stop();await start();const again=await post('login',{name:'alex',password});const saved=await post('housing',{},again.token);assert.equal(saved.data.home.id,'azur');assert.equal(saved.data.player.money,320);
  const ended=await post('housing',{action:'leave',id:'azur'},again.token);assert.equal(ended.data.home,null);assert.equal(ended.data.player.money,320);assert.equal(ended.data.residences.find(h=>h.id==='azur').occupied,false);
  await post('housing',{action:'rent',id:'azur'},again.token);await stop();const disk=JSON.parse(await readFile(dataFile,'utf8'));disk.find(a=>a.key==='alex').home.until=Date.now()-1;await writeFile(dataFile,JSON.stringify(disk));await start();const back=await post('login',{name:'sam',password});assert.equal((await post('housing',{action:'rent',id:'azur'},back.token)).status,200,'le logement expiré est à nouveau disponible');
 }finally{if(server?.listening)await stop();await rm(dir,{recursive:true,force:true});}
});
