"""Independent finite-count verification and source/candidate preservation audit."""
from prepare import *
import numpy as np
from scipy.special import gammaln,logsumexp,xlogy
from scipy.stats import binom
from benchmark import rows
def exact_multinomial(f,n=7000):
 p=rows(f);h,k=p.shape;assert k<=4
 maxima=[int(binom.ppf(1-1e-13,n,p[:,j].max()))for j in range(k-1)]
 count=np.array(np.meshgrid(*[np.arange(mx+1)for mx in maxima],indexing='ij')).reshape(k-1,-1).T
 count=np.column_stack([count,n-count.sum(axis=1)]);count=count[count[:,-1]>=0]
 lc=gammaln(n+1)-gammaln(count+1).sum(axis=1);lp=np.column_stack([xlogy(count,q).sum(axis=1)for q in p]);lm=logsumexp(lp,axis=1);post=np.exp(lp-lm[:,None]);kl=np.sum(xlogy(post,post*h),axis=1)/np.log(2);mass=np.exp(lc+lm-np.log(h));mi=float(mass@kl)
 omitted=max(sum(binom.sf(maxima[j],n,row[j])for j in range(k-1))for row in p)
 return {'ig7000':mi,'selectionScore':mi*200,'enumeratedCountVectors':len(count),'omittedProbabilityUpperBound':float(omitted),'igErrorUpperBound':float(omitted*np.log2(h)),'retainedMixtureMass':float(mass.sum())}
def audit():
 summaries=[];old_count=0
 for index,mid in enumerate(ORDER):
  p=OUT/mid;r=read(p/'research/result.json');e=read(p/'evaluation/result.json');c=read(p/'candidate_contract/result.json');v=read(p/'verification.json');rec=read(p/'research/reconciliation.json');ledger=r['researchCompleteness']['candidateLedger'];ids={x['candidateId']for x in ledger};assert len(ids)==len(ledger)
  legacy=set(rec['researchFeaturesRetained']+rec['evidenceIdsRetained']);assert legacy<=ids;old_count+=len(legacy);assert rec['packageInputIds']
  for name,h in v['artifactHashes'].items():assert hashlib.sha256((p/name).read_bytes()).hexdigest()==h,(mid,name)
  assert c['evaluationArtifact']['sha256']==v['artifactHashes']['evaluation/result.json'];assert c['eligibilityArtifact']['sha256']==v['artifactHashes']['eligibility/result.json'];assert c['reconciliationArtifact']['sha256']==v['artifactHashes']['research/reconciliation.json']
  declared={s.removeprefix('SET_')for s in r['settings']['values']};assert declared
  for f in r['findings']:
   if f.get('settingDistribution')and f['observationType']!='partial_distribution':assert set(f['settingDistribution'])==declared
   txt=' '.join([f['label'],*f.get('details',[]),f.get('denominatorSemantics','')]);assert not re.search(r'なな徹|一撃|ちょんぼりすた|DMM|パチ7|https?://',txt)
  for b in r['blockedItems']:assert b['runtimeUse']=='DISABLED' and b['reopenPolicy']=='NEW_CONCRETE_SOURCE_ONLY'
  for g in c['dependencyGroups']:
   assert g['resolution']=='PREFERRED_WITH_FALLBACK' or len(g['members'])==1
   if g['resolution']=='PREFERRED_WITH_FALLBACK':
    assert set(g['fallbackOrder'])==set(g['members']);cs={x['findingId']:x for x in c['candidates']};assert all(cs[id]['suppressedByFeatureIds']==g['fallbackOrder'][:j]for j,id in enumerate(g['fallbackOrder']))
  numeric={x['findingId']for x in c['candidates']};partial=[x for x in e['evaluations']if x['model']=='UNAVAILABLE'];assert not numeric.intersection(x['findingId']for x in partial)
  if index>=5:
   grape=read(p/'research/grape-site-means.json');assert grape['fullSettingLikelihood']=='DISABLED_INCOMPLETE_SETTINGS'
   for setting,mean in grape['siteMeans'].items():
    ss=mean['independentSites'];pp=sum(x['hits']/x['eligibleNormalGames']for x in ss)/len(ss);assert abs(pp-mean['equalSiteMeanProbability'])<1e-14;assert abs(1/pp-mean['reciprocalOfProbabilityMean'])<1e-12;assert len({x['site']for x in ss})==len(ss)
  summary={'order':index+1,'machineId':mid,'name':r['machineName'],'status':'ARTIFACTS_VALIDATED_THROUGH_CANDIDATE_CONTRACT','legacyCandidatesPreserved':len(legacy),'ledgerCandidates':len(ledger),'eligibleNumericCandidates':len(c['candidates']),'evidenceFindings':len(c['evidenceCandidates']),'closedBlockedCandidates':len(c['blockedItems']),'incompleteSettingDistributions':len(partial),'scoreRows':[{'id':x['findingId'],'label':x['label'],'score':x['metrics']['selectionScore']['value'],'selectionClass':x['selectionClass']}for x in e['evaluations']if x['metrics']['selectionScore']['status']=='COMPUTED']};summaries.append(summary)
 # Independent exact enumeration on real six-setting BIG/REG data tests complete
 # count-vector MI and the residual. This catches n*I_1 and likelihood-product bugs.
 mid=ORDER[5];r=read(OUT/mid/'research/result.json');f=next(x for x in r['findings']if x.get('trialUniverse')=='NORMAL_GAME_TRIAL'and x.get('observationType')=='appearance_distribution');exact=exact_multinomial(f);mc=read(OUT/mid/'evaluation/multinomial-benchmark.json')[f['findingId']];assert abs(exact['ig7000']-mc['ig7000'])<5*mc['standardErrorBits'];assert abs(exact['retainedMixtureMass']-1)<1e-8
 root=ROOT/'production/batches/batch-20261026-026';report={'manifestVersion':'8.5','scope':'Research/Evaluation/Eligibility/Candidate Contract artifact acceptance; no orchestration state transition, Runtime, distribution or QA mutation.','machineCount':10,'legacyCandidateIdsPreserved':old_count,'totalLedgerCandidates':sum(x['ledgerCandidates']for x in summaries),'allChecks':'PASS','independentExactMiCheck':{'machineId':mid,'findingId':f['findingId'],'exact':exact,'monteCarlo':mc},'machines':summaries,'sourceAuditLimitations':'Inherited bounded standard-site closures retained; current inaccessible pages explicitly recorded. Not an exhaustive all-site certification or an external independent audit.','commonEngineOrValidatorsChanged':False,'numericalAdapter':'Artifact-only categorical benchmark supplement. Pinned legacy evaluation validator accepts original builder-output but cannot accept the resolved categorical benchmark field. Candidate Contract is validated against supplemented Evaluation. This compatibility difference is documented, never hidden or represented as unchanged legacy evaluation-validator acceptance.','runtimeArtifactsProduced':False,'ActionsRequested':0}
 write(root/'validation/final-audit.json',report);return report
if __name__=='__main__':
 r=audit();print(json.dumps({k:r[k]for k in ['machineCount','legacyCandidateIdsPreserved','totalLedgerCandidates','allChecks']},ensure_ascii=False))
