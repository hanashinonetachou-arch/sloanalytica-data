import json,pathlib,copy
REPO=pathlib.Path(__file__).resolve().parents[2]
BASE=REPO/'production/batches/batch-20261005-006'
DOMAINS=['INITIAL_HIT','BONUS','SMALL_ROLE','CZ','AT','INTERNAL_CONDITIONAL_DRAW','MODE_TRANSITION','STATE_TRANSITION','SUCCESS_RATE','POINTS_GAME_DISTRIBUTION','CARRY_OVER','THRESHOLD_BEHAVIOR','RESET_BEHAVIOR','POST_EVENT_TRANSITION','NAVIGATION','ROLE_CONDITIONAL_DISTRIBUTION','BONUS_TYPE_CONDITIONAL','EVIDENCE','EXTERNAL_DATA_ONLY','MACHINE_SPECIFIC']
class Research:
 def __init__(self,mid):
  self.seed=json.load(open(BASE/'research-progress'/(mid+'.json')))
  self.d={'schemaVersion':'research-v1','manifestVersion':'8.5','batchId':'batch-20261005-006','machineId':mid,'machineName':self.seed['machineName'],'researchedAt':'2026-10-05','settings':{'status':'SOURCE_DERIVED','values':['SET_'+str(x) for x in self.seed['settings']['values']]},'sources':[],'findings':[],'blockedItems':[]}
  self.ledger=[];self.queries=[];self.domainNotes={};self.na=set()
  self.source('analysis',self.seed['sources'][0]['url'],self.seed['sources'][0]['title'])
 def source(self,sid,url,title,typ='primary_analysis'):
  if not any(s['sourceId']==sid for s in self.d['sources']):self.d['sources'].append({'sourceId':sid,'url':url,'title':title,'sourceType':typ,'checkedAt':'2026-10-05','claims':[]})
 def trace(self,id,label,sids,disposition):
  sc=[]
  for sid in sids:
   src=next(s for s in self.d['sources'] if s['sourceId']==sid)
   claim=label+'の公開値・適用条件を確認'
   if claim not in src['claims']:src['claims'].append(claim)
   sc.append({'sourceId':sid,'claim':claim})
  self.ledger.append({'candidateId':disposition['type'].lower()+':'+id,'label':label,'sourceClaims':sc,'discoveryQueries':[],'disposition':disposition})
 def fact(self,id,label,sid,reason):self.trace(id,label,[sid],{'type':'NO_SETTING_DIFFERENCE','reason':reason})
 def numeric(self,fid,trial,scope,status='EXACT_WITH_SCOPE_TRACKING',reason=None,kind=None,details=None,sids=None):
  f=copy.deepcopy(next(x for x in self.seed['numericalCandidates'] if x['findingId']==fid))
  for k in ['scopeVerification','categoryIdentityVerification','knownConstraints','categoryLabels']:f.pop(k,None)
  f['trialUniverse']=trial;f['denominatorSemantics']=scope
  if kind:f['observationType']=kind
  if sids:f['sourceIds']=sids
  f['liveObservation']={'status':status,'reason':reason or scope}
  if details:f['details']=details
  self.add(f);return f
 def add(self,f):
  self.d['findings'].append(f);self.trace(f['findingId'],f['label'],f['sourceIds'],{'type':'FINDING','refId':f['findingId']});return f
 def raw(self,fid,label,dist,reason,sids=None,trial='INTERNAL_DRAW_TRIAL'):
  return self.add({'findingId':fid,'label':label,'observationType':'reference_distribution','settingDistribution':dist,'sourceIds':sids or ['analysis'],'trialUniverse':trial,'denominatorSemantics':reason,'liveObservation':{'status':'UNRESOLVED','reason':reason},'details':[reason],'reevaluationCondition':'抽選時点の状態と抽選結果を、演出による推測ではなく全件確定して記録できる方法が確認されること。'})
 def block(self,bid,label,reason,condition,sids=None,raw=None):
  b={'blockId':bid,'label':label,'reason':reason,'reevaluationCondition':condition,'sourceIds':sids or ['analysis']}
  if raw is not None:b['rawSourceValues']=raw
  self.d['blockedItems'].append(b);self.trace(bid,label,b['sourceIds'],{'type':'BLOCKED','refId':bid})
 def evidence(self,fid,label,cats,sids=None,details=None,trial=None):
  f={'findingId':fid,'label':label,'observationType':'evidence','sourceIds':sids or ['analysis'],'semanticCategories':[{'label':a,'meaning':b,'semanticType':t} for a,b,t in cats],'details':details or []}
  if trial:f['trialUniverse']=trial
  return self.add(f)
 def done(self,wave,notes,queries,na=()):
  self.queries=queries;self.na=set(na)
  for i,q in enumerate(queries):self.ledger[i%len(self.ledger)]['discoveryQueries'].append(q)
  for s in self.d['sources']:
   assert s['claims'],s['sourceId']
  self.d['researchCompleteness']={'version':2,'domains':[{'domain':dom,'status':'NOT_APPLICABLE' if dom in self.na else 'CHECKED','sourceIds':['analysis'],'note':notes.get(dom,'公開解析・機種概要・機種固有検索を確認し、この領域に独立した設定別数値は追加確認できなかった。公開値不足の候補は保留台帳へ記録した。')} for dom in DOMAINS],'machineSpecificQueries':queries,'candidateLedger':self.ledger}
  target=BASE/'research-drafts'/wave/(self.d['machineId']+'.json');target.parent.mkdir(parents=True,exist_ok=True);target.write_text(json.dumps(self.d,ensure_ascii=False,indent=2)+'\n')
  print(self.d['machineId'],len(self.d['findings']),len(self.d['blockedItems']))
P='PROBABILITY_UNKNOWN';X='EXACT_CONSTRAINT';D='DISPLAY_ONLY';B='PROBABILITY_BACKED'
def pct(rows,labels):return {str(i+1):' / '.join(f'{label} {v}%' for label,v in zip(labels,row)) for i,row in enumerate(rows)}
# Wave 1: the source array order is fixed.
r=Research('L_IZA_BANCHO_SB8')
r.source('spec','https://nana-press.com/kaiseki/machine/946/29280/','いざ！番長 スペック・小役確率')
r.source('direct','https://nana-press.com/kaiseki/machine/946/31020/','いざ！番長 ボーナス直撃抽選')
r.source('end','https://nana-press.com/kaiseki/machine/946/29803/','いざ！番長 AT終了画面')
r.source('identity','https://www.p-world.co.jp/machine/database/10275','いざ！番長 型式・通常時の小役確率')
r.source('reset','https://nana-press.com/kaiseki/machine/946/29780/','いざ！番長 リセット・据え置き')
r.fact('identity','型式L/いざ番長/SB8・2025年サボハニ機','identity','機種同定用情報であり、設定を推測する観測ではない。')
r.numeric('at-initial','NORMAL_GAME_TRIAL','通常ゲーム数に対する頂ZBASH初当り回数。引き戻しとAT中の継続・ボーナスは含めない。')
r.numeric('common-bell-a','NORMAL_GAME_TRIAL','通常ゲーム数に対する上段10枚ベル揃い回数。ナビ・狙え演出による上段ベルも含める。斜め揃いの共通ベルBとAT中の回数は含めない。',sids=['spec','identity'])
r.numeric('weak-cherry','NORMAL_GAME_TRIAL','通常ゲーム数に対する弱チェリー成立回数。強チェリー・最強チェリーやAT中の成立は含めない。',sids=['spec','identity'])
for fid in ['direct-red','direct-blue','direct-total']:
 r.numeric(fid,'NORMAL_EXCLUDING_CZ_GAME_TRIAL','CZ・AT・ボーナス中を除く通常ゲーム数に対する'+next(x['label'] for x in r.seed['numericalCandidates'] if x['findingId']==fid)+'回数。CZ成功からのボーナス・超番長ボーナスは含めない。',sids=['direct'])
r.numeric('miimo','ZECCHO_ENTRY_TRIAL','絶頂決戦突入回数に対する突入時のミーモ斬シング発生回数。途中から流れた別楽曲は含めない。',status='DIRECT_EXACT')
for color,vals in [('青',{ '1':.01,'6':.03}),('黄',{'1':.10,'6':.15})]:
 r.add({'findingId':'cz-'+color,'label':'CZ終了時'+color+'エフェクトからの成功','observationType':'partial_distribution','settingDistribution':vals,'sourceIds':['analysis'],'trialUniverse':'CZ_'+color+'_FINAL_TRIAL','denominatorSemantics':'CZ終了時に'+color+'だった回数に対するAT当選回数。設定2～5の成功率は未公表。','details':['設定1・6の成功率は公開されていますが、設定2～5の値がないため数値推測へ使用しません。']})
