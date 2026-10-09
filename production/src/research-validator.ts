import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type {Attempt,WorkResult} from './core.ts';
import {RepoStore} from './core.ts';
import {EVIDENCE_SEMANTIC_TYPES,classifyEvidenceCategory} from './evidence-semantics.ts';
import {buildDependencyReview} from './dependency-gate.ts';
import {categoricalEvidenceMirrorIssues} from './categorical-evidence-mirror.ts';

export const RESEARCH_VALIDATOR_CONTRACT='research-v1';
export const RESEARCH_COMPLETENESS_DOMAINS=["INITIAL_HIT","BONUS","SMALL_ROLE","CZ","AT","INTERNAL_CONDITIONAL_DRAW","MODE_TRANSITION","STATE_TRANSITION","SUCCESS_RATE","POINTS_GAME_DISTRIBUTION","CARRY_OVER","THRESHOLD_BEHAVIOR","RESET_BEHAVIOR","POST_EVENT_TRANSITION","NAVIGATION","ROLE_CONDITIONAL_DISTRIBUTION","BONUS_TYPE_CONDITIONAL","EVIDENCE","EXTERNAL_DATA_ONLY","MACHINE_SPECIFIC"] as const;
const researchCompletenessStatuses=new Set(['CHECKED','NOT_APPLICABLE']);
const abstractResearchLabels=[/^設定推測要素$/,/設定示唆演出.*設定別出現率/,/有利区間リセット後の恩恵/,/外部集計に依存する要素/];

const nonEmpty=(x:any)=>typeof x==='string'&&x.trim().length>0;
export const RESEARCH_LIVE_OBSERVATION_STATUSES=['DIRECT_EXACT','EXACT_WITH_SCOPE_TRACKING','EXHAUSTIVE_CATEGORICAL','RETROSPECTIVE_EXACT','UNRESOLVED'] as const;
const researchLiveObservationStatuses=new Set<string>(RESEARCH_LIVE_OBSERVATION_STATUSES);
export function validateResearchLiveObservationContract(f:any){
  if(f?.liveObservation===undefined)return;
  if(!researchLiveObservationStatuses.has(String(f.liveObservation?.status??''))||!nonEmpty(f.liveObservation?.reason)) throw new Error('RESEARCH_VALIDATION:LIVE_OBSERVATION_CONTRACT:'+String(f?.findingId??''));
}
const forbiddenUserFacingResearchText=/opportunity model|candidate contract|runtime policy|denominator|benchmark|Evidence\b|\\n|\/n/i;
export function validateResearchUserFacingTextContract(f:any){
  const values:any[]=[f?.label,f?.denominatorSemantics,f?.liveObservation?.reason,...(Array.isArray(f?.details)?f.details:[])];
  for(const c of Array.isArray(f?.semanticCategories)?f.semanticCategories:[]) values.push(c?.label,c?.meaning);
  for(const value of values) if(typeof value==='string'&&forbiddenUserFacingResearchText.test(value)) throw new Error('RESEARCH_VALIDATION:USER_FACING_INTERNAL_TEXT:'+String(f?.findingId??''));
}
export function validateResearchProbabilityRouteContract(f:any){
  if(f?.observationType==='evidence'&&f?.settingDistribution!==undefined) throw new Error('RESEARCH_VALIDATION:PROBABILITY_KNOWN_EVIDENCE_ONLY:'+String(f?.findingId??''));
}
const forbiddenBlockedImplementationText=/UI\s*Contract|数値入力Contract|UI契約|joint\b|categorical\b|candidate\s*contract|runtime\s*policy|dependency\s*model/i;
export function validateResearchBlockedUserFacingTextContract(b:any){
  const values=[b?.reason,b?.reevaluationCondition];
  for(const value of values) if(typeof value==='string'&&forbiddenBlockedImplementationText.test(value)) throw new Error('RESEARCH_VALIDATION:BLOCK_INTERNAL_IMPLEMENTATION_TEXT:'+String(b?.blockId??''));
}
const hex64=(x:any)=>typeof x==='string'&&/^[a-f0-9]{64}$/i.test(x);
const repoRelative=(p:string)=>p.startsWith('production/')?p.slice('production/'.length):p;
const sha256=(b:Buffer)=>crypto.createHash('sha256').update(b).digest('hex');

