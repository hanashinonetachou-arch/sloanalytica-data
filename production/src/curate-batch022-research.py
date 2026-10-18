"""Bounded Batch022 intake; immutable handoff rows, existing production builders."""
import json,csv,pathlib,copy,re,hashlib
R=pathlib.Path(__file__).resolve().parents[1];I=R/'research-inbox/batch022';H=I/'imported-handoff';O=I/'reviewed';O.mkdir(exist_ok=True)
B='batch-20261018-022';DATE='2026-10-18';sel=json.loads((R/'next-machine-selection-20261018-batch022.json').read_text())['selected'];D={};ROWS={};ROUTE={};CHANGES=[]
DOMAINS='INITIAL_HIT BONUS SMALL_ROLE CZ AT INTERNAL_CONDITIONAL_DRAW MODE_TRANSITION STATE_TRANSITION SUCCESS_RATE POINTS_GAME_DISTRIBUTION CARRY_OVER THRESHOLD_BEHAVIOR RESET_BEHAVIOR POST_EVENT_TRANSITION NAVIGATION ROLE_CONDITIONAL_DISTRIBUTION BONUS_TYPE_CONDITIONAL EVIDENCE EXTERNAL_DATA_ONLY MACHINE_SPECIFIC'.split()
for i,m in enumerate(sel,1):
 p=next(H.glob(f'machines/machine{i:02}*/**/candidates*.csv'));rs=list(csv.DictReader(p.open(encoding='utf-8-sig')));ROWS[i]=rs;ROUTE[i]={}
 old=json.loads((I/'repository-baseline'/m['machineId']/'research-data.json').read_text())
 D[i]={'schemaVersion':'research-v1','manifestVersion':'8.5','batchId':B,'machineId':m['machineId'],'machineName':m['displayName'],'researchStage':'SOURCE_REVIEW_COMPLETE_PENDING_FORMAL_ACCEPTANCE','machineIdentity':old['machine'],'settings':{'values':old['machine']['settings'],'numericInferenceValues':old['machine']['settings']},'sources':[],'findings':[],'blockedItems':[],'researchCompleteness':{'version':2,'domains':[],'machineSpecificQueries':[],'candidateLedger':[]},'reviewAuthority':{'productionBaseCommit':'e731326f70a0f7a788910f72cf61d34eec919ecf','distributionBaseCommit':'d8ceed0a30b2e16d73d5f80c2f580187d11b4903','appQAHead':'c6f75f81853525588c70fbd47b117165caf1575b','externalAudit':'NOT_PERFORMED','auditType':'CANDIDATE_SOURCE_CONDITION_AND_REPOSITORY_SELF_AUDIT','fiveSiteCompletion':'INHERITED_WITH_RECORDED_LIMITATIONS','manufacturerThreeSiteCompletion':'NOT_ASSERTED','repeatResearchRequired':False},'inheritedCoverageCsv':list(csv.DictReader((p.parent/'coverage.csv').open(encoding='utf-8-sig'))),'repositoryBaselineInventory':{'features':old['features'],'evidenceCandidates':old['evidenceCandidates'],'researchCompleteness':old.get('researchCompleteness')}}
def row(i,n):return ROWS[i][n-1]
def key(i,n):return f'B022-M{i:02}-{n:03}' if isinstance(n,int) else f'B022-M{i:02}-{n}'
def settings(i):return [s.removeprefix('SET_') for s in D[i]['settings']['values']]
def raw(i,n):
 r=row(i,n);v=next((r[k] for k in ['settings_parameters','settings','parameters','values'] if r.get(k)),None)
 try:return json.loads(v)
 except:return v

def sid(i,url):
 d=D[i];s=next((s for s in d['sources'] if s['url']==url),None)
 if s:return s['sourceId']
 x='S'+str(len(d['sources'])+1).zfill(2);d['sources'].append({'sourceId':x,'url':url,'title':d['machineName']+' 設定差・観測条件','sourceType':'published_editorial_analysis','checkedAt':DATE,'claims':[]});return x

def put(i,n,obj,label=None,refs=None):
 r=row(i,n) if isinstance(n,int) else {};id=key(i,n);d=D[i]
 for k in ['findings','blockedItems']:d[k]=[f for f in d[k] if f.get('findingId',f.get('blockId'))!=id]
 urls=refs or [r.get('source_url') or row(i,1)['source_url']];f={'findingId':id,'label':label or r['candidate'],'sourceIds':[sid(i,u) for u in dict.fromkeys(urls)],**obj};d['findings'].append(f)
 if isinstance(n,int):ROUTE[i][n]=('FINDING',id)
 return f

def block(i,n,reason):
 id=key(i,n);d=D[i];r=row(i,n)
 d['findings']=[f for f in d['findings'] if f['findingId']!=id];d['blockedItems']=[f for f in d['blockedItems'] if f['blockId']!=id]
 f={'blockId':id,'label':r['candidate'],'sourceIds':[sid(i,r['source_url'])],'reason':reason,'reevaluationCondition':'不足を解消する新しい具体的な公開資料が得られた場合、この要素だけ見直します。','retainedPublishedValues':raw(i,n),'retainedHandoffClaim':r,'closure':'CLOSED_NO_REPEAT_PUBLIC_SEARCH','runtimeUse':'DISABLED'};d['blockedItems'].append(f);ROUTE[i][n]=('BLOCKED',id);return f

def rate(i,n,scope,unit='inverse',universe='NORMAL_GAME_TRIAL',vals=None,label=None):
 v=raw(i,n) if vals is None else vals
 if isinstance(v,list):v=dict(zip(settings(i),v))
 if unit=='inverse':v={k:'1/'+str(p) for k,p in v.items()}
 else:v={k:float(str(p).rstrip('%'))/100 for k,p in v.items()}
 return put(i,n,{'observationType':'probability' if unit=='inverse' else 'conditional_probability','settingDistribution':v,'trialUniverse':universe,'denominatorSemantics':scope,'details':[scope],'liveObservation':{'status':'EXACT_WITH_SCOPE_TRACKING','reason':scope}},label)

def ev(i,n,pairs,scope,label=None):
 cats=[]
 for l,m in pairs:
  exact='設定' in m and bool(re.search(r'[1-6]',m)) and not re.search('示唆|期待|不明|未確認',m)
  cats.append({'label':l,'meaning':m,'semanticType':'EXACT_CONSTRAINT' if exact else ('DISPLAY_ONLY' if re.search('デフォルト|基本|示唆なし|設定情報なし|復活のみ',m) else 'PROBABILITY_UNKNOWN')})
 details=[scope]
 if not any(c['semanticType']=='EXACT_CONSTRAINT' for c in cats):details.append('このセクションの全項目は設定別出現率が公表・確認されていないため、記録のみです。設定推測の計算には使用しません。')
 else:details.append('出現率が不明の示唆は記録のみです。設定確定・否定は設定候補の絞り込みに反映できる可能性があります。')
 return put(i,n,{'observationType':'evidence','semanticCategories':cats,'details':details},label)

