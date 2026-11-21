import { Routes,Route } from "react-router-dom";
import { SiteShell } from "@zuzify/ui";
import { Home } from "./pages/Home";
import { Apps } from "./pages/Apps";
import { ProductDetail } from "./pages/ProductDetail";
import { About } from "./pages/About";
import { Developers } from "./pages/Developers";
import { Legal } from "./pages/Legal";
import { NotFound } from "./pages/NotFound";
export function App(){return <SiteShell kind="xyz"><Routes><Route path="/" element={<Home/>}/><Route path="/apps" element={<Apps/>}/><Route path="/apps/:slug" element={<ProductDetail/>}/><Route path="/about" element={<About/>}/><Route path="/developers" element={<Developers/>}/><Route path="/privacy" element={<Legal type="privacy"/>}/><Route path="/terms" element={<Legal type="terms"/>}/><Route path="*" element={<NotFound/>}/></Routes></SiteShell>;}
