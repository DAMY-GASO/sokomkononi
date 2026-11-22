// ============================================================
// AdminProfile.jsx — SECTION ndani ya AdminDashboard
// ============================================================
import React, { useState, useRef, useEffect } from "react";
import {
  useAuth,
  updateProfileAsync,
  updatePasswordAsync,
  updateAvatarAsync,
  removeAvatarAsync,
  logoutAsync,
} from "../../../../config/authStore.js";
import { ADMIN_LOGIN_PATH } from "../../../../config/adminPath.js";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import {
  Camera,
  Trash2,
  Save,
  Lock,
  User,
  Mail,
  Phone,
  Info,
} from "lucide-react";
import SectionHeader from "../shared/SectionHeader.jsx";
import TwoFactorCard from "../../../../components/TwoFactorCard.jsx";
import AdminSessionsCard from "../../../../components/AdminSessionsCard.jsx";
import RevealPasswordInput from "../../../../components/RevealPasswordInput.jsx";
import {
  useAdminTwoFactor,
  setAdminTwoFactorEnabled,
} from "../../../../config/adminTwoFactor.js";

// ============================================================
// Toa sababu halisi ya kosa kutoka backend (field errors za DRF),
// badala ya "Failed" tupu.
// ============================================================
function errorText(err, fallback) {
  // ApiError (api/client.js) tayari inatengeneza ujumbe sahihi kutoka
  // jibu la backend (field errors, detail, message) — tumia huo kwanza.
  if (err instanceof Error && err.message && !/^API error \d+$/.test(err.message)) {
    return err.status ? `${err.message} (${err.status})` : err.message;
  }
  const d = err?.data ?? err?.details ?? err?.response?.data;
  if (d && typeof d === "object") {
    const parts = [];
    for (const [k, v] of Object.entries(d)) {
      const msg = Array.isArray(v)
        ? v.map((x) => (typeof x === "object" ? JSON.stringify(x) : x)).join(", ")
        : typeof v === "object"
        ? JSON.stringify(v)
        : String(v);
      parts.push(["detail", "message", "error", "non_field_errors"].includes(k) ? msg : `${k}: ${msg}`);
    }
    if (parts.length) return parts.join(" • ");
  }
  return err?.message || fallback;
}

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
      className={`${sizeClass} rounded-full bg-gold on-gold flex items-center justify-center font-bold`}
    >
      {initial}
    </div>
  );
}

