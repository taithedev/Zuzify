import {db,send} from "./_lib/communications.js";
export default async function handler(req,res){if(req.method!=="GET")return send(res,405,{error:"Method not allowed"});try{const sql=db();await sql`SELECT 1 FROM zuzify_comms.directory LIMIT 1`;return send(res,200,{ok:true,service:"zuzify-hub",database:"ready"})}catch{return send(res,503,{ok:false,service:"zuzify-hub",database:"unavailable"})}}
