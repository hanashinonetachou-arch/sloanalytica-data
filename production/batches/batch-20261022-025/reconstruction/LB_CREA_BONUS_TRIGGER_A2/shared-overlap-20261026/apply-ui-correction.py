import json,copy,pathlib
r=pathlib.Path(__file__).parent;p=json.loads((r/'baseline-package.json').read_text());base=copy.deepcopy(p)
p['machine']['machineDataVersion']='8.5.4-batch-20261022-025';p['machine']['packagePolicy']['machineDataRevision']=4
rows=[('OVERLAP_1','チャンス目','NORMAL_9.successCount'),('OVERLAP_2','スイカ','NORMAL_6.successCount'),('OVERLAP_3','滑りスイカ','NORMAL_7.successCount')]
sections=p['ui']['v8Sections'];old=[s for s in sections if s['id'].startswith('OBS_OVERLAP_')]
shared={'id':'OBS_CREA_ROLE_OVERLAP','title':'小役別のボーナス同時当選','collapsible':True,'defaultExpanded':False,'description':'ボーナス図柄を揃えた後のPUSHで当選契機を確認します。契機を見分けられない試行がある場合、その役の同時当選は空欄にしてください。','descriptionPresentation':{'collapsible':True,'label':'説明','defaultExpanded':False},'items':[]}
for s in old:
 for node in s['items']:
  node['gridSpan']=12
  if node['featureId']!='OVERLAP_0':
   fid,label,source=next(row for row in rows if row[0]==node['featureId']);newk=fid+'.sharedIntervalSuccessCount854'
   k=copy.deepcopy(next(x for x in node['inputs'] if x['input']=='counter'));k.update(id=newk,inputId=newk,engineBinding={'inputId':newk})
   node['inputs']=[{'id':'CREA_REFERENCE_'+fid,'gridSpan':6,'creaReferenceInput':{'inputId':source,'label':label+'成立回数'}},k]
   f=next(f for f in p['features']['features'] if f['featureId']==fid);f['denominatorInputId']=source;f['numeratorInputId']=newk
   original=next(i for i in p['inputs']['inputs'] if i['id']==fid+'.successCount');new=copy.deepcopy(original);new.update(id=newk,name=label+'同時当選回数',parentInputId=source,defaultValue='');p['inputs']['inputs'].append(new)
   for inp in p['inputs']['inputs']:
    if inp['id'] in [fid+'.successCount',fid+'.eligibleTrialCount']:inp['inputVisible']=False
   p['inputs']['inputs'].append({'id':'INP_CREA_'+fid+'_INTERVAL_RECHECK','name':label+'の区間再確認','category':'INTERNAL','type':'integer','defaultValue':'','inputVisible':False,'inferenceRole':'DISPLAY_ONLY'})
   f['selectionRationale']['adoptionReason']+=' 成立回数は通常時の'+label+'回数から取得し、同時当選回数と同じ観測区間で使います。'
  shared['items'].append(node)
first=next(i for i,s in enumerate(sections) if s['id']=='OBS_OVERLAP_0');p['ui']['v8Sections']=[s for s in sections if not s['id'].startswith('OBS_OVERLAP_')];p['ui']['v8Sections'].insert(first,shared)
p['metadata']['batch025Presentation']['groups']=[g for g in p['metadata']['batch025Presentation']['groups'] if g['id']!='CREA_ROLE_OVERLAP']
p['metadata']['creaSharedOverlap']={'revision':1,'cherryDenominator':'OVERLAP_0.eligibleTrialCount','sharedDenominators':{fid:source for fid,_,source in rows},'sameObservationIntervalRequired':True,'legacyTrialsAndSuccesses':'RETAIN_WITHOUT_AUTOMATIC_JOIN','reducedOrClearedDenominator':'REENTER_SAME_INTERVAL_SUCCESS_COUNT'}
for row in p['metadata']['observationPrerequisites']:
 if row['findingId'] in [x[0] for x in rows]:
  label=next(x[1] for x in rows if x[0]==row['findingId']);row['denominatorSemantics']='通常時の'+label+'成立回数を参照。同時当選回数と同じ区間で観測し、ボーナス成立後は含めない。途中から同時当選の記録を始めた場合、区間全体を確認できなければ空欄にする。';row['liveObservation']['reason']=row['denominatorSemantics']
fmap={f['featureId']:f for f in p['features']['features']}
for row in p['v8']['machineResearchSummary']['adopted']:row['reason']=fmap[row['featureId']]['selectionRationale']['adoptionReason']
assert base['features']['runtimeProjection']==p['features']['runtimeProjection'];assert base['evidence']==p['evidence']
for before,after in zip(base['features']['features'],p['features']['features']):
 allowed={'selectionRationale'}|({'denominatorInputId','numeratorInputId'} if before['featureId'] in [x[0] for x in rows] else set())
 for key in set(before)|set(after):
  if key not in allowed:assert before.get(key)==after.get(key),(before['featureId'],key)
(r/'machine-package.json').write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
