"""Batch021 bounded intake. Original IDs immutable; no evaluator changes."""
import json,pathlib,copy,shutil,hashlib
R=pathlib.Path(__file__).resolve().parents[1];ROOT=R.parents[1];I=R/'research-inbox/batch021';O=I/'reviewed';O.mkdir(parents=True,exist_ok=True)
H=I/'imported-handoff';BASE=I/'repository-baseline';B='batch-20261017-021';DATE='2026-10-18'
sel=json.loads((R/'next-machine-selection-20261017-batch021.json').read_text())['selected'];original=json.loads((H/'ORIGINAL_135.json').read_text());C={x['id']:x for x in original}
status={x['candidate_id']:x for x in json.loads((H/'RESEARCH_CANDIDATES_135.json').read_text())}
DOMAINS='INITIAL_HIT BONUS SMALL_ROLE CZ AT INTERNAL_CONDITIONAL_DRAW MODE_TRANSITION STATE_TRANSITION SUCCESS_RATE POINTS_GAME_DISTRIBUTION CARRY_OVER THRESHOLD_BEHAVIOR RESET_BEHAVIOR POST_EVENT_TRANSITION NAVIGATION ROLE_CONDITIONAL_DISTRIBUTION BONUS_TYPE_CONDITIONAL EVIDENCE EXTERNAL_DATA_ONLY MACHINE_SPECIFIC'.split()
D={}
for i,s in enumerate(sel,1):
 old=json.loads((BASE/s['machineId']/'research-data.json').read_text());rows=[x for x in original if x['machine_id']==f'M{i:02}'];url=status[rows[0]['id']]['source_url']
 D[i]={'schemaVersion':'research-v1','manifestVersion':'8.5','batchId':B,'machineId':s['machineId'],'machineName':s['displayName'],'researchStage':'SOURCE_REVIEW_COMPLETE_PENDING_FORMAL_ACCEPTANCE','machineIdentity':old['machine'],'settings':{'values':old['machine']['settings'],'numericInferenceValues':old['machine']['settings']},'sources':[{'sourceId':'S01','url':url,'title':s['displayName']+' 設定差と観測条件の受入照合','sourceType':'published_editorial_analysis','checkedAt':DATE,'claims':[]}],'findings':[],'blockedItems':[],'researchCompleteness':{'version':2,'domains':[],'machineSpecificQueries':[],'candidateLedger':[]},'reviewAuthority':{'productionBaseCommit':'75301b1ddcdbde32deb11d1884259446e9839e08','distributionBaseCommit':'078b34f52c18b4e2709a7a9aacf96590ea1450a3','externalAudit':'NOT_PERFORMED','auditType':'CANDIDATE_SOURCE_CONDITION_AND_REPOSITORY_SELF_AUDIT','researchClosure':'INHERITED_SCOPED_TOPIC_CLOSED','fiveSiteCompletion':'NOT_ASSERTED','manufacturerThreeSiteCompletion':'NOT_ASSERTED','repeatResearchRequired':False},'_old':old}
 # Preserve the repository baseline, source IDs and candidate data without replacing historical contracts.
 dst=I/'repository-baseline'/s['machineId'];dst.mkdir(parents=True,exist_ok=True)
 for n in ['research-data.json','selection-data.json','machine-observation-data.json']:
  if (BASE/s['machineId']/n).resolve()!=(dst/n).resolve():shutil.copy2(BASE/s['machineId']/n,dst/n)
def cid(i,n):return f'M{i:02}-{n:03}'
def keys(i):return [k.replace('SET_','') for k in D[i]['settings']['values']]
def put(i,c,obj,blocked=False,label=None):
 d=D[i]
 for k in ['findings','blockedItems']:d[k]=[f for f in d[k] if f.get('findingId',f.get('blockId'))!=c]
 f={('blockId' if blocked else 'findingId'):c,'label':label or C.get(c,{}).get('name',c),'sourceIds':['S01'],**obj}
 if c in C:f['retainedHandoffClaim']=copy.deepcopy(C[c]);f['inheritedResearchStatus']=status[c]['research_status']
 d['blockedItems' if blocked else 'findings'].append(f);return f
def block(i,n,reason,values=None,label=None):
 c=cid(i,n) if isinstance(n,int) else n
 return put(i,c,{'reason':reason,'reevaluationCondition':'不足を解決する新しい具体的な公開資料が得られた場合、この項目だけ見直します。','retainedPublishedValues':values,'closure':'CLOSED_NO_REPEAT_PUBLIC_SEARCH','runtimeUse':'DISABLED'},True,label)
def rate(i,n,values,scope,universe='NORMAL_GAME_TRIAL',conditional=False,label=None):
 c=cid(i,n) if isinstance(n,int) else n
 if isinstance(values,list):values=dict(zip(keys(i),values))
 return put(i,c,{'observationType':'conditional_probability' if conditional else 'probability','settingDistribution':values,'trialUniverse':universe,'denominatorSemantics':scope,'details':[scope],'liveObservation':{'status':'EXACT_WITH_SCOPE_TRACKING','reason':scope}},label=label)
def inv(xs):return ['1/'+str(x) for x in xs]
def pct(xs):return [x/100 for x in xs]
def cat(i,n,labels,rows,scope,meanings=None,label=None):
 c=cid(i,n) if isinstance(n,int) else n
 vs={k:' / '.join(f'{l}: {p:g}%' for l,p in zip(labels,row)) for k,row in zip(keys(i),rows)}
 f=put(i,c,{'observationType':'appearance_distribution','settingDistribution':vs,'trialUniverse':'CONDITIONAL_EVENT_TRIAL','categoryModel':{'residualPolicy':'SOURCE_EXHAUSTIVE'},'denominatorSemantics':scope,'details':[scope],'liveObservation':{'status':'EXHAUSTIVE_CATEGORICAL','reason':scope}},label=label)
 if meanings:
  e=evidence(i,c+'-E',list(zip(labels,meanings)),scope,label=f['label']+'の設定制約')
  for x in e['semanticCategories']:x['linkedFindingId']=c
  f['mirrorsEvidenceFindingId']=e['findingId'];f['categoricalEvidenceReconciliation']={'type':'SINGLE_CANONICAL_CATEGORY_INPUT','evidenceFindingId':e['findingId'],'runtimeLinkContract':'EXPLICIT_CATEGORY_LINK_V1'}
 return f
def evidence(i,n,pairs,scope,label=None):
 c=cid(i,n) if isinstance(n,int) else n;cats=[]
 for l,m in pairs:
  exact=('設定' in m and any(str(v) in m for v in range(1,7)) and not any(t in m for t in ['示唆','可能性','不一致','未確認','または','or']))
  sem='EXACT_CONSTRAINT' if exact else ('DISPLAY_ONLY' if any(t in m for t in ['デフォルト','設定示唆なし','復活','ポイント']) else 'PROBABILITY_UNKNOWN')
  cats.append({'label':l,'meaning':m,'semanticType':sem})
 details=[scope]
 if all(x['semanticType'] in ['PROBABILITY_UNKNOWN','DISPLAY_ONLY'] for x in cats):details+=['このセクションの全項目は設定別出現率が公表・確認されていないため、記録のみです。設定推測の計算には使用しません。']
 else:details+=['出現率が未確認の項目は記録のみです。設定確定・否定は、設定候補の絞り込みに反映できる可能性があります。']
 return put(i,c,{'observationType':'evidence','semanticCategories':cats,'details':details},label=label)
def group(i,ns,name):
 cs=[cid(i,n) if isinstance(n,int) else n for n in ns]
 for f in D[i]['findings']:
  if f['findingId'] in cs and f.get('settingDistribution'):
   reason='同じ当選経路の上流・下流または合算・内訳です。独立に重ねず、正式な設定判別スコアを比較して代表を選びます。'
   f.update(dependencyGroupId=name,dependencyKind='CAUSAL_PATH_OVERLAP',dependencyReason=reason,dependencyScopeAudit={'status':'KNOWN_DEPENDENCY_DEFERRED_TO_CONTRACT','reason':reason,'evidenceSourceIds':['S01']})
