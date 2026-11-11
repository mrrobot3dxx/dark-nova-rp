import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scryptSync} from 'node:crypto';
for(const source of ['./server.mjs','../nova-rp/server.mjs'])test('Store : achat en arrivant à vélo et montant exact · '+source,async()=>{
 const {createGameServer}=await import(source),dir=await mkdtemp(join(tmpdir(),'nova-market-')),dataFile=join(dir,'accounts.json'),password='Market-test-password-42',salt='market';
 await writeFile(dataFile,JSON.stringify([{key:'buyer',id:'buyer',name:'buyer',salt,hash:scryptSync(password,salt,64).toString('hex'),x:1150,y:630,money:1000,job:false,career:'dealer'}]));const server=createGameServer({dataFile,moderatorIds:[]});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;let token;
 const post=async(path,body={})=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Cookie:'nova_session='+token},body:JSON.stringify(body)});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')};};
 try{token=(await post('login',{name:'buyer',password})).cookie.match(/nova_session=([^;]+)/)[1];const bike=await post('bicycle',{action:'take'});assert.ok(bike.data.player.vehicleId);assert.equal((await post('illegal-market')).data.nearMarket,true);
 const bought=await post('illegal-market',{action:'buy',id:'seed',price:0});assert.equal(bought.status,200);assert.equal(bought.data.player.money,980);assert.equal(bought.data.supplies.seed,1);assert.equal(bought.data.player.vehicleId,null);assert.equal((await post('session')).data.player.money,980);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
