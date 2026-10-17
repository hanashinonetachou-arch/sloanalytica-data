import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
import {validateMachineQaReadiness,QA_REQUIRED_STAGES} from '../src/qa-readiness-validator.ts';
const base=path.resolve(import.meta.dirname,'../batches/batch-20261017-019'),m='S_HYPER_RUSH_SLC8';
const read=(p:string)=>JSON.parse(fs.readFileSync(path.join(base,p),'utf8'));
const pkg=()=>read('artifacts/'+m+'/app_runtime/result.json').package,report=read('validation/'+m+'.json');
// Distribution is a test fixture here; actual readiness is checked after the
// real Integration attestation and formal Distribution stage complete.
const stages=Object.fromEntries(QA_REQUIRED_STAGES.map(s=>[s,{state:'COMPLETE',authoritativeOutputRef:{path:'unit-fixture-only/'+s}}]));
test('shared Hyper Rush blue/yellow counters and remaining hints satisfy full evidence coverage',()=>assert.equal(validateMachineQaReadiness(m,stages,pkg(),report).status,'QA_READY'));
test('a missing shared category is rejected, even though the separate hint section survives',()=>{
 const p=pkg();for(const s of p.ui.v8Sections)for(const n of s.items??[])if(n.featureId==='M02-C09')n.interaction.categories.splice(0,1);
 assert.throws(()=>validateMachineQaReadiness(m,stages,p,report),/PARTIAL_LINKED_CATEGORY_MISMATCH/);
});
test('an unrelated counter cannot satisfy a linked category input',()=>{
 const p=pkg();for(const s of p.ui.v8Sections)for(const n of s.items??[])if(n.featureId==='M02-C09')n.interaction.categories[0].inputId='REF_UNRELATED';
 assert.throws(()=>validateMachineQaReadiness(m,stages,p,report),/PARTIAL_LINKED_CATEGORY_MISMATCH/);
});
