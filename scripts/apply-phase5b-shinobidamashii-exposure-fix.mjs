import fs from 'node:fs';
import path from 'node:path';

const p = path.join(process.cwd(), 'research', 'L_SHINOBIDAMASHII3_A3', 'selection-data.json');
const s = JSON.parse(fs.readFileSync(p, 'utf8'));
const f = (s.features ?? []).find(x => x.featureId === 'FEAT_CHANCE_CZ');
if (!f) throw new Error('Missing FEAT_CHANCE_CZ');
if (f.difficultyParticipation !== 'INCLUDE') throw new Error('Expected FEAT_CHANCE_CZ Difficulty INCLUDE');
f.difficultyParticipation = 'EXCLUDE';
f.difficultyExclusionReason = '周期中チャンス目のCZ当選率は公開確認できるが、通常ゲーム数から周期中チャンス目成立回数への換算率を公開情報から一意に導出できないため、ゲーム数ベースDifficultyから除外。推測計算には採用する。';
delete f.difficultyExposure;
fs.writeFileSync(p, JSON.stringify(s, null, 2) + '\n');
console.log('Updated L_SHINOBIDAMASHII3_A3 / FEAT_CHANCE_CZ');
