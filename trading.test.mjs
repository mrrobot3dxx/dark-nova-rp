import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scryptSync,randomUUID} from 'node:crypto';
import {createGameServer} from './server.mjs';

test('Échanges : dons uniques, consentement, prix, stock et sauvegarde',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'dark-nova-trade-')),dataFile=join(dir,'accounts.json'),password='Trade-password-test-42',salt='trades';
 await writeFile(dataFile,JSON.stringify(['alex','sam','eve','far','tenant'].map(key=>({key,id:key,name:key,salt,hash:scryptSync(password,salt,64).toString('hex'),x:key==='far'?455:230,y:key==='far'?355:320,money:500,home:key==='tenant'?{id:'azur',until:Date.now()+3600000}:null,supplies:{water:2,snack:2},job:false}))));
 let server,base;const start=async()=>{server=createGameServer({dataFile,moderatorIds:[]});await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}`;};
 const stop=async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));};
 const post=async(path,body={},token='')=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Cookie:'nova_session='+token},body:JSON.stringify(body)});return {status:r.status,data:await r.json(),token:r.headers.get('set-cookie')?.match(/nova_session=([^;]*)/)?.[1]};};
 try{
  await start();const logins={};for(const name of ['alex','sam','eve','far','tenant'])logins[name]=(await post('login',{name,password})).token;
  assert.equal((await post('trade')).status,401);
  for(const amount of [-5,0,.5,1000001])assert.equal((await post('trade',{action:'give',targetId:'sam',amount,requestId:randomUUID()},logins.alex)).status,400);
  assert.equal((await post('trade',{action:'give',targetId:'alex',amount:10,requestId:randomUUID()},logins.alex)).status,400);
  assert.equal((await post('trade',{action:'give',targetId:'far',amount:10,requestId:randomUUID()},logins.alex)).status,400);
  assert.equal((await post('trade',{action:'give',targetId:'sam',amount:600,requestId:randomUUID()},logins.alex)).status,409);
  const gift={action:'give',targetId:'sam',amount:50,requestId:randomUUID()};assert.equal((await post('trade',gift,logins.alex)).data.money,450);assert.equal((await post('trade',gift,logins.alex)).data.money,450);assert.equal((await post('trade',{...gift,amount:51},logins.alex)).status,409);assert.equal((await post('trade',{},logins.sam)).data.money,550);
  const offer=async(itemId='water',quantity=1,price=30)=>post('trade',{action:'offer',targetId:'sam',itemId,quantity,price},logins.alex);
  assert.equal((await offer('service-weapon')).status,400);assert.equal((await offer('water',3)).status,409);assert.equal((await offer('water',1,-1)).status,400);
  const first=(await offer('water',2,100)).data.offers[0];assert.equal((await post('trade',{},logins.sam)).data.money,550,'aucun débit sans acceptation');
  assert.equal((await post('trade',{action:'accept',id:first.id},logins.eve)).status,403);
  const second=(await offer('water',1,20)).data.offers.find(o=>o.id!==first.id);
  const accepted=await post('trade',{action:'accept',id:first.id},logins.sam);assert.equal(accepted.status,200);assert.equal(accepted.data.money,450);assert.equal(accepted.data.items.find(i=>i.id==='water').quantity,4);assert.equal((await post('trade',{},logins.alex)).data.money,550);
  assert.equal((await post('trade',{action:'accept',id:first.id},logins.sam)).status,409);assert.equal((await post('trade',{action:'accept',id:second.id},logins.sam)).status,409,'stock déjà vendu');
  const tooExpensive=(await offer('snack',1,900)).data.offers[0];assert.equal((await post('trade',{action:'accept',id:tooExpensive.id},logins.sam)).status,409);assert.equal((await post('trade',{action:'decline',id:tooExpensive.id},logins.sam)).status,200);
  const cancelled=(await offer('snack',1,20)).data.offers[0];assert.equal((await post('trade',{action:'cancel',id:cancelled.id},logins.alex)).status,200);
  await post('interior',{action:'enter',id:'azur'},logins.tenant);assert.equal((await post('trade',{action:'give',targetId:'tenant',amount:10,requestId:randomUUID()},logins.sam)).status,400,'pas de don à travers un intérieur');
  const disk=JSON.parse(await readFile(dataFile,'utf8'));assert.equal(disk.find(a=>a.id==='alex').money,550);assert.equal(disk.find(a=>a.id==='sam').supplies.water,4);assert.equal(disk.reduce((sum,a)=>sum+a.money,0),2500,'conservation de la monnaie');
  await stop();await start();const alex=(await post('login',{name:'alex',password})).token;assert.equal((await post('trade',gift,alex)).data.money,550,'le don ne se répète pas après redémarrage');
 }finally{if(server?.listening)await stop();await rm(dir,{recursive:true,force:true});}
});
