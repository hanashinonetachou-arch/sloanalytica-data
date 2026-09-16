import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const INPUT='reports/m7-phase2-2-observation-construction-plan-20260916.json';
const OUT='reports/m7-phase2-2-single-discrete-evidence-review-20260916.json';
const allowed=new Set(['SAFE_CONSTRUCTION_CANDIDATE','HUMAN_SEMANTIC_CONFIRMATION_REQUIRED','UPSTREAM_CONTRACT_REVIEW_REQUIRED','OBSERVATION_REDESIGN_OR_SPLIT_REQUIRED','FIELD_OR_EXTERNAL_VERIFICATION_REQUIRED']);
const run=()=>execFileSync(process.execPath,['tools/audit-m7-single-discrete-evidence-review.mjs'],{stdio:'pipe'});
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));

test('audit generates exact 32-group / 31-machine population',()=>{run();const r=read(OUT);assert.equal(r.summary.reviewedGroupCount,32);assert.equal(r.summary.reviewedMachineCount,31);});
test('population is exactly authoritative SINGLE_DISCRETE rows',()=>{const p=read(INPUT);const expected=(p.noCandidateConstructionPlan||[]).filter(x=>x.constructionPattern==='SINGLE_DISCRETE_EVIDENCE_OBSERVATION').map(x=>`${x.machineId}::${x.groupId}`).sort();const r=read(OUT);const actual=r.groups.map(x=>`${x.machineId}::${x.groupId}`).sort();assert.deepEqual(actual,expected);});
test('each group appears once and selected source sets are exact',()=>{const p=read(INPUT);const source=new Map((p.noCandidateConstructionPlan||[]).filter(x=>x.constructionPattern==='SINGLE_DISCRETE_EVIDENCE_OBSERVATION').map(x=>[`${x.machineId}::${x.groupId}`,[...(x.selectedSourceEvidenceIds||[])].sort()]));const r=read(OUT);assert.equal(new Set(r.groups.map(x=>`${x.machineId}::${x.groupId}`)).size,32);for(const g of r.groups)assert.deepEqual([...g.selectedSourceEvidenceIds].sort(),source.get(`${g.machineId}::${g.groupId}`));});
test('classifications are valid and formal proof remains false',()=>{const r=read(OUT);for(const g of r.groups){assert.ok(allowed.has(g.semanticClassification));assert.equal(g.formalProofEstablished,false);assert.equal(g.classificationBasis,'MACHINE_READABLE_REPOSITORY_SEMANTIC_TOPOLOGY_REVIEW');}assert.equal(r.summary.formalProofEstablishedCount,0);});
test('SAFE candidates satisfy machine-readable topology only and do not imply proof',()=>{const r=read(OUT);for(const g of r.groups.filter(x=>x.semanticClassification==='SAFE_CONSTRUCTION_CANDIDATE')){assert.equal(g.repositoryEvidence.researchEvidenceSetComplete,true);assert.equal(g.repositoryEvidence.selectionSourceSetExact,true);assert.equal(g.repositoryEvidence.singleResearchObservationScope,true);assert.equal(g.repositoryEvidence.currentRelevantObservationCount,0);assert.equal(g.formalProofEstablished,false);}});
test('audit tool contains no production write target',()=>{const s=fs.readFileSync('tools/audit-m7-single-discrete-evidence-review.mjs','utf8');for(const token of ['research-data.json),','selection-data.json),','machine-observation-data.json),','machine-data.json),'])assert.equal(s.includes(`writeFileSync(${token}`),false);assert.match(s,/OUT_JSON/);assert.match(s,/OUT_MD/);});