def ctx(f,op,cond,title,tab):f['observationContext']={'groupingApproved':True,'opportunityId':op,'conditionId':cond,'groupTitle':title,'conditionLabel':tab}
normal='通常ゲーム数と初当たり回数を記録。AT・ボーナス消化中を除き、明確な引き戻し区間内の当選は連続当選として扱います。その区間終了後の当選を初当たりに数えます。'
# M01: ceiling selection is censored by earlier wins; internal lottery success is not final CZ success.
rate(1,1,inv([133.9,133,130.8,123.1,121.1,118.9]),normal)
rate(1,2,inv([408.6,401.1,382.6,341.7,322.4,303]),normal)
block(1,3,'設定1の天井振り分けだけが確認され、他設定分が揃いません。早い当選を選択天井として数えることもできません。',{'setting1':{'500G':65.2,'1111G':34.8}})
block(1,4,'AT後の天井振り分けは設定1だけで、他設定分が揃いません。実際の当選ゲーム数から選択天井を断定しません。',{'setting1':{'500G':10.2,'1111G':89.8}})
block(1,5,'AT単発後のスルー天井振り分けは全設定共通のため、設定差の計算には使用しません。',{'0':.4,'1':24.6,'7':75})
block(1,6,'継続高校敗北後のスルー天井振り分けは全設定共通のため、設定差の計算には使用しません。',{'0':.4,'1':9.8,'5':89.8})
block(1,7,'途中で自力当選すると選択されたスルー天井を識別できません。実際のCZ回数を天井選択回数に代用しません。',{'0':[.4]*6,'1':[9.8,10.5,12.5,18.4,21.5,24.6],'7':[89.8,89.1,87.1,81.3,78.1,75]})
cat(1,8,['チャンス','レース','あんこう無双'],[[69.9,29.7,.4],[65.6,34,.4],[61.3,38.3,.4],[55.9,43.8,.4],[52.7,46.9,.4],[49.6,50,.4]],'設定変更を確認できた台の最初のCZを1種類だけ記録。変更が不明ならこの分布は使用しません。')
for n,vs in [(9,[89.8,9.8,.4]),(10,[75,24.6,.4])]:block(1,n,'設定1のCZ種別振り分けしか確認されず、他設定の確率は補えません。',{'setting1':vs})
for n in [11,12,14]:block(1,n,'抽選前後の内部通常・高確A・高確Bを全件で特定できません。見えているステージを内部状態そのものとして数えません。')
block(1,13,'高確Bでの弱チェリーによる昇格は全設定共通です。内部状態の識別にも制約があります。',{'superHigh':.4})
block(1,15,'開始時の内部成功抽選と消化中の当選を全件で区別できません。最終的なCZ成功率へ置き換えません。',{'first':[6.3]*6,'later':[.8,1.6,2.7,7,8.6,10.2]})
block(1,16,'開始時の内部ポイントを全件正確に読み取る方法が確定していません。成功結果や途中の表示から初期ポイントを逆算しません。',{'points':[0,30,60,90,100],'rows':[[29,34.1,23.1,2,11.9],[28.8,33.8,22.9,1.9,12.6],[28.2,33.1,22.5,1.9,14.3],[27.1,31.8,21.6,1.9,17.6],[26.1,30.9,20.9,1.8,20.3],[25.3,29.7,20.2,1.7,23.1]]})
rate(1,17,pct([69,68.4,67.7,66.6,66.3,66]),'ガルパンレース勝利1回につき選ばれたキャラを確認し、西住みほだった回数を記録。勝利全件を母数にし、他キャラも母数から除きません。','GIRLPAN_RACE_WIN_TRIAL',True)
evidence(1,18,[(str(v)*3,'設定'+str(v)+'以上' if v<6 else '設定6') for v in range(2,7)],'CZ中に実際に表示されたゾロ目を記録。')
evidence(1,19,[('444枚OVER','設定4以上'),('555枚OVER','設定5以上'),('666枚OVER','設定6')],'獲得枚数の特殊表示を記録。')
evidence(1,20,[('あんこう','デフォルト'),('サメさん','高設定示唆（弱）'),('サメさん水着','高設定示唆（強）'),('バニー・可','設定2以上'),('クリスマス・吉','設定3以上'),('みほ＆BC・良','設定4以上'),('みほ＆まほ・優','設定5以上'),('しほ・千代・亜美・極','設定6')],'AT終了時。復活だけを示す画面は設定の根拠にしません。')
evidence(1,21,[('スタンプ付き終了画面','設定4以上')],'エンディング専用の終了時に確認したスタンプ。AT終了画面と混同しません。')
evidence(1,22,[('白','デフォルト'),('青','設定2以上'),('緑','設定3以上'),('赤','設定4以上'),('銀','設定5以上'),('金','設定6')],'実機連動機能で取得した隠れ凪の枠色を記録。利用は任意です。')
group(1,[1,2,8,17],'girlpan_hit_path')
# M02
for n,xs in [(1,[282.9,278.1,260.6,244.1,229.2,217.5]),(2,[439.5,432.1,403.3,355.9,320.3,296.1]),(4,[6573.7,5904.7,4228.5,3124.5,2386.6,1991.5])]:rate(2,n,inv(xs),normal+('CZ・BIG成功と直撃を区別します。' if n==4 else ''))
block(2,3,'CZに設定差がある傾向はありますが、設定別の突入確率が揃いません。')
block(2,5,'毎回の内部モードを確実に見抜けないため、C確定示唆だけを移行全件の代わりにはしません。',pct([1.6,2.3,3.1,4.7,6.3,7]))
rate(2,6,pct([10.5,11.3,15.2,19.5,23.4,25.4]),'CZ中の黄エフェクトで判定した機会数と、その判定でボーナスに当選した回数。緑以上の判定は混ぜません。全件確認できない区間は使用しません。','GEASS_YELLOW_EFFECT_TRIAL',True)
rate(2,7,pct([.4,.8,1.2,1.6,2,2.3]),'AT中のスイカ回数と無限新生の当選回数。無限新生の発生中・シャムナステージを除き、抽選契機まで確認できた区間を記録します。','GEASS_AT_ELIGIBLE_WATERMELON_TRIAL',True)
block(2,8,'終了時の内部引き戻しと、引き戻し状態中のレア役による当選が混ざります。レア役を引いた結果だけを事後除外して同じ確率で計算しません。',pct([.4,.8,1.6,3.9,6.3,7.8]))
evidence(2,9,[('ルルーシュ','デフォルト'),('ルルーシュ＆スザク','設定3以上示唆'),('シャムナ／ナナリー（画像注記不一致）','キャラ名の対応未確認のため記録のみ'),('敵キャラ集合','設定4以上'),('味方キャラ集合','設定5以上')],'AT終了時。キャラ名と画像注記に不一致がある2種類は確定情報に使用しません。')
evidence(2,10,[('銅','設定2以上'),('銀','設定3以上'),('金','設定4以上'),('キリン柄','設定5以上'),('虹','設定6')],'BIGまたはAT終了時に出たトロフィー。')
group(2,[1,2,4,6],'geass_hit_path')
# M03 (settings 1,2,4,5,6)
rate(3,1,inv([299.9,292.2,272.3,256.7,244.8]),normal);rate(3,2,inv([581.8,552.7,487.8,446.2,407.3]),normal)
block(3,3,'通常へ戻った際の内部高確を全件判定できません。示唆ステージだけを高確移行として入力しません。',{'normal':[89.1,86.7,83.6,81.3,78.9],'high':[10.2,12.5,15.6,18,20.3],'superHigh':[.8]*5})
rate(3,4,pct([20.3,21.1,25,27.7,30.5]),'通常時にCZアスカVSレイの抽選対象となったスイカとCZ当選回数。AT・ボーナス中を含めず、前兆重複などで契機が不明な区間は使用しません。','GOE_NORMAL_WATERMELON_TRIAL',True)
rate(3,5,pct([30.1,30.1,37.5,37.5,39.1]),'AT中に殲滅作戦の抽選対象となったスイカ回数と突入回数。通常時やCZ消化中は混ぜません。','GOE_AT_WATERMELON_TRIAL',True)
rate(3,6,pct([49.3,50.4,51.7,52.9,65.3]),'殲滅作戦の全挑戦回数と最終勝利回数。消化中のレア役による勝利書き換えも含む総合期待度です。','GOE_EXTERMINATION_TRIAL',True)
block(3,7,'G侵食失敗後の内部スルー天井減算に当選したかを全件確認できません。次回の当選だけから減算を断定しません。',pct([4.7,7.8,10.9,11.7,12.5]))
evidence(3,8,[('シンジ','デフォルト'),('レイ','偶数示唆'),('マリ','高設定示唆（弱）'),('アスカ','高設定示唆（強）'),('レイ背景','設定2以上'),('エヴァ＆ゴジラ','設定4以上')],'ボーナス終了時。')
evidence(3,9,[('222枚OVER','設定2以上'),('456枚OVER','設定4以上'),('666枚OVER','設定6')],'特殊な獲得枚数表示。')
evidence(3,10,[('初号機','デフォルト'),('零号機','偶数示唆'),('8号機','高設定示唆（弱）'),('2号機','高設定示唆（強）'),('モスラ','設定4以上'),('エヴァ＆ゴジラ','設定5以上'),('カヲル','設定6')],'AT終了時。')
evidence(3,11,[('シンジ','デフォルト'),('マリ','高設定示唆（弱）'),('アスカ','高設定示唆（強）'),('レイ','偶数示唆'),('ミサト','奇数示唆'),('ボイスなし','設定2以上'),('加持','設定4以上'),('カヲル','設定6')],'エンディング中のレア役成立時。無音は演出機会を確認した場合だけ記録。')
# Bonus PUSH voice separate opportunity, inherited baseline retains concrete terms.
evidence(3,12,[('確認できたPUSHボイス','設定別出現率未確認')],'ボーナス終了時のPUSHボイス。終了画面やエンディングのセリフを転用しません。')
group(3,[1,2,4],'goe_hit_path');group(3,[5,6],'goe_at_cz_path')
# M04
for n,xs in [(1,[94.3,93.3,92.4,89.5,87.7,85]),(2,[197.3,190.8,182.7,172.3,162.9,154]),(4,[2081.1,1579.4,1388.3,1214.1,993.6,855.6])]:rate(4,n,inv(xs),normal+('冴えカノチャレンジ・sfを経由しないボーナスだけ直撃に数えます。' if n==4 else ''))
rate(4,3,inv([80,78.5,73.6,66.9,63,59.6]),'スイカを数えた総ゲーム数とスイカ成立回数。通常時とボーナス中で記録範囲をそろえます。','TOTAL_GAME_TRIAL')
block(4,5,'天井到達前の自力当選で選択天井が見えなくなります。131G以内の当選を131G天井の選択と同一視しません。',{'131G':[33.6,35.2,39.1,43,46.9,50]})
block(4,6,'レア役抽選は内部通常・高確で当選率が異なり、毎回の状態を確実に分けられません。')
evidence(4,7,[('恵：よろしくね','デフォルト'),('恵：なんだかなぁ','高設定示唆（弱）'),('恵：頑張ろうね','高設定示唆（強）'),('英梨々：行くわよ','デフォルト'),('英梨々：いいわよ','高設定示唆（弱）'),('英梨々：気分上がるわね','高設定示唆（強）'),('詩羽：さあ、始めましょう','デフォルト'),('詩羽：うふっ','高設定示唆（弱）'),('詩羽：楽しみね','高設定示唆（強）')],'冴えカノチャレンジ・sf開始時のヒロイン選択ボイス。')
evidence(4,8,[('詩羽＆英梨々','デフォルト'),('恵①','偶数設定示唆'),('恵②','高設定示唆（弱）'),('恵③','高設定示唆（強）'),('ヒロイン3人','設定2以上'),('ヒロイン4人','設定4以上'),('温泉','設定6')],'ぷちヒロインボーナス終了時。')
evidence(4,9,[('なし','デフォルト'),('美智留：じゃ、そゆことで～','偶数設定示唆'),('出海：倫也せんぱ～い！','偶数設定示唆'),('美智留：愛してるよ','高設定示唆'),('出海：会いたかったです','高設定示唆')],'育てるボーナス終了時のPUSHボイス。')
evidence(4,10,[('カラフル。','デフォルト'),('M♭','高設定示唆'),('DOUBLE RAINBOW DREAMS','設定2以上'),('ETERNAL♭','設定4以上'),('GLISTENING♭','設定6')],'ぷちヒロインボーナス中のsf獲得時に選ばれた楽曲。')
for n,x in [(11,87.4),(12,262.1),(13,74.5)]:rate(4,n,inv([x]*6),'成立を数えた総ゲーム数と該当役の回数。公開値は全設定共通です。','TOTAL_GAME_TRIAL')
rate(4,14,pct([55.1,55.4,56,56.9,57.5,58.1]),'育てるボーナス中のハズレ・リプレイ成立回数とLVアップアイコン獲得回数。ベル・レア役・ffは混ぜず、1成立につき1回で記録します。','SAEKANO_BONUS_MISS_REPLAY_TRIAL',True)
group(4,[1,2,3,4],'saekano_hit_path')
# M05: narrow initial-hit differences still evaluated; do not manufacture useful weights.
rate(5,1,inv([599.6,599.1,596.8,595.2,590.3,586.9]),normal);rate(5,7,inv([312.1,312,311.9,311.8,311.7,311.6]),normal)
gold=[('育成馬','デフォルト'),('まこ','奇数示唆'),('アリア','偶数示唆'),('まこ＆アリア','設定4以上'),('黄金衣装','設定6')]
evidence(5,2,gold,'GIロード終了時。');evidence(5,3,gold,'凱旋ラッシュ終了時。')
voice=['うまうま','まこ応援','アリア応援','まどか応援','調教は食事','踏み切ってジャンプ','ごーじゃす','GI優駿倶楽部ゴールド']
meaning=['デフォルト','高設定示唆（弱）','高設定示唆（強）','設定2以上','設定3以上','設定4以上','設定5以上','設定6']
levels=[[[89.9,10,.1,0,0,0,0,0],[85.3,10,1.5,3.3,0,0,0,0],[82.4,12.5,2,2.3,.8,0,0,0],[81.4,12.5,3,1.6,.8,.8,0,0],[77.9,15,4,1.6,.8,.4,.4,0],[76.9,15,5,1.6,.4,.4,.4,.4]],[[0,99,1,0,0,0,0,0],[0,92,3,5,0,0,0,0],[0,91,4,3.5,1.5,0,0,0],[0,89,6,3,1,1,0,0],[0,87,8,2.5,1,1,.5,0],[0,85,10,2,1,1,.5,.5]],[[0,98.5,1.5,0,0,0,0,0],[0,91,4,5,0,0,0,0],[0,90,5,3.5,1.5,0,0,0],[0,87.5,7.5,3,1,1,0,0],[0,85,10,2.5,1,1,.5,0],[0,82.5,12.5,2,1,1,.5,.5]],[[0,97.5,2.5,0,0,0,0,0],[0,90,5,5,0,0,0,0],[0,89,6,3.5,1.5,0,0,0],[0,86,9,3,1,1,0,0],[0,83,12,2.5,1,1,.5,0],[0,80,15,2,1,1,.5,.5]]]
for lev,rows in enumerate(levels):
 c=cid(5,4) if lev==0 else 'M05-004-L'+str(lev)
 f=cat(5,c,voice,rows,'終了画面でコナミコマンドを入力して得たボイスを1回だけ記録。設定示唆発生率アップ条件の達成回数を当日開始から確認し、'+['未達成','1～2回達成','3～4回達成','5回以上達成'][lev]+'の結果だけを入力。履歴不明なら数値計算を使わず確定情報だけ記録します。',meaning,label='コナミコマンドボイス（'+['通常','Lv1','Lv2','Lv3'][lev]+'）')
 f['conditionalStateModel']={'boostLevel':lev,'exactBoostHistoryRequired':True,'unknownHistory':'NUMERIC_DISABLED_EXACT_RETAINED'};ctx(f,'gold_command',str(lev),'コナミコマンドボイス',['通常','Lv1','Lv2','Lv3'][lev])
