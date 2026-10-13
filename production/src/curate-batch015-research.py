"""Source-reviewed Batch015 facts; no scoring or adoption decisions here."""
import json, pathlib, sys, hashlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
BATCH='batch-20261013-015'
OUT=ROOT/'batches'/BATCH
DOMAINS=['INITIAL_HIT','BONUS','SMALL_ROLE','CZ','AT','INTERNAL_CONDITIONAL_DRAW','MODE_TRANSITION','STATE_TRANSITION','SUCCESS_RATE','POINTS_GAME_DISTRIBUTION','CARRY_OVER','THRESHOLD_BEHAVIOR','RESET_BEHAVIOR','POST_EVENT_TRANSITION','NAVIGATION','ROLE_CONDITIONAL_DISTRIBUTION','BONUS_TYPE_CONDITIONAL','EVIDENCE','EXTERNAL_DATA_ONLY','MACHINE_SPECIFIC']
SELECTION=json.loads((ROOT/'batches/batch-20261013-014/next-ten-selected-20261013.json').read_text())['machines']
IDS=[x['machineId'] for x in SELECTION]
NAMES=[x['displayName'] for x in SELECTION]
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
        # Source-owned short labels; scope and exclusions remain in the explanation.
        named={'bonus-initial':('通常ゲーム数','ボーナス回数'),'at-initial':('通常ゲーム数','AT回数'),'gg-initial':('通常ゲーム数','GG回数'),'initial-all':('通常ゲーム数','初当たり回数'),'normal-st':('通常ゲーム数','ST回数'),'cz-entry':('通常ゲーム数','CZ回数'),'at-direct':('通常ゲーム数','直撃回数'),'rise-zone-entry':('通常ゲーム数','ライズゾーン回数'),'hyakuryu-entry':('通常ゲーム数','百竜夜行回数'),'cerberus-screen':('ケルベロス終了回数','特殊画面回数'),'persephone-screen':('ペルセポネ終了回数','特殊画面回数'),'hades-screen':('ハーデス終了回数','特殊画面回数'),'weak-direct':('非前兆中の弱レア役回数','AT直撃回数'),'strong-direct':('非前兆中の強レア役回数','AT直撃回数'),'hyakuryu-fake':('クエストフェイク回数','百竜夜行突入回数'),'cycle-success':('周期到達回数','当選回数'),'death-return':('対象AT終了回数','死に戻り回数'),'cherry-hit':('通常時チェリー回数','チェリー当選回数'),'cherry-reg':('チェリー当選回数','REG回数'),'cherry-bonus-joint':('連チャン中を除くゲーム数','各区分の回数'),'big':('データカウンターゲーム数','BIG回数'),'reg':('データカウンターゲーム数','REG回数'),'bonus-all':('データカウンターゲーム数','ボーナス回数'),'big-reg-joint':('データカウンターゲーム数','各内訳の回数'),'ikkikake':('一騎駆け回数','出陣武将回数'),'end-outcome':('AT終了回数','各画面の回数'),'ending-weak':('ED中弱レア役回数','各色の回数'),'ending-chance':('ED中チャンス目回数','各色の回数')}
        defaultTrial='連チャン中を除くゲーム数' if trial=='NON_CHAIN_BONUS_INITIAL_GAME_TRIAL' else '通常ゲーム数'
        defaultSuccess=label.replace('出現率','出現').replace('当選率','当選').replace('比率','')+'回数'
        tl,sl=named.get(cid,(defaultTrial,defaultSuccess))
        if cid=='bonus-initial' and trial=='NON_CHAIN_BONUS_INITIAL_GAME_TRIAL':tl=defaultTrial
        f['inputPresentation']=dict(trialLabel=tl,successLabel=sl)
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
        self.block(cid,label,reason,src,raw)
        self.blocks[-1]['researchSurveyResult']='NO_CONFIRMED_SETTING_DIFFERENCE'
        self.blocks[-1]['reevaluationCondition']='この機種の設定別の差を確認できる新しい具体的な公開資料が得られた場合に再確認します。'
        self.models[-1]['likelihood']='DISABLED_NO_CONFIRMED_SETTING_INFORMATION'
    def save(self):
        finalize_source_routes(self)
        source_owned_labels(self)
        self.models=[dict(candidateId=f['findingId'],observationType=f['observationType'],settingDistribution=f.get('settingDistribution'),trialUniverse=f.get('trialUniverse'),denominator=f.get('denominatorSemantics'),inputPresentation=f.get('inputPresentation'),dependencyGroup=f.get('dependencyGroupId'),fallbackRank=f.get('dependencyFallbackRank'),semanticCategories=f.get('semanticCategories'),numericImputation=False) for f in self.findings]+[dict(candidateId=b['blockId'],likelihood='DISABLED',reason=b['reason'],retainedPublishedValues=b.get('retainedPublishedValues')) for b in self.blocks]
        groups=[0,0,1,0,0,2,2,2,2,2,2,2,5,2,1,2,2,3,4,5]
        unused=[s for s in self.sources if not s['claims']];self.sources=[s for s in self.sources if s['claims']]
        d=dict(schemaVersion='research-v1',manifestVersion='8.5',batchId=BATCH,machineId=self.id,machineName=self.name,researchedAt=DATE,researchStage='SOURCE_REVIEWED_PENDING_FORMAL_VALIDATION',settings=dict(status='SOURCE_DERIVED',values=['SET_'+str(k) for k in self.settings]),sources=self.sources,findings=self.findings,blockedItems=self.blocks,researchCompleteness=dict(version=2,domains=[dict(domain=k,status='CHECKED',note=self.notes[g],sourceIds=[s['sourceId'] for s in self.sources]) for k,g in zip(DOMAINS,groups)],machineSpecificQueries=self.queries,candidateLedger=self.ledger),selfAudit=dict(status='COMPLETE_BOUNDED_SOURCE_SURVEY',independentExternalAudit='NOT_PERFORMED',reviewDate=DATE,findings=self.audit,scope='列挙した媒体・検索語・公開解析見出しに限定した調査。全公開資料の網羅や未公表情報の不存在は主張しない。'),modelDesign=self.models,surveyReferencesWithoutCandidateClaims=unused)
        d['preliminaryHistory']=[c for c in json.loads((OUT/'imported-handoff/candidates.json').read_text()) if c['id'].startswith('M'+str(self.no).zfill(2)+'-')]
        p=OUT/'research-drafts'/('wave-1' if self.no<=5 else 'wave-2')/(self.id+'.json');p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
        print(json.dumps(dict(machineId=self.id,candidates=len(self.ledger),numeric=sum('settingDistribution'in f for f in self.findings),evidence=sum(f['observationType']=='evidence' for f in self.findings),blocks=len(self.blocks)),ensure_ascii=False))

def category(m,cid,title,labels,rows,scope,src,trial,old=None,cats=None):
    dist={str(k):'/'.join(c+':'+format(v,'.12g')+'%' for c,v in zip(labels,row)) for k,row in zip(m.settings,rows)}
    m.numeric(cid,title,dist,scope,src,ob='appearance_distribution',trial=trial,old=old)
    f=m.findings[-1];f['categoryModel']={'residualPolicy':'SOURCE_EXHAUSTIVE'};f['inputPresentation']={'trialLabel':title+'の対象回数','successLabel':'各区分の回数'}
    if cats:
        f['mirrorsEvidenceFindingId']=cid+'-constraints';f['categoricalEvidenceReconciliation']={'type':'SINGLE_CANONICAL_CATEGORY_INPUT','evidenceFindingId':cid+'-constraints','runtimeLinkContract':'EXPLICIT_CATEGORY_LINK_V1'}
        for c in cats:c['linkedFindingId']=cid
        m.evidence(cid+'-constraints',title+'の示唆',cats,scope+'出現率と設定の絞り込みは同じ入力を使います。',src)
def cond(m,cid,title,values,scope,src,trial,group=None,old=None):
    m.numeric(cid,title,perc(values,m.settings),scope,src,group=group,ob='conditional_probability',trial=trial,old=old)
    m.findings[-1]['inputPresentation']={'trialLabel':'対象の'+title+'機会','successLabel':title+'回数'}
def rank(m,ids,group):
    for i,cid in enumerate(ids):
        f=next(f for f in m.findings if f['findingId']==cid);f.update(dependencyGroupId=group,dependencyKind='CAUSAL_PATH_OVERLAP',dependencyFallbackRank=i+1,dependencyReason='同じ当選やその内訳を含むため、入力できた優先項目を1つだけ使用し、他の当選率へ重ねません。')
def common(m,scope,src):
    m.block('other-role-differences','小役・特殊契機の追加設定差',scope,src)

def joint_category(m,cid,title,ids,scope,src,trial='NORMAL_GAME_TRIAL'):
    fs=[next(f for f in m.findings if f['findingId']==x) for x in ids]
    rows=[]
    for k in m.settings:
        xs=[100/float(f['settingDistribution'][str(k)][2:]) for f in fs]
        rows.append(xs+[100-sum(xs)])
    category(m,cid,title,[f['label'] for f in fs]+['その他'],rows,scope,src,trial)
    m.findings[-1]['sourceDerivation']={'type':'PUBLIC_EXCLUSIVE_COMPONENTS_AND_EXPLICIT_COMPLEMENT','sourceFindingIds':ids,'expression':'component probabilities plus 1-sum(components)','assumedRates':[]}

