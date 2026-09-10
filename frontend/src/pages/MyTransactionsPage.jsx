import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Receipt,
  Search,
  Filter,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  CreditCard,
  HandCoins,
  Rocket,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { COLORS, FONTS, formatTZS, timeAgo } from "../components/shared";

// Transaction types
const TRANSACTION_TYPES = {
  listing_fee: { label: "Listing Fee", icon: CreditCard, color: COLORS.rust, bg: "rgba(193,80,46,0.12)" },
  reservation_fee: { label: "Reservation Fee", icon: HandCoins, color: COLORS.green, bg: "rgba(47,109,79,0.12)" },
  boost_fee: { label: "Boost Fee", icon: Rocket, color: COLORS.gold, bg: "rgba(232,163,61,0.12)" },
  sale: { label: "Mauzo", icon: TrendingUp, color: COLORS.green, bg: "rgba(47,109,79,0.16)" },
  purchase: { label: "Ununuzi", icon: HandCoins, color: "#2563EB", bg: "rgba(37,99,235,0.12)" },
};

const STATUS = {
  completed: { label: "Imekamilika", color: COLORS.green, bg: "rgba(47,109,79,0.12)", icon: CheckCircle },
  pending: { label: "Inasubiri", color: "#8A5A16", bg: "rgba(232,163,61,0.16)", icon: Clock },
  failed: { label: "Imeshindikana", color: COLORS.rust, bg: "rgba(193,80,46,0.12)", icon: XCircle },
  refunded: { label: "Imerejeshwa", color: COLORS.night, bg: "rgba(16,26,46,0.08)", icon: AlertCircle },
};

const SEED_TRANSACTIONS = [
  {
    id: "t1",
    ref: "SM-2026-0001",
    type: "listing_fee",
    title: "Listing Fee — Nyumba ya Ghorofa Mbezi Beach",
    property: "Nyumba ya Ghorofa Mbezi Beach",
    amount: 300000,
    status: "completed",
    method: "M-Pesa",
    at: "2026-08-28T10:00:00.000Z",
  },
  {
    id: "t2",
    ref: "SM-2026-0002",
    type: "boost_fee",
    title: "Featured Boost — Nyumba ya Ghorofa Mbezi Beach",
    property: "Nyumba ya Ghorofa Mbezi Beach",
    amount: 12000,
    status: "completed",
    method: "Tigo Pesa",
    at: "2026-09-01T14:30:00.000Z",
  },
  {
    id: "t3",
    ref: "SM-2026-0003",
    type: "listing_fee",
    title: "Listing Fee — Toyota Harrier 2016",
    property: "Toyota Harrier 2016",
    amount: 150000,
    status: "pending",
    method: "Airtel Money",
    at: "2026-09-07T09:15:00.000Z",
  },
  {
    id: "t4",
    ref: "SM-2026-0004",
    type: "sale",
    title: "Mauzo — Duka la Vifaa vya Ujenzi Kariakoo",
    property: "Duka la Vifaa vya Ujenzi — Kariakoo",
    amount: 14200000,
    status: "completed",
    method: "Benki (CRDB)",
    at: "2026-08-15T16:00:00.000Z",
  },
  {
    id: "t5",
    ref: "SM-2026-0005",
    type: "reservation_fee",
    title: "Reservation Fee — Kiwanja Ubungo",
    property: "Kiwanja Ubungo — Hati Miliki",
    amount: 50000,
    status: "completed",
    method: "HaloPesa",
    at: "2026-09-05T11:00:00.000Z",
  },
  {
    id: "t6",
    ref: "SM-2026-0006",
    type: "listing_fee",
    title: "Listing Fee — Excavator CAT 320D",
    property: "Excavator CAT 320D",
    amount: 180000,
    status: "refunded",
    method: "M-Pesa",
    at: "2026-06-02T08:00:00.000Z",
  },
];

