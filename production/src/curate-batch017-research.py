"""Batch017 source-reviewed facts and terminal candidate routing. No invented exposure."""
import json,pathlib,hashlib
ROOT=pathlib.Path(__file__).resolve().parents[1];BATCH='batch-20261015-017';OUT=ROOT/'batches'/BATCH
SEL=json.loads((ROOT/'next-machine-selection-20261015.json').read_text())['selected']
IMPORT=OUT/'imported-handoff/extracted';DRAFTS=IMPORT/'SloAnalytica_Candidate_Contract_Drafts_Validated_20261016'
NUM=json.loads((IMPORT/'NUMERIC_MODEL_INPUTS_PRECHECK.json').read_text())
DOMAINS=['INITIAL_HIT','BONUS','SMALL_ROLE','CZ','AT','INTERNAL_CONDITIONAL_DRAW','MODE_TRANSITION','STATE_TRANSITION','SUCCESS_RATE','POINTS_GAME_DISTRIBUTION','CARRY_OVER','THRESHOLD_BEHAVIOR','RESET_BEHAVIOR','POST_EVENT_TRANSITION','NAVIGATION','ROLE_CONDITIONAL_DISTRIBUTION','BONUS_TYPE_CONDITIONAL','EVIDENCE','EXTERNAL_DATA_ONLY','MACHINE_SPECIFIC']
def ex(label,meaning):return dict(label=label,meaning=meaning,semanticType='EXACT_CONSTRAINT')
def hint(label,meaning='高設定示唆'):return dict(label=label,meaning=meaning,semanticType='PROBABILITY_UNKNOWN')
def disp(label,meaning='出現を記録。設定推測計算には使用しません。'):return dict(label=label,meaning=meaning,semanticType='DISPLAY_ONLY')
class Machine:
 def __init__(self,n,settings=(1,2,3,4,5,6)):
  self.n=n;self.sel=SEL[n-1];self.id=self.sel['machineId'];self.name=self.sel['displayName'];self.settings=settings
  self.old=json.loads((DRAFTS/f'machine_{n:02}.json').read_text());self.findings=[];self.blocks=[];self.rows=[];self.decisions={};self.claims=[]
  self.url=self.old['candidates'][0]['source_urls'][0];self.extraSources=[]
 def cid(self,no):return f'{self.n:02}-{no:03}' if isinstance(no,int) else no
 def trace(self,no,label,reason,route,ref=None):
  cid=self.cid(no);claim=label+'：'+reason
  if claim not in self.claims:self.claims.append(claim)
  self.rows.append(dict(candidateId=cid,label=label,sourceClaims=[dict(sourceId='main',claim=claim)],discoveryQueries=[],disposition=dict(type=route,**({'refId':ref} if ref else {'reason':reason}))))
 def numeric(self,no,label,values,scope,trial='NORMAL_GAME_TRIAL',unit='rate',group=None,rank=None,labels=None):
  cid=self.cid(no)
  if unit=='category':dist={str(k):'/'.join(c+':'+format(v,'.12g')+'%' for c,v in zip(labels,row)) for k,row in zip(self.settings,values)};ob='appearance_distribution'
  else:dist={str(k):('1/'+str(v) if unit=='rate' else v/100) for k,v in zip(self.settings,values)};ob='probability' if unit=='rate' else 'conditional_probability'
  f=dict(findingId=cid,label=label,settingDistribution=dist,observationType=ob,trialUniverse=trial,sourceIds=['main'],denominatorSemantics=scope,details=[scope],liveObservation=dict(status='EXACT_WITH_SCOPE_TRACKING',reason=scope))
  game='GAME_TRIAL' in trial
  f['inputPresentation']=dict(trialLabel='通常ゲーム数' if trial=='NORMAL_GAME_TRIAL' else '連チャンを除くゲーム数' if trial=='NON_CHAIN_BONUS_INITIAL_GAME_TRIAL' else '対象ゲーム数' if game else '対象回数',successLabel=label+'回数' if len(label)<24 else '該当回数')
  named={'BONUS_END_NON_RARE_TRIAL':('非レア役終了画面回数','チャレンジ当選回数'),'NORMAL_STRONG_CHERRY_TRIAL':('通常時強チェリー回数','AT直撃回数'),'RESET_SPECIAL_STATE_END_TRIAL':('特殊状態の終端当選回数','AT直撃回数'),'CZ_DEFEAT_WITHOUT_CEILING_TRIAL':('天井以外のCZ敗北回数','復活回数'),'WAF_CZ_TRIAL':('対象CZ突入回数','CZ成功回数'),'BIG_ADJUST_SUCCESS_TRIAL':('枚数調整成功回数','各魔法の回数'),'NON_CT_BONUS_END_TRIAL':('CT非当選終了回数','各キャラの回数'),'ENDING_BONUS_END_TRIAL':('ED中ボーナス終了回数','各枠の回数'),'BIG_END_TRIAL':('BIG終了回数','各画面の回数'),'CONFIRMED_CT3_MAIN_GAME_TRIAL':('レベル3メインCTゲーム数','ブラビを狙え回数'),'NON_SAGA_HIGH_NORMAL_GAME_TRIAL':('SAGA高確以外の通常ゲーム数','SAGA揃い回数')}
  if trial in named:f['inputPresentation']=dict(zip(('trialLabel','successLabel'),named[trial]))
  if labels:f['categoryModel']=dict(residualPolicy='SOURCE_EXHAUSTIVE')
  if group:f.update(dependencyGroupId=group,dependencyKind='CAUSAL_PATH_OVERLAP',dependencyReason='同じ当選経路やその内訳を含むため、同時に独立加算せず、観測できた優先項目を使用します。')
  if rank:f['dependencyFallbackRank']=rank
  self.findings.append(f);self.trace(no,label,scope,'FINDING',cid);self.decisions[cid]=dict(route='NUMERIC_EVALUATION',reason=scope,findingId=cid)
  return f
 def evidence(self,no,label,cats,scope):
  cid=self.cid(no);f=dict(findingId=cid,label=label,observationType='evidence',sourceIds=['main'],details=[scope],semanticCategories=cats);self.findings.append(f)
  self.trace(no,label,scope,'FINDING',cid);self.decisions[cid]=dict(route='EXACT_AND_RECORD' if any(c['semanticType']=='EXACT_CONSTRAINT' for c in cats) else 'RECORD_ONLY',reason=scope,findingId=cid)
  return f
 def block(self,no,reason,values=None):
  cid=self.cid(no);label=next((c['name'] for c in self.old['candidates'] if c['candidate_id']==cid),cid)
  b=dict(blockId=cid,label=label,reason=reason,reevaluationCondition='不足する設定別数値または対象条件を確認できる新しい具体的な公開資料が得られた場合のみ再確認します。',sourceIds=['main'])
  retained=values if values is not None else [x for x in NUM if x['machine']==self.name]
  b['retainedPublishedValues']=retained;self.blocks.append(b);self.trace(no,label,reason,'BLOCKED',cid);self.decisions[cid]=dict(route='EXCLUDE_RESEARCH_CLOSED',reason=reason,blockId=cid)
 def structural(self,no,route,reason):
  cid=self.cid(no);label=next(c['name'] for c in self.old['candidates'] if c['candidate_id']==cid)
  self.trace(no,label,reason,'NO_SETTING_DIFFERENCE');self.decisions[cid]=dict(route=route,reason=reason)
 def link(self,numeric,evid,cats,scope):
  f=next(f for f in self.findings if f['findingId']==self.cid(numeric));eid=self.cid(evid)
  f['mirrorsEvidenceFindingId']=eid;f['categoricalEvidenceReconciliation']=dict(type='SINGLE_CANONICAL_CATEGORY_INPUT',evidenceFindingId=eid,runtimeLinkContract='EXPLICIT_CATEGORY_LINK_V1')
  by={c['label']:c for c in cats}
  names=[v.split(':')[0] for v in next(iter(f['settingDistribution'].values())).split('/')]
  cats=[by.get(name,dict(label=name,meaning='設定別の公開出現率で評価',semanticType='PROBABILITY_BACKED')) for name in names]
  for c in cats:c['linkedFindingId']=f['findingId']
  return self.evidence(evid,f['label']+'の示唆',cats,scope+'同じ観測入力を出現率と設定の絞り込みに使用します。')
 def save(self):
  missing=[c['candidate_id'] for c in self.old['candidates'] if c['candidate_id'] not in self.decisions]
  assert not missing,(self.id,missing)
  sources=[dict(sourceId='main',url=self.url,title=self.name+' 設定別抽選・観測条件の公開解析',sourceType='published_analysis',checkedAt='2026-10-16',claims=self.claims,confidence='SOURCE_REVIEWED',independence='NOT_ASSERTED_SHARED_PUBLIC_ANALYSIS_POSSIBLE')]
  findingLabels='、'.join(f['label'] for f in self.findings);closedLabels='、'.join(b['label'] for b in self.blocks)
  notes={
   'INITIAL_HIT':'初当たりは通常ゲーム数で記録し、明確な引き戻し・連チャン内の当選を分離。',
   'BONUS':'ボーナスの当選・終了時の対象条件を確認。'+findingLabels,
   'SMALL_ROLE':'通常時小役・停止形の公開設定差を確認。'+findingLabels,
   'CZ':'CZ当選と内部状態を区別。'+closedLabels,
   'AT':'AT中の当選を通常時の初当たりと重複集計しない。',
   'INTERNAL_CONDITIONAL_DRAW':'内部状態を表示だけで確定できない抽選は分布を保持して不採用。'+closedLabels,
   'MODE_TRANSITION':'モード別抽選と外見の示唆を区別。'+closedLabels,
   'STATE_TRANSITION':'状態の移行を初当たり率へ重複加算しない。'+closedLabels,
   'SUCCESS_RATE':'成功率は機会回数を母数とし、強制成功と通常抽選を区別。',
   'POINTS_GAME_DISTRIBUTION':'規定ゲーム数・到達回数の抽選と実ゲーム母数を区別。',
   'CARRY_OVER':'持越し・内部モードの情報を独立した設定差へ変換しない。',
   'THRESHOLD_BEHAVIOR':'天井や強制当選は通常の条件付き抽選と分離。',
   'RESET_BEHAVIOR':'朝イチ・設定変更と設定値を混同しない。',
   'POST_EVENT_TRANSITION':'終了後移行と終了画面は別事象。'+findingLabels,
   'NAVIGATION':'ナビ・押し順・技術介入の対象条件を確認。',
   'ROLE_CONDITIONAL_DISTRIBUTION':'成立役別抽選は条件母数が特定できるものだけ数値化。',
   'BONUS_TYPE_CONDITIONAL':'BIG・REG・AT中ボーナスの観測機会を混ぜない。',
   'EVIDENCE':'設定示唆は具体的カテゴリで記録。確率不明の示唆は重み付けしない。'+findingLabels,
   'EXTERNAL_DATA_ONLY':'実機連動データの未公表確率を補完しない。',
   'MACHINE_SPECIFIC':self.name+'の既存候補を全件追跡。'+closedLabels}
  d=dict(schemaVersion='research-v1',manifestVersion='8.5',batchId=BATCH,machineId=self.id,machineName=self.name,researchedAt='2026-10-16',researchStage='SOURCE_REVIEWED_PENDING_FORMAL_VALIDATION',settings=dict(status='SOURCE_DERIVED',values=['SET_'+str(k) for k in self.settings]),identity=self.sel,sources=sources,findings=self.findings,blockedItems=self.blocks,researchCompleteness=dict(version=2,domains=[dict(domain=k,status='CHECKED',note=v,sourceIds=['main']) for k,v in notes.items()],machineSpecificQueries=[self.name+' 設定差',self.name+' 観測条件',self.name+' 設定示唆'],candidateLedger=self.rows),selfAudit=dict(status='COMPLETE_BOUNDED_SOURCE_SURVEY',independentExternalAudit='NOT_PERFORMED',scope='列挙した公開解析の見出し・表・観測条件の限定照合。未確認資料の不存在を主張しません。'),inheritedCandidateDispositions=[dict(**c,finalDisposition=self.decisions[c['candidate_id']]) for c in self.old['candidates']],packageRevision=1)
  # Discovery queries describe actual within-page candidate/condition/hint review, not a search-exhaustiveness claim.
  for i,q in enumerate(d['researchCompleteness']['machineSpecificQueries']):self.rows[i%len(self.rows)]['discoveryQueries'].append(q)
  p=OUT/'research-drafts'/('wave-1' if self.n<=5 else 'wave-2')/(self.id+'.json');p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
  print(self.id,len(self.old['candidates']),len(self.findings),len(self.blocks))