def finalize_source_routes(m):
    if m.no==3:
        m.nodiff('common-roles','レア小役出現率','弱強チェリー・スイカ・弱強チャンス目は全設定共通です。内部状態移行の設定差と小役成立率を混同しません。',['spec'],{'weakCherry':'1/109.2','strongCherry':'1/546.1','watermelon':'1/126.0','weakChance':'1/114.6','strongChanceA':'1/2184.5','strongChanceB':'1/2184.5'})
        m.source('reg-detail','https://nana-press.com/kaiseki/machine/828/24352/','REG紹介順の奇偶示唆')
        m.evidence('reg-order','REG紹介順',[unknown('奇数示唆シナリオ','奇数設定示唆'),unknown('偶数示唆シナリオ','偶数設定示唆')],'REGの紹介順全体で示す奇偶を記録。4人目のキャラ単独による確定とは別です。',['reg-detail'])
    if m.no==5:
        # A completed duration is censored by returns. Keeping only failed,
        # fully observed zones would change the published entry distribution.
        m.source('duration','https://nana-press.com/kaiseki/machine/815/24382/','勾玉の導き突入時の継続G抽選と途中当選')
        for cid in ['magatama-cz','magatama-at']:
            f=next(f for f in m.findings if f['findingId']==cid)
            raw=f['settingDistribution'];m.findings.remove(f)
            row=next(r for r in m.ledger if r['candidateId']==cid);m.ledger.remove(row)
            for s in m.sources:s['claims']=[x for x in s['claims'] if not any(sc['sourceId']==s['sourceId'] and sc['claim']==x for sc in row['sourceClaims'])]
            m.block(cid,f['label']+'の出現割合','突入時に選ばれた継続G数は途中のCZ・AT当選で最後まで観測できません。最後まで継続した回だけ集計すると偏るため、途中当選も扱える公表モデルがない状態では割合を計算に使いません。',['review','duration'],raw,old=['M05-C05'] if cid=='magatama-cz' else [])
            e=next(e for e in m.findings if e['findingId']==cid+'-constraints')
            for c in e['semanticCategories']:c.pop('linkedFindingId',None)
            e['details']=['該当する突入契機の勾玉の導きで、実際に継続した長さを記録。30G以上の継続を確認した場合は対応する設定を絞り込めます。途中当選を10G終了等へ置き換えません。']
        m.notes[4]='勾玉2契機の全数値を保持。途中当選で選択G数が見えないため割合は不採用。確認できた30/40/50/60Gの確定制約は維持。'
        m.audit.append('途中当選の打切りを無視した継続G数集計を防止。公開2表は欠落させず不採用理由とともに保存。')
    if m.no==7:
        ids=['flag-'+c for c in 'ABCDEF']
        joint_category(m,'flag-joint','リーチ目役の内訳',ids,'通常ゲーム数と決まり手チェックで確定した当選フラグA～Fを1ゲーム1区分で記録。スタンバイ・ボーナス中を母数に混ぜません。他のフラグはその他です。',['audit','flags'])
        joint_category(m,'bonus-joint','BIG種別の内訳',['hyper','challenge'],'通常ゲーム数とハイパー・チャレンジBIG当選を1ゲーム1区分で記録。ボーナス中・スタンバイを除き、昇格を別当選へ加算しません。',['official'])
        rank(m,['flag-joint','bonus-joint','hyper','challenge']+ids,'nights-all-entry')
        m.audit.append('ボーナス種別と当選フラグは同じ当選情報。各排他内訳を作り、フラグ内訳優先・種別内訳代替の1経路へ統合。')
    if m.no==8:
        # Cross-publisher disagreement in the two chiiko start branches.
        # Their sum and the remaining fifth-character masses agree.
        f=next(f for f in m.findings if f['findingId']=='reg-cast');e=next(f for f in m.findings if f['findingId']=='reg-cast-constraints')
        labels=['ひよ子','鞠','朔夜','龍巳','エーリカ','ちい子','きよ','鬼','全員集合']
        rows=[[32.5,32.5,13,13,8,0,1,0,0],[26.55,32.45,13.5,16.5,8,2,1,0,0],[28.5,28.5,15,15,10,0,2,1,0],[24.75,30.25,13.5,16.5,10,2,2,1,0],[26.5,26.5,15,15,12,0,4,1,0],[22.5,27.5,13.5,16.5,12,2,4,1,1]]
        f['retainedUnaggregatedPublishedDistribution']=f['settingDistribution'];f['settingDistribution']={str(k):'/'.join(c+':'+str(v)+'%' for c,v in zip(labels,row)) for k,row in zip(m.settings,rows)}
        f['denominatorSemantics']='REG1回の5枚目のキャラを1区分で記録。1～4枚目を別試行へ加算しません。ちい子の開始キャラ別割合は媒体間に相違があるため、一致する5枚目合算を使います。'
        f['details']=[f['denominatorSemantics']];f['sourceIds']=['review','audit'];f['sourceDerivation']={'type':'PUBLIC_FIFTH_CHARACTER_MARGINAL','expression':'sum of disjoint start branches for same fifth character','assumedRates':[]}
        e['semanticCategories']=[display(c,'通常パターン') for c in labels[:4]]+[unknown('エーリカ','高設定示唆（弱）'),exact('ちい子','設定2・4・6'),unknown('きよ','高設定示唆（強）'),exact('鬼','設定3以上'),exact('全員集合','設定6')]
        for c in e['semanticCategories']:c['linkedFindingId']='reg-cast'
        e['details']=[f['denominatorSemantics']]
        # Preserve and explain concrete BIG screen names, rather than meanings
        # masquerading as identifiable screen labels.
        m.source('big-screen-names','https://p.hisshobon.jp/machine/4121/1/96473','BIG終了画面のキャラ・人数')
        big=next(x for x in m.findings if x['findingId']=='big-end')
        big['semanticCategories']=[display('久遠①','通常パターン'),unknown('久遠②','偶数示唆'),unknown('エーリカ①','高設定示唆（弱）'),unknown('エーリカ②','高設定示唆（強）'),exact('犬子＆和奏','設定2否定'),exact('犬子＆和奏＆雛','設定3否定'),exact('水着2人','設定2以上'),exact('水着3人','設定3以上'),exact('水着4人','設定4以上'),exact('5人','設定5以上'),exact('宴会','設定6'),display('小波','次回BIG終了の設定示唆予告'),display('凰蝶','ハーレムモード示唆'),display('ウェディング','俺の嫁コンプリート')]
        big['sourceIds'].append('big-screen-names');claim='BIG終了画面の具体名称と示唆：久遠・エーリカ・犬子和奏・水着人数・宴会・小波・凰蝶・ウェディング'
        m.sources[-1]['claims']=[claim];next(r for r in m.ledger if r['candidateId']=='big-end')['sourceClaims'].append({'sourceId':'big-screen-names','claim':claim})
        joint_category(m,'bonus-joint','BIG・REGの内訳',['big','reg'],'通常ゲーム数とBIG・REG全出現を1ゲーム1区分で記録。疑似ボーナス消化を母数から除き、合算をさらに加算しません。',['review','audit'])
        rank(m,['bonus-joint','watermelon','mystery','big','reg','cherry-hit','watermelon-hit','chance-hit','rare-all'],'koihime-all-path')
        m.audit.append('REGちい子の久遠/一葉別0.9/1.1がなな徹と一撃で逆。開始別の原表を履歴保存し、両媒体で一致する5枚目9区分へ正確に合算。BIG画面名を必勝本で補完。')
    if m.no==9:
        m.source('cz-mechanics','https://p.hisshobon.jp/machine/4136/1/96394','合戦の計略再発生・効果追加')
        b=next(b for b in m.blocks if b['blockId']=='strategy');m.blocks.remove(b)
        old=next(r for r in m.ledger if r['candidateId']=='strategy');m.ledger.remove(old)
        for s in m.sources:s['claims']=[c for c in s['claims'] if not any(sc['sourceId']==s['sourceId'] and sc['claim']==c for sc in old['sourceClaims'])]
        for cid,title,vals in [('army1000','援軍1000回復',[9.8,9.8,9.8,11.7,11.7]),('army2000','援軍2000回復',[4.7,4.7,4.7,6.3,6.3]),('morale','士気上昇',[25.4,25.4,25.4,30.5,30.5]),('barrier','守護結界',[5.1,5.1,5.1,6.6,6.6])]:
            cond(m,'strategy-'+cid,'合戦・'+title,vals,'合戦の刻で右下がりの共通1枚ベルが成立した回数と、対応する計略の発動を記録。効果の継続表示は新たな発動へ加算せず、再当選による延長・複合は新たな発動を確認した場合に数えます。',['review','cz-mechanics'],'NOBUNA_STRATEGY_'+cid.upper()+'_TRIAL',group='nobuna-entry')
        rank(m,['at-initial','first-meeting','damage-avoid']+['strategy-'+x for x in ['army1000','army2000','morale','barrier']],'nobuna-entry')
        # Retain the generic hints separately, with no invented distribution.
        end=next(f for f in m.findings if f['findingId']=='end-screen');end['semanticCategories']=end['semanticCategories'][:5];end['label']='AT終了画面・通常の示唆'
        bands=[('early','1～1000G',[[0,0,0,0],[15,0,0,0],[15,3,0,0],[15,3.5,.5,0],[15,4,1.5,1]]),('middle','1001～7000G',[[0,0,0,0],[10,0,0,0],[10,1.5,0,0],[10,1.75,.5,0],[10,2,.75,.5]]),('late','7001G以降',[[0,0,0,0],[15,0,0,0],[15,5,0,0],[15,6,3,0],[15,7,5,4]])]
        for cid,band,rows in bands:
            rows=[r+[100-sum(r)] for r in rows];labels=['信奈③','信奈④','信奈＆良晴・誓い','ハーレム','その他']
            category(m,'screen-'+cid,'終了画面・'+band,labels,rows,'設定変更後の累計消化ゲーム数が'+band+'のAT終了を1機会として記録。1終了1画面で、通常画面・信奈①②・良晴①②はその他へ。帯が不明な終了を混ぜません。',['review'],'NOBUNA_SCREEN_'+cid.upper()+'_TRIAL',cats=[exact('信奈③','設定2以上'),exact('信奈④','設定4以上'),exact('信奈＆良晴・誓い','設定5以上'),exact('ハーレム','設定6'),display('その他','通常画面または確率非掲載の示唆画面')])
            m.findings[-2]['sourceDerivation']={'type':'PUBLIC_EXCLUSIVE_SPECIAL_SCREENS_WITH_COMPLEMENT','expression':'other = 100 - sum(four special screens)','assumedRates':[]}
        ed=next(f for f in m.findings if f['findingId']=='ed-karuta');ed['semanticCategories']=ed['semanticCategories'][:7];ed['label']='EDかるた・通常の示唆'
        labels=['犬千代＆五右衛門','半兵衛＆光秀','半兵衛＆勝家','長秀＆勝家','長秀＆光秀','信奈（金）','信奈（虹）','その他']
        weak=[[0]*7,[2.5,2.25,1.75,0,0,0,0],[1.5,1.75,1.75,3.25,2.75,0,0],[1.5,1.75,1.75,3,3,4.5,0],[1.5,1.75,2,3,3.25,4,1]]
        strong=[[0]*7,[10.87,9.78,7.61,0,0,0,0],[4.28,5,5,9.29,7.86,0,0],[3.8,4.43,4.43,7.59,7.59,11.39,0],[3.7,4.32,4.94,7.41,8.02,9.88,2.47]]
        for cid,title,rows in [('weak','弱チェリー・スイカ',weak),('strong','強チェリー・チャンス目',strong)]:
            rows=[r+[100-sum(r)] for r in rows];cats=[exact(c,'設定2以上') for c in labels[:3]]+[exact(c,'設定4以上') for c in labels[3:5]]+[exact('信奈（金）','設定5以上'),exact('信奈（虹）','設定6'),display('その他','通常または確率非掲載の示唆')]
            category(m,'ed-'+cid,'EDかるた・'+title,labels,rows,'エンディング中の'+title+'成立を1機会として実際に表示されたかるたを記録。通常時・別の成立役・同じ結果の複数加算は除外します。',['review'],'NOBUNA_ED_'+cid.upper()+'_TRIAL',cats=cats)
        t=next(b for b in m.blocks if b['blockId']=='trophy-rates');t['retainedPublishedValues']={'labels':['なし','黒','青','金','信奈柄','虹'],'settings':[1,2,4,5,6],'nonBlackEarly':[[100,0,0,0,0,0],[97.5,2,.5,0,0,0],[96.8,2.5,.5,.2,0,0],[96.2,3,.5,.2,.1,0],[95.6,3.5,.5,.2,.1,.1]],'nonBlackMiddle':[[100,0,0,0,0,0],[98.5,1,.5,0,0,0],[98.1,1.3,.5,.2,0,0],[97.7,1.5,.5,.2,.1,0],[96.4,2.8,.5,.2,.1,.1]],'nonBlackLate':[[100,0,0,0,0,0],[95.5,4,.5,0,0,0],[94.3,5,.5,.2,0,0],[93.2,6,.5,.2,.1,0],[92.1,7,.5,.2,.1,.1]],'afterBlackAllBands':{'1':'NOT_APPLICABLE_PRIOR_BLACK_IMPOSSIBLE','2':[0,0,100,0,0,0],'4':[0,0,85,15,0,0],'5':[0,0,75,18,7,0],'6':[0,0,65,20,10,5]}}
        m.audit.append('終了4特殊画面を3ゲーム帯、ED7特殊かるたを2成立役群で数値候補へ。その他の明示補数と同じ入力の制約を作成。計略は再発動もあることを必勝本で確認し、内部状態不足として不採用にする誤りを訂正。')

