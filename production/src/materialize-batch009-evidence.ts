/**
 * Batch009: materialize reviewed evidence into separate RESEARCH STAGING files.
 * Does not modify research-working, approved research-drafts, runtime or distribution.
 * Use: cd production && node --experimental-strip-types src/materialize-batch009-evidence.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import {validateResearchLiveObservationContract,validateResearchUserFacingTextContract,validateResearchProbabilityRouteContract} from './research-validator.ts';
import {EVIDENCE_SEMANTIC_TYPES} from './evidence-semantics.ts';
const batch='batch-20261008-009';
const root=path.resolve('batches',batch);
const batchSpec=JSON.parse(fs.readFileSync(path.join(root,'batch.json'),'utf8'));
const selected=JSON.parse(fs.readFileSync(path.join(root,'selected-machines.json'),'utf8'));
const machineIds=batchSpec.waves.flatMap((w:any)=>w.machineIds);
if(machineIds.length!==10||JSON.stringify(machineIds)!==JSON.stringify(selected.machines.map((m:any)=>m.machineId)))throw new Error('SELECTION_MISMATCH');
for (const [index,machineId] of machineIds.entries()){
 const wave=index<5?'wave-1':'wave-2';
 const original=JSON.parse(fs.readFileSync(path.join(root,'research-working',wave,machineId+'.json'),'utf8'));
 const reviewed=JSON.parse(fs.readFileSync(path.join(root,'research-evidence-reviewed',machineId+'.json'),'utf8'));
 if(original.machineId!==machineId||reviewed.machineId!==machineId||original.batchId!==batch||reviewed.batchId!==batch)throw new Error('IDENTITY_MISMATCH:'+machineId);
 const d=structuredClone(original);
 const ledger=d.researchCompleteness?.candidateLedger;
 if(!Array.isArray(ledger))throw new Error('CANDIDATE_LEDGER_MISSING:'+machineId);
 const ids=new Set(d.findings.map((x:any)=>x.findingId));
 const srcUrls=new Set(d.sources.map((s:any)=>s.url));
 const importedSourceIds:string[]=[];
 for(const [i,url] of (reviewed.sources??reviewed.sourceUrls??[]).entries()){
  const sourceUrl=typeof url==='string'?url:url.url;
  if(!sourceUrl||!/^https?:\/\//.test(sourceUrl))throw new Error('INVALID_SOURCE_URL:'+machineId);
  let source=d.sources.find((s:any)=>s.url===sourceUrl);
  if(!source){ const id='evidence-source-'+(i+1);if(d.sources.some((s:any)=>s.sourceId===id))throw new Error('SOURCE_ID_CONFLICT');
    source={sourceId:id,url:sourceUrl,title:machineId+' 公開設定示唆解析',sourceType:'secondary_analysis',checkedAt:'2026-10-08',claims:[]};
    d.sources.push(source);srcUrls.add(sourceUrl);
  }
  importedSourceIds.push(source.sourceId);
 }
 let added=0;
 for(const ev of reviewed.evidenceCandidates??[]){
  if(!Array.isArray(ev.semanticCategories)||!ev.semanticCategories.length)throw new Error('MISSING_CATEGORY:'+machineId+':'+ev.findingId);
  const id='reviewed-'+ev.findingId;
  if(ids.has(id))throw new Error('FINDING_CONFLICT:'+machineId+':'+id);
  if(!importedSourceIds.length)throw new Error('MISSING_EVIDENCE_SOURCE:'+machineId);
  for(const c of ev.semanticCategories){
   if(!EVIDENCE_SEMANTIC_TYPES.includes(c.semanticType)||!c.label||!c.meaning)throw new Error('INVALID_SEMANTIC_CATEGORY:'+id);
  }
  // Optional per-candidate provenance: do not attach every page in the
  // machine-wide review to an unrelated screenshot, trophy, or voice.
  const scopedUrls=ev.sourceUrls;
  if(scopedUrls!==undefined && (!Array.isArray(scopedUrls)||!scopedUrls.length))
    throw new Error('INVALID_SCOPED_EVIDENCE_SOURCES:'+machineId+':'+id);
  const candidateSourceIds=scopedUrls===undefined?importedSourceIds:scopedUrls.map((url:any)=>{
    if(typeof url!=='string'||!url.startsWith('https://'))throw new Error('INVALID_EVIDENCE_SOURCE_URL:'+machineId+':'+id);
    const source=d.sources.find((s:any)=>s.url===url);
    if(!source||!importedSourceIds.includes(source.sourceId))throw new Error('UNREVIEWED_EVIDENCE_SOURCE:'+machineId+':'+id+':'+url);
    return source.sourceId;
  });
  const condition=ev.observationCondition||'観測の契機を確認して、該当した表示を1回記録します。';
  const finding={findingId:id,label:ev.label,observationType:'evidence',sourceIds:[...new Set(candidateSourceIds)],semanticCategories:ev.semanticCategories,details:[condition,ev.semanticCategories.some((x:any)=>x.semanticType==='PROBABILITY_BACKED')?'設定別の出現割合は公表されています。数値推測への反映は観測条件と二重計上防止の確認後に判断します。':'設定別の出現率が未公表の示唆は記録だけ行います。確定した条件のみ設定推測に反映します。']};
  validateResearchUserFacingTextContract(finding);
  validateResearchProbabilityRouteContract(finding);
  validateResearchLiveObservationContract(finding);
  if(reviewed.categoryRates?.categories?.length && reviewed.evidenceCandidates?.[0]?.findingId===ev.findingId){
    d.researchCompleteness.knownRateEvidenceRequiresNumericRouting=true;
  }
  d.findings.push(finding);ids.add(id);
  const sourceClaims:any[]=[];
  for(const sid of finding.sourceIds){ const s=d.sources.find((x:any)=>x.sourceId===sid);const claim=ev.label+'の演出内容と観測条件';if(!s.claims.includes(claim))s.claims.push(claim);sourceClaims.push({sourceId:sid,claim}); }
  ledger.push({candidateId:'finding:'+id,label:ev.label,sourceClaims,discoveryQueries:[],disposition:{type:'FINDING',refId:id}});
  added++;
 }
 // Preserve unresolved route provenance. Approval must occur in a later,
 // source-validated Research curation step; staging must not silently upgrade it.
 for(const row of ledger){
  if(row.disposition?.type==='FINDING_PENDING_SCOPE_VALIDATION')
   d.researchCompleteness.pendingRouteValidation=true;
 }
 // Keep evidence-free case explicit and unapproved unless a positive attestation exists.
 if(!added && !reviewed.noSettingEvidenceAttestation)
  d.researchCompleteness.evidenceGate='OPEN_NO_SETTING_EVIDENCE_ATTESTATION';
 d.researchStage='EVIDENCE_STAGED_NOT_APPROVED';
 d.researchCompleteness.status='INCOMPLETE';
 d.researchCompleteness.evidenceSourceReview={status:'STAGED',sourceFile:'research-evidence-reviewed/'+machineId+'.json',candidateCount:added,openChecks:reviewed.openChecks??reviewed.unresolved??[],...(Array.isArray(reviewed.completedReviewChecks)?{completedChecks:reviewed.completedReviewChecks}:{})};
 // Do not validate candidate ledger as approved: previous working files may lack
 // full source-claim and blocked item coverage. This stage is intentionally incomplete.
 const dest=path.join(root,'research-evidence-staged',wave,machineId+'.json');
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,JSON.stringify(d,null,2)+'\n');
 console.log(JSON.stringify({machineId,evidenceImported:added,stage:d.researchStage,output:dest}));
}