r.raw('sword-level12','刀レベル1・2での抜刀からAT本前兆',dict(zip(map(str,range(1,7)),[.031,.035,.035,.039,.035,.043])),'刀の色と内部の刀レベルは必ずしも一致せず、レベル1・2の抽選回数を全件確定できません。')
r.evidence('at-end','AT終了画面',[('夕焼け（轟剛剣＆小太郎）','基本パターン',D),('子育て奮闘（轟剛剣＆小太郎）','偶数設定示唆',P),('護摩行（沢庵薫）','高設定示唆',P),('刺客襲来（敵キャラ集合）','設定2以上',X),('小太郎日記','設定4以上',X),('青龍','設定3・4・6濃厚',X),('朱雀','設定2・5・6濃厚',X),('温泉（おみさ＆コパンダ）','設定6',X)],sids=['end'],details=['画面ごとの出現率は数値ではなく出やすさのみ公表されています。'])
for bid,label,reason in [('comeback','AT終了後の引き戻し','設定6の少数実戦サンプルはありますが、設定別の当選率が公開されていません。'),('shogun','AT開始時の成敗報酬（初期報酬マス）','AT開始時の初期報酬振り分けに設定差があることは公表されていますが、設定別の全振り分けは未公開です。将軍アイコンの実戦傾向だけを設定別確率として扱いません。'),('zeccho-entry','絶頂決戦突入','設定5が優遇されるという情報はありますが、設定別の突入率が公開されていません。'),('chance-mode','チャンスA以上へのモード移行','モード移行に設定差の示唆がありますが、真のモードと設定別移行率が確定できません。')]:r.block(bid,label,reason,'本機の全設定の当選率・選択率と、対象条件を確認できる方法が公表されること。')
r.fact('reset','リセット時のゲーム数・刀ポイント・御免ポイント','reset','設定変更の判別・恩恵であり、設定1～6の分布差は確認できない。')
r.fact('no-diff-roles','リプレイ・共通ベルB・共通斬・弁当・強チェリー・チャンス目・最強チェリー','spec','出現率は全設定共通として公表されている。')
r.done('wave-1',{'INITIAL_HIT':'頂ZBASH初当りと通常直撃を確認。経路の重複を明示。','BONUS':'赤7・青7・合算直撃を保持。超番長ボーナスを通常直撃に混ぜない。','SMALL_ROLE':'通常時の共通ベルA・弱チェリーを評価。その他全設定共通役を台帳に保存。','CZ':'青・黄終了色の成功率は設定1・6のみ。補間せず原分布を保持。','AT':'初当り・引き戻し・開始報酬・絶頂を確認。公開率不足は個別保留。','MODE_TRANSITION':'チャンスA以上の移行率は実戦上の傾向で定量値不足。','STATE_TRANSITION':'刀の色・刀レベルの非一致を確認。内部レベルの母数は未確定。','SUCCESS_RATE':'CZ色別成功・刀レベル別AT当選を保持。','POINTS_GAME_DISTRIBUTION':'刀ポイント・御免ポイントと天井を確認。設定別分布が確認できないものは数値化しない。','CARRY_OVER':'据え置き時の刀ポイント・ゲーム数引継ぎを確認。','THRESHOLD_BEHAVIOR':'規定G数・刀MAX・御免MAXの挙動を確認。単なる天井到達を設定確定としない。','RESET_BEHAVIOR':'設定変更恩恵は設定番号の差と区別。','POST_EVENT_TRANSITION':'AT引き戻しと初当りの数え分けを確認。','NAVIGATION':'ナビ・狙えからの上段共通ベルAも有効。通常時に範囲を固定。','ROLE_CONDITIONAL_DISTRIBUTION':'CZ・刀レベル条件の分布差を確認。','BONUS_TYPE_CONDITIONAL':'赤7・青7直撃と合算を同一当選内訳として保持。','EVIDENCE':'終了画面8種類を具体名で展開。','EXTERNAL_DATA_ONLY':'ダイトモ小役カウントの情報を確認。直接カウントの通常時範囲とは区別。','MACHINE_SPECIFIC':'ミーモ斬シング、将軍アイコン、刀レベルを確認。'},['いざ番長 設定差 リセット 刀ポイント ダイトモ','いざ番長 CZ 成功率 ボーナス直撃 設定','いざ番長 終了画面 青龍 朱雀 設定'])

r=Research('L_ZETTAI_SHOGEKI_PLATONIC_HEART_TK')
for sid,url,title in [('identity','https://www.p-world.co.jp/machine/database/10290','絶対衝激TK 型式・ゲームフロー'),('official','https://slot-zettaishougeki.jp/','絶対衝激 PLATONIC HEART 公式'),('tech','https://nana-press.com/kaiseki/machine/982/30199/','継続バトル必殺技'),('trophy','https://nana-press.com/kaiseki/machine/982/30606/','ナミちゃんトロフィー'),('screen','https://nana-press.com/kaiseki/machine/982/30196/','ボーナス確定画面'),('end','https://nana-press.com/kaiseki/machine/982/30195/','ボーナス・AT終了画面'),('reset','https://nana-press.com/kaiseki/machine/982/30200/','リセット挙動')]:r.source(sid,url,title,'official' if sid=='official' else 'primary_analysis')
r.fact('identity','L絶対衝激TK・2025年PLATONIC HEART・スパイキー','identity','絶対衝激IVや2008年機・Ⅲとは別機種。')
r.fact('official','2025年PLATONIC HEART公式機種','official','機種同定の公式情報であり設定推測値ではない。')
r.numeric('bonus-total','TOTAL_GAME_TRIAL','総ゲーム数（通常・AT中のリアルボーナス抽選ゲームを合算）に対するプラトニック・バトルボーナス合算回数。ボーナス消化中は含めない。')
r.numeric('at-initial','NORMAL_GAME_TRIAL','通常ゲーム数に対するプラトニックタイム初当り回数。セット継続・ストック上乗せは初当りに含めない。')
for fid in ['suika-high-19','suika-high-49']:
 r.numeric(fid,'NON_BONUS_SUIKA_TRIAL','ボーナス非重複のスイカ成立回数に対する高確移行回数。演出上の夜ステージだけでは内部高確の残りゲーム数を全件確定できない。',status='UNRESOLVED',reason='内部高確の19G・49Gの振り分けを、夜ステージから一意に確定できません。',details=['内部高確の移行率は公開されていますが、19Gと49Gの抽選結果を全件識別できないため現在は数値推測に使用しません。'])
r.block('suika-bonus','スイカ重複プラトニックボーナス','参考の当選期待度1.54%と設定差の存在は公表されていますが、設定1～6の対応する当選率が揃っていません。','本機の全設定のスイカ重複当選率が公表されること。',raw={'publishedReferenceProbability':'1.54%','settingMapping':'NOT_EXPLICIT'})
rows=[[[50,12.02,25.14,7.96,4.88],[50,10.01,26.12,8.98,4.88],[50,8.86,26.68,9.57,4.88],[50,8.86,26.68,9.57,4.88],[50,8.86,26.68,9.57,4.88],[50,8.58,26.82,9.72,4.88]],[[57.81,9.23,19.42,2.88,10.66],[55.08,9.83,18.03,4.91,12.15],[53.13,10.25,17.23,6.23,13.16],[50,10.94,18.38,6.64,14.04],[50,10.94,18.38,6.64,14.04],[50,10.94,17.96,6.93,14.17]],[[25,27.54,15.10,26.21,6.15],[25,23.73,17.60,27.52,6.15],[21.88,18.92,22.13,30.66,6.41],[18.75,17.77,24.27,32.54,6.67],[18.75,17.77,24.27,32.54,6.67],[17.97,17.94,24.50,32.85,6.73]],[[33.20,11.48,28.96,11.74,14.61],[33.20,11.48,28.96,11.74,14.61],[28.13,12.35,31.16,12.63,15.72],[28.13,12.35,31.16,12.63,15.72],[28.13,12.35,31.16,12.63,15.72],[26.56,12.62,31.84,12.91,16.06]]]
for name,rr in zip(['通常プラトニック','通常バトル','ATプラトニック','ATバトル'],rows):r.raw('cz-point-'+name,name+'ボーナス当選時の初期CZポイント',pct(rr,['0pt','1pt','2pt','3pt','4pt']),'ボーナス当選時の内部初期CZポイントは、CZ中の小役による加算や当選と区別して全件確定できません。')
stocks=[[.06,.06,.06,.06,.07,.07],[.06,.06,.06,.06,.07,.07],[.11,.11,.11,.11,.17,.17],[.17,.17,.17,.17,.44,.44],[.10,.10,.10,.10,.77,.77],[.10,.10,.10,.10,.77,.77]]
r.raw('normal-bonus-stock','通常プラトニックボーナス当選時のATストック',pct(stocks,['1個','2個','3個','4個','5個','10個']),'初期ストックとボーナス中・CZ中の追加ストックが混ざり、通常時のボーナス当選で得た個数だけを確定できません。')
r.evidence('jac-voice','JAC IN入賞時のボイス',[('伊勢島綾「やるじゃん」','基本パターン',D),('香月美子「きたぁー！」','高設定示唆',P)])
r.evidence('tech-bonus','継続バトル必殺技（ボーナス当選あり）',[('絶対波動','AT継続',D),('風影砲 改','ストック5個以上またはボーナス',D),('邊汰品 消滅波','設定1否定',X),('覚・明火闇光','設定4以上',X),('覇威猛倒','設定5以上',X),('六角','設定6',X)],sids=['tech'],details=['この欄は同じ必殺技の場面でボーナス当選を確認できた場合だけ入力してください。ボーナスなしなら設定は絞り込めません。'])
r.evidence('tech-no-bonus','継続バトル必殺技（ボーナス当選なし）',[(x,'設定番号を絞り込む条件は未成立',D) for x in ['絶対波動','風影砲 改','邊汰品 消滅波','覚・明火闇光','覇威猛倒','六角']],sids=['tech'],details=['ストック示唆と設定示唆を区別するための記録です。ボーナス当選を確認した場面はボーナス当選ありの欄へ記録してください。'])
r.evidence('nami-trophy-reference','ナミちゃんトロフィー（本機の意味は確認待ち）',[(x,'他機種参考の情報のため現時点は記録のみ',D) for x in ['黒','銅','銀','金','特殊','虹']],sids=['trophy'],details=['出現は確認されていますが色別の意味は他機種参考の注記があります。本機の確定条件として確認できるまでは設定を絞り込みません。'])
r.fact('bonus-screen','ピンク・金のボーナス確定背景','screen','金はプラトニックボーナス種別の示唆であり設定確定ではない。')
r.block('end-screen','プラトニック・バトル・コンティニュー終了画面','画面は確認されていますが、設定別の意味と出現率が現在調査中です。','本機の各終了画面の設定別の意味または出現率が公表されること。',sids=['end'])
r.fact('reset','設定変更・有利区間終了後コンティニュー','reset','リセット恩恵とボーナス抽選状態を確認したが、設定番号別の分布差は追加確認できない。')
r.done('wave-1',{'INITIAL_HIT':'リアルボーナス合算とAT初当りを確認。ボーナスを経由するAT経路を保持。','BONUS':'リアルボーナスは通常・ATで同じ抽選。消化中を除いた合算ゲーム数を対象。','SMALL_ROLE':'スイカ重複のみ設定差ありの公表。全設定分布がなく数値を補完しない。','CZ':'初期CZポイントの通常・AT×プラトニック・バトル4分布を保持。','AT':'通常ボーナス当選時初期ストック原分布を保持。消化中の追加と識別困難。','INTERNAL_CONDITIONAL_DRAW':'スイカ非重複高確19G・49G抽選を保持。内部ゲーム数の全件確定が困難。','STATE_TRANSITION':'夜ステージは高確示唆だが内部抽選結果の完全識別とは区別。','POINTS_GAME_DISTRIBUTION':'初期CZポイント4分布を参照保存。実観測で初期分と追加分を分けられない。','POST_EVENT_TRANSITION':'リアルボーナス後CZ・AT後コンティニューの経路を確認。','BONUS_TYPE_CONDITIONAL':'スイカ重複と確定背景の種別示唆を設定示唆から分離。','EVIDENCE':'JAC2ボイス、必殺技6種をボーナスあり・なしで分離、トロフィー6色を保持。','EXTERNAL_DATA_ONLY':'公式機種サイトに本機の完全な回数・抽選状態の取得方法は確認できない。','MACHINE_SPECIFIC':'必殺技の設定条件は同じ場面のボーナス当選時のみ。'},['絶対衝激 PLATONIC HEART 設定 ボーナス 高確 CZポイント','絶対衝激 PLATONIC HEART 必殺技 トロフィー 終了画面','絶対衝激 PLATONIC HEART リセット 遊技履歴'])

