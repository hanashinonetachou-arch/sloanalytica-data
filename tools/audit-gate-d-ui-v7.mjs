#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
const ROOT=process.cwd();
const BATCH='20260908-manifest-v7-first10';
const IDS=['L_ANIMAL_SLOT_DOCCHI_ZT','L_BIG_DREAM_GOLDEN_PUSHER_KR','L_BIOHAZARD_RE3_ZD','L_TAKT_OP_DESTINY_M1','L_SUPER_RIO_ACE2_ND02H','L_BIRDIE_WING_BC','L_SAO2_PA1','L_SENGOKU_OTOME5_L8','L_DARK_HAIBI_SB','L_LOTIS_TN'];
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const errors=[]; const rows=[];
const jargon=/(^|[^A-Za-z])(Gate|Feature|Evidence|SelectionData|ResearchData|schemaVersion|inferenceRole|INCLUDE_PRIMARY|INCLUDE_SUPPORT|INCLUDE_FALLBACK|EXCLUDE)([^A-Za-z]|$)/i;
const vague=/有効な(?:ゲーム|G|区間|回数|状態|CZ|AT|ボーナス|小役)/;
const uniq=a=>[...new Set((a??[]).filter(Boolean))];
function executableInputIds(f){
 const ids=[];
 for(const key of ['denominatorInputId','numeratorInputId','conditionedOnInputId']) if(f[key]) ids.push(f[key]);
 for(const key of ['denominatorInputIds','numeratorInputIds','categoryInputIds']) ids.push(...(f[key]??[]));
 return uniq(ids);
}
for(const id of IDS){
 const dir=path.join(ROOT,'research',id); const sel=read(path.join(dir,'selection-data.json')); const ui=read(path.join(dir,'ui-design-data.json'));
 const visible=new Set(Object.values(ui.sections??{}).flatMap(s=>s.inputIds??[]));
 const evVisible=new Set(Object.values(ui.sections??{}).flatMap(s=>s.evidenceIds??[]));
 const groups=new Map((sel.evidenceUi?.groups??[]).map(g=>[g.groupId,g]));
 const evByGroup=new Map(Object.entries(ui.evidenceContracts??{}).map(([cid,c])=>[c.sourceEvidenceGroupId,cid]));
 let adopted=0;
 for(const f of sel.features??[]){
  const isAdopted=/^INCLUDE_/.test(f.adoptionCategory??'');
  const refs=executableInputIds(f);
  if(isAdopted){
   adopted++;
   for(const iid of refs) if(!visible.has(iid)) errors.push(`${id}/${f.featureId}: adopted executable input missing from UI: ${iid}`);
  } else {
   for(const iid of refs){
    if(!visible.has(iid)) continue;
    const sharedByAdopted=(sel.features??[]).some(o=>o!==f&&/^INCLUDE_/.test(o.adoptionCategory??'')&&executableInputIds(o).includes(iid));
    if(!sharedByAdopted) errors.push(`${id}/${f.featureId}: reject-only executable input visible: ${iid}`);
   }
  }
 }
 for(const g of groups.values()){const cid=evByGroup.get(g.groupId);if(!cid) errors.push(`${id}/${g.groupId}: Evidence group missing from canonical UI`); else if(!evVisible.has(cid)) errors.push(`${id}/${g.groupId}: Evidence contract not placed in a section`);}
 const placedInputs=[...Object.values(ui.sections??{}).flatMap(s=>s.inputIds??[])];
 if(new Set(placedInputs).size!==placedInputs.length) errors.push(`${id}: duplicate UI input placement`);
 for(const input of sel.inputs??[]){if(input.inferenceRole==='EXCLUDE'&&visible.has(input.id)) errors.push(`${id}/${input.id}: EXCLUDE input visible`);}
 const userStrings=[];
 for(const [name,s] of Object.entries(ui.sections??{})){userStrings.push(name,s.description??'');}
 for(const c of Object.values(ui.inputContracts??{})) userStrings.push(c.name??'');
 for(const c of Object.values(ui.evidenceContracts??{})) userStrings.push(c.label??'');
 for(const text of userStrings){if(jargon.test(String(text))) errors.push(`${id}: internal jargon in user UI: ${text}`);if(vague.test(String(text))) errors.push(`${id}: vague observation language: ${text}`);}
 const summary=sel.selectionSummaryContract;
 if(!summary) errors.push(`${id}: missing canonical selectionSummaryContract`);
 else {
  const integratedRejected=(sel.qualitativeDisposition??[]).filter(x=>x.integratedContribution===true&&x.userFacingRejected===true);
  if(integratedRejected.length) errors.push(`${id}: integrated primitive exposed as rejected`);
  if((summary.rejected??[]).some(x=>/Gate|Feature|Evidence|EXCLUDE/.test(JSON.stringify(x)))) errors.push(`${id}: internal jargon in rejected summary`);
 }
 const shared=new Map();
 for(const f of sel.features??[]){if(!/^INCLUDE_/.test(f.adoptionCategory??'')||!f.denominatorInputId) continue;if(!shared.has(f.denominatorInputId))shared.set(f.denominatorInputId,0);shared.set(f.denominatorInputId,shared.get(f.denominatorInputId)+1);}
 for(const [den,count] of shared){if(count>1&&placedInputs.filter(x=>x===den).length!==1) errors.push(`${id}/${den}: shared denominator must appear exactly once`);}
 rows.push({machineId:id,adoptedFeatures:adopted,evidenceGroups:groups.size,visibleInputs:visible.size,sections:ui.sectionOrder?.length??0});
}
const report={schemaVersion:'gate-d-ui-semantic-audit-v1',batchId:BATCH,status:errors.length?'FAIL':'PASS',machines:rows,summary:{machines:rows.length,adoptedFeatures:rows.reduce((a,x)=>a+x.adoptedFeatures,0),evidenceGroups:rows.reduce((a,x)=>a+x.evidenceGroups,0),visibleInputs:rows.reduce((a,x)=>a+x.visibleInputs,0),sections:rows.reduce((a,x)=>a+x.sections,0),errors:errors.length},errors};
fs.writeFileSync(path.join(ROOT,'batches',BATCH,'gate-d-ui-semantic-audit.json'),JSON.stringify(report,null,2)+'\n');
console.log(`Gate D UI semantic audit: ${report.status}`,JSON.stringify(report.summary));for(const e of errors) console.error(`ERROR: ${e}`);if(errors.length) process.exit(1);