def cat(i,n,labels,rows,scope,meanings=None,label=None,refs=None):
 if isinstance(rows,list):rows=dict(zip(settings(i),rows))
 f=put(i,n,{'observationType':'appearance_distribution','settingDistribution':{k:' / '.join(f'{l}: {round(max(0,p),10):g}%' for l,p in zip(labels,vs)) for k,vs in rows.items()},'trialUniverse':'CONDITIONAL_EVENT_TRIAL','categoryModel':{'residualPolicy':'SOURCE_EXHAUSTIVE'},'denominatorSemantics':scope,'details':[scope],'liveObservation':{'status':'EXHAUSTIVE_CATEGORICAL','reason':scope}},label,refs)
 if meanings:
  e=ev(i,str(n)+'-E',list(zip(labels,meanings)),scope,label=f['label']+'の設定制約');e['sourceIds']=f['sourceIds']
  for c in e['semanticCategories']:c['linkedFindingId']=f['findingId']
  f['mirrorsEvidenceFindingId']=e['findingId'];f['categoricalEvidenceReconciliation']={'type':'SINGLE_CANONICAL_CATEGORY_INPUT','evidenceFindingId':e['findingId'],'runtimeLinkContract':'EXPLICIT_CATEGORY_LINK_V1'}
 return f

def combine(i,n,ns,scope,title,meanings=None):
 labels=[row(i,x)['candidate'].split('：')[-1].split('・')[-1] for x in ns];rs={k:[float(str(raw(i,x)[k]).rstrip('%')) for x in ns] for k in settings(i)}
 f=cat(i,n,labels,rs,scope,meanings,title)
 for x in ns:ROUTE[i][x]=('FINDING',f['findingId'])
 return f

def ctx(f,op,cond,title,tab):f['observationContext']={'groupingApproved':True,'opportunityId':op,'conditionId':str(cond),'groupTitle':title,'conditionLabel':tab}
def group(i,ns,name):
 for f in D[i]['findings']:
  if f['findingId'] in [key(i,n) for n in ns] and f.get('settingDistribution'):
   reason='同じ当選経路の合算・内訳・上流下流を重ねないため、正式な設定判別スコアを比較して代表を選びます。'
   f.update(dependencyGroupId=name,dependencyKind='CAUSAL_PATH_OVERLAP',dependencyReason=reason,dependencyScopeAudit={'status':'KNOWN_DEPENDENCY_DEFERRED_TO_CONTRACT','reason':reason,'evidenceSourceIds':f['sourceIds']})
normal='通常ゲーム数と初当たり回数を記録。AT・ボーナス消化中と明確な引き戻し区間内の連続当選を除き、区間終了後の当選を初当たりに数えます。ゲーム数は共通のゲーム数入力から参照します。'
# 01 吉宗
for n in [1,2,6]:rate(1,n,normal+('天井・レア役等の契機を除いて謎当たりと確認できた当選だけを数えます。' if n==6 else ''))
rate(1,3,'順押し・ハサミ打ちで共通13枚俵を見分けて全件カウントした対象ゲーム数と回数。押し順を守らなかった区間は分けます。',universe='TOTAL_GAME_TRIAL',label='共通13枚俵')
for n in [4,5]:rate(1,n,row(1,n)['condition']+'。対応役と同行人数を成立時に確認した弱レア役回数と、その契機での初当たり回数。前兆中や契機不明の区間を除きます。','percent','YOSHIMUNE_WEAK_ROLE_TRIAL_'+str(n))
rate(1,7,'AT非当選の将軍ボーナス終了後に移行した高確率の全回数と、レア役による書き換えを含む最終AT成功回数。','percent','YOSHIMUNE_SHOGUN_HIGH_TRIAL')
for start,band in [(8,'通常'),(15,'3000G到達後初回'),(22,'5000G到達後初回'),(29,'7000G到達後初回')]:
 f=combine(1,start,list(range(start,start+7)),'当日累計Gと閾値後の回数を確認した'+band+'のAT終了1回につき1画面。履歴が不明なら数値計算に使いません。','AT終了画面（'+band+'）',['デフォルト','偶数示唆','高設定示唆','設定2以上','設定4以上','設定5以上','設定6']);ctx(f,'yoshimune_at_end',start,'AT終了画面',band)
ev(1,36,[(row(1,n)['candidate'].split('：')[-1],row(1,n)['condition'].split('。')[0]) for n in range(36,45)],'エンディング中のPUSHで聞いたボイスを1機会につき1回。',label='エンディングPUSHボイス')
for n in range(37,45):ROUTE[1][n]=ROUTE[1][36]
block(1,45,'天井や設定変更の恩恵による当選は謎当たりと区別するための条件情報です。独立した設定別確率が確認できません。');block(1,46,'2人同行時の対応弱役抽選は設定差がないため、推測計算に使用しません。');group(1,[1,2,4,5,6,7],'yoshimune_hit_path')
# 02 天膳
for n in [1,2]:rate(2,n,normal)
rate(2,3,'弱チェリーを全件数えた総ゲーム数と成立回数。実機連動機能を使う場合も集計範囲を揃えます。',universe='TOTAL_GAME_TRIAL')
cat(2,4,['赤頭','紫頭'],{k:list(v.values()) for k,v in raw(2,4).items()},'BC確定時の赤頭・紫頭を1種類だけ記録。赤赤赤・赤赤紫を赤頭に分類し、紫紫紫・紫紫赤を紫頭に分類します。')
for st,tab in [(5,'異色BC'),(11,'同色BC')]:
 f=combine(2,st,list(range(st,st+6)),'通常時の'+tab+'入賞時LEDを確認し、最終的にBT非当選だった機会だけを1色記録。BT当選分を混ぜません。','BC入賞LED（'+tab+'）',['デフォルト','デフォルト','デフォルト','デフォルト','設定4以上','デフォルト']);ctx(f,'tenzen_led',st,'BC入賞時LED',tab)
