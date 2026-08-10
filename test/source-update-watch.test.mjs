import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { compareSnapshot, collectSources, fetchSnapshot } from "../tools/watch-research-sources.mjs";

test("same snapshot is unchanged",()=>{
 const a={etag:"x",lastModified:"d",bodySha256:"h",statusCode:200};
 assert.equal(compareSnapshot(a,{...a}).status,"UNCHANGED");
});
test("body hash change is detected",()=>{
 const a={etag:null,lastModified:null,bodySha256:"a",statusCode:200};
 const r=compareSnapshot(a,{...a,bodySha256:"b"});
 assert.equal(r.status,"CHANGED"); assert.ok(r.reasons.includes("body_sha256"));
});
test("new source is NEW",()=> assert.equal(compareSnapshot(null,{statusCode:200}).status,"NEW"));
test("collectSources reads ResearchData only",()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),"sw-"));
 fs.mkdirSync(path.join(root,"research","M"),{recursive:true});
 fs.writeFileSync(path.join(root,"research","M","research-data.json"),JSON.stringify({
   machine:{machineId:"M"},sources:[{sourceId:"S",url:"https://example.com",publisher:"P",title:"T"}]
 }));
 const s=collectSources(root); assert.equal(s.length,1); assert.equal(s[0].machineId,"M");
});
test("fetchSnapshot hashes normalized response body",async()=>{
 const headers=new Headers({"etag":"E","last-modified":"D","content-type":"text/html"});
 const mock=async()=>({status:200,headers,text:async()=>"abc  \r\n"});
 const s=await fetchSnapshot({machineId:"M",sourceId:"S",url:"https://example.com"},mock);
 assert.equal(s.statusCode,200); assert.equal(s.etag,"E"); assert.equal(s.bodySha256.length,64);
});
