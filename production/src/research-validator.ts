import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type {Attempt,WorkResult} from './core.ts';
import {RepoStore} from './core.ts';

export const RESEARCH_VALIDATOR_CONTRACT='research-v1';

const nonEmpty=(x:any)=>typeof x==='string'&&x.trim().length>0;
const hex64=(x:any)=>typeof x==='string'&&/^[a-f0-9]{64}$/i.test(x);
const repoRelative=(p:string)=>p.startsWith('production/')?p.slice('production/'.length):p;
const sha256=(b:Buffer)=>crypto.createHash('sha256').update(b).digest('hex');
const norm=(x:any)=>String(x??'').normalize('NFKC').toLowerCase().replace(/[\s・･._&＆\-－\/／]/g,'');
const month=(x:any)=>String(x??'').slice(0,7);

function validateMachineIdentity(d:any){
  const mi=d.machineIdentity;
  if(!mi||!nonEmpty(mi.formalName)||!nonEmpty(mi.typeCode)||!nonEmpty(mi.manufacturer)||!nonEmpty(mi.introduced)||!nonEmpty(mi.generation)||!nonEmpty(mi.gameType)){
    throw new Error('RESEARCH_VALIDATION:MACHINE_IDENTITY_REQUIRED');
  }
  if(norm(mi.formalName)!==norm(d.machineName)) throw new Error('RESEARCH_VALIDATION:MACHINE_IDENTITY_NAME_MISMATCH');
  if(!Array.isArray(d.sources)||d.sources.length<2) throw new Error('RESEARCH_VALIDATION:MACHINE_IDENTITY_INDEPENDENT_SOURCES_REQUIRED');

  let matched=0;
  let strongMatched=0;
  for(const src of d.sources){
    const si=src.sourceMachineIdentity;
    if(!si||!nonEmpty(si.machineName)||si.matchStatus!=='MATCH') throw new Error('RESEARCH_VALIDATION:SOURCE_MACHINE_IDENTITY_REQUIRED');
    const sourceName=norm(si.machineName), targetName=norm(mi.formalName);
    const typeMatches=nonEmpty(si.typeCode)&&norm(si.typeCode)===norm(mi.typeCode);
    const nameMatches=sourceName===targetName||sourceName.includes(targetName)||targetName.includes(sourceName);
    if(!nameMatches&&!typeMatches) throw new Error('RESEARCH_VALIDATION:SOURCE_MACHINE_NAME_MISMATCH');
    if(nonEmpty(si.typeCode)&&!typeMatches) throw new Error('RESEARCH_VALIDATION:SOURCE_MACHINE_TYPE_MISMATCH');
    if(nonEmpty(si.manufacturer)&&norm(si.manufacturer)!==norm(mi.manufacturer)) throw new Error('RESEARCH_VALIDATION:SOURCE_MACHINE_MANUFACTURER_MISMATCH');
    if(nonEmpty(si.introduced)&&month(si.introduced)!==month(mi.introduced)) throw new Error('RESEARCH_VALIDATION:SOURCE_MACHINE_INTRODUCED_MISMATCH');
    if(nonEmpty(si.generation)&&norm(si.generation)!==norm(mi.generation)) throw new Error('RESEARCH_VALIDATION:SOURCE_MACHINE_GENERATION_MISMATCH');
    if(nonEmpty(si.gameType)&&norm(si.gameType)!==norm(mi.gameType)) throw new Error('RESEARCH_VALIDATION:SOURCE_MACHINE_GAME_TYPE_MISMATCH');
    matched++;
    if(typeMatches) strongMatched++;
  }
  if(matched<2||strongMatched<1) throw new Error('RESEARCH_VALIDATION:MACHINE_IDENTITY_NOT_SUFFICIENTLY_PROVEN');
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
  validateMachineIdentity(d);
  for(const src of d.sources){
    if(!nonEmpty(src.sourceId)||!nonEmpty(src.url)||!/^https?:\/\//.test(src.url)||!nonEmpty(src.title)||!nonEmpty(src.sourceType)||!Array.isArray(src.claims)||src.claims.length===0) throw new Error('RESEARCH_VALIDATION:SOURCE_PROVENANCE');
  }
  const sourceIds=new Set(d.sources.map((x:any)=>x.sourceId));
  for(const f of d.findings){
    if(!nonEmpty(f.findingId)||!nonEmpty(f.label)||!nonEmpty(f.observationType)||!Array.isArray(f.sourceIds)||f.sourceIds.length===0||f.sourceIds.some((x:any)=>!sourceIds.has(x))) throw new Error('RESEARCH_VALIDATION:FINDING_PROVENANCE');
    if(f.settingDistribution!==undefined){
      if(!f.settingDistribution||typeof f.settingDistribution!=='object'||Array.isArray(f.settingDistribution)||Object.keys(f.settingDistribution).length===0) throw new Error('RESEARCH_VALIDATION:RAW_DISTRIBUTION');
      for(const [k,v] of Object.entries(f.settingDistribution)) if(!/^([1-6])$/.test(k)||!(typeof v==='number'||nonEmpty(v))) throw new Error('RESEARCH_VALIDATION:RAW_DISTRIBUTION');
    }
    if(f.inferred===true) throw new Error('RESEARCH_VALIDATION:INFERRED_VALUE_FORBIDDEN');
    if(f.categorySemantics!==undefined){
      if(f.observationType!=='evidence'||!Array.isArray(f.categorySemantics)||!Array.isArray(f.details)||f.categorySemantics.length!==f.details.length) throw new Error('RESEARCH_VALIDATION:EVIDENCE_SEMANTIC_COVERAGE');
      for(let i=0;i<f.categorySemantics.length;i++){const c=f.categorySemantics[i];if(c?.label!==f.details[i]||!['EXACT_CONSTRAINT','PROBABILITY_BACKED','PROBABILITY_UNKNOWN','DISPLAY_ONLY','BLOCK'].includes(c?.semantic)) throw new Error('RESEARCH_VALIDATION:EVIDENCE_SEMANTIC');if(c.semantic==='EXACT_CONSTRAINT'&&!Array.isArray(c.confirmedSettings)&&!Array.isArray(c.deniedSettings)) throw new Error('RESEARCH_VALIDATION:EXACT_CONSTRAINT_PAYLOAD');}
    }
  }
  for(const b of d.blockedItems){
    if(!nonEmpty(b.blockId)||!nonEmpty(b.label)||!nonEmpty(b.reason)||!nonEmpty(b.reevaluationCondition)) throw new Error('RESEARCH_VALIDATION:BLOCK_REEVALUATION_REQUIRED');
  }
  return [{validator:RESEARCH_VALIDATOR_CONTRACT,ok:true,artifactPath:ref.path,sha256:ref.sha256,sources:d.sources.length,findings:d.findings.length,blockedItems:d.blockedItems.length,machineIdentity:{formalName:d.machineIdentity.formalName,typeCode:d.machineIdentity.typeCode,manufacturer:d.machineIdentity.manufacturer,introduced:d.machineIdentity.introduced}}];
}
