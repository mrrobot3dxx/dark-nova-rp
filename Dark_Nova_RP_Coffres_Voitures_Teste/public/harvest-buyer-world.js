export const harvestBuyer={name:'Milo',x:1150,y:650,radius:75};
export const nearHarvestBuyer=p=>!!(p&&!p.interior&&!p.vehicleId&&Math.hypot(p.x-harvestBuyer.x,p.y-harvestBuyer.y)<=harvestBuyer.radius);
