// ============================================================
// MyTransactionsPage.jsx
// Miamala Yangu — API-backed success fee + PDF/CSV/DOC download.
// Format: PDF (default, best for mobile), CSV (Excel), DOC (Word).
// Fee inatoka backend (SuccessFeeConfig.min_fee).
// Download ni free kama SuccessFeeConfig.is_enabled = false.
// ============================================================
import React, { useState, useEffect } from "react";
import {
  Receipt,
  Search,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  CreditCard,
  HandCoins,
  Rocket,
  TrendingUp,
  Megaphone,
  Package,
  Wallet,
  Loader2,
  FileText,
  FileSpreadsheet,
  File,
} from "lucide-react";
import { COLORS, formatTZS, timeAgo } from "./dashboard/components/shared";
import { useTransactions } from "../config/transactionsStore.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { api } from "../api/client.js";
import PaymentGateway from "./dashboard/components/PaymentGateway";

// ============================================================
// TRANSACTION TYPES — bilingual
// ============================================================
const getTransactionTypes = (lang) => ({
  listing_fee: {
    label: lang === "sw" ? "Ada ya Kuchapisha" : "Listing Fee",
    icon: CreditCard,
    color: COLORS.rust,
    bg: "rgba(193,80,46,0.12)",
  },
  reservation: {
    label: lang === "sw" ? "Ada ya Uhifadhi" : "Reservation Fee",
    icon: HandCoins,
    color: COLORS.green,
    bg: "rgba(47,109,79,0.12)",
  },
  boost: {
    label: lang === "sw" ? "Ada ya Kukuza Tangazo" : "Boost Fee",
    icon: Rocket,
    color: COLORS.gold,
    bg: "rgba(232,163,61,0.12)",
  },
  leading: {
    label: lang === "sw" ? "Ada ya Kuongoza" : "Leading Fee",
    icon: TrendingUp,
    color: "#2563EB",
    bg: "rgba(37,99,235,0.12)",
  },
  advertisement: {
    label: lang === "sw" ? "Ada ya Tangazo" : "Advertisement Fee",
    icon: Megaphone,
    color: COLORS.gold,
    bg: "rgba(232,163,61,0.12)",
  },
  sale: {
    label: lang === "sw" ? "Mauzo" : "Sale",
    icon: TrendingUp,
    color: COLORS.green,
    bg: "rgba(47,109,79,0.16)",
  },
  purchase: {
    label: lang === "sw" ? "Ununuzi" : "Purchase",
    icon: HandCoins,
    color: "#2563EB",
    bg: "rgba(37,99,235,0.12)",
  },
  bundle_purchase: {
    label: lang === "sw" ? "Ununuzi wa Kifurushi" : "Bundle Purchase",
    icon: Package,
    color: COLORS.gold,
    bg: "rgba(232,163,61,0.12)",
  },
  success_fee: {
    label: lang === "sw" ? "Ada ya Mafanikio" : "Success Fee",
    icon: Wallet,
    color: COLORS.green,
    bg: "rgba(47,109,79,0.12)",
  },
});

const getStatus = (lang) => ({
  completed: {
    label: lang === "sw" ? "Imekamilika" : "Completed",
    color: COLORS.green,
    bg: "rgba(47,109,79,0.12)",
    icon: CheckCircle,
  },
  pending: {
    label: lang === "sw" ? "Inasubiri" : "Pending",
    color: "#8A5A16",
    bg: "rgba(232,163,61,0.16)",
    icon: Clock,
  },
  failed: {
    label: lang === "sw" ? "Imeshindikana" : "Failed",
    color: COLORS.rust,
    bg: "rgba(193,80,46,0.12)",
    icon: XCircle,
  },
  refunded: {
    label: lang === "sw" ? "Imerejeshwa" : "Refunded",
    color: COLORS.night,
    bg: "rgba(16,26,46,0.08)",
    icon: AlertCircle,
  },
});

