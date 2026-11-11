export function drawRoomFloor(c,o,kind){c.save();c.fillStyle=o.color;c.fillRect(o.x,o.y,o.w,o.h);const tiled=kind==='police'||/CUISINE/.test(o.label);const height=tiled?38:18,width=tiled?38:110;c.strokeStyle=tiled?'#3e66602c':'#664d332d';c.lineWidth=1;
 for(let y=o.y;y<o.y+o.h;y+=height){const bottom=Math.min(y+height,o.y+o.h);c.beginPath();c.moveTo(o.x,bottom);c.lineTo(o.x+o.w,bottom);for(let x=o.x+(tiled?0:(Math.floor((y-o.y)/height)%2)*55);x<o.x+o.w;x+=width){c.moveTo(x,y);c.lineTo(x,bottom);}c.stroke();}
 c.fillStyle='#f4ebc528';c.beginPath();c.moveTo(o.x+18,o.y);c.lineTo(o.x+104,o.y);c.lineTo(Math.min(o.x+o.w,o.x+235),o.y+Math.min(o.h,180));c.lineTo(o.x+75,o.y+Math.min(o.h,180));c.closePath();c.fill();c.strokeStyle='#ffffff38';c.strokeRect(o.x+2,o.y+2,o.w-4,o.h-4);c.restore();}
export function drawFurnitureDetails(c,o){if(o.floor||o.plant)return;c.save();c.fillStyle='#ffffff28';c.fillRect(o.x+3,o.y+2,Math.max(1,o.w-6),2);c.fillStyle='#152a3035';c.fillRect(o.x+o.w-3,o.y+3,3,Math.max(1,o.h-3));
 if(o.sofa){c.strokeStyle='#dce9e037';c.lineWidth=1;for(let i=0;i<3;i++)c.strokeRect(o.x+12,o.y+14+i*47,o.w-22,32);}
 if(o.bed){c.fillStyle='#fffaf0';for(const x of [o.x+12,o.x+o.w/2+3]){c.beginPath();c.roundRect(x,o.y+14,o.w/2-15,25,5);c.fill();}c.fillStyle='#586e9b40';c.fillRect(o.x+9,o.y+o.h-22,o.w-18,13);}
 if(/TABLE|BUREAU|MANGER/.test(o.label)){c.strokeStyle='#ddc39d39';for(let y=o.y+8;y<o.y+o.h-5;y+=8){c.beginPath();c.moveTo(o.x+7,y);c.lineTo(o.x+o.w-7,y+1);c.stroke();}c.fillStyle='#b8cec9';c.fillRect(o.x+o.w*.6,o.y+10,24,16);c.fillStyle='#f1e9d3';c.fillRect(o.x+o.w*.6+3,o.y+12,18,12);}
 if(o.label==='TV'){c.fillStyle='#91c6d45c';c.fillRect(o.x+6,o.y+10,3,o.h-22);}
 if(o.label==='CUISINE'){c.fillStyle='#507c82';c.fillRect(o.x+8,o.y+8,28,25);c.fillStyle='#c5d7cd';c.fillRect(o.x+11,o.y+11,22,19);c.fillStyle='#405159';for(const x of [o.x+o.w-45,o.x+o.w-25]){c.beginPath();c.arc(x,o.y+21,7,0,Math.PI*2);c.fill();}}
 c.restore();}
