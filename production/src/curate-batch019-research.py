"""Reconcile the unchanged 90-row v9 handoff against pinned repository Research.
Candidate-local source corrections only; no evaluator, eligibility or policy changes.
"""
import json,pathlib,copy,hashlib
R=pathlib.Path(__file__).resolve().parents[1]; I=R/'research-inbox/batch019'; O=I/'reviewed';O.mkdir(parents=True,exist_ok=True)
B='batch-20261017-019';DATE='2026-10-17'
sel=json.loads((R/'next-machine-selection-20261017.json').read_text())['selected']; original=json.loads((I/'imported-handoff/candidates_v9.json').read_text()); C={c['candidate_id']:c for c in original};D={};changes=[]
DOMAINS='INITIAL_HIT BONUS SMALL_ROLE CZ AT INTERNAL_CONDITIONAL_DRAW MODE_TRANSITION STATE_TRANSITION SUCCESS_RATE POINTS_GAME_DISTRIBUTION CARRY_OVER THRESHOLD_BEHAVIOR RESET_BEHAVIOR POST_EVENT_TRANSITION NAVIGATION ROLE_CONDITIONAL_DISTRIBUTION BONUS_TYPE_CONDITIONAL EVIDENCE EXTERNAL_DATA_ONLY MACHINE_SPECIFIC'.split()
for i,s in enumerate(sel,1):
 old=json.loads((I/'repository-baseline'/s['machineId']/'research-data.json').read_text())
 d={'schemaVersion':'research-v1','manifestVersion':'8.5','batchId':B,'machineId':s['machineId'],'machineName':s['displayName'],'researchStage':'SOURCE_REVIEW_COMPLETE_PENDING_FORMAL_ACCEPTANCE','settings':{'values':old['machine']['settings'],'numericInferenceValues':old['machine']['settings'],'status':'PINNED_REPOSITORY_IDENTITY_MATCHED'},'machineIdentity':old['machine'],'sources':[],'findings':[],'blockedItems':[],'researchCompleteness':{'version':2,'domains':[],'machineSpecificQueries':[],'candidateLedger':[]},'reviewAuthority':{'sourceBranch':'production/v85-batch-018-research-20261017','sourceCommit':'38509785030225a5746dbc161a6fd6d64ae77e79','distributionCommit':'34f01c4e3be2381e25b44e79ceb58e74fc8ede90','candidateExploration':'LIMITED_CLOSEOUT','externalAudit':'NOT_PERFORMED; repository cross-check and source self-audit only'},'_old':old}
 D[i]=d

def source(i,url,title=None):
 d=D[i];s=next((x for x in d['sources'] if x['url']==url),None)
 if not s:
  s={'sourceId':f's{len(d["sources"])+1:02}','url':url,'title':title or d['machineName']+' 候補照合','sourceType':'published_analysis','claims':[],'checkedAt':DATE};d['sources'].append(s)
 return s['sourceId']
def default(i,c):
 cc=C.get(c,{});url=cc.get('review_v9',{}).get('source') or cc.get('research_v8_source') or cc.get('reviewed_source_url_v7') or (cc.get('reference_urls') or [D[i]['_old']['sources'][0]['url']])[0]
 return [source(i,url)]
def put(i,c,obj,block=False):
 d=D[i]
 for k in ['findings','blockedItems']:d[k]=[x for x in d[k] if x.get('findingId',x.get('blockId'))!=c]
 cc=C.get(c);o={('blockId' if block else 'findingId'):c,'label':cc['title'] if cc else c,**obj};o.setdefault('sourceIds',default(i,c));d['blockedItems' if block else 'findings'].append(o)
 if cc:o['retainedHandoffClaim']={'parameters':cc['parameters'],'condition':cc['condition'],'dependency':cc['dependency'],'verification':cc.get('verification_status')}
 return o
def block(i,c,reason,vals=None,sids=None,label=None):
 o=put(i,c,{'reason':reason,'reevaluationCondition':'不足する設定別値や観測条件を解決する新しい具体的な公開資料が得られた場合、この項目だけ再確認します。',**({'sourceIds':sids} if sids else {}),**({'label':label} if label else {})},True)
 if vals is not None:o['retainedPublishedValues']=vals
 return o
def keys(i):return [v.replace('SET_','') for v in D[i]['settings']['numericInferenceValues']]
def rate(i,c,scope,vals=None,universe='NORMAL_GAME_TRIAL',conditional=False,sids=None,label=None):
 if vals is None: vals={k:'1/'+str(v) for k,v in C[c]['parameters'].items()}
 elif isinstance(vals,list):vals=dict(zip(keys(i),vals))
 return put(i,c,{'observationType':'conditional_probability' if conditional else 'probability','trialUniverse':universe,'settingDistribution':vals,'denominatorSemantics':scope,'details':[scope],'liveObservation':{'status':'EXACT_WITH_SCOPE_TRACKING','reason':scope},**({'sourceIds':sids} if sids else {}),**({'label':label} if label else {})})
def evidence(i,c,pairs,scope,sids=None,label=None):
 cats=[]
 for l,m in pairs:
  sem='DISPLAY_ONLY' if m=='デフォルト' else ('EXACT_CONSTRAINT' if ('設定' in m and '示唆' not in m and '推定' not in m and '未確認' not in m) else 'PROBABILITY_UNKNOWN')
  cats.append({'label':l,'meaning':m,'semanticType':sem})
 return put(i,c,{'observationType':'evidence','semanticCategories':cats,'details':[scope,'設定別の出現率が未確認の項目は記録のみ・推測計算には使用しない。設定確定・否定の項目は候補の絞り込みに反映します。'],**({'sourceIds':sids} if sids else {}),**({'label':label} if label else {})})
