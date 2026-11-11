import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGameServer} from './server.mjs';
test('Vocal : session, salon, signal ciblé, modération et départ',async()=>{
 const server=createGameServer({dataFile:null,moderatorIds:[]});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;let reader;
 const post=async(path,body={},token='')=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Cookie:'nova_session='+token},body:JSON.stringify(body)});return {status:r.status,data:await r.json(),token:r.headers.get('set-cookie')?.match(/nova_session=([^;]+)/)?.[1]};};
 try{
 assert.equal((await post('voice',{action:'join'})).status,401);
 const a=await post('register',{name:'speakerA',email:'a@example.test',password:'Voice-test-42'}),b=await post('register',{name:'speakerB',email:'b@example.test',password:'Voice-test-42'});
 assert.equal((await post('voice',{action:'signal',to:b.data.player.id,signal:{type:'offer',sdp:'test'}},a.token)).status,403);
 await post('voice',{action:'join'},a.token);assert.equal((await post('voice',{action:'join'},b.token)).data.members.length,2);
 const events=await fetch(base+'/events',{headers:{Cookie:'nova_session='+b.token}});reader=events.body.getReader();const first=new TextDecoder().decode((await reader.read()).value);assert.ok(first.includes('"voice":'));assert.ok(!first.includes(a.token));
 const signal=await post('voice',{action:'signal',to:b.data.player.id,from:'forged',signal:{type:'offer',sdp:'test-sdp'}},a.token);assert.equal(signal.status,200);
 const event=new TextDecoder().decode((await reader.read()).value);assert.ok(event.includes('event: voice-signal'));assert.ok(event.includes(a.data.player.id));assert.ok(event.includes('test-sdp'));assert.ok(!event.includes('forged'));
 assert.equal((await post('voice',{action:'signal',to:b.data.player.id,signal:{type:'bad'}},a.token)).status,400);
 assert.equal((await post('voice',{action:'signal',to:a.data.player.id,signal:{type:'offer',sdp:'x'}},a.token)).status,404);
 await post('voice',{action:'leave'},b.token);assert.equal((await post('voice',{action:'signal',to:b.data.player.id,signal:{type:'offer',sdp:'x'}},a.token)).status,404);
 assert.equal((await post('voice',{action:'ping'},b.token)).status,403);
 await post('logout',{},a.token);assert.equal((await post('voice',{action:'join'},b.token)).data.members.length,1);
 assert.equal((await fetch(base+'/voice.js')).status,200);
 }finally{await reader?.cancel();server.closeAllConnections();await new Promise(r=>server.close(r));}
});
