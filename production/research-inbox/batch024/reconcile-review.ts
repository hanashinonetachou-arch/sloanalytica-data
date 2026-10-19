import fs from 'node:fs';import path from 'node:path';
import {RepoStore,Orchestrator} from '../../src/core.ts';
const s=new RepoStore(process.cwd()),o=new Orchestrator(s),b='batch-20261019-024',log:any[]=[];
for(const file of fs.readdirSync(s.p('research-inbox','batch024','reviewed'))){
 const mid=file.replace(/\.json$/,''),d=s.read<any>('research-inbox','batch024','reviewed',file),old=s.read<any>('batches',b,'artifacts',mid,'research','result.json');delete old.workId;delete d.workId;
 if(JSON.stringify(old)===JSON.stringify(d))continue;
 for(const name of ['RESEARCH','EVALUATION','ELIGIBILITY','CANDIDATE_CONTRACT']){
  const x=o.reconcile(b,mid,name);if(x.state!=='COMPLETE')throw Error('REVIEW_NOT_COMPLETE:'+mid+':'+name);
  const artifact=s.p('batches',b,'artifacts',mid,name.toLowerCase(),'result.json');
  const archive=s.p('research-inbox','batch024','immutable-revisions',x.authoritativeOutputRef.producerWorkId,'result.json');fs.mkdirSync(path.dirname(archive),{recursive:true});fs.copyFileSync(artifact,archive);
  log.push({machineId:mid,stage:name,priorRef:x.authoritativeOutputRef,archivedPath:'production/'+path.relative(s.root,archive),reason:'カテゴリ分布の区切りを既存パーサーの正式形式に修正。数値と候補は保持し、旧成果物を保存する。'});
  o.transition(x,'READY','AUTHORITATIVE_OUTPUT_INVALIDATED','batch024-reviewed-normalization-r2');
 }
}
s.write(log,'research-inbox','batch024','review-reconciliation.json');console.log(JSON.stringify(log.map(x=>({machineId:x.machineId,stage:x.stage}))));
