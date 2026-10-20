export async function requestJson<T=Record<string,unknown>>(url:string,init?:RequestInit):Promise<T>{
 const response=await fetch(url,{...init,headers:{'Content-Type':'application/json',...init?.headers},signal:init?.signal??AbortSignal.timeout(60000)});
 const data=await response.json().catch(()=>({error:'The server returned an unreadable response'}));
 if(!response.ok)throw new Error(data.error??`Request failed (${response.status})`);return data as T;
}
