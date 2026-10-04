import fs from 'node:fs';
import path from 'node:path';

const batchId='batch-20261004-005';
const root=process.cwd();

const read=(p:string)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const write=(p:string,v:any)=>{const f=path.join(root,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,JSON.stringify(v,null,2)+'\n','utf8')};
const claim=(doc:any,sourceId:string)=>String(doc.sources.find((x:any)=>x.sourceId===sourceId)?.claims?.[0]??'');

function addSource(doc:any,source:any){
 const i=doc.sources.findIndex((x:any)=>x.sourceId===source.sourceId);
 if(i>=0)doc.sources[i]=source;else doc.sources.push(source);
}
function addSourceClaim(doc:any,sourceId:string,text:string){
 const src=doc.sources.find((x:any)=>x.sourceId===sourceId);if(!src)throw new Error('SOURCE_NOT_FOUND:'+sourceId);
 src.claims=Array.isArray(src.claims)?src.claims:[];
 if(!src.claims.includes(text))src.claims.push(text);
}
function addFinding(doc:any,finding:any){
 const i=doc.findings.findIndex((x:any)=>x.findingId===finding.findingId);
 if(i>=0)doc.findings[i]=finding;else doc.findings.push(finding);
}
function removeBlock(doc:any,blockId:string){
 doc.blockedItems=doc.blockedItems.filter((x:any)=>x.blockId!==blockId);
 doc.researchCompleteness.candidateLedger=doc.researchCompleteness.candidateLedger.filter((x:any)=>x.disposition?.refId!==blockId);
}
function addLedgerFinding(doc:any,findingId:string,label:string,sourceId:string,sourceClaim:string){
 const row={candidateId:'finding:'+findingId,label,sourceClaims:[{sourceId,claim:sourceClaim}],discoveryQueries:[],disposition:{type:'FINDING',refId:findingId}};
 const i=doc.researchCompleteness.candidateLedger.findIndex((x:any)=>x.candidateId===row.candidateId);
 if(i>=0)doc.researchCompleteness.candidateLedger[i]=row;else doc.researchCompleteness.candidateLedger.push(row);
}
function sanitizeBlocked(doc:any){
 for(const b of doc.blockedItems??[]){
  b.reason=String(b.reason??'')
   .replace(/数値入力Contract/gi,'現在の入力方法')
   .replace(/UI\s*Contract/gi,'入力方法')
   .replace(/joint\s*categorical/gi,'複数カテゴリを同時に扱う方法')
   .replace(/joint/gi,'複数要素の同時評価')
   .replace(/categorical/gi,'カテゴリ別');
  b.reevaluationCondition=String(b.reevaluationCondition??'')
   .replace(/UI契約/g,'観測方法')
   .replace(/UI\s*Contract/gi,'観測方法')
   .replace(/joint\s*categorical/gi,'複数カテゴリを同時に扱う方法')
   .replace(/joint/gi,'複数要素の同時評価')
   .replace(/categorical/gi,'カテゴリ別');
 }
}
function base(machineId:string){
 const d=read('batches/'+batchId+'/artifacts/'+machineId+'/research/result.json');
 delete d.workId;
 return d;
}
function emit(wave:string,doc:any){
 sanitizeBlocked(doc);
 write('batches/'+batchId+'/research-drafts/'+wave+'/'+doc.machineId+'.json',doc);
}

