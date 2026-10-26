import json,pathlib,numpy as np,hashlib
from scipy.special import xlogy,logsumexp
from benchmark import rows
base=pathlib.Path('data/production/batches/batch-20261026-026/artifacts')
for d in base.iterdir():
 r=json.load(open(d/'research/result.json'));c=json.load(open(d/'candidate_contract/result.json'))
 eligible=[f for f in c['candidates'] if f.get('runtimeInferenceAllowed') and f['trialUniverse']=='NORMAL_GAME_TRIAL' and f.get('runtimePolicyBinding',{}).get('metric')=='SELECTION_SCORE' and f['runtimePolicyBinding']['value']>=5]
 out=[]
 for f in eligible:
  rf=next(x for x in r['findings'] if x['findingId']==f['findingId']);p=rows(rf);keys=list(rf['settingDistribution']);low=[i for i,k in enumerate(keys) if k in ['1','2']];high=[i for i,k in enumerate(keys) if k in ['5','6']]
  if not low or not high:continue
  seed=int(hashlib.sha256((d.name+f['findingId']).encode()).hexdigest()[:8],16);rng=np.random.default_rng(seed);results=[]
  for n in [1500,3000,7000]:
   means=[];vars=[]
   for band,indices in enumerate([low,high]):
    for j in indices:
     counts=rng.multinomial(n,p[j],size=131072);logs=np.column_stack([xlogy(counts,q).sum(axis=1) for q in p]);lo=logsumexp(logs[:,low],axis=1)-np.log(len(low));hi=logsumexp(logs[:,high],axis=1)-np.log(len(high));correct=(hi>lo if band else lo>hi).astype(float)+0.5*(hi==lo);means.append(float(correct.mean())/len(indices)/2);vars.append(float(correct.var(ddof=1)/len(correct))/(2*len(indices))**2)
   acc=sum(means);se=np.sqrt(sum(vars));results.append({'games':n,'balancedAccuracyPercent':round(100*acc,2),'numerical95IntervalPercent':[100*(acc-1.96*se),100*(acc+1.96*se)]})
  out.append({'feature':f,'results':results,'seed':seed})
 out.sort(key=lambda x:x['results'][-1]['balancedAccuracyPercent'],reverse=True);best=out[0]
 h={'status':'COMPUTED','method':'BEST_SINGLE_EXACT_ACTIVE_FEATURE','bandDefinition':{'lowSettings':'SETTING_1_TO_2','highSettings':'SETTING_5_TO_6','classPrior':'BALANCED'},'selectedFeatureId':best['feature']['findingId'],'selectedFeatureLabel':best['feature']['label'],'results':best['results'],'eligibleFeatureIds':[x['feature']['findingId'] for x in out],'note':'低設定1・2と高設定5・6を同じ事前確率で比較します。設定3・4はこの参考指標のみ除外します。独立性を仮定せず、通常時の単独要素で算出した参考値です。','numericalIntegration':{'method':'STRATIFIED_MULTINOMIAL_MONTE_CARLO','samplesPerSetting':131072,'seed':best['seed'],'source':'Frozen Candidate Contract; Manifest HLD-001'}}
 (d/'high-low-benchmark.json').write_text(json.dumps(h,ensure_ascii=False,indent=2)+'\n');print(d.name,best['feature']['findingId'],h['results'][-1]['balancedAccuracyPercent'])
