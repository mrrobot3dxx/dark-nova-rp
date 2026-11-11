import {randomInt} from 'node:crypto';
export function createLockpicking({accounts,vehicles,residences,persist,markDirty,now=Date.now,roll=()=>randomInt(100)}){
 const pending=new Map(),targets=p=>[
  ...vehicles.filter(v=>v.ownerId&&v.ownerId!==p.id&&!v.driverId&&v.type!=='bicycle').map(v=>({id:v.id,type:'vehicle',name:v.name,x:v.x,y:v.y})),
  ...[...accounts.values()].filter(a=>a.id!==p.id&&a.home?.until>now()&&a.home.locked!==false).map(a=>{const h=residences.find(h=>h.id===a.home.id);return h&&{id:h.id,type:'home',name:h.name,x:h.x,y:h.y};}).filter(Boolean)
 ].filter(t=>Math.hypot(t.x-p.x,t.y-p.y)<=70);
 return (p,body)=>{const a=accounts.get(p.accountKey),fail=(status,error)=>({status,data:{error}});let message='',success;
  if(p.interior||p.vehicleId||p.cuffs)return fail(403,'Rejoins une serrure à pied, dehors et sans menottes.');
  if(body.action==='start'){
   if(pending.has(p.token)&&pending.get(p.token).until>now())return fail(409,'Une tentative est déjà en cours.');
   if(now()-(p.lastPick||0)<30000)return fail(429,'Patiente 30 secondes entre deux tentatives.');
   const target=targets(p).find(t=>t.id===body.id&&t.type===body.type);if(!target)return fail(400,'Aucune serrure disponible à proximité.');
   if(!(a.supplies?.lockpick>0))return fail(409,'Achète un crochet à la boutique du marché clandestin.');
   a.supplies.lockpick--;markDirty();persist();p.lastPick=now();pending.set(p.token,{...target,x0:p.x,y0:p.y,readyAt:now()+5000,until:now()+20000});message='Tentative commencée. Reste sur place pendant 5 secondes. Un crochet a été utilisé.';
  }else if(body.action==='finish'){
   const attempt=pending.get(p.token);if(!attempt||attempt.until<=now()){pending.delete(p.token);return fail(409,'La tentative a expiré.');}
   if(now()<attempt.readyAt)return fail(409,'Le crochetage n’est pas terminé.');
   pending.delete(p.token);const target=targets(p).find(t=>t.id===attempt.id&&t.type===attempt.type);
   if(!target||Math.hypot(p.x-attempt.x0,p.y-attempt.y0)>10)return fail(409,'Tu as bougé ou la cible n’est plus disponible. Crochet perdu.');
   success=roll()<60;if(success){const key=target.type==='home'?'pickedHomes':'pickedVehicles';p[key]??={};for(const id of Object.keys(p[key]))if(typeof p[key][id]==='number'&&p[key][id]<=now())delete p[key][id];p[key][target.id]=true;a[key]={...p[key]};markDirty();persist();message='Serrure ouverte pour toi sans limite de temps. Accès sauvegardé ; la propriété ne change pas.';}else message='Échec : le crochet s’est cassé. Aucun accès accordé.';
  }else if(body.action)return fail(400,'Action inconnue.');
  for(const [token,attempt]of pending)if(attempt.until<=now())pending.delete(token);
  return {status:200,data:{stock:a.supplies?.lockpick||0,targets:targets(p),attempt:pending.get(p.token)||null,serverTime:now(),message,success}};
 };
}
