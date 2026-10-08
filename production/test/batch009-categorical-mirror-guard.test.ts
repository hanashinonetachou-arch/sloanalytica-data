import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {categoricalEvidenceMirrorIssues} from '../src/categorical-evidence-mirror.ts';
import {validateResearchPromotionReadiness} from '../src/research-validator.ts';

const researchPath=path.resolve('batches','batch-20261008-009',
  'research-evidence-staged','wave-1','L_SISTER_QUEST_CA.json');
const staged=()=>JSON.parse(fs.readFileSync(researchPath,'utf8'));
const candidate=(d:any,id:string)=>d.findings.find((f:any)=>f.findingId===id);

test('Sister Quest has two independently verified mirrored categorical outcomes, neither deployable',()=>{
  const d=staged();
  const issues=categoricalEvidenceMirrorIssues(d);
  assert.equal(issues.filter(x=>x.startsWith('MIRRORED_CATEGORICAL_EVIDENCE_NOT_RECONCILED:')).length,2);
  assert.ok(issues.some(x=>x==='PENDING_CATEGORICAL_ROUTE:at-end-categorical'));
  assert.ok(issues.some(x=>x==='PENDING_CATEGORICAL_ROUTE:at-monster-categorical'));
});

test('Deleting a mirror ID cannot secretly unlock a second likelihood for the same source and categories',()=>{
  const d=staged();
  const end=candidate(d,'at-end-categorical');
  delete end.mirrorsEvidenceFindingId;
  delete end.numericRouteStatus;
  assert.ok(categoricalEvidenceMirrorIssues(d).includes('UNDECLARED_CATEGORICAL_EVIDENCE_MIRROR:at-end-categorical'));
});

test('Broken mirror references and category drift are rejected',()=>{
  const d=staged();
  const end=candidate(d,'at-end-categorical');
  end.mirrorsEvidenceFindingId='unregistered-evidence';
  assert.ok(categoricalEvidenceMirrorIssues(d).includes('MIRROR_EVIDENCE_NOT_FOUND:at-end-categorical'));
  end.mirrorsEvidenceFindingId='reviewed-at-end';
  candidate(d,'reviewed-at-end').semanticCategories[0].label='出典未確認の画面';
  assert.ok(categoricalEvidenceMirrorIssues(d).includes('MIRROR_CATEGORY_MISMATCH:at-end-categorical'));
});

test('Promotion remains forbidden if pending ledger statuses are cleared without de-duplication',()=>{
  const d=staged();
  for(const row of d.researchCompleteness.candidateLedger)
    if(row.disposition?.type==='FINDING_PENDING_SCOPE_VALIDATION') row.disposition.type='FINDING';
  for(const f of d.findings)
    if(f.settingDistribution && f.liveObservation?.status==='UNRESOLVED')
      f.liveObservation.status='EXACT_WITH_SCOPE_TRACKING';
  assert.throws(()=>validateResearchPromotionReadiness(d),/MIRRORED_CATEGORICAL_EVIDENCE_NOT_RECONCILED/);
});
