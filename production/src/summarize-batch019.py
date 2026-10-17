import json,pathlib,collections,hashlib,subprocess
R=pathlib.Path(__file__).resolve().parents[1];B='batch-20261017-019';P=R/'batches'/B
read=lambda p:json.loads(p.read_text());write=lambda p,x:p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
spec=read(P/'batch.json');rows=[];decisions=[];classes=collections.Counter();original=read(R/'research-inbox/batch019/imported-handoff/candidates_v9.json');orig={c['candidate_id']:c for c in original}
for mid in sum([w['machineIds'] for w in spec['waves']],[]):
 A=P/'artifacts'/mid;docs={s:read(A/s/'result.json') for s in ['research','evaluation','eligibility','candidate_contract']};r,e,g,c=[docs[s] for s in docs]
 for stage in ['RESEARCH','EVALUATION','ELIGIBILITY','CANDIDATE_CONTRACT']:assert read(P/'machines'/mid/'stages'/(stage+'.json'))['state']=='COMPLETE',(mid,stage)
 eb={v['findingId']:v for v in e['evaluations']};gb={v['findingId']:v for v in g['decisions']};cb={v['findingId']:v for v in c['candidates']};fb={v['findingId']:v for v in r['findings']};bb={v['blockId']:v for v in r['blockedItems']}
 for ev in e['evaluations']:
  if ev['metrics']['selectionScore']['status']=='COMPUTED':classes[ev['selectionClass']]+=1
 refs={k:read(P/'machines'/mid/'stages'/(k+'.json'))['authoritativeOutputRef'] for k in ['RESEARCH','EVALUATION','ELIGIBILITY','CANDIDATE_CONTRACT']}
 effect=[]
 for x in c['candidates']:
  b=x['runtimePolicyBinding'];threshold=5 if b['metric']=='SELECTION_SCORE' else 0
  if x['runtimeInferenceAllowed'] and b['value']>=(threshold if threshold else 1e-15):effect.append(x['findingId'])
 rows.append({'machineId':mid,'machineName':r['machineName'],'originalCandidates':sum(x['machine_id']==orig[next(k for k in orig if k in {v['candidateId'] for v in r['researchCompleteness']['candidateLedger']})]['machine_id'] for x in original),'ledgerCandidates':len(r['researchCompleteness']['candidateLedger']),'numericalEvaluations':len(e['evaluations']),'computedEIG7000':sum(x['metrics']['selectionScore']['status']=='COMPUTED' for x in e['evaluations']),'evidenceGroups':len(e['evidenceCandidates']),'blocked':len(r['blockedItems']),'eligibleCandidates':len(c['candidates']),'dependencyGroups':c['dependencyGroups'],'policyEligibleAfterOverlap':effect,'artifactRefs':refs})
 for ledger in r['researchCompleteness']['candidateLedger']:
  fid=ledger['candidateId'];ev=eb.get(fid);gd=gb.get(fid);ct=cb.get(fid);f=fb.get(fid);b=bb.get(fid)
  if b:route='BLOCKED';reason=b['reason']
  elif f['observationType']=='evidence':
   route='EXACT_AND_OR_RECORD_ONLY';reason='設定確定・否定だけ候補の絞り込み。未知出現率・推定示唆は記録のみ。'
  elif gd['eligibility']!='ELIGIBLE':route=gd['eligibility'];reason=gd['reason']
  elif ct and not ct['runtimeInferenceAllowed']:route='SUPPRESSED_BY_DEPENDENCY';reason=ct['dependencyReason']+' 代表：'+str(ct.get('resolvedIntoFindingId',''))
  elif fid not in effect:route='BELOW_RUNTIME_POLICY_THRESHOLD';reason='7000G設定判別スコアが5未満のため現行の数値推測対象にしません。候補・評価値は保持。'
  else:route='ELIGIBLE_CONTRACT_CANDIDATE';reason=('7000Gの設定間の情報量と実測条件を満たす。' if ev['metrics']['selectionScore']['status']=='COMPUTED' else '実測できる条件付き試行の設定別確率を使用。7000Gへの試行数換算は未確定のため試行あたり情報量で扱う。')
  decisions.append({'machineId':mid,'candidateId':fid,'label':ledger['label'],'origin':ledger['origin'],'route':route,'reason':reason,'sourceClaims':ledger['sourceClaims'],'observedScope':f.get('denominatorSemantics',f.get('details')) if f else b.get('retainedHandoffClaim'),'evaluation':ev,'eligibilityDecision':gd,'contractCandidate':ct,'block':b})
