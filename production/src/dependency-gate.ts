const COMPUTABLE_TYPES=new Set(['probability','conditional_probability','appearance_distribution']);
const REVIEW_STATUSES=new Set(['INDEPENDENT','DEPENDENT','CONDITIONAL','AGGREGATE_COMPONENT','MUTUALLY_EXCLUSIVE','UNRESOLVED','CONDITIONALLY_SEPARATE']);
const numeric=(f:any)=>f?.settingDistribution&&COMPUTABLE_TYPES.has(String(f?.observationType??''));
const autoGroupId=(trial:string)=>'auto-overlap:'+trial;
export function buildDependencyReview(findings:any[]){
 const candidates=(findings??[]).filter(numeric),byId=new Map<string,any>(),pending:any[]=[];
 for(const f of candidates){
  const review=f.dependencyReview;const status=review?.status;
  if(status!==undefined&&!REVIEW_STATUSES.has(String(status)))throw new Error('DEPENDENCY_REVIEW_STATUS:'+String(f.findingId));
  const explicitGroup=f.dependencyGroupId??f.dependencyGroup??review?.groupId;
  if(status==='INDEPENDENT'){byId.set(f.findingId,{status:'NONE',kind:'INDEPENDENT',reason:review?.reason??f.dependencyReason??'Dependency / Overlap Reviewで、他の候補との直接的な包含・上流下流・合算内訳の重複がないことを確認した。'});continue;}
  if(status==='UNRESOLVED'&&!explicitGroup){const gid='unresolved:'+String(f.findingId);byId.set(f.findingId,{status:'DEFERRED_TO_CANDIDATE_CONTRACT',groupId:gid,kind:'UNRESOLVED',reason:review?.reason??f.dependencyReason??'他候補との依存関係を確認できていないため、独立性を仮定しない。'});continue;}
  if(explicitGroup){const kind=f.dependencyKind??status??'DEPENDENT';byId.set(f.findingId,{status:'DEFERRED_TO_CANDIDATE_CONTRACT',groupId:String(explicitGroup),kind:String(kind),reason:f.dependencyReason??review?.reason??'同じ設定差情報を共有する可能性があるため、独立加算せず採用判定で解決する。'});continue;}
  pending.push(f);
 }
 const byTrial=new Map<string,any[]>();for(const f of pending){const trial=String(f.trialUniverse??'NORMAL_GAME_TRIAL');const xs=byTrial.get(trial)??[];xs.push(f);byTrial.set(trial,xs)}
 for(const [trial,xs] of byTrial){if(xs.length>=2){for(const f of xs)byId.set(f.findingId,{status:'DEFERRED_TO_CANDIDATE_CONTRACT',groupId:autoGroupId(trial),kind:'OVERLAP_UNRESOLVED',reason:'同じ観測母数に複数の設定差候補があり、同じ出来事を一部共有する可能性があるため、独立性を仮定せず重複評価を避ける。'});}else{const f=xs[0];byId.set(f.findingId,{status:'NONE',kind:'REVIEWED_NO_OVERLAP',reason:'Dependency / Overlap Reviewで、同じ観測母数に競合する数値候補がないことを確認した。'});}}
 const groups=new Map<string,any>();for(const f of candidates){const d=byId.get(f.findingId);if(!d)throw new Error('DEPENDENCY_REVIEW_COVERAGE:'+String(f.findingId));if(d.status!=='DEFERRED_TO_CANDIDATE_CONTRACT')continue;const g=groups.get(d.groupId)??{groupId:d.groupId,kinds:new Set<string>(),members:[]};g.kinds.add(d.kind);g.members.push(f.findingId);groups.set(d.groupId,g)}
 return {decisions:byId,summary:{status:'COMPLETE',candidateCount:candidates.length,groupCount:groups.size,groups:[...groups.values()].map((g:any)=>({groupId:g.groupId,kinds:[...g.kinds],members:g.members}))}};
}
