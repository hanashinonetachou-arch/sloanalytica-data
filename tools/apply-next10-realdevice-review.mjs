import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const checkedAt='2026-09-06';
const read=id=>JSON.parse(fs.readFileSync(path.join(ROOT,'research',id,'research-data.json'),'utf8'));
const readSel=id=>JSON.parse(fs.readFileSync(path.join(ROOT,'research',id,'selection-data.json'),'utf8'));
const readUi=id=>JSON.parse(fs.readFileSync(path.join(ROOT,'research',id,'ui-design-data.json'),'utf8'));
const write=(id,name,v)=>fs.writeFileSync(path.join(ROOT,'research',id,name),JSON.stringify(v,null,2)+'\n');
const upsert=(arr,key,obj)=>{const i=arr.findIndex(x=>x[key]===obj[key]); if(i>=0) arr[i]=obj; else arr.push(obj);};
const addSource=(r,s)=>upsert(r.sources,'sourceId',s);
const bump=v=>{const p=String(v??'0.1.0').split('.').map(Number); p[2]=(p[2]||0)+1; return p.join('.');};
const input=(id,name,category,order,description)=>({id,name,category,type:'counter',unit:'回',displayOrder:order,inferenceRole:'INCLUDE_SUPPORT',defaultValue:'',minimum:0,description});
const bin=(researchFeatureId,name,trialUnit,numeratorDefinition,denominatorDefinition,vals,sourceRefs,notes)=>({researchFeatureId,name,factStatus:'verified',candidateModel:'binomial',trialUnit,numeratorDefinition,denominatorDefinition,settingValues:Object.fromEntries(Object.entries(vals).map(([s,p])=>[s,{probability:p,rawDisplay:String(p)}])),sourceRefs,crossSourceStatus:'cross_checked',notes});
const multi=(researchFeatureId,name,trialUnit,categories,dists,sourceRefs,notes)=>({researchFeatureId,name,factStatus:'verified',candidateModel:'multinomial',trialUnit,categories,settingDistributions:dists,sourceRefs,crossSourceStatus:'cross_checked',notes});
const selBin=(rf,fid,num,den,reason,w=0.8)=>({researchFeatureId:rf,featureId:fid,adoptionCategory:'INCLUDE_SUPPORT',weight:w,numeratorInputId:num,denominatorInputId:den,userReason:reason,difficultyParticipation:'EXCLUDE',difficultyExclusionReason:'条件付き観測で総Gへの共通Exposure換算を置けないため。'});
const selMulti=(rf,fid,ids,reason,w=0.8,extra={})=>({researchFeatureId:rf,featureId:fid,adoptionCategory:'INCLUDE_SUPPORT',weight:w,numeratorInputId:ids[0],categoryInputIds:ids.slice(1),inputTransform:'sum_inputs_to_trials',userReason:reason,difficultyParticipation:'EXCLUDE',difficultyExclusionReason:'条件付き観測で総Gへの共通Exposure換算を置けないため。',...extra});
const addSection=(u,title,ids,description)=>{if(!u.sectionOrder.includes(title))u.sectionOrder.push(title);u.sections[title]={inputIds:ids,description,collapsible:true,defaultExpanded:false};};
const counterContract=(name,note)=>({name,mode:'COUNTER',gridSpan:6,directInput:false,compact:true,step:1,emptyMeansUnobserved:true,observedZeroAllowed:true,quickAdd:[1],...(note?{note}:{})});
const addSummary=(s,{selected=[],rejected=[],evaluatedDelta=0})=>{const c=s.selectionSummaryContract??{schemaVersion:'selection-summary-v1',evaluatedCount:0,selectedCount:0,rejectedCount:0,selected:[],rejected:[]};for(const x of selected)upsert(c.selected,'featureId',x);for(const x of rejected)upsert(c.rejected,'featureId',x);c.selectedCount=c.selected.length;c.rejectedCount=c.rejected.length;c.evaluatedCount=Math.max(c.evaluatedCount+evaluatedDelta,c.selectedCount+c.rejectedCount);s.selectionSummaryContract=c;};
const save=(id,r,s,u)=>{s.machineDataVersion=bump(s.machineDataVersion);write(id,'research-data.json',r);write(id,'selection-data.json',s);write(id,'ui-design-data.json',u);};

