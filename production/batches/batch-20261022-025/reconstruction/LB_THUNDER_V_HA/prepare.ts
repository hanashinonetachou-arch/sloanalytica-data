import fs from 'node:fs';
import {buildEvaluation} from '../../../../src/evaluation-builder.ts';

// One-machine reconstruction. Shared builders, validators and Runtime Policy are unchanged.
const path='research-inbox/batch025/reviewed/LB_THUNDER_V_HA.json';
const r=JSON.parse(fs.readFileSync(path,'utf8'));
if(r.packageRevision!==2)throw Error('EXPECTED_UNMODIFIED_CANONICAL_RESEARCH');
const numericBefore=r.findings.filter((f:any)=>f.settingDistribution).map((f:any)=>({id:f.findingId,values:f.settingDistribution}));
const normal=['BIG','REG','BELL_A','BELL_B','WATER_A','WATER_B','CHERRY_B'];
const big=['BIG_BELL_B','BIG_BELL_C','BIG_REACH'];
const overlaps=r.findings.filter((f:any)=>f.findingId.startsWith('OVERLAP_')).map((f:any)=>f.findingId);
const evaluation=buildEvaluation(r);
const metric=(id:string,key:string)=>evaluation.evaluations.find((x:any)=>x.findingId===id).metrics[key];
const orderedNormal=[...normal].sort((a,b)=>metric(b,'selectionScore').value-metric(a,'selectionScore').value);
const orderedOverlap=[...overlaps].sort((a,b)=>metric(b,'perEligibleTrialPower')-metric(a,'perEligibleTrialPower'));
const orderedBig=[...big].sort((a,b)=>metric(b,'perEligibleTrialPower')-metric(a,'perEligibleTrialPower'));
const normalOrder=[...orderedNormal,...orderedOverlap];
for(const f of r.findings){
 if(normal.includes(f.findingId)){
  f.trialUniverse='BONUS_ELIGIBLE_GAME_TRIAL';
  f.dependencyFallbackRank=normalOrder.indexOf(f.findingId)+1;
  f.dependencyReason='通常時の小役とボーナスの観測情報を重複加算せず、設定判別スコア順に観測できた1項目へ切り替える。';
  f.inputPresentation={trialLabel:'対象通常ゲーム数',successLabel:f.label+'回数'};
  f.denominatorSemantics='ボーナス・BT中を除く通常区間の対象ゲーム数。同じ区間の回数だけを入力する。小役は成立後を除き、集計区間の一致を確認できない台の表示ゲーム数をそのまま転記しない。RIZIN ZONE中の通常抽選は含め、雷神ループによるBIG前半の再開は新しい初当りに数えない。';
  f.details=[f.denominatorSemantics,'未入力は未観測です。数えて0回だった場合だけ0を入力してください。通常時は観測できた優先項目を1つ使用し、ほかの回数と重複加算しません。'];
 }
 if(big.includes(f.findingId)){
  f.dependencyFallbackRank=orderedBig.indexOf(f.findingId)+1;
  f.dependencyReason='同じBIG前半ゲームの停止形は独立に加算せず、1試行あたりの判別力順に観測できた1項目へ切り替える。';
  f.inputPresentation={trialLabel:'BIG前半ゲーム数',successLabel:f.label.replace('BIG前半','')+'回数'};
  f.details=[f.denominatorSemantics,'同じ条件で停止形を確認し続けたBIG前半だけが対象です。JAC待機BT・JACは除き、雷神ループで再開した対象ゲームは含めます。停止形を確認できたゲームだけの都合のよい抜き取りは行わないでください。','ベルB・ベルC・15枚リーチ目は、記録できた優先項目1つで計算します。未入力を0回にせず、数えて0回なら0を入力してください。'];
 }
 if(overlaps.includes(f.findingId)){
  f.dependencyFallbackRank=normalOrder.indexOf(f.findingId)+1;
  f.dependencyReason='通常時小役・ボーナスと同じ当選情報を使うため、ほかの通常時項目が未観測の場合だけ順位に従って代替する。';
  f.denominatorSemantics='対象小役を連続して数えた区間の成立回数を母数、その全成立について確認したボーナス同時当選回数を入力する。同時当選した役だけ、契機を見抜けた成功例だけを抜き取らない。';
  f.details=[f.denominatorSemantics,'全成立について同時当選の有無を確認できない場合は、この項目を推測計算に使わないでください。通常時の小役回数やREGなどと重複加算しません。'];
  f.inputPresentation={trialLabel:f.label.replace('同時当選期待度','')+'成立回数',successLabel:'同時当選回数'};
 }
 if(/^(RED7_|VBIG_|REG_CAUSE_)/.test(f.findingId)){
  f.observationType='reference_distribution';
  f.details=['内部の当選契機を全件分類して数える方法を確認できないため、数値推測には使用しません。判別できた一部の当選だけを全ゲーム数と比較すると偏るためです。',f.denominatorSemantics];
  f.referenceClosure={basis:'RETAINED_SOURCE_REVIEW_AND_EXTERNAL_AUDIT_OBSERVATION_FINDINGS',ownerStage:'RESEARCH',repeatPublicSearch:false,releaseCondition:'NEW_CONCRETE_COUNTING_SOURCE'};
 }
}
r.packageRevision=6;
r.audit.thunderOnlyReconstruction={date:'2026-10-24',authority:'USER_EXPLICIT_INSTRUCTION',canonicalData:'eeb059c717a4d42ee34a7d806574270bd9cd56d0',appBeforeAudit:'e161e1f352c4f2042550aee2bfdd04c7a1ed735e',withdrawnPullRequests:[135,474],sharedEngineChanged:false,sharedBuildersChanged:false,thresholdsChanged:false,externalAudit:'RECORDED_FINDINGS_USED_NOT_A_NEW_AUDIT_PASS',normalFallback:normalOrder,bigFallback:orderedBig};
if(JSON.stringify(numericBefore)!==JSON.stringify(r.findings.filter((f:any)=>f.settingDistribution).map((f:any)=>({id:f.findingId,values:f.settingDistribution}))))throw Error('SOURCE_VALUES_CHANGED');
fs.writeFileSync(path,JSON.stringify(r,null,2)+'\n');
console.log(JSON.stringify({status:'PREPARED',originalNumericCandidates:numericBefore.length,normalOrder,bigOrder:orderedBig}));
