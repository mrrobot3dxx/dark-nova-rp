import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scryptSync} from 'node:crypto';
import {createGameServer} from './server.mjs';
test('Inventaire privé : objets réels, consommation et sauvegarde',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'nova-inventory-')),file=join(dir,'accounts.json'),password='Inventory-test-42',salt='inventory';
 await writeFile(file,JSON.stringify(['officer','civilian'].map(key=>({key,id:key,name:key,salt,hash:scryptSync(password,salt,64).toString('hex'),x:800,y:335,money:250,job:key==='civilian',career:key==='officer'?'police':null,policeWeapon:key==='officer',ammo:8}))));
 const server=createGameServer({dataFile:file,moderatorIds:[]});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const post=async(path,body={},token='')=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Cookie:'nova_session='+token},body:JSON.stringify(body)});return {status:r.status,data:await r.json(),token:r.headers.get('set-cookie')?.match(/nova_session=([^;]+)/)?.[1]};};
 try{
 assert.equal((await post('inventory')).status,401);const a=await post('login',{name:'officer',password}),b=await post('login',{name:'civilian',password});
 const inv=(await post('inventory',{},a.token)).data;assert.equal(inv.items.find(i=>i.id==='ammo').quantity,8);assert.ok(inv.items.find(i=>i.id==='service-weapon'));
 const other=(await post('inventory',{},b.token)).data;assert.ok(other.items.find(i=>i.id==='parcel'));assert.equal(other.items.some(i=>i.id==='service-weapon'),false);
 assert.equal((await post('inventory',{action:'use',id:'ammo'},a.token)).status,400);
 for(let i=0;i<2;i++)assert.equal((await post('inventory',{action:'use',id:'water',quantity:100},a.token)).status,200);
 assert.equal((await post('inventory',{action:'use',id:'water'},a.token)).status,409);
 assert.equal((await post('inventory',{},b.token)).data.items.find(i=>i.id==='water').quantity,2);
 const disk=JSON.parse(await readFile(file,'utf8'));assert.equal(disk[0].supplies.water,0);assert.equal(disk[0].ammo,8);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