def source_owned_labels(m):
    short={'freeze':('通常ゲーム数','フリーズ回数'),'naraku':('通常ゲーム数','突入回数'),'whistle':('笛獲得回数','各笛の回数'),'mini-pair':('リコ・レグ登場回数','各キャラの回数'),'jiruo':('ジルオ説明回数','各説明対象の回数'),'eyecatch':('アイキャッチ出現回数','各画面の回数'),'cross-convert':('十字目変換成立回数','ボーナス当選回数'),'cross-replay':('十字リプレイ成立回数','ボーナス当選回数'),'episode':('初当たりボーナス回数','EPボーナス回数'),'shinra':('森羅万象突入回数','成功回数'),'lamp':('通常ゲーム数','点灯回数'),'lamp-at':('新規点灯回数','AT当選回数'),'sakura50':('50G到達回数','移行回数'),'mystery':('通常ゲーム数','謎当たり回数'),'end-pattern':('ボーナス終了回数','各画面の回数'),'flag-joint':('通常ゲーム数','各フラグの回数'),'bonus-joint':('通常ゲーム数','各種別の回数'),'panel':('10枚を確認したBIG回数','各並びの回数'),'reg-cast':('REG回数','各キャラの回数'),'first-meeting':('初回戦略会議回数','CZ当選回数'),'damage-avoid':('攻撃対象ハズレ回数','回避回数'),'tenka-after':('駆け抜けAT終了回数','救済突入回数')}
    for f in m.findings:
        if 'settingDistribution' not in f:continue
        cid=f['findingId'];p=f['inputPresentation']
        if cid in short:tl,sl=short[cid]
        elif cid.startswith('meter'):tl,sl='該当段階への上昇回数','CZ当選回数'
        elif cid.startswith('cz-'):tl,sl='該当マスでの前半終了回数','前半突破回数'
        elif cid.endswith('-hit'):tl,sl='該当役の成立回数','ボーナス当選回数'
        elif cid.startswith('strategy-'):tl,sl='共通1枚ベル成立回数','計略発動回数'
        elif cid.startswith('screen-'):tl,sl='該当ゲーム帯のAT終了回数','各画面の回数'
        elif cid.startswith('ed-'):tl,sl='該当レア役の成立回数','各かるたの回数'
        else:tl,sl=p['trialLabel'],p['successLabel']
        f['inputPresentation']={'trialLabel':tl,'successLabel':sl}

def machine1():
    m=Machine(1);m.queries=['メイドインアビス 設定 小役 CZ 直撃 リセット フリーズ 笛','メイドインアビス 設定判別 メーター 高確 小役 当選率','メイドインアビス 安定 勝負 勝率 38.09 7000']
    m.source('review','https://nana-press.com/kaiseki/machine/561/15139/','メイドインアビス設定差総覧');m.source('audit','https://1geki.jp/slot/s_miabyss/0/','初当たり・フリーズ・画面・ミニキャラ');m.source('draw','https://1geki.jp/slot/s_miabyss/42/','レア役・メーター・内部状態抽選')
    for cid,label,vals,old in [('cz-entry','CZ初当たり',[138.8,134.6,129.2,119.5,114.4,110.7],'M01-C01'),('at-initial','AT初当たり',[287.2,276.5,262.7,233.1,220.8,212.6],'M01-C02'),('freeze','始まっていたのですフリーズ',[32768,21845.33,13107.2,5461.33,4681.14,4369.07],'M01-C03')]:
        m.numeric(cid,label,rates(vals),'通常時のゲーム数と新たな当選を記録します。CZ合算はベニクチナワCZとレグCZの合計です。AT中の継続や報酬の昇格を通常初当たりへ加算しません。',['review','audit'],group='abyss-entry-path',old=[old])
    for cid,vals,old in [('stable-win',[38.09,44.91,53.38,73.84,81.07,86.98],'M01-C04'),('gamble-win',[39.71,46.03,53.82,71.4,77.94,83.53],'M01-C05')]:
        m.block(cid,'安定選択の実戦勝率' if cid=='stable-win' else '勝負選択の実戦勝率','選択方法を固定した実戦の勝率です。選択1回の成功確率ではないため、選択回数と成功回数の計算には使えません。',['review','audit'],perc(vals),old=[old])
    m.numeric('naraku','奈落の探窟域',rates([430.2,426,415.3,405,408.3,410.9]),'通常時のゲーム数とリリベ入賞・BAR揃いからの突入を記録します。通常時以外の同名演出を加算しません。',['review','audit'],group='abyss-entry-path',old=['M01-C08'])
    m.evidence('at-end','AT終了画面',[display('オースの街','通常パターン'),unknown('リコ','奇数設定示唆'),unknown('レグ','偶数設定示唆'),unknown('レグ・リコ・ナナチ','高設定示唆')]+[exact('深界'+str(i)+'層','設定'+str(i)+'否定') for i in range(1,5)]+[exact('マルルク・オーゼン・レグ・リコ','設定2・5・6'),exact('ナナチ・ミーティ・レグ・リコ','設定4以上'),exact('プルシュカ・ボンドルド・レグ・リコ・ナナチ','設定5以上'),exact('ライザ・レグ・リコ','設定6')],'AT終了時の画面を記録します。出現割合は公開値を確認できないため、示唆は記録、確定・否定は設定候補の絞り込みに使います。',['review','audit'],old=['M01-C06'])
    m.evidence('cz-led','CZ失敗時のLED',[display('白','通常パターン'),unknown('青','奇数設定示唆'),unknown('黄','偶数設定示唆'),unknown('緑','高設定示唆'),exact('赤','設定4以上'),exact('紫','設定5以上'),exact('虹','設定6')],'アビスチャレンジまたは超アビスチャレンジ失敗時のリール上部LEDを記録。初当たり回数1回目・10回目の優遇を他の回と同じ出現率へ置き換えません。',['review','audit'],old=['M01-C07'])
    for cid,label,vals in [('meter1','メーター1段階からのCZ',[2.3,2.7,3.1,3.5,3.9,4.3]),('meter2','メーター2段階からのCZ',[12.5,12.9,13.3,17.2,18.8,20.3]),('meter3','メーター3段階からのCZ',[25,25.8,27,30.9,32,33.2])]:
        cond(m,cid,label,vals,'液晶の該当段階へ上昇した回数と、その上昇からのベニクチナワCZ当選を記録。別契機が重なり当選元を区別できない機会は除外します。',['draw'],cid.upper()+'_TRIAL',group='abyss-entry-path')
    for cid,label,vals in [('cz-start','前半・開始地点',[25,25.8,27,30.9,32,33.2]),('cz-blue','前半・青マス',[33.6,34.4,36.3,39.5,41.8,43]),('cz-yellow','前半・黄マス',[50,51.6,53.1,56.6,58.6,59.8]),('cz-green','前半・緑マス',[66,67.2,68.4,73.4,75,75.8])]:
        cond(m,cid,label,vals,'ベニクチナワCZ前半終了時にPUSH色で確定した到達マスの機会と前半突破を数えます。画面上の見かけのマスでは分けず、赤マス・レグ到達はこの項目から除きます。',['audit'],cid.upper().replace('-','_')+'_TRIAL',group='abyss-entry-path')
    raw={'lowWatermelonCZ':[4.7,5.1,5.9,6.6,8.2,9.0],'lowCherryCZ':[0.8,1.2,1.6,2,2.3,2.7],'highAbyssDirect':[0.4,0.8,1.2,3.1,3.5,3.9],'highBAR':rates([104.9,100.7,92.3,80.4,78.5,77.3])}
    m.block('state-conditioned','内部状態別の小役・BAR抽選','通常・高確・BAR揃い高確の滞在を毎ゲーム確定できず、ステージは状態の示唆です。通常時の小役回数へ状態別の当選率を混ぜて使いません。',['draw','audit'],raw)
    m.block('high-extension','高確保証ゲーム数の加算','リプレイやチェリーでの保証延長に設定差がありますが、内部の残り保証と延長結果を毎回直接確認できません。',['draw'],{'replay20G':[0.4,0.8,1.2,1.6,2,2.3]})
    category(m,'whistle','笛の導きの笛',['赤笛','蒼笛','月笛','黒笛','白笛'],[[66.99,24.1,3.59,.71,4.6],[67.09,24.13,3.58,.73,4.47],[67.09,24.25,3.6,.73,4.34],[67.41,24.28,3.62,.74,3.95],[67.57,24.32,3.63,.74,3.74],[67.72,24.37,3.62,.72,3.57]],'通常の笛の導きで最終獲得した笛を1つ記録。白笛の導きなど笛が優遇・確定する別契機を混ぜません。',['review'],'ABYSS_ORDINARY_WHISTLE_TRIAL')
    category(m,'mini-pair','ミニキャラのリコ・レグ',['リコ','レグ'],[[50,50],[57.5,42.5],[42.5,57.5],[57.5,42.5],[42.5,57.5],[50,50]],'通常時の原作説明ミニキャラがリコまたはレグだった機会を対象に、どちらが出たかを記録。ジルオ出現を母数に混ぜません。',['audit'],'ABYSS_MINI_PAIR_TRIAL')
    category(m,'jiruo','ジルオが説明するキャラ',['リコ','レグ','シギー','ナット','キユイ','ジルオ','院長'],[[12.5,17.5,15,20,12.5,12.5,10],[17.5,12.5,20,15,15,10,10],[12.5,17.5,15,20,15,10,10],[15,10,20,15,15,10,15],[10,15,12.5,17.5,17.5,12.5,15],[15,10,17.5,12.5,17.5,12.5,15]],'通常時ミニキャラのジルオが原作説明した機会に、説明対象を1つ記録。登場したミニキャラ自体を説明対象と取り違えません。',['audit'],'ABYSS_JIRUO_TRIAL')
    category(m,'eyecatch','ステージチェンジの画面',['孤児院・オースの街','通常','通常＋ライザ'],[[87.5,12.5,0],[79.2,20,.8],[79.2,20,.8],[78,20,2],[78,20,2],[78,20,2]],'通常時のステージチェンジのアイキャッチを1回1区分で記録。AT終了画面と混ぜません。',['audit'],'ABYSS_EYECATCH_TRIAL',cats=[display('孤児院・オースの街','通常パターン'),unknown('通常','設定2以上示唆'),exact('通常＋ライザ','設定2以上')])
    rank(m,['at-initial','freeze','cz-entry','naraku','meter1','meter2','meter3','cz-start','cz-blue','cz-yellow','cz-green'],'abyss-entry-path')
    m.block('mean-payout','AT平均獲得枚数','設定1・6の平均枚数は1回の当選率ではなく、出玉結果の平均です。設定別の当選確率へ変換できません。',['review','audit'],{'normalATSetting1':331.2,'normalATSetting6':344.2})
    m.notes=['CZ合算・AT・フリーズ・奈落を別候補で保持。上流下流を優先入力1経路へ。','小役成立と状態別CZ当選を区別。BAR高確の母数を通常Gへ転用しない。','メーター1～3と前半PUSH色の突破率を追加。内部保証の残G・状態は非観測。','AT12画面・失敗LED・ミニキャラ・ジルオ・アイキャッチを具体区分で保存。','固定選択の実戦勝率・平均出玉を1回の成功率へ読み替えない。','2023年SメイドインアビスEN、AT機。5段階メーターと白笛特別ルート・リセットを分離。'];m.audit=['76件に無かったメーター・CZ前半・笛・ミニキャラの公開候補を追加。','安定/勝負勝率の観測単位誤りを修正。奈落5・6は公開全値へ復元。'];m.save()

