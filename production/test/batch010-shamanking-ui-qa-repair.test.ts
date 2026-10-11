import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildAppRuntime} from '../src/app-runtime-builder.ts';
import {validateAppRuntimeDocument} from '../src/app-runtime-validator.ts';
const base='batches/batch-20261010-010/artifacts/L_SHAMANKING_SS';
const read=(p:string)=>JSON.parse(fs.readFileSync(p,'utf8'));
test('Shaman King observation context tabs preserve all inference and evidence',()=>{
 const projection=read(base+'/runtime_projection/result.json');
 const stage=read('batches/batch-20261010-010/machines/L_SHAMANKING_SS/stages/RUNTIME_PROJECTION.json');
 const runtime=buildAppRuntime(projection,stage.authoritativeOutputRef),pkg=runtime.package;
 assert.equal(pkg.machine.machineDataVersion,'8.5.2-batch-20261010-010');
 const sections=pkg.ui.v8Sections;
 assert.deepEqual(sections.map((s:any)=>s.id),projection.runtimeUi.uiPresentation.sectionOrder);
 for(const [id,length] of [['SHAMAN_FORE',6],['SHAMAN_CZ_TYPE',2],['SHAMAN_CZ_WIN',4],['SHAMAN_HP',4],['SHAMAN_PRELIM',3],['SHAMAN_ENDING',2]] as const){
  const tabs=sections.filter((s:any)=>s.tabGroup?.id===id);
  assert.equal(tabs.length,length,id);
  assert.ok(tabs.every((s:any)=>s.tabGroup.title===tabs[0].tabGroup.title),id);
 }
 const features=sections.flatMap((s:any)=>s.items??[]).filter((x:any)=>x.featureId);
 assert.equal(features.length,25);
 assert.equal(new Set(features.map((x:any)=>x.featureId)).size,25);
 for(const feature of features){
  const inputs=feature.inputs??[];
  if(inputs.length===2){
   assert.notEqual(inputs[0].label,inputs[1].label,feature.featureId);
  }
 }
 const fortune=sections.find((s:any)=>s.id==='OBS_fortune-reward');
 assert.ok(fortune.items.some((x:any)=>x.evidenceId==='fortune-letter'));
 assert.equal(sections.some((s:any)=>s.id==='EVI_fortune-letter'),false);
 assert.equal(pkg.evidence.evidences.length,22);
 assert.doesNotThrow(()=>validateAppRuntimeDocument(runtime,projection,stage.authoritativeOutputRef));
});
