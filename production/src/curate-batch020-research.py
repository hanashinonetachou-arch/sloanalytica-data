"""Batch020: preserve the 86 immutable input rows; candidate-local public review.
Does not change builders, thresholds, app code, or distribution.
"""
import json, pathlib, hashlib, shutil, copy
R=pathlib.Path(__file__).resolve().parents[1]; ROOT=R.parents[1]
I=R/'research-inbox/batch020'; O=I/'reviewed'; O.mkdir(parents=True,exist_ok=True)
BASE=ROOT/'baseline'; B='batch-20261017-020'; DATE='2026-10-17'
sel=json.loads((R/'next-machine-selection-20261017-batch020.json').read_text())['selected']
original=json.loads((I/'imported-handoff/candidates_v4.json').read_text()); C={c['candidate_id']:c for c in original}
DOMAINS='INITIAL_HIT BONUS SMALL_ROLE CZ AT INTERNAL_CONDITIONAL_DRAW MODE_TRANSITION STATE_TRANSITION SUCCESS_RATE POINTS_GAME_DISTRIBUTION CARRY_OVER THRESHOLD_BEHAVIOR RESET_BEHAVIOR POST_EVENT_TRANSITION NAVIGATION ROLE_CONDITIONAL_DISTRIBUTION BONUS_TYPE_CONDITIONAL EVIDENCE EXTERNAL_DATA_ONLY MACHINE_SPECIFIC'.split()
primary={1:'https://nana-press.com/kaiseki/machine/741/21203/',2:'https://nana-press.com/kaiseki/machine/736/20454/',3:'https://nana-press.com/kaiseki/machine/727/20610/',4:'https://nana-press.com/kaiseki/machine/712/20690/',5:'https://nana-press.com/kaiseki/machine/724/20435/',6:'https://nana-press.com/kaiseki/machine/714/20083/',7:'https://p.hisshobon.jp/machine/4269/1/101589',8:'https://1geki.jp/slot/l_kingpulsar_slcc/0/',9:'https://nana-press.com/kaiseki/machine/722/19936/',10:'https://nana-press.com/kaiseki/machine/703/19741/'}
secondary={1:'https://1geki.jp/slot/l_eureka4/0/',2:'https://1geki.jp/slot/l_osu_bancho4/0/',3:'https://1geki.jp/slot/l_urusei_ev/0/',4:'https://www.p-world.co.jp/machine/database/9987',5:'https://p.hisshobon.jp/machine/4286/1/101922',6:'https://1geki.jp/slot/l_shinodama3_kaiden/0/',7:'https://www.p-world.co.jp/machine/database/9998',8:'https://p-gabu.jp/guideworks/machinecontents/detail/6511/summarize',9:'https://www.p-world.co.jp/machine/database/10014',10:'https://1geki.jp/slot/l_nangoku_sdc/0/'}
D={}; changes=[]
for i,s in enumerate(sel,1):
 p=BASE/'research'/s['machineId']; dest=I/'repository-baseline'/s['machineId'];dest.mkdir(parents=True,exist_ok=True)
 for name in ['research-data.json','selection-data.json','machine-observation-data.json']:shutil.copy2(p/name,dest/name)
 old=json.loads((p/'research-data.json').read_text()); identity=copy.deepcopy(old['machine'])
 if i==4:identity['settings']=['SET_'+str(x) for x in range(1,7)]
 D[i]={'schemaVersion':'research-v1','manifestVersion':'8.5','batchId':B,'machineId':s['machineId'],'machineName':s['displayName'],'researchStage':'SOURCE_REVIEW_COMPLETE_PENDING_FORMAL_ACCEPTANCE','machineIdentity':identity,'settings':{'values':identity['settings'],'numericInferenceValues':identity['settings'],'status':'PUBLIC_TABLE_RECONCILED'},'sources':[],'findings':[],'blockedItems':[],'researchCompleteness':{'version':2,'domains':[],'machineSpecificQueries':[],'candidateLedger':[]},'reviewAuthority':{'productionBaseCommit':'0d91dfb1fdadc93b8a30f5134dad008452647aba','distributionBaseCommit':'aea5d3f6d4a5cf7a2a32dd6e07a730bc74f9343f','candidateExploration':'LIMITED_CLOSEOUT','externalAudit':'NOT_PERFORMED','auditType':'SOURCE_AND_REPOSITORY_SELF_AUDIT','sourceIndependence':'Different editorial publishers compared; syndicated/reproduced tables not claimed independent measurements.'},'_old':old}
def keys(i):return [k.replace('SET_','') for k in D[i]['settings']['numericInferenceValues']]
def src(i,url):
 d=D[i];s=next((s for s in d['sources'] if s['url']==url),None)
 if s is None:
  s={'sourceId':f'S{len(d["sources"])+1:02}','url':url,'title':d['machineName']+' 公開資料照合','sourceType':'published_editorial_analysis','checkedAt':DATE,'claims':[]};d['sources'].append(s)
 return s['sourceId']
def put(i,c,obj,blocked=False):
 d=D[i]
 for k in ['findings','blockedItems']:d[k]=[f for f in d[k] if f.get('findingId',f.get('blockId'))!=c]
 f={('blockId' if blocked else 'findingId'):c,'label':C.get(c,{}).get('label',c),**obj};f.setdefault('sourceIds',[src(i,primary[i])])
 if c in C:f['retainedHandoffClaim']=copy.deepcopy(C[c])
 d['blockedItems' if blocked else 'findings'].append(f);return f
def block(i,c,reason,values=None,label=None,urls=None):
 return put(i,c,{'reason':reason,'reevaluationCondition':'不足を解決する新しい具体的な公開資料が得られた場合、この項目だけ再確認します。','publicSearchStatus':'CLOSED_BOUNDED_NO_REPEAT','retainedPublishedValues':values if values is not None else C.get(c,{}).get('setting_values_or_signal'),**({'label':label} if label else {}),**({'sourceIds':[src(i,u) for u in urls]} if urls else {})},True)
def rate(i,c,vs,scope,universe='NORMAL_GAME_TRIAL',conditional=False,label=None,urls=None):
 if isinstance(vs,list):vs=dict(zip(keys(i),vs))
 return put(i,c,{'observationType':'conditional_probability' if conditional else 'probability','settingDistribution':vs,'trialUniverse':universe,'denominatorSemantics':scope,'details':[scope],'liveObservation':{'status':'EXACT_WITH_SCOPE_TRACKING','reason':scope},**({'label':label} if label else {}),**({'sourceIds':[src(i,u) for u in urls]} if urls else {})})
def inv(xs):return ['1/'+str(x) for x in xs]
def pct(xs):return [x/100 for x in xs]
def reference(i,c,vs,reason,label=None,urls=None):
 if isinstance(vs,list):vs=dict(zip(keys(i),vs))
 return put(i,c,{'observationType':'reference_distribution','settingDistribution':vs,'trialUniverse':'REFERENCE_ONLY','details':[reason],'retainedScope':C.get(c,{}).get('denominator'),'runtimeUse':'DISABLED',**({'label':label} if label else {}),**({'sourceIds':[src(i,u) for u in urls]} if urls else {})})
def evidence(i,c,pairs,scope,label=None,urls=None):
 cats=[]
 for l,m in pairs:
  sem='DISPLAY_ONLY' if m in ['デフォルト','通常','設定差なし','設定Lの可能性'] else ('EXACT_CONSTRAINT' if any('設定'+str(v) in m for v in range(1,7)) and not any(w in m for w in ['示唆','推定','未確認','可能性']) else 'PROBABILITY_UNKNOWN')
  cats.append({'label':l,'meaning':m,'semanticType':sem})
 return put(i,c,{'observationType':'evidence','semanticCategories':cats,'details':[scope,'出現率が未確認の示唆は記録のみ・推測計算には使用しない。設定確定・否定の項目は設定候補の絞り込みに反映できる可能性があります。'],**({'label':label} if label else {}),**({'sourceIds':[src(i,u) for u in urls]} if urls else {})})
def cat(i,c,labels,rows,scope,label=None,urls=None):
 vs=dict(zip(keys(i),[' / '.join(f'{l}: {p:.10g}%' for l,p in zip(labels,row)) for row in rows]))
 return put(i,c,{'observationType':'appearance_distribution','trialUniverse':'CONDITIONAL_EVENT_TRIAL','settingDistribution':vs,'categoryModel':{'residualPolicy':'SOURCE_EXHAUSTIVE'},'denominatorSemantics':scope,'details':[scope],'liveObservation':{'status':'EXHAUSTIVE_CATEGORICAL','reason':scope},**({'label':label} if label else {}),**({'sourceIds':[src(i,u) for u in urls]} if urls else {})})
