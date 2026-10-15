import React from "react";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function PageLoader() {
  const { lang } = useLanguage();
  const label = lang === "sw" ? "Inapakia…" : "Loading…";
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="fixed inset-0 z-[9999] grid place-items-center"
         style={{ background: "radial-gradient(circle at 50% 42%, #042475 0%, #011957 48%, #010F3A 100%)" }}>
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <div className="relative h-36 w-36">
          <svg className="absolute inset-0 h-full w-full animate-spin-slow" viewBox="0 0 100 100" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="smk-arc" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#0062FD" />
                <stop offset=".55" stopColor="#3D8BFF" />
                <stop offset="1" stopColor="#FEA406" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="47.5" stroke="rgba(255,255,255,.08)" strokeWidth="2" />
            <circle cx="50" cy="50" r="47.5" stroke="url(#smk-arc)" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="76 223" />
          </svg>
          <img src="/logo.webp" alt="" draggable={false}
               className="absolute inset-2.5 h-[calc(100%-20px)] w-[calc(100%-20px)] rounded-full select-none"
               style={{ animation: "float-slow 4s ease-in-out infinite" }} />
        </div>
        <p className="text-xs font-medium tracking-wide text-white/60">{label}</p>
      </div>
    </div>
  );
}
