import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const write = (p,v) => fs.writeFileSync(path.join(ROOT,p), JSON.stringify(v,null,2)+'\n');
const rmKeys=(obj,keys)=>{ for(const k of keys) delete obj[k]; };
const uniq=(a)=>[...new Set(a)];

function excludeFeatures(machineId, specs) {
  const p=`research/${machineId}/selection-data.json`;
  const s=read(p);
  const removeInputs=[];
  for (const spec of specs) {
    const f=s.features.find(x=>x.featureId===spec.featureId);
    if(!f) throw new Error(`${machineId}: missing ${spec.featureId}`);
    f.adoptionCategory='EXCLUDE';
    f.userReason=spec.reason;
    f.userFacingReason=spec.reason;
    rmKeys(f,['numeratorInputId','numeratorInputIds','denominatorInputId','denominatorInputIds','categoryInputIds','inputTransform','sampleRecommendation','minimumSample']);
    removeInputs.push(...spec.inputIds);
  }
  s.inputs=s.inputs.filter(x=>!removeInputs.includes(x.id));
  const ids=new Set(specs.map(x=>x.featureId));
  const sum=s.selectionSummaryContract;
  if(sum){
    sum.selected=(sum.selected||[]).filter(x=>!ids.has(x.featureId));
    sum.rejected=(sum.rejected||[]).filter(x=>!ids.has(x.featureId));
    for(const spec of specs) sum.rejected.push({name:spec.name,reason:spec.reason,featureId:spec.featureId});
    sum.selectedCount=sum.selected.length;
    sum.rejectedCount=sum.rejected.length;
    sum.evaluatedCount=sum.selectedCount+sum.rejectedCount;
  }
  write(p,s);
}

function removeObservationFeatures(machineId, featureIds, observationIds) {
  const p=`research/${machineId}/machine-observation-data.json`;
  const o=read(p);
  const fsids=new Set(featureIds), osids=new Set(observationIds);
  o.featureMappings=(o.featureMappings||[]).filter(x=>!fsids.has(x.featureId));
  o.observations=(o.observations||[]).filter(x=>!osids.has(x.observationId));
  if(Array.isArray(o.unresolvedFeatureIds)) o.unresolvedFeatureIds=o.unresolvedFeatureIds.filter(x=>!fsids.has(x));
  write(p,o);
}

function removeUi(machineId, sectionNames, inputIds) {
  const p=`research/${machineId}/ui-design-data.json`;
  const u=read(p);
  const ss=new Set(sectionNames), ii=new Set(inputIds);
  u.sectionOrder=(u.sectionOrder||[]).filter(x=>!ss.has(x));
  for(const s of sectionNames) delete u.sections[s];
  for(const id of inputIds) delete u.inputContracts[id];
  for(const sec of Object.values(u.sections||{})) sec.inputIds=(sec.inputIds||[]).filter(id=>!ii.has(id));
  write(p,u);
}

