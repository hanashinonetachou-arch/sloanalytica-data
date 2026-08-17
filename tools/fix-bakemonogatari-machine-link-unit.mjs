import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const selectionPath = path.join(ROOT, 'research', 'L_SMASLO_BAKEMONOGATARI_KH', 'selection-data.json');
const selection = JSON.parse(fs.readFileSync(selectionPath, 'utf8'));

const target = (selection.features ?? []).find(f => f.featureId === 'FEAT_AT_FIRST_HIT');
if (!target) throw new Error('FEAT_AT_FIRST_HIT not found');
if (!target.requiredTrials || typeof target.requiredTrials !== 'object') throw new Error('FEAT_AT_FIRST_HIT.requiredTrials not found');

target.requiredTrials.unit = 'AT初当り抽選対象ゲーム';

fs.writeFileSync(selectionPath, JSON.stringify(selection, null, 2) + '\n', 'utf8');
console.log('Updated Bakemonogatari requiredTrials.unit to generic user-facing wording.');
