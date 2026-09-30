export const EVIDENCE_SEMANTIC_TYPES=['EXACT_CONSTRAINT','PROBABILITY_BACKED','PROBABILITY_UNKNOWN','DISPLAY_ONLY','BLOCK'] as const;
export type EvidenceSemanticType=typeof EVIDENCE_SEMANTIC_TYPES[number];
const exact=(s:string)=>/設定[1-6]以上|設定[1-6]否定|設定[1-6](?:[・,／\\/][1-6])+(?:濃厚)?|(?:^|[:：=]\\s*)設定[1-6](?:濃厚)?\\s*$/.test(s);
const directional=(s:string)=>/示唆|期待度|デフォルト|基本|奇数|偶数|高設定|低設定/.test(s);
export function classifyEvidenceLabel(label:string):EvidenceSemanticType{if(exact(label))return 'EXACT_CONSTRAINT';if(directional(label))return 'PROBABILITY_UNKNOWN';return 'DISPLAY_ONLY';}
export function classifyEvidenceSemantic(e:any):EvidenceSemanticType{
 if(e?.status==='BLOCK'||e?.blocked===true)return 'BLOCK';
 if(e?.settingDistribution&&typeof e.settingDistribution==='object'&&Object.keys(e.settingDistribution).length>0)return 'PROBABILITY_BACKED';
 const details=Array.isArray(e?.details)?e.details.filter((x:any)=>typeof x==='string'&&x.trim()):[];
 const labels=details.length?details:[e?.label].filter((x:any)=>typeof x==='string'&&x.trim());
 const types=[...new Set(labels.map(classifyEvidenceLabel))];
 if(types.length===1)return types[0];
 return 'DISPLAY_ONLY';
}
export function evidenceSemanticExplanation(type:EvidenceSemanticType){
 if(type==='EXACT_CONSTRAINT')return '設定確定・設定否定など条件が明確な項目は、観測すると設定候補の絞り込みに反映します。';
 if(type==='PROBABILITY_BACKED')return '設定別の出現率が確認できているため、観測結果を設定推測計算に使用します。';
 if(type==='PROBABILITY_UNKNOWN')return 'この示唆については設定別の出現率が公表・確認されていないため、観測回数を記録できますが、現在の設定推測計算には直接反映していません。設定別の出現率が確認できた場合は、今後のデータ更新で設定推測へ反映できる可能性があります。';
 if(type==='BLOCK')return '根拠が不足しているため、現在は設定推測や記録項目として使用しません。';
 return '観測内容を記録・参照できますが、現在の設定推測計算には直接反映していません。';
}
