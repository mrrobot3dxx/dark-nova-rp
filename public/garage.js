export function setupGarage({api,getMe,setMe,update,keys,touch,toast,getInfo}){
 const $=id=>document.getElementById(id),garageDialog=document.createElement('dialog');garageDialog.id='garageDialog';
 garageDialog.innerHTML='<div class="garage-top"><span class="eyebrow">NOVA MOTORS / GARAGE</span><button id="closeGarage" aria-label="Fermer le garage">×</button></div><h2>Prends la route<span>.</span></h2><p>Location 10 minutes ou achat permanent. Tous les prix sont en dollars du jeu.</p><strong id="garageBalance"></strong><p id="garageHint"></p><div id="garageCatalog"></div><p id="garageMessage" role="status"></p><small>Les achats restent sur ton compte. Une location expire même lorsque tu es déconnecté. Aucun renouvellement automatique.</small>';
 document.body.append(garageDialog);const button=document.createElement('button');button.id='garageButton';button.textContent='Garage · G';document.querySelector('.map-label').after(button);
 $('closeGarage').addEventListener('click',()=>garageDialog.close());button.addEventListener('click',openGarage);
 async function openGarage(){if(!getMe())return toast('Connecte-toi pour visiter le garage.');keys.clear();touch.clear();try{render(await api('garage'));if(!garageDialog.open)garageDialog.showModal();}catch(err){toast(err.message);}}
 function render(result){
  setMe(result.player);update();const me=getMe(),state=result.garage,info=getInfo(),near=Math.hypot(me.x-info.x,me.y-info.y)<=info.radius;
  $('garageBalance').textContent='Ton solde : '+state.money+' $';$('garageHint').textContent=near?(me.vehicleId?'Descends de ton véhicule pour passer au garage.':'Ton véhicule sera préparé juste au sud du repère violet.'):'Rejoins le repère violet : depuis le départ, descends tout droit jusqu’au Garage Nova.';
  $('garageCatalog').replaceChildren();
  for(const model of state.catalog){const card=document.createElement('article');card.className='garage-card';const title=document.createElement('h3');title.textContent=({car:'🚗 ',scooter:'🛵 ',firetruck:'🚒 ',policecar:'🚓 ',quad:'🏍️ '}[model.type]||'🚗 ')+model.name;const details=document.createElement('p');details.textContent=({car:'Une citadine rapide pour traverser Nova City.',scooter:'Un scooter agile, idéal pour tes livraisons.',firetruck:'Camion rouge avec échelle et gyrophares · 320 unités/s.',policecar:'Voiture blanche avec bande bleue et gyrophares · 440 unités/s.',quad:'Quad à quatre roues, compact et agile · 350 unités/s.'}[model.type]||model.name);card.append(title,details);
   const owned=state.vehicles.find(v=>v.type===model.type&&!v.rentalUntil),rental=state.vehicles.find(v=>v.type===model.type&&v.rentalUntil);
   if(owned||rental){const status=document.createElement('p');status.className='garage-owned';status.textContent=owned?'✓ Ce modèle t’appartient.':`Location en cours · ${Math.max(1,Math.ceil((rental.rentalUntil-Date.now())/60000))} min restantes`;card.append(status);}
   const actions=document.createElement('div');actions.className='garage-actions';
   const add=(label,action,disabled=false)=>{const b=document.createElement('button');b.textContent=label;b.disabled=!near||!!me.vehicleId||disabled;b.addEventListener('click',()=>act(action,model.type));actions.append(b);};
   add(`Louer ${state.rentalMinutes} min · ${model.rent} $`,'rent',state.money<model.rent||state.vehicles.some(v=>v.rentalUntil));
   if(owned)add('Récupérer · gratuit','retrieve');else add(`Acheter · ${model.buy} $`,'buy',state.money<model.buy);
   if(rental)add('Rendre la location','return');card.append(actions);$('garageCatalog').append(card);
  }
  $('garageMessage').textContent='';
 }
 async function act(action,type){for(const b of $('garageCatalog').querySelectorAll('button'))b.disabled=true;try{render(await api('garage',{action,type}));$('garageMessage').textContent=action==='return'?'Location rendue.':action==='retrieve'?'Ton véhicule est prêt au sud du repère violet.':action==='buy'?'Achat enregistré ! Ton véhicule est prêt au sud du repère violet.':'Location démarrée pour 10 minutes. Véhicule prêt au sud du repère violet.';}catch(err){await openGarage();$('garageMessage').textContent=err.message;}}
 return {garageDialog,openGarage};
}
