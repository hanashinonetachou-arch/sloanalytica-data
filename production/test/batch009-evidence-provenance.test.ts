// Historical v48 input fixture. Current production routes are tested in batch009-process-resumption.test.ts.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve('batches','batch-20261008-009');
const read=(...parts:string[])=>JSON.parse(fs.readFileSync(path.join(root,...parts),'utf8'));
const machines=read('batch.json').waves.flatMap((w:any)=>w.machineIds) as string[];
test('Batch009 evidence remains staged, source-linked, and non-deployable',()=>{
  assert.equal(machines.length,10);
  for(const [i,machineId] of machines.entries()){
    const wave=i<5?'wave-1':'wave-2';
    const working=read('research-history/v48/research-working',wave,machineId+'.json');
    const staged=read('research-history/v48/research-evidence-staged',wave,machineId+'.json');
    const reviewed=read('research-history/v48/research-evidence-reviewed',machineId+'.json');
    assert.equal(working.machineId,machineId);
    assert.equal(staged.machineId,machineId);
    assert.equal(reviewed.machineId,machineId);
    assert.notEqual(staged.researchCompleteness.status,'COMPLETE');
    assert.equal(staged.researchStage,'EVIDENCE_STAGED_NOT_APPROVED');
    const byId=new Map<string,any>(staged.findings.map((f:any)=>[f.findingId,f]));
    const sources=new Map<string,any>(staged.sources.map((s:any)=>[s.sourceId,s]));
    for(const f of staged.findings){
      assert.ok(f.sourceIds?.length, machineId+':'+f.findingId+':sources');
      for(const id of f.sourceIds)assert.ok(sources.has(id),machineId+':'+f.findingId+':'+id);
    }
    for(const ev of reviewed.evidenceCandidates??[]){
      const id='reviewed-'+ev.findingId;
      const f=byId.get(id);
      assert.ok(f,machineId+':MISSING_REVIEWED:'+id);
      assert.deepEqual(f.semanticCategories,ev.semanticCategories,machineId+':CATEGORIES_CHANGED:'+id);
      if(Array.isArray(ev.sourceUrls)){
        assert.ok(ev.sourceUrls.length>0,machineId+':EMPTY_SCOPED_SOURCES:'+id);
        const actual=f.sourceIds.map((sid:string)=>sources.get(sid).url).sort();
        assert.deepEqual(actual,[...new Set(ev.sourceUrls)].sort(),machineId+':SOURCE_CROSS_ATTRIBUTION:'+id);
      }
    }
  }
});
test('Bio5 four independent hint groups retain their own evidence sources',()=>{
  const d=read('research-history/v48/research-evidence-staged','wave-1','L_BIOHAZARD5_ZE.json');
  const evidence=d.findings.filter((x:any)=>x.observationType==='evidence');
  assert.equal(evidence.length,4);
  for(const f of evidence)assert.equal(f.sourceIds.length,2,f.findingId);
  const ids=new Set(evidence.map((x:any)=>x.findingId));
  assert.ok(ids.has('reviewed-ending-rare-role-voice'));
  const voice=evidence.find((x:any)=>x.findingId==='reviewed-ending-rare-role-voice');
  assert.equal(voice.semanticCategories.length,8);
  assert.equal(voice.semanticCategories.filter((x:any)=>x.semanticType==='EXACT_CONSTRAINT').length,3);
  const trophy=evidence.find((x:any)=>x.findingId==='reviewed-enta-trophy');
  assert.ok(trophy.semanticCategories.some((x:any)=>x.label==='銅'&&x.meaning==='設定2以上'));
  const medals=evidence.find((x:any)=>x.findingId==='reviewed-special-medal');
  assert.ok(medals.semanticCategories.some((x:any)=>x.label==='256枚OVER'&&x.meaning==='設定2・5・6'));
  assert.equal(d.blockedItems.some((b:any)=>b.blockId==='medal-display'),false);
  assert.equal(d.blockedItems.some((b:any)=>b.blockId==='infection-middle7-conflict'),false);
  assert.ok(d.researchCompleteness.resolvedSourceConflicts.some((x:any)=>x.resolution==='19.8%'));
  assert.ok(d.blockedItems.some((b:any)=>b.blockId==='infection-first-navi-scope'));
});
test('BIG島唄 has conditional rates but no invented numerical hint evidence',()=>{
  const d=read('research-history/v48/research-evidence-staged','wave-2','S_BIG_SHIMAUTA_E2_30.json');
  assert.deepEqual(d.settings.values,['SET_1','SET_2','SET_3','SET_5','SET_6']);
  assert.equal(d.findings.filter((x:any)=>x.observationType==='appearance_distribution').length,2);
  assert.equal(d.findings.filter((x:any)=>x.observationType==='evidence').length,0);
  for(const f of d.findings.filter((x:any)=>x.observationType==='appearance_distribution'))assert.equal(f.liveObservation.status,'UNRESOLVED');
  for(const domain of ['INITIAL_HIT','MODE_TRANSITION'])
    assert.equal(d.researchCompleteness.domains.find((x:any)=>x.domain===domain)?.status,'PARTIAL');
  assert.equal(d.researchCompleteness.status,'INCOMPLETE');
});

