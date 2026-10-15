// ============================================================
// UserDrawer.jsx
// Drawer ya mtumiaji (kwa User Management) — inaonyesha
// listings zake na deals zake.
// Mobile-responsive.
// + Simu, Avatar, Verified badge
// ============================================================

import React from "react";
import { X, Phone, Mail, Calendar, ShieldCheck, CheckCircle2 } from "lucide-react";
import { COLORS, FONTS } from "./constants.js";
import StatusBadge from "./StatusBadge.jsx";

// ============================================================
// HELPERS
// ============================================================
function getSellerName(listing) {
  if (!listing) return "";
  return (
    listing.seller_name ||
    listing.seller?.name ||
    (typeof listing.seller === "string" ? listing.seller : "") ||
    ""
  );
}

function getBuyerName(deal) {
  if (!deal) return "";
  return (
    deal.buyerName ||
    deal.buyer_name ||
    deal.buyer?.name ||
    ""
  );
}

function getSellerNameFromDeal(deal) {
  if (!deal) return "";
  return (
    deal.sellerName ||
    deal.seller_name ||
    deal.seller?.name ||
    ""
  );
}

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
// MAIN COMPONENT
// ============================================================
export default function UserDrawer({
  user,
  listings = [],
  deals = [],
  onClose,
  lang = "sw",
}) {
  if (!user) return null;

  const t = (sw, en) => (lang === "sw" ? sw : en);
  const userName = user.name || user.email || "";

  // ── Listings: kama tuna userId, tumia; la sivyo, tumia jina ──
  const userListings = listings.filter((l) => {
    if (user.id != null) {
      const sellerId =
        l.sellerId ?? l.seller_id ?? l.seller?.id;
      if (sellerId != null) return String(sellerId) === String(user.id);
    }
    return getSellerName(l) === userName;
  });

  // ── Deals: kama tuna userId, tumia; la sivyo, tumia jina ──
  const userDeals = deals.filter((d) => {
    if (user.id != null) {
      const buyerId = d.buyerId ?? d.buyer_id ?? d.buyer?.id;
      const sellerId = d.sellerId ?? d.seller_id ?? d.seller?.id;
      if (String(buyerId) === String(user.id)) return true;
      if (String(sellerId) === String(user.id)) return true;
    }
    return (
      getBuyerName(d) === userName ||
      getSellerNameFromDeal(d) === userName
    );
  });

  const hasAvatar = !!user.avatar;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div
        className="w-full sm:w-96 sm:max-w-md h-full bg-white shadow-2xl overflow-y-auto"
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

        <div className="p-4 sm:p-5 space-y-5">
          {/* Header — avatar + jina + badges */}
          <div className="flex items-center gap-3">
            {hasAvatar ? (
              <img
                src={user.avatar}
                alt={userName}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover shrink-0"
              />
            ) : (
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-base sm:text-lg font-bold shrink-0"
                style={{ background: `${COLORS.gold}20`, color: COLORS.gold }}
              >
                {getUserInitial(user)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-gray-800 truncate">
                  {user.name || "—"}
                </p>
                {user.isVerified && (
                  <ShieldCheck
                    size={14}
                    style={{ color: COLORS.green }}
                    className="shrink-0"
                    aria-label={t("Imethibitishwa", "Verified")}
                  />
                )}
              </div>
              <p className="text-xs text-gray-500 truncate">
                {user.email || "—"}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <StatusBadge status={user.status} lang={lang} />
                <span className="text-xs text-gray-400 capitalize">
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          {/* Simu */}
          {user.phone && (
            <a
              href={`tel:${user.phone}`}
              className="flex items-center gap-2 text-sm text-gray-700 rounded-lg border px-3 py-2 hover:bg-gray-50 transition-colors"
              style={{ borderColor: COLORS.sandLine }}
            >
              <Phone size={14} style={{ color: COLORS.night }} />
              <span className="font-medium">{user.phone}</span>
            </a>
          )}

          {/* Meta */}
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
                {formatJoined(user.joined)}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-gray-500">Listings:</span>
              <span className="font-medium text-gray-700">
                {userListings.length}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-gray-500">Deals:</span>
              <span className="font-medium text-gray-700">
                {userDeals.length}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-gray-500">
                {t("Hali ya Uthibitisho:", "Verified:")}
              </span>
              <span
                className="font-medium"
                style={{
                  color: user.isVerified ? COLORS.green : "#6B7280",
                }}
              >
                {user.isVerified
                  ? t("Ndiyo", "Yes")
                  : t("Hapana", "No")}
              </span>
            </div>
          </div>

          {/* Listings */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
              {t(
                `Listings Zake (${userListings.length})`,
                `Listings (${userListings.length})`
              )}
            </p>
            {userListings.length === 0 ? (
              <p className="text-xs text-gray-400">
                {t("Hakuna listings.", "No listings.")}
              </p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {userListings.map((l) => (
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
            )}
          </div>

          {/* Deals */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
              {t(
                `Deals Zake (${userDeals.length})`,
                `Deals (${userDeals.length})`
              )}
            </p>
            {userDeals.length === 0 ? (
              <p className="text-xs text-gray-400">
                {t("Hakuna deals.", "No deals.")}
              </p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {userDeals.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between gap-2 text-xs border rounded-lg px-3 py-2"
                    style={{ borderColor: COLORS.sandLine }}
                  >
                    <span className="truncate text-gray-700 min-w-0 flex-1">
                      {d.listingTitle || d.listing?.title || "—"}
                    </span>
                    <div className="shrink-0">
                      <StatusBadge status={d.status} lang={lang} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}