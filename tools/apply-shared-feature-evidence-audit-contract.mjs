#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s,'utf8');
const readJson=p=>JSON.parse(read(p));
const writeJson=(p,v)=>write(p,JSON.stringify(v,null,2)+'\n');
const must=(s,needle,label)=>{if(!s.includes(needle)) throw new Error(`${label}: expected text not found`);};
const replaceOnce=(s,from,to,label)=>{must(s,from,label); return s.replace(from,to);};

// 1) SelectionData: explicitly declare which Feature is intentionally sharing each Evidence counter.
const selPath=path.join(ROOT,'research/L_SHIN_EVANGELION/selection-data.json');
const sel=readJson(selPath);
const shared=new Map([
  ['EVI_REI_MOON',['FEAT_REI_CHANCE_PICTURE']],
  ['EVI_REI_LONG_HAIR',['FEAT_REI_CHANCE_PICTURE']],
  ['EVI_BONUS_END_NOT_1',['FEAT_BONUS_END_SCREEN']],
  ['EVI_BONUS_END_NOT_2',['FEAT_BONUS_END_SCREEN']],
  ['EVI_BONUS_END_NOT_3',['FEAT_BONUS_END_SCREEN']],
  ['EVI_BONUS_END_SILVER',['FEAT_BONUS_END_SCREEN']],
  ['EVI_BONUS_END_GOLD',['FEAT_BONUS_END_SCREEN']],
  ['EVI_BONUS_END_RAINBOW',['FEAT_BONUS_END_SCREEN']],
]);
for(const e of sel.evidence??[]){
  if(shared.has(e.evidenceId)) e.sharedFeatureIds=shared.get(e.evidenceId);
}
for(const id of shared.keys()){
  const e=(sel.evidence??[]).find(x=>x.evidenceId===id);
  if(!e) throw new Error(`Selection evidence missing: ${id}`);
}
writeJson(selPath,sel);

// 2) Builder: preserve the explicit contract in MachinePackage Evidence.
const builderPath=path.join(ROOT,'tools/build-machine-data.mjs');
let builder=read(builderPath);
const oldBuilder=`    evidences.push({id:e.evidenceId,name,displayName:e.displayName??name,inputId:e.inputId,triggerValue:e.triggerValue,\n      confirmedSettings:confirmed,deniedSettings:denied,hasImage:false,\n      type:(denied.length>0 && confirmed.length===0)?"SETTING_DENIAL":"SETTING_CONFIRMATION"});`;
const newBuilder=`    evidences.push({id:e.evidenceId,name,displayName:e.displayName??name,inputId:e.inputId,triggerValue:e.triggerValue,\n      confirmedSettings:confirmed,deniedSettings:denied,hasImage:false,\n      ...(Array.isArray(e.sharedFeatureIds)&&e.sharedFeatureIds.length?{sharedFeatureIds:[...e.sharedFeatureIds]}:{}),\n      type:(denied.length>0 && confirmed.length===0)?"SETTING_DENIAL":"SETTING_CONFIRMATION"});`;
if(!builder.includes('sharedFeatureIds:[...e.sharedFeatureIds]')) builder=replaceOnce(builder,oldBuilder,newBuilder,'build-machine-data');
write(builderPath,builder);

// 3) Phase 9 audit: only an explicitly declared event-input share is safe.
const auditPath=path.join(ROOT,'tools/audit-feature-dependency-phase9.mjs');
let audit=read(auditPath);
const oldAudit=`  for(const e of arr(pkg?.evidence?.evidences)){\n    const ids=featureInputIds.get(e?.inputId)??[];\n    if(ids.length) issues.push({severity:'HIGH_RISK',code:'EVIDENCE_FEATURE_OVERLAP',featureIds:ids,evidenceId:e.id,inputId:e.inputId});\n  }`;
const newAudit=`  for(const e of arr(pkg?.evidence?.evidences)){\n    const ids=featureInputIds.get(e?.inputId)??[];\n    if(!ids.length) continue;\n    const declared=uniq(arr(e?.sharedFeatureIds));\n    const activeById=new Map(fsActive.map(f=>[f.featureId,f]));\n    const declaredValid=declared.length>0 && ids.every(id=>declared.includes(id)) && declared.every(id=>{\n      const f=activeById.get(id);\n      return f && eventInputs(f).includes(e.inputId);\n    });\n    if(declaredValid) continue;\n    issues.push({\n      severity:'HIGH_RISK',\n      code:declared.length?'INVALID_SHARED_FEATURE_EVIDENCE_CONTRACT':'EVIDENCE_FEATURE_OVERLAP',\n      featureIds:ids,evidenceId:e.id,inputId:e.inputId,sharedFeatureIds:declared\n    });\n  }`;
if(!audit.includes('INVALID_SHARED_FEATURE_EVIDENCE_CONTRACT')) audit=replaceOnce(audit,oldAudit,newAudit,'phase9 audit');
write(auditPath,audit);

