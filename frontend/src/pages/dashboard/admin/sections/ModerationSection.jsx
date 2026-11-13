// ============================================================
// ModerationSection.jsx
// Approve / Reject / Request Edit / Request Payment / Finalize
// ============================================================
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  CheckCircle, XCircle, MoreVertical, Loader2, Trash2, RotateCcw,
  Image, Pencil, Wallet, CheckCheck, ShoppingBag, Clock, ChevronLeft,
  Square, CheckSquare, X,
} from "lucide-react";
import { COLORS } from "../shared/constants.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import StatusBadge from "../shared/StatusBadge.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import {
  useModerationQueue,
  hydrateModerationQueueFromApi,
  approveListingFromQueueAsync,
  rejectListingFromQueueAsync,
  requestEditListingAsync,
  requestPaymentListingAsync,
  finalizeApprovalListingAsync,
  disapproveListingAsync,
  deleteListingFromModerationAsync,
  releaseReservationAsync,
  bulkRequestPaymentAsync,
  bulkRequestEditAsync,
  bulkFinalizeAsync,
  bulkRejectAsync,
  bulkDisapproveAsync,
  bulkDeleteAsync,
} from "../../../../config/moderationStore.js";
import { fetchListingsByStatusAsync } from "../../../../config/listingsStore.js";
import AdminListingImageManager from "../components/AdminListingImageManager.jsx";

// ============================================================
// Normalize status: PENDING_APPROVAL → pending_approval
// ============================================================
function normalizeStatus(s) {
  if (s == null) return "";
  return String(s).trim().toLowerCase();
}

// ============================================================
// Je, listing hii ni BURE (admin amezima fee)?
// ============================================================
function isListingFree(listing) {
  if (!listing) return false;
  const ps = String(listing.payment_status ?? listing.paymentStatus ?? "").toUpperCase();
  if (ps === "FREE") return true;
  if (listing.is_free === true || listing.isFree === true) return true;
  const raw = listing.fee_amount ?? listing.feeAmount;
  // null = ada haijaundwa/haijulikani (SI bure). Bure ni 0 kweli tu.
  return raw != null && raw !== "" && Number(raw) === 0;
}

// Ada haijawekwa kabisa (fee_amount = null) na hakuna payment_status ya kulipwa.
// Mfumo ukiwa na ada BURE, mali hizi zinatakiwa kuidhinishwa moja kwa moja
// (hakuna "Request Pay").
function isFeeUnset(listing) {
  if (!listing) return false;
  const raw = listing.fee_amount ?? listing.feeAmount;
  return raw == null || raw === "";
}

// Tabs zinazohitaji hatua ya admin — zinapata nukta nyekundu
const URGENT_TABS = ["pending_approval", "paid_pending_approval"];

// "in_review" (jina la zamani) = "pending_approval"
function statusOf(l) {
  const s = normalizeStatus(l?.status);
  return s === "in_review" ? "pending_approval" : s;
}

// ============================================================
// Reservation imeisha muda → mali inaonekana LIVE (bila badge ya Reserved).
// Backend inatuma `time_left_seconds` (sekunde zilizobaki, 0 = imeisha) kwa
// listings zenye status RESERVED. Ni snapshot ya wakati data ilipopakiwa
// (`_fetchedAt`), kwa hiyo tunahesabu upya kwa kutumia `now`.
// Hii ni fallback ya kuonyesha tu; backend (Celery) ndiyo inabadilisha DB.
// ============================================================
function isReservationExpired(l, now) {
  if (normalizeStatus(l?.status) !== "reserved") return false;
  const raw = l?.time_left_seconds ?? l?.timeLeftSeconds;
  if (raw == null || raw === "") return false; // hakuna kipimo cha muda
  const secs = Number(raw);
  if (Number.isNaN(secs)) return false;
  const fetchedAt = l?._fetchedAt || now;
  return secs - (now - fetchedAt) / 1000 <= 0;
}

// Statuses zote zinazopakiwa mara moja ili tabs ziwe na counts sahihi
const ALL_STATUS_FETCH = [
  "PENDING_APPROVAL",
  "PAID_PENDING_APPROVAL",
  "APPROVED_PENDING_PAYMENT",
  "NEEDS_EDIT",
  "LIVE",
  "REJECTED",
  "SOLD",
  "EXPIRED",
  "RESERVED",
  "pending_payment", // inaomba PENDING_PAYMENT na DRAFT, matokeo yanaunganishwa
];

