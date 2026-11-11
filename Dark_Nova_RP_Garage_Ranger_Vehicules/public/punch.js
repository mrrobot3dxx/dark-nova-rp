import {characterFacing} from './characters.js?v=punch-1';
export function setupPunch({api,getMe,setMe,toast,canvas}){
 const button=document.createElement('button');button.id='punchButton';button.type='button';button.textContent='👊 Frapper · J';button.setAttribute('aria-label','Donner un coup de poing');document.getElementById('interact').before(button);let pending=false,last=0;
 async function punch(){const me=getMe();if(!me||me.respawnAt||me.cuffed||me.vehicleId||pending||performance.now()-last<550||document.querySelector('dialog[open]'))return;pending=true;last=performance.now();try{const data=await api('punch',{facing:characterFacing(me.id)});setMe(data.player);}catch(error){toast(error.message);}finally{pending=false;}}
 button.addEventListener('click',punch);canvas.addEventListener('click',punch);addEventListener('keydown',e=>{const isJ=e.code==='KeyJ'||e.key.toLowerCase()==='j';if((!isJ&&e.code!=='Space')||e.repeat||e.ctrlKey||e.altKey||e.metaKey||e.target.closest('input,textarea,select,[contenteditable="true"]')||(!isJ&&e.target.closest('button'))||document.querySelector('dialog[open]'))return;e.preventDefault();punch();});
 function update(){const p=getMe();button.disabled=!p||!!p.respawnAt||!!p.cuffed||!!p.vehicleId;}
 update();return {update,punch};
}
