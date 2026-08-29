import fs from 'node:fs';
import path from 'node:path';
import {buildMachineData} from './build-machine-data.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const exists=p=>fs.existsSync(p);
const stable=x=>JSON.stringify(x??null);
const featureKeys=['modelType','numeratorInputId','denominatorInputId','trialCountInputId','inputTransform','denominatorInputIds','categoryInputIds','optionalCategoryInputIds','suppressedByFeatureIds','categorySubtractInputIds','conditionedOnInputId','categoryProbabilities','probabilities','categoryConditioning','denominatorAdjustments'];
const pick=(o,ks)=>{const x=Object.fromEntries(ks.filter(k=>o?.[k]!==undefined).map(k=>[k,o[k]])); x.weight=o?.reliabilityProfile?.weight??o?.weight??1; if(x.probabilities&&Object.keys(x.probabilities).length===0) delete x.probabilities; return x;};

// Intentional post-migration safety changes. Keep this list narrow: only a published
// active Feature whose Observation source was later proven unverified may be removed.
// Re-adopt the Feature (and remove this exception) after machine-specific verification.
const REVIEWED_ACTIVE_FEATURE_REMOVALS={
  S_ULTRA_MIRACLE_JUGGLER_KT:{featureIds:['FEAT_PREDECESSOR_BONUS_OUTCOME'],reason:'機種固有の着席時ゲーム数・BIG・REGの観測元が実機未確認のため、確認完了まで前任者Featureを推測不参加とした。'},
  S_NEO_IM_JUGGLER_EX_KK:{featureIds:['FEAT_PREDECESSOR_BONUS_OUTCOME'],reason:'機種固有の着席時ゲーム数・BIG・REGの観測元が実機未確認のため、確認完了まで前任者Featureを推測不参加とした。'},
  LB_CREA_BONUS_TRIGGER_A2:{featureIds:['FEAT_PREDECESSOR_BONUS_OUTCOME'],reason:'機種固有の着席時総ゲーム数・BIG・REGの観測元が実機未確認のため、確認完了まで前任者Featureを推測不参加とした。'},
  LB_MAGICAL_HALLOWEEN_GS:{featureIds:['FEAT_PREDECESSOR_BONUS_OUTCOME'],reason:'機種固有の着席時ゲーム数・BIG・REGの観測元が実機未確認のため、確認完了まで前任者Featureを推測不参加とした。'}
};

function reviewActiveSetDiff(machineId,diff){
 const policy=REVIEWED_ACTIVE_FEATURE_REMOVALS[machineId];
 if(!policy||diff.type!=='ACTIVE_FEATURE_SET_DIFF') return null;
 const published=new Set(diff.published??[]),generated=new Set(diff.generated??[]);
 const removed=[...published].filter(id=>!generated.has(id)).sort();
 const added=[...generated].filter(id=>!published.has(id)).sort();
 const expected=[...policy.featureIds].sort();
 if(added.length||stable(removed)!==stable(expected)) return null;
 return {...diff,reviewStatus:'APPROVED_SAFETY_REMOVAL',reason:policy.reason};
}

export function auditSelectionPolicyMigration(root){
 const reports=[]; const rr=path.join(root,'research');
 for(const de of fs.readdirSync(rr,{withFileTypes:true}).filter(x=>x.isDirectory()&&!x.name.startsWith('_'))){
  const mid=de.name, rp=path.join(rr,mid,'research-data.json'),sp=path.join(rr,mid,'selection-data.json'),mp=path.join(root,'machines',mid,'machine-package.json');
  if(!exists(rp)||!exists(sp)||!exists(mp)) continue;
  const research=read(rp),selection=read(sp),published=read(mp); const statp=path.join(rr,mid,'statistics-report.json');
  let generated,error=null; try{generated=buildMachineData(research,selection,exists(statp)?read(statp):null);}catch(e){error=e?.message??String(e);}
  const diffs=[],reviewedDiffs=[];
  if(generated){
   const P=new Map((published.features?.features??[]).map(f=>[f.featureId,f]));
   const G=new Map((generated.features?.features??[]).map(f=>[f.featureId,f]));
   const selectedIds=new Set((selection.features??[]).filter(f=>['INCLUDE_PRIMARY','INCLUDE_SUPPORT'].includes(f.adoptionCategory)).map(f=>f.featureId));
   for(const id of selectedIds){
    if(!P.has(id)||!G.has(id)){diffs.push({type:'FEATURE_MISSING',featureId:id,published:P.has(id),generated:G.has(id)});continue;}
    const a=pick(P.get(id),featureKeys),b=pick(G.get(id),featureKeys); if(stable(a)!==stable(b)) diffs.push({type:'FEATURE_CONTRACT_DIFF',featureId:id,published:a,generated:b});
   }
   const pubActive=[...P.values()].filter(f=>f.calculationRole!=='DISPLAY_ONLY'&&f.adoptionCategory!=='DISPLAY_ONLY').map(f=>f.featureId).sort();
   const genActive=[...G.values()].filter(f=>f.calculationRole!=='DISPLAY_ONLY'&&f.adoptionCategory!=='DISPLAY_ONLY').map(f=>f.featureId).sort();
   if(stable(pubActive)!==stable(genActive)){
    const d={type:'ACTIVE_FEATURE_SET_DIFF',published:pubActive,generated:genActive};
    const reviewed=reviewActiveSetDiff(mid,d); if(reviewed) reviewedDiffs.push(reviewed); else diffs.push(d);
   }
   const pe=(published.evidence?.evidences??[]).map(e=>({id:e.id,inputId:e.inputId,confirmedSettings:e.confirmedSettings??[],deniedSettings:e.deniedSettings??[]})).sort((a,b)=>a.id.localeCompare(b.id));
   const ge=(generated.evidence?.evidences??[]).map(e=>({id:e.id,inputId:e.inputId,confirmedSettings:e.confirmedSettings??[],deniedSettings:e.deniedSettings??[]})).sort((a,b)=>a.id.localeCompare(b.id));
   if(stable(pe)!==stable(ge)) diffs.push({type:'EVIDENCE_CONTRACT_DIFF',published:pe,generated:ge});
  }
  reports.push({machineId:mid,status:error?'BLOCKED':diffs.length?'REVIEW':'PASS',error,diffs,reviewedDiffs});
 }
 return {schemaVersion:'selection-policy-migration-audit-v1.1',summary:{pass:reports.filter(x=>x.status==='PASS').length,review:reports.filter(x=>x.status==='REVIEW').length,blocked:reports.filter(x=>x.status==='BLOCKED').length,reviewedSafetyChanges:reports.reduce((n,x)=>n+(x.reviewedDiffs?.length??0),0)},machines:reports};
}
if(import.meta.url===`file://${process.argv[1]}`){const root=path.resolve(process.argv[2]??'.'),r=auditSelectionPolicyMigration(root),out=process.argv[3]??path.join(root,'reports','selection-policy-migration-audit.json');fs.writeFileSync(out,JSON.stringify(r,null,2)+'\n');console.log(`Selection Policy Migration: PASS ${r.summary.pass} / REVIEW ${r.summary.review} / BLOCKED ${r.summary.blocked} / REVIEWED_SAFETY ${r.summary.reviewedSafetyChanges}`);for(const m of r.machines.filter(x=>x.status!=='PASS'))console.log(m.machineId,m.status,m.error??m.diffs.map(d=>d.type+':'+(d.featureId??'')).join(','));}
