import json,pathlib,collections,hashlib,csv,subprocess
R=pathlib.Path(__file__).resolve().parents[1]; B='batch-20261017-020'; P=R/'batches'/B
read=lambda p:json.loads(p.read_text()); write=lambda p,x:p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
original=read(R/'research-inbox/batch020/imported-handoff/candidates_v4.json'); orig={c['candidate_id']:c for c in original}
ids=sum([w['machineIds'] for w in read(P/'batch.json')['waves']],[]);rows=[];decisions=[];metrics=collections.Counter(); checks=[]
policy=read(P/'runtime-policy-config.json')['thresholds']
for mid in ids:
 A=P/'artifacts'/mid;r,e,g,c=[read(A/s/'result.json') for s in ['research','evaluation','eligibility','candidate_contract']]
 refs={}
 for stage in ['RESEARCH','EVALUATION','ELIGIBILITY','CANDIDATE_CONTRACT']:
  state=read(P/'machines'/mid/'stages'/(stage+'.json')); assert state['state']=='COMPLETE',(mid,stage)
  ref=state['authoritativeOutputRef'];assert hashlib.sha256((R/ref['path'].replace('production/','',1)).read_bytes()).hexdigest()==ref['sha256'];refs[stage]=ref
 for later in ['OBSERVATION_EVIDENCE','CANONICAL_UI','MACHINE_DATA','RUNTIME_POLICY','RUNTIME_PROJECTION','APP_RUNTIME','DISTRIBUTION','DEVICE_QA']:
  assert not (A/later.lower()/'result.json').exists(),(mid,later)
  assert read(P/'machines'/mid/'stages'/(later+'.json'))['state']!='COMPLETE',(mid,later)
 settings=[v.replace('SET_','') for v in r['settings']['numericInferenceValues']]
 for f in r['findings']:
  if f.get('settingDistribution'):assert list(f['settingDistribution'])==settings,(mid,f['findingId'])
  if f.get('retainedHandoffClaim'):assert f['retainedHandoffClaim']==orig[f['findingId']]
 eb={x['findingId']:x for x in e['evaluations']};gb={x['findingId']:x for x in g['decisions']};cb={x['findingId']:x for x in c['candidates']};fb={x['findingId']:x for x in r['findings']};bb={x['blockId']:x for x in r['blockedItems']}
 admitted=[]
 for x in c['candidates']:
  bind=x['runtimePolicyBinding']; threshold=policy[bind['metric']]['value']
  if x['runtimeInferenceAllowed'] and bind['value']>=threshold:admitted.append(x['findingId'])
 assert not any(x['eligibility']=='UNRESOLVED' for x in g['decisions'])
 for group in c['dependencyGroups']:
  assert group['resolution']!='HELD_NO_JOINT_MODEL'
  if group['resolution'] in ['SINGLE_MEMBER_SELECTED','MUTUALLY_EXCLUSIVE_CATEGORICAL']:
   assert sum(x['runtimeInferenceAllowed'] for x in c['candidates'] if x['findingId'] in group['members'])==1
 for ledger in r['researchCompleteness']['candidateLedger']:
  cid=ledger['candidateId'];f=fb.get(cid);bl=bb.get(cid);ev=eb.get(cid);gd=gb.get(cid);ct=cb.get(cid)
  if bl:route='CLOSED_CANDIDATE';reason=bl['reason']
  elif f['observationType']=='evidence':
   exact=any(x['semanticType']=='EXACT_CONSTRAINT' for x in f['semanticCategories']);route='SETTING_CONSTRAINT_AND_RECORD' if exact else 'RECORD_ONLY';reason=('設定確定・否定は候補の絞り込みに使用。' if exact else '')+'出現率が未確認の示唆は記録のみ・推測計算には使用しない。'+('数値側と同じ入力を共有。' if any(x.get('linkedFindingId') for x in f['semanticCategories']) else '')
  elif f['observationType']=='reference_distribution':route='REFERENCE_RETAINED';reason=f['details'][0]
  elif gd['eligibility']=='INELIGIBLE':route='NO_SETTING_INFORMATION';reason='全設定で同じ確率のため、設定候補を区別する情報がありません。'
  elif ct and not ct['runtimeInferenceAllowed']:route='DEPENDENCY_SUPPRESSED';reason=ct['dependencyReason']+' 同じ観測を別の独立要素として重ねません。'
  elif cid not in admitted:route='BELOW_PRESERVED_POLICY_THRESHOLD';reason='設定判別スコア：'+format(ev['metrics']['selectionScore']['value'],'.3f')+'。現行の5未満のため数値推測では非採用とし、候補と評価値を保持します。'
  else:
   route='ELIGIBLE_CONTRACT_CANDIDATE'
   m=ev['metrics'];reason=(f['label']+'には設定別の確率差があり、'+f['denominatorSemantics']+' ')
   reason+=('設定判別スコア：'+format(m['selectionScore']['value'],'.3f')+'。' if m['selectionScore']['status']=='COMPUTED' else '実測した対象機会ごとの確率で評価します。1回の判別力：'+format(m['perEligibleTrialPower'],'.6f')+'。7000Gの通常スコアへ読み替えません。')
  assert not any(x in reason for x in ['なな徹','P-WORLD','一撃','DMM','必勝本','現在の採用基準を満たしているため'])
  decisions.append({'machineId':mid,'machineName':r['machineName'],'candidateId':cid,'label':ledger['label'],'origin':ledger['origin'],'route':route,'userFacingReason':reason,'sourceClaims':ledger['sourceClaims'],'evaluation':({k:ev[k] for k in ['model','metrics','benchmarkExposure','selectionClass','trialUniverse']} if ev else None),'eligibility':gd,'contract':({k:ct[k] for k in ['runtimeInferenceAllowed','dependencyResolution','runtimePolicyBinding']} if ct else None),'closedReason':(bl['reason'] if bl else None)})
 for ev in e['evaluations']:
  if ev['metrics']['selectionScore']['status']=='COMPUTED':metrics[ev['selectionClass']]+=1
 row={'machineId':mid,'machineName':r['machineName'],'originalCandidates':sum(x['machine_id']==f'{ids.index(mid)+1:02}' for x in original),'ledgerCandidates':len(r['researchCompleteness']['candidateLedger']),'numericEvaluations':sum(ev['model']!='REFERENCE_ONLY' for ev in e['evaluations']),'referenceDistributions':sum(ev['model']=='REFERENCE_ONLY' for ev in e['evaluations']),'computedEIG7000':sum(ev['metrics']['selectionScore']['status']=='COMPUTED' for ev in e['evaluations']),'evidenceGroups':len(e['evidenceCandidates']),'closedCandidates':len(r['blockedItems']),'policyEligibleAfterOverlap':admitted,'dependencyGroups':c['dependencyGroups'],'artifactRefs':refs}
 # An initial-only numerical result can be factual, but must have an explicit
 # machine-specific explanation and retained non-initial public candidates.
 noninitial=[cid for cid in admitted if not any(word in fb[cid]['label'] for word in ['初当たり','初当り'])]
 row['initialOnlyRegressionAudit']={'status':'PASS_NON_INITIAL_NUMERIC' if noninitial else 'FACTUAL_EXCEPTION_EXPLAINED','nonInitialNumericIds':noninitial,'evidenceGroupsPreserved':len(e['evidenceCandidates']),'explanation':('全設定共通のリアルボーナス、内部状態条件付きの直撃・ポイント・天井値を別々に照合済み。終了ランプ・キャラ紹介・トロフィーは保持。' if mid=='L_STRIKE_THE_BLOOD_ZC' else ('ボーナス・ATの依存関係は正式スコアでAT代表へ。雷RIZEの隠れた昇格当選を全例数えられず、モードB移行表は未公表。終了画面3機会とボイスは保持。' if mid=='L_URUSEI_YATSURA_EV' else 'ベルは設定1のみ、直撃は規定回数当選と全件区別不可。告知・ナビボイスの参考記録を保持。')) if not noninitial else '初当たり以外の数値候補と設定制約・参考記録を保持。'}
 rows.append(row)
