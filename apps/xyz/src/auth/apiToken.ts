import {authClient} from "./client";
const jwt=(value:unknown):value is string=>typeof value==="string"&&/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value);
export async function getApiToken():Promise<string>{
 const client=authClient as unknown as {getJWTToken?:()=>Promise<unknown>;getSession:()=>Promise<{data?:{session?:{access_token?:unknown;token?:unknown}}|null}>};
 try{const token=await client.getJWTToken?.();if(jwt(token))return token}catch{/* Refresh the existing session before failing. */}
 try{const result=await client.getSession();const token=result.data?.session?.access_token;if(jwt(token))return token;const sessionToken=result.data?.session?.token;if(jwt(sessionToken))return sessionToken;const refreshed=await client.getJWTToken?.();if(jwt(refreshed))return refreshed}catch{/* Never treat an opaque session ID as a JWT. */}
 throw new Error("Could not retrieve a secure sign-in token. Sign out, sign in again on www.zuzify.xyz, then retry.");
}
export async function parseApi<T>(response:Response):Promise<T>{
 const type=response.headers.get("content-type")||"";
 if(!type.includes("application/json"))throw new Error(response.status===404?"The service route is missing from this deployment.": "The server returned an unexpected response ("+response.status+").");
 const data=await response.json();if(!response.ok)throw new Error(typeof data.error==="string"?data.error:"The request failed ("+response.status+").");return data as T;
}
