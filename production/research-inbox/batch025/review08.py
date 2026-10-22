# Historical first acceptance only. Native V format limitation was resolved by
# resolve-native-v.py and formally reaccepted. Do not rerun on the current batch.
from curation import *
r=Review(8);r.d['settings']['values']=['SET_1','SET_2','SET_3','SET_4','SET_V'];s=[r.src('34235')];p=json.loads((ROOT/'original-packages'/f'{r.id}.json').read_text())
for id,label,vals in [('BIG','BIG',[299,291,281,268,253]),('REG','REG',[496,471,442,409,372]),('BONUS_COMBINED','ボーナス合算',[186,180,172,162,150])]:
 b=r.block(id,label,'設定1・2・3・4・Vの公開確率を保持する。設定Vを含む数値分布は現行の検証済み計算形式で扱えないため、5・6へ置き換えて計算せず対応後に評価する。',s,dict(zip(['1','2','3','4','V'],ratios(vals))))
 b['closure'].update(ownerStage='CANDIDATE_CONTRACT',basis='既存research-validator.ts:isDeclaredResearchSettingが1～6または明示SET_0のみ許可。研究不足ではなく計算形式の対応事項。',releaseCondition='NATIVE_SET_V_SCHEMA_SUPPORT_WITHOUT_RENUMBERING')
 b['informationStatus']='SOURCE_VALUES_COMPLETE';b['implementationQueue']='NATIVE_SETTING_IDENTIFIER_SUPPORT';b['repeatPublicSearch']=False
r.evidence('BIG_WATER','BIG前半スイカ',[('スイカ成立','高設定ほど優遇との記載。設定別出現率未確認')],s)
r.evidence('REG_WATER','REG中スイカ',[('スイカ成立','高設定ほど優遇との記載。設定別出現率未確認')],s)
r.evidence('SIDE_LAMP','BIG後半サイドランプ',[('青','奇数設定示唆弱'),('黄','偶数設定示唆弱'),('緑','奇数設定示唆強'),('赤','偶数設定示唆強'),('虹','高設定示唆・設定確定ではない')],s,details=[UNKNOWN,'白7ビタ押し後にスイカ入賞した同一BIG内の初回示唆だけ記録。繰り返し入賞した同色ランプを独立観測として足さない。'])
r.evidence('END_LAMP','ボーナス終了時ハイビスカス',[('白','高設定期待度の順序1・設定確定ではない'),('青','高設定期待度の順序2・設定確定ではない'),('黄','高設定期待度の順序3・設定確定ではない'),('緑','高設定期待度の順序4・設定確定ではない'),('紫','高設定期待度の順序5・設定確定ではない'),('虹','高設定期待度の順序6・設定確定ではない')],s)
r.block('NORMAL_BELL','通常時ベル','設定別確率が指定の公開範囲で確認できない。独自推定値を設定別の公表値として使用しない。',s)
r.block('NORMAL_OTHER','通常時チェリー・スイカ','本機固有の設定別確率が指定の公開範囲で確認できないため、30Φ版や旧機種から値を転用しない。',s)
r.evidence('RETRO_SOUND','レトロサウンド',[('発生','本機の発生条件・設定別確率未確認')],s)
b=r.block('PREDECESSOR','着席前BIG・REG内訳','旧正本で自己区間母数・実機観測元の確認が終わっていないため、着席前記録を自分の区間へ加算しない。設定Vを他設定に置換しない。',s);b['closure']['ownerStage']='CANDIDATE_CONTRACT'
r.d['audit']['standardSiteSupplement']=[dict(url='https://p-town.dmm.com/machines/4911',status='SEARCH_REVIEWED',webRef='turn12search0',result='4912は30Φ版のため分離。'),dict(url='https://chonborista.com/slot/pionia-slot/247330/',status='REVIEWED',webRef='turn12view1'),dict(url='https://pachiseven.jp/machines/7288/cutout/2',status='REVIEWED',webRef='turn12view0',result='調査中との記載。Vの新数値は得られず。'),dict(url='https://1geki.jp/slot/l_new_king_hanahana_v/0/',status='HANDOFF_REUSED'),dict(url=r.urls[0],status='HANDOFF_REUSED')]
r.d['nativeSettingModelContract']=dict(settingOrder=['1','2','3','4','V'],requiredModel='BIG_REG_OTHER_MULTINOMIAL',trialInput='総G（ボーナス・BT中を除く）',derivedOnly=['BONUS_COMBINED'],noRemapping=True,formalNumericEvaluation='DEFERRED_UNSUPPORTED_NATIVE_IDENTIFIER',researchSourceComplete=True,implementationRequired=True)
notes=dict(INITIAL_HIT='BIG/REG/合算の設定1/2/3/4/V公開値を保持。',BONUS='BIG前半後半は1つの初当り。合算は派生。',SMALL_ROLE='通常ベル/チェリー/スイカは数値未確認、ボーナス中スイカは傾向のみ。',CZ=None,AT=None,INTERNAL_CONDITIONAL_DRAW='BIG後半BTへの移行はゲーム構造として確認。',MODE_TRANSITION=None,STATE_TRANSITION='BIG前半・後半・REG・通常の観測を分離。',SUCCESS_RATE=None,POINTS_GAME_DISTRIBUTION=None,CARRY_OVER=None,THRESHOLD_BEHAVIOR='同じBIGのサイドランプは初回1件のみ。',RESET_BEHAVIOR='天井なし、リセット固有の設定別数値未確認。',POST_EVENT_TRANSITION='終了時ハイビスカスの色順序は設定確定制約ではない。',NAVIGATION='白7ビタ押し後スイカ入賞の成功条件を保持。',ROLE_CONDITIONAL_DISTRIBUTION='ボーナス中スイカの設定別数値は未確認。',BONUS_TYPE_CONDITIONAL='前半BIGスイカとREGスイカは別試行。',EVIDENCE='サイドランプ・ハイビスカス・レトロ音源を記録のみで保持。',EXTERNAL_DATA_ONLY='前任者観測元の旧未参加状態を保持。',MACHINE_SPECIFIC='LBニューキングハナハナVPF、SET_Vを維持。数値形式非対応は後工程キューで研究再開不要。')
mp={'FEAT_PREDECESSOR_BONUS_OUTCOME':'PREDECESSOR','FEAT_BONUS_OUTCOME':'BIG','FEAT_BIG_FIRST_HALF_WATERMELON_EXCLUDED':'BIG_WATER','FEAT_REG_WATERMELON_EXCLUDED':'REG_WATER','FEAT_BIG_SIDE_LAMP_EXCLUDED':'SIDE_LAMP','FEAT_BONUS_END_HIBISCUS_LAMP_EXCLUDED':'END_LAMP','FEAT_NORMAL_BELL_EXCLUDED':'NORMAL_BELL'}
r.finish(notes,mp)
