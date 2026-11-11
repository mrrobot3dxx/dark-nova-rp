import {atms,atmObstacles} from './public/atm-world.js';
import {createBank} from './bank.mjs';
import {caravanCamp,caravanObstacles,caravans} from './public/caravan-camp-world.js';
import {createTrading} from './trading.mjs';
import {deploymentConfig,allowedRequestOrigin,seedPersistentData} from './deployment.mjs';
import {harvestBuyer,nearHarvestBuyer} from './public/harvest-buyer-world.js?v=milo-market-3';
import {vehicleDealer,vehicleDealers,findVehicleDealer,nearVehicleDealer} from './public/vehicle-dealer.js?v=nova-front-4';
import {mechanic} from './public/mechanic-world.js?v=alex-area-1';
import {createVehicleDamage,vehicleHealth,motorized} from './vehicle-condition.mjs';
import {createRepairs} from './repairs.mjs';
import {bakery,nearBakery} from './public/bakery-world.js';
import {clothingShop,clothingCatalog,nearClothing} from './public/clothing-world.js';
import {medic,nearMedic} from './public/medic-world.js';
import {createNeeds} from './needs.mjs';
import {natureBuyer,nearNatureBuyer} from './public/nature-buyer-world.js';
import {createNature} from './nature.mjs';
import {nature} from './public/nature-world.js';
import {createLockpicking} from './lockpicking.mjs';
import {createSupport} from './support.mjs';
import {interiorPlan,interiorBlocked} from './public/interiors.js';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { randomUUID, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { dirname } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

export const buildings = [
  {x:100,y:100,w:260,h:180,name:'RÉSIDENCE AZUR',color:'#547caa'},
  {x:550,y:100,w:270,h:180,name:'COMMISSARIAT',color:'#537bb7'},
  {x:100,y:430,w:260,h:200,name:'CAFÉ NOVA',color:'#bd805c'},
  {x:550,y:430,w:270,h:200,name:'GARAGE NOVA',color:'#609c8b'},
  {x:100,y:790,w:260,h:160,name:'PÔLE EMPLOI',color:'#9b7bac'},
  {x:550,y:790,w:270,h:160,name:'CASERNE DES POMPIERS',color:'#b95848'}
];
export const world={width:5520,height:4320};
const names=['HÔPITAL NOVA','MAIRIE','LES ARCADES','GARAGE CENTRAL','RÉSIDENCE SOLEIL','BIBLIOTHÈQUE','MARCHÉ DES HALLES','STUDIO MUSIQUE','CINÉMA ÉTOILE','CAMPUS NOVA','HALLE SPORTIVE','BOULANGERIE'];
for(let column=0;column<3;column++)for(let row=0;row<6;row++)for(let side=0;side<2;side++){
 if(column===0&&row<3)continue;
 if(column===2&&row===3)continue;
 const index=(column*12+row*2+side)%names.length;
 buildings.push({x:100+column*920+side*450,y:[100,430,790,1150,1510,1870][row],w:260,h:160,name:names[index],color:['#547caa','#bd805c','#609c8b','#9b7bac','#799d72'][index%5]});
}
const residences=[{id:'azur',name:'Studio Azur',x:230,y:320,price:180,hours:24,description:'Un premier studio dans le centre historique.'}];
for(let column=0;column<6;column++)for(let row=0;row<12;row++){
 if(column<3&&row<6)continue;
 for(let side=0;side<2;side++){
  const x=100+column*920+side*450,y=row===0?100:70+row*360,index=column*24+row*2+side;
  const residential=(row%3===1&&side===0)||(row===7&&side===1);
  const name=residential?['RÉSIDENCE AURORA','LES JARDINS BLEUS','RÉSIDENCE HORIZON','VILLA DES PINS'][column%4]:names[index%names.length];
  buildings.push({x,y,w:260,h:160,name,color:residential?'#a491b4':['#547caa','#bd805c','#609c8b','#799d72'][index%4]});
  if(residential)residences.push({id:`home-${column}-${row}-${side}`,name:`${name} · ${column+1}${row+1}${side+1}`,x:x+130,y:y+197,price:220+column*35+(side?80:0),hours:24,description:side?'Appartement familial dans un quartier résidentiel.':'Appartement lumineux dans les nouveaux quartiers.'});
 }
}
const marketBuilding=buildings.find(b=>b.name==='LES ARCADES');if(marketBuilding){marketBuilding.name='MARCHÉ CLANDESTIN';marketBuilding.color='#78628f';}
// Each rentable home keeps its building and its stable lease identifier.
const homeBuildings=new Map(residences.filter(h=>h.id!=='azur').map(h=>[`${h.x-130},${h.y-197}`,h]));
const buildingNames=new Set();
for(let i=0;i<buildings.length;){
 const building=buildings[i],home=homeBuildings.get(`${building.x},${building.y}`);
 if(home)building.name=home.name;
 const key=building.name.normalize('NFKC').toLocaleLowerCase('fr');
 if(buildingNames.has(key)){buildings.splice(i,1);continue;}
 buildingNames.add(key);i++;
}
export const rentalDistrict={id:'lilas',name:'QUARTIER DES LILAS',x:2780,y:750,width:1840,height:1400,centerX:3670,centerY:1070};
let lilasIndex=0;
for(const column of [3,4])for(const row of [2,3,5])for(const side of [0,1]){
 const index=++lilasIndex,x=100+column*920+side*450,y=70+row*360;
 const name=`${['MAISON','STUDIO','LOFT'][Math.floor((index-1)/4)]} DES LILAS ${String(index).padStart(2,'0')}`;
 buildings.push({x,y,w:260,h:160,name,color:['#b89a7e','#8fadb0','#b3a2c4'][Math.floor((index-1)/4)],rentable:true});
 residences.push({id:`lilas-${index}`,name,x:x+130,y:y+197,price:180+(index-1)*20,hours:24,district:'lilas',description:'Logement du quartier des Lilas, desservi par les avenues et le jardin central. Location exclusive pour 24 heures.'});
}
// Keep one physical building per category; existing leases remain apartments in it.
const buildingType=name=>name.split(' · ')[0].replace(/\s+\d+$/u,'').trim();
const uniqueBuildings=new Map();
for(const building of buildings){const type=buildingType(building.name);if(!uniqueBuildings.has(type))uniqueBuildings.set(type,{...building,name:type});}
buildings.splice(0,buildings.length,...uniqueBuildings.values());
const fixedServices=new Set(['RÉSIDENCE AZUR','COMMISSARIAT','CAFÉ NOVA','GARAGE NOVA','PÔLE EMPLOI','CASERNE DES POMPIERS','HÔPITAL NOVA','MARCHÉ CLANDESTIN']);
const placed=buildings.filter(b=>fixedServices.has(b.name));
const gridX=world.width/6,gridY=world.height/5;
const slots=[];for(const row of [1,2,3])for(const column of [0,2,4,1,3,5])slots.push({x:100+column*gridX,y:90+row*gridY});
for(const building of buildings.filter(b=>!fixedServices.has(b.name)&&!b.name.includes('DES LILAS'))){
 const index=slots.findIndex(pos=>placed.every(b=>pos.x+building.w+220<=b.x||pos.x>=b.x+b.w+220||pos.y+building.h+220<=b.y||pos.y>=b.y+b.h+220));
 if(index<0)throw Error('Pas de place pour le plan espacé');Object.assign(building,slots.splice(index,1)[0]);placed.push(building);
}
let lilasSlot=3;
for(const building of buildings.filter(b=>b.name.includes('DES LILAS'))){building.x=100+lilasSlot++*gridX;building.y=90+4*gridY;}
Object.assign(rentalDistrict,{x:3*gridX,y:4*gridY,width:3*gridX,height:gridY,centerX:4.5*gridX,centerY:4.5*gridY});
for(const home of residences){const type=home.id==='azur'?'RÉSIDENCE AZUR':buildingType(home.name),building=uniqueBuildings.get(type);if(!building)throw Error('Logement sans bâtiment : '+home.id);home.x=building.x+building.w/2;home.y=building.y+building.h+37;home.buildingName=building.name;}
// Caravan rentals share the existing lease, inventory and persistence system.
for(const c of caravans)residences.push({id:c.id,name:'Caravane '+c.id.split('-')[1]+' · Camp des voyageurs',x:c.x+c.w/2,y:c.reverse?c.y-20:c.y+c.h+20,price:140,hours:24,district:'camp-voyageurs',buildingName:'CARAVANE',description:'Caravane aménagée avec place pour une plante et une imprimante RP. Location sauvegardée.'});
const homeKind=home=>home.buildingName==='CARAVANE'?'caravan':home.buildingName==='VILLA DES PINS'?'villa':'home';
buildings.push({x:1520,y:430,w:260,h:180,name:clothingShop.name,color:'#a57596'});
export const interiorEntrances=buildings.filter(b=>b.kind==='villa'||b.name==='VILLA DES PINS').map(b=>({id:b.name==='VILLA DES PINS'?'villa-pins':'villa',name:b.name,x:b.x+b.w/2,y:b.y+b.h+(b.kind==='villa'?76:37)}));
const policeBuilding=buildings.find(b=>b.name==='COMMISSARIAT');if(policeBuilding)interiorEntrances.push({id:'police-station',kind:'police',name:'COMMISSARIAT',x:policeBuilding.x+policeBuilding.w/2,y:policeBuilding.y+policeBuilding.h+37});
export const illegalMarket={x:1150,y:630,radius:85,growthMs:120000,sellPrice:120,catalog:[{id:'repairkit',name:'Kit de réparation',icon:'🧰',price:100},{id:'snack',name:'Barre de céréales',icon:'🍫',price:15},{id:'axe',name:'Hache',icon:'🪓',price:100},{id:'lockpick',name:'Crochet de serrure RP',icon:'🗝️',price:90},{id:'printer',name:'Imprimante à billets fictifs',icon:'🖨️',price:600},{id:'pot',name:'Pot de culture',icon:'🪴',price:60},{id:'water',name:'Bouteille d’eau',icon:'💧',price:10},{id:'seed',name:'Graine de CBD fictif',icon:'🌱',price:20}]};
export const employment={x:230,y:990,radius:85,careers:[
 {id:'dealer',name:'Revendeur clandestin',icon:'🕶️',reward:120,x:1150,y:630,task:'Revendre tes récoltes fictives au marché clandestin'},
 {id:'grower',name:'Cultivateur clandestin',icon:'🌿',reward:120,x:1150,y:630,task:'Cultiver du CBD fictif dans ton logement et revendre la récolte'},
 {id:'courier',name:'Coursier',icon:'📦',reward:75,x:680,y:335,task:'Livrer un colis devant le commissariat'},
 {id:'mechanic',name:'Mécanicien',icon:'🔧',reward:110,x:455,y:520,task:'Apporter les pièces au Garage Nova'},
 {id:'gardener',name:'Jardinier',icon:'🌳',reward:150,x:2295,y:1233,task:'Entretenir le jardin des rencontres'},
 {id:'paramedic',name:'Ambulancier',icon:'🚑',reward:150,x:1150,y:297,task:'Acheminer le matériel de secours à l’Hôpital Nova'},
 {id:'police',name:'Policier',icon:'👮',reward:140,x:680,y:335,task:'Effectuer une patrouille et rendre compte au commissariat'},
 {id:'firefighter',name:'Pompier',icon:'🚒',reward:160,x:1375,y:1070,task:'Contrôler la borne incendie du quartier des arts'},
 {id:'municipal',name:'Agent municipal',icon:'🧹',reward:100,x:1375,y:710,task:'Nettoyer la place du quartier des arts'}
]};
export function blocked(x,y,radius=13) { return x<radius+5||y<radius+5||x>world.width-radius-5||y>world.height-radius-5||[...buildings,...caravanObstacles,...atmObstacles].some(b=>x>b.x-radius&&x<b.x+b.w+radius&&y>b.y-radius&&y<b.y+b.h+radius); }
const derive=promisify(scrypt);
export const garage={x:455,y:520,radius:95,rentalMinutes:10,catalog:[{type:'scooter',name:'Scooter Nova',rent:60,buy:650,color:'#a6e1ce'},{type:'car',name:'Citadine Nova',rent:120,buy:1500,color:'#efba6d'},{type:'firetruck',name:'Camion de pompiers',rent:180,buy:3500,color:'#dc3038'},{type:'policecar',name:'Voiture de police',rent:150,buy:2500,color:'#ffffff'},{type:'quad',name:'Quad Nova',rent:90,buy:1200,color:'#e8a741'}]};
export function createGameServer({maintenance=process.env.MAINTENANCE_MODE==='1',deployment=deploymentConfig(),vehicleDamageOptions={},needsOptions={},natureOptions={},lockpickOptions={},moderatorIds=null,dataFile=deployment.dataFile}={}) {
 const accounts=new Map();let dirty=false;
 if(moderatorIds===null){try{moderatorIds=JSON.parse(readFileSync(deployment.moderatorsFile,'utf8'));}catch(err){if(err.code!=='ENOENT')throw err;moderatorIds=[];}}
 const moderators=new Set(moderatorIds);const isModerator=p=>moderators.has(p.id);
 const moderationHistory=[];
 if(dataFile){try{for(const a of JSON.parse(readFileSync(dataFile,'utf8')))accounts.set(a.key,a);}catch(err){if(err.code!=='ENOENT')throw err;}}
 if(process.env.NODE_ENV==='production')console.log('Dark Nova RP : '+accounts.size+' compte(s) chargé(s).');
 for(const a of accounts.values())if(!a.supplies){a.supplies={water:2,snack:2};dirty=true;}
 for(const a of accounts.values()){if(a.bankBalance===undefined){a.bankBalance=0;dirty=true;}if(a.bankRevision===undefined){a.bankRevision=0;dirty=true;}}
 const persist=()=>{if(!dirty||!dataFile)return;mkdirSync(dirname(dataFile),{recursive:true});writeFileSync(dataFile+'.tmp',JSON.stringify([...accounts.values()]),{mode:0o600});renameSync(dataFile+'.tmp',dataFile);dirty=false;};
 const save=p=>{const a=accounts.get(p.accountKey);if(a){Object.assign(a,{outfitId:p.outfitId,needs:p.needs,respawnAt:p.respawnAt||null,x:p.x,y:p.y,money:p.money,pickedHomes:p.pickedHomes||{},pickedVehicles:p.pickedVehicles||{},cuffs:p.cuffs||null,job:p.job,career:p.career,workActive:p.workActive,workObjectiveReached:!!p.workObjectiveReached,policeWeapon:p.career==='police'&&!!p.policeWeapon,ammo:p.career==='police'?(p.ammo||0):0,garage:vehicles.filter(v=>v.ownerId===p.id&&v.type!=='bicycle').map(({driverId,...v})=>v)});dirty=true;}};
 const needs=createNeeds({...needsOptions,isInvincible:isModerator,onCollapse:p=>{const v=vehicles.find(v=>v.driverId===p.id);if(v)v.driverId=null;p.vehicleId=null;p.needsNotice='Tu es inconscient. Réapparition disponible après 5 minutes.';save(p);persist();}});
 const attempts=new Map();
 const players=new Map(), streams=new Map(), messages=[];
 const voiceMembers=new Map();
 const voiceState=()=>{for(const [token,seen] of voiceMembers){const member=players.get(token);if(!member||Date.now()-seen>45000||(accounts.get(member.accountKey).mutedUntil||0)>Date.now())voiceMembers.delete(token);}return [...voiceMembers.keys()].map(token=>{const p=players.get(token);return {id:p.id,name:p.name};});};
 const vehicles=[];
 for(const a of accounts.values())for(const v of a.garage||[])if(!v.rentalUntil||v.rentalUntil>Date.now())vehicles.push({...v,health:vehicleHealth(v),ownerId:a.id,driverId:null});
 const vehicleRadius={car:27,policecar:27,firetruck:36,quad:23,scooter:17};
 for(const vehicle of vehicles)if(blocked(vehicle.x,vehicle.y,vehicleRadius[vehicle.type]||17)){vehicle.x=425;vehicle.y=580;const account=[...accounts.values()].find(a=>a.id===vehicle.ownerId);const stored=account?.garage?.find(v=>v.id===vehicle.id);if(stored){stored.x=vehicle.x;stored.y=vehicle.y;dirty=true;}}
 const saveVehicle=vehicle=>{const owner=[...accounts.values()].find(a=>a.id===vehicle.ownerId);if(owner){owner.garage=vehicles.filter(v=>v.ownerId===owner.id&&v.type!=='bicycle').map(({driverId,...v})=>v);dirty=true;}};
 const damageVehicle=createVehicleDamage(vehicleDamageOptions);
 const repairs=createRepairs({accounts,vehicles,saveVehicle,save,persist});
 const expireRentals=()=>{for(let i=vehicles.length-1;i>=0;i--){const v=vehicles[i];if(v.rentalUntil&&v.rentalUntil<=Date.now()){for(const p of players.values())if(p.vehicleId===v.id)p.vehicleId=null;vehicles.splice(i,1);const a=[...accounts.values()].find(a=>a.id===v.ownerId);if(a){a.garage=(a.garage||[]).filter(item=>item.id!==v.id);dirty=true;}}}};
 const garageState=p=>({catalog:garage.catalog,rentalMinutes:garage.rentalMinutes,vehicles:vehicles.filter(v=>v.ownerId===p.id),money:p.money});
 const publicPlayer=p=>({outfitId:p.outfitId||'original',outfit:clothingCatalog.find(item=>item.id===p.outfitId)?.outfit||null,punch:p.punchAt&&Date.now()-p.punchAt<450?{id:p.punchAt,facing:p.punchFacing,ageMs:Math.max(0,Date.now()-p.punchAt)}:null,needs:p.needs,respawnAt:p.respawnAt||null,respawnInMs:needs.remaining(p),needsNotice:p.needsNotice||null,id:p.id,name:p.name,color:p.color,x:p.x,y:p.y,money:p.money,job:p.job,career:p.career,workActive:p.workActive,workObjectiveReached:!!p.workObjectiveReached,policeWeapon:p.career==='police'&&!!p.policeWeapon,ammo:p.career==='police'?(p.ammo||0):0,vehicleId:p.vehicleId||null,interior:p.interior||null,interiorEquipment:p.interior?[...accounts.values()].filter(a=>a.printer?.homeId===p.interior.id&&a.home?.id===p.interior.id&&a.home.until>Date.now()).map(a=>({type:'printer',canManage:a.id===p.id})).concat([...accounts.values()].filter(a=>a.home?.id===p.interior.id&&a.home.until>Date.now()).flatMap(a=>(a.crops||[]).filter(c=>c.homeId===p.interior.id).map(c=>({type:'plant',readyAt:c.readyAt,canManage:a.id===p.id})))):[],ix:p.ix,iy:p.iy,vehicleAccess:Object.keys(p.pickedVehicles||{}).filter(id=>(p.pickedVehicles[id]===true||p.pickedVehicles[id]>Date.now())),isModerator:isModerator(p),invincible:isModerator(p),cuffed:!!p.cuffs,cuffedUntil:p.cuffs?.until||null,cuffedBy:p.cuffs?.officerName||null});
 const broadcast=()=>{for(let i=vehicles.length-1;i>=0;i--)if(vehicles[i].type==='bicycle'&&![...players.values()].some(p=>p.id===vehicles[i].ownerId))vehicles.splice(i,1);const data=`data: ${JSON.stringify({players:[...players.values()].map(publicPlayer),vehicles,messages,voice:voiceState()})}\n\n`;for(const s of streams.values())s.write(data);};
 const banking=createBank({accounts,save,persist});
 const trading=createTrading({accounts,players,save,persist,markDirty:()=>{dirty=true;},notify:(id,message)=>{const target=[...players.values()].find(p=>p.id===id);const stream=target&&streams.get(target.token);if(stream)stream.write('event: trade\ndata: '+JSON.stringify({message})+'\n\n');}});
 const support=createSupport({accounts,players,streams,isModerator,markDirty:()=>{dirty=true;},persist});
 const lockpicking=createLockpicking({...lockpickOptions,accounts,vehicles,residences,persist,markDirty:()=>{dirty=true;}});
 const natureActivities=createNature({...natureOptions,accounts,persist,markDirty:()=>{dirty=true;}});
 const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  const send=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  const sessionToken=()=>{const match=(req.headers.cookie||'').match(/(?:^|;\s*)nova_session=([a-f0-9]{64})(?:;|$)/);return match?.[1];};
  const cookie=(value,age)=>res.setHeader('Set-Cookie',`nova_session=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${process.env.NODE_ENV==='production'?'; Secure':''}`);
  const mainServer={id:'main',name:'Dark Nova RP — Serveur principal',description:'Ville RP · sauvegarde de compte',players:players.size,capacity:60,available:players.size<60||players.has(sessionToken())};
  if(req.method==='GET'&&url.pathname==='/api/servers')return send(200,{servers:[mainServer],saveMode:'account'});
  if(req.method==='GET'&&url.pathname==='/health')return send(200,{ok:true,game:'Dark Nova RP'});
  if(req.method==='GET'&&url.pathname==='/api/time')return send(200,{serverTime:Date.now(),timezone:'Europe/Paris'});
  if(req.method==='GET'&&url.pathname==='/api/world')return send(200,{buildings,...world,caravanCamp,caravans,obstacles:[...caravanObstacles,...atmObstacles],atms,garage,residences,employment,illegalMarket,rentalDistrict,interiorEntrances,nature,natureBuyer,medic,clothingShop,bakery,mechanic,vehicleDealer,vehicleDealers,harvestBuyer});
  if(req.method==='GET'&&url.pathname==='/events') {
   const p=players.get(sessionToken());if(!p)return send(401,{error:'Session expirée. Rejoins la ville.'});
   streams.get(p.token)?.end();res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});streams.set(p.token,res);p.seen=Date.now();broadcast();if(isModerator(p))support.notifyStaff(p);
   req.on('close',()=>{if(streams.get(p.token)===res)streams.delete(p.token);});return;
  }
  if(req.method==='POST'&&url.pathname.startsWith('/api/')){
   if(maintenance)return send(503,{error:'Transfert des sauvegardes en cours. Réessaie dans un instant.'});
   if(!allowedRequestOrigin(req,deployment.publicOrigin))return send(403,{error:'Origine refusée'});
   let raw='';try {for await(const chunk of req){raw+=chunk;if(raw.length>(url.pathname==='/api/voice'?16384:4096)){send(413,{error:'Message trop long'});return;}}const body=JSON.parse(raw||'{}');
   if(url.pathname==='/api/select-server'){if(body.serverId!=='main')return send(404,{error:'Ce serveur n’existe pas.'});if(!mainServer.available)return send(503,{error:'Le serveur est complet.'});return send(200,{server:mainServer,saveMode:'account'});}
   if(url.pathname==='/api/register'||url.pathname==='/api/login'){
    const address=req.socket.remoteAddress,now=Date.now();let limit=attempts.get(address);
    if(!limit||now>limit.until){if(attempts.size>2000)return send(429,{error:'Trop de connexions. Réessaie plus tard.'});limit={count:0,until:now+900000};attempts.set(address,limit);}
    if(++limit.count>15)return send(429,{error:'Trop de tentatives. Réessaie dans 15 minutes.'});
    const name=String(body.name||'').trim().normalize('NFKC'),key=name.toLocaleLowerCase('fr'),password=body.password;
    if(!/^[\p{L}\p{N}_ -]{3,18}$/u.test(name)||typeof password!=='string'||password.length<10||password.length>128)return send(400,{error:'Pseudo : 3 à 18 caractères. Mot de passe : 10 à 128 caractères.'});
    let account=accounts.get(key);
    if(url.pathname==='/api/register'){
     const email=typeof body.email==='string'?body.email.trim().toLowerCase():'';
     if(email.length>254||! /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(email))return send(400,{error:'Indique une adresse e-mail valide.'});
     if([...accounts.values()].some(a=>a.email===email))return send(409,{error:'Cette adresse e-mail est déjà utilisée.'});
     if(account)return send(409,{error:'Ce pseudo est déjà utilisé.'});
     const salt=randomBytes(16).toString('hex'),hash=(await derive(password,salt,64)).toString('hex');
     if(accounts.has(key))return send(409,{error:'Ce pseudo est déjà utilisé.'});
     if([...accounts.values()].some(a=>a.email===email))return send(409,{error:'Cette adresse e-mail est déjà utilisée.'});
     const colors=['#c3f36a','#8bc7ff','#ffb3d4','#ffce78'];account={key,id:randomUUID(),name,email,salt,hash,color:colors.includes(body.color)?body.color:colors[0],x:455,y:355,money:250,bankBalance:0,bankRevision:0,job:false,supplies:{water:2,snack:2}};accounts.set(key,account);dirty=true;persist();
    }else{
     const hash=await derive(password,account?.salt||'nova-dummy-salt',64);
     if(!account||!timingSafeEqual(hash,Buffer.from(account.hash,'hex')))return send(401,{error:'Pseudo ou mot de passe incorrect.'});
    }
    for(const [old,p]of players)if(p.accountKey===key){save(p);for(const v of vehicles)if(v.driverId===p.id)v.driverId=null;streams.get(old)?.end();streams.delete(old);players.delete(old);}
    if(players.size>=60)return send(503,{error:'La ville est complète.'});
    const token=randomBytes(32).toString('hex'),p={outfitId:clothingCatalog.some(item=>item.id===account.outfitId)&&(account.outfitId==='original'||account.wardrobe?.includes(account.outfitId))?account.outfitId:'original',token,id:account.id,accountKey:key,name:account.name,pickedHomes:account.pickedHomes||{},pickedVehicles:account.pickedVehicles||{},color:account.color,x:account.x,y:account.y,money:account.money,job:account.job,cuffs:account.cuffs||null,career:account.career||null,workActive:account.workActive||false,workObjectiveReached:account.workObjectiveReached??!!account.workActive,policeWeapon:account.career==='police'&&!!account.policeWeapon,ammo:account.career==='police'?(account.ammo||0):0,seen:Date.now(),moved:Date.now(),chatAt:0};needs.start(p,account.needs,account.respawnAt);if(blocked(p.x,p.y)){p.x=455;p.y=355;}players.set(token,p);if(p.respawnAt||isModerator(p)){save(p);persist();}cookie(token,86400);broadcast();return send(200,{player:publicPlayer(p)});
   }
   const p=players.get(sessionToken());if(!p)return send(401,{error:'Session expirée. Reconnecte-toi.'});p.seen=Date.now();if(needs.tick(p))save(p);
   if(url.pathname==='/api/punch'){
    if(p.respawnAt||p.cuffs||p.vehicleId)return send(403,{error:'Tu dois être conscient, libre et à pied pour frapper.'});
    const now=Date.now();if(p.punchAt&&now-p.punchAt<550)return send(429,{error:'Attends un instant avant le prochain coup.'});
    p.punchAt=now;p.punchFacing=['front','back','left','right'].includes(body.facing)?body.facing:'front';broadcast();return send(200,{player:publicPlayer(p)});
   }
   if(url.pathname==='/api/respawn'){
    if(!p.respawnAt)return send(409,{error:'Ton personnage est déjà en vie.'});
    const immediate=body.action==='moderator';
    if(immediate&&!isModerator(p))return send(403,{error:'Réapparition immédiate réservée aux modérateurs.'});
    if(!needs.respawn(p,{immediate}))return send(425,{error:'Attends la fin des 5 minutes.',player:publicPlayer(p)});
    p.interior=null;p.x=1250;p.y=320;p.needsNotice='Tu as repris connaissance à l’hôpital.';save(p);persist();broadcast();return send(200,{player:publicPlayer(p)});
   }
   if(p.respawnAt){
    if(url.pathname==='/api/move')return send(200,{player:publicPlayer(p)});
    if(!['/api/session','/api/logout','/api/support','/api/mod-support'].includes(url.pathname))return send(403,{error:'Tu es inconscient. Attends de pouvoir réapparaître.',player:publicPlayer(p)});
   }
   expireRentals();
   if(p.workActive&&!p.workObjectiveReached&&!p.interior&&!p.vehicleId){const objective=employment.careers.find(c=>c.id===p.career);if(objective&&Math.hypot(p.x-objective.x,p.y-objective.y)<=85){p.workObjectiveReached=true;save(p);}}
   
   if(p.cuffs){
    if(url.pathname==='/api/move')return send(200,{player:publicPlayer(p)});
    if(!['/api/session','/api/logout','/api/chat','/api/voice','/api/inventory','/api/moderation','/api/support','/api/mod-support'].includes(url.pathname))return send(403,{error:'Tu es menotté. Un policier doit te libérer. Les menottes n’expirent pas automatiquement.'});
   }
   if(url.pathname==='/api/handcuffs'){
    if(p.career!=='police')return send(403,{error:'Action réservée au métier de policier.'});
    if(body.action){
     if(!['cuff','release'].includes(body.action))return send(400,{error:'Action inconnue.'});
     const target=[...players.values()].find(t=>t.id===body.id);
     if(!target||target.id===p.id)return send(404,{error:'Joueur introuvable.'});
     if((target.interior?.id||null)!==(p.interior?.id||null))return send(400,{error:'Vous devez être dans le même lieu.'});
     const inside=!!p.interior,ax=inside?p.ix:p.x,ay=inside?p.iy:p.y,bx=inside?target.ix:target.x,by=inside?target.iy:target.y;
     if(p.vehicleId||target.vehicleId||Math.hypot(ax-bx,ay-by)>75)return send(400,{error:'Approche-toi à pied du joueur, à moins de 75 unités. Il doit aussi être à pied.'});
     const samples=Math.max(1,Math.ceil(Math.hypot(ax-bx,ay-by)/5));for(let i=1;i<samples;i++){const x=ax+(bx-ax)*i/samples,y=ay+(by-ay)*i/samples;if(inside?interiorBlocked(p.interior.kind,x,y,3):blocked(x,y,3))return send(400,{error:'Un obstacle vous sépare.'});}
     if(body.action==='cuff'){
      if(target.cuffs)return send(409,{error:'Ce joueur est déjà menotté.'});
      target.cuffs={officerId:p.id,officerName:p.name};
     }else{if(!target.cuffs)return send(409,{error:'Ce joueur n’est pas menotté.'});target.cuffs=null;target.moved=Date.now();}
     save(target);persist();broadcast();
    }
    const inside=!!p.interior;return send(200,{player:publicPlayer(p),range:75,durationSeconds:null,players:[...players.values()].filter(t=>t.id!==p.id&&(t.interior?.id||null)===(p.interior?.id||null)).map(t=>({...publicPlayer(t),distance:Math.round(Math.hypot((inside?p.ix:p.x)-(inside?t.ix:t.x),(inside?p.iy:p.y)-(inside?t.iy:t.y)))})).filter(t=>t.distance<=75).sort((a,b)=>a.distance-b.distance)});
   }
   if(p.interior?.kind==='home'||p.interior?.private){const owner=[...accounts.values()].find(a=>a.home?.id===p.interior.id&&a.home.until>Date.now());if(!owner){p.interior=null;p.moved=Date.now();}}
   if(url.pathname==='/api/door'){
    const account=accounts.get(p.accountKey),lease=account.home,home=lease?.until>Date.now()?residences.find(h=>h.id===lease.id):null;
    if(!home)return send(403,{error:'Tu dois louer un logement avec un bail actif pour gérer sa porte.'});
    const inside=p.interior?.id===home.id,near=!p.interior&&Math.hypot(p.x-home.x,p.y-home.y)<=90;
    if(body.action){
     if(p.vehicleId||(!inside&&!near))return send(400,{error:'Rejoins à pied la porte de ton logement, ou entre chez toi.'});
     if(body.action!=='open'&&body.action!=='lock')return send(400,{error:'Action inconnue.'});
     lease.locked=body.action==='lock';dirty=true;persist();broadcast();
    }
    return send(200,{home:{id:home.id,name:home.name,locked:lease.locked!==false},canManage:!p.vehicleId&&(inside||near),message:body.action?(lease.locked?'Porte fermée et verrouillée. Les visiteurs présents peuvent toujours sortir.':'Porte ouverte : les joueurs proches peuvent entrer.'):''});
   }
   if(url.pathname==='/api/nature'){const result=natureActivities(p,body);return send(result.status,result.data);}
   if(url.pathname==='/api/lockpick'){const result=lockpicking(p,body);if(result.status===200)result.data.player=publicPlayer(p);return send(result.status,result.data);}
   if(url.pathname==='/api/interior'){
    if(body.action==='exit'){p.interior=null;}
    else if(body.action==='enter'){
     if(p.interior)return send(409,{error:'Tu es déjà à l’intérieur.'});

     const lease=accounts.get(p.accountKey).home,home=lease?.until>Date.now()?residences.find(h=>h.id===lease.id):null;
     const entrance=interiorEntrances.find(e=>(!body.id||body.id===e.id)&&Math.hypot(p.x-e.x,p.y-e.y)<=90);
     if(home&&(!body.id||body.id===home.id)&&Math.hypot(p.x-home.x,p.y-home.y)<=90)p.interior={id:home.id,kind:homeKind(home),private:true,name:home.name};
     else if((()=>{const host=[...accounts.values()].find(a=>a.home?.until>Date.now()&&(a.home.locked===false||(p.pickedHomes?.[a.home.id]===true||p.pickedHomes?.[a.home.id]>Date.now()))&&(!body.id||body.id===a.home.id)&&residences.some(h=>h.id===a.home.id&&Math.hypot(p.x-h.x,p.y-h.y)<=90));if(!host)return false;const h=residences.find(h=>h.id===host.home.id);p.interior={id:h.id,kind:homeKind(h),private:true,name:h.name+' · Invité'};return true;})()){}
     else if(entrance)p.interior={id:entrance.id,kind:entrance.kind||'villa',name:entrance.name+(entrance.kind==='police'?' · Accueil':' · Visite')};
     else return send(403,{error:'Approche-toi de l’entrée du bâtiment ou de ton logement loué.'});
     if(p.vehicleId){const vehicle=vehicles.find(v=>v.id===p.vehicleId&&v.driverId===p.id);
    if(vehicle)vehicle.driverId=null;p.vehicleId=null;}
     const plan=interiorPlan(p.interior.kind);p.ix=plan.spawn.x;p.iy=plan.spawn.y;
    }else return send(400,{error:'Action inconnue.'});
    p.moved=Date.now();broadcast();return send(200,{player:publicPlayer(p)});
   }
   if(p.interior&&url.pathname==='/api/move'){
    const dx=Number(body.dx),dy=Number(body.dy);if(!Number.isFinite(dx)||!Number.isFinite(dy))return send(400,{error:'Déplacement invalide'});
    
    const now=Date.now(),distance=Math.max(0,Math.min((now-p.moved)/1000,.2))*170,norm=Math.max(1,Math.hypot(dx,dy)),steps=Math.max(1,Math.ceil(distance/5));p.moved=now;
    for(let i=0;i<steps;i++){const x=p.ix+dx/norm*distance/steps,y=p.iy+dy/norm*distance/steps;if(!interiorBlocked(p.interior.kind,x,p.iy))p.ix=x;if(!interiorBlocked(p.interior.kind,p.ix,y))p.iy=y;}
    broadcast();return send(200,{player:publicPlayer(p)});
   }
   if(p.interior&&!['/api/door','/api/trade','/api/session','/api/logout','/api/chat','/api/voice','/api/inventory','/api/cultivation','/api/moderation','/api/support','/api/mod-support'].includes(url.pathname))return send(400,{error:'Sors du logement pour effectuer cette action.'});
   if(url.pathname==='/api/session')return send(200,{player:publicPlayer(p)});
   if(url.pathname==='/api/bank'){const result=banking(p,body);if(result.status===200){broadcast();return send(200,{...result.data,player:publicPlayer(p)});}return send(result.status,result.data);}
   if(url.pathname==='/api/support'||url.pathname==='/api/mod-support'){const result=support.handle(p,body,url.pathname==='/api/mod-support');return send(result.status,result.data);}
   if(url.pathname==='/api/moderation'){
    if(!isModerator(p))return send(403,{error:'Modération réservée au propriétaire.'});
    if(body.action){
     if(!['kick','mute','unmute','deleteMessage'].includes(body.action))return send(400,{error:'Action inconnue.'});
     let targetName='';
     if(body.action==='deleteMessage'){
      const index=messages.findIndex(m=>m.id===body.id);if(index<0)return send(404,{error:'Message introuvable.'});messages.splice(index,1);
     }else{
      const target=[...players.values()].find(t=>t.id===body.id);if(!target)return send(404,{error:'Joueur déconnecté.'});
      if(isModerator(target))return send(403,{error:'Ce compte de modération est protégé.'});
      targetName=target.name;const account=accounts.get(target.accountKey);
      if(body.action==='kick'){
       save(target);for(const v of vehicles)if(v.driverId===target.id)v.driverId=null;
       players.delete(target.token);streams.get(target.token)?.end();streams.delete(target.token);
      }else{account.mutedUntil=body.action==='mute'?Date.now()+600000:0;dirty=true;}
     }
     moderationHistory.unshift({by:p.name,action:body.action,target:targetName||body.id,at:Date.now()});moderationHistory.splice(50);persist();broadcast();
    }
    return send(200,{players:[...players.values()].map(t=>({...publicPlayer(t),mutedUntil:accounts.get(t.accountKey).mutedUntil||0})),messages,history:moderationHistory});
   }
   if(url.pathname==='/api/housing'){
    const account=accounts.get(p.accountKey),active=a=>a.home&&a.home.until>Date.now();
    if(body.action){
     const home=residences.find(h=>h.id===body.id);
     if(!home)return send(400,{error:'Résidence inconnue.'});
     if(p.vehicleId)return send(400,{error:'Descends de ton véhicule pour accéder à la résidence.'});
     if(Math.hypot(p.x-home.x,p.y-home.y)>90)return send(400,{error:'Approche-toi du repère rose devant cette résidence.'});
     if(body.action==='rent'){
      if(active(account))return send(409,{error:'Tu as déjà un logement. Résilie-le avant d’en louer un autre.'});
      if([...accounts.values()].some(a=>active(a)&&a.home.id===home.id))return send(409,{error:'Ce logement est déjà loué par un autre joueur.'});
      if(p.money<home.price)return send(400,{error:`Il te manque ${home.price-p.money} $ du jeu.`});
      p.money-=home.price;account.home={id:home.id,until:Date.now()+home.hours*3600000,locked:true};
     }else if(body.action==='leave'){
      if(!active(account)||account.home.id!==home.id)return send(403,{error:'Tu ne loues pas ce logement.'});account.home=null;
     }else return send(400,{error:'Action inconnue.'});
     save(p);persist();broadcast();
    }
    const home=active(account)?account.home:null;
    return send(200,{player:publicPlayer(p),home,residences:residences.map(h=>({...h,occupied:[...accounts.values()].some(a=>active(a)&&a.home.id===h.id)}))});
   }
   if(url.pathname==='/api/garage'){
    const localDealer=findVehicleDealer(p),localParking=localDealer?.id==='central'?{x:1115,y:2075}:null;
    if(body.action){
     if(Math.hypot(p.x-garage.x,p.y-garage.y)>garage.radius&&!nearVehicleDealer(p))return send(400,{error:'Rejoins Sam au Garage Nova (590, 715) ou Léo au Garage Central (1150, 2020).'});
     if(p.vehicleId)return send(400,{error:'Descends de ton véhicule avant de passer au garage.'});
     const model=garage.catalog.find(m=>m.type===body.type);
     if(!model)return send(400,{error:'Modèle de véhicule inconnu.'});
     const owned=vehicles.find(v=>v.ownerId===p.id&&v.type===model.type&&!v.rentalUntil);
     let selected;
     if(body.action==='buy'||body.action==='rent'){
      if(body.action==='buy'&&owned)return send(409,{error:'Tu possèdes déjà ce modèle. Utilise Récupérer.'});
      if(body.action==='rent'&&vehicles.some(v=>v.ownerId===p.id&&v.rentalUntil))return send(409,{error:'Tu as déjà une location en cours.'});
      const price=body.action==='buy'?model.buy:model.rent;
      if(p.money<price)return send(400,{error:`Il te manque ${price-p.money} $ du jeu. Fais des livraisons pour en gagner.`});
      selected={health:100,id:randomUUID(),type:model.type,name:model.name,color:model.color,ownerId:p.id,rentalUntil:body.action==='rent'?Date.now()+garage.rentalMinutes*60000:null,x:['car','policecar'].includes(model.type)?425:model.type==='firetruck'?455:490,y:model.type==='firetruck'?610:580,angle:0,driverId:null};
      if(localParking)Object.assign(selected,localParking);p.money-=price;vehicles.push(selected);
     }else if(body.action==='retrieve'){
      selected=owned;if(!selected)return send(400,{error:'Tu ne possèdes pas ce modèle.'});if(selected.driverId)return send(409,{error:'Ce véhicule est actuellement conduit.'});
      selected.x=['car','policecar'].includes(model.type)?425:model.type==='firetruck'?455:490;selected.y=model.type==='firetruck'?610:580;selected.driverId=null;if(localParking)Object.assign(selected,localParking);
     }else if(body.action==='return'){
      const index=vehicles.findIndex(v=>v.ownerId===p.id&&v.type===model.type&&v.rentalUntil);
      if(index<0)return send(400,{error:'Aucune location à rendre pour ce modèle.'});for(const other of players.values())if(other.vehicleId===vehicles[index].id)other.vehicleId=null;vehicles.splice(index,1);
     }else return send(400,{error:'Action inconnue.'});
     save(p);persist();broadcast();
    }
    return send(200,{player:publicPlayer(p),garage:garageState(p)});
   }
   if(url.pathname==='/api/voice'){
    voiceState();
    if(body.action==='leave'){voiceMembers.delete(p.token);broadcast();return send(200,{members:voiceState()});}
    if((accounts.get(p.accountKey).mutedUntil||0)>Date.now())return send(403,{error:'Tu es temporairement muet : vocal indisponible.'});
    if(body.action==='join'){
     if(!voiceMembers.has(p.token)&&voiceMembers.size>=60)return send(409,{error:'Salon vocal complet (60 joueurs maximum).'});
     voiceMembers.set(p.token,Date.now());broadcast();return send(200,{members:voiceState()});
    }
    if(!voiceMembers.has(p.token))return send(403,{error:'Rejoins le vocal avant de communiquer.'});
    voiceMembers.set(p.token,Date.now());
    if(body.action==='ping')return send(200,{members:voiceState()});
    if(body.action!=='signal')return send(400,{error:'Action vocale inconnue.'});
    const target=[...players.values()].find(t=>t.id===body.to&&voiceMembers.has(t.token));
    if(!target||target.id===p.id)return send(404,{error:'Participant vocal indisponible.'});
    const signal=body.signal;
    if(!signal||!['offer','answer','candidate'].includes(signal.type))return send(400,{error:'Signal invalide.'});
    let clean;
    if(signal.type==='candidate'){
     const c=signal.candidate;if(!c||typeof c.candidate!=='string'||c.candidate.length>2048||!(c.sdpMid===null||typeof c.sdpMid==='string')||!(c.sdpMLineIndex===null||Number.isInteger(c.sdpMLineIndex)))return send(400,{error:'Candidat invalide.'});
     clean={type:'candidate',candidate:{candidate:c.candidate,sdpMid:c.sdpMid,sdpMLineIndex:c.sdpMLineIndex}};
    }else{if(typeof signal.sdp!=='string'||signal.sdp.length>12000)return send(400,{error:'Session audio invalide.'});clean={type:signal.type,sdp:signal.sdp};}
    if(!streams.has(target.token))return send(409,{error:'Participant vocal en reconnexion.'});
    streams.get(target.token).write(`event: voice-signal\ndata: ${JSON.stringify({from:p.id,signal:clean})}\n\n`);
    return send(200,{ok:true});
   }
   if(url.pathname==='/api/bicycle'){
    const existing=vehicles.find(v=>v.ownerId===p.id&&v.type==='bicycle');
    if(body.action==='store'){
     if(existing){if(p.vehicleId===existing.id)p.vehicleId=null;vehicles.splice(vehicles.indexOf(existing),1);}
    }else if(body.action==='take'){
     if(p.vehicleId&&p.vehicleId!==existing?.id)return send(400,{error:'Descends de ton véhicule avant de sortir ton vélo.'});
     if(!existing||p.vehicleId!==existing.id){
      const spot=[[0,0],[28,0],[-28,0],[0,28],[0,-28],[40,40],[-40,40],[40,-40],[-40,-40]].map(([dx,dy])=>({x:p.x+dx,y:p.y+dy})).find(pos=>!blocked(pos.x,pos.y,17));
      if(!spot)return send(400,{error:'Décale-toi un peu pour déplier ton vélo.'});
      const bike=existing||{id:randomUUID(),type:'bicycle',name:'Vélo personnel',color:'#67c8ed',ownerId:p.id,rentalUntil:null,angle:0};
      Object.assign(bike,spot,{driverId:p.id});if(!existing)vehicles.push(bike);p.vehicleId=bike.id;p.x=spot.x;p.y=spot.y;
     }
    }else return send(400,{error:'Action inconnue.'});
    p.moved=Date.now();save(p);persist();broadcast();return send(200,{player:publicPlayer(p),vehicles});
   }
   if(url.pathname==='/api/trade'){const result=trading(p,body);if(result.status===200)broadcast();return send(result.status,result.data);}
 if(url.pathname==='/api/repairs'){const result=repairs(p,body);if(result.status!==200)return send(result.status,result.data);broadcast();return send(200,{...result.data,player:publicPlayer(p),vehicles});}
 if(url.pathname==='/api/bakery'){
 const account=accounts.get(p.accountKey),near=nearBakery(p);let message='';
 if(body.action){if(body.action!=='buy')return send(400,{error:'Action inconnue.'});if(!near)return send(400,{error:'Approche-toi à pied de Nora devant la boulangerie (2070, 2020).'});
 const item=bakery.catalog.find(item=>item.id===body.id);if(!item||!Number.isSafeInteger(body.quantity)||body.quantity<1||body.quantity>5)return send(400,{error:'Article ou quantité invalide.'});
 if(typeof body.requestId!=='string'||! /^[a-f0-9-]{36}$/i.test(body.requestId))return send(400,{error:'Identifiant d’achat invalide.'});
 const old=(account.bakeryPurchases||[]).find(item=>item.requestId===body.requestId);
 if(old){if(old.id!==item.id||old.quantity!==body.quantity)return send(409,{error:'Cet achat a déjà été enregistré.'});message='Achat déjà enregistré. Aucun nouveau paiement.';}
 else{const price=item.price*body.quantity;if(p.money<price)return send(400,{error:'Argent insuffisant.'});account.supplies??={};const stock=(account.supplies[item.id]||0)+body.quantity;if(!Number.isSafeInteger(stock))return send(400,{error:'Inventaire plein.'});p.money-=price;account.supplies[item.id]=stock;account.bakeryPurchases=[...(account.bakeryPurchases||[]),{requestId:body.requestId,id:item.id,quantity:body.quantity}].slice(-100);save(p);persist();broadcast();message=body.quantity+' '+item.name+' ajouté(s) à ton inventaire. Ouvre-le pour manger ou boire.';}
 }
 return send(200,{player:publicPlayer(p),near,catalog:bakery.catalog,stock:Object.fromEntries(bakery.catalog.map(item=>[item.id,account.supplies?.[item.id]||0])),message});
 }
 if(url.pathname==='/api/clothing'){
 const account=accounts.get(p.accountKey),near=nearClothing(p);let message='';account.wardrobe??=[];
 if(body.action){if(body.action!=='wear')return send(400,{error:'Action inconnue.'});if(!near)return send(400,{error:'Rejoins Nova Style à pied (1650, 647).'});
 const item=clothingCatalog.find(item=>item.id===body.id);if(!item)return send(400,{error:'Tenue inconnue.'});
 if(item.id!=='original'&&!account.wardrobe.includes(item.id)){if(p.money<item.price)return send(400,{error:'Argent insuffisant pour cette tenue.'});p.money-=item.price;account.wardrobe.push(item.id);message='Tenue achetée et ajoutée à ta garde-robe. ';}
 p.outfitId=item.id;message+='Tu portes : '+item.name+'.';save(p);persist();broadcast();}
 return send(200,{player:publicPlayer(p),catalog:clothingCatalog,owned:['original',...account.wardrobe],near,message});
 }
 if(url.pathname==='/api/medic'){
 const account=accounts.get(p.accountKey),near=nearMedic(p);let message='';
 if(body.action){
 if(body.action!=='heal')return send(400,{error:'Action inconnue.'});
 if(!near)return send(400,{error:'Approche-toi à pied du Dr Léa devant l’hôpital (1250, 320).'});
 if(typeof body.requestId!=='string'||! /^[a-f0-9-]{36}$/i.test(body.requestId))return send(400,{error:'Identifiant de soins invalide.'});
 if((account.medicalVisits||[]).includes(body.requestId))message='Ces soins ont déjà été enregistrés. Aucun nouveau paiement.';
 else{if(p.needs.health>=100)return send(409,{error:'Tu es déjà en pleine santé.'});if(p.money<medic.price)return send(400,{error:'Il te faut 50 $ pour ces soins.'});
 p.money-=medic.price;p.needs.health=100;p.needsNotice=null;account.medicalVisits=[...(account.medicalVisits||[]),body.requestId].slice(-100);save(p);persist();broadcast();message='Soins terminés : vie à 100 %. 50 $ payés.';}
 }
 return send(200,{player:publicPlayer(p),near,price:medic.price,message});
 }
 if(url.pathname==='/api/nature-buyer'){
 const account=accounts.get(p.accountKey),near=nearNatureBuyer(p);let message='';
 if(body.action){
 if(body.action!=='sell'||!Object.hasOwn(natureBuyer.prices,body.id))return send(400,{error:'Article ou action invalide.'});
 if(!near)return send(400,{error:'Approche-toi à pied de Hugo près du verger (1370, 1320).'});
 if(typeof body.requestId!=='string'||! /^[a-f0-9-]{36}$/i.test(body.requestId))return send(400,{error:'Identifiant de vente invalide.'});
 const old=(account.natureSales||[]).find(s=>s.id===body.requestId);
 if(old){if(old.item!==body.id||old.quantity!==body.quantity)return send(409,{error:'Cette vente a déjà été traitée.'});message='Vente déjà enregistrée.';}
 else{if(!Number.isSafeInteger(body.quantity)||body.quantity<1||body.quantity>1000000)return send(400,{error:'Quantité invalide.'});
 if((account.supplies?.[body.id]||0)<body.quantity)return send(409,{error:'Stock insuffisant dans ton inventaire.'});
 const total=body.quantity*natureBuyer.prices[body.id];if(!Number.isSafeInteger(p.money+total))return send(400,{error:'Limite de solde atteinte.'});
 account.supplies[body.id]-=body.quantity;p.money+=total;account.natureSales=[...(account.natureSales||[]),{id:body.requestId,item:body.id,quantity:body.quantity}].slice(-100);save(p);persist();broadcast();message='Hugo : Marché conclu ! +'+total+' $.';}
 }
 return send(200,{player:publicPlayer(p),near,stock:{wood:account.supplies?.wood||0,apple:account.supplies?.apple||0},prices:natureBuyer.prices,message});
 }
 if(url.pathname==='/api/harvest-buyer'){
    const account=accounts.get(p.accountKey),near=nearHarvestBuyer(p);let message='';
    if(body.action){
     if(body.action!=='sell')return send(400,{error:'Action inconnue.'});
     if(!near)return send(400,{error:'Approche-toi à pied de Milo sur la place devant le marché clandestin (1150, 650).'});
     if(typeof body.requestId!=='string'||! /^[a-f0-9-]{36}$/i.test(body.requestId))return send(400,{error:'Identifiant de vente invalide.'});
     const old=(account.harvestSales||[]).find(s=>s.id===body.requestId);
     if(old){if(old.quantity!==body.quantity)return send(409,{error:'Cette vente a déjà été traitée.'});message='Vente déjà enregistrée. Ton solde et ton inventaire sont à jour.';}
     else{
      if(!Number.isSafeInteger(body.quantity)||body.quantity<1||body.quantity>1000000)return send(400,{error:'Quantité invalide.'});
      if((account.supplies?.cbd||0)<body.quantity)return send(409,{error:'Tu ne possèdes pas assez de récoltes dans ton inventaire.'});
      const total=body.quantity*illegalMarket.sellPrice;if(!Number.isSafeInteger(p.money+total))return send(400,{error:'Limite de solde atteinte.'});
      account.supplies.cbd-=body.quantity;p.money+=total;account.harvestSales=[...(account.harvestSales||[]),{id:body.requestId,quantity:body.quantity}].slice(-100);save(p);persist();broadcast();message='Milo : « Marché conclu ! '+body.quantity+' récolte(s) achetée(s), '+total+' $ versés. »';
     }
    }
    return send(200,{player:publicPlayer(p),near,stock:account.supplies?.cbd||0,unitPrice:illegalMarket.sellPrice,message});
   }
   if(url.pathname==='/api/illegal-market'||url.pathname==='/api/cultivation'){
    const account=accounts.get(p.accountKey);account.supplies??={water:2,snack:2};account.crops??=[];
    const tracked=url.pathname==='/api/cultivation'&&['plant','installPrinter'].includes(body.action)&&body.requestId!==undefined;
    let replayed=false;
    if(tracked){
     if(typeof body.requestId!=='string'||! /^[a-f0-9-]{36}$/i.test(body.requestId))return send(400,{error:'Identifiant d’installation invalide.'});
     const old=(account.installOperations||[]).find(o=>o.requestId===body.requestId);
     if(old){if(old.action!==body.action)return send(409,{error:'Cet identifiant correspond à une autre installation.'});replayed=true;}
     else if(!Number.isSafeInteger(body.revision)||body.revision!==(account.installRevision||0))return send(409,{error:'Tes installations ont changé. Actualise avant de recommencer.'});
    }
    let renewedLease=false;
    if(url.pathname==='/api/cultivation'&&body.action==='renewLease'){
     const lease=account.home,home=residences.find(h=>h.id===lease?.id);
     if(!home||body.id!==home.id)return send(403,{error:'Aucun ancien bail correspondant à renouveler.'});
     if(!Number.isFinite(body.leaseUntil)||body.leaseUntil!==lease.until||lease.until>Date.now())return send(409,{error:'Le bail a changé. Actualise le logement avant de renouveler.'});
     if(p.vehicleId||!(p.interior?p.interior.id===home.id:Math.hypot(p.x-home.x,p.y-home.y)<=90))return send(403,{error:'Rejoins ton logement pour renouveler le bail.'});
     if([...accounts.values()].some(a=>a.id!==p.id&&a.home?.id===home.id&&a.home.until>Date.now()))return send(409,{error:'Ce logement est maintenant loué par un autre joueur.'});
     if(p.money<home.price)return send(400,{error:'Il te faut '+home.price+' $ sur toi pour renouveler ce bail.'});
     p.money-=home.price;lease.until=Date.now()+home.hours*3600000;p.interior={id:home.id,kind:homeKind(home),private:true,name:home.name};const plan=interiorPlan(p.interior.kind);p.ix=plan.spawn.x;p.iy=plan.spawn.y;p.moved=Date.now();dirty=true;save(p);persist();broadcast();renewedLease=true;
    }
    const leasedHome=residences.find(h=>h.id===account.home?.id);
    const activeHome=account.home?.until>Date.now()?leasedHome:null;
    const expiredHome=leasedHome&&!activeHome?{...leasedHome,until:account.home.until}:null;
    const nearMarket=!p.interior&&(Math.hypot(p.x-illegalMarket.x,p.y-illegalMarket.y)<=illegalMarket.radius||nearHarvestBuyer(p));
    const atHome=!!activeHome&&(p.interior?p.interior.id===activeHome.id:Math.hypot(p.x-activeHome.x,p.y-activeHome.y)<=90);
    let nearHome=atHome&&!p.vehicleId;
    if(['installPrinter','plant','harvest'].includes(body.action)&&atHome&&p.vehicleId){const parked=vehicles.find(v=>v.id===p.vehicleId&&v.driverId===p.id);if(parked)parked.driverId=null;p.vehicleId=null;nearHome=true;}
    const inTrade=['dealer','grower'].includes(p.career);
    if(body.action&&!renewedLease&&!replayed){
     if(url.pathname==='/api/illegal-market'){
      if(!nearMarket)return send(400,{error:'Rejoins à pied le marché clandestin (1150, 630).'});
      if(body.action==='buy'){
       const item=illegalMarket.catalog.find(i=>i.id===body.id);if(!item)return send(400,{error:'Article inconnu.'});
       if(item.id==='printer'&&((account.supplies.printer||0)>0||account.printer))return send(409,{error:'Une imprimante maximum par joueur, installée ou en inventaire.'});
       if(p.money<item.price)return send(400,{error:'Argent insuffisant.'});p.money-=item.price;account.supplies[item.id]=(account.supplies[item.id]||0)+1;
      }else if(body.action==='sell'){
       if(!inTrade)return send(403,{error:'Choisis un métier clandestin au Pôle emploi pour revendre.'});
       if(!(account.supplies.cbd>0))return send(409,{error:'Tu n’as aucune récolte à vendre.'});
       account.supplies.cbd--;p.money+=illegalMarket.sellPrice;
      }else return send(400,{error:'Action inconnue.'});
     }else{
      if(!nearHome)return send(400,{error:expiredHome?'Le bail de '+expiredHome.name+' a expiré. Renouvelle-le pour installer tes objets.':!activeHome?'Tu dois louer un logement avant d’installer tes objets.':p.interior?'Tu es dans une visite ou un autre logement. Rejoins ton logement privé : '+activeHome.name+'.':'Rejoins à pied ton logement : '+activeHome.name+' ('+activeHome.x+', '+activeHome.y+').'});

      if(body.action==='installPrinter'){
       if(account.printer)return send(409,{error:'Une imprimante est déjà installée.'});
       if(!(account.supplies.printer>0))return send(400,{error:'Achète une imprimante au marché clandestin.'});
       account.supplies.printer--;account.printer={homeId:activeHome.id,lastCollectedAt:Date.now()};
      }else if(body.action==='collectPrinter'||body.action==='packPrinter'){
       const printer=account.printer;if(!printer||printer.homeId!==activeHome.id)return send(404,{error:'Aucune imprimante installée dans ce logement.'});
       const amount=Math.min(1000,Math.floor(Math.max(0,Date.now()-printer.lastCollectedAt)/60000)*60);
       if(body.action==='collectPrinter'){
        if(!amount)return send(409,{error:'Aucun billet prêt. Attends la fin du cycle.'});
        p.money+=amount;printer.lastCollectedAt=Date.now();
       }else{
        if(amount>0)return send(409,{error:'Récupère les billets avant de ranger ton imprimante.'});
        account.supplies.printer=(account.supplies.printer||0)+1;account.printer=null;
       }
      }else if(body.action==='plant'){
       if(account.crops.length>=3)return send(409,{error:'Trois cultures maximum par joueur. Récolte tes plants avant d’en ajouter.'});
       if(!['pot','water','seed'].every(id=>account.supplies[id]>0))return send(400,{error:'Il te faut un pot, une bouteille d’eau et une graine du marché.'});
       for(const id of ['pot','water','seed'])account.supplies[id]--;
       account.crops.push({id:randomUUID(),homeId:activeHome.id,readyAt:Date.now()+illegalMarket.growthMs});
      }else if(body.action==='harvest'){
       const index=account.crops.findIndex(c=>c.id===body.id&&c.homeId===activeHome.id);if(index<0)return send(404,{error:'Culture introuvable dans ce logement.'});
       if(account.crops[index].readyAt>Date.now())return send(409,{error:'La plante n’est pas encore prête.'});
       account.crops.splice(index,1);account.supplies.cbd=(account.supplies.cbd||0)+1;account.supplies.pot=(account.supplies.pot||0)+1;
      }else return send(400,{error:'Action inconnue.'});
     }
     if(url.pathname==='/api/illegal-market'&&p.vehicleId){const parked=vehicles.find(v=>v.id===p.vehicleId&&v.driverId===p.id);if(parked)parked.driverId=null;p.vehicleId=null;}
     if(tracked){account.installRevision=(account.installRevision||0)+1;account.installOperations=[...(account.installOperations||[]),{requestId:body.requestId,action:body.action}].slice(-100);}
     dirty=true;save(p);persist();broadcast();
    }
    return send(200,{player:publicPlayer(p),market:illegalMarket,nearMarket,nearHome,inTrade,installRevision:account.installRevision||0,acknowledgedInstallations:(account.installOperations||[]).slice(-20).map(o=>o.requestId),expiredHome,canRenewLease:!!expiredHome&&!p.vehicleId&&(p.interior?p.interior.id===expiredHome.id:Math.hypot(p.x-expiredHome.x,p.y-expiredHome.y)<=90)&&![...accounts.values()].some(a=>a.id!==p.id&&a.home?.id===expiredHome.id&&a.home.until>Date.now()),homeAccessMessage:expiredHome?'Ton bail a expiré. Renouvelle-le ci-dessous pour continuer.':!activeHome?'Aucun bail actif. Loue un logement dans Résidences.':!nearHome?(p.interior?'Tu es en visite ou dans un autre logement. Ton logement privé est '+activeHome.name+'.':'Rejoins ton logement loué : '+activeHome.name+'.'):'Tu es bien dans ton logement : installation autorisée si tu possèdes les fournitures.',home:activeHome?{...activeHome,until:account.home.until}:null,printer:account.printer?{...account.printer,amount:Math.min(1000,Math.floor(Math.max(0,Math.min(Date.now(),account.home?.id===account.printer.homeId?account.home.until:account.printer.lastCollectedAt)-account.printer.lastCollectedAt)/60000)*60),cycleMs:60000,payout:60,capacity:1000}:null,crops:account.crops.map(c=>({...c,ready:c.readyAt<=Date.now()})),supplies:account.supplies,serverTime:Date.now()});
   }
   if(url.pathname==='/api/trunk'){
    const account=accounts.get(p.accountKey);
    const eligible=vehicles.filter(v=>v.ownerId===p.id&&['car','policecar','firetruck','quad'].includes(v.type));
    const vehicle=(body.vehicleId?eligible.find(v=>v.id===body.vehicleId):null)||(body.vehicleId?[]:eligible).filter(v=>!v.driverId&&Math.hypot(v.x-p.x,v.y-p.y)<=85).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
    if(!vehicle)return send(403,{error:'Ce coffre ne t’appartient pas, ou aucun véhicule personnel compatible n’est à proximité.'});
    if(p.vehicleId||p.interior||p.cuffs||p.respawnAt||vehicle.driverId||Math.hypot(vehicle.x-p.x,vehicle.y-p.y)>85)return send(403,{error:'Descends et approche-toi à pied de ton véhicule stationné pour ouvrir le coffre.'});
    account.supplies??={};vehicle.trunk??={};
    const allowed=['repairkit',...bakery.catalog.map(item=>item.id),'axe','wood','apple','lockpick','printer','pot','seed','cbd','water','snack'];
    const action=body.action;
    if(action!==undefined){
     if(!['deposit','withdraw'].includes(action)||typeof body.id!=='string'||!allowed.includes(body.id)||!Number.isSafeInteger(body.quantity)||body.quantity<1||body.quantity>100)return send(400,{error:'Objet ou quantité invalide.'});
     const from=action==='deposit'?account.supplies:vehicle.trunk,to=action==='deposit'?vehicle.trunk:account.supplies;
     if(!Number.isSafeInteger(from[body.id]||0)||(from[body.id]||0)<body.quantity)return send(409,{error:'Quantité insuffisante.'});
     const occupied=Object.values(vehicle.trunk).reduce((sum,n)=>sum+(Number.isSafeInteger(n)&&n>0?n:0),0);
     if(action==='deposit'&&occupied+body.quantity>40)return send(409,{error:'Coffre plein : maximum 40 objets.'});
     if(!Number.isSafeInteger(to[body.id]||0)||(to[body.id]||0)>Number.MAX_SAFE_INTEGER-body.quantity)return send(409,{error:'Capacité de l’inventaire dépassée.'});
     from[body.id]-=body.quantity;to[body.id]=(to[body.id]||0)+body.quantity;
     if(!from[body.id])delete from[body.id];
     saveVehicle(vehicle);dirty=true;persist();broadcast();
    }
    return send(200,{vehicleId:vehicle.id,vehicleName:vehicle.name,capacity:40,trunk:vehicle.trunk,supplies:account.supplies,message:action?(action==='deposit'?'Objet déposé dans le coffre.':'Objet récupéré du coffre.'):'Coffre ouvert.'});
   }
   if(url.pathname==='/api/inventory'){
    const account=accounts.get(p.accountKey),catalog={repairkit:{name:'Kit de réparation',icon:'🧰',description:'Remet un véhicule à 100 %. Descends près de ton véhicule endommagé avant de l’utiliser.',usable:true,actionLabel:'Réparer mon véhicule'},...Object.fromEntries(bakery.catalog.map(item=>[item.id,{name:item.name,icon:item.icon,description:item.description,usable:true}])),axe:{name:'Hache',icon:'🪓',description:'Nécessaire pour couper du bois. Réutilisable : approche-toi d’un arbre au Bois de Nova.',usable:false},wood:{name:'Bois',icon:'🪵',description:'Ressource récoltée au Bois de Nova.',usable:false},apple:{name:'Pomme',icon:'🍎',description:'Restaure 20 de nourriture, 5 d’hydratation et 2 de vie.',usable:true},lockpick:{name:'Crochet de serrure RP',icon:'🗝️',description:'Objet fictif : utilise Crocheter près d’une voiture ou d’un logement. Un crochet consommé par tentative.',usable:false},printer:{name:'Imprimante à billets fictifs',icon:'🖨️',description:'À installer dans ton logement via Imprimante chez moi.',usable:false},pot:{name:'Pot de culture',icon:'🪴',description:'Pour une culture fictive dans ton logement.',usable:false},seed:{name:'Graine de CBD fictif',icon:'🌱',description:'Objet de jeu acheté au marché clandestin.',usable:false},cbd:{name:'Récolte de CBD fictif',icon:'🌿',description:'À revendre au marché clandestin.',usable:false},water:{name:"Bouteille d’eau",icon:'💧',description:'Restaure 40 d’hydratation.'},snack:{name:'Barre de céréales',icon:'🍫',description:'Restaure 35 de nourriture et 5 de vie.'}};
    account.supplies??={water:2,snack:2};let keyMessage='';
    if(body.action==='use'&&body.id==='repairkit'){const result=repairs(p,{action:'repair',id:body.vehicleId});if(result.status!==200)return send(result.status,result.data);keyMessage=result.data.message;broadcast();}else if(body.action==='use'&&body.id==='home-key'){
     const lease=account.home,home=lease?.until>Date.now()?residences.find(h=>h.id===lease.id):null;
     if(!home)return send(403,{error:'Tu ne possèdes pas de clé valide pour ce logement.'});
     if(p.cuffs)return send(403,{error:'Un policier doit te libérer avant d’utiliser ta clé.'});
     if(p.vehicleId||!(p.interior?.id===home.id||(!p.interior&&Math.hypot(p.x-home.x,p.y-home.y)<=90)))return send(400,{error:'Approche-toi à pied de ta porte ou entre chez toi pour utiliser la clé.'});
     if(!['open','lock'].includes(body.doorAction))return send(400,{error:'Choisis ouvrir ou verrouiller avec la clé.'});
     lease.locked=body.doorAction==='lock';dirty=true;persist();broadcast();keyMessage=lease.locked?'Clé utilisée : porte fermée et verrouillée.':'Clé utilisée : porte ouverte aux visiteurs.';
    }else if(body.action){
     if(body.action!=='use'||(!Object.hasOwn(catalog,body.id)||catalog[body.id].usable===false))return send(400,{error:'Objet ou action inconnus.'});
     if(!(account.supplies[body.id]>0))return send(409,{error:'Tu ne possèdes plus cet objet.'});
     account.supplies[body.id]--;needs.consume(p,body.id);save(p);dirty=true;persist();broadcast();
    }
    const items=Object.entries(catalog).filter(([id])=>account.supplies[id]>0).map(([id,item])=>({id,...item,quantity:account.supplies[id],usable:item.usable!==false}));
    if(account.printer)items.push({id:'installed-printer',name:'Imprimante installée',icon:'🖨️',quantity:1,description:'Dans ton logement · ouvre Imprimante chez moi.',usable:false});
    items.unshift({id:'identity',name:'Carte d’identité',icon:'🪪',quantity:1,description:'Identité : '+p.name,usable:false});
    if(p.career==='police')items.push({id:'handcuffs',name:'Menottes de service',icon:'🔗',quantity:1,description:'Police · P : menotter ou libérer un joueur proche.',usable:false});
    if(p.career){const career=employment.careers.find(c=>c.id===p.career);if(career)items.push({id:'work-card',name:'Carte professionnelle',icon:career.icon,quantity:1,description:career.name,usable:false});}
    if(p.job)items.push({id:'parcel',name:'Colis de livraison',icon:'📦',quantity:1,description:'À livrer devant le commissariat avec Interagir.',usable:false});
    if(p.workActive)items.push({id:'mission',name:'Ordre de mission',icon:'📋',quantity:1,description:employment.careers.find(c=>c.id===p.career)?.task||'Mission en cours',usable:false});
    if(p.career==='police'&&p.policeWeapon){items.push({id:'service-weapon',name:'Arme de service',icon:'🔫',quantity:1,description:'À rendre ou recharger au distributeur du commissariat.',usable:false});if(p.ammo>0)items.push({id:'ammo',name:'Cartouches de service',icon:'▪',quantity:p.ammo,description:'Munitions du chargeur de ton arme.',usable:false});}
    items.push({id:'bicycle',name:'Vélo personnel',icon:'🚲',quantity:1,description:'Gratuit · utilise le bouton Vélo ou la touche V pour le sortir et le ranger partout.',usable:false});
    for(const v of vehicles.filter(v=>v.ownerId===p.id&&v.type!=='bicycle'))items.push({id:'key-'+v.id,name:'Clés · '+v.name,icon:'🔑',quantity:1,description:v.rentalUntil?'Véhicule loué':'Véhicule acheté',usable:false});
    if(account.home?.until>Date.now())items.push({id:'home-key',name:'Clé du logement',icon:'🔑',quantity:1,description:(residences.find(h=>h.id===account.home.id)?.name||'Ton logement')+' · Clé personnelle réutilisable pendant ton bail.',usable:true,actionLabel:account.home.locked===false?'Verrouiller avec ma clé':'Ouvrir avec ma clé',doorAction:account.home.locked===false?'lock':'open'});
    return send(200,{items,vehicles,money:p.money,player:publicPlayer(p),message:keyMessage||(body.action?'Objet consommé.':'')});
   }
   if(url.pathname==='/api/armory'){
    if(p.career!=='police')return send(403,{error:'Distributeur réservé aux policiers. Choisis ce métier au Pôle emploi.'});
    if(p.vehicleId||Math.hypot(p.x-800,p.y-335)>70)return send(400,{error:'Rejoins à pied le distributeur devant le commissariat (800, 335).'});
    if(body.action==='equip'){p.policeWeapon=true;p.ammo=12;}
    else if(body.action==='return'){p.policeWeapon=false;p.ammo=0;}
    else return send(400,{error:'Action inconnue.'});
    save(p);persist();broadcast();return send(200,{player:publicPlayer(p)});
   }
   if(url.pathname==='/api/fire'){
    if(p.career!=='police'||!p.policeWeapon)return send(403,{error:'Récupère ton arme de service au commissariat.'});
    if(p.vehicleId)return send(400,{error:'Descends du véhicule pour utiliser ton arme.'});
    if(!p.ammo)return send(400,{error:'Chargeur vide. Retourne au distributeur.'});
    if(Date.now()-(p.lastShot||0)<450)return send(429,{error:'Patiente avant de tirer à nouveau.'});
    p.lastShot=Date.now();p.ammo--;save(p);persist();broadcast();return send(200,{player:publicPlayer(p)});
   }
   if(url.pathname==='/api/employment'){
    const near=Math.hypot(p.x-employment.x,p.y-employment.y)<=employment.radius;
    const atFireStation=Math.hypot(p.x-680,p.y-990)<=85;
    const allowedHere=near||(atFireStation&&(body.action==='choose'?body.career:p.career)==='firefighter');
    if(body.action==='choose'){
     if(!allowedHere)return send(400,{error:'Rejoins le Pôle emploi ou la caserne pour le métier de pompier.'});
     if(p.workActive||p.job)return send(409,{error:'Termine ta mission en cours avant de changer de métier.'});
     if(!employment.careers.some(c=>c.id===body.career))return send(400,{error:'Métier inconnu.'});
     if(p.vehicleId){const parked=vehicles.find(v=>v.id===p.vehicleId&&v.driverId===p.id);if(parked)parked.driverId=null;p.vehicleId=null;}
     p.career=body.career;if(p.career!=='police'){p.policeWeapon=false;p.ammo=0;}
    }else if(body.action==='cancel'){
     p.workActive=false;p.workObjectiveReached=false;p.job=false;
    }else if(['work','start','complete'].includes(body.action)){
     const career=employment.careers.find(c=>c.id===p.career);
     if(!career)return send(400,{error:'Choisis un métier au Pôle emploi.'});
     if(['dealer','grower'].includes(p.career))return send(400,{error:'Utilise le marché clandestin et Culture chez moi pour ce métier.'});
     if(p.vehicleId){if(p.workActive&&allowedHere&&p.workObjectiveReached&&body.action!=='start'){const parked=vehicles.find(v=>v.id===p.vehicleId&&v.driverId===p.id);if(parked)parked.driverId=null;p.vehicleId=null;}else return send(400,{error:'Descends de ton véhicule pour travailler.'});}
     if(body.action==='complete'&&!p.workActive)return send(409,{error:'Cette mission est déjà terminée ou inactive. Actualise les métiers pour vérifier ton solde.'});
     if(body.action==='start'&&p.workActive)return send(409,{error:'Tu as déjà une mission en cours.'});
     if(!p.workActive){
      if(!allowedHere)return send(400,{error:'Reviens au Pôle emploi ou, pour les pompiers, à la caserne pour prendre ta mission.'});
      if(p.job)return send(409,{error:'Termine ta livraison en cours.'});
      p.workActive=true;p.workObjectiveReached=false;
     }else{
      if(Math.hypot(p.x-career.x,p.y-career.y)>85&&!(allowedHere&&p.workObjectiveReached))return send(400,{error:'Effectue d’abord ton objectif : '+career.task+'. Puis reviens au Pôle emploi pour terminer et toucher ton salaire.'});
      p.money+=career.reward;p.workActive=false;p.workObjectiveReached=false;
     }
    }else if(body.action)return send(400,{error:'Action inconnue.'});
    save(p);persist();broadcast();return send(200,{player:publicPlayer(p),employment});
   }
   if(url.pathname==='/api/logout'){save(p);persist();for(const v of vehicles)if(v.driverId===p.id)v.driverId=null;streams.get(p.token)?.end();streams.delete(p.token);players.delete(p.token);cookie('',0);broadcast();return send(200,{ok:true});}
   if(url.pathname==='/api/move'){
    const dx=Number(body.dx),dy=Number(body.dy);if(!Number.isFinite(dx)||!Number.isFinite(dy))return send(400,{error:'Déplacement invalide'});
    const vehicle=vehicles.find(v=>v.id===p.vehicleId&&v.driverId===p.id);
    if(motorized(vehicle)&&vehicleHealth(vehicle)<=0){p.moved=Date.now();return send(200,{player:publicPlayer(p),vehicles,message:'Véhicule en panne : descends et utilise un kit de réparation.'});}
    const now=Date.now(),distance=Math.max(0,Math.min((now-p.moved)/1000,0.2))*(vehicle?(({car:420,policecar:440,firetruck:320,quad:350,bicycle:270,scooter:300}[vehicle.type]||300)):170);p.moved=now;const norm=Math.max(1,Math.hypot(dx,dy)),steps=Math.max(1,Math.ceil(distance/6)),radius=vehicle?(({car:27,policecar:27,firetruck:36,quad:23,bicycle:17,scooter:17}[vehicle.type]||17)):13;
    let collision=false;for(let i=0;i<steps;i++){const x=p.x+dx/norm*distance/steps,y=p.y+dy/norm*distance/steps;if(!blocked(x,p.y,radius))p.x=x;else if(dx!==0)collision=true;if(!blocked(p.x,y,radius))p.y=y;else if(dy!==0)collision=true;}if(vehicle&&collision&&distance>1&&damageVehicle(vehicle)){saveVehicle(vehicle);persist();}
    if(vehicle){vehicle.x=p.x;vehicle.y=p.y;if(dx||dy)vehicle.angle=Math.atan2(dy,dx)+Math.PI/2;}
   }else if(url.pathname==='/api/vehicle'){
    const current=vehicles.find(v=>v.id===p.vehicleId&&v.driverId===p.id);
    if(current){
     const exit=[[45,0],[-45,0],[0,45],[0,-45]].map(([dx,dy])=>({x:current.x+dx,y:current.y+dy})).find(pos=>!blocked(pos.x,pos.y));
     if(!exit)return send(400,{error:'Pas assez de place pour descendre ici.'});
     p.x=exit.x;p.y=exit.y;p.vehicleId=null;current.driverId=null;
    }else{
     const nearest=vehicles.filter(v=>!v.driverId&&(!v.ownerId||v.ownerId===p.id||(p.pickedVehicles?.[v.id]===true||p.pickedVehicles?.[v.id]>Date.now()))&&Math.hypot(v.x-p.x,v.y-p.y)<=75).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
     if(!nearest)return send(400,{error:'Approche-toi d’une voiture ou d’un scooter libre (75 pas maximum).'});
     nearest.driverId=p.id;p.vehicleId=nearest.id;p.x=nearest.x;p.y=nearest.y;
    }
    p.moved=Date.now();
   }else if(url.pathname==='/api/chat'){
    if((accounts.get(p.accountKey).mutedUntil||0)>Date.now())return send(403,{error:'Tu es muet temporairement. Réessaie après la fin des 10 minutes.'});
    if(Date.now()-p.chatAt<900)return send(429,{error:'Patiente un instant entre deux messages.'});
    const text=String(body.text||'').trim().slice(0,180);if(!text)return send(400,{error:'Message vide'});p.chatAt=Date.now();messages.push({id:randomUUID(),name:p.name,text});if(messages.length>35)messages.shift();
   }else if(url.pathname==='/api/interact'){
    if(p.workActive)return send(409,{error:'Termine ta mission professionnelle avec le bouton Métiers.'});
    const at=(x,y)=>Math.hypot(p.x-x,p.y-y)<85;
    if(at(455,700)){p.job=true;}
    else if(at(680,335)&&p.job){p.money+=75;p.job=false;}
    else return send(400,{error:p.job?'Approche-toi du point de livraison bleu.':'Approche-toi du dépôt de livraison jaune.'});
   }else return send(404,{error:'Action inconnue'});
   save(p);if(url.pathname==='/api/interact')persist();broadcast();return send(200,{player:publicPlayer(p)});
   }catch {return send(400,{error:'Requête invalide'});}
  }
  const files={'/robots.txt':'robots.txt','/sitemap.xml':'sitemap.xml','/punch.js':'punch.js','/atm-world.js':'atm-world.js','/bank.js':'bank.js','/caravan-camp-world.js':'caravan-camp-world.js','/caravan-camp.js':'caravan-camp.js','/mobile.js':'mobile.js','/visuals.js':'visuals.js','/interior-visuals.js':'interior-visuals.js','/trading.js':'trading.js','/harvest-buyer-world.js':'harvest-buyer-world.js','/vehicle-repair.js':'vehicle-repair.js','/vehicle-dealer.js':'vehicle-dealer.js','/repairs.js':'repairs.js','/mechanic-world.js':'mechanic-world.js','/bakery.js':'bakery.js','/bakery-world.js':'bakery-world.js','/clothing.js':'clothing.js','/clothing-world.js':'clothing-world.js','/medic.js':'medic.js','/medic-world.js':'medic-world.js','/characters.js':'characters.js','/needs.js':'needs.js','/nature-buyer.js':'nature-buyer.js','/nature-buyer-world.js':'nature-buyer-world.js','/nature.js':'nature.js','/nature-world.js':'nature-world.js','/interior-actions.js':'interior-actions.js','/harvest-buyer.js':'harvest-buyer.js','/servers.js':'servers.js','/lockpicking.js':'lockpicking.js','/doors.js':'doors.js','/graphics.js':'graphics.js','/support.js':'support.js','/employment.js':'employment.js','/police.js':'police.js','/day-night.js':'day-night.js','/interiors.js':'interiors.js','/gps.js':'gps.js','/gps-route.js':'gps-route.js','/carte':'map.html','/map.html':'map.html','/map.js':'map.js','/':'index.html','/style.css':'style.css','/game.js':'game.js','/garage.js':'garage.js','/housing.js':'housing.js','/voice.js':'voice.js','/illegal.js':'illegal.js'};const file=files[url.pathname];if(!file){res.writeHead(404);return res.end('Introuvable');}
  try{const data=await readFile(new URL(`./public/${file}`,import.meta.url));res.writeHead(200,{'Content-Type':file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':file.endsWith('.xml')?'application/xml; charset=utf-8':file.endsWith('.txt')?'text/plain; charset=utf-8':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'"});res.end(data);}catch{res.writeHead(500);res.end('Erreur serveur');}
 });
 const saver=setInterval(()=>{try{persist();}catch(err){console.error('Sauvegarde impossible:',err.message);}},1000);saver.unref();
 const timer=setInterval(()=>{for(const p of players.values())if(needs.tick(p))save(p);expireRentals();for(const [token,p]of players)if(Date.now()-p.seen>120000){save(p);for(const v of vehicles)if(v.driverId===p.id)v.driverId=null;streams.get(token)?.end();streams.delete(token);players.delete(token);}for(const [key,a]of attempts)if(Date.now()>a.until)attempts.delete(key);broadcast();},10000);timer.unref();server.on('close',()=>{clearInterval(timer);clearInterval(saver);for(const p of players.values())save(p);persist();});return server;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const port=Number(process.env.PORT)||3000;const deployment=deploymentConfig();const imported=seedPersistentData(deployment);if(imported)console.log('Import privé des sauvegardes : '+imported+' fichier(s).');const gameServer=createGameServer({deployment});gameServer.listen(port,'0.0.0.0',()=>console.log(`Dark Nova RP : http://localhost:${port}`));const shutdown=()=>{gameServer.close();gameServer.closeAllConnections();};process.once('SIGTERM',shutdown);process.once('SIGINT',shutdown);}
