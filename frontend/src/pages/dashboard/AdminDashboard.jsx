import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import {
  useReservationRates,
  updateReservationRate,
} from "../../config/feePolicy.js";
import { useDeals, resolveDispute } from "../../config/dealsStore.js";
import { useUsers, toggleUserStatus } from "../../config/usersStore.js";
import { useListings, decideListing } from "../../config/listingsStore.js";
import { useBoostPackages, updateBoostPackagePrice } from "../../config/boostPackagesStore.js";
import { useListingFeeConfigs, updateListingFeeConfig } from "../../config/listingFeeStore.js";
import { useLeadingFeeConfig, updateLeadingFeePrice } from "../../config/leadingFeeStore.js";
import { useAdvertisementFeeConfig, updateAdvertisementFeePrice } from "../../config/advertisementFeeStore.js";
import {
  useAnnouncements,
  addAnnouncement,
  removeAnnouncement,
  ANNOUNCEMENT_TYPES,
} from "../../config/announcementsStore.js";
import {
  useWebhooks,
  addWebhook,
  removeWebhook,
  toggleWebhook,
  useSubAdmins,
  addSubAdmin,
  removeSubAdmin,
  PERMISSION_OPTIONS,
  useAppStoreLinks,
  saveAppStoreLinks,
} from "../../config/systemSettingsStore.js";
import { useNotifications } from "../../config/notificationsStore.js";
import {
  Users,
  Home,
  ShoppingBag,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  Search,
  Filter,
  Download,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  MessagesSquare,
  Wallet,
  Settings as SettingsIcon,
  Ban,
  RotateCcw,
  Menu,
  X,
  Webhook,
  UserCog,
  Smartphone,
  Plus,
  Trash2,
  Pencil,
  Save,
  Link2,
  Bell,
  AlertTriangle,
  CreditCard,
  Flag,
  Megaphone,
  Star,
  Rocket,
} from "lucide-react";

const COLORS = {
  night: "#101A2E",
  sand: "#F5F3EC",
  gold: "#E8A33D",
  green: "#2F6D4F",
  rust: "#C1502E",
  nightSoft: "#1B2740",
  sandLine: "#E6E2D6",
};

const FONTS = {
  display: "'Fraunces', serif",
  body: "'Manrope', sans-serif",
};

// ============================================================
// MOCK DATA
// ============================================================

const STATS = [
  { id: "users", label: "Watumiaji", value: "12,847", change: "+12.5%", icon: Users, color: COLORS.gold },
  { id: "properties", label: "Mali", value: "8,234", change: "+8.3%", icon: Home, color: COLORS.green },
  { id: "deals", label: "Deals", value: "2,451", change: "+15.7%", icon: ShoppingBag, color: "#2563EB" },
  { id: "revenue", label: "Mapato", value: "TSh 4.2M", change: "+22.1%", icon: DollarSign, color: COLORS.rust },
];

const CHART_DATA = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  users: [120, 150, 180, 200, 220, 180, 160],
  properties: [80, 100, 120, 140, 160, 130, 110],
  deals: [40, 50, 60, 70, 80, 65, 55],
};

// Users mock imehamishiwa ../../config/usersStore.js (SEED_USERS).
// Listings mock imehamishiwa ../../config/listingsStore.js (SEED_LISTINGS) —
// hii ndiyo listing ZILEZILE zinazoonekana kwenye "My Listings" ya muuzaji
// (DashboardShell.jsx).
// Deals mock imehamishiwa ../../config/dealsStore.js (SEED_DEALS) —
// hii ndiyo deal ZILEZILE zinazoonekana kwenye DealRooms.jsx.

// Listing Fee tiers za zamani hapa (bei-ya-mali → fee flat) hazikuwa
// na uhusiano wowote na fomula halisi (rate% + min/max kwa category)
// inayotumika kuunda listing — zimeondolewa. Configs halisi sasa
// zinatoka ../../config/listingFeeStore.js.

const INITIAL_FEATURED_PLACEMENTS = [
  { id: "homepage", label: "Homepage", fee: 50000 },
  { id: "top_category", label: "Top of Category", fee: 30000 },
  { id: "featured_section", label: "Featured Section", fee: 25000 },
  { id: "search_priority", label: "Search Priority", fee: 10000 },
];

// Boosting Fee ya zamani hapa (flat "TZS 15,000/wiki") haikuwa na
// uhusiano wowote na bei halisi za BoostSasa (Basic/Featured/Premium
// kwa siku) — imeondolewa. Bei halisi za Boost sasa zinatoka
// ../../config/boostPackagesStore.js (BoostPackagesCard hapa chini).

// Leading Fee na Advertisement Fee za zamani hapa (INITIAL_FLAT_FEES,
// namba tuli) hazikuwa na uhusiano wowote na bidhaa halisi — hakuna
// listing iliyowahi "kupanda juu" wala banner iliyowahi kuonekana.
// Sasa: Leading Fee inatoka ../../config/leadingFeeStore.js (na
// kuathiri mpangilio wa BrowseProperties.jsx kupitia isLeadingActive),
// na Advertisement Fee inatoka ../../config/advertisementFeeStore.js
// (banner halisi zinaundwa na AdvertiseSasa.jsx ndani ya
// bannerAdsStore.js, na kuonekana kwenye DashboardShell.jsx). Icons
// pekee ndizo zilizobaki tuli hapa chini.
const FLAT_FEE_ICONS = {
  leading: Search,
  ads: Smartphone,
};

// Webhooks, Sub-Admins, App Store Links mock zimehamishiwa
// ../../config/systemSettingsStore.js (SEED_WEBHOOKS, SEED_SUBADMINS,
// SEED_APP_STORE_LINKS) — PERMISSION_OPTIONS pia inatoka huko.
// Announcements mock imehamishiwa ../../config/announcementsStore.js
// (SEED_ANNOUNCEMENTS, ANNOUNCEMENT_TYPES) — ndiyo yanayoonekana kwenye
// ticker ya mtumiaji (DashboardShell.jsx).

