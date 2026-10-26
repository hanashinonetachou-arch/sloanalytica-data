from prepare import *
def isekai():
 m=Machine(3);u=['https://nana-press.com/kaiseki/machine/1125/36291/'];g='ISEKAI_NORMAL_SHARED'
 for id in ['RF_PREDECESSOR_BONUS_INITIAL','RF_BONUS_INITIAL']:
  e=m.old_by[id];m.block(id,e['name'],'公表のボーナス初当り1/197.6等と、通常時のBIG・いせかる目の発生率は集計対象が異なる。BT区間を含む表示と通常Gを混ぜず、直接記録できる通常時2事象の分布で評価する。',u,e['settingValues'])
 m.numeric('RF_NORMAL_3COIN_SMALL_ROLES','通常時（3枚掛け）小役内訳',partition(BELL=[7,6.7,6.6,6.4],WATERMELON=[45,39.7,39,37.4],CHERRY=[179.1,179.1,176.6,174.3],SPECIAL_15=[21845.3,21845.3,13107.2,8192]),u,group=g,scope='通常3枚掛けの有効G。BT中・ボーナス中を除く。実機連動機能の丸め表示から回数×分母で正確なGを復元したとみなさず、実際の対象Gを使う。')
 m.numeric('RF_NORMAL_BT_OR_BIG','通常時 いせかる目・BIG直撃',partition(ISEKARU_EYE=[107.6,106.2,97.1,89.2],DIRECT_BIG=[1337.5,1260.3,1040.3,923]),u,group=g)
 m.numeric('RF_BIG_MISS_15','BIG中 入賞フラッシュ非発生バラケ目',[21845.3,2048,1024,512],u,'ISEKAI_BIG_ELIGIBLE_GAME_TRIAL','BIG消化中の実際の対象Gだけ。入賞フラッシュのないバラケ目15枚役を数え、通常小役の特殊15枚役と混ぜない。')
 m.numeric('RF_BT_SPECIAL_7','BT中特殊7枚役',[2259.9,851.1,753.3,662],u,'ISEKAI_BT_ELIGIBLE_GAME_TRIAL','BTの2枚掛け有効G。いせかる目の次ゲームとBT転落目の次ゲームは、設定差のない特殊7枚役なので試行と成功の両方から除外する。')
 for id,e in m.e_old.items():
  a=[int(s.removeprefix('SET_'))for s in e['allowedSettings']];f=m.evidence(id,e['name'],[(e['name'],'設定6' if a==[6]else '設定'+str(min(a))+'以上',a)],u)
  if id.startswith('RE_PAYOUT_086'):f['inputReuse']={'type':'DAILY_COUNT_THRESHOLD','canonicalInput':'086枚OVER当日発生回数','minimumCount':4 if id.endswith('_4')else 3 if id.endswith('_3')else 1,'extraInput':False}
 m.evidence('RE_CHAR_OTHER','いせかるぼーなす中の参考キャラ',[(x,'設定別出現率未確認の高設定示唆',None)for x in ['ペテルギウス','主人公','ヒロイン集合','3くみの仲間たち','飼育小屋','学校の先生たち③','起動要塞デストロイヤー']],u)
 m.evidence('RE_END_OTHER','BIG終了画面（参考）',[(x,'設定別出現率未確認の示唆',None)for x in ['赤カーテン','キャラ黄金背景','全キャラ登場']],u)
 m.block('RF_ROLE_TRANSITION_OVERLAP','小役重複いせかる目・BIG','小役成立時の期待度の設定1データだけでは、設定2・5・6の同条件の分布を作れない。通常小役と当選の包含関係も保持する。',u,{'setting1':{'bellIsekaru':.033,'watermelonIsekaru':.089,'watermelonBIG':[.002,.003],'cherryIsekaru':.287,'cherryBIG':.104}})
 m.notes=['旧初当り候補2件を削除せず、集計対象の相違を根拠に閉鎖。','086は当日同一設定の通算発生回数1/3/4の制約を一つのカウンターから派生。0回を設定否定へ使わない。','通常小役は実機連動機能の丸め確率表示から厳密復元しない。']
 domains=['通常BIGといせかる目を排他的に記録。初当り・合算の異なる定義を混ぜない。','通常3枚掛けベル・スイカ・チェリー・特殊15枚役。BT中小役と分離。','小役重複期待度は設定1のみで比較値が不足。公開済み不足は再探索せず閉じる。','BIG非フラッシュ15枚役とBT特殊7枚役はそれぞれ別の対象Gを記録。','キャラ・色順・終了画面・トロフィー・獲得枚数の制約。086の当日回数を保持。','いせかる目直後とBT転落目直後の特殊7枚役を両側の母数・回数から除外。']
 ui={'normalGames':'ONE_SHARED_3COIN_INPUT','normalEvents':['BIG直撃','いせかる目'],'BIG':'actual eligible G; no flash only','BT':'actual eligible G excluding both transition next-games','086':{'input':'one daily occurrence counter','thresholds':{'1':'設定2以上','3':'設定5以上','4':'設定6'},'sameDaySameSetting':True,'noDefaultAbsenceCounter':True},'recordOnlyCopy':'記録のみ・推測計算には使用しない','unobserved':'NULL_NOT_ZERO'}
 return m.finalize(ui,domains,coverage('Sammy',{'nana-press':'2026-10-27 DIRECT_RECHECK_36291_36208','pachiseven':'existing original candidate source 7351 retained as historical; detailed rates corroborated by current Nana'}))
