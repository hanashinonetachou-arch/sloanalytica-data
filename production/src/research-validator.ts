import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type {Attempt,WorkResult} from './core.ts';
import {RepoStore} from './core.ts';
import {EVIDENCE_SEMANTIC_TYPES,classifyEvidenceLabel} from './evidence-semantics.ts';

export const RESEARCH_VALIDATOR_CONTRACT='research-v1';
export const RESEARCH_COMPLETENESS_DOMAINS=["INITIAL_HIT","BONUS","SMALL_ROLE","CZ","AT","INTERNAL_CONDITIONAL_DRAW","MODE_TRANSITION","STATE_TRANSITION","SUCCESS_RATE","POINTS_GAME_DISTRIBUTION","CARRY_OVER","THRESHOLD_BEHAVIOR","RESET_BEHAVIOR","POST_EVENT_TRANSITION","NAVIGATION","ROLE_CONDITIONAL_DISTRIBUTION","BONUS_TYPE_CONDITIONAL","EVIDENCE","EXTERNAL_DATA_ONLY","MACHINE_SPECIFIC"] as const;
const researchCompletenessStatuses=new Set(['CHECKED','NOT_APPLICABLE']);
const abstractResearchLabels=[/^設定推測要素$/,/設定示唆演出.*設定別出現率/,/有利区間リセット後の恩恵/,/外部集計に依存する要素/];

const nonEmpty=(x:any)=>typeof x==='string'&&x.trim().length>0;
const hex64=(x:any)=>typeof x==='string'&&/^[a-f0-9]{64}$/i.test(x);
const repoRelative=(p:string)=>p.startsWith('production/')?p.slice('production/'.length):p;
const sha256=(b:Buffer)=>crypto.createHash('sha256').update(b).digest('hex');

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
  if(!completeness||completeness.version!==1||!Array.isArray(completeness.domains)||!Array.isArray(completeness.machineSpecificQueries)||completeness.machineSpecificQueries.length<3) throw new Error('RESEARCH_VALIDATION:COMPLETENESS_REQUIRED');
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
    if(f.settingDistribution!==undefined){
      if(!f.settingDistribution||typeof f.settingDistribution!=='object'||Array.isArray(f.settingDistribution)||Object.keys(f.settingDistribution).length===0) throw new Error('RESEARCH_VALIDATION:RAW_DISTRIBUTION');
      for(const [k,v] of Object.entries(f.settingDistribution)) if(!/^([1-6])$/.test(k)||!(typeof v==='number'||nonEmpty(v))) throw new Error('RESEARCH_VALIDATION:RAW_DISTRIBUTION');
    }
    if(f.observationType==='evidence'&&Array.isArray(f.semanticCategories)){
      for(const category of f.semanticCategories){
        if(!nonEmpty(category?.label)||!EVIDENCE_SEMANTIC_TYPES.includes(category?.semanticType)) throw new Error('RESEARCH_VALIDATION:EVIDENCE_SEMANTIC_CATEGORY');
        if(category.meaning!==undefined&&!nonEmpty(category.meaning)) throw new Error('RESEARCH_VALIDATION:EVIDENCE_SEMANTIC_MEANING');
        const semanticText=[category.label,category.meaning].filter(nonEmpty).join('：');
        if(category.semanticType==='EXACT_CONSTRAINT'&&classifyEvidenceLabel(semanticText)!=='EXACT_CONSTRAINT') throw new Error('RESEARCH_VALIDATION:EVIDENCE_EXACT_MISMATCH:'+f.findingId+':'+category.label);
      }
    }
    if(f.settingDistribution===undefined&&f.observationType!=='evidence') throw new Error('RESEARCH_VALIDATION:UNROUTED_FINDING:'+f.findingId);
    if(f.inferred===true) throw new Error('RESEARCH_VALIDATION:INFERRED_VALUE_FORBIDDEN');
  }
  for(const b of d.blockedItems){
    if(!nonEmpty(b.blockId)||!nonEmpty(b.label)||!nonEmpty(b.reason)||!nonEmpty(b.reevaluationCondition)) throw new Error('RESEARCH_VALIDATION:BLOCK_REEVALUATION_REQUIRED');
    if(abstractResearchLabels.some(re=>re.test(b.label))) throw new Error('RESEARCH_VALIDATION:ABSTRACT_BLOCK_LABEL:'+b.blockId);
  }
  return [{validator:RESEARCH_VALIDATOR_CONTRACT,ok:true,artifactPath:ref.path,sha256:ref.sha256,sources:d.sources.length,findings:d.findings.length,blockedItems:d.blockedItems.length,coverageDomains:coverage.size}];
}
