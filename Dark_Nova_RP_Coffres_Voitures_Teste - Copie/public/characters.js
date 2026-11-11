// Shared 2D portrait artwork. Pose sprites are cached at double resolution for mobile.
const motion=new Map(),portraits=new Map(),punches=new Map();
export const characterFacing=id=>motion.get(id)?.facing||'front';
export function punchFrame(player,time){const punch=player.punch;if(!punch||!player.id)return null;let state=punches.get(player.id);if(!state||state.id!==punch.id){state={id:punch.id,start:time-Math.max(0,punch.ageMs||0)};punches.set(player.id,state);if(punches.size>256)punches.delete(punches.keys().next().value);}const age=time-state.start;return age>=0&&age<450?{frame:Math.min(7,Math.floor(age/450*8)),facing:punch.facing}:null;}
export function characterMotion(player,x,y,time){if(!player.id)return {step:0,bob:0,look:0,facing:'front'};let state=motion.get(player.id);if(!state){state={x,y,until:0,look:0,facing:'front'};motion.set(player.id,state);if(motion.size>256)motion.delete(motion.keys().next().value);}const dx=x-state.x,dy=y-state.y;if(Math.hypot(dx,dy)>.1){state.until=time+160;if(Math.abs(dx)>Math.abs(dy)){state.look=Math.sign(dx);state.facing=dx>0?'right':'left';}else if(Math.abs(dy)>.1){state.look=0;state.facing=dy<0?'back':'front';}state.x=x;state.y=y;}const moving=time<state.until;return {step:moving?Math.sin(time/85)*2.5:0,bob:moving?Math.abs(Math.sin(time/85))*.8:0,look:state.look,facing:state.facing};}
function shade(hex,amount){const m=/^#([0-9a-f]{6})$/i.exec(hex);if(!m)return hex;return '#'+m[1].match(/../g).map(v=>Math.max(0,Math.min(255,parseInt(v,16)+amount)).toString(16).padStart(2,'0')).join('');}
function paint(c,a,pose,facing,rider,attack=null){
 const {style,color,pants,shoes,skin,hair,hairStyle,beard}=a,back=facing==='back',side=facing==='left'?-1:facing==='right'?1:0,short=['polo','tshirt'].includes(style),step=pose*.72;
 if(side)c.scale(.85,1);
 const oval=(x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
 const box=(x,y,w,h,color,r=2)=>{c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();};
 const path=(points,color)=>{c.fillStyle=color;c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();c.fill();};
 const line=(points,color,width=.65)=>{c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.stroke();};
 const grad=(x,y,w,h,color)=>{const g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,shade(color,25));g.addColorStop(.36,color);g.addColorStop(1,shade(color,-31));return g;};
 if(!rider){oval(3,33,15,4,'#10263224');for(const leg of [-1,1]){const x=leg<0?-8:1,dy=leg*step;path([[x,8],[x+7,8],[x+6.5,20+dy],[x+7,30+dy],[x,30+dy],[x-.5,20+dy]],grad(x,8,8,22,pants));line([[x+2,13],[x+2,21+dy],[x+2,28+dy]],'#ffffff19');line([[x+1,20+dy],[x+5,21+dy]],shade(pants,-15));box(x-1,29+dy,10,5,grad(x,29,10,5,shoes),2);box(x-1,33+dy,10,1.4,shade(shoes,-44),.5);line([[x+3,30+dy],[x+6,30+dy]],shade(shoes,-65),.5);}}
 // Relaxed shoulders and articulated arms, with an opposite walking swing.
 for(const arm of [-1,1]){if(attack&&arm===(facing==='left'?-1:1))continue;const swing=arm*step*.9,ax=arm<0?-14:9,handY=short?13+swing:16+swing;
 path([[ax+2,-12],[ax+7,-9],[ax+8,short?2:12+swing],[ax+6,handY],[ax,handY],[ax-1,-3]],grad(ax,-12,8,27,color));
 if(short)path([[ax,0],[ax+7,1],[ax+6,handY+4],[ax+1,handY+4]],grad(ax,0,7,16,skin));else box(ax,handY-2,7,3,shade(color,-28),1);
 oval(ax+3,handY+4,3.1,4.4,grad(ax,handY,6,8,skin));line([[ax+1.2,handY+4],[ax+1.5,handY+7]],shade(skin,-42),.45);line([[ax+4.7,handY+3],[ax+5,handY+6]],shade(skin,-30),.45);line([[ax+1,-6],[ax+1,0]],'#ffffff22');}
 // Slightly tapered torso, shoulder seams, fabric folds and a weighted hem.
 path([[-8,-14],[8,-14],[11,-8],[9,10],[9,14],[-9,14],[-10,8],[-11,-7]],grad(-10,-12,22,28,color));
 line([[-7,-12],[-3,-10]],'#ffffff2e');line([[6,-12],[9,-8]],shade(color,-25));line([[-8,-5],[-6,2],[-7,8]],'#ffffff20');line([[7,1],[5,6],[8,9]],'#102b333c');line([[-8,10],[-2,11],[4,10],[8,11]],shade(color,-24));box(-9,12,18,2.8,shade(color,-22),1);
 // Neck and clavicle keep the head separate from the clothing.
 box(-3.2,-20,6.4,8,grad(-3,-20,6,8,skin),2);oval(0,-14,4,1.6,shade(skin,-22));
 if(style==='hoodie'){
  oval(0,-22,10,14,grad(-10,-35,20,27,color));oval(0,-23,7.8,11,shade(color,-45));
  path([[-8,-15],[-3,-10],[0,-12],[4,-10],[9,-15],[6,-8],[-6,-8]],grad(-8,-15,16,9,color));
  if(!back){line([[-5,-11],[-5,0]],'#e0dfcf',.7);line([[5,-11],[5,-1]],'#b8bdb5',.7);box(-5.7,-1,1.3,2,'#e1d8c5',.4);box(4.4,-2,1.3,2,'#e1d8c5',.4);path([[-6,4],[6,4],[7,9],[-7,9]],shade(color,-13));line([[-6,4],[-4,8],[4,8],[6,4]],'#ffffff28');}
  else{line([[-7,-26],[-8,-20],[-5,-15],[0,-13],[6,-16],[8,-23]],'#ffffff2a');line([[0,-32],[0,-18]],shade(color,-22));}
 }
 if(style==='polo'&&!back){path([[-6,-14],[-1,-11],[-4,-7],[-8,-11]],shade(color,37));path([[6,-14],[1,-11],[4,-7],[8,-11]],shade(color,16));box(-.8,-11,1.6,10,shade(color,-24),.4);for(const yy of [-8,-5,-2])oval(0,yy,.55,.55,'#e4e3d4');box(4,-5,2,1.3,'#cfd9ca',.3);}
 if(style==='tshirt'){line([[-5,-13],[-3,-10],[3,-10],[5,-13]],shade(color,-26),1.3);if(!back){box(-4,-5,8,4,'#ffffff35',.7);line([[-3,-3],[3,-3]],'#ffffff80',.6);}}
 if(['suit','jacket'].includes(style)&&!back){path([[-4,-14],[4,-14],[4,12],[-4,12]],style==='suit'?'#e5e7df':'#abb6b1');path([[-5,-14],[-1,-7],[-5,1],[-9,-10]],shade(color,19));path([[5,-14],[1,-7],[5,1],[9,-10]],shade(color,-14));line([[0,-6],[0,13]],style==='jacket'?'#b4bcb6':'#25323d',.8);for(const xx of [-7,5]){box(xx,4,3.8,3,shade(color,-20),.7);line([[xx,4],[xx+3.8,4]],shade(color,20));}if(style==='suit')path([[0,-11],[1.5,-8],[1,4],[0,7],[-1,4],[-1.5,-8]],'#9c5960');}
 // Smaller adult facial proportions, ears, jaw plane and directional profile.
 if(!(back&&style==='hoodie')){
 if(hairStyle==='long'&&style!=='hoodie'){c.fillStyle=grad(-9,-38,18,29,hair);c.beginPath();c.moveTo(-8,-29);c.bezierCurveTo(-10,-41,9,-41,8,-29);c.lineTo(10,-13);c.quadraticCurveTo(3,-12,0,-16);c.quadraticCurveTo(-4,-12,-10,-14);c.closePath();c.fill();}
 if(hairStyle==='bun'&&style!=='hoodie')oval(2,-37,4.5,4,grad(-2,-41,9,8,hair));
 const hx=side*1.2;oval(hx-6.2,-26,1.3,2.8,shade(skin,-8));oval(hx+6.2,-26,1.3,2.8,shade(skin,-25));
 c.fillStyle=grad(-6,-35,13,21,skin);c.beginPath();c.moveTo(hx-6,-31);c.bezierCurveTo(hx-7,-39,hx+6,-39,hx+6.4,-31);c.bezierCurveTo(hx+7,-26,hx+5,-21,hx+2,-19);c.quadraticCurveTo(hx,-17.5,hx-3,-20);c.bezierCurveTo(hx-6,-23,hx-7,-27,hx-6,-31);c.fill();
 if(back){oval(hx,-29,6.6,8.6,grad(-6,-37,13,17,hair));line([[-4,-34],[0,-36],[4,-34]],shade(hair,24),.6);}
 else{
  if(beard){path([[hx-5,-24],[hx-3,-21],[hx+3,-21],[hx+5,-24],[hx+3,-19],[hx,-18.5],[hx-3,-20]],shade(hair,21));}
  oval(hx-3.8,-25.4,2.1,1.6,shade(skin,13));oval(hx+3.6,-25.4,1.8,1.4,shade(skin,-8));
  const gaze=side*1.3;for(const xx of (side?[side*3]:[-3.1,3])){const eyeX=hx+xx+gaze;line([[eyeX-1.3,-28],[eyeX+.8,-28]],'#423d38',.65);oval(eyeX,-27.5,.68,.7,'#29383b');oval(eyeX-.2,-27.8,.17,.17,'#dfdfc9');line([[eyeX-1.3,-30],[eyeX+.7,-30.2]],shade(hair,15),.7);}
  if(side)path([[hx+side*5,-28],[hx+side*8,-25.5],[hx+side*5,-24]],shade(skin,-5));
  line([[hx+gaze,-27],[hx+.8+gaze,-24],[hx-.4+gaze,-23.7]],shade(skin,-32),.55);line([[hx-1.6+gaze,-21.7],[hx+.5+gaze,-21.4],[hx+2+gaze,-22]],'#955f53',.65);line([[hx-1,-20.4],[hx+1,-20.2]],shade(skin,12),.5);
  c.fillStyle=grad(-7,-37,14,10,hair);c.beginPath();c.moveTo(hx-6.4,-27);c.lineTo(hx-6.8,-32);c.bezierCurveTo(hx-7,-40,hx+7,-39,hx+6.7,-32);c.lineTo(hx+6.3,-27);c.lineTo(hx+4.6,-31.7);c.quadraticCurveTo(hx+1,-30,hx-2,-33);c.lineTo(hx-4.7,-31);c.closePath();c.fill();line([[hx-4,-35],[hx,-36],[hx+3,-34.6]],shade(hair,27),.7);
 }
 }
 if(attack){const extension=Math.sin(attack.frame/7*Math.PI),sign=facing==='left'?-1:1,front=facing==='front',rear=facing==='back',sx=sign*10,sy=-9,fx=front?sign*(12+extension*3):rear?sign*12:sign*(16+extension*26),fy=front?8+extension*22:rear?-12-extension*28:-5-extension*2,ex=sign*(17+extension*8),ey=front?5:rear?-15:-1;
  c.lineCap='round';line([[sx,sy],[ex,ey]],grad(-15,-10,30,30,color),8);line([[ex,ey],[fx,fy]],short?grad(ex,ey,10,15,skin):grad(-15,-10,30,30,color),6);oval(fx,fy,4.1,3.6,grad(fx-3,fy-3,7,7,skin));line([[fx-2,fy-1],[fx+1,fy-1]],shade(skin,-30),.6);
  if(extension>.65){const dx=front?0:rear?0:sign,dy=front?1:rear?-1:0;line([[fx+dx*7-dy*3,fy+dy*7+dx*3],[fx+dx*11-dy*3,fy+dy*11+dx*3]],'#e2e8d078',.8);}
 }
}
export function drawCharacter(ctx,player,x=player.x,y=player.y,{rider=false,time=globalThis.performance?.now()||0}={}){
 const attack=rider?null:punchFrame(player,time);const m=rider?{step:0,bob:0,facing:'front'}:characterMotion(player,x,y,time),outfit=player.outfit||{},a={style:outfit.style||'hoodie',color:outfit.color||player.color||'#c3f36a',pants:outfit.pants||'#283c51',shoes:outfit.shoes||'#edf0e9',skin:player.skin||'#d9a681',hair:player.hair||'#393331',hairStyle:player.hairStyle||'short',beard:!!player.beard},pose=Math.round(m.step),facing=attack?.facing||m.facing,key=JSON.stringify([a,pose,facing,rider,attack?.frame??null]);
 ctx.save();ctx.translate(x,y-m.bob);
 if(globalThis.document?.createElement){let sprite=portraits.get(key);if(!sprite){sprite=document.createElement('canvas');sprite.width=attack?200:100;sprite.height=attack?200:180;const c=sprite.getContext('2d');c.scale(2,2);c.translate(sprite.width/4,sprite.height/4);paint(c,a,pose,facing,rider,attack);portraits.set(key,sprite);if(portraits.size>192)portraits.delete(portraits.keys().next().value);}ctx.drawImage(sprite,-sprite.width/4,-sprite.height/4,sprite.width/2,sprite.height/2);}else paint(ctx,a,pose,facing,rider,attack);
 ctx.restore();
}