test('てぃだどんどん covers the five supported settings and only uses seven-segment exact hints',()=>{
  const d=read('research-history/v48/research-evidence-staged','wave-1','L_TIDADONDON_PA5.json');
  assert.deepEqual(d.settings.values,['SET_2','SET_3','SET_4','SET_5','SET_6']);
  const f=d.findings.find((x:any)=>x.findingId==='reviewed-big-seven-seg');
  assert.ok(f);
  const categories=new Map(f.semanticCategories.map((c:any)=>[c.label,c]));
  for(const [label,meaning] of [['黄','設定3以上'],['緑','設定4以上'],['緑＆赤','設定6']]){
    const x:any=categories.get(label);
    assert.equal(x?.meaning,meaning);
    assert.equal(x?.semanticType,'EXACT_CONSTRAINT');
  }
  assert.equal(d.blockedItems.some((x:any)=>x.blockId==='seven-segment'),false);
  assert.ok(d.blockedItems.some((x:any)=>x.blockId==='small-role-no-setting-difference'));
  assert.equal(d.researchCompleteness.domains.find((x:any)=>x.domain==='SMALL_ROLE')?.status,'CHECKED');
  assert.equal(d.findings.find((x:any)=>x.findingId==='bonus-initial')?.liveObservation?.status,'DIRECT_EXACT');
});
test('BOØWY public small-role rates do not become a fabricated feature',()=>{
  const d=read('research-history/v48/research-evidence-staged','wave-2','S_BOOWY_SV.json');
  assert.deepEqual(d.settings.values,['SET_1','SET_2','SET_4','SET_5','SET_6']);
  assert.equal(d.findings.filter((x:any)=>x.settingDistribution).length,1);
  assert.equal(d.findings[0].liveObservation.status,'DIRECT_EXACT');
  assert.ok(d.blockedItems.some((x:any)=>x.blockId==='small-role-common'));
  const c=d.findings.find((x:any)=>x.findingId==='reviewed-at-end-screen');
  const high=c.semanticCategories.find((x:any)=>x.label==='氷室＆高橋');
  assert.equal(high.semanticType,'PROBABILITY_UNKNOWN');
  assert.equal(d.researchCompleteness.domains.find((x:any)=>x.domain==='SMALL_ROLE')?.status,'CHECKED');
});


test('Sister Quest TALK black replies and unverified C/B gacha remain distinct and honest',()=>{
 const d=read('research-history/v48/research-evidence-staged','wave-1','L_SISTER_QUEST_CA.json');
 const talk=d.findings.find((x:any)=>x.findingId==='reviewed-smart-talk');
 assert.ok(talk);
 assert.ok(talk.semanticCategories.some((x:any)=>x.label==='今日の調子：黒（もしかしたら…）'&&x.semanticType==='DISPLAY_ONLY'));
 assert.ok(talk.semanticCategories.some((x:any)=>x.label==='今日の調子：黒（まあまあ…）'&&x.semanticType==='PROBABILITY_UNKNOWN'));
 assert.equal(talk.semanticCategories.some((x:any)=>/黒文字[①②]/.test(x.label)),false);
 const gacha=d.findings.find((x:any)=>x.findingId==='reviewed-gacha-rank');
 assert.ok(gacha);
 for(const label of ['ランクB','ランクC']){
  const c=gacha.semanticCategories.find((x:any)=>x.label===label);
  assert.equal(c?.semanticType,'DISPLAY_ONLY');
  assert.match(c?.meaning??'',/調査中/);
 }
});


test('BOØWY threshold, reset and post-event domains are source checked but not setting-rate evidence',()=>{
 const d=read('research-history/v48/research-evidence-staged','wave-2','S_BOOWY_SV.json');
 const checked=['SMALL_ROLE','THRESHOLD_BEHAVIOR','RESET_BEHAVIOR','POST_EVENT_TRANSITION'];
 for(const domain of checked){
   const row=d.researchCompleteness.domains.find((x:any)=>x.domain===domain);
   assert.equal(row?.status,'CHECKED',domain);
   assert.ok(row.sourceIds?.length>=1,domain+':source');
 }
 for(const blockId of ['ceiling-1480-no-setting-rate','reset-internal-mode-no-setting-rate','super-heaven-return-no-setting-rate']){
   const item=d.blockedItems.find((x:any)=>x.blockId===blockId);
   assert.ok(item?.reason&&item.reevaluationCondition,blockId+':explanation');
   assert.ok(d.researchCompleteness.candidateLedger.some((x:any)=>x.disposition?.type==='BLOCKED'&&x.disposition.refId===blockId),blockId+':ledger');
 }
 assert.equal(d.researchCompleteness.status,'INCOMPLETE');
 assert.equal(d.findings.find((x:any)=>x.findingId==='at-initial').liveObservation.status,'DIRECT_EXACT');
});
