import {test} from 'node:test';
import assert from 'node:assert/strict';
for(const source of ['./public/garage.js','../nova-rp/public/garage.js'])test('Garage : ouverture immédiate, délai et actualisation · '+source,async t=>{
 const {setupGarage}=await import(source),elements=new Map();class Element{constructor(tag='div'){this.tag=tag;this.listeners={};this.children=[];this.open=false;this.disabled=false;this.textContent='';}set innerHTML(v){}addEventListener(type,fn){this.listeners[type]=fn;}append(...items){this.children.push(...items);}replaceChildren(...items){this.children=items;}querySelectorAll(tag){return this.children.flatMap(c=>[...(c.tag===tag?[c]:[]),...c.querySelectorAll(tag)]);}showModal(){this.open=true;}close(){this.open=false;}}
 const previous=globalThis.document;globalThis.document={createElement:tag=>new Element(tag),querySelector:()=>new Element(),body:new Element(),getElementById:id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);}};t.mock.timers.enable({apis:['setTimeout']});let calls=0,player={x:455,y:520,money:250,vehicleId:null};
 const api=async()=>{if(++calls===1)return new Promise(()=>{});return {player,garage:{money:250,rentalMinutes:10,vehicles:[],catalog:[{type:'car',name:'Citadine',rent:120,buy:1500}]}};};
 try{
 const ui=setupGarage({api,getMe:()=>player,setMe:p=>{player=p;},update:()=>{},keys:new Set(),touch:new Set(),toast:()=>{},getInfo:()=>({x:455,y:520,radius:95})});
 const pending=ui.openGarage();assert.equal(ui.garageDialog.open,true,'le menu apparaît avant la réponse réseau');assert.match(elements.get('garageCatalog').textContent,/Chargement/);t.mock.timers.tick(8001);await pending;
 assert.match(elements.get('garageMessage').textContent,/réponse tarde/);assert.equal(elements.get('refreshGarage').disabled,false);
 await elements.get('refreshGarage').listeners.click();assert.equal(elements.get('garageCatalog').children.length,1);const actions=elements.get('garageCatalog').children[0].children.at(-1).children;assert.equal(actions[0].disabled,false,'location disponible sur place');assert.equal(actions[1].disabled,true,'achat impossible avec solde insuffisant');
 ui.garageDialog.close();player={...player,x:2000,y:2000};await ui.openGarage();assert.equal(ui.garageDialog.open,true);assert.match(elements.get('garageHint').textContent,/Sam.*Garage Nova.*Léo.*Garage Central/);assert.equal(elements.get('garageCatalog').children[0].children.at(-1).children[0].disabled,true);
 }finally{globalThis.document=previous;t.mock.timers.reset();}
});
