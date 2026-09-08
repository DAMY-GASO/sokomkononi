import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { lang, toggleLang, t } = useLanguage();
  const navigate = useNavigate();

  return (
    <header className="bg-sand border-b border-ink-muted/20">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-5 py-3.5">
        <Link to="/" className="font-bold text-lg text-ink-primary">
          SokoMkononi
        </Link>

        <nav className="flex items-center gap-4">
          <Link to="/app" className="hidden sm:block text-xs text-ink-muted hover:text-ink-secondary">
            {t("nav_download_app")}
          </Link>

          <button
            onClick={toggleLang}
            aria-label="Badilisha lugha / Switch language"
            className="text-xs font-semibold text-ink-secondary border border-ink-muted/30 rounded-md px-2 py-1 hover:text-ink-primary hover:border-ink-muted/50"
          >
            {lang === "sw" ? "SW / EN" : "EN / SW"}
          </button>

          {user ? (
            <>
              <Link to="/dashboard" className="text-sm font-medium text-ink-secondary hover:text-ink-primary">
                {t("nav_dashboard")}
              </Link>
              {user.role === "admin" && (
                <Link to="/admin" className="text-sm font-medium text-ink-secondary hover:text-ink-primary">
                  {t("nav_admin")}
                </Link>
              )}
              <button
                onClick={() => { logout(); navigate("/"); }}
                className="text-sm text-rust font-semibold"
              >
                {t("nav_logout")}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-ink-secondary hover:text-ink-primary">
                {t("nav_login")}
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold bg-gold hover:bg-gold-dark text-night px-4 py-2 rounded-md transition-colors"
              >
                {t("nav_register")}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
