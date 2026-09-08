import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { to: "/kategoria/nyumba", label: "Nyumba" },
    { to: "/kategoria/magari", label: "Magari" },
    { to: "/kategoria/viwanja", label: "Viwanja" },
    { to: "/kategoria/biashara", label: "Biashara" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-night/95 backdrop-blur border-b border-white/10">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="w-7 h-7 rounded-md bg-gold flex items-center justify-center text-night font-bold text-sm">
            S
          </span>
          <span className="text-sand font-bold text-lg tracking-tight">Soko</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sand/70 hover:text-sand text-sm font-medium transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/login"
            className="text-sand/80 hover:text-sand text-sm font-medium"
          >
            Ingia
          </Link>
          <Link
            to="/register?intent=sell"
            className="bg-gold hover:bg-gold-dark text-night font-semibold text-sm px-4 py-2 rounded-md transition-colors"
          >
            Weka Tangazo
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden text-sand p-1.5"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            {mobileOpen ? (
              <path d="M5 5L17 17M17 5L5 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            ) : (
              <>
                <path d="M3 6H19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M3 11H19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M3 16H19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </>
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-night px-5 py-5">
          <nav className="flex flex-col gap-4">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className="text-sand/80 text-sm font-medium"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 mt-5 pt-5 border-t border-white/10">
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="flex-1 text-center text-sand/80 text-sm font-medium border border-white/15 rounded-md py-2.5"
            >
              Ingia
            </Link>
            <Link
              to="/register?intent=sell"
              onClick={() => setMobileOpen(false)}
              className="flex-1 text-center bg-gold text-night font-semibold text-sm rounded-md py-2.5"
            >
              Weka Tangazo
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
