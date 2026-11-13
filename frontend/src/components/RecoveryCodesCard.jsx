// ============================================================
// RecoveryCodesCard.jsx  →  src/components/
// Paneli ya recovery codes ndani ya TwoFactorCard (2FA ikiwa ON).
//
//  • codes zipo (zimetoka verify au regenerate) → zionyeshe MARA MOJA:
//    nakili / pakua .txt / thibitisha kuhifadhi → "Nimemaliza" zinafutwa.
//  • codes hazipo → fomu ya kuzitengeneza upya. Backend inahitaji code ya
//    SASA ya authenticator: POST /auth/2fa/recovery-codes/ { code }.
//    Codes za zamani zinaacha kufanya kazi.
// ============================================================
import React, { useState } from "react";
import { KeyRound, Copy, Download, Loader2, Check, AlertTriangle } from "lucide-react";
import { COLORS } from "../pages/dashboard/components/shared";
import { securityApi } from "../api/security.js";
import { useConfirm } from "./ConfirmDialog.jsx";

const errMsg = (err, fallback) => err?.data?.detail || err?.message || fallback;

const normalizeCodes = (res) => {
  const raw = Array.isArray(res)
    ? res
    : res?.recovery_codes || res?.codes || res?.data?.recovery_codes || [];
  return raw.map((c) => (typeof c === "string" ? c : c?.code)).filter(Boolean);
};

export default function RecoveryCodesCard({ lang, codes, onCodes, remaining = null }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const confirm = useConfirm();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const hasCodes = Array.isArray(codes) && codes.length > 0;

  const regenerate = async () => {
    if (busy || code.length !== 6) return;
    const ok = await confirm({
      title: t("Tengeneza recovery codes mpya?", "Generate new recovery codes?"),
      description: t(
        "Codes za zamani zitaacha kufanya kazi mara moja. Utaziona mpya mara moja tu.",
        "Your old codes stop working immediately. You'll see the new ones only once."
      ),
      confirmLabel: t("Tengeneza", "Generate"),
    });
    if (!ok) return;
    setBusy(true);
    setError("");
    try {
      const res = await securityApi.twoFactorRecoveryCodes({ code });
      const list = normalizeCodes(res);
      if (list.length === 0) throw new Error(t("Seva haikurudisha codes.", "The server returned no codes."));
      setSaved(false);
      setCopied(false);
      setCode("");
      onCodes(list);
    } catch (err) {
      setError(errMsg(err, t("Msimbo si sahihi au imeshindwa.", "Invalid code or request failed.")));
    } finally {
      setBusy(false);
    }
  };

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError(t("Imeshindwa kunakili. Zinakili kwa mkono.", "Couldn't copy. Please copy them manually."));
    }
  };

  const downloadTxt = () => {
    const header = `SokoMkononi - 2FA recovery codes\n${new Date().toISOString().slice(0, 10)}\n\n`;
    const url = URL.createObjectURL(new Blob([header + codes.join("\n") + "\n"], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "sokomkononi-recovery-codes.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-lg border p-3" style={{ borderColor: COLORS.sandLine }}>
      <div className="flex items-center gap-2 mb-1.5">
        <KeyRound size={14} color={COLORS.gold} />
        <p className="text-xs font-bold text-primary">
          {t("Misimbo ya Akiba (Recovery Codes)", "Recovery Codes")}
        </p>
      </div>

      {error && (
        <p role="alert" className="text-[11px] px-2.5 py-1.5 rounded-lg mb-2"
           style={{ background: "rgba(193,80,46,0.1)", color: COLORS.rust }}>
          {error}
        </p>
      )}

      {hasCodes ? (
        <>
          <div className="flex items-start gap-2 rounded-lg px-2.5 py-2 mb-2"
               style={{ background: "rgba(254,164,6,0.12)" }}>
            <AlertTriangle size={13} color={COLORS.gold} className="shrink-0 mt-0.5" />
            <p className="text-[11px] text-primary">
              {t("Hifadhi sasa. Kila code inatumika mara moja, na hazitaonyeshwa tena.",
                 "Save them now. Each code works once, and they won't be shown again.")}
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-1.5 mb-2">
            {codes.map((c) => (
              <li key={c} className="font-mono text-[11px] text-center bg-[#F5F3EC] rounded-md py-1.5 select-all">{c}</li>
            ))}
          </ul>
          <div className="flex gap-2 mb-2">
            <button type="button" onClick={copyAll}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-secondary">
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? t("Zimenakiliwa", "Copied") : t("Nakili", "Copy")}
            </button>
            <button type="button" onClick={downloadTxt}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-secondary">
              <Download size={12} />
              {t("Pakua .txt", "Download .txt")}
            </button>
          </div>
          <label className="flex items-start gap-2 text-[11px] text-primary mb-2 cursor-pointer">
            <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="mt-0.5" />
            {t("Nimehifadhi codes hizi mahali salama.", "I've saved these codes somewhere safe.")}
          </label>
          <button type="button" disabled={!saved}
            onClick={() => { onCodes(null); setSaved(false); }}
            style={{ background: saved ? COLORS.green : COLORS.sandLine, color: saved ? "white" : "var(--text-muted)" }}
            className="w-full py-2 rounded-lg text-xs font-semibold disabled:cursor-not-allowed">
            {t("Nimemaliza", "Done")}
          </button>
        </>
      ) : (
        <>
          {remaining != null && (
            <p className="text-[11px] font-semibold mb-1.5"
               style={{ color: remaining <= 2 ? COLORS.rust : "var(--text-secondary)" }}>
              {t(`Codes zilizobaki: ${remaining}`, `Codes remaining: ${remaining}`)}
              {remaining <= 2 ? t(" — tengeneza mpya.", " — generate new ones.") : ""}
            </p>
          )}
          <p className="text-[11px] text-secondary mb-2">
            {t("Zimepotea au zimeisha? Tengeneza mpya kwa kuweka msimbo wa sasa wa authenticator. Za zamani zitaacha kufanya kazi.",
               "Lost or used them up? Generate new ones with your current authenticator code. Old ones stop working.")}
          </p>
          <input value={code} inputMode="numeric" maxLength={6}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder={t("Msimbo wa 2FA", "2FA code")}
            className="w-full border rounded-lg px-3 py-2 text-center font-mono tracking-widest text-sm mb-2"
            style={{ borderColor: COLORS.sandLine }} />
          <button type="button" onClick={regenerate} disabled={busy || code.length !== 6}
            style={{ background: COLORS.gold, color: COLORS.night }}
            className="w-full py-2 rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5">
            {busy && <Loader2 size={12} className="animate-spin" />}
            {t("Tengeneza Codes Mpya", "Generate New Codes")}
          </button>
        </>
      )}
    </div>
  );
}