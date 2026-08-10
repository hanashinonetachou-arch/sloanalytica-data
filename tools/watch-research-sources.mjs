import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const STATE=path.join(ROOT,"update-watch","state.json");
const REPORT=path.join(ROOT,"update-watch","report.json");

function readJson(p){ return JSON.parse(fs.readFileSync(p,"utf8")); }
function writeJson(p,v){ fs.mkdirSync(path.dirname(p),{recursive:true}); fs.writeFileSync(p,JSON.stringify(v,null,2)+"\n","utf8"); }
function sha(s){ return crypto.createHash("sha256").update(s).digest("hex"); }
function normalizeBody(s){ return s.replace(/\r\n/g,"\n").replace(/[ \t]+$/gm,"").trim(); }

export function collectSources(root=ROOT){
 const out=[];
 const researchRoot=path.join(root,"research");
 if(!fs.existsSync(researchRoot)) return out;
 for(const ent of fs.readdirSync(researchRoot,{withFileTypes:true})){
   if(!ent.isDirectory() || ent.name==="_template") continue;
   const p=path.join(researchRoot,ent.name,"research-data.json");
   if(!fs.existsSync(p)) continue;
   const d=readJson(p);
   for(const s of d.sources??[]){
     if(/^https?:\/\//.test(s.url??"")) out.push({machineId:d.machine.machineId,sourceId:s.sourceId,url:s.url,publisher:s.publisher,title:s.title});
   }
 }
 return out;
}
export function compareSnapshot(prev,next){
 if(!prev) return {status:"NEW",reasons:["no_previous_snapshot"]};
 const reasons=[];
 if(prev.etag && next.etag && prev.etag!==next.etag) reasons.push("etag");
 if(prev.lastModified && next.lastModified && prev.lastModified!==next.lastModified) reasons.push("last_modified");
 if(prev.bodySha256 && next.bodySha256 && prev.bodySha256!==next.bodySha256) reasons.push("body_sha256");
 if(prev.statusCode!==next.statusCode) reasons.push("status_code");
 return {status:reasons.length?"CHANGED":"UNCHANGED",reasons};
}
export async function fetchSnapshot(source,fetchImpl=fetch){
 const headers={"user-agent":"SloAnalytica-SourceWatch/1.0"};
 const r=await fetchImpl(source.url,{headers,redirect:"follow"});
 const text=await r.text();
 return {
   machineId:source.machineId,sourceId:source.sourceId,url:source.url,
   checkedAt:new Date().toISOString(),statusCode:r.status,
   etag:r.headers.get("etag"),lastModified:r.headers.get("last-modified"),
   contentType:r.headers.get("content-type"),
   contentLength:text.length,bodySha256:sha(normalizeBody(text))
 };
}
async function check(){
 const sources=collectSources();
 const old=fs.existsSync(STATE)?readJson(STATE):{version:"source-watch-state-v1",snapshots:{}};
 const next={version:"source-watch-state-v1",generatedAt:new Date().toISOString(),snapshots:{...old.snapshots}};
 const items=[];
 for(const s of sources){
   const key=`${s.machineId}:${s.sourceId}`;
   try{
     const snap=await fetchSnapshot(s);
     const cmp=compareSnapshot(old.snapshots?.[key],snap);
     next.snapshots[key]=snap;
     items.push({...s,...cmp,httpStatus:snap.statusCode});
     console.log(`${cmp.status}: ${key} ${s.url}`);
   }catch(e){
     items.push({...s,status:"CHECK_FAILED",reasons:[String(e.message??e)]});
     console.log(`CHECK_FAILED: ${key} ${s.url}`);
   }
 }
 const changed=items.filter(x=>x.status==="CHANGED"||x.status==="NEW");
 const failed=items.filter(x=>x.status==="CHECK_FAILED");
 const report={version:"source-watch-report-v1",generatedAt:new Date().toISOString(),
   summary:{sourceCount:items.length,changedCount:changed.length,failedCount:failed.length,unchangedCount:items.filter(x=>x.status==="UNCHANGED").length},
   status:failed.length?"CHECK_FAILED":changed.length?"REVIEW_REQUIRED":"NO_CHANGES",
   changed,failed,items};
 writeJson(REPORT,report);
 writeJson(STATE,next);
 console.log(`REPORT: ${report.status} / changed ${changed.length} / failed ${failed.length}`);
}
function status(){
 if(!fs.existsSync(REPORT)){console.log(JSON.stringify({status:"NOT_RUN"},null,2));return;}
 console.log(fs.readFileSync(REPORT,"utf8"));
}
const cmd=process.argv[2]??"help";
if(cmd==="check") await check();
else if(cmd==="status") status();
else console.log(`SloAnalytica Source Update Watch v1
Usage:
  npm run sources:watch -- check
  npm run sources:watch -- status

check: ResearchDataの公開URLだけ取得し、前回snapshotとの差を検知
AI再調査対象: report.json の changed / failed のみ`);
