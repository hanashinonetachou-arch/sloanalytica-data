import {RepoStore,Orchestrator} from '../../../../src/core.ts';
const s=new RepoStore(process.cwd()),o=new Orchestrator(s),batch='batch-20261022-025',machine='LB_THUNDER_V_HA';
const archive=['batches',batch,'reconstruction',machine,'presentation-inline-20261025'];
if(s.exists(...archive,'revision.json'))throw Error('ALREADY_PREPARED');
const rp=['research-inbox','batch025','reviewed',machine+'.json'],research=s.read<any>(...rp);
if(research.packageRevision!==7)throw Error('EXPECTED_REVISION_7');
const stages=['RESEARCH','EVALUATION','ELIGIBILITY','CANDIDATE_CONTRACT','OBSERVATION_EVIDENCE','CANONICAL_UI','MACHINE_DATA','RUNTIME_POLICY','RUNTIME_PROJECTION','APP_RUNTIME'];
for(const stage of stages){const state=o.stage(batch,machine,stage);if(state.state!=='COMPLETE')throw Error('EXPECTED_COMPLETE:'+stage);s.write(state,...archive,'previous',stage+'.json');s.write(s.read('batches',batch,'artifacts',machine,stage.toLowerCase(),'result.json'),...archive,'previous',stage.toLowerCase()+'.artifact.json');}
research.packageRevision=8;s.write(research,...rp);
for(const stage of stages)o.transition(o.stage(batch,machine,stage),'READY','AUTHORITATIVE_OUTPUT_INVALIDATED','THUNDER_INLINE_SHARED_G_20261025');
s.write({authority:'USER_EXPLICIT_INSTRUCTION',reason:'Show all BIG first-half counts together with one common G input; show all role-overlap input pairs together without tabs.',sourceProbabilitiesChanged:false,thresholdsChanged:false,successInputIdsChanged:false,sharedCodeChanged:false,newSharedBigGamesInput:'INP_THUNDER_BIG_FIRST_HALF_G',legacyExposurePolicy:'REENTER_SHARED_G_NO_INFERRED_MIGRATION',deviceQaAccepted:false},...archive,'revision.json');
console.log('THUNDER_INLINE_REVISION_PREPARED');
