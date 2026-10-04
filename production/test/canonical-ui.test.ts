import test from 'node:test';import assert from 'node:assert/strict';import {buildCanonicalUi,derivePlayInfoRequirement,deriveObservationInputLabels,buildObservationDescription} from '../src/canonical-ui-builder.ts';import {validateCanonicalUiDocument} from '../src/canonical-ui-validator.ts';
const candidate={manifestVersion:'8.5',batchId:'b',machineId:'M',machineName:'Machine',dependencyGroups:[{groupId:'held-group',members:['h1'],resolution:'HELD_NO_JOINT_MODEL',reason:'source-supported joint/dependency modelが未確立',reevaluationCondition:'source-supported joint/dependency modelまたは明示的なSelection REVIEW決定が確立すること。'}],candidates:[{findingId:'b1',label:'初当り',model:'BERNOULLI',trialUniverse:'NORMAL_GAME_TRIAL',runtimeInferenceAllowed:true,settingDistribution:{'1':'1/100','6':'1/80'},runtimePolicyBinding:{metric:'PER_ELIGIBLE_TRIAL_POWER',value:2,thresholdSource:'RUNTIME_POLICY'}},{findingId:'c1',label:'振り分け',model:'CATEGORICAL',trialUniverse:'END',runtimeInferenceAllowed:true,settingDistribution:{'1':'A 60% / B 40%','6':'A 40% / B 60%'},runtimePolicyBinding:{metric:'PER_ELIGIBLE_TRIAL_POWER',value:8,thresholdSource:'RUNTIME_POLICY'}},{findingId:'h1',label:'保留',model:'BERNOULLI',trialUniverse:'X',runtimeInferenceAllowed:false,settingDistribution:{'1':0.1,'6':0.2},runtimePolicyBinding:{metric:'PER_ELIGIBLE_TRIAL_POWER',value:1,thresholdSource:'RUNTIME_POLICY'}}]};
const observation={machineId:'M',observations:[{findingId:'b1',label:'初当り',model:'BERNOULLI',trialUniverse:'NORMAL_GAME_TRIAL',runtimeInferenceAllowed:true,observationStatus:'READY',collectionContract:{type:'SUCCESS_TRIAL_COUNTS',successField:'successCount',trialField:'eligibleTrialCount'}},{findingId:'c1',label:'振り分け',model:'CATEGORICAL',trialUniverse:'END',runtimeInferenceAllowed:true,observationStatus:'READY',collectionContract:{type:'CATEGORY_COUNTS',countsField:'categoryCounts',trialField:'eligibleTrialCount',categoryCoverage:'NON_EXHAUSTIVE'}},{findingId:'h1',label:'保留',model:'BERNOULLI',trialUniverse:'X',runtimeInferenceAllowed:false,observationStatus:'HELD_NO_JOINT_MODEL',collectionContract:null}],evidence:[{findingId:'e1',label:'終了画面',sourceIds:['s'],runtimePolicyControlled:false,status:'SOURCE_REFERENCED'}],highLowDiscrimination:{status:'NOT_COMPUTED',reason:'no exact exposure'}};
const evaluation={machineId:'M',evaluations:[{findingId:'b1',metrics:{selectionScore:{status:'BLOCKED_UNRESOLVED',value:null}},benchmarkExposure:{reason:'exact exposureなし'}},{findingId:'c1',metrics:{selectionScore:{status:'BLOCKED_UNRESOLVED',value:null}},benchmarkExposure:{reason:'exact exposureなし'}},{findingId:'h1',metrics:{selectionScore:{status:'BLOCKED_UNRESOLVED',value:null}},benchmarkExposure:{reason:'exact exposureなし'}}]};const ca={path:'c'},oa={path:'o'},ea={path:'e'};
test('materializes only READY numeric observations and preserves Evidence',()=>{const d=buildCanonicalUi(candidate,observation,evaluation,ca,oa,ea);const ev=validateCanonicalUiDocument(d,candidate,observation,evaluation,ca,oa,ea);assert.equal(d.numericSections.length,2);assert.equal(d.heldObservations[0].materialized,false);assert.match(d.heldObservations[0].reason,/joint\/dependency model/);assert.match(d.heldObservations[0].reevaluationCondition,/Selection REVIEW/);assert.equal(d.evidenceSections[0].runtimePolicyControlled,false);assert.equal(d.numericSections[0].score.display,'算出不可');assert.deepEqual(d.numericSections[0].inputs.map((x:any)=>x.id),['b1.eligibleTrialCount','b1.successCount']);assert.deepEqual(d.numericSections[0].inputs.map((x:any)=>x.label),['通常ゲーム数','初当り回数']);assert.equal(d.playInfo.mode,'NORMAL_ONLY');assert.deepEqual(d.playInfo.startFields.map((x:any)=>x.label),['着席時 通常ゲーム数']);assert.deepEqual(d.playInfo.currentFields.map((x:any)=>x.label),['現在 通常ゲーム数']);assert.match(d.numericSections[0].description,/通常時の初当りを記録/);assert.doesNotMatch(d.numericSections[0].description,/・数えるもの：|・基準：|設定判別スコア|1回の判別力/);assert.equal(ev[0].validator,'canonical-ui-v1')});
test('rejects Evidence omission',()=>{const d=buildCanonicalUi(candidate,observation,evaluation,ca,oa,ea);d.evidenceSections=[];assert.throws(()=>validateCanonicalUiDocument(d,candidate,observation,evaluation,ca,oa,ea),/EVIDENCE_COVERAGE/)});
test('rejects HELD observation materialization',()=>{const d=buildCanonicalUi(candidate,observation,evaluation,ca,oa,ea);d.numericSections.push({sourceFindingId:'h1',title:'保留',kind:'NUMERIC_OBSERVATION',inputs:[{}]});assert.throws(()=>validateCanonicalUiDocument(d,candidate,observation,evaluation,ca,oa,ea),/NUMERIC_COVERAGE/)});

