import fs from 'node:fs';import path from 'node:path';
import {RepoStore,Orchestrator} from '../../src/core.ts';
const s=new RepoStore(process.cwd()),o=new Orchestrator(s),b='batch-20261018-023',log:any[]=[];
for(const file of fs.readdirSync(s.p('research-inbox','batch023','reviewed'))){
 const mid=file.replace(/\.json$/,''),d=s.read<any>('research-inbox','batch023','reviewed',file),old=s.read<any>('batches',b,'artifacts',mid,'research','result.json');delete old.workId;delete d.workId;
 if(JSON.stringify(old)===JSON.stringify(d))continue;
 for(const name of ['RESEARCH','EVALUATION','ELIGIBILITY','CANDIDATE_CONTRACT','OBSERVATION_EVIDENCE','CANONICAL_UI','MACHINE_DATA','RUNTIME_POLICY','RUNTIME_PROJECTION','APP_RUNTIME']){
  const x=o.reconcile(b,mid,name);if(x.state!=='COMPLETE')throw Error('REVIEW_NOT_COMPLETE:'+mid+':'+name);
  const artifact=s.p('batches',b,'artifacts',mid,name.toLowerCase(),'result.json');
  const archive=s.p('research-inbox','batch023','immutable-runtime-revisions',x.authoritativeOutputRef.producerWorkId,'result.json');fs.mkdirSync(path.dirname(archive),{recursive:true});fs.copyFileSync(artifact,archive);
  log.push({machineId:mid,stage:name,priorRef:x.authoritativeOutputRef,archivedPath:'production/'+path.relative(s.root,archive),reason:'重複した下書きを同一候補へ統合・既知分布の参照意味を修正・キン肉マン小役は既存通常時母数に統一。候補と旧成果物は削除しない。'});
  o.transition(x,'READY','AUTHORITATIVE_OUTPUT_INVALIDATED','batch023-runtime-presentation-review');
 }
}
s.write(log,'research-inbox','batch023','presentation-reconciliation.json');console.log(JSON.stringify(log.map(x=>({machineId:x.machineId,stage:x.stage}))));
