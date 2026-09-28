import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {migrationSyncManifest} from './migration-sync-manifest.ts';

const run=(cmd:string,args:string[],cwd?:string)=>{const r=spawnSync(cmd,args,{encoding:'utf8',shell:process.platform==='win32',cwd});if(r.status!==0)throw new Error(`COMMAND_FAILED:${cmd} ${args.join(' ')}\n${r.stdout}\n${r.stderr}`);return r.stdout.trim()};
export const normalizeMigrationPaths=(productionRoot:string,repoRoot:string,files:string[])=>files.map(p=>path.relative(repoRoot,path.join(productionRoot,p)).replaceAll(path.sep,'/'));
export function finalizeMigration(productionRoot:string,batchId:string,branch='production/batch-20260928-001'){
 const manifest=migrationSyncManifest(productionRoot,batchId);
 const repoRoot=run('git',['rev-parse','--show-toplevel'],productionRoot);
 const paths=normalizeMigrationPaths(productionRoot,repoRoot,manifest.files);
 const allowed=new Set(paths);
 const batchPath=path.relative(repoRoot,path.join(productionRoot,'batches',batchId)).replaceAll(path.sep,'/');
 const status=run('git',['status','--porcelain','--untracked-files=all','--',batchPath],repoRoot);
 const changed=status.split(/\r?\n/).filter(Boolean).map(line=>line.slice(3).replaceAll('\\','/'));
 const unexpected=changed.filter(p=>!allowed.has(p));
 if(unexpected.length)throw new Error('MIGRATION_UNEXPECTED_LOCAL_CHANGES:'+unexpected.join(','));
 run('git',['add','--',...paths],repoRoot);
 const staged=run('git',['diff','--cached','--name-only','--',batchPath],repoRoot).split(/\r?\n/).filter(Boolean).map(x=>x.replaceAll('\\','/'));
 const forbidden=staged.filter(p=>!allowed.has(p));
 if(forbidden.length)throw new Error('MIGRATION_STAGED_SCOPE_VIOLATION:'+forbidden.join(','));
 if(!staged.length)throw new Error('MIGRATION_NOTHING_STAGED');
 run('git',['commit','-m',`Migrate ${batchId} authoritative production state`],repoRoot);
 run('git',['push','origin',`HEAD:${branch}`],repoRoot);
 return {batchId,branch,stagedCount:staged.length,pushed:true};
}
if(process.argv[1]?.endsWith('finalize-migration.ts')){const b=process.argv[2];if(!b)throw new Error('USAGE: finalize-migration <batch-id>');console.log(JSON.stringify(finalizeMigration(process.cwd(),b),null,2))}
