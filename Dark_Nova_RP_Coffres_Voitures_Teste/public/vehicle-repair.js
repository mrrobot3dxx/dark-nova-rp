export async function repairWithKit({api,getMe,setMe,setVehicles,vehicleId}){
 async function request(body,path='repairs'){const controller=new AbortController();let timer;try{return await Promise.race([api(path,body,{signal:controller.signal}),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('La réponse tarde. Vérifie l’état du véhicule et ton inventaire avant de réessayer.'));},8000);})]);}finally{clearTimeout(timer);}}
 const stock=await request({});if(stock.kits<1)throw Error('Tu n’as aucun kit. Achète-en un chez Alex ou dans la boutique pour 100 $.');
 if(getMe()?.vehicleId){if(getMe().vehicleId!==vehicleId)throw Error('Descends de ton véhicule et approche-toi de celui à réparer.');const exit=await request({},'vehicle');setMe(exit.player);}
 const result=await request({action:'repair',id:vehicleId});setMe(result.player);setVehicles(result.vehicles);return result;
}
export function setupVehicleRepair({panel,api,getMe,setMe,setVehicles,update,keys,touch,toast}){
 const button=document.createElement('button');button.id='useRepairKit';button.type='button';button.textContent='🧰 Utiliser un kit';panel.append(button);let target=null,busy=false;
 function refresh(vehicle){target=vehicle;button.hidden=!vehicle||vehicle.type==='bicycle';button.disabled=busy||!vehicle||(vehicle.health??100)>=100;button.textContent=busy?'Réparation en cours…':(vehicle?.health??100)>=100?'Véhicule en parfait état':getMe()?.vehicleId?'🧰 Descendre et réparer':'🧰 Utiliser un kit';}
 button.addEventListener('click',async()=>{if(busy||!target)return;const vehicleId=target.id;busy=true;keys.clear();touch.clear();refresh(target);try{const result=await repairWithKit({api,getMe,setMe,setVehicles,vehicleId});toast(result.message);}catch(e){toast(e.message);}finally{busy=false;update();refresh(target);}});
 return {update:refresh};
}
