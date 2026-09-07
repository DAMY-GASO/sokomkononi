import React, { createContext, useContext, useState } from "react";
import { translations } from "../i18n/translations.js";

const LanguageContext = createContext(null);

function interpolate(str, vars) {
  if (!vars) return str;
  return Object.keys(vars).reduce(
    (acc, key) => acc.replace(`{${key}}`, vars[key]),
    str
  );
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(
    localStorage.getItem("sm_lang") || "sw"
  );

  function toggleLang() {
    setLang((prev) => {
      const next = prev === "sw" ? "en" : "sw";
      localStorage.setItem("sm_lang", next);
      return next;
    });
  }

  function t(key, vars) {
    const dict = translations[lang] || translations.sw;
    const str = dict[key] || translations.sw[key] || key;
    return interpolate(str, vars);
  }

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
