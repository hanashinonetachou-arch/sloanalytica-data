#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const IDS=['L_ANOTHER_RINO_HEAVEN_CC','L_BASILISK_KIZUNA2_TENZEN_ZN','L_BOFURI_FN'];
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
function modeFor(input,item){
  const t=input?.type;
  if(t==='counter') return 'COUNTER';
  if(t==='enum'||t==='multi_enum') return 'SELECT';
  if(t==='integer'||t==='number') return 'NUMBER';
  if(item?.widget==='select') return 'SELECT';
  if(item?.widget==='counter') return 'COUNTER';
  return 'NUMBER';
}
function normalizedQuickAdd(v){
  if(Array.isArray(v)) return v;
  if(Number.isFinite(v)) return [v];
  return undefined;
}
for(const id of IDS){
  const dir=path.join(ROOT,'research',id);
  const target=path.join(dir,'ui-design-data.json');
  if(fs.existsSync(target)) throw new Error(`${id}: ui-design-data.json already exists`);
  const selection=read(path.join(dir,'selection-data.json'));
  const observation=read(path.join(dir,'machine-observation-data.json'));
  if(observation.schemaVersion!=='machine-observation-data-v2') throw new Error(`${id}: Observation is not v2`);
  const pkg=read(path.join(ROOT,'machines',id,'machine-package.json'));
  const pkgInputs=new Map((pkg.inputs?.inputs??[]).map(x=>[x.id,x]));
  const selectionInputs=new Map((selection.inputs??[]).map(x=>[x.id,x]));
  const sectionOrder=[]; const sections={}; const inputContracts={};
  for(const [index,s] of (pkg.ui?.sections??[]).entries()){
    const title=String(s.title??`セクション${index+1}`).trim()||`セクション${index+1}`;
    if(sections[title]) throw new Error(`${id}: duplicate section title ${title}`);
    sectionOrder.push(title); const inputIds=[];
    for(const item of s.items??[]){
      if(item?.type!=='input'||!item.inputId) continue;
      const input=selectionInputs.get(item.inputId)??pkgInputs.get(item.inputId);
      if(!input) throw new Error(`${id}/${item.inputId}: input definition missing`);
      inputIds.push(item.inputId);
      const c={name:item.label??input.name??item.inputId,mode:modeFor(input,item),gridSpan:[6,12].includes(item.gridSpan)?item.gridSpan:12,directInput:item.config?.directInput??true};
      const qa=normalizedQuickAdd(item.config?.quickAdd??input.uiQuickAdd); if(qa)c.quickAdd=qa;
      if(item.config?.emptyMeansUnobserved!==undefined)c.emptyMeansUnobserved=item.config.emptyMeansUnobserved;
      if(item.config?.observedZeroAllowed!==undefined)c.observedZeroAllowed=item.config.observedZeroAllowed;
      inputContracts[item.inputId]=c;
    }
    sections[title]={inputIds,description:typeof s.description==='string'?s.description:'',collapsible:Boolean(s.collapsible),defaultExpanded:s.defaultExpanded!==undefined?Boolean(s.defaultExpanded):!s.collapsible};
  }
  write(target,{schemaVersion:'ui-design-data-v1',machineId:id,status:'PASS',generatedFrom:{selection:`research/${id}/selection-data.json`,observation:`research/${id}/machine-observation-data.json`,manifest:'SloAnalytica_MachineData_UX_Construction_Manifest_v7_1',materializedSource:`machines/${id}/machine-package.json`},sectionOrder,sections,inputContracts,unresolved:[],auditNotes:['横断監査v7: 既存MachinePackage UIをcanonical化し、Selectionで承認済みの安全除外を正式materializeする。','UIのSection順・見出し・説明・表示入力は既存Packageを保持する。']});
}

const auditPath=path.join(ROOT,'tools','audit-selection-policy-migration.mjs');
let audit=fs.readFileSync(auditPath,'utf8');
for(const id of IDS){
  const re=new RegExp(`^\\s*${id}:\\{[^\\n]*\\},?\\r?\\n`,'m');
  if(!re.test(audit)) throw new Error(`${id}: migration exception line not found`);
  audit=audit.replace(re,'');
}
fs.writeFileSync(auditPath,audit);

const testPath=path.join(ROOT,'test','selection-policy-migration-audit.test.mjs');
let test=fs.readFileSync(testPath,'utf8');
if(!test.includes('assert.equal(r.summary.reviewedSafetyChanges,25);')) throw new Error('reviewedSafetyChanges baseline 25 not found');
test=test.replace('assert.equal(r.summary.reviewedSafetyChanges,25);','assert.equal(r.summary.reviewedSafetyChanges,22);');
for(const id of IDS){
  const re=new RegExp(`^\\s*${id}:\\[[^\\n]*\\],?\\r?\\n`,'m');
  if(!re.test(test)) throw new Error(`${id}: expected removal line not found`);
  test=test.replace(re,'');
}
fs.writeFileSync(testPath,test);
console.log(JSON.stringify({machines:IDS,reviewedSafetyChangesAfter:22},null,2));
