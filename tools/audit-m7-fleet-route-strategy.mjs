#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const researchRoot = path.join(root, 'research');
const out = process.argv.find(a=>a.startsWith('--json-out='))?.slice(11) ?? 'reports/m7-fleet-route-strategy.json';
const run = (args) => spawnSync(process.execPath,args,{cwd:root,encoding:'utf8'});
const exists = p=>fs.existsSync(path.join(root,p));
const json = p=>{try{return JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));}catch{return null;}};

const machineIds = fs.readdirSync(researchRoot,{withFileTypes:true}).filter(e=>e.isDirectory()&&!e.name.startsWith('_')&&exists(`research/${e.name}/research-data.json`)).map(e=>e.name).sort();
const layers=['research','selection','observation','canonicalUi','materialization','downstream'];
const rows=[];
for(const id of machineIds){
  const base=`research/${id}`;
  const files={
    research:exists(`${base}/research-data.json`),
    selection:exists(`${base}/selection-data.json`)||exists(`${base}/machine-selection-data.json`)||exists(`${base}/machine-package.generated.json`),
    observation:exists(`${base}/machine-observation-data.json`),
    canonicalUi:exists(`${base}/ui-design-data.json`)||exists(`ui-design/${id}.json`)||exists(`ux-contracts/${id}.json`),
    materialization:exists(`${base}/machine-package.generated.json`)||exists(`machines/${id}.json`)||exists(`machine-data/${id}.json`),
    downstream:null
  };
  const obs=json(`${base}/machine-observation-data.json`);
  const semantic={
    observationSchema:obs?.schemaVersion??null,
    researchReopenRequired:Boolean(obs?.researchReopenRequests?.some(x=>x?.status==='RESEARCH_REOPEN_REQUIRED')),
    fieldVerificationWaiting:Boolean(obs?.fieldVerificationItems?.some(x=>x?.status==='WAITING_FOR_MACHINE'))
  };
  const deficitLayers=layers.filter(k=>files[k]===false);
  rows.push({machineId:id,files,semantic,deficitLayers,deficitCount: deficitLayers.length});
}

// Run repository-native validators as evidence. Failures are retained; this audit never weakens them.
const checks={};
for(const [name,args] of Object.entries({
  research:['tools/validate-research-data.mjs'],
  selection:['tools/windows-safe-cli.mjs','selection:validate'],
  observation:['tools/validate-machine-observation-data.mjs'],
  ui:['tools/validate-ui-design-data.mjs'],
  fourLayer:['tools/four-layer-pipeline-gate.mjs'],
  verification:['tools/machine-verification-status.mjs','status']
})){
  const r=run(args); checks[name]={exitCode:r.status,stdoutTail:(r.stdout??'').slice(-12000),stderrTail:(r.stderr??'').slice(-6000)};
}

const histogram={}; for(const r of rows) histogram[r.deficitCount]=(histogram[r.deficitCount]??0)+1;
const semanticReconstruction=rows.filter(r=>r.semantic.researchReopenRequired||r.semantic.fieldVerificationWaiting||r.semantic.observationSchema!=='machine-observation-data-v2');
const externalResearch=rows.filter(r=>r.semantic.researchReopenRequired);
const fieldVerification=rows.filter(r=>r.semantic.fieldVerificationWaiting);
const likelyRevisitsLayerByLayer=rows.reduce((n,r)=>n+Math.max(0,r.deficitCount-1),0);
const result={schemaVersion:'m7-fleet-route-strategy-audit-v1',generatedAt:new Date().toISOString(),scope:{machineCount:rows.length,layers},summary:{deficitCountHistogram:histogram,exactlyOneLayer:histogram[1]??0,twoLayers:histogram[2]??0,threeLayers:histogram[3]??0,fourPlusLayers:Object.entries(histogram).filter(([k])=>Number(k)>=4).reduce((n,[,v])=>n+v,0),semanticReconstructionCount:semanticReconstruction.length,externalResearchCount:externalResearch.length,fieldVerificationCount:fieldVerification.length,likelyRepeatedRevisitsUnderLayerRoute:likelyRevisitsLayerByLayer},methodology:{note:'File-presence is only a structural signal, not PASS. Repository-native validator outputs are captured in checks and must remain authoritative. This report intentionally does not convert a primary blocker into the only deficit.',routeDecision:'UNDECIDED_PENDING_VALIDATOR_CORRELATION'},checks,machines:rows};
fs.mkdirSync(path.dirname(path.join(root,out)),{recursive:true}); fs.writeFileSync(path.join(root,out),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result.summary,null,2));
console.log(`report: ${out}`);
