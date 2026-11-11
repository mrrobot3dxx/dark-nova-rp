import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scryptSync} from 'node:crypto';
for(const source of ['./server.mjs','../nova-rp/server.mjs'])test('Pôle emploi : abandon explicite, choix sauvegardé et stationnement · '+source,async()=>{
 const {createGameServer}=await import(source),dir=await mkdtemp(join(tmpdir(),'nova-jobs-')),dataFile=join(dir,'accounts.json'),password='Employment-change-42',salt='jobs';await writeFile(dataFile,JSON.stringify([{key:'worker',id:'worker',name:'worker',salt,hash:scryptSync(password,salt,64).toString('hex'),x:230,y:990,money:500,job:false,career:'police',workActive:true}]));
 const server=createGameServer({dataFile,moderatorIds:[]});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;let token;
 const post=async(path,body={})=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Cookie:'nova_session='+token},body:JSON.stringify(body)});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')};};
 try{token=(await post('login',{name:'worker',password})).cookie.match(/nova_session=([^;]+)/)[1];assert.equal((await post('employment',{action:'choose',career:'grower'})).status,409);const canceled=await post('employment',{action:'cancel'});assert.equal(canceled.status,200);assert.equal(canceled.data.player.workActive,false);assert.equal(canceled.data.player.money,500);assert.equal(canceled.data.player.career,'police');
 await post('bicycle',{action:'take'});const chosen=await post('employment',{action:'choose',career:'grower'});assert.equal(chosen.status,200);assert.equal(chosen.data.player.career,'grower');assert.equal(chosen.data.player.vehicleId,null);await post('logout');token=(await post('login',{name:'worker',password})).cookie.match(/nova_session=([^;]+)/)[1];assert.equal((await post('session')).data.player.career,'grower');assert.equal((await fetch(base+'/employment.js')).status,200);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
