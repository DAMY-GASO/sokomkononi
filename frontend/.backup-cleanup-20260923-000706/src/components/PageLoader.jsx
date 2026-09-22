// ============================================================
// PageLoader.jsx
// Loader rahisi — inaonekana kwa muda mfupi tu.
// Brand: SokoMkononi (night, gold, sand).
// Bilingual: "Inapakia..." / "Loading..."
// ============================================================

import React from "react";

export default function PageLoader({ lang = "sw" }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);

  return (
    <div
      style={{
        background: "#101A2E",
        fontFamily: "'Manrope', sans-serif",
      }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
    >
      {/* CSS Animations */}
      <style>{`
        @keyframes sokomkononi-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes sokomkononi-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes sokomkononi-fade-in {
          0% { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .sokomkononi-spinner {
          animation: sokomkononi-spin 0.8s linear infinite;
        }
        .sokomkononi-pulse {
          animation: sokomkononi-pulse 1.4s ease-in-out infinite;
        }
        .sokomkononi-fade-in {
          animation: sokomkononi-fade-in 0.4s ease-out;
        }
      `}</style>

      <div className="sokomkononi-fade-in flex flex-col items-center">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <span
            style={{ background: "#E8A33D", color: "#101A2E" }}
            className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-lg"
          >
            S
          </span>
          <span
            style={{ color: "#F5F3EC" }}
            className="font-bold tracking-tight text-xl"
          >
            SokoMkononi
          </span>
        </div>

        {/* Spinner — rahisi, brand colors */}
        <div className="relative w-12 h-12">
          {/* Outer ring (dim) */}
          <div
            style={{ borderColor: "rgba(232, 163, 61, 0.15)" }}
            className="absolute inset-0 rounded-full border-[3px]"
          />
          {/* Inner spinner (gold) */}
          <div
            style={{ borderTopColor: "#E8A33D" }}
            className="sokomkononi-spinner absolute inset-0 rounded-full border-[3px] border-transparent"
          />
          {/* Center dot */}
          <div
            style={{ background: "#E8A33D" }}
            className="sokomkononi-pulse absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
          />
        </div>

        {/* Loading text */}
        <p
          style={{ color: "rgba(245, 243, 236, 0.55)" }}
          className="text-xs mt-6 font-medium tracking-wide"
        >
          {t("Inapakia...", "Loading...")}
        </p>
      </div>
    </div>
  );
}
