import json,copy,pathlib
root=pathlib.Path(__file__).parent
p=json.loads((root/'baseline-package.json').read_text()); old=copy.deepcopy(p)
p['machine']['machineDataVersion']='8.5.3-batch-20261022-025'
p['machine']['packagePolicy']['machineDataRevision']=3
p['ui']['creaInputRevision']=1
p['metadata']['creaInputRevision']={'revision':1,'sourceVersion':old['machine']['machineDataVersion'],'scope':'UI_OBSERVATION_SAVE_RESTORE_ONLY','publishedDenominatorEquivalence':'NOT_ASSERTED','countingPolicy':'通常時の総G。ボーナス・BT中・ボーナス成立後を除外し、成立ゲームは含む。対象外区間が含まれるカウンターをそのまま転記しない。','legacyRecords':'PRESERVE_WITH_SCOPE_RECONFIRMATION','aggregatePolicy':'STRICT_BOTH_COMPONENTS_ELSE_SINGLE_COMPONENT_FALLBACK','standalonePolicy':'ALL_THREE_COUNTS_REQUIRED_OTHER_G_AUTOMATIC'}
flag={'id':'INP_CREA_SCOPE_RECHECK','name':'旧記録の観測区間再確認','category':'INTERNAL','type':'integer','defaultValue':'','inputVisible':False,'inferenceRole':'DISPLAY_ONLY'}
p['inputs']['inputs'].append(flag)
normal=p['ui']['v8Sections'][0];normal['title']='通常時のボーナス・小役'
normal['description']='ゲーム数は上の「ゲーム数入力」から自動取得します。回数は同じ区間で数えてください。ボーナス合算とスイカ合算は内訳から自動計算します。'
normal['groups'][0]['label']='通常時の対象総G'
normal['items']=[n for n in normal['items'] if n['featureId'] not in ['NORMAL_2','NORMAL_10']]
for n in normal['items']:
 n['compactCounter']=True;n['description']=''
 for c in n.get('inputs',[]):c['compactCounter']=True
 if n['featureId']=='NORMAL_8':n['description']='ピラミッドちゃれんじ中のピラミッド揃いは数えません。'
 if n['featureId']=='NORMAL_9':n['description']='ピラミッドちゃれんじに変換されたチャンス目は数えません。'
rolelabels=['チェリー','チャンス目','スイカ','滑りスイカ']
for i,label in enumerate(rolelabels):
 s=next(s for s in p['ui']['v8Sections'] if s['id']=='OBS_OVERLAP_'+str(i))
 s['tabGroup']={'id':'CREA_ROLE_OVERLAP','title':'小役別のボーナス同時当選','label':label}
 s['description']='成立回数と同時当選回数を、同じ区間で数えてください。ボーナス図柄を揃えた後のPUSHで当選契機を確認します。契機を見分けられない試行がある場合、この項目は入力せず空欄にしてください。'
 for n in s.get('groups',[])+s.get('items',[]):
  for c in [n]+n.get('inputs',[]):
   if c.get('input') in ['counter','denominator']:
    ident=c.get('inputId','');c['label']=label+('成立回数' if 'eligibleTrialCount' in ident else '同時当選回数');c['title']=c['label'];c['compactCounter']=True
  n['description']=''
 # Keep the eligible-trial definition; do not share counts across different intervals.