test('materializes source-explicit residual category',()=>{const c=structuredClone(candidate),e=structuredClone(evaluation);c.candidates[1].settingDistribution={'1':'A 10% / B 20%','6':'A 20% / B 30%'};e.evaluations[1].categoryModel={residualPolicy:'SOURCE_EXPLICIT_OTHER'};const d=buildCanonicalUi(c,observation,e,ca,oa,ea);assert.deepEqual(d.numericSections[1].inputs.map((x:any)=>x.label),['振り分け回数','A','B','その他']);assert.doesNotThrow(()=>validateCanonicalUiDocument(d,c,observation,e,ca,oa,ea))});

test('normalizes internal benchmark wording before user UI',()=>{const d=buildCanonicalUi(candidate,observation,evaluation,ca,oa,ea);for(const section of d.numericSections){assert.doesNotMatch(String(section.score?.reason??''),/opportunity model|research|exact exposure|denominator/i);assert.match(String(section.score?.reason??''),/観測条件/);}});

test('shows +50 only for game-count denominators',()=>{const d=buildCanonicalUi(candidate,observation,evaluation,ca,oa,ea);assert.deepEqual(d.numericSections[0].inputs[0].quickAdd,[50]);assert.deepEqual(d.numericSections[1].inputs[0].quickAdd,[]);assert.equal(d.numericSections[0].inputs[1].quickAdd[0],1);assert.equal(d.numericSections[1].inputs[1].quickAdd[0],1);assert.doesNotThrow(()=>validateCanonicalUiDocument(d,candidate,observation,evaluation,ca,oa,ea))});