def categorical(i,c,labels,rows,scope,sids=None,label=None):
 vals=dict(zip(keys(i),[' / '.join(f'{l}: {p:.10g}%' for l,p in zip(labels,row)) for row in rows]))
 return put(i,c,{'observationType':'appearance_distribution','trialUniverse':'CONDITIONAL_EVENT_TRIAL','settingDistribution':vals,'categoryModel':{'residualPolicy':'SOURCE_EXHAUSTIVE'},'denominatorSemantics':scope,'details':[scope],'liveObservation':{'status':'EXHAUSTIVE_CATEGORICAL','reason':scope},**({'sourceIds':sids} if sids else {}),**({'label':label} if label else {})})
def group(i,cs,gid,reason,kind='CAUSAL_PATH_OVERLAP'):
 for f in D[i]['findings']:
  if f['findingId'] in cs and 'settingDistribution' in f:
   f.update(dependencyGroupId=gid,dependencyKind=kind,dependencyReason=reason,dependencyScopeAudit={'status':'KNOWN_DEPENDENCY_DEFERRED_TO_CONTRACT','evidenceSourceIds':f['sourceIds'],'reason':reason})
def legacyrate(i,c,fid,scope,universe='NORMAL_GAME_TRIAL',conditional=False):
 f=next(x for x in D[i]['_old']['features'] if x['researchFeatureId']==fid)
 oldsrc={x['sourceId']:x for x in D[i]['_old']['sources']};ids=[source(i,oldsrc[x]['url']) for x in f['sourceRefs']]
 vals={k.replace('SET_',''):v['probability'] for k,v in f['settingValues'].items()}
 return rate(i,c,scope,vals,universe,conditional,ids,f['name'])
# Default is a retained, explicitly bounded missing-data disposition; every row gets reviewed below.
for c in original:
 i=int(c['machine_id'][1:]);block(i,c['candidate_id'],'設定別の確率表または対象条件が今回の資料で揃っていないため、設定推測には使いません。元の情報は調査記録に保持します。',c['parameters'])
# M01 -- hidden modes must not be substituted with all normal games.
rate(1,'M01-C01','通常ゲーム数とGB初当り回数。引き戻し中のGBとAT中のGBは除外。')
rate(1,'M01-C02','通常時の小役カウント対象ゲーム数と弱チェリー回数。AT中の小役は混ぜません。')
rate(1,'M01-C11','通常時の小役カウント対象ゲーム数とレア小役合計回数。弱チェリーを別に重ねて評価しません。')
for c,reason in [('M01-C03','SPモードと通常・SP準備モードで1000pt到達時の当選率が異なり、全到達時の内部モードを識別できません。全到達回数では代用しません。'),('M01-C04','SPモード中は別確率の直撃抽選です。SPモードを除く全滞在ゲーム数を確定できないため、通常ゲーム数全体へ当てはめません。'),('M01-C07','設定変更直後に選ばれた内部GBレベルを全例で確定できず、初戦の結果だけでは選択レベルを再現できません。'),('M01-C08','低確中だけの強チェリー抽選率で、すべての強チェリー成立時の内部低確を識別できません。'),('M01-C09','弱チェリー前後の内部高確状態を全例で確認できず、見た目のステージ移行で代用できません。')]:block(1,c,reason,C[c]['parameters'])
u1=source(1,'https://nana-press.com/kaiseki/machine/755/21818/')
evidence(1,'M01-C05',[('城戸亭＋雨','デフォルト'),('ヨットハウス＋雨','奇数設定示唆'),('女神像＋雨','偶数設定示唆'),('瞬（AT経由）','奇数設定示唆'),('氷河（AT経由）','偶数設定示唆'),('紫龍（AT経由）','高設定示唆'),('星矢＋沙織（AT非経由）','設定2以上'),('星矢＋沙織（AT経由）','高設定示唆'),('シャイナ＋貴鬼＋テティス','設定4以上'),('ブロンズ5人＋沙織','設定6')],'GB終了画面。ATを経由したかどうかで星矢＋沙織の意味を区別。',[u1])
evidence(1,'M01-C06',[('虹クジ','設定6')],'GB終了時のクジラッキーを記録。色別条件が確認済みの虹のみ絞り込み。',[u1])
evidence(1,'M01-C10',[('クリシュナ','偶数設定示唆'),('アイザック','奇数設定示唆'),('イオ','奇数設定示唆'),('瞬','偶数設定示唆'),('氷河','奇数設定示唆'),('バイアン','偶数・高設定示唆'),('紫龍','設定2以上'),('カノン','設定5以上')],'GBの各ラウンド開始画面。終了画面とは別の観測機会。',[u1])
group(1,['M01-C02','M01-C11'],'seiya_small_roles','レア小役合算は弱チェリーを含む。同じ小役回数を独立加算せず、正式スコアで代表を選択。','AGGREGATE_COMPONENT')
group(1,['M01-C01','M01-C02','M01-C11'],'seiya_hit_path','弱チェリー・レア役はGB当選に関わる同一経路。GBと小役を独立加算せず、正式スコアで代表を選択。')
# M02 -- all nine flag vectors come from the actual public table, not extrapolation.
u2=source(2,'https://nana-press.com/kaiseki/machine/796/24071/')
for c in ['M02-C01','M02-C02','M02-C03','M02-C04','M02-C10']:rate(2,c,'ボーナス消化を除く総ゲーム数と対象ボーナスまたは小役の成立回数。','' or None,'TOTAL_GAME_TRIAL',sids=[u2])
flagvals={'M02-C11':[8192,8192,8192,5461.3,5461.3,5461.3],'M02-C12':[3855.1,3640.9,3120.8,2978.9,2849.4,2621.4],'M02-C13':[3855.1,3640.9,3276.8,2978.9,2730.7,2520.6],'M02-C14':[1489.5,1456.4,1394.4,1365.3,1310.7,1260.3],'M02-C15':[2184.5,2114.1,2048,1985.9,1872.5,1820.4],'M02-C08':[16384,16384,10922.7,10922.7,8192,5461.3],'M02-C16':[9362.3,8192,7281.8,5957.8,5461.3,5041.2],'M02-C17':[6553.6,5957.8,5461.3,4681.1,4369.1,3640.9],'M02-C05':[1040.3,993,923,873.8,819.2,780.2]}
flag_source=source(2,'https://nana-press.com/kaiseki/machine/796/24076/')
for c,vs in flagvals.items():
 rate(2,c,'ボーナス消化以外の総ゲーム数が母数。各ボーナス入賞後にPUSHを押し、決まり手チェックに表示された当選契機フラグを記録。停止形だけで推定せず、ボーナス内訳とは同時加算しません。',['1/'+str(v) for v in vs],'TOTAL_GAME_TRIAL',sids=[u2,flag_source])
 changes.append({'candidateId':c,'change':'PUBLIC_VECTOR_AND_BUILT_IN_FLAG_DISPLAY_CONFIRMED','values':vs})
