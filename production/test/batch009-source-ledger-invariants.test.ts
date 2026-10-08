import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve('batches','batch-20261008-009');
const read=(...s:string[])=>JSON.parse(fs.readFileSync(path.join(root,...s),'utf8'));
const spec=read('batch.json');
const machines=spec.waves.flatMap((w:any)=>w.machineIds);
const expected=[
 'L_MIDORIDON_VIVA_REVIVAL_FY','L_GUNDAM_SEED_G','L_BIOHAZARD5_ZE','L_TIDADONDON_PA5','L_SISTER_QUEST_CA',
 'L_KAMEN_RIDER_DEN_O_UD','S_BIOHAZARD_RE2_XB','S_WARAU4_KH','S_BIG_SHIMAUTA_E2_30','S_BOOWY_SV'
];
test('Batch009 preserves all ten machines in source manifest order',()=>{
 assert.deepEqual(machines,expected);
 assert.equal(new Set(machines).size,10);
});
test('No research source claim, numeric finding, or blocked user reason is lost from ledgers',()=>{
 for(const [i,id] of machines.entries()){
  const wave=i<5?'wave-1':'wave-2',d=read('research-evidence-staged',wave,id+'.json');
  const c=d.researchCompleteness,ledger=c.candidateLedger;
  assert.equal(d.machineId,id);
  assert.equal(c.version,2);
  assert.ok((c.machineSpecificQueries??[]).length>=3,id+':missing research queries');
  assert.equal(new Set(c.machineSpecificQueries).size,c.machineSpecificQueries.length,id+':duplicate queries');
  assert.ok(Array.isArray(d.sources)&&d.sources.length>0,id+':no sources');
  const sources=new Map<string,any>(d.sources.map((s:any)=>[s.sourceId,s]));
  assert.equal(sources.size,d.sources.length,id+':duplicate source ID');
  const ids=new Set(ledger.map((l:any)=>l.candidateId));
  assert.equal(ids.size,ledger.length,id+':duplicate ledger candidate ID');
  const refs=new Set(ledger.map((l:any)=>l.disposition?.refId).filter(Boolean));
  const claims=new Set<string>(),queries=new Set<string>();
  for(const l of ledger){
    assert.ok(l.label&&l.candidateId,id+':empty ledger row');
    for(const sc of l.sourceClaims??[]){
      const src=sources.get(sc.sourceId);
      assert.ok(src&&src.claims.includes(sc.claim),id+':unattributed claim '+sc.sourceId+':'+sc.claim);
      claims.add(sc.sourceId+'|'+sc.claim);
    }
    for(const q of l.discoveryQueries??[]){
      assert.ok(c.machineSpecificQueries.includes(q),id+':nonrecorded discovery query');
      queries.add(q);
    }
  }
  for(const s of d.sources)for(const claim of s.claims??[])assert.ok(claims.has(s.sourceId+'|'+claim),id+':untraced source claim '+s.sourceId+':'+claim);
  for(const q of c.machineSpecificQueries)assert.ok(queries.has(q),id+':query without a candidate '+q);
  for(const f of d.findings){
    assert.ok(refs.has(f.findingId),id+':unledgered finding '+f.findingId);
    for(const sid of f.sourceIds??[])assert.ok(sources.has(sid),id+':unregistered finding source '+sid);
  }
  for(const b of d.blockedItems){
    assert.ok(refs.has(b.blockId),id+':unledgered block '+b.blockId);
    assert.ok(b.label&&b.reason&&b.reevaluationCondition,id+':block missing user-facing explanation '+b.blockId);
    for(const sid of b.sourceIds??[])assert.ok(sources.has(sid),id+':unregistered block source '+sid);
  }
  assert.notEqual(d.researchStage,'SOURCE_REVIEWED_COMPLETE',id+':premature promotion');
  assert.notEqual(c.status,'COMPLETE',id+':premature completeness claim');
 }
});
test('RE2 source-backed internal state and AT direct probabilities stay non-runtime until observable',()=>{
 const x=read('research-quantitative-addenda','S_BIOHAZARD_RE2_XB.json');
 assert.deepEqual(x.settings,[1,2,3,4,5,6]);
 const h=x.findings.find((f:any)=>f.findingId==='replay-heart-state-cz');
 const a=x.findings.find((f:any)=>f.findingId==='at-direct-hit-by-role');
 assert.deepEqual(h.settingPercentRows['1'],[0.4,0.4,3.1,50]);
 assert.deepEqual(h.settingPercentRows['6'],[1.6,1.6,10.2,58.6]);
 assert.deepEqual(a.settingReciprocalRows['1'],[65536,993,64]);
 assert.deepEqual(a.settingReciprocalRows['6'],[2048,256,16]);
 assert.match(h.status,/REFERENCE_ONLY/);
 assert.match(a.status,/REFERENCE_ONLY/);
});
test('Den-O 100pt CZ finding uses a conditional trial and is never marked live exact',()=>{
 const d=read('research-evidence-staged','wave-2','L_KAMEN_RIDER_DEN_O_UD.json');
 const f=d.findings.find((x:any)=>x.findingId==='possession-100-cz');
 assert.ok(f);
 assert.equal(f.observationType,'conditional_probability');
 assert.equal(f.trialUniverse,'POSSESSION_100PT_REACHED_TRIAL');
 assert.deepEqual(f.settingDistribution,{'1':0.489,'2':0.489,'4':0.492,'5':0.498,'6':0.5});
 assert.equal(f.liveObservation.status,'UNRESOLVED');
});
test('Laughing Salesman revival-inclusive bonus rate is reference-only',()=>{
 const d=read('research-evidence-staged','wave-2','S_WARAU4_KH.json');
 const f=d.findings.find((x:any)=>x.findingId==='bonus-total');
 assert.equal(f.observationType,'reference_distribution');
 assert.equal(f.liveObservation.status,'UNRESOLVED');
});

