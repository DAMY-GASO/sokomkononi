// ============================================================
// ModerationSection.jsx
// Uidhinishaji wa mali & matangazo — approve/reject listings.
//
// v2:
//  - State ya admin (`items`) ndiyo chanzo pekee. Haitegemei tena
//    localStorage ya public (useListings imeondolewa).
//  - Kila kichujio kinafetch kutoka API (pending / live / rejected / zote).
//  - Baada ya Approve/Reject, listing inabadilika kwenye UI mara moja
//    na kuhamia kwenye kichujio sahihi.
// ============================================================
import React, { useState, useEffect, useMemo } from "react";
import { CheckCircle, XCircle, MoreVertical, Loader2 } from "lucide-react";
import { COLORS } from "../shared/constants.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import StatusBadge from "../shared/StatusBadge.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import {
  fetchPendingListingsAsync,
  fetchListingsByStatusAsync,
  approveListingAsync,
  rejectListingAsync,
} from "../../../../config/listingsStore.js";

// Kichujio -> statuses zinazohitajika kutoka API
const FILTER_SOURCES = {
  in_review: ["in_review"],
  live: ["live"],
  rejected: ["rejected"],
  zote: ["in_review", "live", "rejected"],
};

function fetchByStatus(status) {
  return status === "in_review"
    ? fetchPendingListingsAsync()
    : fetchListingsByStatusAsync(status);
}

