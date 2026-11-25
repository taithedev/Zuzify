import {useEffect,useState} from "react";
import {authClient} from "../auth/client";
import {getApiToken} from "../auth/apiToken";
type Report={id:string;subject_user:string;excerpt:string;reason:string;status:string;created_at:string};
export function SocialReports(){const [reports,setReports]=useState<Report[]>([]),[error,setError]=useState(""),[busy,setBusy]=useState(false);
async function load(id?:string){setBusy(true);setError("");try{const token=await getApiToken();const r=await fetch("/api/social-reports",{method:id?"POST":"GET",headers:{authorization:"Bearer "+token,"content-type":"application/json"},body:id?JSON.stringify({id}):undefined,cache:"no-store"});const data=await r.json();if(!r.ok)throw new Error(data.error);setReports(data.reports);}catch(e){setError(e instanceof Error?e.message:"Reports unavailable.");}finally{setBusy(false);}}
useEffect(()=>{void load()},[]);
return <section className="center-panel"><h2>Reported messages</h2><p>Only recipient-submitted reports appear here. Unreported conversations stay private. Involve a trusted adult for serious safety reports.</p>{error&&<p role="alert">{error}</p>}{busy&&<p>Loading…</p>}{!busy&&!reports.length&&<p>No open reports.</p>}{reports.map(r=><article className="center-item" key={r.id}><strong>{r.reason}</strong><p>{r.excerpt}</p><small>Reported sender: {r.subject_user}</small><div className="hub-actions"><button className="portal-quiet" disabled={busy} onClick={()=>void load(r.id)}>Mark reviewed</button></div></article>)}</section>}