def machine2():
    m=Machine(2,(1,2,4,5,6));m.queries=['炎炎ノ消防隊 設定 炎炎激闘 689 259.5','炎炎ノ消防隊 2023 REG シナリオ JAC 設定 小役','炎炎ノ消防隊 2023 森羅万象 エピソード 期待度 リセット']
    m.source('review','https://nana-press.com/kaiseki/machine/526/14735/','メダル炎炎設定抽選・示唆');m.source('audit','https://www.dechau.com/news/single.php?id=12584','初代炎炎解析特集');m.source('spec','https://data.hazuse.com/?genre=208&machine_code=2S1217','初代炎炎基本仕様と初当たり')
    for cid,label,vals,old in [('bonus-initial','ボーナス初当たり',[243,240,224,218,208],'M02-C01'),('fire-initial','炎炎激闘初当たり',[689,652,581,535,479],'M02-C02')]:m.numeric(cid,label,rates(vals,m.settings),'通常時のゲーム数と初当たり回数を記録。炎炎激闘中のボーナスやストック継続を初当たりへ加算しません。',['review','spec','audit'],group='fire-entry',old=[old])
    for cid,label,vals,old in [('cross-convert','十字目変換からのボーナス',[30,30,34,35,37],'M02-C03'),('cross-replay','十字リプレイからのボーナス',[50,51,55,58,65],'M02-C04')]:
        cond(m,cid,label,vals,'通常時の当該役成立と、その契機によるボーナスを記録。炎炎激闘中を除き、別契機が重なり当選元を区別できない機会は除外。公表値は約値です。',['review'],cid.upper().replace('-','_')+'_TRIAL',group='fire-entry',old=[old])
    cond(m,'episode','初当たり後のエピソード',[40,41,44,46,50],'初当たりボーナス開始から、その後の伝導者の影ステージ終了までを1機会として、エピソードボーナスへ当選したかを記録。ボーナス中とステージ中の抽選を別の機会へ分けません。約値です。',['review'],'FIRE_EPISODE_TRIAL',group='fire-entry')
    cond(m,'shinra','森羅万象の成功',[27,28,29,30,31],'通常の森羅万象突入を1機会に数え、成功を記録。森羅万象廻やアドラバースト、成功が確定した別契機を混ぜません。約値です。',['review'],'FIRE_SHINRA_TRIAL',old=['M02-C08'])
    m.evidence('reg-scenario','REGキャラ紹介',[display('第8①','通常パターン'),exact('アイリス②','設定2否定'),exact('アイリス③','設定4否定'),exact('アイリス④','設定5否定'),unknown('伝道者①','設定2・5示唆'),unknown('第8②','設定1・4・6示唆'),exact('アイリス①','設定2以上'),exact('第8③','設定4以上'),exact('大隊長','設定4以上'),exact('伝道者②','設定5以上'),exact('アイリス⑤','設定6')],'REG1回のキャラ紹介の順番・背景を確認し、シナリオを1つ記録。最後のキャラだけでシナリオ番号を推定しません。',['review','audit'],old=['M02-C05'])
    m.evidence('bonus-end','ボーナス終了画面',[display('第8メンバー・シルエット','通常パターン'),unknown('第8メンバー・正面','高設定示唆（弱）'),unknown('第8メンバー・左向き','高設定示唆（強）'),exact('第8メンバー・全員集合','設定4以上'),exact('第8メンバー・赤枠9人','設定5以上'),exact('仲間全員集合・金枠','設定6')],'設定示唆の終了画面を記録。ラッキースケベられ・アクセル・エピソード等のストックや移行先示唆を設定確定へ読み替えません。',['review','audit'],old=['M02-C06'])
    m.evidence('jac-start','炎炎JAC開始画面',[unknown(c,'設定2・5示唆') for c in ['シンラ','アーサー','ヒナワ']]+[unknown(c,'設定1・4・6示唆') for c in ['マキ','タマキ']]+[exact('オウビ','設定2以上'),exact('ジョーカー','設定1・4・6'),exact('紅丸','設定4以上'),exact('アイリス','設定5以上')],'アドラバースト中の炎炎JAC開始画面を記録。別機種の同名キャラやボーナス終了画面を混ぜません。',['review'],old=['M02-C07'])
    rank(m,['fire-initial','bonus-initial','episode','cross-replay','cross-convert'],'fire-entry')
    m.block('cross-table','十字目変換モード・テーブル','内部モードや変換周期の選択はボーナス経路に影響しますが、滞在モードと切替を毎回確定できません。周期の見かけを設定別の抽選機会へ置き換えません。',['review','audit'])
    m.nodiff('strong-cherry','強チェリーボーナス当選','公表の当選期待度は全設定で約25％です。設定差のある十字目変換・十字リプレイと区別します。',['review'],perc([25]*5,m.settings))
    m.audit=['設定3非搭載の全4表を1/2/4/5/6へ訂正。','総覧概要の259.5～221.1は詳細表689～479と不一致。詳細表とHAZUSE・でちゃうの一致値を使用し概要値は履歴のみ保持。'];m.notes=['ボーナスと炎炎激闘の当選経路を分け、同時加算を禁止。','十字目変換・十字リプレイの約当選率と強チェリー全設定共通を保持。','ボーナスから伝導者の影の全期間EP期待度を1機会へ。内部変換モードを非観測として保存。','REG全シナリオ・終了画面・JAC開始キャラを具体化。ストック示唆を設定へ誤用しない。','森羅万象27～31％を追加。公表約値を精密な内部抽選率と主張しない。','2023年メダル機で設定3なし。2024年スマスロ版と2025年炎炎2を混入しない。'];m.save()

def machine3():
    m=Machine(3);m.queries=['スマスロ 鬼武者3 2024 AT 確率 388.4 335.2','スマスロ 鬼武者3 ポイント百鬼 内部状態 小役 リセット','鬼武者3 2024 REG キャラ 終了画面 サブ液晶 エンタライオン']
    m.source('review','https://nana-press.com/kaiseki/machine/828/24352/','2024鬼武者3設定抽選');m.source('spec','https://www.p-world.co.jp/machine/database/10104','2024鬼武者3スペック');m.source('audit','https://p-gabu.jp/guideworks/machinecontents/detail/6685','鬼武者3機種同定と解析')
    m.numeric('at-initial','AT初当たり',rates([412.9,402.3,388.4,352.2,341.8,335.2]),'通常時のゲーム数と新たなボーナス初当たりを数えます。百鬼目や1G連の継続当選を通常初当たりへ加算しません。',['review','spec'],old=['M03-C01'])
    m.block('hyakki-points','ポイント百鬼の規定ポイント','規定ポイントの選択に設定差がありますが、小役ポイントを途中着席や百鬼前兆の重なりを含めて確定できない機会へ、推定した到達ポイントの表を適用できません。',['review'],{'500':[79.3,77.3,75.8,72.7,71.9,70.3],'400':[.4,.4,.4,.8,.8,.8],'300':[19.5,21.1,21.9,22.7,23.4,25],'200':[.4,.4,.4,.8,.8,.8],'100':[.4,.8,1.6,3.1,3.1,3.1]},old=['M03-C02'])
    m.block('state-raise','レア役の内部状態移行','通常・高確・超高確ショート・ロングの移行表はありますが、移行前後の内部状態を毎回確定観測できません。液晶ステージの示唆を内部状態の確定へ置き換えません。',['review'],{'normalToHigh':[19.1,20.3,20.7,23,23.4,24.2],'highToShort':[16,20.7,21.1,23.4,23.8,24.6],'shortToLong':[16.4,21.1,21.5,23.8,24.2,25]},old=['M03-C03'])
    m.evidence('reg-fourth','REG4人目のキャラ',[unknown('マーセラス','高設定示唆（弱）'),unknown('阿児','高設定示唆（弱）'),unknown('信長','高設定示唆（強）'),exact('ガルガント','設定2以上'),exact('幻魔王 信長','設定4以上'),exact('ミシェル（特殊）','設定5以上'),exact('エンタライオン','設定6')],'REGの4人目に出たキャラを記録。BIG終了画面のミシェル特殊とは示唆が異なります。',['review'],old=['M03-C04'])
    m.evidence('big-end','BIG終了画面',[unknown('平八','奇数示唆（弱）'),unknown('ジャック','偶数示唆（弱）'),unknown('左馬介','奇数示唆（中）'),unknown('ミシェル＆阿児','偶数示唆（中）'),exact('ミシェル（特殊）','設定2・4・6'),unknown('左馬介＆ジャック＆平八','高設定示唆'),exact('ギルデンスタン＆ベガドンナ＆蘭丸','設定2以上'),exact('信長＆幻魔王 信長','設定4以上'),exact('味方集合','設定5以上'),exact('エンタライオン','設定6')],'BIG・スーパーBIG終了画面を記録。REG4人目のキャラと分けて扱います。',['review'],old=['M03-C05'])
    m.evidence('sub-touch','終了時サブ液晶',[exact('エンタライオン','設定6')],'百鬼目・1G連に非当選のボーナス終了時、サブ液晶をタッチして出たエンタライオンを記録。他のモード示唆を設定確定にしません。',['review'],old=['M03-C06'])
    m.audit=['修正前とドラフト双方で設定4～6の値がずれていた。設定3を挿入するだけでなく全6値を412.9/402.3/388.4/352.2/341.8/335.2へ復元。'];m.notes=['2024年AT全6値を機種同定付きで保存。連続当選・百鬼目を初当たりへ加えない。','役からの状態移行は公表。成立役率と状態の当選表を分ける。','ポイント百鬼規定ポイント・状態移行表を保持し、非観測条件を明記。','REG4人目・BIG終了・サブ液晶の確定条件を場面別に保持。','サブ液晶のモード示唆を設定示唆へ転用しない。','L鬼武者3XA、2024年10月7日。新鬼武者3（2025）を除外。'];m.save()

