// ============================================================
// MyTransactionsPage.jsx
// Miamala Yangu — API-backed success fee + PDF/CSV/DOC download.
// + FimiPay direct payment + Bundle purchase flow + Credits + Free.
//
// SASISHO:
//   - Inasoma fee fresh kutoka useSuccessFeeStatus() (sio stale)
//   - FimiPay direct payment kwa success fee
//   - Bundle purchase kama option ya pili
//   - Loading + error handling bora
// ============================================================
import React, { useState, useEffect, useRef } from "react";
import {
  Receipt,
  Search,
  Download,
  FileText,
  FileSpreadsheet,
  File,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  Wallet,
  Package,
  X,
} from "lucide-react";
import { COLORS, formatTZS, timeAgo } from "./dashboard/components/shared";
import { useTransactions } from "../config/transactionsStore.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useAuth } from "../config/authStore.js";
import {
  checkCredit,
  consumeCreditAsync,
} from "../config/userCreditsStore.js";
import { useActiveBundles } from "../config/bundlesStore.js";
import { api, getAccessToken } from "../api/client.js";
import PaymentGateway from "./dashboard/components/PaymentGateway";
import {
  useSuccessFeeConfig,
  useSuccessFeeStatus,
  hydrateSuccessFeeStatusFromApi,
  getSuccessFeeStatus,
} from "../config/successFeeStore.js";

// ============================================================
// CONSTANTS
// ============================================================
const TYPE_META = {
  listing_fee: {
    label: { sw: "Ada ya Kuchapisha", en: "Listing Fee" },
    color: COLORS.gold,
  },
  boost: {
    label: { sw: "Kukuza", en: "Boost" },
    color: "#2563EB",
  },
  leading: {
    label: { sw: "Kuongoza", en: "Leading" },
    color: COLORS.green,
  },
  advertisement: {
    label: { sw: "Matangazo", en: "Ads" },
    color: COLORS.rust,
  },
  reservation: {
    label: { sw: "Uhifadhi", en: "Reservation" },
    color: "#2563EB",
  },
  sale: {
    label: { sw: "Mauzo", en: "Sales" },
    color: COLORS.green,
  },
  purchase: {
    label: { sw: "Ununuzi", en: "Purchase" },
    color: "#7C3AED",
  },
  bundle_purchase: {
    label: { sw: "Vifurushi", en: "Bundles" },
    color: "#0891B2",
  },
  success_fee: {
    label: { sw: "Ada ya Mafanikio", en: "Success Fee" },
    color: "#7C3AED",
  },
};

const STATUS_META = {
  completed: {
    label: { sw: "Imekamilika", en: "Completed" },
    color: COLORS.green,
    Icon: CheckCircle,
  },
  pending: {
    label: { sw: "Inasubiri", en: "Pending" },
    color: "#D97706",
    Icon: Clock,
  },
  failed: {
    label: { sw: "Imeshindikana", en: "Failed" },
    color: COLORS.rust,
    Icon: XCircle,
  },
  cancelled: {
    label: { sw: "Imeghairiwa", en: "Cancelled" },
    color: COLORS.night,
    Icon: XCircle,
  },
};