// Admin notifications mock (INITIAL_ADMIN_NOTIFICATIONS) imehamishiwa
// ../../config/notificationsStore.js (SEED_NOTIFICATIONS, audience: "admin")
// — chanzo kimoja cha ukweli na taarifa za mtumiaji (NotificationsPage.jsx).
// Matukio halisi ya Boost/Leading Fee/Advertisement/Listing Fee sasa
// yanaunda taarifa hapa moja kwa moja (angalia notifyBoostPurchased n.k
// ndani ya notificationsStore.js), pamoja na zile za zamani (moderation,
// disputes, payment issues, fraud) ambazo bado ni seed hadi ziunganishwe
// na matukio yake halisi (Awamu inayofuata).
const ADMIN_NOTIFICATION_ICONS = {
  listing_pending: Home,
  dispute: Flag,
  payment_issue: CreditCard,
  fraud_flag: AlertTriangle,
  boost: Rocket,
  leading: Search,
  ads: Smartphone,
  listing_fee: CreditCard,
};

// Muda halisi (ISO) -> "Dakika 5 zilizopita" / "Saa 1 iliyopita" / n.k,
// mtindo uleule wa timeAgo() (shared.js) unaotumika upande wa mtumiaji.
function timeAgo(dateStr) {
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "Sasa hivi";
  if (mins < 60) return `Dakika ${mins} zilizopita`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours === 1 ? "Saa 1 iliyopita" : `Masaa ${hours} yaliyopita`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Jana";
  return `Siku ${days} zilizopita`;
}

const NAV = [
  { key: "overview", label: "Overview & Analytics", icon: LayoutDashboard },
  { key: "users", label: "User Management", icon: Users },
  { key: "moderation", label: "Listing & Ads Moderation", icon: ShieldCheck },
  { key: "deals", label: "Deal Rooms & Disputes", icon: MessagesSquare },
  { key: "revenue", label: "Revenue & Financial Settings", icon: Wallet },
  { key: "system", label: "System Settings", icon: SettingsIcon },
];

// ============================================================
// SHARED UI
// ============================================================

function StatCard({ stat }) {
  const Icon = stat.icon;
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
          <p className="text-xs text-green-600 mt-1">{stat.change}</p>
        </div>
        <div style={{ background: `${stat.color}15` }} className="w-12 h-12 rounded-xl flex items-center justify-center">
          <Icon size={22} color={stat.color} />
        </div>
      </div>
    </div>
  );
}

