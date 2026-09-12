#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const IDS=[
  'L_009_RECYBORG_NZ',
  'L_AKAME_GA_KILL_2',
  'L_ANOTHER_RINO_HEAVEN_CC',
  'L_ASLOT_KONOSUBA_FX',
  'L_BAKI_L3',
  'L_BASILISK_KIZUNA2_TENZEN_ZN',
  'L_BERSERK_MUSOU_EV',
  'L_BIOHAZARD_VENDETTA_FK',
  'L_BIOHAZARD_VILLAGE_XA',
  'L_BOFURI_FN'
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
  const sectionOrder=[];
  const sections={};
  const inputContracts={};
  for(const [index,s] of sourceSections.entries()){
    let title=String(s.title??`セクション${index+1}`).trim()||`セクション${index+1}`;
    if(sections[title]) throw new Error(`${id}: duplicate package UI section title: ${title}`);
    sectionOrder.push(title);
    const inputIds=[];
    for(const item of s.items??[]){
      if(item?.type!=='input'||!item.inputId) continue;
      const inputId=item.inputId;
      if(inputContracts[inputId]) throw new Error(`${id}/${inputId}: input appears in multiple sections`);
      const input=selectionInputs.get(inputId)??pkgInputs.get(inputId);
      if(!input) throw new Error(`${id}/${inputId}: input definition not found`);
      inputIds.push(inputId);
      const c={
        name:item.label??input.name??inputId,
        mode:modeFor(input,item),
        gridSpan:[6,12].includes(item.gridSpan)?item.gridSpan:12,
        directInput:item.config?.directInput??true
      };
      const qa=normalizedQuickAdd(item.config?.quickAdd??input.uiQuickAdd);
      if(qa) c.quickAdd=qa;
      if(item.config?.emptyMeansUnobserved!==undefined) c.emptyMeansUnobserved=item.config.emptyMeansUnobserved;
      if(item.config?.observedZeroAllowed!==undefined) c.observedZeroAllowed=item.config.observedZeroAllowed;
      if(item.compact!==undefined) c.compact=Boolean(item.compact);
      inputContracts[inputId]=c;
    }
    sections[title]={
      inputIds,
      description:typeof s.description==='string'?s.description:'',
      collapsible:Boolean(s.collapsible),
      defaultExpanded:s.defaultExpanded!==undefined?Boolean(s.defaultExpanded):!s.collapsible
    };
  }
  const ui={
    schemaVersion:'ui-design-data-v1',
    machineId:id,
    status:'PASS',
    generatedFrom:{
      selection:`research/${id}/selection-data.json`,
      observation:`research/${id}/machine-observation-data.json`,
      manifest:'SloAnalytica_MachineData_UX_Construction_Manifest_v7_1',
      materializedSource:`machines/${id}/machine-package.json`
    },
    sectionOrder,
    sections,
    inputContracts,
    unresolved:[],
    auditNotes:[
      '横断監査v7により既存MachinePackage UIをcanonical UI Designへ無変更意味論でバックフィル。',
      '既存Section順・見出し・説明・表示入力・quickAddを保持し、Selectionの再選定は行っていない。'
    ]
  };
  write(target,ui);
  results.push({machineId:id,sectionCount:sectionOrder.length,inputCount:Object.keys(inputContracts).length});
}
console.log(JSON.stringify({machinesBackfilled:results.length,results},null,2));
