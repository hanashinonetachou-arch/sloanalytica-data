from curation import *
r=Review(1);r.d['settings']['values']=['SET_'+str(x) for x in range(1,7)];s=[r.src('12659')];r.d['uiRequirements']['gameCountInput']='NORMAL_GAMES'
r.numeric('CZ_INITIAL','CZ初当り',ratios([218.2,208.8,206.5,198.4,196.1,191]),s,'NORMAL_GAME_TRIAL','通常ゲーム数とCZ初当り回数。AT中ゲームと連続演出の重複は除く。',group='INITIAL_PATH')
r.numeric('AT_INITIAL','AT初当り',ratios([355.6,342.2,331.4,318.3,306.4,299.2]),s,'NORMAL_GAME_TRIAL','通常ゲーム数を母数に、明確な引き戻しゾーン終了後のAT当選を初当りとして記録する。',group='INITIAL_PATH')
r.numeric('AT_DIRECT','AT直撃',ratios([16384,16384,7282,7282,4096,4096]),s,'NORMAL_GAME_TRIAL','通常ゲーム数を母数に、CZを経由しないと確認できたAT当選だけ記録する。',group='INITIAL_PATH')
r.numeric('HANMA5_CZ','範馬メーター5個点灯時CZ当選',perc([20,25,26,31,32,35]),s,'HANMA5_TRIAL','範馬メーターが5個点灯した回数と、その契機からCZに当選した回数。',typ='conditional_probability',group='INITIAL_PATH')
r.block('WEAK_CHERRY_TRANSITION','弱チェリー契機の高確移行','100G刻みの移行や見た目のステージを区別して内部高確への移行を確定観測できず、公開値にも丸め差があるため計算に使用しない。',s+[r.src('chonborista')],{'percent':[10.2,13.7,15.2,19.5,21.9,25.0],'conflict':{'1':[10.2,10.3],'3':[15.2,15.3]}})
r.block('INITIAL_GAMES','149G・249G以内の初当り分布','モード・設定変更・有利区間により観測条件が変わり、249G以内は設定別の値も一部不足する。初当り確率と同時には加算しない。',s,{'149G':[63.5,64.8,65.5,66.6,67.6,68.3],'249G':[78.2,79.6,80.4,81.6,82.5]})
r.block('ENDORPHIN_INITIAL','設定変更時エンドルフィン初期pt','配分は内部初期値で、表示から10～30・40～60・70～90ptを確定分類できないため計算に使用しない。',s,[[64.1,32,3.9],[64.1,32,3.9],[59.4,36.3,4.3],[51.2,43.4,5.5],[41.4,52.3,6.3],[33.2,60.2,6.6]])
r.block('CZ_OPPONENT_WIN','CZ対戦相手別勝率','失敗天井・昇格・書き換えを除く抽選結果を実戦で確定分類できないため、記載値を通常のCZ勝率として使わない。',s,{'渋川':[16.9,17.3],'愚地':[25.4,25.7],'オリバ':[45.2,45.6],'ジャック':[66.2,66.5],'千春':[82,82.4]})
r.block('STRONG_EAT','強喰実質出現率','設定5の公表値に1/6146.1と1/6046.1の不一致があり、AT中の契機も含むため通常ゲーム数の確率として使用しない。',[r.src('chonborista'),r.src('12581')],{'denominators':[6851.2,6645,6500,6259,[6146.1,6046.1],5799.8]})
r.block('CONFIRMED_EAT_PROMOTION','確定強喰への小役別昇格','弱スイカ・強スイカの契機表記に矛盾があり、内部昇格結果も直接確定できないため計算に使用しない。',[r.src('chonborista'),r.src('12581')],{'weak':[1.6,2.3,3.1,3.9,4.7,5.5],'chance':[5.1,5.9,6.6,7.4,8.2,9.0],'strong':[15.2,16.8,18.4,19.9,21.5,23]})
r.no_diff('RARE_ROLE','通常時レア役単体出現率','弱チェリー1/60.7・強チェリー1/199.8・弱スイカ1/85.0・強スイカ1/299.3・チャンス目1/128.0は全設定共通。',s)
r.evidence('CZ_END','CZ終了画面',[('闘技場','デフォルト'),('徳川','高設定示唆弱'),('刃牙&ジャック','高設定示唆強'),('シャドー刃牙+可','設定2以上'),('タイトルロゴ+良','設定4以上')],s)
r.evidence('AT_END','AT終了画面',[('壁画','デフォルト'),('若き日のオーガ','高設定示唆弱'),('刃牙&梢江','高設定示唆強'),('刃牙+可','設定2以上'),('勇次郎+良','設定4以上'),('刃牙&勇次郎+優','設定5以上'),('全員集合+極','設定6')],s)
r.evidence('PAYOUT','AT中獲得枚数の特殊表示',[('333枚突破','設定3以上'),('456枚突破','設定4以上'),('555枚突破','設定5以上'),('666枚突破','設定6')],s,details=['専用の特殊表示が出た場合だけ記録。単に獲得枚数が閾値を超えただけでは入力しない。特殊表示なしの入力は不要。'])
r.block('POST_VOICE','CZ・AT終了後ボイス','次回モードを示す演出で、設定別出現率が確認できないため設定推測の計算には使用しない。',s)
notes=dict(INITIAL_HIT='CZ・AT・直撃を保持し、同じ初当り系列の重複を記録。',BONUS=None,SMALL_ROLE='通常レア役の設定共通値と弱チェリー移行の観測制約を記録。',CZ='解放のカタルシス初当り、メーター5個点灯抽選、相手別勝率を確認。',AT='AT初当り・直撃と強喰を確認。',INTERNAL_CONDITIONAL_DRAW='確定強喰昇格は契機表記の矛盾と内部状態の不可視性で閉鎖。',MODE_TRANSITION='終了後ボイスは次回モード示唆で設定確率へ転用しない。',STATE_TRANSITION='弱チェリーと規定G契機を区別できない高確移行は計算対象外。',SUCCESS_RATE='対戦相手別勝率は失敗天井・書換え混入のため閉鎖。',POINTS_GAME_DISTRIBUTION='初期ptと149・249G内当選分布を保存し観測条件不足を記録。',CARRY_OVER='据え置き内部継続と表示Gの違いを初当り条件へ記録。',THRESHOLD_BEHAVIOR='メーター5個到達の抽選と枚数の特殊表示を分離。',RESET_BEHAVIOR='設定変更で有利区間・天井・状態がリセット。朝一表示Gと内部Gを混同しない。',POST_EVENT_TRANSITION='終了後ボイスはモードの参考情報として保存。',NAVIGATION=None,ROLE_CONDITIONAL_DISTRIBUTION='小役別昇格はラベル衝突を残して計算対象外。',BONUS_TYPE_CONDITIONAL=None,EVIDENCE='CZ・AT画面と333・456・555・666枚専用表示を分類。',EXTERNAL_DATA_ONLY=None,MACHINE_SPECIFIC='強喰設定5の数値衝突を保存。通常Gへ変換しない。')
p=json.loads((ROOT/'original-packages'/f'{r.id}.json').read_text());mapping={'FEAT_AT_INITIAL':'AT_INITIAL','FEAT_HANMA5_CZ':'HANMA5_CZ','FEAT_CZ_INITIAL':'CZ_INITIAL','FEAT_AT_DIRECT':'AT_DIRECT'}
for x in p['evidence']['evidences']:mapping[x['id']]='AT_END' if 'AT_END_SCREEN' in x['id'] else 'PAYOUT'
r.d['audit']['limitedGapResolution']='添付の限定監査で閉鎖済みの強喰争点は再検索せず、数値と観測制約を候補別に保存。'
r.finish(notes,mapping)
