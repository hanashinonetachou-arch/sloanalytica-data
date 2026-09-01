import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const researchPath = id => path.join(ROOT, 'research', id, 'research-data.json');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, v) => fs.writeFileSync(p, `${JSON.stringify(v, null, 2)}\n`);
const settings6 = ['SET_1','SET_2','SET_3','SET_4','SET_5','SET_6'];
const ev = (id,name,allowed,sourceRefs,notes='') => ({researchEvidenceId:id,name,factStatus:'verified',allowedSettings:allowed,deniedSettings:settings6.filter(x=>!allowed.includes(x)),sourceRefs,...(notes?{notes}:{})});
function upsert(arr, key, item){ const i=arr.findIndex(x=>x[key]===item[key]); if(i>=0) arr[i]=item; else arr.push(item); }
function source(data,item){ upsert(data.sources,'sourceId',item); }
function feature(data,item){ upsert(data.features,'researchFeatureId',item); }
function evidence(data,item){ upsert(data.evidenceCandidates,'researchEvidenceId',item); }
function discovery(data,item){ data.discoveryInventory ??=[]; upsert(data.discoveryInventory,'discoveryCandidateId',item); }
function save(id,data){ write(researchPath(id),data); console.log(`${id}: F=${data.features.length} E=${data.evidenceCandidates.length} D=${data.discoveryInventory.length}`); }