normal='通常時のゲーム数を母数に、対象の初当たり回数を数えます。AT中と明確な引き戻し区間の当選は除き、引き戻し終了後の当選は初当たりに含めます。公表資料と実戦の集計条件が完全に一致するとまでは主張しません。'
role='通常時のゲーム数を母数に、停止形で確認した回数を数えます。ボーナス・AT中は含めません。'
m=Machine(1,(1,2,4,5,6));m.url='https://1geki.jp/slot/s_ryujin30/0/'
for no,label,vals in [(1,'BIG初当たり',[428.5,410.8,395.2,372.7,355.4]),(2,'REG初当たり',[505.6,499.4,485.2,470.5,460.7])]:
 f=m.numeric(no,label,vals,'総ゲーム数から連チャン区間とボーナス消化中の除外ゲーム数を引き、連チャン外の当選だけを数えます。天国など連チャン内の当選は含めません。公表集計との完全一致は主張しません。',trial='NON_CHAIN_BONUS_INITIAL_GAME_TRIAL',group='bonus-outcomes');f['dependencyReason']='同じゲームのBIGとREGは排他的な当選内訳です。単一のカテゴリ分布として扱います。'
m.structural(3,'DERIVED_DISPLAY','BIG・REGから合算を表示します。合算を別の独立した推測要素にはしません。')
m.block(4,'朝イチ専用モードは設定変更後の天国移行が優遇される仕様です。設定別の遷移確率を確認できないため設定推測には使いません。')
m.structural(5,'OBSERVATION_RULE','連チャン区間のゲーム数と当選回数を分離。対象ゲーム数は総Gから除外Gを自動計算します。')
m.save()