evidence(2,'M02-C06',[('白・Turn it up!（点滅なし）','デフォルト'),('青・GOOD（点滅なし）','奇数設定示唆'),('黄・NICE!（点滅なし）','偶数設定示唆'),('紫・COOL!!（点滅なし）','高設定示唆'),('赤・It\'s on fire!（点滅なし）','高設定示唆'),('赤点滅・Dynamite!（点滅なし）','設定2以上'),('虹・PERFECT!!!（点滅なし）','設定4以上'),('白（パネル点滅あり）','高設定示唆'),('青（パネル点滅あり）','奇数設定示唆'),('黄（パネル点滅あり）','偶数設定示唆'),('紫（パネル点滅あり）','設定3以上示唆'),('赤（パネル点滅あり）','設定2以上'),('赤点滅（パネル点滅あり）','設定2・4・5・6'),('虹（パネル点滅あり）','設定5以上')],'SIDE-Bまたは初当りREG終了後のPUSH。パネルフラッシュ有無を区別。青・黄の比率は別の数値観測で同じ回数を再入力しません。',[u2])
block(2,'M02-C07','対象機種の設定示唆総覧にトロフィーの出現条件を確認できません。別機種のトロフィーを転用せず、終了時ランプ・ボイスとは別の確定情報として使いません。',sids=[u2])
categorical(2,'M02-C09',['青・GOOD（点滅なし）','黄・NICE!（点滅なし）'],[[58,42],[42,58],[58,42],[42,58],[58,42],[42,58]],'パネルフラッシュなしで青GOODまたは黄NICEが出た時だけ分類。ほかの色とフラッシュありは母数に含めません。対象回数は青・黄の合計から自動計算。',[u2],label='終了ボイスの青・黄比率')
for f in D[2]['findings']:
 if f['findingId']=='M02-C06':
  for cat in f['semanticCategories']:
   if cat['label'] in ['青・GOOD（点滅なし）','黄・NICE!（点滅なし）']:cat['linkedFindingId']='M02-C09'

