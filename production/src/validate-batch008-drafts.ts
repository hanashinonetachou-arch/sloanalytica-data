import fs from 'node:fs';
import {buildEvaluation} from './evaluation-builder.ts';
import {buildEligibility} from './eligibility-builder.ts';
import {buildCandidateContract} from './candidate-contract-builder.ts';
import {buildObservationEvidence} from './observation-evidence-builder.ts';
import {buildCanonicalUi} from './canonical-ui-builder.ts';
import {validateCanonicalUiDocument} from './canonical-ui-validator.ts';
import {validateResearchCandidateLedger,validateResearchLiveObservationContract,validateResearchUserFacingTextContract,validateResearchProbabilityRouteContract} from './research-validator.ts';
const batch='batch-20261007-008';
const spec=JSON.parse(fs.readFileSync(`batches/${batch}/batch.json`,'utf8'));
const ca={path:'candidate'},oa={path:'observation'},ea={path:'evaluation'};
for(const wave of spec.waves)for(const mid of wave.machineIds){
 const r=JSON.parse(fs.readFileSync(`batches/${batch}/research-drafts/${wave.waveId}/${mid}.json`,'utf8'));
 validateResearchCandidateLedger(r,new Set(r.sources.map((s:any)=>s.sourceId)));
 for(const f of r.findings){validateResearchLiveObservationContract(f);validateResearchUserFacingTextContract(f);validateResearchProbabilityRouteContract(f)}
 const e=buildEvaluation(r),el=buildEligibility(e),c=buildCandidateContract(e,el,ea,{path:'eligibility'}),o=buildObservationEvidence(c,r,ca),u=buildCanonicalUi(c,o,e,ca,oa,ea);
 validateCanonicalUiDocument(u,c,o,e,ca,oa,ea);
 console.log(JSON.stringify({machineId:mid,numeric:u.numericSections.map((x:any)=>({id:x.sourceFindingId,inputs:x.inputs.map((y:any)=>y.label),score:x.score})),evidence:u.evidenceSections.length}));
}
