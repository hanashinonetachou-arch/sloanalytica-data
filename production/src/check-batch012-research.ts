import fs from 'node:fs';
import {RESEARCH_COMPLETENESS_DOMAINS,validateResearchCandidateLedger,validateResearchPromotionReadiness,validateResearchLiveObservationContract,validateResearchUserFacingTextContract,validateResearchBlockedUserFacingTextContract} from './research-validator.ts';
const root='batches/batch-20261012-012';
const batch=JSON.parse(fs.readFileSync(root+'/batch.json','utf8'));
const output=[];
for(const wave of batch.waves)for(const machineId of wave.machineIds){
 const p=root+'/research-drafts/'+wave.waveId+'/'+machineId+'.json';
 const d=JSON.parse(fs.readFileSync(p,'utf8'));
 const missing=RESEARCH_COMPLETENESS_DOMAINS.filter(name=>!d.researchCompleteness.domains.some(row=>row.domain===name&&['CHECKED','NOT_APPLICABLE'].includes(row.status)));
 const errors=[];
 for(const f of d.findings){
  try{validateResearchLiveObservationContract(f);validateResearchUserFacingTextContract(f)}catch(e){errors.push(String(e))}
 }
 for(const b of d.blockedItems){try{validateResearchBlockedUserFacingTextContract(b)}catch(e){errors.push(String(e))}}
 try{validateResearchCandidateLedger(d,new Set(d.sources.map(s=>s.sourceId)))}catch(e){errors.push(String(e))}
 try{validateResearchPromotionReadiness(d)}catch(e){errors.push(String(e))}
 const unverified=d.findings.filter(f=>f.liveObservation?.status==='UNRESOLVED'||f.trialUniverse==='UNRESOLVED_PENDING_OBSERVATION_REVIEW').map(f=>f.findingId);
 output.push({machineId,waveId:wave.waveId,sourceCount:d.sources.length,findings:d.findings.length,evidence:d.findings.filter(f=>f.observationType==='evidence').length,blocked:d.blockedItems.length,missingDomains:missing,unverified,errors,canPromote:missing.length===0&&unverified.length===0&&errors.length===0});
}
console.log(JSON.stringify({batchId:batch.batchId,machines:output,canPromote:output.filter(x=>x.canPromote).length},null,2));
if(output.some(x=>!x.canPromote))process.exitCode=2;
