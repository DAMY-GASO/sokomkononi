// ============================================================
// ProfilePage.jsx
// Wasifu — bilingual kamili + PageLoader.
// + Delete Account (API)
// + 2FA Enable/Disable (mock — tayari kwa backend)
// ============================================================

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useAuth,
  logoutAsync,
  updateProfileAsync,
  changePasswordAsync,
  deleteAccountAsync,
} from "../config/authStore.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import BottomNav from "../components/BottomNav.jsx";
import {
  useDashboardSide,
  setDashboardSide,
} from "../config/dashboardSideStore.js";
import {
  User, Mail, Phone, MapPin, Camera, Pencil, Check, X, Shield, Lock,
  Bell, Globe, Eye, EyeOff, LogOut, Trash2, Home, Heart, MessageSquare,
  Star, Calendar, Settings, ChevronRight, AlertTriangle, Tag,
  ShoppingBag, Loader2, Copy, KeyRound,
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
// 2FA MODAL — Setup + Disable
// ============================================================
function TwoFactorModal({ mode, onClose, onEnable, onDisable, lang }) {
  const [step, setStep] = useState(mode === "enable" ? "intro" : "disable");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [backupCodes] = useState(() =>
    Array.from({ length: 8 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase()
    )
  );
  const [error, setError] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const handleEnable = () => {
    if (!code.trim() || code.length !== 6) {
      setError(t("Weka code ya herufi 6", "Enter 6-digit code"));
      return;
    }
    onEnable();
  };

  const handleDisable = () => {
    if (!password) {
      setError(t("Weka nenosiri lako", "Enter your password"));
      return;
    }
    onDisable();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        {step === "intro" && mode === "enable" && (
          <>
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-[#2F6D4F]/15 flex items-center justify-center mx-auto mb-3">
                <Shield size={26} className="text-[#2F6D4F]" />
              </div>
              <h3 className="text-lg font-bold text-primary">
                {t("Washa 2FA", "Enable 2FA")}
              </h3>
              <p className="text-sm text-secondary mt-2">
                {t(
                  "Ongeza usalama wa akaunti yako kwa kutumia app ya authenticator.",
                  "Add extra security using an authenticator app."
                )}
              </p>
            </div>
            <div className="bg-[#F5F3EC] rounded-xl p-4 mb-4 text-center">
              <p className="text-xs text-secondary mb-2">
                {t("Skana QR hii na Google Authenticator", "Scan this QR with Google Authenticator")}
              </p>
              <div className="w-32 h-32 mx-auto bg-white rounded-lg border-2 border-gray-200 flex items-center justify-center">
                <KeyRound size={48} className="text-muted" />
              </div>
              <p className="text-[10px] text-muted mt-2">
                {t("(QR itaonekana hapa baada ya backend)", "(QR will appear here once backend is ready)")}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-secondary"
              >
                {t("Ghairi", "Cancel")}
              </button>
              <button
                onClick={() => setStep("verify")}
                className="flex-1 py-2.5 bg-[#E8A33D] text-[#101A2E] rounded-lg text-sm font-semibold"
              >
                {t("Endelea", "Continue")}
              </button>
            </div>
          </>
        )}

        {step === "verify" && mode === "enable" && (
          <>
            <div className="text-center mb-5">
              <h3 className="text-lg font-bold text-primary">
                {t("Weka Code", "Enter Code")}
              </h3>
              <p className="text-sm text-secondary mt-2">
                {t("Weka code ya herufi 6 kutoka app", "Enter 6-digit code from app")}
              </p>
            </div>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
              className="w-full text-center text-2xl tracking-[0.5em] font-semibold border border-gray-300 rounded-lg px-3 py-3 outline-none focus:border-[#E8A33D]"
            />
            {error && (
              <p className="text-sm text-[#C1502E] mt-2 text-center">{error}</p>
            )}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setStep("intro")}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-secondary"
              >
                {t("Nyuma", "Back")}
              </button>
              <button
                onClick={handleEnable}
                className="flex-1 py-2.5 bg-[#2F6D4F] text-white rounded-lg text-sm font-semibold"
              >
                {t("Washa 2FA", "Enable 2FA")}
              </button>
            </div>
          </>
        )}

        {mode === "disable" && (
          <>
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-[#C1502E]/15 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle size={26} className="text-[#C1502E]" />
              </div>
              <h3 className="text-lg font-bold text-primary">
                {t("Zima 2FA", "Disable 2FA")}
              </h3>
              <p className="text-sm text-secondary mt-2">
                {t(
                  "Akaunti yako itakuwa salama kidogo. Weka nenosiri lako kuthibitisha.",
                  "Your account will be less secure. Enter your password to confirm."
                )}
              </p>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("Nenosiri lako", "Your password")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#E8A33D] text-center"
            />
            {error && (
              <p className="text-sm text-[#C1502E] mt-2 text-center">{error}</p>
            )}
            <div className="flex gap-2 mt-4">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-secondary"
              >
                {t("Ghairi", "Cancel")}
              </button>
              <button
                onClick={handleDisable}
                className="flex-1 py-2.5 bg-[#C1502E] text-white rounded-lg text-sm font-semibold"
              >
                {t("Zima", "Disable")}
              </button>
            </div>
          </>
        )}

        {step === "done" && (
          <>
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-[#2F6D4F]/15 flex items-center justify-center mx-auto mb-3">
                <Check size={26} className="text-[#2F6D4F]" />
              </div>
              <h3 className="text-lg font-bold text-primary">
                {t("2FA Imewashwa!", "2FA Enabled!")}
              </h3>
              <p className="text-sm text-secondary mt-2">
                {t(
                  "Hifadhi backup codes hizi mahali salama.",
                  "Save these backup codes somewhere safe."
                )}
              </p>
            </div>
            <div className="bg-[#F5F3EC] rounded-xl p-4 mb-4">
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((c, i) => (
                  <div
                    key={i}
                    className="bg-white rounded px-2 py-1.5 text-xs font-mono text-center text-primary"
                  >
                    {c}
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigator.clipboard?.writeText(backupCodes.join("\n"))}
                className="w-full mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#2F6D4F]"
              >
                <Copy size={12} />
                {t("Nakili codes", "Copy codes")}
              </button>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-[#E8A33D] text-[#101A2E] rounded-lg text-sm font-semibold"
            >
              {t("Nimemaliza", "Done")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// DELETE ACCOUNT MODAL
// ============================================================
function DeleteAccountModal({ onClose, onConfirm, lang, deleting }) {
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);
  const requiredText = "DELETE";

  const handleConfirm = () => {
    if (confirmText !== requiredText) {
      setError(
        t(
          `Andika "${requiredText}" ili kuthibitisha`,
          `Type "${requiredText}" to confirm`
        )
      );
      return;
    }
    onConfirm(reason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-full bg-[#C1502E]/15 flex items-center justify-center mx-auto mb-3">
            <Trash2 size={26} className="text-[#C1502E]" />
          </div>
          <h3 className="text-lg font-bold text-primary">
            {t("Futa Akaunti?", "Delete Account?")}
          </h3>
          <p className="text-sm text-secondary mt-2">
            {t(
              "Hatua hii haiwezi kurudishwa. Data yote itafutwa kabisa.",
              "This action cannot be undone. All data will be permanently deleted."
            )}
          </p>
        </div>

        <label className="block mb-3">
          <span className="text-xs font-semibold text-secondary">
            {t("Sababu (hiari)", "Reason (optional)")}
          </span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            disabled={deleting}
            placeholder={t(
              "Kwa nini unaondoka?",
              "Why are you leaving?"
            )}
            className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#E8A33D] resize-none disabled:opacity-50"
          />
        </label>

        <label className="block mb-4">
          <span className="text-xs font-semibold text-secondary">
            {t(
              `Andika "${requiredText}" kuthibitisha`,
              `Type "${requiredText}" to confirm`
            )}
          </span>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
            disabled={deleting}
            placeholder={requiredText}
            className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#C1502E] text-center font-mono disabled:opacity-50"
          />
        </label>

        {error && (
          <p className="text-sm text-[#C1502E] text-center mb-3">{error}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={deleting}
            className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-secondary disabled:opacity-50"
          >
            {t("Ghairi", "Cancel")}
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 bg-[#C1502E] text-white rounded-lg text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {deleting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {t("Inafuta...", "Deleting...")}
              </>
            ) : (
              <>
                <Trash2 size={14} />
                {t("Futa Akaunti", "Delete Account")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// OVERVIEW TAB — hakuna mabadiliko
// ============================================================
function OverviewTab({ user, lang, activities = [], viewMode = "seller" }) {
  const stats = user?.stats || {
    listings: 0, saved: 0, deals: 0, rating: 0, reviews: 0,
    inquiries: 0, offersSent: 0, viewings: 0, purchases: 0,
  };
  const bioText =
    typeof user.bio === "object" ? user.bio?.[lang] || user.bio?.sw : user.bio;
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
              <p className="text-sm text-primary truncate">{user.email || "—"}</p>
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
              {lang === "sw" ? "Shughuli za Hivi Karibuni" : "Recent Activity"}
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
              <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="w-2 h-2 rounded-full bg-[#E8A33D] mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-primary">
                    {typeof activity.title === "object" ? activity.title[lang] : activity.title}
                  </p>
                  <p className="text-body-sm text-secondary truncate">
                    {typeof activity.description === "object" ? activity.description[lang] : activity.description}
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
// EDIT PROFILE TAB — hakuna mabadiliko
// ============================================================
function EditProfileTab({ user, lang }) {
  const initialBio = typeof user.bio === "object" ? user.bio?.[lang] || "" : user.bio || "";
  const initialLocation =
    typeof user.location === "object" ? user.location?.[lang] || "" : user.location || "";

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
        err?.data?.detail || firstFieldError || err?.message ||
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
              <input type="file" accept="image/*" hidden onChange={handleAvatarChange} />
            </label>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-primary">
              {lang === "sw" ? "Badilisha Picha" : "Change Picture"}
            </p>
            <p className="text-body-sm text-secondary mt-1">
              {lang === "sw" ? "JPG, PNG au GIF. Kiwango cha juu 2MB." : "JPG, PNG or GIF. Max 2MB."}
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
              {lang === "sw" ? "Barua pepe haiwezi kubadilishwa" : "Email cannot be changed"}
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
              placeholder={lang === "sw" ? "Andika kuhusu wewe mwenyewe..." : "Write about yourself..."}
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
// SECURITY TAB — sasa ina 2FA + Delete Account
// ============================================================
function SecurityTab({ lang, user }) {
  const navigate = useNavigate();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ current: "", new: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // ⬇️ 2FA state (mock — kwa sasa)
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(null); // "enable" | "disable" | null

  // ⬇️ Delete Account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.current || !form.new || !form.confirm) {
      setError(lang === "sw" ? "Jaza sehemu zote" : "Fill all fields");
      return;
    }
    if (form.new.length < 6) {
      setError(lang === "sw" ? "Nenosiri lazima liwe na herufi 6 au zaidi" : "Password must be at least 6 characters");
      return;
    }
    if (form.new !== form.confirm) {
      setError(lang === "sw" ? "Nenosiri hazifanani" : "Passwords don't match");
      return;
    }

    setSaving(true);
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
        err?.data?.detail || firstFieldError || err?.message ||
          (lang === "sw" ? "Imeshindwa kubadilisha nenosiri" : "Failed to change password")
      );
      return;
    }

    setSaved(true);
    setForm({ current: "", new: "", confirm: "" });
    setTimeout(() => setSaved(false), 3000);
  };

  // ============================================================
  // 2FA HANDLERS — mock (kwa sasa)
  // ============================================================
  const handleEnable2FA = () => {
    setTwoFAEnabled(true);
    // Badilisha modal kuwa "done" — inaonyesha backup codes
    setShow2FAModal("done");
    // TODO: Ita `authApi.enable2FA()` baada ya backend
  };

  const handleDisable2FA = () => {
    setTwoFAEnabled(false);
    setShow2FAModal(null);
    // TODO: Ita `authApi.disable2FA({ password })` baada ya backend
  };

  // ============================================================
  // DELETE ACCOUNT HANDLER — API halisi
  // ============================================================
  const handleDeleteAccount = async (reason) => {
    setDeleting(true);
    const res = await deleteAccountAsync(reason);
    setDeleting(false);

    if (res.ok) {
      navigate("/");
    } else {
      alert(
        res.error?.message ||
          (lang === "sw" ? "Imeshindwa kufuta akaunti" : "Failed to delete account")
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* CHANGE PASSWORD */}
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
            className="w-full px-6 py-2.5 bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] rounded-lg font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {lang === "sw" ? "Inabadilisha..." : "Changing..."}
              </>
            ) : (
              lang === "sw" ? "Badilisha Nenosiri" : "Change Password"
            )}
          </button>
        </div>
      </form>

      {/* 2FA */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex flex-col items-center text-center gap-2">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: twoFAEnabled ? `${COLORS.green}15` : `${COLORS.rust}15` }}
          >
            <Shield size={18} color={twoFAEnabled ? COLORS.green : COLORS.rust} />
          </div>
          <div>
            <h3 className="h-card flex items-center gap-1.5 justify-center">
              {lang === "sw" ? "Uthibitishaji wa Hatua Mbili" : "Two-Factor Authentication"}
              <span
                style={{
                  background: twoFAEnabled ? `${COLORS.green}20` : `${COLORS.rust}20`,
                  color: twoFAEnabled ? COLORS.green : COLORS.rust,
                }}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              >
                {twoFAEnabled
                  ? (lang === "sw" ? "IMEWASHWA" : "ENABLED")
                  : (lang === "sw" ? "IMEZIMWA" : "DISABLED")}
              </span>
            </h3>
            <p className="text-body-sm text-secondary mt-0.5">
              {lang === "sw"
                ? "Ongeza usalama kwa akaunti yako kwa app ya authenticator"
                : "Add extra security using an authenticator app"}
            </p>
          </div>
          {twoFAEnabled ? (
            <button
              onClick={() => setShow2FAModal("disable")}
              className="text-sm font-semibold text-[#C1502E] hover:underline"
            >
              {lang === "sw" ? "Zima 2FA" : "Disable 2FA"}
            </button>
          ) : (
            <button
              onClick={() => setShow2FAModal("enable")}
              className="text-sm font-semibold text-[#2F6D4F] hover:underline"
            >
              {lang === "sw" ? "Washa 2FA" : "Enable 2FA"}
            </button>
          )}
        </div>
      </div>

      {/* ACTIVE SESSIONS */}
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

      {/* DANGER ZONE */}
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
                  ? "Hii itafuta akaunti yako na taarifa zote kabisa"
                  : "This will permanently delete your account and all data"}
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 border border-[#C1502E] text-[#C1502E] rounded-lg text-sm font-medium hover:bg-[#C1502E]/5 transition-colors flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              {lang === "sw" ? "Futa Akaunti" : "Delete Account"}
            </button>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {show2FAModal && show2FAModal !== "done" && (
        <TwoFactorModal
          mode={show2FAModal}
          lang={lang}
          onClose={() => setShow2FAModal(null)}
          onEnable={handleEnable2FA}
          onDisable={handleDisable2FA}
        />
      )}
      {show2FAModal === "done" && (
        <TwoFactorModal
          mode="enable"
          lang={lang}
          onClose={() => setShow2FAModal(null)}
          onEnable={() => {}}
          onDisable={() => {}}
        />
      )}

      {showDeleteModal && (
        <DeleteAccountModal
          lang={lang}
          deleting={deleting}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteAccount}
        />
      )}
    </div>
  );
}

// ============================================================
// NOTIFICATIONS TAB — hakuna mabadiliko
// ============================================================
function NotificationsTab({ lang }) {
  const [settings, setSettings] = useState({
    email_deals: true, email_messages: true, email_promotions: false, email_newsletter: true,
    sms_deals: true, sms_messages: false, sms_promotions: false,
    push_deals: true, push_messages: true, push_promotions: false,
  });

  const toggle = (key) => setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

  const Toggle = ({ checked, onChange }) => (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? "bg-[#E8A33D]" : "bg-gray-200"}`}
      role="switch"
      aria-checked={checked}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
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
          <h3 className="font-semibold text-primary mb-4 text-center">{section.title}</h3>
          <div className="space-y-3">
            {section.items.map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-sm text-secondary">{item.label}</span>
                <Toggle checked={settings[item.key]} onChange={() => toggle(item.key)} />
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
// PREFERENCES TAB — hakuna mabadiliko
// ============================================================
function PreferencesTab({ lang, setLang }) {
  const [prefs, setPrefs] = useState({
    language: lang, currency: "TZS", region: "Dar es Salaam",
    showPhone: true, showEmail: false,
  });

  const handleLanguageChange = (value) => {
    setPrefs({ ...prefs, language: value });
    if (setLang) setLang(value);
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#E8A33D] text-center"
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#E8A33D] text-center"
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#E8A33D] text-center"
            >
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
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
                {lang === "sw" ? "Watumiaji wengine wanaweza kuona namba yako" : "Other users can see your phone number"}
              </p>
            </div>
            <button
              onClick={() => setPrefs({ ...prefs, showPhone: !prefs.showPhone })}
              className={`relative w-11 h-6 rounded-full transition-colors ${prefs.showPhone ? "bg-[#E8A33D]" : "bg-gray-200"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${prefs.showPhone ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary">
                {lang === "sw" ? "Onyesha Barua Pepe" : "Show Email"}
              </p>
              <p className="text-body-sm text-secondary mt-0.5">
                {lang === "sw" ? "Watumiaji wengine wanaweza kuona barua pepe yako" : "Other users can see your email"}
              </p>
            </div>
            <button
              onClick={() => setPrefs({ ...prefs, showEmail: !prefs.showEmail })}
              className={`relative w-11 h-6 rounded-full transition-colors ${prefs.showEmail ? "bg-[#E8A33D]" : "bg-gray-200"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${prefs.showEmail ? "translate-x-5" : "translate-x-0"}`} />
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
  const { user, isLoading } = useAuth();
  const { lang, setLang } = useLanguage();
  const navigate = useNavigate();

  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(id);
  }, []);

  const [activeTab, setActiveTab] = useState("overview");

  const [stats, setStats] = useState({
    listings: 0, saved: 0, deals: 0, rating: 0, reviews: 0,
    inquiries: 0, offersSent: 0, viewings: 0, purchases: 0,
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
    await logoutAsync();
    navigate("/login");
  };

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

  const profileUser = { ...user, stats };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <section className="dark-surface bg-[#101A2E] text-white py-12 px-4">
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
                  viewMode === "seller" ? "bg-[#E8A33D] text-[#101A2E]" : "text-white/70 hover:text-white"
                }`}
              >
                <Tag size={14} />
                {lang === "sw" ? "Muuzaji" : "Seller"}
              </button>
              <button
                onClick={() => setViewMode("buyer")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  viewMode === "buyer" ? "bg-[#E8A33D] text-[#101A2E]" : "text-white/70 hover:text-white"
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
                    isActive ? "border-[#E8A33D] text-[#E8A33D]" : "border-transparent text-secondary hover:text-secondary"
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
          <OverviewTab user={profileUser} lang={lang} activities={[]} viewMode={viewMode} />
        )}
        {activeTab === "edit" && <EditProfileTab user={profileUser} lang={lang} />}
        {activeTab === "security" && <SecurityTab lang={lang} user={profileUser} />}
        {activeTab === "notifications" && <NotificationsTab lang={lang} />}
        {activeTab === "preferences" && <PreferencesTab lang={lang} setLang={setLang} />}
      </div>

      <Footer />
      <BottomNav />
    </div>
  );
}