export function validateResearchCandidateLedger(d:any,sourceIds:Set<any>){
  for(const finding of d.findings??[]){
    const ids=finding.dependencyScopeAudit?.evidenceSourceIds;
    if(ids!==undefined&&(!Array.isArray(ids)||ids.length===0||ids.some((id:any)=>!sourceIds.has(id)||!finding.sourceIds?.includes(id))))
      throw new Error('RESEARCH_VALIDATION:DEPENDENCY_SCOPE_PROVENANCE:'+finding.findingId);
  }
  const completeness=d.researchCompleteness;
  const ledger=completeness?.candidateLedger;
  if(!Array.isArray(ledger)||ledger.length===0) throw new Error('RESEARCH_VALIDATION:CANDIDATE_LEDGER_REQUIRED');
  const sourceClaimKeys=new Set<string>();
  for(const src of d.sources??[]) for(const claim of src.claims??[]){
    if(!nonEmpty(claim)) throw new Error('RESEARCH_VALIDATION:SOURCE_CLAIM_INVALID:'+String(src?.sourceId??''));
    sourceClaimKeys.add(String(src.sourceId)+'\u0000'+String(claim));
  }
  const findingIds=new Set<string>((d.findings??[]).map((x:any)=>String(x.findingId)));
  const blockIds=new Set<string>((d.blockedItems??[]).map((x:any)=>String(x.blockId)));
  const querySet=new Set<string>((completeness.machineSpecificQueries??[]).map((x:any)=>String(x)));
  const coveredClaims=new Set<string>(),coveredQueries=new Set<string>(),coveredFindings=new Set<string>(),coveredBlocks=new Set<string>(),candidateIds=new Set<string>();
  for(const row of ledger){
    if(!nonEmpty(row?.candidateId)||candidateIds.has(row.candidateId)) throw new Error('RESEARCH_VALIDATION:CANDIDATE_LEDGER_ID');
    candidateIds.add(row.candidateId);
    if(!nonEmpty(row?.label)||!Array.isArray(row.sourceClaims)||!Array.isArray(row.discoveryQueries)||!row.disposition) throw new Error('RESEARCH_VALIDATION:CANDIDATE_LEDGER_ROW:'+row.candidateId);
    if(row.sourceClaims.length===0&&row.discoveryQueries.length===0) throw new Error('RESEARCH_VALIDATION:CANDIDATE_LEDGER_UNTRACED:'+row.candidateId);
    for(const sc of row.sourceClaims){
      if(!nonEmpty(sc?.sourceId)||!nonEmpty(sc?.claim)||!sourceIds.has(sc.sourceId)) throw new Error('RESEARCH_VALIDATION:CANDIDATE_LEDGER_SOURCE:'+row.candidateId);
      const key=String(sc.sourceId)+'\u0000'+String(sc.claim);
      if(!sourceClaimKeys.has(key)) throw new Error('RESEARCH_VALIDATION:CANDIDATE_LEDGER_CLAIM:'+row.candidateId);
      coveredClaims.add(key);
    }
    for(const q of row.discoveryQueries){
      if(!nonEmpty(q)||!querySet.has(q)) throw new Error('RESEARCH_VALIDATION:CANDIDATE_LEDGER_QUERY:'+row.candidateId);
      coveredQueries.add(q);
    }
    const disp=row.disposition;
    if(disp.type==='FINDING'||disp.type==='FINDING_PENDING_SCOPE_VALIDATION'){
      if(!nonEmpty(disp.refId)||!findingIds.has(disp.refId)) throw new Error('RESEARCH_VALIDATION:CANDIDATE_LEDGER_FINDING:'+row.candidateId);
      coveredFindings.add(disp.refId);
    }else if(disp.type==='BLOCKED'){
      if(!nonEmpty(disp.refId)||!blockIds.has(disp.refId)) throw new Error('RESEARCH_VALIDATION:CANDIDATE_LEDGER_BLOCK:'+row.candidateId);
      coveredBlocks.add(disp.refId);
    }else if(disp.type==='NO_SETTING_DIFFERENCE'){
      if(!nonEmpty(disp.reason)) throw new Error('RESEARCH_VALIDATION:CANDIDATE_LEDGER_NO_DIFF_REASON:'+row.candidateId);
    }else throw new Error('RESEARCH_VALIDATION:CANDIDATE_LEDGER_DISPOSITION:'+row.candidateId);
  }
  for(const key of sourceClaimKeys) if(!coveredClaims.has(key)) throw new Error('RESEARCH_VALIDATION:SOURCE_CLAIM_UNCOVERED:'+key.replace('\u0000',':'));
  for(const q of querySet) if(!coveredQueries.has(q)) throw new Error('RESEARCH_VALIDATION:QUERY_UNCOVERED:'+q);
  for(const id of findingIds) if(!coveredFindings.has(id)) throw new Error('RESEARCH_VALIDATION:FINDING_UNLEDGERED:'+id);
  for(const id of blockIds) if(!coveredBlocks.has(id)) throw new Error('RESEARCH_VALIDATION:BLOCK_UNLEDGERED:'+id);
  return {ledgerCandidates:ledger.length,coveredSourceClaims:coveredClaims.size,coveredQueries:coveredQueries.size};
}

