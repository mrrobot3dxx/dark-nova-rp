import {test} from 'node:test';
import assert from 'node:assert/strict';
for(const source of ['./server.mjs','../nova-rp/server.mjs'])test('Démarrage : tous les modules importés sont servis, même avec une version URL '+source,async()=>{
 const {createGameServer}=await import(source);const server=createGameServer({dataFile:null,moderatorIds:[]});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 try{const html=await(await fetch(base+'/')).text(),entry=html.match(/<script[^>]+src="([^"]+)"/)[1],queue=[new URL(entry,base)],seen=new Set();
  while(queue.length){const url=queue.shift();if(seen.has(url.href))continue;seen.add(url.href);const response=await fetch(url);assert.equal(response.status,200,url.pathname+url.search);assert.match(response.headers.get('content-type'),/javascript/);const js=await response.text();for(const match of js.matchAll(/\bfrom\s*['"]([^'"]+)['"]/g)){const imported=new URL(match[1],url);if(imported.origin===base)queue.push(imported);}}
  assert.ok([...seen].some(url=>url.includes('harvest-buyer-world.js?v=')));assert.ok(seen.size>25);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
