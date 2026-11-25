import pg from "pg";
import { createHash } from "node:crypto";
import {verifyIdentity,logVerificationFailure} from "../_lib/identity.js";

let botPool, accountsPool;
function reply(res,status,value){
  res.setHeader("Cache-Control","no-store");
  res.setHeader("X-Content-Type-Options","nosniff");
  res.setHeader("Referrer-Policy","no-referrer");
  return res.status(status).json(value);
}
function pairingCode(input){
  const clean=typeof input==="string"?input.trim().replace(/[\s-]/g,""):"";
  return clean.length===16?clean.toUpperCase():clean;
}
async function listAccounts(token){
 let user;try{user=(await verifyIdentity(token)).sub;}catch(error){logVerificationFailure(error);return {status:401,error:"Sign in again."};}
 if(!process.env.ZUZIFY_PAIRING_ACCOUNTS_DATABASE_URL)return {status:503,error:"Discord connections are not configured."};
 accountsPool ||= new pg.Pool({connectionString:process.env.ZUZIFY_PAIRING_ACCOUNTS_DATABASE_URL,max:2,connectionTimeoutMillis:8000,idleTimeoutMillis:10000,statement_timeout:8000});
 const result=await accountsPool.query("SELECT * FROM public.list_web_discord_pairings($1::uuid)",[user]);
 const accounts=await Promise.all(result.rows.map(async row=>{
  const id=String(row.discord_id);let createdAt=null,username=null,displayName=null,avatar=null;
  try{createdAt=new Date(Number((BigInt(id)>>22n)+1420070400000n)).toISOString();}catch{}
  const botToken=process.env.DISCORD_BOT_TOKEN;
  if(botToken&&/^\d{15,25}$/.test(id)){try{const r=await fetch("https://discord.com/api/v10/users/"+id,{headers:{authorization:"Bot "+botToken},signal:AbortSignal.timeout(2500),redirect:"error",cache:"no-store"});if(r.ok){const d=await r.json();if(d.id===id){username=typeof d.username==="string"?d.username:null;displayName=typeof d.global_name==="string"?d.global_name:null;if(typeof d.avatar==="string"&&/^(a_)?[a-f0-9]+$/.test(d.avatar))avatar="https://cdn.discordapp.com/avatars/"+id+"/"+d.avatar+(d.avatar.startsWith("a_")?".gif":".png")+"?size=64";}}}catch{}}
  return {id,linkedAt:row.linked_at,createdAt,username,displayName,avatar};
 }));return {status:200,accounts};
}
async function directPair(code,token){
  let user;
  try{
    const payload=await verifyIdentity(token);
    user=String(payload.sub||"");
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user))throw new Error("Invalid identity");
  }catch(error){logVerificationFailure(error);return {status:401,error:"Zuzify session could not be verified. Sign in again."};}
  botPool ||= new pg.Pool({connectionString:process.env.ZUZIFY_PAIRING_BOT_DATABASE_URL,max:2,connectionTimeoutMillis:8000,idleTimeoutMillis:10000,statement_timeout:8000});
  accountsPool ||= new pg.Pool({connectionString:process.env.ZUZIFY_PAIRING_ACCOUNTS_DATABASE_URL,max:2,connectionTimeoutMillis:8000,idleTimeoutMillis:10000,statement_timeout:8000});
  const client=await botPool.connect();
  try{
    await client.query("BEGIN");
    const hash=createHash("sha256").update(code).digest("hex");
    const result=await client.query("SELECT discord_id,service FROM zuzify_bot.redeem_web_pairing($1,$2::uuid)",[hash,user]);
    const row=result.rows[0];
    if(!row)throw new Error("Code expired or already used");
    const sync=await accountsPool.query("SELECT public.sync_web_discord_pairing($1::uuid,$2,$3) AS ok",[user,row.discord_id,row.service]);
    if(sync.rows[0]?.ok!==true)throw new Error("Account connection could not be verified. Unlink an existing account or connect the app in Zuzify first.");
    await client.query("COMMIT");
    return {status:200,ok:true,service:row.service};
  }catch(error){
    await client.query("ROLLBACK").catch(()=>{});
    const message=error instanceof Error?error.message:"";
    const allowed=["You can link a maximum of 3 Discord accounts","Code expired or already used","Code expired or invalid","Discord is already connected to another account; unlink it first","Account connection could not be verified. Unlink an existing account or connect the app in Zuzify first."];
    return allowed.includes(message)?{status:409,error:message}:{status:503,error:"The pairing database is unavailable. Try again later."};
  }finally{client.release();}
}
async function proxyPair(code,authorization){
  let base;
  try{
    base=new URL((process.env.BOT_LINK_API_URL||"").trim().replace(/\/+$/,""));
    if(base.protocol!=="https:"||base.username||base.password||base.search||base.hash||base.pathname!=="/")throw new Error();
  }catch{return {status:503,error:"Discord pairing is not configured. The owner must configure the Neon pairing databases or a working bot API."};}
  try{
    const response=await fetch(new URL("/api/v1/link/complete",base),{method:"POST",headers:{"content-type":"application/json",authorization},body:JSON.stringify({code}),redirect:"error",signal:AbortSignal.timeout(12000),cache:"no-store"});
    const data=await response.json().catch(()=>({}));
    if(response.ok&&data.ok===true)return {status:200,ok:true,service:data.service||"zuzify"};
    return {status:response.status===404?503:response.status>=400&&response.status<500?response.status:502,error:response.status===404?"The bot API is not deployed. Configure Neon pairing instead.":typeof data.error==="string"&&data.error.length<=240?data.error:"Discord could not verify this code."};
  }catch{return {status:503,error:"Discord bot API is unavailable."};}
}
export default async function handler(req,res){
  if(!["GET","POST"].includes(req.method))return reply(res,405,{error:"Method not allowed"});
  const origin=req.headers.origin;
  if(origin){try{if(new URL(origin).host!==req.headers.host)return reply(res,403,{error:"Cross-site requests are not allowed"});}catch{return reply(res,403,{error:"Invalid origin"});}}
  const authorization=req.headers.authorization||"";
  if(typeof authorization!=="string"||!/^Bearer [A-Za-z0-9._-]{20,8192}$/.test(authorization))return reply(res,401,{error:"Sign in to Zuzify and try again."});
  if(req.method==="GET"){try{const {status,...data}=await listAccounts(authorization.slice(7));return reply(res,status,data);}catch{return reply(res,503,{error:"Could not load Discord connections."});}}
  if(Number(req.headers["content-length"]||0)>1024)return reply(res,413,{error:"Pairing request is too large"});
  let body;
  try{body=typeof req.body==="string"?JSON.parse(req.body):req.body;}catch{return reply(res,400,{error:"Invalid pairing request"});}
  const code=pairingCode(body?.code);
  if(!/^(?:[A-F0-9]{16}|[a-f0-9]{64})$/.test(code))return reply(res,400,{error:"Enter the code sent privately by the Discord bot."});
  try{
    const direct=Boolean(process.env.ZUZIFY_PAIRING_BOT_DATABASE_URL&&process.env.ZUZIFY_PAIRING_ACCOUNTS_DATABASE_URL);
    if(!direct)return reply(res,503,{error:"Direct Discord pairing databases must be configured to enforce the account limit."});
    const {status,...data}=await directPair(code,authorization.slice(7));
    return reply(res,status,data);
  }catch{return reply(res,503,{error:"Discord pairing is temporarily unavailable."});}
}
