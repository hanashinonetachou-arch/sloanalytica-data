import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const REVIEW='reports/m7-phase2-2-single-discrete-evidence-review-20260916.json';
const OUT='reports/m7-phase2-2-safe-observation-construction-batch1-20260917.json';
const TARGETS=[
 ['L_ANOTHER_RINO_HEAVEN_CC','RINO_TROPHY'],
 ['L_BIOHAZARD_VILLAGE_XA','TROPHY'],
 ['L_GEN_CHOMUGEN_PH','TROPHY'],
];
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const review=read(REVIEW);
const rows=TARGETS.map(([machineId,groupId])=>{
 const reviewed=review.groups.find(g=>g.machineId===machineId&&g.groupId===groupId);
 if(!reviewed||reviewed.semanticClassification!=='SAFE_CONSTRUCTION_CANDIDATE') throw new Error(`${machineId}/${groupId}: not SAFE in authoritative review`);
 const obs=read(`research/${machineId}/machine-observation-data.json`);
 const visual=(obs.observations||[]).filter(o=>o.sourceType==='END_EVENT'&&o.observationMode==='VISUAL_EVENT'&&o.status==='FOUND');
 const exactId=`OBS_EVI_${groupId.replace(/[^A-Z0-9_]/gi,'_').toUpperCase()}`;
 return {machineId,groupId,selectedSourceEvidenceIds:reviewed.selectedSourceEvidenceIds,currentEndEventVisualObservations:visual.map(o=>({observationId:o.observationId,label:o.label,categories:o.categories||[],timing:o.timing||[],excludedConditions:o.excludedConditions||[]})),proposedFormalObservationId:exactId,constructionDecision:visual.length===1?'FORMALIZE_EXISTING_SINGLE_END_EVENT_OBSERVATION':'HUMAN_REVIEW_REQUIRED',proposedMutation:visual.length===1?{replaceObservationId:visual[0].observationId,withObservationId:exactId,addGroupId:groupId,addSourceEvidenceIds:reviewed.selectedSourceEvidenceIds}:null,formalProofEstablished:false,productionMutationPerformed:false};
});
const report={schemaVersion:'m7-phase2.2-safe-observation-construction-batch1-v1',auditDate:'2026-09-17',policy:{scope:'Construction plan only. No production mutation.',formalProof:'Remains false until the planned Observation lineage is separately applied and validated.',labelCategoryRule:'Labels/categories/names/appearance are not used as formal proof.',realDevice:'No real-device verification is claimed.'},summary:{targetGroupCount:rows.length,formalizeExistingCount:rows.filter(r=>r.constructionDecision==='FORMALIZE_EXISTING_SINGLE_END_EVENT_OBSERVATION').length,humanReviewCount:rows.filter(r=>r.constructionDecision==='HUMAN_REVIEW_REQUIRED').length,formalProofEstablishedCount:0},groups:rows};
fs.writeFileSync(path.join(ROOT,OUT),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.summary,null,2));
