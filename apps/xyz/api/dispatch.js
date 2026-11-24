import { db, secret, fail, send, handle } from "./_lib/communications.js";
export default async function handler(req,res){
 try{
 if(!["GET","POST"].includes(req.method)||!secret(req,process.env.CRON_SECRET))throw fail(401,"Not authorized.");
 if(!process.env.RESEND_API_KEY)throw fail(503,"Email delivery is not configured.");
 const sql=db();
 // Atomic lease prevents concurrent workers from sending the same row.
 const rows=await sql`WITH leased AS (SELECT id FROM zuzify_comms.outbox WHERE sent_at IS NULL AND attempts<5 AND next_attempt<=now() ORDER BY next_attempt LIMIT 10 FOR UPDATE SKIP LOCKED)
 UPDATE zuzify_comms.outbox o SET attempts=o.attempts+1,next_attempt=now()+interval '15 minutes' FROM leased WHERE o.id=leased.id RETURNING o.id,o.notice_id,o.user_id,o.kind`;
 let accepted=0,skipped=0,failed=0;
 for(const row of rows){
 try{
 const [r]=await sql`SELECT u.email,u."emailVerified" AS verified,n.title,n.body,COALESCE(p.news,false) AS news,COALESCE(p.transactional,true) AS transactional FROM neon_auth."user" u JOIN zuzify_comms.notices n ON n.id=${row.notice_id} LEFT JOIN zuzify_comms.preferences p ON p.user_id=u.id::text WHERE u.id::text=${row.user_id}`;
 if(!r?.verified||(row.kind==="news"?!r.news:!r.transactional)){await sql`UPDATE zuzify_comms.outbox SET attempts=5 WHERE id=${row.id}`;skipped++;continue;}
 const from=row.kind==="ticket"?"Zuzify Support <support@zuzify.xyz>":row.kind==="news"?"Zuzify News <news@zuzify.xyz>":"Zuzify Notifications <notifications@zuzify.xyz>";
 const mail={from,to:[r.email],subject:r.title,text:r.body+"\n\nView your account or change email preferences: https://zuzify.xyz/notifications\nSupport: https://zuzify.xyz/support"};
 if(row.kind==="ticket"&&process.env.ZUZIFY_SUPPORT_INBOX)mail.reply_to=process.env.ZUZIFY_SUPPORT_INBOX;
 const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{authorization:"Bearer "+process.env.RESEND_API_KEY,"content-type":"application/json","Idempotency-Key":"zuzify/"+row.id},body:JSON.stringify(mail),signal:AbortSignal.timeout(8000)});
 if(!response.ok){failed++;continue;}
 await sql`UPDATE zuzify_comms.outbox SET sent_at=now() WHERE id=${row.id}`;accepted++;
 }catch{failed++;}
 }
 return send(res,200,{accepted,skipped,failed});
 }catch(e){return handle(res,e);}
}
