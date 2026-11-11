import {drawCharacter} from './characters.js?v=people-1';
export const bakery={name:'Nora · Boulangerie',x:2070,y:2020,radius:80,catalog:[
 {id:'bread',name:'Pain',icon:'🥖',price:8,description:'Restaure 25 de nourriture.'},
 {id:'croissant',name:'Croissant',icon:'🥐',price:12,description:'Restaure 30 de nourriture.'},
 {id:'sandwich',name:'Sandwich',icon:'🥪',price:25,description:'Restaure 60 de nourriture et 5 de vie.'},
 {id:'water',name:'Bouteille d’eau',icon:'💧',price:10,description:'Restaure 40 d’hydratation.'},
 {id:'juice',name:'Jus de pommes',icon:'🧃',price:15,description:'Restaure 35 d’hydratation et 10 de nourriture.'}
]};
export const nearBakery=p=>!!(p&&!p.interior&&!p.vehicleId&&Math.hypot(p.x-bakery.x,p.y-bakery.y)<=bakery.radius);
export function drawBaker(ctx,me){const {x,y}=bakery;ctx.save();const box=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.roundRect(x,y,w,h,3);ctx.fill();};drawCharacter(ctx,{outfit:{style:'polo',color:'#b1846b',pants:'#454e5c',shoes:'#423e3a'},hair:'#5f4637',hairStyle:'bun'},x,y);box(x-7,y-10,14,26,'#e4d7bd');box(x-5,y+3,10,5,'#c0ad8f');box(x-9,y-42,18,8,'#f2e8d2');box(x-11,y-36,22,3,'#ddd6bf');box(x+19,y+8,30,12,'#d3a158');box(x-108,y-70,216,25,'#352b23ee');ctx.textAlign='center';ctx.font='bold 11px system-ui';ctx.fillStyle='#ffe3b2';ctx.fillText('NORA · PAINS & BOISSONS',x,y-54);if(nearBakery(me))ctx.fillText('ACHETER · E',x,y+49);ctx.restore();}
