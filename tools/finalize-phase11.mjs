#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function run(script,args=[]){
  const r=spawnSync(process.execPath,[path.join(root,'tools',script),...args],{cwd:root,stdio:'inherit'});
  if(r.error) throw r.error;
  if(r.status!==0) throw new Error(`${script} failed with exit code ${r.status}`);
}
run('apply-phase11-user-facing-fixes.mjs',['.']);
run('sync-machine-difficulty-catalog.mjs',['L_KAGUYA_SAMA_JA']);
run('sync-catalog-package-metadata.mjs',['.']);
run('audit-user-facing-phase11.mjs',['.','reports/phase11-user-facing-audit.json']);
console.log('Phase 11 finalizer: OK');
