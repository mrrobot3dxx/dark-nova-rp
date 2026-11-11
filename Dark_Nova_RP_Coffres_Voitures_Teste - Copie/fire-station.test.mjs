import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scryptSync} from 'node:crypto';
import {createGameServer,blocked} from './server.mjs';
test('Caserne : inscription pompier et départ en mission sur place',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'nova-station-')),dataFile=join(dir,'accounts.json'),password='Fire-station-test-42',salt='station';
 await writeFile(dataFile,JSON.stringify([{key:'fireman',id:'fireman',name:'fireman',salt,hash:scryptSync(password,salt,64).toString('hex'),x:680,y:990,money:250,job:false}]));
 const server=createGameServer({dataFile,moderatorIds:[]});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;let token='';
 const post=async(path,body)=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Cookie:'nova_session='+token},body:JSON.stringify(body)});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')};};
 try{assert.equal(blocked(680,990),false);const login=await post('login',{name:'fireman',password});token=login.cookie.match(/nova_session=([^;]+)/)[1];
 assert.equal((await post('employment',{action:'choose',career:'police'})).status,400);
 assert.equal((await post('employment',{action:'choose',career:'firefighter'})).data.player.career,'firefighter');
 const started=await post('employment',{action:'work'});assert.equal(started.status,200);assert.equal(started.data.player.workActive,true);const career=started.data.employment.careers.find(c=>c.id==='firefighter');assert.equal(blocked(career.x,career.y),false);
 assert.equal((await post('employment',{action:'work'})).status,400,'Pas de salaire immédiat à la caserne');
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