ev(2,17,[('222人','設定2以上'),('246人','設定2・4・6'),('333人','設定3以上'),('444人','設定4以上'),('456人','設定4以上'),('555人','設定5以上'),('1001人','設定5以上'),('666人','設定6')],'弦之介BCの撃破人数表示を記録。',label='弦之介BC撃破人数')
for n in range(18,25):ROUTE[2][n]=ROUTE[2][17]
ev(2,25,[('甲賀キャラ集合','奇数示唆・前作参照'),('伊賀キャラ集合','偶数示唆・前作参照'),('女性キャラ集合','設定4以上'),('弦之介＆朧','設定5以上'),('弦之介＆朧＋鼻歌','設定6')],'争忍開始時の画面。PBCの1セット目の弦之介＆朧は除きます。',label='争忍の刻開始画面')
for n in range(26,30):ROUTE[2][n]=ROUTE[2][25]
ev(2,30,[(l,'対応設定未確認・記録のみ') for l in ['銅','銀','金','花火柄','虹']],'BT終了時のユニバプレート。色の対応設定は予想にとどまるため設定候補を絞りません。',label='ユニバプレート')
for n in range(31,35):ROUTE[2][n]=ROUTE[2][30]
for n in range(35,42):block(2,n,'モード・内部状態や継続の示唆を含む参考情報で、対象機種の全設定に対応する設定別確率が確認できません。内部状態を表示演出から決め打ちしません。')
group(2,[1,2],'tenzen_hit_path')
# 03 慶次
for n in [1,2]:rate(3,n,normal)
for n in range(3,17):block(3,n,'抽選時の通常・高確・超高確や移行先を全件特定できません。示唆ステージを確定状態として数えず、通常時全体へ条件別確率を流用しません。')
ev(3,17,[('赤背景','高設定示唆')],'御免チャレンジ背景を記録。',label='御免チャレンジ背景');ev(3,18,[('月見酒経由のAT直撃','高設定示唆')],'他契機と区別できた月見酒経由のAT直撃。出現率不明のため記録のみ。')
for start,end,title in [(19,27,'AT終了画面'),(28,33,'特殊獲得枚数'),(34,35,'左下の利沙ボイス'),(36,53,'おみくじ'),(54,56,'特殊おみくじ')]:
 pairs=[]
 for n in range(start,end+1):
  m=raw(3,n);m=m.replace('設定4以上+設定6示唆','設定4以上').replace('設定2以上+高設定','設定2以上');m=m.replace('+高設定','・高設定示唆').replace('奇数弱','奇数示唆（弱）').replace('偶数弱','偶数示唆（弱）').replace('奇数中','奇数示唆（中）').replace('奇数+','奇数示唆・').replace('偶数+','偶数示唆・').replace('高設定強','高設定示唆（強）');pairs.append((row(3,n)['candidate'].split('：')[-1],m))
 ev(3,start,pairs,title+'の1回の表示を1項目記録。同名キャラは背景・種類も区別します。',title)
 for n in range(start+1,end+1):ROUTE[3][n]=ROUTE[3][start]
for n in [57,58,59]:block(3,n,'次回モード・設定変更の条件または全設定共通の確率で、独立した設定差の数値として使用しません。')
group(3,[1,2],'keiji_hit_path')
# 04 マジハロ
for n in [1,2,3,4,7,8]:rate(4,n,'対象ボーナス・重複契機を確認して数えた総ゲーム数と当選回数。合算や他の内訳に同じ当選を重ねません。',universe='TOTAL_GAME_TRIAL')
block(4,5,'赤BIG・白BIGの確率は全設定共通のため、設定判別の数値には使用しません。');rate(4,6,normal)
rate(4,9,'リプレイ成立全回数と、リプレイ重複ボーナスと確認できた当選回数。告知までに複数契機が重なる区間は数値計算へ混ぜません。','percent','MH8_REPLAY_TRIAL')
rate(4,10,'実機の遊技情報で集計された共通コイン回数と、それに対応する総ゲーム数。ART中の目視はナビなしコインが対象。目視だけで全区間を数えられない場合は実機連動機能を使用します。',universe='TOTAL_GAME_TRIAL')
block(4,11,'50枚あたりゲーム数は複数の小役や遊技経路を含む平均値で、共通コインの成立率と重ねて推測計算に使用しません。')
cat(4,12,['25体','50体','75体','100体'],{k:list(v.values()) for k,v in raw(4,12).items()},'通常時の殲滅ボーナスを最初から最後まで観測し、告知された規定撃破数を1つ記録。途中からの推測で補いません。')
block(4,13,'低確・通常かつスイカ以外のBIGという内部状態条件を全件確定できません。全BIGへ同じ当選率を適用しません。')
rate(4,14,'通常時ボーナス全回数と、そこからどこまじに当選した回数。1ボーナスを1機会とし、ループの告知を別の初回当選へ加えません。','percent','MH8_NORMAL_BONUS_TRIAL')
rate(4,15,'通常時ボーナスを観測した対象ゲーム数と、どこまじ初回当選回数。ボーナス機会で計算するどこまじ当選率とは重ねません。',universe='NORMAL_GAME_TRIAL')
for n in [16,17,18]:block(4,n,'内部ループ率や通常モードを全件識別できません。実際の継続回数や早い当選から抽選時の内部モードを逆算しません。')
block(4,19,'設定1と6の概数だけで中間設定の出現率が揃いません。通常時RT経由とART連中を混ぜず、不足設定を補間しません。')
ev(4,20,[(str(v)+'枚','設定'+str(int(str(v)[0]))+('以上' if str(v)[0]!='6' else '')) for v in [222,444,666,2222,4444,6666]],'特殊な獲得枚数表示を記録。')
ev(4,21,[('確定画面のみ','高設定示唆'),('終了画面のみ','設定2以上'),('確定・終了の両方','設定5以上')],'同じボーナスの確定・終了画面のアリスインワンダーランドを組み合わせて1回記録。')
ev(4,22,[(l,'設定'+str(v)+('以上' if v<6 else '')) for l,v in [('銅',2),('銀',3),('金',4),('クローバー柄',5),('虹',6)]],'アリストロフィーの出現だけを設定制約に使用。出現しなかった回数は計算しません。')
ev(4,23,list(raw(4,23).items()),'ART終了画面の人数。動物を人数に含めません。');block(4,24,'設定変更・有利区間の条件は記録として保持しますが、全設定の出現率が未確認のため設定差の数値には使用しません。');group(4,[1,2,3,4,6,7,8,9,14,15],'mh8_bonus_art_path')
# 05 モンキー
rate(5,1,normal)
block(5,2,'この機種の5枚役について、添付された設定別数値を参照先で裏付けられません。根拠未確認の成立率を推測計算へ入れません。')
for n in [3,4,5]:rate(5,n,'通常時の'+row(5,n)['candidate'].split('：')[-1]+'成立回数と、優出モードを経由しないAT直撃回数。契機が不明な当選は混ぜません。','percent','MONKEY_DIRECT_ROLE_TRIAL_'+str(n))
for n in [6,7,8,9]:rate(5,n,'激走チャージ中の'+row(5,n)['candidate'].replace('EX獲得 ','')+'成立回数とEXアイテム当選回数。同じ成立を一度だけ数えます。','percent','MONKEY_EX_ROLE_TRIAL_'+str(n))
for n,role in [(6,'ボート・弱チェリー'),(7,'弱チャンス目'),(8,'強チャンス目')]:
 f=next(f for f in D[5]['findings'] if f['findingId']==key(5,n));f['inputPresentation']={'trialLabel':role+'成立回数','successLabel':'EX獲得'};f['details']=['激走チャージ中に成立した'+role+'を対象とします。その役からEXアイテムに当選した分を記録し、同じ成立は一度だけ数えます。']
