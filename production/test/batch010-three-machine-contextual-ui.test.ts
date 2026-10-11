import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildAppRuntime} from '../src/app-runtime-builder.ts';
import {validateAppRuntimeDocument} from '../src/app-runtime-validator.ts';

const batch='batch-20261010-010';
const read=(p:string)=>JSON.parse(fs.readFileSync(p,'utf8'));
for(const [machineId,features,evidence,groups,tabs] of [
 ['S_DANMACHI_GAIDEN_XR',7,10,1,3],
 ['S_MAHOIKU_NB',33,16,6,22],
 ['S_TOARU_RAILGUN_FB',28,21,7,22],
] as const){
 test(machineId+' contextual UI review does not lose numeric inputs or Evidence',()=>{
  const base='batches/'+batch+'/artifacts/'+machineId;
  const projection=read(base+'/runtime_projection/result.json');
  const stage=read('batches/'+batch+'/machines/'+machineId+'/stages/RUNTIME_PROJECTION.json');
  const runtime=buildAppRuntime(projection,stage.authoritativeOutputRef),pkg=runtime.package;
  assert.equal(pkg.machine.machineDataVersion,'8.5.2-'+batch);
  const sections=pkg.ui.v8Sections;
  assert.deepEqual(sections.map((s:any)=>s.id),projection.runtimeUi.uiPresentation.sectionOrder);
  const actualFeatures=sections.flatMap((s:any)=>s.items??[]).filter((n:any)=>n.featureId);
  assert.equal(actualFeatures.length,features);
  assert.equal(new Set(actualFeatures.map((n:any)=>n.featureId)).size,features);
  assert.equal(pkg.evidence.evidences.length,evidence);
  const policy=projection.runtimeUi.uiPresentation;
  assert.equal(policy.tabGroups.length,groups);
  const linked=sections.filter((s:any)=>s.tabGroup);
  assert.equal(linked.length,tabs);
  assert.equal(new Set(linked.map((s:any)=>s.tabGroup.id)).size,groups);
  for(const section of sections){
   assert.ok(!section.description?.includes('設定別の公開出現率で評価'),'verbose section '+section.id);
   for(const node of section.items??[]){
    for(const c of node.interaction?.categories??[]){
     assert.notEqual(c.meaning,'設定別の公開出現率で評価',node.id);
    }
    const ins=node.inputs??[];
    if(ins.length===2)assert.notEqual(ins[0].label,ins[1].label,node.id);
   }
  }
  assert.doesNotThrow(()=>validateAppRuntimeDocument(runtime,projection,stage.authoritativeOutputRef));
 });
}
