import fs from 'node:fs';

const selectionPath = 'research/L_MAGIA_RECORD_RN/selection-data.json';
const uiPath = 'research/L_MAGIA_RECORD_RN/ui-design-data.json';

const selection = JSON.parse(fs.readFileSync(selectionPath, 'utf8'));
const episode = selection.features.find((f) => f.featureId === 'FEAT_EPISODE_BONUS_TYPE');
if (!episode) throw new Error('FEAT_EPISODE_BONUS_TYPE not found');
episode.userReason = '試行回数は多くないが、エピソードの選択比率には設定差があり、特に黒江は高設定ほど大きく出現しやすい。1回ごとの結果だけで強く断定せず、低設定群・高設定群を補強するサポート要素として採用する。固定経路のエピソードは除外する。';

const watermelon = selection.features.find((f) => f.featureId === 'FEAT_WATERMELON_CZ');
if (!watermelon) throw new Error('FEAT_WATERMELON_CZ not found');
watermelon.userFacingReason = 'スイカからのCZ当選率には設定差がありますが、公開値の対象は「さなモード以外」のスイカです。さなモード滞在を毎回確定できず、正しい分母を作れないため不採用。';
watermelon.rejectionReason = '公開CZ分布の分母は非さなモード中スイカに限定される。さなモード中は別のCZ抽選率となる一方、さな滞在を試行ごとに確定観測できないため、全スイカを分母にすると異なる抽選を混合してしまう。正しい条件付きtrial universeを構成できないため不採用。';

fs.writeFileSync(selectionPath, `${JSON.stringify(selection, null, 2)}\n`);

const ui = JSON.parse(fs.readFileSync(uiPath, 'utf8'));
const section = ui.sections?.['エピソードボーナス選択率'];
if (!section) throw new Error('episode UI section not found');
section.description = '試行は少なめですが選択比率に設定差があり、特に黒江は高設定ほど出現しやすいため補助的に推測へ反映します。通常の選択抽選だけを入力し、黒江チャレンジ成功・ドッペルモード・ロングフリーズなど固定経路は除外してください。';
fs.writeFileSync(uiPath, `${JSON.stringify(ui, null, 2)}\n`);
