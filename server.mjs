import {createTrading} from './trading.mjs';
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
export const world={width:11040,height:8640};
const names=['HÔPITAL NOVA','MAIRIE','LES ARCADES','GARAGE CENTRAL','RÉSIDENCE SOLEIL','BIBLIOTHÈQUE','MARCHÉ DES HALLES','STUDIO MUSIQUE','CINÉMA ÉTOILE','CAMPUS NOVA','HALLE SPORTIVE','BOULANGERIE'];
for(let column=0;column<3;column++)for(let row=0;row<6;row++)for(let side=0;side<2;side++){
 if(column===0&&row<3)continue;
 if(column===2&&row===3)continue;
 const index=(column*12+row*2+side)%names.length;
 buildings.push({x:100+column*920+side*450,y:[100,430,790,1150,1510,1870][row],w:260,h:160,name:names[index],color:['#547caa','#bd805c','#609c8b','#9b7bac','#799d72'][index%5]});
}
const residences=[{id:'azur',name:'Studio Azur',x:230,y:320,price:180,hours:24,description:'Un premier studio dans le centre historique.'}];
for(let column=0;column<world.width/920;column++)for(let row=0;row<world.height/360;row++){
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
buildings.push({x:1550,y:1150,w:280,h:160,name:'VILLA DARK NOVA',color:'#e7d6b3',kind:'villa'});
export const interiorEntrances=buildings.filter(b=>b.kind==='villa'||b.name==='VILLA DES PINS').map(b=>({id:b.name==='VILLA DES PINS'?'villa-pins':'villa',name:b.name,x:b.x+b.w/2,y:b.y+b.h+(b.kind==='villa'?76:37)}));
export const illegalMarket={x:1150,y:630,radius:85,growthMs:120000,sellPrice:120,catalog:[{id:'printer',name:'Imprimante à billets fictifs',icon:'🖨️',price:600},{id:'pot',name:'Pot de culture',icon:'🪴',price:60},{id:'water',name:'Bouteille d’eau',icon:'💧',price:10},{id:'seed',name:'Graine de CBD fictif',icon:'🌱',price:20}]};
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
export function blocked(x,y,radius=13) { return x<radius+5||y<radius+5||x>world.width-radius-5||y>world.height-radius-5||buildings.some(b=>x>b.x-radius&&x<b.x+b.w+radius&&y>b.y-radius&&y<b.y+b.h+radius); }
const derive=promisify(scrypt);
export const garage={x:455,y:520,radius:95,rentalMinutes:10,catalog:[{type:'scooter',name:'Scooter Nova',rent:60,buy:650,color:'#a6e1ce'},{type:'car',name:'Citadine Nova',rent:120,buy:1500,color:'#efba6d'},{type:'firetruck',name:'Camion de pompiers',rent:180,buy:3500,color:'#dc3038'},{type:'policecar',name:'Voiture de police',rent:150,buy:2500,color:'#ffffff'},{type:'quad',name:'Quad Nova',rent:90,buy:1200,color:'#e8a741'}]};
export function createGameServer({moderatorIds=null,dataFile=fileURLToPath(new URL('./data/accounts.json',import.meta.url))}={}) {
 const accounts=new Map();let dirty=false;
 if(moderatorIds===null){try{moderatorIds=JSON.parse(readFileSync(new URL('./data/moderators.json',import.meta.url),'utf8'));}catch(err){if(err.code!=='ENOENT')throw err;moderatorIds=[];}}
 const moderators=new Set(moderatorIds);const isModerator=p=>moderators.has(p.id);
 const moderationHistory=[];
 if(dataFile){try{for(const a of JSON.parse(readFileSync(dataFile,'utf8')))accounts.set(a.key,a);}catch(err){if(err.code!=='ENOENT')throw err;}}
 for(const a of accounts.values())if(!a.supplies){a.supplies={water:2,snack:2};dirty=true;}
 const persist=()=>{if(!dirty||!dataFile)return;mkdirSync(dirname(dataFile),{recursive:true});writeFileSync(dataFile+'.tmp',JSON.stringify([...accounts.values()]),{mode:0o600});renameSync(dataFile+'.tmp',dataFile);dirty=false;};
 const save=p=>{const a=accounts.get(p.accountKey);if(a){Object.assign(a,{x:p.x,y:p.y,money:p.money,job:p.job,career:p.career,workActive:p.workActive,policeWeapon:p.career==='police'&&!!p.policeWeapon,ammo:p.career==='police'?(p.ammo||0):0,garage:vehicles.filter(v=>v.ownerId===p.id&&v.type!=='bicycle').map(({driverId,...v})=>v)});dirty=true;}};
 const attempts=new Map();
 const players=new Map(), streams=new Map(), messages=[];
 const voiceMembers=new Map();
 const voiceState=()=>{for(const [token,seen] of voiceMembers){const member=players.get(token);if(!member||Date.now()-seen>45000||(accounts.get(member.accountKey).mutedUntil||0)>Date.now())voiceMembers.delete(token);}return [...voiceMembers.keys()].map(token=>{const p=players.get(token);return {id:p.id,name:p.name};});};
 const vehicles=[];
 for(const a of accounts.values())for(const v of a.garage||[])if(!v.rentalUntil||v.rentalUntil>Date.now())vehicles.push({...v,ownerId:a.id,driverId:null});
 const vehicleRadius={car:27,policecar:27,firetruck:36,quad:23,scooter:17};
 for(const vehicle of vehicles)if(blocked(vehicle.x,vehicle.y,vehicleRadius[vehicle.type]||17)){vehicle.x=425;vehicle.y=580;const account=[...accounts.values()].find(a=>a.id===vehicle.ownerId);const stored=account?.garage?.find(v=>v.id===vehicle.id);if(stored){stored.x=vehicle.x;stored.y=vehicle.y;dirty=true;}}
 const expireRentals=()=>{for(let i=vehicles.length-1;i>=0;i--){const v=vehicles[i];if(v.rentalUntil&&v.rentalUntil<=Date.now()){for(const p of players.values())if(p.vehicleId===v.id)p.vehicleId=null;vehicles.splice(i,1);const a=[...accounts.values()].find(a=>a.id===v.ownerId);if(a){a.garage=(a.garage||[]).filter(item=>item.id!==v.id);dirty=true;}}}};
 const garageState=p=>({catalog:garage.catalog,rentalMinutes:garage.rentalMinutes,vehicles:vehicles.filter(v=>v.ownerId===p.id),money:p.money});
 const publicPlayer=p=>({id:p.id,name:p.name,color:p.color,x:p.x,y:p.y,money:p.money,job:p.job,career:p.career,workActive:p.workActive,policeWeapon:p.career==='police'&&!!p.policeWeapon,ammo:p.career==='police'?(p.ammo||0):0,vehicleId:p.vehicleId||null,interior:p.interior||null,ix:p.ix,iy:p.iy,isModerator:isModerator(p)});
 const broadcast=()=>{for(let i=vehicles.length-1;i>=0;i--)if(vehicles[i].type==='bicycle'&&![...players.values()].some(p=>p.id===vehicles[i].ownerId))vehicles.splice(i,1);const data=`data: ${JSON.stringify({players:[...players.values()].map(publicPlayer),vehicles,messages,voice:voiceState()})}\n\n`;for(const s of streams.values())s.write(data);};
 const trading=createTrading({accounts,players,save,persist,markDirty:()=>{dirty=true;},notify:(id,message)=>{const player=[...players.values()].find(p=>p.id===id);if(player)streams.get(player.token)?.write('event: trade-update\ndata: '+JSON.stringify({message})+'\n\n');}});
 const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  const send=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  const sessionToken=()=>{const match=(req.headers.cookie||'').match(/(?:^|;\s*)nova_session=([a-f0-9]{64})(?:;|$)/);return match?.[1];};
  const cookie=(value,age)=>res.setHeader('Set-Cookie',`nova_session=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${process.env.NODE_ENV==='production'?'; Secure':''}`);
  if(req.method==='GET'&&url.pathname==='/api/time')return send(200,{serverTime:Date.now(),timezone:'Europe/Paris'});
  if(req.method==='GET'&&url.pathname==='/api/world')return send(200,{buildings,...world,garage,residences,employment,illegalMarket,rentalDistrict,interiorEntrances});
  if(req.method==='GET'&&url.pathname==='/events') {
   const p=players.get(sessionToken());if(!p)return send(401,{error:'Session expirée. Rejoins la ville.'});
   streams.get(p.token)?.end();res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});streams.set(p.token,res);p.seen=Date.now();broadcast();
   req.on('close',()=>{if(streams.get(p.token)===res)streams.delete(p.token);});return;
  }
  if(req.method==='POST'&&url.pathname.startsWith('/api/')){
   if(req.headers['sec-fetch-site']==='cross-site'||(req.headers.origin&&req.headers.origin!==`${req.socket.encrypted?'https':'http'}://${req.headers.host}`))return send(403,{error:'Origine refusée'});
   let raw='';try {for await(const chunk of req){raw+=chunk;if(raw.length>(url.pathname==='/api/voice'?16384:4096)){send(413,{error:'Message trop long'});return;}}const body=JSON.parse(raw||'{}');
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
     const colors=['#c3f36a','#8bc7ff','#ffb3d4','#ffce78'];account={key,id:randomUUID(),name,email,salt,hash,color:colors.includes(body.color)?body.color:colors[0],x:455,y:355,money:250,job:false,supplies:{water:2,snack:2}};accounts.set(key,account);dirty=true;persist();
    }else{
     const hash=await derive(password,account?.salt||'nova-dummy-salt',64);
     if(!account||!timingSafeEqual(hash,Buffer.from(account.hash,'hex')))return send(401,{error:'Pseudo ou mot de passe incorrect.'});
    }
    for(const [old,p]of players)if(p.accountKey===key){save(p);for(const v of vehicles)if(v.driverId===p.id)v.driverId=null;streams.get(old)?.end();streams.delete(old);players.delete(old);}
    if(players.size>=60)return send(503,{error:'La ville est complète.'});
    const token=randomBytes(32).toString('hex'),p={token,id:account.id,accountKey:key,name:account.name,color:account.color,x:account.x,y:account.y,money:account.money,job:account.job,career:account.career||null,workActive:account.workActive||false,policeWeapon:account.career==='police'&&!!account.policeWeapon,ammo:account.career==='police'?(account.ammo||0):0,seen:Date.now(),moved:Date.now(),chatAt:0};if(blocked(p.x,p.y)){p.x=455;p.y=355;}players.set(token,p);cookie(token,86400);broadcast();return send(200,{player:publicPlayer(p)});
   }
   const p=players.get(sessionToken());if(!p)return send(401,{error:'Session expirée. Reconnecte-toi.'});p.seen=Date.now();
   expireRentals();
   if(p.interior?.kind==='home'||p.interior?.private){const lease=accounts.get(p.accountKey).home;if(!lease||lease.until<=Date.now()||lease.id!==p.interior.id){p.interior=null;p.moved=Date.now();}}
   if(url.pathname==='/api/interior'){
    if(body.action==='exit'){p.interior=null;}
    else if(body.action==='enter'){
     if(p.interior)return send(409,{error:'Tu es déjà à l’intérieur.'});

     const lease=accounts.get(p.accountKey).home,home=lease?.until>Date.now()?residences.find(h=>h.id===lease.id):null;
     const entrance=interiorEntrances.find(e=>(!body.id||body.id===e.id)&&Math.hypot(p.x-e.x,p.y-e.y)<=90);
     if(home&&(!body.id||body.id===home.id)&&Math.hypot(p.x-home.x,p.y-home.y)<=90)p.interior={id:home.id,kind:home.buildingName==='VILLA DES PINS'?'villa':'home',private:true,name:home.name};
     else if(entrance)p.interior={id:entrance.id,kind:'villa',name:entrance.name+' · Visite'};
     else return send(403,{error:'Rejoins à pied la porte de la Villa des Pins ou de ton logement loué.'});
     if(p.vehicleId){const vehicle=vehicles.find(v=>v.id===p.vehicleId&&v.driverId===p.id);if(vehicle)vehicle.driverId=null;p.vehicleId=null;}
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
   if(p.interior&&!['/api/trade','/api/session','/api/logout','/api/chat','/api/voice','/api/inventory','/api/cultivation','/api/moderation'].includes(url.pathname))return send(400,{error:'Sors du logement pour effectuer cette action.'});
   if(url.pathname==='/api/trade'){const result=trading(p,body);if(result.status===200&&body.action)broadcast();return send(result.status,result.data);}
   if(url.pathname==='/api/session')return send(200,{player:publicPlayer(p)});
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
      p.money-=home.price;account.home={id:home.id,until:Date.now()+home.hours*3600000};
     }else if(body.action==='leave'){
      if(!active(account)||account.home.id!==home.id)return send(403,{error:'Tu ne loues pas ce logement.'});account.home=null;
     }else return send(400,{error:'Action inconnue.'});
     save(p);persist();broadcast();
    }
    const home=active(account)?account.home:null;
    return send(200,{player:publicPlayer(p),home,residences:residences.map(h=>({...h,occupied:[...accounts.values()].some(a=>active(a)&&a.home.id===h.id)}))});
   }
   if(url.pathname==='/api/garage'){
    if(body.action){
     if(Math.hypot(p.x-garage.x,p.y-garage.y)>garage.radius)return send(400,{error:'Rejoins le repère violet devant le Garage Nova.'});
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
      selected={id:randomUUID(),type:model.type,name:model.name,color:model.color,ownerId:p.id,rentalUntil:body.action==='rent'?Date.now()+garage.rentalMinutes*60000:null,x:['car','policecar'].includes(model.type)?425:model.type==='firetruck'?455:490,y:model.type==='firetruck'?610:580,angle:0,driverId:null};
      p.money-=price;vehicles.push(selected);
     }else if(body.action==='retrieve'){
      selected=owned;if(!selected)return send(400,{error:'Tu ne possèdes pas ce modèle.'});
      selected.x=['car','policecar'].includes(model.type)?425:model.type==='firetruck'?455:490;selected.y=model.type==='firetruck'?610:580;selected.driverId=null;
     }else if(body.action==='return'){
      const index=vehicles.findIndex(v=>v.ownerId===p.id&&v.type===model.type&&v.rentalUntil);
      if(index<0)return send(400,{error:'Aucune location à rendre pour ce modèle.'});vehicles.splice(index,1);
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
   if(url.pathname==='/api/illegal-market'||url.pathname==='/api/cultivation'){
    const account=accounts.get(p.accountKey);account.supplies??={water:2,snack:2};account.crops??=[];
    const activeHome=account.home?.until>Date.now()?residences.find(h=>h.id===account.home.id):null;
    const nearMarket=!p.interior&&Math.hypot(p.x-illegalMarket.x,p.y-illegalMarket.y)<=illegalMarket.radius;
    const nearHome=!!activeHome&&!p.vehicleId&&Math.hypot(p.x-activeHome.x,p.y-activeHome.y)<=90;
    const inTrade=['dealer','grower'].includes(p.career);
    if(body.action){
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
      if(!nearHome)return send(400,{error:'Rejoins à pied le repère rose de ton logement loué et non expiré.'});
      if(!inTrade)return send(403,{error:'Choisis Cultivateur clandestin ou Revendeur clandestin au Pôle emploi.'});
      if(body.action==='installPrinter'){
       if(account.printer)return send(409,{error:'Une imprimante est déjà installée.'});
       if(!(account.supplies.printer>0))return send(400,{error:'Achète une imprimante au marché clandestin.'});
       account.supplies.printer--;account.printer={homeId:activeHome.id,lastCollectedAt:Date.now()};
      }else if(body.action==='collectPrinter'||body.action==='packPrinter'){
       const printer=account.printer;if(!printer||printer.homeId!==activeHome.id)return send(404,{error:'Aucune imprimante installée dans ce logement.'});
       const amount=Math.min(300,Math.floor(Math.max(0,Date.now()-printer.lastCollectedAt)/60000)*60);
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
     dirty=true;save(p);persist();broadcast();
    }
    return send(200,{player:publicPlayer(p),market:illegalMarket,nearMarket,nearHome,inTrade,home:activeHome,printer:account.printer?{...account.printer,amount:Math.min(300,Math.floor(Math.max(0,Math.min(Date.now(),account.home?.id===account.printer.homeId?account.home.until:account.printer.lastCollectedAt)-account.printer.lastCollectedAt)/60000)*60),cycleMs:60000,payout:60,capacity:300}:null,crops:account.crops.map(c=>({...c,ready:c.readyAt<=Date.now()})),supplies:account.supplies,serverTime:Date.now()});
   }
   if(url.pathname==='/api/inventory'){
    const account=accounts.get(p.accountKey),catalog={printer:{name:'Imprimante à billets fictifs',icon:'🖨️',description:'À installer dans ton logement via Imprimante chez moi.',usable:false},pot:{name:'Pot de culture',icon:'🪴',description:'Pour une culture fictive dans ton logement.',usable:false},seed:{name:'Graine de CBD fictif',icon:'🌱',description:'Objet de jeu acheté au marché clandestin.',usable:false},cbd:{name:'Récolte de CBD fictif',icon:'🌿',description:'À revendre au marché clandestin.',usable:false},water:{name:"Bouteille d’eau",icon:'💧',description:'Une boisson à consommer.'},snack:{name:'Barre de céréales',icon:'🍫',description:'Un encas à consommer.'}};
    account.supplies??={water:2,snack:2};
    if(body.action){
     if(body.action!=='use'||(!Object.hasOwn(catalog,body.id)||catalog[body.id].usable===false))return send(400,{error:'Objet ou action inconnus.'});
     if(!(account.supplies[body.id]>0))return send(409,{error:'Tu ne possèdes plus cet objet.'});
     account.supplies[body.id]--;dirty=true;persist();
    }
    const items=Object.entries(catalog).filter(([id])=>account.supplies[id]>0).map(([id,item])=>({id,...item,quantity:account.supplies[id],usable:item.usable!==false}));
    if(account.printer)items.push({id:'installed-printer',name:'Imprimante installée',icon:'🖨️',quantity:1,description:'Dans ton logement · ouvre Imprimante chez moi.',usable:false});
    items.unshift({id:'identity',name:'Carte d’identité',icon:'🪪',quantity:1,description:'Identité : '+p.name,usable:false});
    if(p.career){const career=employment.careers.find(c=>c.id===p.career);if(career)items.push({id:'work-card',name:'Carte professionnelle',icon:career.icon,quantity:1,description:career.name,usable:false});}
    if(p.job)items.push({id:'parcel',name:'Colis de livraison',icon:'📦',quantity:1,description:'À livrer devant le commissariat avec Interagir.',usable:false});
    if(p.workActive)items.push({id:'mission',name:'Ordre de mission',icon:'📋',quantity:1,description:employment.careers.find(c=>c.id===p.career)?.task||'Mission en cours',usable:false});
    if(p.career==='police'&&p.policeWeapon){items.push({id:'service-weapon',name:'Arme de service',icon:'🔫',quantity:1,description:'À rendre ou recharger au distributeur du commissariat.',usable:false});if(p.ammo>0)items.push({id:'ammo',name:'Cartouches de service',icon:'▪',quantity:p.ammo,description:'Munitions du chargeur de ton arme.',usable:false});}
    items.push({id:'bicycle',name:'Vélo personnel',icon:'🚲',quantity:1,description:'Gratuit · utilise le bouton Vélo ou la touche V pour le sortir et le ranger partout.',usable:false});
    for(const v of vehicles.filter(v=>v.ownerId===p.id&&v.type!=='bicycle'))items.push({id:'key-'+v.id,name:'Clés · '+v.name,icon:'🔑',quantity:1,description:v.rentalUntil?'Véhicule loué':'Véhicule acheté',usable:false});
    if(account.home?.until>Date.now())items.push({id:'home-key',name:'Clés du logement',icon:'🏠',quantity:1,description:residences.find(h=>h.id===account.home.id)?.name||'Ton logement',usable:false});
    return send(200,{items,money:p.money,message:body.action?'Objet consommé.':''});
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
     if(!allowedHere||p.vehicleId)return send(400,{error:'Rejoins à pied le Pôle emploi ou la caserne pour le métier de pompier.'});
     if(p.workActive||p.job)return send(409,{error:'Termine ta mission en cours avant de changer de métier.'});
     if(!employment.careers.some(c=>c.id===body.career))return send(400,{error:'Métier inconnu.'});
     p.career=body.career;if(p.career!=='police'){p.policeWeapon=false;p.ammo=0;}
    }else if(body.action==='work'){
     const career=employment.careers.find(c=>c.id===p.career);
     if(!career)return send(400,{error:'Choisis un métier au Pôle emploi.'});
     if(['dealer','grower'].includes(p.career))return send(400,{error:'Utilise le marché clandestin et Culture chez moi pour ce métier.'});
     if(p.vehicleId)return send(400,{error:'Descends de ton véhicule pour travailler.'});
     if(!p.workActive){
      if(!allowedHere)return send(400,{error:'Reviens au Pôle emploi ou, pour les pompiers, à la caserne pour prendre ta mission.'});
      if(p.job)return send(409,{error:'Termine ta livraison en cours.'});
      p.workActive=true;
     }else{
      if(Math.hypot(p.x-career.x,p.y-career.y)>85)return send(400,{error:'Rejoins ton objectif : '+career.task+'.'});
      p.money+=career.reward;p.workActive=false;
     }
    }else if(body.action)return send(400,{error:'Action inconnue.'});
    save(p);persist();broadcast();return send(200,{player:publicPlayer(p),employment});
   }
   if(url.pathname==='/api/logout'){save(p);persist();for(const v of vehicles)if(v.driverId===p.id)v.driverId=null;streams.get(p.token)?.end();streams.delete(p.token);players.delete(p.token);cookie('',0);broadcast();return send(200,{ok:true});}
   if(url.pathname==='/api/move'){
    const dx=Number(body.dx),dy=Number(body.dy);if(!Number.isFinite(dx)||!Number.isFinite(dy))return send(400,{error:'Déplacement invalide'});
    const vehicle=vehicles.find(v=>v.id===p.vehicleId&&v.driverId===p.id);
    const now=Date.now(),distance=Math.max(0,Math.min((now-p.moved)/1000,0.2))*(vehicle?(({car:420,policecar:440,firetruck:320,quad:350,bicycle:270,scooter:300}[vehicle.type]||300)):170);p.moved=now;const norm=Math.max(1,Math.hypot(dx,dy)),steps=Math.max(1,Math.ceil(distance/6)),radius=vehicle?(({car:27,policecar:27,firetruck:36,quad:23,bicycle:17,scooter:17}[vehicle.type]||17)):13;
    for(let i=0;i<steps;i++){const x=p.x+dx/norm*distance/steps,y=p.y+dy/norm*distance/steps;if(!blocked(x,p.y,radius))p.x=x;if(!blocked(p.x,y,radius))p.y=y;}
    if(vehicle){vehicle.x=p.x;vehicle.y=p.y;if(dx||dy)vehicle.angle=Math.atan2(dy,dx)+Math.PI/2;}
   }else if(url.pathname==='/api/vehicle'){
    const current=vehicles.find(v=>v.id===p.vehicleId&&v.driverId===p.id);
    if(current){
     const exit=[[45,0],[-45,0],[0,45],[0,-45]].map(([dx,dy])=>({x:current.x+dx,y:current.y+dy})).find(pos=>!blocked(pos.x,pos.y));
     if(!exit)return send(400,{error:'Pas assez de place pour descendre ici.'});
     p.x=exit.x;p.y=exit.y;p.vehicleId=null;current.driverId=null;
    }else{
     const nearest=vehicles.filter(v=>!v.driverId&&(!v.ownerId||v.ownerId===p.id)&&Math.hypot(v.x-p.x,v.y-p.y)<=75).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
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
  const files={'/day-night.js':'day-night.js','/graphics.js':'graphics.js','/gps.js':'gps.js','/gps-route.js':'gps-route.js','/trading.js':'trading.js','/interiors.js':'interiors.js','/carte':'map.html','/map.html':'map.html','/map.js':'map.js','/':'index.html','/style.css':'style.css','/game.js':'game.js','/garage.js':'garage.js','/housing.js':'housing.js','/voice.js':'voice.js','/illegal.js':'illegal.js'};const file=files[url.pathname];if(!file){res.writeHead(404);return res.end('Introuvable');}
  try{const data=await readFile(new URL(`./public/${file}`,import.meta.url));res.writeHead(200,{'Content-Type':file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'"});res.end(data);}catch{res.writeHead(500);res.end('Erreur serveur');}
 });
 const saver=setInterval(()=>{try{persist();}catch(err){console.error('Sauvegarde impossible:',err.message);}},1000);saver.unref();
 const timer=setInterval(()=>{expireRentals();for(const [token,p]of players)if(Date.now()-p.seen>120000){save(p);for(const v of vehicles)if(v.driverId===p.id)v.driverId=null;streams.get(token)?.end();streams.delete(token);players.delete(token);}for(const [key,a]of attempts)if(Date.now()>a.until)attempts.delete(key);broadcast();},10000);timer.unref();server.on('close',()=>{clearInterval(timer);clearInterval(saver);persist();});return server;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const port=Number(process.env.PORT)||3000;createGameServer().listen(port,'0.0.0.0',()=>console.log(`Dark Nova RP : http://localhost:${port}`));}
