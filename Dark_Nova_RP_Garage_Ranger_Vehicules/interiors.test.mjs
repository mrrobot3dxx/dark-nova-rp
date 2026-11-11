import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scryptSync} from 'node:crypto';
import {createGameServer,interiorEntrances} from './server.mjs';
import {interiorPlan,interiorBlocked} from './public/interiors.js';

test('Intérieurs : villa publique, clés du logement, déplacements isolés et sortie',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'dark-nova-rooms-')),dataFile=join(dir,'accounts.json'),password='Interior-test-password-42',salt='rooms';
 const villaEntrance=interiorEntrances.find(e=>e.id==='villa-pins');assert.ok(villaEntrance);
 const common={salt,hash:scryptSync(password,salt,64).toString('hex'),color:'#c3f36a',money:500,job:false};
 await writeFile(dataFile,JSON.stringify([
 {...common,id:'owner',key:'owner',name:'Owner',x:230,y:320,home:{id:'azur',until:Date.now()+3600000}},
 {...common,id:'visitor',key:'visitor',name:'Visitor',x:230,y:320},
 {...common,id:'expired',key:'expired',name:'Expired',x:230,y:320,home:{id:'azur',until:Date.now()-1}},
 {...common,id:'villa',key:'villa',name:'Villa',x:villaEntrance.x,y:villaEntrance.y},
 {...common,id:'far',key:'far',name:'Far',x:455,y:355}
 ]));
 const server=createGameServer({dataFile});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const post=async(path,data={},token='')=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Cookie:'nova_session='+token},body:JSON.stringify(data)});return {status:r.status,data:await r.json(),token:r.headers.get('set-cookie')?.match(/nova_session=([^;]*)/)?.[1]};};
 try{
  for(const kind of ['home','villa']){const plan=interiorPlan(kind);assert.equal(interiorBlocked(kind,plan.spawn.x,plan.spawn.y),false);assert.ok(interiorBlocked(kind,0,0));for(const item of plan.items.filter(i=>!i.floor))assert.ok(interiorBlocked(kind,item.x+item.w/2,item.y+item.h/2));}
  const owner=await post('login',{name:'Owner',password}),visitor=await post('login',{name:'Visitor',password}),expired=await post('login',{name:'Expired',password}),villa=await post('login',{name:'Villa',password}),far=await post('login',{name:'Far',password});
  assert.equal((await post('interior',{action:'enter',id:'azur'},visitor.token)).status,403);
  assert.equal((await post('interior',{action:'enter',id:'azur'},expired.token)).status,403);
  assert.equal((await post('interior',{action:'enter',id:villaEntrance.id},far.token)).status,403);
  const entered=await post('interior',{action:'enter',id:'azur'},owner.token);assert.equal(entered.status,200);assert.equal(entered.data.player.interior.id,'azur');assert.equal(entered.data.player.x,230);
  await new Promise(r=>setTimeout(r,110));const move=await post('move',{dx:1,dy:0},owner.token);assert.ok(move.data.player.ix>entered.data.player.ix);assert.equal(move.data.player.x,230);assert.equal(move.data.player.y,320);
  assert.equal((await post('vehicle',{},owner.token)).status,400);assert.equal((await post('garage',{action:'rent',type:'car'},owner.token)).status,400);
  const out=await post('interior',{action:'exit'},owner.token);assert.equal(out.data.player.interior,null);assert.equal(out.data.player.x,230);assert.equal(out.data.player.y,320);
  const visit=await post('interior',{action:'enter',id:villaEntrance.id},villa.token);assert.equal(visit.status,200);assert.equal(visit.data.player.interior.kind,'villa');
  assert.equal((await fetch(base+'/interiors.js')).status,200);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
