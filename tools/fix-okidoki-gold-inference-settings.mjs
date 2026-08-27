#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const researchPath=path.join(root,'research','S_OKIDOKI_GOLD_GS','research-data.json');
if(!fs.existsSync(researchPath)) throw new Error(`missing ${researchPath}`);
const research=JSON.parse(fs.readFileSync(researchPath,'utf8'));
const expected=['SET_1','SET_2','SET_3','SET_5','SET_6'];
research.machine.inferenceSettings=expected;
fs.writeFileSync(researchPath,JSON.stringify(research,null,2)+'\n','utf8');
console.log(`S_OKIDOKI_GOLD_GS inferenceSettings -> ${expected.join(',')}`);
console.log('OKIDOKI GOLD INFERENCE SETTINGS FIX: PASS');
