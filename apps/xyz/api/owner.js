import {randomUUID} from "node:crypto";
import {db,user,body,clean,fail,send,handle,notice} from "./_lib/communications.js";
export default async function handler(req,res){try{
 if(!["GET","POST"].includes(req.method))throw fail(405,"Method not allowed.");
 const sql=db(),u=await user(req,sql),[owner]=await sql`SELECT 1 AS allowed FROM zuzify_comms.hub_owners WHERE user_id=${u.id}`;
 if(!owner)throw fail(403,"Owner access required.");
 if(!u.verified)throw fail(403,"Verify your account email before accessing owner controls.");
 if(req.method==="POST"){
 const b=body(req);
 if(b.action==="visibility"){
 const domain=clean(b.domain,253);if(typeof b.visible!=="boolean")throw fail(400,"Invalid visibility.");
 await sql`UPDATE zuzify_comms.directory SET visible=${b.visible},updated_at=now() WHERE domain=${domain}`;
 }else if(b.action==="reply"){
 const id=clean(b.ticketId,36),reply=clean(b.reply,2000),key="owner-reply:"+randomUUID();
 if(!/^[0-9a-f-]{36}$/i.test(id))throw fail(400,"Invalid ticket.");
 const rows=await sql`WITH t AS (UPDATE zuzify_comms.tickets SET reply=${reply},status=${b.close===true?"closed":"answered"} WHERE id=${id}::uuid RETURNING user_id),
 n AS (INSERT INTO zuzify_comms.notices(user_id,kind,title,body,event_key) SELECT user_id,'ticket','Support ticket updated','A support reply is available in your account.',${key} FROM t RETURNING id,user_id)
 INSERT INTO zuzify_comms.outbox(notice_id,user_id,kind) SELECT id,user_id,'ticket' FROM n RETURNING id`;
 if(!rows.length)throw fail(404,"Ticket not found.");
 }else if(b.action==="news"){
 const id=clean(b.userId,128),title=clean(b.title,100),message=clean(b.message,1500);
 const [target]=await sql`SELECT id FROM neon_auth."user" WHERE id::text=${id} AND "emailVerified"=true AND COALESCE(banned,false)=false`;
 if(!target)throw fail(404,"Verified account not found.");
 await notice(sql,{id,kind:"news",title,body:message,key:"owner-news:"+randomUUID()});
 }else throw fail(400,"Unknown action.");
 return send(res,200,{ok:true});
 }
 if(req.query?.access==="1")return send(res,200,{owner:true});
 const offset=Number(req.query?.offset||0);if(!Number.isSafeInteger(offset)||offset<0||offset>1000000)throw fail(400,"Invalid page.");
 const [sites,accounts,tickets,counts]=await Promise.all([
 sql`SELECT domain,title,category,visible FROM zuzify_comms.directory ORDER BY category,title,domain`,
 sql`SELECT u.id::text AS id,u.name,u."emailVerified" AS verified,u."createdAt" AS created_at,COALESCE((SELECT json_agg(json_build_object('name',COALESCE(c.name,g."clientId"),'scopes',g.scopes)) FROM neon_auth."oauthConsent" g LEFT JOIN neon_auth."oauthClient" c ON c."clientId"=g."clientId" WHERE g."userId"=u.id),'[]'::json) AS connections FROM neon_auth."user" u ORDER BY u."createdAt" DESC,u.id LIMIT 50 OFFSET ${offset}`,
 sql`SELECT id,user_id,app,subject,body,status,reply,created_at FROM zuzify_comms.tickets ORDER BY created_at DESC,id LIMIT 50 OFFSET ${offset}`,
 sql`SELECT (SELECT count(*)::int FROM neon_auth."user") AS accounts,(SELECT count(*)::int FROM zuzify_comms.tickets WHERE status='open') AS open_tickets,(SELECT count(*)::int FROM zuzify_comms.outbox WHERE sent_at IS NULL AND attempts<5) AS queued,(SELECT count(*)::int FROM zuzify_comms.tickets) AS tickets`]);
 return send(res,200,{sites,accounts,tickets,counts:counts[0]});
 }catch(e){return handle(res,e);}}
