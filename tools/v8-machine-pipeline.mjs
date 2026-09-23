import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const id=process.argv[2];
const mode=process.argv[3]??"--build";
if(!id) throw new Error("Usage: node tools/v8-machine-pipeline.mjs MACHINE_ID [--build|--publish]");
if(!["--build","--publish"].includes(mode)) throw new Error("mode must be --build or --publish");

const sourceDir=path.join(ROOT,"repro-v8",id);
const required=["research-data.json","selection-data.json","observation-contract.json","machine-research-summary.json","canonical-ui.json","high-low-discrimination.json"];
for(const name of required) if(!fs.existsSync(path.join(sourceDir,name))) throw new Error(`V8 upstream contract missing: repro-v8/${id}/${name}`);

const run=(script,args=[])=>{
 const r=spawnSync(process.execPath,[path.join(ROOT,"tools",script),...args],{cwd:ROOT,encoding:"utf8"});
 if(r.status!==0) throw new Error((r.stderr||r.stdout||script).trim());
 if(r.stdout) process.stdout.write(r.stdout);
};

run("prepare-v8-distribution.mjs",[id]);
const generated=path.join(ROOT,"build",id,"machine-package.generated.json");
const pkg=JSON.parse(fs.readFileSync(generated,"utf8"));
if(pkg?.v8?.source!=="REPRO_V8_UPSTREAM_ONLY") throw new Error("upstream-only provenance missing");
const declaredProvenance=pkg?.provenance??pkg?.v8?.provenance;
if(declaredProvenance){
 const expectedProvenance={generationPath:"V8_RESEARCH_PIPELINE",researchOrigin:"ZERO_BASE_PUBLIC_RESEARCH"};
 const manifestVersion=String(pkg?.provenance?.manifestVersion??"");
 if(!/^8(?:\\.\\d+)?(?:-[A-Z0-9._-]+)?$/i.test(manifestVersion)) throw new Error("machine-package provenance missing/invalid: manifestVersion");
 if(pkg?.v8?.provenance?.manifestVersion!==manifestVersion) throw new Error("v8 provenance missing/invalid: manifestVersion");
 for(const [key,value] of Object.entries(expectedProvenance)){
  if(pkg?.provenance?.[key]!==value) throw new Error(`machine-package provenance missing/invalid: ${key}`);
  if(pkg?.v8?.provenance?.[key]!==value) throw new Error(`v8 provenance missing/invalid: ${key}`);
 }
 if(JSON.stringify(pkg.provenance)!==JSON.stringify(pkg.v8.provenance)) throw new Error("machine-package/v8 provenance mismatch");
 const linkedPlay=pkg?.linkedPlay;
 if(!linkedPlay||JSON.stringify(linkedPlay)!==JSON.stringify(pkg?.v8?.linkedPlay)) throw new Error("machine-package/v8 linked-play missing or mismatch");
 if(!["AVAILABLE","NOT_AVAILABLE","UNRESOLVED"].includes(linkedPlay.status)) throw new Error("machine-package linked-play status invalid");
 if(linkedPlay.automaticImportCapability==null) throw new Error("machine-package linked-play automatic import capability missing");
}
if(pkg?.machine?.machineId!==id) throw new Error("generated machineId mismatch");
if(pkg?.ui?.source!=="CANONICAL_UI") throw new Error("runtime UI is not canonical-ui sourced");

const serialized=JSON.stringify(pkg.ui);
for(const f of pkg.features?.features??[]){
 if(!f.name || f.name===f.featureId || /^FEAT_/i.test(f.name)) throw new Error(`user-facing feature name unresolved: ${f.featureId}`);
}
if(/"title"\s*:\s*"FEAT_|"label"\s*:\s*"FEAT_|"name"\s*:\s*"INP_/i.test(serialized)) throw new Error("internal identifier exposed in runtime UI");

if(mode==="--publish"){
 run("publish-machine-data.mjs",["approve",id,generated]);
 run("publish-machine-data.mjs",["publish",id,"--apply","--defer-audit"]);
 run("audit-v8-distribution-target.mjs",[id]);
 run("sync-machine-registry.mjs");
}
console.log(JSON.stringify({machineId:id,status:mode==="--publish"?"V8_PUBLISHED":"V8_BUILD_PASS",source:"REPRO_V8_UPSTREAM_ONLY"},null,2));