r=Research('L_WATASHI_NO_SHIAWASE_NA_KEKKON_PN')
for sid,url,title in [('identity','https://www.p-world.co.jp/machine/database/10270','わた婚 型式・ゲームフロー'),('end','https://nana-press.com/kaiseki/machine/979/30651/','コナミコマンド後AT終了画面'),('medley','https://nana-press.com/kaiseki/machine/979/31222/','わた婚メドレー'),('trophy','https://nana-press.com/kaiseki/machine/979/30650/','ボーナス終了画面・アリストロフィー'),('official','https://www.konami.com/amusement/psm/rendo/compatible_models.html','コナミ実機連動対応機種')]:r.source(sid,url,title,'official' if sid=='official' else 'primary_analysis')
r.fact('identity','Lわたしの幸せな結婚PN・KPE・2025年機','identity','型式と実機の同定を確認。')
r.fact('official','わた婚の公式実機連動対応','official','連動対応機種と確認したが個別の試行・回数の取得は未確定。')
r.numeric('bonus-initial','NORMAL_GAME_TRIAL','通常ゲーム数に対するわた婚ボーナス・エピソードボーナス初当り合算回数。AT中のエピソードボーナスは含めない。')
r.numeric('at-initial','NORMAL_GAME_TRIAL','通常ゲーム数に対する夢幻ラッシュ初当り回数。AT中の継続・上位移行は含めない。')
r.evidence('at-end','コナミコマンド入力後のAT終了画面',[('春（着物）','基本パターン',D),('夏','偶数設定示唆',P),('春（軍服）','高設定示唆',P),('秋','設定2以上',X),('冬','設定4以上',X),('お正月','設定6',X)],sids=['end'],details=['AT終了画面で↑↑↓↓←→←→の後CHANCEボタンを押して切り替わった画面を記録します。コマンド入力前の固定画面は対象ではありません。'])
r.evidence('medley-background','わた婚メドレーの背景',[('青（男性）','基本パターン',D),('ピンク（女性）','基本パターン',D),('赤','設定4以上',X),('紫','設定5以上',X),('金','設定6',X)],sids=['medley'],details=['ボーナスのムービーでわた婚メドレーを選んだ場合のキャラ紹介背景を記録します。'])
r.evidence('medley-characters','わた婚メドレーのキャラ紹介',[(x,'高設定・偶数設定示唆',P) for x in ['堯人','斎森真一','薄刃義浪','薄刃澄美']]+[(x,'高設定・奇数設定示唆',P) for x in ['辰石実','花','大海渡征']],sids=['medley'],details=['わた婚メドレー選択時の紹介画面を記録します。同じ画面が2G続いても1回の紹介として数えます。'])
r.evidence('alice-reference','アリストロフィー（本機の意味は確認待ち）',[(x,'従来機種参考のため現在は記録のみ',D) for x in ['銅','銀','金','クローバー柄','虹']],sids=['trophy'],details=['本機での出現は確認されていますが、色別の意味は従来機種を参考との注記があります。確認できるまでは設定を絞り込みません。'])
r.block('four-skip','4スルー後のボーナススルー天井','高設定ほど選ばれやすいとされていますが設定別の選択率が未公表で、5回目のエピソードが必ず天井契機とも確定できません。','設定別スルー回数分布と、天井契機で当選したことを判別する方法が公表されること。')
r.block('direct-at','通常時のAT直撃（スベリリプレイ等）','直撃経路はありますが、全設定の直撃率・成立役別当選率が公開されていません。','本機の全設定の直撃率と、試行範囲・当選契機を確定できる方法が公表されること。',sids=['identity'])
r.fact('mode-screens','久堂家・薄刃家・夕方・桜のボーナス終了画面','trophy','次回モードの示唆であり設定番号の確定条件ではない。')
r.done('wave-1',{'INITIAL_HIT':'通常時ボーナス・AT初当りを確認。AT中ボーナスを除外。','BONUS':'ボーナスを経由するATと通常直撃を調査。単純に同時独立加算しない。','CZ':'異形バトルの経路を確認。全設定の独立した成功分布は未確認。','AT':'初当りと直撃の数値公開範囲を確認。','MODE_TRANSITION':'ボーナス終了画面は次回モードを示唆。設定確定へ流用しない。','POINTS_GAME_DISTRIBUTION':'異形ポイント・規定G数を確認。設定別の完全な分布は未確認。','THRESHOLD_BEHAVIOR':'4スルー後ボーナス天井は公開分布と契機識別が不足し保留。','RESET_BEHAVIOR':'設定変更時の天井短縮とモードは設定番号の差と分離。','POST_EVENT_TRANSITION':'ボーナスからAT、ATから夢屋敷への遷移を確認。','BONUS_TYPE_CONDITIONAL':'通常とAT中のエピソードボーナスを区別する。','EVIDENCE':'コマンド後終了画面6種、背景5種、示唆キャラ7名、参考トロフィー5色を具体化。','EXTERNAL_DATA_ONLY':'公式の実機連動対応は確認。取得項目・同一区間母数は未確定。','MACHINE_SPECIFIC':'コマンド入力・メドレー選択・2G同じ紹介画面の数え方を明記。'},['わたしの幸せな結婚 スマスロ 設定 スルー 天井 直撃','わたしの幸せな結婚 メドレー 終了画面 設定','わたしの幸せな結婚 リセット e-slot 連動'])

r=Research('LB_TRIPLE_CROWN_SF4')
r.source('identity','https://www.p-world.co.jp/machine/database/10299','LBトリプルクラウン LBTCSF4')
r.fact('identity','LBTCSF4・設定1/2/5/6・2025年岡崎産業機','identity','X300やセブンFGは別機種。設定3・4を追加しない。')
for f in r.seed['numericalCandidates']:
 fid=f['findingId'];cond=f['observationType']=='conditional_probability'
 scope=('通常時の'+('チェリー' if fid.startswith('cherry') else 'プラム')+'成立回数に対する重複ボーナス当選回数。ボーナス・BT中は対象外。') if cond else '総ゲーム数（ボーナス・BTを除く通常時）に対する'+f['label']+'回数。ボーナス中・BT中の当選・小役は含めない。'
 r.numeric(fid,f['trialUniverse'] if cond else 'TOTAL_GAME_TRIAL',scope)
