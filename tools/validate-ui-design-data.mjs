#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const UI_STATUSES=new Set(['DRAFT','PASS','PASS_WITH_UNRESOLVED','MANUAL_UI_REVIEW_REQUIRED','USER_VERIFIED']);
export const INPUT_MODES=new Set(['COUNTER','NUMBER','SELECT','EVIDENCE','DERIVED','READ_ONLY']);

export function validateUiDesignData(data,{expectedMachineId}={}){
  const errors=[];
  if(!data||typeof data!=='object') return ['document must be an object'];
  if(data.schemaVersion!=='ui-design-data-v1') errors.push('schemaVersion must be ui-design-data-v1');
  if(typeof data.machineId!=='string'||!data.machineId) errors.push('machineId is required');
  if(expectedMachineId&&data.machineId!==expectedMachineId) errors.push(`machineId mismatch: expected ${expectedMachineId}, got ${data.machineId}`);
  if(!UI_STATUSES.has(data.status)) errors.push(`invalid status: ${data.status}`);
  if(!Array.isArray(data.sectionOrder)) errors.push('sectionOrder must be an array');
  if(!data.sections||typeof data.sections!=='object'||Array.isArray(data.sections)) errors.push('sections must be an object');
  if(!data.inputContracts||typeof data.inputContracts!=='object'||Array.isArray(data.inputContracts)) errors.push('inputContracts must be an object');
  const sectionOrder=Array.isArray(data.sectionOrder)?data.sectionOrder:[];
  if(new Set(sectionOrder).size!==sectionOrder.length) errors.push('sectionOrder contains duplicates');
  const seenInputs=new Set();
  for(const sectionName of sectionOrder){
    const section=data.sections?.[sectionName];
    if(!section){errors.push(`missing section definition: ${sectionName}`);continue;}
    if(!Array.isArray(section.inputIds)) {errors.push(`${sectionName}: inputIds must be an array`);continue;}
    for(const id of section.inputIds){
      if(seenInputs.has(id)) errors.push(`${id}: appears in multiple sections`);
      seenInputs.add(id);
      if(!data.inputContracts?.[id]) errors.push(`${sectionName}: missing input contract ${id}`);
    }
  }
  for(const [id,c] of Object.entries(data.inputContracts??{})){
    if(typeof c.name!=='string'||!c.name) errors.push(`${id}: name is required`);
    if(!INPUT_MODES.has(c.mode)) errors.push(`${id}: invalid mode ${c.mode}`);
    if(c.gridSpan!==undefined&&!new Set([6,12]).has(c.gridSpan)) errors.push(`${id}: gridSpan must be 6 or 12`);
    if(c.directInput!==undefined&&typeof c.directInput!=='boolean') errors.push(`${id}: directInput must be boolean`);
    if(c.compact!==undefined&&typeof c.compact!=='boolean') errors.push(`${id}: compact must be boolean`);
    if(c.mode==='DERIVED'){
      if(!['sum','difference','formula'].includes(c.derivedCalculation)) errors.push(`${id}: DERIVED requires derivedCalculation`);
      if(!Array.isArray(c.derivedFromInputIds)||c.derivedFromInputIds.length===0) errors.push(`${id}: DERIVED requires derivedFromInputIds`);
      for(const source of c.derivedFromInputIds??[]) if(!data.inputContracts?.[source]) errors.push(`${id}: unknown derived source ${source}`);
    }
  }
  if(!Array.isArray(data.unresolved)) errors.push('unresolved must be an array');
  if(!Array.isArray(data.auditNotes)) errors.push('auditNotes must be an array');
  return errors;
}

export function gateUiDesignData(data){
  const errors=validateUiDesignData(data);
  if(errors.length) return {gate:'FAIL',errors};
  if(data.status==='MANUAL_UI_REVIEW_REQUIRED') return {gate:'MANUAL_UI_REVIEW_REQUIRED',errors:[]};
  if(data.status==='PASS_WITH_UNRESOLVED'||(data.unresolved?.length??0)>0) return {gate:'PASS_WITH_UNRESOLVED',errors:[]};
  if(data.status==='PASS'||data.status==='USER_VERIFIED') return {gate:'PASS',errors:[]};
  return {gate:'DRAFT',errors:[]};
}

function walk(root){
  const out=[];
  const research=path.join(root,'research');
  if(!fs.existsSync(research)) return out;
  for(const ent of fs.readdirSync(research,{withFileTypes:true})){
    if(!ent.isDirectory()) continue;
    const file=path.join(research,ent.name,'ui-design-data.json');
    if(fs.existsSync(file)) out.push([ent.name,file]);
  }
  return out;
}

function main(){
  const root=path.resolve(process.argv[2]??'.');
  let failed=0;
  for(const [machineId,file] of walk(root)){
    const data=JSON.parse(fs.readFileSync(file,'utf8'));
    const errors=validateUiDesignData(data,{expectedMachineId:machineId});
    if(errors.length){failed++;for(const e of errors) console.error(`ERROR ${machineId}: ${e}`);}
  }
  console.log(`UI Design validation: ${failed?'FAIL':'PASS'} / files ${walk(root).length}`);
  if(failed) process.exit(1);
}

const isCli=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isCli) main();
