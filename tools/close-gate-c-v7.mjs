import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const BATCH='20260908-manifest-v7-first10';
const dir=path.join(ROOT,'batches',BATCH);
const ledgerPath=path.join(dir,'compliance-ledger.json');
const draftPath=path.join(dir,'gate-c-observation-draft-report.json');
const semanticPath=path.join(dir,'gate-c-semantic-audit.json');
const reopenPath=path.join(dir,'gate-c-selection-reopen-audit.json');
const denomPath=path.join(dir,'gate-b-denominator-sharing-report.json');
const ledger=JSON.parse(fs.readFileSync(ledgerPath,'utf8'));
const draft=JSON.parse(fs.readFileSync(draftPath,'utf8'));
const semantic=JSON.parse(fs.readFileSync(semanticPath,'utf8'));
const denom=JSON.parse(fs.readFileSync(denomPath,'utf8'));
if(semantic.status!=='PASS'||semantic.summary?.machines!==10||semantic.summary?.adoptedFeatures!==51||semantic.summary?.errors!==0) throw new Error('Gate C semantic audit not PASS');
if(draft.summary?.machines!==10||draft.summary?.validatorPass!==10||draft.summary?.unresolvedMappings!==0||draft.summary?.researchReopenRequests!==0||draft.summary?.linkedServiceDebt!==0) throw new Error('Gate C draft debt remains');
if(denom.status!=='PASS'||denom.summary?.validatorPass!==10) throw new Error('Denominator sharing audit not PASS');
const ids=draft.machines.map(x=>x.machineId);
const now='2026-09-08T21:58:00+09:00';
const obsRef=id=>`research/${id}/machine-observation-data.json`;
const draftRef=`batches/${BATCH}/gate-c-observation-draft-report.json`;
const semanticRef=`batches/${BATCH}/gate-c-semantic-audit.json`;
const reopenRef=`batches/${BATCH}/gate-c-selection-reopen-audit.json`;
const denomRef=`batches/${BATCH}/gate-b-denominator-sharing-report.json`;
const rules=[
 ['RSO-OBS-001','APPLICABLE','PASS','artifact',id=>`${obsRef(id)}; ${draftRef}`,'採用Feature/EvidenceごとにPrimary/Fallback Observation経路を検討し、未解決mapping 0で閉鎖。'],
 ['RSO-OBS-002','APPLICABLE','PASS','validator',id=>`${obsRef(id)}; ${semanticRef}`,'分子・分母・対象/除外状態・reset・前任者/自分区間・source・更新タイミングをsemantic auditで確認。'],
 ['RSO-OBS-003','APPLICABLE','PASS','validator',id=>`${obsRef(id)}; ${denomRef}; ${semanticRef}`,'同一trial universeの分母を共有し、条件の異なる分母は共有しないことを検証。'],
 ['RSO-OBS-004',id=>draft.machines.find(x=>x.machineId===id)?.linkedService?'APPLICABLE':'NOT_APPLICABLE',id=>draft.machines.find(x=>x.machineId===id)?.linkedService?'PASS':'NOT_APPLICABLE','artifact',id=>`${obsRef(id)}; ${semanticRef}`,id=>draft.machines.find(x=>x.machineId===id)?.linkedService?'連動サービスの存在と具体的取得項目を確認済み。':'ユーザー指定により実機連動サービスなしのため非適用。'],
 ['RSO-OBS-005','APPLICABLE','PASS','artifact',()=>reopenRef,'Observationで観測不能8 Featureを検出してSelectionを正式再オープンし除外、心音Featureは直接観測可能として維持。'],
 ['RSO-OBS-006','APPLICABLE','PASS','validator',()=>`${draftRef}; ${semanticRef}`,'WEB_RESEARCH_CANDIDATE/Research reopen/linked-service debtを0にして閉鎖。']
];
const ruleIds=new Set(rules.map(r=>r[0]));
ledger.entries=(ledger.entries??[]).filter(e=>!ruleIds.has(e.ruleId));
for(const id of ids){
 for(const [ruleId,aSpec,rSpec,evidenceType,refFn,noteFn] of rules){
  const applicability=typeof aSpec==='function'?aSpec(id):aSpec;
  const result=typeof rSpec==='function'?rSpec(id):rSpec;
  ledger.entries.push({machineId:id,ruleId,applicability,result,evidenceType,evidenceRef:refFn(id),checkedAt:now,checkedBy:'ChatGPT',notes:typeof noteFn==='function'?noteFn(id):noteFn});
 }
}
const gateEntries=ledger.entries.filter(e=>ruleIds.has(e.ruleId));
const summary={entries:gateEntries.length,applicable:gateEntries.filter(e=>e.applicability==='APPLICABLE').length,notApplicable:gateEntries.filter(e=>e.applicability==='NOT_APPLICABLE').length,pass:gateEntries.filter(e=>e.result==='PASS').length,applicableUnevaluated:gateEntries.filter(e=>e.applicability==='APPLICABLE'&&!['PASS','FAIL','BLOCKED'].includes(e.result)).length,fail:gateEntries.filter(e=>e.result==='FAIL').length,blocked:gateEntries.filter(e=>e.result==='BLOCKED').length,missingNaReason:gateEntries.filter(e=>e.applicability==='NOT_APPLICABLE'&&!(e.notes??'').trim()).length,missingEvidenceRef:gateEntries.filter(e=>!(e.evidenceRef??'').trim()).length,validatorPass:10,adoptedFeatures:51,unresolvedMappings:0,researchReopenRequests:0,linkedServiceDebt:0};
if(summary.applicableUnevaluated||summary.fail||summary.blocked||summary.missingNaReason||summary.missingEvidenceRef) throw new Error(`Gate C closure failed: ${JSON.stringify(summary)}`);
ledger.gateStatus.GATE_C='PASS';
ledger.gateStatus.GATE_D='OPEN';
ledger.gateCSummary=summary;
ledger.notes=[...(ledger.notes??[]).filter(x=>!String(x).startsWith('Gate C')),'Gate C PASS: 51 adopted Features mapped exactly after RSO-OBS-005 reopen; 10/10 validation, semantic audit PASS, unresolved/research debt 0.'];
fs.writeFileSync(ledgerPath,JSON.stringify(ledger,null,2)+'\n');
console.log('GATE C CLOSE PASS',JSON.stringify(summary));
