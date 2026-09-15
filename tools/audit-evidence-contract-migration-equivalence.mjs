#!/usr/bin/env node
import {read,legacyProjection,stable,assertNoDuplicates,VERSION} from "./lib/evidence-contract-m7.mjs";
const [beforePath,afterPath]=process.argv.slice(2);if(!beforePath||!afterPath){console.error("Usage: ... <legacy-selection.json> <migrated-selection.json>");process.exit(2);}
try{const before=legacyProjection(read(beforePath)),after=read(afterPath).evidenceContract;if(after?.contractVersion!==VERSION)throw new Error("destination contract missing");assertNoDuplicates(after.items);
 const trim=e=>({evidenceId:e.evidenceId,displayName:e.displayName,sourceResearchEvidenceIds:e.sourceResearchEvidenceIds,inputId:e.inputId,triggerValue:e.triggerValue,confirmedSettings:e.confirmedSettings,deniedSettings:e.deniedSettings,runtimeType:e.runtimeType});
 const a={inputs:before.inputs.map(x=>({...x,defaultValue:x.type==="multi_enum"?[]:"__UNSET__"})),items:before.items.map(trim)},b={inputs:after.inputs,items:after.items.map(trim)};
 if(JSON.stringify(stable(a))!==JSON.stringify(stable(b)))throw new Error("DRIFT");console.log(`EQUIVALENT: ${a.items.length} Evidence`);
}catch(e){console.error(`DRIFT: ${e.message}`);process.exit(1);}
