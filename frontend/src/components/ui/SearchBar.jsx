// ============================================================
// SearchBar.jsx — Professional search input with icon on the right.
// Used across the app for consistent spacing, height and behaviour.
// ============================================================
import React, { useState } from "react";
import { Search } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function SearchBar({
  value = "",
  onChange,
  onSubmit,
  placeholder,
  size = "md",
  variant = "light",
  className = "",
  ariaLabel,
}) {
  const { lang } = useLanguage();
  const [internal, setInternal] = useState(value);
  const controlled = typeof onChange === "function";

  const current = controlled ? value : internal;
  const handleChange = (e) => {
    const v = e.target.value;
    if (controlled) onChange(v);
    else setInternal(v);
  };

  const submit = (e) => {
    e?.preventDefault?.();
    if (onSubmit) onSubmit(current?.trim?.() ?? "");
  };

  const sizes = {
    sm: "h-10 pl-4 pr-12 text-sm",
    md: "h-12 pl-5 pr-14 text-sm sm:text-base",
    lg: "h-14 pl-6 pr-16 text-base",
  };
  const btnSizes = {
    sm: "w-8 h-8 right-1.5",
    md: "w-9 h-9 right-1.5",
    lg: "w-11 h-11 right-1.5",
  };
  const iconSizes = { sm: 15, md: 17, lg: 19 };

  const theme =
    variant === "navy"
      ? {
          wrapper: "border-[color:rgba(255,255,255,0.18)] bg-[color:rgba(255,255,255,0.08)] backdrop-blur-sm",
          input: "text-white placeholder:text-white/45",
          btn: "bg-[#FEA406] hover:bg-[#FD8706] text-[#011957]",
          ring: "focus-within:border-[#FEA406] focus-within:ring-2 focus-within:ring-[#FEA406]/25",
        }
      : {
          wrapper: "border-[color:rgb(var(--c-hairline))] bg-white",
          input: "text-[color:rgb(var(--text-primary))] placeholder:text-[color:rgb(var(--text-muted))]",
          btn: "bg-[#FEA406] hover:bg-[#FD8706] text-[#011957]",
          ring: "focus-within:border-[#FEA406] focus-within:ring-2 focus-within:ring-[#FEA406]/20",
        };

  return (
    <form
      onSubmit={submit}
      role="search"
      className={`relative w-full rounded-full border ${theme.wrapper} ${theme.ring} transition-all ${className}`}
    >
      <input
        type="search"
        value={current || ""}
        onChange={handleChange}
        placeholder={placeholder || (lang === "sw" ? "Tafuta…" : "Search…")}
        aria-label={ariaLabel || placeholder || "Search"}
        className={`w-full rounded-full bg-transparent outline-none ${sizes[size]} ${theme.input}`}
        autoComplete="off"
      />
      <button
        type="submit"
        aria-label={lang === "sw" ? "Tafuta" : "Search"}
        className={`absolute top-1/2 -translate-y-1/2 ${btnSizes[size]} ${theme.btn} rounded-full grid place-items-center transition-colors`}
      >
        <Search size={iconSizes[size]} strokeWidth={2.2} />
      </button>
    </form>
  );
}
