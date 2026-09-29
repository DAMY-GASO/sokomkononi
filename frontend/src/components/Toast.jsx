// ============================================================
// Toast.jsx — Global toast system
// ============================================================
import React, {
  createContext, useContext, useState, useCallback, useEffect, useRef,
} from "react";
import { CheckCircle, AlertTriangle, Info, X, Loader2 } from "lucide-react";
import { COLORS } from "../pages/dashboard/components/shared";

const ToastContext = createContext(null);
let _idSeq = 0;

const ICONS = {
  success: CheckCircle,
  error: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2,
};

const TONES = {
  success: { fg: COLORS.green, bg: "rgba(47,109,79,0.08)", border: COLORS.green },
  error:   { fg: COLORS.rust,  bg: "rgba(193,80,46,0.08)", border: COLORS.rust },
  warning: { fg: "#8A5A16",    bg: "rgba(232,163,61,0.10)", border: COLORS.gold },
  info:    { fg: COLORS.night, bg: "rgba(16,26,46,0.06)", border: COLORS.night },
  loading: { fg: COLORS.night, bg: "white", border: COLORS.sandLine },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
  }, []);

  const push = useCallback((message, opts = {}) => {
    const id = `t_${++_idSeq}`;
    const duration =
      opts.duration != null
        ? opts.duration
        : opts.type === "loading" ? 0 : 4000;
    const entry = {
      id,
      type: opts.type || "info",
      title: opts.title || "",
      message: typeof message === "string" ? message : String(message || ""),
      action: opts.action || null,
    };
    setToasts((prev) => [...prev.slice(-4), entry]);
    if (duration > 0) {
      timersRef.current[id] = setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  const api = {
    push,
    dismiss,
    success: (m, o) => push(m, { ...o, type: "success" }),
    error:   (m, o) => push(m, { ...o, type: "error", duration: 6000 }),
    warning: (m, o) => push(m, { ...o, type: "warning" }),
    info:    (m, o) => push(m, { ...o, type: "info" }),
    loading: (m, o) => push(m, { ...o, type: "loading", duration: 0 }),
  };

  useEffect(() => () => {
    Object.values(timersRef.current).forEach(clearTimeout);
  }, []);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="fixed z-[10000] flex flex-col gap-2 pointer-events-none"
        style={{ top: 16, right: 16, left: 16, maxWidth: 380, marginLeft: "auto" }}
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info;
          const tone = TONES[t.type] || TONES.info;
          return (
            <div
              key={t.id}
              role="status"
              aria-live="polite"
              className="pointer-events-auto rounded-xl border shadow-lg px-3.5 py-3 flex items-start gap-2.5"
              style={{ background: "white", borderColor: tone.border }}
            >
              <div
                className="shrink-0 rounded-lg flex items-center justify-center w-7 h-7"
                style={{ background: tone.bg }}
              >
                <Icon
                  size={14}
                  color={tone.fg}
                  className={t.type === "loading" ? "animate-spin" : ""}
                />
              </div>
              <div className="flex-1 min-w-0">
                {t.title && (
                  <p className="text-xs font-semibold text-primary truncate">{t.title}</p>
                )}
                <p className="text-xs text-secondary leading-snug break-words">
                  {t.message}
                </p>
                {t.action && (
                  <button
                    onClick={() => { t.action.onClick?.(); dismiss(t.id); }}
                    className="mt-1.5 text-[11px] font-semibold hover:underline"
                    style={{ color: tone.fg }}
                  >
                    {t.action.label}
                  </button>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 text-muted hover:text-secondary"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      push: () => "", dismiss: () => {},
      success: () => "", error: () => "",
      warning: () => "", info: () => "", loading: () => "",
    };
  }
  return ctx;
}
