import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const read=(p)=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const write=(p,v)=>fs.writeFileSync(path.join(ROOT,p),JSON.stringify(v,null,2)+'\n');
const upsert=(arr,key,value)=>{const i=arr.findIndex(x=>x[key]===value[key]); if(i>=0) arr[i]=value; else arr.push(value);};
const remove=(arr,key,val)=>{const i=arr.findIndex(x=>x[key]===val); if(i>=0) arr.splice(i,1);};
const norm=(obj)=>{const s=Object.values(obj).reduce((a,b)=>a+b,0); return Object.fromEntries(Object.entries(obj).map(([k,v])=>[k,v/s]));};
const input=(id,name,type,category,displayOrder,parentInputId,description)=>({id,name,type,category,displayOrder,defaultValue:null,unit:'回',...(parentInputId?{parentInputId}:{}),...(description?{description}:{})});
const selectionFeature=(researchFeatureId,featureId,denominatorInputId,numeratorInputId,categoryInputIds,residualCategoryLabel,userReason)=>({researchFeatureId,featureId,adoptionCategory:'INCLUDE_SUPPORT',denominatorInputId,numeratorInputId,...(categoryInputIds?{categoryInputIds}:{}),...(residualCategoryLabel?{residualCategoryLabel}:{}),minimumSample:1,sampleRecommendation:20,weight:1,displayFormat:'percent',difficultyParticipation:'EXCLUDE',difficultyExclusionReason:'通常ゲーム数からこの演出の確認試行数を正確に換算できないため共通Difficultyには含めない。',userReason});

// Eureka 4: BIG終了画面割合をMultinomial採用。SC Lv12入力説明と親子制約メタデータを追加。
{
 const id='L_EUREKA_SEVEN4_HIEVO_KX', rp=`research/${id}/research-data.json`, sp=`research/${id}/selection-data.json`;
 const r=read(rp), s=read(sp); s.machineDataVersion='0.1.1';
 upsert(r.sources,'sourceId',{sourceId:'SRC_END_SCREEN',publisher:'なな徹',url:'https://nana-press.com/kaiseki/machine/741/21430/',checkedAt:'2026-08-21',sourceType:'major_analysis'});
 upsert(r.features,'researchFeatureId',{researchFeatureId:'RF_BIG_END_SCREEN',name:'BIG終了画面',factStatus:'verified',candidateModel:'multinomial',trialUnit:'BIG終了画面1回',numeratorDefinition:'終了画面人数別回数',denominatorDefinition:'BIG終了画面確認回数',settingValues:{},sourceRefs:['SRC_END_SCREEN'],crossSourceStatus:'single_source',categories:['TWO','FOUR','SIX','EIGHT'],distributionMode:'complete',settingDistributions:{SET_1:{TWO:.9365,FOUR:.0625,SIX:.001,EIGHT:0},SET_2:{TWO:.9325,FOUR:.0625,SIX:.005,EIGHT:0},SET_3:{TWO:.9325,FOUR:.0625,SIX:.005,EIGHT:0},SET_4:{TWO:.864,FOUR:.125,SIX:.01,EIGHT:.001},SET_5:{TWO:.8625,FOUR:.125,SIX:.01,EIGHT:.0025},SET_6:{TWO:.86,FOUR:.125,SIX:.01,EIGHT:.005}}});
 const lv=s.inputs.find(x=>x.id==='INP_SC_LV12'); if(lv) lv.description='初期Lvが12だった場合は、セブンチャンス回数と初期Lv12回数の両方に+1をしてください。';
 for(const x of [input('INP_BIG_END_TOTAL','BIG終了画面確認回数','integer','BIG_END_SCREEN',30),input('INP_BIG_END_FOUR','4人画面','counter','BIG_END_SCREEN',31,'INP_BIG_END_TOTAL'),input('INP_BIG_END_SIX','6人画面','counter','BIG_END_SCREEN',32,'INP_BIG_END_TOTAL'),input('INP_BIG_END_EIGHT','8人画面','counter','BIG_END_SCREEN',33,'INP_BIG_END_TOTAL')]) upsert(s.inputs,'id',x);
 upsert(s.features,'researchFeatureId',{...selectionFeature('RF_BIG_END_SCREEN','FEAT_BIG_END_SCREEN','INP_BIG_END_TOTAL','INP_BIG_END_FOUR',['INP_BIG_END_SIX','INP_BIG_END_EIGHT'],'TWO','BIG終了画面の設定別振り分けが公開され、4人・6人・8人の構成に段階差があるため補助採用。入力は任意です。'),categorySubtractInputIds:{INP_BIG_END_TOTAL:['INP_BIG_END_FOUR','INP_BIG_END_SIX','INP_BIG_END_EIGHT']}});
 // categorySubtractInputIds on this multinomial is not used for residual; remove to avoid semantic impact.
 delete s.features.find(x=>x.researchFeatureId==='RF_BIG_END_SCREEN').categorySubtractInputIds;
 s.uiCategoryLabels={...(s.uiCategoryLabels||{}),BIG_END_SCREEN:'BIG終了画面'};
 // Validation-only metadata: binomial engine ignores categorySubtractInputIds for this feature, while app uses it to surface child>parent alert.
 const sc=s.features.find(x=>x.researchFeatureId==='RF_SC_LV12'); if(sc) sc.categorySubtractInputIds={INP_SC:['INP_SC_LV12']};
 write(rp,r); write(sp,s);
}

