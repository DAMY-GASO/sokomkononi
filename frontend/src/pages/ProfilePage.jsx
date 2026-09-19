// ============================================================
// ProfilePage.jsx
// Wasifu — bilingual kamili + PageLoader.
// ============================================================

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useAuth,
  logoutAsync,
  updateProfileAsync,
  changePasswordAsync,
} from "../stores/authStore.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import BottomNav from "../components/BottomNav.jsx";
import {
  useDashboardSide,
  setDashboardSide,
} from "../config/dashboardSideStore.js";
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
  Tag,
  ShoppingBag,
} from "lucide-react";

import PageLoader from "../components/PageLoader.jsx";

const COLORS = {
  night: "#101A2E",
  sand: "#F5F3EC",
  gold: "#E8A33D",
  green: "#2F6D4F",
  rust: "#C1502E",
  sandLine: "#E6E2D6",
};

const REGIONS = [
  "Arusha", "Dar es Salaam", "Dodoma", "Geita", "Iringa", "Kagera", "Katavi",
  "Kigoma", "Kilimanjaro", "Lindi", "Manyara", "Mara", "Mbeya", "Morogoro",
  "Mtwara", "Mwanza", "Njombe", "Pwani", "Rukwa", "Ruvuma", "Shinyanga",
  "Simiyu", "Singida", "Songwe", "Tabora", "Tanga",
  "Kaskazini Pemba", "Kusini Pemba", "Kaskazini Unguja", "Kusini Unguja",
  "Mjini Magharibi",
];

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
    <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
      <div className="flex flex-col items-center gap-2">
        <div
          style={{ background: `${color}15` }}
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        >
          <Icon size={18} color={color} />
        </div>
        <div>
          <p className="text-xl font-bold text-primary">{value}</p>
          <p className="text-body-sm text-secondary">{label}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// OVERVIEW TAB — haina mabadiliko (inatumia props)
