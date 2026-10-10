// Historical v48 input fixture. Current production routes are tested in batch009-process-resumption.test.ts.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {auditBatch009Staging} from '../src/batch009-staging-integrity.ts';
import {validateResearchPromotionReadiness} from '../src/research-validator.ts';
import {buildEvaluation} from '../src/evaluation-builder.ts';
import {buildEligibility} from '../src/eligibility-builder.ts';

const root='batches/batch-20261008-009/';
const id='S_BIG_SHIMAUTA_E2_30';
const read=(p:string)=>JSON.parse(fs.readFileSync(root+p,'utf8'));

test('Shimauta 32G cutoff does not establish the published initial-hit trial',()=>{
 const w=read(`research-history/v48/research-working/wave-2/${id}.json`);
 const s=read(`research-history/v48/research-evidence-staged/wave-2/${id}.json`);
 const r=read(`research-history/v48/research-evidence-reviewed/${id}.json`);
 assert.deepEqual(auditBatch009Staging(w,r,s),[]);
 const hit=s.findings.find((f:any)=>f.findingId==='big-initial');
 assert.equal(hit.liveObservation.status,'UNRESOLVED');
 assert.match(hit.denominatorSemantics,/32G以内には初当たりと連チャンが混在/);
 assert.match(hit.dependencyScopeAudit.forbiddenSimplification,/独立加点しない/);
 assert.match(hit.operationalCounting.rule,/連チャンゾーン内/);
 assert.deepEqual(hit.dependencyScopeAudit.evidenceSourceIds,['shimauta-v39-initial-window']);
 // Changing only the observation flag must not bypass the causal scope gate.
 for(const finding of s.findings)
  if(finding.liveObservation?.status==='UNRESOLVED')finding.liveObservation.status='DIRECT_EXACT';
 for(const row of s.researchCompleteness.candidateLedger)
  if(row.disposition.type==='FINDING_PENDING_SCOPE_VALIDATION')row.disposition.type='FINDING';
 assert.throws(()=>validateResearchPromotionReadiness(s),/UNRESOLVED_CAUSAL_DEPENDENCY_PROMOTION_FORBIDDEN/);
 const decision=buildEligibility(buildEvaluation(s)).decisions.find((d:any)=>d.findingId==='big-initial');
 assert.equal(decision.eligibility,'UNRESOLVED');
 assert.equal(decision.liveInferenceRoute,'NONE');
});
