import {db,send,handle,fail} from "./_lib/communications.js";
export default async function handler(req,res){try{if(req.method!=="GET")throw fail(405,"Method not allowed.");const sql=db();return send(res,200,{sites:await sql`SELECT domain,title,category FROM zuzify_comms.directory WHERE visible=true ORDER BY category,title,domain`});}catch(e){return handle(res,e);}}
