import pg from "pg";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { timingSafeEqual } from "node:crypto";
export const apps=["Zuzify","ZuzuCord","ZuzuLoader","Zora","Kova","ZuzuOS","Other"];
export const fail=(status,message)=>Object.assign(new Error(message),{status,publicError:true});
let pool;
export function db(){
 if(!process.env.COMMUNICATIONS_DATABASE_URL)throw fail(503,"Communications service is not configured.");
 pool??=new pg.Pool({connectionString:process.env.COMMUNICATIONS_DATABASE_URL,max:3,connectionTimeoutMillis:7000,idleTimeoutMillis:10000,statement_timeout:10000});
 return async (strings,...values)=>{
   const text=strings.reduce((s,part,i)=>s+(i?"$"+i:"")+part,"");
   const result=await pool.query(text,values);
   return result.rows;
 };
}
export function send(res,status,data){res.setHeader("Cache-Control","no-store");return res.status(status).json(data);}
export function handle(res,e){if(e?.publicError)return send(res,e.status,{error:e.message});console.error("Communications backend error",{code:typeof e?.code==="string"?e.code.slice(0,30):"unknown",status:Number(e?.status)||null});return send(res,503,{error:"The Zuzify service is temporarily unavailable. Try again shortly."});}
export function secret(req,expected){const actual=String(req.headers.authorization||"").replace(/^Bearer /,"");return typeof expected==="string"&&expected.length>=32&&Buffer.byteLength(actual)===Buffer.byteLength(expected)&&timingSafeEqual(Buffer.from(actual),Buffer.from(expected));}
export function body(req){const b=typeof req.body==="string"?JSON.parse(req.body):req.body;if(!b||typeof b!=="object"||Array.isArray(b)||JSON.stringify(b).length>12000)throw fail(400,"Invalid request.");return b;}
export function clean(value,max){if(typeof value!=="string"||!value.trim()||value.trim().length>max)throw fail(400,"Invalid text field.");return value.trim();}
let jwks;
export async function user(req,sql){
 const issuer=process.env.COMMUNICATIONS_JWT_ISSUER,audience=process.env.COMMUNICATIONS_JWT_AUDIENCE;
 if(!issuer||!audience)throw fail(503,"Account verification is not configured.");
 const token=String(req.headers.authorization||"").match(/^Bearer ([A-Za-z0-9._-]{20,8192})$/)?.[1];
 if(!token)throw fail(401,"Sign in first.");
 let payload;try{jwks??=createRemoteJWKSet(new URL("https://ep-rough-recipe-bcjp6wq7.neonauth.c-16.us-east-1.aws.neon.tech/neondb/auth/.well-known/jwks.json"));({payload}=await jwtVerify(token,jwks,{issuer,audience,requiredClaims:["sub","exp","iat"]}));}catch{throw fail(401,"Session verification failed.");}
 const rows=await sql`SELECT id::text AS id,email,"emailVerified" AS verified FROM neon_auth."user" WHERE id::text=${payload.sub} AND COALESCE(banned,false)=false`;
 if(!rows.length)throw fail(401,"Account not found.");
 return rows[0];
}
export async function snapshot(sql,u){
 const [tickets,notices,prefs]=await Promise.all([
 sql`SELECT id,app,subject,status,reply,created_at FROM zuzify_comms.tickets WHERE user_id=${u.id} ORDER BY created_at DESC LIMIT 100`,
 sql`SELECT id,title,body,kind,created_at,read_at FROM zuzify_comms.notices WHERE user_id=${u.id} ORDER BY created_at DESC LIMIT 100`,
 sql`SELECT news,transactional FROM zuzify_comms.preferences WHERE user_id=${u.id}`]);
 return {tickets,notices,news:prefs[0]?.news??false,transactional:prefs[0]?.transactional??true,verified:u.verified===true};
}
export async function notice(sql,{id,kind,title,body,key}){
 await sql`WITH inserted AS (INSERT INTO zuzify_comms.notices(user_id,kind,title,body,event_key) VALUES (${id},${kind},${title},${body},${key}) ON CONFLICT(event_key) DO NOTHING RETURNING id,user_id,kind)
 INSERT INTO zuzify_comms.outbox(notice_id,user_id,kind) SELECT id,user_id,kind FROM inserted ON CONFLICT DO NOTHING`;
}
