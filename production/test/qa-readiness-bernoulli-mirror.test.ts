import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
import {validateMachineQaReadiness,QA_REQUIRED_STAGES} from '../src/qa-readiness-validator.ts';
const base=path.resolve(import.meta.dirname,'../batches/batch-20261014-016'),mid='S_FAMISTA_KAIDO_FB';
const pkg=()=>JSON.parse(fs.readFileSync(path.join(base,'artifacts',mid,'app_runtime/result.json'),'utf8')).package;
const states=Object.fromEntries(QA_REQUIRED_STAGES.map(s=>[s,{state:'COMPLETE',authoritativeOutputRef:{path:s+'.json'}}]));
const report=JSON.parse(fs.readFileSync(path.join(base,'validation/local-rendered-ui',mid+'.json'),'utf8'));
test('QA readiness accepts shared binomial occurrence and exact-constraint counters without duplicate Evidence UI',()=>{assert.equal(validateMachineQaReadiness(mid,states,pkg(),report).status,'QA_READY');});
test('QA readiness rejects exact-constraint mirrors bound to another counter or absent from visible guidance',()=>{
 const wrong=pkg();wrong.evidence.evidences.find((e:any)=>e.sourceEvidenceRefs.includes('cheer-constraint')).inputId='bgm.successCount';
 assert.throws(()=>validateMachineQaReadiness(mid,states,wrong,report),/LINKED_EVIDENCE_INPUT_MISMATCH/);
 const missing=pkg();const section=missing.ui.v8Sections.find((s:any)=>s.items?.some((n:any)=>n.featureId==='cheer'));section.description='';for(const n of section.items)n.description='';
 assert.throws(()=>validateMachineQaReadiness(mid,states,missing,report),/EVIDENCE_UI_COVERAGE/);
});
