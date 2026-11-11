import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scryptSync} from 'node:crypto';
import {createGameServer} from './server.mjs';
test('Imprimante fictive : achat unique, installation, plafond et collecte unique',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'nova-printer-')),dataFile=join(dir,'accounts.json'),password='Printer-test-password-42',salt='printer';
 await writeFile(dataFile,JSON.stringify([{key:'printer',id:'printer',name:'printer',salt,hash:scryptSync(password,salt,64).toString('hex'),x:1150,y:630,money:1000,job:false,career:'dealer',home:{id:'azur',until:Date.now()+86400000}}]));
 let server,base,token;
 const post=async(path,body={})=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Cookie:'nova_session='+token},body:JSON.stringify(body)});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')};};
 const start=async()=>{server=createGameServer({dataFile,moderatorIds:[]});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;const a=await post('login',{name:'printer',password});token=a.cookie.match(/nova_session=([^;]+)/)[1];};
 const stop=async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));server=null;};
 const change=async fn=>{await stop();const data=JSON.parse(await readFile(dataFile,'utf8'));fn(data[0]);await writeFile(dataFile,JSON.stringify(data));await start();};
 try{await start();const bought=await post('illegal-market',{action:'buy',id:'printer',price:0});assert.equal(bought.data.player.money,400);assert.equal(bought.data.supplies.printer,1);assert.equal((await post('illegal-market',{action:'buy',id:'printer'})).status,409);
 assert.equal((await post('cultivation',{action:'installPrinter'})).status,400);assert.equal((await post('inventory',{action:'use',id:'printer'})).status,400);
 await change(a=>{a.x=230;a.y=320;});assert.equal((await post('cultivation',{action:'installPrinter'})).status,200);assert.equal((await post('cultivation',{action:'installPrinter'})).status,409);assert.equal((await post('cultivation',{action:'collectPrinter',amount:99999})).status,409);
 await change(a=>a.printer.lastCollectedAt=Date.now()-20*60000);const state=await post('cultivation');assert.equal(state.data.printer.amount,1000);assert.equal((await post('cultivation',{action:'packPrinter'})).status,409);
 const paid=await post('cultivation',{action:'collectPrinter',amount:99999});assert.equal(paid.data.player.money,1400);assert.equal((await post('cultivation',{action:'collectPrinter'})).status,409);
 const packed=await post('cultivation',{action:'packPrinter'});assert.equal(packed.data.printer,null);assert.equal(packed.data.supplies.printer,1);
 assert.equal((await post('cultivation',{action:'packPrinter'})).status,404);
 }finally{if(server)await stop();await rm(dir,{recursive:true,force:true});}
});
