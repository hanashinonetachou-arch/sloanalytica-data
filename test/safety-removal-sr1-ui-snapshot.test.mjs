import test from 'node:test';
import fs from 'node:fs';

const ids = [
  'LB_AREX_BRIGHT_BA','LB_CREA_BONUS_TRIGGER_A2','LB_MAGICAL_HALLOWEEN_GS','LB_SHAKE_BONUS_TRIGGER_A1',
  'L_RING_NI_KAKERO1_FS','L_MADOKA_FORTE_UU','L_KENGAN_ASHURA_ND','LB_NEW_KING_HANAHANA_V_PF',
  'L_DRAGON_HANAHANA_SENKO_JP','L_GEN_CHOMUGEN_PH'
];

test('snapshot SR1 UI contracts', () => {
  for (const id of ids) {
    const pkg = JSON.parse(fs.readFileSync(`machines/${id}/machine-package.json`, 'utf8'));
    const inputsById = new Map((pkg.inputs ?? []).map(x => [x.id, x]));
    const sections = (pkg.ui?.sections ?? []).map(s => ({
      id:s.id,title:s.title,displayOrder:s.displayOrder,
      items:(s.items ?? []).filter(x=>x.type==='input').map(x=>({
        type:x.type,inputId:x.inputId,label:x.label,widget:x.widget,config:x.config ?? undefined,
        sourceType:inputsById.get(x.inputId)?.type,
        uiQuickAdd:inputsById.get(x.inputId)?.uiQuickAdd,
        options:inputsById.get(x.inputId)?.options
      }))
    }));
    console.log('SR1_UI_SNAPSHOT', id, JSON.stringify({machineId:id,sections}));
  }
});
