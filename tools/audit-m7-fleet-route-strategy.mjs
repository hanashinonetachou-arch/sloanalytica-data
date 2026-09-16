#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root=process.cwd();
const out=process.argv.find(a=>a.startsWith('--json-out='))?.slice(11)??'reports/m7-fleet-route-strategy.json';
const exists=p=>fs.existsSync(path.join(root,p));
const read=p=>{try{return JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));}catch{return null;}};
const run=args=>{const r=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8'});return{exitCode:r.status,stdout:(r.stdout??''),stderr:(r.stderr??'')}};
const ids=fs.readdirSync(path.join(root,'research'),{withFileTypes:true}).filter(e=>e.isDirectory()&&!e.name.startsWith('_')&&exists(`research/${e.name}/research-data.json`)).map(e=>e.name).sort();

const rows=[];
for(const id of ids){
  const base=`research/${id}`;
  const paths={research:`${base}/research-data.json`,selection:`${base}/selection-data.json`,observation:`${base}/machine-observation-data.json`,canonicalUi:`${base}/ui-design-data.json`};
  const obs=read(paths.observation);
  const checks={};
  checks.research=exists(paths.research)?run(['tools/validate-research-data.mjs',paths.research]):{exitCode:2,stdout:'',stderr:'missing research'};
  checks.selection=exists(paths.selection)?run(['tools/windows-safe-cli.mjs','selection:validate',paths.selection,paths.research]):{exitCode:2,stdout:'',stderr:'missing selection'};
  checks.observation=exists(paths.observation)?run(['tools/validate-machine-observation-data.mjs',paths.observation]):{exitCode:2,stdout:'',stderr:'missing observation'};
  checks.canonicalUi=exists(paths.canonicalUi)?run(['tools/validate-ui-design-data.mjs',paths.canonicalUi]):{exitCode:2,stdout:'',stderr:'missing ui'};
  checks.fourLayer=run(['tools/four-layer-pipeline-gate.mjs',id]);
  const layerPass={research:checks.research.exitCode===0,selection:checks.selection.exitCode===0,observation:checks.observation.exitCode===0,canonicalUi:checks.canonicalUi.exitCode===0};
  const materializationPresent=exists(`${base}/machine-package.generated.json`)||exists(`machines/${id}.json`)||exists(`machine-data/${id}.json`);
  const deficitLayers=Object.entries(layerPass).filter(([,v])=>!v).map(([k])=>k);
  if(!materializationPresent) deficitLayers.push('materialization');
  const semantic={
    observationSchema:obs?.schemaVersion??null,
    researchReopenRequired:Boolean(obs?.researchReopenRequests?.some(x=>x?.status==='RESEARCH_REOPEN_REQUIRED')),
    fieldVerificationWaiting:Boolean(obs?.fieldVerificationItems?.some(x=>x?.status==='WAITING_FOR_MACHINE')),
    fourLayerUnresolved:/PASS_WITH_UNRESOLVED/.test(checks.fourLayer.stdout)
  };
  rows.push({machineId:id,layerPass,materializationPresent,downstreamStatus:'NOT_MEASURED',semantic,deficitLayers,deficitCount:deficitLayers.length,checkEvidence:Object.fromEntries(Object.entries(checks).map(([k,v])=>[k,{exitCode:v.exitCode,stdoutTail:v.stdout.slice(-1200),stderrTail:v.stderr.slice(-1200)}]))});
}

const histogram={};for(const r of rows)histogram[r.deficitCount]=(histogram[r.deficitCount]??0)+1;
const externalResearch=rows.filter(r=>r.semantic.researchReopenRequired);
const fieldHold=rows.filter(r=>r.semantic.fieldVerificationWaiting);
const semanticReconstruction=rows.filter(r=>r.semantic.researchReopenRequired||r.semantic.observationSchema!=='machine-observation-data-v2'||r.checkEvidence.fourLayer.exitCode!==0);
const existingArtifactsOnly=rows.filter(r=>!r.semantic.researchReopenRequired&&r.checkEvidence.fourLayer.exitCode===0);
const result={
 schemaVersion:'m7-fleet-route-strategy-audit-v2',generatedAt:new Date().toISOString(),
 scope:{machineCount:rows.length,measuredLayers:['research','selection','observation','canonicalUi','materialization'],downstream:'NOT_MEASURED'},
 summary:{deficitCountHistogram:histogram,exactlyOneLayer:histogram[1]??0,twoLayers:histogram[2]??0,threeLayers:histogram[3]??0,fourPlusLayers:Object.entries(histogram).filter(([k])=>+k>=4).reduce((n,[,v])=>n+v,0),existingArtifactsOnlyCandidateCount:existingArtifactsOnly.length,semanticReconstructionCandidateCount:semanticReconstruction.length,externalResearchCount:externalResearch.length,fieldVerificationHoldCount:fieldHold.length,likelyRepeatedRevisitsUnderLayerRoute:rows.reduce((n,r)=>n+Math.max(0,r.deficitCount-1),0)},
 methodology:{nativePerMachineValidation:true,fieldVerificationWaitingIsHoldNotSemanticFailure:true,note:'Deficits combine native Research/Selection/Observation/UI validator results with structural materialization presence. Downstream renderer/distribution is deliberately NOT_MEASURED, so no route may be selected from this report alone.',routeDecision:'UNDECIDED_PENDING_DOWNSTREAM_AND_MATERIALIZATION_CORRELATION'},machines:rows};
fs.mkdirSync(path.dirname(path.join(root,out)),{recursive:true});fs.writeFileSync(path.join(root,out),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result.summary,null,2));console.log(`report: ${out}`);
