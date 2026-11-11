from pathlib import Path
import sys
p=Path(__file__).resolve().parent/'public'/'housing.js'
if not p.exists():
    print('ERREUR : place les deux fichiers dans le dossier principal dark-nova-rp, a cote du dossier public.')
    input('Appuie sur Entree...')
    sys.exit(1)
s=p.read_text(encoding='utf-8')
if "quitHousingLease" in s:
    print('Le bouton Quitter mon bail est deja installe.')
    input('Appuie sur Entree...')
    sys.exit(0)
a="document.body.append(dialog);const button=document.createElement('button');"
b="""const quitLease=document.createElement('button');quitLease.id='quitHousingLease';quitLease.type='button';quitLease.textContent='🚪 Quitter mon bail';quitLease.hidden=true;dialog.querySelector('h2').after(quitLease);
 document.body.append(dialog);const button=document.createElement('button');"""
c="function render(){const h=state.residences.find"
d="""quitLease.addEventListener('click',async()=>{const lease=state?.home;if(!lease)return;const home=state.residences.find(h=>h.id===lease.id);if(!home)return;const me=getMe();if(Math.hypot(me.x-home.x,me.y-home.y)>90){$('homeSelect').value=home.id;render();$('housingMessage').textContent='Rejoins le repere rose de '+home.name+' ('+home.x+', '+home.y+') pour quitter ton bail.';return;}if(me.vehicleId){$('housingMessage').textContent='Descends de ton vehicule avant de quitter ton bail.';return;}if(!confirm('Quitter le bail de '+home.name+' ? Aucun remboursement.'))return;quitLease.disabled=true;try{await api('housing',{action:'leave',id:home.id});await openHousing(home.id);$('housingMessage').textContent='Bail resilie. Tu peux louer un autre logement.';}catch(err){$('housingMessage').textContent=err.message;}finally{quitLease.disabled=false;}});
 function render(){quitLease.hidden=!state?.home;const h=state.residences.find"""
if s.count(a)!=1 or s.count(c)!=1:
    print('ERREUR : version de housing.js differente. Aucun fichier modifie.')
    input('Appuie sur Entree...')
    sys.exit(1)
p.with_suffix('.js.avant-bouton-bail.bak').write_text(s,encoding='utf-8')
p.write_text(s.replace(a,b).replace(c,d),encoding='utf-8')
print('SUCCES : bouton Quitter mon bail ajoute dans public/housing.js')
print('Ouvre GitHub Desktop : Commit puis Push origin.')
input('Appuie sur Entree...')