// 1) Railgun 2
{
 const d=base('L_TOARU_KAGAKU_NO_RAILGUN_2_FV');
 const src='nana-railgun2-setting';
 const extraClaim='上位CZ実質出現率・AT開始時ステージ選択率の設定差を確認';
 addSourceClaim(d,src,extraClaim);
 addFinding(d,{
  findingId:'railgun-upper-cz-share',
  label:'CZ当選時の上位CZ割合',
  observationType:'conditional_probability',
  trialUniverse:'RAILGUN_CZ_OCCURRENCE_TRIAL',
  denominatorSemantics:'CZ当選回数に対する上位CZ回数。GIRLS JUDGEと上位CZを区別して記録する。',
  liveObservation:{status:'DIRECT_EXACT',reason:'CZ突入時にGIRLS JUDGEか上位CZかを区別でき、CZ総回数と上位CZ回数を直接記録できる。'},
  settingDistribution:{
   '1':0.0235710511,'2':0.0286505841,'3':0.0284395943,'4':0.0406397068,'5':0.0509277219,'6':0.0531609751
  },
  details:['公開されているCZ合算実質出現率と上位CZ実質出現率から、CZ当選時に上位CZだった割合を算出した値です。CZ合算とは条件付きに分けて扱うため、同じ当選を二重に数えません。'],
  sourceIds:[src],
  sourceDerivedFormula:'P(upperCZ | anyCZ) = upperCZ rate / totalCZ rate'
 });
 addLedgerFinding(d,'railgun-upper-cz-share','CZ当選時の上位CZ割合',src,extraClaim);

 removeBlock(d,'railgun-at-start-stage');
 addFinding(d,{
  findingId:'railgun-at-start-stage',
  label:'AT開始時のステージ',
  observationType:'appearance_distribution',
  trialUniverse:'RAILGUN_AT_START_BASE_SELECTION_TRIAL',
  denominatorSemantics:'AT開始時の基本ステージ抽選回数。GIRLS JUDGEの7揃い経由など、ステージ昇格が別途発生する開始契機は対象に含めません。',
  liveObservation:{status:'EXACT_WITH_SCOPE_TRACKING',reason:'AT開始時のステージを毎回確認でき、別途ステージ昇格が発生する開始契機を区別して除外できる。'},
  settingDistribution:{
   '1':'駆動鎧 34.77% / ドッペルゲンガー 64.06% / BUNNY DANCE 1.17%',
   '2':'駆動鎧 34.38% / ドッペルゲンガー 64.45% / BUNNY DANCE 1.17%',
   '3':'駆動鎧 33.20% / ドッペルゲンガー 64.84% / BUNNY DANCE 1.95%',
   '4':'駆動鎧 31.64% / ドッペルゲンガー 66.02% / BUNNY DANCE 2.34%',
   '5':'駆動鎧 30.86% / ドッペルゲンガー 66.41% / BUNNY DANCE 2.73%',
   '6':'駆動鎧 30.08% / ドッペルゲンガー 66.80% / BUNNY DANCE 3.13%'
  },
  categoryModel:{residualPolicy:'SOURCE_EXHAUSTIVE'},
  details:['3種類のステージを排他的なカテゴリとしてまとめて比較します。'],
  sourceIds:[src]
 });
 addLedgerFinding(d,'railgun-at-start-stage','AT開始時のステージ',src,extraClaim);
 emit('wave-2',d);
}

