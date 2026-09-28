import fs from 'node:fs';
import path from 'node:path';
import {RepoStore} from './core.ts';
import {initializeBatch} from './runtime.ts';
import type {BatchSpec} from './runtime.ts';

const specPath=process.argv[2];
if(!specPath) throw new Error('USAGE: init-batch <batch-spec.json>');
const absolute=path.resolve(specPath);
const spec=JSON.parse(fs.readFileSync(absolute,'utf8')) as BatchSpec;
const store=new RepoStore(process.cwd());
if(store.exists('batches',spec.batchId)) throw new Error('BATCH_ALREADY_EXISTS');
initializeBatch(store,spec);
console.log(JSON.stringify({batchId:spec.batchId,waves:spec.waves.map(w=>({waveId:w.waveId,machineCount:w.machineIds.length})),machineCount:spec.waves.flatMap(w=>w.machineIds).length},null,2));