// 1) AZUR LANE: non-hard ending distribution + Kaga battle character sequence.
{
 const id='L_AZURLANE_THE_ANIMATION_KN',r=read(id),s=readSel(id),u=readUi(id);
 addSource(r,{sourceId:'SRC_HAZUSE_REVIEW_20260906',publisher:'data.hazuse.com',title:'L アズールレーン THE ANIMATION 設定示唆画面・加賀バトル選択率',url:'https://data.hazuse.com/?genre=208&machine_code=5S0317',checkedAt,sourceType:'analysis'});
 const endCats=['エンタープライズ','ベルファスト','エンタープライズ&ベルファスト','赤城','全員集合','加賀&赤城','パーティー'];
 const end={SET_1:[.433,.433,.125,.01,0,0,0],SET_2:[.334,.501,.125,.01,.03,0,0],SET_3:[.501,.334,.125,.01,.03,0,0],SET_4:[.294,.441,.20,.032,.03,.002,0],SET_5:[.436,.291,.206,.035,.03,.002,0],SET_6:[.287,.430,.213,.036,.03,.003,.001]};
 upsert(r.features,'researchFeatureId',multi('RF_END_SCREEN_NON_HARD','海戦BONUS失敗/AT終了画面（非確定系）','非確定終了画面1回',endCats,Object.fromEntries(Object.entries(end).map(([k,a])=>[k,Object.fromEntries(endCats.map((c,i)=>[c,a[i]]))])),['SRC_HAZUSE_REVIEW_20260906'],'設定確定3種はEvidence側に残し、確率Featureでは非確定4種だけを条件付きで評価する。'));
 const endIds=['INP_END_ENTERPRISE','INP_END_BELFAST','INP_END_ENTERPRISE_BELFAST','INP_END_AKAGI'];
 [['INP_END_ENTERPRISE','エンタープライズ'],['INP_END_BELFAST','ベルファスト'],['INP_END_ENTERPRISE_BELFAST','エンタープライズ&ベルファスト'],['INP_END_AKAGI','赤城']].forEach(([x,n],i)=>upsert(s.inputs,'id',input(x,n,'AZUR_END_NON_HARD',30+i,'海戦BONUS失敗時またはAT終了時。全員集合/加賀&赤城/パーティーはここに含めず設定確定情報へ入力します。')));
 upsert(s.features,'featureId',selMulti('RF_END_SCREEN_NON_HARD','FEAT_END_SCREEN_NON_HARD',endIds,'設定確定画面を除いた終了画面4種の内訳を条件付きMultinomialで評価し、Evidenceとの二重計上を避けます。',0.8,{categoryExcludeLabels:['全員集合','加賀&赤城','パーティー']}));
 const kagaCats=['エンタープライズ','ベルファスト','反転エンタープライズ','反転ベルファスト','瑞鶴','オイゲン'];
 const kaga={SET_1:[.415,.415,.10,.05,.01,.01],SET_2:[.332,.498,.05,.10,.01,.01],SET_3:[.498,.332,.10,.05,.01,.01],SET_4:[.329,.493,.05,.10,.016,.012],SET_5:[.50,.323,.10,.05,.012,.015],SET_6:[.325,.488,.05,.10,.019,.019]};
 upsert(r.features,'researchFeatureId',multi('RF_KAGA_CHARACTER_SEQUENCE','加賀バトル前半失敗時キャラ紹介','加賀バトル前半失敗1回',kagaCats,Object.fromEntries(Object.entries(kaga).map(([k,a])=>[k,Object.fromEntries(kagaCats.map((c,i)=>[c,a[i]]))])),['SRC_HAZUSE_REVIEW_20260906'],'AT濃厚の加賀/赤城混在シナリオは設定別分布の母集団から外し、公開6シナリオのみ評価する。'));
 const kagaIds=['INP_KAGA_ENT','INP_KAGA_BEL','INP_KAGA_REV_ENT','INP_KAGA_REV_BEL','INP_KAGA_ZUIKAKU','INP_KAGA_EUGEN'];
 [['INP_KAGA_ENT','エンタープライズ'],['INP_KAGA_BEL','ベルファスト'],['INP_KAGA_REV_ENT','反転エンタープライズ'],['INP_KAGA_REV_BEL','反転ベルファスト'],['INP_KAGA_ZUIKAKU','瑞鶴'],['INP_KAGA_EUGEN','オイゲン']].forEach(([x,n],i)=>upsert(s.inputs,'id',input(x,n,'AZUR_KAGA_SEQUENCE',40+i,'加賀バトル前半失敗後のキャラ紹介。赤城/加賀が混ざるAT濃厚シナリオは除外します。')));
 upsert(s.features,'featureId',selMulti('RF_KAGA_CHARACTER_SEQUENCE','FEAT_KAGA_CHARACTER_SEQUENCE',kagaIds,'前半失敗後に直接識別できる6シナリオの設定別選択率を一体評価します。'));
 s.uiCategoryLabels.AZUR_END_NON_HARD='終了画面（非確定）';s.uiCategoryLabels.AZUR_KAGA_SEQUENCE='加賀バトル キャラ紹介';
 addSection(u,'終了画面（非確定）',endIds,'設定確定3種は「設定示唆・確定情報」に入力し、この欄では非確定4種だけを数えます。');addSection(u,'加賀バトル キャラ紹介',kagaIds,'前半失敗後の6シナリオをカウントします。AT濃厚の赤城/加賀混在シナリオは除外します。');
 [...endIds,...kagaIds].forEach(x=>u.inputContracts[x]=counterContract(s.inputs.find(i=>i.id===x).name));
 addSummary(s,{selected:[{featureId:'FEAT_END_SCREEN_NON_HARD',name:'設定示唆終了画面の内訳（非EVIDENCE）',reason:'設定別選択率が公開され、確定画面を除外した条件付き分布として直接観測できるため採用。'},{featureId:'FEAT_KAGA_CHARACTER_SEQUENCE',name:'加賀バトルのキャラ紹介',reason:'前半失敗後の6シナリオに完全な設定別選択率があり直接識別できるため採用。'}],evaluatedDelta:2});save(id,r,s,u);
}