fmap={f['featureId']:f for f in p['features']['features']}
labels={'BELL_ONLY':'単独共通ベル','WATERMELON_ONLY':'単独スイカ','SLIP_WATERMELON_ONLY':'単独滑りスイカ','CHANCE_BIG':'チャンス目＋BIG','CHANCE_REG':'チャンス目＋REG','CHERRY_BIG':'チェリー＋BIG','CHERRY_REG':'チェリー＋REG'}
for s in p['ui']['v8Sections']:
 if s['id']=='OBS_STANDALONE_ROLES':
  s['title']='単独小役';s['description']='ボーナスと同時当選しなかった小役を数えます。3項目すべてを同じ区間で記録し、0回も入力してください。その他ゲーム数は内部で計算するため入力不要です。'
 if s['id']=='OBS_BONUS_COMPOSITION':
  s['title']='ボーナス当選契機の内訳';s['description']='確認できた契機とBIG・REGの組み合わせを記録します。「その他」は確認できた別の当選契機です。契機を確認できなかったボーナスをその他へ入れないでください。全ボーナスを分類できない区間では、この内訳を推測に使わず空欄にしてください。'
 if s['id']=='OBS_BT_MISS_SHARE':
  s['description']='BAR成立前の純ハズレとJACINを数えます。母数はその合計、分子は純ハズレ回数です。BARを狙えを外した後や成立後のゲームは含めません。'
 for n in s.get('items',[]):
  for c in [n]+n.get('inputs',[]):
   if c.get('directNumeric'):c['compactCounter']=True
  if s['id'] in ['OBS_STANDALONE_ROLES','OBS_BONUS_COMPOSITION']:
   n['description']='';n['title']=s['title']
  interaction=n.get('interaction',{})
  if s['id']=='OBS_STANDALONE_ROLES':
   interaction['categories']=[c for c in interaction.get('categories',[]) if not c['inputId'].endswith('4_その他')]
   interaction.pop('residualGameCount',None)
  for c in interaction.get('categories',[]):
   c['label']=labels.get(c['label'],c['label'])
   if s['id'] in ['OBS_STANDALONE_ROLES','OBS_BONUS_COMPOSITION']:
    c['directNumeric']=True;c['compactCounter']=True
 if s['id'] in ['EVI_STAMP','EVI_TROPHY']:
  s['tabGroup']={'id':'CREA_BIG_END','title':'BIG終了画面','label':'スタンプ' if s['id']=='EVI_STAMP' else 'トロフィー'}
 if s['id']=='EVI_STAMP':s['description']='このセクションの全項目は設定別出現率が公表・確認されていないため、記録のみです。設定推測の計算には使用しません。'
 if s['id']=='EVI_TROPHY':s['description']='出現したトロフィーを記録します。設定が絞られる条件は、設定候補の絞り込みに反映できる可能性があります。'
 if s['id']=='EVI_REG_CARD':s['description']='銅・銀・金は記録のみです。赤やカードの組み合わせは、同じ1回のREG内で判定してください。赤2回を複数のREGにまたがって合計しないでください。条件を満たす表示は設定候補の絞り込みに反映できる可能性があります。'
for inp in p['inputs']['inputs']:
 for key,value in labels.items():
  if inp.get('name')==key:inp['name']=value
 if inp['id'] in ['NORMAL_2.successCount','NORMAL_10.successCount','STANDALONE_ROLES.categoryCounts.4_その他']:inp['inputVisible']=False
for f in p['features']['features']:
 if 'selectionRationale' in f:
  # Preserve quantitative rationale, remove old generic observation text now superseded above.
  text=f['selectionRationale'].get('adoptionReason','')
  text=text.replace('旧正本の確率とカテゴリ定義をそのまま保存。','同じ区間で確認した内訳を比較します。')
  for key,value in sorted(labels.items(),key=lambda item:-len(item[0])):text=text.replace(key,value)
  f['selectionRationale']['adoptionReason']=text
for row in p['v8']['machineResearchSummary']['adopted']:
 row['reason']=fmap[row['featureId']]['selectionRationale']['adoptionReason']
h=p['v8']['machineResearchSummary']['highLowDiscrimination'];h['eligibleFeatureIds']=[x for x in h['eligibleFeatureIds'] if x!='NORMAL_4']
for row in p['metadata']['observationPrerequisites']:
 if row['findingId'].startswith('NORMAL_'):
  row['denominatorSemantics']=p['metadata']['creaInputRevision']['countingPolicy'];row['liveObservation']['reason']=row['denominatorSemantics']
for row in p['metadata']['observationPrerequisites']:
 if row['findingId'] in ['STANDALONE_ROLES','BONUS_COMPOSITION']:
  section=next(x for x in p['ui']['v8Sections'] if x['id']=='OBS_'+row['findingId']);row['denominatorSemantics']=section['description'];row['liveObservation']['reason']=section['description']
p['metadata']['batch025Presentation']['groups']=[{'id':'CREA_ROLE_OVERLAP','title':'小役別のボーナス同時当選','tabs':rolelabels},{'id':'CREA_BIG_END','title':'BIG終了画面','tabs':['スタンプ','トロフィー']}]
# The prior numerical models, setting values, dependency priorities and policy remain byte-for-byte equivalent.
for a,b in zip(old['features']['features'],p['features']['features']):
 for k in set(a)|set(b):
  if k!='selectionRationale':assert a.get(k)==b.get(k),(a['featureId'],k)
assert old['features']['runtimeProjection']==p['features']['runtimeProjection']
(root/'machine-package.json').write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