// 2) Zettai Shogeki IV
{
 const d=base('L_ZETTAI_SHOGEKI_FORCE_FH');
 const src='nana-zettaishogeki4-direct';
 const sourceClaim='通常時と日曜日について成立役別のボーナス直撃当選率を設定1～6で確認';
 addSource(d,{sourceId:src,url:'https://nana-press.com/kaiseki/machine/1043/33200/',title:'スマスロ絶対衝激4 ボーナス直撃抽選',sourceType:'primary_analysis',claims:[sourceClaim]});
 const rows=[
  ['direct-normal-weak-cherry','通常時 弱チェリーからボーナス直撃','ZETTAI_NORMAL_WEAK_CHERRY_TRIAL','弱チェリー成立回数',[0,0,0,0.002,0.002,0.003]],
  ['direct-normal-weak-watermelon','通常時 弱スイカからボーナス直撃','ZETTAI_NORMAL_WEAK_WATERMELON_TRIAL','弱スイカ成立回数',[0,0,0.0005,0.0005,0.0008,0.002]],
  ['direct-normal-chance','通常時 チャンス目からボーナス直撃','ZETTAI_NORMAL_CHANCE_TRIAL','チャンス目・倫役2個成立回数',[0.004,0.006,0.006,0.006,0.008,0.012]],
  ['direct-normal-strong-cherry','通常時 強チェリーからボーナス直撃','ZETTAI_NORMAL_STRONG_CHERRY_TRIAL','強チェリー成立回数',[0,0.016,0.02,0.02,0.02,0.027]],
  ['direct-normal-strong-watermelon','通常時 強スイカからボーナス直撃','ZETTAI_NORMAL_STRONG_WATERMELON_TRIAL','強スイカ成立回数',[0.008,0.012,0.016,0.016,0.02,0.031]],
  ['direct-normal-strong-bell','通常時 強ベルからボーナス直撃','ZETTAI_NORMAL_STRONG_BELL_TRIAL','強ベル・倫役3個成立回数',[0.25,0.25,0.273,0.273,0.313,0.336]],
  ['direct-sunday-weak-cherry','日曜日 弱チェリーからボーナス直撃','ZETTAI_SUNDAY_WEAK_CHERRY_TRIAL','日曜日中の弱チェリー成立回数',[0,0.004,0.004,0.008,0.012,0.016]],
  ['direct-sunday-chance','日曜日 チャンス目からボーナス直撃','ZETTAI_SUNDAY_CHANCE_TRIAL','日曜日中のチャンス目・倫役2個成立回数',[0.016,0.016,0.016,0.039,0.063,0.125]],
  ['direct-sunday-strong-cherry','日曜日 強チェリーからボーナス直撃','ZETTAI_SUNDAY_STRONG_CHERRY_TRIAL','日曜日中の強チェリー成立回数',[0.063,0.078,0.078,0.125,0.156,0.25]],
  ['direct-sunday-strong-watermelon','日曜日 強スイカからボーナス直撃','ZETTAI_SUNDAY_STRONG_WATERMELON_TRIAL','日曜日中の強スイカ成立回数',[0.313,0.313,0.336,0.469,0.5,0.551]]
 ] as const;
 for(const [id,label,trial,trialLabel,ps] of rows){
  const sunday=id.includes('-sunday-');
  addFinding(d,{
   findingId:id,label,observationType:'conditional_probability',trialUniverse:trial,
   denominatorSemantics:trialLabel+'に対するボーナス直撃回数。'+(sunday?'日曜日中だけを対象にします。':'日曜日とスマホレベルMAX中は対象に含めません。'),
   liveObservation:{status:'EXACT_WITH_SCOPE_TRACKING',reason:trialLabel+'と、その成立を契機にボーナスへ直撃した回数を区別して記録できる。'},
   settingDistribution:Object.fromEntries(ps.map((p:number,i:number)=>[String(i+1),p])),
   details:[sunday?'日曜日中の成立役別直撃抽選です。':'通常時のうち、日曜日・スマホレベルMAX以外での成立役別直撃抽選です。'],
   sourceIds:[src]
  });
  addLedgerFinding(d,id,label,src,sourceClaim);
 }
 const ev=d.findings.find((x:any)=>x.findingId==='zettaishogeki-direct-hints');
 if(ev){
  if(!ev.sourceIds.includes(src))ev.sourceIds.push(src);
  const links=new Map([
   ['通常時 強チェリーから直撃','direct-normal-strong-cherry'],
   ['通常時 弱スイカから直撃','direct-normal-weak-watermelon'],
   ['通常時 弱チェリーから直撃','direct-normal-weak-cherry'],
   ['日曜日 弱チェリーから直撃','direct-sunday-weak-cherry']
  ]);
  for(const cat of ev.semanticCategories??[]){const target=links.get(cat.label);if(target)cat.linkedFindingId=target;}
 }
 emit('wave-2',d);
}

