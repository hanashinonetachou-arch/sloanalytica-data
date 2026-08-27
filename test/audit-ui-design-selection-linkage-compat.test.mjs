import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const auditScript = path.join(repoRoot, 'tools', 'audit-ui-design-selection-linkage.mjs');

test('UI linkage treats omitted Selection evidence selectionMode as multi', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'slo-ui-linkage-'));
  const dir = path.join(root, 'research', 'TEST_MACHINE');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'selection-data.json'), JSON.stringify({
    schemaVersion: 'selection-data-v1', machineId: 'TEST_MACHINE', machineDataVersion: '0.1.0',
    inputs: [], features: [], evidenceUi: { groups: [{ groupId: 'EVID_TEST', label: 'Test', options: [] }] }
  }));
  fs.writeFileSync(path.join(dir, 'ui-design-data.json'), JSON.stringify({
    schemaVersion: 'ui-design-data-v1', machineId: 'TEST_MACHINE', status: 'PASS', sectionOrder: [], sections: {}, inputContracts: {},
    evidenceContracts: { EVID_TEST: { label: 'Test', selectionMode: 'multi', sourceEvidenceGroupId: 'EVID_TEST', inheritOptions: true } },
    unresolved: [], auditNotes: []
  }));
  const r = spawnSync(process.execPath, [auditScript, root], { encoding: 'utf8' });
  assert.equal(r.status, 0, `${r.stdout}\n${r.stderr}`);
  assert.match(r.stdout, /PASS/);
  fs.rmSync(root, { recursive: true, force: true });
});

test('UI linkage still rejects an explicit incompatible Selection evidence selectionMode', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'slo-ui-linkage-'));
  const dir = path.join(root, 'research', 'TEST_MACHINE');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'selection-data.json'), JSON.stringify({
    schemaVersion: 'selection-data-v1', machineId: 'TEST_MACHINE', machineDataVersion: '0.1.0',
    inputs: [], features: [], evidenceUi: { groups: [{ groupId: 'EVID_TEST', label: 'Test', selectionMode: 'single', options: [] }] }
  }));
  fs.writeFileSync(path.join(dir, 'ui-design-data.json'), JSON.stringify({
    schemaVersion: 'ui-design-data-v1', machineId: 'TEST_MACHINE', status: 'PASS', sectionOrder: [], sections: {}, inputContracts: {},
    evidenceContracts: { EVID_TEST: { label: 'Test', selectionMode: 'multi', sourceEvidenceGroupId: 'EVID_TEST', inheritOptions: true } },
    unresolved: [], auditNotes: []
  }));
  const r = spawnSync(process.execPath, [auditScript, root], { encoding: 'utf8' });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /selectionMode differs/);
  fs.rmSync(root, { recursive: true, force: true });
});
