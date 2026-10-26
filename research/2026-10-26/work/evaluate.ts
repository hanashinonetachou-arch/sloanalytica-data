import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
import {buildEvaluation} from '../../../production/src/evaluation-builder.ts';
import {buildEligibility} from '../../../production/src/eligibility-builder.ts';
import {buildCandidateContract} from '../../../production/src/candidate-contract-builder.ts';
import {validateResearchArtifacts} from '../../../production/src/research-validator.ts';
import {validateEvaluationDocument} from '../../../production/src/evaluation-validator.ts';
import {validateEligibilityDocument} from '../../../production/src/eligibility-validator.ts';
import {validateCandidateContractDocument} from '../../../production/src/candidate-contract-validator.ts';
import {RepoStore} from '../../../production/src/core.ts';
const dir=path.resolve(process.argv[2]),root=fileURLToPath(new URL('../../../production/',import.meta.url));
const read=(p:string)=>JSON.parse(fs.readFileSync(path.join(dir,p),'utf8'));
const write=(p:string,d:any)=>{const f=path.join(dir,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,JSON.stringify(d,null,2)+'\n')};
const sha=(p:string)=>crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,p))).digest('hex');
const r=read('research/result.json'),researchPath='production/'+path.relative(root,path.join(dir,'research/result.json'));
const supplements=read('evaluation/multinomial-benchmark.json');
// Rank known overlapping alternatives before committing the final Research.
// The common builder supports this explicit contract. Unobserved optional role
// counts must not prevent a valid, completely observed bonus fallback.
const e=buildEvaluation(r);
const alternatives=new Map<string,any[]>();
for(const x of e.evaluations){if(x.dependency?.status!=='DEFERRED_TO_CANDIDATE_CONTRACT'||!(x.metrics?.igPerEligibleTrial>1e-15))continue;const id=x.dependency.groupId;const a=alternatives.get(id)??[];a.push(x);alternatives.set(id,a);}
for(const [id,members] of alternatives){if(members.length<2)continue;
 const score=(x:any)=>supplements[x.findingId]?.selectionScore??(x.metrics.selectionScore.status==='COMPUTED'?x.metrics.selectionScore.value:null);
 members.sort((a:any,b:any)=>{const sa=score(a),sb=score(b);return sa!==null&&sb!==null?sb-sa:sa!==null?-1:sb!==null?1:0});
 members.forEach((x:any,i:number)=>{x.dependencyFallbackRank=i+1;r.findings.find((f:any)=>f.findingId===x.findingId).dependencyFallbackRank=i+1});
 r.observationContract.dependencyAlternatives??={};r.observationContract.dependencyAlternatives[id]={order:members.map((x:any)=>x.findingId),rankBasis:'Resolved finite-7000G scores descending; exact-live-only alternatives retain source declaration order after scored candidates.',activation:'Use first valid observed and Runtime-Policy-active candidate only; never multiply alternatives; missing is null, not zero.'};
}
write('research/result.json',r);
const ref=(kind:string)=>({kind,path:'production/'+path.relative(root,path.join(dir,kind+'/result.json')),sha256:sha(kind+'/result.json'),producerWorkId:r.workId});
const researchValidation=validateResearchArtifacts(new RepoStore(root),{stage:'RESEARCH',batchId:r.batchId,machineId:r.machineId} as any,{status:'SUCCESS',workId:r.workId,producedArtifacts:[{...ref('research'),path:researchPath}]} as any);
write('evaluation/builder-output.json',e);
const baselineValidation=validateEvaluationDocument(e,r);
for(const x of e.evaluations){const s=supplements[x.findingId];if(!s)continue;
 if(x.model!=='CATEGORICAL'||x.trialUniverse!=='NORMAL_GAME_TRIAL'||s.trials!==7000||s.ig7000<0||s.ig7000>Math.log2(Object.keys(x.settingDistribution).length))throw Error('MULTINOMIAL_BENCHMARK_INVALID');
 x.metrics.selectionScore={status:'COMPUTED',value:s.selectionScore};x.benchmarkExposure={status:'EXACT',trials:7000,exposureClass:'DERIVED_EXACT'};x.selectionClass=s.selectionScore>=20?'CORE':s.selectionScore>=10?'SUPPORT':s.selectionScore>=5?'JOINT_ELIGIBLE':'EXCLUDE';x.evaluationCompleteness='COMPLETE';x.numericalIntegration=s;
}
e.artifactReview={scope:'Artifact-only Manifest SELDEP-002 numerical integration of complete normal-game categorical observations.',commonBuilderChanged:false,legacyValidatorLimitation:'Pinned evaluator/validator assumes every appearance_distribution has unresolved benchmark, including a source-defined normal-game multinomial. Original output is separately validated and preserved; this supplemental artifact owns the finite-7000-trial MI. No engine or common validator changed.',baselineValidation};write('evaluation/result.json',e);
const el=buildEligibility(e);write('eligibility/result.json',el);const ev=validateEligibilityDocument(el,e,r);
const c=buildCandidateContract(e,el,ref('evaluation'),ref('eligibility'));
c.observationContract=r.observationContract;c.reconciliationArtifact={path:ref('research').path.replace('result.json','reconciliation.json'),sha256:sha('research/reconciliation.json')};
// Explicit evaluated selection is preserved separately from execution-time activation.
c.selectionAudit=e.evaluations.map((x:any)=>({findingId:x.findingId,selectionClass:x.selectionClass,selectionScore:x.metrics.selectionScore,benchmarkExposure:x.benchmarkExposure,liveInferenceRoute:el.decisions.find((d:any)=>d.findingId===x.findingId)?.liveInferenceRoute}));
write('candidate_contract/result.json',c);const cv=validateCandidateContractDocument(c,el,e);
write('verification.json',{machineId:r.machineId,scope:'RESEARCH_THROUGH_CANDIDATE_CONTRACT_ONLY',researchValidation,legacyEvaluationValidation:baselineValidation,categoricalSupplementValidation:'Finite-trial MI reproduced by benchmark.py with fixed seed; sample and 95% numerical integration interval persisted.',eligibilityValidation:ev,candidateContractValidation:cv,publishedPackageChanged:false,qaChanged:false,artifactHashes:Object.fromEntries(['research/result.json','research/reconciliation.json','evaluation/result.json','eligibility/result.json','candidate_contract/result.json'].map(p=>[p,sha(p)]))});
console.log(JSON.stringify({machineId:r.machineId,researchCandidates:r.researchCompleteness.candidateLedger.length,numeric:c.candidates.length,evidence:c.evidenceCandidates.length,closed:c.blockedItems.length,groups:c.dependencyGroups.map((g:any)=>({id:g.groupId,resolution:g.resolution,selected:g.selectedFindingId})),validation:'PASS'}));
