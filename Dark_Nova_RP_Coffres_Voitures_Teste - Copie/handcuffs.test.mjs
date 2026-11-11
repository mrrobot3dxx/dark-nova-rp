import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scryptSync} from 'node:crypto';
for(const source of ['./server.mjs','../nova-rp/server.mjs'])test('Menottes : métier, portée, obstacles, immobilisation, libération manuelle et persistance · '+source,async()=>{
 const {createGameServer}=await import(source),dir=await mkdtemp(join(tmpdir(),'nova-cuffs-')),dataFile=join(dir,'accounts.json'),password='Handcuffs-test-42',salt='cuffs';
 const common={salt,hash:scryptSync(password,salt,64).toString('hex'),color:'#c3f36a',money:500,job:false};
 await writeFile(dataFile,JSON.stringify([{...common,key:'officer',id:'officer',name:'officer',career:'police',x:455,y:355},{...common,key:'victim',id:'victim',name:'victim',x:480,y:355},{...common,key:'far',id:'far',name:'far',x:1000,y:355},{...common,key:'wallcop',id:'wallcop',name:'wallcop',career:'police',x:85,y:130},{...common,key:'walltarget',id:'walltarget',name:'walltarget',x:130,y:85}]));
 let server=createGameServer({dataFile,moderatorIds:[]});await new Promise(r=>server.listen(0,'127.0.0.1',r));let base='http://127.0.0.1:'+server.address().port;
 const post=async(path,body={},token='')=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Cookie:'nova_session='+token},body:JSON.stringify(body)});return {status:r.status,data:await r.json(),token:r.headers.get('set-cookie')?.match(/nova_session=([^;]+)/)?.[1]};};
 const originalNow=Date.now;
 try{
 const login=async name=>(await post('login',{name,password})).token,officer=await login('officer'),victim=await login('victim'),far=await login('far'),wallcop=await login('wallcop'),walltarget=await login('walltarget');
 assert.equal((await post('handcuffs',{action:'cuff',id:'officer'},victim)).status,403);assert.equal((await post('handcuffs',{action:'cuff',id:'far'},officer)).status,400);assert.equal((await post('handcuffs',{action:'cuff',id:'officer'},officer)).status,404);assert.equal((await post('handcuffs',{action:'cuff',id:'walltarget'},wallcop)).status,400);
 await post('bicycle',{action:'take'},victim);assert.equal((await post('handcuffs',{action:'cuff',id:'victim'},officer)).status,400);await post('bicycle',{action:'store'},victim);
 const cuff=await post('handcuffs',{action:'cuff',id:'victim'},officer);assert.equal(cuff.status,200);assert.equal(cuff.data.players.find(p=>p.id==='victim').cuffed,true);
 const before=(await post('session',{},victim)).data.player,moved=await post('move',{dx:1,dy:1},victim);assert.equal(moved.status,200);assert.equal(moved.data.player.x,before.x);assert.equal(moved.data.player.y,before.y);assert.equal((await post('bicycle',{action:'take'},victim)).status,403);assert.equal((await post('interior',{action:'enter'},victim)).status,403);
 assert.equal((await post('handcuffs',{action:'cuff',id:'victim'},officer)).status,409);assert.equal((await post('handcuffs',{action:'release',id:'victim'},victim)).status,403);
 await post('handcuffs',{action:'release',id:'victim'},officer);assert.equal((await post('session',{},victim)).data.player.cuffed,false);
 await post('handcuffs',{action:'cuff',id:'victim'},officer);Date.now=()=>originalNow()+121000;assert.equal((await post('session',{},victim)).data.player.cuffed,true,'Aucune expiration après deux minutes');Date.now=originalNow;
 await post('logout',{},officer);assert.equal((await post('session',{},victim)).data.player.cuffed,true,'Le départ du policier ne retire pas les menottes');await post('logout',{},victim);server.closeAllConnections();await new Promise(r=>server.close(r));server=createGameServer({dataFile,moderatorIds:[]});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;const reconnected=await login('victim');assert.equal((await post('session',{},reconnected)).data.player.cuffed,true,'Les menottes restent après reconnexion');const copBack=await login('officer');await post('handcuffs',{action:'release',id:'victim'},copBack);assert.equal((await post('session',{},reconnected)).data.player.cuffed,false);
 assert.equal((await fetch(base+'/police.js')).status,200);
 }finally{Date.now=originalNow;server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
