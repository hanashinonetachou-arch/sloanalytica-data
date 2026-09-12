#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
const ROOT=process.cwd();
const RESEARCH=path.join(ROOT,'research');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
function modeFor(input,item){const t=input?.type;if(t==='counter')return'COUNTER';if(t==='enum'||t==='multi_enum')return'SELECT';if(t==='integer'||t==='number')return'NUMBER';if(item?.widget==='select')return'SELECT';if(item?.widget==='counter')return'COUNTER';return'NUMBER';}
function q(v){if(Array.isArray(v))return v;if(Number.isFinite(v))return[v];}
const candidates=[];
for(const id of fs.readdirSync(RESEARCH).sort()){
 const d=path.join(RESEARCH,id), target=path.join(d,'ui-design-data.json'), selPath=path.join(d,'selection-data.json'), obsPath=path.join(d,'machine-observation-data.json'), pkgPath=path.join(ROOT,'machines',id,'machine-package.json');
 if(!fs.statSync(d).isDirectory()||fs.existsSync(target)||!fs.existsSync(selPath)||!fs.existsSync(obsPath)||!fs.existsSync(pkgPath))continue;
 const sel=read(selPath), obs=read(obsPath);
 if(obs.schemaVersion!=='machine-observation-data-v2')continue;
 if((sel.evidence??[]).some(x=>x.inputId))continue;
 candidates.push(id);
}
const IDS=candidates.slice(0,10);
if(IDS.length!==10)throw new Error(`expected 10 safe candidates, found ${IDS.length}`);
console.log(JSON.stringify({selectedBatch05:IDS,remainingSafeCandidates:candidates.length},null,2));
const results=[];
for(const id of IDS){
 const d=path.join(ROOT,'research',id), target=path.join(d,'ui-design-data.json');
 const sel=read(path.join(d,'selection-data.json')), obs=read(path.join(d,'machine-observation-data.json')), pkg=read(path.join(ROOT,'machines',id,'machine-package.json'));
 const pm=new Map((pkg.inputs?.inputs??[]).map(x=>[x.id,x])), sm=new Map((sel.inputs??[]).map(x=>[x.id,x]));
 const sectionOrder=[],sections={},inputContracts={};
 for(const [i,s] of (pkg.ui?.sections??[]).entries()){
  const title=String(s.title??`セクション${i+1}`).trim()||`セクション${i+1}`; if(sections[title])throw new Error(`${id}: duplicate section ${title}`); sectionOrder.push(title); const inputIds=[];
  for(const item of s.items??[]){if(item?.type!=='input'||!item.inputId)continue;const input=sm.get(item.inputId)??pm.get(item.inputId);if(!input)throw new Error(`${id}/${item.inputId}: input missing`);if(inputContracts[item.inputId])throw new Error(`${id}/${item.inputId}: duplicated route`);inputIds.push(item.inputId);const c={name:item.label??input.name??item.inputId,mode:modeFor(input,item),gridSpan:[6,12].includes(item.gridSpan)?item.gridSpan:12,directInput:item.config?.directInput??true};const qa=q(item.config?.quickAdd??input.uiQuickAdd);if(qa)c.quickAdd=qa;if(item.config?.emptyMeansUnobserved!==undefined)c.emptyMeansUnobserved=item.config.emptyMeansUnobserved;if(item.config?.observedZeroAllowed!==undefined)c.observedZeroAllowed=item.config.observedZeroAllowed;if(item.compact!==undefined)c.compact=Boolean(item.compact);inputContracts[item.inputId]=c;}
  sections[title]={inputIds,description:typeof s.description==='string'?s.description:'',collapsible:Boolean(s.collapsible),defaultExpanded:s.defaultExpanded!==undefined?Boolean(s.defaultExpanded):!s.collapsible};
 }
 if(sectionOrder.length===0)throw new Error(`${id}: MachinePackage has no UI sections`);
 write(target,{schemaVersion:'ui-design-data-v1',machineId:id,status:'PASS',generatedFrom:{selection:`research/${id}/selection-data.json`,observation:`research/${id}/machine-observation-data.json`,manifest:'SloAnalytica_MachineData_UX_Construction_Manifest_v7_1',materializedSource:`machines/${id}/machine-package.json`},sectionOrder,sections,inputContracts,unresolved:[],auditNotes:['横断監査v7により既存MachinePackage UIをcanonical UI Designへ無変更意味論でバックフィル。','既存Section順・見出し・説明・表示入力・quickAddを保持し、Selectionの再選定は行っていない。']});
 results.push({machineId:id,sections:sectionOrder.length,inputs:Object.keys(inputContracts).length});
}
console.log(JSON.stringify({machinesBackfilled:results.length,results},null,2));
