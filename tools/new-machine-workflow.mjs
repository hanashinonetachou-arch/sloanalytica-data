import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const RESEARCH_ROOT=path.join(ROOT,"research");
const BUILD_ROOT=path.join(ROOT,"build");

function die(msg,code=1){ console.error(`ERROR: ${msg}`); process.exit(code); }
function readJson(p){ return JSON.parse(fs.readFileSync(p,"utf8")); }
function writeJson(p,v){ fs.mkdirSync(path.dirname(p),{recursive:true}); fs.writeFileSync(p,JSON.stringify(v,null,2)+"\n","utf8"); }
function exists(p){ return fs.existsSync(p); }
function runNode(tool,args){
  const r=spawnSync(process.execPath,[path.join(ROOT,"tools",tool),...args],{cwd:ROOT,encoding:"utf8"});
  return {ok:r.status===0,status:r.status,stdout:r.stdout??"",stderr:r.stderr??""};
}
function sha256(p){ return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex"); }

function machinePaths(machineId){
  const dir=path.join(RESEARCH_ROOT,machineId);
  const buildDir=path.join(BUILD_ROOT,machineId);
  return {
    dir, buildDir,
    research:path.join(dir,"research-data.json"),
    selection:path.join(dir,"selection-data.json"),
    stats:path.join(buildDir,"statistics-report.json"),
    generated:path.join(buildDir,"machine-package.generated.json"),
    report:path.join(buildDir,"workflow-report.json"),
    existing:path.join(ROOT,"machines",machineId,"machine-package.json")
  };
}
function validateMachineId(id){
  if(!/^[A-Z0-9_]+$/.test(id)) die("machineIdは英大文字・数字・_のみ使用できます。");
}
function init(machineId){
  validateMachineId(machineId);
  const p=machinePaths(machineId);
  fs.mkdirSync(p.dir,{recursive:true});
  if(exists(p.research)||exists(p.selection)) die(`${machineId} の作業ファイルは既に存在します。`);
  const r=readJson(path.join(RESEARCH_ROOT,"_template","research-data.json"));
  r.machine.machineId=machineId;
  r.machine.displayName="TODO: 機種名";
  r.machine.formalName="TODO: 正式名称";
  r.machine.modelNumber="TODO: 型式名";
  r.machine.manufacturer="TODO: メーカー";
  r.sources[0].url="https://example.com/TODO";
  const s=readJson(path.join(RESEARCH_ROOT,"_template","selection-data.json"));
  s.machineId=machineId;
  writeJson(p.research,r); writeJson(p.selection,s);
  console.log(`INIT OK: research/${machineId}/`);
  console.log("次に research-data.json を調査結果で埋め、統計評価後に selection-data.json を承認内容で更新してください。");
}
function jsonDiffSummary(a,b){
  const sections=["machine","inputs","features","evidence","ui","reliability","metadata","validation","statistics"];
  return sections.map(k=>({section:k,equal:JSON.stringify(a?.[k])===JSON.stringify(b?.[k])}));
}
function run(machineId){
  validateMachineId(machineId);
  const p=machinePaths(machineId);
  if(!exists(p.research)) die(`ResearchDataがありません: research/${machineId}/research-data.json`);
  if(!exists(p.selection)) die(`SelectionDataがありません: research/${machineId}/selection-data.json`);
  fs.mkdirSync(p.buildDir,{recursive:true});
  const steps=[];
  const execute=(name,tool,args)=>{
    const r=runNode(tool,args);
    steps.push({name,status:r.ok?"PASS":"FAIL",exitCode:r.status,stdout:r.stdout.trim(),stderr:r.stderr.trim()});
    if(!r.ok){
      const report={workflowVersion:"machine-workflow-v1",machineId,status:"FAIL",failedStep:name,steps};
      writeJson(p.report,report);
      console.error(r.stdout); console.error(r.stderr);
      die(`${name} で停止しました。workflow-report.jsonを確認してください。`);
    }
  };
  execute("researchValidation","validate-research-data.mjs",[p.research]);
  execute("statisticalEvaluation","evaluate-research-statistics.mjs",[p.research,p.stats]);
  execute("selectionValidation","validate-selection-data.mjs",[p.selection,p.research]);
  execute("machineBuild","build-machine-data.mjs",[p.research,p.selection,p.generated]);

  const generated=readJson(p.generated);
  let comparison={existingMachine:false};
  if(exists(p.existing)){
    const existing=readJson(p.existing);
    const sections=jsonDiffSummary(existing,generated);
    comparison={existingMachine:true,sections,identical:sections.every(x=>x.equal)};
  }
  const report={
    workflowVersion:"machine-workflow-v1",
    machineId,status:"READY_FOR_REVIEW",
    generatedAt:new Date().toISOString(),
    inputs:{research:`research/${machineId}/research-data.json`,selection:`research/${machineId}/selection-data.json`},
    outputs:{
      statistics:`build/${machineId}/statistics-report.json`,
      machineDraft:`build/${machineId}/machine-package.generated.json`,
      machineDraftSha256:sha256(p.generated)
    },
    steps,comparison,
    nextAction:"生成物をレビューし、承認後に公開反映工程へ進む。CLIはmachines/やcatalog.jsonを自動変更しない。"
  };
  writeJson(p.report,report);
  console.log(`READY_FOR_REVIEW: ${machineId}`);
  console.log(`  statistics: build/${machineId}/statistics-report.json`);
  console.log(`  draft:      build/${machineId}/machine-package.generated.json`);
  console.log(`  report:     build/${machineId}/workflow-report.json`);
  if(comparison.existingMachine){
    const changed=comparison.sections.filter(x=>!x.equal).map(x=>x.section);
    console.log(`  existing diff sections: ${changed.length?changed.join(", "):"none"}`);
  }
}
function status(machineId){
  validateMachineId(machineId);
  const p=machinePaths(machineId);
  const state={
    machineId,
    researchData:exists(p.research),
    selectionData:exists(p.selection),
    statisticsReport:exists(p.stats),
    machineDraft:exists(p.generated),
    workflowReport:exists(p.report),
    publishedMachine:exists(p.existing)
  };
  if(exists(p.report)){
    try{ state.lastWorkflowStatus=readJson(p.report).status; }catch{}
  }
  console.log(JSON.stringify(state,null,2));
}
function help(){
 console.log(`SloAnalytica New Machine Workflow v1

Usage:
  npm run machine:new -- init <MACHINE_ID>
  npm run machine:new -- run <MACHINE_ID>
  npm run machine:new -- status <MACHINE_ID>

init   ResearchData / SelectionData の作業雛形を作成
run    Research検証 -> 統計評価 -> Selection検証 -> MachineData下書き生成 -> 差分要約
status 作業ファイル・生成物の状態確認

Safety:
  run は machines/ と catalog.json を変更しません。公開反映は人間承認後の別工程です。`);
}
const [cmd,id]=process.argv.slice(2);
if(!cmd || cmd==="help" || cmd==="--help") help();
else if(!id) die("machineIdを指定してください。",2);
else if(cmd==="init") init(id);
else if(cmd==="run") run(id);
else if(cmd==="status") status(id);
else die(`unknown command: ${cmd}`,2);
