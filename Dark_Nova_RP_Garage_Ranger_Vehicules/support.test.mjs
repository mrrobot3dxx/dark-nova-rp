import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scryptSync} from 'node:crypto';
for(const source of ['./server.mjs','../nova-rp/server.mjs'])test('Appel modo : confidentialité, alertes, prise en charge, réponse et sauvegarde · '+source,async()=>{
 const {createGameServer}=await import(source),dir=await mkdtemp(join(tmpdir(),'nova-support-')),dataFile=join(dir,'accounts.json'),password='Support-test-password-42',salt='support';
 const common={salt,hash:scryptSync(password,salt,64).toString('hex'),x:455,y:355,money:500,job:false};await writeFile(dataFile,JSON.stringify([{...common,key:'moderator',id:'moderator',name:'moderator'},{...common,key:'player',id:'player',name:'player',mutedUntil:Date.now()+600000,cuffs:{officerId:'officer',officerName:'Officer'}},{...common,key:'other',id:'other',name:'other'}]));
 let server,base,reader;const originalNow=Date.now;
 const start=async()=>{server=createGameServer({dataFile,moderatorIds:['moderator']});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;};
 const stop=async()=>{await reader?.cancel();reader=null;server.closeAllConnections();await new Promise(r=>server.close(r));server=null;};
 const post=async(path,body={},token='')=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Cookie:'nova_session='+token},body:JSON.stringify(body)});return {status:r.status,data:await r.json(),token:r.headers.get('set-cookie')?.match(/nova_session=([^;]+)/)?.[1]};};const login=async name=>(await post('login',{name,password})).token;
 try{await start();assert.equal((await post('support',{action:'create',message:'help'})).status,401);let mod=await login('moderator'),player=await login('player'),other=await login('other');
 assert.equal((await post('mod-support',{},player)).status,403);assert.equal((await post('support',{action:'create',message:'x'},player)).status,400);
 const events=await fetch(base+'/events',{headers:{Cookie:'nova_session='+mod},signal:AbortSignal.timeout(8000)});reader=events.body.getReader();await reader.read();
 const sent=await post('support',{action:'create',message:'Je suis bloqué dans la villa <b>test</b>',reporterId:'forged'},player);assert.equal(sent.status,200);assert.equal(sent.data.onlineModerators,1);const report=sent.data.requests[0];assert.equal(report.reporterId,'player');assert.equal(report.status,'open');
 let alert='';for(let i=0;i<3&&!alert.includes(report.id);i++)alert+=new TextDecoder().decode((await reader.read()).value);assert.ok(alert.includes('event: support-alert'));assert.ok(alert.includes(report.id));assert.equal((await post('support',{},other)).data.requests.length,0);
 assert.equal((await post('support',{action:'create',message:'Un deuxième appel'},player)).status,409);
 const claim=await post('mod-support',{action:'claim',id:report.id},mod);assert.equal(claim.data.requests[0].status,'claimed');assert.equal((await post('support',{},player)).data.requests[0].assignedName,'moderator');
 assert.equal((await post('mod-support',{action:'resolve',id:report.id,reply:'x'.repeat(501)},mod)).status,400);await post('mod-support',{action:'resolve',id:report.id,reply:'Je viens t’aider.'},mod);assert.equal((await post('support',{},player)).data.requests[0].reply,'Je viens t’aider.');assert.equal((await post('support',{action:'create',message:'nouveau problème'},player)).status,429);
 Date.now=()=>originalNow()+61000;const pending=await post('support',{action:'create',message:'Autre problème'},player);assert.equal(pending.status,200);Date.now=originalNow;
 await stop();await start();mod=await login('moderator');player=await login('player');const queue=await post('mod-support',{},mod);assert.equal(queue.data.openCount,1);assert.equal(queue.data.requests.length,2);assert.equal((await post('support',{},player)).data.requests.length,2);assert.equal((await post('support',{},player)).data.onlineModerators,0);assert.equal((await fetch(base+'/support.js')).status,200);
 }finally{Date.now=originalNow;if(server)await stop();await rm(dir,{recursive:true,force:true});}
});