test('Batch009 machine Research uses canonical observation status and never pretends unresolved means exact',()=>{
 const statuses=new Set(['DIRECT_EXACT','EXACT_WITH_SCOPE_TRACKING','EXHAUSTIVE_CATEGORICAL','RETROSPECTIVE_EXACT','UNRESOLVED']);
 for(const [i,id] of machines.entries()){
  const wave=i<5?'wave-1':'wave-2';
  for(const stage of ['research-working','research-evidence-staged']){
   const d=read(stage,wave,id+'.json');
   for(const f of d.findings){
    if(f.liveObservation!==undefined){
     assert.ok(statuses.has(f.liveObservation.status),id+':'+stage+':unsupported live status '+f.findingId);
     assert.ok(f.liveObservation.reason,id+':'+stage+':missing observation reason');
    }
   }
  }
 }
});

test('Sister Quest small-role rates are source-checked as no-setting-difference, not a live feature',()=>{
 for(const folder of ['research-working','research-evidence-staged']){
  const d=read(folder,'wave-1','L_SISTER_QUEST_CA.json');
  const row=d.researchCompleteness.domains.find((x:any)=>x.domain==='SMALL_ROLE');
  assert.equal(row?.status,'CHECKED');
  assert.equal(row.sourceIds.length,2);
  for(const sourceId of row.sourceIds){
   const source=d.sources.find((s:any)=>s.sourceId===sourceId);
   assert.ok(source?.url&&source.claims.length,idForFailure(folder,sourceId));
  }
  const ledger=d.researchCompleteness.candidateLedger.find((x:any)=>x.candidateId==='no-setting-difference:sister-small-role');
  assert.equal(ledger?.disposition.type,'NO_SETTING_DIFFERENCE');
  assert.equal(ledger.sourceClaims.length,2);
  assert.ok(!d.findings.some((x:any)=>x.findingId==='sister-small-role'));
  assert.equal(d.researchCompleteness.status,'INCOMPLETE');
 }
});
const idForFailure=(folder:string,id:string)=>folder+':missing source '+id;

