import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../config/themeStore.js";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggle } = useTheme();
  const { lang } = useLanguage();
  const label = theme === "dark"
    ? (lang === "sw" ? "Badilisha kwa mwanga" : "Switch to light mode")
    : (lang === "sw" ? "Badilisha kwa giza"  : "Switch to dark mode");

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={
        "relative inline-flex items-center justify-center w-8 h-8 rounded-md " +
        "text-white/70 hover:text-white hover:bg-white/10 transition-colors " +
        className
      }
    >
      {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
