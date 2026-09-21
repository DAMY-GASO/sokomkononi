// ============================================================
// ModerationSection.jsx
// Uidhinishaji wa mali & matangazo — approve/reject listings.
// FIXED: fetches pending listings from API on mount.
// ============================================================
import React, { useState, useEffect, useMemo } from "react";
import { CheckCircle, XCircle, MoreVertical, Loader2 } from "lucide-react";
import { COLORS } from "../shared/constants.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import StatusBadge from "../shared/StatusBadge.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import {
  useListings,
  fetchPendingListingsAsync,
  approveListingAsync,
  rejectListingAsync,
} from "../../../../config/listingsStore.js";

export default function ModerationSection() {
  const { lang } = useLanguage();
  const storeListings = useListings();
  const [pendingListings, setPendingListings] = useState([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [statusFilter, setStatusFilter] = useState("in_review");
  const [busy, setBusy] = useState({});
  const [error, setError] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);
  const formatTZS = (amount) =>
    "TZS " + Math.round(amount || 0).toLocaleString("en-US");

  // ── Fetch pending listings from API ──────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoadingPending(true);
    fetchPendingListingsAsync().then((res) => {
      if (cancelled) return;
      if (res.ok) setPendingListings(res.listings || []);
      setLoadingPending(false);
    });
    return () => { cancelled = true; };
  }, []);

  // ── Merge store + fetched (deduped by id) ────────────────────
  const allListings = useMemo(() => {
    const map = new Map();
    [...storeListings, ...pendingListings].forEach((l) => map.set(l.id, l));
    return Array.from(map.values());
  }, [storeListings, pendingListings]);

  const filtered = useMemo(() => {
    if (statusFilter === "zote") return allListings;
    return allListings.filter((l) => l.status === statusFilter);
  }, [allListings, statusFilter]);

  const filters = [
    { key: "in_review", label: { sw: "Zinasubiri", en: "Pending" } },
    { key: "live", label: { sw: "Zimeidhinishwa", en: "Approved" } },
    { key: "rejected", label: { sw: "Zimekataliwa", en: "Rejected" } },
    { key: "zote", label: { sw: "Zote", en: "All" } },
  ];

  const handleApprove = async (listingId) => {
    if (busy[listingId]) return;
    setBusy((b) => ({ ...b, [listingId]: "approve" }));
    setError("");
    const res = await approveListingAsync(listingId);
    setBusy((b) => { const n = { ...b }; delete n[listingId]; return n; });
    if (!res.ok) {
      setError(res.error?.message || t("Imeshindwa kuidhinisha listing.", "Failed to approve listing."));
    }
  };

  const handleReject = async (listingId) => {
    if (busy[listingId]) return;
    const reason = window.prompt(t("Sababu ya kukataa (hiari):", "Reason for rejection (optional):"));
    if (reason === null) return;
    setBusy((b) => ({ ...b, [listingId]: "reject" }));
    setError("");
    const res = await rejectListingAsync(listingId, reason.trim());
    setBusy((b) => { const n = { ...b }; delete n[listingId]; return n; });
    if (!res.ok) {
      setError(res.error?.message || t("Imeshindwa kukataa listing.", "Failed to reject listing."));
    }
  };

  const ActionButtons = ({ listing, fullWidth = false }) => {
    const isBusy = !!busy[listing.id];
    const currentAction = busy[listing.id];
    if (listing.status === "in_review") {
      return (
        <div className={`flex gap-2 ${fullWidth ? "w-full" : "justify-end"}`}>
          <button onClick={() => handleApprove(listing.id)} disabled={isBusy}
            style={{ color: COLORS.green }}
            className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed ${fullWidth ? "flex-1" : ""}`}>
            {currentAction === "approve" ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
            {t("Idhinisha", "Approve")}
          </button>
          <button onClick={() => handleReject(listing.id)} disabled={isBusy}
            style={{ color: COLORS.rust }}
            className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed ${fullWidth ? "flex-1" : ""}`}>
            {currentAction === "reject" ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
            {t("Kataa", "Reject")}
          </button>
        </div>
      );
    }
    return <div className={fullWidth ? "flex justify-end" : "flex justify-end"}>
      <button className="text-muted hover:text-secondary p-1"><MoreVertical size={16} /></button>
    </div>;
  };

  return (
    <>
      <SectionHeader
        title={t("Uidhinishaji wa Mali & Matangazo", "Listing & Ads Moderation")}
        subtitle={t("Idhinisha au kataa mali kabla hazijachapishwa", "Approve or reject listings before they are published")}
      />
      {error && (
        <div style={{ background: "rgba(193,80,46,0.1)", color: COLORS.rust }}
          className="text-xs font-semibold px-3 py-2 rounded-lg mb-4">{error}</div>
      )}
      <div className="flex justify-center gap-2 mb-4 overflow-x-auto pb-2 w-full">
        {filters.map((f) => (
          <button key={f.key} onClick={() => setStatusFilter(f.key)}
            style={{
              background: statusFilter === f.key ? COLORS.night : "white",
              color: statusFilter === f.key ? COLORS.sand : "var(--text-primary)",
              borderColor: COLORS.sandLine,
            }}
            className="text-xs font-semibold px-3.5 py-1.5 rounded-full border whitespace-nowrap shrink-0">
            {f.label[lang]}
          </button>
        ))}
      </div>

      {loadingPending && (
        <div className="flex items-center justify-center py-8 text-muted text-sm gap-2">
          <Loader2 size={16} className="animate-spin" />
          {t("Inapakia...", "Loading...")}
        </div>
      )}

      {!loadingPending && (
        <>
          {/* DESKTOP — TABLE */}
          <div className="hidden sm:block bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50"><tr>
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">{t("Mali", "Listing")}</th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">Category</th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">{t("Muuzaji", "Seller")}</th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">{t("Bei", "Price")}</th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">Status</th>
                  <th className="px-5 py-2.5 text-right text-xs font-medium text-secondary uppercase">{t("Kitendo", "Action")}</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 text-sm font-medium text-primary">{l.title}</td>
                      <td className="px-5 py-3 text-sm text-secondary">{l.category}</td>
                      <td className="px-5 py-3 text-sm text-secondary">{l.seller || l.seller_name}</td>
                      <td className="px-5 py-3 text-sm font-semibold" style={{ color: COLORS.rust }}>{formatTZS(l.price)}</td>
                      <td className="px-5 py-3"><StatusBadge status={l.status} lang={lang} /></td>
                      <td className="px-5 py-3 text-right"><ActionButtons listing={l} /></td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-muted">
                      {t("Hakuna mali katika kundi hili", "No listings in this group")}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE — CARD LIST */}
          <div className="sm:hidden flex flex-col gap-3">
            {filtered.map((l) => (
              <div key={l.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-primary line-clamp-2">{l.title}</p>
                    <p className="text-xs text-secondary mt-0.5 truncate">{l.category}</p>
                  </div>
                  <StatusBadge status={l.status} lang={lang} />
                </div>
                <div className="flex items-center justify-between gap-3 mb-3 text-xs">
                  <span className="text-secondary truncate min-w-0">
                    {t("Muuzaji:", "Seller:")} <span className="font-medium text-primary">{l.seller || l.seller_name}</span>
                  </span>
                  <span className="font-semibold shrink-0" style={{ color: COLORS.rust }}>{formatTZS(l.price)}</span>
                </div>
                <ActionButtons listing={l} fullWidth />
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-muted">
                {t("Hakuna mali katika kundi hili", "No listings in this group")}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}