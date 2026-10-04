import React from "react";

/**
 * PageLoader — inaonyesha logo halisi ya SokoMkononi (public/logo.webp)
 * ikiwa na pete ndogo inayozunguka. Rangi zinatoka kwenye logo.
 */
export default function PageLoader({ lang = "sw" }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background:
          "radial-gradient(circle at 50% 42%, #042475 0%, #011957 48%, #010F3A 100%)",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      <style>{`
        @keyframes smk-orbit { to { transform: rotate(360deg); } }
        @keyframes smk-breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.035); } }
        @keyframes smk-pulse { 0%,100% { opacity: .9; } 50% { opacity: .4; } }
        @keyframes smk-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .smk-fade    { animation: smk-fade .45s ease-out both; }
        .smk-orbit   { animation: smk-orbit 1.3s linear infinite; transform-origin: 50% 50%; }
        .smk-breathe { animation: smk-breathe 2.4s ease-in-out infinite; }
        .smk-pulse   { animation: smk-pulse 1.6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .smk-orbit, .smk-breathe, .smk-pulse { animation: none; }
        }
      `}</style>

      <div className="smk-fade flex flex-col items-center">
        {/* Logo + pete */}
        <div className="relative h-[148px] w-[148px] sm:h-[168px] sm:w-[168px]">
          <svg
            className="smk-orbit absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            fill="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="smk-arc" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#0062FD" />
                <stop offset="0.55" stopColor="#3D8BFF" />
                <stop offset="1" stopColor="#FEA406" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="47.5" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
            <circle
              cx="50"
              cy="50"
              r="47.5"
              stroke="url(#smk-arc)"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeDasharray="76 223"
            />
          </svg>

          <img
            src="/logo.webp"
            alt="SokoMkononi"
            width={512}
            height={512}
            draggable={false}
            className="smk-breathe absolute left-[10px] top-[10px] h-[calc(100%-20px)] w-[calc(100%-20px)] select-none rounded-full"
          />
        </div>

        <p
          className="smk-pulse mt-7 text-xs font-medium tracking-wide"
          style={{ color: "rgba(255, 255, 255, 0.65)" }}
        >
          {t("Inapakia...", "Loading...")}
        </p>
      </div>
    </div>
  );
}
