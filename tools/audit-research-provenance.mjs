import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? '.');
const researchRoot = path.join(root, 'research');
const arr = v => Array.isArray(v) ? v : [];
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const clean = v => String(v ?? '').replace(/\s+/g, ' ').trim();
const weakUrl = u => /(^|\.)example\.com\b|golden-fixture|fixture/i.test(u ?? '');
const weakPublisher = p => /(既存.*MachineData|Golden Data|fixture|テスト|再現)/i.test(p ?? '');
const realHttp = u => /^https?:\/\//i.test(u ?? '') && !weakUrl(u);
const selectedIds = s => new Set(arr(s?.features).filter(f => ['INCLUDE_PRIMARY','INCLUDE_SUPPORT'].includes(f?.adoptionCategory)).map(f => f.researchFeatureId).filter(Boolean));

const machines = [];
for (const ent of fs.readdirSync(researchRoot, { withFileTypes: true }).filter(x => x.isDirectory()).sort((a,b)=>a.name.localeCompare(b.name))) {
  const rp = path.join(researchRoot, ent.name, 'research-data.json');
  const sp = path.join(researchRoot, ent.name, 'selection-data.json');
  if (!fs.existsSync(rp)) continue;
  const r = read(rp);
  const s = fs.existsSync(sp) ? read(sp) : null;
  const src = arr(r.sources);
  const sourceMap = new Map(src.map(x => [x.sourceId, x]));
  const selected = selectedIds(s);
  const flags = [];
  const info = [];
  const usableSources = src.filter(x => realHttp(x.url) && !weakPublisher(x.publisher));

  if (!src.length) flags.push({ severity:'HIGH_RISK', code:'NO_RESEARCH_SOURCES', detail:'ResearchDataにsourcesがありません' });
  else if (!usableSources.length) flags.push({ severity:'HIGH_RISK', code:'NO_EXTERNAL_USABLE_SOURCE', detail:'ResearchDataがfixture/既存MachineData等だけで、外部の実出典を確認できません' });

  for (const f of arr(r.features)) {
    if (selected.size && !selected.has(f.researchFeatureId)) continue;
    const refs = arr(f.sourceRefs);
    const resolved = refs.map(id => sourceMap.get(id)).filter(Boolean);
    const usable = resolved.filter(x => realHttp(x.url) && !weakPublisher(x.publisher));
    if (!refs.length) flags.push({ severity:'HIGH_RISK', code:'ADOPTED_FEATURE_NO_SOURCE_REF', featureId:f.researchFeatureId, detail:`採用候補「${clean(f.name)}」にsourceRefsがありません` });
    else if (!usable.length) flags.push({ severity:'HIGH_RISK', code:'ADOPTED_FEATURE_ONLY_WEAK_SOURCE', featureId:f.researchFeatureId, sourceRefs:refs, detail:`採用Feature「${clean(f.name)}」がfixture/既存MachineData等だけに依存しています` });
    else if (usable.length === 1 || f.crossSourceStatus === 'single_source') info.push({ code:'ADOPTED_FEATURE_SINGLE_EXTERNAL_SOURCE', featureId:f.researchFeatureId, sourceRefs:usable.map(x=>x.sourceId) });
  }

  for (const e of arr(r.evidenceCandidates)) {
    const refs = arr(e.sourceRefs);
    const usable = refs.map(id => sourceMap.get(id)).filter(x => x && realHttp(x.url) && !weakPublisher(x.publisher));
    if (refs.length && !usable.length) flags.push({ severity:'REVIEW', code:'EVIDENCE_ONLY_WEAK_SOURCE', evidenceId:e.evidenceId ?? e.researchEvidenceId, detail:`Evidence候補「${clean(e.name)}」がfixture/既存MachineData等だけに依存しています` });
  }

  const domains = [...new Set(usableSources.map(x => { try { return new URL(x.url).hostname.replace(/^www\./,''); } catch { return null; } }).filter(Boolean))];
  if (usableSources.length && domains.length === 1) info.push({ code:'RESEARCH_SINGLE_DOMAIN', domain:domains[0] });
  const status = flags.some(x=>x.severity==='HIGH_RISK') ? 'HIGH_RISK' : flags.length ? 'REVIEW' : 'PASS';
  machines.push({ machineId:r?.machine?.machineId ?? ent.name, displayName:r?.machine?.displayName ?? ent.name, status, externalSourceCount:usableSources.length, externalDomains:domains, flags, info });
}

