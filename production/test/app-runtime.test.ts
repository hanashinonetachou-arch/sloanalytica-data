import test from 'node:test';import assert from 'node:assert/strict';import {buildAppRuntime} from '../src/app-runtime-builder.ts';import {validateAppRuntimeDocument} from '../src/app-runtime-validator.ts';
const ref={path:'p'};
const base={batchId:'batch-x',machineId:'M',machineName:'Machine',activeFeatures:[],inactiveFeatures:[],settings:{status:'SOURCE_DERIVED',values:['SET_1','SET_2']},packagePolicy:{offlineCapable:true},evidence:[],heldObservations:[{findingId:'h',label:'Held',status:'HELD_NO_JOINT_MODEL'}],highLowDiscrimination:{status:'NOT_COMPUTED',reason:'x'},runtimeUi:{schemaVersion:'canonical-ui-v1',playInfo:{visible:true,mode:'NONE',useDifference:{label:'着席時との差分を使用'}},numericSections:[],evidenceSections:[]}};
test('builds app-compatible reference-only package',()=>{const d=buildAppRuntime(base,ref);assert.equal(d.package.schemaVersion,1);assert.equal(d.package.ui.contractVersion,'runtime-ui-v8');assert.equal(d.package.features.features.length,0);assert.doesNotThrow(()=>validateAppRuntimeDocument(d,base,ref))});
test('fails closed for unresolved settings',()=>{assert.throws(()=>buildAppRuntime({...base,settings:{status:'UNRESOLVED',values:[]}},ref),/SETTINGS_REQUIRED/)});
test('materializes active Bernoulli feature and play-data binding',()=>{const p:any={...base,activeFeatures:[{findingId:'f',name:'CZ初当り',model:'BERNOULLI',trialUniverse:'NORMAL_GAME_TRIAL',settingDistribution:{'1':'1/200','2':'1/150'},runtimePolicyBinding:{metric:'PER_ELIGIBLE_TRIAL_POWER',value:2},score:{status:'NOT_COMPUTED'}}],runtimeUi:{...base.runtimeUi,numericSections:[{id:'OBS_f',sourceFindingId:'f',title:'CZ初当り',inputs:[{id:'f.eligibleTrialCount',label:'確認した回数',role:'trial',quickAdd:[50]},{id:'f.successCount',label:'該当した回数',role:'success',quickAdd:[1]}]}]}};const d=buildAppRuntime(p,ref);assert.equal(d.package.features.features[0].modelType,'binomial');assert.equal(d.package.inputs.inputs.length,2);assert.equal(d.package.ui.v8Sections[0].items[0].inputs[0].label,'確認した回数');assert.equal(d.package.ui.v8Sections[0].items[0].inputs[1].label,'該当した回数');assert.equal(d.package.ui.v8Sections[0].items[0].inputs[0].playDataBinding.source,'PLAY_NORMAL_GAME_DELTA');assert.doesNotThrow(()=>validateAppRuntimeDocument(d,p,ref))});
test('materializes active categorical feature with explicit opportunity count',()=>{const p:any={...base,activeFeatures:[{findingId:'j',name:'終了画面',model:'CATEGORICAL',trialUniverse:'AT_END_SCREEN_TRIAL',settingDistribution:{'1':{'弱':0.2,'強':0.1},'2':{'弱':0.3,'強':0.2}},runtimePolicyBinding:{metric:'PER_ELIGIBLE_TRIAL_POWER',value:4},score:{status:'NOT_COMPUTED'}}],runtimeUi:{...base.runtimeUi,numericSections:[{id:'OBS_j',sourceFindingId:'j',title:'終了画面',inputs:[{id:'j.eligibleTrialCount',label:'確認した回数',role:'trial',quickAdd:[50]},{id:'j.categoryCounts.1_弱',label:'弱',role:'categoryCount',quickAdd:[1]},{id:'j.categoryCounts.2_強',label:'強',role:'categoryCount',quickAdd:[1]}]}]}};const d=buildAppRuntime(p,ref);assert.equal(d.package.features.features[0].modelType,'multinomial');assert.deepEqual(d.package.features.features[0].categoryProbabilities.SET_1,[0.2,0.1]);assert.equal(d.package.ui.v8Sections[0].items[0].interaction.opportunityTracking.inputId,'j.eligibleTrialCount');assert.doesNotThrow(()=>validateAppRuntimeDocument(d,p,ref))});

test('exhaustive categorical feature derives its denominator from category counts',()=>{const p:any={...base,activeFeatures:[{findingId:'j',name:'終了時振り分け',model:'CATEGORICAL',trialUniverse:'END_TRIAL',categoryModel:{residualPolicy:'SOURCE_EXHAUSTIVE'},settingDistribution:{'1':'青60% / 赤40%','2':'青40% / 赤60%'},runtimePolicyBinding:{metric:'PER_ELIGIBLE_TRIAL_POWER',value:4},score:{status:'NOT_COMPUTED'}}],runtimeUi:{...base.runtimeUi,numericSections:[{id:'OBS_j',sourceFindingId:'j',title:'終了時振り分け',inputs:[{id:'j.eligibleTrialCount',label:'確認した回数',role:'trial',quickAdd:[50]},{id:'j.categoryCounts.1_青',label:'青',role:'categoryCount',quickAdd:[1]},{id:'j.categoryCounts.2_赤',label:'赤',role:'categoryCount',quickAdd:[1]}]}]}};const d=buildAppRuntime(p,ref);const feature=d.package.features.features[0];const input=d.package.inputs.inputs.find((x:any)=>x.id==='j.eligibleTrialCount');const interaction=d.package.ui.v8Sections[0].items[0].interaction;assert.equal(feature.denominatorRule,'SUM_CATEGORY_COUNTS');assert.equal(input.inputVisible,false);assert.equal(input.derivedCalculation,'sum');assert.deepEqual(input.derivedFromInputIds,['j.categoryCounts.1_青','j.categoryCounts.2_赤']);assert.equal(interaction.totalOpportunities,'SUM_CATEGORY_COUNTS');assert.equal(interaction.opportunityTracking,undefined);assert.deepEqual(interaction.categories.map((x:any)=>x.meaning),[undefined,undefined]);assert.doesNotThrow(()=>validateAppRuntimeDocument(d,p,ref))});

