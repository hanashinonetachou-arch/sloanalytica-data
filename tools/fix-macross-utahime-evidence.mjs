import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const selectionPath = path.join(ROOT, 'research', 'L_MACROSS_FRONTIER4_BA', 'selection-data.json');
const selection = JSON.parse(fs.readFileSync(selectionPath, 'utf8'));
const floor = selection.evidenceUi?.groups?.find(group => group.groupId === 'SETTING_FLOOR');
if (!floor) throw new Error('SETTING_FLOOR group not found');

let set6 = floor.options?.find(option => option.value === 'SET_6');
if (!set6) {
  set6 = {
    value: 'SET_6',
    label: '設定6',
    allowedSettings: ['SET_6'],
    sourceEvidenceIds: [],
  };
  floor.options ??= [];
  floor.options.push(set6);
}
set6.sourceEvidenceIds ??= [];
if (!set6.sourceEvidenceIds.includes('RE_UTAHIME_END_6')) set6.sourceEvidenceIds.push('RE_UTAHIME_END_6');

fs.writeFileSync(selectionPath, JSON.stringify(selection, null, 2) + '\n', 'utf8');
console.log('Fixed Macross Frontier 4 SET_6 evidence disposition.');
