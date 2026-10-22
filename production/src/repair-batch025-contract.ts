import fs from 'node:fs';
import path from 'node:path';
import {RepoStore,Orchestrator} from './core.ts';
import {acceptAndRecord} from './runtime.ts';
const s=new RepoStore(process.cwd()),o=new Orchestrator(s),id='batch-20261022-025';
const fixes:any={L_ANOTHER_RINO_HEAVEN_CC:{BONUS_COMBINED:'連チャン込み合算は初当りを内包し、設定差のない連チャンを含むため参考表示のみ。32G連チャンを除外した初当りの代わりに採用しない。'},L_HANABI_KM:{BIG_BELL_A:'丸められた風鈴Aの値を風鈴B・バラケ目と合計すると100%を超えるため、Aは参考保存。B・バラケ目と残余で排他計算する。'},LB_AREX_BRIGHT_BA:{BIG_0:'丸められた羽Aを他のBIG小役と合計すると100%を超える設定がある。羽Aは参考保存し、識別できる他の小役と残余で排他計算する。'},LB_THUNDER_V_HA:{BIG_BELL_A:'丸められたベルAをベルB・C・リーチ目と合計すると100%を超えるためAは参考保存。他の停止形と残余で排他計算する。'}};
for(const [m,rows] of Object.entries<any>(fixes)){
 const rp=['research-inbox','batch025','reviewed',m+'.json'],d=s.read<any>(...rp);
 for(const [fid,reason] of Object.entries<any>(rows)){
  const f=d.findings.find((f:any)=>f.findingId===fid);if(!f)throw Error('MISSING_FINDING');f.observationType='reference_distribution';f.details=[reason,f.denominatorSemantics];f.referenceClosure={basis:'SOURCE_ROUNDING_AND_EXISTING_DEPENDENCY_POLICY',ownerStage:'CANDIDATE_CONTRACT',repeatPublicSearch:false,releaseCondition:'NEW_CONCRETE_SOURCE_OR_VERIFIED_NATIVE_COUNTING_CONTRACT'};
 }
 d.audit.formalCorrection={reason:'排他確率合計と初当りカウント規約への整合。出典値を変更せず参考分布へ経路修正。',sharedValidatorsChanged:false};s.write(d,...rp);
 for(const stage of ['RESEARCH','EVALUATION','ELIGIBILITY','CANDIDATE_CONTRACT']){
  let x=o.stage(id,m,stage);const file=s.p('batches',id,'artifacts',m,stage.toLowerCase(),'result.json');
  if(fs.existsSync(file)){const dst=s.p('batches',id,'revisions','contract-audit-r1',m,stage.toLowerCase()+'.json');fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(file,dst);}
  if(x.state==='RUNNING'){
   const q=fs.readdirSync(s.p('batches',id,'work-requests')).map(f=>s.read<any>('batches',id,'work-requests',f)).find(q=>q.machineId===m&&q.stage===stage&&q.attemptId===x.activeAttemptId);
   const result:any={workId:q.workId,attemptId:q.attemptId,leaseId:q.leaseId,leaseGeneration:q.leaseGeneration,status:'FAILED_RETRYABLE',observedInputFingerprint:q.authoritativeInputFingerprint,producedArtifacts:[],validationEvidence:[{validator:'candidate-contract-v1',ok:false,error:'CANDIDATE_JOINT_SUM'}],requestedActions:[],provenance:{reason:'Rounded residual source values retained as reference.'}};
   const accepted=acceptAndRecord(o,s,result,'batch025-contract-audit','existing-production-validators');if(accepted.kind!=='RETRY_WAIT'&&accepted.kind!=='STALE')throw Error('RECOVERY:'+accepted.kind);x=o.reconcile(id,m,stage);
  }
  if(x.state==='COMPLETE')o.transition(x,'READY','AUTHORITATIVE_OUTPUT_INVALIDATED','batch025-contract-audit-r1');
 }
 s.write({machineId:m,findings:Object.keys(rows),reason:'Preserve source values; correct residual mass and initial-hit chain exclusion.',sourceValuesChanged:false},'batches',id,'revisions','contract-audit-r1',m,'reason.json');
}
