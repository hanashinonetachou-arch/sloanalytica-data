from curation import *
r=Review(2);r.d['settings']['values']=['SET_'+str(x) for x in [1,2,4,5,6]];s=[r.src('/466/')]
r.numeric('BONUS_INITIAL','ボーナス初当り',ratios([252.9,245.5,231.9,216.1,202.6]),s,'NON_CHAIN_BONUS_INITIAL_GAME_TRIAL','32G連チャン区間内の当選は連チャン扱い。総Gから実際に記録したボーナス中G・連チャン区間Gを除いたゲーム数と、その区間終了後の初当り回数を用いる。',group='BONUS_PATH')
r.numeric('NORMAL_BELL','通常時3枚ベル',ratios([5.15,5.09,5.03,4.97,4.92]),s,'NORMAL_GAME_TRIAL','ボーナス中を除く通常ゲーム数と通常時3枚ベル回数。初当り用の32G連チャン除外ゲーム数とは母数を分け、連チャン待機中の通常遊技も含む。')
r.numeric('BONUS_COMBINED','連チャン込みボーナス合算',ratios([117.5,114.3,108.5,101.8,96]),s,'NORMAL_GAME_TRIAL','連チャン込みのボーナス回数。初当りと同じ当選系列なので同時加算しない。',group='BONUS_PATH')
r.evidence('TROPHY','ケロットトロフィー',[('銅','設定2以上'),('金','設定4以上'),('ケロット柄','設定5以上'),('虹','設定6')],s)
r.block('BIG_REG','BIG・REG内訳','モードで振分が変化する疑似ボーナスで、設定別の当選比率が確認できないため合算から独立した設定確率として使わない。',s)
r.evidence('MODE_HINT','モード示唆',[('パネルフラッシュ','モード示唆・設定別出現率未確認'),('ステージ','モード示唆・設定別出現率未確認'),('図柄揃いライン','モード示唆・設定別出現率未確認'),('テンパイボイス','モード示唆・設定別出現率未確認'),('違和感演出','モード示唆・設定別出現率未確認')],s)
r.no_diff('RARE_ROLES','レア役・確定役','チェリー1/48.5・スイカ1/155.3・スベリスイカ1/728.2・トマト1/6553.6・リーチ目役1/10922.7・中段チェリー1/16384は設定共通。',s)
r.no_diff('MODE_TRANSITION','ボーナス当選時などのモード移行','掲載された移行抽選は設定差なし。',s)
r.no_diff('ROLE_BONUS','成立役別ボーナス期待度','チェリー約3%・スイカ約5%・確定役100%は設定差なし。',s)
r.d['productObservationPolicy']=dict(authority='USER_EXPLICIT_INSTRUCTION',countingRule='OKISLOT_CHAIN_ZONE_EXCLUDED',publishedDenominatorEquivalence='NOT_ASSERTED',artifact='production/RESEARCH_PROCESS_CONTRACT.md')
r.findings[0]['operationalCounting']=dict(authority='USER_EXPLICIT_INSTRUCTION',policyArtifact='production/RESEARCH_PROCESS_CONTRACT.md',publishedDenominatorEquivalence='NOT_ASSERTED')
r.d['uiRequirements'].update(gameCountInput='TOTAL_GAMES_WITH_OBSERVED_EXCLUSIONS',initialAndBellDenominators='DISTINCT',unknownExclusions='DISABLE_AFFECTED_FINDING_ONLY')
r.d['audit']['originalHoldResolution']='旧パッケージの自己区間母数QA待ちは、現行のユーザー指定カウント規約へ接続。旧QAを承認済みに変更せず、除外G未記録なら該当計算のみ無効。通常ベルは連チャン除外の対象にしない。'
notes=dict(INITIAL_HIT='32G内連チャンと区間後の初当りを区別。',BONUS='初当り・合算・BIG/REG内訳を保存、合算は包含関係。',SMALL_ROLE='通常3枚ベルに設定差。チェリーほかは共通。',CZ=None,AT='擬似ボーナスAT中は通常時3枚ベルの対象外。',INTERNAL_CONDITIONAL_DRAW='成立役別期待度に設定差なし。',MODE_TRANSITION='ボーナス時のモード移行は設定差なしと掲載。',STATE_TRANSITION='天国・超天国・裏天国・保証の32G連チャンと通常A/Bを区別。',SUCCESS_RATE=None,POINTS_GAME_DISTRIBUTION='チャンス・引き戻し200G、通常A/B999Gの構造。見抜けない内部モードは入力させない。',CARRY_OVER='据え置きは内部継続、表示Gと内部Gを区別。',THRESHOLD_BEHAVIOR='32G連チャンを初当りに含めない。',RESET_BEHAVIOR='設定変更時に有利区間・モード・天井がリセット。',POST_EVENT_TRANSITION='パネル・ボイスなどは次モード示唆として区分。',NAVIGATION=None,ROLE_CONDITIONAL_DISTRIBUTION='役別期待度は設定共通。',BONUS_TYPE_CONDITIONAL='BIG/REG振分はモード依存で設定別値未確認。',EVIDENCE='銀なし、銅2以上・金4以上・ケロット柄5以上・虹6。',EXTERNAL_DATA_ONLY=None,MACHINE_SPECIFIC='設定3なし。既存正本の型式LアナザーリノヘブンCCと2022-11-21導入へ照合。')
p=json.loads((ROOT/'original-packages'/f'{r.id}.json').read_text());mp={'FEAT_BONUS_INITIAL':'BONUS_INITIAL','FEAT_NORMAL_3COIN_BELL':'NORMAL_BELL','FEAT_BONUS_COMBINED_EXCLUDED':'BONUS_COMBINED'}
for x in p['evidence']['evidences']:mp[x['id']]='TROPHY'
r.finish(notes,mp)
