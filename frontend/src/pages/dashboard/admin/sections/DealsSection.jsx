// ============================================================
// DealsSection.jsx
// Admin — Deal Rooms (read-only view)
// Ona deals zote za watumiaji. Admin HAWEZI kuandika.
// Data inatoka API + localStorage cleanup.
// ============================================================
import React, { useState, useEffect, useRef } from "react";
import { Eye, Loader2, RefreshCw } from "lucide-react";
import { COLORS, timeAgo } from "../shared/constants.js";
import { getCategory } from "../../../../config/categoriesStore.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import StatusBadge from "../shared/StatusBadge.jsx";
import DealRoomViewer from "../components/DealDispute/DealRoomViewer.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import { useAuth } from "../../../../config/authStore.js";
import {
  useDeals,
  hydrateDealsFromApi,
  fetchDealDetailAsync,
} from "../../../../config/dealsStore.js";
import {
  fetchDealRoomDetailAsync,
} from "../../../../config/transactionLifecycleStore.js";

// ============================================================
// localStorage CLEANUP — ondoa data za zamani
// ============================================================
const LEGACY_DEALS_KEY = "sokomkononi_deals_v1";
const CLEANUP_FLAG = "sokomkononi_deals_cleaned_v2";

function cleanupLegacyDealsOnce() {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(CLEANUP_FLAG)) return;
    // Futa cache ya zamani — itajazwa upya kutoka API
    window.localStorage.removeItem(LEGACY_DEALS_KEY);
    window.localStorage.setItem(CLEANUP_FLAG, "1");
  } catch {
    /* noop */
  }
}

