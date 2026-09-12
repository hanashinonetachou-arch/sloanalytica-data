#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
const ROOT=process.cwd();
const IDS=['S_MHW_ICEBORNE_ZF','S_HIDAN_NO_ARIA_II_JZ','L_TOARU_ACCELERATOR_RZ','L_KYOUKARA_OREHA_FE','S_SENGOKU_KOIHIME_FC','S_SUPER_BINGO_NEO_CLASSIC_HH1','S_GRANBELM_ZX'];
const ADOPTED=new Set(['INCLUDE_PRIMARY','INCLUDE_SUPPORT','INCLUDE_FALLBACK','INCLUDE']);
function read(p){return JSON.parse(fs.readFileSync(p,'utf8'));}
function refs(f){return [...new Set(['numeratorInputId','denominatorInputId','successInputId','trialsInputId','countInputId','gamesInputId','inputId'].map(k=>f?.[k]).filter(Boolean).concat(f?.categoryInputIds??[]))];}
const out=[];
for(const id of IDS){
 const sel=read(path.join(ROOT,'research',id,'selection-data.json'));
 const ui=read(path.join(ROOT,'research',id,'ui-design-data.json'));
 const inputMap=new Map((sel.inputs??[]).map(x=>[x.id,x]));
 const missing=[];
 for(const f of (sel.features??[]).filter(x=>ADOPTED.has(x.adoptionCategory))){
   for(const inputId of refs(f)) if(!ui.inputContracts?.[inputId]) missing.push({featureId:f.featureId,researchFeatureId:f.researchFeatureId,inputId,input:inputMap.get(inputId)??null});
 }
 out.push({machineId:id,status:ui.status,sectionOrder:ui.sectionOrder,sections:Object.fromEntries(Object.entries(ui.sections??{}).map(([k,v])=>[k,{inputIds:v.inputIds,description:v.description,observationRole:v.observationRole}])),missing});
}
const report={schemaVersion:'ui-route-gap-v7-v1',generatedAt:new Date().toISOString(),machines:out,totalMissing:out.reduce((n,x)=>n+x.missing.length,0)};
fs.writeFileSync(path.join(ROOT,'reports','ui-route-gap-v7.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));