group(2,['M02-C01','M02-C02',*flagvals.keys()],'hyper_bonus','BIG・REGと決まり手のリーチ目フラグは同じボーナス成立を分類した情報。独立加算せず正式スコアで代表を選択。')
group(2,['M02-C04','M02-C10'],'hyper_suika','スイカAB合算がスイカAを含むため、合算とAを同時加算せず代表を選択。','AGGREGATE_COMPONENT')
# M03
u3=source(3,'https://1geki.jp/slot/s_hardboild/0/')
for c in ['M03-C01','M03-C02']:rate(3,c,'ボーナス消化を除く総ゲーム数を母数に、通常時・RUSH中を通じたボーナス成立回数を記録。放出待ちストックの重複カウントを避けます。',universe='TOTAL_GAME_TRIAL',sids=[u3])
rate(3,'M03-C03','RUSH中の対象ゲーム数が母数。ナビなし時にハサミ打ちで識別した共通ベルB回数を記録。通常時・ボーナス中は含めません。',universe='AT_GAME_TRIAL',sids=[u3])
block(3,'M03-C04','通常REG最終ゲームの抽選だけの当選率です。REG中レア役の当選との識別を全例で保証できず、REG後のAT突入すべてを成功に数えると別抽選が混じるため数値推測には使いません。',C['M03-C04']['parameters'],[u3])
rate(3,'M03-C05','ボーナス消化以外の対象ゲーム数とリーチ目役A～C合算の成立回数。ボーナス確率と同じ当選経路なので同時加算しません。',['1/'+str(v) for v in [590.4,580,524.3,458.3,407.1,392.4]],'TOTAL_GAME_TRIAL',sids=[u3])
block(3,'M03-C06','今回照合した設定示唆はBIG中の技術介入ボイスとJAC映像です。別の終了画面・トロフィーについて具体的な出現条件を確認できず、別機種から転用しません。',sids=[u3])
rate(3,'M03-C07','JACゲームの映像が1周して殴られる・殴られないを判定できた機会が母数。同じループ映像をゲームごとに繰り返し数えません。',universe='CONDITIONAL_EVENT_TRIAL',sids=[u3])
rate(3,'M03-C08','ボーナス消化以外の総ゲーム数と8枚役回数。共通ベルBを識別できない通常時の停止形を別役として重ねて数えません。',universe='TOTAL_GAME_TRIAL',sids=[u3])
labels=['ボイスなし','GOOD','GREAT','MARVELOUS','EXCELLENT','UNBELIVABLE'];den=[[1.46,4,16,None,4096,65536],[1.54,3.85,12,128,4096,65536],[1.50,3.70,16,1024,4096,65536],[1.61,3.57,12,128,4096,128],[1.58,3.45,16,1024,128,128],[1.68,3.33,12,128,128,128]]
categorical(3,'M03-C09',labels,[[0 if v is None else 100/v for v in row] for row in den],'通常時BIGの逆押しJAC INハズシ成功1回を1試行とし、ボイスなしも含めて分類。公開逆数表の丸め誤差のみ全カテゴリ合計で補正。',[u3])
group(3,['M03-C01','M03-C02','M03-C05'],'hard_bonus','リーチ目役はBIG・REGの成立経路に含まれるため、正式スコアで代表を選択して同時加算しません。')
group(3,['M03-C03','M03-C08'],'hard_bell','共通ベルBと8枚役は通常時に同じ停止形があり、同じ回数を重ねないよう正式スコアで代表を選択。')
# M04 -- replace the incomplete handoff vectors with the source-supported existing vectors.
u4=source(4,'https://nana-press.com/kaiseki/machine/384/10347/')
for c,fid in [('M04-C01','RF_BONUS'),('M04-C02','RF_ST'),('M04-C03','RF_CZ')]:legacyrate(4,c,fid,'通常ゲーム数と対象のボーナス・ST・CZ初当り回数。ST継続内のボーナスは初当りに含めません。')
legacyrate(4,'M04-C04','RF_COMMON_BELL','実機連動機能で集計した総ゲーム数と共通6枚ベル回数を使用。手動の場合も同じ対象区間を揃えます。','TOTAL_GAME_TRIAL')
block(4,'M04-C05','CZ合算確率は確認できていますが、無名・生駒・美馬への振り分け全設定表は今回確認できていません。合算を種類別確率に分配しません。',sids=[u4])
legacyrate(4,'M04-C06','RF_ST_END_SCREEN','ST終了画面を1回ずつ観測し、高設定示唆画面の回数を記録。トロフィーは同じ画面でも別の絞り込み情報として扱います。','CONDITIONAL_EVENT_TRIAL',True)
D[4]['packageRevision']=2
rate(4,'M04-C07','カバネリボーナス中のキャラ紹介で男性または女性が出た回数を母数に男性を記録。エピソード紹介とは分けます。',[.6,.4,.6,.4,.6,.4],'CONDITIONAL_EVENT_TRIAL',True,[u4])['inputPresentation']={'trialLabel':'男性・女性の合計回数','successLabel':'男性キャラ出現回数'}
evidence(4,'M04-C08',[(c,'設定'+str(n)+'以上' if n<6 else '設定6') for c,n in [('銅',2),('銀',3),('金',4),('キリン柄',5),('虹',6)]],'ST非当選の駿城ボーナス・ST・エンディング終了時に出たトロフィー。',[u4])
legacyrate(4,'M04-N01','RF_MUMEI_3CHAIN','無名CZで小役3連が成立した回数と、その3連でのボーナス当選回数。既に当選した後の小役連は除外。','CONDITIONAL_EVENT_TRIAL',True)
legacyrate(4,'M04-N02','RF_MUMEI_NAV','無名CZで2択ナビの抽選対象となる押し順ベル機会と、その2択ナビ出現回数。','CONDITIONAL_EVENT_TRIAL',True)
group(4,['M04-C01','M04-C02','M04-C03','M04-N01','M04-N02'],'kabaneri_bonus_path','CZ成立・CZ内成功・ボーナス・STは上流下流の同じ経路。独立加算せず、正式スコアで単一代表を選択。')
# M05 -- these are pseudo bonuses with a 32G chain zone, not an A-type.
u5=source(5,'https://www.p-world.co.jp/machine/database/10265')
for c in ['M05-C01','M05-C02']:rate(5,c,'連チャン中を含むボーナス消化以外のゲーム数と全BIG・REG回数。初当りだけの確率と混ぜません。',sids=[u5])
rate(5,'M05-C03','通常ゲーム数からボーナス後32Gの連チャン区間の消化Gを除いたゲーム数を母数とし、その区間外の初当りを記録。',universe='NON_CHAIN_BONUS_INITIAL_GAME_TRIAL',sids=[u5])
rate(5,'M05-C04','ボーナス消化以外の通常ゲーム数と、斜めに揃った共通ベル回数。上段ベルリプレイと区別。総ゲーム数全体へ置き換えません。',sids=[u5])
evidence(5,'M05-C05',[('白','デフォルト'),('青','奇数設定示唆'),('黄','偶数設定示唆'),('緑','奇数・高設定示唆'),('赤','偶数・高設定示唆'),('紫','設定4以上'),('レインボー','設定6')],'ボーナス終了時のフェザーランプ。通常時の高確フラッシュと区別。公開資料の設定下限に従います。',[u5])
group(5,['M05-C01','M05-C02','M05-C03'],'haibi_bonus','連チャン込みBIG・REGと初当りは同じ当選系列。正式スコアで代表を選択し重複加算しません。')
# M06 -- establish the all-setting constant explicitly, not by blank table cells.
u6=source(6,'https://hisshobon.com/machineinfo/87420/')
rate(6,'M06-C01','連チャン区間を除く通常ゲーム数と初当り回数。公開資料で全設定共通1/155と明記されており、設定差はありません。',['1/155']*5,sids=[u6])
block(6,'M06-C02','カバン約1/80は全設定共通で、設定差の情報を持ちません。',{'全設定共通':'1/80'},[source(6,'https://www.p-world.co.jp/machine/database/10283')])
for c,reason in [('M06-C03','ミケ子チャンスはリプレイ3連などから発生しますが、設定別の突入率全体表は確認できません。'),('M06-C04','リプレイ連続回数はCZやボーナスの報酬条件で、設定別の連続回数分布が確認できません。'),('M06-C05','BIGの初当りはC07で保持しますが、連チャン中を混ぜた全ボーナス種別の設定分布は確認できません。'),('M06-C06','ランプは主にボーナス当選や内部モードを示すもので、設定の確定・否定として使える条件を確認できません。'),('M06-C08','モード・テーブルは内部状態で、当選結果からその都度の選択を確定できません。全設定の初回BIG振り分けも未確認です。')]:block(6,c,reason,sids=[u6])
rate(6,'M06-C07','ボーナス後32Gの引き戻し・チャンスモード、1G連・JACKPOT連区間を除いた通常ゲーム数と、区間外のBIG初当り回数。',universe='NON_CHAIN_BONUS_INITIAL_GAME_TRIAL',sids=[u6])
# M07
u7=source(7,'https://www.p-world.co.jp/machine/database/10136')
for c in ['M07-C01','M07-C02']:rate(7,c,'ボーナス消化以外のゲーム数と、天国などの連チャンも含む全BIG・REG回数。',sids=[u7])
rate(7,'M07-C03','通常ゲーム数からボーナス後32Gの連チャン区間の消化Gを引いた値を母数とし、区間外の初当りだけ記録。',universe='NON_CHAIN_BONUS_INITIAL_GAME_TRIAL',sids=[u7])
for c in ['M07-C04','M07-C05']:rate(7,c,'通常ゲーム数と、打ち方・停止形で識別した対象役の回数。ボーナス消化中のゲームと成立役は含めません。',sids=[u7])
block(7,'M07-C06','点滅やモード示唆は主に連チャン状態の情報です。設定別の出現率や設定確定条件が確認できず、設定を直接絞る情報として使いません。',sids=[u7])
group(7,['M07-C01','M07-C02','M07-C03','M07-C04','M07-C05'],'okidoki_bonus_roles','BIG・REG・初当りとボーナス成立契機になる役は同じ当選経路。独立に重ねず、正式スコアで代表を選択。')
# M08 -- version match recovered; semantic certainty is still limited.
u8=source(8,'https://nana-press.com/kaiseki/machine/752/21705/')
rate(8,'M08-C01','通常ゲーム数と楽園計画の初当り回数。ST中の継続当選は初当りへ加えません。',sids=[u8])
evidence(8,'M08-C02',[('攻略対象ヒロイン・スタンプなし','デフォルト'),('美柑・スタンプなし','高設定示唆'),('吉','設定3以上'),('良','設定4以上'),('優','設定5以上'),('極','設定6')],'ST終了時の画面とスタンプを確認。',[u8])
evidence(8,'M08-C03',[(x,'意味未確認・推定示唆') for x in ['また遊んでくださいね','一味違いますね','何やら不思議な気配です','良い予感がします','遊び尽くしちゃいましょう','お肉～♪お肉～♪']],'2024年版の実機連動機能のQR読取時に発生することは確認。設定の意味は他機種を参考にした推定表記のため、記録のみ・推測計算には使用しない。',[u8])
block(8,'M08-C04','CZ・契機別の全設定の当選率表が確認できません。公開されている成功期待度を設定別確率と置き換えません。',sids=[u8])
block(8,'M08-C05','小役やチャンス目について、今回の資料では設定別の出現率全体表が確認できません。',sids=[u8])
f=next(f for f in D[8]['_old']['features'] if f['researchFeatureId']=='RF_HAREM_REWARD');rows=[[f['settingDistributions']['SET_'+k][x]*100 for x in f['categories']] for k in keys(8)]
categorical(8,'M08-C06',['愛すぷRUSH','ウィスパー演出','ToLOVEるエピソード'],rows,'ハーレムモード中のボーナス当選による報酬を1回ずつ分類。通常STや他の契機は母数に含めません。',[u8],label='ハーレムモードの報酬')
evidence(8,'M08-C07',[('456枚OVER','設定4以上'),('555枚OVER','設定5以上'),('666枚OVER','設定6')],'とらぶるボーナス中の専用獲得枚数表示。',[u8])
# M09
u9=source(9,'https://nana-press.com/kaiseki/machine/745/21525/')
rate(9,'M09-C01','通常ゲーム数とティガチャンスの初当り回数。連続継続の再突入を混ぜません。',sids=[u9])
evidence(9,'M09-C02',[('ガタノゾーア','設定6')],'REG中のキャラ紹介。出現率は未確認。',[u9])
evidence(9,'M09-C03',[('1人点灯','デフォルト'),('3人点灯','偶数設定示唆'),('4人点灯','設定2以上'),('5人点灯','設定2否定'),('6人点灯','設定4以上'),('7人点灯','設定6')],'ティガチャンスでチャンス告知を選択した時の終了画面に限定。',[u9])
evidence(9,'M09-C04',[('虹トロフィー','設定6')],'各対象終了画面で実際に出た玉ちゃんトロフィー。未確認の色別下限は追加しません。',[u9])
legacyrate(9,'M09-C05','RF_TC_PLUS_36','TC3回目または6回目の到達回数を母数に、TC+当選回数を記録。その他の回や内部通常・高確によるレア役抽選とは混ぜません。','CONDITIONAL_EVENT_TRIAL',True)
for c in ['M09-C06','M09-C07']:block(9,c,'UBM終了時に内部で選ばれた天井G数は、途中当選すると確定できません。天井に到達した例だけを母数にすると偏るため、実際の当選G数から選択率を推測しません。',C[c]['parameters'],[u9])
evidence(9,'M09-C08',[('246枚表示','意味未確認'),('456枚表示','意味未確認'),('666枚表示','設定6')],'ウルトラボーナス中の専用獲得枚数表示。246・456の詳細条件は今回未照合として別途保持。',[u9])
group(9,['M09-C01','M09-C05'],'tiga_tc_path','TC初当りとその一部のTC+抽選は同じ経路。正式スコアで代表を選び二重加算しません。')
# M10
u10=source(10,'https://nana-press.com/kaiseki/machine/738/21299/');end=source(10,'https://nana-press.com/kaiseki/machine/738/21320/');official=source(10,'https://www.sankyo-fever.jp/products/machine_list/sai/spec/')
rate(10,'M10-C01','通常ゲーム数と初当りBONUS・初当り炎炎激闘（灰焰騎士団）の合計回数。引き戻し・継続は初当りに重ねません。',sids=[official])
rate(10,'M10-C02','通常ゲーム数と通常時の初当りBONUS回数。炎炎激闘中や引き戻し中のボーナスは除外。',sids=[u10])
pw=source(10,'https://www.p-world.co.jp/machine/database/10042');q=source(10,'https://www.slopachi-quest.com/article/lenennosyouboutai-settei/');third=source(10,'https://1geki.jp/slot/l_ennenn/')
b=block(10,'M10-C03','設定6の炎炎ループ初当りは1/537と1/573で公開資料に食い違いがあります。限定再確認後も競合を保持し、この指標は計算に使いません。メーカーの初当り合算と同じ指標とは扱いません。',{'prior':C['M10-C03']['parameters'],'setting6Conflicting':['1/537','1/573']},[pw,q,third])
b['disposition']='SOURCE_CONFLICT_UNRESOLVED';b['sourceConflictResolution']={'schemaVersion':'source-conflict-v1','candidateId':'M10-C03','status':'SOURCE_CONFLICT_UNRESOLVED','runtimeUse':'DISABLED','reopenPolicy':'NEW_CONCRETE_SOURCE_ONLY','initialSourceIds':[pw,q],'additionalCheckSourceIds':[third],'additionalChecksUsed':1,'conflictingClaim':'設定6 1/537 versus 1/573; aggregate is a different event','checkedAt':DATE,'repeatPublicSearch':False}
for c in ['M10-C04','M10-C05']:
 rate(10,c,'通常時に成立した対象契機の回数を母数に、その契機で初当りボーナスに当選した回数を記録。引き戻し・炎炎激闘中は除外し、契機不明例を成功へ含めません。',[v/100 for v in C[c]['parameters'].values()],'CONDITIONAL_EVENT_TRIAL',True,[u10])
