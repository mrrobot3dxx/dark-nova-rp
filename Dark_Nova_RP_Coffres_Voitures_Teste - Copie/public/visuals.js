import {caravanCamp} from './caravan-camp-world.js';
// Canvas artwork is generated once, then reused. Geometry stays server-owned.
const patterns=new WeakMap(),sprites=new Map();
const TAU=Math.PI*2;
function box(c,x,y,w,h,color,r=0){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
function oval(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();}
function gradient(c,x,y,w,h,a,b){const g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,a);g.addColorStop(1,b);return g;}
function texture(c,kind){let cache=patterns.get(c);if(!cache){cache=new Map();patterns.set(c,cache);}if(cache.has(kind))return cache.get(kind);const tile=document.createElement('canvas');tile.width=tile.height=128;const t=tile.getContext('2d');t.fillStyle={grass:'#809571',asphalt:'#4a5960',paving:'#c4c3ad'}[kind];t.fillRect(0,0,128,128);let seed=471;
 for(let i=0;i<650;i++){seed=seed*16807%2147483647;const x=seed%128;seed=seed*16807%2147483647;const y=seed%128;t.fillStyle=i%2?'#f0f1d315':'#0d29251b';t.fillRect(x,y,kind==='grass'?2:1,1);}
 if(kind==='paving'){t.strokeStyle='#6c79632b';t.lineWidth=1;for(let i=0;i<=128;i+=32){t.beginPath();t.moveTo(i,0);t.lineTo(i,128);t.moveTo(0,i);t.lineTo(128,i);t.stroke();}}
 if(kind==='grass'){for(let i=0;i<24;i++){const x=i*43%128,y=i*71%128;t.fillStyle='#38634636';t.fillRect(x,y,1,3);t.fillRect(x+2,y-1,1,4);}for(let i=0;i<5;i++){t.fillStyle='#dfd6a24a';t.fillRect(i*27,i*47%128,2,2);}}
 const result=c.createPattern(tile,'repeat');cache.set(kind,result);return result;}
export function drawGround(c,world){c.fillStyle=texture(c,'grass');c.fillRect(0,0,world.width,world.height);}
export function drawTree(c,x,y,s=21){c.save();oval(c,x+11,y+19,s*1.28,s*.51,'#17332a30');oval(c,x+6,y+12,s*.8,s*.32,'#17332a24');box(c,x-4,y-2,8,24,'#66503d',3);box(c,x-2,y,2,19,'#b99a67',1);
 const crown=gradient(c,x-s,y-s*1.6,s*1.8,s*1.9,'#8fa85c','#235448');oval(c,x+3,y-7,s,s*.9,'#244c3d');oval(c,x-4,y-15,s,s*.84,crown);oval(c,x-s*.52,y-s*.82,s*.6,s*.6,'#6b9858');oval(c,x+s*.5,y-s*.72,s*.63,s*.61,'#467b50');oval(c,x-s*.15,y-s*1.25,s*.61,s*.51,'#94af69');
 for(let i=0;i<11;i++){const a=i*2.399,r=s*(.3+(i%3)*.17);oval(c,x+Math.cos(a)*r-3,y-15+Math.sin(a)*r,s*.13,s*.08,i%3?'#bed28b42':'#dbe3a36b');}c.restore();}
