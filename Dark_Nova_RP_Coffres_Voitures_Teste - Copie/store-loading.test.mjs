import {test} from 'node:test';
import assert from 'node:assert/strict';
import {setupIllegal} from './public/illegal.js';
test('Store : une requête bloquée expire et le bouton Actualiser reste utilisable',async t=>{
 const elements=new Map();class Element{constructor(){this.listeners={};this.children=[];this.open=false;this.disabled=false;this.dataset={};this.textContent='';}set innerHTML(value){this.html=value;}addEventListener(type,fn){this.listeners[type]=fn;}append(...items){this.children.push(...items);}after(){}replaceChildren(...items){this.children=items;}setAttribute(){}querySelectorAll(){return [];}showModal(){this.open=true;}close(){this.open=false;this.listeners.close?.();}}
 const saved=globalThis.document;globalThis.document={createElement:()=>new Element(),querySelector:()=>new Element(),body:new Element(),getElementById:id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);}};
 t.mock.timers.enable({apis:['setTimeout','setInterval']});let calls=0;const player={money:1000};
 const api=async()=>{calls++;if(calls===1)return new Promise(()=>{});return {player,market:{catalog:[],sellPrice:120},supplies:{},nearMarket:true,inTrade:true,crops:[],home:null};};
 try{const menu=setupIllegal({api,getMe:()=>player,setMe:()=>{},update:()=>{},keys:new Set(),touch:new Set(),toast:()=>{}});const pending=menu.openMarket();assert.equal(elements.get('refreshIllegal').disabled,true);t.mock.timers.tick(8001);await pending;assert.equal(elements.get('refreshIllegal').disabled,false);assert.match(elements.get('illegalMessage').textContent,/réponse tarde|Délai dépassé|Connexion trop lente/);await elements.get('refreshIllegal').listeners.click();assert.equal(calls,2);assert.equal(elements.get('refreshIllegal').disabled,false);assert.match(elements.get('illegalMessage').textContent,/Boutique prête/);menu.dialog.close();}finally{globalThis.document=saved;t.mock.timers.reset();}
});
