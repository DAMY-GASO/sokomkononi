import React, { useState } from "react";
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
} from "lucide-react";
import {
  COLORS,
  formatTZS,
  timeAgo,
} from "./dashboard/components/shared";
import { useTransactions } from "../config/transactionsStore.js";
import { useLanguage } from "../context/LanguageContext.jsx";

// ============================================================
// TRANSACTION TYPES — bilingual kamili
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
// SUCCESS FEE — ada ndogo inayolipwa KILA download ya CSV
// ============================================================
const SUCCESS_FEE_TZS = 5000;

// ============================================================
// CSV HELPERS — inajizalisha moja kwa moja kutoka kwenye
// miamala inayoonekana kwa sasa (baada ya filter/search)
// ============================================================
function buildTransactionsCSV(transactions, lang) {
  const types = getTransactionTypes(lang);
  const statuses = getStatus(lang);

  const headers =
    lang === "sw"
      ? ["Ref", "Aina", "Kichwa", "Kiasi (TZS)", "Njia", "Hali", "Tarehe"]
      : ["Ref", "Type", "Title", "Amount (TZS)", "Method", "Status", "Date"];

  const escapeCell = (val) => {
    const str = String(val ?? "");
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };

  const rows = transactions.map((t) => {
    const typeLabel = (types[t.type] || types.listing_fee).label;
    const statusLabel = (statuses[t.status] || statuses.pending).label;
    const dateStr = new Date(t.at).toLocaleDateString(
      lang === "sw" ? "sw-TZ" : "en-GB"
    );
    return [
      t.ref,
      typeLabel,
      t.title,
      t.amount,
      t.method,
      statusLabel,
      dateStr,
    ]
      .map(escapeCell)
      .join(",");
  });

  return [headers.map(escapeCell).join(","), ...rows].join("\n");
}

