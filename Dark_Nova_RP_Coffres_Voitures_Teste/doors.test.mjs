import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scryptSync} from 'node:crypto';
for(const source of ['./server.mjs','../nova-rp/server.mjs'])test('Portes : clés, invités, verrouillage, sortie et sauvegarde · '+source,async()=>{
 const {createGameServer}=await import(source),dir=await mkdtemp(join(tmpdir(),'nova-doors-')),file=join(dir,'accounts.json'),password='Door-test-password-42',salt='doors';
 await writeFile(file,JSON.stringify(['owner','guest'].map(key=>({key,id:key,name:key,salt,hash:scryptSync(password,salt,64).toString('hex'),x:230,y:320,money:500,job:false,home:key==='owner'?{id:'azur',until:Date.now()+3600000}:null}))));
 let server,base;const start=async()=>{server=createGameServer({dataFile:file,moderatorIds:[]});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;};const stop=async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));};
 const post=async(path,body={},token='')=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Cookie:'nova_session='+token},body:JSON.stringify(body)});return {status:r.status,data:await r.json(),token:r.headers.get('set-cookie')?.match(/nova_session=([^;]+)/)?.[1]};};
 try{
  await start();const owner=(await post('login',{name:'owner',password})).token,guest=(await post('login',{name:'guest',password})).token;
  assert.equal((await post('door',{},owner)).data.home.locked,true);
  const key=(await post('inventory',{},owner)).data.items.find(i=>i.id==='home-key');assert.equal(key.usable,true);assert.equal(key.quantity,1);assert.equal(key.doorAction,'open');
  assert.equal((await post('inventory',{action:'use',id:'home-key',doorAction:'open'},guest)).status,403);
  const opened=await post('inventory',{action:'use',id:'home-key',doorAction:'open'},owner);assert.equal(opened.status,200);assert.equal(opened.data.items.find(i=>i.id==='home-key').quantity,1);assert.equal(opened.data.items.find(i=>i.id==='home-key').doorAction,'lock');
  const locked=await post('inventory',{action:'use',id:'home-key',doorAction:'lock'},owner);assert.equal(locked.status,200);assert.equal((await post('door',{},owner)).data.home.locked,true);

  assert.equal((await post('door',{action:'open'},guest)).status,403);
  assert.equal((await post('interior',{action:'enter',id:'azur'},guest)).status,403);
  assert.equal((await post('door',{action:'open'},owner)).data.home.locked,false);
  const entered=await post('interior',{action:'enter',id:'azur'},guest);assert.equal(entered.status,200);assert.equal(entered.data.player.interior.id,'azur');
  assert.equal((await post('session',{},guest)).data.player.interior.id,'azur','l’invité peut rester dans la pièce');
  await post('interior',{action:'enter',id:'azur'},owner);
  assert.equal((await post('door',{action:'lock'},owner)).data.home.locked,true);
  assert.equal((await post('session',{},guest)).data.player.interior.id,'azur','verrouiller ne piège ni n’expulse l’invité');
  assert.equal((await post('interior',{action:'exit'},guest)).status,200);
  assert.equal((await post('interior',{action:'enter',id:'azur'},guest)).status,403);
  await post('door',{action:'open'},owner);await stop();await start();
  const back=(await post('login',{name:'owner',password})).token;assert.equal((await post('door',{},back)).data.home.locked,false,'état ouvert sauvegardé');
  await post('door',{action:'lock'},back);await stop();await start();const again=(await post('login',{name:'owner',password})).token;assert.equal((await post('door',{},again)).data.home.locked,true,'état verrouillé sauvegardé');
 }finally{if(server?.listening)await stop();await rm(dir,{recursive:true,force:true});}
});
