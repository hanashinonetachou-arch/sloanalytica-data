import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ids=['S_KIZUMONOGATARI_FS','S_MOECHIBA_GNC30','S_NAMENEKO_QQ','S_NINJA_JAJAMARU','S_OKIDOKI_BLACK_EP','S_OKIDOKI_GORGEOUS_GS','S_RYUJIN_RZ30_SUIKA_VERSION','S_SUHANA_RISING_PC30','S_WORD_OF_LIGHTS_2'];
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
test('compact canonical UI batch16 snapshot',()=>{
 for(const machineId of ids){
  const pkg=read(`machines/${machineId}/machine-package.json`); const obs=read(`research/${machineId}/machine-observation-data.json`);
  const inputMap=new Map((pkg.inputs?.inputs??[]).map(i=>[i.id,i])); const used=[];
  for(const section of pkg.ui?.sections??[]) for(const item of section.items??[]) if(item.inputId&&!used.includes(item.inputId)) used.push(item.inputId);
  const compact={machineId,ui:pkg.ui,inputs:used.map(id=>{const i=inputMap.get(id)??{};return{id,name:i.name,type:i.type,description:i.description,uiQuickAdd:i.uiQuickAdd,options:i.options};}),unresolved:(obs.fieldVerification??[]).filter(v=>!['verified','closed','resolved','done'].includes(String(v.status??'').toLowerCase())),observationSchema:obs.schemaVersion};
  console.log(`CANONICAL_UI_COMPACT ${machineId} ${JSON.stringify(compact)}`);
 }
});
