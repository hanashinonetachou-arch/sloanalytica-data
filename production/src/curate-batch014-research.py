"""Source-reviewed Batch014 facts; no scoring or adoption decisions here."""
import json, pathlib, sys, hashlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
BATCH='batch-20261013-014'
OUT=ROOT/'batches'/BATCH
DOMAINS=['INITIAL_HIT','BONUS','SMALL_ROLE','CZ','AT','INTERNAL_CONDITIONAL_DRAW','MODE_TRANSITION','STATE_TRANSITION','SUCCESS_RATE','POINTS_GAME_DISTRIBUTION','CARRY_OVER','THRESHOLD_BEHAVIOR','RESET_BEHAVIOR','POST_EVENT_TRANSITION','NAVIGATION','ROLE_CONDITIONAL_DISTRIBUTION','BONUS_TYPE_CONDITIONAL','EVIDENCE','EXTERNAL_DATA_ONLY','MACHINE_SPECIFIC']
IDS=['S_SLODOL_PK','S_ANOTHER_GOD_HADES_SL','L_MONSTER_HUNTER_RISE_XA','L_SHIOKININ_KC','L_BANDORI_S11','L_REZERO_SEASON2_PA5','S_MY_FLOWER_II_EE_30','S_KACHO_KUMADA_GZA','S_SHIN_TENKAFUBU_DD','S_CHABUDAI_EB6']
NAMES=['スロドル','アナザーゴッドハーデス-解き放たれし槍撃ver.-','スマスロ モンスターハンターライズ','L 新・必殺仕置人 回胴 CRASH SPEC','Lバンドリ！','スロット Re:ゼロから始める異世界生活 season2','マイフラワー2-30','課長 熊田工作','真天下布武','ウルトラちゃぶ台返し']
DATE='2026-10-13'
def rates(xs,settings=(1,2,3,4,5,6)):
    return {str(k):'1/'+str(v) for k,v in zip(settings,xs)}
def perc(xs,settings=(1,2,3,4,5,6)):
    return {str(k):v/100 for k,v in zip(settings,xs)}
def exact(label,meaning):return dict(label=label,meaning=meaning,semanticType='EXACT_CONSTRAINT')
def unknown(label,meaning):return dict(label=label,meaning=meaning,semanticType='PROBABILITY_UNKNOWN')
def display(label,meaning):return dict(label=label,meaning=meaning,semanticType='DISPLAY_ONLY')
class Machine:
    def __init__(self,no,settings=(1,2,3,4,5,6)):
        self.no=no;self.id=IDS[no-1];self.name=NAMES[no-1];self.settings=settings
        self.sources=[];self.findings=[];self.blocks=[];self.ledger=[];self.notes=[];self.audit=[]
        self.queries=[];self.legacy={};self.models=[]
    def source(self,sid,url,title):
        self.sources.append(dict(sourceId=sid,url=url,title=title,sourceType='published_analysis',checkedAt=DATE,claims=[],confidence='SOURCE_REVIEWED',independence='NOT_ASSERTED_SHARED_PUBLIC_ANALYSIS_POSSIBLE'))
    def trace(self,cid,label,claim,src,disposition,old=None):
        for sid in src:
            s=next(s for s in self.sources if s['sourceId']==sid)
            if claim not in s['claims']:s['claims'].append(claim)
        self.ledger.append(dict(candidateId=cid,label=label,sourceClaims=[dict(sourceId=sid,claim=claim) for sid in src],discoveryQueries=self.queries,disposition=disposition,preliminaryCandidateIds=old or []))
    def numeric(self,cid,label,dist,scope,src,group=None,kind='CAUSAL_PATH_OVERLAP',ob='probability',trial='NORMAL_GAME_TRIAL',old=None):
        f=dict(findingId=cid,label=label,observationType=ob,sourceIds=src,settingDistribution=dist,trialUniverse=trial,denominatorSemantics=scope,details=[scope],liveObservation=dict(status='EXACT_WITH_SCOPE_TRACKING',reason=scope))
        if group:f.update(dependencyGroupId=group,dependencyKind=kind,dependencyReason='同じ当選経路や内訳を含むため、同時に独立加算せず対応する入力から1つの推測経路だけを使用します。')
        self.findings.append(f);self.trace(cid,label,label+'：'+scope,src,dict(type='FINDING',refId=cid),old)
        self.models.append(dict(candidateId=cid,likelihood='BERNOULLI' if ob!='appearance_distribution' else 'CATEGORICAL',inputEvents=[dict(id=cid+'-trials',kind='eligible_trials',description=scope),dict(id=cid+'-observed',kind='observed_outcome',description=label)],settings=dist,excludedConditions=scope,dependencyGroup=group,liveObservation=f['liveObservation'],uiLabel=label,uiExplanation=[scope],benchmark='OWNED_BY_FORMAL_EVALUATION',parameterConfidence='PUBLISHED_VALUES_NO_IMPUTATION'))
    def evidence(self,cid,label,cats,scope,src,old=None):
        self.findings.append(dict(findingId=cid,label=label,observationType='evidence',sourceIds=src,details=[scope],semanticCategories=cats))
        self.trace(cid,label,label+'：'+scope,src,dict(type='FINDING',refId=cid),old)
        self.models.append(dict(candidateId=cid,likelihood='NONE',inputEvents=[dict(id=cid+'-'+str(i+1),kind='category_count',description=c['label']) for i,c in enumerate(cats)],denominator=scope,semanticCategories=cats,uiLabel=label,uiExplanation=[scope],unknownProbabilities='RECORD_ONLY_NO_WEIGHT',exactConstraints='ONLY_EXPLICIT_CONFIRMED_CATEGORY_CONDITIONS'))
    def block(self,cid,label,reason,src,raw=None,old=None):
        b=dict(blockId=cid,label=label,reason=reason,reevaluationCondition='不足する設定別の数値または対象条件を確認できる新しい具体的な公開資料が得られた場合に再確認します。',sourceIds=src)
        if raw is not None:b['retainedPublishedValues']=raw
        self.blocks.append(b);self.trace(cid,label,label+'：'+reason,src,dict(type='BLOCKED',refId=cid),old)
        self.models.append(dict(candidateId=cid,likelihood='DISABLED',inputEvents=[],retainedPublishedValues=raw,uiLabel=label,uiExplanation=[reason],reason=reason))
    def nodiff(self,cid,label,reason,src,raw=None):
        self.trace(cid,label,label+'：'+reason,src,dict(type='NO_SETTING_DIFFERENCE',reason=reason))
        self.models.append(dict(candidateId=cid,likelihood='DISABLED_NO_CONFIRMED_SETTING_INFORMATION',retainedPublishedValues=raw,uiLabel=label,uiExplanation=[reason]))
    def save(self):
        groups=[0,0,1,0,0,2,2,2,2,2,2,2,5,2,1,2,2,3,4,5]
        d=dict(schemaVersion='research-v1',manifestVersion='8.5',batchId=BATCH,machineId=self.id,machineName=self.name,researchedAt=DATE,researchStage='SOURCE_REVIEWED_PENDING_FORMAL_VALIDATION',settings=dict(status='SOURCE_DERIVED',values=['SET_'+str(k) for k in self.settings]),sources=self.sources,findings=self.findings,blockedItems=self.blocks,researchCompleteness=dict(version=2,domains=[dict(domain=k,status='CHECKED',note=self.notes[g],sourceIds=[s['sourceId'] for s in self.sources]) for k,g in zip(DOMAINS,groups)],machineSpecificQueries=self.queries,candidateLedger=self.ledger),selfAudit=dict(status='COMPLETE_BOUNDED_SOURCE_SURVEY',independentExternalAudit='NOT_PERFORMED',reviewDate=DATE,findings=self.audit,scope='列挙した媒体・検索語・公開解析見出しに限定した調査。全公開資料の網羅や未公表情報の不存在は主張しない。'),modelDesign=self.models)
        d['preliminaryHistory']=[c for c in json.loads((OUT/'imported-handoff/candidates.json').read_text())['candidates'] if c['machine_no']==self.no]
        p=OUT/'research-drafts'/('wave-1' if self.no<=5 else 'wave-2')/(self.id+'.json');p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
        print(json.dumps(dict(machineId=self.id,candidates=len(self.ledger),numeric=sum('settingDistribution'in f for f in self.findings),evidence=sum(f['observationType']=='evidence' for f in self.findings),blocks=len(self.blocks)),ensure_ascii=False))
