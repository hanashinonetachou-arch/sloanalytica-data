import fs from 'node:fs';

const checkpointPath = 'reports/machine-identity-classification-batch-19.json';
const checkpoint = JSON.parse(fs.readFileSync(checkpointPath, 'utf8'));

for (const entry of checkpoint.entries ?? []) {
  const researchPath = `research/${entry.machineId}/research-data.json`;
  const data = JSON.parse(fs.readFileSync(researchPath, 'utf8'));
  if (data.machine?.introductionDate !== entry.introductionDate) {
    throw new Error(`${entry.machineId}: Research introductionDate mismatch: ${data.machine?.introductionDate} != ${entry.introductionDate}`);
  }
  data.machine.machineType = entry.machineType;
  data.machine.gameType = entry.gameType;
  fs.writeFileSync(researchPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function replaceExactlyOnce(path, before, after) {
  let text = fs.readFileSync(path, 'utf8');
  const first = text.indexOf(before);
  if (first < 0) throw new Error(`${path}: insertion point not found`);
  if (text.indexOf(before, first + before.length) >= 0) throw new Error(`${path}: insertion point is ambiguous`);
  text = text.replace(before, after);
  fs.writeFileSync(path, text, 'utf8');
}

replaceExactlyOnce(
  'tools/build-machine-data.mjs',
  `    settings:research.machine.settings,\n    ...(Array.isArray(research.machine.inferenceSettings)?{inferenceSettings:research.machine.inferenceSettings}:{}),\n    packagePolicy:{offlineCapable:true,containsImages:false,containsExecutableCode:false}\n`,
  `    settings:research.machine.settings,\n    ...(Array.isArray(research.machine.inferenceSettings)?{inferenceSettings:research.machine.inferenceSettings}:{}),\n    ...(research.machine.introductionDate?{introductionDate:research.machine.introductionDate}:{}),\n    ...(research.machine.machineType?{machineType:research.machine.machineType}:{}),\n    ...(research.machine.gameType?{gameType:research.machine.gameType}:{}),\n    packagePolicy:{offlineCapable:true,containsImages:false,containsExecutableCode:false}\n`
);

replaceExactlyOnce(
  'tools/publish-machine-data.mjs',
  `   machineDataVersion:pkg.machine?.machineDataVersion,\n   ...(existing?.minimumAppVersionCode!==undefined?{minimumAppVersionCode:existing.minimumAppVersionCode}:{}),\n`,
  `   machineDataVersion:pkg.machine?.machineDataVersion,\n   ...((pkg.machine?.introductionDate ?? existing?.introductionDate)?{introductionDate:pkg.machine?.introductionDate ?? existing?.introductionDate}:{}),\n   ...((pkg.machine?.machineType ?? existing?.machineType)?{machineType:pkg.machine?.machineType ?? existing?.machineType}:{}),\n   ...((pkg.machine?.gameType ?? existing?.gameType)?{gameType:pkg.machine?.gameType ?? existing?.gameType}:{}),\n   ...(existing?.minimumAppVersionCode!==undefined?{minimumAppVersionCode:existing.minimumAppVersionCode}:{}),\n`
);

console.log(`Batch identity continuity applied: ${checkpoint.entries?.length ?? 0} machines`);