block(10,'M10-C06','伝導者の影の小Vベル等は成立役・連続回数ごとに別抽選です。該当候補の全設定値と各条件が揃っていないため、全体の成功率にはまとめません。',sids=[u10])
rate(10,'M10-C08','伝導者の影中に表示された十字目変換回数が母数。その変換契機のエピソードボーナス当選回数だけ記録。通常時の変換や弱レア役の当選を混ぜません。',[v/100 for v in C['M10-C08']['parameters'].values()],'CONDITIONAL_EVENT_TRIAL',True,[u10])
rate(10,'M10-C09','伝導者の影中の弱チェリー・スイカ・チャンス目の成立回数が母数。その弱レア役契機の当選回数を記録。小Vベル連続や十字目変換は混ぜません。',[v/100 for v in C['M10-C09']['parameters'].values()],'CONDITIONAL_EVENT_TRIAL',True,[u10])
rate(10,'M10-C11','通常・AT・ボーナスを通じた総ゲーム数とアドラバースト出現回数。初当りやその後の展開と同じ経路なので他指標へ独立加算しません。',universe='TOTAL_GAME_TRIAL',sids=[source(10,'https://nana-press.com/kaiseki/machine/738/21318/')])
# Numerical end screens, using the rechecked red-frame 2% at setting6 (old repository had 0%).
catlabels=['シルエット','正面','左向き','全員集合','赤枠9人','金枠']
ff=[[77,20,3,0,0,0],[73,22,5,0,0,0],[64,25,6,5,0,0],[61,27,7,3,2,0],[55,30,9,3,2,1]]
reg=[[86,11,3,0,0,0],[83,13,4,0,0,0],[78,14,5,3,0,0],[75,16,6,2,1,0],[73,17,6,2,1,1]]
categorical(10,'M10-C07',catlabels,ff,'通常時・炎炎激闘中の炎炎ボーナス終了時。専用ストック示唆等の画面は設定示唆画面と混ぜず、設定示唆の対象画面だけ分類。シルエットは公表カテゴリの残率。',[end],label='炎炎ボーナス終了画面')
categorical(10,'M10-N01',catlabels,reg,'通常時REG終了時の設定示唆画面だけを分類。炎炎ボーナスの終了画面とは母数を分けます。シルエットは公表カテゴリの残率。',[end],label='REG終了画面')
regsrc=source(10,'https://nana-press.com/kaiseki/machine/738/21319/')
rf=next(f for f in D[10]['_old']['features'] if f['researchFeatureId']=='RF_REG_SCENARIO')
reglabels=['第8①','アイリス②','アイリス③','アイリス④','伝道者①','第8②','アイリス①','第8③','大隊長','伝道者②','アイリス⑤']
regrows=[[rf['settingDistributions']['SET_'+k][cat]*100 for cat in rf['categories']] for k in keys(10)]
categorical(10,'M10-C10',reglabels,regrows,'通常時REGで表示されたキャラ紹介の順序を1シナリオとして分類。1人ずつを独立した試行にせず、シナリオ全体を1回で記録。',[regsrc])
jacsrc=source(10,'https://nana-press.com/kaiseki/machine/738/21322/')
f=next(f for f in D[10]['_old']['features'] if f['researchFeatureId']=='RF_ADORA_JAC_CHAR')
jaclabels=['シンラ','アーサー','ヒナワ','マキ','タマキ','オウビ','ジョーカー','紅丸','アイリス']
jacrows=[[f['settingDistributions']['SET_'+k][cat]*100 for cat in f['categories']] for k in keys(10)]
categorical(10,'M10-N05',jaclabels,jacrows,'アドラバースト中の炎炎JAC・バースト開始画面を1回ずつ分類。アドラバースト突入率とは異なる条件付きのキャラ選択。',[jacsrc],label='炎炎JAC開始キャラ')