r.evidence('big-end-led','BIG終了時のLED',[('クラウンランプ点滅','高設定示唆',P),('クラウン＋下パネル点滅','設定2以上',X),('バットランプ青点滅','設定5以上',X)])
r.evidence('big-end-special','BIG終了時のSpecialトロフィー',[('緑','高設定示唆（弱）',P),('赤','高設定示唆（強）',P),('レインボー','設定6',X)],details=['BIG終了時にPUSHが点灯した場合に押して確認します。MB入賞時の点灯方向とは別です。'])
r.evidence('mb-special','MB入賞時のSpecialトロフィー',[('下から上','奇数設定示唆',P),('上から下','偶数設定示唆',P)])
r.evidence('reg-end','REG終了時のLED',[('クラウン＋下パネル点滅','設定5以上',X),('バットランプ青点滅','設定6',X)])
r.evidence('chain-music','100G以内連続ボーナスの楽曲',[('BIG：琉球メドレー','高設定示唆',P),('REG：安里屋ユンタ','偶数設定示唆',P)],details=['ボーナス間100G以内の連続当選時だけが対象です。琉球メドレーはじんじん・てぃんさぐぬ花・安里屋ユンタの順です。'])
r.fact('replay-bonus','リプレイ重複ボーナス当選率3.95%','analysis','全設定共通であるため単独の設定差情報がない。')
r.block('led-rate','BIG終了LED・Specialトロフィーの条件別出現率','連チャン獲得枚数・BB in BBで出やすさが変わりますが、設定別の数値出現率は未公表です。','連チャン獲得枚数等の条件別・設定別の全出現率が公表されること。')
r.done('wave-1',{'INITIAL_HIT':'通常時BIG・REG・合算を確認し集約と内訳の重複を保持。','BONUS':'単独・チェリー重複・プラム重複各BIG/REG/合算を原分布保存。','SMALL_ROLE':'通常時チェリー・プラムを評価。BT中を除外。','CZ':'CZはないノーマルBT機。','AT':'AT機ではなくボーナストリガー機。','INTERNAL_CONDITIONAL_DRAW':'成立役別同時当選率を確認。','MODE_TRANSITION':'告知モードと設定番号の推測を区別。','STATE_TRANSITION':'通常とボーナス・BTは抽選状態が異なるため対象範囲を明記。','SUCCESS_RATE':'チェリー・プラム同時当選率を保存。','POINTS_GAME_DISTRIBUTION':'設定推測用の内部ポイント分布はない。','CARRY_OVER':'ボーナス間100G連チャンと獲得枚数条件を確認。','THRESHOLD_BEHAVIOR':'100G連チャンBGM、1000/2000枚帯、BB in BBでのLED発生傾向を確認。','RESET_BEHAVIOR':'天井非搭載。設定別のリセット恩恵分布は確認できない。','POST_EVENT_TRANSITION':'BIG終了とREG終了でLEDの意味を別カテゴリへ分離。','NAVIGATION':'MB入賞時点灯方向は奇偶示唆。','ROLE_CONDITIONAL_DISTRIBUTION':'リプレイ重複3.95%は全設定共通。その他成立役別原分布を保持。','BONUS_TYPE_CONDITIONAL':'通常時初当り内訳をBT中ボーナスと混ぜない。','EVIDENCE':'BIG LED3種、Special3色、MB2方向、REG LED2種、連チャン楽曲2種を具体化。','EXTERNAL_DATA_ONLY':'メーカー公式等の案内を確認し、本機の母数・役回数を保証する外部連動取得は未確認。','MACHINE_SPECIFIC':'設定集合1・2・5・6とBT状態範囲を固定。'},['LBトリプルクラウン SF4 設定 小役 重複','LBトリプルクラウン SF4 設定 トロフィー LED 楽曲','LBトリプルクラウン SF4 BT リセット 公式'],na=['CZ','AT','POINTS_GAME_DISTRIBUTION'])

r=Research('LB_MATADOR_3_TT')
r.source('official','https://www.kitadenshi.co.jp/slot/matador3/','北電子マタドールⅢ製品情報','official')
r.source('identity','https://hazuse.com/machine/pachislot/SX0108/genre/208/','LBマタドールIII TT 型式と設定推測')
r.source('flow','https://nana-press.com/kaiseki/machine/997/31346/','BIG・BT・REGの流れ')
r.fact('identity','LBマタドールⅢTT・北電子・2025年機','identity','マタドールⅡ等とは別機種。設定1～6を確認。')
for fid in ['bb','reg','bonus-total']:r.numeric(fid,'TOTAL_GAME_TRIAL','総ゲーム数（ボーナス・BTを除く通常時）に対する'+next(x['label'] for x in r.seed['numericalCandidates'] if x['findingId']==fid)+'初当り回数。ボーナス後半へのJAC入賞は初当りに含めない。',sids=['official','analysis'])
r.numeric('bt-one-coin','BT_GAME_TRIAL','BT中ゲーム数に対する1枚役（バラケ目）成立回数。BIG前半の終了後からJAC入賞による後半開始までの1枚掛けゲームだけを対象にする。',status='DIRECT_EXACT',sids=['analysis','flow'],details=['BIG回数やボーナス全体のゲーム数で代用せず、BTで消化したゲーム数を数えてください。通常のJAC目は1枚役に含めません。'])
r.evidence('condor','枚数調整成功時のコンドルランプ',[(x,'高設定期待度：青＜黄＜緑＜赤＜紫（確定ではない）',P) for x in ['青','黄','緑','赤','紫']],details=['ボーナス中の枚数調整に成功してランプが点灯した場面だけを記録します。'])
r.evidence('panel-flash','ボーナス終了時のパネルフラッシュ',[('上下パネル同時フラッシュ','高設定示唆',P)],details=['ボーナス終了時に上下のパネルが同時にフラッシュした場合だけを記録します。'])
r.fact('bt-flow','BIG前半→BT→BIG後半のJAC入賞','flow','BT経由の後半開始は新しいBIG初当りではない。')
r.done('wave-1',{'INITIAL_HIT':'通常時BIG・REG初当り、合算を公式数値と照合。','BONUS':'BIG前半・BT・後半の同一ボーナスを重複して初当りとして数えない。','SMALL_ROLE':'BT中の1枚役は全6設定で最大128倍差。通常ゲーム数で代用しない。','CZ':'CZなしのノーマルBT機。','AT':'ATなしのノーマルBT機。','STATE_TRANSITION':'BTは1枚掛け、JAC入賞でBIG後半。状態を限定して観測。','SUCCESS_RATE':'BT1枚役の成立率を独立したBTゲーム数で記録。','POINTS_GAME_DISTRIBUTION':'内部ポイントに基づく設定差候補はない。','POST_EVENT_TRANSITION':'ボーナス終了パネルフラッシュと枚数調整成功ランプを分離。','NAVIGATION':'枚数調整手順・JAC停止形とバラケ目を確認。','EVIDENCE':'コンドル5色と上下同時フラッシュを保持。設定確定とはしない。','EXTERNAL_DATA_ONLY':'北電子公式機種・特設サイトで製品を確認。対象抽選回数を保証する外部履歴連動は未確認。','MACHINE_SPECIFIC':'BTゲーム数を母数として固定。BIG回数を試行数として代用しない。'},['マタドールⅢ TT 設定 ボーナス 1枚役','マタドールⅢ 設定 コンドル パネルフラッシュ','マタドールⅢ BT リセット 遊技履歴 公式'],na=['CZ','AT','POINTS_GAME_DISTRIBUTION'])

# Wave 2. Observation scopes are verified against the individual event rules.
def distribution(r,fid,label,rows,labels,trial,scope,sids=None):
 return r.add({'findingId':fid,'label':label,'observationType':'appearance_distribution','settingDistribution':pct(rows,labels),'sourceIds':sids or ['analysis'],'trialUniverse':trial,'denominatorSemantics':scope,'liveObservation':{'status':'DIRECT_EXACT','reason':scope},'categoryModel':{'residualPolicy':'SOURCE_EXHAUSTIVE'},'details':[scope]})
def linked(r,fid,label,cats,target,sids=None,details=None):
 f=r.evidence(fid,label,cats,sids,details)
 for c in f['semanticCategories']:c['linkedFindingId']=target
 return f
def nums(vals):return dict(zip(map(str,range(1,7)),[x/100 for x in vals]))

r=Research('L_TENSEI_SHITARA_KEN_DESHITA_GT')
r.source('identity','https://www.p-world.co.jp/machine/database/10308','転生したら剣でしたGT 型式・ゲームフロー')
r.source('official','https://www.konami.com/amusement/psm/slot/tenken-anime/00_top.html','転剣 コナミ公式','official')
r.fact('identity','2025年L転生したら剣でしたGT','identity','グレードワン製造・コナミブランドの本機を確認。')
r.fact('official','転剣の公式機種・e-slot+体験版','official','遊技履歴を完全な内部状態の観測とみなさない。')
for fid in ['cz','bonus','cz-bonus-total','at']:r.numeric(fid,'NORMAL_GAME_TRIAL','通常ゲーム数に対する'+next(x['label'] for x in r.seed['numericalCandidates'] if x['findingId']==fid)+'回数。AT中ボーナス、引き戻し・セット継続は含めない。')
for fid in ['weak-chance-normal','weak-chance-high','weak-chance-super']:
 r.numeric(fid,'WEAK_CHANCE_INTERNAL_STATE_TRIAL','弱チャンス目成立時の内部通常・高確・超高確を確定した試行のみが対象。',status='UNRESOLVED',reason='成立時の内部ボーナス抽選状態は、ステージの示唆だけでは全件確定できません。')
