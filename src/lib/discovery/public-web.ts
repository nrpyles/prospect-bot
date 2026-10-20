import {randomUUID} from 'node:crypto';
import {getIndustryQueries,craigslistRegion} from '../seasonal-trades.ts';
import {classifyProvider} from './normalize.ts';
import type {DiscoveryResult,SearchInput,ProviderFetch} from './types.ts';
export async function searchPublicWeb(config:SearchInput&{source:'facebook'|'craigslist'},credentials:{apiKey?:string},signal?:AbortSignal,request:ProviderFetch=fetch):Promise<DiscoveryResult>{
 if(!credentials.apiKey)throw new Error('Public web search is not configured');
 const region=craigslistRegion(config.city);
 if(config.source==='craigslist'&&!region)throw new Error('Choose a supported Craigslist region or import a listing URL manually');
 const site=config.source==='facebook'?'facebook.com':`${region}.craigslist.org`;
 const query=`site:${site} "${getIndustryQueries(config.industry)[0]}" "${config.city.split(',')[0]}"`;
 const response=await request('https://api.firecrawl.dev/v2/search',{method:'POST',signal:AbortSignal.any([AbortSignal.timeout(20000),...(signal?[signal]:[])]),headers:{Authorization:`Bearer ${credentials.apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({query,limit:Math.max(1,Math.min(config.limit,20)),sources:[{type:'web'}]})});
 if(!response.ok)throw new Error(`Public search returned HTTP ${response.status}`);
 const data=await response.json();if(data.success===false)throw new Error('Public search could not complete');
 const results=data.data?.web??(Array.isArray(data.data)?data.data:[]);if(!Array.isArray(results))throw new Error('Invalid public search response');
 const candidates:DiscoveryResult['candidates']=[];
 for(const item of results){
  let url:URL;try{url=new URL(item.url);}catch{continue;}
  if(url.protocol!=='https:'||!(url.hostname===site||url.hostname.endsWith('.'+site)))continue;
  const title=String(item.title??'Listing to review').slice(0,300);const snippet=String(item.description??item.markdown??'').slice(0,3000);const content=title+' '+snippet;
  const dateValue=item.publishedDate??item.publishedTime;const timestamp=typeof dateValue==='string'?Date.parse(dateValue):NaN;
  const publishedAt=Number.isFinite(timestamp)?new Date(timestamp).toISOString():null;
  const stale=Number.isFinite(timestamp)&&timestamp<Date.now()-90*86400000;const unavailable=/posting (has been|was) (deleted|expired)|no longer available/i.test(content);
  candidates.push({id:randomUUID(),displayTitle:title,businessName:null,city:config.city,industry:config.industry,website:null,
   phone:content.match(/(?:\+1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/)?.[0]??null,
   email:content.match(/[\w.+%-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0]??null,placeId:null,providerStatus:classifyProvider(content),reviewRequired:true,
   evidence:[{id:randomUUID(),source:config.source,url:url.href,query,observedAt:new Date().toISOString(),publishedAt,verifiedAt:null,freshness:unavailable?'unavailable':stale?'stale':'unknown',snippet,verifiedFields:[]}]});
 }
 return {candidates,warnings:['Public indexed listings require review. Coverage and current availability are not guaranteed.']};
}