// 3) Valvrave 2
{
 const d=base('L_KAKUMEIKI_VALVRAVE_2_JF');
 const src='nana-valvrave2-end-screen';
 const sourceClaim='終了画面カスタム未使用時のCZ・ボーナス終了画面8カテゴリの設定別出現割合を確認';
 const initial=d.findings.find((x:any)=>x.findingId==='initial-hit');
 if(initial){
  initial.denominatorSemantics='通常ゲーム数に対する初当たり合算回数。革命ボーナス・決戦ボーナス・AT/上位AT直撃を合算します。';
  initial.liveObservation={status:'DIRECT_EXACT',reason:'通常ゲーム数と、対象となる各初当たりの合算回数を記録できる。'};
 }
 addSource(d,{sourceId:src,url:'https://nana-press.com/kaiseki/machine/1040/32833/',title:'スマスロ 革命機ヴァルヴレイヴ2 CZ・ボーナス終了画面の設定示唆',sourceType:'primary_analysis',claims:[sourceClaim]});
 addFinding(d,{
  findingId:'cz-bonus-end-screen-distribution',
  label:'CZ・ボーナス終了画面',
  observationType:'appearance_distribution',
  trialUniverse:'VALVRAVE2_CZ_BONUS_END_SCREEN_CUSTOM_OFF_TRIAL',
  denominatorSemantics:'カスタム未使用時のCZ・ボーナス終了回数。終了画面カスタム使用中は対象に含めません。',
  liveObservation:{status:'EXACT_WITH_SCOPE_TRACKING',reason:'デモ画面でカスタム設定の有無を確認し、カスタム未使用時のCZ・ボーナス終了画面を種類別に記録できる。'},
  settingDistribution:{
   '1':'コックピット（白枠） 74% / ライゾウ達（青枠） 8% / サキ（青枠） 8% / コックピット（赤枠） 7% / ドルシア軍4人（赤枠） 3% / ショーコ＆サキ（紫枠） 0% / ピノ＆プルー（銀枠） 0% / 集合画面（金枠） 0%',
   '2':'コックピット（白枠） 65% / ライゾウ達（青枠） 5% / サキ（青枠） 10% / コックピット（赤枠） 7% / ドルシア軍4人（赤枠） 3% / ショーコ＆サキ（紫枠） 10% / ピノ＆プルー（銀枠） 0% / 集合画面（金枠） 0%',
   '4':'コックピット（白枠） 60% / ライゾウ達（青枠） 5% / サキ（青枠） 10% / コックピット（赤枠） 9% / ドルシア軍4人（赤枠） 6% / ショーコ＆サキ（紫枠） 8% / ピノ＆プルー（銀枠） 2% / 集合画面（金枠） 0%',
   '5':'コックピット（白枠） 60% / ライゾウ達（青枠） 10% / サキ（青枠） 5% / コックピット（赤枠） 9% / ドルシア軍4人（赤枠） 6% / ショーコ＆サキ（紫枠） 8% / ピノ＆プルー（銀枠） 2% / 集合画面（金枠） 0%',
   '6':'コックピット（白枠） 60% / ライゾウ達（青枠） 5% / サキ（青枠） 10% / コックピット（赤枠） 9% / ドルシア軍4人（赤枠） 6% / ショーコ＆サキ（紫枠） 7% / ピノ＆プルー（銀枠） 2% / 集合画面（金枠） 1%'
  },
  categoryModel:{residualPolicy:'SOURCE_EXHAUSTIVE'},
  details:['公開値は約値です。終了画面カスタム使用中は出現割合が変わるため数値推測には使用しません。'],
  sourceIds:[src]
 });
 addLedgerFinding(d,'cz-bonus-end-screen-distribution','CZ・ボーナス終了画面',src,sourceClaim);
 const old=d.findings.find((x:any)=>x.findingId==='valvrave2-hints');
 if(old){
  old.label='マギウスマーク・ラウンド開始画面';
  old.semanticCategories=(old.semanticCategories??[]).filter((x:any)=>!/[（(](?:青枠|赤枠|紫枠|銀枠|金枠)[）)]|^(?:青枠|赤枠|紫枠|銀枠|金枠)/.test(String(x.label??'')));
  old.details=['設定確定条件は設定候補の絞り込みに反映します。'];
 }
 addFinding(d,{
  findingId:'valvrave2-end-screen-exact',
  label:'CZ・ボーナス終了画面の設定確定パターン',
  observationType:'evidence',
  trialUniverse:'VALVRAVE2_CZ_BONUS_END_SCREEN_CUSTOM_OFF_TRIAL',
  denominatorSemantics:'終了画面カスタムを使用していないCZ・ボーナス終了画面。',
  details:['同じ終了画面入力から設定確定条件にも自動反映します。'],
  semanticCategories:[
   {label:'ショーコ＆サキ（紫枠）',meaning:'設定2以上',semanticType:'EXACT_CONSTRAINT',linkedFindingId:'cz-bonus-end-screen-distribution'},
   {label:'ピノ＆プルー（銀枠）',meaning:'設定4以上',semanticType:'EXACT_CONSTRAINT',linkedFindingId:'cz-bonus-end-screen-distribution'},
   {label:'集合画面（金枠）',meaning:'設定6',semanticType:'EXACT_CONSTRAINT',linkedFindingId:'cz-bonus-end-screen-distribution'}
  ],
  sourceIds:[src]
 });
 addLedgerFinding(d,'valvrave2-end-screen-exact','CZ・ボーナス終了画面の設定確定パターン',src,sourceClaim);
 emit('wave-2',d);
}

