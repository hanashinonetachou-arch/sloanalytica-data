#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root=path.resolve(process.argv[2]??'.');
const catalogPath=path.join(root,'catalog.json');
const catalog=JSON.parse(fs.readFileSync(catalogPath,'utf8'));
let updated=0;
for(const m of catalog.machines??[]){
  const p=path.join(root,'machines',m.machineId,'machine-package.json');
  if(!fs.existsSync(p)) continue;
  const bytes=fs.readFileSync(p);
  const sha=crypto.createHash('sha256').update(bytes).digest('hex');
  const size=bytes.length;
  if(m.sha256!==sha || m.packageSizeBytes!==size){
    m.sha256=sha;
    m.packageSizeBytes=size;
    updated++;
  }
}
if(updated){
  catalog.generatedAt=new Date().toISOString();
  fs.writeFileSync(catalogPath,JSON.stringify(catalog,null,2)+'\n','utf8');
}
console.log(`Catalog package metadata sync: ${updated} updated.`);
