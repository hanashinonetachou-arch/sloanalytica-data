import fs from "node:fs";

export const VERSION="selection-evidence-v2";
export function read(p){return JSON.parse(fs.readFileSync(p,"utf8"));}
export function stable(value){
  if(Array.isArray(value)) return value.map(stable);
  if(value&&typeof value==="object") return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])]));
  return value;
}
export function legacyProjection(selection){
  const inputs=[],items=[];
  let nextOrder=100;
  for(const g of selection.evidenceUi?.groups??[]){
    const inputId=`INP_EVI_${g.groupId}`;
    const multi=g.selectionMode==="multi";
    inputs.push({id:inputId,name:g.label,type:multi?"multi_enum":"enum",category:g.category??"EVIDENCE",unit:"",displayOrder:g.displayOrder??nextOrder++,inferenceRole:"INCLUDE_SUPPORT",options:[...(!multi?[{key:"__UNSET__",label:"未選択",value:"__UNSET__"}]:[]),...(g.options??[]).map(o=>({key:o.value,label:o.label,value:o.value}))]});
    for(const o of g.options??[]){
      const confirmedSettings=o.allowedSettings??[],deniedSettings=o.excludedSettings??[];
      if(!confirmedSettings.length&&!deniedSettings.length) continue;
      items.push({evidenceId:`EVI_${g.groupId}_${o.value}`.replace(/[^A-Z0-9_]/gi,"_").toUpperCase(),displayName:o.label,sourceResearchEvidenceIds:o.sourceEvidenceIds??[],inputId,triggerValue:o.value,confirmedSettings,deniedSettings,runtimeType:deniedSettings.length&&!confirmedSettings.length?"SETTING_DENIAL":"SETTING_CONFIRMATION",groupId:g.groupId});
    }
  }
  return {inputs,items};
}
export function semanticKey(e){return JSON.stringify(stable({lineage:e.sourceResearchEvidenceIds,inputId:e.inputId,triggerValue:e.triggerValue,confirmedSettings:e.confirmedSettings,deniedSettings:e.deniedSettings,settingFloorSemantics:e.settingFloorSemantics}));}
export function assertNoDuplicates(items){
  const ids=new Set(),keys=new Set();
  for(const e of items){if(ids.has(e.evidenceId)) throw new Error(`DUPLICATE_RUNTIME_EVIDENCE_ID: ${e.evidenceId}`);ids.add(e.evidenceId);const k=semanticKey(e);if(keys.has(k)) throw new Error(`DUPLICATE_SEMANTIC_EVIDENCE: ${e.evidenceId}`);keys.add(k);}
}
export function resolveHistoricalEvidenceGroup(selection, historicalGroup) {
  const groupId = historicalGroup?.groupId;
  if (!groupId) {
    throw new Error("HISTORICAL_EVIDENCE_GROUP_ID_MISSING");
  }

  const legacyGroup = (selection.evidenceUi?.groups ?? [])
    .find(group => group.groupId === groupId);

  if (legacyGroup) {
    return {
      mode: "LEGACY",
      groupId,
      legacyGroup
    };
  }

  if (selection.evidenceContract?.contractVersion !== VERSION) {
    throw new Error(`HISTORICAL_EVIDENCE_GROUP_DISAPPEARED: ${groupId}`);
  }

  const items = (selection.evidenceContract.items ?? [])
    .filter(item => item.groupId === groupId);

  if (!items.length) {
    throw new Error(`M7_CUTOVER_GROUP_MISSING: ${groupId}`);
  }

  for (const item of items) {
    const provenance = item.legacyMigrationProvenance;
    if (
      provenance?.source !== "selection.evidenceUi.groups" ||
      provenance?.groupId !== groupId
    ) {
      throw new Error(`M7_CUTOVER_PROVENANCE_MISMATCH: ${groupId}`);
    }
  }

  const historicalLineage = [
    ...new Set(
      (historicalGroup.options ?? [])
        .flatMap(option => option.sourceEvidenceIds ?? [])
    )
  ].sort();

  const currentLineage = [
    ...new Set(
      items.flatMap(item => item.sourceResearchEvidenceIds ?? [])
    )
  ].sort();

  if (
    historicalLineage.length !== currentLineage.length ||
    historicalLineage.some((id, index) => id !== currentLineage[index])
  ) {
    throw new Error(`M7_CUTOVER_LINEAGE_MISMATCH: ${groupId}`);
  }

  return {
    mode: "M7_CUTOVER",
    groupId,
    items
  };
}