// ============================================================
// TwoFactorCard.jsx — Enable/disable TOTP 2FA
// ============================================================
import React, { useState, useEffect } from "react";
import { Shield, Loader2, CheckCircle2, Copy, AlertTriangle } from "lucide-react";
import { COLORS } from "../pages/dashboard/components/shared";
import { securityApi } from "../api/security.js";

export default function TwoFactorCard({ lang }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const [status, setStatus] = useState(null); // { enabled: bool }
  const [loading, setLoading] = useState(true);
  const [setup, setSetup] = useState(null);   // { qr_url, secret, otpauth_url }
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [recovery, setRecovery] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await securityApi.twoFactorStatus();
        if (!cancelled) setStatus({ enabled: !!s?.enabled });
      } catch (err) {
        if (!cancelled) {
          setStatus({ enabled: false, unsupported: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleStartSetup = async () => {
    setBusy(true); setError("");
    try {
      const s = await securityApi.twoFactorSetup();
      setSetup(s);
    } catch (err) {
      setError(err?.message || t("Imeshindwa kuanza.", "Failed to start."));
    } finally { setBusy(false); }
  };

  const handleVerify = async () => {
    if (!code.trim()) return;
    setBusy(true); setError("");
    try {
      await securityApi.twoFactorVerify({ code: code.trim() });
      const r = await securityApi.twoFactorRecoveryCodes().catch(() => null);
      if (r) setRecovery(r?.codes || []);
      setStatus({ enabled: true });
      setSetup(null);
      setCode("");
    } catch (err) {
      setError(err?.message || t("Msimbo si sahihi.", "Invalid code."));
    } finally { setBusy(false); }
  };

  const handleDisable = async () => {
    if (!password.trim() || !code.trim()) {
      setError(t("Nenosiri na msimbo vinahitajika.", "Password and code required."));
      return;
    }
    setBusy(true); setError("");
    try {
      await securityApi.twoFactorDisable({ password, code: code.trim() });
      setStatus({ enabled: false });
      setCode(""); setPassword("");
    } catch (err) {
      setError(err?.message || t("Imeshindwa kuzima.", "Failed to disable."));
    } finally { setBusy(false); }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-5 text-center">
        <Loader2 size={20} className="animate-spin mx-auto text-muted" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center"
             style={{ background: `${COLORS.green}15` }}>
          <Shield size={18} color={COLORS.green} />
        </div>
        <div className="flex-1">
          <h3 className="h-card flex items-center gap-2">
            {t("Uthibitishaji wa Hatua Mbili", "Two-Factor Authentication")}
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: status?.enabled ? `${COLORS.green}20` : `${COLORS.rust}20`,
                    color: status?.enabled ? COLORS.green : COLORS.rust,
                  }}>
              {status?.enabled ? t("IMEWASHWA", "ON") : t("IMEZIMWA", "OFF")}
            </span>
          </h3>
          <p className="text-body-sm text-secondary mt-0.5">
            {t("Ongeza usalama kwa app ya authenticator",
               "Add security with an authenticator app")}
          </p>
        </div>
      </div>

      {error && (
        <div className="text-xs px-3 py-2 rounded-lg mb-3"
             style={{ background: "rgba(193,80,46,0.1)", color: COLORS.rust }}>
          <AlertTriangle size={12} className="inline mr-1" /> {error}
        </div>
      )}

      {/* Setup flow */}
      {!status?.enabled && !setup && (
        <button onClick={handleStartSetup} disabled={busy}
          style={{ background: COLORS.green, color: "white" }}
          className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50">
          {busy ? <Loader2 size={14} className="animate-spin inline" /> :
            t("Washa 2FA", "Enable 2FA")}
        </button>
      )}

      {setup && (
        <div className="space-y-3">
          <p className="text-xs text-secondary">
            {t("1. Changanua QR hii kwa app yako (Google Authenticator, Authy, 1Password):",
               "1. Scan this QR with your app (Google Authenticator, Authy, 1Password):")}
          </p>
          {setup.qr_url && (
            <img src={setup.qr_url} alt="QR"
                 className="w-48 h-48 mx-auto border rounded-lg"
                 style={{ borderColor: COLORS.sandLine }} />
          )}
          {setup.secret && (
            <div className="flex items-center gap-2 text-xs bg-gray-50 rounded-lg p-2">
              <span className="font-mono break-all flex-1">{setup.secret}</span>
              <button onClick={() => navigator.clipboard.writeText(setup.secret)}
                className="p-1.5 rounded hover:bg-gray-100"
                aria-label="Copy secret">
                <Copy size={12} />
              </button>
            </div>
          )}
          <p className="text-xs text-secondary">
            {t("2. Weka msimbo wa tarakimu 6 kutoka app yako:",
               "2. Enter the 6-digit code from your app:")}
          </p>
          <input value={code} inputMode="numeric" maxLength={6}
                 onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                 className="w-full border rounded-lg px-3 py-2 text-center font-mono tracking-widest"
                 style={{ borderColor: COLORS.sandLine }} />
          <div className="flex gap-2">
            <button onClick={() => { setSetup(null); setCode(""); setError(""); }}
              disabled={busy}
              className="flex-1 py-2.5 border rounded-lg text-sm font-semibold text-secondary disabled:opacity-50"
              style={{ borderColor: COLORS.sandLine }}>
              {t("Ghairi", "Cancel")}
            </button>
            <button onClick={handleVerify} disabled={busy || code.length !== 6}
              style={{ background: COLORS.green, color: "white" }}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50">
              {busy ? <Loader2 size={14} className="animate-spin inline" /> :
                t("Thibitisha", "Verify")}
            </button>
          </div>
        </div>
      )}

      {/* Enabled — disable flow */}
      {status?.enabled && (
        <div className="space-y-3">
          {recovery && recovery.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs font-bold text-amber-800 mb-1">
                {t("Hifadhi misimbo hii ya akiba mahali salama:", "Save these recovery codes:")}
              </p>
              <div className="grid grid-cols-2 gap-1 font-mono text-[11px]">
                {recovery.map((c, i) => <span key={i}>{c}</span>)}
              </div>
            </div>
          )}
          <p className="text-xs text-secondary">
            {t("Zima 2FA — weka nenosiri + msimbo wa sasa:",
               "Disable 2FA — enter password + current code:")}
          </p>
          <input type="password" value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 placeholder={t("Nenosiri", "Password")}
                 className="w-full border rounded-lg px-3 py-2 text-sm"
                 style={{ borderColor: COLORS.sandLine }} />
          <input value={code} inputMode="numeric" maxLength={6}
                 onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                 placeholder={t("Msimbo wa 2FA", "2FA code")}
                 className="w-full border rounded-lg px-3 py-2 text-center font-mono tracking-widest"
                 style={{ borderColor: COLORS.sandLine }} />
          <button onClick={handleDisable} disabled={busy || !password || code.length !== 6}
            className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
            style={{ background: COLORS.rust, color: "white" }}>
            {busy ? <Loader2 size={14} className="animate-spin inline" /> :
              t("Zima 2FA", "Disable 2FA")}
          </button>
        </div>
      )}
    </div>
  );
}