def machine4():
    m=Machine(4);m.queries=['今日から俺は パチスロ 2024 設定判別 スイカ トロフィー モード','今日から俺は BIG REG 初当たり 273.3 全設定','今日から俺は ツッパリコンテスト 金アイキャッチ 初回上乗せ 設定']
    m.source('review','https://nana-press.com/kaiseki/machine/810/24830/','今日俺の各種確率と設定示唆');m.source('audit','https://hazuse.com/machine/pachislot/4S0633/genre/208/','今日俺設定示唆');m.source('spec','https://www.p-world.co.jp/machine/database/10094','今日俺小役・モード');m.source('official','https://www.konami.com/amusement/psm/slot/kyoukaraoreha/03_hint.html','コナミ今日俺ヒント')
    scope='通常時のゲーム数に、CZ・天国を含む同じ期間のBIG・REG全出現回数を記録。通常の初当たりだけの確率とは別です。ボーナス消化中のゲーム数は母数に混ぜません。'
    for cid,label,vals,old in [('big','BIG出現率',[410,398.6,384.4,354.5,329.7,303.7],'M04-C01'),('reg','REG出現率',[457,447.2,434.8,412.2,386.5,365.4],'M04-C02')]:m.numeric(cid,label,rates(vals),scope,['review','spec'],group='kyou-bonus-types',kind='MUTUALLY_EXCLUSIVE_CATEGORIES',old=[old])
    for f in m.findings:f['dependencyReason']='同じ通常ゲームの結果はBIG・REG・非当選の排他的な内訳です。BIG/REGの全出現率を組にし、合算をさらに掛けません。'
    m.numeric('watermelon','スイカ出現率',rates([100.1,95.6,91.9,88,80.9,79.6]),'通常時のゲーム数とスイカ成立を記録。中リールでスイカを狙い、取りこぼしや不明な役を成立として加算しません。',['review','spec'],old=['M04-C03'])
    m.block('initial','通常ボーナス初当たり','通常初当たりは設定1の1/273.3のみ公開され、他設定の値を確認できません。BIG・REG全出現の確率を通常初当たりの回数へ代用しません。',['review','spec'],{'1':'1/273.3'},old=['M04-C04'])
    m.block('mode','終了後のモード振り分け','設定1のモードA33.2％・B16.8％・天国50％のみ掲載。次々回を抽選する仕組みとリセット後の3回分を、今回の即時モード選択へ読み替えません。',['review','spec'],{'1':{'A':33.2,'B':16.8,'heaven':50}})
    m.evidence('cz-end','CZ終了画面',[exact('集合写真','設定4以上')],'ツッパリロード・奇跡を信じる力ゾーン・最強ツッパリロードの終了画面を記録。',['review','audit'],old=['M04-C05'])
    m.evidence('reg-cast','REGキャラ紹介',[unknown('三橋（緑）','奇数示唆'),unknown('伊藤（緑）','偶数示唆'),unknown('今井（緑）','高設定示唆'),unknown('京子（赤）','奇数・高設定示唆'),unknown('理子（赤）','偶数・高設定示唆'),exact('今井（金）','設定2以上'),exact('伊藤（金）','設定4以上'),exact('三橋（金）','設定5以上'),exact('全員集合（金）','設定6')],'ツッパリゾーン中の今日俺ボーナス紹介編で出たキャラを記録。告知編とは分けます。',['review','audit'],old=['M04-C06'])
    m.evidence('big-first','BIG初回上乗せ',[display('1回目','天国または奇跡を信じる力ゾーン'),exact('2回目','設定2以上'),display('3回目','モードB以上期待'),display('4回目','通常パターン'),display('5回目','モードB以上'),exact('6回目','設定6'),display('7回目','モードB以上')],'BIGでチャンス告知を選択し、三橋激怒パートの何回目の演出で初回上乗せが告知されたかを記録。2回目以降の上乗せは含めません。',['review','audit'],old=['M04-C07'])
    m.evidence('big-end','BIG終了画面',[unknown('三橋','奇数示唆'),unknown('伊藤','偶数示唆'),unknown('理子','高設定示唆'),unknown('京子','高設定示唆'),unknown('今井＆谷川','設定2以上示唆'),unknown('三橋＆伊藤','設定4以上示唆'),unknown('理子＆京子','設定5以上示唆'),exact('味方キャラ集合','設定6')],'勲章ボーナス終了画面を記録。「以上示唆」の画面は確定へ強めず、味方集合のみ設定6の条件として使います。',['review'],old=['M04-C08'])
    m.evidence('contest','ツッパリコンテスト',[unknown('三橋','奇数示唆'),unknown('伊藤','偶数示唆'),unknown('今井','設定2以上期待度アップ'),exact('谷川','設定2以上'),exact('京子','設定4以上'),exact('理子','設定4以上')],'ホールが発生時間を設定できるコンテストの優勝キャラを記録。非出現回数や回数自体は設定の尤度に使いません。',['review'],old=['M04-C09'])
    m.evidence('gold-eyecatch','対決失敗時アイキャッチ',[display('全員集合（金）・ボーナスあり','ボーナス当選示唆'),exact('全員集合（金）・ボーナス否定','設定4以上')],'対決演出失敗後の金集合と、その後のボーナス当否を確認。ボーナスを否定した場合だけ設定の絞り込みに使います。',['review','audit'])
    m.block('arist-trophy','アリストロフィーの色別設定','総覧の説明は従来のコナミ機を参考にした表です。本機の各色が同じ設定を確定させる根拠を確認できないため、過去機種の条件を転用しません。',['review','official'],old=['M04-C10'])
    m.notes=['BIG/REG全出現と通常初当たりを分離。前者は排他内訳。','設定別スイカと設定1のみの他小役を区別。スイカの目押し条件を記載。','次々回抽選とリセット後3回分のモードを確認し、部分表を保持。','CZ集合・紹介編REG・初回上乗せ・終了画面・コンテスト・金アイキャッチを場面別に展開。','トロフィーの従来機種参考表を本機確定としない。以上示唆を確定としない。','2024年L今日から俺はFE・AT疑似ボーナス。天国当選を全出現率から落とさない。'];m.audit=['金アイキャッチ候補を追加。BIG終了の2/4/5以上示唆は記録のみへ。'];m.save()

def machine5():
    m=Machine(5);m.queries=['真 一騎当千 スマスロ 設定差 ベル 勾玉 終了画面','真一騎当千 勾玉 闘士決戦後 AT終了後 振り分け','真一騎当千 リセット モード キャラ図鑑 ダメージ 看板']
    m.source('review','https://nana-press.com/kaiseki/machine/815/24357/','真一騎当千設定抽選と示唆');m.source('audit','https://1geki.jp/slot/l_shin_ikkitosen/0/','真一騎当千設定判別');m.source('spec','https://www.p-world.co.jp/machine/database/10116','真一騎当千機種仕様')
    for cid,label,vals,old in [('cz-entry','CZ初当たり',[154,148,138,115,110,105],'M05-C01'),('at-initial','AT初当たり',[321,311,292,246,232,222],'M05-C02')]:m.numeric(cid,label,rates(vals),'通常時のゲーム数と新規のCZまたはAT初当たりを記録。AT中CZ・継続・勾玉の導きでの引き戻しは含めません。',['review','audit'],group='ikki-entry',old=[old])
    m.numeric('bell','1枚・11枚ベル',rates([5.1,5.1,5,5,4.9,4.9]),'通常時のゲーム数と実際に1枚または11枚払い出したベルの合計を記録。ボーナス中・AT中のナビベルと、見分けられないこぼし目を混ぜません。公表値は丸められています。',['review'],old=['M05-C03'])
    m.block('end-mode','AT終了後のモード','設定別の通常A～D・天国振り分けがありますが、内部モードを毎回確定できません。駆け抜け後のC以上確定を一般のAT終了表へ混ぜません。',['review'],{'normalA':[48.7,46.7,39.3,35.5,29.4,28.6],'normalB':[13.3,13.3,16.8,16.8,21,21],'normalC':[35.1,37.1,41.1,42.8,44.7,45.4],'normalD':[2.2,2.2,2.2,2.5,2.5,2.5],'heaven':[.7,.6,.6,2.5,2.5,2.5]},old=['M05-C04'])
    m.block('reset-mode','設定変更時の天国移行','天国選択率は0/1.6/1.6/3.1/3.1/3.1％ですが、設定変更と移行先を毎回直接確認できません。朝一の早い当選だけを天国確定へ読み替えません。',['review','audit'],perc([0,1.6,1.6,3.1,3.1,3.1]))
    labels=['10G','20G','30G','40G','50G','60G'];cats=[display('10G','通常パターン'),display('20G','通常パターン'),exact('30G','設定2以上'),exact('40G','設定4以上'),exact('50G','設定5以上'),exact('60G','設定6')]
    category(m,'magatama-cz','勾玉の導き・闘士決戦後',labels,[[87.5,12.5,0,0,0,0],[85.94,12.5,1.56,0,0,0],[85.94,12.5,1.56,0,0,0],[85.94,12.5,.78,.78,0,0],[85.94,12.5,.78,.39,.39,0],[85.74,12.5,.78,.39,.39,.2]],'闘士決戦後に突入した勾玉の導きの本来の継続G数を数えます。途中で当選し長さが確定できない機会を除外します。AT終了後と別に記録。',['review'],'IKKI_MAGATAMA_CZ_TRIAL',old=['M05-C05'],cats=cats)
    category(m,'magatama-at','勾玉の導き・AT終了後',labels,[[66.41,33.59,0,0,0,0],[60.16,33.59,6.25,0,0,0],[60.16,33.59,6.25,0,0,0],[60.16,33.59,3.13,3.13,0,0],[58.98,33.59,3.13,3.13,1.17,0],[58.98,33.59,3.13,2.34,1.17,.78]],'AT終了後に突入した勾玉の導きの本来の継続G数を数えます。途中で当選し長さが確定できない機会を除外します。闘士決戦後と別に記録。',['review'],'IKKI_MAGATAMA_AT_TRIAL',cats=[dict(c) for c in cats])
    m.evidence('at-end','AT終了画面',[display('孫策','通常パターン'),unknown('劉備','偶数示唆'),unknown('曹操','奇数示唆'),unknown('趙雲','高設定示唆（弱）'),unknown('関羽','高設定示唆（強）'),exact('関羽＆孫策','設定2・4・6'),exact('孔明','設定2以上'),exact('呂布','設定3以上'),exact('成都学園','設定4以上'),exact('VS大和学院','設定5以上'),exact('ウェディング','設定6')],'一騎当千RUSHの終了画面を記録。キャラ図鑑や当千ボーナス中の同名キャラとは分けます。',['review','audit'],old=['M05-C06'])
    m.evidence('bonus-cast','ボーナス中キャラ紹介',[exact('趙雲','設定1否定'),exact('孫策','設定2否定'),exact('呂蒙','設定3否定'),exact('張飛','設定4否定'),exact('関羽','設定1・4・6'),exact('孔明','設定4以上'),exact('卑弥呼','設定6')],'当千ボーナス中の紹介キャラを記録。通常時図鑑とは区別。',['review','audit'],old=['M05-C07'])
    m.evidence('encyclopedia','キャラ図鑑',[unknown('趙雲・Aランク以上','高設定示唆（弱）'),unknown('関羽・Aランク以上','高設定示唆（強）'),exact('卑弥呼・Aランク以上','設定6')],'通常時図鑑演出でAランク以上のキャラを記録。B以下の同名キャラを加算しません。',['review','audit'])
    m.evidence('payout','獲得枚数表示',[exact(str(n)+'OVER','設定'+str(k)+'以上' if k<6 else '設定6') for n,k in [(222,2),(333,3),(444,4),(456,4),(555,5),(666,6)]]+[exact('一騎当千OVER','設定6')],'表示された特定枚数を記録。実際の持ちメダル数とは別です。',['review','audit'],old=['M05-C08'])
    m.evidence('damage','闘士決戦ダメージ',[exact(str(n),'設定'+str(k)+'以上' if k<6 else '設定6') for n,k in [(234,2),(1234,2),(456,4),(1456,4),(555,5),(1555,5),(666,6),(1666,6)]],'闘士決戦で1回の攻撃に表示されたダメージを記録。累積ダメージではありません。',['review'])
    m.evidence('ending-sign','エンディングの看板',[unknown('千載一遇','偶数示唆'),unknown('奇想天外','奇数示唆'),unknown('士気高揚','高設定示唆（弱）'),unknown('勇猛果敢','高設定示唆（強）')]+[exact(c,'設定'+str(k)+'以上' if k<6 else '設定6') for c,k in [('二者択一',2),('三位一体',3),('国士無双',4),('天下統一',5),('一騎当千',6)]],'エンディング中のレア小役成立時に孔明の看板へ出る設定情報を記録。通常時の看板を混ぜません。',['review'])
    rank(m,['at-initial','cz-entry'],'ikki-entry')
    m.notes=['CZとATを分け、AT中のCZ・引き戻しを通常初当たりから除外。','1枚/11枚ベルを合計し、公表丸め率の観測条件を保存。','通常終了と駆け抜け・設定変更の内部モード表を別々に保持。','終了画面・図鑑A以上・ボーナスキャラ・枚数・ダメージ・ED看板を場面ごとに展開。','勾玉は闘士決戦後とAT後の2表を全6区分で保持。途中当選で長さ不明は除外。','2024年L真一騎当千V。勾玉の30/40G確定も復元し、50/60Gだけへ縮小しない。'];m.audit=['初回8候補に不足した図鑑・勾玉2表・全キャラ・枚数・看板を展開。'];m.save()

