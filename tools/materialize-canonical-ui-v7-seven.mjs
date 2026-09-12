#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { resolveCatalogTimestamps } from './catalog-update-timestamp.mjs';

const ROOT=process.cwd();
const IDS=['S_MHW_ICEBORNE_ZF','S_HIDAN_NO_ARIA_II_JZ','L_TOARU_ACCELERATOR_RZ','L_KYOUKARA_OREHA_FE','S_SENGOKU_KOIHIME_FC','S_SUPER_BINGO_NEO_CLASSIC_HH1','S_GRANBELM_ZX'];
const catalogPath=path.join(ROOT,'catalog.json');
const catalog=JSON.parse(fs.readFileSync(catalogPath,'utf8'));
const catById=new Map((catalog.machines??[]).map((m,i)=>[m.machineId,{m,i}]));
const now=new Date().toISOString();
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');

function widget(contract,input){
  const mode=contract?.mode;
  if(mode==='COUNTER') return 'counter';
  if(mode==='SELECT'||mode==='EVIDENCE') return 'select';
  if(mode==='NUMBER') return 'number';
  if(input?.type==='counter') return 'counter';
  if(input?.type==='enum'||input?.type==='multi_enum') return 'select';
  return 'number';
}
function quickAdd(contract,input){
  if(Array.isArray(contract?.quickAdd)) return contract.quickAdd;
  if(Number.isFinite(contract?.quickStep)) return [contract.quickStep];
  if(Array.isArray(input?.uiQuickAdd)) return input.uiQuickAdd;
  if(Number.isFinite(input?.uiQuickAdd)) return [input.uiQuickAdd];
  return undefined;
}
function inputItem(inputId,ui,pkgInputMap){
  const c=ui.inputContracts?.[inputId]??{};
  const p=pkgInputMap.get(inputId);
  if(!p) throw new Error(`${ui.machineId}/${inputId}: package input missing`);
  const item={type:'input',inputId,label:c.name??p.name,widget:widget(c,p),gridSpan:c.gridSpan??p.uiGridSpan??12};
  const config={};
  if(c.directInput!==undefined) config.directInput=c.directInput;
  const qa=quickAdd(c,p); if(qa) config.quickAdd=qa;
  if(c.emptyMeansUnobserved!==undefined) config.emptyMeansUnobserved=c.emptyMeansUnobserved;
  else if(['counter','integer','number'].includes(p.type)) config.emptyMeansUnobserved=true;
  if(c.observedZeroAllowed!==undefined) config.observedZeroAllowed=c.observedZeroAllowed;
  else if(['counter','integer','number'].includes(p.type)) config.observedZeroAllowed=true;
  if(Object.keys(config).length)item.config=config;
  return item;
}
function evidenceInputId(evidenceId,ui,pkg){
  const c=ui.evidenceContracts?.[evidenceId];
  if(!c) throw new Error(`${ui.machineId}/${evidenceId}: evidence contract missing`);
  const group=c.sourceEvidenceGroupId;
  const expected=`INP_EVI_${group}`;
  if((pkg.inputs?.inputs??[]).some(x=>x.id===expected)) return expected;
  const stripped=String(group).replace(/^EVI_/,'');
  const ev=(pkg.evidence?.evidences??[]).find(x=>(x.sourceEvidenceRefs??[]).includes(group)||(x.sourceEvidenceRefs??[]).includes(stripped)||String(x.id??'').includes(group));
  if(ev?.inputId) return ev.inputId;
  throw new Error(`${ui.machineId}/${evidenceId}: cannot resolve materialized evidence input for ${group}`);
}

const changed=[];
for(const id of IDS){
  const ui=read(path.join(ROOT,'research',id,'ui-design-data.json'));
  const pp=path.join(ROOT,'machines',id,'machine-package.json');
  const pkg=read(pp);
  const pkgInputMap=new Map((pkg.inputs?.inputs??[]).map(x=>[x.id,x]));
  const sections=[];
  let order=0;
  for(const title of ui.sectionOrder??[]){
    const s=ui.sections?.[title];
    if(!s) throw new Error(`${id}: canonical section missing: ${title}`);
    const items=[];
    for(const inputId of s.inputIds??[]){
      const c=ui.inputContracts?.[inputId];
      if(c?.mode==='DERIVED'&&c.directInput===false) continue;
      items.push(inputItem(inputId,ui,pkgInputMap));
    }
    for(const evidenceId of s.evidenceIds??[]){
      const inputId=evidenceInputId(evidenceId,ui,pkg);
      const p=pkgInputMap.get(inputId);
      const ec=ui.evidenceContracts?.[evidenceId];
      items.push({type:'input',inputId,label:ec?.label??p?.name??evidenceId,widget:'select',gridSpan:12});
    }
    sections.push({id:`UI_DESIGN_${++order}`,title,displayOrder:order,description:s.description??'',collapsible:s.collapsible??false,defaultExpanded:s.defaultExpanded??!s.collapsible,items});
  }
  pkg.ui={...(pkg.ui??{}),sections};
  write(pp,pkg);
  const buf=fs.readFileSync(pp); const sha256=crypto.createHash('sha256').update(buf).digest('hex');
  const ref=catById.get(id); if(!ref) throw new Error(`${id}: catalog entry missing`);
  const timestamps=resolveCatalogTimestamps(ref.m,sha256,now);
  catalog.machines[ref.i]={...ref.m,sha256,packageSizeBytes:buf.length,...timestamps};
  changed.push({machineId:id,sections:sections.map(x=>x.title),sha256,packageSizeBytes:buf.length});
}
catalog.generatedAt=now; write(catalogPath,catalog);
console.log(JSON.stringify({machinesChanged:changed.length,changed},null,2));
