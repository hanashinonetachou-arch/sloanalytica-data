#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
const ROOT=process.cwd();
const BATCH='20260910-next10-v7';
const IDS=['L_YABACHIBA_ZM','L_NANGOKU_SPECIAL_M1','L_SENGOKU_COLLECTION6_KS','L_KARAKURI_CIRCUS2_JG','L_ULTRAMAN_FINAL_BATTLE_ME','L_WORLD_DAI_STAR_PA3','L_YAJIKITA_MAIRU_BG','L_TONDEMO_SKILL_KM','LB_TRIPLE_CROWN_X300','L_TOARU_INDEX2_FA'];
const read=f=>JSON.parse(fs.readFileSync(f,'utf8')); const errors=[]; const rows=[];
const jargon=/(^|[^A-Za-z])(Gate|Feature|Evidence|SelectionData|ResearchData|schemaVersion|inferenceRole|INCLUDE_PRIMARY|INCLUDE_SUPPORT|INCLUDE_FALLBACK|EXCLUDE)([^A-Za-z]|$)/i;
const vague=/有効な(?:ゲーム|G|区間|回数|状態|CZ|AT|ボーナス|小役)/;
const uniq=a=>[...new Set((a??[]).filter(Boolean))];
function executableInputIds(f){const ids=[];for(const k of ['denominatorInputId','numeratorInputId','conditionedOnInputId'])if(f[k])ids.push(f[k]);for(const k of ['denominatorInputIds','numeratorInputIds','categoryInputIds'])ids.push(...(f[k]??[]));return uniq(ids);}
for(const id of IDS){
 const dir=path.join(ROOT,'research',id),sel=read(path.join(dir,'selection-data.json')),ui=read(path.join(dir,'ui-design-data.json'));
 const visible=new Set(Object.values(ui.sections??{}).flatMap(s=>s.inputIds??[])); const evVisible=new Set(Object.values(ui.sections??{}).flatMap(s=>s.evidenceIds??[]));
 const groups=new Map((sel.evidenceUi?.groups??[]).map(g=>[g.groupId,g])); const evByGroup=new Map(Object.entries(ui.evidenceContracts??{}).map(([cid,c])=>[c.sourceEvidenceGroupId,cid])); let adopted=0,small=0,large=0;
 if(ui.generatedFrom?.manifest!=='SloAnalytica_MachineData_UX_Construction_Manifest_v7_1') errors.push(`${id}: UX manifest must be v7_1`);
 for(const f of sel.features??[]){const active=/^INCLUDE_/.test(f.adoptionCategory??'');const refs=executableInputIds(f);if(active){adopted++;for(const iid of refs)if(!visible.has(iid))errors.push(`${id}/${f.featureId}: active executable input missing: ${iid}`);}else for(const iid of refs){if(!visible.has(iid))continue;const shared=(sel.features??[]).some(o=>o!==f&&/^INCLUDE_/.test(o.adoptionCategory??'')&&executableInputIds(o).includes(iid));if(!shared)errors.push(`${id}/${f.featureId}: excluded-only input visible: ${iid}`);}}
 for(const g of groups.values()){const cid=evByGroup.get(g.groupId);if(!cid)errors.push(`${id}/${g.groupId}: evidence contract missing`);else if(!evVisible.has(cid))errors.push(`${id}/${g.groupId}: evidence not placed`);}
 const placed=[...Object.values(ui.sections??{}).flatMap(s=>s.inputIds??[])]; if(new Set(placed).size!==placed.length)errors.push(`${id}: duplicate UI input placement`);
 for(const [iid,c] of Object.entries(ui.inputContracts??{})){
   if(!visible.has(iid)) continue;
   if(c.mode!=='NUMBER'&&c.mode!=='SELECT') errors.push(`${id}/${iid}: current batch inputs must use NUMBER or SELECT, got ${c.mode}`);
   if(c.mode==='NUMBER'&&c.directInput!==true) errors.push(`${id}/${iid}: NUMBER must allow directInput`);
   if(c.mode==='NUMBER'){
     const isLarge=/ゲーム数|G数|プレイ数/.test(c.name??''); const expected=isLarge?50:1;
     if(JSON.stringify(c.quickAdd)!==JSON.stringify([expected])) errors.push(`${id}/${iid}: quickAdd must be [${expected}] for ${isLarge?'large game':'small-count'} input`);
     if(c.gridSpan!==12) errors.push(`${id}/${iid}: gridSpan 12 required to prioritize label readability`);
     if(isLarge)large++;else small++;
   }
 }
 for(const text of [...Object.entries(ui.sections??{}).flatMap(([n,s])=>[n,s.description??'']),...Object.values(ui.inputContracts??{}).map(c=>c.name??''),...Object.values(ui.evidenceContracts??{}).map(c=>c.label??'')]){if(jargon.test(String(text)))errors.push(`${id}: internal jargon in user UI: ${text}`);if(vague.test(String(text)))errors.push(`${id}: vague observation language: ${text}`);}
 const shared=new Map();for(const f of sel.features??[]){if(!/^INCLUDE_/.test(f.adoptionCategory??'')||!f.denominatorInputId)continue;shared.set(f.denominatorInputId,(shared.get(f.denominatorInputId)??0)+1);}for(const [den,count]of shared)if(count>1&&placed.filter(x=>x===den).length!==1)errors.push(`${id}/${den}: shared denominator must appear once`);
 rows.push({machineId:id,activeFeatures:adopted,evidenceGroups:groups.size,visibleInputs:visible.size,sections:ui.sectionOrder?.length??0,smallNumberInputs:small,largeNumberInputs:large});
}
const report={schemaVersion:'gate-d-ui-semantic-audit-v1',batchId:BATCH,checkedAt:'2026-09-11T01:34:00+09:00',manifest:'UX_v7.1',status:errors.length?'FAIL':'PASS',machines:rows,summary:{machines:rows.length,activeFeatures:rows.reduce((a,x)=>a+x.activeFeatures,0),evidenceGroups:rows.reduce((a,x)=>a+x.evidenceGroups,0),visibleInputs:rows.reduce((a,x)=>a+x.visibleInputs,0),sections:rows.reduce((a,x)=>a+x.sections,0),smallNumberInputs:rows.reduce((a,x)=>a+x.smallNumberInputs,0),largeNumberInputs:rows.reduce((a,x)=>a+x.largeNumberInputs,0),errors:errors.length},errors};
fs.writeFileSync(path.join(ROOT,'batches',BATCH,'gate-d-ui-semantic-audit.json'),JSON.stringify(report,null,2)+'\n'); console.log(`Gate D UI semantic audit: ${report.status}`,JSON.stringify(report.summary));for(const e of errors)console.error(`ERROR: ${e}`);if(errors.length)process.exit(1);
