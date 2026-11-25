import {createHash} from "node:crypto";
import {db,user,body,send,fail,handle} from "./_lib/communications.js";
const digest=s=>createHash("sha256").update(s).digest("hex");
export default async function handler(req,res){try{
 if(!["GET","POST"].includes(req.method))throw fail(405,"Method not allowed.");
 const sql=db(),u=await user(req,sql),[owner]=await sql`SELECT 1 FROM zuzify_comms.hub_owners WHERE user_id=${u.id}`;
 if(!u.verified||!owner)throw fail(403,"Verified owner required.");
 if(req.method==="POST"){
  const b=body(req);
  if(typeof b.userId!=="string"||!/^[a-f0-9-]{36}$/i.test(b.userId)||!["avatar","banner"].includes(b.kind)||!["approve","reject"].includes(b.decision)||typeof b.revision!=="string"||!/^[a-f0-9]{64}$/.test(b.revision))throw fail(400,"Invalid review.");
  const [p]=await sql`SELECT pending_avatar,pending_banner FROM zuzify_comms.social_profiles WHERE user_id=${b.userId}`;
  const pending=b.kind==="avatar"?p?.pending_avatar:p?.pending_banner;
  if(!pending||digest(pending)!==b.revision)throw fail(409,"Image changed. Refresh the queue before reviewing.");
  const approved=b.decision==="approve";
  const rows=b.kind==="avatar"?await sql`UPDATE zuzify_comms.social_profiles SET avatar_image=CASE WHEN ${approved}::boolean THEN pending_avatar ELSE avatar_image END,pending_avatar=NULL,updated_at=now() WHERE user_id=${b.userId} AND pending_avatar=${pending} RETURNING user_id`:await sql`UPDATE zuzify_comms.social_profiles SET banner_image=CASE WHEN ${approved}::boolean THEN pending_banner ELSE banner_image END,pending_banner=NULL,updated_at=now() WHERE user_id=${b.userId} AND pending_banner=${pending} RETURNING user_id`;
  if(!rows.length)throw fail(409,"Image changed. Refresh and try again.");
 }
 const rows=await sql`SELECT p.user_id,u.name,p.pending_avatar,p.pending_banner FROM zuzify_comms.social_profiles p JOIN neon_auth."user" u ON u.id::text=p.user_id WHERE (p.pending_avatar IS NOT NULL OR p.pending_banner IS NOT NULL) AND COALESCE(u.banned,false)=false ORDER BY p.updated_at ASC LIMIT 5`;
 const items=rows.flatMap(p=>["avatar","banner"].flatMap(kind=>{const image=kind==="avatar"?p.pending_avatar:p.pending_banner;return image?[{userId:p.user_id,name:p.name,kind,image,revision:digest(image)}]:[]}));
 return send(res,200,{items});
 }catch(e){return handle(res,e);}}