def mirror(i,f,pairs):
 cid=f['findingId'];eid=cid+'-E';e=evidence(i,eid,pairs,'同じ結果の入力を共有し、別の回数として重ねて入力しません。',label=f['label']+'の設定制約',urls=[next(s['url'] for s in D[i]['sources'] if s['sourceId']==f['sourceIds'][0])])
 for c in e['semanticCategories']:c['linkedFindingId']=cid
 f['mirrorsEvidenceFindingId']=eid;f['categoricalEvidenceReconciliation']={'type':'SINGLE_CANONICAL_CATEGORY_INPUT','evidenceFindingId':eid,'runtimeLinkContract':'EXPLICIT_CATEGORY_LINK_V1'}
 return f
def group(i,cs,gid,reason,kind='CAUSAL_PATH_OVERLAP',fallback=False):
 for f in D[i]['findings']:
  if f['findingId'] in cs and f.get('observationType') in ['probability','conditional_probability','appearance_distribution']:
   f.update(dependencyGroupId=gid,dependencyKind=kind,dependencyReason=reason,dependencyScopeAudit={'status':'KNOWN_DEPENDENCY_DEFERRED_TO_CONTRACT','evidenceSourceIds':f['sourceIds'],'reason':reason})
   if fallback:f['dependencyFallbackRank']=cs.index(f['findingId'])+1