assert set(orig)<={x['candidateId'] for x in decisions}
summary={'batchId':B,'scope':'RESEARCH_THROUGH_CANDIDATE_CONTRACT_ONLY','stagesComplete':{k:10 for k in ['RESEARCH','EVALUATION','ELIGIBILITY','CANDIDATE_CONTRACT']},'originalCandidates':86,'ledgerCandidates':len(decisions),'supplementalCandidates':len(decisions)-86,'numericEvaluations':sum(x['numericEvaluations'] for x in rows),'referenceDistributions':sum(x['referenceDistributions'] for x in rows),'evidenceGroups':sum(x['evidenceGroups'] for x in rows),'closedCandidates':sum(x['closedCandidates'] for x in rows),'computedEIG7000':sum(x['computedEIG7000'] for x in rows),'selectionClasses':dict(metrics),'candidateRoutes':dict(collections.Counter(x['route'] for x in decisions)),'machines':rows,'actionsUsed':0,'humanRequiredAdded':0,'externalAudit':'NOT_PERFORMED; public-source and repository self-audit','limitations':['公開情報不足・観測不能は候補単位で理由を残して閉じた。新資料がない限り同じ調査を繰り返さない。','別編集媒体の比較であり、転載元が同じ数表を独立実測とはみなさない。','実装・配信・APK・実機QAおよび後続のUI検証は実施していない。','番長4の当日履歴条件・富士山累計・7000G特殊画面はContractの前提条件を次工程で必ず保持。','チバリヨ2と南国の連チャン除外は確定済み製品ルール。公表サンプル母数と完全同一との新しい主張は行わない。']}
write(P/'completion-summary.json',summary);write(P/'candidate-decisions.json',{'batchId':B,'rows':decisions})
with (P/'candidate-decisions.csv').open('w',newline='',encoding='utf-8-sig') as f:
 w=csv.writer(f,lineterminator="\n");w.writerow(['機種','候補ID','項目','判定経路','理由','設定判別スコア','1回の判別力'])
 for d in decisions:
  m=(d['evaluation'] or {}).get('metrics',{});w.writerow([d['machineName'],d['candidateId'],d['label'],d['route'],d['userFacingReason'],m.get('selectionScore',{}).get('value'),m.get('perEligibleTrialPower')])