def machine1():
    m=Machine(1);m.queries=['スロドル 設定差 小役 終了画面 設定判別 解析','スロドル 小役確率 リセット 設定差 CZ バスタイム','スロドル 初当り 208.4 209.0 コナミコマンド','スロドル 終了画面 コナミコマンド ボイス 設定差']
    m.source('rates','https://nana-press.com/kaiseki/machine/517/13330/','スロドル AT・小役確率');m.source('payout','https://nana-press.com/kaiseki/machine/517/14590/','獲得枚数表示');m.source('screen','https://nana-press.com/kaiseki/machine/517/14218/','アンコール終了画面');m.source('reset','https://nana-press.com/kaiseki/machine/517/14209/','設定変更と有利区間');m.source('mode','https://nana-press.com/kaiseki/machine/517/14221/','バトルモード');m.source('audit','https://p.hisshobon.jp/machine/4053/1/94220','終了画面とコマンド');m.source('corroboration','https://hazuse.com/machine/pachislot/2S0336/genre/201/','スロドル基本スペック')
    m.numeric('at-initial','AT初当たり',rates([290.9,281.7,272.9,240.9,225.1,208.4]),'通常時のゲーム数とAT初当たりを記録します。AT継続やアンコールでの引き戻しを新たな初当たりへ加算しません。',['rates','corroboration'],old=['M01C01'])
    m.evidence('payout','獲得枚数表示',[exact(str(n)+'枚OVER','設定'+str(k)+'以上') for n,k in [(222,2),(333,3),(444,4),(456,4),(555,5)]]+[exact('666枚OVER','設定6'),unknown('246枚OVER','偶数設定示唆')],'AT中に実際に表示された枚数だけを記録します。246は今回確認した媒体の示唆表現を保持し、確率や奇数否定を補いません。',['payout'],old=['M01C02'])
    m.evidence('encore-screen','アンコール終了画面',[unknown('私服1','奇数設定示唆'),unknown('私服2','偶数設定示唆'),unknown('水着1','高設定示唆'),exact('水着2','設定2以上'),exact('コスプレ','設定4以上'),display('オールキャスト（移行未確認）','カリスマモード移行または設定6。移行を確認できない場合は記録のみ。'),exact('オールキャスト（カリスマ非移行確認）','設定6')],'アンコールチャンス終了時の画面を記録します。集合画面はカリスマモードへ移行しないことを確認できた場合だけ設定6の絞り込みに使います。',['screen','audit'],old=['M01C03'])
    m.block('role-rates','小役出現率','公開されている値は設定1のみで、他の設定と比較する数値を確認できません。',['rates'],dict(replay='1/7.3',threeCoin='1/12',bell='1/1.6',weakCherry='1/64',strongCherry='1/819',watermelon='1/99',chance='1/297',reach='1/16384'))
    m.block('cz-entry','バトルチャンス出現率','全体目安は約1/100ですが、設定別の出現率がありません。周期やポイントによる当選を設定差へ置き換えません。',['mode'],{'allSettingApproximate':'1/100'},old=['M01C04'])
    m.block('cz-success','バトルチャンス成功率','内部モードと成立役で変わるため、設定別の正確な成功率を確認できない状態では計算に使えません。',['mode'],old=['M01C04'])
    m.block('buzz-time','バズタイム当選','高設定に関する考察から、設定別の確率を推定して補うことはできません。',['mode'],old=['M01C04'])
    m.block('mode-reset','モード選択・リセット優遇','設定変更後の初回周期や偶数周期の優遇は確認できますが、設定ごとの選択率が揃っていません。内部モードも毎回確定観測できません。',['reset','mode'])
    m.block('command-voice','終了画面コマンドボイス','コマンドによるボイス発生は確認されていますが、ボイス別の設定示唆内容は未解明です。他機種の意味を流用しません。',['audit'])
    m.notes=['ATの設定別初当たりとCZ成功・直撃・トップスターの経路を確認。アンコール引き戻しを分離。','小役表は設定1のみ。リーチ目による直撃はAT初当たりの内訳。','周期・いいね・バトルモード・カリスマ・リセット優遇を確認。モード別と設定別の値を区別し、非観測モードを入力しない。','枚数とアンコール画面を確認。集合画面のカリスマ非移行条件、コマンドボイスの未解明を保持。','コマンドボイスは確定解釈なし。外部データの値や平均値を設定別に補完しない。','型式SスロドルPKの2023年機。後年のコナミ機種のボイスを混入しない。設定6の旧209.0と現行208.4を履歴保持。']
    m.audit=['旧209.0は導入前報道の値。現行なな徹とHAZUSE基本スペック、既存Repositoryの208.4を一致確認し置換。','集合画面条件を分割。コマンドボイス候補を追加。246は今回読めた出典の「偶数示唆」を強い制約へ変更しない。','独立第三者監査は未実施。複数媒体が同じメーカー資料に基づく可能性を排除できず独立情報源数としない。'];m.save()
def machine2():
    m=Machine(2);m.queries=['ハーデス 槍撃 設定差 モード移行 終了画面 小役 履歴','ハーデス 槍撃 小役履歴 青ダイヤ4連 12.5 28.9 ジャッジメント 選択率','ハーデス 槍撃 通常時 小役 確率 リセット ヘルグレイヴ']
    m.source('review','https://nana-press.com/kaiseki/machine/530/14494/','ハーデス槍撃 設定差と画面選択率');m.source('audit','https://1geki.jp/slot/s_hades_sougeki/0/','ハーデス槍撃 設定判別');m.source('history','https://p.hisshobon.jp/machine/4064/1/95383','小役履歴からのGG抽選');m.source('spec','https://www.p-world.co.jp/machine/database/9800','機種同定・通常時とGG中の条件')
    m.numeric('gg-initial','GG初当たり',rates([510.9,418.4,338.6,275.8,244.7,224.2]),'通常時のゲーム数に対して新規GG初当たりを数えます。GG中のストック・継続・引き戻しは加算しません。',['review','spec'],old=['M02C01'])
    modes={'AtoB_nonRare_pct':[0.4,2,3.5,5.9,7.8,8.2],'AtoMeikai_replay_pct':[0.4,0.8,1.2,1.6,2,2.3],'BtoHeavenPrepA_miss_pct':[1.2,2.7,4.3,5.5,6.3,6.6],'BtoHeavenPrepA_bell_pct':[0.8,2.3,4.7,7,9,9.4],'BtoA_pct':[19.9,16.8,13.7,10.2,7.4,6.6],'HeaventoPrepA_pct':[1.6,3.9,5.5,7.8,9.8,10.2],'HeaventoA_pct':[24.6,22.3,20.7,18.4,16.4,16]}
    for key,val in modes.items():m.block('mode-'+key,'内部モード移行（'+key.split('_')[0]+'）','移行前と移行後の内部モードを毎回確定できず、共通黄7の種類も見分けられないため、見た目のステージ移行を公表された抽選回数へ置き換えられません。',['review'],perc(val),old=['M02C02'])
    for cid,label in [('blue-history','青ダイヤ4連からのJM'),('green-history','緑宝石2連からのJM')]:
        m.block(cid,label,'公表された履歴抽選には設定差がありますが、連続回数の追加抽選や成立役そのものの抽選が重なるため、JM当選を該当履歴だけの成功として確定できません。通常時の履歴のみを対象とし、GG中のストック抽選を混ぜません。',['review','history','audit'],perc([12.5,14.8,18,23.4,28.5,28.9]),old=['M02C04'])
    for cid,label,dist,meaning in [('cerberus-screen','ケルベロス特殊画面',perc([0,12.5,12.5,12.5,12.5,12.5]),'設定2以上'),('persephone-screen','ペルセポネ特殊画面',perc([0,0,0,12.5,12.5,12.5]),'設定4以上'),('hades-screen','ハーデス特殊画面',perc([0,0,0,0,0,25]),'設定6')]:
        strings={k:'通常画面:'+str(round((1-v)*100,6))+'%/特殊画面:'+str(round(v*100,6))+'%' for k,v in dist.items()}
        m.numeric(cid,label,strings,'該当種類のジャッジメント終了回数を母数とし、特殊画面の回数を数えます。通常画面も母数に含め、別種類の終了回数は混ぜません。',['review'],group='jm-screen-conditions',kind='CONDITIONALLY_SEPARATE',ob='appearance_distribution',trial=cid.upper().replace('-','_')+'_TRIAL',old=['M02C03'])
        f=m.findings[-1];f['dependencyReason']='終了したジャッジメントの種類を条件とし、条件ごとに独立した別の母数を記録します。同一終了はどれか1種類にだけ入り、GG発生回数との二重計測はありません。'
        f['categoryModel']={'residualPolicy':'SOURCE_EXHAUSTIVE'};f['mirrorsEvidenceFindingId']=cid+'-constraint';f['categoricalEvidenceReconciliation']=dict(type='SINGLE_CANONICAL_CATEGORY_INPUT',evidenceFindingId=cid+'-constraint',runtimeLinkContract='EXPLICIT_CATEGORY_LINK_V1')
        cats=[display('通常画面','通常パターン'),exact('特殊画面',meaning)]
        for c in cats:c['linkedFindingId']=cid
        m.evidence(cid+'-constraint',label+'の制約',cats,'該当種類の終了画面を1回だけ入力します。同じ入力を出現割合と設定候補の絞り込みで共有し、別の観測には数えません。',['review','audit'],old=['M02C03'])
    m.evidence('another-legend-entry','アナザーレジェンド突入',[exact('ベビーステージ','設定4以上'),display('通常画面','通常パターン')],'アナザーレジェンドの突入画面を確認します。ベビーステージは設定4以上として扱います。',['review'])
    m.block('role-rates','小役出現率','小役成立そのものの設定別差を確認できません。小役による内部モード移行の差と、成立確率の差を混同しません。',['spec'])
    m.block('hell-zone-reset','ヘルゾーン・リセット後移行','GGへ至る経路と状態条件はありますが、この調査で直接観測できる設定別の完全な成功率・移行率を確認できません。内部モードを推定入力しません。',['spec','audit'])
    m.notes=['GG初当たりの設定差とJMで開始するAT構造を確認。通常時履歴抽選はGG初当たりの一部。','役そのものと役によるモード移行を区別。黄7A/Bの視認不能を保存。','通常A/B・天国の昇格転落と履歴抽選を値付きで保持。内部モード・連続追加・役抽選の識別不能を対象別に保存。','JM3種類の特殊画面率と設定制約、アナザーレジェンド突入ベビーステージを確認。','JM画面の数値は種類別終了回数に条件付け。GG中の履歴は通常時と別抽選。確定役を設定確定と混同しない。','S／アナザーゴッドハーデス／SL・2023年メダル機。奪われたZEUSやスマスロ版の値を流用しない。ヘルグレイヴと有利区間開始を識別。']
    m.audit=['M02C03は確定画面だけでなく公表選択率12.5%/25%を回収。JM突入ベビーステージを追加。','必勝本の2連目レア役再抽選を照合し、履歴契機の成功を単純入力しない設計へ。','非観測モード率を多数の数値入力に変換せず値を保存。外部監査未実施。'];m.save()
