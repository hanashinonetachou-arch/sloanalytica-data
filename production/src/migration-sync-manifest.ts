import fs from 'node:fs';
import path from 'node:path';
import {migrationPreflight} from './migration-preflight.ts';

const ALLOWED=[
 /^batches\/[^/]+\/machines\/[^/]+\/stages\/(RESEARCH|EVALUATION)\.json$/,
 /^batches\/[^/]+\/machines\/[^/]+\/attempts\/[^/]+\.json$/,
 /^batches\/[^/]+\/leases\/[^/]+\.json$/,
 /^batches\/[^/]+\/events\/[^/]+\.(json|jsonl)$/,
 /^batches\/[^/]+\/transitions\/history\.jsonl$/,
 /^batches\/[^/]+\/provenance\/chain\.jsonl$/,
 /^batches\/[^/]+\/work-requests\/[^/]+\.json$/
];

function walk(root:string,dir=root,out:string[]=[]){
 if(!fs.existsSync(dir))return out;
 for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())walk(root,f,out);else out.push(path.relative(root,f).replaceAll(path.sep,'/'))}
 return out;
}

export function migrationSyncManifest(root:string,batchId:string){
 migrationPreflight(root,batchId);
 const batchRoot=path.join(root,'batches',batchId);
 const files=walk(root,batchRoot).filter(rel=>ALLOWED.some(r=>r.test(rel))).sort();
 if(!files.length)throw new Error('MIGRATION_SYNC_EMPTY');
 const forbidden=files.filter(rel=>rel.includes('/artifacts/'));
 if(forbidden.length)throw new Error('MIGRATION_SYNC_ARTIFACT_FORBIDDEN');
 return {batchId,files,count:files.length};
}
if(process.argv[1]?.endsWith('migration-sync-manifest.ts')){
 const batchId=process.argv[2];if(!batchId)throw new Error('USAGE: migration-sync-manifest <batch-id>');
 console.log(JSON.stringify(migrationSyncManifest(process.cwd(),batchId),null,2));
}