function downloadCSV(csvContent, filename) {
  // \uFEFF (BOM) ili Excel isome herufi vizuri
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================
// TRANSACTION ITEM — kadi zimeachwa kushoto (data nyingi)
// ============================================================
function TransactionItem({ txn, lang }) {
  const type =
    getTransactionTypes(lang)[txn.type] ||
    getTransactionTypes(lang).listing_fee;
  const status = getStatus(lang)[txn.status] || getStatus(lang).pending;
  const TypeIcon = type.icon;
  const StatusIcon = status.icon;

  return (
    <div
      style={{ background: "white", borderColor: COLORS.sandLine }}
      className="rounded-xl border p-4 flex items-start gap-3"
    >
      <div
        style={{ background: type.bg }}
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
            style={{ background: status.bg, color: status.color }}
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
// MAIN COMPONENT
// ============================================================
export default function MyTransactionsPage({ transactions: transactionsProp }) {
  const { lang } = useLanguage();
  const storeTransactions = useTransactions();
  const transactions = transactionsProp ?? storeTransactions;
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const filtered = transactions.filter((t) => {
    const matchesFilter = filter === "all" || t.type === filter;
    const matchesSearch =
      !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ref.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totals = transactions.reduce(
    (acc, t) => {
      if (t.status === "completed") {
        if (t.type === "sale") acc.earned += t.amount;
        else acc.spent += t.amount;
      }
      return acc;
    },
    { earned: 0, spent: 0 }
  );

  const handleDownloadClick = () => {
    if (filtered.length === 0) return;
    setShowFeeModal(true);
  };

  const handleConfirmPayment = () => {
    setIsProcessing(true);
    // Demo ya frontend pekee — hapa ndipo backend halisi
    // itaunganishwa (mfano M-Pesa push) kabla ya kuruhusu download.
    setTimeout(() => {
      const csv = buildTransactionsCSV(filtered, lang);
      const filename = `miamala_${new Date().toISOString().slice(0, 10)}.csv`;
      downloadCSV(csv, filename);
      setIsProcessing(false);
      setShowFeeModal(false);
    }, 1200);
  };

  return (
    <div
      style={{
        background: COLORS.sand,
        minHeight: "100%",
      }}
      className="w-full p-4 sm:p-6"
    >

      <div className="max-w-4xl mx-auto">
        {/* ============================================================ */}
        {/* HEADER — CENTERED */}
        {/* ============================================================ */}
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

        {/* ============================================================ */}
        {/* SUMMARY CARDS — CENTERED */}
        {/* ============================================================ */}
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
            style={{
              background: COLORS.night,
              color: COLORS.sand,
              borderColor: COLORS.night,
            }}
            className="rounded-xl border p-4 text-center"
          >
            <p className="text-xs mb-1 opacity-70">
              {lang === "sw" ? "Idadi ya Miamala" : "Number of Transactions"}
            </p>
            <p className="text-lg font-bold">{transactions.length}</p>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SEARCH + DOWNLOAD — CENTERED */}
        {/* ============================================================ */}
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
            {lang === "sw" ? "Pakua CSV" : "Download CSV"}
          </button>
        </div>

        {/* ============================================================ */}
        {/* FILTER TABS — CENTERED */}
        {/* ============================================================ */}
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

        {/* ============================================================ */}
        {/* EMPTY STATE — CENTERED */}
        {/* ============================================================ */}
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
            <p
              style={{ color: "var(--text-secondary)" }}
              className="text-sm"
            >
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
          /* ============================================================ */
          /* LIST — kadi zimeachwa kushoto kwa data nyingi */
          /* ============================================================ */
          <div className="flex flex-col gap-3">
            {filtered.map((t) => (
              <TransactionItem key={t.id} txn={t} lang={lang} />
            ))}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* SUCCESS FEE MODAL — inaonekana kila mara mtumiaji anapotaka */}
      {/* kupakua CSV; malipo yakithibitika, download inaanza yenyewe */}
      {/* ============================================================ */}
      {showFeeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "var(--text-secondary)" }}
        >
          <div
            style={{ background: "white" }}
            className="w-full max-w-sm rounded-2xl p-6 text-center"
          >
            <div
              style={{ background: "rgba(47,109,79,0.12)" }}
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Wallet size={26} color={COLORS.green} />
            </div>
            <h3
              style={{ color: "var(--text-primary)" }}
              className="text-lg font-semibold mb-1"
            >
              {lang === "sw"
                ? "Ada ya Mafanikio Inahitajika"
                : "Success Fee Required"}
            </h3>
            <p
              style={{ color: "var(--text-secondary)" }}
              className="text-sm mb-4"
            >
              {lang === "sw"
                ? "Lipa ada ndogo ili kupakua ripoti ya miamala yako kama CSV."
                : "Pay a small fee to download your transactions report as CSV."}
            </p>
            <div
              style={{ background: COLORS.sand, borderColor: COLORS.sandLine }}
              className="rounded-xl border p-3 mb-5"
            >
              <p
                style={{ color: "var(--text-secondary)" }}
                className="text-xs mb-1"
              >
                {lang === "sw" ? "Kiasi cha Kulipa" : "Amount to Pay"}
              </p>
              <p style={{ color: "var(--text-primary)" }} className="text-xl font-bold">
                {formatTZS(SUCCESS_FEE_TZS)}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleConfirmPayment}
                disabled={isProcessing}
                style={{ background: COLORS.green, color: "white" }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {lang === "sw" ? "Inachakata..." : "Processing..."}
                  </>
                ) : (
                  <>
                    <Wallet size={16} />
                    {lang === "sw"
                      ? `Lipa ${formatTZS(SUCCESS_FEE_TZS)}`
                      : `Pay ${formatTZS(SUCCESS_FEE_TZS)}`}
                  </>
                )}
              </button>
              <button
                onClick={() => setShowFeeModal(false)}
                disabled={isProcessing}
                style={{ color: "var(--text-primary)" }}
                className="w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
              >
                {lang === "sw" ? "Ghairi" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
