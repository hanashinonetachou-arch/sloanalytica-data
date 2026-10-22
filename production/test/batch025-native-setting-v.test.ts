import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {isDeclaredResearchSetting,validateResearchCandidateLedger,validateResearchPromotionReadiness} from '../src/research-validator.ts';

test('native V requires an explicit source-derived declaration and preserves zero compatibility',()=>{
 for(const d of [{},{settings:{values:['SET_V']}},{settings:{status:'INFERRED',values:['SET_V']}},{settings:{status:'SOURCE_DERIVED',values:['SET_5','SET_6']}}])assert.equal(isDeclaredResearchSetting(d,'V'),false);
 const d={settings:{status:'SOURCE_DERIVED',values:['SET_1','SET_2','SET_3','SET_4','SET_V']}};
 assert.equal(isDeclaredResearchSetting(d,'V'),true);
 for(const key of ['v','SET_V','VV','7','00','0'])assert.equal(isDeclaredResearchSetting(d,key),false);
 assert.equal(isDeclaredResearchSetting({settings:{status:'SOURCE_DERIVED',values:['SET_0']}},'0'),true);
 for(const key of ['1','2','3','4','5','6'])assert.equal(isDeclaredResearchSetting({},key),true);
});

test('retained native V rates have complete provenance and mutually exclusive BIG REG semantics',()=>{
 const d=JSON.parse(fs.readFileSync(new URL('../research-inbox/batch025/reviewed/LB_NEW_KING_HANAHANA_V_PF.json',import.meta.url),'utf8'));
 assert.doesNotThrow(()=>validateResearchCandidateLedger(d,new Set(d.sources.map((s:any)=>s.sourceId))));
 assert.doesNotThrow(()=>validateResearchPromotionReadiness(d));
 assert.deepEqual(d.settings.values,['SET_1','SET_2','SET_3','SET_4','SET_V']);
 const rates:any={BIG:['1/299','1/291','1/281','1/268','1/253'],REG:['1/496','1/471','1/442','1/409','1/372'],BONUS_COMBINED:['1/186','1/180','1/172','1/162','1/150']};
 for(const [id,values] of Object.entries(rates)){
  const f=d.findings.find((f:any)=>f.findingId===id);
  assert.deepEqual(Object.keys(f.settingDistribution),['1','2','3','4','V']);
  assert.deepEqual(Object.values(f.settingDistribution),values);
  assert.ok(!d.blockedItems.some((b:any)=>b.blockId===id));
  if(id==='BONUS_COMBINED')assert.equal(f.observationType,'reference_distribution');
  else {assert.equal(f.dependencyGroupId,'BONUS_OUTCOME');assert.equal(f.dependencyKind,'MUTUALLY_EXCLUSIVE');}
 }
 assert.equal(d.nativeSettingModelContract.otherInput,'AUTOMATIC_FROM_TRIALS_MINUS_BIG_MINUS_REG');
 // These rates are genuinely unavailable; a format repair must not invent them.
 assert.ok(d.blockedItems.some((b:any)=>b.blockId==='NORMAL_BELL'));
 assert.ok(d.blockedItems.some((b:any)=>b.blockId==='PREDECESSOR'));
});
