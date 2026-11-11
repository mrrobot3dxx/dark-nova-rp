import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scryptSync} from 'node:crypto';
for(const source of ['./server.mjs','../nova-rp/server.mjs'])test('Nora : achats, consommation, sauvegarde et absence de double paiement '+source,async()=>{
 const {createGameServer,blocked}=await import(source);assert.equal(blocked(2070,2020),false);const dir=await mkdtemp(join(tmpdir(),'nova-bakery-')),file=join(dir,'accounts.json'),password='Bakery-password-42',salt='bakery';
 await writeFile(file,JSON.stringify(['buyer','poor','far'].map(key=>({key,id:key,name:key,salt,hash:scryptSync(password,salt,64).toString('hex'),x:key==='far'?455:2070,y:key==='far'?355:2020,money:key==='poor'?0:200,needs:{health:50,hunger:20,thirst:20},supplies:{}}))));
 const server=createGameServer({dataFile:file,moderatorIds:[],needsOptions:{now:()=>1000}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;let token='';const post=async(path,body={})=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Cookie:'nova_session='+token},body:JSON.stringify(body)});return {status:r.status,data:await r.json(),token:r.headers.get('set-cookie')?.match(/nova_session=([^;]+)/)?.[1]};};
 try{token=(await post('login',{name:'buyer',password})).token;const bread={action:'buy',id:'bread',quantity:1,price:0,requestId:'11111111-1111-4111-8111-111111111111'};let r=await post('bakery',bread);assert.equal(r.status,200);assert.equal(r.data.stock.bread,1);assert.equal(r.data.player.money,192);assert.equal((await post('bakery',bread)).data.player.money,192);assert.equal((await post('bakery',{...bread,quantity:5})).status,409);
 r=await post('inventory',{action:'use',id:'bread'});assert.equal(r.data.player.needs.hunger,45);assert.ok(!r.data.items.some(i=>i.id==='bread'));
 const juice={...bread,id:'juice',quantity:5,requestId:'22222222-2222-4222-8222-222222222222'};r=await post('bakery',juice);assert.equal(r.data.player.money,117);assert.equal(r.data.stock.juice,5);r=await post('inventory',{action:'use',id:'juice'});assert.equal(r.data.player.needs.thirst,55);assert.equal(r.data.player.needs.hunger,55);assert.equal(r.data.items.find(i=>i.id==='juice').quantity,4);
 const saved=JSON.parse(await readFile(file,'utf8'))[0];assert.equal(saved.money,117);assert.equal(saved.supplies.juice,4);assert.equal(saved.needs.thirst,55);for(const quantity of [-1,0,6,1.5])assert.equal((await post('bakery',{...bread,quantity})).status,400);assert.equal((await post('bakery',{...bread,id:'forged'})).status,400);
 for(const name of ['poor','far']){token=(await post('login',{name,password})).token;assert.equal((await post('bakery',bread)).status,400);}
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
