import json, math, pathlib, subprocess
import numpy as np
from scipy.special import gammaln, logsumexp, xlogy

root=pathlib.Path(__file__).parent
report=json.loads((root/'runtime-check.json').read_text())
pkg=report['package']; features={f['featureId']:f for f in pkg['features']['features']}
settings=pkg['machine']['settings']; max_error=0
for case in report['results']:
    logs=np.zeros(len(settings))
    for name in case['active']:
        f=features[name]; values=case['input']; n=values[f['denominatorInputId']]
        if f['modelType']=='binomial':
            k=values[f['numeratorInputId']]
            ps=np.array([f['probabilities'][s] for s in settings])
            logs+=k*np.log(ps)+(n-k)*np.log1p(-ps)
        else:
            assert name=='PREDECESSOR'
            b=values['INP_PREDECESSOR_BIG_COUNT']; r=values['INP_PREDECESSOR_REG_COUNT']
            counts=np.array([b,r,n-b-r])
            for i,s in enumerate(settings):
                ps=np.array(f['categoryProbabilities'][s]); assert abs(sum(ps)-1)<1e-12
                logs[i]+=np.sum(xlogy(counts,ps))
    allowed=np.array([s in case['remaining'] for s in settings])
    if not case['evidenceValid'] or not any(allowed):
        expected=np.zeros(len(settings))
    else:
        logs[~allowed]=-np.inf
        expected=np.exp(logs-logsumexp(logs))
    actual=np.array([case['posterior'][s] for s in settings])
    max_error=max(max_error,float(np.max(abs(expected-actual))))
    assert np.allclose(actual,expected,atol=2e-7,rtol=0),case['id']

data_repo=root.parents[4]
baseline=json.loads(subprocess.check_output(['git','show','eeb059c717a4d42ee34a7d806574270bd9cd56d0:production/research-inbox/batch025/reviewed/LB_THUNDER_V_HA.json'],cwd=data_repo))
research=json.loads((data_repo/'production/research-inbox/batch025/reviewed/LB_THUNDER_V_HA.json').read_text())
before={f['findingId']:f['settingDistribution'] for f in baseline['findings'] if 'settingDistribution' in f}
after={f['findingId']:f['settingDistribution'] for f in research['findings'] if 'settingDistribution' in f}
assert before==after and len(after)==40
assert baseline['blockedItems']==research['blockedItems']
assert [f for f in baseline['findings'] if f['observationType']=='evidence']==[f for f in research['findings'] if f['observationType']=='evidence']
evaluation=json.loads((root.parents[1]/'artifacts/LB_THUNDER_V_HA/evaluation/result.json').read_text())
score_checks=[]
for f in evaluation['evaluations']:
    if f['metrics']['selectionScore']['status']!='COMPUTED': continue
    vs=[float(x[2:]) if isinstance(x,str) and x.startswith('1/') else 1/x for x in f['settingDistribution'].values()]
    ps=1/np.array(vs); n=7000; k=np.arange(n+1)
    log_choose=gammaln(n+1)-gammaln(k+1)-gammaln(n-k+1)
    log_mass=log_choose[None,:]+k[None,:]*np.log(ps[:,None])+(n-k)[None,:]*np.log1p(-ps[:,None])
    log_mix=logsumexp(log_mass,axis=0)-math.log(len(ps))
    score=float(np.sum(np.exp(log_mass)*(log_mass-log_mix))/len(ps)/math.log(2)*200)
    stored=f['metrics']['selectionScore']['value']; assert abs(score-stored)<1e-6
    score_checks.append({'findingId':f['findingId'],'independentScore':score,'storedScore':stored})

changed=subprocess.check_output(['git','diff','--name-only','eeb059c717a4d42ee34a7d806574270bd9cd56d0'],cwd=data_repo,text=True).splitlines()
assert not any(p.startswith(('production/src/','production/config/','production/test/')) for p in changed)
assert not any('/artifacts/' in p and '/LB_THUNDER_V_HA/' not in p for p in changed)
assert not any('/machines/' in p and '/LB_THUNDER_V_HA/' not in p for p in changed)
out={'status':'PASS','posteriorCases':27,'maximumPosteriorAbsoluteError':max_error,'unchangedSourceTables':40,'exactEIG7000Checks':score_checks,'evidenceAndBlocksUnchanged':True,'sharedBuildersAndPolicyChanged':False,'otherMachineArtifactsChanged':False}
(root/'independent-check.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({**out,'exactEIG7000Checks':len(score_checks)},ensure_ascii=False))
