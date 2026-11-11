import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scryptSync} from 'node:crypto';
import {createGameServer,employment,blocked} from './server.mjs';
test('Métiers : proximité, choix, mission, salaire unique et sauvegarde',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'nova-work-')),dataFile=join(dir,'accounts.json'),password='Test-employment-42',salt='work';
 await writeFile(dataFile,JSON.stringify([{key:'worker',id:'worker',name:'worker',salt,hash:scryptSync(password,salt,64).toString('hex'),x:230,y:990,money:250,job:false}]));
 let server,base,token;
 const start=async()=>{server=createGameServer({dataFile});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;const r=await fetch(base+'/api/login',{method:'POST',body:JSON.stringify({name:'worker',password})});token=r.headers.get('set-cookie').match(/nova_session=([^;]+)/)[1];};
 const stop=async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));};
 const post=async body=>{const r=await fetch(base+'/api/employment',{method:'POST',headers:{Cookie:'nova_session='+token},body:JSON.stringify(body)});return {status:r.status,data:await r.json()};};
 try{
 assert.equal(blocked(employment.x,employment.y),false);for(const c of employment.careers)assert.equal(blocked(c.x,c.y),false,c.name);
 await start();assert.equal((await post({action:'choose',career:'invalid'})).status,400);
 assert.equal((await post({action:'choose',career:'mechanic'})).data.player.career,'mechanic');
 assert.equal((await post({action:'work'})).data.player.workActive,true);
 assert.equal((await post({action:'choose',career:'gardener'})).status,409);
 assert.equal((await post({action:'work'})).status,400);
 await stop();let accounts=JSON.parse(await readFile(dataFile,'utf8'));assert.equal(accounts[0].workActive,true);accounts[0].x=455;accounts[0].y=520;await writeFile(dataFile,JSON.stringify(accounts));await start();
 const paid=await post({action:'work',reward:99999});assert.equal(paid.data.player.money,360);assert.equal(paid.data.player.workActive,false);
 assert.equal((await post({action:'work'})).status,400);assert.equal((await post({action:'choose',career:'gardener'})).status,400);
 await stop();server=null;accounts=JSON.parse(await readFile(dataFile,'utf8'));assert.equal(accounts[0].career,'mechanic');assert.equal(accounts[0].money,360);
 }finally{if(server)await stop();await rm(dir,{recursive:true,force:true});}
});
