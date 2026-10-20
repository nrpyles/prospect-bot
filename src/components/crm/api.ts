function actionLabel(url:string,method:string):string{
 if(method==='PATCH'&&/^\/api\/prospects\/[^/?]+$/.test(url))return 'Saving business details';
 if(method==='POST'&&/^\/api\/prospects\/[^/?]+\/research$/.test(url))return 'Researching the website';
 if(method==='POST'&&/^\/api\/prospects\/[^/?]+\/draft$/.test(url))return 'Writing the email';
 return 'Workspace request';
}
export async function requestJson<T=Record<string,unknown>>(url:string,init?:RequestInit):Promise<T>{
 const label=actionLabel(url,init?.method?.toUpperCase()??'GET');
 let response:Response;
 try{response=await fetch(url,{...init,headers:{'Content-Type':'application/json',...init?.headers},signal:init?.signal??AbortSignal.timeout(60000)});}
 catch(error){throw new Error(`${label}: ${error instanceof Error&&/abort|timeout/i.test(error.name)?'The request timed out. Try again.':'The request could not connect. Refresh the CRM and try again.'}`);}
 const data=await response.json().catch(()=>({error:'The server returned an unreadable response'}));
 if(!response.ok){const message=data&&typeof data==='object'&&typeof data.error==='string'?data.error:`Request failed (${response.status})`;throw new Error(`${label}: ${message}`);}
 return data as T;
}