export function validateResearchPromotionReadiness(d:any){
  if((d?.researchCompleteness?.candidateLedger??[]).some((row:any)=>row?.disposition?.type==='FINDING_PENDING_SCOPE_VALIDATION'))
    throw new Error('RESEARCH_VALIDATION:PENDING_SCOPE_PROMOTION_FORBIDDEN');
  // A recorded setting hint cannot also act as an independent categorical
  // likelihood for the very same observation without a proven UI/runtime link.
  for(const finding of d?.findings??[]){
    if(finding?.settingDistribution&&['probability','conditional_probability','appearance_distribution'].includes(finding.observationType)&&finding?.liveObservation?.status==='UNRESOLVED')
      throw new Error('RESEARCH_VALIDATION:UNRESOLVED_NUMERIC_OBSERVATION_PROMOTION_FORBIDDEN:'+String(finding.findingId));
  }
  for(const finding of d?.findings??[]){
    if(finding?.settingDistribution && String(finding?.dependencyScopeAudit?.status??'').startsWith('UNRESOLVED_'))
      throw new Error('RESEARCH_VALIDATION:UNRESOLVED_CAUSAL_DEPENDENCY_PROMOTION_FORBIDDEN:'+String(finding.findingId));
  }
  const categoricalIssues=categoricalEvidenceMirrorIssues(d);
  if(categoricalIssues.length)
    throw new Error('RESEARCH_VALIDATION:'+categoricalIssues[0]);
}