def machine6():
    m=Machine(6);m.queries=['黄門ちゃま天 設定差 提灯 50G 謎当たり モード','黄門ちゃま天 設定 モード昇格 千年桜 小役 履歴','黄門ちゃま天 スタンプ 枚数 リセット 引き戻し']
    m.source('review','https://nana-press.com/kaiseki/machine/799/23672/','黄門ちゃま天設定総覧');m.source('mode','https://nana-press.com/kaiseki/machine/799/23680/','通常モード・提灯抽選');m.source('audit','https://1geki.jp/slot/l_komonchama_ten/0/','黄門ちゃま天設定判別');m.source('spec','https://www.p-world.co.jp/machine/database/10076','黄門ちゃま天仕様')
    m.numeric('at-initial','AT初当たり',rates([398.5,384.6,354.2,313.5,285,271.1]),'通常時のゲーム数と新たなAT当選を記録。継続セットやかげろうお銀等の引き戻しを初当たりへ加算しません。',['review','audit'],group='komon-entry',old=['M06-C01'])
    m.block('mode-rise-one','通常A・Bでのモード昇格','レア役履歴による設定別昇格率はありますが、昇格前後の内部モードを毎回確定できません。高確中を通常A・Bへ混ぜません。',['review','mode'],perc([25,26.6,27.7,30.1,32,33.2]),old=['M06-C02'])
    m.block('mode-rise-two','弱レア役2回のモード昇格','四直し履歴で弱レア役2回に該当しても、通常A・Bにいることと内部昇格を確定観測できません。',['review','mode'],perc([55.1,56.3,57.8,60.2,64.5,66.8]))
    m.block('mode-fall','高確転落時の通常B移行','高確からの転落時の移行先は内部抽選です。ステージ移行だけを転落と通常B選択の確定結果にはできません。',['review','mode'],perc([10.2,10.9,11.7,12.5,16,16.8]))
    m.numeric('lamp','世直し提灯の点灯',rates([172.2,170.6,169.8,167.6,166.4,162.8]),'前兆を含む通常時のゲーム数と新たな世直し提灯点灯を記録。AT中を除き、同じ点灯の継続表示を繰り返し加算しません。前兆を除く表とは混ぜません。',['review','mode'],group='komon-entry')
    m.block('lamp-without-prelude','前兆を除く提灯点灯率','1/143.5～1/134.7は前兆を含まない母数の表です。内部前兆を毎ゲーム確定除外できないため、前兆を含む通常ゲーム数には使いません。',['review','mode'],rates([143.5,141.9,141.2,139.2,138.1,134.7]))
    cond(m,'lamp-at','提灯点灯からのAT',[41.6,43,47.2,53.2,58.3,60],'世直し提灯が新たに点灯した回数と、その点灯でATに当選した回数を記録。1点灯の前兆を1機会として、継続表示や途中の別契機の当選を重ねません。',['review','mode'],'KOMON_LAMP_TRIAL',group='komon-entry')
    cond(m,'sakura50','50Gで千年桜へ移行',[20.3,21.1,21.9,22.7,23.4,25],'世直し提灯点灯間のゲーム数が50Gへ到達した機会と千年桜移行を記録。他の100/310/470/710G到達やレア役契機のステージ移行を混ぜません。',['review','mode'],'KOMON_50G_TRIAL',group='komon-entry',old=['M06-C03'])
    m.numeric('mystery','謎当たり',rates([48782.3,30717.4,23806.8,8587,7854.4,6715.3]),'通常時のゲーム数と、レア役・規定G数・狙ええ目・天井などの契機がない提灯点灯から当選したATを記録。契機を追跡できなかった当選は謎当たりへ加算しません。',['review','mode','spec'],group='komon-entry',old=['M06-C04'])
    m.block('sakura-role','千年桜の狙ええ目','設定1の1個停止1/32.9・2個1/137.5・3個1/4527.1・合算1/26.4だけ掲載。他設定の値を補間できません。',['review','audit'],{'1':[32.9,137.5,4527.1,26.4]},old=['M06-C05'])
    for cid,title in [('stamp-start','セット開始スタンプ'),('stamp-end','AT終了スタンプ')]:m.evidence(cid,title,[exact(c,'設定'+str(k)+'以上' if k<6 else '設定6') for c,k in [('可',2),('吉',3),('良',4),('優',5),('極',6)]],'表示されたスタンプを発生場面ごとに記録。出現率は確認できないため、非出現回数は推測に使いません。',['review','audit'],old=['M06-C06'] if cid=='stamp-start' else [])
    m.evidence('payout','獲得枚数表示',[exact(str(n)+'OVER','設定'+str(k)+'以上' if k<6 else '設定6') for n,k in [(444,4),(555,5),(666,6)]],'AT中に表示された特定枚数だけを記録します。',['review','audit'],old=['M06-C07'])
    for cid,label,vals in [('lamp-weak1','弱レア役1回の提灯',[.8,.8,.8,1.2,1.2,1.6]),('lamp-weak2','弱レア役2回の提灯',[3.5,3.5,3.5,3.9,3.9,4.3]),('lamp-strong1','強レア役1回の提灯',[24.2,24.2,24.2,24.6,25,26.2])]:m.block(cid,label,'通常A・Bに限定された内部モード別の抽選です。内部モードを確定できない通常レア役回数には適用できません。',['review','mode'],perc(vals))
    rank(m,['at-initial','mystery','lamp-at','sakura50','lamp'],'komon-entry')
    m.notes=['AT・謎当たり・提灯を保持し同じ当選を重ねない。','千年桜の狙ええ目は設定1のみ。通常レア役率とモード依存の点灯を分離。','通常A/B昇格と高確転落の公表値を非観測理由付き保持。','開始/終了のスタンプは異なる観測機会。枚数も別に記録。','前兆を含む/含まない点灯率を分離し、50Gを他のゾーンに混ぜない。','2024年L黄門ちゃま天L2。CZを捏造せず、引き戻し・リセット短縮と通常当選を分ける。'];m.audit=['提灯点灯2母数とAT期待度、昇格2回・転落を一次候補へ追加。'];m.save()

def machine7():
    m=Machine(7);m.queries=['パチスロ ナイツ 終了画面 スイカ 昇格 設定差','site:yamasa.co.jp toranomaki tr_nigt 設定 確率','ナイツ 2023 決まり手 リーチ目 A F リセット フラグM']
    m.source('official','https://www1.yamasa.co.jp/toranomaki/tr_nigt/kihon.html','山佐ナイツ基本スペック');m.sources[-1]['sourceType']='manufacturer';m.source('mechanics','https://www1.yamasa.co.jp/toranomaki/tr_nigt/owltw.html','山佐開発者のフラグM・スタンバイ');m.source('bonus','https://www1.yamasa.co.jp/toranomaki/tr_nigt/bns.html','山佐疑似ボーナスと状態別種別');m.source('audit','https://1geki.jp/slot/s_pachisuro_nights/0/','ナイツ終了画面率とリーチ目全表');m.source('flags','https://p-gabu.jp/guideworks/machinecontents/detail/6372/summarize','決まり手チェック・各種フラグ')
    for cid,label,vals,old in [('hyper','ハイパーBIG',[296.4,290.4,279.7,264.9,248.7,231.7],'M07-C01'),('challenge','チャレンジBIG',[409.8,391,375.3,360.3,353.4,355.5],'M07-C02')]:m.numeric(cid,label,rates(vals),'通常ゲーム数と疑似ボーナスの種別別当選を記録。スタンバイやボーナス消化中を母数に入れず、昇格後を元の当選と別のボーナスへ加算しません。',['official'],group='nights-types',kind='MUTUALLY_EXCLUSIVE_CATEGORIES',old=[old])
    for f in m.findings:f['dependencyReason']='同じ通常ゲームの結果はハイパーBIG・チャレンジBIG・非当選の排他的な内訳です。合算をさらに独立加算しません。'
    rows=[[41.9,2.4,34.3,2.4,0,13.2,2.4,0,3.3,0,0],[33.6,2.4,41.1,2.4,0,14.3,0,0,3.7,2.4,0],[39.5,2.4,32.4,0,.5,15.7,2.4,.5,4.2,2.4,0],[31,0,38,2.4,.5,17.8,2.4,0,5,2.4,.5],[35.5,2.4,29.1,2.4,0,18.8,2.4,.5,5.8,2.4,.5],[28.1,2.4,34.4,2.4,.5,19.5,2.4,.5,6.6,2.4,.5]]
    labels=['何もなし','何もなし＋パネフラ','フクロウ','フクロウ＋パネフラ','フクロウ＋クレオフ','満月','満月＋パネフラ','満月＋クレオフ','赤満月','赤満月＋パネフラ','赤満月＋クレオフ']
    cats=[unknown(labels[0],'奇数示唆'),exact(labels[1],'設定4否定'),unknown(labels[2],'偶数示唆'),exact(labels[3],'設定3否定'),exact(labels[4],'設定3・4・6'),unknown(labels[5],'高設定示唆（弱）'),exact(labels[6],'設定2否定'),exact(labels[7],'設定3・5・6'),unknown(labels[8],'高設定示唆（強）'),exact(labels[9],'設定1否定'),exact(labels[10],'設定4以上')]
    category(m,'end-pattern','ボーナス終了画面',labels,rows,'各ボーナス終了で画面とパネルフラッシュ・クレオフ音の組を1区分だけ記録。単独画面と複合画面を同時に加算しません。フクロウ等は液晶下部の表示です。',['audit','flags'],'NIGHTS_BONUS_END_TRIAL',old=['M07-C03'],cats=cats)
    flagRates={'A':[1040.25,1024,1008.25,949.8,897.75,851.12],'B':[1680.41,1489.45,1285.02,1149.75,1040.25,949.8],'C':[1820.44,1771.24,1680.41,1598.44,1524.09,1456.36],'D':[1820.44,1771.24,1680.41,1598.44,1524.09,1456.36],'E':[1024,992.97,963.76,910.22,862.32,819.2],'F':[2184.53,2114.06,2048,1927.53,1820.44,1724.63]}
    for flag,vals in flagRates.items():m.numeric('flag-'+flag,'リーチ目役'+flag,rates(vals),'通常時のゲーム数とボーナス中PUSHの決まり手チェックで確認した当選フラグを記録。見かけの停止形だけで判断せず、ボーナス中やスタンバイ中に成立した役を混ぜません。',['audit','flags'],group='nights-flags',kind='MUTUALLY_EXCLUSIVE_CATEGORIES',old=['M07-C04'] if flag=='A' else [])
    for f in m.findings:
        if f['findingId'].startswith('flag-'):f['dependencyReason']='同じ通常ゲームで成立するA～Fは排他的なフラグです。その他の役を補数にし、各フラグと合算を重ねません。'
    m.evidence('trophy','ケロットトロフィー',[exact(c,'設定'+str(k)+'以上' if k<6 else '設定6') for c,k in [('銅',2),('銀',3),('金',4),('ケロット柄',5),('虹',6)]],'ボーナス終了時に表示されたトロフィーを記録。色の出現確率は補わず設定の絞り込みに使用。',['flags'])
    m.block('bonus-upgrade','ボーナス中のスイカ昇格','スタンバイ中やチャレンジBIG中の役による昇格は通常初当たりと別です。成立役を完全に見抜けない区間と設定1・6のみの種別比率から、全設定の昇格率を作れません。',['mechanics','bonus'],{'nonHyperTypeRatioSetting1':{'hyper':25.4,'challenge':74.6},'nonHyperTypeRatioSetting6':{'hyper':27.2,'challenge':72.8}},old=['M07-C05'])
    m.nodiff('flag-m','リセット直後のフラグM','メーカーがリセット後の数ゲーム間だけの特殊フラグと説明。設定差のない1/16384を通常時全体の差として使いません。',['mechanics'],{'rate':'1/16384','afterResetGames':'NUMBER_NOT_PUBLISHED'})
    m.notes=['疑似ボーナスAT機でHB/CBを排他内訳にする。','A～Fは決まり手チェックで観測可能。G～Mは全設定共通、Mはリセット数Gのみ。','ハイパーゾーン・スタンバイ・昇格を通常成立フラグと区別。','終了画面とパネフラ・クレオフの11区分を数値と同一制約入力で保存。','昇格と通常ボーナスを二重加算しない。トロフィーは出現率を補わない。','SナイツYTCC（2023）。Aタイプ総Gのみを誤適用せずボーナス消化を分離。'];m.audit=['公式でAT・疑似ボーナスを確認。リーチ目と終了複合分布を追加。'];m.save()

