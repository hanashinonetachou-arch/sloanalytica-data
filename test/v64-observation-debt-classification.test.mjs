import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

test('all observation debt is classified without weakening inference gates',()=>{
  const r=spawnSync(process.execPath,['tools/classify-v64-observation-debt.mjs'],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr||r.stdout);
  const audit=JSON.parse(fs.readFileSync('reports/v64-observation-trial-universe-audit.json','utf8'));
  const report=JSON.parse(fs.readFileSync('reports/v64-observation-debt-classification.json','utf8'));
  assert.equal(report.summary.totalDebt,audit.severityCounts.DEBT);
  assert.equal(report.summary.buckets.MACHINE_REQUIRED,audit.issueCounts.HIGH_PRIORITY_FIELD_VERIFICATION_PENDING);
  assert.ok((report.summary.buckets.WEB_RESEARCH_CANDIDATE??0)>0);
  assert.ok((report.summary.buckets.LOW_PRIORITY_HOLD??0)>0);
  assert.ok(report.items.every(x=>['MACHINE_REQUIRED','WEB_RESEARCH_CANDIDATE','LOW_PRIORITY_HOLD'].includes(x.bucket)));
});