group(10,['M10-C01','M10-C02','M10-C04','M10-C05','M10-C08','M10-C09','M10-C11'],'enen_bonus_path','初当り合算、初当りBONUS、成立契機、引き戻し成功、下流のアドラ出現は同じ当選系列。独立加算せず正式スコアで代表を選択。')
changes.extend([{'candidateId':'M04-C01..C04','change':'RECOVERED_COMPLETE_VECTORS_FROM_PINNED_RESEARCH_AND_CURRENT_SOURCE'}, {'candidateId':'M06-C01','change':'ALL_SETTING_CONSTANT_CONFIRMED_EXPLICITLY'}, {'candidateId':'M08-C03','change':'2024_VERSION_EXISTS; SEMANTICS_INFERRED_FROM_OTHER_MODELS; RECORD_ONLY'}, {'candidateId':'M10-C07','change':'SETTING6_RED2_PERCENT; DEFAULT55_PERCENT; PRIOR0_AND57_NOT_REUSED'}])
# Preserve exact information for numerical categorical observations through explicit linked mirrors.
def mirror(i,c,eid,pairs):
 f=next(f for f in D[i]['findings'] if f['findingId']==c)
 e=evidence(i,eid,pairs,'同じ表示結果の入力を共有します。別の回数として重ねません。',f['sourceIds'],label=f['label']+'の設定制約')
 for cat in e['semanticCategories']:cat['linkedFindingId']=c
 f['mirrorsEvidenceFindingId']=eid;f['categoricalEvidenceReconciliation']={'type':'SINGLE_CANONICAL_CATEGORY_INPUT','evidenceFindingId':eid,'runtimeLinkContract':'EXPLICIT_CATEGORY_LINK_V1'}
