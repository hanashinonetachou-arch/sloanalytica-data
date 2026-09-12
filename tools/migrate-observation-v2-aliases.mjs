#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const researchRoot=path.join(ROOT,'research');
const modeMap=new Map([
  ['VISUAL_CONFIRMATION','VISUAL_EVENT'],
  ['MANUAL_COUNT','MANUAL_COUNTER'],
  ['MACHINE_MENU_READ','MENU_READ'],
  ['LINKED_COUNTER','LINKED_SERVICE_READ'],
  ['DERIVED_COUNTER','DERIVED'],
  ['SNAPSHOT_COUNTER','DATA_COUNTER_READ'],
]);
const coverageMap=new Map([['NOT_AVAILABLE','CHECKED_NONE']]);
const reopenMap=new Map([['OPEN','RESEARCH_REOPEN_REQUIRED']]);

function canonicalMethods(methods,data){
  const out=[];
  for(const m of methods??[]){
    if(m==='MANUAL_OR_LINKED_READ'){
      out.push('MANUAL_COUNTER');
      if(['FOUND','VERIFIED_ON_MACHINE'].includes(data?.sourceCoverage?.linkedService)) out.push('LINKED_SERVICE_READ');
      continue;
    }
    out.push(modeMap.get(m)??m);
  }
  return [...new Set(out)];
}

let files=0, changedFiles=0, replacements=0;
const changed=[];
for(const ent of fs.readdirSync(researchRoot,{withFileTypes:true})){
  if(!ent.isDirectory()||ent.name.startsWith('_')) continue;
  const file=path.join(researchRoot,ent.name,'machine-observation-data.json');
  if(!fs.existsSync(file)) continue;
  files++;
  const data=JSON.parse(fs.readFileSync(file,'utf8'));
  if(data.schemaVersion!=='machine-observation-data-v2') continue;
  let dirty=false;
  for(const [k,v] of Object.entries(data.sourceCoverage??{})){
    const nv=coverageMap.get(v);
    if(nv){data.sourceCoverage[k]=nv;dirty=true;replacements++;}
  }
  for(const o of data.observations??[]){
    let nv=modeMap.get(o.observationMode);
    if(o.observationMode==='MANUAL_OR_LINKED_READ') nv='MANUAL_COUNTER';
    if(nv){o.observationMode=nv;dirty=true;replacements++;}
  }
  for(const m of data.featureMappings??[]){
    const before=JSON.stringify(m.collectionMethods??[]);
    const after=canonicalMethods(m.collectionMethods,data);
    if(before!==JSON.stringify(after)){m.collectionMethods=after;dirty=true;replacements++;}
  }
  for(const r of data.researchReopenRequests??[]){
    const nv=reopenMap.get(r.status);
    if(nv){r.status=nv;dirty=true;replacements++;}
  }
  if(dirty){
    fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');
    changedFiles++;
    changed.push(path.relative(ROOT,file));
  }
}
console.log(JSON.stringify({files,changedFiles,replacements,changed},null,2));