"""Batch018 source review, 2026-10-17. Reuses the repaired 99-row handoff.
No evaluator/validator changes. Original claims are retained in imported ZIP.
"""
import json, pathlib, copy
ROOT=pathlib.Path(__file__).resolve().parents[1]
INPUT=ROOT/'research-inbox/batch018/imported-handoff/extracted/research_json'
OUT=ROOT/'research-inbox/batch018/reviewed'
OUT.mkdir(parents=True,exist_ok=True)
selection=json.loads((ROOT/'next-machine-selection-20261016.json').read_text())
queries=json.loads((ROOT/'research-inbox/batch018/imported-handoff/actual-searches.json').read_text())
BATCH='batch-20261016-018'; DATE='2026-10-17'
DOMAINS='INITIAL_HIT BONUS SMALL_ROLE CZ AT INTERNAL_CONDITIONAL_DRAW MODE_TRANSITION STATE_TRANSITION SUCCESS_RATE POINTS_GAME_DISTRIBUTION CARRY_OVER THRESHOLD_BEHAVIOR RESET_BEHAVIOR POST_EVENT_TRANSITION NAVIGATION ROLE_CONDITIONAL_DISTRIBUTION BONUS_TYPE_CONDITIONAL EVIDENCE EXTERNAL_DATA_ONLY MACHINE_SPECIFIC'.split()
BASE={1:'721/20062',2:'728/20946',3:'761/21942',4:'778/22170',5:'781',6:'733/19676',7:'770/22512',8:'760/22578',9:'764/21883',10:'758/21738'}
D={}; changes=[]
for i,sel in enumerate(selection['selected'],1):
 d=json.loads((INPUT/f'M{i:02}_RESEARCH_PROVENANCE_DRAFT.json').read_text())
 d['batchId']=BATCH;d['machineId']=sel['machineId'];d['machineName']=sel['displayName'];d['researchStage']='SOURCE_REVIEW_COMPLETE_PENDING_FORMAL_ACCEPTANCE'
 d['settings']['status']='CANONICAL_IDENTITY_AND_PUBLIC_SETTINGS_CONFIRMED';d['settings']['numericInferenceValues']=[v for v in d['settings']['values'] if v!='SET_L']
 d.pop('bridgeWarnings',None)
 d['historicalInput']={'file':'imported-handoff/SloAnalytica_Research_Active_Claims_Repaired_20261017.zip','originalCandidates':len(d['researchCompleteness']['candidateLedger']),'originalFindings':len(d['findings']),'originalBlocks':len(d['blockedItems']),'originalStage':'RESEARCH_DRAFT_NOT_VALIDATED'}
 d['sources']=[];d['_claims']={};d['_querymap']={};D[i]=d
 defsource={'sourceId':'overview','url':'https://nana-press.com/kaiseki/machine/'+BASE[i]+'/','title':sel['displayName']+' 設定差・機種概要','sourceType':'published_analysis','checkedAt':DATE,'claims':[]}
 d['sources'].append(defsource)
 # All original candidate IDs survive. Active provenance is rebuilt from reviewed pages.
 for row in d['researchCompleteness']['candidateLedger']:row['sourceClaims']=[];row['discoveryQueries']=[]
 for f in d['findings']:
  f['sourceIds']=['overview']
  if 'settingDistribution' in f:f['details']=[]
  if 'settingDistribution' in f:
   f['liveObservation']={'status':'EXACT_WITH_SCOPE_TRACKING','reason':'対象となる遊技区間と成立回数を同じ期間で記録します。'}
   f['denominatorSemantics']='通常時の対象ゲーム数と発生回数を記録。ボーナス・AT消化ゲームは対象外。'
 for b in d['blockedItems']:b['sourceIds']=['overview']

def source(i,sid,url,title):
 D[i]['sources'].append({'sourceId':sid,'url':url,'title':title,'sourceType':'published_analysis','checkedAt':DATE,'claims':[]})
def item(i,c):
 return next(x for x in D[i]['findings']+D[i]['blockedItems'] if x.get('findingId',x.get('blockId'))==c)
def row(i,c):return next(x for x in D[i]['researchCompleteness']['candidateLedger'] if x['candidateId']==c)
def route(i,c,obj,isblock=False):
 d=D[i];old=next((x for x in d['findings']+d['blockedItems'] if x.get('findingId',x.get('blockId'))==c),None)
 for key in ['findings','blockedItems']:d[key]=[x for x in d[key] if x.get('findingId',x.get('blockId'))!=c]
 obj={('blockId' if isblock else 'findingId'):c,**obj};d['blockedItems' if isblock else 'findings'].append(obj)
 r=next((x for x in d['researchCompleteness']['candidateLedger'] if x['candidateId']==c),None)
 if r is None:
  r={'candidateId':c,'label':obj['label'],'sourceClaims':[],'discoveryQueries':[]};d['researchCompleteness']['candidateLedger'].append(r);changes.append({'machine':i,'candidateId':c,'change':'ADDED_FROM_PUBLIC_REVIEW'})
 elif old and ('blockId' in old)!=isblock:changes.append({'machine':i,'candidateId':c,'change':'BLOCK_TO_FINDING' if not isblock else 'FINDING_TO_BLOCK','reason':obj.get('reason',obj.get('denominatorSemantics'))})
 r['label']=obj['label'];r['disposition']={'type':'BLOCKED' if isblock else 'FINDING','refId':c}
 return obj

def vector(i,vals):return dict(zip([v.replace('SET_','') for v in D[i]['settings']['numericInferenceValues']],vals))
def rate(i,c,label,vals,scope,universe='NORMAL_GAME_TRIAL',conditional=False,sids=None,details=None):
 return route(i,c,{'label':label,'observationType':'conditional_probability' if conditional else 'probability','trialUniverse':universe,'settingDistribution':vector(i,vals),'sourceIds':sids or ['overview'],'denominatorSemantics':scope,'details':details or [scope],'liveObservation':{'status':'EXACT_WITH_SCOPE_TRACKING','reason':scope}})
def cats(pairs):
 out=[]
 for label,meaning in pairs:
  sem='EXACT_CONSTRAINT' if ('否定' in meaning or '以上' in meaning or ('設定' in meaning and not '示唆' in meaning)) else ('DISPLAY_ONLY' if meaning=='デフォルト' else 'PROBABILITY_UNKNOWN')
  out.append({'label':label,'meaning':meaning,'semanticType':sem})
 return out
def evidence(i,c,label,pairs,scope,sids=None):return route(i,c,{'label':label,'observationType':'evidence','sourceIds':sids or ['overview'],'semanticCategories':cats(pairs),'details':[scope,'設定確定・否定の条件は設定候補の絞り込みに反映。出現率が未確認の項目に頻度の重みは付けません。']})
def block(i,c,label,reason,values=None,sids=None):
 b=route(i,c,{'label':label,'reason':reason,'reevaluationCondition':'不足する値や観測条件を解決する新しい具体的な公開資料が得られた場合に、この候補のみ再確認します。','sourceIds':sids or ['overview']},True)
 if values is not None:b['retainedPublishedValues']=values
 return b
def dependency(i,ids,gid,kind,reason):
 for c in ids:
  f=item(i,c)
  if 'findingId' in f:
   f.update(dependencyGroupId=gid,dependencyKind=kind,dependencyReason=reason)
   f['dependencyScopeAudit']={'status':'KNOWN_DEPENDENCY_DEFERRED_TO_CONTRACT','evidenceSourceIds':f['sourceIds'],'reason':reason}

def categorical(i,c,label,labels,rows,scope,universe,sids=None):
 f=route(i,c,{'label':label,'observationType':'appearance_distribution','trialUniverse':universe,'settingDistribution':vector(i,[' / '.join(f'{l}: {p:g}%' for l,p in zip(labels,ps)) for ps in rows]),'sourceIds':sids or ['overview'],'categoryModel':{'residualPolicy':'SOURCE_EXHAUSTIVE'},'denominatorSemantics':scope,'details':[scope],'liveObservation':{'status':'EXHAUSTIVE_CATEGORICAL','reason':scope}})
 return f

