import { useEffect,useMemo,useState } from "react";
import { ArrowUpRight, Command, Search, X } from "lucide-react";
import { products } from "@zuzify/catalog";
export function CommandMenu({open,onClose,kind}:{open:boolean;onClose:()=>void;kind:"xyz"|"lol"}){
 const [value,setValue]=useState("");
 useEffect(()=>{if(!open)setValue("");},[open]);
 useEffect(()=>{if(!open)return;const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape")onClose();};document.addEventListener("keydown",onKey);return()=>document.removeEventListener("keydown",onKey);},[open,onClose]);
 const entries=useMemo(()=>{
   const base=kind==="xyz"?[["Home","/"],["All apps","/apps"],["About","/about"],["Developers","/developers"]]:[["Home","/"],["Playground","/lab"],["Projects","/projects"],["About","/about"]];
   return [...base.map(([name,url])=>({name,url,label:"Page"})),...products.map(p=>({name:p.name,url:kind==="xyz"?"/apps/"+p.slug:"/projects",label:p.category}))].filter(e=>(e.name+" "+e.label).toLowerCase().includes(value.toLowerCase())).slice(0,9);
 },[value,kind]);
 if(!open)return null;
 return <div className="command-backdrop" onMouseDown={onClose} role="presentation"><div className="command-dialog" role="dialog" aria-modal="true" aria-label="Search Zuzify" onMouseDown={e=>e.stopPropagation()}><div className="command-input"><Search size={19}/><input autoFocus placeholder="Search pages and projects..." value={value} onChange={e=>setValue(e.target.value)}/><button onClick={onClose} aria-label="Close search"><X size={18}/></button></div><div className="command-items">{entries.length?entries.map(e=><a href={e.url} key={e.label+e.name} onClick={onClose}><span className="command-item-icon"><Command size={16}/></span><span>{e.name}</span><small>{e.label}</small><ArrowUpRight size={15}/></a>):<p className="command-empty">Nothing found. Try another search.</p>}</div><div className="command-footer">SEARCH YOUR ECOSYSTEM <span>ESC TO CLOSE</span></div></div></div>;
}