m=Machine(2)
for no,label,vals in [(1,'CZ初当たり',[158.8,157.2,154.5,151.7,148.1,145.7]),(2,'ボーナス初当たり',[315.8,308.2,299.9,286.9,274.5,263.5]),(3,'AT初当たり',[620.9,606.4,585.4,531.5,503.4,464.0])]:m.numeric(no,label,vals,normal,group='hit-path')
for no,label,vals in [(4,'弱チェリー',[69.7,68.1,66.5,64.8,62.5,59.9]),(5,'スイカ',[99.1,96.4,93.8,90.4,85.7,79.9])]:
 f=m.numeric(no,label,vals,role,group='small-role-outcomes');f['dependencyReason']='同じゲームの弱チェリーとスイカは排他的な成立役です。単一のカテゴリ分布で扱い、独立乗算しません。'
m.block(6,'ヒーローストックゾーンの状態選択率は公開されていますが、温・熱は内部状態です。演出だけで全試行の状態を確定できないため、状態の見かけの比率を推測へ使用しません。',[[75,20.3,4.7],[73.8,21.1,5.1],[72.7,21.9,5.5],[71.5,22.7,5.9],[70.3,23.4,6.3],[69.1,24.2,6.6]])
m.numeric(7,'非レア役ロゴ点灯チャレンジ',[3.2,3.2,3.2,9.4,9.4,9.4],'ボーナス終了画面の抽選ゲームで、レア小役以外（ハズレを含む）が成立した回数とロゴ点灯チャレンジ当選回数。レア小役成立時は除きます。',trial='BONUS_END_NON_RARE_TRIAL',unit='percent')
m.block(8,'移行元の通常A・通常Bと移行先の内部モードを全試行で確定できません。前モード別の公開表は保持し、見かけのモードによる誤集計を避けるため不採用。')
m.evidence(9,'ボーナス・AT終了画面',[hint('時計','高設定示唆（弱）'),hint('ベランダ','高設定示唆（強）'),ex('サイタマ＋地底人','設定2以上'),ex('奮戦サイタマ','設定4以上'),ex('S級ヒーロー集合','設定6')],'終了時の画面を1回につき1種類だけ記録。ボーナス・AT・上位ATのデフォルト画面を混同しません。')
m.evidence(10,'常夏スプラッシュの写真',[ex('リリー3枚','設定2以上'),ex('リリー4枚','設定3以上'),ex('フブキ3枚','設定3以上'),ex('フブキ4枚','設定4以上'),ex('タツマキ3枚','設定4以上'),ex('タツマキ4枚','設定5以上'),ex('同キャラ5枚','設定6')],'ベストショットチャンスの写真組合せ。失敗時も有効。同じ結果で重なる条件を別々に数えません。')
m.evidence(11,'AT獲得枚数',[ex('246over','偶数設定濃厚'),ex('456over','設定4以上'),ex('666over','設定6')],'AT中に特殊な獲得枚数が表示された場合だけ記録。')
m.evidence(12,'コア破壊の登場キャラ',[ex('1番目：金属バット','設定2以上'),ex('1番目：アトミック侍','設定3以上'),ex('1番目：シルバーファング','設定4以上'),ex('プリズナー→ファング→侍→バット','設定5以上'),ex('全てぷりぷりプリズナー','設定6')],'1番目のキャラと4人の順番を区別。プリズナー→シルバーファング→アトミック侍→金属バットの順番が設定5以上。')
m.evidence(13,'サイタマボイス',[hint('うん、いい出来だ','高設定示唆（弱）'),hint('テンション上がるな','高設定示唆（強）'),ex('いいぜ、怪獣でもなんでも俺がやっつけてやる','設定2・4・6'),ex('覚悟はいいか？','設定4以上'),ex('必殺マジシリーズ、マジ殴り！','設定6')],'バースト中、実際に揃えたBARの5の倍数回でPUSHしたボイスだけを記録。')
m.evidence(14,'タンクトップタイガー',[ex('青コイン・ヒーロー図鑑で出現','設定6濃厚')],'コインアタックチャレンジの青コインまたはヒーロー図鑑演出で出現した場合だけ有効。')
m.evidence(15,'エンディング認定証',[ex('認定証B級','設定2以上'),ex('認定証A級','設定4以上'),ex('認定証S級','設定6'),disp('鍋の点数・判子','鍋のランクごとに条件が異なるため記録のみ。666点は実戦上の予想から確定扱いしません。')],'終了時の認定証と最終4Gの鍋を区別。認定証の明示条件だけ設定候補へ反映。')
m.save()

