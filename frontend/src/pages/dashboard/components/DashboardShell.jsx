import React, { useState, useEffect } from "react";
import {
  Search,
  Bell,
  Menu,
  X,
  PlusCircle,
  ListChecks,
  Rocket,
  MessagesSquare,
  Receipt,
  LayoutGrid,
  Clock3,
  Megaphone,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

const COLORS = {
  night: "#101A2E",
  sand: "#F5F3EC",
  gold: "#E8A33D",
  green: "#2F6D4F",
  rust: "#C1502E",
  nightSoft: "#1B2740",
  sandLine: "#E6E2D6",
};

const FONTS = {
  display: "'Fraunces', serif",
  body: "'Manrope', sans-serif",
};

const ANNOUNCEMENTS = [
  "Mali mpya 240+ zimeongezwa wiki hii karibu na Dar es Salaam",
  "Boost Sasa: ongeza mwonekano wa bidhaa yako mara 3",
  "Kumbuka: kila reservation ina Inspection Period yake — angalia My Transactions",
];

const SELLER_NAV = [
  { key: "post", label: "Weka Mali Yako", icon: PlusCircle },
  { key: "listings", label: "My Listings", icon: ListChecks },
  { key: "boost", label: "Boost Sasa", icon: Rocket },
  { key: "deals", label: "Deal Rooms", icon: MessagesSquare },
  { key: "transactions", label: "My Transactions", icon: Receipt },
];

const BUYER_NAV = [
  { key: "browse", label: "Tafuta Mali", icon: LayoutGrid },
  { key: "deals", label: "Deal Rooms", icon: MessagesSquare },
  { key: "waiting", label: "Waiting List", icon: Clock3 },
  { key: "transactions", label: "My Transactions", icon: Receipt },
];

export default function DashboardShell({ 
  role = "seller", 
  activeView, 
  setActiveView, 
  user,
  children 
}) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [tickerIndex, setTickerIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const nav = role === "seller" ? SELLER_NAV : BUYER_NAV;
  const accent = role === "seller" ? COLORS.gold : COLORS.green;

  useEffect(() => {
    const id = setInterval(() => {
      setTickerIndex((i) => (i + 1) % ANNOUNCEMENTS.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div
      style={{ fontFamily: FONTS.body, background: COLORS.sand, minHeight: "100vh" }}
      className="w-full flex flex-col"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=Manrope:wght@400;500;600;700&display=swap');
      `}</style>

      {/* ============================================================ */}
      {/* TOP HEADER */}
      {/* ============================================================ */}
      <header
        style={{ background: COLORS.night }}
        className="w-full flex items-center gap-3 px-3 sm:px-5 py-3 sticky top-0 z-50"
      >
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="text-white/80 hover:text-white md:hidden"
          aria-label="Fungua menyu"
        >
          <Menu size={22} />
        </button>

        <span
          style={{ fontFamily: FONTS.display, color: COLORS.sand }}
          className="text-lg sm:text-xl font-semibold tracking-tight shrink-0"
        >
          SokoMkononi
        </span>

        <div
          style={{ background: COLORS.nightSoft, borderColor: "rgba(245,243,236,0.12)" }}
          className="hidden sm:flex items-center flex-1 max-w-md rounded-full border px-3 py-1.5 gap-2"
        >
          <Search size={16} color="rgba(245,243,236,0.6)" />
          <input
            placeholder="Tafuta mali... (jina, mahali, category)"
            className="bg-transparent outline-none text-sm flex-1"
            style={{ color: COLORS.sand }}
          />
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <button
            className="relative text-white/80 hover:text-white"
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span
              style={{ background: COLORS.rust }}
              className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
            />
          </button>

          <div
            style={{ background: COLORS.gold, color: COLORS.night }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          >
            {user?.name?.charAt(0) || "U"}
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* MOBILE ROLE TOGGLE */}
      {/* ============================================================ */}
      <div
        style={{ background: COLORS.nightSoft }}
        className="md:hidden flex items-center justify-center gap-1 p-1 mx-3 mt-2 rounded-full"
      >
        <button
          onClick={() => navigate("/dashboard/seller")}
          style={{
            background: role === "seller" ? COLORS.gold : "transparent",
            color: role === "seller" ? COLORS.night : COLORS.sand,
          }}
          className="flex-1 text-sm font-semibold px-4 py-1.5 rounded-full transition-colors"
        >
          Uza Sasa
        </button>
        <button
          onClick={() => navigate("/dashboard/buyer")}
          style={{
            background: role === "buyer" ? COLORS.green : "transparent",
            color: COLORS.sand,
          }}
          className="flex-1 text-sm font-semibold px-4 py-1.5 rounded-full transition-colors"
        >
          Nunua Sasa
        </button>
      </div>

      {/* ============================================================ */}
      {/* ANNOUNCEMENT TICKER */}
      {/* ============================================================ */}
      <div
        style={{ background: COLORS.sandLine, color: COLORS.night }}
        className="w-full flex items-center gap-2 px-4 py-1.5 text-xs sm:text-sm"
      >
        <Megaphone size={14} color={COLORS.rust} className="shrink-0" />
        <span className="truncate">{ANNOUNCEMENTS[tickerIndex]}</span>
      </div>

      {/* ============================================================ */}
      {/* MAIN LAYOUT */}
      {/* ============================================================ */}
      <div className="flex flex-1 relative">
        {/* ================= SIDEBAR - DESKTOP ================= */}
        <aside
          style={{ background: COLORS.sand, borderColor: COLORS.sandLine }}
          className="hidden md:flex w-56 shrink-0 border-r flex-col py-4 px-3 gap-1 sticky top-[72px] h-[calc(100vh-72px)] overflow-y-auto"
        >
          {nav.map(({ key, label, icon: Icon }) => {
            const isActive = key === activeView;
            return (
              <button
                key={key}
                onClick={() => setActiveView(key)}
                style={{
                  background: isActive ? COLORS.night : "transparent",
                  color: isActive ? COLORS.sand : COLORS.night,
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left"
              >
                <Icon size={17} color={isActive ? accent : COLORS.night} />
                {label}
              </button>
            );
          })}
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#C1502E] hover:bg-[#C1502E]/10 transition-colors mt-4 border-t border-gray-200 pt-4"
          >
            <LogOut size={17} color="#C1502E" />
            Toka
          </button>
        </aside>

        {/* ================= SIDEBAR - MOBILE DRAWER ================= */}
        {sidebarOpen && (
          <div className="md:hidden absolute inset-0 z-20 flex">
            <div
              style={{ background: COLORS.sand }}
              className="w-64 h-full py-4 px-3 flex flex-col gap-1 shadow-xl overflow-y-auto"
            >
              <div className="flex justify-end mb-2">
                <button onClick={() => setSidebarOpen(false)} aria-label="Funga">
                  <X size={20} color={COLORS.night} />
                </button>
              </div>
              {nav.map(({ key, label, icon: Icon }) => {
                const isActive = key === activeView;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveView(key);
                      setSidebarOpen(false);
                    }}
                    style={{
                      background: isActive ? COLORS.night : "transparent",
                      color: isActive ? COLORS.sand : COLORS.night,
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left"
                  >
                    <Icon size={17} color={isActive ? accent : COLORS.night} />
                    {label}
                  </button>
                );
              })}
              <button
                onClick={() => {
                  handleLogout();
                  setSidebarOpen(false);
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#C1502E] hover:bg-[#C1502E]/10 transition-colors mt-4 border-t border-gray-200 pt-4"
              >
                <LogOut size={17} color="#C1502E" />
                Toka
              </button>
            </div>
            <div
              onClick={() => setSidebarOpen(false)}
              className="flex-1 bg-black/30"
            />
          </div>
        )}

        {/* ================= MAIN CONTENT ================= */}
        <main className="flex-1 p-4 sm:p-6 min-h-[calc(100vh-72px)]">
          {children}
        </main>
      </div>
    </div>
  );
}
