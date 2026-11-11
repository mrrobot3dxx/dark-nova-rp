import {nature,nearNature} from './public/nature-world.js';
export function createNature({accounts,persist,markDirty,now=Date.now}){const attempts=new Map();return (p,body)=>{const account=accounts.get(p.accountKey),fail=(status,error)=>({status,data:{error}});let message='';
 if(p.cuffs||p.interior||p.vehicleId)return fail(403,'Rejoins les arbres à pied, dehors et sans menottes.');
 const target=nature.nodes.find(n=>n.id===body.id),near=nearNature(p);
 if(body.action==='start'){
  if(!target||Math.hypot(p.x-target.x,p.y-target.y)>75)return fail(400,'Approche-toi de cet arbre.');
  if(target.type==='wood'&&!(account.supplies?.axe>0))return fail(403,'Achète une hache au magasin pour couper du bois (100 $).');
  if(attempts.get(p.id)?.expiresAt>now())return fail(409,'Une récolte est déjà en cours.');
  if((account.natureCooldowns?.[target.id]||0)>now())return fail(409,'Cet arbre doit se renouveler. Patiente 20 secondes.');
  attempts.set(p.id,{id:target.id,x:p.x,y:p.y,readyAt:now()+nature.durationMs,expiresAt:now()+20000});message='Reste près de l’arbre pendant 3 secondes.';
 }else if(body.action==='finish'){
  const attempt=attempts.get(p.id);if(!attempt||attempt.expiresAt<=now()){attempts.delete(p.id);return fail(409,'Récolte expirée. Recommence près de l’arbre.');}
  if(now()<attempt.readyAt)return fail(409,'L’action est encore en cours.');attempts.delete(p.id);const node=nature.nodes.find(n=>n.id===attempt.id);
  if(node.type==='wood'&&!(account.supplies?.axe>0))return fail(403,'Il te faut une hache pour récupérer le bois.');
  if(Math.hypot(p.x-attempt.x,p.y-attempt.y)>15||Math.hypot(p.x-node.x,p.y-node.y)>75)return fail(400,'Tu as bougé. Approche-toi et recommence.');
  account.supplies??={};account.supplies[node.type]=(account.supplies[node.type]||0)+1;account.natureCooldowns??={};account.natureCooldowns[node.id]=now()+nature.cooldownMs;markDirty();persist();message=node.type==='wood'?'+1 bois ajouté à ton inventaire.':'+1 pomme ajoutée à ton inventaire.';
 }else if(body.action)return fail(400,'Action inconnue.');
 for(const [id,a]of attempts)if(a.expiresAt<=now())attempts.delete(id);
 return {status:200,data:{stock:{axe:account.supplies?.axe||0,wood:account.supplies?.wood||0,apple:account.supplies?.apple||0},near:near||null,attempt:attempts.get(p.id)||null,serverTime:now(),message}};
};}