// Magia Record
{
 const id='L_MAGIA_RECORD_RN', d=read(researchPath(id));
 source(d,{sourceId:'SRC_NANA_BIG',publisher:'なな徹',title:'マギアレコード ビッグボーナス',url:'https://nana-press.com/kaiseki/machine/914/28442/',checkedAt:'2026-09-01',sourceType:'major_analysis'});
 source(d,{sourceId:'SRC_NANA_EP',publisher:'なな徹',title:'マギアレコード エピソードボーナス',url:'https://nana-press.com/kaiseki/machine/914/28444/',checkedAt:'2026-09-01',sourceType:'major_analysis'});
 source(d,{sourceId:'SRC_NANA_ENDING',publisher:'なな徹',title:'マギアレコード エンディングの設定示唆',url:'https://nana-press.com/kaiseki/machine/914/28455/',checkedAt:'2026-09-01',sourceType:'major_analysis'});
 source(d,{sourceId:'SRC_NANA_STORY',publisher:'なな徹',title:'マギアレコード キャラ紹介シナリオ',url:'https://nana-press.com/kaiseki/machine/914/29052/',checkedAt:'2026-09-01',sourceType:'major_analysis'});
 source(d,{sourceId:'SRC_NANA_AT_END',publisher:'なな徹',title:'マギアレコード AT終了画面',url:'https://nana-press.com/kaiseki/machine/914/28562/',checkedAt:'2026-09-01',sourceType:'major_analysis'});
 const mode=(a,b,c,e,f,g)=>({IROHA:a,YACHIYO:b,TSURUNO:c,SANA:e,FELICIA:f,KUROE:g});
 feature(d,{researchFeatureId:'RF_MODE_BONUS_END',name:'ボーナス終了時 魔法少女モード振り分け',factStatus:'verified',candidateModel:'multinomial',trialUnit:'ボーナス終了時いろはモード1回',numeratorDefinition:'終了後に選択された魔法少女モード各カテゴリ回数',denominatorDefinition:'ボーナス終了時にいろはモードから昇格抽選が行われた回数',categories:['IROHA','YACHIYO','TSURUNO','SANA','FELICIA','KUROE'],distributionMode:'complete',settingValues:{},settingDistributions:{SET_1:mode(.777,.047,.039,.047,.039,.051),SET_2:mode(.777,.047,.039,.047,.039,.051),SET_3:mode(.742,.047,.055,.047,.055,.055),SET_4:mode(.703,.063,.055,.063,.055,.063),SET_5:mode(.664,.063,.070,.063,.070,.070),SET_6:mode(.641,.070,.070,.070,.070,.078)},sourceRefs:['SRC_NANA_BIG'],crossSourceStatus:'single_source',notes:'ボーナス終了時かついろはモードの条件付き分布。AT終了/有利区間移行時のRF_MODE_AT_ENDとは別試行。公開丸め値を保持。'});
 feature(d,{researchFeatureId:'RF_EPISODE_BONUS_TYPE',name:'エピソードボーナス選択率',factStatus:'verified',candidateModel:'multinomial',trialUnit:'通常条件のエピソードボーナス当選1回',numeratorDefinition:'やちよ/鶴乃/さな/フェリシア/黒江各エピソード選択回数',denominatorDefinition:'黒江チャレンジ経由を除く通常条件のエピソードボーナス当選回数',categories:['YACHIYO','TSURUNO','SANA','FELICIA','KUROE'],distributionMode:'complete',settingValues:{},settingDistributions:{SET_1:{YACHIYO:.281,TSURUNO:.281,SANA:.219,FELICIA:.219,KUROE:.001},SET_2:{YACHIYO:.327,TSURUNO:.234,SANA:.219,FELICIA:.219,KUROE:.001},SET_3:{YACHIYO:.234,TSURUNO:.313,SANA:.219,FELICIA:.219,KUROE:.016},SET_4:{YACHIYO:.281,TSURUNO:.156,SANA:.313,FELICIA:.234,KUROE:.016},SET_5:{YACHIYO:.172,TSURUNO:.219,SANA:.234,FELICIA:.313,KUROE:.063},SET_6:{YACHIYO:.234,TSURUNO:.141,SANA:.313,FELICIA:.250,KUROE:.063}},sourceRefs:['SRC_NANA_EP'],crossSourceStatus:'single_source',notes:'黒江チャレンジ経由は必ず黒江のため除外。公開丸め値をResearch原値として保持。'});
 evidence(d,ev('RE_BIG_END_2PLUS','BIG終了 水着みかづき荘',settings6.slice(1),['SRC_NANA_AT_END']));
 evidence(d,ev('RE_BIG_END_4PLUS','BIG終了 2nd Seasonキービジュアル',settings6.slice(3),['SRC_NANA_AT_END']));
 evidence(d,ev('RE_BIG_END_5PLUS','BIG終了 1st Seasonキービジュアル',settings6.slice(4),['SRC_NANA_AT_END']));
 evidence(d,ev('RE_BIG_END_6','BIG終了 小さいキュゥべえ',['SET_6'],['SRC_NANA_AT_END']));
 evidence(d,ev('RE_AT_END_6','AT終了 まどか＆いろは',['SET_6'],['SRC_NANA_AT_END']));
 evidence(d,ev('RE_STORY_5PLUS','ストーリーキャラ紹介 シナリオ⑨（小さいキュゥべえ）',settings6.slice(4),['SRC_NANA_STORY']));
 evidence(d,ev('RE_END_CARD_4PLUS','エンディングカード 舞台装置の魔女',settings6.slice(3),['SRC_NANA_ENDING']));
 for (const [eid,name,deny] of [['RE_END_CARD_DENY1','エンディングカード 委員長の魔女','SET_1'],['RE_END_CARD_DENY2','エンディングカード 石中魚の魔女','SET_2'],['RE_END_CARD_DENY3','エンディングカード 立ち耳の魔女','SET_3'],['RE_END_CARD_DENY4_PENDULUM','エンディングカード 振子の魔女','SET_4'],['RE_END_CARD_DENY4_NIGHTJAR','エンディングカード ヨダカの魔女','SET_4']]) evidence(d,ev(eid,name,settings6.filter(x=>x!==deny),['SRC_NANA_ENDING'], deny==='SET_1'||name.includes('ヨダカ')?'否定Evidenceに高設定示唆も併記されるがHard部分は設定否定のみ。':''));
 discovery(d,{discoveryCandidateId:'D_MODE_BONUS_END_EXACT',name:'ボーナス終了時魔法少女モード完全分布',researchTarget:'RF_MODE_BONUS_END'});
 discovery(d,{discoveryCandidateId:'D_EPISODE_BONUS_TYPE_EXACT',name:'エピソードボーナス選択完全分布',researchTarget:'RF_EPISODE_BONUS_TYPE'});
 for(const [did,target] of [['D_BIG_END_2PLUS','RE_BIG_END_2PLUS'],['D_BIG_END_4PLUS','RE_BIG_END_4PLUS'],['D_BIG_END_5PLUS','RE_BIG_END_5PLUS'],['D_BIG_END_6','RE_BIG_END_6'],['D_AT_END_6','RE_AT_END_6'],['D_STORY_5PLUS','RE_STORY_5PLUS'],['D_END_CARD_4PLUS','RE_END_CARD_4PLUS'],['D_END_CARD_DENY1','RE_END_CARD_DENY1'],['D_END_CARD_DENY2','RE_END_CARD_DENY2'],['D_END_CARD_DENY3','RE_END_CARD_DENY3'],['D_END_CARD_DENY4_PENDULUM','RE_END_CARD_DENY4_PENDULUM'],['D_END_CARD_DENY4_NIGHTJAR','RE_END_CARD_DENY4_NIGHTJAR']]) discovery(d,{discoveryCandidateId:did,name:did,researchTarget:target});
 save(id,d);
}