# 01: internal modes are not observable. The visible-maintenance outcome is observable.
source(1,'sakura','https://nana-press.com/kaiseki/machine/721/20068/','さくらランプミッション・表示維持と内部維持')
source(1,'mode','https://nana-press.com/kaiseki/machine/721/20799/','連戦モードとCZ抽選')
source(1,'reset','https://nana-press.com/kaiseki/machine/721/20065/','設定変更時のモード移行')
block(1,'M01-C02','通常A/B・さくら直撃','通常A・B・さくら滞在Gだけの確率。早駆け・天国等を除いた対象モードの全滞在Gを識別できず、通常時全体の確率としては使えません。',item(1,'M01-C02')['settingDistribution'])
block(1,'M01-C03','非連戦時の巻物→CZ','連戦非滞在時だけの抽選率で、巻物・CZで連戦へ移行し内部的に転落するため、対象外の巻物を漏れなく除けません。',item(1,'M01-C03')['settingDistribution'],['overview','mode'])
rate(1,'M01-C06','さくらランプ表示維持',[.094,.102,.109,.117,.125],'CZ以外でさくらランプが点灯している時のハズレ回数を母数に、表示が消えず維持された回数を記録。消灯後の内部維持は成功に数えません。','CONDITIONAL_EVENT_TRIAL',True,['overview','sakura'],['旧候補の81.3～75.0%は内部クリア率で、見た目の消灯率ではありません。観測可能な表示維持9.4～12.5%を使用します。'])
block(1,'M01-C07','CZ巻物抽選','M01-C03と同じ巻物→CZの重複候補。連戦中43.8%と非連戦時21.9～29.7%を混ぜて独立評価しません。',{'連戦中':.438},['overview','mode'])
block(1,'M01-C08','リセット時モード','リセット時は通常A・B・早駆け・さくらを各25%で選択。設定差として使う分布ではありません。',{'各モード':.25},['reset'])
rate(1,'M01-N01','BIG（連チャン込み）',['1/172','1/166.3','1/155.4','1/140.8','1/130.6'],'通常時の消化Gを母数に、初当たりと天国ループを含むBIG回数を記録。','NORMAL_GAME_TRIAL')
rate(1,'M01-N02','REG（連チャン込み）',['1/362','1/348.1','1/322.8','1/278.5','1/256.2'],'通常時の消化Gを母数に、初当たりと天国ループを含むREG回数を記録。','NORMAL_GAME_TRIAL')
dependency(1,['M01-C01','M01-N01','M01-N02'],'jajamaru_bonus','CAUSAL_PATH_OVERLAP','初当たりとループ込みのBIG・REGは同じ当選系列。独立加算せず正式スコアから代表を選択します。')
# 02: real bonuses, state-conditioned FH, exact hints.
source(2,'hints','https://1geki.jp/slot/s_danmachi2/0/','ダンまち2 設定差・示唆の独自調査')
for c in ['M02-V01','M02-V04','M02-V05']:
 f=item(2,c);f['trialUniverse']='TOTAL_GAME_TRIAL';f['denominatorSemantics']='ボーナス消化を除く実ゲーム数を総ゲーム数として記録し、通常時・ART中の対象役またはファミリアボーナス回数を集計。';f['liveObservation']['reason']=f['denominatorSemantics']
for c in ['M02-V06','M02-V07']:
 f=item(2,c);f['denominatorSemantics']='対象小役の成立回数が母数。ボーナスとの同時当選を確認した回数だけを成功に数え、前兆中の別役を契機として重ねません。';f['liveObservation']['reason']=f['denominatorSemantics']
rate(2,'M02-C01','赤7ファミリアボーナス',['1/668.7','1/630.1','1/595.8','1/508','1/468.1','1/434'],'ボーナス消化以外の総ゲーム数と赤7ファミリアボーナス回数。','TOTAL_GAME_TRIAL')
block(2,'M02-C02','CZ・ART初当たり','CZはM02-V02、ARTはM02-V03で個別保持。同じ当選回数を別の候補として二重加算しません。')
block(2,'M02-C03','チャンス役重複・FH当選','スイカと強チャンス目はV04～V07へ分離。その他チャンス役は設定1の値のみで設定別全体表がなく、FHの内部状態条件はC06で保持。',{'弱チェリー':{'設定1確率':'1/65.5','設定1重複':.04},'チャンス目':{'設定1確率':'1/186.2','設定1重複':.125},'強チェリー':{'設定1確率':'1/385.5','設定1重複':.4},'ベルチェリー':{'設定1確率':'1/819.2','設定1重複':.5}})
evidence(2,'M02-C04','スイカ入賞時セリフ',[('エイナ：探索から帰ったら…','高設定示唆'),('エイナ：奇妙な恰好をした…','奇数設定示唆'),('エイナ：偶然だったとしても…','偶数設定示唆'),('エイナ：4体以上のモンスターに…','設定4以上'),('エイナ：6人かぁ…','設定6'),('リュー：奇抜な戦い方…','奇数設定示唆'),('リュー：偶然でも構いません…','偶数設定示唆'),('リュー：LV6にもなれば…','設定6'),('赤い吹き出し','高設定示唆')],'通常時のスイカ入賞時に画面下ランプをタッチ。台詞と吹き出し色を確認。')
evidence(2,'M02-C05','ボーナス確定画面LED',[('チャンス役時に紫発光','設定4以上')],'ボーナス確定画面中、チャンス役成立時のセンターLEDが対象。')
block(2,'M02-C06','通常・高確FH当選','共通ベルやレア役のFH当選率は通常・高確・超高確で条件が異なり、見た目のステージだけでは対象状態の全試行を確定できません。',{'通常_共通ベル':[.004,.004,.004,.012,.012,.012],'通常_弱役':[.051,.063,.071,.082,.09,.102],'通常_強役':[.251,.251,.251,.302,.318,.333],'高確_弱役':[.102,.102,.102,.2,.2,.2]})
rate(2,'M02-C07','異色ファミリアボーナス',['1/569.9','1/550.7','1/532.8','1/524.3','1/504.1','1/485.4'],'ボーナス消化以外の総ゲーム数と異色ファミリアボーナス回数。','TOTAL_GAME_TRIAL')
block(2,'M02-C08','ART/CZ契機','ARTはCZ経由とボーナス等の経路を含み、全契機別の設定分布は今回確認した総覧にありません。V02/V03の当選回数と重複する別尤度を作りません。')
evidence(2,'M02-N01','ファミリアチャンス特殊ナビ',[('命（中）','高設定示唆'),('春姫（左）','設定2否定'),('春姫（中）','設定3否定'),('春姫（右）','設定4否定'),('アイズ（左）','設定4以上'),('アイズ（中）','設定5以上'),('アイズ（右）','設定6')],'ファミリアチャンス中のナビ位置とキャラを組み合わせて記録。')
rate(2,'M02-N02','通常ナビのヘスティア割合',[.6,.4,.6,.4,.6,.4],'ファミリアチャンス中にヘスティアまたはリリが選ばれたナビ回数を母数に、ヘスティアを記録。特殊ナビは母数から除外。','CONDITIONAL_EVENT_TRIAL',True)
evidence(2,'M02-N03','獲得枚数表示',[(x,y) for x,y in [('56枚OVER','設定5以上'),('222枚OVER','設定2以上'),('246枚OVER','設定2・4・6'),('274枚OVER','設定2否定'),('374枚OVER','設定3否定'),('456枚OVER','設定4以上'),('666枚OVER','設定6'),('1274枚OVER','設定3以上'),('2374枚OVER','設定4以上'),('3456枚OVER','設定4以上')]],'通常の枚数表示と区別して、専用の獲得枚数表示が出た時だけ記録。')
evidence(2,'M02-N04','ファミリアボーナス終了画面',[('建物','デフォルト'),('ウィーネ','偶数設定示唆'),('銅像','奇数設定示唆'),('ヘスティア・ファミリア','設定2以上'),('ベル＆アイズ','設定4以上'),('パーティ','設定6'),('リリEP以外でリリ専用画面','設定2否定'),('アイズEP以外でアイズ専用画面','設定3否定'),('アルテミスEP以外でアルテミス専用画面','設定4否定')],'エピソード専用画面の否定示唆は、対応するエピソード以外で出た場合だけ有効。')
dependency(2,['M02-V01','M02-C01','M02-C07','M02-V04','M02-V05','M02-V06','M02-V07'],'danmachi_bonus_role','CAUSAL_PATH_OVERLAP','小役確率・同時当選率・ファミリアボーナス合計と種類別は当選経路が重なる。正式スコアによる単一代表を使用。')
dependency(2,['M02-V02','M02-V03'],'danmachi_cz_art','CAUSAL_PATH_OVERLAP','CZはARTへの上流経路。CZとARTの当選確率を独立加算しません。')
# 03
source(3,'flags','https://nana-press.com/kaiseki/machine/761/21947/','打ち分けによるハズレ・ベル判別')
item(3,'M03-C03')['sourceIds'].append('flags');item(3,'M03-C03')['denominatorSemantics']='通常時、左枠上～上段に白7を正確に狙ったゲーム数のみが母数。共通3枚ベルAを停止形で判別。BAR狙いは対象外。'
item(3,'M03-C05')['sourceIds'].append('flags');item(3,'M03-C05')['denominatorSemantics']='通常時にピンク7を正確に狙ったゲーム数を母数にハズレBを記録。目押しが遅い時はAとの区別ができないため対象外。'
block(3,'M03-C08','ボーナス中小役','スイカは通常時と同率でC04に統合可能。ボーナス中リーチ目は通常非前兆中と異率なのでN02に分離し、同一回数を重ねません。',{'ボーナス中スイカ':item(3,'M03-C04')['settingDistribution']})
rate(3,'M03-C09','ハズレA→ミュージック前兆',[.00003,.00005,.00008,.00014,.00023,.00029],'リハーサルステージ以外でハズレAを正確なピンク7狙いにより判別できた回数を母数に、当該契機のミュージック前兆回数。','CONDITIONAL_EVENT_TRIAL',True,['overview','flags'])
block(3,'M03-C10','リセットBBモード','高設定ほどリセット後BBモード優遇という特徴はあるが、設定別の選択率表は掲載されていません。内部モードも常時確定できず、数値を補完しません。')
block(3,'M03-N01','通常非前兆中リーチ目','通常時の非前兆中だけ1/16384～1/8192。前兆の全開始点を事前に識別できないため、通常G全体へそのまま当てはめません。',vector(3,['1/16384','1/13107.2','1/13107.2','1/10922.67','1/9362.29','1/8192']))
rate(3,'M03-N02','BIG中リーチ目',['1/4681.1','1/4369.1','1/4369.1','1/4096','1/3855.1','1/3640.9'],'ボーナス消化中の対象ゲーム数を別に数え、リーチ目回数を記録。通常時のリーチ目とは混ぜません。','CONDITIONAL_EVENT_TRIAL')
rate(3,'M03-N03','チェリー→ミュージック前兆',[.3145,.3164,.3164,.3223,.3281,.334],'リハーサル以外のチェリー成立回数と、そのチェリー契機のミュージック前兆回数。','CONDITIONAL_EVENT_TRIAL',True)
rate(3,'M03-N04','スイカ→ミュージック前兆',[.1973,.1982,.2002,.2012,.2012,.207],'リハーサル以外のスイカ成立回数と、そのスイカ契機のミュージック前兆回数。','CONDITIONAL_EVENT_TRIAL',True)
categorical(3,'M03-N05','BIG告知（通常文字）',['ピンク7','白7','REG告知からBIG昇格'],[[42.5,42.5,15],[35,50,15],[50,35,15],[30,50,20],[50,30,20],[40,40,20]],'通常文字の確定画面でBIGに当選した回だけ分類。金文字は除外。','CONDITIONAL_EVENT_TRIAL')
categorical(3,'M03-N06','BIG告知（金文字）',['ピンク7','白7','REG告知からBIG昇格'],[[50,50,0],[39.5,60,.5],[60,39,1],[38.5,60,1.5],[60,38,2],[48.75,48.75,2.5]],'金文字の確定画面でBIGに当選した回だけ分類。通常文字は除外。設定1の昇格0%は原資料の非出現表示。','CONDITIONAL_EVENT_TRIAL')
rate(3,'M03-N07','BIG前半リプレイ中段揃い',[.5,.666,.334,.666,.334,.5],'BIG前半のリプレイ回数のうち、技術介入発生時を除いた回数が母数。中段揃いを成功、右下がりを非成功として記録。','CONDITIONAL_EVENT_TRIAL',True)
block(3,'M03-N08','操チャンス恩恵振分','成立契機別にCZ・確定CZ・BIG以上確定CZの内部選択率は公開されているが、通常CZが自力成功した場合と確定CZの選択を全例で識別できません。結果のボーナス当否を内部選択と置き換えません。',{'3枚ベルB_操リプ_CZ':[84.77,84.77,84.77,84.38,84.38,82.42],'チェリー_CZ':[85.16,85.16,84.77,84.38,84.38,82.42],'スイカ_BIG以上確定CZ':[2.34,2.73,3.13,3.52,4.30,5.47],'操リプ_BIG以上選択時_絶頂ライブ':[4.30,4.69,4.69,4.69,4.69,5.08]})
dependency(3,['M03-C01','M03-C02','M03-C09','M03-N03','M03-N04'],'aoharu_bonus_path','CAUSAL_PATH_OVERLAP','ミュージック前兆からCZ・ボーナスにつながるため、最終当選回数と契機当選を独立加算しません。')
# 04
source(4,'modes','https://nana-press.com/kaiseki/machine/778/22176/','モード・黒ドキ・連チャン条件')
source(4,'flags','https://hazuse.com/machine/pachislot/4S0253/','チェリーBと確定役Bの判別')
for c in ['M04-C02','M04-V02']:
 f=item(4,c);block(4,c,f['label'],'通常A・Bだけの抽選値ですが、引き戻し・チャンス・黒ドキなどの内部滞在を全ゲームで識別できません。32Gを除いただけでは対象モード限定になりません。',f['settingDistribution'],['overview','modes'])
