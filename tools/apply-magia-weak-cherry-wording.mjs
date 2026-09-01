import fs from 'node:fs';
const dir='research/L_MAGIA_RECORD_RN';
const read=n=>JSON.parse(fs.readFileSync(`${dir}/${n}`,'utf8'));
const write=(n,v)=>fs.writeFileSync(`${dir}/${n}`,JSON.stringify(v,null,2)+'\n');

const research=read('research-data.json');
const rf=research.features.find(f=>f.researchFeatureId==='RF_WEAK_CHERRY');
if(!rf) throw new Error('RF_WEAK_CHERRY missing');
rf.trialUnit='全状態の総プレイゲーム';
rf.denominatorDefinition='通常時・AT中などを含む全状態の総プレイゲーム数';
rf.notes='弱チェリーは通常時だけでなくAT中などを含む全状態を対象とする。正確な総プレイゲーム数と弱チェリー回数は実機連動機能の遊技履歴から取得可能。';
write('research-data.json',research);

const sel=read('selection-data.json');
sel.machineDataVersion='0.1.4';
const wt=sel.inputs.find(i=>i.id==='INP_WEAK_CHERRY_TRIALS');
if(!wt) throw new Error('weak cherry trials input missing');
wt.name='総プレイG数'; wt.unit='G';
const wf=sel.features.find(f=>f.featureId==='FEAT_WEAK_CHERRY');
if(wf) wf.userReason='通常時・AT中などを含む全状態の総プレイG数に対する弱チェリー成立回数を評価する。初当り系とは別の上流成立事象として正確に観測でき、1ゲーム当たりの情報量も大きいため主Featureとして採用する。';
write('selection-data.json',sel);

const obs=read('machine-observation-data.json');
const wo=obs.observations.find(o=>o.observationId==='OBS_WEAK_CHERRY');
if(!wo) throw new Error('OBS_WEAK_CHERRY missing');
wo.sourceType='LINKED_SERVICE';
wo.observationMode='LINKED_SERVICE_READ';
wo.label='弱チェリー 回数・総プレイG数';
wo.categories=['弱チェリー 回数','総プレイG数'];
wo.timing=['実機連動機能の遊技履歴を確認できるタイミングで更新'];
wo.excludedConditions=['実機連動機能を開始していない区間を取得済みとして扱わない','通常時だけのゲーム数を分母にしない','未観測を観測済み0として扱わない'];
wo.notes='実機連動機能の遊技履歴にある総プレイ数と弱チェリー回数を使用する。弱チェリーの分母は通常時限定ではなく、AT中などを含む全状態の総プレイゲーム数。手動カウント時も同じ観測範囲を保つ。';
write('machine-observation-data.json',obs);

const ui=read('ui-design-data.json');
const sec=ui.sections['弱チェリー'];
if(!sec) throw new Error('weak cherry UI section missing');
sec.description='実機連動機能の遊技履歴にある「総プレイG数」と「弱チェリー」を入力してください。対象は通常時だけではなく、AT中などを含む全状態です。実機連動機能を利用しない場合は、弱チェリーをカウントしていた全状態の消化G数を「総プレイG数」に入力してください。';
sec.observationRole='LINKED_SERVICE';
sec.acquisitionSources=['LINKED_SERVICE','DIRECT_PLAY'];
const uc=ui.inputContracts['INP_WEAK_CHERRY_TRIALS'];
if(!uc) throw new Error('weak cherry UI contract missing');
uc.name='総プレイG数';
write('ui-design-data.json',ui);
console.log('Magia weak-cherry wording updated');