def machine8():
    m=Machine(8);m.queries=['戦国 恋姫 設定判別 謎当たり レア役','戦国 恋姫 姫くりパネル REG シナリオ 選択率 設定','戦国 恋姫 ボーナス 入賞 PUSH 青7 目押し モード リセット']
    m.source('review','https://nana-press.com/kaiseki/machine/573/15816/','戦国恋姫設定抽選と全シナリオ');m.source('audit','https://1geki.jp/slot/s_sengokukoihime/0/','恋姫全確率・当選フラグ確認');m.source('spec','https://www.p-world.co.jp/machine/database/9854','恋姫AT仕様・当選フラグ告知')
    scope='疑似ボーナスを消化していない通常ゲーム数とBIG・REGの全出現を記録。ボーナス後も通常ゲームを継続して数え、出現回数と初当たりを別々へ重ねません。'
    for cid,label,vals,old in [('big','BIG出現率',[268.4,263.7,254.4,237.6,227.4,216.5],'M08-C09'),('reg','REG出現率',[404.4,398.7,392.2,370.6,357.2,349.2],'M08-C10')]:m.numeric(cid,label,rates(vals),scope,['review','audit'],group='koihime-bonus',kind='MUTUALLY_EXCLUSIVE_CATEGORIES',old=[old])
    for f in m.findings:f['dependencyReason']='BIG・REGは同じ通常ゲームの排他的な内訳です。合算をさらに独立加算しません。'
    m.numeric('watermelon','スイカ出現率',rates([64,61.1,58.1,55.7,53.2,51.2]),'通常ゲーム数と、目押しで確認したスイカ成立を記録。疑似ボーナス中や取りこぼして判別できなかった役を加算しません。',['review','audit'],old=['M08-C11'])
    for cid,title,vals in [('cherry-hit','チェリーからのボーナス',[8.6,9.4,9.8,11.3,12.9,13.7]),('watermelon-hit','スイカからのボーナス',[.4,.4,.8,1.2,1.2,1.6]),('chance-hit','チャンス目からのボーナス',[18,18,18.4,19.5,19.9,20.3])]:cond(m,cid,title,vals,'通常時の該当役成立とその役によるボーナスを記録。入賞時PUSHの当選フラグ告知で契機を確認し、別役が重なり区別不能な機会は除外。チャンス目は裏・裏超チャンス目を除き青7狙い手順で区別します。',['review','audit','spec'],cid.upper().replace('-','_')+'_TRIAL',group='koihime-path',old=['M08-C01'] if cid=='cherry-hit' else [])
    m.numeric('mystery','謎当たり',rates([21845.3,16384,13107.2,9362.3,5957.8,4369.1]),'通常ゲーム数と、ボーナス入賞時PUSHが白高速点滅だった当選を記録。出目だけではリーチ目役Eと区別できないため、フラグ告知を確認できなかった当選は除外。',['review','audit','spec'],group='koihime-path',old=['M08-C02'])
    m.numeric('rare-all','レア小役合算',rates([23.8,23.4,22.9,22.5,22.1,21.7]),'通常ゲーム数と公表表に対応するレア小役の合計を記録。スイカを別に数えた場合は合算へ重ねて推測しません。',['review','audit'],group='koihime-roles')
    rank(m,['watermelon','rare-all'],'koihime-roles')
    labels=['順順','逆順','変順']+['特殊'+str(i) for i in range(4,13)]
    rows=[[84,15,1]+[0]*9,[78.5,20,1.5]+[0]*9,[83,15,2]+[0]*9,[73,20,2.5]+[.5]*9,[77.5,15,3]+[.5]*9,[72,20,3.5]+[.5]*9]
    scopePanel='BIGの姫くりパネル10枚を1巡だけ観測し、前半5枚と後半5枚の順番を1区分で記録。11枚目からの再巡回を別機会に数えず、10枚を確認できなかったBIGは対象外。順順=①②③④⑤⑥⑦⑧⑨⑩、逆順=⑤④③②①⑥⑦⑧⑨⑩、変順=①③⑤②④⑥⑦⑧⑨⑩。特殊4～12は出典の同番号の並びです。'
    category(m,'panel','姫くりパネル',labels,rows,scopePanel,['review','audit'],'KOIHIME_PANEL_TRIAL',old=['M08-C04'],cats=[display('順順','通常パターン'),unknown('逆順','偶数示唆'),unknown('変順','高設定示唆')]+[exact('特殊'+str(i),'設定4以上') for i in range(4,13)])
    labelsReg=['久遠→ひよ子','一葉→鞠','久遠→朔夜','一葉→龍巳','久遠→エーリカ','一葉→エーリカ','久遠→ちい子','一葉→ちい子','久遠→きよ','一葉→きよ','久遠→鬼','一葉→鬼','久遠→全員集合','一葉→全員集合']
    rowsReg=[[32.5,32.5,13,13,4,4,0,0,.5,.5,0,0,0,0],[26.55,32.45,13.5,16.5,3.6,4.4,.9,1.1,.45,.55,0,0,0,0],[28.5,28.5,15,15,5,5,0,0,1,1,.5,.5,0,0],[24.75,30.25,13.5,16.5,4.5,5.5,.9,1.1,.9,1.1,.45,.55,0,0],[26.5,26.5,15,15,6,6,0,0,2,2,.5,.5,0,0],[22.5,27.5,13.5,16.5,5.4,6.6,.9,1.1,1.8,2.2,.45,.55,.5,.5]]
    catsReg=[display(c,'通常パターン') for c in labelsReg[:4]]+[unknown(c,'高設定示唆（弱）') for c in labelsReg[4:6]]+[exact(c,'設定2・4・6') for c in labelsReg[6:8]]+[unknown(c,'高設定示唆（強）') for c in labelsReg[8:10]]+[exact(c,'設定3以上') for c in labelsReg[10:12]]+[exact(c,'設定6') for c in labelsReg[12:]]
    category(m,'reg-cast','REGキャラ紹介',labelsReg,rowsReg,'REG1回の1枚目と5枚目を組で記録。1枚目が久遠か一葉かを確認し、同じREGの5枚を5機会に数えません。',['review'],'KOIHIME_REG_TRIAL',old=['M08-C05'],cats=catsReg)
    m.evidence('voice','BIGテンパイボイス',[unknown('第2停止で特殊ボイス','高設定示唆')],'1回目の狙え指示のみ有効。赤7BIGは右リールのサンド目をビタ押し、青7BIGは右リール青7を目押ししたときの第2停止ボイスを記録。2回目以降や目押し失敗の非出現を母数へ入れません。',['review','audit'],old=['M08-C03'])
    m.evidence('big-end','BIG終了画面',[display('通常画面','通常パターン'),unknown('偶数示唆画面','偶数示唆'),unknown('高設定示唆・弱画面','高設定示唆（弱）'),unknown('高設定示唆・強画面','高設定示唆（強）'),exact('設定2否定画面','設定2否定'),exact('設定3否定画面','設定3否定')]+[exact(str(i)+'人集合','設定'+str(i)+'以上' if i<6 else '設定6') for i in range(2,7)],'BIG終了時の設定示唆画面を記録。次回示唆予告・俺の嫁コンプリート・ハーレムモード示唆は設定確定ではありません。',['review','audit'],old=['M08-C06'])
    m.evidence('reg-end','REG終了画面',[display('通常画面','通常パターン'),unknown('奇数示唆画面','奇数示唆'),unknown('偶数示唆画面','偶数示唆'),exact('設定2以上画面','設定2以上'),exact('ぶどう踏み','設定4以上'),exact('花見','設定6')],'REG終了時の画面を記録。BIGの人数集合や否定画面と分けます。',['review','audit'],old=['M08-C07'])
    m.evidence('coin','藤丸コイン',[exact(c,'設定'+str(k)+'以上' if k<6 else '設定6') for c,k in [('銅',2),('銀',3),('金',4),('デンジャー柄',5),('虹',6)]],'ボーナス終了時に表示されたコインを記録。',['review','audit'],old=['M08-C08'])
    m.block('chance-total','裏役込みチャンス目当選率','チャンス目合成の25.3～27.5％は裏役を含む別の集約です。青7手順で区別した通常チャンス目の当選率へ混ぜません。',['review','audit'],perc([25.3,25.3,25.7,26.8,27.1,27.5]))
    m.block('mode','ハーレムモード移行','状態・ボーナス履歴で挙動が変わりますが、全設定の内部モード選択率と確定観測条件を確認できません。終了予告を設定確定へ読み替えません。',['audit','spec'])
    m.notes=['BIG/REGは疑似ボーナスATの通常試行内訳。合算の二重評価禁止。','スイカとレア役合算は同じ成立役を含む。優先入力1つのみ。','当選フラグPUSH・青7手順・裏役を分離。謎当たりは白高速点滅で確認。','姫くり12パターンとREG14シナリオの全設定分布を保持。終了画面・コイン・ボイスを具体化。','姫くりは10枚1巡、REGは1回1シナリオ。繰返しパネルを別試行へ数えない。','S戦国恋姫FC、2023年AT機。Aタイプ分類を修正。'];m.audit=['原76候補のレア役契機を3条件へ展開。レア役合算・全シナリオ率を追加。'];m.save()