f=r.numeric('fran-rest','FRAN_REST_ENTRY_TRIAL','フランおやすみ中の突入回数に対する、突入時抽選だけでのAT当選回数。消化中の追加抽選当選を含めない。',status='UNRESOLVED',reason='突入時と消化中のAT当選を区別して全件確定できません。')
f['label']='フランおやすみ中突入時のAT当選';f['details']=['AT中の休憩移行率ではありません。突入時のAT抽選で、消化中にも追加抽選があるため原分布を保持して保留します。']
r.evidence('fran-character','フランボーナスのキャラ紹介',[(a,b,t) for a,b,t in [('フラン（青）','基本パターン',D),('ネル（ピンク）','高設定示唆（弱）',P),('アマンダ（緑）','高設定示唆（強）',P),('ウルシ（赤）','設定2以上',X),('フェンリル（紫）','設定4以上',X),('混沌の女神（金）','設定6',X)]])
r.evidence('x-story','X転剣ボーナスのストーリー',[(f'第{i}話','話数が大きいほど高設定期待度が高い。出現率は未公表。',P) for i in range(1,12)]+[('第12話（赤文字）','設定4以上',X)])
r.evidence('x-issen','一閃乗せの表示',[(a,b,X) for a,b in [('+22G','設定2以上'),('+33G','設定3以上'),('+4G','設定4以上'),('+5G','設定5以上'),('+6G','設定6')]],details=['表示値の設定示唆を記録します。実際の上乗せは3桁です。通常の上乗せや食事連打とは別に数えます。'])
r.evidence('curry-kind','寸胴カレー完成時の種類',[('中辛3個で完成','基本パターン',D),('辛口3個で完成','上乗せ・ボーナスのチャンス。設定確定ではない。',D),('甘口3個で完成','設定2以上',X)],details=['1個・2個で終了した場合は完成ではないため、この欄へ記録しません。'])
r.evidence('curry-game','カレー食事の連打での表示',[(f'+{i}G','設定6' if i==6 else f'設定{i}以上',X) for i in [4,5,6]])
r.evidence('speed-lamp','ゴブリンスタンピード終了時のCHANCEランプ',[('白','基本パターン',D),('青','奇数設定示唆',P),('黄','偶数設定示唆',P),('緑','高設定示唆',P),('赤','設定2以上',X),('紫','設定4以上',X),('虹','設定6',X)],details=['スピードランクS・Aの終了画面でCHANCEボタンを押して確認します。ランクで出現率が異なるため、現在は確定条件と記録のみを使用します。'])
r.evidence('alice-trophy','AT終了画面のアリストロフィー',[(a,'設定6' if i==6 else f'設定{i}以上',X) for a,i in [('銅',2),('銀',3),('金',4),('クローバー柄',5),('虹',6)]])
r.evidence('at-end','AT終了画面',[('フラン＋師匠','基本パターン',D),('フラン＋師匠（白背景）','高設定示唆（弱）',P),('フラン＋師匠（黒背景）','高設定示唆（強）',P),('水着フラン','設定2以上',X),('和服フラン','設定4以上',X),('全員集合','設定6',X)])
r.evidence('win-count','獲得枚数の特別表示',[('456OVER','設定4以上',X),('666OVER','設定6',X)])
for bid,label,raw,reason in [('d-blue','Dアイコン青でのCZ成功',None,'設定差ありと公表されていますが、全設定の成功率が揃っていません。'),('d-yellow','Dアイコン黄でのCZ成功',None,'設定差ありと公表されていますが、全設定の成功率が揃っていません。'),('mode2-second','朝一X転剣0回・AT2回目のATモード2',{'SET_1':'約7%'},'設定1だけの公開値です。内部ATモードを天井の結果だけで全件識別することもできません。'),('reset-mode','リセット時の通常モード振り分け',{'SET_1':{'B':'40%','C':'40%','天国':'20%'}},'設定1のみの公開分布で、設定2～6が不明です。'),('zones','300G・600GゾーンでのAT当選',{'SET_1':{'300-350G':'約25%','600-650G':'約21%'}},'設定1のみの公開値で、設定2～6が不明です。')]:r.block(bid,label,reason,'全設定の分布と対象条件を確定して数える方法が公表されること。',raw=raw)
r.fact('mode2-common','X転剣0回・AT3回目と5回目のATモード2','analysis','約30%は全設定共通。')
r.done('wave-2',{'INITIAL_HIT':'CZ・ボーナス・合算・AT初当りの経路を確認。','INTERNAL_CONDITIONAL_DRAW':'弱チャンス目3状態とフランおやすみ突入抽選の原分布を保留保存。','STATE_TRANSITION':'フランおやすみの突入と消化中AT抽選を区別。','CZ':'Dアイコン青・黄の設定差は全設定率不足。','MODE_TRANSITION':'朝一X転剣0回・AT2回目の設定1参考値を保持。','POINTS_GAME_DISTRIBUTION':'CZシナリオ・ATモードとボーナス天井を確認。モード示唆を確定試行としない。','RESET_BEHAVIOR':'設定1のB40/C40/天国20を補間しない。','POST_EVENT_TRANSITION':'おやすみ突入当選と追加抽選を区別できず保留。','EVIDENCE':'キャラ6・ストーリー12・一閃5・カレー・ランプ7・終了6・トロフィー5・枚数2を保持。','EXTERNAL_DATA_ONLY':'メニューでX転剣回数は確認可能。内部抽選の完全履歴ではない。'},['転生したら剣でした 設定差 フランおやすみ リセット コナミアミューズメントアプリ','転生したら剣でした 設定差 CZ 初期モード ランプ','転生したら剣でした 設定示唆 カレー 一閃乗せ 終了画面'])

r=Research('L_DARLING_IN_THE_FRANXX_SA')
r.source('identity','https://www.p-world.co.jp/machine/database/10319','ダーリンSA 機種概要・型式')
r.source('cz-detail','https://nana-press.com/kaiseki/machine/989/30978/','コネクトチャンス 初期レベル・最終抽選')
r.source('developer','https://spiky-crossalpha-trivia.jp/darli-fra/5334/','公式開発トリビア 初当りボーナス振り分け','official')
r.fact('identity','2025年LダーリンインザフランキスSA','identity','スパイキーの本機を確認。')
for fid in ['cz','bonus','bonus-high']:r.numeric(fid,'NORMAL_GAME_TRIAL','通常ゲーム数に対する'+next(x['label'] for x in r.seed['numericalCandidates'] if x['findingId']==fid)+'回数。ボーナス高確中の追加当選や復活・継続を初当りに混ぜない。')
for fid in ['frankx-high','cherry-high','chance-high']:r.numeric(fid,'NON_CONCENTRATION_'+('GAME_TRIAL' if fid=='frankx-high' else 'CHERRY_TRIAL' if fid=='cherry-high' else 'CHANCE_TRIAL'),'高確集中状態を除く通常状態だけのフランクス高確当選試行。',status='UNRESOLVED',reason='高確集中状態の全区間を外見だけで確定して除く方法が未確認です。')
labels=['レベル1（白）','レベル2（青）','レベル3（黄）','レベル4（緑）','レベル5（赤）']
distribution(r,'cz-start-level','CZ開始時の初期レベル',[[69.1,25,4.7,.8,.4]]*3+[[67.4,25.2,5.6,1.2,.7],[65.8,25.4,6.3,1.5,.9],[63,25.7,7.8,2.2,1.4]],labels,'CONNECT_CZ_START_TRIAL','コネクトチャンス開始時、最初の小役による昇格前に表示されたレベルを全件記録。フランクスジャッジのロボット名による期待度で代用しない。',['analysis','cz-detail'])
for level,vals in enumerate([[2.3,4.3,5.5,7,9.8,12.5],[5.9,8.1,9.5,11.3,14.5,17.5],[20.3,22.9,24.5,26.4,30.1,33.5],[50,52.9,54.7,57,61.1,65],[85.9,87.4,88.3,89.4,91.4,93.3]],1):
 r.raw('cz-final-level-'+str(level),f'CZ最終レベル{level}でのボーナス抽選',nums(vals),'CZ終了時の抽選当選と、後続のフェイク前兆中のレア役による成功書き換えを結果だけで区別できません。',['cz-detail'])
r.fact('cz-final6','CZ最終レベル6での当選','cz-detail','全設定100%で設定差なし。')
r.block('three-coin','3枚役（リプ小山）', '設定1・6の値のみで、設定2～5の全分布が未公表です。','本機の全設定の3枚役出現率が公表されること。',raw={'1':'1/32','6':'1/31.09'})
r.block('ape-entry','50GごとのAPEステージ移行','設定1・6の平均値のみで、内部モード別の試行分布と設定2～5が不明です。','全設定の抽選分布と対象のモードを数える方法が確立されること。',raw={'1':'約9.5%','6':'約13.2%'})
r.block('frankx-outcome','通常フランクス図柄停止時の移行先','設定1・6だけの移行先分布です。設定2～5を補間できません。','全設定の図柄別・状態別移行先分布が公開されること。',raw={'1':{'フランクス目':{'CZ':'99.22%','ボーナス':'.39%','上位CZ':'.39%'},'最強フランクス目・ストレリチア目':{'ボーナス':'87.5%','上位CZ':'12.5%'}},'6':{'フランクス目':{'CZ':'96.88%','ボーナス':'1.56%','上位CZ':'1.56%'},'最強フランクス目・ストレリチア目':{'ボーナス':'80.86%','上位CZ':'19.14%'}}})
r.block('bonus-type','基本状態でのダーリンボーナス振り分け','基本状態の設定1～3・6は公開されていますが設定4・5が不明です。フリーズ・上位CZ・昇格・スルー天井を除く条件も必要です。','全設定の基本状態の種別分布と観測条件が公開されること。',['developer'],raw={'1':'50%','2':'50%','3':'50%','6':'約57%'})
r.evidence('ed-card','エンディングのレア役カード',[('イクノ（白）','基本パターン',D),('ミク（青）','奇数設定示唆（弱）',P),('ココロ（黄）','高設定示唆（弱）',P),('イチゴ（緑）','高設定示唆（中）',P),('ゼロツー（赤）','設定2以上',X),('ストレリチア（虹）','設定6',X)])
r.evidence('ed-picture','エンディングのストレリチア目の一枚絵',[('トリカゴ','基本パターン',D),('Beautiful World','設定2以上を示唆（確定ではない）',P),('集合写真','設定3以上を示唆（確定ではない）',P),('女の子たち','設定4以上を示唆（確定ではない）',P),('絵本（まもの）','設定5以上を示唆（確定ではない）',P),('ゼロツー＆ヒロ','設定6',X),('ゼロツー','設定2以上',X)])
pictures=['ゼロツー（翼）','まものと王子様','絵本（鳥）','ゼロツー（幼少期）','ヒロ＆ゼロツー']
r.evidence('high-end-no-revival','ボーナス高確終了画面（復活なし）',list(zip(pictures,['基本パターン','設定2・4・6濃厚','設定3・5・6濃厚','設定4以上','設定6'],[D,X,X,X,X])),details=['終了画面のあと復活しなかったことを確認して記録します。復活した場合の確定条件は別の欄です。'])
r.evidence('high-end-revival','ボーナス高確終了画面（復活あり）',list(zip(pictures,['復活を記録','復活を記録・設定確定なし','復活を記録・設定確定なし','設定1否定','設定4以上'],[D,D,D,X,X])))
r.evidence('nami-trophy','ボーナス高確終了時のナミちゃんトロフィー',[('黒','次回終了画面でトロフィー出現',D),('銅','設定2以上',X),('銀','設定3以上',X),('金','設定4以上',X),('フランクス柄','設定5以上',X),('虹','設定6',X)])
r.evidence('win-count','ボーナスの特別獲得枚数表示',[(a,b,X) for a,b in [('002OVER','設定2以上'),('222OVER','設定2以上'),('456OVER','設定4以上'),('556OVER','設定5以上'),('666OVER','設定6')]])
r.done('wave-2',{'INITIAL_HIT':'CZ・ボーナス・ボーナス高確初当りの因果経路を明示。','CZ':'初期レベルは開始時の表示を観測。最終当選率は前兆中の成功書き換えと区別できず参照保存。','SMALL_ROLE':'3枚役の全設定分布は未公表。','STATE_TRANSITION':'高確集中状態を除く抽選の母数は完全識別が未確立。','BONUS_TYPE_CONDITIONAL':'公式開発者の基本状態限定DB比率を保持。中間設定は補間しない。','EVIDENCE':'カード6・一枚絵7・終了画面を復活有無で分離・トロフィー6・枚数5。','EXTERNAL_DATA_ONLY':'機種サイト・公式開発トリビアを確認。内部高確集中を保証する外部取得方法は未確認。'},['ダーリンインザフランキス 設定差 CZ初期レベル トロフィー スパイキー','ダーリンインザフランキス リセット 設定差 3枚役 履歴','ダーリンインザフランキス 初当りボーナス 振り分け 開発トリビア'])

