// ============================================================
// UserDrawer.jsx
// Drawer ya mtumiaji (kwa User Management) — inaonyesha
// listings zake, deals zake, na sold listings.
// Inachukua data yenyewe kutoka /api/admin/users/{id}/full/
// Mobile-responsive.
//
// Marekebisho:
//  - Ongeza tabs: Wasifu / Mali / Deals / Zilizouzwa
//  - Tab "Zilizouzwa" inaonyesha sold listings pekee
//  - Inasoma URL params (?tab=listings&filter=sold) kwa deep link
//    kutoka notification
// ============================================================

import React, { useEffect, useState } from "react";
import {
  X,
  Phone,
  Calendar,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  Package,
} from "lucide-react";
import { COLORS, FONTS } from "./constants.js";
import StatusBadge from "./StatusBadge.jsx";
import { api } from "../../../../api/client.js";

// ============================================================
// HELPERS
// ============================================================
function getUserInitial(user) {
  const name = user?.name || user?.email || "U";
  return String(name).charAt(0).toUpperCase();
}

function formatJoined(date) {
  if (!date) return "—";
  try {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return String(date);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(date);
  }
}

// ============================================================
// TABS
// ============================================================
const TABS = [
  { key: "profile", label: { sw: "Wasifu", en: "Profile" } },
  { key: "listings", label: { sw: "Mali", en: "Listings" } },
  { key: "deals", label: { sw: "Deals", en: "Deals" } },
  { key: "sold", label: { sw: "Zilizouzwa", en: "Sold" } },
];

