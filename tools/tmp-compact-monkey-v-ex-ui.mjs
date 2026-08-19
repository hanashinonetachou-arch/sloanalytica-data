import fs from 'node:fs';

const builderPath = 'tools/build-machine-data.mjs';
let builder = fs.readFileSync(builderPath, 'utf8');
const oldSection = `      displayOrder:order++,\n      items:items.sort((a,b)=>a.displayOrder-b.displayOrder).map(i=>({\n        type:\"input\",inputId:i.id,label:i.name,\n        widget:i.type===\"counter\"?\"counter\":i.type===\"boolean\"?\"boolean\":i.type===\"enum\"?\"select\":i.type===\"multi_enum\"?\"multi_select\":\"number\"\n      }))`;
const newSection = `      displayOrder:order++,\n      ...(selection.uiCategoryDescriptions?.[cat]?{description:selection.uiCategoryDescriptions[cat]}:{}),\n      items:items.sort((a,b)=>a.displayOrder-b.displayOrder).map(i=>({\n        type:\"input\",inputId:i.id,label:i.name,\n        ...(i.uiGridSpan?{gridSpan:i.uiGridSpan}:{}),\n        widget:i.type===\"counter\"?\"counter\":i.type===\"boolean\"?\"boolean\":i.type===\"enum\"?\"select\":i.type===\"multi_enum\"?\"multi_select\":\"number\"\n      }))`;
if (!builder.includes(oldSection)) throw new Error('builder target not found');
builder = builder.replace(oldSection, newSection);
fs.writeFileSync(builderPath, builder, 'utf8');

const selectionPath = 'research/L_MONKEY_TURN5_CE/selection-data.json';
const selection = JSON.parse(fs.readFileSync(selectionPath, 'utf8'));
const compactIds = new Set([
  'INP_EX_WEAK_TRIALS','INP_EX_WEAK_HITS',
  'INP_EX_WEAK_CHANCE_TRIALS','INP_EX_WEAK_CHANCE_HITS',
  'INP_EX_STRONG_CHANCE_TRIALS','INP_EX_STRONG_CHANCE_HITS',
]);
for (const input of selection.inputs ?? []) {
  if (!compactIds.has(input.id)) continue;
  input.uiGridSpan = 6;
  delete input.description;
}
selection.uiCategoryDescriptions = {
  ...(selection.uiCategoryDescriptions ?? {}),
  GEKSOU_EX_ITEM: '激走チャージ中のみ集計します。成立した対象役と、その際のEXアイテム獲得回数を入力してください。強チェリーは全設定で獲得率100%のため集計対象外です。',
};
fs.writeFileSync(selectionPath, JSON.stringify(selection, null, 2) + '\n', 'utf8');
