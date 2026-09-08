#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { validateSelectionData } from './validate-selection-data.mjs';
const ROOT=process.cwd();
const BATCH='20260908-manifest-v7-first10';
const IDS=['L_ANIMAL_SLOT_DOCCHI_ZT','L_BIG_DREAM_GOLDEN_PUSHER_KR','L_BIOHAZARD_RE3_ZD','L_TAKT_OP_DESTINY_M1','L_SUPER_RIO_ACE2_ND02H','L_BIRDIE_WING_BC','L_SAO2_PA1','L_SENGOKU_OTOME5_L8','L_DARK_HAIBI_SB','L_LOTIS_TN'];
const replacements=[
 [/Gate Bでは数値採用しない/g,'数値推測には使用しない'],
 [/Gate C終了前に再調査または実機連動画面で確認する/g,'公開情報で未解決のため、追加確認が必要'],
 [/主Feature/g,'主な推測要素'],
 [/Fallback/g,'補助経路'],
 [/確定Evidence/g,'設定確定情報']
];
const clean=s=>{let x=String(s??'');for(const [a,b] of replacements)x=x.replace(a,b);return x;};
let changed=0; const rows=[];
for(const id of IDS){
 const dir=path.join(ROOT,'research',id); const sp=path.join(dir,'selection-data.json'); const rp=path.join(dir,'research-data.json');
 const s=JSON.parse(fs.readFileSync(sp,'utf8')); const r=JSON.parse(fs.readFileSync(rp,'utf8')); let c=0;
 for(const f of s.features??[]){for(const k of ['userReason','userFacingReason'])if(typeof f[k]==='string'){const n=clean(f[k]);if(n!==f[k]){f[k]=n;c++;}}}
 for(const q of s.qualitativeDisposition??[]){if(typeof q.reason==='string'){const n=clean(q.reason);if(n!==q.reason){q.reason=n;c++;}}}
 for(const list of [s.selectionSummaryContract?.selected??[],s.selectionSummaryContract?.rejected??[]])for(const x of list){if(typeof x.reason==='string'){const n=clean(x.reason);if(n!==x.reason){x.reason=n;c++;}}}
 const v=validateSelectionData(s,r);if(!v.ok)throw new Error(`${id}: Selection validation failed after language normalization: ${v.errors.join('; ')}`);
 if(c){fs.writeFileSync(sp,JSON.stringify(s,null,2)+'\n');changed+=c;} rows.push({machineId:id,changedFields:c,validator:'PASS'});
}
const report={schemaVersion:'selection-user-language-normalization-v1',batchId:BATCH,status:'PASS',machines:rows,summary:{machines:10,changedFields:changed},errors:[]};
fs.writeFileSync(path.join(ROOT,'batches',BATCH,'selection-user-language-normalization-report.json'),JSON.stringify(report,null,2)+'\n');
console.log('Selection user-language normalization PASS',JSON.stringify(report.summary));
