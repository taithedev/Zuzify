import { useEffect,useRef,useState } from "react";
import type { ReactNode } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
export function Reveal({children,className=""}:{children:ReactNode;className?:string}) {
 const ref=useRef<HTMLDivElement>(null); const [visible,setVisible]=useState(false); const reduced=useReducedMotion();
 useEffect(()=>{if(reduced){setVisible(true);return;} const node=ref.current; if(!node)return; const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){setVisible(true);observer.disconnect();}},{threshold:0.08});observer.observe(node);return()=>observer.disconnect();},[reduced]);
 return <div ref={ref} className={"reveal "+(visible?"reveal-visible ":"")+className}>{children}</div>;
}
