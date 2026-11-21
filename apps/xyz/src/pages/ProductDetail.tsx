import { useParams } from "react-router-dom";
import { getProduct,products } from "@zuzify/catalog";
import { ArrowLeft, ArrowRight, ArrowUpRight, Github } from "lucide-react";
import { ProductCard } from "@zuzify/ui";
import { NotFound } from "./NotFound";
export function ProductDetail(){
 const {slug}=useParams();const product=getProduct(slug??"");if(!product)return <NotFound/>;
 const related=products.filter(p=>p.slug!==product.slug&&(p.category===product.category||p.featured)).slice(0,3);
 return <div className="container product-detail"><a className="back-link" href="/apps"><ArrowLeft size={16}/> Back to all projects</a><div className="detail-hero"><div><div className="eyebrow"><span className="eyebrow-dot"/>{product.eyebrow}</div><h1>{product.name}<span className="display-dot">.</span></h1><p className="detail-tagline">{product.tagline}</p><div className="detail-tags">{product.tags.map(tag=><span key={tag}>{tag}</span>)}</div><div className="detail-links">{product.websiteUrl&&<a className="button-link button-primary" href={product.websiteUrl} target="_blank" rel="noopener noreferrer">Visit website <ArrowUpRight size={17}/></a>}{product.repoUrl&&<a className="button-link button-secondary" href={product.repoUrl} target="_blank" rel="noopener noreferrer"><Github size={18}/> View repository</a>}{!product.repoUrl&&!product.websiteUrl&&<span className="detail-notice">Public link not available yet.</span>}</div></div><div className="detail-art" aria-hidden="true"><span>{product.symbol}</span><div>PROJECT / {product.slug.toUpperCase()}</div></div></div>
 <div className="detail-info"><div><span>PROJECT OVERVIEW</span><p>{product.description}</p></div><div><span>CATEGORY</span><strong>{product.category}</strong><span>PROJECT STATUS</span><strong>{product.status}</strong><span>ECOSYSTEM</span><strong>Zuzify</strong></div></div><div className="related-heading"><h2>Keep exploring.</h2><a href="/apps">All apps <ArrowRight size={16}/></a></div><div className="product-grid">{related.map(p=><ProductCard key={p.slug} product={p}/>)}</div></div>;
}
