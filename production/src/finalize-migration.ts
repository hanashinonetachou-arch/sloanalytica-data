import {spawnSync} from 'node:child_process';
import {migrationSyncManifest} from './migration-sync-manifest.ts';

const run=(cmd:string,args:string[])=>{const r=spawnSync(cmd,args,{encoding:'utf8',shell:process.platform==='win32'});if(r.status!==0)throw new Error(`COMMAND_FAILED:${cmd} ${args.join(' ')}\n${r.stdout}\n${r.stderr}`);return r.stdout.trim()};
const git=(root:string,args:string[])=>run('git',['-C',root,...args]);
const toGitPath=(p:string)=>'production/'+p;
export function finalizeMigration(root:string,batchId:string,branch='production/batch-20260928-001'){
 const manifest=migrationSyncManifest(root,batchId);
 const allowed=new Set(manifest.files.map(toGitPath));
 const status=git(root,['status','--porcelain','--untracked-files=all','--','production/batches/'+batchId]);
 const changed=status.split(/\r?\n/).filter(Boolean).map(line=>line.slice(3).replaceAll('\\','/'));
 const unexpected=changed.filter(p=>!allowed.has(p));
 if(unexpected.length)throw new Error('MIGRATION_UNEXPECTED_LOCAL_CHANGES:'+unexpected.join(','));
 const paths=manifest.files.map(toGitPath);
 git(root,['add','--',...paths]);
 const staged=git(root,['diff','--cached','--name-only','--','production/batches/'+batchId]).split(/\r?\n/).filter(Boolean).map(x=>x.replaceAll('\\','/'));
 const forbidden=staged.filter(p=>!allowed.has(p));
 if(forbidden.length)throw new Error('MIGRATION_STAGED_SCOPE_VIOLATION:'+forbidden.join(','));
 if(!staged.length)throw new Error('MIGRATION_NOTHING_STAGED');
 git(root,['commit','-m',`Migrate ${batchId} authoritative production state`]);
 git(root,['push','origin',`HEAD:${branch}`]);
 return {batchId,branch,stagedCount:staged.length,pushed:true};
}
if(process.argv[1]?.endsWith('finalize-migration.ts')){const b=process.argv[2];if(!b)throw new Error('USAGE: finalize-migration <batch-id>');console.log(JSON.stringify(finalizeMigration(process.cwd(),b),null,2))}
