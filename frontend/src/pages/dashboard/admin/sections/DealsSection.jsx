// ============================================================
// DealsSection.jsx
// Deal Rooms & Dispute Resolution — Admin.
// Bilingual + mobile-responsive + Async actions na rollback.
//
// SASISHO:
//   - useDeals(user?.id) — pitisha currentUserId ili counterpartyName ifanye kazi
//   - handleResolve — fetchTransactionDetailAsync (si createTransactionAsync)
//   - Refresh button — kusasisha deals + kufuta cache ya room
// ============================================================

import React, { useState } from "react";
import {
  MoreVertical,
  Eye,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { COLORS, formatTZS } from "../shared/constants.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import StatusBadge from "../shared/StatusBadge.jsx";
import DisputeReviewPanel from "../components/DealDispute/DisputeReviewPanel.jsx";
import DealRoomViewer from "../components/DealDispute/DealRoomViewer.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import { useAuth } from "../../../../config/authStore.js";
import {
  useDeals,
  hydrateDealsFromApi,
  resolveDisputeAsync,
} from "../../../../config/dealsStore.js";
import {
  getTransactionByDealRoom,
  fetchTransactionDetailAsync,
  fetchDealRoomDetailAsync,
} from "../../../../config/transactionLifecycleStore.js";

export default function DealsSection() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const deals = useDeals(user?.id);

  const [expandedId, setExpandedId] = useState(null);
  const [disputeId, setDisputeId] = useState(null);
  const [busy, setBusy] = useState({}); // { [dealId]: true }
  const [error, setError] = useState("");
  const [dealRooms, setDealRooms] = useState({}); // { [dealId]: { messages, offers, paymentProof } }
  const [loadingRoom, setLoadingRoom] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const t = (sw, en) => (lang === "sw" ? sw : en);

  // ============================================================
  // REFRESH — sasisha deals + futa cache ya room
  // ============================================================
  const handleRefresh = async () => {
    if (!user?.id || refreshing) return;
    setRefreshing(true);
    setError("");
    try {
      await hydrateDealsFromApi(user.id);
      // Futa cache ya room ili kila "View Room" ipakue upya
      setDealRooms({});
    } catch (err) {
      console.warn("[DealsSection] refresh failed:", err);
      setError(
        t("Imeshindwa kusasisha deals.", "Failed to refresh deals.")
      );
    } finally {
      setRefreshing(false);
    }
  };

  // ============================================================
  // HANDLE VIEW ROOM — fetch deal room detail kutoka backend
  // Backend inarudisha AdminDealRoomSerializer kwa admin —
  // ina messages, paymentProof, reservation details, disputeNote.
  // ============================================================
  const handleViewRoom = async (deal) => {
    const dealId = deal.id;

    // Toggle — kama ipo wazi, funga
    if (expandedId === dealId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(dealId);
    setDisputeId(null);
    setError("");

    // Kama tayari tuna data, usirudie fetch
    if (dealRooms[dealId]) return;

    setLoadingRoom(true);

    const res = await fetchDealRoomDetailAsync(dealId);
    setLoadingRoom(false);

    if (res.ok) {
      setDealRooms((prev) => ({
        ...prev,
        [dealId]: {
          messages: res.messages || [],
          paymentProof: res.paymentProof || null,
          reservation: res.reservation || null,
          disputeNote: res.disputeNote || "",
        },
      }));
    } else {
      setError(
        res.error?.message ||
          t("Imeshindwa kupakia deal room.", "Failed to load deal room.")
      );
    }
  };

  // ============================================================
  // HANDLE RESOLVE — async + rollback
  // Admin hana ruhusa kuunda transaction — anatumia iliyopo.
  // ============================================================
  const handleResolve = async (dealId, payload) => {
    if (busy[dealId]) return;

    setBusy((b) => ({ ...b, [dealId]: true }));
    setError("");

    // ── 1. Angalia local cache kwanza ────────────────────────
    let tx = getTransactionByDealRoom(dealId);

    // ── 2. Kama haipo, fetch kutoka backend ──────────────────
    if (!tx?.id) {
      try {
        const fetched = await fetchTransactionDetailAsync(dealId);
        if (fetched?.ok && fetched.transaction?.id) {
          tx = fetched.transaction;
        }
      } catch (err) {
        console.warn("[DealsSection] tx fetch failed:", err);
      }
    }

    // ── 3. Kama bado haipo → mwambie admin ───────────────────
    if (!tx?.id) {
      setBusy((b) => {
        const n = { ...b };
        delete n[dealId];
        return n;
      });
      setError(
        t(
          "Transaction haijatengenezwa bado kwa deal hii. Mwambie mnunuzi/muuzaji aanzishe transaction kwanza.",
          "No transaction exists for this deal yet. Ask buyer/seller to start a transaction first."
        )
      );
      return;
    }

    // ── 4. Tuma resolve kwa backend ──────────────────────────
    const res = await resolveDisputeAsync(dealId, {
      resolution: payload.action,
      note: payload.adminNote || "",
      transactionId: tx.id,
    });

    setBusy((b) => {
      const next = { ...b };
      delete next[dealId];
      return next;
    });

    if (res.ok) {
      setDisputeId(null);
      setExpandedId(null);
    } else {
      setError(
        res.error?.message ||
          t(
            "Imeshindwa kutatua mgogoro. Jaribu tena.",
            "Failed to resolve dispute. Try again."
          )
      );
    }
  };

  // ============================================================
  // ACTION BUTTONS — tofauti kwa disputed na nyingine
  // ============================================================
  const ActionButtons = ({ deal, fullWidth = false }) => {
    const isDisputed = deal.status === "disputed";
    const isRoomOpen = expandedId === deal.id;
    const isDisputeOpen = disputeId === deal.id;
    const isBusy = !!busy[deal.id];
    const isLoading = loadingRoom && expandedId === deal.id;

    if (isDisputed) {
      return (
        <div
          className={`flex gap-2 ${
            fullWidth ? "w-full" : "justify-end"
          } flex-wrap`}
        >
          <button
            onClick={() => handleViewRoom(deal)}
            disabled={isBusy || isLoading}
            style={{
              borderColor: COLORS.sandLine,
              color: "var(--text-primary)",
            }}
            className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg border hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              fullWidth ? "flex-1" : ""
            }`}
          >
            {isLoading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Eye size={13} />
            )}
            {t("Angalia Room", "View Room")}
          </button>
          <button
            onClick={() => {
              setDisputeId(isDisputeOpen ? null : deal.id);
              setExpandedId(null);
            }}
            disabled={isBusy}
            style={{
              background: COLORS.gold,
              color: COLORS.night,
            }}
            className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${
              fullWidth ? "flex-1" : ""
            }`}
          >
            <AlertTriangle size={13} />
            {isDisputeOpen
              ? t("Funga", "Close")
              : t("Kagua Mgogoro", "Review Dispute")}
          </button>
        </div>
      );
    }

    return (
      <div className={fullWidth ? "flex justify-end" : "flex justify-end"}>
        <button
          onClick={() => handleViewRoom(deal)}
          disabled={isBusy || isLoading}
          style={{
            borderColor: COLORS.sandLine,
            color: "var(--text-primary)",
          }}
          className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg border hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
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
      {/* Header + Refresh */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <SectionHeader
            title={t(
              "Deal Rooms & Utatuzi wa Migogoro",
              "Deal Rooms & Dispute Resolution"
            )}
            subtitle={t(
              "Fuatilia deals na utatue migogoro. Bofya 'Angalia Room' kuona kilichojiri.",
              "Monitor deals and resolve disputes. Click 'View Room' to see what happened."
            )}
          />
        </div>
        <button
          onClick={handleRefresh}
          disabled={!user?.id || refreshing}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            borderColor: COLORS.sandLine,
            color: "var(--text-primary)",
            background: "white",
          }}
        >
          <RefreshCw
            size={13}
            className={refreshing ? "animate-spin" : ""}
          />
          <span className="hidden sm:inline">
            {refreshing ? t("Inasasisha...", "Refreshing...") : t("Sasisha", "Refresh")}
          </span>
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div
          style={{
            background: "rgba(193,80,46,0.1)",
            color: COLORS.rust,
          }}
          className="text-xs font-semibold px-3 py-2 rounded-lg mb-4"
        >
          {error}
        </div>
      )}

      {/* ============================================================
          DESKTOP — TABLE
          ============================================================ */}
      <div className="hidden sm:block bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">
                  {t("Mali", "Listing")}
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">
                  {t("Mnunuzi", "Buyer")}
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">
                  {t("Muuzaji", "Seller")}
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">
                  {t("Kiasi", "Amount")}
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">
                  Status
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
                const isDisputeOpen = disputeId === d.id;
                return (
                  <React.Fragment key={d.id}>
                    <tr className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 text-sm font-medium text-primary">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{d.listingTitle}</span>
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
                        {d.buyerName || "—"}
                      </td>
                      <td className="px-5 py-3 text-sm text-secondary">
                        {d.sellerName || "—"}
                      </td>
                      <td
                        className="px-5 py-3 text-sm font-semibold"
                        style={{ color: COLORS.rust }}
                      >
                        {formatTZS(d.currentOffer ?? d.askingPrice ?? 0)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={d.status} lang={lang} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <ActionButtons deal={d} />
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} className="p-0">
                          <DealRoomViewer
                            deal={d}
                            roomData={dealRooms[d.id]}
                            loading={loadingRoom && expandedId === d.id}
                            onClose={() => setExpandedId(null)}
                            lang={lang}
                          />
                        </td>
                      </tr>
                    )}
                    {isDisputed && isDisputeOpen && (
                      <tr>
                        <td colSpan={6} className="p-0">
                          <DisputeReviewPanel
                            deal={d}
                            roomData={dealRooms[d.id]}
                            onResolve={handleResolve}
                            onClose={() => setDisputeId(null)}
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
                    colSpan={6}
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

      {/* ============================================================
          MOBILE — CARD LIST
          ============================================================ */}
      <div className="sm:hidden flex flex-col gap-3">
        {deals.map((d) => {
          const isDisputed = d.status === "disputed";
          const isExpanded = expandedId === d.id;
          const isDisputeOpen = disputeId === d.id;
          return (
            <div
              key={d.id}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-primary line-clamp-2">
                      {d.listingTitle}
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

                <div className="flex flex-col gap-0.5 text-xs text-secondary mb-2">
                  <span className="truncate">
                    {t("Mnunuzi", "Buyer")}:{" "}
                    <span className="font-medium text-primary">
                      {d.buyerName || "—"}
                    </span>
                  </span>
                  <span className="truncate">
                    {t("Muuzaji", "Seller")}:{" "}
                    <span className="font-medium text-primary">
                      {d.sellerName || "—"}
                    </span>
                  </span>
                </div>

                <p
                  className="text-sm font-bold mb-3"
                  style={{ color: COLORS.rust }}
                >
                  {formatTZS(d.currentOffer ?? d.askingPrice ?? 0)}
                </p>

                <ActionButtons deal={d} fullWidth />
              </div>

              {isExpanded && (
                <div className="border-t border-gray-100">
                  <DealRoomViewer
                    deal={d}
                    roomData={dealRooms[d.id]}
                    loading={loadingRoom && expandedId === d.id}
                    onClose={() => setExpandedId(null)}
                    lang={lang}
                  />
                </div>
              )}

              {isDisputed && isDisputeOpen && (
                <div className="border-t border-gray-100">
                  <DisputeReviewPanel
                    deal={d}
                    roomData={dealRooms[d.id]}
                    onResolve={handleResolve}
                    onClose={() => setDisputeId(null)}
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