block(4,'M04-C04','ハイビスカス点灯','光り方は次回モードやBIGを示唆するもの。確認した設定判別資料には、点灯パターンの全設定別分布や設定確定パターンはありません。',['次回モード示唆'],['modes'])
block(4,'M04-C05','チェリーB（重複台帳）','M04-V01と同じチェリーB。成立回数は1か所だけ記録し、同じ情報を2回使いません。')
block(4,'M04-C06','モード別レア役当選率','チェリー通常ABは1.1～1.2%、スイカは通常AB2.8～4.0%・引き戻し7.5～8.8%・チャンス9.2～10.7%。対象モードを識別できないため、無条件のレア役抽選率として使えません。',{'チェリー通常AB':[1.1,1.1,1.1,1.2,1.2],'スイカ引き戻し':[7.5,7.8,8.1,8.4,8.8],'スイカチャンス':[9.2,9.5,9.9,10.2,10.7]},['overview','modes'])
block(4,'M04-C07','モード移行','当選時に内部モードが移行。約40%のリセット後チャンスなどは掲載されているが、全設定×全移行元の表を確認できず、確定できない移行元を推定して使用しません。',None,['modes'])
block(4,'M04-C08','連チャン除外G・黒ドキ','32G以内の当選は連チャンとして初当たりから除外します。これは入力母数の定義で、別の設定差尤度ではありません。黒ドキは見た目で確定できません。',None,['modes'])
f=item(4,'M04-C01');f['trialUniverse']='NON_CHAIN_BONUS_INITIAL_GAME_TRIAL';f['denominatorSemantics']='通常消化Gから連チャンゾーンの消化Gを除外。ボーナス後32G以内の当選は初当たりに含めず、33G以降の当選を記録。';f['liveObservation']={'status':'RETROSPECTIVE_EXACT','reason':f['denominatorSemantics']}
for c in ['M04-C03','M04-V01']:item(4,c)['sourceIds'].append('flags')
item(4,'M04-C03')['denominatorSemantics']='通常Gを母数に左第1停止で確定役B（スイカ小V型）を識別した回数。8枚役全体を数えません。'
item(4,'M04-V01')['denominatorSemantics']='通常Gを母数に左または中第1停止で判別したチェリーBを記録。チェリーAを混ぜません。'
rate(4,'M04-N01','チェリー合算',['1/35','1/34.3','1/34','1/33.4','1/32.9'],'通常GとチェリーA・B合計回数。Bの内訳が不明な場合の代替候補。')
dependency(4,['M04-V01','M04-N01'],'okidoki_cherry','AGGREGATE_COMPONENT','チェリー合算はチェリーBを含むため、同じ回数を独立加算しません。')
dependency(4,['M04-C01','M04-C03'],'okidoki_bonus_path','CAUSAL_PATH_OVERLAP','確定役Bはボーナスを伴うため、初当たりとの同時加算を避けます。')
# 05: correct 2024 AMT AT model, not 1998 Olympia or an A-type.
source(5,'hazuse','https://hazuse.com/machine/pachislot/SX0079/','2024アムテックスSバハマ30の独自調査')
D[5]['settings']['values'].append('SET_L');D[5]['machineIdentityReview']={'manufacturer':'アムテックス','introducedAt':'2024-07-08','type':'AT（擬似ノーマル）','excludedOtherMachine':'1998年オリンピア製バハマ','sourceIds':['overview','hazuse']}
for f in D[5]['findings']:
 f['sourceIds']=['hazuse'];f['trialUniverse']='NORMAL_GAME_TRIAL';f['denominatorSemantics']='ATボーナスを除く通常ゲーム数を母数として記録。総ゲーム数へAT消化分を混ぜません。'
block(5,'M05-C03','ボーナス告知演出','フラミンゴのプレミア点灯はBIGを示唆します。設定別出現率や設定確定演出の表は確認した資料にありません。',None,['overview','hazuse'])
block(5,'M05-C04','小役詳細（分離済み）','設定差のある小役はN01・N02・N04・N05へ分離。公開不足という旧判断を撤回し、この見出しを独立した設定差として重ねません。',None,['hazuse'])
block(5,'M05-C05','REG比率','BIG・REGの公開確率から得る比率はC01/C02と同じ情報で、独立の設定差尤度として加算しません。',None,['hazuse'])
block(5,'M05-N04','8枚押し順ベル','通常時の内部成立率1/7.0～1/6.9は公開。押し順不正解時に全フラグを識別する公開手順が今回の打ち方資料にないため、単なる8枚入賞回数と同一視しません。',vector(5,['1/7','1/7','1/7','1/6.9','1/6.9']),['hazuse'])
block(5,'M05-N05','共通1枚役','通常時1/8.5～1/9.0は公開。ただし取りこぼした押し順役等と区別した全成立回数を記録する手順は確認できず、1枚払出の全回数で代用しません。',vector(5,['1/8.5','1/8.5','1/8.7','1/8.9','1/9']),['hazuse'])
dependency(5,['M05-C01','M05-C02','M05-N03'],'bahama_bonus','CAUSAL_PATH_OVERLAP','ロングフリーズはBIGを伴い、BIG/REGと同じ当選系列。正式スコアによる代表を使用。')
# 06
source(6,'hazuse','https://hazuse.com/machine/pachislot/3S1654/','金のかぼちゃ通常/ST別解析')
source(6,'bonus','https://1geki.jp/slot/s_kinnokabocha/42/','通常時ボーナスとレア役重複（自社調査）')
item(6,'M06-C03')['sourceIds']=['bonus','hazuse'];item(6,'M06-C03')['denominatorSemantics']='通常時のみの弱チェリー・スイカ合計成立回数が母数。次ゲーム告知を含め当該役との同時当選を成功に記録。ST中は除外。'
block(6,'M06-C04','設定L下パネル点滅','設定Lは下パネルが常時点滅。通常設定1・2・3・5・6の評価とは別扱いで、未公表のL確率を補完しません。',{'設定L':'常時下パネル点滅'},['overview','hazuse'])
block(6,'M06-C05','通常時ボーナス内訳（分離）','通常REG・BIG・ゴールデンBIGはN01～N03に分離。元の見出しを別尤度として重ねません。',None,['bonus'])
block(6,'M06-C06','ST中ボーナス','ST中合算1/15、BIG1/15.6、ゴールデンBIG1/355は全設定共通。通常時の初当たり合算1/148～1/124と混ぜません。',{'ST合算':'1/15','ST_BIG':'1/15.6','ST_GBIG':'1/355'},['hazuse'])
block(6,'M06-C07','弱チェリー/スイカ契機','M06-C03と同じ通常時の弱レア役重複。別の成功回数として二重に使用しません。',None,['bonus'])
block(6,'M06-C08','HAPPY・STOCKランプ等の示唆','HAPPY点灯はボーナス、STOCK点灯や収録楽曲はSTストックを示唆。今回確認した資料には通常設定を確定・否定する出現率表がありません。',None,['hazuse'])
for c,l,v in [('M06-N01','通常REG',['1/164','1/160','1/155','1/149','1/139']),('M06-N02','通常BIG',['1/1746','1/1666','1/1512','1/1355','1/1236']),('M06-N03','通常ゴールデンBIG',['1/13853','1/13863','1/13679','1/13377','1/13282'])]:rate(6,c,l,v,'ST・ボーナス消化を除いた通常Gを母数に、通常時に当たった対象ボーナス回数を記録。',sids=['bonus'])
dependency(6,['M06-C01','M06-C02','M06-C03','M06-N01','M06-N02','M06-N03'],'kabocha_bonus_st','CAUSAL_PATH_OVERLAP','通常ボーナス合算と内訳、弱レア役重複、当選後のSTは同じ当選経路。独立加算せず代表を選択。')
# 07
block(7,'M07-C04','宿命ブレイクストック','内部ストック1/694.4～1/347.2は、終了後に前兆経由で放出される内部当選率。未放出ストックと他契機を全例識別できず、見た目の突入回数で代用しません。',vector(7,['1/694.4','1/694.4','1/555.5','1/462.9','1/396.8','1/347.2']))
rate(7,'M07-C05','ユリアボーナス直撃',['1/65075.3','1/32537.6','1/25028.9','1/10168','1/5048','1/3389.3'],'通常Gを母数に、規定ポイント到達を契機とする当選を除いたユリアボーナス直撃だけを記録。契機不明の当選は数えません。')
rate(7,'M07-C06','フェイク前兆後の伝授キャラ',[.051,.051,.055,.059,.066,.07],'通常時の激闘ロードがハズレて終了した回数が母数。その終了時に新たに獲得した伝授キャラを記録。','CONDITIONAL_EVENT_TRIAL',True)
block(7,'M07-C07','ブルーセブンモード','有利区間移行時・ST終了時の移行率は0.7/0.7/0.8/1.0/1.1/1.2%。内部移行と、別枠のレア役抽選を全例識別できず、青7を引いたかだけで移行成功としません。',vector(7,[.007,.007,.008,.01,.011,.012]))
f=item(7,'M07-C03');f['trialUniverse']='BONUS_ELIGIBLE_GAME_TRIAL';f['denominatorSemantics']='通常時とボーナス中のGを合計した母数。ST消化Gを除外し、無双チェリー・無双スイカの合計回数を記録。'
dependency(7,['M07-C01','M07-C05'],'hokuto_bonus','NESTED_OUTCOME','ユリア直撃はボーナス初当たりに含まれるため、同じ当選を独立加算しません。')
# 08
for c in ['M08-C02']:
 f=item(8,c);block(8,c,f['label'],'最終決戦はCZ/AT前兆・内部高確・フリーズ高確率中を除いた通常時の抽選率。内部状態の全除外Gを識別できず、通常G全体の率へ置き換えません。',f['settingDistribution'])
