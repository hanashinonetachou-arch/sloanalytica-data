import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {withUnknownHistoryRecords} from '../src/unknown-history-records.ts';
const base=path.resolve(import.meta.dirname,'../batches/batch-20261017-020/artifacts');
const read=(m:string,stage:string)=>JSON.parse(fs.readFileSync(path.join(base,m,stage,'result.json'),'utf8'));
test('unknown day history preserves exact constraints without sharing a numerical counter',()=>{
 for(const m of ['L_OSU_BANCHO4_A3','L_SHINOBIDAMASHII3_A3']){
  const p=read(m,'app_runtime').package;
  const numerical=new Set(p.features.features.flatMap((f:any)=>[f.numeratorInputId,f.denominatorInputId,...(f.categoryInputIds??[])]));
  const fallback=p.ui.v8Sections.filter((s:any)=>s.id.startsWith('EVI_UNKNOWN_HISTORY_'));assert.ok(fallback.length>0);
  for(const sec of fallback){assert.equal(sec.tabGroup.label,'当日履歴不明');assert.match(sec.description,/記録のみ・推測計算には使用しない/);
   for(const c of sec.items[0].interaction.categories){assert.ok(!numerical.has(c.inputId));assert.equal(p.inputs.inputs.find((i:any)=>i.id===c.inputId).inferenceRole,'DISPLAY_ONLY');}
   assert.ok(p.evidence.evidences.some((e:any)=>e.sourceEvidenceRefs[0]===sec.id.replace('EVI_','')));
  }
 }
});
test('unknown-history projection keeps all accepted likelihood distributions unchanged',()=>{
 for(const m of fs.readdirSync(base)){
  const projection=read(m,'runtime_projection'),copy=withUnknownHistoryRecords(projection);
  assert.deepEqual(copy.activeFeatures,projection.activeFeatures);
  assert.deepEqual(copy.runtimeUi.numericSections,projection.runtimeUi.numericSections);
  assert.equal(new Set(copy.evidence.flatMap((s:any)=>s.evidenceItems.map((e:any)=>e.findingId))).size,copy.evidence.flatMap((s:any)=>s.evidenceItems).length);
 }
});
test('known Fuji history constrains every observed category without a new likelihood',()=>{
 const p=read('L_OSU_BANCHO4_A3','app_runtime').package;
 for(let n=1;n<=5;n++){
  const f=p.features.features.find((f:any)=>f.featureId==='M02-N0'+n);assert.ok(f);
  for(const id of [f.numeratorInputId,...f.categoryInputIds]){
   const e=p.evidence.evidences.find((e:any)=>e.inputId===id&&e.sourceEvidenceRefs[0]===f.featureId+'_KNOWN_HISTORY');assert.ok(e);
   assert.deepEqual(e.confirmedSettings,p.machine.settings.filter((s:string)=>Number(s.slice(4))>=n+1));
  }
 }
});
test('game-based rates use reciprocal display and Ninja bonus fallbacks preserve suppression',()=>{
 for(const m of fs.readdirSync(base))for(const f of read(m,'app_runtime').package.features.features){if(f.modelType==='binomial'&&f.trialUniverse.includes('GAME_TRIAL'))assert.equal(f.displayFormat,'ratio_1_over_n');}
 const p=read('L_SHINOBIDAMASHII3_A3','app_runtime').package;
 for(let n=15;n<=20;n++)assert.ok(p.features.features.find((f:any)=>f.featureId==='M06-N'+n).suppressedByFeatureIds.includes('M06-C08'));
 assert.equal(p.ui.v8Sections.filter((s:any)=>s.tabGroup?.id==='SHINOBI_ROLE_BONUS').length,6);
});
