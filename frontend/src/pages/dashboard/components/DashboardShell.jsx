import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  Heart,
  MessageSquare,
  Home,
  Globe,
  Check,
} from "lucide-react";
import { COLORS, FONTS } from "./shared";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import PostPropertyForm from "./PostPropertyForm";
import MyListings from "./MyListings";
import BoostSasa from "./BoostSasa";
import DealRooms from "./DealRooms";
import BottomNav from "../../../components/BottomNav.jsx";

// Kurasa mpya
import SavedPropertiesPage from "../../SavedPropertiesPage";
import MessagesPage from "../../MessagesPage";
import NotificationsPage from "../../NotificationsPage";
import MyTransactionsPage from "../../MyTransactionsPage";

const ANNOUNCEMENTS = [
  "Mali mpya 240+ zimeongezwa wiki hii karibu na Dar es Salaam",
  "Boost Sasa: ongeza mwonekano wa bidhaa yako mara 3",
  "Kumbuka: kila reservation ina Inspection Period yake — angalia My Transactions",
];

const SELLER_NAV = [
  { key: "post", label: { sw: "Weka Mali Yako", en: "Post Property" }, icon: PlusCircle },
  { key: "listings", label: { sw: "My Listings", en: "My Listings" }, icon: ListChecks },
  { key: "saved", label: { sw: "Zilizohifadhiwa", en: "Saved" }, icon: Heart },
  { key: "boost", label: { sw: "Boost Sasa", en: "Boost Now" }, icon: Rocket },
  { key: "deals", label: { sw: "Deal Rooms", en: "Deal Rooms" }, icon: MessagesSquare },
  { key: "messages", label: { sw: "Ujumbe", en: "Messages" }, icon: MessageSquare },
  { key: "notifications", label: { sw: "Taarifa", en: "Notifications" }, icon: Bell },
  { key: "transactions", label: { sw: "My Transactions", en: "My Transactions" }, icon: Receipt },
];

const BUYER_NAV = [
  { key: "browse", label: { sw: "Tafuta Mali", en: "Browse Properties" }, icon: LayoutGrid },
  { key: "saved", label: { sw: "Zilizohifadhiwa", en: "Saved" }, icon: Heart },
  { key: "deals", label: { sw: "Deal Rooms", en: "Deal Rooms" }, icon: MessagesSquare },
  { key: "messages", label: { sw: "Ujumbe", en: "Messages" }, icon: MessageSquare },
  { key: "notifications", label: { sw: "Taarifa", en: "Notifications" }, icon: Bell },
  { key: "waiting", label: { sw: "Waiting List", en: "Waiting List" }, icon: Clock3 },
  { key: "transactions", label: { sw: "My Transactions", en: "My Transactions" }, icon: Receipt },
];

// Ramani ya URL → { side, key }
const URL_TO_STATE = {
  "/dashboard": { side: "seller", key: "listings" },
  "/dashboard/seller": { side: "seller", key: "listings" },
  "/dashboard/post": { side: "seller", key: "post" },
  "/dashboard/listings": { side: "seller", key: "listings" },
  "/dashboard/saved": { side: "seller", key: "saved" },
  "/dashboard/boost": { side: "seller", key: "boost" },
  "/dashboard/deals": { side: "seller", key: "deals" },
  "/dashboard/messages": { side: "seller", key: "messages" },
  "/dashboard/notifications": { side: "seller", key: "notifications" },
  "/dashboard/transactions": { side: "seller", key: "transactions" },
  "/dashboard/buyer": { side: "buyer", key: "browse" },
  "/dashboard/buyer/saved": { side: "buyer", key: "saved" },
  "/dashboard/buyer/messages": { side: "buyer", key: "messages" },
  "/dashboard/buyer/notifications": { side: "buyer", key: "notifications" },
  "/dashboard/buyer/transactions": { side: "buyer", key: "transactions" },
};

// Ramani ya { side, key } → URL
const STATE_TO_URL = {
  seller: {
    post: "/dashboard/post",
    listings: "/dashboard/listings",
    saved: "/dashboard/saved",
    boost: "/dashboard/boost",
    deals: "/dashboard/deals",
    messages: "/dashboard/messages",
    notifications: "/dashboard/notifications",
    transactions: "/dashboard/transactions",
  },
  buyer: {
    browse: "/dashboard/buyer",
    saved: "/dashboard/buyer/saved",
    deals: "/dashboard/deals",
    messages: "/dashboard/buyer/messages",
    notifications: "/dashboard/buyer/notifications",
    waiting: "/dashboard/buyer",
    transactions: "/dashboard/buyer/transactions",
  },
};

