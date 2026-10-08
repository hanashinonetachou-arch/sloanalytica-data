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
    const working=read('research-working',wave,machineId+'.json');
    const staged=read('research-evidence-staged',wave,machineId+'.json');
    const reviewed=read('research-evidence-reviewed',machineId+'.json');
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
  const d=read('research-evidence-staged','wave-1','L_BIOHAZARD5_ZE.json');
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
  assert.ok(d.blockedItems.some((b:any)=>b.blockId==='infection-middle7-conflict'));
});
test('BIG島唄 has conditional rates but no invented numerical hint evidence',()=>{
  const d=read('research-evidence-staged','wave-2','S_BIG_SHIMAUTA_E2_30.json');
  assert.deepEqual(d.settings.values,['SET_1','SET_2','SET_3','SET_5','SET_6']);
  assert.equal(d.findings.filter((x:any)=>x.observationType==='appearance_distribution').length,2);
  assert.equal(d.findings.filter((x:any)=>x.observationType==='evidence').length,0);
  for(const f of d.findings.filter((x:any)=>x.observationType==='appearance_distribution'))assert.equal(f.liveObservation.status,'UNRESOLVED');
  assert.equal(d.researchCompleteness.domains.filter((x:any)=>x.status==='CHECKED').length,2);
});