// Godzilla hard Evidence decomposition
{
 const id='L_GODZILLA_NS',d=read(researchPath(id));
 source(d,{sourceId:'SRC_NANA_SETTING',publisher:'なな徹',title:'スマスロ ゴジラ 設定判別',url:'https://nana-press.com/kaiseki/machine/919/28861/',checkedAt:'2026-09-01',sourceType:'major_analysis'});
 source(d,{sourceId:'SRC_NANA_TROPHY',publisher:'なな徹',title:'スマスロ ゴジラ ギンちゃんトロフィー',url:'https://nana-press.com/kaiseki/machine/919/28845/',checkedAt:'2026-09-01',sourceType:'major_analysis'});
 const add=(id2,name,allowed)=>evidence(d,ev(id2,name,allowed,['SRC_NANA_SETTING','SRC_NANA_TROPHY']));
 add('RE_MENU_2PLUS','メニュー 轟天号',settings6.slice(1)); add('RE_MENU_4PLUS','メニュー スーパーXⅢ',settings6.slice(3)); add('RE_MENU_6','メニュー 3式機龍',['SET_6']);
 add('RE_OPERATOR_2PLUS','オペレーター 設定2以上セリフ群',settings6.slice(1)); add('RE_OPERATOR_3PLUS','オペレーター 設定3以上セリフ群',settings6.slice(2)); add('RE_OPERATOR_4PLUS','オペレーター 設定4以上セリフ群',settings6.slice(3)); add('RE_OPERATOR_5PLUS','オペレーター 設定5以上セリフ群',settings6.slice(4)); add('RE_OPERATOR_6','オペレーター 設定6セリフ群',['SET_6']);
 add('RE_BONUS_END_4PLUS','ボーナス終了 キングギドラ',settings6.slice(3)); add('RE_BONUS_END_5PLUS','ボーナス終了 ゴジラ（赤）',settings6.slice(4)); add('RE_BONUS_END_6','ボーナス終了 ゴジラ（白黒）',['SET_6']); add('RE_EX_MOVIE_5PLUS','EXボーナス ムービー5',settings6.slice(4));
 add('RE_TROPHY_2PLUS','ギンちゃんトロフィー 銅',settings6.slice(1)); add('RE_TROPHY_3PLUS','ギンちゃんトロフィー 銀',settings6.slice(2)); add('RE_TROPHY_4PLUS','ギンちゃんトロフィー 金',settings6.slice(3)); add('RE_TROPHY_5PLUS','ギンちゃんトロフィー トラ柄',settings6.slice(4)); add('RE_TROPHY_6','ギンちゃんトロフィー 虹',['SET_6']);
 for(const e of d.evidenceCandidates.filter(x=>x.researchEvidenceId!=='RE_SETTING_CUES')) discovery(d,{discoveryCandidateId:`D_${e.researchEvidenceId}`,name:e.name,researchTarget:e.researchEvidenceId});
 save(id,d);
}

