import fs from 'node:fs';
import path from 'node:path';

const hits=[];
for (const id of fs.readdirSync('research')) {
  const p=path.join('research',id,'ui-design-data.json');
  if (!fs.existsSync(p)) continue;
  const ui=JSON.parse(fs.readFileSync(p,'utf8'));
  for (const [inputId,c] of Object.entries(ui.inputContracts??{})) {
    const name=String(c?.name??'');
    if (name.includes('有効')) hits.push({machineId:id,inputId,name});
  }
}
console.log(JSON.stringify(hits,null,2));
if (hits.length) {
  console.error(`Found ${hits.length} user-facing input names containing 有効`);
  process.exit(1);
}
console.log('PASS: no user-facing input name contains 有効');