// 2) DRUAGA: adopt DC chest draw; reject derived Druaga BB and rare-role bonus overlap.
{
 const id='L_DRUAGA_NO_TOU_ZA',r=read(id),s=readSel(id),u=readUi(id);
 addSource(r,{sourceId:'SRC_1GEKI_REVIEW_20260906',publisher:'1geki.jp',title:'ドルアーガの塔 設定差・設定判別要素まとめ',url:'https://1geki.jp/slot/l_druaga/0/',checkedAt,sourceType:'analysis'});
 upsert(r.features,'researchFeatureId',bin('RF_DC_EMPTY_CELL_CHEST','DC中 モンスター/鍵マス以外の宝箱上乗せ','対象スイカ/チェリー1回','宝箱獲得','DC中モンスター/鍵マス以外で成立したスイカ/チェリー',{SET_1:.063,SET_2:.078,SET_5:.102,SET_6:.125},['SRC_1GEKI_REVIEW_20260906'],'EX-DCは除外。モンスター/鍵マス以外で成立した対象役のみを母数にする。'));
 upsert(s.inputs,'id',input('INP_DC_ELIGIBLE_RARE','対象スイカ/チェリー','DRUAGA_DC_DRAW',30,'DC中のモンスター/鍵マス以外で成立したスイカ/チェリー回数。EX-DCは除外します。'));
 upsert(s.inputs,'id',input('INP_DC_CHEST_HIT','宝箱獲得','DRUAGA_DC_DRAW',31,'上記対象役から宝箱を1個獲得した回数。'));
 upsert(s.features,'featureId',selBin('RF_DC_EMPTY_CELL_CHEST','FEAT_DC_EMPTY_CELL_CHEST','INP_DC_CHEST_HIT','INP_DC_ELIGIBLE_RARE','対象役ごとの当選率が6.3%～12.5%で公開され、実戦で分母・分子を直接数えられるため採用。'));
 s.uiCategoryLabels.DRUAGA_DC_DRAW='DC中 何もないマス';addSection(u,'DC中 何もないマス',['INP_DC_ELIGIBLE_RARE','INP_DC_CHEST_HIT'],'モンスター/鍵マス以外でのスイカ・チェリーだけを対象に、宝箱上乗せを数えます。EX-DCは除外します。');u.inputContracts.INP_DC_ELIGIBLE_RARE=counterContract('対象スイカ/チェリー');u.inputContracts.INP_DC_CHEST_HIT=counterContract('宝箱獲得');
 addSummary(s,{selected:[{featureId:'FEAT_DC_EMPTY_CELL_CHEST',name:'DC中・何もないマスでの上乗せ抽選',reason:'対象役を母数にでき、設定1と6で約2倍の公開当選率差があるため採用。'}],rejected:[{featureId:'FEAT_REF_DRUAGA_BB_DERIVED',name:'AT中ドルアーガBB当選確率の派生算出',reason:'累積ポイント・AT継続・BB/RB系列・AT終了時リセットに依存し、公開値だけから独立した設定別出現率を一意に算出できないため不採用。'},{featureId:'FEAT_REF_RARE_BONUS_DUPLICATE',name:'レア役時のボーナス同時当選期待度',reason:'設定差は確認できるが、現行のBIG/REG初当りと同一ボーナス事象を再度評価して尤度を二重計上するため不採用。条件付きボーナス内訳の完全分布が公開された場合に再検討する。'}],evaluatedDelta:3});save(id,r,s,u);
}

