#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateUiDesignData } from './validate-ui-design-data.mjs';

function readJson(p){ return JSON.parse(fs.readFileSync(p,'utf8')); }
function writeJson(p,v){ fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n'); }
function bumpPatch(v){
  const m=String(v??'').match(/^(\d+)\.(\d+)\.(\d+)$/);
  if(!m) throw new Error(`machineDataVersion must be semver x.y.z: ${v}`);
  return `${m[1]}.${m[2]}.${Number(m[3])+1}`;
}
function widgetFor(input){
  if(input.type==='enum') return 'select';
  if(input.type==='multi_enum') return 'multi_select';
  if(input.type==='boolean') return 'boolean';
  if(input.type==='counter') return 'counter';
  return 'number';
}
function evidenceInputId(groupId){ return `INP_EVI_${groupId}`; }

export function materializeUiDesign(pkg,design){
  const errors=validateUiDesignData(design,{expectedMachineId:pkg.machine?.machineId});
  if(errors.length) throw new Error(`invalid ui-design-data: ${errors.join('; ')}`);
  const out=structuredClone(pkg);
  const inputs=out.inputs?.inputs??[];
  const inputMap=new Map(inputs.map(x=>[x.id,x]));

  for(const [id,c] of Object.entries(design.inputContracts??{})){
    const input=inputMap.get(id);
    if(!input) throw new Error(`${design.machineId}: ui input not found in machine package: ${id}`);
    input.name=c.name;
    if(c.mode==='DERIVED'){
      input.derivedCalculation=c.derivedCalculation;
      input.derivedFromInputIds=[...(c.derivedFromInputIds??[])];
    }
  }

  for(const c of Object.values(design.evidenceContracts??{})){
    const id=evidenceInputId(c.sourceEvidenceGroupId);
    const input=inputMap.get(id);
    if(!input) throw new Error(`${design.machineId}: evidence input not found in machine package: ${id}`);
    input.name=c.label;
  }

  const sections=[];
  for(let index=0;index<design.sectionOrder.length;index++){
    const title=design.sectionOrder[index];
    const section=design.sections?.[title];
    if(!section) throw new Error(`${design.machineId}: section missing: ${title}`);
    const items=[];
    for(const id of section.inputIds??[]){
      const input=inputMap.get(id);
      const c=design.inputContracts?.[id];
      if(!input||!c) throw new Error(`${design.machineId}: invalid section input ${id}`);
      const config={};
      if(c.directInput!==undefined) config.directInput=c.directInput;
      if(c.compact!==undefined) config.compact=c.compact;
      if(c.note) config.note=c.note;
      const item={type:'input',inputId:id,label:c.name,widget:widgetFor(input)};
      if(c.gridSpan!==undefined) item.gridSpan=c.gridSpan;
      if(Object.keys(config).length) item.config=config;
      items.push(item);
    }
    for(const evidenceId of section.evidenceIds??[]){
      const c=design.evidenceContracts?.[evidenceId];
      if(!c) throw new Error(`${design.machineId}: evidence contract missing: ${evidenceId}`);
      const id=evidenceInputId(c.sourceEvidenceGroupId);
      const input=inputMap.get(id);
      if(!input) throw new Error(`${design.machineId}: evidence input missing: ${id}`);
      items.push({type:'input',inputId:id,label:c.label,widget:widgetFor(input),gridSpan:12});
    }
    sections.push({
      id:`UI_DESIGN_${index+1}`,
      title,
      displayOrder:index+1,
      ...(section.description?{description:section.description}:{}),
      items,
    });
  }
  out.ui={...(out.ui??{}),sections};
  return out;
}

export function applyOne(root,machineId,{apply=false,bumpVersion=false}={}){
  const designPath=path.join(root,'research',machineId,'ui-design-data.json');
  const packagePath=path.join(root,'machines',machineId,'machine-package.json');
  const selectionPath=path.join(root,'research',machineId,'selection-data.json');
  if(!fs.existsSync(designPath)) throw new Error(`${machineId}: missing ui-design-data.json`);
  if(!fs.existsSync(packagePath)) throw new Error(`${machineId}: missing machine-package.json`);
  const design=readJson(designPath);
  const before=readJson(packagePath);
  let after=materializeUiDesign(before,design);
  let nextVersion=after.machine?.machineDataVersion;
  let selection=null;
  if(bumpVersion){
    selection=readJson(selectionPath);
    if(selection.machineDataVersion!==before.machine?.machineDataVersion) throw new Error(`${machineId}: selection/package version mismatch before bump`);
    nextVersion=bumpPatch(before.machine.machineDataVersion);
    after.machine.machineDataVersion=nextVersion;
    selection.machineDataVersion=nextVersion;
  }
  const changed=JSON.stringify(before)!==JSON.stringify(after);
  console.log(`${machineId}: ${changed?'CHANGED':'UNCHANGED'}${bumpVersion?` / version ${before.machine?.machineDataVersion} -> ${nextVersion}`:''}`);
  if(apply&&changed){
    writeJson(packagePath,after);
    const generatedPath=path.join(root,'research',machineId,'machine-package.generated.json');
    if(fs.existsSync(generatedPath)) writeJson(generatedPath,after);
    if(selection) writeJson(selectionPath,selection);
  }
  return {changed,before,after,nextVersion};
}

function main(){
  const args=process.argv.slice(2);
  const apply=args.includes('--apply');
  const bumpVersion=args.includes('--bump-version');
  const ids=args.filter(x=>!x.startsWith('--'));
  if(!ids.length) throw new Error('Usage: materialize-ui-design.mjs [--apply] [--bump-version] MACHINE_ID...');
  const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
  for(const id of ids) applyOne(root,id,{apply,bumpVersion});
  console.log(`UI Design materialization ${apply?'APPLY':'DRY_RUN'} PASS: ${ids.length} machine(s)`);
}

const invoked=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(invoked){try{main();}catch(e){console.error(`ERROR: ${e.message??e}`);process.exit(1);}}
