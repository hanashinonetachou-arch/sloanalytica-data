/** Use delivered probabilities and collection surfaces without re-selecting features. */
export const isGenericAdoptionReason=(s:unknown)=>/^(?:現在の採用基準を満たしているため|採用条件を満たし、実戦で観測できる設定差|優先する設定推測項目を記録していない場合の補助)/.test(String(s??''));
const setting=(k:string)=>'設定'+k.replace(/^SET_/,'');
const pct=(p:number)=>Number((p*100).toFixed(2))+'%';
const rate=(p:number,g:boolean)=>g?(p===0?'発生なし':'1/'+Number((1/p).toFixed(1))):pct(p);
export function concreteAdoptionReason(pkg:any,id:string){
 const f=(pkg.features?.features??[]).find((f:any)=>f.featureId===id);if(!f)throw Error('ADOPTION_REASON_FEATURE:'+id);
 const inputName=(id:string)=>{const i=(pkg.inputs?.inputs??[]).find((i:any)=>i.id===id);return String(i?.name??i?.label??'').trim()};
 const section=(pkg.ui?.v8Sections??[]).find((s:any)=>(s.items??[]).some((n:any)=>n.featureId===id));
 let values:[string,number][],category='';
 if(f.modelType==='multinomial'){
  const rows=Object.entries(f.categoryProbabilities??{}) as [string,number[]][],ids=[f.numeratorInputId,...(f.categoryInputIds??[])];
  if(rows.length<2||rows.some(([,r])=>!Array.isArray(r)||r.length!==ids.length))throw Error('ADOPTION_REASON_CATEGORIES:'+id);
  let best=0,spread=-1;
  for(let i=0;i<ids.length;i++){const ps=rows.map(([,r])=>r[i]);if(ps.some(p=>!Number.isFinite(p)||p<0||p>1))throw Error('ADOPTION_REASON_PROBABILITY:'+id);const d=Math.max(...ps)-Math.min(...ps);if(d>spread){spread=d;best=i}}
  const visible=(section?.items??[]).flatMap((n:any)=>n.interaction?.categories??[]).find((c:any)=>c.inputId===ids[best]);category=String(visible?.label??inputName(ids[best]));if(!category)throw Error('ADOPTION_REASON_CATEGORY_LABEL:'+id);
  values=rows.map(([s,r])=>[s,r[best]]);
 }else if(f.modelType==='binomial')values=Object.entries(f.probabilities??{}) as [string,number][];
 else throw Error('ADOPTION_REASON_MODEL:'+id);
 if(values.length<2||values.some(([,p])=>!Number.isFinite(p)||p<0||p>1))throw Error('ADOPTION_REASON_PROBABILITY:'+id);
 const sorted=[...values].sort((a,b)=>a[1]-b[1]),lo=sorted[0],hi=sorted.at(-1)!;if(hi[1]===lo[1])throw Error('ADOPTION_REASON_NO_SETTING_DIFFERENCE:'+id);
 const game=f.modelType==='binomial'&&/GAME/.test(String(f.trialUniverse)),comparison=`${setting(lo[0])} ${rate(lo[1],game)}、${setting(hi[0])} ${rate(hi[1],game)}`;
 const gameNames:Record<string,string>={NORMAL_GAME_TRIAL:'通常ゲーム数',TOTAL_GAME_TRIAL:'総ゲーム数',LOTIS_NON_CHAIN_GAME_TRIAL:'連チャン区間を除いたゲーム数',NON_CHAIN_BONUS_INITIAL_GAME_TRIAL:'連チャン区間を除いたゲーム数',NON_TENHA_NORMAL_GAME_TRIAL:'天破中を除いた通常ゲーム数',BONUS_ELIGIBLE_GAME_TRIAL:'対象ゲーム数'};const rawDen=inputName(f.denominatorInputId);const den=gameNames[f.trialUniverse]??(/^(?:対象回数|観測機会数|確認した回数|試行回数|回数)$/.test(rawDen)?f.name+'の観測回数':rawDen);if(!den)throw Error('ADOPTION_REASON_DENOMINATOR:'+id);
 let reason=category?`${f.name}の「${category}」の割合は${comparison}と設定差があります。「${den}」を基準に、記録したカテゴリの振り分けを比較して推測に使用します。`:`${f.name}は${comparison}と設定差があります。「${den}」に対する「${/^(?:該当回数|該当した回数|成功回数|回数)$/.test(inputName(f.numeratorInputId))?f.name+'の回数':inputName(f.numeratorInputId)}」の発生割合を比較して推測に使用します。`;
 const context=String(section?.description??'').split(/\\n|\/n|\r?\n/)[0].split('。')[0].trim();if(context&&!/内部|runtime|benchmark|candidate|denominator/i.test(context))reason+=' 観測条件：'+context+'。';
 const preferred=(f.suppressedByFeatureIds??f.runtimeInference?.preferredFeatureIds??[]).map((pid:string)=>(pkg.features.features.find((f:any)=>f.featureId===pid)?.name??'')).filter(Boolean);
 if(preferred.length)reason+=` 「${preferred.join('」「')}」を記録していない場合の補助として使用し、同じ設定差を重ねて評価しません。`;
 return reason;
}
export function repairGenericAdoptionReasons(pkg:any){let changed=0;for(const e of pkg.v8?.machineResearchSummary?.adopted??[]){if(!isGenericAdoptionReason(e.reason))continue;e.reason=concreteAdoptionReason(pkg,e.featureId);changed++;const f=pkg.features.features.find((f:any)=>f.featureId===e.featureId);if(f.selectionRationale&&isGenericAdoptionReason(f.selectionRationale.adoptionReason))f.selectionRationale.adoptionReason=e.reason;}return changed;}
