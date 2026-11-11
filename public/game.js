import {setupPunch} from '/punch.js?v=punch-j-2';
import {nearATM,atms,drawATMs} from '/atm-world.js';
import {setupBank} from '/bank.js?v=atm-1';
import {caravanCamp} from '/caravan-camp-world.js';
import {drawCaravanCamp} from '/caravan-camp.js?v=camp-1';
import {setupMobile} from '/mobile.js?v=punch-1';
import {setupTrading} from '/trading.js';
import {harvestBuyer,nearHarvestBuyer} from '/harvest-buyer-world.js?v=milo-market-3';
import {setupVehicleRepair} from '/vehicle-repair.js';
import {vehicleDealer,findVehicleDealer,nearVehicleDealer,drawVehicleDealer} from '/vehicle-dealer.js?v=people-1';
import {mechanic,nearMechanic,drawMechanic,drawRepairArea} from '/mechanic-world.js?v=people-1';
import {setupRepairs} from '/repairs.js?v=alex-area-1';
import {nearBakery,drawBaker} from '/bakery-world.js?v=people-1';
import {setupBakery} from '/bakery.js';
import {nearClothing} from '/clothing-world.js';
import {setupClothing} from '/clothing.js?v=people-1';
import {nearMedic,drawMedic} from '/medic-world.js?v=people-1';
import {setupMedic} from '/medic.js';
import {drawCharacter} from '/characters.js?v=punch-1';
import {setupNeeds} from '/needs.js?v=invincible-1';
import {nearNatureBuyer,drawNatureBuyer} from '/nature-buyer-world.js?v=people-1';
import {setupNatureBuyer} from '/nature-buyer.js?v=20261108-3';
import {nearNature,drawNature} from '/nature-world.js';
import {setupNature} from '/nature.js';
import {interiorAction} from '/interior-actions.js';
import {setupHarvestBuyer,drawHarvestBuyer} from '/harvest-buyer.js?v=people-1';
import {setupServers} from '/servers.js';
import {setupLockpicking} from '/lockpicking.js';
import {setupDoors} from '/doors.js';
import {drawCityDetails,drawGround,drawTree,drawStreetDetails,drawBuilding,polishVehicle} from '/graphics.js?v=camp-1';
import {setupSupport} from '/support.js';
import {setupEmployment} from '/employment.js';
import {setupPolice} from '/police.js';
import {setupDayNight} from '/day-night.js?v=graphics-2';
import {drawInterior,printerPosition} from '/interiors.js?v=punch-1';
import {setupGPS} from '/gps.js?v=atm-1';
import {setupIllegal} from '/illegal.js?v=install-loading-3';
import {setupVoice} from '/voice.js?v=20261108-quick';
import {setupHousing} from '/housing.js';
import {setupGarage} from '/garage.js?v=nova-front-4';
const $=id=>document.getElementById(id), canvas=$('world'),ctx=canvas.getContext('2d');
let me=null,players=[],messages=[],vehicles=[],buildings=[],world={width:11040,height:8640},stream,lastMove=0,busy=false,connected=false;
const rideButton=document.createElement('button');rideButton.id='ride';rideButton.textContent='Monter · F';rideButton.setAttribute('aria-label','Monter dans un véhicule ou en descendre');$('interact').before(rideButton);
const driveStatus=document.createElement('div');driveStatus.id='driveStatus';driveStatus.textContent='À pied · Location et achat au garage';$('world').parentElement.append(driveStatus);
async function ride(){if(!me)return;try{const data=await api('vehicle');me=data.player;update();toast(me.vehicleId?'Au volant ! Utilise les flèches ou les boutons pour rouler. F / Descendre pour sortir.':'Tu es descendu. Le véhicule reste garé ici.');}catch(err){toast(err.message);}}
rideButton.addEventListener('click',ride);
const vehicleCondition=document.createElement('div');vehicleCondition.id='vehicleCondition';vehicleCondition.hidden=true;vehicleCondition.innerHTML='<span>🚗 État du véhicule</span><progress max="100" value="100"></progress><strong></strong><small></small>';canvas.parentElement.append(vehicleCondition);
function updateVehicleUI(){bicycleButton.textContent=vehicles.some(v=>v.type==='bicycle'&&v.ownerId===me?.id)?'🚲 Ranger le vélo · V':'🚲 Sortir le vélo · V';const v=vehicles.find(v=>v.id===me?.vehicleId);const conditionVehicle=v||vehicles.filter(item=>item.type!=='bicycle'&&item.ownerId===me?.id&&me&&Math.hypot(item.x-me.x,item.y-me.y)<=90).sort((a,b)=>Math.hypot(a.x-me.x,a.y-me.y)-Math.hypot(b.x-me.x,b.y-me.y))[0];repairControl.update(conditionVehicle);vehicleCondition.hidden=!conditionVehicle||conditionVehicle.type==='bicycle';if(conditionVehicle){const health=conditionVehicle.health??100;vehicleCondition.querySelector('progress').value=health;vehicleCondition.querySelector('strong').textContent=health+' %';vehicleCondition.querySelector('small').textContent=health<=0?'En panne · Utilise un kit à pied':health<=30?'Très endommagé · Réparation conseillée':conditionVehicle.name;}rideButton.textContent=v?'Descendre · F':'Monter · F';const near=vehicles.find(v=>!v.driverId&&(!v.ownerId||v.ownerId===me?.id||me?.vehicleAccess?.includes(v.id))&&me&&Math.hypot(v.x-me.x,v.y-me.y)<=75);rideButton.disabled=!me||(!v&&!near);driveStatus.textContent=v?`${v.name} · ${({car:'Rapide',policecar:'Patrouille',firetruck:'Secours',quad:'Tout-terrain',bicycle:'À vélo',scooter:'Agile'}[v.type]||'Véhicule')} · F pour descendre`:near?`${near.name} libre · F pour monter`:'À pied · Rejoins le garage violet pour un véhicule';}
let interiorEntrances=[],residences=[],rentalDistrictInfo={x:2780,y:750,width:1840,height:1400,centerX:3670,centerY:1400};
let garageInfo={x:455,y:520,radius:95};
const keys=new Set(), touch=new Set();
let toastTimer;const toast=text=>{const notice=$('toast');notice.textContent=text;notice.hidden=!text;clearTimeout(toastTimer);if(text)toastTimer=setTimeout(()=>{notice.hidden=true;},6500);};
const repairControl=setupVehicleRepair({panel:vehicleCondition,api,getMe:()=>me,setMe:p=>{me=p;},setVehicles:list=>{vehicles=list;},update:()=>{update();updateVehicleUI();},keys,touch,toast});
const bankUI=setupBank({api,getMe:()=>me,setMe:p=>{me=p;},update,keys,touch,toast});
const trading=setupTrading({api,getMe:()=>me,setMe:p=>{me=p;},update,keys,touch,toast});
const lockpicking=setupLockpicking({api,getMe:()=>me,setMe:p=>{me=p;},update,keys,touch,toast});
const repairsUI=setupRepairs({api,getMe:()=>me,setMe:p=>{me=p;},setVehicles:list=>{vehicles=list;},update,keys,touch,toast});
const bakeryUI=setupBakery({api,getMe:()=>me,setMe:p=>{me=p;},update,keys,touch,toast});
const clothingUI=setupClothing({api,getMe:()=>me,setMe:p=>{me=p;},update,keys,touch,toast});
const medicUI=setupMedic({api,getMe:()=>me,setMe:p=>{me=p;},update,keys,touch,toast});
const natureBuyerUI=setupNatureBuyer({api,getMe:()=>me,setMe:p=>{me=p;},update,keys,touch,toast});
const natureActivities=setupNature({api,getMe:()=>me,keys,touch,toast});
const doors=setupDoors({api,getMe:()=>me,keys,touch,toast});
const serverBrowser=setupServers({keys,touch,toast});
const dayNight=setupDayNight();
const punchUI=setupPunch({api,getMe:()=>me,setMe:p=>{me=p;},toast,canvas});
const needsHUD=setupNeeds({getMe:()=>me,openInventory,api,setMe:p=>{me=p;},refresh:update,stop:()=>{keys.clear();touch.clear();}});
const voice=setupVoice({api,getMe:()=>me,toast});
const interiorButton=document.createElement('button');interiorButton.id='interiorButton';interiorButton.textContent='Entrer · B';$('interact').before(interiorButton);
interiorButton.addEventListener('click',()=>enterInterior());
async function enterInterior(id){if(!me)return;keys.clear();touch.clear();try{const result=await api('interior',{action:me.interior?'exit':'enter',id:typeof id==='string'?id:undefined});me=result.player;housingDialog.close();update();toast(me.interior?'Bienvenue à l’intérieur ! Explore les pièces. B ou Sortir pour revenir dehors.':'Tu es de retour dans la ville.');}catch(err){toast(err.message);}}
function updateInteriorButton(){const nearVilla=me&&interiorEntrances.some(e=>Math.hypot(me.x-e.x,me.y-e.y)<=90),nearHome=me&&residences.some(h=>Math.hypot(me.x-h.x,me.y-h.y)<=90);interiorButton.textContent=me?.interior?'Sortir · B':'Entrer · B';interiorButton.disabled=!me||(!me.interior&&!nearVilla&&!nearHome);}
const doorButton=document.createElement('button');doorButton.id='doorButton';doorButton.hidden=true;canvas.parentElement.append(doorButton);doorButton.addEventListener('click',()=>enterInterior());
function updateDoorButton(){const entrance=me&&!me.interior?interiorEntrances.find(e=>Math.hypot(me.x-e.x,me.y-e.y)<=90):null;doorButton.hidden=!entrance;doorButton.textContent=entrance?(me.vehicleId?'🚗 Garer et entrer · ':'🚪 Entrer · ')+entrance.name:'';}