test('Sister Quest reset mode table is retained as a blocked non-setting-specific reference',()=>{
 for(const folder of ['research-working','research-evidence-staged']){
  const d=read(folder,'wave-1','L_SISTER_QUEST_CA.json');
  const reset=d.researchCompleteness.domains.find((x:any)=>x.domain==='RESET_BEHAVIOR');
  assert.equal(reset?.status,'CHECKED');
  assert.equal(reset.sourceIds.length,2);
  const b=d.blockedItems.find((x:any)=>x.blockId==='sister-reset-mode-unverified-setting-distribution');
  assert.ok(b);
  assert.match(b.reason,/設定ごとの違いは確認できません/);
  const ledger=d.researchCompleteness.candidateLedger.find((x:any)=>x.candidateId==='block:'+b.blockId);
  assert.equal(ledger?.disposition.type,'BLOCKED');
  assert.equal(ledger?.disposition.refId,b.blockId);
  assert.ok(!d.findings.some((f:any)=>f.findingId==='sister-reset-mode'));
  assert.equal(d.researchCompleteness.status,'INCOMPLETE');
 }
});

test('Sister Quest 400/600EXP high-setting tendency never becomes an invented settings table',()=>{
 for(const folder of ['research-working','research-evidence-staged']){
  const d=read(folder,'wave-1','L_SISTER_QUEST_CA.json');
  const dom=d.researchCompleteness.domains.find((x:any)=>x.domain==='POINTS_GAME_DISTRIBUTION');
  assert.equal(dom?.status,'PARTIAL');
  const b=d.blockedItems.find((x:any)=>x.blockId==='sister-exp-400-600-setting-rate-not-published');
  assert.ok(b?.sourceIds.length>=2);
  assert.match(b.reason,/設定ごとの当選率を確認できません/);
  const ledger=d.researchCompleteness.candidateLedger.find((x:any)=>x.candidateId==='block:'+b.blockId);
  assert.equal(ledger?.disposition.type,'BLOCKED');
  assert.ok(!d.findings.some((x:any)=>x.findingId==='sister-exp-400-600-setting-rate-not-published'));
  assert.notEqual(d.researchCompleteness.status,'COMPLETE');
 }
});

test('Sister Quest BONUS is an AT-side mechanic and not a normal initial bonus setting distribution',()=>{
 for(const scope of ['research-working','research-evidence-staged']){
  const d=read(scope,'wave-1','L_SISTER_QUEST_CA.json');
  const status=(domain:string)=>d.researchCompleteness.domains.find((x:any)=>x.domain===domain)?.status;
  for(const domain of ['BONUS','BONUS_TYPE_CONDITIONAL','STATE_TRANSITION','NAVIGATION','SUCCESS_RATE','CARRY_OVER'])
   assert.equal(status(domain),'CHECKED',scope+':'+domain);
  for(const domain of ['MODE_TRANSITION','POST_EVENT_TRANSITION','ROLE_CONDITIONAL_DISTRIBUTION'])
   assert.equal(status(domain),'PARTIAL',scope+':'+domain);
  for(const code of ['bonus','bonus-conditional','state','navigation','cz-win-rate','carry-over','mode','post-event','role-conditional']){
   const id='sister-'+code+'-unusable-for-setting';
   const blocked=d.blockedItems.find((x:any)=>x.blockId===id);
   const ledger=d.researchCompleteness.candidateLedger.find((x:any)=>x.candidateId==='block:'+id);
   assert.ok(blocked?.reason&&blocked?.sourceIds.length>=2,scope+':'+id);
   assert.equal(ledger?.disposition.type,'BLOCKED');
   assert.equal(ledger?.disposition.refId,id);
   for(const source of ledger.sourceClaims){
    assert.ok(d.sources.some((s:any)=>s.sourceId===source.sourceId&&s.claims.includes(source.claim)),source.sourceId);
   }
  }
  assert.ok(!d.findings.some((x:any)=>x.findingId==='sister-bonus-initial'));
  assert.equal(d.researchCompleteness.status,'INCOMPLETE');
 }
});

test('Sister Quest does not convert whole-CZ success rate or internal mode cues into setting-specific probabilities',()=>{
 const d=read('research-evidence-staged','wave-1','L_SISTER_QUEST_CA.json');
 const prohibited=['sister-cz-win-rate','sister-state','sister-navigation','sister-bonus'];
 assert.ok(prohibited.every(id=>!d.findings.some((x:any)=>x.findingId===id)));
 assert.match(d.blockedItems.find((b:any)=>b.blockId==='sister-cz-win-rate-unusable-for-setting').reason,/約60%は全体の目安/);
 assert.match(d.blockedItems.find((b:any)=>b.blockId==='sister-navigation-unusable-for-setting').reason,/内部状態や次回のCZ/);
});