def ctx(f,op,cond,title,tab):f['observationContext']={'groupingApproved':True,'opportunityId':op,'conditionId':cond,'groupTitle':title,'conditionLabel':tab}
normal='通常ゲーム数と初当たり回数。AT・ボーナス消化中と明確な引き戻し区間の当選は混ぜません。引き戻し区間終了後の当選を初当たりに数えます。'
# 01 Eureka: SEVEN is a normal-play WAVE acquisition zone, not AT/CZ.
rate(1,'M01-C01',inv([366.5,358.6,345.4,308.3,282.8,270.9]),normal)
rate(1,'M01-C03',inv([72.1,70.9,67.7,66.8,63.9,63.3]),'通常ゲーム数とセブンチャンス突入回数。AT中の特化ゾーンは含めません。')
rate(1,'M01-C06',inv([10285.8,10186.3,6564.5,5766.3,5366.6,3586.4]),'通常ゲーム数とCZを経由しないAT当選回数。CZ成功・天井等を直撃へ足しません。')
reference(1,'M01-C02',inv([3.69,3.70,3.70,3.71,3.71,3.74]),'成立する6択ベルと実際の12枚入賞は異なり、通常時の不正解分を全件識別できません。成立確率は保持し、入賞回数を代用して推測計算には使用しません。')
reference(1,'M01-C04',pct([24.2,24.2,26,27.4,31.7,31.7]),'弱チェリー成立時の内部低確を全例で見抜けず、高確分が混ざるため、この条件付き確率を通常時全体へ使用しません。')
rate(1,'M01-C05',pct([.4,.4,.4,.8,1.2,1.6]),'セブンチャンス開始時の初期レベルだけを確認し、突入回数と初期レベル12の回数を記録。途中のレベルアップを含めません。','EUREKA_SEVEN_ENTRY_TRIAL',True)
labs=['2人','4人','6人','8人'];rows=[[93.65,6.25,.1,0],[93.25,6.25,.5,0],[93.25,6.25,.5,0],[86.4,12.5,1,.1],[86.25,12.5,1,.25],[86,12.5,1,.5]]
f=cat(1,'M01-C07',labs,rows,'BIG終了1回につき人数を1種類だけ記録。合計回数は人数別回数から自動計算。',label='BIG終了画面');mirror(1,f,list(zip(labs,['デフォルト','高設定示唆','高設定示唆（強）','設定4以上'])))
evidence(1,'M01-C08',[('エウレカ＆レントン','奇数設定示唆'),('LFO','偶数設定示唆')],'BIG確定画面を記録。')
evidence(1,'M01-C09',[('174枚OVER','設定1否定'),('274枚OVER','設定2否定'),('374枚OVER','設定3否定'),('256枚OVER','設定2・5・6'),('456枚OVER','設定4以上'),('331枚OVER','設定6'),('666枚OVER','設定6'),('1246枚OVER','設定1・2・4・6')],'AT中の獲得枚数表示。331枚は資料差を1回追加照合し、機種データベースと詳細記事の6濃厚を採用。',urls=[primary[1],'https://www.p-world.co.jp/machine/database/10011'])
evidence(1,'M01-C10',[('赤（チェリー）','デフォルト'),('緑（スイカ）','デフォルト'),('薄紫（チャンス目）','デフォルト'),('オレンジ','設定2以上'),('紫','設定4以上'),('虹','設定6')],'エンディング中のレア役成立時。薄紫と紫を区別。')
tro=[('銅','設定2以上'),('銀','設定3以上'),('金','設定4以上'),('キリン柄','設定5以上'),('虹','設定6')]
evidence(1,'M01-C11',tro,'ATまたはエンディング終了時のサブ液晶。BIG終了画面の人数とは別に記録。')
group(1,['M01-C01','M01-C03','M01-C05','M01-C06'],'eureka_normal_path','セブンチャンスのWAVE獲得・CZ・AT初当たりは同じ通常時の当選経路。独立に加算せず、正式な設定判別スコアで代表を選びます。')
# 02 Bancho: a visible countable exclusion, not a research stop.
rate(2,'M02-C01',inv([259.5,256.3,247.6,236,225.3,221.1]),normal)
rate(2,'M02-C02',inv([21.8,21.6,21.4,21.2,21,20.6]),'共通ベルを識別できたゲーム数と回数。通常時は左第1停止ベル、AT中はナビなしベル。エンブレムモード・EDのゲーム数を総ゲーム数から差し引き、その区間のベルも数えません。','BANCHO_IDENTIFIABLE_GAME_TRIAL')
rate(2,'M02-C03',inv([6411,5624,4344,3053,2420,2150]),'通常ゲーム数とボーナスを経由しないAT直撃回数。')
reference(2,'M02-C04',{k:'通常A・B: '+str(a)+'%; チャンス: '+str(b)+'%' for k,a,b in zip(keys(2),[12.5,12.8,14.6,16.6,18.6,19.2],[35.2,35.5,37.2,38.6,41.2,41.9])},'内部モードと内部の確定対決を全例で識別できません。通常勝利を確定対決の当選として代用しません。')
reference(2,'M02-C05',pct([1.2,2,3.5,6.6,12.9,15.6]),'REG後の特訓回数は数えられますが、確定対決と通常抽選で勝利した対決の全件区別ができないため、勝利率としては使いません。')
rate(2,'M02-C06',inv([37483,35614,19472,9457,6875,6733]),'逆さ富士モードへ新しく入った回数と通常ゲーム数。モード中の同一状態を繰り返し数えず、終了画面の富士山の回数と区別します。','BANCHO_REVERSE_FUJI_GAME_TRIAL')
reference(2,'M02-C07',{k:'REG '+str(a)+'%・赤7 48.83%・青7 '+str(b)+'%' for k,a,b in zip(keys(2),[50,49.61,48.44,46.48,44.92,43.36],[1.17,1.56,2.73,4.69,6.25,7.81])},'通常A・B・チャンス中だけのボーナス種別表です。天国とそれ以外を全例で識別できないため、すべての青7比率には使用しません。')
evidence(2,'M02-C08',[('通常背景','デフォルト'),('F.K.','設定6')],'REG中に表示された背景。')
evidence(2,'M02-C09',[('デフォルト','デフォルト'),('すこやか','偶数設定示唆'),('パンダ','高設定示唆（弱）'),('マチ子','高設定示唆（強）'),('茶摘み','設定4以上'),('レースクイーン','設定5以上'),('温泉','設定6'),('富士山1回','設定2以上'),('富士山2回','設定3以上'),('富士山3回','設定4以上'),('富士山4回','設定5以上'),('富士山5回以上','設定6'),('逆さ富士','設定示唆ではなくモード示唆')],'通常時ボーナス・AT終了画面。富士山は当日累計で回数+1が最低設定。段階の入力は累積回数から1段階だけ自動算出し、1回を複数段階へ入力しません。',urls=[primary[2],'https://www.dechau.com/news/single.php?area=&id=16724'])
evidence(2,'M02-C10',[('鋼鉄','設定6'),('その他の色','設定別出現率未確認')],'エンディング中のベルカウンター表示。')
group(2,['M02-C01','M02-C02','M02-C03','M02-C06'],'bancho_causal_path','共通ベル・対決・AT直撃・逆さ富士・初当たりは当選経路を共有します。同じ当選情報を独立に足さず代表を選びます。')
# 03 Urusei: direct 1/128 is per successful RAISE lottery, not per game.
rate(3,'M03-C01',inv([266.5,256.3,232.9,216.4,196.7]),normal)
rate(3,'M03-C02',inv([535.4,509,429.3,383.2,329.9]),normal)
block(3,'M03-C03','モードBへ移行しやすい傾向は確認しましたが、全設定の移行率と毎回の移行先は公表資料で揃いません。モード示唆から確率を補完しません。')
reference(3,'M03-C04',inv([128,85,64,43,32]),'雷RIZEモード当選1回ごとのボーナス昇格率です。ボーナスへ昇格して表示されなかった雷RIZE当選まで完全に数えられないため、通常ゲーム数で代用しません。',urls=[primary[3],'https://nana-press.com/kaiseki/machine/727/20617/'])
evidence(3,'M03-C05',[('ラム「大感激！だっちゃ」','設定5・6示唆'),('その他のボイス','設定別出現率未確認')],'AT中のちゅどーん図柄停止時にPUSHで確認。')
deny=[('テンちゃん','設定1否定'),('錯乱坊','設定2否定'),('コタツネコ','設定1・5否定')]
evidence(3,'M03-C06',[('あたる＆テンちゃん','デフォルト'),('ラム（浴衣）','高設定示唆（弱）'),('ラム（ウエディング）','高設定示唆（強）'),*deny,('ラム（3D）','設定4以上'),('ヒロイン集合','設定5以上'),('アイキャッチ','設定6')],'あたる逃走中終了時。')
end3=[('あたる','デフォルト'),('ラム（チャイナ）','高設定示唆（弱）'),('ラム（浜辺）','高設定示唆（強）'),*deny,('ラム＆あたる','設定4以上'),('ヒロイン集合','設定5以上')]
evidence(3,'M03-C07',end3,'AT終了時。')
evidence(3,'M03-C08',end3+[('全員集合','設定6')],'エンディング中のレア役成立時に出現するカード。')
group(3,['M03-C01','M03-C02'],'urusei_hit_chain','ボーナスからATへつながる同じ系列の初当たり。両方を独立加算せず正式スコアで代表を選択。')
# 04 Golden Kamuy: recover setting 3, detailed photo tables and ordinary hints.
rate(4,'M04-C01',inv([308.1,302.4,290.4,268.5,260.1,248.8]),normal)
rate(4,'M04-C02',inv([818.4,801.8,770.3,698.8,678.3,647.3]),normal)
rate(4,'M04-C03',inv([64.8,63.2,61.7,58.1,55.8,53]),'通常ゲーム数と狩猟チャレンジ突入回数。狩猟チャレンジ消化中とAT中は含めません。公表の総合突入率に内部低確だけの母数を当てません。',urls=[secondary[4]])
rate(4,'M04-C04',inv([1962.2,1853.5,1747.2,1320.3,1227.4,1141.2]),'通常ゲーム数と温泉チャンス突入回数。消化中・AT中は母数に含めません。通常・高確準備だけの成立役抽選率とは区別します。')
evidence(4,'M04-C05',[('夕日','高設定示唆（弱）'),('花','高設定示唆（強）'),('月','高設定示唆（強）・復活濃厚')],'決戦チャンス終了画面。全設定出現率は公開資料内で未確認。')
photo=['白枠①','白枠②','青枠①','青枠②','黄枠①','黄枠②','緑枠','赤枠','金枠']
rows=[[41.4,24.9,8.2,4,6.7,6.7,3.5,4.7,0],[24.8,41.3,4,8.2,6.7,6.7,3.6,4.7,0],[40.6,24.8,8.1,4,6.8,6.8,3.6,5.1,0],[24.2,38,4,8,7.1,7.1,3.8,5.6,2.3],[37.6,24.3,8,4,7.1,7.1,3.8,5.8,2.3],[23.9,37.4,4,8,7.2,7.2,3.9,6,2.4]]
f=cat(4,'M04-C06',photo,rows,'カムイボーナス最終ゲーム・決戦チャンス終了時にPUSHで表示した写真のみ。200ピュウ予兆失敗時は別タブ。枠別回数の合計を母数にします。',label='ボーナス・決戦終了時の写真');mirror(4,f,list(zip(photo,['奇数設定示唆','偶数設定示唆','奇数設定示唆','偶数設定示唆','規定ピュウ示唆','規定ピュウ示唆','規定ピュウ示唆','規定ピュウ示唆','設定4以上'])))
rows=[[43.3,26,9,4.3,6.8,6.8,3.7],[25.9,43.2,4.4,9,6.9,6.9,3.7],[42.4,26.1,9,4.4,7.1,7.1,3.9],[25.2,42.1,4.5,9,7.5,7.5,4.1],[41.5,25.4,9,4.5,7.6,7.6,4.2],[24.9,41.4,4.6,9.1,7.8,7.8,4.3]]
cat(4,'M04-N01',photo[:7],rows,'200ピュウ☆の予兆失敗時にPUSHして確認した写真。ボーナス・決戦終了時と回数を分けます。',label='200ピュウ予兆失敗時の写真')
evidence(4,'M04-C07',[('杉元・アシㇼパ・白石（通常順）','デフォルト'),('レタㇻ','偶数設定示唆'),('鶴見','高設定示唆（弱）'),('二瓶','高設定示唆（弱）'),('土方','高設定示唆（強）'),('ウェンカムイ','設定2以上'),('のっぺら坊','設定4以上'),('杉元→アシㇼパ→白石→二瓶→レタㇻ','設定2・4・6'),('杉元→アシㇼパ→白石→二瓶→鶴見','設定3以上'),('青背景2人→アシㇼパ→白石→白石','設定4以上'),('杉元→アシㇼパ→白石→二瓶→土方','設定4以上'),('杉元→アシㇼパ→白石→鶴見→土方','設定4以上'),('青背景2人→白石→杉元→杉元','設定5以上'),('杉元→アシㇼパ→白石→二瓶→ウェンカムイ','設定5以上'),('杉元→アシㇼパ→白石→鶴見→ウェンカムイ','設定5以上'),('青背景2人→杉元→アシㇼパ→アシㇼパ','設定6'),('杉元→アシㇼパ→白石→二瓶→のっぺら坊','設定6'),('杉元→アシㇼパ→白石→鶴見→のっぺら坊','設定6')],'カムイボーナス中。単独キャラと紹介順のシナリオを区別し、シナリオは5人分の順序をまとめて1回で記録。',urls=[secondary[4]])
evidence(4,'M04-C08',[('246枚突破','設定2・4・6'),('456枚突破','設定4以上'),('666枚突破','設定6')],'AT中の獲得枚数表示。')
evidence(4,'M04-C09',tro,'ボーナス・AT終了時のサミートロフィー。出現しなかった回数に設定別出現率を割り当てません。')
group(4,['M04-C01','M04-C02','M04-C03','M04-C04'],'kamuy_acquisition','狩猟・温泉・ボーナス・ATは同じ当選系列を含むため、単独の総合確率を重ねず正式スコアで代表を選択。')
for fid,tab in [('M04-C06','終了時'),('M04-N01','200ピュウ予兆失敗時')]:ctx(next(f for f in D[4]['findings'] if f['findingId']==fid),'kamuy_photo',fid,'PUSHで確認する写真',tab)
# 05 Strike the Blood: public internal lotteries retained; no guessed internal states.
rate(5,'M05-C01',inv([311.9,295.7,273.3,223.7,201.8,178.6]),normal)
rate(5,'M05-C02',inv([199.8]*6),'ボーナス消化を除く総ゲーム数とリアルボーナス成立回数。AT中のボーナスも含みます。','TOTAL_GAME_TRIAL',urls=['https://www.p-world.co.jp/machine/database/10017'])
reference(5,'M05-C03',{k:'通常弱役 '+str(a)+'%; 通常強役 '+str(b)+'%; 高確チェリー・スイカ '+str(c)+'%; 高確弱チャンス目 '+str(d)+'%; 高確強役 '+str(e)+'%' for k,a,b,c,d,e in zip(keys(5),[.4,.8,1.2,1.6,2.3,3.1],[7.8,7.8,8.6,11.7,13.3,15.6],[1.6,2.3,3.1,6.3,7,8.6],[9,10.2,12.5,16.8,18.8,21.9],[43.8,43.8,46.1,48.4,53.1,56.3])},'成立役ごとの内部通常・高確・超高確を全例で識別できません。AT直撃総数をこれらの条件付き確率へ当てはめません。')
block(5,'M05-C04','契機ごとのエピソードポイント振分は公開されていますが、毎回の内部獲得ポイントは示唆のみで直接確定できません。累積示唆を各回の獲得値へ分解して数えません。',{'reset50pt':pct([.4,1.6,3.1,6.3,12.5,12.5]),'kaleid10_30_50':[[87.5,10.9,1.6],[87.5,10.9,1.6],[83.6,14.8,1.6],[78.1,18.8,3.1],[73.4,21.9,4.7],[69.5,24.2,6.3]],'tables':'設定変更・弱役・強役・BIG後・カレイド後・AT後で分離。公開表は出典に追跡。'})
reference(5,'M05-C05',{k:'リセット99・199・299・399G '+str(a)+'; 終了後99・199・299・399・599G '+str(b) for k,a,b in zip(keys(5),[[.4,.4,.4,98.8],[.8,1.2,1.6,96.5],[1.2,1.6,2.3,94.9],[2.3,3.1,4.7,89.8],[2.3,3.1,4.7,89.8],[3.1,4.7,6.3,85.9]],[[.4,.4,.4,.4,98.4],[.8,1.2,1.6,2.3,94.1],[1.2,1.6,2.3,3.1,91.8],[2,3.1,3.9,4.7,86.3],[2,3.1,3.9,4.7,86.3],[3.1,4.7,6.3,7.8,78.1]])},'早い当選で天井到達前に終わるため、実際に選ばれた天井ゲーム数は全件確認できません。単なる99G以内当選等に読み替えません。')
evidence(5,'M05-C06',[('白','デフォルト'),('青','高設定示唆（弱）'),('緑','高設定示唆（強）'),('赤','設定4以上'),('虹','設定6')],'ボーナス・AT終了画面でPUSHを押して液晶左右ランプを確認。')
evidence(5,'M05-C07',[(l,'奇数設定示唆') for l in ['暁古城','暁凪沙','矢瀬基樹','アスタルテ']]+[(l,'偶数設定示唆') for l in ['姫柊雪菜','藍羽浅葱','煌坂紗矢華','ラ・フォリア・リハヴァイン']]+[('叶瀬夏音','高設定示唆'),('南宮那月','高設定示唆'),('モグワイ','設定2否定'),('仙都木阿夜','設定2・4・6'),('リディアーヌ・ディディエ','設定2以上'),('ディミトリエ・ヴァトラー','設定4以上'),('エンタライオン','設定6'),('キャラの順番で世界観','設定4以上'),('世界観の順番でキャラ','設定2・4・6')],'カレイドボーナス中のキャラ紹介と世界観紹介。交互の順序が崩れた表示は別の法則として記録。')
evidence(5,'M05-C08',[(l.replace('キリン柄','紅葉柄'),m) for l,m in tro],'ボーナス・AT終了画面のエンタトロフィー。')
# 06 Shinobi: visible evening stage is an explicit draw state, not a low-state guess.
rate(6,'M06-C01',inv([368.7,362.9,352.4,334.4,318.1,305]),normal,urls=[primary[6],'https://www.p-world.co.jp/machine/database/10008'])
rate(6,'M06-C02',inv([147,145.7,143.1,138.6,133.7,132]),'通常ゲーム数とCZ潜入の突入回数。引き戻しCZと通常の初当たりCZは別記録。')
rate(6,'M06-C03',pct([12.5,12.9,13.7,14.9,17.2,19.5]),'周期パート中のチャンス目成立回数と、周期到達前にそのチャンス目からCZへ当選した回数。周期到達によるCZは含めません。','SHINOBI_CYCLE_CHANCE_ROLE_TRIAL',True)
block(6,'M06-C04','周期到達でATへ直撃しやすい傾向と設定1・6の約2.5倍差は確認しましたが、全設定の直接当選率は揃いません。CZ成功のATを直撃に混ぜず、未知の設定値も補完しません。')
for c,l,vs in [('M06-C05','夕方チェリーからCZ・AT',[30.1,30.9,31.6,32.4,35.2,35.9]),('M06-N01','夕方チャンスリプレイからCZ・AT',[40.2,41.4,42.6,46.9,48.4,50]),('M06-N02','夕方スイカからCZ・AT',[50,50.8,53.9,57.8,60.2,61.7])]:
 f=rate(6,c,pct(vs),'高確率の夕方ステージ中に成立した対象役の回数と、その役によるCZまたはAT当選回数。同じ当選を別の役へ重ねず、契機を確認できないものは入れません。','SHINOBI_EVENING_'+c+'_TRIAL',True,l);ctx(f,'shinobi_evening',c,'夕方ステージ中の抽選',l)
