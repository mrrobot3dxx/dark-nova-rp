import {randomUUID} from 'node:crypto';
export function createSupport({accounts,players,streams,isModerator,markDirty,persist}){
 const all=()=>[...accounts.values()].flatMap(a=>a.supportRequests||[]);
 const pendingCount=()=>all().filter(r=>r.status!=='resolved').length;
 const onlineModerators=()=>[...players.values()].filter(p=>isModerator(p)&&streams.has(p.token));
 function event(player,type,data){const stream=streams.get(player.token);if(stream&&!stream.destroyed)stream.write('event: '+type+'\ndata: '+JSON.stringify(data)+'\n\n');}
 function notifyStaff(player,request){const data={kind:request?'new':'summary',openCount:pendingCount(),request:request||null};if(player)event(player,'support-alert',data);else for(const mod of onlineModerators())event(mod,'support-alert',data);}
 function notifyReporter(request){for(const player of players.values())if(player.id===request.reporterId)event(player,'support-update',{request});}
 function handle(player,body,moderation=false){
  const account=accounts.get(player.accountKey);
  if(moderation){
   if(!isModerator(player))return {status:403,data:{error:'Accès réservé à la modération.'}};
   if(body.action){
    if(!['claim','resolve'].includes(body.action))return {status:400,data:{error:'Action inconnue.'}};
    const request=all().find(r=>r.id===body.id);if(!request)return {status:404,data:{error:'Demande introuvable.'}};
    if(request.status==='resolved')return {status:409,data:{error:'Cette demande est déjà terminée.'}};
    if(request.assignedTo&&request.assignedTo!==player.id)return {status:409,data:{error:'Un autre modérateur prend déjà en charge cette demande.'}};
    if(body.action==='claim'){request.status='claimed';request.assignedTo=player.id;request.assignedName=player.name;request.claimedAt=Date.now();}
    else{const reply=typeof body.reply==='string'?body.reply.trim():'';if(reply.length>500)return {status:400,data:{error:'Réponse limitée à 500 caractères.'}};request.status='resolved';request.assignedTo=player.id;request.assignedName=player.name;request.reply=reply||'Demande traitée par la modération.';request.resolvedAt=Date.now();}
    markDirty();persist();notifyReporter(request);notifyStaff();
   }
   return {status:200,data:{requests:all().sort((a,b)=>(a.status==='resolved')-(b.status==='resolved')||b.createdAt-a.createdAt),openCount:pendingCount()}};
  }
  account.supportRequests??=[];
  if(body.action){
   if(body.action!=='create')return {status:400,data:{error:'Action inconnue.'}};
   const message=typeof body.message==='string'?body.message.trim():'';
   if(message.length<3||message.length>500)return {status:400,data:{error:'Décris le problème en 3 à 500 caractères.'}};
   if(account.supportRequests.some(r=>r.status!=='resolved'))return {status:409,data:{error:'Tu as déjà une demande ouverte. Consulte son suivi ci-dessous.'}};
   if(Date.now()-(account.lastSupportAt||0)<60000)return {status:429,data:{error:'Attends une minute entre deux nouvelles demandes.'}};
   const request={id:randomUUID(),reporterId:player.id,reporterName:player.name,message,status:'open',createdAt:Date.now(),location:{x:Math.round(player.x),y:Math.round(player.y),interior:player.interior?.name||null},assignedTo:null,assignedName:null,reply:null};
   account.supportRequests.unshift(request);account.supportRequests.splice(5);account.lastSupportAt=Date.now();markDirty();persist();notifyStaff(null,request);
  }
  return {status:200,data:{requests:account.supportRequests,onlineModerators:onlineModerators().length}};
 }
 return {handle,notifyStaff,pendingCount};
}
