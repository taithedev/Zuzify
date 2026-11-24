import { db, user, snapshot, body, clean, fail, send, handle, apps } from "./_lib/communications.js";
export default async function handler(req,res){
 try{
 if(!["GET","POST"].includes(req.method))throw fail(405,"Method not allowed.");
 const sql=db(),u=await user(req,sql);
 if(req.method==="POST"){
 const b=body(req);
 if(b.action==="read")await sql`UPDATE zuzify_comms.notices SET read_at=now() WHERE user_id=${u.id} AND read_at IS NULL`;
 else if(b.action==="preferences"){
 if(typeof b.news!=="boolean"||typeof b.transactional!=="boolean")throw fail(400,"Invalid preferences.");
 if(!u.verified&&(b.news||b.transactional))throw fail(403,"Verify your email first.");
 await sql`INSERT INTO zuzify_comms.preferences(user_id,news,transactional) VALUES (${u.id},${b.news},${b.transactional}) ON CONFLICT(user_id) DO UPDATE SET news=excluded.news,transactional=excluded.transactional`;
 }else if(b.action==="ticket"){
 if(!u.verified)throw fail(403,"Verify your email first.");
 if(!apps.includes(b.app))throw fail(400,"Unknown application.");
 const subject=clean(b.subject,120),description=clean(b.body,3000);
 const rows=await sql`WITH t AS (INSERT INTO zuzify_comms.tickets(user_id,app,subject,body) SELECT ${u.id},${b.app},${subject},${description} WHERE (SELECT count(*) FROM zuzify_comms.tickets WHERE user_id=${u.id} AND created_at>now()-interval '1 hour')<3 RETURNING id),
 n AS (INSERT INTO zuzify_comms.notices(user_id,kind,title,body,event_key) SELECT ${u.id},'ticket','Support ticket created','Your ticket has been received. Track updates in the support center.','ticket:'||id::text FROM t RETURNING id,user_id)
 INSERT INTO zuzify_comms.outbox(notice_id,user_id,kind) SELECT id,user_id,'ticket' FROM n RETURNING id`;
 if(!rows.length)throw fail(429,"Ticket limit reached. Try again later.");
 }else throw fail(400,"Unknown action.");
 }
 return send(res,200,await snapshot(sql,u));
 }catch(e){return handle(res,e);}
}