test('shared normal denominator uses feature names as the section title and two-column result counters',()=>{const features=[{findingId:'cz',name:'CZ初当り',model:'BERNOULLI',trialUniverse:'NORMAL_GAME_TRIAL',settingDistribution:{'1':'1/200','2':'1/180'},runtimePolicyBinding:{metric:'SELECTION_SCORE',value:20},score:{status:'COMPUTED',value:20}},{findingId:'at',name:'AT初当り',model:'BERNOULLI',trialUniverse:'NORMAL_GAME_TRIAL',settingDistribution:{'1':'1/400','2':'1/320'},runtimePolicyBinding:{metric:'SELECTION_SCORE',value:20},score:{status:'COMPUTED',value:20}}];const numericSections=features.map((x:any)=>({id:'OBS_'+x.findingId,sourceFindingId:x.findingId,title:x.name,inputs:[{id:x.findingId+'.eligibleTrialCount',label:'確認した回数',role:'trial',quickAdd:[50]},{id:x.findingId+'.successCount',label:'該当した回数',role:'success',quickAdd:[1]}]}));const p:any={...base,activeFeatures:features,runtimeUi:{...base.runtimeUi,numericSections}};const d=buildAppRuntime(p,ref);const section=d.package.ui.v8Sections[0];assert.equal(section.title,'CZ初当り・AT初当り');assert.notEqual(section.title,section.groups[0].label);assert.deepEqual(section.items.map((x:any)=>x.gridSpan),[6,6]);assert.doesNotThrow(()=>validateAppRuntimeDocument(d,p,ref))});

test('non-chain total-game trial auto-binds total minus exclusions only for that denominator',()=>{const p:any={...base,activeFeatures:[{findingId:'bonus',name:'ボーナス初当り',model:'BERNOULLI',trialUniverse:'LOTIS_NON_CHAIN_GAME_TRIAL',settingDistribution:{'1':'1/300','2':'1/280'},runtimePolicyBinding:{metric:'PER_ELIGIBLE_TRIAL_POWER',value:2},score:{status:'NOT_COMPUTED'}}],runtimeUi:{...base.runtimeUi,numericSections:[{id:'OBS_bonus',sourceFindingId:'bonus',title:'ボーナス初当り',inputs:[{id:'bonus.eligibleTrialCount',label:'連荘中を除くゲーム数',role:'trial',quickAdd:[50]},{id:'bonus.successCount',label:'該当した回数',role:'success',quickAdd:[1]}]}]}};const d=buildAppRuntime(p,ref);const trial=d.package.ui.v8Sections[0].items[0].inputs[0];assert.equal(trial.label,'連荘中を除くゲーム数');assert.equal(trial.playDataBinding.source,'PLAY_TOTAL_GAME_DELTA_EXCLUDED');assert.equal(trial.playDataBinding.mode,'AUTO_EXACT');assert.match(d.package.ui.v8Sections[0].description,/連荘中を除くゲーム数/);assert.doesNotThrow(()=>validateAppRuntimeDocument(d,p,ref))});

test('blocked research items are visible in not-adopted summary',()=>{const p:any={...base,blockedItems:[{blockId:'b1',label:'設定差候補',reason:'設定別の値を確認できない。',reevaluationCondition:'設定別の値が公開される。'}]};const d=buildAppRuntime(p,ref);assert.ok(d.package.v8.machineResearchSummary.notAdopted.some((x:any)=>x.featureId==='b1'&&x.label==='設定差候補'));assert.doesNotThrow(()=>validateAppRuntimeDocument(d,p,ref))});

test('publishes computed HLD and removes unresolved HLD entry',()=>{const p:any={...base,highLowDiscrimination:{status:'COMPUTED',method:'BEST_SINGLE_EXACT_ACTIVE_FEATURE',results:[{games:1500,balancedAccuracyPercent:60.1},{games:3000,balancedAccuracyPercent:64.2},{games:7000,balancedAccuracyPercent:71.3}],selectedFeatureId:'f',eligibleFeatureIds:['f'],excludedFeatures:[]}};const d=buildAppRuntime(p,ref);assert.equal(d.package.v8.machineResearchSummary.highLowDiscrimination.status,'COMPUTED');assert.equal(d.package.v8.machineResearchSummary.unresolved.length,0);assert.doesNotThrow(()=>validateAppRuntimeDocument(d,p,ref))});

