import {drawTree} from './graphics.js?v=graphics-2';
export const nature={forest:{name:'Bois de Nova',x:1060,y:1210},orchard:{name:'Verger de Nova',x:1070,y:1320},durationMs:3000,cooldownMs:20000,nodes:[
 {id:'wood-1',type:'wood',x:950,y:1190},{id:'wood-2',type:'wood',x:1060,y:1170},{id:'wood-3',type:'wood',x:1190,y:1200},
 {id:'apple-1',type:'apple',x:950,y:1320},{id:'apple-2',type:'apple',x:1070,y:1310},{id:'apple-3',type:'apple',x:1200,y:1320}
]};
export function nearNature(player){return player&&!player.interior&&!player.vehicleId?nature.nodes.filter(n=>Math.hypot(player.x-n.x,player.y-n.y)<=75).sort((a,b)=>Math.hypot(player.x-a.x,player.y-a.y)-Math.hypot(player.x-b.x,player.y-b.y))[0]:null;}
export function drawNature(ctx,me){const box=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.roundRect(x,y,w,h,12);ctx.fill();},dot=(x,y,r,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();};
 box(895,1115,385,255,'#789569');box(911,1239,353,12,'#c8bb9290');box(1091,1149,11,205,'#c8bb9290');ctx.font='700 12px system-ui';ctx.textAlign='center';ctx.fillStyle='#e9f5d8';ctx.fillText('BOIS DE NOVA · BOIS & POMMES',1085,1140);
 for(const n of nature.nodes){drawTree(ctx,n.x,n.y,30);if(n.type==='apple'){for(const [dx,dy]of [[-18,-15],[12,-30],[17,-6],[-4,-40]])dot(n.x+dx,n.y+dy,5,'#de6250');}else{ctx.fillStyle='#b8d29a';ctx.fillText('🪓',n.x,n.y-19);}}
 const n=nearNature(me);if(n){box(n.x-75,n.y+44,150,27,'#c3f36a');ctx.fillStyle='#26391f';ctx.fillText(n.type==='apple'?'CUEILLIR · E':'COUPER DU BOIS · E',n.x,n.y+62);}
}
