import fs from 'node:fs';

const machines=[
  'L_FIRE_FORCE_2','L_UMINEKO_2_A1','L_KABANERI_UNATO_KESSEN_XX','L_JORMUNGAND_ND01G',
  'LB_TRIPLE_CROWN_SEVEN_FG','L_SHINUCHI_YOSHIMUNE_A1','L_KYOKOU_SUIRI_ST','L_AKUDAMA_DRIVE_TP',
  'L_MILLION_GOD_KISEKI_CX','L_GUNDAM_UNICORN_KAKUSEI_DRIVE_2JA'
];
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');
const norm=s=>String(s??'').replace(/[^A-Z0-9_]/g,'_');

function modeFor(rf){
  const text=`${rf.name??''} ${rf.observationScope??''}`;
  if(/ボイス|BGM|楽曲/.test(text)) return 'AUDIO_EVENT';
  if(rf.candidateModel==='multinomial'||/画面|キャラ|ロゴ|ポイント|振り分け|トロフィー|LED|点灯|終了/.test(text)) return 'VISUAL_EVENT';
  return 'MANUAL_COUNTER';
}
function sourceFor(rf,mode){
  const text=`${rf.name??''} ${rf.observationScope??''}`;
  if(/終了画面|終了時|終了LED|BGM|楽曲|トロフィー/.test(text)) return 'END_EVENT';
  return 'DIRECT_PLAY';
}
function labelForInput(i){return i?.name??i?.id??'';}

for(const machineId of machines){
  const base=`research/${machineId}`;
  const rp=`${base}/research-data.json`, sp=`${base}/selection-data.json`, op=`${base}/machine-observation-data.json`;
  if(!fs.existsSync(rp)||!fs.existsSync(sp)||!fs.existsSync(op)) continue;
  const r=read(rp), s=read(sp), o=read(op);
  if(o.schemaVersion!=='machine-observation-data-v2') continue;
  o.researchedAt='2026-09-08';
  const rfById=new Map((r.features??[]).map(x=>[x.researchFeatureId,x]));
  const inputById=new Map((s.inputs??[]).map(x=>[x.id,x]));
  const obsById=new Map((o.observations??[]).map(x=>[x.observationId,x]));
  const mapByFeature=new Map((o.featureMappings??[]).map(x=>[x.featureId,x]));

  for(const sf of s.features??[]){
    const adopted=String(sf.adoptionCategory??'').startsWith('INCLUDE');
    const existing=mapByFeature.get(sf.featureId);
    if(!adopted){
      if(existing){
        existing.usableForInference=false;
        existing.usableForDifficulty=false;
        existing.notes=`Selection ${sf.adoptionCategory}: 推測計算には参加させない。Research/Selection評価履歴の観測参照として保持。`;
      }
      continue;
    }
    if(existing){
      existing.usableForInference=true;
      if(existing.usableForDifficulty==null) existing.usableForDifficulty=false;
      continue;
    }
    const rf=rfById.get(sf.researchFeatureId);
    if(!rf) throw new Error(`${machineId}: adopted ${sf.featureId} missing Research feature ${sf.researchFeatureId}`);
    const suffix=norm(sf.featureId.replace(/^FEAT_/,''));
    let observationId=`OBS_${suffix}`;
    if(obsById.has(observationId)) observationId=`OBS_FEATURE_${suffix}`;
    const mode=modeFor(rf), sourceType=sourceFor(rf,mode);
    const ids=[sf.numeratorInputId,...(sf.categoryInputIds??[]),sf.denominatorInputId,...(sf.denominatorInputIds??[])].filter(Boolean);
    const categories=[...new Set(ids.map(id=>labelForInput(inputById.get(id))).filter(Boolean))];
    if(!categories.length) categories.push(rf.name);
    const excluded=[];
    if(rf.denominatorDefinition) excluded.push(`分母条件: ${rf.denominatorDefinition}`);
    if(rf.notes) excluded.push(rf.notes);
    excluded.push('対象条件外の試行を分母へ混ぜない','着席前累積値を自己実戦値へ混ぜない','未観測を観測済み0として扱わない');
    const obs={
      observationId,
      sourceType,
      observationMode:mode,
      status:'FOUND',
      label:rf.name,
      categories,
      timing:[rf.observationScope?`${rf.observationScope}で、${rf.trialUnit??'有効試行'}ごとに観測する`:`${rf.trialUnit??'有効試行'}ごとに観測する`],
      excludedConditions:[...new Set(excluded)],
      sourceRefs:rf.sourceRefs??[],
      notes:`Selection ${sf.featureId} (${sf.adoptionCategory}) の観測契約。Research分子=${rf.numeratorDefinition??'-'} / 分母=${rf.denominatorDefinition??'-'}`
    };
    o.observations.push(obs); obsById.set(observationId,obs);
    const mapping={
      featureId:sf.featureId,
      mappingType:'EXACT',
      observationIds:[observationId],
      collectionMethods:[mode],
      usableForInference:true,
      usableForDifficulty:false,
      notes:'Research/Selection再監査で追加されたFeatureを正本定義どおり観測する。条件分母・Hard Evidence除外・suppression契約を保持する。'
    };
    o.featureMappings.push(mapping); mapByFeature.set(sf.featureId,mapping);
  }

  // Keep the shared hard-evidence observation useful as Research recovered new deterministic evidence.
  const hard=o.observations.find(x=>x.observationId==='OBS_HARD_EVIDENCE_EVENTS');
  if(hard){
    const evidenceNames=(s.evidence??[]).map(e=>e.displayName??e.name).filter(Boolean);
    hard.categories=[...new Set([...(hard.categories??[]),...evidenceNames])];
  }
  write(op,o);
  console.log(`${machineId}: adopted=${(s.features??[]).filter(x=>String(x.adoptionCategory??'').startsWith('INCLUDE')).length} mappings=${o.featureMappings.length}`);
}
console.log('Next10 Observation mappings repaired.');
