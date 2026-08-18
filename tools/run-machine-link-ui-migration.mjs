import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const machines = [
  'L_HANABI_KM',
  'LB_AREX_BRIGHT_BA',
  'LB_FUJIKO_M2',
  'LB_ISEKAI_QUARTET_KR',
  'LB_KELLOT_5_ND05H',
  'LB_THUNDER_V_HA',
  'L_INITIAL_D_2ND',
  'L_SMASLO_BAKEMONOGATARI_KH',
  'S_EUREKA_SEVEN_HIEVO_XS',
];

function runNode(args, label) {
  const r = spawnSync(process.execPath, args, { cwd: ROOT, stdio: 'inherit' });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`${label} failed with exit code ${r.status}`);
}
function runNpm(args, label) {
  const npmExecPath = process.env.npm_execpath;
  if (npmExecPath) {
    const r = spawnSync(process.execPath, [npmExecPath, ...args], { cwd: ROOT, stdio: 'inherit' });
    if (r.error) throw r.error;
    if (r.status !== 0) throw new Error(`${label} failed with exit code ${r.status}`);
    return;
  }
  const command = process.platform === 'win32' ? (process.env.ComSpec || 'cmd.exe') : 'npm';
  const commandArgs = process.platform === 'win32'
    ? ['/d', '/s', '/c', `npm ${args.join(' ')}`]
    : args;
  const r = spawnSync(command, commandArgs, { cwd: ROOT, stdio: 'inherit' });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`${label} failed with exit code ${r.status}`);
}

try {
  runNode(['tools/migrate-machine-link-ui-wording.mjs'], 'wording migration');
  for (const machineId of machines) {
    console.log(`\n=== PIPELINE ${machineId} ===`);
    runNpm(['run', 'machine:pipeline', '--', machineId], `pipeline ${machineId}`);
  }
  console.log('\n=== USER-FACING SERVICE NAME AUDIT ===');
  runNpm(['run', 'audit:ui-service-names'], 'user-facing service-name audit');
  console.log('\nMIGRATION PASS: machine-linked UI wording');
} catch (error) {
  console.error(`MIGRATION FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
