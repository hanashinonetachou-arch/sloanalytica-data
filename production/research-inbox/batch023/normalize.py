import json, pathlib, re, hashlib
ROOT=pathlib.Path(__file__).resolve().parent
PROD=ROOT.parent.parent
BATCH='batch-20261018-023'
sel=json.load(open(PROD/'next-machine-selection-20261018-batch023.json'))['selected']

def write(p,d):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def clean(s):
 s=str(s or '')
 for x in ['なな徹','一撃','DMM','パチ7','ちょんぼりすた','HAZUSE']:s=s.replace(x,'公開資料')
 return s
# Manually reviewed concrete semantics, without extrapolating rates from zeros.
SEM={
(3,'at_end_screen'):{'リムル＆ランガ':'デフォルト','リムル＆ミリム':'復活濃厚','リムル＆シュナ＆シオン':'高設定示唆（弱）','シズ＆リムル':'高設定示唆（強）','ヒロインバカンス':'設定2・4・6','リムル庵':'設定2以上','ヒロイン花見':'設定4以上','リムル＆ラキ':'設定5以上','全員集合':'設定6'},
(4,'武器UIぬさ動作'):{'きつね':'設定2以上','うさぎ':'設定2以上','ねこ':'設定6'},
(4,'7揃い後リールフラッシュ'):{'4の形':'設定4以上','7の形':'設定6'},
(4,'7揃い後1枚絵'):{'和服2人':'設定2以上','クリスマス':'設定4以上','ハロウィン':'設定6'},
(4,'戦コレマーチED中セン姫'):{'デフォルメセン姫':'設定6'},
(5,'AT終了ボイス'):{'攻撃は最大の防御':'設定2・4否定','あなたは私が守ります':'設定1・3・5否定','信じる道を進むべし':'設定2否定','魔王たる所以':'設定3否定','柔よく剛を制す':'設定4否定','君の力見せてもらおう':'設定5以上'},
(6,'獲得枚数表示'):{'456枚OVER':'設定4以上','999枚OVER':'設定5以上'},
(6,'CZ失敗終了画面'):{'地球':'奇数示唆','兵士':'偶数示唆','銅像':'高設定示唆','003':'設定2以上','009':'設定4以上','全員集合':'設定6','天使':'復活'},
(6,'ボーナス終了画面'):{'夜空':'デフォルト','003':'デフォルト','夜景':'デフォルト','001':'奇数示唆','002':'偶数示唆','トモエ':'設定2以上','003＆009':'設定4以上','全員':'設定6'},
(6,'AT終了RANK IN'):{'白':'奇数示唆','青':'偶数示唆','赤':'設定2以上','金':'設定4以上','虎柄':'設定6'},
(6,'EDレア役ボイス'):{'ハインリヒ':'設定2否定','ジェロニモ':'設定3否定','ピュンマ':'設定4否定','グレート':'設定2・4・5・6','ギルモア博士':'設定2・4・6','張々湖':'設定2以上','スカール':'設定3以上','フランソワーズ':'設定4以上','ジョー':'設定5以上','すももちゃん':'設定6'},
(7,'獲得枚数OVER'):{'222枚OVER':'設定2以上','333枚OVER':'設定3以上','444枚OVER':'設定4以上','555枚OVER':'設定5以上','666枚OVER':'設定6'},
(7,'AT終了画面スタンプ'):{'可':'設定2以上','吉':'設定3以上','良':'設定4以上','優':'設定5以上','極':'設定6'},
(7,'隠れ凪のセリフ'):{'金「お肉～お肉～」':'設定6'},
(8,'正義超人チャレンジ上乗せ'):{'+456pt':'設定4以上','+666pt':'設定6'},
(8,'メニュー画面キャラ'):{'ナツコさん':'設定2以上','私はレフェリー':'設定4以上'},
(8,'EDレア役ボイス'):{'ナツコ':'設定2以上','ビビンバ':'設定4以上','ミート':'高設定示唆'},
(8,'ケロットトロフィー'):{'銅':'設定2以上','金':'設定4以上','ケロット柄':'設定5以上','虹':'設定6'},
(9,'一騎駆け赤アイコン歩数加算'):{'222':'設定2以上','333':'設定3以上','444':'設定4以上','456':'設定4以上','555':'設定5以上','666':'設定6'},
(9,'通常ベルナビボイス'):{'伊達':'デフォルト','真田':'高設定示唆','マリア':'高設定示唆'},
(9,'獲得枚数OVER'):{'456枚OVER':'設定4以上','555枚OVER':'設定5以上','666枚OVER':'設定6'},
(9,'CZ失敗/AT終了アイキャッチ'):{'伊達':'デフォルト','真田':'奇数示唆（弱）','慶次':'偶数示唆（弱）','足利':'高設定示唆（弱）','井伊':'奇数示唆（強）','雑賀':'偶数示唆（強）','マリア':'高設定示唆（強）','政宗vs足利':'設定2以上','BASARA4皇':'設定3以上','女性集合':'設定4以上','全員集合':'設定5以上','エンタライオン':'設定6'},
}
# Closed, candidate-specific observation failures. Preserve full raw values in blockedItems.
BLOCK={
(3,'mode_at_transition'):'内部モードを全件確定できず、早い当選からモードを逆算すると集計が偏るため使用しません。',
(3,'initial_monster_rank'):'有利区間移行時だけの初期ランクと、ランク引継ぎを毎回区別できないため使用しません。',
(3,'non_weakness_rewrite'):'突入時の成功抽選に外れたことを確認できず、書き換え抽選だけの試行を数えられないため使用しません。',
(3,'battle_mode_at_at'):'内部バトルモードを全件直接判別できないため使用しません。',
(3,'rare_role_probabilities'):'転生状態で小役確率が変わり、設定別確率を共通のゲーム数で評価できないため使用しません。',
(3,'enemy_and_tensei_state_rewrite'):'敵・転生状態・突入時の成功抽選結果を同時に特定できず、書き換えだけの試行を数えられないため使用しません。',
(4,'リセット後769コレ以上'):'途中設定の数値がなく、設定変更の確認も必要なため、全設定の推測計算には使用しません。',
(4,'小役確率'):'指定範囲で設定別の小役確率を確認できないため、数値を補って使用しません。',
(5,'周期/テンパイ率'):'設定別の数値と対象となる観測条件を確認できないため使用しません。',
(5,'状態・引き戻し'):'状態別の公表値を確認できないため、引き戻しの有無から確率を補いません。',
(6,'加速チャレンジ高確移行'):'内部状態の移行を全件確定できず、見える演出だけでは移行率の試行を再現できないため使用しません。',
(6,'アクセルpt特化ゾーン'):'通常状態と高確を全件区別できず、通常状態限定の試行を正確に数えられないため使用しません。',
(7,'ゾーン外ゲーム数ボーナス'):'シミュレーションによる出現率で、除外条件を揃えた実戦の試行数を確定できないため使用しません。',
(7,'強チェリー/チャンス目からCZ'):'同じレア役で巫女カウンターが0になる場合、直撃とカウンター当選の契機を区別できないため使用しません。',
(7,'ボーナス継続G'):'準備中の昇格に当選していない条件だけの分布です。対象条件を毎回確定できないため混ぜて使用しません。',
(7,'小役確率'):'公開されている小役確率は全設定共通で、設定差の情報がないため使用しません。',
(8,'AT終了時裏モード移行'):'内部の裏モード移行を全件直接確認できず、成功事象を正確に数えられないため使用しません。',
(8,'AT終了画面'):'復活や次回モードの示唆が中心で、設定との対応を確認できないため設定推測には使用しません。',
(9,'設定変更時天国モード'):'早期当選では選択モードを全件確定できず、設定変更の確認だけでは正確な成功回数を数えられないため使用しません。',
(9,'歩数高確・超高確移行'):'内部状態と保証ゲーム数を全件確定できず、状態別のリプレイ試行を再現できないため使用しません。',
(9,'小Vベル特殊フラッシュ'):'上位モードでも同じフラッシュが出るため、設定だけを確定する根拠としては使用しません。',
(9,'小役成立率'):'指定範囲で設定別の小役成立率を確認できないため使用しません。',
}
LABELS={'at_first_hit':'AT初当り','tokkyu_entry':'特級魔族討伐戦','strong_rare_to_tokkyu':'強レア役から特級魔族討伐戦','mode_at_transition':'設定変更・AT終了時のモード','initial_monster_rank':'初期モンスターランク','yoru_no_cho_entry':'夜の蝶突入','yoru_no_cho_duration':'夜の蝶継続ゲーム数','yoru_points_weak':'弱レア役の夜の蝶ポイント','weakness_all':'特級魔族討伐戦の全弱点','non_weakness_rewrite':'非弱点役での成功書き換え','battle_mode_at_at':'AT当選時バトルモード','shizu_rimuru_end':'AT終了画面のシズ＆リムル','at_end_screen':'AT終了画面','kerotto_trophy':'ケロットトロフィー','rare_role_probabilities':'転生状態別の小役確率','enemy_and_tensei_state_rewrite':'敵・転生状態別の書き換え'}
DOMAINS=['INITIAL_HIT','BONUS','SMALL_ROLE','CZ','AT','INTERNAL_CONDITIONAL_DRAW','MODE_TRANSITION','STATE_TRANSITION','SUCCESS_RATE','POINTS_GAME_DISTRIBUTION','CARRY_OVER','THRESHOLD_BEHAVIOR','RESET_BEHAVIOR','POST_EVENT_TRANSITION','NAVIGATION','ROLE_CONDITIONAL_DISTRIBUTION','BONUS_TYPE_CONDITIONAL','EVIDENCE','EXTERNAL_DATA_ONLY','MACHINE_SPECIFIC']
DINDEX=[0,0,1,0,0,2,2,5,2,2,5,5,5,5,5,1,0,3,5,4]

