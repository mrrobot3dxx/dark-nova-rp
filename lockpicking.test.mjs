import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scryptSync} from 'node:crypto';
for(const source of ['./server.mjs','../nova-rp/server.mjs'])test('Crochets RP : achat, délai, accès temporaire et propriété · '+source,async()=>{
 const {createGameServer}=await import(source),dir=await mkdtemp(join(tmpdir(),'nova-picks-')),file=join(dir,'accounts.json'),password='Pick-test-password-42',salt='picks';let clock=Date.now(),roll=0;
 const car={id:'locked-car',type:'car',name:'Voiture privée',x:260,y:335,color:'#fff',ownerId:'owner',driverId:null,angle:0};
 await writeFile(file,JSON.stringify(['owner','visitor','shopper'].map(key=>({key,id:key,name:key,salt,hash:scryptSync(password,salt,64).toString('hex'),x:key==='shopper'?1150:230,y:key==='shopper'?630:320,money:500,job:false,home:key==='owner'?{id:'azur',until:Date.now()+3600000,locked:true}:null,garage:key==='owner'?[car]:[],supplies:{water:2,snack:2,lockpick:key==='visitor'?3:0}}))));
 let server=createGameServer({dataFile:file,moderatorIds:[],lockpickOptions:{now:()=>clock,roll:()=>roll}});await new Promise(r=>server.listen(0,'127.0.0.1',r));let base='http://127.0.0.1:'+server.address().port;
 const post=async(path,body={},token='')=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Cookie:'nova_session='+token},body:JSON.stringify(body)});return {status:r.status,data:await r.json(),token:r.headers.get('set-cookie')?.match(/nova_session=([^;]+)/)?.[1]};};
 try{
 const visitor=(await post('login',{name:'visitor',password})).token,owner=(await post('login',{name:'owner',password})).token,shopper=(await post('login',{name:'shopper',password})).token;
 assert.equal((await post('illegal-market',{action:'buy',id:'lockpick'},shopper)).data.player.money,410);
 assert.equal((await post('inventory',{},shopper)).data.items.find(i=>i.id==='lockpick').quantity,1);
 assert.equal((await post('lockpick',{action:'start',type:'home',id:'azur'},owner)).status,400);
 assert.equal((await post('interior',{action:'enter',id:'azur'},visitor)).status,403);
 const start=await post('lockpick',{action:'start',type:'home',id:'azur'},visitor);assert.equal(start.data.stock,2);
 assert.equal((await post('lockpick',{action:'start',type:'home',id:'azur'},visitor)).status,409);assert.equal((await post('lockpick',{action:'finish'},visitor)).status,409);
 clock+=5001;assert.equal((await post('lockpick',{action:'finish'},visitor)).data.success,true);
 assert.equal((await post('interior',{action:'enter',id:'azur'},visitor)).status,200);await post('interior',{action:'exit'},visitor);
 assert.equal((await post('door',{},owner)).data.home.locked,true,'la serrure et la propriété du bail restent au locataire');
 clock+=30001;await post('lockpick',{action:'start',type:'vehicle',id:'locked-car'},visitor);clock+=5001;
 const picked=await post('lockpick',{action:'finish'},visitor);assert.ok(picked.data.player.vehicleAccess.includes('locked-car'));
 assert.equal((await post('vehicle',{},visitor)).data.player.vehicleId,'locked-car');await post('vehicle',{},visitor);
 assert.equal((await post('garage',{},owner)).data.garage.vehicles[0].ownerId,'owner');
 clock+=30001;roll=99;const failedStart=await post('lockpick',{action:'start',type:'vehicle',id:'locked-car'},visitor);assert.equal(failedStart.status,200);clock+=5001;assert.equal((await post('lockpick',{action:'finish'},visitor)).data.success,false);
 assert.equal((await post('inventory',{},visitor)).data.items.some(i=>i.id==='lockpick'),false);
 await post('logout',{},visitor);server.closeAllConnections();await new Promise(r=>server.close(r));clock+=86400000;
 server=createGameServer({dataFile:file,moderatorIds:[],lockpickOptions:{now:()=>clock,roll:()=>roll}});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;
 const back=await post('login',{name:'visitor',password});assert.ok(back.data.player.vehicleAccess.includes('locked-car'),'accès véhicule conservé après redémarrage');
 assert.equal((await post('interior',{action:'enter',id:'azur'},back.token)).status,200,'accès logement conservé après redémarrage');

 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