export default function ModerationSection() {
  const { lang } = useLanguage();
  const queue = useModerationQueue({ hydrate: false });
  const [history, setHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending_approval");
  const [busy, setBusy] = useState({});
  const [error, setError] = useState("");
  const [rejectModal, setRejectModal] = useState(null);
  const [requestEditModal, setRequestEditModal] = useState(null);
  const [requestPaymentModal, setRequestPaymentModal] = useState(null);
  const [disapproveModal, setDisapproveModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [releaseModal, setReleaseModal] = useState(null);
  const [imageListing, setImageListing] = useState(null);
  const [decided, setDecided] = useState({});
  const [showScrollLeft, setShowScrollLeft] = useState(false);
  // Saa ya sasa (inasasishwa kila sekunde 30) — kuficha badge ya Reserved
  // mara reservation inapoisha muda.
  const [now, setNow] = useState(() => Date.now());
  // ── Bulk moderation ──
  const [selected, setSelected] = useState({}); // { [id]: true }
  const [bulkModal, setBulkModal] = useState(null); // { type, reason }
  const [bulkBusy, setBulkBusy] = useState(false);

  const filtersRef = useRef(null);

  const t = (sw, en) => (lang === "sw" ? sw : en);
  const formatTZS = (amount) =>
    "TZS " + Math.round(amount || 0).toLocaleString("en-US");

  // ── Tafsiri ya errors za API (backend hurudisha Kiswahili/JSON) ──
  const ERROR_CODES = {
    FEE_NOT_CONFIGURED: [
      "Kundi hili halina kanuni ya ada. Nenda Revenue > Listing Fee uweke ada yake, kisha jaribu tena.",
      "This category has no fee rule. Go to Revenue > Listing Fee, add one, then try again.",
    ],
    PAYMENT_REQUIRED: [
      "Mali hii ina ada. Tumia 'Omba Malipo' kwanza, kisha 'Idhinisha Mwisho' baada ya muuzaji kulipa.",
      "This listing has a fee. Use 'Request Pay' first, then 'Finalize' after the seller pays.",
    ],
    listing_fee_not_configured: [
      "Ada ya kuchapisha haijasanidiwa kwa kundi hili bado.",
      "The listing fee has not been configured for this category yet.",
    ],
  };
  const apiErr = (res, fallback) => {
    const err = res?.error;
    const tryParse = (v) => {
      if (typeof v !== "string") return null;
      try {
        const p = JSON.parse(v);
        return p && typeof p === "object" ? p : null;
      } catch {
        return null;
      }
    };
    // Backend hurudisha {detail:{detail,code}}; client inaweza kuibadilisha kuwa string
    const candidates = [
      err?.data,
      err?.data?.detail,
      tryParse(err?.message),
      tryParse(err?.data?.detail),
    ].filter((c) => c && typeof c === "object");
    const withCode = candidates.find((c) => c.code);
    const code = withCode?.code;
    if (code && ERROR_CODES[code]) return t(...ERROR_CODES[code]);
    // Backend detail ni Kiswahili; usionyeshe kwenye UI ya Kiingereza
    if (lang === "sw") {
      const d = withCode?.detail ?? candidates[0]?.detail;
      return (typeof d === "string" && d) || err?.message || fallback;
    }
    return fallback;
  };

  // ✅ FIX: Ongeza ufuatiliaji wa scroll ili kitufe cha "Rudi Kushoto" kionekane
  useEffect(() => {
    const el = filtersRef.current;
    if (!el) return;

    const handleScroll = () => {
      setShowScrollLeft(el.scrollLeft > 10);
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setSelected({});
  }, [statusFilter]);

  // Timer: hesabu upya reservations zilizoisha kila sekunde 30
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    // Queue ya admin (/admin/listings/pending/) ina PENDING_APPROVAL na PAID_PENDING_APPROVAL
    const wantPending =
      statusFilter === "pending_approval" ||
      statusFilter === "paid_pending_approval" ||
      statusFilter === "zote";
    const wantPendingApproval =
      statusFilter === "pending_approval" || statusFilter === "zote";
    const wantPaid =
      statusFilter === "paid_pending_approval" || statusFilter === "zote";
    const wantAwaitingPay =
      statusFilter === "approved_pending_payment" || statusFilter === "zote";
    const wantNeedsEdit =
      statusFilter === "needs_edit" || statusFilter === "zote";
    const wantLive = statusFilter === "live" || statusFilter === "zote";
    const wantRejected =
      statusFilter === "rejected" || statusFilter === "zote";
    const wantSold = statusFilter === "sold" || statusFilter === "zote";
    const wantExpired = statusFilter === "expired" || statusFilter === "zote";
    const wantReserved = statusFilter === "reserved" || statusFilter === "zote";
    const wantDraft = statusFilter === "pending_payment" || statusFilter === "zote";

    const tasks = [];
    if (wantPending) tasks.push(hydrateModerationQueueFromApi());
    if (wantPendingApproval)
      tasks.push(fetchListingsByStatusAsync("PENDING_APPROVAL"));
    if (wantPaid) tasks.push(fetchListingsByStatusAsync("PAID_PENDING_APPROVAL"));
    if (wantAwaitingPay)
      tasks.push(fetchListingsByStatusAsync("APPROVED_PENDING_PAYMENT"));
    if (wantNeedsEdit) tasks.push(fetchListingsByStatusAsync("NEEDS_EDIT"));
    if (wantLive) tasks.push(fetchListingsByStatusAsync("LIVE"));
    if (wantRejected) tasks.push(fetchListingsByStatusAsync("REJECTED"));
    if (wantSold) tasks.push(fetchListingsByStatusAsync("SOLD"));
    if (wantExpired) tasks.push(fetchListingsByStatusAsync("EXPIRED"));
    if (wantReserved) tasks.push(fetchListingsByStatusAsync("RESERVED"));
    if (wantDraft) tasks.push(fetchListingsByStatusAsync("pending_payment"));

    Promise.all(tasks).then((results) => {
      if (cancelled) return;
      const fetched = results.flatMap((r) => r?.listings || []);
      if (fetched.length) {
        setHistory((prev) => {
          const next = { ...prev };
          fetched.forEach((l) => {
            if (!l || l.id == null) return;
            next[String(l.id)] = {
              ...(prev[String(l.id)] || {}),
              ...l,
              _fetchedAt: Date.now(),
            };
          });
          return next;
        });
      }
      const allFailed = results.length > 0 && results.every((r) => !r?.ok);
      if (allFailed) {
        setError(
          t(
            "Imeshindwa kupakia orodha kwa kichujio hiki.",
            "Could not load listings for this filter."
          )
        );
      } else {
        setError("");
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, lang]);

  // ✅ Pakia statuses zote mara moja (mara ya kwanza) ili tabs zote zionyeshe counts
  useEffect(() => {
    let cancelled = false;
    Promise.all(ALL_STATUS_FETCH.map((st) => fetchListingsByStatusAsync(st))).then(
      (results) => {
        if (cancelled) return;
        const fetched = results.flatMap((r) => r?.listings || []);
        if (!fetched.length) return;
        setHistory((prev) => {
          const next = { ...prev };
          fetched.forEach((l) => {
            if (!l || l.id == null) return;
            const old = prev[String(l.id)];
            next[String(l.id)] = {
              ...l,
              ...(old || {}),
              // weka muda wa kupakia mara moja tu, ulingane na data iliyobaki
              _fetchedAt: old?._fetchedAt ?? Date.now(),
            };
          });
          return next;
        });
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // Queue + history zimeunganishwa (queue ina data mpya zaidi). Status halisi
  // inabaki — hatulazimishi PENDING_APPROVAL, ili tangazo lililolipwa lisionekane jipya.
  const merged = useMemo(() => {
    const map = new Map();
    Object.values(history).forEach((l) => {
      if (!l || l.id == null) return;
      map.set(String(l.id), l);
    });
    queue.forEach((l) => {
      if (!l || l.id == null) return;
      const k = String(l.id);
      map.set(k, { ...(map.get(k) || {}), ...l });
    });
    Object.entries(decided).forEach(([id, status]) => {
      const cur = map.get(id) || history[id];
      if (!cur) return;
      map.set(id, { ...cur, status });
    });
    return Array.from(map.values())
      // Reservation imeisha → LIVE (tab, badge na vitufe vyote vinafuata)
      .map((l) =>
        isReservationExpired(l, now) ? { ...l, status: "LIVE" } : l
      )
      .filter((l) => statusOf(l) !== "deleted");
  }, [queue, history, decided, now]);

  const filtered = useMemo(() => {
    const list =
      statusFilter === "zote"
        ? merged
        : merged.filter((l) => statusOf(l) === statusFilter);

    return [...list].sort(
      (a, b) =>
        new Date(b.postedAt || b.created_at || 0).getTime() -
        new Date(a.postedAt || a.created_at || 0).getTime()
    );
  }, [merged, statusFilter]);

  // ✅ Counts za kila tab
  const statusCounts = useMemo(() => {
    const c = { _all: merged.length };
    merged.forEach((l) => {
      const st = statusOf(l);
      c[st] = (c[st] || 0) + 1;
    });
    return c;
  }, [merged]);

  const baseFilters = [
    {
      key: "pending_approval",
      label: { sw: "Zinasubiri Idhini", en: "Pending Approval" },
    },
    {
      key: "paid_pending_approval",
      label: { sw: "Zimelipwa", en: "Paid" },
    },
    {
      key: "approved_pending_payment",
      label: { sw: "Zinasubiri Malipo", en: "Awaiting Pay" },
    },
    {
      key: "needs_edit",
      label: { sw: "Zinahitaji Uhariri", en: "Needs Edit" },
    },
    { key: "live", label: { sw: "Zimeidhinishwa", en: "Approved" } },
    { key: "reserved", label: { sw: "Zimehifadhiwa", en: "Reserved" } },
    { key: "sold", label: { sw: "Zilizouzwa", en: "Sold" } },
    { key: "expired", label: { sw: "Zilizoisha Muda", en: "Expired" } },
    { key: "pending_payment", label: { sw: "Rasimu", en: "Drafts" } },
    { key: "rejected", label: { sw: "Zimekataliwa", en: "Rejected" } },
    { key: "zote", label: { sw: "Zote", en: "All" } },
  ];

  const filters = baseFilters.map((f) =>
    f.count !== undefined
      ? f
      : { ...f, count: f.key === "zote" ? statusCounts._all : statusCounts[f.key] || 0 }
  );

    const clearBusy = (id) =>
    setBusy((b) => {
      const n = { ...b };
      delete n[id];
      return n;
    });

  const markDecided = (id, status) =>
    setDecided((d) => ({ ...d, [String(id)]: status }));

  const addToHistory = (listing) => {
    if (!listing || listing.id == null) return;
    setHistory((prev) => ({ ...prev, [String(listing.id)]: listing }));
  };

  const removeFromHistory = (id) => {
    setHistory((prev) => {
      const n = { ...prev };
      delete n[String(id)];
      return n;
    });
  };

  // ── APPROVE (legacy) ────────────────────────────────────
  const handleApprove = async (listingId) => {
    if (busy[listingId]) return;
    const snapshot = queue.find((q) => String(q.id) === String(listingId));
    setBusy((b) => ({ ...b, [listingId]: "approve" }));
    setError("");
    const res = await approveListingFromQueueAsync(listingId);
    clearBusy(listingId);
    if (res.ok) {
      markDecided(listingId, "LIVE");
      addToHistory({
        ...(snapshot || {}),
        ...(res.listing || {}),
        id: listingId,
        status: "LIVE",
        approvedAt: new Date().toISOString(),
      });
    } else {
      setError(apiErr(res, t("Imeshindwa kuidhinisha mali.", "Failed to approve listing.")));
    }
  };

  // ── REJECT ──────────────────────────────────────────────
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
      markDecided(listingId, "REJECTED");
      addToHistory({
        ...(snapshot || {}),
        ...(res.listing || {}),
        id: listingId,
        status: "REJECTED",
        rejectionReason: reason,
        rejectedAt: new Date().toISOString(),
      });
    } else {
      setError(apiErr(res, t("Imeshindwa kukataa listing.", "Failed to reject listing.")));
    }
  };

  // ── REQUEST EDIT ────────────────────────────────────────
  const openRequestEditModal = (id) => {
    if (busy[id]) return;
    setError("");
    setRequestEditModal({ listingId: id, reason: "" });
  };
  const submitRequestEdit = async () => {
    if (!requestEditModal) return;
    const reason = (requestEditModal.reason || "").trim();
    if (reason.length < 5) {
      setError(
        t("Sababu inahitajika (herufi 5+).", "Reason required (5+ chars).")
      );
      return;
    }
    const { listingId } = requestEditModal;
    setBusy((b) => ({ ...b, [listingId]: "request_edit" }));
    setError("");
    const snapshot = queue.find((q) => String(q.id) === String(listingId));
    const res = await requestEditListingAsync(listingId, reason);
    clearBusy(listingId);
    setRequestEditModal(null);
    if (res.ok) {
      markDecided(listingId, "NEEDS_EDIT");
      addToHistory({
        ...(snapshot || {}),
        id: listingId,
        status: "NEEDS_EDIT",
        rejectionReason: reason,
      });
    } else {
      setError(apiErr(res, t("Imeshindwa.", "Failed.")));
    }
  };

  // ── REQUEST PAYMENT ─────────────────────────────────────
  const openRequestPaymentModal = (id, isFree = false) => {
    if (busy[id]) return;
    setError("");
    setRequestPaymentModal({ listingId: id, reason: "", isFree });
  };
  const submitRequestPayment = async () => {
    if (!requestPaymentModal) return;
    const { listingId, reason, isFree } = requestPaymentModal;
    setBusy((b) => ({ ...b, [listingId]: "request_payment" }));
    setError("");
    const snapshot = queue.find((q) => String(q.id) === String(listingId));
    // Bure → endpoint ya approve (inaruhusu hata kundi lisilo na kanuni ya ada);
    // lenye ada → Request Payment.
    const res = isFree
      ? await approveListingFromQueueAsync(listingId)
      : await requestPaymentListingAsync(listingId, reason, { isFree });
    clearBusy(listingId);
    setRequestPaymentModal(null);
    if (res.ok) {
      const newStatus =
        res.listing?.status || (isFree ? "LIVE" : "APPROVED_PENDING_PAYMENT");
      const finalStatus = String(newStatus).toUpperCase();
      markDecided(listingId, finalStatus);
      addToHistory({
        ...(snapshot || {}),
        ...(res.listing || {}),
        id: listingId,
        status: finalStatus,
      });
    } else {
      setError(apiErr(res, t("Imeshindwa.", "Failed.")));
    }
  };

  // ── FINALIZE APPROVAL ───────────────────────────────────
  const handleFinalize = async (listingId) => {
    if (busy[listingId]) return;
    setBusy((b) => ({ ...b, [listingId]: "finalize" }));
    setError("");
    const snapshot =
      history[String(listingId)] ||
      queue.find((q) => String(q.id) === String(listingId));
    const res = await finalizeApprovalListingAsync(listingId);
    clearBusy(listingId);
    if (res.ok) {
      markDecided(listingId, "LIVE");
      addToHistory({
        ...(snapshot || {}),
        id: listingId,
        status: "LIVE",
        approvedAt: new Date().toISOString(),
      });
    } else {
      setError(apiErr(res, t("Imeshindwa.", "Failed.")));
    }
  };

  // ── DISAPPROVE ──────────────────────────────────────────
  const openDisapproveModal = (id) => {
    if (busy[id]) return;
    setError("");
    setDisapproveModal({ listingId: id, reason: "" });
  };
  const submitDisapprove = async () => {
    if (!disapproveModal) return;
    const reason = (disapproveModal.reason || "").trim();
    if (!reason) {
      setError(t("Sababu inahitajika.", "Reason is required."));
      return;
    }
    const { listingId } = disapproveModal;
    setBusy((b) => ({ ...b, [listingId]: "disapprove" }));
    setError("");
    const res = await disapproveListingAsync(listingId, reason);
    clearBusy(listingId);
    setDisapproveModal(null);
    if (res.ok) {
      markDecided(listingId, "REJECTED");
      setHistory((prev) => {
        const key = String(listingId);
        const existing = prev[key] || {};
        return {
          ...prev,
          [key]: { ...existing, status: "REJECTED", rejectionReason: reason },
        };
      });
    } else {
      setError(apiErr(res, t("Imeshindwa kudissapprove listing.", "Failed to disapprove listing.")));
    }
  };

  // ── DELETE ──────────────────────────────────────────────
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
      markDecided(listingId, "DELETED");
      removeFromHistory(listingId);
    } else {
      // Onyesha kosa halisi la seva (si ujumbe wa kukisia)
      setError(
        apiErr(res, t("Imeshindwa kufuta listing.", "Failed to delete listing."))
      );
    }
  };

  // ── RELEASE RESERVATION (mnunuzi ameshindwa kununua) ────
  const openReleaseModal = (id) => {
    if (busy[id]) return;
    setError("");
    setReleaseModal({ listingId: id, reason: "" });
  };
  const submitRelease = async () => {
    if (!releaseModal) return;
    const { listingId, reason } = releaseModal;
    setBusy((b) => ({ ...b, [listingId]: "release" }));
    setError("");
    const res = await releaseReservationAsync(listingId, reason);
    clearBusy(listingId);
    setReleaseModal(null);
    if (res.ok) {
      markDecided(listingId, "LIVE");
      setHistory((prev) => ({
        ...prev,
        [String(listingId)]: { ...(prev[String(listingId)] || {}), id: listingId, status: "LIVE" },
      }));
    } else {
      setError(
        apiErr(res, t("Imeshindwa kurudisha mali hewani.", "Failed to put the listing back live."))
      );
    }
  };

  // ============================================================
  // BULK MODERATION
  // ============================================================
  // Status ambazo kila kitendo kinaruhusiwa (lazima mali ZOTE zilizochaguliwa ziwe humo)
  const BULK_ALLOWED = {
    pay: ["pending_approval"],
    edit: ["pending_approval", "paid_pending_approval"],
    reject: [
      "pending_approval",
      "paid_pending_approval",
      "approved_pending_payment",
      "needs_edit",
    ],
    finalize: ["paid_pending_approval"],
    disapprove: ["live"],
    delete: ["live", "rejected", "expired", "pending_payment", "draft"],
  };

  const selectedIds = Object.keys(selected).filter((id) => selected[id]);
  const selectedListings = filtered.filter((l) => selected[String(l.id)]);
  const allSelected =
    filtered.length > 0 && selectedListings.length === filtered.length;

  const toggleOne = (id) =>
    setSelected((p) => ({ ...p, [String(id)]: !p[String(id)] }));
  const toggleAll = () =>
    setSelected(
      allSelected
        ? {}
        : Object.fromEntries(filtered.map((l) => [String(l.id), true]))
    );

  const bulkCan = (type) =>
    selectedListings.length > 0 &&
    selectedListings.every((l) => BULK_ALLOWED[type].includes(statusOf(l)));

  const bulkFreeCount = selectedListings.filter(
    (l) => isListingFree(l) || isFeeUnset(l)
  ).length;
  const bulkPayLabel =
    bulkFreeCount === selectedListings.length
      ? t("Idhinisha (Bure)", "Approve (Free)")
      : bulkFreeCount === 0
      ? t("Omba Malipo", "Request Pay")
      : t("Idhinisha / Omba Malipo", "Approve / Request Pay");

  const openBulkModal = (type) => {
    setError("");
    setBulkModal({ type, reason: "" });
  };

  const submitBulk = async () => {
    if (!bulkModal || bulkBusy) return;
    const { type } = bulkModal;
    const reason = (bulkModal.reason || "").trim();
    const ids = selectedListings.map((l) => l.id);
    if (!ids.length) return;

    if (type === "edit" && reason.length < 5) {
      setError(t("Sababu inahitajika (herufi 5+).", "Reason required (5+ chars)."));
      return;
    }
    if ((type === "reject" || type === "disapprove") && !reason) {
      setError(t("Sababu inahitajika.", "Reason is required."));
      return;
    }

    setBulkBusy(true);
    setError("");
    const snapshots = Object.fromEntries(
      selectedListings.map((l) => [String(l.id), l])
    );
    let res;
    try {
      if (type === "pay")
        res = await bulkRequestPaymentAsync(ids, reason, {
          freeIds: selectedListings
            .filter((l) => isListingFree(l) || isFeeUnset(l))
            .map((l) => l.id),
        });
      else if (type === "edit") res = await bulkRequestEditAsync(ids, reason);
      else if (type === "finalize") res = await bulkFinalizeAsync(ids);
      else if (type === "reject") res = await bulkRejectAsync(ids, reason);
      else if (type === "disapprove") res = await bulkDisapproveAsync(ids, reason);
      else if (type === "delete") res = await bulkDeleteAsync(ids, reason);
    } finally {
      setBulkBusy(false);
      setBulkModal(null);
    }
    if (!res) return;

    // Sasisha UI kwa zilizofanikiwa
    const doneStatus = {
      edit: "NEEDS_EDIT",
      finalize: "LIVE",
      reject: "REJECTED",
      disapprove: "REJECTED",
    };
    (res.succeeded || []).forEach((id) => {
      if (type === "delete") {
        markDecided(id, "DELETED");
        removeFromHistory(id);
        return;
      }
      const fromApi = (res.listings || []).find((x) => String(x.id) === String(id));
      const st = String(fromApi?.status || doneStatus[type] || "").toUpperCase();
      if (!st) return;
      markDecided(id, st);
      addToHistory({
        ...(snapshots[String(id)] || {}),
        ...(fromApi || {}),
        id,
        status: st,
        ...(type === "edit" || type === "reject" || type === "disapprove"
          ? { rejectionReason: reason }
          : {}),
      });
    });

    // Waliofeli hubaki wamechaguliwa ili admin aone na kujaribu tena
    const failedIds = (res.failed || []).map((f) => String(f.listingId));
    setSelected(Object.fromEntries(failedIds.map((id) => [id, true])));

    const okCount = (res.succeeded || []).length;
    if (failedIds.length) {
      const first = res.failed[0];
      const why = apiErr({ error: first.error }, t("Imeshindwa.", "Failed."));
      setError(
        t(
          `Zimefanikiwa ${okCount}, zimeshindwa ${failedIds.length}. Sababu ya kwanza: `,
          `${okCount} succeeded, ${failedIds.length} failed. First reason: `
        ) + why
      );
    } else if (res.error) {
      setError(apiErr({ error: res.error }, t("Imeshindwa.", "Failed.")));
    }
  };

  // ── Manage Images ───────────────────────────────────────
  const ManageImagesBtn = ({ listing, fullWidth }) => (
    <button
      type="button"
      onClick={() => setImageListing(listing)}
      title={t("Simamia picha", "Manage images")}
      style={{ color: COLORS.gold, borderColor: `${COLORS.gold}55` }}
      className={`inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors hover:bg-amber-50 ${
        fullWidth ? "flex-1" : ""
      }`}
    >
      <Image size={13} />
      {t("Picha", "Images")}
    </button>
  );

    // ── Action buttons kwa kila status ──────────────────────
  const renderActions = (listing, fullWidth = false) => {
    const status = normalizeStatus(listing.status);
    const isBusy = !!busy[listing.id];
    const currentAction = busy[listing.id];

    const isFree = isListingFree(listing) || isFeeUnset(listing);
    const PayIcon = isFree ? CheckCheck : Wallet;
    const payLabel = isFree
      ? t("Idhinisha (Bure)", "Approve (Free)")
      : t("Omba Malipo", "Request Pay");

    // Pending — admin ana chaguo 3
    if (status === "in_review") {
      return (
        <div
          className={`flex flex-wrap gap-2 ${
            fullWidth ? "w-full" : "justify-end"
          }`}
        >
          <button
            onClick={() => openRequestEditModal(listing.id)}
            disabled={isBusy}
            style={{ color: "#B45309" }}
            className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-amber-50 disabled:opacity-50 ${
              fullWidth ? "flex-1" : ""
            }`}
          >
            {currentAction === "request_edit" ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Pencil size={13} />
            )}
            {t("Omba Uhariri", "Request Edit")}
          </button>
          <button
            onClick={() => openRejectModal(listing.id)}
            disabled={isBusy}
            style={{ color: COLORS.rust }}
            className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-red-50 disabled:opacity-50 ${
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
          <button
            onClick={() => openRequestPaymentModal(listing.id, isFree)}
            disabled={isBusy}
            style={{ color: COLORS.green }}
            className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-green-50 disabled:opacity-50 ${
              fullWidth ? "flex-1" : ""
            }`}
          >
            {currentAction === "request_payment" ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <PayIcon size={13} />
            )}
            {payLabel}
          </button>
          <ManageImagesBtn listing={listing} fullWidth={fullWidth} />
        </div>
      );
    }

    // PENDING_APPROVAL — mpya, admin anakagua kwanza
    if (status === "pending_approval") {
      return (
        <div
          className={`flex flex-wrap gap-2 ${
            fullWidth ? "w-full" : "justify-end"
          }`}
        >
          <button
            onClick={() => openRequestEditModal(listing.id)}
            disabled={isBusy}
            style={{ color: "#B45309" }}
            className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-amber-50 disabled:opacity-50 ${
              fullWidth ? "flex-1" : ""
            }`}
          >
            {currentAction === "request_edit" ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Pencil size={13} />
            )}
            {t("Omba Uhariri", "Request Edit")}
          </button>
          <button
            onClick={() => openRejectModal(listing.id)}
            disabled={isBusy}
            style={{ color: COLORS.rust }}
            className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-red-50 disabled:opacity-50 ${
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
          
          <button
            onClick={() => openRequestPaymentModal(listing.id, isFree)}
            disabled={isBusy}
            style={{ color: COLORS.green }}
            className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-green-50 disabled:opacity-50 ${
              fullWidth ? "flex-1" : ""
            }`}
          >
            {currentAction === "request_payment" ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <PayIcon size={13} />
            )}
            {payLabel}
          </button>
          <ManageImagesBtn listing={listing} fullWidth={fullWidth} />
        </div>
      );
    }

    // Paid — admin analidhinisha mwisho
    if (status === "paid_pending_approval") {
      return (
        <div
          className={`flex flex-wrap gap-2 ${
            fullWidth ? "w-full" : "justify-end"
          }`}
        >
          <button
            onClick={() => handleFinalize(listing.id)}
            disabled={isBusy}
            style={{ color: COLORS.green }}
            className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-green-50 disabled:opacity-50 ${
              fullWidth ? "flex-1" : ""
            }`}
          >
            {currentAction === "finalize" ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <CheckCheck size={13} />
            )}
            {t("Idhinisha Mwisho", "Finalize")}
          </button>
          <button
            onClick={() => openRejectModal(listing.id)}
            disabled={isBusy}
            style={{ color: COLORS.rust }}
            className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-red-50 disabled:opacity-50 ${
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
          <ManageImagesBtn listing={listing} fullWidth={fullWidth} />
        </div>
      );
    }

    // Awaiting payment
    if (status === "approved_pending_payment") {
      return (
        <div
          className={`flex flex-wrap gap-2 ${
            fullWidth ? "w-full" : "justify-end"
          }`}
        >
          <button
            onClick={() => openRejectModal(listing.id)}
            disabled={isBusy}
            style={{ color: COLORS.rust }}
            className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-red-50 disabled:opacity-50 ${
              fullWidth ? "flex-1" : ""
            }`}
          >
            <XCircle size={13} />
            {t("Kataa", "Reject")}
          </button>
          <ManageImagesBtn listing={listing} fullWidth={fullWidth} />
        </div>
      );
    }

    // Needs edit
    if (status === "needs_edit") {
      return (
        <div
          className={`flex flex-wrap gap-2 ${
            fullWidth ? "w-full" : "justify-end"
          }`}
        >
          <button
            onClick={() => openRejectModal(listing.id)}
            disabled={isBusy}
            style={{ color: COLORS.rust }}
            className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-red-50 disabled:opacity-50 ${
              fullWidth ? "flex-1" : ""
            }`}
          >
            <XCircle size={13} />
            {t("Kataa", "Reject")}
          </button>
          <ManageImagesBtn listing={listing} fullWidth={fullWidth} />
        </div>
      );
    }

    // Live — disapprove au futa
    if (status === "live") {
      return (
        <div
          className={`flex flex-wrap gap-2 ${
            fullWidth ? "w-full" : "justify-end"
          }`}
        >
          <button
            onClick={() => openDisapproveModal(listing.id)}
            disabled={isBusy}
            style={{ color: COLORS.rust }}
            className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-red-50 disabled:opacity-50 ${
              fullWidth ? "flex-1" : ""
            }`}
          >
            {currentAction === "disapprove" ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <RotateCcw size={13} />
            )}
            {t("Disapprove", "Disapprove")}
          </button>
          <ManageImagesBtn listing={listing} fullWidth={fullWidth} />
          <button
            onClick={() => openDeleteModal(listing.id)}
            disabled={isBusy}
            style={{ color: "#DC2626", borderColor: "rgba(220,38,38,0.4)" }}
                        className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border hover:bg-red-50 disabled:opacity-50 ${
              fullWidth ? "flex-1" : ""
            }`}
          >
            {currentAction === "delete" ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Trash2 size={13} />
            )}
            {t("Futa", "Delete")}
          </button>
        </div>
      );
    }

    // Rejected — request edit au request payment
    if (status === "rejected") {
      return (
        <div
          className={`flex flex-wrap gap-2 ${
            fullWidth ? "w-full" : "justify-end"
          }`}
        >
          <button
            onClick={() => openRequestEditModal(listing.id)}
            disabled={isBusy}
            style={{ color: "#B45309" }}
            className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-amber-50 disabled:opacity-50 ${
              fullWidth ? "flex-1" : ""
            }`}
          >
            {currentAction === "request_edit" ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Pencil size={13} />
            )}
            {t("Omba Uhariri", "Request Edit")}
          </button>
          <button
            onClick={() => openRequestPaymentModal(listing.id, isFree)}
            disabled={isBusy}
            style={{ color: COLORS.green }}
            className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-green-50 disabled:opacity-50 ${
              fullWidth ? "flex-1" : ""
            }`}
          >
            {currentAction === "request_payment" ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <PayIcon size={13} />
            )}
            {payLabel}
          </button>
          <ManageImagesBtn listing={listing} fullWidth={fullWidth} />
          <button
            onClick={() => openDeleteModal(listing.id)}
            disabled={isBusy}
            style={{ color: "#DC2626", borderColor: "rgba(220,38,38,0.4)" }}
            className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border hover:bg-red-50 disabled:opacity-50 ${
              fullWidth ? "flex-1" : ""
            }`}
          >
            {currentAction === "delete" ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Trash2 size={13} />
            )}
            {t("Futa", "Delete")}
          </button>
        </div>
      );
    }

    // Sold / Rented — read-only
    if (status === "sold" || status === "rented") {
      return (
        <div
          className={`flex flex-wrap gap-2 ${
            fullWidth ? "w-full" : "justify-end"
          }`}
        >
          <span
            className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{
              background: "rgba(37,99,235,0.1)",
              color: "#2563EB",
            }}
          >
            <ShoppingBag size={13} />
            {t("Imeuzwa", "Sold")}
          </span>
          <ManageImagesBtn listing={listing} fullWidth={fullWidth} />
        </div>
      );
    }

    // Expired — read-only
    if (status === "expired") {
      return (
        <div
          className={`flex flex-wrap gap-2 ${
            fullWidth ? "w-full" : "justify-end"
          }`}
        >
          <span
            className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{
              background: "rgba(156,163,175,0.15)",
              color: "#6B7280",
            }}
          >
            <Clock size={13} />
            {t("Imeisha Muda", "Expired")}
          </span>
          <ManageImagesBtn listing={listing} fullWidth={fullWidth} />
          <button
            onClick={() => openDeleteModal(listing.id)}
            disabled={isBusy}
            style={{ color: "#DC2626", borderColor: "rgba(220,38,38,0.4)" }}
            className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border hover:bg-red-50 disabled:opacity-50 ${
              fullWidth ? "flex-1" : ""
            }`}
          >
            {currentAction === "delete" ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Trash2 size={13} />
            )}
            {t("Futa", "Delete")}
          </button>
        </div>
      );
    }

    // Reserved — mnunuzi ameihifadhi, admin anaona tu (read-only)
    if (status === "reserved") {
      return (
        <div
          className={`flex flex-wrap gap-2 ${
            fullWidth ? "w-full" : "justify-end"
          }`}
        >
          <span
            className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{ background: "rgba(254,164,6,0.12)", color: "#B45309" }}
          >
            <Clock size={13} />
            {t("Imehifadhiwa", "Reserved")}
          </span>
          <button
            onClick={() => openReleaseModal(listing.id)}
            disabled={isBusy}
            style={{ color: COLORS.green, borderColor: `${COLORS.green}66` }}
            className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border hover:bg-green-50 disabled:opacity-50 ${
              fullWidth ? "flex-1" : ""
            }`}
          >
            {currentAction === "release" ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <RotateCcw size={13} />
            )}
            {t("Rudisha Hewani", "Put Back Live")}
          </button>
          <ManageImagesBtn listing={listing} fullWidth={fullWidth} />
        </div>
      );
    }

    // Draft / pending_payment — muuzaji hajawasilisha bado
    if (status === "pending_payment" || status === "draft") {
      return (
        <div
          className={`flex flex-wrap gap-2 ${
            fullWidth ? "w-full" : "justify-end"
          }`}
        >
          <span
            className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{ background: "rgba(156,163,175,0.15)", color: "#6B7280" }}
          >
            <Clock size={13} />
            {t("Haijawasilishwa", "Not submitted")}
          </span>
          <ManageImagesBtn listing={listing} fullWidth={fullWidth} />
          <button
            onClick={() => openDeleteModal(listing.id)}
            disabled={isBusy}
            style={{ color: "#DC2626", borderColor: "rgba(220,38,38,0.4)" }}
            className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border hover:bg-red-50 disabled:opacity-50 ${
              fullWidth ? "flex-1" : ""
            }`}
          >
            {currentAction === "delete" ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Trash2 size={13} />
            )}
            {t("Futa", "Delete")}
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

  const emptyText = t(
    "Hakuna mali katika kundi hili",
    "No listings in this group"
  );

  return (
    <>
      <SectionHeader
        title={t("Uidhinishaji wa Mali", "Listing Moderation")}
        subtitle={t(
          "Idhinisha, kataa, omba uhariri, omba malipo, au idhinisha mwisho",
          "Approve, reject, request edit, request payment, or finalize"
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

      {/* ✅ FIX: Filters scroll — pande zote mbili, scrollbar inayoonekana */}
      <div 
        ref={filtersRef}
        className="flex gap-2 mb-4 overflow-x-auto pb-2 w-full"
        style={{
          scrollbarWidth: "thin",
          WebkitOverflowScrolling: "touch",
          scrollBehavior: "smooth",
          overscrollBehaviorX: "contain",
        }}
      >
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            style={{
              background: statusFilter === f.key ? COLORS.night : "white",
              color:
                statusFilter === f.key ? COLORS.sand : "var(--text-primary)",
              borderColor: COLORS.sandLine,
            }}
            className="text-xs font-semibold px-3.5 py-1.5 rounded-full border whitespace-nowrap shrink-0"
          >
            {f.label[lang]}
            {f.count > 0 ? ` (${f.count})` : ""}
            {URGENT_TABS.includes(f.key) && f.count > 0 && statusFilter !== f.key && (
              <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse align-middle" />
            )}
          </button>
        ))}
      </div>

      {/* ✅ Kitufe cha kurudi kushoto (kinaonekana tu kwenye simu) */}
      {showScrollLeft && (
        <button
          onClick={() => {
            if (filtersRef.current) {
              filtersRef.current.scrollTo({ left: 0, behavior: "smooth" });
            }
          }}
          className="sm:hidden fixed bottom-20 left-4 z-40 bg-white border border-gray-200 rounded-full p-2 shadow-lg"
          aria-label={t("Rudi kushoto", "Scroll left")}
        >
          <ChevronLeft size={18} />
        </button>
      )}

      {/* ── BULK BAR ─────────────────────────────────────── */}
      {selectedIds.length > 0 && (
        <div className="sticky top-2 z-30 mb-3 rounded-xl border border-gray-200 bg-white p-3 shadow-md">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-primary mr-1">
              {t(`Umechagua ${selectedListings.length}`, `${selectedListings.length} selected`)}
            </span>
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs font-semibold text-secondary underline"
            >
              {allSelected ? t("Ondoa zote", "Clear all") : t("Chagua zote", "Select all")}
            </button>
            <div className="flex flex-wrap items-center gap-2 ml-auto">
              {bulkCan("pay") && (
                <button
                  onClick={() => openBulkModal("pay")}
                  disabled={bulkBusy}
                  style={{ color: COLORS.green }}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-green-50 disabled:opacity-50"
                >
                  {bulkFreeCount === selectedListings.length ? <CheckCheck size={13} /> : <Wallet size={13} />}
                  {bulkPayLabel}
                </button>
              )}
              {bulkCan("finalize") && (
                <button
                  onClick={() => openBulkModal("finalize")}
                  disabled={bulkBusy}
                  style={{ color: COLORS.green }}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-green-50 disabled:opacity-50"
                >
                  <CheckCheck size={13} />
                  {t("Idhinisha Mwisho", "Finalize")}
                </button>
              )}
              {bulkCan("edit") && (
                <button
                  onClick={() => openBulkModal("edit")}
                  disabled={bulkBusy}
                  style={{ color: "#B45309" }}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-amber-50 disabled:opacity-50"
                >
                  <Pencil size={13} />
                  {t("Omba Uhariri", "Request Edit")}
                </button>
              )}
              {bulkCan("reject") && (
                <button
                  onClick={() => openBulkModal("reject")}
                  disabled={bulkBusy}
                  style={{ color: COLORS.rust }}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-red-50 disabled:opacity-50"
                >
                  <XCircle size={13} />
                  {t("Kataa", "Reject")}
                </button>
              )}
              {bulkCan("disapprove") && (
                <button
                  onClick={() => openBulkModal("disapprove")}
                  disabled={bulkBusy}
                  style={{ color: COLORS.rust }}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-red-50 disabled:opacity-50"
                >
                  <RotateCcw size={13} />
                  Disapprove
                </button>
              )}
              {bulkCan("delete") && (
                <button
                  onClick={() => openBulkModal("delete")}
                  disabled={bulkBusy}
                  style={{ color: "#DC2626" }}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 size={13} />
                  {t("Futa", "Delete")}
                </button>
              )}
              <button
                onClick={() => setSelected({})}
                aria-label={t("Ghairi uchaguzi", "Clear selection")}
                className="p-1.5 rounded-lg border border-gray-200 text-secondary"
              >
                <X size={13} />
              </button>
            </div>
          </div>
          {!["pay", "finalize", "edit", "reject", "disapprove", "delete"].some(bulkCan) && (
            <p className="text-xs text-secondary mt-2">
              {t(
                "Mali ulizochagua ziko kwenye hali tofauti — hakuna kitendo kinachofaa zote. Chagua kutoka tab moja.",
                "The selected listings are in different states, so no single action fits all. Select from one tab."
              )}
            </p>
          )}
        </div>
      )}

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
                    <th className="pl-4 pr-1 py-2.5 w-8">
                      <button
                        type="button"
                        onClick={toggleAll}
                        aria-label={t("Chagua zote", "Select all")}
                        className="text-secondary"
                      >
                        {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                    </th>
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
                      {t("Vitendo", "Actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((l) => (
                    <tr
                      key={l.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="pl-4 pr-1 py-3 w-8">
                        <input
                          type="checkbox"
                          checked={!!selected[String(l.id)]}
                          onChange={() => toggleOne(l.id)}
                          aria-label={t("Chagua", "Select")}
                          className="h-4 w-4 accent-[#0A1F5C]"
                        />
                      </td>
                      <td className="px-5 py-3 text-sm font-medium text-primary">
                        {l.title}
                        {normalizeStatus(l.status) === "rejected" && l.rejectionReason && (
                          <p
                            className="text-xs font-normal mt-0.5"
                            style={{ color: COLORS.rust }}
                          >
                            {l.rejectionReason}
                          </p>
                        )}
                        {normalizeStatus(l.status) === "needs_edit" && l.rejectionReason && (
                          <p
                            className="text-xs font-normal mt-0.5"
                            style={{ color: "#B45309" }}
                          >
                            {l.rejectionReason}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-sm text-secondary">
                        {typeof l.category === "object" && l.category !== null
                          ? l.category.name || l.category.slug || "—"
                          : l.category}
                      </td>
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
                      <td className="px-5 py-3 text-right">
                        {renderActions(l)}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
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

          <div className="sm:hidden flex flex-col gap-3">
            {filtered.map((l) => (
              <div
                key={l.id}
                className="bg-white rounded-xl border border-gray-100 p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <input
                    type="checkbox"
                    checked={!!selected[String(l.id)]}
                    onChange={() => toggleOne(l.id)}
                    aria-label={t("Chagua", "Select")}
                    className="mt-1 h-4 w-4 shrink-0 accent-[#0A1F5C]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-primary line-clamp-2">
                      {l.title}
                    </p>
                    <p className="text-xs text-secondary mt-0.5 truncate">
                      {typeof l.category === "object" && l.category !== null
                        ? l.category.name || l.category.slug || "—"
                        : l.category}
                    </p>
                    {normalizeStatus(l.status) === "rejected" && l.rejectionReason && (
                      <p
                        className="text-xs mt-1 line-clamp-2"
                        style={{ color: COLORS.rust }}
                      >
                        {l.rejectionReason}
                      </p>
                    )}
                    {normalizeStatus(l.status) === "needs_edit" && l.rejectionReason && (
                      <p
                        className="text-xs mt-1 line-clamp-2"
                        style={{ color: "#B45309" }}
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

      {/* ── BULK MODAL ───────────────────────────────────── */}
      {bulkModal && (() => {
        const type = bulkModal.type;
        const n = selectedListings.length;
        const needsReason = ["edit", "reject", "disapprove", "delete"].includes(type);
        const reasonRequired = type !== "delete";
        const titles = {
          pay: bulkPayLabel,
          finalize: t("Idhinisha Mwisho", "Finalize"),
          edit: t("Omba Uhariri", "Request Edit"),
          reject: t("Kataa", "Reject"),
          disapprove: "Disapprove",
          delete: t("Futa Kabisa", "Delete Permanently"),
        };
        const bodies = {
          pay:
            bulkFreeCount === n
              ? t("Mali zitaenda LIVE moja kwa moja (hakuna ada).", "Listings will go LIVE right away (no fee).")
              : t(
                  "Zenye ada zitaenda 'Zinasubiri Malipo'; zisizo na ada zitaenda LIVE.",
                  "Listings with a fee go to 'Awaiting Pay'; free ones go LIVE."
                ),
          finalize: t("Mali zilizolipwa zitaenda LIVE.", "Paid listings will go LIVE."),
          edit: t("Sababu moja itatumwa kwa kila muuzaji.", "The same reason is sent to each seller."),
          reject: t("Sababu moja itatumwa kwa kila muuzaji.", "The same reason is sent to each seller."),
          disapprove: t("Zitarudishwa kwenye Zimekataliwa.", "They will move back to Rejected."),
          delete: t("Hatua hii haiwezi kurudishwa.", "This cannot be undone."),
        };
        const invalid =
          reasonRequired &&
          needsReason &&
          (type === "edit"
            ? bulkModal.reason.trim().length < 5
            : !bulkModal.reason.trim());
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl max-w-md w-full p-5">
              <h3 className="text-base font-semibold text-primary mb-1">
                {titles[type]} · {n}
              </h3>
              <p className="text-xs text-secondary mb-3">{bodies[type]}</p>
              {needsReason && (
                <textarea
                  value={bulkModal.reason}
                  onChange={(e) => setBulkModal((p) => ({ ...p, reason: e.target.value }))}
                  rows={3}
                  autoFocus
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none resize-none mb-3"
                  placeholder={
                    reasonRequired
                      ? t("Sababu (inahitajika)", "Reason (required)")
                      : t("Sababu (hiari)", "Reason (optional)")
                  }
                />
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBulkModal(null)}
                  disabled={bulkBusy}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-secondary"
                >
                  {t("Ghairi", "Cancel")}
                </button>
                <button
                  onClick={submitBulk}
                  disabled={bulkBusy || invalid}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  style={{
                    background: ["reject", "disapprove", "delete"].includes(type)
                      ? COLORS.rust
                      : COLORS.green,
                  }}
                >
                  {bulkBusy && <Loader2 size={14} className="animate-spin" />}
                  {titles[type]}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── REJECT MODAL ─────────────────────────────────── */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-5">
            <h3 className="text-base font-semibold text-primary mb-2">
              {t("Kataa Listing", "Reject Listing")}
            </h3>
            <p className="text-xs text-secondary mb-3">
              {t(
                "Sababu itatumwa kwa muuzaji. Inahitajika.",
                "The reason is sent to the seller. Required."
              )}
            </p>
            <textarea
              value={rejectModal.reason}
              onChange={(e) =>
                setRejectModal((p) => ({ ...p, reason: e.target.value }))
              }
              rows={3}
              autoFocus
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none resize-none focus:border-[#C1502E] mb-3"
              placeholder={t(
                "mfano: Picha hazitoshi, bei haijaeleweka",
                "e.g. Insufficient photos, unclear price"
              )}
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRejectModal(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-secondary"
              >
                {t("Ghairi", "Cancel")}
              </button>
              <button
                onClick={submitReject}
                disabled={!rejectModal.reason.trim()}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: COLORS.rust }}
              >
                {t("Kataa", "Reject")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REQUEST EDIT MODAL ───────────────────────────── */}
      {requestEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-5">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "rgba(180,83,9,0.1)" }}
              >
                <Pencil size={18} color="#B45309" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-primary">
                  {t("Omba Uhariri", "Request Edit")}
                </h3>
                <p className="text-xs text-secondary mt-0.5">
                  {t(
                    "Mwambie muuzaji ahariri kitu kabla ya kuendelea",
                    "Ask seller to fix something before proceeding"
                  )}
                </p>
              </div>
            </div>
            <textarea
              value={requestEditModal.reason}
              onChange={(e) =>
                setRequestEditModal((p) => ({ ...p, reason: e.target.value }))
              }
              rows={3}
              autoFocus
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none resize-none focus:border-[#B45309] mb-3"
              placeholder={t(
                "mfano: Ongeza picha zaidi, ainisha eneo vizuri",
                "e.g. Add more photos, clarify location"
              )}
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRequestEditModal(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-secondary"
              >
                {t("Ghairi", "Cancel")}
              </button>
              <button
                onClick={submitRequestEdit}
                disabled={requestEditModal.reason.trim().length < 5}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "#B45309" }}
              >
                {t("Tuma Ombi", "Send Request")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REQUEST PAYMENT MODAL ────────────────────────── */}
      {requestPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-5">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "rgba(47,109,79,0.1)" }}
              >
                {requestPaymentModal.isFree ? (
                  <CheckCheck size={18} color={COLORS.green} />
                ) : (
                  <Wallet size={18} color={COLORS.green} />
                )}
              </div>
              <div>
                <h3 className="text-base font-semibold text-primary">
                  {requestPaymentModal.isFree
                    ? t("Idhinisha (Bure)", "Approve (Free)")
                    : t("Omba Malipo", "Request Payment")}
                </h3>
                <p className="text-xs text-secondary mt-0.5">
                  {requestPaymentModal.isFree
                    ? t(
                        "Hakuna ada — tangazo litaonekana hewani mara moja",
                        "No fee — the listing will go live right away"
                      )
                    : t(
                        "Mwambie muuzaji alipe ada ya kuchapisha",
                        "Ask seller to pay the listing fee"
                      )}
                </p>
              </div>
            </div>
            <textarea
              value={requestPaymentModal.reason}
              onChange={(e) =>
                setRequestPaymentModal((p) => ({
                  ...p,
                  reason: e.target.value,
                }))
              }
              rows={2}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none resize-none focus:border-[#2F6D4F] mb-3"
              placeholder={t(
                "Maelezo ya ziada (hiari)",
                "Optional note to seller"
              )}
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRequestPaymentModal(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-secondary"
              >
                {t("Ghairi", "Cancel")}
              </button>
              <button
                onClick={submitRequestPayment}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white"
                style={{ background: COLORS.green }}
              >
                {requestPaymentModal.isFree
                  ? t("Idhinisha Sasa", "Approve Now")
                  : t("Tuma Ombi la Malipo", "Request Payment")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DISAPPROVE MODAL ─────────────────────────────── */}
      {disapproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-5">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "rgba(193,80,46,0.1)" }}
              >
                <RotateCcw size={18} color={COLORS.rust} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-primary">
                  {t("Disapprove Listing", "Disapprove Listing")}
                </h3>
                <p className="text-xs text-secondary mt-0.5">
                  {t(
                    "Rudisha kwenye kundi la Imekataliwa",
                    "Move back to Rejected group"
                  )}
                </p>
              </div>
            </div>
            <textarea
              value={disapproveModal.reason}
              onChange={(e) =>
                setDisapproveModal((p) => ({ ...p, reason: e.target.value }))
              }
              rows={3}
              autoFocus
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none resize-none focus:border-[#C1502E] mb-3"
              placeholder={t(
                "mfano: Ilidhinishwa kimakosa, inahitaji mabadiliko",
                "e.g. Approved by mistake, needs corrections"
              )}
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDisapproveModal(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-secondary"
              >
                {t("Ghairi", "Cancel")}
              </button>
              <button
                onClick={submitDisapprove}
                disabled={!disapproveModal.reason.trim()}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: COLORS.rust }}
              >
                {t("Disapprove", "Disapprove")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE MODAL ─────────────────────────────────── */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-5">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "rgba(220,38,38,0.1)" }}
              >
                <Trash2 size={18} color="#DC2626" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-primary">
                  {t("Futa Listing Kabisa?", "Delete Listing Permanently?")}
                </h3>
                <p className="text-xs text-secondary mt-0.5">
                  {t("Hatua hii haiwezi kurudishwa", "This action cannot be undone")}
                </p>
              </div>
            </div>
            <textarea
              value={deleteModal.reason}
              onChange={(e) =>
                setDeleteModal((p) => ({ ...p, reason: e.target.value }))
              }
              rows={3}
              autoFocus
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none resize-none focus:border-[#DC2626] mb-3"
              placeholder={t(
                "mfano: Listing ya udanganyifu (scam)",
                "e.g. Scam listing"
              )}
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-secondary"
              >
                {t("Ghairi", "Cancel")}
              </button>
              <button
                onClick={submitDelete}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white"
                style={{ background: "#DC2626" }}
              >
                {t("Futa Kabisa", "Delete Permanently")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RELEASE RESERVATION MODAL ───────────────────── */}
      {releaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-5">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "rgba(47,109,79,0.12)" }}
              >
                <RotateCcw size={18} color={COLORS.green} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-primary">
                  {t("Rudisha Mali Hewani?", "Put Listing Back Live?")}
                </h3>
                <p className="text-xs text-secondary mt-0.5">
                  {t(
                    "Reservation itaghairiwa na ada ya reservation HAITARUDISHWA.",
                    "The reservation will be cancelled and the reservation fee will NOT be refunded."
                  )}
                </p>
              </div>
            </div>
            <textarea
              value={releaseModal.reason}
              onChange={(e) =>
                setReleaseModal((p) => ({ ...p, reason: e.target.value }))
              }
              rows={3}
              autoFocus
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none resize-none focus:border-[#2F6D4F] mb-3"
              placeholder={t(
                "Sababu (hiari) — mfano: Mnunuzi hakukamilisha malipo",
                "Reason (optional) — e.g. Buyer did not complete payment"
              )}
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setReleaseModal(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-secondary"
              >
                {t("Ghairi", "Cancel")}
              </button>
              <button
                onClick={submitRelease}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white"
                style={{ background: COLORS.green }}
              >
                {t("Rudisha Hewani", "Put Back Live")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Admin image manager ──────────────────────────── */}
      {imageListing && (
        <AdminListingImageManager
          listing={imageListing}
          onClose={() => setImageListing(null)}
        />
      )}
    </>
  );
}