m=Machine(3)
m.numeric(1,'AT初当たり',[351.9,344.5,330.1,317,302.2,290.3],normal,group='at-path',rank=2)
m.block(2,'200G・450Gで高設定ほど当選しやすいことは公表されていますが、設定別の当選率表を確認できないため、ゲーム数到達を独立した確率に変換しません。')
m.block(3,'通常・高確の内部状態を外見だけで全試行確定できません。弱チェリー・スイカとチャンス目の通常滞在時抽選表は保持し、通常らしいステージを分母に代用しません。',[[.2,.4,.6,.8,1,1.2],[15.8,17.2,19.1,21.1,23.4,24.9]])
m.numeric(4,'強チェリーからAT直撃',[.4,1.2,2.4,4.3,5.1,5.9],'通常時の強チェリー成立回数と、その強チェリーによるAT直撃回数。チェリー変換による強チェリーも含み、既に当選済みの前兆中・AT中は除きます。契機を特定できない結果は加算しません。',trial='NORMAL_STRONG_CHERRY_TRIAL',unit='percent',group='at-path',rank=1)
m.evidence(5,'ユウタイマー',[ex('6開始かつAT非当選','設定6濃厚')],'作戦区域のユウタイマーが6から始まり、ATに当選しなかった場合だけ有効。')
m.evidence(6,'ストーリー獲得枚数',[ex('246OVER','設定2・4・6濃厚'),ex('456OVER','設定4以上'),ex('555OVER','設定5以上'),ex('666OVER','設定6')],'ストーリーパート中の特殊枚数表示を記録。')
m.evidence(7,'ストーリー終了ボイス',[hint('ヒバリ','偶数示唆'),hint('サクヤ','偶数示唆（強）'),hint('ソーマ','高設定示唆'),hint('レン','高設定示唆（強）'),ex('エリナ','偶数設定濃厚'),ex('リンドウ','設定2以上'),ex('シオ','設定5以上')],'ストーリー終了時のサブ液晶タッチ。エンディング中レア小役時も同じ示唆ですが、別の機会として記録します。')
m.evidence(8,'上乗せ枚数',[ex('+44','設定4以上'),ex('+55','設定5以上'),ex('+66','設定6')],'神を喰らえ・ミズチ、神機覚醒・サクヤのPUSH上乗せ表示のみ。')
m.evidence(9,'ST終了画面',[hint('コウタ','高設定示唆（弱）'),hint('アリサ','偶数示唆（弱）'),hint('ソーマ','高設定示唆（強）'),ex('ユウ','設定2・3・4否定'),ex('デフォルメキャラ','設定6')],'ST終了時の画面を記録。ユウの否定範囲は終了ボイスと異なるため混同しません。')
m.evidence(10,'ケロットトロフィー',[disp('トロフィー出現','出現を記録。本機資料が他機種参考と明記する条件を未確認の確定制約へ変換しません。')],'他機種を参考とする表は本機での確定根拠と区別し記録のみ。')
m.save()

