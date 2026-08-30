#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_ID = 'S_REVUE_STARLIGHT_CX';
const TEST_ID = 'S_REVUE_STARLIGHT_CX_TEST_V66';
const SOURCE_NAME = 'L少女☆歌劇 レヴュースタァライト -The SLOT-';
const TEST_NAME = '【テスト版】L少女☆歌劇 レヴュースタァライト -The SLOT-';
const sourceDir = path.join(ROOT, 'research', SOURCE_ID);
const targetDir = path.join(ROOT, 'research', TEST_ID);

function die(message) { console.error(`ERROR: ${message}`); process.exit(1); }
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJson(file, value) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8'); }
function branchName() {
  try { return execFileSync('git', ['branch', '--show-current'], { cwd: ROOT, encoding: 'utf8' }).trim(); }
  catch { return ''; }
}
function retargetIdentity(value) {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) { value.forEach(retargetIdentity); return value; }
  for (const [key, child] of Object.entries(value)) {
    if (key === 'machineId' && child === SOURCE_ID) value[key] = TEST_ID;
    else if ((key === 'displayName' || key === 'formalName') && child === SOURCE_NAME) value[key] = TEST_NAME;
    else if (typeof child === 'string') {
      if (key !== 'url' && key !== 'packageUrl') value[key] = child.replaceAll(`research/${SOURCE_ID}/`, `research/${TEST_ID}/`);
    } else retargetIdentity(child);
  }
  return value;
}

const force = process.argv.includes('--force');
const branch = branchName();
if (branch === 'main') die('mainではテスト機種を生成しません。prototype/experiment branchで実行してください。');
if (!fs.existsSync(sourceDir)) die(`source research directory not found: ${SOURCE_ID}`);

const generatedCoreFiles = [
  'research-data.json',
  'selection-data.json',
  'machine-observation-data.json',
  'ui-design-data.json'
];
const existingCoreFiles = generatedCoreFiles.filter(name => fs.existsSync(path.join(targetDir, name)));
if (existingCoreFiles.length && !force) {
  die(`${TEST_ID} core scaffold already exists (${existingCoreFiles.join(', ')}). Re-run with --force only when intentionally rebuilding the test clone.`);
}
if (fs.existsSync(targetDir) && force) {
  for (const name of generatedCoreFiles) fs.rmSync(path.join(targetDir, name), { force: true });
}
fs.mkdirSync(targetDir, { recursive: true });

for (const name of generatedCoreFiles) {
  const source = path.join(sourceDir, name);
  if (!fs.existsSync(source)) die(`required source file missing: ${source}`);
  const data = retargetIdentity(readJson(source));
  if (name === 'research-data.json') {
    data.researchedAt = '2026-08-30';
    data.machine.displayName = TEST_NAME;
    data.machine.formalName = SOURCE_NAME;
    data.conflicts ??= [];
    data.conflicts.push({
      conflictId: 'TEST_V66_DEPENDENCY_REVIEW',
      status: 'OPEN_FOR_EXPERIMENT',
      note: 'v6.6 Dependency Review用の別Machine。原機種の公開データは変更せず、CZ→AT生成経路とconditional/joint候補を検証する。'
    });
  }
  if (name === 'selection-data.json') {
    data.machineDataVersion = '0.1.0';
    data.testVariant = {
      kind: 'RSO_V6_6_DEPENDENCY_EXPERIMENT',
      sourceMachineId: SOURCE_ID,
      rule: '原機種と独立登録し、CZ/AT依存関係とUI変更をこのMachineだけで検証する。'
    };
  }
  if (name === 'machine-observation-data.json') {
    data.researchedAt = '2026-08-30';
    data.notes = [
      ...(Array.isArray(data.notes) ? data.notes : []),
      'TEST_V66: 原機種のObservation v2を初期ベースラインとして複製。CZ成功/失敗・AT経路の追加観測はDependency Review後にこのテスト機種のみへ追加する。'
    ];
  }
  if (name === 'ui-design-data.json') {
    data.status = 'DRAFT';
    if (data.generatedFrom) delete data.generatedFrom.referenceLock;
    data.unresolved = Array.from(new Set([...(data.unresolved ?? []), 'TEST_V66_UI_REDESIGN_PENDING']));
    data.auditNotes = [
      ...(data.auditNotes ?? []),
      '原機種のUSER_VERIFIED UIを初期比較用ベースラインとして複製。テスト機種はUI Lock対象外で、CZ/AT依存関係に合わせて変更してよい。'
    ];
  }
  writeJson(path.join(targetDir, name), data);
}

const experimentSource = path.join(sourceDir, 'conditional-model-experiment-v66.json');
if (fs.existsSync(experimentSource)) {
  const experiment = retargetIdentity(readJson(experimentSource));
  experiment.machineId = TEST_ID;
  experiment.sourceMachineId = SOURCE_ID;
  experiment.status = 'ACTIVE_TEST_MACHINE_RESEARCH';
  experiment.purpose = '【テスト版】Machine上でv6.6 Dependency Review・conditional/joint候補・UI変更を実機比較する。原機種は変更しない。';
  writeJson(path.join(targetDir, 'conditional-model-experiment-v66.json'), experiment);
}

writeJson(path.join(targetDir, 'test-machine-meta.json'), {
  schemaVersion: 'test-machine-meta-v1',
  machineId: TEST_ID,
  displayName: TEST_NAME,
  sourceMachineId: SOURCE_ID,
  createdAt: '2026-08-30',
  policyBasis: ['Core Policy v1.4', 'RSO Manifest v6.6', 'UX Manifest v6.6'],
  publishScope: 'PROTOTYPE_ONLY',
  productionMachineMustRemainUntouched: true,
  goals: [
    'CZ初当りとAT初当りの依存関係をv6.6で再Selectionする',
    'CZ成功率の引き強/引き弱がposteriorへ与える影響を比較する',
    '必要ならconditional/joint model用入力・UIを試験する',
    '最終的に原機種へ移植する変更だけを選別する'
  ]
});

console.log(`TEST MACHINE SCAFFOLD CREATED: ${TEST_ID}`);
console.log(`  source: ${SOURCE_ID}`);
console.log(`  branch: ${branch || '(unknown)'}`);
console.log('Next: npm run pipeline:four-layer:gate -- S_REVUE_STARLIGHT_CX_TEST_V66');
console.log('Then: npm run machine:pipeline -- S_REVUE_STARLIGHT_CX_TEST_V66 --skip-repo-checks');
console.log('Do not publish to main. After review, publish only to prototype-multi-machine.');
