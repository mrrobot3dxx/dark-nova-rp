import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scryptSync} from 'node:crypto';
for(const source of ['./server.mjs','../nova-rp/server.mjs'])test('Retour au Pôle emploi : objectif enregistré et salaire unique · '+source,async()=>{
 const {createGameServer}=await import(source),dir=await mkdtemp(join(tmpdir(),'nova-return-')),file=join(dir,'accounts.json'),password='Mission-return-test-42',salt='return';
 await writeFile(file,JSON.stringify([{key:'worker',id:'worker',name:'Worker',salt,hash:scryptSync(password,salt,64).toString('hex'),x:230,y:990,money:500,career:'police',workActive:false,job:false}]));let server,base,token;
 const start=async()=>{server=createGameServer({dataFile:file,moderatorIds:[]});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;token=(await post('login',{name:'Worker',password})).token;};const stop=async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));};
 const post=async(path,body={})=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Cookie:'nova_session='+token},body:JSON.stringify(body)});return {status:r.status,data:await r.json(),token:r.headers.get('set-cookie')?.match(/nova_session=([^;]+)/)?.[1]};};
 try{await start();assert.equal((await post('employment',{action:'start'})).status,200);assert.equal((await post('employment',{action:'complete'})).status,400,'pas de salaire avant le passage à l’objectif');await stop();let disk=JSON.parse(await readFile(file,'utf8'));disk[0].x=680;disk[0].y=335;await writeFile(file,JSON.stringify(disk));await start();assert.equal((await post('session')).data.player.workObjectiveReached,true);await stop();disk=JSON.parse(await readFile(file,'utf8'));assert.equal(disk[0].workObjectiveReached,true);disk[0].x=230;disk[0].y=990;await writeFile(file,JSON.stringify(disk));await start();await post('bicycle',{action:'take'});const done=await post('employment',{action:'complete'});assert.equal(done.status,200);assert.equal(done.data.player.vehicleId,null);assert.equal(done.data.player.money,640);assert.equal(done.data.player.workActive,false);assert.equal((await post('employment',{action:'complete'})).status,409);}finally{if(server?.listening)await stop();await rm(dir,{recursive:true,force:true});}
});