export function drawStreetDetails(c,view,world){c.save();const {x,y,w,h}=view,asphalt=texture(c,'asphalt'),paving=texture(c,'paving');const roads=[];for(let road=455;road<world.width;road+=920)if(road>x-100&&road<x+w+100)roads.push(road);const cross=[];for(const road of [354,...Array.from({length:Math.ceil(world.height/360)-1},(_,i)=>710+i*360)])if(road>y-100&&road<y+h+100)cross.push(road);
 for(const road of roads){box(c,road-80,y,23,h,paving);box(c,road+57,y,23,h,paving);box(c,road-57,y,114,h,asphalt);box(c,road-58,y,2,h,'#e4dfc9');box(c,road+56,y,2,h,'#d5d2bd');c.strokeStyle='#f0dfacb0';c.lineWidth=2;c.setLineDash([14,20]);c.beginPath();c.moveTo(road,y);c.lineTo(road,y+h);c.stroke();c.setLineDash([]);}
 for(const road of cross){box(c,x,road-62,w,21,paving);box(c,x,road+41,w,21,paving);box(c,x,road-41,w,82,asphalt);box(c,x,road-42,w,2,'#e0dac7');box(c,x,road+40,w,2,'#d7d3bf');c.strokeStyle='#e8dbb9ad';c.lineWidth=2;c.setLineDash([18,24]);c.beginPath();c.moveTo(x,road);c.lineTo(x+w,road);c.stroke();c.setLineDash([]);}
 for(const rx of roads)for(const ry of cross){box(c,rx-57,ry-62,114,124,asphalt);box(c,rx-80,ry-41,160,82,asphalt);for(let i=-43;i<=43;i+=16){box(c,rx+i,ry-58,9,14,'#e8e5cf',1);box(c,rx+i,ry+44,9,14,'#e8e5cf',1);}for(let i=-30;i<=30;i+=15){box(c,rx-76,ry+i,14,8,'#e8e5cf',1);box(c,rx+62,ry+i,14,8,'#e8e5cf',1);}for(const sx of [-1,1])for(const sy of [-1,1]){box(c,rx+sx*70-8,ry+sy*53-6,16,12,paving,3);box(c,rx+sx*74-3,ry+sy*56-3,6,6,'#cab67c',2);}}
 for(const road of roads)for(let yy=Math.floor(y/180)*180+95;yy<y+h+45;yy+=180){if(cross.some(ry=>Math.abs(yy-ry)<80))continue;for(const side of [-70,70]){oval(c,road+side+7,yy+12,8,4,'#19302b25');box(c,road+side-2,yy-13,4,30,'#42524e',2);box(c,road+side-8,yy-19,16,7,'#d9d8bc',3);box(c,road+side-5,yy-17,10,2,'#fff8cd',1);box(c,road+side-5,yy+15,10,3,'#59675e',2);}}
 c.restore();}
