import { useState } from "react";
import { ArrowUpRight, Menu, Snowflake, X, Search } from "lucide-react";
import { useEffects } from "../context/EffectsContext";
type Props={kind:"xyz"|"lol";onSearch:()=>void};
export function SiteHeader({kind,onSearch}:Props){
 const [menu,setMenu]=useState(false);const {snow,toggleSnow}=useEffects();
 const nav=kind==="xyz"?[["Home","/"],["Ecosystem","/apps"],["Websites","/websites"],["Network","/network"],["About","/about"],["Developers","/developers"]]:[["Home","/"],["Playground","/lab"],["Projects","/projects"],["About","/about"]];
 return <header className="header"><div className="container nav-wrap">
 <a href="/" className="brand" aria-label="Zuzify home"><span className="brand-icon">Z</span><span>ZUZIFY<span className="brand-period">.</span></span><span className="brand-site">{kind==="lol"?"LOL":"XYZ"}</span></a>
 <nav className={"nav-links "+(menu?"nav-open":"")} aria-label="Main navigation">{nav.map(([title,href])=><a key={title} href={href} className={location.pathname===href?"nav-active":""} onClick={()=>setMenu(false)}>{title}</a>)}<a className="mobile-visit" href={kind==="xyz"?"https://zuzify.lol":"https://zuzify.xyz"}>{kind==="xyz"?"Visit .lol":"Visit .xyz"} <ArrowUpRight size={15}/></a></nav>
 <div className="nav-actions"><button className="icon-button snow-toggle" onClick={toggleSnow} aria-label={snow?"Turn off snow":"Turn on snow"} title={snow?"Snow on":"Snow off"} aria-pressed={snow}><Snowflake size={17} strokeWidth={1.7}/><span className={snow?"toggle-indicator is-on":"toggle-indicator"}/></button><button className="icon-button search-toggle" onClick={onSearch} aria-label="Open command menu" title="Search (Ctrl+K)"><Search size={18}/></button><a className="nav-other" href={kind==="xyz"?"https://zuzify.lol":"https://zuzify.xyz"}>{kind==="xyz"?"Explore .lol":"Back to .xyz"}<ArrowUpRight size={15}/></a><button className="icon-button menu-toggle" onClick={()=>setMenu(v=>!v)} aria-label={menu?"Close navigation":"Open navigation"} aria-expanded={menu}>{menu?<X size={20}/>:<Menu size={20}/>}</button></div>
 </div></header>;
}
