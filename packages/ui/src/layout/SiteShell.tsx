import { useEffect,useState } from "react";
import type { ReactNode } from "react";
import { EffectsProvider } from "../context/EffectsContext";
import { Snowfall } from "../effects/Snowfall";
import { Atmosphere } from "../effects/Atmosphere";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { CommandMenu } from "../components/CommandMenu";
export function SiteShell({children,kind}:{children:ReactNode;kind:"xyz"|"lol"}){
 const [search,setSearch]=useState(false);
 useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();setSearch(v=>!v);}};window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey);},[]);
 return <EffectsProvider><div className={"site site-"+kind}><Atmosphere/><Snowfall/><a className="skip-link" href="#main-content">Skip to content</a><SiteHeader kind={kind} onSearch={()=>setSearch(true)}/><main id="main-content">{children}</main><SiteFooter kind={kind}/><CommandMenu open={search} onClose={()=>setSearch(false)} kind={kind}/></div></EffectsProvider>;
}
