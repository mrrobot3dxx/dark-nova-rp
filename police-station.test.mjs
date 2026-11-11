import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scryptSync} from 'node:crypto';
for(const source of ['./server.mjs','../nova-rp/server.mjs'])test('Commissariat : entrée publique, intérieur et sortie · '+source,async()=>{
 const {createGameServer,blocked}=await import(source),dir=await mkdtemp(join(tmpdir(),'nova-station-')),file=join(dir,'accounts.json'),password='Station-test-password-42',salt='station';
 await writeFile(file,JSON.stringify(['civilian','officer','far'].map(key=>({key,id:key,name:key,salt,hash:scryptSync(password,salt,64).toString('hex'),x:key==='far'?455:685,y:key==='far'?990:317,money:500,career:key==='officer'?'police':null,job:false}))));
 const server=createGameServer({dataFile:file,moderatorIds:[]});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const post=async(path,body={},token='')=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Cookie:'nova_session='+token},body:JSON.stringify(body)});return {status:r.status,data:await r.json(),token:r.headers.get('set-cookie')?.match(/nova_session=([^;]+)/)?.[1]};};
 try{const world=await(await fetch(base+'/api/world')).json(),door=world.interiorEntrances.find(e=>e.id==='police-station');assert.ok(door);assert.equal(blocked(door.x,door.y),false);for(const name of ['civilian','officer']){const token=(await post('login',{name,password})).token;const entered=await post('interior',{action:'enter',id:door.id},token);assert.equal(entered.status,200);assert.equal(entered.data.player.interior.kind,'police');assert.equal((await post('session',{},token)).data.player.interior.id,door.id);assert.equal((await post('move',{dx:0,dy:-1},token)).status,200);const exit=await post('interior',{action:'exit'},token);assert.equal(exit.data.player.interior,null);assert.equal(exit.data.player.x,685);assert.equal(exit.data.player.y,317);}const far=(await post('login',{name:'far',password})).token;assert.equal((await post('interior',{action:'enter',id:door.id},far)).status,403);}finally{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
