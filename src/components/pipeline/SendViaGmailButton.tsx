'use client';
import {useEffect,useRef,useState} from 'react';import Link from 'next/link';
export function SendViaGmailButton({prospectId,to,subject,body,disabled,onSent,enrollmentId,expectedStepPosition}:{prospectId:string;to?:string|null;subject:string;body:string;disabled?:boolean;enrollmentId?:string;expectedStepPosition?:number;size?:'sm'|'md';onSent?:(info:{to:string})=>void}){
 const [sender,setSender]=useState<string|null>(null);const [state,setState]=useState('idle');const [error,setError]=useState('');const flight=useRef(false);const clientKey=useRef<string>('');
 useEffect(()=>{let alive=true;void fetch('/api/gmail/status').then(r=>r.json()).then(r=>{if(alive)setSender(r.connected?r.emailAddress:null);}).catch(()=>{if(alive)setSender(null);});return()=>{alive=false;};},[]);
 useEffect(()=>{clientKey.current=crypto.randomUUID();setState('idle');setError('');},[prospectId,to,subject,body,enrollmentId,expectedStepPosition]);
 async function send(){if(flight.current||!sender||!to)return;flight.current=true;setState('sending');setError('');try{
  const prep=await fetch('/api/gmail/prepare',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prospectId,clientKey:clientKey.current,recipient:to,subject,body,enrollmentId,expectedStepPosition})});const p=await prep.json();if(!prep.ok)throw new Error(p.error??'Message could not be prepared');
  if(p.expectedSender!==sender)throw new Error('Your sender changed. Refresh and review the message.');
  const res=await fetch('/api/gmail/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({intentId:p.intentId,prospectId,expectedSender:sender})});const data=await res.json();
  if(data.state==='sent'){setState('sent');onSent?.({to});}
  else if(['unknown','sending'].includes(data.state)){setState('unknown');setError('Check Gmail Sent before taking any further action. Delivery is not confirmed here.');}
  else throw new Error(data.error??'This message is stopped or needs review.');
 }catch(e){setState('error');setError(e instanceof Error?e.message:'Send could not complete. Check Gmail before retrying.');}finally{flight.current=false;}}
 if(!sender)return <Link href='/app/settings' className='crm-button crm-button-secondary'>Connect personal Gmail</Link>;
 return <div className='crm-send-control'><p className='crm-muted'>From <strong>{sender}</strong></p><button className='crm-button' onClick={send} disabled={disabled||!to||['sending','sent','unknown'].includes(state)}>{state==='sent'?'Sent':state==='sending'?'Sending…':state==='unknown'?'Check delivery in Gmail':'Send this email'}</button>{error&&<p role='alert' className='crm-error'>{error}</p>}</div>;
}
