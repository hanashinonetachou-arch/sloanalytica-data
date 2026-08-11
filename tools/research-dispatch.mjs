import fs from"node:fs";import path from"node:path";
const assessment=JSON.parse(fs.readFileSync("machine-candidate-assessment.json","utf8"));
const current=fs.existsSync("research-dispatch.json")?JSON.parse(fs.readFileSync("research-dispatch.json","utf8")):null;
const val={LOW:35,MEDIUM:65,HIGH:95},work={LOW:95,MEDIUM:65,HIGH:35};
const scored=[];
for(const c of assessment.candidates??[]){
 if(c.assessmentStatus!=="READY") continue;
 if([c.researchReadiness,c.platformFit,c.settingInferenceValue,c.estimatedWorkload].includes("UNKNOWN")) continue;
 const s=.35*c.marketScore+.25*val[c.researchReadiness]+.20*val[c.platformFit]+.15*val[c.settingInferenceValue]+.05*work[c.estimatedWorkload];
 scored.push({...c,finalScore:Math.round(s*10)/10});
}
scored.sort((a,b)=>b.finalScore-a.finalScore);
if(!scored.length){console.error("ERROR: READY candidate not found");process.exit(1)}
if(current?.activeResearch && ["READY_FOR_FULL_RESEARCH","RESEARCHING"].includes(current.activeResearch.status)){
 console.log(`ACTIVE: ${current.activeResearch.displayName} (${current.activeResearch.status})`);
 console.log("新しい候補は投入しません。active researchを完了またはBLOCKEDへ更新してください。");
 process.exit(0);
}
const x=scored[0],n=String((current?.sequence??0)+1).padStart(3,"0"),dispatchId=`DISPATCH_${new Date().toISOString().slice(0,10).replaceAll("-","")}_${n}`;
const out={schemaVersion:"research-dispatch-v1",sequence:Number(n),generatedAt:new Date().toISOString(),policy:{maxActiveFullResearch:1,selectionRule:"Preflight GO/READY candidates only; highest finalScore first.",machineIdPolicy:"Do not invent machineId at dispatch time. Formal machine authentication during full research assigns it.",usagePolicy:"Only one full-research candidate is active at a time. Others remain queued."},activeResearch:{dispatchId,marketKey:x.marketKey,displayName:x.displayName,machineId:null,finalScore:x.finalScore,status:"READY_FOR_FULL_RESEARCH",createdAt:new Date().toISOString(),researchWorkspace:`research-dispatch/${dispatchId}`,nextAction:"Run full web research, authenticate exact machine identity, then create research-data.json under research/<MACHINE_ID>/."},queue:scored.slice(1).map(c=>({marketKey:c.marketKey,displayName:c.displayName,finalScore:c.finalScore,status:"QUEUED"}))};
fs.writeFileSync("research-dispatch.json",JSON.stringify(out,null,2)+"\n");
fs.mkdirSync(out.activeResearch.researchWorkspace,{recursive:true});
fs.writeFileSync(path.join(out.activeResearch.researchWorkspace,"research-brief.json"),JSON.stringify({dispatchId,marketKey:x.marketKey,displayName:x.displayName,machineId:null,status:"READY_FOR_FULL_RESEARCH",preflight:{researchReadiness:x.researchReadiness,platformFit:x.platformFit,estimatedWorkload:x.estimatedWorkload,settingInferenceValue:x.settingInferenceValue,finalScore:x.finalScore},requiredResearchOutputs:["formal machine authentication","multiple-source setting-difference facts","candidate Feature definitions","candidate Evidence definitions","source conflict log","final research-data.json"],constraints:["Do not reuse preflight numerical values as authoritative MachineData facts.","Do not invent missing settings or probabilities.","Authenticate exact model before assigning machineId.","Cross-check important values across multiple reputable sources where available."]},null,2)+"\n");
console.log(`DISPATCHED: ${x.displayName} / score ${x.finalScore} / ${dispatchId}`);
