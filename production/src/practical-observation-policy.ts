/** Product counting rules. These do not assert that a publisher used the same sample definition. */
export function classifyPracticalHit(kind:'AT'|'OKISLOT',state:'NORMAL'|'AT'|'RETURN_ZONE'|'CHAIN_ZONE'){
 if(!['AT','OKISLOT'].includes(kind)||!['NORMAL','AT','RETURN_ZONE','CHAIN_ZONE'].includes(state))throw new Error('PRACTICAL_HIT_STATE_REQUIRED');
 if(kind==='AT'&&state==='CHAIN_ZONE'||kind==='OKISLOT'&&state==='RETURN_ZONE')throw new Error('PRACTICAL_HIT_STATE_KIND_MISMATCH');
 return state==='NORMAL'?'INITIAL_HIT':'CONTINUATION_EXCLUDED';
}
export function practicalNonChainGames(totalGames:number,excludedGames:number){
 if(!Number.isSafeInteger(totalGames)||!Number.isSafeInteger(excludedGames)||totalGames<0||excludedGames<0||excludedGames>totalGames)throw new Error('PRACTICAL_EXCLUDED_GAMES_INVALID');
 return totalGames-excludedGames;
}

export function validatePracticalObservationPolicy(d:any){
 const policy=d.productObservationPolicy;if(!policy)return;
 if(policy.authority!=='USER_EXPLICIT_INSTRUCTION'||policy.publishedDenominatorEquivalence!=='NOT_ASSERTED')throw new Error('PRACTICAL_POLICY_AUTHORITY_OR_SCOPE_INVALID');
 const kind=policy.countingRule==='OKISLOT_CHAIN_ZONE_EXCLUDED'?'OKISLOT':policy.countingRule==='AT_AFTER_CLEAR_RETURN_ZONE_INITIAL'?'AT':null;
 if(!kind)throw new Error('PRACTICAL_POLICY_COUNTING_RULE_INVALID');
 for(const f of d.findings??[]){
  if((policy.excludedFindingIds??[]).includes(f.findingId))throw new Error('USER_EXCLUDED_FINDING_ACTIVE:'+f.findingId);
  if(!f.operationalCounting)continue;
  if(f.operationalCounting.authority!==policy.authority||f.operationalCounting.policyArtifact!==policy.artifact||f.operationalCounting.publishedDenominatorEquivalence!=='NOT_ASSERTED')throw new Error('PRACTICAL_FINDING_POLICY_DRIFT:'+f.findingId);
  if(kind==='OKISLOT'&&!['LOTIS_NON_CHAIN_GAME_TRIAL','NON_CHAIN_BONUS_INITIAL_GAME_TRIAL'].includes(f.trialUniverse))throw new Error('PRACTICAL_CHAIN_EXCLUSION_INPUT_MISSING:'+f.findingId);
  classifyPracticalHit(kind,kind==='OKISLOT'?'CHAIN_ZONE':'RETURN_ZONE');
 }
}
