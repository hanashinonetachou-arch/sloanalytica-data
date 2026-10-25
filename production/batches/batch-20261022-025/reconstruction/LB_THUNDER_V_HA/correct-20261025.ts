import fs from 'node:fs';
import crypto from 'node:crypto';
import {buildEvaluation} from '../../../../src/evaluation-builder.ts';
import {buildEligibility} from '../../../../src/eligibility-builder.ts';
import {buildCandidateContract} from '../../../../src/candidate-contract-builder.ts';
import {buildObservationEvidence} from '../../../../src/observation-evidence-builder.ts';
import {buildCanonicalUi} from '../../../../src/canonical-ui-builder.ts';
import {buildMachineData} from '../../../../src/machine-data-builder.ts';
import {buildRuntimePolicy} from '../../../../src/runtime-policy-builder.ts';
import {buildRuntimeProjection} from '../../../../src/runtime-projection-builder.ts';
import {buildAppRuntime} from '../../../../src/app-runtime-builder.ts';
import {buildHighLowDiscrimination} from '../../../../src/high-low-discrimination.ts';
import {concreteAdoptionReason} from '../../../../src/adoption-reason.ts';
const root='production/batches/batch-20261022-025';
const out=root+'/reconstruction/LB_THUNDER_V_HA/correction-20261025';
const read=(p:string)=>JSON.parse(fs.readFileSync(p,'utf8'));
const save=(name:string,value:any)=>{const path=out+'/'+name+'.json';fs.writeFileSync(path,JSON.stringify(value,null,2)+'\n');return {artifactId:name+'-LB_THUNDER_V_HA-859',kind:name,path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')};};
const r=read(root+'/artifacts/LB_THUNDER_V_HA/research/result.json');
const original=structuredClone(r);
const held=['OVERLAP_CHERRY_B','OVERLAP_WATER_A','OVERLAP_WATER_B','OVERLAP_REPLAY'];
const normal=['BELL_B','CHERRY_B','BELL_A','REG','WATER_A','WATER_B','BIG','OVERLAP_BELL_A'];
const big=['BIG_BELL_B','BIG_BELL_C','BIG_REACH'];
const normalContract='ボーナス・BT・ボーナス成立後を除く通常抽選のゲーム数。成立したゲームは含め、RIZIN ZONEの通常抽選も含めます。成立後の除外を確認できない表示値は転記しないでください。雷神ループのBIG前半再開は初当りに数えません。';
const overlapContract='成立前の連続観測区間の全ベルA成立回数を母数に、必ず発生するフリーズを伴う同時当選回数を記録します。当選例だけを抜き取らず、ボーナス成立後のベルは含めません。';
const heldReason='全成立についてボーナス同時当選の有無を偏りなく確定する手順を確認できないため、記録のみ・推測計算には使用しません。演出が発生した例だけで確率を比較しません。';
r.packageRevision=9;
for(const f of r.findings){
 if(normal.includes(f.findingId)&&!f.findingId.startsWith('OVERLAP_')){
  f.denominatorSemantics=normalContract;f.liveObservation={status:'EXACT_WITH_SCOPE_TRACKING',reason:normalContract};
  f.details=[normalContract,'同一区間の通常小役・REG・同時当選は重複加算せず、設定1・2・5・6全体の情報量で決めた優先順から有効な1要素を使います。未入力は未観測、0は観測済み0回です。'];
 }
 if(normal.includes(f.findingId))f.dependencyFallbackRank=normal.indexOf(f.findingId)+1;
 if(big.includes(f.findingId)){
  f.denominatorSemantics='BIG前半ボーナスゲームの全ゲームが母数。JAC待機BT・JACを除き、雷神ループで再開した前半は含めます。3連V狙いを続けるか実機連動機能で同一区間の全停止形を確認してください。';
  f.liveObservation={status:'EXACT_WITH_SCOPE_TRACKING',reason:f.denominatorSemantics};
  f.details=[f.denominatorSemantics,'公表された各周辺確率による二項モデルのうち、1試行あたりの情報量順に有効な1要素を使います。丸められたベルA等を厳密な多項分布に変換しません。'];
 }
 if(f.findingId==='BIG_BELL_A')f.details=['公表値の逆数を停止形全体の厳密な確率とすると合計が1を超える設定があります。補正・正規化・残余の推測をせず、ベルAは数値推測に採用しません。原数値は保持します。'];
 if(f.findingId==='OVERLAP_BELL_A'){
  f.denominatorSemantics=overlapContract;f.liveObservation={status:'EXACT_WITH_SCOPE_TRACKING',reason:overlapContract};
  f.details=[overlapContract,'他の通常時要素が有効なときは同時使用しません。'];
 }
 if(held.includes(f.findingId)){
  f.liveObservation={status:'UNRESOLVED',reason:heldReason};f.details=[heldReason];
  f.denominatorSemantics='連続観測区間の全役成立回数と全成立に対する当選・非当選の判定が必要です。成功例抽出は不可。';
  f.reevaluationCondition='標準調査範囲内の新たな具体的資料で、全試行を偏りなく分類できる方法が確認された場合のみ再評価。';
 }
 if(f.findingId==='PREDECESSOR'){
  f.denominatorSemantics='自分の観測と重ならない、同一区間の通常抽選G・初当りBIG・REGをすべて確認できる場合だけ入力。ボーナス・BT・成立後のG、雷神ループによる再開BIGを含めません。';
  f.liveObservation={status:'EXACT_WITH_SCOPE_TRACKING',reason:f.denominatorSemantics};f.details=[f.denominatorSemantics,'G・BIG・REGの一部が不明なら入力しないでください。0回も明示入力します。'];
 }
}
// Old statements are retained as historical assertions, separate from current audited contracts.
const claimMap=new Map<string,string>();
for(const source of r.sources){
 source.previousClaims=structuredClone(source.claims);
 source.claims=source.claims.map((old:string)=>{
  const finding=original.findings.find((f:any)=>old.startsWith(f.label+'：'));
  if(!finding)return old;
  const current=r.findings.find((f:any)=>f.findingId===finding.findingId);
  const text=finding.label+'：公表原数値 '+JSON.stringify(finding.settingDistribution)+'。アプリ観測契約（公表資料の直接引用ではない）：'+current.denominatorSemantics+'。現在の扱い：'+(held.includes(finding.findingId)?heldReason:'最新findingの採否・観測条件に従う。');
  claimMap.set(source.sourceId+'\0'+old,text);return text;
 });
}
for(const row of r.researchCompleteness.candidateLedger)for(const sc of row.sourceClaims)sc.claim=claimMap.get(sc.sourceId+'\0'+sc.claim)??sc.claim;
r.sources.push({sourceId:'S_CORR_20261025',url:'https://1geki.jp/slot/l_thunder_v/42/',title:'同時当選の全試行識別条件の再照合',sourceType:'DIRECT_REVIEW',claims:['ベル同時当選時は必ずフリーズが発生。その他の役の演出については全成立の無偏り分類を保証できない。']});
r.findings.find((f:any)=>f.findingId==='OVERLAP_BELL_A').sourceIds.push('S_CORR_20261025');
r.researchCompleteness.candidateLedger.find((x:any)=>x.candidateId==='OVERLAP_BELL_A').sourceClaims.push({sourceId:'S_CORR_20261025',claim:r.sources.at(-1).claims[0]});
r.findings.find((x:any)=>x.findingId==='BIG').label='BIGの出現率';
r.audit.thunder859Correction={fixedApp:'5e82560d46bb2cb644030cb39e03b76f23d63f2a',fixedData:'3bafd7159f5c034791fd107b18ba8cabb0f95e69',fixedDistribution:'ed391169a3d0378f5093747c96e6c2fa37e7dcd9',sharedEngineChanged:false,sharedRulesChanged:false,held,normalOrder:normal,bigOrder:big,closure:'NEW_CONCRETE_SOURCE_ONLY',sourceClaimsAreNotProofOfObservationContract:true};
if(r.findings.length!==43||JSON.stringify(r.blockedItems)!==JSON.stringify(original.blockedItems))throw Error('RESEARCH_RETENTION');
for(const f of original.findings)if(JSON.stringify(f.settingDistribution)!==JSON.stringify(r.findings.find((x:any)=>x.findingId===f.findingId).settingDistribution))throw Error('VALUES_CHANGED');
const ra=save('research',r),e=buildEvaluation(r),ea=save('evaluation',e),elig=buildEligibility(e),elia=save('eligibility',elig);
const c=buildCandidateContract(e,elig,ea,elia);c.machineSettings=r.settings;c.uiRequirements=r.uiRequirements;c.originalCandidateReconciliation=r.originalCandidateReconciliation;
c.observationPrerequisites=r.findings.filter((f:any)=>f.settingDistribution).map((f:any)=>({findingId:f.findingId,trialUniverse:f.trialUniverse,denominatorSemantics:f.denominatorSemantics,liveObservation:f.liveObservation,sourceIds:f.sourceIds,unknownRequiredInput:'DISABLE_THIS_FINDING_ONLY',zeroVsUnobserved:'PRESERVE'}));
const ca=save('candidate-contract',c),obs=buildObservationEvidence(c,r,ca);
for(const o of obs.observations){if(o.findingId==='BIG_BELL_B')o.inputIdAliases={'BIG_BELL_B.eligibleTrialCount':'INP_THUNDER_BIG_FIRST_HALF_G'};if(o.trialUniverse==='BONUS_ELIGIBLE_GAME_TRIAL')o.inputIdAliases={[o.findingId+'.eligibleTrialCount']:'INP_THUNDER_VERIFIED_G_'+o.findingId};if(o.findingId==='PREDECESSOR')o.inputIdAliases={'PREDECESSOR.eligibleTrialCount':'INP_PREDECESSOR_GAMES','PREDECESSOR.categoryCounts.1_BIG':'INP_PREDECESSOR_BIG_COUNT','PREDECESSOR.categoryCounts.2_REG':'INP_PREDECESSOR_REG_COUNT'};}
const oa=save('observation-evidence',obs),ui=buildCanonicalUi(c,obs,e,ca,oa,ea),ua=save('canonical-ui',ui),md=buildMachineData(ui,c,obs,ua,ca,oa,r,ra),ma=save('machine-data',md);
const conf=read(root+'/runtime-policy-config.json'),pol=buildRuntimePolicy(md,conf,ma),pa=save('runtime-policy',pol),proj=buildRuntimeProjection(md,pol,ma,pa);
// Machine-only correction of metric candidate list: inactive BIG is never an ACTIVE benchmark candidate.
const active=new Set(pol.featureDecisions.filter((x:any)=>x.state==='ACTIVE').map((x:any)=>x.findingId));
const hld=buildHighLowDiscrimination({...c,candidates:c.candidates.map((x:any)=>({...x,runtimeInferenceAllowed:active.has(x.findingId)}))});
const benchmarkNote='表示の高低判別精度はベルA単独を同じ対象通常Gで数えた場合の基準値です。複数入力時の実戦精度や下限保証ではありません。実戦の優先は4設定全体の情報量に基づくベルBです。';
hld.note=benchmarkNote;
const pra=save('runtime-projection',proj),app=buildAppRuntime(proj,pra),p=app.package;
save('app-runtime-before-overlay',app);
await validateStages({r,e,elig,c,obs,ui,md,pol,proj,app,ra,ea,elia,ca,oa,ua,ma,pa,pra,conf});
// Preserve the approved one-section presentation. Only this machine's bindings are replaced.
const baseline=read('../baseline/machine-package.json');
p.ui=structuredClone(baseline.ui);
p.inputs.inputs=[...p.inputs.inputs,...baseline.inputs.inputs.filter((x:any)=>!p.inputs.inputs.some((y:any)=>x.id===y.id))];
const bigG='INP_THUNDER_BIG_FIRST_HALF_G_V859';
for(const id of ['BIG_BELL_B.eligibleTrialCount','BIG_BELL_C.eligibleTrialCount','BIG_REACH.eligibleTrialCount'])if(!p.inputs.inputs.some((x:any)=>x.id===id))p.inputs.inputs.push({id,name:'旧BIG前半ゲーム数',category:'V8_NUMERIC',type:'integer',unit:'G',defaultValue:0,minimum:0,inputVisible:false});
for(const [index,label] of ['BIG前半ベルB','BIG前半ベルC','BIG前半15枚リーチ目'].entries()){
 const id='BIG_BELL_B.categoryCounts.'+(index+1)+'_'+label;
 if(!p.inputs.inputs.some((x:any)=>x.id===id))p.inputs.inputs.push({id,name:'旧'+label+'回数',category:'V8_NUMERIC',type:'counter',unit:'回',defaultValue:0,minimum:0,inputVisible:false});
}
// Retain raw legacy G values without re-deriving them over the stored record.
for(const x of p.inputs.inputs)if(['BIG_BELL_C.eligibleTrialCount','BIG_REACH.eligibleTrialCount'].includes(x.id)){delete x.derivedCalculation;delete x.derivedTerms;}
const oldG=p.inputs.inputs.find((x:any)=>x.id==='INP_THUNDER_BIG_FIRST_HALF_G');
p.inputs.inputs.push({...structuredClone(oldG),id:bigG,inputVisible:false});
for(const id of big){const f=p.features.features.find((x:any)=>x.featureId===id);const old=p.inputs.inputs.find((x:any)=>x.id===id+'.successCount');const num=id+'.verifiedSuccessCount859';p.inputs.inputs.push({...structuredClone(old),id:num,inputVisible:false});f.numeratorInputId=num;f.denominatorInputId=bigG;}
for(const x of p.inputs.inputs)if(x.id==='INP_THUNDER_BIG_FIRST_HALF_G'||big.some(id=>x.id===id+'.successCount'))x.inputVisible=false;
const normalSection=p.ui.v8Sections.find((s:any)=>s.id==='OBS_SHARED_BONUS_ELIGIBLE_GAME_TRIAL');
delete normalSection.groups[0].playDataBinding;
normalSection.description=normalContract+'\n'+benchmarkNote+'\n通常時はベルB→チェリーB→ベルA→REG→スイカA→スイカB→ベルA同時当選の順で、有効な1要素を使用します。';
const bs=p.ui.v8Sections.find((s:any)=>s.id==='OBS_BIG_FIRST_HALF');
bs.groups[0].inputId=bigG;bs.groups[0].engineBinding={inputId:bigG};
bs.description=r.findings.find((x:any)=>x.findingId==='BIG_BELL_B').denominatorSemantics+'\nベルB→ベルC→15枚リーチ目の順で、有効な1要素を使います。旧保存分は新しい共通Gと、確認できた各回数を再入力してください。';
for(const item of bs.items){const fid=item.featureId;const node=item.inputs[0];node.inputId=fid+'.verifiedSuccessCount859';node.engineBinding={inputId:node.inputId};}
const os=p.ui.v8Sections.find((s:any)=>s.id==='OBS_ROLE_OVERLAP');os.description='全役成立が母数です。ベルAは全成立と必ず発生するフリーズを連続観測した場合のみ推測に使用します。他の4役は全試行を分類する手順が未確認のため記録のみです。';
for(const item of os.items)if(held.includes(item.featureId)){item.title+='（記録のみ）';item.description=heldReason;delete item.featureId;for(const n of item.inputs)delete n.featureId;}
const pre=p.ui.v8Sections.find((s:any)=>s.id==='OBS_PREDECESSOR');
pre.description=r.findings.find((x:any)=>x.findingId==='PREDECESSOR').denominatorSemantics+'\nG・BIG・REGをすべて確認した場合だけ計算します。空欄と0回は異なります。';
pre.items=[{id:'NODE_PREDECESSOR',featureId:'PREDECESSOR',title:'着席前BIG・REG内訳',inputs:[['INP_PREDECESSOR_GAMES','着席前の対象通常ゲーム数','denominator'],['INP_PREDECESSOR_BIG_COUNT','着席前BIG','counter'],['INP_PREDECESSOR_REG_COUNT','着席前REG','counter']].map(([id,label,input])=>({id,inputId:id,engineBinding:{inputId:id},label,input,directNumeric:true,gridSpan:id==='INP_PREDECESSOR_GAMES'?12:6,unobservedDisplay:'—',...(id==='INP_PREDECESSOR_GAMES'?{quickAdd:[50]}:{})}))}];
for(const sec of [normalSection,bs,os,pre])sec.descriptionPresentation={collapsible:false};
p.ui.playInfo.totalGamesLabel='総ゲーム数（遊技履歴用）';p.ui.playInfo.totalGamesDescription='推測には下の対象通常ゲーム数を使用します。';
p.metadata.observationPrerequisites=c.observationPrerequisites;
p.metadata.thunder859Correction={...r.audit.thunder859Correction,sharedBigGamesInputId:bigG,legacyCounts:'RETAIN_WITHOUT_INFERENCE_UNTIL_REENTERED',benchmarkNote};
p.v8.machineResearchSummary.highLowDiscrimination=hld;
// Remove duplicate old explanatory references in the UI; retain the source files and all raw values.
for(const x of p.inputs.inputs)if(held.some(id=>x.id.startsWith(id)))x.inputVisible=false;
p.metadata.thunderInlinePresentation={revision:'20261025-859',sharedBigGamesInputId:bigG,legacyBigGamesRequireExplicitConfirmation:true};
const pf=p.features.features.find((f:any)=>f.featureId==='PREDECESSOR');
pf.denominatorAdjustments=[{inputId:'PREDECESSOR.categoryCounts.3_その他',multiplier:0}];
for(const f of p.features.features){f.displayFormat=baseline.features.features.find((x:any)=>x.featureId===f.featureId)?.displayFormat;f.selectionRationale.adoptionReason=concreteAdoptionReason(p,f.featureId);}
for(const a of p.v8.machineResearchSummary.adopted)a.reason=concreteAdoptionReason(p,a.featureId);
app.package=p;save('app-runtime',app);save('machine-package',p);
console.log(JSON.stringify({version:p.machine.machineDataVersion,findings:r.findings.length,held,features:p.features.features.map((x:any)=>x.featureId),hld}));

async function validateStages(d:any){
 const checks:any[]=[];
 const sourceIds=new Set(d.r.sources.map((x:any)=>x.sourceId));
 const {validateResearchCandidateLedger,validateResearchLiveObservationContract}=await import('../../../../src/research-validator.ts');
 checks.push({validator:'research-ledger',...validateResearchCandidateLedger(d.r,sourceIds)});
 for(const f of d.r.findings)validateResearchLiveObservationContract(f);
 const calls:any[]=[
 ['evaluation','validateEvaluationDocument',[d.e,d.r]],
 ['eligibility','validateEligibilityDocument',[d.elig,d.e,d.r]],
 ['candidate-contract','validateCandidateContractDocument',[d.c,d.elig,d.e]],
 ['observation-evidence','validateObservationEvidenceDocument',[d.obs,d.c,d.r]],
 ['canonical-ui','validateCanonicalUiDocument',[d.ui,d.c,d.obs,d.e,d.ca,d.oa,d.ea]],
 ['machine-data','validateMachineDataDocument',[d.md,d.ui,d.c,d.obs,d.ua,d.ca,d.oa,d.r,d.ra]],
 ['runtime-policy','validateRuntimePolicyDocument',[d.pol,d.md,d.conf,d.ma]],
 ['runtime-projection','validateRuntimeProjectionDocument',[d.proj,d.md,d.pol,d.ma,d.pa]],
 ['app-runtime','validateAppRuntimeDocument',[d.app,d.proj,d.pra]]];
 for(const [module,method,args] of calls){const m=await import('../../../../src/'+module+'-validator.ts');checks.push(...m[method](...args));}
 save('stage-validation',{status:'PASS',scope:'Existing validators on builder outputs before machine-owned presentation overlay',checks});
}