rate(5,10,'AT終了または設定変更を確認した全機会と、即優出・通常画面復帰直後のAT前兆発生回数。条件が分からない開始は数値計算しません。','percent','MONKEY_AT_END_OR_RESET_TRIAL')
for n in range(11,15):block(5,n,'内部ライバルモードへの突入全件を特定できません。ヘルメットの示唆や一部の確定表示だけを全突入の代わりにしません。')
combine(5,15,[15,16],'激走チャージ終了タッチで波多野の青ランプ2セリフのどちらかだった回だけ1種類記録。榎木ボイスを母数に混ぜません。','激走チャージ終了時の波多野ボイス')
# Named special tickets are an exhaustive partition with explicit remaining ordinary tickets.
cat(5,17,['通常舟券','ホロ銀','ホロ金','虹'],[[100,0,0,0],[99.5,.5,0,0],[99.2,.6,.2,0],[99.5,0,.5,0],[99,.6,.3,.1]],'通常時の50・150・250G等の舟券表示機会を全件記録。舟券を見なかった機会は未観測とします。',['デフォルト','設定2・4・6','設定4以上','設定6'],label='通常時の舟券')
for n in [18,19]:ROUTE[5][n]=ROUTE[5][17]
for n in [20,21,22]:block(5,n,'継続ストックの有無を全件特定できず、ストック別の公表出現率を使い分けられません。青島SPフリーズ後も同じ母集団には含めません。')
ev(5,'round-E',[('ドレス','高設定示唆'),('波多野＆青島（青島SPフリーズ後を除く）','設定5以上')],'ラウンド開始画面。ストックが不明な場合は確定条件だけ反映します。','ATラウンド開始画面')
for n in [23,24,25]:
 scope='AT中に'+row(5,n)['candidate'].replace('獲得','')+'へ到達した全回数と、対応する特殊枚数表示が出た回数。到達していないATを非出現へ数えません。'
 v=raw(5,n);yes=[float(str(v[k]).rstrip('%')) for k in settings(5)];minimum={23:4,24:6,25:5}[n]
 cat(5,n,['特殊表示なし',row(5,n)['candidate']],[ [100-p,p] for p in yes],scope,['デフォルト','設定'+str(minimum)+('以上' if minimum<6 else '')])
# User choice: retain published rates as reference, use payout displays only as exact constraints.
for n in [23,24,25]:
 f=next(f for f in D[5]['findings'] if f['findingId']==key(5,n));f['observationType']='reference_distribution';f['details']=['特殊獲得枚数は、表示されたときの設定確定条件だけを使用します。入力負担を減らすため、出現頻度による判別は使用しません。'];f['userDecision']={'authority':'USER_EXPLICIT_INSTRUCTION','policy':'EXACT_CONSTRAINT_ONLY','requestedAt':'2026-10-18'}
 mirror=f.pop('mirrorsEvidenceFindingId');f.pop('categoricalEvidenceReconciliation',None);D[5]['findings']=[e for e in D[5]['findings'] if e['findingId']!=mirror]
payout=ev(5,'payout-E',[('456枚表示','設定4以上'),('666枚表示','設定6'),('803枚表示','設定5以上')],'特殊な獲得枚数が表示されたときだけ記録します。表示されなかった回数や到達回数の入力は不要です。設定確定条件だけを反映し、出現頻度による重み付けは行いません。','特殊獲得枚数')
payout['details']=payout['details'][:1]
for c,n,amount in zip(payout['semanticCategories'],[23,24,25],[456,666,803]):c['recordInputId']=key(5,n)+'.categoryCounts.2_獲得'+str(amount)+'枚'
for n in [26,27,28,29,30]:block(5,n,'公表値は各種条件を考慮した平均値で、黒メダル直後の次回表示では分布が変わります。平均値をすべての終了画面へ一律適用しません。')
ev(5,'trophy-E',[(l,'設定'+str(v)+('以上' if v<6 else '')) for l,v in [('銅',2),('金',4),('ケロット柄',5),('虹',6)]],'トロフィーの出現は設定制約。非出現に平均出現率を適用しません。','ケロットトロフィー')
cat(5,31,['青メダル','黄メダル','銅トロフィー','金トロフィー','ケロット柄','虹トロフィー'],[[50,50,0,0,0,0],[45,30,25,0,0,0],[37.5,37.5,12.5,12.5,0,0],[25,50,10,11.25,3.75,0],[37.5,37.5,10,11,3,1]],'黒メダル出現後の次回表示1回のみ。黒メダル以前や2回目以降は混ぜず、終了履歴不明なら数値計算しません。',['デフォルト','デフォルト','設定2以上','設定4以上','設定5以上','設定6'],label='黒メダル後の次回メダル・トロフィー')
cat(5,32,['青メダル','黄メダル'],[[50,50],[60,40],[50,50],[25,75],[45.5,54.5]],'青・黄のSGメダルが出た回だけ1色入力。黒メダル直後の次回表示は別分布なので除きます。')
cat(5,33,['波多野・青','青島・青','波多野・黄','ありさ・緑','榎木・赤','榎木・紫','青島・紫','澄・紫'],[[50,35,12,3,0,0,0,0],[37.5,45,12,3,2.5,0,0,0],[30,42.5,15,7.5,2.5,2.5,0,0],[50,15,20,10,0,2.5,2.5,0],[30,35,20,10,1.25,1.25,1.25,1.25]],'エンディング中レア役の押し順ナビに従い、タッチで得たボイスとランプを1組1回記録。',['デフォルト','偶数示唆','高設定示唆（弱）','高設定示唆（強）','設定2・4・6','設定4以上','設定5以上','設定6'],label='エンディング中ボイス')
cat(5,34,['波多野ボイス','榎木・おつかれ','榎木・これが艇王'],[[100,0,0],[99.25,.75,0],[99,.75,.25],[99.5,0,.5],[99,.75,.25]],'激走チャージ終了時タッチを全件記録。通常波多野2ボイスは一つにまとめ、榎木ボイスと分類します。',['デフォルト','設定2・4・6','設定4以上'],label='激走チャージ終了時の榎木ボイス')
for n in [35,36,37]:block(5,n,'次回モード・ライバルやCZに関する参考情報で、対象条件の全設定別確率が確認できません。示唆回数を内部移行率に置き換えません。')
group(5,[1,3,4,5,10],'monkey_hit_path');
for n,u in [(31,'MONKEY_POST_BLACK_DISPLAY_TRIAL'),(32,'MONKEY_NORMAL_BLUE_YELLOW_TRIAL')]:
 f=next(f for f in D[5]['findings'] if f['findingId']==key(5,n));f['trialUniverse']=u;f['dependencyReview']={'status':'CONDITIONALLY_SEPARATE','reason':'黒メダル直後1回と、それ以外の青黄メダルを条件ごとに独立した分布で評価します。'};f['conditionalStateModel']={'requiresPreviousBlackFlag':True,'condition':'POST_BLACK_NEXT_ONLY' if n==31 else 'NOT_POST_BLACK_BLUE_YELLOW_ONLY','unknownHistory':'NUMERIC_DISABLED_EXACT_RETAINED'}