mirror(3,'M03-C09','M03-N01',[(x,'設定2以上' if x=='MARVELOUS' else ('デフォルト' if x=='ボイスなし' else '設定示唆')) for x in labels])
for c,eid in [('M10-C07','M10-N02'),('M10-N01','M10-N03')]:mirror(10,c,eid,list(zip(catlabels,['デフォルト','高設定示唆','高設定示唆','設定4以上','設定5以上','設定6'])))
mirror(10,'M10-C10','M10-N04',list(zip(reglabels,['デフォルト','設定2否定','設定4否定','設定5否定','設定2・5示唆','設定1・4・6示唆','設定2以上','設定4以上','設定4以上','設定5以上','設定6'])))
mirror(10,'M10-N05','M10-N06',list(zip(jaclabels,['設定2・5示唆','設定2・5示唆','設定2・5示唆','設定1・4・6示唆','設定1・4・6示唆','設定2以上','設定1・4・6','設定4以上','設定5以上'])))
# Presentation-only occasion groups. Numeric and evidence inputs keep their identities.
for i,definitions in [(2,[('M02-C09','ratio','青・黄比率'),('M02-C06','hints','その他のランプ・ボイス')]),(10,[('M10-C07','ff','炎炎ボーナス'),('M10-N02','ff','炎炎ボーナス'),('M10-N01','reg','REG'),('M10-N03','reg','REG')])]:
 for fid,cond,label0 in definitions:
  f=next(f for f in D[i]['findings'] if f['findingId']==fid)
  f['observationContext']={'groupingApproved':True,'opportunityId':'hyper_bonus_end' if i==2 else 'enen_bonus_end','conditionId':cond,'groupTitle':'ボーナス終了時のランプ・ボイス' if i==2 else 'ボーナス終了画面','conditionLabel':label0}