def eva():
 m=Machine(2);u=['https://nana-press.com/kaiseki/machine/988/30579/','https://1geki.jp/slot/lb_eva/0/'];g='EVA_NORMAL_SHARED'
 m.numeric('RF_DAILY_BONUS_DETAIL','通常時ボーナス詳細（当日累積）',partition(RED_SBB=[1985.9,1560.4,1872.5,1524.1,1771.2,1424.7],BLUE_SBB=[1365.3,1524.1,1365.3,1524.1,1365.3,1560.4],YELLOW_BB=[520.1,508,478.4,448.9,414.8,390.1],BOUSOU=[5957.8,5461.3,5041.2,4681.1,4369.1,4096],REG=[569.9,546.1,508,474.9,442.8,404.5]),u,group=g,scope='同じ日の通常3枚掛けGとボーナス5種類を台メニューから確認する。当日累積と自分の区間を二重計上せず、BT中当選を混ぜない。')
 for id,l in [('RF_BELL_YELLOW_BB','ベル＋黄BIG'),('RF_SINGLE_BOUSOU','単独暴走モード')]:
  f=m.evidence(id,l,[(l,'設定2以上',[2,3,4,5,6])],u);f['correction']='Old all-zero placeholder was not a probability; retain as exact event constraint.'
 for id,e in m.e_old.items():
  a=[int(s.removeprefix('SET_'))for s in e['allowedSettings']];f=m.evidence(id,e['name'],[(e['name'],'設定6' if a==[6] else '設定'+str(min(a))+'以上',a)],u)
  if id in ['RE_BELL_YELLOW','RE_SINGLE_BOUSOU']:f['inputReuse']={'type':'DERIVED_CONSTRAINT','fromFindingIds':['RF_BELL_YELLOW_BB' if id=='RE_BELL_YELLOW'else'RF_SINGLE_BOUSOU'],'extraInput':False}
 probs={'ハズレ':[.0002,.0002,.0003,.0003,.0004,.0006],'リプレイ':[.0013,.0013,.0013,.0014,.0017,.0019],'ベル':[.0001,.0002,.0004,.0006,.0008,.0010],'チェリー':[.103,.106,.107,.111,.110,.114],'弱スイカ':[.0182,.0191,.0197,.0223,.0231,.0254],'強スイカ':[.308,.321,.325,.329,.338,.346]}
 for j,(role,p)in enumerate(probs.items()):
  m.block('RF_ROLE_OVERLAP_'+str(j),role+'成立時ボーナス重複','小役成立時の条件付き値は確認済みだが、成立後に引いた役と実際の当選契機を常に区別する観測条件が確認できていない。成功だけ判別できた標本へ偏らせず、通常ボーナスとの重複利用もしない。',u,dict(zip(m.settings,p)))
 m.block('RF_NORMAL_SMALL_ROLES','通常時小役出現率','解析値が確認できるのは設定1の一部で、設定6の数値は約5000Gの実戦例。全設定の同じ条件の分布はなく、実戦値から残る設定を補わない。',u,{'setting1':{'bell':'1/8.0','cherry':'1/60.0'},'setting6FieldTrial':{'normalGames':4936,'bell':651,'cherry':99,'weakWatermelon':71,'strongWatermelon':11}})
 m.block('RF_REG_PENPEN_ORDER','REG中ペンペンの登場順','登場順の意味は未確認。何番目なら何設定否定という推測を制約にしない。',u)
 m.evidence('RE_REG_OTHER','REG中のキャラ紹介（参考）',[(s,'設定別出現率未確認の示唆',None)for s in ['1人目から赤','4人目までにゲンドウ','4人目までに冬月','その他']],u,details=['記録のみ・推測計算には使用しない。カヲルは同じ紹介機会の設定6制約として別経路を保持する。'])
 m.evidence('RE_MOVIE_OTHER','BT中プレミアムムービー（参考）',[(s,'設定別出現率未確認の示唆',None)for s in ['第三新東京市','ミサト＆リツコ','リリス']],u,details=['条件を満たして見たムービーだけを記録する。目押し失敗や専用EDを基本パターンへ数えない。'])
 m.notes=['BIGという集約名は資料により暴走モードを含む場合と含まない場合がある。入賞図柄5種を正本にし合算は派生。','旧RF_BELL_YELLOW_BBとRF_SINGLE_BOUSOUの全設定0を数値尤度にせず明示的制約へ訂正。','小役の全設定確率は未公表であり設定差なしとは判断しない。']
 domains=['赤SBIG・青SBIG・黄BIG・暴走・REGと非当選の6カテゴリ。合算を再加算しない。','通常小役は設定1解析と設定6実戦を区別し、全設定値がない候補を閉じる。','成立役別の条件付き重複値は保持するが、全標本での当選契機識別を確認できないため閉じる。','REG順序・BTムービー・終了画面。ムービーはBARビタ成功かつ赤7成立の条件が必要。','3機会のカヲルは設定6、ムービーゲンドウ4以上・加持5以上、ベル黄BIG/単独暴走2以上。','通常3枚掛けとBTを分離。当日累積と自分の区間の混在を禁止。ペンペンの推測由来否定を禁止。']
 ui={'normalGames':'ONE_DAILY_MENU_SCOPE_INPUT','normalBonus':['赤SBIG','青SBIG','黄BIG','暴走','REG'],'derived':['BIG合算','REG合算','SBIG合算','BT合算','全ボーナス合算'],'movie':{'validOnly':'eligible red7 plus successful middle BAR precise stop; no failed/default or dedicated ED sample','oneCategoryInputPerOccasion':True},'recordOnlyCopy':'記録のみ・推測計算には使用しない','unobserved':'NULL_NOT_ZERO'}
 return m.finalize(ui,domains,coverage('Bisty',{'nana-press':'2026-10-27 DIRECT_RECHECK_30579','1geki':'2026-10-27 DIRECT_RECHECK_0'}))
