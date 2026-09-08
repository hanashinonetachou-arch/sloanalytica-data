#!/usr/bin/env node
import fs from 'node:fs';

const read = p => JSON.parse(fs.readFileSync(p,'utf8'));
const write = (p,x) => fs.writeFileSync(p, JSON.stringify(x,null,2)+'\n');
const byRid = (arr,id) => arr.find(x=>x.researchFeatureId===id);
const settingProb = (f,s) => f.settingValues[s].probability;

function rebuildSummary(research, selection) {
  const names = new Map((research.features??[]).map(f=>[f.researchFeatureId,f.name]));
  const selected = (selection.features??[]).filter(f=>String(f.adoptionCategory).startsWith('INCLUDE'));
  const rejected = (selection.features??[]).filter(f=>f.adoptionCategory==='EXCLUDE');
  selection.selectionSummaryContract = {
    schemaVersion:'selection-summary-v1',
    evaluatedCount:(selection.features??[]).length,
    selectedCount:selected.length,
    rejectedCount:rejected.length,
    selected:selected.map(f=>({featureId:f.featureId,name:names.get(f.researchFeatureId)??f.featureId,reason:f.userReason??'採用'})),
    rejected:rejected.map(f=>({featureId:f.featureId,name:names.get(f.researchFeatureId)??f.featureId,reason:f.userFacingReason??f.rejectionReason??'不採用'}))
  };
}