test('uses unrounded selection score for importance threshold',()=>{
 const c:any=structuredClone(candidate),o:any=structuredClone(observation),e:any=structuredClone(evaluation);
 c.candidates=[{findingId:'b1',label:'初当り',model:'BERNOULLI',trialUniverse:'NORMAL_GAME_TRIAL',runtimeInferenceAllowed:true,settingDistribution:{'1':'1/100','6':'1/80'},runtimePolicyBinding:{metric:'SELECTION_SCORE',value:9.9802,thresholdSource:'RUNTIME_POLICY'}}];
 o.observations=[{findingId:'b1',label:'初当り',model:'BERNOULLI',trialUniverse:'NORMAL_GAME_TRIAL',runtimeInferenceAllowed:true,observationStatus:'READY',collectionContract:{type:'SUCCESS_TRIAL_COUNTS',successField:'successCount',trialField:'eligibleTrialCount'}}];o.evidence=[];
 e.evaluations=[{findingId:'b1',metrics:{selectionScore:{status:'COMPUTED',value:9.9802}},benchmarkExposure:{status:'EXACT',trials:7000}}];
 const d=buildCanonicalUi(c,o,e,ca,oa,ea);
 assert.equal(d.numericSections[0].score.value,10);
 assert.equal(d.numericSections[0].score.importance,'補助');
 assert.doesNotThrow(()=>validateCanonicalUiDocument(d,c,o,e,ca,oa,ea));
});


test('derives only the game-count ranges consumed by adopted observations',()=>{
 assert.deepEqual(derivePlayInfoRequirement(['TOTAL_GAME_TRIAL']),{mode:'TOTAL_ONLY',needsTotal:true,needsNormal:false,needsExcludedGames:false});
 assert.deepEqual(derivePlayInfoRequirement(['NORMAL_GAME_TRIAL']),{mode:'NORMAL_ONLY',needsTotal:false,needsNormal:true,needsExcludedGames:false});
 assert.deepEqual(derivePlayInfoRequirement(['TOTAL_GAME_TRIAL','BONUS_ELIGIBLE_GAME_TRIAL']),{mode:'TOTAL_AND_NORMAL',needsTotal:true,needsNormal:true,needsExcludedGames:false});
 assert.deepEqual(derivePlayInfoRequirement(['END_SCREEN_TRIAL']),{mode:'NONE',needsTotal:false,needsNormal:false,needsExcludedGames:false});
 assert.deepEqual(derivePlayInfoRequirement(['LOTIS_NON_CHAIN_GAME_TRIAL']),{mode:'TOTAL_ONLY',needsTotal:true,needsNormal:false,needsExcludedGames:true});
});

test('rejects a displayed game-count range that no adopted observation consumes',()=>{
 const d:any=buildCanonicalUi(candidate,observation,evaluation,ca,oa,ea);
 d.playInfo.mode='TOTAL_AND_NORMAL';
 d.playInfo.startFields.unshift({id:'startTotalGames',label:'着席時 総ゲーム数',mode:'NUMBER',directNumeric:true});
 d.playInfo.currentFields.unshift({id:'currentTotalGames',label:'現在 総ゲーム数',mode:'NUMBER',directNumeric:true});
 assert.throws(()=>validateCanonicalUiDocument(d,candidate,observation,evaluation,ca,oa,ea),/PLAY_MODE|PLAY_FIELDS_UNUSED_OR_MISSING/);
});

test('shortens contextual input names while descriptions explain the relationship',()=>{
 const o:any={label:'アクダマボーナス当選時のエピソードボーナス昇格',trialUniverse:'AKUDAMA_UPGRADE_TRIAL',denominatorSemantics:'アクダマボーナス当選時の昇格抽選を受けた回数に対する、エピソードボーナス昇格回数。'};
 const labels=deriveObservationInputLabels(o);
 assert.deepEqual(labels,{trialLabel:'昇格抽選回数',successLabel:'EPボーナス昇格回数'});
 const description=buildObservationDescription(o,'BERNOULLI',undefined);
 assert.match(description,/EPボーナス昇格が実際に起きた割合を設定別に比較します/);
 assert.doesNotMatch(description,/「昇格抽選回数」を数え|「EPボーナス昇格回数」/);
 assert.doesNotMatch(description,/・数えるもの：|・基準：/);
});


