
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import {
  Users,
  Home,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  MoreVertical,
  Search,
  Filter,
  Download,
  ChevronDown,
  LogOut,
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
  {
    id: "users",
    label: "Watumiaji",
    value: "12,847",
    change: "+12.5%",
    icon: Users,
    color: COLORS.gold,
  },
  {
    id: "properties",
    label: "Mali",
    value: "8,234",
    change: "+8.3%",
    icon: Home,
    color: COLORS.green,
  },
  {
    id: "deals",
    label: "Deals",
    value: "2,451",
    change: "+15.7%",
    icon: ShoppingBag,
    color: "#2563EB",
  },
  {
    id: "revenue",
    label: "Mapato",
    value: "TSh 4.2M",
    change: "+22.1%",
    icon: DollarSign,
    color: COLORS.rust,
  },
];

const RECENT_USERS = [
  { id: 1, name: "Sarah Mwangi", email: "sarah@email.com", role: "Buyer", status: "active", joined: "2026-09-10" },
  { id: 2, name: "John Doe", email: "john@email.com", role: "Seller", status: "active", joined: "2026-09-09" },
  { id: 3, name: "Michael Kato", email: "michael@email.com", role: "Buyer", status: "pending", joined: "2026-09-08" },
  { id: 4, name: "Jane Mushi", email: "jane@email.com", role: "Seller", status: "active", joined: "2026-09-07" },
  { id: 5, name: "Peter Lema", email: "peter@email.com", role: "Buyer", status: "inactive", joined: "2026-09-06" },
];

const RECENT_LISTINGS = [
  { id: 1, title: "Nyumba ya Ghorofa Mbezi Beach", seller: "John Doe", price: 85000000, status: "pending", date: "2026-09-10" },
  { id: 2, title: "Toyota Harrier 2016", seller: "Jane Mushi", price: 42000000, status: "verified", date: "2026-09-09" },
  { id: 3, title: "Kiwanja Ubungo", seller: "Mary Mwangi", price: 28000000, status: "rejected", date: "2026-09-08" },
  { id: 4, title: "Duka la Vifaa vya Ujenzi", seller: "John Doe", price: 15000000, status: "pending", date: "2026-09-07" },
];

const RECENT_DEALS = [
  { id: 1, property: "Nyumba ya Ghorofa Mbezi Beach", buyer: "Sarah Mwangi", seller: "John Doe", amount: 85000000, status: "completed", date: "2026-09-10" },
  { id: 2, property: "Toyota Harrier 2016", buyer: "Michael Kato", seller: "Jane Mushi", amount: 42000000, status: "negotiating", date: "2026-09-09" },
  { id: 3, property: "Kiwanja Ubungo", buyer: "Peter Lema", seller: "Mary Mwangi", amount: 28000000, status: "pending", date: "2026-09-08" },
];

const CHART_DATA = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  users: [120, 150, 180, 200, 220, 180, 160],
  properties: [80, 100, 120, 140, 160, 130, 110],
  deals: [40, 50, 60, 70, 80, 65, 55],
};