def machine3():
    m=Machine(3);m.queries=['モンスターハンターライズ スマスロ 設定差 ライズゾーン 直撃 おみくじ','モンスターハンターライズ 小役確率 設定差','モンハンライズ 金冠 マガイマガドモード 設定差']
    m.source('review','https://nana-press.com/kaiseki/machine/837/25295/','ライズ設定別抽選・演出');m.source('audit','https://1geki.jp/slot/l_mh_rize/0/','ライズ異媒体照合');m.source('reset','https://1geki.jp/slot/l_mh_rize/3/','ライズ設定変更');m.source('crown','https://nana-press.com/kaiseki/machine/837/28550/','金冠の条件');m.source('order','https://pachimaga.com/free/machine/6a696981312586685994c7fbb0986e8ef2b80975.php','直撃→ゾーン→状態の抽選順序')
    m.numeric('at-initial','AT初当たり',rates([309.5,301.4,290.8,256.4,237.1,230.8]),'通常時のゲーム数と狩猟ボーナスの初当たりを記録。AT中の連チャンと終了直後の引き戻しは除きます。',['review','audit'],group='entry-path',old=['M03C01'])
    m.numeric('rise-zone-entry','ライズゾーン出現率',rates([75.6,75.2,72.9,71.8,68.9,68.2]),'通常時のゲーム数とライズゾーンへの突入を数えます。AT初当たりと共通の当選経路を含むため、同時に独立加算しません。',['review','audit'],group='entry-path',old=['M03C04'])
    for cid,label,dist in [('weak-direct','弱レア役からのAT直撃',[0.031,0.046,0.076,0.098,0.146,0.195]),('strong-direct','強レア役からのAT直撃',[1.56,3.13,3.91,4.69,5.47,6.25])]:
        m.numeric(cid,label,perc(dist),'非前兆中の対象レア役成立回数が母数です。クエスト受注を経由しないAT当選を成功とし、AT本前兆・フェイク前兆中の役を除きます。',['review','audit'],group='entry-path',ob='conditional_probability',trial=cid.upper().replace('-','_')+'_TRIAL',old=['M03C05'])
    m.block('high-state','3枚ベルから高確移行','通常状態からの3枚ベルだけが対象ですが、移行前後の内部状態を毎回確定できません。ステージ移行回数で代用しません。',['review','audit'],perc([6.25,6.64,7.03,7.81,8.59,9.38]),old=['M03C02'])
    for cid,label,dist in [('rise-normal','弱レア役のライズゾーン（通常）',[25,25.4,28.1,30.5,34.4,35.2]),('rise-high','弱レア役のライズゾーン（高確）',[55.1,55.5,56.3,57.4,59.4,60.2])]:m.block(cid,label,'通常・高確・超高確の状態区別が必要です。ステージだけから内部状態を確定できず、直撃先行抽選と前兆・ゾーン中の除外を含む母数を保証できません。',['review','audit','order'],perc(dist),old=['M03C03'])
    replay=[[12.5,12.5,25,25,25],[13.3,13.3,24.2,24.6,24.6],[15.6,15.6,21.9,23.4,23.4],[19.5,19.5,20.3,20.3,20.3],[21.9,21.9,19.5,18.4,18.4],[22.7,22.7,18.8,18,18]]
    m.block('replay-threshold','CZ規定リプレイ回数','40・80・120・160・200回の選択割合は公表されていますが、設定変更の内部加算やATで中断した未到達サイクルを除くと短い回数に偏ります。到達済みCZだけを抽選全体として扱いません。',['review','reset'],dict(categories=[40,80,120,160,200],percentRows=replay,censoring='AT_INTERRUPTION_AND_INITIAL_RANDOM_OFFSET'),old=['M03C05'])
    m.numeric('hyakuryu-entry','百竜夜行出現率',rates([19124,18884,18287,18426,18208,18111]),'通常時のゲーム数と百竜夜行への突入を数えます。クエスト失敗経路とAT初当たりに関連するため同時に独立加算しません。',['review'],group='entry-path',old=['M03C05'])
    m.numeric('hyakuryu-fake','百竜夜行の当選率',perc([1.07,1.08,1.1,1.13,1.14,1.16]),'規定カムラポイント到達でクエスト本前兆に当選しなかった機会を母数とし、その機会からの百竜夜行突入を数えます。機会の成否が分からない場合は入力しません。',['review'],group='entry-path',ob='conditional_probability',trial='HYAKURYU_FAKE_QUEST_TRIAL')
    point={'A':[[50,40.6,6.3,3.1],[48.8,40.7,7,3.5],[47.7,40.6,7.8,3.9],[40.6,40.6,14.1,4.7],[35.9,40.6,18,5.5],[34.3,40.6,18.8,6.3]],'B':[[50,43.7,6.3],[49.6,43.8,6.6],[49.2,43.8,7],[47.7,43.8,8.5],[44.5,43.8,11.7],[43.8,43.8,12.4]],'D':[[50,34.4,3.1,12.5],[46.5,34.4,3.5,15.6],[43,34.4,3.9,18.7],[35.9,34.4,4.7,25],[32,34.4,5.5,28.1],[30.4,34.4,6.3,28.9]]}
    quest={'A':[[50,22.7,7,20.3],[48.8,23,7.4,20.8],[47.7,23.4,7.8,21.1],[34,23.8,18.8,23.4],[27.4,24.2,24.2,24.2],[25,25,25,25]],'B':[[50,25,25],[49.2,25.4,25.4],[48.4,25.8,25.8],[39,30.5,30.5],[35.2,32.4,32.4],[33.6,33.2,33.2]],'prep':[[25,75],[24.6,75.4],[24.2,75.8],[22.3,77.7],[20.7,79.3],[19.9,80.1]],'heaven':[[50,6.3,6.3,37.4],[49.2,6.7,6.7,37.4],[48.4,7.1,7.1,37.4],[36.8,9.4,16.4,37.4],[31.7,11.8,19.1,37.4],[30.1,12.5,20,37.4]]}
    m.block('point-mode','ポイントモード移行','移行元の内部モードを確定できないため、設定別の移行表を直接入力する推測には使いません。',['review'],point,old=['M03C05'])
    m.block('quest-table','クエストテーブル移行','内部テーブルの移行元が分からず、前兆回数から移行結果を確定して代用できません。',['review'],quest,old=['M03C05'])
    m.block('long-freeze','ロングフリーズ確率','有利区間内の差枚と通常時のリプレイが抽選条件です。着席前の区間差枚を確認できない場合に対象ゲームを正確に特定できません。',['review'],rates([986413,830587,717259,631130,563458,492965]))
    odd=[unknown(x,'奇数設定示唆') for x in ['MG-滅-ワドウ丸','ルーク','HARUTO']];even=[unknown(x,'偶数設定示唆') for x in ['アッシュ','Mimi★chan']]
    m.evidence('bonus-confirm','ボーナス確定画面',odd+even+[unknown('つばき','偶数設定示唆'),unknown('YOU','高設定示唆'),exact('Lara＆ミランダ＆隊長','設定4以上')],'狩猟ボーナス開始前の確定画面だけを記録。終了画面の同じキャラとは意味が異なります。',['review','audit'],old=['M03C06'])
    m.evidence('bonus-end','ボーナス終了画面',odd+even+[unknown('つばき','設定1・4・5・6示唆'),unknown('YOU＆オトモ','高設定示唆（弱）'),unknown('Lara＆ミランダ＆隊長（装備あり）','高設定示唆（強）'),exact('イオリ＆ヨモギ','設定2否定'),exact('ウツシ＆フゲン','設定3否定'),exact('全員集合','設定5以上'),exact('ヒノエ＆ミノト＆エンタライオン','設定6')],'ボーナス終了時PUSHで切り替わる設定示唆画面を確認します。天国示唆画面を設定確定画面へ混ぜません。',['review','audit'],old=['M03C06'])
    m.evidence('cutin-voice','図柄狙え特殊ボイス',[exact('ウツシ特殊停止ボイス','設定5以上'),exact('ヒノエ特殊停止ボイス','設定6'),exact('紫7一確エンタライオン','設定6')],'集会所の狙えカットインの特殊停止ボイス、または紫7の一確ボイスが対象。通常のキャラボイスと混同しません。',['review'],old=['M03C06'])
    m.evidence('entry-voice','入賞ボイスの矛盾',[exact('声のハンターが参戦しない','設定4以上'),exact('得意モンスターでないハンターの声','設定4以上')],'YOU以外の入賞ボイスと実際の参戦ハンター・得意モンスターを照合できた場合だけ入力します。',['review'],old=['M03C06'])
    m.evidence('early-movie','早期討伐ムービー',[exact('エンタライオン','設定6')],'早期討伐後の残りゲームで流れるキャラ紹介ムービーのみ。',['review'],old=['M03C06'])
    colors=[exact(c,'設定'+str(k)+'以上' if k<6 else '設定6') for c,k in [('銅',2),('銀',3),('金',4),('紅葉',5),('虹',6)]]
    m.evidence('trophy','エンタトロフィー',colors,'ボーナス終了画面で確認した色を記録。出現しないことに否定の意味を与えません。',['review'],old=['M03C06'])
    m.evidence('omikuji','アイルーおみくじ',[unknown('青','奇数設定示唆'),unknown('緑','偶数設定示唆'),unknown('赤','高設定示唆（強）')]+colors,'エンディング中のレア小役成立時に出現するおみくじだけを記録します。',['review'],old=['M03C06'])
    m.block('roles','小役出現率','小役成立率そのものの設定別差はこの調査で確認できません。役契機の抽選率の差を役の出現率へ置き換えません。',['audit'])
    m.nodiff('crown','金冠出現率','金冠は設定変更後50%、通常初当たり1.6%、連チャン0.4%という状態別値で、設定別表ではありません。',['crown'],{'reset':50,'initial':1.6,'chain':0.4})
    m.block('magai-mode','マガイマガドモード移行','駆け抜けや引き戻しの状態恩恵と、設定差のある移行率を区別する必要があります。設定別の完全な移行表をこの調査で確認できません。',['reset'])
    m.notes=['狩猟ボーナス初当たりとライズゾーン・百竜夜行・役直撃を個別保存。同じ経路の独立加算を禁止。','3枚ベルの成立と高確移行を区別。弱強レア役の対象を分け、超高確の100%を設定差としない。','ポイント・クエストの設定別内部表、規定リプレイ分布、直撃、フリーズ適用差枚を確認。内部状態不明と中断打切りを保持。','確定画面、終了画面、狙えボイス、入賞矛盾、早期ムービー、トロフィー、おみくじを観測場面別に分離。','金冠の状態別値と設定差を区別。つばきの確定画面と終了画面は別意味。数値未公表演出に重みを付けない。','型式LモンスターハンターライズXAの2024年機。サンブレイク版とゲーム版を除外。リセット内部加算・初回金冠・AT終了1Gの引き戻しを確認。']
    m.audit=['M03C05/C06の一括候補を具体イベントへ展開。百竜夜行の確率、ポイント表、テーブル表、フリーズを追加。','一撃で高確の判別困難を再確認。設定変更初回の内部リプレイ加算と途中ATによる観測偏りを保持。','金冠は状態差、設定差の代理に使わない。外部監査未実施。'];m.save()
