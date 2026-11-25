import { db, secret, body, clean, fail, send, handle, notice, apps } from "./_lib/communications.js";
export default async function handler(req,res){
 try{
 if(req.method!=="POST")throw fail(405,"Method not allowed.");
 const b=body(req),sql=db(),admin=secret(req,process.env.ZUZIFY_COMMUNICATIONS_ADMIN_KEY);
 if(b.kind==="ticket_reply"){
 if(!admin)throw fail(401,"Not authorized.");
 const id=clean(b.ticketId,36),reply=clean(b.reply,2000),eventId=clean(b.eventId,100);
 if(!/^[0-9a-f-]{36}$/i.test(id))throw fail(400,"Invalid ticket.");
 const rows=await sql`WITH t AS (UPDATE zuzify_comms.tickets SET reply=${reply},status=${b.close===true?"closed":"answered"} WHERE id=${id}::uuid AND NOT EXISTS(SELECT 1 FROM zuzify_comms.notices WHERE event_key=${"reply:"+eventId}) RETURNING user_id),
 n AS (INSERT INTO zuzify_comms.notices(user_id,kind,title,body,event_key) SELECT user_id,'ticket','Support ticket updated','A support reply is available in your account.',${"reply:"+eventId} FROM t ON CONFLICT(event_key) DO NOTHING RETURNING id,user_id)
 INSERT INTO zuzify_comms.outbox(notice_id,user_id,kind) SELECT id,user_id,'ticket' FROM n RETURNING id`;
 return send(res,200,{ok:true,created:rows.length>0});
 }
 if(b.kind==="rank"){
 const keys=JSON.parse(process.env.ZUZIFY_APP_EVENT_KEYS||"{}");
 if(!apps.includes(b.app)||!Object.hasOwn(keys,b.app)||!secret(req,keys[b.app]))throw fail(401,"Not authorized.");
 }else if(b.kind==="news"){if(!admin)throw fail(401,"Not authorized.");}else throw fail(400,"Unsupported event.");
 const id=clean(b.userId,128),eventId=clean(b.eventId,100);
 const u=await sql`SELECT id FROM neon_auth."user" WHERE id::text=${id} AND "emailVerified"=true`;
 if(!u.length)throw fail(404,"Verified account not found.");
 if(b.kind==="rank")await notice(sql,{id,kind:"rank",title:b.app+" rank updated",body:"Your new rank is "+clean(b.rank,60)+".",key:"rank:"+b.app+":"+eventId});
 else await notice(sql,{id,kind:"news",title:clean(b.title,100),body:clean(b.message,1500),key:"news:"+eventId+":"+id});
 return send(res,200,{ok:true});
 }catch(e){return handle(res,e);}
}
