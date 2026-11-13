import {caravanCamp,caravans} from './caravan-camp-world.js';
import {drawTree} from './visuals.js?v=camp-1';
let cached=null;
function paint(c){const camp=caravanCamp;
 const box=(x,y,w,h,color,r=3)=>{c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();};
 const oval=(x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
 const line=(points,color,width=1)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.stroke();};
 box(camp.x-4,camp.y-4,camp.w+8,camp.h+8,'#536e5433',14);box(camp.x,camp.y,camp.w,camp.h,'#9b997c',12);
 let seed=571;for(let i=0;i<1700;i++){seed=seed*16807%2147483647;const x=camp.x+6+seed%(camp.w-12);seed=seed*16807%2147483647;const y=camp.y+6+seed%(camp.h-12);box(x,y,2,1,i%2?'#ded2aa44':'#5a62552b',0);}
 box(2353,2375,137,30,'#b8ab87',3);box(camp.x+8,2370,camp.w-16,54,'#c0b18e',6);line([[camp.x+20,2385],[camp.x+camp.w-20,2385]],'#dcd0ad55');line([[camp.x+20,2405],[camp.x+camp.w-20,2405]],'#827d6329');
 // Open gateway and low boundary fence; no barrier crosses the shared driveway.
 for(const yy of [camp.y+3,camp.y+camp.h-3]){box(camp.x+5,yy,camp.w-10,3,'#7e7157');for(let xx=camp.x+8;xx<camp.x+camp.w;xx+=26){box(xx,yy-4,4,10,'#c0ac83',1);}}
 for(const xx of [camp.x+2,camp.x+camp.w-3])for(let yy=camp.y+12;yy<camp.y+camp.h-10;yy+=22){if(xx<camp.x+5&&Math.abs(yy-2390)<30)continue;box(xx,yy,4,16,'#7a8061',1);}
 for(const v of caravans){c.save();c.translate(v.x+v.w/2,v.y+v.h/2);if(v.reverse)c.rotate(Math.PI);const w=v.w,h=v.h;
  oval(6,h/2+3,w/2+6,12,'#25352d28');for(const xx of [-w/4,w/4]){box(xx-7,20,14,10,'#293b3c',3);box(xx-5,23,10,3,'#65716a',1);}
  // Tow bar, stabilisers and rounded shell.
  line([[w/2-1,-10],[w/2+19,0],[w/2-1,10]],'#708480',3);box(w/2+17,-3,8,6,'#b6bca8',2);
  box(-w/2-1,-h/2-1,w+2,h+2,'#52676a',10);box(-w/2,-h/2,w,h-2,v.color,9);box(-w/2+5,-h/2+4,w-10,29,'#e9e7d8',7);box(-w/2+9,-h/2+7,w-18,2,'#ffffffb0',1);
  box(-w/2+5,6,w-10,6,'#648993',1);box(-w/2+6,12,w-12,3,'#e3dfcc',1);
  for(const xx of [-w/2+18,w/2-44]){box(xx,0,24,17,'#45646e',2);box(xx+2,2,20,12,'#92bdc2',1);line([[xx+4,4],[xx+15,4],[xx+4,11]],'#d8e5d18c');box(xx+11,2,1,12,'#d5ded0',0);}
  box(-10,-1,19,27,'#6a7e7d',2);box(-8,1,15,23,'#e0dfca',2);box(-6,3,11,10,'#6b989e',1);box(4,15,1.5,4,'#5a6c68',.5);box(-13,25,25,5,'#b9b69d',1);
  box(-29,-18,30,15,'#aebeb9',3);box(-26,-15,24,9,'#6b8e95',2);box(-15,-15,1,9,'#c9d9d2');box(30,-17,16,10,'#bfc5b2',2);for(let i=0;i<4;i++)box(32,-15+i*2,12,1,'#81968c',0);
  // Retractable awning shelters the doorstep, without blocking the central lane.
  box(-32,16,64,14,'#4c625b22',2);for(let i=0;i<8;i++)box(-32+i*8,15,8,8,i%2?'#c1ae8b':'#eee2c4',1);for(const xx of [-31,31])box(xx,22,1,12,'#879585',0);
  for(const xx of [-w/2+2,w/2-7])box(xx,18,5,3,'#c47662',1);c.restore();
 }
 // Shared picnic area, water point, planters and entrance information board.
 for(const xx of [2800,3020]){box(xx-17,2386,34,17,'#a17c53',2);for(let k=0;k<3;k++)box(xx-15,2388+k*5,30,1,'#d0ac74',0);for(const yy of [2379,2408])box(xx-20,yy,40,5,'#92714f',1);}
 box(3238,2369,13,25,'#77938d',2);box(3240,2371,9,4,'#cbd7c2',1);line([[3245,2376],[3249,2376],[3249,2380]],'#d9ddc5',2);
 for(const [x,y]of [[2488,2224],[2488,2565],[3250,2224],[3250,2565]]){box(x-9,y-4,18,11,'#a08a6a',2);oval(x,y-5,12,6,'#577950');for(let i=-6;i<8;i+=5)oval(x+i,y-7,2,2,i%2?'#d9b28d':'#cfb9c6');}
 box(2415,2340,4,30,'#6b624d');box(2394,2333,46,23,'#284d46',3);c.fillStyle='#efe6c9';c.font='bold 6px system-ui';c.textAlign='center';c.fillText('CAMP DES',2417,2342);c.fillText('VOYAGEURS',2417,2351);
 drawTree(c,2430,2230,24);drawTree(c,2430,2555,23);
 c.textAlign='center';c.font='700 10px system-ui';c.fillStyle='#334b3d';c.fillText('CAMP DES VOYAGEURS · CARAVANES',2870,2193);
}
export function drawCaravanCamp(c,view){const b={x:2340,y:2170,w:970,h:450};if(view&&(view.x>b.x+b.w||view.x+view.w<b.x||view.y>b.y+b.h||view.y+view.h<b.y))return;
 if(!cached){cached=document.createElement('canvas');cached.width=b.w;cached.height=b.h;const s=cached.getContext('2d');s.translate(-b.x,-b.y);paint(s);}c.drawImage(cached,b.x,b.y);
}
