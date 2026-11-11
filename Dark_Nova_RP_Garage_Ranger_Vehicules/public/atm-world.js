export const atms=[
 {id:'centre',name:'ATM · Pôle emploi',x:335,y:985},
 {id:'hopital',name:'ATM · Hôpital',x:1310,y:175},
 {id:'garage-central',name:'ATM · Garage Central',x:980,y:2020},
 {id:'camp',name:'ATM · Camp des voyageurs',x:2400,y:2368},
 {id:'mairie',name:'ATM · Mairie',x:3700,y:2020}
];
export const atmObstacles=atms.map(a=>({id:'atm-'+a.id,x:a.x-13,y:a.y-16,w:26,h:32}));
export const nearATM=p=>p&&!p.interior&&!p.vehicleId&&!p.respawnAt&&!p.cuffed?atms.filter(a=>Math.hypot(p.x-a.x,p.y-a.y)<=65).sort((a,b)=>Math.hypot(p.x-a.x,p.y-a.y)-Math.hypot(p.x-b.x,p.y-b.y))[0]||null:null;
let sprite;
export function drawATMs(c,view,player){
 for(const a of atms){if(view&&(a.x<view.x-90||a.x>view.x+view.w+90||a.y<view.y-80||a.y>view.y+view.h+80))continue;
  if(!sprite){sprite=document.createElement('canvas');sprite.width=160;sprite.height=110;const s=sprite.getContext('2d');s.translate(80,60);const box=(x,y,w,h,col,r=2)=>{s.fillStyle=col;s.beginPath();s.roundRect(x,y,w,h,r);s.fill();};
   box(-10,9,30,13,'#15363235',5);box(-15,-30,30,47,'#344c59',4);box(-12,-28,24,41,'#819697',3);box(-10,-27,20,7,'#254a46');s.font='bold 6px system-ui';s.textAlign='center';s.fillStyle='#c5f1b1';s.fillText('NOVA ATM',0,-21);
   box(-10,-17,20,14,'#1c363b');box(-8,-15,16,10,'#91c7ad',1);box(-6,-13,9,1,'#e0efc4',0);box(-6,-10,12,1,'#4f8372',0);
   box(-10,-1,20,10,'#405964',1);for(let row=0;row<3;row++)for(let col=0;col<3;col++)box(-7+col*3,row*2,2,1.2,'#d0d7cd',.2);box(5,1,3,5,'#87bda3',.5);box(-7,11,14,2,'#18363a',.5);box(-4,12,8,1,'#cee6b2',.3);
   box(-40,-49,80,14,'#19313ce8',4);s.fillStyle='#c7e8d0';s.font='bold 8px system-ui';s.fillText('ATM · BANQUE',0,-39);
  }c.drawImage(sprite,a.x-80,a.y-60);
  if(nearATM(player)?.id===a.id){c.fillStyle='#c5edb1';c.beginPath();c.roundRect(a.x-42,a.y+24,84,20,4);c.fill();c.fillStyle='#243b30';c.font='bold 9px system-ui';c.textAlign='center';c.fillText('BANQUE · E',a.x,a.y+37);}
 }
}
