import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
type ContextValue = { snow: boolean; toggleSnow: () => void };
const Context = createContext<ContextValue | null>(null);
export function EffectsProvider({children}:{children:React.ReactNode}) {
  const [snow, setSnow] = useState(true);
  useEffect(() => { try { const saved = localStorage.getItem("zuzify:snow"); if(saved!==null) setSnow(saved==="true"); } catch {} }, []);
  const toggleSnow = () => setSnow((v) => { try { localStorage.setItem("zuzify:snow",String(!v)); } catch {} return !v; });
  const value = useMemo(() => ({snow,toggleSnow}),[snow]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useEffects() {
  const value = useContext(Context);
  if (!value) throw new Error("useEffects must be used inside EffectsProvider");
  return value;
}
