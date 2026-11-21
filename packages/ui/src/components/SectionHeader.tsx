import type { ReactNode } from "react";
export function SectionHeader({eyebrow,title,description,action}:{eyebrow:string;title:string;description?:string;action?:ReactNode}) {
  return <div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/>{eyebrow}</div><h2>{title}</h2>{description&&<p>{description}</p>}</div>{action&&<div className="section-action">{action}</div>}</div>;
}