// 4) Reference fix tool: make reruns preserve the explicit sharing contract.
const fixPath=path.join(ROOT,'tools/fix-shin-eva-shared-feature-evidence-ui.mjs');
let fix=read(fixPath);
const replacements=[
 ["{researchEvidenceId:'RE_REI_MOON',evidenceId:'EVI_REI_MOON',inputId:'INP_REI_PIC_MOON'}","{researchEvidenceId:'RE_REI_MOON',evidenceId:'EVI_REI_MOON',inputId:'INP_REI_PIC_MOON',sharedFeatureIds:['FEAT_REI_CHANCE_PICTURE']}"] ,
 ["{researchEvidenceId:'RE_REI_LONG_HAIR',evidenceId:'EVI_REI_LONG_HAIR',inputId:'INP_REI_PIC_LONG_HAIR'}","{researchEvidenceId:'RE_REI_LONG_HAIR',evidenceId:'EVI_REI_LONG_HAIR',inputId:'INP_REI_PIC_LONG_HAIR',sharedFeatureIds:['FEAT_REI_CHANCE_PICTURE']}"] ,
 ["{researchEvidenceId:'RE_BONUS_END_NOT_1',evidenceId:'EVI_BONUS_END_NOT_1',inputId:'INP_BONUS_END_PURPLE1'}","{researchEvidenceId:'RE_BONUS_END_NOT_1',evidenceId:'EVI_BONUS_END_NOT_1',inputId:'INP_BONUS_END_PURPLE1',sharedFeatureIds:['FEAT_BONUS_END_SCREEN']}"] ,
 ["{researchEvidenceId:'RE_BONUS_END_NOT_2',evidenceId:'EVI_BONUS_END_NOT_2',inputId:'INP_BONUS_END_PURPLE2'}","{researchEvidenceId:'RE_BONUS_END_NOT_2',evidenceId:'EVI_BONUS_END_NOT_2',inputId:'INP_BONUS_END_PURPLE2',sharedFeatureIds:['FEAT_BONUS_END_SCREEN']}"] ,
 ["{researchEvidenceId:'RE_BONUS_END_NOT_3',evidenceId:'EVI_BONUS_END_NOT_3',inputId:'INP_BONUS_END_PURPLE3'}","{researchEvidenceId:'RE_BONUS_END_NOT_3',evidenceId:'EVI_BONUS_END_NOT_3',inputId:'INP_BONUS_END_PURPLE3',sharedFeatureIds:['FEAT_BONUS_END_SCREEN']}"] ,
 ["{researchEvidenceId:'RE_BONUS_END_SILVER',evidenceId:'EVI_BONUS_END_SILVER',inputId:'INP_BONUS_END_SILVER'}","{researchEvidenceId:'RE_BONUS_END_SILVER',evidenceId:'EVI_BONUS_END_SILVER',inputId:'INP_BONUS_END_SILVER',sharedFeatureIds:['FEAT_BONUS_END_SCREEN']}"] ,
 ["{researchEvidenceId:'RE_BONUS_END_GOLD',evidenceId:'EVI_BONUS_END_GOLD',inputId:'INP_BONUS_END_GOLD'}","{researchEvidenceId:'RE_BONUS_END_GOLD',evidenceId:'EVI_BONUS_END_GOLD',inputId:'INP_BONUS_END_GOLD',sharedFeatureIds:['FEAT_BONUS_END_SCREEN']}"] ,
 ["{researchEvidenceId:'RE_BONUS_END_RAINBOW',evidenceId:'EVI_BONUS_END_RAINBOW',inputId:'INP_BONUS_END_RAINBOW'}","{researchEvidenceId:'RE_BONUS_END_RAINBOW',evidenceId:'EVI_BONUS_END_RAINBOW',inputId:'INP_BONUS_END_RAINBOW',sharedFeatureIds:['FEAT_BONUS_END_SCREEN']}"] ,
];
for(const [from,to] of replacements){ if(fix.includes(from)) fix=fix.replace(from,to); }
write(fixPath,fix);

// 5) Regression test: require the explicit contract to survive compilation.
const testPath=path.join(ROOT,'test/shared-feature-evidence-input.test.mjs');
let test=read(testPath);
const anchor="  assert.equal(eviById.get('EVI_BONUS_END_RAINBOW')?.inputId,'INP_BONUS_END_RAINBOW');\n";
const addition="  assert.deepEqual(eviById.get('EVI_REI_MOON')?.sharedFeatureIds,['FEAT_REI_CHANCE_PICTURE']);\n  assert.deepEqual(eviById.get('EVI_BONUS_END_SILVER')?.sharedFeatureIds,['FEAT_BONUS_END_SCREEN']);\n";
if(!test.includes('sharedFeatureIds')) test=replaceOnce(test,anchor,anchor+addition,'shared feature/evidence test');
write(testPath,test);

// 6) Standard doc: record that safe sharing must be explicit/auditable.
const docPath=path.join(ROOT,'SHARED_FEATURE_EVIDENCE_INPUT_STANDARD.md');
if(fs.existsSync(docPath)){
  let doc=read(docPath);
  const note='\n## 監査契約\n\nFeature と Evidence が同じ入力を共有する場合、Selection Evidence に `sharedFeatureIds` を明示する。MachinePackageへ伝播した同契約が、対象Featureのイベント入力（分子/カテゴリ）と一致する場合のみPhase 9依存監査で安全な共有として扱う。フラグなし、別Feature指定、分母のみの共有は従来どおりHIGH_RISKとする。\n';
  if(!doc.includes('sharedFeatureIds')) doc+=note;
  write(docPath,doc);
}

console.log('SHARED FEATURE/EVIDENCE AUDIT CONTRACT MIGRATION: PASS');
