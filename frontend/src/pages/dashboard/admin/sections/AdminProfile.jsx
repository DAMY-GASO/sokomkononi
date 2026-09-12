// ============================================================
// AdminProfile.jsx — SECTION ndani ya AdminDashboard
// Inaonyeshwa kama `case "profile"` kwenye renderSection().
// Backend bado haipo; inatumia AuthContext (mock localStorage).
// ============================================================
import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import { Camera, Trash2, Save, Lock, User, Mail, Phone } from "lucide-react";
import { COLORS, FONTS } from "../shared/constants.js";

// ============================================================
// AVATAR
// ============================================================
function Avatar({ user, size = "lg" }) {
  const sizeClass =
    size === "lg" ? "w-24 h-24 text-3xl" : "w-10 h-10 text-sm";
  const initial =
    user?.name?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    "A";

  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user?.name || "Admin"}
        className={`${sizeClass} rounded-full object-cover`}
      />
    );
  }
  return (
    <div
      className={`${sizeClass} rounded-full bg-[#E8A33D] flex items-center justify-center text-[#101A2E] font-bold`}
    >
      {initial}
    </div>
  );
}

// ============================================================
// ADMIN PROFILE SECTION
// ============================================================
export default function AdminProfile() {
  const { user, updateProfile, updatePassword, updateAvatar, removeAvatar } = useAuth();
  const { lang } = useLanguage();

  const fileInputRef = useRef(null);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      await updateAvatar(file);
      showToast("success", lang === "sw" ? "Picha imehifadhiwa!" : "Photo saved!");
    } catch (err) {
      showToast("error", err.message || (lang === "sw" ? "Imeshindikana" : "Failed"));
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAvatarRemove = async () => {
    if (!window.confirm(lang === "sw" ? "Ondoa picha?" : "Remove photo?")) return;
    setUploadingAvatar(true);
    try {
      await removeAvatar();
      showToast("success", lang === "sw" ? "Picha imeondolewa" : "Photo removed");
    } catch (err) {
      showToast("error", err.message || "Failed");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      showToast(
        "error",
        lang === "sw" ? "Jaza jina na email" : "Name and email required"
      );
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile({
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
      });
      showToast("success", lang === "sw" ? "Taarifa zimehifadhiwa!" : "Profile saved!");
    } catch (err) {
      showToast("error", err.message || "Failed");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      showToast("error", lang === "sw" ? "Jaza sehemu zote" : "Fill all fields");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showToast(
        "error",
        lang === "sw" ? "Nenosiri fupi (min 6)" : "Password too short (min 6)"
      );
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast("error", lang === "sw" ? "Nenosiri hazifanani" : "Passwords don't match");
      return;
    }
    setSavingPassword(true);
    try {
      await updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showToast("success", lang === "sw" ? "Nenosiri limebadilishwa!" : "Password changed!");
    } catch (err) {
      showToast("error", err.message || "Failed");
    } finally {
      setSavingPassword(false);
    }
  };

  const t = (sw, en) => (lang === "sw" ? sw : en);

  return (
    <div style={{ fontFamily: FONTS.body }}>
      {/* Title */}
      <div className="mb-6">
        <h1
          style={{ fontFamily: FONTS.display, color: COLORS.night }}
          className="text-2xl font-semibold"
        >
          {t("Wasifu wa Admin", "Admin Profile")}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t(
            "Badilisha taarifa zako, picha, na nenosiri.",
            "Update your info, photo, and password."
          )}
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
            toast.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* AVATAR CARD */}
      <div
        style={{ borderColor: COLORS.sandLine }}
        className="bg-white rounded-2xl border p-6 mb-4"
      >
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <Avatar user={user} />
          <div className="flex flex-col gap-2 flex-1">
            <p className="text-sm font-semibold text-gray-800">
              {t("Picha ya Wasifu", "Profile Photo")}
            </p>
            <p className="text-xs text-gray-500">
              {t(
                "JPG au PNG, max 1MB. Picha itaonekana kwenye header.",
                "JPG or PNG, max 1MB. Photo will appear on the header."
              )}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-[#101A2E] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                <Camera size={14} />
                {uploadingAvatar
                  ? t("Inapakia...", "Uploading...")
                  : t("Badilisha Picha", "Change Photo")}
              </button>
              {user?.avatarUrl && (
                <button
                  type="button"
                  onClick={handleAvatarRemove}
                  disabled={uploadingAvatar}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  <Trash2 size={14} />
                  {t("Ondoa", "Remove")}
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* PROFILE INFO */}
      <form
        onSubmit={handleProfileSubmit}
        style={{ borderColor: COLORS.sandLine }}
        className="bg-white rounded-2xl border p-6 mb-4"
      >
        <h2 style={{ color: COLORS.night }} className="text-sm font-semibold mb-4">
          {t("Taarifa za Msingi", "Basic Info")}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
              <User size={12} />
              {t("Jina Kamili", "Full Name")}
            </span>
            <input
              type="text"
              value={profileForm.name}
              onChange={(e) =>
                setProfileForm({ ...profileForm, name: e.target.value })
              }
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#E8A33D]"
              placeholder={t("Jina lako", "Your name")}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
              <Mail size={12} />
              {t("Barua Pepe", "Email")}
            </span>
            <input
              type="email"
              value={profileForm.email}
              onChange={(e) =>
                setProfileForm({ ...profileForm, email: e.target.value })
              }
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#E8A33D]"
              placeholder="admin@sokomkononi.co.tz"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
              <Phone size={12} />
              {t("Namba ya Simu", "Phone")}
            </span>
            <input
              type="tel"
              value={profileForm.phone}
              onChange={(e) =>
                setProfileForm({ ...profileForm, phone: e.target.value })
              }
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#E8A33D]"
              placeholder="+255 700 000 000"
            />
          </label>
        </div>

        <div className="flex justify-end mt-5">
          <button
            type="submit"
            disabled={savingProfile}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-lg bg-[#E8A33D] text-[#101A2E] hover:bg-[#B87A1F] disabled:opacity-50 transition-colors"
          >
            <Save size={14} />
            {savingProfile
              ? t("Inahifadhi...", "Saving...")
              : t("Hifadhi Mabadiliko", "Save Changes")}
          </button>
        </div>
      </form>

      {/* PASSWORD */}
      <form
        onSubmit={handlePasswordSubmit}
        style={{ borderColor: COLORS.sandLine }}
        className="bg-white rounded-2xl border p-6"
      >
        <h2
          style={{ color: COLORS.night }}
          className="text-sm font-semibold mb-4 flex items-center gap-2"
        >
          <Lock size={14} />
          {t("Badilisha Nenosiri", "Change Password")}
        </h2>

        <div className="grid grid-cols-1 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-gray-500">
              {t("Nenosiri la Sasa", "Current Password")}
            </span>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
              }
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#E8A33D]"
              autoComplete="current-password"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-gray-500">
              {t("Nenosiri Jipya", "New Password")}
            </span>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, newPassword: e.target.value })
              }
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#E8A33D]"
              autoComplete="new-password"
            />
            <span className="text-[10px] text-gray-400">
              {t("Angalau herufi 6", "At least 6 characters")}
            </span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-gray-500">
              {t("Thibitisha Nenosiri Jipya", "Confirm New Password")}
            </span>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
              }
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#E8A33D]"
              autoComplete="new-password"
            />
          </label>
        </div>

        <div className="flex justify-end mt-5">
          <button
            type="submit"
            disabled={savingPassword}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-lg bg-[#101A2E] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <Lock size={14} />
            {savingPassword
              ? t("Inabadilisha...", "Changing...")
              : t("Badilisha Nenosiri", "Change Password")}
          </button>
        </div>
      </form>
    </div>
  );
}
