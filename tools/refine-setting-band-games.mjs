import fs from 'node:fs';
import { evaluateSettingBandGames } from './evaluate-setting-band-games.mjs';

function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJson(p, value) { fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n'); }

const [researchPath, selectionPath, outputPath] = process.argv.slice(2);
if (!researchPath || !selectionPath || !outputPath) {
  console.error('Usage: node tools/refine-setting-band-games.mjs <research.json> <selection.json> <output.json>');
  process.exit(1);
}

const research = readJson(researchPath);
const selection = readJson(selectionPath);

const THRESHOLDS = [0.6, 0.7, 0.8];
const START_GAMES = 500;
const DISPLAY_STEP = 100;
const COARSE_SIMS = 4000;
const REFINE_SIMS = 16000;
const SEED = 20260820;
const SAFETY_MAX_GAMES = 100_000_000;
const USER_FACING_DEFINITION = '低設定帯と高設定帯を見分けるために必要なゲーム数の目安です。両方の設定帯で目標正解率を満たす地点をシミュレーションで確認して表示します。';

function evaluatePoint(threshold, games, simulationsPerSetting) {
  const report = evaluateSettingBandGames(research, selection, { thresholds: [threshold], simulationsPerSetting, coarseStep: games, fineStep: games, maxGames: games, seed: SEED });
  const point = report.results?.[0] ?? null;
  return { report, point, passes: Boolean(point?.reachedWithinMaxGames && point.games === games && point.lowAccuracy >= threshold && point.highAccuracy >= threshold) };
}
function roundUp100(games) { return Math.max(DISPLAY_STEP, Math.ceil(games / DISPLAY_STEP) * DISPLAY_STEP); }
function findExponentialBracket(threshold) { let lowFail=0, high=START_GAMES; while(high<=SAFETY_MAX_GAMES){ const r=evaluatePoint(threshold,high,COARSE_SIMS); if(r.passes)return{lowFail,highPass:high}; lowFail=high; high*=2;} return null; }
function narrowBracket(threshold, bracket) { let {lowFail,highPass}=bracket; while(highPass-lowFail>1000){ const mid=roundUp100((lowFail+highPass)/2); if(mid>=highPass)break; const r=evaluatePoint(threshold,mid,COARSE_SIMS); if(r.passes)highPass=mid; else lowFail=mid;} return{lowFail,highPass}; }
function refineThreshold(threshold, bracket) { const start=roundUp100(Math.max(DISPLAY_STEP,bracket.lowFail-500)); const end=roundUp100(bracket.highPass+500); for(let g=start;g<=end;g+=DISPLAY_STEP){const r=evaluatePoint(threshold,g,REFINE_SIMS);if(r.passes)return r.point;} let lowFail=end,high=end*2; while(high<=SAFETY_MAX_GAMES){const hr=evaluatePoint(threshold,high,COARSE_SIMS);if(hr.passes){const n=narrowBracket(threshold,{lowFail,highPass:high});const ls=roundUp100(Math.max(DISPLAY_STEP,n.lowFail-500));const le=roundUp100(n.highPass+500);for(let g=ls;g<=le;g+=DISPLAY_STEP){const e=evaluatePoint(threshold,g,REFINE_SIMS);if(e.passes)return e.point;}lowFail=le;high=le*2;continue;}lowFail=high;high*=2;}return null; }

const metadata=evaluateSettingBandGames(research,selection,{thresholds:[0.6],simulationsPerSetting:COARSE_SIMS,coarseStep:START_GAMES,fineStep:DISPLAY_STEP,maxGames:START_GAMES,seed:SEED});
if(metadata.status!=='COMPLETE'){writeJson(outputPath,{...metadata,definition:USER_FACING_DEFINITION});console.log(`Setting band refined report: ${outputPath}`);process.exit(0);}
const results=THRESHOLDS.map(threshold=>{const bracket=findExponentialBracket(threshold);if(!bracket)return{threshold,games:null,reachedWithinSafetyLimit:false,safetyMaxGames:SAFETY_MAX_GAMES};const narrowed=narrowBracket(threshold,bracket);const point=refineThreshold(threshold,narrowed);if(!point)return{threshold,games:null,reachedWithinSafetyLimit:false,safetyMaxGames:SAFETY_MAX_GAMES};return{threshold,games:point.games,reachedWithinSafetyLimit:true,lowAccuracy:point.lowAccuracy,highAccuracy:point.highAccuracy,minimumBandAccuracy:point.minimumBandAccuracy};});
const refined={...metadata,analyzerVersion:'setting-band-discrimination-g-v1.0-refined',thresholds:THRESHOLDS,definition:'低設定帯と高設定帯を見分けるために必要なゲーム数の目安です。両方の設定帯で目標正解率を満たす最初の100G単位の地点を、高精度シミュレーションで確認して表示します。',simulation:{coarseSimulationsPerSetting:COARSE_SIMS,refinementSimulationsPerSetting:REFINE_SIMS,seed:SEED,search:'exponential_then_binary_then_local_100G_scan',startGames:START_GAMES,displayStep:DISPLAY_STEP,safetyMaxGames:SAFETY_MAX_GAMES,userFacingCap:null},results};
writeJson(outputPath,refined);console.log(`Setting band refined report: ${outputPath}`);