test('normalizes source string categorical rows including explicit residual category',()=>{const p:any={...base,activeFeatures:[{findingId:'j',name:'振り分け',model:'CATEGORICAL',trialUniverse:'EVENT_TRIAL',settingDistribution:{'1':'勝40% / 鳴海60%','2':'勝60% / 鳴海40%'},runtimePolicyBinding:{metric:'PER_ELIGIBLE_TRIAL_POWER',value:4},score:{status:'NOT_COMPUTED'}}],runtimeUi:{...base.runtimeUi,numericSections:[{id:'OBS_j',sourceFindingId:'j',title:'振り分け',inputs:[{id:'j.eligibleTrialCount',label:'確認した回数',role:'trial',quickAdd:[50]},{id:'j.categoryCounts.1_勝',label:'勝',role:'categoryCount',quickAdd:[1]},{id:'j.categoryCounts.2_鳴海',label:'鳴海',role:'categoryCount',quickAdd:[1]}]}]}};const d=buildAppRuntime(p,ref);assert.deepEqual(d.package.features.features[0].categoryProbabilities.SET_1,[0.4,0.6]);assert.doesNotThrow(()=>validateAppRuntimeDocument(d,p,ref))});
test('derives その他 from source string residual mass',()=>{const p:any={...base,activeFeatures:[{findingId:'j',name:'振り分け',model:'CATEGORICAL',trialUniverse:'EVENT_TRIAL',settingDistribution:{'1':'+20:5% / +4:0% / +6:0%','2':'+20:3% / +4:5% / +6:0%'},runtimePolicyBinding:{metric:'PER_ELIGIBLE_TRIAL_POWER',value:4},score:{status:'NOT_COMPUTED'}}],runtimeUi:{...base.runtimeUi,numericSections:[{id:'OBS_j',sourceFindingId:'j',title:'振り分け',inputs:[{id:'j.eligibleTrialCount',label:'確認した回数',role:'trial',quickAdd:[50]},{id:'j.categoryCounts.1_20',label:'+20',role:'categoryCount',quickAdd:[1]},{id:'j.categoryCounts.2_4',label:'+4',role:'categoryCount',quickAdd:[1]},{id:'j.categoryCounts.3_6',label:'+6',role:'categoryCount',quickAdd:[1]},{id:'j.categoryCounts.4_other',label:'その他',role:'categoryCount',quickAdd:[1]}]}]}};const d=buildAppRuntime(p,ref);assert.deepEqual(d.package.features.features[0].categoryProbabilities.SET_1,[0.05,0,0,0.95]);assert.doesNotThrow(()=>validateAppRuntimeDocument(d,p,ref))});

test('keeps vague setting hints as repeatable counters without inventing probability weights',()=>{const ev={id:'EVI_e',sourceFindingId:'e',title:'終了画面',description:'設定示唆として参照します。',runtimePolicyControlled:false,evidenceItems:[{findingId:'e',label:'終了画面',semanticType:'PROBABILITY_UNKNOWN',details:['茶屋：偶数設定示唆','街道：奇数設定示唆']}]};const p:any={...base,evidence:[ev],runtimeUi:{...base.runtimeUi,evidenceSections:[ev]}};const d=buildAppRuntime(p,ref);assert.equal(d.package.evidence.evidences.length,0);const s=d.package.ui.v8Sections.find((x:any)=>x.id==='EVI_e');assert.doesNotMatch(s.description,/Evidence/i);assert.match(s.description,/設定別の出現率が公表・確認されていない/);assert.match(s.description,/現在の設定推測計算には直接反映していません/);assert.match(s.description,/反映できる可能性があります/);assert.doesNotMatch(s.description,/反映できます。/);assert.equal(s.items[0].interaction.type,'CATEGORY_COUNTERS');assert.equal(s.items[0].interaction.categories.length,2);assert.equal(d.package.inputs.inputs.find((x:any)=>x.id==='REF_e_1').type,'counter');assert.equal(d.package.inputs.inputs.find((x:any)=>x.id==='REF_e_2').inferenceRole,'DISPLAY_ONLY');assert.doesNotThrow(()=>validateAppRuntimeDocument(d,p,ref))});

test('materializes source-grounded setting constraints for EvidenceEngine',()=>{const ev={id:'EVI_e',sourceFindingId:'e',title:'示唆',description:'x',runtimePolicyControlled:false,evidenceItems:[{findingId:'e',label:'示唆',semanticType:'EXACT_CONSTRAINT',details:['金：設定4以上','青：設定2否定','虹：設定6']}]};const p:any={...base,settings:{status:'SOURCE_DERIVED',values:['SET_1','SET_2','SET_3','SET_4','SET_5','SET_6']},evidence:[ev],runtimeUi:{...base.runtimeUi,evidenceSections:[ev]}};const d=buildAppRuntime(p,ref);assert.equal(d.package.evidence.evidences.length,3);assert.deepEqual(d.package.evidence.evidences[0].confirmedSettings,['SET_4','SET_5','SET_6']);assert.deepEqual(d.package.evidence.evidences[1].deniedSettings,['SET_2']);assert.deepEqual(d.package.evidence.evidences[2].confirmedSettings,['SET_6']);assert.equal(d.package.evidence.evidences[0].inputId,'REF_e_1');const s=d.package.ui.v8Sections.find((x:any)=>x.id==='EVI_e');assert.match(s.description,/設定候補の絞り込みに反映/);assert.doesNotThrow(()=>validateAppRuntimeDocument(d,p,ref))});