def machine9():
    m=Machine(9,(1,2,4,5,6));m.queries=['織田信奈 全国版 設定 初回戦略会議 リセット 書き換え','織田信奈 全国版 合戦 計略 被ダメージ 回避 駆け抜け','織田信奈 全国版 終了画面 トロフィー カスタム ED かるた']
    m.source('review','https://nana-press.com/kaiseki/machine/582/15864/','織田信奈全国版設定抽選・画面率');m.source('audit','https://1geki.jp/slot/s_odanobuna_zen/0/','織田信奈設定判別');m.source('spec','https://www.p-world.co.jp/machine/database/9871','初回戦略会議・合戦観測条件')
    m.numeric('at-initial','AT初当たり',rates([280.6,264.8,227.3,205.3,158.4],m.settings),'通常時のゲーム数と新規AT初当たりを記録。AT継続・引き戻しを初当たりへ加算しません。',['review','audit'],group='nobuna-entry',old=['M09-C01'])
    cond(m,'first-meeting','初回戦略会議からのCZ',[60.5,60.5,65.6,66.8,75],'設定変更後またはAT終了後の初回戦略会議を1機会として、合戦の刻へ移行したかを記録。2回目以降や途中着席で初回か不明な機会は除外します。',['review','spec'],'NOBUNA_FIRST_MEETING_TRIAL',group='nobuna-entry',old=['M09-C02'])
    m.block('first-rewrite','初回合戦の勝利書き換え','初回合戦開始時の内部勝利書き換えは4.7～31.3％ですが、実戦では通常の勝利と直接区別できません。AT開始時の姫乗せ突入だけでは別抽選も含むため書き換え当選へ代用しません。',['review','spec'],perc([4.7,6.6,13.3,16.8,31.3],m.settings),old=['M09-C03'])
    cond(m,'damage-avoid','合戦の被ダメージ回避',[5.1,5.1,7,7,11.7],'合戦の刻でハズレが成立し敵攻撃の対象となる機会と、その攻撃回避を記録。前ゲームで被ダメージを受けた直後の攻撃無効保障、守護結界など保証された無効化は除外します。',['review'],'NOBUNA_AVOID_TRIAL',group='nobuna-entry',old=['M09-C04'])
    cond(m,'tenka-after','駆け抜け後の天嫁統一',[1.4,2.7,3.8,4.7,5.3],'上乗せなくATを駆け抜けた終了を母数とし、救済の天嫁統一アタックへ突入した回数を記録。通常の上乗せを伴うAT終了と他契機の突入を除外。',['review','audit'],'NOBUNA_NO_ADD_END_TRIAL',old=['M09-C05'])
    m.evidence('eyecatch','アイキャッチ矛盾',[display('全員集合・信勝か信玄','対戦相手示唆'),exact('全員集合・信勝と信玄を否定','設定4以上')],'通常時の特殊全員集合アイキャッチ後に次回合戦の相手を確認。表示だけで設定4以上へ絞り込まず、信勝・信玄の両方を否定した場合のみ使います。',['review','audit'],old=['M09-C06'])
    m.evidence('end-screen','AT終了画面',[display('通常','通常パターン'),unknown('信奈①','設定2・4・5・6示唆'),unknown('信奈②','設定1・5・6示唆'),unknown('良晴①','高設定示唆（弱）'),unknown('良晴②','高設定示唆（強）'),exact('信奈③','設定2・4・5・6'),exact('信奈④','設定4以上'),exact('信奈＆良晴・誓い','設定5以上'),exact('ハーレム','設定6')],'AT終了画面を記録。特定設定濃厚の4画面に出現率があり、消化ゲーム数で変わります。ゲーム帯を区別せず単一の画面率を使いません。',['review','audit'],old=['M09-C07'])
    m.evidence('trophy','AT終了トロフィー',[exact('黒パネル','設定2以上'),exact('青パネル','設定2以上'),exact('金パネル','設定4以上'),exact('信奈柄パネル','設定5以上'),exact('虹パネル','設定6')],'表示されたパネルを記録。黒は次回予告ですが、今回出現時点で設定2以上。出現率はホールカスタムと前回黒・ゲーム帯で変わるため非出現を同じ率へ混ぜません。',['review','audit'],old=['M09-C08'])
    m.block('trophy-rates','トロフィーの出現率','前回の黒パネル・1000G区切り・ホールのカスタムで分布が変わります。カスタムを確認できない実戦では非出現の回数を公表表へそのまま適用できません。',['review','audit'],{'sourceTableURL':'https://nana-press.com/kaiseki/machine/582/15864/','requiredConditions':['previousBlackPanel','gameBand','hallCustomization'],'afterBlackSetting2BluePercent':100})
    m.evidence('ed-karuta','エンディングかるた',[display('良晴','通常パターン')]+[unknown(c,'設定2・4・5・6示唆') for c in ['五右衛門','半兵衛','犬千代']]+[unknown(c,'設定4以上示唆') for c in ['勝家','長秀','光秀']]+[exact(c,'設定2・4・5・6') for c in ['犬千代＆五右衛門','半兵衛＆光秀','半兵衛＆勝家']]+[exact(c,'設定4以上') for c in ['長秀＆勝家','長秀＆光秀']]+[exact('信奈（金）','設定5以上'),exact('信奈（虹）','設定6')],'エンディング中のレア小役で出たかるたを記録。弱チェリー・スイカと強チェリー・チャンス目は出現率が異なります。',['review','audit'],old=['M09-C09'])
    m.block('strategy','合戦の計略発生','右下がりベルに対する援軍・士気・守護結界の率はありますが、初回勝利書き換えや既存の守護結界などと同時に処理される結果の区分を今回の資料だけでは確定できません。種類別の公表値を保持し、保障と抽選を混ぜません。',['review'],{'army1000':[9.8,9.8,9.8,11.7,11.7],'army2000':[4.7,4.7,4.7,6.3,6.3],'morale':[25.4,25.4,25.4,30.5,30.5],'barrier':[5.1,5.1,5.1,6.6,6.6]})
    rank(m,['at-initial','first-meeting','damage-avoid'],'nobuna-entry')
    m.notes=['設定1/2/4/5/6のAT初当たりと初回戦略会議を保存。','合戦の右下がりベル・ハズレ条件を区別し、保障付き回避を除外。','開始時勝利書き換えは内部抽選。姫乗せだけで確定としない。駆け抜け救済を別母数へ。','終了画面・パネル・EDかるたを具体化し、確定制約を保持。','終了画面のゲーム帯別率とトロフィーカスタム・黒履歴を保持。ED役条件を分離。','S織田信奈全国版SNT、2023年AT、設定3なし。リセット・AT後の初回条件を再確認。'];m.audit=['初回をリセット後のみへ限定する誤りを修正。AT終了後も対象。保障による回避は抽選の母数から除外。'];m.save()

def machine10():
    m=Machine(10,(1,2,3,4,6));m.queries=['スーパービンゴネオクラシック デジ周期 初回 21.8 設定','ビンゴネオクラシック リセット デジタル周期 ゲーム数 周期 判別','ビンゴネオクラシック 小役 設定 示唆 パネル L Hooah']
    m.source('review','https://nana-press.com/kaiseki/machine/589/16085/','ビンゴ設定差全表');m.source('audit','https://1geki.jp/slot/s_sbingo_nc/41/','デジタル・ゲーム周期の仕組み');m.source('reset','https://nana-press.com/kaiseki/machine/589/16088/','設定変更優遇・有利区間リセット');m.source('spec','https://p.hisshobon.jp/machine/4126/1/95777','ビンゴ基本仕様')
    m.numeric('bc-initial','BC初当たり',rates([354.6,330.1,315.8,299.7,283.8],m.settings),'通常ゲーム数と新規BC初当たりを記録。BC継続セット・カウントダウン7での継続を初当たりへ加算しません。',['review','spec'],group='bingo-entry',old=['M10-C01'])
    for cid,label,vals,old in [('first-cycle','デジ周期・初回',[21.8,25.1,28,31,34.1],'M10-C02'),('later-cycle','デジ周期・2回目以降',[16.5,19,21.2,23.4,25.7],'M10-C03')]:
        m.block(cid,label,'デジタル周期の到達時当選率は公開されていますが、同じロングリーチ告知がゲーム数周期でも発生します。初回か後続か・設定変更後の優遇・当選元を確定できない機会へ、この率を使うことはできません。',['review','audit','reset'],perc(vals,m.settings),old=[old])
        m.blocks[-1]['observedEventDefinition']='BINGO図柄規定回数到達によるデジタル周期のみ。レア役短縮を含む。ゲーム数周期は別。'
    m.evidence('setting-l','設定Lの外観',[display('デモ中の下パネル消灯','設定Lの可能性。通常の設定1・2・3・4・6とは別。')],'デモ中の下パネル消灯を記録。通常統計の候補に設定Lや非搭載の設定5を加えません。',['spec'],old=['M10-C04'])
    m.nodiff('game-cycle','ゲーム数周期の当選','111～999Gの当選期待度は全設定共通と掲載。デジタル周期の21.8～34.1％とは違う抽選です。',['audit'],{'111':20,'222':10,'333':20,'444':10,'555':15,'666':10,'777':27,'888':11,'999':100})
    m.nodiff('bingo-cycle-length','BINGO図柄規定回数','初回・後続の11/33/55/77/99回振り分けは全設定共通です。周期の短さを設定差の当選率へ置き換えません。',['audit'],{'first':[20,26.7,20,33.3,0],'later':[9.8,25.1,20,25.1,20]})
    m.block('reset-enhancement','設定変更後の周期優遇','少ない規定回数と当選期待度の優遇は確認できますが、通常初回表と同じという根拠がありません。設定変更の確定判別も未解明のため、朝一の周期を通常周期と混ぜて計算しません。',['reset','audit'])
    m.notes=['BC初当たり全5値を保持しCD7の継続を分離。','図柄規定回数・短縮とゲーム数到達を別抽選として保存。','デジタル周期は初回/後続と設定変更優遇を分ける。同じ前兆から当選元を断定しない。','設定Lはデモ下パネル消灯、通常推測の候補に含めない。','ゲーム数周期・デジタル規定回数の全設定共通値を保存。平均108/128Gで母数を推定しない。','SスーパービンゴHH1、2023年。BC終了後の区間リセットと設定変更を同一視しない。'];m.audit=['独立媒体一撃で初回/後続の全値を一致確認。ただし同じ告知で周期契機を直接識別できない問題を記録。'];m.save()

if __name__=='__main__':
    for n in map(int,sys.argv[1:] or range(1,11)):globals()['machine'+str(n)]()
