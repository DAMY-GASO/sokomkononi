import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
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

const INITIAL_USERS = [
  { id: 1, name: "Sarah Mwangi", email: "sarah@email.com", role: "Buyer", status: "active", joined: "2026-09-10" },
  { id: 2, name: "John Doe", email: "john@email.com", role: "Seller", status: "active", joined: "2026-09-09" },
  { id: 3, name: "Michael Kato", email: "michael@email.com", role: "Buyer", status: "pending", joined: "2026-09-08" },
  { id: 4, name: "Jane Mushi", email: "jane@email.com", role: "Seller", status: "active", joined: "2026-09-07" },
  { id: 5, name: "Peter Lema", email: "peter@email.com", role: "Buyer", status: "inactive", joined: "2026-09-06" },
];

const INITIAL_LISTINGS = [
  { id: 1, title: "Nyumba ya Ghorofa Mbezi Beach", seller: "John Doe", category: "Nyumba & Majengo", price: 85000000, status: "pending", date: "2026-09-10" },
  { id: 2, title: "Toyota Harrier 2016", seller: "Jane Mushi", category: "Magari", price: 42000000, status: "verified", date: "2026-09-09" },
  { id: 3, title: "Kiwanja Ubungo", seller: "Mary Mwangi", category: "Viwanja & Mashamba", price: 28000000, status: "rejected", date: "2026-09-08" },
  { id: 4, title: "Duka la Vifaa vya Ujenzi", seller: "John Doe", category: "Biashara Zinazouzwa", price: 15000000, status: "pending", date: "2026-09-07" },
];

const INITIAL_DEALS = [
  { id: 1, property: "Nyumba ya Ghorofa Mbezi Beach", buyer: "Sarah Mwangi", seller: "John Doe", amount: 85000000, status: "completed", date: "2026-09-10", disputed: false },
  { id: 2, property: "Toyota Harrier 2016", buyer: "Michael Kato", seller: "Jane Mushi", amount: 42000000, status: "negotiating", date: "2026-09-09", disputed: true },
  { id: 3, property: "Kiwanja Ubungo", buyer: "Peter Lema", seller: "Mary Mwangi", amount: 28000000, status: "pending", date: "2026-09-08", disputed: false },
];

const INITIAL_LISTING_TIERS = [
  { id: 1, min: 0, max: 10000000, fee: 20000 },
  { id: 2, min: 10000000, max: 50000000, fee: 50000 },
  { id: 3, min: 50000000, max: 150000000, fee: 90000 },
  { id: 4, min: 150000000, max: null, fee: 150000 },
];

const INITIAL_RESERVATION_RATES = [
  { id: "24h", label: "Saa 24", fee: 10000 },
  { id: "48h", label: "Saa 48", fee: 18000 },
  { id: "72h", label: "Saa 72", fee: 25000 },
  { id: "custom", label: "Custom (kwa siku)", fee: 8000 },
];

const INITIAL_FEATURED_PLACEMENTS = [
  { id: "homepage", label: "Homepage", fee: 50000 },
  { id: "top_category", label: "Top of Category", fee: 30000 },
  { id: "featured_section", label: "Featured Section", fee: 25000 },
  { id: "search_priority", label: "Search Priority", fee: 10000 },
];

const INITIAL_FLAT_FEES = {
  boosting: { label: "Boosting Fee", desc: "Muuzaji analipia first priority kwenye listings", value: 15000, unit: "/ wiki", icon: ShoppingBag },
  leading: { label: "Leading Fee", desc: "Bidhaa zinazoonekana juu kwenye search results", value: 10000, unit: "/ wiki", icon: Search },
  ads: { label: "Advertisement Fee", desc: "Banner inayozunguka kwenye dashboard (5s rotation)", value: 25000, unit: "/ wiki", icon: Smartphone },
};

const INITIAL_WEBHOOKS = [
  { id: 1, event: "Payment Success", url: "https://api.sokomkononi.co.tz/webhooks/payment", active: true },
  { id: 2, event: "SMS Notification", url: "https://api.sokomkononi.co.tz/webhooks/sms", active: true },
];

const INITIAL_SUBADMINS = [
  { id: 1, name: "Amina Rashid", email: "amina@sokomkononi.co.tz", permissions: ["Moderation", "Deals"] },
];

const PERMISSION_OPTIONS = ["Users", "Moderation", "Deals", "Revenue", "System"];

const ANNOUNCEMENT_TYPES = [
  { id: "fee_change", label: "Mabadiliko ya Fee" },
  { id: "new_category", label: "Category Mpya" },
  { id: "maintenance", label: "Matengenezo ya Mfumo" },
  { id: "promotion", label: "Kampeni/Promotion" },
];

