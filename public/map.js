import {setupDayNight} from '/day-night.js';
setupDayNight();
const $=id=>document.getElementById(id),viewport=$('largeMapViewport'),content=$('largeMapContent');
let world=null,me=null,scale=.28,drag=null,focus={x:455,y:460};
function icon(name){if(/COMMISSARIAT/.test(name))return '👮';if(/POMPIERS/.test(name))return '🚒';if(/HÔPITAL/.test(name))return '🏥';if(/PÔLE EMPLOI/.test(name))return '💼';if(/CLANDESTIN/.test(name))return '🕶️';if(/GARAGE/.test(name))return '🔧';if(/CAFÉ/.test(name))return '☕';if(/MARCHÉ/.test(name))return '🛒';if(/MAISON|LOFT|STUDIO DES LILAS|RÉSIDENCE|VILLA|JARDINS/.test(name))return '🏠';return '🏢';}
function center(x,y){focus={x,y};viewport.scrollLeft=x*scale-viewport.clientWidth/2;viewport.scrollTop=y*scale-viewport.clientHeight/2;}
function visibleFocus(){return {x:(viewport.scrollLeft+viewport.clientWidth/2)/scale,y:(viewport.scrollTop+viewport.clientHeight/2)/scale};}
function pin(x,y,label,color){const el=document.createElement('span');el.className='map-pin';el.style.left=x*scale+'px';el.style.top=y*scale+'px';el.textContent=label;if(color)el.style.color=color;content.append(el);}
function render(){if(!world)return;content.replaceChildren();content.style.width=world.width*scale+'px';content.style.height=world.height*scale+'px';content.style.backgroundSize=920*scale+'px '+360*scale+'px';
 for(const b of world.buildings){const el=document.createElement('div');el.className='map-building';el.style.left=b.x*scale+'px';el.style.top=b.y*scale+'px';el.style.width=b.w*scale+'px';el.style.height=b.h*scale+'px';el.style.borderColor=b.color;el.textContent=icon(b.name)+' '+b.name;el.title=b.name+(b.rentable?' · À louer':'');content.append(el);}
 for(const home of [...new Map(world.residences.map(h=>[h.x+','+h.y,h])).values()])pin(home.x,home.y,'⌂','#ffbce1');
 for(const [x,y,label] of [[455,700,'📦 DÉPÔT'],[800,335,'👮 ARMURERIE'],[680,990,'🚒 CASERNE'],[230,990,'💼 PÔLE EMPLOI'],[1150,630,'🕶️ MARCHÉ CLANDESTIN'],[world.rentalDistrict.centerX,world.rentalDistrict.y+45,'🏘️ QUARTIER DES LILAS']])pin(x,y,label);
 if(me)pin(me.x,me.y,'● TOI','#c3f36a');center(focus.x,focus.y);$('mapStatus').textContent='Glisse pour explorer · + / − pour zoomer · M ou Échap pour revenir au jeu';}
function zoom(factor){focus=visibleFocus();scale=Math.max(.015,Math.min(.7,scale*factor));render();}
$('zoomIn').addEventListener('click',()=>zoom(1.4));$('zoomOut').addEventListener('click',()=>zoom(1/1.4));
$('overview').addEventListener('click',()=>{if(!world)return;scale=Math.min((viewport.clientWidth-16)/world.width,(viewport.clientHeight-16)/world.height);focus={x:world.width/2,y:world.height/2};render();});
$('lilas').addEventListener('click',()=>{scale=.28;focus={x:world?.rentalDistrict?.centerX||3670,y:world?.rentalDistrict?.centerY||1400};render();});
$('center').addEventListener('click',()=>{if(!me){$('mapStatus').textContent='Connecte-toi dans le jeu pour afficher ton personnage. La carte reste accessible.';return;}center(me.x,me.y);});
viewport.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};viewport.setPointerCapture(e.pointerId);});
viewport.addEventListener('pointermove',e=>{if(drag&&drag.id===e.pointerId){viewport.scrollLeft=drag.left+drag.x-e.clientX;viewport.scrollTop=drag.top+drag.y-e.clientY;}});
for(const name of ['pointerup','pointercancel','lostpointercapture'])viewport.addEventListener(name,()=>{drag=null;});
addEventListener('keydown',e=>{if(e.key==='Escape'||e.key.toLowerCase()==='m'){e.preventDefault();location.assign('/');}});
try{const response=await fetch('/api/world',{cache:'no-store'});if(!response.ok)throw Error('Carte indisponible.');world=await response.json();try{const session=await fetch('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});if(session.ok){me=(await session.json()).player;focus={x:me.x,y:me.y};}}catch{}render();}catch(e){$('mapStatus').textContent=e.message+' Utilise Retour au jeu pour réessayer.';}
new ResizeObserver(()=>{if(world)center(focus.x,focus.y);}).observe(viewport);

const sessionHeartbeat=setInterval(async()=>{if(!me)return;try{await fetch('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});}catch{}},30000);addEventListener('pagehide',()=>clearInterval(sessionHeartbeat));
