#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateUiDesignData } from './validate-ui-design-data.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const widgetByMode = {
  COUNTER: 'counter', NUMBER: 'number', SELECT: 'select', EVIDENCE: 'multi_select',
  DERIVED: 'number', READ_ONLY: 'number',
};

function readJson(p){ return JSON.parse(fs.readFileSync(p,'utf8')); }
function writeJson(p,v){ fs.mkdirSync(path.dirname(p),{recursive:true}); fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n','utf8'); }
function sectionId(index,name){ return `UI_${String(index+1).padStart(2,'0')}_${name}`.replace(/[^A-Z0-9_]/gi,'_').toUpperCase(); }

export function applyUiDesignToMachinePackage(pkg, uiDesign, selection){
  const errors = validateUiDesignData(uiDesign,{expectedMachineId:selection.machineId});
  if(errors.length) throw new Error(`UI Design invalid: ${errors.join(' / ')}`);
  if(pkg?.machine?.machineId !== selection.machineId) throw new Error('machineId mismatch between package and SelectionData');
  const inputById = new Map((pkg.inputs?.inputs??[]).map(i=>[i.id,i]));
  const groupById = new Map((selection.evidenceUi?.groups??[]).map(g=>[g.groupId,g]));
  const sections=[];

  const toItem=(inputId,contract=null)=>{
    const input=inputById.get(inputId);
    if(!input) throw new Error(`UI Design references missing MachineData input ${inputId}`);
    const mode=contract?.mode;
    const config={};
    if(contract?.directInput===false) config.directInput=false;
    if(contract?.compact===true) config.compact=true;
    if(contract?.quickInput===true && Number.isFinite(Number(contract.quickStep)) && Number(contract.quickStep)>0) config.quickAdd=Number(contract.quickStep);
    const item={type:'input',inputId,label:contract?.name??input.name,widget:widgetByMode[mode]??(input.type==='counter'?'counter':input.type==='boolean'?'boolean':input.type==='enum'?'select':input.type==='multi_enum'?'multi_select':'number')};
    if(contract?.gridSpan) item.gridSpan=contract.gridSpan;
    if(Object.keys(config).length) item.config=config;
    return item;
  };

  for(const [index,sectionName] of uiDesign.sectionOrder.entries()){
    const section=uiDesign.sections[sectionName];
    const items=[];
    for(const inputId of section.inputIds??[]){ items.push(toItem(inputId,uiDesign.inputContracts?.[inputId])); }
    for(const evidenceContractId of section.evidenceIds??[]){
      const contract=uiDesign.evidenceContracts?.[evidenceContractId];
      if(!contract) throw new Error(`${sectionName}: missing evidence contract ${evidenceContractId}`);
      const group=groupById.get(contract.sourceEvidenceGroupId);
      if(!group) throw new Error(`${evidenceContractId}: unknown Selection evidence group ${contract.sourceEvidenceGroupId}`);
      const inputId=`INP_EVI_${group.groupId}`;
      items.push(toItem(inputId,{name:contract.label,mode:'EVIDENCE',gridSpan:12,directInput:true,compact:false}));
    }
    sections.push({
      id:sectionId(index,sectionName), title:sectionName, displayOrder:index+1,
      ...(section.description?{description:section.description}:{}),
      ...(typeof section.collapsible==='boolean'?{collapsible:section.collapsible}:{}),
      items,
    });
  }

  pkg.ui={
    ...(pkg.ui??{}), sections,
    ...(uiDesign.quickInputContract?{quickInputContract:uiDesign.quickInputContract}:{}),
    designContract:{schemaVersion:uiDesign.schemaVersion,status:uiDesign.status,source:`research/${uiDesign.machineId}/ui-design-data.json`},
  };
  return pkg;
}

function main(){
  const ids=process.argv.slice(2).filter(a=>!a.startsWith('--'));
  const check=process.argv.includes('--check');
  if(!ids.length){ console.error('Usage: node tools/apply-ui-design-to-machine-package.mjs <MACHINE_ID...> [--check]'); process.exit(2); }
  let failed=0;
  for(const id of ids){
    try{
      const dir=path.join(ROOT,'research',id);
      const machinePath=path.join(ROOT,'machines',id,'machine-package.json');
      const uiPath=path.join(dir,'ui-design-data.json');
      const selectionPath=path.join(dir,'selection-data.json');
      if(!fs.existsSync(machinePath)) throw new Error(`machine package missing: ${path.relative(ROOT,machinePath)}`);
      if(!fs.existsSync(uiPath)) throw new Error(`UI Design missing: ${path.relative(ROOT,uiPath)}`);
      const result=applyUiDesignToMachinePackage(readJson(machinePath),readJson(uiPath),readJson(selectionPath));
      if(!check) writeJson(machinePath,result);
      console.log(`${check?'CHECK':'UPDATED'} UI Design -> MachinePackage: ${id} / sections ${result.ui.sections.length}`);
    }catch(e){ failed++; console.error(`ERROR ${id}: ${e instanceof Error?e.message:String(e)}`); }
  }
  if(failed) process.exit(1);
}

const isCli=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isCli) main();
