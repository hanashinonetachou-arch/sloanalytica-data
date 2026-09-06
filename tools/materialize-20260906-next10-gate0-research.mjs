import fs from 'node:fs';
import path from 'node:path';

const identity=JSON.parse(fs.readFileSync('research/batches/20260906-next10/gate0-machine-identity.json','utf8'));
const discovery=JSON.parse(fs.readFileSync('research/batches/20260906-next10/discovery-candidate-universe.json','utf8'));
const dById=new Map(discovery.machines.map(x=>[x.machineId,x]));
const sourceById={
  L_BURNING_EXPRESS_ZN:{sourceId:'SRC_IDENTITY',publisher:'kitadenshi.co.jp',title:'L BURNING EXPRESS 検定・製品情報',url:'https://www.kitadenshi.co.jp/slot-kentei/burning-express/',sourceType:'official'},
  L_PRISM_NANA_CC:{sourceId:'SRC_IDENTITY',publisher:'carmina-gaming.co.jp',title:'プリズムナナ 公式情報',url:'https://carmina-gaming.co.jp/',sourceType:'official'},
  L_GINGA_EIYUU_DNT_GH:{sourceId:'SRC_IDENTITY',publisher:'konami.com',title:'銀河英雄伝説 Die Neue These 製品関連情報',url:'https://www.konami.com/amusement/psm/',sourceType:'official'},
  L_HIHODEN_PA7:{sourceId:'SRC_IDENTITY',publisher:'daitogiken.com',title:'スマスロ 秘宝伝 製品情報',url:'https://www.daitogiken.com/contents/product/slot.html',sourceType:'official'},
  L_OKIDOKI_DUO_ENCORE_FR:{sourceId:'SRC_IDENTITY',publisher:'universal-777.com',title:'沖ドキ！DUO アンコール 製品関連情報',url:'https://www.universal-777.com/',sourceType:'official'},
  L_HOKUTO_TENSEI_2_MW:{sourceId:'SRC_IDENTITY',publisher:'sammy.co.jp',title:'スマスロ 北斗の拳 転生の章2 発売情報',url:'https://www.sammy.co.jp/',sourceType:'official'},
  L_TEKKEN_6_YD01H:{sourceId:'SRC_IDENTITY',publisher:'yamasa-next.co.jp',title:'スマスロ鉄拳6 スロプラNEXT機種情報',url:'https://www.yamasa-next.co.jp/slp/model/04',sourceType:'official'},
  L_HANMA_BAKI_L5:{sourceId:'SRC_IDENTITY',publisher:'heiwa.jp',title:'L範馬刃牙 製品情報',url:'https://www.heiwanet.co.jp/',sourceType:'official'},
  L_GOBLIN_SLAYER_2_JZ:{sourceId:'SRC_IDENTITY',publisher:'fuji-shoji.co.jp',title:'スマスロ ゴブリンスレイヤーⅡ 製品関連情報',url:'https://www.fuji-shoji.co.jp/',sourceType:'official'},
  L_GHOST_IN_THE_SHELL_ZS:{sourceId:'SRC_IDENTITY',publisher:'sammy.co.jp',title:'スマスロ 攻殻機動隊 発売情報',url:'https://www.sammy.co.jp/',sourceType:'official'}
};
const settingsById={
  L_BURNING_EXPRESS_ZN:['SET_1','SET_2','SET_4','SET_5','SET_6'],
  L_OKIDOKI_DUO_ENCORE_FR:['SET_1','SET_2','SET_3','SET_5','SET_6']
};
for(const m of identity.machines){
  const d=dById.get(m.machineId); if(!d) throw new Error(`missing discovery ${m.machineId}`);
  const source=sourceById[m.machineId]; if(!source) throw new Error(`missing identity source ${m.machineId}`);
  const data={
    schemaVersion:'research-data-v1',
    machine:{machineId:m.machineId,displayName:m.displayName,formalName:m.displayName,modelNumber:m.modelCode,manufacturer:m.manufacturer,settings:settingsById[m.machineId]??['SET_1','SET_2','SET_3','SET_4','SET_5','SET_6'],identitySourceRefs:['SRC_IDENTITY']},
    researchedAt:'2026-09-06',
    researchStage:'GATE0_DISCOVERY_TRANSFER',
    sources:[{...source,checkedAt:'2026-09-06'}],
    features:[],
    evidenceCandidates:[],
    conflicts:[],
    discoveryInventory:d.seedCandidates.map((name,i)=>({discoveryCandidateId:`DC_${String(i+1).padStart(2,'0')}`,name,transferStatus:'UNRESOLVED',researchTarget:'UNRESOLVED',notes:'Gate 0でDiscoveryからResearchへ転記。Gate Aで公開情報を網羅調査し、Feature / Evidence / Referenceへ確定分類する。Selection判断は未実施。'})),
    gateStatus:{gate0:'READY_FOR_VALIDATION',gateA:'NOT_STARTED'}
  };
  const dir=path.join('research',m.machineId); fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'research-data.json'),JSON.stringify(data,null,2)+'\n');
}
console.log(`Materialized Gate0 ResearchData ${identity.machines.length}/10`);
