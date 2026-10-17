import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../config/themeStore.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { cx } from "./ui";

export default function ThemeToggle({ className = "", variant = "ghost" }) {
  const { theme, toggle } = useTheme();
  const { lang } = useLanguage();
  const isDark = theme === "dark";

  const label = isDark
    ? (lang === "sw" ? "Badilisha kwa mwanga" : "Switch to light mode")
    : (lang === "sw" ? "Badilisha kwa giza" : "Switch to dark mode");

  const base = "relative inline-grid place-items-center h-10 w-10 rounded-full transition-colors";
  const variants = {
    ghost: "text-secondary hover:text-primary hover:bg-[rgba(1,25,87,0.05)] dark:hover:bg-white/[0.06]",
    onNavy: "text-white/70 hover:text-white hover:bg-white/10",
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cx(base, variants[variant] || variants.ghost, className)}
    >
      {isDark ? (
        <Sun size={18} className="transition-transform duration-300" />
      ) : (
        <Moon size={18} className="transition-transform duration-300" />
      )}
    </button>
  );
}