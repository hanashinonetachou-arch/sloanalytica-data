#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function read(p){return JSON.parse(fs.readFileSync(p,'utf8'))}
function arr(v){return Array.isArray(v)?v:[]}
function fail(machineId,msg){throw new Error(`${machineId}: ${msg}`)}
function evidenceInputId(c){return `INP_EVI_${c.sourceEvidenceGroupId}`}

function auditOne(root,machineId){
  const ui=read(path.join(root,'research',machineId,'ui-design-data.json'));
  const pkg=read(path.join(root,'machines',machineId,'machine-package.json'));
  if(ui.machineId!==machineId||pkg.machine?.machineId!==machineId) fail(machineId,'machineId mismatch');
  if(ui.status!=='PASS'||arr(ui.unresolved).length) fail(machineId,'canonical UI is not closed');
  if(pkg.ui?.canonicalUiDesign?.materialized!==true) fail(machineId,'canonical materialization marker missing');

  const expectedSections=arr(ui.sectionOrder);
  const actualSections=arr(pkg.ui?.sections);
  if(actualSections.length!==expectedSections.length) fail(machineId,`section count ${actualSections.length} != ${expectedSections.length}`);
  const expectedVisible=new Set();
  const actualSeen=new Set();

  expectedSections.forEach((title,index)=>{
    const source=ui.sections?.[title];
    const actual=actualSections[index];
    if(!source) fail(machineId,`missing canonical section ${title}`);
    if(actual?.title!==title) fail(machineId,`section order/title mismatch at ${index+1}`);
    if(actual.displayOrder!==index+1) fail(machineId,`displayOrder mismatch for ${title}`);
    if((source.description??null)!==(actual.description??null)) fail(machineId,`description drift for ${title}`);
    if(typeof source.collapsible==='boolean'&&actual.collapsible!==source.collapsible) fail(machineId,`collapsible drift for ${title}`);
    if(typeof source.defaultExpanded==='boolean'&&actual.defaultExpanded!==source.defaultExpanded) fail(machineId,`defaultExpanded drift for ${title}`);

    const expectedIds=[];
    for(const id of arr(source.inputIds)){
      const c=ui.inputContracts?.[id]??{};
      if(c.inputVisible===false) continue;
      expectedIds.push(id); expectedVisible.add(id);
    }
    for(const evidenceContractId of arr(source.evidenceIds)){
      const c=ui.evidenceContracts?.[evidenceContractId];
      if(!c) fail(machineId,`missing evidence contract ${evidenceContractId}`);
      const id=evidenceInputId(c); expectedIds.push(id); expectedVisible.add(id);
    }
    const actualIds=arr(actual?.items).filter(x=>x?.type==='input').map(x=>x.inputId);
    if(JSON.stringify(actualIds)!==JSON.stringify(expectedIds)) fail(machineId,`item order/content drift for ${title}`);
    for(const id of actualIds){
      if(actualSeen.has(id)) fail(machineId,`duplicate visible input ${id}`);
      actualSeen.add(id);
    }
  });

  const packageInputIds=arr(pkg.inputs?.inputs).map(x=>x.id);
  const sortedExpected=[...expectedVisible].sort();
  const sortedActual=[...packageInputIds].sort();
  if(JSON.stringify(sortedActual)!==JSON.stringify(sortedExpected)){
    const extra=sortedActual.filter(x=>!expectedVisible.has(x));
    const missing=sortedExpected.filter(x=>!packageInputIds.includes(x));
    fail(machineId,`package input visibility drift extra=[${extra}] missing=[${missing}]`);
  }
  for(const [id,c] of Object.entries(ui.inputContracts??{})){
    if(c.inputVisible===false&&packageInputIds.includes(id)) fail(machineId,`inputVisible=false survived: ${id}`);
  }
  console.log(`${machineId}: PASS sections=${actualSections.length} visibleInputs=${packageInputIds.length}`);
}

const ids=process.argv.slice(2);
if(!ids.length){console.error('Usage: node tools/audit-ui-materialization-v7.mjs MACHINE_ID...');process.exit(2)}
try{
  const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
  for(const id of ids)auditOne(root,id);
  console.log(`Canonical UI materialization audit PASS: ${ids.length}/${ids.length}`);
}catch(e){console.error(`ERROR: ${e.message??e}`);process.exit(1)}