// ============================================================
// ADMIN PROFILE SECTION
// ============================================================
export default function AdminProfile() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const twofa = useAdminTwoFactor(user?.id ?? user?.email ?? "admin");

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
    setTimeout(() => setToast(null), type === "error" ? 7000 : 3000);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const res = await updateAvatarAsync(file);
    setUploadingAvatar(false);
    if (res.ok) {
      showToast(
        "success",
        lang === "sw" ? "Picha imehifadhiwa!" : "Photo saved!"
      );
    } else {
      showToast(
        "error",
        res.error?.message || (lang === "sw" ? "Imeshindikana" : "Failed")
      );
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAvatarRemove = async () => {
    if (!window.confirm(lang === "sw" ? "Ondoa picha?" : "Remove photo?"))
      return;
    setUploadingAvatar(true);
    const res = await removeAvatarAsync();
    setUploadingAvatar(false);
    if (res.ok) {
      showToast(
        "success",
        lang === "sw" ? "Picha imeondolewa" : "Photo removed"
      );
    } else {
      showToast("error", res.error?.message || "Failed");
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      showToast(
        "error",
        lang === "sw" ? "Jaza jina" : "Name required"
      );
      return;
    }
    // Tuma sehemu zilizobadilika tu (email haitumwi — ni readOnly)
    const payload = {};
    if (profileForm.name.trim() !== (user?.name || "")) {
      payload.name = profileForm.name.trim();
    }
    if (profileForm.phone.trim() !== (user?.phone || "")) {
      payload.phone = profileForm.phone.trim();
    }
    if (Object.keys(payload).length === 0) {
      showToast("success", lang === "sw" ? "Hakuna mabadiliko" : "No changes");
      return;
    }
    setSavingProfile(true);
    const res = await updateProfileAsync(payload);
    setSavingProfile(false);
    if (!res.ok) console.error("updateProfileAsync failed", payload, res.error);
    if (res.ok) {
      showToast(
        "success",
        lang === "sw" ? "Taarifa zimehifadhiwa!" : "Profile saved!"
      );
    } else {
      showToast("error", errorText(res.error, lang === "sw" ? "Imeshindikana kuhifadhi" : "Failed to save"));
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      showToast(
        "error",
        lang === "sw" ? "Jaza sehemu zote" : "Fill all fields"
      );
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      showToast(
        "error",
        lang === "sw"
          ? "Nenosiri fupi (min 8 herufi)"
          : "Password too short (min 8 chars)"
      );
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast(
        "error",
        lang === "sw" ? "Nenosiri hazifanani" : "Passwords don't match"
      );
      return;
    }
    setSavingPassword(true);
    const res = await updatePasswordAsync({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
    setSavingPassword(false);
    if (res.ok) {
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      showToast(
        "success",
        lang === "sw"
          ? "Nenosiri limebadilishwa! Utabadilishwa kwenda login..."
          : "Password changed! Redirecting to login..."
      );

      // Backend blacklists all outstanding tokens.
      // Force logout + redirect baada ya sekunde 2.
      setTimeout(async () => {
        await logoutAsync();
        window.location.href = ADMIN_LOGIN_PATH;
      }, 2000);
    } else {
      showToast("error", res.error?.message || "Failed");
    }
  };

  const t = (sw, en) => (lang === "sw" ? sw : en);

  return (
    <div>
      <SectionHeader
        title={t("Wasifu wa Msimamizi", "Admin Profile")}
        subtitle={t(
          "Badilisha taarifa zako, picha, nenosiri, usalama wa akaunti (2FA) na vifaa vilivyoingia.",
          "Update your info, photo, password, account security (2FA) and signed-in devices."
        )}
      />

      {toast && (
        <div
          className={`alert mb-4 font-medium ${
            toast.type === "success" ? "alert-success" : "alert-danger"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* AVATAR CARD */}
      <div
        className="bg-card border-hairline rounded-2xl border p-6 mb-4"
      >
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <Avatar user={user} />
          <div className="flex flex-col gap-2 flex-1">
            <p className="text-sm font-semibold text-primary">
              {t("Picha ya Wasifu", "Profile Photo")}
            </p>
            <p className="text-xs text-secondary">
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
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-night dark:bg-royal text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
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
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-danger/30 text-[color:rgb(var(--c-danger-text))] hover:bg-danger/10 disabled:opacity-50 transition-colors"
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
        className="bg-card border-hairline rounded-2xl border p-6 mb-4"
      >
        <h2
          style={{ color: "var(--text-primary)" }}
          className="text-sm font-semibold mb-4"
        >
          {t("Taarifa za Msingi", "Basic Info")}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-[11px] font-semibold text-secondary flex items-center gap-1">
              <User size={12} />
              {t("Jina Kamili", "Full Name")}
            </span>
            <input
              type="text"
              value={profileForm.name}
              onChange={(e) =>
                setProfileForm({ ...profileForm, name: e.target.value })
              }
              className="input"
              placeholder={t("Jina lako", "Your name")}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-secondary flex items-center gap-1">
              <Mail size={12} />
              {t("Barua Pepe", "Email")}
            </span>
            <input
              type="email"
              value={profileForm.email}
              readOnly
              disabled
              className="input cursor-not-allowed"
              placeholder="admin@sokomkononi.co.tz"
            />
            <span className="text-[10px] text-muted flex items-start gap-1">
              <Info size={10} className="shrink-0 mt-0.5" />
              <span>
                {t(
                  "Barua pepe haiwezi kubadilishwa.",
                  "Email cannot be changed."
                )}
              </span>
            </span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-secondary flex items-center gap-1">
              <Phone size={12} />
              {t("Namba ya Simu", "Phone")}
            </span>
            <input
              type="tel"
              value={profileForm.phone}
              onChange={(e) =>
                setProfileForm({ ...profileForm, phone: e.target.value })
              }
              className="input"
              placeholder="+255 700 000 000"
            />
          </label>
        </div>

        <div className="flex justify-end mt-5">
          <button
            type="submit"
            disabled={savingProfile}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-lg bg-gold on-gold hover:bg-flame disabled:opacity-50 transition-colors"
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
        className="bg-card border-hairline rounded-2xl border p-6"
      >
        <h2
          style={{ color: "var(--text-primary)" }}
          className="text-sm font-semibold mb-4 flex items-center gap-2"
        >
          <Lock size={14} />
          {t("Badilisha Nenosiri", "Change Password")}
        </h2>

        <div className="grid grid-cols-1 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-secondary">
              {t("Nenosiri la Sasa", "Current Password")}
            </span>
            <RevealPasswordInput
              lang={lang}
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  currentPassword: e.target.value,
                })
              }
              className="input"
              autoComplete="current-password"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-secondary">
              {t("Nenosiri Jipya", "New Password")}
            </span>
            <RevealPasswordInput
              lang={lang}
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  newPassword: e.target.value,
                })
              }
              className="input"
              autoComplete="new-password"
            />
            <span className="text-[10px] text-muted">
              {t("Angalau herufi 8", "At least 8 characters")}
            </span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-secondary">
              {t("Thibitisha Nenosiri Jipya", "Confirm New Password")}
            </span>
            <RevealPasswordInput
              lang={lang}
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  confirmPassword: e.target.value,
                })
              }
              className="input"
              autoComplete="new-password"
            />
          </label>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-5">
          <p className="text-[10px] text-muted flex items-start gap-1 max-w-md">
            <Info size={11} className="shrink-0 mt-0.5" />
            <span>
              {t(
                "Baada ya kubadilisha nenosiri, utatolewa kwenye akaunti na kutakiwa kuingia tena.",
                "After changing your password, you will be logged out and required to log in again."
              )}
            </span>
          </p>
          <button
            type="submit"
            disabled={savingPassword}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-lg bg-night dark:bg-royal text-white hover:opacity-90 disabled:opacity-50 transition-opacity shrink-0"
          >
            <Lock size={14} />
            {savingPassword
              ? t("Inabadilisha...", "Changing...")
              : t("Badilisha Nenosiri", "Change Password")}
          </button>
        </div>
      </form>

      {/* TWO-FACTOR AUTHENTICATION */}
      <div className="mt-4" id="two-factor">
        {twofa.status === "required" && (
          <div className="alert alert-danger mb-3 font-medium">
            {t(
              "Akaunti yako ya admin haina 2FA. Washa 2FA hapa chini ili uendelee kutumia dashboard.",
              "Your admin account has no 2FA. Turn it on below to keep using the dashboard."
            )}
          </div>
        )}
        <p className="text-[11px] text-muted flex items-start gap-1 mb-2">
          <Info size={11} className="shrink-0 mt-0.5" />
          <span>
            {t(
              "Akaunti za admin zinadhibiti pesa na data za mfumo mzima. Washa 2FA ili kuilinda.",
              "Admin accounts control money and platform-wide data. Turn on 2FA to protect it."
            )}
          </span>
        </p>
        <TwoFactorCard lang={lang} onStatusChange={setAdminTwoFactorEnabled} />
      </div>

      {/* ACTIVE SESSIONS */}
      <div className="mt-4">
        <AdminSessionsCard lang={lang} />
      </div>
    </div>
  );
}