// ============================================================
function OverviewTab({ user, lang, activities = [], viewMode = "seller" }) {
  const stats = user?.stats || {
    listings: 0,
    saved: 0,
    deals: 0,
    rating: 0,
    reviews: 0,
    inquiries: 0,
    offersSent: 0,
    viewings: 0,
    purchases: 0,
  };
  const bioText =
    typeof user.bio === "object"
      ? user.bio?.[lang] || user.bio?.sw
      : user.bio;
  const locationText =
    typeof user.location === "object"
      ? user.location?.[lang] || user.location?.sw
      : user.location;

  const sellerStats = [
    { icon: Home, value: stats.listings || 0, label: lang === "sw" ? "Mali Zangu" : "My Listings", color: COLORS.gold },
    { icon: MessageSquare, value: stats.deals || 0, label: lang === "sw" ? "Deals Zilizofungwa" : "Deals Closed", color: COLORS.green },
    { icon: Bell, value: stats.inquiries || 0, label: lang === "sw" ? "Maombi Yaliyopokelewa" : "Inquiries", color: COLORS.rust },
    { icon: Star, value: stats.rating || 0, label: lang === "sw" ? "Ukadiriaji" : "Rating", color: "#2563EB" },
  ];

  const buyerStats = [
    { icon: Heart, value: stats.saved || 0, label: lang === "sw" ? "Zilizohifadhiwa" : "Saved", color: COLORS.rust },
    { icon: MessageSquare, value: stats.offersSent || 0, label: lang === "sw" ? "Ofa Zilizotumwa" : "Offers Sent", color: COLORS.green },
    { icon: Calendar, value: stats.viewings || 0, label: lang === "sw" ? "Ziara Zilizopangwa" : "Viewings", color: "#2563EB" },
    { icon: ShoppingBag, value: stats.purchases || 0, label: lang === "sw" ? "Ununuzi Uliokamilika" : "Purchases", color: COLORS.gold },
  ];

  const activeStats = viewMode === "buyer" ? buyerStats : sellerStats;

  const filteredActivities = activities.filter((a) =>
    a.type ? a.type === viewMode : true
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {activeStats.map((s, i) => (
          <StatCard key={i} icon={s.icon} value={s.value} label={s.label} color={s.color} />
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-primary mb-3">
          {lang === "sw" ? "Kuhusu Mimi" : "About Me"}
        </h3>
        <p className="text-sm text-secondary leading-relaxed">
          {bioText || (lang === "sw" ? "Hakuna maelezo bado" : "No bio yet")}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-primary mb-4">
          {lang === "sw" ? "Taarifa za Akaunti" : "Account Information"}
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Mail size={16} className="text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-sm text-secondary">
                {lang === "sw" ? "Barua Pepe" : "Email"}
              </p>
              <p className="text-sm text-primary truncate">
                {user.email || "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Phone size={16} className="text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-sm text-secondary">
                {lang === "sw" ? "Simu" : "Phone"}
              </p>
              <p className="text-sm text-primary">{user.phone || "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <MapPin size={16} className="text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-sm text-secondary">
                {lang === "sw" ? "Mahali" : "Location"}
              </p>
              <p className="text-sm text-primary">{locationText || "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Calendar size={16} className="text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-sm text-secondary">
                {lang === "sw" ? "Mwanachama Tangu" : "Member Since"}
              </p>
              <p className="text-sm text-primary">
                {(user.memberSince || user.joinedAt)
                  ? new Date(user.memberSince || user.joinedAt).toLocaleDateString(
                      lang === "sw" ? "sw-TZ" : "en-US",
                      { month: "long", year: "numeric" }
                    )
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {filteredActivities.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex flex-col items-center text-center gap-1 mb-4">
            <h3 className="font-semibold text-primary">
              {lang === "sw"
                ? "Shughuli za Hivi Karibuni"
                : "Recent Activity"}
            </h3>
            <Link
              to="/dashboard"
              className="text-body-sm text-[#E8A33D] font-medium hover:underline"
            >
              {lang === "sw" ? "Tazama Zote" : "View All"} →
            </Link>
          </div>
          <div className="space-y-3">
            {filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0"
              >
                <div className="w-2 h-2 rounded-full bg-[#E8A33D] mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-primary">
                    {typeof activity.title === "object"
                      ? activity.title[lang]
                      : activity.title}
                  </p>
                  <p className="text-body-sm text-secondary truncate">
                    {typeof activity.description === "object"
                      ? activity.description[lang]
                      : activity.description}
                  </p>
                  <p className="text-body-sm text-muted mt-1">
                    {typeof activity.time === "object"
                      ? activity.time[lang]
                      : activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// EDIT PROFILE TAB — sasa inatumia updateProfileAsync (API HALISI)
// ============================================================
function EditProfileTab({ user, lang }) {
  const initialBio =
    typeof user.bio === "object" ? user.bio?.[lang] || "" : user.bio || "";
  const initialLocation =
    typeof user.location === "object"
      ? user.location?.[lang] || ""
      : user.location || "";

  const [form, setForm] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    location: initialLocation,
    bio: initialBio,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [avatar, setAvatar] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    // ⬇️ MABADILIKO: Badilisha setTimeout fake → updateProfileAsync halisi
    const res = await updateProfileAsync({
      name: form.name,
      phone: form.phone,
      bio: { sw: form.bio, en: form.bio },
      location: { sw: form.location, en: form.location },
    });

    setSaving(false);

    if (!res.ok) {
      const err = res.error;
      const firstFieldError =
        err?.data && typeof err.data === "object" && !err.data.detail
          ? Object.values(err.data).flat().find((v) => typeof v === "string")
          : null;
      setError(
        err?.data?.detail ||
          firstFieldError ||
          err?.message ||
          (lang === "sw" ? "Imeshindwa kuhifadhi" : "Failed to save")
      );
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setAvatar(URL.createObjectURL(file));
    // TODO: upload avatar kwa backend (baada ya endpoint kupatikana)
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-primary mb-4 text-center">
          {lang === "sw" ? "Picha ya Wasifu" : "Profile Picture"}
        </h3>
        <div className="flex flex-col items-center gap-4">
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
          <div className="text-center">
            <p className="text-sm font-medium text-primary">
              {lang === "sw" ? "Badilisha Picha" : "Change Picture"}
            </p>
            <p className="text-body-sm text-secondary mt-1">
              {lang === "sw"
                ? "JPG, PNG au GIF. Kiwango cha juu 2MB."
                : "JPG, PNG or GIF. Max 2MB."}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-primary mb-4 text-center">
          {lang === "sw" ? "Taarifa za Kibinafsi" : "Personal Information"}
        </h3>
        <div className="space-y-4 max-w-md mx-auto">
          <div>
            <label className="block text-body-sm font-semibold text-secondary mb-1.5 text-center">
              {lang === "sw" ? "Jina Kamili" : "Full Name"}
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-colors text-center"
              />
            </div>
          </div>

          <div>
            <label className="block text-body-sm font-semibold text-secondary mb-1.5 text-center">
              {lang === "sw" ? "Barua Pepe" : "Email"}
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="email"
                value={form.email}
                readOnly
                className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 text-sm bg-gray-50 text-secondary focus:outline-none cursor-not-allowed text-center"
              />
            </div>
            <p className="text-body-sm text-muted mt-1 text-center">
              {lang === "sw"
                ? "Barua pepe haiwezi kubadilishwa"
                : "Email cannot be changed"}
            </p>
          </div>

          <div>
            <label className="block text-body-sm font-semibold text-secondary mb-1.5 text-center">
              {lang === "sw" ? "Namba ya Simu" : "Phone Number"}
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-colors text-center"
              />
            </div>
          </div>

          <div>
            <label className="block text-body-sm font-semibold text-secondary mb-1.5 text-center">
              {lang === "sw" ? "Mahali" : "Location"}
            </label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-colors text-center"
              />
            </div>
          </div>

          <div>
            <label className="block text-body-sm font-semibold text-secondary mb-1.5 text-center">
              {lang === "sw" ? "Kuhusu Mimi" : "About Me"}
            </label>
            <textarea
              rows={4}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-colors resize-none text-center"
              placeholder={
                lang === "sw"
                  ? "Andika kuhusu wewe mwenyewe..."
                  : "Write about yourself..."
              }
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        {error && (
          <p className="flex items-center gap-1.5 text-sm text-[#C1502E]">
            <AlertTriangle size={14} />
            {error}
          </p>
        )}
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
            ? lang === "sw" ? "Inahifadhi..." : "Saving..."
            : lang === "sw" ? "Hifadhi Mabadiliko" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

// ============================================================
// SECURITY TAB — sasa inatumia changePasswordAsync (API HALISI)
// ============================================================
function SecurityTab({ lang }) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ current: "", new: "", confirm: "" });
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

    // ⬇️ MABADILIKO: Badilisha setTimeout fake → changePasswordAsync halisi
    const res = await changePasswordAsync({
      currentPassword: form.current,
      newPassword: form.new,
      confirmPassword: form.confirm,
    });

    setSaving(false);

    if (!res.ok) {
      const err = res.error;
      const firstFieldError =
        err?.data && typeof err.data === "object" && !err.data.detail
          ? Object.values(err.data).flat().find((v) => typeof v === "string")
          : null;
      setError(
        err?.data?.detail ||
          firstFieldError ||
          err?.message ||
          (lang === "sw" ? "Imeshindwa kubadilisha nenosiri" : "Failed to change password")
      );
      return;
    }

    setSaved(true);
    setForm({ current: "", new: "", confirm: "" });
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-primary mb-4 text-center">
          {lang === "sw" ? "Badilisha Nenosiri" : "Change Password"}
        </h3>
        <div className="space-y-4 max-w-md mx-auto">
          <div>
            <label className="block text-body-sm font-semibold text-secondary mb-1.5 text-center">
              {lang === "sw" ? "Nenosiri la Sasa" : "Current Password"}
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type={showCurrent ? "text" : "password"}
                value={form.current}
                onChange={(e) => setForm({ ...form, current: e.target.value })}
                className="w-full border border-gray-300 rounded-lg pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-colors text-center"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary"
                aria-label={lang === "sw" ? "Onyesha" : "Show"}
              >
                {showCurrent ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-body-sm font-semibold text-secondary mb-1.5 text-center">
              {lang === "sw" ? "Nenosiri Jipya" : "New Password"}
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type={showNew ? "text" : "password"}
                value={form.new}
                onChange={(e) => setForm({ ...form, new: e.target.value })}
                className="w-full border border-gray-300 rounded-lg pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-colors text-center"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary"
                aria-label={lang === "sw" ? "Onyesha" : "Show"}
              >
                {showNew ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-body-sm font-semibold text-secondary mb-1.5 text-center">
              {lang === "sw" ? "Thibitisha Nenosiri Jipya" : "Confirm New Password"}
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type={showConfirm ? "text" : "password"}
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                className="w-full border border-gray-300 rounded-lg pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-colors text-center"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary"
                aria-label={lang === "sw" ? "Onyesha" : "Show"}
              >
                {showConfirm ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-[#C1502E] flex items-center justify-center gap-1.5">
              <AlertTriangle size={14} />
              {error}
            </p>
          )}

          {saved && (
            <p className="text-sm text-[#2F6D4F] flex items-center justify-center gap-1.5">
              <Check size={16} />
              {lang === "sw" ? "Nenosiri limebadilishwa!" : "Password changed!"}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full px-6 py-2.5 bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] rounded-lg font-semibold text-sm transition-colors disabled:opacity-60"
          >
            {saving
              ? lang === "sw" ? "Inabadilisha..." : "Changing..."
              : lang === "sw" ? "Badilisha Nenosiri" : "Change Password"}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-[#2F6D4F]/10 flex items-center justify-center">
            <Shield size={18} className="text-[#2F6D4F]" />
          </div>
          <div>
            <h3 className="h-card">
              {lang === "sw" ? "Uthibitishaji wa Hatua Mbili" : "Two-Factor Authentication"}
            </h3>
            <p className="text-body-sm text-secondary mt-0.5">
              {lang === "sw"
                ? "Ongeza usalama kwa akaunti yako"
                : "Add extra security to your account"}
            </p>
          </div>
          <button className="text-sm font-medium text-[#E8A33D] hover:underline">
            {lang === "sw" ? "Washa" : "Enable"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-primary mb-4 text-center">
          {lang === "sw" ? "Vifaa Vilivyounganishwa" : "Active Sessions"}
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <Globe size={14} className="text-secondary" />
              </div>
              <div>
                <p className="text-sm text-primary">
                  Chrome • {lang === "sw" ? "Dar es Salaam" : "Dar es Salaam"}
                </p>
                <p className="text-body-sm text-secondary">
                  {lang === "sw" ? "Kifaa cha sasa" : "Current device"}
                </p>
              </div>
            </div>
            <span className="text-body-sm font-medium text-[#2F6D4F] bg-[#2F6D4F]/10 px-2 py-1 rounded-full">
              {lang === "sw" ? "Hai" : "Active"}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#C1502E]/30 p-5">
        <h3 className="font-semibold text-[#C1502E] mb-4 flex items-center justify-center gap-2 text-center">
          <AlertTriangle size={18} />
          {lang === "sw" ? "Eneo la Hatari" : "Danger Zone"}
        </h3>
        <div className="space-y-3">
          <div className="flex flex-col items-center text-center gap-3">
            <div>
              <p className="text-sm font-medium text-primary">
                {lang === "sw" ? "Futa Akaunti" : "Delete Account"}
              </p>
              <p className="text-body-sm text-secondary mt-0.5">
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
// NOTIFICATIONS TAB — local state pekee (hakuna backend bado)
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

  const toggle = (key) =>
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

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
          <h3 className="font-semibold text-primary mb-4 text-center">
            {section.title}
          </h3>
          <div className="space-y-3">
            {section.items.map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-sm text-secondary">{item.label}</span>
                <Toggle
                  checked={settings[item.key]}
                  onChange={() => toggle(item.key)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      <p className="text-body-sm text-muted text-center">
        {lang === "sw"
          ? "Mapendeleo haya yanahifadhiwa kienyeji. Backend integration inakuja."
          : "These preferences are stored locally. Backend integration coming soon."}
      </p>
    </div>
  );
}

// ============================================================
// PREFERENCES TAB — sasa inasave language kwa updateProfileAsync
// ============================================================
function PreferencesTab({ lang, setLang }) {
  const [prefs, setPrefs] = useState({
    language: lang,
    currency: "TZS",
    region: "Dar es Salaam",
    showPhone: true,
    showEmail: false,
  });

  const handleLanguageChange = (value) => {
    setPrefs({ ...prefs, language: value });
    if (setLang) setLang(value);
    // TODO: kama backend ina `preferred_language` field, ongeza:
    // updateProfileAsync({ preferred_language: value });
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-primary mb-4 text-center">
          {lang === "sw" ? "Mapendeleo ya Jumla" : "General Preferences"}
        </h3>
        <div className="space-y-4 max-w-md mx-auto">
          <div>
            <label className="block text-body-sm font-semibold text-secondary mb-1.5 text-center">
              {lang === "sw" ? "Lugha" : "Language"}
            </label>
            <select
              value={prefs.language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-colors text-center"
            >
              <option value="sw">Kiswahili</option>
              <option value="en">English</option>
            </select>
          </div>

          <div>
            <label className="block text-body-sm font-semibold text-secondary mb-1.5 text-center">
              {lang === "sw" ? "Sarafu" : "Currency"}
            </label>
            <select
              value={prefs.currency}
              onChange={(e) => setPrefs({ ...prefs, currency: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-colors text-center"
            >
              <option value="TZS">TZS - Tanzania Shilling</option>
              <option value="USD">USD - US Dollar</option>
            </select>
          </div>

          <div>
            <label className="block text-body-sm font-semibold text-secondary mb-1.5 text-center">
              {lang === "sw" ? "Mkoa wa Default" : "Default Region"}
            </label>
            <select
              value={prefs.region}
              onChange={(e) => setPrefs({ ...prefs, region: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-colors text-center"
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-primary mb-4 text-center">
          {lang === "sw" ? "Faragha" : "Privacy"}
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary">
                {lang === "sw" ? "Onyesha Namba ya Simu" : "Show Phone Number"}
              </p>
              <p className="text-body-sm text-secondary mt-0.5">
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
              <p className="text-sm text-secondary">
                {lang === "sw" ? "Onyesha Barua Pepe" : "Show Email"}
              </p>
              <p className="text-body-sm text-secondary mt-0.5">
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
  // ⬇️ MABADILIKO: useAuth() kutoka authStore — haina logout/setUser
  // const { user, logout, setUser } = useAuth();  ❌ ONDOA
  const { user, isLoading } = useAuth();
  const { lang, setLang } = useLanguage();
  const navigate = useNavigate();

  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(id);
  }, []);

  const [activeTab, setActiveTab] = useState("overview");

  // ⬇️ MABADILIKO: Ondoa local profileUser — user kutoka authStore ndiyo source of truth
  // Tunaweka stats kama local supplementary state tu
  const [stats, setStats] = useState({
    listings: 0,
    saved: 0,
    deals: 0,
    rating: 0,
    reviews: 0,
    inquiries: 0,
    offersSent: 0,
    viewings: 0,
    purchases: 0,
    ...(user?.stats || {}),
  });

  const dashboardSide = useDashboardSide();
  const [viewMode, setViewModeState] = useState(dashboardSide);

  useEffect(() => {
    setViewModeState(dashboardSide);
  }, [dashboardSide]);

  const setViewMode = (mode) => {
    setViewModeState(mode);
    setDashboardSide(mode);
  };

  const handleLogout = async () => {
    // ⬇️ MABADILIKO: logoutAsync badala ya logout
    await logoutAsync();
    navigate("/login");
  };

  // ⬇️ MABADILIKO: Ondoa handleSaveProfile — EditProfileTab sasa inaita updateProfileAsync moja kwa moja

  if (!ready || isLoading) {
    return <PageLoader lang={lang} />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-secondary">
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

  // ⬇️ MABADILIKO: profileUser → user (moja kwa moja kutoka authStore)
  const profileUser = { ...user, stats };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <section className="bg-[#101A2E] text-white py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-full bg-[#E8A33D] flex items-center justify-center text-[#101A2E] font-bold text-4xl">
                {profileUser.name?.charAt(0) || "U"}
              </div>
              {profileUser.isVerified && (
                <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#2F6D4F] flex items-center justify-center border-2 border-[#101A2E]">
                  <Check size={14} color="white" />
                </div>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                {profileUser.name || "User"}
              </h1>
              <p className="text-white/60 text-sm mt-1">
                {profileUser.email || "—"}
              </p>
              <div className="flex items-center justify-center gap-3 mt-3 flex-wrap">
                {profileUser.isVerified && (
                  <span className="text-body-sm font-medium bg-[#2F6D4F]/20 text-[#2F6D4F] px-3 py-1 rounded-full flex items-center gap-1">
                    <Shield size={12} />
                    {lang === "sw" ? "Amethibitishwa" : "Verified"}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
              <button
                onClick={() => setViewMode("seller")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  viewMode === "seller"
                    ? "bg-[#E8A33D] text-[#101A2E]"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <Tag size={14} />
                {lang === "sw" ? "Muuzaji" : "Seller"}
              </button>
              <button
                onClick={() => setViewMode("buyer")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  viewMode === "buyer"
                    ? "bg-[#E8A33D] text-[#101A2E]"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <ShoppingBag size={14} />
                {lang === "sw" ? "Mnunuzi" : "Buyer"}
              </button>
            </div>

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

      <div className="bg-white border-b border-gray-100 sticky top-16 z-40">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex justify-center overflow-x-auto -mb-px">
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
                      : "border-transparent text-secondary hover:text-secondary"
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

      <div className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === "overview" && (
          <OverviewTab
            user={profileUser}
            lang={lang}
            activities={[]}
            viewMode={viewMode}
          />
        )}
        {activeTab === "edit" && (
          // ⬇️ MABADILIKO: Ondoa onSave prop — tab inajisimamia yenyewe
          <EditProfileTab user={profileUser} lang={lang} />
        )}
        {activeTab === "security" && <SecurityTab lang={lang} />}
        {activeTab === "notifications" && <NotificationsTab lang={lang} />}
        {activeTab === "preferences" && (
          <PreferencesTab lang={lang} setLang={setLang} />
        )}
      </div>

      <Footer />
      <BottomNav />
    </div>
  );
}
