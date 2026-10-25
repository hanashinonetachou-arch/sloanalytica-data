"""Independent oracle: no imports from application/builders and no engine-selected IDs as inputs."""
import json, math
from pathlib import Path
import numpy as np
from scipy.stats import binom
base=Path(__file__).parent/'correction-20261025'
p=json.loads((base/'machine-package.json').read_text());report=json.loads((base/'verification.json').read_text())
features={f['featureId']:f for f in p['features']['features']};settings=['SET_1','SET_2','SET_5','SET_6']
normal=['BELL_B','CHERRY_B','BELL_A','REG','WATER_A','WATER_B','OVERLAP_BELL_A'];big=['BIG_BELL_B','BIG_BELL_C','BIG_REACH']
def valid(x):return isinstance(x,(int,float)) and math.isfinite(x) and x>=0 and int(x)==x and x<=2**53-1

def expected(v):
 result=[];logs=np.zeros(4)
 counts=[v.get(features[x]['numeratorInputId']) for x in big];n=v.get(features[big[0]]['denominatorInputId'])
 big_bad=valid(n) and sum(x for x in counts if valid(x))>n
 for group in (normal,big):
  if group==big and big_bad:continue
  for id in group:
   f=features[id];n=v.get(f['denominatorInputId']);k=v.get(f['numeratorInputId'])
   if valid(n) and n>0 and valid(k) and k<=n:
    result.append(id);q=np.array([f['probabilities'][s] for s in settings]);logs+=k*np.log(q)+(n-k)*np.log1p(-q);break
 n=v.get('INP_PREDECESSOR_GAMES');b=v.get('INP_PREDECESSOR_BIG_COUNT');r=v.get('INP_PREDECESSOR_REG_COUNT')
 if valid(n) and n>0 and valid(b) and valid(r) and b+r<=n:
  result.append('PREDECESSOR');q=features['PREDECESSOR']['categoryProbabilities']
  for i,s in enumerate(settings):logs[i]+=np.dot([b,r,n-b-r],np.log(q[s]))
 remaining=set(settings)
 if valid(v.get('REF_BIG_END_2')) and v['REF_BIG_END_2']>0:remaining.discard('SET_1')
 if valid(v.get('REF_BIG_1G_END_2')) and v['REF_BIG_1G_END_2']>0:remaining.discard('SET_1')
 if valid(v.get('REF_REG_END_2')) and v['REF_REG_END_2']>0:remaining&={'SET_5','SET_6'}
 weights=np.array([math.exp(logs[i]-max(logs[j] for j,s in enumerate(settings) if s in remaining)) if s in remaining else 0 for i,s in enumerate(settings)])
 return result,dict(zip(settings,(weights/weights.sum()).tolist()))
errors=[]
for case in report['results']:
 ids,post=expected(case['input']);assert sorted(ids)==sorted(case['active']),case['id'];error=max(abs(post[s]-case['posterior'][s]) for s in settings);assert error<1e-10,(case['id'],error);errors.append(error)
research=json.loads((base/'research.json').read_text());evaluations=json.loads((base/'evaluation.json').read_text())
def probs(f):return np.array([float(f['settingDistribution'][s]) if isinstance(f['settingDistribution'][s],(int,float)) else 1/float(f['settingDistribution'][s][2:]) for s in ['1','2','5','6']])
def eig(ps,n):
 mass=np.array([binom.pmf(np.arange(n+1),n,x) for x in ps]);mean=mass.mean(axis=0);ratio=np.divide(mass,mean,where=mean>0,out=np.ones_like(mass));return float(np.sum(np.where(mass>0,mass*np.log2(np.maximum(ratio,1e-300)),0))/4)
def accuracy(ps,n):
 mass=np.array([binom.pmf(np.arange(n+1),n,x) for x in ps]);return float(.5*np.maximum(mass[:2].mean(axis=0),mass[2:].mean(axis=0)).sum()*100)
priority={};score_errors=[]
for id in ['REG','BELL_A','BELL_B','WATER_A','WATER_B','CHERRY_B',*big,'OVERLAP_BELL_A']:
 f=next(x for x in research['findings'] if x['findingId']==id);ps=probs(f);is_normal=id in normal and not id.startswith('OVERLAP_');n=7000 if is_normal else 1;value=eig(ps,n)*200
 ev=next(x for x in evaluations['evaluations'] if x['findingId']==id);stored=ev['metrics']['selectionScore']['value'] if is_normal else ev['metrics']['perEligibleTrialPower'];score_errors.append(abs(value-stored));assert abs(value-stored)<1e-6,(id,value,stored)
 priority[id]={'score' if is_normal else 'perTrialPower':value,'EIG_bits_by_trials':{str(n):eig(ps,n) for n in ([7000] if is_normal else [1,100,300,1000])}}
hld={id:[{'games':n,'percent':accuracy(probs(next(x for x in research['findings'] if x['findingId']==id)),n)} for n in [1500,3000,7000]] for id in ['BELL_A','BELL_B']}
for actual,stored in zip(hld['BELL_A'],p['v8']['machineResearchSummary']['highLowDiscrimination']['results']):assert round(actual['percent'],2)==stored['balancedAccuracyPercent']
assert len(research['findings'])==43
out={'status':'PASS','oracle':'Python scipy binomial pmf and direct log likelihood; no App imports','scenarios':len(errors),'maxPosteriorAbsoluteError':max(errors),'maxScoreAbsoluteError':max(score_errors),'highLow':hld,'priority':priority}
(base/'independent-oracle.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps(out,ensure_ascii=False))
