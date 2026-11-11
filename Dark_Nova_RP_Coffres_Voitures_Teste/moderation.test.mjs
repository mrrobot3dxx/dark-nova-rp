import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scryptSync} from 'node:crypto';
import {createGameServer,employment,buildings,blocked} from './server.mjs';
test('Modération : permissions serveur, messages, silence et expulsion',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'nova-mod-')),file=join(dir,'accounts.json'),password='Moderation-test-42',salt='mod';
 await writeFile(file,JSON.stringify(['owner','guest'].map(key=>({key,id:key,name:key,salt,hash:scryptSync(password,salt,64).toString('hex'),x:455,y:355,money:250,job:false}))));
 const server=createGameServer({dataFile:file,moderatorIds:['owner']});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const post=async(path,body={},token='')=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Cookie:'nova_session='+token},body:JSON.stringify(body)});return {status:r.status,data:await r.json(),token:r.headers.get('set-cookie')?.match(/nova_session=([^;]+)/)?.[1]};};
 try{
 for(const id of ['police','firefighter']){const c=employment.careers.find(c=>c.id===id);assert.ok(c);assert.equal(blocked(c.x,c.y),false);}assert.ok(buildings.some(b=>b.name==='CASERNE DES POMPIERS'));
 const owner=await post('login',{name:'owner',password}),guest=await post('login',{name:'guest',password});assert.equal(owner.data.player.isModerator,true);assert.equal(guest.data.player.isModerator,false);
 assert.equal((await post('moderation',{action:'kick',id:'owner',isModerator:true},guest.token)).status,403);
 await post('chat',{text:'test'},guest.token);const list=await post('moderation',{},owner.token);assert.equal(list.data.messages.length,1);assert.equal('hash' in list.data.players[0],false);
 assert.equal((await post('moderation',{action:'deleteMessage',id:list.data.messages[0].id},owner.token)).data.messages.length,0);
 await post('voice',{action:'join'},guest.token);
 await post('moderation',{action:'mute',id:'guest'},owner.token);assert.equal((await post('voice',{action:'ping'},guest.token)).status,403);assert.equal((await post('voice',{action:'join'},guest.token)).status,403);assert.equal((await post('chat',{text:'blocked'},guest.token)).status,403);
 await post('moderation',{action:'unmute',id:'guest'},owner.token);assert.equal((await post('moderation',{},owner.token)).data.players.find(p=>p.id==='guest').mutedUntil,0);
 assert.equal((await post('moderation',{action:'kick',id:'owner'},owner.token)).status,403);
 assert.equal((await post('moderation',{action:'kick',id:'guest'},owner.token)).status,200);assert.equal((await post('session',{},guest.token)).status,401);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
