import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ACTIVE = new Set(['INCLUDE_PRIMARY','INCLUDE_SUPPORT']);
const arr = v => Array.isArray(v) ? v : [];
const obj = v => v && typeof v === 'object' && !Array.isArray(v);
const read = p => JSON.parse(fs.readFileSync(p,'utf8'));
const exists = p => fs.existsSync(p);
const uniq = xs => [...new Set(xs.filter(Boolean))];

function isSelected(f){ return ACTIVE.has(f?.adoptionCategory); }
function isPublishedActive(f){ return f?.calculationRole !== 'DISPLAY_ONLY' && f?.probabilityEngineUsage !== false && !['EXCLUDE','DISPLAY_ONLY'].includes(f?.adoptionCategory); }
function add(flags,severity,code,detail,featureIds=[]){
  const key=`${code}|${detail}|${[...featureIds].sort().join(',')}`;
  if(!flags.some(x=>x._key===key)) flags.push({_key:key,severity,code,detail,featureIds});
}
function allFeatureInputs(f){
  const out=[];
  for(const k of ['numeratorInputId','denominatorInputId','conditionedOnInputId','trialCountInputId']) if(f?.[k]) out.push(f[k]);
  for(const k of ['categoryInputIds','optionalCategoryInputIds','denominatorInputIds','trialInputIds']) out.push(...arr(f?.[k]));
  if(obj(f?.categorySubtractInputIds)) for(const [base,subs] of Object.entries(f.categorySubtractInputIds)) out.push(base,...arr(subs));
  return uniq(out);
}
function observedEventInputs(f){
  const out=[];
  if(f?.numeratorInputId) out.push(f.numeratorInputId);
  const subtractBases=new Set(Object.keys(obj(f?.categorySubtractInputIds)?f.categorySubtractInputIds:{}));
  for(const id of [...arr(f?.categoryInputIds),...arr(f?.optionalCategoryInputIds)]) {
    // A total count reused as denominator and transformed into a residual category is a
    // conditional factorization (e.g. REG total -> cherry REG / single REG), not a duplicate event.
    if(id===f?.denominatorInputId && subtractBases.has(id)) continue;
    out.push(id);
  }
  return uniq(out);
}
function scalarProbabilities(f){
  if(!obj(f?.probabilities)) return null;
  const vals=Object.values(f.probabilities);
  return vals.length && vals.every(Number.isFinite) ? vals : null;
}
function expectedAt7000(pub,sel){
  const ps=scalarProbabilities(pub), ex=sel?.difficultyExposure;
  if(!ps || !obj(ex) || ex.mode!=='per_game' || !Number.isFinite(ex.factor) || ex.factor<=0) return null;
  const xs=ps.map(p=>p*7000*ex.factor); return {min:Math.min(...xs),max:Math.max(...xs)};
}
function oldGenerationSignal(selection,version){
  const active=arr(selection?.features).filter(isSelected);
  const legacyInputs=arr(selection?.inputs).filter(x=>x?.legacyContractSource).length;
  const noReason=active.filter(x=>!String(x?.userReason??'').trim()).length;
  const noExposure=active.filter(x=>x?.difficultyParticipation==='INCLUDE'&&!obj(x?.difficultyExposure)).length;
  let score=0;
  if(version==='0.1.0') score+=2; else if(/^0\.1\./.test(version??'')) score+=1;
  if(legacyInputs>=3) score+=2; else if(legacyInputs) score+=1;
  if(noReason) score+=Math.min(2,noReason);
  if(noExposure) score+=2;
  return {score,legacyInputs,noReason,noExposure};
}
function selectionInputMap(selection){ return new Map(arr(selection?.inputs).map(x=>[x.id,x])); }
function featureUsesPredecessor(sel,inputMap){
  const ids=uniq([sel?.numeratorInputId,sel?.denominatorInputId,...arr(sel?.categoryInputIds),...arr(sel?.optionalCategoryInputIds),...arr(sel?.denominatorInputIds),...arr(sel?.trialInputIds)]);
  return ids.some(id=>inputMap.get(id)?.observationScope==='PREDECESSOR_SNAPSHOT');
}

