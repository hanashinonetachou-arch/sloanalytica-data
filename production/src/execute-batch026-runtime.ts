import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {buildObservationEvidence} from './observation-evidence-builder.ts';import {validateObservationEvidenceDocument} from './observation-evidence-validator.ts';
import {buildCanonicalUi} from './canonical-ui-builder.ts';import {validateCanonicalUiDocument} from './canonical-ui-validator.ts';
import {buildMachineData} from './machine-data-builder.ts';import {validateMachineDataDocument} from './machine-data-validator.ts';
import {buildRuntimePolicy} from './runtime-policy-builder.ts';import {validateRuntimePolicyDocument} from './runtime-policy-validator.ts';
import {buildRuntimeProjection} from './runtime-projection-builder.ts';import {validateRuntimeProjectionDocument} from './runtime-projection-validator.ts';
import {buildAppRuntime} from './app-runtime-builder.ts';import {validateAppRuntimeDocument} from './app-runtime-validator.ts';
export const ids=['LB_FUJIKO_M2','LB_SLOT_GALFY_A4','LB_EVA_PROMISE_DOOR_SR','LB_ISEKAI_QUARTET_KR','LB_TOBE_HAREM_ACE_CF','S_NEO_IM_JUGGLER_EX_KK','S_ULTRA_MIRACLE_JUGGLER_KT','S_MR_JUGGLER_KK','S_JUGGLER_GIRLS_SS_KH','S_GOGO_JUGGLER_3_KA'];
const batch='batch-20261026-026',base=path.resolve('data/production/batches',batch),config={schemaVersion:'runtime-policy-config-v1',manifestVersion:'8.5',policyVersion:'v8.5-production-baseline-20261003',thresholds:{SELECTION_SCORE:{status:'FIXED',value:5},PER_ELIGIBLE_TRIAL_POWER:{status:'FIXED',value:0}}};
const json=(p:string)=>JSON.parse(fs.readFileSync(p,'utf8'));const write=(p:string,d:any)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n')};
write(path.join(base,'runtime-policy-config.json'),config);
const configRef={artifactId:'runtime-policy-config-'+batch,kind:'runtime-policy-config',path:'production/batches/'+batch+'/runtime-policy-config.json',sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(base,'runtime-policy-config.json'))).digest('hex'),producerWorkId:'HUMAN_POLICY'};
for(const id of ids){const dir=path.join(base,'artifacts',id),r=json(dir+'/research/result.json'),e=json(dir+'/evaluation/result.json'),c=json(dir+'/candidate_contract/result.json');
 const refs:any={};for(const kind of ['research','evaluation','eligibility','candidate_contract'])refs[kind]={artifactId:kind+'-'+id,kind:kind.replaceAll('_','-'),path:'production/batches/'+batch+'/artifacts/'+id+'/'+kind+'/result.json',sha256:crypto.createHash('sha256').update(fs.readFileSync(dir+'/'+kind+'/result.json')).digest('hex'),producerWorkId:r.workId};
 const save=(kind:string,doc:any)=>{write(dir+'/'+kind+'/result.json',doc);refs[kind]={artifactId:kind+'-'+id,kind:kind.replaceAll('_','-'),path:'production/batches/'+batch+'/artifacts/'+id+'/'+kind+'/result.json',sha256:crypto.createHash('sha256').update(fs.readFileSync(dir+'/'+kind+'/result.json')).digest('hex'),producerWorkId:'implementation-20261027-'+id+'-'+kind};return doc};
 const o=buildObservationEvidence(c,r,refs.candidate_contract);
 // Explicit scope labels are presentation metadata; probabilities and contracts remain frozen.
 const labels:any={FUJIKO_BIG_PLUM_TRIAL:'BIG中プラム合計回数',FUJIKO_VOICE_FIRST_SUCCESS_TRIAL:'1G目調整成功回数',FUJIKO_VOICE_LATER_SUCCESS_TRIAL:'2G目以降調整成功回数',GALFY_JAC_IN_2COIN_GAME_TRIAL:'JAC IN中2枚掛けゲーム数',ISEKAI_BIG_ELIGIBLE_GAME_TRIAL:'BIG中対象ゲーム数',ISEKAI_BT_ELIGIBLE_GAME_TRIAL:'BT中除外後ゲーム数',HAREM_BT_2COIN_GAME_TRIAL:'BT中2枚掛けゲーム数',PREDECESSOR_NORMAL_GAME_TRIAL:'着席時通常ゲーム数',PREDECESSOR_HAREM_BIG_TRIAL:'着席時BIG合計回数'};
 for(const x of o.observations){if(labels[x.trialUniverse])x.inputPresentation={...x.inputPresentation,trialLabel:labels[x.trialUniverse],successLabel:x.label.replace(/^通常時/,'').slice(0,28)+'回数'};if(x.trialUniverse?.startsWith('GALFY_ROLE_'))x.inputPresentation={trialLabel:x.label.replace('成立役別ボーナス','').trim()+'成立回数',successLabel:'ボーナス重複回数'};}
 if(id.startsWith('S_'))o.gameCountPolicy='TOTAL_ONLY';
 const validations:any={};validations.observation=validateObservationEvidenceDocument(o,c,r);save('observation_evidence',o);
 const u=buildCanonicalUi(c,o,e,refs.candidate_contract,refs.observation_evidence,refs.evaluation);validations.canonicalUi=validateCanonicalUiDocument(u,c,o,e,refs.candidate_contract,refs.observation_evidence,refs.evaluation);save('canonical_ui',u);
 const m=buildMachineData(u,c,o,refs.canonical_ui,refs.candidate_contract,refs.observation_evidence,r,refs.research);validations.machineData=validateMachineDataDocument(m,u,c,o,refs.canonical_ui,refs.candidate_contract,refs.observation_evidence,r,refs.research);save('machine_data',m);
 const p=buildRuntimePolicy(m,config,refs.machine_data,configRef);validations.runtimePolicy=validateRuntimePolicyDocument(p,m,config,refs.machine_data,configRef);save('runtime_policy',p);
 const pr=buildRuntimeProjection(m,p,refs.machine_data,refs.runtime_policy);validations.runtimeProjection=validateRuntimeProjectionDocument(pr,m,p,refs.machine_data,refs.runtime_policy);save('runtime_projection',pr);
 const a=buildAppRuntime(pr,refs.runtime_projection);validations.appRuntime=validateAppRuntimeDocument(a,pr,refs.runtime_projection);save('app_runtime',a);
 write(dir+'/runtime-validation.json',{machineId:id,validations,artifacts:refs,deviceQa:'NOT_PERFORMED'});console.log(id+' PASS '+a.package.features.features.length+' features');
}
