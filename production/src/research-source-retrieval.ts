/** HTTP success and a cached search hit do not establish retrieved machine content.
 * Callers supply reviewed title aliases; this does not certify factual claims. */
export function inspectResearchPageRetrieval(httpStatus:number, html:string, machineTitleAliases:string[]){
 const rawTitle=html.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1];
 const title=rawTitle?.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&#(?:160|xA0);|&nbsp;/gi,' ').trim()??'';
 const compact=(s:string)=>s.normalize('NFKC').replace(/\s+/g,'').toLocaleLowerCase('ja');
 if(httpStatus!==200)return {status:'HTTP_ERROR',httpStatus,title};
 if(/接続障害|メンテナンス|アクセス制限|Access Denied|Service Unavailable/i.test(title))
  return {status:'SERVICE_NOTICE_NOT_MACHINE_CONTENT',httpStatus,title};
 if(!machineTitleAliases.length||machineTitleAliases.some(s=>typeof s!=='string'||!s.trim()))
  throw new Error('RETRIEVAL_MACHINE_TITLE_ALIASES_REQUIRED');
 if(!title||!machineTitleAliases.some(alias=>compact(title).includes(compact(alias))))
  return {status:'MACHINE_TITLE_NOT_CONFIRMED',httpStatus,title};
 return {status:'MACHINE_TITLE_CONFIRMED_CLAIMS_UNREVIEWED',httpStatus,title};
}
