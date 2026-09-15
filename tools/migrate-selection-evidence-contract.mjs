#!/usr/bin/env node
import fs from "node:fs";import path from "node:path";
import {VERSION,read,legacyProjection,assertNoDuplicates} from "./lib/evidence-contract-m7.mjs";
const id=process.argv.find(x=>!x.startsWith("-")&&x!==process.argv[0]&&x!==process.argv[1]);
const apply=process.argv.includes("--apply");
if(!id){console.error("Usage: node tools/migrate-selection-evidence-contract.mjs <machineId> [--apply]");process.exit(2);}
const root=process.cwd(),sp=path.join(root,"research",id,"selection-data.json"),op=path.join(root,"research",id,"machine-observation-data.json"),up=path.join(root,"research",id,"ui-design-data.json"),rp=path.join(root,"research",id,"research-data.json");
try{
 const s=read(sp); if(s.evidenceContract?.contractVersion===VERSION){console.log(`${id}: NO_OP_ALREADY_MIGRATED`);process.exit(0);}
 if(id==="LB_MAGICAL_HALLOWEEN_GS") throw new Error("BLOCKED_INFORMATION_GAP: normalization semantics are not explicitly verified");
 const observation=read(op),ui=read(up),research=read(rp),p=legacyProjection(s);
 if(!p.items.length) throw new Error("BLOCKED_INFORMATION_GAP: no materialized Evidence");
 const researchIds=new Set((research.evidenceCandidates??[]).map(x=>x.researchEvidenceId));
 const obs=(observation.observations??[]).filter(x=>x.sourceType==="END_EVENT");
 if(obs.length!==1) throw new Error("BLOCKED_INFORMATION_GAP: Observation mapping is not unique");
 for(const e of p.items){if(!e.sourceResearchEvidenceIds.length||e.sourceResearchEvidenceIds.some(x=>!researchIds.has(x)))throw new Error(`BLOCKED_INFORMATION_GAP: Research lineage ${e.evidenceId}`);}
 for(const input of p.inputs){const placements=Object.entries(ui.sections??{}).filter(([,v])=>v.inputIds?.includes(input.id)).map(([k])=>k);if(placements.length!==1)throw new Error(`BLOCKED_INFORMATION_GAP: canonical UI placement ${input.id}`);input.defaultValue=input.type==="multi_enum"?[]:"__UNSET__";}
 p.items=p.items.map(e=>({...e,settingFloorSemantics:"EXACT_ALLOWED_SETTINGS",normalizationSemantics:"INDEPENDENT_TRIGGER_INTERSECTION",observationIds:[obs[0].observationId],canonicalUi:{inputId:e.inputId,section:Object.entries(ui.sections).find(([,v])=>v.inputIds?.includes(e.inputId))[0]},sharedFeatureIds:[],featureSharing:"NONE",legacyMigrationProvenance:{source:"selection.evidenceUi.groups",groupId:e.groupId}}));
 assertNoDuplicates(p.items);
 s.evidenceContract={contractVersion:VERSION,inputs:p.inputs,items:p.items};delete s.evidenceUi;
 if(apply){fs.writeFileSync(sp,JSON.stringify(s,null,2)+"\n");console.log(`${id}: APPLIED ${VERSION}`);}else console.log(`${id}: CHECK_OK ${VERSION} (${p.items.length} Evidence); rerun with --apply`);
}catch(e){console.error(`${id}: ${e.message}`);process.exit(1);}
