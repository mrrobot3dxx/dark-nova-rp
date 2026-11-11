import {drawRoomFloor,drawFurnitureDetails} from './interior-visuals.js?v=graphics-2';
import {drawCharacter} from './characters.js?v=punch-1';
export function plantPosition(kind,index){const plan=interiorPlan(kind);return kind==='caravan'?{x:410+index*70,y:plan.height-130}:{x:plan.width/2-245+index*80,y:plan.height-105};}
export function printerPosition(kind){const plan=interiorPlan(kind);return kind==='caravan'?{x:130,y:plan.height-235,w:100,h:65}:{x:210,y:plan.height-260,w:100,h:65};}
// Shared geometry: the server and renderer use the same walls and furniture.
export function interiorPlan(kind){
 if(kind==='caravan')return {width:740,height:510,spawn:{x:370,y:445},items:[
  {x:34,y:34,w:672,h:440,color:'#d6c9aa',floor:true,label:'CARAVANE · ESPACE DE VIE'},
  {x:70,y:85,w:145,h:92,color:'#6d8a93',label:'BANQUETTE',sofa:true},
  {x:255,y:90,w:125,h:75,color:'#987a58',label:'TABLE'},
  {x:520,y:75,w:150,h:130,color:'#8797b2',label:'LIT',bed:true},
  {x:520,y:245,w:135,h:55,color:'#c4baa4',label:'CUISINE'},
  {x:80,y:260,w:75,h:55,color:'#8b795d',label:'RANGEMENT'}
 ]};
 if(kind==='police')return {width:1100,height:760,spawn:{x:550,y:690},items:[
 {x:30,y:30,w:610,h:700,color:'#b2bfc6',floor:true,label:'ACCUEIL & SALLE D’ATTENTE'},
 {x:670,y:30,w:400,h:320,color:'#92a9b5',floor:true,label:'BUREAU DES AGENTS'},
 {x:670,y:380,w:400,h:350,color:'#a3b2b9',floor:true,label:'SALLE D’AUDITION'},
 {x:645,y:20,w:15,h:250,color:'#435465',wall:true},{x:645,y:380,w:15,h:210,color:'#435465',wall:true},
 {x:675,y:360,w:210,h:14,color:'#435465',wall:true},
 {x:130,y:300,w:350,h:65,color:'#416580',label:'ACCUEIL POLICE'},
 {x:75,y:445,w:65,h:140,color:'#587388',label:'BANC',sofa:true},
 {x:210,y:450,w:65,h:140,color:'#587388',label:'BANC',sofa:true},
 {x:765,y:110,w:175,h:80,color:'#866f59',label:'BUREAU'},
 {x:1000,y:65,w:45,h:165,color:'#536676',label:'DOSSIERS'},
 {x:780,y:485,w:155,h:85,color:'#866f59',label:'TABLE'},
 {x:800,y:440,w:45,h:30,color:'#536676',label:'SIÈGE'},
 {x:800,y:585,w:45,h:30,color:'#536676',label:'SIÈGE'}]};

 const villa=kind==='villa',width=villa?1100:900,height=villa?760:620;
 const items=[
  {x:35,y:35,w:width*.54,h:height-70,color:'#bd9c77',floor:true,label:'SALON'},
  {x:width*.59,y:35,w:width*.37,h:height*.43,color:'#d7cbb5',floor:true,label:'CHAMBRE'},
  {x:width*.59,y:height*.55,w:width*.37,h:height*.39,color:'#a7bdb6',floor:true,label:'CUISINE & SALLE D’EAU'},
  {x:width*.57,y:20,w:14,h:height*.33,color:'#43505a',wall:true},
  {x:width*.57,y:height*.48,w:14,h:height*.33,color:'#43505a',wall:true},
  {x:width*.59,y:height*.51,w:width*.18,h:12,color:'#43505a',wall:true},
  {x:width*.88,y:height*.51,w:width*.1,h:12,color:'#43505a',wall:true},
  {x:80,y:110,w:75,h:165,color:'#526d7a',label:'CANAPÉ',sofa:true},
  {x:210,y:155,w:105,h:65,color:'#957356',label:'TABLE'},
  {x:width*.42,y:105,w:34,h:150,color:'#34404b',label:'TV'},
  {x:width*.70,y:85,w:width*.17,h:height*.27,color:'#7b8bb3',label:'LIT',bed:true},
  {x:width*.91,y:90,w:40,h:100,color:'#8f735a',label:'ARMOIRE'},
  {x:width*.63,y:height*.61,w:width*.24,h:45,color:'#e1d8c4',label:'CUISINE'},
  {x:width*.89,y:height*.62,w:46,h:62,color:'#dce6e5',label:'FRIGO'},
  {x:width*.65,y:height*.81,w:90,h:45,color:'#e2ece9',label:'BAIGNOIRE'},
  {x:95,y:height-150,w:55,h:55,color:'#5d8a60',label:'DÉCOR',plant:true}
 ];
 if(villa)items.push({x:245,y:400,w:170,h:95,color:'#967355',label:'SALLE À MANGER'});
 return {width,height,spawn:{x:width/2,y:height-65},items};
}
export function interiorBlocked(kind,x,y){const plan=interiorPlan(kind),r=13;return x<32||y<32||x>plan.width-32||y>plan.height-32||plan.items.some(o=>!o.floor&&x>o.x-r&&x<o.x+o.w+r&&y>o.y-r&&y<o.y+o.h+r);}