// 3) TOKYO REVENGERS: adopt Toman Chance rare-role AT and eligible AT-end Revenge; reject initial stock due attribution.
{
 const id='L_SMASLO_TOKYO_REVENGERS_ZF',r=read(id),s=readSel(id),u=readUi(id);
 addSource(r,{sourceId:'SRC_1GEKI_REVIEW_20260906',publisher:'1geki.jp',title:'東京リベンジャーズ 設定差・設定判別要素まとめ',url:'https://1geki.jp/slot/l_tokyo_revengers/0/',checkedAt,sourceType:'analysis'});
 const vals={SET_1:.102,SET_2:.105,SET_3:.109,SET_4:.125,SET_5:.148,SET_6:.164};
 upsert(r.features,'researchFeatureId',bin('RF_TOMAN_CHANCE_WEAK_RARE_AT','東卍CHANCE中 弱チェリー/スイカからAT','対象役1回','東卍RUSH当選','東卍CHANCE中の弱チェリー/スイカ',vals,['SRC_1GEKI_REVIEW_20260906'],'卍目は全設定共通10.2%のため対象外。弱チェリー/スイカだけを母数にする。'));
 upsert(s.inputs,'id',input('INP_TC_WEAK_RARE','弱チェリー/スイカ','TOKYO_TC_RARE',30,'東卍CHANCE中に成立した弱チェリーとスイカの合計。卍目は含めません。'));
 upsert(s.inputs,'id',input('INP_TC_WEAK_RARE_AT','うちAT当選','TOKYO_TC_RARE',31,'上記弱チェリー/スイカ契機で東卍RUSHに当選した回数。'));
 upsert(s.features,'featureId',selBin('RF_TOMAN_CHANCE_WEAK_RARE_AT','FEAT_TC_WEAK_RARE_AT','INP_TC_WEAK_RARE_AT','INP_TC_WEAK_RARE','対象役は全設定共通約1/42で、AT当選率10.2%～16.4%を条件付きで直接評価できるため採用。'));
 const rev={SET_1:.102,SET_2:.109,SET_3:.109,SET_4:.125,SET_5:.160,SET_6:.164};
 upsert(r.features,'researchFeatureId',bin('RF_AT_END_REVENGE_ELIGIBLE','東卍RUSH終了後REVENGE（非駆け抜け）','対象AT終了1回','REVENGEフリーズ発生','一触即発または東卍CHANCEに一度以上当選した東卍RUSH終了',rev,['SRC_1GEKI_REVIEW_20260906'],'駆け抜け時は全設定共通でREVENGE濃厚のため母数から除外する。'));
 upsert(s.inputs,'id',input('INP_REVENGE_ELIGIBLE_AT_END','対象AT終了','TOKYO_REVENGE',40,'一触即発または東卍CHANCEに一度以上当選した東卍RUSHの終了回数。駆け抜けは除外します。'));
 upsert(s.inputs,'id',input('INP_REVENGE_HIT','REVENGE発生','TOKYO_REVENGE',41,'上記対象AT終了後にREVENGEフリーズが発生した回数。'));
 upsert(s.features,'featureId',selBin('RF_AT_END_REVENGE_ELIGIBLE','FEAT_AT_END_REVENGE_ELIGIBLE','INP_REVENGE_HIT','INP_REVENGE_ELIGIBLE_AT_END','駆け抜けを除外すれば10.2%～16.4%の設定別発生率を直接観測できるため採用。'));
 s.uiCategoryLabels.TOKYO_TC_RARE='東卍CHANCE レア役';s.uiCategoryLabels.TOKYO_REVENGE='AT終了後 REVENGE';addSection(u,'東卍CHANCE レア役',['INP_TC_WEAK_RARE','INP_TC_WEAK_RARE_AT'],'弱チェリー/スイカだけを母数にします。卍目は対象外です。');addSection(u,'AT終了後 REVENGE',['INP_REVENGE_ELIGIBLE_AT_END','INP_REVENGE_HIT'],'一触即発または東卍CHANCEに一度以上当選したATだけを母数にします。駆け抜けATは除外します。');['INP_TC_WEAK_RARE','INP_TC_WEAK_RARE_AT','INP_REVENGE_ELIGIBLE_AT_END','INP_REVENGE_HIT'].forEach(x=>u.inputContracts[x]=counterContract(s.inputs.find(i=>i.id===x).name));
 addSummary(s,{selected:[{featureId:'FEAT_TC_WEAK_RARE_AT',name:'東卍CHANCE中 弱チェリー・スイカ時AT当選率',reason:'対象役とAT当選を直接数えられ、設定1～6の完全な当選率が公開されているため採用。'},{featureId:'FEAT_AT_END_REVENGE_ELIGIBLE',name:'東卍RUSH終了後のREVENGE発生率（非駆け抜け）',reason:'駆け抜けを除外した対象ATで完全な設定別発生率が公開され、条件を実戦で識別できるため採用。'}],rejected:[{featureId:'FEAT_REF_INITIAL_SET_STOCK',name:'初当り時のセットストック抽選',reason:'設定別振り分けは公開されているが、AT中の別契機ストックと事後的に混在し「初当り時に付与されたストック数」を安定して直接識別できないため不採用。'}],evaluatedDelta:3});save(id,r,s,u);
}