// SAO II: internal normal/high state is only indicated by stages; public sources do not provide a 100%-deterministic state marker.
const saoReason='通常・高確の内部状態は酒場/公園ステージ等で示唆されますが、実戦中に全ゲームを100%判別できる公開手段を確認できません。状態別の正確な分母を作れないため、設定差自体はあっても数値推測には使用しません。';
excludeFeatures('L_SAO2_PA1',[
 {featureId:'FEAT_WATERMELON_SC_NORMAL',name:'低確滞在時スイカ→シューティングチャージ',reason:saoReason,inputIds:['INP_NUM_WATERMELON_SC_NORMAL','INP_DEN_WATERMELON_SC_NORMAL']},
 {featureId:'FEAT_STRONG_CHERRY_CZ_NORMAL',name:'低確滞在時 強チェリー→CZ',reason:saoReason,inputIds:['INP_NUM_STRONG_CHERRY_CZ_NORMAL','INP_DEN_STRONG_CHERRY_CZ_NORMAL']},
 {featureId:'FEAT_STRONG_CHERRY_CZ_HIGH',name:'高確滞在時 強チェリー→CZ',reason:saoReason,inputIds:['INP_NUM_STRONG_CHERRY_CZ_HIGH','INP_DEN_STRONG_CHERRY_CZ_HIGH']}
]);
removeObservationFeatures('L_SAO2_PA1',['FEAT_WATERMELON_SC_NORMAL','FEAT_STRONG_CHERRY_CZ_NORMAL','FEAT_STRONG_CHERRY_CZ_HIGH'],['OBS_003_WATERMELON_SC_NORMAL','OBS_004_STRONG_CHERRY_CZ_NORMAL','OBS_005_STRONG_CHERRY_CZ_HIGH']);
removeUi('L_SAO2_PA1',['低確滞在時スイカ→シューティングチャージ','低確滞在時 強チェリー→CZ','高確滞在時 強チェリー→CZ'],['INP_NUM_WATERMELON_SC_NORMAL','INP_DEN_WATERMELON_SC_NORMAL','INP_NUM_STRONG_CHERRY_CZ_NORMAL','INP_DEN_STRONG_CHERRY_CZ_NORMAL','INP_NUM_STRONG_CHERRY_CZ_HIGH','INP_DEN_STRONG_CHERRY_CZ_HIGH']);
{
 const p='research/L_SAO2_PA1/ui-design-data.json',u=read(p);
 u.inputContracts.INP_DEN_CZ_FAIL_ITEM.gridSpan=6; u.inputContracts.INP_NUM_CZ_FAIL_ITEM.gridSpan=6;
 u.inputContracts.INP_DEN_STRONG_CHANCE_CONFIRMED_CZ.gridSpan=6; u.inputContracts.INP_NUM_STRONG_CHANCE_CONFIRMED_CZ.gridSpan=6;
 u.sections['強チャンス目→確定CZ'].description='強チャンス目A/Bが成立するたびに1回数え、確定CZに当選した回数を入力してください。※確定CZ：THE END状態から始まるCZ';
 write(p,u);
}

// Sengoku Otome 5: 3 matching straps are published as "濃厚", not a guaranteed all-times marker. Exact exclusion of Kansuke periods is therefore impossible.
const otomeReason='乙女ストラップ3個でカンスケモード滞在濃厚という示唆はありますが、実戦中の全期間を100%識別できる公開手段は確認できません。カンスケ滞在時は0pt到達時の抽選率が別になるため、混在を完全に除外できず数値推測には使用しません。';
excludeFeatures('L_SENGOKU_OTOME5_L8',[{featureId:'FEAT_OTOME_ATTACK_ZERO_PT',name:'巫女ポイント0pt到達時 乙女アタック当選',reason:otomeReason,inputIds:['INP_NUM_OTOME_ATTACK_ZERO_PT','INP_DEN_OTOME_ATTACK_ZERO_PT']}]);
removeObservationFeatures('L_SENGOKU_OTOME5_L8',['FEAT_OTOME_ATTACK_ZERO_PT'],['OBS_002_OTOME_ATTACK_ZERO_PT']);
removeUi('L_SENGOKU_OTOME5_L8',['巫女ポイント0pt到達時 乙女アタック当選'],['INP_NUM_OTOME_ATTACK_ZERO_PT','INP_DEN_OTOME_ATTACK_ZERO_PT']);

