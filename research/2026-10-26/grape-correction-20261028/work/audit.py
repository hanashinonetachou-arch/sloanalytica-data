"""Independent numerical and preservation checks for this bounded correction."""
import json, pathlib, hashlib, math
import numpy as np
from scipy.stats import binom
from scipy.special import logsumexp

ROOT=pathlib.Path('data') if pathlib.Path('data/production').exists() else pathlib.Path('.'); B='batch-20261026-026'; REV='grape-correction-20261028'
W=ROOT/'research/2026-10-26'/REV/'work'; P=ROOT/'production/batches'/B
BASE=pathlib.Path('correction-baseline/production/batches')/B
read=lambda p:json.loads(p.read_text())
result=read(W/'result.json'); rows=[]
for m in result['machines']:
    mid=m['machineId']; a=P/'artifacts'/mid; b=BASE/'artifacts'/mid
    r,e,el,c=[read(a/st/'result.json') for st in ('research','evaluation','eligibility','candidate_contract')]
    oldr,olde,oldc=[read((b/st/'result.json') if (b/st/'result.json').exists() else (a/st/f'before-{REV}.json')) for st in ('research','evaluation','candidate_contract')]
    assert [x['candidateId'] for x in r['researchCompleteness']['candidateLedger']]==[x['candidateId'] for x in oldr['researchCompleteness']['candidateLedger']]
    assert r['blockedItems']==oldr['blockedItems']
    for oc in oldc['candidates']:
        nc=next(x for x in c['candidates'] if x['findingId']==oc['findingId'])
        assert nc['settingDistribution']==oc['settingDistribution']
        assert nc['runtimePolicyBinding']==oc['runtimePolicyBinding']
        oe=next(x for x in olde['evaluations'] if x['findingId']==oc['findingId'])
        ne=next(x for x in e['evaluations'] if x['findingId']==oc['findingId'])
        for k in ('metrics','benchmarkExposure','selectionClass','model','evaluationCompleteness'):
            assert oe[k]==ne[k],(mid,k)
        if oc['trialUniverse']=='PREDECESSOR_NORMAL_GAME_TRIAL':assert oc==nc
    for st in ('RESEARCH','EVALUATION','ELIGIBILITY','CANDIDATE_CONTRACT'):
        state=read(P/'machines'/mid/'stages'/f'{st}.json'); assert state['state']=='COMPLETE'
        ref=state['authoritativeOutputRef']; assert hashlib.sha256((ROOT/ref['path']).read_bytes()).hexdigest()==ref['sha256']
    for st in ('OBSERVATION_EVIDENCE','CANONICAL_UI','MACHINE_DATA','RUNTIME_POLICY','RUNTIME_PROJECTION','APP_RUNTIME','DISTRIBUTION'):
        state=read(P/'machines'/mid/'stages'/f'{st}.json');assert state['state']=='READY' and 'authoritativeOutputRef' not in state
        assert state['executionScope']=='NOT_AUTHORIZED_IN_THIS_CORRECTION'
    assert read(P/'machines'/mid/'stages/DEVICE_QA.json')['state']=='PENDING'
    g=next(x for x in e['evaluations'] if 'GRAPE_CANDIDATE' in x['findingId'])
    row={'machineId':mid,'candidateIdsPreserved':True,'bonusVectorsScoresAndPoliciesPreserved':True,'unrelatedBlockedItemsPreserved':True,'authoritativeOutputHashesValid':True}
    if mid=='S_MR_JUGGLER_KK':
        assert not any('GRAPE_CANDIDATE' in x['findingId'] for x in c['candidates'])
        assert c['observationContract']['grapeInputPolicy']['recordInputAllowed'] is False
        assert c['observationContract']['grapeInputPolicy']['numericInferenceAllowed'] is False
        assert c['userDecision']['disposition']=='USER_EXCLUDED_NO_INPUT'
        assert g['metrics']['selectionScore']['value'] is None
        row['userExclusionAndNoInputContractVerified']=True
    else:
        audit=read(W/mid/'source-audit.json'); means=audit['effectiveMeans']
        assert list(means)==list(map(str,range(1,7)))
        for s,v in means.items():
            terms=v['terms'];assert len(terms)==len({x['originId'] for x in terms})==len({x['publisher'] for x in terms})
            for x in terms:
                p=x['hits']/x['eligibleGames'] if x.get('hits') is not None else 1/x['reciprocal']
                assert math.isclose(p,x['probability'],abs_tol=1e-15)
            p=sum(x['probability'] for x in terms)/len(terms)
            assert math.isclose(p,v['probability'],abs_tol=1e-15) and math.isclose(p,g['settingDistribution'][s],abs_tol=1e-15)
        ps=np.array([means[str(i)]['probability'] for i in range(1,7)])
        logs=binom.logpmf(np.arange(7001)[:,None],7000,ps)
        marginal=logsumexp(logs,axis=1)-np.log(6)
        ig=np.sum(np.exp(logs)*(logs-marginal[:,None]))/(6*np.log(2))
        score=float(ig*200); actual=g['metrics']['selectionScore']['value'];assert abs(score-actual)<1e-7,(mid,score,actual)
        gc=next(x for x in c['candidates'] if x['findingId']==g['findingId'])
        assert gc['dependencyResolution']=='FALLBACK_MEMBER' and gc['runtimeInferenceAllowed']
        assert gc['suppressedByFeatureIds']==[g['findingId'].replace('GRAPE_CANDIDATE','SELF_BONUS_OUTCOME')]
        row.update(independentScipyExact7000Score=score,productionScore=actual,absoluteError=abs(score-actual),sourceMeansAndDistinctOriginsVerified=True,dependencyFallbackVerified=True)
    rows.append(row)
provenance=[json.loads(x) for x in (P/'provenance'/f'{REV}.jsonl').read_text().splitlines()]
workids={x['workId'] for x in provenance};assert len(workids)==20
requests=[read(P/'work-requests'/f'{wid}.json') for wid in sorted(workids)]
results=[read(P/'work-results'/f'{wid}.json') for wid in sorted(workids)]
leases=[read(P/'leases'/f"{q['leaseId']}.json") for q in requests]
assert len(leases)==len(requests)==len(results)==20
assert all(x['status']=='RELEASED' for x in leases)
assert all(x['status']=='SUCCESS' for x in results)
assert len({x['workId'] for x in requests})==20
metadata=read(W/'baseline-production.json')['pinnedProductionSources']
for x in metadata:
    p=ROOT/x['path']; blob=p.read_bytes();gitsha=hashlib.sha1(b'blob '+str(len(blob)).encode()+b'\0'+blob).hexdigest()
    assert gitsha==x['sha'],x['path']
out={'status':'PASS','batchId':B,'correctionId':REV,'machines':rows,'acceptedWorkResults':20,'releasedLeases':20,'independentMethod':'SciPy Binomial(7000,p), six-setting uniform-prior exact finite mutual information; score=200*I; no n*I1 approximation.','sharedProductionSourcesUnchanged':True,'scope':'Research through Candidate Contract only; no implementation/distribution/APK/device QA'}
(W/'independent-audit.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'status':'PASS','machines':len(rows),'acceptedWorkResults':20,'maxScoreError':max(x.get('absoluteError',0) for x in rows)}))
