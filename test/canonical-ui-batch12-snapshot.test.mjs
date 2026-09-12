import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ids = [
  'L_KAGUYA_SAMA_JA',
  'L_KEIJI_SADO_ER',
  'L_KENGAN_ASHURA_ND',
  'L_KING_PULSAR_SLCC',
  'L_MADOKA_FORTE_UU',
  'L_MONKEY_TURN5_CE',
  'L_MUSHOKU_TENSEI_NM',
  'L_RING_NI_KAKERO1_FS',
  'L_SENGOKU_BASARA_GIGA_ZE',
  'L_SENGOKU_COLLECTION5_GJ',
];
const read = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

test('diagnostic canonical UI batch12 source snapshot', () => {
  for (const machineId of ids) {
    const pkg = read(`machines/${machineId}/machine-package.json`);
    const selection = read(`research/${machineId}/selection-data.json`);
    const observationPath = path.join(ROOT, 'research', machineId, 'machine-observation-data.json');
    const observation = fs.existsSync(observationPath) ? JSON.parse(fs.readFileSync(observationPath, 'utf8')) : null;
    const inputs = (pkg.inputs?.inputs ?? []).map(({id,name,type,description,options}) => ({id,name,type,description,options}));
    const snapshot = {
      machineId,
      machineDataVersion: pkg.machine?.machineDataVersion,
      ui: pkg.ui,
      inputs,
      selectionEvidenceUi: selection.evidenceUi ?? selection.evidenceUI ?? null,
      selectionEvidenceGroups: selection.evidenceGroups ?? selection.evidences ?? null,
      packageEvidence: pkg.evidence ?? null,
      observation: observation ? {schemaVersion: observation.schemaVersion, status: observation.status} : null,
    };
    console.log(`CANONICAL_UI_SOURCE ${machineId} ${JSON.stringify(snapshot)}`);
  }
});
