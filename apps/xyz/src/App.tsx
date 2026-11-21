import { Routes,Route } from "react-router-dom";
import { SiteShell } from "@zuzify/ui";
import { Home } from "./pages/Home";
import { Apps } from "./pages/Apps";
import { Websites } from "./pages/Websites";
import { ProductDetail } from "./pages/ProductDetail";
import { About } from "./pages/About";
import { Developers } from "./pages/Developers";
import { Legal } from "./pages/Legal";
import { NotFound } from "./pages/NotFound";
import { Network } from "./pages/Network";
export function App(){return <SiteShell kind="xyz"><Routes><Route path="/" element={<Home/>}/><Route path="/apps" element={<Apps/>}/><Route path="/websites" element={<Websites/>}/><Route path="/network" element={<Network/>}/><Route path="/apps/:slug" element={<ProductDetail/>}/><Route path="/about" element={<About/>}/><Route path="/developers" element={<Developers/>}/><Route path="/privacy" element={<Legal type="privacy"/>}/><Route path="/terms" element={<Legal type="terms"/>}/><Route path="*" element={<NotFound/>}/></Routes></SiteShell>;}
