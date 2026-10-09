import {summarizeResearchProgress} from './research-progress.ts';

/** Derive work from current drafts, without interpreting partial coverage as readiness. */
export function buildResearchWorkQueue(drafts:any[],basisAudit:string){
 const progress=summarizeResearchProgress(drafts);
 const rows=progress.machineRows.flatMap((machine,index)=>{
  const draft=drafts[index];const sources=new Map<string,any>(draft.sources.map((s:any)=>[s.sourceId,s]));
  return machine.remainingDomains.map(row=>{
   for(const id of row.sourceIds)if(!sources.has(id))throw new Error('QUEUE_UNREGISTERED_SOURCE:'+machine.machineId+':'+id);
   const nextCheck=row.domain==='EVIDENCE'?'演出ごとの適用区間・既存レビューとの対応・出典不一致を照合':
    ['INITIAL_HIT','CZ','AT','INTERNAL_CONDITIONAL_DRAW'].includes(row.domain)?'公表数値の試行条件・観測可能性・上流下流の重複を確認':
    '公開表と適用条件を追加資料で確認。未公表値を補完しない';
   return {machineId:machine.machineId,...row,sourceUrls:[...new Set(row.sourceIds.map((id:string)=>sources.get(id).url))],nextCheck,approvalRequired:false};
  });
 });
 return {schemaVersion:'batch009-remaining-domain-research-queue-v2',basisAudit,
  machineOrder:drafts.map(d=>d.machineId),remainingDomains:rows.length,
  scope:'Researchの追加調査キュー。正式承認・Runtime採用を意味しない。',rows,
  machineWorkPacks:progress.machineRows.map((m,index)=>({machineId:m.machineId,
   remainingDomains:m.remainingDomains.map(r=>r.domain),
   machineWideUnresolvedNumericCandidates:m.unresolvedNumericCandidates,
   blockedReferenceChecks:drafts[index].blockedItems.filter((b:any)=>b.observationScopeAudit)
    .map((b:any)=>({blockId:b.blockId,sourceIds:b.observationScopeAudit.sourceIds,status:b.observationScopeAudit.status,reason:b.observationScopeAudit.reason})),
   continuationPolicy:'機種内の残領域をまとめて調査・同期・検証する。監査保存は追加調査の停止条件ではない。'}))};
}
