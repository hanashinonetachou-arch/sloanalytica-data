import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const id=process.argv[2];
if(!id) throw new Error("Usage: node tools/prepare-v8-distribution.mjs MACHINE_ID");
const run=(script,args=[])=>{const r=spawnSync(process.execPath,[path.join(ROOT,"tools",script),...args],{cwd:ROOT,encoding:"utf8"});if(r.status!==0)throw new Error((r.stderr||r.stdout||script).trim());return r;};

const calibration=fs.existsSync(path.join(ROOT,"repro-v8",id,"phase6-machine-data-runtime-v84-production-calibration.json"))&&fs.existsSync(path.join(ROOT,"repro-v8",id,"phase6-runtime-binding-v84-production-calibration.json"));
run(calibration?"build-v84-calibration-package.mjs":"build-v8-reference-package.mjs",[id]);
const source=path.join(ROOT,"repro-v8",id,"machine-package.generated.json");
if(!fs.existsSync(source)) throw new Error("V8 generated package missing: "+source);
const pkg=JSON.parse(fs.readFileSync(source,"utf8"));
if(pkg?.v8?.source!=="REPRO_V8_UPSTREAM_ONLY") throw new Error("V8 upstream-only provenance missing");
const version=pkg?.machine?.machineDataVersion;
if(typeof version!=="string"||!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) throw new Error("V8 machineDataVersion must be SemVer");
const outDir=path.join(ROOT,"build",id);fs.mkdirSync(outDir,{recursive:true});
const out=path.join(outDir,"machine-package.generated.json");
const bytes=Buffer.from(JSON.stringify(pkg,null,2)+"\n","utf8");
fs.writeFileSync(out,bytes);
console.log(JSON.stringify({machineId:id,machineDataVersion:version,source:"REPRO_V8_UPSTREAM_ONLY",output:path.relative(ROOT,out).replaceAll("\\","/"),packageSizeBytes:bytes.length,sha256:crypto.createHash("sha256").update(bytes).digest("hex")},null,2));
