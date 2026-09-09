import fs from 'node:fs';

const paths = [
  'research/L_BIG_DREAM_GOLDEN_PUSHER_KR/machine-observation-data.json',
  'research/L_SUPER_RIO_ACE2_ND02H/machine-observation-data.json',
];

for (const p of paths) {
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  for (const mapping of data.featureMappings ?? []) {
    if (mapping.featureId === 'FEAT_GC_END_SCREEN' || mapping.featureId === 'FEAT_RINA_SIGN') {
      mapping.collectionMethods = ['MANUAL_COUNTER'];
    }
  }
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
}

console.log('PASS observation collection methods normalized to schema-supported MANUAL_COUNTER');