// Fire Force: 炎炎激闘初当り、2種終了画面、Adora JACキャラ、REGシナリオ。
{
 const id='L_ENEN_NO_SHOUBOUTAI_JG', rp=`research/${id}/research-data.json`, sp=`research/${id}/selection-data.json`;
 const r=read(rp), s=read(sp); s.machineDataVersion='0.1.1';
 upsert(r.sources,'sourceId',{sourceId:'SRC_ENEN_CURRENT',publisher:'P-WORLD / HAZUSE',url:'https://www.p-world.co.jp/machine/database/10042',checkedAt:'2026-08-21',sourceType:'industry'});
 upsert(r.sources,'sourceId',{sourceId:'SRC_END_DETAIL',publisher:'なな徹',url:'https://nana-press.com/kaiseki/machine/738/21320/',checkedAt:'2026-08-21',sourceType:'major_analysis'});
 upsert(r.sources,'sourceId',{sourceId:'SRC_JAC_DETAIL',publisher:'なな徹',url:'https://nana-press.com/kaiseki/machine/738/21320/',checkedAt:'2026-08-21',sourceType:'major_analysis'});
 const direct=r.features.find(x=>x.researchFeatureId==='RF_ENEN_INITIAL'); if(direct){direct.name='炎炎激闘初当り';direct.factStatus='verified';direct.crossSourceStatus='resolved';direct.settingValues.SET_6={probability:1/537,rawDisplay:'1/537',numerator:1,denominator:537};direct.sourceRefs=['SRC_ENEN_CURRENT'];direct.notes='現行P-WORLD・HAZUSE・一撃の1/537を採用。旧解析の1/573はResearch conflictとして履歴を残す。灰焔騎士団は集計対象外。';}
 const c=(r.conflicts||[]).find(x=>x.conflictId==='CONFLICT_ENEN6'); if(c){c.resolutionStatus='resolved';c.resolutionNote='2026-08-21再検証で現行P-WORLD・HAZUSE・一撃が1/537で一致したため1/537を採用。旧1/573表記は履歴として保持。';}
 const ffEnd={SET_1:{DEFAULT:.77,FRONT:.20,LEFT:.03,GROUP:0,RED:0,GOLD:0},SET_2:{DEFAULT:.73,FRONT:.22,LEFT:.05,GROUP:0,RED:0,GOLD:0},SET_4:{DEFAULT:.64,FRONT:.25,LEFT:.06,GROUP:.05,RED:0,GOLD:0},SET_5:{DEFAULT:.61,FRONT:.27,LEFT:.07,GROUP:.03,RED:.02,GOLD:0},SET_6:{DEFAULT:.57,FRONT:.30,LEFT:.09,GROUP:.03,RED:0,GOLD:.01}};
 const regEnd={SET_1:{DEFAULT:.86,FRONT:.11,LEFT:.03,GROUP:0,RED:0,GOLD:0},SET_2:{DEFAULT:.83,FRONT:.13,LEFT:.04,GROUP:0,RED:0,GOLD:0},SET_4:{DEFAULT:.78,FRONT:.14,LEFT:.05,GROUP:.03,RED:0,GOLD:0},SET_5:{DEFAULT:.75,FRONT:.16,LEFT:.06,GROUP:.02,RED:.01,GOLD:0},SET_6:{DEFAULT:.73,FRONT:.17,LEFT:.06,GROUP:.02,RED:.01,GOLD:.01}};
 upsert(r.features,'researchFeatureId',{researchFeatureId:'RF_FF_BONUS_END',name:'炎炎ボーナス終了画面',factStatus:'verified',candidateModel:'multinomial',trialUnit:'炎炎ボーナス終了1回',numeratorDefinition:'終了画面別回数',denominatorDefinition:'炎炎ボーナス終了画面確認回数',settingValues:{},sourceRefs:['SRC_END_DETAIL'],crossSourceStatus:'single_source',categories:['DEFAULT','FRONT','LEFT','GROUP','RED','GOLD'],distributionMode:'complete',settingDistributions:ffEnd});
 upsert(r.features,'researchFeatureId',{researchFeatureId:'RF_REG_END',name:'REG終了画面',factStatus:'verified',candidateModel:'multinomial',trialUnit:'REG終了1回',numeratorDefinition:'終了画面別回数',denominatorDefinition:'REG終了画面確認回数',settingValues:{},sourceRefs:['SRC_END_DETAIL'],crossSourceStatus:'single_source',categories:['DEFAULT','FRONT','LEFT','GROUP','RED','GOLD'],distributionMode:'complete',settingDistributions:regEnd});
 const jacRaw={SET_1:{SHINRA:13,ARTHUR:13,HINAWA:13,MAKI:30,TAMAKI:30,OUBI:0,JOKER:1,BENIMARU:0,IRIS:0},SET_2:{SHINRA:19,ARTHUR:19,HINAWA:19,MAKI:20,TAMAKI:20,OUBI:3,JOKER:0,BENIMARU:0,IRIS:0},SET_4:{SHINRA:13,ARTHUR:13,HINAWA:12,MAKI:29,TAMAKI:29,OUBI:2,JOKER:1,BENIMARU:1,IRIS:0},SET_5:{SHINRA:19,ARTHUR:19,HINAWA:19,MAKI:19,TAMAKI:19,OUBI:3,JOKER:0,BENIMARU:1,IRIS:1},SET_6:{SHINRA:12,ARTHUR:12,HINAWA:13,MAKI:29,TAMAKI:29,OUBI:2,JOKER:1,BENIMARU:1,IRIS:1}};
 const jac=Object.fromEntries(Object.entries(jacRaw).map(([k,v])=>[k,norm(v)]));
 upsert(r.features,'researchFeatureId',{researchFeatureId:'RF_ADORA_JAC_CHAR',name:'アドラバースト中 炎炎JAC開始キャラ',factStatus:'verified',candidateModel:'multinomial',trialUnit:'炎炎JAC開始1回',numeratorDefinition:'開始キャラ別回数',denominatorDefinition:'炎炎JAC開始キャラ確認回数',settingValues:{},sourceRefs:['SRC_JAC_DETAIL'],crossSourceStatus:'single_source',categories:Object.keys(jac.SET_1),distributionMode:'complete',settingDistributions:jac,notes:'アドラバースト自体は低頻度だが、突入後はJACごとに試行を得られる。'});
 const scen={SET_1:{E8_1:44,IRIS_2:13,IRIS_3:9,IRIS_4:2,DENDO_1:12,E8_2:20,IRIS_1:0,E8_3:0,CAPTAIN:0,DENDO_2:0,IRIS_5:0},SET_2:{E8_1:42,IRIS_2:0,IRIS_3:10,IRIS_4:6,DENDO_1:20,E8_2:12,IRIS_1:10,E8_3:0,CAPTAIN:0,DENDO_2:0,IRIS_5:0},SET_4:{E8_1:40,IRIS_2:12,IRIS_3:0,IRIS_4:6,DENDO_1:12,E8_2:20,IRIS_1:8,E8_3:1,CAPTAIN:1,DENDO_2:0,IRIS_5:0},SET_5:{E8_1:31,IRIS_2:5,IRIS_3:12,IRIS_4:0,DENDO_1:25,E8_2:15,IRIS_1:9,E8_3:1,CAPTAIN:1,DENDO_2:1,IRIS_5:0},SET_6:{E8_1:28,IRIS_2:8,IRIS_3:4,IRIS_4:9,DENDO_1:15,E8_2:25,IRIS_1:7,E8_3:1,CAPTAIN:1,DENDO_2:1,IRIS_5:1}};
 const scenN=Object.fromEntries(Object.entries(scen).map(([k,v])=>[k,norm(v)]));
 upsert(r.features,'researchFeatureId',{researchFeatureId:'RF_REG_SCENARIO',name:'REG中キャラ紹介シナリオ',factStatus:'verified',candidateModel:'multinomial',trialUnit:'REGキャラ紹介1シナリオ',numeratorDefinition:'シナリオ別回数',denominatorDefinition:'REGキャラ紹介確認回数',settingValues:{},sourceRefs:['SRC_END_DETAIL'],crossSourceStatus:'single_source',categories:Object.keys(scenN.SET_1),distributionMode:'complete',settingDistributions:scenN});
 // Replace former EPB input/feature with direct 炎炎激闘 initial count.
 remove(s.inputs,'id','INP_EPB'); remove(s.features,'researchFeatureId','RF_EPB_AFTER_INITIAL');
 upsert(s.inputs,'id',input('INP_ENEN_INITIAL','炎炎激闘初当り','counter','ENEN_INITIAL',12,null,'灰焔騎士団は含まないでください。'));
 upsert(s.features,'researchFeatureId',{researchFeatureId:'RF_ENEN_INITIAL',featureId:'FEAT_ENEN_INITIAL',adoptionCategory:'INCLUDE_SUPPORT',numeratorInputId:'INP_ENEN_INITIAL',denominatorInputId:'INP_NORMAL_GAMES',minimumSample:1,sampleRecommendation:7000,weight:.7,displayFormat:'ratio_1_over_n',difficultyExposure:{mode:'per_game',factor:1,quality:'EXACT',basisId:'NORMAL_GAMES'},difficultyParticipation:'INCLUDE',userReason:'灰焔騎士団を除いた炎炎激闘初当りには大きな設定差が確認できるため補助採用。'});
 const addMulti=(rf,ff,cat,totalId,prefix,labels,residual,reason,order)=>{upsert(s.inputs,'id',input(totalId,`${labels.title}確認回数`,'integer',cat,order)); const ids=[]; for(let i=0;i<labels.items.length-1;i++){const [code,label]=labels.items[i];const iid=`${prefix}_${code}`;ids.push(iid);upsert(s.inputs,'id',input(iid,label,'counter',cat,order+i+1,totalId));} upsert(s.features,'researchFeatureId',selectionFeature(rf,ff,totalId,ids[0],ids.slice(1),residual,reason));};
 const endLabels={title:'炎炎ボーナス終了画面',items:[['FRONT','正面'],['LEFT','左向き'],['GROUP','全員集合'],['RED','赤枠9人'],['GOLD','金枠'],['DEFAULT','デフォルト']]};
 addMulti('RF_FF_BONUS_END','FEAT_FF_BONUS_END','FF_END','INP_FF_END_TOTAL','INP_FF_END',endLabels,'DEFAULT','炎炎ボーナス終了画面の設定別振り分けが公開され、示唆パターンの割合に設定差があるため採用。',30);
 const regLabels={title:'REG終了画面',items:[['FRONT','正面'],['LEFT','左向き'],['GROUP','全員集合'],['RED','赤枠9人'],['GOLD','金枠'],['DEFAULT','デフォルト']]};
 addMulti('RF_REG_END','FEAT_REG_END','REG_END','INP_REG_END_TOTAL','INP_REG_END',regLabels,'DEFAULT','REG終了画面にも独立した設定別振り分けが公開されているため採用。',40);
 const jacItems=[['SHINRA','シンラ'],['ARTHUR','アーサー'],['HINAWA','ヒナワ'],['MAKI','マキ'],['TAMAKI','タマキ'],['OUBI','オウビ'],['JOKER','ジョーカー'],['BENIMARU','紅丸'],['IRIS','アイリス']];
 upsert(s.inputs,'id',input('INP_ADORA_JAC_TOTAL','炎炎JAC開始キャラ確認回数','integer','ADORA_JAC',50,null,'アドラバースト突入時のみ入力してください。JAC開始ごとに1回集計します。'));
 const jacIds=[]; jacItems.forEach(([c,l],i)=>{const iid=`INP_ADORA_JAC_${c}`;jacIds.push(iid);upsert(s.inputs,'id',input(iid,l,'counter','ADORA_JAC',51+i,'INP_ADORA_JAC_TOTAL'));});
 upsert(s.features,'researchFeatureId',selectionFeature('RF_ADORA_JAC_CHAR','FEAT_ADORA_JAC_CHAR','INP_ADORA_JAC_TOTAL',jacIds[0],jacIds.slice(1),null,'アドラバースト自体は低頻度ですが、突入後はJACごとに複数サンプルを得られ、キャラ分布に設定差があるため採用。'));
 const scItems=[['E8_1','第8①'],['IRIS_2','アイリス②'],['IRIS_3','アイリス③'],['IRIS_4','アイリス④'],['DENDO_1','伝導者①'],['E8_2','第8②'],['IRIS_1','アイリス①'],['E8_3','第8③'],['CAPTAIN','大隊長'],['DENDO_2','伝導者②'],['IRIS_5','アイリス⑤']];
 upsert(s.inputs,'id',input('INP_REG_SCENARIO_TOTAL','REGキャラ紹介確認回数','integer','REG_SCENARIO',70)); const scIds=[]; scItems.forEach(([c,l],i)=>{const iid=`INP_REG_SCENARIO_${c}`;scIds.push(iid);upsert(s.inputs,'id',input(iid,l,'counter','REG_SCENARIO',71+i,'INP_REG_SCENARIO_TOTAL'));});
 upsert(s.features,'researchFeatureId',selectionFeature('RF_REG_SCENARIO','FEAT_REG_SCENARIO','INP_REG_SCENARIO_TOTAL',scIds[0],scIds.slice(1),null,'REG中キャラ紹介は否定・高設定確定パターンを含む設定別シナリオ分布が公開されているため採用。'));
 s.uiCategoryLabels={...(s.uiCategoryLabels||{}),ENEN_INITIAL:'炎炎激闘初当り',FF_END:'炎炎ボーナス終了画面',REG_END:'REG終了画面',ADORA_JAC:'アドラバースト中 炎炎JAC開始キャラ',REG_SCENARIO:'REG中キャラ紹介シナリオ'};
 s.uiSectionOptions={...(s.uiSectionOptions||{}),ADORA_JAC:{collapsible:true,defaultExpanded:false,description:'アドラバースト突入時のみ使用します。低頻度のため通常は閉じています。'}};
 write(rp,r); write(sp,s);
}

