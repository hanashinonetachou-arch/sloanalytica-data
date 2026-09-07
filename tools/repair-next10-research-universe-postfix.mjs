import fs from 'node:fs';
const p='research/L_UMINEKO_2_A1/selection-data.json';
const s=JSON.parse(fs.readFileSync(p,'utf8'));
const logo=s.features.find(x=>x.researchFeatureId==='RF_LOGO_FLASH');
if(logo) logo.normalizeRoundedCategoryProbabilities=true;
const miss=s.features.find(x=>x.researchFeatureId==='RF_ART_MISS');
if(miss&&miss.adoptionCategory==='EXCLUDE'){
  delete miss.numeratorInputId;
  delete miss.denominatorInputId;
  delete miss.denominatorInputIds;
  delete miss.categoryInputIds;
}
fs.writeFileSync(p,JSON.stringify(s,null,2)+'\n');
console.log('Next10 repair warnings normalized.');