r=Research('L_SAKI_CHOJO_KESSEN_YR')
r.source('identity','https://www.p-world.co.jp/machine/database/10297','咲頂上決戦YR 型式・ゲームフロー')
r.source('official','https://www.sanyobussan.co.jp/information/pdf/sanyo_press_release_20250604.pdf','三洋2025年咲頂上決戦発表','official')
r.fact('identity','2025年L咲-Saki-頂上決戦YR','identity','旧2020年機とは別機種。')
r.fact('official','2025年咲頂上決戦の公式発表','official','三洋物産製品の本機を確認。')
for fid in ['cz','at']:r.numeric(fid,'NORMAL_GAME_TRIAL','通常ゲーム数に対する'+next(x['label'] for x in r.seed['numericalCandidates'] if x['findingId']==fid)+'回数。AT継続・引き戻しを初当りとして足さない。')
for fid,rows,scope in [('ending-weak-lamp',[[59,28,13,0,0],[40,30,15,15,0],[38,31,16,15,0],[36,32,17,11,4],[34,33,18,10,5],[32,34,19,9,6]],'エンディング中のスイカ・弱チェリー成立時だけ、PUSHを押して和ランプの色を全件記録します。'),('ending-strong-lamp',[[0,50,50,0,0],[0,35,35,30,0],[0,34,36,30,0],[0,33,37,25,5],[0,32,38,23,7],[0,31,39,20,10]],'エンディング中のチャンス目・強チェリー成立時だけ、PUSHを押して和ランプの色を全件記録します。')]:
 f=r.numeric(fid,'ENDING_'+('WEAK' if 'weak' in fid else 'STRONG')+'_RARE_ROLE_TRIAL',scope,status='DIRECT_EXACT');f['settingDistribution']=pct(rows,['白','青','黄','緑','赤']);f['categoryModel']={'residualPolicy':'SOURCE_EXHAUSTIVE'}
 linked(r,fid+'-hints',f['label'],[('白','基本パターン',B),('青','高設定示唆（弱）',B),('黄','高設定示唆（中）',B),('緑','設定1否定',X),('赤','設定4以上',X)],fid,details=[scope])
distribution(r,'at-end-parity','AT終了画面の偶奇示唆2種類',[[60,40],[40,60],[60,40],[40,60],[60,40],[40,60]],['咲＆和','全国編ライバル'],'AT_END_PARITY_PICTURE_TRIAL','AT終了時に咲＆和、全国編ライバルのどちらかが出た画面だけを記録。その他のライバルモード・周期天井示唆画面はこの2種類の母数へ含めない。')
linked(r,'at-end-parity-hints','AT終了画面の偶奇示唆',[('咲＆和','奇数設定示唆',B),('全国編ライバル','偶数設定示唆',B)],'at-end-parity')
r.evidence('kujirakki','AT終了画面のクジラッキートロフィー',[(a,'設定6' if i==6 else f'設定{i}以上',X) for a,i in [('銅',2),('銀',3),('金',4),('クマノミ柄',5),('虹',6)]])
r.block('mode0','リセット・AT終了時のモード振り分け','設定1のみの分布です。設定2～6が未公表で内部モードを全件識別できません。','全設定のモード別分布と観測条件が公開されること。',raw={'1':{'通常':'54.8%','チャンス':'33.6%','福路':'9.6%','衣':'2%'}})
r.block('cz-skip','CZスルー1・2・6回目での当選','高設定での優遇の示唆だけで、全設定の当選率が揃っていません。','全設定のスルー回数別成功率が公開されること。')
r.block('kiyosumi','清澄チャレンジの緑・赤からの当選','設定1の緑35.1%・赤67.1%・合算48.3%のみです。','全設定の最終色別成功率が公開されること。',raw={'1':{'緑':'35.1%','赤':'67.1%','合算':'48.3%'}})
r.fact('bells','7枚ベルの実質確率と見た目確率','analysis','1/99.9と1/25.2は見た目との違いで、設定別の差は公表されていない。')
r.done('wave-2',{'CZ':'CZ初当り、スルー回数、清澄最終色を確認。公開率不足は保留。','INITIAL_HIT':'CZとATの当選経路を区別。','MODE_TRANSITION':'モード0分布は設定1のみ。','POINTS_GAME_DISTRIBUTION':'周期・スルー天井と設定差の示唆を確認。全設定数値がなければ補完しない。','EVIDENCE':'エンディング2条件×5色、終了画面2種類の条件付き偶奇分布、トロフィー5種類を保持。','EXTERNAL_DATA_ONLY':'本機の遊技履歴で終了画面を確認可能。内部モード全件取得は未確認。'},['咲 頂上決戦 設定差 AT終了画面 スロプラス','咲 頂上決戦 SLOプラス 三洋 公式 2025','咲 頂上決戦 設定差 清澄チャレンジ CZスルー'])

r=Research('S_KONOSUBA_ZR')
r.source('official','https://www.sammy.co.jp/japanese/myslot/news/','2022年このすばマイスロ対応','official')
r.source('nana','https://nana-press.com/kaiseki/machine/329/8724/','2022年このすば 設定差のあるポイント')
r.source('bath','https://nana-press.com/kaiseki/machine/329/8644/','このすば お風呂ゾーン')
r.source('steal','https://nana-press.com/kaiseki/machine/329/9279/','スティールバトル終了時ボイス')
r.fact('identity','2022年Sこの素晴らしい世界に祝福をZR','analysis','2024年A-SLOT+とは別機種。HAZUSE検定1S0949の本機。')
r.fact('official','2022年マイスロ対応の機種','official','外部遊技データ連携は確認。内部モード全件確定とは区別。')
r.numeric('at','NORMAL_GAME_TRIAL','通常ゲーム数に対するこのすばチャンス初当り回数。このすばRUSH昇格やぼーなす連続当選は初当りに含めない。')['label']='このすばチャンス初当り'
r.numeric('emergency-destroyer','EMERGENCY_QUEST_ENTRY_TRIAL','緊急クエスト突入回数に対するデストロイヤー選択回数。デュラハンとデストロイヤーの2種類が対象。',status='DIRECT_EXACT')
for fid,trial,label,scope in [('chance-seven','KONOSUBA_CHANCE_BONUS_GAME_TRIAL','このすばチャンス内ぼーなす中の7揃い','このすばチャンス内のこのすばぼーなす・ヒロインぼーなす消化ゲーム数に対する7揃い回数。布盗会・通常時・駄女神・真女神ぼーなすを含めない。'),('rush-seven','KONOSUBA_RUSH_BONUS_GAME_TRIAL','このすばRUSH内ぼーなす中の7揃い','このすばRUSH内のヒロイン・びっぐ・サキュバスぼーなす消化ゲーム数に対する7揃い回数。チョーカーチャレンジやチャンス内ぼーなすを含めない。')]:
 f=r.numeric(fid,trial,scope,status='DIRECT_EXACT');f['label']=label
