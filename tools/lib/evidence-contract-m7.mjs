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