test('moves detailed eligibility conditions into descriptions while keeping inputs concise',()=>{
 const cases:any[]=[
  {
   label:'450G＋α仮天井選択',
   denominatorSemantics:'設定変更時・上位CZ後など選択条件が異なるケースを除いた、通常の天井ゲーム数選択回数に対する、450G＋αが選ばれた回数。',
   expected:{trialLabel:'天井ゲーム数選択回数',successLabel:'450G＋α選択回数'},
   detail:/設定変更時・上位CZ後など選択条件が異なるケースは対象に含めません/,
  },
  {
   label:'GG当選時のZ-ZONE昇格',
   denominatorSemantics:'ガイアステージ中を除くGG当選時に前兆ゲーム数がセットされた回数に対する、Z-ZONEへ昇格した回数。',
   expected:{trialLabel:'GG当選時の前兆セット回数',successLabel:'Z-ZONE昇格回数'},
   detail:/ガイアステージ中は対象に含めません/,
  },
  {
   label:'駿城ボーナス中・単独チャンス目の3000pt獲得率',
   denominatorSemantics:'駿城ボーナス中に単独チャンス目が成立した回数に対する、3000pt獲得回数。',
   expected:{trialLabel:'単独チャンス目成立回数',successLabel:'3000pt獲得回数'},
   detail:/3000pt獲得が実際に起きた割合を設定別に比較します/,
  },
  {
   label:'運命分岐モード・REG後/ART後/周期経由のLV2ナビ発生率',
   denominatorSemantics:'REG後・ART消化後・周期経由で運命分岐モードへ突入した回数に対する、LV2ナビ発生回数。',
   expected:{trialLabel:'運命分岐モード突入回数',successLabel:'LV2ナビ発生回数'},
   detail:/LV2ナビ発生が実際に起きた割合を設定別に比較します/,
  },
  {
   label:'ART未突入で運命分岐モード転落時の100G引き継ぎ選択率',
   denominatorSemantics:'ART未突入で運命分岐モードから転落し、引き継ぎが発生した回数に対する、100G選択回数。',
   expected:{trialLabel:'引き継ぎ発生回数',successLabel:'100G選択回数'},
   detail:/100G選択が実際に起きた割合を設定別に比較します/,
  },
  {
   label:'通常初当たりCZの開始エピソード振り分け',
   denominatorSemantics:'虚構連モード直後・設定変更直後を除く通常初当たりCZの開始回数に対する開始エピソード内訳。',
   expected:{trialLabel:'開始回数',successLabel:'開始エピソード内訳回数'},
   detail:/虚構連モード直後・設定変更直後は対象に含めません/,
  },
 ];
 for(const c of cases){
  const {expected,detail,...rest}=c;
  const o:any={...rest,trialUniverse:'CUSTOM_TRIAL'};
  assert.deepEqual(deriveObservationInputLabels(o),expected);
  assert.match(buildObservationDescription(o,'BERNOULLI',undefined),detail);
 }
});

test('contextual compaction keeps the raw conditions in the explanation',()=>{
 const o:any={label:'450G＋α仮天井選択',trialUniverse:'CUSTOM_TRIAL',denominatorSemantics:'設定変更時・上位CZ後など選択条件が異なるケースを除いた、通常の天井ゲーム数選択回数に対する、450G＋αが選ばれた回数。'};
 assert.deepEqual(deriveObservationInputLabels(o),{trialLabel:'天井ゲーム数選択回数',successLabel:'450G＋α選択回数'});
 const description=buildObservationDescription(o,'BERNOULLI',undefined);
 assert.match(description,/設定変更時・上位CZ後など選択条件が異なるケースは対象に含めません/);
 assert.doesNotMatch(description,/母数|・数えるもの：|・基準：/);
});

test('actual Z-ZONE semantics keep the exclusion but do not replay both input labels',()=>{
 const o:any={label:'GG当選時のZ-ZONE昇格',trialUniverse:'GG_NON_GAIA_INITIAL_HIT_TRIAL',denominatorSemantics:'ガイアステージ中を除くGG当選時に前兆ゲーム数がセットされた機会。Z-ZONEへ昇格した回数を数える。'};
 const labels=deriveObservationInputLabels(o);
 assert.deepEqual(labels,{trialLabel:'GG当選時の前兆セット回数',successLabel:'Z-ZONE昇格回数'});
 const description=buildObservationDescription(o,'BERNOULLI',undefined);
 assert.match(description,/Z-ZONE昇格が実際に起きた割合を設定別に比較します/);
 assert.match(description,/ガイアステージ中は対象に含めません/);
 assert.ok(!description.includes(labels.trialLabel)||!description.includes(labels.successLabel),'description must not replay both numeric input labels');
});

