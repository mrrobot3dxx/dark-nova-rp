import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scryptSync} from 'node:crypto';
import {createGameServer} from './server.mjs';

test('Garage : tarifs serveur, propriété, location, récupération et persistance',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'nova-garage-')),dataFile=join(dir,'accounts.json'),password='Garage-test-password-42',salt='fixture-salt';
 const account={key:'pilote',id:'garage-pilot',name:'Pilote',email:'pilote@example.test',salt,hash:scryptSync(password,salt,64).toString('hex'),color:'#c3f36a',x:455,y:520,money:2000,job:false};
 await writeFile(dataFile,JSON.stringify([account]));let server,base;
 const start=async()=>{server=createGameServer({dataFile});await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}`;};
 const stop=async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));};
 const post=async(path,body={},token='')=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Cookie:'nova_session='+token},body:JSON.stringify(body)});return {status:r.status,data:await r.json(),token:r.headers.get('set-cookie')?.match(/nova_session=([^;]*)/)?.[1]};};
 try{
  await start();const login=await post('login',{name:'Pilote',password}),token=login.token;
  assert.equal((await post('garage',{action:'buy',type:'spaceship'},token)).status,400);
  const bought=await post('garage',{action:'buy',type:'car',price:0},token);assert.equal(bought.status,200);assert.equal(bought.data.player.money,500);const own=bought.data.garage.vehicles[0];assert.equal(own.ownerId,account.id);assert.equal(own.rentalUntil,null);
  assert.equal((await post('garage',{action:'buy',type:'car'},token)).status,409);
  assert.equal((await post('garage',{action:'buy',type:'scooter'},token)).status,400);
  const rented=await post('garage',{action:'rent',type:'scooter'},token);assert.equal(rented.data.player.money,440);const rental=rented.data.garage.vehicles.find(v=>v.rentalUntil);assert.ok(rental.rentalUntil>Date.now()+590000);
  assert.equal((await post('garage',{action:'rent',type:'car'},token)).status,409);
  const visitor=await post('register',{name:'Visitor',email:'visitor@example.test',password});assert.equal((await post('garage',{action:'rent',type:'scooter'},visitor.token)).status,400,'le garage doit être à proximité');
  for(let i=0;i<4;i++){await new Promise(r=>setTimeout(r,150));await post('move',{dx:0,dy:1},visitor.token);}
  const entered=await post('vehicle',{},visitor.token);assert.ok(![own.id,rental.id].includes(entered.data.player?.vehicleId),'les véhicules privés ne peuvent pas être pris par un autre joueur');
  assert.equal((await post('garage',{action:'retrieve',type:'car'},token)).status,200);
  await post('logout',{},token);await stop();
  let disk=JSON.parse(await readFile(dataFile,'utf8'));const saved=disk.find(a=>a.id===account.id);assert.equal(saved.money,440);assert.equal(saved.garage.length,2);
  saved.garage.find(v=>v.rentalUntil).rentalUntil=Date.now()-1;await writeFile(dataFile,JSON.stringify(disk));await start();
  const back=await post('login',{name:'Pilote',password});const garage=await post('garage',{},back.token);assert.equal(garage.data.garage.vehicles.length,1);assert.equal(garage.data.garage.vehicles[0].id,own.id);assert.equal(garage.data.player.money,440);
  const again=await post('garage',{action:'rent',type:'scooter'},back.token);assert.equal(again.data.player.money,380);
  const returned=await post('garage',{action:'return',type:'scooter'},back.token);assert.equal(returned.data.garage.vehicles.length,1);assert.equal(returned.data.player.money,380,'pas de remboursement automatique');
 }finally{if(server?.listening)await stop();await rm(dir,{recursive:true,force:true});}
});
