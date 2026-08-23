#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(process.argv[2]??'.');
const machineId=process.argv[3]??'S_REVUE_STARLIGHT_CX';
const dir=path.join(root,'research',machineId);
const designPath=path.join(dir,'ui-design-data.json');
const lockPath=path.join(dir,'user-verified-ui-lock.json');
const errors=[];
if(!fs.existsSync(designPath)) errors.push('missing ui-design-data.json');
if(!fs.existsSync(lockPath)) errors.push('missing user-verified-ui-lock.json');
if(!errors.length){
  const design=JSON.parse(fs.readFileSync(designPath,'utf8'));
  const lock=JSON.parse(fs.readFileSync(lockPath,'utf8'));
  if(lock.status!=='USER_VERIFIED_UI_LOCKED') errors.push(`lock status is ${lock.status}`);
  if(JSON.stringify(design.sectionOrder)!==JSON.stringify(lock.sectionOrder)) errors.push('LOCKED_UI_DRIFT sectionOrder');
  for(const sectionName of lock.sectionOrder??[]){
    const actual=design.sections?.[sectionName]?.inputIds??[];
    const expected=lock.sectionItems?.[sectionName]??[];
    if(JSON.stringify(actual)!==JSON.stringify(expected)) errors.push(`LOCKED_UI_DRIFT sectionItems: ${sectionName}`);
  }
  for(const [id,expected] of Object.entries(lock.inputContracts??{})){
    const actual=design.inputContracts?.[id];
    if(!actual){errors.push(`LOCKED_UI_DRIFT missing input ${id}`);continue;}
    for(const key of ['name','gridSpan','directInput','compact','derivedCalculation']){
      if(expected[key]!==undefined&&actual[key]!==expected[key]) errors.push(`LOCKED_UI_DRIFT ${id}.${key}: expected ${JSON.stringify(expected[key])}, got ${JSON.stringify(actual[key])}`);
    }
    if(expected.derivedFromInputIds&&JSON.stringify(actual.derivedFromInputIds)!==JSON.stringify(expected.derivedFromInputIds)) errors.push(`LOCKED_UI_DRIFT ${id}.derivedFromInputIds`);
  }
}
console.log(`UI Design reference audit: ${errors.length?'FAIL':'PASS'} / ${machineId}`);
for(const e of errors) console.error(`ERROR ${e}`);
if(errors.length) process.exit(1);