const SEED_LISTINGS = [
  {
    id: "l1",
    title: "Nyumba ya Ghorofa Mbezi Beach",
    category: "nyumba",
    price: 85000000,
    location: "Mbezi Beach, Dar es Salaam",
    status: "live",
    postedAt: "2026-08-28T00:00:00.000Z",
    views: 214,
    inquiries: 6,
    boostTier: "featured",
    boostExpiresAt: new Date(Date.now() + 4 * 86400000).toISOString(),
  },
  {
    id: "l3",
    title: "Kiwanja Ubungo — Hati Miliki",
    category: "viwanja",
    price: 28000000,
    location: "Ubungo, Dar es Salaam",
    status: "in_review",
    postedAt: "2026-09-08T00:00:00.000Z",
    views: 0,
    inquiries: 0,
  },
  {
    id: "l4",
    title: "Duka la Vifaa vya Ujenzi — Kariakoo",
    category: "biashara",
    price: 15000000,
    location: "Kariakoo, Dar es Salaam",
    status: "sold",
    postedAt: "2026-07-14T00:00:00.000Z",
    views: 389,
    inquiries: 11,
  },
  {
    id: "l5",
    title: "Excavator CAT 320D",
    category: "mashine",
    price: 120000000,
    location: "Chalinze, Pwani",
    status: "expired",
    postedAt: "2026-06-02T00:00:00.000Z",
    views: 97,
    inquiries: 2,
  },
];

