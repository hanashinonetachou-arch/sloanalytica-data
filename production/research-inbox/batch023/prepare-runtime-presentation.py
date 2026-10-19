import json,pathlib
P=pathlib.Path(__file__).resolve().parent
# Explicitly reviewed view groups: all counters and conditional denominators stay distinct.
G={
1:[('REG中の演出',[('OBS',10,'BAR揃い'),('OBS',11,'青カットイン'),('OBS',12,'赤カットイン'),('EVI',16,'キャラ紹介')]),('CZ終了時',[('EVI',18,'ボイス'),('EVI',19,'画面')])],
2:[('終了画面',[('OBS',3,'E-FREEZE'),('OBS',8,'EVA GAME'),('OBS',9,'EXTRA')]),('テンパイボイス',[('EVI',11,'EVA図柄'),('OBS',12,'赤7図柄')])],
3:[('AT終了時',[('OBS',12,'シズ＆リムル'),('EVI',13,'終了画面'),('EVI',14,'トロフィー')])],
4:[('7揃い後の演出',[('EVI',6,'リールフラッシュ'),('EVI',7,'1枚絵')])],
5:[('AT終了時',[('OBS',3,'終了画面'),('EVI',4,'ボイス')])],
8:[('エンディング中の演出',[('EVI',10,'レア役ボイス'),('EVI',11,'トロフィー')])],
10:[('AT中のベル',[('OBS',4,'左第1ベル'),('OBS',5,'共通ベル')]),('乃木坂BONUS中の演出',[('EVI',16,'ランクアップメドレー'),('EVI',17,'開演告知'),('EVI',18,'ハッピーチャージ')]),('AT終了時',[('EVI',19,'終了画面'),('EVI',20,'トロフィー')])]
}
trial={('1',11):'青カットイン回数',('1',12):'赤カットイン回数',('2',3):'E-FREEZE終了回数',('2',8):'EVA GAME終了回数',('2',9):'EXTRA終了回数',('2',12):'対象の赤7テンパイ回数',('3',3):'対象強レア役回数',('3',7):'夜の蝶確認回数',('3',8):'対象弱レア役回数',('3',9):'特級魔族討伐戦回数',('3',12):'AT終了画面確認回数',('5',3):'AT終了画面確認回数',('6',5):'周期完了回数',('7',6):'0pt到達回数',('7',8):'通常時ボーナス回数',('7',10):'オウガイバトル初戦回数',('7',11):'対象EPボーナス回数',('10',10):'図柄1個停止回数'}
report=[]
for fp in sorted((P/'reviewed').glob('*.json')):
 d=json.load(open(fp));n=int(d['findings'][0]['findingId'].split('-M')[1].split('-')[0]);by={f['findingId']:f for f in d['findings']}
 for f in d['findings']:
  if not f.get('settingDistribution'):continue
  num=int(f['findingId'].split('-')[-1]);u=f.get('trialUniverse')
  label=trial.get((str(n),num),{'NORMAL_GAME_TRIAL':'通常ゲーム数','TOTAL_GAME_TRIAL':'総ゲーム数','BONUS_ELIGIBLE_GAME_TRIAL':'対象ゲーム数（ボーナス中を除く）','ART_GAME_TRIAL':'ART中ゲーム数','AT_GAME_TRIAL':'AT中の対象ゲーム数','REG_GAME_TRIAL':'REG消化ゲーム数'}.get(u,'対象の観測回数'))
  succ=f['label'].replace('ゲーム数','G数')+'回数';succ=succ if len(succ)<=30 else '該当した回数'
  f['inputPresentation']={'trialLabel':label,'successLabel':succ}
 # Keep low-detail reference items recorded; do not turn their explanatory prose into category names.
 explicit={
 (1,19):{'CZ終了画面を確認':'設定別出現率・具体的な画面区分は未確認。記録のみ'},
 (4,4):{'超極楽モード後の連続当選':'設定別出現率未確認・記録のみ'},
 (4,8):{'通常画面':'デフォルト','復活画面':'復活','設定2以上を示唆する画面':'設定2以上示唆','高設定を示唆する画面':'高設定示唆','設定2以上濃厚の画面':'設定2以上','設定4以上濃厚の画面':'設定4以上','信長たちのデフォルメ':'設定6'},
 (6,6):{'サイボーグモード':'デフォルト','ビーチモード':'偶数示唆'},
 (7,14):{'ヒデヨシ・ドウセツ・ソウリン・モトチカ・モトナリ・ヨシモト・カンスケ・ケンシン・シンゲン':'デフォルト','イエヤス・ノブナガ・ウジマサ・ヨシテル':'高設定示唆','オウガイ・ムラサメ・コタロウ':'高設定の期待大'},
 (9,8):{'ボタンの虹フラッシュ':'設定示唆の詳細未確認・記録のみ','マリアのナビボイス':'設定示唆の詳細未確認・記録のみ'},
 (9,11):{'押し順告知での示唆':'出現率・設定対応未確認・記録のみ','レア小役告知での示唆':'出現率・設定対応未確認・記録のみ','突告知での示唆':'出現率・設定対応未確認・記録のみ'}
 }
 for (nn,idx),mp in explicit.items():
  if nn!=n:continue
  fid=f'B023-M{n:02d}-{idx:03d}';f=by[fid]
  f['semanticCategories']=[{'label':a,'meaning':b,'semanticType':'EXACT_CONSTRAINT' if b.startswith('設定') and b[2:3].isdigit() and '示唆' not in b else 'PROBABILITY_UNKNOWN'} for a,b in mp.items()]
  if n==7 and idx==14:f['details']=['エンディング中のキャラ紹介の初回だけを記録します。2回目以降は含めません。公表されている特定3人の合算出現率は元の出典で確認できますが、各キャラ別の内訳は不明のため個別の確率を補いません。'];f['referenceAggregatePercentageBySetting']={'1':1,'2':1,'3':1,'4':10,'5':10,'6':25}
 # Map9/15 record aliases must reuse the single MAP collection surface, preserving their original ledger and raw records.
 if n==10:
  for idx in [12,13]:
   fid=f'B023-M10-{idx:03d}';d['findings']=[f for f in d['findings'] if f['findingId']!=fid]
   for row in d['researchCompleteness']['candidateLedger']:
    if row['disposition'].get('refId')==fid:row['disposition']['refId']='B023-M10-021';row['normalization']='同じMAPの確定観測を単一入力に統合。元候補は台帳と原稿で保持。'
 for f in d['findings']:
  # Denominator meaning is precise and short; explanations retain actual observation restrictions.
  if f['findingId']=='B023-M01-007':f['label']='ART中共通ベル'
  if f['findingId']=='B023-M04-005':f['label']='武器のぬさ演出'
 if n==7:
  f=by['B023-M07-015'];f['semanticCategories']=[{'label':a,'meaning':b,'semanticType':'PROBABILITY_UNKNOWN' if b=='デフォルト' else 'EXACT_CONSTRAINT'} for a,b in {'白「また遊んでくださいね」':'デフォルト','青「一味違いますね」':'設定2以上','緑「何やら不思議な気配です」':'設定3以上','赤「良い予感がします」':'設定4以上','銀「遊び尽くしちゃいましょう」':'設定5以上','金「お肉～お肉～」':'設定6'}.items()]
 policy={'hiddenDerivedFindingIds':[],'sectionOrder':[],'evidenceSectionMerges':[],'tabGroups':[]}
 for gi,(title,members) in enumerate(G.get(n,[]),1):
  tabs=[{'sectionId':f'{kind}_B023-M{n:02d}-{idx:03d}','label':label} for kind,idx,label in members]
  policy['tabGroups'].append({'id':f'B023_M{n:02d}_G{gi}','title':title,'tabs':tabs})
 if policy['tabGroups']:d['uiPresentation']=policy
 d['runtimePresentationReview']={'reviewedAt':'2026-10-19','scope':'short labels, actual observation categories, view-only tabs, duplicate MAP surface unification','numericalDistributionsAndDependenciesUnchanged':True}
 fp.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n');report.append({'machineId':d['machineId'],'tabGroups':len(policy['tabGroups'])})
(P/'presentation-review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
