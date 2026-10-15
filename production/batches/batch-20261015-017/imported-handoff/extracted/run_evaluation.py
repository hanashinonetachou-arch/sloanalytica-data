import json,csv,math,os
import numpy as np
from scipy.special import gammaln, logsumexp
source='/mnt/data/work_eval/NUMERIC_MODEL_INPUTS_PRECHECK.json'
records=json.load(open(source));out='/mnt/data/SloAnalytica_Evaluation_Expansion_20261016';os.makedirs(out,exist_ok=True)
def ig(pr,n):
 k=np.arange(n+1,dtype=float);ps=np.clip(np.array(pr,dtype=float),1e-14,1-1e-14)
 ll=(gammaln(n+1)-gammaln(k+1)-gammaln(n-k+1))[:,None]+k[:,None]*np.log(ps)+(n-k)[:,None]*np.log1p(-ps)
 log_joint=ll-math.log(len(ps));log_pred=logsumexp(log_joint,axis=1)
 post=np.exp(log_joint-log_pred[:,None]);h=-np.sum(np.where(post>0,post*np.log2(np.maximum(post,1e-300)),0),axis=1)
 return max(0., math.log2(len(ps))-float(np.dot(np.exp(log_pred),h)))
rows=[];skipped=[];seen=set()
for r in records:
 key=(r['machine'],r['parameter']);
 if key in seen:continue
 seen.add(key)
 if r['parameter']=='BIG_END_DEFAULT_DERIVED' or (r['machine']=='パチスロ ガメラ2' and r['parameter']=='BIG_end_GAMERA_percent'):
  skipped.append({'machine':r['machine'],'parameter':r['parameter'],'reason':'derived_or_duplicate_distribution_category'});continue
 if len(r['settings'])!=6 or r['settings']!=['1','2','3','4','5','6']:
  skipped.append({'machine':r['machine'],'parameter':r['parameter'],'reason':'not_six_settings_complete'});continue
 if r['unit'] not in ['percent','1_over']:
  skipped.append({'machine':r['machine'],'parameter':r['parameter'],'reason':'unhandled_unit'});continue
 probs=[1/x if r['unit']=='1_over' else x/100 for x in r['values']]
 if any(x<0 or x>1 for x in probs):
  skipped.append({'machine':r['machine'],'parameter':r['parameter'],'reason':'invalid_probability'});continue
 for n in (10,50,100,500,1500,3000,7000):
  bits=ig(probs,n)
  rows.append({'machine':r['machine'],'parameter':r['parameter'],'trials':n,'IG_bits':round(bits,9),'score_x200':round(bits*200,6),'denominator':r['opportunity'],'evaluation_status':'trial_count_scenario_not_eligibility','source':r['source']})
with open(out+'/IG_TRIAL_SCENARIOS.csv','w',newline='') as f:
 w=csv.DictWriter(f,fieldnames=rows[0]);w.writeheader();w.writerows(rows)
json.dump({'scenarios':rows,'excluded_or_deduplicated':skipped,'limitations':['Only complete six-setting binomial marginal models','Per-trial models, not 7000 actual play games','Dependent aggregate/detail not additive','Categorical multinomial needs separate joint model']},open(out+'/IG_TRIAL_SCENARIOS.json','w'),ensure_ascii=False,indent=2)
print('model_count',len(rows)//7,'scenario_rows',len(rows),'skipped',len(skipped))
for x in rows:
 if x['trials']==7000: print(x['machine'],x['parameter'],x['score_x200'])