def galfy():
 m=Machine(1);u=['https://nana-press.com/kaiseki/machine/1145/37072/','https://1geki.jp/slot/lb_galfy/0/'];g='GALFY_NORMAL_SHARED'
 m.numeric('RF_PREDECESSOR_BONUS_TOTAL','着席時 BIG・REG初当り',partition(BIG=[295.2,292.6,284.9,277.7],REG=[399.6,360.1,312.1,277.7]),u,'PREDECESSOR_NORMAL_GAME_TRIAL','着席前の通常Gと通常時BIG・REG。自分の区間やJAC中の回数と重複させない。')
 m.numeric('RF_BONUS_OUTCOME','通常時BIG・REG',partition(BIG=[295.2,292.6,284.9,277.7],REG=[399.6,360.1,312.1,277.7]),u,group=g)
 m.numeric('RF_NORMAL_SMALL_ROLES','通常時主要小役',partition(BELL=[15.5,15.2,14.7,14.3],SUIKA=[55.2,54.5,53.8,53.1],CHERRY=[32.8,32.3,31.7,31.2],GC_CHERRY=[262.1,260.1,258,254],BONE=[624.2,612.5,601.2,580]),u,group=g,scope='通常3枚掛け。目押しを継続しホネをベルへ取りこぼした不明な記録は入力しない。スイカA/Bは合算し、通常Gを共有する。')
 m.numeric('RF_BT_MISS','JAC INチャンス中ハズレ',[655.4,655.4,66.7,34.1],u,'GALFY_JAC_IN_2COIN_GAME_TRIAL','2枚掛けのJAC INチャンスで消化した有効Gだけ。BIG前半、通常3枚掛け、JAC消化を含めない。')
 m.numeric('RF_BAR_ROLE','通常時BAR揃い（狙った1種類）',[8192,8192,6554,5461],u,group=g,scope='狙ったBARの種類を固定した通常G。AかBの一方のみ見えるため合算1/4096等を使わない。狙いの不明なゲームを数えない。')
 # Existing placeholder 0-probability vectors are replaced with real conditional models.
 probs={'REPLAY':[.0029,.0031,.0036,.0040],'BELL':[.0047,.0046,.0049,.0050],'SUIKA':[.0084,.0083,.0090,.0089],'CHERRY':[.0110,.0113,.0121,.0124],'GC_CHERRY':[.16,.1667,.1732,.186],'BONE':[.381,.3925,.4037,.4248]}
 m.block('RF_BONUS_TRIGGER_DETAIL','契機別ボーナス（旧集約候補）','旧資料の0という仮値は発生率ではない。実際の成立役別の条件付き確率へ分解して保存し、ボーナス合計との重複加算をしない。',u,probs)
 for role,ps in probs.items():m.numeric('RF_OVERLAP_'+role,'成立役別ボーナス '+role,ps,u,'GALFY_ROLE_'+role+'_TRIAL','正しく識別した同一小役の成立回数を母数にし、契機を特定できたボーナスだけを成功回数とする。既存小役カウンターを共用。',g)
 for id,e in m.e_old.items():m.evidence(id,e['name'],[(e['name'],'設定6',[6])],u)
 m.evidence('RE_SIDE_LAMP','ボーナス終了サイドランプ',[(s,'設定6' if s=='虹' else '設定別出現率未確認の設定示唆', [6] if s=='虹' else None)for s in ['白','青','黄','緑','赤','虹']],u)
 m.block('RF_BT_BELL','BT中ベルA・B','設定2・5・6の出現率が未公表。設定1の値だけで他設定の値を補わない。',u,{'setting1':{'A':'1/8.8','B':'1/7.3'}})
 m.block('RF_SOLO_REACH_SPLIT','単独とリーチ目役の個別当選','単独とリーチ目役当選を実戦で正確に区別できない。個別の成立率があっても、表示上のリーチ目を内部フラグと同一視しない。',u)
 m.notes=['旧BAR合算は片方しか狙えない観測と不一致。旧IDを保持して狙った1種類の公開率へ修正。','既存主要小役のチェリーにGCチェリーは含めず別カテゴリ。スイカA/B識別の曖昧さを合算で回避。','DMM等の未確認値は原Researchの閉鎖を継承。追加の無差別探索なし。']
 domains=['通常時BIG/REGの排他的分布。着席前と自分の区間は分離。','ベル・スイカ合算、チェリー、GCチェリー、ホネと片側BAR。取りこぼし時は無効。','6役の成立回数を条件にしたボーナス期待度を保存。通常ボーナスと同時加算しない。','終了サイドランプ白青黄緑赤虹。虹以外の出現率は未公表。','虹ランプの設定6濃厚制約。試験用Lを通常設定の候補へ入れない。','JAC INチャンスの2枚掛けGを分離。BTベルの未公表設定は数値を作らず閉じる。']
 ui={'normalGames':'ONE_SHARED_INPUT','bonus':['BIG','REG'],'smallRoles':'same occasion; no tabs; role counts reused by overlap','BAR':'one aimable type; never combined A+B rate','BT':'eligible JAC IN 2coin G only','sideLamp':'one section six categories; rainbow constraint derived from same input','oldRainbowCounter':'no extra input','recordOnlyCopy':'記録のみ・推測計算には使用しない','unobserved':'NULL_NOT_ZERO'}
 return m.finalize(ui,domains,coverage('Oizumi',{'nana-press':'2026-10-27 DIRECT_RECHECK_37072','1geki':'2026-10-27 DIRECT_RECHECK_0'}))

