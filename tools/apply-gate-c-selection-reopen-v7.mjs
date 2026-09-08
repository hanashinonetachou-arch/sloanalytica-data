import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const BATCH='20260908-manifest-v7-first10';
const p=path.join(ROOT,'batches',BATCH,'gate-b-feature-disposition-draft.json');
const x=JSON.parse(fs.readFileSync(p,'utf8'));
const byId=new Map(x.machines.map(m=>[m.machineId,m]));
const exclude={
  'L_BIOHAZARD_RE3_ZD':{
    RF_WEAK_RARE_CZ_BY_STATE:'公開値の分母は通常A・通常B・高確・超高確という内部状態別だが、通常遊技中のステージは状態を示唆するだけで通常A/B/高確を一意に識別できない。正確な試行母集団を観測できないため数値推測に使用しない。',
    RF_STRONG_RARE_AT_DIRECT_BY_STATE:'公開値の分母は通常A・通常B・高確・超高確という内部状態別だが、通常遊技中のステージは状態を示唆するだけで通常A/B/高確を一意に識別できない。正確な試行母集団を観測できないため数値推測に使用しない。'
  },
  'L_SUPER_RIO_ACE2_ND02H':{
    RF_ACE_MODE:'エースモードは内部状態で、公開解析も見た目での判別は難しいと明記している。示唆からの推測では公開30.1%～43.8%の選択率と同じ母集団を正確にカウントできないため数値推測に使用しない。'
  },
  'L_LOTIS_TN':{
    RF_MODE_BONUS_MORNING:'朝一モードは設定変更後に移行する可能性がある内部モードで、滞在中の各ゲームを一意に識別できないため、モード別ボーナス率の正確な分母を観測できず数値推測に使用しない。',
    RF_MODE_BONUS_CHANCE:'チャンスモードは移行可能性・天井・次回移行先から推測できても、滞在中に一意確定できないためモード別ボーナス率の正確な分母を観測できず数値推測に使用しない。',
    RF_MODE_BONUS_NORMAL:'通常モードは通常A/B等の内部モードを含み、滞在中に一意確定できないためモード別ボーナス率の正確な分母を観測できず数値推測に使用しない。',
    RF_MODE_BONUS_RETURN_A:'引き戻しAは規定ゲーム数や移行率から期待できる内部モードだが、滞在中の各ゲームで一意確定できないためモード別ボーナス率の正確な分母を観測できず数値推測に使用しない。',
    RF_MODE_BONUS_RETURN_B:'引き戻しBは規定ゲーム数や移行率から期待できる内部モードだが、滞在中の各ゲームで一意確定できないためモード別ボーナス率の正確な分母を観測できず数値推測に使用しない。'
  }
};
let changed=0;
for(const [machineId,features] of Object.entries(exclude)){
  const m=byId.get(machineId); if(!m) throw new Error(`missing machine ${machineId}`);
  for(const [rf,reason] of Object.entries(features)){
    if(m.decisions[rf]!=='EXCLUDE'){m.decisions[rf]='EXCLUDE';changed++;}
    x.excludeReasons[`${machineId}/${rf}`]=reason;
  }
}
// Heartbeat-down remains included: its visible blue/green/red/purple state and 6G guarantee/reset rules are publicly observable.
x.dependencyNotes.L_BIOHAZARD_RE3_ZD='AT初当りと状態別CZ合算は因果系列としてCZ群をFallback化。内部状態別レア役CZ/直撃は正確な内部状態分母を観測できないためObservationからSelectionを再オープンしてEXCLUDE。心音レベル転落は色表示と保証/再セット条件を直接追跡できるためSupport維持。';
x.dependencyNotes.L_SUPER_RIO_ACE2_ND02H='初当りとノワールルームは因果系列を含むためノワールルームをFallback。希少なボーナス直撃はSupport維持。内部Ace Modeは見た目で一意判別できず公開選択率と同じ分母を観測できないためObservationからSelectionを再オープンしてEXCLUDE。';
x.dependencyNotes.L_LOTIS_TN='BIG/REGと擬似チェリー前兆・書き換えは観測可能な条件付きFeatureとして維持。モード別ボーナス率5種は内部モード滞在を各ゲームで一意判別できず正確な分母を観測できないためObservationからSelectionを再オープンしてEXCLUDE。';
const counts={INCLUDE_PRIMARY:0,INCLUDE_SUPPORT:0,INCLUDE_FALLBACK:0,EXCLUDE:0};
for(const m of x.machines) for(const d of Object.values(m.decisions)) counts[d]=(counts[d]??0)+1;
x.summary=counts;
x.selectionReopen={trigger:'RSO-OBS-005',checkedAt:'2026-09-08T20:55:00+09:00',reason:'Gate C Observation feasibility audit disproved exact observation assumptions for internal-state-conditioned features.',changedFeatures:changed,keptAfterObservationReview:['L_BIOHAZARD_RE3_ZD/RF_HEARTBEAT_DOWN']};
fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');
const audit={
 schemaVersion:'gate-c-selection-reopen-audit-v1',batchId:BATCH,checkedAt:'2026-09-08T20:55:00+09:00',ruleId:'RSO-OBS-005',result:'SELECTION_REOPEN_REQUIRED',
 initialDraft:{exactMappings:50,unresolvedMappings:9,researchReopenRequests:9,linkedServiceDebt:2},
 decisions:[
  {machineId:'L_BIOHAZARD_RE3_ZD',excluded:['RF_WEAK_RARE_CZ_BY_STATE','RF_STRONG_RARE_AT_DIRECT_BY_STATE'],retained:['RF_HEARTBEAT_DOWN'],basis:'内部状態A/B/高確はステージ示唆だけでは一意判別不可。心音レベルは青/緑/赤/紫で表示され、6G保証と再セット条件も公開されるため直接観測可能。'},
  {machineId:'L_SUPER_RIO_ACE2_ND02H',excluded:['RF_ACE_MODE'],basis:'公開解析が見た目上での判別は難しいと明記し、示唆は滞在期待度に留まる。'},
  {machineId:'L_LOTIS_TN',excluded:['RF_MODE_BONUS_MORNING','RF_MODE_BONUS_CHANCE','RF_MODE_BONUS_NORMAL','RF_MODE_BONUS_RETURN_A','RF_MODE_BONUS_RETURN_B'],basis:'モードは天井・遷移傾向から推測できても滞在中に一意確定できず、モード別ボーナス率の各ゲーム分母を再現できない。'}
 ],
 linkedServiceReassessment:{
  ruleId:'RSO-OBS-004',
  conclusion:'Complete machine-specific field list is not required by the rule; existence plus concrete obtainable items is sufficient.',
  birdieWing:{service:'ユニメモ',status:'FOUND',officialConcreteItems:['総プレイ数','ボーナス回数'],officialCapabilities:['途中記録を見る','遊技結果'],notes:'BIRDIE WING is explicitly listed as supported. Complete per-machine field enumeration remains unknown but is not a Gate C requirement.'},
  sao2:{service:'ダイトモ',status:'FOUND',officialConcreteItems:['総プレイ数','ボーナス回数'],notes:'SAO II is explicitly listed as supported. Secondary public tool additionally identifies ダイトモ「通常プレイ数」 as a usable denominator; exact per-feature equality is treated separately.'}
 },
 next:'Regenerate SelectionData, re-close Gate B after Selection revision, regenerate Gate C ObservationData and rerun all Observation audits.'
};
fs.writeFileSync(path.join(ROOT,'batches',BATCH,'gate-c-selection-reopen-audit.json'),JSON.stringify(audit,null,2)+'\n');
console.log('OBSERVATION SELECTION REOPEN APPLIED',JSON.stringify({changed,summary:counts}));
