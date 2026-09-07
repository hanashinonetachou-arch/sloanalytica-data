import fs from 'node:fs';
for(const [p,ids] of [
  ['research/L_FIRE_FORCE_2/selection-data.json',['RF_BONUS_END_REG_GROUP','RF_BONUS_END_ENEN']],
  ['research/L_KYOKOU_SUIRI_ST/selection-data.json',['RF_BONUS_END_SCREEN']]
]){
  const s=JSON.parse(fs.readFileSync(p,'utf8'));
  for(const id of ids){
    const f=s.features.find(x=>x.researchFeatureId===id);
    if(f) delete f.normalizeRoundedCategoryProbabilities;
  }
  fs.writeFileSync(p,JSON.stringify(s,null,2)+'\n');
}
console.log('Hard-evidence category conditioning separated from rounding normalization.');
