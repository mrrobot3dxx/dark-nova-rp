import {drawCharacter} from './characters.js?v=people-1';
export const vehicleDealer={name:'Sam · Vente de véhicules',x:590,y:715,radius:65};
export const vehicleDealers=[{...vehicleDealer,id:'nova',shortName:'Sam'},{id:'central',shortName:'Léo',name:'Léo · Garage Central',x:1150,y:2020,radius:75}];
export const findVehicleDealer=p=>p&&!p.interior&&!p.vehicleId?vehicleDealers.filter(d=>Math.hypot(p.x-d.x,p.y-d.y)<=d.radius).sort((a,b)=>Math.hypot(p.x-a.x,p.y-a.y)-Math.hypot(p.x-b.x,p.y-b.y))[0]||null:null;
export const nearVehicleDealer=p=>!!findVehicleDealer(p);
export function drawVehicleDealer(ctx,me){for(const dealer of vehicleDealers)drawDealer(ctx,me,dealer);}
function drawDealer(ctx,me,dealer){const {x,y}=dealer;ctx.save();ctx.translate(x,y);ctx.scale(1.2,1.2);ctx.translate(-x,-y);const box=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.roundRect(x,y,w,h,3);ctx.fill();};drawCharacter(ctx,{outfit:{style:'suit',color:dealer.id==='nova'?'#3a6276':'#615671',pants:'#293b4b',shoes:'#343b40'},skin:'#cda17d',hair:'#3d3330'},x,y);box(x+19,y+5,19,23,'#b29f7d');box(x+22,y+10,13,3,'#e3e5d5');box(x-110,y-69,220,24,'#18303bee');ctx.textAlign='center';ctx.font='bold 11px system-ui';ctx.fillStyle='#ddf3ff';ctx.fillText(dealer.shortName.toUpperCase()+' · ACHAT DE VÉHICULES',x,y-54);if(findVehicleDealer(me)?.id===dealer.id)ctx.fillText('CATALOGUE · E',x,y+49);ctx.restore();}
