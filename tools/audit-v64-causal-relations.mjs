#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const arr=v=>Array.isArray(v)?v:[];
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));

// Human-reviewed v6.4 semantic classifications. This is intentionally explicit:
// relation type cannot be inferred safely from causal wording alone.
const REVIEWED = {
  'L_GIRLS_UND_PANZER_FINALE_H1/RF_CZ': ['CAUSALLY_RELATED_BUT_DISTINCT_OBSERVATION','REOPEN_SELECTION_DEPENDENCY_REVIEW','CZ occurrence and AT occurrence are distinct observations. Causal linkage alone is not a duplicate; assess dependence and practical information separately.'],
  'L_KING_PULSAR_SLCC/RF_CZ': ['CAUSALLY_RELATED_BUT_DISTINCT_OBSERVATION','REOPEN_SELECTION_DEPENDENCY_REVIEW','Orange occurrence and CZ occurrence are different observed events. Shared causal pathway does not by itself establish duplicate data.'],
  'L_ONE_PUNCH_MAN/RF_WEAK_CHERRY': ['CAUSALLY_RELATED_BUT_DISTINCT_OBSERVATION','REOPEN_AS_COMPOSITE_CANDIDATE','Weak cherry is distinct from AT occurrence; with watermelon it belongs in the existing mutually-exclusive small-role multinomial, not as an independent scalar.','MUTUALLY_EXCLUSIVE_COMPOSITION'],
  'L_ONE_PUNCH_MAN/RF_WATERMELON': ['CAUSALLY_RELATED_BUT_DISTINCT_OBSERVATION','REOPEN_AS_COMPOSITE_CANDIDATE','Watermelon is distinct from AT occurrence; with weak cherry it belongs in the existing mutually-exclusive small-role multinomial, not as an independent scalar.','MUTUALLY_EXCLUSIVE_COMPOSITION'],
  'L_SHINOBIDAMASHII3_A3/RF_CZ': ['CAUSALLY_RELATED_BUT_DISTINCT_OBSERVATION','REOPEN_SELECTION_DEPENDENCY_REVIEW','CZ and AT initial hits are different observations. Small setting difference may still justify exclusion, but causal overlap alone does not.'],

  // Accelerator's original 10 causal candidates have now been resolved in two v6.4 passes:
  // 4 CZ-component candidates were factorized into aggregate CZ hit rate + conditional CZ-type composition;
  // the remaining 6 exclusions now state their actual blockers (opportunity Observation or likelihood contract)
  // instead of using causal relation itself as the rejection reason.
  // Fire Force RF_CROSS_BONUS is also resolved: it remains excluded because the
  // path-specific joint/conditional likelihood contract is not implemented, not because
  // causal relation itself is considered duplicate evidence.

  'S_KABANERI_ZR/RF_ST': ['CAUSALLY_RELATED_BUT_DISTINCT_OBSERVATION','REOPEN_SELECTION_DEPENDENCY_REVIEW','ST occurrence is downstream of bonus progression but is not the same natural observation as bonus initial hit.'],

  'S_MHW_ICEBORNE_ZF/RF_AT_INITIAL': ['CAUSALLY_RELATED_BUT_DISTINCT_OBSERVATION','REOPEN_SELECTION_DEPENDENCY_REVIEW','AT initial hit is distinct from CZ entry; assess path dependence rather than treating all upstream/downstream events as duplicates.'],
  'S_MHW_ICEBORNE_ZF/RF_CZ_QUEST': ['MUTUALLY_EXCLUSIVE_COMPOSITION','KEEP_COMPONENT_EXCLUDED_PREFER_COMPOSITION','Quest is one CZ type under the same normal-game trial universe as aggregate CZ.'],
  'S_MHW_ICEBORNE_ZF/RF_CZ_AIROU': ['MUTUALLY_EXCLUSIVE_COMPOSITION','KEEP_COMPONENT_EXCLUDED_PREFER_COMPOSITION','Airou BINGO is one CZ type under the same normal-game trial universe as aggregate CZ.'],
  'S_MHW_ICEBORNE_ZF/RF_CZ_SELIANA': ['MUTUALLY_EXCLUSIVE_COMPOSITION','KEEP_COMPONENT_EXCLUDED_PREFER_COMPOSITION','Seliana defense is one CZ type under the same normal-game trial universe as aggregate CZ.'],
  'S_MHW_ICEBORNE_ZF/RF_HIGH_FALL': ['CAUSALLY_RELATED_BUT_DISTINCT_OBSERVATION','REOPEN_SELECTION_DEPENDENCY_REVIEW','High-state fall is a state-transition observation, not a CZ occurrence.'],
  'S_MHW_ICEBORNE_ZF/RF_NORMAL_WEAK_CZ': ['CONDITIONAL_COMPOSITION','KEEP_EXCLUDED_PENDING_JOINT_MODEL','CZ outcome conditional on normal-state weak rare-role opportunities; aggregate CZ already contains resulting CZ events.'],
  'S_MHW_ICEBORNE_ZF/RF_NORMAL_STRONG_CZ': ['CONDITIONAL_COMPOSITION','KEEP_EXCLUDED_PENDING_JOINT_MODEL','CZ outcome conditional on normal-state strong rare-role opportunities; aggregate CZ already contains resulting CZ events.'],
  'S_MHW_ICEBORNE_ZF/RF_HIGH_WEAK_CZ': ['CONDITIONAL_COMPOSITION','KEEP_EXCLUDED_PENDING_JOINT_MODEL','CZ outcome conditional on high-state weak rare-role opportunities; aggregate CZ already contains resulting CZ events.'],
  'S_MHW_ICEBORNE_ZF/RF_HIGH_STRONG_CZ': ['CONDITIONAL_COMPOSITION','KEEP_EXCLUDED_PENDING_JOINT_MODEL','CZ outcome conditional on high-state strong rare-role opportunities; aggregate CZ already contains resulting CZ events.'],
  'S_MHW_ICEBORNE_ZF/RF_AT_DIRECT': ['CAUSALLY_RELATED_BUT_DISTINCT_OBSERVATION','REOPEN_SELECTION_DEPENDENCY_REVIEW','Direct AT is not a CZ occurrence. It is also a subset/pathway of AT initial hits, so any adoption must model that secondary relation explicitly.','SUBSET_OF_AT_INITIAL'],
  'S_MHW_ICEBORNE_ZF/RF_LONG_FREEZE': ['CAUSALLY_RELATED_BUT_DISTINCT_OBSERVATION','REVIEW_OTHER_REJECTION_REASON','Long freeze is a distinct rare event; causal overlap with CZ is not sufficient rejection, but extreme rarity may independently justify exclusion.'],
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
    policyNote:'CAUSALLY_RELATED_BUT_DISTINCT_OBSERVATION does not imply independent likelihoods. Reopen dependency analysis before adoption; conditional or joint modeling may still be required.',
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
