const COMPUTABLE_TYPES=new Set(['probability','conditional_probability','appearance_distribution']);
const REVIEW_STATUSES=new Set(['INDEPENDENT','DEPENDENT','CONDITIONAL','AGGREGATE_COMPONENT','MUTUALLY_EXCLUSIVE','UNRESOLVED','CONDITIONALLY_SEPARATE']);
const numeric=(f:any)=>f?.settingDistribution&&COMPUTABLE_TYPES.has(String(f?.observationType??''));
const autoGroupId=(trial:string)=>'auto-overlap:'+trial;
const trialTokens=(trial:any)=>String(trial??'').split('_').filter(x=>x&&x!=='TRIAL');
const strictTokenSubset=(a:string,b:string)=>{
 const aa=new Set(trialTokens(a)),bb=new Set(trialTokens(b));
 if(aa.size>=bb.size)return false;
 for(const token of aa)if(!bb.has(token))return false;
 return true;
};
const crossUniverseOverlap=(a:any,b:any)=>{
 const aa=String(a??''),bb=String(b??'');
 return aa!==bb&&(strictTokenSubset(aa,bb)||strictTokenSubset(bb,aa));
};
const crossGroupId=(trials:string[])=>{
 const ordered=[...new Set(trials)].sort((a,b)=>trialTokens(a).length-trialTokens(b).length||a.localeCompare(b));
 return 'auto-cross-overlap:'+ordered[0];
};
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
 const parent=pending.map((_f:any,i:number)=>i);const find=(i:number):number=>parent[i]===i?i:(parent[i]=find(parent[i]));const unite=(a:number,b:number)=>{a=find(a);b=find(b);if(a!==b)parent[b]=a;};
 for(let i=0;i<pending.length;i++)for(let j=i+1;j<pending.length;j++){
  const a=String(pending[i].trialUniverse??'NORMAL_GAME_TRIAL'),b=String(pending[j].trialUniverse??'NORMAL_GAME_TRIAL');
  if(a===b||crossUniverseOverlap(a,b))unite(i,j);
 }
 const components=new Map<number,any[]>();for(let i=0;i<pending.length;i++){const root=find(i),xs=components.get(root)??[];xs.push(pending[i]);components.set(root,xs)}
 for(const xs of components.values()){
  if(xs.length===1){const f=xs[0];byId.set(f.findingId,{status:'NONE',kind:'REVIEWED_NO_OVERLAP',reason:'Dependency / Overlap Reviewで、同じ観測母数または包含関係にある観測母数へ競合する数値候補がないことを確認した。'});continue;}
  const trials=[...new Set(xs.map((f:any)=>String(f.trialUniverse??'NORMAL_GAME_TRIAL')))],sameTrial=trials.length===1;
  const groupId=sameTrial?autoGroupId(trials[0]):crossGroupId(trials);
  const kind=sameTrial?'OVERLAP_UNRESOLVED':'CROSS_UNIVERSE_OVERLAP_UNRESOLVED';
  const reason=sameTrial?'同じ観測母数に複数の設定差候補があり、同じ出来事を一部共有する可能性があるため、独立性を仮定せず重複評価を避ける。':'一方の観測母数が他方の部分集合となる候補があり、同じ出来事や上流・下流の設定差情報を共有する可能性があるため、母数が異なっても独立性を仮定しない。';
  for(const f of xs)byId.set(f.findingId,{status:'DEFERRED_TO_CANDIDATE_CONTRACT',groupId,kind,reason});
 }
 const groups=new Map<string,any>();for(const f of candidates){const d=byId.get(f.findingId);if(!d)throw new Error('DEPENDENCY_REVIEW_COVERAGE:'+String(f.findingId));if(d.status!=='DEFERRED_TO_CANDIDATE_CONTRACT')continue;const g=groups.get(d.groupId)??{groupId:d.groupId,kinds:new Set<string>(),members:[]};g.kinds.add(d.kind);g.members.push(f.findingId);groups.set(d.groupId,g)}
 return {decisions:byId,summary:{status:'COMPLETE',candidateCount:candidates.length,groupCount:groups.size,groups:[...groups.values()].map((g:any)=>({groupId:g.groupId,kinds:[...g.kinds],members:g.members}))}};
}