def machine4():
    m=Machine(4);m.queries=['新 必殺仕置人 CRASH SPEC 設定差 小役 直撃 CZ 終了画面 なな徹','新 必殺仕置人 CRASH SPEC 小役確率 設定変更 天井 短縮 40.8','新 必殺仕置人 CRASH SPEC ボーナス AT 222 456 玉ちゃん']
    m.source('review','https://nana-press.com/kaiseki/machine/833/25100/','仕置人設定差・演出');m.source('audit','https://1geki.jp/slot/l_hissatsu_shiokinin_crash/0/','仕置人設定判別');m.source('spec','https://www.p-world.co.jp/machine/database/10113','仕置人機種仕様');m.source('reset','https://nana-press.com/kaiseki/machine/833/25105/','リセット天井短縮')
    for cid,label,vals,old in [('bonus-initial','ボーナス初当たり',[230.7,224.1,212.9,198.2,184.7,169],'M04C01'),('at-initial','AT初当たり',[456,438.9,411.2,380.7,350.7,319.9],'M04C02')]:m.numeric(cid,label,rates(vals),'通常時のゲーム数に対する新規当選回数を記録します。AT中の継続・上乗せや極夜ステージからの引き戻しは新たな初当たりへ加算しません。ボーナスとATを同時に独立加算しません。',['review','audit'],group='bonus-at-path',old=[old])
    m.evidence('end-screen','ボーナス・AT終了画面',[display(x,'通常パターン') for x in ['正八','おてい','巳代松','鉄','主水']]+[unknown('死神','奇数設定示唆'),unknown('虎','偶数設定示唆'),exact('鉄＆巳代松','設定2以上'),exact('鉄＆主水','設定2以上'),exact('アジト','設定4以上'),exact('全員集合','設定6')],'ボーナスまたはAT終了時にPUSHして表示された画面を記録。鉄＆巳代松と鉄＆主水は設定2以上で、追加の高設定示唆は出現率不明のため重みを付けません。',['review','audit'],old=['M04C03'])
    m.evidence('trophy','玉ちゃんトロフィー',[exact(c,'設定'+str(k)+'以上' if k<6 else '設定6') for c,k in [('銅',2),('銀',3),('金',4),('ゼブラ',5),('虹',6)]],'出現したトロフィーの色だけを記録します。非出現は設定否定ではありません。',['review','audit'],old=['M04C04'])
    m.evidence('payout','獲得枚数表示',[exact(str(n)+'枚OVER','設定'+str(k)+'以上' if k<6 else '設定6') for n,k in [(222,2),(333,3),(444,4),(456,4),(555,5),(666,6)]],'実際の特定枚数表示を記録。456は設定4以上で、5・6への期待度アップに架空の確率を与えません。',['review','audit'],old=['M04C05'])
    m.evidence('battle-picture','極限バトル扉絵',[unknown('3人集合背景','高設定示唆'),exact('金背景','設定4以上')],'AT中の極限バトル1G目の扉絵だけが対象。別の集合画面とは区別します。',['review','audit'],old=['M04C05'])
    m.block('rare-direct','非前兆中の役契機ボーナス','弱チェリー・チャンス目・強チェリーの当選率は設定1のみです。前兆中の書き換えを含む平均値から他設定の率を補えません。',['review'],{'setting1':{'weakCherryBIG':0.6,'chanceBIG':9.9,'chanceTrueBonus':0.5,'strongCherryBIG':17.8,'strongCherryTrueBonus':1.0,'inclusiveChance':14.8,'inclusiveStrongCherry':22.8}})
    m.block('cz-scope','スイカから頼み人チャンス','非前兆中のスイカ当選は設定1の頼み人8.8%・超頼み人0.4%のみで、他設定の完全な表がありません。',['review'],{'setting1':{'normalCZ':8.8,'superCZ':0.4,'totalWithRewrite':10.2}})
    m.block('reset-short','リセット天井短縮','設定変更時の408G短縮40.8%・999G59.2%は設定1の値です。設定別の振り分けとして比較できません。',['review','reset'],{'setting1':{'408G':40.8,'999G':59.2}})
    m.nodiff('roles','小役出現率','掲載された小役率は設定共通です。役契機のボーナス抽選と成立率を区別します。',['spec'])
    m.notes=['ボーナスとAT確率を両方保持。包含する当選系列として同時加算しない。','設定共通小役と設定1のみの役契機抽選を分けて確認。','非前兆・書換え・CZ種類・極夜引き戻しを区別。天井短縮は設定1だけで設定別補完しない。','終了PUSH画面、トロフィー、枚数、極限バトル1G扉絵を個別保持。','定性追加示唆に重みを付けず、2以上等の制約のみ絞り込み。実戦3000G結果を公表母数表へ流用しない。','L新・必殺仕置人KC、2024年11月導入。引き継ぎlaunch2025を訂正し、パチンコ版・別シリーズを除外。']
    m.audit=['一撃とボーナス・AT6設定表と全示唆を照合。M04C05を枚数と扉絵に分割。','設定1の天井短縮、非前兆と書換え込み数値を新規候補として保存。正式評価以前に採否を決めていない。','launch年誤記を同定表と照合。外部監査未実施。'];m.save()
