import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
for(const folder of ['.','../nova-rp'])test('Cueillir ajoute automatiquement la pomme sans second clic '+folder,async()=>{
 const elements=new Map();const element=()=>({textContent:'',disabled:false,hidden:false,open:false,listeners:{},addEventListener(event,fn){this.listeners[event]=fn;},append(){},showModal(){this.open=true;},close(){this.open=false;this.listeners.close?.();}});
 const previous=globalThis.document;globalThis.document={createElement:element,getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id);},body:element(),querySelector:element};
 let interval,stock=0;const calls=[],notices=[];
 try{
  let source=await readFile(new URL(folder+'/public/nature.js',import.meta.url),'utf8');source=source.replace("import {nature,nearNature} from './nature-world.js';","const nearNature=()=>({id:'apple-1',type:'apple'});");
  const {setupNature}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  const api=async(_,body)=>{calls.push(body.action);if(body.action==='finish')stock++;return {stock:{axe:0,wood:0,apple:stock},near:{type:'apple'},attempt:body.action==='start'?{readyAt:Date.now()+30}:null,serverTime:Date.now(),message:body.action==='finish'?'+1 pomme ajoutée à ton inventaire.':''};};
  const ui=setupNature({api,getMe:()=>({}),keys:new Set(),touch:new Set(),toast:m=>notices.push(m)});
  await ui.open();await elements.get('startNature').listeners.click();
  await new Promise(r=>setTimeout(r,450));
  assert.deepEqual(calls,[undefined,'start','finish']);assert.equal(stock,1);assert.match(elements.get('natureStock').textContent,/Pommes : 1/);assert.equal(notices.length,1);assert.equal(elements.get('finishNature').hidden,true);ui.dialog.close();
 }finally{globalThis.document=previous;}
});