export function buildingStyle(name){if(/GARAGE/.test(name))return 'garage';if(/BOULANGERIE|CAFÉ|MARCHÉ|STYLE|ARCADES/.test(name))return 'shop';if(/HÔPITAL/.test(name))return 'hospital';if(/COMMISSARIAT|POMPIERS/.test(name))return 'service';if(/RÉSIDENCE|MAISON|VILLA|LILAS|JARDINS BLEUS|LOFT/.test(name))return 'home';return 'civic';}
function buildingArt(c,b){const {w,h,name,color}=b,type=buildingStyle(name),accent=type==='hospital'?'#77c8ba':type==='garage'?'#efc987':type==='shop'?'#e2ae91':type==='home'?'#b7c9a0':'#a0c6d2';
 c.save();c.fillStyle='#122d2c28';c.beginPath();c.moveTo(7,7);c.lineTo(w+23,20);c.lineTo(w+23,h+26);c.lineTo(19,h+26);c.closePath();c.fill();box(c,3,h-5,w+8,16,'#203c3b3b',4);box(c,0,0,w,h,'#465859',8);box(c,0,0,w,h-9,color,8);box(c,w-8,5,8,h-10,'#17303548',3);
 const roofH=Math.max(48,h-88);box(c,7,7,w-14,roofH,gradient(c,7,7,w-14,roofH,'#6b7c7b','#3b5157'),5);box(c,12,12,w-24,roofH-10,type==='home'?'#627477':'#596c70',4);box(c,11,10,w-22,3,'#d0d8c76b',1);box(c,11,roofH+1,w-22,5,'#1a30394d',1);
 if(type==='home'){for(let yy=20;yy<roofH;yy+=13){box(c,17,yy,w-34,1,'#c5d2cb23');for(let xx=25+(yy%2)*12;xx<w-20;xx+=30)box(c,xx,yy,1,12,'#203e3a24');}box(c,32,22,36,30,'#334a52',3);box(c,36,25,28,21,gradient(c,36,25,28,21,'#a7d5d6','#497284'),2);box(c,49,25,2,21,'#c6d7cd');box(c,w-52,19,22,27,'#a08b75',2);box(c,w-50,15,24,7,'#c3b496',2);}
 else{for(let yy=23;yy<roofH-10;yy+=22)box(c,20,yy,w-40,1,'#b9d1cf21');box(c,26,22,52,31,'#30474e',4);box(c,29,20,48,28,'#aab8b2',3);for(let i=0;i<6;i++)box(c,34,24+i*3,35,1,'#566e70');oval(c,63,34,9,9,'#718987');oval(c,63,34,3,3,'#c0cdc1');box(c,w-79,20,50,28,'#2e4951',3);box(c,w-75,23,42,19,gradient(c,w-75,23,42,19,'#8fd0d8','#315a6b'),2);box(c,w-54,23,2,19,'#c9e5df');}
 const frontY=roofH+8;box(c,7,frontY,w-14,h-frontY-6,gradient(c,0,frontY,0,h-frontY,'#ffffff12','#122c394d'),2);for(let yy=frontY+8;yy<h-12;yy+=12){box(c,10,yy,w-20,1,'#f0ead215');for(let xx=15+yy%24;xx<w-12;xx+=38)box(c,xx,yy,1,12,'#142e3820');}
 if(type==='garage'){for(const xx of [20,w/2+8]){const bw=w/2-30;box(c,xx,h-61,bw,49,'#223d48',3);box(c,xx+3,h-57,bw-6,41,'#8d9e98',2);for(let yy=h-53;yy<h-16;yy+=6)box(c,xx+4,yy,bw-8,1,'#4f6d70');box(c,xx+bw/2-8,h-25,16,3,'#324e58',1);}box(c,17,h-87,w-34,22,'#1b3441',3);}
 else{const doorX=w/2-20;for(const xx of [22,w-70]){box(c,xx,h-56,48,39,'#26444f',3);box(c,xx+4,h-52,40,30,gradient(c,xx,h-54,40,30,'#9fd2d8','#31586a'),2);box(c,xx+8,h-51,3,24,'#f8f0d279',1);box(c,xx+23,h-53,2,31,'#b2c5ba');box(c,xx-2,h-19,52,4,'#d9d4bd',1);}box(c,doorX,h-52,40,47,'#233f48',3);box(c,doorX+5,h-48,30,39,gradient(c,doorX,h-50,30,39,'#8bbbc4','#2f5364'),2);box(c,doorX+19,h-48,2,39,'#d4dfd2');box(c,doorX+28,h-28,2,8,'#efddb3',1);box(c,doorX-5,h-5,50,6,'#d9d3bd',2);}
 if(type==='shop'){for(let i=0;i<Math.ceil((w-28)/18);i++){const xx=14+i*18,bw=Math.min(18,w-14-xx);box(c,xx,h-82,bw,14,i%2?accent:'#eee6d1',2);oval(c,xx+bw/2,h-67,bw/2,3,i%2?accent:'#eee6d1');}box(c,15,h-105,w-30,22,'#20383f',3);}
 const signY=type==='shop'?h-105:type==='garage'?h-87:roofH-18;box(c,18,signY,w-36,24,'#19323bea',4);box(c,20,signY,w-40,2,accent,1);c.textAlign='center';c.font='700 10px system-ui';c.fillStyle='#f0f0dd';c.fillText(name,w/2,signY+16,w-48);
 if(type==='hospital'){box(c,w-46,28,9,29,'#a7e0cf',1);box(c,w-56,38,29,9,'#a7e0cf',1);}if(type==='home'){box(c,21,h-12,24,10,'#8b6f56',2);oval(c,28,h-14,8,5,'#54805b');oval(c,38,h-14,7,6,'#7b9b61');}
 box(c,7,h-8,w-14,3,'#e0dfcb70',1);c.restore();}
