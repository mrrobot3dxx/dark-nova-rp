import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scryptSync} from 'node:crypto';
for(const source of ['./server.mjs','../nova-rp/server.mjs'])test('Vêtements : achat, garde-robe, équipement et sauvegarde '+source,async()=>{
 const {createGameServer,blocked}=await import(source);assert.equal(blocked(1650,647),false);const dir=await mkdtemp(join(tmpdir(),'nova-clothes-')),file=join(dir,'accounts.json'),password='Clothes-password-42',salt='clothes';
 await writeFile(file,JSON.stringify(['buyer','poor','far'].map(key=>({key,id:key,name:key,color:'#c3f36a',salt,hash:scryptSync(password,salt,64).toString('hex'),x:key==='far'?455:1650,y:key==='far'?355:647,money:key==='poor'?10:400,supplies:{apple:2}}))));
 const server=createGameServer({dataFile:file,moderatorIds:[]});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;let token='';const post=async(path,body={})=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Cookie:'nova_session='+token},body:JSON.stringify(body)});return {status:r.status,data:await r.json(),token:r.headers.get('set-cookie')?.match(/nova_session=([^;]+)/)?.[1]};};
 try{token=(await post('login',{name:'buyer',password})).token;assert.equal((await post('clothing')).data.catalog.length,7);
 let r=await post('clothing',{action:'wear',id:'polo-ocean',price:0});assert.equal(r.status,200);assert.equal(r.data.player.money,325);assert.equal(r.data.player.outfit.style,'polo');assert.ok(r.data.owned.includes('polo-ocean'));
 assert.equal((await post('clothing',{action:'wear',id:'polo-ocean'})).data.player.money,325);assert.equal((await post('clothing',{action:'wear',id:'original'})).data.player.outfit,null);r=await post('clothing',{action:'wear',id:'polo-ocean'});assert.equal(r.data.player.money,325);
 assert.equal((await post('clothing',{action:'wear',id:'forged'})).status,400);const saved=JSON.parse(await readFile(file,'utf8'))[0];assert.equal(saved.outfitId,'polo-ocean');assert.deepEqual(saved.wardrobe,['polo-ocean']);assert.equal(saved.supplies.apple,2);
 await post('logout');r=await post('login',{name:'buyer',password});token=r.token;assert.equal(r.data.player.outfitId,'polo-ocean');assert.equal(r.data.player.outfit.color,'#619fc6');
 for(const name of ['poor','far']){token=(await post('login',{name,password})).token;assert.equal((await post('clothing',{action:'wear',id:'hoodie-night'})).status,400);}
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
