// ============================================================
// AttributionContext.jsx
// Easter egg: 7 rapid taps on the SokoMkononi logo reveal a
// "built by" modal with the developer's links.
//
// Behaviour:
//   • 1 tap         → normal navigation (go home)
//   • 7 taps ≤ 900ms apart → open the modal
//   • Counter decays 900ms after the last tap
//
// State lives in a Provider so taps on the Navbar logo AND the
// Footer logo contribute to the same counter.
// ============================================================
import React, { createContext, useCallback, useContext, useRef, useState } from "react";

const AttributionContext = createContext(null);

const TAPS_TO_UNLOCK = 7;
const DECAY_MS = 900;

export function AttributionProvider({ children }) {
  const [open, setOpen] = useState(false);
  const tapRef = useRef({ count: 0, lastTap: 0, firstTapAt: 0 });

  // Returns true when the egg fires (so callers can prevent default).
  const registerTap = useCallback(() => {
    const now = Date.now();
    const t = tapRef.current;

    // Reset the streak if too much time passed
    if (now - t.lastTap > DECAY_MS) {
      t.count = 0;
    }
    t.count += 1;
    t.lastTap = now;
    if (t.count === 1) t.firstTapAt = now;

    if (t.count >= TAPS_TO_UNLOCK) {
      t.count = 0;
      setOpen(true);
      // Gentle haptic on devices that support it
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try { navigator.vibrate([10, 40, 10, 40, 40]); } catch { /* noop */ }
      }
      return true;
    }
    return false;
  }, []);

  const value = { open, setOpen, registerTap, close: () => setOpen(false) };

  return (
    <AttributionContext.Provider value={value}>
      {children}
      <AttributionModal open={open} onClose={() => setOpen(false)} />
    </AttributionContext.Provider>
  );
}

export function useAttribution() {
  const ctx = useContext(AttributionContext);
  if (!ctx) {
    // Safe no-op so pages rendered outside the provider still work
    return { open: false, registerTap: () => false, close: () => {}, setOpen: () => {} };
  }
  return ctx;
}


// ═══════════════════════════════════════════════════════════
// MODAL
// ═══════════════════════════════════════════════════════════
function AttributionModal({ open, onClose }) {
  const [lang, setLang] = useState("sw");

  // Read app language from localStorage so we don't need a hook here
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem("preferred_language");
      if (saved === "en" || saved === "sw") setLang(saved);
    } catch { /* noop */ }
  }, [open]);

  // Close on Escape
  React.useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const LINKS = [
    {
      href: "https://msimuitsolutions.com",
      name: "Msimuit Solutions",
      host: "msimuitsolutions.com",
      initials: "MS",
      bg: "#011957",
      fg: "#FFFFFF",
    },
    {
      href: "https://francisbahatiportfolio.netlify.app/",
      name: "Francis Bahati",
      host: "francisbahatiportfolio.netlify.app",
      initials: "FB",
      bg: "#FEA406",
      fg: "#011957",
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("Kuhusu msanidi programu", "About the developer")}
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fade-in-soft_0.2s_ease-out]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
        style={{ animation: "scale-in 0.25s cubic-bezier(0.16,1,0.3,1) both" }}
      >
        {/* Header */}
        <div
          className="relative px-6 pt-7 pb-5 text-center"
          style={{
            background: "linear-gradient(135deg, #011957 0%, #042475 100%)",
          }}
        >
          <div
            className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center shadow-lg"
            style={{
              background: "linear-gradient(135deg, #FEA406 0%, #FD8706 100%)",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                 stroke="#011957" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <h2 className="text-white text-xl font-bold mb-1">
            {t("Imeundwa kwa mkono", "Crafted by hand")}
          </h2>
          <p className="text-white/70 text-xs sm:text-sm max-w-xs mx-auto leading-relaxed">
            {t(
              "SokoMkononi imeundwa kutoka mwanzo hadi mwisho na msanidi programu mmoja — mfumo wote, seva, na app.",
              "SokoMkononi was designed and built from the ground up by a single developer — the entire stack, server, and app."
            )}
          </p>
        </div>

        {/* Links */}
        <div className="p-5 space-y-3">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 p-3 rounded-xl border-2 transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{ borderColor: "#DCE4F2" }}
            >
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: l.bg, color: l.fg }}
              >
                {l.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#011957] truncate">
                  {l.name}
                </p>
                <p className="text-xs text-[#6B7280] truncate">{l.host}</p>
              </div>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden="true"
              >
                <path d="M7 17 17 7M7 7h10v10" />
              </svg>
            </a>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-colors"
            style={{ background: "#011957", color: "#FFFFFF" }}
          >
            {t("Sawa, Asante!", "Got it, Thanks!")}
          </button>
          <p className="text-center text-[10px] text-[#9CA3AF] mt-3">
            {t("Siri ya SokoMkononi ✨", "A SokoMkononi secret ✨")}
          </p>
        </div>
      </div>
    </div>
  );
}