reference(6,'M06-C06',{k:'昼夕1〜6セット '+str(a)+'; 夜 '+str(b)+'; 天井・真神速 '+str(c) for k,a,b,c in zip(keys(6),[[66.8,24.2,7.8,.4,.4,.4],[65.6,25,8.2,.4,.4,.4],[62.1,28.1,8.6,.4,.4,.4],[56.6,33.2,9,.4,.4,.4],[55.5,34,9.4,.4,.4,.4],[54.3,34.8,9.8,.4,.4,.4]],[[39.1,25,25,6.3,3.1,1.6],[38.3,25,25,6.3,3.5,2],[37.5,25,25,6.3,3.9,2.3],[36.7,25,25,6.3,4.3,2.7],[35.9,25,25,6.3,4.7,3.1],[35.2,25,25,6.3,5.1,3.5]],[[84.4,14.1,.4,.4,.4,.4],[84,14.5,.4,.4,.4,.4],[80.9,17.6,.4,.4,.4,.4],[76.6,21.9,.4,.4,.4,.4],[74.2,24.2,.4,.4,.4,.4],[73.4,25,.4,.4,.4,.4]])},'初期ストックとAT中の追加獲得が区別できず、実際の継続セット数を初期セット数へ代用できません。当選契機別の公開表は保持します。')
reference(6,'M06-C07',{k:'月光1/'+str(a)+'; 神速1/'+str(b) for k,a,b in zip(keys(6),[292.3,288.5,280.1,271.6,268.6,254.5],[270.5,267.7,266.2,265.1,263.9,253])},'内部のリーチ目高確移行と目に見えるリーチ目停止は同じ事象ではありません。全移行回数を確実に識別する手段を確認できず、停止したリーチ目の回数では代用しません。')
rate(6,'M06-C08',inv([7405,6448.2,6323.9,4825.2,3758,2920.4]),'月光ノ刻の消化ゲーム数とスイカ契機ピンク7BIGの回数。スイカ成立回数を母数にしません。神速など別のAT状態を混ぜません。','SHINOBI_MOONLIGHT_GAME_TRIAL')
rate(6,'M06-C09',pct([24.4,25.6,28.4,33.4,38.3,39.5]),'AT終了後から1周期目ジャッジまでを最後まで確認した回数と、その間にCZ潜入へ入った回数。即潜入も含め、途中でやめたものは母数へ入れません。','SHINOBI_RETURN_WINDOW_TRIAL',True)
screen=['疾風＆アラシ（背中合わせ）','疾風＆アラシ＆楓','味方キャラ集合','敵キャラ集合','疾風VSマッド','疾風＆アラシ（グータッチ）','楓']
meaning=['デフォルト','高設定示唆（弱）','高設定示唆（強）','設定2以上','設定4以上','設定5以上','設定6']
# All six public context tables. Rounding is retained; existing SOURCE_EXHAUSTIVE normalizes.
screen_tables=[
 [[95.3,3.8,1,0,0,0,0],[90.4,4,1.8,3.8,0,0,0],[89.4,4.3,2.6,3.8,0,0,0],[87.8,4.5,3.4,3.8,.5,0,0],[86.5,4.8,4.2,3.8,.5,.3,0],[85.2,5,5,3.8,.5,.3,.3]],
 [[91.5,7.5,1,0,0,0,0],[87.2,8,2.8,2,0,0,0],[84.9,8.5,4.6,2,0,0,0],[79.6,9,6.4,2,3,0,0],[76.3,9.5,8.2,2,3,1,0],[72.5,10,10,3,3,1,.5]],
 [[97.6,1.9,.5,0,0,0,0],[71.2,2,1.8,25,0,0,0],[70.3,2.1,2.6,25,0,0,0],[64.4,2.3,3.4,17.5,12.5,0,0],[63.4,2.4,4.2,12.5,10,7.5,0],[65,2.5,2.5,10,7.5,7.5,5]],
 [[96.8,2.5,.7,0,0,0,0],[93.6,2.7,1.2,2.5,0,0,0],[92.9,2.8,1.7,2.5,0,0,0],[91.9,3,2.3,2.5,.3,0,0],[91,3.2,2.8,2.5,.3,.2,0],[90.1,3.3,3.3,2.5,.3,.2,.2]],
 [[94.3,5,.7,0,0,0,0],[91.5,5.3,1.9,1.3,0,0,0],[89.9,5.7,3.1,1.3,0,0,0],[86.4,6,4.3,1.3,2,0,0],[84.2,6.3,5.5,1.3,2,.7,0],[81.7,6.7,6.7,2,2,.7,.3]],
 [[98.4,1.3,.3,0,0,0,0],[80.8,1.3,1.2,16.7,0,0,0],[80.2,1.4,1.7,16.7,0,0,0],[76.2,1.5,2.3,11.7,8.3,0,0],[75.6,1.6,2.8,8.3,6.7,5,0],[76.7,1.7,1.7,6.7,5,5,3.3]]]
for j,rows in enumerate(screen_tables):
 c='M06-C10' if j==0 else f'M06-N{j+2:02}'; tab=('月光' if j<3 else '裏月光')+'・'+['1〜1500G','1501〜5000G','5001G以降'][j%3]
 f=cat(6,c,screen,rows,'AT終了時の種類と当日累計ゲーム数を区別。'+tab+'に該当した終了画面を1回1種類で記録。累計ゲーム数が不明なら数値推測に使用しません。',label='AT終了画面（'+tab+'）',urls=[primary[6],'https://1geki.jp/slot/l_shinodama3_kaiden/98/']);mirror(6,f,list(zip(screen,meaning)));ctx(f,'shinobi_at_end',c,'AT終了画面',tab)
