import sharp from "sharp";
import {db,user,body,clean,fail,send,handle} from "./_lib/communications.js";
const avatars=["mono","orbit","pixel","star","wave","grid"],banners=["night","silver","violet","ocean","aurora","ember"];
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const identifier=v=>{if(typeof v!=="string"||!uuid.test(v))throw fail(400,"Invalid identifier.");return v.toLowerCase();};
async function rate(sql,id,kind,limit){const rows=await sql`INSERT INTO zuzify_comms.social_attempts(user_id,kind) SELECT ${id},${kind} WHERE (SELECT count(*) FROM zuzify_comms.social_attempts WHERE user_id=${id} AND kind=${kind} AND created_at>now()-interval '1 minute')<${limit} RETURNING user_id`;if(!rows.length)throw fail(429,"Too many actions. Try again in a minute.");}
async function pair(sql,id,other){const [r]=await sql`SELECT state,requested_by,blocked_by FROM zuzify_comms.social_pairs WHERE low_id=LEAST(${id},${other}) AND high_id=GREATEST(${id},${other})`;return r;}
async function peerAvailable(sql,id){const [r]=await sql`SELECT 1 AS ok FROM neon_auth."user" WHERE id::text=${id} AND "emailVerified"=true AND COALESCE(banned,false)=false`;return !!r;}
async function overview(sql,id){
 const [profile]=await sql`SELECT friend_code,avatar,banner,avatar_image,banner_image,pending_avatar,pending_banner FROM zuzify_comms.social_profiles WHERE user_id=${id}`;
 const friends=await sql`SELECT u.id::text AS id,u.name,p.state,(p.requested_by=${id}) AS outgoing,(p.blocked_by=${id}) AS blocked_by_me,CASE WHEN p.state='accepted' THEN s.avatar ELSE 'mono' END AS avatar,CASE WHEN p.state='accepted' THEN s.banner ELSE 'night' END AS banner,CASE WHEN p.state='accepted' THEN s.avatar_image ELSE NULL END AS avatar_image,CASE WHEN p.state='accepted' THEN s.banner_image ELSE NULL END AS banner_image FROM zuzify_comms.social_pairs p JOIN neon_auth."user" u ON u.id::text=CASE WHEN p.low_id=${id} THEN p.high_id ELSE p.low_id END LEFT JOIN zuzify_comms.social_profiles s ON s.user_id=u.id::text WHERE (p.low_id=${id} OR p.high_id=${id}) AND (p.state<>'blocked' OR p.blocked_by=${id}) AND COALESCE(u.banned,false)=false AND u."emailVerified"=true ORDER BY p.created_at DESC LIMIT 200`;
 return {profile,friends};
}
async function image(raw,kind){
 if(typeof raw!=="string")throw fail(400,"Choose PNG, JPEG, WebP or GIF.");
 const isGif=raw.startsWith("data:image/gif;");
 if(raw.length>(isGif?4000022:1500000)||!/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(raw))throw fail(400,"Choose PNG, JPEG, WebP or GIF. GIF uploads support up to 3 MB.");
 try{
  const buf=Buffer.from(raw.split(",")[1],"base64");
  if(isGif&&buf.length>3000000)throw new Error("size");
  const info=await sharp(buf,{limitInputPixels:12000000,failOn:"error"}).metadata();
  if(!["jpeg","png","webp","gif"].includes(info.format)||isGif!==(info.format==="gif"))throw new Error("format");
  const frames=info.pages||1, height=info.pageHeight||info.height;
  if(isGif&&(frames>60||!height||!info.width||info.width*height*frames>18000000))throw new Error("animation limit");
  const width=kind==="avatar"?320:900, targetHeight=kind==="avatar"?320:300;
  const input=()=>sharp(buf,{limitInputPixels:18000000,animated:isGif,failOn:"error"});
  let out;
  if(isGif){
   for(const [scale,quality] of [[1,65],[1,48],[0.75,45],[0.5,35]]){
    out=await input().resize(Math.round((kind==="avatar"?192:480)*scale),Math.round((kind==="avatar"?192:160)*scale),{fit:"cover"}).webp({quality,effort:3,loop:0}).toBuffer();
    if(out.length<=220000)break;
   }
  }else out=await input().rotate().resize(width,targetHeight,{fit:"cover"}).webp({quality:76}).toBuffer();
  if(!out||out.length>220000)throw new Error("size");
  return "data:image/webp;base64,"+out.toString("base64");
 }catch{throw fail(400,"Image could not be processed. Try a smaller image or a shorter GIF (up to 60 frames).");}
}
export default async function handler(req,res){try{
 if(!["GET","POST"].includes(req.method))throw fail(405,"Method not allowed.");
 const sql=db(),u=await user(req,sql),id=u.id;
 if(!u.verified)throw fail(403,"Verify your email in My account before using Friends.");
 await sql`INSERT INTO zuzify_comms.social_profiles(user_id) VALUES (${id}) ON CONFLICT DO NOTHING`;
 if(req.method==="GET"){
 if(req.query?.peer){const other=identifier(req.query.peer);if(other===id||!await peerAvailable(sql,other)||(await pair(sql,id,other))?.state!=="accepted")throw fail(403,"This conversation is not available.");
 const messages=await sql`SELECT id,sender,body,created_at FROM zuzify_comms.social_messages WHERE LEAST(sender,recipient)=LEAST(${id},${other}) AND GREATEST(sender,recipient)=GREATEST(${id},${other}) AND EXISTS(SELECT 1 FROM zuzify_comms.social_pairs WHERE low_id=LEAST(${id},${other}) AND high_id=GREATEST(${id},${other}) AND state='accepted') ORDER BY created_at DESC,id DESC LIMIT 80`;
 return send(res,200,{messages:messages.reverse()});}
 return send(res,200,await overview(sql,id));}
 let b;try{b=typeof req.body==="string"?JSON.parse(req.body):req.body;}catch{throw fail(400,"Invalid request.");}if(!b||typeof b!=="object"||Array.isArray(b))throw fail(400,"Invalid request.");
 if(b.action==="upload"){
 await rate(sql,id,"upload",3);if(!["avatar","banner"].includes(b.kind))throw fail(400,"Invalid image type.");const data=await image(b.image,b.kind);
 if(b.kind==="avatar")await sql`UPDATE zuzify_comms.social_profiles SET pending_avatar=${data},updated_at=now() WHERE user_id=${id}`;
 else await sql`UPDATE zuzify_comms.social_profiles SET pending_banner=${data},updated_at=now() WHERE user_id=${id}`;
 }else{
 b=body(req);
 if(b.action==="style"){if(!avatars.includes(b.avatar)||!banners.includes(b.banner))throw fail(400,"Unknown style.");await rate(sql,id,"style",15);await sql`UPDATE zuzify_comms.social_profiles SET avatar=${b.avatar},banner=${b.banner},updated_at=now() WHERE user_id=${id}`;}
 else if(b.action==="remove_image"){if(!["avatar","banner"].includes(b.kind))throw fail(400,"Invalid image type.");if(b.kind==="avatar")await sql`UPDATE zuzify_comms.social_profiles SET pending_avatar=NULL,avatar_image=NULL WHERE user_id=${id}`;else await sql`UPDATE zuzify_comms.social_profiles SET pending_banner=NULL,banner_image=NULL WHERE user_id=${id}`;}
 else if(b.action==="rotate"){await rate(sql,id,"rotate",5);await sql`UPDATE zuzify_comms.social_profiles SET friend_code=gen_random_uuid() WHERE user_id=${id}`;}
 else if(b.action==="request"){await rate(sql,id,"request",6);const code=identifier(b.code);
 const rows=await sql`WITH target AS (SELECT p.user_id FROM zuzify_comms.social_profiles p JOIN neon_auth."user" u ON u.id::text=p.user_id WHERE p.friend_code=${code}::uuid AND p.user_id<>${id} AND u."emailVerified"=true AND COALESCE(u.banned,false)=false AND NOT EXISTS(SELECT 1 FROM zuzify_comms.social_pairs s WHERE s.low_id=LEAST(${id},p.user_id) AND s.high_id=GREATEST(${id},p.user_id))), consumed AS (UPDATE zuzify_comms.social_profiles SET friend_code=gen_random_uuid() WHERE friend_code=${code}::uuid AND user_id IN(SELECT user_id FROM target) RETURNING user_id) INSERT INTO zuzify_comms.social_pairs(low_id,high_id,requested_by,state) SELECT LEAST(${id},user_id),GREATEST(${id},user_id),${id},'pending' FROM consumed ON CONFLICT DO NOTHING RETURNING low_id`;
 if(!rows.length)throw fail(400,"That code is unavailable. Ask your friend for a new code.");}
 else if(b.action==="report"){await rate(sql,id,"report",5);const mid=identifier(b.messageId),reason=clean(b.reason,300);const rows=await sql`INSERT INTO zuzify_comms.social_reports(reporter,subject_user,message_id,excerpt,reason) SELECT ${id},sender,m.id,m.body,${reason} FROM zuzify_comms.social_messages m WHERE m.id=${mid}::uuid AND m.recipient=${id} ON CONFLICT DO NOTHING RETURNING id`;if(!rows.length)throw fail(400,"Message already reported or unavailable.");}
 else{
 const other=identifier(b.peer);if(other===id)throw fail(400,"Invalid friend.");
 if(b.action==="accept"){if(!await peerAvailable(sql,other))throw fail(400,"Request unavailable.");const rows=await sql`UPDATE zuzify_comms.social_pairs SET state='accepted' WHERE low_id=LEAST(${id},${other}) AND high_id=GREATEST(${id},${other}) AND state='pending' AND requested_by=${other} RETURNING low_id`;if(!rows.length)throw fail(400,"Request unavailable.");}
 else if(b.action==="remove"){await sql`DELETE FROM zuzify_comms.social_pairs WHERE low_id=LEAST(${id},${other}) AND high_id=GREATEST(${id},${other}) AND state IN('pending','accepted')`;}
 else if(b.action==="block"){await sql`UPDATE zuzify_comms.social_pairs SET state='blocked',blocked_by=${id} WHERE low_id=LEAST(${id},${other}) AND high_id=GREATEST(${id},${other}) AND state<>'blocked'`;}
 else if(b.action==="unblock"){await sql`DELETE FROM zuzify_comms.social_pairs WHERE low_id=LEAST(${id},${other}) AND high_id=GREATEST(${id},${other}) AND state='blocked' AND blocked_by=${id}`;}
 else if(b.action==="message"){await rate(sql,id,"message",25);const message=clean(b.message,1500);if(!await peerAvailable(sql,other))throw fail(403,"Conversation unavailable.");const rows=await sql`WITH allowed AS (SELECT 1 FROM zuzify_comms.social_pairs WHERE low_id=LEAST(${id},${other}) AND high_id=GREATEST(${id},${other}) AND state='accepted' FOR UPDATE) INSERT INTO zuzify_comms.social_messages(sender,recipient,body) SELECT ${id},${other},${message} FROM allowed RETURNING id,sender,body,created_at`;if(!rows.length)throw fail(403,"Only accepted friends can send messages.");return send(res,201,{message:rows[0]});}
 else throw fail(400,"Unknown action.");
 }}
 return send(res,200,await overview(sql,id));
 }catch(e){return handle(res,e);}}
