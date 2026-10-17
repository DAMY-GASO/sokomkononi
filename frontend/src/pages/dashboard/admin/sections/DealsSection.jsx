// ============================================================
// DealsSection.jsx
// ============================================================
import React, { useState, useEffect, useRef } from "react";
import {
  Eye,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import { COLORS, timeAgo } from "../shared/constants.js";
import { getCategory } from "../../../../config/categoriesStore.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import StatusBadge from "../shared/StatusBadge.jsx";
import DealRoomViewer from "../components/DealDispute/DealRoomViewer.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import { useAuth } from "../../../../config/authStore.js";
import { hydrateUsersFromApi } from "../../../../config/usersStore.js";
import { hydrateListingsFromApi } from "../../../../config/listingsStore.js";
import {
  useDeals,
  hydrateDealsFromApi,
  fetchDealDetailAsync,
  fetchAdminDealsAsync,
} from "../../../../config/dealsStore.js";
import {
  fetchDealRoomDetailAsync,
} from "../../../../config/transactionsStore.js";

// ============================================================
const PAGE_SIZE = 20;

const STATUS_FILTERS = [
  { key: "", label: { sw: "Zote", en: "All" } },
  { key: "NEGOTIATING", label: { sw: "Inajadiliwa", en: "Negotiating" } },
  { key: "ACCEPTED", label: { sw: "Imekubaliwa", en: "Accepted" } },
  { key: "RESERVED", label: { sw: "Imehifadhiwa", en: "Reserved" } },
  { key: "COMPLETED", label: { sw: "Imekamilika", en: "Completed" } },
  { key: "CANCELLED", label: { sw: "Imeghairiwa", en: "Cancelled" } },
];

export default function DealsSection() {
  const { lang } = useLanguage();
  const { user } = useAuth();

  // Cleanup
  // Pre-hydrate users + listings
  useEffect(() => {
    hydrateUsersFromApi().catch(() => {});
    hydrateListingsFromApi().catch(() => {});
  }, []);

  // ── Admin paginated state ────────────────────────────────
  const [deals, setDeals] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [expandedId, setExpandedId] = useState(null);
  const [dealRooms, setDealRooms] = useState({});
  const [loadingRoom, setLoadingRoom] = useState({});
  const inflightRoomRef = useRef(new Map());
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const t = (sw, en) => (lang === "sw" ? sw : en);

  // ── Fetch admin deals (paginated) ────────────────────────
  const loadDeals = async (targetPage = page, opts = {}) => {
    if (opts.silent) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const res = await fetchAdminDealsAsync({
        page: targetPage,
        pageSize: PAGE_SIZE,
        status: statusFilter,
        search: query.trim(),
      });
      if (res.ok) {
        setDeals(res.deals);
        setTotal(res.total);
        setPage(targetPage);
      } else {
        setError(
          res.error?.message ||
            t("Imeshindwa kupakia deals.", "Failed to load deals.")
        );
      }
    } catch (err) {
      setError(
        err?.message || t("Imeshindwa kupakia deals.", "Failed to load deals.")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Reload on filter/search change
  useEffect(() => {
    setPage(1);
    setExpandedId(null);
    loadDeals(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, query]);

  // Enrich deals zinazokosekana data
  const enrichedRef = useRef(new Set());
  const enrichmentAttemptsRef = useRef(new Map());
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

      const attempts = enrichmentAttemptsRef.current.get(d.id) || 0;
      if (attempts >= 3) return;
      enrichmentAttemptsRef.current.set(d.id, attempts + 1);
      enrichedRef.current.add(d.id);

      fetchAdminDealDetailAsync(d.id).then((res) => {
        if (res.ok && res.deal) {
          setDeals((prev) => prev.map((item) => (item.id === d.id ? { ...item, ...res.deal } : item)));
        }
      }).catch((err) => {
        console.warn("[DealsSection] enrich failed for", d.id, err);
      });
    });
  }, [deals, user?.id]);

  const handleRefresh = async () => {
    if (refreshing) return;
    setDealRooms({});
    await loadDeals(page, { silent: true });
  };

  // ── Display helpers ──────────────────────────────────────
  const displayDealAmount = (d) => {
    const amt =
      d?.currentOffer > 0 ? d.currentOffer :
      d?.askingPrice > 0 ? d.askingPrice : 0;
    return amt > 0 ? "TZS " + Math.round(amt).toLocaleString("en-US") : "—";
  };
  const displayDealName = (name, id) =>
    name || (id != null ? `#${id}` : "—");
  const displayListing = (d) =>
    d?.listingTitle ||
    (d?.listingId != null ? `#${d.listingId}` : null) ||
    (d?.id != null ? `#${d.id}` : "—");
  const displayCategory = (d) => {
    if (!d?.category) return "—";
    const cat = getCategory(d.category);
    return cat?.label?.[lang] || cat?.label?.sw || d.category;
  };

  // ── Load deal room data (messages, payment proof) ────────
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
        };
        setDealRooms((prev) => ({ ...prev, [dealId]: entry }));
        return entry;
      }
      setError(
        res.error?.message ||
          t("Imeshindwa kupakia chumba cha makubaliano.", "Failed to load deal room.")
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
            title={t("Vyumba vya Majadiliano", "Deal Rooms")}
            subtitle={t(
              "Fuatilia makubaliano ya watumiaji wote. Unaweza kuona kilichojiri bila kuandika.",
              "Monitor all users' deals. You can view activity without writing."
            )}
          />
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
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

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4 w-full min-w-0">
        <div className="relative flex-1 min-w-0">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(
              "Tafuta mali, mnunuzi, muuzaji...",
              "Search listing, buyer, seller..."
            )}
            className="smk-inline-search w-full rounded-lg border border-gray-200 bg-white pl-3 pr-16 py-2 text-xs outline-none focus:outline-none focus-visible:outline-none"
            style={{ WebkitAppearance: "none" }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-9 top-1/2 -translate-y-1/2 text-muted hover:text-secondary"
              aria-label={t("Futa", "Clear")}
            >
              <X size={13} />
            </button>
          )}
          <Search size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0">
          {STATUS_FILTERS.map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key || "all"}
                onClick={() => setStatusFilter(tab.key)}
                style={{
                  background: isActive ? COLORS.night : "white",
                  color: isActive ? COLORS.sand : "var(--text-primary)",
                  borderColor: COLORS.sandLine,
                }}
                className="text-[11px] font-semibold px-3 py-2 rounded-full border whitespace-nowrap shrink-0"
              >
                {tab.label?.[lang] || tab.label?.sw}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading */}
      {loading && deals.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-8 flex items-center justify-center gap-2">
          <Loader2 size={18} className="animate-spin text-muted" />
          <span className="text-xs text-muted">
            {t("Inapakia deals...", "Loading deals...")}
          </span>
        </div>
      )}

      {/* DESKTOP — TABLE */}
      {deals.length > 0 && (
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
                  const isExpanded = expandedId === d.id;
                  return (
                    <React.Fragment key={d.id}>
                      <tr className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3 text-sm font-medium text-primary">
                          <span className="truncate">{displayListing(d)}</span>
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
                            <div>{displayDealName(d.sellerName, d.sellerId)}</div>
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
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MOBILE — CARD LIST */}
      {deals.length > 0 && (
        <div className="sm:hidden flex flex-col gap-3">
          {deals.map((d) => {
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
        </div>
      )}

      {/* Empty */}
      {!loading && deals.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <p className="text-sm text-muted">
            {query || statusFilter
              ? t("Hakuna matokeo", "No results")
              : t("Hakuna deals", "No deals")}
          </p>
        </div>
      )}

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between gap-3 mt-4 flex-wrap">
          <p className="text-xs text-secondary">
            {t("Ukurasa", "Page")} {page} / {totalPages} ·{" "}
            {t("Jumla", "Total")}: {total}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => loadDeals(page - 1)}
              disabled={page <= 1 || loading}
              style={{ borderColor: COLORS.sandLine }}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={13} />
              {t("Nyuma", "Prev")}
            </button>
            <button
              onClick={() => loadDeals(page + 1)}
              disabled={page >= totalPages || loading}
              style={{ borderColor: COLORS.sandLine }}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t("Mbele", "Next")}
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}