test('preserves resolved and ineligible decisions in not-adopted summary',()=>{const p:any={...base,nonRuntimeCandidates:[{findingId:'cz',label:'CZ初当り',dependencyResolution:'RESOLVED_BY_SINGLE_MEMBER',resolvedIntoFindingId:'bonus'}],excludedDecisions:[{findingId:'partial',label:'CZ成功率',reason:'設定別likelihoodが不完全。',reevaluationCondition:'全設定値が公開されること。'}]};const d=buildAppRuntime(p,ref);assert.deepEqual(d.package.v8.machineResearchSummary.notAdopted.map((x:any)=>x.featureId),['h','cz','partial']);assert.doesNotThrow(()=>validateAppRuntimeDocument(d,p,ref))});

test('renders setting-hint guidance once at section level',()=>{const ev={id:'EVI_e',sourceFindingId:'e',title:'終了画面',description:'設定示唆として参照します。',runtimePolicyControlled:false,evidenceItems:[{findingId:'e',label:'終了画面',semanticType:'PROBABILITY_UNKNOWN',details:[]}]};const p:any={...base,evidence:[ev],runtimeUi:{...base.runtimeUi,evidenceSections:[ev]}};const d=buildAppRuntime(p,ref);const s=d.package.ui.v8Sections.find((x:any)=>x.id==='EVI_e');assert.match(s.description,/設定示唆/);assert.doesNotMatch(s.description,/Evidence/i);assert.equal(s.items[0].description,undefined);assert.doesNotThrow(()=>validateAppRuntimeDocument(d,p,ref))});

test('keeps internal runtime terminology out of research summary copy',()=>{const p:any={...base,activeFeatures:[{findingId:'f',name:'CZ初当り',model:'BERNOULLI',trialUniverse:'NORMAL_GAME_TRIAL',settingDistribution:{'1':'1/200','2':'1/150'},runtimePolicyBinding:{metric:'PER_ELIGIBLE_TRIAL_POWER',value:2},score:{status:'NOT_COMPUTED'}}],inactiveFeatures:[{findingId:'i',name:'AT初当り',metric:'SELECTION_SCORE',value:4,threshold:5}],runtimeUi:{...base.runtimeUi,numericSections:[{id:'OBS_f',sourceFindingId:'f',title:'CZ初当り',inputs:[{id:'f.eligibleTrialCount',label:'確認した回数',role:'trial'},{id:'f.successCount',label:'該当した回数',role:'success'}]}]}};const d=buildAppRuntime(p,ref);const text=JSON.stringify(d.package.v8.machineResearchSummary);assert.doesNotMatch(text,/Runtime Policy|joint model/i);assert.match(text,/現在の採用基準/);});

test('inactive feature keeps its user-facing label instead of generic fallback',()=>{const p:any={...base,inactiveFeatures:[{findingId:'inactive',name:'CZ初当り',metric:'SELECTION_SCORE',value:4,threshold:5}]};const d=buildAppRuntime(p,ref);const entry=d.package.v8.machineResearchSummary.notAdopted.find((x:any)=>x.featureId==='inactive');assert.equal(entry.label,'CZ初当り');assert.doesNotThrow(()=>validateAppRuntimeDocument(d,p,ref));});
test('generic or missing summary labels fail closed',()=>{const p:any={...base,inactiveFeatures:[{findingId:'inactive',metric:'SELECTION_SCORE',value:4,threshold:5}]};assert.throws(()=>buildAppRuntime(p,ref),/APP_RUNTIME_SUMMARY_LABEL_REQUIRED:inactive/);});
test('held no-joint-model explains confirmed rates, dependency risk, and reevaluation condition',()=>{const p:any={...base,heldObservations:[{findingId:'cherry',label:'チェリー',status:'HELD_NO_JOINT_MODEL',reevaluationCondition:'internal'}]};const d=buildAppRuntime(p,ref);const entry=d.package.v8.machineResearchSummary.notAdopted.find((x:any)=>x.featureId==='cherry');assert.match(entry.reason,/設定別出現率自体は確認/);assert.match(entry.reason,/独立/);assert.match(entry.reason,/二重評価/);assert.match(entry.reevaluationCondition,/依存関係モデル/);assert.match(entry.reevaluationCondition,/代表要素/);assert.doesNotThrow(()=>validateAppRuntimeDocument(d,p,ref));});


test('fails closed when v8.5 play-data difference control is not declared',()=>{const p:any={...base,runtimeUi:{...base.runtimeUi,playInfo:undefined}};const d=buildAppRuntime(p,ref);assert.throws(()=>validateAppRuntimeDocument(d,p,ref),/UI_PLAY_INFO/)});

test('materializes enumerated explicit setting constraints without invented weights',()=>{const ev={id:'EVI_e',sourceFindingId:'e',title:'示唆',description:'x',runtimePolicyControlled:false,evidenceItems:[{findingId:'e',label:'示唆',semanticType:'EXACT_CONSTRAINT',details:['246枚：設定2・4・6','舞坂：設定1・5・6濃厚']}]};const p:any={...base,settings:{status:'SOURCE_DERIVED',values:['SET_1','SET_2','SET_3','SET_4','SET_5','SET_6']},evidence:[ev],runtimeUi:{...base.runtimeUi,evidenceSections:[ev]}};const d=buildAppRuntime(p,ref);assert.deepEqual(d.package.evidence.evidences[0].confirmedSettings,['SET_2','SET_4','SET_6']);assert.deepEqual(d.package.evidence.evidences[1].confirmedSettings,['SET_1','SET_5','SET_6']);assert.doesNotThrow(()=>validateAppRuntimeDocument(d,p,ref))});

