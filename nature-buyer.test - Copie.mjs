import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scryptSync} from 'node:crypto';
for(const source of ['./server.mjs','../nova-rp/server.mjs'])test('Hugo : ventes sauvegardées et sans double paiement '+source,async()=>{
 const {createGameServer,blocked}=await import(source);assert.equal(blocked(1370,1320),false);const dir=await mkdtemp(join(tmpdir(),'nova-buyer-')),file=join(dir,'accounts.json'),password='Buyer-password-42',salt='buyer';
 await writeFile(file,JSON.stringify([{key:'seller',id:'seller',name:'seller',salt,hash:scryptSync(password,salt,64).toString('hex'),x:1370,y:1320,money:100,supplies:{wood:3,apple:2}},{key:'far',id:'far',name:'far',salt,hash:scryptSync(password,salt,64).toString('hex'),x:455,y:355,money:100,supplies:{wood:3}}]));
 const server=createGameServer({dataFile:file,moderatorIds:[]});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;let token='';const post=async(path,body={})=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Cookie:'nova_session='+token},body:JSON.stringify(body)});return {status:r.status,data:await r.json(),token:r.headers.get('set-cookie')?.match(/nova_session=([^;]+)/)?.[1]};};
 try{token=(await post('login',{name:'seller',password})).token;const body={action:'sell',id:'wood',quantity:3,requestId:'11111111-1111-4111-8111-111111111111'};let result=await post('nature-buyer',body);assert.equal(result.status,200);assert.equal(result.data.player.money,175);assert.equal(result.data.stock.wood,0);assert.equal((await post('nature-buyer',body)).data.player.money,175);assert.equal((await post('nature-buyer',{...body,quantity:2})).status,409);
 result=await post('nature-buyer',{...body,id:'apple',quantity:2,requestId:'22222222-2222-4222-8222-222222222222'});assert.equal(result.data.player.money,205);assert.equal(result.data.stock.apple,0);
 assert.equal((await post('nature-buyer',{...body,quantity:-1,requestId:'33333333-3333-4333-8333-333333333333'})).status,400);assert.equal((await post('nature-buyer',{...body,quantity:1,requestId:'44444444-4444-4444-8444-444444444444'})).status,409);assert.equal((await post('nature-buyer',{...body,id:'axe'})).status,400);
 const saved=JSON.parse(await readFile(file,'utf8'))[0];assert.equal(saved.money,205);assert.equal(saved.supplies.wood,0);assert.equal(saved.supplies.apple,0);token=(await post('login',{name:'far',password})).token;assert.equal((await post('nature-buyer',body)).status,400);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
