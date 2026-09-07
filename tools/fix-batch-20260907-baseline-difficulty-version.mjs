#!/usr/bin/env node
import fs from 'node:fs';

const catalog=JSON.parse(fs.readFileSync('catalog.json','utf8'));
const difficulty=JSON.parse(fs.readFileSync('difficulty-catalog.json','utf8'));
const byId=new Map((difficulty.entries??[]).map(entry=>[entry.machineId,entry]));
const changes=[];

for(const machine of catalog.machines??[]){
  const entry=byId.get(machine.machineId);
  if(!entry) continue; // coverage validation remains responsible for missing entries
  if(entry.machineDataVersion!==machine.machineDataVersion){
    changes.push({machineId:machine.machineId,from:entry.machineDataVersion,to:machine.machineDataVersion});
    entry.machineDataVersion=machine.machineDataVersion;
  }
}

if(changes.length){
  fs.writeFileSync('difficulty-catalog.json',JSON.stringify(difficulty,null,2)+'\n','utf8');
}
console.log(JSON.stringify({status:'PASS',synced:changes.length,changes},null,2));
