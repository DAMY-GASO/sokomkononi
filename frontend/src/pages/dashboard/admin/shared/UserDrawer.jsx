// ============================================================
// UserDrawer.jsx
// Drawer ya mtumiaji (kwa User Management) — inaonyesha
// listings zake na deals zake.
// Mobile-responsive.
// ============================================================

import React from "react";
import { X } from "lucide-react";
import { COLORS, FONTS } from "./constants.js";
import StatusBadge from "./StatusBadge.jsx";

export default function UserDrawer({ user, listings, deals, onClose, lang }) {
  if (!user) return null;

  const userListings = listings.filter((l) => l.seller === user.name);
  const userDeals = deals.filter(
    (d) => d.buyerName === user.name || d.sellerName === user.name
  );

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
            {lang === "sw" ? "Wasifu wa Mtumiaji" : "User Profile"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 -mr-1"
            aria-label={lang === "sw" ? "Funga" : "Close"}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-5">
          {/* Header — avatar + jina */}
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-base sm:text-lg font-bold shrink-0"
              style={{ background: `${COLORS.gold}20`, color: COLORS.gold }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-800 truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <StatusBadge status={user.status} lang={lang} />
                <span className="text-xs text-gray-400 capitalize">
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          {/* Meta */}
          <div
            className="rounded-xl p-3 text-xs space-y-1.5"
            style={{ background: COLORS.sand }}
          >
            <div className="flex justify-between gap-2">
              <span className="text-gray-500">
                {lang === "sw" ? "Alijiunga:" : "Joined:"}
              </span>
              <span className="font-medium text-gray-700 text-right">
                {user.joined}
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
          </div>

          {/* Listings */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
              {lang === "sw"
                ? `Listings Zake (${userListings.length})`
                : `Listings (${userListings.length})`}
            </p>
            {userListings.length === 0 ? (
              <p className="text-xs text-gray-400">
                {lang === "sw" ? "Hakuna listings." : "No listings."}
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
              {lang === "sw"
                ? `Deals Zake (${userDeals.length})`
                : `Deals (${userDeals.length})`}
            </p>
            {userDeals.length === 0 ? (
              <p className="text-xs text-gray-400">
                {lang === "sw" ? "Hakuna deals." : "No deals."}
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
                      {d.listingTitle}
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
