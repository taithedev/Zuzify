import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { authClient } from "../auth/client";

type Ticket = { id:string; app:string; subject:string; status:string; created_at:string; reply:string|null };
type Notice = { id:string; title:string; body:string; kind:string; created_at:string; read_at:string|null };
type CenterData = { tickets:Ticket[]; notices:Notice[]; news:boolean; transactional:boolean; verified:boolean };
const apps = ["Zuzify","ZuzuCord","ZuzuLoader","Zora","Kova","ZuzuOS","Other"];
async function request(action?:Record<string,unknown>):Promise<CenterData> {
  const client=authClient as typeof authClient & {getJWTToken?:()=>Promise<string|null>};
  const token=await client.getJWTToken?.();
  if(!token) throw new Error("Your session could not be verified. Sign in again.");
  const response=await fetch("/api/center",{method:action?"POST":"GET",headers:{"content-type":"application/json",authorization:"Bearer "+token},body:action?JSON.stringify(action):undefined,cache:"no-store",credentials:"omit"});
  const result=await response.json().catch(()=>({error:"Service unavailable."}));
  if(!response.ok) throw new Error(result.error||"Service unavailable.");
  return result as CenterData;
}
export function Center({mode}:{mode:"support"|"notifications"}) {
  const {data:session,isPending}=authClient.useSession();
  const [data,setData]=useState<CenterData|null>(null);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  const [app,setApp]=useState("Zuzify");
  const [subject,setSubject]=useState("");
  const [body,setBody]=useState("");
  const userId=session?.user.id;
  useEffect(()=>{let active=true;setData(null);setError("");setMessage("");if(userId) void request().then(d=>{if(active)setData(d)}).catch(e=>{if(active)setError(String(e.message))});return()=>{active=false}},[userId,mode]);
  async function update(action:Record<string,unknown>, success:string) {
    setBusy(true);setError("");setMessage("");
    try {setData(await request(action));setMessage(success);return true;}
    catch(e){setError(e instanceof Error?e.message:"Request failed.");return false;}
    finally{setBusy(false);}
  }
  async function create(e:FormEvent<HTMLFormElement>){e.preventDefault();if(await update({action:"ticket",app,subject,body},"Ticket created.")){setSubject("");setBody("");}}
  return <section className="center-page"><span className="eyebrow">ZUZIFY ID / SERVICE CENTER</span><h1>{mode==="support"?"Support center":"Notifications"}</h1><p>{mode==="support"?"Create a ticket and track replies in one place.":"Stay up to date with your connected apps and choose which emails you receive."}</p>
    {isPending?<p role="status">Checking your account…</p>:!session?<Link className="portal-primary" to={"/auth/sign-in?from="+encodeURIComponent("/"+mode)}>Sign in to continue</Link>:<>
    {error&&<p role="alert" className="portal-error">{error}</p>}{message&&<p role="status" className="center-status">{message}</p>}
    {!data&&!error&&<p role="status">Loading…</p>}
    {data&&!data.verified&&<p role="status">Verify your account email to receive emails and open tickets.</p>}
    {data&&<div className="center-grid">{mode==="support"?<>
      <div className="center-panel"><h2>New ticket</h2><form className="center-form" onSubmit={create}><label>Application<select value={app} onChange={e=>setApp(e.target.value)}>{apps.map(a=><option key={a}>{a}</option>)}</select></label><label>Subject<input required maxLength={120} value={subject} onChange={e=>setSubject(e.target.value)}/></label><label>Describe the issue<textarea required maxLength={3000} value={body} onChange={e=>setBody(e.target.value)}/></label><small>Do not include passwords, tokens or private personal information.</small><button className="portal-primary" disabled={busy||!data.verified||!subject.trim()||!body.trim()}>Create ticket</button></form></div>
      <div className="center-panel"><h2>Your tickets</h2>{data.tickets.length?data.tickets.map(t=><article className="center-item" key={t.id}><strong>{t.subject}</strong><p>{t.app} · {t.status}</p><small>#{t.id.slice(0,8)} · {new Date(t.created_at).toLocaleDateString()}</small>{t.reply&&<p>Support: {t.reply}</p>}</article>):<p>No tickets yet.</p>}</div>
    </>:<>
      <div className="center-panel"><h2>Email preferences</h2><label className="center-toggle"><input type="checkbox" checked={data.transactional} disabled={busy||!data.verified} onChange={e=>void update({action:"preferences",transactional:e.target.checked,news:data.news},"Preferences saved.")}/> App rank and support updates</label><label className="center-toggle"><input type="checkbox" checked={data.news} disabled={busy||!data.verified} onChange={e=>void update({action:"preferences",news:e.target.checked,transactional:data.transactional},"Preferences saved.")}/> Zuzify news (optional)</label><p>News is off by default. Notifications remain available here.</p></div>
      <div className="center-panel"><h2>Inbox</h2><button className="portal-quiet" disabled={busy} onClick={()=>void update({action:"read"},"Notifications marked as read.")}>Mark all read</button>{data.notices.length?data.notices.map(n=><article className="center-item" key={n.id}><strong>{!n.read_at?"• ":""}{n.title}</strong><p>{n.body}</p><small>{new Date(n.created_at).toLocaleString()}</small></article>):<p>You're all caught up.</p>}</div>
    </>}</div>}</>}
  </section>;
}