voices=['もっと私を甘やかして','では、いってくりゅ！','私と一緒に爆裂道を…','前から思ってたんだけど…','人が深淵を覗く時…','そっちの名前で呼ぶなぁ～','真の男女平等主義者な俺は…','でーがらーし、めーがみが…','この邂逅は世界が選択せしサダメ！']
rows=[[66.81,30.52,.76,1.53,.38,0,0,0,0],[53.54,38.15,4.58,1.91,.76,1.07,0,0,0],[63.76,30.52,1.14,2.29,1.14,1.14,0,0,0],[50.87,38.15,4.58,2.67,1.91,1.22,.61,0,0],[60.25,30.52,1.53,2.90,2.29,1.30,.69,.53,0],[48.43,38.15,4.58,3.05,2.67,1.37,.76,.61,.38]]
f=r.numeric('at-end-voice','KONOSUBA_AT_END_PUSH_TRIAL','AT終了画面でPUSHを押して確認したボイスを全件記録。未確認の終了回数を分母に足さない。',status='DIRECT_EXACT');f['settingDistribution']=pct(rows,voices);f['categoryModel']={'residualPolicy':'SOURCE_EXHAUSTIVE'}
linked(r,'at-end-voice-hints','AT終了画面のPUSHボイス',list(zip(voices,['奇数設定示唆','偶数設定示唆（弱）','偶数設定示唆（強）','高設定示唆（弱）','高設定示唆（強）','設定2以上','設定4以上','設定5以上','設定6'],[B]*5+[X]*4)),'at-end-voice')
r.evidence('bonus-end','このすばぼーなす終了画面',[('OP・ウィズ','設定2で出にくい',P),('OP・ゆんゆん','設定3で出にくい',P),('OP・クリス','設定4で出にくい',P),('上を見ているアクア','設定1・3・4で少し出にくい',P),('にへら顔のめぐみん','設定2・3で少し出にくい',P),('上を見ているダクネス','設定2・4で少し出にくい',P),('働いている4人','高設定示唆（弱）',P),('4人を見ているウィズ','奇数設定・高設定示唆（弱）',P),('4人を見ているクリス','偶数設定・高設定示唆（弱）',P),('ミツルギ','設定2以上',X),('ベルディア','設定3以上',X),('寝ているアクア','設定4以上',X),('4人を見ているエリス','設定5以上',X),('4人の版権絵','設定6',X)])
r.evidence('debt','非有利区間の借金セリフ',[(f'{i}万エリス',m,X) for i,m in [(200,'設定2以上'),(246,'設定2・4・6濃厚'),(456,'設定4以上'),(506,'設定5以上'),(666,'設定6')]])
r.evidence('nav-voices','AT・ぼーなす中の特別ナビボイス',[('踊れ踊れ踊れ…','設定2以上',X),('女神の怒りを受けなさい…','設定4以上',X)])
for fid,label,vals in [('nav-2','設定2以上のナビボイス',[0,.0061,.0061,.0061,.0061,.0061]),('nav-4','設定4以上のナビボイス',[0,0,0,.0061,.0061,.0061])]:r.raw(fid,label+'の発生率',nums(vals),'ナビボイス抽選の対象ゲームと1回の抽選機会を保証する分母が未確定です。確定ボイスそのものは設定の絞り込みへ使用します。')
r.evidence('win-count','ATの特別獲得枚数表示',[('256枚OVER','設定2・5・6濃厚',X),('456枚OVER','設定4以上',X),('666枚OVER','設定6',X)])
for fid,label,vals in [('win256','256枚OVER',[0,.23,0,0,.23,.23]),('win456','456枚OVER',[0,0,0,.24,.26,.27]),('win666','666枚OVER',[0,0,0,0,0,.31])]:r.raw(fid,label+'の発生率',nums(vals),'表示抽選の対象機会を確定して数える方法が未確立です。表示の確定条件は独立に保持します。')
poses={'アクア':['ポテチ','一升瓶','パジャマ','べとべと','ドアップ'],'めぐみん':['杖を握りしめる','サムズアップ','うつむく','床ペロ','頬を引っ張る'],'ダクネス':['剣を握りしめる','頬を赤らめる','怒る','キャベツ取り','私服'],'ウィズ':['泣き顔','驚く','アクアに抱きつく','頬を赤らめる','ドアップ'],'ゆんゆん':['ドアップ','オープニング','スティール','ドアップ（泣き顔）','バニースーツ'],'クリス':['指をさす','スティール1','泣いたフリ','手を挙げる','スティール2']}
for char,ps in poses.items():r.evidence('victory-'+char,'布盗会勝利時の'+char+'の一枚絵',[(char+'：'+p,'設定6' if i==6 else f'設定{i}以上',X) for i,p in enumerate(ps,2)])
for tier in range(2,7):r.raw('victory-rate-'+str(tier),f'布盗会勝利時の設定{tier}以上一枚絵の振り分け',nums([0 if i<tier else [.11,.12,.14,.15,.16][i-2] for i in range(1,7)]),'設定段階ごとの合計振り分けは公開されていますが、キャラ・構図ごとの割当とカズマ基本画面を含む完全な表示母数が未確定です。')
for fid,label,vals in [('hidden-nonadv','非有利区間からの裏モード',[.8,.8,2.7,1.2,2.7,3.1]),('hidden-rush','このすばRUSH突入時の裏モード',[.8,.8,1.2,1.2,1.2,1.6])]:r.raw(fid,label+'突入率',nums(vals),'内部裏モードの初期選択と途中の挙動を全件区別して確定できません。')
for rank,vals in [('0～39',[6.3,7,7.8,8.6,9.4,10.2]),('40～59',[12.5,14.1,15.6,17.2,18.8,20.3]),('60～79',[37.5,39.1,40.6,42.2,43.8,45.3])]:r.raw('quest-rank-'+rank,'クエスト最終ランク'+rank+'の成功抽選',nums(vals),'最終抽選の失敗後もキャラ役で書き換えがあるため、演出の最終成功回数は公開された初期抽選の成功回数と一致しません。')
r.raw('bath-initial','有利区間移行時以外のお風呂ゾーン初期ポイント',pct([[87.5,10.5,1.2,.8]]*2+[[86.3,10.9,1.6,1.2]]*3+[[85.2,11.3,2,1.6]],['2pt','3pt','4pt','5pt']),'6キャラの抽選単位と消化中の倍増前の初期値を全件識別する方法を確認できません。有利区間移行時の初期値は対象へ混ぜません。',['bath'])
r.fact('steal','スティールバトル終了時ボイス','steal','モード・キャラ状態の示唆。設定番号の確定条件とは区別。')
r.source('trophy','https://www.slopachi-quest.com/article/konosuba-settei/','2022年このすば サミートロフィーと設定差')
r.evidence('sammy-trophy','サミートロフィー',[(a,'設定6' if i==6 else f'設定{i}以上',X) for a,i in [('銅',2),('銀',3),('金',4),('キリン柄',5),('虹',6)]],sids=['trophy','nana'])

r.block('mode-selection-replay','有利区間移行時バラケ目リプレイでのモード選択レベル','公開表の設定2～6は列結合のため列対応をまだ確定できません。内部レベルを全件識別する方法も未確立です。','原表の全設定の列対応と観測方法を確認できること。',['trophy'],raw={'columns':['レベル1','レベル2','レベル3','レベル4'],'1':['34.88%','31.25%','25.00%','9.38%'],'2':['36.56%','31.25%','10.94%'],'3':['24.22%','25.78%','18.75%'],'4':['21.88%','34.38%','12.50%'],'5':['17.97%','26.56%','24.22%'],'6':['6.25%','37.50%','25.00%']})
r.block('mode-selection-role','有利区間移行時の成立役別モード選択レベル','その他・弱キャラ役の公開表には列結合と合計不整合があり、全設定の列対応を確定できません。内部レベルも全件識別できません。','原表の列対応・誤記が確認でき、全件観測の方法が確立されること。',['trophy'],raw={'columns':['レベル1','レベル2','レベル3','レベル4'],'その他':{'1':['35.94%','45.31%','17.19%','1.56%'],'2':['26.69%','23.44%'],'3':['32.03%','17.97%','4.69%'],'4':['27.34%','24.22%','3.13%'],'5':['18.75%','8.59%'],'6':['20.31%','25.00%','9.38%']},'弱キャラ役':{'1':['50.00%','45.31%','3.91%','9.38%'],'2':['46.88%','7.03%','10.94%'],'3':['4.69%','18.75%'],'4':['43.75%','9.38%','12.50%'],'5':['44.14%','6.25%','24.22%'],'6':['38.28%','11.72%','25.00%']}})
for level,base,skw in [(1,[[59.98,.39,.39],[59.98,.39,.39],[57.03,.78,.78],[55.08,1.17,1.17],[52.34,1.95,1.95],[50.39,2.34,2.34]],[[39.45,.39,.39],[39.45,.39,.39],[39.84,.78,.78],[40.23,1.17,1.17],[40.63,1.56,1.56],[41.02,1.95,1.95]]),(2,[[50,5.86,.39],[50,5.86,.39],[45.31,7.81,.78],[41.80,9.38,1.17],[35.94,12.5,1.95],[32.42,14.06,2.34]],[[42.97,.39,.39],[42.97,.39,.39],[44.53,.78,.78],[45.31,1.17,1.17],[46.09,1.95,1.56],[46.88,2.34,1.95]])]:
 r.raw('eris-mode-level-'+str(level),f'右下エリス・アクア周期以外・モード選択レベル{level}の状態振り分け',pct([x+y for x,y in zip(base,skw)],['通常','高確','超高確','通常＋SKW','高確＋SKW','超高確＋SKW']),'モード選択レベルと内部通常・高確・超高確を全件確定できません。',['trophy'])
r.done('wave-2',{'INITIAL_HIT':'このすばチャンス初当りをRUSHへの昇格と区別。','BONUS':'7揃いをチャンス・RUSHの各ぼーなす消化中だけで数える。','CZ':'緊急クエスト選択とランク別最終抽選を確認。書き換えを混ぜない。','MODE_TRANSITION':'内部裏モードの初期当選率を参照保存。','POINTS_GAME_DISTRIBUTION':'お風呂初期ptの全設定分布を保持。初期値と倍増を全件区別する観測方法は未確立。','NAVIGATION':'ナビ2ボイスの確定条件と原確率を別に保持。','EVIDENCE':'終了ボイス9・ボーナス画面14・借金5・枚数3・布盗会30具体構図を保持。','EXTERNAL_DATA_ONLY':'2022年マイスロ対応を公式確認。2024年A-SLOT+のページを流用しない。'},['このすば ZR マイスロ 布盗会 トロフィー 2022','この素晴らしい世界に祝福を マイスロ 2022 サミー 公式','このすば 設定差 お風呂 初期ポイント スティールバトル'])