// ============================================================
// TAB CONTENT — Listings
// ============================================================
function ListingsTab({ listings, lang, loading }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500">
        <Loader2 size={16} className="animate-spin" />
        {t("Inapakia...", "Loading...")}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <p className="text-xs text-gray-400 py-3">
        {t("Hakuna listings.", "No listings.")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {listings.map((l) => (
        <div
          key={l.id}
          className="flex items-center justify-between gap-2 text-xs border rounded-lg px-3 py-2"
          style={{ borderColor: COLORS.sandLine }}
        >
          <span className="truncate text-gray-700 min-w-0 flex-1">
            {l.title}
          </span>
          <div className="shrink-0">
            <StatusBadge status={l.status} lang={lang} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// TAB CONTENT — Deals
// ============================================================
function DealsTab({ deals, lang, loading }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500">
        <Loader2 size={16} className="animate-spin" />
        {t("Inapakia...", "Loading...")}
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <p className="text-xs text-gray-400 py-3">
        {t("Hakuna deals.", "No deals.")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {deals.map((d) => (
        <div
          key={d.id}
          className="flex items-center justify-between gap-2 text-xs border rounded-lg px-3 py-2"
          style={{ borderColor: COLORS.sandLine }}
        >
          <span className="truncate text-gray-700 min-w-0 flex-1">
            {d.listingTitle || "—"}
            {d.role && (
              <span className="ml-1 text-gray-400">({d.role})</span>
            )}
          </span>
          <div className="shrink-0">
            <StatusBadge status={d.status} lang={lang} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// TAB CONTENT — Sold
// ============================================================
function SoldTab({ listings, lang, loading }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500">
        <Loader2 size={16} className="animate-spin" />
        {t("Inapakia...", "Loading...")}
      </div>
    );
  }

  // Chuja sold listings pekee
  const soldListings = (listings || []).filter((l) => {
    const s = String(l.status || "").toLowerCase();
    return s === "sold" || s === "SOLD";
  });

  if (soldListings.length === 0) {
    return (
      <div className="py-6 text-center">
        <CheckCircle2
          size={28}
          className="mx-auto text-muted mb-2"
          style={{ color: COLORS.green }}
        />
        <p className="text-xs text-gray-400">
          {t("Hakuna mali zilizouzwa.", "No sold listings.")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {soldListings.map((l) => (
        <div
          key={l.id}
          className="flex items-start justify-between gap-2 text-xs border rounded-lg px-3 py-2"
          style={{
            borderColor: "rgba(37,99,235,0.3)",
            background: "rgba(37,99,235,0.04)",
          }}
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-700 truncate">
              {l.title}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {t("Imeuzwa", "Sold")}:{" "}
              {l.soldAt || l.updatedAt
                ? formatJoined(l.soldAt || l.updatedAt)
                : "—"}
            </p>
          </div>
          <div className="shrink-0">
            <span
              style={{
                background: "rgba(37,99,235,0.12)",
                color: "#2563EB",
              }}
              className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
            >
              SOLD
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function UserDrawer({ user, onClose, lang = "sw" }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("profile");

  // ── Deep link: soma URL params (?tab=listings&filter=sold) ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      const filter = params.get("filter");

      if (tab === "listings" && filter === "sold") {
        setActiveTab("sold");
      } else if (tab === "listings") {
        setActiveTab("listings");
      } else if (tab === "deals") {
        setActiveTab("deals");
      } else if (tab === "sold") {
        setActiveTab("sold");
      }
    } catch {
      /* noop */
    }
  }, []);

  // ── Fetch data ──────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const res = await api.get(`/admin/users/${user.id}/full/`);
        if (cancelled) return;
        setData(res);
      } catch (err) {
        if (cancelled) return;
        setError(
          err?.message ||
            t("Imeshindwa kupakia data.", "Failed to load data.")
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user) return null;

  const fullUser = data?.user || user;
  const listings = data?.listings || [];
  const deals = data?.deals || [];
  const hasAvatar = !!fullUser.avatar;

  // StatusBadge inatarajia "active" au "suspended" — tengeneza kutoka is_active
  const userStatus =
    fullUser.is_active === false
      ? "suspended"
      : fullUser.status || "active";

  const soldCount = listings.filter((l) => {
    const s = String(l.status || "").toLowerCase();
    return s === "sold";
  }).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div
        className="w-full sm:w-96 sm:max-w-md h-full bg-white shadow-2xl overflow-y-auto flex flex-col"
        style={{ fontFamily: FONTS.body }}
      >
        {/* Header — sticky */}
        <div
          className="sticky top-0 z-10 p-4 flex items-center justify-between border-b"
          style={{ borderColor: COLORS.sandLine, background: "white" }}
        >
          <h3 className="font-semibold text-gray-800 text-sm sm:text-base">
            {t("Wasifu wa Mtumiaji", "User Profile")}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 -mr-1"
            aria-label={t("Funga", "Close")}
          >
            <X size={20} />
          </button>
        </div>

        {/* User header — avatar + jina + badges */}
        <div className="p-4 sm:p-5 border-b" style={{ borderColor: COLORS.sandLine }}>
          <div className="flex items-center gap-3">
            {hasAvatar ? (
              <img
                src={fullUser.avatar}
                alt={fullUser.name}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover shrink-0"
              />
            ) : (
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-base sm:text-lg font-bold shrink-0"
                style={{ background: `${COLORS.gold}20`, color: COLORS.gold }}
              >
                {getUserInitial(fullUser)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-gray-800 truncate">
                  {fullUser.name || "—"}
                </p>
                {fullUser.is_verified && (
                  <ShieldCheck
                    size={14}
                    style={{ color: COLORS.green }}
                    className="shrink-0"
                    aria-label={t("Imethibitishwa", "Verified")}
                  />
                )}
              </div>
              <p className="text-xs text-gray-500 truncate">
                {fullUser.email || "—"}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <StatusBadge status={userStatus} lang={lang} />
                <span className="text-xs text-gray-400 capitalize">
                  {fullUser.role}
                </span>
              </div>
            </div>
          </div>

          {/* Simu */}
          {fullUser.phone && (
            <a
              href={`tel:${fullUser.phone}`}
              className="mt-3 flex items-center gap-2 text-sm text-gray-700 rounded-lg border px-3 py-2 hover:bg-gray-50 transition-colors"
              style={{ borderColor: COLORS.sandLine }}
            >
              <Phone size={14} style={{ color: COLORS.night }} />
              <span className="font-medium">{fullUser.phone}</span>
            </a>
          )}
        </div>

        {/* TABS */}
        <div
          className="flex gap-1 px-4 sm:px-5 border-b overflow-x-auto"
          style={{ borderColor: COLORS.sandLine }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count =
              tab.key === "listings"
                ? listings.length
                : tab.key === "deals"
                  ? deals.length
                  : tab.key === "sold"
                    ? soldCount
                    : null;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  color: isActive ? COLORS.night : "#6B7280",
                  borderBottomColor: isActive ? COLORS.gold : "transparent",
                }}
                className="shrink-0 text-xs font-semibold px-3 py-2.5 border-b-2 whitespace-nowrap transition-colors"
              >
                {tab.label[lang] || tab.label.sw}
                {count != null && (
                  <span className="ml-1 text-[10px] text-gray-400">
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* CONTENT */}
        <div className="p-4 sm:p-5 space-y-5 flex-1">
          {/* Loading state */}
          {loading && !data && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500">
              <Loader2 size={16} className="animate-spin" />
              {t("Inapakia...", "Loading...")}
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div
              className="text-xs text-center py-3 rounded-lg"
              style={{
                color: COLORS.rust,
                background: "rgba(193,80,46,0.08)",
              }}
            >
              {error}
            </div>
          )}

          {/* TAB: PROFILE */}
          {activeTab === "profile" && !loading && !error && (
            <div
              className="rounded-xl p-3 text-xs space-y-1.5"
              style={{ background: COLORS.sand }}
            >
              <div className="flex justify-between gap-2">
                <span className="text-gray-500 flex items-center gap-1">
                  <Calendar size={11} />
                  {t("Alijiunga:", "Joined:")}
                </span>
                <span className="font-medium text-gray-700 text-right">
                  {formatJoined(fullUser.date_joined || fullUser.joined)}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-500">Listings:</span>
                <span className="font-medium text-gray-700">
                  {loading ? "…" : listings.length}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-500">Sold:</span>
                <span className="font-medium text-gray-700">
                  {loading ? "…" : soldCount}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-500">Deals:</span>
                <span className="font-medium text-gray-700">
                  {loading ? "…" : deals.length}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-500">
                  {t("Hali ya Uthibitisho:", "Verified:")}
                </span>
                <span
                  className="font-medium"
                  style={{
                    color: fullUser.is_verified ? COLORS.green : "#6B7280",
                  }}
                >
                  {fullUser.is_verified
                    ? t("Ndiyo", "Yes")
                    : t("Hapana", "No")}
                </span>
              </div>
            </div>
          )}

          {/* TAB: LISTINGS */}
          {activeTab === "listings" && (
            <ListingsTab listings={listings} lang={lang} loading={loading} />
          )}

          {/* TAB: DEALS */}
          {activeTab === "deals" && (
            <DealsTab deals={deals} lang={lang} loading={loading} />
          )}

          {/* TAB: SOLD */}
          {activeTab === "sold" && (
            <SoldTab listings={listings} lang={lang} loading={loading} />
          )}
        </div>
      </div>
    </div>
  );
}