/** Batch009 non-destructive research promotion gate. Run from production/. */
import fs from 'node:fs';
import path from 'node:path';
import {categoricalEvidenceMirrorIssues} from './categorical-evidence-mirror.ts';
import {validateCategoryRates} from './batch009-rate-matrix.ts';
import {auditBatch009Staging} from './batch009-staging-integrity.ts';
import {RESEARCH_COMPLETENESS_DOMAINS,validateResearchCandidateLedger,validateResearchLiveObservationContract,validateResearchUserFacingTextContract,validateResearchProbabilityRouteContract,validateResearchPromotionReadiness} from './research-validator.ts';
const batch='batch-20261008-009';
const root=path.resolve('batches',batch);
const selected=JSON.parse(fs.readFileSync(path.join(root,'selected-machines.json'),'utf8'));
const spec=JSON.parse(fs.readFileSync(path.join(root,'batch.json'),'utf8'));
const machines=spec.waves.flatMap((w:any)=>w.machineIds);
if(machines.length!==10||new Set(machines).size!==10||JSON.stringify(machines)!==JSON.stringify(selected.machines.map((m:any)=>m.machineId)))throw new Error('BATCH009_SELECTION_MISMATCH');
let blocked=0;
for(const [index,machineId] of machines.entries()){
 const wave=index<5?'wave-1':'wave-2';
 const work=JSON.parse(fs.readFileSync(path.join(root,'research-evidence-staged',wave,machineId+'.json'),'utf8'));
 const ev=JSON.parse(fs.readFileSync(path.join(root,'research-evidence-reviewed',machineId+'.json'),'utf8'));
 const original=JSON.parse(fs.readFileSync(path.join(root,'research-working',wave,machineId+'.json'),'utf8'));
 const errors:string[]=[];
 // Verify the unapproved staging snapshot against working source material.
 // Once source review is formally complete, changed eligibility/observation
 // decisions must be judged by promotion validators, not frozen stage equality.
 if(work.researchStage==='EVIDENCE_STAGED_NOT_APPROVED')
  for(const issue of auditBatch009Staging(original,ev,work))errors.push(issue);
 if(work.machineId!==machineId||ev.machineId!==machineId||work.batchId!==batch)errors.push('IDENTITY_MISMATCH');
 if(work.researchStage!=='SOURCE_REVIEWED_COMPLETE'||work.researchCompleteness?.status!=='COMPLETE')errors.push('RESEARCH_NOT_APPROVED');
 const present=new Map((work.researchCompleteness?.domains||[]).map((d:any)=>[d.domain,d]));
 for(const domain of RESEARCH_COMPLETENESS_DOMAINS){
  const d:any=present.get(domain);
  if(!d||!['CHECKED','NOT_APPLICABLE'].includes(d.status)||!d.note||(d.status==='CHECKED'&&!d.sourceIds?.length))errors.push('DOMAIN_'+domain);
 }
 if((work.researchCompleteness?.machineSpecificQueries?.length??0)<3)errors.push('MACHINE_SPECIFIC_QUERIES');
 for(const finding of work.findings){
  try{validateResearchLiveObservationContract(finding);validateResearchUserFacingTextContract(finding);validateResearchProbabilityRouteContract(finding)}catch(e){errors.push(String(e))}
  if(finding.liveObservation?.status==='UNRESOLVED'||finding.liveObservation?.status==='REQUIRES_FINAL_SCOPE_VALIDATION')errors.push('UNRESOLVED_OBSERVATION_'+finding.findingId);
 }
 try{validateResearchCandidateLedger(work,new Set(work.sources.map((s:any)=>s.sourceId)))}catch(e){errors.push(String(e))}
 try{validateResearchPromotionReadiness(work)}catch(e){errors.push(String(e))}
 if((ev.openChecks||ev.unresolved||[]).length)errors.push('EVIDENCE_REVIEW_OPEN');
 const evidence=work.findings.filter((f:any)=>f.observationType==='evidence');
 const findingIds=work.findings.map((f:any)=>String(f.findingId));
 if(new Set(findingIds).size!==findingIds.length)errors.push('DUPLICATE_FINDING_ID');
 const sourceIds=new Set(work.sources.map((s:any)=>String(s.sourceId)));
 for(const f of work.findings){
  if(!Array.isArray(f.sourceIds)||!f.sourceIds.length||f.sourceIds.some((id:any)=>!sourceIds.has(String(id))))errors.push('MISSING_FINDING_SOURCE_'+f.findingId);
  if(f.observationType==='evidence' && (!Array.isArray(f.semanticCategories)||!f.semanticCategories.length))errors.push('EMPTY_EVIDENCE_CATEGORIES_'+f.findingId);
 }
 for(const expected of ev.evidenceCandidates||[]){
  const f=evidence.find((x:any)=>x.findingId==='reviewed-'+expected.findingId);
  if(!f)continue;
  if(JSON.stringify(f.semanticCategories)!==JSON.stringify(expected.semanticCategories))errors.push('EVIDENCE_CATEGORY_MISMATCH_'+expected.findingId);
  if(Array.isArray(expected.sourceUrls)){
   const actualUrls=(f.sourceIds??[]).map((id:string)=>work.sources.find((s:any)=>s.sourceId===id)?.url).sort();
   const expectedUrls=[...new Set<string>(expected.sourceUrls)].sort();
   if(JSON.stringify(actualUrls)!==JSON.stringify(expectedUrls))errors.push('EVIDENCE_SOURCE_SCOPE_MISMATCH_'+expected.findingId);
  }
 }
 if(ev.categoryRates){
  for(const err of validateCategoryRates(ev.categoryRates))errors.push(err);
 }
 if((ev.categoryRates?.percentRows?.length??0)>0){
  const expectedName=ev.evidenceCandidates?.[0]?.findingId;
  const mirrorId='reviewed-'+expectedName;
  const mirrored=evidence.find((x:any)=>x.findingId===mirrorId);
  const numeric=work.findings.find((x:any)=>x.mirrorsEvidenceFindingId===mirrorId&&x.observationType==='appearance_distribution');
  if(!numeric)errors.push('KNOWN_CATEGORY_RATES_MISSING_NUMERIC_ROUTE_'+expectedName);
  else{
    for(const [i,setting] of ev.categoryRates.settings.entries()){
      const expected=ev.categoryRates.categories.map((c:string,j:number)=>c+':'+ev.categoryRates.percentRows[i][j].toFixed(1)+'%').join('/');
      if(numeric.settingDistribution?.[setting]!==expected)errors.push('KNOWN_CATEGORY_RATE_DRIFT_'+expectedName+'_'+setting);
    }
    if(mirrored && categoricalEvidenceMirrorIssues(work).some(x=>x==='MIRRORED_CATEGORICAL_EVIDENCE_NOT_RECONCILED:'+numeric.findingId))errors.push('KNOWN_CATEGORY_RATES_EVIDENCE_NUMERIC_DEDUP_PENDING_'+expectedName);
  }
 }
 if(work.researchCompleteness?.evidenceSourceReview?.status==='STAGED_NOT_APPROVED')errors.push('EVIDENCE_NOT_APPROVED');
 if((ev.evidenceCandidates||[]).length && (ev.evidenceCandidates||[]).some((x:any)=>!evidence.some((f:any)=>f.findingId==='reviewed-'+x.findingId)))errors.push('EVIDENCE_NOT_MERGED');
 if(!evidence.length&&!ev.noSettingEvidenceAttestation)errors.push('NO_EVIDENCE_ATTESTATION');
 if(machineId==='S_BOOWY_SV'&&work.settings.values.includes('SET_L'))errors.push('BOOWY_SETTING_L_INCLUDED');
 if(errors.length)blocked++;
 console.log(JSON.stringify({machineId,status:errors.length?'BLOCKED':'READY_FOR_CANONICAL_RESEARCH',errors}));
}
console.log(JSON.stringify({batch,machines:machines.length,blocked,ready:machines.length-blocked}));
if(blocked)process.exitCode=1;
