import { useEffect, useRef } from "react";
import { useEffects } from "../context/EffectsContext";
import { useReducedMotion } from "../hooks/useReducedMotion";

type Flake = { x: number; y: number; r: number; speed: number; drift: number; phase: number };
export function Snowfall() {
  const ref = useRef<HTMLCanvasElement>(null);
  const {snow} = useEffects();
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!snow || reduced) return;
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let raf = 0, width = 0, height = 0, dpr = 1, last = 0;
    let flakes: Flake[] = [];
    const count = () => Math.min(110, Math.max(28, Math.floor(window.innerWidth / 13)));
    const create = (randomY=true):Flake => ({ x:Math.random()*width, y:randomY?Math.random()*height:-10, r:Math.random()*1.7+0.45, speed:Math.random()*18+8, drift:Math.random()*12-6, phase:Math.random()*Math.PI*2 });
    const resize=()=>{
      width=window.innerWidth; height=window.innerHeight; dpr=Math.min(window.devicePixelRatio||1,2);
      canvas.width=Math.ceil(width*dpr); canvas.height=Math.ceil(height*dpr);
      canvas.style.width=width+"px"; canvas.style.height=height+"px";
      ctx.setTransform(dpr,0,0,dpr,0,0);
      flakes=Array.from({length:count()},()=>create());
    };
    const draw=(t:number)=>{
      const dt=Math.min((t-last)/1000||0,0.05); last=t;
      ctx.clearRect(0,0,width,height);
      for(let i=0;i<flakes.length;i++){
        const f=flakes[i]; f.y+=f.speed*dt; f.x+=(f.drift+Math.sin(t/2400+f.phase)*3)*dt;
        if(f.y>height+12) flakes[i]=create(false);
        ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,Math.PI*2);
        ctx.fillStyle="rgba(255,255,255,"+(0.14+f.r*0.13)+")";ctx.fill();
      }
      if(!document.hidden)raf=requestAnimationFrame(draw);
    };
    const visibility=()=>{ if(!document.hidden){last=performance.now();raf=requestAnimationFrame(draw);}else cancelAnimationFrame(raf); };
    resize();window.addEventListener("resize",resize);document.addEventListener("visibilitychange",visibility);
    raf=requestAnimationFrame(draw);
    return ()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",resize);document.removeEventListener("visibilitychange",visibility);};
  },[snow,reduced]);
  return <canvas ref={ref} className="snow-canvas" aria-hidden="true"/>;
}
