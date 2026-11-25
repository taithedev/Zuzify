import {useState,type CSSProperties} from "react";
import {Snowflake} from "lucide-react";
const flakes=Array.from({length:34},(_,i)=>({left:(i*37.17+3)%100,delay:-(i*3.19%24),duration:17+(i*7.7%17),size:2+(i%4),drift:(i%2?1:-1)*(20+(i*13%65)),opacity:.12+(i%5)*.055}));
export function Snowfall(){
const [enabled,setEnabled]=useState(()=>{try{return localStorage.getItem("zuzify-snow")!=="off"}catch{return true}});
function toggle(){setEnabled(old=>{try{localStorage.setItem("zuzify-snow",old?"off":"on")}catch{}return !old})}
return <>{enabled&&<div className="winter-snow" aria-hidden="true">{flakes.map((f,i)=><i key={i} style={{left:f.left+"%",width:f.size,height:f.size,animationDelay:f.delay+"s",animationDuration:f.duration+"s",opacity:f.opacity,"--snow-drift":f.drift+"px"} as CSSProperties}/>)}</div>}<button type="button" className="winter-toggle" aria-label={enabled?"Turn snowfall off":"Turn snowfall on"} aria-pressed={enabled} title={enabled?"Disable snow":"Enable snow"} onClick={toggle}><Snowflake size={17}/></button></>;
}
