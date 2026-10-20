import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
const index=Number(process.argv[2]),root=process.cwd(),app=path.resolve(root,'../../app024'),dist=path.resolve(root,'../../distribution024'),batch='batch-20261019-024';
const machines=JSON.parse(fs.readFileSync(path.join(root,'batches',batch,'batch.json'))).waves.flatMap(w=>w.machineIds),mid=machines[index-1];if(!mid)throw Error('INDEX_REQUIRED');
const packagePath=path.join(dist,'machines',mid,'machine-package.json'),dir=path.join(root,'batches',batch,'validation','machine-reports');fs.mkdirSync(dir,{recursive:true});
const rows=[];
for(const [script,args] of [
 ['src/ui/liveMachinePackageRuntimeSmoke.tsx',[]],
 ['scripts/verify-batch024-package-runtime.ts',[]],
 ['scripts/verify-v8-tab-render.tsx',[path.join(dir,'tabs-'+mid+'.json')]],
 ['src/ui/renderedCanonicalUiReport.ts',[path.join(dir,'rendered-'+mid+'.json')]],
]){
 const r=spawnSync(process.execPath,['--import','tsx',script,packagePath,...args],{cwd:app,encoding:'utf8'});
 rows.push({machineId:mid,script,exitCode:r.status,stdout:r.stdout,stderr:r.stderr});
 if(r.status!==0){fs.writeFileSync(path.join(dir,'checks-'+mid+'.json'),JSON.stringify(rows,null,2)+'\n');process.stderr.write(r.stderr??'');process.stderr.write(r.stdout??'');throw Error('MACHINE_CHECK_FAILED:'+mid+':'+script);}
}
fs.writeFileSync(path.join(dir,'checks-'+mid+'.json'),JSON.stringify(rows,null,2)+'\n');console.log(JSON.stringify({machineId:mid,status:'PASS',checks:rows.length}));