yoshi=['その他','疾風・マッド・疾風など4種','疾風・楓・疾風','マッド・メカロゴ・マッド','マッド・マッド・マッド','疾風・疾風・疾風','楓・楓・楓']
yrows=[[[92.3,7.5,.3,0,0,0,0],[82.3,8,2.2,7.5,0,0,0],[79.9,8.5,4.2,7.5,0,0,0],[76.7,9,6.1,7.5,.8,0,0],[74,9.5,8.1,7.5,.8,.3,0],[71.4,10,10,7.5,.8,.3,.1]],[[92.3,7.5,.3,0,0,0,0],[86.8,9,3.2,1,0,0,0],[82.4,10.5,6.2,1,0,0,0],[76.4,12,9.1,1,1.5,0,0],[71.5,13.5,12.1,1,1.5,.5,0],[66.3,15,15,1.5,1.5,.5,.3]],[[100,0,0,0,0,0,0],[99,0,0,1,0,0,0],[99,0,0,1,0,0,0],[89,0,0,1,10,0,0],[81.5,0,0,1,7.5,10,0],[76.5,0,0,1,5,7.5,10]]]
for j,rows in enumerate(yrows):
 c='M06-C11' if j==0 else f'M06-N{j+7:02}';tab=['1〜1500G','1501〜5000G','5001G以降'][j]
 f=cat(6,c,yoshi,rows,'神速ノ刻終了時のよしぱすを記録。'+tab+'。弱示唆4種は疾風・マッド・疾風／楓・マッド・楓／メカロゴ・楓・メカロゴ／マッド・楓・マッドの合計。',label='神速終了時のよしぱす（'+tab+'）',urls=[primary[6],'https://1geki.jp/slot/l_shinodama3_kaiden/98/']);mirror(6,f,list(zip(yoshi,meaning)));ctx(f,'shinobi_yoshi',c,'神速ノ刻終了時のよしぱす',tab)
vlabels=['柊「頑張ってください！」','アラシ「やってやるぜ！」','柊「一緒に修行に励むのです」','アラシ「気を抜くんじゃないぞ」','幻龍斎「忍びとは！悪に立ち向かう者也！」','Dr.マッド「天才は何度でも蘇るものさ！」','疾風「忍魂ぃぃい！」','楓「忍魂ぃぃい！」']
vmean=['奇数設定示唆','偶数設定示唆','設定2否定','設定3否定','設定2以上','設定4以上','設定5以上','設定6']
weak=[[66.4,33.2,.2,.2,0,0,0,0],[33.2,66.4,0,.2,.2,0,0,0],[66.4,33.2,.2,0,.2,0,0,0],[31.5,63,1.5,1.5,1.5,1,0,0],[62.2,30.8,1.5,1.5,1.5,1.5,1,0],[30.7,60.3,1.5,1.5,1.5,2,1.5,1]]
strong=[[40,10,25,25,0,0,0,0],[5,45,0,25,25,0,0,0],[45,5,25,0,25,0,0,0],[5,42,17,17,17,2,0,0],[40,4,17,17,17,3,2,0],[2,38,17,17,17,4,3,2]]
for c,rows,tab in [('M06-N10',weak,'弱レア役'),('M06-N11',strong,'強レア役')]:
 f=cat(6,c,vlabels,rows,'エンディング中に'+tab+'が成立したゲームでPUSHを押し、発生したボイスを1回1種類で記録。押し忘れは観測回数に含めません。',label='EDボイス（'+tab+'）',urls=[primary[6],'https://1geki.jp/slot/l_shinodama3_kaiden/98/']);mirror(6,f,list(zip(vlabels,vmean)));ctx(f,'shinobi_ed_voice',c,'エンディング中のPUSHボイス',tab)
evidence(6,'M06-N12',[('456枚突破','設定4以上'),('666枚突破','設定6')],'AT中の獲得枚数表示。各表示の出現率は累計Gで変わり、到達・表示の機会が別なので不出現を独立の尤度にしません。',label='獲得枚数表示')
for c,vs,tab in [('M06-N13',[77.1,77.1,77.4,77.6,78,78.5],'AT終了直後'),('M06-N14',[53.4,53.6,53.9,53.9,54.4,55.1],'終了直後以外')]:
 rate(6,c,pct(vs),'引き戻しCZのうち'+tab+'の突入回数とAT成功回数を記録。1周期目の確認を終えた範囲だけを数えます。','SHINOBI_RETURN_'+c+'_TRIAL',True,'引き戻しCZ成功（'+tab+'）')
for j,(state,role,vs) in enumerate([('月光','チェリー',[2.66,2.69,2.72,2.76,2.77,2.78]),('月光','スイカ',[3.14,3.36,3.44,4.02,4.71,5.6]),('月光','チャンス目',[18.37,18.82,19.25,20.36,20.5,20.96]),('神速','チェリー',[3.05,3.05,3.07,3.08,3.09,3.12]),('神速','スイカ',[3.83,4.08,4.13,4.71,5.44,6.22]),('神速','チャンス目',[24.07,24.24,24.35,24.85,24.89,25.12])],15):
 rate(6,f'M06-N{j:02}',pct(vs),state+'中の'+role+'成立回数と、その役を契機とした全ボーナス当選回数。色を問わない当選率であり、ピンク7限定へ読み替えません。','SHINOBI_'+state+'_'+role+'_TRIAL',True,state+'中'+role+'からボーナス')
