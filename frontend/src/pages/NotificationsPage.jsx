// ============================================================
// NotificationsPage.jsx — B.12 FINAL
//
// Marekebisho:
//  ✅ Ongeza kitufe cha "Washa Push (hata tab imefungwa)"
//  ✅ Service Worker + VAPID integration
//  ✅ Kila kitu kingine kimebaki kama kilivyo
// ============================================================
import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Bell, Check, CheckCheck, Trash2, Rocket, MessageSquare,
  HandCoins, Shield, Clock, Info, TrendingUp, Megaphone,
  Receipt, BellRing, Volume2, VolumeX, Loader2, Smartphone,
} from "lucide-react";
import { COLORS } from "./dashboard/components/shared";
import {
  useNotifications,
  getLocalizedField,
  resolveNotificationRoute,
  resolveNotificationSide,
} from "../config/notificationsStore.js";
import { useDashboardSide } from "../config/dashboardSideStore.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useConfirm } from "../components/ConfirmDialog.jsx";
import { useToast } from "../components/Toast.jsx";
import { useNotificationAlerts } from "../config/notificationAlerts.js";
// ✅ MPYA
import {
  isPushSupported,
  getPushPermission,
  subscribeToPush,
  unsubscribeFromPush,
  getActiveSubscription,
} from "../config/pushNotifications.js";

// ============================================================
// NOTIFICATION TYPES — icon + color
// ============================================================
const GOLD_BG = "rgba(254,164,6,0.14)";
const GREEN_BG = "rgba(47,109,79,0.14)";
const RUST_BG = "rgba(193,80,46,0.14)";
const ROYAL_BG = "rgba(0,98,253,0.12)";

const NOTIFICATION_TYPES = {
  message: { icon: MessageSquare, color: COLORS.goldText, bg: GOLD_BG },
  deal: { icon: HandCoins, color: COLORS.successText, bg: GREEN_BG },
  boost: { icon: Rocket, color: COLORS.dangerText, bg: RUST_BG },
  leading: { icon: TrendingUp, color: COLORS.link, bg: ROYAL_BG },
  advertisement: { icon: Megaphone, color: COLORS.goldText, bg: GOLD_BG },
  listing_fee: { icon: Receipt, color: COLORS.successText, bg: GREEN_BG },
  verified: { icon: Shield, color: COLORS.successText, bg: GREEN_BG },
  reminder: { icon: Clock, color: COLORS.link, bg: ROYAL_BG },
  listing_released: { icon: BellRing, color: COLORS.dangerText, bg: RUST_BG },
  system: { icon: Info, color: COLORS.ink, bg: "rgb(var(--c-ink) / 0.08)" },
  "dispute.resolved": { icon: Shield, color: COLORS.successText, bg: GREEN_BG },
  "payment.proof_submitted": { icon: Receipt, color: COLORS.goldText, bg: GOLD_BG },
};

