const parisTime=new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
export function daylightState(epoch){const parts=Object.fromEntries(parisTime.formatToParts(new Date(epoch)).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));const minute=Number(parts.hour)*60+Number(parts.minute)+Number(parts.second)/60;let phase='Nuit',icon='🌙',darkness=.55,warmth=0;
 if(minute>=360&&minute<480){const t=(minute-360)/120;phase='Aube';icon='🌅';darkness=.55*(1-t);warmth=Math.sin(t*Math.PI)*.11;}
 else if(minute>=480&&minute<1080){phase='Jour';icon='☀️';darkness=0;}
 else if(minute>=1080&&minute<1200){const t=(minute-1080)/120;phase='Crépuscule';icon='🌇';darkness=.55*t;warmth=Math.sin(t*Math.PI)*.14;}
 return {phase,icon,darkness,warmth,time:parts.hour+':'+parts.minute+':'+parts.second,timezone:'Europe/Paris'};
}
export function weatherState(epoch){
 const duration=30*60*1000,position=((epoch%duration)+duration)%duration,minute=position/60000;
 let label='Éclaircies',icon='🌤️',intensity=0,cloudiness=0,endsAt=12;
 if(minute>=12&&minute<15){label='Ciel couvert';icon='☁️';cloudiness=.08;endsAt=15;}
 else if(minute>=15&&minute<25){label='Pluie';icon='🌧️';intensity=Math.min(1,(minute-15)*2,(25-minute)*2);cloudiness=.08+.08*intensity;endsAt=25;}
 else if(minute>=25){label='Éclaircies';icon='🌥️';cloudiness=.06*(30-minute)/5;endsAt=30;}
 return {label,icon,intensity,cloudiness,remainingMs:endsAt*60000-position,cycleMs:duration};
}
function drawRain(ctx,w,h,epoch,intensity){
 if(intensity<=0)return;const count=Math.min(220,Math.max(45,Math.floor(w*h/4500))),seconds=epoch/1000;ctx.strokeStyle='rgba(188,218,245,'+(.24*intensity)+')';ctx.lineWidth=1.2;ctx.beginPath();
 for(let i=0;i<count;i++){const seed=((i*16807+17)%2147483647)/2147483647;const x=((i*137.23+seed*w-seconds*85)%(w+60)+w+60)%(w+60)-30,y=((i*93.71+seconds*(460+(i%7)*23))%(h+50))-25;ctx.moveTo(x,y);ctx.lineTo(x-5,y+13+(i%4)*3);}ctx.stroke();
 ctx.strokeStyle='rgba(186,215,237,'+(.15*intensity)+')';ctx.lineWidth=1;for(let i=0;i<12;i++){const phase=(seconds*1.3+i*.137)%1,x=(i*157.7+53)%Math.max(1,w),y=(i*91.3+71)%Math.max(1,h);ctx.beginPath();ctx.ellipse(x,y,phase*7+1,phase*2+1,0,0,Math.PI*2);ctx.stroke();}
}
export function setupDayNight(){
 const clock=document.createElement('div');clock.id='realTimeClock';clock.setAttribute('aria-label','Heure réelle de Paris');clock.title='Heure réelle de Paris · Aube 6–8 h, jour 8–18 h, crépuscule 18–20 h, nuit 20–6 h';document.querySelector('header').append(clock);
 const weatherBadge=document.createElement('div');weatherBadge.id='weatherDisplay';weatherBadge.setAttribute('aria-label','Météo de la ville');document.querySelector('header').append(weatherBadge);
 let offset=0,lastSecond=-1,state=daylightState(Date.now());
 function setServerTime(epoch,start=Date.now(),end=Date.now()){if(Number.isFinite(epoch)){offset=epoch-(start+end)/2;lastSecond=-1;}}
 async function synchronize(){const start=Date.now();try{const response=await fetch('/api/time',{cache:'no-store',signal:AbortSignal.timeout(5000)});if(response.ok){const data=await response.json();setServerTime(data.serverTime,start,Date.now());}}catch{}}
 function update(){const now=Date.now()+offset,second=Math.floor(now/1000);if(second!==lastSecond){state=daylightState(now);lastSecond=second;clock.textContent=state.icon+' '+state.time+' · '+state.phase+' · Paris';const weather=weatherState(now);weatherBadge.textContent=weather.icon+' '+weather.label+' · '+Math.ceil(weather.remainingMs/60000)+' min';weatherBadge.title='Cycle météo de 30 minutes, partagé par tous les joueurs. Le nombre indique le temps avant le prochain changement.';}return state;}
 function draw(ctx,w,h,{cameraX,cameraY,scale,buildings,world}){const light=update(),weather=weatherState(Date.now()+offset);if(light.darkness<.001&&light.warmth<.001&&weather.cloudiness<.001)return;ctx.save();if(light.darkness){ctx.fillStyle='rgba(8,17,49,'+light.darkness+')';ctx.fillRect(0,0,w,h);}if(light.warmth){ctx.fillStyle='rgba(239,147,78,'+light.warmth+')';ctx.fillRect(0,0,w,h);}
 if(light.darkness>.06){const strength=Math.min(1,light.darkness/.55);ctx.globalCompositeOperation='screen';for(const b of buildings){const bx=(b.x-cameraX)*scale,by=(b.y-cameraY)*scale;if(bx+b.w*scale<0||bx>w||by+b.h*scale<0||by>h)continue;ctx.fillStyle='rgba(255,204,107,'+(.5*strength)+')';for(let x=b.x+22;x<b.x+b.w-20;x+=44)ctx.fillRect((x-cameraX)*scale,(b.y+27-cameraY)*scale,26*scale,27*scale);}
 const firstX=Math.max(0,Math.floor((cameraX-455)/920)),lastX=Math.ceil((cameraX+w/scale-455)/920);const firstY=Math.max(0,Math.floor((cameraY-354)/720)),lastY=Math.ceil((cameraY+h/scale-354)/720);
 for(let column=firstX;column<=lastX;column++)for(let row=firstY;row<=lastY;row++){const wx=455+column*920,wy=354+row*720;if(wx>world.width||wy>world.height)continue;const x=(wx-cameraX)*scale,y=(wy-cameraY)*scale,r=100*scale;const gradient=ctx.createRadialGradient(x,y,0,x,y,r);gradient.addColorStop(0,'rgba(255,220,144,'+(.32*strength)+')');gradient.addColorStop(1,'rgba(255,220,144,0)');ctx.fillStyle=gradient;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.fillStyle='#ffe5a8';ctx.beginPath();ctx.arc(x,y,3*scale,0,Math.PI*2);ctx.fill();}}
 ctx.globalCompositeOperation='source-over';if(weather.cloudiness){ctx.fillStyle='rgba(35,49,66,'+weather.cloudiness+')';ctx.fillRect(0,0,w,h);}drawRain(ctx,w,h,Date.now()+offset,weather.intensity);ctx.restore();}
 const timer=setInterval(update,1000),syncTimer=setInterval(synchronize,300000);document.addEventListener('visibilitychange',()=>{if(!document.hidden){update();synchronize();}});addEventListener('pagehide',()=>{clearInterval(timer);clearInterval(syncTimer);});update();synchronize();return {update,draw,setServerTime};
}