export function drawBuilding(c,b){const key=[b.name,b.w,b.h,b.color].join('|');let sprite=sprites.get(key);if(!sprite){sprite=document.createElement('canvas');sprite.width=b.w+64;sprite.height=b.h+64;const s=sprite.getContext('2d');s.translate(20,15);buildingArt(s,b);sprites.set(key,sprite);}c.drawImage(sprite,b.x-20,b.y-15);}
export function polishVehicle(c,v){c.save();if(['car','policecar','firetruck'].includes(v.type)){const truck=v.type==='firetruck',half=truck?20:15,front=truck?-40:-28,rear=truck?40:28;
 box(c,-half+2,front+4,2,rear-front-9,'#ffffff63',1);box(c,half-4,front+5,2,rear-front-11,'#0d20304a',1);box(c,-half+4,front+6,half*2-8,4,'#ffffff23',2);box(c,-half+3,rear-5,half*2-6,2,'#253840',1);
 if(!truck){box(c,-9,-14,18,9,gradient(c,-9,-14,18,9,'#a9dce0','#426c81'),2);box(c,-7,-12,3,5,'#e0f3e17a',1);box(c,-9,11,18,7,gradient(c,-9,11,18,7,'#5f92a2','#263f50'),2);box(c,-7,-1,14,10,'#ffffff13',3);box(c,-17,-8,4,7,v.color,2);box(c,13,-8,4,7,v.color,2);}
 for(const side of [-1,1]){box(c,side<0?-half+3:half-9,front+1,6,3,'#fff2c1',1);box(c,side<0?-half+3:half-8,rear-3,5,3,'#d97564',1);}if((v.health??100)<45){c.strokeStyle='#463f39a0';c.lineWidth=1.4;c.beginPath();c.moveTo(-5,front+7);c.lineTo(2,front+13);c.lineTo(-1,front+17);c.moveTo(half-6,4);c.lineTo(half-10,10);c.stroke();}
 }else{box(c,-3,-16,2,19,'#f0f3d968',1);box(c,-10,-12,20,2,'#c4d3cf',1);if(v.type==='scooter'){box(c,-6,-16,12,6,gradient(c,-6,-16,12,6,'#b0dbe1','#577d93'),3);box(c,-5,7,10,11,'#253c4c',3);}if(v.type==='quad'){for(const xx of [-18,11])for(const yy of [-18,11])box(c,xx,yy,5,1,'#d9e1d348');}}
 c.restore();}


