export function setupMobile({keys,touch}){
 const media=matchMedia('(max-width: 900px)'),world=document.getElementById('world').parentElement,header=document.querySelector('header');
 const toolbar=document.createElement('nav');toolbar.id='mobileToolbar';toolbar.setAttribute('aria-label','Menu du jeu sur téléphone');header.append(toolbar);
 const entries=[],stop=()=>{keys.clear();touch.clear();};
 function panel(title,id){const dialog=document.createElement('dialog');dialog.id=id;dialog.className='mobile-dialog';const top=document.createElement('div');top.className='garage-top';const heading=document.createElement('h2');heading.textContent=title;const close=document.createElement('button');close.type='button';close.textContent='Fermer';close.setAttribute('aria-label','Fermer '+title);close.addEventListener('click',()=>dialog.close());top.append(heading,close);dialog.append(top);document.body.append(dialog);const button=document.createElement('button');button.type='button';button.textContent=title;button.addEventListener('click',()=>{stop();dialog.showModal();});toolbar.append(button);dialog.addEventListener('close',stop);return dialog;}
 const menu=panel('☰ Menu','mobileMenu'),missions=panel('Missions','mobileMissions'),chat=panel('Discussion','mobileChat');
 const menuItems=document.createElement('div');menuItems.className='mobile-menu-items';menu.append(menuItems);
 const mapButton=document.createElement('button');mapButton.type='button';mapButton.textContent='Carte';mapButton.addEventListener('click',()=>{stop();document.getElementById('mapExpand')?.click();});toolbar.append(mapButton);
 // Move existing controls, preserving every listener and identifier; restore them on desktop.
 function move(node,target){if(!node)return;const marker=document.createComment('desktop position');node.before(marker);entries.push({node,marker,target});}
 move(document.querySelector('.header-actions'),menuItems);move(document.getElementById('gpsButton'),world);move(document.querySelector('.sidebar'),missions);move(document.querySelector('.social'),chat);
 for(const button of world.querySelectorAll(':scope > button'))if(!['needsPanel','gpsButton','voiceQuickButton'].includes(button.id))move(button,menuItems);
 move(document.getElementById('vehicleCondition'),menuItems);move(document.getElementById('bicycleButton'),menuItems);
 function adapt(){stop();for(const dialog of [menu,missions,chat])if(dialog.open)dialog.close();document.body.classList.toggle('mobile-play',media.matches);for(const {node,marker,target} of entries)if(media.matches)target.append(node);else marker.after(node);}
 media.addEventListener('change',adapt);adapt();
 menuItems.addEventListener('click',event=>{if(event.target.closest('button'))menu.close();},{capture:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});addEventListener('pagehide',stop);
 new MutationObserver(records=>{if(records.some(r=>r.target.open))stop();}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
}