def machine5():
    ss=(2,3,4,5,6);m=Machine(5,ss);m.queries=['バンドリ スマスロ 設定差 ピコアタック 無限ST 終了画面 なな徹','バンドリ 無限ST 698.3 392.3 駆け抜け 解析','バンドリ 隠れ凪 設定2以上 公式 打WIN']
    m.source('review','https://nana-press.com/kaiseki/machine/823/25145/','バンドリ設定差');m.source('audit','https://1geki.jp/slot/l_bang_dream/0/','バンドリ設定判別');m.source('pico','https://nana-press.com/kaiseki/machine/823/25401/','ST終了時ピコ抽選');m.source('stock','https://nana-press.com/kaiseki/machine/823/25162/','ボーナス中ストック抽選条件');m.source('roles','https://1geki.jp/slot/l_bang_dream/4/','状態別リンク役と共通小役');m.source('reset','https://1geki.jp/slot/l_bang_dream/3/','周期短縮・持越し');m.source('nagi','https://nana-press.com/kaiseki/machine/823/25493/','隠れ凪の表と根拠の留保')
    m.numeric('initial-all','初当たり合算',rates([328,326.4,303.9,291,271.5],ss),'通常時のゲーム数と初当たりボーナスを数えます。上位ST直撃を含み、ST中のボーナスとピコ引き戻しを除きます。',['review','audit'],group='initial-path',old=['M05C01'])
    m.numeric('normal-st','通常ST初当たり',rates([328.6,326.9,304.4,291.5,271.9],ss),'通常時のゲーム数と通常STの初当たりを数えます。上位ST直撃を除いた公表値です。初当たり合算とは同時加算しません。',['review'],group='initial-path')
    m.numeric('cycle-success','周期当選率',perc([27.5,27.7,30.1,31.7,34.4],ss),'通常時に実際に到達した周期回数と当選回数を記録します。ST初当たりと同じ当選経路として同時に独立加算しません。',['review'],group='initial-path',ob='conditional_probability',trial='BANDORI_CYCLE_TRIAL',old=['M05C02'])
    m.block('pico-average','ピコアタック平均当選率','公表平均値は成立役と駆け抜け状況の異なる抽選を合わせた値です。通常終了・駆け抜け・リンク役・レア役を混ぜた回数へ単一の当選率を割り当てず、条件別の不足を保持します。',['review','audit','pico'],perc([7.7,8.1,13,14.6,14.9],ss),old=['M05C03'])
    m.block('pico-runthrough','駆け抜け時のピコ当選','ベル・リプレイ・その他の設定3以降は「以上」という下限だけで、正確な当選確率ではありません。リンク役50.7%やレア役100%を混ぜて補完しません。',['audit'],{'settings':[2,3,4,5,6],'nonRare':[{'exactPercent':9.3},{'lowerBoundPercent':10},{'lowerBoundPercent':12.5},{'lowerBoundPercent':15},{'lowerBoundPercent':20}],'linkRolePercent':50.7,'rarePercent':100})
    m.block('infinite-stock','ボーナス中無限STストック','1/698.3～1/392.3の平均出現値はありますが、ストック済みでは抽選されず、クライマックスライブ消化回数でも内容が変わります。全ボーナスゲームを同じ抽選回数として使わず、対象条件に合う設定別表の不足を保持します。',['audit','stock'],rates([698.3,609.4,549,441.8,392.3],ss),old=['M05C04'])
    m.block('black-disk','5枚目以降の黒ディスク','設定2の約20%のみで、設定3～6の出現率が未公表です。5枚目以降という対象条件も保持し、推測値を埋めません。',['review'],{'setting2ApproxPercent':20,'settings3to6':None})
    m.block('upper-loop','上位ST高継続率の選択','84%・93%の内部継続モードは確認できますが、設定別の93%選択割合がありません。継続実績や別記事の94%表記で選択割合を補いません。',['review','audit'],{'internalLoopPct':[84,93],'settingSpecificSelection':None})
    m.evidence('payout','獲得枚数表示',[exact('456枚OVER','設定4以上'),exact('666枚OVER','設定6')],'ボーナスパート中の特定獲得枚数表示だけを記録します。',['review','audit'],old=['M05C05'])
    m.evidence('end-stamp','ST終了画面',[display('香澄','通常パターン'),unknown('写真リスト','チャンス示唆（弱）'),unknown('バンドリーダー（ミニキャラ）','チャンス示唆（強）'),exact('スタンプ・良','設定4以上'),exact('スタンプ・優','設定5以上'),exact('スタンプ・極','設定6')],'ST終了時の画面・スタンプを記録します。写真のチャンスを確定条件や数値確率へ格上げしません。',['review','audit'],old=['M05C05'])
    m.evidence('nagi','隠れ凪',[unknown(c,'掲載上は設定'+str(k)+'以上示唆。機種固有の確定根拠を未確認。') for c,k in [('青・一味違いますね',2),('緑・何やら不思議な気配です',3),('赤・良い予感がします',4),('銀・遊び尽くしちゃいましょう',5),('金・お肉',6)]],'打-WIN LITE開始後のQR読取で1000Gごとに出るセリフを記録します。出典が他の平和機種を参考にした推定と明記しているため、今回の調査では設定否定の制約へ使いません。',['nagi','audit'],old=['M05C05'])
    m.nodiff('roles','小役出現率','通常小役は全設定共通。バンドリンク役は状態ごとの確率であり、設定ごとの差ではありません。',['roles'],{'replay':'1/7.3','commonBell':'1/28.1','weakCherry':'1/256','watermelon':'1/256','weakChance':'1/66.6','strongCherry':'1/799.2','strongChance':'1/799.2'})
    m.block('mode-carry','周期モード・持越し・リセット','モードB以上・駆け抜け後C以上・上位CZ失敗後天国やスター持越しは状態の恩恵です。設定別の完全なモード移行表を確認できません。',['reset'])
    m.notes=['初当たり合算328.0と通常ST328.6を区別。周期期待度と同じ当選系列として保持。設定1・Lを通常推測から除外。','通常小役は設定共通。リンク役の状態差を設定差としない。','ピコ平均と駆け抜け下限値、ストック済み無抽選・ライブ回数依存、黒ディスク欠測、上位ループ選択率欠測を個別保持。','枚数・STスタンプ・隠れ凪を独立の観測場面へ分割。隠れ凪の他機種参考という根拠留保を保持。','打-WIN1000G単位のセリフを記録のみへ。未公表率・下限に架空の点確率を与えない。','LバンドリS11の2024年11月機。周期短縮、スター持越し、上位CZ失敗後条件を分ける。']
    m.audit=['初当たり合算をST単体と誤同定したM05C01を訂正し、通常ST表を追加。','無限STはストック済み無抽選、ピコ駆け抜けは下限値という条件を発見。黒ディスクと上位ST選択を追加。','隠れ凪の機種固有確定根拠未確認を明記。他機種参考表をそのまま確定制約にしない。外部監査未実施。'];m.save()