export default function DashboardShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage(); // ✅ Tumia language context

  const [side, setSide] = useState("seller");
  const [activeKey, setActiveKey] = useState(SELLER_NAV[0].key);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [listings, setListings] = useState(SEED_LISTINGS);
  const [boostTarget, setBoostTarget] = useState(null);
  const [langOpen, setLangOpen] = useState(false);

  const nav = side === "seller" ? SELLER_NAV : BUYER_NAV;

  const languages = [
    { code: "sw", native: "Kiswahili" },
    { code: "en", native: "English" },
  ];

  const currentLang = languages.find((l) => l.code === lang) || languages[0];

  // ============================================================
  // SOMA URL NA KUFUNGUA TAB SAHIHI
  // ============================================================
  useEffect(() => {
    const path = location.pathname;
    const match = URL_TO_STATE[path];
    if (match) {
      setSide(match.side);
      setActiveKey(match.key);
    }
  }, [location.pathname]);

  // ============================================================
  // TICKER
  // ============================================================
  useEffect(() => {
    const id = setInterval(() => {
      setTickerIndex((i) => (i + 1) % ANNOUNCEMENTS.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const accent = side === "seller" ? COLORS.gold : COLORS.green;

  // ============================================================
  // LISTING HELPERS
  // ============================================================
  const addListing = (listing) => setListings((prev) => [listing, ...prev]);
  const removeListing = (id) =>
    setListings((prev) => prev.filter((l) => l.id !== id));
  const updateListing = (id, patch) =>
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  // ============================================================
  // NAVIGATION HELPERS
  // ============================================================
  const handleNavClick = (key) => {
    setActiveKey(key);
    const url = STATE_TO_URL[side]?.[key];
    if (url) {
      navigate(url);
    }
  };

  const goToBoost = (listingId) => {
    setBoostTarget(listingId);
    handleNavClick("boost");
  };

  const markListingPaid = (id) => updateListing(id, { status: "live" });

  const handleSideChange = (newSide) => {
    setSide(newSide);
    const firstKey = newSide === "seller" ? "listings" : "browse";
    setActiveKey(firstKey);
    const url = STATE_TO_URL[newSide]?.[firstKey];
    if (url) {
      navigate(url);
    }
  };

  const handleLanguageSelect = (code) => {
    setLang(code);
    setLangOpen(false);
  };

  // ============================================================
  // RENDER MAIN CONTENT
  // ============================================================
  const renderMain = () => {
    if (activeKey === "post") {
      return (
        <PostPropertyForm
          onSubmit={addListing}
          onGoToListings={() => handleNavClick("listings")}
          onPaid={markListingPaid}
          onGoToBoost={goToBoost}
        />
      );
    }
    if (activeKey === "listings") {
      return (
        <MyListings
          listings={listings}
          onRemove={removeListing}
          onBoost={goToBoost}
          onPaid={markListingPaid}
        />
      );
    }
    if (activeKey === "saved") {
      return <SavedPropertiesPage />;
    }
    if (activeKey === "boost") {
      return (
        <BoostSasa
          listings={listings}
          initialListingId={boostTarget}
          onBoosted={updateListing}
        />
      );
    }
    if (activeKey === "deals") {
      return <DealRooms side={side} />;
    }
    if (activeKey === "messages") {
      return <MessagesPage />;
    }
    if (activeKey === "notifications") {
      return <NotificationsPage />;
    }
    if (activeKey === "transactions") {
      return <MyTransactionsPage />;
    }
    return (
      <main className="flex-1 p-4 sm:p-6">
        <h1
          style={{ fontFamily: FONTS.display, color: COLORS.night }}
          className="text-2xl sm:text-3xl font-semibold mb-1"
        >
          {nav.find((n) => n.key === activeKey)?.label?.[lang] || ""}
        </h1>
        <p style={{ color: "rgba(16,26,46,0.6)" }} className="text-sm mb-6">
          {side === "seller"
            ? "Sehemu ya Uza Sasa — dhibiti mali zako, malipo na maombi ya wanunuzi."
            : "Sehemu ya Nunua Sasa — tafuta, negotiate na fuatilia manunuzi yako."}
        </p>

        <div
          style={{ borderColor: COLORS.sandLine }}
          className="rounded-2xl border-2 border-dashed p-10 text-center"
        >
          <p style={{ color: "rgba(16,26,46,0.45)" }} className="text-sm">
            Sehemu ya "{nav.find((n) => n.key === activeKey)?.label?.[lang] || ""}" itajengwa hapa
          </p>
        </div>
      </main>
    );
  };

  return (
    <div
      style={{ fontFamily: FONTS.body, background: COLORS.sand, minHeight: "100vh" }}
      className="w-full flex flex-col pb-16 md:pb-0"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=Manrope:wght@400;500;600;700&display=swap');
      `}</style>

      {/* ============================================================ */}
      {/* TOP HEADER */}
      {/* ============================================================ */}
      <header
        style={{ background: COLORS.night }}
        className="w-full flex items-center gap-3 px-3 sm:px-5 py-3 sticky top-0 z-30"
      >
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="text-white/80 hover:text-white md:hidden"
          aria-label="Fungua menyu"
        >
          <Menu size={22} />
        </button>

        <a
          href="/"
          style={{ fontFamily: FONTS.display, color: COLORS.sand }}
          className="text-lg sm:text-xl font-semibold tracking-tight shrink-0 hover:opacity-80 transition-opacity"
        >
          SokoMkononi
        </a>

        <div
          style={{ background: COLORS.nightSoft, borderColor: "rgba(245,243,236,0.12)" }}
          className="hidden sm:flex items-center flex-1 max-w-md rounded-full border px-3 py-1.5 gap-2"
        >
          <Search size={16} color="rgba(245,243,236,0.6)" />
          <input
            placeholder={
              lang === "sw" ? "Tafuta mali..." : "Search properties..."
            }
            className="bg-transparent outline-none text-sm flex-1"
            style={{ color: COLORS.sand }}
          />
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {/* Seller/Buyer Toggle */}
          <div
            style={{ background: COLORS.nightSoft }}
            className="hidden md:flex items-center rounded-full p-1"
          >
            <button
              onClick={() => handleSideChange("seller")}
              style={{
                background: side === "seller" ? COLORS.gold : "transparent",
                color: side === "seller" ? COLORS.night : COLORS.sand,
              }}
              className="text-sm font-semibold px-4 py-1.5 rounded-full transition-colors"
            >
              {lang === "sw" ? "Uza Sasa" : "Sell Now"}
            </button>
            <button
              onClick={() => handleSideChange("buyer")}
              style={{
                background: side === "buyer" ? COLORS.green : "transparent",
                color: COLORS.sand,
              }}
              className="text-sm font-semibold px-4 py-1.5 rounded-full transition-colors"
            >
              {lang === "sw" ? "Nunua Sasa" : "Buy Now"}
            </button>
          </div>

          {/* ✅ Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setLangOpen((v) => !v)}
              style={{ background: COLORS.nightSoft, borderColor: "rgba(245,243,236,0.15)" }}
              className="text-white/80 hover:text-white text-sm font-medium border rounded-md px-2 sm:px-3 py-1.5 transition-colors flex items-center gap-1"
            >
              <Globe size={14} />
              <span className="hidden sm:inline">{currentLang?.native || "Kiswahili"}</span>
              <span className="sm:hidden">{currentLang?.code?.toUpperCase() || "SW"}</span>
            </button>
            {langOpen && (
              <div
                style={{ background: COLORS.nightSoft, borderColor: "rgba(245,243,236,0.1)" }}
                className="absolute right-0 mt-2 w-48 border rounded-lg shadow-xl py-2 z-50"
              >
                <div
                  style={{ borderColor: "rgba(245,243,236,0.1)" }}
                  className="px-4 py-2 border-b"
                >
                  <p style={{ color: "rgba(245,243,236,0.5)" }} className="text-xs font-semibold">
                    {lang === "sw" ? "Chagua Lugha" : "Choose Language"}
                  </p>
                </div>
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => handleLanguageSelect(l.code)}
                    style={{
                      background: lang === l.code ? "rgba(245,243,236,0.05)" : "transparent",
                      color: COLORS.sand,
                    }}
                    className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <span className="text-sm font-medium">{l.native}</span>
                    {lang === l.code && <Check size={14} color={COLORS.gold} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Home button */}
          <a
            href="/"
            className="text-white/80 hover:text-white p-1.5 transition-colors"
            aria-label="Rudi kwenye HomePage"
          >
            <Home size={20} />
          </a>

          {/* Notifications */}
          <button
            onClick={() => handleNavClick("notifications")}
            className="relative text-white/80 hover:text-white p-1.5 transition-colors"
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span
              style={{ background: COLORS.rust }}
              className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full"
            />
          </button>

          <div
            style={{ background: COLORS.gold, color: COLORS.night }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          >
            A
          </div>
        </div>
      </header>

      {/* MOBILE SELLER/BUYER TOGGLE */}
      <div
        style={{ background: COLORS.nightSoft }}
        className="md:hidden flex items-center justify-center gap-1 p-1 mx-3 mt-2 rounded-full"
      >
        <button
          onClick={() => handleSideChange("seller")}
          style={{
            background: side === "seller" ? COLORS.gold : "transparent",
            color: side === "seller" ? COLORS.night : COLORS.sand,
          }}
          className="flex-1 text-sm font-semibold px-4 py-1.5 rounded-full transition-colors"
        >
          {lang === "sw" ? "Uza Sasa" : "Sell Now"}
        </button>
        <button
          onClick={() => handleSideChange("buyer")}
          style={{
            background: side === "buyer" ? COLORS.green : "transparent",
            color: COLORS.sand,
          }}
          className="flex-1 text-sm font-semibold px-4 py-1.5 rounded-full transition-colors"
        >
          {lang === "sw" ? "Nunua Sasa" : "Buy Now"}
        </button>
      </div>

      {/* ANNOUNCEMENT TICKER */}
      <div
        style={{ background: COLORS.sandLine, color: COLORS.night }}
        className="w-full flex items-center gap-2 px-4 py-1.5 text-xs sm:text-sm"
      >
        <Megaphone size={14} color={COLORS.rust} className="shrink-0" />
        <span className="truncate">{ANNOUNCEMENTS[tickerIndex]}</span>
      </div>

      {/* BODY: SIDEBAR + MAIN CONTENT */}
      <div className="flex flex-1 relative">
        {/* SIDEBAR - DESKTOP */}
        <aside
          style={{ background: COLORS.sand, borderColor: COLORS.sandLine }}
          className="hidden md:flex w-56 shrink-0 border-r flex-col py-4 px-3 gap-1 sticky top-[64px] h-[calc(100vh-64px)] overflow-y-auto"
        >
          {nav.map(({ key, label, icon: Icon }) => {
            const isActive = key === activeKey;
            return (
              <button
                key={key}
                onClick={() => handleNavClick(key)}
                style={{
                  background: isActive ? COLORS.night : "transparent",
                  color: isActive ? COLORS.sand : COLORS.night,
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left"
              >
                <Icon size={17} color={isActive ? accent : COLORS.night} />
                {label[lang] || label.sw}
                {key === "listings" && listings.length > 0 && (
                  <span
                    style={{
                      background: isActive ? "rgba(245,243,236,0.18)" : COLORS.sandLine,
                      color: isActive ? COLORS.sand : COLORS.night,
                    }}
                    className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  >
                    {listings.length}
                  </span>
                )}
              </button>
            );
          })}

          <a
            href="/"
            style={{ color: COLORS.night }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left hover:bg-black/5 mt-4 border-t pt-4"
          >
            <Home size={17} color={COLORS.night} />
            {lang === "sw" ? "Rudi Nyumbani" : "Back to Home"}
          </a>
        </aside>

        {/* SIDEBAR - MOBILE DRAWER */}
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
                const isActive = key === activeKey;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      handleNavClick(key);
                      setSidebarOpen(false);
                    }}
                    style={{
                      background: isActive ? COLORS.night : "transparent",
                      color: isActive ? COLORS.sand : COLORS.night,
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left"
                  >
                    <Icon size={17} color={isActive ? accent : COLORS.night} />
                    {label[lang] || label.sw}
                  </button>
                );
              })}

              <a
                href="/"
                style={{ color: COLORS.night }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left hover:bg-black/5 mt-4 border-t pt-4"
              >
                <Home size={17} color={COLORS.night} />
                {lang === "sw" ? "Rudi Nyumbani" : "Back to Home"}
              </a>
            </div>
            <div
              onClick={() => setSidebarOpen(false)}
              className="flex-1 bg-black/30"
            />
          </div>
        )}

        {/* MAIN CONTENT */}
        <div className="flex-1 min-w-0 overflow-y-auto">{renderMain()}</div>
      </div>

      {/* BOTTOM NAVIGATION - MOBILE ONLY */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