// Kabaneri: ST終了画面を採用、無名CZ3連をcounter化、連動機能は具体項目未確認として推奨範囲を限定。
{
 const id='S_KABANERI_ZR', rp=`research/${id}/research-data.json`, sp=`research/${id}/selection-data.json`; const r=read(rp),s=read(sp);s.machineDataVersion='0.1.1';
 upsert(r.sources,'sourceId',{sourceId:'SRC_ST_END',publisher:'なな徹 / HAZUSE',url:'https://nana-press.com/kaiseki/machine/384/10347/',checkedAt:'2026-08-21',sourceType:'major_analysis'});
 upsert(r.features,'researchFeatureId',{researchFeatureId:'RF_ST_END_SCREEN',name:'ST終了画面',factStatus:'verified',candidateModel:'binomial',trialUnit:'ST終了画面1回',numeratorDefinition:'高設定示唆（菖蒲）画面回数',denominatorDefinition:'ST終了画面確認回数',settingValues:{SET_1:{probability:.012,rawDisplay:'1.2%'},SET_2:{probability:.018,rawDisplay:'1.8%'},SET_3:{probability:.018,rawDisplay:'1.8%'},SET_4:{probability:.046,rawDisplay:'4.6%'},SET_5:{probability:.053,rawDisplay:'5.3%'},SET_6:{probability:.061,rawDisplay:'6.1%'}},sourceRefs:['SRC_ST_END'],crossSourceStatus:'matched',notes:'駆け抜け時除外の条件は公開解析で裏付けを確認できなかったため、公開値上はST終了画面全体として扱う。'});
 const trial=s.inputs.find(x=>x.id==='INP_MUMEI_3_TRIALS'); if(trial) trial.type='counter';
 upsert(s.inputs,'id',input('INP_ST_END_TOTAL','ST終了画面確認回数','integer','ST_END',30,null,'ST終了時に確認した画面を集計します。公開解析では駆け抜け時除外の条件を確認できていないため、現時点では全ST終了画面を対象とします。'));
 upsert(s.inputs,'id',input('INP_ST_END_HIGH','高設定示唆（菖蒲）','counter','ST_END',31,'INP_ST_END_TOTAL'));
 upsert(s.features,'researchFeatureId',{researchFeatureId:'RF_ST_END_SCREEN',featureId:'FEAT_ST_END_SCREEN',adoptionCategory:'INCLUDE_SUPPORT',numeratorInputId:'INP_ST_END_HIGH',denominatorInputId:'INP_ST_END_TOTAL',minimumSample:1,sampleRecommendation:20,weight:1,displayFormat:'percent',difficultyParticipation:'EXCLUDE',difficultyExclusionReason:'通常GからST終了画面の試行数を一意換算できないため。',userReason:'ST終了画面の高設定示唆選択率は設定1の1.2%から設定6の6.1%まで差があり、条件付き情報として採用。'});
 // parent count alert metadata; binomial calculation ignores categorySubtractInputIds.
 const m=s.features.find(x=>x.researchFeatureId==='RF_MUMEI_3CHAIN'); if(m) m.categorySubtractInputIds={INP_MUMEI_3_TRIALS:['INP_MUMEI_3_HIT']};
 s.uiCategoryLabels={...(s.uiCategoryLabels||{}),ST_END:'ST終了画面'};
 // linked feature evidence remains unresolved for concrete old-Kabaneri counters; do not invent fields.
 if(r.linkedMachineServiceResearch){r.linkedMachineServiceResearch.notes='実機連動機能の存在は確認。旧カバネリでMachineDataに必要な通常G・CZ・共通6枚ベル・無名CZ3連の具体的取得可否は公開根拠を十分確認できず、実機確認候補。ユーザー向けでは固有サービス名を使用しない。';}
 write(rp,r);write(sp,s);
}

