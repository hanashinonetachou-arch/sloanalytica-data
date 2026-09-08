import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const BATCH='20260908-manifest-v7-first10';
const IDS=['L_ANIMAL_SLOT_DOCCHI_ZT','L_BIG_DREAM_GOLDEN_PUSHER_KR','L_BIOHAZARD_RE3_ZD','L_TAKT_OP_DESTINY_M1','L_SUPER_RIO_ACE2_ND02H','L_BIRDIE_WING_BC','L_SAO2_PA1','L_SENGOKU_OTOME5_L8','L_DARK_HAIBI_SB','L_LOTIS_TN'];
const linked=new Set(['L_BIG_DREAM_GOLDEN_PUSHER_KR','L_TAKT_OP_DESTINY_M1','L_SUPER_RIO_ACE2_ND02H','L_BIRDIE_WING_BC','L_SAO2_PA1','L_SENGOKU_OTOME5_L8']);
const clean=s=>String(s??'').replace(/[^A-Z0-9_]/g,'_');
const fid=rf=>`FEAT_${clean(String(rf).replace(/^RF_/,''))}`;
let errors=[]; const rows=[];
for(const id of IDS){
 const dir=path.join(ROOT,'research',id);
 const r=JSON.parse(fs.readFileSync(path.join(dir,'research-data.json'),'utf8'));
 const s=JSON.parse(fs.readFileSync(path.join(dir,'selection-data.json'),'utf8'));
 const o=JSON.parse(fs.readFileSync(path.join(dir,'machine-observation-data.json'),'utf8'));
 const selBy=new Map((s.features??[]).map(x=>[x.featureId,x]));
 const mapBy=new Map((o.featureMappings??[]).map(x=>[x.featureId,x]));
 const obsBy=new Map((o.observations??[]).map(x=>[x.observationId,x]));
 let adopted=0, exclusionFeatures=0, sharedChecks=0;
 for(const rf of r.features??[]){
   const f=selBy.get(fid(rf.researchFeatureId)); if(!f||f.adoptionCategory==='EXCLUDE') continue; adopted++;
   const m=mapBy.get(f.featureId); if(!m){errors.push(`${id}/${f.featureId}: mapping missing`);continue;}
   if(!m.primaryObservationId) errors.push(`${id}/${f.featureId}: primary observation missing`);
   if(m.fallbackConsidered!==true || !(m.fallbackReason??'').trim()) errors.push(`${id}/${f.featureId}: fallback consideration missing`);
   const obs=obsBy.get(m.primaryObservationId); if(!obs){errors.push(`${id}/${f.featureId}: primary observation object missing`);continue;}
   if((rf.numeratorDefinition??null)!==(obs.numeratorDefinition??null)) errors.push(`${id}/${f.featureId}: numerator definition drift`);
   if((rf.denominatorDefinition??null)!==(obs.denominatorDefinition??null)) errors.push(`${id}/${f.featureId}: denominator definition drift`);
   if(!Array.isArray(obs.includedConditions)||!obs.includedConditions.length) errors.push(`${id}/${f.featureId}: included conditions missing`);
   const sourceText=[rf.denominatorDefinition,rf.numeratorDefinition,rf.notes].filter(Boolean).join('。');
   if(/除く|除外|含めない|対象外|含まない/.test(sourceText)){
      exclusionFeatures++;
      if(!Array.isArray(obs.excludedConditions)||!obs.excludedConditions.length) errors.push(`${id}/${f.featureId}: public exclusion condition not carried into Observation`);
   }
   if(!(obs.resetCondition??'').trim()) errors.push(`${id}/${f.featureId}: reset condition missing`);
   if(obs.previousPlayerUsable!==false) errors.push(`${id}/${f.featureId}: previous-player usability must be explicitly false for session manual observation`);
   if(obs.ownSessionUsable!==true) errors.push(`${id}/${f.featureId}: own-session usability must be true`);
   if(!Array.isArray(obs.timing)||!obs.timing.length) errors.push(`${id}/${f.featureId}: update timing missing`);
   if(f.denominatorInputId){
     sharedChecks++;
     if(m.sharedDenominatorInputId!==f.denominatorInputId) errors.push(`${id}/${f.featureId}: shared denominator input link mismatch`);
   }
 }
 // OBS-003: exact public denominator/trial universe must map to one denominator input id.
 const groups=new Map();
 for(const rf of r.features??[]){
   const f=selBy.get(fid(rf.researchFeatureId)); if(!f||f.adoptionCategory==='EXCLUDE'||!f.denominatorInputId) continue;
   const key=JSON.stringify([rf.denominatorDefinition??'',rf.trialUnit??'']);
   if(!groups.has(key)) groups.set(key,new Set()); groups.get(key).add(f.denominatorInputId);
 }
 for(const [key,set] of groups) if(set.size>1) errors.push(`${id}: duplicate denominator inputs remain for exact same universe ${key}: ${[...set].join(',')}`);
 if(linked.has(id)){
   if(o.linkedService?.status!=='FOUND') errors.push(`${id}: linked service existence not FOUND`);
   if(!Array.isArray(o.linkedService?.concreteObtainableItems)||!o.linkedService.concreteObtainableItems.length) errors.push(`${id}: concrete linked-service obtainable items missing`);
 }
 if((o.researchReopenRequests??[]).some(x=>x.status==='RESEARCH_REOPEN_REQUIRED')) errors.push(`${id}: unresolved research reopen remains`);
 if(Object.values(o.sourceCoverage??{}).some(x=>x==='UNRESOLVED')) errors.push(`${id}: unresolved source coverage remains`);
 rows.push({machineId:id,adoptedFeatures:adopted,featuresWithPublicExclusions:exclusionFeatures,sharedDenominatorChecks:sharedChecks,linkedService:linked.has(id)});
}
const out={schemaVersion:'gate-c-semantic-audit-v1',batchId:BATCH,status:errors.length?'BLOCKED':'PASS',machines:rows,summary:{machines:10,adoptedFeatures:rows.reduce((a,x)=>a+x.adoptedFeatures,0),featuresWithPublicExclusions:rows.reduce((a,x)=>a+x.featuresWithPublicExclusions,0),sharedDenominatorChecks:rows.reduce((a,x)=>a+x.sharedDenominatorChecks,0),linkedServiceMachines:rows.filter(x=>x.linkedService).length,errors:errors.length},errors};
fs.writeFileSync(path.join(ROOT,'batches',BATCH,'gate-c-semantic-audit.json'),JSON.stringify(out,null,2)+'\n');
console.log(`GATE C SEMANTIC ${out.status}`,JSON.stringify(out.summary));
if(errors.length){for(const e of errors)console.error('ERROR:',e);process.exit(1);}
