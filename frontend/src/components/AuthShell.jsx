import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";

function Skyline({ fill = "#FEA406" }) {
  return (
    <svg viewBox="0 0 400 200" className="absolute bottom-0 left-0 h-40 w-full opacity-[0.15]" preserveAspectRatio="none" aria-hidden="true">
      <rect x="0" y="120" width="46" height="80" fill={fill} />
      <rect x="52" y="80" width="34" height="120" fill={fill} />
      <rect x="92" y="140" width="52" height="60" fill={fill} />
      <polygon points="150,100 178,60 206,100" fill={fill} />
      <rect x="150" y="100" width="56" height="100" fill={fill} />
      <rect x="214" y="70" width="30" height="130" fill={fill} />
      <rect x="250" y="130" width="60" height="70" fill={fill} />
      <rect x="316" y="95" width="40" height="105" fill={fill} />
      <rect x="362" y="150" width="38" height="50" fill={fill} />
    </svg>
  );
}

export default function AuthShell({ panelHeading, panelSubtext, panelExtra, formHeading, formSubtext, children, footer, admin = false }) {
  const { lang } = useLanguage();
  const t = (sw, en) => (lang === "sw" ? sw : en);
  return (
    <div className="min-h-screen bg-[color:rgb(var(--c-page))] lg:grid lg:grid-cols-2">
      <aside className="surface-night noise relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div className="relative z-10 flex items-center justify-between gap-3">
          <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm transition-colors hover:bg-white/[0.12] hover:text-white">
            <ArrowLeft size={14} />
            {t("Nyumbani", "Home")}
          </Link>
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.webp" alt="" className="h-8 w-8 rounded-full" />
            <span className="text-[15px] font-bold text-white">SokoMkononi</span>
            {admin && <span className="rounded-full bg-[#FEA406]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#FEA406]">Admin</span>}
          </Link>
        </div>
        <div className="relative z-10 max-w-md">
          <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold leading-[1.1] tracking-tight text-white">{panelHeading}</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/65">{panelSubtext}</p>
          {panelExtra && <div className="mt-8">{panelExtra}</div>}
        </div>
        <p className="relative z-10 text-[11px] uppercase tracking-[0.16em] text-white/35">© {new Date().getFullYear()} SokoMkononi</p>
        <Skyline />
      </aside>
      <main className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.webp" alt="" className="h-8 w-8 rounded-full" />
              <span className="text-[15px] font-bold text-primary">SokoMkononi</span>
            </Link>
            <Link to="/" className="text-sm font-medium text-secondary hover:text-primary">{t("Nyumbani", "Home")}</Link>
          </div>
          <h1 className="text-[clamp(1.5rem,3vw,1.875rem)] font-bold tracking-tight text-primary">{formHeading}</h1>
          {formSubtext && <p className="mt-2 text-sm leading-relaxed text-secondary">{formSubtext}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
