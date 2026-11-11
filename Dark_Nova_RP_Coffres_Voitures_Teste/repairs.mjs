import {mechanic,nearMechanic} from './public/mechanic-world.js?v=alex-area-1';
import {motorized,vehicleHealth} from './vehicle-condition.mjs';
export function createRepairs({accounts,vehicles,saveVehicle,save,persist}){return (p,body)=>{
 const account=accounts.get(p.accountKey),fail=(status,error)=>({status,data:{error}}),access=v=>v.ownerId===p.id||p.pickedVehicles?.[v.id]===true||p.pickedVehicles?.[v.id]>Date.now();let message='';
 const nearby=()=>vehicles.filter(v=>motorized(v)&&access(v)&&Math.hypot(v.x-p.x,v.y-p.y)<=90);
 if(body.action==='buy'){
  if(!nearMechanic(p))return fail(400,'Approche-toi à pied d’Alex sur l’aire de réparation (1650, 1250).');
  if(typeof body.requestId!=='string'||! /^[a-f0-9-]{36}$/i.test(body.requestId))return fail(400,'Identifiant d’achat invalide.');
  if(!(account.kitPurchases||[]).includes(body.requestId)){if(p.money<mechanic.price)return fail(400,'Il te faut 100 $ pour un kit.');p.money-=mechanic.price;account.supplies??={};account.supplies.repairkit=(account.supplies.repairkit||0)+1;account.kitPurchases=[...(account.kitPurchases||[]),body.requestId].slice(-100);save(p);persist();}
  message='Kit ajouté à ton inventaire. Descends près de ton véhicule et utilise-le pour réparer.';
 }else if(body.action==='repair'){
  if(p.interior||p.vehicleId||p.cuffs)return fail(400,'Descends et approche-toi à pied du véhicule pour réparer.');
  const vehicle=body.id?nearby().find(v=>v.id===body.id):nearby().filter(v=>vehicleHealth(v)<100).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
  if(!vehicle)return fail(400,'Approche-toi à moins de 90 pas de ton véhicule endommagé.');
  if(vehicle.driverId)return fail(409,'Le conducteur doit descendre avant la réparation.');
  if(vehicleHealth(vehicle)>=100)return fail(409,'Ce véhicule est déjà en parfait état.');
  if(!(account.supplies?.repairkit>0))return fail(409,'Il te faut un kit de réparation : achète-le chez Alex ou dans la boutique.');
  account.supplies.repairkit--;vehicle.health=100;saveVehicle(vehicle);save(p);persist();message='Véhicule réparé à 100 %. Un kit a été utilisé.';
 }else if(body.action)return fail(400,'Action inconnue.');
 return {status:200,data:{near:nearMechanic(p),price:mechanic.price,kits:account.supplies?.repairkit||0,nearby:nearby().map(v=>({id:v.id,name:v.name,health:vehicleHealth(v),occupied:!!v.driverId})),message}};
};}