// Decorative city furniture has no collision or economic state.
// Stable layout and bounded chunk cache keep the expanded city inexpensive to draw.
export function cityDetails(world, buildings){
 const items=[];
 const roadOverlap=(x,y,rx,ry)=>{for(let r=455;r<world.width;r+=920)if(Math.abs(x-r)<57+rx)return true;for(const r of [354,...Array.from({length:Math.ceil(world.height/360)-1},(_,i)=>710+i*360)])if(Math.abs(y-r)<41+ry)return true;return false;};
 const add=(kind,x,y,variant=0)=>{if(x>caravanCamp.x-150&&x<caravanCamp.x+caravanCamp.w+100&&y>caravanCamp.y-110&&y<caravanCamp.y+caravanCamp.h+100)return;const [rx,ry]=({parking:[107,30],terrace:[35,48],garden:[112,48],park:[130,100],square:[130,100],bench:[26,20],bin:[10,14],planter:[20,17],entry:[35,35],flag:[25,48],tyres:[25,16]})[kind];if(!roadOverlap(x,y,rx,ry))items.push({kind,x,y,variant});};
 const safe=(x,y,r=95)=>x>35&&y>35&&x<world.width-35&&y<world.height-35&&buildings.every(b=>x<b.x-r||x>b.x+b.w+r||y<b.y-r||y>b.y+b.h+r);
 for(const b of buildings){
  add('entry',b.x+b.w/2,b.y+b.h+8);
  for(const side of [-1,1]){const x=b.x+(side<0?24:b.w-24);add('planter',x,b.y+b.h+19,side);}
  if(/CAFÉ|BOULANGERIE/.test(b.name))for(const dy of [60,130])add('terrace',b.x-48,b.y+dy);
  if(/GARAGE/.test(b.name)){add('parking',b.x+b.w/2,b.y-95);add('tyres',b.x+b.w-17,b.y+b.h+34);}
  if(/HÔPITAL|COMMISSARIAT|MAIRIE|POMPIERS/.test(b.name))add('flag',b.x+15,b.y-15);
  if(/RÉSIDENCE|VILLA|MAISON|LILAS|LOFT/.test(b.name))add('garden',b.x+b.w/2,b.y-48);
 }
 for(let col=0;col<Math.ceil(world.width/920);col++)for(let row=0;row<Math.ceil(world.height/360);row++){
  const x=455+col*920,y=row===0?354:350+row*360;
  // Roadside objects leave crossings and the central driving lanes clear.
  for(const side of [-1,1]){const px=x+side*70,py=y-116;if(safe(px,py,35)){add('bench',px,py,col%2);add('bin',px,py+34);}}
  const cx=col*920+220,cy=row*360+165;
  // Preserve the original service hub, harvesting grove and public garden.
  if(cx<1850&&cy<1450||cx>1850&&cx<2700&&cy>1080&&cy<1400)continue;
  if(safe(cx,cy,165)){add((col+row)%3===0?'square':'park',cx,cy,(col+row)%4);}
 }
 return items;
}
function streetObject(c,o){const {kind,x,y,variant}=o;c.save();c.translate(x,y);
 if(kind==='entry'){box(c,-34,-3,68,34,'#d3ccaf',3);for(let i=-30;i<34;i+=12)box(c,i,0,1,28,'#8f9d8960');box(c,-23,7,46,2,'#f4e9c057');}
 if(kind==='planter'){oval(c,5,9,21,8,'#1b382b25');box(c,-17,-5,34,17,'#ac967a',3);box(c,-15,-7,30,9,'#493d32',2);for(let i=-10;i<=10;i+=10){oval(c,i,-9,8,7,'#51805a');oval(c,i-2,-13,4,3,variant<0?'#e6c3bd':'#dbc276');}}
 if(kind==='bench'){oval(c,7,12,24,8,'#1e382b25');for(const xx of [-17,15])box(c,xx,-3,3,20,'#3d5552',1);for(let yy=-9;yy<=7;yy+=5)box(c,-23,yy,46,3,'#aa8056',1);box(c,-25,-12,4,22,'#455d54',1);box(c,21,-12,4,22,'#455d54',1);}
 if(kind==='bin'){oval(c,3,9,10,5,'#16392c30');box(c,-7,-8,14,20,'#536d61',3);box(c,-9,-10,18,5,'#2c4945',2);box(c,-4,-7,8,3,'#1e3833',1);for(let i=-4;i<=4;i+=4)box(c,i,0,1,9,'#bdceaa4d');}
 if(kind==='terrace'){oval(c,7,8,34,25,'#203c3028');for(const xx of [-23,23]){box(c,xx-7,-8,14,16,'#8d694e',3);box(c,xx-6,-10,12,4,'#ccac78',1);}oval(c,0,0,19,15,'#e7d7b7');oval(c,0,-2,19,15,'#f1e6cc');oval(c,-6,-4,4,3,'#728c7c');oval(c,7,1,3,3,'#b48361');box(c,-1,-26,2,26,'#d7c79d');for(let i=0;i<8;i++){const a=i*Math.PI/4;c.beginPath();c.moveTo(0,-26);c.lineTo(Math.cos(a)*28,Math.sin(a)*19-26);c.lineTo(Math.cos(a+Math.PI/4)*28,Math.sin(a+Math.PI/4)*19-26);c.closePath();c.fillStyle=i%2?'#e8d4af':'#b8735e';c.fill();}oval(c,0,-26,3,2,'#faf0d4');}
 if(kind==='parking'){box(c,-105,-28,210,54,'#6c7974',4);for(let xx=-103;xx<105;xx+=42){box(c,xx,-24,2,43,'#f1e8c6a0');box(c,xx+4,17,30,2,'#f1e8c6a0');}c.fillStyle='#e3dfbc';c.font='bold 18px system-ui';c.textAlign='center';c.fillText('P',0,3);}
 if(kind==='tyres')for(let i=0;i<3;i++){oval(c,i*5-8,7-i*4,10,6,'#233a3f');oval(c,i*5-8,5-i*4,9,5,'#42545a');oval(c,i*5-8,5-i*4,4,2,'#20343b');}
 if(kind==='flag'){oval(c,7,9,11,4,'#17362b30');box(c,-2,-45,3,57,'#a8b4a5',1);for(let i=0;i<3;i++)box(c,1+i*8,-44,8,17,['#5e87b5','#eee6d0','#c77469'][i]);}
 if(kind==='garden'){box(c,-106,-27,212,50,'#66875e',16);box(c,-83,-3,166,9,'#d1c29f',4);for(const xx of [-90,90])drawTree(c,xx,-2,18);for(let i=-55;i<65;i+=17){oval(c,i,-16,5,3,i%2?'#d0b9cd':'#e7cb8c');} }
 if(kind==='park'||kind==='square'){
  box(c,-124,-78,248,156,kind==='park'?'#6d916a':'#c3bda4',22);box(c,-126,-79,252,3,'#e0ddbd70',2);
  box(c,-115,-7,230,14,'#d5c6a5',5);box(c,-7,-69,14,138,'#d5c6a5',5);
  if(kind==='square'){oval(c,6,9,39,24,'#2d53432b');oval(c,0,0,34,27,'#e3ddc2');oval(c,0,-3,27,21,'#517e83');oval(c,0,-5,23,17,'#7fb7b7');oval(c,-4,-8,14,8,'#b8dbce');box(c,-2,-20,4,17,'#e5e8d1',2);}
  else{oval(c,0,0,34,26,'#557b54');for(let i=0;i<16;i++){const a=i*2.4;oval(c,Math.cos(a)*24,Math.sin(a)*17,4,3,['#ddbb88','#c7b0c8','#e0dbb1'][i%3]);}}
  for(const xx of [-91,91])for(const yy of [-47,47])drawTree(c,xx,yy,20+variant);streetObject(c,{kind:'bench',x:-62,y:39});streetObject(c,{kind:'bench',x:62,y:-30});
 }
 c.restore();}