const police=setupPolice({api,getMe:()=>me,setMe:p=>{me=p;},update,keys,touch,toast});
const gps=setupGPS({getMe:()=>me,getVehicles:()=>vehicles,keys,touch,toast});
const support=setupSupport({api,getMe:()=>me,getModButton:()=>modButton,keys,touch,toast});
const illegal=setupIllegal({api,getMe:()=>me,setMe:p=>{me=p;},update,keys,touch,toast});
const buyer=setupHarvestBuyer({api,getMe:()=>me,setMe:p=>{me=p;},update,keys,touch,toast,openMarket:illegal.openMarket});
const {garageDialog,openGarage}=setupGarage({api,getMe:()=>me,setMe:p=>{me=p;},update,keys,touch,toast,getInfo:()=>garageInfo});
const {housingDialog,openHousing}=setupHousing({api,getMe:()=>me,setMe:p=>{me=p;},update,keys,touch,toast,onEnter:enterInterior});
let authMode='register';
function showAuth(){bankUI.dialog.close();trading.tradeDialog.close();repairsUI.dialog.close();bakeryUI.dialog.close();clothingUI.dialog.close();medicUI.dialog.close();natureBuyerUI.dialog.close();natureActivities.dialog.close();buyer.dialog.close();lockpicking.dialog.close();doors.dialog.close();support.dialog.close();police.dialog.close();gps.dialog.close();mapDialog.close();illegal.dialog.close();voice.stop();stream?.close();garageDialog.close();housingDialog.close();workDialog.close();modDialog.close();modButton.hidden=true;fireButton.hidden=true;armoryDialog.close();inventoryDialog.close();connected=false;me=null;punchUI.update();updateDeliveryPin();needsHUD.update();players=[];keys.clear();touch.clear();$('logout').hidden=true;$('connection').textContent='Connecte-toi pour jouer';if(!$('join').open)$('join').showModal();}
function setAuthMode(mode){authMode=mode;$('emailField').hidden=mode==='login';$('email').required=mode==='register';$('email').disabled=mode==='login';$('registerTab').setAttribute('aria-pressed',String(mode==='register'));$('loginTab').setAttribute('aria-pressed',String(mode==='login'));$('colors').hidden=mode==='login';$('password').autocomplete=mode==='login'?'current-password':'new-password';$('joinButton').textContent=mode==='login'?'Se connecter et jouer ↗':'Créer mon compte et jouer ↗';$('joinError').textContent=mode==='login'?'Retrouve ton personnage et ton argent.':'Garde ton mot de passe : la récupération de compte n’est pas encore disponible.';}
$('registerTab').addEventListener('click',()=>setAuthMode('register'));$('loginTab').addEventListener('click',()=>setAuthMode('login'));
const logout=document.createElement('button');logout.id='logout';logout.textContent='Déconnexion';logout.hidden=true;document.querySelector('header').append(logout);logout.addEventListener('click',async()=>{try{await api('logout');showAuth();setAuthMode('login');toast('Progression sauvegardée. À bientôt !');}catch(err){toast(err.message);}});
async function enter(player){stream?.close();connected=false;me=player;$('password').value='';$('join').close();logout.hidden=false;update();await serverBrowser.choose();try{me=(await api('session')).player;mapFollowing=true;centerMiniMap();update();connect();toast('Bienvenue '+me.name+' ! Ta progression est sauvegardée.');}catch(err){showAuth();setAuthMode('login');$('joinError').textContent=err.message;}}
async function api(path,data={},options={}){const r=await fetch('/api/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:options.signal});const result=await r.json();if(!r.ok){if(r.status===401&&!['register','login','session'].includes(path))showAuth();const error=Error(result.error||'Connexion interrompue');error.status=r.status;throw error;}return result;}
function update(){punchUI.update();updateDeliveryPin();needsHUD.update();if(!me)return;support.update();police.update();modButton.hidden=!me.isModerator;fireButton.hidden=!(me.career==='police'&&me.policeWeapon);fireButton.textContent='Tirer · '+(me.ammo||0)+'/12';$('playerName').textContent=me.name;$('avatar').textContent=me.name[0].toUpperCase();$('avatar').style.color=me.color;$('money').textContent=me.money+' $';document.querySelector('.reward span').textContent='Rémunération par mission';$('missionText').textContent=me.job?'Colis récupéré ! Livre-le au point bleu, devant le commissariat.':'Rejoins le dépôt jaune pour récupérer un colis.';if(me.career&&employmentInfo){const c=employmentInfo.careers.find(c=>c.id===me.career);if(c){document.querySelector('.mission h2').textContent=c.name;$('missionText').textContent=me.workActive?c.task+' · Ouvre Métiers sur place.':'Rejoins le Pôle emploi pour prendre une mission.';document.querySelector('.reward strong').textContent='+'+c.reward+' $';if(['dealer','grower'].includes(c.id)){$('missionText').textContent='Achète tes fournitures au marché, cultive dans ton logement, puis revends ta récolte.';document.querySelector('.reward span').textContent='Revente par récolte';}}}$('progress').style.width=me.job?'55%':'10%';$('interact').textContent=nearATM(me)?'Banque · E':nearHarvestBuyer(me)?'Parler à Milo · E':nearVehicleDealer(me)?'Parler à '+findVehicleDealer(me).shortName+' · E':nearMechanic(me)?'Mécanicien · E':nearBakery(me)?'Boulangerie · E':nearClothing(me)?'Vêtements · E':nearMedic(me)?'Se soigner · E':nearNatureBuyer(me)?'Parler à Hugo · E':nearNature(me)?(nearNature(me).type==='wood'?'Couper du bois · E':'Cueillir · E'):me.interior?interiorAction(me).label:interiorEntrances.some(e=>Math.hypot(me.x-e.x,me.y-e.y)<=90)?(me.vehicleId?'Garer et entrer · E':'Entrer · E'):nearIllegalMarket()?'Boutique · E':nearEmployment()?'Pôle emploi · E':nearFireStation()?'Caserne · E':atWorkObjective()?'Mission · E':me.job?'Livrer · E':'Interagir · E';}
function connect(){stream?.close();stream=new EventSource('/events');stream.addEventListener('trade',trading.receive);stream.addEventListener('support-alert',support.receiveAlert);stream.addEventListener('support-update',support.receiveUpdate);stream.addEventListener('voice-signal',e=>{try{voice.receive(JSON.parse(e.data));}catch{}});stream.onopen=()=>{connected=true;$('connection').textContent='Connecté à Nova City';};stream.onerror=()=>{connected=false;$('connection').textContent='Reconnexion en cours…';api('session').catch(()=>{showAuth();setAuthMode('login');});};stream.onmessage=e=>{const state=JSON.parse(e.data);voice.sync(state.voice||[]);players=state.players;vehicles=state.vehicles||[];me=players.find(p=>p.id===me?.id)||me;update();updateVehicleUI();$('count').textContent=players.length+' en ligne';if(JSON.stringify(messages)!==JSON.stringify(state.messages)){messages=state.messages;$('messages').replaceChildren(...messages.map(m=>{const p=document.createElement('p'),name=document.createElement('strong');name.textContent=m.name;p.append(name,document.createTextNode(m.text));return p;}));$('messages').scrollTop=$('messages').scrollHeight;}};}
$('join').addEventListener('cancel',e=>e.preventDefault());
$('joinForm').addEventListener('submit',async e=>{e.preventDefault();$('joinButton').disabled=true;try{const data=await api(authMode,{name:$('name').value,email:$('email').value,password:$('password').value,color:new FormData(e.target).get('color')});await enter(data.player);}catch(err){$('joinError').textContent=err.message;}finally{$('joinButton').disabled=false;}});
$('chat').addEventListener('submit',async e=>{e.preventDefault();if(!me)return toast('Entre dans la ville pour discuter.');try{await api('chat',{text:$('message').value});$('message').value='';}catch(err){toast(err.message);}});
function nearIllegalMarket(){return !!(me&&Math.hypot(me.x-1150,me.y-630)<=85);}
function nearOwnCulture(){return !!(me&&illegal.isTrade()&&residences.some(h=>Math.hypot(me.x-h.x,me.y-h.y)<=90));}
function nearFireStation(){return !!(me&&Math.hypot(me.x-680,me.y-990)<=85);}
function nearEmployment(){return !!(me&&employmentInfo&&Math.hypot(me.x-employmentInfo.x,me.y-employmentInfo.y)<=employmentInfo.radius);}
function atWorkObjective(){const c=employmentInfo?.careers.find(c=>c.id===me?.career);return !!(c&&me.workActive&&Math.hypot(me.x-c.x,me.y-c.y)<=85);}
const plantActionButton=document.createElement('button');plantActionButton.id='plantActionButton';plantActionButton.hidden=true;canvas.parentElement.append(plantActionButton);plantActionButton.addEventListener('click',()=>illegal.openCultivation());
function refreshPlantInteraction(){const available=!!me?.interior&&me.interiorEquipment?.some(e=>e.type==='plant'&&e.canManage);plantActionButton.hidden=!available;if(available){const action=interiorAction(me);plantActionButton.textContent=action.type==='culture'?'🌿 Gérer mes plantes · E':'🌿 Ouvrir mes cultures';}if(me?.interior)$('interact').textContent=interiorAction(me).label;}
function nearInstalledPrinter(){if(!me?.interior||!me.interiorEquipment?.some(e=>e.type==='printer'&&e.canManage))return false;const q=printerPosition(me.interior.kind);return Math.hypot(me.ix-q.x-50,me.iy-q.y-35)<=120;}
async function interact(){if(!me)return;if(nearATM(me))return bankUI.open();if(nearHarvestBuyer(me))return buyer.open();if(nearVehicleDealer(me))return openGarage();if(nearMechanic(me))return repairsUI.open();if(nearBakery(me))return bakeryUI.open();if(nearClothing(me))return clothingUI.open();if(nearMedic(me))return medicUI.open();if(nearNatureBuyer(me))return natureBuyerUI.open();if(nearNature(me))return natureActivities.open();if(me.interior){const action=interiorAction(me);if(action.type==='culture')return illegal.openCultivation();if(action.type==='printer')return illegal.openPrinter();if(action.type==='exit')return enterInterior();return toast('Approche-toi d’une plante, de l’imprimante ou de la porte. B permet aussi de sortir.');}if(!me.interior&&Math.hypot(me.x-garageInfo.x,me.y-garageInfo.y)<=garageInfo.radius&&!atWorkObjective())return openGarage();if(interiorEntrances.some(e=>Math.hypot(me.x-e.x,me.y-e.y)<=90))return enterInterior();if(nearIllegalMarket())return illegal.openMarket();if(nearOwnCulture()&&!nearEmployment()&&!nearFireStation())return illegal.openCultivation();const nearestHome=residences.filter(h=>Math.hypot(me.x-h.x,me.y-h.y)<=90).sort((a,b)=>Math.hypot(me.x-a.x,me.y-a.y)-Math.hypot(me.x-b.x,me.y-b.y))[0];if(nearestHome&&!nearEmployment()&&!nearFireStation())return openHousing(nearestHome.id);if(nearEmployment()||nearFireStation()||atWorkObjective())return openEmployment();try{const before=me.job,data=await api('interact');me=data.player;update();toast(before?'Livraison réussie ! +75 $. Retourne au dépôt pour une autre mission.':'Colis récupéré. Direction le point bleu au nord-est !');}catch(err){toast(err.message);}}
$('interact').addEventListener('click',interact);$('help').addEventListener('click',()=>toast('Flèches / ZQSD / boutons pour marcher ou rouler. F / Monter près d’un véhicule, F pour descendre. E pour interagir. J, Espace ou clic dans la ville pour frapper.'));

let employmentInfo=null;
const {workDialog,openEmployment}=setupEmployment({api,getMe:()=>me,setMe:p=>{me=p;},setEmployment:e=>{employmentInfo=e;},update,keys,touch,toast});

const modButton=document.createElement('button');modButton.id='modButton';modButton.textContent='🛡 Modération';modButton.hidden=true;document.querySelector('header').append(modButton);
const modDialog=document.createElement('dialog');modDialog.id='modDialog';modDialog.innerHTML='<div class="garage-top"><h2>Modération</h2><button id="closeMod" aria-label="Fermer la modération">×</button></div><p>Expulsion : le joueur peut se reconnecter. Muet : chat bloqué pendant 10 minutes.</p><button id="refreshMod">Actualiser</button><p id="modNotice" role="status"></p><h3>Joueurs connectés</h3><div id="modPlayers"></div><h3>Messages du quartier</h3><div id="modMessages"></div><h3>Actions récentes du serveur</h3><div id="modHistory"></div>';document.body.append(modDialog);support.mountModeration(modDialog);
$('closeMod').addEventListener('click',()=>modDialog.close());$('refreshMod').addEventListener('click',()=>{loadModeration();support.refreshModeration();});
modButton.addEventListener('click',async()=>{keys.clear();touch.clear();if(await loadModeration()){modDialog.showModal();support.refreshModeration();}});
async function loadModeration(action,id){try{const result=await api('moderation',{action,id});$('modPlayers').replaceChildren();$('modMessages').replaceChildren();$('modHistory').replaceChildren();
 for(const player of result.players){const row=document.createElement('article');row.className='garage-card';const label=document.createElement('p');label.textContent=player.name+(player.isModerator?' · Modérateur':player.mutedUntil>Date.now()?' · Muet':'');row.append(label);
 if(!player.isModerator)for(const [title,command] of [['Expulser','kick'],[player.mutedUntil>Date.now()?'Rendre la parole':'Muet 10 min',player.mutedUntil>Date.now()?'unmute':'mute']]){const button=document.createElement('button');button.textContent=title;button.addEventListener('click',()=>loadModeration(command,player.id));row.append(button);}$('modPlayers').append(row);}
 for(const message of result.messages){const row=document.createElement('article');row.className='garage-card';const text=document.createElement('p');text.textContent=message.name+' : '+message.text;const remove=document.createElement('button');remove.textContent='Supprimer ce message';remove.addEventListener('click',()=>loadModeration('deleteMessage',message.id));row.append(text,remove);$('modMessages').append(row);}
 if(!result.messages.length)$('modMessages').textContent='Aucun message.';
 const names={kick:'Expulsion',mute:'Muet 10 min',unmute:'Parole rétablie',deleteMessage:'Message supprimé'};for(const entry of result.history){const p=document.createElement('p');p.textContent=new Date(entry.at).toLocaleTimeString('fr-FR')+' · '+names[entry.action]+' · '+entry.target;$('modHistory').append(p);}
 $('modNotice').textContent=action?'Action appliquée.':'';return true;
 }catch(e){$('modNotice').textContent=e.message;toast(e.message);return false;}}


const armoryButton=document.createElement('button');armoryButton.id='armoryButton';armoryButton.textContent='👮 Armurerie';canvas.parentElement.append(armoryButton);
const armoryDialog=document.createElement('dialog');armoryDialog.innerHTML='<div class="garage-top"><h2>Armurerie de police</h2><button id="closeArmory" aria-label="Fermer l’armurerie">×</button></div><p>Distributeur devant le commissariat (800, 335). Réservé aux policiers à pied. Arme de service avec chargeur de 12 cartouches. Le tir est visuel dans cette version, sans dégâts aux joueurs.</p><button id="equipPolice">Prendre / recharger l’arme de service</button><button id="returnPolice">Rendre l’arme</button><p id="armoryMessage" role="status"></p>';document.body.append(armoryDialog);
$('closeArmory').addEventListener('click',()=>armoryDialog.close());armoryButton.addEventListener('click',()=>{if(!me)return toast('Connecte-toi pour accéder au distributeur.');keys.clear();touch.clear();$('armoryMessage').textContent='Équipement : '+(me.policeWeapon?'arme de service · '+me.ammo+'/12':'aucune arme');armoryDialog.showModal();});
for(const [id,action] of [['equipPolice','equip'],['returnPolice','return']])$(id).addEventListener('click',async()=>{try{me=(await api('armory',{action})).player;update();$('armoryMessage').textContent=me.policeWeapon?'Arme de service équipée · 12/12 cartouches.':'Arme rendue au distributeur.';}catch(e){$('armoryMessage').textContent=e.message;}});
const fireButton=document.createElement('button');fireButton.id='fireButton';fireButton.hidden=true;$('interact').before(fireButton);let shotUntil=0;
fireButton.addEventListener('click',async()=>{try{me=(await api('fire')).player;shotUntil=performance.now()+160;update();}catch(e){toast(e.message);}});


const inventoryButton=document.createElement('button');inventoryButton.id='inventoryButton';inventoryButton.textContent='🎒 Inventaire · I';canvas.parentElement.append(inventoryButton);
const inventoryDialog=document.createElement('dialog');inventoryDialog.id='inventoryDialog';inventoryDialog.innerHTML='<div class="garage-top"><span class="eyebrow">🎒 TON INVENTAIRE</span><button id="closeInventory" aria-label="Fermer l’inventaire">×</button></div><h2>Les affaires de ton personnage.</h2><p id="inventoryBalance"></p><div id="inventoryItems"></div><p id="inventoryNotice" role="status"></p><small>Les objets consommables sont sauvegardés. Tes clés et ton équipement suivent tes possessions et ton métier. L’eau hydrate, les pommes et les barres de céréales nourrissent et rendent un peu de vie.</small>';document.body.append(inventoryDialog);
$('closeInventory').addEventListener('click',()=>inventoryDialog.close());inventoryButton.addEventListener('click',openInventory);
async function openInventory(){if(!me)return toast('Connecte-toi pour ouvrir ton inventaire.');keys.clear();touch.clear();if(await refreshInventory())inventoryDialog.showModal();}
async function refreshInventory(id,doorAction){try{const data=await api('inventory',id?{action:'use',id,doorAction}:{});if(data.vehicles)vehicles=data.vehicles;if(data.player){me=data.player;update();}$('inventoryBalance').textContent='Argent : '+data.money+' $ · '+data.items.length+' types d’objets';$('inventoryItems').replaceChildren();
 for(const item of data.items){const card=document.createElement('article');card.className='inventory-item';const title=document.createElement('h3');title.textContent=item.icon+' '+item.name+' ×'+item.quantity;const desc=document.createElement('p');desc.textContent=item.description;card.append(title,desc);if(item.usable){const button=document.createElement('button');button.textContent=item.actionLabel||(['water','juice'].includes(item.id)?'Boire':['snack','apple','bread','croissant','sandwich'].includes(item.id)?'Manger':'Consommer');button.addEventListener('click',async()=>{button.disabled=true;if(!await refreshInventory(item.id,item.doorAction))button.disabled=false;});card.append(button);}$('inventoryItems').append(card);}
 $('inventoryNotice').textContent=data.message||'';return true;
 }catch(e){$('inventoryNotice').textContent=e.message;toast(e.message);return false;}}


const bicycleButton=document.createElement('button');bicycleButton.id='bicycleButton';bicycleButton.textContent='🚲 Sortir le vélo · V';$('interact').before(bicycleButton);let bicycleBusy=false;
async function toggleBicycle(){if(!me)return toast('Connecte-toi pour prendre ton vélo gratuit.');if(bicycleBusy)return;bicycleBusy=true;bicycleButton.disabled=true;try{const own=vehicles.find(v=>v.type==='bicycle'&&v.ownerId===me.id);const result=await api('bicycle',{action:own?'store':'take'});me=result.player;vehicles=result.vehicles;updateVehicleUI();toast(own?'Vélo rangé. Tu peux le ressortir quand tu veux.':'Tu es sur ton vélo ! F pour descendre, V pour le ranger.');}catch(e){toast(e.message);}finally{bicycleBusy=false;bicycleButton.disabled=false;}}
bicycleButton.addEventListener('click',toggleBicycle);

const movement=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','z','q'];
addEventListener('keydown',e=>{if(me?.respawnAt||bankUI.dialog.open||document.querySelector('.mobile-dialog[open]')||document.getElementById('startupSplash')?.open||e.target.closest('#miniMap')||e.target.matches('input,textarea')||$('join').open||trading.tradeDialog.open||repairsUI.dialog.open||bakeryUI.dialog.open||clothingUI.dialog.open||medicUI.dialog.open||natureBuyerUI.dialog.open||natureActivities.dialog.open||buyer.dialog.open||serverBrowser.dialog.open||lockpicking.dialog.open||doors.dialog.open||garageDialog.open||housingDialog.open||workDialog.open||modDialog.open||armoryDialog.open||inventoryDialog.open||illegal.dialog.open||mapDialog.open||gps.dialog.open||police.dialog.open||support.dialog.open)return;const key=e.key.length===1?e.key.toLowerCase():e.key;if(movement.includes(key)){e.preventDefault();keys.add(key);}if(key==='p'&&!e.repeat){e.preventDefault();police.open();}if(key==='n'&&!e.repeat){e.preventDefault();gps.open();}if(key==='v'&&!e.repeat){e.preventDefault();toggleBicycle();}if(key==='i'&&!e.repeat){e.preventDefault();openInventory();}if(key==='e'&&!e.repeat)interact();if(key==='f'&&!e.repeat)ride();if(key==='g'&&!e.repeat)openGarage();if(key==='h'&&!e.repeat)openHousing();if(key==='b'&&!e.repeat)enterInterior();});
addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));addEventListener('blur',()=>{keys.clear();touch.clear();});
for(const button of document.querySelectorAll('[data-dir]')){button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);touch.add(button.dataset.dir);});for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>touch.delete(button.dataset.dir));}
function direction(){if(me?.respawnAt||me?.cuffed)return {dx:0,dy:0};return {dx:Number(keys.has('ArrowRight')||keys.has('d')||touch.has('right'))-Number(keys.has('ArrowLeft')||keys.has('a')||keys.has('q')||touch.has('left')),dy:Number(keys.has('ArrowDown')||keys.has('s')||touch.has('down'))-Number(keys.has('ArrowUp')||keys.has('w')||keys.has('z')||touch.has('up'))};}
function rect(x,y,w,h,color,r=0){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function text(t,x,y,size=12,color='#fff',align='center'){ctx.font=`700 ${size}px system-ui`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(t,x,y);}
function circle(x,y,r,c){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();}
let renderView=null;function tree(x,y,size=21){if(renderView&&(x<renderView.x-70||x>renderView.x+renderView.w+70||y<renderView.y-70||y>renderView.y+renderView.h+70))return;drawTree(ctx,x,y,size);}
function marker(x,y,color,label){circle(x,y,30,color+'18');circle(x,y,21,color+'26');circle(x,y,11,color);text('↓',x,y+4,14,'#233b3c');rect(x-61,y+25,122,23,'#1b333de8',7);text(label,x,y+40,9,'#eef3e5');}

const miniMap=document.createElement('section');miniMap.id='miniMap';miniMap.setAttribute('aria-label','Mini-carte des bâtiments');
const mapTitle=document.createElement('div');mapTitle.className='map-title';mapTitle.textContent='NOVA CITY · BÂTIMENTS';
const mapCenter=document.createElement('button');mapCenter.textContent='◎';mapCenter.title='Centrer sur mon personnage';mapCenter.setAttribute('aria-label','Centrer sur mon personnage');mapTitle.append(mapCenter);
const mapScroll=document.createElement('div');mapScroll.className='map-scroll';mapScroll.tabIndex=0;mapScroll.setAttribute('aria-label','Carte : faire défiler pour explorer tous les bâtiments');
const mapContent=document.createElement('div');mapContent.className='map-content';mapScroll.append(mapContent);
const mapHint=document.createElement('small');mapHint.textContent='↔ ↕ Fais défiler pour explorer la ville';miniMap.append(mapTitle,mapScroll,mapHint);canvas.parentElement.append(miniMap);
const mapPlayer=document.createElement('span');mapPlayer.className='map-player';mapPlayer.textContent='● TOI';
let mapScale=.28,mapFollowing=true,mapDrag=null;
const mapZoomOut=document.createElement('button'),mapZoomIn=document.createElement('button');mapZoomOut.textContent='−';mapZoomOut.setAttribute('aria-label','Dézoomer la mini-carte');mapZoomIn.textContent='+';mapZoomIn.setAttribute('aria-label','Zoomer la mini-carte');mapTitle.insertBefore(mapZoomOut,mapCenter);mapTitle.insertBefore(mapZoomIn,mapCenter);
function setMapZoom(factor){mapScale=Math.max(.015,Math.min(.6,mapScale*factor));fillMiniMap();}
mapZoomOut.addEventListener('click',()=>setMapZoom(1/1.4));mapZoomIn.addEventListener('click',()=>setMapZoom(1.4));
function setMapFollowing(value){mapFollowing=value;mapCenter.setAttribute('aria-pressed',String(value));mapHint.textContent=value?'Suivi actif · Glisse la carte pour explorer':'Exploration · ◎ pour suivre ton personnage';}
mapScroll.addEventListener('pointerdown',e=>{if(e.button!==0)return;setMapFollowing(false);keys.clear();touch.clear();mapDrag={id:e.pointerId,x:e.clientX,y:e.clientY,left:mapScroll.scrollLeft,top:mapScroll.scrollTop};mapScroll.setPointerCapture(e.pointerId);});
mapScroll.addEventListener('pointermove',e=>{if(mapDrag&&mapDrag.id===e.pointerId){mapScroll.scrollLeft=mapDrag.left+mapDrag.x-e.clientX;mapScroll.scrollTop=mapDrag.top+mapDrag.y-e.clientY;}});
for(const event of ['pointerup','pointercancel','lostpointercapture'])mapScroll.addEventListener(event,()=>{mapDrag=null;});
mapScroll.addEventListener('wheel',()=>setMapFollowing(false),{passive:true});mapScroll.addEventListener('keydown',e=>{if(e.key.startsWith('Arrow')){setMapFollowing(false);e.stopPropagation();}});
new ResizeObserver(()=>{if(mapFollowing)centerMiniMap();}).observe(mapScroll);
function buildingIcon(name){
 if(/CLANDESTIN/.test(name))return '🕶️';if(/CASERNE/.test(name))return '🚒';if(/PÔLE EMPLOI/.test(name))return '💼';if(/COMMISSARIAT/.test(name))return '👮';if(/HÔPITAL/.test(name))return '🏥';if(/GARAGE|ATELIER/.test(name))return '🔧';
 if(/CAFÉ/.test(name))return '☕';if(/BOULANGERIE/.test(name))return '🥐';if(/MARCHÉ|HALLES/.test(name))return '🛒';
 if(/BIBLIOTHÈQUE/.test(name))return '📚';if(/CINÉMA/.test(name))return '🎬';if(/MUSIQUE/.test(name))return '🎵';
 if(/CAMPUS/.test(name))return '🎓';if(/SPORTIVE/.test(name))return '⚽';if(/MAIRIE/.test(name))return '🏛️';
 if(/RÉSIDENCE|VILLA|TERRASSES|JARDINS|LILAS/.test(name))return '🏠';return '🏢';
}
function fillMiniMap(){
 mapContent.style.backgroundSize=(920*mapScale)+'px '+(360*mapScale)+'px';mapContent.style.width=world.width*mapScale+'px';mapContent.style.height=world.height*mapScale+'px';mapContent.replaceChildren();
 for(const b of buildings){const label=document.createElement('div');label.className='map-building';label.style.left=b.x*mapScale+'px';label.style.top=b.y*mapScale+'px';label.style.width=b.w*mapScale+'px';label.style.height=b.h*mapScale+'px';label.style.borderColor=b.color;label.textContent=buildingIcon(b.name)+' '+b.name;mapContent.append(label);}
 for(const [x,y,label] of [[harvestBuyer.x,harvestBuyer.y,'🌿 MILO · ACHETEUR'],[1150,2020,'🚗 LÉO · GARAGE CENTRAL'],[vehicleDealer.x,vehicleDealer.y,'🚗 SAM · VÉHICULES'],[mechanic.x,mechanic.y,'🔧 ALEX · AIRE DE RÉPARATION'],[2070,2020,'🥐 NORA · BOULANGERIE'],[1250,320,'🩺 DR LÉA · SOINS'],[1370,1320,'🪵 HUGO · BOIS & POMMES'],[1060,1210,'🌳 BOIS DE NOVA'],[1070,1320,'🍎 VERGER DE NOVA'],...atms.map(a=>[a.x,a.y,'🏧 ATM']),[caravanCamp.entrance.x,caravanCamp.entrance.y,'🏕️ CAMP DES VOYAGEURS'],[455,700,'📦 DÉPÔT COLIS'],[800,335,'👮 ARMURERIE'],[680,990,'🚒 CASERNE · E'],[rentalDistrictInfo.centerX,rentalDistrictInfo.y+45,'🏘️ QUARTIER DES LILAS']]){const pin=document.createElement('span');pin.className='map-pin';pin.style.left=x*mapScale+'px';pin.style.top=y*mapScale+'px';pin.textContent=label;mapContent.append(pin);}
 updateDeliveryPin();mapContent.append(mapPlayer);gps.attachMini(mapContent,mapScale);centerMiniMap();setMapFollowing(mapFollowing);
}
// Delivery guidance belongs to the local player's active parcel, never to nearby players.
function updateDeliveryPin(){
 const existing=mapContent.querySelector('[data-delivery-pin]');
 if(!me?.job){existing?.remove();return;}
 const pin=existing||document.createElement('span');pin.dataset.deliveryPin='true';pin.className='map-pin';pin.style.left=680*mapScale+'px';pin.style.top=335*mapScale+'px';pin.textContent='📍 TA LIVRAISON';if(!existing)mapContent.append(pin);
}
function centerMiniMap(){const p=me||{x:455,y:460};mapScroll.scrollLeft=p.x*mapScale-mapScroll.clientWidth/2;mapScroll.scrollTop=p.y*mapScale-mapScroll.clientHeight/2;}
mapCenter.addEventListener('click',()=>{setMapFollowing(true);centerMiniMap();});

const mapDialog=document.createElement('dialog');mapDialog.id='mapDialog';mapDialog.setAttribute('aria-label','Grande carte de Nova City');
const mapHeader=document.createElement('div');mapHeader.className='large-map-header';const mapHeading=document.createElement('h2');mapHeading.textContent='Carte de Nova City';
const mapOverview=document.createElement('button');mapOverview.textContent='Vue de toute la ville';const mapClose=document.createElement('button');mapClose.textContent='Fermer · M / Échap';mapHeader.append(mapHeading,mapOverview,mapClose);const mapLilas=document.createElement('button');mapLilas.textContent='🏘️ Quartier des Lilas';mapHeader.insertBefore(mapLilas,mapClose);mapLilas.addEventListener('click',()=>{setMapFollowing(false);mapScale=.28;fillMiniMap();mapScroll.scrollLeft=3670*mapScale-mapScroll.clientWidth/2;mapScroll.scrollTop=1400*mapScale-mapScroll.clientHeight/2;});mapDialog.append(mapHeader);document.body.append(mapDialog);
const mapExpand=document.createElement('button');mapExpand.id='mapExpand';mapExpand.textContent='⛶';mapExpand.title='Ouvrir la grande carte · M';mapExpand.setAttribute('aria-label','Agrandir la carte · M');mapTitle.append(mapExpand);
const headerMapButton=document.createElement('button');headerMapButton.id='headerMapButton';headerMapButton.textContent='🗺 Carte · M';headerMapButton.type='button';document.querySelector('header').append(headerMapButton);headerMapButton.addEventListener('click',openLargeMap);
const authMapButton=document.createElement('button');authMapButton.id='authMapButton';authMapButton.type='button';authMapButton.textContent='🗺 Ouvrir la grande carte';$('joinForm').prepend(authMapButton);authMapButton.addEventListener('click',openLargeMap);
let mapReturnFocus=null;let smallMapState=null;
function openLargeMap(){
 if(!document.body.classList.contains('mobile-play')){location.assign('/carte');return;}
 if(mapDialog.open)return;keys.clear();touch.clear();mapReturnFocus=document.activeElement;smallMapState={scale:mapScale,following:mapFollowing,left:mapScroll.scrollLeft,top:mapScroll.scrollTop};mapDialog.append(miniMap);miniMap.hidden=false;mapExpand.hidden=true;mapDialog.showModal();setMapFollowing(true);fillMiniMap();
}
function closeLargeMap(){mapDialog.close();}
mapExpand.addEventListener('click',openLargeMap);mapClose.addEventListener('click',closeLargeMap);
mapDialog.addEventListener('close',()=>{canvas.parentElement.append(miniMap);mapExpand.hidden=false;keys.clear();touch.clear();mapDrag=null;if(smallMapState){mapScale=smallMapState.scale;mapFollowing=smallMapState.following;fillMiniMap();if(!mapFollowing){mapScroll.scrollLeft=smallMapState.left;mapScroll.scrollTop=smallMapState.top;}smallMapState=null;}if(mapReturnFocus?.isConnected)mapReturnFocus.focus();else mapExpand.focus();});
mapOverview.addEventListener('click',()=>{setMapFollowing(false);mapScale=Math.max(.015,Math.min((mapScroll.clientWidth-16)/world.width,(mapScroll.clientHeight-16)/world.height));fillMiniMap();mapScroll.scrollLeft=0;mapScroll.scrollTop=0;});
addEventListener('keydown',e=>{if(me?.respawnAt||bankUI.dialog.open||document.querySelector('.mobile-dialog[open]')||document.getElementById('startupSplash')?.open||e.key.toLowerCase()!=='m'||e.repeat||e.target.matches('input,textarea'))return;if(mapDialog.open){e.preventDefault();closeLargeMap();return;}if(garageDialog.open||housingDialog.open||workDialog.open||modDialog.open||armoryDialog.open||inventoryDialog.open||illegal.dialog.open)return;e.preventDefault();openLargeMap();});


function advancePlayer(time){ if(me&&connected&&time-lastMove>65&&!busy){const dir=direction();lastMove=time;busy=true;api('move',dir).then(data=>{me=data.player;needsHUD.update();if(data.vehicles)vehicles=data.vehicles;}).catch(err=>{connected=false;toast(err.message);}).finally(()=>busy=false);}}
function draw(time){dayNight.update();gps.tick(time);
 if(me&&mapFollowing)centerMiniMap();if(me){mapPlayer.style.left=me.x*mapScale+'px';mapPlayer.style.top=me.y*mapScale+'px';mapPlayer.hidden=false;}else mapPlayer.hidden=true;const box=canvas.getBoundingClientRect(),w=box.width,h=box.height,dpr=Math.min(devicePixelRatio||1,2);if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);updateInteriorButton();updateDoorButton();refreshPlantInteraction();miniMap.hidden=!!me?.interior&&!mapDialog.open;if(me?.interior){drawInterior(ctx,w,h,me,players);advancePlayer(time);requestAnimationFrame(draw);return;}
 const scale=w<500?.85:Math.min(w/820,1.1),focus=me||{x:455,y:460};const cameraX=Math.max(0,Math.min(world.width-w/scale,focus.x-w/scale/2)),cameraY=Math.max(0,Math.min(world.height-h/scale,focus.y-h/scale/2));ctx.save();ctx.scale(scale,scale);ctx.translate(-cameraX,-cameraY);
 renderView={x:cameraX,y:cameraY,w:w/scale,h:h/scale};drawGround(ctx,world);
 rect(rentalDistrictInfo.x,rentalDistrictInfo.y,rentalDistrictInfo.width,rentalDistrictInfo.height,'#a8bd9e',18);
 // Sidewalks and boulevards.
 rect(375,0,160,1080,'#c5c5b5');rect(0,292,920,125,'#c5c5b5');rect(0,647,920,125,'#c5c5b5');rect(398,0,114,1080,'#677779');rect(0,313,920,82,'#677779');rect(0,669,920,82,'#677779');
 ctx.setLineDash([13,17]);ctx.strokeStyle='#c7cbb2';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(455,0);ctx.lineTo(455,1080);ctx.stroke();ctx.setLineDash([]);
 for(const y of [318,380,674,736])for(let x=402;x<510;x+=18)rect(x,y,10,9,'#e1e0c7');
 // Connected avenues extend across every district.
 for(let x=455;x<world.width;x+=920){rect(x-80,0,160,world.height,'#c5c5b5');rect(x-57,0,114,world.height,'#677779');ctx.setLineDash([13,17]);ctx.strokeStyle='#c7cbb2';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,world.height);ctx.stroke();ctx.setLineDash([]);}
 for(const y of [354,...Array.from({length:Math.ceil(world.height/360)-1},(_,i)=>710+i*360)]){rect(0,y-62,world.width,124,'#c5c5b5');rect(0,y-41,world.width,82,'#677779');for(let x=455;x<world.width;x+=920)for(const offset of [-37,25])for(let xx=x-53;xx<x+55;xx+=18)rect(xx,y+offset,10,9,'#e1e0c7');}
 drawNature(ctx,me);drawRepairArea(ctx);
 drawStreetDetails(ctx,{x:cameraX,y:cameraY,w:w/scale,h:h/scale},world);
 text('QUARTIER DES LILAS · LOGEMENTS À LOUER',rentalDistrictInfo.centerX,rentalDistrictInfo.y+45,16,'#35503e');
 // A public garden occupies the eastern district.
 rect(1920,1140,740,190,'#7b9b78',22);rect(1950,1220,680,26,'#d7cbaa',8);circle(2295,1233,48,'#d6d4be');circle(2295,1233,37,'#75b9c7');circle(2295,1233,23,'#99d0d4');text('JARDIN DES RENCONTRES',2295,1178,15,'#314c3f');
 for(let column=0;column<world.width/920;column++)for(const y of Array.from({length:Math.ceil(world.height/360)},(_,i)=>i===0?50:90+i*360)){tree(45+column*920,y);tree(865+column*920,y);}
 for(const [label,x,y]of [['CENTRE HISTORIQUE',455,60],['QUARTIER DES ARTS',1375,60],['NOVA EST',2295,60],['LES JARDINS',2295,1540],['QUARTIER UNIVERSITAIRE',1375,1540],['NOVA SUD',455,1540]])text(label,x,y,12,'#42614e');
 drawCityDetails(ctx,renderView,world,buildings);drawCaravanCamp(ctx,renderView);drawATMs(ctx,renderView,me);
 for(const b of buildings){if(b.x+b.w<cameraX-30||b.y+b.h<cameraY-30||b.x>cameraX+w/scale+30||b.y>cameraY+h/scale+30)continue;drawBuilding(ctx,b);}
 for(const [x,y]of [[52,67],[48,220],[867,85],[865,238],[42,472],[48,602],[871,487],[869,596],[50,843],[865,880],[200,1010],[650,1010],[330,47],[580,47]])tree(x,y);
 for(const [x,y]of [[325,442],[569,601],[120,262],[790,927]]){rect(x,y,33,9,'#886f56',2);rect(x+3,y+9,4,7,'#45504b');rect(x+26,y+9,4,7,'#45504b');}
 gps.drawWorld(ctx);
 for(const v of vehicles){
  ctx.save();ctx.translate(v.x,v.y);ctx.rotate(v.angle);
  if(v.type==='car'||v.type==='policecar'){
   rect(-18,-25,40,58,'#13232d44',10);rect(-18,-17,5,12,'#24313b',2);rect(13,-17,5,12,'#24313b',2);rect(-18,11,5,12,'#24313b',2);rect(13,11,5,12,'#24313b',2);
   rect(-15,-28,30,56,v.color,7);rect(-11,-15,22,12,'#2f5368',3);rect(-11,10,22,10,'#2f5368',3);rect(-10,-1,20,10,v.color,2);rect(-12,-27,6,4,'#fff2bb',1);rect(6,-27,6,4,'#fff2bb',1);rect(-12,24,5,3,'#e76e65',1);rect(7,24,5,3,'#e76e65',1);
   if(v.type==='policecar'){rect(-15,-2,30,9,'#3279b8',1);text('POLICE',0,5,6,'#fff');rect(-10,-9,10,5,Math.floor(time/250)%2?'#64b9ff':'#22518d',1);rect(0,-9,10,5,Math.floor(time/250)%2?'#a33738':'#ff6969',1);}
  }else if(v.type==='firetruck'){
   for(const x of [-23,16])for(const y of [-26,17])rect(x,y,7,16,'#1d2931',2);rect(-20,-40,40,80,'#dc3038',5);rect(-16,-31,32,14,'#324e63',3);rect(-20,-8,40,5,'#fff2c7');rect(-14,1,28,32,'#8c252b',2);rect(-10,1,3,33,'#c9d2d9');rect(7,1,3,33,'#c9d2d9');for(let y=4;y<33;y+=7)rect(-10,y,20,2,'#c9d2d9');rect(-14,-39,8,4,'#fff0b0');rect(6,-39,8,4,'#fff0b0');rect(-13,-15,26,5,Math.floor(time/250)%2?'#80caff':'#295c99',1);
  }else if(v.type==='bicycle'){
   rect(-3,-29,6,18,'#26313a',3);rect(-3,14,6,18,'#26313a',3);rect(-2,-15,4,34,'#67c8ed',2);rect(-13,-12,26,3,'#26313a',2);rect(-7,7,14,7,'#26313a',3);if(v.driverId){const rider=players.find(p=>p.id===v.driverId);drawCharacter(ctx,rider||{},0,0,{rider:true});}
  }else if(v.type==='quad'){
   for(const x of [-19,10])for(const y of [-20,10])rect(x,y,9,14,'#1e2930',3);rect(-13,-22,26,44,v.color,5);rect(-9,-17,18,8,'#ffedb2',2);rect(-7,-5,14,22,'#31414b',4);rect(-17,-10,34,3,'#1e2930');if(v.driverId){const driver=players.find(p=>p.id===v.driverId);circle(0,1,8,driver?.color||'#c3f36a');}
  }else{
   rect(-5,-22,10,13,'#24313b',3);rect(-5,12,10,14,'#24313b',3);rect(-9,-13,18,31,v.color,7);rect(-6,-1,12,16,'#34434d',4);rect(-14,-13,28,4,'#34434d',2);circle(0,-17,4,'#fff1b9');
   if(v.driverId){const driver=players.find(p=>p.id===v.driverId);drawCharacter(ctx,driver||{},0,0,{rider:true});}
  }
  polishVehicle(ctx,v);ctx.restore();
  if(v.driverId){const driver=players.find(p=>p.id===v.driverId);text(driver?.name||'Conducteur',v.x,v.y-40,10,v.driverId===me?.id?'#d9ff8f':'#fff');}
  if(v.type!=='bicycle'&&me&&Math.hypot(v.x-me.x,v.y-me.y)<140){const hp=v.health??100;rect(v.x-25,v.y+43,50,6,'#24313b',3);if(hp>0)rect(v.x-25,v.y+43,50*hp/100,6,hp>30?'#a9df82':'#e58572',3);if(hp<=0)text('EN PANNE',v.x,v.y+64,10,'#ffd0b5');}
  if(!v.driverId&&me&&Math.hypot(v.x-me.x,v.y-me.y)<120){rect(v.x-47,v.y-48,94,20,'#17242bed',4);text(v.ownerId&&v.ownerId!==me.id?'Privé':v.rentalUntil?'Location · F':v.ownerId?'À toi · F':v.name+' · F',v.x,v.y-34,10,'#d9ff8f');}
 }
 text('AVENUE DES POSSIBLES',455,1020,10,'#dee3d3');if(employmentInfo){marker(employmentInfo.x,employmentInfo.y,'#ffb36b','PÔLE EMPLOI · E');const c=employmentInfo.careers.find(c=>c.id===me?.career);if(c&&me.workActive)marker(c.x,c.y,'#ffb36b',c.icon+' MISSION');}
 rect(784,307,32,38,'#243b5a',4);text('👮',800,331,17);marker(800,335,'#83b8ff','ARMURERIE');
 drawHarvestBuyer(ctx,me);drawNatureBuyer(ctx,me);drawMedic(ctx,me);drawBaker(ctx,me);drawMechanic(ctx,me);marker(1650,647,'#f0a8d5','NOVA STYLE · E');
 marker(680,990,'#ff7066','CASERNE · E');
 for(const entrance of interiorEntrances)marker(entrance.x,entrance.y,'#e8d69b','ENTRÉE · E / B');
 marker(455,700,'#f4cb75','DÉPÔT · COLIS');if(me?.job)marker(680,335,'#8bc7ff','TA LIVRAISON');marker(garageInfo.x,garageInfo.y,'#c7a1f5','GARAGE · G');
 for(const h of [...new Map(residences.map(h=>[h.x+','+h.y,h])).values()]){if(h.x>cameraX-70&&h.x<cameraX+w/scale+70&&h.y>cameraY-70&&h.y<cameraY+h/scale+70)marker(h.x,h.y,'#f3a7d2','RÉSIDENCE · H');}
 drawVehicleDealer(ctx,me);
 for(const p of [...players].filter(p=>!p.vehicleId&&!p.interior).sort((a,b)=>a.y-b.y)){const self=p.id===me?.id;ctx.fillStyle='#152c3b40';ctx.beginPath();ctx.ellipse(p.x+3,p.y+12,14,7,0,0,7);ctx.fill();if(self){ctx.strokeStyle=p.color;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y+11,18,9,0,0,7);ctx.stroke();}drawCharacter(ctx,p);if(p.career==='police'&&p.policeWeapon){rect(p.x+9,p.y+1,18,5,'#202936',2);if(p.id===me?.id&&time<shotUntil){circle(p.x+31,p.y+3,7,'#ffe59a');}}if(p.cuffed)text('🔗',p.x,p.y-67,16,'#ffdda3');const label=p.name+(self?' · toi':'');ctx.font='700 10px system-ui';const width=ctx.measureText(label).width+16;rect(p.x-width/2,p.y-65,width,21,self?'#244638ed':'#203640ed',7);text(label,p.x,p.y-51,10,self?'#d1f3ab':'#edf4ee');}
 ctx.restore();
 dayNight.draw(ctx,w,h,{cameraX,cameraY,scale,buildings,world});
 advancePlayer(time);requestAnimationFrame(draw);}
