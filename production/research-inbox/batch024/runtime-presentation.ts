import {concreteAdoptionReason} from '../../src/adoption-reason.ts';
// Bounded presentation adapter as in Batch020/023. Models and counter IDs stay intact.
const groups:Record<number,any[]>={
1:[['BAR揃い',[[16,'BIG後準備中'],[17,'REG後準備中'],[18,'絶対空域中']]],['小役のボーナス同時当選',[[13,'スイカ'],[14,'チェリー']]],['REG中のキャラ紹介',[[23,'ソニック外'],[24,'ソニック中']]]],
2:[['サミートロフィー',[[16,'0～1000G'],[17,'1001～2000G'],[18,'2001～3000G'],[19,'3001～4000G'],[20,'4001～5000G'],[21,'5001～6000G'],[22,'6001～7000G'],[23,'7001～8000G'],[24,'8001G以降'],[25,'当日総G不明']]],['AT終了時の表示',[[15,'終了画面'],[26,'サブ液晶']]]],
3:[['ED中のランプ',[[9,'弱レア役'],[10,'強レア役']]]],
4:[['AT終了時の表示',[[24,'公表区分'],[25,'個別画面'],[26,'玉ちゃんトロフィー'],[27,'画面とトロフィー']]]],
5:[['AT終了時の表示',[[3,'終了画面'],[4,'称号']]]],
6:[['エピソードボーナス',[[19,'通常直撃時'],[20,'CZ成功時']]],['スワイプ時のボイス',[[23,'通常時'],[24,'SAO・EP終了時'],[25,'ALO終了時'],[26,'ED弱レア役'],[27,'ED強レア役']]],['AT突入画面',[[29,'制服'],[30,'ステージ示唆']]],['ボスバトル終了画面',[[31,'朝イチ'],[32,'朝イチ後5000G未満'],[33,'5000G以降の対象初回'],[34,'当日履歴不明']]]],
7:[['AT終了時の演出',[[7,'イラスト'],[8,'スタンプ'],[9,'PUSHボイス']]]],
8:[['AT終了ボイス',[[20,'1G連非当選'],[21,'1G連当選'],[22,'その他のボイス']]]],
9:[['初当りボーナス・AT終了画面',[[13,'0～2500G'],[14,'2501～5000G'],[15,'5001G以上・通常抽選'],[16,'7000G以上・特殊抽選'],[17,'当日履歴不明']]]],
10:[['終了画面',[[7,'CZ終了'],[8,'ボーナス終了'],[9,'AT終了']]]],
};
export function applyBatch024Presentation(pkg:any,index:number){
 const sections=pkg.ui.v8Sections,applied:any[]=[];
 for(const sec of sections){
 if(typeof sec.description==='string'){
 sec.description=sec.description.replaceAll('設定候補の絞り込みに自動反映します','設定候補の絞り込みに反映できる可能性があります');
 if(sec.id==='OBS_B024-M02-004')sec.description='弱チェリーとスイカが成立したら、どちらも合算回数へ1回ずつ加算してください。総ゲーム数を基準に比較します。個別の小役と同じ結果を重ねて計算しません。';
 if(sec.id==='OBS_B024-M04-024')sec.description='AT終了画面を公表4画面と残りの画面に分けて1回ずつ記録してください。その他の画面は、ポセイドンなど公表4画面以外をまとめた回数です。終了回数の合計は5区分から自動集計します。具体画面の確定条件は個別画面タブへ記録でき、追加の確率として掛けません。';
 if(sec.id==='OBS_B024-M06-028')sec.description='おうちモード突入1回につき、表示された姿を1つ記録してください。通常姿は通常シリカ・通常リズベット・通常アスナをまとめた回数です。突入回数の合計は4区分から自動集計します。';
 if(sec.id==='OBS_B024-M01-029')sec.description='開始時1回の抽選結果を、重ならない4区分で1回ずつ記録してください。開始回数の合計は入力した4区分から自動集計します。同じ開始時の結果を複数の区分へ重ねて入力しないでください。';
 const seen=new Set<string>();sec.description=sec.description.split('\n').map((line:string)=>{const note=line.startsWith('・注意：'),prefix=note?'・注意：':'';const parts=(note?line.slice(4):line).split('。').filter(Boolean).filter((p:string)=>{if(seen.has(p))return false;seen.add(p);return true;});return parts.length?prefix+parts.join('。')+'。':'';}).filter(Boolean).join('\n');
 }
 }

 for(const [i,[title,rows]] of (groups[index]??[]).entries()){
 const members=rows.flatMap(([n,label]:any)=>{const fid=`B024-M${String(index).padStart(2,'0')}-${String(n).padStart(3,'0')}`;const found=sections.filter((s:any)=>(s.items??[]).some((x:any)=>x.featureId===fid||x.evidenceId===fid));if(found.length>1)throw Error('PRESENTATION_DUPLICATE_SOURCE:'+fid);return found.map((s:any)=>({s,label,findingId:fid}));});
 if(members.length<2)continue;
 if(new Set(members.map((x:any)=>x.label)).size!==members.length)throw Error('PRESENTATION_DUPLICATE_LABEL');
 const id=`B024_M${index}_GROUP${i+1}`;
 for(const {s,label} of members){if(s.tabGroup)throw Error('PRESENTATION_ALREADY_ASSIGNED:'+s.id);s.tabGroup={id,title,label};}
 applied.push({id,title,tabs:members.map((x:any)=>({sectionId:x.s.id,findingId:x.findingId,label:x.label})),reason:'同じ表示系列の条件別入力をタブにまとめ、対象条件とカウンターを別々に保持する。'});
 }
 for(const item of pkg.v8?.machineResearchSummary?.adopted??[])item.reason=concreteAdoptionReason(pkg,item.featureId);
 pkg.metadata.batch024Presentation={adapter:'batch024-reviewed-tabs-v1',groups:applied,statisticalModelsUnchanged:true};
}
