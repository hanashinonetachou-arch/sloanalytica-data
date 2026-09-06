import fs from 'node:fs';

const ids = [
  'L_AZURLANE_THE_ANIMATION_KN','L_DRUAGA_NO_TOU_ZA','L_SMASLO_TOKYO_REVENGERS_ZF','L_BABEL_BA','L_SHIN_ONIMUSHA_3_SA',
  'L_ZENIGATA_5_L2','L_TOARU_KAGAKU_NO_RAILGUN_2_FV','L_ZETTAI_SHOGEKI_FORCE_FH','L_KAKUMEIKI_VALVRAVE_2_JF','L_NEO_PLANET_SLED'
];
for (const id of ids) {
  const ui = JSON.parse(fs.readFileSync(`research/${id}/ui-design-data.json`, 'utf8'));
  const sel = JSON.parse(fs.readFileSync(`research/${id}/selection-data.json`, 'utf8'));
  const inputs = new Map((sel.inputs ?? []).map(x => [x.id, x]));
  console.log(`\n=== ${id} ===`);
  for (const title of ui.sectionOrder ?? []) {
    const s = ui.sections?.[title];
    console.log(`SECTION: ${title}`);
    console.log(`  section: ${s?.description ?? '(none)'}`);
    for (const inputId of s?.inputIds ?? []) {
      const i = inputs.get(inputId);
      console.log(`  ${inputId} / ${i?.name ?? '(missing)'}: ${i?.description ?? '(none)'}`);
    }
  }
}