block(8,'M08-C03','高確中チェリー→AT','公開値4/6/11/17/21%は高確滞在時のみ。演出で示唆される状態と全高確試行は一致せず、通常時チェリー全回数には使えません。',vector(8,[.04,.06,.11,.17,.21]))
block(8,'M08-C04','最終決戦（重複）','M08-C02の同一抽選。重複候補として保持し、別の当選率を作りません。')
block(8,'M08-C05','エクスドライブモード','高設定優遇で1・2と5・6は数十倍と掲載されるが、全設定別の移行率表は確認できません。モード示唆から設定を確定しません。')
block(8,'M08-N01','天国モード移行','有利区間移行・AT終了・100枚以下終了後の天国移行に設定差。公開されているのは設定1の表と設定間の倍率説明で、全設定の分布を補完しません。')
# Split exact clause from directional meaning so existing exact classifier preserves it.
for f in D[8]['findings']:
 for cat in f.get('semanticCategories',[]):
  if cat['semanticType']=='EXACT_CONSTRAINT' and 'かつ' in cat['meaning']:
   cat['details']=[cat['meaning']];cat['meaning']=cat['meaning'].split('かつ')[0]
# 09: bounded conflict, appearance distributions, hidden state exclusions.
source(9,'cherry_hissho','https://hisshobon.com/machineinfo/83540/','必勝本 中段チェリー出現抽選')
source(9,'cherry_extra','https://1geki.jp/slot/l_bofuri/0/','一撃 防振り設定差（矛盾の追加照合1回）')
source(9,'characters','https://nana-press.com/kaiseki/machine/764/21905/','キャラ紹介の順番法則と消化G別分布')
source(9,'end','https://nana-press.com/kaiseki/machine/764/21907/','ボーナス終了画面の消化G別分布')
source(9,'touch','https://nana-press.com/kaiseki/machine/764/21909/','サブ液晶コメントの全カテゴリ分布')
f=item(9,'M09-C03');b=block(9,'M09-C03','中段チェリー','設定3・4が媒体間で矛盾。なな徹は1/109227・1/98304、必勝本は1/98304・1/81920。一撃への追加照合1回も後者で、訂正を確認できないためこの候補の数値推測を無効にします。',{'nana':f['settingDistribution'],'hissho':vector(9,['1/131072','1/131072','1/98304','1/81920','1/81920','1/65536'])},['overview','cherry_hissho','cherry_extra'])
b['disposition']='SOURCE_CONFLICT_UNRESOLVED';b['sourceConflictResolution']={'schemaVersion':'source-conflict-v1','status':'SOURCE_CONFLICT_UNRESOLVED','candidateId':'M09-C03','conflictingClaim':'設定3・4の出現率表の数値矛盾。リセット直後約3倍の別条件も混同しない。','checkedAt':DATE,'initialSourceIds':['overview','cherry_hissho'],'additionalCheckSourceIds':['cherry_extra'],'additionalChecksUsed':1,'runtimeUse':'DISABLED','reopenPolicy':'NEW_CONCRETE_SOURCE_ONLY','repeatPublicSearch':False}
block(9,'M09-C04','内部状態別ヒドラ目→CZ','通常・高確で当選率が異なり、高確の全滞在を外から確定できません。直撃出現率は別候補N01に保持し、内部CZ当選を全ヒドラ目へ当てはめません。',{'通常':[.25,.25,.254,.3,.317,.333],'高確':[.5,.5,.504,.55,.554,.6],'高確チェリー_スイカ':[.038,.063,.063,.083,.088,.092]})
block(9,'M09-C05','高確移行','スイカ・チェリーの内部高確移行率25.0/25.0/25.4/27.5/29.2/30.0%は公開。ただし示唆ステージだけでは全移行当否を確定できません。',vector(9,[.25,.25,.254,.275,.292,.30]))
block(9,'M09-C06','CZ継続G数','CZ別・通常/防御状態別の10/20/無限、15/30/無限の選択率は公開。途中当選で本来の保障Gが打ち切られるため、実消化Gを内部選択Gと同一視しません。',{'20G_30G選択':[.046,.046,.05,.058,.067,.075],'通常運営_極の無限':.004,'防御運営_極_機械神_天使の無限':.025})
block(9,'M09-C07','300Gゾーン等の抽選','各ゾーンの到達契機・無限CZ選択には設定差。無限は内部選択で途中当選時に識別できず、規定Gの内部加算もあるため、実Gだけの単純な到達試行へ置き換えません。',{'150G_CZ':[.4,.4,.404,.404,.404,.408],'300G_CZ':[.4,.421,.421,.475,.488,.5],'450G_CZ':[.183,.204,.208,.258,.292,.304],'650G_CZ':[.1,.104,.108,.179,.192,.233],'300G無限':[.317,.392,.396,.442,.458,.471],'300Gまでボーナス期待度':[.657,.678,.681,.735,.75,.762]})
rate(9,'M09-C08','初当たり後BET高確',[.025,.05,.054,.079,.096,.104],'最大天井契機を除く初当たりBIG・REG回数が母数。終了後のBET高確突入回数を記録。EPBBやループ当選を混ぜません。','CONDITIONAL_EVENT_TRIAL',True)
rate(9,'M09-N01','ヒドラ目契機ボーナス直撃',['1/23560','1/17029','1/14743','1/6902','1/5663','1/4889'],'通常時の対象Gを母数に、ヒドラ目契機のEPBB直撃回数を記録。CZに入ってからの当選や契機不明は除外。')
# Character order is dependent; preserve all source tables as reference and exact hints.
e=evidence(9,'M09-C09','ボーナス中キャラ紹介',[('メイプル','デフォルト'),('銀翼','高設定示唆'),('樹皇','高設定示唆'),('ミィ','高設定示唆（強）'),('ペイン','高設定示唆（極）'),('機械神','設定2否定'),('大天使メイプル','設定1・3否定'),('ドラぞう','設定3以上'),('運営','設定5以上')],'紹介の順番にも法則があるため、複数キャラを独立試行として重ねません。公開率はG帯別の参考分布に保持。確定・否定条件は適用します。',['characters'])
charrows=[[[80.85,13,5,1,.1,.05,0,0,0],[79.9,13.4,5.2,1.2,.25,0,.05,0,0],[79.2,13.8,5.4,1.2,.25,.05,0,.1,0],[76.55,14.2,5.6,2,1,.05,.5,.1,0],[75.65,14.6,5.8,2,1.25,.5,.05,.1,.05],[73.85,15,6,2.5,1.5,.5,.5,.1,.05]],[[80.85,13,5,1,.1,.05,0,0,0],[79.9,13.4,5.2,1.2,.25,0,.05,0,0],[78.8,13.8,5.4,1.2,.25,.05,0,.5,0],[75.25,14.2,5.6,2,1,.2,1.25,.5,0],[74.15,14.6,5.8,2,1.25,1.25,.2,.5,.25],[71.75,15,6,2.5,1.5,1.25,1.25,.5,.25]],[[80.85,13,5,1,.1,.05,0,0,0],[79.9,13.4,5.2,1.2,.25,0,.05,0,0],[76.8,13.8,5.4,1.2,.25,.05,0,2.5,0],[68.25,14.2,5.6,2,1,.2,6.25,2.5,0],[66.4,14.6,5.8,2,1.25,6.25,.2,2.5,1],[58.99,15,6,2.5,1.5,6.25,6.25,2.5,1]]]
for j,(band,rs) in enumerate(zip(['1～5000G・8001G以降','5001～7000G','7001～8000G'],charrows),1):
 f=categorical(9,f'M09-N0{j+1}','キャラ紹介参考分布（'+band+'）',[x['label'] for x in e['semanticCategories']],rs,'消化G帯別の公開分布。紹介順の依存があり、各紹介を独立試行として数値推測しません。','CONDITIONAL_EVENT_TRIAL',['characters']);f['observationType']='reference_distribution'