def machine6():
    m=Machine(6);m.queries=['Reゼロ season2 設定差 スマスロ なな徹 時計','リゼロ season2 AT終了画面 出現率 設定別','Reゼロ season2 チキチキ雪合戦 直撃 設定差 解析']
    m.source('review','https://nana-press.com/kaiseki/machine/819/24858/','season2設定差');m.source('audit','https://1geki.jp/slot/l_rezero_season2/0/','先決めポイントと32G引き戻し');m.source('clock','https://nana-press.com/kaiseki/machine/819/24879/','時計の時刻');m.source('reset','https://nana-press.com/kaiseki/machine/819/24862/','ランダム内部加算と天井短縮');m.source('spec','https://www.p-world.co.jp/machine/database/10121','小役・ポイント特化・上位AT');m.source('trial','https://1geki.jp/slot/l_rezero_season2/70/','実戦データと考察の区別')
    m.numeric('at-initial','殲滅ラッシュ初当たり',rates([417.2,408.5,387.1,354.3,332.9,305.4]),'通常時のゲーム数と新たな殲滅ラッシュ初当たりを記録。死に戻り32G間とAT中の継続を分離し、引き戻し当選を初当たりへ加算しません。',['review','audit'],group='rezero-normal-return',kind='CONDITIONALLY_SEPARATE',old=['M06C01'])
    m.findings[-1]['dependencyReason']='通常時の新規当選と、AT終了後32Gの引き戻しを条件ごとに独立した別母数へ分けます。同一当選は片方にだけ入り、通常ゲームへ32G区間を重ねません。'
    m.numeric('death-return','死に戻り当選率',perc([10.2,10.4,13.9,16,18,20]),'通常AT終了後32Gの対象区間を1試行とします。32G以内の死に戻りを成功、最後まで非当選を失敗とし、途中でやめた未確定区間や上位AT専用の強欲ゾーンを母数へ入れません。',['review','audit'],group='rezero-normal-return',kind='CONDITIONALLY_SEPARATE',ob='conditional_probability',trial='REZERO_COMPLETE_RETURN_WINDOW_TRIAL',old=['M06C02'])
    m.findings[-1]['dependencyReason']='通常時の新規当選と、AT終了後32Gの引き戻しを条件ごとに独立した別母数へ分けます。同一当選は片方にだけ入り、通常ゲームへ32G区間を重ねません。'
    for cid,label,vals in [('zone-odd','奇数ポイントゾーン',[1.2,1.6,2,2.3,2.7,3.1]),('zone-even','偶数ポイントゾーン',[25,25.4,25.8,28.5,29.7,31.3])]:m.block(cid,label,'100ptごとの規定ポイント抽選は通常開始時に先決めされます。設定変更時の内部加算、ポイント飛越し、雪合戦からの別当選を含むため、前兆発生数をそのまま抽選回数として使えません。適用範囲に合う選択ポイントを確認できない試行を推測入力しません。',['review','audit','reset'],perc(vals),old=['M06C02'])
    m.evidence('clock','菜月家の時計',[exact('3時過ぎ','設定3以上'),exact('4時56分','設定4以上'),exact('5時6分','設定5以上'),exact('6時6分','設定6')],'菜月家ステージの時計演出で表示された時刻だけを記録します。設定5以上は5時6分で、5時56分ではありません。',['clock','audit'],old=['M06C03'])
    m.evidence('at-screen','通常AT終了画面',[display('聖域','通常パターン'),unknown('温泉・昼（男性）','高設定示唆'),exact('温泉・昼（女性）','設定2以上'),exact('ウサギコスプレ（レム・ラム）','設定4以上'),exact('お茶会','設定5以上'),exact('温泉・夜（女性）','設定6'),display('叡智の書','復活期待度アップ'),display('ベアトリス顔アップ','復活濃厚')],'通常AT終了時の画面を記録。上位AT専用画面は別で、復活示唆を設定確定とは扱いません。',['review','audit'],old=['M06C03'])
    m.block('screen-frequency','AT終了画面の出現割合','実戦集計の割合はありますが、試行数が小さく、消化ゲーム数等の条件で出現率が変わる可能性も指摘されています。公表された設定別の抽選確率として補完しません。',['trial'])
    m.nodiff('roles','通常時の小役','弱チェリー・強チェリー・スイカ・チャンス目は全設定共通値です。',['spec'],{'weakCherry':'1/100.1','strongCherry':'1/819.2','watermelon':'1/80','chance':'1/256'})
    m.block('snow-entry','チキチキ雪合戦当選・継続','高確やレア役で突入・継続が変わりますが、設定別の完全な当選・継続表は確認できません。少数の実戦や考察を設定別率にしません。',['spec','trial'])
    m.block('direct-upper','直撃・エキドナ・上位AT','通常開始からのAT、雪合戦成功、上位直撃、フリーズを区別する必要があります。設定別の直接観測可能な完全表が不足しています。',['spec'])
    m.block('reset-scope','リセット後の天井・内部加算','400・600・800・1000ptへの天井短縮と内部ランダム加算は確認できますが、設定ごとの選択率・加算率が揃っていません。',['reset'])
    m.notes=['殲滅ラッシュ初当たりと32G死に戻りを分離し、上位AT専用強欲ゾーンを対象外にする。','通常4役は全設定共通。役からのポイント特化と役成立率を区別。','規定ポイントは先決め。見た前兆数で置換せず、初回内部加算や雪合戦の競合経路を保持。32Gの確定区間単位で当選を入力。','時計と通常AT画面を展開。5時6分を訂正。叡智・ベアトリスは復活であり設定確定ではない。','設定別の実戦集計を公表確率と分けて保存。出現率不明の画面に重みを付けない。','2024年L Re:ゼロ season2 PA5。初代の白鯨・コンビニ等を混入しない。初回ポイント加算と上位AT条件を確認。']
    m.audit=['5:56を5:06へ訂正。32Gトータル死に戻り10.2～20%は毎ゲーム率ではないと照合。','先決めゾーン率と実戦42573Gの集計値を分離。公式Xリンクは読取不能で、原ポスト独立確認とは記載しない。','通常ATと上位ATの画面・引き戻し条件を分離。外部監査未実施。'];m.save()
def machine7():
    m=Machine(7);m.queries=['マイフラワー2 30 設定差 チェリー リーチ目 フラッシュ','マイフラワー2 チェリー REG 比率 通常時 チャンスゾーン 同時当選','マイフラワー2 押し順ベル 共通ベル 通常 打ち方']
    m.source('review','https://1geki.jp/slot/s_myflower2_30/0/','マイフラワー2設定差と同時当選');m.source('audit','https://data.hazuse.com/?genre=208&machine_code=2S1504','マイフラワー2・型式と設定差');m.source('mechanics','https://chonborista.com/slot/kitadenshi/185402/','マイフラワー2通常時・打ち方・32G区間')
    init=[210,200,190,180,170,160];cherry=[64,62.5,61.1,59.8,58.5,57.3];water=[102.4,101.1,99.9,98.7,97.5,96.4];reach=[1191.6,1149.8,1040.3,1008.2,873.8,840.2];hit=[3,3.2,3.4,3.6,3.8,4];reg=[50,52.4,56.5,58.3,60,63]
    scope='ボーナス中・ボーナス終了後32Gの連チャン区間・1G連を除く通常時だけが対象です。総ゲーム数から除外ゲーム数を引いた値を母数として使います。'
    m.numeric('bonus-initial','ボーナス初当たり',rates(init),scope+'通常時からの新しい当選だけを数えます。',['review','audit'],group='flower-path',trial='NON_CHAIN_BONUS_INITIAL_GAME_TRIAL',old=['M07C01'])
    for cid,label,vals,old in [('cherry','チェリー',cherry,'M07C02'),('watermelon','スイカ',water,'M07C03'),('reach-role','リーチ目役',reach,'M07C05')]:m.numeric(cid,label,rates(vals),scope+'対象役成立を数え、取りこぼしや疑似遊技の見かけの停止形は含めません。',['review','audit'],group='flower-path',trial='NON_CHAIN_BONUS_INITIAL_GAME_TRIAL',old=[old])
    m.numeric('cherry-hit','チェリー同時当選率',perc(hit),scope+'通常時チェリー成立回数を母数とし、そのチェリーに対応するボーナス当選を数えます。',['review','mechanics'],group='flower-path',ob='conditional_probability',trial='FLOWER_NORMAL_CHERRY_TRIAL',old=['M07C06'])
    m.numeric('cherry-reg','チェリー当選時REG比率',perc(reg),scope+'チェリー契機と特定できたボーナスを母数とし、REG回数を数えます。全REG回数は使用しません。',['review'],group='flower-path',ob='conditional_probability',trial='FLOWER_CHERRY_BONUS_TRIAL',old=['M07C06'])
    labels=['チェリー・非当選','チェリー＋BIG','チェリー＋REG','チェリー以外のボーナス','その他']
    joint={}
    for i,k in enumerate(m.settings):
        pc=1/cherry[i];pb=1/init[i];ph=hit[i]/100;pr=reg[i]/100
        ps=[pc*(1-ph),pc*ph*(1-pr),pc*ph*pr,pb-pc*ph,1-pc-pb+pc*ph]
        if min(ps)<0 or abs(sum(ps)-1)>1e-12:raise ValueError('FLOWER_JOINT_MASS')
        joint[str(k)]='/'.join(label+':'+format(p*100,'.12g')+'%' for label,p in zip(labels,ps))
    m.numeric('cherry-bonus-joint','通常時の当選とチェリー',joint,scope+'各通常ゲームは5区分のいずれか1つだけです。チェリー成立、チェリー契機のBIG・REG、チェリー以外の当選を重複せず記録します。',['review','audit','mechanics'],group='flower-path',ob='appearance_distribution',trial='FLOWER_NORMAL_GAME_JOINT_TRIAL')
    f=m.findings[-1];f['categoryModel']={'residualPolicy':'SOURCE_EXHAUSTIVE'};f['sourceDerivation']=dict(type='COMPLETE_PUBLIC_MARGINAL_AND_CONDITIONAL_FACTORIZATION',sourceIds=['review','audit'],expressions=['P(C,noB)=P(C)*(1-P(B|C))','P(C,BIG)=P(C)*P(B|C)*(1-P(REG|C,B))','P(C,REG)=P(C)*P(B|C)*P(REG|C,B)','P(nonC,B)=P(B)-P(C)*P(B|C)','P(other)=1-P(C)-P(B)+P(C)*P(B|C)'],assumedRates=[],publishedDenominatorEquivalence='NOT_ASSERTED',scope='通常時の小役と通常初当たり、チェリー同時当選を使用。32G連チャンの当選表とは混合しない。')
    order=['cherry-bonus-joint','bonus-initial','cherry','watermelon','reach-role','cherry-hit','cherry-reg']
    for f in m.findings:
        if f.get('settingDistribution') is not None:
            f['dependencyFallbackRank']=order.index(f['findingId'])+1
            f['dependencyReason']='通常時のチェリーとボーナスは包含関係を持ちます。完全な5区分の入力があればそれだけを使用し、未入力時だけ他の観測へ優先順で切り替えます。複数の経路を同時に加算しません。'
    m.block('bell-total','ベル合算','押し順ベルと共通ベルの成立合算です。通常の左1stでは押し順不正解の成立を入賞回数から全部数えられず、払い出し回数で公表成立率を代用できません。',['review','audit','mechanics'],rates([9,9,9,8.8,8.7,8.6]),old=['M07C04'])
    m.evidence('panel','終了時パネルフラッシュ',[exact('上だけ','設定2以上'),exact('下だけ','設定3以上'),exact('上下両方','設定5以上')],'ボーナス終了時の筐体パネルのフラッシュが対象です。旧作の設定4以上等を混ぜません。',['review','audit','mechanics'],old=['M07C07'])
    m.evidence('big-line','BIG入賞ライン',[display('中段・右下がり','基本パターン'),unknown('右上がり','偶数設定で出現しやすい')],'BIG入賞時のラインを記録します。右上がりは偶数示唆で、奇数設定を否定しません。',['review','audit'],old=['M07C07'])
    m.block('water-hit','スイカ同時当選','スイカからの当選経路は確認できますが、設定別に完全な抽選確率を今回確認していません。チェリーの当選率を流用しません。',['mechanics'])
    m.block('scenario','ボーナスシナリオ・32G連チャン','シナリオ別の連チャンや1G連抽選は通常初当たりとは別です。設定別の完全なシナリオ選択率を確認できず、通常時の当選率を連チャン区間へ適用しません。',['mechanics'])
    m.nodiff('reset-ceiling','リセット後の救済短縮','約70%の300G短縮はリセットの恩恵として掲載され、設定ごとの選択率ではありません。',['review','mechanics'],{'resetShortenApproxPct':70,'shortG':300,'normalG':1280})
    m.notes=['初当たりとチェリー出現→同時当選→BIG/REGを全て保持。完全な5区分へ公表値から因子分解し、他候補は同時使用せず入力不足時の代替にする。','ベルは押し順＋共通の成立合算で観測困難。チェリー・スイカ・リーチ目を別の公表役として保存。','通常時と32G連チャン、1G連、ボーナス中の抽選を分離。チェリー条件付き率とBR率の母数を別にする。','上下パネル2/3/5以上とBIG右上がり偶数示唆を照合。旧作のパネル4以上を排除。','HAZUSEの約BR割合と一撃の小数BR表を併記。公表値の丸めを保持し、未掲載値や設定Lを作らない。','SマイフラワーⅡEE-30・2023年機。旧作マイフラワー30のリーチ目1/5461等を排除。左1st、32G後の有利区間リセット、救済短縮を確認。']
    m.audit=['旧作混同を型式2S1504と現行全設定表で検証。チェリーBRは50/52.4/56.5/58.3/60/63を使用し約値は履歴へ。','既存6要素を消去せず、チェリーとボーナスの完全な同時区分を追加。単純な独立尤度の掛け算を禁止。','ベル成立合算を入賞回数と誤解しない。5区分の残差は確認された完全率の代数差であり架空の未公表率補完ではない。外部監査未実施。'];m.save()
