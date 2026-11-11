import {nearATM} from './public/atm-world.js';
export function createBank({accounts,save,persist}){
 return function bank(p,body){const account=accounts.get(p.accountKey);const balance=()=>({bankBalance:account.bankBalance??0,revision:account.bankRevision??0,near:!!nearATM(p)});
  // Return only banking state here; the HTTP handler supplies the safe public player.
  if(!body.action)return {status:200,data:balance()};
  const reject=(status,error)=>({status,data:{error}});
  if(!nearATM(p))return reject(403,'Approche-toi à pied d’un ATM pour déposer ou retirer.');
  if(!['deposit','withdraw'].includes(body.action))return reject(400,'Opération bancaire inconnue.');
  if(!Number.isSafeInteger(body.amount)||body.amount<=0)return reject(400,'Indique un montant entier positif.');
  if(typeof body.requestId!=='string'||! /^[a-f0-9-]{36}$/i.test(body.requestId))return reject(400,'Identifiant d’opération invalide.');
  const previous=(account.bankOperations||[]).find(o=>o.requestId===body.requestId);
  if(previous){if(previous.action!==body.action||previous.amount!==body.amount)return reject(409,'Cet identifiant correspond déjà à une autre opération.');persist();return {status:200,data:{...balance(),message:'Opération déjà enregistrée. Aucun nouveau transfert.'}};}
  const revision=account.bankRevision??0;
  if(!Number.isSafeInteger(body.revision)||body.revision!==revision)return reject(409,'Le solde a changé. Actualise la banque avant de recommencer.');
  const bankBalance=account.bankBalance??0,cash=p.money,deposit=body.action==='deposit';
  if(!Number.isSafeInteger(cash)||cash<0||!Number.isSafeInteger(bankBalance)||bankBalance<0)return reject(409,'Solde indisponible. Actualise la banque.');
  if(body.amount>(deposit?cash:bankBalance))return reject(400,deposit?'Tu n’as pas assez d’argent sur toi.':'Ton solde bancaire est insuffisant.');
  const nextCash=cash+(deposit?-body.amount:body.amount),nextBank=bankBalance+(deposit?body.amount:-body.amount);
  if(!Number.isSafeInteger(nextCash)||!Number.isSafeInteger(nextBank)||!Number.isSafeInteger(revision+1))return reject(400,'Ce montant dépasse la capacité du compte.');
  p.money=nextCash;account.bankBalance=nextBank;account.bankRevision=revision+1;account.bankOperations=[...(account.bankOperations||[]),{requestId:body.requestId,action:body.action,amount:body.amount}].slice(-100);save(p);persist();
  return {status:200,data:{...balance(),message:body.amount+' $ '+(deposit?'déposés sur ton compte.':'retirés de ton compte.')}};
 };
}
