#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const MACHINE_ID='S_MHW_ICEBORNE_ZF';
const EVIDENCE_ID='RE_HIGH_WEAK_SELIANA';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');

export function migrate(root=process.cwd(),{apply=false}={}){
  const file=path.join(root,'research',MACHINE_ID,'selection-data.json');
  const selection=read(file);
  let removed=0;
  for(const group of selection.evidenceUi?.groups??[]){
    const before=(group.options??[]).length;
    group.options=(group.options??[]).filter(o=>!(o.sourceEvidenceIds??[]).includes(EVIDENCE_ID));
    removed+=before-group.options.length;
  }
  if(!removed && !(selection.selectionNotes??[]).some(x=>x.includes(EVIDENCE_ID))) throw new Error(`${EVIDENCE_ID} option not found`);
  selection.selectionNotes??=[];
  const note=`${EVIDENCE_ID}（高確弱レア役→セリエナ防衛戦）はResearch候補として保持するが、通常/高確の実戦識別条件が未解決のためEvidence UIには公開しない。Observation条件確定後に再評価する。`;
  if(!selection.selectionNotes.includes(note)) selection.selectionNotes.push(note);
  if(apply) write(file,selection);
  return {machineId:MACHINE_ID,evidenceId:EVIDENCE_ID,removed};
}

const root=path.resolve(process.argv[2]??'.');
const apply=process.argv.includes('--apply');
if(apply) console.log('APPLIED '+JSON.stringify(migrate(root,{apply:true})));
else {
  const tmp=fs.mkdtempSync(path.join(process.env.RUNNER_TEMP??process.env.TMPDIR??'/tmp','slo-v64-iceborne-evidence-'));
  fs.cpSync(root,tmp,{recursive:true,filter:src=>!src.includes(`${path.sep}.git${path.sep}`)});
  console.log('DRY-RUN PASS '+JSON.stringify(migrate(tmp,{apply:true})));
}