function SimpleChart() {
  const maxValue = Math.max(...CHART_DATA.users, ...CHART_DATA.properties, ...CHART_DATA.deals);
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Weekly Activity</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#E8A33D]"></span><span className="text-xs text-gray-500">Users</span></div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#2F6D4F]"></span><span className="text-xs text-gray-500">Properties</span></div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#C1502E]"></span><span className="text-xs text-gray-500">Deals</span></div>
        </div>
      </div>
      <div className="h-48 flex items-end gap-2">
        {CHART_DATA.labels.map((label, index) => {
          const userHeight = (CHART_DATA.users[index] / maxValue) * 100;
          const propertyHeight = (CHART_DATA.properties[index] / maxValue) * 100;
          const dealHeight = (CHART_DATA.deals[index] / maxValue) * 100;
          return (
            <div key={label} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex justify-center gap-1">
                <div className="w-4 rounded-t-sm bg-[#E8A33D] transition-all duration-500" style={{ height: `${userHeight}%`, minHeight: "4px" }}></div>
                <div className="w-4 rounded-t-sm bg-[#2F6D4F] transition-all duration-500" style={{ height: `${propertyHeight}%`, minHeight: "4px" }}></div>
                <div className="w-4 rounded-t-sm bg-[#C1502E] transition-all duration-500" style={{ height: `${dealHeight}%`, minHeight: "4px" }}></div>
              </div>
              <span className="text-xs text-gray-400">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    active: { label: "Active", color: "bg-green-100 text-green-700" },
    pending: { label: "Inasubiri", color: "bg-yellow-100 text-yellow-700" },
    inactive: { label: "Haifanyi Kazi", color: "bg-gray-100 text-gray-500" },
    suspended: { label: "Amesimamishwa", color: "bg-red-100 text-red-700" },
    verified: { label: "Imethibitishwa", color: "bg-green-100 text-green-700" },
    rejected: { label: "Imekataliwa", color: "bg-red-100 text-red-700" },
    live: { label: "Live", color: "bg-green-100 text-green-700" },
    in_review: { label: "Inasubiri", color: "bg-yellow-100 text-yellow-700" },
    pending_payment: { label: "Inasubiri Malipo", color: "bg-yellow-100 text-yellow-700" },
    sold: { label: "Imeuzwa", color: "bg-blue-100 text-blue-700" },
    expired: { label: "Muda Umeisha", color: "bg-gray-100 text-gray-500" },
    completed: { label: "Imekamilika", color: "bg-green-100 text-green-700" },
    negotiating: { label: "Inajadiliwa", color: "bg-yellow-100 text-yellow-700" },
    offer_sent: { label: "Ofa Imetumwa", color: "bg-yellow-100 text-yellow-700" },
    accepted: { label: "Imekubaliwa", color: "bg-green-100 text-green-700" },
    declined: { label: "Imekataliwa", color: "bg-red-100 text-red-700" },
    reserved: { label: "Inspection Period", color: "bg-blue-100 text-blue-700" },
    awaiting_final_payment: { label: "Malipo ya Mwisho", color: "bg-blue-100 text-blue-700" },
    payment_proof_submitted: { label: "Uthibitisho Umetumwa", color: "bg-yellow-100 text-yellow-700" },
    disputed: { label: "Mgogoro", color: "bg-red-100 text-red-700" },
    cancelled: { label: "Imeghairiwa", color: "bg-gray-100 text-gray-500" },
  };
  const s = config[status] || config.pending;
  return <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.color}`}>{s.label}</span>;
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-5">
      <h1 style={{ fontFamily: FONTS.display }} className="text-2xl sm:text-3xl font-semibold text-gray-800">{title}</h1>
      {subtitle && <p className="text-gray-500 text-sm mt-0.5">{subtitle}</p>}
    </div>
  );
}

// ============================================================
// SECTION: OVERVIEW
// ============================================================

function OverviewSection() {
  return (
    <>
      <SectionHeader title="Overview & Analytics" subtitle="Muhtasari wa mfumo mzima wa SokoMkononi" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {STATS.map((stat) => <StatCard key={stat.id} stat={stat} />)}
      </div>
      <SimpleChart />
    </>
  );
}

// ============================================================
// SECTION: USER MANAGEMENT
// ============================================================

function UserManagementSection() {
  const users = useUsers();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("Zote");

  const toggleStatus = (id) => toggleUserStatus(id);

  const filtered = users.filter((u) => {
    const matchesQuery =
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase());
    const matchesRole = roleFilter === "Zote" || u.role === roleFilter;
    return matchesQuery && matchesRole;
  });

  return (
    <>
      <SectionHeader title="User Management" subtitle="Dhibiti akaunti za watumiaji — simamisha au washa" />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1">
          <Search size={16} className="text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tafuta kwa jina au email..."
            className="outline-none text-sm flex-1"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700"
        >
          <option>Zote</option>
          <option>Buyer</option>
          <option>Seller</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Jina</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Alijiunga</th>
                <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Kitendo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-gray-800">{u.name}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{u.email}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{u.role}</td>
                  <td className="px-5 py-3"><StatusBadge status={u.status} /></td>
                  <td className="px-5 py-3 text-sm text-gray-400">{u.joined}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => toggleStatus(u.id)}
                      style={{
                        color: u.status === "suspended" ? COLORS.green : COLORS.rust,
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border"
                    >
                      {u.status === "suspended" ? <RotateCcw size={13} /> : <Ban size={13} />}
                      {u.status === "suspended" ? "Washa Tena" : "Simamisha"}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-400">Hakuna matokeo</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ============================================================
// SECTION: LISTING & ADS MODERATION
// ============================================================

function ModerationSection() {
  const listings = useListings();
  const [statusFilter, setStatusFilter] = useState("in_review");

  const decide = (id, status) => decideListing(id, status);

  const filtered = listings.filter((l) => statusFilter === "zote" || l.status === statusFilter);

  return (
    <>
      <SectionHeader title="Listing & Ads Moderation" subtitle="Idhinisha au kataa mali kabla hazijachapishwa" />

      <div className="flex gap-2 mb-4">
        {[
          { key: "in_review", label: "Zinasubiri" },
          { key: "live", label: "Zimeidhinishwa" },
          { key: "rejected", label: "Zimekataliwa" },
          { key: "zote", label: "Zote" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            style={{
              background: statusFilter === f.key ? COLORS.night : "white",
              color: statusFilter === f.key ? COLORS.sand : COLORS.night,
              borderColor: COLORS.sandLine,
            }}
            className="text-xs font-semibold px-3.5 py-1.5 rounded-full border"
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Mali</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Muuzaji</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Bei</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Kitendo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-gray-800">{l.title}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{l.category}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{l.seller}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-[#C1502E]">TZS {l.price.toLocaleString()}</td>
                  <td className="px-5 py-3"><StatusBadge status={l.status} /></td>
                  <td className="px-5 py-3 text-right">
                    {l.status === "in_review" ? (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => decide(l.id, "live")} style={{ color: COLORS.green }} className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200">
                          <CheckCircle size={13} /> Idhinisha
                        </button>
                        <button onClick={() => decide(l.id, "rejected")} style={{ color: COLORS.rust }} className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200">
                          <XCircle size={13} /> Kataa
                        </button>
                      </div>
                    ) : (
                      <button className="text-gray-400 hover:text-gray-600"><MoreVertical size={16} /></button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-400">Hakuna mali katika kundi hili</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ============================================================
// SECTION: DEAL ROOMS & DISPUTE RESOLUTION
// ============================================================

const DISPUTE_ACTIONS = [
  {
    key: "refund",
    label: "Rudisha Fedha kwa Mnunuzi",
    desc: "Malalamiko ni sahihi — deal inaghairiwa na mnunuzi anarejeshewa fedha alizolipa.",
    icon: RotateCcw,
    tone: COLORS.green,
  },
  {
    key: "continue",
    label: "Endelea na Deal",
    desc: "Baada ya kukagua, hakuna tatizo la kutosha kusimamisha deal — inarudi kwenye majadiliano.",
    icon: CheckCircle,
    tone: COLORS.gold,
  },
  {
    key: "cancel",
    label: "Ghairi Kabisa (Bila Kurejesha)",
    desc: "Deal inasitishwa kabisa. Hakuna urejeshaji wa fedha kwa upande wowote.",
    icon: XCircle,
    tone: COLORS.rust,
  },
];

function DisputeReviewPanel({ deal, onResolve, onClose }) {
  const [action, setAction] = useState(null);
  const [note, setNote] = useState("");

  const submit = () => {
    if (!action) return;
    onResolve(deal.id, { action, adminNote: note.trim() });
    setAction(null);
    setNote("");
  };

  return (
    <div style={{ borderColor: COLORS.sandLine, background: COLORS.sand }} className="border-t px-5 py-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-800">Kagua Mgogoro — {deal.listingTitle}</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xs font-semibold">Funga</button>
      </div>

      {/* Sababu ya mnunuzi */}
      <div>
        <p className="text-[11px] font-semibold text-gray-500 uppercase mb-1.5">Sababu ya Mnunuzi</p>
        <p style={{ borderColor: COLORS.sandLine }} className="text-sm text-gray-700 bg-white border rounded-lg px-3 py-2.5">
          {deal.disputeNote || "Hakuna maelezo yaliyotolewa na mnunuzi."}
        </p>
      </div>

      {/* Taarifa za Reservation */}
      {deal.reservationFee != null && (
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase mb-1.5">Reservation Fee</p>
          <div style={{ borderColor: COLORS.sandLine }} className="flex flex-wrap gap-x-5 gap-y-1 bg-white border rounded-lg px-3 py-2.5 text-xs text-gray-600">
            <span>Muda: Saa {deal.reservationHours ?? "—"}</span>
            <span>Kiasi: TZS {deal.reservationFee.toLocaleString()}</span>
            <span>Njia: {deal.reservationMethod || "—"}</span>
          </div>
        </div>
      )}

      {/* Historia ya ujumbe */}
      <div>
        <p className="text-[11px] font-semibold text-gray-500 uppercase mb-1.5">Historia ya Mazungumzo</p>
        <div style={{ borderColor: COLORS.sandLine }} className="max-h-52 overflow-y-auto flex flex-col gap-2 bg-white border rounded-lg p-3">
          {deal.messages.map((m) => {
            const who = m.sender === "admin" ? "Admin" : m.sender === "me" ? "Muuzaji" : "Mnunuzi";
            const text = m.text || (m.offerAmount ? `Ofa ya TZS ${m.offerAmount.toLocaleString()}` : "");
            return (
              <p key={m.id} className="text-xs leading-snug">
                <span style={{ color: m.sender === "admin" ? COLORS.rust : COLORS.night }} className="font-semibold">{who}: </span>
                <span className="text-gray-500">{text}</span>
              </p>
            );
          })}
        </div>
      </div>

      {/* Chaguzi za uamuzi */}
      <div>
        <p className="text-[11px] font-semibold text-gray-500 uppercase mb-2">Chagua Uamuzi</p>
        <div className="flex flex-col gap-2">
          {DISPUTE_ACTIONS.map((a) => {
            const Icon = a.icon;
            const isActive = action === a.key;
            return (
              <button
                key={a.key}
                onClick={() => setAction(a.key)}
                style={{
                  borderColor: isActive ? a.tone : COLORS.sandLine,
                  background: isActive ? `${a.tone}12` : "white",
                }}
                className="flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left"
              >
                <Icon size={16} color={a.tone} className="mt-0.5 shrink-0" />
                <div>
                  <p style={{ color: a.tone }} className="text-xs font-semibold">{a.label}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{a.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {action && (
        <div className="flex flex-col gap-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Maelezo ya uamuzi (yataonekana kwa muuzaji na mnunuzi kwenye deal room)..."
            rows={2}
            style={{ borderColor: COLORS.sandLine }}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none bg-white"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setAction(null); setNote(""); }}
              style={{ borderColor: COLORS.sandLine }}
              className="text-xs font-semibold px-3 py-2 rounded-lg border text-gray-600"
            >
              Ghairi
            </button>
            <button
              onClick={submit}
              style={{ background: COLORS.night, color: COLORS.sand }}
              className="flex-1 text-xs font-semibold px-3 py-2.5 rounded-lg"
            >
              Thibitisha Uamuzi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DealsSection() {
  const deals = useDeals();
  const [expandedId, setExpandedId] = useState(null);

  const handleResolve = (id, payload) => {
    resolveDispute(id, payload);
    setExpandedId(null);
  };

  return (
    <>
      <SectionHeader title="Deal Rooms & Dispute Resolution" subtitle="Fuatilia deals na utatue migogoro kati ya mnunuzi na muuzaji" />
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Mali</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Mnunuzi</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Muuzaji</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Kiasi</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Kitendo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {deals.map((d) => {
                const isDisputed = d.status === "disputed";
                const isExpanded = expandedId === d.id;
                return (
                  <React.Fragment key={d.id}>
                    <tr className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 text-sm font-medium text-gray-800 flex items-center gap-2">
                        {d.listingTitle}
                        {isDisputed && (
                          <span style={{ background: `${COLORS.rust}15`, color: COLORS.rust }} className="text-[10px] font-bold px-2 py-0.5 rounded-full">
                            MGOGORO
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">{d.buyerName}</td>
                      <td className="px-5 py-3 text-sm text-gray-500">{d.sellerName}</td>
                      <td className="px-5 py-3 text-sm font-semibold text-[#C1502E]">TZS {(d.currentOffer ?? d.askingPrice).toLocaleString()}</td>
                      <td className="px-5 py-3"><StatusBadge status={d.status} /></td>
                      <td className="px-5 py-3 text-right">
                        {isDisputed ? (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : d.id)}
                            style={{ background: COLORS.gold, color: COLORS.night }}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                          >
                            {isExpanded ? "Funga" : "Kagua Mgogoro"}
                          </button>
                        ) : (
                          <button className="text-gray-400 hover:text-gray-600"><MoreVertical size={16} /></button>
                        )}
                      </td>
                    </tr>
                    {isDisputed && isExpanded && (
                      <tr>
                        <td colSpan={6} className="p-0">
                          <DisputeReviewPanel deal={d} onResolve={handleResolve} onClose={() => setExpandedId(null)} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {deals.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-400">Hakuna deals</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ============================================================
// SECTION: REVENUE & FINANCIAL SETTINGS
// ============================================================

function EditableAmount({ value, onSave, prefix = "TZS " }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-24 text-sm border border-gray-200 rounded-lg px-2 py-1 outline-none"
          autoFocus
        />
        <button
          onClick={() => { onSave(Number(draft)); setEditing(false); }}
          style={{ color: COLORS.green }}
        >
          <Save size={15} />
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => { setDraft(value); setEditing(true); }} className="flex items-center gap-1.5 group">
      <span style={{ color: COLORS.night }} className="text-sm font-semibold">
        {prefix}{value.toLocaleString()}
      </span>
      <Pencil size={12} className="text-gray-300 group-hover:text-gray-500" />
    </button>
  );
}

function EditablePercent({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState((value * 100).toString());

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          step="0.1"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-16 text-sm border border-gray-200 rounded-lg px-2 py-1 outline-none"
          autoFocus
        />
        <span className="text-sm text-gray-400">%</span>
        <button
          onClick={() => { onSave(Number(draft) / 100); setEditing(false); }}
          style={{ color: COLORS.green }}
        >
          <Save size={15} />
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => { setDraft((value * 100).toString()); setEditing(true); }} className="flex items-center gap-1.5 group">
      <span style={{ color: COLORS.night }} className="text-sm font-semibold">
        {(value * 100).toFixed(1)}%
      </span>
      <Pencil size={12} className="text-gray-300 group-hover:text-gray-500" />
    </button>
  );
}

function RevenueSection() {
  const listingFeeConfigs = useListingFeeConfigs();
  const reservationRates = useReservationRates();
  const boostPackages = useBoostPackages();
  const [featuredPlacements, setFeaturedPlacements] = useState(INITIAL_FEATURED_PLACEMENTS);
  const leadingFee = useLeadingFeeConfig();
  const adFee = useAdvertisementFeeConfig();
  const [saved, setSaved] = useState(false);

  const flash = () => { setSaved(true); setTimeout(() => setSaved(false), 1500); };

  const updateListingFeeRate = (key, rate) => {
    updateListingFeeConfig(key, { rate });
    flash();
  };

  const updateListingFeeMin = (key, min) => {
    updateListingFeeConfig(key, { min });
    flash();
  };

  const updateListingFeeMax = (key, max) => {
    updateListingFeeConfig(key, { max });
    flash();
  };

  const updateReservationFee = (id, fee) => {
    updateReservationRate(id, fee);
    flash();
  };

  const updateBoostPrice = (key, price) => {
    updateBoostPackagePrice(key, price);
    flash();
  };

  const updateFeaturedFee = (id, fee) => {
    setFeaturedPlacements((p) => p.map((row) => (row.id === id ? { ...row, fee } : row)));
    flash();
  };

  const updateLeadingPrice = (price) => {
    updateLeadingFeePrice(price);
    flash();
  };

  const updateAdvertisementPrice = (price) => {
    updateAdvertisementFeePrice(price);
    flash();
  };

  return (
    <>
      <SectionHeader title="Revenue & Financial Settings" subtitle="Vyanzo vyote 6 vya mapato ya SokoMkononi — bofya kiasi kubadilisha" />
      {saved && (
        <div style={{ background: `${COLORS.green}15`, color: COLORS.green }} className="text-xs font-semibold px-3 py-2 rounded-lg mb-4 inline-block">
          Imehifadhiwa
        </div>
      )}

      <div className="flex flex-col gap-4">
        {/* Listing Fee per category (rate% + min/max) — hizi ndizo
            namba HALISI zinazotumika PostPropertyForm ilipoundwa listing */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-1">
            <div style={{ background: `${COLORS.gold}15` }} className="w-9 h-9 rounded-lg flex items-center justify-center">
              <Home size={16} color={COLORS.gold} />
            </div>
            <p className="text-sm font-semibold text-gray-800">Listing Fee</p>
          </div>
          <p className="text-xs text-gray-500 mb-3">Asilimia ya bei ya mali kwa category, na ukomo wa chini/juu — inalipwa kabla ya kuchapisha</p>
          <div className="divide-y divide-gray-100">
            {listingFeeConfigs.map((c) => (
              <div key={c.key} className="flex items-center justify-between py-2.5 gap-3 flex-wrap">
                <span className="text-sm text-gray-600 min-w-[150px]">{c.label}</span>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] text-gray-400">Rate</span>
                    <EditablePercent value={c.rate} onSave={(v) => updateListingFeeRate(c.key, v)} />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] text-gray-400">Min</span>
                    <EditableAmount value={c.min} onSave={(v) => updateListingFeeMin(c.key, v)} />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] text-gray-400">Max</span>
                    <EditableAmount value={c.max} onSave={(v) => updateListingFeeMax(c.key, v)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reservation Fee by duration */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-1">
            <div style={{ background: `${COLORS.green}15` }} className="w-9 h-9 rounded-lg flex items-center justify-center">
              <Clock size={16} color={COLORS.green} />
            </div>
            <p className="text-sm font-semibold text-gray-800">Reservation Fee</p>
          </div>
          <p className="text-xs text-gray-500 mb-3">100% mapato ya SokoMkononi — hakuna 50/50 split na muuzaji</p>
          <div className="divide-y divide-gray-100">
            {reservationRates.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-gray-600">{r.label}</span>
                <EditableAmount value={r.fee} onSave={(v) => updateReservationFee(r.id, v)} />
              </div>
            ))}
          </div>
        </div>

        {/* Boost Packages (Basic/Featured/Premium) — bei halisi
            zinazotumika kwenye Boost Sasa ya muuzaji */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-1">
            <div style={{ background: `${COLORS.rust}15` }} className="w-9 h-9 rounded-lg flex items-center justify-center">
              <Rocket size={16} color={COLORS.rust} />
            </div>
            <p className="text-sm font-semibold text-gray-800">Boost Packages</p>
          </div>
          <p className="text-xs text-gray-500 mb-3">Bei za Boost Sasa (Basic/Featured/Premium) — mabadiliko yanaonekana papo hapo kwa muuzaji</p>
          <div className="divide-y divide-gray-100">
            {boostPackages.map((pkg) => (
              <div key={pkg.key} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-gray-600">
                  {pkg.label} <span className="text-gray-400">({pkg.days} siku)</span>
                </span>
                <EditableAmount value={pkg.price} onSave={(v) => updateBoostPrice(pkg.key, v)} />
              </div>
            ))}
          </div>
        </div>

        {/* Featured / Top Listing (Premium) */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-1">
            <div style={{ background: `${COLORS.gold}15` }} className="w-9 h-9 rounded-lg flex items-center justify-center">
              <Star size={16} color={COLORS.gold} />
            </div>
            <p className="text-sm font-semibold text-gray-800">Featured / Top Listing (Premium)</p>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Muuzaji analipia bidhaa yake ionekane sehemu za premium — analipia attention, si tu kuweka bidhaa
          </p>
          <div className="divide-y divide-gray-100">
            {featuredPlacements.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-gray-600">{p.label}</span>
                <EditableAmount value={p.fee} onSave={(v) => updateFeaturedFee(p.id, v)} />
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Kiwango kinachopendekezwa na mteja: TZS 10,000–50,000 kulingana na placement</p>
        </div>

        {/* Leading Fee (search priority) — huathiri moja kwa moja
            mpangilio wa BrowseProperties.jsx kupitia isLeadingActive() */}
        {/* Advertisement Fee (banner ya dashboard) — kila malipo
            huunda banner halisi ndani ya bannerAdsStore.js, inayoonekana
            kwenye DashboardShell.jsx (PromotedBannerStrip, 5s rotation) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3">
            <div style={{ background: `${COLORS.rust}15` }} className="w-10 h-10 rounded-xl flex items-center justify-center">
              <FLAT_FEE_ICONS.leading size={18} color={COLORS.rust} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{leadingFee.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{leadingFee.desc}</p>
            </div>
            <EditableAmount value={leadingFee.price} onSave={updateLeadingPrice} />
            <span className="text-[11px] text-gray-400 -mt-2">/ siku {leadingFee.days}</span>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3">
            <div style={{ background: `${COLORS.rust}15` }} className="w-10 h-10 rounded-xl flex items-center justify-center">
              <FLAT_FEE_ICONS.ads size={18} color={COLORS.rust} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{adFee.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{adFee.desc}</p>
            </div>
            <EditableAmount value={adFee.price} onSave={updateAdvertisementPrice} />
            <span className="text-[11px] text-gray-400 -mt-2">/ siku {adFee.days}</span>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================
// SECTION: SYSTEM SETTINGS
// ============================================================

function WebhooksPanel() {
  const [webhooks] = useWebhooks();
  const [form, setForm] = useState({ event: "Payment Success", url: "" });

  const add = () => {
    if (!form.url.trim()) return;
    addWebhook({ id: Date.now(), event: form.event, url: form.url.trim(), active: true });
    setForm({ event: "Payment Success", url: "" });
  };

  const toggleActive = (id) => toggleWebhook(id);
  const remove = (id) => removeWebhook(id);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div style={{ background: `${COLORS.night}0D` }} className="w-9 h-9 rounded-lg flex items-center justify-center">
          <Webhook size={16} color={COLORS.night} />
        </div>
        <p className="text-sm font-semibold text-gray-800">Webhooks</p>
      </div>

      <div className="flex flex-col gap-2">
        {webhooks.map((w) => (
          <div key={w.id} style={{ borderColor: COLORS.sandLine }} className="flex items-center justify-between gap-2 border rounded-lg px-3 py-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-700">{w.event}</p>
              <p className="text-xs text-gray-400 truncate">{w.url}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => toggleActive(w.id)}
                style={{ color: w.active ? COLORS.green : "#9CA3AF" }}
                className="text-[11px] font-semibold px-2 py-1 rounded-full border border-gray-200"
              >
                {w.active ? "Active" : "Off"}
              </button>
              <button onClick={() => remove(w.id)} className="text-gray-300 hover:text-[#C1502E]">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {webhooks.length === 0 && <p className="text-xs text-gray-400">Hakuna webhook bado</p>}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100">
        <select
          value={form.event}
          onChange={(e) => setForm({ ...form, event: e.target.value })}
          className="border border-gray-200 rounded-lg px-2 py-2 text-xs"
        >
          <option>Payment Success</option>
          <option>Payment Failed</option>
          <option>SMS Notification</option>
          <option>New Listing</option>
        </select>
        <input
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
          placeholder="https://..."
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none"
        />
        <button onClick={add} style={{ background: COLORS.gold, color: COLORS.night }} className="flex items-center justify-center gap-1 text-xs font-semibold rounded-lg px-3 py-2">
          <Plus size={13} /> Ongeza
        </button>
      </div>
    </div>
  );
}

function SubAdminsPanel() {
  const [subAdmins] = useSubAdmins();
  const [form, setForm] = useState({ name: "", email: "", permissions: [] });

  const togglePerm = (p) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(p) ? f.permissions.filter((x) => x !== p) : [...f.permissions, p],
    }));
  };

  const add = () => {
    if (!form.name.trim() || !form.email.trim()) return;
    addSubAdmin({ id: Date.now(), ...form });
    setForm({ name: "", email: "", permissions: [] });
  };

  const remove = (id) => removeSubAdmin(id);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div style={{ background: `${COLORS.night}0D` }} className="w-9 h-9 rounded-lg flex items-center justify-center">
          <UserCog size={16} color={COLORS.night} />
        </div>
        <p className="text-sm font-semibold text-gray-800">Sub-Admins</p>
      </div>

      <div className="flex flex-col gap-2">
        {subAdmins.map((a) => (
          <div key={a.id} style={{ borderColor: COLORS.sandLine }} className="flex items-center justify-between gap-2 border rounded-lg px-3 py-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-700">{a.name}</p>
              <p className="text-xs text-gray-400 truncate">{a.email}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {a.permissions.map((p) => (
                  <span key={p} style={{ background: `${COLORS.gold}15`, color: COLORS.gold }} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                    {p}
                  </span>
                ))}
              </div>
            </div>
            <button onClick={() => remove(a.id)} className="text-gray-300 hover:text-[#C1502E] shrink-0">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {subAdmins.length === 0 && <p className="text-xs text-gray-400">Hakuna sub-admin bado</p>}
      </div>

      <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Jina"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none"
          />
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PERMISSION_OPTIONS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => togglePerm(p)}
              style={{
                background: form.permissions.includes(p) ? COLORS.night : "white",
                color: form.permissions.includes(p) ? COLORS.sand : COLORS.night,
                borderColor: COLORS.sandLine,
              }}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full border"
            >
              {p}
            </button>
          ))}
        </div>
        <button onClick={add} style={{ background: COLORS.gold, color: COLORS.night }} className="flex items-center justify-center gap-1 text-xs font-semibold rounded-lg px-3 py-2 self-start">
          <Plus size={13} /> Ongeza Sub-Admin
        </button>
      </div>
    </div>
  );
}

function AppStoreLinksPanel() {
  const [links, setLinksLocal] = useAppStoreLinks();
  const [saved, setSaved] = useState(false);

  const setLinks = (next) => setLinksLocal(next);

  const save = () => {
    saveAppStoreLinks(links);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div style={{ background: `${COLORS.night}0D` }} className="w-9 h-9 rounded-lg flex items-center justify-center">
          <Smartphone size={16} color={COLORS.night} />
        </div>
        <p className="text-sm font-semibold text-gray-800">App Store Links</p>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-600 flex items-center gap-1"><Link2 size={12} /> Google Play Store</span>
        <input
          value={links.play}
          onChange={(e) => setLinks({ ...links, play: e.target.value })}
          placeholder="https://play.google.com/store/apps/details?id=..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-600 flex items-center gap-1"><Link2 size={12} /> Apple App Store</span>
        <input
          value={links.appstore}
          onChange={(e) => setLinks({ ...links, appstore: e.target.value })}
          placeholder="https://apps.apple.com/app/..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none"
        />
      </label>

      <button onClick={save} style={{ background: COLORS.gold, color: COLORS.night }} className="flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-2 self-start">
        <Save size={13} /> Hifadhi
      </button>
      {saved && <span style={{ color: COLORS.green }} className="text-xs font-semibold">Imehifadhiwa</span>}
    </div>
  );
}

function AnnouncementsPanel() {
  const announcements = useAnnouncements();
  const [form, setForm] = useState({ typeId: "fee_change", title: "", message: "", scheduledFor: "" });
  const [expanded, setExpanded] = useState(false);

  const typeLabel = (id) => ANNOUNCEMENT_TYPES.find((t) => t.id === id)?.label || id;

  const send = () => {
    if (!form.title.trim() || !form.message.trim()) return;
    addAnnouncement({ id: Date.now(), ...form, sent: !form.scheduledFor });
    setForm({ typeId: "fee_change", title: "", message: "", scheduledFor: "" });
    setExpanded(false);
  };

  const remove = (id) => removeAnnouncement(id);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-4 lg:col-span-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div style={{ background: `${COLORS.night}0D` }} className="w-9 h-9 rounded-lg flex items-center justify-center">
            <Megaphone size={16} color={COLORS.night} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">System / Marketplace Announcements</p>
            <p className="text-xs text-gray-500">Matangazo ya jumla — fee changes, categories mpya, maintenance, promotions</p>
          </div>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{ background: COLORS.gold, color: COLORS.night }}
          className="flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-2 shrink-0"
        >
          <Plus size={13} /> Tangazo Jipya
        </button>
      </div>

      {expanded && (
        <div style={{ borderColor: COLORS.sandLine }} className="border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            {ANNOUNCEMENT_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setForm({ ...form, typeId: t.id })}
                style={{
                  background: form.typeId === t.id ? COLORS.night : "white",
                  color: form.typeId === t.id ? COLORS.sand : COLORS.night,
                  borderColor: COLORS.sandLine,
                }}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full border"
              >
                {t.label}
              </button>
            ))}
          </div>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Kichwa cha tangazo"
            className="border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none"
          />
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Ujumbe kamili wa tangazo..."
            rows={3}
            className="border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none resize-none"
          />
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 shrink-0">Ratiba (hiari):</label>
            <input
              type="datetime-local"
              value={form.scheduledFor}
              onChange={(e) => setForm({ ...form, scheduledFor: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none flex-1"
            />
          </div>
          <button
            onClick={send}
            style={{ background: COLORS.green, color: "white" }}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-2 self-start"
          >
            <Megaphone size={13} />
            {form.scheduledFor ? "Panga Tangazo" : "Tuma Sasa kwa Wote"}
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {announcements.map((a) => (
          <div key={a.id} style={{ borderColor: COLORS.sandLine }} className="flex items-start justify-between gap-3 border rounded-lg px-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span style={{ background: `${COLORS.gold}15`, color: COLORS.gold }} className="text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {typeLabel(a.typeId)}
                </span>
                {!a.sent && (
                  <span style={{ background: `${COLORS.green}15`, color: COLORS.green }} className="text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Imepangwa: {a.scheduledFor?.replace("T", " ")}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-800">{a.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{a.message}</p>
            </div>
            <button onClick={() => remove(a.id)} className="text-gray-300 hover:text-[#C1502E] shrink-0">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {announcements.length === 0 && <p className="text-xs text-gray-400">Hakuna tangazo bado</p>}
      </div>
    </div>
  );
}

function SystemSettingsSection() {
  return (
    <>
      <SectionHeader title="System Settings" subtitle="Mipangilio ya ndani ya mfumo" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <WebhooksPanel />
        <SubAdminsPanel />
        <AppStoreLinksPanel />
        <AnnouncementsPanel />
      </div>
    </>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function AdminDashboard() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { notifications, unreadCount, markRead } = useNotifications("admin");
  const [notifOpen, setNotifOpen] = useState(false);

  const openNotification = (n) => {
    markRead(n.id);
    setActiveSection(n.target || "overview");
    setNotifOpen(false);
  };

  useEffect(() => {
    if (!user) {
      navigate("/admin/login");
      return;
    }
    if (!isAdmin) {
      navigate("/dashboard");
      return;
    }
    setLoading(false);
  }, [user, isAdmin, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#E8A33D] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-4">Inaangalia mamlaka yako...</p>
        </div>
      </div>
    );
  }

  const renderSection = () => {
    switch (activeSection) {
      case "overview": return <OverviewSection />;
      case "users": return <UserManagementSection />;
      case "moderation": return <ModerationSection />;
      case "deals": return <DealsSection />;
      case "revenue": return <RevenueSection />;
      case "system": return <SystemSettingsSection />;
      default: return <OverviewSection />;
    }
  };

  return (
    <div style={{ fontFamily: FONTS.body, background: COLORS.sand }} className="min-h-screen">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=Manrope:wght@400;500;600;700&display=swap');
      `}</style>

      {/* HEADER */}
      <header style={{ background: COLORS.night }} className="sticky top-0 z-50 w-full flex items-center justify-between px-4 sm:px-6 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen((v) => !v)} className="text-white/70 hover:text-white md:hidden">
            <Menu size={20} />
          </button>
          <span style={{ fontFamily: FONTS.display, color: COLORS.sand }} className="text-lg sm:text-xl font-semibold tracking-tight">
            SokoMkononi
          </span>
          <span className="text-[10px] font-semibold bg-[#E8A33D]/20 text-[#E8A33D] px-2.5 py-0.5 rounded-full">ADMIN</span>
        </div>

        <div className="flex items-center gap-3">
          <button className="text-white/60 hover:text-white transition-colors"><Search size={18} /></button>

          <div className="relative">
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative text-white/60 hover:text-white transition-colors"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span
                  style={{ background: COLORS.rust }}
                  className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div
                style={{ borderColor: COLORS.sandLine }}
                className="absolute right-0 mt-3 w-80 max-w-[85vw] bg-white rounded-xl border shadow-xl z-50 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800">Admin Notifications</span>
                  {unreadCount > 0 && (
                    <span style={{ color: COLORS.rust }} className="text-xs font-semibold">{unreadCount} mpya</span>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                  {notifications.map((n) => {
                    const Icon = ADMIN_NOTIFICATION_ICONS[n.type] || Bell;
                    return (
                      <button
                        key={n.id}
                        onClick={() => openNotification(n)}
                        style={{ background: n.read ? "white" : `${COLORS.gold}0D` }}
                        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div style={{ background: `${COLORS.night}0D` }} className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                          <Icon size={14} color={COLORS.night} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-700 leading-snug">{n.title}</p>
                          <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.at)}</p>
                        </div>
                        {!n.read && (
                          <span style={{ background: COLORS.gold }} className="w-2 h-2 rounded-full shrink-0 mt-1.5" />
                        )}
                      </button>
                    );
                  })}
                  {notifications.length === 0 && (
                    <p className="text-xs text-gray-400 px-4 py-6 text-center">Hakuna notification</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <button onClick={handleLogout} className="text-white/60 hover:text-white transition-colors flex items-center gap-1.5 text-sm">
            <LogOut size={16} />
            <span className="hidden sm:inline">Toka</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-[#E8A33D] flex items-center justify-center text-[#101A2E] font-bold text-sm">
            {user?.name?.charAt(0) || "A"}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* SIDEBAR - desktop */}
        <aside style={{ borderColor: COLORS.sandLine }} className="hidden md:flex w-64 shrink-0 border-r flex-col py-4 px-3 gap-1 min-h-[calc(100vh-56px)]">
          {NAV.map(({ key, label, icon: Icon }) => {
            const isActive = key === activeSection;
            return (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                style={{
                  background: isActive ? COLORS.night : "transparent",
                  color: isActive ? COLORS.sand : COLORS.night,
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left"
              >
                <Icon size={17} color={isActive ? COLORS.gold : COLORS.night} />
                {label}
              </button>
            );
          })}
        </aside>

        {/* SIDEBAR - mobile drawer */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            <div style={{ background: COLORS.sand }} className="w-64 h-full py-4 px-3 flex flex-col gap-1 shadow-xl">
              <div className="flex justify-end mb-2">
                <button onClick={() => setSidebarOpen(false)}><X size={20} color={COLORS.night} /></button>
              </div>
              {NAV.map(({ key, label, icon: Icon }) => {
                const isActive = key === activeSection;
                return (
                  <button
                    key={key}
                    onClick={() => { setActiveSection(key); setSidebarOpen(false); }}
                    style={{ background: isActive ? COLORS.night : "transparent", color: isActive ? COLORS.sand : COLORS.night }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left"
                  >
                    <Icon size={17} color={isActive ? COLORS.gold : COLORS.night} />
                    {label}
                  </button>
                );
              })}
            </div>
            <div onClick={() => setSidebarOpen(false)} className="flex-1 bg-black/30" />
          </div>
        )}

        {/* MAIN CONTENT */}
        <main className="flex-1 max-w-7xl px-4 sm:px-6 py-6">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}
