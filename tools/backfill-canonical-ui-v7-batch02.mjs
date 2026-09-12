#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const IDS=[
  'L_BOUNTY_ANGEL',
  'L_CHIBARIYO2_ZB',
  'L_CODE_GEASS_REVIVAL_ZS',
  'L_D4DJ_KB',
  'L_ENEN_NO_SHOUBOUTAI_JG',
  'L_EUREKA_SEVEN4_HIEVO_KX',
  'L_EVANGELION_MIRAI_JF',
  'L_G1_YUSHUN_CLUB_GOLD_KD',
  'L_GEGEGE_NO_KITARO_KAKUSEI_JC',
  'L_GIRLS_UND_PANZER_FINALE_H1'
];
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
function modeFor(input,item){
  const t=input?.type;
  if(t==='counter') return 'COUNTER';
  if(t==='enum'||t==='multi_enum') return 'SELECT';
  if(t==='integer'||t==='number') return 'NUMBER';
  if(item?.widget==='select') return 'SELECT';
  if(item?.widget==='counter') return 'COUNTER';
  return 'NUMBER';
}
function normalizedQuickAdd(v){
  if(Array.isArray(v)) return v;
  if(Number.isFinite(v)) return [v];
  return undefined;
}
const results=[];
for(const id of IDS){
  const dir=path.join(ROOT,'research',id);
  const target=path.join(dir,'ui-design-data.json');
  if(fs.existsSync(target)) throw new Error(`${id}: ui-design-data.json already exists`);
  const selection=read(path.join(dir,'selection-data.json'));
  const observation=read(path.join(dir,'machine-observation-data.json'));
  if(observation.schemaVersion!=='machine-observation-data-v2') throw new Error(`${id}: Observation is not v2`);
  const pkg=read(path.join(ROOT,'machines',id,'machine-package.json'));
  const pkgInputs=new Map((pkg.inputs?.inputs??[]).map(x=>[x.id,x]));
  const selectionInputs=new Map((selection.inputs??[]).map(x=>[x.id,x]));
  const sourceSections=pkg.ui?.sections??[];
  if(!sourceSections.length) throw new Error(`${id}: package UI has no sections`);
  const sectionOrder=[]; const sections={}; const inputContracts={};
  for(const [index,s] of sourceSections.entries()){
    const title=String(s.title??`セクション${index+1}`).trim()||`セクション${index+1}`;
    if(sections[title]) throw new Error(`${id}: duplicate package UI section title: ${title}`);
    sectionOrder.push(title); const inputIds=[];
    for(const item of s.items??[]){
      if(item?.type!=='input'||!item.inputId) continue;
      const inputId=item.inputId;
      if(inputContracts[inputId]) throw new Error(`${id}/${inputId}: input appears in multiple sections`);
      const input=selectionInputs.get(inputId)??pkgInputs.get(inputId);
      if(!input) throw new Error(`${id}/${inputId}: input definition not found`);
      inputIds.push(inputId);
      const c={name:item.label??input.name??inputId,mode:modeFor(input,item),gridSpan:[6,12].includes(item.gridSpan)?item.gridSpan:12,directInput:item.config?.directInput??true};
      const qa=normalizedQuickAdd(item.config?.quickAdd??input.uiQuickAdd); if(qa)c.quickAdd=qa;
      if(item.config?.emptyMeansUnobserved!==undefined)c.emptyMeansUnobserved=item.config.emptyMeansUnobserved;
      if(item.config?.observedZeroAllowed!==undefined)c.observedZeroAllowed=item.config.observedZeroAllowed;
      if(item.compact!==undefined)c.compact=Boolean(item.compact);
      inputContracts[inputId]=c;
    }
    sections[title]={inputIds,description:typeof s.description==='string'?s.description:'',collapsible:Boolean(s.collapsible),defaultExpanded:s.defaultExpanded!==undefined?Boolean(s.defaultExpanded):!s.collapsible};
  }
  write(target,{schemaVersion:'ui-design-data-v1',machineId:id,status:'PASS',generatedFrom:{selection:`research/${id}/selection-data.json`,observation:`research/${id}/machine-observation-data.json`,manifest:'SloAnalytica_MachineData_UX_Construction_Manifest_v7_1',materializedSource:`machines/${id}/machine-package.json`},sectionOrder,sections,inputContracts,unresolved:[],auditNotes:['横断監査v7により既存MachinePackage UIをcanonical UI Designへ無変更意味論でバックフィル。','既存Section順・見出し・説明・表示入力・quickAddを保持し、Selectionの再選定は行っていない。']});
  results.push({machineId:id,sectionCount:sectionOrder.length,inputCount:Object.keys(inputContracts).length});
}
console.log(JSON.stringify({machinesBackfilled:results.length,results},null,2));
// trigger clean batch02
