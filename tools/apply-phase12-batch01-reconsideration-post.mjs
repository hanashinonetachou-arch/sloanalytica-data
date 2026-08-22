import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const p=path.join(ROOT,'research/L_ONE_PUNCH_MAN/selection-data.json');
const s=JSON.parse(fs.readFileSync(p,'utf8'));
const rejectedInputIds=new Set(['INP_ROLE_GAMES','INP_WEAK_CHERRY','INP_WATERMELON']);
s.inputs=(s.inputs??[]).filter(x=>!rejectedInputIds.has(x.id));
if(s.uiCategoryLabels) delete s.uiCategoryLabels.ROLE;
const f=(s.features??[]).find(x=>x.researchFeatureId==='RF_SMALL_ROLE_MULTI');
if(f){
 f.userReason='弱チェリー・スイカの設定差は確認済み。ただしAT初当りと因果的に重なるため、独立Featureとして同時採用せず不採用。';
 f.rejectionReason='弱チェリーとスイカ同士はMultinomialで安全にまとめられるが、採用中のAT初当りはこれら小役を経由して生じる下流事象でもあり、周辺AT確率と小役確率を独立に掛けると設定情報を二重評価する可能性がある。ATを捨てて小役だけに置換するほどの情報量もないため現版では不採用。';
}
fs.writeFileSync(p,JSON.stringify(s,null,2)+'\n');
console.log('Applied One Punch post-cleanup: rejected role inputs are not exposed.');
