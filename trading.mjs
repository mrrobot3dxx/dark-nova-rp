import {randomUUID} from 'node:crypto';

export const tradeCatalog={water:'Bouteille d’eau',snack:'Barre de céréales',pot:'Pot de culture',seed:'Graine de CBD fictif',cbd:'Récolte de CBD fictif',printer:'Imprimante fictive non installée'};
export function createTrading({accounts,players,save,persist,markDirty,notify}){
 const offers=new Map(),account=p=>accounts.get(p.accountKey);
 const validRoom=p=>!p.interior||p.interior.kind==='villa'||(account(p).home?.id===p.interior.id&&account(p).home.until>Date.now());
 const near=(a,b)=>a&&b&&a.id!==b.id&&!a.vehicleId&&!b.vehicleId&&validRoom(a)&&validRoom(b)&&(a.interior?.id||null)===(b.interior?.id||null)&&Math.hypot(a.interior?a.ix-b.ix:a.x-b.x,a.interior?a.iy-b.iy:a.y-b.y)<=120;
 const find=id=>[...players.values()].find(p=>p.id===id);
 const integer=(n,min=1)=>Number.isSafeInteger(n)&&n>=min&&n<=1000000;
 const prune=()=>{for(const [id,o]of offers)if(o.until<=Date.now()||!find(o.sellerId)||!find(o.buyerId))offers.delete(id);};
 const commit=(a,b,mutate)=>{
  const aa=structuredClone(account(a)),bb=structuredClone(account(b)),am=a.money,bm=b.money;
  try{mutate();save(a);save(b);markDirty();persist();}catch(err){accounts.set(a.accountKey,aa);accounts.set(b.accountKey,bb);a.money=am;b.money=bm;markDirty();throw err;}
 };
 return function trade(p,body){
  prune();const fail=(status,error)=>({status,data:{error}}),a=account(p);let message='';
  if(body.action==='give'){
   if(typeof body.requestId!=='string'||! /^[a-f0-9-]{36}$/i.test(body.requestId))return fail(400,'Identifiant de don invalide.');
   const done=(a.gifts||[]).find(g=>g.id===body.requestId);
   if(done){if(done.to!==body.targetId||done.amount!==body.amount)return fail(409,'Ce don a déjà été traité avec un autre montant ou destinataire.');message='Ce don a déjà été effectué.';}
   else{
    const target=find(body.targetId);if(!near(p,target))return fail(400,'Rejoins ce joueur à pied, dans le même espace (120 pas maximum).');
    if(!integer(body.amount))return fail(400,'Indique un montant entier positif (maximum 1 000 000 $).');
    if(p.money<body.amount)return fail(409,'Ton solde est insuffisant.');if(!Number.isSafeInteger(target.money+body.amount))return fail(400,'Le solde du destinataire est trop élevé.');
    if(Date.now()-(p.lastTradeAt||0)<500)return fail(429,'Patiente un instant entre deux dons.');
    commit(p,target,()=>{p.money-=body.amount;target.money+=body.amount;a.gifts=[...(a.gifts||[]),{id:body.requestId,to:target.id,amount:body.amount}].slice(-100);});
    p.lastTradeAt=Date.now();message=`${body.amount} $ donnés à ${target.name}.`;notify(target.id,`${p.name} t’a donné ${body.amount} $ du jeu.`);
   }
  }else if(body.action==='offer'){
   const target=find(body.targetId);if(!near(p,target))return fail(400,'Rejoins l’acheteur à pied, dans le même espace.');
   if(!Object.hasOwn(tradeCatalog,body.itemId)||!integer(body.quantity)||!integer(body.price))return fail(400,'Objet, quantité ou prix invalide.');
   if((a.supplies?.[body.itemId]||0)<body.quantity)return fail(409,'Tu ne possèdes pas cette quantité.');
   if([...offers.values()].filter(o=>o.sellerId===p.id).length>=5||[...offers.values()].filter(o=>o.buyerId===target.id).length>=10)return fail(429,'Trop d’offres en attente. Annule une offre ou attends son expiration.');
   const offer={id:randomUUID(),sellerId:p.id,sellerName:p.name,buyerId:target.id,buyerName:target.name,itemId:body.itemId,itemName:tradeCatalog[body.itemId],quantity:body.quantity,price:body.price,until:Date.now()+120000};offers.set(offer.id,offer);message='Offre envoyée pour 2 minutes. Aucun débit avant acceptation.';notify(target.id,`${p.name} te propose ${offer.quantity} × ${offer.itemName} pour ${offer.price} $ au total.`);
  }else if(['accept','decline','cancel'].includes(body.action)){
   const offer=offers.get(body.id);if(!offer)return fail(409,'Cette offre a expiré ou a déjà été traitée.');
   if(body.action==='cancel'?offer.sellerId!==p.id:offer.buyerId!==p.id)return fail(403,'Cette offre ne t’est pas destinée.');
   if(body.action==='accept'){
    const seller=find(offer.sellerId),buyer=p;
    if(!near(seller,buyer))return fail(400,'Rapproche-toi du vendeur dans le même espace pour accepter.');
    const supplies=account(seller).supplies||{};if((supplies[offer.itemId]||0)<offer.quantity){offers.delete(offer.id);return fail(409,'Le vendeur ne possède plus les objets. Offre annulée.');}
    if(buyer.money<offer.price)return fail(409,'Ton solde est insuffisant.');
    if(!Number.isSafeInteger(seller.money+offer.price)||!Number.isSafeInteger((a.supplies?.[offer.itemId]||0)+offer.quantity))return fail(400,'Limite de solde ou de stock atteinte.');
    commit(seller,buyer,()=>{seller.money+=offer.price;buyer.money-=offer.price;supplies[offer.itemId]-=offer.quantity;a.supplies??={};a.supplies[offer.itemId]=(a.supplies[offer.itemId]||0)+offer.quantity;});
    message=`Achat terminé : ${offer.quantity} × ${offer.itemName} pour ${offer.price} $.`;notify(seller.id,`${p.name} a acheté tes objets pour ${offer.price} $.`);
   }else message=body.action==='cancel'?'Offre annulée.':'Offre refusée.';
   offers.delete(offer.id);notify(offer.sellerId,'Offre mise à jour.');notify(offer.buyerId,'Offre mise à jour.');
  }else if(body.action)return fail(400,'Action inconnue.');
  return {status:200,data:{money:p.money,message,nearby:[...players.values()].filter(other=>near(p,other)).map(({id,name})=>({id,name})),items:Object.entries(tradeCatalog).filter(([id])=>a.supplies?.[id]>0).map(([id,name])=>({id,name,quantity:a.supplies[id]})),offers:[...offers.values()].filter(o=>o.sellerId===p.id||o.buyerId===p.id)}};
 };
}
