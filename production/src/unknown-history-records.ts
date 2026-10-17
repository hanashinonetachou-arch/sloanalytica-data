// A deterministic UI projection extension. It copies published evidence semantics,
// adds no probability feature, and never aliases unknown records to numeric counts.
export function withUnknownHistoryRecords(input:any){
 const projection=structuredClone(input),sections=projection.runtimeUi?.numericSections??[],done=new Set<string>();
 for(const section of sections){
  const context=section.observationContext;
  if(!context?.groupingApproved||!/累計.*G|累計ゲーム数|当日開始/.test(section.description??'')||done.has(context.opportunityId))continue;
  const source=(projection.evidence??[]).find((s:any)=>(s.evidenceItems??[]).some((e:any)=>(e.semanticCategories??[]).some((c:any)=>c.linkedFindingId===section.sourceFindingId)));
  if(!source)throw Error('UNKNOWN_HISTORY_EVIDENCE_SOURCE_REQUIRED:'+section.sourceFindingId);
  done.add(context.opportunityId);
  const findingId='UNKNOWN_HISTORY_'+context.opportunityId;
  const description='当日の累計ゲーム数や前任者分の必要な履歴が分からない場合はこちらへ記録してください。記録のみ・推測計算には使用しない。設定確定・設定否定の表示は、同じ入力から設定候補の絞り込みへ反映します。同じ画面をほかの条件タブにも重ねて入力しないでください。';
  const evidenceItems=source.evidenceItems.map((e:any)=>({...structuredClone(e),findingId,sourceEvidenceFindingId:e.findingId,denominatorSemantics:'当日履歴が不明な観測。数値推測へ使用しない。',details:[description],semanticCategories:e.semanticCategories.map((c:any)=>{const copy=structuredClone(c);delete copy.linkedFindingId;return copy;})}));
  for(const e of evidenceItems)delete e.trialUniverse;
  const fallback={...structuredClone(source),id:'EVI_'+findingId,sourceFindingId:findingId,title:context.groupTitle,description,evidenceItems,observationContext:{...context,conditionId:findingId,conditionLabel:'当日履歴不明'}};
  projection.evidence.push(fallback);projection.runtimeUi.evidenceSections.push(fallback);
  const group=projection.runtimeUi.uiPresentation?.tabGroups?.find((g:any)=>g.id==='OPPORTUNITY_'+context.opportunityId);if(!group)throw Error('UNKNOWN_HISTORY_TAB_GROUP_REQUIRED:'+findingId);
  group.tabs.push({sectionId:fallback.id,label:'当日履歴不明'});
 }
 for(const section of sections){
  const match=String(section.observationContext?.conditionLabel??'').match(/^富士山既出([1-5])回$/);if(!match)continue;
  const min=Number(match[1])+1,findingId=section.sourceFindingId+'_KNOWN_HISTORY';
  const source=(projection.evidence??[]).find((s:any)=>(s.evidenceItems??[]).some((e:any)=>(e.semanticCategories??[]).some((c:any)=>c.linkedFindingId===section.sourceFindingId)));if(!source)throw Error('KNOWN_HISTORY_SOURCE_REQUIRED');
  const categories=section.inputs.filter((x:any)=>x.role==='categoryCount').map((x:any)=>({label:x.label,meaning:'設定'+min+'以上',semanticType:'EXACT_CONSTRAINT',linkedFindingId:section.sourceFindingId}));
  const evidence={...structuredClone(source),id:'EVI_'+findingId,sourceFindingId:findingId,evidenceItems:[{findingId,label:'確認済みの富士山履歴',sourceIds:source.evidenceItems[0].sourceIds,semanticType:'EXACT_CONSTRAINT',details:['当日開始から確認済みの富士山'+match[1]+'回の履歴は設定'+min+'以上。履歴自体の出現率を重ねて計算しません。'],semanticCategories:categories,runtimePolicyControlled:false,status:'SOURCE_REFERENCED'}]};
  projection.evidence.push(evidence);projection.runtimeUi.evidenceSections.push(evidence);
 }
 return projection;
}