def machine8():
    ss=(1,2,4,5,6);m=Machine(8,ss);m.queries=['課長 熊田工作 設定判別 小役 ボイス 終了画面','課長 熊田工作 ボーナス初当り 249 BIG 181.0 通常ゲーム 合算','課長 熊田工作 小役確率 チェリー 擬似遊技 設定差']
    m.source('review','https://nana-press.com/kaiseki/machine/541/14981/','熊田設定差・示唆');m.source('audit','https://1geki.jp/slot/s_kacho_kumakou/0/','初当たりとデータカウンター率');m.source('precision','https://hazuse.com/machine/pachislot/SX0046/genre/208/','熊田型式・小数率・示唆');m.source('voice','https://nana-press.com/kaiseki/machine/541/15959/','発生時点別ボイス');m.source('end','https://nana-press.com/kaiseki/machine/541/15958/','BIG終了画面とループ');m.source('spec','https://www.p-world.co.jp/machine/database/9805','熊田機種仕様と疑似遊技')
    m.numeric('bonus-initial','通常時ボーナス初当たり',rates([248.9,240.8,217.1,201.1,194.2],ss),'32Gの会議室中当選・ボーナス中1G連を除く通常時初当たりを数えます。初当たり対象ゲームを別に記録し、BIG/REGの全出現率と母数を混ぜません。',['audit','review'],group='kumada-observation',trial='NON_CHAIN_BONUS_INITIAL_GAME_TRIAL',old=['M08C01'])
    bb=[181,172.3,157.9,144,138.2];rb=[330.7,326.1,299,288.5,278.3]
    scope='同じ期間のデータカウンターがBB・RB確率の計算に使用するゲーム数を母数とします。会議室中当選や1G連を含む全出現回数を数え、通常時初当たりだけの回数へこの率を使いません。'
    for cid,label,vals in [('big','BIG出現率',bb),('reg','REG出現率',rb),('bonus-all','ボーナス合算',[117,112.8,103.3,96,92.3])]:m.numeric(cid,label,rates(vals,ss),scope,['audit','precision'],group='kumada-observation',trial='KUMADA_DATA_COUNTER_GAME_TRIAL',old=['M08C02'])
    joint={str(k):'BIG:'+format(100/bb[i],'.12g')+'%/REG:'+format(100/rb[i],'.12g')+'%/非当選:'+format(100-100/bb[i]-100/rb[i],'.12g')+'%' for i,k in enumerate(ss)}
    m.numeric('big-reg-joint','BIG・REGの内訳',joint,scope+'1ゲームの結果はBIG・REG・非当選の3区分のいずれかで、同じ当選を合算へ重ねて加算しません。',['audit','precision'],group='kumada-observation',ob='appearance_distribution',trial='KUMADA_DATA_COUNTER_GAME_TRIAL',old=['M08C02'])
    m.findings[-1]['categoryModel']={'residualPolicy':'SOURCE_EXHAUSTIVE'};m.findings[-1]['sourceDerivation']={'type':'PUBLIC_EXCLUSIVE_BB_RB_AND_EXPLICIT_COMPLEMENT','expression':'[1/BBdenominator,1/REGdenominator,1-1/BBdenominator-1/REGdenominator]','settings':[1,2,4,5,6],'assumedRates':[]}
    order=['big-reg-joint','bonus-initial','big','reg','bonus-all']
    for f in m.findings:
        if 'settingDistribution'in f:f['dependencyFallbackRank']=order.index(f['findingId'])+1;f['dependencyReason']='BIG・REGは同じ試行の排他内訳で、合算は同じ当選をまとめた値です。内訳を使う場合は合算を使わず、通常初当たりとも同時加算しません。入力が揃った1経路だけを使用します。'
    m.evidence('payout','獲得枚数表示',[exact(str(n)+'枚OVER','設定'+str(k)+'以上' if k<6 else '設定6') for n,k in [(333,6),(444,4),(456,4),(555,5),(666,6),(777,6),(3456,4)]]+[unknown('539枚OVER','高設定・高継続示唆'),unknown('ありがとねっと（赤）','高設定示唆'),exact('ありがとねっと（金）','設定4以上')],'ボーナス中の表示を記録。333は設定3以上ではなく、この機種では設定6のパターンです。',['review','audit','precision'],old=['M08C03'])
    m.evidence('entry-voice','告知・入賞ボイス',[unknown('第1停止後PUSH・OL','高設定示唆・昇進モード滞在'),unknown('第1停止後PUSH・しげる松崎','高設定示唆・高継続'),unknown('7テンパイ・しげる松崎','高設定・高継続示唆')],'発生時点を分けて記録します。高継続の示唆や昇進モード確定を、設定の確定と読み替えません。',['voice','audit'],old=['M08C03'])
    m.evidence('bonus-end','BIG終了画面',[display('オフィス・道場','通常パターン'),display('夕焼け・紅葉OL','ボーナスループ期待'),display('熊田＋熊女将','ボーナスループ確定'),unknown('社長（小熊）','高設定示唆・ボーナスループ'),exact('熊田＋ハワイ','設定4以上')],'BIG終了時の画面を記録。ハワイは設定4以上で、他のループ確定画面は設定確定ではありません。',['review','end','precision'],old=['M08C03'])
    m.nodiff('continuation-voice','昇進・終了後ボイス','昇進ジャッジの「昇進」は32G以内BIG、終了後の「ボーナス」は1G連という当選状態の確定です。設定確定として扱いません。',['voice'],{'promotion':'BIG_WITHIN_32G','postBonus':'ONE_GAME_CHAIN'})
    m.nodiff('roles','通常小役成立率','共通掲載の小役率に設定差は確認されていません。チェリーの疑似遊技は本前兆・連続状態で出方が変わる別事象です。',['spec'],None)
    m.block('pseudo-cherry','疑似チェリー・連続出現','疑似遊技のチェリーは前兆や状態によって出現率が変わります。設定別の完全な対象状態・当選表が揃わず、小役成立率として扱えません。',['spec'])
    m.block('mode-reset','会議室・昇進モード移行','ボーナス連チャンと通常初当たりに影響する内部モードが存在しますが、移行元・移行先の確定観測と設定別表を今回確認できません。',['spec','voice'])
    m.notes=['通常初当たりの小数率と全BB/RB率を分けて確認。設定3・Lを通常推測から除外。','通常小役成立と疑似チェリーを分離。疑似遊技の見かけの停止を成立役カウンターへ加算しない。','通常初当たり・会議室32G・1G連の母数を分離。全BB/RBは1ゲームの排他内訳で合算を独立加算しない。','333枚=設定6、ハワイ4以上、告知PUSHとテンパイのボイスを具体イベントへ展開。','昇進と終了後の松崎ボイスは当選・継続の確定で、設定確定ではない。','S課長熊田工作GZAの2023年メダル機。熊酒場の別作を除外。小数248.9と丸め249を履歴で保持。']
    m.audit=['一撃・HAZUSEのデータカウンター用BB/RB/合算を照合。合算と各内訳の二重計測を除き、3区分を追加。','通常初当たりは248.9/240.8/217.1/201.1/194.2へ精度保持。合算の117等と同じ母数へ入れない。','333=設定6、状態確定ボイスの誤用防止を追加。外部監査未実施。'];m.save()