// Ushio trophy decomposition
{
 const id='L_USHIO_TORA_HAKUMEN_VH',d=read(researchPath(id));
 source(d,{sourceId:'SRC_NANA_TROPHY',publisher:'なな徹',title:'うしおととら ダイナマイトトロフィー',url:'https://nana-press.com/kaiseki/machine/918/28704/',checkedAt:'2026-09-01',sourceType:'major_analysis'});
 for(const [id2,name,allowed] of [['RE_TROPHY_2PLUS','ダイナマイトトロフィー 銅',settings6.slice(1)],['RE_TROPHY_3PLUS','ダイナマイトトロフィー 銀',settings6.slice(2)],['RE_TROPHY_4PLUS','ダイナマイトトロフィー 金',settings6.slice(3)],['RE_TROPHY_5PLUS','ダイナマイトトロフィー てんとう虫',settings6.slice(4)],['RE_TROPHY_6','ダイナマイトトロフィー 虹',['SET_6']]]) { evidence(d,ev(id2,name,allowed,['SRC_NANA_TROPHY'])); discovery(d,{discoveryCandidateId:`D_${id2}`,name,researchTarget:id2}); }
 save(id,d);
}

// Mahjong evidence decomposition
{
 const id='L_MAHJONG_MONOGATARI_S2',d=read(researchPath(id));
 source(d,{sourceId:'SRC_NANA_SETTING',publisher:'なな徹',title:'スマスロ 麻雀物語 設定判別',url:'https://nana-press.com/kaiseki/machine/931/29160/',checkedAt:'2026-09-01',sourceType:'major_analysis'});
 source(d,{sourceId:'SRC_NANA_ADD',publisher:'なな徹',title:'スマスロ 麻雀物語 上乗せゲーム数の設定示唆',url:'https://nana-press.com/kaiseki/machine/931/29186/',checkedAt:'2026-09-01',sourceType:'major_analysis'});
 for(const [id2,name,allowed] of [['RE_STAMP_2PLUS','終了画面 可スタンプ',settings6.slice(1)],['RE_ADD_44_4PLUS','AT上乗せ +44G',settings6.slice(3)],['RE_ADD_55_5PLUS','AT上乗せ +55G',settings6.slice(4)],['RE_ADD_66_6','AT上乗せ +66G',['SET_6']],['RE_HARURUNA_PUSH_4PLUS','Last Judge ハルルナPUSH',settings6.slice(3)],['RE_HIDDEN_NAGI_GOLD_6','隠しナギ 金', ['SET_6']]]) { evidence(d,ev(id2,name,allowed,['SRC_NANA_SETTING','SRC_NANA_ADD'])); discovery(d,{discoveryCandidateId:`D_${id2}`,name,researchTarget:id2}); }
 evidence(d,{researchEvidenceId:'RE_PAYOUT_REFERENCE_UNRESOLVED',name:'222/333/444/555/666枚突破',factStatus:'pending',allowedSettings:[],deniedSettings:[],sourceRefs:['SRC_NANA_SETTING'],notes:'なな徹は従来機種参考・!?として掲載。別ソースの濃厚表記と強度が一致しないためHard Evidence化せずConflict/追加確認対象。'});
 discovery(d,{discoveryCandidateId:'D_PAYOUT_REFERENCE_CONFLICT',name:'獲得枚数222/333/444/555/666',researchTarget:'RE_PAYOUT_REFERENCE_UNRESOLVED'});
 save(id,d);
}

// Idolmaster bonus-end Evidence
{
 const id='L_IDOLMASTER_MILLION_LIVE_HC',d=read(researchPath(id));
 source(d,{sourceId:'SRC_NANA_BONUS_END',publisher:'なな徹',title:'アイマス ボーナス終了画面による設定示唆',url:'https://nana-press.com/kaiseki/machine/921/29087/',checkedAt:'2026-09-01',sourceType:'major_analysis'});
 for(const [id2,name,allowed,notes] of [['RE_BONUS_END_RED_2PLUS','ボーナス終了 赤枠',settings6.slice(1),''],['RE_BONUS_END_PURPLE_2PLUS','ボーナス終了 紫枠',settings6.slice(1),'高設定示唆も併記されるがHard部分は設定2以上。'],['RE_BONUS_END_SILVER_3PLUS','ボーナス終了 銀枠',settings6.slice(2),''],['RE_BONUS_END_GOLD4_4PLUS','ボーナス終了 金枠（指が4）',settings6.slice(3),''],['RE_BONUS_END_GOLD5_5PLUS','ボーナス終了 金枠（ケーキ5）',settings6.slice(4),''],['RE_BONUS_END_RAINBOW_6','ボーナス終了 虹枠',['SET_6'],'']]) { evidence(d,ev(id2,name,allowed,['SRC_NANA_BONUS_END'],notes)); discovery(d,{discoveryCandidateId:`D_${id2}`,name,researchTarget:id2}); }
 save(id,d);
}

