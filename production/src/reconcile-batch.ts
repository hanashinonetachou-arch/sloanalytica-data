import {RepoStore,Orchestrator} from './core.ts';
import {reconcileBatch} from './runtime.ts';

const batchId=process.argv[2];
if(!batchId) throw new Error('USAGE: reconcile-batch <batch-id>');

const s=new RepoStore(process.cwd());
const o=new Orchestrator(s);
const result=reconcileBatch(o,s,batchId);
console.log(JSON.stringify(result,null,2));
