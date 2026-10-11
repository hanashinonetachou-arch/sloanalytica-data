import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {buildAppRuntime} from '../src/app-runtime-builder.ts';import {validateAppRuntimeDocument} from '../src/app-runtime-validator.ts';
const base='batches/batch-20261010-010/artifacts/L_ARIFURETA_JA';const read=(p:string)=>JSON.parse(fs.readFileSync(p,'utf8'));
test('Arifureta QA uses component counts, distinct awakening labels and the bonus title',()=>{
 const projection=read(base+'/runtime_projection/result.json');const stage=read('batches/batch-20261010-010/machines/L_ARIFURETA_JA/stages/RUNTIME_PROJECTION.json');
 const doc=buildAppRuntime(projection,stage.authoritativeOutputRef),pkg=doc.package;
 assert.equal(pkg.machine.machineDataVersion,'8.5.2-batch-20261010-010');
 const combined=pkg.inputs.inputs.find((x:any)=>x.id==='initial-combined.successCount');assert.equal(combined.inputVisible,false);assert.equal(combined.derivedCalculation,'sum');assert.deepEqual(combined.derivedFromInputIds,['at-initial.successCount','myu-initial.successCount']);
 const allInputs=pkg.ui.v8Sections.flatMap((s:any)=>s.items??[]).flatMap((n:any)=>n.inputs??[]);const node=allInputs.find((x:any)=>x.inputId===combined.id);assert.equal(node.engineBinding.mode,'SUM_COUNTS');assert.equal(node.directNumeric,false);assert.deepEqual(node.quickAdd,[]);
 const awakening=pkg.ui.v8Sections.find((s:any)=>s.id==='OBS_awakening');assert.deepEqual(awakening.items[0].inputs.map((x:any)=>x.label),['覚醒チャレンジ突入回数','覚醒チャレンジ成功回数']);assert.ok(pkg.ui.v8Sections.some((s:any)=>s.title==='ミュウボーナス中のキャラ紹介'));
 assert.doesNotThrow(()=>validateAppRuntimeDocument(doc,projection,stage.authoritativeOutputRef));combined.derivedFromInputIds=['at-initial.successCount'];assert.throws(()=>validateAppRuntimeDocument(doc,projection,stage.authoritativeOutputRef),/DERIVED_SUCCESS_INPUT/);
});
