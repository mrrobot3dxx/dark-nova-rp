export function createRouter(world,radius=20){
 const step=40,columns=Math.floor((world.width-40)/step)+1,rows=Math.floor((world.height-40)/step)+1,total=columns*rows;
 const blocked=(x,y)=>x<radius+5||y<radius+5||x>world.width-radius-5||y>world.height-radius-5||world.buildings.some(b=>x>b.x-radius&&x<b.x+b.w+radius&&y>b.y-radius&&y<b.y+b.h+radius);
 const point=id=>({x:20+(id%columns)*step,y:20+Math.floor(id/columns)*step});
 const cache=new Int8Array(total);
 const free=id=>{if(!cache[id]){const p=point(id);cache[id]=blocked(p.x,p.y)?-1:1;}return cache[id]===1;};
 const clear=(a,b)=>{const n=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/8));for(let i=0;i<=n;i++)if(blocked(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n))return false;return true;};
 function anchor(p){const cx=Math.round((p.x-20)/step),cy=Math.round((p.y-20)/step);let best=-1,distance=Infinity;for(let r=0;r<=6;r++){for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const x=cx+dx,y=cy+dy;if(x<0||y<0||x>=columns||y>=rows)continue;const id=y*columns+x;if(!free(id))continue;const q=point(id),d=Math.hypot(q.x-p.x,q.y-p.y);if(d<distance&&clear(p,q)){best=id;distance=d;}}if(best>=0)return best;}return -1;}
 function route(start,goal){if(blocked(start.x,start.y)||blocked(goal.x,goal.y))return null;if(clear(start,goal))return [start,goal];const source=anchor(start),target=anchor(goal);if(source<0||target<0)return null;
 const costs=new Float64Array(total);costs.fill(Infinity);const previous=new Int32Array(total);previous.fill(-1);const closed=new Uint8Array(total),heap=[];costs[source]=0;
 const heuristic=id=>{const a=point(id),b=point(target);return Math.hypot(a.x-b.x,a.y-b.y);};
 function push(id,score){let i=heap.length;heap.push({id,score});while(i){const parent=(i-1)>>1;if(heap[parent].score<=score)break;heap[i]=heap[parent];i=parent;}heap[i]={id,score};}
 function pop(){const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let child=i*2+1;if(child+1<heap.length&&heap[child+1].score<heap[child].score)child++;if(heap[child].score>=last.score)break;heap[i]=heap[child];i=child;}heap[i]=last;}return first.id;}
 push(source,heuristic(source));
 while(heap.length){const current=pop();if(closed[current])continue;if(current===target){const reversed=[];for(let id=target;id>=0;id=previous[id])reversed.push(point(id));const full=[start,...reversed.reverse(),goal],result=[start];let i=0;while(i<full.length-1){let next=i+1;while(next+1<full.length&&clear(full[i],full[next+1]))next++;result.push(full[next]);i=next;}return result;}
 closed[current]=1;const x=current%columns,y=Math.floor(current/columns),from=point(current);
 for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=columns||ny>=rows)continue;const next=ny*columns+nx;if(closed[next]||!free(next)||!clear(from,point(next)))continue;const cost=costs[current]+step*Math.hypot(dx,dy);if(cost<costs[next]){costs[next]=cost;previous[next]=current;push(next,cost+heuristic(next));}}
 }return null;}
 return {route,blocked,clear};
}