// 4) BABEL: keep urban-legend mode excluded and publish explicit reason.
{
 const id='L_BABEL_BA',r=read(id),s=readSel(id),u=readUi(id);
 addSummary(s,{rejected:[{featureId:'FEAT_REF_URBAN_LEGEND_MODE',name:'0G連時の都市伝説モード移行率',reason:'0G連発生時の移行率8.1%～3.5%には設定差があるが、都市伝説モード移行そのものを実戦で直接識別できず、後続0G連から逆算すると別の0G連契機と分離できないため不採用。'}],evaluatedDelta:1});save(id,r,s,u);
}

// 5) SHIN ONIMUSHA 3: all-cast navigation under explicit 4-frame condition.
{
 const id='L_SHIN_ONIMUSHA_3_SA',r=read(id),s=readSel(id),u=readUi(id);
 addSource(r,{sourceId:'SRC_PACHIMAGA_REVIEW_20260906',publisher:'pachimaga.com',title:'新鬼武者3 設定判別・オールキャストナビ発生率',url:'https://pachimaga.com/free/mach/maker-s/leostar/064435.php',checkedAt,sourceType:'analysis'});
 upsert(r.features,'researchFeatureId',bin('RF_BONUS_ALL_CAST_NAV','(真)蒼剣ボーナス中 オールキャストナビ','4コマ目押し条件達成ボーナス1回','オールキャストナビ','開始時擬似遊技で全リール4コマ以内にボーナス絵柄を目押しできた赤7+青7ボーナス',{SET_1:.063,SET_2:.094,SET_3:.094,SET_4:.125,SET_5:.125,SET_6:.125},['SRC_PACHIMAGA_REVIEW_20260906'],'条件未達のボーナスを母数に入れない。'));
 upsert(s.inputs,'id',input('INP_NAV_ELIGIBLE_BONUS','4コマ条件達成ボーナス','ONIMUSHA_NAV',30,'ボーナス開始時の擬似遊技で全リール4コマ以内にボーナス絵柄を目押しできた赤7+青7ボーナス回数。'));
 upsert(s.inputs,'id',input('INP_NAV_ALL_CAST','オールキャストナビ','ONIMUSHA_NAV',31,'上記条件達成ボーナスでオールキャストナビが発生した回数。'));
 upsert(s.features,'featureId',selBin('RF_BONUS_ALL_CAST_NAV','FEAT_BONUS_ALL_CAST_NAV','INP_NAV_ALL_CAST','INP_NAV_ELIGIBLE_BONUS','4コマ条件達成時に限定すれば6.3%～12.5%の公開発生率を直接評価できるため採用。'));
 s.uiCategoryLabels.ONIMUSHA_NAV='ボーナス中ナビボイス';addSection(u,'ボーナス中ナビボイス',['INP_NAV_ELIGIBLE_BONUS','INP_NAV_ALL_CAST'],'4コマ目押し条件を達成した赤7+青7ボーナスだけを母数にします。');u.inputContracts.INP_NAV_ELIGIBLE_BONUS=counterContract('4コマ条件達成ボーナス');u.inputContracts.INP_NAV_ALL_CAST=counterContract('オールキャストナビ');
 addSummary(s,{selected:[{featureId:'FEAT_BONUS_ALL_CAST_NAV',name:'ボーナス中のナビボイス選択率',reason:'4コマ目押し条件を満たしたボーナスを母数として6設定の公開選択率を直接観測できるため採用。'}],evaluatedDelta:1});save(id,r,s,u);
}