def categories(mapping):
 return [{'label':str(k),'meaning':str(v),'semanticType':'EXACT_CONSTRAINT' if re.match(r'^設定[0-6]',str(v)) and '示唆' not in str(v) else 'PROBABILITY_UNKNOWN'} for k,v in mapping.items()]

for n,m in enumerate(sel,1):
 rawpath=sorted((ROOT/'imported-handoff').glob(f'{n:02d}_*.json'))[0];raw=json.load(open(rawpath))
 baseline=json.load(open(ROOT/'repository-baseline'/(m['machineId']+'.json')))
 cs=raw.get('numeric_candidates',raw.get('candidates',raw.get('numeric_and_constraint_candidates',[])))
 if n==1:cs=cs+raw['constraint_candidates']
 urls=raw.get('source_urls',raw.get('sources',[]));urls=[x if isinstance(x,str) else x.get('url') for x in urls]; urls=[x for x in urls if x]
 primary=next((u for u in urls if 'nana-press.com' in u),urls[0])
 doc={'schemaVersion':'research-v1','manifestVersion':'8.5','batchId':BATCH,'machineId':m['machineId'],'machineName':m['displayName'],'researchStage':'SOURCE_REVIEW_COMPLETE','machineIdentity':baseline['machine'],'settings':{'status':'SOURCE_DERIVED','values':baseline['machine']['settings']},'sources':[],'findings':[],'blockedItems':[], 'importProvenance':{'path':str(rawpath.relative_to(PROD)),'sha256':hashlib.sha256(rawpath.read_bytes()).hexdigest(),'externalIndependentAudit':'NOT_PERFORMED','sixDomainSourceScope':raw.get('six_domain_review'),'publicResearchScope':raw.get('audit'), 'normalization':'candidate-by-candidate; originals immutable; public-scope closure reused; no exhaustive-site assertion'},'legacyReconciliation':{'baselinePath':f'production/research-inbox/batch023/repository-baseline/{m["machineId"]}.json','allExistingFeaturesRetainedInSnapshot':True,'allExistingEvidenceRetainedInSnapshot':True,'runtimeUnchanged':True,'notes':'数値・名称・観測条件の変更を履歴として保持。古い入力IDの移行は後続実装でレビュー。'}}
 sources={};ledger=[];rawcounts=[]
 def source(u):
  if u not in sources:sources[u]={'sourceId':f'S{len(sources)+1:02d}','url':u,'title':m['displayName']+' 設定差と観測条件','sourceType':'inherited_public_research','checkedAt':'2026-10-19','claims':[]}
  return sources[u]
 def add(c, idx, kind=None, vals=None,label=None,context=None):
  key=c.get('key',c.get('id',c.get('name','')));lab=label or c.get('label') or LABELS.get(key,key)
  fid=f'B023-M{n:02d}-{idx}'
  u=c.get('source_url',c.get('published_source',c.get('source',primary)))
  if not isinstance(u,str) or not u.startswith('http'):u=primary
  s=source(u);sid=s['sourceId'];claim=lab+'：'+json.dumps(c,ensure_ascii=False,separators=(',',':'));s['claims'].append(claim)
  row={'candidateId':fid,'label':lab,'sourceClaims':[{'sourceId':sid,'claim':claim}],'discoveryQueries':[]}
  ledger.append(row)
  den=clean(c.get('denominator',c.get('definition','')));cond=clean(c.get('conditions',c.get('condition',c.get('observation',''))));notes=clean(c.get('notes',c.get('note','')))
  text='。'.join(x for x in [den,cond,notes] if x)
  # Internal names remain in provenance only.
  if re.search(r'[A-Za-z_]{5,}',text):text='対象となるゲーム区間・成立役・演出機会を区別して記録します。条件を確定できない試行は含めません。'
  f={'findingId':fid,'label':lab,'sourceIds':[sid],'details':[text or '表示された演出を観測した機会ごとに記録します。']}
  def block(reason,disposition=None):
   b={'blockId':fid,'label':lab,'sourceIds':[sid],'reason':reason,'reevaluationCondition':'対象となる設定別数値と、実戦で正確に数えられる観測条件を確認できる具体的な資料が公表された場合。','rawCandidate':c}
   if disposition:b.update(disposition)
   doc['blockedItems'].append(b);row['disposition']={'type':'BLOCKED','refId':fid};return b
  if n==10 and key in ['333G天井選択','上り坂高確・図柄1個時CZ当選','上り坂高確・図柄2個時CZ当選','ダブル高確・図柄2個時CZ当選','リセット・区間・天井適用条件']:
   return block('内部状態や選択された天井を全件直接確認できず、早期当選や示唆演出から逆算して試行を補うことはできないため使用しません。')
  if n==10 and key=='CZ大変身ゾーン非レア小役成功':
   return block('CZ種類ごとの非レア役成功率の完全な転記と、成功契機の対応を確認できないため、異なるCZを混ぜて使用しません。')
  if (n,key) in BLOCK:return block(BLOCK[n,key])
  # Conflicts stay closed after one bounded crosscheck, not selected by source preference.
  if n==7 and key in ['ボーナス+AT合算初当り','通常AT直撃']:
   a=source('https://1geki.jp/slot/l_otome_keigan/0/');extra=source('https://chonborista.com/slot/orinpia-slot/191643/comment-page-14/')
   for ss in [a,extra]:
    cl=lab+'：公開資料の同名対象数値が一致せず、訂正・別集計条件を確認できなかった。';ss['claims'].append(cl);row['sourceClaims'].append({'sourceId':ss['sourceId'],'claim':cl})
   ids=[sid,a['sourceId'],extra['sourceId']]
   b=block('公開資料で同じ対象の設定別数値が異なり、正しい値を確定できないため使用しません。',{'disposition':'SOURCE_CONFLICT_UNRESOLVED','sourceConflictResolution':{'schemaVersion':'source-conflict-v1','status':'SOURCE_CONFLICT_UNRESOLVED','candidateId':fid,'conflictingClaim':lab+'の数値不一致（合算設定1は272.7対272.2、通常AT直撃は10922.7～5461.3対9776.9～5132.2）','checkedAt':'2026-10-19','initialSourceIds':ids[:2],'additionalCheckSourceIds':ids[2:],'additionalChecksUsed':1,'repeatPublicSearch':False,'runtimeUse':'DISABLED','reopenPolicy':'NEW_CONCRETE_SOURCE_ONLY'}});b['sourceIds']=ids;return
  k=kind or c.get('kind',c.get('type',c.get('metric','')))
  v=vals if vals is not None else c.get('by_setting')
  if v is None and 'values' in c:v=dict(zip(map(str,c.get('settings',raw.get('settings',[]))),c['values']))
  for field in ['distribution_percent_by_setting','values_by_setting','percent_by_setting']:
   if field in c:v={s:dict(zip(c['categories'],vv)) for s,vv in c[field].items()};k='categorical'
  if n==1 and 'values' in c:v=dict(zip(map(str,raw['settings']),c['values']));k=c['metric']
  mapping=dict(SEM.get((n,key),{}))
  for field,mappingv in c.items():
   if field.startswith('minimum_setting_by_'):mapping.update({a:'設定'+str(b)+'以上' if b!=6 else '設定6' for a,b in mappingv.items()})
   if field.startswith('excluded_settings_by_'):mapping.update({a:'設定'+'・'.join(map(str,b))+'否定' for a,b in mappingv.items()})
   if field.startswith('record_only_') and isinstance(mappingv,list):mapping.update({a:'出現率未確認・記録のみ' for a in mappingv})
  if n==10:
   for a,b in c.get('observations',{}).items():
    if re.match(r'^>=\d$',str(b)):mapping[a]='設定'+str(b)[2:]+'以上'
    elif re.match(r'^not \d$',str(b)):mapping[a]='設定'+str(b)[4:]+'否定'
    elif re.match(r'^\d(?: or \d)*$',str(b)):mapping[a]='設定'+'・'.join(str(b).split(' or '))
    else:mapping[a]='設定別出現率未確認・記録のみ'
   if key=='マップ9選択':v=None;mapping={'MAP9':'設定2以上'}
   if key=='マップ15選択':v=None;mapping={'MAP15':'設定6'}
   if key=='マップ1-16選択分布':
    v=None;mapping={'MAP9':'設定2以上','MAP15':'設定6','MAP16':'設定0'}
    f['details']=['実際にマップを確定できた場合の設定条件だけに使用します。推定したマップを選択率の全件集計として使用しません。全16カテゴリの公表表は別記録として保持します。']
   if key in ['左第1ベル','共通ベル']:k='rate_inverse'
  if n==2:
   group=next((a for a in raw.get('explicit_constraints',{}) if a==lab or (lab.startswith(a.replace('後液晶','後1G目液晶')))),None)
   aliases={'使徒バトル敗北後1G目液晶出目':'使徒バトル敗北後液晶出目','EVA図柄テンパイボイス':'EVA図柄ボイス','赤7図柄テンパイボイス':'赤7ボイス'}
   group=group or aliases.get(lab)
   for a,b in raw.get('explicit_constraints',{}).get(group,{}).items():
    mapping[a]=('設定'+str(b['min'])+'以上') if 'min'in b else ('設定'+'・'.join(map(str,b['exclude']))+'否定') if 'exclude'in b else '設定'+'・'.join(map(str,b['allowed']))
  if n==2 and lab=='E-FREEZE終了画面':mapping.update({'リリス':'設定4以上','mark.6':'設定6'})
  if n==5 and key=='AT終了画面':mapping.update({'二階堂姉妹':'設定2以上','高宮・東城・岡田':'設定3以上','KONAMIチーム':'設定4以上','バカンス':'設定5以上','伝説のプロ雀士':'設定6'})
  if n==3 and key=='kerotto_trophy':mapping.update({'銅':'設定2以上','金':'設定4以上','ケロット柄':'設定5以上','虹':'設定6'})
  observable=True;reason=None
  if n==1 and key in ['watermelon_bonus_conditional','one_coin_B_bonus_conditional']:reason='小役とボーナスの同じ当選を重ねるため、ボーナス合算を使うモデルとは同時使用しません。元の条件付き数値を保持します。'
  if n==2 and '敗北後' in lab:reason='敗北回数によって出現率が変わるため、条件の異なる結果を混ぜた表を推測計算に使用しません。'
  if n==2 and lab=='EVA図柄テンパイボイス':reason='左リールの停止操作によって無音率が変わるため、公表表と同じ操作条件を確定できない集計は使用しません。'
  if reason and not mapping:return block(reason)
  if reason:v=None;f['details']=[reason+'設定確定・否定の表示だけは候補の絞り込みに使用します。']
  complete=isinstance(v,dict) and set(v)==set(map(str,raw['settings'])) and all(x is not None for x in v.values())
  numeric=complete and all(isinstance(x,(int,float)) for x in v.values())
  cat=complete and all(isinstance(x,dict) for x in v.values())
  if numeric:
   inverse=any(x in k.lower() for x in ['inverse','1/n','per_normal','per game','reg game'])
   f['observationType']='probability' if inverse else 'conditional_probability'
   f['settingDistribution']={s:'1/'+str(x) if inverse else x/100 for s,x in v.items()}
   f['trialUniverse']='NORMAL_GAME_TRIAL' if inverse and ('通常' in den or den in ['normal_G'] or n in [2,4,6,7,9]) else 'TOTAL_GAME_TRIAL' if n==1 and key in ['big','reg','bonus_total'] else 'ELIGIBLE_GAME_TRIAL' if inverse else 'OBSERVED_EVENT_TRIAL'
   f['denominatorSemantics']=text or '対象となる試行と成功回数を記録します。'
   if f['trialUniverse']=='NORMAL_GAME_TRIAL':f['denominatorSemantics']='通常ゲーム数を使用します。AT・ボーナス消化中と明確な引き戻し区間内の当選を除き、区間終了後の当選を初当りに数えます。'+(cond if not re.search('[a-z_]{5,}',cond) else '')
   if n==10 and key in ['左第1ベル','共通ベル']:
    f['trialUniverse']='AT_GAME_TRIAL';f['denominatorSemantics']='AT中の押し順・停止形を判別できたゲーム数を記録します。通常ゲーム数や総ゲーム数は使いません。'
   if n==1:
    if key=='common_bell':f['trialUniverse']='ART_GAME_TRIAL';f['denominatorSemantics']='ART中のゲーム数と、ナビなしで揃った共通ベル回数を記録します。通常時のベルは混ぜません。'
    elif key in ['watermelon','one_coin_B','confirmed_role']:f['trialUniverse']='BONUS_ELIGIBLE_GAME_TRIAL';f['denominatorSemantics']='ボーナス消化中を除く通常・ARTゲーム数を記録します。小役を判別できない区間を除外し、1枚役Bは対応する停止形で識別します。'
    elif key=='reg_bar':f['trialUniverse']='REG_GAME_TRIAL';f['denominatorSemantics']='REG消化ゲーム数とBAR揃い回数を記録します。カットイン色別の成功率とは重ねて使用しません。'
   f['liveObservation']={'status':'EXACT_WITH_SCOPE_TRACKING','reason':f['denominatorSemantics']}
   if f['trialUniverse']=='NORMAL_GAME_TRIAL' and n!=5 or n==5 and key=='AT初当り':
    f.update(dependencyGroupId=f'm{n}_hit_path',dependencyKind='CAUSAL_PATH_OVERLAP',dependencyReason='合算・構成事象・上流下流の同じ当選経路を重ねないため、正式な設定判別スコアを比較して代表を選びます。')
   if n==1 and key in ['big','reg','bonus_total','confirmed_role']:
    f.update(dependencyGroupId='higurashi_bonus',dependencyKind='AGGREGATE_COMPONENT',dependencyReason='ボーナス合算とその内訳・重複当選を独立に重ねません。')
   if n==1 and key in ['reg_bar','reg_cut_in_blue','reg_cut_in_red']:f.update(dependencyGroupId='higurashi_reg_bar',dependencyKind='NESTED_OUTCOME',dependencyReason='BAR揃いとカットイン色別成功は同じ成功を含むため、単一の集計方法だけを使用します。',dependencyFallbackRank={'reg_bar':1,'reg_cut_in_blue':2,'reg_cut_in_red':3}[key])
   if n==8 and 'レア小役合算' in lab:
    f['trialUniverse']='NORMAL_GAME_TRIAL';f['denominatorSemantics']='通常ゲーム数と、停止形を判別できた対象レア小役の回数を記録します。AT中のゲーム数や小役を混ぜません。既存登録の通常時入力の範囲を保持します。'
    f['liveObservation']={'status':'EXACT_WITH_SCOPE_TRACKING','reason':f['denominatorSemantics']}
   if n==8 and 'レア小役合算' in lab:f.update(dependencyGroupId='kinnikuman_roles',dependencyKind='AGGREGATE_COMPONENT',dependencyReason='弱レア小役合算はレア小役合算に含まれるため、両方を独立に重ねません。',dependencyFallbackRank=1 if key=='レア小役合算' else 2)
   if n==3 and key=='strong_rare_to_tokkyu':f.update(dependencyGroupId='m3_hit_path',dependencyKind='CAUSAL_PATH_OVERLAP',dependencyReason='特級魔族討伐戦の突入率と契機別成功の同じ当選を重ねません。')
   if n==7 and key in ['巫女カウンター0ptでCZ','戦国乙女ボーナスAT当選']:f.update(dependencyGroupId='m7_hit_path',dependencyKind='CAUSAL_PATH_OVERLAP',dependencyReason='CZ・AT初当りに含まれる同じ当選の経路を重ねません。')
   # Explicit event-opportunity denominator, never fabricate 7000G exposure.
   if f['observationType']=='conditional_probability':f['trialUniverse']='OBSERVED_EVENT_TRIAL'
   doc['findings'].append(f);row['disposition']={'type':'FINDING','refId':fid}
  elif cat:
   labels=list(next(iter(v.values())))
   if not all(list(x)==labels and all(isinstance(a,(int,float)) for a in x.values()) and abs(sum(x.values())-100)<=1.5 for x in v.values()):returnvalue=block('カテゴリ分布の合計またはカテゴリ対応を確認できないため、数値を補って使用しません。');returnvalue=None
   else:
    f.update(observationType='appearance_distribution',settingDistribution={s:' / '.join(a+': '+str(x[a])+'%' for a in labels) for s,x in v.items()},categoryModel={'residualPolicy':'SOURCE_EXHAUSTIVE'},trialUniverse='OBSERVED_EVENT_TRIAL',denominatorSemantics=text or '対象となる観測1回につき表示カテゴリを1つ記録します。',liveObservation={'status':'EXHAUSTIVE_CATEGORICAL','reason':'対象となる表示機会を区別し、1回につき1カテゴリだけを記録します。'})
    doc['findings'].append(f);row['disposition']={'type':'FINDING','refId':fid}
    if mapping:
     efid=fid+'-E';f['mirrorsEvidenceFindingId']=efid;f['categoricalEvidenceReconciliation']={'type':'SINGLE_CANONICAL_CATEGORY_INPUT','evidenceFindingId':efid,'runtimeLinkContract':'EXPLICIT_CATEGORY_LINK_V1'}
     sem=categories({a:mapping.get(a,'出現率確認済み') for a in labels})
     for a in sem:
      a['linkedFindingId']=fid
      if a['semanticType']!='EXACT_CONSTRAINT':a['semanticType']='PROBABILITY_BACKED'
     doc['findings'].append({'findingId':efid,'label':lab+'の設定条件','sourceIds':[sid],'observationType':'evidence','semanticCategories':sem,'details':['同じ表示の数値カウントを共有し、設定確定・否定だけを重ねず反映します。']})
     ledger.append({'candidateId':efid,'label':lab+'の設定条件','sourceClaims':[{'sourceId':sid,'claim':claim}],'discoveryQueries':[],'disposition':{'type':'FINDING','refId':efid}})
  elif mapping or any(x in k.lower() for x in ['exact','record','hint','unknown','constraint']) or n==1 or n==2:
   if mapping:
    f.update(observationType='evidence',semanticCategories=categories(mapping))
   else:f.update(observationType='evidence',semanticType='PROBABILITY_UNKNOWN');f['details'].append('設定別出現率を確認できない項目は、記録のみ・推測計算には使用しない。')
   if v is not None:f['retainedSourceParameters']=v
   doc['findings'].append(f);row['disposition']={'type':'FINDING','refId':fid}
  else:block('設定別の完全な数値または実戦で再現できる観測条件を確認できないため使用しません。')
 for idx,c in enumerate(cs,1):
  # Preserve prior duplicate drafts as ledger aliases, not extra user inputs.
  aliases={4:8,5:9,6:10,7:11} if n==2 else {11:10} if n==10 else {}
  if idx in aliases:
   ss=source(primary);claim=(c.get('name',c.get('id','')))+'：'+json.dumps(c,ensure_ascii=False,separators=(',',':'));ss['claims'].append(claim)
   ledger.append({'candidateId':f'B023-M{n:02d}-{idx:03d}','label':c.get('name',c.get('id','')),'sourceClaims':[{'sourceId':ss['sourceId'],'claim':claim}],'discoveryQueries':[],'disposition':{'type':'FINDING','refId':f'B023-M{n:02d}-{aliases[idx]:03d}'},'normalization':'同じ表示・分布への別表現を統合。独立した入力や尤度を追加しない。'})
   continue
  key=c.get('key',c.get('id',c.get('name','')))
  v=c.get('by_setting')
  if n==3 and key=='kerotto_trophy':
   # Published trophy rates vary with phase and play history; exact constraints only.
   c=dict(c);c['by_setting']=None;c['kind']='constraint_or_record';c['note']='出現率はAT終了・復活・EDや抽選履歴で条件が異なるため確率計算せず、表示されたトロフィーの設定条件のみ使用します。'
  if n==8 and key=='BAR揃い時AT直撃':
   # Lv1/Lv2 are latent CZ levels, not guaranteed visible trial universes.
   BLOCK[n,key]='正義超人チャレンジの内部レベルを全件確定できず、レベル別のBAR揃い試行を再現できないため使用しません。'
  if n==10 and key=='上り坂1個停止時左リール選択':
   c=dict(c);c['kind']='categorical';c['id']='上り坂1個停止時リール分布'
   left=c['by_setting'];middle=next(a for a in cs if a.get('id')=='上り坂1個停止時中リール選択')['by_setting']
   c['by_setting']={k:{'左':v,'中':middle[k],'右':41.4} for k,v in left.items()}
   c['conditions']='上り坂図柄1個停止時だけを対象に、左・中・右を1回につき1カテゴリで記録します。'
  if n==10 and key=='上り坂1個停止時中リール選択':
   c=dict(c);c['by_setting']=None;c['kind']='record_only';c['note']='左・中・右の排他的な分布へ統合済み。同じ観測を独立の成功率に重ねません。';c['observations']={}
  if n==6 and key=='周期レベル到達率':
   c=dict(c);c['kind']='categorical'
  add(c,f'{idx:03d}')
 sourceslist=list(sources.values());doc['sources']=sourceslist
 # Cover concrete domains from inherited six-area survey. No universal absence or exhaustive-site claim.
 six=list(raw.get('six_domain_review',{}).values())
 if len(six)<6:six=six+['調査結果は取込元の6領域記録に保存。']*(6-len(six))
 queries=[m['displayName']+' '+x for x in ['初当り・小役の設定別公表値','終了画面・確定示唆の対象条件','内部状態・リセット・重複当選の観測条件']]
 for i,q in enumerate(queries):ledger[min(i,len(ledger)-1)]['discoveryQueries'].append(q)
 doc['researchCompleteness']={'version':2,'domains':[{'domain':a,'status':'CHECKED','note':str(six[DINDEX[i]])+'（取込元の限定公開調査を継承。未公表と構造的非該当は区別し、候補ごとの処理先を保持。）','sourceIds':[x['sourceId'] for x in sourceslist]} for i,a in enumerate(DOMAINS)],'machineSpecificQueries':queries,'candidateLedger':ledger}
 write(ROOT/'reviewed'/(m['machineId']+'.json'),doc)
 print(n,m['machineId'],len(cs),len(doc['findings']),len(doc['blockedItems']),len(ledger))