evidence(5,5,[('銅','設定2以上'),('銀','設定3以上'),('金','設定4以上'),('クローバー柄','設定5以上'),('虹','設定6')],'AT終了時のトロフィー。')
evidence(5,6,[('まこ＆まいLArc Rose','高設定示唆（弱）'),('まい水着','奇数示唆'),('まこ水着','偶数示唆'),('まこ＆まい水着','設定2以上'),('まこ・まい・まどか水着','設定3以上'),('うまぽん','設定4以上'),('まこ＆まいバニー','設定5以上'),('しずもん絵','設定6')],'エンディング中のレア役時のイラスト。')
block(5,'M05-008','着順はホール側が任意に設定できる表示で、遊技機の設定と確率的に対応する保証がありません。数値推測にも確定条件にも使用しません。',label='まこまこカップの着順')
group(5,[1,7],'gold_hit_path')
# M06: final probabilities replace no hidden initial success; retain each original claim.
for n,xs in [(1,[198.6,190.2,179.7,149.3,136.2,131.3]),(2,[503.8,492.2,462,395.5,369.7,350.4]),(3,[238.2,232.4,222.1,183.9,171,164.9]),(11,[1096.8,1107,1162.7,1219.8,1220.8,1236.9]),(12,[398.3,378.5,352.8,285.3,258.7,248.4]),(13,[620.1,583.5,535.1,421.2,376.5,359.8]),(15,[173,172.9,172.4,171.3,171.7,171.2])]:
 rate(6,n,inv(xs),normal+('CZ失敗後に戻った作戦会議は回数から除きます。' if n==15 else ''))
