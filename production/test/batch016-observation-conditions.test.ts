import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const base=path.resolve(import.meta.dirname,'../batches/batch-20261014-016');
const research=(mid:string)=>JSON.parse(fs.readFileSync(path.join(base,'research-drafts/wave-1',mid+'.json'),'utf8'));
test('Kitaro zone-conditioned CZ expectations use completed zone opportunities',()=>{
 const r=research('L_GEGEGE_NO_KITARO_KAKUSEI_JC');
 for(const n of [5,6,9,10,11]){
  const f=r.findings.find((x:any)=>x.findingId===`chance-${n}-1`);
  assert.equal(f.inputPresentation.trialLabel,'対象の百鬼夜行ゾーン突入回数');
  assert.match(f.denominatorSemantics,/百鬼夜行ゾーンへ移行し、終了まで追跡できた回数を母数/);
  assert.match(f.denominatorSemantics,/直接当選率ではありません/);
 }
 assert.equal(r.findings.find((x:any)=>x.findingId==='chance-5-1').settingDistribution['1'],0.25);
 assert.equal(r.findings.find((x:any)=>x.findingId==='chance-5-0').inputPresentation.trialLabel,'チャンス目成立回数');
 const contexts=r.findings.filter((x:any)=>/^voice-\d+$/.test(x.findingId)).map((x:any)=>x.observationContext);
 assert.equal(contexts.length,5);assert.equal(new Set(contexts.map((x:any)=>x.opportunityId)).size,1);
 assert.equal(new Set(contexts.map((x:any)=>x.conditionId)).size,5);
});
test('Batch016 presentation review preserves numeric distributions and original finding identities',()=>{
 for(const wave of ['wave-1','wave-2'])for(const name of fs.readdirSync(path.join(base,'research-drafts',wave))){
  const current=JSON.parse(fs.readFileSync(path.join(base,'research-drafts',wave,name),'utf8'));
  const previous=JSON.parse(fs.readFileSync(path.join(base,'research-history/pre-ui-20261015',name),'utf8'));
  assert.deepEqual(current.findings.map((x:any)=>x.findingId),previous.findings.map((x:any)=>x.findingId));
  assert.deepEqual(current.findings.map((x:any)=>x.settingDistribution),previous.findings.map((x:any)=>x.settingDistribution));
 }
});
