import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const BUILD_ROOT=path.join(ROOT,"build");
const CATALOG=path.join(ROOT,"catalog.json");

function die(msg,code=1){ console.error(`ERROR: ${msg}`); process.exit(code); }
function readJson(p){ return JSON.parse(fs.readFileSync(p,"utf8")); }
function writeJson(p,v){ fs.mkdirSync(path.dirname(p),{recursive:true}); fs.writeFileSync(p,JSON.stringify(v,null,2)+"\n","utf8"); }
function sha256(p){ return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex"); }
function canonicalJsonBuffer(p){
 const value=readJson(p);
 return Buffer.from(JSON.stringify(value,null,2)+"\n","utf8");
}
function sha256Buffer(buffer){ return crypto.createHash("sha256").update(buffer).digest("hex"); }
function exists(p){ return fs.existsSync(p); }
function validId(id){ return /^[A-Z0-9_]+$/.test(id); }

function paths(id){
 const b=path.join(BUILD_ROOT,id);
 return {
  build:b,
  generated:path.join(b,"machine-package.generated.json"),
  approved:path.join(b,"machine-package.approved.json"),
  approval:path.join(b,"approval.json"),
  publishReport:path.join(b,"publish-report.json"),
  targetDir:path.join(ROOT,"machines",id),
  target:path.join(ROOT,"machines",id,"machine-package.json")
 };
}
function deriveCapabilities(pkg){
 const caps=new Set();
 for(const f of pkg.features?.features??[]){
   if(f.modelType) caps.add(f.modelType);
   if(f.calculationRole==="DISPLAY_ONLY") caps.add("reference_display");
   if(f.autoAccumulator || f.inputTransform==="auto_accumulator") caps.add("auto_accumulator");
   if(Array.isArray(f.denominatorAdjustments)&&f.denominatorAdjustments.length) caps.add("derived_denominator");
   if(Array.isArray(f.suppressedByFeatureIds)&&f.suppressedByFeatureIds.length) caps.add("feature_suppression");
 }
 if((pkg.evidence?.evidences??[]).length) caps.add("evidence");
 if((pkg.inputs?.inputs??[]).some(i=>i.type==="multi_enum")) caps.add("evidence_multi_select");
 return [...caps];
}
function defaultPackageUrl(id){
 return `https://raw.githubusercontent.com/hanashinonetachou-arch/sloanalytica-data/prototype-multi-machine/machines/${id}/machine-package.json`;
}
function approve(id,sourceArg){
 if(!validId(id)) die("machineIdが不正です。");
 const p=paths(id);
 const source=sourceArg ? path.resolve(sourceArg) : p.generated;
 if(!exists(source)) die(`承認対象がありません: ${source}`);
 const pkg=readJson(source);
 if(pkg.machine?.machineId!==id) die("承認対象のmachineIdが一致しません。");
 fs.mkdirSync(p.build,{recursive:true});
 const approvedBytes=canonicalJsonBuffer(source);
 fs.writeFileSync(p.approved,approvedBytes);
 const hash=sha256Buffer(approvedBytes);
 const approval={
   approvalVersion:"machine-publish-approval-v1",
   machineId:id,
   approvedSha256:hash,
   machineDataVersion:pkg.machine?.machineDataVersion,
   approvedAt:new Date().toISOString(),
   source:path.relative(ROOT,source).replaceAll("\\","/"),
   note:"このSHAのapproved packageだけがpublish可能。内容変更後は再approveが必要。"
 };
 writeJson(p.approval,approval);
 console.log(`APPROVED: ${id}`);
 console.log(`  sha256: ${hash}`);
 console.log(`  approved: build/${id}/machine-package.approved.json`);
}
function audit(){
 const r=spawnSync(process.execPath,[path.join(ROOT,"tools","audit-public-data.mjs")],{cwd:ROOT,encoding:"utf8"});
 return {ok:r.status===0,stdout:r.stdout??"",stderr:r.stderr??"",status:r.status};
}
function publish(id,apply){
 if(!validId(id)) die("machineIdが不正です。");
 const p=paths(id);
 if(!exists(p.approved)||!exists(p.approval)) die("approved package / approval.json がありません。先に approve してください。");
 const approval=readJson(p.approval);
 const approvedBytes=canonicalJsonBuffer(p.approved);
 const actualSha=sha256Buffer(approvedBytes);
 if(approval.machineId!==id || approval.approvedSha256!==actualSha) die("承認後にapproved packageが変更されています。再approveしてください。");
 const pkg=JSON.parse(approvedBytes.toString("utf8"));
 if(pkg.machine?.machineId!==id) die("approved packageのmachineIdが一致しません。");
 const catalog=readJson(CATALOG);
 const machines=Array.isArray(catalog.machines)?catalog.machines:[];
 const idx=machines.findIndex(m=>m.machineId===id);
 const existing=idx>=0?machines[idx]:null;
 const packageBytes=approvedBytes.length;
 const entry={
   machineId:id,
   displayName:pkg.machine?.displayName,
   manufacturer:pkg.machine?.manufacturer,
   machineDataVersion:pkg.machine?.machineDataVersion,
   ...(existing?.minimumAppVersionCode!==undefined?{minimumAppVersionCode:existing.minimumAppVersionCode}:{}),
   requiredCapabilities: deriveCapabilities(pkg),
   packageUrl: existing?.packageUrl ?? defaultPackageUrl(id),
   sha256:actualSha,
   packageSizeBytes:packageBytes,
   status:existing?.status ?? "available",
   addedAt: existing?.addedAt ?? new Date().toISOString()
 };
 const nextCatalog=structuredClone(catalog);
 nextCatalog.generatedAt=new Date().toISOString();
 if(idx>=0) nextCatalog.machines[idx]=entry; else nextCatalog.machines.push(entry);
 nextCatalog.machines.sort((a,b)=>(b.addedAt??"").localeCompare(a.addedAt??"") || String(a.displayName??"").localeCompare(String(b.displayName??""),"ja"));

 const reportBase={
   publishVersion:"machine-publish-v1",machineId:id,mode:apply?"APPLY":"DRY_RUN",
   approvedSha256:actualSha,packageSizeBytes:packageBytes,
   catalogAction:idx>=0?"update":"add",catalogEntry:entry
 };
 if(!apply){
   writeJson(p.publishReport,{...reportBase,status:"DRY_RUN_OK",nextAction:"内容確認後に npm run machine:publish -- publish MACHINE_ID --apply"});
   console.log(`DRY_RUN_OK: ${id}`);
   console.log(`  catalog: ${idx>=0?"update":"add"} / ${entry.machineDataVersion} / ${packageBytes} bytes`);
   console.log(`  sha256: ${actualSha}`);
   return;
 }
 const oldCatalog=fs.readFileSync(CATALOG);
 const oldTarget=exists(p.target)?fs.readFileSync(p.target):null;
 try{
   fs.mkdirSync(p.targetDir,{recursive:true});
   fs.writeFileSync(p.target,approvedBytes);
   writeJson(CATALOG,nextCatalog);
   const result=audit();
   if(!result.ok) throw new Error(`最終Auditor失敗\n${result.stdout}\n${result.stderr}`);
   writeJson(p.publishReport,{...reportBase,status:"PUBLISHED_AND_AUDITED",audit:"PASS"});
   console.log(`PUBLISHED_AND_AUDITED: ${id}`);
   console.log(`  catalog ${idx>=0?"updated":"added"}`);
   console.log(`  sha256: ${actualSha}`);
 }catch(e){
   fs.writeFileSync(CATALOG,oldCatalog);
   if(oldTarget!==null){ fs.mkdirSync(p.targetDir,{recursive:true}); fs.writeFileSync(p.target,oldTarget); }
   else if(exists(p.target)) fs.rmSync(p.target);
   writeJson(p.publishReport,{...reportBase,status:"ROLLED_BACK",error:String(e.message??e)});
   die(`公開反映をロールバックしました: ${e.message??e}`);
 }
}
function status(id){
 if(!validId(id)) die("machineIdが不正です。");
 const p=paths(id);
 const out={machineId:id,generated:exists(p.generated),approved:exists(p.approved),approval:exists(p.approval),
   approvalValid:false,published:exists(p.target),publishReport:exists(p.publishReport)};
 if(out.approved&&out.approval){
   try{ const a=readJson(p.approval); const bytes=canonicalJsonBuffer(p.approved); const hash=sha256Buffer(bytes); out.approvalValid=a.approvedSha256===hash; out.approvedSha256=hash; }catch{}
 }
 if(out.publishReport){ try{out.lastPublishStatus=readJson(p.publishReport).status;}catch{} }
 console.log(JSON.stringify(out,null,2));
}
function help(){
 console.log(`SloAnalytica Publish Workflow v1
Usage:
  npm run machine:publish -- approve <MACHINE_ID> [reviewed-package-path]
  npm run machine:publish -- publish <MACHINE_ID>
  npm run machine:publish -- publish <MACHINE_ID> --apply
  npm run machine:publish -- status <MACHINE_ID>

Safety:
  approve  : レビュー済みpackageを固定SHAで承認
  publish  : デフォルトはDRY RUN。公開データは変更しない
  --apply  : machines/反映 + catalog更新 + 最終Auditor
  Audit失敗時はmachines/catalogを自動ロールバック`);
}
const args=process.argv.slice(2),cmd=args[0],id=args[1];
if(!cmd||cmd==="help"||cmd==="--help") help();
else if(!id) die("machineIdを指定してください。",2);
else if(cmd==="approve") approve(id,args[2]);
else if(cmd==="publish") publish(id,args.includes("--apply"));
else if(cmd==="status") status(id);
else die(`unknown command: ${cmd}`,2);