// 6) RAILGUN 2: AT start stage, CZ composition, Episode direct, non-hard card distribution.
{
 const id='L_TOARU_KAGAKU_NO_RAILGUN_2_FV',r=read(id),s=readSel(id),u=readUi(id);
 addSource(r,{sourceId:'SRC_NANA_REVIEW_SETTINGS',publisher:'nana-press.com',title:'とある科学の超電磁砲2 設定差・設定示唆演出まとめ',url:'https://nana-press.com/kaiseki/machine/1041/32749/',checkedAt,sourceType:'analysis'});
 addSource(r,{sourceId:'SRC_NANA_REVIEW_CARDS',publisher:'nana-press.com',title:'とある科学の超電磁砲2 獲得枚数キャラカード出現率',url:'https://nana-press.com/kaiseki/machine/1041/33002/',checkedAt,sourceType:'analysis'});
 const stageCats=['駆動鎧','ドッペルゲンガー','BUNNY DANCE'];const stage={SET_1:[.3477,.6406,.0117],SET_2:[.3438,.6445,.0117],SET_3:[.3320,.6484,.0195],SET_4:[.3164,.6602,.0234],SET_5:[.3086,.6641,.0273],SET_6:[.3008,.6680,.0313]};
 upsert(r.features,'researchFeatureId',multi('RF_AT_START_STAGE','AT開始時ステージ','AT開始1回',stageCats,Object.fromEntries(Object.entries(stage).map(([k,a])=>[k,Object.fromEntries(stageCats.map((c,i)=>[c,a[i]]))])),['SRC_NANA_REVIEW_SETTINGS'],'AT準備中に決定される開始ステージ3種を評価。'));
 const stageIds=['INP_STAGE_DRIVEN','INP_STAGE_DOPPEL','INP_STAGE_BUNNY'];[['INP_STAGE_DRIVEN','駆動鎧'],['INP_STAGE_DOPPEL','ドッペルゲンガー'],['INP_STAGE_BUNNY','BUNNY DANCE']].forEach(([x,n],i)=>upsert(s.inputs,'id',input(x,n,'RAILGUN_AT_STAGE',30+i,'AT開始時のステージを数えます。')));upsert(s.features,'featureId',selMulti('RF_AT_START_STAGE','FEAT_AT_START_STAGE',stageIds,'AT開始時3ステージの完全な設定別振り分けを一体評価します。'));
 const czCats=['GIRLS JUDGE','上位CZ'];const cz={SET_1:[.9764292832663496,.0235707167336505],SET_2:[.9713495646565624,.0286504353434376],SET_3:[.9715608259559934,.0284391740440066],SET_4:[.9593607897240249,.0406392102759751],SET_5:[.9490720931389621,.0509279068610379],SET_6:[.9468359619488235,.0531640380511766]};
 upsert(r.features,'researchFeatureId',multi('RF_CZ_TYPE_CONDITIONAL','CZ種類内訳（CZ合算に条件付け）','CZ当選1回',czCats,Object.fromEntries(Object.entries(cz).map(([k,a])=>[k,Object.fromEntries(czCats.map((c,i)=>[c,a[i]]))])),['SRC_NANA_REVIEW_SETTINGS'],'公開された各CZ実質当選率から、CZ合算に条件付けた種類比率を算出。CZ合算Featureと役割分解し、総数と内訳を二重計上しない。'));
 const czIds=['INP_CZ_GIRLS','INP_CZ_UPPER'];[['INP_CZ_GIRLS','GIRLS JUDGE'],['INP_CZ_UPPER','上位CZ']].forEach(([x,n],i)=>upsert(s.inputs,'id',input(x,n,'RAILGUN_CZ_TYPE',40+i,'CZ当選の種類を数えます。')));upsert(s.features,'featureId',selMulti('RF_CZ_TYPE_CONDITIONAL','FEAT_CZ_TYPE_CONDITIONAL',czIds,'既存CZ合算は総当選率、追加FeatureはCZ内の種類構成だけを評価するため、尤度を総数×条件付き内訳に分解して重複を避けます。'));
 upsert(r.features,'researchFeatureId',bin('RF_EPISODE_BONUS_DIRECT','エピソードBONUS直撃','通常ゲーム1G','エピソードBONUS直撃','通常ゲーム数',{SET_1:1/39680,SET_2:1/26453,SET_3:1/19921,SET_4:1/13390,SET_5:1/11572,SET_6:1/10168},['SRC_NANA_REVIEW_SETTINGS'],'通常時の超電磁砲コインからのエピソードBONUS直撃。'));
 upsert(s.inputs,'id',input('INP_EPISODE_DIRECT','エピソードBONUS直撃','RAILGUN_EPISODE',50,'通常時からエピソードBONUSへ直撃した回数。'));upsert(s.features,'featureId',selBin('RF_EPISODE_BONUS_DIRECT','FEAT_EPISODE_BONUS_DIRECT','INP_EPISODE_DIRECT','INP_NORMAL_GAMES','1/39680～1/10168の完全な6設定公開値があり通常Gを分母に直接観測できるため採用。',0.6));
 const cardCats=['美琴&食蜂','美琴&黒子①','美琴&黒子②','美琴&黒子&佐天&初春','美琴&黒子③','お風呂','一方通行','その他'];
 const card={SET_1:[.10,.0125,.0125,.001,0,0,0,.874],SET_2:[.125,.0175,.0175,.005,.01,.01,0,.815],SET_3:[.125,.0175,.0175,.005,.01,0,0,.825],SET_4:[.15,.025,.025,.015,.01,.01,.001,.764],SET_5:[.15,.025,.025,.02,.01,0,.001,.769],SET_6:[.15,.025,.025,.025,.01,.01,.001,.754]};
 upsert(r.features,'researchFeatureId',multi('RF_PAYOUT_CARD_NON_HARD','獲得枚数キャラカード（非確定系）','キャラカード抽選1回',cardCats,Object.fromEntries(Object.entries(card).map(([k,a])=>[k,Object.fromEntries(cardCats.map((c,i)=>[c,a[i]]))])),['SRC_NANA_REVIEW_CARDS'],'設定集合を限定する3種はEvidence側に分離し、非確定4種+その他だけを条件付き分布で評価する。'));
 const cardIds=['INP_CARD_MISAKA_SHOKUHO','INP_CARD_MISAKA_KUROKO1','INP_CARD_MISAKA_KUROKO2','INP_CARD_FOUR','INP_CARD_OTHER'];[['INP_CARD_MISAKA_SHOKUHO','美琴&食蜂'],['INP_CARD_MISAKA_KUROKO1','美琴&黒子①'],['INP_CARD_MISAKA_KUROKO2','美琴&黒子②'],['INP_CARD_FOUR','美琴&黒子&佐天&初春'],['INP_CARD_OTHER','その他']].forEach(([x,n],i)=>upsert(s.inputs,'id',input(x,n,'RAILGUN_CARD',60+i,'獲得枚数到達時のキャラカード。美琴&黒子③/お風呂/一方通行は確定・限定情報側へ分離します。')));
 upsert(s.features,'featureId',selMulti('RF_PAYOUT_CARD_NON_HARD','FEAT_PAYOUT_CARD_NON_HARD',cardIds,'設定集合を直接限定するカードを除外し、非確定カードの出現分布だけを条件付きで評価します。',0.7,{categoryExcludeLabels:['美琴&黒子③','お風呂','一方通行']}));
 s.uiCategoryLabels.RAILGUN_AT_STAGE='AT開始ステージ';s.uiCategoryLabels.RAILGUN_CZ_TYPE='CZ種類';s.uiCategoryLabels.RAILGUN_EPISODE='エピソードBONUS直撃';s.uiCategoryLabels.RAILGUN_CARD='獲得枚数キャラカード（非確定）';
 addSection(u,'AT開始ステージ',stageIds,'AT開始時のステージを3種類でカウントします。');addSection(u,'CZ種類',czIds,'CZ合算とは別に、当選したCZの種類内訳だけを記録します。');addSection(u,'エピソードBONUS直撃',['INP_EPISODE_DIRECT'],'通常時からのエピソードBONUS直撃回数を入力します。');addSection(u,'獲得枚数キャラカード（非確定）',cardIds,'確定・設定限定カードはここに含めず、非確定カードとその他だけを数えます。');[...stageIds,...czIds,'INP_EPISODE_DIRECT',...cardIds].forEach(x=>u.inputContracts[x]=counterContract(s.inputs.find(i=>i.id===x).name));
 addSummary(s,{selected:[{featureId:'FEAT_AT_START_STAGE',name:'AT開始時のステージ振り分け',reason:'開始時3ステージの完全な設定別選択率が公開され、直接観測できるため採用。'},{featureId:'FEAT_CZ_TYPE_CONDITIONAL',name:'CZの種類振り分け',reason:'既存CZ合算を総数、追加Featureを条件付き種類内訳として因数分解でき、二重計上を避けて高設定ほど増える上位CZ比率を利用できるため採用。'},{featureId:'FEAT_EPISODE_BONUS_DIRECT',name:'エピソードBONUS直撃確率',reason:'通常Gを分母に完全な6設定実質確率が公開され、低頻度ながら設定差が大きいため補助Featureとして採用。'},{featureId:'FEAT_PAYOUT_CARD_NON_HARD',name:'設定示唆カードの出現率（非EVIDENCE）',reason:'出現率が公開されており、設定を直接限定するカードをEvidence側へ分離した条件付き分布として評価できるため採用。'}],evaluatedDelta:4});save(id,r,s,u);
}