r=Research('S_RAKUEN_TSUHO_FS')
r.source('official','https://www.sammy.co.jp/japanese/myslot/news/index_2_1.html','2021年楽園追放マイスロ対応','official')
r.source('nah','https://nana-press.com/kaiseki/machine/146/4864/','NAH規定ゲーム数での内部高確抽選')
r.source('transition','https://1geki.jp/slot/s_rakuentsuiho/40/','有利区間開始時と30G特殊抽選')
r.source('episode','https://1geki.jp/slot/s_rakuentsuiho/86/','AT終了画面・特殊エピソード')
r.source('episode-nana','https://nana-press.com/kaiseki/machine/146/5092/','特殊エピソード原表')
r.source('rd-end','https://nana-press.com/kaiseki/machine/146/4872/','RD終了画面 原画像と条件別振り分け')
r.source('at-end','https://nana-press.com/kaiseki/machine/146/4873/','AT終了画面 原画像と条件別振り分け')
r.fact('identity','2021年S楽園追放FS・検定1S0218','analysis','サミーの2021年6.1号機を確認。')
r.fact('official','2021年楽園追放のマイスロ連携','official','マイスロ対応は確認。内部状態の全件取得とは区別。')
for fid in ['at','rd','initial-total']:r.numeric(fid,'NORMAL_GAME_TRIAL','通常ゲーム数に対する'+next(x['label'] for x in r.seed['numericalCandidates'] if x['findingId']==fid)+'回数。AT中BB・継続・RDからの同じ当選を二重計上しない。')
r.numeric('common-bell','TOTAL_GAME_TRIAL','総ゲーム数に対する共通ベル回数。共通ベル回数はマイスロLv4以上で取得し、見た目の押し順ベルとは区別する。',status='DIRECT_EXACT',details=['分母は総ゲーム数。マイスロLv4以上で共通ベル回数を取得できるため、7000G基準のSelection Score評価へ直接使用できる。'])
for state,role,event,vals in [('通常','チェリー','RD',[2.1,3.3,5,6.7,10,12.5]),('通常','チェリー','BB',[15,15.8,16.7,18.3,20,22.5]),('通常','チェリー','AT',[.4,.8,1.3,1.7,2.1,2.5]),('通常','弱スイカ','RD',[.4,.4,.8,1.3,1.7,2.1]),('高確','チェリー','RD',[25,26.3,27.5,30,35,40]),('高確','チェリー','AT',[.8,1.7,2.5,4.2,5,6.3]),('高確','弱スイカ','RD',[1.3,2.5,3.3,6.3,8.3,10])]:
 r.raw('role-'+state+'-'+role+'-'+event,state+'滞在中の'+role+'から'+event+'当選',nums(vals),'抽選時点の内部通常・高確を示唆だけで全件確定できず、途中の別役による当選と区別もできません。')
r.block('normal-suika-bb','内部通常・弱スイカからBB当選','設定4の原表が「8.3５」となっており数値の誤記確認が必要です。内部状態と当選契機を全件識別する方法も未確立です。','原値の誤記と全件観測方法が確認できること。',raw={'1':'3.3%','2':'5.8%','3':'6.7%','4':'8.3５','5':'10.0%','6':'12.5%'})
for games,short,long in [(50,[20,22.5,25,30,35,50],[0]*6),(200,[22.5]*6,[2.5,5,10,25,30,35]),(400,[35]*6,[5,7.5,10,15,17.5,20])]:
 r.raw('nah-'+str(games),f'{games}G消化時のNAH高確移行',pct([[x,y,100-x-y] for x,y in zip(short,long)],['ショート','ロング','非移行']),'NAH高確の内部ショート・ロングは、NAH演出の発生回数から全件確定できません。',['nah'])
r.raw('adv-rd','有利区間移行時だけのRD抽選',nums([5,6.3,10,16.7,25,30]),'30G特殊抽選による当選と同じ前兆で告知されるため、移行時だけの当選を全件分けられません。',['transition'])
r.raw('adv-30-total','有利区間開始30G時点のRD・AT実質当選',nums([14.4,16.1,19.8,26.6,34.6,39.6]),'有利区間開始の抽選と30G特殊抽選を合算した値です。対象区間の全件同定と通常の初当りとの二重評価を解決する必要があります。',['transition'])
for state,role,event,vals in [('高確','チェリー','RD',[31,32.3,33.5,36,41,46]),('高確','弱スイカ','RD',[3.3,4.5,5.3,8.3,10.3,12]),('通常','チェリー','RD',[5.1,6.5,8.3,10.3,14,17]),('通常','弱スイカ','RD',[1.1,1.6,2.2,2.9,3.7,4.6])]:r.raw('special30-'+state+'-'+role,'有利区間開始30G・'+state+'中の'+role+'からRD',nums(vals),'30G特殊抽選中にも内部高確から転落するため、成立時の内部状態と当選契機を全件確定できません。',['transition'])
rdlabels=['基本パターン','奇数示唆','偶数示唆','高設定示唆弱','高設定示唆強','設定2以上画面','設定3以上画面','設定4以上画面','設定5以上画面','設定6画面','復活示唆（非復活で1・2・4否定）','復活示唆（非復活で1・3否定）']
atlabels=['基本パターン','奇数示唆','偶数示唆','設定4以上画面','設定5以上画面','設定6画面','復活示唆（非復活で4・6）']
for i,t in enumerate(json.load(open(BASE/'source-tables/rakuen-end-distributions.json'))):
 labels=rdlabels if t['phase']=='RD' else atlabels
 vals={k:' / '.join(f'{a} {v}%' for a,v in zip(labels,row)) for k,row in t['rows'].items()}
 f=r.raw('end-distribution-'+str(i),t['phase']+'終了画面 '+t['games']+t['revival'],vals,'設定別出現率は条件別に公開されています。ただし定量推測には、各観測を消化ゲーム帯・復活有無・画面カテゴリへ正しく結び付ける必要があります。現行Runtimeでこの条件付き観測を誤りなく入力できる契約が未確立のため、原表を保持して直接推測にはまだ使用しません。',['analysis','rd-end' if t['phase']=='RD' else 'at-end'],trial='END_PICTURE_'+str(i)+'_TRIAL')
 f['sourceCondition']={'games':t['games'],'revival':t['revival'],'imageIdentityStatus':'UNRESOLVED','rounding':'SOURCE_ORIGINAL_NOT_NORMALIZED'}
r.evidence('rd-end-exact','RD終了画面の設定確定・否定',[
 ('復活なし＋復活示唆','設定1・2・4否定',X),
 ('復活なし＋復活示唆（強）','設定1・3否定',X),
 ('設定2以上画面','設定2以上',X),
 ('設定3以上画面','設定3以上',X),
 ('設定4以上画面','設定4以上',X),
 ('設定5以上画面','設定5以上',X),
 ('設定6画面','設定6',X)
])
r.evidence('at-end-exact','AT終了画面の設定確定',[
 ('復活なし＋復活示唆','設定4または6',X),
 ('設定4以上画面','設定4以上',X),
 ('設定5以上画面','設定5以上',X),
 ('設定6画面','設定6',X)
])
for sec,fid,label,vals in [(150,'episode150','150秒防衛時の仁義',[6.25,12.5,6.25,12.5,6.25,12.5]),(900,'episode900','900秒防衛時の邂逅',[6.25,6.25,12.5,12.5,18.75,18.75])]:
 r.add({'findingId':fid,'label':label,'observationType':'conditional_probability','settingDistribution':nums(vals),'sourceIds':['episode','episode-nana','analysis'],'trialUniverse':'DEFENSE_'+str(sec)+'_EPISODE_TRIAL','denominatorSemantics':f'{sec}秒防衛のタイムエピソードを確認した回数に対する、赤枠の特殊エピソード出現回数。その他の防衛時間や通常エピソード以外の当選は混ぜない。','liveObservation':{'status':'DIRECT_EXACT','reason':'規定防衛時間とタイトル・赤枠を直接確認できる。'}})
 linked(r,fid+'-hint',label,[(label,'偶数設定示唆（弱）' if sec==150 else '高設定示唆',B)],fid)
r.add({'findingId':'episode400','label':'400秒防衛時の結束','observationType':'conditional_probability','settingDistribution':nums([6.25,18.75,6.25,18.75,6.25,18.75]),'sourceIds':['episode','episode-nana','analysis'],'trialUniverse':'DEFENSE_400_EPISODE_TRIAL','denominatorSemantics':'400秒防衛のタイムエピソードを確認した回数に対する、赤枠の特殊エピソード「結束」出現回数。その他の防衛時間や通常エピソードは混ぜない。','liveObservation':{'status':'DIRECT_EXACT','reason':'規定防衛時間400秒と赤枠・タイトル「結束」を直接確認できる。'},'details':['実機画像でもタイトル「結束」を確認済み。名称不一致の保留は解消。PER_ELIGIBLE_TRIAL_POWER=5.3626559657でJOINT_ELIGIBLE（補助）として条件付き数値推測へ採用する。']})
linked(r,'episode400-hint','400秒防衛時の結束',[('400秒防衛時の結束','偶数設定示唆（強）',B)],'episode400')
r.evidence('win-count','ATの特別獲得枚数表示',[(f'{i}{i}{i}枚OVER','設定6' if i==6 else f'設定{i}以上',X) for i in [2,4,5,6]])
r.fact('role-common','高確チェリーBB30%・高確弱スイカBB10%','analysis','全設定共通の当選率。')
r.done('wave-2',{'INITIAL_HIT':'AT・RD・BBを含む合算の経路を確認。','SMALL_ROLE':'共通ベルは目視識別不可だが、マイスロLv4以上で回数取得可能。分母は総ゲーム数として扱う。','MODE_TRANSITION':'状態別レア役当選とNAH内部3状態を保持。内部状態の完全識別は未確立。','STATE_TRANSITION':'有利区間開始抽選と30G特殊抽選を区別。','POINTS_GAME_DISTRIBUTION':'NAH50/200/400G、150/400/900秒エピソードを確認。','RESET_BEHAVIOR':'有利区間開始時RD抽選を別候補として保持。','POST_EVENT_TRANSITION':'AT/RD終了画面16条件別の設定別出現率を保持。数値自体は確認済みで、条件付き観測をRuntimeへ安全に結び付ける契約の確立待ち。','EVIDENCE':'獲得枚数4種類に加え、RD/AT終了画面の設定確定・設定否定条件をExact Constraintとして採用。条件付き出現率そのものは数値推測に使用しない。','EXTERNAL_DATA_ONLY':'2021年マイスロ対応・Lv4共通ベル回数取得を確認。','MACHINE_SPECIFIC':'400秒特殊エピソードは複数ソース照合で「結束」と確定し、条件付き数値推測候補へ昇格。'},['楽園追放 RD終了画面 アンジェラ ディンゴ 復活','楽園追放 AT終了画面 フロンティアセッター 原っぱ 共通ベル マイスロ','楽園追放 設定 RD 終了画面 消化ゲーム数 有利区間 リセット'])