test('mixed Evidence materializes only exact category and keeps directional category reference-only',()=>{const ev:any={id:'EVI_mix',sourceFindingId:'mix',title:'終了画面',runtimePolicyControlled:false,evidenceItems:[{findingId:'mix',label:'終了画面',semanticType:'DISPLAY_ONLY',semanticCategories:[{label:'虹：設定6',semanticType:'EXACT_CONSTRAINT'},{label:'制服：高設定示唆（強）',semanticType:'PROBABILITY_UNKNOWN'}],details:['虹：設定6','制服：高設定示唆（強）']}]};const p:any={...base,settings:{status:'SOURCE_DERIVED',values:['SET_1','SET_2','SET_3','SET_4','SET_5','SET_6']},evidence:[ev],runtimeUi:{...base.runtimeUi,evidenceSections:[ev]}};const d=buildAppRuntime(p,ref);assert.equal(d.package.evidence.evidences.length,1);assert.deepEqual(d.package.evidence.evidences[0].confirmedSettings,['SET_6']);const s=d.package.ui.v8Sections.find((x:any)=>x.id==='EVI_mix');assert.match(s.description,/設定候補の絞り込み/);assert.match(s.description,/直接反映していません/)});

test('maps non-Tenha normal games to automatic excluded normal-game binding',()=>{
 const p:any={...base,activeFeatures:[{findingId:'tenha',name:'天破の刻突入',model:'BERNOULLI',trialUniverse:'NON_TENHA_NORMAL_GAME_TRIAL',settingDistribution:{'1':'1/100.2','2':'1/99.4'},runtimePolicyBinding:{metric:'PER_ELIGIBLE_TRIAL_POWER',value:1},score:{status:'NOT_COMPUTED'}}],runtimeUi:{...base.runtimeUi,playInfo:{visible:true,mode:'NORMAL_ONLY',useDifference:{label:'着席時との差分を使用'},exclusionGames:{visible:true,label:'天破中ゲーム数',quickAdd:[7,14,21],base:'NORMAL',resultLabel:'天破中を除く通常ゲーム数'}},numericSections:[{id:'OBS_tenha',sourceFindingId:'tenha',title:'天破の刻突入',inputs:[{id:'tenha.trials',label:'天破中を除く通常ゲーム数',role:'trial'},{id:'tenha.hits',label:'天破突入回数',role:'success'}]}]}};
 const d=buildAppRuntime(p,ref);const trial=d.package.ui.v8Sections[0].items[0].inputs[0];assert.equal(trial.playDataBinding.source,'PLAY_NORMAL_GAME_DELTA_EXCLUDED');assert.equal(trial.playDataBinding.mode,'AUTO_EXACT');assert.doesNotThrow(()=>validateAppRuntimeDocument(d,p,ref));
});

test('maps total-game and target-game trial universes to game denominators',()=>{
 const total:any={...base,activeFeatures:[{findingId:'total',name:'小役合算',model:'BERNOULLI',trialUniverse:'TOTAL_GAME_TRIAL',settingDistribution:{'1':'1/10','2':'1/9'},runtimePolicyBinding:{metric:'SELECTION_SCORE',value:8},score:{status:'COMPUTED',value:8}}],runtimeUi:{...base.runtimeUi,numericSections:[{id:'OBS_total',sourceFindingId:'total',title:'小役合算',inputs:[{id:'total.trials',label:'総ゲーム数',role:'trial'},{id:'total.hits',label:'該当した回数',role:'success'}]}]}};
 const d1=buildAppRuntime(total,ref);const t1=d1.package.ui.v8Sections[0].items[0].inputs[0];assert.equal(t1.label,'総ゲーム数');assert.equal(t1.playDataBinding.source,'PLAY_TOTAL_GAME_DELTA');assert.equal(d1.package.inputs.inputs[0].unit,'G');
 const target:any={...base,activeFeatures:[{findingId:'target',name:'REG後50G間の無限AT移行',model:'BERNOULLI',trialUniverse:'REG_AFTER_50G_GAME_TRIAL',settingDistribution:{'1':'1/100','2':'1/80'},runtimePolicyBinding:{metric:'SELECTION_SCORE',value:8},score:{status:'COMPUTED',value:8}}],runtimeUi:{...base.runtimeUi,numericSections:[{id:'OBS_target',sourceFindingId:'target',title:'REG後50G間の無限AT移行',inputs:[{id:'target.trials',label:'REG後50Gの対象ゲーム数',role:'trial'},{id:'target.hits',label:'無限ATへ移行した回数',role:'success'}]}]}};
 const d2=buildAppRuntime(target,ref);const t2=d2.package.ui.v8Sections[0].items[0].inputs[0];assert.equal(t2.label,'REG後50Gの対象ゲーム数');assert.equal(d2.package.inputs.inputs[0].unit,'G');assert.match(d2.package.ui.v8Sections[0].description,/REG後50Gの対象ゲーム数/);
});
test('shows evidence object name next to its user-facing meaning',()=>{
 const ev:any={id:'EVI_screen',sourceFindingId:'screen',title:'AT終了画面',runtimePolicyControlled:false,evidenceItems:[{findingId:'screen',label:'AT終了画面',semanticType:'DISPLAY_ONLY',semanticCategories:[{label:'カレン：偶数設定示唆',semanticType:'PROBABILITY_UNKNOWN'},{label:'亡国のアキト：設定6',semanticType:'EXACT_CONSTRAINT'}],details:['カレン：偶数設定示唆','亡国のアキト：設定6']}]};
 const p:any={...base,settings:{status:'SOURCE_DERIVED',values:['SET_1','SET_2','SET_3','SET_4','SET_5','SET_6']},evidence:[ev],runtimeUi:{...base.runtimeUi,evidenceSections:[ev]}};
 const d=buildAppRuntime(p,ref);const cats=d.package.ui.v8Sections.find((x:any)=>x.id==='EVI_screen').items[0].interaction.categories;assert.deepEqual(cats.map((x:any)=>[x.label,x.meaning]),[['カレン','偶数設定示唆'],['亡国のアキト','設定6']]);
});

