import {createRemoteJWKSet,jwtVerify} from "jose";
const base="https://ep-rough-recipe-bcjp6wq7.neonauth.c-16.us-east-1.aws.neon.tech/neondb/auth";
const origin=new URL(base).origin;
const jwks=createRemoteJWKSet(new URL(base+"/.well-known/jwks.json"),{timeoutDuration:5000});
export async function verifyIdentity(token){
 const {payload}=await jwtVerify(token,jwks,{algorithms:["EdDSA"],issuer:origin,audience:origin,requiredClaims:["sub","exp","iat"],clockTolerance:5});
 if(typeof payload.sub!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.sub))throw new Error("Invalid subject");
 return payload;
}
export function logVerificationFailure(error){
 const code=typeof error?.code==="string"&&/^[A-Z0-9_]{1,64}$/.test(error.code)?error.code:"VERIFY_FAILED";
 const claim=["iss","aud","exp","iat","sub","nbf"].includes(error?.claim)?error.claim:null;
 console.warn("Zuzify JWT rejected",{code,claim});
}
