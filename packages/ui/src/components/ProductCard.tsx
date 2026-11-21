import type { Product } from "@zuzify/catalog";
import { ArrowUpRight, Github } from "lucide-react";
export function ProductCard({product,index=0}:{product:Product;index?:number}) {
 const href="/apps/"+product.slug;
 return <article className="product-card" style={{animationDelay:Math.min(index,12)*45+"ms"}}>
  <div className="product-card-top"><span className="card-eyebrow">{product.eyebrow}</span><span className={"status "+(product.status==="Concept"?"status-concept":"")}><span/>{product.status}</span></div>
  <div className="product-symbol" aria-hidden="true">{product.symbol}</div>
  <div className="product-card-bottom"><div className="product-meta">{product.category} <span>•</span> {product.tags[0]}</div><h3>{product.name}</h3><p>{product.tagline}</p>
  <div className="product-actions"><a className="card-action" href={href} aria-label={"Explore "+product.name}>Explore <ArrowUpRight size={16}/></a>{product.repoUrl&&<a className="card-icon-action" href={product.repoUrl} target="_blank" rel="noopener noreferrer" aria-label={product.name+" GitHub repository"}><Github size={17}/></a>}</div>
  </div>
 </article>;
}
