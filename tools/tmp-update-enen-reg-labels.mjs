import fs from 'node:fs';
const p='research/L_ENEN_NO_SHOUBOUTAI_JG/selection-data.json';
const d=JSON.parse(fs.readFileSync(p,'utf8'));
d.machineDataVersion='0.1.6';
const labels={
INP_REG_SCENARIO_E8_1:'シンラ→アーサー→タマキ→マキ→ヒナワ',
INP_REG_SCENARIO_IRIS_2:'アイリス→オウビ→まもるくん→ヒバナ→バーンズ',
INP_REG_SCENARIO_IRIS_3:'アイリス→オウビ→ハラン→まもるくん→バーンズ',
INP_REG_SCENARIO_IRIS_4:'アイリス→オウビ→ハラン→ヒバナ→まもるくん',
INP_REG_SCENARIO_DENDO_1:'ジョヴァンニ→アロー→アサルト→フレイル→ヨナ',
INP_REG_SCENARIO_E8_2:'シンラ→リヒト→ヴァルカン→アイリス→オウビ',
INP_REG_SCENARIO_IRIS_1:'アイリス→まもるくん→ハラン→ヒバナ→バーンズ',
INP_REG_SCENARIO_E8_3:'シンラ→アーサー→タマキ→マキ→紅丸',
INP_REG_SCENARIO_CAPTAIN:'ジョヴァンニ→オウビ→ヒバナ→バーンズ→紅丸',
INP_REG_SCENARIO_DENDO_2:'ジョヴァンニ→アロー→アサルト→フレイル→ショウ',
INP_REG_SCENARIO_IRIS_5:'アイリス→オウビ→ハラン→ヒバナ→バーンズ'
};
for(const i of d.inputs){if(labels[i.id]) i.name=labels[i.id]; if(i.id==='INP_INITIAL') i.description='通常時の初当りボーナスと灰焔騎士団の初当りを合計した回数です。';}
d.uiCategoryDescriptions.REG_SCENARIO='REG中に表示された5人のキャラ順と一致する項目へ+1してください。11項目の合計を確認回数として自動計算します。';
fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n');