export default function DealsSection() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const deals = useDeals(user?.id);

  // Cleanup mara moja tu kwenye mwanzo wa app
  useEffect(() => {
    cleanupLegacyDealsOnce();
  }, []);

  // Enrich deals zinazokosekana data
  const enrichedRef = useRef(new Set());
  useEffect(() => {
    if (!user?.id) return;
    deals.forEach((d) => {
      const needsEnrich =
        !d.buyerName ||
        !d.sellerName ||
        !d.listingTitle ||
        (d.currentOffer === 0 && d.askingPrice === 0);
      if (!needsEnrich) return;
      if (enrichedRef.current.has(d.id)) return;
      enrichedRef.current.add(d.id);
      fetchDealDetailAsync(d.id).catch((err) => {
        console.warn("[DealsSection] enrich failed for", d.id, err);
        enrichedRef.current.delete(d.id);
      });
    });
  }, [deals, user?.id]);

  const [expandedId, setExpandedId] = useState(null);
  const [error, setError] = useState("");
  const [dealRooms, setDealRooms] = useState({});
  const [loadingRoom, setLoadingRoom] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const inflightRoomRef = useRef(new Map());

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const displayDealAmount = (d) => {
    const amt =
      d?.currentOffer > 0 ? d.currentOffer :
      d?.askingPrice > 0 ? d.askingPrice : 0;
    return amt > 0 ? "TZS " + Math.round(amt).toLocaleString("en-US") : "—";
  };
  const displayDealName = (name, id) => name || (id ? `#${id}` : "—");
  const displayListing = (d) =>
    d?.listingTitle || (d?.listingId ? `#${d.listingId}` : `#${d.id}`);
  const displayCategory = (d) => {
    if (!d?.category) return "—";
    const cat = getCategory(d.category);
    return cat?.label?.[lang] || cat?.label?.sw || d.category;
  };

  const handleRefresh = async () => {
    if (!user?.id || refreshing) return;
    setRefreshing(true);
    setError("");
    try {
      await hydrateDealsFromApi(user.id);
      setDealRooms({});
    } catch (err) {
      setError(t("Imeshindwa kusasisha deals.", "Failed to refresh deals."));
    } finally {
      setRefreshing(false);
    }
  };

  // ── Load deal room data (messages, payment proof) ─────────
  const ensureRoomData = async (dealId, { force = false } = {}) => {
    if (!force && dealRooms[dealId]) return dealRooms[dealId];
    if (inflightRoomRef.current.has(dealId)) {
      return inflightRoomRef.current.get(dealId);
    }

    setLoadingRoom((prev) => ({ ...prev, [dealId]: true }));
    const promise = (async () => {
      const res = await fetchDealRoomDetailAsync(dealId);
      if (res.ok) {
        const entry = {
          messages: res.messages || [],
          paymentProof: res.paymentProof || null,
          reservation: res.reservation || null,
          disputeNote: res.disputeNote || "",
        };
        setDealRooms((prev) => ({ ...prev, [dealId]: entry }));
        return entry;
      }
      setError(
        res.error?.message ||
          t("Imeshindwa kupakia deal room.", "Failed to load deal room.")
      );
      return null;
    })();

    inflightRoomRef.current.set(dealId, promise);
    try {
      return await promise;
    } finally {
      inflightRoomRef.current.delete(dealId);
      setLoadingRoom((prev) => {
        const next = { ...prev };
        delete next[dealId];
        return next;
      });
    }
  };

  const handleViewRoom = async (deal) => {
    const dealId = deal.id;
    if (expandedId === dealId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(dealId);
    setError("");
    await ensureRoomData(dealId);
  };

  // ── Action button (View Room only) ────────────────────────
  const ActionButtons = ({ deal, fullWidth = false }) => {
    const isRoomOpen = expandedId === deal.id;
    const isLoading = !!loadingRoom[deal.id];

    return (
      <div className={fullWidth ? "w-full" : "flex justify-end"}>
        <button
          onClick={() => handleViewRoom(deal)}
          disabled={isLoading}
          style={{ borderColor: COLORS.sandLine, color: "var(--text-primary)" }}
          className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg border hover:bg-gray-50 transition-colors disabled:opacity-50 ${
            fullWidth ? "w-full" : ""
          }`}
        >
          {isLoading ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Eye size={13} />
          )}
          {isRoomOpen ? t("Funga", "Close") : t("Angalia Room", "View Room")}
        </button>
      </div>
    );
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <SectionHeader
            title={t("Deal Rooms", "Deal Rooms")}
            subtitle={t(
              "Fuatilia deals za watumiaji wote. Unaweza kuona kilichojiri bila kuandika.",
              "Monitor all users' deals. You can view activity without writing."
            )}
          />
        </div>
        <button
          onClick={handleRefresh}
          disabled={!user?.id || refreshing}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors shrink-0 disabled:opacity-50"
          style={{
            borderColor: COLORS.sandLine,
            color: "var(--text-primary)",
            background: "white",
          }}
        >
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          <span className="hidden sm:inline">
            {refreshing
              ? t("Inasasisha...", "Refreshing...")
              : t("Sasisha", "Refresh")}
          </span>
        </button>
      </div>

      {error && (
        <div
          style={{ background: "rgba(193,80,46,0.1)", color: COLORS.rust }}
          className="text-xs font-semibold px-3 py-2 rounded-lg mb-4"
        >
          {error}
        </div>
      )}

      {/* DESKTOP — TABLE */}
      <div className="hidden sm:block bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">
                  {t("Mali", "Listing")}
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">
                  {t("Kategoria", "Category")}
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">
                  {t("Mahali", "Location")}
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">
                  {t("Mnunuzi", "Buyer")}
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">
                  {t("Muuzaji", "Seller")}
                </th>
                <th className="px-5 py-2.5 text-right text-xs font-medium text-secondary uppercase">
                  {t("Bei / Ofa", "Price / Offer")}
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">
                  Status
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">
                  {t("Ilianzishwa", "Created")}
                </th>
                <th className="px-5 py-2.5 text-right text-xs font-medium text-secondary uppercase">
                  {t("Kitendo", "Action")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {deals.map((d) => {
                const isDisputed = d.status === "disputed";
                const isExpanded = expandedId === d.id;
                return (
                  <React.Fragment key={d.id}>
                    <tr className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 text-sm font-medium text-primary">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{displayListing(d)}</span>
                          {isDisputed && (
                            <span
                              style={{
                                background: `${COLORS.rust}15`,
                                color: COLORS.rust,
                              }}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
                            >
                              {t("MGOGORO", "DISPUTE")}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-secondary">
                        {displayCategory(d)}
                      </td>
                      <td
                        className="px-5 py-3 text-sm text-secondary truncate max-w-[180px]"
                        title={d.location || ""}
                      >
                        {d.location || "—"}
                      </td>
                      <td className="px-5 py-3 text-sm text-secondary">
                        <div className="min-w-0">
                          <div>{displayDealName(d.buyerName, d.buyerId)}</div>
                          {d.buyerEmail && (
                            <div className="text-[11px] text-muted truncate">
                              {d.buyerEmail}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-secondary">
                        <div className="min-w-0">
                          <div>
                            {displayDealName(d.sellerName, d.sellerId)}
                          </div>
                          {d.sellerEmail && (
                            <div className="text-[11px] text-muted truncate">
                              {d.sellerEmail}
                            </div>
                          )}
                        </div>
                      </td>
                      <td
                        className="px-5 py-3 text-sm font-semibold text-right"
                        style={{ color: COLORS.rust }}
                      >
                        {displayDealAmount(d)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={d.status} lang={lang} />
                      </td>
                      <td className="px-5 py-3 text-[11px] text-muted whitespace-nowrap">
                        {d.createdAt ? timeAgo(d.createdAt, lang) : "—"}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <ActionButtons deal={d} />
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={9} className="p-0">
                          <DealRoomViewer
                            deal={d}
                            roomData={dealRooms[d.id]}
                            loading={!!loadingRoom[d.id]}
                            onClose={() => setExpandedId(null)}
                            lang={lang}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {deals.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-8 text-center text-sm text-muted"
                  >
                    {t("Hakuna deals", "No deals")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE — CARD LIST */}
      <div className="sm:hidden flex flex-col gap-3">
        {deals.map((d) => {
          const isDisputed = d.status === "disputed";
          const isExpanded = expandedId === d.id;
          return (
            <div
              key={d.id}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-primary line-clamp-2">
                      {displayListing(d)}
                    </p>
                    {isDisputed && (
                      <span
                        style={{
                          background: `${COLORS.rust}15`,
                          color: COLORS.rust,
                        }}
                        className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1"
                      >
                        {t("MGOGORO", "DISPUTE")}
                      </span>
                    )}
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={d.status} lang={lang} />
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-xs text-secondary mb-2">
                  <span className="truncate">
                    {t("Kategoria", "Category")}:{" "}
                    <span className="font-medium text-primary">
                      {displayCategory(d)}
                    </span>
                  </span>
                  {d.location && (
                    <span className="truncate">
                      {t("Mahali", "Location")}:{" "}
                      <span className="font-medium text-primary">
                        {d.location}
                      </span>
                    </span>
                  )}
                  <span className="truncate">
                    {t("Mnunuzi", "Buyer")}:{" "}
                    <span className="font-medium text-primary">
                      {displayDealName(d.buyerName, d.buyerId)}
                    </span>
                    {d.buyerEmail && (
                      <span className="text-muted"> · {d.buyerEmail}</span>
                    )}
                  </span>
                  <span className="truncate">
                    {t("Muuzaji", "Seller")}:{" "}
                    <span className="font-medium text-primary">
                      {displayDealName(d.sellerName, d.sellerId)}
                    </span>
                    {d.sellerEmail && (
                      <span className="text-muted"> · {d.sellerEmail}</span>
                    )}
                  </span>
                  {d.createdAt && (
                    <span className="text-[11px] text-muted">
                      {t("Ilianzishwa", "Created")}:{" "}
                      {timeAgo(d.createdAt, lang)}
                    </span>
                  )}
                </div>
                <p
                  className="text-sm font-bold mb-3"
                  style={{ color: COLORS.rust }}
                >
                  {displayDealAmount(d)}
                </p>
                <ActionButtons deal={d} fullWidth />
              </div>
              {isExpanded && (
                <div className="border-t border-gray-100">
                  <DealRoomViewer
                    deal={d}
                    roomData={dealRooms[d.id]}
                    loading={!!loadingRoom[d.id]}
                    onClose={() => setExpandedId(null)}
                    lang={lang}
                  />
                </div>
              )}
            </div>
          );
        })}
        {deals.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-muted">
            {t("Hakuna deals", "No deals")}
          </div>
        )}
      </div>
    </>
  );
}