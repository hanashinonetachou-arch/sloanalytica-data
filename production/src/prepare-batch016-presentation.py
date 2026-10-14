"""Author Batch016 input names and audited condition tabs; retain numeric tables."""
import copy
import json
from pathlib import Path

base = Path(__file__).resolve().parents[1] / 'batches/batch-20261014-016'
specific = {
 'S_GRANBELM_ZX': {
  'start-2nd': ('ミッドナイト開始回数', '2nd開始回数'),
  'return': ('ストックなし北の湯突入回数', '引き戻し回数'),
  'screen-normal': ('終了画面確認回数', '画面出現回数'),
  **{f'items-{i}': ('ガチャ確認回数','アイテム出現回数') for i in [28,29,30]},
 },
 'L_ASLOT_KONOSUBA_FX': {
  **{f'overlap-{r}': (r+'成立回数','ボーナス同時当選回数') for r in ['チェリー','スイカ','チャンス目']},
  'five-stock': ('リプレイ・ベル成功回数','5ストック獲得回数'),
  'upgrade': ('通常REG当選回数','駄女神昇格回数'),
  'reg-bell-at': ('13枚ベル成立回数','ATストック当選回数'),
  'big-screen': ('BIG終了画面確認回数','画面出現回数'),
 },
 'S_FAMISTA_KAIDO_FB': {
  'cherry-cz': ('チェリー成立回数','チャンスタイム移行回数'),
  'water-cz': ('スイカ成立回数','チャンスタイム移行回数'),
  'cheer': ('BIG終了画面確認回数','チアガール出現回数'),
  'bgm': ('REG中BGM確認回数','特殊BGM出現回数'),
 },
 'L_PACHISLO_SENRAN_KAGURA2_L9': {'replay-bonus': ('リプレイ成立回数','ボーナス同時当選回数')},
 'L_GEGEGE_NO_KITARO_KAKUSEI_JC': {
  'no-chance': ('チャンス目なしゾーン突入回数','CZ当選回数'),
  'camilla': ('ゲゲゲBATTLE開始回数','カミーラ選択回数'),
  'upgrade-or-cat': ('AT開始確認回数','激闘昇格・ねこ娘獲得回数'),
 },
 'S_MOECHIBA_GNC30': {'weak-hit': ('弱チェリー成立回数','ボーナス当選回数')},
}
changes = []
for p in sorted((base/'research-drafts').glob('*/*.json')):
 d = json.loads(p.read_text()); before = copy.deepcopy(d); mid = d['machineId']
 for f in d['findings']:
  fid = f['findingId']
  if f.get('inputPresentation'):
   u = f['trialUniverse']
   trial = '総ゲーム数' if u=='TOTAL_GAME_TRIAL' else '連チャン外ゲーム数' if u=='NON_CHAIN_BONUS_INITIAL_GAME_TRIAL' else 'ボーナス中を除くゲーム数' if u=='BONUS_ELIGIBLE_GAME_TRIAL' else '通常ゲーム数' if u=='NORMAL_GAME_TRIAL' else None
   labels = specific.get(mid,{}).get(fid)
   if labels: trial, success = labels
   else: success = f['label'].replace('初当たり','初当たり回数') if '初当たり' in f['label'] else f['label']+'回数'
   if mid=='L_GEGEGE_NO_KITARO_KAKUSEI_JC':
    if fid.startswith('chance-'):
     number, column = map(int, fid.split('-')[1:])
     role = '強チャンス目' if number in [6,11] else 'チャンス目'
     condition = {5:'通常',6:'通常',9:'百鬼夜行・100G契機',10:'百鬼夜行・100G以外契機',11:'百鬼夜行'}[number]
     f['label'] = role+'：'+condition+('のゾーン移行' if column==0 else 'のゾーン経由CZ')
     if column==0:
      trial,success=role+'成立回数','百鬼夜行ゾーン移行回数'
     else:
      trial,success='対象の百鬼夜行ゾーン突入回数','CZ当選回数'
      scope = {5:'通常状態のチャンス目',6:'通常状態の強チャンス目',9:'100G目を契機に移行した百鬼夜行CHANCE中のチャンス目',10:'100G目以外を契機に移行した百鬼夜行CHANCE中のチャンス目',11:'百鬼夜行CHANCE中の強チャンス目'}[number]
      text = scope+'から百鬼夜行ゾーンへ移行し、終了まで追跡できた回数を母数に、ゾーン経由のCZ当選を記録します。追加抽選・書き換えを含むゾーン終了までの期待度で、成立役1回あたりの直接当選率ではありません。状態不明・追跡中断を除きます。'
      f['denominatorSemantics']=text; f['details']=[text]; f['liveObservation']['reason']=text
    if fid.startswith('precursor-'):
     n=int(fid.split('-')[1]); role='強チャンス目' if n in [13,18] else 'チャンス目'
     cond={12:'通常',13:'通常',16:'百鬼夜行・100G契機',17:'百鬼夜行・100G以外契機',18:'百鬼夜行'}[n]
     f['label']='前兆内訳：'+cond+'・'+role
     trial,success=role+'追跡回数','前兆出現回数'
     f['details'].append('前兆ショートは数ゲームで終了、前兆ロングは百鬼夜行ゾーンへ移行する前兆です。通常のチャンス目高確は混ぜず、成立役と百鬼夜行CHANCEの移行契機を分けて記録します。')
    if fid.startswith('voice-'):
     trial,success='鬼太郎ボイス確認回数','ボイス出現回数'
   if not trial: raise ValueError((mid,fid,'missing trial label'))
   f['inputPresentation']={'trialLabel':trial,'successLabel':success}
  if mid=='S_GRANBELM_ZX' and fid.startswith('items-'):
   labels={'items-28':'通常サイクル','items-29':'末尾0・5','items-30':'55サイクル','items-31':'99以降','items-32':'先読み後'}
   if fid in labels:
    f['observationContext']={'groupingApproved':True,'opportunityId':'GRANBELM_GACHA','conditionId':fid,'groupTitle':'ガチャのアイテム','conditionLabel':labels[fid]}
  if mid=='L_GEGEGE_NO_KITARO_KAKUSEI_JC' and fid.startswith('voice-'):
   n=fid.split('-')[1]
   labels={'11':'0～1000G','12':'1001～4999G／差枚-1000枚以下','13':'5000G以上／差枚-1000枚以下','14':'1001～4999G／差枚-999枚以上','15':'5000G以上／差枚-999枚以上'}
   f['observationContext']={'groupingApproved':True,'opportunityId':'KITARO_VOICE','conditionId':'voice-'+n,'groupTitle':'鬼太郎ボイス','conditionLabel':labels[n]}
 for f in d['findings']:
  fid=f['findingId']
  if mid=='L_ASLOT_KONOSUBA_FX' and fid.startswith('overlap-'):
   role=fid.split('-')[1]
   text='ボーナス未成立の状態で'+role+'を引いた機会のうち、同時にボーナスが成立した割合を比較します。成立後の消化や契機不明の当選を除きます。'
   f['denominatorSemantics']=text;f['details']=[text];f['liveObservation']['reason']=text
  if mid=='S_FAMISTA_KAIDO_FB' and fid in ['cherry-cz','water-cz']:
   role='チェリー' if fid=='cherry-cz' else 'スイカ'
   text='通常状態で'+role+'を引いたとき、チャンスタイムへ移行した割合を比較します。ART中・すでにチャンスタイム中・REG後の確定移行を除きます。'
   f['denominatorSemantics']=text;f['details']=[text];f['liveObservation']['reason']=text
 d['uiPresentation']={'hiddenDerivedFindingIds':[],'sectionOrder':[],'evidenceSectionMerges':[],'tabGroups':[]}
 # Preserve all numeric tables, settings, and findings. Corrections above affect
 # authored UI and the denominator of the explicitly conditional Kitaro rate.
 assert [f['findingId'] for f in d['findings']]==[f['findingId'] for f in before['findings']]
 assert [f.get('settingDistribution') for f in d['findings']]==[f.get('settingDistribution') for f in before['findings']]
 history=base/'research-history'/'pre-ui-20261015'/p.name
 history.parent.mkdir(parents=True,exist_ok=True)
 if not history.exists(): history.write_text(json.dumps(before,ensure_ascii=False,indent=2)+'\n')
 p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
 changes.append({'machineId':mid,'numericTablesUnchanged':True,'findingIdsUnchanged':True})
(base/'presentation-review-20261015.json').write_text(json.dumps({'status':'AUTHORED','changes':changes,'kitaroConditionalCorrection':{'source':'https://nana-press.com/kaiseki/machine/782/23112/','scope':'zone transition vs zone-conditioned CZ expectation; precursor labels follow source headings','confirmedAt':'2026-10-15'}},ensure_ascii=False,indent=2)+'\n')
print(json.dumps(changes))
