// ============================================================
// ConfirmDialog.jsx — promise-based confirm() replacement
// ============================================================
import React, { createContext, useContext, useState, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import { COLORS } from "../pages/dashboard/components/shared";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);

  const confirm = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      setState({
        title: opts.title || "Are you sure?",
        description: opts.description || "",
        confirmLabel: opts.confirmLabel || "Confirm",
        cancelLabel: opts.cancelLabel || "Cancel",
        danger: !!opts.danger,
        resolve,
      });
    });
  }, []);

  const finish = (result) =>
    setState((prev) => { prev?.resolve?.(result); return null; });

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-5">
            <div className="text-center mb-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{
                  background: state.danger
                    ? "rgba(193,80,46,0.12)"
                    : "rgba(232,163,61,0.12)",
                }}
              >
                <AlertTriangle
                  size={26}
                  color={state.danger ? COLORS.rust : COLORS.gold}
                />
              </div>
              <h3 className="text-base font-bold text-primary">{state.title}</h3>
              {state.description && (
                <p className="text-sm text-secondary mt-2 whitespace-pre-line">
                  {state.description}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => finish(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-secondary"
              >
                {state.cancelLabel}
              </button>
              <button
                onClick={() => finish(true)}
                autoFocus
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
                style={{
                  background: state.danger ? COLORS.rust : COLORS.gold,
                  color: state.danger ? "white" : COLORS.night,
                }}
              >
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    return (opts = {}) => {
      const text = [opts.title, opts.description].filter(Boolean).join("\n");
      return Promise.resolve(window.confirm(text));
    };
  }
  return ctx;
}
