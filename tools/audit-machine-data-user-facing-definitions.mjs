import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? '.');
const researchDir = path.join(root, 'research');
const machinesDir = path.join(root, 'machines');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const exists = p => fs.existsSync(p);
const arr = v => Array.isArray(v) ? v : [];
const selected = f => ['INCLUDE_PRIMARY','INCLUDE_SUPPORT'].includes(f?.adoptionCategory);
const clean = v => String(v ?? '').replace(/\s+/g,' ').trim();
const firstHit = s => /(初当り|初当たり|初回当選)/.test(s ?? '');
const denominatorWords = /(通常|ゲーム|G数|分母|除外|対象|試行|CZ中|AT中|ボーナス中|非有利|有利区間)/;

const rows = [];
for (const d of fs.readdirSync(machinesDir,{withFileTypes:true}).filter(x=>x.isDirectory()).sort((a,b)=>a.name.localeCompare(b.name))) {
  const id=d.name, mp=path.join(machinesDir,id,'machine-package.json'), sp=path.join(researchDir,id,'selection-data.json');
  if(!exists(mp)||!exists(sp)) continue;
  const m=read(mp), s=read(sp), flags=[];
  const inputs=new Map(arr(s.inputs).map(x=>[x.id,x]));
  for(const f of arr(s.features).filter(selected)){
    const reason=clean(f.userReason);
    if(!reason) flags.push({severity:'HIGH',code:'ADOPTED_REASON_MISSING',featureId:f.featureId,detail:'採用Featureのユーザー向け採用理由がありません'});
    else if(reason.length<16) flags.push({severity:'REVIEW',code:'ADOPTED_REASON_TOO_SHORT',featureId:f.featureId,detail:`採用理由が短すぎます: ${reason}`});
  }
  for(const r of arr(s.rejectedElements)){
    const reason=clean(r.reason ?? r.rejectionReason ?? r.userReason);
    if(!reason) flags.push({severity:'HIGH',code:'REJECTED_REASON_MISSING',detail:`不採用要素「${r.name ?? r.label ?? r.featureId ?? 'unknown'}」に理由がありません`});
    else if(reason.length<6) flags.push({severity:'REVIEW',code:'REJECTED_REASON_TOO_SHORT',detail:`不採用理由が短すぎます: ${reason}`});
  }
  const firstInputs=arr(s.inputs).filter(x=>firstHit(x.name));
  for(const x of firstInputs){
    const desc=clean(x.description ?? x.helpText ?? x.note);
    const linked=arr(s.features).filter(f=>selected(f)&&[f.numeratorInputId,f.denominatorInputId,...arr(f.denominatorInputIds),...arr(f.categoryInputIds)].includes(x.id));
    const context=[desc,...linked.map(f=>clean(f.userReason)),...linked.map(f=>clean(f.difficultyExclusionReason))].join(' ');
    if(!desc) flags.push({severity:'REVIEW',code:'FIRST_HIT_INPUT_DESCRIPTION_MISSING',inputId:x.id,detail:`「${x.name}」に入力欄説明がありません`});
    if(linked.length && !denominatorWords.test(context)) flags.push({severity:'REVIEW',code:'FIRST_HIT_DENOMINATOR_CONTEXT_WEAK',inputId:x.id,featureIds:linked.map(f=>f.featureId),detail:`「${x.name}」の分母・対象区間がユーザー向け文言から判別しにくいです`});
  }
  const summary=m?.ui?.selectionSummary ?? m?.selectionSummary ?? null;
  if(!summary) flags.push({severity:'REVIEW',code:'SELECTION_SUMMARY_MISSING',detail:'採用/不採用サマリーが公開MachineDataに見つかりません'});
  const status=flags.some(f=>f.severity==='HIGH')?'HIGH_RISK':flags.length?'REVIEW':'PASS';
  rows.push({machineId:id,displayName:m?.machine?.displayName ?? id,status,flags});
}
const codes=[...new Set(rows.flatMap(r=>r.flags.map(f=>f.code)))].sort();
const summary={machineCount:rows.length,pass:rows.filter(r=>r.status==='PASS').length,review:rows.filter(r=>r.status==='REVIEW').length,highRisk:rows.filter(r=>r.status==='HIGH_RISK').length,flagCounts:Object.fromEntries(codes.map(c=>[c,rows.reduce((n,r)=>n+r.flags.filter(f=>f.code===c).length,0)]))};
const report={schemaVersion:'machine-data-user-facing-definitions-audit-v1',generatedAt:new Date().toISOString(),summary,machines:rows.sort((a,b)=>{const w=x=>x.status==='HIGH_RISK'?2:x.status==='REVIEW'?1:0;return w(b)-w(a)||b.flags.length-a.flags.length||a.machineId.localeCompare(b.machineId);})};
const outJson=path.resolve(process.argv[3] ?? path.join(root,'reports','machine-data-user-facing-definitions-audit-v1.json'));
const outMd=path.resolve(process.argv[4] ?? path.join(root,'reports','machine-data-user-facing-definitions-audit-v1.md'));
fs.mkdirSync(path.dirname(outJson),{recursive:true});
fs.writeFileSync(outJson,JSON.stringify(report,null,2)+'\n');
const md=['# MachineData User-facing Definitions Audit — v1','',`- Machines: ${summary.machineCount}`,`- PASS: ${summary.pass}`,`- REVIEW: ${summary.review}`,`- HIGH_RISK: ${summary.highRisk}`,'','## Flag counts','',...Object.entries(summary.flagCounts).map(([k,v])=>`- ${k}: ${v}`),'','## Priority','','| # | Machine | Status | Flags |','|---:|---|---|---|',...report.machines.filter(r=>r.status!=='PASS').slice(0,80).map((r,i)=>`| ${i+1} | ${r.displayName} (${r.machineId}) | ${r.status} | ${r.flags.map(f=>f.code).join(', ')} |`),'','## Interpretation','','- HIGH_RISK/REVIEWは文言・定義の再確認優先度であり、自動的に計算ロジックが誤りという意味ではありません。','- 初当りは、入力名だけでなく分母・対象区間・除外条件がユーザーに伝わるかを確認します。','- この監査はMachineDataを変更しません。'].join('\n')+'\n';
fs.writeFileSync(outMd,md);
console.log(`User-facing definitions audit: PASS ${summary.pass} / REVIEW ${summary.review} / HIGH_RISK ${summary.highRisk} / TOTAL ${summary.machineCount}`);
for(const r of report.machines.filter(r=>r.status!=='PASS').slice(0,60)) console.log(`${r.status}\t${r.flags.length}\t${r.machineId}\t${r.flags.map(f=>f.code).join(',')}`);