# End screens: single numerical input per game band; exact evidence is linked only to first band.
endlabels=['エフェクトなし','マイユイメイド','昼ビーチ','夕方ビーチ','バニーガール','メイプルオールスター','楓の木ガールズ']
ends=[[[69.9,25,5,.1,0,0,0],[68.3,26,5.5,.2,0,0,0],[67,27,5.5,.5,0,0,0],[63.45,28,7,1.5,.05,0,0],[61.4,29,7.5,2,.05,.05,0],[59.75,30,8,2,.1,.1,.05]],[[69.9,25,5,.1,0,0,0],[68.3,26,5.5,.2,0,0,0],[67,27,5.5,.5,0,0,0],[62.5,28,7,1.5,1,0,0],[58.5,29,7.5,2,2,1,0],[55,30,8,2,2,2,1]],[[69.9,25,5,.1,0,0,0],[68.3,26,5.5,.2,0,0,0],[67,27,5.5,.5,0,0,0],[53.5,28,7,1.5,10,0,0],[46.5,29,7.5,2,5,10,0],[40,30,8,2,5,5,10]]]
for j,(band,rs) in enumerate(zip(['1～5000G・8001G以降','5001～7000G','7001～8000G'],ends)):
 c='M09-C10' if j==0 else f'M09-N0{j+4}'
 f=categorical(9,c,'終了画面（'+band+'）',endlabels,rs,'当日の消化Gが'+band+'の終了画面だけを分類。EPBB・天使/暴虐ゾーン経由の固定画面は除外。G帯不明の観測は数値計算に入れません。','CONDITIONAL_EVENT_TRIAL',['end'])
 f['observationContext']={'groupingApproved':True,'opportunityId':'bofuri_bonus_end','conditionId':'band'+str(j),'groupTitle':'ボーナス終了画面','conditionLabel':band}
labels=['メイプルちゃんしか勝たん','サリーちゃんしか勝たん','楓の木しか勝たん','長い冒険になりそうだ','オリハルコンかな？']
categorical(9,'M09-C12','終了時サブ液晶コメント',labels,[[49.97,49.97,.06,0,0],[56.9,42.9,.2,0,0],[42.8,56.8,.4,0,0],[56.9,42,1,.1,0],[41.98,56.9,1,.12,0],[57.04,41.30,1.5,.15,.01]],'EPBB以外の終了画面でサブ液晶をタッチし、4つ目のコメントを1回だけ分類。2種類の比率表を全5カテゴリの表と重ねません。','CONDITIONAL_EVENT_TRIAL',['touch'])
evidence(9,'M09-N07','獲得枚数表示',[('456枚OVER','設定4以上'),('666枚OVER','設定6')],'専用の獲得枚数表示のみ記録。通常カウンタが該当枚数を通過しただけでは数えません。')
dependency(9,['M09-C01','M09-V01','M09-N01','M09-C08'],'bofuri_bonus_path','CAUSAL_PATH_OVERLAP','初当たり・ループ込み合算・ヒドラ目直撃・当選後BET高確は同じ当選系列。正式スコア比較で代表を選び独立加算しません。')
# 10
block(10,'M10-C04','ボーナス後高確・超高確移行','BB終了後は超高確を抽選し、外れた時に高確を抽選する二段階。演出ステージは前兆でも移行するため、全移行成否や内部保障Gを正確に数えられません。',{'高確非当選':[74.6,72.7,69.9,67.2,64.1,57.8],'超高確非当選':[98.4,98,95.7,94.5,92.2,86.7]})
block(10,'M10-C06','ミッション成功率','ミッションは種別や成立役で成功期待度が変化。今回の設定判別総覧はスイカ直撃・ボーナス確率・終了後状態移行が対象で、ミッション成功率の全設定別表は確認できません。')
block(10,'M10-C07','直撃契機','スイカのボーナス直撃はM10-C03に保持。同じ成功を別の直撃候補として二重に数えません。')
item(10,'M10-C03')['denominatorSemantics']='通常時のスイカ成立回数が母数。ミッション経由を除いたスイカからのボーナス直撃だけを成功に記録。'
dependency(10,['M10-C01','M10-C02','M10-C03','M10-V01'],'sf_bonus','CAUSAL_PATH_OVERLAP','BB・RBとその合算、スイカ直撃は同じ当選を含むため単一代表で使用。')

# Synchronize exact scopes, source claims, ledger, and 20 fact-specific survey domains below.
# Preserve exact meanings on the same canonical numerical category input.
for num,hint,pairs in [
 ('M09-C10','M09-E01',list(zip(endlabels,['デフォルト','高設定示唆','高設定示唆（強）','高設定示唆（極）','設定4以上','設定5以上','設定6']))),
 ('M09-N05','M09-E02',list(zip(endlabels,['デフォルト','高設定示唆','高設定示唆（強）','高設定示唆（極）','設定4以上','設定5以上','設定6']))),
 ('M09-N06','M09-E03',list(zip(endlabels,['デフォルト','高設定示唆','高設定示唆（強）','高設定示唆（極）','設定4以上','設定5以上','設定6']))),
 ('M09-C12','M09-E04',list(zip(labels,['偶数設定示唆','設定3・5示唆','高設定示唆（極）','設定4以上','設定6'])))]:
 n=item(9,num);e=evidence(9,hint,n['label']+'の示唆',pairs,n['denominatorSemantics'],n['sourceIds'])
 for c in e['semanticCategories']:c['linkedFindingId']=num
 e['details']=[n['denominatorSemantics'],'出現回数は同じ数値入力を共有。設定確定条件用に別カウンタへ複写しません。']
 n['mirrorsEvidenceFindingId']=hint;n['categoricalEvidenceReconciliation']={'type':'SINGLE_CANONICAL_CATEGORY_INPUT','evidenceFindingId':hint,'runtimeLinkContract':'EXPLICIT_CATEGORY_LINK_V1'}
# The published zero in the gold announcement also retains its exact setting-1 exclusion.
f=item(3,'M03-N06')
f['settingDistribution']={k: ' / '.join('金文字：'+token.strip() for token in v.split('/')) for k,v in f['settingDistribution'].items()}
e=evidence(3,'M03-N09','金文字BIG告知の設定示唆',[('金文字：ピンク7','デフォルト'),('金文字：白7','デフォルト'),('金文字：REG告知からBIG昇格','設定1否定')],f['denominatorSemantics'])
for c in e['semanticCategories']:c['linkedFindingId']='M03-N06'
f['mirrorsEvidenceFindingId']='M03-N09';f['categoricalEvidenceReconciliation']={'type':'SINGLE_CANONICAL_CATEGORY_INPUT','evidenceFindingId':'M03-N09','runtimeLinkContract':'EXPLICIT_CATEGORY_LINK_V1'}
e['details']=[f['denominatorSemantics'],'金文字BIGの同じ観測入力で出現率と設定否定を処理し、別回数へ複写しません。']

# The ordinary/gold BIG announcements are different trial universes.
item(3,'M03-N05')['trialUniverse']='AOHARU_NORMAL_TEXT_BIG_TRIAL'
item(3,'M03-N06')['trialUniverse']='AOHARU_GOLD_TEXT_BIG_TRIAL'
for a,b in [('M03-N05','通常文字'),('M03-N06','金文字')]:
 item(3,a)['observationContext']={'groupingApproved':True,'opportunityId':'aoharu_big_announcement','conditionId':a,'groupTitle':'BIG告知パターン','conditionLabel':b}
# Distinct observed game bands prevent any pooling by downstream presentation.
for c in ['M09-C10','M09-N05','M09-N06']:item(9,c)['trialUniverse']='BOFURI_END_'+c.replace('-','_')+'_TRIAL'
# Physical counting policy, source-independent and retained explicitly.
for i in [1,4,6,7,8,9,10]:
 d=D[i];d['productObservationPolicy']={'authority':'USER_EXPLICIT_INSTRUCTION','artifact':'production/RESEARCH_PROCESS_CONTRACT.md','publishedDenominatorEquivalence':'NOT_ASSERTED','countingRule':'OKISLOT_CHAIN_ZONE_EXCLUDED' if i==4 else 'AT_AFTER_CLEAR_RETURN_ZONE_INITIAL'}
 for c in ({1:['M01-C01'],4:['M04-C01'],6:['M06-C01','M06-C02'],7:['M07-C01'],8:['M08-C01'],9:['M09-C01'],10:['M10-C01','M10-C02','M10-V01']}[i]):
  f=item(i,c);f['operationalCounting']={'authority':'USER_EXPLICIT_INSTRUCTION','policyArtifact':d['productObservationPolicy']['artifact'],'publishedDenominatorEquivalence':'NOT_ASSERTED'}
  if i!=4:
   f['denominatorSemantics']='通常ゲーム数を母数に、AT・ST・明確な引き戻しゾーン内を除いた初当たりを記録。明確なゾーン終了後の当選は初当たりに含めます。'
   if i==9:f['denominatorSemantics']='防御状態中の連チャンを除く通常Gとボーナス初当たり回数。防御状態終了を確認後の当選は初当たりとして記録。'
