#!/usr/bin/env node
// Phase 11: user-facing labels / explanations audit. Structural gate; semantic reviews stay REVIEW, never guessed.
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(process.argv[2]??'.');
const out=path.resolve(process.argv[3]??path.join(root,'reports','phase11-user-facing-audit.json'));
const machinesDir=path.join(root,'machines');
const dirs=fs.readdirSync(machinesDir,{withFileTypes:true}).filter(d=>d.isDirectory()).map(d=>d.name).sort();
const rows=[];
const badLabel=/^(input|counter|games?|count|value|feature|item|項目|入力|カウント)$/i;
const vagueReason=/^(低頻度|設定差が小さい|必要試行量が多い|参考|不採用)[。.]?$/;
const needsStandaloneDenominator=f=>{
 const model=String(f.modelType??'').toLowerCase();
 if(['multinomial','marginal_multinomial','conditional_partial_multinomial','categoricalselector','categorical_selector'].includes(model)) return false;
 if(f.inputTransform==='sum_inputs_to_trials') return false;
 if(Array.isArray(f.denominatorInputIds)&&f.denominatorInputIds.length>0) return false;
 return true;
};
for(const machineId of dirs){
 const file=path.join(machinesDir,machineId,'machine-package.json'); if(!fs.existsSync(file)) continue;
 const p=JSON.parse(fs.readFileSync(file,'utf8')); const errors=[]; const reviews=[];
 const inputs=p.inputs?.inputs??[]; const inputMap=new Map(inputs.map(x=>[x.id,x]));
 for(const i of inputs){ const n=String(i.name??'').trim(); if(!n||badLabel.test(n)) errors.push(`input ${i.id}: missing/generic name`); }
 for(const s of p.ui?.sections??[]){
   if(!String(s.title??'').trim()) errors.push(`section ${s.id??'(unknown)'}: missing title`);
   for(const it of s.items??[]){ if(it.type==='input'){
     if(!inputMap.has(it.inputId)) errors.push(`UI ${s.id}: unknown input ${it.inputId}`);
     const label=String(it.label??'').trim(); if(!label||badLabel.test(label)) errors.push(`UI ${it.inputId}: missing/generic label`);
   }}
 }
 const sum=p.selectionSummary??{};
 for(const x of sum.selected??[]){ if(!String(x.reason??'').trim()) errors.push(`selected ${x.featureId}: missing reason`); }
 for(const x of sum.rejected??[]){ const r=String(x.reason??'').trim(); if(!r) errors.push(`rejected ${x.featureId}: missing reason`); else if(vagueReason.test(r)) reviews.push(`rejected ${x.featureId}: reason may be too generic: ${r}`); }
 // Only models that truly use one independent denominator require denominatorInputId.
 // Multinomial/category-sum models derive trials from their category counts and must not be false-positive REVIEWs.
 for(const f of p.features?.features??[]){
   const n=String(f.name??'');
   if(!/初当り|当選|直撃|引き戻し|小役|ベル|チェリー|スイカ|ボーナス|BONUS|CZ|AT|REG|BIG/i.test(n)) continue;
   if(!needsStandaloneDenominator(f)) continue;
   const denom=inputMap.get(f.denominatorInputId)?.name??'';
   if(!String(denom).trim()) reviews.push(`feature ${f.featureId}: denominator label not directly resolvable`);
 }
 rows.push({machineId,displayName:p.machine?.displayName??machineId,status:errors.length?'ERROR':reviews.length?'REVIEW':'PASS',errors,reviews});
}
const summary={machineCount:rows.length,pass:rows.filter(x=>x.status==='PASS').length,review:rows.filter(x=>x.status==='REVIEW').length,error:rows.filter(x=>x.status==='ERROR').length};
fs.mkdirSync(path.dirname(out),{recursive:true}); fs.writeFileSync(out,JSON.stringify({schemaVersion:'phase11-user-facing-audit-v1',generatedAt:new Date().toISOString(),summary,machines:rows},null,2)+'\n');
console.log(`Phase 11 User-facing Audit: PASS ${summary.pass} / REVIEW ${summary.review} / ERROR ${summary.error} / TOTAL ${summary.machineCount}`);
for(const r of rows.filter(x=>x.status!=='PASS')) console.log(`${r.status}\t${r.machineId}\t${[...r.errors,...r.reviews].join('; ')}`);
if(summary.error) process.exit(1);