m=Machine(4,(1,2,4,5,6))
for no,label,vals in [(1,'CZ初当たり',[131,128,120,114,113]),(2,'ボーナス初当たり',[258,252,234,210,200]),(3,'AT初当たり',[530,493,450,393,357])]:m.numeric(no,label,vals,normal,group='hit-path',rank={3:2,2:3,1:4}[no])
m.block(4,'特殊状態中のAT直撃当選割合10.9～32.1%は公開されていますが、弾丸発射ごとの割合か、特殊状態を終える当選結果の割合かを資料から一意に確定できません。リセット1回を試行に仮定せず数値を保持して不採用。',[10.9,13.4,15,24.6,32.1])
m.block(5,'100G＋α天井短縮率は設定1の約40%のみ確認。他設定を同じ値や推定値で埋めず、不採用。')
m.block(6,'カチャバン作動時の昇格率は設定別に公開されていますが、昇格前後の内部状態を全回確認できません。50G時は設定1のみ公開のため、見かけのステージから推測しません。',dict(counter=[13.7,14.1,14.4,14.6,14.9],games50_setting1=10.9))
m.numeric(7,'CZ敗北後の復活',[1.6,2.3,3.1,3.1,3.1],'CZバウンティバトルの敗北回数と復活回数。CZ中にゲーム数天井へ到達した際の必ず復活する結果は、試行と成功の両方から除外します。',trial='CZ_DEFEAT_WITHOUT_CEILING_TRIAL',unit='percent',group='hit-path',rank=5)
m.evidence(8,'ボーナス確定画面',[ex('赤7シングル＋シトリン＆アメジスト','設定6')],'赤7ダブル時のデフォルト画面と区別し、シングル揃いでの出現だけ有効。')
m.evidence(9,'コスプレちゃれんじ',[ex('シトリン','設定2以上'),ex('アメジスト','設定4以上')],'コスプレちゃれんじ中のキャラクターを記録。')
m.evidence(10,'AT終了画面',[hint('鬼子','高設定示唆（強）')],'AT終了画面の示唆を記録。設定別出現率は確認できないため確率の重みは付けません。')
m.evidence('04-extra-ending','エンディングボイス',[ex('シトリン','設定2以上'),ex('アメジスト','設定4以上'),ex('アクア＆ローズ','設定6')],'エンディング中のレア小役成立時のボイス。通常のAT終了画面と分離します。')
m.save()

m=Machine(5)
m.numeric(1,'ST初当たり',[529.3,515.1,481.7,405,372.9,352.8],normal,group='hit-path',rank=3)
m.numeric(2,'CZ合算',[196.6,193.6,185.9,175.2,165.3,157.3],normal+'We Are Franchouchou・絶叫ゾンビ屋敷・サガロックチャレンジの3種合計。待て！ロメロは除き、サガロックは天井経由も含めます。',group='hit-path',rank=2)
m.numeric(3,'通常時SAGA揃い',[35.9,35.4,33.9,32.5,30.5,29.2],role+'SAGA揃い高確中は除きます。CZ高確とは別の状態です。',trial='NON_SAGA_HIGH_NORMAL_GAME_TRIAL',group='hit-path',rank=1)
m.block(4,'CZ高確の20G・30G・50G振分は公開されていますが、高確G数を演出上の滞在時間だけで確定できません。SAGA揃い高確とCZ高確を同一視せず、内部高確終了を未確定のまま数値推測へ使いません。')
m.block(5,'SAGAレベルとCZ高確状態の両方で抽選率が異なります。示唆だけで全試行のレベルを固定できないため、レベル1・2・3の公開表を混ぜて評価しません。')
m.numeric(6,'SAGA・BARからST直撃',[5226,4785,3856,2910,2691,2577],normal+'SAGA揃い・BAR揃いによる直撃のみ。SAGA揃い単独の状態別期待度とは別のトータル出現率です。',group='hit-path',rank=4)
m.block(7,'開始時の内部成功抽選（19.5～31.3%）と実際のCZ最終成功は異なります。開始時当選を演出から全回確定できないため、この内部抽選率の直接入力は不採用。最終成功率を別の観測モデルに使用します。',[19.5,19.9,20.3,28.1,30.5,31.3])
m.numeric('05-007-final','We Are Franchouchou成功',[25.4,25.6,25.9,33.2,35.4,36.1],'CZ We Are Franchouchouの突入回数と最終成功回数。開始時内部抽選当選と同一視せず、他CZや天井による強制成功を混ぜません。',trial='WAF_CZ_TRIAL',unit='percent',group='hit-path',rank=5)
m.block(8,'徒花ボーナス後のSAGA揃い高確選択時の移行先は、CZ高確中か否かと天井経由かで異なります。内部状態を確定できない混合集計の割合を使用しません。')
m.evidence(9,'ST終了画面',[hint('屋台','偶数設定示唆'),hint('桜','高設定示唆'),ex('海','設定2以上'),ex('遊園地','設定4以上'),ex('お正月','設定5以上'),ex('フランシュシュメンバー＆幸太郎','設定6')],'ST終了画面を1回につき1種類記録。上位STのデフォルトと通常STを区別。')
m.evidence('05-extra-local','徒花ボーナスご当地紹介',[ex('656広場','設定5以上'),ex('サキ','設定2以上'),ex('愛','設定3以上'),ex('純子','設定4以上'),ex('ゆうぎり','設定5以上'),ex('リリィ','設定6')],'徒花ボーナス中のご当地紹介での場所または液晶右のキャラ。ボーナス終了画面のミニキャラとは異なる示唆です。')
m.evidence('05-extra-mini','ボーナス終了ミニキャラ',[hint('たえ','高設定示唆'),disp('さくら','デフォルト')]+[hint(c,'設定'+str(k)+'示唆') for c,k in [('サキ',2),('愛',3),('純子',4),('ゆうぎり',5),('リリィ',6)]],'フランシュシュボーナス終了画面のミニキャラは特定設定の示唆。ご当地紹介と異なり設定候補を確定しません。')
m.evidence('05-extra-ending','エンディングボイス',[hint('サガ！','偶数示唆'),hint('どやんすー！','奇数示唆'),hint('おはようございまーす！','高設定示唆（弱）'),ex('幸太郎：俺がもっとるんじゃあああーい！','設定4以上'),ex('幸太郎：たとえ誰に恨まれようと…','設定5以上'),ex('幸太郎：俺たちの戦いはこれから…','設定6濃厚')],'エンディング中のSAGA揃い第3停止後のボイスを記録。')
m.save()