# Source-observed game rates must not remain in the draft's event-trial universe.
for i,ids in [(2,['M02-V02','M02-V03']),(6,['M06-C01','M06-C02']),(10,['M10-C01','M10-C02','M10-V01'])]:
 for c in ids:item(i,c)['trialUniverse']='NORMAL_GAME_TRIAL'
for c in ['M03-C01','M03-C02']:item(3,c)['trialUniverse']='NORMAL_GAME_TRIAL'
for c in ['M03-C03','M03-C05']:item(3,c)['trialUniverse']='NORMAL_GAME_TRIAL'
item(3,'M03-C04')['trialUniverse']='TOTAL_GAME_TRIAL'
item(3,'M03-C04')['denominatorSemantics']='通常時とボーナス中でスイカ確率は共通。両区間の実消化G合計とスイカ回数を記録。'
item(9,'M09-C02')['denominatorSemantics']='擬似遊技を除く実消化総ゲーム数と、上段に揃った5枚ベル回数を記録。実機連動機能の擬似遊技を含む総Gをそのまま使わない。'
item(9,'M09-V01')['trialUniverse']='NORMAL_GAME_TRIAL'
item(9,'M09-V01')['denominatorSemantics']='ボーナス消化Gを除く通常時と防御状態中のG合計が母数。ループを含む全ボーナス回数を記録。初当たりだけの回数とは混ぜない。'
item(7,'M07-C02')['denominatorSemantics']='通常時・ボーナス・STを含む実消化総ゲーム数と通常のスイカ回数を記録。無双スイカは別に分類。'
for c in ['M04-C03','M04-V01']:item(4,c)['trialUniverse']='NORMAL_GAME_TRIAL'
# Ninja also uses a 32G heaven chain, so apply the existing Okinawa-chain counting rule.
D[1]['productObservationPolicy']['countingRule']='OKISLOT_CHAIN_ZONE_EXCLUDED'
item(1,'M01-C01')['trialUniverse']='NON_CHAIN_BONUS_INITIAL_GAME_TRIAL'
item(1,'M01-C01')['denominatorSemantics']='通常消化Gからボーナス後32Gの連チャンゾーン消化Gを除外。32G内の当選を初当たりに含めず、33G以降を記録。'

# Separate the games counted under different reel-targeting methods.
item(3,'M03-C03')['trialUniverse']='AOHARU_WHITE7_GAME_TRIAL'
item(3,'M03-C03')['inputPresentation']={'trialLabel':'白7狙いのゲーム数','successLabel':'共通3枚ベルA回数'}
item(3,'M03-C05')['trialUniverse']='AOHARU_PINK7_GAME_TRIAL'
item(3,'M03-C05')['inputPresentation']={'trialLabel':'ピンク7狙いのゲーム数','successLabel':'ハズレB回数'}
for cid,condition,label in [('M08-C06','screen','終了画面'),('M08-C09','voice','裏ボイス')]:
 item(8,cid)['observationContext']={'groupingApproved':True,'opportunityId':'sympho_at_end','conditionId':condition,'groupTitle':'AT終了時の設定示唆','conditionLabel':label}

# Correct scope descriptions are also the live-observation reason; no provisional placeholders.
for d in D.values():
 for f in d['findings']:
  if f.get('settingDistribution') and f['observationType']!='reference_distribution':
   f['liveObservation']['reason']=f['denominatorSemantics']
   if not f['details']:f['details']=[f['denominatorSemantics']]
 for f in d['findings']:
  if f['observationType']=='evidence':
   for cat in f.get('semanticCategories',[]):
    # Keep exact part separate from a directional hint in the preserved original artifact.
    if cat['semanticType']=='EXACT_CONSTRAINT' and 'かつ' in cat['meaning']:
     cat['details']=[cat['meaning']];cat['meaning']=cat['meaning'].split('かつ')[0]

