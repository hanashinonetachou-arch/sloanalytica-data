import test from 'node:test';
import fs from 'node:fs';

const ids = [
  'L_KEIJI_SADO_ER','L_TOARU_INDEX_JC','S_GOGO_JUGGLER_3_KA','S_JUGGLER_GIRLS_SS_KH','S_MR_JUGGLER_KK',
  'L_MONKEY_TURN5_CE','L_HIGURASHI_GOU_SS','L_HOKUTO_AD_XR','L_KING_PULSAR_SLCC','L_HANABI_KM'
];

test('snapshot SR2 UI contracts', () => {
  for (const id of ids) {
    const pkg = JSON.parse(fs.readFileSync(`machines/${id}/machine-package.json`, 'utf8'));
    const inputList = Array.isArray(pkg.inputs) ? pkg.inputs : (pkg.inputs?.inputs ?? []);
    const inputsById = new Map(inputList.map(x => [x.id, x]));
    const sections = (pkg.ui?.sections ?? []).map(s => ({
      id:s.id,title:s.title,displayOrder:s.displayOrder,
      items:(s.items ?? []).filter(x=>x.type==='input').map(x=>({
        type:x.type,inputId:x.inputId,label:x.label,widget:x.widget,config:x.config ?? undefined,
        sourceType:inputsById.get(x.inputId)?.type,
        uiQuickAdd:inputsById.get(x.inputId)?.uiQuickAdd,
        options:inputsById.get(x.inputId)?.options
      }))
    }));
    console.log('SR2_UI_SNAPSHOT', id, JSON.stringify({machineId:id,sections}));
  }
});
