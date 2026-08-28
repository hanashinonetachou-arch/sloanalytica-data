#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const arr=v=>Array.isArray(v)?v:[];
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));

// Human-reviewed v6.4 semantic classifications.
// All candidates found in the original pass have now been resolved into explicit
// Selection contracts, structural compositions, Observation blockers, subset rules,
// or independent practical rejection reasons. A new candidate is therefore drift.
const REVIEWED = {};

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
