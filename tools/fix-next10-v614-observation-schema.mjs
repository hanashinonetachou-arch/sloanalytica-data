#!/usr/bin/env node
import fs from 'node:fs';
const p='research/LB_TRIPLE_CROWN_SEVEN_FG/machine-observation-data.json';
const o=JSON.parse(fs.readFileSync(p,'utf8'));
const x=o.observations.find(v=>v.observationId==='OBS_BONUS_TRIGGER_COMPOSITION');
if(!x) throw new Error('OBS_BONUS_TRIGGER_COMPOSITION missing');
x.sourceType='DIRECT_PLAY';
x.observationMode='MANUAL_COUNTER';
x.status='FOUND';
x.sourceRefs=['SRC_PWORLD','SRC_HAZUSE'];
delete x.sourceAvailability;
delete x.acquisitionSource;
fs.writeFileSync(p,JSON.stringify(o,null,2)+'\n');
console.log('Fixed Triple bonus-trigger Observation schema.');
