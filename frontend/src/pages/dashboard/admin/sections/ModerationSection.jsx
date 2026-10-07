// ============================================================
// ModerationSection.jsx — approve / reject / disapprove / delete
// FIX: approved listings no longer linger in "All" as Pending.
// ============================================================
import React, { useState, useEffect, useMemo } from "react";
import { CheckCircle, XCircle, MoreVertical, Loader2, Trash2, RotateCcw } from "lucide-react";
import { COLORS } from "../shared/constants.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import StatusBadge from "../shared/StatusBadge.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import {
  useModerationQueue,
  hydrateModerationQueueFromApi,
  approveListingFromQueueAsync,
  rejectListingFromQueueAsync,
  disapproveListingAsync,
  deleteListingFromModerationAsync,
} from "../../../../config/moderationStore.js";
import { fetchListingsByStatusAsync } from "../../../../config/listingsStore.js";

export default function ModerationSection() {
  const { lang } = useLanguage();
  const queue = useModerationQueue({ hydrate: false });
  const [history, setHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("in_review");
  const [busy, setBusy] = useState({});
  const [error, setError] = useState("");
  const [rejectModal, setRejectModal] = useState(null);
  const [disapproveModal, setDisapproveModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  // Track decisions made in this session so an approved/rejected id never
  // re-appears as Pending in the "All" tab.
  const [decided, setDecided] = useState({}); // { [id]: "live" | "rejected" | "deleted" }

  const t = (sw, en) => (lang === "sw" ? sw : en);
  const formatTZS = (amount) =>
    "TZS " + Math.round(amount || 0).toLocaleString("en-US");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    const wantPending = statusFilter === "in_review" || statusFilter === "zote";
    const wantLive = statusFilter === "live" || statusFilter === "zote";
    const wantRejected = statusFilter === "rejected" || statusFilter === "zote";

    const tasks = [];
    if (wantPending) tasks.push(hydrateModerationQueueFromApi());
    if (wantLive) tasks.push(fetchListingsByStatusAsync("live"));
    if (wantRejected) tasks.push(fetchListingsByStatusAsync("rejected"));

    Promise.all(tasks).then((results) => {
      if (cancelled) return;
      const fetched = results.flatMap((r) => r?.listings || []);
      if (fetched.length) {
        setHistory((prev) => {
          const next = { ...prev };
          fetched.forEach((l) => {
            if (!l || l.id == null) return;
            next[String(l.id)] = { ...(prev[String(l.id)] || {}), ...l };
          });
          return next;
        });
      }
      const anyOk = results.some((r) => r?.ok);
      const hasLocalData = fetched.length > 0;
      if (!anyOk && !hasLocalData && statusFilter !== "in_review") {
        setError(
          t("Imeshindwa kupakia orodha kwa kichujio hiki.",
            "Could not load listings for this filter.")
        );
      } else {
        setError("");
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, lang]);

  const filtered = useMemo(() => {
    // Pending = anything in queue that we haven't already decided.
    const pending = queue
      .filter((l) => !decided[String(l.id)])
      .map((l) => ({ ...l, status: "in_review" }));

    const hist = Object.values(history)
      .filter((l) => !decided[String(l.id)])
      .filter((l) => l.status !== "in_review");

    // Include decided entries as history (so they still show under their new status).
    const decidedEntries = Object.entries(decided)
      .map(([id, status]) => {
        const fromHist = history[id];
        if (!fromHist) return null;
        return { ...fromHist, status };
      })
      .filter(Boolean);

    let list;
    if (statusFilter === "in_review") {
      list = pending;
    } else if (statusFilter === "zote") {
      const map = new Map();
      // Prefer hist/decided over pending — pending should NOT overwrite.
      hist.forEach((l) => map.set(String(l.id), l));
      decidedEntries.forEach((l) => map.set(String(l.id), l));
      pending.forEach((l) => {
        const k = String(l.id);
        if (!map.has(k)) map.set(k, l);
      });
      list = Array.from(map.values());
    } else {
      const base = hist.filter((l) => l.status === statusFilter);
      const dec = decidedEntries.filter((l) => l.status === statusFilter);
      list = [...base, ...dec];
    }

    return [...list].sort(
      (a, b) => new Date(b.postedAt || 0).getTime() - new Date(a.postedAt || 0).getTime()
    );
  }, [queue, history, decided, statusFilter]);

  const filters = [
    { key: "in_review", label: { sw: "Zinasubiri", en: "Pending" }, count: queue.filter((l) => !decided[String(l.id)]).length },
    { key: "live", label: { sw: "Zimeidhinishwa", en: "Approved" } },
    { key: "rejected", label: { sw: "Zimekataliwa", en: "Rejected" } },
    { key: "zote", label: { sw: "Zote", en: "All" } },
  ];

  const clearBusy = (id) =>
    setBusy((b) => { const n = { ...b }; delete n[id]; return n; });

  const markDecided = (id, status) =>
    setDecided((d) => ({ ...d, [String(id)]: status }));

  const unmarkDecided = (id) =>
    setDecided((d) => { const n = { ...d }; delete n[String(id)]; return n; });

  const addToHistory = (listing) => {
    if (!listing || listing.id == null) return;
    setHistory((prev) => ({ ...prev, [String(listing.id)]: listing }));
  };

  const removeFromHistory = (id) => {
    setHistory((prev) => { const n = { ...prev }; delete n[String(id)]; return n; });
  };

  const handleApprove = async (listingId) => {
    if (busy[listingId]) return;
    const snapshot = queue.find((q) => String(q.id) === String(listingId));
    setBusy((b) => ({ ...b, [listingId]: "approve" }));
    setError("");
    const res = await approveListingFromQueueAsync(listingId);
    clearBusy(listingId);
    if (res.ok) {
      markDecided(listingId, "live");
      addToHistory({
        ...(snapshot || {}),
        ...(res.listing || {}),
        id: listingId,
        status: "live",
        approvedAt: new Date().toISOString(),
      });
    } else {
      setError(res.error?.message || t("Imeshindwa kuidhinisha listing.", "Failed to approve listing."));
    }
  };

  const openRejectModal = (id) => {
    if (busy[id]) return;
    setError("");
    setRejectModal({ listingId: id, reason: "" });
  };
  const submitReject = async () => {
    if (!rejectModal) return;
    const reason = (rejectModal.reason || "").trim();
    if (!reason) {
      setError(t("Sababu ya kukataa inahitajika.", "A rejection reason is required."));
      return;
    }
    const { listingId } = rejectModal;
    setBusy((b) => ({ ...b, [listingId]: "reject" }));
    setError("");
    const snapshot = queue.find((q) => String(q.id) === String(listingId));
    const res = await rejectListingFromQueueAsync(listingId, reason);
    clearBusy(listingId);
    setRejectModal(null);
    if (res.ok) {
      markDecided(listingId, "rejected");
      addToHistory({
        ...(snapshot || {}),
        ...(res.listing || {}),
        id: listingId,
        status: "rejected",
        rejectionReason: reason,
        rejectedAt: new Date().toISOString(),
      });
    } else {
      setError(res.error?.message || t("Imeshindwa kukataa listing.", "Failed to reject listing."));
    }
  };

  const openDisapproveModal = (id) => {
    if (busy[id]) return;
    setError("");
    setDisapproveModal({ listingId: id, reason: "" });
  };
  const submitDisapprove = async () => {
    if (!disapproveModal) return;
    const reason = (disapproveModal.reason || "").trim();
    if (!reason) { setError(t("Sababu inahitajika.", "Reason is required.")); return; }
    const { listingId } = disapproveModal;
    setBusy((b) => ({ ...b, [listingId]: "disapprove" }));
    setError("");
    const res = await disapproveListingAsync(listingId, reason);
    clearBusy(listingId);
    setDisapproveModal(null);
    if (res.ok) {
      markDecided(listingId, "rejected");
      setHistory((prev) => {
        const key = String(listingId);
        const existing = prev[key] || {};
        return { ...prev, [key]: { ...existing, status: "rejected", rejectionReason: reason } };
      });
    } else {
      setError(res.error?.message || t("Imeshindwa kudissapprove listing.", "Failed to disapprove listing."));
    }
  };

  const openDeleteModal = (id) => {
    if (busy[id]) return;
    setError("");
    setDeleteModal({ listingId: id, reason: "" });
  };
  const submitDelete = async () => {
    if (!deleteModal) return;
    const reason = (deleteModal.reason || "").trim();
    const { listingId } = deleteModal;
    setBusy((b) => ({ ...b, [listingId]: "delete" }));
    setError("");
    const res = await deleteListingFromModerationAsync(listingId, reason);
    clearBusy(listingId);
    setDeleteModal(null);
    if (res.ok) {
      markDecided(listingId, "deleted");
      removeFromHistory(listingId);
    } else {
      setError(res.error?.message || t("Imeshindwa kufuta listing.", "Failed to delete listing."));
    }
  };

  const renderActions = (listing, fullWidth = false) => {
    const isBusy = !!busy[listing.id];
    const currentAction = busy[listing.id];

    if (listing.status === "in_review") {
      return (
        <div className={`flex gap-2 ${fullWidth ? "w-full" : "justify-end"}`}>
          <button onClick={() => handleApprove(listing.id)} disabled={isBusy}
            style={{ color: COLORS.green }}
            className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-green-50 disabled:opacity-50 ${fullWidth ? "flex-1" : ""}`}>
            {currentAction === "approve" ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
            {t("Idhinisha", "Approve")}
          </button>
          <button onClick={() => openRejectModal(listing.id)} disabled={isBusy}
            style={{ color: COLORS.rust }}
            className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-red-50 disabled:opacity-50 ${fullWidth ? "flex-1" : ""}`}>
            {currentAction === "reject" ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
            {t("Kataa", "Reject")}
          </button>
        </div>
      );
    }

    if (listing.status === "live") {
      return (
        <div className={`flex gap-2 ${fullWidth ? "w-full" : "justify-end"}`}>
          <button onClick={() => openDisapproveModal(listing.id)} disabled={isBusy}
            style={{ color: COLORS.rust }}
            className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-red-50 disabled:opacity-50 ${fullWidth ? "flex-1" : ""}`}>
            {currentAction === "disapprove" ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
            {t("Disapprove", "Disapprove")}
          </button>
          <button onClick={() => openDeleteModal(listing.id)} disabled={isBusy}
            style={{ color: "#DC2626", borderColor: "rgba(220,38,38,0.4)" }}
            className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border hover:bg-red-50 disabled:opacity-50 ${fullWidth ? "flex-1" : ""}`}>
            {currentAction === "delete" ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            {t("Futa", "Delete")}
          </button>
        </div>
      );
    }

    if (listing.status === "rejected") {
      return (
        <div className={`flex gap-2 ${fullWidth ? "w-full" : "justify-end"}`}>
          <button onClick={() => { unmarkDecided(listing.id); handleApprove(listing.id); }} disabled={isBusy}
            style={{ color: COLORS.green }}
            className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-green-50 disabled:opacity-50 ${fullWidth ? "flex-1" : ""}`}>
            {currentAction === "approve" ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
            {t("Idhinisha", "Approve")}
          </button>
          <button onClick={() => openDeleteModal(listing.id)} disabled={isBusy}
            style={{ color: "#DC2626", borderColor: "rgba(220,38,38,0.4)" }}
            className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border hover:bg-red-50 disabled:opacity-50 ${fullWidth ? "flex-1" : ""}`}>
            {currentAction === "delete" ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            {t("Futa", "Delete")}
          </button>
        </div>
      );
    }

    return (
      <div className="flex justify-end">
        <button className="text-muted hover:text-secondary p-1"><MoreVertical size={16} /></button>
      </div>
    );
  };

  const emptyText = t("Hakuna mali katika kundi hili", "No listings in this group");

  return (
    <>
      <SectionHeader
        title={t("Uidhinishaji wa Mali & Matangazo", "Listing & Ads Moderation")}
        subtitle={t(
          "Idhinisha, kataa, disapprove, au futa mali kabla hazijachapishwa",
          "Approve, reject, disapprove, or delete listings before publishing"
        )}
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
            {f.label[lang]}{f.count > 0 ? ` (${f.count})` : ""}
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
          <div className="hidden sm:block bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">{t("Mali", "Listing")}</th>
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">Category</th>
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">{t("Muuzaji", "Seller")}</th>
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">{t("Bei", "Price")}</th>
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">Status</th>
                    <th className="px-5 py-2.5 text-right text-xs font-medium text-secondary uppercase">{t("Vitendo", "Actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 text-sm font-medium text-primary">
                        {l.title}
                        {l.status === "rejected" && l.rejectionReason && (
                          <p className="text-xs font-normal mt-0.5" style={{ color: COLORS.rust }}>{l.rejectionReason}</p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-sm text-secondary">{l.category}</td>
                      <td className="px-5 py-3 text-sm text-secondary">{l.seller || l.seller_name}</td>
                      <td className="px-5 py-3 text-sm font-semibold" style={{ color: COLORS.rust }}>{formatTZS(l.price)}</td>
                      <td className="px-5 py-3"><StatusBadge status={l.status} lang={lang} /></td>
                      <td className="px-5 py-3 text-right">{renderActions(l)}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-muted">{emptyText}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="sm:hidden flex flex-col gap-3">
            {filtered.map((l) => (
              <div key={l.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-primary line-clamp-2">{l.title}</p>
                    <p className="text-xs text-secondary mt-0.5 truncate">{l.category}</p>
                    {l.status === "rejected" && l.rejectionReason && (
                      <p className="text-xs mt-1 line-clamp-2" style={{ color: COLORS.rust }}>{l.rejectionReason}</p>
                    )}
                  </div>
                  <StatusBadge status={l.status} lang={lang} />
                </div>
                <div className="flex items-center justify-between gap-3 mb-3 text-xs">
                  <span className="text-secondary truncate min-w-0">
                    {t("Muuzaji:", "Seller:")} <span className="font-medium text-primary">{l.seller || l.seller_name}</span>
                  </span>
                  <span className="font-semibold shrink-0" style={{ color: COLORS.rust }}>{formatTZS(l.price)}</span>
                </div>
                {renderActions(l, true)}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-muted">{emptyText}</div>
            )}
          </div>
        </>
      )}

      {/* REJECT MODAL */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-5">
            <h3 className="text-base font-semibold text-primary mb-2">{t("Kataa Listing", "Reject Listing")}</h3>
            <p className="text-xs text-secondary mb-3">{t("Sababu itatumwa kwa muuzaji. Inahitajika.", "The reason is sent to the seller. Required.")}</p>
            <textarea value={rejectModal.reason} onChange={(e) => setRejectModal((p) => ({ ...p, reason: e.target.value }))} rows={3} autoFocus
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none resize-none focus:border-[#C1502E] mb-3"
              placeholder={t("mfano: Picha hazitoshi, bei haijaeleweka", "e.g. Insufficient photos, unclear price")} />
            <div className="flex items-center gap-2">
              <button onClick={() => setRejectModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-secondary">{t("Ghairi", "Cancel")}</button>
              <button onClick={submitReject} disabled={!rejectModal.reason.trim()}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: COLORS.rust }}>{t("Kataa", "Reject")}</button>
            </div>
          </div>
        </div>
      )}

      {/* DISAPPROVE MODAL */}
      {disapproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(193,80,46,0.1)" }}>
                <RotateCcw size={18} color={COLORS.rust} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-primary">{t("Disapprove Listing", "Disapprove Listing")}</h3>
                <p className="text-xs text-secondary mt-0.5">{t("Rudisha kwenye kundi la Imekataliwa", "Move back to Rejected group")}</p>
              </div>
            </div>
            <textarea value={disapproveModal.reason} onChange={(e) => setDisapproveModal((p) => ({ ...p, reason: e.target.value }))} rows={3} autoFocus
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none resize-none focus:border-[#C1502E] mb-3"
              placeholder={t("mfano: Ilidhinishwa kimakosa, inahitaji mabadiliko", "e.g. Approved by mistake, needs corrections")} />
            <div className="flex items-center gap-2">
              <button onClick={() => setDisapproveModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-secondary">{t("Ghairi", "Cancel")}</button>
              <button onClick={submitDisapprove} disabled={!disapproveModal.reason.trim()}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: COLORS.rust }}>{t("Disapprove", "Disapprove")}</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(220,38,38,0.1)" }}>
                <Trash2 size={18} color="#DC2626" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-primary">{t("Futa Listing Kabisa?", "Delete Listing Permanently?")}</h3>
                <p className="text-xs text-secondary mt-0.5">{t("Hatua hii haiwezi kurudishwa", "This action cannot be undone")}</p>
              </div>
            </div>
            <textarea value={deleteModal.reason} onChange={(e) => setDeleteModal((p) => ({ ...p, reason: e.target.value }))} rows={3} autoFocus
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none resize-none focus:border-[#DC2626] mb-3"
              placeholder={t("mfano: Listing ya udanganyifu (scam)", "e.g. Scam listing")} />
            <div className="flex items-center gap-2">
              <button onClick={() => setDeleteModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-secondary">{t("Ghairi", "Cancel")}</button>
              <button onClick={submitDelete} className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "#DC2626" }}>{t("Futa Kabisa", "Delete Permanently")}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