const headerActions=document.createElement('div');headerActions.className='header-actions';const gameHeader=document.querySelector('header');for(const child of [...gameHeader.children])if(!child.matches('.brand,.status'))headerActions.append(child);gameHeader.append(headerActions);
setupMobile({keys,touch});
try{const data=await(await fetch('/api/world')).json();residences=data.residences||[];interiorEntrances=data.interiorEntrances||[];garageInfo=data.garage||garageInfo;rentalDistrictInfo=data.rentalDistrict||rentalDistrictInfo;employmentInfo=data.employment;buildings=data.buildings;world={width:data.width,height:data.height};gps.setWorld(data);fillMiniMap();}catch{toast('Impossible de charger la ville. Recharge la page.');}
requestAnimationFrame(draw);

async function playStartupLogo(){
 const splash=document.getElementById('startupSplash');if(!splash)return;
 let seen=false;try{seen=sessionStorage.getItem('nova-startup-seen')==='1';sessionStorage.setItem('nova-startup-seen','1');}catch{}
 const reloading=performance.getEntriesByType('navigation')[0]?.type==='reload';if(seen&&!reloading){splash.remove();return;}
 if(splash.open)splash.close();splash.showModal();splash.classList.add('splash-playing');keys.clear();touch.clear();
 await new Promise(resolve=>{let timer;const finish=()=>{clearTimeout(timer);splash.close();splash.remove();resolve();};document.getElementById('skipStartup').addEventListener('click',finish,{once:true});splash.addEventListener('cancel',e=>{e.preventDefault();finish();});timer=setTimeout(finish,matchMedia('(prefers-reduced-motion: reduce)').matches?900:5700);});
}
await playStartupLogo();
try{await enter((await api('session')).player);}catch{showAuth();$('name').focus();}