block(6,4,'突入時の内部成功と消化中の成功を全件で区別できません。最終G告知だけで突入時当選を断定せず、別項目の最終CZ突入期待度を使います。',pct([6.3,7,8.6,17.2,19.5,20.3]))
rate(6,5,pct([8.9,9.7,11.8,18.5,22.2,24.3]),'チャレンジボーナスの全回数と最終的にCZへ突入した回数。突入時の内部抽選だけではなく、公開された総合期待度で評価します。','SKY_CHALLENGE_BONUS_TRIAL',True,label='チャレンジボーナスからCZ突入')
block(6,6,'ボーナス当選時の内部CZ当選と消化中の獲得を区別できません。最終CZ突入回数に初期抽選率を当てません。',pct([6.3,7,9.4,16.4,20.3,22.7]))
block(6,7,'出撃ボーナス当選時の内部ST抽選と消化中の撃破率アップが混ざります。最終ST移行に初期抽選率を当てません。',pct([.8,.8,6.6,11.8,12.1,15.6]))
cloth=['次の衣装','次の衣装・色違い','1個飛ばし','1個飛ばし・色違い','同じ衣装','同じ衣装・色違い','1個戻り','1個戻り・色違い','2個飛ばし','水着・色違い']
cat(6,8,cloth,[[54.4,36.3,5.6,3.8,0,0,0,0,0,0],[34.3,51.4,4.5,6.7,1.3,1.9,0,0,0,0],[50.4,33.6,7.7,5.2,1.9,1.3,0,0,0,0],[32.3,48.4,5.9,8.8,1.3,1.9,.6,.9,0,0],[47.3,31.6,9.8,6.6,1.9,1.3,.9,.6,0,0],[30.2,45.3,7.3,10.9,1.3,1.9,.6,.9,.8,.8]],'チャレンジボーナスで報酬を得ず通常へ戻った際、直前の衣装からの変化を1種類記録。通常の衣装順はデフォルト→メイド→チャイナ→バニー→水着。水着色違いは宿命ポイント示唆を含むため、単独では設定6確定にしません。',['デフォルト','偶数示唆','高設定示唆','高設定・偶数示唆','設定2以上','設定2以上','設定4以上','設定4以上','設定6','設定6または宿命ポイント示唆'])
cards=['C','B1','B2','A1','A2','A3','S','SS'];cardmeans=['デフォルト','偶数示唆','高設定示唆','設定2以上','設定2・4・6','設定2以上','設定4以上','設定6']
rows=[[80,15,5,0,0,0,0,0],[71.4,21.9,6,.2,.1,.4,0,0],[77.2,15,7,.5,0,.3,0,0],[69.1,21.9,8,.2,.1,.4,.3,0],[74.9,15,9,.5,0,.3,.3,0],[66.7,21.9,10,.3,.1,.4,.3,.2]]
for n,color in [(9,'赤7'),(10,'青7')]:
 f=cat(6,n,cards,rows,color+'ボーナス終了時にTOUCHして実際にカードが出た機会だけ1種類記録。カードなしをCとして補いません。',cardmeans)
 ctx(f,'sky_bonus_end',color,'ボーナス終了カード',color)
rate(6,14,inv([69,67.5,66.1,64.7,63.4,62.3]),'弱チェリーを数えた総ゲーム数と回数。ボーナス・ST中も含め、数えた範囲とゲーム数を一致させます。','TOTAL_GAME_TRIAL')
rate(6,16,pct([50.6,51.3,52.3,57,58.4,59]),'新規の作戦会議突入回数と最終CZ突入回数。CZ失敗後に戻った作戦会議は別抽選ではないため除きます。','SKY_NEW_MEETING_TRIAL',True)
for n,xs in [(17,[.4,.8,1.5,2.9,4.2,4.5]),(18,[12.6,13.6,15.2,18.4,21.5,22.2])]:block(6,n,'内部通常・高確・超高確を全件区別できません。前兆中の書き換えもあるため、最終ボーナス当選から元の抽選を逆算しません。',pct(xs))
# Six discovered Sky surfaces: separate IDs and condition-specific children.
for c,labs,rs,means,title in [
 ('M06-019',['せあっ','くるぞ','私に力を','私たちの空へ'],[[96.9,3.1,0,0],[96.9,3.1,0,0],[96.9,3.1,0,0],[90.2,9.4,.4,0],[88.9,10.6,.6,0],[86.9,11.7,.8,.6]],['デフォルト','高設定示唆','設定4以上','設定6'],'赤7図柄揃いボイス'),
 ('M06-019-B',['ふんっ','くたばれ','お前はワシに勝てん','これで最後だ'],[[97.7,0,1.2,1.2],[97.7,1.2,0,1.2],[97.7,1.2,.6,.6],[97.7,1.2,1.2,0],[97.7,1.2,.6,.6],[97.7,1.2,.6,.6]],['デフォルト','設定1否定','設定2否定','設定4否定'],'青7図柄揃いボイス'),
 ('M06-020',['赤赤青','青青赤'],[[50,50],[43.8,56.3],[56.3,43.8],[37.5,62.5],[62.5,37.5],[50,50]],None,'チャレンジボーナス入賞図柄')]:
 f=cat(6,c,labs,rs,title+'の全観測機会を1種類ずつ記録。他のボーナスの結果を混ぜません。',means,label=title)
 if c.startswith('M06-019'):ctx(f,'sky_bonus_voice',c,'ボーナス図柄揃いボイス','赤7' if c=='M06-019' else '青7')
evidence(6,'M06-021',[('222枚OVER','設定2以上'),('456枚OVER','設定4以上'),('666枚OVER','設定6')],'ST中ボーナスの特殊獲得枚数表示。',label='獲得枚数表示')
for c,labs,rs,means,title in [
 ('M06-022',['C','B','C+','B+','A','S','SS'],[[48.8,32.5,12.5,6.2,0,0,0],[30.5,45.8,13.3,7.4,3.1,0,0],[44.3,30,14.1,8.6,3.1,0,0],[28.3,42.5,14.8,9.8,3.1,1.5,0],[41.4,27.5,15.6,10.9,3.1,1.5,0],[26.4,39.7,16.4,12.1,3.1,1.5,.8]],['デフォルト','偶数示唆','高設定示唆（弱）','高設定示唆（強）','設定2以上','設定4以上','設定6'],'占い・未来が知りたい'),
 ('M06-022-NOW',['三日月','半月','十三夜月','満月','エアル満月','エアル満月赤'],[[75,3.1,4.7,9.4,7.8,0],[75,3.1,4.7,9.4,0,7.8],[75,3.1,4.7,0,9.4,7.8],[75,3.1,0,7.8,6.3,7.8],[75,0,3.1,7.8,6.3,7.8],[75,3.1,3.1,4.7,6.3,7.8]],['デフォルト','設定5否定','設定4否定','設定3否定','設定2否定','設定1否定'],'占い・今が知りたい'),
 ('M06-023',cards,[[95.3,3.1,1.6,0,0,0,0,0],[93,4.7,1.6,.3,.2,.3,0,0],[93.9,3.1,2.3,.5,0,.2,0,0],[92,4.7,2.3,.3,.2,.3,.3,0],[92.9,3.1,3.1,.5,0,.2,.3,0],[91.1,4.7,3.1,.3,.2,.3,.3,.04]],cardmeans,'ノーマルガチャ'),
 ('M06-023-SP',cards,[[100,0,0,0,0,0,0,0],[98.5,0,0,.6,.4,.5,0,0],[98.7,0,0,.9,0,.4,0,0],[98,0,0,.6,.4,.5,.5,0],[98.2,0,0,.9,0,.4,.5,0],[97.9,0,0,.6,.4,.5,.5,.1]],cardmeans,'SPガチャ'),
 ('M06-024',['もしかしたら黒','まあまあ黒','青','赤'],[[72.6,19.4,8,0],[64.9,26.5,8.6,0],[71.7,19.3,9,0],[63.7,26.4,9.5,.4],[70.3,19.1,10,.6],[66.5,22.4,10.5,.6]],['デフォルト','偶数示唆','高設定示唆','設定4以上'],'スマTALK・今日の調子は'),
 ('M06-024-CONTINUE',['黒','青','赤'],[[100,0,0],[99.1,.9,0],[99,1,0],[98.9,1.1,0],[98.7,1.1,.3],[98.5,1.1,.4]],['デフォルト','設定2以上','設定5以上'],'スマTALK・続けた方がいい'),
 ('M06-024-TODAY',['黒','青','赤'],[[100,0,0],[100,0,0],[99.4,.6,0],[99.3,.7,0],[99.2,.8,0],[98.4,.9,.7]],['デフォルト','設定3以上','設定6'],'スマTALK・今日の意気込みは')]:
 f=cat(6,c,labs,rs,title+'を選択して得た結果を1種類だけ記録。別質問・別ガチャ・別占いの分布を混ぜません。',means,label=title)
 op='sky_fortune' if c.startswith('M06-022') else 'sky_gacha' if c.startswith('M06-023') else 'sky_talk';ctx(f,op,c,{'sky_fortune':'カード占い','sky_gacha':'ガチャ','sky_talk':'スマTALK'}[op],title.split('・')[-1])