group(6,['M06-C01','M06-C02','M06-C03','M06-C05','M06-N01','M06-N02','M06-C09','M06-N13','M06-N14'],'shinobi_normal_chain','周期役契機・CZ・引き戻し・ATは同じ当選経路を含み、周辺確率を独立に重ねず代表を選択。')
group(6,['M06-C08',*[f'M06-N{j:02}' for j in range(15,21)]],'shinobi_at_bonus','AT中の役契機ボーナスとスイカ契機ピンク7は包含関係。完全に観測した役別条件付き当選率を優先し、未観測時だけ次の候補へ切り替えます。',fallback=True)
# 07 Dragon: experimental values never masquerade as a six-setting public likelihood.
rate(7,'M07-C01',inv([256,246,235,224,212,199]),'総ゲーム数とBIG回数。通常ゲーム数を別入力しません。','TOTAL_GAME_TRIAL')
rate(7,'M07-C02',inv([642,585,537,489,442,399]),'総ゲーム数とREG回数。BIGと同一ゲームで同時成立しない排他的なボーナスです。','TOTAL_GAME_TRIAL')
group(7,['M07-C01','M07-C02'],'dragon_bonus','BIGとREGは同一ゲームで排他的なボーナス。合算を追加せず、内訳を一つの分布として計算します。','DEPENDENT')
block(7,'M07-C03','BIG中スイカの公開値には少数設定の実戦値しか確認できず、全6設定の理論値が揃いません。別機種の約1/42.9〜1/28.0を流用せず、記録のみとします。',{'experimentalTransferred30Version':{'1':'1/73.5','6':'1/63.0'},'notUsed':'handoff 1/42.9〜1/28.0'},urls=['https://p.hisshobon.jp/machine/4269/1/101591',secondary[7]])
evidence(7,'M07-C04',[(l,'偶奇設定示唆・本機の理論比率未確認') for l in ['青','黄','緑','赤']]+[('虹','高設定示唆・確定条件未確認')],'REG中に一度スイカを揃えた際のサイドランプ。公開されている設定1・6の比率はメダル版の実戦値であり、確定制約や理論出現率には使いません。')
evidence(7,'M07-C05',[(l,'高設定期待度示唆・本機の確定条件未確認') for l in ['白','青','黄','緑','赤','虹']],'ボーナス終了時のフェザーランプ。BIG後・REG後をタブで区別。過去シリーズならという説明から本機の設定以上確定を作りません。')
block(7,'M07-C06','通常時チェリー・スイカの全設定別確率は確認できません。設定差の存在を推測して補完しません。ベルも設定1・6のメダル版実戦値のみで理論値として使いません。',{'experimentalBell':{'1':'1/7.53','6':'1/7.38'}},urls=['https://p.hisshobon.jp/machine/4269/1/101591',secondary[7]])
# 08 King: displayed chain-inclusive bonus frequency != a fresh initial hit.
reference(8,'M08-C01',inv([154.8,151,127.4,116.8,106.4]),'公表合算にはストック放出・ループ連チャンが含まれます。連チャンを除いた初当たり率へそのまま流用せず、公表スペックとして保持します。')
rate(8,'M08-C02',inv([410.9,400.8,380.4,357.9,333.5]),'ボーナス消化以外のゲーム数とスコールチャンス（雷雨含む）突入回数。ボーナス中のCZ獲得は実際のCZ突入と二重に加算しません。','KING_CZ_GAME_TRIAL')
rate(8,'M08-C03',inv([136.5,134.3,127,120.5,110.7]),'通常時の小役カウント対象ゲーム数とオレンジ成立回数。レア役合算を別に加算しません。','NORMAL_GAME_TRIAL',label='通常時オレンジ')
rate(8,'M08-N01',inv([1724.6,1724.6,1560.4,1560.4,1424.7]),'通常時の小役カウント対象ゲーム数とリーチ目役成立回数。実際に確認できた成立だけを数えます。','NORMAL_GAME_TRIAL',label='通常時リーチ目役')
rate(8,'M08-C04',inv([16384,16384,6553.6,3276.8,1638.4]),'BIG・REG消化ゲーム数と、1枚役を契機とした恩恵獲得・昇格回数。1枚役成立回数を母数にしません。レア役否定の！から宝箱にCZが出る演出等で契機を確認できた回数だけ記録。','KING_BONUS_GAME_TRIAL',urls=[secondary[8],primary[8]])
evidence(8,'M08-C05',[(l,m) for l,m in [('銅','設定2以上'),('金','設定4以上'),('ケロット柄','設定5以上'),('虹','設定6')]],'BIG終了時のサブ液晶。設定3非搭載なので銀は設置しません。')
evidence(8,'M08-C06',[('レア役否定の！→宝箱からCZ','設定差のある1枚役契機の識別補助'),('オレンジ・チェリーから宝箱','全設定共通抽選を含む')],'宝箱はM08-C04の成功回数を見分ける補助です。別の推測要素や追加の成功回数にはしません。')
group(8,['M08-C02','M08-C03','M08-N01','M08-C04'],'king_causal_path','オレンジ・リーチ目・ボーナス中獲得はCZやボーナスの同じ当選系列につながります。別々に独立加算せず代表を選びます。')
# 09 Chibariyo2 (not Plus).
rate(9,'M09-C01',inv([328,314.4,281.1,263.3,224.8]),'ボーナス消化以外のゲーム数から32Gの連チャン確認区間を除外した通常ゲーム数と、その区間外の初当たり回数。32G以内の当選は連チャンとして除きます。','NON_CHAIN_BONUS_INITIAL_GAME_TRIAL')
reference(9,'M09-C02',{k:'REG1/'+str(a)+'; BIG1/'+str(b)+'; SBIG1/'+str(c)+'; 合算1/'+str(d) for k,a,b,c,d in zip(keys(9),[321.5,308.3,275.9,258.1,221.8],[226.1,217.2,193.6,181,156.1],[707.9,673.4,590.1,545,453.5],[111.8,107.1,95.4,89,76.2])},'連チャンを含むBIG・REG・SBIG出現率です。初当たりと独立に計算せず、非連チャン母数にも当てません。')
reference(9,'M09-C03',pct([2.57,2.8,3.03,3.03,3.04]),'弱チェリー時の内部直撃抽選率です。規定チェリー回数到達による当選と直撃当選を全件区別できないため、弱チェリー後の全当選率へ代用しません。',urls=['https://nana-press.com/kaiseki/machine/722/19983/'])
reference(9,'M09-C04',{k:'弱チェリー '+str(a)+'%; 強チェリー '+str(b)+'%' for k,a,b in zip(keys(9),[5.83,6.13,6.76,6.92,6.72],[56.05,56.26,57.26,57.96,58.86])},'チェリーからのボーナス期待度は直撃・規定回数・前兆中の擬似遊技チェリーを含みます。重なる前兆中の複数チェリーへ一つのボーナスを重ねて割り当てません。')
block(9,'M09-C05','押し順12枚ベルと共通ベルは設定1のみが公表され、設定2・4・5・6が未確認です。設定1の値を全設定へコピーせず、推測には使いません。',{'1':{'ordered':'1/7.80','common':'1/32.19'}},urls=[primary[9],secondary[9]])
ann=['やりましたね！','すんごいですよ！','お見事ー！ですっ！！','マーベラスです！','おめでとうございます！','さっすがですっ','やりますね～','今日は遊びに来てくれてありがとうございます！']
gushi=['さあ、リールを止めてください！','おめでとう！やったね～','よかったね～','僕もうれしいね～','花笠光ってるね～','大きいほうがいいね～','ちょっちゅね×3（弱）','ちょっちゅね×3（中）','ちょっちゅね×3（強）','具志堅です','具志堅ですう！！','具志堅用高ですう！！！','ラッキー','ちょっちゅね～。具志堅用高です！']
evidence(9,'M09-C06',[(l,'高設定示唆') for l in ann+gushi],'花笠点灯時のアンちゃん・具志堅ボイス。レバーON・停止時・SPボタンの1日1回ボイスを区別。天国以上などの発生条件があるため、不出現を低設定として数値化しません。')
evidence(9,'M09-C07',[('押し順ナビが具志堅用高','高設定示唆・次Gで1G連'),('通常の押し順ナビ','デフォルト')],'ボーナス中の押し順ナビ。継続率のみの示唆は設定確定として扱いません。')
block(9,'M09-C08','連チャン区間は独立した設定差の確率ではなく、初当たりを数えるための条件です。除外ゲーム数を保持して初当たりの母数へ反映し、別の尤度にはしません。',{'exclusion':'32G確認区間・区間内当選を除外','ownerFindingId':'M09-C01'})
# 10 Nangoku: BGM is observable and has a complete conditional likelihood.
rate(10,'M10-C01',inv([299.8,291,267.3,238.6,208.8]),'ボーナス消化以外のゲーム数からバタフライ・ときめき等の連チャン確認区間を差し引いたゲーム数と、区間外のボーナス初当たり回数。区間内の当選は連チャンとして除きます。','NON_CHAIN_BONUS_INITIAL_GAME_TRIAL')
reference(10,'M10-C02',{k:'通常A・B1/'+str(v)+'; 初代1/160; 引き戻し1/131.7; チャンス1/106.1' for k,v in zip(keys(10),[331.6,322.1,298.1,272.7,250.7])},'内部通常A・B、初代、引き戻し、チャンスの滞在ゲーム数を全例識別できません。見た目の通常ゲーム数を特定モードの滞在ゲーム数へ代用しません。')
reference(10,'M10-C03',inv([40000,30000,20000,10000,7000]),'初代モード実質突入率は概数です。隠れた初代移行を全例識別できず、継続した回数を新規移行回数として代用しません。')
block(10,'M10-C04','飛翔A・B・超飛翔の内部移行率は全設定分が揃いません。平均獲得枚数は移行率ではないため、期待枚数から抽選率を作りません。',{'averagePayoutFlightAB':[1025.7,1024.2,1001.7,949.7,853.4],'superFlight':'2500枚超'})
reference(10,'M10-C05',{k:'通常A・Bチェリー '+str(a)+'%; スイカ '+str(b)+'%' for k,a,b in zip(keys(10),[2.1,2.4,3.1,3.5,4],[3.1,3.2,3.4,3.8,4])},'通常A・B中だけの小役当選率です。初代・引き戻し・チャンスをすべて区別できず、通常時全小役にこの率を使いません。')
reference(10,'M10-C06',pct([53.4,53.4,53.4,54.1,55.3]),'全状態平均のBIG選択率です。連チャンを除いた初当たり限定比率へ読み替えず、初当たり率にも独立に重ねません。')
rate(10,'M10-C07',pct([2,4,6,8,10]),'ボーナス入賞時の先飛翔、または消化中の1G連当選でBGMが選ばれた回数と、「感じてSunshine」が選ばれた回数。ほかの飛翔曲も母数に含め、同じ曲が続いているだけなら新しい1回にしません。','NANGOKU_FLIGHT_MUSIC_TRIAL',True,urls=['https://nana-press.com/kaiseki/machine/703/20485/','https://1geki.jp/slot/l_nangoku_sdc/0/'])
reference(10,'M10-C08',{k:'通常A30%・通常B50%・チャンス20%' for k in keys(10)},'設定変更時のモード振分は全設定共通です。設定差のある確率としては使用しません。')
evidence(10,'M10-C09',[('上下パネル消灯','設定Lの可能性'),('通常点灯','デフォルト')],'設定Lの識別用参考記録。通常の設定1・2・3・5・6の推測へ低い出玉率を混ぜません。')
# Concrete reference records for the otherwise non-numeric bonus observations.
evidence(7,'M07-N01',[('BIG中スイカ','理論確率未確認')],'BIG中の消化Gとスイカ回数を記録。記録のみ・推測計算には使用しない。',label='BIG中スイカの参考記録',urls=['https://p.hisshobon.jp/machine/4269/1/101591'])
changes.extend([{'candidateId':'M04-*','change':'RESTORED_SETTING_3_FROM_TWO_CURRENT_SIX_SETTING_TABLES; baseline five-setting identity not reused'}, {'candidateId':'M08-C04','change':'PER_BONUS_GAME_CONFIRMED; NOT_PER_ONE_COIN_ROLE'}, {'candidateId':'M01-C09','change':'331_OVER_6_SUPPORTED_BY_PWORLD_AND_DETAIL; alternate 5plus retained in conflict log'}, {'candidateId':'M06-C01','change':'334.4_ADOPTED_AFTER_BOUNDED_PWORLD_CHECK; 333.4 alternate located in 1geki'}, {'candidateId':'M07-C03..C06','change':'EXPERIMENTAL_OR_PREDECESSOR_SPECULATION_SEPARATED_FROM_PUBLIC_THEORETICAL_VALUES'}])
# The two public Bancho screen tables are conditional on remaining Fuji quota.
# With an exact day-start Fuji count, use the source's possible/impossible row
# separately for every setting. No guessed global state or invented probabilities.
fuji_yes=[[44.5,44.5,10,1,0,0,0,0],[36.12,49.88,10,1,3,0,0,0],[40.13,40.13,13.75,3,3,0,0,0],[33.29,45.97,13.75,3,3,1,0,0],[50.75,21.75,17.5,5,3,1,1,0],[30.03,41.47,17.5,5,3,1,1,1]]
fuji_no=[[44.5,44.5,10,1,0,0,0,0],[37.38,51.62,10,1,0,0,0,0],[41.63,41.63,13.75,3,0,0,0,0],[33.29,45.97,13.75,3,0,4,0,0],[50.75,21.75,17.5,5,0,4,1,0],[30.03,41.47,17.5,5,0,4,1,1]]
blabels=['轟金剛','ハンバーグ','サファリ','ショッピング','富士山','茶摘み','レースクイーン','温泉']
for n in range(6):
 cid='M02-C09' if n==0 else f'M02-N{n:02}'
 rows=[fuji_yes[s-1] if n<s-1 else fuji_no[s-1] for s in range(1,7)]
 f=cat(2,cid,blabels,rows,'7000G超の最初の特殊終了画面を除く。現在の当日累計Gが分かり、当日開始から前回までの富士山出現を'+str(n)+'回と確認できる場合の通常時ボーナス・AT終了画面。今回の画面を1種類記録してから富士山累計を更新。前任者分が不明なら数値推測には使わず設定確定・否定だけ記録。',label='ボーナス・AT終了画面（富士山既出'+str(n)+'回）')
 mirror(2,f,list(zip(blabels,['デフォルト','偶数設定示唆','高設定示唆（弱）','高設定示唆（強）','設定'+str(min(n+2,6))+'以上','設定4以上','設定5以上','設定6'])))
 f['conditionalStateModel']={'stateCounter':'fujiOccurrencesBeforeObservation','exactDayHistoryRequired':True,'value':n,'publishedQuotaBySetting':{str(s):s-1 for s in range(1,7)},'selection':'sourcePossibleRow if previousCount < setting-1 else sourceImpossibleRow','impossibleHistory':'known Fuji constraints exclude impossible settings; no repeated likelihood for history','update':'after recording current category'}
 ctx(f,'bancho_end',cid,'ボーナス・AT終了画面','富士山既出'+str(n)+'回')