test('materializes exact parity constraints',()=>{const ev:any={id:'EVI_parity',sourceFindingId:'parity',title:'獲得枚数表示',runtimePolicyControlled:false,evidenceItems:[{findingId:'parity',label:'獲得枚数表示',semanticType:'EXACT_CONSTRAINT',semanticCategories:[{label:'246枚：偶数設定濃厚',semanticType:'EXACT_CONSTRAINT'},{label:'135枚：奇数設定濃厚',semanticType:'EXACT_CONSTRAINT'}],details:['246枚：偶数設定濃厚','135枚：奇数設定濃厚']}]};const p:any={...base,settings:{status:'SOURCE_DERIVED',values:['SET_1','SET_2','SET_3','SET_4','SET_5','SET_6']},evidence:[ev],runtimeUi:{...base.runtimeUi,evidenceSections:[ev]}};const d=buildAppRuntime(p,ref);assert.deepEqual(d.package.evidence.evidences[0].confirmedSettings,['SET_2','SET_4','SET_6']);assert.deepEqual(d.package.evidence.evidences[1].confirmedSettings,['SET_1','SET_3','SET_5']);assert.doesNotThrow(()=>validateAppRuntimeDocument(d,p,ref))});


test('sanitizes internal terminology from blocked summary and feature rationale',()=>{
 const p:any={...base,activeFeatures:[{findingId:'f',name:'CZ初当り',model:'BERNOULLI',trialUniverse:'NORMAL_GAME_TRIAL',settingDistribution:{'1':'1/200','2':'1/150'},runtimePolicyBinding:{metric:'PER_ELIGIBLE_TRIAL_POWER',value:2},score:{status:'NOT_COMPUTED'}}],blockedItems:[{blockId:'b',label:'追加設定差',reason:'設定別likelihoodが不足しjoint model未確立。',reevaluationCondition:'source-supportedなdependency modelが得られる。'}],runtimeUi:{...base.runtimeUi,numericSections:[{id:'OBS_f',sourceFindingId:'f',title:'CZ初当り',inputs:[{id:'f.eligibleTrialCount',label:'確認した回数',role:'trial'},{id:'f.successCount',label:'該当した回数',role:'success'}]}]}};
 const d=buildAppRuntime(p,ref);const summary=d.package.v8.machineResearchSummary;const rationale=d.package.features.features[0].selectionRationale;
 const visible=[...(summary.adopted??[]).flatMap((x:any)=>[x.label,x.reason]),...(summary.notAdopted??[]).flatMap((x:any)=>[x.label,x.reason,x.reevaluationCondition]),...(summary.unresolved??[]).flatMap((x:any)=>[x.label,x.reason]),...Object.values(rationale)].filter(Boolean).join(' ');
 assert.doesNotMatch(visible,/likelihood|joint model|dependency model|candidate contract|runtime policy|research|evaluation/i);
 assert.match(visible,/数値推測/);assert.match(visible,/要素を同時に扱う統計モデル/);assert.match(visible,/採用条件/);
});

test('structured Evidence categories survive to UI and only exact categories constrain settings',()=>{
 const ev:any={id:'EVI_e',sourceFindingId:'e',title:'終了画面',runtimePolicyControlled:false,evidenceItems:[{findingId:'e',label:'終了画面',semanticType:'MIXED_CATEGORICAL',semanticCategories:[{label:'制服',meaning:'設定2以上示唆',semanticType:'PROBABILITY_UNKNOWN'},{label:'虹',meaning:'設定6濃厚',semanticType:'EXACT_CONSTRAINT'}],details:[]}]};
 const p:any={...base,settings:{status:'SOURCE_DERIVED',values:['SET_1','SET_2','SET_3','SET_4','SET_5','SET_6']},evidence:[ev],runtimeUi:{...base.runtimeUi,evidenceSections:[ev]}};
 const d=buildAppRuntime(p,ref);const section=d.package.ui.v8Sections.find((x:any)=>x.id==='EVI_e');
 assert.deepEqual(section.items[0].interaction.categories.map((x:any)=>[x.label,x.meaning]),[['制服','設定2以上示唆'],['虹','設定6濃厚']]);
 assert.equal(d.package.evidence.evidences.length,1);
 assert.deepEqual(d.package.evidence.evidences[0].confirmedSettings,['SET_6']);
 assert.match(section.description,/公表・確認されていない/);
 assert.doesNotThrow(()=>validateAppRuntimeDocument(d,p,ref));
});