// Youjitsu distribution + hard Evidence
{
 const id='L_YOUJITSU_DE',d=read(researchPath(id));
 source(d,{sourceId:'SRC_NANA_SETTING',publisher:'なな徹',title:'よう実 設定判別',url:'https://nana-press.com/kaiseki/machine/935/29484/',checkedAt:'2026-09-01',sourceType:'major_analysis'});
 feature(d,{researchFeatureId:'RF_BONUS_END_SCREEN',name:'よう実BONUS終了画面振り分け',factStatus:'verified',candidateModel:'multinomial',trialUnit:'よう実BONUS終了1回',numeratorDefinition:'キャラ集合絵/櫛田桔梗の各出現回数',denominatorDefinition:'よう実BONUS終了画面を確認した回数',categories:['GROUP_PICTURE','KUSHIDA'],distributionMode:'complete',settingValues:{},settingDistributions:{SET_1:{GROUP_PICTURE:.950,KUSHIDA:.050},SET_2:{GROUP_PICTURE:.949,KUSHIDA:.051},SET_3:{GROUP_PICTURE:.945,KUSHIDA:.055},SET_4:{GROUP_PICTURE:.942,KUSHIDA:.058},SET_5:{GROUP_PICTURE:.935,KUSHIDA:.065},SET_6:{GROUP_PICTURE:.930,KUSHIDA:.070}},sourceRefs:['SRC_1GEKI'],crossSourceStatus:'cross_checked',notes:'櫛田は高設定示唆。公開全設定分布をnumeric Researchとして保持。'});
 const rows=[['RE_PAYOUT_EVEN','246枚OVER',['SET_2','SET_4','SET_6']],['RE_PAYOUT_4PLUS','456枚OVER',settings6.slice(3)],['RE_PAYOUT_6','666枚OVER',['SET_6']],['RE_AT_END_2PLUS','AT終了 堀北鈴音（特殊）',settings6.slice(1)],['RE_AT_END_4PLUS','AT終了 坂柳有栖（特殊）',settings6.slice(3)],['RE_AT_END_5PLUS','AT終了 龍園翔（特殊）',settings6.slice(4)],['RE_AT_END_6','AT終了 龍園翔VS綾小路清隆',['SET_6']],['RE_INTRO_DENY1','キャラ紹介 綾小路→堀北鈴音',settings6.filter(x=>x!=='SET_1')],['RE_INTRO_DENY2','キャラ紹介 綾小路→櫛田桔梗',settings6.filter(x=>x!=='SET_2')],['RE_INTRO_DENY3','キャラ紹介 綾小路→佐倉愛里',settings6.filter(x=>x!=='SET_3')],['RE_INTRO_DENY4','キャラ紹介 綾小路→軽井沢恵',settings6.filter(x=>x!=='SET_4')],['RE_INTRO_4PLUS','キャラ紹介 堀北鈴音→堀北学',settings6.slice(3)],['RE_INTRO_6','キャラ紹介 綾小路→龍園翔',['SET_6']]];
 for(const [id2,name,allowed] of rows){ evidence(d,ev(id2,name,allowed,['SRC_NANA_SETTING'])); discovery(d,{discoveryCandidateId:`D_${id2}`,name,researchTarget:id2}); }
 discovery(d,{discoveryCandidateId:'D_BONUS_END_SCREEN_DISTRIBUTION',name:'よう実BONUS終了画面全設定分布',researchTarget:'RF_BONUS_END_SCREEN'});
 save(id,d);
}

