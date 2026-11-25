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
    const allowed=["Code expired or already used","Code expired or invalid","Discord is already connected to another account; unlink it first","Account connection could not be verified. Unlink an existing account or connect the app in Zuzify first."];
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
  if(req.method!=="POST")return reply(res,405,{error:"Method not allowed"});
  const origin=req.headers.origin;
  if(origin){try{if(new URL(origin).host!==req.headers.host)return reply(res,403,{error:"Cross-site requests are not allowed"});}catch{return reply(res,403,{error:"Invalid origin"});}}
  const authorization=req.headers.authorization||"";
  if(typeof authorization!=="string"||!/^Bearer [A-Za-z0-9._-]{20,8192}$/.test(authorization))return reply(res,401,{error:"Sign in to Zuzify and try again."});
  if(Number(req.headers["content-length"]||0)>1024)return reply(res,413,{error:"Pairing request is too large"});
  let body;
  try{body=typeof req.body==="string"?JSON.parse(req.body):req.body;}catch{return reply(res,400,{error:"Invalid pairing request"});}
  const code=pairingCode(body?.code);
  if(!/^(?:[A-F0-9]{16}|[a-f0-9]{64})$/.test(code))return reply(res,400,{error:"Enter the code sent privately by the Discord bot."});
  try{
    const direct=Boolean(process.env.ZUZIFY_PAIRING_BOT_DATABASE_URL&&process.env.ZUZIFY_PAIRING_ACCOUNTS_DATABASE_URL);
    const {status,...data}=await (direct?directPair(code,authorization.slice(7)):proxyPair(code,authorization));
    return reply(res,status,data);
  }catch{return reply(res,503,{error:"Discord pairing is temporarily unavailable."});}
}