export function auditMachineDataStatistics(root){
  const machinesDir=path.join(root,'machines'), researchDir=path.join(root,'research');
  const rows=[];
  for(const de of fs.readdirSync(machinesDir,{withFileTypes:true}).filter(x=>x.isDirectory()).sort((a,b)=>a.name.localeCompare(b.name))){
    const machineId=de.name, mp=path.join(machinesDir,machineId,'machine-package.json');
    if(!exists(mp)) continue;
    const machine=read(mp), sp=path.join(researchDir,machineId,'selection-data.json'), selection=exists(sp)?read(sp):null;
    const flags=[], info=[];
    const pubs=arr(machine?.features?.features).filter(isPublishedActive), pubById=new Map(pubs.map(f=>[f.featureId,f]));
    const inputMap=selectionInputMap(selection);

    if(!selection) add(flags,'HIGH_RISK','SELECTION_DATA_MISSING','SelectionDataがありません');

    // 1) Same observed event count entering multiple active likelihoods.
    const owners=new Map();
    for(const f of pubs) for(const id of observedEventInputs(f)){ if(!owners.has(id)) owners.set(id,[]); owners.get(id).push(f.featureId); }
    for(const [id,ids] of owners) if(ids.length>1){
      const explicitlySuppressed=ids.some(a=>arr(pubById.get(a)?.suppressedByFeatureIds).some(b=>ids.includes(b)));
      add(flags,explicitlySuppressed?'REVIEW':'HIGH_RISK','DUPLICATE_EVENT_INPUT',`${id} が複数の有効尤度で観測イベントとして使われています`,ids);
    }

    // 2) Exact duplicate binomial contracts.
    const contracts=new Map();
    for(const f of pubs){
      if(!f?.numeratorInputId||!f?.denominatorInputId) continue;
      const k=`${f.numeratorInputId}|${f.denominatorInputId}`;
      if(!contracts.has(k)) contracts.set(k,[]); contracts.get(k).push(f.featureId);
    }
    for(const [k,ids] of contracts) if(ids.length>1) add(flags,'HIGH_RISK','DUPLICATE_BINOMIAL_CONTRACT',`同一分子/分母契約 ${k}`,ids);

    // 3) Evidence and probability engine must not consume the same observation.
    const likelihoodInputs=new Map();
    for(const f of pubs) for(const id of allFeatureInputs(f)){ if(!likelihoodInputs.has(id)) likelihoodInputs.set(id,[]); likelihoodInputs.get(id).push(f.featureId); }
    for(const e of arr(machine?.evidence?.evidences)) if(likelihoodInputs.has(e?.inputId)) add(flags,'HIGH_RISK','EVIDENCE_FEATURE_OVERLAP',`${e.inputId} がEvidenceと確率Featureで重複評価されています`,likelihoodInputs.get(e.inputId));

    // 4) Difficulty participation contract.
    for(const s of arr(selection?.features).filter(isSelected)){
      if(s?.difficultyParticipation==='INCLUDE'&&!obj(s?.difficultyExposure)) add(flags,'HIGH_RISK','DIFFICULTY_EXPOSURE_MISSING','Difficulty参加FeatureにdifficultyExposureがありません',[s.featureId]);
      if(s?.difficultyParticipation==='INCLUDE'&&featureUsesPredecessor(s,inputMap)) add(flags,'HIGH_RISK','PREDECESSOR_DIFFICULTY_RISK','PREDECESSOR_SNAPSHOTを使用するFeatureがDifficultyへ参加しています',[s.featureId]);
      if(s?.difficultyParticipation==='INCLUDE'&&obj(s?.difficultyExposure)&&s.difficultyExposure.quality&&!['EXACT','DERIVED'].includes(s.difficultyExposure.quality)) info.push({code:'ESTIMATED_DIFFICULTY_EXPOSURE',featureId:s.featureId,quality:s.difficultyExposure.quality});
      const pub=pubById.get(s.featureId), ex=pub?expectedAt7000(pub,s):null;
      if(ex&&ex.max<1) add(flags,'REVIEW','LOW_FREQUENCY_7000G',`7000Gでも全設定で期待回数1回未満（最大${ex.max.toFixed(3)}回）です`,[s.featureId]);
    }

    // 5) State-dependent simple per-game model: review, not automatic error.
    for(const s of arr(selection?.features).filter(isSelected)){
      const text=`${s?.userReason??''} ${s?.difficultyExclusionReason??''}`;
      const pub=pubById.get(s.featureId);
      if(/(高確|低確|内部状態|モード|状態中|特定状態)/.test(text)&&pub&&['binomial','poisson'].includes(pub.modelType)&&s?.difficultyExposure?.mode==='per_game') add(flags,'REVIEW','STATE_DEPENDENT_SIMPLE_MODEL','状態依存の可能性があるFeatureを単純per_gameモデルで扱っています',[s.featureId]);
    }

    const version=machine?.machine?.machineDataVersion??machine?.machineDataVersion??null;
    const generation=oldGenerationSignal(selection,version);
    if(generation.score>=4) add(flags,'REVIEW','OLD_RESEARCH_STANDARD',`旧Selection基準の可能性が高いです (score=${generation.score})`);

    // Deferred signals for Phase 3/4: recorded but do not affect Phase 1 status/ranking.
    const firstHitInputs=arr(selection?.inputs).filter(x=>/初当り/.test(x?.name??'')).map(x=>x.id);
    if(firstHitInputs.length) info.push({code:'PHASE3_FIRST_HIT_INPUTS',inputIds:firstHitInputs});
    for(const f of pubs){ const w=f?.reliabilityProfile?.weight??f?.weight; if(Number.isFinite(w)&&Math.abs(w-1)>1e-9) info.push({code:'PHASE4_NON_DEFAULT_WEIGHT',featureId:f.featureId,weight:w}); }

    for(const f of flags) delete f._key;
    const status=flags.some(f=>f.severity==='HIGH_RISK')?'HIGH_RISK':flags.length?'REVIEW':'PASS';
    const riskScore=flags.reduce((n,f)=>n+(f.severity==='HIGH_RISK'?5:1),0)+Math.min(3,generation.score);
    rows.push({machineId,displayName:machine?.machine?.displayName??machineId,machineDataVersion:version,status,riskScore,generation,flags,info});
  }
  rows.sort((a,b)=>b.riskScore-a.riskScore||a.machineId.localeCompare(b.machineId));
  const codes=uniq(rows.flatMap(x=>x.flags.map(f=>f.code))).sort();
  const summary={machineCount:rows.length,pass:rows.filter(x=>x.status==='PASS').length,review:rows.filter(x=>x.status==='REVIEW').length,highRisk:rows.filter(x=>x.status==='HIGH_RISK').length,flagCounts:Object.fromEntries(codes.map(c=>[c,rows.reduce((n,x)=>n+x.flags.filter(f=>f.code===c).length,0)]))};
  return {schemaVersion:'machine-data-statistical-audit-v1',generatedAt:new Date().toISOString(),summary,machines:rows};
}

