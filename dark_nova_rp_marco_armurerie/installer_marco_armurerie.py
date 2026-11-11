from pathlib import Path
import shutil,sys
root=Path(__file__).resolve().parent
server=root/'server.mjs'; client=root/'public'/'game.js'
if not server.exists() or not client.exists():
 print('ERREUR : place les fichiers directement dans dark-nova-rp, a cote de server.mjs et public.');input('Entree...');sys.exit(1)
def swap(s,old,new,name):
 if new in s:return s
 if s.count(old)!=1:raise ValueError('Version differente : '+name)
 return s.replace(old,new,1)
try:
 a=server.read_text(encoding='utf-8');b=client.read_text(encoding='utf-8')
 a=swap(a,"policeWeapon:p.career==='police'&&!!p.policeWeapon,ammo:p.career==='police'?(p.ammo||0):0,garage:","policeWeapon:p.career==='police'&&!!p.policeWeapon,ammo:p.career==='police'?(p.ammo||0):0,civilianWeapon:!!p.civilianWeapon,civilianAmmo:p.civilianAmmo||0,garage:",'account save')
 a=swap(a,"policeWeapon:p.career==='police'&&!!p.policeWeapon,ammo:p.career==='police'?(p.ammo||0):0,vehicleId:","policeWeapon:p.career==='police'&&!!p.policeWeapon,ammo:p.career==='police'?(p.ammo||0):0,civilianWeapon:!!p.civilianWeapon,civilianAmmo:p.civilianAmmo||0,vehicleId:",'public player')
 a=swap(a,"policeWeapon:account.career==='police'&&!!account.policeWeapon,ammo:account.career==='police'?(account.ammo||0):0,seen:","policeWeapon:account.career==='police'&&!!account.policeWeapon,ammo:account.career==='police'?(account.ammo||0):0,civilianWeapon:!!account.civilianWeapon,civilianAmmo:account.civilianAmmo||0,seen:",'login restore')
 a=swap(a,"   if(url.pathname==='/api/armory'){",'''   if(url.pathname==='/api/marco-shop'){
    if(p.interior||p.vehicleId||Math.hypot(p.x-710,p.y-335)>80)return send(400,{error:'Approche-toi de Marco a pied, devant le commissariat.'});
    if(body.action==='pistol'){
     if(p.civilianWeapon)return send(400,{error:'Tu possedes deja ce pistolet RP.'});
     if(p.money<500)return send(400,{error:'Il faut 500 $ pour acheter le pistolet RP.'});
     p.money-=500;p.civilianWeapon=true;p.civilianAmmo=12;
    }else if(body.action==='ammo'){
     if(!p.civilianWeapon)return send(400,{error:'Achete d abord le pistolet RP.'});
     if(p.money<80)return send(400,{error:'Il faut 80 $ pour acheter des munitions.'});
     p.money-=80;p.civilianAmmo=(p.civilianAmmo||0)+12;
    }else return send(400,{error:'Article inconnu.'});
    save(p);persist();broadcast();return send(200,{player:publicPlayer(p)});
   }
   if(url.pathname==='/api/armory'){''','shop route')
 a=swap(a,"if(p.career!=='police'||!p.policeWeapon)return send(403,{error:'Récupère ton arme de service au commissariat.'});","if(!(p.career==='police'&&p.policeWeapon)&&!p.civilianWeapon)return send(403,{error:'Achete un pistolet RP chez Marco ou recupere ton arme de service.'});",'fire access')
 a=swap(a,"if(!p.ammo)return send(400,{error:'Chargeur vide. Retourne au distributeur.'});","const usePolice=p.career==='police'&&p.policeWeapon;\n    if(!(usePolice?p.ammo:p.civilianAmmo))return send(400,{error:'Chargeur vide. Recharge chez Marco ou au distributeur de police.'});",'fire ammo check')
 a=swap(a,"p.lastShot=Date.now();p.ammo--;save(p);persist();broadcast();return send(200,{player:publicPlayer(p)});","p.lastShot=Date.now();if(usePolice)p.ammo--;else p.civilianAmmo--;save(p);persist();broadcast();return send(200,{player:publicPlayer(p)});",'fire ammo consume')
 b=swap(b,"fireButton.hidden=!(me.career==='police'&&me.policeWeapon);fireButton.textContent='Tirer · '+(me.ammo||0)+'/12';","fireButton.hidden=!(me.career==='police'&&me.policeWeapon)&&!me.civilianWeapon;fireButton.textContent='Tirer · '+((me.career==='police'&&me.policeWeapon)?(me.ammo||0):(me.civilianAmmo||0))+' cart.';",'fire UI')
 b=swap(b,"async function interact(){if(!me)return;","async function interact(){if(!me)return;if(!me.interior&&Math.hypot(me.x-710,me.y-335)<=80)return openMarcoShop();",'interact')
 b=swap(b,"const armoryButton=document.createElement('button');",'''const marcoDialog=document.createElement('dialog');
marcoDialog.innerHTML='<div class="garage-top"><h2>Marco · Armurerie Nova</h2><button id="closeMarcoShop">×</button></div><p>Bienvenue ! Boutique RP devant le commissariat. Les tirs sont visuels et ne blessent pas les joueurs.</p><button id="marcoBuyPistol">Acheter un pistolet RP · 500 $ (12 cartouches)</button><button id="marcoBuyAmmo">Acheter 12 cartouches · 80 $</button><p id="marcoShopMessage" role="status"></p>';
document.body.append(marcoDialog);
$('closeMarcoShop').addEventListener('click',()=>marcoDialog.close());
function openMarcoShop(){keys.clear();touch.clear();$('marcoShopMessage').textContent=me.civilianWeapon?'Pistolet possede · '+(me.civilianAmmo||0)+' cartouches':'Aucune arme achetee';marcoDialog.showModal();}
for(const [id,action] of [['marcoBuyPistol','pistol'],['marcoBuyAmmo','ammo']])$(id).addEventListener('click',async()=>{try{me=(await api('marco-shop',{action})).player;update();$('marcoShopMessage').textContent='Achat reussi ! Solde : '+me.money+' $ · Cartouches : '+(me.civilianAmmo||0);}catch(err){$('marcoShopMessage').textContent=err.message;}});
const armoryButton=document.createElement('button');''','shop UI')
 b=swap(b,"for(const [x,y]of [[325,442]","// Marco, vendeur d armes RP devant le commissariat.\n circle(710,335,16,'#263746');circle(710,324,9,'#f1c49a');rect(700,334,20,22,'#a86b43',5);text('MARCO · ARMURERIE',710,372,10,'#fff');\n for(const [x,y]of [[325,442]",'npc drawing')
 b=swap(b,"$('interact').textContent=nearOwnTrunk()?","$('interact').textContent=(!me.interior&&Math.hypot(me.x-710,me.y-335)<=80)?'Parler à Marco · E':nearOwnTrunk()?",'interact label')
 for p in (server,client):
  backup=p.with_name(p.name+'.avant_marco.bak')
  if not backup.exists():shutil.copy2(p,backup)
 server.write_text(a,encoding='utf-8');client.write_text(b,encoding='utf-8')
 print('SUCCES : Marco et sa boutique ont ete ajoutes !')
 print('Ouvre GitHub Desktop : Commit puis Push origin.')
except Exception as err:print('ERREUR : '+str(err))
input('Appuie sur Entree...')
