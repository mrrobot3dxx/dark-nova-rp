import {drawCharacter} from './characters.js?v=people-1';
export const medic={name:'Dr Léa',x:1250,y:320,radius:65,price:50};
export const nearMedic=p=>!!(p&&!p.interior&&!p.vehicleId&&Math.hypot(p.x-medic.x,p.y-medic.y)<=medic.radius);
export function drawMedic(ctx,me){const {x,y}=medic;ctx.save();const box=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.roundRect(x,y,w,h,3);ctx.fill();};
 drawCharacter(ctx,{outfit:{style:'jacket',color:'#e2e8de',pants:'#405d6c',shoes:'#e1e4db'},hair:'#594534',hairStyle:'long'},x,y);box(x-7,y-40,14,6,'#f3f2e5');box(x-1,y-39,2,4,'#c56465');box(x-3,y-38,6,2,'#c56465');box(x+17,y+4,18,15,'#e0dfd0');box(x+24,y+7,4,9,'#c56465');box(x+21,y+10,10,3,'#c56465');
 box(x-93,y-68,186,24,'#173339ee');ctx.fillStyle='#ddfff0';ctx.textAlign='center';ctx.font='bold 11px system-ui';ctx.fillText('DR LÉA · SOINS · 50 $',x,y-52);if(nearMedic(me))ctx.fillText('SE SOIGNER · E',x,y+48);ctx.restore();}
