export const motorized=v=>!!v&&v.type!=='bicycle';
export const vehicleHealth=v=>Number.isFinite(v?.health)?Math.max(0,Math.min(100,v.health)):100;
export function createVehicleDamage({now=Date.now}={}){return vehicle=>{
 if(!motorized(vehicle)||vehicleHealth(vehicle)<=0||(vehicle.lastCollisionAt!==undefined&&now()-vehicle.lastCollisionAt<1500))return false;
 vehicle.health=Math.max(0,vehicleHealth(vehicle)-15);vehicle.lastCollisionAt=now();return true;
};}
