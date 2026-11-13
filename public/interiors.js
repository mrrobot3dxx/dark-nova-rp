// Shared geometry: the server and renderer use the same walls and furniture.
export function interiorPlan(kind){
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
  {x:95,y:height-150,w:55,h:55,color:'#5d8a60',label:'PLANTE',plant:true}
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
 for(const o of plan.items.filter(o=>o.floor)){box(o.x,o.y,o.w,o.h,o.color);for(let y=o.y+22;y<o.y+o.h;y+=24)box(o.x,y,o.w,1,'#fff2');label(o.label,o.x+o.w/2,o.y+o.h-20,11,'#3d4b47');}
 box(175,100,180,190,'#ddc6a3',8);box(187,112,156,166,'#a8a58a',7);
 for(const o of plan.items.filter(o=>!o.floor)){box(o.x+4,o.y+5,o.w,o.h,'#0002',5);box(o.x,o.y,o.w,o.h,o.color,o.wall?0:5);if(o.bed){box(o.x+8,o.y+10,o.w-16,35,'#f1eddd',5);box(o.x+6,o.y+60,o.w-12,o.h-67,'#9cabcd',4);}if(o.sofa){for(let i=0;i<3;i++)box(o.x+10,o.y+12+i*47,o.w-18,37,'#89a2ad',5);}if(o.plant){label('✿',o.x+o.w/2,o.y+o.h/2+10,37,'#b3d48b');}else if(!o.wall)label(o.label,o.x+o.w/2,o.y+o.h/2+4,9);}
 for(const x of [110,plan.width*.74]){box(x,12,110,12,'#77b4ce',3);box(x+52,12,5,12,'#e9efe3');}
 box(plan.width/2-46,plan.height-28,92,16,'#d4b377',4);label('SORTIE · B',plan.width/2,plan.height-40,12,'#34483e');
 for(const p of players.filter(p=>p.interior?.id===me.interior.id)){box(p.ix-9,p.iy-6,18,25,p.color,5);box(p.ix-7,p.iy+15,5,8,'#293c4a',2);box(p.ix+2,p.iy+15,5,8,'#293c4a',2);ctx.fillStyle='#e3b998';ctx.beginPath();ctx.arc(p.ix,p.iy-12,9,0,Math.PI*2);ctx.fill();label(p.name,p.ix,p.iy-31,11,p.id===me.id?'#d7ff90':'#fff');}
 ctx.restore();box(16,85,Math.min(w-32,340),36,'#17232bed',7);label(me.interior.name,16+Math.min(w-32,340)/2,108,12,'#f4dfb6');
}