m=Machine(6)
for no,label,vals in [(1,'CZ初当たり',[296.3,285,280.4,253.7,245.3,231.9]),(2,'AT初当たり',[390,378.3,359,326.5,312.8,296.8])]:m.numeric(no,label,vals,normal,group='hit-path')
m.block(3,'設定変更後・AT後の上位モードが高設定で優遇されることは判明していますが、全設定の移行率と内部モードを実戦で確定する条件が揃わないため、不採用。')
m.block(4,'チェリー強化状態以外かつモードA～Cの役別CZ当選率は公開されていますが、内部モードを全試行確定できません。強化状態とモードを未確認のまま通常ゲーム数へ混ぜません。',dict(weak=[.4,.8,.8,1.6,1.6,2],strong_chance=[15.6,17.2,18.8,23.4,25,26.6],strong_cherry=[25,26.6,28.1,31.3,32.8,34.4]))
m.evidence(5,'獲得枚数表示',[ex('246枚OVER','偶数設定濃厚'),ex('456枚OVER','設定4以上'),ex('555枚OVER','設定5以上'),ex('666枚OVER','設定6')],'下3桁を含めて対象の特殊枚数表示を確認。')
m.evidence(6,'AT中ボーナス終了画面',[disp('アカメ①','デフォルト'),hint('ナイトレイド','奇数設定示唆'),hint('イェーガーズ','偶数設定示唆'),hint('アカメ②','高設定示唆（弱）'),hint('アカメ③','高設定示唆（強）')],'AT中のボーナス終了画面。AT自体の終了画面とは別に記録します。')
m.evidence(7,'AT終了画面',[hint('ナイトレイドシンボル','奇数設定示唆'),hint('帝国軍シンボル','偶数設定示唆'),hint('タツミ＆アカメ','高設定示唆（弱）'),hint('ナイトレイド女性キャラ集合','高設定示唆（強）'),ex('アカメ','設定2以上'),ex('アカメ＆レオーネ','設定4以上'),ex('エスデス','設定5以上')],'AT終了時の画面を記録。')
m.evidence(8,'ナミちゃんパネル',[disp('黒','次回設定2以上のパネル出現'),ex('青','設定2以上'),ex('赤','設定3以上'),ex('金','設定4以上'),ex('呪毒柄','設定5以上'),ex('虹パネル','設定6')],'対象パネル出現を記録。')
for no,tab in [(7,'画面'),(8,'パネル')]:
 next(f for f in m.findings if f['findingId']==m.cid(no))['observationContext']=dict(groupingApproved=True,opportunityId='akame-at-end',conditionId=tab,groupTitle='AT終了時',conditionLabel=tab)
m.evidence(9,'エンディングの1枚絵',[disp(x,'詳細な示唆内容と設定別出現率は未確認のため、色を記録します。') for x in ['白','青','緑','赤','金']],'エンディング中のレア小役成立時のエフェクト色。色だけで特定設定を確定しません。')
m.save()