test('shows only the formal metric appropriate to the feature',()=>{
 const p:any={...base,activeFeatures:[{findingId:'f',name:'初当り',model:'BERNOULLI',trialUniverse:'NORMAL_GAME_TRIAL',settingDistribution:{'1':'1/200','2':'1/150'},runtimePolicyBinding:{metric:'SELECTION_SCORE',value:12},score:{status:'COMPUTED',value:12}}],runtimeUi:{...base.runtimeUi,numericSections:[{id:'OBS_f',sourceFindingId:'f',title:'初当り',score:{status:'COMPUTED',value:12},perEligibleTrialPower:{value:12},inputs:[{id:'f.eligibleTrialCount',label:'確認した回数',role:'trial'},{id:'f.successCount',label:'該当した回数',role:'success'}]}]}};
 const d=buildAppRuntime(p,ref);const description=d.package.ui.v8Sections[0].description;
 assert.doesNotMatch(description,/設定判別スコア|1回の判別力|・数えるもの：|・基準：|母数|そのうち/);assert.match(description,/設定別に比較/);
});


test('reuses one categorical input for exact Evidence when mapping is unambiguous',()=>{
 const numeric={id:'OBS_reg',sourceFindingId:'reg',title:'REG中キャラ紹介シナリオの設定別選択率',model:'CATEGORICAL',trialUniverse:'REG_CHARACTER_SCENARIO_TRIAL',description:'REGごとにキャラ紹介を最後まで確認し、表示されたシナリオを1回加算して記録します。',inputs:[
  {id:'reg.eligibleTrialCount',label:'REGを最後まで確認した回数',role:'trial'},
  {id:'reg.categoryCounts.1',label:'アイリス①（1人目まもるくん・設定1否定）',role:'categoryCount'},
  {id:'reg.categoryCounts.2',label:'アイリス⑥（まもるくん無し・設定6濃厚）',role:'categoryCount'}
 ]};
 const ev={id:'EVI_mamoru',sourceFindingId:'mamoru',title:'REGキャラ・まもるくん',trialUniverse:'REG_CHARACTER_SCENARIO_TRIAL',description:'REG中のキャラ紹介で、まもるくんの出現パターンを記録します。',evidenceItems:[{findingId:'mamoru',label:'REGキャラ・まもるくん',trialUniverse:'REG_CHARACTER_SCENARIO_TRIAL',semanticType:'EXACT_CONSTRAINT',semanticCategories:[
  {label:'1人目にまもるくん',meaning:'設定1否定',semanticType:'EXACT_CONSTRAINT'},
  {label:'まもるくん無し（全員アイリス）',meaning:'設定6濃厚',semanticType:'EXACT_CONSTRAINT'}
 ]}]};
 const p:any={...base,settings:{status:'SOURCE_DERIVED',values:['SET_1','SET_2','SET_3','SET_4','SET_5','SET_6']},activeFeatures:[{findingId:'reg',name:numeric.title,model:'CATEGORICAL',trialUniverse:'REG_CHARACTER_SCENARIO_TRIAL',categoryModel:{residualPolicy:'SOURCE_EXHAUSTIVE'},settingDistribution:{'1':{'アイリス①（1人目まもるくん・設定1否定）':0,'アイリス⑥（まもるくん無し・設定6濃厚）':1},'6':{'アイリス①（1人目まもるくん・設定1否定）':0.5,'アイリス⑥（まもるくん無し・設定6濃厚）':0.5}},runtimePolicyBinding:{metric:'PER_ELIGIBLE_TRIAL_POWER',value:5},score:{status:'NOT_COMPUTED'}}],runtimeUi:{...base.runtimeUi,numericSections:[numeric],evidenceSections:[ev]},evidence:[ev]};
 const d=buildAppRuntime(p,ref);
 assert.equal(d.package.ui.v8Sections.some((s:any)=>s.id==='EVI_mamoru'),false);
 assert.equal(d.package.inputs.inputs.some((x:any)=>String(x.id).startsWith('REF_mamoru_')),false);
 assert.equal(d.package.evidence.evidences[0].inputId,'reg.categoryCounts.1');
 assert.equal(d.package.evidence.evidences[1].inputId,'reg.categoryCounts.2');
 assert.match(d.package.ui.v8Sections.find((s:any)=>s.id==='OBS_reg').description,/別の欄へ重ねて入力する必要はありません/);
 assert.doesNotThrow(()=>validateAppRuntimeDocument(d,p,ref));
});


test('reference-only decision preserves its concrete user-facing reason',()=>{
 const p:any={...base,excludedDecisions:[{
   findingId:'ref',label:'内部モード別の当選率',eligibility:'NOT_APPLICABLE',
   reason:'参考分布として保存するが設定推測Featureには使用しない。',
   userFacingReason:'内部モードを実戦中に常時確定できないため、設定別原分布は参考情報として保持します。',
   reevaluationCondition:'内部モードを全サンプルで確定できる観測方法が確立すること。'
 }]};
 const d=buildAppRuntime(p,ref);
 const entry=d.package.v8.machineResearchSummary.notAdopted.find((x:any)=>x.featureId==='ref');
 assert.equal(entry.reason,'内部モードを実戦中に常時確定できないため、設定別原分布は参考情報として保持します。');
 assert.match(entry.reevaluationCondition,/観測条件/);
 assert.doesNotThrow(()=>validateAppRuntimeDocument(d,p,ref));
});