group(6,[1,2,3,5,11,12,13,14,15,16],'sky_hit_path')
# M07
for n,xs in [(1,[245.6,245,244.8,243.2,242.6,240.6]),(2,[432.5,420.7,409.6,389.1,370,349.3]),(3,[8738.13,5825.42,4369.07,2912.71,2184.53,1747.63])]:rate(7,n,inv(xs),normal+('CZを経由せず当選したボーナスだけ直撃として記録。' if n==3 else ''))
for n in [4,5]:block(7,n,'内部ネウロイモードは対戦相手と一対一に対応せず、示唆から毎回の移行先を確定できません。復帰中のモード維持も新規移行に数えません。')
block(7,6,'超大型ネウロイバトル敗北時のモード振り分けは全設定共通です。',{'0':66.4,'1':29.69,'2':3.13,'3':.78})
rate(7,7,pct([61.13,60.93,60.77,60.39,58.5,57.12]),'エピソードバトルへ入った全回数と、ごほうびチェックでオーバースカイボーナスが選ばれた回数。通常バトルを混ぜません。','STRIKE_EPISODE_BATTLE_TRIAL',True)
block(7,8,'緑・赤ゲージは色だけでなく残量によって当選率が変わり、公表値も範囲です。範囲の中央や最終勝利率から単一の確率を作りません。',{'green':['1.2-10','1.2-12','1.2-14','1.2-20','1.2-26','1.2-32'],'red':['22-39','24-41','26-43','32-49','38-55','43-61']})
evidence(7,9,[('+44','設定4以上'),('+55','設定5以上'),('+66','設定6'),('+77','初期枚数500枚以上・設定示唆なし')],'バスタイム初期枚数決定時。+77は設定確定ではありません。')
evidence(7,10,[('末尾501枚','設定4以上')],'501・1501・2501枚などの特殊獲得枚数表示。')
# Exact visual identities are attached below after one scoped label crosscheck.
for n,title in [(11,'ネウロイバトル終了画面'),(12,'超大型ネウロイバトル終了画面')]:
 evidence(7,n,[('通常画面','デフォルト'),('復活示唆画面','復活示唆・設定示唆なし'),('復活確定画面','復活濃厚・設定示唆なし'),('風船付き画面','設定6')],title+'。特定キャラ画面の名前と画像の対応は別途保存した画像索引を使用します。')
