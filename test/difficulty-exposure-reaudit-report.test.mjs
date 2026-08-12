import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('Phase 9.4B-15 exposure reaudit covers all 8 machines and preserves Kaguya as evidence-dominant',()=>{
  const r=JSON.parse(fs.readFileSync('reports/difficulty-exposure-reaudit-phase9.4B15.json','utf8'));
  assert.equal(r.machines.length,8);
  assert.deepEqual(r.proposedExposureQualities.map(x=>x.quality),['EXACT','DERIVED','ESTIMATED','UNRESOLVED']);
  assert.equal(r.auditConclusion.machinesExpectedToHaveNumericScore,7);
  const k=r.machines.find(x=>x.machineId==='L_KAGUYA_SAMA_JA');
  assert.equal(k.scoreFeasibility,'NOT_APPLICABLE_EVIDENCE_DOMINANT');
  const revue=r.machines.find(x=>x.machineId==='S_REVUE_STARLIGHT_CX');
  assert.ok(revue.features.some(x=>x.reauditQuality==='ESTIMATED'));
});
