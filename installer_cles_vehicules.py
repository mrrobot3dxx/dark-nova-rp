from pathlib import Path
import shutil,sys
root=Path(__file__).resolve().parent
server=root/'server.mjs'; client=root/'public'/'game.js'
if not server.is_file() or not client.is_file():
 print('ERREUR : place les 2 fichiers directement dans dark-nova-rp, a cote de server.mjs et public.')
 input('Entree pour fermer...');sys.exit(1)
def change(s,old,new,label):
 if new in s:return s
 if s.count(old)!=1:raise RuntimeError('Version differente du jeu : '+label)
 return s.replace(old,new,1)
try:
 a=server.read_text(encoding='utf-8');b=client.read_text(encoding='utf-8')
 a=change(a,"   }else if(url.pathname==='/api/vehicle'){", """   }else if(url.pathname==='/api/vehicle-lock'){
    if(p.vehicleId)return send(400,{error:'Descends du vehicule avant de le verrouiller.'});
    const owned=vehicles.filter(v=>v.ownerId===p.id&&!v.stored&&v.type!=='bicycle'&&Math.hypot(v.x-p.x,v.y-p.y)<=75).sort((x,y)=>Math.hypot(x.x-p.x,x.y-p.y)-Math.hypot(y.x-p.x,y.y-p.y))[0];
    if(!owned)return send(403,{error:'Approche-toi de ton vehicule (75 pas maximum).'});
    owned.locked=!owned.locked;saveVehicle(owned);persist();broadcast();
    return send(200,{player:publicPlayer(p),locked:owned.locked});
   }else if(url.pathname==='/api/vehicle'){""",'route serveur')
 a=change(a,"v=>!v.stored&&!v.driverId&&(!v.ownerId||v.ownerId===p.id||(p.pickedVehicles?.[v.id]===true||p.pickedVehicles?.[v.id]>Date.now()))", "v=>!v.stored&&!v.driverId&&(!v.locked||v.ownerId===p.id)&&(!v.ownerId||v.ownerId===p.id||(p.pickedVehicles?.[v.id]===true||p.pickedVehicles?.[v.id]>Date.now()))",'protection des vehicules')
 b=change(b,"rideButton.addEventListener('click',ride);", """rideButton.addEventListener('click',ride);
const vehicleKeyButton=document.createElement('button');
vehicleKeyButton.id='vehicleKeyButton';vehicleKeyButton.textContent='🔑 Verrouiller / déverrouiller · L';
rideButton.after(vehicleKeyButton);
async function toggleVehicleLock(){
 if(!me)return toast('Connecte-toi.');
 try{const result=await api('vehicle-lock',{});me=result.player;toast(result.locked?'🔒 Véhicule verrouillé.':'🔓 Véhicule déverrouillé.');update();}
 catch(err){toast(err.message);}
}
vehicleKeyButton.addEventListener('click',toggleVehicleLock);""",'bouton cle')
 b=change(b,"if(key==='g'&&!e.repeat)openGarage();","if(key==='l'&&!e.repeat)toggleVehicleLock();if(key==='g'&&!e.repeat)openGarage();",'touche L')
 b=change(b,"rideButton.disabled=!me||(!v&&!near);","rideButton.disabled=!me||(!v&&!near);vehicleKeyButton.disabled=!me||!!me.vehicleId||!vehicles.some(item=>item.ownerId===me.id&&item.type!=='bicycle'&&!item.stored&&Math.hypot(item.x-me.x,item.y-me.y)<=75);",'etat du bouton')
 for p in (server,client):
  backup=p.with_name(p.name+'.avant_cles.bak')
  if not backup.exists():shutil.copy2(p,backup)
 server.write_text(a,encoding='utf-8');client.write_text(b,encoding='utf-8')
 print('SUCCES : touche L et bouton cle ajoutes. Dans GitHub Desktop : Commit puis Push origin.')
except Exception as e:print('ERREUR : '+str(e))
input('Entree pour fermer...')
