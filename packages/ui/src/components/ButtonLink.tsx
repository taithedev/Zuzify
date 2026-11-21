import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
export function ButtonLink({href,children,secondary=false,external=false}: {href:string;children:ReactNode;secondary?:boolean;external?:boolean}) {
  return <a className={"button-link "+(secondary?"button-secondary":"button-primary")} href={href} {...(external?{target:"_blank",rel:"noopener noreferrer"}:{})}>{children}<ArrowUpRight size={16}/></a>;
}
