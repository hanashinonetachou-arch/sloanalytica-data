from prepare import *
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
if __name__=='__main__':print(globals()[sys.argv[1]]())
