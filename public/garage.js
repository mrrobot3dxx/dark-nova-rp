import {nearVehicleDealer,findVehicleDealer} from './vehicle-dealer.js?v=nova-front-4';
export function setupGarage({api,getMe,setMe,update,keys,touch,toast,getInfo}){
 const $=id=>document.getElementById(id),garageDialog=document.createElement('dialog');garageDialog.id='garageDialog';
 garageDialog.innerHTML='<div class="garage-top"><span class="eyebrow">NOVA MOTORS / VENDEURS</span><button id="closeGarage" aria-label="Fermer le garage">×</button></div><h2>Prends la route<span>.</span></h2><p>Nos vendeurs te proposent une location de 10 minutes ou un achat permanent. Tous les prix sont en dollars du jeu.</p><strong id="garageBalance"></strong><p id="garageHint"></p><div id="garageCatalog"></div><p id="garageMessage" role="status"></p><button id="refreshGarage" type="button">Actualiser le garage</button><small>Les achats restent sur ton compte. Une location expire même lorsque tu es déconnecté. Aucun renouvellement automatique.</small>';
 document.body.append(garageDialog);const button=document.createElement('button');button.id='garageButton';button.textContent='Garage · G';document.querySelector('header').append(button);
 $('closeGarage').addEventListener('click',()=>garageDialog.close());button.addEventListener('click',openGarage);
 let busy=false,loaded=false;
 $('refreshGarage').addEventListener('click',()=>load());
 async function openGarage(){if(!getMe())return toast('Connecte-toi pour visiter le garage.');keys.clear();touch.clear();if(!garageDialog.open)garageDialog.showModal();if(!loaded)$('garageCatalog').textContent='Chargement des véhicules…';await load();}
 async function load(action,type){
  if(busy)return;busy=true;$('refreshGarage').disabled=true;for(const b of $('garageCatalog').querySelectorAll('button'))b.disabled=true;$('garageMessage').textContent=action?'Opération en cours…':'Chargement du garage…';
  const controller=new AbortController();let timer;
  try{const result=await Promise.race([api('garage',action?{action,type}:{},{signal:controller.signal}),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('La réponse tarde. Actualise le garage pour vérifier ton dernier état.'));},8000);})]);render(result);loaded=true;$('garageMessage').textContent=action==='return'?'Location rendue.':action==='store'?'Ton véhicule est rangé au garage.':action==='retrieve'?'Ton véhicule est prêt au sud du repère violet.':action==='buy'?'Achat enregistré. Ton véhicule est prêt.':action==='rent'?'Location démarrée pour 10 minutes. Véhicule prêt au sud du repère violet.':'';}
  catch(err){if(!loaded)$('garageCatalog').textContent='Impossible de charger les véhicules.';$('garageMessage').textContent=err.message;toast(err.message);}
  finally{clearTimeout(timer);busy=false;$('refreshGarage').disabled=false;}
 }
 function render(result){
  setMe(result.player);update();const me=getMe(),state=result.garage,info=getInfo(),near=Math.hypot(me.x-info.x,me.y-info.y)<=info.radius||nearVehicleDealer(me);
  $('garageBalance').textContent='Ton solde : '+state.money+' $';$('garageHint').textContent=near?(me.vehicleId?'Descends de ton véhicule pour passer au garage.':'Ton véhicule sera préparé à proximité de ce garage.'):'Retrouve Sam au Garage Nova (590, 715) ou Léo au Garage Central (1150, 2020).';
  $('garageCatalog').replaceChildren();
  for(const model of state.catalog){const card=document.createElement('article');card.className='garage-card';const title=document.createElement('h3');title.textContent=({car:'🚗 ',scooter:'🛵 ',firetruck:'🚒 ',policecar:'🚓 ',quad:'🏍️ '}[model.type]||'🚗 ')+model.name;const details=document.createElement('p');details.textContent=({car:'Une citadine rapide pour traverser Nova City.',scooter:'Un scooter agile, idéal pour tes livraisons.',firetruck:'Camion rouge avec échelle et gyrophares · 320 unités/s.',policecar:'Voiture blanche avec bande bleue et gyrophares · 440 unités/s.',quad:'Quad à quatre roues, compact et agile · 350 unités/s.'}[model.type]||model.name);card.append(title,details);
   const owned=state.vehicles.find(v=>v.type===model.type&&!v.rentalUntil),rental=state.vehicles.find(v=>v.type===model.type&&v.rentalUntil);
   if(owned||rental){const status=document.createElement('p');status.className='garage-owned';status.textContent=owned?(owned.stored?'✓ Rangé au garage.':'✓ Ce modèle t’appartient.'):`Location en cours · ${Math.max(1,Math.ceil((rental.rentalUntil-Date.now())/60000))} min restantes`;card.append(status);const condition=document.createElement('p');condition.textContent='État : '+((owned||rental).health??100)+' % · Un kit est nécessaire pour réparer.';card.append(condition);}
   const actions=document.createElement('div');actions.className='garage-actions';
   const add=(label,action,disabled=false)=>{const b=document.createElement('button');b.textContent=label;b.disabled=!near||!!me.vehicleId||disabled;b.addEventListener('click',()=>act(action,model.type));actions.append(b);};
   add(`Louer ${state.rentalMinutes} min · ${model.rent} $`,'rent',state.money<model.rent||state.vehicles.some(v=>v.rentalUntil));
   if(owned){if(owned.stored)add('Récupérer · gratuit','retrieve');else add('Ranger au garage','store');}else add(`Acheter · ${model.buy} $`,'buy',state.money<model.buy);
   if(rental)add('Rendre la location','return');card.append(actions);$('garageCatalog').append(card);
  }
  $('garageMessage').textContent='';
 }
 async function act(action,type){await load(action,type);}
 return {garageDialog,openGarage};
}