test('explicit Evidence links reuse Bernoulli success inputs while leaving unrelated categories visible',()=>{
 const numeric={id:'OBS_direct',sourceFindingId:'direct',title:'通常時 強チェリーからボーナス直撃',model:'BERNOULLI',trialUniverse:'STRONG_CHERRY_TRIAL',description:'対象となる成立役のうち、直撃が起きた割合を設定別に比較します。',inputs:[
  {id:'direct.trials',label:'強チェリー成立回数',role:'trial'},
  {id:'direct.success',label:'ボーナス直撃回数',role:'success'}
 ]};
 const ev:any={id:'EVI_hints',sourceFindingId:'hints',title:'直撃契機・設定確定演出',description:'確認した項目を記録します。',evidenceItems:[{findingId:'hints',label:'直撃契機・設定確定演出',semanticType:'EXACT_CONSTRAINT',semanticCategories:[
  {label:'通常時 強チェリーから直撃',meaning:'設定2以上',semanticType:'EXACT_CONSTRAINT',linkedFindingId:'direct'},
  {label:'虹トロフィー',meaning:'設定6',semanticType:'EXACT_CONSTRAINT'}
 ]}]};
 const p:any={...base,settings:{status:'SOURCE_DERIVED',values:['SET_1','SET_2','SET_3','SET_4','SET_5','SET_6']},activeFeatures:[{findingId:'direct',name:numeric.title,model:'BERNOULLI',trialUniverse:'STRONG_CHERRY_TRIAL',settingDistribution:{'1':0,'2':0.02,'3':0.02,'4':0.02,'5':0.02,'6':0.03},runtimePolicyBinding:{metric:'PER_ELIGIBLE_TRIAL_POWER',value:1},score:{status:'NOT_COMPUTED'}}],runtimeUi:{...base.runtimeUi,numericSections:[numeric],evidenceSections:[ev]},evidence:[ev]};
 const d=buildAppRuntime(p,ref);
 const evidenceSection=d.package.ui.v8Sections.find((s:any)=>s.id==='EVI_hints');
 assert.equal(evidenceSection.items[0].interaction.categories.length,1);
 assert.equal(evidenceSection.items[0].interaction.categories[0].label,'虹トロフィー');
 assert.equal(d.package.inputs.inputs.some((x:any)=>x.id==='REF_hints_1'),false);
 assert.equal(d.package.inputs.inputs.some((x:any)=>x.id==='REF_hints_2'),true);
 const constraints=d.package.evidence.evidences.filter((x:any)=>(x.sourceEvidenceRefs??[]).includes('hints'));
 assert.equal(constraints[0].inputId,'direct.success');
 assert.equal(constraints[1].inputId,'REF_hints_2');
 assert.match(d.package.ui.v8Sections.find((s:any)=>s.id==='OBS_direct').description,/別の欄へ重ねて入力する必要はありません/);
 assert.doesNotThrow(()=>validateAppRuntimeDocument(d,p,ref));
});


test('explicit categorical Evidence links prefer exact category names over substring matches',()=>{
 const numeric:any={id:'OBS_screen',sourceFindingId:'screen',title:'終了画面',model:'CATEGORICAL',trialUniverse:'END_SCREEN_TRIAL',description:'終了時に確認した画面を種類別に記録します。',inputs:[
  {id:'screen.trials',label:'終了画面確認回数',role:'trial'},
  {id:'screen.categoryCounts.1',label:'赤城',role:'categoryCount'},
  {id:'screen.categoryCounts.2',label:'加賀＆赤城',role:'categoryCount'},
  {id:'screen.categoryCounts.3',label:'パーティ',role:'categoryCount'}
 ]};
 const ev:any={id:'EVI_exact',sourceFindingId:'exact',title:'終了画面の設定確定パターン',evidenceItems:[{findingId:'exact',label:'終了画面の設定確定パターン',semanticType:'EXACT_CONSTRAINT',semanticCategories:[
  {label:'加賀＆赤城',meaning:'設定4以上',semanticType:'EXACT_CONSTRAINT',linkedFindingId:'screen'}
 ]}]};
 const p:any={...base,settings:{status:'SOURCE_DERIVED',values:['SET_1','SET_2','SET_3','SET_4','SET_5','SET_6']},activeFeatures:[{findingId:'screen',name:'終了画面',model:'CATEGORICAL',trialUniverse:'END_SCREEN_TRIAL',categoryModel:{residualPolicy:'SOURCE_EXHAUSTIVE'},settingDistribution:{'1':'赤城 50% / 加賀＆赤城 0% / パーティ 50%','6':'赤城 30% / 加賀＆赤城 20% / パーティ 50%'},runtimePolicyBinding:{metric:'PER_ELIGIBLE_TRIAL_POWER',value:1},score:{status:'NOT_COMPUTED'}}],runtimeUi:{...base.runtimeUi,numericSections:[numeric],evidenceSections:[ev]},evidence:[ev]};
 const d=buildAppRuntime(p,ref);
 const constraint=d.package.evidence.evidences.find((x:any)=>(x.sourceEvidenceRefs??[]).includes('exact'));
 assert.equal(constraint.inputId,'screen.categoryCounts.2');
 assert.equal(d.package.inputs.inputs.some((x:any)=>x.id==='REF_exact_1'),false);
 assert.doesNotThrow(()=>validateAppRuntimeDocument(d,p,ref));
});