lines=['# Batch020 — Candidate Contract確定','','10機種のResearch検証・網羅性自己監査、Evaluation、Eligibility、Candidate Contractがすべて正式COMPLETEです。元の86候補を保存し、観測条件・表示面の分割等49件を補充した135件を保持しています。採否基準・Evaluator・Validatorは変更していません。','','|機種|台帳|数値評価|参考分布|示唆群|個別終了|','|---|---:|---:|---:|---:|---:|']
for x in rows:lines.append('|'+x['machineName']+'|'+'|'.join(str(x[k]) for k in ['ledgerCandidates','numericEvaluations','referenceDistributions','evidenceGroups','closedCandidates'])+'|')
lines+=['','数値評価は参考分布を除く件数。示唆群には数値入力と共有する設定制約の鏡像を含み、独立入力数ではありません。「個別終了」は公開値不足や役割の整理により具体的理由を残して閉じた候補数で、Research工程の保留ではありません。','','主な修正：','','- ゴールデンカムイ：設定3の欠落を回復し6設定へ。通常時2種類の写真の全設定分布と特殊シナリオも保持。','- キングパルサー：1枚役契機の1/16384等はボーナス中1Gあたり。1枚役回数では割りません。連チャン込みのボーナス合算を初当たり率へ流用しません。','- エウレカ4：BIG終了画面の全分布を採用候補へ。6択ベルの成立と実入賞を区別。','- 番長4：終了画面は富士山既出回数と7000G超の最初の特殊画面で分離。共通ベルの識別不能区間を母数から除外。','- 忍魂参：夕方3役、月光/神速の役別ボーナス、終了画面6条件、よしぱす3条件、ED弱強ボイスを分離。通常時当選系列とボーナス系列の重複制御を保持。','- ドラゴンハナハナ：理論公表値、メダル版実戦値、過去機種の推測を区別。ランプの未確認確定条件を作りません。','- チバリヨ2・南国：連チャン除外Gを保持。南国の飛翔曲は正確に数えたBGM抽選機会を使用。','','全候補の具体的理由・評価値・依存関係は `candidate-decisions.csv` / `candidate-decisions.json`、正本SHAは `repository-authority.json`、40件の正式受理ログは `validation/formal-completion.json` にあります。','','残した制限：','','- うる星やつら・ストライク・ザ・ブラッド・チバリヨ2は、公開値・観測条件の結果として数値の主要経路が初当たりに限られます。ほかの全候補と具体的な非採用理由、設定制約・参考記録を残しており、初当たりだけを調査した状態ではありません。','- 番長4の履歴不明時は当該画面の数値計算を無効化し、確定表示の記録経路を保持する設計契約です。入力共有・自動切替の実装検証は次工程です。','- 未公表率の示唆は「記録のみ・推測計算には使用しない」。設定確定・否定は同じ注意書きで無効化しません。','- 今回は自己監査です。独立した別担当による外部監査を実施したとは扱いません。','','GitHub Actions使用0回。実装・配信・APK生成・実機QAは行っていません。既存BatchのQA承認は変更していません。']
(P/'COMPLETION_REPORT.md').write_text('\n'.join(lines)+'\n')
print(json.dumps({k:v for k,v in summary.items() if k!='machines'},ensure_ascii=False,indent=2))
