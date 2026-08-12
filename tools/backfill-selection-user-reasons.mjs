import fs from 'node:fs';
import path from 'node:path';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
export function backfillSelectionUserReasons(root,{apply=false}={}){
  const researchRoot=path.join(root,'research'), machineRoot=path.join(root,'machines');
  const changes=[];
  for(const ent of fs.readdirSync(researchRoot,{withFileTypes:true})){
    if(!ent.isDirectory()||ent.name.startsWith('_')) continue;
    const sp=path.join(researchRoot,ent.name,'selection-data.json');
    const mp=path.join(machineRoot,ent.name,'machine-package.json');
    if(!fs.existsSync(sp)||!fs.existsSync(mp)) continue;
    const selection=read(sp), pkg=read(mp);
    const byId=new Map((pkg.features?.features??[]).map(f=>[f.featureId,f]));
    let changed=false;
    for(const sf of selection.features??[]){
      if(!['INCLUDE_PRIMARY','INCLUDE_SUPPORT'].includes(sf.adoptionCategory)||sf.userReason) continue;
      const rationale=byId.get(sf.featureId)?.selectionRationale;
      const reason=rationale?.adoptionReason??rationale?.summary;
      if(typeof reason==='string'&&reason.trim()){
        sf.userReason=reason.trim(); changed=true;
        changes.push({machineId:ent.name,featureId:sf.featureId,userReason:sf.userReason});
      }
    }
    if(changed&&apply) write(sp,selection);
  }
  return {apply,changeCount:changes.length,changes};
}
if(import.meta.url===`file://${process.argv[1]}`){
  const root=path.resolve(process.argv[2]??'.');
  const apply=process.argv.includes('--apply');
  const r=backfillSelectionUserReasons(root,{apply});
  console.log(`Selection userReason backfill: ${r.changeCount}件${apply?'を反映':'（dry-run）'}`);
  for(const x of r.changes) console.log(`${x.machineId} ${x.featureId}: ${x.userReason}`);
}
