/** Fail closed when approved user-facing rationale is replaced without an explicit review. */
export function guardApprovedAdoptionReasons(previous:any,next:any,approvedChanges:readonly string[]=[]){
 const prev=previous?.v8?.machineResearchSummary?.adopted;
 const curr=next?.v8?.machineResearchSummary?.adopted;
 if(!Array.isArray(prev)||!Array.isArray(curr))throw Error('ADOPTION_GUARD_SUMMARY_MISSING');
 const old=new Map<string,any>();for(const e of prev){if(!e?.featureId||old.has(e.featureId))throw Error('ADOPTION_GUARD_DUPLICATE_OLD');old.set(e.featureId,e)}
 const fresh=new Map<string,any>();for(const e of curr){if(!e?.featureId||fresh.has(e.featureId))throw Error('ADOPTION_GUARD_DUPLICATE_NEW');fresh.set(e.featureId,e)}
 const allowed=new Set(approvedChanges);
 const stable=(v:any):string=>JSON.stringify(v,Object.keys(v??{}).sort());
 const oldFeatures=new Map((previous?.features?.features??[]).map((x:any)=>[x.featureId,x]));
 const newFeatures=new Map((next?.features?.features??[]).map((x:any)=>[x.featureId,x]));
 const changed:string[]=[];
 for(const [id,e] of old){
  const n=fresh.get(id);if(!n){if(!allowed.has(id))throw Error('ADOPTION_GUARD_REMOVED:'+id);changed.push(id);continue}
  const oldReason=String(e.reason??'').trim(),newReason=String(n.reason??'').trim();
  if(!newReason)throw Error('ADOPTION_GUARD_EMPTY:'+id);
  if(oldReason===newReason)continue;
  if(!allowed.has(id))throw Error('ADOPTION_GUARD_UNREVIEWED:'+id);
  changed.push(id);
 }
 for(const [id,e] of fresh)if(!old.has(id)&&!String(e.reason??'').trim())throw Error('ADOPTION_GUARD_NEW_EMPTY:'+id);
 for(const id of allowed)if(!old.has(id)&&!fresh.has(id))throw Error('ADOPTION_GUARD_UNKNOWN_APPROVAL:'+id);
 return {status:'PASS',preserved:old.size-changed.length,reviewedChanges:changed};
}