function TransactionItem({ txn }) {
  const type = TRANSACTION_TYPES[txn.type] || TRANSACTION_TYPES.listing_fee;
  const status = STATUS[txn.status] || STATUS.pending;
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
            <p style={{ color: COLORS.night }} className="text-sm font-semibold truncate">
              {txn.title}
            </p>
            <p style={{ color: "rgba(16,26,46,0.5)" }} className="text-xs mt-0.5">
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
          <span style={{ color: "rgba(16,26,46,0.5)" }}>• {txn.method}</span>
          <span style={{ color: "rgba(16,26,46,0.4)" }}>• {timeAgo(txn.at)}</span>
        </div>
      </div>
    </div>
  );
}

export default function MyTransactionsPage() {
  const [transactions] = useState(SEED_TRANSACTIONS);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filters = [
    { key: "all", label: "Zote" },
    { key: "listing_fee", label: "Listing Fee" },
    { key: "boost_fee", label: "Boost" },
    { key: "reservation_fee", label: "Reservation" },
    { key: "sale", label: "Mauzo" },
  ];

  const filtered = transactions.filter((t) => {
    const matchesFilter = filter === "all" || t.type === filter;
    const matchesSearch =
      !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ref.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Totals
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

  return (
    <div style={{ background: COLORS.sand, fontFamily: FONTS.body, minHeight: "100%" }} className="w-full p-4 sm:p-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=Manrope:wght@400;500;600;700&display=swap');
      `}</style>

      <div className="max-w-4xl mx-auto">
        <h1 style={{ fontFamily: FONTS.display, color: COLORS.night }} className="text-2xl sm:text-3xl font-semibold mb-1">
          My Transactions
        </h1>
        <p style={{ color: "rgba(16,26,46,0.6)" }} className="text-sm mb-5">
          Fuatilia malipo, mauzo, na miamala yako yote.
        </p>

        {/* Totals */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div
            style={{ background: "white", borderColor: COLORS.sandLine }}
            className="rounded-xl border p-4"
          >
            <p style={{ color: "rgba(16,26,46,0.55)" }} className="text-xs mb-1">
              Jumla Iliyolipwa
            </p>
            <p style={{ color: COLORS.rust }} className="text-lg font-bold">
              {formatTZS(totals.spent)}
            </p>
          </div>
          <div
            style={{ background: "white", borderColor: COLORS.sandLine }}
            className="rounded-xl border p-4"
          >
            <p style={{ color: "rgba(16,26,46,0.55)" }} className="text-xs mb-1">
              Jumla Iliyopatikana
            </p>
            <p style={{ color: COLORS.green }} className="text-lg font-bold">
              {formatTZS(totals.earned)}
            </p>
          </div>
          <div
            style={{ background: COLORS.night, color: COLORS.sand, borderColor: COLORS.night }}
            className="rounded-xl border p-4"
          >
            <p className="text-xs mb-1 opacity-70">Idadi ya Miamala</p>
            <p className="text-lg font-bold">{transactions.length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tafuta kwa ref au jina..."
              style={{ background: "white", borderColor: COLORS.sandLine, color: COLORS.night }}
              className="w-full rounded-xl border pl-10 pr-3 py-2.5 text-sm outline-none"
            />
          </div>
          <button
            className="flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-xl border transition-colors"
            style={{ borderColor: COLORS.sandLine, color: COLORS.night, background: "white" }}
          >
            <Download size={14} />
            Pakua CSV
          </button>
        </div>

        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                background: filter === f.key ? COLORS.night : "white",
                color: filter === f.key ? COLORS.sand : COLORS.night,
                borderColor: COLORS.sandLine,
              }}
              className="text-xs font-semibold px-3.5 py-2 rounded-full border whitespace-nowrap shrink-0"
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div
            style={{ borderColor: COLORS.sandLine }}
            className="rounded-2xl border-2 border-dashed p-12 text-center bg-white"
          >
            <Receipt size={48} className="mx-auto text-gray-300 mb-3" />
            <h3 style={{ color: COLORS.night }} className="font-semibold mb-1">
              Hakuna miamala
            </h3>
            <p style={{ color: "rgba(16,26,46,0.55)" }} className="text-sm">
              {searchQuery ? "Jaribu kutafuta kwa neno lingine" : "Miamala yako itaonekana hapa."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((t) => (
              <TransactionItem key={t.id} txn={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
