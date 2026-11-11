import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
for(const folder of ['.','../nova-rp'])test('Boutique pommes : délai, réponse invalide et reprise après erreur '+folder,async()=>{
 const nodes=new Map(),element=()=>({children:[],setAttribute(){},append(child){this.children.push(child);},replaceChildren(){this.children=[];},showModal(){this.open=true;},close(){this.open=false;},querySelector(s){if(!nodes.has(s))nodes.set(s,element());return nodes.get(s);}}),previous=globalThis.document;
 globalThis.document={createElement:element,body:element()};
 try{const source=await readFile(new URL(folder+'/public/nature-buyer.js',import.meta.url),'utf8'),{setupNatureBuyer}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));let mode='timeout',stock=2,money=100;const requests=[];
 const api=async(_,body)=>{requests.push(body);if(mode==='timeout')return new Promise(()=>{});if(mode==='invalid')return {};if(body.action){stock-=body.quantity;money+=15*body.quantity;}return {stock:{wood:0,apple:stock},prices:{wood:25,apple:15},player:{money},near:true};};
 const ui=setupNatureBuyer({api,getMe:()=>({}),setMe(){},update(){},keys:new Set(),touch:new Set(),toast(){},requestTimeoutMs:20});
 await ui.open();assert.match(nodes.get('[data-notice]').textContent,/réponse tarde/);assert.equal(nodes.get('[data-refresh]').disabled,false);
 mode='invalid';await nodes.get('[data-refresh]').onclick();assert.match(nodes.get('[data-notice]').textContent,/invalide/);assert.equal(nodes.get('[data-refresh]').disabled,false);
 mode='ok';await nodes.get('[data-refresh]').onclick();assert.equal(nodes.get('[data-actions]').children.length,4);await nodes.get('[data-actions]').children[2].onclick();assert.equal(stock,1);assert.equal(money,115);assert.match(nodes.get('[data-stock]').textContent,/Pommes : 1/);assert.equal(nodes.get('[data-refresh]').disabled,false);await nodes.get('[data-actions]').children[2].onclick();assert.equal(stock,0);assert.equal(money,130);await nodes.get('[data-refresh]').onclick();assert.match(nodes.get('[data-notice]').textContent,/Aucun stock à vendre/);assert.match(nodes.get('[data-actions]').children[2].textContent,/Aucun stock de pommes/);assert.equal(nodes.get('[data-actions]').children[2].disabled,true);const css=await readFile(new URL(folder+'/public/style.css',import.meta.url),'utf8');assert.ok(!css.includes('button:disabled{opacity:.55;cursor:wait}'));
 }finally{globalThis.document=previous;}
});