export function validateResearchArtifacts(s:RepoStore,a:Attempt,r:WorkResult){
  if(a.stage!=='RESEARCH'||r.status!=='SUCCESS') return [{validator:RESEARCH_VALIDATOR_CONTRACT,ok:true,skipped:a.stage!=='RESEARCH'}];
  if(r.producedArtifacts.length!==1) throw new Error('RESEARCH_VALIDATION:EXACTLY_ONE_ARTIFACT_REQUIRED');
  const ref=r.producedArtifacts[0];
  if(ref.kind!=='research'||ref.producerWorkId!==r.workId||!hex64(ref.sha256)) throw new Error('RESEARCH_VALIDATION:INVALID_ARTIFACT_REF');
  const file=s.p(repoRelative(String(ref.path||'')));
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()) throw new Error('RESEARCH_VALIDATION:ARTIFACT_MISSING');
  const bytes=fs.readFileSync(file);
  if(sha256(bytes)!==ref.sha256) throw new Error('RESEARCH_VALIDATION:SHA256_MISMATCH');
  let d:any; try{d=JSON.parse(bytes.toString('utf8'))}catch{throw new Error('RESEARCH_VALIDATION:INVALID_JSON')}
  if(d.schemaVersion!=='research-v1'||d.manifestVersion!=='8.5'||d.batchId!==a.batchId||d.machineId!==a.machineId||d.workId!==r.workId) throw new Error('RESEARCH_VALIDATION:IDENTITY_MISMATCH');
  if(!nonEmpty(d.machineName)||!Array.isArray(d.sources)||d.sources.length===0||!Array.isArray(d.findings)||!Array.isArray(d.blockedItems)) throw new Error('RESEARCH_VALIDATION:REQUIRED_FIELDS');
  for(const src of d.sources){
    if(!nonEmpty(src.sourceId)||!nonEmpty(src.url)||!/^https?:\/\//.test(src.url)||!nonEmpty(src.title)||!nonEmpty(src.sourceType)||!Array.isArray(src.claims)||src.claims.length===0) throw new Error('RESEARCH_VALIDATION:SOURCE_PROVENANCE');
  }
  const sourceIds=new Set(d.sources.map((x:any)=>x.sourceId));
  const completeness=d.researchCompleteness;
  if(!completeness||completeness.version!==2||!Array.isArray(completeness.domains)||!Array.isArray(completeness.machineSpecificQueries)||completeness.machineSpecificQueries.length<3||!Array.isArray(completeness.candidateLedger)||completeness.candidateLedger.length===0) throw new Error('RESEARCH_VALIDATION:COMPLETENESS_REQUIRED');
  const coverage=new Map<string,any>();
  for(const row of completeness.domains){
    if(!nonEmpty(row?.domain)||coverage.has(row.domain)) throw new Error('RESEARCH_VALIDATION:COMPLETENESS_DOMAIN_DUPLICATE');
    if(!researchCompletenessStatuses.has(row.status)||!nonEmpty(row.note)||!Array.isArray(row.sourceIds)) throw new Error('RESEARCH_VALIDATION:COMPLETENESS_DOMAIN_INVALID:'+row.domain);
    if(row.status==='CHECKED'&&(row.sourceIds.length===0||row.sourceIds.some((x:any)=>!sourceIds.has(x)))) throw new Error('RESEARCH_VALIDATION:COMPLETENESS_PROVENANCE:'+row.domain);
    coverage.set(row.domain,row);
  }
  for(const domain of RESEARCH_COMPLETENESS_DOMAINS) if(!coverage.has(domain)) throw new Error('RESEARCH_VALIDATION:COMPLETENESS_DOMAIN_MISSING:'+domain);
  for(const domain of coverage.keys()) if(!(RESEARCH_COMPLETENESS_DOMAINS as readonly string[]).includes(domain)) throw new Error('RESEARCH_VALIDATION:COMPLETENESS_DOMAIN_UNKNOWN:'+domain);
  if(completeness.machineSpecificQueries.some((x:any)=>!nonEmpty(x))) throw new Error('RESEARCH_VALIDATION:MACHINE_SPECIFIC_QUERY_INVALID');
  for(const f of d.findings){
    if(!nonEmpty(f.findingId)||!nonEmpty(f.label)||!nonEmpty(f.observationType)||!Array.isArray(f.sourceIds)||f.sourceIds.length===0||f.sourceIds.some((x:any)=>!sourceIds.has(x))) throw new Error('RESEARCH_VALIDATION:FINDING_PROVENANCE');
    validateResearchLiveObservationContract(f);
    validateResearchUserFacingTextContract(f);
    validateResearchProbabilityRouteContract(f);
    if(f.settingDistribution!==undefined){
      if(!f.settingDistribution||typeof f.settingDistribution!=='object'||Array.isArray(f.settingDistribution)||Object.keys(f.settingDistribution).length===0) throw new Error('RESEARCH_VALIDATION:RAW_DISTRIBUTION');
      for(const [k,v] of Object.entries(f.settingDistribution)) if(!/^([1-6])$/.test(k)||!(typeof v==='number'||nonEmpty(v))) throw new Error('RESEARCH_VALIDATION:RAW_DISTRIBUTION');
    }
    if(f.observationType==='evidence'&&Array.isArray(f.semanticCategories)){
      for(const category of f.semanticCategories){
        if(!nonEmpty(category?.label)||!EVIDENCE_SEMANTIC_TYPES.includes(category?.semanticType)) throw new Error('RESEARCH_VALIDATION:EVIDENCE_SEMANTIC_CATEGORY');
        if(category.meaning!==undefined&&!nonEmpty(category.meaning)) throw new Error('RESEARCH_VALIDATION:EVIDENCE_SEMANTIC_MEANING');
        if(category.semanticType==='EXACT_CONSTRAINT'&&classifyEvidenceCategory(category)!=='EXACT_CONSTRAINT') throw new Error('RESEARCH_VALIDATION:EVIDENCE_EXACT_MISMATCH:'+f.findingId+':'+category.label);
      }
    }
    if(f.settingDistribution===undefined&&f.observationType!=='evidence') throw new Error('RESEARCH_VALIDATION:UNROUTED_FINDING:'+f.findingId);
    if(f.inferred===true) throw new Error('RESEARCH_VALIDATION:INFERRED_VALUE_FORBIDDEN');
  }
  const dependencyAudit=buildDependencyReview(d.findings);
  for(const b of d.blockedItems){
    if(!nonEmpty(b.blockId)||!nonEmpty(b.label)||!nonEmpty(b.reason)||!nonEmpty(b.reevaluationCondition)) throw new Error('RESEARCH_VALIDATION:BLOCK_REEVALUATION_REQUIRED');
    if(abstractResearchLabels.some(re=>re.test(b.label))) throw new Error('RESEARCH_VALIDATION:ABSTRACT_BLOCK_LABEL:'+b.blockId);
    validateResearchBlockedUserFacingTextContract(b);
  }
  const ledgerValidation=validateResearchCandidateLedger(d,sourceIds);
  // Staging may trace a finding without being scientifically ready. A fully
  // committed Research artifact must not contain such provisional dispositions.
  validateResearchPromotionReadiness(d);
  return [{validator:RESEARCH_VALIDATOR_CONTRACT,ok:true,artifactPath:ref.path,sha256:ref.sha256,sources:d.sources.length,findings:d.findings.length,blockedItems:d.blockedItems.length,coverageDomains:coverage.size,dependencyCandidates:dependencyAudit.summary.candidateCount,dependencyGroups:dependencyAudit.summary.groupCount,...ledgerValidation}];
}
