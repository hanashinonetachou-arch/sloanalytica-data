#!/usr/bin/env node
import { execSync } from 'node:child_process';

const ids = ['L_MAHJONG_FIGHT_CLUB_KAKUSEI_KM','L_RING_NI_KAKERO1_FS','L_BAKI_L3','L_GOLDEN_KAMUY_KR','L_TOARU_INDEX_JC'];
const run = cmd => execSync(cmd,{stdio:'inherit'});

run('node tools/migrate-evidence-ui-v2-batch7.mjs');
for (const id of ids) {
  run(`node tools/validate-selection-data.mjs research/${id}/selection-data.json research/${id}/research-data.json`);
  run(`node tools/validate-machine-observation-data.mjs research/${id}/machine-observation-data.json`);
}
run('node tools/validate-ui-design-data.mjs .');
for (const id of ids) {
  run(`node tools/audit-ui-design-observation-linkage.mjs ${id} --strict-v2`);
  run(`node tools/four-layer-pipeline-gate.mjs ${id}`);
  run(`npm run machine:pipeline -- ${id} --check --skip-repo-checks`);
}
for (const id of ids) run(`npm run machine:pipeline -- ${id} --skip-repo-checks`);
run('node tools/validate-evidence-ui-all.mjs');
run('node tools/validate-ui-design-data.mjs .');
for (const id of ids) {
  run(`node tools/audit-ui-design-observation-linkage.mjs ${id} --strict-v2`);
  run(`node tools/four-layer-pipeline-gate.mjs ${id}`);
}
for (const id of ids) {
  for (const p of [`machines/${id}/machine-package.json`,`research/${id}/statistics-report.json`,`research/${id}/difficulty-report.json`,`research/${id}/setting-band-report.json`]) {
    if (!requireFile(p)) throw new Error(`missing generated artifact: ${p}`);
  }
}
for (const p of ['catalog.json','difficulty-catalog.json','machine-registry.json']) if (!requireFile(p)) throw new Error(`missing generated artifact: ${p}`);

function requireFile(p) {
  try { return !!execSync(`test -s '${p}' && echo ok`,{encoding:'utf8'}).trim(); } catch { return false; }
}
