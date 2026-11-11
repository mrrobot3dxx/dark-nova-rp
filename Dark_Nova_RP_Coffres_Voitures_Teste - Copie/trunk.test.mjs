import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scryptSync} from 'node:crypto';
import {createGameServer} from './server.mjs';

test('Coffres : propriété, proximité, dépôt, retrait et persistance',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'nova-trunk-')),dataFile=join(dir,'accounts.json'),salt='trunk-salt',password='Password-test-2026';
 const vehicle={id:'my-car',type:'car',name:'Citadine Nova',x:455,y:520,health:100,ownerId:'owner-id',rentalUntil:null};
 const account={key:'owner',id:'owner-id',name:'Owner',email:'owner@example.test',salt,hash:scryptSync(password,salt,64).toString('hex'),color:'#abcdef',x:455,y:570,money:250,garage:[vehicle],supplies:{water:3,snack:2}};
 await writeFile(dataFile,JSON.stringify([account]));let server,base;
 const start=async()=>{server=createGameServer({dataFile});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;};
 const stop=async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));};
 const post=async(path,body={},token='')=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Cookie:'nova_session='+token},body:JSON.stringify(body)});return {status:r.status,data:await r.json(),token:r.headers.get('set-cookie')?.match(/nova_session=([^;]*)/)?.[1]};};
 try{
  await start();const login=await post('login',{name:'Owner',password}),token=login.token;
  assert.equal((await post('trunk',{vehicleId:'other'},token)).status,403);
  assert.equal((await post('trunk',{vehicleId:'my-car',action:'deposit',id:'water',quantity:500},token)).status,400);
  assert.equal((await post('trunk',{vehicleId:'my-car',action:'deposit',id:'water',quantity:4},token)).status,409);
  const deposited=await post('trunk',{vehicleId:'my-car',action:'deposit',id:'water',quantity:2},token);
  assert.equal(deposited.status,200);assert.equal(deposited.data.trunk.water,2);assert.equal(deposited.data.supplies.water,1);
  const recovered=await post('trunk',{vehicleId:'my-car',action:'withdraw',id:'water',quantity:1},token);
  assert.equal(recovered.status,200);assert.equal(recovered.data.trunk.water,1);assert.equal(recovered.data.supplies.water,2);
  await post('logout',{},token);await stop();
  const saved=JSON.parse(await readFile(dataFile,'utf8'))[0];assert.equal(saved.garage[0].trunk.water,1);assert.equal(saved.supplies.water,2);
  await start();const relog=await post('login',{name:'Owner',password});const again=await post('trunk',{vehicleId:'my-car'},relog.token);assert.equal(again.data.trunk.water,1);
  const other=await post('register',{name:'Other',email:'other@example.test',password:'Other-password-2026'});
  assert.equal((await post('trunk',{vehicleId:'my-car'},other.token)).status,403);
 }finally{if(server?.listening)await stop();await rm(dir,{recursive:true,force:true});}
});
