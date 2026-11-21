import { Route,Routes } from "react-router-dom";
import { SiteShell } from "@zuzify/ui";
import { Home } from "./pages/Home";
import { Lab } from "./pages/Lab";
import { Projects } from "./pages/Projects";
import { About } from "./pages/About";
import { Legal } from "./pages/Legal";
import { NotFound } from "./pages/NotFound";
export function App(){return <SiteShell kind="lol"><Routes><Route path="/" element={<Home/>}/><Route path="/lab" element={<Lab/>}/><Route path="/projects" element={<Projects/>}/><Route path="/about" element={<About/>}/><Route path="/privacy" element={<Legal type="privacy"/>}/><Route path="/terms" element={<Legal type="terms"/>}/><Route path="*" element={<NotFound/>}/></Routes></SiteShell>;}