// ============================================================
// HELPER — poll credits
// ============================================================
async function pollForCredit(
  userId,
  service,
  { attempts = 8, intervalMs = 2000 } = {}
) {
  for (let i = 0; i < attempts; i++) {
    const info = checkCredit(userId, service);
    if (info.hasCredit) {
      return { ok: true, remaining: info.remaining };
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return { ok: false };
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function MyTransactionsPage() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const transactions = useTransactions();

  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fee flow state
  const [showFeeFlow, setShowFeeFlow] = useState(false);
  const [format, setFormat] = useState("pdf");
  const [feeError, setFeeError] = useState("");

  // Credits state
  const [downloading, setDownloading] = useState(false);

  // ✅ FimiPay direct payment state
  const [showFeePayModal, setShowFeePayModal] = useState(false);
  const [feePayStage, setFeePayStage] = useState("select"); // "select" | "paying"
  const [feePayError, setFeePayError] = useState("");
  const [feePayBusy, setFeePayBusy] = useState(false);

  // Bundle flow state
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [pendingBundlePurchase, setPendingBundlePurchase] = useState(null);
  const [bundleError, setBundleError] = useState("");
  const [bundleLoading, setBundleLoading] = useState(false);
  const [bundleStage, setBundleStage] = useState("select");

  // Config + status
  const successFee = useSuccessFeeConfig();
  const status = useSuccessFeeStatus();

  useEffect(() => {
    if (!showBundleModal) setBundleStage("select");
  }, [showBundleModal]);

  const successBundles = useActiveBundles().filter(
    (b) => b.type === "success"
  );

  const creditInfo = checkCredit(user?.id, "success");
  const hasCredit = creditInfo.hasCredit;
  const creditRemaining = creditInfo.remaining || 0;

  // Fee inatoka `status` (fresh kutoka backend)
  const feeAmount = Number(status.fee) || 0;
  const requiresPayment = status.requires_payment;
  const isFree = status.is_free;

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const filters = [
    { key: "all", label: lang === "sw" ? "Zote" : "All" },
    { key: "listing_fee", label: t("Ada ya Kuchapisha", "Listing Fee") },
    { key: "boost", label: t("Kukuza", "Boost") },
    { key: "leading", label: t("Kuongoza", "Leading") },
    { key: "advertisement", label: t("Matangazo", "Ads") },
    { key: "reservation", label: t("Uhifadhi", "Reservation") },
    { key: "sale", label: t("Mauzo", "Sales") },
    { key: "bundle_purchase", label: t("Vifurushi", "Bundles") },
  ];

  const filtered = transactions.filter((tr) => {
    const matchesFilter = filter === "all" || tr.type === filter;
    const matchesSearch =
      !searchQuery ||
      tr.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tr.ref?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totals = transactions.reduce(
    (acc, tr) => {
      if (tr.status === "completed") {
        if (tr.type === "sale") acc.earned += tr.amount;
        else acc.spent += tr.amount;
      }
      return acc;
    },
    { earned: 0, spent: 0 }
  );

  // ============================================================
  // DOWNLOAD FLOW
  // ============================================================
  const handleDownloadClick = async () => {
    if (filtered.length === 0) return;
    setFeeError("");
    setBundleError("");
    // Sasisha fee fresh kabla ya kuonyesha modal
    await hydrateSuccessFeeStatusFromApi();
    setShowFeeFlow(true);
  };

  // ── Download file kwa fetch + JWT ────────────────────────
  const performDownload = async () => {
    setDownloading(true);
    setFeeError("");
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
      const url = `${baseUrl}/finance/success-fee/download/?format=${format}`;

      const token = getAccessToken();

      const response = await fetch(url, {
        method: "GET",
        credentials: "omit",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      // 204 = no transactions
      if (response.status === 204) {
        setFeeError(
          t("Hakuna miamala ya kupakua.", "No transactions to download.")
        );
        setDownloading(false);
        return;
      }

      // 402 = payment required
      if (response.status === 402) {
        const errorData = await response.json().catch(() => ({}));
        setFeeError(
          errorData?.message ||
            t(
              "Lipa ada ya mafanikio kwanza ili kupakua.",
              "Pay the success fee first to download."
            )
        );
        setDownloading(false);
        return;
      }

      // 401 = session expired
      if (response.status === 401) {
        setFeeError(
          t(
            "Kipindi kimeisha. Ingia tena.",
            "Session expired. Please log in again."
          )
        );
        setDownloading(false);
        return;
      }

      // Error nyingine
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData?.detail ||
            errorData?.message ||
            `Download failed: ${response.status}`
        );
      }

      // Blob → download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      const ext = format === "doc" ? "docx" : format;
      a.download = `miamala_${new Date().toISOString().slice(0, 10)}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setShowFeeFlow(false);
      setShowBundleModal(false);
      setShowFeePayModal(false);
      setPendingBundlePurchase(null);
      setDownloading(false);
    } catch (err) {
      setFeeError(
        err?.message ||
          t(
            "Download imeshindikana. Jaribu tena.",
            "Download failed. Try again."
          )
      );
      setDownloading(false);
    }
  };

  const handleModalConfirm = () => {
    if (isFree) {
      performDownload();
      return;
    }
    if (hasCredit) {
      handleCreditDownload();
      return;
    }
    // ✅ FimiPay direct payment
    setShowFeeFlow(false);
    setFeePayStage("select");
    setFeePayError("");
    setShowFeePayModal(true);
  };

  // ── Credit download ──────────────────────────────────────
  const handleCreditDownload = async () => {
    setDownloading(true);
    setFeeError("");
    try {
      const res = await consumeCreditAsync(user?.id, "success");
      if (!res.success && !res.ok) {
        setFeeError(
          t(
            "Hakuna success credit ya kutosha.",
            "No success credit available."
          )
        );
        setDownloading(false);
        return;
      }
      await performDownload();
    } catch (err) {
      setFeeError(err?.message || t("Imeshindikana.", "Failed."));
      setDownloading(false);
    }
  };

  // ============================================================
  // FIMIPAY DIRECT PAYMENT — Success Fee
  // ============================================================
  const handleFeePayInitiate = async ({ methodKey, phone } = {}) => {
    try {
      const raw = await api.post("/finance/success-fee/", {
        payment_method: methodKey || "mobile",
        phone: phone || "",
      });
      const fimipay = raw?.fimipay || raw?.data?.fimipay || {};
      return {
        ok: true,
        orderId: fimipay.order_id || null,
        gatewayUrl: fimipay.payment_gateway_url || null,
        simulated: !!fimipay.simulated,
        environment: fimipay.environment || "live",
      };
    } catch (err) {
      return { ok: false, error: err };
    }
  };

  const handleFeePaySuccess = async () => {
    setFeePayBusy(true);
    setFeePayError("");
    try {
      // Poll kama webhook imefika
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        await hydrateSuccessFeeStatusFromApi();
        const fresh = getSuccessFeeStatus();
        // Kama bado requires_payment, endelea kusubiri
        if (!fresh.requires_payment) break;
      }
      await performDownload();
      setShowFeePayModal(false);
    } catch (err) {
      setFeePayError(
        err?.message ||
          t(
            "Malipo yamefanyika lakini download imeshindikana.",
            "Payment went through but download failed."
          )
      );
    } finally {
      setFeePayBusy(false);
    }
  };

  // ============================================================
  // BUNDLE FLOW — purchase bundle kisha download
  // ============================================================
  const handleBundlePurchaseInitiate = async ({ methodKey, phone } = {}) => {
    if (!pendingBundlePurchase) {
      return { ok: false, error: new Error("No bundle selected") };
    }
    try {
      const purchase = await api.post("/bundles/purchases/", {
        bundle: pendingBundlePurchase.id,
      });
      const purchaseId =
        purchase?.id ||
        purchase?.purchase_id ||
        purchase?.purchaseId;
      if (!purchaseId) {
        throw new Error("Backend did not return purchase id.");
      }
      const paid = await api.post(
        `/bundles/purchases/${purchaseId}/pay/`,
        {
          payment_method: methodKey || "",
          phone: phone || "",
        }
      );
      const fimipay = paid?.fimipay || paid?.data?.fimipay || {};
      return {
        ok: true,
        orderId: fimipay.order_id,
        gatewayUrl: fimipay.payment_gateway_url || null,
        simulated: !!fimipay.simulated,
        environment: fimipay.environment || "live",
      };
    } catch (err) {
      setBundleError(
        err?.message ||
          t("Malipo yameshindikana.", "Payment failed.")
      );
      return { ok: false, error: err };
    }
  };

  // Poll kwa credits kabla ya kutuma download
  const handleBundleSuccess = async () => {
    setBundleLoading(true);
    setBundleError("");
    try {
      // Subiri webhook iingize credits
      const pollRes = await pollForCredit(user?.id, "success", {
        attempts: 10,
        intervalMs: 2000,
      });

      if (!pollRes.ok) {
        setBundleError(
          t(
            "Malipo yamefanyika lakini credits bado hazijaingia. Subiri sekunde chache na ujaribu tena.",
            "Payment went through but credits haven't arrived yet. Wait a moment and try again."
          )
        );
        setBundleLoading(false);
        return;
      }

      // Sasa tumia credit
      const res = await consumeCreditAsync(user?.id, "success");
      if (res.success || res.ok) {
        await performDownload();
      } else {
        setBundleError(
          t(
            "Imeshindwa kutumia credit. Jaribu tena.",
            "Failed to use credit. Try again."
          )
        );
      }
    } finally {
      setBundleLoading(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-5 py-6">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Receipt size={20} color={COLORS.gold} className="shrink-0" />
            <h1 className="text-lg sm:text-xl font-bold text-primary truncate">
              {t("Miamala Yangu", "My Transactions")}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-secondary">
            {t(
              "Fuatilia malipo yote, mafanikio, na miamala yako.",
              "Track all your payments, earnings, and transactions."
            )}
          </p>
        </div>

        <button
          onClick={handleDownloadClick}
          disabled={filtered.length === 0}
          style={{
            background:
              filtered.length > 0 ? COLORS.gold : COLORS.sandLine,
            color:
              filtered.length > 0 ? COLORS.night : "var(--text-muted)",
          }}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg shrink-0 disabled:cursor-not-allowed"
        >
          <Download size={14} />
          {t("Pakua Ripoti", "Download Report")}
        </button>
      </div>

      {/* ── Stats grid ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-xl border p-3 sm:p-4"
        >
          <p className="text-[10px] font-semibold text-secondary uppercase">
            {t("Jumla ya Miamala", "Total Transactions")}
          </p>
          <p
            style={{ color: "var(--text-primary)" }}
            className="text-lg font-bold mt-1"
          >
            {transactions.length}
          </p>
        </div>

        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-xl border p-3 sm:p-4"
        >
          <p className="text-[10px] font-semibold text-secondary uppercase">
            {t("Umetumia", "Spent")}
          </p>
          <p
            style={{ color: COLORS.rust }}
            className="text-lg font-bold mt-1 break-words"
          >
            {formatTZS(totals.spent)}
          </p>
        </div>

        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-xl border p-3 sm:p-4"
        >
          <p className="text-[10px] font-semibold text-secondary uppercase">
            {t("Umepata", "Earned")}
          </p>
          <p
            style={{ color: COLORS.green }}
            className="text-lg font-bold mt-1 break-words"
          >
            {formatTZS(totals.earned)}
          </p>
        </div>
      </div>

      {/* ── Search ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div
          className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 flex-1 min-w-0"
          style={{ borderColor: COLORS.sandLine }}
        >
          <Search size={14} className="text-muted shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("Tafuta...", "Search...")}
            className="outline-none text-xs flex-1 min-w-0"
          />
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────── */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              background: filter === f.key ? COLORS.night : "white",
              color:
                filter === f.key ? COLORS.sand : "var(--text-primary)",
              borderColor: COLORS.sandLine,
            }}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border whitespace-nowrap shrink-0"
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Transactions list ────────────────────────────── */}
      {filtered.length === 0 ? (
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-xl border-2 border-dashed p-10 text-center"
        >
          <Receipt size={40} className="mx-auto text-muted mb-3" />
          <p className="text-sm font-semibold text-primary mb-1">
            {t("Hakuna miamala", "No transactions")}
          </p>
          <p className="text-xs text-secondary">
            {t(
              "Miamala yako itaonekana hapa.",
              "Your transactions will appear here."
            )}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((tr) => {
            const meta = TYPE_META[tr.type] || {
              label: { sw: tr.type, en: tr.type },
              color: COLORS.night,
            };
            const stMeta = STATUS_META[tr.status] || STATUS_META.pending;
            const StatusIcon = stMeta.Icon;

            return (
              <div
                key={tr.id}
                style={{
                  borderColor: COLORS.sandLine,
                  background: "white",
                }}
                className="rounded-xl border p-3 sm:p-4 flex items-start gap-3"
              >
                <div
                  style={{ background: `${meta.color}15` }}
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                >
                  <StatusIcon size={16} color={stMeta.color} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      style={{
                        background: `${meta.color}15`,
                        color: meta.color,
                      }}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    >
                      {meta.label[lang]}
                    </span>
                    <span
                      style={{ color: stMeta.color }}
                      className="text-[10px] font-semibold flex items-center gap-0.5"
                    >
                      <StatusIcon size={10} />
                      {stMeta.label[lang]}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-primary truncate">
                    {tr.title}
                  </p>
                  {tr.property && (
                    <p className="text-xs text-secondary truncate mt-0.5">
                      {tr.property}
                    </p>
                  )}
                  <p className="text-[11px] text-muted mt-1">
                    {tr.ref} · {timeAgo(tr.at, lang)}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p
                    style={{
                      color:
                        tr.type === "sale" ? COLORS.green : COLORS.rust,
                    }}
                    className="text-sm font-bold"
                  >
                    {tr.type === "sale" ? "+" : "−"}
                    {formatTZS(tr.amount)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* FORMAT SELECTOR MODAL */}
      {/* ============================================================ */}
      {showFeeFlow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-primary">
                  {t("Pakua Ripoti", "Download Report")}
                </h3>
                <p className="text-xs text-secondary mt-0.5">
                  {isFree
                    ? t(
                        "Chagua format. Download ni bure.",
                        "Choose format. Download is free."
                      )
                    : t(
                        "Lipa ada ndogo ili kupakua ripoti ya miamala yako.",
                        "Pay a small fee to download your transactions report."
                      )}
                </p>
              </div>
              <button
                onClick={() => setShowFeeFlow(false)}
                className="p-1 text-muted hover:text-secondary shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Format selector */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { key: "pdf", Icon: FileText, label: "PDF" },
                { key: "csv", Icon: FileSpreadsheet, label: "CSV" },
                { key: "doc", Icon: File, label: "DOC" },
              ].map(({ key, Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setFormat(key)}
                  style={{
                    borderColor:
                      format === key ? COLORS.gold : COLORS.sandLine,
                    background:
                      format === key ? `${COLORS.gold}15` : "white",
                    color:
                      format === key ? "#8A5A16" : "var(--text-primary)",
                  }}
                  className="flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-colors"
                >
                  <Icon size={20} />
                  <span className="text-xs font-semibold">{label}</span>
                </button>
              ))}
            </div>

            {/* Fee summary */}
            {!isFree && (
              <div
                style={{
                  background: `${COLORS.gold}10`,
                  borderColor: `${COLORS.gold}40`,
                }}
                className="rounded-lg border px-3 py-2.5 mb-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-secondary">
                    {t("Ada ya Mafanikio", "Success Fee")}
                  </span>
                  <span
                    style={{ color: "#8A5A16" }}
                    className="text-sm font-bold"
                  >
                    {formatTZS(feeAmount)}
                  </span>
                </div>
                {hasCredit && (
                  <p
                    style={{ color: COLORS.green }}
                    className="text-[11px] mt-1 flex items-center gap-1"
                  >
                    <CheckCircle size={11} />
                    {t(
                      `Una credit ${creditRemaining} — unaweza kutumia`,
                      `You have ${creditRemaining} credit(s) — can use`
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Error */}
            {feeError && (
              <div
                style={{
                  background: `${COLORS.rust}10`,
                  color: COLORS.rust,
                }}
                className="text-xs font-semibold px-3 py-2 rounded-lg mb-3"
              >
                {feeError}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFeeFlow(false)}
                  disabled={downloading}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-secondary disabled:opacity-50"
                >
                  {t("Ghairi", "Cancel")}
                </button>
                <button
                  onClick={handleModalConfirm}
                  disabled={downloading}
                  style={{ background: COLORS.gold, color: COLORS.night }}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {downloading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      {t("Inapakia...", "Loading...")}
                    </>
                  ) : isFree ? (
                    <>
                      <Download size={14} />
                      {t("Pakua", "Download")}
                    </>
                  ) : hasCredit ? (
                    <>
                      <Wallet size={14} />
                      {t(
                        `Tumia Credit (${creditRemaining})`,
                        `Use Credit (${creditRemaining})`
                      )}
                    </>
                  ) : (
                    <>
                      <CreditCard size={14} />
                      {t(
                        `Lipa ${formatTZS(feeAmount)}`,
                        `Pay ${formatTZS(feeAmount)}`
                      )}
                    </>
                  )}
                </button>
              </div>

              {/* ✅ Option ya pili: Nunua kifurushi */}
              {!isFree && !hasCredit && (
                <button
                  onClick={() => {
                    setShowFeeFlow(false);
                    setShowBundleModal(true);
                  }}
                  disabled={downloading}
                  style={{
                    borderColor: COLORS.sandLine,
                    color: COLORS.green,
                    background: "white",
                  }}
                  className="w-full text-xs font-semibold py-2 rounded-lg border transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Package size={12} />
                  {t(
                    "Au nunua kifurushi (bei nafuu)",
                    "Or buy a bundle (cheaper)"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* FIMIPAY MODAL — Direct Success Fee Payment */}
      {/* ============================================================ */}
      {showFeePayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 max-h-[90vh] overflow-y-auto">
            {feePayStage === "paying" ? (
              <PaymentGateway
                amount={feeAmount}
                title={t("Lipa Ada ya Mafanikio", "Pay Success Fee")}
                description={t(
                  "Lipa ili kupakua ripoti ya miamala yako.",
                  "Pay to download your transactions report."
                )}
                onInitiate={handleFeePayInitiate}
                onSuccess={handleFeePaySuccess}
                onCancel={() => {
                  setShowFeePayModal(false);
                  setFeePayStage("select");
                }}
                lang={lang}
              />
            ) : (
              <>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-primary">
                      {t("Lipa Ada ya Mafanikio", "Pay Success Fee")}
                    </h3>
                    <p className="text-xs text-secondary mt-0.5">
                      {t(
                        "Chagua njia ya malipo.",
                        "Choose payment method."
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowFeePayModal(false)}
                    disabled={feePayBusy}
                    className="p-1 text-muted hover:text-secondary shrink-0 disabled:opacity-50"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div
                  style={{
                    background: `${COLORS.gold}10`,
                    borderColor: `${COLORS.gold}40`,
                  }}
                  className="rounded-lg border px-3 py-2.5 mb-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-secondary">
                      {t("Ada", "Fee")}
                    </span>
                    <span
                      style={{ color: "#8A5A16" }}
                      className="text-sm font-bold"
                    >
                      {formatTZS(feeAmount)}
                    </span>
                  </div>
                </div>

                {feePayError && (
                  <div
                    style={{
                      background: `${COLORS.rust}10`,
                      color: COLORS.rust,
                    }}
                    className="text-xs font-semibold px-3 py-2 rounded-lg mb-3"
                  >
                    {feePayError}
                  </div>
                )}

                <button
                  onClick={() => setFeePayStage("paying")}
                  disabled={feePayBusy}
                  style={{ background: COLORS.gold, color: COLORS.night }}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <CreditCard size={14} />
                  {t("Endelea Kulipa", "Continue to Pay")}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* BUNDLE MODAL — Alternative option */}
      {/* ============================================================ */}
      {showBundleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 max-h-[90vh] overflow-y-auto">
            {bundleStage === "pay" && pendingBundlePurchase ? (
              <PaymentGateway
                amount={pendingBundlePurchase.price}
                title={
                  pendingBundlePurchase.name?.[lang] ||
                  pendingBundlePurchase.name?.sw ||
                  t("Kifurushi", "Bundle")
                }
                onInitiate={handleBundlePurchaseInitiate}
                onSuccess={handleBundleSuccess}
                onCancel={() => setBundleStage("select")}
                lang={lang}
              />
            ) : (
              <>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-primary">
                      {t("Nunua Kifurushi", "Buy Bundle")}
                    </h3>
                    <p className="text-xs text-secondary mt-0.5">
                      {t(
                        "Nunua kifurushi cha success fee na upate credits nyingi.",
                        "Buy a success fee bundle and get multiple credits."
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowBundleModal(false)}
                    disabled={bundleLoading}
                    className="p-1 text-muted hover:text-secondary shrink-0 disabled:opacity-50"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Bundles list */}
                <div className="flex flex-col gap-2 mb-4">
                  {successBundles.map((b) => {
                    const bundleName =
                      b.name?.[lang] || b.name?.sw || b.code;
                    const isSelected = pendingBundlePurchase?.id === b.id;
                    return (
                      <button
                        key={b.id}
                        onClick={() => setPendingBundlePurchase(b)}
                        disabled={bundleLoading}
                        style={{
                          borderColor: isSelected
                            ? COLORS.gold
                            : COLORS.sandLine,
                          background: isSelected
                            ? `${COLORS.gold}10`
                            : "white",
                        }}
                        className="flex items-center gap-3 border-2 rounded-xl p-3 text-left transition-colors disabled:opacity-50"
                      >
                        <div
                          style={{ background: `${COLORS.gold}15` }}
                          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        >
                          <Package size={18} color="#8A5A16" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary truncate">
                            {bundleName}
                          </p>
                          <p className="text-[11px] text-secondary">
                            {b.credits?.success || 1}{" "}
                            {t("credits", "credits")}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p
                            style={{ color: COLORS.rust }}
                            className="text-sm font-bold"
                          >
                            {formatTZS(b.price)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {bundleError && (
                  <div
                    style={{
                      background: `${COLORS.rust}10`,
                      color: COLORS.rust,
                    }}
                    className="text-xs font-semibold px-3 py-2 rounded-lg mb-3"
                  >
                    {bundleError}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowBundleModal(false)}
                    disabled={bundleLoading}
                    className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-secondary disabled:opacity-50"
                  >
                    {t("Ghairi", "Cancel")}
                  </button>
                  <button
                    onClick={() => {
                      if (!pendingBundlePurchase) return;
                      setBundleStage("pay");
                    }}
                    disabled={!pendingBundlePurchase || bundleLoading}
                    style={{
                      background:
                        pendingBundlePurchase && !bundleLoading
                          ? COLORS.gold
                          : COLORS.sandLine,
                      color:
                        pendingBundlePurchase && !bundleLoading
                          ? COLORS.night
                          : "var(--text-muted)",
                    }}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    {bundleLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        {t("Inafanya...", "Processing...")}
                      </>
                    ) : (
                      <>
                        <CreditCard size={14} />
                        {t("Lipa", "Pay")}
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}