#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const reportPath=path.join(ROOT,'reports','cross-sectional-v7-audit.json');
const mdPath=path.join(ROOT,'reports','CROSS_SECTIONAL_V7_AUDIT.md');
const report=JSON.parse(fs.readFileSync(reportPath,'utf8'));

const blockedCodes=new Set([
  'MISSING_PACKAGE','MISSING_RESEARCH','MISSING_SELECTION',
  'RESEARCH_JSON_INVALID','SELECTION_JSON_INVALID','PACKAGE_JSON_INVALID',
  'RESEARCH_MACHINE_ID_MISMATCH','SELECTION_MACHINE_ID_MISMATCH','PACKAGE_MACHINE_ID_MISMATCH',
  'SELECTION_VALIDATION','SELECTION_INPUT_REF_MISSING'
]);
const researchCodes=new Set([
  'MISSING_OBSERVATION','OBSERVATION_LEGACY_V1','OPEN_RESEARCH_REOPEN',
  'ADOPTED_FEATURE_NO_OBSERVATION_MAPPING','ADOPTED_FEATURE_OBSERVATION_UNUSABLE'
]);
const fixReviewCodes=new Set(['USER_FACING_INTERNAL_TERM','UI_REVIEW_PENDING']);

for(const r of report.results){
  const codes=new Set(r.issues.map(x=>x.code));
  const hasBlocked=[...codes].some(c=>blockedCodes.has(c)||c.startsWith('RESEARCH_')&&!c.startsWith('RESEARCH_WARNING_'));
  const hasResearch=[...codes].some(c=>researchCodes.has(c));
  const hasFix=r.issues.some(x=>x.severity==='HARD')||[...codes].some(c=>fixReviewCodes.has(c));
  r.classification=hasBlocked?'BLOCKED':hasResearch?'RESEARCH_REOPEN':hasFix?'FIX':'GREEN';
}

const classes=['GREEN','FIX','RESEARCH_REOPEN','BLOCKED'];
report.schemaVersion='cross-sectional-v7-audit-v2';
report.classificationCounts=Object.fromEntries(classes.map(c=>[c,report.results.filter(r=>r.classification===c).length]));
report.fieldVerification={
  pendingMachines:report.results.filter(r=>r.metrics?.fieldVerificationWaiting>0).length,
  pendingItems:report.results.reduce((n,r)=>n+(r.metrics?.fieldVerificationWaiting??0),0),
  policy:'Residual field-verification items are secondary metadata and do not determine primary audit classification. Audit and remediation continue using currently available Research, Selection, Observation, UI and public sources.'
};
report.classificationPolicy={
  priority:['BLOCKED','RESEARCH_REOPEN','FIX','GREEN'],
  note:'FIELD_VERIFY is not a primary stop state. Device-only residual questions remain recorded separately while all web/AI-resolvable and structural work proceeds now.'
};
fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');

const coverage=report.coverage;
const issueCounts=report.issueCounts;
const rows=report.results.map(r=>`| ${r.machineId} | ${r.classification} | ${r.coverage.research?'✓':'—'} | ${r.coverage.selection?'✓':'—'} | ${r.coverage.observation?'✓':'—'} | ${r.coverage.ui?'✓':'—'} | ${r.coverage.package?'✓':'—'} | ${r.metrics?.fieldVerificationWaiting??0} | ${r.issues.map(x=>x.code).join(', ')||'—'} |`);
const topIssues=Object.entries(issueCounts).slice(0,20).map(([k,v])=>`- ${k}: ${v}`).join('\n')||'- none';
const c=report.classificationCounts;
const md=`# SloAnalytica Cross-sectional Audit v7\n\nGenerated: ${report.generatedAt}\n\n## Policy\n\n実機確認待ちは代表分類を停止させない。Web・既存資料・構造監査で解決できる項目は先に処理し、本当に実機でしか確認できない残件だけを secondary metadata として保持する。\n\n## Summary\n\n- Canonical machines: ${report.canonicalMachineCount}\n- GREEN: ${c.GREEN}\n- FIX: ${c.FIX}\n- RESEARCH_REOPEN: ${c.RESEARCH_REOPEN}\n- BLOCKED: ${c.BLOCKED}\n- Field verification residual: ${report.fieldVerification.pendingItems} items / ${report.fieldVerification.pendingMachines} machines\n\n## Four-layer coverage\n\n- Research: ${coverage.research}/${report.canonicalMachineCount}\n- Selection: ${coverage.selection}/${report.canonicalMachineCount}\n- Observation: ${coverage.observation}/${report.canonicalMachineCount}\n- UI Design: ${coverage.ui}/${report.canonicalMachineCount}\n- MachinePackage: ${coverage.package}/${report.canonicalMachineCount}\n\n## Top issues\n\n${topIssues}\n\n## Machine matrix\n\n| machineId | class | Research | Selection | Observation | UI | Package | field residual | issues |\n|---|---|---:|---:|---:|---:|---:|---:|---|\n${rows.join('\n')}\n`;
fs.writeFileSync(mdPath,md);
console.log(JSON.stringify({classificationCounts:report.classificationCounts,fieldVerification:report.fieldVerification,coverage:report.coverage},null,2));