evidence(7,13,[('銅クジ','設定2以上'),('銀クジ','設定3以上'),('金クジ','設定4以上'),('クマノミクジ','設定5以上'),('虹クジ','設定6')],'バトル・ビクトリーフライトチャレンジ・エンディング終了時のクジラッキー。')
evidence(7,14,[('宮藤：照れちゃうな','設定2以上'),('リーネ：そんなに見ないで','設定2以上'),('ペリーヌ：照れますわね','設定2以上'),('シャーリー：照れるなぁ','設定2以上'),('ルッキーニ：見すぎ','設定2以上'),('エイラ：見過ぎだぞ','設定2以上'),('サーニャ：恥ずかしい','設定2以上'),('バルクホルン：ジロジロ見るな','設定2以上'),('ハルトマン：照れる','設定2以上'),('坂本：恥ずかしいじゃないか','設定2以上'),('ミーナ：見つめすぎ','設定2以上'),('マルセイユのナビボイス','設定5以上'),('大サイズナビ','設定4以上'),('耳と尻尾付きナビ','設定5以上')],'エンディング中。通常キャラボイスと特殊ボイスを区別します。')
group(7,[1,2,3],'strike_hit_path')
# M08
rate(8,1,inv([297.7,291.4,253.2,233.6,225.2]),normal)
block(8,2,'2周期目以降が優遇される傾向はありますが、全設定の周期別当選率が揃いません。')
rate(8,3,inv([71.9,71.4,69,67.7,67.2]),'Xが主人公・仲間のどちらにもいない通常時のゲーム数と、新規ゆいたいむ突入回数。X滞在中とゆいたいむ消化中を分け、対象ゲーム数の記録が不明ならこの項目を使いません。','RIDER_X_ABSENT_GAME_TRIAL')
block(8,4,'公表されているのは平均ポイントだけです。平均から各ポイントの確率やばらつきを作れないため推測計算には使用しません。',{'meanPoints':[85.1,85,84.9,84.8,84.7]})
evidence(8,5,[('A000','デフォルト'),('A246','設定2・4・6'),('A456','設定4以上'),('A666','設定6')],'休憩室ステージのエリア座標。')
evidence(8,6,[('ライダー1人','デフォルト'),('1号＆X＆V3','奇数設定示唆'),('2号＆アマゾン＆ライダーマン','偶数設定示唆'),('ストロンガー＆X＆アマゾン','偶数設定示唆（強）'),('闇のライダー','設定2以上'),('7ライダー','高設定示唆（弱）'),('闇のライダー＆大幹部','高設定示唆（強）'),('全員集合','設定6')],'AT終了時。')
evidence(8,7,[('銅','設定2以上'),('銀','設定4以上'),('金','設定4以上'),('ゼブラ柄','設定5以上'),('虹','設定6')],'AT終了時の玉ちゃんトロフィー。金の5・6期待度アップを5以上確定へ変えません。')
group(8,[1,3],'rider_hit_path')
# M09: all six intermediate values recovered; rare-role aggregate overlaps weak cherry.
for n,xs in [(1,[281.5,275.3,264.5,240.3,229.3,224.2]),(2,[445.3,434.1,415.7,372.9,354.4,342.8])]:rate(9,n,inv(xs),normal)
rate(9,3,inv([98.85,96.66,95.26,90.27,88.68,87.15]),'弱チェリーを数えた総ゲーム数と成立回数。数えなかった区間をゲーム数だけに足しません。','TOTAL_GAME_TRIAL')
rate(9,13,inv([29.99,29.79,29.65,29.15,28.99,28.82]),'全レア小役を数えた総ゲーム数と合計回数。弱チェリーは合算に含まれるため、同じ情報を重ねて計算しません。','TOTAL_GAME_TRIAL')
block(9,4,'内部通常状態だけの弱レア役抽選です。高確との境界を毎回見抜けず、通常時全体の当選率には転用できません。')
block(9,5,'CZ失敗時の引き戻しと、その後の新たなレア役当選の全件区別を確認できません。単なる早いCZ再突入を代用しません。',pct([9.77,11.33,12.89,16.8,17.58,18.75]))
block(9,6,'天国とそれ以外の早い当選を毎回区別できません。設定変更時を除いても、100G以内当選を天国移行そのものに代用しません。',pct([36.02,37.19,38.05,40.08,40.55,41.48]))
evidence(9,7,[('イーサン','復活濃厚・設定示唆なし'),('ハイゼンベルク','偶数示唆'),('ドミトレスク','奇数示唆'),('モロー','設定2・5・6示唆'),('ミア','設定1否定'),('アンジー','設定2否定'),('老婆','設定3否定'),('家族会議','高設定示唆'),('ミランダ','設定4以上'),('エンタライオン','設定6')],'クライマックスバトル失敗時の終了画面。')
evidence(9,8,[('256枚OVER','設定2・5・6'),('456枚OVER','設定4以上'),('810枚OVER','設定6')],'AT中の特殊獲得枚数。')
ve=[('城','偶数示唆'),('工場','奇数示唆'),('ハンドウルフ隊','高設定示唆（弱）'),('家族会議','高設定示唆（強）'),('カドゥ','設定2否定'),('ミア＆ローズ','設定1・3否定'),('イーサン','設定4以上'),('ローズ＆イーサン','設定5以上')]
evidence(9,9,ve,'AT終了画面。')
evidence(9,10,[('銅','設定2以上'),('銀','設定3以上'),('金','設定4以上'),('椛柄','設定5以上'),('虹','設定6')],'AT終了画面のエンタトロフィー。')
evidence(9,11,[('暗闇','デフォルト'),('ハンドウルフ隊','高設定示唆（弱）'),('家族会議','高設定示唆（強）'),('ハイゼンベルク','奇数示唆'),('ドミトレスク','偶数示唆'),('カドゥ','設定2否定'),('ミア＆ローズ','設定1・3否定'),('イーサン','設定4以上'),('ローズ＆イーサン','設定5以上')],'ローズモード100pt到達時の絵本。')
evidence(9,12,[('通常背景','デフォルト'),('赤背景','設定2以上')],'エンディング終了画面。')
group(9,[1,2,3,13],'village_hit_path')
# M10
for n,xs in [(1,[276,271,258,237,216,204]),(2,[507,495,461,407,359,331]),(3,[62,62,61,59,57,55])]:rate(10,n,inv(xs),normal+('歌姫ゾーン内ストックによる連続発動を新規当選へ重ねません。' if n==3 else ''))
rate(10,4,inv([41,41,40,39,37,36]),'チャンス目A・Bを数えた総ゲーム数と成立合計回数。同一成立をAとBへ重ねません。公表値は概数です。','TOTAL_GAME_TRIAL')
block(10,5,'共通ベルを単体で判別できるのはボーナス・AT中です。公表表は押し順ベルを含む8枚ベル合算なので、共通ベルだけの確率として使用しません。',{'eightCoinCombinedApproxInverse':[17.2,17.1,16.9,16.7,16.5,16.4]})
block(10,6,'天国移行率は設定1・6の範囲値のみで、中間設定が未確認です。範囲の中央や補間から確率を作りません。',{'1':'15-20%','6':'30-35%'})
evidence(10,7,[('シェリルBONUS→ランカ開始','設定4以上'),('ランカBONUS→シェリル開始','設定4以上')],'AT中ボーナスの楽曲選択開始画面。通常時ボーナス確定画面の矛盾とは別機会です。',label='AT中ボーナス楽曲選択のキャラ矛盾')
# Bonus ending: known marginals are coarsened; unspecified ultra-rare red rate is never assigned zero.
bl=['その他（通常・赤水着）','シェリル＆ランカ白','バンド白','3人','金水着'];bm=['デフォルト等','設定2以上','設定2否定','高設定示唆（弱）','設定6']
# Entries are explicit marginals; first category is exact complement of these disjoint categories.
bands=[(8,'初回',[[0,1,1,0],[25,0,1,0],[25,1,1,0],[25,1,1,0],[25,1,1,0],[25,1,1,1]]),(9,'2回目以降・3000G以内',[[0,1,5,0],[0,0,6,0],[0,1,7,0],[0,1,10,0],[0,1,10,0],[0,1,10,1]]),(10,'2回目以降・3001～5999G',[[0,1,5,0],[0,0,6,0],[0,2,7,0],[0,2,10,0],[0,2,10,0],[0,2,10,1]]),('M10-019','2回目以降・6000G以上',[[0,1,5,0],[5,0,6,0],[5,5,7,0],[5,5,10,0],[5,5,10,0],[5,5,10,10]])]
for n,band,rr in bands:
 rs=[[100-sum(x),*x] for x in rr]
 f=cat(10,n,bl,rs,'当日累計ゲーム数とボーナス回数を確認し、'+band+'の歌姫ボーナス終了だけを記録。通常画面と赤水着は合算し、激薄としか公表されていない赤水着の確率を0に置きません。公表概数による近似評価です。',bm,label='歌姫ボーナス終了画面（'+band+'）');ctx(f,'macross_bonus_end',str(n),'歌姫ボーナス終了画面',band)
 f['coarsenedCategories']={'source':'disjoint known marginals','combined':['ランカ＆シェリル','水着赤'],'unknownRateNotSetToZero':True,'approximation':'PUBLISHED_APPROXIMATE_RATES'}
atlabs=['制服①','3人①','3人②','ステージ衣装','制服②','水着'];atmean=['デフォルト','偶数・高設定示唆','奇数・高設定示唆','設定2・4・6','設定3以上','設定5以上']
for c,band,rows in [('M10-011','初回',[[94,3,3,0,0,0],[78,6,3,13,0,0],[88,3,6,0,3,0],[70,10,5,12,3,0],[82,5,10,0,2,1],[69,10,5,12,3,1]]),('M10-011-B','2回目以降・5999G以内',[[77,8,15,0,0,0],[69,20,10,1,0,0],[69,10,20,0,1,0],[53,30,15,1,1,0],[53,15,30,0,1,1],[52,30,15,1,1,1]]),('M10-011-C','2回目以降・6000G以上',[[77,8,15,0,0,0],[62,20,10,8,0,0],[50,10,20,0,20,0],[35,30,15,6,14,0],[42,15,30,0,6,7],[36,30,15,6,6,7]])]:
 f=cat(10,c,atlabs,rows,'当日の初回ATかどうかと累計ゲーム数を確認し、'+band+'のAT終了画面だけ記録。履歴不明なら確定情報のみ保持します。公表概数で評価します。',atmean,label='AT終了画面（'+band+'）');ctx(f,'macross_at_end',c,'AT終了画面',band)
evidence(10,12,[('シェリル前兆→ランカ確定画面','設定2以上'),('ランカ前兆→シェリル確定画面','設定2以上'),('非対応前兆→2人確定画面','設定2以上'),('3人確定画面・非エピソード','設定5以上')],'通常時のボーナス確定画面。2人確定画面ではデュエット前兆とLast Song金の通常対応を除きます。')
rate(10,13,pct([37,37,39,41,44,46]),'歌前兆の全突入回数と最終成功回数。フェイクから本前兆への書き換えを含む総合期待度を使用。突入時の内部抽選だけを数える項目ではありません。公表値は概数です。','MACROSS_SONG_PRELUDE_TRIAL',True)
rate(10,14,pct([50,50,51,54,56,57]),'歌姫ゾーンの全挑戦回数とAT当選回数。公表総合期待度による概数評価です。','MACROSS_DIVA_ZONE_TRIAL',True)
evidence(10,15,[('前半告知','デフォルト'),('残り7G告知','設定4以上'),('残り6G告知','設定6')],'AT中ボーナスで翼の舞チャンス当選時の告知時点。')
evidence(10,16,[('246枚OVER','設定2・4・6'),('456枚OVER','設定4以上'),('394枚OVER','設定6'),('666枚OVER','設定6')],'AT・ボーナス中の特殊獲得枚数。500枚刻み以外の表示機会全体が未確定のため、発生しなかった回数に任意の母数を当てません。')
evidence(10,17,[('ルカ','デフォルト'),('ミシェル','デフォルト'),('オズマ','デフォルト'),('ランカ','奇数示唆'),('シェリル','偶数示唆'),('アルト','高設定示唆（弱）'),('デュランダル','高設定示唆（強）'),('ランカ＆アルト','設定4・6示唆'),('シェリル＆アルト','設定5示唆'),('シェリル＆ランカ','設定5以上')],'エンディング中のレア役カード。激薄項目は0に補完せず、確定条件だけは保持します。')
cat(10,18,['ライブ衣装','ドレス'],[[100,0],[100,0],[100,0],[85,15],[85,15],[85,15]],'エンディング終了1回につき1画面記録。ドレスの公表概数約15%を用いるため、当選機会をゲーム数に置き換えません。',['デフォルト','設定4以上'])
group(10,[1,2,3,4,13,14],'macross_hit_path')
# Discovered eighth topic, not a duplicate of role-conditional initial hits.
block(4,'M04-015','高確への内部移行を毎回判定できません。高確示唆の出現回数を内部移行率に代用しません。',{'nonRareRolePct':[.2,.2,.3,.3,.3,.3]},label='高確移行抽選')
# Complete visual labels from the scoped named-screen crosscheck; no setting meaning inferred from artwork.
D[7]['sources'].append({'sourceId':'S02','url':'https://altema.jp/pachimo/lwitchesgamen','title':'ネウロイバトル終了画面のキャラ名対応','sourceType':'published_editorial_analysis','checkedAt':DATE,'claims':[]})
for n in [11,12]:
 f=evidence(7,n,[('通常画面','デフォルト'),('宮藤・後ろ姿','復活示唆・設定示唆なし'),('宮藤・正面','復活濃厚・設定示唆なし'),('リーネ＆宮藤','奇数設定示唆'),('リーネ＆ミーナ','偶数設定示唆'),('ウィッチ4人','高設定示唆（弱）'),('坂本','高設定示唆（強）'),('エイラの夢','設定2以上'),('エイラ＆サーニャ・雪','設定3以上'),('エイラ＆サーニャ・水着','設定4以上'),('マルセイユたち','設定5以上'),('水着4人・風船','設定6')],('通常' if n==11 else '超大型')+'ネウロイバトル終了時。復活示唆を設定確定に使用しません。')
 f['sourceIds']=['S01','S02']