# 06 リンかけ
for n in [1,2,5]:rate(6,n,normal)
cat(6,3,['同色BIG以上','竜児ボーナス'],[[raw(6,3)[k],raw(6,4)[k]] for k in settings(6)],'通常時ボーナス当選1回につき種類を1つ記録。ST中の当選は含めません。');ROUTE[6][4]=ROUTE[6][3]
for n in [6,7]:block(6,n,'CZ中の非レア役による内部当選と最終成功、失敗後の内部引き戻しと新規当選を、観測結果だけで全件分離できません。最終的な成功・早い再突入へ公表抽選率を流用しません。')
for n in range(8,17):block(6,n,'リーチ目高確・通常状態や移行先を全件特定できません。示唆ステージを内部状態そのものとして数えません。')
for n in [17,18]:block(6,n,'早期当選で打ち切られるため、選択された666G天井を毎回観測できません。666Gでの実当選を天井選択の全件集計には代用しません。')
combine(6,19,[19,20],'ST開始時に最初に登場した敵だけを1種類記録。途中の入れ替わりを別の試行に数えません。','ST開始時の敵キャラ')
cat(6,21,['いくっちゃよ','ほめてやるっちゃ','負けるな！','おまえがチャンピオンだっちゃ！'],list(zip(*raw(6,21).values())),'ボーナス確定画面の指定押し順で左に黒チェリーを狙い、示唆ボイスが出た回のみ1種類記録。青チェリー時と分けます。',['デフォルト','偶数示唆','設定2以上','設定4以上'])
cat(6,22,['よし、いくぞ！','全てをリングにかけるだけ','ここまで来たよ…姉ちゃん！'],list(zip(*raw(6,22).values())),'ボーナス確定画面の指定押し順で左に青チェリーを狙い、示唆ボイスが出た回のみ1種類記録。黒チェリー時と分け、公表値の丸め100.1%は既存計算器の正規化を適用します。',['デフォルト','設定5以上','設定6'])
ev(6,23,[('通常楽曲','デフォルト'),('世界をその手の中へ','設定2以上'),('明日への闘志～菊Ver～','設定4以上')],'ST中BIG開始時の楽曲。クイズ正解後の楽曲変化とは区別します。')
cat(6,24,['明日への闘志～菊Ver～','世界をその手の中へ','Shining like gold'],[[80,20,0],[80,20,0],[80,20,0],[66.965,33,.035],[66.965,33,.035],[66.965,33,.035]],'開始曲がデフォルトの同色BIGでクイズ4問正解した全機会のみ。正解後の曲を1つ記録。開始時に特殊曲だった分は混ぜません。',['デフォルト','高設定示唆','設定4以上'],label='同色BIGクイズ4問正解後の楽曲（開始曲通常）')
# Non-default starting tracks imply impossible conditioning strata at lower settings.
block(6,28,'黒出現後は設定1で観測条件自体が成立せず、全設定共通の条件付き確率表にはできません。元の条件別分布を保持し、次回画面の確定条件だけ使用します。')
for n in [25,26,27,29]:
 v=raw(6,n);pairs=[]
 for l,m in v.items():
  if n==27 and l=='黒':m='設定2以上'
  if n==25:l=l+'枚'
  if n==29 and '/' in l:
   for ll in l.split('/'):pairs.append((ll,m if m.startswith('設定') else ('設定'+m if re.match('[1-6]',m) else m)))
  else:pairs.append((l,m if m.startswith('設定') or not re.match('[1-6]',m) else '設定'+m))
 ev(6,n,pairs,'該当する'+row(6,n)['candidate']+'を1機会につき1回記録。ST終了画面は復活を除き、黒出現後の次回を区別します。')
for n in [30,31,32]:block(6,n,'設定変更・CZモード等の条件情報、または全設定の数値未確認の要素です。内部状態や未確認値を補わず保持します。')
group(6,[1,2,3,5],'ring_hit_path')
# 07 ケンガン
for n in [1,2]:rate(7,n,normal)
block(7,3,'CZ成功率の設定別数値は限定した資料でのみ確認され、主要解析資料の対応する抽選条件・数値の裏付けを確認できません。既存初当たり率と重ねず参考値として保持します。');block(7,4,'小役確率は全設定共通のため、設定推測には使用しません。')
for st,en,title in [(5,11,'AT終了画面'),(12,17,'二虎流奥義伝授 極の鉄扉'),(18,24,'エンディング中ボイス・ランプ')]:
 pairs=[]
 for n in range(st,en+1):
  v=raw(7,n)
  if n==18:continue # intake accidentally copied a non-voice venue image
  lab=row(7,n)['candidate'].split('：')[-1]
  if st==18:lab += {'山下':'・白','王馬':'・青','前借り王馬':'・黄','秋山':'・緑','鞘香':'・赤','迦楼羅':'・紫'}[lab]
  pairs.append((lab,v['hint']))
 f=ev(7,st,pairs,title+'で確認した結果を1機会1回。ボイスとランプを別々に数えません。',title)
 for n in range(st+1,en+1):ROUTE[7][n]=ROUTE[7][st]
