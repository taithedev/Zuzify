import { useMemo,useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { categories, products } from "@zuzify/catalog";
import { ProductCard } from "./ProductCard";
export function ProductDirectory({compact=false}:{compact?:boolean}) {
 const [query,setQuery]=useState("");const [category,setCategory]=useState<string>("All");const [sort,setSort]=useState("featured");
 const filtered=useMemo(()=>{
   const q=query.trim().toLowerCase();
   const data=products.filter(p=>(category==="All"||p.category===category)&&(!q||[p.name,p.tagline,p.description,p.category,...p.tags].join(" ").toLowerCase().includes(q)));
   if(sort==="az")data.sort((a,b)=>a.name.localeCompare(b.name));
   else if(sort==="category")data.sort((a,b)=>a.category.localeCompare(b.category)||a.name.localeCompare(b.name));
   else data.sort((a,b)=>Number(!!b.featured)-Number(!!a.featured));
   return compact?data.slice(0,6):data;
 },[query,category,sort,compact]);
 return <div className="directory">
   <div className="directory-tools"><label className="search-field"><Search size={18}/><span className="sr-only">Search products</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search the ecosystem..." />{query&&<button onClick={()=>setQuery("")} aria-label="Clear search"><X size={16}/></button>}</label>
   <label className="sort-field"><SlidersHorizontal size={16}/><span className="sr-only">Sort projects</span><select value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">Featured first</option><option value="az">A to Z</option><option value="category">Category</option></select></label></div>
   <div className="category-list" role="group" aria-label="Filter by category">{categories.map(c=><button key={c} className={"category-pill "+(category===c?"active":"")} onClick={()=>setCategory(c)} aria-pressed={category===c}>{c}</button>)}</div>
   <div className="directory-count"><span>{filtered.length} {filtered.length===1?"project":"projects"}</span><span>DISCOVER WHAT'S NEXT</span></div>
   {filtered.length?<div className="product-grid">{filtered.map((product,i)=><ProductCard product={product} index={i} key={product.slug}/>)}</div>:<div className="empty-state"><h3>No projects found.</h3><p>Try another search term or clear the filters.</p><button className="button-link button-secondary" onClick={()=>{setQuery("");setCategory("All");}}>Reset filters</button></div>}
 </div>;
}