export function drawInterior(ctx,w,h,me,players){
 const plan=interiorPlan(me.interior.kind),scale=Math.min(1.1,Math.max(.72,w/1000)),cx=Math.max(0,Math.min(plan.width-w/scale,me.ix-w/scale/2)),cy=Math.max(0,Math.min(plan.height-h/scale,me.iy-h/scale/2));
 const box=(x,y,bw,bh,color,r=0)=>{ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,bw,bh,r);ctx.fill();};
 const label=(s,x,y,size=12,color='#fff')=>{ctx.font=`700 ${size}px system-ui`;ctx.fillStyle=color;ctx.textAlign='center';ctx.fillText(s,x,y);};
 box(0,0,w,h,'#18212b');ctx.save();ctx.scale(scale,scale);ctx.translate(-cx,-cy);box(12,12,plan.width-24,plan.height-24,'#e5dac6',10);
 for(const o of plan.items.filter(o=>o.floor)){drawRoomFloor(ctx,o,me.interior.kind);label(o.label,o.x+o.w/2,o.y+o.h-20,11,'#3d4b47');}
 if(me.interior.kind!=='police'){box(175,100,180,190,'#ddc6a3',8);box(187,112,156,166,'#a8a58a',7);}else{label('POLICE · DARK NOVA',320,150,24,'#294d6b');}
 for(const o of plan.items.filter(o=>!o.floor)){box(o.x+4,o.y+5,o.w,o.h,'#0002',5);box(o.x,o.y,o.w,o.h,o.color,o.wall?0:5);if(o.bed){box(o.x+8,o.y+10,o.w-16,35,'#f1eddd',5);box(o.x+6,o.y+60,o.w-12,o.h-67,'#9cabcd',4);}if(o.sofa){for(let i=0;i<3;i++)box(o.x+10,o.y+12+i*47,o.w-18,37,'#89a2ad',5);}drawFurnitureDetails(ctx,o);if(o.plant){label('✿',o.x+o.w/2,o.y+o.h/2+10,37,'#b3d48b');label('DÉCOR',o.x+o.w/2,o.y+o.h+14,9,'#405247');}else if(!o.wall)label(o.label,o.x+o.w/2,o.y+o.h/2+4,9);}
 for(const x of [110,plan.width*.74]){box(x,12,110,12,'#77b4ce',3);box(x+52,12,5,12,'#e9efe3');}
 box(plan.width/2-46,plan.height-28,92,16,'#d4b377',4);label('SORTIE · B',plan.width/2,plan.height-40,12,'#34483e');
 if(me.interiorEquipment?.some(e=>e.type==='printer')){
 const q=printerPosition(me.interior.kind),x=q.x,y=q.y;
 box(x-8,y+13,116,67,'#725c48',5);box(x+2,y+75,8,20,'#503f34',2);box(x+90,y+75,8,20,'#503f34',2);
 box(x+8,y-15,83,50,'#edf0e5',4);box(x+16,y-8,65,3,'#abb8af');box(x,y+14,100,45,'#354450',8);box(x+7,y+19,86,12,'#5d7280',3);
 box(x+18,y+40,63,27,'#a9d496',2);box(x+25,y+48,48,3,'#4d794c');box(x+25,y+56,28,3,'#4d794c');box(x+79,y+23,7,6,'#c3f36a',2);
 label('IMPRIMANTE',x+50,y-34,12,'#283e3a');label('Gérer · E',x+50,y+113,11,'#283e3a');
 }
 const plants=(me.interiorEquipment||[]).filter(e=>e.type==='plant');
 for(let index=0;index<plants.length;index++){const {x,y}=plantPosition(me.interior.kind,index),ready=plants[index].readyAt<=Date.now();box(x-16,y+10,32,30,'#ad7555',4);box(x-20,y+6,40,9,'#c4926c',3);box(x-3,y-30,6,39,'#426d40',2);box(x-27,y-16,25,12,'#67a462',6);box(x+2,y-31,25,12,'#7db469',6);if(ready)box(x-10,y-49,20,18,'#afd38b',8);label(ready?'RÉCOLTE PRÊTE':'EN CROISSANCE',x,y+59,10,'#334c36');if(index===0&&plants[index].canManage&&plants.some((plant,i)=>{const q=plantPosition(me.interior.kind,i);return plant.canManage&&Math.hypot(me.ix-q.x,me.iy-q.y)<=160;})){box(x-70,y-90,140,29,'#c3f36a',6);label('E · GÉRER LA PLANTE',x,y-70,11,'#24371d');}}
 for(const p of players.filter(p=>p.interior?.id===me.interior.id)){drawCharacter(ctx,p,p.ix,p.iy);if(p.cuffed)label('🔗',p.ix,p.iy-61,15,'#ffe2ae');label(p.name,p.ix,p.iy-40,11,p.id===me.id?'#d7ff90':'#fff');}
 ctx.restore();box(16,85,Math.min(w-32,340),36,'#17232bed',7);label(me.interior.name,16+Math.min(w-32,340)/2,108,12,'#f4dfb6');
}
