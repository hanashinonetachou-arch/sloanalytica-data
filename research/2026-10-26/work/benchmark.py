"""Machine-artifact numerical integration, not an engine/runtime change.
Equal-setting prior; MI of the complete multinomial count vector (never n*I_1).
"""
import sys,json,pathlib,hashlib,numpy as np
from scipy.special import logsumexp,xlogy
def rows(f):
 ds=f['settingDistribution'];out=[]
 for v in ds.values():
  if isinstance(v,str) and not v.startswith('1/'):
   p=np.array([float(t.split(':')[-1].strip().removesuffix('%'))/100 for t in v.split('/')]);s=p.sum()
   if f.get('categoryModel',{}).get('residualPolicy')=='SOURCE_EXHAUSTIVE':p=p/s
   elif s<1-1e-12:p=np.r_[p,1-s]
   elif abs(s-1)<1e-12:p=p/s
   else:raise ValueError(('MASS',f['findingId'],s))
  else:
   p=float(v[2:]) if isinstance(v,str) else v;p=1/p if isinstance(v,str) else p;p=np.array([p,1-p])
  out.append(p)
 return np.array(out)
def benchmark(f,n=7000,samples=131072):
 p=rows(f);seed=int(hashlib.sha256(json.dumps(p.tolist()).encode()).hexdigest()[:8],16);rng=np.random.default_rng(seed);h=len(p);means=[];variances=[]
 for j in range(h):
  counts=rng.multinomial(n,p[j],size=samples);logs=np.column_stack([xlogy(counts,q).sum(axis=1) for q in p]);v=(logs[:,j]-logsumexp(logs,axis=1)+np.log(h))/np.log(2);means.append(float(v.mean()));variances.append(float(v.var(ddof=1)/samples))
 eig=float(np.mean(means));se=float(np.sqrt(sum(variances))/h)
 return {'ig7000':eig,'selectionScore':eig*200,'standardErrorBits':se,'confidenceInterval95Score':[200*(eig-1.96*se),200*(eig+1.96*se)],'samplesPerSetting':samples,'seed':seed,'method':'STRATIFIED_EQUAL_PRIOR_MULTINOMIAL_MONTE_CARLO','trials':n,'prior':'UNIFORM_DECLARED_SETTINGS','exposureClass':'DERIVED_EXACT','sourceRounding':'Retain published reciprocal rates; residual is 1 minus category sum. No arbitrary integer-frequency fit.','uncertaintyScope':'Numerical integration error only; not uncertainty of empirical source estimates.'}
if __name__=='__main__':
 p=pathlib.Path(sys.argv[1]);r=json.loads((p/'research/result.json').read_text());out={}
 for f in r['findings']:
  if f.get('observationType')=='appearance_distribution' and f['trialUniverse']=='NORMAL_GAME_TRIAL':
   b=benchmark(f)
   if any(b['confidenceInterval95Score'][0]<=x<=b['confidenceInterval95Score'][1] for x in [5,10,20]):b=benchmark(f,samples=1048576)
   out[f['findingId']]=b
 (p/'evaluation').mkdir(exist_ok=True);(p/'evaluation/multinomial-benchmark.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:round(v['selectionScore'],3)for k,v in out.items()}))