// 7) ZETTAI SHOGEKI IV: adopt weak-cherry night transition; reject aggregate direct-hit probability because denominator context is not robustly observable.
{
 const id='L_ZETTAI_SHOGEKI_FORCE_FH',r=read(id),s=readSel(id),u=readUi(id);
 addSource(r,{sourceId:'SRC_NANA_REVIEW_NIGHT',publisher:'nana-press.com',title:'絶対衝激4 設定差・夜ステージ抽選',url:'https://nana-press.com/kaiseki/machine/1043/32612/',checkedAt,sourceType:'analysis'});
 upsert(r.features,'researchFeatureId',bin('RF_WEAK_CHERRY_NIGHT','弱チェリー契機 夜ステージ移行','弱チェリー1回','夜ステージ移行','通常時弱チェリー',{SET_1:.301,SET_2:.301,SET_3:.301,SET_4:.301,SET_5:.336,SET_6:.375},['SRC_NANA_REVIEW_NIGHT'],'夜ステージ滞在中の弱チェリーによる保障13G再セットは、画面上の再移行を直接識別しにくいため新規移行として数えない。'));
 upsert(s.inputs,'id',input('INP_WEAK_CHERRY_ELIGIBLE','弱チェリー','ZETTAI_NIGHT',30,'通常時の弱チェリー回数。夜ステージ中の保障再セット目的の弱チェリーは母数から除外します。'));
 upsert(s.inputs,'id',input('INP_WEAK_CHERRY_NIGHT','夜ステージ移行','ZETTAI_NIGHT',31,'上記弱チェリーを契機に夜ステージへ新規移行した回数。'));
 upsert(s.features,'featureId',selBin('RF_WEAK_CHERRY_NIGHT','FEAT_WEAK_CHERRY_NIGHT','INP_WEAK_CHERRY_NIGHT','INP_WEAK_CHERRY_ELIGIBLE','弱チェリーを母数に30.1%/33.6%/37.5%の設定差を直接評価できるため採用。'));
 s.uiCategoryLabels.ZETTAI_NIGHT='弱チェリー→夜ステージ';addSection(u,'弱チェリー→夜ステージ',['INP_WEAK_CHERRY_ELIGIBLE','INP_WEAK_CHERRY_NIGHT'],'夜ステージ中の保障再セットは新規移行として数えません。');u.inputContracts.INP_WEAK_CHERRY_ELIGIBLE=counterContract('弱チェリー');u.inputContracts.INP_WEAK_CHERRY_NIGHT=counterContract('夜ステージ移行');
 addSummary(s,{selected:[{featureId:'FEAT_WEAK_CHERRY_NIGHT',name:'弱チェリー契機の夜ステージ移行率',reason:'通常時弱チェリーを母数として設定別当選率を直接観測できるため採用。'}],rejected:[{featureId:'FEAT_REF_BONUS_DIRECT_AGG',name:'ボーナス直撃確率（各契機役の合算）',reason:'公開実質値は「日曜日」と「日曜日以外かつポイントMAX時以外」で母集団が分かれており、実戦総Gから正しい対象G分母を安定して切り出せないため合算Featureは不採用。契機役ごとの確定/下限示唆はEvidenceとして別途扱う余地がある。'}],evaluatedDelta:2});save(id,r,s,u);
}

// 8) VALVRAVE 2: do not probabilistically adopt approximate/custom-sensitive end-screen ratios yet.
{
 const id='L_KAKUMEIKI_VALVRAVE_2_JF',r=read(id),s=readSel(id),u=readUi(id);
 addSummary(s,{rejected:[{featureId:'FEAT_REF_END_SCREEN_RATIO',name:'CZ・ボーナス終了画面の出現割合',reason:'カスタムなし時の設定差は確認できるが、現時点で確認できた公開割合が「約」表記で、さらにホール側の終了画面カスタムにより分布が変化する。カスタムOFFを確実に確認し、精密な設定別分布を固定できるまでは確率Featureへ採用しない。紫/銀/金など設定集合を限定する画面はEvidenceを優先する。'}],evaluatedDelta:1});save(id,r,s,u);
}

console.log('Next10 real-device review applied to 8 machines.');
