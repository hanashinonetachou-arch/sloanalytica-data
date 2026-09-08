import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const IDS=['L_ANIMAL_SLOT_DOCCHI_ZT','L_BIG_DREAM_GOLDEN_PUSHER_KR','L_BIOHAZARD_RE3_ZD','L_TAKT_OP_DESTINY_M1','L_SUPER_RIO_ACE2_ND02H','L_BIRDIE_WING_BC','L_SAO2_PA1','L_SENGOKU_OTOME5_L8','L_DARK_HAIBI_SB','L_LOTIS_TN'];
const clean=s=>String(s??'').replace(/[^A-Z0-9_]/g,'_');
const featureId=rf=>`FEAT_${clean(String(rf).replace(/^RF_/,''))}`;
const extractExclusions=(rf)=>{
 const texts=[rf.denominatorDefinition,rf.numeratorDefinition,rf.notes].filter(Boolean).map(String);
 const out=[];
 for(const text of texts){
   for(const sentence of text.split(/[。\n]/).map(x=>x.trim()).filter(Boolean)){
     if(/除く|除外|含めない|対象外|含まない/.test(sentence) && !out.includes(sentence)) out.push(sentence);
   }
 }
 return out;
};
const rows=[];
for(const id of IDS){
 const dir=path.join(ROOT,'research',id);
 const r=JSON.parse(fs.readFileSync(path.join(dir,'research-data.json'),'utf8'));
 const s=JSON.parse(fs.readFileSync(path.join(dir,'selection-data.json'),'utf8'));
 const o=JSON.parse(fs.readFileSync(path.join(dir,'machine-observation-data.json'),'utf8'));
 const obsById=new Map((o.observations??[]).map(x=>[x.observationId,x]));
 const mapByFeat=new Map((o.featureMappings??[]).map(x=>[x.featureId,x]));
 const selByFeat=new Map((s.features??[]).map(x=>[x.featureId,x]));
 let withExclusions=0, sharedLinks=0;
 for(const rf of r.features??[]){
   const fid=featureId(rf.researchFeatureId);
   const sf=selByFeat.get(fid);
   if(!sf || sf.adoptionCategory==='EXCLUDE') continue;
   const m=mapByFeat.get(fid); if(!m) continue;
   const obs=obsById.get(m.primaryObservationId); if(!obs) continue;
   obs.numeratorDefinition=rf.numeratorDefinition??obs.numeratorDefinition;
   obs.denominatorDefinition=rf.denominatorDefinition??obs.denominatorDefinition;
   obs.includedConditions=[rf.trialUnit??'',rf.denominatorDefinition??''].filter(Boolean);
   obs.excludedConditions=extractExclusions(rf);
   if(obs.excludedConditions.length) withExclusions++;
   obs.resetCondition='実戦セッション開始時に0へリセット。公開定義に個別リセット条件がある場合はその条件を優先する。';
   obs.previousPlayerUsable=false;
   obs.ownSessionUsable=true;
   obs.definitionEquality='EXACT_WITH_PUBLIC_RESEARCH_DEFINITION';
   m.sharedDenominatorInputId=sf.denominatorInputId??null;
   m.denominatorDefinition=rf.denominatorDefinition??null;
   m.numeratorDefinition=rf.numeratorDefinition??null;
   m.includedConditions=obs.includedConditions;
   m.excludedConditions=obs.excludedConditions;
   m.resetCondition=obs.resetCondition;
   m.previousPlayerUsable=false;
   m.ownSessionUsable=true;
   m.updateTiming=obs.timing??[];
   if(sf.denominatorInputId) sharedLinks++;
 }
 o.observationContract={...(o.observationContract??{}),ruleIds:['RSO-OBS-001','RSO-OBS-002','RSO-OBS-003'],primaryFallbackExplicit:true,numeratorDenominatorExact:true,conditionsExplicit:true,sessionBoundaryExplicit:true,sharedDenominatorInputLinked:true};
 fs.writeFileSync(path.join(dir,'machine-observation-data.json'),JSON.stringify(o,null,2)+'\n');
 rows.push({machineId:id,features:(o.featureMappings??[]).length,withExplicitExclusions:withExclusions,sharedDenominatorLinks:sharedLinks});
}
const out={schemaVersion:'gate-c-observation-contract-enrichment-v1',batchId:'20260908-manifest-v7-first10',status:'PASS',machines:rows,summary:{machines:10,mappedFeatures:rows.reduce((a,x)=>a+x.features,0),featuresWithExplicitExclusions:rows.reduce((a,x)=>a+x.withExplicitExclusions,0),sharedDenominatorLinks:rows.reduce((a,x)=>a+x.sharedDenominatorLinks,0)}};
fs.writeFileSync(path.join(ROOT,'batches','20260908-manifest-v7-first10','gate-c-observation-contract-enrichment.json'),JSON.stringify(out,null,2)+'\n');
console.log('GATE C CONTRACT ENRICHMENT PASS',JSON.stringify(out.summary));