# Known occurrence rates are numerical candidates, not silently downgraded to unknown evidence.
cat(10,7,['通常対応','楽曲開始キャラ矛盾'],[[100,0],[100,0],[100,0],[95,5],[95,5],[95,5]],'AT中ボーナスの楽曲選択開始を全件記録し、ボーナス種類と開始キャラが矛盾した回数を分類。公表約5%による近似です。',['デフォルト','設定4以上'],label='AT中ボーナス楽曲選択のキャラ矛盾')
cat(10,12,['通常対応','設定2以上の矛盾','非エピソードの3人画面'],[[100,0,0],[99,1,0],[99,1,0],[98,2,0],[97,2,1],[97,2,1]],'通常時ボーナスの確定画面を全件記録。前兆キャラ矛盾と、3人画面なのにエピソード非当選のパターンは別カテゴリ。通常対応のデュエット前兆・Last Song金を矛盾へ数えません。公表概数を使用。',['デフォルト','設定2以上','設定5以上'])
cat(10,17,['その他','ランカ','シェリル','アルト','シェリル＆ランカ'],[[87,8,3,2,0],[87,3,8,2,0],[87,8,3,2,0],[78,4,8,10,0],[76,8,4,10,2],[76,4,8,10,2]],'エンディング中のレア役カードを1種類記録。激薄のデュランダル等はその他にまとめ、公表数値があるカテゴリの概数とその残りで評価します。激薄を0%に置きません。',['デフォルト等','奇数示唆','偶数示唆','高設定示唆（弱）','設定5以上'])
# Keep original fine categories and unknown ultra-rare rates for later record-only subcategory presentation.
next(f for f in D[10]['findings'] if f['findingId']=='M10-017')['recordOnlySubcategories']=['ルカ','ミシェル','オズマ','デュランダル','ランカ＆アルト','シェリル＆アルト']
block(3,12,'今回確認した資料でボーナス終了後PUSHボイスの具体的な種類と意味を対応づけられません。エンディングのボイスを転用せず、この候補は根拠不足として閉じます。')
# Additional public topic already on the inspected source, same observed effect-color universe.
rate(2,'M02-011',pct([37.9,38.3,39.8,42.2,44.9,46.9]),'CZ中の緑エフェクトで判定した機会数とボーナス当選回数。黄・赤の判定を混ぜません。','GEASS_GREEN_EFFECT_TRIAL',True,label='CZ緑エフェクト成功率');group(2,[1,2,4,6,'M02-011'],'geass_hit_path')
# Add known-total expectation, distinct from latent initial ST selection.
rate(6,'M06-025',pct([40,40,43,46,46,49]),'出撃ボーナスの全回数と、消化中の抽選も含め最終的にSTへ入った回数。初期の内部ST当選率とは異なる総合期待度です。','SKY_SORTIE_BONUS_TRIAL',True,label='出撃ボーナスからST突入');group(6,[1,2,3,5,11,12,13,14,15,16,'M06-025'],'sky_hit_path')
# Domain notes retain bounded survey semantics; no missing-information universal-absence assertion.
notes={
1:{'INITIAL_HIT':'CZ・AT初当たりの当選経路重複を契約で代表選択。','SMALL_ROLE':'弱チェリーの設定差は成立率ではなく内部状態別昇格。','CZ':'変更時初回CZ種類、開始時抽選、初期ポイント、レース勝利時キャラを分離。','INTERNAL_CONDITIONAL_DRAW':'通常・高確A・Bの移行先は全件観測できず不採用。','MODE_TRANSITION':'CZ種類を確認可能な変更時に限定。','THRESHOLD_BEHAVIOR':'選択天井と実当選の打ち切りを区別。','RESET_BEHAVIOR':'変更時の初回CZ分布のみ観測可能。','EVIDENCE':'ゾロ目・獲得枚数・スタンプ・ED・隠れ凪を別の機会で保存。','EXTERNAL_DATA_ONLY':'隠れ凪は任意の実機連動機能で確認する確定情報。'},
2:{'INITIAL_HIT':'BIG・AT・直撃とCZ色別成功は同系列のため代表選択。','CZ':'黄と緑の判定機会を別の母数とする。','AT':'スイカ無限新生は既発動・シャムナを除く。','MODE_TRANSITION':'モードC内部移行と示唆回数は同一ではない。','POST_EVENT_TRANSITION':'内部引き戻しとレア役当選の混合を除外理由に記録。','EVIDENCE':'終了画面とトロフィーを保存。キャラ名と画像注記不一致2種は確定にしない。'},
3:{'INITIAL_HIT':'5設定のボーナス・AT確率を保持。','CZ':'通常スイカ→アスカVSレイとATスイカ→殲滅作戦を分離。','SUCCESS_RATE':'殲滅作戦は書き換え込み総合勝利期待度。','INTERNAL_CONDITIONAL_DRAW':'通常復帰時高確とG侵食失敗後の天井減算は内部結果を識別できない。','EVIDENCE':'ボーナス・AT終了、獲得枚数、EDボイスを保存。'},
4:{'INITIAL_HIT':'CZ・ボーナス・直撃と上流スイカの重複を代表選択。','BONUS':'育てるボーナスのハズレ・リプレイでアイコン獲得を直接記録。','SMALL_ROLE':'スイカに設定差。弱強チェリーとチャンス目は全設定共通。','MODE_TRANSITION':'高確移行は内部状態を全件特定できず除外。','THRESHOLD_BEHAVIOR':'CZ天井の選択は早期当選から確定できない。','EVIDENCE':'3ヒロインボイス、ぷち終了画面、育てる終了ボイス、sf楽曲を列挙。'},
5:{'INITIAL_HIT':'AT・GIボーナスは微差も正式計算し、独断で有力候補へ昇格しない。','BONUS':'ボーナスからATへの包含を保持。','EVIDENCE':'AT・上位AT終了、トロフィー、EDイラスト、コマンドを保存。','STATE_TRANSITION':'ボイスは示唆発生率アップLv0/1/2/3で分布を分離し履歴不明時は数値停止。','MACHINE_SPECIFIC':'まこまこカップはホール任意設定で遊技設定の確率には使わない。'},
6:{'INITIAL_HIT':'ボーナス合算・3種類内訳・ST・CZ・会議を同時に重ねない。','SMALL_ROLE':'弱チェリーは全ゲームの成立回数。上流当選経路との依存を契約へ接続。','SUCCESS_RATE':'会議→CZ、チャレンジ→CZ、出撃→STの最終期待度を内部初期抽選と分離。','INTERNAL_CONDITIONAL_DRAW':'通常弱強役から本前兆は内部状態が識別不能。','EVIDENCE':'衣装、赤青終了カード、図柄声、入賞図柄、枚数、占い、ガチャ、スマTALKを展開。','POST_EVENT_TRANSITION':'会議はCZ失敗後に戻ったものを新規抽選へ重ねない。'},
7:{'INITIAL_HIT':'CZ微差・ボーナス・直撃の全候補を計算。','MODE_TRANSITION':'モードと対戦相手は一対一ではない。超大型敗北後は共通分布。','SUCCESS_RATE':'エピソードはごほうび結果。最終ジャッジは残量別範囲のため単一化しない。','POST_EVENT_TRANSITION':'修復中の復帰と通常初当たりを区別。','EVIDENCE':'通常／超大型終了、バスタイム枚数、末尾501、クジラッキー、EDナビを保存。'},
8:{'INITIAL_HIT':'5設定AT。2周期目以降の当選率は数値未確認として閉じる。','STATE_TRANSITION':'Xの主人公・仲間への滞在有無を観測範囲に反映。','POINTS_GAME_DISTRIBUTION':'平均ポイントから分布を生成しない。','EVIDENCE':'座標・AT終了・玉ちゃんを保存。金は4以上であり5以上確定へ変更しない。'},
9:{'INITIAL_HIT':'引き継ぎの1・6だけの表を全6設定へ補完。','SMALL_ROLE':'弱チェリーとレア役合算は包含。','INTERNAL_CONDITIONAL_DRAW':'低確弱役→CZは内部状態が混在するため全通常へ転用しない。','MODE_TRANSITION':'天国移行と早い当選は同一ではない。','POST_EVENT_TRANSITION':'CZ引き戻しは新規レア役との契機区別を確認できず除外。','EVIDENCE':'CB終了・AT終了・枚数・トロフィー・絵本・ED終了を列挙。'},
10:{'INITIAL_HIT':'ボーナス・AT・チャージ・チャンス目・歌前兆・歌姫ゾーンを同系列で代表選択。','SMALL_ROLE':'8枚ベル合算とボーナスAT中に見分ける共通ベル単体を混同しない。','MODE_TRANSITION':'天国は1・6範囲値のみ。中間設定を補間しない。','SUCCESS_RATE':'歌前兆は途中書き換え込み総合値。歌姫ゾーンは最終AT成功。','EVIDENCE':'終了画面は当日初回・累計G帯別。3001～5999Gへ転記修正。激薄はその他に統合し0にしない。','BONUS_TYPE_CONDITIONAL':'通常ボーナス確定とAT中楽曲開始の矛盾を分離。'}}
# Explicit domain-to-mechanic mapping; CHECKED means bounded topic review only.
related={'BONUS':'INITIAL_HIT','AT':'INITIAL_HIT','INTERNAL_CONDITIONAL_DRAW':'CZ','STATE_TRANSITION':'MODE_TRANSITION','POINTS_GAME_DISTRIBUTION':'THRESHOLD_BEHAVIOR','CARRY_OVER':'POST_EVENT_TRANSITION','RESET_BEHAVIOR':'MODE_TRANSITION','NAVIGATION':'EVIDENCE','ROLE_CONDITIONAL_DISTRIBUTION':'INTERNAL_CONDITIONAL_DRAW','BONUS_TYPE_CONDITIONAL':'BONUS','MACHINE_SPECIFIC':'EVIDENCE','EXTERNAL_DATA_ONLY':'EVIDENCE'}
for i,d in D.items():
 old=d.pop('_old');qs=[d['machineName']+' 既存候補と設定差見出しの照合',d['machineName']+' 観測条件と内部抽選の区別',d['machineName']+' 設定示唆と確定情報の区別'];d['researchCompleteness']['machineSpecificQueries']=qs
 d['researchCompleteness']['queryType']='INTAKE_REVIEW_TOPICS_NOT_CLAIMED_NEW_WEB_SEARCHES'
 rows=d['findings']+d['blockedItems']
 for f in rows:
  c=f.get('findingId',f.get('blockId'));blocked='blockId' in f
  claim=c+' '+f['label']+'：'+(f['reason'] if blocked else (f.get('denominatorSemantics') or '／'.join(x['label']+'='+x['meaning'] for x in f.get('semanticCategories',[]))))
  sc=[]
  for sid in f['sourceIds']:
   s=next(s for s in d['sources'] if s['sourceId']==sid);s['claims'].append(claim);sc.append({'sourceId':sid,'claim':claim})
  d['researchCompleteness']['candidateLedger'].append({'candidateId':c,'label':f['label'],'sourceClaims':sc,'discoveryQueries':qs,'disposition':{'type':'BLOCKED' if blocked else 'FINDING','refId':c},'origin':'ORIGINAL_135' if c in C else ('MIRROR_SINGLE_INPUT' if c.endswith('-E') else 'PUBLIC_TOPIC_SPLIT_OR_DISCOVERY'),'repeatSearchRequired':False})
 for dom in DOMAINS:
  note=notes[i].get(dom)
  if note is None:
   target=related.get(dom,'EVIDENCE');note=notes[i].get(target,notes[i].get('INITIAL_HIT',''))
   note=dom+'の受入点検：'+note+' 独立した数値を追加確認したとの主張はせず、元の6領域監査と候補別の範囲限界を保持。'
  d['researchCompleteness']['domains'].append({'domain':dom,'status':'CHECKED','sourceIds':['S01'],'note':note,'reviewScope':'TOPIC_INTAKE_NOT_EXHAUSTIVE_FIVE_SITE_ABSENCE_PROOF','nextWorkDisposition':{'owner':'RESEARCH','repeatPublicSearch':False,'reopenPolicy':'NEW_CONCRETE_SOURCE_ONLY'}})
 d['researchCompleteness']['candidateCount']=len(rows);d['researchCompleteness']['originalCandidateCount']=sum(c['machine_id']==f'M{i:02}' for c in original)
 for f in d['findings']:
  if f.get('settingDistribution'):
   f['benchmarkExposureReview']={'hierarchyAttempted':['DIRECT_PUBLISHED','DERIVED_EXACT','DERIVED_APPROXIMATED','DERIVED_BOUNDED'],'result':'EXACT_7000_ELIGIBLE_GAMES' if f['trialUniverse'] in ['TOTAL_GAME_TRIAL','NORMAL_GAME_TRIAL'] else 'PER_ELIGIBLE_TRIAL_ONLY','reason':'条件付き機会数を7000Gへ恣意的に換算せず、既存評価器の試行あたり指標を用いる。'}
 d['productObservationPolicy']={'authority':'USER_EXPLICIT_INSTRUCTION','countingRule':'AT_AFTER_CLEAR_RETURN_ZONE_INITIAL','publishedDenominatorEquivalence':'NOT_ASSERTED','artifact':'production/batches/'+B+'/scope-authorization.json'}
 for f in d['findings']:
  if f.get('trialUniverse')=='NORMAL_GAME_TRIAL':f['operationalCounting']={'authority':'USER_EXPLICIT_INSTRUCTION','policyArtifact':'production/batches/'+B+'/scope-authorization.json','publishedDenominatorEquivalence':'NOT_ASSERTED','unknownScope':'UNOBSERVED_NOT_ZERO'}
 (O/(d['machineId']+'.json')).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
ids={x['candidateId'] for d in D.values() for x in d['researchCompleteness']['candidateLedger']};assert set(C)<=ids,set(C)-ids
(R/'specs').mkdir(exist_ok=True);spec={'batchId':B,'manifestVersion':'8.5','waves':[{'waveId':'wave-1','machineIds':[s['machineId'] for s in sel[:5]]},{'waveId':'wave-2','machineIds':[s['machineId'] for s in sel[5:]]}]};(R/'specs'/(B+'.json')).write_text(json.dumps(spec,indent=2)+'\n')
if H.resolve()!=(I/'imported-handoff').resolve():shutil.copytree(H,I/'imported-handoff',dirs_exist_ok=True)
(I/'intake-summary.json').write_text(json.dumps({'batchId':B,'originalCandidatesPreserved':135,'allLedgerRows':len(ids),'numericFindings':sum('settingDistribution' in f for d in D.values() for f in d['findings']),'evidenceFindings':sum(f['observationType']=='evidence' for d in D.values() for f in d['findings']),'closedExcluded':sum(len(d['blockedItems']) for d in D.values()),'externalAudit':'NOT_PERFORMED','researchRestarted':False},indent=2)+'\n')
print((I/'intake-summary.json').read_text())