// ---------------------------------------------------------------------------
// LB Triple Crown Seven: mutually exclusive normal-role composition
// ---------------------------------------------------------------------------
{
  const dir='research/LB_TRIPLE_CROWN_SEVEN_FG';
  const rp=`${dir}/research-data.json`, sp=`${dir}/selection-data.json`;
  const r=read(rp), s=read(sp);
  const ch=byRid(r.features,'RF_CHERRY'), pl=byRid(r.features,'RF_PLUM');
  if(!byRid(r.features,'RF_SMALL_ROLE_COMPOSITION')) {
    const settings=r.machine.settings;
    const settingDistributions={};
    for(const set of settings){
      const c=settingProb(ch,set), p=settingProb(pl,set);
      settingDistributions[set]={CHERRY:c,PLUM:p,OTHER:1-c-p};
    }
    r.features.push({
      researchFeatureId:'RF_SMALL_ROLE_COMPOSITION',
      name:'通常時小役構成（チェリー・プラム・その他）',
      factStatus:'verified',
      candidateModel:'multinomial',
      trialUnit:'通常ゲーム1G',
      observationScope:'通常時',
      numeratorDefinition:'チェリー・プラム・その他の各成立ゲーム数',
      denominatorDefinition:'通常ゲーム',
      categories:['CHERRY','PLUM','OTHER'],
      distributionMode:'complete',
      settingValues:{}, settingDistributions,
      sourceRefs:[...new Set([...(ch.sourceRefs??[]),...(pl.sourceRefs??[])])],
      crossSourceStatus:'single_source_major',
      notes:'RF_CHERRYとRF_PLUMの公開確率から、同一通常ゲーム上の排他的カテゴリとして構成したSelection用joint model。OTHERは1-CHERRY-PLUMで導出。'
    });
  }
  const fch=byRid(s.features,'RF_CHERRY');
  Object.assign(fch,{adoptionCategory:'EXCLUDE',difficultyParticipation:'EXCLUDE',difficultyExclusionReason:'joint小役構成へ統合したため単独FeatureはDifficultyにも参加させない。',userFacingReason:'チェリーには設定差があるが、プラムと同じ通常ゲーム上の排他的事象である。チェリー単独Binomialではなく「チェリー・プラム・その他」のMultinomialへ統合して同じ情報を一度だけ評価するため、単独Featureとしては不採用とする。'});
  delete fch.userReason; delete fch.numeratorInputId; delete fch.denominatorInputId;
  const fpl=byRid(s.features,'RF_PLUM');
  Object.assign(fpl,{adoptionCategory:'EXCLUDE',difficultyParticipation:'EXCLUDE',difficultyExclusionReason:'joint小役構成へ統合したため単独FeatureはDifficultyにも参加させない。',userFacingReason:'プラムには設定1約1/64.63から設定6約1/55.54の設定差があり、情報自体は有効。チェリーと別々のBinomialで重ねず、「チェリー・プラム・その他」のMultinomialへ統合して利用するため、プラム単独Featureとしては不採用とする。'});
  const joint={
    researchFeatureId:'RF_SMALL_ROLE_COMPOSITION',featureId:'FEAT_SMALL_ROLE_COMPOSITION',adoptionCategory:'INCLUDE_SUPPORT',weight:1,
    difficultyParticipation:'EXCLUDE',difficultyExclusionReason:'既存Difficulty reportがjoint化前のため、再生成後に参加可否を再評価する。',
    userReason:'チェリーとプラムは同一通常ゲーム上の排他的な小役。独立Binomialを重ねず、チェリー・プラム・その他の3カテゴリMultinomialとして一体評価する。設定1↔6の1試行あたり識別情報はチェリー単独の約1.9倍となり、プラムの追加情報を二重計上せず利用できる。',
    denominatorInputId:'INP_NORMAL_GAMES',numeratorInputId:'INP_CHERRY_COUNT',categoryInputIds:['INP_PLUM_COUNT'],residualCategoryLabel:'OTHER'
  };
  if(!byRid(s.features,'RF_SMALL_ROLE_COMPOSITION')) s.features.push(joint);
  const ci=s.inputs.find(x=>x.id==='INP_CHERRY_COUNT'); if(ci){ci.category='SEL_RF_SMALL_ROLE_COMPOSITION';ci.inferenceRole='INCLUDE_SUPPORT';}
  const pi=s.inputs.find(x=>x.id==='INP_PLUM_COUNT'); if(pi){pi.category='SEL_RF_SMALL_ROLE_COMPOSITION';pi.inferenceRole='INCLUDE_SUPPORT';}

  // BT replay+BB: retain EXCLUDE, but only with statistical/observability rationale.
  const bt=byRid(s.features,'RF_BT_REPLAY_BB');
  bt.userFacingReason='BT中リプレイ+BB in BBには設定差があるが、設定1=1/293.9・設定6=1/257.0で1 trialあたりの識別差が小さい。統計評価では設定1↔6でも80%識別目安が約111,474 BTゲーム、最難関の設定1↔2は95%目安が約28,374,158 BTゲームとなり、1日実戦で得られるBTゲーム数に対して追加情報量が極めて小さいため不採用とする。';

  // Specific cherry bonus outcomes: retain EXCLUDE after explicit conditional/joint review.
  byRid(s.features,'RF_SPECIFIC_BONUS_CHERRY_BB').userFacingReason='チェリー+BBは設定差を持つが、チェリー成立とBB成立の交差事象であり、採用する小役構成とBB初当りの双方に同じ成立ゲームが含まれる。条件付き分解も検討したが、チェリー以外のBB契機を含む完全なjoint分布が公開されておらず、現行データだけでは全体を二重計上なく因数分解できないため不採用とする。';
  byRid(s.features,'RF_SPECIFIC_BONUS_CHERRY_RB').userFacingReason='チェリー+RBは設定差を持つが、チェリー成立とRB成立の交差事象であり、採用する小役構成とRB初当りの双方に同じ成立ゲームが含まれる。条件付き分解も検討したが、チェリー以外のRB契機を含む完全なjoint分布が公開されておらず、現行データだけでは全体を二重計上なく因数分解できないため不採用とする。';

  // RB BGM canonical denominator repair: only eligible RBs in BB-origin 100G chain.
  const rb=byRid(r.features,'RF_RB_BGM');
  rb.trialUnit='BB後100G以内の連チャン条件を満たすRB入賞1回';
  rb.observationScope='BB後100G以内の連チャン中のRB入賞時';
  rb.denominatorDefinition='BB後100G以内の連チャン条件を満たすRB入賞回数（途中にRBを挟んでも条件継続中は対象）';
  rb.notes='安里屋ユンタ選択率はBB後100G以内の連チャン条件を満たすRBのみを母数とする。';

  rebuildSummary(r,s); write(rp,r); write(sp,s);
}