test('validator rejects prose that replays multiple numeric input labels',()=>{
 const d:any=buildCanonicalUi(candidate,observation,evaluation,ca,oa,ea);
 const section=d.numericSections[0];
 section.description='「'+section.inputs[0].label+'」を数え、そのうち「'+section.inputs[1].label+'」を入力します。';
 assert.throws(()=>validateCanonicalUiDocument(d,candidate,observation,evaluation,ca,oa,ea),/DESCRIPTION_REPEATS_INPUT_LABELS|DESCRIPTION/);
});

test('compacts observed-total denominator wording into a short input label',()=>{
 const o:any={label:'STAND BY移行時キャラ',trialUniverse:'STANDBY_CHARACTER_TRIAL',denominatorSemantics:'STAND BY状態へ移行し、男性/女性キャラを確認できた回数の合計を観測母数とする。'};
 assert.deepEqual(deriveObservationInputLabels(o),{trialLabel:'男性/女性キャラ確認回数',successLabel:'キャラ回数'});
 assert.ok(deriveObservationInputLabels(o).trialLabel.length<=30);
});

test('normalizes literal escaped line breaks before user-facing copy',()=>{
 const o:any={label:'REG中キャラ紹介',trialUniverse:'REG_TRIAL',denominatorSemantics:'REG回数に対する、特定シナリオ回数。',details:['REGごとに最後まで確認する\\n・反映：別の欄へ重ねて入力する必要はありません']};
 const description=buildObservationDescription(o,'BERNOULLI',undefined);
 assert.doesNotMatch(description,/\\n|\/n/);
 assert.match(description,/REGごとに最後まで確認する/);
});

test('validator rejects long or particle-prefixed numeric input labels',()=>{
 const d:any=buildCanonicalUi(candidate,observation,evaluation,ca,oa,ea);
 d.numericSections[0].inputs[0].role='trial';
 d.numericSections[0].inputs[0].label='に'+('長'.repeat(31));
 assert.throws(()=>validateCanonicalUiDocument(d,candidate,observation,evaluation,ca,oa,ea),/INPUT_LABEL_NOT_CONCISE/);
});


test('preserves canonical labels for known game-count trial universes',()=>{
 const excluded:any={label:'連チャン中を除くボーナス初当たり',trialUniverse:'NON_CHAIN_BONUS_INITIAL_GAME_TRIAL',denominatorSemantics:'総ゲーム数から連チャン中のゲーム数を除いたゲーム数に対するボーナス初当たり回数。'};
 assert.deepEqual(deriveObservationInputLabels(excluded),{trialLabel:'連荘中を除くゲーム数',successLabel:'ボーナス初当たり回数'});
 const total:any={label:'チェリー',trialUniverse:'TOTAL_GAME_TRIAL',denominatorSemantics:'総ゲーム数に対するチェリー成立回数。'};
 assert.deepEqual(deriveObservationInputLabels(total),{trialLabel:'総ゲーム数',successLabel:'チェリー成立回数'});
 assert.deepEqual(derivePlayInfoRequirement(['NON_CHAIN_BONUS_INITIAL_GAME_TRIAL']),{mode:'TOTAL_ONLY',needsTotal:true,needsNormal:false,needsExcludedGames:true});
 const tenha:any={label:'天破の刻突入',trialUniverse:'NON_TENHA_NORMAL_GAME_TRIAL',denominatorSemantics:'通常時ゲーム数に対する天破突入回数。天破の刻中は対象に含めません。'};
 assert.deepEqual(deriveObservationInputLabels(tenha),{trialLabel:'天破中を除く通常ゲーム数',successLabel:'天破突入回数'});
 assert.deepEqual(derivePlayInfoRequirement(['NON_TENHA_NORMAL_GAME_TRIAL']),{mode:'NORMAL_ONLY',needsTotal:false,needsNormal:true,needsExcludedGames:false});
});
