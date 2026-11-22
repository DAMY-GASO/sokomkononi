// ============================================================
// UserDrawer.jsx
// ============================================================

import React, { useEffect, useState } from "react";
import {
  X,
  Phone,
  Mail,
  Calendar,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  XCircle,
  Wallet,
  CreditCard,
  User as UserIcon,
} from "lucide-react";
import { COLORS, FONTS } from "./constants.js";
import StatusBadge from "./StatusBadge.jsx";
import { api } from "../../../../api/client.js";

// ============================================================
// HELPERS
// ============================================================
function getUserInitial(user) {
  const name = user?.name || user?.email || "U";
  return String(name).charAt(0).toUpperCase();
}

function formatJoined(date) {
  if (!date) return "—";
  try {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return String(date);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(date);
  }
}

function formatTZS(amount) {
  return "TZS " + Math.round(amount || 0).toLocaleString("en-US");
}

// ============================================================
// TABS
// ============================================================
const TABS = [
  { key: "profile", label: { sw: "Wasifu", en: "Profile" } },
  { key: "listings", label: { sw: "Mali", en: "Listings" } },
  { key: "deals", label: { sw: "Deals", en: "Deals" } },
  { key: "sold", label: { sw: "Zilizouzwa", en: "Sold" } },
];

// ============================================================
// REFUND SECTION — payment details + "Paid" button
// ============================================================
function RefundSection({ refund, lang, onComplete, onFail, busy }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);

  if (!refund) return null;

  const isPending =
    refund.status === "PENDING" || refund.status === "PROCESSING";

  return (
    <div className="space-y-4">
      {/* Refund amount */}
      <div
        style={{ background: "rgba(0,98,253,0.06)", borderColor: "rgba(0,98,253,0.2)" }}
        className="rounded-xl border p-4"
      >
        <div className="flex items-center gap-2 mb-1">
          <Wallet size={14} style={{ color: COLORS.link }} />
          <p className="text-xs font-semibold text-secondary uppercase">
            {t("Kiasi cha Refund", "Refund Amount")}
          </p>
        </div>
        <p className="text-2xl font-bold text-primary">
          {formatTZS(refund.amountPaid)}
        </p>
        <p className="text-xs text-muted mt-1">
          {refund.promotionType} #{refund.promotionId}
        </p>
      </div>

      {/* Payment details */}
      <div
        style={{ borderColor: "rgb(var(--c-hairline))", background: "rgb(var(--c-card))" }}
        className="rounded-xl border p-4 space-y-3"
      >
        <p className="text-xs font-semibold text-secondary uppercase">
          {t("Taarifa za Malipo", "Payment Details")}
        </p>

        {/* Phone */}
        <div className="flex items-start gap-3">
          <div
            style={{ background: `${COLORS.green}15` }}
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          >
            <Phone size={14} style={{ color: COLORS.successText }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-muted uppercase">
              {t("Namba ya Simu", "Phone Number")}
            </p>
            <p className="text-sm font-semibold text-primary break-words">
              {refund.userPhone || "—"}
            </p>
          </div>
        </div>

        {/* Email */}
        {refund.userEmail && (
          <div className="flex items-start gap-3">
            <div
              style={{ background: `${COLORS.gold}15` }}
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            >
              <Mail size={14} style={{ color: COLORS.goldText }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-muted uppercase">
                {t("Barua Pepe", "Email")}
              </p>
              <p className="text-sm font-semibold text-primary break-words">
                {refund.userEmail}
              </p>
            </div>
          </div>
        )}

        {/* Payment method */}
        {refund.userPaymentMethod && (
          <div className="flex items-start gap-3">
            <div
              style={{ background: "rgba(0,98,253,0.1)" }}
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            >
              <CreditCard size={14} style={{ color: COLORS.link }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-muted uppercase">
                {t("Njia ya Malipo", "Payment Method")}
              </p>
              <p className="text-sm font-semibold text-primary">
                {refund.userPaymentMethod}
              </p>
            </div>
          </div>
        )}

        {/* Reason */}
        {refund.reason && (
          <div>
            <p className="text-[10px] text-muted uppercase mb-1">
              {t("Sababu", "Reason")}
            </p>
            <p className="text-xs text-secondary break-words">
              {refund.reason}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      {isPending && (
        <div className="space-y-2">
          <button
            onClick={onComplete}
            disabled={busy}
            style={{ background: COLORS.green, color: "white" }}
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold px-4 py-3 rounded-xl disabled:opacity-50"
          >
            {busy ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            {t("Nimelipa — Weka kama Imelipwa", "I've Paid — Mark as Paid")}
          </button>
          <button
            onClick={onFail}
            disabled={busy}
            style={{ color: COLORS.dangerText, borderColor: "rgb(var(--c-hairline))" }}
            className="w-full flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl border disabled:opacity-50"
          >
            <XCircle size={14} />
            {t("Imeshindwa", "Failed")}
          </button>
        </div>
      )}

      {/* Completed */}
      {refund.status === "COMPLETED" && (
        <div
          style={{ background: "rgba(47,109,79,0.08)", color: COLORS.successText }}
          className="rounded-xl p-4 text-center"
        >
          <CheckCircle2 size={22} className="mx-auto mb-2" />
          <p className="text-sm font-semibold">
            {t("Refund imelipwa", "Refund paid")}
          </p>
          {refund.refundReference && (
            <p className="text-xs mt-1 font-mono">
              {refund.refundReference}
            </p>
          )}
        </div>
      )}

      {/* Failed */}
      {refund.status === "FAILED" && (
        <div
          style={{ background: "rgba(193,80,46,0.08)", color: COLORS.dangerText }}
          className="rounded-xl p-4 text-center"
        >
          <XCircle size={22} className="mx-auto mb-2" />
          <p className="text-sm font-semibold">
            {t("Refund imeshindwa", "Refund failed")}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// TAB CONTENT — Listings
// ============================================================
function ListingsTab({ listings, lang, loading }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-secondary">
        <Loader2 size={16} className="animate-spin" />
        {t("Inapakia...", "Loading...")}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <p className="text-xs text-muted py-3">
        {t("Hakuna listings.", "No listings.")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {listings.map((l) => (
        <div
          key={l.id}
          className="flex items-center justify-between gap-2 text-xs border rounded-lg px-3 py-2"
          style={{ borderColor: "rgb(var(--c-hairline))" }}
        >
          <span className="truncate text-primary min-w-0 flex-1">
            {l.title}
          </span>
          <div className="shrink-0">
            <StatusBadge status={l.status} lang={lang} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// TAB CONTENT — Deals
// ============================================================
function DealsTab({ deals, lang, loading }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-secondary">
        <Loader2 size={16} className="animate-spin" />
        {t("Inapakia...", "Loading...")}
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <p className="text-xs text-muted py-3">
        {t("Hakuna deals.", "No deals.")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {deals.map((d) => (
        <div
          key={d.id}
          className="flex items-center justify-between gap-2 text-xs border rounded-lg px-3 py-2"
          style={{ borderColor: "rgb(var(--c-hairline))" }}
        >
          <span className="truncate text-primary min-w-0 flex-1">
            {d.listingTitle || "—"}
            {d.role && (
              <span className="ml-1 text-muted">({d.role})</span>
            )}
          </span>
          <div className="shrink-0">
            <StatusBadge status={d.status} lang={lang} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// TAB CONTENT — Sold
// ============================================================
function SoldTab({ listings, lang, loading }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-secondary">
        <Loader2 size={16} className="animate-spin" />
        {t("Inapakia...", "Loading...")}
      </div>
    );
  }

  const soldListings = (listings || []).filter((l) => {
    const s = String(l.status || "").toLowerCase();
    return s === "sold" || s === "SOLD";
  });

  if (soldListings.length === 0) {
    return (
      <div className="py-6 text-center">
        <CheckCircle2
          size={28}
          className="mx-auto text-muted mb-2"
          style={{ color: COLORS.successText }}
        />
        <p className="text-xs text-muted">
          {t("Hakuna mali zilizouzwa.", "No sold listings.")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {soldListings.map((l) => (
        <div
          key={l.id}
          className="flex items-start justify-between gap-2 text-xs border rounded-lg px-3 py-2"
          style={{
            borderColor: "rgba(0,98,253,0.3)",
            background: "rgba(0,98,253,0.04)",
          }}
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium text-primary truncate">
              {l.title}
            </p>
            <p className="text-[10px] text-muted mt-0.5">
              {t("Imeuzwa", "Sold")}:{" "}
              {l.soldAt || l.updatedAt
                ? formatJoined(l.soldAt || l.updatedAt)
                : "—"}
            </p>
          </div>
          <div className="shrink-0">
            <span
              style={{
                background: "rgba(0,98,253,0.12)",
                color: COLORS.link,
              }}
              className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
            >
              SOLD
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function UserDrawer({
  user,
  onClose,
  lang = "sw",
  refund = null,        // ⬅️ REFUND MODE
  onComplete,           // callback wakati refund imelipwa
  onFail,               // callback wakati refund imeshindwa
  busy = false,
}) {
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("profile");

  // ── Deep link: soma URL params (?tab=listings&filter=sold) ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      const filter = params.get("filter");

      if (tab === "listings" && filter === "sold") {
        setActiveTab("sold");
      } else if (tab === "listings") {
        setActiveTab("listings");
      } else if (tab === "deals") {
        setActiveTab("deals");
      } else if (tab === "sold") {
        setActiveTab("sold");
      }
    } catch {
      /* noop */
    }
  }, []);

  // ── Fetch data ──────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const res = await api.get(`/admin/users/${user.id}/full/`);
        if (cancelled) return;
        setData(res);
      } catch (err) {
        if (cancelled) return;
        setError(
          err?.message ||
            t("Imeshindwa kupakia data.", "Failed to load data.")
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user) return null;

  const fullUser = data?.user || user;
  const listings = data?.listings || [];
  const deals = data?.deals || [];
  const hasAvatar = !!fullUser.avatar;

  const userStatus =
    fullUser.is_active === false
      ? "suspended"
      : fullUser.status || "active";

  const soldCount = listings.filter((l) => {
    const s = String(l.status || "").toLowerCase();
    return s === "sold";
  }).length;

  // ── Kama ni refund mode, onyesha RefundSection pekee ──
  if (refund) {
    return (
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Overlay */}
        <div className="flex-1 bg-black/40" onClick={onClose} />

        {/* Drawer */}
        <div
          className="w-full sm:w-96 sm:max-w-md h-full bg-card shadow-2xl overflow-y-auto flex flex-col"
          style={{ fontFamily: FONTS.body }}
        >
          {/* Header — sticky */}
          <div
            className="sticky top-0 z-10 p-4 flex items-center justify-between border-b"
            style={{ borderColor: "rgb(var(--c-hairline))", background: "rgb(var(--c-card))" }}
          >
            <h3 className="font-semibold text-primary text-sm sm:text-base">
              {t("Malipo ya Refund", "Refund Payment")}
            </h3>
            <button
              onClick={onClose}
              className="text-muted hover:text-secondary p-1 -mr-1"
              aria-label={t("Funga", "Close")}
            >
              <X size={20} />
            </button>
          </div>

          {/* User header */}
          <div className="p-4 sm:p-5 border-b" style={{ borderColor: "rgb(var(--c-hairline))" }}>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold shrink-0"
                style={{ background: `${COLORS.gold}20`, color: COLORS.goldText }}
              >
                {getUserInitial(fullUser)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-primary truncate">
                  {refund.userName || fullUser.name || "—"}
                </p>
                <p className="text-xs text-secondary truncate">
                  {refund.userEmail || fullUser.email || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Refund content */}
          <div className="p-4 sm:p-5">
            <RefundSection
              refund={refund}
              lang={lang}
              onComplete={onComplete}
              onFail={onFail}
              busy={busy}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Kawaida (user management mode) ──
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="flex-1 bg-black/40" onClick={onClose} />

      <div
        className="w-full sm:w-96 sm:max-w-md h-full bg-card shadow-2xl overflow-y-auto flex flex-col"
        style={{ fontFamily: FONTS.body }}
      >
        <div
          className="sticky top-0 z-10 p-4 flex items-center justify-between border-b"
          style={{ borderColor: "rgb(var(--c-hairline))", background: "rgb(var(--c-card))" }}
        >
          <h3 className="font-semibold text-primary text-sm sm:text-base">
            {t("Wasifu wa Mtumiaji", "User Profile")}
          </h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-secondary p-1 -mr-1"
            aria-label={t("Funga", "Close")}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-5 border-b" style={{ borderColor: "rgb(var(--c-hairline))" }}>
          <div className="flex items-center gap-3">
            {hasAvatar ? (
              <img
                src={fullUser.avatar}
                alt={fullUser.name}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover shrink-0"
              />
            ) : (
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-base sm:text-lg font-bold shrink-0"
                style={{ background: `${COLORS.gold}20`, color: COLORS.goldText }}
              >
                {getUserInitial(fullUser)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-primary truncate">
                  {fullUser.name || "—"}
                </p>
                {fullUser.is_verified && (
                  <ShieldCheck
                    size={14}
                    style={{ color: COLORS.successText }}
                    className="shrink-0"
                    aria-label={t("Imethibitishwa", "Verified")}
                  />
                )}
              </div>
              <p className="text-xs text-secondary truncate">
                {fullUser.email || "—"}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <StatusBadge status={userStatus} lang={lang} />
                <span className="text-xs text-muted capitalize">
                  {fullUser.role}
                </span>
              </div>
            </div>
          </div>

          {fullUser.phone && (
            <a
              href={`tel:${fullUser.phone}`}
              className="mt-3 flex items-center gap-2 text-sm text-primary rounded-lg border px-3 py-2 hover:bg-ink/5 transition-colors"
              style={{ borderColor: "rgb(var(--c-hairline))" }}
            >
              <Phone size={14} style={{ color: COLORS.ink }} />
              <span className="font-medium">{fullUser.phone}</span>
            </a>
          )}
        </div>

        <div
          className="flex gap-1 px-4 sm:px-5 border-b overflow-x-auto"
          style={{ borderColor: "rgb(var(--c-hairline))" }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count =
              tab.key === "listings"
                ? listings.length
                : tab.key === "deals"
                  ? deals.length
                  : tab.key === "sold"
                    ? soldCount
                    : null;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  color: isActive ? COLORS.ink : "rgb(var(--c-text-2))",
                  borderBottomColor: isActive ? COLORS.gold : "transparent",
                }}
                className="shrink-0 text-xs font-semibold px-3 py-2.5 border-b-2 whitespace-nowrap transition-colors"
              >
                {tab.label[lang] || tab.label.sw}
                {count != null && (
                  <span className="ml-1 text-[10px] text-muted">
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-4 sm:p-5 space-y-5 flex-1">
          {loading && !data && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-secondary">
              <Loader2 size={16} className="animate-spin" />
              {t("Inapakia...", "Loading...")}
            </div>
          )}

          {error && !loading && (
            <div
              className="text-xs text-center py-3 rounded-lg"
              style={{
                color: COLORS.dangerText,
                background: "rgba(193,80,46,0.08)",
              }}
            >
              {error}
            </div>
          )}

          {activeTab === "profile" && !loading && !error && (
            <div
              className="rounded-xl p-3 text-xs space-y-1.5"
              style={{ background: "rgb(var(--c-page))" }}
            >
              <div className="flex justify-between gap-2">
                <span className="text-secondary flex items-center gap-1">
                  <Calendar size={11} />
                  {t("Alijiunga:", "Joined:")}
                </span>
                <span className="font-medium text-primary text-right">
                  {formatJoined(fullUser.date_joined || fullUser.joined)}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-secondary">Listings:</span>
                <span className="font-medium text-primary">
                  {loading ? "…" : listings.length}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-secondary">Sold:</span>
                <span className="font-medium text-primary">
                  {loading ? "…" : soldCount}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-secondary">Deals:</span>
                <span className="font-medium text-primary">
                  {loading ? "…" : deals.length}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-secondary">
                  {t("Hali ya Uthibitisho:", "Verified:")}
                </span>
                <span
                  className="font-medium"
                  style={{
                    color: fullUser.is_verified ? COLORS.successText : "rgb(var(--c-text-3))",
                  }}
                >
                  {fullUser.is_verified
                    ? t("Ndiyo", "Yes")
                    : t("Hapana", "No")}
                </span>
              </div>
            </div>
          )}

          {activeTab === "listings" && (
            <ListingsTab listings={listings} lang={lang} loading={loading} />
          )}

          {activeTab === "deals" && (
            <DealsTab deals={deals} lang={lang} loading={loading} />
          )}

          {activeTab === "sold" && (
            <SoldTab listings={listings} lang={lang} loading={loading} />
          )}
        </div>
      </div>
    </div>
  );
}