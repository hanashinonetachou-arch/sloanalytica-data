import fs from 'node:fs';
const ACTIVE=new Set(['INCLUDE_PRIMARY','INCLUDE_SUPPORT','INCLUDE_FALLBACK']);
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const refs=f=>{const ids=[f.numeratorInputId,f.denominatorInputId,f.trialCountInputId,f.conditionedOnInputId,...(f.categoryInputIds??[]),...(f.denominatorInputIds??[]),...(f.optionalCategoryInputIds??[])].filter(Boolean);if(f.categorySubtractInputIds)for(const [k,v] of Object.entries(f.categorySubtractInputIds)){ids.push(k,...(v??[]));}return ids;};
const rows=[];
for(const de of fs.readdirSync('research',{withFileTypes:true}).filter(x=>x.isDirectory())){
 const mid=de.name,op=`research/${mid}/machine-observation-data.json`,sp=`research/${mid}/selection-data.json`; if(!fs.existsSync(op)||!fs.existsSync(sp))continue;
 const o=read(op); if(o.schemaVersion!=='machine-observation-data-v1')continue; const s=read(sp),byId=new Map((s.inputs??[]).map(i=>[i.id,i]));
 const active=(s.features??[]).filter(f=>ACTIVE.has(f.adoptionCategory));
 const details=active.map(f=>{const ids=[...new Set(refs(f))],inputs=ids.map(id=>byId.get(id)).filter(Boolean);return {featureId:f.featureId,adoptionCategory:f.adoptionCategory,inputIds:ids,inputCategories:[...new Set(inputs.map(i=>i.category).filter(Boolean))],usesPredecessor:inputs.some(i=>i.category==='PREDECESSOR'||i.observationScope==='PREDECESSOR_SNAPSHOT')||/PREDECESSOR/.test(f.featureId),usesSessionDifference:inputs.some(i=>i.sessionDifferenceHelper===true),difficultyParticipation:f.difficultyParticipation??null};});
 const pred=details.filter(x=>x.usesPredecessor),self=details.filter(x=>!x.usesPredecessor);
 let className='DIRECT_ONLY'; if(pred.length&&self.length)className=self.some(x=>x.usesSessionDifference)?'PREDECESSOR_PLUS_SELF_DELTA':'PREDECESSOR_ONLY_RISK'; else if(pred.length)className='PREDECESSOR_ONLY'; else if(self.some(x=>x.usesSessionDifference))className='SELF_DELTA_RISK';
 rows.push({machineId:mid,displayName:o.displayName,activeFeatureCount:details.length,class:className,predecessorFeatures:pred.map(x=>x.featureId),selfFeatures:self.map(x=>x.featureId),details,legacy:{machineMenu:o.machineMenu?.status??null,linkedService:o.linkedService?.status??null,predecessor:o.predecessorData?.status??null,predecessorUsableForInference:o.predecessorData?.usableForInference??null,predecessorUsableForSelfSessionDelta:o.predecessorData?.usableForSelfSessionDelta??null}});
}
rows.sort((a,b)=>a.class.localeCompare(b.class)||a.machineId.localeCompare(b.machineId));
const classes={};for(const r of rows)classes[r.class]=(classes[r.class]??0)+1;
fs.writeFileSync('reports/v64-remaining-v1-candidates.json',JSON.stringify({schemaVersion:'remaining-v1-classifier-final-v1',generatedAt:new Date().toISOString(),summary:{count:rows.length,classes,machineIds:rows.map(r=>r.machineId)},machines:rows},null,2)+'\n');
console.log(JSON.stringify({count:rows.length,classes,machineIds:rows.map(r=>r.machineId)}));