// 4) Azur Lane
{
 const d=base('L_AZURLANE_THE_ANIMATION_KN');
 const src='nana-azur-end-screen';
 const sourceClaim='海戦ボーナス・AT終了画面7カテゴリの設定別出現率を設定1～6で確認';
 addSource(d,{sourceId:src,url:'https://nana-press.com/kaiseki/machine/993/31213/',title:'アズールレーン ボーナス・AT終了画面の設定示唆',sourceType:'primary_analysis',claims:[sourceClaim]});
 addFinding(d,{
  findingId:'at-end-screen-distribution',
  label:'海戦ボーナス・AT終了画面',
  observationType:'appearance_distribution',
  trialUniverse:'AZUR_END_SCREEN_TRIAL',
  denominatorSemantics:'AT非当選時の海戦ボーナス終了回数とAT終了回数。終了画面ごとに1回ずつ記録する。',
  liveObservation:{status:'EXHAUSTIVE_CATEGORICAL',reason:'対象となる終了時に必ず1種類の終了画面を確認でき、7カテゴリへ排他的に記録できる。'},
  settingDistribution:{
   '1':'エンタープライズ 43.3% / ベルファスト 43.3% / エンタープライズ＆ベルファスト 12.5% / 赤城 1.0% / 全員集合 0% / 加賀＆赤城 0% / パーティ 0%',
   '2':'エンタープライズ 33.4% / ベルファスト 50.1% / エンタープライズ＆ベルファスト 12.5% / 赤城 1.0% / 全員集合 3.0% / 加賀＆赤城 0% / パーティ 0%',
   '3':'エンタープライズ 50.1% / ベルファスト 33.4% / エンタープライズ＆ベルファスト 12.5% / 赤城 1.0% / 全員集合 3.0% / 加賀＆赤城 0% / パーティ 0%',
   '4':'エンタープライズ 29.4% / ベルファスト 44.1% / エンタープライズ＆ベルファスト 20.0% / 赤城 3.2% / 全員集合 3.0% / 加賀＆赤城 0.2% / パーティ 0%',
   '5':'エンタープライズ 43.6% / ベルファスト 29.1% / エンタープライズ＆ベルファスト 20.6% / 赤城 3.5% / 全員集合 3.0% / 加賀＆赤城 0.2% / パーティ 0%',
   '6':'エンタープライズ 28.7% / ベルファスト 43.0% / エンタープライズ＆ベルファスト 21.3% / 赤城 3.6% / 全員集合 3.0% / 加賀＆赤城 0.3% / パーティ 0.1%'
  },
  categoryModel:{residualPolicy:'SOURCE_EXHAUSTIVE'},
  details:['デフォルト画面も含む全7カテゴリの分布として数値推測に使用します。'],
  sourceIds:[src]
 });
 addLedgerFinding(d,'at-end-screen-distribution','海戦ボーナス・AT終了画面',src,sourceClaim);
 const ev=d.findings.find((x:any)=>x.findingId==='at-end-screen');
 if(!ev)throw new Error('AZUR_END_EVIDENCE_MISSING');
 ev.trialUniverse='AZUR_END_SCREEN_TRIAL';
 ev.denominatorSemantics='AT非当選時の海戦ボーナス終了画面とAT終了画面。';
 ev.details=['同じ終了画面入力から設定確定条件にも自動反映します。'];
 ev.semanticCategories=[
  {label:'全員集合',meaning:'設定2以上',semanticType:'EXACT_CONSTRAINT',linkedFindingId:'at-end-screen-distribution'},
  {label:'加賀＆赤城',meaning:'設定4以上',semanticType:'EXACT_CONSTRAINT',linkedFindingId:'at-end-screen-distribution'},
  {label:'パーティ',meaning:'設定6',semanticType:'EXACT_CONSTRAINT',linkedFindingId:'at-end-screen-distribution'}
 ];
 if(!ev.sourceIds.includes(src))ev.sourceIds.push(src);
 emit('wave-1',d);
}

