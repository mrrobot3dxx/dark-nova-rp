import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scryptSync} from 'node:crypto';
import {createGameServer,blocked,illegalMarket} from './server.mjs';
test('Cultures fictives : propriété, ressources, croissance, récolte unique et vente',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'nova-crops-')),dataFile=join(dir,'accounts.json'),password='Crops-test-password-42',salt='crops';
 await writeFile(dataFile,JSON.stringify(['grower','other'].map(key=>({key,id:key,name:key,salt,hash:scryptSync(password,salt,64).toString('hex'),x:230,y:320,money:500,job:false,career:'grower',supplies:{water:1,seed:1,pot:1},...(key==='grower'?{home:{id:'azur',until:Date.now()+86400000}}:{})}))));
 let server,base;
 const start=async()=>{server=createGameServer({dataFile,moderatorIds:[]});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;};
 const stop=async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));server=null;};
 const post=async(path,body={},token='')=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Cookie:'nova_session='+token},body:JSON.stringify(body)});return {status:r.status,data:await r.json(),token:r.headers.get('set-cookie')?.match(/nova_session=([^;]+)/)?.[1]};};
 const login=async name=>(await post('login',{name,password})).token;
 try{
 assert.equal(blocked(illegalMarket.x,illegalMarket.y),false);await start();let token=await login('grower'),other=await login('other');
 assert.equal((await post('cultivation',{action:'plant'},other)).status,400);
 assert.equal((await post('illegal-market',{action:'buy',id:'pot'},token)).status,400);
 const planted=await post('cultivation',{action:'plant',readyAt:0},token);assert.equal(planted.status,200);assert.equal(planted.data.supplies.pot,0);assert.equal(planted.data.supplies.seed,0);const id=planted.data.crops[0].id;
 assert.equal((await post('cultivation',{action:'plant'},token)).status,400);assert.equal((await post('cultivation',{action:'harvest',id},token)).status,409);
 assert.equal((await post('employment',{action:'work'},token)).status,400);
 await stop();let disk=JSON.parse(await readFile(dataFile,'utf8'));assert.equal(disk[0].crops.length,1);disk[0].crops[0].readyAt=Date.now()-100;await writeFile(dataFile,JSON.stringify(disk));await start();token=await login('grower');
 const harvest=await post('cultivation',{action:'harvest',id},token);assert.equal(harvest.status,200);assert.equal(harvest.data.supplies.cbd,1);assert.equal(harvest.data.supplies.pot,1);assert.equal((await post('cultivation',{action:'harvest',id},token)).status,404);
 assert.equal((await post('inventory',{action:'use',id:'cbd'},token)).status,400);
 await stop();disk=JSON.parse(await readFile(dataFile,'utf8'));disk[0].x=1150;disk[0].y=630;await writeFile(dataFile,JSON.stringify(disk));await start();token=await login('grower');
 const sold=await post('illegal-market',{action:'sell',price:99999},token);assert.equal(sold.status,200);assert.equal(sold.data.player.money,620);assert.equal(sold.data.supplies.cbd,0);assert.equal((await post('illegal-market',{action:'sell'},token)).status,409);
 const bought=await post('illegal-market',{action:'buy',id:'seed',price:0,quantity:100},token);assert.equal(bought.data.supplies.seed,1);assert.equal(bought.data.player.money,600);
 assert.equal((await post('illegal-market',{action:'buy',id:'unknown'},token)).status,400);
 }finally{if(server)await stop();await rm(dir,{recursive:true,force:true});}
});
