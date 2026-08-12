import fs from 'node:fs';
import path from 'node:path';
import { evaluateMachineDifficulty } from './evaluate-machine-difficulty.mjs';

function read(p){return JSON.parse(fs.readFileSync(p,'utf8'));}

function trialUnitLabel(rf){
  const u=String(rf?.trialUnit??'試行');
  if(/[GＧ]|ゲーム/.test(u)) return 'G';
  if(/REG/i.test(u)) return 'REG回';
  if(/BONUS|ボーナス/i.test(u)) return 'BONUS回';
  if(/AT終了/.test(u)) return 'AT終了回';
  if(/CZ/.test(u)) return 'CZ回';
  return u || '試行';
}

function classify(numericCount,evidenceCount){
  if(numericCount>=2)return {profile:'NORMAL',presentationMode:'STANDARD'};
  if(numericCount===1)return {profile:'LIMITED',presentationMode:'STANDARD_WITH_LIMITATION'};
  if(evidenceCount>0)return {profile:'EVIDENCE_DOMINANT',presentationMode:'REJECTED_FEATURES_FIRST'};
  return {profile:'NO_NUMERIC_INFERENCE',presentationMode:'RESEARCH_LIMITATION_FIRST'};
}

export function buildNumericInferenceProfile(research,selection){
  const diff=evaluateMachineDifficulty(research,selection,{simulationsPerSetting:100});
  const estimates=new Map((diff.featureTrialEstimates??[]).map(x=>[x.featureId,x]));
  const researchById=new Map((research.features??[]).map(x=>[x.researchFeatureId,x]));
  const adopted=(selection.features??[]).filter(f=>['INCLUDE_PRIMARY','INCLUDE_SUPPORT'].includes(f.adoptionCategory));
  const rejected=(selection.features??[]).filter(f=>f.adoptionCategory==='EXCLUDE').map(f=>{
    const rf=researchById.get(f.researchFeatureId);
    const est=estimates.get(f.featureId);
    const n=est?.requiredTrials80;
    return {
      featureId:f.featureId,
      researchFeatureId:f.researchFeatureId,
      name:rf?.name??f.featureId,
      rejectionReason:f.rejectionReason??null,
      requiredTrials80:Number.isFinite(n)?n:null,
      requiredTrialsUnit:trialUnitLabel(rf),
      metricStatus:Number.isFinite(n)?'COMPUTED':'NOT_COMPUTABLE',
      criterion:est?.criterion??null
    };
  });
  const legacyEvidenceCount=(selection.evidence??[]).length;
  const evidenceUiCount=(selection.evidenceUi?.groups??[]).reduce((sum,g)=>sum+(g.options??[]).filter(o=>(o.allowedSettings??[]).length||(o.excludedSettings??[]).length).length,0);
  const evidenceCount=legacyEvidenceCount+evidenceUiCount;
  const c=classify(adopted.length,evidenceCount);
  return {
    profileVersion:'numeric-inference-profile-v1',
    machineId:research.machine?.machineId??selection.machineId??null,
    generatedAt:new Date().toISOString(),
    ...c,
    summary:{
      adoptedNumericFeatureCount:adopted.length,
      rejectedNumericCandidateCount:rejected.length,
      hardEvidenceCount:evidenceCount
    },
    adoptedNumericFeatures:adopted.map(f=>({
      featureId:f.featureId,
      name:researchById.get(f.researchFeatureId)?.name??f.featureId,
      adoptionCategory:f.adoptionCategory
    })),
    rejectedFeatures:rejected,
    presentationPolicy:{
      rejectedFeaturesProminent:c.profile==='EVIDENCE_DOMINANT'||c.profile==='NO_NUMERIC_INFERENCE',
      showRequiredTrialsWhenComputed:true,
      showNotComputableWhenUnavailable:true,
      doNotInventTrialCount:true,
      conciseRejectionReason:true
    },
    note:c.profile==='EVIDENCE_DOMINANT'
      ? '数値尤度へ採用できるFeatureがなくHard Evidenceが中心。UIでは不採用Featureの理由と必要試行数を前面に表示する。'
      : null
  };
}

if(import.meta.url===`file://${process.argv[1]}`){
  const [researchPath,selectionPath,out]=process.argv.slice(2);
  if(!researchPath||!selectionPath){
    console.error('Usage: node tools/build-numeric-inference-profile.mjs <research-data.json> <selection-data.json> [output.json]');
    process.exit(2);
  }
  const report=buildNumericInferenceProfile(read(researchPath),read(selectionPath));
  const text=JSON.stringify(report,null,2)+'\n';
  if(out){
    fs.mkdirSync(path.dirname(out),{recursive:true});
    fs.writeFileSync(out,text);
    console.log(`Numeric inference profile: ${out}`);
  }else process.stdout.write(text);
}