summary={'batchId':B,'scope':'RESEARCH_TO_CANDIDATE_CONTRACT_ONLY','stagesComplete':{s:10 for s in ['RESEARCH','EVALUATION','ELIGIBILITY','CANDIDATE_CONTRACT']},'originalCandidates':len(original),'ledgerCandidates':len(decisions),'supplementalCandidates':len(decisions)-len(original),'numericalEvaluations':sum(x['numericalEvaluations'] for x in rows),'evidenceGroups':sum(x['evidenceGroups'] for x in rows),'blocked':sum(x['blocked'] for x in rows),'computedEIG7000':sum(x['computedEIG7000'] for x in rows),'selectionClasses':dict(classes),'candidateRoutes':dict(collections.Counter(x['route'] for x in decisions)),'machines':rows,'limits':['候補探索はLIMITED_CLOSEOUT。全公開情報に未知候補がないとの証明ではない。','独立外部監査は未実施。今回実施したのはRepository照合と出典の自己監査。','数値が揃っても内部状態を全例識別できない候補は個別に閉じる。','Candidate Contractの完了は公開・実装・実機QAの完了を意味しない。','数値採用は既存の重複制御とRuntime Policyを維持。試行単位候補を7000G評価済みとは扱わない。'],'actionsUsed':0,'humanRequiredAdded':0}
assert set(orig)<={x['candidateId'] for x in decisions}
write(P/'completion-summary.json',summary);write(P/'candidate-decisions.json',{'batchId':B,'rows':decisions})
lines=['# Batch019 — Research照合からCandidate Contractまで完了','','元90候補を削除せず再利用し、既存Researchとの照合で必要な内訳・明示的な設定制約9件を加えた99件を保持。既存のEvaluator・Eligibility・Candidate Contract builder・Validator・採否閾値は変更していません。','','|機種|台帳|数値評価|EIG7000|示唆群|BLOCK|','|---|---:|---:|---:|---:|---:|']
for x in rows:lines.append('|'+x['machineName']+'|'+'|'.join(str(x[k]) for k in ['ledgerCandidates','numericalEvaluations','computedEIG7000','evidenceGroups','blocked'])+'|')
lines+=['','Research / Evaluation / Eligibility / Candidate Contractは各10/10が正式COMPLETE。候補別の評価値・採否経路・BLOCK理由・依存関係は `candidate-decisions.json` と各正式成果物に記録。','','## 照合で解消した主な差分','','- カバネリ：既存の完全な設定別表を再利用。CZ内の条件付き観測も初当りとは別候補として保持。','- ハイパーラッシュ：9種のフラグ値と実機の決まり手チェックを確認。ボーナス成立結果との重複は正式スコアによる代表選択で解決。トロフィーの不確かな候補は他機種から転用しない。','- なめ猫：全設定共通の初当り1/155は明記された資料で確認。設定差なしとして除外。BIG初当りの設定差を保持。','- ToLOVEる：隠れ凪は2024年版に存在。ただし示唆の意味は他機種を参考とした推定なので記録のみ。','- 炎炎：ループ設定6の1/537と1/573は限定再確認後も候補単位で隔離。メーカー合算と同一にしない。REGシナリオとJAC開始キャラは個別出典へリンクし数値と制約を保持。炎炎ボーナス終了画面の設定6赤枠は2%、残りのシルエットは55%へ訂正。','','## 残した制限','','- ハードボイルド通常REGのAT当選は、REG中の別抽選との全例識別が確認できずBLOCK。','- 聖闘士星矢のモード・低確条件、ティガの内部天井選択などは観測不能・部分表として個別理由で閉じています。','- 未公表の出現率を設定差として計算しません。未知率だけのセクションの説明、出典名を画面に出さない規約は後続工程にも継承。','- 外部監査は未実施。既存Researchの90候補外の未再評価項目は元のbaselineに保持しており、全項目再監査完了とは主張しません。','','## 実行範囲と再開','','GitHub Actions使用0回。実装・配信・APK・QAは対象外。既存完了Batch・配信データ・App・既存QA承認は変更しません。後続工程を実行する指示があった場合のみ、Observation/Evidence以降へ進みます。通常のWave2は前WaveのDistribution後にResearchを解放しますが、今回の全10機種・契約までという明示スコープに合わせ、READY Researchを既存OrchestratorのAttempt/Lease/CAS/Validatorで順次受理しました。schedulerや波形の規則は変更せず、配信を先行させるための状態操作もしていません。','','検証結果は `validation/verification.json`。Production正本とAppの固定SHAは `repository-authority.json`。']
(P/'COMPLETION_REPORT.md').write_text('\n'.join(lines)+'\n')
print(json.dumps({k:v for k,v in summary.items() if k!='machines'},ensure_ascii=False))
