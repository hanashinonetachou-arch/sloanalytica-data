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
const explicitGameBasis = s => /(通常.*ゲーム|通常G|ゲーム数|対象G|試行G|有効G|着席時ゲーム|総ゲーム)/.test(s ?? '');
const genericReason = s => /^(設定差(が)?ある(ため)?|設定差あり|主軸採用|補助採用|採用|利用)(。)?$/.test(clean(s));
const isFirstHitRate = f => f?.displayFormat === 'ratio_1_over_n';

const rows = [];
for (const d of fs.readdirSync(machinesDir,{withFileTypes:true}).filter(x=>x.isDirectory()).sort((a,b)=>a.name.localeCompare(b.name))) {
  const id=d.name, mp=path.join(machinesDir,id,'machine-package.json'), sp=path.join(researchDir,id,'selection-data.json');
  if(!exists(mp)||!exists(sp)) continue;
  const m=read(mp), s=read(sp), flags=[], info=[];
  const inputs=new Map(arr(s.inputs).map(x=>[x.id,x]));
  for(const f of arr(s.features).filter(selected)){
    const reason=clean(f.userReason);
    if(!reason) flags.push({severity:'HIGH',code:'ADOPTED_REASON_MISSING',featureId:f.featureId,detail:'採用Featureのユーザー向け採用理由がありません'});
    else if(genericReason(reason)) flags.push({severity:'REVIEW',code:'ADOPTED_REASON_GENERIC',featureId:f.featureId,detail:`採用理由が抽象的です: ${reason}`});
  }
  for(const r of arr(s.rejectedElements)){
    const reason=clean(r.reason ?? r.rejectionReason ?? r.userReason);
    if(!reason) flags.push({severity:'HIGH',code:'REJECTED_REASON_MISSING',detail:`不採用要素「${r.name ?? r.label ?? r.featureId ?? 'unknown'}」に理由がありません`});
  }
  for(const x of arr(s.inputs).filter(x=>firstHit(x.name))){
    const linked=arr(s.features).filter(f=>selected(f)&&f.numeratorInputId===x.id&&isFirstHitRate(f));
    if(!linked.length) continue;
    for(const f of linked){
      const denomId=f.denominatorInputId;
      const denom=denomId?inputs.get(denomId):null;
      const denomName=clean(denom?.name);
      const context=[clean(x.description),clean(f.userReason),clean(f.difficultyExclusionReason),denomName].join(' ');
      if(!denomId){
        flags.push({severity:'HIGH',code:'FIRST_HIT_RATE_DENOMINATOR_MISSING',inputId:x.id,featureId:f.featureId,detail:`「${x.name}」を1/○○で評価する採用Featureに分母入力がありません`});
      } else if(!denom || (!explicitGameBasis(denomName) && !/(分母|対象|除外|通常|ゲーム|G数)/.test(context))){
        flags.push({severity:'REVIEW',code:'FIRST_HIT_RATE_DENOMINATOR_CONTEXT_WEAK',inputId:x.id,featureId:f.featureId,denominatorInputId:denomId,detail:`「${x.name}」の1/○○分母「${denomName || denomId}」の対象区間がユーザー向け文言から判別しにくいです`});
      }
      if(!clean(x.description)) info.push({code:'FIRST_HIT_RATE_DESCRIPTION_ABSENT',inputId:x.id,featureId:f.featureId});
    }
  }
  const summary=m?.ui?.selectionSummary ?? m?.selectionSummary ?? null;
  if(!summary) flags.push({severity:'REVIEW',code:'SELECTION_SUMMARY_MISSING',detail:'採用/不採用サマリーが公開MachineDataに見つかりません'});
  const status=flags.some(f=>f.severity==='HIGH')?'HIGH_RISK':flags.length?'REVIEW':'PASS';
  rows.push({machineId:id,displayName:m?.machine?.displayName ?? id,status,flags,info});
}
const codes=[...new Set(rows.flatMap(r=>r.flags.map(f=>f.code)))].sort();
const summary={machineCount:rows.length,pass:rows.filter(r=>r.status==='PASS').length,review:rows.filter(r=>r.status==='REVIEW').length,highRisk:rows.filter(r=>r.status==='HIGH_RISK').length,flagCounts:Object.fromEntries(codes.map(c=>[c,rows.reduce((n,r)=>n+r.flags.filter(f=>f.code===c).length,0)]))};
const report={schemaVersion:'machine-data-user-facing-definitions-audit-v3',generatedAt:new Date().toISOString(),summary,machines:rows.sort((a,b)=>{const w=x=>x.status==='HIGH_RISK'?2:x.status==='REVIEW'?1:0;return w(b)-w(a)||b.flags.length-a.flags.length||a.machineId.localeCompare(b.machineId);})};
const outJson=path.resolve(process.argv[3] ?? path.join(root,'reports','machine-data-user-facing-definitions-audit-v3.json'));
const outMd=path.resolve(process.argv[4] ?? path.join(root,'reports','machine-data-user-facing-definitions-audit-v3.md'));
fs.mkdirSync(path.dirname(outJson),{recursive:true});
fs.writeFileSync(outJson,JSON.stringify(report,null,2)+'\n');
const md=['# MachineData User-facing Definitions Audit — v3','',`- Machines: ${summary.machineCount}`,`- PASS: ${summary.pass}`,`- REVIEW: ${summary.review}`,`- HIGH_RISK: ${summary.highRisk}`,'','## Flag counts','',...Object.entries(summary.flagCounts).map(([k,v])=>`- ${k}: ${v}`),'','## Priority','','| # | Machine | Status | Flags |','|---:|---|---|---|',...report.machines.filter(r=>r.status!=='PASS').slice(0,80).map((r,i)=>`| ${i+1} | ${r.displayName} (${r.machineId}) | ${r.status} | ${r.flags.map(f=>f.code).join(', ')} |`),'','## Interpretation','','- HIGH_RISK/REVIEWは文言・定義の再確認優先度であり、自動的に計算ロジックが誤りという意味ではありません。','- 「初当り」を使う入力でも、構成比・選択率（percent）はゲーム数分母監査の対象外です。','- 1/○○形式の初当り確率だけ、分母Inputと対象区間の明確さを検査します。','- 短い理由を一律に悪いとせず、内容が抽象語だけの場合に限定して警告します。','- この監査はMachineDataを変更しません。'].join('\n')+'\n';
fs.writeFileSync(outMd,md);
console.log(`User-facing definitions audit v3: PASS ${summary.pass} / REVIEW ${summary.review} / HIGH_RISK ${summary.highRisk} / TOTAL ${summary.machineCount}`);
for(const r of report.machines.filter(r=>r.status!=='PASS').slice(0,60)) console.log(`${r.status}\t${r.flags.length}\t${r.machineId}\t${r.flags.map(f=>f.code).join(',')}`);