m=Machine(7)
m.numeric(1,'ボーナス初当たり',[249.7,245.6,228.4,207.3,193.4,183.1],normal,group='bonus-path',rank=2)
m.numeric(2,'弱チェリー',[54.6,54.4,51.2,48,46.7,45.4],role,group='bonus-path',rank=1)
for no,why in {3:'リプレイ3連は観測できますが、当選先のミッション高確は昼ステージにも潜伏します。3連後の見かけのステージ移行を当選判定へ代用しないため不採用。',4:'弱チェリー後のミッション高確は潜伏するため当選・非当選を全回確定できません。公開設定別抽選率は保持し、見かけの移行率は使いません。',5:'低確中のミッション当選率は公開されていますが、昼ステージでも高確の可能性があり、低確の全ゲーム数を特定できないため不採用。',6:'公表表はハズレ出現時の直撃抽選です。通常G全体の確率かハズレ成立回数あたりかを確定できる根拠が揃わないため、1/6867等を通常Gへ機械的に適用しません。',9:'弱チェリーからのボーナス直撃は設定差の存在のみ確認。設定別当選率を確認できないため、弱チェリー回数から仮の成功率を作りません。',10:'獲得した内部高確ゲーム数は滞在ステージと完全対応しません。設定別の振分表は保持し、演出上の継続Gを同じ当選結果として扱いません。',11:'07-005と同じ低確中のミッション当選率です。候補を保持し、同じ抽選を二重評価しません。',12:'失敗時の高確当選率は失敗前が低確の条件です。潜伏高確を除く正確な試行回数を観測できないため不採用。',13:'3～7スルーのチャンスミッション率は公開されていますが、内部の裏モード中は確定となり抽選対象外です。裏モードを全試行分離できないため不採用。'}.items():m.block(no,why)
m.evidence(7,'BIG中JAC IN画面',[ex('ブラボー3人→ブラボー3人','設定2以上濃厚'),ex('クリス3人→クリス3人','設定4以上濃厚'),ex('ブラボー4人→ブラボー4人','設定5以上濃厚'),ex('クリス4人→クリス4人','設定6濃厚'),hint('ブラボー3人→クリス3人','奇数設定示唆'),hint('クリス3人→ブラボー3人','偶数設定示唆')],'BIG・ハイパーBIGの1回目→2回目の組合せで記録。1枚だけで同じ示唆とみなしません。')
m.evidence(8,'サミートロフィー',[ex('銅','設定2以上'),ex('銀','設定3以上'),ex('金','設定4以上'),ex('キリン','設定5以上'),ex('虹','設定6')],'ボーナス終了画面のトロフィーを記録。')
m.save()

m=Machine(8);m.url='https://1geki.jp/slot/s_busou_shinki/'
m.numeric(1,'AT初当たり',[282.1,270,258,238.8,204.4,173.9],normal,group='hit-path')
m.numeric(2,'CZ神姫バトル',[91.2,91.1,91.1,91,90.7,90.3],normal,group='hit-path')
m.block(3,'CZ成功率は育成神姫・親愛度・武装レベルに左右されます。設定ごとの通常成功率表を確認できないため、AT率/CZ率から仮の成功率を作りません。')
m.block(4,'逆押し高確率中のレア役合算と白BAR停止型は全設定共通。設定別の移行率を確認できないため、逆押し頻度を設定差へ置換しません。')
m.block(5,'神姫ごとのCZ性能は公開されていますがキャラ選択は均等で、設定別の条件付き成功表は未確認。神姫による性能差を設定差として扱いません。')
m.structural(6,'OBSERVATION_RULE','AT間CZ8連敗後の9回目は強制成功。別の成功率を記録する場合は9回目を試行と成功の両方から除外。独立した設定差にはしません。')
m.block(7,'確認した設定推測資料では、具体的な設定確定・否定の終了画面カテゴリを確認できません。画面名や否定設定を創作せず、不採用として調査を閉じます。')
m.save()

m=Machine(9,(1,2,5,6))
m.numeric(1,'BIG確率',[224,209,194,179],normal+'赤7・黄7を合算したBIG回数。',group='bonus-path',rank=3)
m.numeric(2,'CT初当たり',[374,361,335,322],normal,group='bonus-path',rank=4)
m.numeric(3,'4枚役A',[48,47.2,46.4,45.6],role+'赤7狙い時のチェリー、黄7狙い時の中段スイカ。同じ役の見た目が変わるため両方を加算しません。',group='bonus-path',rank=2)
m.numeric(4,'5枚役A',[36.4,35,33.7,32.4],role+'5枚役AとBの停止形を区別して数えます。',group='bonus-path',rank=1)
m.block(5,'CTレベル1・2は示唆発光だけでは全試行で確定できません。緑発光はレベル2以上でありレベル2確定ではないため、前後レベルの変化を仮定せず不採用。')
m.structural(6,'DUPLICATE_ROUTE','CTレベル別ブラビを狙えは09-010で扱います。同じ演出を二重に数えません。')
m.numeric(7,'枚数調整時の魔法',[[49.9,49.9,0,.2,0],[41.7,56.4,2,0,0],[55.2,40.8,3,1,0],[40.8,55.2,1,2,1]],'BIG中、ブラビを狙え非発生時の枚数調整成功時に出る魔法を1回1種類記録。目押し失敗を試行に含めません。',trial='BIG_ADJUST_SUCCESS_TRIAL',unit='category',labels=['Flame','Blizzard','Meteo','WARD OF LIGHTS','THUNDER V'])
m.link(7,'09-007-constraints',[ex('Meteo','設定2以上濃厚'),ex('WARD OF LIGHTS','設定2否定'),ex('THUNDER V','設定6濃厚')],'同じ魔法表示の観測結果。')
m.numeric(8,'ボーナス終了キャラ',[[54.7,32.8,12.5,0],[31.9,53.2,14.8,0],[29.9,49.8,17.2,3.1],[48.3,29,19.5,3.1]],'CT非当選のボーナス終了時のキャラを1回1種類記録。復活でCT当選した場合も有効。CT中のBIG終了など別条件は含めません。',trial='NON_CT_BONUS_END_TRIAL',unit='category',labels=['テモヤン','ヘターレ','ヘーボン','サンライズ'])
m.link(8,'09-008-constraints',[ex('サンライズ','設定5以上濃厚')],'ボーナス終了キャラの出現。')
m.numeric(9,'エンディングのカートリッジ',[[50,50,0,0],[50,0,50,0],[33.3,33.3,0,33.3],[33.3,0,33.3,33.3]],'エンディング中のボーナス終了時のカートリッジを記録。通常のCTルーレット失敗画面と混ぜません。',trial='ENDING_BONUS_END_TRIAL',unit='category',labels=['白枠','赤枠','青枠','金枠'])
m.link(9,'09-009-constraints',[ex('赤枠','奇数設定濃厚'),ex('青枠','偶数設定濃厚'),ex('金枠','設定5以上濃厚')],'同じカートリッジ表示。')
m.numeric(10,'CTレベル3のブラビを狙え',[24.7,26.1,27.7,29.5],'赤発光またはスーパーBIG契機によりCTレベル3が確認できた後のメインCTゲーム数と演出発生回数。レベルは有利区間終了まで転落しません。ピンチCT・ボーナス中・レベル未確定のCTを含めません。',trial='CONFIRMED_CT3_MAIN_GAME_TRIAL')
m.structural(11,'DUPLICATE_ROUTE','CT中BIGのレベル遷移は09-005に含まれます。前レベルを確定できない条件は推測に使わず、同じ遷移を二重評価しません。')
m.save()

