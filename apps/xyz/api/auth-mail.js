import { compactVerify, createRemoteJWKSet } from "jose";
export const config = { runtime: "edge" };
const auth = "https://ep-rough-recipe-bcjp6wq7.neonauth.c-16.us-east-1.aws.neon.tech/neondb/auth";
const jwks = createRemoteJWKSet(new URL(auth+"/.well-known/jwks.json"),{timeoutDuration:2500,cooldownDuration:30000});
const enc = new TextEncoder();
const b64 = bytes => btoa(Array.from(bytes,b=>String.fromCharCode(b)).join("")).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const escape = s => s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const reply=(status,value)=>Response.json(value,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"}});
const labels={"email-verification":"Verify your email","sign-in":"Sign in to Zuzify","forget-password":"Reset your password"};
async function verified(request){
 const sig=request.headers.get("x-neon-signature")||"",kid=request.headers.get("x-neon-signature-kid")||"",ts=request.headers.get("x-neon-timestamp")||"";
 if(!/^\d{13}$/.test(ts)||Math.abs(Date.now()-Number(ts))>300000||!kid||kid.length>128||sig.length>2048)throw new Error("signature");
 const [header,empty,signature,...rest]=sig.split(".");
 if(rest.length||!header||empty!==""||!signature)throw new Error("signature");
 const reader=request.body?.getReader();if(!reader)throw new Error("body");let size=0;const chunks=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>32768){await reader.cancel();throw new Error("body");}chunks.push(value);}
 const raw=new Uint8Array(size);let pos=0;for(const chunk of chunks){raw.set(chunk,pos);pos+=chunk.length;}
 const signed=b64(enc.encode(ts+"."+b64(raw)));
 const result=await compactVerify(header+"."+signed+"."+signature,async (protectedHeader,token)=>{if(protectedHeader.kid!==kid||protectedHeader.alg!=="EdDSA")throw new Error("key");return jwks(protectedHeader,token);},{algorithms:["EdDSA"]});
 const event=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(raw));
 if(event.event_id!==request.headers.get("x-neon-event-id")||event.event_type!==request.headers.get("x-neon-event-type")||!/^[a-f0-9-]{36}$/i.test(event.event_id)||event.context?.endpoint_id!=="ep-rough-recipe-bcjp6wq7")throw new Error("event");
 return event;
}
export default async function handler(request){
 if(request.method==="GET")return reply(200,{service:"zuzify-auth-mail",configured:Boolean(process.env.RESEND_API_KEY)});
 if(request.method!=="POST")return reply(405,{error:"Method not allowed"});
 let event;try{event=await verified(request);}catch{return reply(401,{error:"Invalid webhook"});}
 if(!["send.otp","send.magic_link"].includes(event.event_type))return reply(400,{error:"Unsupported event"});
 const d=event.event_data||{},email=event.user?.email;
 const type=event.event_type==="send.otp"?d.otp_type:d.link_type;
 if(typeof email!=="string"||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!Object.hasOwn(labels,type)||d.delivery_preference==="sms")return reply(400,{error:"Invalid delivery event"});
 const expiration=Date.parse(d.expires_at);if(!Number.isFinite(expiration)||expiration<=Date.now())return reply(400,{error:"Expired delivery event"});
 const title=labels[type];let content,plain;
 if(event.event_type==="send.otp"){
  if(typeof d.otp_code!=="string"||!/^\d{6}$/.test(d.otp_code))return reply(400,{error:"Invalid code"});
  content='<p>Enter this one-time code in the Zuzify account screen.</p><div style="font-size:38px;letter-spacing:8px;font-weight:bold;padding:20px;background:#f1f1f1;color:#111;border-radius:10px;text-align:center">'+escape(d.otp_code)+'</div>';
  plain="Your Zuzify code: "+d.otp_code;
 }else{
  let url;try{url=new URL(d.link_url);if(url.protocol!=="https:"||url.username||url.password||![new URL(auth).origin,"https://zuzify.xyz","https://www.zuzify.xyz"].includes(url.origin))throw new Error();}catch{return reply(400,{error:"Invalid authentication link"});}
  content='<p>Open the secure link to continue.</p><p><a style="display:inline-block;background:#111;color:white;padding:14px 22px;border-radius:9px;text-decoration:none" href="'+escape(url.href)+'">'+title+'</a></p>';
  plain=title+": "+url.href;
 }
 const safety="This request expires soon. Never share your code or link. If you did not request this, ignore this email.";
 const html='<div style="background:#f4f4f4;padding:28px;font-family:Arial,sans-serif;color:#111"><div style="max-width:520px;margin:auto;background:white;border:1px solid #ddd;border-radius:16px;padding:28px"><p style="font-size:22px;font-weight:bold">ZUZIFY ID</p><hr style="border:0;border-top:1px solid #eee"><h1 style="font-size:24px">'+title+'</h1>'+content+'<p style="font-size:13px;color:#666">'+safety+'</p><p style="font-size:12px;color:#777">Zuzify · zuzify.xyz</p></div></div>';
 if(!process.env.RESEND_API_KEY)return reply(503,{error:"Email delivery unavailable"});
 try{
 const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+process.env.RESEND_API_KEY,"Content-Type":"application/json","Idempotency-Key":"zuzify-auth/"+event.event_id},body:JSON.stringify({from:"Zuzify ID <auth@zuzify.xyz>",to:[email],subject:title+" | Zuzify",html,text:plain+"\n\n"+safety}),signal:AbortSignal.timeout(5000),redirect:"error"});
 if(!response.ok)return reply(502,{error:"Email provider rejected delivery"});
 return reply(200,{ok:true});
 }catch{return reply(503,{error:"Email delivery unavailable"});}
}
