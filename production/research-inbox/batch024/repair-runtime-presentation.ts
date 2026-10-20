import fs from 'node:fs';import path from 'node:path';
import {RepoStore,Orchestrator} from '../../src/core.ts';
const s=new RepoStore(process.cwd()),o=new Orchestrator(s),b='batch-20261019-024',m='L_LOVEKYURE2_PS',logs:any[]=[];
for(const stage of ['CANONICAL_UI','MACHINE_DATA','RUNTIME_POLICY','RUNTIME_PROJECTION','APP_RUNTIME']){
 const x=o.reconcile(b,m,stage);if(x.state!=='COMPLETE')throw Error('REQUIRES_COMPLETE:'+stage);
 const ref=x.authoritativeOutputRef,p=s.p(...ref.path.replace(/^production\//,'').split('/')),archive=s.p('research-inbox','batch024','immutable-runtime-revisions',ref.producerWorkId,'result.json');fs.mkdirSync(path.dirname(archive),{recursive:true});fs.copyFileSync(p,archive);
 logs.push({machineId:m,stage,priorRef:ref,archive:'production/'+path.relative(s.root,archive),reason:'条件別ゲーム数・回数の入力名を短縮し、自動集計説明と慎重な設定条件表現を整合する。数値モデル・採否・入力IDは変更しない。'});
 o.transition(x,'READY','AUTHORITATIVE_OUTPUT_INVALIDATED','batch024-ui-presentation');
}
s.write(logs,'research-inbox','batch024','runtime-presentation-revisions.json');
