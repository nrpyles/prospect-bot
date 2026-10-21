import {lookup} from 'node:dns/promises';
import {isPublicAddress,validatePublicUrl} from './safe-fetch.ts';
import type {WebsiteResearch} from '../crm-types.ts';

type ProviderResponse={success?:unknown;links?:unknown;data?:{markdown?:unknown;rawHtml?:unknown;metadata?:{url?:unknown;sourceURL?:unknown;title?:unknown;statusCode?:unknown}}};
type Options={apiKey?:string;pageLimit?:number;signal?:AbortSignal;request?:typeof fetch;resolve?:(host:string)=>Promise<{address:string;family:number}[]>};
const domain=(url:URL)=>url.hostname.toLowerCase().replace(/^www\./,'');
function businessPage(value:string,root:URL):string|null{
 try{
  const url=validatePublicUrl(value);
  if(domain(url)!==domain(root)||/\.(?:pdf|jpe?g|png|gif|svg|webp|zip|xml|json|css|js|mp4)$/i.test(url.pathname)||/\/(?:wp-admin|wp-login|login|account|checkout|cart)(?:\/|$)/i.test(url.pathname))return null;
  url.search='';url.hash='';return url.href.replace(/\/$/,'')||url.href;
 }catch{return null;}
}
function priority(url:string):number{return /services?|lighting|installation/i.test(url)?0:/about|team|projects?|gallery|reviews?|testimonials?|areas?|contact/i.test(url)?1:2;}

// Provider response limits apply even if a page contains enormous HTML.
async function readJson(response:Response,signal:AbortSignal):Promise<ProviderResponse>{
 if(!response.body)throw new Error('Research service returned no data');
 const reader=response.body.getReader();const chunks:Uint8Array[]=[];let size=0;
 try{while(true){signal.throwIfAborted();const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2097152)throw new Error('Research page exceeds the response limit');chunks.push(value);}}
 finally{await reader.cancel().catch(()=>{});}
 const parsed:unknown=JSON.parse(Buffer.concat(chunks).toString('utf8'));
 if(!parsed||typeof parsed!=='object')throw new Error('Research service returned invalid data');
 return parsed as ProviderResponse;
}

