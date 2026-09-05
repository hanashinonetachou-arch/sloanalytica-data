#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FORMAL = '431cfcc7a465dcb7c5053f7ca94e5da8ea5cdac2';
const IDS = [
  'L_AZURLANE_THE_ANIMATION_KN','L_DRUAGA_NO_TOU_ZA','L_SMASLO_TOKYO_REVENGERS_ZF','L_BABEL_BA','L_SHIN_ONIMUSHA_3_SA',
  'L_ZENIGATA_5_L2','L_TOARU_KAGAKU_NO_RAILGUN_2_FV','L_ZETTAI_SHOGEKI_FORCE_FH','L_KAKUMEIKI_VALVRAVE_2_JF','L_NEO_PLANET_SLED'
];

function replaceOnce(text, from, to, label) {
  const first=text.indexOf(from);
  if(first<0) throw new Error(`${label}: source pattern not found`);
  if(text.indexOf(from, first+1)>=0) throw new Error(`${label}: source pattern is not unique`);
  return text.slice(0,first)+to+text.slice(first+from.length);
}
function gitShowJson(spec){
  const r=spawnSync('git',['show',spec],{cwd:ROOT,encoding:'utf8'});
  if(r.error) throw r.error;
  if(r.status!==0) throw new Error(`git show failed ${spec}: ${r.stderr}`);
  return JSON.parse(r.stdout);
}
function writeJson(p,v){fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');}

// 1) Make historical Gate A/B evaluation metadata an explicit SelectionData source
// contract. It is presentation/audit history only; execution Selection.features remains unchanged.
for(const id of IDS){
  const formal=gitShowJson(`${FORMAL}:machines/${id}/machine-package.json`);
  const selPath=path.join(ROOT,'research',id,'selection-data.json');
  const sel=JSON.parse(fs.readFileSync(selPath,'utf8'));
  if(!formal.selectionSummary) throw new Error(`${id}: Formal Publish selectionSummary missing`);
  sel.selectionSummaryContract=structuredClone(formal.selectionSummary);
  const formalEvidence=new Map((formal.evidence?.evidences??[]).map(e=>[e.id,e]));
  for(const e of sel.evidence??[]){
    const src=formalEvidence.get(e.evidenceId);
    if(!src) throw new Error(`${id}/${e.evidenceId}: Formal Publish evidence missing`);
    if(src.name) e.name=src.name;
    if(Array.isArray(src.sourceEvidenceRefs)&&src.sourceEvidenceRefs.length) e.sourceEvidenceRefs=[...src.sourceEvidenceRefs];
    if(typeof src.contextNote==='string'&&src.contextNote) e.contextNote=src.contextNote;
  }
  writeJson(selPath,sel);
  console.log(`MIGRATED ${id}: summary ${formal.selectionSummary.evaluatedCount}/${formal.selectionSummary.selectedCount}/${formal.selectionSummary.rejectedCount}`);
}

// 2) Teach the builder to honor the explicit presentation-history contract and
// preserve Evidence provenance/context from canonical Selection/Research data.
const builderPath=path.join(ROOT,'tools','build-machine-data.mjs');
let builder=fs.readFileSync(builderPath,'utf8');
builder=replaceOnce(builder,
  'function buildSelectionSummary(research,selection,statistics=null){\n  const rfs=',
  `function buildSelectionSummary(research,selection,statistics=null){\n  if(selection.selectionSummaryContract!=null){\n    const c=selection.selectionSummaryContract;\n    if(!c||c.schemaVersion!=="selection-summary-v1"||!Number.isInteger(c.evaluatedCount)||!Number.isInteger(c.selectedCount)||!Number.isInteger(c.rejectedCount)||!Array.isArray(c.selected)||!Array.isArray(c.rejected)) fail("invalid selectionSummaryContract");\n    if(c.selectedCount!==c.selected.length||c.rejectedCount!==c.rejected.length||c.evaluatedCount<c.selectedCount+c.rejectedCount) fail("selectionSummaryContract count mismatch");\n    return structuredClone(c);\n  }\n  const rfs=`,
  'builder selection summary contract');
builder=replaceOnce(builder,
  '    const name=re?.name??e.name??e.displayName??e.evidenceId;\n    evidences.push({id:e.evidenceId,name,displayName:e.displayName??name,inputId:e.inputId,triggerValue:e.triggerValue,\n      confirmedSettings:confirmed,deniedSettings:denied,hasImage:false,\n      ...(Array.isArray(e.sharedFeatureIds)&&e.sharedFeatureIds.length?{sharedFeatureIds:[...e.sharedFeatureIds]}:{}),\n      type:(denied.length>0 && confirmed.length===0)?"SETTING_DENIAL":"SETTING_CONFIRMATION"});',
  '    const name=e.name??re?.name??e.displayName??e.evidenceId;\n    const sourceEvidenceRefs=Array.isArray(e.sourceEvidenceRefs)?e.sourceEvidenceRefs:(re?.sourceRefs??[]);\n    evidences.push({id:e.evidenceId,name,displayName:e.displayName??name,inputId:e.inputId,triggerValue:e.triggerValue,\n      confirmedSettings:confirmed,deniedSettings:denied,hasImage:false,\n      ...(sourceEvidenceRefs.length?{sourceEvidenceRefs:[...sourceEvidenceRefs]}:{}),\n      ...(typeof e.contextNote==="string"&&e.contextNote?{contextNote:e.contextNote}:{}),\n      ...(Array.isArray(e.sharedFeatureIds)&&e.sharedFeatureIds.length?{sharedFeatureIds:[...e.sharedFeatureIds]}:{}),\n      type:(denied.length>0 && confirmed.length===0)?"SETTING_DENIAL":"SETTING_CONFIRMATION"});',
  'builder evidence provenance');
fs.writeFileSync(builderPath,builder);

// 3) Validate the new source metadata explicitly so it cannot silently drift.
const validatorPath=path.join(ROOT,'tools','validate-selection-data.mjs');
let validator=fs.readFileSync(validatorPath,'utf8');
validator=replaceOnce(validator,
  ' if(!s.machineDataVersion) errors.push("machineDataVersion is required");\n const inputs=',
  ` if(!s.machineDataVersion) errors.push("machineDataVersion is required");\n const summary=s.selectionSummaryContract;\n if(summary!=null){\n   if(!summary||summary.schemaVersion!=="selection-summary-v1"||!Number.isInteger(summary.evaluatedCount)||!Number.isInteger(summary.selectedCount)||!Number.isInteger(summary.rejectedCount)||!Array.isArray(summary.selected)||!Array.isArray(summary.rejected)) errors.push("invalid selectionSummaryContract");\n   else {\n     if(summary.selectedCount!==summary.selected.length||summary.rejectedCount!==summary.rejected.length||summary.evaluatedCount<summary.selectedCount+summary.rejectedCount) errors.push("selectionSummaryContract count mismatch");\n     for(const item of [...summary.selected,...summary.rejected]) if(!item||typeof item.name!=="string"||!item.name.trim()||typeof item.reason!=="string"||!item.reason.trim()) errors.push("selectionSummaryContract item requires user-facing name/reason");\n   }\n }\n const inputs=`,
  'selection validator summary contract');
validator=replaceOnce(validator,
  ' const machineSettings=new Set(research?.machine?.settings??[]);\n const researchEvidenceIds=',
  ` const sourceIds=new Set((research?.sources??[]).map(x=>x.sourceId));\n for(const e of s.evidence??[]){\n   for(const sourceId of e.sourceEvidenceRefs??[]) if(research&&!sourceIds.has(sourceId)) errors.push(\\`${'${e.evidenceId}'}: unknown sourceEvidenceRef ${'${sourceId}'}\\`);\n   if(e.contextNote!=null&&(typeof e.contextNote!=="string"||!e.contextNote.trim())) errors.push(\\`${'${e.evidenceId}'}: contextNote must be non-empty string\\`);\n }\n const machineSettings=new Set(research?.machine?.settings??[]);\n const researchEvidenceIds=`,
  'selection validator evidence provenance');
fs.writeFileSync(validatorPath,validator);

console.log(`PASS: canonicalized regeneration metadata for ${IDS.length}/10 machines`);