// Lotis: true/fake initial prelude and later rewrite cannot be uniquely separated from the final bonus outcome during ordinary play.
const lotisReason='フェイク前兆中のレア小役で本前兆へ書き換える抽選は公開されていますが、最終的にボーナスへ当選した事実だけでは「最初から本前兆だったのか」「フェイク前兆から書き換わったのか」を100%識別できる公開手段を確認できません。正確な分子を観測できないため数値推測には使用しません。';
const lotisInitialReason='本前兆・フェイク前兆の移行率には設定差がありますが、フェイク前兆中に本前兆への書き換えが起こり得て、その書き換えを100%識別できる公開手段を確認できません。初期の本前兆/フェイクを実戦結果から一意に分類できないため数値推測には使用しません。';
excludeFeatures('L_LOTIS_TN',[
 {featureId:'FEAT_PSEUDO_CHERRY_TRUE_PRELUDE',name:'擬似チェリー→本前兆移行',reason:lotisInitialReason,inputIds:['INP_NUM_PSEUDO_CHERRY_TRUE_PRELUDE']},
 {featureId:'FEAT_PSEUDO_CHERRY_FAKE_PRELUDE',name:'擬似チェリー→フェイク前兆移行',reason:lotisInitialReason,inputIds:['INP_NUM_PSEUDO_CHERRY_FAKE_PRELUDE','INP_DEN_PSEUDO_CHERRY_TRUE_PRELUDE']},
 {featureId:'FEAT_FAKE_TO_TRUE_REWRITE',name:'フェイク前兆中 本前兆書き換え',reason:lotisReason,inputIds:['INP_NUM_FAKE_TO_TRUE_REWRITE','INP_DEN_FAKE_TO_TRUE_REWRITE']}
]);
removeObservationFeatures('L_LOTIS_TN',['FEAT_PSEUDO_CHERRY_TRUE_PRELUDE','FEAT_PSEUDO_CHERRY_FAKE_PRELUDE','FEAT_FAKE_TO_TRUE_REWRITE'],['OBS_003_PSEUDO_CHERRY_TRUE_PRELUDE','OBS_004_PSEUDO_CHERRY_FAKE_PRELUDE','OBS_005_FAKE_TO_TRUE_REWRITE']);
removeUi('L_LOTIS_TN',['非前兆中または前兆1G目の対象擬似チェリー成立','フェイク前兆中 本前兆書き換え'],['INP_NUM_PSEUDO_CHERRY_TRUE_PRELUDE','INP_NUM_PSEUDO_CHERRY_FAKE_PRELUDE','INP_DEN_PSEUDO_CHERRY_TRUE_PRELUDE','INP_NUM_FAKE_TO_TRUE_REWRITE','INP_DEN_FAKE_TO_TRUE_REWRITE']);

// Big Dream: numerical and evidence outcomes occur at the same GC end timing; put them in one two-column section.
{
 const p='research/L_BIG_DREAM_GOLDEN_PUSHER_KR/ui-design-data.json',u=read(p);
 const sec=u.sections['ゴールデンチャレンジ終了画面'];
 sec.evidenceIds=['EVC_GC_TREASURE_4PLUS','EVC_GC_STANDING_2PLUS','EVC_GC_LOOKBACK_4PLUS','EVC_GC_THRONE_5PLUS','EVC_GC_AWAKENED_6'];
 sec.description='通常AT後のゴールデンチャレンジ終了時に表示された画面を1つだけ加算してください。帽子・銃&玉・剣は設定推測の数値要素として扱い、それ以外の設定下限確定画面はEvidenceとして扱います。連動サービスで回数を確認できる場合もあります。';
 for(const id of ['INP_GC_END_HAT','INP_GC_END_GUN','INP_GC_END_SWORD']) u.inputContracts[id].gridSpan=6;
 const defs={
  EVC_GC_TREASURE_4PLUS:['金銀財宝の山','EVI_GC_TREASURE_4PLUS'],
  EVC_GC_STANDING_2PLUS:['ギルガメッシュ立ち絵','EVI_GC_STANDING_2PLUS'],
  EVC_GC_LOOKBACK_4PLUS:['ギルガメッシュ見返り','EVI_GC_LOOKBACK_4PLUS'],
  EVC_GC_THRONE_5PLUS:['ギルガメッシュ玉座','EVI_GC_THRONE_5PLUS'],
  EVC_GC_AWAKENED_6:['覚醒ギルガメッシュ','EVI_GC_AWAKENED_6']
 };
 for(const [id,[label,group]] of Object.entries(defs)) u.evidenceContracts[id]={label,selectionMode:'multi',sourceEvidenceGroupId:group,inheritOptions:true,gridSpan:6};
 write(p,u);
}

