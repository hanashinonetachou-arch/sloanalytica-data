from prepare import *
import numpy as np
SAMPLES={
5:{'6':[('Nana',515,3000,'https://nana-press.com/kaiseki/machine/978/31567/'),('1geki',8824,50826,'https://1geki.jp/slot/s_nijex/s_nijex-4-branch/')],'1':[('1geki',8405,50502,'https://1geki.jp/slot/s_nijex/s_nijex-4-branch/')]},
6:{'6':[('Nana',554,3000,'https://nana-press.com/post/1624380'),('1geki',801,4449,'AUTO_ULTRA')]},
7:{'6':[('Nana',524,2988,'https://nana-press.com/post/1618292'),('1geki',1100,6604,'https://1geki.jp/slot/s_mrjuggler/6/')]},
8:{'6':[('Nana',487,2971,'https://nana-press.com/post/1612074'),('1geki',1554,9158,'https://1geki.jp/slot/s_jag_girls/6/')]},
9:{'6':[('Nana',471,3065,'https://nana-press.com/post/1589385'),('1geki',1215,7528,'https://1geki.jp/slot/s_gogojuggler3/4/')]}}
def juggler(i):
 m=Machine(i);u=re.findall(r'https://nana-press.com/kaiseki/machine/\d+/\d+/',m.raw)[:1];assert u
 if i==6:u=['https://nana-press.com/kaiseki/machine/838/24962/']
 rates={key:json.loads(re.search(key+r'_1_over:\s*(\[[^\]]+\])',m.raw).group(1))for key in ['big','reg']}
 orig=m.old['features'];bonuses=[f for f in orig if 'BONUS_OUTCOME' in f['researchFeatureId']];assert len(bonuses)==2
 for f in bonuses:
  pre='PREDECESSOR' in f['researchFeatureId'];s='着席前の総GとBIG・REG。自分の区間と重複させず、ボーナス消化中のGを含めない。'if pre else'自分が観測した通常時の総G。ボーナス消化中のGを含めず、着席前のGや当選を再加算しない。'
  m.numeric(f['researchFeatureId'],f['name'],partition(BIG=rates['big'],REG=rates['reg']),u,'PREDECESSOR_NORMAL_GAME_TRIAL' if pre else 'NORMAL_GAME_TRIAL',s)
 gid=next(f['researchFeatureId']for f in orig if 'GRAPE' in f['researchFeatureId']);est={};site_rows={}
 for setting,samples in SAMPLES[i].items():
  rr=[]
  for site,hits,games,url in samples:
   if url=='AUTO_ULTRA':
    matches=re.findall(r'https://1geki.jp/slot/s_ulmir[^\s;）)]+',m.raw);assert matches;url=matches[0].rstrip('/.,')+'/'
   rr.append({'site':site,'hits':hits,'eligibleNormalGames':games,'probability':hits/games,'reciprocal':games/hits,'originalUrl':url,'verifiedAt':'2026-10-26','verificationBasis':'INHERITED_ORIGINAL_SOURCE_RECORD','sampleType':'ORIGINAL_FIELD_TRIAL','manufacturerPublished':False})
  est[setting]=sum(x['probability'] for x in rr)/len(rr);se=(sum(x['probability']*(1-x['probability'])/x['eligibleNormalGames']for x in rr)/len(rr)**2)**.5
  site_rows[setting]={'independentSites':rr,'equalSiteMeanProbability':est[setting],'reciprocalOfProbabilityMean':1/est[setting],'siteCount':len(rr),'samplingStandardError':se,'approx95SamplingInterval':[max(0,est[setting]-1.96*se),min(1,est[setting]+1.96*se)],'intervalMeaning':'Binomial field-sample approximation; does not cover site selection, play bias, uncertain true setting, or definition errors. Not a likelihood for missing settings.'}
 urls=sorted({x['originalUrl']for s in site_rows.values()for x in s['independentSites']})
 missing=[s for s in m.settings if s not in est]
 f=m.attach({'findingId':gid,'label':'ブドウ（実戦推定・設定別分布不完全）','observationType':'partial_distribution','settingDistribution':est,'trialUniverse':'NORMAL_GAME_TRIAL','denominatorSemantics':'BIG・REGと共用する総G。ボーナス中を除く。ブドウは共通・単独合算を数える。','details':['独立した実戦集計ごとの出現確率を同じ重みで平均した推定値。メーカー公表値ではない。','設定'+ '・'.join(missing)+'の元実戦値が確認できず、全設定を比較できないため記録のみ・推測計算には使用しない。'],'empiricalSiteMeans':site_rows,'missingSettings':missing,'reopenPolicy':'NEW_CONCRETE_ORIGINAL_FIELD_SOURCE_ONLY','inferenceUse':'DISABLED_INCOMPLETE_SETTINGS'},urls)
 if i==5:
  f['empiricalReconciliation']={'excludedAdditionalReport':{'url':'https://1geki.jp/slot/s_nijex/0/','setting':6,'hits':1500,'games':8638},'reason':'Relation between earlier 8638G and later 50826G editorial reports is not established. Use the detailed larger record once for that site; do not silently pool possibly overlapping trials. All original records retained.','liveRecheck':'2026-10-27 branch page returned 502; inherited source record retained, not independently reverified this turn.','contaminatedVectorExcluded':{'grape':[6.06,6.04,6.04,6.04,6.02,5.8],'origin':'previous Im Juggler EX simulator; not Neo Im Juggler EX'}}
 for id,e in m.old_by.items():
  if any(x.get('findingId',x.get('blockId'))==id for x in m.rows):continue
  m.block(id,e['name'],'全設定の同じ定義の発生率が確認できない。告知時にチェリーが見えた回数を内部の当選契機と同一視せず、REG合計との二重利用もしない。',u,{'legacyCandidate':e})
 m.block('RF_CHERRY_MARGINAL','チェリー出現率','実戦記事ごとにボーナス同時当選を含む回数と含まない回数が混在する。定義が異なる値は平均せず、全設定の比較分布も作らない。',u+urls)
 m.block('RF_RARE_ROLES','ベル・ピエロ出現率','機種固有の全設定の出現率が確認できず、取りこぼしもあり得る。前機種や逆算表で不足値を補わない。',u)
 m.block('RF_PREMIUM_EFFECTS','プレミアム告知・楽曲・ランプ','ボーナス告知や楽曲変化であり、設定ごとの出現率や設定番号の確定条件は確認できない。高設定の数値情報として扱わない。',u)
 for id,e in m.e_old.items():m.block(id,e['name'],'今回の機種として設定制約を裏付ける具体的な根拠が確認できない。旧記録だけから設定を除外しない。',u,e)
 m.notes=['ユーザー指定のサイトごとの確率平均を実行。分母の平均や全サイトのG加重平均は使わない。','全設定値がないことを理由に再調査せず、実戦推定データを部分分布として評価・不採用経路へ保持。','着席前のBIG/REGと自分のBIG/REGは同じ率でも別区間。自分の数値を当日累積と混ぜない。']
 domains=['BIG・REG・非当選の排他的分布。合算は派生表示のみ。','機種固有の元実戦集計をサイト単位の確率平均。設定別の欠落を0や補間で埋めない。','単独REG/チェリー重複REGはREGの内訳。全設定値と正確な内部契機観測が揃わず閉じる。','プレミアム告知・楽曲・ランプの設定別率は未確認。高設定確定扱いをしない。','対象機種固有の設定番号を確定・否定する根拠は確認されていない。','Aタイプ。総Gを1欄で共有しボーナス消化Gを除く。着席前と自分の観測区間を区別する。']
 ui={'gameCount':{'label':'総G','scope':'ボーナス中のG数を含めない','oneSharedFieldPerObservationSegment':True,'noNormalPlusTotalDuplicate':True},'bonus':{'section':'ボーナス','fields':['BIG','REG'],'derived':['合算'],'columns':2,'quickAdd':1},'smallRoles':{'section':'通常時の小役','fields':['ブドウ','チェリー'],'usesSameGameCount':True,'currentNumericInference':False,'explanation':'実戦推定値は保存しているが、全設定の同一定義の値が揃わないため記録のみ。'},'futureGrapeBonusCombination':'Prove a joint outcome or correct likelihood factorization before combining; no independence assumption.','recordOnlyCopy':'記録のみ・推測計算には使用しない','unobserved':'NULL_NOT_ZERO','gameQuickAdd':50}
 p=m.finalize(ui,domains,coverage('Kitac',{'nana-press':'INHERITED_ORIGINAL_RECORD_PLUS_2026-10-27_TARGETED_RECHECK','1geki':'INHERITED_ORIGINAL_RECORD; see each current source-audit record'}));write(p/'research/grape-site-means.json',{'machineId':m.id,'siteMeans':site_rows,'missingSettings':missing,'formula':'mean(probability by independent original site); display reciprocal after averaging','fullSettingLikelihood':'DISABLED_INCOMPLETE_SETTINGS'});return p
if __name__=='__main__':print(juggler(int(sys.argv[1])))
