import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { auditControlledLineageWorkqueue, BASE_HEAD, DECISION_TYPES, SOURCE_SET_SUBTYPES, TOPOLOGIES } from "../tools/audit-m7-controlled-lineage-workqueue.mjs";

const root=path.resolve(import.meta.dirname,"..");
const report=auditControlledLineageWorkqueue(root);
const keys=rows=>rows.map(row=>`${row.machineId}/${row.groupId}`);
const sum=o=>Object.values(o).reduce((a,b)=>a+b,0);
const WORKQUEUE_HEAD="4a35b7186664dd3bedd29bb8b93fbc2bef2dc00d";

test("controlled lineage queue contains exactly 238 groups and no duplicates",()=>{ assert.equal(report.summary.controlledLineageGroupCount,238); assert.equal(new Set(keys(report.groups)).size,238); });
test("queue contains only the controlled SOURCE_EVIDENCE_SET_NOT_EXPLICIT population",()=>{ const plan=JSON.parse(fs.readFileSync(path.join(root,"reports/m7-phase2-2-lineage-resolution-plan-20260916.json"),"utf8")); const expected=(plan.unresolvedGroups??[]).filter(r=>r.resolutionClass==="SOURCE_EVIDENCE_SET_NOT_EXPLICIT"&&r.bulkAnnotationEligibility==="REQUIRES_HUMAN_LINEAGE_CONFIRMATION").map(r=>`${r.machineId}/${r.groupId}`).sort(); assert.deepEqual(keys(report.groups).sort(),expected); });
test("topology, subtype, and decision counts close exactly",()=>{ assert.equal(sum(report.summary.topologyCounts),238); assert.equal(sum(report.summary.sourceSetSubtypeCounts),238); assert.equal(sum(report.summary.decisionTypeCounts),238); assert.deepEqual(Object.keys(report.summary.topologyCounts),TOPOLOGIES); assert.deepEqual(Object.keys(report.summary.sourceSetSubtypeCounts),SOURCE_SET_SUBTYPES); assert.deepEqual(Object.keys(report.summary.decisionTypeCounts),DECISION_TYPES); });
test("machine grouping is deterministic and complete",()=>{ assert.equal(report.summary.affectedMachineCount,report.machines.length); assert.deepEqual(report.machines.map(r=>r.machineId),[...report.machines.map(r=>r.machineId)].sort((a,b)=>a.localeCompare(b))); assert.equal(report.machines.reduce((n,r)=>n+r.unresolvedGroupCount,0),238); });
test("known mismatch/redesign Batch-1 groups are excluded",()=>{ const actual=new Set(keys(report.groups)); for (const key of ["L_ASLOT_KONOSUBA_FX/KONOSUBA_BIG_END","L_SISTER_QUEST_CA/SMARTALK","S_TOARU_RAILGUN_FB/SETTING_EVIDENCE"]) assert.equal(actual.has(key),false,key); assert.equal(report.summary.accidentalMismatchAbsorptionCount,0); });
test("unexpected exact machine-readable sets are report-only",()=>{ for (const row of report.groups.filter(r=>r.sourceSetSubtype==="EXACT_MACHINE_READABLE_SET_FOUND")) { assert.equal(row.humanDecisionRequired,"REVIEW_UNEXPECTED_EXACT_MACHINE_READABLE_SET"); assert.equal(row.currentState,"FORMAL_PROOF_NOT_ESTABLISHED"); } });
test("work queue introduces no runtime proof/sharing fields",()=>{ const serialized=JSON.stringify(report); for (const forbidden of ["sharedFeatureIds","proofConfidence","lineageConfidence"]) assert.equal(serialized.includes(`\"${forbidden}\"`),false); });
test("audit is deterministic",()=>{ assert.deepEqual(auditControlledLineageWorkqueue(root),report); });
test("base is exact PR #297 merge and workqueue commit contains only four deliverables",()=>{ assert.equal(BASE_HEAD,"229dddde617efb4e0427f08a3d5b2b324ad18d20"); const output=execFileSync("git",["diff","--name-only",BASE_HEAD,WORKQUEUE_HEAD,"--"],{cwd:root,encoding:"utf8"}).trim().split(/\r?\n/).filter(Boolean).sort(); const allowed=["reports/m7-phase2-2-controlled-lineage-workqueue-20260916.json","reports/m7-phase2-2-controlled-lineage-workqueue-20260916.md","test/m7-controlled-lineage-workqueue.test.mjs","tools/audit-m7-controlled-lineage-workqueue.mjs"].sort(); assert.deepEqual(output,allowed); });
test("policy remains diagnostic-only and claims no real-device verification",()=>{ assert.match(report.policy.scope,/Diagnostic human-confirmation work queue only/); assert.match(report.policy.realDevice,/No real-device verification is claimed/); assert.match(report.policy.labelCategoryRule,/never lineage proof/); });
