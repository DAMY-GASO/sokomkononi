// ============================================================
// RecentActivity.jsx
// Shughuli za hivi karibuni — kwa Muuzaji (seller) na Mnunuzi (buyer).
// Inasoma moja kwa moja kutoka stores halisi (listings, deals,
// transactions, saved) — sawa na jinsi DealRooms.jsx inavyotumia
// `side` prop kuamua mtazamo.
//
// MAHALI: weka faili hii kwenye
//   src/pages/dashboard/components/RecentActivity.jsx
// (badala ya seller/RecentActivity.jsx) ili SellerOverview.jsx
// NA BuyerOverview.jsx zote ziweze kuitumia.
// ============================================================

import React, { useMemo } from "react";
import {
  PlusCircle,
  Rocket,
  MessagesSquare,
  Heart,
  Wallet,
  CreditCard,
} from "lucide-react";
import { COLORS, timeAgo } from "./shared";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import {
  useListings,
  usePublicListings,
} from "../../../config/listingsStore.js";
import { useDeals } from "../../../config/dealsStore.js";
import { useTransactions } from "../../../config/transactionsStore.js";
import { useSavedIds, useSavedSnapshots } from "../../../config/savedStore.js";

export default function RecentActivity({ onNavigate, side = "seller" }) {
  const { lang } = useLanguage();
  const t = (sw, en) => (lang === "sw" ? sw : en);

  // Data kutoka stores halisi za app
  const myListings = useListings();
  const allListings = usePublicListings();
  const deals = useDeals();
  const transactions = useTransactions();
  const savedIds = useSavedIds();
  const savedSnapshots = useSavedSnapshots();

  const activities = useMemo(() => {
    const events = [];

    if (side === "seller") {
      // --- Matukio ya Muuzaji ---
      myListings.forEach((l) => {
        if (l.postedAt) {
          events.push({
            id: `listing_posted_${l.id}`,
            icon: PlusCircle,
            color: COLORS.green,
            title: t(
              `Listing "${l.title}" ilichapishwa`,
              `Listing "${l.title}" was posted`
            ),
            at: l.postedAt,
            onClick: () => onNavigate("listings"),
          });
        }
        if (l.boostExpiresAt && new Date(l.boostExpiresAt) > new Date()) {
          events.push({
            id: `listing_boosted_${l.id}`,
            icon: Rocket,
            color: COLORS.gold,
            title: t(
              `Listing "${l.title}" imeboostiwa`,
              `Listing "${l.title}" was boosted`
            ),
            at: l.boostExpiresAt,
            onClick: () => onNavigate("listings"),
          });
        }
      });

      transactions
        .filter((tx) => tx.type === "sale" && tx.status === "completed")
        .forEach((tx) => {
          events.push({
            id: `sale_${tx.id}`,
            icon: Wallet,
            color: COLORS.green,
            title: t(
              `Umepokea malipo — "${tx.property}"`,
              `You received payment — "${tx.property}"`
            ),
            at: tx.at,
            onClick: () => onNavigate("transactions"),
          });
        });
    } else {
      // --- Matukio ya Mnunuzi ---
      const savedListings = allListings.filter((l) => savedIds.includes(l.id));
      savedListings.forEach((l) => {
        // savedSnapshots[l.id].savedAt ni wakati halisi wa kuhifadhi
        // (kutoka savedStore.js). Ikikosekana (mfano listing zilizohifadhiwa
        // kabla ya snapshot kuanzishwa), tunarudi kwa postedAt.
        const savedAt = savedSnapshots[l.id]?.savedAt || l.postedAt;
        events.push({
          id: `saved_${l.id}`,
          icon: Heart,
          color: COLORS.rust,
          title: t(`Umehifadhi "${l.title}"`, `You saved "${l.title}"`),
          at: savedAt,
          onClick: () => onNavigate("saved"),
        });
      });

      transactions
        .filter(
          (tx) =>
            (tx.type === "purchase" || tx.type === "reservation") &&
            tx.status === "completed"
        )
        .forEach((tx) => {
          events.push({
            id: `txn_${tx.id}`,
            icon: tx.type === "purchase" ? Wallet : CreditCard,
            color: tx.type === "purchase" ? COLORS.green : COLORS.gold,
            title:
              tx.type === "purchase"
                ? t(
                    `Ununuzi umekamilika — "${tx.property}"`,
                    `Purchase completed — "${tx.property}"`
                  )
                : t(
                    `Umelipa Reservation Fee — "${tx.property}"`,
                    `You paid a Reservation Fee — "${tx.property}"`
                  ),
            at: tx.at,
            onClick: () => onNavigate("transactions"),
          });
        });
    }

    // Deal Rooms — zinaonekana pande zote mbili (sawa na DealRooms.jsx)
    deals.forEach((d) => {
      events.push({
        id: `deal_${d.id}`,
        icon: MessagesSquare,
        color: COLORS.rust,
        title:
          side === "seller"
            ? t(
                `Deal Room mpya — "${d.listingTitle}"`,
                `New Deal Room — "${d.listingTitle}"`
              )
            : t(
                `Deal Room na muuzaji — "${d.listingTitle}"`,
                `Deal Room with seller — "${d.listingTitle}"`
              ),
        at: d.messages?.[0]?.at || new Date().toISOString(),
        onClick: () => onNavigate("deals"),
      });
    });

    // Sort kwa tarehe, chukua 5 za hivi karibuni
    return events
      .filter((e) => e.at)
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 5);
  }, [
    side,
    myListings,
    allListings,
    savedIds,
    savedSnapshots,
    deals,
    transactions,
    lang,
    onNavigate,
  ]);

  const emptyMessage =
    side === "seller"
      ? t(
          "Hakuna shughuli bado. Anza kwa kuweka mali yako ya kwanza.",
          "No activity yet. Start by posting your first property."
        )
      : t(
          "Hakuna shughuli bado. Anza kwa kuhifadhi mali unayopenda.",
          "No activity yet. Start by saving a property you like."
        );

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
      {/* ============================================================ */}
      {/* HEADER — CENTERED */}
      {/* ============================================================ */}
      <div className="flex flex-col items-center gap-1 mb-4 text-center">
        <h2
          style={{ color: COLORS.night }}
          className="text-sm font-semibold"
        >
          {t("Shughuli za Hivi Karibuni", "Recent Activity")}
        </h2>
        <button
          onClick={() => onNavigate(side === "seller" ? "listings" : "saved")}
          className="text-xs font-semibold hover:underline"
          style={{ color: COLORS.gold }}
        >
          {t("Ona Zote →", "View All →")}
        </button>
      </div>

      {activities.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          {emptyMessage}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {activities.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.id}
                onClick={a.onClick}
                className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div
                  style={{ background: `${a.color}15` }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                >
                  <Icon size={14} color={a.color} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-700 leading-snug">
                    {a.title}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5">
                    {timeAgo(a.at, lang)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