export async function researchWebsite(value:string,options:Options={}):Promise<WebsiteResearch&{homeHtml?:string;homeUrl?:string}>{
 if(!options.apiKey)throw new Error('Firecrawl is required for sitewide website research.');
 const root=validatePublicUrl(/^https?:\/\//i.test(value.trim())?value.trim():`https://${value.trim()}`);
 const limit=Math.max(1,Math.min(100,Math.floor(options.pageLimit??50)));
 const signal=AbortSignal.any([AbortSignal.timeout(210000),...(options.signal?[options.signal]:[])]);
 const resolve=options.resolve??(host=>lookup(host,{all:true,verbatim:true}));
 const checkedHosts=new Map<string,Promise<void>>();
 const publicHost=(host:string):Promise<void>=>{
  const known=checkedHosts.get(host);if(known)return known;
  const check=(async()=>{
   signal.throwIfAborted();let onAbort:()=>void=()=>{};
   try{
    const addresses=await Promise.race([resolve(host.replace(/^\[|\]$/g,'')),new Promise<never>((_,reject)=>{onAbort=()=>reject(new Error('Website research timed out'));signal.addEventListener('abort',onAbort,{once:true});})]);
    if(!addresses.length||addresses.some(a=>!isPublicAddress(a.address)))throw new Error('Private or unknown network destinations are blocked');
   }finally{signal.removeEventListener('abort',onAbort);}
  })();checkedHosts.set(host,check);return check;
 };
 await publicHost(root.hostname);
 const request=options.request??fetch;
 let stopped=false;
 const post=async(endpoint:string,payload:Record<string,unknown>)=>{
  signal.throwIfAborted();
  const response=await request(`https://api.firecrawl.dev/v2/${endpoint}`,{method:'POST',redirect:'error',headers:{Authorization:`Bearer ${options.apiKey}`,'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.any([signal,AbortSignal.timeout(25000)])});
  if(!response.ok){await response.body?.cancel();if([401,402,403,429].includes(response.status))stopped=true;throw new Error(`Website research service returned HTTP ${response.status}`);}
  const data=await readJson(response,signal);if(data.success===false)throw new Error('The research service could not read this page');return data;
 };
 const warnings:string[]=[];
 const start=businessPage(root.origin,root)!;
 let mapped:string[]=[];let mapCapped=false;
 try{
  const map=await post('map',{url:root.origin,sitemap:'include',includeSubdomains:false,ignoreQueryParameters:true,limit:limit+1,timeout:20000});
  if(!Array.isArray(map.links))throw new Error('Website discovery returned invalid page data');
  mapCapped=map.links.length>=limit+1;
  mapped=map.links.map((item:unknown)=>typeof item==='string'?item:item&&typeof item==='object'&&'url' in item?item.url:undefined).filter((url:unknown):url is string=>typeof url==='string').map((url:string)=>businessPage(url,root)).filter((url:string|null):url is string=>url!==null);
 }catch(error){warnings.push(error instanceof Error?error.message:'Website pages could not be discovered');}
 const discovered=[start,...[...new Set(mapped)].filter(url=>url!==start).sort((a,b)=>priority(a)-priority(b))];
 const targets=discovered.slice(0,limit);
 if(mapCapped||discovered.length>limit)warnings.push(`The ${limit} page budget was reached. More pages may remain.`);
 const pages:WebsiteResearch['pages']=[];let homeHtml:string|undefined;let homeUrl:string|undefined;let cursor=0;
 async function worker(){
  while(cursor<targets.length&&!stopped&&!signal.aborted){
   const url=targets[cursor++];
   try{
    await publicHost(new URL(url).hostname);
    const data=await post('scrape',{url,formats:url===start?['markdown','rawHtml']:['markdown'],onlyMainContent:true,timeout:20000,maxAge:86400000});
    const page=data.data;if(!page||typeof page.markdown!=='string'||!page.markdown.trim())throw new Error('No readable business content was returned');
    if(typeof page.metadata?.statusCode==='number'&&page.metadata.statusCode>=400)throw new Error(`Page returned HTTP ${page.metadata.statusCode}`);
    const finalUrl=businessPage(typeof page.metadata?.url==='string'?page.metadata.url:typeof page.metadata?.sourceURL==='string'?page.metadata.sourceURL:url,root);if(!finalUrl)throw new Error('A page redirected outside this business website');
    await publicHost(new URL(finalUrl).hostname);
    const content=page.markdown.trim();const truncated=content.length>12000;
    pages.push({url:finalUrl,title:typeof page.metadata?.title==='string'?page.metadata.title.slice(0,300):'',content:content.slice(0,12000),truncated});
    if(url===start&&typeof page.rawHtml==='string'){homeHtml=page.rawHtml;homeUrl=finalUrl;}
   }catch(error){warnings.push(`${url}: ${error instanceof Error?error.message:'Page could not be read'}`);}
  }
 }
 // Two requests at a time fits the current provider free-plan concurrency.
 await Promise.all([worker(),worker()]);
 if(signal.aborted)warnings.push('The research time budget was reached. Some pages remain unchecked.');
 if(pages.some(page=>page.truncated))warnings.push('Long page content was shortened for drafting. Some page text is not included.');
 pages.sort((a,b)=>targets.indexOf(a.url)-targets.indexOf(b.url));
 return {checkedAt:new Date().toISOString(),coverage:!pages.length?'unavailable':warnings.length?'partial':'complete',pageLimit:limit,discoveredPages:discovered.length,pages,warnings:[...new Set(warnings)],homeHtml,homeUrl};
}
