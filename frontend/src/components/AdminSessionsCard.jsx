// ============================================================
// AdminSessionsCard.jsx — vifaa vilivyoingia kwenye akaunti (admin Profile)
// Backend: GET /auth/sessions/?current_jti=…  ·  DELETE /auth/sessions/{id}/
//          POST /auth/sessions/revoke-others/
// ============================================================
import React, { useCallback, useEffect, useState } from "react";
import {
  Monitor,
  Smartphone,
  LogOut,
  Loader2,
  MonitorSmartphone,
  AlertTriangle,
} from "lucide-react";
import { COLORS } from "../pages/dashboard/components/shared";
import { securityApi, currentRefreshJti } from "../api/security.js";
import { getRefreshToken } from "../api/client.js";

const errMsg = (err, fallback) =>
  err?.data?.detail ||
  err?.data?.error?.message ||
  err?.message ||
  fallback;

export function isMobileDevice(name) {
  return /android|iphone|ipad|ios|mobile/i.test(String(name || ""));
}

export function timeAgo(iso, lang = "sw", now = Date.now()) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  if (!iso) return "—";
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "—";
  const sec = Math.max(0, Math.floor((now - ts) / 1000));
  if (sec < 60) return t("Sasa hivi", "Just now");
  const min = Math.floor(sec / 60);
  if (min < 60) return t(`Dakika ${min} zilizopita`, `${min} min ago`);
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return t(`Saa ${hrs} zilizopita`, `${hrs} h ago`);
  const days = Math.floor(hrs / 24);
  if (days < 30) return t(`Siku ${days} zilizopita`, `${days} d ago`);
  return new Date(ts).toLocaleDateString(lang === "sw" ? "sw-TZ" : "en-GB", {
    dateStyle: "medium",
  });
}

export default function AdminSessionsCard({ lang }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [busyAll, setBusyAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await securityApi.sessions({ currentJti: currentRefreshJti() });
      setSessions(Array.isArray(rows) ? rows : rows?.results || []);
    } catch (err) {
      setError(errMsg(err, t("Imeshindwa kupakia vifaa.", "Couldn't load devices.")));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const others = sessions.filter((s) => !s.is_current);

  const handleRevoke = async (s) => {
    if (busyId || busyAll) return;
    const label = s.device_name || t("kifaa hiki", "this device");
    if (
      !window.confirm(
        t(`Mtoe ${label} kwenye akaunti?`, `Sign out ${label}?`)
      )
    )
      return;
    setBusyId(s.id);
    setError("");
    setNotice("");
    try {
      await securityApi.revokeSession(s.id);
      setSessions((list) => list.filter((x) => x.id !== s.id));
      setNotice(t("Kifaa kimetolewa.", "Device signed out."));
    } catch (err) {
      setError(errMsg(err, t("Imeshindwa kukitoa kifaa.", "Couldn't sign out the device.")));
    } finally {
      setBusyId(null);
    }
  };

  const handleRevokeOthers = async () => {
    if (busyId || busyAll || !others.length) return;
    if (
      !window.confirm(
        t(
          "Toa vifaa vingine vyote? Kifaa unachotumia sasa kitabaki.",
          "Sign out all other devices? The device you're using stays signed in."
        )
      )
    )
      return;
    setBusyAll(true);
    setError("");
    setNotice("");
    try {
      const res = await securityApi.revokeAllOtherSessions({
        refresh: getRefreshToken(),
      });
      await load();
      const n = Number(res?.revoked) || others.length;
      setNotice(t(`Vifaa ${n} vimetolewa.`, `${n} device(s) signed out.`));
    } catch (err) {
      setError(
        errMsg(
          err,
          t("Imeshindwa kutoa vifaa vingine.", "Couldn't sign out other devices.")
        )
      );
    } finally {
      setBusyAll(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: `${COLORS.green}15` }}
        >
          <MonitorSmartphone size={18} color={COLORS.green} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="h-card">
            {t("Vifaa Vilivyoingia", "Signed-in Devices")}
          </h3>
          <p className="text-body-sm text-secondary mt-0.5">
            {t(
              "Mtoe kifaa usichokitambua mara moja.",
              "Sign out any device you don't recognise right away."
            )}
          </p>
        </div>
      </div>

      {error && (
        <div
          className="text-xs px-3 py-2 rounded-lg mb-3"
          style={{ background: "rgba(193,80,46,0.1)", color: COLORS.rust }}
        >
          <AlertTriangle size={12} className="inline mr-1" /> {error}
        </div>
      )}
      {notice && (
        <div
          className="text-xs px-3 py-2 rounded-lg mb-3"
          style={{ background: `${COLORS.green}15`, color: COLORS.green }}
        >
          {notice}
        </div>
      )}

      {loading ? (
        <div className="py-6 text-center">
          <Loader2 size={20} className="animate-spin mx-auto text-muted" />
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-xs text-secondary py-3">
          {t("Hakuna vifaa vilivyopatikana.", "No devices found.")}
        </p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((s) => {
            const Icon = isMobileDevice(s.device_name) ? Smartphone : Monitor;
            const busy = busyId === s.id;
            return (
              <li
                key={s.id}
                className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2.5"
              >
                <Icon size={18} className="text-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-primary truncate flex items-center gap-2">
                    {s.device_name || t("Kifaa kisichojulikana", "Unknown device")}
                    {s.is_current && (
                      <span
                        className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0"
                        style={{
                          background: `${COLORS.green}20`,
                          color: COLORS.green,
                        }}
                      >
                        {t("KIFAA HIKI", "THIS DEVICE")}
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] sm:text-xs text-secondary truncate">
                    {s.ip_address || "—"} · {t("Ilitumika", "Last active")}:{" "}
                    {timeAgo(s.last_seen, lang)}
                  </p>
                </div>
                {!s.is_current && (
                  <button
                    type="button"
                    onClick={() => handleRevoke(s)}
                    disabled={busy || busyAll}
                    className="p-2 text-muted hover:text-[#C1502E] rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    title={t("Toa kifaa", "Sign out device")}
                    aria-label={t("Toa kifaa", "Sign out device")}
                  >
                    {busy ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <LogOut size={14} />
                    )}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {others.length > 0 && (
        <button
          type="button"
          onClick={handleRevokeOthers}
          disabled={busyAll || !!busyId}
          className="w-full mt-3 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
          style={{ background: COLORS.rust, color: "white" }}
        >
          {busyAll ? (
            <Loader2 size={14} className="animate-spin inline" />
          ) : (
            t("Toa vifaa vingine vyote", "Sign out all other devices")
          )}
        </button>
      )}
    </div>
  );
}
