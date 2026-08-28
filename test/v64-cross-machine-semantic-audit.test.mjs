import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { auditV64CrossMachine } from '../tools/audit-v64-cross-machine-semantic.mjs';

function writeJson(p, value) {
  fs.mkdirSync(path.dirname(p), {recursive:true});
  fs.writeFileSync(p, JSON.stringify(value, null, 2));
}
function fixture({exclude=true, declareShared=false}={}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'slo-v64-audit-'));
  const machineId='TEST_MACHINE';
  const research={
    machine:{machineId,displayName:'Test'},
    discoveryInventory:[{discoveryCandidateId:'D1',name:'終了画面',researchTarget:['RF_END_SCREEN','RE_END_GOLD']}],
    features:[{
      researchFeatureId:'RF_END_SCREEN',name:'終了画面',candidateModel:'multinomial',distributionMode:'complete',
      categories:['WHITE','GOLD'],settingDistributions:{SET_1:{WHITE:1,GOLD:0},SET_6:{WHITE:0.8,GOLD:0.2}}
    }],
    evidenceCandidates:[{researchEvidenceId:'RE_END_GOLD',name:'終了画面 GOLD',allowedSettings:['SET_6'],deniedSettings:['SET_1']}]
  };
  const selection={
    machineId,
    inputs:[{id:'INP_WHITE',name:'白'},{id:'INP_GOLD',name:'金'}],
    features:[exclude ? {
      researchFeatureId:'RF_END_SCREEN',featureId:'FEAT_END_SCREEN_EXCLUDED',adoptionCategory:'EXCLUDE',userReason:'確定情報と重複するため数値分布は不採用。'
    } : {
      researchFeatureId:'RF_END_SCREEN',featureId:'FEAT_END_SCREEN',adoptionCategory:'INCLUDE_SUPPORT',numeratorInputId:'INP_WHITE',categoryInputIds:['INP_GOLD']
    }],
    evidence:[{researchEvidenceId:'RE_END_GOLD',evidenceId:'EVI_END_GOLD',inputId:'INP_GOLD',...(declareShared?{sharedFeatureIds:['FEAT_END_SCREEN']}:{})}]
  };
  const pkg={features:{features:exclude?[]:[{featureId:'FEAT_END_SCREEN',adoptionCategory:'INCLUDE_SUPPORT',numeratorInputId:'INP_WHITE',categoryInputIds:['INP_GOLD']}]},evidence:{evidences:[{id:'EVI_END_GOLD',inputId:'INP_GOLD',...(declareShared?{sharedFeatureIds:['FEAT_END_SCREEN']}:{})}]}};
  writeJson(path.join(root,'research',machineId,'research-data.json'),research);
  writeJson(path.join(root,'research',machineId,'selection-data.json'),selection);
  writeJson(path.join(root,'machines',machineId,'machine-package.json'),pkg);
  return root;
}

test('finds legacy evidence-overlap numeric rejection even on old schema',()=>{
  const root=fixture({exclude:true});
  const r=auditV64CrossMachine(root);
  assert.equal(r.summary.machineCount,1);
  assert.equal(r.summary.REVIEW,1);
  assert.ok(r.machines[0].issues.some(x=>x.code==='LEGACY_EVIDENCE_OVERLAP_REJECT_CANDIDATE'));
});

test('undeclared package feature/evidence overlap is HIGH_RISK',()=>{
  const root=fixture({exclude:false,declareShared:false});
  const r=auditV64CrossMachine(root);
  assert.equal(r.summary.HIGH_RISK,1);
  assert.ok(r.machines[0].issues.some(x=>x.code==='UNDECLARED_PACKAGE_FEATURE_EVIDENCE_OVERLAP'));
});

test('declared shared feature/evidence contract passes',()=>{
  const root=fixture({exclude:false,declareShared:true});
  const r=auditV64CrossMachine(root);
  assert.equal(r.summary.PASS,1);
  assert.equal(r.machines[0].issues.length,0);
});
