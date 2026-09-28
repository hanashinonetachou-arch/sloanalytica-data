import fs from 'node:fs';
import path from 'node:path';
import {RepoStore,Orchestrator} from './core.ts';
import {acceptAndRecord,promoteDependencies} from './runtime.ts';
import type {WorkResult} from './core.ts';

const resultPath=process.argv[2];
if(!resultPath) throw new Error('USAGE: ingest-result <work-result.json>');
const absolute=path.resolve(resultPath);
const result=JSON.parse(fs.readFileSync(absolute,'utf8')) as WorkResult;
const s=new RepoStore(process.cwd());
const o=new Orchestrator(s);
const accepted=acceptAndRecord(o,s,result,'semantic-worker','deterministic');
if(accepted.kind==='COMMITTED') promoteDependencies(o,accepted.stage.batchId,accepted.stage.machineId);
console.log(JSON.stringify({workId:result.workId,kind:accepted.kind},null,2));
