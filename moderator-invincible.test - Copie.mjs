import {test} from 'node:test';import assert from 'node:assert/strict';
for(const folder of ['.','../nova-rp'])test('Invincibilité modo : faim, soif, ancien état mort et retrait du rôle '+folder,async()=>{
 const {createNeeds}=await import(folder+'/needs.mjs');let clock=1000,immune=true,collapses=0;const needs=createNeeds({now:()=>clock,isInvincible:()=>immune,onCollapse:()=>collapses++}),p={};needs.start(p,{health:0,hunger:0,thirst:0},500000);assert.equal(p.needs.health,100);assert.equal(p.respawnAt,null);assert.equal(collapses,0);
 clock+=86400000;needs.tick(p);assert.equal(p.needs.health,100);assert.equal(p.needs.hunger,0);assert.equal(p.needs.thirst,0);assert.equal(collapses,0);p.needs.health=1;needs.tick(p);assert.equal(p.needs.health,100);
 immune=false;clock+=600000;needs.tick(p);assert.equal(p.needs.health,0);assert.ok(p.respawnAt>clock);assert.equal(collapses,1);
});
