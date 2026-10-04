import fs from 'node:fs';
import path from 'node:path';

const batchId='batch-20261004-005';
const root=process.cwd();
const read=(p:string)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const app=(id:string)=>read('batches/'+batchId+'/artifacts/'+id+'/app_runtime/result.json').package;
const active=(pkg:any,id:string)=>(pkg.features?.runtimeProjection??[]).some((x:any)=>x.featureId===id&&x.runtimeStatus==='ACTIVE');
const feature=(pkg:any,id:string)=>(pkg.features?.features??[]).find((x:any)=>x.featureId===id);
const fail=(m:string)=>{throw new Error(m)};

{
 const p=app('L_TOARU_KAGAKU_NO_RAILGUN_2_FV');
 if(!active(p,'railgun-upper-cz-share'))fail('RAILGUN_UPPER_CZ_SHARE_INACTIVE');
 if(!active(p,'railgun-at-start-stage'))fail('RAILGUN_AT_START_STAGE_INACTIVE');
 if(feature(p,'railgun-at-start-stage')?.modelType!=='multinomial')fail('RAILGUN_STAGE_NOT_MULTINOMIAL');
}
{
 const p=app('L_ZETTAI_SHOGEKI_FORCE_FH');
 const ids=(p.features?.runtimeProjection??[]).filter((x:any)=>String(x.featureId).startsWith('direct-')&&x.runtimeStatus==='ACTIVE').map((x:any)=>x.featureId);
 if(ids.length<10)fail('ZETTAI_DIRECT_RATE_COVERAGE:'+ids.length);
}
{
 const p=app('L_KAKUMEIKI_VALVRAVE_2_JF');
 if(!active(p,'cz-bonus-end-screen-distribution'))fail('VALVRAVE_END_SCREEN_INACTIVE');
 if(feature(p,'cz-bonus-end-screen-distribution')?.modelType!=='multinomial')fail('VALVRAVE_END_SCREEN_NOT_MULTINOMIAL');
 const linked=(p.evidence?.evidences??[]).filter((x:any)=>(x.sourceEvidenceRefs??[]).includes('valvrave2-end-screen-exact'));
 if(linked.length!==3||linked.some((x:any)=>String(x.inputId??'').startsWith('REF_')))fail('VALVRAVE_EXACT_NOT_LINKED:'+linked.length);
 const expected=new Map([['ショーコ＆サキ（紫枠）：設定2以上','ショーコ_サキ_紫枠'],['ピノ＆プルー（銀枠）：設定4以上','ピノ_プルー_銀枠'],['集合画面（金枠）：設定6','集合画面_金枠']]);
 for(const x of linked)if(!String(x.inputId??'').includes(expected.get(x.name)??'__MISSING__'))fail('VALVRAVE_EXACT_WRONG_INPUT:'+x.name+':'+x.inputId);
}
{
 const p=app('L_AZURLANE_THE_ANIMATION_KN');
 if(!active(p,'at-end-screen-distribution'))fail('AZUR_END_SCREEN_INACTIVE');
 if(feature(p,'at-end-screen-distribution')?.modelType!=='multinomial')fail('AZUR_END_SCREEN_NOT_MULTINOMIAL');
 const linked=(p.evidence?.evidences??[]).filter((x:any)=>(x.sourceEvidenceRefs??[]).includes('at-end-screen'));
 if(linked.length!==3||linked.some((x:any)=>String(x.inputId??'').startsWith('REF_')))fail('AZUR_EXACT_NOT_LINKED:'+linked.length);
 const expected=new Map([['全員集合：設定2以上','全員集合'],['加賀＆赤城：設定4以上','加賀_赤城'],['パーティ：設定6','パーティ']]);
 for(const x of linked)if(!String(x.inputId??'').includes(expected.get(x.name)??'__MISSING__'))fail('AZUR_EXACT_WRONG_INPUT:'+x.name+':'+x.inputId);
}
{
 const p=app('L_SMASLO_TOKYO_REVENGERS_ZF');
 if(!active(p,'common-bell'))fail('TOKYO_COMMON_BELL_INACTIVE');
 if(!active(p,'at-first-hit'))fail('TOKYO_RUSH_FIRST_HIT_INACTIVE');
 const row=(p.v8?.machineResearchSummary?.notAdopted??[]).find((x:any)=>x.featureId==='initial-hit');
 const reason=String(row?.reason??'');
 if(!/設定差のある数値/.test(reason)||!/東卍RUSH初当たり/.test(reason)||!/過大/.test(reason))fail('TOKYO_INITIAL_REASON:'+reason);
 const middle=(p.v8?.machineResearchSummary?.notAdopted??[]).find((x:any)=>x.featureId==='middle-cherry');
 const middleReason=String(middle?.reason??'');
 if(!/7000G|7000/.test(middleReason)||!/基準未満|情報量/.test(middleReason))fail('TOKYO_MIDDLE_CHERRY_REASON:'+middleReason);
}
for(const id of ['L_TOARU_KAGAKU_NO_RAILGUN_2_FV','L_ZETTAI_SHOGEKI_FORCE_FH','L_KAKUMEIKI_VALVRAVE_2_JF','L_AZURLANE_THE_ANIMATION_KN','L_SMASLO_TOKYO_REVENGERS_ZF']){
 const p=app(id),summary=JSON.stringify(p.v8?.machineResearchSummary??{});
 if(/UI\s*Contract|数値入力Contract|UI契約|joint\b|categorical\b|candidate\s*contract|runtime\s*policy|dependency\s*model/i.test(summary))fail('INTERNAL_SUMMARY_TEXT:'+id);
 const research=read('batches/'+batchId+'/artifacts/'+id+'/research/result.json');
 const blocked=JSON.stringify(research.blockedItems??[]);
 if(/UI\s*Contract|数値入力Contract|UI契約|joint\b|categorical\b|candidate\s*contract|runtime\s*policy|dependency\s*model/i.test(blocked))fail('INTERNAL_BLOCK_TEXT:'+id);
}
console.log(JSON.stringify({status:'PASS',batchId,machines:5},null,2));
