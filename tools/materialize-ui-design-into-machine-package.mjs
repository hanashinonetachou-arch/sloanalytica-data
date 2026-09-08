#!/usr/bin/env node
import fs from 'node:fs';

function fail(msg){throw new Error(msg)}
function asArray(v){return Array.isArray(v)?v:[]}

function widgetFor(input){
  if(input.type==='counter') return 'counter';
  if(input.type==='boolean') return 'boolean';
  if(input.type==='enum') return 'select';
  if(input.type==='multi_enum') return 'multi_select';
  return 'number';
}

function uiItem(input,contract={}){
  const item={type:'input',inputId:input.id,label:contract.name??input.name,widget:widgetFor(input)};
  if(contract.gridSpan!=null)item.gridSpan=contract.gridSpan;
  const config={};
  if(contract.directInput===false)config.directInput=false;
  if(contract.compact===true)config.compact=true;
  if(contract.quickAdd!==undefined)config.quickAdd=contract.quickAdd;
  if(Object.keys(config).length)item.config=config;
  return item;
}

export function materializeUiDesignIntoPackage(pkg,uiDesign){
  if(!pkg?.machine?.machineId||pkg.machine.machineId!==uiDesign?.machineId) fail('machineId mismatch between package and ui-design');
  if(uiDesign.schemaVersion!=='ui-design-data-v1') fail('unsupported ui-design schema');
  if(uiDesign.status!=='PASS'||asArray(uiDesign.unresolved).length) fail('ui-design is not closed');
  const inputs=asArray(pkg?.inputs?.inputs);
  const byId=new Map(inputs.map(x=>[x.id,x]));
  const visible=new Set();
  const sections=[];
  let order=1;
  for(const title of asArray(uiDesign.sectionOrder)){
    const s=uiDesign.sections?.[title];
    if(!s) fail(`missing canonical section: ${title}`);
    const items=[];
    for(const inputId of asArray(s.inputIds)){
      const input=byId.get(inputId); if(!input) fail(`${title}: unknown canonical input ${inputId}`);
      visible.add(inputId);
      items.push(uiItem(input,uiDesign.inputContracts?.[inputId]??{}));
    }
    for(const evidenceContractId of asArray(s.evidenceIds)){
      const c=uiDesign.evidenceContracts?.[evidenceContractId]; if(!c) fail(`${title}: unknown evidence contract ${evidenceContractId}`);
      const inputId=`INP_EVI_${c.sourceEvidenceGroupId}`;
      const input=byId.get(inputId); if(!input) fail(`${title}: missing generated Evidence input ${inputId}`);
      visible.add(inputId);
      items.push(uiItem(input,{name:c.label,gridSpan:12,directInput:true}));
    }
    sections.push({
      id:`UID_${String(title).normalize('NFKC').replace(/[^A-Za-z0-9一-龠ぁ-んァ-ヶー]+/g,'_')}_${order}`,
      title,
      displayOrder:order++,
      ...(typeof s.description==='string'&&s.description?{description:s.description}:{}),
      ...(typeof s.collapsible==='boolean'?{collapsible:s.collapsible}:{}),
      ...(typeof s.defaultExpanded==='boolean'?{defaultExpanded:s.defaultExpanded}:{}),
      items
    });
  }
  const duplicate=[...visible].filter(id=>sections.reduce((n,s)=>n+s.items.filter(i=>i.inputId===id).length,0)!==1);
  if(duplicate.length) fail(`canonical input/evidence placement must be exactly once: ${duplicate.join(',')}`);

  // Keep only canonical-visible inputs. This prevents reject-only/EXCLUDE inputs from
  // resurfacing in app fallback/additional-input renderers or Quick Input discovery.
  pkg.inputs.inputs=inputs.filter(x=>visible.has(x.id)).map(x=>{
    const c=uiDesign.inputContracts?.[x.id];
    if(!c)return x;
    const y={...x,name:c.name??x.name};
    if(c.gridSpan!=null)y.uiGridSpan=c.gridSpan;
    if(c.directInput===false)y.uiDirectInput=false;
    if(c.compact===true)y.uiCompactCounter=true;
    if(c.quickAdd!==undefined)y.uiQuickAdd=c.quickAdd;
    return y;
  });
  pkg.ui={...(pkg.ui??{}),sections,canonicalUiDesign:{schemaVersion:uiDesign.schemaVersion,materialized:true}};

  // Every executable Feature input must survive canonical visibility filtering.
  for(const f of asArray(pkg?.features?.features)){
    for(const key of ['numeratorInputId','denominatorInputId','conditionedOnInputId']){
      if(f[key]&&!visible.has(f[key])) fail(`${f.featureId}: ${key} ${f[key]} hidden by canonical UI`);
    }
    for(const key of ['numeratorInputIds','denominatorInputIds','categoryInputIds']){
      for(const id of asArray(f[key])) if(!visible.has(id)) fail(`${f.featureId}: ${key} ${id} hidden by canonical UI`);
    }
  }
  for(const e of asArray(pkg?.evidence?.evidence)){
    if(e.inputId&&!visible.has(e.inputId)) fail(`Evidence ${e.evidenceId??e.id??'?'} input ${e.inputId} hidden by canonical UI`);
  }
  return pkg;
}

if(import.meta.url===`file://${process.argv[1]}`){
  const [packagePath,uiPath,outPath=packagePath]=process.argv.slice(2);
  if(!packagePath||!uiPath){console.error('Usage: node tools/materialize-ui-design-into-machine-package.mjs <machine-package.json> <ui-design-data.json> [out]');process.exit(2)}
  try{
    const pkg=JSON.parse(fs.readFileSync(packagePath,'utf8'));
    const ui=JSON.parse(fs.readFileSync(uiPath,'utf8'));
    materializeUiDesignIntoPackage(pkg,ui);
    fs.writeFileSync(outPath,JSON.stringify(pkg,null,2)+'\n');
    console.log(`Canonical UI materialized: ${outPath}`);
  }catch(e){console.error(e.stack??e.message);process.exit(1)}
}
