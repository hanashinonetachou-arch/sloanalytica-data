import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,o)=>fs.writeFileSync(p,JSON.stringify(o,null,2)+'\n');

// Kyokou: make the new selected summary item deterministic for MachineData generation.
{
  const p='research/L_KYOKOU_SUIRI_ST/selection-data.json';
  const s=read(p);
  const item=s.selectionSummaryContract?.selected?.find(x=>x.name==='あやかしぼーなす中キャラ紹介');
  if(item) item.featureId='FEAT_AYAKASHI_CHARACTER';
  write(p,s);
}

// Umineko 2: remove repeated context from labels and explain the actual observation in plain language.
{
  const p='research/L_UMINEKO_2_A1/ui-design-data.json';
  const ui=read(p);
  const rename=(oldName,newName)=>{
    if(!ui.sections?.[oldName]||oldName===newName) return;
    ui.sections[newName]=ui.sections[oldName]; delete ui.sections[oldName];
    ui.sectionOrder=ui.sectionOrder.map(x=>x===oldName?newName:x);
  };
  const label=(id,name)=>{ if(ui.inputContracts?.[id]) ui.inputContracts[id].name=name; };

  rename('ボーナス初当りの発生回数','通常時');
  ui.sections['通常時'].description='通常ゲーム数と、ボーナス・REG・確定役Aの成立回数を記録します。';
  label('INP_BONUS_INITIAL_COUNT','ボーナス');
  label('INP_REG_INITIAL_COUNT','REG');
  label('INP_CONFIRM_A_COUNT','確定役A');

  ui.sections['REG中'].description='REG中の有効ゲーム数と、そのうち斜め青7が揃った回数を記録します。';
  label('INP_REG_DIAG_BLUE7_COUNT','斜め青7揃い');
  label('INP_REG_DIAG_BLUE7_TRIALS','有効ゲーム');

  rename('ART','ART中ハズレ');
  ui.sections['ART中ハズレ'].description='ART中のゲーム数と、ハズレが成立した回数を記録します。';
  label('INP_ART_MISS_COUNT','ハズレ');
  label('INP_ART_MISS_TRIALS','ARTゲーム');

  rename('同色BIG後 Lv2ナビ発生','同色BIG後のLv2ナビ');
  ui.sections['同色BIG後のLv2ナビ'].description='同色BIG後CZで、成功対象となる突入リプレイが成立した回数を母数にし、そのうちLv2（中→左）ナビが出た回数を記録します。';
  label('INP_LV2_NAV_SAME_BIG_COUNT','Lv2ナビ');
  label('INP_LV2_NAV_SAME_BIG_TRIALS','対象リプレイ');

  rename('異色BIG後 Lv2ナビ発生','異色BIG後のLv2ナビ');
  ui.sections['異色BIG後のLv2ナビ'].description='異色BIG後CZで、成功対象となる突入リプレイが成立した回数を母数にし、そのうちLv2（中→左）ナビが出た回数を記録します。';
  label('INP_LV2_NAV_MIXED_BIG_COUNT','Lv2ナビ');
  label('INP_LV2_NAV_MIXED_BIG_TRIALS','対象リプレイ');

  rename('REG後/ART後/周期経由 Lv2ナビ発生','REG後・ART後・周期CZのLv2ナビ');
  ui.sections['REG後・ART後・周期CZのLv2ナビ'].description='REG後・ART後・周期経由CZで、成功対象となる突入リプレイが成立した回数を母数にし、そのうちLv2（中→左）ナビが出た回数を記録します。';
  label('INP_LV2_NAV_OTHER_COUNT','Lv2ナビ');
  label('INP_LV2_NAV_OTHER_TRIALS','対象リプレイ');

  rename('ロゴ発光（','ステージチェンジ時のロゴ発光');
  ui.sections['ステージチェンジ時のロゴ発光'].description='ステージチェンジ時にロゴが発光した場合だけ、小発光・大発光のどちらだったかを1回ずつ記録します。発光なしは数えません。';
  label('INP_LOGO_SMALL','小発光'); label('INP_LOGO_LARGE','大発光');

  rename('周期天井 真実ポイント','周期天井の真実ポイント');
  ui.sections['周期天井の真実ポイント'].description='周期天井へ到達したときに獲得した真実ポイントを、30pt・50pt・70pt・200ptのいずれかで記録します。';

  rename('運命分岐モード転落後 / 引き継ぎ100G選択','運命分岐モード転落後の100G引き継ぎ');
  ui.sections['運命分岐モード転落後の100G引き継ぎ'].description='ARTへ入らず運命分岐モードから転落したとき、引き継ぎランプ点灯を確認できた回数を母数にし、100G引き継ぎが選ばれた回数を記録します。';
  label('INP_INHERIT_100G_COUNT','100G引き継ぎ'); label('INP_INHERIT_TRIALS','対象転落');

  rename('ART中共通ベル回数','ART中の共通ベル');
  ui.sections['ART中の共通ベル'].description='ART中に成立した共通ベルを記録します。分母にはARTゲーム数を使用します。';
  label('INP_ART_COMMON_BELL_COUNT','共通ベル');

  rename('特定11種ボーナス回数','特定11種ボーナス');
  ui.sections['特定11種ボーナス'].description='対象となる11種類のボーナスが成立した回数を記録します。';
  label('INP_SPECIFIC_BONUS_COUNT','対象ボーナス');

  if(ui.sections['設定示唆・確定情報']) ui.sections['設定示唆・確定情報'].description='実戦中に確認した設定確定・否定演出を入力します。通常の確率推測とは分離して扱います。';
  write(p,ui);
}

console.log('Applied feedback v2 follow-up fixes');