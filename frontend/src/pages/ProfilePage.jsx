import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import BottomNav from "../components/BottomNav.jsx";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Pencil,
  Check,
  X,
  Shield,
  Lock,
  Bell,
  Globe,
  Eye,
  EyeOff,
  LogOut,
  Trash2,
  Home,
  Heart,
  MessageSquare,
  Star,
  Calendar,
  Settings,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

const COLORS = {
  night: "#101A2E",
  sand: "#F5F3EC",
  gold: "#E8A33D",
  green: "#2F6D4F",
  rust: "#C1502E",
  sandLine: "#E6E2D6",
};

// Mock user data - ina stats kamili
const MOCK_USER = {
  id: "u1",
  name: "John Doe",
  email: "john@email.com",
  phone: "0743 895 038",
  location: "Dar es Salaam, Tanzania",
  bio: "Muuzaji wa mali na mfanyabiashara wa Tanzania. Nina uzoefu wa miaka 5 katika sekta ya mali.",
  avatar: null,
  role: "seller",
  memberSince: "2024-01-15",
  verified: true,
  stats: {
    listings: 12,
    saved: 8,
    deals: 5,
    rating: 4.8,
    reviews: 23,
  },
};

// Mock recent activity
const RECENT_ACTIVITY = [
  {
    id: 1,
    type: "listing",
    title: "Umeongeza mali mpya",
    description: "Nyumba ya Ghorofa Mbezi Beach",
    time: "Saa 2 zilizopita",
  },
  {
    id: 2,
    type: "message",
    title: "Ujumbe mpya kutoka kwa Sarah",
    description: "Habari! Nina nia ya kununua nyumba yako...",
    time: "Siku 1 iliyopita",
  },
  {
    id: 3,
    type: "sale",
    title: "Mali yako imeuzwa",
    description: "Toyota Harrier 2016 - TZS 42,000,000",
    time: "Siku 3 zilizopita",
  },
  {
    id: 4,
    type: "save",
    title: "Umehifadhi mali",
    description: "Kiwanja Ubungo — Hati Miliki",
    time: "Wiki 1 iliyopita",
  },
];

// ============================================================
// TABS
// ============================================================

const TABS = [
  { id: "overview", label: { sw: "Muhtasari", en: "Overview" }, icon: User },
  { id: "edit", label: { sw: "Hariri Wasifu", en: "Edit Profile" }, icon: Pencil },
  { id: "security", label: { sw: "Usalama", en: "Security" }, icon: Shield },
  { id: "notifications", label: { sw: "Taarifa", en: "Notifications" }, icon: Bell },
  { id: "preferences", label: { sw: "Mapendeleo", en: "Preferences" }, icon: Settings },
];

// ============================================================
// STAT CARD
// ============================================================