const INITIAL_ANNOUNCEMENTS = [
  {
    id: 1,
    typeId: "maintenance",
    title: "Matengenezo ya Mfumo — Jumamosi Usiku",
    message: "Mfumo utakuwa chini kwa dakika 30 kuanzia saa 2:00 usiku kwa matengenezo ya database.",
    scheduledFor: "2026-09-13T23:00",
    sent: true,
  },
  {
    id: 2,
    typeId: "fee_change",
    title: "Boosting Fee Imepungua",
    message: "Kuanzia wiki hii, Boosting Fee imepungua kutoka TZS 15,000 hadi TZS 12,000 kwa wiki.",
    scheduledFor: "2026-09-08T09:00",
    sent: true,
  },
];

const INITIAL_ADMIN_NOTIFICATIONS = [
  {
    id: 1,
    type: "listing_pending",
    icon: Home,
    message: "Listing mpya inasubiri approval: \"Nyumba ya Ghorofa Mbezi Beach\"",
    time: "Dakika 5 zilizopita",
    read: false,
    target: "moderation",
  },
  {
    id: 2,
    type: "dispute",
    icon: Flag,
    message: "Malalamiko mapya yamewasilishwa kwenye deal ya Toyota Harrier 2016",
    time: "Saa 1 iliyopita",
    read: false,
    target: "deals",
  },
  {
    id: 3,
    type: "payment_issue",
    icon: CreditCard,
    message: "Malipo ya Reservation Fee yamekwama (pending) kwa siku 2",
    time: "Masaa 3 yaliyopita",
    read: false,
    target: "revenue",
  },
  {
    id: 4,
    type: "fraud_flag",
    icon: AlertTriangle,
    message: "Mtumiaji \"Peter Lema\" amepokea ripoti 4 kutoka kwa watumiaji tofauti",
    time: "Jana",
    read: true,
    target: "users",
  },
];

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
    completed: { label: "Imekamilika", color: "bg-green-100 text-green-700" },
    negotiating: { label: "Inajadiliwa", color: "bg-yellow-100 text-yellow-700" },
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
  const [users, setUsers] = useState(INITIAL_USERS);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("Zote");

  const toggleStatus = (id) => {
    setUsers((list) =>
      list.map((u) =>
        u.id === id
          ? { ...u, status: u.status === "suspended" ? "active" : "suspended" }
          : u
      )
    );
  };

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
  const [listings, setListings] = useState(INITIAL_LISTINGS);
  const [statusFilter, setStatusFilter] = useState("pending");

  const decide = (id, status) => {
    setListings((list) => list.map((l) => (l.id === id ? { ...l, status } : l)));
  };

  const filtered = listings.filter((l) => statusFilter === "zote" || l.status === statusFilter);

  return (
    <>
      <SectionHeader title="Listing & Ads Moderation" subtitle="Idhinisha au kataa mali kabla hazijachapishwa" />

      <div className="flex gap-2 mb-4">
        {[
          { key: "pending", label: "Zinasubiri" },
          { key: "verified", label: "Zimeidhinishwa" },
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
                    {l.status === "pending" ? (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => decide(l.id, "verified")} style={{ color: COLORS.green }} className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200">
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

function DealsSection() {
  const [deals, setDeals] = useState(INITIAL_DEALS);

  const resolve = (id) => {
    setDeals((list) => list.map((d) => (d.id === id ? { ...d, disputed: false, status: "completed" } : d)));
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
              {deals.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-gray-800 flex items-center gap-2">
                    {d.property}
                    {d.disputed && (
                      <span style={{ background: `${COLORS.rust}15`, color: COLORS.rust }} className="text-[10px] font-bold px-2 py-0.5 rounded-full">
                        MGOGORO
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">{d.buyer}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{d.seller}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-[#C1502E]">TZS {d.amount.toLocaleString()}</td>
                  <td className="px-5 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-5 py-3 text-right">
                    {d.disputed ? (
                      <button onClick={() => resolve(d.id)} style={{ background: COLORS.gold, color: COLORS.night }} className="text-xs font-semibold px-3 py-1.5 rounded-lg">
                        Tatua Mgogoro
                      </button>
                    ) : (
                      <button className="text-gray-400 hover:text-gray-600"><MoreVertical size={16} /></button>
                    )}
                  </td>
                </tr>
              ))}
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

function RevenueSection() {
  const [tiers, setTiers] = useState(INITIAL_LISTING_TIERS);
  const [reservationRates, setReservationRates] = useState(INITIAL_RESERVATION_RATES);
  const [featuredPlacements, setFeaturedPlacements] = useState(INITIAL_FEATURED_PLACEMENTS);
  const [flatFees, setFlatFees] = useState(INITIAL_FLAT_FEES);
  const [saved, setSaved] = useState(false);

  const flash = () => { setSaved(true); setTimeout(() => setSaved(false), 1500); };

  const updateTierFee = (id, fee) => {
    setTiers((t) => t.map((row) => (row.id === id ? { ...row, fee } : row)));
    flash();
  };

  const updateReservationFee = (id, fee) => {
    setReservationRates((r) => r.map((row) => (row.id === id ? { ...row, fee } : row)));
    flash();
  };

  const updateFeaturedFee = (id, fee) => {
    setFeaturedPlacements((p) => p.map((row) => (row.id === id ? { ...row, fee } : row)));
    flash();
  };

  const updateFlatFee = (key, value) => {
    setFlatFees((f) => ({ ...f, [key]: { ...f[key], value } }));
    flash();
  };

  const fmtRange = (min, max) =>
    max ? `TZS ${min.toLocaleString()} – ${max.toLocaleString()}` : `Zaidi ya TZS ${min.toLocaleString()}`;

  return (
    <>
      <SectionHeader title="Revenue & Financial Settings" subtitle="Vyanzo vyote 5 vya mapato ya SokoMkononi — bofya kiasi kubadilisha" />
      {saved && (
        <div style={{ background: `${COLORS.green}15`, color: COLORS.green }} className="text-xs font-semibold px-3 py-2 rounded-lg mb-4 inline-block">
          Imehifadhiwa
        </div>
      )}

      <div className="flex flex-col gap-4">
        {/* Listing Fee tiers */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-1">
            <div style={{ background: `${COLORS.gold}15` }} className="w-9 h-9 rounded-lg flex items-center justify-center">
              <Home size={16} color={COLORS.gold} />
            </div>
            <p className="text-sm font-semibold text-gray-800">Listing Fee</p>
          </div>
          <p className="text-xs text-gray-500 mb-3">Inalipwa kabla ya kuchapisha; inapungua bei ya mali ikiongezeka</p>
          <div className="divide-y divide-gray-100">
            {tiers.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-gray-600">{fmtRange(t.min, t.max)}</span>
                <EditableAmount value={t.fee} onSave={(v) => updateTierFee(t.id, v)} />
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

        {/* Flat weekly fees */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.entries(flatFees).map(([key, f]) => {
            const Icon = f.icon;
            return (
              <div key={key} className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3">
                <div style={{ background: `${COLORS.rust}15` }} className="w-10 h-10 rounded-xl flex items-center justify-center">
                  <Icon size={18} color={COLORS.rust} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{f.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
                </div>
                <EditableAmount value={f.value} onSave={(v) => updateFlatFee(key, v)} />
                <span className="text-[11px] text-gray-400 -mt-2">{f.unit}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ============================================================
// SECTION: SYSTEM SETTINGS
// ============================================================

function WebhooksPanel() {
  const [webhooks, setWebhooks] = useState(INITIAL_WEBHOOKS);
  const [form, setForm] = useState({ event: "Payment Success", url: "" });

  const add = () => {
    if (!form.url.trim()) return;
    setWebhooks((w) => [...w, { id: Date.now(), event: form.event, url: form.url.trim(), active: true }]);
    setForm({ event: "Payment Success", url: "" });
  };

  const toggleActive = (id) => setWebhooks((w) => w.map((x) => (x.id === id ? { ...x, active: !x.active } : x)));
  const remove = (id) => setWebhooks((w) => w.filter((x) => x.id !== id));

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
  const [subAdmins, setSubAdmins] = useState(INITIAL_SUBADMINS);
  const [form, setForm] = useState({ name: "", email: "", permissions: [] });

  const togglePerm = (p) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(p) ? f.permissions.filter((x) => x !== p) : [...f.permissions, p],
    }));
  };

  const add = () => {
    if (!form.name.trim() || !form.email.trim()) return;
    setSubAdmins((s) => [...s, { id: Date.now(), ...form }]);
    setForm({ name: "", email: "", permissions: [] });
  };

  const remove = (id) => setSubAdmins((s) => s.filter((x) => x.id !== id));

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
  const [links, setLinks] = useState({ play: "", appstore: "" });
  const [saved, setSaved] = useState(false);

  const save = () => {
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
  const [announcements, setAnnouncements] = useState(INITIAL_ANNOUNCEMENTS);
  const [form, setForm] = useState({ typeId: "fee_change", title: "", message: "", scheduledFor: "" });
  const [expanded, setExpanded] = useState(false);

  const typeLabel = (id) => ANNOUNCEMENT_TYPES.find((t) => t.id === id)?.label || id;

  const send = () => {
    if (!form.title.trim() || !form.message.trim()) return;
    setAnnouncements((list) => [
      { id: Date.now(), ...form, sent: !form.scheduledFor },
      ...list,
    ]);
    setForm({ typeId: "fee_change", title: "", message: "", scheduledFor: "" });
    setExpanded(false);
  };

  const remove = (id) => setAnnouncements((list) => list.filter((a) => a.id !== id));

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
  const [notifications, setNotifications] = useState(INITIAL_ADMIN_NOTIFICATIONS);
  const [notifOpen, setNotifOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const openNotification = (n) => {
    setNotifications((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    setActiveSection(n.target);
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
                    const Icon = n.icon;
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
                          <p className="text-xs text-gray-700 leading-snug">{n.message}</p>
                          <p className="text-[11px] text-gray-400 mt-1">{n.time}</p>
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
