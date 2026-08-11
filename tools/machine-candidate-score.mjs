import fs from"node:fs";
const d=JSON.parse(fs.readFileSync("machine-candidate-assessment.json","utf8"));
const v={LOW:35,MEDIUM:65,HIGH:95};const work={LOW:95,MEDIUM:65,HIGH:35};
const scored=[];
for(const c of d.candidates??[]){
 if([c.researchReadiness,c.platformFit,c.settingInferenceValue,c.estimatedWorkload].includes("UNKNOWN"))continue;
 const score=0.35*c.marketScore+0.25*v[c.researchReadiness]+0.20*v[c.platformFit]+0.15*v[c.settingInferenceValue]+0.05*work[c.estimatedWorkload];
 scored.push({...c,finalScore:Math.round(score*10)/10});
}
scored.sort((a,b)=>b.finalScore-a.finalScore);
console.log(`最終評価済み: ${scored.length} / ${d.candidates.length}`);
for(const c of scored)console.log(`${c.finalScore}\t${c.displayName}\t市場:${c.marketScore} 情報:${c.researchReadiness} Fit:${c.platformFit} 推測価値:${c.settingInferenceValue} 工数:${c.estimatedWorkload}`);