for n in [25,26,27,28,29]:block(7,n,'天井・内部状態等の参考情報または全設定の発生率未確認の要素です。設定差のない示唆や未確認の設定別確率を推測計算に使用しません。')
group(7,[1,2],'kengan_hit_path')
# 08 まどかf
rate(8,1,normal);rate(8,2,'弱チェリーを全件カウントした総ゲーム数と成立回数。数えなかった区間は母数へ足しません。',universe='TOTAL_GAME_TRIAL')
for n in [4,5,6,7]:rate(8,n,'通常時・まどかチャンス中かつソウルジェム非点灯時のSG目成立回数と、対象色が点灯した回数。総ゲーム数を母数にせず、点灯中のSG目は除きます。同時点灯を排他カテゴリとみなしません。','percent','MADOKA_UNLIT_SG_SYMBOL_TRIAL')
for n in [8,9,10]:rate(8,n,'前兆中を除く通常時の対象役成立回数と、その役を契機にまどかチャンスへ入った回数。弱SG役の種類まで確認できた区間のみ。','percent','MADOKA_CHANCE_ROLE_TRIAL_'+str(n))
rate(8,11,'まどかチャンス3G目に小役非入賞でプチボーナスへ当選した機会と、BIGへ昇格した回数。その他の当選を混ぜません。','percent','MADOKA_PETIT_UPGRADE_TRIAL')
cat(8,12,['プチ','BIG','エピソード','非当選'],[[raw(8,12)[k],raw(8,13)[k],raw(8,14)[k],100-raw(8,15)[k]] for k in settings(8)],'マギカポイント3pt到達時の抽選結果を1種類記録。合算当選率を重ねません。',label='マギカポイント3pt到達時の結果')
for n in [13,14,15]:ROUTE[8][n]=ROUTE[8][12]
for n in range(16,27):block(8,n,'BIG規定ゲーム数やCZ基礎継続率の内部選択を全件観測できません。実際の当選Gや勝敗から選択結果を逆算しません。')
f=combine(8,27,list(range(27,32)),'BIG・プチ・エピソード終了後にタッチして聞いたボイスを1種類記録。タッチしなかった分は未観測です。','ボーナス終了時のタッチボイス',['奇数示唆','偶数示唆','高設定示唆（弱）','高設定示唆（強）','設定6'])
for n in [32,33]:block(8,n,'復活した機会だけに適用する確率か、全CZ終了に対する確率かを添付資料と参照本文だけでは特定できません。条件を混ぜた数値計算は行わず、画面による設定否定だけを反映します。')
ev(8,'cz-E',[('舞台装置の魔女','デフォルト'),('ほむら3人','設定1・3否定'),('後ろ姿のキュゥべえ','設定2否定')],'ワルプルギスの夜終了画面。特殊画面は復活を伴います。','ワルプルギスの夜終了画面')
means=['設定2以上','設定5以上','設定6','設定6','設定2・4・5・6','設定2・3・5・6','設定2・3・4・6','設定3・5・6','設定3・4・6','設定4以上']
ev(8,34,[(row(8,n)['candidate'].removeprefix('プチボーナスキャラ・'),m) for n,m in zip(range(34,44),means)]+[('さやか→杏子','設定3以上'),('マミ→杏子','設定3以上')],'プチボーナス1回の紹介キャラ・順番・2人目の有無を組合せとして記録。単なるマミ登場をマミのみと扱いません。','プチボーナス中のキャラ紹介')
for n in range(35,44):ROUTE[8][n]=ROUTE[8][34]
for n in range(44,49):rate(8,n,'前兆中を除く通常時の対象役成立回数と、その契機と確認できたボーナス当選回数。ソウルジェム役は対応キャラ・役の種類も確認します。契機不明分は数値計算しません。','percent','MADOKA_BONUS_ROLE_TRIAL_'+str(n))
for n in [49,50]:block(8,n,'CZ基礎継続率の内部値を全件観測できず、敗北後ボイスは次回継続率の示唆です。設定の確定情報や設定別当選率へ変換しません。')
block(8,50,'敗北後タッチボイスは次回CZ継続率の示唆です。設定確定や設定別確率の代わりには使いません。')
group(8,[1,8,9,10,11,12,44,45,46,47,48],'madoka_bonus_path');group(8,[4,5,6,7],'madoka_sg_overlap');block(8,3,'合算値は色別点灯率の和ですが、同時点灯の有無を含む公表合算確率として確認できません。色別の和を発動確率と決め打ちしません。')
# The unverified aggregate is excluded. Use one source-supported color at a time; prioritize the largest observed separation.
for rank,n in enumerate([6,5,4,7],1):next(f for f in D[8]['findings'] if f['findingId']==key(8,n))['dependencyFallbackRank']=rank
# 09 源
for n in [1,2]:rate(9,n,'通常ゲーム数から源ZONE32Gのゲーム数を除いた対象Gと初当たり回数。32G以内の連続当選を初当たりから除き、終了後の当選を初当たりに数えます。')
cat(9,3,['BIG','REG'],{k:list(v.values()) for k,v in raw(9,3).items()},'公表比率に対応するボーナス全件の種類を記録。BIGとREGを別々の独立情報として加算しません。')
block(9,4,'規定スイカ回数への到達前に別契機CZが当選すると選択回数を観測できず、最後まで到達した周期だけでは標本が偏ります。打ち切られた周期を除いて公表選択率を当てはめません。')
for n in range(5,11):block(9,n,'内部状態や移行前後のモードを全件特定できません。示唆ステージや32G内当選だけで通常A/B/C・天国を確定しません。')
block(9,11,'設定変更・FINAL JUDGE後のモード振り分けは全設定共通で、設定判別には使用しません。')
for n in range(12,18):
 pairs=[]
 for l,m in raw(9,n).items():
  if n==17 and l=='その他':m='設定2・4・6示唆など（出現率不明）'
  if not m.startswith('設定') and re.match('[1-6]',m):m='設定'+m
  pairs.append((l,m))
 ev(9,n,pairs,row(9,n)['candidate']+'の表示を記録。出現率不明のため非出現回数には重みを付けません。')
for n in [18,19,20]:block(9,n,'連チャン・次回モードの条件整理または小役の設定別確率未確認の情報です。推測に使う新しい数値は作りません。')
group(9,[1,2,3],'gen_bonus_path')
# 10 初代とある
for n in [1,2]:rate(10,n,normal)
for n in [3,4]:block(10,n,'ガールズコレクション抽選時の通常・高確を全件見抜けません。見た目のステージを確定した内部状態として数えません。')
rate(10,5,'異能キャラなしの通常時に成立した弱チェリー全回数と、その役でCZ当選した回数。前兆中や他契機で当選済みの機会を除きます。','percent','INDEX_NO_CHARACTER_CHERRY_TRIAL')
rate(10,6,'異能キャラなしの通常時ハズレ全回数と、そのハズレ契機と確認できたCZ当選回数。契機が不明な当選を混ぜません。',universe='INDEX_NO_CHARACTER_MISS_TRIAL')
for n in [7,9,11,13]:
 v1=raw(10,n);v2=raw(10,n+1)
 cat(10,n,['BREAK BATTLE','EP・SP','非当選'],[[v1[k],v2[k],100-v1[k]-v2[k]] for k in settings(10)],'対象レア役成立時にゲーム数帯・異能キャラの滞在状態を確認し、'+row(10,n)['candidate']+'に該当する全機会の結果を1つ記録。前兆中や契機不明を混ぜません。',label=row(10,n)['candidate'].replace('→BREAK BATTLE','の当選内訳'))
 ROUTE[10][n+1]=ROUTE[10][n]
