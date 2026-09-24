import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {auditSelectionPolicyMigration} from '../tools/audit-selection-policy-migration.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

// This is a Legacy compatibility surface. Its baseline currently contains three
// unresolved migration-audit items on prototype-multi-machine. V8 work must not
// increase that debt; resolving it belongs to the Legacy migration stream.
const LEGACY_BASELINE={blocked:3,review:0};

test('legacy selection migration audit does not regress beyond the established baseline',()=>{
  const r=auditSelectionPolicyMigration(root,{excludeMachineIds:['L_LOVEJOU3_M4','L_MUSHOKU_TENSEI_NM','S_REVUE_STARLIGHT_CX']});
  assert.ok(r.summary.blocked<=LEGACY_BASELINE.blocked,
    `Legacy blocked regression: ${r.summary.blocked} > ${LEGACY_BASELINE.blocked}`);
  assert.ok(r.summary.review<=LEGACY_BASELINE.review,
    `Legacy review regression: ${r.summary.review} > ${LEGACY_BASELINE.review}`);
  for(const m of r.machines){
    for(const d of m.reviewedDiffs??[]) assert.equal(d.reviewStatus,'APPROVED_SAFETY_REMOVAL',m.machineId);
  }
});
