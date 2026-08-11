import fs from"node:fs";
const spec=JSON.parse(fs.readFileSync(process.argv[2],"utf8"));
const research=JSON.parse(fs.readFileSync(process.argv[3],"utf8"));
const selected=JSON.parse(process.argv[4]??"{}");
let remain=new Set(research.machine.settings),hasEvidence=false;
for(const g of spec.groups){
  const raw=selected[g.groupId];
  const vals=raw==null?[]:(Array.isArray(raw)?raw:[raw]);
  for(const v of vals){
    const o=g.options.find(x=>x.value===v);
    if(!o){console.error(`ERROR: unknown ${g.groupId} value ${v}`);process.exit(2)}
    hasEvidence=true;
    if(o.allowedSettings)remain=new Set([...remain].filter(x=>o.allowedSettings.includes(x)));
    for(const x of o.excludedSettings??[])remain.delete(x);
  }
}
const remainingSettings=[...remain];
console.log(JSON.stringify({
  status:remainingSettings.length?"OK":"EVIDENCE_CONTRADICTION",
  hasEvidence,
  remainingSettings
},null,2));
