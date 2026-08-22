#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(process.argv[2]??'.');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');

// 1) Persist the AUTO_PRIMARY fallback in the Builder source so later rebuilds do not lose the title.
const builderPath=path.join(root,'tools','build-machine-data.mjs');
let builder=fs.readFileSync(builderPath,'utf8');
const oldMap='const defaultCategoryLabels={CZ:"CZ",ZONE:"100G以内のゲーム数解除",AT_RETURN:"AT引き戻し",EVIDENCE:"設定確定・否定情報"};';
const newMap='const defaultCategoryLabels={PRIMARY:"主要入力",CZ:"CZ",ZONE:"100G以内のゲーム数解除",AT_RETURN:"AT引き戻し",EVIDENCE:"設定確定・否定情報"};';
if(builder.includes(oldMap)){ builder=builder.replace(oldMap,newMap); fs.writeFileSync(builderPath,builder); }
else if(!builder.includes(newMap)) throw new Error('Builder defaultCategoryLabels pattern not found; stop without guessing.');

// 2) Replace vague or internal rejection reasons with Policy-v2 user-facing reasons grounded in current Research/observation constraints.
const reasons={
 'LB_SLOT_GALFY_A4':{
  FEAT_BAR_ROLE_EXCLUDED:'通常時BAR揃いは設定差があるが、1/4096～1/2731と低頻度で、A/Bのどちらか一方しか払い出しをフォローできず実戦カウントの完全性を担保しにくいため不採用。'
 },
 'L_INITIAL_D_2ND':{
  FEAT_DRIFT_ZONE:'設定1の1/10624.3から設定6の1/5345.5まで約2倍の差はあるが、7000Gでも期待出現回数が1回前後に留まり、LB初当り・ベル等へ追加する安定した情報量が小さいため不採用。',
  FEAT_CHANCE_CHERRY:'マイスロで自動カウント可能だが、1/1820.4～1/1365.3で7000Gでも数回程度かつ設定差が比較的小さく、ベル等の高頻度Featureに対する追加情報量が限定的なため不採用。',
  FEAT_AT_FIRST_MOON:'設定1の0.8%から設定6の3.5%まで差はあるが、対象AT初当り機会が少なく、スイカ抽選・岩城勝利を除外した対象判定も必要で、1日実戦で安定した試行数を確保しにくいため不採用。'
 },
 'L_KAGUYA_SAMA_JA':{
  FEAT_KAGUYA_BONUS_INITIAL:'BONUS初当りは1/362～1/335と設定差が小さいうえ、公開情報では確率に対応する厳密な集計区間を確認できず分母定義が暫定のため、数値Featureには不採用。',
  FEAT_KAGUYA_BONUS_END_FRAME:'紫・銀・金枠は設定下限を直接絞る確定・否定情報として別枠で扱う。赤枠だけを数値化しても低頻度かつ設定差が小さく、同じ終了画面を重複評価するため数値Featureには不採用。',
  FEAT_KAGUYA_REG_SCENARIO:'設定下限を直接絞るシナリオと次回モード示唆が混在し、全設定の完全な選択率も公開されていないため、数値Featureには不採用。'
 },
 'L_MUSHOKU_TENSEI_NM':{
  FEAT_HITOGAMI_SPACE_ENTRY_RATE:'ヒトガミの空間突入率は単独尤度にせず、突入後の本前兆成功率の試行機会（Exposure）として利用する。同じ突入事象を両方の独立Featureで使うと重複評価になるため不採用。'
 },
 'L_SMASLO_BAKEMONOGATARI_KH':{
  FEAT_AT_BONUS:'AT中ボーナスは1/2735.7～1/1938.8で設定差はあるが、ATゲームを分母にする低頻度事象で、通常の1日実戦では試行・出現とも少なく、現行の全ゲーム基準入力へ追加する情報量に対して入力負担が大きいため不採用。'
 },
 'L_TOKYO_GHOUL':{
  FEAT_EPISODE_BONUS:'エピソードボーナスは設定差が大きいがAT初当りの一部に包含される。現行AT初当りFeatureへ単純追加すると同じAT当選を二重計上するため、単独Featureには採用しない。',
  FEAT_LOWER_REPLAY:'下段リプレイは1/1260.3～1/1024.0と設定差が小さく、7000Gでも期待出現数は約6回前後に留まるため、全ゲームでの追加カウントに対する増分情報量が小さく不採用。'
 }
};

for(const [machineId,map] of Object.entries(reasons)){
 const selectionPath=path.join(root,'research',machineId,'selection-data.json');
 const packagePath=path.join(root,'machines',machineId,'machine-package.json');
 const s=read(selectionPath); const p=read(packagePath);
 for(const sf of s.features??[]){ const reason=map[sf.featureId]; if(reason){ sf.rejectionReason=reason; sf.userReason=reason; } }
 for(const r of p.selectionSummary?.rejected??[]){ if(map[r.featureId]) r.reason=map[r.featureId]; }
 write(selectionPath,s); write(packagePath,p);
}

// 3) Repair already-published generated packages. Future rebuilds use Builder fallback above.
let titleFixes=0;
for(const d of fs.readdirSync(path.join(root,'machines'),{withFileTypes:true}).filter(x=>x.isDirectory())){
 const pp=path.join(root,'machines',d.name,'machine-package.json'); if(!fs.existsSync(pp)) continue;
 const p=read(pp); let changed=false;
 for(const sec of p.ui?.sections??[]){ if(sec.id==='AUTO_PRIMARY'&&!String(sec.title??'').trim()){ sec.title='主要入力'; changed=true; titleFixes++; } }
 if(changed) write(pp,p);
}
console.log(`Phase 11 fixes applied. AUTO_PRIMARY titles repaired: ${titleFixes}; vague/internal reason machines: ${Object.keys(reasons).length}`);
