import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createGameServer} from './server.mjs';

test('Comptes : sécurité, sauvegarde et connexion après redémarrage',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'nova-auth-')),dataFile=join(dir,'accounts.json');let server,base;
 const start=async()=>{server=createGameServer({dataFile});await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}`;};
 const stop=async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));};
 const post=async(path,body={},token='')=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Cookie:`nova_session=${token}`},body:JSON.stringify({email:'alex@example.test',...body})});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie'),token:r.headers.get('set-cookie')?.match(/nova_session=([^;]*)/)?.[1]};};
 try{
  await start();assert.equal((await post('join',{name:'Guest'})).status,401);assert.equal((await fetch(base+'/events?token=bad')).status,401);
  assert.equal((await post('register',{name:'Alex',password:'court'})).status,400);
  assert.equal((await post('register',{name:'Alex',password:'Long-test-password-42',email:''})).status,400);
  assert.equal((await post('register',{name:'Alex',password:'Long-test-password-42',email:'invalide@'})).status,400);
  const account=await post('register',{name:'Alex',password:'Long-test-password-42',color:'#8bc7ff'});assert.equal(account.status,200);assert.match(account.cookie,/HttpOnly/);assert.match(account.cookie,/SameSite=Strict/);assert.equal(account.data.token,undefined);
  assert.equal(account.data.player.email,undefined,'adresse privée');
  assert.equal((await post('register',{name:'Autre',password:'Long-test-password-42',email:' ALEX@EXAMPLE.TEST '})).status,409);
  assert.equal((await post('register',{name:'alex',password:'Long-test-password-42'})).status,409);
  assert.equal((await post('login',{name:'Alex',password:'Incorrect-password-42'})).status,401);
  await new Promise(r=>setTimeout(r,100));const moved=await post('move',{dx:0,dy:1},account.token);assert.ok(moved.data.player.y>355);
  const logout=await post('logout',{},account.token);assert.equal(logout.status,200);assert.equal((await post('session',{},account.token)).status,401);
  const disk=await readFile(dataFile,'utf8');assert.ok(!disk.includes('Long-test-password-42'));assert.ok(JSON.parse(disk)[0].hash);assert.equal(JSON.parse(disk)[0].y,moved.data.player.y);
  assert.equal(JSON.parse(disk)[0].email,'alex@example.test');
  await stop();await start();
  const login=await post('login',{name:'aLeX',password:'Long-test-password-42'});assert.equal(login.status,200);assert.equal(login.data.player.id,account.data.player.id);assert.equal(login.data.player.y,moved.data.player.y);assert.equal(login.data.player.money,250);assert.equal(login.data.player.color,'#8bc7ff');
  const second=await post('login',{name:'Alex',password:'Long-test-password-42'});assert.equal((await post('session',{},login.token)).status,401);assert.equal((await post('session',{},second.token)).status,200);
  const exposed=await fetch(base+'/data/accounts.json');assert.equal(exposed.status,404);
 }finally{if(server?.listening)await stop();await rm(dir,{recursive:true,force:true});}
});

test('Les tentatives de connexion sont limitées',async()=>{
 const server=createGameServer({dataFile:null});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{let status;for(let i=0;i<16;i++){const r=await fetch(`http://127.0.0.1:${server.address().port}/api/login`,{method:'POST',body:JSON.stringify({name:'X',password:'x'})});status=r.status;await r.text();}assert.equal(status,429);}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
