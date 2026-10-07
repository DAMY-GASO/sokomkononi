// ============================================================
// DealsSection.jsx — FIX: dispute panel loads messages;
// handleResolve passes transactionId correctly.
// ============================================================
import React, { useState, useEffect, useRef } from "react";
import { MoreVertical, Eye, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
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
  fetchDealDetailAsync,
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

  const enrichedRef = useRef(new Set());
  useEffect(() => {
    if (!user?.id) return;
    deals.forEach((d) => {
      const needsEnrich =
        !d.buyerName || !d.sellerName || !d.listingTitle ||
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
  const [disputeId, setDisputeId] = useState(null);
  const [busy, setBusy] = useState({});
  const [error, setError] = useState("");
  const [dealRooms, setDealRooms] = useState({});
  const [loadingRoom, setLoadingRoom] = useState({}); // { [id]: true }
  const [refreshing, setRefreshing] = useState(false);
  const inflightRoomRef = React.useRef(new Map());

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
      setError(res.error?.message || t("Imeshindwa kupakia deal room.", "Failed to load deal room."));
      return null;
    })();

    inflightRoomRef.current.set(dealId, promise);
    try { return await promise; } finally {
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
    if (expandedId === dealId) { setExpandedId(null); return; }
    setExpandedId(dealId);
    setDisputeId(null);
    setError("");
    await ensureRoomData(dealId);
  };

  const handleOpenDispute = async (deal) => {
    const dealId = deal.id;
    if (disputeId === dealId) { setDisputeId(null); return; }
    setDisputeId(dealId);
    setExpandedId(null);
    setError("");
    // Load room data (messages) for the dispute panel too.
    await ensureRoomData(dealId);
  };

  const handleResolve = async (dealId, payload) => {
    if (busy[dealId]) return;

    setBusy((b) => ({ ...b, [dealId]: true }));
    setError("");

    const deal = deals.find((d) => String(d.id) === String(dealId));

    // Find transaction: local store first, then backend fetch.
    let tx = getTransactionByDealRoom(deal?.dealRoomId || dealId) || getTransactionByDealRoom(dealId);
    if (!tx?.id && deal?.transactionId) {
      try {
        const fetched = await fetchTransactionDetailAsync(deal.transactionId);
        if (fetched?.ok && fetched.transaction?.id) tx = fetched.transaction;
      } catch (err) {
        console.warn("[DealsSection] tx fetch by id failed:", err);
      }
    }

    if (!tx?.id) {
      // No transaction exists for this deal yet. There is no backend route
      // to resolve a dispute without a transaction — ask an admin to have
      // the participants create one first.
      setBusy((b) => { const n = { ...b }; delete n[dealId]; return n; });
      setError(
        t(
          "Hakuna transaction iliyounganishwa na deal hii bado. Waombe wanunuzi/wauzaji kuanzisha transaction kwanza.",
          "There is no transaction linked to this deal yet. Have the participants create one first."
        )
      );
      return;
    }

    const res = await resolveDisputeAsync(dealId, {
      resolution: payload.action,
      note: payload.adminNote || "",
      transactionId: tx.id,
    });

    setBusy((b) => { const n = { ...b }; delete n[dealId]; return n; });
    if (res.ok) {
      setDisputeId(null);
      setExpandedId(null);
      setDealRooms((prev) => { const n = { ...prev }; delete n[dealId]; return n; });
    } else {
      setError(res.error?.message || t("Imeshindwa kutatua mgogoro.", "Failed to resolve dispute."));
    }
  };

  const ActionButtons = ({ deal, fullWidth = false }) => {
    const isDisputed = deal.status === "disputed";
    const isRoomOpen = expandedId === deal.id;
    const isDisputeOpen = disputeId === deal.id;
    const isBusy = !!busy[deal.id];
    const isLoading = !!loadingRoom[deal.id];

    if (isDisputed) {
      return (
        <div className={`flex gap-2 ${fullWidth ? "w-full" : "justify-end"} flex-wrap`}>
          <button onClick={() => handleViewRoom(deal)} disabled={isBusy || isLoading}
            style={{ borderColor: COLORS.sandLine, color: "var(--text-primary)" }}
            className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg border hover:bg-gray-50 transition-colors disabled:opacity-50 ${fullWidth ? "flex-1" : ""}`}>
            {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />}
            {isRoomOpen ? t("Funga", "Close") : t("Angalia Room", "View Room")}
          </button>
          <button onClick={() => handleOpenDispute(deal)} disabled={isBusy || isLoading}
            style={{ background: COLORS.gold, color: COLORS.night }}
            className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 ${fullWidth ? "flex-1" : ""}`}>
            <AlertTriangle size={13} />
            {isDisputeOpen ? t("Funga", "Close") : t("Kagua Mgogoro", "Review Dispute")}
          </button>
        </div>
      );
    }

    return (
      <div className={fullWidth ? "flex justify-end" : "flex justify-end"}>
        <button onClick={() => handleViewRoom(deal)} disabled={isBusy || isLoading}
          style={{ borderColor: COLORS.sandLine, color: "var(--text-primary)" }}
          className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg border hover:bg-gray-50 transition-colors disabled:opacity-50 ${fullWidth ? "w-full" : ""}`}>
          {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />}
          {isRoomOpen ? t("Funga", "Close") : t("Angalia Room", "View Room")}
        </button>
      </div>
    );
  };

  return (
    <>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <SectionHeader
            title={t("Deal Rooms & Utatuzi wa Migogoro", "Deal Rooms & Dispute Resolution")}
            subtitle={t("Fuatilia deals na utatue migogoro.", "Monitor deals and resolve disputes.")}
          />
        </div>
        <button onClick={handleRefresh} disabled={!user?.id || refreshing}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors shrink-0 disabled:opacity-50"
          style={{ borderColor: COLORS.sandLine, color: "var(--text-primary)", background: "white" }}>
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          <span className="hidden sm:inline">
            {refreshing ? t("Inasasisha...", "Refreshing...") : t("Sasisha", "Refresh")}
          </span>
        </button>
      </div>

      {error && (
        <div style={{ background: "rgba(193,80,46,0.1)", color: COLORS.rust }}
          className="text-xs font-semibold px-3 py-2 rounded-lg mb-4">{error}</div>
      )}

      <div className="hidden sm:block bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">{t("Mali", "Listing")}</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">{t("Mnunuzi", "Buyer")}</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">{t("Muuzaji", "Seller")}</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">{t("Kiasi", "Amount")}</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">Status</th>
                <th className="px-5 py-2.5 text-right text-xs font-medium text-secondary uppercase">{t("Kitendo", "Action")}</th>
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
                          <span className="truncate">{displayListing(d)}</span>
                          {isDisputed && (
                            <span style={{ background: `${COLORS.rust}15`, color: COLORS.rust }}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                              {t("MGOGORO", "DISPUTE")}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-secondary">{displayDealName(d.buyerName, d.buyerId)}</td>
                      <td className="px-5 py-3 text-sm text-secondary">{displayDealName(d.sellerName, d.sellerId)}</td>
                      <td className="px-5 py-3 text-sm font-semibold" style={{ color: COLORS.rust }}>
                        {displayDealAmount(d)}
                      </td>
                      <td className="px-5 py-3"><StatusBadge status={d.status} lang={lang} /></td>
                      <td className="px-5 py-3 text-right"><ActionButtons deal={d} /></td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} className="p-0">
                          <DealRoomViewer deal={d} roomData={dealRooms[d.id]}
                            loading={!!loadingRoom[d.id]}
                            onClose={() => setExpandedId(null)} lang={lang} />
                        </td>
                      </tr>
                    )}
                    {isDisputed && isDisputeOpen && (
                      <tr>
                        <td colSpan={6} className="p-0">
                          <DisputeReviewPanel deal={d} roomData={dealRooms[d.id]}
                            onResolve={handleResolve}
                            onClose={() => setDisputeId(null)} lang={lang} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {deals.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-muted">{t("Hakuna deals", "No deals")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sm:hidden flex flex-col gap-3">
        {deals.map((d) => {
          const isDisputed = d.status === "disputed";
          const isExpanded = expandedId === d.id;
          const isDisputeOpen = disputeId === d.id;
          return (
            <div key={d.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-primary line-clamp-2">{displayListing(d)}</p>
                    {isDisputed && (
                      <span style={{ background: `${COLORS.rust}15`, color: COLORS.rust }}
                        className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1">
                        {t("MGOGORO", "DISPUTE")}
                      </span>
                    )}
                  </div>
                  <div className="shrink-0"><StatusBadge status={d.status} lang={lang} /></div>
                </div>
                <div className="flex flex-col gap-0.5 text-xs text-secondary mb-2">
                  <span className="truncate">{t("Mnunuzi", "Buyer")}: <span className="font-medium text-primary">{displayDealName(d.buyerName, d.buyerId)}</span></span>
                  <span className="truncate">{t("Muuzaji", "Seller")}: <span className="font-medium text-primary">{displayDealName(d.sellerName, d.sellerId)}</span></span>
                </div>
                <p className="text-sm font-bold mb-3" style={{ color: COLORS.rust }}>
                  {displayDealAmount(d)}
                </p>
                <ActionButtons deal={d} fullWidth />
              </div>
              {isExpanded && (
                <div className="border-t border-gray-100">
                  <DealRoomViewer deal={d} roomData={dealRooms[d.id]} loading={!!loadingRoom[d.id]}
                    onClose={() => setExpandedId(null)} lang={lang} />
                </div>
              )}
              {isDisputed && isDisputeOpen && (
                <div className="border-t border-gray-100">
                  <DisputeReviewPanel deal={d} roomData={dealRooms[d.id]}
                    onResolve={handleResolve} onClose={() => setDisputeId(null)} lang={lang} />
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
