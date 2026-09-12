// ============================================================
// OverviewSection.jsx
// Muhtasari wa mfumo — stats + live transactions.
// Bilingual (Kiswahili + English) — inasoma `lang` kutoka
// useLanguage().
// ============================================================

import React, { useMemo } from "react";
import {
  Users,
  Home,
  ShoppingBag,
  DollarSign,
  Clock,
  ArrowRight,
} from "lucide-react";
import { COLORS } from "../shared/constants.js";
import StatCard from "../shared/StatCard.jsx";
import SectionHeader from "../shared/SectionHeader.jsx";
import StatusBadge from "../shared/StatusBadge.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import { useUsers } from "../../../../config/usersStore.js";
import { useListings } from "../../../../config/listingsStore.js";
import { useDeals } from "../../../../config/dealsStore.js";
import { useMyTransactionsAggregate } from "../../../../config/transactionsStore.js";

export default function OverviewSection({ onNavigate }) {
  const { lang } = useLanguage();
  const users = useUsers();
  const listings = useListings();
  const deals = useDeals();
  const transactions = useMyTransactionsAggregate();

  const totalUsers = users.length;
  const liveListings = listings.filter((l) => l.status === "live").length;
  const reservedListings = listings.filter((l) => l.status === "reserved").length;
  const totalDeals = deals.length;
  const totalRevenue = transactions.revenue;

  const activeDeals = useMemo(
    () =>
      deals.filter((d) =>
        [
          "negotiating",
          "offer_sent",
          "accepted",
          "reserved",
          "awaiting_final_payment",
          "payment_proof_submitted",
          "disputed",
        ].includes(d.status)
      ),
    [deals]
  );

  const formatTZS = (amount) =>
    "TZS " + Math.round(amount || 0).toLocaleString("en-US");

  const stats = [
    {
      id: "users",
      label: lang === "sw" ? "Watumiaji" : "Users",
      value: totalUsers.toLocaleString(),
      change: "",
      icon: Users,
      color: COLORS.gold,
    },
    {
      id: "listings",
      label:
        lang === "sw"
          ? "Mali (Live + Reserved)"
          : "Listings (Live + Reserved)",
      value: `${liveListings} + ${reservedListings}`,
      change: "",
      icon: Home,
      color: COLORS.green,
    },
    {
      id: "deals",
      label: lang === "sw" ? "Deals" : "Deals",
      value: totalDeals.toLocaleString(),
      change: "",
      icon: ShoppingBag,
      color: "#2563EB",
    },
    {
      id: "revenue",
      label: lang === "sw" ? "Mapato" : "Revenue",
      value: formatTZS(totalRevenue),
      change: "",
      icon: DollarSign,
      color: COLORS.rust,
    },
  ];

  return (
    <>
      <SectionHeader
        title={lang === "sw" ? "Muhtasari & Uchanganuzi" : "Overview & Analytics"}
        subtitle={
          lang === "sw"
            ? "Muhtasari wa mfumo mzima wa SokoMkononi"
            : "Overview of the entire SokoMkononi system"
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <StatCard key={stat.id} {...stat} />
        ))}
      </div>

      {/* LIVE TRANSACTIONS IN PROGRESS */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Clock size={16} color={COLORS.gold} />
            {lang === "sw"
              ? "Live Transactions Zinazoendelea"
              : "Live Transactions in Progress"}
          </h3>
          <button
            onClick={() => onNavigate("deals")}
            className="text-xs font-semibold hover:underline flex items-center gap-1"
            style={{ color: COLORS.gold }}
          >
            {lang === "sw" ? "Nenda Deal Rooms" : "Go to Deal Rooms"}
            <ArrowRight size={12} />
          </button>
        </div>

        {activeDeals.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            {lang === "sw"
              ? "Hakuna deals zinazoendelea kwa sasa."
              : "No active deals right now."}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {activeDeals.slice(0, 5).map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between gap-3 border rounded-lg px-3 py-2.5 flex-wrap"
                style={{ borderColor: COLORS.sandLine }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {d.listingTitle}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {d.buyerName} ← → {d.sellerName}
                  </p>
                </div>
                <span
                  className="text-sm font-bold shrink-0"
                  style={{ color: COLORS.rust }}
                >
                  {formatTZS(d.currentOffer ?? d.askingPrice)}
                </span>
                <StatusBadge status={d.status} lang={lang} />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