# Per-machine bounded survey results, in RESEARCH_COMPLETENESS_DOMAINS order.
NOTES={
1:[
'初当たり合算はC01。BIG/REGの連チャン込み確率とは分離した。',
'BIG/REGの公開表をN01/N02へ追加。BIG中キャラとREG終了色も個別保持。',
'巻物・共通ベルがCZ契機。さくらランプのハズレ時表示維持はC06。小役成立確率の設定別表は総覧にない。',
'非連戦の巻物CZ率はC03、重複見出しはC07。連戦状態を全試行識別できず数値投入しない。',
'疑似ボーナス型AT。ATの独立初当たりをボーナス以外に追加せずC01/N01/N02で扱う。',
'通常A/B/さくら直撃C02と連戦非滞在CZ C03は内部条件付き。無条件への変換を禁止。',
'通常モードと連戦ショート/ロングは別管理。通常A/B確定の一部演出でも全滞在Gは復元できない。',
'巻物/CZ時に連戦移行、通常時/ボーナス中に転落。非連戦全試行の識別には使えない。',
'巻物CZ当選率は条件付きC03、表示維持は目視成功C06。内部クリアと消灯を同一視しない。',
'さくらカウンタはチェリーで加算しハズレで維持/クリア。表示維持と内部維持を分離した。',
'消灯後も内部カウンタを維持する場合あり。隠れた維持数を入力・推定しない。',
'さくらランプミッションとCZは異なる抽選。CZ中をC06の試行に含めない。',
'リセット時4モード各25%をC08に記録。設定別分布として加点しない。',
'BIG/REG後の天国ループと初当たりを分離。同じボーナス系列は依存群で代表選択。',
'通常告知やCZ告知を新たな独立設定情報とはしない。キャラ紹介はC04で具体化。',
'巻物CZは非連戦時のみ設定差。成立役と内部条件の混合をしない。',
'BIGとREGの確率、紹介と文字色は種類別に保持。合算系列を独立加算しない。',
'BIG残りG十位の設定否定、同一BIG3キャラ設定6、REG紫設定5以上を復元。',
'実戦3000Gのグラフは設定別尤度でない。外部実戦の頻度から未公表率を作らない。',
'さくら表示維持9.4～12.5%と内部クリア81.3～75.0%の混同を修正。'],
2:[
'CZ V02・ART V03は通常G、実ボーナスV01はART中も含む対象総Gへ分離。',
'赤7 C01・異色C07を復元。青7は設定共通、FC1/655.4は設定共通として新尤度を作らない。',
'スイカV04・強チャンス目V05を公開全設定表で保持。その他は設定1だけと区別。',
'CZ当選率V02とFHの役別条件C06を保持。内部状態を推定して混ぜない。',
'ART V03はCZからの上流下流重複を依存群へ送る。',
'通常/高確FH当選率はC06。超高確などと区別できない期間を通常率に当てはめない。',
'ファミリアホーム当選は内部状態別。モード名だけでゲーム数を分母にできるとは判断しない。',
'通常と高確でFH抽選率が変化。示唆ステージを完全な状態観測へ置換しない。',
'V06/V07は対象小役回数に対するボーナス同時当選率。V01のボーナスと重複群。',
'FH当選率とCZ/ART到達率を混ぜず保持。独立の設定別ポイント分布は今回の総覧にない。',
'ART当選契機の内訳はC08で閉じる。ストックの未公表設定別表を生成しない。',
'枚数閾値56/222/246/274/374/456/666/1274/2374/3456表示をN03に記録。',
'リセット専用の設定別観測分布は確認した設定判別総覧の候補外。リセット推定をFH状態の確定に使わない。',
'FB終了画面N04はEP専用画面の例外条件を保持。',
'FCナビはキャラと左/中/右の位置が必要。通常2キャラ比率N02と特殊ナビN01を分離。',
'スイカ/強チャンス目の成立率と重複率、FH率の内部条件を別々に記録。',
'ファミリアボーナスとFCを区別。EP専用画面の設定否定は対応EP以外でのみ有効。',
'セリフ・紫LED・特殊ナビ・枚数・終了画面の確定/否定を取りこぼさず保持。',
'独自調査値であることを出典種別に保持。外部実戦から追加の設定率を推定しない。',
'スイカ入賞後タッチとFC位置別ナビの操作条件を具体化。'],
3:[
'BIG C01/REG C02の公開率を保持。同じボーナス系列は前兆契機率と独立加算しない。',
'BIG前半リプレイ、告知通常文字/金文字の分布を追加。',
'ベルAは白7、ハズレBはピンク7で識別。BAR狙いのGを同じ試行に含めない。',
'操チャンス恩恵は内部CZ区分で、自力成功と内部確定を同一視しないN08。',
'ATの主出力はBIG/REG。未掲載の別AT初当たりを推定追加しない。',
'通常非前兆のリーチ目N01は内部前兆境界を識別できずブロック。',
'リセットBBモード優遇はC10。全設定数値がないので補間しない。',
'リハーサル中は前兆発生率が異なるためC09/N03/N04から除外。',
'ミュージック前兆は契機別にハズレA/チェリー/スイカを分けて母数を記録。',
'操チャンスの恩恵振分は成立役別。見た目の結果だけで内部選択を逆算しない。',
'ボーナスストック等を含む告知と内部恩恵を同じ入力として使わない。N08に閉鎖理由。',
'非前兆・前半パート・技術介入発生除外の境界を区別。',
'BBモード選択率の設定別表未掲載。高設定優遇という文章から数値を作らない。',
'BIG終了サインとREG曲紹介を別観測として保持。19時/21時優遇は率不明のため頻度評価しない。',
'BIGリプレイは技術介入発生時を除外した中段/右下がり。通常時のリプレイ区分と混ぜない。',
'リハーサル以外の役別前兆率を新規候補へ反映。',
'金文字BIG昇格は設定1否定を含む既知分布N06。通常文字N05と混ぜない。',
'サイン白/赤/銀/金/虹とREG曲の確定示唆を保持。',
'実戦の時刻別出やすさから正確な出現率を推定しない。',
'打ち分けによる観測可能性を追加し、前兆・内部CZ選択と目視結果の混同を除去。'],
4:[
'32G連チャン除外の初当たりC01。通常A/B率C02を全通常Gに使わない。',
'BIG/REGと初当たり合算は別表。今回は初当たり、チェリー、確定役の観測を保持。',
'チェリーB V01、確定役B C03、代替チェリー合算N01を保持。',
'専用CZ初当たりを持つ機種ではなく、ボーナス/天国ループを扱う。',
'疑似ボーナスAT機。ボーナス中を通常G母数に含めない。',
'通常A/B・引き戻し・チャンス条件のレア役抽選はC06、V02。内部識別不可を明記。',
'黒ドキを含む10モード。モード間の全設定表はなく、見た目で黒ドキ判定できない。',
'非有利区間から黒ドキへの移行は隠れている。内部状態を入力から推定しない。',
'チェリー/スイカのボーナス当選率はモード別。通常時全レア役へ混ぜない。',
'点数分布ではなくモード別天井を持つ構造。閾値の設定差表は総覧にない。',
'天国/ドキドキのループ保証と初当たりを同じ試行としない。',
'天国等は32G、通常AB999G等。32G内当選と消化Gを初当たり母数から除外。',
'変更後約40%でチャンス。全設定値を推定して設定差に使わない。',
'ボーナス当選でモード移行。点灯パターンは次回モードの示唆。',
'チェリーは左/中第1停止、確定役Bは左第1停止の識別条件。',
'チェリーとスイカはモード条件で当選率が異なるC06。',
'スイカ契機BIG等の種類優遇と設定差を混同しない。',
'ハイビスカスはモードやBIGの示唆であり、設定確定演出として使わない。',
'実機連動のチェリー合計はB不明時の代替候補N01。Bと同時加算しない。',
'黒ドキの見た目判別不可と、32G除外だけでは通常AB限定にならない点を記録。'],
5:[
'擬似ノーマルATのBIG/REGは通常G母数。1998年機の値を混ぜない。',
'BIG C01/REG C02とロングフリーズN03を保持。',
'3枚チェリーN01・スイカN02の数値あり。8枚押し順/共通1枚は識別手順不足を個別記録。',
'完全確率の告知ボーナス型で専用CZ抽選の機構は確認資料にない。',
'メーカー分類はAT。44G等のボーナス消化Gを分母へ混ぜない。',
'内部成立の8枚押し順ベルと共通1枚役は入賞回数と異なるためN04/N05に分離。',
'天国ループ等のモード移行を用いる機種ではなく、完全確率抽選と掲載。',
'告知ボーナスを抽選する通常とボーナスATを区別。未掲載の内部状態率を追加しない。',
'通常ゲームのBIG/REG/フリーズを記録。設定別のCZ成功率はない構造。',
'擬似ノーマルのためポイント到達で当たる設定判別モデルを設けない。',
'ボーナス入賞失敗時は次G擬似遊技で入賞する仕様。持ち越しを追加抽選として数えない。',
'天井なし。BIGの303枚保障と設定推測閾値を混同しない。',
'設定L搭載は確認、Lの数値は未掲載。通常設定ベクトルにLを補間しない。',
'ボーナス終了後は通常確率抽選。未掲載の終了画面設定示唆を作らない。',
'予告音でチェリーを狙い、スイカ取りこぼしなし。押し順成立率と停止結果を分離。',
'小役別設定差をN01/N02/N04/N05へ分離。リプレイ・15枚押順・1枚チェリーは共通。',
'REG比率C05はBIG/REGから派生する同じ情報で別尤度にしない。',
'フラミンゴ点灯はボーナス告知、プレミアはBIG示唆。設定確定としての採用はしない。',
'総覧の小役調査中表示より詳細なHAZUSE公開値を優先し、欠落扱いを撤回。',
'2024/7/8アムテックスSバハマ30の同定を明示。旧オリンピア機を除外。'],
6:[
'通常ボーナスC01とST初当たりC02を分離。ST中ボーナスは含めない。',
'通常REG/BIG/ゴールデンBIGの全設定値をN01～N03へ復元。',
'通常の小役成立率は全設定共通。弱チェリー/スイカ重複だけC03に設定差。',
'独立CZではなく通常ボーナスからSTへ入る機種。ST当選を別CZとして追加しない。',
'収穫祭は10GのSTストック型AT。ST消化Gを通常ボーナス母数から除外。',
'弱レア役重複は通常時の率でST1/15とは異なる。',
'ゴールデンチャンスなどボーナス種別とSTの状態変化を設定確定としない。',
'ST中/通常時でボーナス抽選率が異なるため別の観測範囲。',
'通常弱レア役の同時当選率5.00～7.81%をC03。強役25%、リーチ目100%は共通。',
'残りSTOCKランプはストック数示唆。設定別のポイント分布ではない。',
'STストックは通常BIG以上やREG経由で獲得。C01/C02との経路重複を依存群。',
'ボーナス即連のST10Gと通常初当たりを混同しない。',
'下パネル常時点滅の設定LはC04。Lの未公表確率は通常設定に混入しない。',
'通常BIG以上でSTへ。ST中ボーナス1/15は全設定共通でC06。',
'押し順ブドウなどの入賞と内部成立を別の設定差として作らない。',
'弱チェリー/スイカ契機はC03、重複C07は閉じる。',
'通常REG・BIG・ゴールデンBIGの種類とST中BIGを分離。',
'HAPPY/STOCK/楽曲は当選やストック示唆。通常設定の確定演出とみなさない。',
'HAZUSE/一撃の通常・ST表を照合。未公表Lを外部推定で補完しない。',
'通常合算と全体合算（ST込み）を混ぜない設計を固定。'],
7:[
'ボーナス初当たりC01とユリア直撃C05を包含関係として保持。',
'ユリアはポイント当選と毎G直撃を分離し、契機不明は直撃に含めない。',
'スイカC02、無双チェリー/スイカC03。後者は通常・ボーナス中のみでSTを除く。',
'宿命ブレイクはストックの内部当選率C04。見た目の突入率と置き換えない。',
'ST終了水晶C08、サミートロフィーC09を保持。',
'内部ストックC04とブルーセブンC07は、全抽選当否の識別ができない。',
'ブルーセブンは有利区間移行/ST終了時の抽選。レア役別枠との混合を避ける。',
'無双役は出現できる区間を限定し、ST全Gを含めない。',
'激闘ロードのフェイク前兆終了回数に対する伝授キャラ獲得C06は直接観測可能。',
'ユリアポイント到達と毎G直撃は別経路。C05の成功数からポイント当選を除外。',
'宿命ブレイク当選はストックされ後で放出。未放出数を推定しない。',
'宿命カウンタの到達と直撃を分離。メニュー表示だけで全内部ストックを逆算しない。',
'有利区間移行でのブルーセブン抽選はC07。設定変更から設定ベクトルを補完しない。',
'ST終了後PUSHの水晶とST終了の内部モード抽選は別情報。',
'ST終了PUSHが水晶確認操作。トロフィーは出現色を記録。',
'無双役2役合算は同一対象Gと合計回数。スイカ一般と無双スイカを混ぜない。',
'ユリア直撃は初当たり全体に含まれるため同時独立加算しない。',
'水晶の緑=2以上、敵黄=4以上、ユリア金=6とトロフィーを保持。',
'公開全設定率を用い、外部実戦のストック回数から内部率を推定しない。',
'伝授キャラは通常フェイク前兆の終了時という対象機会を明記。'],
8:[
'AT初当たりC01を保持。最終決戦率は別内部条件C02。',
'AT中のボーナスとAT初当たりを混同せず、未掲載の設定別ボーナス率を作らない。',
'チェリー契機の高確AT抽選C03は成立率ではない。',
'最終決戦C02はCZ/AT前兆・内部高確・フリーズ高確除外が必要。',
'AT初当たりと終了画面・裏ボイス・ギアVを個別保持。',
'高確チェリーと最終決戦の全対象G/役数は内部条件のため確定できない。',
'天国移行N01は設定1表と倍率説明、エクスドライブC05は数十倍の説明で全設定表なし。',
'内部高確/フリーズ高確を通常G全体から完全に除外できない。',
'高確チェリーAT当選率4～21%を保持し、無条件率にしない。',
'ギアV上乗せ20/7/6は確定示唆。上乗せ量の通常分布と混ぜない。',
'最終決戦特殊PUSHはVストック2個以上保有条件。単なるV獲得を設定確定にしない。',
'AT100枚以下終了時のモード優遇もN01に保持。全設定表を補間しない。',
'有利区間移行時の天国率はN01の限定情報として保存。',
'AT終了時に画面と裏ボタン、ED中は非フォニックのレア役時ランプを観測。',
'クリスのPUSH連打中表示20/7/6と最終決戦特殊PUSHを具体化。',
'高確中チェリーのみのAT抽選はC03。フォニック目をEDランプ試行から除外。',
'AT中ボーナスの種類による抽選率を初当たり率へ混入しない。',
'終了画面・裏ボイス・ギアV・EDランプ・最終決戦PUSHの確定条件を保持。',
'外部の推定高設定実戦をモード移行全設定率の代用にしない。',
'内部条件付き最終決戦とその重複C04を区別し、確定演出C10は残す。'],
9:[
'ボーナス初当たりC01と防御ループ込みV01を別の母数/回数で保持。',
'BIG/REG後BET高確C08は最大天井を除く。EPBBなどを混ぜない。',
'上段5枚ベルC02と中段チェリーC03。後者は設定3/4の資料矛盾で限定閉鎖。',
'内部通常/高確のヒドラ目CZ C04、保障G C06、ゾーンC07は条件を保存。',
'防御状態のループと通常初当たりは同じ系列のため代表選択。',
'高確移行・CZの内部状態、CZ無限選択を目視結果へ置換しない。',
'防御状態のレベルやループの設定別モデルを外部結果から推定しない。',
'スイカ/チェリーの高確移行C05は、全移行の当否が見えず無条件に使わない。',
'初当たり後BET高確C08は当選機会を観測。CZ継続Gは途中当選による打切りがある。',
'規定G抽選は内部加算・天井短縮と区別。実Gに全表をそのまま当てない。',
'防御ループと初当たりを依存群へ送る。持ち越しレベルを推定入力しない。',
'300Gゾーンの無限CZは内部選択で、早期当選時は確定不可C07。',
'リセット直後の中段チェリー約3倍と通常値を分離。矛盾候補を再調査ループさせない。',
'終了画面はG帯別、EPBB/天使/暴虐固定画面を除外。サブ液晶はEPBB除外。',
'サブ液晶タッチの4つ目コメントだけが対象。複数コメントを独立試行としない。',
'ヒドラ目直撃N01と状態別CZ率C04は別。CZ経由の当選を直撃に含めない。',
'初当たりBIG/REGに限定したBET高確率と、最大天井の確定突入を分離。',
'紹介/終了画面/枚数/トロフィー/サブ液晶を保持。公表率は未知扱いにしない。',
'実機連動の総Gは擬似遊技を含み得るため、上段ベルの実G母数を優先。',
'キャラ紹介は順番の依存あり、3G帯の率を参考保持。終了画面とコメントは数値と確定制約を1入力で結合。'],
10:[
'BB C01・RB C02・合算V01は通常ゲーム母数の同じ当選系列。',
'バトルボーナスと樽ボーナスを区別し、合算へ含めた後に再加算しない。',
'スイカ成立率の設定差ではなく、スイカ時の直撃率C03を保持。',
'通常/バトル/豪鬼ミッションはCZ。設定別成功率の全表は確認範囲にないC06。',
'技術介入ボーナスで、ミッション経由と直撃を分離。独立AT率は追加しない。',
'BB後の超高確抽選→非当選時の高確抽選は二段階C04。',
'ミッションモードの役割と、設定別の内部モード率が公開されていることを同一視しない。',
'道場等は高確示唆/前兆の両方があるため、内部高確全当否の確定には使わない。',
'スイカ直接ボーナス0.4～3.9%を対象スイカ回数で評価。ミッション成功率とは別。',
'ファイターポイントやJAC技術介入を、設定差のある新分布として推定しない。',
'BB後の保障Gを見た目のステージ滞在Gで復元しない。',
'高確10/20/30/50Gと超高確10/20/30Gは内部選択。全区分を記録できないC04。',
'リセット後の状態を通常のBB終了後と混ぜない。設定変更推定だけで抽選当否を作らない。',
'BB終了時のエンタトロフィーC05を保持。終了後状態移行率とは別。',
'技術介入ナビ/成功回数の設定差表を仮定しない。BB終了トロフィーは色を記録。',
'スイカ直撃は役成立回数が母数。ボーナス初当たりと同時独立加算しない。',
'BB/RB合算を代表候補として既存Contractで選ぶ。種類別と二重評価しない。',
'銅2以上・銀3以上・金4以上・紅葉5以上・虹6を保持。',
'完全攻略時の機械割は遊技技術込みの出玉率で、設定別観測確率へ変換しない。',
'BB後の二段階状態抽選と、見た目の道場/前兆の非同一性を記録。']}
# Explicit query-to-candidate links from the actual searches, not fabricated query history.
QMAP={1:[['M01-C03','M01-C07','M01-C08'],['M01-C06'],['M01-C01','M01-N01','M01-N02']],2:[['M02-C04','M02-C05','M02-N01','M02-N03','M02-N04'],['M02-C06'],['M02-V04','M02-V05','M02-V06','M02-V07']],3:[['M03-C03','M03-C05'],['M03-N05','M03-N06','M03-N07'],['M03-C09','M03-C10','M03-N03','M03-N04']],4:[['M04-C03','M04-V01'],['M04-C04','M04-C07'],['M04-C01','M04-C08']],5:[['M05-N01','M05-N02','M05-N03'],['M05-C02','M05-C03','M05-C05'],['M05-N04','M05-N05']],6:[['M06-C03','M06-C07'],['M06-C06'],['M06-C04','M06-C08']],7:[['M07-C04'],['M07-C05','M07-C06'],['M07-C07','M07-C08','M07-C09']],8:[['M08-C02','M08-C04'],['M08-C05','M08-N01'],['M08-C06','M08-C09']],9:[['M09-C03'],['M09-C06','M09-C07','M09-C08'],['M09-C09','M09-C10','M09-C12']],10:[['M10-C03'],['M10-C04','M10-C06'],['M10-C05']]}
for i,d in D.items():
 assert len(NOTES[i])==20
 for q,ids in zip(queries[i-1]['queries'],QMAP[i]):
  for cid in ids:row(i,cid)['discoveryQueries'].append(q)
 for f in d['findings']:
  row(i,f['findingId'])['disposition']={'type':'FINDING','refId':f['findingId']}
  if f.get('observationType')=='evidence':
   claim=f['label']+'：'+ '、'.join(c['label']+'='+c['meaning'] for c in f.get('semanticCategories',[]))+'。'+f['details'][0]
  else:claim=f['label']+'：設定順'+json.dumps(f['settingDistribution'],ensure_ascii=False)+'。'+f['denominatorSemantics']
  for sid in f['sourceIds']:
   src=next(s for s in d['sources'] if s['sourceId']==sid)
   ownclaim=(f['label']+'の識別条件：'+f['denominatorSemantics']) if sid=='flags' else claim
   src['claims'].append(ownclaim);row(i,f['findingId'])['sourceClaims'].append({'sourceId':sid,'claim':ownclaim})
 for b in d['blockedItems']:
  claim=b['label']+'：'+b['reason']
  for sid in b['sourceIds']:
   src=next(s for s in d['sources'] if s['sourceId']==sid);src['claims'].append(claim);row(i,b['blockId'])['sourceClaims'].append({'sourceId':sid,'claim':claim})
 # Conflict sites claim only their own numbers; preserve the disagreement in the candidate.
 if i==9:
  b=item(9,'M09-C03');r=row(9,'M09-C03')
  for sid,vals in [('cherry_hissho','1/131072,1/131072,1/98304,1/81920,1/81920,1/65536'),('cherry_extra','1/131072,1/131072,1/98304,1/81920,1/81920,1/65536')]:
   s=next(s for s in d['sources'] if s['sourceId']==sid);old=next(x for x in r['sourceClaims'] if x['sourceId']==sid);s['claims'].remove(old['claim']);old['claim']='中段チェリー設定1～6の表は'+vals+'。';s['claims'].append(old['claim'])
 # No unused source record masquerades as provenance.
 d['sources']=[s for s in d['sources'] if s['claims']]
 allids=[s['sourceId'] for s in d['sources']]
 d['researchCompleteness']['domains']=[{'domain':k,'status':'CHECKED','sourceIds':allids,'note':note,'checkedAt':DATE,'reviewScope':'設定判別総覧の見出しと本文、台帳対応の個別解析、および記録した3件の機種固有検索。公開全体の不存在証明ではない。'} for k,note in zip(DOMAINS,NOTES[i])]
 d['researchCompleteness']['machineSpecificQueries']=queries[i-1]['queries']
 d['researchCompleteness']['semanticAudit']={'status':'COMPLETE','checkedAt':DATE,'method':'公開総覧の候補見出しを既存台帳と比較し、未記載要素を追加。内部状態・重複・未知率は個別経路で閉じた。','additionalCandidateCount':len(d['researchCompleteness']['candidateLedger'])-d['historicalInput']['originalCandidates'],'noCandidateQuota':True}
 d['researchCompleteness']['boundedSurveyClosure']={'closedAt':DATE,'repeatPublicSearch':False,'reopenPolicy':'NEW_CONCRETE_SOURCE_ONLY','scope':'記載した公開総覧・個別資料と機種固有検索。今後未発見の公開資料がないとは主張しない。'}
 d['researchStops']=[]
 d.pop('_claims',None);d.pop('_querymap',None)
 # Formal acceptance assigns workId separately; this remains a reviewed input document.
 (OUT/(d['machineId']+'.json')).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'batchId':BATCH,'machines':len(D),'candidates':sum(len(d['researchCompleteness']['candidateLedger']) for d in D.values()),'findings':sum(len(d['findings']) for d in D.values()),'blocks':sum(len(d['blockedItems']) for d in D.values())}))
(OUT/'CHANGE_LOG.json').write_text(json.dumps(changes,ensure_ascii=False,indent=2)+'\n')
