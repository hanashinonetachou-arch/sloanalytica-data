import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ids = [
  'LB_AREX_BRIGHT_BA',
  'LB_KELLOT_5_ND05H',
  'LB_MAGICAL_HALLOWEEN_GS',
  'LB_NEW_KING_HANAHANA_V_PF',
  'LB_SHAKE_BONUS_TRIGGER_A1',
  'L_DRAGON_HANAHANA_SENKO_JP',
  'L_GEN_CHOMUGEN_PH',
  'L_HANABI_KM',
  'L_HIGURASHI_GOU_SS',
  'L_HOKUTO_AD_XR',
];
const read = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

test('diagnostic canonical UI batch11 source snapshot', () => {
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
