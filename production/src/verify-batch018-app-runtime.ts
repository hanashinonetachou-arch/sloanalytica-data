import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';
const app=process.env.SLO_APP_ROOT;if(!app)throw Error('SLO_APP_ROOT required');const load=async(p:string)=>import(pathToFileURL(path.join(app,p)).href);
const {validateMachinePackage}=await load('src/machine/distribution/MachinePackageValidator.ts');
const {featureEngine}=await load('src/core/engine/FeatureEngineImpl.ts');const {evidenceEngine}=await load('src/core/engine/EvidenceEngineImpl.ts');const {probabilityEngine}=await load('src/core/engine/ProbabilityEngineImpl.ts');
const base=path.resolve(import.meta.dirname,'../batches/batch-20261016-018');const rows:any[]=[];
for(const machineId of fs.readdirSync(path.join(base,'machines'))){
 const d=JSON.parse(fs.readFileSync(path.join(base,'artifacts',machineId,'app_runtime/result.json'),'utf8')),pkg=d.package,settings=pkg.machine.settings;
 validateMachinePackage(pkg,{machineId,displayName:pkg.machine.displayName,manufacturer:pkg.machine.manufacturer,machineDataVersion:pkg.machine.machineDataVersion,packageUrl:'https://example.invalid/package.json',sha256:'0'.repeat(64),packageSizeBytes:Buffer.byteLength(JSON.stringify(pkg)),status:'available'});
 const spec={features:pkg.features.features,inputs:pkg.inputs.inputs},es={evidences:pkg.evidence.evidences,settingKeys:settings};
 const ev=evidenceEngine.evaluateEvidence({},es),prior=probabilityEngine.calculateProbability(featureEngine.extractFeatures({},spec),ev,settings);assert.ok(Object.values(prior.normalizedProbability).every(Number.isFinite));let tested=0;
 for(const f of pkg.features.features){const n=/_GAME_TRIAL$/.test(f.trialUniverse)?7000:100,values:any={[f.denominatorInputId]:n};
  if(f.modelType==='multinomial'){const ps=f.categoryProbabilities[settings[0]],ids=[f.numeratorInputId,...(f.categoryInputIds??[])];ids.forEach((id:string,i:number)=>values[id]=Math.floor(n*ps[i]));}
  else values[f.numeratorInputId]=Math.max(1,Math.floor(n*f.probabilities[settings[0]]));
  const extracted=featureEngine.extractFeatures(values,spec),post=probabilityEngine.calculateProbability(extracted,ev,settings);assert.ok(Object.values(post.normalizedProbability).every(Number.isFinite),machineId+':'+f.featureId);assert.equal(extracted.features.find((x:any)=>x.featureId===f.featureId)?.calculationEligible,true,machineId+':'+f.featureId);tested++;
 }
 for(const e of pkg.evidence.evidences){const result=evidenceEngine.evaluateEvidence({[e.inputId]:e.triggerValue??1},es);if(e.type==='SETTING_CONSTRAINT')assert.ok(result.remainingSettings.length<settings.length,machineId+':'+e.id);}
 if(machineId==='S_AOHARU_MISAO_A2'){const no1=pkg.evidence.evidences.find((e:any)=>e.name.includes('金文字：REG告知からBIG昇格'));assert.ok(no1);assert.ok(!evidenceEngine.evaluateEvidence({[no1.inputId]:1},es).remainingSettings.includes('SET_1'));}
 if(machineId==='L_BOFURI_FN'){assert.ok(!pkg.features.features.some((f:any)=>f.featureId==='M09-C03'));for(const id of ['M09-C10','M09-N05','M09-N06','M09-C12']){const f=pkg.features.features.find((f:any)=>f.featureId===id);assert.ok(f);const all=new Set([f.numeratorInputId,...f.categoryInputIds]);const linked=pkg.evidence.evidences.filter((e:any)=>e.sourceFindingId===id);for(const e of linked)assert.ok(all.has(e.inputId));}}
 rows.push({machineId,status:'PASS',featuresTested:tested,evidenceDefinitions:pkg.evidence.evidences.length});
}
console.log(JSON.stringify({status:'PASS',appCommit:'474fdf2221b3b920b90df9ac615dbd07b0c65fb3',machines:rows},null,2));