rate(10,15,'SPまたはCZ中エピソードBATTLE合算と確認できた対象通常ゲーム数と当選回数。CZ・AT初当たりとは重ねません。',universe='NORMAL_GAME_TRIAL')
rate(10,16,'BREAK BATTLEで余剰ダメージ250以上と確認できた全回数とOVER BREAK発生回数。250未満の機会を母数へ混ぜません。','percent','INDEX_OVERDAMAGE_250_TRIAL')
for st,en,title in [(17,19,'ガールズコレクションのカード'),(20,22,'AT終了画面'),(23,30,'特殊獲得枚数'),(31,35,'藤丸コイン'),(36,40,'エンディング中ボイス・ランプ')]:
 pairs=[]
 for n in range(st,en+1):pairs.append((row(10,n)['candidate'].split('：')[-1],'設定'+'・'.join(map(str,raw(10,n)['allowed_settings']))))
 extras={17:[('インデックス','デフォルト'),('五和','デフォルト'),('レッサー','デフォルト'),('御坂美琴','偶数示唆'),('白井黒子','偶数示唆'),('御坂妹','偶数示唆'),('月詠小萌','高設定示唆（弱）'),('神裂火織','高設定示唆（強）')],20:[('キャラなし','デフォルト'),('インデックス＆上条','偶数示唆'),('打ち止め＆一方通行①','高設定示唆（弱）'),('打ち止め＆一方通行＆番外個体','高設定示唆（強）')],36:[('青（基本）','デフォルト'),('青（高設定弱）','高設定示唆（弱）'),('青（高設定強）','高設定示唆（強）')]}
 ev(10,st,pairs+extras.get(st,[]),title+'で確認した結果を1機会につき1回記録。',title)
 for n in range(st+1,en+1):ROUTE[10][n]=ROUTE[10][st]
for n in range(41,49):ROUTE[10][n]=ROUTE[10][17]
for n in range(49,53):ROUTE[10][n]=ROUTE[10][20]
for n in range(53,56):ROUTE[10][n]=ROUTE[10][36]
# Full source-published conditional coin distributions; no estimated or fabricated outcomes.
coinRows=[
 [[100,0,0,0,0,0],[96,4,0,0,0,0],[94.5,4,1.5,0,0,0],[93.8,4,1.5,.7,0,0],[93.3,4,1.5,.7,.5,0],[93.1,4,1.5,.7,.5,.2]],
 [[100,0,0,0,0,0],[91,9,0,0,0,0],[87,8,5,0,0,0],[85.3,7.2,5.8,1.8,0,0],[84.1,6.6,6.6,1.8,1,0],[83.3,6,7.2,1.8,1,.8]],
 [[100,0,0,0,0,0],[86,14,0,0,0,0],[78,10,12,0,0,0],[70,10,10,10,0,0],[70,6.7,6.7,6.7,10,0],[70,5,5,5,5,10]],
 [[100,0,0,0,0,0],[94,6,0,0,0,0],[91.8,6,2.3,0,0,0],[90.7,6,2.3,1.1,0,0],[90,6,2.3,1.1,.8,0],[89.7,6,2.3,1.1,.8,.3]],
 [[100,0,0,0,0,0],[86.5,13.5,0,0,0,0],[80.5,12,7.5,0,0,0],[77.9,10.8,8.7,2.6,0,0],[76.1,9.9,9.9,2.6,1.5,0],[75,9,10.8,2.6,1.5,1.1]],
 [[100,0,0,0,0,0],[79,21,0,0,0,0],[67,15,18,0,0,0],[55,15,15,15,0,0],[55,10,10,10,15,0],[55,7.5,7.5,7.5,7.5,15]]]
for j,vs in enumerate(coinRows):
 place='扉ゾーン終了' if j<3 else 'フィアンマBATTLE終了';band=['0～4000G','4001～6000G','6001G以上'][j%3]
 f=cat(10,'coin-'+str(j),['出現なし','銅','銀','金','デンジャー柄','虹'],vs,'当日累計ゲーム数を確認できた'+band+'の'+place+'だけを1機会とし、出現なしも記録。履歴不明なら数値計算を停止し、確定色だけ保持します。',['デフォルト','設定2以上','設定3以上','設定4以上','設定5以上','設定6'],label='藤丸コイン（'+place+'・'+band+'）',refs=['https://nana-press.com/kaiseki/machine/608/17570/']);ctx(f,'index_coin',j,'藤丸コイン',place+'・'+band);f['inputPresentation']={'trialLabel':'コイン表示確認回数','successLabel':'コイン出現回数'}
ROUTE[10][56]=('FINDING',key(10,'coin-0'))
# Exact coin-only surface is subsumed into each numeric category input, not a second count.
D[10]['findings']=[f for f in D[10]['findings'] if f['findingId']!=key(10,31)]
for n in range(31,36):ROUTE[10][n]=ROUTE[10][56]
for n in [57,58,59]:block(10,n,'小役の設定別確率や内部モードの全分布が確認できません。天井・引き戻しは初当たりの集計条件として扱い、未確認の数値を推測計算へ入れません。')
group(10,[1,2,5,6,7,9,11,13,15,16],'index_hit_path')
# Discovered image-only numerical surface is retained and closed without inventing OCR values.
D[8]['blockedItems'].append({'blockId':key(8,'petit-rate-image'),'label':'プチボーナス中のキャラ出現率（画像公表表）','sourceIds':[sid(8,'https://nana-press.com/kaiseki/machine/626/17116/')],'reason':'キャラ出現率の数値は画像表で公表されていますが、今回取得した本文では設定別数値と分類条件を確定できません。数値を作らず、確認できたキャラ別の設定確定・否定条件を保持します。','reevaluationCondition':'元の画像表の設定別数値と試行条件を正確に読み取れる資料が得られた場合、この要素だけ再評価します。','retainedSourceImageUrl':'https://image.nana-press.com/kaiseki/machine/626/20240314145147.png','retrievalStatus':'IMAGE_REQUEST_FAILED_AFTER_BOUNDED_ATTEMPTS','closure':'CLOSED_NO_REPEAT_PUBLIC_SEARCH','runtimeUse':'DISABLED'})

# User-reviewed presentation families. Each tab retains its own denominator,
# model, evidence identity and observation condition; no likelihoods are merged.
def presentation_family(i,name,title,members):
 policy=D[i].setdefault('uiPresentation',{'hiddenDerivedFindingIds':[],'sectionOrder':[],'evidenceSectionMerges':[],'tabGroups':[]})
 tabs=[]
 for n,label in members:
  f=next(f for f in D[i]['findings'] if f['findingId']==key(i,n))
  prefix='EVI_' if f['observationType']=='evidence' else 'OBS_'
  tabs.append({'sectionId':prefix+f['findingId'],'label':label})
 policy['tabGroups'].append({'id':'B022_'+name,'title':title,'tabs':tabs})
presentation_family(3,'KEIJI_OMIKUJI','おみくじ',[(36,'通常おみくじ'),(54,'特殊おみくじ')])
presentation_family(5,'MONKEY_EX','激走チャージ中Ex獲得',[(6,'ボート・弱チェリー'),(7,'弱チャンス目'),(8,'強チャンス目')])
presentation_family(5,'MONKEY_MEDAL','SGメダル・トロフィー',[(32,'青・黄メダル（黒直後以外）'),(31,'黒メダル直後の次回'),('trophy-E','トロフィー（確定情報）')])
presentation_family(5,'MONKEY_CHARGE_VOICE','激走チャージ終了時ボイス',[(15,'波多野の青ランプ2セリフ'),(34,'波多野・榎木の分類')])
presentation_family(6,'RING_CONFIRMED_VOICE','ボーナス確定画面のボイス',[(21,'黒チェリー・菊'),(22,'青チェリー・竜児')])
presentation_family(6,'RING_BIG_MUSIC','BIG中の楽曲',[(23,'BIG開始時'),(24,'クイズ4問正解後（開始曲通常）')])
presentation_family(8,'MADOKA_SG','ソウルジェム点灯',[(4,'さやか'),(5,'マミ'),(6,'杏子'),(7,'ほむら')])