def machine9():
    ss=(1,2,4,5,6);m=Machine(9,ss);m.queries=['真天下布武 設定判別 秀吉モード 小役 終了画面','真天下布武 トロフィー 非出現 終了画面 出現率 エンディング ランプ','真天下布武 S真天下布武DD 小役確率 全設定共通 公式 モード移行']
    m.source('review','https://nana-press.com/kaiseki/machine/532/15159/','真天下布武設定抽選');m.source('audit','https://1geki.jp/slot/s_shin_tenkafubu/0/','完全終了分布・役別ランプ');m.source('official','https://www1.yamasa.co.jp/toranomaki/tr_stnkfv/atend.html','山佐AT終了とモードボイス');m.source('spec','https://www1.yamasa.co.jp/toranomaki/tr_stnkfv/kihon.html','山佐基本仕様');m.source('map','https://www1.yamasa.co.jp/toranomaki/tr_stnkfv/tnkmp.html','山佐天下マップ');m.source('mode','https://nana-press.com/kaiseki/machine/532/15166/','モード適用条件')
    for cid,label,vals,old in [('cz-entry','出陣チャレンジ初当たり',[116.7,110.3,97.7,86,75.9],'M09C01'),('at-initial','覚醒初当たり',[374.5,337.9,267.7,206.2,166.9],'M09C02'),('at-direct','AT直撃',[21845.3,10922.7,5461.3,3276.8,2048],'M09C03')]:m.numeric(cid,label,rates(vals,ss),'通常時のゲーム数と該当する新たな当選を数えます。CZ成功・持越しや直撃は同じAT経路を含むため、各初当たりを同時に独立加算しません。',['review','audit'],group='tenka-entry-path',old=[old])
    m.block('reset-hideyoshi','リセット時秀吉モード','有利区間リセット時の秀吉選択割合は公表されていますが、リセットの発生と移行後の内部モードを毎回確定できません。前回履歴や示唆を、今回移行の確定結果へ置き換えません。',['review','audit','mode'],perc([14.5,17.6,25,31.3,37.5],ss),old=['M09C03'])
    m.block('map-transition','天下マップ・モード移行','前回モード、AT当選ゲーム数、信長CZクリアなどの履歴を使う仕組みです。着席前を含む条件を確定できない試行へ単一の移行確率を適用しません。',['map','mode'],{'requiredTerms':['previousMode','ATWinningGames','NobunagaCZClear'],'sourceTableURL':'https://www1.yamasa.co.jp/toranomaki/tr_stnkfv/tnkmp.html'})
    m.numeric('ikkikake','一騎駆け出陣武将',{str(k):'信長:'+str(40 if k<4 else 30)+'%/秀吉:'+str(35 if k<4 else 30)+'%/家康:'+str(25 if k<4 else 40)+'%' for k in ss},'天下バトルで殲滅できず一騎駆けへ進んだ機会を母数とし、出陣する武将を1人だけ記録します。通常CZの選択武将とは別です。',['review','audit'],ob='appearance_distribution',trial='TENKA_IKKIKAKE_TRIAL')
    m.findings[-1]['categoryModel']={'residualPolicy':'SOURCE_EXHAUSTIVE'}
    labels=['通常・トロフィーなし','銅トロフィー','金トロフィー','ケロット柄トロフィー','虹トロフィー','兜＆武具']
    rows=[[80,0,0,0,0,20],[70,10,0,0,0,20],[63,4,3,0,0,30],[60,4,3,3,0,30],[60,4,2,2,2,30]]
    dist={str(k):'/'.join(c+':'+str(p)+'%' for c,p in zip(labels,row)) for k,row in zip(ss,rows)}
    m.numeric('end-outcome','AT終了画面・トロフィー',dist,'AT終了ごとに6区分から1つだけ記録します。通常画面のトロフィー有無と兜＆武具を同じ全終了回数の中で数え、画面とトロフィーを別々の独立確率へしません。',['review','audit'],ob='appearance_distribution',trial='TENKA_AT_END_TRIAL',old=['M09C04'])
    f=m.findings[-1];f['categoryModel']={'residualPolicy':'SOURCE_EXHAUSTIVE'};f['mirrorsEvidenceFindingId']='end-constraints';f['categoricalEvidenceReconciliation']=dict(type='SINGLE_CANONICAL_CATEGORY_INPUT',evidenceFindingId='end-constraints',runtimeLinkContract='EXPLICIT_CATEGORY_LINK_V1')
    cats=[display(labels[0],'通常パターン'),exact(labels[1],'設定2以上'),exact(labels[2],'設定4以上'),exact(labels[3],'設定5以上'),exact(labels[4],'設定6'),unknown(labels[5],'高設定示唆')]
    for c in cats:c['linkedFindingId']='end-outcome'
    m.evidence('end-constraints','終了画面の確定条件',cats,'終了画面の同じ6区分入力を確定制約と出現率で共有します。設定3非搭載なので銀トロフィーは作りません。',['review','audit'],old=['M09C04'])
    colors=['青','黄','緑','赤','紫']
    for cid,title,table,purple in [('ending-weak','ED弱レア役ランプ',[[35,30,35,0,0],[15,30,40,15,0],[10,25,50,15,0],[25,15,50,10,0],[10,25,50,10,5]],'設定6'),('ending-chance','EDチャンス目ランプ',[[35,30,35,0,0],[5,20,40,35,0],[2.5,7.5,50,30,10],[7.5,2.5,50,20,20],[2.5,7.5,50,20,20]],'設定4以上')]:
        dist={str(k):'/'.join(c+':'+str(v)+'%' for c,v in zip(colors,row)) for k,row in zip(ss,table)}
        m.numeric(cid,title,dist,'エンディング中の該当する成立役でPUSHした結果を1つ記録します。弱レア役とチャンス目で別の母数を使い、通常時のランプやモード示唆と混ぜません。',['review','audit'],group='ending-role-conditions',kind='CONDITIONALLY_SEPARATE',ob='appearance_distribution',trial=cid.upper().replace('-','_')+'_TRIAL')
        f=m.findings[-1];f['dependencyReason']='成立役の種類によって条件ごとに独立した別母数へ分けます。1回の成立役は片方にだけ入り、同じランプ結果を重ねません。';f['categoryModel']={'residualPolicy':'SOURCE_EXHAUSTIVE'};f['mirrorsEvidenceFindingId']=cid+'-constraints';f['categoricalEvidenceReconciliation']=dict(type='SINGLE_CANONICAL_CATEGORY_INPUT',evidenceFindingId=cid+'-constraints',runtimeLinkContract='EXPLICIT_CATEGORY_LINK_V1')
        cats=[unknown(c,'設定別出現率あり') for c in colors[:3]]+[exact('赤','設定2以上'),exact('紫',purple)]
        for c in cats:c['linkedFindingId']=cid
        m.evidence(cid+'-constraints',title+'の制約',cats,'同じ色入力を出現率と設定候補の絞り込みで共有します。紫は弱レア役なら設定6、チャンス目なら設定4以上です。',['review','audit'])
    m.nodiff('role-rates','レア小役出現率','メーカーのレア役確率は全設定共通です。CZやAT抽選の設定差と成立役率を混同しません。',['spec'])
    m.evidence('mode-voice','終了PUSHボイス',[display('奥方A','通常パターン'),display('奥方B','リセットまたは秀吉・家康の可能性'),display('忍者','リセットまたはSPモード'),display('3武将','有利区間引継ぎ・SPモード期待'),display('お雪','SPモード濃厚')],'メーカーがモード示唆として解説するボイスを状態の記録として保持。設定確定へ読み替えません。',['official'])
    m.nodiff('winning-rate','7000G実戦勝率','公表された勝率は出玉結果の集計で、個々の実戦入力イベントの抽選率ではありません。設定推測尤度へ入れません。',['review'],{'settings':[1,2,4,5,6],'winPct':[40.2,44.7,60.6,80.3,92.8]})
    m.notes=['CZ・AT・直撃を全て保持し同じ経路の二重計測を防ぐ。設定3とLは通常推測から除外。','メーカーがレア役全設定共通と明示。役成立と役からのCZ/ATを区別。','リセット秀吉率・天下マップ履歴条件を保持。一騎駆けの3武将は実際の同じ試行の排他分布。','AT全終了の画面とトロフィーを6区分へ統合。EDの弱レアとチャンス目ランプは別条件の5区分。確定制約は同じ入力へ明示連結。','メーカーPUSHボイスはモード示唆。7000G勝率を設定尤度としない。紫ランプの役条件で4以上と6を分ける。','S真天下布武DD・2023年6月のメダル機。スマスロと書く別媒体の誤表記を除外し、メーカー虎の巻で同定。']
    m.audit=['メーカー虎の巻と一撃・なな徹で機種を照合。旧M09C04を完全数値6区分とED役別分布へ展開。','終了画面率をトロフィー非出現時だけへ誤適用せず、トロフィー込み全終了分布を採用候補として保存。','AT確率・CZ・直撃の経路、一騎駆けとEDの観測場面、制約入力共有を設計。外部監査未実施。'];m.save()
if __name__=='__main__':
    for n in map(int,sys.argv[1:] or ['1']):globals()['machine'+str(n)]()
