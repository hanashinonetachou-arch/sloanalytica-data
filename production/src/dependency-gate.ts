const COMPUTABLE_TYPES=new Set(['probability','conditional_probability','appearance_distribution']);
const REVIEW_STATUSES=new Set(['INDEPENDENT','SHARED_DENOMINATOR','NESTED_OUTCOME','CAUSAL_PATH_OVERLAP','DEPENDENT','CONDITIONAL','AGGREGATE_COMPONENT','MUTUALLY_EXCLUSIVE','MUTUALLY_EXCLUSIVE_CATEGORIES','UNRESOLVED','CONDITIONALLY_SEPARATE']);
const numeric=(f:any)=>f?.settingDistribution&&COMPUTABLE_TYPES.has(String(f?.observationType??''));
export function buildDependencyReview(findings:any[]){
 const candidates=(findings??[]).filter(numeric),byId=new Map<string,any>(),pending:any[]=[];
 for(const f of candidates){
  const review=f.dependencyReview;const status=review?.status;
  if(status!==undefined&&!REVIEW_STATUSES.has(String(status)))throw new Error('DEPENDENCY_REVIEW_STATUS:'+String(f.findingId));
  const explicitGroup=f.dependencyGroupId??f.dependencyGroup??review?.groupId;
  if(status==='INDEPENDENT'||status==='SHARED_DENOMINATOR'||f.dependencyKind==='SHARED_DENOMINATOR'){byId.set(f.findingId,{status:'NONE',kind:status==='SHARED_DENOMINATOR'||f.dependencyKind==='SHARED_DENOMINATOR'?'SHARED_DENOMINATOR':'INDEPENDENT',reason:review?.reason??f.dependencyReason??'同じ観測母数を共有しても、同じ成功事象や当選経路を重ねて数える関係ではないため、別の設定差情報として扱う。'});continue;}
  if(status==='UNRESOLVED'&&!explicitGroup){const gid='unresolved:'+String(f.findingId);byId.set(f.findingId,{status:'DEFERRED_TO_CANDIDATE_CONTRACT',groupId:gid,kind:'UNRESOLVED',reason:review?.reason??f.dependencyReason??'他候補との依存関係を確認できていないため、独立性を仮定しない。'});continue;}
  if(explicitGroup){const kind=f.dependencyKind??status??'DEPENDENT';byId.set(f.findingId,{status:'DEFERRED_TO_CANDIDATE_CONTRACT',groupId:String(explicitGroup),kind:String(kind),reason:f.dependencyReason??review?.reason??'同じ設定差情報を共有する可能性があるため、独立加算せず採用判定で解決する。'});continue;}
  pending.push(f);
 }
 for(const f of pending)byId.set(f.findingId,{status:'NONE',kind:'REVIEWED_NO_SEMANTIC_OVERLAP',reason:'同じ観測母数を使うことだけでは情報重複とはみなさず、同じ成功事象・包含関係・上流下流関係が明示されていないため別の設定差情報として扱う。'});
 const groups=new Map<string,any>();for(const f of candidates){const d=byId.get(f.findingId);if(!d)throw new Error('DEPENDENCY_REVIEW_COVERAGE:'+String(f.findingId));if(d.status!=='DEFERRED_TO_CANDIDATE_CONTRACT')continue;const g=groups.get(d.groupId)??{groupId:d.groupId,kinds:new Set<string>(),members:[]};g.kinds.add(d.kind);g.members.push(f.findingId);groups.set(d.groupId,g)}
 return {decisions:byId,summary:{status:'COMPLETE',candidateCount:candidates.length,groupCount:groups.size,groups:[...groups.values()].map((g:any)=>({groupId:g.groupId,kinds:[...g.kinds],members:g.members}))}};
}
