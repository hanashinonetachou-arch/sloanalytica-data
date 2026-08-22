import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const write=(p,v)=>fs.writeFileSync(path.join(ROOT,p),JSON.stringify(v,null,2)+'\n');

// One Punch: rejected role candidates should be explained, not exposed as reference-only inputs.
{
 const p='research/L_ONE_PUNCH_MAN/selection-data.json';
 const s=read(p);
 const rejectedInputIds=new Set(['INP_ROLE_GAMES','INP_WEAK_CHERRY','INP_WATERMELON']);
 s.inputs=(s.inputs??[]).filter(x=>!rejectedInputIds.has(x.id));
 if(s.uiCategoryLabels) delete s.uiCategoryLabels.ROLE;
 const f=(s.features??[]).find(x=>x.researchFeatureId==='RF_SMALL_ROLE_MULTI');
 if(f){
  f.userReason='弱チェリー・スイカの設定差は確認済み。ただしAT初当りと因果的に重なるため、独立Featureとして同時採用せず不採用。';
  f.rejectionReason='弱チェリーとスイカ同士はMultinomialで安全にまとめられるが、採用中のAT初当りはこれら小役を経由して生じる下流事象でもあり、周辺AT確率と小役確率を独立に掛けると設定情報を二重評価する可能性がある。ATを捨てて小役だけに置換するほどの情報量もないため現版では不採用。';
 }
 write(p,s);
}

// Gamera2 / Word of Lights: blank means unobserved; explicit 0 means observed zero.
// This lets detailed linked counters suppress the fallback only when the user actually used them.
for(const [p,inputId] of [
 ['research/S_GAMERA2/selection-data.json','INP_REACHME_CDEF_COUNT'],
 ['research/S_WORD_OF_LIGHTS_2/selection-data.json','INP_ROLE_4A_COUNT'],
]){
 const s=read(p); const input=(s.inputs??[]).find(x=>x.id===inputId); if(input) input.defaultValue=''; write(p,s);
}

// Gamera2 BIG-screen Evidence is now driven by the counters themselves. Avoid duplicate manual choices.
{
 const p='research/S_GAMERA2/selection-data.json'; const s=read(p);
 const group=(s.evidenceUi?.groups??[]).find(g=>g.groupId==='SETTING_FLOOR');
 if(group){
  group.options=(group.options??[]).filter(o=>!(o.sourceEvidenceIds??[]).includes('EV_BB_NOT_BAD'));
  for(const o of group.options??[]) o.sourceEvidenceIds=(o.sourceEvidenceIds??[]).filter(id=>id!=='EV_BB_GAMERA');
 }
 write(p,s);
}

console.log('Applied batch01 post-cleanup: observation semantics and duplicate Evidence UI are normalized.');
