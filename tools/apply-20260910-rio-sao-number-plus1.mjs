import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');

const targets={
  L_SUPER_RIO_ACE2_ND02H:[
    'INP_DEN_HOWARD_THRESHOLD','INP_NUM_HOWARD_THRESHOLD',
    'INP_DEN_RINA_SIGN','INP_NUM_RINA_SIGN'
  ],
  L_SAO2_PA1:[
    'INP_DEN_CZ_FAIL_ITEM','INP_NUM_CZ_FAIL_ITEM',
    'INP_DEN_STRONG_CHANCE_CONFIRMED_CZ','INP_NUM_STRONG_CHANCE_CONFIRMED_CZ'
  ]
};

for (const [machineId,inputIds] of Object.entries(targets)) {
  const up=`research/${machineId}/ui-design-data.json`;
  const u=read(up);
  for (const id of inputIds) {
    const c=u.inputContracts?.[id];
    if (!c) throw new Error(`${machineId}: missing UI contract ${id}`);
    c.mode='NUMBER';
    c.directInput=true;
    c.quickAdd=[1];
    c.gridSpan=6;
    delete c.compact;
    delete c.step;
  }
  write(up,u);

  const sp=`research/${machineId}/selection-data.json`;
  const s=read(sp);
  for (const id of inputIds) {
    const input=s.inputs?.find(x=>x.id===id);
    if (!input) throw new Error(`${machineId}: missing Selection input ${id}`);
    input.type='integer';
    input.uiGridSpan=6;
    input.uiQuickAdd=[1];
    input.uiDirectInput=true;
  }
  write(sp,s);
}

console.log('Applied Rio2 / SAO2 numeric +1 input contracts');
