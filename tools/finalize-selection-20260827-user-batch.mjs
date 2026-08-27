import { spawnSync } from 'node:child_process';
import path from 'node:path';

const ROOT = process.cwd();
const WORKSPACE = 'selection-batch/SELECTION_20260827151959';
const IDS = [
  'S_MOMOKYUN_SWORD_DX',
  'S_SHIN_ORE_NO_SORA_ST',
  'S_MORE_CHIBARIYO_NB_30',
  'S_OKIDOKI_GOLD_GS',
  'L_SALARYMAN_KINTARO_ET',
  'L_NYANKO_DAISENSO_CHOSHINSOKU_KB',
  'L_NANATSU_NO_MAKEN_PU',
  'L_DISCUP_ULTRA_REMIX_XR',
  'L_STAR_HANAHANA_MX',
  'L_SHIN_EVANGELION',
];

function run(label, args) {
  console.log(`\n=== ${label} ===`);
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(npm, args, { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.error) throw result.error;
  if ((result.status ?? 1) !== 0) {
    console.error(`\nSTOP: ${label} failed (exit ${result.status}). No later mutation was executed.`);
    process.exit(result.status ?? 1);
  }
}

run('Selection batch check', ['run','selection:batch','--','--ingest',WORKSPACE,'--check']);

for (const id of IDS) {
  run(`Selection validate ${id}`, [
    'run','selection:validate','--',
    path.join(WORKSPACE,id,'selection-data.json'),
    path.join('research',id,'research-data.json'),
  ]);
}

run('Regression tests', ['test']);
run('Selection formal ingest', ['run','selection:batch','--','--ingest',WORKSPACE]);

console.log('\nSELECTION FINALIZE PASS');
console.log('SelectionData has been ingested into research/<MACHINE_ID>/selection-data.json for all 10 machines.');
console.log('Next: inspect git status, commit/push the ingested SelectionData, then proceed to Observation.');