# Source-owned preservation and row-to-contract routing.
for i,d in D.items():
 assert set(ROUTE[i])==set(range(1,len(ROWS[i])+1)),(i,set(range(1,len(ROWS[i])+1))-set(ROUTE[i]))
 qs=[d['machineName']+' 既存候補と細分類の対応照合',d['machineName']+' 母数・観測条件・重複の点検',d['machineName']+' 示唆・確定条件と公開値の点検'];d['researchCompleteness']['machineSpecificQueries']=qs;d['researchCompleteness']['queryType']='INTAKE_REVIEW_TOPICS_NOT_NEW_WEB_SEARCH_CLAIMS'
 byid={f.get('findingId',f.get('blockId')):f for f in d['findings']+d['blockedItems']}
 for n,r in enumerate(ROWS[i],1):
  typ,id=ROUTE[i][n];f=byid[id];s=sid(i,r['source_url']);claim=r['candidate']+'：'+str(raw(i,n));D[i]['sources'][int(s[1:])-1]['claims'].append(claim)
  d['researchCompleteness']['candidateLedger'].append({'candidateId':key(i,n),'label':r['candidate'],'sourceClaims':[{'sourceId':s,'claim':claim}],'discoveryQueries':qs,'disposition':{'type':typ,'refId':id},'origin':'HANDOFF_ORIGINAL_ROW','retainedHandoffClaim':r,'repeatSearchRequired':False})
 # Ensure added/mirrored findings and source-specific changed claims are also covered.
 for id,f in byid.items():
  for s in f['sourceIds']:
   claim=f['label']+'：'+(f.get('denominatorSemantics') or f.get('reason') or '／'.join(c['label']+'='+c['meaning'] for c in f.get('semanticCategories',[])))
   D[i]['sources'][int(s[1:])-1]['claims'].append(claim)
   d['researchCompleteness']['candidateLedger'].append({'candidateId':id+'-TRACE-'+s,'label':f['label'],'sourceClaims':[{'sourceId':s,'claim':claim}],'discoveryQueries':qs,'disposition':{'type':'BLOCKED' if 'blockId' in f else 'FINDING','refId':id},'origin':'SOURCE_TRACE_MIRROR' if id.endswith('-E') else 'SOURCE_TRACE','repeatSearchRequired':False})
 for dom in DOMAINS:
  # Refer to concrete inventory sections; preserve the original six-domain coverage separately.
  targets={'INITIAL_HIT':'初当り・合算と内訳','BONUS':'ボーナス・終了時の観測','SMALL_ROLE':'小役単体成立率','CZ':'CZ突入・成功・失敗後の機会','AT':'AT初当り・終了時','INTERNAL_CONDITIONAL_DRAW':'内部状態が判別可能か','MODE_TRANSITION':'モード選択と実当選の区別','STATE_TRANSITION':'状態の移行と示唆表示の区別','SUCCESS_RATE':'最終成功と内部当選の区別','POINTS_GAME_DISTRIBUTION':'ポイント・規定回数の観測可否','CARRY_OVER':'持越し・途中着席','THRESHOLD_BEHAVIOR':'天井選択と打ち切り','RESET_BEHAVIOR':'変更時の識別','POST_EVENT_TRANSITION':'終了後の引き戻しと初当り','NAVIGATION':'ボイス・ランプと押し順条件','ROLE_CONDITIONAL_DISTRIBUTION':'成立役ごとの当選母数','BONUS_TYPE_CONDITIONAL':'種類と合算の依存','EVIDENCE':'画面・演出の全記載カテゴリ','EXTERNAL_DATA_ONLY':'実機連動情報と対象集計範囲','MACHINE_SPECIFIC':'当該機種固有条件'}
  labels='、'.join(f['label'] for f in (d['findings']+d['blockedItems'])[:5])
  d['researchCompleteness']['domains'].append({'domain':dom,'status':'CHECKED','sourceIds':[s['sourceId'] for s in d['sources']],'note':d['machineName']+'の'+targets[dom]+'を元の6領域coverageと候補別条件で照合。候補例：'+labels+'。追加の独立数値を全領域で発見したとの意味ではなく、各候補の未公表・除外理由を保持。','reviewScope':'INHERITED_SIX_DOMAIN_COVERAGE_AND_CANDIDATE_INTAKE','nextWorkDisposition':{'owner':'RESEARCH','repeatPublicSearch':False,'reopenPolicy':'NEW_CONCRETE_SOURCE_ONLY'}})
 d['researchCompleteness']['candidateCount']=len(d['researchCompleteness']['candidateLedger']);d['researchCompleteness']['originalCandidateCount']=len(ROWS[i])
 d['productObservationPolicy']={'authority':'USER_EXPLICIT_INSTRUCTION','countingRule':'AT_AFTER_CLEAR_RETURN_ZONE_INITIAL','publishedDenominatorEquivalence':'NOT_ASSERTED','artifact':'production/batches/'+B+'/scope-authorization.json'}
 for f in d['findings']:
  if f.get('settingDistribution'):
   f['benchmarkExposureReview']={'hierarchyAttempted':['DIRECT_PUBLISHED','DERIVED_EXACT','DERIVED_APPROXIMATED','DERIVED_BOUNDED'],'result':'EXACT_7000_ELIGIBLE_GAMES' if f['trialUniverse'] in ['TOTAL_GAME_TRIAL','NORMAL_GAME_TRIAL'] else 'PER_ELIGIBLE_TRIAL_ONLY','reason':'イベント機会を7000Gに恣意換算しない。既存評価器と既存閾値を使用する。'}
  if f.get('trialUniverse')=='NORMAL_GAME_TRIAL':f['operationalCounting']={'authority':'USER_EXPLICIT_INSTRUCTION','policyArtifact':d['productObservationPolicy']['artifact'],'publishedDenominatorEquivalence':'NOT_ASSERTED','unknownScope':'UNOBSERVED_NOT_ZERO'}
 (O/(d['machineId']+'.json')).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
(I/'intake-summary.json').write_text(json.dumps({'batchId':B,'originalRows':sum(map(len,ROWS.values())),'machines':[{ 'machineId':d['machineId'],'originalRows':len(ROWS[i]),'findings':len(d['findings']),'closedBlocks':len(d['blockedItems'])} for i,d in D.items()],'independentExternalAudit':'NOT_PERFORMED','sourceBaselinePreserved':True},ensure_ascii=False,indent=2)+'\n')
print('curated',sum(map(len,ROWS.values())),'immutable handoff rows')
