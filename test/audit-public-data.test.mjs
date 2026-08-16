import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { auditRepository, buildAuditReport, writeAuditReport } from '../tools/audit-public-data.mjs';

function writeFixture(mutator = () => {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sloanalytica-audit-'));
  const packagePath = path.join(root, 'machines', 'TEST_MACHINE', 'machine-package.json');
  fs.mkdirSync(path.dirname(packagePath), { recursive: true });
  const data = { machine: { machineId: 'TEST_MACHINE', machineDataVersion: '1.0.0', settings: ['SET_1', 'SET_6'] }, inputs: { inputs: [{ id: 'INP_GAMES' }, { id: 'INP_HITS' }] }, features: { features: [{ featureId: 'FEAT_BINOMIAL', modelType: 'binomial', calculationRole: 'PROBABILITY', probabilityEngineUsage: true, numeratorInputId: 'INP_HITS', denominatorInputId: 'INP_GAMES', probabilities: { SET_1: 0.1, SET_6: 0.2 } }] }, evidence: { evidences: [] }, ui: { sections: [{ items: [{ type: 'input', inputId: 'INP_GAMES' }] }] } };
  mutator(data);
  const bytes = Buffer.from(JSON.stringify(data)); fs.writeFileSync(packagePath, bytes);
  const catalog = { generatedAt: '2026-08-10T00:00:00Z', machines: [{ machineId: 'TEST_MACHINE', displayName: 'Test', manufacturer: 'Test', machineDataVersion: '1.0.0', packageUrl: 'https://example.test/machine-package.json', sha256: crypto.createHash('sha256').update(bytes).digest('hex'), packageSizeBytes: bytes.length, status: 'available', requiredCapabilities: ['binomial'] }] };
  fs.writeFileSync(path.join(root, 'catalog.json'), JSON.stringify(catalog)); return root;
}
function cleanup(root) { fs.rmSync(root, { recursive: true, force: true }); }
test('正常Fixtureは成功する', () => { const root = writeFixture(); try { assert.equal(auditRepository(root).errors.length, 0); } finally { cleanup(root); } });
test('古いSHA・サイズはエラーになる', () => { const root = writeFixture(); try { const catalog = JSON.parse(fs.readFileSync(path.join(root, 'catalog.json'))); catalog.machines[0].sha256 = '0'.repeat(64); catalog.machines[0].packageSizeBytes = 1; fs.writeFileSync(path.join(root, 'catalog.json'), JSON.stringify(catalog)); const errors = auditRepository(root).errors.map(x => x.message).join('\n'); assert.match(errors, /sha256が実ファイルと不一致/); assert.match(errors, /packageSizeBytesが実ファイルと不一致/); } finally { cleanup(root); } });
test('未定義入力・不正確率・不足Capabilityを検出する', () => { const root = writeFixture(data => { data.features.features[0].numeratorInputId = 'MISSING'; data.features.features[0].probabilities.SET_1 = 1.2; }); try { const errors = auditRepository(root).errors.map(x => x.message).join('\n'); assert.match(errors, /未定義の入力ID/); assert.match(errors, /確率は0以上1以下/); } finally { cleanup(root); } });
test('auto_accumulatorの壊れた定義を検出する', () => { const root = writeFixture(data => { data.ui.sections[0].items.push({ type: 'auto_accumulator', inputId: 'MISSING_OUT', config: { autoAccumulator: { selectionInputId: 'MISSING_SELECT', conditionInputId: 'MISSING_CONDITION', excludedValues: [99], conditionExcludedValues: [], minSelection: 1, maxSelection: 19 } } }); data.features.features[0].calculationRole = 'DISPLAY_ONLY'; data.features.features[0].probabilityEngineUsage = true; }); try { const errors = auditRepository(root).errors.map(x => x.message).join('\n'); assert.match(errors, /DISPLAY_ONLY/); assert.match(errors, /出力inputIdが未定義/); assert.match(errors, /selectionInputIdが未定義/); } finally { cleanup(root); } });
test('requiredCapabilities未記載でも安全にエラーとして報告する', () => { const root = writeFixture(); try { const catalogPath = path.join(root, 'catalog.json'); const catalog = JSON.parse(fs.readFileSync(catalogPath)); delete catalog.machines[0].requiredCapabilities; fs.writeFileSync(catalogPath, JSON.stringify(catalog)); const errors = auditRepository(root).errors.map(x => x.message).join('\n'); assert.match(errors, /必須フィールドrequiredCapabilitiesがありません/); assert.match(errors, /requiredCapabilitiesを宣言してください/); } finally { cleanup(root); } });


test('機械可読監査レポートを生成できる', () => {
  const root = writeFixture();
  try {
    const result = auditRepository(root);
    const report = buildAuditReport(result, '2026-08-10T12:00:00.000Z');
    assert.equal(report.reportVersion, '1.0.0');
    assert.equal(report.status, 'PASS');
    assert.deepEqual(report.summary, { machineCount: 1, errorCount: 0, warningCount: 0 });
    assert.deepEqual(report.errors, []);
    assert.deepEqual(report.warnings, []);
  } finally { cleanup(root); }
});

test('監査レポートJSONを書き出せる', () => {
  const root = writeFixture(data => { data.features.features[0].numeratorInputId = 'MISSING'; });
  try {
    const result = auditRepository(root);
    const outputPath = path.join(root, 'reports', 'audit-report.json');
    writeAuditReport(result, outputPath, '2026-08-10T12:00:00.000Z');
    const report = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    assert.equal(report.status, 'FAIL');
    assert.ok(report.summary.errorCount > 0);
    assert.match(report.errors.map(item => item.message).join('\n'), /未定義の入力ID/);
  } finally { cleanup(root); }
});

test('catalogのSHA・サイズが一致していてもCRLFの公開MachineDataを拒否する', () => {
  const root = writeFixture();
  try {
    const packagePath = path.join(root, 'machines', 'TEST_MACHINE', 'machine-package.json');
    const crlf = `${JSON.stringify(JSON.parse(fs.readFileSync(packagePath, 'utf8')), null, 2)}\r\n`.replace(/(?<!\r)\n/g, '\r\n');
    const bytes = Buffer.from(crlf, 'utf8');
    fs.writeFileSync(packagePath, bytes);
    const catalogPath = path.join(root, 'catalog.json');
    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    catalog.machines[0].sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
    catalog.machines[0].packageSizeBytes = bytes.length;
    fs.writeFileSync(catalogPath, JSON.stringify(catalog));
    const errors = auditRepository(root).errors.map(x => x.message).join('\n');
    assert.match(errors, /LF改行/);
  } finally { cleanup(root); }
});

test('feature_suppression requires a valid referenced feature and declared capability',()=>{
 const root=writeFixture(data=>{
   data.features.features.push({featureId:'FEAT_SECOND',modelType:'binomial',calculationRole:'PROBABILITY',probabilityEngineUsage:true,numeratorInputId:'INP_HITS',denominatorInputId:'INP_GAMES',probabilities:{SET_1:.1,SET_6:.2}});
   data.features.features[0].suppressedByFeatureIds=['FEAT_SECOND'];
 });
 try{
   let result=auditRepository(root);
   assert.ok(result.errors.some(x=>x.message.includes('feature_suppression')||x.message.includes('requiredCapabilities')));
   const catalogPath=path.join(root,'catalog.json'); const catalog=JSON.parse(fs.readFileSync(catalogPath,'utf8'));
   catalog.machines[0].requiredCapabilities.push('feature_suppression'); fs.writeFileSync(catalogPath,JSON.stringify(catalog));
   result=auditRepository(root); assert.equal(result.errors.length,0);
   const packagePath=path.join(root,'machines','TEST_MACHINE','machine-package.json'); const data=JSON.parse(fs.readFileSync(packagePath,'utf8'));
   data.features.features[0].suppressedByFeatureIds=['MISSING']; const bytes=Buffer.from(JSON.stringify(data)); fs.writeFileSync(packagePath,bytes);
   catalog.machines[0].sha256=crypto.createHash('sha256').update(bytes).digest('hex'); catalog.machines[0].packageSizeBytes=bytes.length; fs.writeFileSync(catalogPath,JSON.stringify(catalog));
   result=auditRepository(root); assert.ok(result.errors.some(x=>x.message.includes('未定義のFeature ID')));
 } finally { cleanup(root); }
});