# ED character surface: retain all outcomes, not just steel.
evidence(2,'M02-C10',[('舎弟','設定5示唆'),('牡丹','偶数設定示唆'),('宗次郎','高設定示唆'),('マチ子','設定4以上'),('操','設定5以上'),('鋼鉄','設定6')],'エンディング中、ベルカウンター7到達で出現したキャラを記録。')
f=cat(2,'M02-N06',blabels,[[50,50,0,0,0,0,0,0],[42,58,0,0,0,0,0,0],[50,50,0,0,0,0,0,0],[21,29,0,0,0,50,0,0],[35,15,0,0,0,40,10,0],[21,29,0,0,0,30,10,10]],'当日累計7000Gを超えた後の最初の終了画面だけ。ほかの終了画面タブへ同じ1回を入れません。累計履歴が不明なら数値推測に使用しません。',label='7000G超の最初の終了画面')
mirror(2,f,list(zip(blabels,['デフォルト','偶数設定示唆','高設定示唆（弱）','高設定示唆（強）','設定2以上','設定4以上','設定5以上','設定6'])))
f['conditionalStateModel']={'dayTotalGames':'>7000','ordinalAfterCrossing':1,'unknownHistory':'NUMERIC_DISABLED'}
ctx(f,'bancho_end','special7000','ボーナス・AT終了画面','7000G超の最初')
# Keep every public point distribution even though the latent points cannot be counted.
p=next(x for x in D[5]['blockedItems'] if x['blockId']=='M05-C04')
p['retainedPublishedValues'].update({
 'reset30_50':[[99.6,.4],[98.4,1.6],[96.9,3.1],[93.8,6.3],[87.5,12.5],[87.5,12.5]],
 'weak0_10_30':[[99.2,.4,.4],[99.2,.4,.4],[99.2,.4,.4],[96.9,1.6,1.6],[95.3,2.3,2.3],[93.8,3.1,3.1]],
 'strong1_3_5_10_30':[[42.2,37.5,16.8,3.1,.4],[40.6,37.5,17.6,3.9,.4],[39.1,37.5,18.4,4.7,.4],[35.5,37.5,20.3,6.3,.4],[28.9,37.5,25,7.8,.8],[26.6,37.5,25,9.4,1.6]],
 'bigEnd1_3_5_10_30':[[29.7,50,16.8,3.1,.4],[28.1,50,17.6,3.9,.4],[26.6,50,18.4,4.7,.4],[23,50,20.3,6.3,.4],[16.4,50,25,7.8,.8],[14.1,50,25,9.4,1.6]],
 'atEnd1_3_5_10_30_50':[[50,35.2,13.3,.8,.4,.4],[48.8,35.2,14.1,1.2,.4,.4],[47.7,35.2,14.8,1.6,.4,.4],[37.5,35.9,18.8,6.3,.8,.8],[37.5,35.9,18.8,6.3,.8,.8],[37.5,35.9,18.8,6.3,.8,.8]],'unit':'percent; rows setting1..6; rounded original values, not inferred runtime likelihood'})
# One immutable adoption boundary; no renderer or runtime artifacts are produced.
domain_notes={
 1:{'INITIAL_HIT':'AT総合・直撃、WAVE獲得のセブンチャンスを調査。','SMALL_ROLE':'6択ベル成立と入賞を区別。低確弱チェリーは内部状態が見抜けない。','BONUS':'AT中BIG終了人数の全6設定分布、確定画面、獲得枚数・EDランプ・トロフィーを列挙。','POINTS_GAME_DISTRIBUTION':'WAVE獲得経路とセブン初期Lv1/12を区別。'},
 2:{'INITIAL_HIT':'ボーナス・AT直撃を別候補として評価。','SMALL_ROLE':'共通ベルはエンブレム・EDの識別不能Gを除外。','SUCCESS_RATE':'確定対決の内部当選と見える勝利を同一視しない。','MODE_TRANSITION':'逆さ富士の新規移行と通常富士山の累計を区別。','EVIDENCE':'終了画面は富士山の当日既出回数で確率表を切り替える。REG背景とEDキャラも列挙。'},
 3:{'INITIAL_HIT':'ボーナス・ATの全5設定を確認。Lは通常数値推測の対象外。','INTERNAL_CONDITIONAL_DRAW':'雷RIZE1回あたりの直撃昇格を1G確率にしない。','MODE_TRANSITION':'モードB優遇は数値・毎回移行先が非公開のため限定調査で閉じる。','EVIDENCE':'逃走終了9種、AT終了8種、EDカード9種とちゅどーんボイスを列挙。'},
 4:{'INITIAL_HIT':'旧Researchの設定3欠落を回復。全6設定の初当たり・AT。','CZ':'狩猟1/64.8等は総合突入率。内部通常・高確準備限定の役別抽選と分離。','EVIDENCE':'終了画面、2機会の写真分布、キャラと特殊シナリオ、枚数・トロフィー。','ROLE_CONDITIONAL_DISTRIBUTION':'チャンス目契機のストック数と温泉抽選は内部状態条件付き。'},
 5:{'BONUS':'リアルボーナス1/199.8は全設定共通。AT初当たりとは異なる。','INTERNAL_CONDITIONAL_DRAW':'通常・高確の役別AT抽選の全表を保持し内部状態推定を使わない。','POINTS_GAME_DISTRIBUTION':'設定変更・弱役・強役・BIG後・カレイド後・AT後の6表を保持。内部獲得ptは識別不可。','THRESHOLD_BEHAVIOR':'天井設定値は早い当選により打ち切られるので観測当選Gを天井に代用しない。','EVIDENCE':'終了ランプ、15キャラと順序崩れ、5トロフィーを保持。'},
 6:{'INITIAL_HIT':'AT設定4は資料間差333.4/334.4を追加1回で照合し334.4採用。','CZ':'周期チャンス目CZ・夕方3役・引戻し1周期と成功率を区別。','AT':'初期セット数と実際の継続を分離。月光/神速の役別BONUSとスイピンを調査。','EVIDENCE':'月光/裏月光×3G帯、よしぱす3G帯、弱強別EDボイスの全設定分布を抽出。枚数表示も保持。','POST_EVENT_TRANSITION':'AT後1周期目のジャッジまでを引き戻し窓として明記。'},
 7:{'BONUS':'BIG/REGの6設定値。合算を重ねず排他的に計算。','SMALL_ROLE':'BIGスイカ・通常ベルはメダル版実戦値のみ。チェリー・スイカの理論6設定表は確認できず。','EVIDENCE':'REGサイドとBIG/REG後フェザーの色を列挙。過去シリーズ仮説を本機の確定条件へ昇格しない。','EXTERNAL_DATA_ONLY':'メダル版短時間実戦の値は参考。確率の全設定補完に使わない。'},
 8:{'BONUS':'合算1/154.8等は連チャンを含む出現率。非連チャン初当たり率へ転用しない。','SMALL_ROLE':'オレンジ・リーチ目役・レア役合算を調査し包含を整理。','CZ':'スコール雷雨含む。1枚役CZはボーナス1Gあたりであることを明記。','EVIDENCE':'BIG終了の4トロフィー。宝箱は1枚役契機の識別補助。'},
 9:{'INITIAL_HIT':'チバリヨ2のみ。プラスと分離し32G連チャン除外を保持。','SMALL_ROLE':'ベルは設定1のみ。弱チェリー直撃とチェリー後総合期待度を別表で保持。','EVIDENCE':'アンちゃん・具志堅告知ボイス、SP1日1回、押し順ナビを列挙。出現率未知。','NAVIGATION':'ナビ具志堅は1G連＋高設定示唆。設定確定にしない。'},
 10:{'INITIAL_HIT':'1/299.8等とモード別率を区別。連チャン区間除外を保持。','MODE_TRANSITION':'初代概数、飛翔移行と期待枚数の別を確認。','BONUS_TYPE_CONDITIONAL':'BIG比率は全状態平均で初当たり限定率ではない。','EVIDENCE':'飛翔曲Sunshine選択は正確に数えられる二値。下パネルLは参考。','RESET_BEHAVIOR':'A30/B50/チャンス20は全設定共通。SPECIALの資料は不使用。'}}