let cityKey='',cityObjects=[],cityChunks=new Map();const chunkSize=512;
export function drawCityDetails(c,view,world,buildings){
 const key=world.width+'|'+world.height+'|'+buildings.map(b=>[b.x,b.y,b.w,b.h,b.name].join(',')).join(';');
 if(key!==cityKey){cityKey=key;cityObjects=cityDetails(world,buildings);cityChunks.clear();}
 const firstX=Math.max(0,Math.floor(view.x/chunkSize)),firstY=Math.max(0,Math.floor(view.y/chunkSize));
 for(let cy=firstY;cy<=Math.floor(Math.min(world.height-1,view.y+view.h)/chunkSize);cy++)for(let cx=firstX;cx<=Math.floor(Math.min(world.width-1,view.x+view.w)/chunkSize);cx++){
  const id=cx+','+cy;let tile=cityChunks.get(id);if(!tile){tile=document.createElement('canvas');tile.width=tile.height=chunkSize;const t=tile.getContext('2d');t.translate(-cx*chunkSize,-cy*chunkSize);for(const o of cityObjects)if(o.x+160>=cx*chunkSize&&o.x-160<(cx+1)*chunkSize&&o.y+120>=cy*chunkSize&&o.y-120<(cy+1)*chunkSize)streetObject(t,o);cityChunks.set(id,tile);if(cityChunks.size>40)cityChunks.delete(cityChunks.keys().next().value);}else{cityChunks.delete(id);cityChunks.set(id,tile);}c.drawImage(tile,cx*chunkSize,cy*chunkSize);
 }
}
