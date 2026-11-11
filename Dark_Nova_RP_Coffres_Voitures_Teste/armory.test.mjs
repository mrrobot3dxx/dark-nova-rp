import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scryptSync} from 'node:crypto';
import {createGameServer,blocked} from './server.mjs';
test('Armurerie : policiers seulement, proximité, cartouches et restitution',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'nova-armory-')),file=join(dir,'accounts.json'),password='Armory-test-42',salt='armory';
 await writeFile(file,JSON.stringify(['officer','civilian','remote'].map(key=>({key,id:key,name:key,salt,hash:scryptSync(password,salt,64).toString('hex'),x:key==='remote'?455:800,y:335,money:250,job:false,career:key==='civilian'?'gardener':'police'}))));
 const server=createGameServer({dataFile:file,moderatorIds:[]});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const post=async(path,body={},token='')=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Cookie:'nova_session='+token},body:JSON.stringify(body)});return {status:r.status,data:await r.json(),token:r.headers.get('set-cookie')?.match(/nova_session=([^;]+)/)?.[1]};};
 try{assert.equal(blocked(800,335),false);const a=await post('login',{name:'officer',password}),b=await post('login',{name:'civilian',password}),c=await post('login',{name:'remote',password});
 assert.equal((await post('armory',{action:'equip'},b.token)).status,403);assert.equal((await post('armory',{action:'equip'},c.token)).status,400);assert.equal((await post('fire',{},a.token)).status,403);
 const equipped=await post('armory',{action:'equip',ammo:999},a.token);assert.equal(equipped.data.player.ammo,12);assert.equal(equipped.data.player.policeWeapon,true);
 assert.equal((await post('fire',{},a.token)).data.player.ammo,11);assert.equal((await post('fire',{},a.token)).status,429);
 assert.equal((await post('armory',{action:'return'},a.token)).data.player.policeWeapon,false);assert.equal((await post('fire',{},a.token)).status,403);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
