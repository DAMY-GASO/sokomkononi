import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from "react";
import { CheckCircle2, AlertTriangle, Info, X, Loader2 } from "lucide-react";

const ToastContext = createContext(null);
let _idSeq = 0;

const STYLES = {
  success: { icon: CheckCircle2, bg: "rgb(47 109 79 / .10)",   fg: "#2F6D4F", bar: "#2F6D4F" },
  error:   { icon: AlertTriangle, bg: "rgb(193 80 46 / .10)",  fg: "#C1502E", bar: "#C1502E" },
  warning: { icon: AlertTriangle, bg: "rgb(180 83 9 / .10)",   fg: "#B45309", bar: "#B45309" },
  info:    { icon: Info,          bg: "rgb(0 98 253 / .10)",   fg: "#0062FD", bar: "#0062FD" },
  loading: { icon: Loader2,       bg: "rgb(var(--c-hairline))",fg: "rgb(var(--text-secondary))", bar: "rgb(var(--c-hairline))" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timersRef.current[id]) { clearTimeout(timersRef.current[id]); delete timersRef.current[id]; }
  }, []);

  const push = useCallback((message, opts = {}) => {
    const id = `t_${++_idSeq}`;
    const duration = opts.duration != null ? opts.duration : opts.type === "loading" ? 0 : 4000;
    setToasts((prev) => [...prev.slice(-4), { id, type: opts.type || "info", title: opts.title || "", message: typeof message === "string" ? message : String(message || ""), action: opts.action || null }]);
    if (duration > 0) timersRef.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const api = useMemo(() => ({
    push, dismiss,
    success: (m, o) => push(m, { ...o, type: "success" }),
    error:   (m, o) => push(m, { ...o, type: "error", duration: 6000 }),
    warning: (m, o) => push(m, { ...o, type: "warning" }),
    info:    (m, o) => push(m, { ...o, type: "info" }),
    loading: (m, o) => push(m, { ...o, type: "loading", duration: 0 }),
    update: (id, message, opts = {}) => {
      const type = opts.type || "info";
      const duration = opts.duration != null ? opts.duration : type === "loading" ? 0 : 4000;
      setToasts((prev) => prev.map((t) => t.id === id ? { ...t, type, message: String(message || ""), title: opts.title || t.title, action: opts.action || null } : t));
      if (duration > 0) {
        if (timersRef.current[id]) clearTimeout(timersRef.current[id]);
        timersRef.current[id] = setTimeout(() => dismiss(id), duration);
      } else if (timersRef.current[id]) {
        clearTimeout(timersRef.current[id]); delete timersRef.current[id];
      }
    },
  }), [push, dismiss]);

  useEffect(() => () => Object.values(timersRef.current).forEach(clearTimeout), []);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed z-[10000] flex flex-col gap-2 pointer-events-none px-4" style={{ top: 16, right: 16, left: "auto", maxWidth: 400, width: "calc(100vw - 32px)" }}>
        {toasts.map((t) => {
          const s = STYLES[t.type] || STYLES.info;
          const Icon = s.icon;
          return (
            <div key={t.id} role="status" aria-live={t.type === "error" ? "assertive" : "polite"} className="pointer-events-auto rounded-xl overflow-hidden border border-[color:rgb(var(--c-hairline))] shadow-lg bg-card animate-slide-in-right">
              <div className="flex items-start gap-3 p-3.5" style={{ borderLeft: `3px solid ${s.bar}` }}>
                <span className="shrink-0 grid place-items-center h-8 w-8 rounded-lg" style={{ background: s.bg, color: s.fg }}>
                  <Icon size={15} className={t.type === "loading" ? "animate-spin-slow" : ""} />
                </span>
                <div className="flex-1 min-w-0 pt-0.5">
                  {t.title && <p className="text-[13px] font-semibold text-primary truncate">{t.title}</p>}
                  <p className="text-[13px] text-secondary leading-snug break-words">{t.message}</p>
                  {t.action && (
                    <button onClick={() => { t.action.onClick?.(); dismiss(t.id); }} className="mt-1.5 text-[12px] font-semibold hover:underline" style={{ color: s.fg }}>{t.action.label}</button>
                  )}
                </div>
                <button onClick={() => dismiss(t.id)} className="shrink-0 -mr-1 -mt-1 grid h-7 w-7 place-items-center rounded-full text-muted hover:text-primary hover:bg-[color:rgb(var(--c-hairline))] transition-colors" aria-label="Close">
                  <X size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { push: () => "", dismiss: () => {}, success: () => "", error: () => "", warning: () => "", info: () => "", loading: () => "" };
  return ctx;
}