// Midoridon: missing bonus initial hit + hard evidence
{
 const id='L_MIDORIDON_VIVA_REVIVAL_FY',d=read(researchPath(id));
 source(d,{sourceId:'SRC_NANA_SETTING',publisher:'なな徹',title:'緑ドン VIVA REVIVAL 設定判別',url:'https://nana-press.com/kaiseki/machine/936/29335/',checkedAt:'2026-09-01',sourceType:'major_analysis'});
 source(d,{sourceId:'SRC_NANA_XR_VOICE',publisher:'なな徹',title:'緑ドン XRチャレンジ失敗後ボイス',url:'https://nana-press.com/kaiseki/machine/936/29357/',checkedAt:'2026-09-01',sourceType:'major_analysis'});
 source(d,{sourceId:'SRC_NANA_ENDING',publisher:'なな徹',title:'緑ドン エンディング中トリック',url:'https://nana-press.com/kaiseki/machine/936/29355/',checkedAt:'2026-09-01',sourceType:'major_analysis'});
 feature(d,{researchFeatureId:'RF_BONUS_FIRST_HIT',name:'ボーナス初当り合算',factStatus:'verified',candidateModel:'binomial',trialUnit:'有効通常ゲーム',numeratorDefinition:'ボーナス初当り回数',denominatorDefinition:'ボーナス初当りを観測可能な有効通常ゲーム数',settingValues:{SET_1:{probability:1/275.4,rawDisplay:'1/275.4'},SET_2:{probability:1/274.0,rawDisplay:'1/274.0'},SET_3:{probability:1/267.3,rawDisplay:'1/267.3'},SET_4:{probability:1/251.1,rawDisplay:'1/251.1'},SET_5:{probability:1/229.9,rawDisplay:'1/229.9'},SET_6:{probability:1/223.4,rawDisplay:'1/223.4'}},sourceRefs:['SRC_NANA_SETTING'],crossSourceStatus:'cross_checked'});
 const rows=[['RE_BONUS_END_2PLUS','ボーナス終了 女の子',settings6.slice(1)],['RE_BONUS_END_4PLUS','ボーナス終了 全員集合',settings6.slice(3)],['RE_BONUS_END_6','ボーナス終了 実写ビリー',['SET_6']],['RE_END_TRICK_2PLUS','エンディングトリック マリア/グウカワ',settings6.slice(1)],['RE_END_TRICK_4PLUS','エンディングトリック ゼンインシュウゴウ',settings6.slice(3)],['RE_END_TRICK_5PLUS','エンディングトリック オヤジ',settings6.slice(4)],['RE_END_TRICK_6','エンディングトリック アオドン',['SET_6']],['RE_XR_VOICE_2PLUS','XR失敗ボイス ファビオ「ニヤついてんじゃねー」',settings6.slice(1)],['RE_XR_VOICE_4PLUS','XR失敗ボイス マリア「おにいちゃんだ～いすき」',settings6.slice(3)],['RE_XR_VOICE_5PLUS','XR失敗ボイス 葉月「ぽぽぽぽ～ん」',settings6.slice(4)],['RE_XR_VOICE_6','XR失敗ボイス ドン「オイラが世界一の花火師でぃ」',['SET_6']]];
 for(const [id2,name,allowed] of rows){ evidence(d,ev(id2,name,allowed,['SRC_NANA_SETTING','SRC_NANA_XR_VOICE','SRC_NANA_ENDING'])); discovery(d,{discoveryCandidateId:`D_${id2}`,name,researchTarget:id2}); }
 discovery(d,{discoveryCandidateId:'D_BONUS_FIRST_HIT',name:'ボーナス初当り合算',researchTarget:'RF_BONUS_FIRST_HIT'});
 save(id,d);
}

// Gundam SEED missing setting2-denial screen
{
 const id='L_GUNDAM_SEED_G',d=read(researchPath(id));
 source(d,{sourceId:'SRC_NANA_END_SCREEN',publisher:'なな徹',title:'ガンダムSEED CZ・ST終了画面',url:'https://nana-press.com/kaiseki/machine/930/29313/',checkedAt:'2026-09-01',sourceType:'major_analysis'});
 evidence(d,ev('RE_CZ_ST_DENY2','CZ・ST終了画面 紫枠 マリュー＆ムウ',settings6.filter(x=>x!=='SET_2'),['SRC_NANA_END_SCREEN']));
 discovery(d,{discoveryCandidateId:'D_CZ_ST_DENY2',name:'CZ・ST終了 紫枠 マリュー＆ムウ 設定2否定',researchTarget:'RE_CZ_ST_DENY2'});
 save(id,d);
}