// Hard Boiled: BIG中のJAC INハズシ成功時ボイス分布を採用。
{
 const id='S_HARD_BOILED_XX',rp=`research/${id}/research-data.json`,sp=`research/${id}/selection-data.json`;const r=read(rp),s=read(sp);s.machineDataVersion='0.1.1';
 upsert(r.sources,'sourceId',{sourceId:'SRC_JAC_VOICE',publisher:'HAZUSE',url:'https://hazuse.com/machine/pachislot/2S0155/',checkedAt:'2026-08-21',sourceType:'major_analysis'});
 const raw={SET_1:{NONE:68.49,GOOD:25,GREAT:6.25,MARVELOUS:0,EXCELLENT:.02,UNBELIEVABLE:.002},SET_2:{NONE:64.94,GOOD:26,GREAT:8.33,MARVELOUS:.78,EXCELLENT:.02,UNBELIEVABLE:.002},SET_3:{NONE:66.67,GOOD:27,GREAT:6.25,MARVELOUS:.10,EXCELLENT:.02,UNBELIEVABLE:.002},SET_4:{NONE:62.11,GOOD:28,GREAT:8.33,MARVELOUS:.78,EXCELLENT:.78,UNBELIEVABLE:.78},SET_5:{NONE:63.29,GOOD:29,GREAT:6.25,MARVELOUS:.10,EXCELLENT:.78,UNBELIEVABLE:.78},SET_6:{NONE:59.52,GOOD:30,GREAT:8.33,MARVELOUS:.78,EXCELLENT:.78,UNBELIEVABLE:.78}};
 const dist=Object.fromEntries(Object.entries(raw).map(([k,v])=>[k,norm(v)]));
 upsert(r.features,'researchFeatureId',{researchFeatureId:'RF_BIG_JAC_MISS_VOICE',name:'通常時BIG JAC INハズシ成功時ボイス',factStatus:'verified',candidateModel:'multinomial',trialUnit:'逆押しJAC INハズシ成功1回',numeratorDefinition:'ボイス別回数',denominatorDefinition:'逆押しJAC INハズシ成功回数',settingValues:{},sourceRefs:['SRC_JAC_VOICE'],crossSourceStatus:'single_source',categories:Object.keys(dist.SET_1),distributionMode:'complete',settingDistributions:dist,notes:'MARVELOUSは設定2以上かつ偶数寄り。他ボイスも設定別分布を持つため全体をMultinomial評価。'});
 upsert(s.inputs,'id',input('INP_JAC_VOICE_TOTAL','JAC INハズシ成功回数','integer','JAC_VOICE',30,null,'通常時BIG中、逆押しJAC INハズシに成功した回だけ集計してください。'));
 const items=[['GOOD','GOOD'],['GREAT','GREAT'],['MARVELOUS','MARVELOUS'],['EXCELLENT','EXCELLENT'],['UNBELIEVABLE','UNBELIEVABLE']]; const ids=[];items.forEach(([c,l],i)=>{const iid=`INP_JAC_VOICE_${c}`;ids.push(iid);upsert(s.inputs,'id',input(iid,l,'counter','JAC_VOICE',31+i,'INP_JAC_VOICE_TOTAL'));});
 upsert(s.features,'researchFeatureId',selectionFeature('RF_BIG_JAC_MISS_VOICE','FEAT_BIG_JAC_MISS_VOICE','INP_JAC_VOICE_TOTAL',ids[0],ids.slice(1),'NONE','JAC INハズシ成功時のボイスはMARVELOUSだけでなく他セリフにも設定別振り分けがあるため、全体分布として採用。'));
 s.uiCategoryLabels={...(s.uiCategoryLabels||{}),JAC_VOICE:'BIG中 JAC INハズシ時ボイス'};
 write(rp,r);write(sp,s);
}

