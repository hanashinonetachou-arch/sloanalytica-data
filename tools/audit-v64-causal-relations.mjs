#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const arr=v=>Array.isArray(v)?v:[];
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));

// Human-reviewed v6.4 semantic classifications.
// Every entry must state the structural/observation reason that makes the current
// Selection decision safe; causal wording by itself is never sufficient.
// A newly appearing or disappearing candidate is treated as review drift.
const REVIEWED = {
  'L_BIOHAZARD5_ZE/RF_CZ_TOTAL': [
    'SHARED_PATH_DEPENDENCY',
    'KEEP_EXCLUDED_AVOID_DOUBLE_COUNT',
    'CZ合算はAT初当りへつながる上流当選過程を共有する。現行SelectionはAT初当りを代表尤度として採用しており、CZ成功率などを条件分解した構成モデルがない状態でCZ合算を独立乗算すると同一遊技区間の設定差を重複評価するため、独立Featureとしては除外を維持する。',
    'REOPEN_IF_CONDITIONAL_COMPOSITION_MODEL_AVAILABLE',
  ],
  'L_DMC5_ST_XA/RF_ST_FIRST_HIT': [
    'DOWNSTREAM_COMPOSITE_OUTCOME',
    'KEEP_EXCLUDED_AVOID_DOUBLE_COUNT',
    'ST初当りはボーナス/CZ成功の下流結果を含む複合アウトカムで、主Featureのボーナス初当りと当選系列を共有する。経路別の条件付き成功率へ分解する構成モデルがないため、独立尤度としての同時採用は行わない。',
    'REOPEN_IF_ROUTE_COMPOSITION_MODEL_AVAILABLE',
  ],
  'L_GUNDAM_SEED_G/RF_CZ_FIRST_HIT': [
    'SHARED_PATH_DEPENDENCY',
    'KEEP_EXCLUDED_AVOID_DOUBLE_COUNT',
    'CZ初当りは主FeatureのAT初当りへ接続する主要経路の上流観測であり、両者を独立尤度として扱うと同じ当選系列の設定差を重ねやすい。現行はAT初当りを代表採用し、CZ経由率を条件分解できるモデルが整うまで独立Feature化しない。',
    'REOPEN_IF_CONDITIONAL_ROUTE_MODEL_AVAILABLE',
  ],
  'L_SISTER_QUEST_CA/RF_CZ_FIRST_HIT': [
    'SHARED_PATH_DEPENDENCY',
    'KEEP_EXCLUDED_AVOID_DOUBLE_COUNT',
    'CZ初当りからAT当選へ至る経路が主FeatureのAT初当りに含まれるため、CZ初当りとAT初当りは独立試行ではない。CZ成功率などを条件付きで分離するモデルなしに両方を乗算すると重複評価となるため、差が大きく直接観測できるAT初当りを代表採用する。',
    'REOPEN_IF_CONDITIONAL_ROUTE_MODEL_AVAILABLE',
  ],
  'S_SUPER_RIO_ACE_CC/RF_BONUS_AT_DRAW_STRONG': [
    'CONDITIONAL_ATTRIBUTION_OBSERVATION',
    'KEEP_EXCLUDED_OBSERVATION_LIMIT',
    '強レア役成立を分母、かつその契機によるAT当選だけを分子として対応付ける必要があり、通常実戦では因果帰属の観測負担が高い。さらに対象事象が希少で有効サンプルが少なくなりやすいため、現行の通常入力面には採用せずResearch事実として保持する。',
    'REOPEN_IF_ATTRIBUTABLE_TRIAL_OBSERVATION_IS_AVAILABLE',
  ],
};

export function auditCausalRelations(root=process.cwd()) {
  const semanticPath=path.join(root,'reports','v64-cross-machine-semantic-audit.json');
  const semantic=read(semanticPath);
  const candidates=semantic.machines.flatMap(m=>arr(m.issues)
    .filter(i=>i.code==='CAUSAL_RELATION_REJECT_CANDIDATE')
    .map(i=>({machineId:m.machineId,displayName:m.displayName,...i})));
  const seen=new Set(candidates.map(c=>`${c.machineId}/${c.researchFeatureId}`));
  const expected=new Set(Object.keys(REVIEWED));
  const missingReview=[...seen].filter(k=>!expected.has(k));
  const staleReview=[...expected].filter(k=>!seen.has(k));
  if(missingReview.length||staleReview.length){
    throw new Error(`causal review mapping drift: missing=${missingReview.join(',')||'-'} stale=${staleReview.join(',')||'-'}`);
  }

  const rows=candidates.map(c=>{
    const key=`${c.machineId}/${c.researchFeatureId}`;
    const [relation,action,rationale,secondaryRelation=null]=REVIEWED[key];
    const rp=path.join(root,'research',c.machineId,'research-data.json');
    const sp=path.join(root,'research',c.machineId,'selection-data.json');
    const research=read(rp), selection=read(sp);
    const rf=arr(research.features).find(x=>x.researchFeatureId===c.researchFeatureId);
    const sf=arr(selection.features).find(x=>x.researchFeatureId===c.researchFeatureId);
    if(!rf||!sf) throw new Error(`${key}: source feature missing during reviewed causal audit`);
    return {
      machineId:c.machineId,displayName:c.displayName,researchFeatureId:c.researchFeatureId,featureId:c.featureId??sf.featureId??null,
      name:c.name??rf.name,relation,secondaryRelation,action,rationale,
      trialUnit:rf.trialUnit??null,observationScope:rf.observationScope??null,
      numeratorDefinition:rf.numeratorDefinition??null,denominatorDefinition:rf.denominatorDefinition??null,
      candidateModel:rf.candidateModel??null,currentReason:c.reason??sf.rejectionReason??sf.userReason??sf.userFacingReason??null,
    };
  });
  const countBy=(field)=>rows.reduce((a,r)=>(a[r[field]??'NONE']=(a[r[field]??'NONE']||0)+1,a),{});
  const machines=[...new Set(rows.map(r=>r.machineId))];
  return {
    schemaVersion:'v6.4-causal-relation-review-v1',generatedAt:new Date().toISOString(),
    summary:{candidateCount:rows.length,machineCount:machines.length,relationCounts:countBy('relation'),actionCounts:countBy('action')},
    policyNote:'Causal wording is not itself a valid rejection criterion. Reopened candidates must be resolved through an explicit likelihood, composition, subset, Observation, or practical-information contract.',
    candidates:rows,
  };
}

function main(){
  const root=path.resolve(process.argv[2]??'.');
  const out=path.resolve(process.argv[3]??path.join(root,'reports','v64-causal-relation-review.json'));
  const report=auditCausalRelations(root);
  fs.mkdirSync(path.dirname(out),{recursive:true});
  fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
  console.log(`v6.4 Causal Relation Review: ${report.summary.candidateCount} candidates / ${report.summary.machineCount} machines`);
  console.log(JSON.stringify(report.summary,null,2));
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)) main();