for i,d in D.items():
 old=d.pop('_old');sid1=src(i,primary[i]);sid2=src(i,secondary[i]);base_identity_source=next(s['url'] for s in old['sources'] if s['sourceId'] in old['machine']['identitySourceRefs']);isid=src(i,base_identity_source)
 d['machineIdentity']['identityVerification']={'checkedAt':DATE,'sourceIds':[isid],'status':'REPOSITORY_IDENTITY_PUBLIC_NAME_TYPE_DATE_MATCHED','baselineSettingsCorrected':i==4}
 qs=[d['machineName']+' 設定差 設定判別 終了画面',d['machineName']+' 型式 導入日 全設定',d['machineName']+' 母数 当選契機 記録条件']
 d['researchCompleteness']['machineSpecificQueries']=qs
 d['researchCompleteness']['queryType']='CURRENT_PUBLIC_SEARCH_AND_PINNED_REPOSITORY_RECONCILIATION; search term variants recorded, not independent external audit'
 # All source claims trace to concrete candidate rows, not a placeholder count.
 for f in d['findings']+d['blockedItems']:
  cid=f.get('findingId',f.get('blockId'));block0='blockId' in f
  claim=cid+' '+f['label']+'：'+(f['reason'] if block0 else ('公開設定別数値と観測条件を照合' if 'settingDistribution' in f else '表示されたカテゴリの意味と非公開出現率の区別を照合'))
  sc=[]
  for sid in f['sourceIds']:
   s=next(s for s in d['sources'] if s['sourceId']==sid);s['claims'].append(claim);sc.append({'sourceId':sid,'claim':claim})
  d['researchCompleteness']['candidateLedger'].append({'candidateId':cid,'label':f['label'],'sourceClaims':sc,'discoveryQueries':qs,'disposition':{'type':'BLOCKED' if block0 else 'FINDING','refId':cid},'origin':'HANDOFF_V4' if cid in C else 'PUBLIC_SURFACE_SPLIT_OR_RECOVERED_CANDIDATE','publicSearchDisposition':'CLOSED_WITH_EVIDENCE','repeatSearchRequired':False})
 # Attach the comparative overview and identity claims to one original row.
 first=d['researchCompleteness']['candidateLedger'][0]
 for sid,cl in [(sid2,d['machineName']+' 別編集資料で候補領域と識別条件を照合。'),(isid,d['machineName']+' 型式・導入日・設定構成を照合。')]:
  next(s for s in d['sources'] if s['sourceId']==sid)['claims'].append(cl);first['sourceClaims'].append({'sourceId':sid,'claim':cl})
 for domain in DOMAINS:
  note=domain_notes[i].get(domain)
  if note is None:
   if domain=='EXTERNAL_DATA_ONLY':note='実機連動機能の有無を採否条件にしない。今回の数値候補は直接記録できる観測のみで評価。自動取込・サービス実装は今回対象外。'
   else:note=d['machineName']+'の設定差総覧・ゲームフローと上記候補を対照。'+('／'.join(domain_notes[i].values())[:150])+' この領域の別個の全設定公開値は今回の限定調査で追加確認されず、既存候補の条件・参考情報として保持。'
  d['researchCompleteness']['domains'].append({'domain':domain,'status':'CHECKED','note':note,'sourceIds':[sid1,sid2],'nextWorkDisposition':{'owner':'RESEARCH','repeatPublicSearch':False,'reopenPolicy':'NEW_CONCRETE_SOURCE_ONLY'}})
 d['researchCompleteness']['candidateCount']=len(d['researchCompleteness']['candidateLedger'])
 d['researchCompleteness']['originalCandidateCount']=sum(c['machine_id']==f'{i:02}' for c in original)
 d['researchCompleteness']['externalAudit']='NOT_PERFORMED'
 # Keep the shared operational rule without asserting publisher sampling equality.
 if i in [9,10]:
  artifact='production/batches/'+B+'/scope-authorization.json'
  d['productObservationPolicy']={'authority':'USER_EXPLICIT_INSTRUCTION','countingRule':'OKISLOT_CHAIN_ZONE_EXCLUDED','publishedDenominatorEquivalence':'NOT_ASSERTED','artifact':artifact}
  f=next(f for f in d['findings'] if f['findingId']==f'M{i:02}-C01')
  f['operationalCounting']={'authority':'USER_EXPLICIT_INSTRUCTION','policyArtifact':artifact,'publishedDenominatorEquivalence':'NOT_ASSERTED','gamesFormula':'nonBonusGames - chainZoneGames','negativeOrMissing':'UNOBSERVED_NOT_ZERO','chainGamesCountedOnce':True}
 d['sources']=[s for s in d['sources'] if s['claims']]
 # A complete benchmark exists only for game-trial classes supported by existing evaluator.
 for f in d['findings']:
  if f.get('observationType') in ['probability','conditional_probability','appearance_distribution']:
   f['benchmarkExposureReview']={'hierarchyAttempted':['DIRECT_PUBLISHED','DERIVED_EXACT','DERIVED_APPROXIMATED','DERIVED_BOUNDED'],'scope':'7000G benchmark distinct from live observations','result':'EXACT_7000_ELIGIBLE_GAMES' if f['trialUniverse'] in ['TOTAL_GAME_TRIAL','NORMAL_GAME_TRIAL','BONUS_ELIGIBLE_GAME_TRIAL'] else ('UPPER_BOUND_7000_ELIGIBLE_GAMES' if f['observationType']=='probability' else 'OPPORTUNITY_PER_BENCHMARK_GAME_UNRESOLVED'),'reason':'実測母数は直接観測。条件付き機会は上流頻度が揃わず、ゲーム数を機会数へ代用しない。既存Evaluatorの計算方式を維持。'}
 (O/(d['machineId']+'.json')).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
(I/'reconciliation-changes.json').write_text(json.dumps(changes,ensure_ascii=False,indent=2)+'\n')
spec={'batchId':B,'manifestVersion':'8.5','waves':[{'waveId':'wave-1','machineIds':[s['machineId'] for s in sel[:5]]},{'waveId':'wave-2','machineIds':[s['machineId'] for s in sel[5:]]}]}
(R/'specs'/(B+'.json')).write_text(json.dumps(spec,indent=2)+'\n')
assert len(C)==86
all_ids={r['candidateId'] for d in D.values() for r in d['researchCompleteness']['candidateLedger']}
assert set(C)<=all_ids, set(C)-all_ids
print(json.dumps({'machines':len(D),'preservedOriginalCandidates':len(C),'ledgerCandidates':len(all_ids),'numeric':sum('settingDistribution' in f for d in D.values() for f in d['findings']),'evidence':sum(f['observationType']=='evidence' for d in D.values() for f in d['findings']),'blocked':sum(len(d['blockedItems']) for d in D.values())},ensure_ascii=False))