// ============================================================
// FORMAT OPTIONS
// ============================================================
const FORMAT_OPTIONS = [
  {
    key: "pdf",
    label: { sw: "PDF", en: "PDF" },
    desc: { sw: "Bora kwa simu", en: "Best for phone" },
    icon: FileText,
    color: COLORS.rust,
    bg: "rgba(193,80,46,0.12)",
  },
  {
    key: "csv",
    label: { sw: "CSV", en: "CSV" },
    desc: { sw: "Kwa Excel", en: "For Excel" },
    icon: FileSpreadsheet,
    color: COLORS.green,
    bg: "rgba(47,109,79,0.12)",
  },
  {
    key: "doc",
    label: { sw: "DOC", en: "DOC" },
    desc: { sw: "Kwa Word", en: "For Word" },
    icon: File,
    color: "#2563EB",
    bg: "rgba(37,99,235,0.12)",
  },
];

// ============================================================
// TRANSACTION ITEM
// ============================================================
function TransactionItem({ txn, lang }) {
  const types = getTransactionTypes(lang);
  const statuses = getStatus(lang);
  const type = types[txn.type] || types.listing_fee;
  const status = statuses[txn.status] || statuses.pending;
  const TypeIcon = type.icon;
  const StatusIcon = status.icon;

  return (
    <div
      style={{ background: "white", borderColor: COLORS.sandLine }}
      className="rounded-xl border p-4 flex items-start gap-3"
    >
      <div
        style={{ background: type?.bg || "#F5F3EC" }}
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
      >
        <TypeIcon size={18} color={type.color} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0">
            <p
              style={{ color: "var(--text-primary)" }}
              className="text-sm font-semibold truncate"
            >
              {txn.title}
            </p>
            <p
              style={{ color: "var(--text-muted)" }}
              className="text-xs mt-0.5"
            >
              Ref: <span className="font-mono">{txn.ref}</span>
            </p>
          </div>
          <span
            style={{
              background: status?.bg || "#F5F3EC",
              color: status?.color || "#101A2E",
            }}
            className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full shrink-0"
          >
            <StatusIcon size={11} />
            {status.label}
          </span>
        </div>

        <div className="flex items-center gap-4 mt-2 text-xs flex-wrap">
          <span style={{ color: type.color }} className="font-bold text-sm">
            {txn.type === "sale" ? "+" : "-"}
            {formatTZS(txn.amount)}
          </span>
          <span style={{ color: "var(--text-muted)" }}>• {txn.method}</span>
          <span style={{ color: "var(--text-muted)" }}>
            • {timeAgo(txn.at, lang)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// FORMAT SELECTOR MODAL
// ============================================================
function FormatSelectorModal({
  lang,
  status,
  format,
  setFormat,
  onConfirm,
  onClose,
  loading,
  error,
}) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const requiresPayment = status?.requires_payment ?? true;
  const fee = status?.fee || "0.00";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 max-h-[95vh] overflow-y-auto">
        <h3
          style={{ color: "var(--text-primary)" }}
          className="text-base font-semibold text-center mb-1"
        >
          {t("Pakua Ripoti ya Miamala", "Download Transactions Report")}
        </h3>
        <p
          style={{ color: "var(--text-secondary)" }}
          className="text-xs text-center mb-5"
        >
          {requiresPayment
            ? t(
                `Lipa ${formatTZS(Number(fee))} ili kupakua`,
                `Pay ${formatTZS(Number(fee))} to download`
              )
            : t(
                "Download ni bure. Chagua format unayotaka.",
                "Download is free. Choose your preferred format."
              )}
        </p>

        {/* Format options */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {FORMAT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = format === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setFormat(opt.key)}
                disabled={loading}
                style={{
                  borderColor: active ? opt.color : COLORS.sandLine,
                  background: active ? opt.bg : "white",
                }}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all disabled:opacity-50"
              >
                <div
                  style={{ background: opt.bg }}
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                >
                  <Icon size={18} color={opt.color} />
                </div>
                <span
                  style={{ color: active ? opt.color : "var(--text-primary)" }}
                  className="text-sm font-bold"
                >
                  {opt.label[lang] || opt.label.sw}
                </span>
                <span
                  style={{ color: "var(--text-muted)" }}
                  className="text-[10px] text-center leading-tight"
                >
                  {opt.desc[lang] || opt.desc.sw}
                </span>
              </button>
            );
          })}
        </div>

        {/* Fee info */}
        {requiresPayment && (
          <div
            style={{
              background: "rgba(232,163,61,0.10)",
              color: "#8A5A16",
              borderColor: "rgba(232,163,61,0.35)",
            }}
            className="rounded-xl border px-3 py-2.5 mb-4 text-xs text-center"
          >
            {t(
              `Ada ya Mafanikio: ${formatTZS(Number(fee))}`,
              `Success Fee: ${formatTZS(Number(fee))}`
            )}
          </div>
        )}

        {!requiresPayment && (
          <div
            style={{
              background: "rgba(47,109,79,0.10)",
              color: COLORS.green,
              borderColor: "rgba(47,109,79,0.35)",
            }}
            className="rounded-xl border px-3 py-2.5 mb-4 text-xs text-center font-semibold"
          >
            {t("Download ni BURE", "Download is FREE")}
          </div>
        )}

        {error && (
          <div
            style={{
              background: "rgba(193,80,46,0.1)",
              color: COLORS.rust,
            }}
            className="rounded-xl px-3 py-2 mb-3 text-xs text-center"
          >
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            style={{ borderColor: COLORS.sandLine }}
            className="flex-1 py-3 rounded-xl border text-sm font-semibold disabled:opacity-50"
          >
            {t("Ghairi", "Cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{ background: COLORS.gold, color: COLORS.night }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            {requiresPayment
              ? t("Lipa na Pakua", "Pay & Download")
              : t("Pakua", "Download")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function MyTransactionsPage({ transactions: transactionsProp }) {
  const { lang } = useLanguage();
  const storeTransactions = useTransactions();
  const transactions = transactionsProp ?? storeTransactions;
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFeeFlow, setShowFeeFlow] = useState(false);
  const [feeError, setFeeError] = useState("");
  const [format, setFormat] = useState("pdf");
  const [status, setStatus] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const t = (sw, en) => (lang === "sw" ? sw : en);

  // ============================================================
  // LOAD SUCCESS FEE STATUS FROM BACKEND
  // ============================================================
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/finance/success-fee/status/");
        if (!cancelled) setStatus(res);
      } catch (err) {
        console.warn("[MyTransactions] status fetch failed:", err);
        // Fallback: assume requires payment
        if (!cancelled) {
          setStatus({
            requires_payment: true,
            is_free: false,
            fee: "5000.00",
            formats: ["pdf", "csv", "doc"],
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filters = [
    { key: "all", label: lang === "sw" ? "Zote" : "All" },
    {
      key: "listing_fee",
      label: lang === "sw" ? "Ada ya Kuchapisha" : "Listing Fee",
    },
    { key: "boost", label: lang === "sw" ? "Kukuza" : "Boost" },
    { key: "leading", label: lang === "sw" ? "Kuongoza" : "Leading" },
    { key: "advertisement", label: lang === "sw" ? "Matangazo" : "Ads" },
    { key: "reservation", label: lang === "sw" ? "Uhifadhi" : "Reservation" },
    { key: "sale", label: lang === "sw" ? "Mauzo" : "Sales" },
    {
      key: "bundle_purchase",
      label: lang === "sw" ? "Vifurushi" : "Bundles",
    },
  ];

  const filtered = transactions.filter((tr) => {
    const matchesFilter = filter === "all" || tr.type === filter;
    const matchesSearch =
      !searchQuery ||
      tr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tr.ref.toLowerCase().includes(searchQuery.toLowerCase());
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
  const handleDownloadClick = () => {
    if (filtered.length === 0) return;
    setFeeError("");
    setShowFeeFlow(true);
  };

  // Actual download from backend
  const performDownload = async () => {
    setDownloading(true);
    setFeeError("");
    try {
      // Trigger backend file download
      const url = `/api/finance/success-fee/download/?format=${format}`;
      // Use window.location for direct file download
      // Backend sets Content-Disposition: attachment
      window.location.href = url;
      // Close modal after brief delay
      setTimeout(() => {
        setShowFeeFlow(false);
        setDownloading(false);
      }, 800);
    } catch (err) {
      setFeeError(
        err?.message ||
          t("Download imeshindikana. Jaribu tena.", "Download failed. Try again.")
      );
      setDownloading(false);
    }
  };

  // Free download path
  const handleFreeDownload = async () => {
    if (status?.is_free) {
      return performDownload();
    }
    return null;
  };

  // ============================================================
  // PAYMENT FLOW (when success fee is enabled)
  // ============================================================
  const handleFeeInitiate = async ({ methodKey, phone } = {}) => {
    setFeeError("");
    try {
      const feeRes = await api.post("/finance/success-fee/", {
        purpose: "transactions",
        format,
        payment_method: methodKey || "",
        phone: phone || "",
      });
      const candidates = [
        feeRes?.fimipay,
        feeRes?.data?.fimipay,
        feeRes?.data,
        feeRes,
      ].filter(Boolean);
      const payload =
        candidates.find((c) => c && (c.order_id || c.payment_status)) || {};
      return {
        ok: true,
        orderId: payload.order_id || null,
        paymentStatus: (payload.payment_status || "").toUpperCase() || null,
        transid: payload.transid || null,
        gatewayUrl: payload.payment_gateway_url || null,
        simulated: !!payload.simulated,
        environment: payload.environment || "live",
      };
    } catch (err) {
      const msg =
        err?.data?.detail ||
        err?.data?.message ||
        err?.message ||
        t("Malipo yameshindikana. Jaribu tena.", "Payment failed. Try again.");
      setFeeError(msg);
      return { ok: false, error: err };
    }
  };

  const handleFeeSuccess = async () => {
    // After payment success, trigger backend download
    await performDownload();
  };

  // Modal confirm handler
  const handleModalConfirm = () => {
    if (status?.is_free) {
      performDownload();
    }
    // Kama requires payment, PaymentGateway itaonekana baada ya modal
    // (tunaacha showFeeFlow = true)
  };

  // ============================================================
  // DECIDE FLOW: free download OR payment
  // ============================================================
  const requiresPayment = status?.requires_payment ?? true;

  return (
    <div
      style={{ background: COLORS.sand, minHeight: "100%" }}
      className="w-full p-4 sm:p-6"
    >
      <div className="max-w-4xl mx-auto">
        {/* HEADER — CENTERED */}
        <div className="mb-5 text-center">
          <h1
            style={{ color: "var(--text-primary)" }}
            className="text-2xl sm:text-3xl font-semibold"
          >
            {lang === "sw" ? "Miamala Yangu" : "My Transactions"}
          </h1>
          <p
            style={{ color: "var(--text-secondary)" }}
            className="text-sm mt-2 max-w-xl mx-auto"
          >
            {lang === "sw"
              ? "Fuatilia malipo, mauzo, na miamala yako yote."
              : "Track your payments, sales, and all transactions."}
          </p>
        </div>

        {/* SUMMARY CARDS — consistent white backgrounds */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div
            style={{ background: "white", borderColor: COLORS.sandLine }}
            className="rounded-xl border p-4 text-center"
          >
            <p
              style={{ color: "var(--text-secondary)" }}
              className="text-xs mb-1"
            >
              {lang === "sw" ? "Jumla Iliyolipwa" : "Total Spent"}
            </p>
            <p style={{ color: COLORS.rust }} className="text-lg font-bold">
              {formatTZS(totals.spent)}
            </p>
          </div>
          <div
            style={{ background: "white", borderColor: COLORS.sandLine }}
            className="rounded-xl border p-4 text-center"
          >
            <p
              style={{ color: "var(--text-secondary)" }}
              className="text-xs mb-1"
            >
              {lang === "sw" ? "Jumla Iliyopatikana" : "Total Earned"}
            </p>
            <p style={{ color: COLORS.green }} className="text-lg font-bold">
              {formatTZS(totals.earned)}
            </p>
          </div>
          <div
            style={{ background: "white", borderColor: COLORS.sandLine }}
            className="rounded-xl border p-4 text-center"
          >
            <p
              style={{ color: "var(--text-secondary)" }}
              className="text-xs mb-1"
            >
              {lang === "sw" ? "Idadi ya Miamala" : "Number of Transactions"}
            </p>
            <p style={{ color: "var(--text-primary)" }} className="text-lg font-bold">
              {transactions.length}
            </p>
          </div>
        </div>

        {/* SEARCH + DOWNLOAD */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4 max-w-2xl mx-auto">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === "sw"
                  ? "Tafuta kwa ref au jina..."
                  : "Search by ref or title..."
              }
              style={{
                background: "white",
                borderColor: COLORS.sandLine,
                color: "var(--text-primary)",
              }}
              className="w-full rounded-xl border pl-10 pr-3 py-2.5 text-sm outline-none text-center"
            />
          </div>
          <button
            onClick={handleDownloadClick}
            disabled={filtered.length === 0}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-xl border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              borderColor: COLORS.sandLine,
              color: "var(--text-primary)",
              background: "white",
            }}
          >
            <Download size={14} />
            {lang === "sw" ? "Pakua Ripoti" : "Download Report"}
          </button>
        </div>

        {/* FILTER TABS */}
        <div className="flex justify-center gap-2 mb-5 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                background: filter === f.key ? COLORS.night : "white",
                color: filter === f.key ? COLORS.sand : "var(--text-primary)",
                borderColor: COLORS.sandLine,
              }}
              className="text-xs font-semibold px-3.5 py-2 rounded-full border whitespace-nowrap shrink-0"
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* EMPTY STATE */}
        {filtered.length === 0 ? (
          <div
            style={{ borderColor: COLORS.sandLine }}
            className="rounded-2xl border-2 border-dashed p-12 text-center bg-white"
          >
            <Receipt size={48} className="mx-auto text-muted mb-3" />
            <h3
              style={{ color: "var(--text-primary)" }}
              className="font-semibold mb-1"
            >
              {lang === "sw" ? "Hakuna miamala" : "No transactions"}
            </h3>
            <p style={{ color: "var(--text-secondary)" }} className="text-sm">
              {searchQuery
                ? lang === "sw"
                  ? "Jaribu kutafuta kwa neno lingine"
                  : "Try searching with a different term"
                : lang === "sw"
                  ? "Miamala yako itaonekana hapa."
                  : "Your transactions will appear here."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((tr) => (
              <TransactionItem key={tr.id} txn={tr} lang={lang} />
            ))}
          </div>
        )}
      </div>

      {/* FORMAT SELECTOR MODAL */}
      {showFeeFlow && !requiresPayment && (
        <FormatSelectorModal
          lang={lang}
          status={status}
          format={format}
          setFormat={setFormat}
          onConfirm={handleModalConfirm}
          onClose={() => {
            setShowFeeFlow(false);
            setFeeError("");
          }}
          loading={downloading}
          error={feeError}
        />
      )}

      {/* PAYMENT FLOW — when success fee is enabled */}
      {showFeeFlow && requiresPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="w-full max-w-md my-4">
            {/* Format selector juu ya PaymentGateway */}
            <div
              style={{ background: "white", borderColor: COLORS.sandLine }}
              className="rounded-2xl border p-4 mb-3"
            >
              <p
                style={{ color: "var(--text-primary)" }}
                className="text-sm font-semibold text-center mb-3"
              >
                {t("Chagua Format", "Choose Format")}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {FORMAT_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const active = format === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => setFormat(opt.key)}
                      style={{
                        borderColor: active ? opt.color : COLORS.sandLine,
                        background: active ? opt.bg : "white",
                      }}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all"
                    >
                      <Icon size={16} color={opt.color} />
                      <span
                        style={{
                          color: active ? opt.color : "var(--text-primary)",
                        }}
                        className="text-xs font-bold"
                      >
                        {opt.label[lang] || opt.label.sw}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {feeError && (
              <div
                style={{
                  background: "rgba(193,80,46,0.1)",
                  color: COLORS.rust,
                }}
                className="rounded-xl px-3 py-2 mb-3 text-xs text-center"
              >
                {feeError}
              </div>
            )}

            <PaymentGateway
              amount={Number(status?.fee || 0)}
              title={
                lang === "sw"
                  ? `Pakua Ripoti (${format.toUpperCase()})`
                  : `Download Report (${format.toUpperCase()})`
              }
              description={
                lang === "sw"
                  ? "Lipa ada ndogo ili kupakua ripoti ya miamala yako."
                  : "Pay a small fee to download your transactions report."
              }
              onInitiate={handleFeeInitiate}
              onSuccess={handleFeeSuccess}
              onCancel={() => {
                setShowFeeFlow(false);
                setFeeError("");
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
