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
} from "lucide-react";
import { COLORS, FONTS } from "./shared";
import PostPropertyForm from "./PostPropertyForm";
import MyListings from "./MyListings";
import BoostSasa from "./BoostSasa";
import DealRooms from "./DealRooms";

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

// Seed data so My Listings has something to show before the seller posts anything new.
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
  const [side, setSide] = useState("seller"); // "seller" | "buyer"
  const [activeKey, setActiveKey] = useState(SELLER_NAV[0].key);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [listings, setListings] = useState(SEED_LISTINGS);
  const [boostTarget, setBoostTarget] = useState(null);

  const nav = side === "seller" ? SELLER_NAV : BUYER_NAV;

  useEffect(() => {
    setActiveKey(nav[0].key);
  }, [side]);

  useEffect(() => {
    const id = setInterval(() => {
      setTickerIndex((i) => (i + 1) % ANNOUNCEMENTS.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const accent = side === "seller" ? COLORS.gold : COLORS.green;

  const addListing = (listing) => setListings((prev) => [listing, ...prev]);
  const removeListing = (id) => setListings((prev) => prev.filter((l) => l.id !== id));
  const updateListing = (id, patch) =>
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const goToBoost = (listingId) => {
    setBoostTarget(listingId);
    setActiveKey("boost");
  };

  const markListingPaid = (id) => updateListing(id, { status: "live" });

  const renderMain = () => {
    if (activeKey === "post") {
      return (
        <PostPropertyForm
          onSubmit={addListing}
          onGoToListings={() => setActiveKey("listings")}
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
    return (
      <main className="flex-1 p-4 sm:p-6">
        <h1
          style={{ fontFamily: FONTS.display, color: COLORS.night }}
          className="text-2xl sm:text-3xl font-semibold mb-1"
        >
          {nav.find((n) => n.key === activeKey)?.label}
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
            Sehemu ya "{nav.find((n) => n.key === activeKey)?.label}" itajengwa hapa
          </p>
        </div>
      </main>
    );
  };

  return (
    <div
      style={{ fontFamily: FONTS.body, background: COLORS.sand, minHeight: "600px" }}
      className="w-full flex flex-col"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=Manrope:wght@400;500;600;700&display=swap');
      `}</style>

      {/* Top header */}
      <header
        style={{ background: COLORS.night }}
        className="w-full flex items-center gap-3 px-3 sm:px-5 py-3"
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
          <div
            style={{ background: COLORS.nightSoft }}
            className="hidden md:flex items-center rounded-full p-1"
          >
            <button
              onClick={() => setSide("seller")}
              style={{
                background: side === "seller" ? COLORS.gold : "transparent",
                color: side === "seller" ? COLORS.night : COLORS.sand,
              }}
              className="text-sm font-semibold px-4 py-1.5 rounded-full transition-colors"
            >
              Uza Sasa
            </button>
            <button
              onClick={() => setSide("buyer")}
              style={{
                background: side === "buyer" ? COLORS.green : "transparent",
                color: side === "buyer" ? COLORS.sand : COLORS.sand,
              }}
              className="text-sm font-semibold px-4 py-1.5 rounded-full transition-colors"
            >
              Nunua Sasa
            </button>
          </div>

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
            A
          </div>
        </div>
      </header>

      {/* mobile toggle row */}
      <div
        style={{ background: COLORS.nightSoft }}
        className="md:hidden flex items-center justify-center gap-1 p-1 mx-3 mt-2 rounded-full"
      >
        <button
          onClick={() => setSide("seller")}
          style={{
            background: side === "seller" ? COLORS.gold : "transparent",
            color: side === "seller" ? COLORS.night : COLORS.sand,
          }}
          className="flex-1 text-sm font-semibold px-4 py-1.5 rounded-full transition-colors"
        >
          Uza Sasa
        </button>
        <button
          onClick={() => setSide("buyer")}
          style={{
            background: side === "buyer" ? COLORS.green : "transparent",
            color: COLORS.sand,
          }}
          className="flex-1 text-sm font-semibold px-4 py-1.5 rounded-full transition-colors"
        >
          Nunua Sasa
        </button>
      </div>

      {/* Announcement ticker (rotates every 5s) */}
      <div
        style={{ background: COLORS.sandLine, color: COLORS.night }}
        className="w-full flex items-center gap-2 px-4 py-1.5 text-xs sm:text-sm"
      >
        <Megaphone size={14} color={COLORS.rust} className="shrink-0" />
        <span className="truncate">{ANNOUNCEMENTS[tickerIndex]}</span>
      </div>

      <div className="flex flex-1 relative">
        {/* Sidebar - desktop */}
        <aside
          style={{ background: COLORS.sand, borderColor: COLORS.sandLine }}
          className="hidden md:flex w-56 shrink-0 border-r flex-col py-4 px-3 gap-1"
        >
          {nav.map(({ key, label, icon: Icon }) => {
            const isActive = key === activeKey;
            return (
              <button
                key={key}
                onClick={() => setActiveKey(key)}
                style={{
                  background: isActive ? COLORS.night : "transparent",
                  color: isActive ? COLORS.sand : COLORS.night,
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left"
              >
                <Icon size={17} color={isActive ? accent : COLORS.night} />
                {label}
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
        </aside>

        {/* Sidebar - mobile drawer */}
        {sidebarOpen && (
          <div className="md:hidden absolute inset-0 z-20 flex">
            <div
              style={{ background: COLORS.sand }}
              className="w-64 h-full py-4 px-3 flex flex-col gap-1 shadow-xl"
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
                      setActiveKey(key);
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
            </div>
            <div
              onClick={() => setSidebarOpen(false)}
              className="flex-1 bg-black/30"
            />
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0 overflow-y-auto">{renderMain()}</div>
      </div>
    </div>
  );
}
