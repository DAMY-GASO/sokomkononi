import React from "react";

export default function PageLoader({ lang = "sw" }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);

  return (
    <div
      style={{
        background: "#101A2E",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
    >
      <style>{`
        @keyframes smk-spin { to { transform: rotate(360deg); } }
        @keyframes smk-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes smk-fade { from { opacity:0; transform: translateY(6px);} to { opacity:1; transform: translateY(0);} }
        .smk-spinner { animation: smk-spin .8s linear infinite; }
        .smk-pulse { animation: smk-pulse 1.4s ease-in-out infinite; }
        .smk-fade { animation: smk-fade .4s ease-out; }
      `}</style>

      <div className="smk-fade flex flex-col items-center">
        <div className="flex items-center gap-2 mb-8">
          <span
            style={{ background: "#E8A33D", color: "#101A2E" }}
            className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-lg"
          >
            S
          </span>
          <span style={{ color: "#F5F3EC" }} className="font-bold tracking-tight text-xl">
            SokoMkononi
          </span>
        </div>

        <div className="relative w-12 h-12">
          <div
            style={{ borderColor: "rgba(232, 163, 61, 0.15)" }}
            className="absolute inset-0 rounded-full border-[3px]"
          />
          <div
            style={{ borderTopColor: "#E8A33D" }}
            className="smk-spinner absolute inset-0 rounded-full border-[3px] border-transparent"
          />
          <div
            style={{ background: "#E8A33D" }}
            className="smk-pulse absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
          />
        </div>

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