// ============================================================
// COMPONENTS
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
        <div
          style={{ background: `${stat.color}15` }}
          className="w-12 h-12 rounded-xl flex items-center justify-center"
        >
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
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#E8A33D]"></span>
            <span className="text-xs text-gray-500">Users</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#2F6D4F]"></span>
            <span className="text-xs text-gray-500">Properties</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#C1502E]"></span>
            <span className="text-xs text-gray-500">Deals</span>
          </div>
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
                <div
                  className="w-4 rounded-t-sm bg-[#E8A33D] transition-all duration-500"
                  style={{ height: `${userHeight}%`, minHeight: '4px' }}
                ></div>
                <div
                  className="w-4 rounded-t-sm bg-[#2F6D4F] transition-all duration-500"
                  style={{ height: `${propertyHeight}%`, minHeight: '4px' }}
                ></div>
                <div
                  className="w-4 rounded-t-sm bg-[#C1502E] transition-all duration-500"
                  style={{ height: `${dealHeight}%`, minHeight: '4px' }}
                ></div>
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
    verified: { label: "Imethibitishwa", color: "bg-green-100 text-green-700" },
    rejected: { label: "Imekataliwa", color: "bg-red-100 text-red-700" },
    completed: { label: "Imekamilika", color: "bg-green-100 text-green-700" },
    negotiating: { label: "Inajadiliwa", color: "bg-yellow-100 text-yellow-700" },
  };
  
  const s = config[status] || config.pending;
  
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.color}`}>
      {s.label}
    </span>
  );
}

function UserTable({ users }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Watumiaji wa Hivi Karibuni</h3>
        <button className="text-[#E8A33D] text-sm font-medium hover:underline">
          Tazama Zote →
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Jina</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Aliungana</th>
              <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-500 uppercase"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3 text-sm font-medium text-gray-800">{user.name}</td>
                <td className="px-5 py-3 text-sm text-gray-500">{user.email}</td>
                <td className="px-5 py-3 text-sm text-gray-500">{user.role}</td>
                <td className="px-5 py-3"><StatusBadge status={user.status} /></td>
                <td className="px-5 py-3 text-sm text-gray-400">{user.joined}</td>
                <td className="px-5 py-3 text-right">
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ListingTable({ listings }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Mali Zilizowekwa</h3>
        <button className="text-[#E8A33D] text-sm font-medium hover:underline">
          Tazama Zote →
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Mali</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Muuzaji</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Bei</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Tarehe</th>
              <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-500 uppercase"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {listings.map((listing) => (
              <tr key={listing.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3 text-sm font-medium text-gray-800">{listing.title}</td>
                <td className="px-5 py-3 text-sm text-gray-500">{listing.seller}</td>
                <td className="px-5 py-3 text-sm font-semibold text-[#C1502E]">
                  TZS {listing.price.toLocaleString()}
                </td>
                <td className="px-5 py-3"><StatusBadge status={listing.status} /></td>
                <td className="px-5 py-3 text-sm text-gray-400">{listing.date}</td>
                <td className="px-5 py-3 text-right">
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DealTable({ deals }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Deals za Hivi Karibuni</h3>
        <button className="text-[#E8A33D] text-sm font-medium hover:underline">
          Tazama Zote →
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Mali</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Mnunuzi</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Muuzaji</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Kiasi</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-500 uppercase"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {deals.map((deal) => (
              <tr key={deal.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3 text-sm font-medium text-gray-800">{deal.property}</td>
                <td className="px-5 py-3 text-sm text-gray-500">{deal.buyer}</td>
                <td className="px-5 py-3 text-sm text-gray-500">{deal.seller}</td>
                <td className="px-5 py-3 text-sm font-semibold text-[#C1502E]">
                  TZS {deal.amount.toLocaleString()}
                </td>
                <td className="px-5 py-3"><StatusBadge status={deal.status} /></td>
                <td className="px-5 py-3 text-right">
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function AdminDashboard() {
  const { t } = useLanguage();
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Check if user is admin
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

  return (
    <div style={{ fontFamily: FONTS.body, background: COLORS.sand }} className="min-h-screen">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=Manrope:wght@400;500;600;700&display=swap');
      `}</style>

      {/* ============================================================ */}
      {/* HEADER */}
      {/* ============================================================ */}
      <header
        style={{ background: COLORS.night }}
        className="sticky top-0 z-50 w-full flex items-center justify-between px-4 sm:px-6 py-3"
      >
        <div className="flex items-center gap-3">
          <span
            style={{ fontFamily: FONTS.display, color: COLORS.sand }}
            className="text-lg sm:text-xl font-semibold tracking-tight"
          >
            SokoMkononi
          </span>
          <span className="text-[10px] font-semibold bg-[#E8A33D]/20 text-[#E8A33D] px-2.5 py-0.5 rounded-full">
            ADMIN
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button className="text-white/60 hover:text-white transition-colors">
            <Search size={18} />
          </button>
          
          <button
            onClick={handleLogout}
            className="text-white/60 hover:text-white transition-colors flex items-center gap-1.5 text-sm"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Toka</span>
          </button>
          
          <div className="w-8 h-8 rounded-full bg-[#E8A33D] flex items-center justify-center text-[#101A2E] font-bold text-sm">
            {user?.name?.charAt(0) || "A"}
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* MAIN CONTENT */}
      {/* ============================================================ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={{ fontFamily: FONTS.display }} className="text-2xl sm:text-3xl font-semibold text-gray-800">
              Admin Dashboard
            </h1>
            <p className="text-gray-500 text-sm">Dhibiti mfumo mzima wa SokoMkononi</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
              <Download size={16} />
              Export Report
            </button>
            <button className="px-4 py-2 bg-[#E8A33D] text-[#101A2E] rounded-lg text-sm font-semibold hover:bg-[#B87A1F] transition-colors flex items-center gap-2">
              <Filter size={16} />
              Filter
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {STATS.map((stat) => (
            <StatCard key={stat.id} stat={stat} />
          ))}
        </div>

        {/* Chart */}
        <div className="mb-6">
          <SimpleChart />
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UserTable users={RECENT_USERS} />
          <ListingTable listings={RECENT_LISTINGS} />
        </div>

        <div className="mt-6">
          <DealTable deals={RECENT_DEALS} />
        </div>
      </main>
    </div>
  );
}
