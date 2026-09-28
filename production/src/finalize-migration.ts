import {spawnSync} from 'node:child_process';
import {migrationSyncManifest} from './migration-sync-manifest.ts';

const run=(cmd:string,args:string[])=>{const r=spawnSync(cmd,args,{encoding:'utf8',shell:process.platform==='win32'});if(r.status!==0)throw new Error(`COMMAND_FAILED:${cmd} ${args.join(' ')}\n${r.stdout}\n${r.stderr}`);return r.stdout.trim()};
export function finalizeMigration(root:string,batchId:string,branch='production/batch-20260928-001'){
 const manifest=migrationSyncManifest(root,batchId);
 const status=run('git',['status','--porcelain']);
 const allowed=new Set(manifest.files);
 const changed=status.split(/\r?\n/).filter(Boolean).map(line=>line.slice(3).replaceAll('\\','/'));
 const unexpected=changed.filter(p=>!allowed.has(p));
 if(unexpected.length)throw new Error('MIGRATION_UNEXPECTED_LOCAL_CHANGES:'+unexpected.join(','));
 run('git',['add','--',...manifest.files]);
 const staged=run('git',['diff','--cached','--name-only']).split(/\r?\n/).filter(Boolean).map(x=>x.replaceAll('\\','/'));
 const forbidden=staged.filter(p=>!allowed.has(p));
 if(forbidden.length)throw new Error('MIGRATION_STAGED_SCOPE_VIOLATION:'+forbidden.join(','));
 if(!staged.length)throw new Error('MIGRATION_NOTHING_STAGED');
 run('git',['commit','-m',`Migrate ${batchId} authoritative production state`]);
 run('git',['push','origin',`HEAD:${branch}`]);
 return {batchId,branch,stagedCount:staged.length,pushed:true};
}
if(process.argv[1]?.endsWith('finalize-migration.ts')){const b=process.argv[2];if(!b)throw new Error('USAGE: finalize-migration <batch-id>');console.log(JSON.stringify(finalizeMigration(process.cwd(),b),null,2))}
