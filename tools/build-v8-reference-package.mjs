import fs from "node:fs";import path from "node:path";import {fileURLToPath} from "node:url";
import {materializeCanonicalUiV8,assertCanonicalRuntimeUiEquality} from "./materialize-canonical-ui-v8-runtime.mjs";
import {compileV8MachinePackage} from "./compile-v8-machine-package.mjs";
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const id=process.argv[2];if(!id)throw new Error("Usage: node tools/build-v8-reference-package.mjs MACHINE_ID");
const candidates=[path.join(ROOT,"repro-v8",id),path.join(ROOT,"validation","v8-rerun",id),path.join(ROOT,"validation","v8",id)];const d=candidates.find(x=>fs.existsSync(path.join(x,"canonical-ui.json")));if(!d)throw new Error("No v8 source directory for "+id);const read=n=>JSON.parse(fs.readFileSync(path.join(d,n),"utf8"));
const runtimePolicy=JSON.parse(fs.readFileSync(path.join(ROOT,"runtime-policy.json"),"utf8"));
const research=read("research-data.json"),selection=read("selection-data.json"),observation=read(fs.existsSync(path.join(d,"observation-contract.json"))?"observation-contract.json":"observation-data.json"),evidence=fs.existsSync(path.join(d,"evidence-contract.json"))?read("evidence-contract.json"):null,highLow=read(fs.existsSync(path.join(d,"high-low-discrimination.json"))?"high-low-discrimination.json":"high-low-discrimination-report.json"),summary=read("machine-research-summary.json"),canonical=read("canonical-ui.json");
const machineIdOf=x=>x.machineId??x.machine?.machineId;for(const [name,x] of Object.entries({research,selection,observation,highLow,summary,canonical}))if(machineIdOf(x)!==id)throw new Error(name+" machineId mismatch");
const featureIds=new Set(selection.features.map(f=>f.featureId).filter(Boolean));
for(const f of selection.features){const dc=f.dependencyContract;if(!dc)continue;const related=dc.relatedFeatureIds??dc.featureIds??[];if(!Array.isArray(related))throw new Error(f.featureId+" dependency relatedFeatureIds invalid");if(dc.combinationPolicy==="DO_NOT_MULTIPLY"&&related.some(x=>!featureIds.has(x)))throw new Error(f.featureId+" dependency target invalid");}
const pkg=compileV8MachinePackage({research,selection,observation,evidence,highLow,summary,canonical,runtimePolicy,materializeUi:materializeCanonicalUiV8});
assertCanonicalRuntimeUiEquality(canonical,pkg.ui,{observationContract:observation,evidenceContract:(()=>{const e=structuredClone(evidence);for(const g of e?.groups??[])for(const o of g.options??[])if(!o.engineBinding)o.engineBinding={mode:"COUNTER_POSITIVE",inputId:"INP_V8_"+String(o.sourceEvidenceId??g.groupId+"_"+o.label).replace(/[^A-Z0-9_]/gi,"_").toUpperCase()};return e;})()});
const out=path.join(d,"machine-package.generated.json");fs.writeFileSync(out,JSON.stringify(pkg,null,2)+"\n");console.log(out);