function StatCard({ icon: Icon, value, label, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-center gap-3">
        <div
          style={{ background: `${color}15` }}
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        >
          <Icon size={18} color={color} />
        </div>
        <div>
          <p className="text-xl font-bold text-gray-800">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// OVERVIEW TAB
// ============================================================

function OverviewTab({ user, lang, activities }) {
  // ✅ HAKIKISHA stats ipo
  const stats = user?.stats || MOCK_USER.stats;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={Home}
          value={stats.listings || 0}
          label={lang === "sw" ? "Mali Zangu" : "My Listings"}
          color={COLORS.gold}
        />
        <StatCard
          icon={Heart}
          value={stats.saved || 0}
          label={lang === "sw" ? "Zilizohifadhiwa" : "Saved"}
          color={COLORS.rust}
        />
        <StatCard
          icon={MessageSquare}
          value={stats.deals || 0}
          label={lang === "sw" ? "Deals" : "Deals"}
          color={COLORS.green}
        />
        <StatCard
          icon={Star}
          value={stats.rating || 0}
          label={lang === "sw" ? "Ukadiriaji" : "Rating"}
          color="#2563EB"
        />
      </div>

      {/* Bio */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 mb-3">
          {lang === "sw" ? "Kuhusu Mimi" : "About Me"}
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          {user.bio || (lang === "sw" ? "Hakuna maelezo bado" : "No bio yet")}
        </p>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">
          {lang === "sw" ? "Taarifa za Akaunti" : "Account Information"}
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Mail size={16} className="text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">
                {lang === "sw" ? "Barua Pepe" : "Email"}
              </p>
              <p className="text-sm text-gray-800 truncate">
                {user.email || "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Phone size={16} className="text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">
                {lang === "sw" ? "Simu" : "Phone"}
              </p>
              <p className="text-sm text-gray-800">{user.phone || "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <MapPin size={16} className="text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">
                {lang === "sw" ? "Mahali" : "Location"}
              </p>
              <p className="text-sm text-gray-800">{user.location || "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Calendar size={16} className="text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">
                {lang === "sw" ? "Mwanachama Tangu" : "Member Since"}
              </p>
              <p className="text-sm text-gray-800">
                {user.memberSince
                  ? new Date(user.memberSince).toLocaleDateString(
                      lang === "sw" ? "sw-TZ" : "en-US",
                      { month: "long", year: "numeric" }
                    )
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">
            {lang === "sw" ? "Shughuli za Hivi Karibuni" : "Recent Activity"}
          </h3>
          <Link
            to="/dashboard"
            className="text-xs text-[#E8A33D] font-medium hover:underline"
          >
            {lang === "sw" ? "Tazama Zote" : "View All"} →
          </Link>
        </div>
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0"
            >
              <div className="w-2 h-2 rounded-full bg-[#E8A33D] mt-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">{activity.title}</p>
                <p className="text-xs text-gray-500 truncate">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// EDIT PROFILE TAB
// ============================================================

function EditProfileTab({ user, lang, onSave }) {
  const [form, setForm] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    location: user.location || "",
    bio: user.bio || "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatar, setAvatar] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    // TODO: API call to update profile
    await new Promise((resolve) => setTimeout(resolve, 1000));
    onSave(form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(URL.createObjectURL(file));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">
          {lang === "sw" ? "Picha ya Wasifu" : "Profile Picture"}
        </h3>
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-[#E8A33D]/10 flex items-center justify-center text-[#E8A33D] font-bold text-3xl overflow-hidden">
              {avatar ? (
                <img src={avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                user.name?.charAt(0) || "U"
              )}
            </div>
            <label className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#E8A33D] text-[#101A2E] flex items-center justify-center cursor-pointer hover:bg-[#B87A1F] transition-colors">
              <Camera size={14} />
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleAvatarChange}
              />
            </label>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">
              {lang === "sw" ? "Badilisha Picha" : "Change Picture"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {lang === "sw"
                ? "JPG, PNG au GIF. Kiwango cha juu 2MB."
                : "JPG, PNG or GIF. Max 2MB."}
            </p>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">
          {lang === "sw" ? "Taarifa za Kibinafsi" : "Personal Information"}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              {lang === "sw" ? "Jina Kamili" : "Full Name"}
            </label>
            <div className="relative">
              <User
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              {lang === "sw" ? "Barua Pepe" : "Email"}
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              {lang === "sw" ? "Namba ya Simu" : "Phone Number"}
            </label>
            <div className="relative">
              <Phone
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              {lang === "sw" ? "Mahali" : "Location"}
            </label>
            <div className="relative">
              <MapPin
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              {lang === "sw" ? "Kuhusu Mimi" : "About Me"}
            </label>
            <textarea
              rows={4}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-colors resize-none"
              placeholder={
                lang === "sw"
                  ? "Andika kuhusu wewe mwenyewe..."
                  : "Write about yourself..."
              }
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-2">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-[#2F6D4F] font-medium">
            <Check size={16} />
            {lang === "sw" ? "Imehifadhiwa!" : "Saved!"}
          </span>
        )}
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] rounded-lg font-semibold text-sm transition-colors disabled:opacity-60"
        >
          {saving
            ? lang === "sw"
              ? "Inahifadhi..."
              : "Saving..."
            : lang === "sw"
            ? "Hifadhi Mabadiliko"
            : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

// ============================================================
// SECURITY TAB
// ============================================================

function SecurityTab({ lang }) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.current || !form.new || !form.confirm) {
      setError(lang === "sw" ? "Jaza sehemu zote" : "Fill all fields");
      return;
    }
    if (form.new.length < 6) {
      setError(
        lang === "sw"
          ? "Nenosiri lazima liwe na herufi 6 au zaidi"
          : "Password must be at least 6 characters"
      );
      return;
    }
    if (form.new !== form.confirm) {
      setError(lang === "sw" ? "Nenosiri hazifanani" : "Passwords don't match");
      return;
    }

    setSaving(true);
    // TODO: API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setForm({ current: "", new: "", confirm: "" });
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">
          {lang === "sw" ? "Badilisha Nenosiri" : "Change Password"}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              {lang === "sw" ? "Nenosiri la Sasa" : "Current Password"}
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type={showCurrent ? "text" : "password"}
                value={form.current}
                onChange={(e) => setForm({ ...form, current: e.target.value })}
                className="w-full border border-gray-300 rounded-lg pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrent ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              {lang === "sw" ? "Nenosiri Jipya" : "New Password"}
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type={showNew ? "text" : "password"}
                value={form.new}
                onChange={(e) => setForm({ ...form, new: e.target.value })}
                className="w-full border border-gray-300 rounded-lg pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              {lang === "sw" ? "Thibitisha Nenosiri Jipya" : "Confirm New Password"}
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type={showConfirm ? "text" : "password"}
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                className="w-full border border-gray-300 rounded-lg pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-[#C1502E] flex items-center gap-1.5">
              <AlertTriangle size={14} />
              {error}
            </p>
          )}

          {saved && (
            <p className="text-sm text-[#2F6D4F] flex items-center gap-1.5">
              <Check size={16} />
              {lang === "sw"
                ? "Nenosiri limebadilishwa!"
                : "Password changed!"}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] rounded-lg font-semibold text-sm transition-colors disabled:opacity-60"
          >
            {saving
              ? lang === "sw"
                ? "Inabadilisha..."
                : "Changing..."
              : lang === "sw"
              ? "Badilisha Nenosiri"
              : "Change Password"}
          </button>
        </div>
      </form>

      {/* Two Factor */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#2F6D4F]/10 flex items-center justify-center">
              <Shield size={18} className="text-[#2F6D4F]" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-sm">
                {lang === "sw" ? "Uthibitishaji wa Hatua Mbili" : "Two-Factor Authentication"}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {lang === "sw"
                  ? "Ongeza usalama kwa akaunti yako"
                  : "Add extra security to your account"}
              </p>
            </div>
          </div>
          <button className="text-sm font-medium text-[#E8A33D] hover:underline">
            {lang === "sw" ? "Washa" : "Enable"}
          </button>
        </div>
      </div>

      {/* Sessions */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">
          {lang === "sw" ? "Vifaa Vilivyounganishwa" : "Active Sessions"}
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <Globe size={14} className="text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-gray-800">
                  Chrome • Dar es Salaam
                </p>
                <p className="text-xs text-gray-500">
                  {lang === "sw" ? "Kifaa cha sasa" : "Current device"}
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-[#2F6D4F] bg-[#2F6D4F]/10 px-2 py-1 rounded-full">
              {lang === "sw" ? "Hai" : "Active"}
            </span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border border-[#C1502E]/30 p-5">
        <h3 className="font-semibold text-[#C1502E] mb-4 flex items-center gap-2">
          <AlertTriangle size={18} />
          {lang === "sw" ? "Eneo la Hatari" : "Danger Zone"}
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">
                {lang === "sw" ? "Futa Akaunti" : "Delete Account"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {lang === "sw"
                  ? "Hii itafuta akaunti yako na taarifa zote"
                  : "This will delete your account and all data"}
              </p>
            </div>
            <button className="px-4 py-2 border border-[#C1502E] text-[#C1502E] rounded-lg text-sm font-medium hover:bg-[#C1502E]/5 transition-colors flex items-center gap-1.5">
              <Trash2 size={14} />
              {lang === "sw" ? "Futa" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// NOTIFICATIONS TAB
// ============================================================

function NotificationsTab({ lang }) {
  const [settings, setSettings] = useState({
    email_deals: true,
    email_messages: true,
    email_promotions: false,
    email_newsletter: true,
    sms_deals: true,
    sms_messages: false,
    sms_promotions: false,
    push_deals: true,
    push_messages: true,
    push_promotions: false,
  });

  const toggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const Toggle = ({ checked, onChange }) => (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        checked ? "bg-[#E8A33D]" : "bg-gray-200"
      }`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );

  const sections = [
    {
      title: lang === "sw" ? "Barua Pepe" : "Email",
      items: [
        { key: "email_deals", label: lang === "sw" ? "Deals na Mali" : "Deals and Properties" },
        { key: "email_messages", label: lang === "sw" ? "Ujumbe" : "Messages" },
        { key: "email_promotions", label: lang === "sw" ? "Matangazo" : "Promotions" },
        { key: "email_newsletter", label: lang === "sw" ? "Newsletter" : "Newsletter" },
      ],
    },
    {
      title: "SMS",
      items: [
        { key: "sms_deals", label: lang === "sw" ? "Deals na Mali" : "Deals and Properties" },
        { key: "sms_messages", label: lang === "sw" ? "Ujumbe" : "Messages" },
        { key: "sms_promotions", label: lang === "sw" ? "Matangazo" : "Promotions" },
      ],
    },
    {
      title: lang === "sw" ? "Taarifa za Ndani" : "Push Notifications",
      items: [
        { key: "push_deals", label: lang === "sw" ? "Deals na Mali" : "Deals and Properties" },
        { key: "push_messages", label: lang === "sw" ? "Ujumbe" : "Messages" },
        { key: "push_promotions", label: lang === "sw" ? "Matangazo" : "Promotions" },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <div key={section.title} className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">{section.title}</h3>
          <div className="space-y-3">
            {section.items.map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{item.label}</span>
                <Toggle
                  checked={settings[item.key]}
                  onChange={() => toggle(item.key)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// PREFERENCES TAB
// ============================================================

function PreferencesTab({ lang }) {
  const [prefs, setPrefs] = useState({
    language: lang,
    currency: "TZS",
    region: "Dar es Salaam",
    showPhone: true,
    showEmail: false,
  });

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">
          {lang === "sw" ? "Mapendeleo ya Jumla" : "General Preferences"}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              {lang === "sw" ? "Lugha" : "Language"}
            </label>
            <select
              value={prefs.language}
              onChange={(e) => setPrefs({ ...prefs, language: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-colors"
            >
              <option value="sw">Kiswahili</option>
              <option value="en">English</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              {lang === "sw" ? "Sarafu" : "Currency"}
            </label>
            <select
              value={prefs.currency}
              onChange={(e) => setPrefs({ ...prefs, currency: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-colors"
            >
              <option value="TZS">TZS - Tanzania Shilling</option>
              <option value="USD">USD - US Dollar</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              {lang === "sw" ? "Mkoa wa Default" : "Default Region"}
            </label>
            <select
              value={prefs.region}
              onChange={(e) => setPrefs({ ...prefs, region: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-colors"
            >
              <option>Dar es Salaam</option>
              <option>Arusha</option>
              <option>Mwanza</option>
              <option>Dodoma</option>
              <option>Mbeya</option>
              <option>Zanzibar</option>
            </select>
          </div>
        </div>
      </div>

      {/* Privacy */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">
          {lang === "sw" ? "Faragha" : "Privacy"}
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">
                {lang === "sw" ? "Onyesha Namba ya Simu" : "Show Phone Number"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {lang === "sw"
                  ? "Watumiaji wengine wanaweza kuona namba yako"
                  : "Other users can see your phone number"}
              </p>
            </div>
            <button
              onClick={() => setPrefs({ ...prefs, showPhone: !prefs.showPhone })}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                prefs.showPhone ? "bg-[#E8A33D]" : "bg-gray-200"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  prefs.showPhone ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">
                {lang === "sw" ? "Onyesha Barua Pepe" : "Show Email"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {lang === "sw"
                  ? "Watumiaji wengine wanaweza kuona barua pepe yako"
                  : "Other users can see your email"}
              </p>
            </div>
            <button
              onClick={() => setPrefs({ ...prefs, showEmail: !prefs.showEmail })}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                prefs.showEmail ? "bg-[#E8A33D]" : "bg-gray-200"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  prefs.showEmail ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function ProfilePage() {
  const { user, logout, setUser } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  
  // ✅ HAKIKISHA profileUser ina stats kila wakati
  const [profileUser, setProfileUser] = useState({
    ...MOCK_USER,
    ...(user || {}),
    stats: {
      ...MOCK_USER.stats,
      ...(user?.stats || {}),
    },
  });

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleSaveProfile = (updatedData) => {
    const updated = {
      ...profileUser,
      ...updatedData,
      stats: {
        ...profileUser.stats,
        ...(updatedData.stats || {}),
      },
    };
    setProfileUser(updated);
    if (setUser) setUser(updated);
  };

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">
            {lang === "sw" ? "Tafadhali ingia kwanza" : "Please login first"}
          </p>
          <Link
            to="/login"
            className="mt-4 inline-block px-5 py-2 bg-[#E8A33D] text-[#101A2E] rounded-lg font-semibold text-sm"
          >
            {lang === "sw" ? "Ingia" : "Login"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* ================= HERO ================= */}
      <section className="bg-[#101A2E] text-white py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-full bg-[#E8A33D] flex items-center justify-center text-[#101A2E] font-bold text-4xl">
                {profileUser.name?.charAt(0) || "U"}
              </div>
              {profileUser.verified && (
                <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#2F6D4F] flex items-center justify-center border-2 border-[#101A2E]">
                  <Check size={14} color="white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold">
                {profileUser.name || "User"}
              </h1>
              <p className="text-white/60 text-sm mt-1">{profileUser.email || "—"}</p>
              <div className="flex items-center justify-center sm:justify-start gap-3 mt-3">
                <span className="text-xs font-medium bg-[#E8A33D]/20 text-[#E8A33D] px-3 py-1 rounded-full capitalize">
                  {profileUser.role || "user"}
                </span>
                {profileUser.verified && (
                  <span className="text-xs font-medium bg-[#2F6D4F]/20 text-[#2F6D4F] px-3 py-1 rounded-full flex items-center gap-1">
                    <Shield size={12} />
                    {lang === "sw" ? "Amethibitishwa" : "Verified"}
                  </span>
                )}
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 border border-white/20 hover:bg-white/10 rounded-lg text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              <LogOut size={16} />
              {lang === "sw" ? "Toka" : "Logout"}
            </button>
          </div>
        </div>
      </section>

      {/* ================= TABS ================= */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-40">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex overflow-x-auto -mb-px">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    isActive
                      ? "border-[#E8A33D] text-[#E8A33D]"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Icon size={16} />
                  {tab.label[lang]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === "overview" && (
          <OverviewTab
            user={profileUser}
            lang={lang}
            activities={RECENT_ACTIVITY}
          />
        )}
        {activeTab === "edit" && (
          <EditProfileTab
            user={profileUser}
            lang={lang}
            onSave={handleSaveProfile}
          />
        )}
        {activeTab === "security" && <SecurityTab lang={lang} />}
        {activeTab === "notifications" && <NotificationsTab lang={lang} />}
        {activeTab === "preferences" && <PreferencesTab lang={lang} />}
      </div>

      <Footer />
      <BottomNav />
    </div>
  );
}