export default function ModerationSection() {
  const { lang } = useLanguage();
  // items: { [id]: listing } — chanzo pekee cha data kwenye admin UI
  const [items, setItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("in_review");
  const [busy, setBusy] = useState({});
  const [error, setError] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);
  const formatTZS = (amount) =>
    "TZS " + Math.round(amount || 0).toLocaleString("en-US");

  const patchItem = (id, patch) =>
    setItems((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], ...patch } } : prev));

  // ── Fetch kwa kila kichujio ─────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    const sources = FILTER_SOURCES[statusFilter] || [];
    Promise.all(sources.map(fetchByStatus)).then((results) => {
      if (cancelled) return;

      const okResults = results.filter((r) => r.ok);
      const fetched = okResults.flatMap((r) => r.listings || []);

      if (fetched.length) {
        setItems((prev) => {
          const next = { ...prev };
          fetched.forEach((l) => {
            next[l.id] = { ...prev[l.id], ...l };
          });
          return next;
        });
      }

      if (okResults.length === 0) {
        const firstErr = results.find((r) => !r.ok)?.error;
        console.warn("[ModerationSection] fetch failed:", firstErr);
        setError(
          firstErr?.message ||
            t("Imeshindwa kupakia listings.", "Failed to load listings.")
        );
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // ── Chuja + panga (mpya juu) ────────────────────────────────
  const filtered = useMemo(() => {
    const all = Object.values(items);
    const list =
      statusFilter === "zote" ? all : all.filter((l) => l.status === statusFilter);
    return list.sort(
      (a, b) => new Date(b.postedAt || 0).getTime() - new Date(a.postedAt || 0).getTime()
    );
  }, [items, statusFilter]);

  const filters = [
    { key: "in_review", label: { sw: "Zinasubiri", en: "Pending" } },
    { key: "live", label: { sw: "Zimeidhinishwa", en: "Approved" } },
    { key: "rejected", label: { sw: "Zimekataliwa", en: "Rejected" } },
    { key: "zote", label: { sw: "Zote", en: "All" } },
  ];

  const clearBusy = (listingId) =>
    setBusy((b) => {
      const n = { ...b };
      delete n[listingId];
      return n;
    });

  const handleApprove = async (listingId) => {
    if (busy[listingId]) return;
    setBusy((b) => ({ ...b, [listingId]: "approve" }));
    setError("");
    const res = await approveListingAsync(listingId);
    clearBusy(listingId);
    if (res.ok) {
      patchItem(listingId, {
        status: "live",
        approvedAt: new Date().toISOString(),
        rejectionReason: "",
      });
    } else {
      setError(
        res.error?.message ||
          t("Imeshindwa kuidhinisha listing.", "Failed to approve listing.")
      );
    }
  };

  const handleReject = async (listingId) => {
    if (busy[listingId]) return;
    const reason = window.prompt(
      t("Sababu ya kukataa (hiari):", "Reason for rejection (optional):")
    );
    if (reason === null) return;
    const cleanReason = reason.trim();
    setBusy((b) => ({ ...b, [listingId]: "reject" }));
    setError("");
    const res = await rejectListingAsync(listingId, cleanReason);
    clearBusy(listingId);
    if (res.ok) {
      patchItem(listingId, {
        status: "rejected",
        rejectionReason: cleanReason,
        rejectedAt: new Date().toISOString(),
      });
    } else {
      setError(
        res.error?.message ||
          t("Imeshindwa kukataa listing.", "Failed to reject listing.")
      );
    }
  };

  // Function ya kawaida (si component) — inazuia remount kila render
  const renderActions = (listing, fullWidth = false) => {
    const isBusy = !!busy[listing.id];
    const currentAction = busy[listing.id];
    if (listing.status === "in_review") {
      return (
        <div className={`flex gap-2 ${fullWidth ? "w-full" : "justify-end"}`}>
          <button
            onClick={() => handleApprove(listing.id)}
            disabled={isBusy}
            style={{ color: COLORS.green }}
            className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed ${
              fullWidth ? "flex-1" : ""
            }`}
          >
            {currentAction === "approve" ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <CheckCircle size={13} />
            )}
            {t("Idhinisha", "Approve")}
          </button>
          <button
            onClick={() => handleReject(listing.id)}
            disabled={isBusy}
            style={{ color: COLORS.rust }}
            className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed ${
              fullWidth ? "flex-1" : ""
            }`}
          >
            {currentAction === "reject" ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <XCircle size={13} />
            )}
            {t("Kataa", "Reject")}
          </button>
        </div>
      );
    }
    return (
      <div className="flex justify-end">
        <button className="text-muted hover:text-secondary p-1">
          <MoreVertical size={16} />
        </button>
      </div>
    );
  };

  const emptyText = t("Hakuna mali katika kundi hili", "No listings in this group");

  return (
    <>
      <SectionHeader
        title={t("Uidhinishaji wa Mali & Matangazo", "Listing & Ads Moderation")}
        subtitle={t(
          "Idhinisha au kataa mali kabla hazijachapishwa",
          "Approve or reject listings before they are published"
        )}
      />

      {error && (
        <div
          style={{ background: "rgba(193,80,46,0.1)", color: COLORS.rust }}
          className="text-xs font-semibold px-3 py-2 rounded-lg mb-4"
        >
          {error}
        </div>
      )}

      <div className="flex justify-center gap-2 mb-4 overflow-x-auto pb-2 w-full">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            style={{
              background: statusFilter === f.key ? COLORS.night : "white",
              color: statusFilter === f.key ? COLORS.sand : "var(--text-primary)",
              borderColor: COLORS.sandLine,
            }}
            className="text-xs font-semibold px-3.5 py-1.5 rounded-full border whitespace-nowrap shrink-0"
          >
            {f.label[lang]}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8 text-muted text-sm gap-2">
          <Loader2 size={16} className="animate-spin" />
          {t("Inapakia...", "Loading...")}
        </div>
      )}

      {!loading && (
        <>
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
                      Category
                    </th>
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">
                      {t("Muuzaji", "Seller")}
                    </th>
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">
                      {t("Bei", "Price")}
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
                  {filtered.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 text-sm font-medium text-primary">
                        {l.title}
                        {l.status === "rejected" && l.rejectionReason && (
                          <p
                            className="text-xs font-normal mt-0.5"
                            style={{ color: COLORS.rust }}
                          >
                            {l.rejectionReason}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-sm text-secondary">{l.category}</td>
                      <td className="px-5 py-3 text-sm text-secondary">
                        {l.seller || l.seller_name}
                      </td>
                      <td
                        className="px-5 py-3 text-sm font-semibold"
                        style={{ color: COLORS.rust }}
                      >
                        {formatTZS(l.price)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={l.status} lang={lang} />
                      </td>
                      <td className="px-5 py-3 text-right">{renderActions(l)}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-8 text-center text-sm text-muted"
                      >
                        {emptyText}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE — CARD LIST */}
          <div className="sm:hidden flex flex-col gap-3">
            {filtered.map((l) => (
              <div
                key={l.id}
                className="bg-white rounded-xl border border-gray-100 p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-primary line-clamp-2">
                      {l.title}
                    </p>
                    <p className="text-xs text-secondary mt-0.5 truncate">
                      {l.category}
                    </p>
                    {l.status === "rejected" && l.rejectionReason && (
                      <p
                        className="text-xs mt-1 line-clamp-2"
                        style={{ color: COLORS.rust }}
                      >
                        {l.rejectionReason}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={l.status} lang={lang} />
                </div>
                <div className="flex items-center justify-between gap-3 mb-3 text-xs">
                  <span className="text-secondary truncate min-w-0">
                    {t("Muuzaji:", "Seller:")}{" "}
                    <span className="font-medium text-primary">
                      {l.seller || l.seller_name}
                    </span>
                  </span>
                  <span
                    className="font-semibold shrink-0"
                    style={{ color: COLORS.rust }}
                  >
                    {formatTZS(l.price)}
                  </span>
                </div>
                {renderActions(l, true)}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-muted">
                {emptyText}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