// ---------------------------------------------------------------------------
// Umineko 2: ART miss/common-bell mutually exclusive composition
// ---------------------------------------------------------------------------
{
  const dir='research/L_UMINEKO_2_A1';
  const rp=`${dir}/research-data.json`, sp=`${dir}/selection-data.json`;
  const r=read(rp), s=read(sp);
  const miss=byRid(r.features,'RF_ART_MISS'), bell=byRid(r.features,'RF_ART_COMMON_BELL');
  if(!byRid(r.features,'RF_ART_ROLE_COMPOSITION')) {
    const settingDistributions={};
    for(const set of r.machine.settings){
      const m=settingProb(miss,set), b=settingProb(bell,set);
      settingDistributions[set]={MISS:m,COMMON_BELL:b,OTHER:1-m-b};
    }
    r.features.push({researchFeatureId:'RF_ART_ROLE_COMPOSITION',name:'ART中役構成（ハズレ・共通ベル・その他）',factStatus:'verified',candidateModel:'multinomial',trialUnit:'ARTゲーム1G',observationScope:'ART中',numeratorDefinition:'ART中ハズレ・共通ベル・その他の各ゲーム数',denominatorDefinition:'ARTゲーム',categories:['MISS','COMMON_BELL','OTHER'],distributionMode:'complete',settingValues:{},settingDistributions,sourceRefs:[...new Set([...(miss.sourceRefs??[]),...(bell.sourceRefs??[])])],crossSourceStatus:'cross_checked',notes:'RF_ART_MISSとRF_ART_COMMON_BELLを同一ARTゲーム上の排他的カテゴリとして統合したSelection用joint model。'});
  }
  const fm=byRid(s.features,'RF_ART_MISS'); Object.assign(fm,{adoptionCategory:'EXCLUDE',difficultyParticipation:'EXCLUDE',difficultyExclusionReason:'joint ART役構成へ統合したため単独FeatureはDifficultyにも参加させない。',userFacingReason:'ART中ハズレは共通ベルと同一ARTゲーム上の排他的事象。ハズレの情報を捨てず、ハズレ・共通ベル・その他のMultinomialへ統合して一度だけ評価するため、単独Binomialとしては不採用とする。'}); delete fm.userReason;
  const fb=byRid(s.features,'RF_ART_COMMON_BELL'); Object.assign(fb,{adoptionCategory:'EXCLUDE',difficultyParticipation:'EXCLUDE',difficultyExclusionReason:'joint ART役構成へ統合したため単独FeatureはDifficultyにも参加させない。',userFacingReason:'ART中共通ベルは強い設定差を持つが、ART中ハズレと別々のBinomialで評価せず、ハズレ・共通ベル・その他のMultinomialへ統合して利用するため、単独Featureとしては不採用とする。'}); delete fb.userReason; delete fb.numeratorInputId; delete fb.denominatorInputId;
  if(!byRid(s.features,'RF_ART_ROLE_COMPOSITION')) s.features.push({researchFeatureId:'RF_ART_ROLE_COMPOSITION',featureId:'FEAT_ART_ROLE_COMPOSITION',adoptionCategory:'INCLUDE_SUPPORT',weight:1,difficultyParticipation:'EXCLUDE',difficultyExclusionReason:'joint化後のDifficulty reportを再生成してから参加可否を再評価する。',userReason:'ART中ハズレと共通ベルは同じARTゲームから生じる排他的カテゴリのため、独立Binomialではなくハズレ・共通ベル・その他のMultinomialとして一体評価する。共通ベル単独より追加の識別情報を安全に取り込める。',denominatorInputId:'INP_ART_MISS_TRIALS',numeratorInputId:'INP_ART_MISS_COUNT',categoryInputIds:['INP_ART_COMMON_BELL_COUNT'],residualCategoryLabel:'OTHER'});
  for(const id of ['INP_ART_MISS_COUNT','INP_ART_MISS_TRIALS','INP_ART_COMMON_BELL_COUNT']){const x=s.inputs.find(i=>i.id===id);if(x){x.category='SEL_RF_ART_ROLE_COMPOSITION';x.inferenceRole='INCLUDE_SUPPORT';}}

  // 1B/1C were explicitly joint-reviewed. Their standalone 80% requirements are >1.4M games.
  byRid(s.features,'RF_ROLE_1B').userFacingReason='1枚役Bは通常ゲーム上の排他的役としてjoint化を検討したが、設定1約1/102.1から設定6約1/100.4と差が非常に小さく、単独80%識別目安は約2,606,522G。確定役A等との正しいMultinomialに加えても実戦1日の追加情報量が小さいため、Researchには保持するが推測Featureには採用しない。';
  byRid(s.features,'RF_ROLE_1C').userFacingReason='1枚役Cは通常ゲーム上の排他的役としてjoint化を検討したが、設定1約1/114.2から設定6約1/111.5と差が非常に小さく、単独80%識別目安は約1,432,045G。確定役A等との正しいMultinomialに加えても実戦1日の追加情報量が小さいため、Researchには保持するが推測Featureには採用しない。';

  rebuildSummary(r,s); write(rp,r); write(sp,s);
}

console.log('Applied v6.14 Selection repairs for Triple Crown and Umineko2.');