# Candidate-local, truthful provenance. Legacy claims and input bytes stay immutable in inbox.
for i,d in D.items():
 old=d.pop('_old');mid=f'M{i:02}'
 qs=[f'{d["machineName"]}：添付candidates_v9.jsonの候補ID・確率・条件を照合',f'{d["machineName"]}：固定Repository research-data.jsonの設定段階・型式・全候補を照合',f'{d["machineName"]}：固定Repository selection-data.jsonの採否・重複関係を照合']
 d['researchCompleteness']['machineSpecificQueries']=qs;d['researchCompleteness']['queryType']='REPOSITORY_AND_HANDOFF_COMPARISON; not claims of new web searches'
 for f in d['findings']+d['blockedItems']:
  cid=f.get('findingId',f.get('blockId'));isblock='blockId' in f
  claim=f['label']+'：'+(f['reason'] if isblock else (json.dumps(f.get('settingDistribution'),ensure_ascii=False) if 'settingDistribution' in f else json.dumps(f.get('semanticCategories'),ensure_ascii=False)))
  sc=[]
  for sid in f['sourceIds']:
   src=next(s for s in d['sources'] if s['sourceId']==sid);src['claims'].append(claim);sc.append({'sourceId':sid,'claim':claim})
  d['researchCompleteness']['candidateLedger'].append({'candidateId':cid,'label':f['label'],'sourceClaims':sc,'discoveryQueries':qs,'disposition':{'type':'BLOCKED' if isblock else 'FINDING','refId':cid},'origin':'HANDOFF_V9' if cid in C else 'EXISTING_REPOSITORY_OR_SPLIT_OBSERVATION'})
 # Remove empty sources accidentally created while routes were replaced.
 d['sources']=[s for s in d['sources'] if s['claims']]
 labels0='、'.join(c['title'] for c in original if c['machine_id']==mid)
 domainnotes={
 'INITIAL_HIT':'初当り・ボーナスの母数と引き戻し除外は個別候補に記載。',
 'BONUS':'ボーナス合算と内訳は独立に加算しない。',
 'SMALL_ROLE':'対象区間と停止形による識別可否を個別確認。',
 'CZ':'CZの総数・種類・内部抽選は同一ではなく、確認した表の範囲だけ保持。',
 'AT':'初当りと継続・内部ストックは区別。',
 'INTERNAL_CONDITIONAL_DRAW':'内部状態が全例識別できない候補は各理由で限定クローズ。',
 'MODE_TRANSITION':'内部モード選択を当選結果だけから復元しない。',
 'STATE_TRANSITION':'見た目のステージと内部状態を同一と仮定しない。',
 'SUCCESS_RATE':'抽選機会と成功を同じ条件で記録できる候補のみ保持。',
 'POINTS_GAME_DISTRIBUTION':'ゲーム数・ポイント到達時の内部選択を実当選Gで代用しない。',
 'CARRY_OVER':'既存Researchとv9の持ち越し・ストック情報を比較。追加の完全性証明は要求しない。',
 'THRESHOLD_BEHAVIOR':'公開された到達条件以上の境界や潜伏を創作しない。',
 'RESET_BEHAVIOR':'設定変更時の情報を通常時の全試行へ転用しない。',
 'POST_EVENT_TRANSITION':'終了後の連チャン・引き戻し区間を初当りと区別。',
 'NAVIGATION':'ナビ等の観測条件は既存候補・Repositoryの実測条件と照合。',
 'ROLE_CONDITIONAL_DISTRIBUTION':'小役率とその小役からの当選率の包含関係は契約で代表選択。',
 'BONUS_TYPE_CONDITIONAL':'ボーナス種別と終了時の分類は対象機会を別に保持。',
 'EVIDENCE':'確定・否定と推定示唆を区別し、未知率へ重みを付けない。',
 'EXTERNAL_DATA_ONLY':'実機連動機能の任意利用を採否の制限にしない。未確認機能を存在しないと断定しない。',
 'MACHINE_SPECIFIC':'全領域の未知情報がないとの主張は行わない。'}
 for domain in DOMAINS:d['researchCompleteness']['domains'].append({'domain':domain,'status':'CHECKED','note':d['machineName']+'：v9限定探索と既存Researchの照合範囲。'+domainnotes[domain]+' 対象候補：'+labels0,'sourceIds':[s['sourceId'] for s in d['sources']]})
 d['legacyReconciliation']={'machineIdentity':old['machine'],'legacyFeatureIds':[f['researchFeatureId'] for f in old['features']],'legacyEvidenceIds':[f['researchEvidenceId'] for f in old['evidenceCandidates']],'disposition':'Original legacy tables retained unchanged in repository-baseline; current candidate routes are authoritative only for this new batch. Distribution and completed batch records are untouched.','allLegacyCandidatesReevaluated':False,'knownResiduals':'Legacy features outside the 90-row handoff are retained in baseline. Supplemental mapped numeric paths are explicitly added; remaining source value gaps are not claimed resolved.'}
 (O/(d['machineId']+'.json')).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
(I/'reconciliation-changes.json').write_text(json.dumps(changes,ensure_ascii=False,indent=2)+'\n')
assert len(original)==90
assert set(C)=={r['candidateId'] for d in D.values() for r in d['researchCompleteness']['candidateLedger'] if r['candidateId'] in C}
print(json.dumps({'original':len(C),'findings':sum(len(d['findings']) for d in D.values()),'blocks':sum(len(d['blockedItems']) for d in D.values())}))
