import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const draftPath='batches/batch-20261003-004/research-drafts/wave-1/L_HIHODEN_PA7.json';

test('Hiho hidden Densetsu state is never treated as directly countable',()=>{
  const d=JSON.parse(fs.readFileSync(draftPath,'utf8'));
  const byId=new Map(d.findings.map((x:any)=>[x.findingId,x]));
  for(const id of ["chance-to-koukaku","non-densetsu-big-koukaku","densetsu-big-koukaku","mystery-koukaku","densetsu-after-koukaku-fail","densetsu-after-reg"]){
    const f:any=byId.get(id);
    assert.ok(f,id+' must exist');
    assert.equal(f.observationType,'reference_distribution',id+' must remain reference-only because Densetsu state is not continuously observable');
    assert.equal(f.liveObservation,undefined,id+' must not claim direct live observation');
  }
  const safe:any=byId.get('big-koukaku-selection-overall');
  assert.ok(safe);
  assert.equal(safe.observationType,'conditional_probability');
  assert.equal(safe.trialUniverse,'KOUKAKU_HIT_TRIAL');
  assert.equal(safe.liveObservation?.status,'DIRECT_EXACT');
  assert.deepEqual(safe.settingDistribution,{'1':0.036,'2':0.04,'3':0.045,'4':0.053,'5':0.064,'6':0.072});
});