// Rio: "縦2列" = two-column grid, one field in each column.
{
 const p='research/L_SUPER_RIO_ACE2_ND02H/ui-design-data.json',u=read(p);
 for(const id of ['INP_DEN_HOWARD_THRESHOLD','INP_NUM_HOWARD_THRESHOLD','INP_DEN_RINA_SIGN','INP_NUM_RINA_SIGN']) u.inputContracts[id].gridSpan=6;
 write(p,u);
 const sp='research/L_SUPER_RIO_ACE2_ND02H/selection-data.json',s=read(sp);
 for(const id of ['INP_DEN_HOWARD_THRESHOLD','INP_NUM_HOWARD_THRESHOLD','INP_DEN_RINA_SIGN','INP_NUM_RINA_SIGN']) { const x=s.inputs.find(v=>v.id===id); if(x) x.uiGridSpan=6; }
 write(sp,s);
}

// Dark Haibi: no fake-prelude rewrite feature exists in canonical research; do not invent one. Unify BB/RB denominator and requested wording.
{
 const sp='research/L_DARK_HAIBI_SB/selection-data.json',s=read(sp);
 const denBB=s.inputs.find(x=>x.id==='INP_DEN_BB'), denRB=s.inputs.find(x=>x.id==='INP_DEN_RB');
 if(!denBB||!denRB) throw new Error('Dark Haibi denominators missing');
 denBB.name='ボーナスゲーム数'; denBB.category='SHARED_DENOMINATOR'; denBB.sharedByFeatureIds=['FEAT_BB','FEAT_RB'];
 const fRB=s.features.find(x=>x.featureId==='FEAT_RB'); fRB.denominatorInputId='INP_DEN_BB';
 s.inputs=s.inputs.filter(x=>x.id!=='INP_DEN_RB');
 const first=s.inputs.find(x=>x.id==='INP_NUM_NON_CHAIN_INITIAL'); if(first) first.name='ボーナス初当り回数';
 write(sp,s);
 const up='research/L_DARK_HAIBI_SB/ui-design-data.json',u=read(up);
 u.sectionOrder=u.sectionOrder.filter(x=>x!=='BB'&&x!=='RB');
 delete u.sections.BB; delete u.sections.RB;
 u.sectionOrder.splice(1,0,'BB・RB');
 u.sections['BB・RB']={inputIds:['INP_DEN_BB','INP_NUM_BB','INP_NUM_RB'],description:'BBとRBは同じゲーム数を使います。「ボーナスゲーム数」を1回だけ入力し、その間のBB・RB当選回数を入力してください。',collapsible:false,defaultExpanded:true,observationRole:'DIRECT_PLAY',suppressInputDescriptions:true};
 u.sections['通常時'].description='ボーナス後32G経過後からボーナス当選までの通常ゲーム数と、ボーナス初当り回数を入力してください。';
 u.inputContracts.INP_DEN_NON_CHAIN_INITIAL.name='通常ゲーム数';
 u.inputContracts.INP_NUM_NON_CHAIN_INITIAL.name='ボーナス初当り回数';
 u.inputContracts.INP_DEN_BB.name='ボーナスゲーム数';
 delete u.inputContracts.INP_DEN_RB;
 write(up,u);
 const op='research/L_DARK_HAIBI_SB/machine-observation-data.json',o=read(op);
 for(const m of o.featureMappings||[]) if(m.featureId==='FEAT_RB') m.sharedDenominatorInputId='INP_DEN_BB';
 write(op,o);
}

console.log('Applied 20260910 first10 device feedback round2');
