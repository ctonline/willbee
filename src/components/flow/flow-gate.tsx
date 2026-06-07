"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { WillFlow } from "./will-flow";

interface FlowContextValue {
  start: () => void;
}

const FlowContext = createContext<FlowContextValue | null>(null);

/** Hook used by CTA buttons inside the (server-rendered) landing page. */
export function useFlowStart(): FlowContextValue {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error("useFlowStart must be used within <FlowGate>");
  return ctx;
}

/**
 * Wraps the server-rendered landing page. While not started it renders the
 * landing (its children); once a CTA calls `start()` it swaps in the Q&A flow.
 */
export function FlowGate({ children }: { children: React.ReactNode }) {
  const [started, setStarted] = useState(false);
  const start = useCallback(() => {
    setStarted(true);
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }, []);

  return (
    <FlowContext.Provider value={{ start }}>
      {started ? <WillFlow onExit={() => setStarted(false)} /> : children}
    </FlowContext.Provider>
  );
}