// ============================================================
// NOTIFICATION ITEM
// ============================================================
function NotificationItem({ notif, onMarkRead, onRemove, lang, side }) {
  const navigate = useNavigate();
  const location = useLocation();
  const config = NOTIFICATION_TYPES[notif.type] || NOTIFICATION_TYPES.system;
  const Icon = config.icon;

  const title = getLocalizedField(notif.title, lang);
  const body = getLocalizedField(notif.body, lang);

  const target = resolveNotificationRoute(notif, side);

  const when = notif.at ? new Date(notif.at) : null;
  const timeText = when && !Number.isNaN(when.getTime())
    ? when.toLocaleString(lang === "sw" ? "sw-TZ" : "en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const handleOpen = () => {
    if (!notif.read) onMarkRead(notif.id);
    const [tPath, tQuery] = String(target).split("?");
    if (!tQuery && tPath.replace(/\/+$/, "") === location.pathname.replace(/\/+$/, "")) {
      // Hakuna ukurasa maalum — usionekane kama imeharibika
      window.dispatchEvent(
        new CustomEvent("sokomkononi:toast", {
          detail: {
            type: "info",
            message: lang === "sw"
              ? "Taarifa hii haina ukurasa maalum."
              : "This notification has no specific page.",
          },
        })
      );
      return;
    }
    navigate(target);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleOpen();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleKey}
      aria-label={title || ""}
      style={{
        background: notif.read ? "rgb(var(--c-card))" : (config?.bg || "rgb(var(--c-page))"),
        borderColor: "rgb(var(--c-hairline))",
      }}
      className="rounded-xl border p-4 flex items-start gap-3 transition-all cursor-pointer hover:shadow-md hover:border-[#FEA406]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FEA406]"
    >
      <div
        style={{ background: config?.bg || "rgb(var(--c-page))" }}
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
      >
        <Icon size={18} style={{ color: config.color }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p
            style={{ color: "var(--text-primary)" }}
            className={`text-sm break-words ${
              notif.read ? "font-medium" : "font-semibold"
            }`}
          >
            {title}
          </p>
          {!notif.read && (
            <span
              style={{ background: COLORS.rust }}
              className="w-2 h-2 rounded-full shrink-0 mt-1.5"
              aria-label={lang === "sw" ? "Haijasomwa" : "Unread"}
            />
          )}
        </div>

        {body && (
          <p
            style={{ color: "var(--text-secondary)" }}
            className="text-xs mb-2 leading-relaxed whitespace-pre-wrap break-words"
          >
            {body}
          </p>
        )}

        {timeText && (
          <p
            style={{ color: "var(--text-muted)" }}
            className="text-[11px] font-medium"
          >
            {timeText}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1 shrink-0">
        {!notif.read && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(notif.id);
            }}
            className="p-1.5 text-muted hover:text-[color:rgb(var(--c-success-text))] rounded-lg hover:bg-success/10 transition-colors"
            aria-label={lang === "sw" ? "Weka kama imesomwa" : "Mark as read"}
          >
            <Check size={14} />
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(notif.id);
          }}
          className="p-1.5 text-muted hover:text-[color:rgb(var(--c-danger-text))] rounded-lg hover:bg-danger/10 transition-colors"
          aria-label={lang === "sw" ? "Ondoa" : "Remove"}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function NotificationsPage() {
  const { lang } = useLanguage();
  const side = useDashboardSide(); // "buyer" | "seller" | "admin"
  const confirm = useConfirm();
  const toast = useToast();
  const { notifications, unreadCount, markRead, markAllRead, remove, clearAll } =
    useNotifications("user");
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();
  const alerts = useNotificationAlerts();
  const [alertMsg, setAlertMsg] = useState("");

  // ✅ MPYA: Push state
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMsg, setPushMsg] = useState("");
  const [pushPermission, setPushPermission] = useState(getPushPermission());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isPushSupported()) return;
      const sub = await getActiveSubscription();
      if (!cancelled) {
        setPushEnabled(!!sub);
        setPushPermission(getPushPermission());
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleTogglePush = async () => {
    setPushMsg("");
    setPushBusy(true);
    try {
      if (pushEnabled) {
        const res = await unsubscribeFromPush();
        if (res.ok) {
          setPushEnabled(false);
          setPushMsg(lang === "sw" ? "Push imezimwa." : "Push disabled.");
        } else {
          setPushMsg(
            res.error || (lang === "sw" ? "Imeshindwa." : "Failed.")
          );
        }
      } else {
        const perm = getPushPermission();
        if (perm === "denied") {
          setPushMsg(
            lang === "sw"
              ? "Umezuia arifa kwenye kivinjari. Ruhusu kwenye mipangilio ya tovuti."
              : "Notifications are blocked in your browser. Allow them in site settings."
          );
          setPushBusy(false);
          return;
        }
        const res = await subscribeToPush();
        if (res.ok) {
          setPushEnabled(true);
          setPushPermission("granted");
          setPushMsg(
            lang === "sw"
              ? "Push imewashwa! Utapokea taarifa hata tab imefungwa."
              : "Push enabled! You'll get notifications even when the tab is closed."
          );
        } else {
          setPushMsg(
            res.error || (lang === "sw" ? "Imeshindwa." : "Failed.")
          );
        }
      }
    } finally {
      setPushBusy(false);
    }
  };

  // Chuja kwa side (buyer/seller/both)
  const sideFiltered = useMemo(() => {
    return notifications.filter((n) => {
      const nSide = resolveNotificationSide(n);
      return nSide === "both" || nSide === side;
    });
  }, [notifications, side]);

  const sideUnreadCount = sideFiltered.filter((n) => !n.read).length;

  // ── Arifa mpya: sauti / mtetemo / browser notification ──────
  const seenRef = useRef(null);
  useEffect(() => {
    const ids = new Set(sideFiltered.map((n) => String(n.id)));
    if (seenRef.current === null) {
      seenRef.current = ids;
      return;
    }
    const fresh = sideFiltered.filter(
      (n) => !n.read && !seenRef.current.has(String(n.id))
    );
    seenRef.current = ids;
    if (fresh.length === 0) return;
    const first = fresh[0];
    alerts.alert({
      title: getLocalizedField(first.title, lang) || "SokoMkononi",
      body:
        fresh.length > 1
          ? lang === "sw"
            ? `Na taarifa nyingine ${fresh.length - 1}`
            : `And ${fresh.length - 1} more`
          : getLocalizedField(first.body, lang),
      tag: `smk-notif-${first.id}`,
      onClick: () => navigate("/dashboard/notifications"),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sideFiltered]);

  const handleToggleBrowser = async () => {
    setAlertMsg("");
    if (alerts.browserOn) {
      alerts.disableBrowser();
      return;
    }
    const p = await alerts.enableBrowser();
    if (p === "denied") {
      setAlertMsg(
        lang === "sw"
          ? "Umezuia arifa kwenye kivinjari. Ziruhusu kwenye mipangilio ya tovuti (kitufe cha kufuli kando ya anwani)."
          : "Notifications are blocked in your browser. Allow them in site settings (lock icon next to the address)."
      );
    } else if (p === "unsupported") {
      setAlertMsg(
        lang === "sw"
          ? "Kivinjari chako hakiungi mkono arifa."
          : "Your browser does not support notifications."
      );
    }
  };
  const filtered =
    filter === "unread"
      ? sideFiltered.filter((n) => !n.read)
      : sideFiltered;

  const handleMarkRead = async (id) => {
    const res = await markRead(id);
    if (res && res.ok === false)
      toast.error(lang === "sw" ? "Imeshindwa kusasisha" : "Failed to update");
  };
  const handleMarkAllRead = async () => {
    const res = await markAllRead();
    if (res?.ok) toast.success(lang === "sw" ? "Zote zimesomwa" : "All marked as read");
    else toast.error(lang === "sw" ? "Imeshindwa kuweka zote kama zimesomwa" : "Failed to mark all read");
  };
  const handleRemove = async (id) => {
    const res = await remove(id);
    if (res && res.ok === false)
      toast.error(
        lang === "sw"
          ? "Imeondolewa kwenye kifaa hiki tu — seva haikujibu."
          : "Removed on this device only — the server didn't respond."
      );
  };

  const handleDeleteAll = async () => {
    const ok = await confirm({
      title: lang === "sw" ? "Futa taarifa zote?" : "Delete all notifications?",
      description: lang === "sw"
        ? "Hatua hii haiwezi kurudishwa."
        : "This action cannot be undone.",
      confirmLabel: lang === "sw" ? "Futa Zote" : "Delete All",
      danger: true,
    });
    if (!ok) return;
    const res = await clearAll();
    if (!res?.ok) toast.error(res?.error?.message || (lang === "sw" ? "Imeshindwa kufuta" : "Failed to delete"));
    else if (res.soft)
      toast.error(
        lang === "sw"
          ? "Zimefichwa kwenye kifaa hiki tu — seva haikujibu."
          : "Hidden on this device only — the server didn't respond."
      );
    else toast.success(lang === "sw" ? "Zimefutwa" : "Deleted");
  };

  return (
    <div
      style={{ minHeight: "100%" }}
      className="bg-page w-full p-4 sm:p-6"
    >
      <div className="max-w-3xl mx-auto">
        {/* HEADER */}
        <div className="mb-5 text-center">
          <div className="flex items-center justify-center gap-3 mb-1">
            <h1
              style={{ color: "var(--text-primary)" }}
              className="text-2xl sm:text-3xl font-semibold"
            >
              {lang === "sw" ? "Taarifa" : "Notifications"}
            </h1>
            {sideUnreadCount > 0 && (
              <span
                style={{ background: COLORS.rust, color: "white" }}
                className="text-xs font-bold px-2.5 py-1 rounded-full"
              >
                {sideUnreadCount}
              </span>
            )}
          </div>
          <p
            style={{ color: "var(--text-secondary)" }}
            className="text-sm max-w-xl mx-auto"
          >
            {lang === "sw"
              ? "Taarifa za miamala, ujumbe, na mabadiliko kwenye akaunti yako."
              : "Notifications about transactions, messages, and account changes."}
          </p>
        </div>

        {/* ARIFA: kivinjari + sauti + push */}
        <div className="flex flex-col items-center gap-2 mb-4">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {/* ✅ MPYA: Push button */}
            {isPushSupported() && (
              <button
                type="button"
                onClick={handleTogglePush}
                disabled={pushBusy}
                aria-pressed={pushEnabled}
                style={{
                  borderColor: "rgb(var(--c-hairline))",
                  color: pushEnabled ? COLORS.successText : "var(--text-primary)",
                }}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border bg-card disabled:opacity-50"
                title={
                  lang === "sw"
                    ? "Push inafanya kazi hata tab imefungwa"
                    : "Push works even when tab is closed"
                }
              >
                {pushBusy ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : pushEnabled ? (
                  <Smartphone size={13} />
                ) : (
                  <BellRing size={13} />
                )}
                {pushEnabled
                  ? lang === "sw"
                    ? "Push: ZIMEWASHWA"
                    : "Push: ON"
                  : lang === "sw"
                    ? "Washa Push (hata tab imefungwa)"
                    : "Enable Push (works when closed)"}
              </button>
            )}

            {/* Browser alerts */}
            {alerts.supported && (
              <button
                type="button"
                onClick={handleToggleBrowser}
                aria-pressed={alerts.browserOn}
                style={{
                  borderColor: "rgb(var(--c-hairline))",
                  color: alerts.browserOn ? COLORS.successText : "var(--text-primary)",
                }}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border bg-card"
              >
                <BellRing size={13} />
                {alerts.browserOn
                  ? lang === "sw" ? "Kivinjari: ZIMEWASHWA" : "Browser: ON"
                  : lang === "sw" ? "Washa kivinjari" : "Enable browser"}
              </button>
            )}

            {/* Sound toggle */}
            <button
              type="button"
              onClick={alerts.toggleSound}
              aria-pressed={alerts.soundOn}
              style={{
                borderColor: "rgb(var(--c-hairline))",
                color: alerts.soundOn ? COLORS.successText : "var(--text-primary)",
              }}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border bg-card"
            >
              {alerts.soundOn ? <Volume2 size={13} /> : <VolumeX size={13} />}
              {alerts.soundOn
                ? lang === "sw" ? "Sauti: ZIMEWASHWA" : "Sound: ON"
                : lang === "sw" ? "Sauti: ZIMEZIMWA" : "Sound: OFF"}
            </button>
          </div>

          {/* ✅ Push message */}
          {pushMsg && (
            <p
              style={{
                color:
                  pushMsg.includes("Imeshindwa") ||
                  pushMsg.includes("Failed") ||
                  pushMsg.includes("blocked") ||
                  pushMsg.includes("Umezuia")
                    ? COLORS.dangerText
                    : COLORS.successText,
              }}
              className="text-[11px] text-center max-w-md"
            >
              {pushMsg}
            </p>
          )}

          {alertMsg && (
            <p style={{ color: COLORS.dangerText }} className="text-[11px] text-center max-w-md">
              {alertMsg}
            </p>
          )}

          {pushEnabled && (
            <p style={{ color: "var(--text-muted)" }} className="text-[11px] text-center max-w-md">
              {lang === "sw"
                ? "Utapokea taarifa kwenye kifaa chako hata ukifunga kivinjari."
                : "You'll receive notifications on your device even when the browser is closed."}
            </p>
          )}

          {!pushEnabled && alerts.browserOn && (
            <p style={{ color: "var(--text-muted)" }} className="text-[11px] text-center max-w-md">
              {lang === "sw"
                ? "Arifa za kivinjari zinafanya kazi tu wakati SokoMkononi iko wazi."
                : "Browser alerts work only while SokoMkononi is open."}
            </p>
          )}
        </div>

        {/* FILTER + ACTIONS */}
        {sideFiltered.length > 0 && (
          <div className="flex flex-col items-center gap-3 mb-4">
            <div
              className="flex rounded-full border border-hairline bg-card p-1"
            >
              <button
                onClick={() => setFilter("all")}
                className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-colors ${filter === "all" ? "chip-active" : "text-primary"}`}
              >
                {lang === "sw" ? "Zote" : "All"} ({sideFiltered.length})
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-colors ${filter === "unread" ? "chip-active" : "text-primary"}`}
              >
                {lang === "sw" ? "Hazijasomwa" : "Unread"} ({sideUnreadCount})
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 flex-wrap">
              {sideUnreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                  style={{ color: COLORS.successText }}
                >
                  <CheckCheck size={14} />
                  {lang === "sw" ? "Soma zote" : "Mark all read"}
                </button>
              )}
              <button
                onClick={handleDeleteAll}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                style={{ color: COLORS.dangerText }}
              >
                <Trash2 size={14} />
                {lang === "sw" ? "Futa Zote" : "Delete All"}
              </button>
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {filtered.length === 0 ? (
          <div
            className="rounded-2xl border-2 border-dashed border-hairline p-12 text-center bg-card"
          >
            <Bell size={48} className="mx-auto text-muted mb-3" />
            <h3
              style={{ color: "var(--text-primary)" }}
              className="font-semibold mb-1"
            >
              {filter === "unread"
                ? lang === "sw"
                  ? "Hakuna taarifa mpya"
                  : "No new notifications"
                : lang === "sw"
                  ? "Hakuna taarifa"
                  : "No notifications"}
            </h3>
            <p
              style={{ color: "var(--text-secondary)" }}
              className="text-sm"
            >
              {filter === "unread"
                ? lang === "sw"
                  ? "Umesoma taarifa zote."
                  : "You've read all your notifications."
                : lang === "sw"
                  ? "Taarifa zako zitaonekana hapa."
                  : "Your notifications will appear here."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((n) => (
              <NotificationItem
                key={n.id}
                notif={n}
                onMarkRead={handleMarkRead}
                onRemove={handleRemove}
                lang={lang}
                side={side}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}