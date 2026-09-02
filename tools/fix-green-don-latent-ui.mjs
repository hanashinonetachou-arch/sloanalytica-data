import fs from 'node:fs';

const file = 'research/L_MIDORIDON_VIVA_REVIVAL_FY/ui-design-data.json';
const ui = JSON.parse(fs.readFileSync(file, 'utf8'));
const excluded = new Set([
  'INP_HIGH_TRANSITION_COUNT', 'INP_HIGH_TRANSITION_TRIALS',
  'INP_NORMAL_BONUS_WEAK_CHERRY_COUNT', 'INP_NORMAL_BONUS_WEAK_CHERRY_TRIALS',
  'INP_NORMAL_BONUS_WEAK_WAVE_COUNT', 'INP_NORMAL_BONUS_WEAK_WAVE_TRIALS',
  'INP_NORMAL_BONUS_CHANCE_COUNT', 'INP_NORMAL_BONUS_CHANCE_TRIALS',
  'INP_NORMAL_BONUS_STRONG_CHERRY_COUNT', 'INP_NORMAL_BONUS_STRONG_CHERRY_TRIALS',
  'INP_NORMAL_BONUS_STRONG_WAVE_COUNT', 'INP_NORMAL_BONUS_STRONG_WAVE_TRIALS',
  'INP_HIGH_BONUS_WEAK_WAVE_COUNT', 'INP_HIGH_BONUS_WEAK_WAVE_TRIALS',
]);

for (const id of excluded) delete ui.inputContracts?.[id];
const keepTitles = [];
for (const title of ui.sectionOrder ?? []) {
  const section = ui.sections?.[title];
  if (!section) continue;
  const ids = section.inputIds ?? [];
  if (ids.length && ids.every((id) => excluded.has(id))) {
    delete ui.sections[title];
    continue;
  }
  section.inputIds = ids.filter((id) => !excluded.has(id));
  keepTitles.push(title);
}
ui.sectionOrder = keepTitles;
fs.writeFileSync(file, `${JSON.stringify(ui, null, 2)}\n`);
console.log('Removed Green Don latent-state-only inputs and sections from UI Design.');
