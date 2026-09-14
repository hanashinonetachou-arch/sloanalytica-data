#!/usr/bin/env node
import {execSync} from 'node:child_process';
import fs from 'node:fs';
const ids=['L_MADOKA_FORTE_UU','L_TOKYO_GHOUL'];
const run=c=>execSync(c,{stdio:'inherit'});
run('node tools/migrate-evidence-ui-v2-review-final-batch4.mjs');
for(const id of ids){
  run(`node tools/validate-selection-data.mjs research/${id}/selection-data.json research/${id}/research-data.json`);
  run(`node tools/validate-machine-observation-data.mjs research/${id}/machine-observation-data.json`);
  run(`node tools/audit-ui-design-observation-linkage.mjs ${id} --strict-v2`);
  run(`node tools/four-layer-pipeline-gate.mjs ${id}`);
  run(`npm run machine:pipeline -- ${id} --check --skip-repo-checks`);
  run(`npm run machine:pipeline -- ${id} --skip-repo-checks`);
}
run('node tools/validate-ui-design-data.mjs .');
run('node tools/validate-evidence-ui-all.mjs');
for(const id of ids){
  run(`node tools/audit-ui-design-observation-linkage.mjs ${id} --strict-v2`);
  run(`node tools/four-layer-pipeline-gate.mjs ${id}`);
  const s=JSON.parse(fs.readFileSync(`research/${id}/selection-data.json`,'utf8'));
  if((s.evidenceUi?.groups??[]).some(g=>/^SETTING_|^DENIED_SETTINGS$|^PETIT_CHARACTER_DENIAL$/.test(g.groupId))) throw new Error(`${id}: legacy abstract Evidence groups remain`);
  const u=JSON.parse(fs.readFileSync(`research/${id}/ui-design-data.json`,'utf8'));
  if(Object.keys(u.inputContracts??{}).some(k=>k.startsWith('INP_EVI_'))) throw new Error(`${id}: legacy Evidence inputs remain`);
  const raw=fs.readFileSync(`machines/${id}/machine-package.json`,'utf8');
  if(/INP_EVI_/.test(raw)) throw new Error(`${id}: generated package contains legacy Evidence inputs`);
}
const mado=JSON.parse(fs.readFileSync('research/L_MADOKA_FORTE_UU/selection-data.json','utf8'));
if(JSON.stringify(mado.evidenceUi).includes('RE_VOICE_6')) throw new Error('Madoka RE_VOICE_6 still present in Evidence UI');
const tokyo=JSON.parse(fs.readFileSync('research/L_TOKYO_GHOUL/selection-data.json','utf8'));
if(JSON.stringify(tokyo.evidenceUi).includes('sourceEvidenceIds":[]')) throw new Error('Tokyo Ghoul source-less Evidence option remains');
console.log('Evidence UI v2 REVIEW final batch4: PASS');