// Hyper Rush: 着席時データは評価済みだが、公開解析の通常G分母と空き台の総Gが一致しないため計算不採用。
{
 const id='S_HYPER_RUSH_SLC8',rp=`research/${id}/research-data.json`,sp=`research/${id}/selection-data.json`;const r=read(rp),s=read(sp);s.machineDataVersion='0.1.1';
 upsert(r.sources,'sourceId',{sourceId:'SRC_PRESEAT_TOOL',publisher:'セブンノア',url:'https://seven.noor.jp/judge?s=hyper_rush',checkedAt:'2026-08-21',sourceType:'community_tool'});
 s.rejectedElements=s.rejectedElements||[]; upsert(s.rejectedElements,'id',{id:'REJECTED_PREDECESSOR_DATA',name:'着席時BIG・REGデータ',reason:'開始前の総ゲーム数・BIG・REGを取得できることは確認しましたが、公開解析のBIG/REG確率は通常ゲーム数基準で、空き台の総ゲーム数から前任者の通常ゲーム数を一意に復元できないため推測計算には使用しません。'});
 if(r.linkedMachineServiceResearch){r.linkedMachineServiceResearch.notes='総ゲーム数・通常ゲーム数・BIG/REG等を取得可能。ユーザー向けでは「実機連動機能」と表記する。開始前の空き台累積値と自分の連動セッション値は区別が必要。';}
 write(rp,r);write(sp,s);
}

console.log('re-verification source updates applied');
