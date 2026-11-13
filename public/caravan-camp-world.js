export const caravanCamp={id:'camp-voyageurs',name:'Camp des voyageurs · Caravanes',x:2470,y:2205,w:800,h:385,entrance:{x:2485,y:2390}};
export const caravans=Array.from({length:6},(_,i)=>({id:'caravan-'+(i+1),x:2490+(i%3)*270,y:i<3?2240:2460,w:174,h:78,reverse:i>=3,interiorSpace:{width:154,height:58,plantSpot:{x:38,y:38},printerSpot:{x:116,y:38}},color:['#c5cfbf','#b4c7ce','#cbbfaf','#c0c4d1','#c4cfbd','#d6c6b2'][i]}));
export const caravanObstacles=caravans.map(({id,x,y,w,h})=>({id,x,y,w,h}));
