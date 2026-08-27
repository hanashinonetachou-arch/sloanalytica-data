import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WORKSPACE = path.join(ROOT, 'selection-batch', 'SELECTION_20260827151959');
const IDS = [
  'S_MOMOKYUN_SWORD_DX',
  'S_SHIN_ORE_NO_SORA_ST',
  'S_MORE_CHIBARIYO_NB_30',
  'S_OKIDOKI_GOLD_GS',
  'L_SALARYMAN_KINTARO_ET',
  'L_NYANKO_DAISENSO_CHOSHINSOKU_KB',
  'L_NANATSU_NO_MAKEN_PU',
  'L_DISCUP_ULTRA_REMIX_XR',
  'L_STAR_HANAHANA_MX',
  'L_SHIN_EVANGELION',
];

for (const id of IDS) {
  const p = path.join(WORKSPACE, id, 'selection-data.json');
  if (!fs.existsSync(p)) throw new Error(`missing selection-data.json: ${id}`);
  const selection = JSON.parse(fs.readFileSync(p, 'utf8'));
  selection.evidenceReview = { policyVersion: 1, exclusions: [] };
  fs.writeFileSync(p, JSON.stringify(selection, null, 2) + '\n', 'utf8');
  console.log(`fixed evidenceReview: ${id}`);
}
