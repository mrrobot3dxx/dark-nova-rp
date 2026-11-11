import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRouter} from './public/gps-route.js';
import {world,buildings} from './server.mjs';
test('GPS : contournement des bâtiments et absence de segments bloqués',()=>{
 const router=createRouter({width:1000,height:800,buildings:[{x:400,y:200,w:200,h:400}]},20),start={x:100,y:400},goal={x:900,y:400};
 const route=router.route(start,goal);assert.ok(route);assert.ok(route.length>2);assert.deepEqual(route[0],start);assert.deepEqual(route.at(-1),goal);for(let i=1;i<route.length;i++)assert.equal(router.clear(route[i-1],route[i]),true);
 assert.equal(router.route(start,{x:450,y:300}),null);assert.equal(router.route(start,{x:-20,y:300}),null);
});
test('GPS : itinéraire vers chaque bâtiment à pied et en camion',()=>{
 for(const radius of [20,38]){const router=createRouter({...world,buildings},radius);for(const building of buildings){const goal={x:building.x+building.w/2,y:building.y+building.h+55};const route=router.route({x:455,y:355},goal);assert.ok(route,building.name+' · rayon '+radius);for(let i=1;i<route.length;i++)assert.equal(router.clear(route[i-1],route[i]),true,building.name);}}
});