function md(r){
  const s=r.summary;
  return [
    '# MachineData Statistical Audit — Phase 1','',
    `- Machines: ${s.machineCount}`,
    `- PASS: ${s.pass}`,
    `- REVIEW: ${s.review}`,
    `- HIGH_RISK: ${s.highRisk}`,'',
    '## Statistical flag counts','',
    ...Object.entries(s.flagCounts).map(([k,v])=>`- ${k}: ${v}`),'',
    '## Priority ranking','',
    '| # | Machine | Status | Score | Statistical flags |',
    '|---:|---|---|---:|---|',
    ...r.machines.filter(x=>x.status!=='PASS').slice(0,50).map((m,i)=>`| ${i+1} | ${m.displayName} (${m.machineId}) | ${m.status} | ${m.riskScore} | ${m.flags.map(f=>f.code).join(', ')} |`),
    '','## Interpretation','',
    '- HIGH_RISK is a manual re-research priority, not an automatic assertion that the current MachineData is wrong.',
    '- Estimated/derived difficulty exposures and UI wording signals are recorded as info but do not inflate Phase 1 risk ranking.',
    '- No MachineData is modified by this audit.',
  ].join('\n')+'\n';
}

if(import.meta.url===`file://${process.argv[1]}`){
  const root=path.resolve(process.argv[2]??'.'), jsonOut=path.resolve(process.argv[3]??path.join(root,'reports','machine-data-statistical-audit-v1.json')), mdOut=path.resolve(process.argv[4]??path.join(root,'reports','machine-data-statistical-audit-v1.md'));
  fs.mkdirSync(path.dirname(jsonOut),{recursive:true}); fs.mkdirSync(path.dirname(mdOut),{recursive:true});
  const r=auditMachineDataStatistics(root); fs.writeFileSync(jsonOut,JSON.stringify(r,null,2)+'\n'); fs.writeFileSync(mdOut,md(r));
  console.log(`MachineData Statistical Audit: PASS ${r.summary.pass} / REVIEW ${r.summary.review} / HIGH_RISK ${r.summary.highRisk} / TOTAL ${r.summary.machineCount}`);
  for(const m of r.machines.filter(x=>x.status!=='PASS').slice(0,20)) console.log(`${m.status}\t${m.riskScore}\t${m.machineId}\t${m.flags.map(f=>f.code).join(',')}`);
}