m=Machine(10)
m.numeric(1,'ボーナス合算',[219.8,215.8,208.9,201.6,194.2,186.2],normal+'BIGとREGの合計回数。合算は内訳から表示し、BIG・REGと独立乗算しません。',group='bonus-path',rank=3)
m.numeric(2,'上段ギャオス',[5.53,5.49,5.48,5.45,5.38,5.3],role,group='bonus-path',rank=4)
m.structural(3,'DERIVED_DISPLAY','リーチ目内訳の公開表を保持。設定差のない役、特殊バトル目、リーチ目リプレイを混ぜた全リーチ目合算を独立加算しません。')
m.numeric(4,'特殊バトル目合算',[455.1,455.1,442.8,431.2,420.1,404.5],role,group='bonus-path',rank=5)
m.numeric(5,'リーチ目リプレイCDEF',[2048,1820.4,1638.4,1489.5,1057,936.2],role+'C・D・E・Fの合計。設定差のないA・Bは除外します。',group='bonus-path',rank=1)
m.block(6,'覚醒BIGはBIG確定状態でリーチ目成立時の昇格で、1回あたり昇格率自体は全設定共通。トータル出現率の差はリーチ目等を含む派生のため、別の独立した設定差にしません。',[96968.3,93827.8,85925,79239.5,72993.6,66251.2])
m.evidence(7,'BIG獲得枚数',[ex('456枚突破','設定4以上'),ex('666枚突破','設定6')],'BIG中の特殊枚数表示のみ。出現機会が異なる表示の率を同一母数で評価しません。')
m.numeric(8,'BIG終了画面',[[96.2,3.8,0,0],[86.6,10.9,2.5,0],[93.7,3.8,2.5,0],[86.6,10.9,2.5,0],[93.7,3.8,2.5,0],[85.1,10.9,2.5,1.5]],'BIG終了1回につき1種類。デフォルト文字は獲得枚数で変わります。REG画面と混ぜず、You are No1のBIG表示を設定6扱いしません。',trial='BIG_END_TRIAL',unit='category',labels=['デフォルト','EVEN！？','NOT BAD','GAMERA'])
m.link(8,'10-008-constraints',[ex('NOT BAD','設定2以上'),ex('GAMERA','設定6')],'BIG終了時だけの画面。')
m.evidence(9,'REG中キャラ紹介',[ex('子ジャイガー','設定2否定'),ex('バルゴンの卵','設定3否定'),ex('大車輪ガメラ','設定4否定'),hint('演奏ガメラ','高設定示唆'),ex('波乗りガメラ','設定2以上'),ex('名古屋沖の戦い','設定3以上'),ex('大怪獣ガメラ','設定5以上')],'REG中またはBIGのJACバトル中の紹介キャラ。公開表の各率は紹介機会と表示数の扱いが未確定のため、数値の重みは付けず明示の制約だけ使います。')
m.evidence(10,'REG終了画面',[disp('青空','デフォルト'),disp('実写ポスター','連戦バトルまたは超ガメラモード'),ex('怪獣集合','設定5以上'),ex('You are No1','設定6')],'REG終了時だけの画面。BIG時の同じ文字にはREGの設定示唆を適用しません。率の表は設定5・6のみのため、欠測セルを勝手に0%へ変換せず制約として扱います。')
m.evidence(11,'サミートロフィー',[ex('銅','設定2以上'),ex('銀','設定3以上'),ex('金','設定4以上'),ex('キリン','設定5以上'),ex('虹','設定6')],'ボーナス終了時のトロフィーを記録。')
for no in (12,13):m.structural(no,'MERGED_EXACT_CONSTRAINT','REG終了画面10-010の対応カテゴリとして制約を1回だけ適用。独立した追加入力や追加尤度を作りません。')
m.save()