const codes=[...new Set(machines.flatMap(m=>m.flags.map(f=>f.code)))].sort();
const summary={machineCount:machines.length,pass:machines.filter(m=>m.status==='PASS').length,review:machines.filter(m=>m.status==='REVIEW').length,highRisk:machines.filter(m=>m.status==='HIGH_RISK').length,flagCounts:Object.fromEntries(codes.map(c=>[c,machines.reduce((n,m)=>n+m.flags.filter(f=>f.code===c).length,0)])),singleExternalSourceFeatures:machines.reduce((n,m)=>n+m.info.filter(x=>x.code==='ADOPTED_FEATURE_SINGLE_EXTERNAL_SOURCE').length,0),singleDomainMachines:machines.filter(m=>m.info.some(x=>x.code==='RESEARCH_SINGLE_DOMAIN')).length};
const rank=x=>x.status==='HIGH_RISK'?2:x.status==='REVIEW'?1:0;
machines.sort((a,b)=>rank(b)-rank(a)||b.flags.length-a.flags.length||a.externalSourceCount-b.externalSourceCount||a.machineId.localeCompare(b.machineId));
const report={schemaVersion:'research-provenance-audit-v1',generatedAt:new Date().toISOString(),summary,machines};
const jp=path.join(root,'reports','research-provenance-audit-v1.json');
const mp=path.join(root,'reports','research-provenance-audit-v1.md');
fs.mkdirSync(path.dirname(jp),{recursive:true});
fs.writeFileSync(jp,JSON.stringify(report,null,2)+'\n');
const md=['# Research Provenance Audit — v1','',`- Machines: ${summary.machineCount}`,`- PASS: ${summary.pass}`,`- REVIEW: ${summary.review}`,`- HIGH_RISK: ${summary.highRisk}`,`- Adopted Features with only one external source: ${summary.singleExternalSourceFeatures}`,`- Machines with one external domain: ${summary.singleDomainMachines}`,'','## Flag counts','',...Object.entries(summary.flagCounts).map(([k,v])=>`- ${k}: ${v}`),'','## Priority','','| # | Machine | Status | External sources | Domains | Flags |','|---:|---|---|---:|---|---|',...machines.filter(m=>m.status!=='PASS').slice(0,80).map((m,i)=>`| ${i+1} | ${m.displayName} (${m.machineId}) | ${m.status} | ${m.externalSourceCount} | ${m.externalDomains.join(', ')} | ${m.flags.map(f=>f.code).join(', ')} |`),'','## Interpretation','','- HIGH_RISKは、採用Featureの根拠が外部の実出典まで遡れない候補です。ResearchDataをWeb再調査して出典を補強する優先対象です。','- single_source / single domain は自動的な誤りではないためINFO扱いです。複数ソース照合できる情報は後続で優先的に補強します。','- メーカー公式1ソースしか存在しない確定情報などは、単一ソースでも問題ない場合があります。','- この監査はResearchData/MachineDataを変更しません。'].join('\n')+'\n';
fs.writeFileSync(mp,md);
console.log(`Research provenance audit: PASS ${summary.pass} / REVIEW ${summary.review} / HIGH_RISK ${summary.highRisk} / TOTAL ${summary.machineCount}`);
for(const m of machines.filter(m=>m.status!=='PASS').slice(0,80)) console.log(`${m.status}\t${m.machineId}\text=${m.externalSourceCount}\t${m.flags.map(f=>f.code).join(',')}`);
