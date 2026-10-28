import json,pathlib,copy,hashlib
ROOT=pathlib.Path('data');BASE=pathlib.Path('correction-baseline');BATCH='batch-20261026-026';REV='grape-correction-20261028';RDIR=ROOT/'research/2026-10-26'/REV
IDS=['S_NEO_IM_JUGGLER_EX_KK','S_ULTRA_MIRACLE_JUGGLER_KT','S_MR_JUGGLER_KK','S_JUGGLER_GIRLS_SS_KH','S_GOGO_JUGGLER_3_KA']
REFS={IDS[0]:[6.02]*5+[5.78],IDS[1]:[5.93]*4+[5.87,5.81],IDS[3]:[5.98]*4+[5.88,5.83],IDS[4]:[6.25,6.20,6.15,6.07,6.00,5.92]}
J7={IDS[0]:'https://juggler7.com/neo-aimex/kaiseki.html',IDS[1]:'https://juggler7.com/ultramiracle/kaiseki.html',IDS[3]:'https://juggler7.com/girls-ss/settei-hanbetu.html',IDS[4]:'https://juggler7.com/gogo3/kaiseki.html'}
IG={IDS[0]:('https://1geki.jp/slot/s_nijex/0/',1500,8638),IDS[1]:('https://1geki.jp/slot/s_ulmira_juggler/4/',801,4449),IDS[3]:('https://1geki.jp/slot/s_jag_girls/4/',1554,9158),IDS[4]:('https://1geki.jp/slot/s_gogojuggler3/4/',1215,7528)}
DMM={IDS[0]:{'url':'https://p-town.dmm.com/specials/4486','rates':{'6':5.65},'games':{'6':3255},'notes':'対象機種の設定6ショールーム実戦。別掲の全設定表は前作のガリぞう調べで、当該機種への参照適用を編集部が明示。'},IDS[1]:{'url':'https://p-town.dmm.com/specials/3892','rates':{'6':5.69},'games':{'6':3625},'notes':'当該機種の設定6、通常時3625Gの独自実戦。'},IDS[3]:{'url':'https://p-town.dmm.com/specials/3511','rates':{'1':6.07,'5':5.96,'6':5.69},'games':{},'notes':'記事本文はジャグラーガールズSSを明示。設定1・5・6の独自実戦表。回数・G数は掲載されていないため逆算しない。'},IDS[4]:{'url':'https://p-town.dmm.com/specials/3073','fractions':{'5':[441,2580],'6':[552,3198]},'notes':'当該機種の実戦。3029の表と同一試行なので1票。別掲の5号機表は比較資料であり、当該機種へ流用しない。'}}
def read(p):return json.loads(pathlib.Path(p).read_text())
def write(p,o):p=pathlib.Path(p);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
rows=[]
for i,mid in enumerate(IDS):
 bdir=BASE/'production/batches'/BATCH/'artifacts'/mid;r=read(bdir/'research/result.json');old=copy.deepcopy(r);f=next(x for x in r['findings']if 'GRAPE_CANDIDATE'in x['findingId']);fid=f['findingId'];bonus=next(x for x in r['findings']if '_SELF_BONUS_OUTCOME'in x['findingId']);records=[];excluded=[]
 if mid==IDS[2]:
  f.update(label='ブドウ（ユーザー指定により対象外）',observationType='reference_distribution',details=['ユーザーの指示によりブドウを使用せず、入力欄・記録欄も設けない。'],reevaluationCondition='ユーザーが明示的に利用再開を指示した場合のみ。')
  r['userDecision']={'date':'2026-10-28','findingId':fid,'disposition':'USER_EXCLUDED_NO_INPUT','researchStopped':True,'numericInference':False,'recordInput':False,'missingSettingsInvestigation':'CANCELLED_BY_USER'}
  policy={'status':'USER_EXCLUDED_NO_INPUT','findingId':fid,'numericInferenceAllowed':False,'recordInputAllowed':False,'disabledInputIds':['REC_GRAPE_COUNT'],'disableRecordSection':'EVI_GRAPE_REFERENCE','reopenPolicy':'EXPLICIT_USER_INSTRUCTION_ONLY'}
  r['observationContract']['smallRoles']['fields']=[x for x in r['observationContract']['smallRoles']['fields']if x!='ブドウ'];r['observationContract']['smallRoles']['explanation']='ブドウは利用対象外とし、入力欄・記録欄も設けない。その他の参考項目の扱いは従来どおり。'
  r['observationContract']['grapeInputPolicy']=policy
  r['sourceBoundedClosure']['notes']=['ブドウはユーザー指示で調査・推測採用・記録欄作成を終了。設定1〜5を補完しない。']
  sourceAudit={'machineId':mid,'status':'USER_EXCLUDED_NO_INPUT','dmm':'NOT_INVESTIGATED_PER_USER_STOP','missingSettings':'NOT_A_BLOCKER_USER_CANCELLED','historicalDataRetained':True}
 else:
  for s,den in enumerate(REFS[mid],1):records.append({'setting':str(s),'publisher':'juggler7','originId':'GARIZO_'+mid,'representation':'EDITORIAL_REFERENCE_ESTIMATE','reciprocal':den,'probability':1/den,'url':J7[mid],'verifiedBy':'DIRECT_WEB_BODY_CORRECTION_AND_CURRENT_RECHECK','scope':'対象機種の通常時ブドウ参考表。ネオアイムは前作の参考適用を含む。'})
  url,hits,games=IG[mid];records.append({'setting':'6','publisher':'1geki','originId':'1GEKI_FIELD_'+mid,'representation':'TARGET_MACHINE_FIELD_TRIAL','hits':hits,'eligibleGames':games,'probability':hits/games,'url':url,'verifiedBy':'DIRECT_WEB_BODY_20261028'})
  if mid==IDS[0]:
   for s,den in enumerate([6.06,6.04,6.04,6.04,6.02],1):records.append({'setting':str(s),'publisher':'1geki','originId':'1GEKI_PREVIOUS_MODEL_SIMULATOR','representation':'PREVIOUS_MODEL_SIMULATOR_APPLIED_AS_REFERENCE','reciprocal':den,'probability':1/den,'url':'https://1geki.jp/slot/s_nijex/4/','verifiedBy':'DIRECT_WEB_BODY_20261028','scope':'前作アイムジャグラーEX(6号機)の600万Gアプリ集計。当該機種の実機値とは呼ばない。'})
   excluded.append({'source':'1geki旧アプリ設定6 1/5.80および旧Researchの同サイト実戦集計','reason':'同一サイトは設定ごとに1票。再取得した当該機種実戦1500/8638を代表として採用。'})
  # Keep verified original field data; corrections must not silently drop Nana.
  nana=next(x for x in f['empiricalSiteMeans']['6']['independentSites']if x['site']=='Nana')
  records.append({'setting':'6','publisher':'nana-press','originId':'NANA_FIELD_'+mid,'representation':'TARGET_MACHINE_FIELD_TRIAL','hits':nana['hits'],'eligibleGames':nana['eligibleNormalGames'],'probability':nana['hits']/nana['eligibleNormalGames'],'url':('https://nana-press.com/kaiseki/machine/978/30873/'if mid==IDS[0]else nana['originalUrl']),'verifiedBy':'ORIGINAL_RECORD_AND_DIRECT_BODY_20261028'})
  dd=DMM[mid]
  for s,den in dd.get('rates',{}).items():records.append({'setting':s,'publisher':'DMMぱちタウン','originId':'DMM_FIELD_'+mid,'representation':'TARGET_MACHINE_FIELD_TRIAL_PUBLISHED_ROUNDED_RATE','reciprocal':den,'probability':1/den,'reportedSampleGames':dd['games'].get(s),'hits':None,'url':dd['url'],'verifiedBy':'DIRECT_BROWSER_RENDERED_BODY_20261028','scope':dd['notes']})
  for s,(hits,games)in dd.get('fractions',{}).items():records.append({'setting':s,'publisher':'DMMぱちタウン','originId':'DMM_FIELD_'+mid,'representation':'TARGET_MACHINE_FIELD_TRIAL','hits':hits,'eligibleGames':games,'probability':hits/games,'url':dd['url'],'verifiedBy':'DIRECT_BROWSER_RENDERED_BODY_20261028','scope':dd['notes']})
  excluded.extend([{'source':'DMM・juggler7のガリぞう調べの同一参考表','reason':'DMMの表も本文確認したが同じ原著を重複加算しない。juggler7側を参照表代表とする。'},{'source':'訂正ファイルの暫定2サイト平均','reason':'DMM本文の照合と既存なな徹データの保持により更新。低い実戦値も都合よく削除しない。'}])
  if mid==IDS[4]:excluded.extend([{'source':'DMM specials/3029','reason':'3073の設定5/6と同じ441/2580・552/3198。重複加算しない。'},{'source':'DMMの5号機ゴーゴー合算表','reason':'当該機種への流用を編集部が支持せず、当該機種は確率が上がったという比較に用いている。別機種の表を補完に使わない。'},{'source':'訂正ファイルの一撃URL s_gogo_juggler3','reason':'実ページは s_gogojuggler3/4/。1215/7528を原本で確認しURLを訂正。'}])
  means={}
  for s in map(str,range(1,7)):
   terms=[x for x in records if x['setting']==s];assert terms;assert len({x['publisher']for x in terms})==len(terms);assert len({x['originId']for x in terms})==len(terms)
   p=sum(x['probability']for x in terms)/len(terms);means[s]={'sourceCount':len(terms),'terms':terms,'probability':p,'displayReciprocal':1/p}
  f.update(label='ブドウ（参考値の設定別平均）',observationType='probability',settingDistribution={s:v['probability']for s,v in means.items()},sourceIds=[],details=['設定別の参考値・実戦値を出現確率に直して、重複を除いた出典ごとに同じ重みで平均した値を使用する。','通常時3枚掛けの観測区間Gと、その区間のブドウ回数を記録する。ボーナス中・1枚掛け・未観測区間を含めない。','ボーナスと同じ区間の観測を重ねて評価せず、ボーナス内訳を計算に使えない場合の代替として使用する。'],liveObservation={'status':'EXACT_WITH_SCOPE_TRACKING','reason':'ブドウを漏れなく数えた通常時3枚掛けの区間Gを直接記録する。部分区間はその区間だけを指定し、未入力を0回としない。'},inputPresentation={'trialLabel':'ブドウ観測ゲーム数','successLabel':'ブドウ回数'})
  f['historicalEmpiricalSiteMeans']=f.pop('empiricalSiteMeans');f.pop('missingSettings',None);f['referenceSiteMeans']=means
  group='B026_'+mid+'_NORMAL_BONUS_GRAPE';reason='同一の通常時区間におけるボーナスとブドウの同時成立・成立後消化の扱いを独立とは断定しない。既存のボーナス内訳を優先し、推測に使用できない場合のみブドウへ切り替える。'
  for rank,x in enumerate([bonus,f],1):x.update(dependencyReview={'status':'DEPENDENT','reason':reason},dependencyGroupId=group,dependencyKind='DEPENDENT',dependencyReason=reason,dependencyFallbackRank=rank)
  for pub in sorted({x['publisher']for x in records}):
   sid='SRC_GRAPE_20261028_'+{'juggler7':'GARIZO','1geki':'1GEKI','nana-press':'NANA','DMMぱちタウン':'DMM'}[pub];terms=[x for x in records if x['publisher']==pub];claim='ブドウの設定別平均に用いる参考表または実戦値。'+pub+'、確認設定'+','.join(sorted({x['setting']for x in terms}))+'.'
   r['sources'].append({'sourceId':sid,'publisher':pub,'title':r['machineName']+' ブドウ参考値・実戦値の訂正照合','url':terms[0]['url'],'sourceType':'reference_analysis','checkedAt':'2026-10-28','claims':[claim]});f['sourceIds'].append(sid)
   row=next(x for x in r['researchCompleteness']['candidateLedger']if x['candidateId']==fid);row['sourceClaims'].append({'sourceId':sid,'claim':claim})
  oc=r['observationContract'];oc['smallRoles'].update(fields=[x for x in oc['smallRoles']['fields']if x!='ブドウ']+['ブドウ'],currentNumericInference='CANDIDATE_PENDING_EVALUATION',explanation='ブドウは全設定の参考確率を用いて評価する。ボーナスとの重複加算を避け、推測に必要な観測区間を分けて記録する。');oc['grapeInputPolicy']={'findingId':fid,'recordOnly':False,'requireObservedGrapeGames':True,'inputRequiredOnlyIfUsed':True,'zeroIsObservedNotDefault':True,'sharedGameFieldAllowedOnlyIfFullScopeIdentical':True,'partialScopeMustUseExactObservedGames':True};oc['grapeBonusDependency']={'groupId':group,'resolution':'PREFERRED_WITH_FALLBACK','preferred':bonus['findingId'],'fallback':fid,'independenceAsserted':False,'jointOutcomeProbabilitiesInvented':False,'sameGameOverlap':'NOT_ASSERTED','predecessorBonusUnchanged':True}
  sc=r['sourceBoundedClosure'];sc['historicalNotesBeforeGrapeCorrection']=sc['notes'];sc['notes']=['全設定の参考表を正式評価候補として採用。前作参照・実戦・推定の由来を保持。','DMM本文はブラウザで直接確認し、共有原著の重複を除外。','元Researchのなな徹の独自実戦も原本照合して平均へ保持。'];sc['sixDomains'][1]='ブドウは出典別出現確率を等重み平均し、全設定を評価。メーカー非公表・参考値のみを理由に排除しない。';sc['sourceCoverage']['DMM']='DIRECT_BROWSER_BODY_CONFIRMED_20261028';sc['sourceCoverage']['juggler7']='REFERENCE_TABLE_AND_GARIZO_ORIGIN_CONFIRMED';sc['sourceCoverage']['1geki']='DIRECT_BODY_CONFIRMED_20261028';r['researchCompleteness']['domains']=[{**x,'note':x['note']+' ブドウは2026-10-28訂正により全設定の参考値を確定し評価へ進む。'}if x['domain']=='SMALL_ROLE'else x for x in r['researchCompleteness']['domains']]
  sourceAudit={'machineId':mid,'status':'SOURCE_RECONCILIATION_COMPLETE','dmm':'DIRECT_BROWSER_BODY_CONFIRMED','dmmRaw':dd,'inputCorrectionsFile':f'{i+1:02d}-'+['neo-im','ultra','mister','girls','gogo3'][i]+'.md','effectiveMeans':means,'excludedOrReplaced':excluded,'meanFormula':'mean(p_i), not mean(d_i), not pooled hits/games','sourceUncertainty':'Point estimates under user-approved reference policy; numerical evaluation does not prove true machine parameters.','fullEightSiteIndependentAuditClaimed':False}
 ledger=next(x for x in r['researchCompleteness']['candidateLedger']if x['candidateId']==fid);ledger['label']=f['label']
 r['correction']={'correctionId':REV,'baselineCommit':'b2953be8ac7dce4666edaf6ed22ff83d7518c136','handoffCommit':'44bda1a50ce439020dba561eca3c60868ed14f4b','unchangedCandidateIds':True,'newBatchCreated':False,'scope':'GRAPE_ONLY','sourceAuditPath':'research/2026-10-26/'+REV+'/work/'+mid+'/source-audit.json'}
 r['workId']='PENDING_REAL_RESEARCH_ATTEMPT'
 out=RDIR/'work'/mid;write(out/'research-prepared.json',r);write(out/'source-audit.json',sourceAudit)
 if mid!=IDS[2]:print(mid,[round(v['displayReciprocal'],6)for v in means.values()],[v['sourceCount']for v in means.values()])
 else:print(mid,'USER_EXCLUDED_NO_INPUT')
 rows.append({'machineId':mid,'findingId':fid,'status':sourceAudit['status'],'historicalCandidateCount':len(old['researchCompleteness']['candidateLedger'])})
write(RDIR/'work/input-reconciliation.json',{'batchId':BATCH,'correctionId':REV,'rows':rows,'misterUserOverride':'Latest user instruction supersedes handoff missing-settings research and reference input requirements.','implementationDistributionApkQaChanged':False})
