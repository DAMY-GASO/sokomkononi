import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Bell, Search, Menu, X, Heart, MessageSquare, User as UserIcon,
  Plus, ChevronRight, Globe, Sun, Moon, LogOut, LayoutGrid, Package,
} from "lucide-react";

import { useLanguage } from "../context/LanguageContext.jsx";
import { useAuth, logoutAsync } from "../config/authStore.js";
import { useNotifications } from "../config/notificationsStore.js";
import { useDashboardSide } from "../config/dashboardSideStore.js";
import { useAttribution } from "../context/AttributionContext.jsx";
import { getTheme, toggleTheme } from "../config/themeStore.js";
import AnnouncementBar from "./AnnouncementBar.jsx";
import { cx } from "./ui";

function NotificationBell() {
  const { user, isLoading } = useAuth();
  const { unreadCount } = useNotifications("user", Boolean(user) && !isLoading);
  const side = useDashboardSide();
  if (!user) return null;
  const target = side === "buyer" ? "/dashboard/buyer/notifications" : "/dashboard/notifications";
  return (
    <Link to={target} aria-label="Notifications" className="relative grid h-10 w-10 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white">
      <Bell size={18} />
      {unreadCount > 0 && (
        <span className="absolute right-1.5 top-1.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-[#C1502E] px-1 text-[10px] font-bold text-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}

const Chev = ({ open }) => (
  <svg className={cx("h-3.5 w-3.5 transition-transform", open && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export default function Navbar({ categories = [], trustLinks = [] }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { lang, setLang } = useLanguage();
  const { registerTap: registerLogoTap } = useAttribution();

  const [openMenu, setOpenMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSub, setMobileSub] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [theme, setTheme] = useState(getTheme());
  const navRef = useRef(null);

  useEffect(() => { setOpenMenu(null); setMobileOpen(false); setMobileSub(null); }, [location.pathname]);
  useEffect(() => {
    const onDown = (e) => { if (openMenu !== null && navRef.current && !navRef.current.contains(e.target)) setOpenMenu(null); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("touchstart", onDown); };
  }, [openMenu]);
  useEffect(() => {
    const onKey = (e) => { if (e.key !== "Escape") return; setOpenMenu(null); setMobileOpen(false); setMobileSub(null); setSearchOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (mobileOpen) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mobileOpen]);

  const toggleMenu = (name) => setOpenMenu((prev) => (prev === name ? null : name));
  const handleLogoClick = (e) => { if (registerLogoTap()) e.preventDefault(); };
  const handleTheme = () => setTheme(toggleTheme());
  const submitSearch = (e) => {
    e.preventDefault();
    const trimmed = searchQ.trim();
    navigate(trimmed ? `/tafuta?tafuta=${encodeURIComponent(trimmed)}` : "/tafuta");
    setSearchOpen(false); setSearchQ("");
  };
  const handleLogout = async () => { setOpenMenu(null); await logoutAsync(); navigate("/login"); };

  const helpItems = [
    { label: { sw: "Jinsi ya Kununua", en: "How to Buy" }, to: "/jinsi-ya-kununua" },
    { label: { sw: "Jinsi ya Kuuza", en: "How to Sell" }, to: "/jinsi-ya-kununua#kuuza" },
    { label: { sw: "FAQ", en: "FAQ" }, to: "/mawasiliano#faq" },
    { label: { sw: "Wasiliana Nasi", en: "Contact Us" }, to: "/mawasiliano" },
  ];
  const languages = [{ code: "sw", native: "Kiswahili" }, { code: "en", native: "English" }];
  const currentLang = languages.find((l) => l.code === lang) || languages[0];
  const getCatLabel = (cat) => cat.label?.[lang] || cat.label?.sw || cat.key || "";
  const getCatKey = (cat) => cat.key || cat.slug || "";

  return (
    <>
      <AnnouncementBar />
      <header ref={navRef} className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#011957] text-white">
        <div className="container">
          <div className="flex h-16 items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="grid h-10 w-10 place-items-center rounded-lg text-white transition-colors hover:bg-white/[0.08] md:hidden" aria-label={lang === "sw" ? "Fungua menyu" : "Open menu"}>
              <Menu size={22} />
            </button>
            <Link to="/" onClick={handleLogoClick} className="flex min-w-0 select-none items-center gap-2.5">
              <img src="/logo.webp" alt="SokoMkononi" width={32} height={32} className="h-8 w-8 rounded-full" />
              <span className="truncate text-[16px] font-bold tracking-tight">SokoMkononi</span>
            </Link>
            <nav className="ml-4 hidden items-center gap-1 md:flex">
              <NavLink to="/" end className={({ isActive }) => cx("rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap", isActive ? "bg-white/[0.08] text-white" : "text-white/70 hover:bg-white/[0.05] hover:text-white")}>
                {lang === "sw" ? "Nyumbani" : "Home"}
              </NavLink>
              <div className="relative">
                <button type="button" onClick={() => toggleMenu("cat")} aria-expanded={openMenu === "cat"} className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.05] hover:text-white">
                  {lang === "sw" ? "Kategoria" : "Categories"}
                  <Chev open={openMenu === "cat"} />
                </button>
                {openMenu === "cat" && (
                  <div className="absolute left-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-white/10 bg-[#042475] py-2 shadow-xl">
                    <div className="max-h-80 overflow-y-auto">
                      {categories.slice(0, 10).map((cat) => (
                        <Link key={getCatKey(cat)} to={`/kategoria/${getCatKey(cat)}`} className="flex items-center gap-2.5 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white">
                          <span className="truncate">{getCatLabel(cat)}</span>
                        </Link>
                      ))}
                    </div>
                    <div className="mt-1 border-t border-white/10 pt-1">
                      <Link to="/kategoria" className="flex items-center justify-between px-4 py-2 text-sm font-semibold text-[#FEA406] hover:bg-white/[0.06]">
                        {lang === "sw" ? "Ona Zote" : "View All"}
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              {trustLinks.length > 0 ? (
                trustLinks.map((l) => (
                  <Link key={l.to} to={l.to} className="rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.05] hover:text-white">
                    {lang === "sw" ? l.label.sw : l.label.en}
                  </Link>
                ))
              ) : (
                <>
                  <NavLink to="/kuhusu" className={({ isActive }) => cx("rounded-lg px-3 py-2 text-sm font-medium transition-colors", isActive ? "bg-white/[0.08] text-white" : "text-white/70 hover:bg-white/[0.05] hover:text-white")}>
                    {lang === "sw" ? "Kuhusu Sisi" : "About"}
                  </NavLink>
                  <NavLink to="/tafuta" className={({ isActive }) => cx("rounded-lg px-3 py-2 text-sm font-medium transition-colors", isActive ? "bg-white/[0.08] text-white" : "text-white/70 hover:bg-white/[0.05] hover:text-white")}>
                    {lang === "sw" ? "Matangazo" : "Ads"}
                  </NavLink>
                  <div className="relative">
                    <button type="button" onClick={() => toggleMenu("help")} aria-expanded={openMenu === "help"} className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.05] hover:text-white">
                      {lang === "sw" ? "Msaada" : "Help"}
                      <Chev open={openMenu === "help"} />
                    </button>
                    {openMenu === "help" && (
                      <div className="absolute left-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-white/10 bg-[#042475] py-2 shadow-xl">
                        {helpItems.map((item) => (
                          <Link key={item.to} to={item.to} className="block px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white">
                            {lang === "sw" ? item.label.sw : item.label.en}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </nav>
            <div className="ml-auto flex items-center gap-0.5">
              <form onSubmit={submitSearch} className="relative hidden lg:block">
                <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder={lang === "sw" ? "Tafuta mali…" : "Search properties…"} className="h-10 w-44 rounded-lg border border-white/15 bg-white/[0.06] pl-3 pr-9 text-sm text-white placeholder-white/40 outline-none transition-all focus:w-64 focus:border-[#FEA406]/60 focus:bg-white/[0.10] xl:w-56 xl:focus:w-72" />
                <button type="submit" aria-label="Search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/45 transition-colors hover:text-white"><Search size={15} /></button>
              </form>
              <button onClick={() => setSearchOpen((v) => !v)} aria-label="Search" className="grid h-10 w-10 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white lg:hidden"><Search size={18} /></button>
              <button onClick={handleTheme} aria-label={theme === "dark" ? "Switch to light" : "Switch to dark"} className="grid h-10 w-10 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white">
                {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
              </button>
              <div className="relative">
                <button type="button" onClick={() => toggleMenu("lang")} aria-expanded={openMenu === "lang"} className="hidden h-10 items-center gap-1.5 rounded-full border border-white/15 px-3 text-[12px] font-semibold uppercase tracking-wider text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white sm:flex">
                  <Globe size={13} />
                  {currentLang.code}
                </button>
                {openMenu === "lang" && (
                  <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#042475] py-1 shadow-xl">
                    {languages.map((l) => (
                      <button key={l.code} onClick={() => { setLang(l.code); setOpenMenu(null); }} className={cx("flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors", lang === l.code ? "bg-white/[0.06] text-white" : "text-white/70 hover:bg-white/[0.04] hover:text-white")}>
                        {l.native}
                        {lang === l.code && <span className="h-1.5 w-1.5 rounded-full bg-[#FEA406]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <NotificationBell />
              {user ? (
                <div className="relative">
                  <button type="button" onClick={() => toggleMenu("user")} aria-expanded={openMenu === "user"} className="flex h-10 items-center gap-2 rounded-full bg-white/[0.08] py-1 pl-1 pr-2.5 transition-colors hover:bg-white/[0.14]">
                    {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" /> : <span className="grid h-8 w-8 place-items-center rounded-full bg-[#FEA406] text-[12px] font-bold text-[#011957]">{user.name?.charAt(0)?.toUpperCase() || "U"}</span>}
                    <span className="hidden max-w-[90px] truncate text-sm font-medium text-white lg:inline">{user.name?.split(" ")[0] || "User"}</span>
                    <Chev open={openMenu === "user"} />
                  </button>
                  {openMenu === "user" && (
                    <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-white/10 bg-[#042475] py-1 shadow-xl">
                      <div className="border-b border-white/10 px-4 py-3">
                        <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                        <p className="truncate text-[12px] text-white/50">{user.email}</p>
                      </div>
                      {[
                        { to: "/dashboard", label: lang === "sw" ? "Dashibodi" : "Dashboard", Icon: LayoutGrid },
                        { to: "/dashboard/post", label: lang === "sw" ? "Uza Sasa" : "Sell Now", Icon: Plus },
                        { to: "/dashboard/buyer", label: lang === "sw" ? "Nunua Sasa" : "Buy Now", Icon: Package },
                        { to: "/dashboard/saved", label: lang === "sw" ? "Zilizohifadhiwa" : "Saved", Icon: Heart },
                        { to: "/dashboard/messages", label: lang === "sw" ? "Ujumbe" : "Messages", Icon: MessageSquare },
                        { to: "/wasifu", label: lang === "sw" ? "Wasifu" : "Profile", Icon: UserIcon },
                      ].map(({ to, label, Icon }) => (
                        <Link key={to} to={to} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white">
                          <Icon size={15} className="text-white/50" />
                          {label}
                        </Link>
                      ))}
                      <div className="my-1 border-t border-white/10" />
                      <button onClick={handleLogout} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[#FF8A65] transition-colors hover:bg-[#C1502E]/15">
                        <LogOut size={15} />
                        {lang === "sw" ? "Toka" : "Logout"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="inline-flex h-10 items-center rounded-full bg-[#FEA406] px-4 text-sm font-semibold text-[#011957] transition-colors hover:bg-[#FD8706]">
                  {lang === "sw" ? "Ingia" : "Login"}
                </Link>
              )}
            </div>
          </div>
        </div>
        {searchOpen && (
          <div className="border-t border-white/[0.08] bg-[#011957] px-4 py-3 lg:hidden">
            <form onSubmit={submitSearch} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45" />
                <input autoFocus value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder={lang === "sw" ? "Tafuta mali…" : "Search properties…"} className="h-11 w-full rounded-lg border border-white/15 bg-white/[0.06] pl-10 pr-3 text-sm text-white placeholder-white/40 outline-none focus:border-[#FEA406]/60" />
              </div>
              <button type="button" onClick={() => { setSearchOpen(false); setSearchQ(""); }} className="rounded-lg px-3 py-2 text-sm font-medium text-white/60 hover:text-white">
                {lang === "sw" ? "Ghairi" : "Cancel"}
              </button>
            </form>
          </div>
        )}
      </header>
      <div className={cx("fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden", mobileOpen ? "opacity-100" : "pointer-events-none opacity-0")} onClick={() => setMobileOpen(false)} aria-hidden="true" />
      <div className={cx("fixed left-0 top-0 z-50 h-full w-72 max-w-[82%] bg-[#011957] transition-transform duration-300 ease-out md:hidden", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
            <div className="flex items-center gap-2.5">
              <img src="/logo.webp" alt="" className="h-8 w-8 rounded-full" />
              <span className="text-[15px] font-bold text-white">SokoMkononi</span>
            </div>
            <button onClick={() => setMobileOpen(false)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full text-white/70 hover:bg-white/[0.08] hover:text-white">
              <X size={18} />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-3">
            <Link to="/" className="flex items-center rounded-lg px-3 py-3 text-[15px] font-medium text-white/85 hover:bg-white/[0.06] hover:text-white">
              {lang === "sw" ? "Nyumbani" : "Home"}
            </Link>
            <button onClick={() => setMobileSub((v) => (v === "cat" ? null : "cat"))} className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-[15px] font-medium text-white/85 hover:bg-white/[0.06] hover:text-white">
              <span>{lang === "sw" ? "Kategoria" : "Categories"}</span>
              <Chev open={mobileSub === "cat"} />
            </button>
            {mobileSub === "cat" && (
              <div className="mb-1 ml-2 border-l border-white/10 pl-3">
                {categories.slice(0, 12).map((cat) => (
                  <Link key={getCatKey(cat)} to={`/kategoria/${getCatKey(cat)}`} className="block rounded-lg px-3 py-2 text-sm text-white/65 hover:bg-white/[0.05] hover:text-white">
                    {getCatLabel(cat)}
                  </Link>
                ))}
                <Link to="/kategoria" className="block rounded-lg px-3 py-2 text-sm font-semibold text-[#FEA406] hover:bg-white/[0.05]">
                  {lang === "sw" ? "Ona Zote" : "View All"}
                </Link>
              </div>
            )}
            <Link to="/tafuta" className="flex items-center rounded-lg px-3 py-3 text-[15px] font-medium text-white/85 hover:bg-white/[0.06] hover:text-white">
              {lang === "sw" ? "Matangazo" : "Ads"}
            </Link>
            <Link to="/kuhusu" className="flex items-center rounded-lg px-3 py-3 text-[15px] font-medium text-white/85 hover:bg-white/[0.06] hover:text-white">
              {lang === "sw" ? "Kuhusu Sisi" : "About"}
            </Link>
            <button onClick={() => setMobileSub((v) => (v === "help" ? null : "help"))} className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-[15px] font-medium text-white/85 hover:bg-white/[0.06] hover:text-white">
              <span>{lang === "sw" ? "Msaada" : "Help"}</span>
              <Chev open={mobileSub === "help"} />
            </button>
            {mobileSub === "help" && (
              <div className="mb-1 ml-2 border-l border-white/10 pl-3">
                {helpItems.map((item) => (
                  <Link key={item.to} to={item.to} className="block rounded-lg px-3 py-2 text-sm text-white/65 hover:bg-white/[0.05] hover:text-white">
                    {lang === "sw" ? item.label.sw : item.label.en}
                  </Link>
                ))}
              </div>
            )}
          </nav>
        </div>
      </div>
    </>
  );
}
