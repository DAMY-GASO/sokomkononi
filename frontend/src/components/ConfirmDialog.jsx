import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./ui";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const confirm = useCallback((opts = {}) => new Promise((resolve) => {
    setState({ title: opts.title || "Are you sure?", description: opts.description || "", confirmLabel: opts.confirmLabel || "Confirm", cancelLabel: opts.cancelLabel || "Cancel", danger: !!opts.danger, resolve });
  }), []);
  const finish = (r) => setState((p) => { p?.resolve?.(r); return null; });
  useEffect(() => {
    if (!state) return undefined;
    const onKey = (e) => { if (e.key === "Escape") finish(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [state]);
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="fixed inset-0 z-[10001] grid place-items-center p-4 bg-black/55 backdrop-blur-sm animate-fade-in">
          <div className="bg-card rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scale-in border border-[color:rgb(var(--c-hairline))]">
            <div className="text-center mb-5">
              <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full" style={{ background: state.danger ? "rgb(193 80 46 / .12)" : "rgb(254 164 6 / .14)" }}>
                <AlertTriangle size={26} color={state.danger ? "#C1502E" : "#A35F00"} />
              </div>
              <h3 className="text-[17px] font-semibold text-primary">{state.title}</h3>
              {state.description && <p className="mt-2 text-sm text-secondary whitespace-pre-line leading-relaxed">{state.description}</p>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => finish(false)} autoFocus={state.danger}>{state.cancelLabel}</Button>
              <Button variant={state.danger ? "danger" : "primary"} className="flex-1" onClick={() => finish(true)} autoFocus={!state.danger}>{state.confirmLabel}</Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) return (o = {}) => Promise.resolve(window.confirm([o.title, o.description].filter(Boolean).join("\n")));
  return ctx;
}