// 5) Tokyo Revengers
{
 const d=base('L_SMASLO_TOKYO_REVENGERS_ZF');
 const byId=new Map((d.findings??[]).map((x:any)=>[x.findingId,x]));
 const resetDependency=(f:any)=>{if(!f)return;delete f.dependencyGroupId;delete f.dependencyGroup;delete f.dependencyKind;delete f.dependencyReason;delete f.dependencyFallbackRank;delete f.dependencyReview};
 for(const id of ['initial-hit','at-first-hit','common-bell','middle-cherry','midnight-mode','kisaki-conspiracy','tooman-chance-weak-role-at'])resetDependency(byId.get(id));
 const sharedReason='同じ通常ゲーム数を分母に使いますが、同じ成功事象や当選経路を重ねて数える関係ではないため、別の設定差情報として扱います。';
 for(const id of ['common-bell','middle-cherry']){const f:any=byId.get(id);if(f)f.dependencyReview={status:'SHARED_DENOMINATOR',reason:sharedReason};}
 const pathGroup='tokyo-rush-path-overlap';
 const initial:any=byId.get('initial-hit'),at:any=byId.get('at-first-hit'),midnight:any=byId.get('midnight-mode'),kisaki:any=byId.get('kisaki-conspiracy'),chance:any=byId.get('tooman-chance-weak-role-at');
 if(initial){initial.dependencyGroupId=pathGroup;initial.dependencyKind='NESTED_OUTCOME';initial.dependencyReason='初当たり後に東卍RUSHへ直接入る場合や、東卍CHANCEから昇格する場合があり、東卍RUSH初当たりと同じ当選の流れを一部共有する。';initial.details=['初当りには設定差があります。ただし、初当り後に東卍RUSHへ直接入る場合や、東卍CHANCEから昇格する場合など、東卍RUSH初当りと同じ当選の流れを一部共有しています。両方を別々に計算すると同じ当たりを重ねて評価する可能性があるため、現在は設定判別力の高い「東卍RUSH初当り」を代表して使用しています。'];}
 if(at){at.dependencyGroupId=pathGroup;at.dependencyKind='NESTED_OUTCOME';at.dependencyReason='初当たり・CZ・東卍CHANCE中のAT当選など複数の経路から到達する最終的な東卍RUSH初当たりであり、経路側の数値とは同じ当選を一部共有する。';}
 for(const f of [midnight,kisaki,chance])if(f){f.dependencyGroupId=pathGroup;f.dependencyKind='CAUSAL_PATH_OVERLAP';f.dependencyReason='東卍RUSH初当たりへ至る途中経路の一部であり、東卍RUSH初当たりと別々に計算すると同じ当選を重ねて評価する可能性がある。';}
 if(midnight)midnight.details=['設定差はありますが、東卍RUSH初当りへ至る経路の一部なので、現在は東卍RUSH初当りと別々には計算しません。'];
 if(kisaki)kisaki.details=['設定差はありますが、東卍RUSH初当りへ至る経路の一部なので、現在は東卍RUSH初当りと別々には計算しません。'];
 if(chance)chance.details=['条件付きのAT当選率には設定差がありますが、成功した当選は東卍RUSH初当りの一部になるため、現在は東卍RUSH初当りと別々には計算しません。'];
 const middle:any=byId.get('middle-cherry');if(middle)middle.details=['設定差はありますが、7000G基準では出現機会が少なく、設定判別に使える情報量が基準未満です。'];
 const block=d.blockedItems.find((x:any)=>x.blockId==='tokyo-revenge-mixed');
 if(block)block.reevaluationCondition='各終了条件ごとに、試行回数と真のリベンジ発生を区別して安定して記録できる観測方法が確立すること。';
 emit('wave-1',d);
}

console.log(JSON.stringify({status:'PASS',batchId,patched:[
 'L_TOARU_KAGAKU_NO_RAILGUN_2_FV','L_ZETTAI_SHOGEKI_FORCE_FH','L_KAKUMEIKI_VALVRAVE_2_JF','L_AZURLANE_THE_ANIMATION_KN','L_SMASLO_TOKYO_REVENGERS_ZF'
]},null,2));
