#!/usr/bin/env node
import fs from 'node:fs';
const p=JSON.parse(fs.readFileSync('reports/v64-linked-service-research-plan.json','utf8'));
const machines=p.machines.filter(x=>x.linkedServiceHints.length>0);
const groups={}; for(const m of machines) for(const h of m.linkedServiceHints){ if(h==='スロプラ'&&m.linkedServiceHints.includes('スロプラNEXT')) continue; (groups[h]??=[]).push({machineId:m.machineId,displayName:m.displayName}); }
const out={schemaVersion:'v6.4-linked-service-known-hints-v1',generatedAt:new Date().toISOString(),machineCount:machines.length,groups};
fs.writeFileSync('reports/v64-linked-service-known-hints.json',JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify(out));
