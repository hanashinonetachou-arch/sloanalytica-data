import fs from"node:fs";
const d=JSON.parse(fs.readFileSync("machine-candidate-assessment.json","utf8"));
const args=process.argv.slice(2);const ni=args.indexOf("--limit");const limit=ni>=0?Math.max(1,Number(args[ni+1])||5):5;
const rows=(d.candidates??[]).filter(c=>c.assessmentStatus==="MARKET_ONLY").sort((a,b)=>b.marketScore-a.marketScore).slice(0,limit);
console.log(`AI/Web調査キュー: ${rows.length}機種（全${d.candidates.length}候補を一括調査しない）`);
for(const [i,c] of rows.entries())console.log(`${i+1}. ${c.displayName}\tmarketScore=${c.marketScore}\t${c.marketKey}`);
