import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
const [appRoot,packagePath,reportPath]=process.argv.slice(2);
const load=p=>import(pathToFileURL(path.resolve(appRoot,p)));
const {featureEngine}=await load('src/core/engine/FeatureEngineImpl.ts');
const {probabilityEngine}=await load('src/core/engine/ProbabilityEngineImpl.ts');
const {evidenceEngine}=await load('src/core/engine/EvidenceEngineImpl.ts');
const {applyRuntimeProjectionForInference}=await load('src/core/engine/runtimeProjection.ts');
const raw=JSON.parse(fs.readFileSync(packagePath)),pkg=raw.package??raw;
const f=id=>pkg.features.features.find(f=>f.featureId===id);
const put=(v,id,n,k)=>{if(!f(id))throw Error('MISSING_FEATURE:'+id);v[bigIds.includes(id)?'INP_THUNDER_BIG_FIRST_HALF_G':f(id).denominatorInputId]=n;if(k!==undefined)v[f(id).numeratorInputId]=k;};
const sectionBy=id=>pkg.ui.v8Sections.find(s=>s.id===id);
const bigIds=['BIG_BELL_B','BIG_BELL_C','BIG_REACH'];
const big=sectionBy('OBS_BIG_FIRST_HALF'),overlap=sectionBy('OBS_ROLE_OVERLAP');
assert(big&&!big.tabGroup&&overlap&&!overlap.tabGroup);
assert.deepEqual(big.items.map(x=>x.featureId),bigIds);
assert.equal(big.groups.length,1);assert.equal(big.groups[0].inputId,'INP_THUNDER_BIG_FIRST_HALF_G');
assert(big.items.every(x=>x.inputs.length===1&&x.inputs[0].input==='counter'));
assert.equal(overlap.items.length,5);assert(overlap.items.every(x=>x.inputs.length===2));
assert.equal(new Set(pkg.ui.v8Sections.map(s=>s.tabGroup?.id??s.id)).size,5);
assert.equal(pkg.ui.v8Sections.filter(s=>s.tabGroup).length,3);
assert.equal(big.items[1].inputs[0].label,'ベルC回数');assert.equal(big.items[2].inputs[0].label,'15枚リーチ目回数');
const {applyManifestV8InputChange,manifestV8ObservedValue}=await load('src/ui/manifestV8RuntimeUi.ts');
const uiValues={};const change=(id,value)=>uiValues[id]=value;
applyManifestV8InputChange(big.groups[0],100,change,uiValues);
for(const [row,count] of big.items.map((row,i)=>[row,[15,4,0][i]]))applyManifestV8InputChange(row.inputs[0],count,change,uiValues);
const bigFeatures=()=>featureEngine.extractFeatures(uiValues,{features:pkg.features.features,inputs:pkg.inputs.inputs}).features.filter(x=>bigIds.includes(x.featureId));
assert(bigFeatures().every(x=>x.denominatorValue===100));assert.equal(manifestV8ObservedValue(big.groups[0],uiValues),100);
const successBefore=big.items.map(x=>uiValues[x.inputs[0].inputId]);
applyManifestV8InputChange(big.groups[0],200,change,uiValues);
assert(bigFeatures().every(x=>x.denominatorValue===200));assert.deepEqual(big.items.map(x=>uiValues[x.inputs[0].inputId]),successBefore);
applyManifestV8InputChange(big.groups[0],0,change,uiValues);assert(bigFeatures().every(x=>!x.calculationEligible));
applyManifestV8InputChange(big.groups[0],null,change,uiValues);assert(bigFeatures().every(x=>!x.calculationEligible));
const legacy={'BIG_BELL_B.eligibleTrialCount':100,'BIG_BELL_C.eligibleTrialCount':200,'BIG_REACH.eligibleTrialCount':300,'BIG_BELL_B.successCount':15,'BIG_BELL_C.successCount':4,'BIG_REACH.successCount':0};
assert.equal(manifestV8ObservedValue(big.groups[0],legacy),undefined);
assert(featureEngine.extractFeatures(legacy,{features:pkg.features.features,inputs:pkg.inputs.inputs}).features.filter(x=>bigIds.includes(x.featureId)).every(x=>!x.calculationEligible));
const scenarios=[
 {id:'01',name:'全未入力',input:{}},
 ...[130,105,160].map((k,i)=>{const input={};put(input,'BELL_B',7000,k);return {id:'0'+(i+2),name:'ベルB '+k,input};}),
 ...[
 ['05','BIG前半B15/100G',100,15],['06','BIG前半B1/1G',1,1],
 ['07','BIG前半Gのみ',100,undefined],['08','BIG前半Bを観測済み0',100,0],
 ].map(([id,name,n,k])=>{const input={};put(input,'BIG_BELL_B',n,k);return {id,name,input};}),
 {id:'09',name:'着席前3項目完備',input:{INP_PREDECESSOR_GAMES:2000,INP_PREDECESSOR_BIG_COUNT:8,INP_PREDECESSOR_REG_COUNT:5}},
 {id:'10',name:'着席前REG未入力',input:{INP_PREDECESSOR_GAMES:2000,INP_PREDECESSOR_BIG_COUNT:8}},
 {id:'11',name:'別観測区間を統合',input:{}},
 {id:'12',name:'設定2以上画面',input:{REF_BIG_END_2:1}},
 {id:'13',name:'設定5以上画面',input:{REF_REG_END_2:1}},
 {id:'14',name:'数値と確定画面',input:{REF_REG_END_2:1}},
 ...[
 ['15','成功回数が母数超過',2,3],['16','試行0',0,0],['17a','負数',100,-1],
 ['17b','Infinity',Infinity,1],['17c','NaN',100,NaN],
 ].map(([id,name,n,k])=>{const input={};put(input,'BIG_BELL_B',n,k);return {id,name,input};}),
 {id:'18',name:'矛盾する制約',input:{REF_REG_END_2:1,AUD_CONFLICT:1},conflict:true},
 {id:'19',name:'大標本',input:{}},
 {id:'20',name:'旧総G・旧BIG内訳を新入力へ流用しない',input:{'BELL_B.eligibleTrialCount':7000,'BELL_B.successCount':130,'BIG_BELL_B.eligibleTrialCount':100,'BIG_BELL_B.categoryCounts.1_BIG前半ベルB':15,'BIG_BELL_B.categoryCounts.2_BIG前半ベルC':4,'BIG_BELL_B.categoryCounts.3_BIG前半15枚リーチ目':0}},
 {id:'21',name:'REGのみ',input:{}},
 {id:'22',name:'BIGのみ（従来閾値未満）',input:{'BIG.successCount':26,'INP_THUNDER_VERIFIED_G_BIG':7000}},
 {id:'23',name:'小役とREGの二重加算なし',input:{}},
 {id:'24',name:'BIG前半Cのみへ切替',input:{}},
 {id:'25',name:'着席前REGを明示0',input:{INP_PREDECESSOR_GAMES:2000,INP_PREDECESSOR_BIG_COUNT:8,INP_PREDECESSOR_REG_COUNT:0}},
];
const scenario=id=>scenarios.find(s=>s.id===id);
put(scenario('11').input,'BELL_B',7000,130);put(scenario('11').input,'BIG_BELL_B',100,15);Object.assign(scenario('11').input,scenario('09').input);
put(scenario('14').input,'BELL_B',7000,130);
put(scenario('19').input,'BELL_B',1e9,18900000);
put(scenario('21').input,'REG',7000,22);
put(scenario('23').input,'BELL_B',7000,130);put(scenario('23').input,'REG',7000,22);
put(scenario('24').input,'BIG_BELL_C',100,4);
function run(s){
 const extracted=featureEngine.extractFeatures(s.input,{features:pkg.features.features,inputs:pkg.inputs.inputs});
 const evidences=[...pkg.evidence.evidences,...(s.conflict?[{id:'AUD_CONFLICT',name:'synthetic SET1-only constraint',inputId:'AUD_CONFLICT',confirmedSettings:['SET_1'],type:'SETTING_CONSTRAINT'}]:[])];
 const evidence=evidenceEngine.evaluateEvidence(s.input,{evidences,settingKeys:pkg.machine.settings});
 const posterior=probabilityEngine.calculateProbability(applyRuntimeProjectionForInference(extracted,pkg.features.runtimeProjection),evidence,pkg.machine.settings);
 return {id:s.id,name:s.name,input:s.input,active:extracted.features.filter(f=>f.calculationEligible).map(f=>f.featureId),evidenceValid:evidence.isValid,remaining:evidence.remainingSettings,posterior:posterior.posteriorProbability};
}
const results=scenarios.map(run),get=id=>results.find(r=>r.id===id);
assert.equal(results.length,27);
for(const id of ['01','07','10','15','16','17a','17b','17c','20','22']){assert.deepEqual(get(id).active,[],id);assert.deepEqual(Object.values(get(id).posterior),[.25,.25,.25,.25],id);}
assert.deepEqual(get('21').active,['REG']);assert.deepEqual(get('23').active,['BELL_B']);assert.deepEqual(get('24').active,['BIG_BELL_C']);
assert.deepEqual(get('09').active,['PREDECESSOR']);assert.deepEqual(get('25').active,['PREDECESSOR']);
assert.notDeepEqual(get('09').posterior,get('25').posterior);
assert.equal(get('18').evidenceValid,false);assert.deepEqual(Object.values(get('18').posterior),[0,0,0,0]);
Object.values(get('06').posterior).forEach((v,i)=>assert(Math.abs(v-[.2265625,.2734375,.2265625,.2734375][i])<1e-12));
assert(get('03').posterior.SET_2>get('03').posterior.SET_6);assert(get('04').posterior.SET_6>get('04').posterior.SET_2);
for(const r of results)assert(Object.values(r.posterior).every(v=>Number.isFinite(v)&&v>=0&&v<=1));
// Every normal/conditional preferred/fallback route is exercised alone and as a lower-priority route.
const grouped=pkg.features.features.filter(f=>f.featureId!=='PREDECESSOR');
let fallbackChecks=0;
for(const x of grouped){
 const input={};put(input,x.featureId,100,1);assert.deepEqual(run({input}).active,[x.featureId]);fallbackChecks++;
 const upper=grouped.find(y=>(x.suppressedByFeatureIds??[]).includes(y.featureId));
 if(upper){put(input,upper.featureId,100,1);assert.deepEqual(run({input}).active,[upper.featureId]);fallbackChecks++;}
}
const sourceFiles=['src/core/engine/FeatureEngineImpl.ts','src/core/engine/modelStrategies.ts','src/core/engine/ProbabilityEngineImpl.ts','src/core/engine/types.ts','src/core/engine/EvidenceEngineImpl.ts','src/core/engine/runtimeProjection.ts'];
const hashes=Object.fromEntries(sourceFiles.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(path.resolve(appRoot,p))).digest('hex')]));
fs.writeFileSync(reportPath,JSON.stringify({status:'PASS',appSourceCommit:'e161e1f352c4f2042550aee2bfdd04c7a1ed735e',sourceSha256:hashes,machineDataVersion:pkg.machine.machineDataVersion,scenarios:results.length,fallbackChecks,scope:'Reconstruction-specific cases; not a claim of passing the superseded joint-model audit contract.',package:pkg,results},(_k,v)=>typeof v==='number'&&!Number.isFinite(v)?String(v):v,2)+'\n');
console.log(JSON.stringify({status:'PASS',scenarios:results.length,fallbackChecks}));

